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
  TypeAnnotation,
  MacroCall
} from '../types/index.js';
import { ApiDefinition, TypeDefinition, ModuleDefinition, TypeField } from '../language/features/index.js';
import { StandardLibraryTranspiler } from './standard-library.js';
import { logger } from '../utils/logger.js';

export class TypeScriptTranspiler {
  private indentLevel = 0;
  private indentSize = 2;
  private stdLibTranspiler: StandardLibraryTranspiler;

  constructor() {
    this.indentLevel = 0;
    this.stdLibTranspiler = new StandardLibraryTranspiler('typescript');
  }

  /**
   * Transpile a program to TypeScript
   */
  transpile(program: Program): string {
    logger.debug('Starting TypeScript transpilation');
    // DEBUG: Print the program AST received by the transpiler
    console.log('DEBUG: TypeScriptTranspiler received program:', JSON.stringify(program, null, 2));
    
    const lines: string[] = [];
    
    // Add module imports and setup
    lines.push('// Generated TypeScript code from Lingual');
    lines.push('');
    
    // Add standard library imports
    const stdLibImports = this.stdLibTranspiler.getRequiredImports();
    if (stdLibImports.length > 0) {
      lines.push(...stdLibImports);
      lines.push('');
    }
    
    // Process all statements and organize by type
    const apis: ApiDefinition[] = [];
    const types: TypeDefinition[] = [];
    const modules: ModuleDefinition[] = [];
    const functions: FunctionDeclaration[] = [];
    const variables: VariableDeclaration[] = [];
    const otherStatements: Statement[] = [];

    logger.debug(`Processing ${program.body.length} statements`);
    for (const statement of program.body) {
      logger.debug(`Processing statement type: ${statement.type}`);
      switch (statement.type) {
        case 'ApiDefinition':
          apis.push(statement as ApiDefinition);
          break;
        case 'TypeDefinition':
          logger.debug(`Found TypeDefinition: ${(statement as TypeDefinition).name.name}`);
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
          otherStatements.push(statement);
          break;
        case 'MacroDefinition':
          // Ignore macro definitions in transpilation
          break;
        default:
          logger.warn(`Unknown statement type: ${(statement as any).type}`);
          otherStatements.push(statement);
      }
    }

    logger.debug(`Found ${types.length} type definitions`);

    // Generate type definitions as interfaces/classes
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

    // Generate functions
    for (const func of functions) {
      const transpiled = this.transpileFunctionDeclaration(func);
      if (transpiled) {
        lines.push(transpiled);
        lines.push('');
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

    // Add main execution if there are any statements
    if (otherStatements.length > 0 || variables.length > 0) {
      lines.push('');
      lines.push('// Main execution');
      lines.push('(async (): Promise<void> => {');
      this.indentLevel++;
      
      // Add any variable declarations and statements that should run
      for (const variable of variables) {
        const transpiled = this.transpileVariableDeclaration(variable);
        if (transpiled) {
          lines.push(this.indent() + transpiled);
        }
      }
      
      for (const statement of otherStatements) {
        const transpiled = this.transpileStatement(statement);
        if (transpiled !== undefined) {
          lines.push(this.indent() + transpiled);
        }
      }
      
      this.indentLevel--;
      lines.push('})();');
    }
    
    const result = lines.join('\n');
    logger.success('TypeScript transpilation completed');
    return result;
  }

  /**
   * Transpile a type definition to TypeScript interface/class
   */
  private transpileTypeDefinition(type: TypeDefinition): string {
    logger.debug(`Transpiling type definition: ${type.name.name} with ${type.fields?.length || 0} fields`);
    const lines: string[] = [];
    
    // Generate interface
    lines.push(`interface ${type.name.name} {`);
    this.indentLevel++;

    if (type.fields && type.fields.length > 0) {
      for (const field of type.fields) {
        logger.debug(`Processing field: ${field.name.name}`);
        const tsType = this.mapTypeToTypeScript(field.typeAnnotation);
        const optional = field.required ? '' : '?';
        lines.push(this.indent() + `${field.name.name}${optional}: ${tsType};`);
      }
    }

    this.indentLevel--;
    lines.push('}');
    
    // Generate class implementation
    lines.push('');
    lines.push(`class ${type.name.name}Impl implements ${type.name.name} {`);
    this.indentLevel++;

    // Generate properties
    if (type.fields && type.fields.length > 0) {
      for (const field of type.fields) {
        const tsType = this.mapTypeToTypeScript(field.typeAnnotation);
        const optional = field.required ? '' : '?';
        lines.push(this.indent() + `${field.name.name}${optional}: ${tsType};`);
      }
      lines.push('');

      // Generate constructor
      const params = type.fields.map(field => `${field.name.name}: ${this.mapTypeToTypeScript(field.typeAnnotation)}`).join(', ');
      lines.push(this.indent() + `constructor(${params}) {`);
      this.indentLevel++;
      
      for (const field of type.fields) {
        lines.push(this.indent() + `this.${field.name.name} = ${field.name.name};`);
      }
      
      this.indentLevel--;
      lines.push(this.indent() + '}');
    } else {
      lines.push(this.indent() + 'constructor() {}');
    }

    this.indentLevel--;
    lines.push('}');
    
    return lines.join('\n');
  }

  /**
   * Transpile API definitions to TypeScript fetch wrapper
   */
  private transpileApiClient(apis: ApiDefinition[]): string {
    const lines: string[] = [];
    
    lines.push('class ApiClient {');
    this.indentLevel++;
    
    lines.push(this.indent() + 'private baseUrl: string;');
    lines.push('');
    lines.push(this.indent() + 'constructor(baseUrl: string = "") {');
    lines.push(this.indent() + '    this.baseUrl = baseUrl;');
    lines.push(this.indent() + '}');
    lines.push('');

    // Generate API methods
    for (const api of apis) {
      lines.push(this.transpileApiMethod(api));
      lines.push('');
    }

    this.indentLevel--;
    lines.push('}');
    
    return lines.join('\n');
  }

  /**
   * Transpile an API method
   */
  private transpileApiMethod(api: ApiDefinition): string {
    const methodName = api.name.name;
    const lines: string[] = [];
    
    // For now, create a basic async method structure
    lines.push(this.indent() + `async ${methodName}(): Promise<any> {`);
    this.indentLevel++;
    lines.push(this.indent() + '// TODO: Implement API method');
    lines.push(this.indent() + 'throw new Error("API method not implemented");');
    this.indentLevel--;
    lines.push(this.indent() + '}');
    
    return lines.join('\n');
  }

  /**
   * Transpile a module definition
   */
  private transpileModule(module: ModuleDefinition): string {
    const lines: string[] = [];
    
    lines.push(`// Module: ${module.name.name}`);
    lines.push('// TODO: Implement module functionality');
    
    return lines.join('\n');
  }

  /**
   * Transpile a function declaration
   */
  private transpileFunctionDeclaration(func: FunctionDeclaration): string {
    const lines: string[] = [];
    
    // Check if function contains HTTP operations
    const hasHttpOps = this.hasHttpOperations(func.body);
    const asyncKeyword = hasHttpOps ? 'async ' : '';
    
    const name = func.name.name;
    const params = func.parameters.map(param => {
      const paramName = param.name.name;
      const typeAnnotation = param.typeAnnotation ? `: ${this.mapTypeToTypeScript(param.typeAnnotation)}` : '';
      return `${paramName}${typeAnnotation}`;
    }).join(', ');
    
    const returnType = func.returnType ? `: ${this.mapTypeToTypeScript(func.returnType)}` : '';
    
    lines.push(`${asyncKeyword}function ${name}(${params})${returnType} {`);
    this.indentLevel++;
    
    // Transpile function body
    for (const statement of func.body) {
      const transpiled = this.transpileStatement(statement);
      if (transpiled) {
        lines.push(this.indent() + transpiled);
      }
    }
    
    this.indentLevel--;
    lines.push('}');
    
    return lines.join('\n');
  }

  private hasHttpOperations(body: Statement[]): boolean {
    for (const statement of body) {
      if (statement.type === 'ExpressionStatement') {
        const expr = (statement as ExpressionStatement).expression;
        if (expr.type === 'MacroCall' || this.isStandardLibraryCall(expr)) {
          return true;
        }
      } else if (statement.type === 'VariableDeclaration') {
        const decl = statement as VariableDeclaration;
        if (decl.initializer) {
          if (decl.initializer.type === 'MacroCall' || this.isStandardLibraryCall(decl.initializer)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private isStandardLibraryCall(expr: Expression): boolean {
    if (expr.type === 'CallExpression') {
      const callExpr = expr as CallExpression;
      const callee = callExpr.callee;
      
      if (callee.type === 'MemberExpression') {
        const memberExpr = callee as MemberExpression;
        const objectExpr = memberExpr.object;
        const functionName = memberExpr.property.name;
        
        // Check if this is a static standard library function that requires async
        if (objectExpr.type === 'Identifier') {
          const objectName = this.transpileIdentifier(objectExpr as Identifier);
          if (this.stdLibTranspiler.isAsyncFunction(objectName, functionName)) {
            return true;
          }
        }
        
        // Check if this is an object method call that requires async
        const objectStr = this.transpileExpression(objectExpr);
        if (this.stdLibTranspiler.isAsyncObjectMethod(objectStr, functionName)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Transpile a variable declaration
   */
  private transpileVariableDeclaration(decl: VariableDeclaration): string {
    const name = decl.name.name;
    const typeAnnotation = decl.typeAnnotation ? `: ${this.mapTypeToTypeScript(decl.typeAnnotation)}` : '';
    const initializer = decl.initializer ? ` = ${this.transpileExpression(decl.initializer)}` : '';
    
    return `const ${name}${typeAnnotation}${initializer};`;
  }

  /**
   * Transpile a statement
   */
  private transpileStatement(statement: Statement): string | undefined {
    switch (statement.type) {
      case 'ExpressionStatement':
        return this.transpileExpressionStatement(statement as ExpressionStatement);
      case 'ReturnStatement':
        return this.transpileReturnStatement(statement as ReturnStatement);
      case 'IfStatement':
        return this.transpileIfStatement(statement as IfStatement);
      case 'VariableDeclaration':
        return this.transpileVariableDeclaration(statement as VariableDeclaration);
      case 'MacroCall':
        return this.transpileMacroCall(statement as MacroCall);
      default:
        logger.warn(`Unsupported statement type: ${statement.type}`);
        return undefined;
    }
  }

  /**
   * Transpile a macro call
   */
  private transpileMacroCall(macroCall: MacroCall): string {
    const macroName = macroCall.name.name;
    const args = macroCall.arguments.map(arg => this.transpileExpression(arg)).join(', ');
    
    // Handle specific macros with better language-specific implementations
    switch (macroName) {
      case 'fetch':
        return `await fetch(${args})`;
      case 'json':
        return `await ${args}.json()`;
      default:
        // For other macros, just call them as functions
        return `${macroName}(${args})`;
    }
  }

  /**
   * Transpile an expression statement
   */
  private transpileExpressionStatement(stmt: ExpressionStatement): string {
    const expr = this.transpileExpression(stmt.expression);
    return `${expr};`;
  }

  /**
   * Transpile a return statement
   */
  private transpileReturnStatement(stmt: ReturnStatement): string {
    if (stmt.expression) {
      const expr = this.transpileExpression(stmt.expression);
      return `return ${expr};`;
    } else {
      return 'return;';
    }
  }

  /**
   * Transpile an if statement
   */
  private transpileIfStatement(stmt: IfStatement): string {
    const lines: string[] = [];
    
    const condition = this.transpileExpression(stmt.condition);
    lines.push(`if (${condition}) {`);
    this.indentLevel++;
    
    const thenStmt = this.transpileStatement(stmt.thenStatement);
    if (thenStmt) {
      lines.push(this.indent() + thenStmt);
    }
    
    this.indentLevel--;
    
    if (stmt.elseStatement) {
      lines.push('} else {');
      this.indentLevel++;
      
      const elseStmt = this.transpileStatement(stmt.elseStatement);
      if (elseStmt) {
        lines.push(this.indent() + elseStmt);
      }
      
      this.indentLevel--;
    }
    
    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Transpile an expression
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
      case 'MacroCall':
        return this.transpileMacroCall(expr as MacroCall);
      default:
        logger.warn(`Unsupported expression type: ${(expr as any).type}`);
        return 'undefined';
    }
  }

  private transpileMemberExpression(expr: MemberExpression): string {
    const object = this.transpileExpression(expr.object);
    const property = expr.property.name;
    
    return `${object}.${property}`;
  }

  /**
   * Transpile an identifier
   */
  private transpileIdentifier(ident: Identifier): string {
    return ident.name;
  }

  /**
   * Transpile a literal
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
   * Transpile a binary expression
   */
  private transpileBinaryExpression(expr: BinaryExpression): string {
    const left = this.transpileExpression(expr.left);
    const right = this.transpileExpression(expr.right);
    const operator = this.mapOperator(expr.operator);
    
    return `(${left} ${operator} ${right})`;
  }

  /**
   * Map operators to TypeScript equivalents
   */
  private mapOperator(operator: string): string {
    const operatorMap: { [key: string]: string } = {
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '%': '%',
      '==': '===',
      '!=': '!==',
      '<': '<',
      '>': '>',
      '<=': '<=',
      '>=': '>=',
      '&&': '&&',
      '||': '||',
      '=': '='
    };
    
    return operatorMap[operator] || operator;
  }

  /**
   * Transpile a call expression
   */
  private transpileCallExpression(expr: CallExpression): string {
    // Debug logging
    console.log('DEBUG: transpileCallExpression called with:', JSON.stringify(expr, null, 2));
    
    // Use the standard library transpiler for deep processing
    const result = this.stdLibTranspiler.transpileCallExpression(expr, (expr) => this.transpileExpression(expr));
    console.log('DEBUG: transpileCallExpression result:', result);
    return result;
  }

  /**
   * Map types to TypeScript equivalents
   */
  private mapTypeToTypeScript(typeAnnotation?: TypeAnnotation): string {
    if (!typeAnnotation) {
      return 'any';
    }

    const typeName = typeAnnotation.typeName.name;
    const isNullable = typeAnnotation.isNullable;
    
    const typeMap: { [key: string]: string } = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'int': 'number',
      'float': 'number',
      'double': 'number',
      'void': 'void',
      'any': 'any',
      'object': 'object',
      'array': 'any[]',
      'list': 'any[]',
      'map': 'Record<string, any>',
      'dictionary': 'Record<string, any>'
    };
    
    let tsType = typeMap[typeName] || typeName;
    
    // Handle nullable types
    if (isNullable) {
      tsType = `${tsType} | null`;
    }
    
    // Handle generic types
    if (typeAnnotation.genericArguments && typeAnnotation.genericArguments.length > 0) {
      const genericArgs = typeAnnotation.genericArguments.map(arg => this.mapTypeToTypeScript(arg)).join(', ');
      tsType = `${tsType}<${genericArgs}>`;
    }
    
    return tsType;
  }

  /**
   * Generate indentation
   */
  private indent(): string {
    return ' '.repeat(this.indentLevel * this.indentSize);
  }
} 