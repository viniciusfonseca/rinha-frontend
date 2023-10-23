import { Tokenizer } from './tokenizer'

const MAX_CHUNK_SIZE = 2097152
const tokenizer = new Tokenizer()

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
        tokenizer.end()
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