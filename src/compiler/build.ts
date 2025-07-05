import { LingualParser } from '../parser/grammar.js';
import { tokenize } from '../lexer/tokens.js';
import { CSharpTranspiler } from '../transpilers/csharp.js';
import { MacroInterpreter } from '../macros/interpreter.js';
import { FileHelpers } from '../utils/file-helpers.js';
import { logger, LogLevel } from '../utils/logger.js';
import { CompilerContext, CompilerOptions } from '../types/index.js';
import path from 'path';

export interface BuildOptions {
  inputFile: string;
  outputDir?: string;
  target?: 'csharp' | 'javascript' | 'typescript';
  verbose?: boolean;
  debug?: boolean;
  watch?: boolean;
  json?: boolean;
}

export interface BuildResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  outputFiles: string[];
  ast?: any;
}

export class BuildPipeline {
  private parser: LingualParser;
  private transpiler: CSharpTranspiler;
  private context: CompilerContext;

  constructor(options: CompilerOptions) {
    this.parser = new LingualParser();
    this.transpiler = new CSharpTranspiler();
    this.context = {
      options,
      macros: new Map(),
      errors: [],
      warnings: []
    };
  }

  /**
   * Main build method that orchestrates the entire pipeline
   */
  async build(options: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now();
    logger.info(`Starting build for ${options.inputFile}`);

    try {
      // Step 1: Read and parse source file
      logger.debug('Step 1: Reading source file');
      const sourceCode = await FileHelpers.readFile(options.inputFile);
      logger.debug(`Read ${sourceCode.length} characters`);

      // Step 2: Tokenize
      logger.debug('Step 2: Tokenizing');
      const tokens = tokenize(sourceCode);
      logger.debug(`Generated ${tokens.length} tokens`);

      // Step 3: Parse into AST
      logger.debug('Step 3: Parsing AST');
      this.parser.input = tokens;
      let ast: any;
      try {
        ast = this.parser.program();
        if (this.parser.errors.length > 0) {
          logger.error('Parser errors:', this.parser.errors);
          throw new Error('Parser failed: ' + this.parser.errors.map(e => e.message).join('; '));
        }
        if (!ast) {
          throw new Error('Parser returned null AST');
        }
        logger.debug('AST parsing completed');
        logger.debug('AST structure:', JSON.stringify(ast, null, 2));
        // Print the AST to the console for debugging
        console.log('DEBUG AST after parsing:', JSON.stringify(ast, null, 2));
        // Convert CST to AST format
        const cstToAst = this.convertCstToAst(ast);
        logger.debug('CST to AST conversion completed');
        ast = cstToAst;
      } catch (parseError) {
        logger.error('Parse error:', parseError);
        throw new Error(`Failed to parse source file: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }

      // Step 4: Process macros
      logger.debug('Step 4: Processing macros');
      const macroInterpreter = new MacroInterpreter(this.context);
      const processedAst = macroInterpreter.processProgram(ast);
      logger.debug('Macro processing completed');

      // Step 5: Transpile to target language
      logger.debug('Step 5: Transpiling');
      let transpiledCode: string;
      switch (options.target || 'csharp') {
        case 'csharp':
          transpiledCode = this.transpiler.transpile(processedAst);
          break;
        default:
          throw new Error(`Unsupported target language: ${options.target}`);
      }
      logger.debug('Transpilation completed');

      // Step 6: Write output files
      logger.debug('Step 6: Writing output files');
      const outputFiles = await this.writeOutputFiles(
        options.inputFile,
        transpiledCode,
        options.outputDir || './dist',
        options.target || 'csharp'
      );

      const buildTime = Date.now() - startTime;
      logger.success(`Build completed in ${buildTime}ms`);

      return {
        success: true,
        errors: this.context.errors.map(e => e.message),
        warnings: this.context.warnings.map(w => w.message),
        outputFiles,
        ast: options.json ? processedAst : undefined
      };

    } catch (error) {
      logger.error('Build failed:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: this.context.warnings.map(w => w.message),
        outputFiles: []
      };
    }
  }

  /**
   * Write transpiled code to output files
   */
  private async writeOutputFiles(
    inputFile: string,
    transpiledCode: string,
    outputDir: string,
    target: string
  ): Promise<string[]> {
    const outputFiles: string[] = [];

    // Ensure output directory exists
    await FileHelpers.ensureDir(outputDir);

    // Determine output file name
    const inputName = path.basename(inputFile, path.extname(inputFile));
    const extensions = {
      csharp: '.cs',
      javascript: '.js',
      typescript: '.ts'
    };
    const ext = extensions[target as keyof typeof extensions] || '.cs';
    const outputFile = path.join(outputDir, `${inputName}${ext}`);

    // Write the main output file
    await FileHelpers.writeFile(outputFile, transpiledCode);
    outputFiles.push(outputFile);

    // Generate additional files if needed (e.g., project files)
    if (target === 'csharp') {
      const projectFile = await this.generateCSharpProjectFile(outputDir, inputName);
      if (projectFile) {
        outputFiles.push(projectFile);
      }
    }

    return outputFiles;
  }

  /**
   * Generate C# project file
   */
  private async generateCSharpProjectFile(outputDir: string, projectName: string): Promise<string | null> {
    const projectFile = path.join(outputDir, `${projectName}.csproj`);
    const projectContent = `<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.Http" Version="8.0.0" />
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
  </ItemGroup>
</Project>`;

    await FileHelpers.writeFile(projectFile, projectContent);
    return projectFile;
  }

  /**
   * Watch mode - continuously rebuild on file changes
   */
  async watch(options: BuildOptions): Promise<void> {
    logger.info(`Starting watch mode for ${options.inputFile}`);
    
    // Initial build
    await this.build(options);

    // TODO: Implement file watching
    // This would use Node.js fs.watch or a library like chokidar
    logger.warn('Watch mode not yet implemented');
  }

  /**
   * Convert Chevrotain CST to AST format
   */
  private convertCstToAst(cst: any): any {
    // Convert the program CST to AST
    if (cst.children && cst.children.statement) {
      const statements = cst.children.statement.map((stmtCST: any) => 
        this.convertStatementCST(stmtCST)
      ).filter(Boolean);
      
      return {
        type: 'Program',
        body: statements
      };
    }
    
    return {
      type: 'Program',
      body: []
    };
  }

  /**
   * Convert a statement CST to AST
   */
  private convertStatementCST(stmtCST: any): any {
    if (!stmtCST.children) return null;
    
    // Check for function declaration
    if (stmtCST.children.functionDeclaration) {
      return this.convertFunctionDeclarationCST(stmtCST.children.functionDeclaration[0]);
    }
    
    // Check for variable declaration
    if (stmtCST.children.variableDeclaration) {
      return this.convertVariableDeclarationCST(stmtCST.children.variableDeclaration[0]);
    }
    
    // Check for expression statement
    if (stmtCST.children.expressionStatement) {
      return this.convertExpressionStatementCST(stmtCST.children.expressionStatement[0]);
    }
    
    // Check for return statement
    if (stmtCST.children.returnStatement) {
      return this.convertReturnStatementCST(stmtCST.children.returnStatement[0]);
    }
    
    return null;
  }

  /**
   * Convert function declaration CST to AST
   */
  private convertFunctionDeclarationCST(funcCST: any): any {
    if (!funcCST.children) return null;
    
    // Extract function name
    const nameToken = funcCST.children.Identifier?.[0];
    const name = nameToken?.image || 'unknown';
    
    // Extract parameters
    const parameters = this.extractParameters(funcCST);
    
    // Extract return type
    const returnType = this.extractReturnType(funcCST);
    
    // Extract function body
    const body = this.extractFunctionBody(funcCST);
    
    return {
      type: 'FunctionDeclaration',
      name: { type: 'Identifier', name },
      parameters,
      returnType,
      body
    };
  }

  /**
   * Extract parameters from function CST
   */
  private extractParameters(funcCST: any): any[] {
    const parameters: any[] = [];
    
    if (funcCST.children.parameterList) {
      const paramListCST = funcCST.children.parameterList[0];
      if (paramListCST.children && paramListCST.children.parameter) {
        for (const paramCST of paramListCST.children.parameter) {
          const paramName = paramCST.children.Identifier?.[0]?.image;
          const paramType = this.extractParameterType(paramCST);
          
          if (paramName) {
            parameters.push({
              type: 'Parameter',
              name: { type: 'Identifier', name: paramName },
              typeAnnotation: paramType
            });
          }
        }
      }
    }
    
    return parameters;
  }

  /**
   * Extract return type from function CST
   */
  private extractReturnType(funcCST: any): any {
    if (funcCST.children.typeAnnotation) {
      const typeCST = funcCST.children.typeAnnotation[0];
      return this.convertTypeAnnotationCST(typeCST);
    }
    return null;
  }

  /**
   * Extract function body from function CST
   */
  private extractFunctionBody(funcCST: any): any[] {
    const body: any[] = [];
    
    if (funcCST.children.statement) {
      for (const stmtCST of funcCST.children.statement) {
        const statement = this.convertStatementCST(stmtCST);
        if (statement) {
          body.push(statement);
        }
      }
    }
    
    return body;
  }

  /**
   * Convert variable declaration CST to AST
   */
  private convertVariableDeclarationCST(varCST: any): any {
    if (!varCST.children) return null;
    
    const name = varCST.children.Identifier?.[0]?.image;
    const typeAnnotation = this.extractVariableType(varCST);
    const initializer = this.extractVariableInitializer(varCST);
    
    if (name) {
      return {
        type: 'VariableDeclaration',
        name: { type: 'Identifier', name },
        typeAnnotation,
        initializer
      };
    }
    
    return null;
  }

  /**
   * Extract variable type annotation
   */
  private extractVariableType(varCST: any): any {
    if (varCST.children.typeAnnotation) {
      const typeCST = varCST.children.typeAnnotation[0];
      return this.convertTypeAnnotationCST(typeCST);
    }
    return null;
  }

  /**
   * Extract variable initializer
   */
  private extractVariableInitializer(varCST: any): any {
    if (varCST.children.expression) {
      const exprCST = varCST.children.expression[0];
      return this.convertExpressionCST(exprCST);
    }
    
    // Also check for assignment expressions
    if (varCST.children.assignmentExpression) {
      const assignCST = varCST.children.assignmentExpression[0];
      return this.convertAssignmentExpressionCST(assignCST);
    }
    
    return null;
  }

  /**
   * Convert assignment expression CST to AST
   */
  private convertAssignmentExpressionCST(assignCST: any): any {
    if (!assignCST.children) return null;
    
    const left = this.convertExpressionCST(assignCST.children.logicalOrExpression[0]);
    const right = assignCST.children.assignmentExpression?.[0] 
      ? this.convertAssignmentExpressionCST(assignCST.children.assignmentExpression[0])
      : null;
    
    if (assignCST.children.Assign && right) {
      return {
        type: 'AssignmentExpression',
        left,
        right
      };
    }
    
    return left;
  }

  /**
   * Convert expression statement CST to AST
   */
  private convertExpressionStatementCST(exprStmtCST: any): any {
    if (!exprStmtCST.children || !exprStmtCST.children.expression) return null;
    
    const expression = this.convertExpressionCST(exprStmtCST.children.expression[0]);
    
    return {
      type: 'ExpressionStatement',
      expression
    };
  }

  /**
   * Convert return statement CST to AST
   */
  private convertReturnStatementCST(returnCST: any): any {
    const expression = returnCST.children.expression?.[0] 
      ? this.convertExpressionCST(returnCST.children.expression[0])
      : null;
    
    return {
      type: 'ReturnStatement',
      expression
    };
  }

  /**
   * Convert expression CST to AST
   */
  private convertExpressionCST(exprCST: any): any {
    if (!exprCST.children) return null;
    
    // Handle different expression types - check from most specific to least specific
    if (exprCST.children.assignmentExpression) {
      return this.convertAssignmentExpressionCST(exprCST.children.assignmentExpression[0]);
    }
    
    if (exprCST.children.logicalOrExpression) {
      return this.convertLogicalOrExpressionCST(exprCST.children.logicalOrExpression[0]);
    }
    
    if (exprCST.children.logicalAndExpression) {
      return this.convertLogicalAndExpressionCST(exprCST.children.logicalAndExpression[0]);
    }
    
    if (exprCST.children.equalityExpression) {
      return this.convertEqualityExpressionCST(exprCST.children.equalityExpression[0]);
    }
    
    if (exprCST.children.relationalExpression) {
      return this.convertRelationalExpressionCST(exprCST.children.relationalExpression[0]);
    }
    
    if (exprCST.children.additiveExpression) {
      return this.convertAdditiveExpressionCST(exprCST.children.additiveExpression[0]);
    }
    
    if (exprCST.children.multiplicativeExpression) {
      return this.convertMultiplicativeExpressionCST(exprCST.children.multiplicativeExpression[0]);
    }
    
    if (exprCST.children.unaryExpression) {
      return this.convertUnaryExpressionCST(exprCST.children.unaryExpression[0]);
    }
    
    if (exprCST.children.postfixExpression) {
      return this.convertPostfixExpressionCST(exprCST.children.postfixExpression[0]);
    }
    
    if (exprCST.children.primaryExpression) {
      return this.convertPrimaryExpressionCST(exprCST.children.primaryExpression[0]);
    }
    
    if (exprCST.children.identifier) {
      const name = exprCST.children.identifier[0].children.Identifier[0].image;
      return { type: 'Identifier', name };
    }
    
    if (exprCST.children.literal) {
      const literalCST = exprCST.children.literal[0];
      const value = this.extractLiteralValue(literalCST);
      return { type: 'Literal', value };
    }
    
    return null;
  }

  /**
   * Convert logical OR expression CST to AST
   */
  private convertLogicalOrExpressionCST(logicalOrCST: any): any {
    if (!logicalOrCST.children) return null;
    
    let left = this.convertLogicalAndExpressionCST(logicalOrCST.children.logicalAndExpression[0]);
    
    // Handle multiple OR operations
    if (logicalOrCST.children.logicalAndExpression1) {
      const right = this.convertLogicalAndExpressionCST(logicalOrCST.children.logicalAndExpression1[0]);
      return {
        type: 'BinaryExpression',
        operator: '||',
        left,
        right
      };
    }
    
    return left;
  }

  /**
   * Convert logical AND expression CST to AST
   */
  private convertLogicalAndExpressionCST(logicalAndCST: any): any {
    if (!logicalAndCST.children) return null;
    
    let left = this.convertEqualityExpressionCST(logicalAndCST.children.equalityExpression[0]);
    
    // Handle multiple AND operations
    if (logicalAndCST.children.equalityExpression1) {
      const right = this.convertEqualityExpressionCST(logicalAndCST.children.equalityExpression1[0]);
      return {
        type: 'BinaryExpression',
        operator: '&&',
        left,
        right
      };
    }
    
    return left;
  }

  /**
   * Convert equality expression CST to AST
   */
  private convertEqualityExpressionCST(equalityCST: any): any {
    if (!equalityCST.children) return null;
    
    let left = this.convertRelationalExpressionCST(equalityCST.children.relationalExpression[0]);
    
    // Handle equality operators
    if (equalityCST.children.Equals && equalityCST.children.relationalExpression1) {
      const right = this.convertRelationalExpressionCST(equalityCST.children.relationalExpression1[0]);
      return {
        type: 'BinaryExpression',
        operator: '==',
        left,
        right
      };
    }
    
    if (equalityCST.children.NotEquals && equalityCST.children.relationalExpression1) {
      const right = this.convertRelationalExpressionCST(equalityCST.children.relationalExpression1[0]);
      return {
        type: 'BinaryExpression',
        operator: '!=',
        left,
        right
      };
    }
    
    return left;
  }

  /**
   * Convert relational expression CST to AST
   */
  private convertRelationalExpressionCST(relationalCST: any): any {
    if (!relationalCST.children) return null;
    
    let left = this.convertAdditiveExpressionCST(relationalCST.children.additiveExpression[0]);
    
    // Handle relational operators
    if (relationalCST.children.LessThan && relationalCST.children.additiveExpression1) {
      const right = this.convertAdditiveExpressionCST(relationalCST.children.additiveExpression1[0]);
      return {
        type: 'BinaryExpression',
        operator: '<',
        left,
        right
      };
    }
    
    if (relationalCST.children.GreaterThan && relationalCST.children.additiveExpression1) {
      const right = this.convertAdditiveExpressionCST(relationalCST.children.additiveExpression1[0]);
      return {
        type: 'BinaryExpression',
        operator: '>',
        left,
        right
      };
    }
    
    return left;
  }

  /**
   * Convert additive expression CST to AST (a + b, a - b)
   */
  private convertAdditiveExpressionCST(additiveCST: any): any {
    if (!additiveCST.children) return null;
    
    // Handle left side
    let left = null;
    if (additiveCST.children.multiplicativeExpression) {
      left = this.convertMultiplicativeExpressionCST(additiveCST.children.multiplicativeExpression[0]);
    } else if (additiveCST.children.unaryExpression) {
      left = this.convertUnaryExpressionCST(additiveCST.children.unaryExpression[0]);
    }
    
    // Handle operator and right side
    if (additiveCST.children.Plus && additiveCST.children.multiplicativeExpression1) {
      const right = this.convertMultiplicativeExpressionCST(additiveCST.children.multiplicativeExpression1[0]);
      return {
        type: 'BinaryExpression',
        operator: '+',
        left,
        right
      };
    }
    
    if (additiveCST.children.Minus && additiveCST.children.multiplicativeExpression1) {
      const right = this.convertMultiplicativeExpressionCST(additiveCST.children.multiplicativeExpression1[0]);
      return {
        type: 'BinaryExpression',
        operator: '-',
        left,
        right
      };
    }
    
    // Handle the case where we have multiple multiplicativeExpression nodes (like a + b)
    if (additiveCST.children.multiplicativeExpression && additiveCST.children.multiplicativeExpression.length > 1) {
      left = this.convertMultiplicativeExpressionCST(additiveCST.children.multiplicativeExpression[0]);
      const right = this.convertMultiplicativeExpressionCST(additiveCST.children.multiplicativeExpression[1]);
      
      // Check for operator
      if (additiveCST.children.Plus) {
        return {
          type: 'BinaryExpression',
          operator: '+',
          left,
          right
        };
      }
      
      if (additiveCST.children.Minus) {
        return {
          type: 'BinaryExpression',
          operator: '-',
          left,
          right
        };
      }
    }
    
    return left;
  }

  /**
   * Convert multiplicative expression CST to AST (a * b, a / b)
   */
  private convertMultiplicativeExpressionCST(multiplicativeCST: any): any {
    if (!multiplicativeCST.children) return null;
    
    // Handle left side
    let left = null;
    if (multiplicativeCST.children.unaryExpression) {
      left = this.convertUnaryExpressionCST(multiplicativeCST.children.unaryExpression[0]);
    }
    
    // Handle operator and right side
    if (multiplicativeCST.children.Multiply && multiplicativeCST.children.unaryExpression1) {
      const right = this.convertUnaryExpressionCST(multiplicativeCST.children.unaryExpression1[0]);
      return {
        type: 'BinaryExpression',
        operator: '*',
        left,
        right
      };
    }
    
    if (multiplicativeCST.children.Divide && multiplicativeCST.children.unaryExpression1) {
      const right = this.convertUnaryExpressionCST(multiplicativeCST.children.unaryExpression1[0]);
      return {
        type: 'BinaryExpression',
        operator: '/',
        left,
        right
      };
    }
    
    return left;
  }

  /**
   * Convert unary expression CST to AST
   */
  private convertUnaryExpressionCST(unaryCST: any): any {
    if (!unaryCST.children) return null;
    
    if (unaryCST.children.postfixExpression) {
      return this.convertPostfixExpressionCST(unaryCST.children.postfixExpression[0]);
    }
    
    if (unaryCST.children.prefixExpression) {
      return this.convertPrefixExpressionCST(unaryCST.children.prefixExpression[0]);
    }
    
    return null;
  }

  /**
   * Convert prefix expression CST to AST
   */
  private convertPrefixExpressionCST(prefixCST: any): any {
    if (!prefixCST.children) return null;
    
    const operand = this.convertUnaryExpressionCST(prefixCST.children.unaryExpression[0]);
    
    if (prefixCST.children.Plus) {
      return {
        type: 'UnaryExpression',
        operator: '+',
        operand
      };
    }
    
    if (prefixCST.children.Minus) {
      return {
        type: 'UnaryExpression',
        operator: '-',
        operand
      };
    }
    
    return operand;
  }

  /**
   * Convert postfix expression CST to AST
   */
  private convertPostfixExpressionCST(postfixCST: any): any {
    if (!postfixCST.children) return null;
    
    // Handle primary expression
    if (postfixCST.children.primaryExpression) {
      const primaryCST = postfixCST.children.primaryExpression[0];
      let base = this.convertPrimaryExpressionCST(primaryCST);
      
      // Handle call expressions (function calls) - check for LeftParen and RightParen
      if (postfixCST.children.LeftParen && postfixCST.children.RightParen) {
        // This is a function call
        const callee = base;
        const arguments_: any[] = [];
        
        // Extract arguments from argumentList
        if (postfixCST.children.argumentList?.[0]?.children.expression) {
          for (const argCST of postfixCST.children.argumentList[0].children.expression) {
            const arg = this.convertExpressionCST(argCST);
            if (arg) {
              arguments_.push(arg);
            }
          }
        }
        
        return {
          type: 'CallExpression',
          callee,
          arguments: arguments_
        };
      }
      
      return base;
    }
    
    return null;
  }

  /**
   * Convert primary expression CST to AST
   */
  private convertPrimaryExpressionCST(primaryCST: any): any {
    if (!primaryCST.children) return null;
    
    if (primaryCST.children.identifier) {
      const name = primaryCST.children.identifier[0].children.Identifier[0].image;
      return { type: 'Identifier', name };
    }
    
    if (primaryCST.children.literal) {
      const literalCST = primaryCST.children.literal[0];
      const value = this.extractLiteralValue(literalCST);
      return { type: 'Literal', value };
    }
    
    return null;
  }

  /**
   * Convert call expression CST to AST
   */
  private convertCallExpressionCST(callCST: any, base?: any): any {
    if (!callCST.children) return null;
    
    // Extract the function name (callee)
    let callee = base;
    if (!callee && callCST.children.primaryExpression) {
      callee = this.convertPrimaryExpressionCST(callCST.children.primaryExpression[0]);
    }
    
    // If we still don't have a callee, try to extract it from the identifier
    if (!callee && callCST.children.identifier) {
      const name = callCST.children.identifier[0].children.Identifier[0].image;
      callee = { type: 'Identifier', name };
    }
    
    // Extract arguments from the argument list
    const arguments_: any[] = [];
    if (callCST.children.argumentList) {
      const argListCST = callCST.children.argumentList[0];
      if (argListCST.children && argListCST.children.expression) {
        for (const argCST of argListCST.children.expression) {
          const arg = this.convertExpressionCST(argCST);
          if (arg) {
            arguments_.push(arg);
          }
        }
      }
    }
    
    return {
      type: 'CallExpression',
      callee,
      arguments: arguments_
    };
  }

  /**
   * Convert binary expression CST to AST
   */
  private convertBinaryExpressionCST(binaryCST: any): any {
    // This is a simplified version - you'll need to handle the full binary expression structure
    return null;
  }

  /**
   * Extract literal value
   */
  private extractLiteralValue(literalCST: any): any {
    if (literalCST.children.NumberLiteral) {
      return Number(literalCST.children.NumberLiteral[0].image);
    }
    if (literalCST.children.StringLiteral) {
      return literalCST.children.StringLiteral[0].image.slice(1, -1);
    }
    if (literalCST.children.BooleanLiteral) {
      return literalCST.children.BooleanLiteral[0].image === 'true';
    }
    return null;
  }

  /**
   * Convert type annotation CST to AST
   */
  private convertTypeAnnotationCST(typeCST: any): any {
    if (!typeCST.children) return null;
    
    let typeName = 'unknown';
    if (typeCST.children.Number) {
      typeName = typeCST.children.Number[0].image;
    } else if (typeCST.children.String) {
      typeName = typeCST.children.String[0].image;
    } else if (typeCST.children.Boolean) {
      typeName = typeCST.children.Boolean[0].image;
    } else if (typeCST.children.Void) {
      typeName = typeCST.children.Void[0].image;
    } else if (typeCST.children.Identifier) {
      typeName = typeCST.children.Identifier[0].image;
    }
    
    return {
      type: 'TypeAnnotation',
      typeName: { type: 'Identifier', name: typeName }
    };
  }

  /**
   * Extract parameter type
   */
  private extractParameterType(paramCST: any): any {
    if (paramCST.children.typeAnnotation) {
      const typeCST = paramCST.children.typeAnnotation[0];
      return this.convertTypeAnnotationCST(typeCST);
    }
    return null;
  }

  /**
   * Get detailed error information with line numbers
   */
  private getErrorLocation(error: any): string {
    if (error.location) {
      return `at line ${error.location.start.line}, column ${error.location.start.column}`;
    }
    return '';
  }
} 