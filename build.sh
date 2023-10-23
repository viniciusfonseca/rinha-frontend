#!/usr/bin/env bash

(cd json-viewer; bun i; bun run build)
(cd worker; bun i; bun run build)

rm -rf dist
mkdir dist
cp ./{index.html,index.js,spinner.gif} dist
mkdir -p dist/json-viewer/dist
cp json-viewer/dist/* dist/json-viewer/dist
mkdir -p dist/worker
cp worker/index.min.js dist/worker/index.min.js