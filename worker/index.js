import { Tokenizer } from '@streamparser/json'
import { TokenParser } from './parser'

const tokenizer = new Tokenizer()
const tokenParser = new TokenParser()
tokenizer.onToken = tokenInfo => {
  try {
    tokenParser.write(tokenInfo)
  }
  catch (e) {
    console.error(e)
  }
}

onmessage = event => {
  try {
    /** @type {ReadableStream<Uint8Array>} */
    const stream = event.data.stream()

    stream.pipeTo(new WritableStream({
      write(chunk) {
        tokenizer.write(chunk)
      },
      close() {
        tokenParser.close()
      }
    }))
  }
  catch (e) {
    console.error(e)
    postMessage(e)
  }
}