import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { List } from 'react-virtualized/dist/commonjs/List';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { block } from 'million/react';

const App = () => {

  const [rowCount, setRowCount] = useState(window.rows?.length ?? 0)
  const [streamingStatus, setStreamingStatus] = useState(true)

  useEffect(() => {
    window.updateRowCount = setRowCount
    window.updateStreamingStatus = setStreamingStatus
  }, [rowCount, streamingStatus])

  return (
    <div className="wrapper">
      <header>
        <h1 id="filename" tabIndex={1}> { window.filename } </h1>
        {
          <p id="status" style={{ display: streamingStatus ? 'block' : 'hidden' }}> Streaming JSON into view... </p>
        }
      </header>
      <div className="list">
        <AutoSizer>
        {
          ({ width, height }) =>
            <List
              tabIndex={1}
              width={width}
              height={height}
              overscanRowCount={10}
              rowCount={rowCount}
              rowHeight={28}
              rowRenderer={Row}
            />
        }
        </AutoSizer>
      </div>
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
          <span className="openbracket"> { openbracket } </span> :
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