#!/bin/sh
# Renders the hero layers from one camera so they stack pixel-for-pixel.
C="w=2560&h=1600&cy=1.62&cz=5.7&ly=.52"
cd "$(dirname "$0")"
node render.mjs "[{\"out\":\"hero-bg.jpg\",\"q\":\"job=hero&pass=bg&$C\"},{\"out\":\"hero-scene.jpg\",\"q\":\"job=hero&pass=full&$C\"},{\"out\":\"hero-mug.webp\",\"q\":\"job=hero&pass=mug&$C\"},{\"out\":\"hero-box.webp\",\"q\":\"job=hero&pass=boxclosed&$C\"},{\"out\":\"hero-box-base.webp\",\"q\":\"job=hero&pass=boxbase&$C\"},{\"out\":\"hero-box-lid.webp\",\"q\":\"job=hero&pass=boxlid&$C\"}]"
