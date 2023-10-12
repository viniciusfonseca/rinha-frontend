use wasm_bindgen::prelude::*;
// use serde_json::Value;
use simd_json::{value::borrowed::Value, StaticNode};

#[wasm_bindgen]
extern "C" {
    fn recv(s: &[u8]);
}

#[wasm_bindgen]
pub fn parse(buf: &mut [u8]) -> Result<(), JsError> {
    let root = simd_json::to_borrowed_value(buf)?;
    let mut result = Vec::<String>::new();
    mount_rows(&mut result, &root, 0);
    if result.first().is_some() {
        recv(&result.join("\x1E").as_bytes())
    }
    Ok(())
}

fn mount_rows(result: &mut Vec<String>, node: &Value, indent: u16) {
    match node {
        Value::Array(array) => {
            for (i, element) in array.iter().enumerate() {
                push_row(result, &i.to_string(), &get_display(element), indent);
                match element {
                    Value::Array(_) => {
                        mount_rows(result, element, indent + 1);
                        push_row(result, "", "]", indent);
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
                push_row(result, key, &get_display(value), indent);
                match value {
                    Value::Array(_) => {
                        mount_rows(result, value, indent + 1);
                        push_row(result, "", "]", indent);
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
        Value::Static(node) => {
            match node {
                StaticNode::Null => "null".into(),
                StaticNode::I64(i) => i.to_string(),
                StaticNode::U64(u) => u.to_string(),
                StaticNode::F64(f) => f.to_string(),
                StaticNode::Bool(b) => b.to_string(),
            }
        },
        Value::String(s) => format!("\"{s}\"").to_string(),
        Value::Array(_) => "[".into(),
        Value::Object(_) => "".into(),
    }
}

fn push_row(result: &mut Vec<String>, key: &str, display: &str, indent: u16) {
    let row = format!("{}\x1F{}\x1F{}", key, display, indent);
    result.push(row);
    if result.len() == 1000 {
        recv(&result.join("\x1E").as_bytes());
        result.clear();
    }
}