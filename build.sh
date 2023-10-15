#!/usr/bin/env bash

(cd rinha-json; wasm-pack build --target no-modules)
(cd json-viewer; bun i; bun run build)

rm -rf dist
mkdir dist
cp ./{index.html,index.js,parser.js,spinner.gif} dist
mkdir -p dist/json-viewer/dist
cp json-viewer/dist/* dist/json-viewer/dist
mkdir -p dist/rinha-json/pkg
cp rinha-json/pkg/* dist/rinha-json/pkg