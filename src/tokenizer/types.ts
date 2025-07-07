/**
 * Token types for the lexer/tokenizer
 */
export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  IDENTIFIER = 'IDENTIFIER',
  
  // Keywords
  IF = 'IF',
  ELSE = 'ELSE',
  WHILE = 'WHILE',
  FOR = 'FOR',
  FUNCTION = 'FUNCTION',
  RETURN = 'RETURN',
  VAR = 'VAR',
  LET = 'LET',
  CONST = 'CONST',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  NULL = 'NULL',
  UNDEFINED = 'UNDEFINED',
  
  // Operators (includes assignment, arithmetic, and colon for type fields)
  OPERATOR = 'OPERATOR',
  
  // Delimiters
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  LEFT_BRACE = 'LEFT_BRACE',
  RIGHT_BRACE = 'RIGHT_BRACE',
  LEFT_BRACKET = 'LEFT_BRACKET',
  RIGHT_BRACKET = 'RIGHT_BRACKET',
  SEMICOLON = 'SEMICOLON',
  COMMA = 'COMMA',
  DOT = 'DOT',
  
  // Special
  EOF = 'EOF',
  ERROR = 'ERROR'
}

/**
 * Token interface
 */
export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
} 