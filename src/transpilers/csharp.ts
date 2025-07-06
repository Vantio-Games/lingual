import { 
  Program, 
  Statement, 
  FunctionDeclaration, 
  VariableDeclaration, 
  ExpressionStatement, 
  ReturnStatement, 
  IfStatement,
  Expression,
  Identifier,
  Literal,
  BinaryExpression,
  CallExpression,
  MemberExpression,
  Parameter,
  TypeAnnotation
} from '../types/index.js';
import { ApiDefinition, TypeDefinition, ModuleDefinition } from '../language/features/index.js';
import { logger } from '../utils/logger.js';

export class CSharpTranspiler {
  private indentLevel = 0;
  private indentSize = 4;

  constructor() {
    this.indentLevel = 0;
  }

  /**
   * Transpile a program to C#
   */
  transpile(program: Program): string {
    logger.debug('Starting C# transpilation');
    
    const lines: string[] = [];
    
    // Add using statements
    lines.push('using System;');
    lines.push('using System.Collections.Generic;');
    lines.push('using System.Linq;');
    lines.push('using System.Net.Http;');
    lines.push('using System.Threading.Tasks;');
    lines.push('using Newtonsoft.Json;');
    lines.push('');
    
    // Process all statements and organize by type
    const apis: ApiDefinition[] = [];
    const types: TypeDefinition[] = [];
    const modules: ModuleDefinition[] = [];
    const functions: FunctionDeclaration[] = [];
    const variables: VariableDeclaration[] = [];
    const otherStatements: Statement[] = [];

    for (const statement of program.body) {
      switch (statement.type) {
        case 'ApiDefinition':
          apis.push(statement as ApiDefinition);
          break;
        case 'TypeDefinition':
          types.push(statement as TypeDefinition);
          break;
        case 'ModuleDefinition':
          modules.push(statement as ModuleDefinition);
          break;
        case 'FunctionDeclaration':
          functions.push(statement as FunctionDeclaration);
          break;
        case 'VariableDeclaration':
          variables.push(statement as VariableDeclaration);
          break;
        case 'MacroCall':
        case 'MacroDefinition':
          // Ignore macros in transpilation
          break;
        default:
          logger.warn(`Unknown statement type: ${(statement as any).type}`);
          otherStatements.push(statement);
      }
    }

    // Generate namespace
    lines.push('namespace LingualGenerated');
    lines.push('{');
    this.indentLevel++;

    // Generate types first
    for (const type of types) {
      lines.push(this.transpileTypeDefinition(type));
      lines.push('');
    }

    // Generate API client classes
    if (apis.length > 0) {
      lines.push(this.transpileApiClient(apis));
      lines.push('');
    }

    // Generate modules
    for (const module of modules) {
      lines.push(this.transpileModule(module));
      lines.push('');
    }

    // Generate main program class
    lines.push(this.indent() + 'public class Program');
    lines.push(this.indent() + '{');
    this.indentLevel++;

    // Generate functions
    for (const func of functions) {
      const transpiled = this.transpileFunctionDeclaration(func);
      if (transpiled) {
        lines.push(transpiled);
      }
    }

    // Generate variable declarations
    for (const variable of variables) {
      const transpiled = this.transpileVariableDeclaration(variable);
      if (transpiled) {
        lines.push(transpiled);
      }
    }

    // Generate other statements
    for (const statement of otherStatements) {
      const transpiled = this.transpileStatement(statement);
      if (transpiled !== undefined) {
        lines.push(transpiled);
      }
    }

    this.indentLevel--;
    lines.push(this.indent() + '}');
    this.indentLevel--;
    lines.push('}');
    
    const result = lines.join('\n');
    logger.success('C# transpilation completed');
    return result;
  }

  /**
   * Transpile a type definition to C# class
   */
  private transpileTypeDefinition(type: TypeDefinition): string {
    const lines: string[] = [];
    
    lines.push(this.indent() + 'public class ' + type.name.name);
    lines.push(this.indent() + '{');
    this.indentLevel++;

    // Generate properties
    for (const field of type.fields) {
      const csharpType = this.mapTypeToCSharp(field.typeAnnotation);
      const nullable = field.required ? '' : '?';
      lines.push(this.indent() + `public ${csharpType}${nullable} ${field.name.name} { get; set; }`);
    }

    // Generate constructor
    if (type.fields.length > 0) {
      lines.push('');
      lines.push(this.indent() + `public ${type.name.name}()`);
      lines.push(this.indent() + '{');
      lines.push(this.indent() + '}');
    }

    this.indentLevel--;
    lines.push(this.indent() + '}');
    
    return lines.join('\n');
  }

  /**
   * Transpile API definitions to C# HttpClient wrapper
   */
  private transpileApiClient(apis: ApiDefinition[]): string {
    const lines: string[] = [];
    
    lines.push(this.indent() + 'public class ApiClient');
    lines.push(this.indent() + '{');
    this.indentLevel++;
    
    lines.push(this.indent() + 'private readonly HttpClient _httpClient;');
    lines.push('');
    lines.push(this.indent() + 'public ApiClient(HttpClient httpClient)');
    lines.push(this.indent() + '{');
    lines.push(this.indent() + '    _httpClient = httpClient;');
    lines.push(this.indent() + '}');
    lines.push('');

    // Generate API methods
    for (const api of apis) {
      lines.push(this.transpileApiMethod(api));
      lines.push('');
    }

    this.indentLevel--;
    lines.push(this.indent() + '}');
    
    return lines.join('\n');
  }

  /**
   * Transpile an API definition to C# method
   */
  private transpileApiMethod(api: ApiDefinition): string {
    const lines: string[] = [];
    
    const method = api.method || 'GET';
    const path = api.path || '/';
    const returnType = api.returns ? this.mapTypeToCSharp(api.returns) : 'string';
    
    // Method signature
    lines.push(this.indent() + `public async Task<${returnType}> ${api.name.name}Async()`);
    lines.push(this.indent() + '{');
    this.indentLevel++;

    // Build request
    lines.push(this.indent() + `var request = new HttpRequestMessage(HttpMethod.${method.toUpperCase()}, "${path}");`);
    
    // Add headers if specified
    if (api.headers && Array.isArray(api.headers) && api.headers.length > 0) {
      for (const header of api.headers) {
        lines.push(this.indent() + `request.Headers.Add("${header.key}", "${header.value}");`);
      }
    }

    // Send request
    lines.push(this.indent() + 'var response = await _httpClient.SendAsync(request);');
    lines.push(this.indent() + 'response.EnsureSuccessStatusCode();');
    
    // Return response
    if (returnType === 'string') {
      lines.push(this.indent() + 'return await response.Content.ReadAsStringAsync();');
    } else {
      lines.push(this.indent() + 'var content = await response.Content.ReadAsStringAsync();');
      lines.push(this.indent() + `return JsonConvert.DeserializeObject<${returnType}>(content);`);
    }

    this.indentLevel--;
    lines.push(this.indent() + '}');
    
    return lines.join('\n');
  }

  /**
   * Transpile API parameters to C# parameters
   */
  private transpileApiParameters(parameters: any[]): string {
    if (!parameters || parameters.length === 0) {
      return '';
    }

    return parameters.map(param => {
      const csharpType = this.mapTypeToCSharp(param.typeAnnotation);
      const nullable = param.required ? '' : '?';
      return `${csharpType}${nullable} ${param.name.name}`;
    }).join(', ');
  }

  /**
   * Transpile a module definition to C# class
   */
  private transpileModule(module: ModuleDefinition): string {
    const lines: string[] = [];
    
    lines.push(this.indent() + `public static class ${module.name.name}`);
    lines.push(this.indent() + '{');
    this.indentLevel++;

    // Generate functions
    for (const func of module.functions) {
      const transpiled = this.transpileFunctionDeclaration(func);
      if (transpiled) {
        lines.push(transpiled);
      }
    }

    this.indentLevel--;
    lines.push(this.indent() + '}');
    
    return lines.join('\n');
  }

  /**
   * Map Lingual types to C# types
   */
  private mapTypeToCSharp(typeAnnotation: TypeAnnotation | string): string {
    let typeName: string;
    
    if (typeof typeAnnotation === 'string') {
      typeName = typeAnnotation;
    } else {
      typeName = typeAnnotation.typeName.name;
    }
    
    switch (typeName.toLowerCase()) {
      case 'string':
        return 'string';
      case 'number':
        return 'double';
      case 'boolean':
        return 'bool';
      case 'void':
        return 'void';
      case 'object':
        return 'object';
      case 'array':
        return 'List<object>';
      default:
        return typeName;
    }
  }

  /**
   * Transpile a statement to C#
   */
  private transpileStatement(statement: Statement): string | undefined {
    switch (statement.type) {
      case 'FunctionDeclaration':
        return this.transpileFunctionDeclaration(statement as FunctionDeclaration);
      case 'VariableDeclaration':
        return this.transpileVariableDeclaration(statement as VariableDeclaration);
      case 'ExpressionStatement':
        return this.transpileExpressionStatement(statement as ExpressionStatement);
      case 'ReturnStatement':
        return this.transpileReturnStatement(statement as ReturnStatement);
      case 'IfStatement':
        return this.transpileIfStatement(statement as IfStatement);
      default:
        logger.warn(`Unknown statement type: ${statement.type}`);
        return undefined;
    }
  }

  /**
   * Transpile a function declaration to C#
   */
  private transpileFunctionDeclaration(func: FunctionDeclaration): string {
    const lines: string[] = [];
    
    // Function signature
    const returnType = func.returnType ? this.transpileTypeAnnotation(func.returnType) : 'void';
    const params = func.parameters.map(p => this.transpileParameter(p)).join(', ');
    
    lines.push(this.indent() + `public static ${returnType} ${func.name.name}(${params})`);
    lines.push(this.indent() + '{');
    this.indentLevel++;
    
    // Function body
    for (const statement of func.body) {
      const transpiled = this.transpileStatement(statement);
      if (transpiled) {
        lines.push(transpiled);
      }
    }
    
    this.indentLevel--;
    lines.push(this.indent() + '}');
    lines.push('');
    
    return lines.join('\n');
  }

  /**
   * Transpile a parameter to C#
   */
  private transpileParameter(param: Parameter): string {
    const type = param.typeAnnotation ? this.transpileTypeAnnotation(param.typeAnnotation) : 'object';
    return `${type} ${param.name.name}`;
  }

  /**
   * Transpile a type annotation to C#
   */
  private transpileTypeAnnotation(type: TypeAnnotation): string {
    let result = type.typeName.name;
    
    // Handle basic type mappings
    switch (type.typeName.name.toLowerCase()) {
      case 'string':
        result = 'string';
        break;
      case 'number':
        result = 'double';
        break;
      case 'boolean':
        result = 'bool';
        break;
      case 'void':
        result = 'void';
        break;
      default:
        result = type.typeName.name;
    }
    
    // Handle nullable types
    if (type.isNullable && result !== 'void') {
      result += '?';
    }
    
    // Handle generic arguments
    if (type.genericArguments && type.genericArguments.length > 0) {
      const genericArgs = type.genericArguments.map(arg => this.transpileTypeAnnotation(arg)).join(', ');
      result += `<${genericArgs}>`;
    }
    
    return result;
  }

  /**
   * Transpile a variable declaration to C#
   */
  private transpileVariableDeclaration(decl: VariableDeclaration): string {
    const type = decl.typeAnnotation ? this.transpileTypeAnnotation(decl.typeAnnotation) : 'var';
    const name = decl.name.name;
    const initializer = decl.initializer ? ` = ${this.transpileExpression(decl.initializer)}` : '';
    
    return this.indent() + `${type} ${name}${initializer};`;
  }

  /**
   * Transpile an expression statement to C#
   */
  private transpileExpressionStatement(stmt: ExpressionStatement): string {
    return this.indent() + `${this.transpileExpression(stmt.expression)};`;
  }

  /**
   * Transpile a return statement to C#
   */
  private transpileReturnStatement(stmt: ReturnStatement): string {
    const expression = stmt.expression ? this.transpileExpression(stmt.expression) : '';
    return this.indent() + `return${expression ? ' ' + expression : ''};`;
  }

  /**
   * Transpile an if statement to C#
   */
  private transpileIfStatement(stmt: IfStatement): string {
    const lines: string[] = [];
    
    const condition = this.transpileExpression(stmt.condition);
    lines.push(this.indent() + `if (${condition})`);
    lines.push(this.indent() + '{');
    this.indentLevel++;
    
    const thenTranspiled = this.transpileStatement(stmt.thenStatement);
    if (thenTranspiled) {
      lines.push(thenTranspiled);
    }
    
    this.indentLevel--;
    lines.push(this.indent() + '}');
    
    if (stmt.elseStatement) {
      lines.push(this.indent() + 'else');
      lines.push(this.indent() + '{');
      this.indentLevel++;
      
      const elseTranspiled = this.transpileStatement(stmt.elseStatement);
      if (elseTranspiled) {
        lines.push(elseTranspiled);
      }
      
      this.indentLevel--;
      lines.push(this.indent() + '}');
    }
    
    return lines.join('\n');
  }

  /**
   * Transpile an expression to C#
   */
  private transpileExpression(expr: Expression): string {
    switch (expr.type) {
      case 'Identifier':
        return this.transpileIdentifier(expr as Identifier);
      case 'Literal':
        return this.transpileLiteral(expr as Literal);
      case 'BinaryExpression':
        return this.transpileBinaryExpression(expr as BinaryExpression);
      case 'CallExpression':
        return this.transpileCallExpression(expr as CallExpression);
      case 'MemberExpression':
        return this.transpileMemberExpression(expr as MemberExpression);
      default:
        logger.warn(`Unknown expression type: ${(expr as any).type}`);
        return 'null';
    }
  }

  /**
   * Transpile an identifier to C#
   */
  private transpileIdentifier(ident: Identifier): string {
    return ident.name;
  }

  /**
   * Transpile a literal to C#
   */
  private transpileLiteral(literal: Literal): string {
    if (typeof literal.value === 'string') {
      return `"${literal.value}"`;
    } else if (typeof literal.value === 'boolean') {
      return literal.value ? 'true' : 'false';
    } else {
      return String(literal.value);
    }
  }

  /**
   * Transpile a binary expression to C#
   */
  private transpileBinaryExpression(expr: BinaryExpression): string {
    const left = this.transpileExpression(expr.left);
    const right = this.transpileExpression(expr.right);
    const operator = this.mapOperator(expr.operator);
    
    return `(${left} ${operator} ${right})`;
  }

  /**
   * Map Lingual operators to C# operators
   */
  private mapOperator(operator: string): string {
    switch (operator) {
      case '==':
        return '==';
      case '!=':
        return '!=';
      case '<':
        return '<';
      case '<=':
        return '<=';
      case '>':
        return '>';
      case '>=':
        return '>=';
      case '+':
        return '+';
      case '-':
        return '-';
      case '*':
        return '*';
      case '/':
        return '/';
      case '%':
        return '%';
      case '&&':
        return '&&';
      case '||':
        return '||';
      default:
        return operator;
    }
  }

  /**
   * Transpile a call expression to C#
   */
  private transpileCallExpression(expr: CallExpression): string {
    // Handle http.get/post/put/delete
    if (expr.callee.type === 'MemberExpression') {
      const member = expr.callee as MemberExpression;
      if (member.object.type === 'Identifier' && member.object.name === 'http') {
        const method = member.property.name.toLowerCase();
        const urlArg = expr.arguments[0] ? this.transpileExpression(expr.arguments[0]) : '""';
        // Use HttpClient for HTTP requests
        switch (method) {
          case 'get':
            return `await new HttpClient().GetAsync(${urlArg})`;
          case 'post':
            return `await new HttpClient().PostAsync(${urlArg}, null)`;
          case 'put':
            return `await new HttpClient().PutAsync(${urlArg}, null)`;
          case 'delete':
            return `await new HttpClient().DeleteAsync(${urlArg})`;
        }
      }
      // Handle response.json()
      if (member.property.name === 'json') {
        // Assume the object is a variable holding the response content as string
        // In real code, you'd want to infer the type, but we'll use 'dynamic' for now
        const responseVar = this.transpileExpression(member.object);
        // If you know the type, replace 'dynamic' with the actual type
        return `JsonConvert.DeserializeObject<dynamic>(${responseVar})`;
      }
    }
    // Fallback to default
    const callee = this.transpileExpression(expr.callee);
    const args = expr.arguments.map(arg => this.transpileExpression(arg)).join(', ');
    return `${callee}(${args})`;
  }

  /**
   * Transpile a member expression to C#
   */
  private transpileMemberExpression(expr: MemberExpression): string {
    // Special case: response.json (as a property, not a call)
    if (expr.property.name === 'json') {
      const responseVar = this.transpileExpression(expr.object);
      return `JsonConvert.DeserializeObject<dynamic>(${responseVar})`;
    }
    // Fallback to default
    const object = this.transpileExpression(expr.object);
    const property = this.transpileIdentifier(expr.property);
    return `${object}.${property}`;
  }

  /**
   * Get indentation string
   */
  private indent(): string {
    return ' '.repeat(this.indentLevel * this.indentSize);
  }
} 