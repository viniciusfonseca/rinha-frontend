#!/usr/bin/env bash

(cd rinha-json; wasm-pack build --target no-modules)
(cd json-viewer; npm i; npm run build)