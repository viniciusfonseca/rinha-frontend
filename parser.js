const decoder = new TextDecoder()

onmessage = async event => {
  try {
    const json = await event.data.text()
    const result = [""]
    mountRows(result, JSON.parse(json))
    if (rowCount > 0) {
      postMessage(result[0])
      result[0] = ""
      rowCount = 0
    }
    postMessage(null)
  }
  catch (e) {
    console.error(e)
    postMessage(e)
  }
}

function mountRows(result, node, indent = 0) {
  if (Array.isArray(node)) {
    node.forEach((value, i) => {
      pushRow(result, i, getDisplay(value), indent)
      if (Array.isArray(value)) {
        mountRows(result, value, indent + 1)
        pushRow(result, "", "]", indent)
      }
      else if (value != null && typeof value === "object") {
        mountRows(result, value, indent + 1)
      }
    })
  }
  else if (typeof node === "object") {
    Object.entries(node).forEach(([key, value]) => {
      pushRow(result, key, getDisplay(value), indent)
      if (Array.isArray(value)) {
        mountRows(result, value, indent + 1)
        pushRow(result, "", "]", indent)
      }
      else if (value != null && typeof value === "object") {
        mountRows(result, value, indent + 1)
      }
    })
  }
}

function getDisplay(value) {
  if (value === null) return "null"
  if (Array.isArray(value)) { return "[" }
  if (typeof value === "object") { return "" }
  if (typeof value === "string") { return `"${value}"` }
  return value.toString()
}

let rowCount = 0
function pushRow(result, key, display, indent) {
  if (rowCount > 0) {
    result[0] += '\x1E'
  }
  result[0] += `${key}\x1F${display}\x1F${indent}`
  rowCount++
  if (rowCount === 5000) {
    postMessage(result[0])
    result[0] = ""
    rowCount = 0
  }
}