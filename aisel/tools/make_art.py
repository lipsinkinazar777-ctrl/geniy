#!/usr/bin/env python3
# Room plates from the user's reference art (images 37, 38, 39): crop to 9:16 / 16:9, upscale, sharpen, grain.
# The baked-in flames are wiped from the hub plates (the real fire is drawn live on top).
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
D = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/images/'; OUT = '/home/user/geniy/aisel/src/img/'; SP = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad/'
rng = np.random.default_rng(4)
a37 = Image.open(D + '37.webp').convert('RGB'); a38 = Image.open(D + '38.webp').convert('RGB'); a39 = Image.open(D + '39.webp').convert('RGB')
def gblur(x, s):
    s = max(s, .3); r = max(1, int(s * 3)); k = np.exp(-(np.arange(-r, r + 1) ** 2) / (2 * s * s)); k /= k.sum()
    for ax in (0, 1):
        pad = [(0, 0)] * x.ndim; pad[ax] = (r, r); p = np.pad(x, pad, mode='edge'); n = x.shape[ax]; o = np.zeros_like(x)
        for i, w in enumerate(k): o += w * np.take(p, np.arange(i, i + n), axis=ax)
        x = o
    return x
def wipe(img, mask, sig=(4, 9, 18, 36)):
    a = np.asarray(img).astype(np.float32); m = np.clip(gblur(mask.astype(np.float32), 2.0), 0, 1)[..., None]; keep = 1 - (mask[..., None] > 0).astype(np.float32); out = a.copy()
    for s in sig:
        den = gblur(keep, s); est = gblur(out * keep, s) / np.maximum(den, 1e-3); ok = den > .015
        hole = (keep < .5); out = np.where(hole & ok, est, out); keep = np.where(hole & ok, 1.0, keep)
    return Image.fromarray(np.clip(a * (1 - m) + out * m, 0, 255).astype(np.uint8))
def fit(img, box, size, shift=(0, 0)):             # cover-crop `box` of img to the aspect of size, then resize with a little sharpening and grain
    x0, y0, x1, y1 = box; bw, bh = x1 - x0, y1 - y0; W, H = size; ar = W / H
    if bw / bh > ar: nw = bh * ar; x0 += (bw - nw) / 2 + shift[0]; x1 = x0 + nw
    else: nh = bw / ar; y0 += (bh - nh) / 2 + shift[1]; y1 = y0 + nh
    im = img.crop((int(x0), int(y0), int(x1), int(y1))).resize(size, Image.BICUBIC).filter(ImageFilter.UnsharpMask(1.2, 35, 3))
    a = np.asarray(im).astype(np.float32); a += rng.normal(0, 1.2, a.shape); return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
def save(im, name, q=84): im.save(OUT + name, quality=q, method=6); print(name, im.size)

# ---- the entrance desk (image 43) stays as delivered; the baked flame is replaced by dark charred logs and ember beds, the live fire is drawn over them
a43 = Image.open(D + '43.webp').convert('RGB'); l43 = np.asarray(a43).astype(np.float32); lum = l43.mean(2)
FP = [(150,420),(130,320),(150,250),(200,200),(260,130),(330,60),(380,70),(390,120),(400,200),(430,300),(420,370),(330,430),(200,440)]
yy_, xx_ = np.mgrid[0:a43.height, 0:a43.width]
poly_m = Image.new('L', a43.size, 0); ImageDraw.Draw(poly_m).polygon([(920 + x / 2, 380 + y / 2) for x, y in FP], fill=255); poly_m = np.asarray(poly_m) > 0
r_, g_, b_ = l43[..., 0], l43[..., 1], l43[..., 2]
fl = (((lum > 125) | ((b_ > r_ * .8) & (lum > 55)) | ((r_ > 190) & (g_ > 110))) & poly_m)
fl = np.asarray(Image.fromarray((fl * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))).astype(np.float32) / 255 * poly_m
h43 = wipe(a43, fl, sig=(3, 6, 12, 24, 48)); arr_ = np.asarray(h43).astype(np.float32)
wv = np.clip((yy_ - 470) / 90.0, 0, 1)                                    # 0 over the table behind, 1 deep in the hearth
tone = (.9 - .18 * wv)[..., None] * np.array([1, .92, .86])
mu = gblur(fl, 3.5)[..., None]; arr_ = arr_ * (1 - mu) + arr_ * tone * mu
h43 = Image.fromarray(np.clip(arr_, 0, 255).astype(np.uint8))
hub = h43.resize((1920, 1079), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2, 40, 3))
BASE = (1592, 872); hubA = hub.convert('RGBA'); em = Image.new('RGBA', hub.size, (0, 0, 0, 0)); ed = ImageDraw.Draw(em)
for _ in range(16): x = BASE[0] + int(rng.normal(0, 46)); y = BASE[1] + int(rng.normal(0, 10)) + 6; r = int(rng.integers(3, 7)); ed.ellipse([x - r, y - r * .6, x + r, y + r * .6], fill=(255, int(rng.integers(50, 120)), 16, int(rng.integers(120, 220))))
em = em.filter(ImageFilter.GaussianBlur(2.0)); hubA.alpha_composite(em); hub = hubA.convert('RGB')
save(hub, 'hub.webp', 90); hub.resize((960, 540)).save(SP + 'hub43.png')
fx0, fy0, fx1, fy1 = 960, 395, 1150, 590
spr_a = gblur(fl[fy0:fy1, fx0:fx1], 2.2); spr = np.dstack([l43[fy0:fy1, fx0:fx1], np.clip(spr_a * 255 * 1.25, 0, 255)]).astype(np.uint8)
sp_im = Image.fromarray(spr, 'RGBA').resize((int((fx1 - fx0) * 1.5), int((fy1 - fy0) * 1.5)), Image.LANCZOS); import io, base64; bf = io.BytesIO(); sp_im.save(bf, 'PNG', optimize=True)
FLAME_URI = 'data:image/png;base64,' + base64.b64encode(bf.getvalue()).decode(); FLAME_RECT = [round(fx0 * 1.5), round(fy0 * 1.5), sp_im.width, sp_im.height]
# ---- plates for the rooms
save(fit(a37, (0, 0, 358, 603), (1080, 1920)), 'lab-p.webp'); save(fit(a37, (0, 648, 358, 1250), (1080, 1920)), 'cit-p.webp'); save(fit(a39, (0, 0, 896, 1195), (1080, 1920)), 'lib-p.webp')
save(fit(a38, (855, 328, 1280, 610), (1920, 1080)), 'lab-l.webp'); save(fit(a38, (0, 0, 425, 325), (1920, 1080)), 'cit-l.webp'); save(fit(a39, (0, 650, 896, 1154), (1920, 1080)), 'lib-l.webp')
import json
R = lambda x0, y0, x1, y1: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
Z = 1.5
def O(*b): return R(*[round(v * Z) for v in b])
HUB = {'enter': [O(790,495,915,672)], 'fire': [O(950,400,1180,640), O(80,440,240,570)], 'read': [O(315,120,950,640)], 'quotes': [O(925,0,1015,140)], 'lab': [O(190,20,370,200)], 'sky': [O(1100,150,1280,420)], 'path': [O(1060,0,1100,140)], 'bag': [O(140,290,270,395)], 'lib': [O(950,150,1095,430)]}
# lab hotspots: six mood bottles + the cauldron mouth (panel coords -> plate px)
LAB_P = {'rx': 220, 'ry': 44, 'pour': [925, 480], 'cauldron': R(700, 380, 1080, 700), 'bottles': {'romance': [97, 1051], 'fantasy': [479, 1178], 'adventure': [144, 1560], 'melancholy': [924, 1560], 'cozy': [59, 366], 'detective': [304, 382]}}
LAB_L = {'rx': 194, 'ry': 36, 'pour': [1129, 544], 'cauldron': R(940, 480, 1330, 820), 'bottles': {'romance': [110, 170], 'fantasy': [330, 150], 'adventure': [550, 150], 'cozy': [180, 500], 'detective': [500, 490], 'melancholy': [1500, 800]}}
CIT_P = {'slot': [608, 1180], 'card': [540, 820, 760]}; CIT_L = {'slot': [1080, 480], 'card': [960, 470, 460]}
def shift(hs, dy): return {k: [[[x, y + dy] for x, y in poly] for poly in v] for k, v in hs.items()}
LAY = {'portrait': {'img': 'img/hub.webp', 'w': 1920, 'h': 1079, 'hs': HUB, 'fire': [1592, 872], 'fireScale': 1, 'flameUri': FLAME_URI, 'home': [1450, 540], 'lab': LAB_P, 'cit': CIT_P, 'room': [1080, 1920], 'rooms': {'lab': 'img/lab-p.webp', 'lib': 'img/lib-p.webp', 'cit': 'img/cit-p.webp'}, 'flame': FLAME_RECT, 'libRows': [[1660, 40, 1000, 230]], 'libTitle': 150, 'libAdd': [950, 400], 'libHs': {'lab': [R(280, 240, 450, 540), R(0, 960, 130, 1130), R(720, 280, 840, 480)], 'quotes': [R(430, 440, 690, 1090)]}},
       'landscape': {'img': 'img/hub.webp', 'w': 1920, 'h': 1079, 'hs': HUB, 'fire': [1592, 872], 'fireScale': 1, 'flameUri': FLAME_URI, 'home': [960, 540], 'lab': LAB_L, 'cit': CIT_L, 'room': [1920, 1080], 'rooms': {'lab': 'img/lab-l.webp', 'lib': 'img/lib-l.webp', 'cit': 'img/cit-l.webp'}, 'flame': FLAME_RECT, 'libRows': [[745, 120, 1680, 210]], 'libTitle': 90, 'libAdd': [1800, 760], 'libHs': {'lab': [R(40, 86, 390, 450)], 'quotes': [R(800, 0, 1170, 330)]}}}
open('/home/user/geniy/aisel/src/js/layout.js', 'w').write('A.LAYOUTS = ' + json.dumps(LAY) + ';\n')
