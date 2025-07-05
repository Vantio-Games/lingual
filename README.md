# Lingual

A CLI tool for transpiling a custom language to other programming languages, built with TypeScript and Chevrotain.

## Features

- **Custom Language Parser**: Built with Chevrotain for robust parsing
- **Function Declarations**: Support for typed function definitions
- **Type System**: Basic type annotations and type checking
- **Macro System**: Build-time macro expansion for code generation
- **C# Transpiler**: Generate C# code from custom language syntax
- **CLI Interface**: Easy-to-use command line interface
- **Logging**: Colored terminal output with different log levels

## Installation

### Global Installation

```bash
npm install -g lingual-lang
```

### Local Development

```bash
git clone <repository>
cd lingual
npm install
npm run build
```

## Usage

### Basic Commands

```bash
# Show help
lingual help

# Build a source file or directory
lingual build src/main.lingual

# Transpile a single file
lingual transpile src/main.lingual -o output.cs

# Build with verbose logging
lingual build src/ -v

# Build to a specific target language
lingual build src/ -t csharp
```

### Language Syntax

The custom language supports the following constructs:

#### Function Declarations

```lingual
function add(a: number, b: number): number {
    return a + b;
}

function greet(name: string): void {
    console.log("Hello, " + name);
}
```

#### Variable Declarations

```lingual
let x: number = 42;
let message: string = "Hello, World!";
let isActive: boolean = true;
```

#### Control Flow

```lingual
function checkNumber(n: number): string {
    if (n > 0) {
        return "positive";
    } else {
        return "negative or zero";
    }
}
```

#### Macros

```lingual
macro createGetter(fieldName, fieldType) {
    function get{fieldName}(): {fieldType} {
        return this.{fieldName};
    }
}

// Use the macro
createGetter(name, string);
createGetter(age, number);
```

### File Extensions

- Source files: `.lingual`
- Generated C# files: `.cs`

## Project Structure

```
src/
├── lexer/           # Token definitions
├── parser/          # Grammar and parsing
├── types/           # TypeScript type definitions
├── transpilers/     # Code generators
│   └── csharp.ts   # C# transpiler
├── macros/          # Macro system
├── utils/           # Utilities (logging, file helpers)
└── cli.ts          # CLI entry point
```

## Development

### Prerequisites

- Node.js 18+
- TypeScript 5.3+

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Example

### Input File (`example.lingual`)

```lingual
function fibonacci(n: number): number {
    if (n <= 1) {
        return n;
    } else {
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}

function main(): void {
    let result: number = fibonacci(10);
    console.log("Fibonacci(10) = " + result);
}
```

### Generated C# Output

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

namespace LingualGenerated
{
    public class Program
    {
        public static double fibonacci(double n)
        {
            if ((n <= 1))
            {
                return n;
            }
            else
            {
                return (fibonacci((n - 1)) + fibonacci((n - 2)));
            }
        }

        public static void main()
        {
            double result = fibonacci(10);
            console.log(("Fibonacci(10) = " + result));
        }
    }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Roadmap

- [ ] JavaScript/TypeScript transpiler
- [ ] More language targets (Python, Go, Rust)
- [ ] Advanced type system
- [ ] Module system
- [ ] Standard library
- [ ] IDE support
- [ ] Debugging tools 