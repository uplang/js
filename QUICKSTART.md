# Quick Start Guide - JavaScript/TypeScript

Get started with the UP Parser for JavaScript/TypeScript in 5 minutes!

## Installation

```bash
npm install @uplang/up
```

## Your First Program

Create `example.js`:

```javascript
import { Parser } from '@uplang/up';

// Create a parser
const parser = new Parser();

// Parse UP content
const doc = parser.parse(`
name Alice
age!int 30
active!bool true
`);

// Access values
console.log('Name:', doc.getScalar('name'));
console.log('Age:', doc.getScalar('age'));
console.log('Active:', doc.getScalar('active'));

// Iterate all nodes
for (const node of doc.nodes) {
    console.log(`${node.key} = ${node.value}`);
}
```

Run it:

```bash
node example.js
```

## Common Use Cases

### 1. Configuration Files

```javascript
import { Parser } from '@uplang/up';
import { readFileSync } from 'fs';

const content = readFileSync('config.up', 'utf-8');
const parser = new Parser();
const doc = parser.parse(content);

// Access configuration
const server = doc.getBlock('server');
if (server) {
    console.log('Host:', server.get('host'));
    console.log('Port:', server.get('port'));
}
```

### 2. TypeScript with Type Safety

```typescript
import { Parser, Document, Value } from '@uplang/up';

const parser = new Parser();
const doc: Document = parser.parse(input);

// Type-safe access
const name: string | undefined = doc.getScalar('name');
const config: Map<string, Value> | undefined = doc.getBlock('config');

// With type guards
for (const node of doc.nodes) {
    if (typeof node.value === 'string') {
        console.log('Scalar:', node.value);
    } else if (node.value instanceof Map) {
        console.log('Block:', node.value.size, 'entries');
    } else if (Array.isArray(node.value)) {
        console.log('List:', node.value.length, 'items');
    }
}
```

### 3. Browser Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>UP Parser Example</title>
</head>
<body>
    <script type="module">
        import { Parser } from 'https://cdn.skypack.dev/@uplang/up';

        const parser = new Parser();
        const doc = parser.parse(`
            title "My Web App"
            theme dark
            features [auth, api, websockets]
        `);

        document.title = doc.getScalar('title');
        console.log('Theme:', doc.getScalar('theme'));
        console.log('Features:', doc.getList('features'));
    </script>
</body>
</html>
```

### 4. Working with Nested Data

```javascript
const doc = parser.parse(`
database {
  primary {
    host db1.example.com
    port!int 5432
  }
  replica {
    host db2.example.com
    port!int 5432
  }
}
`);

const database = doc.getBlock('database');
if (database) {
    const primary = database.get('primary');
    const replica = database.get('replica');

    console.log('Primary:', primary.get('host'));
    console.log('Replica:', replica.get('host'));
}
```

## Next Steps

- Read the [DESIGN.md](DESIGN.md) for implementation details
- Explore the [UP Specification](https://github.com/uplang/spec)
- Check out [example files](https://github.com/uplang/spec/tree/main/examples)
- Try [UP Namespaces](https://github.com/uplang/ns) for extended functionality

## Need Help?

- 📚 [Full Documentation](README.md)
- 💬 [Discussions](https://github.com/uplang/spec/discussions)
- 🐛 [Report Issues](https://github.com/uplang/js/issues)

