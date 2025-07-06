import { CstParser } from 'chevrotain';
import * as tokens from '../lexer/tokens.js';

export class LingualParser extends CstParser {
  constructor() {
    super(tokens.allTokens);
    this.performSelfAnalysis();
  }

  // Program: the root rule
  public program = this.RULE('program', () => {
    const statements = this.MANY(() => this.SUBRULE(this.statement));
    // MANY always returns an array, so just return statements
    return { type: 'Program', body: statements } as any;
  });

  // Statement rules - supporting all language constructs
  private statement = this.RULE('statement', () => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.apiDefinition) },
      { ALT: () => this.SUBRULE(this.typeDefinition) },
      { ALT: () => this.SUBRULE(this.moduleDefinition) },
      { ALT: () => this.SUBRULE(this.functionDeclaration) },
      { ALT: () => this.SUBRULE(this.variableDeclaration) },
      { ALT: () => this.SUBRULE(this.forStatement) },
      { ALT: () => this.SUBRULE(this.ifStatement) },
      { ALT: () => this.SUBRULE(this.returnStatement) },
      { ALT: () => this.SUBRULE(this.expressionStatement) },
      { ALT: () => this.SUBRULE(this.macroDefinition) },
      { ALT: () => this.SUBRULE(this.importStatement) },
      { ALT: () => this.SUBRULE(this.exportStatement) }
    ]);
  });

  // API Definition
  private apiDefinition = this.RULE('apiDefinition', () => {
    this.CONSUME(tokens.Api);
    const name = this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.apiProperty));
    this.CONSUME(tokens.RightBrace);
    
    return {
      type: 'ApiDefinition',
      name: { type: 'Identifier', name: name.image }
    } as any;
  });

  private apiProperty = this.RULE('apiProperty', () => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.apiMethodProperty) },
      { ALT: () => this.SUBRULE(this.apiPathProperty) },
      { ALT: () => this.SUBRULE(this.apiParamsProperty) },
      { ALT: () => this.SUBRULE(this.apiReturnsProperty) },
      { ALT: () => this.SUBRULE(this.apiHeadersProperty) },
      { ALT: () => this.SUBRULE(this.apiDescriptionProperty) }
    ]);
  });

  private apiMethodProperty = this.RULE('apiMethodProperty', () => {
    this.CONSUME(tokens.Method);
    this.CONSUME(tokens.Colon);
    const method = this.CONSUME(tokens.Identifier);
    return { type: 'method', value: method.image };
  });

  private apiPathProperty = this.RULE('apiPathProperty', () => {
    this.CONSUME(tokens.Path);
    this.CONSUME(tokens.Colon);
    const path = this.CONSUME(tokens.StringLiteral);
    return { type: 'path', value: path.image.slice(1, -1) };
  });

  private apiParamsProperty = this.RULE('apiParamsProperty', () => {
    this.CONSUME(tokens.Params);
    this.CONSUME(tokens.Colon);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.apiParameter));
    this.CONSUME(tokens.RightBrace);
    return { type: 'params', value: [] };
  });

  private apiParameter = this.RULE('apiParameter', () => {
    const paramName = this.CONSUME1(tokens.Identifier);
    this.CONSUME(tokens.Colon);
    const paramType = this.SUBRULE(this.typeAnnotation);
    this.OPTION(() => {
      this.CONSUME(tokens.Required);
    });
    
    return {
      type: 'ApiParameter',
      name: { type: 'Identifier', name: paramName.image },
      typeAnnotation: paramType,
      required: false
    };
  });

  private apiReturnsProperty = this.RULE('apiReturnsProperty', () => {
    this.CONSUME(tokens.Returns);
    this.CONSUME(tokens.Colon);
    const returns = this.SUBRULE(this.typeAnnotation);
    return { type: 'returns', value: returns };
  });

  private apiHeadersProperty = this.RULE('apiHeadersProperty', () => {
    this.CONSUME(tokens.Headers);
    this.CONSUME(tokens.Colon);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.headerProperty));
    this.CONSUME(tokens.RightBrace);
    return { type: 'headers', value: [] };
  });

  private headerProperty = this.RULE('headerProperty', () => {
    const headerKey = this.CONSUME1(tokens.StringLiteral);
    this.CONSUME(tokens.Colon);
    const headerValue = this.CONSUME2(tokens.StringLiteral);
    this.CONSUME(tokens.Semicolon);
    return { key: headerKey.image.slice(1, -1), value: headerValue.image.slice(1, -1) };
  });

  private apiDescriptionProperty = this.RULE('apiDescriptionProperty', () => {
    this.CONSUME(tokens.Description);
    this.CONSUME(tokens.Colon);
    const description = this.CONSUME(tokens.StringLiteral);
    return { type: 'description', value: description.image.slice(1, -1) };
  });

  // Type Definition
  private typeDefinition = this.RULE('typeDefinition', () => {
    this.CONSUME(tokens.Type);
    const typeName = this.CONSUME(tokens.Identifier);
    // Handle generic type parameters (e.g., ApiResponse<T>)
    this.OPTION(() => {
      this.CONSUME(tokens.LessThan);
      this.CONSUME1(tokens.Identifier);
      this.MANY(() => {
        this.CONSUME(tokens.Comma);
        this.CONSUME2(tokens.Identifier);
      });
      this.CONSUME(tokens.GreaterThan);
    });
    this.CONSUME(tokens.LeftBrace);
    const fields: any[] = [];
    this.MANY2(() => {
      const field = this.SUBRULE(this.typeField);
      fields.push(field);
    });
    this.CONSUME(tokens.RightBrace);
    
    return {
      type: 'TypeDefinition',
      name: { type: 'Identifier', name: typeName.image },
      fields
    } as any;
  });

  private typeField = this.RULE('typeField', () => {
    const fieldName = this.CONSUME1(tokens.Identifier);
    this.CONSUME(tokens.Colon);
    const fieldType = this.SUBRULE(this.typeAnnotation);
    const modifier = this.OPTION(() => {
      return this.OR([
        { ALT: () => this.CONSUME(tokens.Required) },
        { ALT: () => this.CONSUME(tokens.Optional) }
      ]);
    });
    
    return {
      type: 'TypeField',
      name: { type: 'Identifier', name: fieldName.image },
      typeAnnotation: fieldType,
      required: true
    };
  });

  // Module Definition
  private moduleDefinition = this.RULE('moduleDefinition', () => {
    this.CONSUME(tokens.Module);
    const name = this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LeftBrace);
    this.MANY(() => this.SUBRULE(this.statement));
    this.CONSUME(tokens.RightBrace);
    
    return {
      type: 'ModuleDefinition',
      name: { type: 'Identifier', name: name.image },
      apis: [],
      types: [],
      functions: []
    } as any;
  });

  // Import Statement
  private importStatement = this.RULE('importStatement', () => {
    this.CONSUME(tokens.Import);
    const items = this.SUBRULE(this.importItems);
    this.CONSUME(tokens.From);
    const module = this.CONSUME(tokens.StringLiteral);
    this.CONSUME(tokens.Semicolon);
    
    return {
      type: 'ImportStatement',
      items,
      module: module.image.slice(1, -1)
    } as any;
  });

  private importItems = this.RULE('importItems', () => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.importDefault) },
      { ALT: () => this.SUBRULE(this.importNamed) }
    ]);
  });

  private importDefault = this.RULE('importDefault', () => {
    const name = this.CONSUME(tokens.Identifier);
    return {
      type: 'ImportDefault',
      name: { type: 'Identifier', name: name.image }
    };
  });

  private importNamed = this.RULE('importNamed', () => {
    this.CONSUME(tokens.LeftBrace);
    const firstImportItem = this.CONSUME1(tokens.Identifier);
    const items = [firstImportItem];
    
    this.MANY(() => {
      this.CONSUME(tokens.Comma);
      const nextImportItem = this.CONSUME2(tokens.Identifier);
      items.push(nextImportItem);
    });
    
    this.CONSUME(tokens.RightBrace);
    return {
      type: 'ImportNamed',
      items: items.map(item => ({ type: 'Identifier', name: item.image }))
    };
  });

  // Export Statement
  private exportStatement = this.RULE('exportStatement', () => {
    this.CONSUME(tokens.Export);
    const statement = this.SUBRULE(this.statement);
    
    return {
      type: 'ExportStatement',
      statement
    } as any;
  });

  // Function declaration
  private functionDeclaration = this.RULE('functionDeclaration', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.Function) },
      { ALT: () => this.CONSUME(tokens.Fn) }
    ]);
    const name = this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LeftParen);
    const parameters = this.OPTION1(() => this.SUBRULE(this.parameterList));
    this.CONSUME(tokens.RightParen);
    
    const returnType = this.OPTION2(() => {
      this.CONSUME(tokens.Colon);
      return this.SUBRULE(this.typeAnnotation);
    });
    
    this.CONSUME(tokens.LeftBrace);
    const body: any[] = [];
    this.MANY(() => {
      const statement = this.SUBRULE(this.statement);
      body.push(statement);
    });
    this.CONSUME(tokens.RightBrace);
    
    return {
      type: 'FunctionDeclaration',
      name: { type: 'Identifier', name: name.image },
      parameters: parameters || [],
      returnType,
      body
    } as any;
  });

  // Parameter list
  private parameterList = this.RULE('parameterList', () => {
    const firstParam = this.SUBRULE1(this.parameter);
    const parameters = [firstParam];
    
    this.MANY(() => {
      this.CONSUME(tokens.Comma);
      const nextParam = this.SUBRULE2(this.parameter);
      parameters.push(nextParam);
    });
    
    return parameters;
  });

  // Parameter
  private parameter = this.RULE('parameter', () => {
    const name = this.CONSUME(tokens.Identifier);
    const typeAnnotation = this.OPTION(() => {
      this.CONSUME(tokens.Colon);
      return this.SUBRULE(this.typeAnnotation);
    });
    
    return {
      type: 'Parameter',
      name: { type: 'Identifier', name: name.image },
      typeAnnotation
    };
  });

  // Type annotation
  private typeAnnotation = this.RULE('typeAnnotation', () => {
    const typeName = this.OR([
      { ALT: () => this.CONSUME(tokens.Identifier) },
      { ALT: () => this.CONSUME(tokens.String) },
      { ALT: () => this.CONSUME(tokens.Number) },
      { ALT: () => this.CONSUME(tokens.Boolean) },
      { ALT: () => this.CONSUME(tokens.Void) },
      { ALT: () => this.CONSUME(tokens.Object) },
      { ALT: () => this.CONSUME(tokens.Array) }
    ]);
    
    // Only enter OPTION if next token is LessThan or LeftBracket
    const arrayOrGeneric = this.OPTION(() => {
      const nextToken = this.LA(1);
      if (nextToken.tokenType === tokens.LessThan) {
        // It's a generic argument list with angle brackets
        this.CONSUME(tokens.LessThan);
        const firstArg = this.SUBRULE1(this.simpleTypeAnnotation);
        const args = [firstArg];
        this.MANY(() => {
          this.CONSUME(tokens.Comma);
          const nextArg = this.SUBRULE2(this.simpleTypeAnnotation);
          args.push(nextArg);
        });
        this.CONSUME(tokens.GreaterThan);
        return { type: 'generic', arguments: args };
      } else if (nextToken.tokenType === tokens.LeftBracket) {
        // It's an array type with square brackets
        this.CONSUME(tokens.LeftBracket);
        const nextNextToken = this.LA(1);
        if (nextNextToken.tokenType === tokens.RightBracket) {
          this.CONSUME(tokens.RightBracket);
          return { type: 'array' };
        } else {
          // It's a generic argument list with square brackets (legacy support)
          const firstArg = this.SUBRULE3(this.simpleTypeAnnotation);
          const args = [firstArg];
          this.MANY1(() => {
            this.CONSUME(tokens.Comma);
            const nextArg = this.SUBRULE4(this.simpleTypeAnnotation);
            args.push(nextArg);
          });
          this.CONSUME(tokens.RightBracket);
          return { type: 'generic', arguments: args };
        }
      }
      return null;
    });
    
    return {
      type: 'TypeAnnotation',
      typeName: { type: 'Identifier', name: typeName.image },
      isArray: arrayOrGeneric?.type === 'array' || false,
      genericArguments: arrayOrGeneric?.type === 'generic' ? arrayOrGeneric.arguments : null
    };
  });

  private simpleTypeAnnotation = this.RULE('simpleTypeAnnotation', () => {
    const typeName = this.OR([
      { ALT: () => this.CONSUME(tokens.Identifier) },
      { ALT: () => this.CONSUME(tokens.String) },
      { ALT: () => this.CONSUME(tokens.Number) },
      { ALT: () => this.CONSUME(tokens.Boolean) },
      { ALT: () => this.CONSUME(tokens.Void) },
      { ALT: () => this.CONSUME(tokens.Object) },
      { ALT: () => this.CONSUME(tokens.Array) }
    ]);
    
    // Handle array syntax (e.g., string[])
    const isArray = this.OPTION(() => {
      this.CONSUME(tokens.LeftBracket);
      this.CONSUME(tokens.RightBracket);
      return true;
    });
    
    return {
      type: 'TypeAnnotation',
      typeName: { type: 'Identifier', name: typeName.image },
      isArray: isArray || false,
      genericArguments: null
    };
  });

  // Variable declaration
  private variableDeclaration = this.RULE('variableDeclaration', () => {
    this.OR([
      { ALT: () => this.CONSUME(tokens.Const) },
      { ALT: () => this.CONSUME(tokens.Let) },
      { ALT: () => this.CONSUME(tokens.Var) }
    ]);
    const name = this.CONSUME(tokens.Identifier);
    
    const declarationOptions = this.OPTION1(() => {
      const typeAnnotation = this.OPTION2(() => {
        this.CONSUME(tokens.Colon);
        return this.SUBRULE(this.typeAnnotation);
      });
      
      const initializer = this.OPTION3(() => {
        this.CONSUME(tokens.Assign);
        return this.SUBRULE(this.expression);
      });
      
      return { typeAnnotation, initializer };
    });
    
    this.CONSUME(tokens.Semicolon);
    
    return {
      type: 'VariableDeclaration',
      name: { type: 'Identifier', name: name.image },
      typeAnnotation: declarationOptions?.typeAnnotation || null,
      initializer: declarationOptions?.initializer || null
    } as any;
  });

  // Inline variable declaration (for use in for loop headers)
  private inlineVariableDeclaration = this.RULE('inlineVariableDeclaration', () => {
    this.CONSUME(tokens.Let);
    const name = this.CONSUME(tokens.Identifier);
    const declarationOptions = this.OPTION1(() => {
      const typeAnnotation = this.OPTION2(() => {
        this.CONSUME(tokens.Colon);
        return this.SUBRULE(this.typeAnnotation);
      });
      const initializer = this.OPTION3(() => {
        this.CONSUME(tokens.Assign);
        return this.SUBRULE(this.expression);
      });
      return { typeAnnotation, initializer };
    });
    return {
      type: 'VariableDeclaration',
      name: { type: 'Identifier', name: name.image },
      typeAnnotation: declarationOptions?.typeAnnotation || null,
      initializer: declarationOptions?.initializer || null
    } as any;
  });

  // Expression statement
  private expressionStatement = this.RULE('expressionStatement', () => {
    const expression = this.SUBRULE(this.expression);
    this.CONSUME(tokens.Semicolon);
    
    return {
      type: 'ExpressionStatement',
      expression
    } as any;
  });

  // Return statement
  private returnStatement = this.RULE('returnStatement', () => {
    this.CONSUME(tokens.Return);
    const expression = this.OPTION(() => this.SUBRULE(this.expression));
    this.CONSUME(tokens.Semicolon);
    
    return {
      type: 'ReturnStatement',
      expression
    } as any;
  });

  // If statement
  private ifStatement = this.RULE('ifStatement', () => {
    this.CONSUME(tokens.If);
    this.CONSUME(tokens.LeftParen);
    const condition = this.SUBRULE(this.expression);
    this.CONSUME(tokens.RightParen);
    
    const thenStatement = this.SUBRULE1(this.statement);
    const elseStatement = this.OPTION(() => {
      this.CONSUME(tokens.Else);
      return this.SUBRULE2(this.statement);
    });
    
    return {
      type: 'IfStatement',
      condition,
      thenStatement,
      elseStatement
    } as any;
  });

  // For statement
  private forStatement = this.RULE('forStatement', () => {
    this.CONSUME(tokens.For);
    this.CONSUME(tokens.LeftParen);
    const init = this.OR([
      { ALT: () => this.SUBRULE(this.inlineVariableDeclaration) },
      { ALT: () => this.SUBRULE(this.expression) },
      { ALT: () => undefined }
    ]);
    this.CONSUME1(tokens.Semicolon);
    const condition = this.OPTION(() => this.SUBRULE1(this.expression));
    this.CONSUME2(tokens.Semicolon);
    const update = this.OPTION2(() => this.SUBRULE2(this.expression));
    this.CONSUME(tokens.RightParen);
    const body = this.SUBRULE3(this.statement);
    return {
      type: 'ForStatement',
      init,
      condition,
      update,
      body
    } as any;
  });

  // Macro definition
  private macroDefinition = this.RULE('macroDefinition', () => {
    this.CONSUME(tokens.Macro);
    const name = this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LeftParen);
    const parameters = this.OPTION(() => this.SUBRULE(this.parameterList));
    this.CONSUME(tokens.RightParen);
    this.CONSUME(tokens.LeftBrace);
    const body: any[] = [];
    this.MANY(() => {
      const statement = this.SUBRULE(this.statement);
      body.push(statement);
    });
    this.CONSUME(tokens.RightBrace);
    this.CONSUME(tokens.End);
    
    return {
      type: 'MacroDefinition',
      name: { type: 'Identifier', name: name.image },
      parameters: parameters || [],
      body
    } as any;
  });

  // Expression rules with operator precedence
  private expression = this.RULE('expression', () => {
    return this.SUBRULE(this.assignmentExpression);
  });

  private assignmentExpression = this.RULE('assignmentExpression', () => {
    const left = this.SUBRULE(this.logicalOrExpression);
    
    const assignment = this.OPTION(() => {
      this.CONSUME(tokens.Assign);
      const right = this.SUBRULE1(this.assignmentExpression);
      return {
        type: 'AssignmentExpression',
        left,
        right
      };
    });
    
    return assignment || left;
  });

  private logicalOrExpression = this.RULE('logicalOrExpression', () => {
    let left = this.SUBRULE(this.logicalAndExpression);
    
    this.MANY(() => {
      this.CONSUME(tokens.Or);
      const right = this.SUBRULE1(this.logicalAndExpression);
      left = {
        type: 'BinaryExpression',
        operator: '||',
        left,
        right
      } as any;
    });
    
    return left;
  });

  private logicalAndExpression = this.RULE('logicalAndExpression', () => {
    let left = this.SUBRULE(this.equalityExpression);
    
    this.MANY(() => {
      this.CONSUME(tokens.And);
      const right = this.SUBRULE1(this.equalityExpression);
      left = {
        type: 'BinaryExpression',
        operator: '&&',
        left,
        right
      } as any;
    });
    
    return left;
  });

  private equalityExpression = this.RULE('equalityExpression', () => {
    let left = this.SUBRULE(this.relationalExpression);
    
    this.MANY(() => {
      const operator = this.OR([
        { ALT: () => this.CONSUME(tokens.Equals) },
        { ALT: () => this.CONSUME(tokens.NotEquals) }
      ]);
      const right = this.SUBRULE1(this.relationalExpression);
      left = {
        type: 'BinaryExpression',
        operator: operator.image,
        left,
        right
      } as any;
    });
    
    return left;
  });

  private relationalExpression = this.RULE('relationalExpression', () => {
    let left = this.SUBRULE(this.additiveExpression);
    
    this.MANY(() => {
      const operator = this.OR([
        { ALT: () => this.CONSUME(tokens.LessThan) },
        { ALT: () => this.CONSUME(tokens.LessThanEquals) },
        { ALT: () => this.CONSUME(tokens.GreaterThan) },
        { ALT: () => this.CONSUME(tokens.GreaterThanEquals) }
      ]);
      const right = this.SUBRULE1(this.additiveExpression);
      left = {
        type: 'BinaryExpression',
        operator: operator.image,
        left,
        right
      } as any;
    });
    
    return left;
  });

  private additiveExpression = this.RULE('additiveExpression', () => {
    let left = this.SUBRULE(this.multiplicativeExpression);
    
    this.MANY(() => {
      const operator = this.OR([
        { ALT: () => this.CONSUME(tokens.Plus) },
        { ALT: () => this.CONSUME(tokens.Minus) }
      ]);
      const right = this.SUBRULE1(this.multiplicativeExpression);
      left = {
        type: 'BinaryExpression',
        operator: operator.image,
        left,
        right
      } as any;
    });
    
    return left;
  });

  private multiplicativeExpression = this.RULE('multiplicativeExpression', () => {
    let left = this.SUBRULE(this.unaryExpression);
    
    this.MANY(() => {
      const operator = this.OR([
        { ALT: () => this.CONSUME(tokens.Multiply) },
        { ALT: () => this.CONSUME(tokens.Divide) },
        { ALT: () => this.CONSUME(tokens.Modulo) }
      ]);
      const right = this.SUBRULE1(this.unaryExpression);
      left = {
        type: 'BinaryExpression',
        operator: operator.image,
        left,
        right
      } as any;
    });
    
    return left;
  });

  private unaryExpression = this.RULE('unaryExpression', () => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.postfixExpression) },
      { ALT: () => this.SUBRULE(this.prefixExpression) }
    ]);
  });

  private prefixExpression = this.RULE('prefixExpression', () => {
    const operator = this.OR([
      { ALT: () => this.CONSUME(tokens.Plus) },
      { ALT: () => this.CONSUME(tokens.Minus) }
    ]);
    const operand = this.SUBRULE(this.unaryExpression);
    
    return {
      type: 'UnaryExpression',
      operator: operator.image,
      operand
    } as any;
  });

  private postfixExpression = this.RULE('postfixExpression', () => {
    let base = this.SUBRULE(this.primaryExpression);

    this.MANY(() => {
      base = this.OR([
        { ALT: () => this.callExpression(base) },
        { ALT: () => this.memberExpression(base) }
      ]);
    });

    return base;
  });

  private primaryExpression = this.RULE('primaryExpression', () => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.macroCallExpression) },
      { ALT: () => this.SUBRULE(this.literal) },
      { ALT: () => this.SUBRULE(this.identifier) },
      { ALT: () => this.SUBRULE(this.parenthesizedExpression) },
      { ALT: () => this.SUBRULE(this.arrayLiteral) }
    ]);
  });

  private macroCallExpression = this.RULE('macroCallExpression', () => {
    this.CONSUME(tokens.AtSymbol);
    const macroName = this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LeftParen);
    const args = this.OPTION(() => this.SUBRULE(this.argumentList));
    this.CONSUME(tokens.RightParen);
    return {
      type: 'MacroCall',
      name: { type: 'Identifier', name: macroName.image },
      arguments: args || []
    };
  });

  private literal = this.RULE('literal', () => {
    return this.OR([
      { ALT: () => this.CONSUME(tokens.NumberLiteral) },
      { ALT: () => this.CONSUME(tokens.StringLiteral) },
      { ALT: () => this.CONSUME(tokens.BooleanLiteral) }
    ]);
  });

  private identifier = this.RULE('identifier', () => {
    const name = this.CONSUME(tokens.Identifier);
    return {
      type: 'Identifier',
      name: name.image
    };
  });

  private parenthesizedExpression = this.RULE('parenthesizedExpression', () => {
    this.CONSUME(tokens.LeftParen);
    const expression = this.SUBRULE(this.expression);
    this.CONSUME(tokens.RightParen);
    return expression;
  });

  private arrayLiteral = this.RULE('arrayLiteral', () => {
    this.CONSUME(tokens.LeftBracket);
    const elements = this.OPTION(() => this.SUBRULE(this.argumentList));
    this.CONSUME(tokens.RightBracket);
    
    return {
      type: 'ArrayLiteral',
      elements: elements || []
    };
  });

  private callExpression = (base: any) => {
    this.CONSUME(tokens.LeftParen);
    const arguments_ = this.OPTION(() => this.SUBRULE(this.argumentList));
    this.CONSUME(tokens.RightParen);

    return {
      type: 'CallExpression',
      callee: base,
      arguments: arguments_ || []
    } as any;
  };

  private memberExpression = (base: any) => {
    this.CONSUME(tokens.Dot);
    const property = this.CONSUME(tokens.Identifier);

    return {
      type: 'MemberExpression',
      object: base,
      property: { type: 'Identifier', name: property.image }
    } as any;
  };

  private argumentList = this.RULE('argumentList', () => {
    const firstArg = this.SUBRULE1(this.expression);
    const arguments_ = [firstArg];
    
    this.MANY(() => {
      this.CONSUME(tokens.Comma);
      const nextArg = this.SUBRULE2(this.expression);
      arguments_.push(nextArg);
    });
    
    return arguments_;
  });
} 