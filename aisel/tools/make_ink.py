#!/usr/bin/env python3
# The inkwell with its quill, cut from the reference scene (image 72) with a hand-fitted silhouette: src/img/ink.webp (RGBA)
from PIL import Image, ImageDraw, ImageFilter
import pathlib, sys
src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/images/72.webp')
out = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'img' / 'ink.webp'
a = Image.open(src).convert('RGB'); S = 2
c = a.crop((30, 500, 330, 780)).resize((300 * S, 280 * S), Image.LANCZOS)
jar = [(72,288),(100,278),(190,280),(216,292),(214,320),(238,350),(247,400),(243,450),(228,488),(190,510),(110,510),(62,490),(44,450),(38,400),(48,360),(72,325)]
fea = [(150,300),(147,245),(163,205),(198,150),(248,100),(310,52),(374,26),(374,60),(352,102),(318,142),(278,190),(238,236),(196,278),(158,304)]
m = Image.new('L', c.size, 0); d = ImageDraw.Draw(m)
for poly in (jar, fea): d.polygon([(x, y) for x, y in poly], fill=255)
m = m.filter(ImageFilter.GaussianBlur(2.2))
c = c.convert('RGBA'); c.putalpha(m)
bb = m.point(lambda v: 255 if v > 8 else 0).getbbox(); c = c.crop((max(0, bb[0] - 6), max(0, bb[1] - 6), bb[2] + 6, bb[3] + 6))
c.save(out, quality=90, method=6); print(out, c.size)
bg = Image.new('RGBA', (c.width + 40, c.height + 40), (30, 14, 12, 255)); bg.alpha_composite(c, (20, 20)); bg.convert('RGB').save('/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad/ink_check.png')
