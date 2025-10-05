import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { parse } from './dist/up.js';

describe('Example Files', () => {
  it('should parse 01-basic-scalars.up', () => {
    const content = readFileSync('examples/core/01-basic-scalars.up', 'utf-8');
    const doc = parse(content);
    assert.strictEqual(doc.nodes.length, 19);
  });

  it('should parse 02-blocks.up', () => {
    const content = readFileSync('examples/core/02-blocks.up', 'utf-8');
    const doc = parse(content);
    assert.strictEqual(doc.nodes.length, 4);
  });

  it('should parse 03-lists.up', () => {
    const content = readFileSync('examples/core/03-lists.up', 'utf-8');
    const doc = parse(content);
    assert.ok(doc.nodes.length >= 5);
  });

  it('should parse 04-multiline.up', () => {
    const content = readFileSync('examples/core/04-multiline.up', 'utf-8');
    const doc = parse(content);
    assert.ok(doc.nodes.length >= 5);
  });

  it('should parse 06-comments.up', () => {
    const content = readFileSync('examples/core/06-comments.up', 'utf-8');
    const doc = parse(content);
    // Comments file has 6 top-level nodes (name, age, server block, items list, description, database block)
    assert.ok(doc.nodes.length >= 6);
  });
});

