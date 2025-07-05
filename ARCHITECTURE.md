# Lingual Architecture

This document describes the architecture and design decisions for the Lingual language transpiler.

## Overview

Lingual is a custom programming language that transpiles to other languages, currently supporting C# as the primary target. The project is built with TypeScript and uses Chevrotain for parsing.

## Architecture Components

### 1. Lexer (`src/lexer/tokens.ts`)

The lexer is responsible for converting source code into tokens. It uses Chevrotain's token system to define:

- **Keywords**: `function`, `return`, `if`, `else`, `let`, `var`, `macro`, `end`
- **Types**: `string`, `number`, `boolean`, `void`
- **Operators**: Arithmetic (`+`, `-`, `*`, `/`), comparison (`==`, `!=`, `<`, `>`, `<=`, `>=`), logical (`&&`, `||`)
- **Punctuation**: Parentheses, braces, brackets, semicolons, commas, colons, dots
- **Literals**: String literals, number literals, boolean literals
- **Identifiers**: Variable and function names

### 2. Parser (`src/parser/grammar.ts`)

The parser uses Chevrotain's CstParser to build an Abstract Syntax Tree (AST). It supports:

- **Function declarations** with parameters and return types
- **Variable declarations** with optional type annotations and initializers
- **Control flow** statements (if/else)
- **Expressions** with operator precedence
- **Macro definitions** and calls
- **Type annotations** with support for generics

### 3. Type System (`src/types/index.ts`)

Defines TypeScript interfaces for all AST nodes:

- `Program`: Root node containing all statements
- `FunctionDeclaration`: Function definitions
- `VariableDeclaration`: Variable declarations
- `Expression`: Various expression types (binary, call, member, etc.)
- `Statement`: All statement types
- `MacroDefinition` and `MacroCall`: Macro system support

### 4. Transpiler (`src/transpilers/csharp.ts`)

The C# transpiler converts the AST to C# code:

- Generates proper C# syntax with correct indentation
- Maps types appropriately (e.g., `number` → `double`)
- Handles function signatures and parameter types
- Supports control flow translation
- Generates namespace and class structure

### 5. Macro System (`src/macros/interpreter.ts`)

The macro system provides compile-time code generation:

- **Macro definitions**: Define reusable code patterns
- **Parameter substitution**: Replace macro parameters with actual values
- **Expansion**: Replace macro calls with generated code
- **Environment**: Maintains parameter mappings during expansion

### 6. Utilities

#### Logger (`src/utils/logger.ts`)
- Colored terminal output using chalk
- Multiple log levels (DEBUG, INFO, WARN, ERROR, SUCCESS)
- Configurable prefix and timestamp options

#### File Helpers (`src/utils/file-helpers.ts`)
- File reading and writing operations
- Directory creation and management
- File pattern matching with glob
- Path manipulation utilities

### 7. CLI (`src/cli.ts`)

The command-line interface using Commander.js:

- **Global options**: Verbose logging, debug mode, output directory
- **Build command**: Process multiple files or directories
- **Transpile command**: Process single files
- **Help system**: Comprehensive help and usage information

## Language Features

### Supported Constructs

1. **Function Declarations**
   ```lingual
   function add(a: number, b: number): number {
       return a + b;
   }
   ```

2. **Variable Declarations**
   ```lingual
   let x: number = 42;
   let message: string = "Hello";
   ```

3. **Control Flow**
   ```lingual
   if (condition) {
       // then block
   } else {
       // else block
   }
   ```

4. **Expressions**
   - Binary expressions with operator precedence
   - Function calls
   - Member access
   - Literals (strings, numbers, booleans)

5. **Macros**
   ```lingual
   macro createGetter(fieldName, fieldType) {
       function get{fieldName}(): {fieldType} {
           return this.{fieldName};
       }
   }
   ```

### Type System

- **Basic types**: `string`, `number`, `boolean`, `void`
- **Type annotations**: Optional type annotations for variables and parameters
- **Return types**: Function return type specifications
- **Generic support**: Basic generic type parameter support

## Compilation Pipeline

1. **Source Input**: Read `.lingual` files
2. **Lexical Analysis**: Tokenize source code
3. **Parsing**: Build AST from tokens
4. **Macro Expansion**: Process and expand macros
5. **Transpilation**: Convert AST to target language (C#)
6. **Output**: Write generated code to files

## Error Handling

The system provides comprehensive error handling:

- **Lexer errors**: Invalid tokens or syntax
- **Parser errors**: Invalid grammar constructs
- **Macro errors**: Undefined macros or argument mismatches
- **Transpiler errors**: Unsupported language features
- **File errors**: Missing files or permission issues

## Extensibility

The architecture is designed for easy extension:

- **New transpilers**: Add new language targets by implementing transpiler interfaces
- **Additional tokens**: Extend the lexer with new token types
- **Grammar extensions**: Add new parser rules for language features
- **Macro system**: Extend macro capabilities with new expansion rules

## Performance Considerations

- **Incremental parsing**: Chevrotain provides efficient parsing
- **Token caching**: Lexer caches token definitions
- **AST optimization**: Future optimizations can be added to the AST
- **Memory management**: Proper cleanup of large ASTs

## Testing Strategy

- **Unit tests**: Individual component testing
- **Integration tests**: End-to-end compilation testing
- **Language tests**: Test various language constructs
- **Error tests**: Verify proper error handling

## Future Enhancements

1. **Additional targets**: JavaScript, TypeScript, Python, Go
2. **Advanced types**: Interfaces, enums, unions
3. **Modules**: Import/export system
4. **Standard library**: Built-in functions and utilities
5. **IDE support**: Language server protocol
6. **Debugging**: Source maps and debugging tools 