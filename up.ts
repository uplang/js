/**
 * UP (Unified Properties) parser for TypeScript
 *
 * A modern, human-friendly data serialization format parser.
 *
 * @example
 * ```typescript
 * import { parse, Parser } from './up';
 *
 * const input = `
 * name John Doe
 * age!int 30
 * `;
 *
 * const doc = parse(input);
 * ```
 */

/**
 * Block (nested key-value pairs)
 */
export interface Block {
  [key: string]: Value;
}

/**
 * List of values
 */
export interface List extends Array<Value> {}

/**
 * Represents any UP value
 */
export type Value = string | Block | List | Table;

/**
 * Table with columns and rows
 */
export interface Table {
  columns: Value[];
  rows: Value[][];
}

/**
 * A key-value node with optional type annotation
 */
export interface Node {
  /** The key name */
  key: string;
  /** Optional type annotation (e.g., "int", "bool", "list") */
  typeAnnotation?: string | undefined;
  /** The value */
  value: Value;
}

/**
 * Represents a parsed UP document
 */
export class Document {
  /** Top-level nodes in the document */
  public nodes: Node[];

  constructor(nodes: Node[] = []) {
    this.nodes = nodes;
  }

  /** Check if document is empty */
  isEmpty(): boolean {
    return this.nodes.length === 0;
  }
}

/**
 * Parse error
 */
export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * UP document parser with configurable behavior
 */
export class Parser {
  /**
   * Parse a UP document from a string
   */
  parseDocument(input: string): Document {
    const lines = input.split('\n');
    const nodes: Node[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (!line) {
        i++;
        continue;
      }
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        i++;
        continue;
      }

      try {
        const { node, nextIndex } = this.#parseLine(lines, i);
        nodes.push(node);
        i = nextIndex;
      } catch (error) {
        throw new ParseError(
          `line ${i + 1}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return new Document(nodes);
  }

  #parseLine(lines: string[], startIndex: number): { node: Node; nextIndex: number } {
    const line = lines[startIndex] || '';
    const [keyPart, valPart] = this.#splitKeyValue(line);
    const [key, typeAnnotation] = this.#parseKeyAndType(keyPart);

    const { value, nextIndex } = this.#parseValue(lines, startIndex, valPart, typeAnnotation);

    return {
      node: {
        key,
        typeAnnotation: typeAnnotation ?? undefined,
        value,
      },
      nextIndex,
    };
  }

  #splitKeyValue(line: string): [string, string] {
    const match = line.match(/^(\S+)\s*(.*)$/);
    if (!match) {
      return [line.trim(), ''];
    }
    return [match[1] || '', match[2] || ''];
  }

  #parseKeyAndType(keyPart: string): [string, string | null] {
    const idx = keyPart.indexOf('!');
    if (idx === -1) {
      return [keyPart, null];
    }
    return [keyPart.slice(0, idx), keyPart.slice(idx + 1)];
  }

  #parseValue(
    lines: string[],
    startIndex: number,
    valPart: string,
    typeAnnotation: string | null
  ): { value: Value; nextIndex: number } {
    // Multiline string
    if (valPart.startsWith('```')) {
      return this.#parseMultiline(lines, startIndex + 1, typeAnnotation);
    }

    // Block
    if (valPart === '{') {
      return this.#parseBlock(lines, startIndex + 1);
    }

    // List
    if (valPart === '[') {
      return this.#parseList(lines, startIndex + 1);
    }

    // Inline list
    if (valPart.startsWith('[') && valPart.endsWith(']')) {
      return {
        value: this.#parseInlineList(valPart),
        nextIndex: startIndex + 1,
      };
    }

    // Scalar
    return {
      value: valPart,
      nextIndex: startIndex + 1,
    };
  }

  #parseMultiline(
    lines: string[],
    startIndex: number,
    typeAnnotation: string | null
  ): { value: string; nextIndex: number } {
    const content: string[] = [];
    let i = startIndex;

    while (i < lines.length) {
      const line = lines[i];
      if (!line) break;
      const trimmed = line.trim();

      if (trimmed === '```') {
        i++;
        break;
      }

      content.push(line);
      i++;
    }

    let text = content.join('\n');

    // Apply dedenting if type annotation is a number
    if (typeAnnotation) {
      const dedentAmount = parseInt(typeAnnotation, 10);
      if (!isNaN(dedentAmount)) {
        text = this.#dedent(text, dedentAmount);
      }
    }

    return { value: text, nextIndex: i };
  }

  #parseBlock(lines: string[], startIndex: number): { value: Block; nextIndex: number } {
    const block: Block = {};
    let i = startIndex;

    while (i < lines.length) {
      const line = lines[i];
      if (!line) break;
      const trimmed = line.trim();

      if (trimmed === '}') {
        i++;
        break;
      }

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        i++;
        continue;
      }

      const { node, nextIndex } = this.#parseLine(lines, i);
      block[node.key] = node.value;
      i = nextIndex;
    }

    return { value: block, nextIndex: i };
  }

  #parseList(lines: string[], startIndex: number): { value: List; nextIndex: number } {
    const list: Value[] = [];
    let i = startIndex;

    while (i < lines.length) {
      const line = lines[i];
      if (!line) break;
      const trimmed = line.trim();

      if (trimmed === ']') {
        i++;
        break;
      }

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        i++;
        continue;
      }

      // Inline list within multiline list
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        list.push(this.#parseInlineList(trimmed));
        i++;
      }
      // Nested block
      else if (trimmed === '{') {
        const { value, nextIndex } = this.#parseBlock(lines, i + 1);
        list.push(value);
        i = nextIndex;
      }
      // Scalar
      else {
        list.push(trimmed);
        i++;
      }
    }

    return { value: list, nextIndex: i };
  }

  #parseInlineList(s: string): List {
    let content = s.trim();
    content = content.slice(1, -1); // Remove [ and ]

    if (!content.trim()) {
      return [];
    }

    return content.split(',').map((item) => item.trim());
  }

  #dedent(text: string, amount: number): string {
    return text
      .split('\n')
      .map((line) => (line.length >= amount ? line.slice(amount) : line))
      .join('\n');
  }
}

/**
 * Parse UP document from a string (convenience function)
 */
export function parse(input: string): Document {
  return new Parser().parseDocument(input);
}
