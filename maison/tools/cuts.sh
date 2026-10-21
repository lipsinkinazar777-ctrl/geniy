#!/bin/sh
# Transparent product cut-outs for the gift builder (cropped + resized afterwards by cuts.py)
cd "$(dirname "$0")"
J=""
for i in mug metal magnet key photo pendant; do J="$J{\"out\":\"_cut-$i.png\",\"q\":\"job=card&item=$i&cut=1&w=1000&h=1250&cz=5.6\"},"; done
node render.mjs "[${J%,}]" && python3 cuts.py
