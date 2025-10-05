# UP Parser for JavaScript/TypeScript

[![npm version](https://badge.fury.io/js/%40uplang%2Fup.svg)](https://www.npmjs.com/package/@uplang/up)
[![npm downloads](https://img.shields.io/npm/dm/@uplang/up.svg)](https://www.npmjs.com/package/@uplang/up)
[![CI](https://github.com/uplang/js/workflows/CI/badge.svg)](https://github.com/uplang/js/actions)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Official JavaScript/TypeScript implementation of the UP (Unified Properties) language parser.

📚 **[API Documentation](https://uplang.github.io/js/)** | 🧪 **[Test Status](https://github.com/uplang/js/actions)** | 📖 **[Specification](https://github.com/uplang/spec)**

> **Universal Support** - Works in browsers, Node.js, Deno, and Bun

## Features

- ✅ **Full UP Syntax Support** - Scalars, blocks, lists, tables, multiline strings
- ✅ **Type Annotations** - Parse and preserve type hints (`!int`, `!bool`, etc.)
- ✅ **TypeScript** - Full type definitions included
- ✅ **Universal** - Browser, Node.js, Deno, Bun support
- ✅ **ESM + CommonJS** - Both module formats supported
- ✅ **Well-Tested** - Comprehensive test suite
- ✅ **Zero Dependencies** - No external runtime dependencies
- ✅ **Lightweight** - Small bundle size

## Requirements

- Node.js 16+ (for Node.js usage)
- Modern browser with ES6+ support (for browser usage)

## Installation

```bash
# npm
npm install @uplang/up

# yarn
yarn add @uplang/up

# pnpm
pnpm add @uplang/up
```

## Quick Start

### JavaScript (ESM)

```javascript
import { Parser } from '@uplang/up';

const parser = new Parser();
const doc = parser.parse(`
    name Alice
    age!int 30
    config {
      debug!bool true
    }
`);

// Access values
console.log(doc.get('name'));  // 'Alice'

// Iterate nodes
for (const node of doc.nodes) {
    console.log(node.key, '=', node.value);
}
```

### TypeScript

```typescript
import { Parser, Document, Node, Value } from '@uplang/up';

const parser = new Parser();
const doc: Document = parser.parse(input);

const name: string | undefined = doc.getScalar('name');
const config: Map<string, Value> | undefined = doc.getBlock('config');
```

**📖 For detailed examples and tutorials, see [QUICKSTART.md](QUICKSTART.md)**

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Getting started guide with examples
- **[DESIGN.md](DESIGN.md)** - Architecture and design decisions
- **[UP Specification](https://github.com/uplang/spec)** - Complete language specification

## API Overview

### Core Classes

- **`Parser`** - Main parser for converting UP text into documents
- **`Document`** - Parsed document with convenient access methods
- **`Node`** - Key-value pair with optional type annotation
- **`Value`** - Union type for all value types (scalar, block, list, table)

### Basic Usage

```javascript
import { Parser } from '@uplang/up';

const parser = new Parser();

// Parse string
const doc = parser.parse(upContent);

// Access values
const name = doc.getScalar('name');
const server = doc.getBlock('server');
const tags = doc.getList('tags');

// Iterate all nodes
for (const node of doc.nodes) {
    console.log(node.key, node.type, node.value);
}
```

**See [DESIGN.md](DESIGN.md) for complete API documentation and implementation details.**

## Browser Usage

```html
<script type="module">
  import { Parser } from 'https://cdn.skypack.dev/@uplang/up';

  const parser = new Parser();
  const doc = parser.parse(`
    title "My Config"
    port!int 8080
  `);

  console.log(doc.getScalar('title'));
</script>
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Project Structure

```
js/
├── src/
│   ├── parser.ts        # Main parser implementation
│   ├── types.ts         # TypeScript definitions
│   ├── document.ts      # Document class
│   └── index.ts         # Public API exports
├── dist/
│   ├── index.js         # CommonJS build
│   ├── index.mjs        # ESM build
│   └── index.d.ts       # TypeScript definitions
├── test/
│   └── parser.test.ts   # Comprehensive tests
├── package.json
├── README.md            # This file
├── QUICKSTART.md        # Getting started guide
├── DESIGN.md            # Architecture documentation
└── LICENSE              # GNU GPLv3
```

## Contributing

Contributions are welcome! Please see the main [CONTRIBUTING.md](https://github.com/uplang/spec/blob/main/CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Links

- **[UP Language Specification](https://github.com/uplang/spec)** - Official language spec
- **[Syntax Reference](https://github.com/uplang/spec/blob/main/SYNTAX-REFERENCE.md)** - Quick syntax guide
- **[UP Namespaces](https://github.com/uplang/ns)** - Official namespace plugins

### Other Implementations

- **[Go](https://github.com/uplang/go)** - Reference implementation
- **[Java](https://github.com/uplang/java)** - Modern Java 21+ with records and sealed types
- **[Python](https://github.com/uplang/py)** - Pythonic implementation with dataclasses
- **[Rust](https://github.com/uplang/rust)** - Zero-cost abstractions and memory safety
- **[C](https://github.com/uplang/c)** - Portable C implementation

## Support

- **Issues**: [github.com/uplang/js/issues](https://github.com/uplang/js/issues)
- **Discussions**: [github.com/uplang/spec/discussions](https://github.com/uplang/spec/discussions)
