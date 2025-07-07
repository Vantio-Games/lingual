import { Token } from '../tokenizer/types.js';
import { 
  ProgramNode, 
  StatementNode, 
  ExpressionNode,
  FunctionDeclarationNode,
  VariableDeclarationNode,
  ExpressionStatementNode,
  IfStatementNode,
  WhileStatementNode,
  ForStatementNode,
  ReturnStatementNode,
  BlockStatementNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  CallExpressionNode,
  MemberExpressionNode,
  IdentifierNode,
  LiteralNode,
  NodeType,
  TypeDeclarationNode
} from '../parser/parser.js';

/**
 * Abstract Syntax Tree node types
 */
export enum ASTNodeType {
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
  // Add support for type declarations
  TYPE_DECLARATION = 'TYPE_DECLARATION'
}

/**
 * Base AST node interface
 */
export interface ASTNode {
  type: ASTNodeType;
  location?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

/**
 * AST Program node
 */
export interface ASTProgramNode extends ASTNode {
  type: ASTNodeType.PROGRAM;
  body: ASTStatementNode[];
}

/**
 * AST Statement node types
 */
export type ASTStatementNode = 
  | ASTFunctionDeclarationNode
  | ASTVariableDeclarationNode
  | ASTExpressionStatementNode
  | ASTIfStatementNode
  | ASTWhileStatementNode
  | ASTForStatementNode
  | ASTReturnStatementNode
  | ASTBlockStatementNode
  | ASTTypeDeclarationNode;

/**
 * AST Expression node types
 */
export type ASTExpressionNode = 
  | ASTBinaryExpressionNode
  | ASTUnaryExpressionNode
  | ASTCallExpressionNode
  | ASTMemberExpressionNode
  | ASTIdentifierNode
  | ASTLiteralNode;

/**
 * AST Function declaration node
 */
export interface ASTFunctionDeclarationNode extends ASTNode {
  type: ASTNodeType.FUNCTION_DECLARATION;
  name: string;
  params: string[];
  body: ASTBlockStatementNode;
}

/**
 * AST Variable declaration node
 */
export interface ASTVariableDeclarationNode extends ASTNode {
  type: ASTNodeType.VARIABLE_DECLARATION;
  kind: 'var' | 'let' | 'const';
  name: string;
  init: ASTExpressionNode | null;
}

/**
 * AST Expression statement node
 */
export interface ASTExpressionStatementNode extends ASTNode {
  type: ASTNodeType.EXPRESSION_STATEMENT;
  expression: ASTExpressionNode;
}

/**
 * AST If statement node
 */
export interface ASTIfStatementNode extends ASTNode {
  type: ASTNodeType.IF_STATEMENT;
  test: ASTExpressionNode;
  consequent: ASTStatementNode;
  alternate: ASTStatementNode | null;
}

/**
 * AST While statement node
 */
export interface ASTWhileStatementNode extends ASTNode {
  type: ASTNodeType.WHILE_STATEMENT;
  test: ASTExpressionNode;
  body: ASTStatementNode;
}

/**
 * AST For statement node
 */
export interface ASTForStatementNode extends ASTNode {
  type: ASTNodeType.FOR_STATEMENT;
  init: ASTVariableDeclarationNode | ASTExpressionNode | null;
  test: ASTExpressionNode | null;
  update: ASTExpressionNode | null;
  body: ASTStatementNode;
}

/**
 * AST Return statement node
 */
export interface ASTReturnStatementNode extends ASTNode {
  type: ASTNodeType.RETURN_STATEMENT;
  argument: ASTExpressionNode | null;
}

/**
 * AST Block statement node
 */
export interface ASTBlockStatementNode extends ASTNode {
  type: ASTNodeType.BLOCK_STATEMENT;
  body: ASTStatementNode[];
}

/**
 * AST Binary expression node
 */
export interface ASTBinaryExpressionNode extends ASTNode {
  type: ASTNodeType.BINARY_EXPRESSION;
  operator: string;
  left: ASTExpressionNode;
  right: ASTExpressionNode;
}

/**
 * AST Unary expression node
 */
export interface ASTUnaryExpressionNode extends ASTNode {
  type: ASTNodeType.UNARY_EXPRESSION;
  operator: string;
  argument: ASTExpressionNode;
}

/**
 * AST Call expression node
 */
export interface ASTCallExpressionNode extends ASTNode {
  type: ASTNodeType.CALL_EXPRESSION;
  callee: ASTExpressionNode;
  arguments: ASTExpressionNode[];
}

/**
 * AST Member expression node
 */
export interface ASTMemberExpressionNode extends ASTNode {
  type: ASTNodeType.MEMBER_EXPRESSION;
  object: ASTExpressionNode;
  property: ASTExpressionNode;
  computed: boolean;
}

/**
 * AST Identifier node
 */
export interface ASTIdentifierNode extends ASTNode {
  type: ASTNodeType.IDENTIFIER;
  name: string;
}

/**
 * AST Literal node
 */
export interface ASTLiteralNode extends ASTNode {
  type: ASTNodeType.LITERAL;
  value: string | number | boolean | null;
}

/**
 * AST Type Declaration node
 */
export interface ASTTypeDeclarationNode extends ASTNode {
  type: ASTNodeType.TYPE_DECLARATION;
  name: string;
  fields: { name: string; valueType: string; line: number; column: number }[];
}

/**
 * AST Converter that transforms CST into AST
 */
export class ASTConverter {
  /**
   * Convert a CST Program node to an AST Program node
   */
  convertProgram(cstProgram: ProgramNode): ASTProgramNode {
    return {
      type: ASTNodeType.PROGRAM,
      body: cstProgram.body.map(statement => this.convertStatement(statement)),
      location: this.convertLocation(cstProgram.start, cstProgram.end)
    };
  }

  /**
   * Convert a CST Statement node to an AST Statement node
   */
  convertStatement(cstStatement: StatementNode): ASTStatementNode {
    switch (cstStatement.type) {
      case NodeType.FUNCTION_DECLARATION:
        return this.convertFunctionDeclaration(cstStatement as FunctionDeclarationNode);
      case NodeType.VARIABLE_DECLARATION:
        return this.convertVariableDeclaration(cstStatement as VariableDeclarationNode);
      case NodeType.EXPRESSION_STATEMENT:
        return this.convertExpressionStatement(cstStatement as ExpressionStatementNode);
      case NodeType.IF_STATEMENT:
        return this.convertIfStatement(cstStatement as IfStatementNode);
      case NodeType.WHILE_STATEMENT:
        return this.convertWhileStatement(cstStatement as WhileStatementNode);
      case NodeType.FOR_STATEMENT:
        return this.convertForStatement(cstStatement as ForStatementNode);
      case NodeType.RETURN_STATEMENT:
        return this.convertReturnStatement(cstStatement as ReturnStatementNode);
      case NodeType.BLOCK_STATEMENT:
        return this.convertBlockStatement(cstStatement as BlockStatementNode);
      case NodeType.TYPE_DECLARATION:
        return this.convertTypeDeclaration(cstStatement as TypeDeclarationNode);
      default:
        throw new Error(`Unsupported statement type: ${(cstStatement as any).type}`);
    }
  }

  /**
   * Convert a CST Expression node to an AST Expression node
   */
  convertExpression(cstExpression: ExpressionNode): ASTExpressionNode {
    switch (cstExpression.type) {
      case NodeType.BINARY_EXPRESSION:
        return this.convertBinaryExpression(cstExpression as BinaryExpressionNode);
      case NodeType.UNARY_EXPRESSION:
        return this.convertUnaryExpression(cstExpression as UnaryExpressionNode);
      case NodeType.CALL_EXPRESSION:
        return this.convertCallExpression(cstExpression as CallExpressionNode);
      case NodeType.MEMBER_EXPRESSION:
        return this.convertMemberExpression(cstExpression as MemberExpressionNode);
      case NodeType.IDENTIFIER:
        return this.convertIdentifier(cstExpression as IdentifierNode);
      case NodeType.LITERAL:
        return this.convertLiteral(cstExpression as LiteralNode);
      default:
        throw new Error(`Unsupported expression type: ${(cstExpression as any).type}`);
    }
  }

  /**
   * Convert a CST Function Declaration to an AST Function Declaration
   */
  convertFunctionDeclaration(cstFunction: FunctionDeclarationNode): ASTFunctionDeclarationNode {
    return {
      type: ASTNodeType.FUNCTION_DECLARATION,
      name: cstFunction.name,
      params: cstFunction.params,
      body: this.convertBlockStatement(cstFunction.body),
      location: this.convertLocation(cstFunction.start, cstFunction.end)
    };
  }

  /**
   * Convert a CST Variable Declaration to an AST Variable Declaration
   */
  convertVariableDeclaration(cstVariable: VariableDeclarationNode): ASTVariableDeclarationNode {
    return {
      type: ASTNodeType.VARIABLE_DECLARATION,
      kind: cstVariable.kind,
      name: cstVariable.name,
      init: cstVariable.init ? this.convertExpression(cstVariable.init) : null,
      location: this.convertLocation(cstVariable.start, cstVariable.end)
    };
  }

  /**
   * Convert a CST Expression Statement to an AST Expression Statement
   */
  convertExpressionStatement(cstExpressionStmt: ExpressionStatementNode): ASTExpressionStatementNode {
    return {
      type: ASTNodeType.EXPRESSION_STATEMENT,
      expression: this.convertExpression(cstExpressionStmt.expression),
      location: this.convertLocation(cstExpressionStmt.start, cstExpressionStmt.end)
    };
  }

  /**
   * Convert a CST If Statement to an AST If Statement
   */
  convertIfStatement(cstIf: IfStatementNode): ASTIfStatementNode {
    return {
      type: ASTNodeType.IF_STATEMENT,
      test: this.convertExpression(cstIf.test),
      consequent: this.convertStatement(cstIf.consequent),
      alternate: cstIf.alternate ? this.convertStatement(cstIf.alternate) : null,
      location: this.convertLocation(cstIf.start, cstIf.end)
    };
  }

  /**
   * Convert a CST While Statement to an AST While Statement
   */
  convertWhileStatement(cstWhile: WhileStatementNode): ASTWhileStatementNode {
    return {
      type: ASTNodeType.WHILE_STATEMENT,
      test: this.convertExpression(cstWhile.test),
      body: this.convertStatement(cstWhile.body),
      location: this.convertLocation(cstWhile.start, cstWhile.end)
    };
  }

  /**
   * Convert a CST For Statement to an AST For Statement
   */
  convertForStatement(cstFor: ForStatementNode): ASTForStatementNode {
    return {
      type: ASTNodeType.FOR_STATEMENT,
      init: cstFor.init ? this.convertStatementOrExpression(cstFor.init) : null,
      test: cstFor.test ? this.convertExpression(cstFor.test) : null,
      update: cstFor.update ? this.convertExpression(cstFor.update) : null,
      body: this.convertStatement(cstFor.body),
      location: this.convertLocation(cstFor.start, cstFor.end)
    };
  }

  /**
   * Convert a CST Return Statement to an AST Return Statement
   */
  convertReturnStatement(cstReturn: ReturnStatementNode): ASTReturnStatementNode {
    return {
      type: ASTNodeType.RETURN_STATEMENT,
      argument: cstReturn.argument ? this.convertExpression(cstReturn.argument) : null,
      location: this.convertLocation(cstReturn.start, cstReturn.end)
    };
  }

  /**
   * Convert a CST Block Statement to an AST Block Statement
   */
  convertBlockStatement(cstBlock: BlockStatementNode): ASTBlockStatementNode {
    return {
      type: ASTNodeType.BLOCK_STATEMENT,
      body: cstBlock.body.map(statement => this.convertStatement(statement)),
      location: this.convertLocation(cstBlock.start, cstBlock.end)
    };
  }

  /**
   * Convert a CST Binary Expression to an AST Binary Expression
   */
  convertBinaryExpression(cstBinary: BinaryExpressionNode): ASTBinaryExpressionNode {
    return {
      type: ASTNodeType.BINARY_EXPRESSION,
      operator: cstBinary.operator,
      left: this.convertExpression(cstBinary.left),
      right: this.convertExpression(cstBinary.right),
      location: this.convertLocation(cstBinary.start, cstBinary.end)
    };
  }

  /**
   * Convert a CST Unary Expression to an AST Unary Expression
   */
  convertUnaryExpression(cstUnary: UnaryExpressionNode): ASTUnaryExpressionNode {
    return {
      type: ASTNodeType.UNARY_EXPRESSION,
      operator: cstUnary.operator,
      argument: this.convertExpression(cstUnary.argument),
      location: this.convertLocation(cstUnary.start, cstUnary.end)
    };
  }

  /**
   * Convert a CST Call Expression to an AST Call Expression
   */
  convertCallExpression(cstCall: CallExpressionNode): ASTCallExpressionNode {
    return {
      type: ASTNodeType.CALL_EXPRESSION,
      callee: this.convertExpression(cstCall.callee),
      arguments: cstCall.arguments.map(arg => this.convertExpression(arg)),
      location: this.convertLocation(cstCall.start, cstCall.end)
    };
  }

  /**
   * Convert a CST Member Expression to an AST Member Expression
   */
  convertMemberExpression(cstMember: MemberExpressionNode): ASTMemberExpressionNode {
    return {
      type: ASTNodeType.MEMBER_EXPRESSION,
      object: this.convertExpression(cstMember.object),
      property: this.convertExpression(cstMember.property),
      computed: cstMember.computed,
      location: this.convertLocation(cstMember.start, cstMember.end)
    };
  }

  /**
   * Convert a CST Identifier to an AST Identifier
   */
  convertIdentifier(cstIdentifier: IdentifierNode): ASTIdentifierNode {
    return {
      type: ASTNodeType.IDENTIFIER,
      name: cstIdentifier.name,
      location: this.convertLocation(cstIdentifier.start, cstIdentifier.end)
    };
  }

  /**
   * Convert a CST Literal to an AST Literal
   */
  convertLiteral(cstLiteral: LiteralNode): ASTLiteralNode {
    return {
      type: ASTNodeType.LITERAL,
      value: cstLiteral.value,
      location: this.convertLocation(cstLiteral.start, cstLiteral.end)
    };
  }

  /**
   * Convert a CST Type Declaration to an AST Type Declaration
   */
  convertTypeDeclaration(cstType: TypeDeclarationNode): ASTTypeDeclarationNode {
    return {
      type: ASTNodeType.TYPE_DECLARATION,
      name: cstType.name,
      fields: cstType.fields,
      location: this.convertLocation(cstType.start, cstType.end)
    };
  }

  /**
   * Convert a CST Statement or Expression to an AST Statement or Expression
   */
  convertStatementOrExpression(node: StatementNode | ExpressionNode): ASTVariableDeclarationNode | ASTExpressionNode {
    // Check if it's a VariableDeclaration (which can be used as init in FOR statements)
    if (node.type === NodeType.VARIABLE_DECLARATION) {
      return this.convertVariableDeclaration(node as VariableDeclarationNode);
    }
    // Check if it's an ExpressionStatement (which contains an expression)
    else if (node.type === NodeType.EXPRESSION_STATEMENT) {
      return this.convertExpression((node as ExpressionStatementNode).expression);
    }
    // Otherwise, it must be an expression
    else {
      return this.convertExpression(node as ExpressionNode);
    }
  }

  /**
   * Convert CST location to AST location
   */
  private convertLocation(start: number, end: number) {
    // This is a simplified conversion - in a real implementation,
    // you'd want to track line and column information more precisely
    return {
      start: { line: 1, column: start },
      end: { line: 1, column: end }
    };
  }
} 