import { Language, StandardLibraryMapping, StandardLibraryPropertyMapping } from './types.js';
import { CompilerContext } from '../types/index.js';
import path from 'path';
import { 
  ASTProgramNode, 
  ASTStatementNode, 
  ASTExpressionNode,
  ASTFunctionDeclarationNode,
  ASTVariableDeclarationNode,
  ASTExpressionStatementNode,
  ASTIfStatementNode,
  ASTWhileStatementNode,
  ASTForStatementNode,
  ASTReturnStatementNode,
  ASTBlockStatementNode,
  ASTBinaryExpressionNode,
  ASTUnaryExpressionNode,
  ASTCallExpressionNode,
  ASTMemberExpressionNode,
  ASTIdentifierNode,
  ASTLiteralNode,
  ASTTypeDeclarationNode,
  ASTNodeType
} from '../ast/ast-converter.js';

export class GDScriptLanguage implements Language {
  name = 'gdscript';
  displayName = 'GDScript';
  description = 'Godot Engine GDScript programming language';
  emoji = '🎮';
  version = '1.0.0';
  middlewareDependencies = ['variable-renamer', 'hoister'];

  transpile(ast: ASTProgramNode, context: CompilerContext): string {
    const config = context.options;
    const formatter = new GDScriptFormatter(config);
    
    // Convert AST to GDScript code
    const code = this.transpileProgram(ast, formatter);
    
    return formatter.format(code);
  }

  /**
   * Generate GDScript project files
   */
  async generatePackageFiles(outputDir: string, baseFileName: string): Promise<void> {
    const { FileHelpers } = await import('../utils/file-helpers.js');
    
    const projectGdContent = `; Engine configuration file.
; It's best edited using the editor UI and not directly,
; since the parameters that go here are not all obvious.
;
; Format:
;   [section] ; section goes between []
;   param=value ; assign values to parameters

config_version=5

[application]

config/name="${baseFileName}"
run/main_scene="res://${baseFileName}.tscn"
config/features=PackedStringArray("4.2")
config/icon="res://icon.svg"

[display]

window/size/viewport_width=1152
window/size/viewport_height=648
window/stretch/mode="canvas_items"

[rendering]

renderer/rendering_method="gl_compatibility"
renderer/rendering_method.mobile="gl_compatibility"
`;

    await FileHelpers.writeFile(path.join(outputDir, 'project.godot'), projectGdContent);
  }

  /**
   * Get standard library function mappings for GDScript
   */
  getStandardLibraryMappings(): StandardLibraryMapping[] {
    return [
      {
        pattern: 'http.get',
        template: 'await HTTPRequest.new().request({args})',
        async: true
      },
      {
        pattern: 'http.post',
        template: 'await HTTPRequest.new().request({args[0]}, ["Content-Type: application/json"], HTTPClient.METHOD_POST, {args[1]})',
        async: true
      },
      {
        pattern: 'console.log',
        template: 'print({args})'
      },
      {
        pattern: 'console.error',
        template: 'printerr({args})'
      },
      {
        pattern: 'console.warn',
        template: 'print_warning({args})'
      },
      {
        pattern: 'Math.random',
        template: 'randf()'
      },
      {
        pattern: 'Math.floor',
        template: 'floor({args})'
      },
      {
        pattern: 'Math.ceil',
        template: 'ceil({args})'
      }
    ];
  }

  /**
   * Get standard library property mappings for GDScript
   */
  getStandardLibraryPropertyMappings(): StandardLibraryPropertyMapping[] {
    return [
      {
        pattern: 'response.json',
        template: 'JSON.parse_string({object}.get_response_body().get_string_from_utf8())',
        isMethod: false
      },
      {
        pattern: 'data.drivers',
        template: '{object}.drivers',
        isMethod: false
      },
      {
        pattern: 'data.length',
        template: '{object}.size()',
        isMethod: false
      }
    ];
  }

  /**
   * Transpile a program node
   */
  private transpileProgram(program: ASTProgramNode, formatter: GDScriptFormatter): string {
    const statements = program.body.map(stmt => this.transpileStatement(stmt, formatter));
    return statements.join('\n\n');
  }

  /**
   * Transpile a statement node
   */
  private transpileStatement(stmt: ASTStatementNode, formatter: GDScriptFormatter): string {
    switch ((stmt as any).type) {
      case ASTNodeType.FUNCTION_DECLARATION:
        return this.transpileFunctionDeclaration(stmt as ASTFunctionDeclarationNode, formatter);
      case ASTNodeType.VARIABLE_DECLARATION:
        return this.transpileVariableDeclaration(stmt as ASTVariableDeclarationNode, formatter);
      case ASTNodeType.EXPRESSION_STATEMENT:
        return this.transpileExpressionStatement(stmt as ASTExpressionStatementNode, formatter);
      case ASTNodeType.IF_STATEMENT:
        return this.transpileIfStatement(stmt as ASTIfStatementNode, formatter);
      case ASTNodeType.WHILE_STATEMENT:
        return this.transpileWhileStatement(stmt as ASTWhileStatementNode, formatter);
      case ASTNodeType.FOR_STATEMENT:
        return this.transpileForStatement(stmt as ASTForStatementNode, formatter);
      case ASTNodeType.RETURN_STATEMENT:
        return this.transpileReturnStatement(stmt as ASTReturnStatementNode, formatter);
      case ASTNodeType.BLOCK_STATEMENT:
        return this.transpileBlockStatement(stmt as ASTBlockStatementNode, formatter);
      case ASTNodeType.TYPE_DECLARATION:
        return this.transpileTypeDeclaration(stmt as ASTTypeDeclarationNode, formatter);
      default:
        throw new Error(`Unsupported statement type: ${(stmt as any).type}`);
    }
  }

  /**
   * Transpile a function declaration
   */
  private transpileFunctionDeclaration(func: ASTFunctionDeclarationNode, formatter: GDScriptFormatter): string {
    const params = func.params.join(', ');
    const body = this.transpileBlockStatement(func.body, formatter);
    return `func ${func.name}(${params}):\n${formatter.indent(body)}`;
  }

  /**
   * Transpile a variable declaration
   */
  private transpileVariableDeclaration(variable: ASTVariableDeclarationNode, formatter: GDScriptFormatter): string {
    const init = variable.init ? ` = ${this.transpileExpression(variable.init, formatter)}` : '';
    return `var ${variable.name}${init}`;
  }

  /**
   * Transpile an expression statement
   */
  private transpileExpressionStatement(stmt: ASTExpressionStatementNode, formatter: GDScriptFormatter): string {
    return this.transpileExpression(stmt.expression, formatter);
  }

  /**
   * Transpile an if statement
   */
  private transpileIfStatement(stmt: ASTIfStatementNode, formatter: GDScriptFormatter): string {
    const test = this.transpileExpression(stmt.test, formatter);
    const consequent = this.transpileStatement(stmt.consequent, formatter);
    const alternate = stmt.alternate ? this.transpileStatement(stmt.alternate, formatter) : null;
    
    let result = `if ${test}:\n${formatter.indent(consequent)}`;
    if (alternate) {
      result += `\nelse:\n${formatter.indent(alternate)}`;
    }
    return result;
  }

  /**
   * Transpile a while statement
   */
  private transpileWhileStatement(stmt: ASTWhileStatementNode, formatter: GDScriptFormatter): string {
    const test = this.transpileExpression(stmt.test, formatter);
    const body = this.transpileStatement(stmt.body, formatter);
    return `while ${test}:\n${formatter.indent(body)}`;
  }

  /**
   * Transpile a for statement
   */
  private transpileForStatement(stmt: ASTForStatementNode, formatter: GDScriptFormatter): string {
    const init = stmt.init ? this.transpileForInit(stmt.init, formatter) : '';
    const test = stmt.test ? this.transpileExpression(stmt.test, formatter) : '';
    const update = stmt.update ? this.transpileExpression(stmt.update, formatter) : '';
    const body = this.transpileStatement(stmt.body, formatter);
    
    // GDScript doesn't have C-style for loops, convert to while
    if (init && test && update) {
      return `${init}\nwhile ${test}:\n${formatter.indent(body)}\n${update}`;
    }
    return `for ${init} in range(${test}):\n${formatter.indent(body)}`;
  }

  /**
   * Transpile for loop initializer
   */
  private transpileForInit(init: ASTVariableDeclarationNode | ASTExpressionNode, formatter: GDScriptFormatter): string {
    if ((init as any).type === ASTNodeType.VARIABLE_DECLARATION) {
      return this.transpileVariableDeclaration(init as ASTVariableDeclarationNode, formatter);
    } else {
      return this.transpileExpression(init as ASTExpressionNode, formatter);
    }
  }

  /**
   * Transpile a return statement
   */
  private transpileReturnStatement(stmt: ASTReturnStatementNode, formatter: GDScriptFormatter): string {
    const argument = stmt.argument ? this.transpileExpression(stmt.argument, formatter) : '';
    return `return ${argument}`;
  }

  /**
   * Transpile a block statement
   */
  private transpileBlockStatement(block: ASTBlockStatementNode, formatter: GDScriptFormatter): string {
    const statements = block.body.map(stmt => this.transpileStatement(stmt, formatter));
    return statements.join('\n');
  }

  /**
   * Transpile a type declaration (convert to class in GDScript)
   */
  private transpileTypeDeclaration(type: ASTTypeDeclarationNode, formatter: GDScriptFormatter): string {
    const fields = type.fields.map(field => `var ${field.name}: ${field.valueType}`).join('\n');
    return `class ${type.name}:\n${formatter.indent(fields)}`;
  }

  /**
   * Transpile an expression node
   */
  private transpileExpression(expr: ASTExpressionNode, formatter: GDScriptFormatter): string {
    switch ((expr as any).type) {
      case ASTNodeType.BINARY_EXPRESSION:
        return this.transpileBinaryExpression(expr as ASTBinaryExpressionNode, formatter);
      case ASTNodeType.UNARY_EXPRESSION:
        return this.transpileUnaryExpression(expr as ASTUnaryExpressionNode, formatter);
      case ASTNodeType.CALL_EXPRESSION:
        return this.transpileCallExpression(expr as ASTCallExpressionNode, formatter);
      case ASTNodeType.MEMBER_EXPRESSION:
        return this.transpileMemberExpression(expr as ASTMemberExpressionNode, formatter);
      case ASTNodeType.IDENTIFIER:
        return this.transpileIdentifier(expr as ASTIdentifierNode, formatter);
      case ASTNodeType.LITERAL:
        return this.transpileLiteral(expr as ASTLiteralNode, formatter);
      default:
        throw new Error(`Unsupported expression type: ${(expr as any).type}`);
    }
  }

  /**
   * Transpile a binary expression
   */
  private transpileBinaryExpression(expr: ASTBinaryExpressionNode, formatter: GDScriptFormatter): string {
    const left = this.transpileExpression(expr.left, formatter);
    const right = this.transpileExpression(expr.right, formatter);
    return `${left} ${expr.operator} ${right}`;
  }

  /**
   * Transpile a unary expression
   */
  private transpileUnaryExpression(expr: ASTUnaryExpressionNode, formatter: GDScriptFormatter): string {
    const argument = this.transpileExpression(expr.argument, formatter);
    return `${expr.operator}${argument}`;
  }

  /**
   * Transpile a call expression
   */
  private transpileCallExpression(expr: ASTCallExpressionNode, formatter: GDScriptFormatter): string {
    // Handle standard library functions
    if (expr.callee.type === ASTNodeType.MEMBER_EXPRESSION) {
      const memberExpr = expr.callee as ASTMemberExpressionNode;
      const objectName = this.transpileExpression(memberExpr.object, formatter);
      const propertyName = this.transpileExpression(memberExpr.property, formatter);
      const args = expr.arguments.map(arg => this.transpileExpression(arg, formatter));
      
      const transpiler = new StandardLibraryTranspiler(this);
      const result = transpiler.transpileFunctionCall(objectName, propertyName, args);
      
      if (result) {
        return result;
      }
    }
    
    // Default call expression handling
    const callee = this.transpileExpression(expr.callee, formatter);
    const args = expr.arguments.map(arg => this.transpileExpression(arg, formatter));
    return `${callee}(${args.join(', ')})`;
  }

  /**
   * Transpile a member expression
   */
  private transpileMemberExpression(expr: ASTMemberExpressionNode, formatter: GDScriptFormatter): string {
    const objectName = this.transpileExpression(expr.object, formatter);
    const propertyName = this.transpileExpression(expr.property, formatter);
    
    const transpiler = new StandardLibraryTranspiler(this);
    const result = transpiler.transpilePropertyAccess(objectName, propertyName);
    
    if (result) {
      return result;
    }
    
    return `${objectName}.${propertyName}`;
  }

  /**
   * Transpile an identifier
   */
  private transpileIdentifier(expr: ASTIdentifierNode, formatter: GDScriptFormatter): string {
    return expr.name;
  }

  /**
   * Transpile a literal
   */
  private transpileLiteral(expr: ASTLiteralNode, formatter: GDScriptFormatter): string {
    if (typeof expr.value === 'string') {
      return `"${expr.value}"`;
    }
    return String(expr.value);
  }
}

/**
 * GDScript formatter that applies formatting rules from config
 */
class GDScriptFormatter {
  private config: any;
  private indentSize: number;
  private indentStyle: string;

  constructor(config: any) {
    this.config = config;
    this.indentSize = config.prettify?.indentSize || 4;
    this.indentStyle = config.prettify?.indentStyle || 'space';
  }

  /**
   * Indent a block of code
   */
  indent(code: string): string {
    const indentStr = this.indentStyle === 'tab' ? '\t' : ' '.repeat(this.indentSize);
    return code.split('\n').map(line => `${indentStr}${line}`).join('\n');
  }

  /**
   * Format the final code
   */
  format(code: string): string {
    // Apply any additional formatting rules here
    return code;
  }
}

/**
 * Standard library transpiler for GDScript
 */
class StandardLibraryTranspiler {
  private functionMappings: StandardLibraryMapping[];
  private propertyMappings: StandardLibraryPropertyMapping[];

  constructor(language: GDScriptLanguage) {
    this.functionMappings = language.getStandardLibraryMappings();
    this.propertyMappings = language.getStandardLibraryPropertyMappings();
  }

  /**
   * Transpile a function call using standard library mappings
   */
  transpileFunctionCall(objectName: string, propertyName: string, args: string[]): string | null {
    const pattern = `${objectName}.${propertyName}`;
    const mapping = this.functionMappings.find(m => m.pattern === pattern);
    
    if (!mapping) return null;
    
    let template = mapping.template;
    
    // Replace {args} with all arguments
    if (template.includes('{args}')) {
      template = template.replace('{args}', args.join(', '));
    }
    
    // Replace {args[0]}, {args[1]}, etc. with specific arguments
    for (let i = 0; i < args.length; i++) {
      template = template.replace(`{args[${i}]}`, args[i]);
    }
    
    return template;
  }

  /**
   * Transpile a property access using standard library mappings
   */
  transpilePropertyAccess(objectName: string, propertyName: string): string | null {
    const pattern = `${objectName}.${propertyName}`;
    const mapping = this.propertyMappings.find(m => m.pattern === pattern);
    
    if (!mapping) return null;
    
    let template = mapping.template;
    template = template.replace('{object}', objectName);
    
    if (mapping.isMethod) {
      template += '()';
    }
    
    return template;
  }
} 