import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { List } from 'react-virtualized/dist/commonjs/List';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { block } from 'million/react';

const TRUNCATE_LIMIT = 599182

const App = () => {

  const [rowCount, setRowCount] = useState(window.view?.length ?? 0)
  const [streamingStatus, setStreamingStatus] = useState(true)
  const [truncate, setTruncate] = useState(false)

  useEffect(() => {
    window.updateRowCount = setRowCount
    window.updateStreamingStatus = setStreamingStatus
    if (!truncate && rowCount >= TRUNCATE_LIMIT) {
      setTruncate(true)
    }
  }, [rowCount, streamingStatus])

  const progress = `${Math.floor(window.bytesProcessed * 100 / window.filesize)}%`

  function disableTruncate() {
    const list = document.getElementsByClassName('ReactVirtualized__List')[0]
    list.scrollTop = 0
    setTimeout(() => {
      setTruncate(false)
    })
  }

  return (
    <div className="wrapper">
      <header>
        <h1 id="filename" tabIndex={1}> { window.filename } </h1>
      </header>
      <div className="list">
        <AutoSizer>
        {
          ({ width, height }) =>
            <List
              tabIndex={1}
              width={width}
              height={height}
              overscanRowCount={15}
              rowCount={truncate ? Math.min(TRUNCATE_LIMIT, rowCount) : rowCount}
              rowHeight={28}
              rowRenderer={Row}
            />
        }
        </AutoSizer>
      </div>
      {
        streamingStatus ?
          <footer>
            <p id="status"> Reading file... ({progress}) </p>
          </footer> :
          truncate &&
            <footer>
              <p> This JSON file is too big and its view was truncated. </p>
              <button className="btn"
                style={{ marginBottom: '1em' }}
                type="button"
                onClick={disableTruncate}>
                  Show entire JSON
              </button>
            </footer>
      }
    </div>
  )
}

function readNodeId(input) {
  let res = ""
  let i = input.length - 1
  while (input[i] && ('0' <= input[i] && input[i] <= '9')) { res += input[i]; i-- }
  return res
}

function readRowIndex(input) {
  let res = ""
  let i = 0
  while (input[i] && ('0' <= input[i] && input[i] <= '9')) { res += input[i]; i++ }
  return res
}

function collapse(parentRow, viewIndex) {
  const [ index, _0, _1, parentIndent ] = parentRow.split('\x1F')
  const arrayA = window.view.slice(0, viewIndex + 1)
  let indent
  let i = viewIndex + 1
  const start = i
  while (true) {
    const row = window.view[i++]
    indent = row.split('\x1F')[3]
    if (parentIndent >= indent) { break }
  }
  window.collapsed[index] = window.view.slice(start, i - 1)
  const arrayB = window.view.slice(i - 1, window.view.length)
  window.view = arrayA.concat(arrayB)
  window.updateRowCount(window.view.length)
}

function expand(parentRow, viewIndex) {
  const index = readRowIndex(parentRow)
  const arrayA = window.view.slice(0, viewIndex + 1)
  const arrayB = window.collapsed[index]
  const arrayC = window.view.slice(viewIndex + 1, window.view.length)
  window.collapsed[index] = undefined
  window.view = arrayA.concat(arrayB, arrayC)
  window.updateRowCount(window.view.length)
}

const Row = block(({ index, key, style }) => {
  const tabIndex = index + 1
  const row = window.view[index]
  const viewIndex = index
  let [ rowIndex, field, display, _indent ] = row.split('\x1F')
  let indent = +_indent
  index = parseInt(field) && field
  const openbracket = display === '[' && display
  const closebracket = display === ']' && display
  style.width = 'auto'
  const collapsible = Boolean(!isNaN(index) || field) && (!Boolean(display) || Boolean(openbracket))
  const collapseButton = collapsible ? (
    window.collapsed[rowIndex] ?
      <span className="collapse plus" aria-label="expand section" tabIndex={tabIndex} onClick={() => expand(row, viewIndex)}> <span>+</span> </span> :
      <span className="collapse minus" aria-label="collapse section" tabIndex={tabIndex} onClick={() => collapse(row, viewIndex)}> - </span>
  ) : null
  return (
    isNaN(indent) ? <div className="error" key={key} style={style}>{_indent}</div> :
    <div className="row" key={key} style={style}>
      &nbsp;
      {
        Array(indent).fill(0).map((_, i) => <span key={i} className="indent"></span>)
      }
      {
        !isNaN(index) ?
          <span className="index">
            <span tabIndex={tabIndex} aria-labelledby={`index-${index}`}> { index }</span>:&nbsp;
          </span> :
        field ?
          <div className="field">
            <span tabIndex={tabIndex} aria-labelledby={`field-${field}`}> { field }</span>:&nbsp;
          </div> :
        null
      }
      {
        openbracket ?
          <span className="openbracket"> { openbracket }</span> :
        closebracket ?
          <span className="closebracket"> { closebracket } </span> :
        <span className="display" tabIndex={display ? tabIndex : null}> { display } </span>
      }
      { collapseButton }
    </div>
  )
})

window.mountJSONViewer = elementId => {
  createRoot(document.getElementById(elementId))
    .render(<App />)
  
  window.addEventListener("keyup", event => {

  })
}