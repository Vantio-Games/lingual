import { Language } from './types.js';
import { CompilerContext } from '../types/index.js';
import { Tokenizer } from '../tokenizer/tokenizer.js';
import { Parser } from '../parser/parser.js';
import { ASTConverter } from '../ast/ast-converter.js';
import { MiddlewareManager } from '../middleware/middleware-manager.js';
import { StandardLibraryManager } from '../standard-library/standard-library.js';

// Import all available languages
import { CSharpLanguage } from './csharp.js';
import { JavaScriptLanguage } from './javascript.js';
import { TypeScriptLanguage } from './typescript.js';
import { GDScriptLanguage } from './gdscript.js';
import { PythonLanguage } from './python.js';

export class LanguageManager {
  private languages: Map<string, Language> = new Map();
  private middlewareManager: MiddlewareManager;
  private standardLibraryManager: StandardLibraryManager;

  constructor() {
    // Initialize managers
    this.middlewareManager = new MiddlewareManager();
    this.standardLibraryManager = new StandardLibraryManager();
    
    // Register all available languages
    this.registerLanguage(new CSharpLanguage());
    this.registerLanguage(new JavaScriptLanguage());
    this.registerLanguage(new TypeScriptLanguage());
    this.registerLanguage(new GDScriptLanguage());
    this.registerLanguage(new PythonLanguage());
  }

  /**
   * Register a new language
   */
  registerLanguage(language: Language): void {
    this.languages.set(language.name, language);
  }

  /**
   * Get all available languages
   */
  getAvailableLanguages(): Record<string, Language> {
    const result: Record<string, Language> = {};
    for (const [name, language] of this.languages) {
      result[name] = language;
    }
    return result;
  }

  /**
   * Get a specific language by name
   */
  getLanguage(name: string): Language | undefined {
    return this.languages.get(name);
  }

  /**
   * Transpile source code to a target language
   */
  async transpile(sourceCode: string, targetLanguage: string, context: CompilerContext): Promise<string> {
    const language = this.getLanguage(targetLanguage);
    if (!language) {
      throw new Error(`Unsupported target language: ${targetLanguage}`);
    }

    // Tokenize the source code
    const tokens = await this.tokenize(sourceCode);
    
    // Parse tokens into CST (Concrete Syntax Tree)
    const cst = await this.parseToCST(tokens);
    
    // Convert CST to AST (Abstract Syntax Tree)
    const ast = await this.convertCSTToAST(cst);
    
    // Apply middleware pipeline
    const processedAST = await this.applyMiddleware(ast, language, context);
    
    // Transpile to target language
    return language.transpile(processedAST, context);
  }

  /**
   * Tokenize source code into tokens
   */
  private async tokenize(sourceCode: string): Promise<any[]> {
    const tokenizer = new Tokenizer(sourceCode);
    return tokenizer.tokenize();
  }

  /**
   * Parse tokens into Concrete Syntax Tree
   */
  private async parseToCST(tokens: any[]): Promise<any> {
    const parser = new Parser(tokens);
    return parser.parse();
  }

  /**
   * Convert CST to Abstract Syntax Tree
   */
  private async convertCSTToAST(cst: any): Promise<any> {
    const converter = new ASTConverter();
    return converter.convertProgram(cst);
  }

  /**
   * Apply middleware pipeline to AST
   */
  private async applyMiddleware(ast: any, language: Language, context: CompilerContext): Promise<any> {
    return this.middlewareManager.applyMiddleware(ast, language.middlewareDependencies, context);
  }

  /**
   * Get standard library manager
   */
  getStandardLibraryManager(): StandardLibraryManager {
    return this.standardLibraryManager;
  }

  /**
   * Get middleware manager
   */
  getMiddlewareManager(): MiddlewareManager {
    return this.middlewareManager;
  }
} 