<div align="center">
  <img src=".github/banner.svg" alt="Lingual" width="1000px">
  <br>
  <p><strong>A powerful CLI tool for transpiling to multiple programming languages</strong></p>
</div>

<div align="center">

[![npm version](https://img.shields.io/npm/v/lingual-lang.svg)](https://www.npmjs.com/package/lingual-lang)
[![npm downloads](https://img.shields.io/npm/dm/lingual-lang.svg)](https://www.npmjs.com/package/lingual-lang)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/vantio-games/lingual)
[![Code Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](https://github.com/vantio-games/lingual)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/vantio-games/lingual/pulls)
[![Contributors](https://img.shields.io/github/contributors/vantio-games/lingual.svg)](https://github.com/vantio-games/lingual/graphs/contributors)
[![Stars](https://img.shields.io/github/stars/vantio-games/lingual.svg)](https://github.com/vantio-games/lingual/stargazers)
[![Forks](https://img.shields.io/github/forks/vantio-games/lingual.svg)](https://github.com/vantio-games/lingual/network/members)
[![Issues](https://img.shields.io/github/issues/vantio-games/lingual.svg)](https://github.com/vantio-games/lingual/issues)

</div>

---

## 🚀 Quick Start

```bash
npm install -g lingual-lang
```

**Try it now:**
```bash
# Create a simple example
echo 'function hello(): void { console.log("Hello, World!"); }' > hello.lingual
lingual build hello.lingual -t javascript
```

---

## ✨ Features

- 🔧 **Custom Language Parser** - Built with Chevrotain for robust parsing
- 🎯 **Multi-Language Support** - Generate C#, JavaScript, and TypeScript code
- 🧩 **Macro System** - Build-time macro expansion for powerful code generation
- 📝 **Type System** - Full type annotations and type checking
- ⚡ **CLI Interface** - Easy-to-use command line interface
- 🎨 **Beautiful Output** - Colored terminal output with different log levels
- 🔄 **Hot Reload** - Watch mode for development
- 📦 **Package Manager** - Install globally or use locally

## 🎯 Why Lingual?

**Lingual** is designed for developers who want to create their own programming languages without the complexity of building a full compiler. With its intuitive syntax and powerful transpilation capabilities, you can:

- **Prototype quickly** - Write your language syntax and see results immediately
- **Target multiple platforms** - Generate code for C#, JavaScript, and TypeScript
- **Extend easily** - Add new language features with the macro system
- **Integrate seamlessly** - Use as a CLI tool or library in your projects

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g lingual-lang
```

### Local Development

```bash
git clone https://github.com/vantio-games/lingual.git
cd lingual
npm install
npm run build
```

## 🚀 Usage

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
lingual build src/ -t javascript
lingual build src/ -t typescript
```

### Language Syntax

The custom language supports modern programming constructs:

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

#### Macros (Advanced Feature)

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

## 🏗️ Project Structure

```
src/
├── lexer/           # Token definitions
├── parser/          # Grammar and parsing
├── types/           # TypeScript type definitions
├── transpilers/     # Code generators
│   ├── csharp.ts   # C# transpiler
│   ├── javascript.ts # JavaScript transpiler
│   └── typescript.ts # TypeScript transpiler
├── macros/          # Macro system
├── utils/           # Utilities (logging, file helpers)
└── cli.ts          # CLI entry point
```

## 💡 Examples

### Fibonacci Example

**Input** (`fibonacci.lingual`):
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

**Generated C# Output:**
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

**Generated JavaScript Output:**
```javascript
// Generated JavaScript code from Lingual

function fibonacci(n) {
    if ((n <= 1)) {
        return n;
    } else {
        return fibonacci((n - 1)) + fibonacci((n - 2));
    }
}

function main() {
    let result = fibonacci(10);
    console.log("Fibonacci(10) = " + result);
}

// Main execution
(async () => {
    let result = fibonacci(10);
    console.log("Fibonacci(10) = " + result);
})();
```

## 🛠️ Development

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

## 🤝 Contributing

We love contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📋 Roadmap

- [x] JavaScript/TypeScript transpiler
- [x] C# transpiler
- [x] Macro system
- [x] CLI interface
- [ ] Python transpiler
- [ ] Go transpiler
- [ ] Rust transpiler
- [ ] Advanced type system
- [ ] Module system
- [ ] Standard library
- [ ] IDE support
- [ ] Debugging tools
- [ ] WebAssembly support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Chevrotain](https://chevrotain.io/) - For the excellent parsing library
- [Commander.js](https://github.com/tj/commander.js) - For the CLI framework
- [Chalk](https://github.com/chalk/chalk) - For beautiful terminal output

## 📞 Support

- 📧 **Email**: [wpm45@georgetown.edu](mailto:wpm45@georgetown.edu)
- 🐛 **Issues**: [GitHub Issues](https://github.com/vantio-games/lingual/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/vantio-games/lingual/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/vantio-games/lingual/wiki)

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=vantio-games/lingual&type=Date)](https://star-history.com/#vantio-games/lingual&Date)

---

<div align="center">
  <p>Made with ❤️ by <a href="https://vantio.app/">Vantio</a></p>
  <p>If this project helps you, please give it a ⭐️</p>
</div> 