import { Middleware } from '../languages/types.js';
import { CompilerContext } from '../types/index.js';

/**
 * Variable Renamer Middleware
 * Renames variables to avoid conflicts and ensure unique names
 */
export class VariableRenamerMiddleware implements Middleware {
  name = 'variable-renamer';
  description = 'Renames variables to avoid conflicts and ensure unique names';

  async process(ast: any, context: CompilerContext): Promise<any> {
    const variableMap = new Map<string, string>();
    let counter = 0;

    // Generate unique variable names
    const generateUniqueName = (originalName: string): string => {
      if (variableMap.has(originalName)) {
        return variableMap.get(originalName)!;
      }
      
      // Skip renaming for common names like 'i', 'j', 'k' in loops
      if (['i', 'j', 'k', 'index', 'key', 'value'].includes(originalName)) {
        return originalName;
      }
      
      const newName = `_${originalName}_${counter++}`;
      variableMap.set(originalName, newName);
      return newName;
    };

    // Process AST nodes recursively
    const processNode = (node: any): any => {
      if (!node || typeof node !== 'object') {
        return node;
      }

      // Handle different node types
      switch (node.type) {
        case 'VariableDeclaration':
          const newName = generateUniqueName(node.name);
          return {
            ...node,
            name: newName,
            init: node.init ? processNode(node.init) : null
          };

        case 'Identifier':
          // Only rename if it's not a function name or property name
          if (node.name && !node.name.includes('.')) {
            const mappedName = variableMap.get(node.name);
            if (mappedName) {
              return {
                ...node,
                name: mappedName
              };
            }
          }
          return node;

        case 'FunctionDeclaration':
          // Don't rename function names
          return {
            ...node,
            body: processNode(node.body)
          };

        case 'CallExpression':
          return {
            ...node,
            callee: processNode(node.callee),
            arguments: node.arguments.map((arg: any) => processNode(arg))
          };

        case 'MemberExpression':
          return {
            ...node,
            object: processNode(node.object),
            property: processNode(node.property)
          };

        case 'BinaryExpression':
        case 'UnaryExpression':
          return {
            ...node,
            left: node.left ? processNode(node.left) : null,
            right: node.right ? processNode(node.right) : null,
            argument: node.argument ? processNode(node.argument) : null
          };

        case 'BlockStatement':
        case 'Program':
          return {
            ...node,
            body: node.body.map((stmt: any) => processNode(stmt))
          };

        case 'IfStatement':
          return {
            ...node,
            test: processNode(node.test),
            consequent: processNode(node.consequent),
            alternate: node.alternate ? processNode(node.alternate) : null
          };

        case 'WhileStatement':
        case 'ForStatement':
          return {
            ...node,
            test: node.test ? processNode(node.test) : null,
            body: processNode(node.body),
            init: node.init ? processNode(node.init) : null,
            update: node.update ? processNode(node.update) : null
          };

        case 'ReturnStatement':
          return {
            ...node,
            argument: node.argument ? processNode(node.argument) : null
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
    
    // Add information about variable renames to context
    if (variableMap.size > 0) {
      context.warnings.push({
        message: `Renamed ${variableMap.size} variables to avoid conflicts`,
        code: 'VARIABLES_RENAMED'
      });
    }

    return processedAST;
  }
} 