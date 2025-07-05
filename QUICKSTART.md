# Quick Start Guide

Get up and running with Lingual in minutes!

## Prerequisites

- Node.js 18 or higher
- npm or yarn

## Installation

```bash
# Install globally
npm install -g lingual-lang

# Or install locally for development
git clone <repository>
cd lingual
npm install
npm run build
```

## Your First Program

Create a file called `hello.lingual`:

```lingual
function greet(name: string): string {
    return "Hello, " + name + "!";
}

function main(): void {
    let message: string = greet("World");
    console.log(message);
}
```

## Compile to C#

```bash
# Transpile a single file
lingual transpile hello.lingual

# Or build with specific output
lingual transpile hello.lingual -o hello.cs
```

This will generate `hello.cs`:

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

namespace LingualGenerated
{
    public class Program
    {
        public static string greet(string name)
        {
            return ("Hello, " + name + "!");
        }

        public static void main()
        {
            string message = greet("World");
            console.log(message);
        }
    }
}
```

## Using Macros

Create `macro-example.lingual`:

```lingual
macro createProperty(fieldName, fieldType) {
    let _{fieldName}: {fieldType};
    
    function get{fieldName}(): {fieldType} {
        return this._{fieldName};
    }
    
    function set{fieldName}(value: {fieldType}): void {
        this._{fieldName} = value;
    }
}

// Generate properties
createProperty(name, string);
createProperty(age, number);
```

## CLI Commands

```bash
# Show help
lingual help

# Build a directory of files
lingual build src/

# Transpile with verbose output
lingual transpile file.lingual -v

# Specify target language (currently only csharp)
lingual transpile file.lingual -t csharp

# Set output directory
lingual build src/ -o ./generated
```

## Language Features

### Functions
```lingual
function add(a: number, b: number): number {
    return a + b;
}
```

### Variables
```lingual
let x: number = 42;
let message: string = "Hello";
let isActive: boolean = true;
```

### Control Flow
```lingual
if (x > 0) {
    console.log("Positive");
} else {
    console.log("Negative or zero");
}
```

### Types
- `string` - Text values
- `number` - Numeric values (transpiles to `double` in C#)
- `boolean` - True/false values
- `void` - No return value

## Examples

Check out the `examples/` directory for more complex examples:

- `fibonacci.lingual` - Recursive function example
- `calculator.lingual` - Macro system demonstration
- `macro-example.lingual` - Property generation with macros

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode (watch for changes)
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Next Steps

1. **Explore Examples**: Look at the examples in the `examples/` directory
2. **Read Documentation**: Check out the full README.md and ARCHITECTURE.md
3. **Try Macros**: Experiment with the macro system for code generation
4. **Extend the Language**: Add new features or transpiler targets

## Getting Help

- Check the `README.md` for detailed documentation
- Look at `ARCHITECTURE.md` for technical details
- Review the examples in the `examples/` directory
- Check the test files for usage examples

## Common Issues

### "Command not found"
Make sure you installed the package globally:
```bash
npm install -g lingual-lang
```

### "Parse error"
Check your syntax - the language is strict about semicolons and braces.

### "Macro not found"
Make sure macro definitions come before their usage in the file.

### "Type error"
Ensure you're using the correct types: `string`, `number`, `boolean`, `void`. 