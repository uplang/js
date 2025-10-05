// Test file for UP parser
const { test } = require('node:test');
const assert = require('node:assert');
const { parse } = require('./up.js');

test('parse simple key-value', () => {
  const input = 'name John Doe';
  const result = parse(input);
  assert.ok(result);
  assert.strictEqual(typeof result, 'object');
});

test('parse returns object', () => {
  const result = parse('');
  assert.ok(result !== null && typeof result === 'object');
});

test('parser exists', () => {
  assert.strictEqual(typeof parse, 'function');
});

