import { logger } from '../utils/logger.js';

export interface MacroContext {
  parameters: Map<string, any>;
  variables: Map<string, any>;
  functions: Map<string, Function>;
}

export class MacroRuntime {
  private builtinMacros: Map<string, Function> = new Map();
  private customMacros: Map<string, Function> = new Map();

  constructor() {
    this.registerBuiltinMacros();
  }

  /**
   * Register built-in macros
   */
  private registerBuiltinMacros(): void {
    // @upper(text) - converts text to uppercase
    this.builtinMacros.set('upper', (text: string) => {
      return text.toUpperCase();
    });

    // @lower(text) - converts text to lowercase
    this.builtinMacros.set('lower', (text: string) => {
      return text.toLowerCase();
    });

    // @camelCase(text) - converts text to camelCase
    this.builtinMacros.set('camelCase', (text: string) => {
      return text.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    });

    // @pascalCase(text) - converts text to PascalCase
    this.builtinMacros.set('pascalCase', (text: string) => {
      const camel = this.builtinMacros.get('camelCase')!(text);
      return camel.charAt(0).toUpperCase() + camel.slice(1);
    });

    // @snakeCase(text) - converts text to snake_case
    this.builtinMacros.set('snakeCase', (text: string) => {
      return text.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    });

    // @kebabCase(text) - converts text to kebab-case
    this.builtinMacros.set('kebabCase', (text: string) => {
      return text.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    });

    logger.debug('Registered built-in macros:', Array.from(this.builtinMacros.keys()));
  }

  /**
   * Register a custom macro
   */
  registerMacro(name: string, macroFunction: Function): void {
    this.customMacros.set(name, macroFunction);
    logger.debug(`Registered custom macro: ${name}`);
  }

  /**
   * Evaluate an inline macro call
   */
  evaluateMacro(macroName: string, args: any[]): any {
    // Check built-in macros first
    if (this.builtinMacros.has(macroName)) {
      const macro = this.builtinMacros.get(macroName)!;
      return macro(...args);
    }

    // Check custom macros
    if (this.customMacros.has(macroName)) {
      const macro = this.customMacros.get(macroName)!;
      return macro(...args);
    }

    throw new Error(`Undefined macro: ${macroName}`);
  }

  /**
   * Process inline macro calls in a string
   */
  processInlineMacros(text: string): string {
    // Match @macroName(arg1, arg2, ...) pattern
    const macroPattern = /@(\w+)\(([^)]*)\)/g;
    
    return text.replace(macroPattern, (match, macroName, argsString) => {
      try {
        // Parse arguments
        const args = this.parseMacroArguments(argsString);
        
        // Evaluate macro
        const result = this.evaluateMacro(macroName, args);
        
        return String(result);
      } catch (error) {
        logger.warn(`Failed to evaluate macro ${macroName}:`, error);
        return match; // Return original text if macro fails
      }
    });
  }

  /**
   * Parse macro arguments from string
   */
  private parseMacroArguments(argsString: string): any[] {
    if (!argsString.trim()) {
      return [];
    }

    const args: any[] = [];
    let currentArg = '';
    let inQuotes = false;
    let parenDepth = 0;

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      if (char === '"' && (i === 0 || argsString[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
        currentArg += char;
      } else if (char === '(' && !inQuotes) {
        parenDepth++;
        currentArg += char;
      } else if (char === ')' && !inQuotes) {
        parenDepth--;
        currentArg += char;
      } else if (char === ',' && !inQuotes && parenDepth === 0) {
        args.push(this.parseMacroArgument(currentArg.trim()));
        currentArg = '';
      } else {
        currentArg += char;
      }
    }

    if (currentArg.trim()) {
      args.push(this.parseMacroArgument(currentArg.trim()));
    }

    return args;
  }

  /**
   * Parse a single macro argument
   */
  private parseMacroArgument(arg: string): any {
    // String literal
    if (arg.startsWith('"') && arg.endsWith('"')) {
      return arg.slice(1, -1);
    }

    // Number literal
    if (!isNaN(Number(arg))) {
      return Number(arg);
    }

    // Boolean literal
    if (arg === 'true') return true;
    if (arg === 'false') return false;

    // Identifier (variable reference)
    return arg;
  }

  /**
   * Get all available macros
   */
  getAvailableMacros(): string[] {
    return [
      ...Array.from(this.builtinMacros.keys()),
      ...Array.from(this.customMacros.keys())
    ];
  }

  /**
   * Clear all custom macros
   */
  clearCustomMacros(): void {
    this.customMacros.clear();
    logger.debug('Cleared all custom macros');
  }
} 