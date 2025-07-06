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
import { ApiDefinition, TypeDefinition, ModuleDefinition } from '../language/features/index.js';
import { logger } from '../utils/logger.js';

export class JavaScriptTranspiler {
  private indentLevel = 0;
  private indentSize = 2;

  constructor() {
    this.indentLevel = 0;
  }

  /**
   * Transpile a program to JavaScript
   */
  transpile(program: Program): string {
    logger.debug('Starting JavaScript transpilation');
    
    const lines: string[] = [];
    
    // Add module imports and setup
    lines.push('// Generated JavaScript code from Lingual');
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

    // Generate type definitions as classes
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
      lines.push('(async () => {');
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
    logger.success('JavaScript transpilation completed');
    return result;
  }

  /**
   * Transpile a type definition to JavaScript class
   */
  private transpileTypeDefinition(type: TypeDefinition): string {
    const lines: string[] = [];
    
    lines.push(`class ${type.name.name} {`);
    this.indentLevel++;

    // Generate constructor
    if (type.fields && type.fields.length > 0) {
      const params = type.fields.map(field => field.name.name).join(', ');
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
   * Transpile API definitions to JavaScript fetch wrapper
   */
  private transpileApiClient(apis: ApiDefinition[]): string {
    const lines: string[] = [];
    
    lines.push('class ApiClient {');
    this.indentLevel++;
    
    lines.push(this.indent() + 'constructor(baseUrl = "") {');
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
    lines.push(this.indent() + `async ${methodName}() {`);
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
    
    // Generate function signature
    const params = func.parameters.map(param => param.name.name).join(', ');
    const functionName = func.name.name;
    
    lines.push(`function ${functionName}(${params}) {`);
    this.indentLevel++;

    // Generate function body
    for (const statement of func.body) {
      const transpiled = this.transpileStatement(statement);
      if (transpiled !== undefined) {
        lines.push(this.indent() + transpiled);
      }
    }

    this.indentLevel--;
    lines.push('}');
    
    return lines.join('\n');
  }

  /**
   * Transpile a variable declaration
   */
  private transpileVariableDeclaration(decl: VariableDeclaration): string {
    const varName = decl.name.name;
    
    if (decl.initializer) {
      const initializer = this.transpileExpression(decl.initializer);
      return `let ${varName} = ${initializer};`;
    } else {
      return `let ${varName};`;
    }
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
    
    // Handle specific macros
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
      default:
        logger.warn(`Unsupported expression type: ${(expr as any).type}`);
        return 'undefined';
    }
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
   * Map operators to JavaScript equivalents
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
    const callee = this.transpileExpression(expr.callee);
    const args = expr.arguments.map(arg => this.transpileExpression(arg)).join(', ');
    
    return `${callee}(${args})`;
  }

  /**
   * Transpile a member expression
   */
  private transpileMemberExpression(expr: MemberExpression): string {
    const object = this.transpileExpression(expr.object);
    const property = expr.property.name;
    
    return `${object}.${property}`;
  }

  /**
   * Generate indentation
   */
  private indent(): string {
    return ' '.repeat(this.indentLevel * this.indentSize);
  }
} 