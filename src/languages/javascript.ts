import { Language, StandardLibraryMapping, StandardLibraryPropertyMapping } from './types.js';
import { CompilerContext } from '../types/index.js';
import path from 'path';
import { 
  ASTProgramNode, 
  ASTStatementNode, 
  ASTExpressionNode,
  ASTFunctionDeclarationNode,
  ASTVariableDeclarationNode,
  ASTExpressionStatementNode,
  ASTIfStatementNode,
  ASTWhileStatementNode,
  ASTForStatementNode,
  ASTReturnStatementNode,
  ASTBlockStatementNode,
  ASTBinaryExpressionNode,
  ASTUnaryExpressionNode,
  ASTCallExpressionNode,
  ASTMemberExpressionNode,
  ASTIdentifierNode,
  ASTLiteralNode,
  ASTTypeDeclarationNode,
  ASTNodeType
} from '../ast/ast-converter.js';

export class JavaScriptLanguage implements Language {
  name = 'javascript';
  displayName = 'JavaScript';
  description = 'ECMAScript JavaScript programming language';
  emoji = '🟨';
  version = '1.0.0';
  middlewareDependencies = ['variable-renamer', 'hoister'];

  transpile(ast: ASTProgramNode, context: CompilerContext): string {
    const config = context.options;
    const formatter = new JavaScriptFormatter(config);
    
    // Convert AST to JavaScript code
    const code = this.transpileProgram(ast, formatter);
    
    return formatter.format(code);
  }

  /**
   * Generate JavaScript package files
   */
  async generatePackageFiles(outputDir: string, baseFileName: string): Promise<void> {
    const { FileHelpers } = await import('../utils/file-helpers.js');
    
    const packageJsonContent = `{
  "name": "${baseFileName}",
  "version": "1.0.0",
  "description": "Generated JavaScript code from Lingual",
  "main": "${baseFileName}.js",
  "scripts": {
    "start": "node ${baseFileName}.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "node-fetch": "^3.3.2"
  }
}`;

    await FileHelpers.writeFile(path.join(outputDir, 'package.json'), packageJsonContent);
  }

  /**
   * Get standard library function mappings for JavaScript
   */
  getStandardLibraryMappings(): StandardLibraryMapping[] {
    return [
      {
        pattern: 'http.get',
        template: 'await fetch({args})',
        async: true
      },
      {
        pattern: 'http.post',
        template: 'await fetch({args[0]}, { method: "POST", body: {args[1]} })',
        async: true
      },
      {
        pattern: 'console.log',
        template: 'console.log({args})'
      },
      {
        pattern: 'console.error',
        template: 'console.error({args})'
      },
      {
        pattern: 'console.warn',
        template: 'console.warn({args})'
      },
      {
        pattern: 'Math.random',
        template: 'Math.random()'
      },
      {
        pattern: 'Math.floor',
        template: 'Math.floor({args})'
      },
      {
        pattern: 'Math.ceil',
        template: 'Math.ceil({args})'
      }
    ];
  }

  /**
   * Get standard library property mappings for JavaScript
   */
  getStandardLibraryPropertyMappings(): StandardLibraryPropertyMapping[] {
    return [
      {
        pattern: 'response.json',
        template: '{object}.json()',
        isMethod: true
      },
      {
        pattern: 'data.drivers',
        template: '{object}.drivers',
        isMethod: false
      },
      {
        pattern: 'data.length',
        template: '{object}.length',
        isMethod: false
      }
    ];
  }

  /**
   * Transpile a program node
   */
  private transpileProgram(program: ASTProgramNode, formatter: JavaScriptFormatter): string {
    const statements = program.body.map(stmt => this.transpileStatement(stmt, formatter));
    return statements.join('\n\n');
  }

  /**
   * Transpile a statement node
   */
  private transpileStatement(stmt: ASTStatementNode, formatter: JavaScriptFormatter): string {
    switch ((stmt as any).type) {
      case ASTNodeType.FUNCTION_DECLARATION:
        return this.transpileFunctionDeclaration(stmt as ASTFunctionDeclarationNode, formatter);
      case ASTNodeType.VARIABLE_DECLARATION:
        return this.transpileVariableDeclaration(stmt as ASTVariableDeclarationNode, formatter);
      case ASTNodeType.EXPRESSION_STATEMENT:
        return this.transpileExpressionStatement(stmt as ASTExpressionStatementNode, formatter);
      case ASTNodeType.IF_STATEMENT:
        return this.transpileIfStatement(stmt as ASTIfStatementNode, formatter);
      case ASTNodeType.WHILE_STATEMENT:
        return this.transpileWhileStatement(stmt as ASTWhileStatementNode, formatter);
      case ASTNodeType.FOR_STATEMENT:
        return this.transpileForStatement(stmt as ASTForStatementNode, formatter);
      case ASTNodeType.RETURN_STATEMENT:
        return this.transpileReturnStatement(stmt as ASTReturnStatementNode, formatter);
      case ASTNodeType.BLOCK_STATEMENT:
        return this.transpileBlockStatement(stmt as ASTBlockStatementNode, formatter);
      case ASTNodeType.TYPE_DECLARATION:
        return this.transpileTypeDeclaration(stmt as ASTTypeDeclarationNode, formatter);
      default:
        throw new Error(`Unsupported statement type: ${(stmt as any).type}`);
    }
  }

  /**
   * Transpile a function declaration
   */
  private transpileFunctionDeclaration(func: ASTFunctionDeclarationNode, formatter: JavaScriptFormatter): string {
    const params = func.params.join(', ');
    const body = this.transpileBlockStatement(func.body, formatter);
    return `function ${func.name}(${params}) {\n${formatter.indent(body)}\n}`;
  }

  /**
   * Transpile a variable declaration
   */
  private transpileVariableDeclaration(variable: ASTVariableDeclarationNode, formatter: JavaScriptFormatter): string {
    const init = variable.init ? ` = ${this.transpileExpression(variable.init, formatter)}` : '';
    return `${variable.kind} ${variable.name}${init};`;
  }

  /**
   * Transpile an expression statement
   */
  private transpileExpressionStatement(stmt: ASTExpressionStatementNode, formatter: JavaScriptFormatter): string {
    return `${this.transpileExpression(stmt.expression, formatter)};`;
  }

  /**
   * Transpile an if statement
   */
  private transpileIfStatement(stmt: ASTIfStatementNode, formatter: JavaScriptFormatter): string {
    const test = this.transpileExpression(stmt.test, formatter);
    const consequent = this.transpileStatement(stmt.consequent, formatter);
    const alternate = stmt.alternate ? this.transpileStatement(stmt.alternate, formatter) : null;
    
    let result = `if (${test}) {\n${formatter.indent(consequent)}\n}`;
    if (alternate) {
      result += ` else {\n${formatter.indent(alternate)}\n}`;
    }
    return result;
  }

  /**
   * Transpile a while statement
   */
  private transpileWhileStatement(stmt: ASTWhileStatementNode, formatter: JavaScriptFormatter): string {
    const test = this.transpileExpression(stmt.test, formatter);
    const body = this.transpileStatement(stmt.body, formatter);
    return `while (${test}) {\n${formatter.indent(body)}\n}`;
  }

  /**
   * Transpile a for statement
   */
  private transpileForStatement(stmt: ASTForStatementNode, formatter: JavaScriptFormatter): string {
    const init = stmt.init ? this.transpileForInit(stmt.init, formatter) : '';
    const test = stmt.test ? this.transpileExpression(stmt.test, formatter) : '';
    const update = stmt.update ? this.transpileExpression(stmt.update, formatter) : '';
    const body = this.transpileStatement(stmt.body, formatter);
    
    return `for (${init}; ${test}; ${update}) {\n${formatter.indent(body)}\n}`;
  }

  /**
   * Transpile for loop initializer (can be variable declaration or expression)
   */
  private transpileForInit(init: ASTVariableDeclarationNode | ASTExpressionNode, formatter: JavaScriptFormatter): string {
    if ((init as any).type === ASTNodeType.VARIABLE_DECLARATION) {
      return this.transpileVariableDeclaration(init as ASTVariableDeclarationNode, formatter).replace(';', '');
    } else {
      return this.transpileExpression(init as ASTExpressionNode, formatter);
    }
  }

  /**
   * Transpile a return statement
   */
  private transpileReturnStatement(stmt: ASTReturnStatementNode, formatter: JavaScriptFormatter): string {
    const argument = stmt.argument ? this.transpileExpression(stmt.argument, formatter) : '';
    return `return ${argument};`;
  }

  /**
   * Transpile a block statement
   */
  private transpileBlockStatement(block: ASTBlockStatementNode, formatter: JavaScriptFormatter): string {
    const statements = block.body.map(stmt => this.transpileStatement(stmt, formatter));
    return statements.join('\n');
  }

  /**
   * Transpile a type declaration (convert to JSDoc comment in JavaScript)
   */
  private transpileTypeDeclaration(type: ASTTypeDeclarationNode, formatter: JavaScriptFormatter): string {
    const fields = type.fields.map(field => ` * @property {${field.valueType}} ${field.name}`).join('\n');
    return `/**\n * @typedef {Object} ${type.name}\n${fields}\n */`;
  }

  /**
   * Transpile an expression node
   */
  private transpileExpression(expr: ASTExpressionNode, formatter: JavaScriptFormatter): string {
    switch ((expr as any).type) {
      case ASTNodeType.BINARY_EXPRESSION:
        return this.transpileBinaryExpression(expr as ASTBinaryExpressionNode, formatter);
      case ASTNodeType.UNARY_EXPRESSION:
        return this.transpileUnaryExpression(expr as ASTUnaryExpressionNode, formatter);
      case ASTNodeType.CALL_EXPRESSION:
        return this.transpileCallExpression(expr as ASTCallExpressionNode, formatter);
      case ASTNodeType.MEMBER_EXPRESSION:
        return this.transpileMemberExpression(expr as ASTMemberExpressionNode, formatter);
      case ASTNodeType.IDENTIFIER:
        return this.transpileIdentifier(expr as ASTIdentifierNode, formatter);
      case ASTNodeType.LITERAL:
        return this.transpileLiteral(expr as ASTLiteralNode, formatter);
      default:
        throw new Error(`Unsupported expression type: ${(expr as any).type}`);
    }
  }

  /**
   * Transpile a binary expression
   */
  private transpileBinaryExpression(expr: ASTBinaryExpressionNode, formatter: JavaScriptFormatter): string {
    const left = this.transpileExpression(expr.left, formatter);
    const right = this.transpileExpression(expr.right, formatter);
    return `${left} ${expr.operator} ${right}`;
  }

  /**
   * Transpile a unary expression
   */
  private transpileUnaryExpression(expr: ASTUnaryExpressionNode, formatter: JavaScriptFormatter): string {
    const argument = this.transpileExpression(expr.argument, formatter);
    return `${expr.operator}${argument}`;
  }

  /**
   * Transpile a call expression
   */
  private transpileCallExpression(expr: ASTCallExpressionNode, formatter: JavaScriptFormatter): string {
    // Handle standard library functions
    if (expr.callee.type === ASTNodeType.MEMBER_EXPRESSION) {
      const memberExpr = expr.callee as ASTMemberExpressionNode;
      const objectName = this.transpileExpression(memberExpr.object, formatter);
      const propertyName = this.transpileExpression(memberExpr.property, formatter);
      const args = expr.arguments.map(arg => this.transpileExpression(arg, formatter));
      
      const transpiler = new StandardLibraryTranspiler(this);
      const result = transpiler.transpileFunctionCall(objectName, propertyName, args);
      
      if (result) {
        return result;
      }
    }
    
    // Default call expression handling
    const callee = this.transpileExpression(expr.callee, formatter);
    const args = expr.arguments.map(arg => this.transpileExpression(arg, formatter));
    return `${callee}(${args.join(', ')})`;
  }

  /**
   * Transpile a member expression
   */
  private transpileMemberExpression(expr: ASTMemberExpressionNode, formatter: JavaScriptFormatter): string {
    const objectName = this.transpileExpression(expr.object, formatter);
    const propertyName = this.transpileExpression(expr.property, formatter);
    
    const transpiler = new StandardLibraryTranspiler(this);
    const result = transpiler.transpilePropertyAccess(objectName, propertyName);
    
    if (result) {
      return result;
    }
    
    return `${objectName}.${propertyName}`;
  }

  /**
   * Transpile an identifier
   */
  private transpileIdentifier(expr: ASTIdentifierNode, formatter: JavaScriptFormatter): string {
    return expr.name;
  }

  /**
   * Transpile a literal
   */
  private transpileLiteral(expr: ASTLiteralNode, formatter: JavaScriptFormatter): string {
    if (typeof expr.value === 'string') {
      return `"${expr.value}"`;
    }
    return String(expr.value);
  }
}

/**
 * JavaScript formatter that applies formatting rules from config
 */
class JavaScriptFormatter {
  private config: any;
  private indentSize: number;
  private indentStyle: string;

  constructor(config: any) {
    this.config = config;
    this.indentSize = config.prettify?.indentSize || 2;
    this.indentStyle = config.prettify?.indentStyle || 'space';
  }

  /**
   * Indent a block of code
   */
  indent(code: string): string {
    const indentStr = this.indentStyle === 'tab' ? '\t' : ' '.repeat(this.indentSize);
    return code.split('\n').map(line => `${indentStr}${line}`).join('\n');
  }

  /**
   * Format the final code
   */
  format(code: string): string {
    // Apply any additional formatting rules here
    return code;
  }
}

/**
 * Standard library transpiler for JavaScript
 */
class StandardLibraryTranspiler {
  private functionMappings: StandardLibraryMapping[];
  private propertyMappings: StandardLibraryPropertyMapping[];

  constructor(language: JavaScriptLanguage) {
    this.functionMappings = language.getStandardLibraryMappings();
    this.propertyMappings = language.getStandardLibraryPropertyMappings();
  }

  /**
   * Transpile a function call using standard library mappings
   */
  transpileFunctionCall(objectName: string, propertyName: string, args: string[]): string | null {
    const pattern = `${objectName}.${propertyName}`;
    const mapping = this.functionMappings.find(m => m.pattern === pattern);
    
    if (!mapping) return null;
    
    let template = mapping.template;
    
    // Replace {args} with all arguments
    if (template.includes('{args}')) {
      template = template.replace('{args}', args.join(', '));
    }
    
    // Replace {args[0]}, {args[1]}, etc. with specific arguments
    for (let i = 0; i < args.length; i++) {
      template = template.replace(`{args[${i}]}`, args[i]);
    }
    
    return template;
  }

  /**
   * Transpile a property access using standard library mappings
   */
  transpilePropertyAccess(objectName: string, propertyName: string): string | null {
    const pattern = `${objectName}.${propertyName}`;
    const mapping = this.propertyMappings.find(m => m.pattern === pattern);
    
    if (!mapping) return null;
    
    let template = mapping.template;
    template = template.replace('{object}', objectName);
    
    if (mapping.isMethod) {
      template += '()';
    }
    
    return template;
  }
} 