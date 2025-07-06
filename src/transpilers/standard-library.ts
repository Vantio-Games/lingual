import { CallExpression, MemberExpression, Expression, Identifier } from '../types/index.js';
import { getStandardLibraryImplementation, findStandardLibraryFunction } from '../language/features/standard-library.js';

export interface TranspilationContext {
  targetLanguage: string;
  indentLevel: number;
  indentSize: number;
}

export class StandardLibraryTranspiler {
  private context: TranspilationContext;

  constructor(targetLanguage: string) {
    this.context = {
      targetLanguage,
      indentLevel: 0,
      indentSize: 2
    };
  }

  /**
   * Transpile a call expression, checking if it's a standard library call
   */
  transpileCallExpression(expr: CallExpression, transpileExpression: (expr: Expression) => string): string {
    console.log('DEBUG: StandardLibraryTranspiler.transpileCallExpression called with:', JSON.stringify(expr, null, 2));
    
    const callee = expr.callee;
    
    // Check if this is a standard library call
    if (callee.type === 'MemberExpression') {
      const memberExpr = callee as MemberExpression;
      const objectExpr = memberExpr.object;
      const functionName = memberExpr.property.name;
      
      console.log('DEBUG: Found MemberExpression callee:', { objectExpr, functionName });
      
      // Check if this is a static standard library function (like http.get)
      if (objectExpr.type === 'Identifier') {
        const objectName = this.transpileIdentifier(objectExpr as Identifier);
        console.log('DEBUG: Checking standard library function:', { objectName, functionName });
        const stdLibImpl = getStandardLibraryImplementation(objectName, functionName, this.context.targetLanguage);
        if (stdLibImpl) {
          console.log('DEBUG: Found standard library implementation:', stdLibImpl);
          return this.transpileStandardLibraryCall(objectName, functionName, expr.arguments, transpileExpression, stdLibImpl);
        }
      }
      
      // Check if this is an object method call (like response.json())
      const objectStr = transpileExpression(objectExpr);
      console.log('DEBUG: Checking object method:', { objectStr, functionName });
      const objMethodImpl = this.getObjectMethodImplementation(objectStr, functionName);
      if (objMethodImpl) {
        console.log('DEBUG: Found object method implementation:', objMethodImpl);
        return this.transpileObjectMethodCall(objectStr, functionName, expr.arguments, transpileExpression, objMethodImpl);
      }
    }
    
    // Fall back to regular call expression
    const calleeStr = transpileExpression(callee);
    const args = expr.arguments.map(arg => transpileExpression(arg)).join(', ');
    const result = `${calleeStr}(${args})`;
    console.log('DEBUG: Fallback to regular call expression:', result);
    return result;
  }

  /**
   * Transpile a standard library call with proper argument substitution
   */
  private transpileStandardLibraryCall(
    moduleName: string,
    functionName: string,
    args: Expression[],
    transpileExpression: (expr: Expression) => string,
    implementation: string
  ): string {
    // Convert arguments to strings
    const argStrings = args.map(arg => transpileExpression(arg));
    
    // Replace placeholders in the implementation
    let result = implementation;
    
    // Replace positional arguments
    for (let i = 0; i < argStrings.length; i++) {
      result = result.replace(new RegExp(`\\barg${i}\\b`, 'g'), argStrings[i]);
    }
    
    // Replace common parameter names
    if (argStrings.length > 0) {
      result = result.replace(/\burl\b/g, argStrings[0]);
    }
    if (argStrings.length > 1) {
      result = result.replace(/\bdata\b/g, argStrings[1]);
    }
    if (argStrings.length > 0) {
      result = result.replace(/\btext\b/g, argStrings[0]);
    }
    if (argStrings.length > 0) {
      result = result.replace(/\bobj\b/g, argStrings[0]);
    }
    
    // Handle special cases for different languages
    result = this.handleLanguageSpecificCases(result, moduleName, functionName, argStrings);
    
    return result;
  }

  /**
   * Handle language-specific cases and transformations
   */
  private handleLanguageSpecificCases(
    result: string,
    moduleName: string,
    functionName: string,
    argStrings: string[]
  ): string {
    switch (this.context.targetLanguage) {
      case 'typescript':
      case 'javascript':
        // Add await if the function is async
        if (this.isAsyncFunction(moduleName, functionName)) {
          if (!result.startsWith('await ')) {
            result = `await ${result}`;
          }
        }
        break;
        
      case 'csharp':
        // Add using statements and handle C# specific patterns
        if (moduleName === 'http' && functionName === 'get') {
          // Ensure HttpClient is available
          result = result.replace('httpClient', 'this.httpClient');
        }
        break;
    }
    
    return result;
  }

  /**
   * Handle language-specific cases for object method calls
   */
  private handleObjectMethodLanguageSpecificCases(
    result: string,
    objectName: string,
    methodName: string,
    argStrings: string[]
  ): string {
    switch (this.context.targetLanguage) {
      case 'typescript':
      case 'javascript':
        // Add await if the object method is async
        if (this.isAsyncObjectMethod(objectName, methodName)) {
          if (!result.startsWith('await ')) {
            result = `await ${result}`;
          }
        }
        break;
        
      case 'csharp':
        // Handle C# specific object method patterns
        if (objectName.endsWith('response') && methodName === 'json') {
          result = result.replace('response.json()', 'response.Content.ReadAsStringAsync().ContinueWith(t => JsonConvert.DeserializeObject(t.Result))');
        }
        break;
    }
    
    return result;
  }

  /**
   * Check if a standard library function is async
   */
  isAsyncFunction(moduleName: string, functionName: string): boolean {
    const func = findStandardLibraryFunction(moduleName, functionName);
    if (!func) return false;
    
    // HTTP operations are async
    if (moduleName === 'http') return true;
    
    return false;
  }

  /**
   * Check if an object method call is async
   */
  isAsyncObjectMethod(objectName: string, methodName: string): boolean {
    // Response methods are async
    if ((objectName === 'response' || objectName.endsWith('response')) && 
        (methodName === 'json' || methodName === 'text')) {
      return true;
    }
    
    return false;
  }

  /**
   * Get implementation for object method calls (like response.json())
   */
  private getObjectMethodImplementation(objectName: string, methodName: string): string | undefined {
    // Handle response object methods
    if (objectName === 'response' || objectName.endsWith('response')) {
      switch (methodName) {
        case 'json':
          return 'await {object}.json()';
        case 'text':
          return 'await {object}.text()';
        default:
          return undefined;
      }
    }
    
    // Handle other object methods
    switch (methodName) {
      case 'toString':
        return '{object}.toString()';
      case 'toLowerCase':
        return '{object}.toLowerCase()';
      case 'toUpperCase':
        return '{object}.toUpperCase()';
      default:
        return undefined;
    }
  }

  /**
   * Transpile an object method call
   */
  private transpileObjectMethodCall(
    objectName: string,
    methodName: string,
    args: Expression[],
    transpileExpression: (expr: Expression) => string,
    implementation: string
  ): string {
    // Convert arguments to strings
    const argStrings = args.map(arg => transpileExpression(arg));
    
    // Replace placeholders in the implementation
    let result = implementation.replace('{object}', objectName);
    
    // Add arguments if any
    if (argStrings.length > 0) {
      result = result.replace('()', `(${argStrings.join(', ')})`);
    }
    
    // Handle language-specific cases
    result = this.handleObjectMethodLanguageSpecificCases(result, objectName, methodName, argStrings);
    
    return result;
  }

  /**
   * Transpile an identifier
   */
  private transpileIdentifier(ident: Identifier): string {
    return ident.name;
  }

  /**
   * Get required imports for the target language
   */
  getRequiredImports(): string[] {
    const imports: string[] = [];
    
    switch (this.context.targetLanguage) {
      case 'typescript':
      case 'javascript':
        // No additional imports needed for fetch API
        break;
        
      case 'csharp':
        imports.push('using System.Net.Http;');
        imports.push('using Newtonsoft.Json;');
        imports.push('using System.Threading.Tasks;');
        break;
    }
    
    return imports;
  }

  /**
   * Get required setup code for the target language
   */
  getRequiredSetup(): string[] {
    const setup: string[] = [];
    
    switch (this.context.targetLanguage) {
      case 'typescript':
      case 'javascript':
        // No setup needed
        break;
        
      case 'csharp':
        setup.push('private readonly HttpClient httpClient = new HttpClient();');
        break;
    }
    
    return setup;
  }
} 