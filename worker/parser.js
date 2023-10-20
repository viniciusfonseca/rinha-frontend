/** @enum {number} */
const TokenParserState = {
  VALUE: 0,
  KEY: 1,
  COLON: 2,
  COMMA: 3,
  ENDED: 4,
  ERROR: 5,
  SEPARATOR: 6,
}

/** @enum {number} */
const TokenParserMode = {
  OBJECT: 0,
  ARRAY: 1,
}

/** @enum {number} */
const TokenType = {
  LEFT_BRACE: 0,
  RIGHT_BRACE: 1,
  LEFT_BRACKET: 2,
  RIGHT_BRACKET: 3,
  COLON: 4,
  COMMA: 5,
  TRUE: 6,
  FALSE: 7,
  NULL: 8,
  STRING: 9,
  NUMBER: 10,
  SEPARATOR: 11,
}

export class TokenParser {

  /** @type {TokenParserState} */
  state = TokenParserState.VALUE

  /** @type {TokenParserMode} */
  mode

  /** @type {import("@streamparser/json/dist/mjs/utils/types/jsonTypes").JsonKey} */
  key

  /** @type {import("@streamparser/json/dist/mjs/utils/types/jsonTypes").JsonStruct} */
  value

  /** @type {import("@streamparser/json").StackElement[]} */
  stack = []

  /** @type {string[]} */
  rows = []

  rowCount = 0

  /** @type {string} */
  display

  indent = 0

  batchSize = 50

  buf = new Uint8Array(1024 * 10000)
  bufCursor = 0

  encoder = new TextEncoder()

  leftSquaredBracket = this.encoder.encode('[')
  rightSquaredBracket = this.encoder.encode(']')

  /**
   * 
   * @param {TokenType} token 
   * @param {string | number | boolean | null} value 
   * @returns 
   */
  write(token, value, len) {
    try {
      if (this.state === TokenParserState.VALUE) {
        if (
          token === TokenType.STRING ||
          token === TokenType.NUMBER ||
          token === TokenType.TRUE ||
          token === TokenType.FALSE ||
          token === TokenType.NULL
        ) {

          if (this.mode === TokenParserMode.OBJECT) {
            this.value[this.key] = value
            this.state = TokenParserState.COMMA
            this.writeValue(value, len)
          } else if (this.mode === TokenParserMode.ARRAY) {
            this.value.push(value)
            this.state = TokenParserState.COMMA
            this.writeValue(value, len)
          }
          return;
        }

        if (token === TokenType.LEFT_BRACE) {
          this.push();
          if (this.mode === TokenParserMode.OBJECT) {
            this.value = this.value[this.key] = {};
          }
          else if (this.mode === TokenParserMode.ARRAY) {
            const val = {};
            this.value.push(val);
            this.value = val;
          }
          else {
            this.value = {};
          }
          if (this.indent > 0) {
            this.writeValue(null, 0)
            this.indent++
          }
          this.mode = TokenParserMode.OBJECT;
          this.state = TokenParserState.KEY;
          this.key = undefined;
          return;
        }

        if (token === TokenType.LEFT_BRACKET) {
          this.push();
          if (this.mode === TokenParserMode.OBJECT) {
            this.value = this.value[this.key] = [];
          } else if (this.mode === TokenParserMode.ARRAY) {
            const val = [];
            this.value.push(val);
            this.value = val;
          } else {
            this.value = [];
          }
          this.mode = TokenParserMode.ARRAY;
          this.state = TokenParserState.VALUE;
          this.writeValue(this.leftSquaredBracket, 1)
          this.indent++
          this.key = 0;
          return;
        }

        if (
          this.mode === TokenParserMode.ARRAY &&
          token === TokenType.RIGHT_BRACKET &&
          this.value.length === 0
        ) {
          this.display = ']'
          this.indent--
          this.writeKey(null, 0)
          this.writeValue(this.rightSquaredBracket, 1)
          this.pop();
          return;
        }
      }

      if (this.state === TokenParserState.KEY) {
        if (token === TokenType.STRING) {
          this.key = value;
          this.state = TokenParserState.COLON;
          return;
        }

        if (
          token === TokenType.RIGHT_BRACE &&
          Object.keys(this.value).length === 0
        ) {
          this.indent--
          // this.pushRow()
          this.pop();
          return;
        }
      }

      if (this.state === TokenParserState.COLON) {
        if (token === TokenType.COLON) {
          this.state = TokenParserState.VALUE;
          return;
        }
      }

      if (this.state === TokenParserState.COMMA) {
        if (token === TokenType.COMMA) {
          if (this.mode === TokenParserMode.ARRAY) {
            this.state = TokenParserState.VALUE;
            this.key++;
            return;
          }

          /* istanbul ignore else */
          if (this.mode === TokenParserMode.OBJECT) {
            this.state = TokenParserState.KEY;
            return;
          }
        }

        if (
          (token === TokenType.RIGHT_BRACE &&
            this.mode === TokenParserMode.OBJECT) ||
          (token === TokenType.RIGHT_BRACKET &&
            this.mode === TokenParserMode.ARRAY)
        ) {
          this.indent--
          if (token === TokenType.RIGHT_BRACKET) {
            this.writeKey(null, 0)
            this.writeValue(this.rightSquaredBracket, 1)
          }
          this.pop();
          return;
        }
      }

      throw new TokenParserError(
        `Unexpected ${TokenType[token]} (${JSON.stringify(value)}) in state ${TokenParserStateToString(this.state)}`,
      );
    } catch (err) {
      console.error(err)
      this.close(err)
    }
  }

  encodedIntCache = new Map()

  /**
   * 
   * @param {number} int 
   * @returns {Uint8Array}
   */
  getEncodedInt(int) {
    const cached = this.encodedIntCache.get(int)
    if (!cached) {
      const newEncodedIndent = this.encoder.encode(this.indent.toString())
      this.encodedIntCache.set(int, newEncodedIndent)
      return newEncodedIndent
    }
    return cached
  }

  /**
   * 
   * @param {number} char 
   */
  writeChar(char) {
    this.buf[this.bufCursor++] = char
  }

  /**
   * 
   * @param {Uint8Array} value 
   */
  writeValue(value, len) {
    const numericKey = +this.key
    if (numericKey) {
      const key = this.getEncodedInt(numericKey)
      this.writeKey(key, key.length)
    }
    if (len) {
      this.buf.set(value.subarray(0, len), this.bufCursor)
      this.bufCursor += len
    }
    this.buf[this.bufCursor++] = 0x1F
    const indent = this.getEncodedInt(this.indent)
    this.buf.set(indent, this.bufCursor)
    this.bufCursor += indent.length
    this.buf[this.bufCursor++] = 0x1E
    this.rowCount++
  }

  /**
   * 
   * @param {Uint8Array} value 
   */
  writeKey(key, len) {
    if (len) {
      this.buf.set(key.subarray(0, len), this.bufCursor)
      this.bufCursor += len
    }
    this.buf[this.bufCursor++] = 0x1F
  }

  pushRow(emptyKey = false, errMsg) {
    if (this.rowCount > 0) {
        this.buf += '\x1E'
        this.batchSize = 10000
    }
    this.buf += `${emptyKey ? "" : this.key}\x1F${this.display}\x1F${errMsg || Math.max(0, this.indent)}`
    this.rowCount++
    if (this.rowCount === this.batchSize) {
      postMessage(this.buf)
      this.buf = ""
      this.rowCount = 0
    }
  }

  push() {
    this.stack.push({
      key: this.key,
      value: this.value,
      mode: this.mode,
    });
  }

  pop() {
    ({
      key: this.key,
      value: this.value,
      mode: this.mode
    } = this.stack.pop());

    this.state =
      this.mode !== undefined ? TokenParserState.COMMA : TokenParserState.VALUE;
  }

  close(err) {
    if (
      (this.state !== TokenParserState.VALUE &&
        this.state !== TokenParserState.SEPARATOR) ||
      this.stack.length > 0
    ) {
      err = new Error(
        `Parse error: Encountered EOF while parsing "${TokenParserStateToString(this.state)}".`,
      )
    }
    if (err) {
      this.pushRow(false, err.message)
    }
    postMessage(this.buf)
    postMessage(err || null)
  }
}

/**
 * 
 * @param {string | number | boolean | null} value 
 * @returns 
 */
function getDisplay(value) {
  if (value === null) { return "null" }
  if (typeof value === "string") { return `"${value}"` }
  return value.toString()
}

function TokenParserStateToString(state) {
  return ["VALUE", "KEY", "COLON", "COMMA", "ENDED", "ERROR", "SEPARATOR"][state]
}

class TokenParserError extends Error {
  constructor(message) {
    super(message)
    Object.setPrototypeOf(this, TokenParserError.prototype)
  }
}