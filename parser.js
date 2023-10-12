importScripts('./rinha-json/pkg/rinha_json.js')

wasm_bindgen('./rinha-json/pkg/rinha_json_bg.wasm')

const decoder = new TextDecoder()

recv = chunk => {
  postMessage(decoder.decode(chunk))
}

onmessage = event => {
  try {
    wasm_bindgen.parse(event.data)
    postMessage(null)
  }
  catch (e) {
    postMessage(e)
  }
}