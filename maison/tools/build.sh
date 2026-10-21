#!/bin/sh
# Gift-builder box layers: open tray (back / front) + lid, one camera, tuned for the builder stage (1400x1100).
cd "$(dirname "$0")"
C="w=1400&h=1100&cy=2.15&cz=4.7&ly=.5"
node render.mjs "[{\"out\":\"build-box-back.webp\",\"q\":\"job=hero&pass=trayback&$C\"},{\"out\":\"build-box-front.webp\",\"q\":\"job=hero&pass=trayfront&$C\"},{\"out\":\"build-box-lid.webp\",\"q\":\"job=hero&pass=boxlid&$C\"}]"
