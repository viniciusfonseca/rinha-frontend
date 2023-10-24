/** @type {HTMLInputElement} */
const inputEl = document.getElementById('file')
const errMsgEl = document.getElementById('errmsg')
const status = document.getElementById('status')
const spinnerEl = document.getElementById('spinner')
const inputLabelEl = document.getElementById('input_label')
const homeEl = document.getElementById('home')
const jsonViewerEl = document.getElementById('json-viewer')

function handleLabelKey(e) {
  if (e.which === 32 || e.which === 13){
    e.preventDefault();
    inputEl.click();
  }
}

inputLabelEl.addEventListener('keyup', handleLabelKey)
inputLabelEl.addEventListener('keypress', handleLabelKey)

function setErrMsg(msg, detail) {
  if (!msg) { errMsgEl.style.display = 'none' }
  else {
    errMsgEl.style.display = 'unset'
    errMsgEl.innerHTML = `${msg}<br>Error detail: ${detail}`
  }
}

function setSpinnerStatus(show) {
  spinnerEl.style.display = show ? 'flex' : 'none'
  inputLabelEl.style.display = show ? 'none' : 'unset'
}

const MAX_CHUNK_SIZE = 2097152
window.bytesProcessed = 0
window.filesize = 1
let parseWorker = new Worker('worker/index.min.js')
async function handleFileInput() {
  const start = performance.now()
  window.filename = inputEl.files[0].name
  window.filesize = inputEl.files[0].size
  setSpinnerStatus(true)
  setErrMsg(null)
  parseWorker.postMessage(inputEl.files[0])
  window.view = []
  window.collapsed = []
  window.bytesProcessed = 0
  let lastUpdatedRowId = 0
  parseWorker.onmessage = event => {
    if (typeof event.data === "number") {
      window.bytesProcessed += event.data
      return
    }
    if (event.data === null) {
      parseWorker.terminate()
      parseWorker = new Worker('worker/index.min.js')
      console.log(`finished streaming json in ${Math.ceil(performance.now() - start)}ms`)
      setTimeout(() => window.updateStreamingStatus(false), 10)
      return
    }
    if (event.data instanceof Error) {
      console.error(event.data)
      setErrMsg('Invalid file. Please load a valid JSON file.', event.data.message)
      setTimeout(() => window.updateStreamingStatus(false), 10)
      setSpinnerStatus(false)
      return
    }
    let shouldRenderViewer = false
    if (window.view.length === 0) {
      console.log(`first stream emitted in ${performance.now() - start}ms`)
      shouldRenderViewer = true
    }
    if (typeof event.data === "object" && !Array.isArray(event.data)) {
      if (event.data.type === "updateNode") {
        for (let i = lastUpdatedRowId; i < window.view; i++) {
          const index = readRowIndex(window.view[i])
          if (index === event.data.rowIndex) {
            const data = window.view[i].split('\x1F')
            data[4] = event.data.nodeId
            window.view[i] = data.join('\x1F')
            lastUpdatedRowId = i
            break
          }
        }
      }
    }
    // let startIdx = window.view.length
    const chunk = event.data.split('\x1E')
    window.view.push(...chunk)
    if (shouldRenderViewer) {
      setSpinnerStatus(false)
      homeEl.parentNode.removeChild(homeEl)
      window.mountJSONViewer('json-viewer')
    }
    else {
      window.updateRowCount(window.view.length)
    }
  }
}

function readRowIndex(input) {
  let res = ""
  let i = 0
  while (input[i] && ('0' <= input[i] && input[i] <= '9')) { res += input[i]; i++ }
  return +res
}