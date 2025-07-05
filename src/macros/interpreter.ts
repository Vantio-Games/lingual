import { 
  MacroDefinition, 
  MacroCall, 
  Statement, 
  Expression, 
  Identifier,
  Parameter,
  CompilerContext
} from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface MacroEnvironment {
  parameters: Map<string, Expression>;
  variables: Map<string, any>;
}

export class MacroInterpreter {
  private macros: Map<string, MacroDefinition> = new Map();
  private context: CompilerContext;

  constructor(context: CompilerContext) {
    this.context = context;
  }

  /**
   * Register a macro definition
   */
  registerMacro(macro: MacroDefinition): void {
    this.macros.set(macro.name.name, macro);
    logger.debug(`Registered macro: ${macro.name.name}`);
  }

  /**
   * Expand a macro call
   */
  expandMacro(macroCall: MacroCall): Statement[] {
    const macroName = macroCall.name.name;
    const macro = this.macros.get(macroName);
    
    if (!macro) {
      this.context.errors.push({
        message: `Undefined macro: ${macroName}`,
        code: 'UNDEFINED_MACRO'
      });
      return [];
    }

    if (macroCall.arguments.length !== macro.parameters.length) {
      this.context.errors.push({
        message: `Macro ${macroName} expects ${macro.parameters.length} arguments, got ${macroCall.arguments.length}`,
        code: 'MACRO_ARGUMENT_MISMATCH'
      });
      return [];
    }

    // Create parameter mapping
    const env: MacroEnvironment = {
      parameters: new Map(),
      variables: new Map()
    };

    for (let i = 0; i < macro.parameters.length; i++) {
      const paramName = macro.parameters[i].name.name;
      const argValue = macroCall.arguments[i];
      env.parameters.set(paramName, argValue);
    }

    // Expand macro body with parameter substitution
    return this.expandStatements(macro.body, env);
  }

  /**
   * Expand a list of statements with macro substitution
   */
  private expandStatements(statements: Statement[], env: MacroEnvironment): Statement[] {
    const expanded: Statement[] = [];

    for (const statement of statements) {
      switch (statement.type) {
        case 'MacroCall': {
          const macroCall = statement as MacroCall;
          const expandedStatements = this.expandMacro(macroCall);
          expanded.push(...expandedStatements);
          break;
        }
        case 'MacroDefinition':
        case 'ApiDefinition':
        case 'TypeDefinition':
        case 'ModuleDefinition':
          expanded.push(statement);
          break;
        default: {
          // Recursively expand nested macro calls in the statement
          const expandedStatement = this.expandStatement(statement, env);
          if (expandedStatement) {
            expanded.push(expandedStatement);
          }
        }
      }
    }

    return expanded;
  }

  /**
   * Expand a single statement with macro substitution
   */
  private expandStatement(statement: Statement, env: MacroEnvironment): Statement | null {
    switch (statement.type) {
      case 'FunctionDeclaration':
        return this.expandFunctionDeclaration(statement, env);
      case 'VariableDeclaration':
        return this.expandVariableDeclaration(statement, env);
      case 'ExpressionStatement':
        return this.expandExpressionStatement(statement, env);
      case 'ReturnStatement':
        return this.expandReturnStatement(statement, env);
      case 'IfStatement':
        return this.expandIfStatement(statement, env);
      default:
        return statement;
    }
  }

  /**
   * Expand a function declaration
   */
  private expandFunctionDeclaration(func: any, env: MacroEnvironment): any {
    return {
      ...func,
      body: this.expandStatements(func.body, env)
    };
  }

  /**
   * Expand a variable declaration
   */
  private expandVariableDeclaration(decl: any, env: MacroEnvironment): any {
    if (decl.initializer) {
      return {
        ...decl,
        initializer: this.expandExpression(decl.initializer, env)
      };
    }
    return decl;
  }

  /**
   * Expand an expression statement
   */
  private expandExpressionStatement(stmt: any, env: MacroEnvironment): any {
    return {
      ...stmt,
      expression: this.expandExpression(stmt.expression, env)
    };
  }

  /**
   * Expand a return statement
   */
  private expandReturnStatement(stmt: any, env: MacroEnvironment): any {
    if (stmt.expression) {
      return {
        ...stmt,
        expression: this.expandExpression(stmt.expression, env)
      };
    }
    return stmt;
  }

  /**
   * Expand an if statement
   */
  private expandIfStatement(stmt: any, env: MacroEnvironment): any {
    const expanded = {
      ...stmt,
      condition: this.expandExpression(stmt.condition, env),
      thenStatement: this.expandStatement(stmt.thenStatement, env)
    };

    if (stmt.elseStatement) {
      expanded.elseStatement = this.expandStatement(stmt.elseStatement, env);
    }

    return expanded;
  }

  /**
   * Expand an expression with parameter substitution
   */
  private expandExpression(expr: Expression, env: MacroEnvironment): Expression {
    switch (expr.type) {
      case 'Identifier':
        return this.expandIdentifier(expr as Identifier, env);
      case 'BinaryExpression':
        return this.expandBinaryExpression(expr as any, env);
      case 'CallExpression':
        return this.expandCallExpression(expr as any, env);
      case 'MemberExpression':
        return this.expandMemberExpression(expr as any, env);
      default:
        return expr;
    }
  }

  /**
   * Expand an identifier (check for parameter substitution)
   */
  private expandIdentifier(ident: Identifier, env: MacroEnvironment): Expression {
    const paramValue = env.parameters.get(ident.name);
    if (paramValue) {
      return paramValue;
    }
    return ident;
  }

  /**
   * Expand a binary expression
   */
  private expandBinaryExpression(expr: any, env: MacroEnvironment): any {
    return {
      ...expr,
      left: this.expandExpression(expr.left, env),
      right: this.expandExpression(expr.right, env)
    };
  }

  /**
   * Expand a call expression
   */
  private expandCallExpression(expr: any, env: MacroEnvironment): any {
    return {
      ...expr,
      callee: this.expandExpression(expr.callee, env),
      arguments: expr.arguments.map((arg: Expression) => this.expandExpression(arg, env))
    };
  }

  /**
   * Expand a member expression
   */
  private expandMemberExpression(expr: any, env: MacroEnvironment): any {
    return {
      ...expr,
      object: this.expandExpression(expr.object, env)
    };
  }

  /**
   * Process a program and expand all macros
   */
  processProgram(program: any): any {
    logger.debug('Processing program for macro expansion');
    
    // First pass: collect all macro definitions
    for (const statement of program.body) {
      if (statement.type === 'MacroDefinition') {
        this.registerMacro(statement as MacroDefinition);
      }
    }

    // Second pass: expand macro calls
    const expandedBody = this.expandStatements(program.body, {
      parameters: new Map(),
      variables: new Map()
    });

    return {
      ...program,
      body: expandedBody
    };
  }

  /**
   * Get all registered macros
   */
  getMacros(): Map<string, MacroDefinition> {
    return new Map(this.macros);
  }

  /**
   * Clear all registered macros
   */
  clearMacros(): void {
    this.macros.clear();
  }
} 