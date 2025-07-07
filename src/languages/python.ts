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

export class PythonLanguage implements Language {
  name = 'python';
  displayName = 'Python';
  description = 'Python programming language';
  emoji = '🐍';
  version = '1.0.0';
  middlewareDependencies = ['variable-renamer', 'hoister'];

  transpile(ast: ASTProgramNode, context: CompilerContext): string {
    const config = context.options;
    const formatter = new PythonFormatter(config);
    
    // Convert AST to Python code
    const code = this.transpileProgram(ast, formatter);
    
    return formatter.format(code);
  }

  /**
   * Generate Python project files
   */
  async generatePackageFiles(outputDir: string, baseFileName: string): Promise<void> {
    const { FileHelpers } = await import('../utils/file-helpers.js');
    
    const requirementsTxtContent = `requests>=2.31.0
aiohttp>=3.8.0
`;

    const pyprojectTomlContent = `[tool.poetry]
name = "${baseFileName}"
version = "0.1.0"
description = "Generated Python code from Lingual"
authors = ["Your Name <your.email@example.com>"]

[tool.poetry.dependencies]
python = "^3.8"
requests = "^2.31.0"
aiohttp = "^3.8.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
`;

    await FileHelpers.writeFile(path.join(outputDir, 'requirements.txt'), requirementsTxtContent);
    await FileHelpers.writeFile(path.join(outputDir, 'pyproject.toml'), pyprojectTomlContent);
  }

  /**
   * Get standard library function mappings for Python
   */
  getStandardLibraryMappings(): StandardLibraryMapping[] {
    return [
      {
        pattern: 'http.get',
        template: 'await aiohttp.ClientSession().get({args})',
        async: true,
        imports: ['import aiohttp', 'import asyncio']
      },
      {
        pattern: 'http.post',
        template: 'await aiohttp.ClientSession().post({args[0]}, json={args[1]})',
        async: true,
        imports: ['import aiohttp', 'import asyncio']
      },
      {
        pattern: 'console.log',
        template: 'print({args})',
        imports: []
      },
      {
        pattern: 'console.error',
        template: 'print({args}, file=sys.stderr)',
        imports: ['import sys']
      },
      {
        pattern: 'console.warn',
        template: 'print(f"WARNING: {args}", file=sys.stderr)',
        imports: ['import sys']
      },
      {
        pattern: 'Math.random',
        template: 'random.random()',
        imports: ['import random']
      },
      {
        pattern: 'Math.floor',
        template: 'math.floor({args})',
        imports: ['import math']
      },
      {
        pattern: 'Math.ceil',
        template: 'math.ceil({args})',
        imports: ['import math']
      }
    ];
  }

  /**
   * Get standard library property mappings for Python
   */
  getStandardLibraryPropertyMappings(): StandardLibraryPropertyMapping[] {
    return [
      {
        pattern: 'response.json',
        template: 'await {object}.json()',
        isMethod: true
      },
      {
        pattern: 'data.drivers',
        template: '{object}.get("drivers")',
        isMethod: false
      },
      {
        pattern: 'data.length',
        template: 'len({object})',
        isMethod: false
      }
    ];
  }

  /**
   * Transpile a program node
   */
  private transpileProgram(program: ASTProgramNode, formatter: PythonFormatter): string {
    const statements = program.body.map(stmt => this.transpileStatement(stmt, formatter));
    return statements.join('\n\n');
  }

  /**
   * Transpile a statement node
   */
  private transpileStatement(stmt: ASTStatementNode, formatter: PythonFormatter): string {
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
  private transpileFunctionDeclaration(func: ASTFunctionDeclarationNode, formatter: PythonFormatter): string {
    const params = func.params.join(', ');
    const body = this.transpileBlockStatement(func.body, formatter);
    return `async def ${func.name}(${params}):\n${formatter.indent(body)}`;
  }

  /**
   * Transpile a variable declaration
   */
  private transpileVariableDeclaration(variable: ASTVariableDeclarationNode, formatter: PythonFormatter): string {
    const init = variable.init ? ` = ${this.transpileExpression(variable.init, formatter)}` : '';
    return `${variable.name}${init}`;
  }

  /**
   * Transpile an expression statement
   */
  private transpileExpressionStatement(stmt: ASTExpressionStatementNode, formatter: PythonFormatter): string {
    return this.transpileExpression(stmt.expression, formatter);
  }

  /**
   * Transpile an if statement
   */
  private transpileIfStatement(stmt: ASTIfStatementNode, formatter: PythonFormatter): string {
    const test = this.transpileExpression(stmt.test, formatter);
    const consequent = this.transpileStatement(stmt.consequent, formatter);
    const alternate = stmt.alternate ? this.transpileStatement(stmt.alternate, formatter) : null;
    
    let result = `if ${test}:\n${formatter.indent(consequent)}`;
    if (alternate) {
      result += `\nelse:\n${formatter.indent(alternate)}`;
    }
    return result;
  }

  /**
   * Transpile a while statement
   */
  private transpileWhileStatement(stmt: ASTWhileStatementNode, formatter: PythonFormatter): string {
    const test = this.transpileExpression(stmt.test, formatter);
    const body = this.transpileStatement(stmt.body, formatter);
    return `while ${test}:\n${formatter.indent(body)}`;
  }

  /**
   * Transpile a for statement
   */
  private transpileForStatement(stmt: ASTForStatementNode, formatter: PythonFormatter): string {
    const init = stmt.init ? this.transpileForInit(stmt.init, formatter) : '';
    const test = stmt.test ? this.transpileExpression(stmt.test, formatter) : '';
    const update = stmt.update ? this.transpileExpression(stmt.update, formatter) : '';
    const body = this.transpileStatement(stmt.body, formatter);
    
    // Python doesn't have C-style for loops, convert to range
    if (init && test && update) {
      return `for ${init} in range(${test}):\n${formatter.indent(body)}`;
    }
    return `for ${init} in range(${test}):\n${formatter.indent(body)}`;
  }

  /**
   * Transpile for loop initializer
   */
  private transpileForInit(init: ASTVariableDeclarationNode | ASTExpressionNode, formatter: PythonFormatter): string {
    if ((init as any).type === ASTNodeType.VARIABLE_DECLARATION) {
      return this.transpileVariableDeclaration(init as ASTVariableDeclarationNode, formatter);
    } else {
      return this.transpileExpression(init as ASTExpressionNode, formatter);
    }
  }

  /**
   * Transpile a return statement
   */
  private transpileReturnStatement(stmt: ASTReturnStatementNode, formatter: PythonFormatter): string {
    const argument = stmt.argument ? this.transpileExpression(stmt.argument, formatter) : '';
    return `return ${argument}`;
  }

  /**
   * Transpile a block statement
   */
  private transpileBlockStatement(block: ASTBlockStatementNode, formatter: PythonFormatter): string {
    const statements = block.body.map(stmt => this.transpileStatement(stmt, formatter));
    return statements.join('\n');
  }

  /**
   * Transpile a type declaration (convert to dataclass in Python)
   */
  private transpileTypeDeclaration(type: ASTTypeDeclarationNode, formatter: PythonFormatter): string {
    const fields = type.fields.map(field => `    ${field.name}: ${field.valueType}`).join('\n');
    return `from dataclasses import dataclass\n\n@dataclass\nclass ${type.name}:\n${fields}`;
  }

  /**
   * Transpile an expression node
   */
  private transpileExpression(expr: ASTExpressionNode, formatter: PythonFormatter): string {
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
  private transpileBinaryExpression(expr: ASTBinaryExpressionNode, formatter: PythonFormatter): string {
    const left = this.transpileExpression(expr.left, formatter);
    const right = this.transpileExpression(expr.right, formatter);
    return `${left} ${expr.operator} ${right}`;
  }

  /**
   * Transpile a unary expression
   */
  private transpileUnaryExpression(expr: ASTUnaryExpressionNode, formatter: PythonFormatter): string {
    const argument = this.transpileExpression(expr.argument, formatter);
    return `${expr.operator}${argument}`;
  }

  /**
   * Transpile a call expression
   */
  private transpileCallExpression(expr: ASTCallExpressionNode, formatter: PythonFormatter): string {
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
  private transpileMemberExpression(expr: ASTMemberExpressionNode, formatter: PythonFormatter): string {
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
  private transpileIdentifier(expr: ASTIdentifierNode, formatter: PythonFormatter): string {
    return expr.name;
  }

  /**
   * Transpile a literal
   */
  private transpileLiteral(expr: ASTLiteralNode, formatter: PythonFormatter): string {
    if (typeof expr.value === 'string') {
      return `"${expr.value}"`;
    }
    return String(expr.value);
  }
}

/**
 * Python formatter that applies formatting rules from config
 */
class PythonFormatter {
  private config: any;
  private indentSize: number;
  private indentStyle: string;

  constructor(config: any) {
    this.config = config;
    this.indentSize = config.prettify?.indentSize || 4;
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
 * Standard library transpiler for Python
 */
class StandardLibraryTranspiler {
  private functionMappings: StandardLibraryMapping[];
  private propertyMappings: StandardLibraryPropertyMapping[];

  constructor(language: PythonLanguage) {
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