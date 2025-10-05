/**
 * UP Parser for JavaScript/Node.js
 * Structured Notation for Annotated Properties
 *
 * Usage:
 *   const UP = require('./up');
 *   const doc = UP.parse(upText);
 *   console.log(JSON.stringify(doc, null, 2));
 */

class UpParser {
  constructor() {
    this.lines = [];
    this.lineNum = 0;
  }

  /**
   * Parse a UP document from a string
   * @param {string} input - The UP document text
   * @returns {Array} Array of nodes
   */
  parse(input) {
    this.lines = input.split(/\r?\n/);
    this.lineNum = 0;
    return this.parseNodes();
  }

  /**
   * Parse nodes until end of input or closing delimiter
   * @param {string} endDelimiter - Optional closing delimiter ('}' or ']')
   * @returns {Array} Array of nodes
   */
  parseNodes(endDelimiter = null) {
    const nodes = [];

    while (this.lineNum < this.lines.length) {
      const line = this.lines[this.lineNum];
      const trimmed = line.trim();

      // Check for end delimiter
      if (endDelimiter && trimmed === endDelimiter) {
        this.lineNum++;
        break;
      }

      // Skip empty lines and comments
      if (trimmed === '' || trimmed.startsWith('#')) {
        this.lineNum++;
        continue;
      }

      const node = this.parseLine(line);
      if (node) {
        nodes.push(node);
      }
    }

    return nodes;
  }

  /**
   * Parse a single line into a node
   * @param {string} line - The line to parse
   * @returns {Object} Node object with key, type, and value
   */
  parseLine(line) {
    const trimmed = line.trim();

    // Split into key part and value part
    const firstSpace = trimmed.search(/\s/);
    let keyPart, valuePart;

    if (firstSpace === -1) {
      keyPart = trimmed;
      valuePart = '';
    } else {
      keyPart = trimmed.substring(0, firstSpace);
      valuePart = trimmed.substring(firstSpace).trim();
    }

    // Parse key and type annotation
    const bangIndex = keyPart.indexOf('!');
    let key, type;

    if (bangIndex !== -1) {
      key = keyPart.substring(0, bangIndex);
      type = keyPart.substring(bangIndex + 1);
    } else {
      key = keyPart;
      type = '';
    }

    this.lineNum++;

    // Parse value based on what it starts with
    const value = this.parseValue(valuePart, type);

    return {
      key: key,
      type: type,
      value: value
    };
  }

  /**
   * Parse a value based on its format
   * @param {string} valuePart - The value string
   * @param {string} type - The type annotation
   * @returns {*} Parsed value
   */
  parseValue(valuePart, type) {
    if (valuePart.startsWith('```')) {
      return this.parseMultiline(valuePart, type);
    } else if (valuePart === '{') {
      return this.parseBlock();
    } else if (valuePart === '[') {
      return this.parseList();
    } else if (type === 'table' && valuePart.startsWith('{')) {
      return this.parseTable();
    } else {
      return valuePart;
    }
  }

  /**
   * Parse a multiline block (```)
   * @param {string} firstLine - The first line with ```
   * @param {string} typeAnnotation - The type annotation
   * @returns {string} The multiline content
   */
  parseMultiline(firstLine, typeAnnotation) {
    const langHint = firstLine.substring(3).trim();
    const content = [];

    while (this.lineNum < this.lines.length) {
      const line = this.lines[this.lineNum];
      if (line.trim() === '```') {
        this.lineNum++;
        break;
      }
      content.push(line);
      this.lineNum++;
    }

    let text = content.join('\n');

    // Apply dedent if type is numeric
    if (typeAnnotation && /^\d+$/.test(typeAnnotation)) {
      const dedentCount = parseInt(typeAnnotation, 10);
      text = this.dedent(text, dedentCount);
    }

    return text;
  }

  /**
   * Remove N spaces from the beginning of each line
   * @param {string} text - The text to dedent
   * @param {number} count - Number of spaces to remove
   * @returns {string} Dedented text
   */
  dedent(text, count) {
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
   * @returns {Object} Block object (key-value map)
   */
  parseBlock() {
    const block = {};
    const nodes = this.parseNodes('}');

    for (const node of nodes) {
      block[node.key] = node.value;
    }

    return block;
  }

  /**
   * Parse a list ([ ... ])
   * @returns {Array} List of items
   */
  parseList() {
    const list = [];

    while (this.lineNum < this.lines.length) {
      const line = this.lines[this.lineNum];
      const trimmed = line.trim();

      if (trimmed === ']') {
        this.lineNum++;
        break;
      }

      if (trimmed === '' || trimmed.startsWith('#')) {
        this.lineNum++;
        continue;
      }

      // Check if it's a nested block or inline list
      if (trimmed === '{') {
        this.lineNum++;
        list.push(this.parseBlock());
      } else if (trimmed.startsWith('[')) {
        const inlineList = this.parseInlineList(trimmed);
        list.push(inlineList);
        this.lineNum++;
      } else {
        list.push(trimmed);
        this.lineNum++;
      }
    }

    return list;
  }

  /**
   * Parse an inline list: [item1, item2, item3]
   * @param {string} line - The line containing the inline list
   * @returns {Array} Array of items
   */
  parseInlineList(line) {
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
   * @returns {Object} Table with columns and rows
   */
  parseTable() {
    const table = {};

    while (this.lineNum < this.lines.length) {
      const line = this.lines[this.lineNum];
      const trimmed = line.trim();

      if (trimmed === '}') {
        this.lineNum++;
        break;
      }

      if (trimmed === '' || trimmed.startsWith('#')) {
        this.lineNum++;
        continue;
      }

      if (trimmed.startsWith('columns')) {
        const listPart = trimmed.substring('columns'.length).trim();
        table.columns = this.parseInlineList(listPart);
        this.lineNum++;
      } else if (trimmed.startsWith('rows')) {
        this.lineNum++;
        table.rows = this.parseBlockOfLists();
      }
    }

    return table;
  }

  /**
   * Parse a block of inline lists (rows)
   * @returns {Array} Array of row arrays
   */
  parseBlockOfLists() {
    const rows = [];

    while (this.lineNum < this.lines.length) {
      const line = this.lines[this.lineNum];
      const trimmed = line.trim();

      if (trimmed === '}') {
        this.lineNum++;
        break;
      }

      if (trimmed === '' || trimmed.startsWith('#')) {
        this.lineNum++;
        continue;
      }

      if (trimmed.startsWith('[')) {
        rows.push(this.parseInlineList(trimmed));
        this.lineNum++;
      }
    }

    return rows;
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parse: (input) => new UpParser().parse(input),
    UpParser: UpParser
  };
}

