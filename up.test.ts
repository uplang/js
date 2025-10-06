import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parse, Parser, Document } from './dist/up.js';

describe('UP Parser', () => {
  describe('parse()', () => {
    it('should parse empty string', () => {
      const doc = parse('');
      assert.ok(doc instanceof Document);
      assert.strictEqual(doc.isEmpty(), true);
    });

    it('should parse simple scalar', () => {
      const doc = parse('name John Doe');
      assert.strictEqual(doc.nodes.length, 1);
      assert.strictEqual(doc.nodes[0].key, 'name');
      assert.strictEqual(doc.nodes[0].value, 'John Doe');
    });

    it('should parse type annotation', () => {
      const doc = parse('age!int 30');
      assert.strictEqual(doc.nodes.length, 1);
      assert.strictEqual(doc.nodes[0].key, 'age');
      assert.strictEqual(doc.nodes[0].typeAnnotation, 'int');
      assert.strictEqual(doc.nodes[0].value, '30');
    });

    it('should skip comments', () => {
      const input = `
# This is a comment
name John
# Another comment
age!int 30
`;
      const doc = parse(input);
      assert.strictEqual(doc.nodes.length, 2);
      assert.strictEqual(doc.nodes[0].key, 'name');
      assert.strictEqual(doc.nodes[1].key, 'age');
    });

    it('should parse block', () => {
      const input = `
server {
host localhost
port!int 8080
}
`;
      const doc = parse(input);
      assert.strictEqual(doc.nodes.length, 1);
      assert.strictEqual(doc.nodes[0].key, 'server');
      const block = doc.nodes[0].value as Record<string, any>;
      assert.strictEqual(typeof block, 'object');
      assert.strictEqual(block.host, 'localhost');
      assert.strictEqual(block.port, '8080');
    });

    it('should parse nested blocks', () => {
      const input = `
database {
primary {
host db1.example.com
port!int 5432
}
}
`;
      const doc = parse(input);
      assert.strictEqual(doc.nodes.length, 1);
      const database = doc.nodes[0].value as Record<string, any>;
      const primary = database.primary as Record<string, any>;
      assert.strictEqual(primary.host, 'db1.example.com');
    });

    it('should parse multiline list', () => {
      const input = `
fruits [
apple
banana
cherry
]
`;
      const doc = parse(input);
      assert.strictEqual(doc.nodes.length, 1);
      const list = doc.nodes[0].value as any[];
      assert.strictEqual(list.length, 3);
      assert.strictEqual(list[0], 'apple');
      assert.strictEqual(list[1], 'banana');
      assert.strictEqual(list[2], 'cherry');
    });

    it('should parse inline list', () => {
      const doc = parse('colors [red, green, blue]');
      assert.strictEqual(doc.nodes.length, 1);
      const list = doc.nodes[0].value as any[];
      assert.strictEqual(list.length, 3);
      assert.strictEqual(list[0], 'red');
      assert.strictEqual(list[1], 'green');
      assert.strictEqual(list[2], 'blue');
    });

    it('should parse empty inline list', () => {
      const doc = parse('empty []');
      assert.strictEqual(doc.nodes.length, 1);
      const list = doc.nodes[0].value as any[];
      assert.strictEqual(list.length, 0);
    });

    it('should parse multiline string', () => {
      const input = `
description \`\`\`
Line 1
Line 2
Line 3
\`\`\`
`;
      const doc = parse(input);
      assert.strictEqual(doc.nodes.length, 1);
      const value = doc.nodes[0].value as string;
      assert.ok(value.includes('Line 1'));
      assert.ok(value.includes('Line 2'));
      assert.ok(value.includes('Line 3'));
    });

    it('should parse nested lists', () => {
      const input = `
coordinates [
[0, 0]
[1, 2]
[3, 4]
]
`;
      const doc = parse(input);
      assert.strictEqual(doc.nodes.length, 1);
      const list = doc.nodes[0].value as any[];
      assert.strictEqual(list.length, 3);
      assert.deepStrictEqual(list[0], ['0', '0']);
      assert.deepStrictEqual(list[1], ['1', '2']);
      assert.deepStrictEqual(list[2], ['3', '4']);
    });
  });

  describe('Document', () => {
    it('should create empty document', () => {
      const doc = new Document();
      assert.strictEqual(doc.isEmpty(), true);
      assert.strictEqual(doc.nodes.length, 0);
    });

    it('should create document with nodes', () => {
      const nodes = [{ key: 'name', value: 'John' }];
      const doc = new Document(nodes);
      assert.strictEqual(doc.isEmpty(), false);
      assert.strictEqual(doc.nodes.length, 1);
    });
  });

  describe('Parser', () => {
    it('should instantiate parser', () => {
      const parser = new Parser();
      assert.ok(parser instanceof Parser);
    });

    it('should parse document', () => {
      const parser = new Parser();
      const doc = parser.parseDocument('name John');
      assert.ok(doc instanceof Document);
      assert.strictEqual(doc.nodes.length, 1);
    });
  });
});

