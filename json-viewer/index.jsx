import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { List } from 'react-virtualized/dist/commonjs/List';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {

  const [rowCount, setRowCount] = useState(window.rows?.length ?? 0)
  const [streamingStatus, setStreamingStatus] = useState(true)

  useEffect(() => {
    window.updateRowCount = setRowCount
    window.updateStreamingStatus = setStreamingStatus
  }, [rowCount, streamingStatus])

  return (
    <div className="wrapper">
      <header>
        <h1> { window.filename } </h1>
        {
          streamingStatus &&
          <p id="status"> Streaming JSON into view... </p>
        }
      </header>
      <div className="list">
        <AutoSizer>
        {
          ({ width, height }) =>
            <List
              width={width}
              height={height}
              overscanRowCount={10}
              rowCount={rowCount}
              rowHeight={28}
              rowRenderer={rowRenderer}
            />
        }
        </AutoSizer>
      </div>
    </div>
  )
}

function rowRenderer({ index, key, style }) {
  let [ field, display, indent ] = window.rows[index].split('\x1F')
  index = parseInt(field) && field
  field = field && (field + ':')
  indent = +indent
  const openbracket = display === '[' && display
  const closebracket = display === ']' && display
  return (
    <div className="row" key={key} style={style}>
      &nbsp;
      {
        Array(indent).fill(0).map((_, i) => <span key={i} className="indent"></span>)
      }
      {
        !isNaN(index) ?
          <span className="index"> { index }:&nbsp;</span> :
        field ?
          <span className="field"> { field }&nbsp;</span> :
        null
      }
      {
        openbracket ?
          <span className="openbracket"> { openbracket } </span> :
        closebracket ?
          <span className="closebracket"> { closebracket } </span> :
        <span className="display"> { display } </span>
      }
    </div>
  )
}

window.mountJSONViewer = elementId => {
  createRoot(document.getElementById(elementId))
    .render(<App />)
}