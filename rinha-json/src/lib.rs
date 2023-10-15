use wasm_bindgen::prelude::*;
use qjsonrs::{
    sync::{Stream, TokenIterator},
    JsonToken::{
        StartObject,
        EndObject,
        StartArray,
        EndArray,
        JsKey,
        JsNumber,
        JsNull,
        JsString,
        JsBoolean
    },
};

#[wasm_bindgen]
extern "C" {
    fn recv(s: &[u8]);
}

#[wasm_bindgen]
pub fn parse(buf: &[u8]) {

    let mut stream = Stream::from_read(buf).expect("error building json stream");
    let mut result = Vec::<String>::new();
    let mut key = "".to_string();
    let mut display: String;
    let mut indent: usize = 0;
    let mut indentstack = Vec::<u16>::new();
    indentstack.push(0);

    while let Some(token) = stream.next().expect("error getting stream token") {
        match token {
            JsKey(key_) => {
                key = key_.into();
            },
            JsString(x) => {
                let val: String = x.into();
                display = format!("\"{}\"", val);
                push_row(&mut result, &key, &display, indent);
                indentstack[indent] = indentstack[indent] + 1;
                key = indentstack[indent].to_string();
            },
            JsNumber(x) => {
                display = x.into();
                push_row(&mut result, &key, &display, indent);
                indentstack[indent] = indentstack[indent] + 1;
                key = indentstack[indent].to_string();
            },
            JsBoolean(x) => {
                display = x.to_string();
                push_row(&mut result, &key, &display, indent);
                indentstack[indent] = indentstack[indent] + 1;
                key = indentstack[indent].to_string();
            },
            JsNull => {
                display = "null".into();
                push_row(&mut result, &key, &display, indent);
                indentstack[indent] = indentstack[indent] + 1;
                key = indentstack[indent].to_string();
            },
            StartObject => {
                display = "".into();
                if indent > 0 {
                    push_row(&mut result, &key, &display, indent);
                    indent = indent + 1;
                    indentstack.push(0);
                }
            },
            EndObject => {
                indent = indent - 1;
                indentstack.pop();
                if indentstack.get(indent).is_some() {
                    indentstack[indent] = indentstack[indent] + 1;
                    key = indentstack[indent].to_string();
                }
            },
            StartArray => {
                display = "[".into();
                push_row(&mut result, &key, &display, indent);
                indent = indent + 1;
                key = "0".into();
                indentstack.push(0);
            },
            EndArray => {
                key = "".into();
                display = "]".into();
                indent = indent - 1;
                push_row(&mut result, &key, &display, indent);
                indentstack.pop();
                key = indentstack[indent].to_string();
            },
        };
    }
    if result.first().is_some() {
        recv(&result.join("\x1E").as_bytes());
    }
}

fn push_row(result: &mut Vec<String>, key: &str, display: &str, indent: usize) {
    let row = format!("{}\x1F{}\x1F{}", key, display, indent);
    result.push(row);
    if result.len() == 100000 {
        recv(&result.join("\x1E").as_bytes());
        result.clear();
    }
}