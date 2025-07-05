import { createToken, Lexer } from 'chevrotain';

// Keywords
export const Function = createToken({ name: 'Function', pattern: /function/ });
export const Fn = createToken({ name: 'Fn', pattern: /fn/ });
export const Return = createToken({ name: 'Return', pattern: /return/ });
export const If = createToken({ name: 'If', pattern: /if/ });
export const Else = createToken({ name: 'Else', pattern: /else/ });
export const For = createToken({ name: 'For', pattern: /for/ });
export const Let = createToken({ name: 'Let', pattern: /let/ });
export const Var = createToken({ name: 'Var', pattern: /var/ });
export const Macro = createToken({ name: 'Macro', pattern: /macro/ });
export const End = createToken({ name: 'End', pattern: /end/ });

// High-level language constructs
export const Api = createToken({ name: 'Api', pattern: /api/ });
export const Type = createToken({ name: 'Type', pattern: /type/ });
export const Module = createToken({ name: 'Module', pattern: /module/ });
export const Import = createToken({ name: 'Import', pattern: /import/ });
export const Export = createToken({ name: 'Export', pattern: /export/ });
export const From = createToken({ name: 'From', pattern: /from/ });
export const As = createToken({ name: 'As', pattern: /as/ });
export const Method = createToken({ name: 'Method', pattern: /method/ });
export const Path = createToken({ name: 'Path', pattern: /path/ });
export const Params = createToken({ name: 'Params', pattern: /params/ });
export const Returns = createToken({ name: 'Returns', pattern: /returns/ });
export const Headers = createToken({ name: 'Headers', pattern: /headers/ });
export const Description = createToken({ name: 'Description', pattern: /description/ });
export const Required = createToken({ name: 'Required', pattern: /required/ });
export const Optional = createToken({ name: 'Optional', pattern: /optional/ });
export const Extends = createToken({ name: 'Extends', pattern: /extends/ });
export const Implements = createToken({ name: 'Implements', pattern: /implements/ });
export const Default = createToken({ name: 'Default', pattern: /default/ });
export const Enum = createToken({ name: 'Enum', pattern: /enum/ });
export const Interface = createToken({ name: 'Interface', pattern: /interface/ });

// Type keywords
export const String = createToken({ name: 'String', pattern: /string/ });
export const Number = createToken({ name: 'Number', pattern: /number/ });
export const Boolean = createToken({ name: 'Boolean', pattern: /boolean/ });
export const Void = createToken({ name: 'Void', pattern: /void/ });
export const Object = createToken({ name: 'Object', pattern: /object/ });
export const Array = createToken({ name: 'Array', pattern: /array/ });

// Identifiers and literals
export const Identifier = createToken({ name: 'Identifier', pattern: /[a-zA-Z_][a-zA-Z0-9_]*/ });
export const StringLiteral = createToken({ name: 'StringLiteral', pattern: /"[^"]*"/ });
export const NumberLiteral = createToken({ name: 'NumberLiteral', pattern: /[0-9]+(\.[0-9]+)?/ });
export const BooleanLiteral = createToken({ name: 'BooleanLiteral', pattern: /true|false/ });

// Operators
export const Plus = createToken({ name: 'Plus', pattern: /\+/ });
export const Minus = createToken({ name: 'Minus', pattern: /-/ });
export const Multiply = createToken({ name: 'Multiply', pattern: /\*/ });
export const Divide = createToken({ name: 'Divide', pattern: /\// });
export const Modulo = createToken({ name: 'Modulo', pattern: /%/ });
export const Assign = createToken({ name: 'Assign', pattern: /=/ });
export const Equals = createToken({ name: 'Equals', pattern: /==/ });
export const NotEquals = createToken({ name: 'NotEquals', pattern: /!=/ });
export const LessThan = createToken({ name: 'LessThan', pattern: /</ });
export const GreaterThan = createToken({ name: 'GreaterThan', pattern: />/ });
export const LessThanEquals = createToken({ name: 'LessThanEquals', pattern: /<=/ });
export const GreaterThanEquals = createToken({ name: 'GreaterThanEquals', pattern: />=/ });

// Logical operators
export const And = createToken({ name: 'And', pattern: /&&/ });
export const Or = createToken({ name: 'Or', pattern: /\|\|/ });

// Punctuation
export const LeftParen = createToken({ name: 'LeftParen', pattern: /\(/ });
export const RightParen = createToken({ name: 'RightParen', pattern: /\)/ });
export const LeftBrace = createToken({ name: 'LeftBrace', pattern: /{/ });
export const RightBrace = createToken({ name: 'RightBrace', pattern: /}/ });
export const LeftBracket = createToken({ name: 'LeftBracket', pattern: /\[/ });
export const RightBracket = createToken({ name: 'RightBracket', pattern: /\]/ });
export const Semicolon = createToken({ name: 'Semicolon', pattern: /;/ });
export const Comma = createToken({ name: 'Comma', pattern: /,/ });
export const Colon = createToken({ name: 'Colon', pattern: /:/ });
export const Dot = createToken({ name: 'Dot', pattern: /\./ });
export const Arrow = createToken({ name: 'Arrow', pattern: /->/ });
export const AtSymbol = createToken({ name: 'AtSymbol', pattern: /@/ });

// Whitespace and comments
export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /[ \t\n\r]+/,
  group: Lexer.SKIPPED
});

export const Comment = createToken({
  name: 'Comment',
  pattern: /\/\/.*/,
  group: Lexer.SKIPPED
});

export const MultiLineComment = createToken({
  name: 'MultiLineComment',
  pattern: /\/\*[\s\S]*?\*\//,
  group: Lexer.SKIPPED
});

// All tokens in order of precedence
export const allTokens = [
  WhiteSpace,
  Comment,
  MultiLineComment,
  
  // Keywords
  Function,
  Fn,
  Returns, // Move Returns before Return
  Return,
  If,
  Else,
  For,
  Let,
  Var,
  Macro,
  End,
  
  // High-level constructs
  Api,
  Type,
  Module,
  Import,
  Export,
  From,
  As,
  Method,
  Path,
  Params,
  Headers,
  Description,
  Required,
  Optional,
  Extends,
  Implements,
  Default,
  Enum,
  Interface,
  
  // Type keywords
  String,
  Number,
  Boolean,
  Void,
  Object,
  Array,
  
  // Literals
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  
  // Operators (order matters for precedence)
  Equals,
  NotEquals,
  LessThanEquals,
  GreaterThanEquals,
  LessThan,
  GreaterThan,
  Plus,
  Arrow, // Move Arrow before Minus
  Minus,
  Multiply,
  Divide,
  Modulo,
  Assign,
  And,
  Or,
  
  // Punctuation
  LeftParen,
  RightParen,
  LeftBrace,
  RightBrace,
  LeftBracket,
  RightBracket,
  Semicolon,
  Comma,
  Colon,
  Dot,
  AtSymbol,
  
  // Identifiers (must be last)
  Identifier
];

// Create the lexer instance
export const LingualLexer = new Lexer(allTokens);

// Helper function to tokenize input
export function tokenize(input: string) {
  const lexResult = LingualLexer.tokenize(input);
  
  if (lexResult.errors.length > 0) {
    throw new Error(`Lexer errors: ${JSON.stringify(lexResult.errors)}`);
  }
  
  return lexResult.tokens;
} 