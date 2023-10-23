import { Tokenizer } from '@streamparser/json'
import { TokenParser } from './parser'

const MAX_CHUNK_SIZE = 2097152
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

onmessage = async event => {
  try {
    if (event.data.size <= MAX_CHUNK_SIZE) {
      JSON.parse(await event.data.text())
    }

    /** @type {ReadableStream<Uint8Array>} */
    const stream = event.data.stream()

    const destStream = new WritableStream({
      write(chunk) {
        tokenizer.write(chunk)
        postMessage(chunk.byteLength)
      },
      close() {
        tokenParser.close()
        postMessage(null)
      }
    })
    stream.pipeTo(destStream)
  }
  catch (e) {
    console.error(e)
    postMessage(e)
  }
}