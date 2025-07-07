import { Middleware } from '../languages/types.js';
import { CompilerContext } from '../types/index.js';

/**
 * Hoister Middleware
 * Moves variable and function declarations to the top of their scope
 */
export class HoisterMiddleware implements Middleware {
  name = 'hoister';
  description = 'Moves variable and function declarations to the top of their scope';

  async process(ast: any, context: CompilerContext): Promise<any> {
    return this.hoistDeclarations(ast);
  }

  /**
   * Hoist declarations in the AST
   */
  private hoistDeclarations(ast: any): any {
    if (!ast || typeof ast !== 'object') {
      return ast;
    }

    switch (ast.type) {
      case 'Program':
        return this.hoistProgram(ast);
      case 'BlockStatement':
        return this.hoistBlockStatement(ast);
      case 'FunctionDeclaration':
        return this.hoistFunctionDeclaration(ast);
      default:
        return this.processNodeRecursively(ast);
    }
  }

  /**
   * Hoist declarations in a program
   */
  private hoistProgram(program: any): any {
    const hoistedDeclarations: any[] = [];
    const otherStatements: any[] = [];

    // Separate declarations from other statements
    for (const statement of program.body) {
      if (this.isDeclaration(statement)) {
        hoistedDeclarations.push(statement);
      } else {
        otherStatements.push(statement);
      }
    }

    return {
      ...program,
      body: [...hoistedDeclarations, ...otherStatements]
    };
  }

  /**
   * Hoist declarations in a block statement
   */
  private hoistBlockStatement(block: any): any {
    const hoistedDeclarations: any[] = [];
    const otherStatements: any[] = [];

    // Separate declarations from other statements
    for (const statement of block.body) {
      if (this.isDeclaration(statement)) {
        hoistedDeclarations.push(statement);
      } else {
        otherStatements.push(statement);
      }
    }

    return {
      ...block,
      body: [...hoistedDeclarations, ...otherStatements]
    };
  }

  /**
   * Hoist declarations in a function declaration
   */
  private hoistFunctionDeclaration(func: any): any {
    return {
      ...func,
      body: this.hoistBlockStatement(func.body)
    };
  }

  /**
   * Process a node recursively
   */
  private processNodeRecursively(node: any): any {
    if (!node || typeof node !== 'object') {
      return node;
    }

    const processedNode: any = {};
    for (const [key, value] of Object.entries(node)) {
      if (Array.isArray(value)) {
        processedNode[key] = value.map((item: any) => this.hoistDeclarations(item));
      } else if (typeof value === 'object' && value !== null) {
        processedNode[key] = this.hoistDeclarations(value);
      } else {
        processedNode[key] = value;
      }
    }
    return processedNode;
  }

  /**
   * Check if a statement is a declaration
   */
  private isDeclaration(statement: any): boolean {
    return statement.type === 'VariableDeclaration' || 
           statement.type === 'FunctionDeclaration';
  }
} 