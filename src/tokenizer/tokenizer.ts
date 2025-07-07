import { Token, TokenType } from './types.js';

/**
 * Main tokenizer class that converts source code into tokens
 */
export class Tokenizer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  /**
   * Tokenize the entire source code
   */
  tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.position < this.source.length) {
      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }
    
    // Add EOF token
    tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column
    });
    
    return tokens;
  }

  /**
   * Get the next token from the source
   */
  private nextToken(): Token | null {
    this.skipWhitespace();
    
    if (this.position >= this.source.length) {
      return null;
    }

    const char = this.source[this.position];
    const startLine = this.line;
    const startColumn = this.column;

    // Handle different token types
    if (this.isDigit(char)) {
      return this.readNumber(startLine, startColumn);
    }
    
    if (this.isLetter(char)) {
      return this.readIdentifier(startLine, startColumn);
    }
    
    if (char === '"' || char === "'") {
      return this.readString(startLine, startColumn);
    }
    
    if (this.isOperator(char)) {
      return this.readOperator(startLine, startColumn);
    }
    
    if (char === '(' || char === ')') {
      this.advance();
      return {
        type: char === '(' ? TokenType.LEFT_PAREN : TokenType.RIGHT_PAREN,
        value: char,
        line: startLine,
        column: startColumn
      };
    }
    
    if (char === '{' || char === '}') {
      this.advance();
      return {
        type: char === '{' ? TokenType.LEFT_BRACE : TokenType.RIGHT_BRACE,
        value: char,
        line: startLine,
        column: startColumn
      };
    }
    
    if (char === '[' || char === ']') {
      this.advance();
      return {
        type: char === '[' ? TokenType.LEFT_BRACKET : TokenType.RIGHT_BRACKET,
        value: char,
        line: startLine,
        column: startColumn
      };
    }
    
    if (char === ';') {
      this.advance();
      return {
        type: TokenType.SEMICOLON,
        value: char,
        line: startLine,
        column: startColumn
      };
    }
    
    if (char === ',') {
      this.advance();
      return {
        type: TokenType.COMMA,
        value: char,
        line: startLine,
        column: startColumn
      };
    }
    
    if (char === '.') {
      this.advance();
      return {
        type: TokenType.DOT,
        value: char,
        line: startLine,
        column: startColumn
      };
    }
    
    // Unknown character
    this.advance();
    return {
      type: TokenType.ERROR,
      value: char,
      line: startLine,
      column: startColumn
    };
  }

  /**
   * Read a number token
   */
  private readNumber(startLine: number, startColumn: number): Token {
    let value = '';
    
    while (this.position < this.source.length && this.isDigit(this.source[this.position])) {
      value += this.source[this.position];
      this.advance();
    }
    
    // Handle decimal point
    if (this.position < this.source.length && this.source[this.position] === '.') {
      value += '.';
      this.advance();
      
      while (this.position < this.source.length && this.isDigit(this.source[this.position])) {
        value += this.source[this.position];
        this.advance();
      }
    }
    
    return {
      type: TokenType.NUMBER,
      value,
      line: startLine,
      column: startColumn
    };
  }

  /**
   * Read an identifier or keyword token
   */
  private readIdentifier(startLine: number, startColumn: number): Token {
    let value = '';
    
    while (this.position < this.source.length && 
           (this.isLetter(this.source[this.position]) || this.isDigit(this.source[this.position]))) {
      value += this.source[this.position];
      this.advance();
    }
    
    // Check if it's a keyword
    const keywordType = this.getKeywordType(value);
    
    return {
      type: keywordType || TokenType.IDENTIFIER,
      value,
      line: startLine,
      column: startColumn
    };
  }

  /**
   * Read a string token
   */
  private readString(startLine: number, startColumn: number): Token {
    const quote = this.source[this.position];
    let value = '';
    
    this.advance(); // Skip opening quote
    
    while (this.position < this.source.length && this.source[this.position] !== quote) {
      if (this.source[this.position] === '\\') {
        this.advance(); // Skip backslash
        if (this.position < this.source.length) {
          value += '\\' + this.source[this.position];
          this.advance();
        }
      } else {
        value += this.source[this.position];
        this.advance();
      }
    }
    
    if (this.position < this.source.length) {
      this.advance(); // Skip closing quote
    }
    
    return {
      type: TokenType.STRING,
      value,
      line: startLine,
      column: startColumn
    };
  }

  /**
   * Read an operator token
   */
  private readOperator(startLine: number, startColumn: number): Token {
    let value = '';
    
    // Read up to 3 characters for multi-character operators
    const maxLength = Math.min(3, this.source.length - this.position);
    
    for (let i = 0; i < maxLength; i++) {
      const candidate = this.source.substring(this.position, this.position + i + 1);
      if (this.isOperator(candidate)) {
        value = candidate;
      } else {
        break;
      }
    }
    
    // Advance by the length of the operator
    for (let i = 0; i < value.length; i++) {
      this.advance();
    }
    
    return {
      type: TokenType.OPERATOR,
      value,
      line: startLine,
      column: startColumn
    };
  }

  /**
   * Skip whitespace and comments
   */
  private skipWhitespace(): void {
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else if (char === '\n') {
        this.advance();
        this.line++;
        this.column = 1;
      } else if (char === '/' && this.position + 1 < this.source.length) {
        const nextChar = this.source[this.position + 1];
        if (nextChar === '/') {
          // Single line comment
          while (this.position < this.source.length && this.source[this.position] !== '\n') {
            this.advance();
          }
        } else if (nextChar === '*') {
          // Multi-line comment
          this.advance(); // Skip /
          this.advance(); // Skip *
          while (this.position < this.source.length) {
            if (this.source[this.position] === '*' && 
                this.position + 1 < this.source.length && 
                this.source[this.position + 1] === '/') {
              this.advance(); // Skip *
              this.advance(); // Skip /
              break;
            }
            if (this.source[this.position] === '\n') {
              this.line++;
              this.column = 1;
            }
            this.advance();
          }
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }

  /**
   * Advance to the next character
   */
  private advance(): void {
    this.position++;
    this.column++;
  }

  /**
   * Check if character is a digit
   */
  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  /**
   * Check if character is a letter
   */
  private isLetter(char: string): boolean {
    return (char >= 'a' && char <= 'z') || 
           (char >= 'A' && char <= 'Z') || 
           char === '_';
  }

  /**
   * Check if string is an operator
   */
  private isOperator(str: string): boolean {
    const operators = [
      '+', '-', '*', '/', '%', '=', '==', '!=', '<', '<=', '>', '>=',
      '&&', '||', '!', '+=', '-=', '*=', '/=', '%=', '++', '--', ':'
    ];
    return operators.includes(str);
  }

  /**
   * Get keyword type if the identifier is a keyword
   */
  private getKeywordType(value: string): TokenType | null {
    const keywords: Record<string, TokenType> = {
      'if': TokenType.IF,
      'else': TokenType.ELSE,
      'while': TokenType.WHILE,
      'for': TokenType.FOR,
      'function': TokenType.FUNCTION,
      'return': TokenType.RETURN,
      'var': TokenType.VAR,
      'let': TokenType.LET,
      'const': TokenType.CONST,
      'true': TokenType.TRUE,
      'false': TokenType.FALSE,
      'null': TokenType.NULL,
      'undefined': TokenType.UNDEFINED
    };
    
    return keywords[value] || null;
  }
} 