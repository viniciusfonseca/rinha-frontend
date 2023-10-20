import { TokenType } from "@streamparser/json"
import { charset, escapedSequences } from "@streamparser/json/dist/mjs/utils/utf-8"

/**
 * @enum {number}
 */
const TokenizerStates = {
  START: 0,
  ENDED: 1,
  ERROR: 2,
  TRUE1: 3,
  TRUE2: 4,
  TRUE3: 5,
  FALSE1: 6,
  FALSE2: 7,
  FALSE3: 8,
  FALSE4: 9,
  NULL1: 10,
  NULL2: 11,
  NULL3: 12,
  STRING_DEFAULT: 13,
  STRING_AFTER_BACKSLASH: 14,
  STRING_UNICODE_DIGIT_1: 15,
  STRING_UNICODE_DIGIT_2: 16,
  STRING_UNICODE_DIGIT_3: 17,
  STRING_UNICODE_DIGIT_4: 18,
  STRING_INCOMPLETE_CHAR: 19,
  NUMBER_AFTER_INITIAL_MINUS: 20,
  NUMBER_AFTER_INITIAL_ZERO: 21,
  NUMBER_AFTER_INITIAL_NON_ZERO: 22,
  NUMBER_AFTER_FULL_STOP: 23,
  NUMBER_AFTER_DECIMAL: 24,
  NUMBER_AFTER_E: 25,
  NUMBER_AFTER_E_AND_SIGN: 26,
  NUMBER_AFTER_E_AND_DIGIT: 27,
  SEPARATOR: 28,
}

export class Tokenizer {

  bufferedString = new Uint8Array(2097152)
  bufferedNumber = new Uint8Array(32)
  charSplitBuffer = new Uint8Array(4)
  cursorBufferStr = 0
  cursorBufferNum = 0
  bytes_remaining = 0
  bytes_in_sequence = 0
  highSurrogate
  unicode
  encoder = new TextEncoder()
  

  /** @type {TokenizerStates} */
  state = TokenizerStates.START

  /**
   * 
   * @param {Uint8Array} chunk 
   */
  write(chunk) {
    for (let i = 0; i < chunk.length; i++) {
      const n = chunk[i]
      switch (this.state) {
        case TokenizerStates.START:
          if (
            n === charset.SPACE ||
            n === charset.NEWLINE ||
            n === charset.CARRIAGE_RETURN ||
            n === charset.TAB
          ) {
            // whitespace
            continue
          }
          if (n === charset.LEFT_CURLY_BRACKET) {
            this.onToken(TokenType.LEFT_BRACE)
            continue
          }
          if (n === charset.RIGHT_CURLY_BRACKET) {
            this.onToken(TokenType.RIGHT_BRACE)
            continue
          }
          if (n === charset.LEFT_SQUARE_BRACKET) {
            this.onToken(TokenType.LEFT_BRACKET)
            continue
          }
          if (n === charset.RIGHT_SQUARE_BRACKET) {
            this.onToken(TokenType.RIGHT_BRACKET)
            continue
          }
          if (n === charset.COLON) {
            this.onToken(TokenType.COLON)
            continue
          }
          if (n === charset.COMMA) {
            this.onToken(TokenType.COMMA)
            continue
          }
          if (n === charset.LATIN_SMALL_LETTER_T) {
            this.state = TokenizerStates.TRUE1
            continue
          }
          if (n === charset.LATIN_SMALL_LETTER_F) {
            this.state = TokenizerStates.FALSE1
            continue
          }
          if (n === charset.LATIN_SMALL_LETTER_N) {
            this.state = TokenizerStates.NULL1
            continue
          }
          if (n === charset.QUOTATION_MARK) {
            this.cursorBufferStr = 0
            this.state = TokenizerStates.STRING_DEFAULT;
            continue
          }
          if (n >= charset.DIGIT_ONE && n <= charset.DIGIT_NINE) {
            this.cursorBufferNum = 0
            this.bufferedNumber[this.cursorBufferNum++] = n
            this.state = TokenizerStates.NUMBER_AFTER_INITIAL_NON_ZERO
            continue
          }
          if (n === charset.DIGIT_ZERO) {
            this.cursorBufferNum = 0
            this.bufferedNumber[this.cursorBufferNum++] = n
            this.state = TokenizerStates.NUMBER_AFTER_INITIAL_ZERO
            continue
          }
          if (n === charset.HYPHEN_MINUS) {
            this.cursorBufferNum = 0
            this.bufferedNumber[this.cursorBufferNum++] = n
            this.state = TokenizerStates.NUMBER_AFTER_INITIAL_MINUS
            continue
          }
          break
        case TokenizerStates.STRING_DEFAULT:
          if (n === charset.QUOTATION_MARK) {
            this.onToken(TokenType.STRING, this.bufferedString)
            continue
          }
          if (n === charset.REVERSE_SOLIDUS) {
            this.state = TokenizerStates.STRING_AFTER_BACKSLASH
            continue
          }
          if (n >= 128) {
            if (n >= 194 && n <= 223) {
              this.bytes_in_sequence = 2;
            } else if (n <= 239) {
              this.bytes_in_sequence = 3;
            } else {
              this.bytes_in_sequence = 4;
            }

            if (this.bytes_in_sequence <= chunk.length - i) {
              this.appendBuf(chunk, i, i + this.bytes_in_sequence)
              i += this.bytes_in_sequence - 1;
              continue
            }

            this.bytes_remaining = i + this.bytes_in_sequence - buffer.length;
            this.char_split_buffer.set(buffer.subarray(i));
            i = buffer.length - 1;
            this.state = TokenizerStates.STRING_INCOMPLETE_CHAR;
            continue
          }

          if (n >= charset.SPACE) {
            this.bufferedString[this.cursorBufferStr++] = n
            continue
          }
          break
        case TokenizerStates.STRING_INCOMPLETE_CHAR:
          this.char_split_buffer.set(
            chunk.subarray(i, i + this.bytes_remaining),
            this.bytes_in_sequence - this.bytes_remaining,
          )
          this.appendBuf(this.charSplitBuffer, 0, this.bytes_in_sequence)
          i = this.bytes_remaining - 1
          this.state = TokenizerStates.STRING_DEFAULT;
          continue
        case TokenizerStates.STRING_AFTER_BACKSLASH:
          const controlChar = escapedSequences[n]
          if (controlChar) {
            this.bufferedString[this.cursorBufferStr++] = controlChar
            this.state = TokenizerStates.STRING_DEFAULT;
            continue
          }
          if (n === charset.LATIN_SMALL_LETTER_U) {
            this.unicode = "";
            this.state = TokenizerStates.STRING_UNICODE_DIGIT_1;
            continue;
          }
          break
        case TokenizerStates.STRING_UNICODE_DIGIT_1:
        case TokenizerStates.STRING_UNICODE_DIGIT_2:
        case TokenizerStates.STRING_UNICODE_DIGIT_3:
          if (
            (n >= charset.DIGIT_ZERO && n <= charset.DIGIT_NINE) ||
            (n >= charset.LATIN_CAPITAL_LETTER_A &&
              n <= charset.LATIN_CAPITAL_LETTER_F) ||
            (n >= charset.LATIN_SMALL_LETTER_A &&
              n <= charset.LATIN_SMALL_LETTER_F)
          ) {
            this.unicode += String.fromCharCode(n)
            this.state += 1
            continue
          }
          break
        case TokenizerStates.STRING_UNICODE_DIGIT_4:
          if (
            (n >= charset.DIGIT_ZERO && n <= charset.DIGIT_NINE) ||
            (n >= charset.LATIN_CAPITAL_LETTER_A &&
              n <= charset.LATIN_CAPITAL_LETTER_F) ||
            (n >= charset.LATIN_SMALL_LETTER_A &&
              n <= charset.LATIN_SMALL_LETTER_F)
          ) {
            const intVal = parseInt(
              this.unicode + String.fromCharCode(n),
              16,
            );
            if (this.highSurrogate === undefined) {
              if (intVal >= 0xd800 && intVal <= 0xdbff) {
                //<55296,56319> - highSurrogate
                this.highSurrogate = intVal
              } else {
                this.bufferedString.appendBuf(
                  this.encoder.encode(String.fromCharCode(intVal)),
                );
              }
            } else {
              if (intVal >= 0xdc00 && intVal <= 0xdfff) {
                //<56320,57343> - lowSurrogate
                this.appendBuf(
                  this.encoder.encode(
                    String.fromCharCode(this.highSurrogate, intVal),
                  ),
                );
              } else {
                this.appendBuf(
                  this.encoder.encode(
                    String.fromCharCode(this.highSurrogate),
                  ),
                )
              }
              this.highSurrogate = undefined
            }
            this.state = TokenizerStates.STRING_DEFAULT
            continue
          }
          break

        case TokenizerStates.NUMBER_AFTER_INITIAL_MINUS:
          if (n === charset.DIGIT_ZERO) {
            this.bufferedNumber[this.cursorBufferNum++] = n
            this.state = TokenizerStates.NUMBER_AFTER_INITIAL_ZERO
            continue
          }

          if (n >= charset.DIGIT_ONE && n <= charset.DIGIT_NINE) {
            this.bufferedNumber[this.cursorBufferNum++] = n
            this.state = TokenizerStates.NUMBER_AFTER_INITIAL_NON_ZERO
            continue
          }

          break
        case TokenizerStates.NUMBER_AFTER_INITIAL_ZERO:
          if (n === charset.FULL_STOP) {
            this.bufferedNumber[this.cursorBufferNum++] = n
            this.state = TokenizerStates.NUMBER_AFTER_FULL_STOP
            continue
          }

          if (
            n === charset.LATIN_SMALL_LETTER_E ||
            n === charset.LATIN_CAPITAL_LETTER_E
          ) {
            this.bufferedNumber[this.cursorBufferNum++] = n
            this.state = TokenizerStates.NUMBER_AFTER_E
            continue
          }

          i -= 1;
          this.state = TokenizerStates.START
          this.emitNumber()
          continue
        case TokenizerStates.NUMBER_AFTER_INITIAL_NON_ZERO:
          if (n >= charset.DIGIT_ZERO && n <= charset.DIGIT_NINE) {
            this.bufferedNumber[this.cursorBufferNum++] = n
            continue
          }
          if (n === charset.FULL_STOP) {
            this.bufferedNumber[this.cursorBufferNum++] = n
            this.state = TokenizerStates.NUMBER_AFTER_FULL_STOP
            continue
          }

          if (
            n === charset.LATIN_SMALL_LETTER_E ||
            n === charset.LATIN_CAPITAL_LETTER_E
          ) {
            this.bufferedNumber[this.cursorBufferNum++] = n
            this.state = TokenizerStates.NUMBER_AFTER_E
            continue
          }

          i -= 1
          this.state = TokenizerStates.START
          this.emitNumber()
          continue
        case TokenizerStates.NUMBER_AFTER_FULL_STOP:
          if (n >= charset.DIGIT_ZERO && n <= charset.DIGIT_NINE) {
            this.bufferedNumber[this.cursorBufferNum++] = n
            this.state = TokenizerStates.NUMBER_AFTER_DECIMAL
            continue
          }
          break
        case TokenizerStates.NUMBER_AFTER_DECIMAL:
          if (n >= charset.DIGIT_ZERO && n <= charset.DIGIT_NINE) {
            this.bufferedNumber[this.cursorBufferNum++] = n
            continue
          }

          if (
            n === charset.LATIN_SMALL_LETTER_E ||
            n === charset.LATIN_CAPITAL_LETTER_E
          ) {
            this.bufferedNumber[this.cursorBufferNum++] = n
            this.state = TokenizerStates.NUMBER_AFTER_E
            continue
          }

          i -= 1
          this.state = TokenizerStates.START
          this.emitNumber()
          continue

        case TokenizerStates.NUMBER_AFTER_E:
          if (n === charset.PLUS_SIGN || n === charset.HYPHEN_MINUS) {
            this.bufferedNumber[this.cursorBufferNum++] = n
            this.state = TokenizerStates.NUMBER_AFTER_E_AND_SIGN
            continue
          }
        case TokenizerStates.NUMBER_AFTER_E_AND_SIGN:
          if (n >= charset.DIGIT_ZERO && n <= charset.DIGIT_NINE) {
            this.bufferedNumber[this.cursorBufferNum++] = n
            this.state = TokenizerStates.NUMBER_AFTER_E_AND_DIGIT
            continue
          }

          break
        case TokenizerStates.NUMBER_AFTER_E_AND_DIGIT:
          if (n >= charset.DIGIT_ZERO && n <= charset.DIGIT_NINE) {
            this.bufferedNumber[this.cursorBufferNum++] = n
            continue
          }

          i -= 1
          this.state = TokenizerStates.START
          this.emitNumber()
          continue
        case TokenizerStates.TRUE1:
          if (n === charset.LATIN_SMALL_LETTER_R) {
            this.state = TokenizerStates.TRUE2
            continue
          }
          break
        case TokenizerStates.TRUE2:
          if (n === charset.LATIN_SMALL_LETTER_U) {
            this.state = TokenizerStates.TRUE3
            continue
          }
          break
        case TokenizerStates.TRUE3:
          if (n === charset.LATIN_SMALL_LETTER_E) {
            this.state = TokenizerStates.START
            this.onToken(TokenType.TRUE, true)
            continue
          }
          break
        case TokenizerStates.FALSE1:
          if (n === charset.LATIN_SMALL_LETTER_A) {
            this.state = TokenizerStates.FALSE2
            continue
          }
          break
        case TokenizerStates.FALSE2:
          if (n === charset.LATIN_SMALL_LETTER_L) {
            this.state = TokenizerStates.FALSE3
            continue
          }
          break
        case TokenizerStates.FALSE3:
          if (n === charset.LATIN_SMALL_LETTER_S) {
            this.state = TokenizerStates.FALSE4
            continue
          }
          break
        case TokenizerStates.FALSE4:
          if (n === charset.LATIN_SMALL_LETTER_E) {
            this.state = TokenizerStates.START
            this.onToken(TokenType.FALSE, false)
            continue
          }
          break
        case TokenizerStates.NULL1:
          if (n === charset.LATIN_SMALL_LETTER_U) {
            this.state = TokenizerStates.NULL2
            continue
          }
          break
        case TokenizerStates.NULL2:
          if (n === charset.LATIN_SMALL_LETTER_L) {
            this.state = TokenizerStates.NULL3
            continue
          }
          break
        case TokenizerStates.NULL3:
          if (n === charset.LATIN_SMALL_LETTER_L) {
            this.state = TokenizerStates.START
            this.onToken(TokenType.NULL, null)
            continue
          }
          break
        case TokenizerStates.ENDED:
          if (
            n === charset.SPACE ||
            n === charset.NEWLINE ||
            n === charset.CARRIAGE_RETURN ||
            n === charset.TAB
          ) {
            // whitespace
            continue;
          }
        throw new TokenizerError(
          `Unexpected "${String.fromCharCode(
            n,
          )}" at position "${i}" in state ${TokenizerStateToString(
            this.state,
          )}`,
        )
      }
    }

  }

  end() {
    switch (this.state) {
      case TokenizerStates.NUMBER_AFTER_INITIAL_ZERO:
      case TokenizerStates.NUMBER_AFTER_INITIAL_NON_ZERO:
      case TokenizerStates.NUMBER_AFTER_DECIMAL:
      case TokenizerStates.NUMBER_AFTER_E_AND_DIGIT:
        this.state = TokenizerStates.ENDED;
        this.emitNumber()
        this.onEnd()
        break;
      case TokenizerStates.START:
      case TokenizerStates.ERROR:
      case TokenizerStates.SEPARATOR:
        this.state = TokenizerStates.ENDED;
        this.onEnd()
        break;
      default:
        this.error(
          new TokenizerError(
            `Tokenizer ended in the middle of a token (state: ${TokenizerStateToString(
              this.state,
            )}). Either not all the data was received or the data was invalid.`,
          ),
        );
    }
  }

  /**
   * 
   * @param {Uint8Array} chunk 
   * @param {number} start 
   * @param {number} end 
   */
  appendBuf(chunk, start = 0, end = chunk.length) {
    const size = end - start
    this.bufferedString.set(chunk.subarray(start, end), this.cursorBufferStr)
    this.cursorBufferStr += size
  }

  emitNumber() {
    this.onToken(TokenType.NUMBER, this.bufferedNumber, this.cursorBufferNum)
  }
}

function TokenizerStateToString(tokenizerState) {
  return [
    "START",
    "ENDED",
    "ERROR",
    "TRUE1",
    "TRUE2",
    "TRUE3",
    "FALSE1",
    "FALSE2",
    "FALSE3",
    "FALSE4",
    "NULL1",
    "NULL2",
    "NULL3",
    "STRING_DEFAULT",
    "STRING_AFTER_BACKSLASH",
    "STRING_UNICODE_DIGIT_1",
    "STRING_UNICODE_DIGIT_2",
    "STRING_UNICODE_DIGIT_3",
    "STRING_UNICODE_DIGIT_4",
    "STRING_INCOMPLETE_CHAR",
    "NUMBER_AFTER_INITIAL_MINUS",
    "NUMBER_AFTER_INITIAL_ZERO",
    "NUMBER_AFTER_INITIAL_NON_ZERO",
    "NUMBER_AFTER_FULL_STOP",
    "NUMBER_AFTER_DECIMAL",
    "NUMBER_AFTER_E",
    "NUMBER_AFTER_E_AND_SIGN",
    "NUMBER_AFTER_E_AND_DIGIT",
    "SEPARATOR",
  ][tokenizerState];
}