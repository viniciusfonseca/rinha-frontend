use serde::Serialize;
use wasm_bindgen::prelude::*;
use serde_json::Value;
// use qjsonrs::{
//     JsonStream,
//     JsonToken::{
//         StartObject,
//         EndObject,
//         StartArray,
//         EndArray,
//         JsKey,
//         JsNumber
//     },
//     JsonTokenIterator
// };


#[wasm_bindgen]
#[derive(Serialize)]
struct Row {
    key: String,
    display: String,
    indent: u16
}

#[wasm_bindgen]
extern "C" {
    fn recv(s: &[u8]);
}

#[wasm_bindgen]
pub fn parse(buf: &mut [u8]) -> Result<(), JsError> {
    let root = simd_json::serde::from_slice::<Value>(buf)?;
    let mut result = Vec::<Row>::new();
    mount_rows(&mut result, &root, 0);
    let mut chunk = Vec::new();
    let mut i = 0;
    for row in result {
        chunk.push(row);
        i = i + 1;
        if i == 1000 {
            i = 0;
            stream_chunk(&chunk);
            chunk.clear();
        }
    }
    if chunk.first().is_some() {
        stream_chunk(&chunk)
    }
    Ok(())
}

fn mount_rows(result: &mut Vec<Row>, node: &Value, indent: u16) {
    match node {
        Value::Array(array) => {
            for (i, element) in array.iter().enumerate() {
                result.push(Row {
                    key: i.to_string(),
                    display: get_display(element),
                    indent
                });
                match element {
                    Value::Array(_) => {
                        mount_rows(result, element, indent + 1);
                        result.push(Row {
                            key: "".into(),
                            display: "]".into(),
                            indent
                        })
                    },
                    Value::Object(_) => {
                        mount_rows(result, element, indent + 1);
                    },
                    _ => (),
                };
            }
        },
        Value::Object(object) => {
            for (key, value) in object.iter() {
                result.push(Row {
                    key: key.into(),
                    display: get_display(value),
                    indent
                });
                match value {
                    Value::Array(_) => {
                        mount_rows(result, value, indent + 1);
                        result.push(Row {
                            key: "".into(),
                            display: "]".into(),
                            indent
                        })
                    },
                    Value::Object(_) => {
                        mount_rows(result, value, indent + 1);
                    },
                    _ => (),
                };
            }
        },
        _ => (),
    };
}

fn get_display(value: &Value) -> String {
    match value {
        Value::Null => "null".into(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => n.to_string(),
        Value::String(s) => format!("\"{s}\"").to_string(),
        Value::Array(_) => "[".into(),
        Value::Object(_) => "".into(),
    }
}

fn stream_chunk(chunk: &Vec<Row>) {
    let chunk = chunk.iter()
        .map(|row| format!("{}\x1F{}\x1F{}", row.key, row.display, row.indent))
        .collect::<Vec<String>>()
        .join("\x1E");
    recv(chunk.as_bytes());
}