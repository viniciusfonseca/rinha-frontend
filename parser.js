importScripts('./rinha-json/pkg/rinha_json.js')

wasm_bindgen('./rinha-json/pkg/rinha_json_bg.wasm')

const decoder = new TextDecoder()

recv = chunk => {
  postMessage(decoder.decode(chunk))
}

onmessage = async event => {
  try {
    const json = await event.data.text()
    JSON.parse(json)
    const buf = await event.data.arrayBuffer()
    wasm_bindgen.parse(new Uint8Array(buf))
    postMessage(null)
  }
  catch (e) {
    console.error(e)
    postMessage(e)
  }
}