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

export class CSharpLanguage implements Language {
  name = 'csharp';
  displayName = 'C#';
  description = 'Microsoft C# programming language';
  emoji = '🔷';
  version = '1.0.0';
  middlewareDependencies = ['variable-renamer', 'type-checker'];

  transpile(ast: ASTProgramNode, context: CompilerContext): string {
    const config = context.options;
    const formatter = new CSharpFormatter(config);
    
    // Convert AST to C# code
    const code = this.transpileProgram(ast, formatter);
    
    return formatter.format(code);
  }

  /**
   * Generate C# project files
   */
  async generatePackageFiles(outputDir: string, baseFileName: string): Promise<void> {
    const { FileHelpers } = await import('../utils/file-helpers.js');
    
    const csprojContent = `<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="System.Text.Json" Version="8.0.0" />
  </ItemGroup>
</Project>`;

    await FileHelpers.writeFile(path.join(outputDir, `${baseFileName}.csproj`), csprojContent);
  }

  /**
   * Get standard library function mappings for C#
   */
  getStandardLibraryMappings(): StandardLibraryMapping[] {
    return [
      {
        pattern: 'http.get',
        template: 'await new HttpClient().GetAsync({args})',
        async: true,
        imports: ['System.Net.Http']
      },
      {
        pattern: 'http.post',
        template: 'await new HttpClient().PostAsync({args[0]}, new StringContent({args[1]}))',
        async: true,
        imports: ['System.Net.Http']
      },
      {
        pattern: 'console.log',
        template: 'Console.WriteLine({args})',
        imports: ['System']
      },
      {
        pattern: 'console.error',
        template: 'Console.Error.WriteLine({args})',
        imports: ['System']
      },
      {
        pattern: 'console.warn',
        template: 'Console.WriteLine({args})',
        imports: ['System']
      },
      {
        pattern: 'Math.random',
        template: 'new Random().NextDouble()',
        imports: ['System']
      },
      {
        pattern: 'Math.floor',
        template: 'Math.Floor({args})',
        imports: ['System']
      },
      {
        pattern: 'Math.ceil',
        template: 'Math.Ceiling({args})',
        imports: ['System']
      }
    ];
  }

  /**
   * Get standard library property mappings for C#
   */
  getStandardLibraryPropertyMappings(): StandardLibraryPropertyMapping[] {
    return [
      {
        pattern: 'response.json',
        template: '{object}.Content.ReadAsStringAsync()',
        isMethod: true
      },
      {
        pattern: 'data.drivers',
        template: '{object}.GetProperty("drivers")',
        isMethod: false
      },
      {
        pattern: 'data.length',
        template: '{object}.GetArrayLength()',
        isMethod: false
      }
    ];
  }

  /**
   * Transpile a program node
   */
  private transpileProgram(program: ASTProgramNode, formatter: CSharpFormatter): string {
    const statements = program.body.map(stmt => this.transpileStatement(stmt, formatter));
    const body = statements.join('\n\n');
    
    return `using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json;

${body}`;
  }

  /**
   * Transpile a statement node
   */
  private transpileStatement(stmt: ASTStatementNode, formatter: CSharpFormatter): string {
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
  private transpileFunctionDeclaration(func: ASTFunctionDeclarationNode, formatter: CSharpFormatter): string {
    const params = func.params.length > 0 ? func.params.map(p => `string ${p}`).join(', ') : '';
    const body = this.transpileBlockStatement(func.body, formatter);
    return `public static async Task ${func.name}(${params}) {\n${formatter.indent(body)}\n}`;
  }

  /**
   * Transpile a variable declaration
   */
  private transpileVariableDeclaration(variable: ASTVariableDeclarationNode, formatter: CSharpFormatter): string {
    const init = variable.init ? ` = ${this.transpileExpression(variable.init, formatter)}` : '';
    // Map JavaScript variable types to C# types
    const csharpType = this.mapToCSharpType(variable.name);
    return `${csharpType} ${variable.name}${init};`;
  }

  /**
   * Map variable names to C# types based on context
   */
  private mapToCSharpType(varName: string): string {
    if (varName === 'response') return 'HttpResponseMessage';
    if (varName === 'data') return 'JsonElement';
    if (varName === 'http') return 'HttpClient';
    return 'var';
  }

  /**
   * Transpile an expression statement
   */
  private transpileExpressionStatement(stmt: ASTExpressionStatementNode, formatter: CSharpFormatter): string {
    return `${this.transpileExpression(stmt.expression, formatter)};`;
  }

  /**
   * Transpile an if statement
   */
  private transpileIfStatement(stmt: ASTIfStatementNode, formatter: CSharpFormatter): string {
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
  private transpileWhileStatement(stmt: ASTWhileStatementNode, formatter: CSharpFormatter): string {
    const test = this.transpileExpression(stmt.test, formatter);
    const body = this.transpileStatement(stmt.body, formatter);
    return `while (${test}) {\n${formatter.indent(body)}\n}`;
  }

  /**
   * Transpile a for statement
   */
  private transpileForStatement(stmt: ASTForStatementNode, formatter: CSharpFormatter): string {
    const init = stmt.init ? this.transpileForInit(stmt.init, formatter) : '';
    const test = stmt.test ? this.transpileExpression(stmt.test, formatter) : '';
    const update = stmt.update ? this.transpileExpression(stmt.update, formatter) : '';
    const body = this.transpileStatement(stmt.body, formatter);
    
    return `for (${init}; ${test}; ${update}) {\n${formatter.indent(body)}\n}`;
  }

  /**
   * Transpile for loop initializer (can be variable declaration or expression)
   */
  private transpileForInit(init: ASTVariableDeclarationNode | ASTExpressionNode, formatter: CSharpFormatter): string {
    if ((init as any).type === ASTNodeType.VARIABLE_DECLARATION) {
      return this.transpileVariableDeclaration(init as ASTVariableDeclarationNode, formatter).replace(';', '');
    } else {
      return this.transpileExpression(init as ASTExpressionNode, formatter);
    }
  }

  /**
   * Transpile a return statement
   */
  private transpileReturnStatement(stmt: ASTReturnStatementNode, formatter: CSharpFormatter): string {
    const argument = stmt.argument ? this.transpileExpression(stmt.argument, formatter) : '';
    return `return ${argument};`;
  }

  /**
   * Transpile a block statement
   */
  private transpileBlockStatement(block: ASTBlockStatementNode, formatter: CSharpFormatter): string {
    const statements = block.body.map(stmt => this.transpileStatement(stmt, formatter));
    return statements.join('\n');
  }

  /**
   * Transpile a type declaration
   */
  private transpileTypeDeclaration(type: ASTTypeDeclarationNode, formatter: CSharpFormatter): string {
    const fields = type.fields.map(field => `  public ${this.mapToCSharpType(field.valueType)} ${field.name} { get; set; }`).join('\n');
    return `public class ${type.name} {\n${fields}\n}`;
  }

  /**
   * Transpile an expression node
   */
  private transpileExpression(expr: ASTExpressionNode, formatter: CSharpFormatter): string {
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
  private transpileBinaryExpression(expr: ASTBinaryExpressionNode, formatter: CSharpFormatter): string {
    const left = this.transpileExpression(expr.left, formatter);
    const right = this.transpileExpression(expr.right, formatter);
    return `${left} ${expr.operator} ${right}`;
  }

  /**
   * Transpile a unary expression
   */
  private transpileUnaryExpression(expr: ASTUnaryExpressionNode, formatter: CSharpFormatter): string {
    const argument = this.transpileExpression(expr.argument, formatter);
    return `${expr.operator}${argument}`;
  }

  /**
   * Transpile a call expression
   */
  private transpileCallExpression(expr: ASTCallExpressionNode, formatter: CSharpFormatter): string {
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
  private transpileMemberExpression(expr: ASTMemberExpressionNode, formatter: CSharpFormatter): string {
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
  private transpileIdentifier(expr: ASTIdentifierNode, formatter: CSharpFormatter): string {
    // Handle special identifiers
    if (expr.name === 'http') {
      return 'new HttpClient()';
    }
    return expr.name;
  }

  /**
   * Transpile a literal
   */
  private transpileLiteral(expr: ASTLiteralNode, formatter: CSharpFormatter): string {
    if (typeof expr.value === 'string') {
      return `"${expr.value}"`;
    }
    return String(expr.value);
  }
}

/**
 * C# formatter that applies formatting rules from config
 */
class CSharpFormatter {
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
 * Standard library transpiler for C#
 */
class StandardLibraryTranspiler {
  private functionMappings: StandardLibraryMapping[];
  private propertyMappings: StandardLibraryPropertyMapping[];

  constructor(language: CSharpLanguage) {
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