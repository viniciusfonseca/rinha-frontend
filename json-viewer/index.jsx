import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { List } from 'react-virtualized/dist/commonjs/List';
import { Fragment, useEffect, useReducer, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { block } from 'million/react';

const TRUNCATE_LIMIT = 599182

const App = () => {

  const [rowCount, setRowCount] = useState(window.rows?.length ?? 0)
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
              rowCount={truncate ? Math.min(599182, rowCount) : rowCount}
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

function collapse(index) {
  const parentIndent = window.rows[index].split('\x1F')[2]
  let i = index + 1
  const arrayA = window.rows.slice(0, index + 1)
  let indent
  while (true) {
    indent = window.rows[i].split('\x1F')[2]
    if (parentIndent <= indent) { break }
    window.collapsed[i] = window.rows[i++]
  }
  const arrayB = window.rows.slice(i, window.rows.length)
  window.rows = arrayA.concat(arrayB)
  window.updateRowCount(window.rows.length)
}

function expand(index) {
  const expanded = []
  let i
}

const Row = block(({ index, key, style }) => {
  const tabIndex = index + 1
  let [ field, display, _indent ] = window.rows[index].split('\x1F')
  let indent = +_indent
  index = parseInt(field) && field
  const openbracket = display === '[' && display
  const closebracket = display === ']' && display
  style.width = 'auto'
  const collapsible = Boolean(!isNaN(index) || field) && (!Boolean(display) || Boolean(openbracket))
  const collapseButton = collapsible ? (
    window.collapsed[index] ?
      <span className="collapse plus" tabIndex={tabIndex} onClick={expand}>... + </span> :
      <span className="collapse minus" tabIndex={tabIndex} onClick={collapse}> - </span>
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
            <span tabIndex={tabIndex}> { index }</span>:&nbsp;
          </span> :
        field ?
          <div className="field">
            <span tabIndex={tabIndex}> { field }</span>:&nbsp;
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
      {
        collapseButton &&
        <Fragment>
          &nbsp;{ collapseButton }
        </Fragment>
      }
    </div>
  )
})

window.mountJSONViewer = elementId => {
  createRoot(document.getElementById(elementId))
    .render(<App />)
}