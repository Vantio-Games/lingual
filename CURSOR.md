# Lingual Transpiler Architecture

## Overview
Lingual is a modular transpiler that converts custom language syntax to multiple target programming languages through a structured pipeline: **Source → Tokens → CST → AST → Middleware → Target Code**.

## Core Architecture

### CLI System (`src/cli/`)
**Purpose**: Command-line interface orchestration
- **`cli.ts`**: Main entry point, registers all commands
- **`commands/build.ts`**: Multi-file transpilation with output management
- **`commands/transpile.ts`**: Single-file transpilation
- **`commands/list-languages.ts`**: Displays available target languages
- **`commands/prettify.ts`**: Code formatting with whitespace normalization

### Language System (`src/languages/`)
**Purpose**: Target language abstraction and transpilation
- **`language-manager.ts`**: Central registry for all target languages
- **`types.ts`**: Language interface definitions (name, description, emoji, version, middleware dependencies)
- **`csharp.ts`**: C# transpilation implementation
- **`javascript.ts`**: JavaScript transpilation implementation  
- **`typescript.ts`**: TypeScript transpilation implementation

### Tokenization (`src/tokenizer/`)
**Purpose**: Lexical analysis and token generation
- **`tokenizer.ts`**: Converts source code into structured tokens
- **`types.ts`**: Token type enumerations and interfaces

### Parsing (`src/parser/`)
**Purpose**: Syntactic analysis and Concrete Syntax Tree generation
- **`parser.ts`**: Recursive descent parser that constructs CST from tokens

### AST Conversion (`src/ast/`)
**Purpose**: Abstract Syntax Tree transformation
- **`ast-converter.ts`**: Converts CST nodes to simplified AST representation

### Middleware System (`src/middleware/`)
**Purpose**: AST transformation pipeline
- **`middleware-manager.ts`**: Orchestrates middleware execution order
- **`variable-renamer.ts`**: Prevents naming conflicts through variable renaming
- **`type-checker.ts`**: Validates type consistency and operation legality
- **`hoister.ts`**: Moves declarations to scope beginning

### Standard Library (`src/standard-library/`)
**Purpose**: Cross-language function abstraction
- **`standard-library.ts`**: Common functions (console.log, http.get, Math operations) with language-specific transpilation hints

### Type System (`src/types/`)
**Purpose**: Core type definitions
- **`index.ts`**: AST node interfaces, compiler context, error handling types

### Utilities (`src/utils/`)
**Purpose**: Cross-cutting concerns
- **`logger.ts`**: Structured logging with multiple verbosity levels
- **`file-helpers.ts`**: File system operations and path resolution

### Configuration (`src/config.ts`)
**Purpose**: Application configuration management
- **`config.ts`**: Configuration loading, validation, and merging with CLI options

## Data Flow

1. **Source Code** → `Tokenizer` → **Token Stream**
2. **Token Stream** → `Parser` → **Concrete Syntax Tree**
3. **CST** → `ASTConverter` → **Abstract Syntax Tree**
4. **AST** → `MiddlewareManager` → **Transformed AST**
5. **Transformed AST** → `Language.transpile()` → **Target Code**

## Module Dependencies

```
CLI Commands
├── LanguageManager
│   ├── Tokenizer
│   ├── Parser  
│   ├── ASTConverter
│   ├── MiddlewareManager
│   └── StandardLibraryManager
└── ConfigManager
```

## Language Interface

Each target language implements:
- **Metadata**: name, displayName, description, emoji, version
- **Middleware Dependencies**: Ordered array of required transformations
- **Transpile Function**: AST-to-target-code conversion

## Middleware Interface

Each middleware implements:
- **Name**: Unique identifier
- **Description**: Purpose documentation
- **Process Function**: AST transformation logic

## Standard Library Interface

Each function provides:
- **Signature**: Function signature documentation
- **Supported Languages**: Array of compatible targets
- **Validation**: Call validation logic
- **Transpilation Hints**: Language-specific implementation guidance

## Error Handling

- **CompilationError**: Syntax and semantic errors
- **CompilationWarning**: Non-fatal issues
- **Context Propagation**: Error location and context preservation

## Configuration System

- **File Loading**: JSON, JS, TS configuration files
- **Validation**: Type and value validation
- **Merging**: CLI options override file configuration
- **Defaults**: Sensible default values

## Extension Points

- **New Languages**: Implement Language interface
- **New Middleware**: Implement Middleware interface  
- **New Standard Library Functions**: Register with StandardLibraryManager
- **New CLI Commands**: Add to commands directory 