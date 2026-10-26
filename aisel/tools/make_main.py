#!/usr/bin/env python3
# Desk plates for both orientations, written to src/img/main.webp (portrait 1080x1920), src/img/main-l.webp (landscape 2368x1320) and src/js/layout.js.
# Portrait keeps everything upright: the open book is scaled to fill the width, the objects that do not fit beside it are set on the wood around it.
import numpy as np, json
from PIL import Image, ImageDraw, ImageFilter
C = '/home/user/geniy/aisel/tools/_cache/'; OUT = '/home/user/geniy/aisel/src/'
clean = Image.open(C + 'clean_full.png').convert('RGB'); orig = Image.open(C + 'orig.png').convert('RGB')
rng = np.random.default_rng(9)
def gblur(x, s):
    s = max(s, .3); r = max(1, int(s * 3)); k = np.exp(-(np.arange(-r, r + 1) ** 2) / (2 * s * s)); k /= k.sum()
    for ax in (0, 1):
        pad = [(0, 0)] * x.ndim; pad[ax] = (r, r); p = np.pad(x, pad, mode='edge'); n = x.shape[ax]; o = np.zeros_like(x)
        for i, w in enumerate(k): o += w * np.take(p, np.arange(i, i + n), axis=ax)
        x = o
    return x
UL = 1.5787
U = lambda x, y: (x * 0.78933 + 48, y * 0.78933 + 30)                 # old 1500-unit hotspot art -> source px
HSU = {   # hotspot art in 1500-unit coordinates (the landscape desk)
 'potion': [[[258, 98], [300, 80], [372, 24], [458, 28], [476, 124], [452, 196], [372, 244], [270, 236]], [[984, 24], [1066, 24], [1070, 135], [986, 135]]],
 'quill': [[[1092, 78], [1195, 78], [1205, 170], [1100, 170]], [[1160, 0], [1285, 0], [1215, 95], [1160, 85]]],
 'scope': [[[1242, 62], [1335, 46], [1500, 160], [1500, 212], [1424, 192]]], 'stars': [[[1215, 168], [1500, 298], [1500, 474], [1312, 430], [1246, 336]]],
 'bag': [[[1072, 172], [1236, 238], [1324, 332], [1330, 522], [1292, 524], [1238, 396], [1108, 262]]],
 'book': [[[428, 238], [745, 202], [882, 146], [1034, 132], [1262, 436], [1290, 504], [1002, 608], [882, 596], [452, 676], [398, 642]]],
 'matches': [[[203, 396], [312, 338], [338, 372], [232, 440]]]}
PAGEU = [(486, 262), (716, 232), (836, 546), (496, 626)]
TASSEL = [(790, 470), (885, 470), (905, 612), (860, 645), (800, 600)]     # source px

# ---------- the stone ring + embers from the reference photo (the only fire art), upright, background turned to dark ground
RING_C = (800, 317); rx, ry = 66, 32; rb = (RING_C[0] - 82, RING_C[1] - 56, RING_C[0] + 82, RING_C[1] + 56)
crop = orig.crop(rb); rm = Image.new('L', crop.size, 0); ImageDraw.Draw(rm).ellipse([82 - rx, 56 - ry, 82 + rx, 56 + ry], fill=255); rm = rm.filter(ImageFilter.GaussianBlur(5))
arr = np.asarray(crop).astype(np.float32); lum = arr.mean(2, keepdims=True); dark = np.clip((170 - lum) / 110, 0, 1); ember = np.clip((arr[..., :1] - arr[..., 2:] - 70) / 90, 0, 1)
arr = arr * (.2 + .8 * np.maximum(dark * .55, ember)) * np.array([1, .9, .8])
ring = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert('RGBA'); ring.putalpha(rm)
def shadow_ellipse(size, box, a=170, blur=28):
    sh = Image.new('L', size, 0); ImageDraw.Draw(sh).ellipse(box, fill=a); return sh.filter(ImageFilter.GaussianBlur(blur))
def dark_under(img, sh): img.alpha_composite(Image.merge('RGBA', (Image.new('L', img.size, 0),) * 3 + (sh,)))
def patch(canvas, src, box, center, scale, feather=16):
    """an upright rectangle of the photo, feathered, laid on the plate centred at `center`"""
    c = src.crop(box).convert('RGBA'); m = Image.new('L', c.size, 0); ImageDraw.Draw(m).ellipse([feather * .5, feather * .5, c.width - feather * .5, c.height - feather * .5], fill=255); c.putalpha(m.filter(ImageFilter.GaussianBlur(feather)))
    c = c.resize((int(c.width * scale), int(c.height * scale)), Image.LANCZOS); lay = Image.new('RGBA', canvas.size, (0, 0, 0, 0)); lay.paste(c, (int(center[0] - c.width / 2), int(center[1] - c.height / 2)), c); canvas.alpha_composite(lay)
    return (lambda x, y: ((x - box[0]) * scale + center[0] - c.width / 2, (y - box[1]) * scale + center[1] - c.height / 2))

# ===================================================================== portrait 1080x1920
W, H = 1080, 1920
BX0, BX1 = 346, 1100; KB = W / (BX1 - BX0); OY = 330                   # the book band: source x 346..1100 filling the width, set 330px down
import sys; sys.path.insert(0, '/home/user/geniy/aisel/tools'); import make_scenes as MS
swm = np.asarray(orig.crop((930, 440, 1235, 625))).astype(np.float32).mean((0, 1))
ba = MS.wood(H, W, tuple(swm * 1.7), pl=210)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); ba = ba + rng.normal(0, 2.0, ba.shape); ba *= np.clip(1.1 - np.hypot((xx - 540) / 820, (yy - 1000) / 1350) ** 1.8, .12, 1)[..., None]
plate = Image.fromarray(np.clip(ba, 0, 255).astype(np.uint8)).convert('RGBA')
band = clean.crop((BX0, 0, BX1, 690)); bh = round(690 * KB); band = band.resize((W, bh), Image.LANCZOS).convert('RGBA')
fade = np.ones(bh, np.float32); fade[:90] = np.linspace(0, 1, 90) ** 1.4; fade[-110:] = np.linspace(1, 0, 110) ** 1.2; band.putalpha(Image.fromarray((np.tile(fade[:, None], (1, W)) * 255).astype(np.uint8)))
plate.alpha_composite(band, (0, OY))
B = lambda x, y: ((x - BX0) * KB, y * KB + OY)                          # source px -> plate px
def poly_src(poly): return [[round(v) for v in B(*p)] for p in poly]
def poly_u(poly): return poly_src([U(*p) for p in poly])
HS = {}
HS['book'] = [poly_u(HSU['book'][0]), poly_src(TASSEL)]; HS['bag'] = [poly_u(HSU['bag'][0])]; HS['quill'] = [poly_u(p) for p in HSU['quill']]
HS['potion'] = [poly_src([(334, 40), (432, 40), (432, 184), (334, 184)]), poly_src([(822, 44), (892, 44), (892, 136), (822, 136)])]
HS['scope'] = [poly_src([(1040, 40), (1100, 40), (1100, 200), (1040, 200)])]
PAGE = [[round(v) for v in B(*U(*p))] for p in PAGEU]
# the orange bottle, back at the top of the table as a second row; the star chart, matchbox and knob plate on the front wood
patch(plate, orig, (246, 84, 350, 226), (230, 170), 1.6, 18); HS['potion'].append([[110, 40], [350, 40], [350, 300], [110, 300]])
fs = patch(plate, orig, (1004, 160, 1240, 400), (830, 1470), 1.28, 16); HS['stars'] = [[[round(v) for v in fs(*U(*p))] for p in HSU['stars'][0]]]
fm = patch(plate, orig, (190, 280, 330, 396), (230, 1430), 1.55, 14); HS['matches'] = [[[round(v) for v in fm(*U(*p))] for p in HSU['matches'][0]]]
fk = patch(plate, orig, (140, 432, 296, 560), (470, 1470), 1.55, 14); kc = [round(v) for v in fk(216, 497)]; HS['knob'] = [[[kc[0] - 130, kc[1] - 120], [kc[0] + 130, kc[1] - 120], [kc[0] + 130, kc[1] + 120], [kc[0] - 130, kc[1] + 120]]]
FIRE = (300, 1700); dark_under(plate, shadow_ellipse(plate.size, [FIRE[0] - 210, FIRE[1] - 60, FIRE[0] + 220, FIRE[1] + 110], 190))
rg = ring.resize((int(ring.width * 3.0), int(ring.height * 3.0)), Image.LANCZOS); lay = Image.new('RGBA', plate.size, (0, 0, 0, 0)); lay.paste(rg, (FIRE[0] - rg.width // 2, FIRE[1] - rg.height // 2), rg); plate.alpha_composite(lay)
HS['fire'] = [[[FIRE[0] - 190, FIRE[1] - 140], [FIRE[0] + 190, FIRE[1] - 140], [FIRE[0] + 190, FIRE[1] + 110], [FIRE[0] - 190, FIRE[1] + 110]]]
CASK = {'x': 820, 'y': 1700, 'w': 300}; HS['casket'] = [[[CASK['x'] - 170, CASK['y'] - 150], [CASK['x'] + 170, CASK['y'] - 150], [CASK['x'] + 170, CASK['y'] + 130], [CASK['x'] - 170, CASK['y'] + 130]]]
plate.convert('RGB').save(OUT + 'img/main.webp', quality=88, method=6)
PORTRAIT = {'img': 'img/main.webp', 'w': W, 'h': H, 'hs': HS, 'fire': list(FIRE), 'page': PAGE, 'knob': kc, 'casket': CASK, 'home': [W / 2, H * .5]}

# ===================================================================== landscape 2368x1320: the original desk with the stones set on its free wood
RL = Image.open(OUT + 'img/room.webp').convert('RGBA'); FIRE_L = (1990, 1070)
rgl = ring.resize((int(ring.width * 2.8), int(ring.height * 2.8)), Image.LANCZOS)
dark_under(RL, shadow_ellipse(RL.size, [FIRE_L[0] - 280, FIRE_L[1] - 70, FIRE_L[0] + 290, FIRE_L[1] + 130], 170, 34))
ly = Image.new('RGBA', RL.size, (0, 0, 0, 0)); ly.paste(rgl, (FIRE_L[0] - rgl.width // 2, FIRE_L[1] - rgl.height // 2), rgl); RL.alpha_composite(ly)
RL.convert('RGB').save(OUT + 'img/main-l.webp', quality=88, method=6)
def UP(poly): return [[round(x * UL), round(y * UL)] for x, y in poly]
def box(cx, cy, hw, hh): return [[cx - hw, cy - hh], [cx + hw, cy - hh], [cx + hw, cy + hh], [cx - hw, cy + hh]]
HL = {k: [UP(p) for p in v] for k, v in HSU.items()}
HL['knob'] = [box(331, 931, 150, 150)]; HL['fire'] = [box(FIRE_L[0], FIRE_L[1] - 60, 250, 220)]; CASK_L = {'x': 1120, 'y': 1180, 'w': 330}; HL['casket'] = [box(CASK_L['x'], CASK_L['y'] - 30, 200, 120)]
LANDSCAPE = {'img': 'img/main-l.webp', 'w': 2368, 'h': 1320, 'hs': HL, 'fire': list(FIRE_L), 'page': UP(PAGEU), 'knob': [331, 931], 'casket': CASK_L, 'home': [1184, 660]}
open(OUT + 'js/layout.js', 'w').write('A.LAYOUTS = ' + json.dumps({'portrait': PORTRAIT, 'landscape': LANDSCAPE}) + ';\n')
plate.convert('RGB').resize((540, 960)).save('/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad/main_prev.png'); print('ok', FIRE, kc)
