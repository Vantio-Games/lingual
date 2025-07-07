import { StandardLibraryFunction } from '../languages/types.js';
import { CompilerContext } from '../types/index.js';

/**
 * Standard Library Manager that provides common functions
 */
export class StandardLibraryManager {
  private functions: Map<string, StandardLibraryFunction> = new Map();

  constructor() {
    this.registerStandardFunctions();
  }

  /**
   * Register all standard library functions
   */
  private registerStandardFunctions(): void {
    // Console functions
    this.registerFunction({
      name: 'console.log',
      signature: 'console.log(...args: any[]): void',
      description: 'Prints arguments to the console',
      supportedLanguages: ['javascript', 'typescript', 'csharp', 'python', 'go'],
      validate: (call, context) => {
        // Basic validation - ensure it's a console.log call
        return call.type === 'CallExpression' && 
               call.callee.type === 'MemberExpression' &&
               call.callee.object.name === 'console' &&
               call.callee.property.name === 'log';
      }
    });

    this.registerFunction({
      name: 'console.error',
      signature: 'console.error(...args: any[]): void',
      description: 'Prints error arguments to the console',
      supportedLanguages: ['javascript', 'typescript', 'csharp', 'python', 'go'],
      validate: (call, context) => {
        return call.type === 'CallExpression' && 
               call.callee.type === 'MemberExpression' &&
               call.callee.object.name === 'console' &&
               call.callee.property.name === 'error';
      }
    });

    this.registerFunction({
      name: 'console.warn',
      signature: 'console.warn(...args: any[]): void',
      description: 'Prints warning arguments to the console',
      supportedLanguages: ['javascript', 'typescript', 'csharp', 'python', 'go'],
      validate: (call, context) => {
        return call.type === 'CallExpression' && 
               call.callee.type === 'MemberExpression' &&
               call.callee.object.name === 'console' &&
               call.callee.property.name === 'warn';
      }
    });

    // HTTP functions
    this.registerFunction({
      name: 'http.get',
      signature: 'http.get(url: string): Promise<Response>',
      description: 'Makes an HTTP GET request',
      supportedLanguages: ['javascript', 'typescript', 'csharp', 'python', 'go'],
      validate: (call, context) => {
        return call.type === 'CallExpression' && 
               call.callee.type === 'MemberExpression' &&
               call.callee.object.name === 'http' &&
               call.callee.property.name === 'get';
      }
    });

    this.registerFunction({
      name: 'http.post',
      signature: 'http.post(url: string, data?: any): Promise<Response>',
      description: 'Makes an HTTP POST request',
      supportedLanguages: ['javascript', 'typescript', 'csharp', 'python', 'go'],
      validate: (call, context) => {
        return call.type === 'CallExpression' && 
               call.callee.type === 'MemberExpression' &&
               call.callee.object.name === 'http' &&
               call.callee.property.name === 'post';
      }
    });

    // Math functions
    this.registerFunction({
      name: 'Math.random',
      signature: 'Math.random(): number',
      description: 'Returns a random number between 0 and 1',
      supportedLanguages: ['javascript', 'typescript', 'csharp', 'python', 'go'],
      validate: (call, context) => {
        return call.type === 'CallExpression' && 
               call.callee.type === 'MemberExpression' &&
               call.callee.object.name === 'Math' &&
               call.callee.property.name === 'random';
      }
    });

    this.registerFunction({
      name: 'Math.floor',
      signature: 'Math.floor(x: number): number',
      description: 'Returns the largest integer less than or equal to x',
      supportedLanguages: ['javascript', 'typescript', 'csharp', 'python', 'go'],
      validate: (call, context) => {
        return call.type === 'CallExpression' && 
               call.callee.type === 'MemberExpression' &&
               call.callee.object.name === 'Math' &&
               call.callee.property.name === 'floor';
      }
    });

    this.registerFunction({
      name: 'Math.ceil',
      signature: 'Math.ceil(x: number): number',
      description: 'Returns the smallest integer greater than or equal to x',
      supportedLanguages: ['javascript', 'typescript', 'csharp', 'python', 'go'],
      validate: (call, context) => {
        return call.type === 'CallExpression' && 
               call.callee.type === 'MemberExpression' &&
               call.callee.object.name === 'Math' &&
               call.callee.property.name === 'ceil';
      }
    });

    // String functions
    this.registerFunction({
      name: 'String.length',
      signature: 'string.length: number',
      description: 'Returns the length of a string',
      supportedLanguages: ['javascript', 'typescript', 'csharp', 'python', 'go'],
      validate: (call, context) => {
        return call.type === 'MemberExpression' &&
               call.property.name === 'length';
      }
    });

    // Array functions
    this.registerFunction({
      name: 'Array.push',
      signature: 'array.push(...items: any[]): number',
      description: 'Adds elements to the end of an array',
      supportedLanguages: ['javascript', 'typescript', 'csharp', 'python', 'go'],
      validate: (call, context) => {
        return call.type === 'CallExpression' && 
               call.callee.type === 'MemberExpression' &&
               call.callee.property.name === 'push';
      }
    });

    this.registerFunction({
      name: 'Array.pop',
      signature: 'array.pop(): any',
      description: 'Removes and returns the last element of an array',
      supportedLanguages: ['javascript', 'typescript', 'csharp', 'python', 'go'],
      validate: (call, context) => {
        return call.type === 'CallExpression' && 
               call.callee.type === 'MemberExpression' &&
               call.callee.property.name === 'pop';
      }
    });
  }

  /**
   * Register a standard library function
   */
  registerFunction(func: StandardLibraryFunction): void {
    this.functions.set(func.name, func);
  }

  /**
   * Get a standard library function by name
   */
  getFunction(name: string): StandardLibraryFunction | undefined {
    return this.functions.get(name);
  }

  /**
   * Get all standard library functions
   */
  getAllFunctions(): StandardLibraryFunction[] {
    return Array.from(this.functions.values());
  }

  /**
   * Get functions supported by a specific language
   */
  getFunctionsForLanguage(language: string): StandardLibraryFunction[] {
    return this.getAllFunctions().filter(func => 
      func.supportedLanguages.includes(language)
    );
  }

  /**
   * Validate a function call against the standard library
   */
  validateFunctionCall(call: any, context: CompilerContext): boolean {
    // Try to identify the function being called
    const functionName = this.identifyFunctionName(call);
    if (!functionName) {
      return false;
    }

    const func = this.getFunction(functionName);
    if (!func) {
      return false;
    }

    return func.validate(call, context);
  }

  /**
   * Identify the function name from a call expression
   */
  private identifyFunctionName(call: any): string | null {
    if (call.type === 'CallExpression') {
      if (call.callee.type === 'Identifier') {
        return call.callee.name;
      } else if (call.callee.type === 'MemberExpression') {
        const object = this.getMemberExpressionName(call.callee.object);
        const property = call.callee.property.name;
        return `${object}.${property}`;
      }
    } else if (call.type === 'MemberExpression') {
      const object = this.getMemberExpressionName(call.object);
      const property = call.property.name;
      return `${object}.${property}`;
    }
    
    return null;
  }

  /**
   * Get the name from a member expression object
   */
  private getMemberExpressionName(node: any): string {
    if (node.type === 'Identifier') {
      return node.name;
    } else if (node.type === 'MemberExpression') {
      const object = this.getMemberExpressionName(node.object);
      const property = node.property.name;
      return `${object}.${property}`;
    }
    return 'unknown';
  }

  /**
   * Get transpilation hints for a function call
   */
  getTranspilationHints(functionName: string, targetLanguage: string): any {
    const func = this.getFunction(functionName);
    if (!func || !func.supportedLanguages.includes(targetLanguage)) {
      return null;
    }

    // Return language-specific transpilation hints
    const hints: Record<string, any> = {
      javascript: {
        'console.log': 'console.log',
        'console.error': 'console.error',
        'console.warn': 'console.warn',
        'http.get': 'fetch',
        'http.post': 'fetch',
        'Math.random': 'Math.random',
        'Math.floor': 'Math.floor',
        'Math.ceil': 'Math.ceil'
      },
      typescript: {
        'console.log': 'console.log',
        'console.error': 'console.error',
        'console.warn': 'console.warn',
        'http.get': 'fetch',
        'http.post': 'fetch',
        'Math.random': 'Math.random',
        'Math.floor': 'Math.floor',
        'Math.ceil': 'Math.ceil'
      },
      csharp: {
        'console.log': 'Console.WriteLine',
        'console.error': 'Console.Error.WriteLine',
        'console.warn': 'Console.WriteLine',
        'http.get': 'HttpClient.GetAsync',
        'http.post': 'HttpClient.PostAsync',
        'Math.random': 'Random.NextDouble',
        'Math.floor': 'Math.Floor',
        'Math.ceil': 'Math.Ceiling'
      },
      python: {
        'console.log': 'print',
        'console.error': 'print',
        'console.warn': 'print',
        'http.get': 'requests.get',
        'http.post': 'requests.post',
        'Math.random': 'random.random',
        'Math.floor': 'math.floor',
        'Math.ceil': 'math.ceil'
      },
      go: {
        'console.log': 'fmt.Println',
        'console.error': 'fmt.Fprintf(os.Stderr, ...)',
        'console.warn': 'fmt.Println',
        'http.get': 'http.Get',
        'http.post': 'http.Post',
        'Math.random': 'rand.Float64',
        'Math.floor': 'math.Floor',
        'Math.ceil': 'math.Ceil'
      }
    };

    return hints[targetLanguage]?.[functionName] || null;
  }
} 