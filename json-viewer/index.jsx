import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { List } from 'react-virtualized/dist/commonjs/List';
import { useEffect, useReducer, useState } from 'react';
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
              <button className="btn" style={{ marginBottom: '1em' }} type="button" onClick={() => { setTruncate(false) }}> Show entire JSON </button>
            </footer>
      }
    </div>
  )
}

const Row = block(({ index, key, style }) => {
  const tabIndex = index + 1
  let [ field, display, _indent ] = window.rows[index].split('\x1F')
  let indent = +_indent
  index = parseInt(field) && field
  field = field && (field + ':')
  const openbracket = display === '[' && display
  const closebracket = display === ']' && display
  style.width = 'auto'
  return (
    isNaN(indent) ? <div className="error" key={key} style={style}>{_indent}</div> :
    <div className="row" key={key} style={style}>
      &nbsp;
      {
        Array(indent).fill(0).map((_, i) => <span key={i} className="indent"></span>)
      }
      {
        !isNaN(index) ?
          <span className="index" tabIndex={tabIndex}> { index }:&nbsp;</span> :
        field ?
          <span className="field" tabIndex={tabIndex}> { field }&nbsp;</span> :
        null
      }
      {
        openbracket ?
          <span className="openbracket"> { openbracket }&nbsp;</span> :
        closebracket ?
          <span className="closebracket"> { closebracket } </span> :
        <span className="display" tabIndex={display ? tabIndex : null}> { display } </span>
      }
    </div>
  )
})

window.mountJSONViewer = elementId => {
  createRoot(document.getElementById(elementId))
    .render(<App />)
}