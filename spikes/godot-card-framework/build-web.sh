#!/bin/sh
set -eu
cd "$(dirname "$0")"
engine=${GODOT_BIN:-godot}
mkdir -p web
if [ -n "${GODOT_WEB_TEMPLATE:-}" ]; then
  temporary_preset=$(mktemp)
  cp export_presets.cfg "$temporary_preset"
  trap 'cp "$temporary_preset" export_presets.cfg; rm -f "$temporary_preset"' EXIT
  printf '\ncustom_template/release="%s"\n' "$GODOT_WEB_TEMPLATE" >> export_presets.cfg
fi
"$engine" --headless --path . --import
"$engine" --headless --path . --export-release Web web/index.html
mkdir -p ../../godot-preview
for file in web/index.html web/index.js web/index.pck web/index.wasm web/index.*.js web/index*.png; do
  if [ "$file" = web/index.wasm ]; then
    gzip -n -9 -c "$file" > "../../godot-preview/index.wasm.gz"
  else
    if [ "$file" = web/index.html ]; then
      perl -0777 -pe 's/\s*\z/\n/' "$file" > ../../godot-preview/index.html
    else
      cp "$file" ../../godot-preview/
    fi
  fi
done
