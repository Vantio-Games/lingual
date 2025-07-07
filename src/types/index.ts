// Core types for the transpiler system

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
  value: string | number | boolean | null;
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

export interface WhileStatement extends BaseNode {
  type: 'WhileStatement';
  condition: Expression;
  body: Statement;
}

export interface ForStatement extends BaseNode {
  type: 'ForStatement';
  initializer?: VariableDeclaration | Expression;
  condition?: Expression;
  increment?: Expression;
  body: Statement;
}

export interface BlockStatement extends BaseNode {
  type: 'BlockStatement';
  body: Statement[];
}

export interface BinaryExpression extends BaseNode {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression extends BaseNode {
  type: 'UnaryExpression';
  operator: string;
  argument: Expression;
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
  computed: boolean;
}

export type Expression = 
  | Identifier 
  | Literal 
  | BinaryExpression 
  | UnaryExpression
  | CallExpression 
  | MemberExpression;

export type Statement = 
  | FunctionDeclaration 
  | VariableDeclaration 
  | ExpressionStatement 
  | ReturnStatement 
  | IfStatement
  | WhileStatement
  | ForStatement
  | BlockStatement;

export interface Program extends BaseNode {
  type: 'Program';
  body: Statement[];
}

// Compiler context and options
export interface CompilerOptions {
  target: string;
  outputDir?: string;
  verbose?: boolean;
  debug?: boolean;
}

export interface CompilerContext {
  options: CompilerOptions;
  macros: Map<string, any>;
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