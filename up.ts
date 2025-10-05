/**
 * UP Parser for TypeScript
 * Structured Notation for Annotated Properties
 *
 * Usage:
 *   import { parse, UpParser } from './up';
 *   const doc = parse(upText);
 *   console.log(JSON.stringify(doc, null, 2));
 */

export interface UpNode {
  key: string;
  type: string;
  value: UpValue;
}

export type UpValue = string | UpBlock | UpList | UpTable;
export type UpBlock = { [key: string]: UpValue };
export type UpList = UpValue[];
export interface UpTable {
  columns: string[];
  rows: string[][];
}

export class UpParser {
  #lines: string[] = [];
  #lineNum = 0;

  /**
   * Parse a UP document from a string
   */
  parse(input: string): UpNode[] {
    this.#lines = input.split(/\r?\n/);
    this.#lineNum = 0;
    return this.#parseNodes();
  }

  /**
   * Parse nodes until end of input or closing delimiter
   */
  #parseNodes(endDelimiter: string | null = null): UpNode[] {
    const nodes: UpNode[] = [];

    while (this.#lineNum < this.#lines.length) {
      const line = this.#lines[this.#lineNum]!;
      const trimmed = line.trim();

      // Check for end delimiter
      if (endDelimiter && trimmed === endDelimiter) {
        this.#lineNum++;
        break;
      }

      // Skip empty lines and comments
      if (trimmed === '' || trimmed.startsWith('#')) {
        this.#lineNum++;
        continue;
      }

      const node = this.#parseLine(line);
      if (node) {
        nodes.push(node);
      }
    }

    return nodes;
  }

  /**
   * Parse a single line into a node
   */
  #parseLine(line: string): UpNode | null {
    const trimmed = line.trim();

    // Split into key part and value part
    const firstSpace = trimmed.search(/\s/);
    let keyPart: string, valuePart: string;

    if (firstSpace === -1) {
      keyPart = trimmed;
      valuePart = '';
    } else {
      keyPart = trimmed.substring(0, firstSpace);
      valuePart = trimmed.substring(firstSpace).trim();
    }

    // Parse key and type annotation
    const bangIndex = keyPart.indexOf('!');
    let key: string, type: string;

    if (bangIndex !== -1) {
      key = keyPart.substring(0, bangIndex);
      type = keyPart.substring(bangIndex + 1);
    } else {
      key = keyPart;
      type = '';
    }

    this.#lineNum++;

    // Parse value based on what it starts with
    const value = this.#parseValue(valuePart, type);

    return {
      key,
      type,
      value
    };
  }

  /**
   * Parse a value based on its format
   */
  #parseValue(valuePart: string, type: string): UpValue {
    if (valuePart.startsWith('```')) {
      return this.#parseMultiline(valuePart, type);
    } else if (valuePart === '{') {
      return this.#parseBlock();
    } else if (valuePart === '[') {
      return this.#parseList();
    } else if (type === 'table' && valuePart.startsWith('{')) {
      return this.#parseTable();
    } else {
      return valuePart;
    }
  }

  /**
   * Parse a multiline block (```)
   */
  #parseMultiline(firstLine: string, typeAnnotation: string): string {
    const langHint = firstLine.substring(3).trim();
    const content: string[] = [];

    while (this.#lineNum < this.#lines.length) {
      const line = this.#lines[this.#lineNum]!;
      if (line.trim() === '```') {
        this.#lineNum++;
        break;
      }
      content.push(line);
      this.#lineNum++;
    }

    let text = content.join('\n');

    // Apply dedent if type is numeric
    if (typeAnnotation && /^\d+$/.test(typeAnnotation)) {
      const dedentCount = parseInt(typeAnnotation, 10);
      text = this.#dedent(text, dedentCount);
    }

    return text;
  }

  /**
   * Remove N spaces from the beginning of each line
   */
  #dedent(text: string, count: number): string {
    const lines = text.split('\n');
    return lines.map(line => {
      if (line.length >= count) {
        return line.substring(count);
      }
      return line;
    }).join('\n');
  }

  /**
   * Parse a block ({ ... })
   */
  #parseBlock(): UpBlock {
    const block: UpBlock = {};
    const nodes = this.#parseNodes('}');

    for (const node of nodes) {
      block[node.key] = node.value;
    }

    return block;
  }

  /**
   * Parse a list ([ ... ])
   */
  #parseList(): UpList {
    const list: UpList = [];

    while (this.#lineNum < this.#lines.length) {
      const line = this.#lines[this.#lineNum]!;
      const trimmed = line.trim();

      if (trimmed === ']') {
        this.#lineNum++;
        break;
      }

      if (trimmed === '' || trimmed.startsWith('#')) {
        this.#lineNum++;
        continue;
      }

      // Check if it's a nested block or inline list
      if (trimmed === '{') {
        this.#lineNum++;
        list.push(this.#parseBlock());
      } else if (trimmed.startsWith('[')) {
        const inlineList = this.#parseInlineList(trimmed);
        list.push(inlineList);
        this.#lineNum++;
      } else {
        list.push(trimmed);
        this.#lineNum++;
      }
    }

    return list;
  }

  /**
   * Parse an inline list: [item1, item2, item3]
   */
  #parseInlineList(line: string): string[] {
    // Remove [ and ]
    const content = line.substring(1, line.lastIndexOf(']')).trim();

    if (content === '') {
      return [];
    }

    // Split by comma and trim each item
    return content.split(',').map(item => item.trim());
  }

  /**
   * Parse a table structure
   */
  #parseTable(): UpTable {
    const table: Partial<UpTable> = {};

    while (this.#lineNum < this.#lines.length) {
      const line = this.#lines[this.#lineNum]!;
      const trimmed = line.trim();

      if (trimmed === '}') {
        this.#lineNum++;
        break;
      }

      if (trimmed === '' || trimmed.startsWith('#')) {
        this.#lineNum++;
        continue;
      }

      if (trimmed.startsWith('columns')) {
        const listPart = trimmed.substring('columns'.length).trim();
        table.columns = this.#parseInlineList(listPart);
        this.#lineNum++;
      } else if (trimmed.startsWith('rows')) {
        this.#lineNum++;
        table.rows = this.#parseBlockOfLists();
      }
    }

    return table as UpTable;
  }

  /**
   * Parse a block of inline lists (rows)
   */
  #parseBlockOfLists(): string[][] {
    const rows: string[][] = [];

    while (this.#lineNum < this.#lines.length) {
      const line = this.#lines[this.#lineNum]!;
      const trimmed = line.trim();

      if (trimmed === '}') {
        this.#lineNum++;
        break;
      }

      if (trimmed === '' || trimmed.startsWith('#')) {
        this.#lineNum++;
        continue;
      }

      if (trimmed.startsWith('[')) {
        rows.push(this.#parseInlineList(trimmed));
        this.#lineNum++;
      }
    }

    return rows;
  }
}

/**
 * Parse a UP document string
 */
export function parse(input: string): UpNode[] {
  return new UpParser().parse(input);
}

export default { parse, UpParser };

