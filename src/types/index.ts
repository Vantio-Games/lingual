// Core AST node types for the custom language
import { TypeDefinition } from '../language/features/type.js';

export interface Position {
  line: number;
  column: number;
}

export interface SourceLocation {
  start: Position;
  end: Position;
}

export interface BaseNode {
  type: string;
  location?: SourceLocation;
}

export interface Identifier extends BaseNode {
  type: 'Identifier';
  name: string;
}

export interface Literal extends BaseNode {
  type: 'Literal';
  value: string | number | boolean;
}

export interface Parameter extends BaseNode {
  type: 'Parameter';
  name: Identifier;
  typeAnnotation?: TypeAnnotation;
}

export interface TypeAnnotation extends BaseNode {
  type: 'TypeAnnotation';
  typeName: Identifier;
  isNullable?: boolean;
  genericArguments?: TypeAnnotation[];
}

export interface FunctionDeclaration extends BaseNode {
  type: 'FunctionDeclaration';
  name: Identifier;
  parameters: Parameter[];
  returnType?: TypeAnnotation;
  body: Statement[];
}

export interface VariableDeclaration extends BaseNode {
  type: 'VariableDeclaration';
  name: Identifier;
  typeAnnotation?: TypeAnnotation;
  initializer?: Expression;
}

export interface ExpressionStatement extends BaseNode {
  type: 'ExpressionStatement';
  expression: Expression;
}

export interface ReturnStatement extends BaseNode {
  type: 'ReturnStatement';
  expression?: Expression;
}

export interface IfStatement extends BaseNode {
  type: 'IfStatement';
  condition: Expression;
  thenStatement: Statement;
  elseStatement?: Statement;
}

export interface BinaryExpression extends BaseNode {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface CallExpression extends BaseNode {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface MemberExpression extends BaseNode {
  type: 'MemberExpression';
  object: Expression;
  property: Identifier;
}

export type Expression = 
  | Identifier 
  | Literal 
  | BinaryExpression 
  | CallExpression 
  | MemberExpression
  | MacroCall;

export interface ApiDefinition extends BaseNode {
  type: 'ApiDefinition';
  name: Identifier;
  // ...other properties as needed
}

export interface ModuleDefinition extends BaseNode {
  type: 'ModuleDefinition';
  name: Identifier;
  // ...other properties as needed
}

export { TypeDefinition } from '../language/features/type.js';

export type Statement = 
  | FunctionDeclaration 
  | VariableDeclaration 
  | ExpressionStatement 
  | ReturnStatement 
  | IfStatement
  | MacroDefinition
  | MacroCall
  | ApiDefinition
  | TypeDefinition
  | ModuleDefinition;

export interface Program extends BaseNode {
  type: 'Program';
  body: Statement[];
}

export interface MacroDefinition extends BaseNode {
  type: 'MacroDefinition';
  name: Identifier;
  parameters: Parameter[];
  body: Statement[];
}

export interface MacroCall extends BaseNode {
  type: 'MacroCall';
  name: Identifier;
  arguments: Expression[];
}

// Compiler context and options
export interface CompilerOptions {
  target: 'csharp' | 'javascript' | 'typescript';
  outputDir?: string;
  verbose?: boolean;
  debug?: boolean;
}

export interface CompilerContext {
  options: CompilerOptions;
  macros: Map<string, MacroDefinition>;
  errors: CompilationError[];
  warnings: CompilationWarning[];
}

export interface CompilationError {
  message: string;
  location?: SourceLocation;
  code: string;
}

export interface CompilationWarning {
  message: string;
  location?: SourceLocation;
  code: string;
} 