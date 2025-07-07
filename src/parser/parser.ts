import { Token, TokenType } from '../tokenizer/types.js';

/**
 * Node types for the Concrete Syntax Tree
 */
export enum NodeType {
  PROGRAM = 'PROGRAM',
  FUNCTION_DECLARATION = 'FUNCTION_DECLARATION',
  VARIABLE_DECLARATION = 'VARIABLE_DECLARATION',
  EXPRESSION_STATEMENT = 'EXPRESSION_STATEMENT',
  IF_STATEMENT = 'IF_STATEMENT',
  WHILE_STATEMENT = 'WHILE_STATEMENT',
  FOR_STATEMENT = 'FOR_STATEMENT',
  RETURN_STATEMENT = 'RETURN_STATEMENT',
  BLOCK_STATEMENT = 'BLOCK_STATEMENT',
  BINARY_EXPRESSION = 'BINARY_EXPRESSION',
  UNARY_EXPRESSION = 'UNARY_EXPRESSION',
  CALL_EXPRESSION = 'CALL_EXPRESSION',
  MEMBER_EXPRESSION = 'MEMBER_EXPRESSION',
  IDENTIFIER = 'IDENTIFIER',
  LITERAL = 'LITERAL',
  // Add new node type for type declarations
  TYPE_DECLARATION = 'TYPE_DECLARATION'
}

/**
 * Base node interface
 */
export interface Node {
  type: NodeType;
  start: number;
  end: number;
}

/**
 * Program node
 */
export interface ProgramNode extends Node {
  type: NodeType.PROGRAM;
  body: StatementNode[];
}

/**
 * Statement node types
 */
export type StatementNode = 
  | FunctionDeclarationNode
  | VariableDeclarationNode
  | ExpressionStatementNode
  | IfStatementNode
  | WhileStatementNode
  | ForStatementNode
  | ReturnStatementNode
  | BlockStatementNode
  | TypeDeclarationNode;

/**
 * Expression node types
 */
export type ExpressionNode = 
  | BinaryExpressionNode
  | UnaryExpressionNode
  | CallExpressionNode
  | MemberExpressionNode
  | IdentifierNode
  | LiteralNode;

/**
 * Function declaration node
 */
export interface FunctionDeclarationNode extends Node {
  type: NodeType.FUNCTION_DECLARATION;
  name: string;
  params: string[];
  body: BlockStatementNode;
}

/**
 * Variable declaration node
 */
export interface VariableDeclarationNode extends Node {
  type: NodeType.VARIABLE_DECLARATION;
  kind: 'var' | 'let' | 'const';
  name: string;
  init: ExpressionNode | null;
}

/**
 * Expression statement node
 */
export interface ExpressionStatementNode extends Node {
  type: NodeType.EXPRESSION_STATEMENT;
  expression: ExpressionNode;
}

/**
 * If statement node
 */
export interface IfStatementNode extends Node {
  type: NodeType.IF_STATEMENT;
  test: ExpressionNode;
  consequent: StatementNode;
  alternate: StatementNode | null;
}

/**
 * While statement node
 */
export interface WhileStatementNode extends Node {
  type: NodeType.WHILE_STATEMENT;
  test: ExpressionNode;
  body: StatementNode;
}

/**
 * For statement node
 */
export interface ForStatementNode extends Node {
  type: NodeType.FOR_STATEMENT;
  init: VariableDeclarationNode | ExpressionNode | null;
  test: ExpressionNode | null;
  update: ExpressionNode | null;
  body: StatementNode;
}

/**
 * Return statement node
 */
export interface ReturnStatementNode extends Node {
  type: NodeType.RETURN_STATEMENT;
  argument: ExpressionNode | null;
}

/**
 * Block statement node
 */
export interface BlockStatementNode extends Node {
  type: NodeType.BLOCK_STATEMENT;
  body: StatementNode[];
}

/**
 * Binary expression node
 */
export interface BinaryExpressionNode extends Node {
  type: NodeType.BINARY_EXPRESSION;
  operator: string;
  left: ExpressionNode;
  right: ExpressionNode;
}

/**
 * Unary expression node
 */
export interface UnaryExpressionNode extends Node {
  type: NodeType.UNARY_EXPRESSION;
  operator: string;
  argument: ExpressionNode;
}

/**
 * Call expression node
 */
export interface CallExpressionNode extends Node {
  type: NodeType.CALL_EXPRESSION;
  callee: ExpressionNode;
  arguments: ExpressionNode[];
}

/**
 * Member expression node
 */
export interface MemberExpressionNode extends Node {
  type: NodeType.MEMBER_EXPRESSION;
  object: ExpressionNode;
  property: ExpressionNode;
  computed: boolean;
}

/**
 * Identifier node
 */
export interface IdentifierNode extends Node {
  type: NodeType.IDENTIFIER;
  name: string;
}

/**
 * Literal node
 */
export interface LiteralNode extends Node {
  type: NodeType.LITERAL;
  value: string | number | boolean | null;
}

// Add TypeDeclarationNode interface
export interface TypeDeclarationNode extends Node {
  type: NodeType.TYPE_DECLARATION;
  name: string;
  fields: { name: string; valueType: string; line: number; column: number }[];
}

/**
 * Main parser class that converts tokens into a Concrete Syntax Tree
 */
export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  /**
   * Parse the tokens into a CST
   */
  parse(): ProgramNode {
    const body: StatementNode[] = [];
    
    while (!this.isAtEnd()) {
      const statement = this.parseStatement();
      if (statement) {
        body.push(statement);
      }
    }
    
    return {
      type: NodeType.PROGRAM,
      body,
      start: 0,
      end: this.tokens[this.tokens.length - 1]?.column || 0
    };
  }

  /**
   * Parse a statement (now supports type declarations)
   */
  private parseStatement(): StatementNode | null {
    const token = this.peek();
    
    switch (token.type) {
      case TokenType.FUNCTION:
        return this.parseFunctionDeclaration();
      case TokenType.VAR:
      case TokenType.LET:
      case TokenType.CONST:
        return this.parseVariableDeclaration();
      case TokenType.IF:
        return this.parseIfStatement();
      case TokenType.WHILE:
        return this.parseWhileStatement();
      case TokenType.FOR:
        return this.parseForStatement();
      case TokenType.RETURN:
        return this.parseReturnStatement();
      case TokenType.LEFT_BRACE:
        return this.parseBlockStatement();
      // Add support for 'type' keyword
      case TokenType.IDENTIFIER:
        if (token.value === 'type') {
          return this.parseTypeDeclaration();
        }
        // fallthrough
      default:
        return this.parseExpressionStatement();
    }
  }

  /**
   * Parse a function declaration
   */
  private parseFunctionDeclaration(): FunctionDeclarationNode {
    const start = this.current;
    
    this.consume(TokenType.FUNCTION, 'Expected function keyword');
    const name = this.consume(TokenType.IDENTIFIER, 'Expected function name').value;
    
    this.consume(TokenType.LEFT_PAREN, 'Expected ( after function name');
    
    const params: string[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        params.push(this.consume(TokenType.IDENTIFIER, 'Expected parameter name').value);
      } while (this.match(TokenType.COMMA));
    }
    
    this.consume(TokenType.RIGHT_PAREN, 'Expected ) after parameters');
    
    // Handle optional return type annotation (Identifier or Identifier[])
    if (this.match(TokenType.OPERATOR) && this.previous().value === ':') {
      if (this.check(TokenType.IDENTIFIER)) {
        this.advance(); // consume the return type identifier
        // Optionally consume [] for array types
        if (this.check(TokenType.LEFT_BRACKET)) {
          this.advance();
          if (this.check(TokenType.RIGHT_BRACKET)) {
            this.advance();
          }
        }
      }
    }
    
    const body = this.parseBlockStatement();
    
    return {
      type: NodeType.FUNCTION_DECLARATION,
      name,
      params,
      body,
      start,
      end: this.current
    };
  }

  /**
   * Parse a variable declaration
   */
  private parseVariableDeclaration(): VariableDeclarationNode {
    const start = this.current;
    const kind = this.advance().value as 'var' | 'let' | 'const';
    const name = this.consume(TokenType.IDENTIFIER, 'Expected variable name').value;
    
    let init: ExpressionNode | null = null;
    if (this.match(TokenType.OPERATOR) && this.previous().value === '=') {
      init = this.parseExpression();
    }
    
    this.consume(TokenType.SEMICOLON, 'Expected ; after variable declaration');
    
    return {
      type: NodeType.VARIABLE_DECLARATION,
      kind,
      name,
      init,
      start,
      end: this.current
    };
  }

  /**
   * Parse an if statement
   */
  private parseIfStatement(): IfStatementNode {
    const start = this.current;
    
    this.consume(TokenType.IF, 'Expected if keyword');
    this.consume(TokenType.LEFT_PAREN, 'Expected ( after if');
    const test = this.parseExpression();
    this.consume(TokenType.RIGHT_PAREN, 'Expected ) after if condition');
    
    const consequent = this.parseStatement();
    if (!consequent) {
      throw new Error('Expected statement after if condition');
    }
    
    let alternate: StatementNode | null = null;
    
    if (this.match(TokenType.ELSE)) {
      alternate = this.parseStatement();
      if (!alternate) {
        throw new Error('Expected statement after else');
      }
    }
    
    return {
      type: NodeType.IF_STATEMENT,
      test,
      consequent,
      alternate,
      start,
      end: this.current
    };
  }

  /**
   * Parse a while statement
   */
  private parseWhileStatement(): WhileStatementNode {
    const start = this.current;
    
    this.consume(TokenType.WHILE, 'Expected while keyword');
    this.consume(TokenType.LEFT_PAREN, 'Expected ( after while');
    const test = this.parseExpression();
    this.consume(TokenType.RIGHT_PAREN, 'Expected ) after while condition');
    
    const body = this.parseStatement();
    if (!body) {
      throw new Error('Expected statement after while condition');
    }
    
    return {
      type: NodeType.WHILE_STATEMENT,
      test,
      body,
      start,
      end: this.current
    };
  }

  /**
   * Parse a for statement
   */
  private parseForStatement(): ForStatementNode {
    const start = this.current;
    
    this.consume(TokenType.FOR, 'Expected for keyword');
    this.consume(TokenType.LEFT_PAREN, 'Expected ( after for');
    
    let init: VariableDeclarationNode | ExpressionNode | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      if (this.match(TokenType.VAR, TokenType.LET, TokenType.CONST)) {
        init = this.parseVariableDeclaration();
      } else {
        init = this.parseExpression();
        this.consume(TokenType.SEMICOLON, 'Expected ; after for loop initializer');
      }
    }
    
    let test: ExpressionNode | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      test = this.parseExpression();
    }
    this.consume(TokenType.SEMICOLON, 'Expected ; after for loop condition');
    
    let update: ExpressionNode | null = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      update = this.parseExpression();
    }
    this.consume(TokenType.RIGHT_PAREN, 'Expected ) after for loop clauses');
    
    const body = this.parseStatement();
    if (!body) {
      throw new Error('Expected statement after for loop clauses');
    }
    
    return {
      type: NodeType.FOR_STATEMENT,
      init,
      test,
      update,
      body,
      start,
      end: this.current
    };
  }

  /**
   * Parse a return statement
   */
  private parseReturnStatement(): ReturnStatementNode {
    const start = this.current;
    
    this.consume(TokenType.RETURN, 'Expected return keyword');
    
    let argument: ExpressionNode | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      argument = this.parseExpression();
    }
    
    this.consume(TokenType.SEMICOLON, 'Expected ; after return statement');
    
    return {
      type: NodeType.RETURN_STATEMENT,
      argument,
      start,
      end: this.current
    };
  }

  /**
   * Parse a block statement
   */
  private parseBlockStatement(): BlockStatementNode {
    const start = this.current;
    
    this.consume(TokenType.LEFT_BRACE, 'Expected {');
    
    const body: StatementNode[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const statement = this.parseStatement();
      if (statement) {
        body.push(statement);
      }
    }
    
    this.consume(TokenType.RIGHT_BRACE, 'Expected }');
    
    return {
      type: NodeType.BLOCK_STATEMENT,
      body,
      start,
      end: this.current
    };
  }

  /**
   * Parse an expression statement
   */
  private parseExpressionStatement(): ExpressionStatementNode {
    const start = this.current;
    const expression = this.parseExpression();
    this.consume(TokenType.SEMICOLON, 'Expected ; after expression');
    
    return {
      type: NodeType.EXPRESSION_STATEMENT,
      expression,
      start,
      end: this.current
    };
  }

  /**
   * Parse an expression
   */
  private parseExpression(): ExpressionNode {
    return this.parseAssignment();
  }

  /**
   * Parse an assignment expression
   */
  private parseAssignment(): ExpressionNode {
    const expr = this.parseOr();
    
    if (this.match(TokenType.OPERATOR) && this.previous().value === '=') {
      const equals = this.previous();
      const value = this.parseAssignment();
      
      if (expr.type === NodeType.IDENTIFIER) {
        return {
          type: NodeType.BINARY_EXPRESSION,
          operator: '=',
          left: expr,
          right: value,
          start: expr.start,
          end: value.end
        };
      }
      
      throw new Error('Invalid assignment target');
    }
    
    return expr;
  }

  /**
   * Parse an OR expression
   */
  private parseOr(): ExpressionNode {
    let expr = this.parseAnd();
    
    while (this.match(TokenType.OPERATOR) && this.previous().value === '||') {
      const operator = this.previous();
      const right = this.parseAnd();
      expr = {
        type: NodeType.BINARY_EXPRESSION,
        operator: operator.value,
        left: expr,
        right,
        start: expr.start,
        end: right.end
      };
    }
    
    return expr;
  }

  /**
   * Parse an AND expression
   */
  private parseAnd(): ExpressionNode {
    let expr = this.parseEquality();
    
    while (this.match(TokenType.OPERATOR) && this.previous().value === '&&') {
      const operator = this.previous();
      const right = this.parseEquality();
      expr = {
        type: NodeType.BINARY_EXPRESSION,
        operator: operator.value,
        left: expr,
        right,
        start: expr.start,
        end: right.end
      };
    }
    
    return expr;
  }

  /**
   * Parse an equality expression
   */
  private parseEquality(): ExpressionNode {
    let expr = this.parseComparison();
    
    while (this.match(TokenType.OPERATOR) && ['!=', '=='].includes(this.previous().value)) {
      const operator = this.previous();
      const right = this.parseComparison();
      expr = {
        type: NodeType.BINARY_EXPRESSION,
        operator: operator.value,
        left: expr,
        right,
        start: expr.start,
        end: right.end
      };
    }
    
    return expr;
  }

  /**
   * Parse a comparison expression
   */
  private parseComparison(): ExpressionNode {
    let expr = this.parseTerm();
    
    while (this.match(TokenType.OPERATOR) && ['>', '>=', '<', '<='].includes(this.previous().value)) {
      const operator = this.previous();
      const right = this.parseTerm();
      expr = {
        type: NodeType.BINARY_EXPRESSION,
        operator: operator.value,
        left: expr,
        right,
        start: expr.start,
        end: right.end
      };
    }
    
    return expr;
  }

  /**
   * Parse a term expression
   */
  private parseTerm(): ExpressionNode {
    let expr = this.parseFactor();
    
    while (this.match(TokenType.OPERATOR) && ['-', '+'].includes(this.previous().value)) {
      const operator = this.previous();
      const right = this.parseFactor();
      expr = {
        type: NodeType.BINARY_EXPRESSION,
        operator: operator.value,
        left: expr,
        right,
        start: expr.start,
        end: right.end
      };
    }
    
    return expr;
  }

  /**
   * Parse a factor expression
   */
  private parseFactor(): ExpressionNode {
    let expr = this.parseUnary();
    
    while (this.match(TokenType.OPERATOR) && ['/', '*'].includes(this.previous().value)) {
      const operator = this.previous();
      const right = this.parseUnary();
      expr = {
        type: NodeType.BINARY_EXPRESSION,
        operator: operator.value,
        left: expr,
        right,
        start: expr.start,
        end: right.end
      };
    }
    
    return expr;
  }

  /**
   * Parse a unary expression
   */
  private parseUnary(): ExpressionNode {
    if (this.match(TokenType.OPERATOR) && ['!', '-'].includes(this.peek().value)) {
      const operator = this.advance();
      const right = this.parseUnary();
      return {
        type: NodeType.UNARY_EXPRESSION,
        operator: operator.value,
        argument: right,
        start: operator.line,
        end: right.end
      };
    }
    
    return this.parseCall();
  }

  /**
   * Parse a call expression
   */
  private parseCall(): ExpressionNode {
    let expr = this.parsePrimary();
    
    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(TokenType.DOT)) {
        this.consume(TokenType.IDENTIFIER, 'Expected property name after .');
        const name = this.previous();
        expr = {
          type: NodeType.MEMBER_EXPRESSION,
          object: expr,
          property: {
            type: NodeType.IDENTIFIER,
            name: name.value,
            start: name.line,
            end: name.column
          },
          computed: false,
          start: expr.start,
          end: name.column
        };
      } else {
        break;
      }
    }
    
    return expr;
  }

  /**
   * Finish parsing a call expression
   */
  private finishCall(callee: ExpressionNode): CallExpressionNode {
    const args: ExpressionNode[] = [];
    
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        args.push(this.parseExpression());
      } while (this.match(TokenType.COMMA));
    }
    
    this.consume(TokenType.RIGHT_PAREN, 'Expected ) after arguments');
    
    return {
      type: NodeType.CALL_EXPRESSION,
      callee,
      arguments: args,
      start: callee.start,
      end: this.current
    };
  }

  /**
   * Parse a primary expression
   */
  private parsePrimary(): ExpressionNode {
    if (this.match(TokenType.FALSE)) {
      return this.literal(false);
    }
    if (this.match(TokenType.TRUE)) {
      return this.literal(true);
    }
    if (this.match(TokenType.NULL)) {
      return this.literal(null);
    }
    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return this.literal(this.previous().value);
    }
    if (this.match(TokenType.IDENTIFIER)) {
      return {
        type: NodeType.IDENTIFIER,
        name: this.previous().value,
        start: this.previous().line,
        end: this.previous().column
      };
    }
    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RIGHT_PAREN, 'Expected ) after expression');
      return expr;
    }
    
    throw new Error('Unexpected token');
  }

  /**
   * Create a literal node
   */
  private literal(value: any): LiteralNode {
    return {
      type: NodeType.LITERAL,
      value,
      start: this.previous().line,
      end: this.previous().column
    };
  }

  /**
   * Parse a type declaration
   */
  private parseTypeDeclaration(): TypeDeclarationNode {
    const start = this.current;
    const typeToken = this.consume(TokenType.IDENTIFIER, 'Expected "type" keyword');
    if (typeToken.value !== 'type') {
      this.throwError(typeToken, 'Expected "type" keyword');
    }
    const nameToken = this.consume(TokenType.IDENTIFIER, 'Expected type name');
    const name = nameToken.value;
    this.consume(TokenType.LEFT_BRACE, 'Expected { after type name');
    const fields: { name: string; valueType: string; line: number; column: number }[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const fieldNameToken = this.consume(TokenType.IDENTIFIER, 'Expected field name in type');
      this.consume(TokenType.OPERATOR, `Expected : after field name '${fieldNameToken.value}'`);
      const typeToken = this.consume(TokenType.IDENTIFIER, `Expected type for field '${fieldNameToken.value}'`);
      fields.push({
        name: fieldNameToken.value,
        valueType: typeToken.value,
        line: fieldNameToken.line,
        column: fieldNameToken.column
      });
      // Optional semicolon after each field
      if (this.check(TokenType.SEMICOLON)) {
        this.advance();
      }
    }
    this.consume(TokenType.RIGHT_BRACE, 'Expected } after type fields');
    return {
      type: NodeType.TYPE_DECLARATION,
      name,
      fields,
      start,
      end: this.current
    };
  }

  /**
   * Check if current token matches any of the given types
   */
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  /**
   * Check if current token is of the given type
   */
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  /**
   * Advance to next token
   */
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  /**
   * Check if we're at the end
   */
  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  /**
   * Peek at current token
   */
  private peek(): Token {
    return this.tokens[this.current];
  }

  /**
   * Get previous token
   */
  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  /**
   * Consume a token of the expected type
   */
  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    this.throwError(this.peek(), message);
  }

  // Helper to throw errors with line/column
  private throwError(token: Token, message: string): never {
    throw new Error(`${message} (at line ${token.line}, column ${token.column})`);
  }
} 