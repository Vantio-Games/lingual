import { Middleware } from '../languages/types.js';
import { CompilerContext } from '../types/index.js';
import { VariableRenamerMiddleware } from './variable-renamer.js';
import { TypeCheckerMiddleware } from './type-checker.js';
import { HoisterMiddleware } from './hoister.js';

/**
 * Middleware Manager that handles different middleware components
 */
export class MiddlewareManager {
  private middlewares: Map<string, Middleware> = new Map();

  constructor() {
    this.registerDefaultMiddlewares();
  }

  /**
   * Register all default middleware
   */
  private registerDefaultMiddlewares(): void {
    this.registerMiddleware(new VariableRenamerMiddleware());
    this.registerMiddleware(new TypeCheckerMiddleware());
    this.registerMiddleware(new HoisterMiddleware());
  }

  /**
   * Register a new middleware
   */
  registerMiddleware(middleware: Middleware): void {
    this.middlewares.set(middleware.name, middleware);
  }

  /**
   * Get a middleware by name
   */
  getMiddleware(name: string): Middleware | undefined {
    return this.middlewares.get(name);
  }

  /**
   * Get all available middleware
   */
  getAllMiddlewares(): Middleware[] {
    return Array.from(this.middlewares.values());
  }

  /**
   * Apply a list of middleware to an AST
   */
  async applyMiddleware(ast: any, middlewareNames: string[], context: CompilerContext): Promise<any> {
    let processedAST = ast;
    
    for (const middlewareName of middlewareNames) {
      const middleware = this.getMiddleware(middlewareName);
      if (middleware) {
        processedAST = await middleware.process(processedAST, context);
      } else {
        context.warnings.push({
          message: `Middleware '${middlewareName}' not found`,
          code: 'MIDDLEWARE_NOT_FOUND'
        });
      }
    }
    
    return processedAST;
  }
} 