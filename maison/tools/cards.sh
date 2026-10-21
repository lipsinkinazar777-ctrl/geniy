#!/bin/sh
cd "$(dirname "$0")"
J=""
for i in mug metal magnet key coffret photo; do J="$J{\"out\":\"card-$i.webp\",\"q\":\"job=card&item=$i&w=1000&h=1250\"},"; done
node render.mjs "[${J%,}]"
