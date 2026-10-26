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
    im = img.crop((int(x0), int(y0), int(x1), int(y1))).resize(size, Image.LANCZOS).filter(ImageFilter.UnsharpMask(2.2, 90, 2))
    a = np.asarray(im).astype(np.float32); a += rng.normal(0, 2.6, a.shape); return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
def save(im, name, q=84): im.save(OUT + name, quality=q, method=6); print(name, im.size)

# ---- the entrance desk (image 43) stays exactly as delivered; only the baked flame is wiped so the live fire can replace it
a43 = Image.open(D + '43.webp').convert('RGB'); yy, xx = np.mgrid[0:a43.height, 0:a43.width]
l43 = np.asarray(a43).astype(np.float32); lum = l43.mean(2); reg = (xx > 985) & (xx < 1135) & (yy > 405) & (yy < 590)
r_, g_, b_ = l43[..., 0], l43[..., 1], l43[..., 2]
flame = ((lum > 135) & (r_ > b_ * 1.1)) | ((b_ > r_ * .95) & (b_ > 70) & (yy > 520)) | (g_ > 120)
mk = flame & reg
mk = np.asarray(Image.fromarray((mk * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))).astype(np.float32) / 255
h43 = wipe(a43, mk, sig=(2, 4, 8, 16)); 
soft = gblur(np.asarray(Image.fromarray((mk * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(25))).astype(np.float32) / 255, 10)[..., None]
h43 = Image.fromarray(np.clip(np.asarray(h43).astype(np.float32) * (1 - .5 * soft) * np.array([1, .88, .8]) + (1 - 1) * 0, 0, 255).astype(np.uint8))
hub = h43.resize((1920, 1079), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 70, 2)); save(hub, 'hub.webp', 88); hub.resize((960, 540)).save(SP + 'hub43.png')
# the photo's own flame, cut out as a sprite (RGBA) for the live shader to bend and flicker
fx0, fy0, fx1, fy1 = 960, 395, 1150, 590
spr_a = gblur(np.asarray(Image.fromarray((mk * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))).astype(np.float32)[fy0:fy1, fx0:fx1] / 255, 2.2)
spr_rgb = l43[fy0:fy1, fx0:fx1]; spr = np.dstack([np.clip(spr_rgb, 0, 255), np.clip(spr_a * 255, 0, 255)]).astype(np.uint8)
sp_im = Image.fromarray(spr, 'RGBA').resize((int((fx1 - fx0) * 1.5), int((fy1 - fy0) * 1.5)), Image.LANCZOS); import io; bf = io.BytesIO(); sp_im.save(bf, 'PNG', optimize=True); FLAME_URI = 'data:image/png;base64,' + __import__('base64').b64encode(bf.getvalue()).decode(); FLAME_RECT = [round(fx0 * 1.5), round(fy0 * 1.5), sp_im.width, sp_im.height]; print('flame', FLAME_RECT, len(FLAME_URI) // 1024, 'KB')
# portrait plate: the same desk, set in the middle of a taller frame whose top and bottom melt into the dark of the room
Y0, TH = 910, 2900; ha = np.asarray(hub).astype(np.float32); out = np.zeros((TH, 1920, 3), np.float32); out[Y0:Y0 + 1079] = ha
EB = TH - Y0 - 1079; mt = gblur(ha[:Y0].copy(), 34); mb = gblur(ha[::-1][:EB].copy(), 34)
for i in range(Y0): out[Y0 - 1 - i] = mt[min(i, len(mt) - 1)] * (max(0, 1 - i / Y0) ** 2.6)
for i in range(EB): out[Y0 + 1079 + i] = mb[min(i, len(mb) - 1)] * (max(0, 1 - i / EB) ** 2.6)
save(Image.fromarray(np.clip(out + rng.normal(0, 2, out.shape), 0, 255).astype(np.uint8)), 'hub-pt.webp', 84)
# ---- plates for the rooms
save(fit(a37, (0, 0, 358, 603), (1080, 1920)), 'lab-p.webp'); save(fit(a37, (0, 648, 358, 1250), (1080, 1920)), 'cit-p.webp'); save(fit(a39, (0, 0, 896, 1195), (1080, 1920)), 'lib-p.webp')
save(fit(a38, (855, 328, 1280, 610), (1920, 1080)), 'lab-l.webp'); save(fit(a38, (0, 0, 425, 325), (1920, 1080)), 'cit-l.webp'); save(fit(a39, (0, 560, 896, 1064), (1920, 1080)), 'lib-l.webp')
import json
R = lambda x0, y0, x1, y1: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
Z = 1.5
def O(*b): return R(*[round(v * Z) for v in b])
HUB = {'fire': [O(950, 400, 1180, 640), O(80, 440, 240, 570)], 'read': [O(790, 490, 910, 670)], 'quotes': [O(925, 0, 1015, 140)], 'lab': [O(190, 20, 370, 200)], 'sky': [O(1040, 150, 1280, 420)], 'path': [O(1060, 0, 1280, 140)], 'bag': [O(140, 290, 270, 395)], 'lib': [O(310, 110, 1080, 650)]}
# lab hotspots: six mood bottles + the cauldron mouth (panel coords -> plate px)
LAB_P = {'pour': [850, 520], 'cauldron': R(600, 380, 1080, 760), 'bottles': {'romance': [97, 1051], 'fantasy': [479, 1178], 'adventure': [144, 1560], 'melancholy': [924, 1560], 'cozy': [59, 366], 'detective': [304, 382]}}
LAB_L = {'pour': [1110, 570], 'cauldron': R(880, 430, 1360, 900), 'bottles': {'romance': [110, 170], 'fantasy': [330, 150], 'adventure': [550, 150], 'cozy': [180, 500], 'detective': [500, 490], 'melancholy': [1500, 800]}}
CIT_P = {'slot': [608, 1180], 'card': [540, 820, 760]}; CIT_L = {'slot': [1080, 480], 'card': [960, 470, 460]}
def shift(hs, dy): return {k: [[[x, y + dy] for x, y in poly] for poly in v] for k, v in hs.items()}
LAY = {'portrait': {'img': 'img/hub-pt.webp', 'w': 1920, 'h': 2900, 'hs': shift(HUB, 910), 'fire': [1583, 870 + 910], 'fireScale': .85, 'fitW': 1120, 'home': [1180, 1450], 'lab': LAB_P, 'cit': CIT_P, 'room': [1080, 1920], 'rooms': {'lab': 'img/lab-p.webp', 'lib': 'img/lib-p.webp', 'cit': 'img/cit-p.webp'}, 'flame': [FLAME_RECT[0], FLAME_RECT[1] + 910, FLAME_RECT[2], FLAME_RECT[3]], 'flameUri': FLAME_URI, 'libRows': [[1630, 30, 1020, 270]], 'libTitle': 150, 'libAdd': [930, 200], 'libHs': {'lab': [R(280, 240, 450, 540), R(0, 960, 130, 1130), R(720, 280, 840, 480)], 'quotes': [R(430, 440, 690, 1090)]}},
       'landscape': {'img': 'img/hub.webp', 'w': 1920, 'h': 1079, 'hs': HUB, 'fire': [1583, 870], 'fireScale': .85, 'home': [960, 540], 'lab': LAB_L, 'cit': CIT_L, 'room': [1920, 1080], 'rooms': {'lab': 'img/lab-l.webp', 'lib': 'img/lib-l.webp', 'cit': 'img/cit-l.webp'}, 'flame': FLAME_RECT, 'flameUri': FLAME_URI, 'libRows': [[860, 120, 1560, 200]], 'libTitle': 90, 'libAdd': [1790, 140], 'libHs': {'lab': [R(40, 86, 390, 450)], 'quotes': [R(800, 0, 1170, 330)]}}}
open('/home/user/geniy/aisel/src/js/layout.js', 'w').write('A.LAYOUTS = ' + json.dumps(LAY) + ';\n')
