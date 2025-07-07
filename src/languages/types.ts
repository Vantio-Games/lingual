import { CompilerContext } from '../types/index.js';

/**
 * Standard library function mapping for transpilation
 */
export interface StandardLibraryMapping {
  /** The original function call pattern (e.g., "http.get") */
  pattern: string;
  /** Language-specific transpilation template */
  template: string;
  /** Whether this is an async function */
  async?: boolean;
  /** Required imports for this function */
  imports?: string[];
}

/**
 * Standard library property mapping for transpilation
 */
export interface StandardLibraryPropertyMapping {
  /** The original property access pattern (e.g., "response.json") */
  pattern: string;
  /** Language-specific transpilation template */
  template: string;
  /** Whether this requires parentheses (for method calls) */
  isMethod?: boolean;
}

/**
 * Interface for a target language
 */
export interface Language {
  /** Unique name for the language */
  name: string;
  
  /** Human-readable name */
  displayName: string;
  
  /** Description of the language */
  description: string;
  
  /** Emoji representation */
  emoji: string;
  
  /** Version of the language support */
  version: string;
  
  /** List of middleware dependencies in order of application */
  middlewareDependencies: string[];
  
  /**
   * Transpile AST to target language code
   */
  transpile(ast: any, context: CompilerContext): string;

  /**
   * Generate package files for the language
   */
  generatePackageFiles(outputDir: string, baseFileName: string): Promise<void>;

  /**
   * Get standard library function mappings for this language
   */
  getStandardLibraryMappings(): StandardLibraryMapping[];

  /**
   * Get standard library property mappings for this language
   */
  getStandardLibraryPropertyMappings(): StandardLibraryPropertyMapping[];
}

/**
 * Interface for middleware
 */
export interface Middleware {
  /** Unique name for the middleware */
  name: string;
  
  /** Description of what the middleware does */
  description: string;
  
  /**
   * Process the AST
   */
  process(ast: any, context: CompilerContext): Promise<any>;
}

/**
 * Interface for standard library functions
 */
export interface StandardLibraryFunction {
  /** Function name */
  name: string;
  
  /** Function signature */
  signature: string;
  
  /** Description of what the function does */
  description: string;
  
  /** Supported languages */
  supportedLanguages: string[];
  
  /**
   * Validate function call
   */
  validate(call: any, context: CompilerContext): boolean;
} 