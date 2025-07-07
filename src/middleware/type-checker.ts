import { Middleware } from '../languages/types.js';
import { CompilerContext } from '../types/index.js';

/**
 * Type Checker Middleware
 * Validates types and performs basic type checking
 */
export class TypeCheckerMiddleware implements Middleware {
  name = 'type-checker';
  description = 'Validates types and performs basic type checking';

  async process(ast: any, context: CompilerContext): Promise<any> {
    const typeMap = new Map<string, string>();
    const errors: string[] = [];

    // Process AST nodes recursively
    const processNode = (node: any): any => {
      if (!node || typeof node !== 'object') {
        return node;
      }

      // Handle different node types
      switch (node.type) {
        case 'VariableDeclaration':
          const varType = this.inferType(node.init);
          typeMap.set(node.name, varType);
          
          // Validate assignment
          if (node.init) {
            const initType = this.inferType(node.init);
            if (varType !== 'any' && initType !== 'any' && varType !== initType) {
              errors.push(`Type mismatch: cannot assign ${initType} to ${varType} variable '${node.name}'`);
            }
          }
          
          return {
            ...node,
            inferredType: varType,
            init: node.init ? processNode(node.init) : null
          };

        case 'BinaryExpression':
          const leftType = this.inferType(node.left);
          const rightType = this.inferType(node.right);
          const resultType = this.getBinaryResultType(leftType, rightType, node.operator);
          
          // Validate binary operations
          if (!this.isValidBinaryOperation(leftType, rightType, node.operator)) {
            errors.push(`Invalid operation: ${leftType} ${node.operator} ${rightType}`);
          }
          
          return {
            ...node,
            left: processNode(node.left),
            right: processNode(node.right),
            inferredType: resultType
          };

        case 'UnaryExpression':
          const argType = this.inferType(node.argument);
          const unaryResultType = this.getUnaryResultType(argType, node.operator);
          
          // Validate unary operations
          if (!this.isValidUnaryOperation(argType, node.operator)) {
            errors.push(`Invalid unary operation: ${node.operator} ${argType}`);
          }
          
          return {
            ...node,
            argument: processNode(node.argument),
            inferredType: unaryResultType
          };

        case 'CallExpression':
          const calleeType = this.inferType(node.callee);
          const argTypes = node.arguments.map((arg: any) => this.inferType(arg));
          
          // Validate function calls
          if (calleeType !== 'function' && calleeType !== 'any') {
            errors.push(`Cannot call non-function type: ${calleeType}`);
          }
          
          return {
            ...node,
            callee: processNode(node.callee),
            arguments: node.arguments.map((arg: any) => processNode(arg)),
            inferredType: 'any' // Function return type is unknown
          };

        case 'Identifier':
          const type = typeMap.get(node.name);
          return {
            ...node,
            inferredType: type || 'any'
          };

        case 'Literal':
          return {
            ...node,
            inferredType: this.getLiteralType(node.value)
          };

        case 'FunctionDeclaration':
          // Add function to type map
          typeMap.set(node.name, 'function');
          
          return {
            ...node,
            body: processNode(node.body)
          };

        case 'ReturnStatement':
          if (node.argument) {
            const returnType = this.inferType(node.argument);
            // Could validate against function return type if available
          }
          
          return {
            ...node,
            argument: node.argument ? processNode(node.argument) : null
          };

        case 'IfStatement':
        case 'WhileStatement':
        case 'ForStatement':
          const testType = this.inferType(node.test);
          
          // Validate condition
          if (testType !== 'boolean' && testType !== 'any') {
            errors.push(`Condition must be boolean, got: ${testType}`);
          }
          
          return {
            ...node,
            test: processNode(node.test),
            body: processNode(node.body),
            consequent: node.consequent ? processNode(node.consequent) : null,
            alternate: node.alternate ? processNode(node.alternate) : null,
            init: node.init ? processNode(node.init) : null,
            update: node.update ? processNode(node.update) : null
          };

        case 'BlockStatement':
        case 'Program':
          return {
            ...node,
            body: node.body.map((stmt: any) => processNode(stmt))
          };

        case 'ExpressionStatement':
          return {
            ...node,
            expression: processNode(node.expression)
          };

        default:
          // For unknown node types, process all properties recursively
          const processedNode: any = {};
          for (const [key, value] of Object.entries(node)) {
            if (Array.isArray(value)) {
              processedNode[key] = value.map((item: any) => processNode(item));
            } else if (typeof value === 'object' && value !== null) {
              processedNode[key] = processNode(value);
            } else {
              processedNode[key] = value;
            }
          }
          return processedNode;
      }
    };

    const processedAST = processNode(ast);
    
    // Add type errors to context
    for (const error of errors) {
      context.errors.push({
        message: error,
        code: 'TYPE_ERROR'
      });
    }

    return processedAST;
  }

  /**
   * Infer the type of a node
   */
  private inferType(node: any): string {
    if (!node) return 'any';
    
    switch (node.type) {
      case 'Literal':
        return this.getLiteralType(node.value);
      case 'Identifier':
        return 'any'; // Will be resolved by type map
      case 'BinaryExpression':
        const leftType = this.inferType(node.left);
        const rightType = this.inferType(node.right);
        return this.getBinaryResultType(leftType, rightType, node.operator);
      case 'UnaryExpression':
        const argType = this.inferType(node.argument);
        return this.getUnaryResultType(argType, node.operator);
      case 'CallExpression':
        return 'any'; // Function return type is unknown
      case 'MemberExpression':
        return 'any'; // Property type is unknown
      default:
        return 'any';
    }
  }

  /**
   * Get the type of a literal value
   */
  private getLiteralType(value: any): string {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'number' : 'number';
    }
    if (typeof value === 'string') {
      return 'string';
    }
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    if (value === null) {
      return 'null';
    }
    return 'any';
  }

  /**
   * Get the result type of a binary operation
   */
  private getBinaryResultType(leftType: string, rightType: string, operator: string): string {
    switch (operator) {
      case '+':
        if (leftType === 'string' || rightType === 'string') {
          return 'string';
        }
        return 'number';
      case '-':
      case '*':
      case '/':
      case '%':
        return 'number';
      case '==':
      case '!=':
      case '===':
      case '!==':
        return 'boolean';
      case '&&':
      case '||':
        return 'boolean';
      default:
        return 'any';
    }
  }

  /**
   * Get the result type of a unary operation
   */
  private getUnaryResultType(argType: string, operator: string): string {
    switch (operator) {
      case '!':
        return 'boolean';
      case '-':
        return 'number';
      case '+':
        return 'number';
      default:
        return 'any';
    }
  }

  /**
   * Check if a binary operation is valid
   */
  private isValidBinaryOperation(leftType: string, rightType: string, operator: string): boolean {
    switch (operator) {
      case '+':
        return true; // String concatenation or number addition
      case '-':
      case '*':
      case '/':
      case '%':
        return leftType === 'number' && rightType === 'number';
      case '==':
      case '!=':
      case '===':
      case '!==':
        return true; // Can compare any types
      case '<':
      case '<=':
      case '>':
      case '>=':
        return leftType === 'number' && rightType === 'number';
      case '&&':
      case '||':
        return leftType === 'boolean' && rightType === 'boolean';
      default:
        return true;
    }
  }

  /**
   * Check if a unary operation is valid
   */
  private isValidUnaryOperation(argType: string, operator: string): boolean {
    switch (operator) {
      case '!':
        return argType === 'boolean';
      case '-':
      case '+':
        return argType === 'number';
      default:
        return true;
    }
  }
} 