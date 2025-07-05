# Enhanced Lingual Language System

This document describes the enhanced features of the Lingual language system, including high-level language constructs, improved build pipeline, and better developer experience.

## 🚀 New Language Features

### 1. High-Level API Definitions

```lingual
api GetUser {
  method: GET
  path: "/users/{id}"
  params: {
    id: string
  }
  returns: User
  description: "Retrieve a user by ID"
}
```

**Transpiles to C# HttpClient methods:**
```csharp
public async Task<User> GetUserAsync(string id)
{
    var url = "/users/{id}";
    url = url.Replace("{id}", id.ToString());
    var request = new HttpRequestMessage(HttpMethod.Get, url);
    var response = await _httpClient.SendAsync(request);
    response.EnsureSuccessStatusCode();
    var content = await response.Content.ReadAsStringAsync();
    return JsonConvert.DeserializeObject<User>(content);
}
```

### 2. Type Definitions

```lingual
type User {
  id: string
  name: string
  email: string
  age: number
  isActive: boolean
}
```

**Transpiles to C# classes:**
```csharp
public class User
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public double Age { get; set; }
    public bool IsActive { get; set; }
}
```

### 3. Module System

```lingual
module userService {
  fn validateEmail(email: string): boolean {
    return email.contains("@") && email.contains(".")
  }
  
  fn formatUserName(name: string): string {
    return @upper(name)
  }
}
```

**Transpiles to C# static classes:**
```csharp
public static class UserServiceModule
{
    public static bool ValidateEmail(string email)
    {
        return email.Contains("@") && email.Contains(".");
    }
    
    public static string FormatUserName(string name)
    {
        return name.ToUpper();
    }
}
```

### 4. Enhanced Function Syntax

```lingual
fn greet(name: string): string {
  return "Hello, " + name
}
```

**Supports both `function` and `fn` keywords for cleaner syntax.**

### 5. Inline Macro System

```lingual
fn formatUserName(name: string): string {
  return @upper(name)  // Built-in macro
}

fn createApiName(resource: string): string {
  return @pascalCase(resource) + "Api"  // Custom macro
}
```

**Built-in macros:**
- `@upper(text)` - Convert to uppercase
- `@lower(text)` - Convert to lowercase
- `@camelCase(text)` - Convert to camelCase
- `@pascalCase(text)` - Convert to PascalCase
- `@snakeCase(text)` - Convert to snake_case
- `@kebabCase(text)` - Convert to kebab-case

## 🔧 Enhanced Build System

### 1. Improved CLI Commands

```bash
# Build a single file with enhanced logging
lingual build sdk.lingual -v

# Build with specific target and output
lingual build sdk.lingual -t csharp -o ./generated

# Watch mode for development
lingual build sdk.lingual --watch

# Debug mode with AST output
lingual build sdk.lingual --json
```

### 2. Step-by-Step Build Pipeline

The enhanced build system provides clear logging for each step:

1. **Reading source file** - Loads and validates input
2. **Tokenizing** - Converts source to tokens
3. **Parsing AST** - Builds abstract syntax tree
4. **Processing macros** - Expands inline and block macros
5. **Transpiling** - Converts to target language
6. **Writing output** - Generates files with proper structure

### 3. Configuration System

```json
// lingual.config.json
{
  "target": "csharp",
  "outputDir": "./dist",
  "verbose": true,
  "debug": false,
  "macros": {
    "customMacro": "text => text.toUpperCase()"
  },
  "plugins": [],
  "watch": false,
  "json": false
}
```

## 📁 Project Structure

```
src/
├── language/features/     # High-level language constructs
│   ├── api.ts           # API definitions
│   ├── type.ts          # Type definitions
│   ├── module.ts        # Module system
│   └── index.ts         # Feature exports
├── parser/
│   ├── enhanced-grammar.ts  # Enhanced parser
│   └── grammar.ts           # Original parser
├── transpilers/
│   ├── enhanced-csharp.ts   # Enhanced C# transpiler
│   └── csharp.ts            # Original transpiler
├── macros/
│   ├── runtime.ts           # Inline macro system
│   └── interpreter.ts       # Block macro system
├── compiler/
│   └── build.ts             # Build pipeline
├── cli/commands/
│   └── build.ts             # Enhanced build command
├── config.ts                # Configuration system
└── utils/                   # Utilities
```

## 🎯 Language Design Philosophy

### High-Level and Declarative

The enhanced language focuses on **declarative descriptions** rather than implementation details:

```lingual
// Declare what you want, not how to do it
api CreateUser {
  method: POST
  path: "/users"
  params: {
    name: string
    email: string
  }
  returns: User
}
```

### Developer-Friendly

- **Simple syntax** - Easy to read and write
- **Type safety** - Compile-time type checking
- **Macro system** - Reduce boilerplate code
- **Clear structure** - Organized by features

### Extensible Architecture

- **Modular design** - Easy to add new features
- **Plugin system** - Support for custom extensions
- **Multiple targets** - C# first, others to follow
- **Configuration-driven** - Flexible build options

## 🔄 Build Process Example

### Input: `sdk.lingual`
```lingual
type User {
  id: string
  name: string
  email: string
}

api GetUser {
  method: GET
  path: "/users/{id}"
  params: {
    id: string
  }
  returns: User
}

fn main(): void {
  let client: ApiClient = new ApiClient()
  let user: User = client.GetUserAsync("123")
  console.log("User: " + user.name)
}
```

### Output: `sdk.cs`
```csharp
using System;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace LingualGenerated
{
    public class User
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
    }

    public class ApiClient
    {
        private readonly HttpClient _httpClient;

        public ApiClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<User> GetUserAsync(string id)
        {
            var url = "/users/{id}";
            url = url.Replace("{id}", id.ToString());
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<User>(content);
        }
    }

    public class Program
    {
        public static void Main()
        {
            ApiClient client = new ApiClient(null);
            User user = client.GetUserAsync("123").Result;
            Console.WriteLine("User: " + user.Name);
        }
    }
}
```

## 🚀 Future Enhancements

1. **Additional Language Targets**
   - JavaScript/TypeScript transpiler
   - Python transpiler
   - Go transpiler

2. **Advanced Type System**
   - Generic types
   - Union types
   - Interface inheritance

3. **IDE Support**
   - Language server protocol
   - Syntax highlighting
   - IntelliSense

4. **Testing Framework**
   - Unit test generation
   - Integration test templates
   - Mock generation

5. **Documentation Generation**
   - API documentation
   - Type documentation
   - Usage examples

## 📚 Usage Examples

### Simple API Client
```lingual
api GetUsers {
  method: GET
  path: "/users"
  returns: User[]
}

api CreateUser {
  method: POST
  path: "/users"
  params: {
    name: string
    email: string
  }
  returns: User
}
```

### Complex Type System
```lingual
type ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

type PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}
```

### Module Organization
```lingual
module auth {
  api Login {
    method: POST
    path: "/auth/login"
    params: {
      username: string
      password: string
    }
    returns: AuthToken
  }
}

module users {
  api GetUser {
    method: GET
    path: "/users/{id}"
    params: {
      id: string
    }
    returns: User
  }
}
```

This enhanced system provides a powerful, developer-friendly way to describe APIs and generate production-ready code with minimal boilerplate. 