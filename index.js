/** @type {HTMLInputElement} */
const inputEl = document.getElementById('file')
const errMsgEl = document.getElementById('errmsg')
const status = document.getElementById('status')
const spinnerEl = document.getElementById('spinner')
const inputLabelEl = document.getElementById('input_label')
const homeEl = document.getElementById('home')
const jsonViewerEl = document.getElementById('json-viewer')

function handleLabelKey(e) {
  if(e.which === 32 || e.which === 13){
    e.preventDefault();
    inputEl.click();
  }
}

inputLabelEl.addEventListener('keyup', handleLabelKey)
inputLabelEl.addEventListener('keypress', handleLabelKey)

function setErrMsg(msg) {
  if (!msg) { errMsgEl.style.display = 'none' }
  else {
    errMsgEl.style.display = 'unset'
    errMsgEl.innerText = msg
  }
}

function setSpinnerStatus(show) {
  spinnerEl.style.display = show ? 'flex' : 'none'
  inputLabelEl.style.display = show ? 'none' : 'unset'
}

let parseWorker = new Worker('parser.js')
async function handleFileInput() {
  const start = performance.now()
  window.filename = inputEl.files[0].name
  setSpinnerStatus(true)
  setErrMsg(null)
  parseWorker.postMessage(inputEl.files[0])
  window.rows = []
  parseWorker.onmessage = event => {
    if (event.data === null) {
      parseWorker.terminate()
      parseWorker = new Worker('parser.js')
      console.log(`finished streaming json in ${Math.ceil(performance.now() - start)}ms`)
      setTimeout(() => window.updateStreamingStatus(false), 10)
      return
    }
    if (event.data instanceof Error) {
      console.error(event.data)
      setErrMsg('Invalid file. Please load a valid JSON file.')
      setSpinnerStatus(false)
      return
    }
    let shouldRenderViewer = false
    if (rows.length === 0) {
      console.log(`finished parsing json in ${performance.now() - start}ms`)
      shouldRenderViewer = true
    }
    window.rows.push(...event.data.split('\x1E'))
    if (shouldRenderViewer) {
      setSpinnerStatus(false)
      homeEl.parentNode.removeChild(homeEl)
      window.mountJSONViewer('json-viewer')
    }
    else {
      window.updateRowCount(window.rows.length)
    }
  }
}