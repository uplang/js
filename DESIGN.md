# Design Documentation - JavaScript/TypeScript Implementation

This document describes the architecture and design decisions of the JavaScript/TypeScript UP parser implementation.

## Overview

The JavaScript/TypeScript implementation prioritizes:

- **Universal Compatibility** - Works in all JavaScript environments
- **TypeScript Support** - Full type definitions
- **Zero Dependencies** - No external runtime dependencies
- **Modern JavaScript** - ES6+ features
- **Dual Module Format** - ESM and CommonJS

## Architecture

### Module System

```
UP Parser
├── ESM (index.mjs)      → import { Parser } from '@uplang/up'
└── CommonJS (index.js)   → const { Parser } = require('@uplang/up')
```

Both formats share the same implementation with appropriate bundling.

### Core Components

```
┌─────────────┐
│   Parser    │  Main parsing logic
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Document   │  Parsed representation
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Node     │  Key-value pairs
└─────────────┘
```

## Data Structures

### Value Types

JavaScript uses native types:

```javascript
// Scalars - strings
'Alice', '30', 'true'

// Blocks - Maps
new Map([['host', 'localhost'], ['port', '8080']])

// Lists - Arrays
['production', 'web', 'api']

// Tables - Objects
{ columns: ['Name', 'Age'], rows: [['Alice', '30']] }

// Multiline - strings
'This is\nmultiline\ncontent'
```

**Design Rationale:**
- Native types = zero overhead
- Maps = order-preserving, proper key handling
- Arrays = native list operations
- No custom classes = simple, debuggable

### Node Structure

```javascript
{
  key: 'port',
  type: 'int',      // Optional, empty string if not present
  value: '8080'     // Actual parsed value
}
```

### Document Class

```javascript
class Document {
    constructor(nodes) {
        this.nodes = nodes;  // Array of Node objects
    }

    getScalar(key) { ... }
    getBlock(key) { ... }
    getList(key) { ... }
    // Convenience methods
}
```

## TypeScript Support

### Type Definitions

```typescript
export type Value =
    | string                          // Scalar
    | Map<string, Value>             // Block
    | Value[]                        // List
    | Table                          // Table
    | string;                        // Multiline

export interface Node {
    key: string;
    type: string;
    value: Value;
}

export interface Document {
    nodes: Node[];
    getScalar(key: string): string | undefined;
    getBlock(key: string): Map<string, Value> | undefined;
    getList(key: string): Value[] | undefined;
}
```

**Benefits:**
- IntelliSense support
- Compile-time type checking
- Better IDE experience
- Self-documenting API

## Parser Implementation

### Parsing Strategy

Line-by-line parsing with state machine:

```javascript
class Parser {
    parse(input) {
        const lines = input.split('\n');
        const nodes = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];
            if (this.isEmpty(line) || this.isComment(line)) {
                i++;
                continue;
            }

            const node = this.parseLine(line, lines, i);
            nodes.push(node);
            i = node.nextIndex;
        }

        return new Document(nodes);
    }
}
```

### Block Parsing

```javascript
parseBlock(lines, startIndex) {
    const entries = new Map();
    let i = startIndex + 1;

    while (i < lines.length) {
        const line = lines[i].trim();

        if (line === '}') {
            break;
        }

        if (this.isEmpty(line) || this.isComment(line)) {
            i++;
            continue;
        }

        const node = this.parseLine(lines[i], lines, i);
        entries.set(node.key, node.value);
        i = node.nextIndex;
    }

    return { value: entries, nextIndex: i + 1 };
}
```

## Environment Compatibility

### Node.js

```javascript
// CommonJS
const { Parser } = require('@uplang/up');

// ESM
import { Parser } from '@uplang/up';
```

### Browser

```html
<!-- CDN -->
<script type="module">
  import { Parser } from 'https://cdn.skypack.dev/@uplang/up';
</script>

<!-- Bundled -->
<script type="module" src="./node_modules/@uplang/up/dist/index.mjs"></script>
```

### Deno

```javascript
import { Parser } from 'npm:@uplang/up';
```

### Bun

```javascript
import { Parser } from '@uplang/up';
```

## Performance Optimizations

### String Operations

- Use template literals for multiline
- Minimize string allocations
- Reuse regex patterns

### Memory Management

- Avoid unnecessary array copies
- Use Maps for O(1) lookup
- Lazy evaluation where possible

### Bundle Size

- No dependencies = minimal size
- Tree-shakeable exports
- Minified production build

## Error Handling

### Parse Errors

```javascript
class ParseError extends Error {
    constructor(message, lineNumber, line) {
        super(`Parse error at line ${lineNumber}: ${message}\n  Line: ${line}`);
        this.lineNumber = lineNumber;
        this.line = line;
    }
}
```

**Benefits:**
- Clear error messages
- Line number context
- Original line preservation
- Stack traces

## Testing Strategy

### Test Framework

Uses standard JavaScript test frameworks:
- Jest (Node.js)
- Vitest (Vite projects)
- Mocha (alternative)

### Test Coverage

```javascript
describe('Parser', () => {
    it('parses simple scalars', () => {
        const doc = parser.parse('name Alice');
        expect(doc.getScalar('name')).toBe('Alice');
    });

    it('parses blocks', () => {
        const doc = parser.parse(`
            server {
              host localhost
            }
        `);
        const server = doc.getBlock('server');
        expect(server.get('host')).toBe('localhost');
    });
});
```

## Build System

### TypeScript Compilation

```
TypeScript Source → Compiler → JavaScript + Type Definitions
```

### Dual Package

```json
{
  "main": "./dist/index.js",      // CommonJS
  "module": "./dist/index.mjs",   // ESM
  "types": "./dist/index.d.ts",   // TypeScript
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

## Design Decisions

### Why Maps Instead of Objects?

**Pros:**
- Preserves insertion order (guaranteed)
- Proper key handling (any string)
- Better iteration methods
- More explicit

**Cons:**
- Less familiar to some developers
- Slightly more verbose

**Decision:** Correctness over convenience

### Why No Classes for Values?

**Pros:**
- Simple, debuggable
- Native JSON serialization
- No prototype overhead
- Works everywhere

**Cons:**
- No type discrimination
- Requires type checks
- No methods on values

**Decision:** Simplicity and compatibility

### Why Dual Module Format?

**Pros:**
- Works in all environments
- Tree-shaking for ESM
- Backward compatible

**Cons:**
- More complex build
- Larger package

**Decision:** Universal compatibility worth it

## Contributing

When contributing to the JavaScript/TypeScript implementation:

1. **Use TypeScript** - All source in TypeScript
2. **Test coverage** - Maintain >90% coverage
3. **Documentation** - JSDoc comments for all public APIs
4. **Code style** - Follow Airbnb style guide
5. **Browser compatibility** - Test in major browsers

## References

- [UP Specification](https://github.com/uplang/spec)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [Node.js Package Guide](https://nodejs.org/api/packages.html)

