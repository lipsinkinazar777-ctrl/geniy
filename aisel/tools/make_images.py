#!/usr/bin/env python3
"""Prepares the photographic backgrounds from the reference photos supplied by the client (originals live outside the repo)
and composites the finale: a castle silhouette on the far ridge and the princess seated by the campfire."""
import math, random, pathlib
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageEnhance
SRC = pathlib.Path('/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/images')
OUT = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'img'; OUT.mkdir(parents=True, exist_ok=True)
def load(n): return Image.open(SRC / f'{n}.webp').convert('RGB')
def save(im, name, q=74, maxside=None):
    if maxside and max(im.size) > maxside:
        k = maxside / max(im.size); im = im.resize((round(im.width*k), round(im.height*k)), Image.LANCZOS)
    im.save(OUT / name, 'WEBP', quality=q, method=6); print(name, im.size, (OUT/name).stat().st_size//1024, 'KB')
def cover(im, w, h, fx=.5, fy=.5):
    k = max(w/im.width, h/im.height); im = im.resize((round(im.width*k), round(im.height*k)), Image.LANCZOS)
    x = round((im.width-w)*fx); y = round((im.height-h)*fy); return im.crop((x, y, x+w, y+h))

# ---- full backgrounds (portrait friendly)
save(cover(load(28), 900, 1400, .47, .5), 'bg-oak.webp', 72)
save(load(18), 'bg-pines.webp', 70)
save(load(23), 'bg-library.webp', 72)
save(load(21), 'bg-lantern.webp', 70)
_m = cover(load(20), 852, 1100, .5, .6).convert('RGB')
# the source carries a third-party handle in the fog: cover it with feathered fog taken from just above
_src = _m.crop((580, 176, 760, 224)); _mask = Image.new('L', (180, 48), 0); ImageDraw.Draw(_mask).rectangle([10, 8, 170, 40], fill=255)
_m.paste(_src.filter(ImageFilter.GaussianBlur(3)), (580, 228), _mask.filter(ImageFilter.GaussianBlur(5)))
save(_m, 'bg-moon.webp', 70)

# ---- location portraits (4:5)
locs = {0: (30, .5, .75), 1: (29, .5, .62), 2: (28, .5, .52), 3: (18, .5, .45), 4: (20, .5, .62), 5: (21, .62, .6), 6: (23, .5, .5)}
for i, (n, fx, fy) in locs.items(): save(cover(load(n), 520, 650, fx, fy), f'loc-{i}.webp', 70)

# ---- finale: castle + princess on the dusk campfire photo
S = 3                                    # supersampling for clean silhouettes
base = load(27); base = base.resize((1104, 1962), Image.LANCZOS)       # x1.5
W, H = base.size; K = 1.5

def bez(p0, p1, p2, p3, n=24):
    return [((1-t)**3*p0[0]+3*(1-t)**2*t*p1[0]+3*(1-t)*t*t*p2[0]+t**3*p3[0], (1-t)**3*p0[1]+3*(1-t)**2*t*p1[1]+3*(1-t)*t*t*p2[1]+t**3*p3[1]) for t in [i/n for i in range(n+1)]]
def path(cmds):
    pts = []; cur = None
    for c in cmds:
        if c[0] == 'M': cur = c[1]; pts.append(cur)
        elif c[0] == 'L': cur = c[1]; pts.append(cur)
        elif c[0] == 'C': pts += bez(cur, c[1], c[2], c[3])[1:]; cur = c[3]
    return pts

def castle_mask(w, h, ox, oy, sc):
    """returns (mask, windows) of a castle silhouette, origin = bottom centre"""
    m = Image.new('L', (w*S, h*S), 0); d = ImageDraw.Draw(m); win = []
    def P(x, y): return ((ox + x*sc)*S, (oy + y*sc)*S)
    def poly(pts): d.polygon([P(*p) for p in pts], fill=255)
    def rect(x0, y0, x1, y1): poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)])
    def tower(cx, wd, top, roofh, base=0):
        rect(cx-wd/2, top, cx+wd/2, base)
        poly([(cx-wd/2-3, top), (cx, top-roofh), (cx+wd/2+3, top)])
        # little crenel ring
        rect(cx-wd/2-3, top, cx+wd/2+3, top+4)
    rect(-95, -70, 95, 6)                                   # curtain wall / keep base
    for i in range(-95, 95, 14): rect(i, -78, i+8, -70)    # crenellations
    rect(-40, -125, 40, -60)                                 # main keep
    for i in range(-40, 40, 12): rect(i, -133, i+7, -125)
    tower(-78, 26, -150, 52); tower(78, 26, -138, 48); tower(0, 30, -190, 70); tower(-30, 18, -150, 34); tower(34, 18, -146, 32)
    rect(-14, -40, 14, 6)                                    # gate (dark anyway)
    for (x, y, s) in [(-78, -118, 1), (78, -108, 1), (0, -158, 1.1), (-18, -96, .9), (20, -92, .9), (-30, -122, .8), (36, -118, .8)]: win.append(P(x, y) + (s,))
    return m.resize((w, h), Image.LANCZOS), [(x/S, y/S, s) for x, y, s in win]

def princess_mask(w, h, ox, oy, sc):
    m = Image.new('L', (w*S, h*S), 0); d = ImageDraw.Draw(m)
    def P(x, y): return ((ox + x*sc)*S, (oy + y*sc)*S)
    def poly(cmds): d.polygon([P(*p) for p in path(cmds)], fill=255)
    poly([('M', (-26, -96)), ('C', (-70, -70), (-108, -30), (-104, 0)), ('L', (106, 0)), ('C', (102, -26), (72, -50), (46, -70)), ('C', (42, -84), (30, -96), (22, -104))])   # gown
    poly([('M', (-26, -96)), ('C', (-32, -130), (-26, -152), (-10, -168)), ('L', (14, -168)), ('C', (26, -150), (30, -120), (22, -104))])                                         # bodice
    poly([('M', (-6, -176)), ('L', (7, -176)), ('L', (7, -160)), ('L', (-6, -160))])                                                                                             # neck
    ex, ey = P(3, -190); rx, ry = 16*sc*S, 19*sc*S; d.ellipse([ex-rx, ey-ry, ex+rx, ey+ry], fill=255)                                                                           # head
    poly([('M', (-12, -204)), ('L', (-9, -218)), ('L', (-4, -209)), ('L', (3, -224)), ('L', (9, -209)), ('L', (14, -218)), ('L', (17, -204))])                                      # crown
    poly([('M', (-14, -200)), ('C', (-40, -196), (-52, -150), (-42, -96)), ('C', (-40, -64), (-34, -48), (-24, -40)), ('C', (-22, -80), (-18, -140), (-6, -178))])                  # hair
    poly([('M', (2, -164)), ('C', (16, -150), (30, -124), (40, -108)), ('L', (47, -114)), ('C', (36, -134), (22, -158), (10, -172))])                                            # arm
    poly([('M', (30, -112)), ('L', (62, -120)), ('L', (66, -100)), ('L', (34, -92))])                                                                                           # book
    return m.resize((w, h), Image.LANCZOS)

def glow(layer_size, pts, color, rad, alpha):
    g = Image.new('RGBA', layer_size, (0, 0, 0, 0)); dr = ImageDraw.Draw(g)
    for x, y, s in pts: r = 10*s*K; dr.ellipse([x-r, y-r, x+r, y+r], fill=color + (alpha,))
    return g.filter(ImageFilter.GaussianBlur(rad))


import numpy as np
orig = np.asarray(base).astype(np.float32)
lum = orig.mean(axis=2)
# ridge line: first row (from the top) where a column turns clearly darker than the sky above it
ridge = np.zeros(W, dtype=np.float32)
for x in range(W):
    col = lum[120:760, x]; sky = col[:40].mean() if col[:40].size else col.mean()
    below = np.where(col < sky*0.62)[0]; ridge[x] = 120 + (below[0] if below.size else 640)
def smooth(a, k):  # numpy-only moving median + box blur
    pad = np.pad(a, k//2, mode='edge'); med = np.array([np.median(pad[i:i+k]) for i in range(len(a))], dtype=np.float32)
    ker = np.ones(13, dtype=np.float32)/13; return np.convolve(np.pad(med, 6, mode='edge'), ker, mode='valid')[:len(a)]
ridge = smooth(ridge, 25)

img = base.convert('RGBA')
# soft moon
moon = Image.new('RGBA', (W, H), (0, 0, 0, 0)); md = ImageDraw.Draw(moon); mx, my = 760, 210
for r, a_ in [(260, 7), (170, 12), (100, 20), (58, 34)]: md.ellipse([mx-r, my-r, mx+r, my+r], fill=(170, 195, 245, a_))
img = Image.alpha_composite(img, moon.filter(ImageFilter.GaussianBlur(46)))
md2 = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(md2).ellipse([mx-24, my-24, mx+24, my+24], fill=(226, 236, 255, 205)); img = Image.alpha_composite(img, md2.filter(ImageFilter.GaussianBlur(2.2)))

# ---- castle: slender fairy-tale silhouette seated on the left ridge, base lost in the mountain + mist
def castle(ox, oy, sc):
    m = Image.new('L', (W*S, H*S), 0); d = ImageDraw.Draw(m); wins = []
    P = lambda x, y: ((ox + x*sc)*S, (oy + y*sc)*S)
    poly = lambda pts: d.polygon([P(*q) for q in pts], fill=255)
    rect = lambda x0, y0, x1, y1: poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)])
    def tower(cx, wd, top, roof, base=10):
        rect(cx-wd/2, top, cx+wd/2, base); rect(cx-wd/2-2.5, top-3, cx+wd/2+2.5, top+3); poly([(cx-wd/2-3, top-3), (cx, top-roof), (cx+wd/2+3, top-3)])
    rect(-120, -34, 120, 14)                                                                    # lower curtain wall
    for i in range(-120, 120, 12): rect(i, -41, i+6, -34)
    rect(-58, -96, 52, -30)                                                                      # great hall
    for i in range(-58, 52, 11): rect(i, -103, i+6, -96)
    tower(-92, 20, -112, 46); tower(96, 20, -104, 40); tower(-52, 18, -132, 64); tower(10, 26, -166, 92); tower(60, 16, -122, 44)
    rect(-130, 6, 130, 70)                                                                      # foot, hidden by the ridge
    for (x, y, s_) in [(-92, -88, 1), (96, -80, 1), (10, -136, 1.2), (-52, -100, 1), (60, -92, .9), (-20, -70, .9), (28, -66, .9), (-4, -118, .9)]: wins.append(P(x, y) + (s_,))
    return m.resize((W, H), Image.LANCZOS), [(x/S, y/S, s_) for x, y, s_ in wins]

cxo, cyo, csc = 320, ridge[320] + 40, 1.05
cm, wins = castle(cxo, cyo, csc)
sky_c = orig[150:200, 300:340].reshape(-1, 3).mean(axis=0)
hazy = tuple(int(v) for v in (sky_c*0.34 + np.array([8, 12, 26])*0.66))
sil = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sil.paste(Image.new('RGBA', (W, H), hazy + (255,)), (0, 0), cm); img = Image.alpha_composite(img, sil)
rim = ImageChops.subtract(cm, ImageChops.offset(cm, -3, 2)); rr = Image.new('RGBA', (W, H), (0, 0, 0, 0)); rr.paste(Image.new('RGBA', (W, H), (175, 200, 250, 150)), (0, 0), rim.filter(ImageFilter.GaussianBlur(1.1))); img = Image.alpha_composite(img, rr)
img = Image.alpha_composite(img, glow((W, H), wins, (255, 170, 80), 6, 160)); wd = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dd = ImageDraw.Draw(wd)
for x, y, s_ in wins: dd.rounded_rectangle([x-2.6*s_, y-5*s_, x+2.6*s_, y+5.5*s_], radius=2.4*s_, fill=(255, 208, 130, 255))
img = Image.alpha_composite(img, wd.filter(ImageFilter.GaussianBlur(.5)))
# restore the mountain in front of the castle foot (feathered), then add valley mist
yy = np.arange(H)[:, None]; feather = np.clip((yy - (ridge[None, :] + 4)) / 14.0, 0, 1)
front = Image.fromarray((feather*255).astype(np.uint8), 'L'); img.paste(base.convert('RGBA'), (0, 0), front)
mist = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dm = ImageDraw.Draw(mist)
for (x, y, rx, ry, a_) in [(cxo, ridge[int(cxo)]+10, 230, 22, 80), (cxo-150, ridge[max(0, int(cxo)-150)]+30, 180, 20, 60), (cxo+190, ridge[int(cxo)+190]+24, 200, 20, 56), (W*.5, 760, 560, 36, 44), (W*.3, 1010, 620, 46, 38)]:
    dm.ellipse([x-rx, y-ry, x+rx, y+ry], fill=(165, 188, 225, a_))
img = Image.alpha_composite(img, mist.filter(ImageFilter.GaussianBlur(24)))

# ---- the princess: seated on the big log, facing the fire, lit by it
def princess(ox, oy, sc):
    m = Image.new('L', (W*S, H*S), 0); d = ImageDraw.Draw(m); P = lambda x, y: ((ox + x*sc)*S, (oy + y*sc)*S)
    poly = lambda cmds: d.polygon([P(*q) for q in path(cmds)], fill=255)
    # gown: fitted waist, wide skirt pooling over the log, hem sweeping toward the fire
    poly([('M', (-18, -92)), ('C', (-52, -78), (-96, -52), (-118, -8)), ('C', (-124, 6), (-110, 12), (-92, 10)), ('L', (112, 10)), ('C', (126, 8), (126, -2), (116, -12)), ('C', (92, -44), (64, -66), (40, -78)), ('C', (34, -86), (26, -94), (20, -100))])
    poly([('M', (-20, -96)), ('C', (-26, -118), (-24, -146), (-14, -166)), ('L', (-4, -176)), ('L', (12, -176)), ('C', (20, -160), (26, -130), (24, -104)), ('C', (12, -90), (-8, -88), (-20, -96))])           # bodice, shoulders
    poly([('M', (-4, -184)), ('L', (9, -184)), ('L', (8, -170)), ('L', (-3, -170))])                                                                                                               # neck
    ex, ey = P(5, -197); rx, ry = 13.5*sc*S, 16.5*sc*S; d.ellipse([ex-rx, ey-ry, ex+rx, ey+ry], fill=255)                                                                                          # head
    poly([('M', (-3, -212)), ('C', (0, -216), (10, -216), (13, -212)), ('L', (13, -210)), ('C', (10, -213), (0, -213), (-3, -210))])                                                           # tiara
    poly([('M', (-8, -206)), ('C', (-36, -204), (-52, -170), (-48, -128)), ('C', (-46, -100), (-40, -70), (-30, -56)), ('C', (-26, -64), (-20, -100), (-16, -138)), ('C', (-14, -164), (-8, -184), (-4, -196))])   # long hair
    poly([('M', (-12, -170)), ('C', (6, -150), (28, -128), (44, -112)), ('L', (51, -118)), ('C', (34, -140), (14, -162), (4, -178))])                                                                 # forearm
    poly([('M', (34, -118)), ('L', (70, -128)), ('L', (74, -106)), ('L', (40, -96))])                                                                                                             # open book
    return m.resize((W, H), Image.LANCZOS)

pxo, pyo, psc = 250, 1228, 1.28
pm = princess(pxo, pyo, psc)
# body colour: very dark with warm light from the fire on its right side
body = np.zeros((H, W, 4), dtype=np.uint8); body[..., :3] = (9, 7, 7); body[..., 3] = np.asarray(pm)
fire_x = 520.0; xs = np.arange(W)[None, :].astype(np.float32); lit = np.clip((xs - (pxo-60)) / 260.0, 0, 1)**1.6
body[..., 0] = np.clip(9 + 110*lit, 0, 255).astype(np.uint8)[0][None, :].repeat(H, 0); body[..., 1] = np.clip(7 + 46*lit, 0, 255).astype(np.uint8)[0][None, :].repeat(H, 0); body[..., 2] = np.clip(7 + 14*lit, 0, 255).astype(np.uint8)[0][None, :].repeat(H, 0)
img = Image.alpha_composite(img, Image.fromarray(body, 'RGBA'))
rimR = ImageChops.subtract(pm, ImageChops.offset(pm, -4, 0)); warm = Image.new('RGBA', (W, H), (0, 0, 0, 0)); warm.paste(Image.new('RGBA', (W, H), (255, 160, 80, 255)), (0, 0), rimR.filter(ImageFilter.GaussianBlur(1.3))); img = Image.alpha_composite(img, warm)
rimT = ImageChops.subtract(pm, ImageChops.offset(pm, 0, 3)); wt = Image.new('RGBA', (W, H), (0, 0, 0, 0)); wt.paste(Image.new('RGBA', (W, H), (255, 200, 130, 130)), (0, 0), rimT.filter(ImageFilter.GaussianBlur(1.5))); img = Image.alpha_composite(img, wt)
bk = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(bk).ellipse([pxo+58*psc-26, pyo-118*psc-14, pxo+58*psc+44, pyo-118*psc+22], fill=(255, 196, 120, 100)); img = Image.alpha_composite(img, bk.filter(ImageFilter.GaussianBlur(10)))
# film grain
noise = Image.effect_noise((W, H), 22).convert('L'); gn = Image.merge('RGBA', (noise, noise, noise, Image.new('L', (W, H), 13))); img = Image.alpha_composite(img, gn)
img = img.convert('RGB'); save(img, 'bg-finale.webp', 78)
save(cover(img.crop((20, 120, 820, 760)), 520, 650, .4, .5), 'loc-7.webp', 74)

# ---- PWA icons
def icon(size, maskable=False):
    s = size*2; im = Image.new('RGB', (s, s), (3, 8, 8)); g = ImageDraw.Draw(im)
    for r in range(s//2, 0, -4): t = r/(s/2); c = (int(6+14*(1-t)), int(20+34*(1-t)), int(18+30*(1-t))); g.ellipse([s/2-r, s/2-r, s/2+r, s/2+r], fill=c)
    k = s/512*(0.78 if maskable else 1.0); cx = s/2; cyy = s/2+10*k
    ring = Image.new('RGBA', (s, s), (0, 0, 0, 0)); rd = ImageDraw.Draw(ring)
    if not maskable:
        rd.ellipse([cx-206*k, cyy-206*k-10*k, cx+206*k, cyy+206*k-10*k], outline=(241, 199, 110, 255), width=int(4*k)); rd.ellipse([cx-190*k, cyy-190*k-10*k, cx+190*k, cyy+190*k-10*k], outline=(241, 199, 110, 110), width=int(2*k))
    crown = [(-92, -70), (-92, -142), (-46, -100), (0, -170), (46, -100), (92, -142), (92, -70)]
    rd.polygon([(cx+x*k, cyy+y*k-8*k) for x, y in crown], fill=(241, 199, 110, 255))
    # stylised A (serif-like) in gold
    rd.polygon([(cx-84*k, cyy+110*k), (cx-20*k, cyy-60*k), (cx+20*k, cyy-60*k), (cx+84*k, cyy+110*k), (cx+56*k, cyy+110*k), (cx+38*k, cyy+62*k), (cx-38*k, cyy+62*k), (cx-56*k, cyy+110*k)], fill=(241, 199, 110, 255))
    rd.polygon([(cx-24*k, cyy+36*k), (cx+24*k, cyy+36*k), (cx, cyy-20*k)], fill=(3, 10, 10, 255))
    gl = ring.filter(ImageFilter.GaussianBlur(16*k)); gl = Image.merge('RGBA', (gl.getchannel('R'), gl.getchannel('G'), gl.getchannel('B'), gl.getchannel('A').point(lambda v: int(v*.5))))
    im = Image.alpha_composite(im.convert('RGBA'), gl); im = Image.alpha_composite(im, ring)
    return im.convert('RGB').resize((size, size), Image.LANCZOS)
for n, sz, mk in [('icon-192.png', 192, False), ('icon-512.png', 512, False), ('icon-maskable-512.png', 512, True), ('apple-touch-icon.png', 180, False)]:
    icon(sz, mk).save(OUT / n, optimize=True); print(n)
