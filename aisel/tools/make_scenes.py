#!/usr/bin/env python3
# Procedural art for the extra rooms: the iron fire bowl (main table), the alchemy lab plate and the library backdrop.
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops
OUT = '/home/user/geniy/aisel/src/img/'
SP = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/images/'
rng = np.random.default_rng(11)

def gblur(x, s):
    s = max(s, .3); r = max(1, int(s * 3)); k = np.exp(-(np.arange(-r, r + 1) ** 2) / (2 * s * s)); k /= k.sum()
    for ax in (0, 1):
        pad = [(0, 0)] * x.ndim; pad[ax] = (r, r); p = np.pad(x, pad, mode='edge'); n = x.shape[ax]; o = np.zeros_like(x)
        for i, w in enumerate(k): o += w * np.take(p, np.arange(i, i + n), axis=ax)
        x = o
    return x
def noise(h, w, sc, amp=1.0):
    n = rng.normal(0, 1, (h // sc + 2, w // sc + 2)).astype(np.float32)
    return np.asarray(Image.fromarray(n, 'F').resize((w, h), Image.BICUBIC)) * amp
def mask(size, fn):
    m = Image.new('L', size, 0); fn(ImageDraw.Draw(m)); return np.asarray(m).astype(np.float32) / 255.0
def blend(dst, rgb, a):               # dst float HxWx3, rgb HxWx3 or tuple, a HxW
    a = a[..., None]; return dst * (1 - a) + (np.array(rgb, np.float32) if not hasattr(rgb, 'shape') else rgb) * a

# ------------------------------------------------------------------ fire bowl (RGBA, transparent around it)
def bowl():
    W, H = 760, 560; cx = 380; rcy, rrx, rry = 215, 318, 112; irx, iry = 286, 94; by, brx, bry = 420, 190, 66
    img = np.zeros((H, W, 4), np.float32)
    # contact shadow on the table
    sh = mask((W, H), lambda d: d.ellipse([cx - 335, 392, cx + 335, 540], fill=255)); sh = gblur(sh, 20) * .72
    img[..., 3] = sh; img[..., :3] = 0
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    # body (tapered iron belly)
    def body(d):
        pts = []
        for t in np.linspace(0, 1, 40):
            y = rcy + (by - rcy) * t; half = rrx + (brx - rrx) * (t ** .8) - 22 * np.sin(t * np.pi) * -1
            pts.append((cx - half, y))
        for t in np.linspace(1, 0, 40):
            y = rcy + (by - rcy) * t; half = rrx + (brx - rrx) * (t ** .8) + 22 * np.sin(t * np.pi) * 0
            pts.append((cx + half, y))
        d.polygon(pts, fill=255); d.ellipse([cx - brx, by - bry, cx + brx, by + bry], fill=255); d.ellipse([cx - rrx, rcy - rry, cx + rrx, rcy + rry], fill=255)
    bm = mask((W, H), body)
    nx = np.clip((xx - cx) / (rrx - (rrx - brx) * np.clip((yy - rcy) / (by - rcy), 0, 1)), -1.2, 1.2)
    lit = .30 + .55 * np.clip(.35 - nx * .8, 0, 1) + .35 * np.clip(1 - np.abs(nx + .55) * 3.5, 0, 1) * .5     # window light from the left + soft rim
    glowb = np.clip((yy - 230) / 200, 0, 1) * np.exp(-(nx * 1.4) ** 2) * .25                              # fire throws warmth on the lower belly
    pit = noise(H, W, 3, .06) + noise(H, W, 9, .05) + noise(H, W, 40, .06)
    iron = np.stack([22 * lit + 38 * glowb, 21 * lit + 15 * glowb, 20 * lit + 7 * glowb], -1) * (1 + pit[..., None]) + 3
    img_rgb = np.zeros((H, W, 3), np.float32); img_rgb[...] = img[..., :3]; a = img[..., 3]
    ba = gblur(bm, .8); img_rgb = blend(img_rgb, iron, ba); a = a * (1 - ba) + ba
    # rim top face
    ro = mask((W, H), lambda d: d.ellipse([cx - rrx, rcy - rry, cx + rrx, rcy + rry], fill=255)); ri = mask((W, H), lambda d: d.ellipse([cx - irx, rcy - iry, cx + irx, rcy + iry], fill=255))
    rim = np.clip(ro - ri, 0, 1); rl = .55 + .45 * np.clip(-(xx - cx) / rrx * .9 + (rcy - yy) / rry * .6, -1, 1)
    rimc = np.stack([58 * rl, 54 * rl, 49 * rl], -1) * (1 + (noise(H, W, 2, .05) + noise(H, W, 14, .06))[..., None])
    img_rgb = blend(img_rgb, rimc, gblur(rim, .7)); a = np.maximum(a, gblur(ro, .7))
    # interior: back wall catches the fire's light, then the coal bed with logs
    inn = gblur(ri, .8); wall = np.clip(1 - (yy - (rcy - iry)) / (iry * 1.1), 0, 1)
    interior = np.stack([14 + 52 * wall ** 1.6, 9 + 20 * wall ** 1.6, 7 + 6 * wall ** 1.6], -1)
    bed = np.exp(-(((xx - cx) / 190) ** 2 + ((yy - rcy - 16) / 52) ** 2)); interior = interior + bed[..., None] * np.array([190, 50, 12]) * .2
    img_rgb = blend(img_rgb, interior, inn)
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    logs = [(-150, 18, 120, -28, 30), (-120, -34, 150, 38, 28), (-60, 36, 70, -52, 26), (40, 30, -110, -30, 27), (110, 10, -90, 44, 24), (-20, -10, 160, 10, 22)]
    for (x0, y0, x1, y1, th) in logs:
        d.line([(cx + x0, rcy + 14 + y0), (cx + x1, rcy + 14 + y1)], fill=(26, 17, 11, 255), width=th); d.ellipse([cx + x1 - th / 2, rcy + 14 + y1 - th / 2, cx + x1 + th / 2, rcy + 14 + y1 + th / 2], fill=(46, 28, 16, 255))
        d.line([(cx + x0, rcy + 8 + y0), (cx + x1, rcy + 8 + y1)], fill=(60, 38, 22, 255), width=max(4, th // 4))
    lg = np.asarray(layer).astype(np.float32); la = lg[..., 3] / 255.0 * inn
    lg_rgb = lg[..., :3] * (1 + noise(H, W, 2, .25)[..., None]); img_rgb = blend(img_rgb, lg_rgb, la)
    cracks = mask((W, H), lambda dd: [dd.line([(cx + rng.integers(-170, 170), rcy + 14 + rng.integers(-40, 40)), (cx + rng.integers(-170, 170), rcy + 14 + rng.integers(-40, 40))], fill=255, width=int(rng.integers(2, 5))) for _ in range(46)])
    cr = gblur(cracks, 1.4) * inn * (la > .1) * (.6 + noise(H, W, 6, .4)); img_rgb = img_rgb + cr[..., None] * np.array([210, 40, 8]) * .75
    coals = mask((W, H), lambda dd: [dd.ellipse([x - r, y - r * .6, x + r, y + r * .6], fill=int(rng.integers(120, 255))) for x, y, r in [(cx + rng.integers(-200, 200), rcy + 14 + rng.integers(-34, 44), rng.integers(3, 8)) for _ in range(130)]])
    co = gblur(coals, 1.6) * inn; img_rgb = img_rgb + co[..., None] * np.array([190, 34, 6]) * .6 + gblur(coals, 9)[..., None] * inn[..., None] * np.array([200, 30, 5]) * .3
    # front lip shadow where the belly turns under the rim
    lip = np.clip(ro - gblur(ro, 0) , 0, 1)
    out = np.dstack([np.clip(img_rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(OUT + 'bowl.webp', quality=88, method=6, lossless=False); print('bowl', out.shape)

def wood(h, w, base=(104, 72, 44), pl=118):
    def st(cols): n = rng.normal(0, 1, (h, cols)).astype(np.float32); return np.asarray(Image.fromarray(n, 'F').resize((w, h), Image.BICUBIC))
    g = st(w // 160 + 2) * .30 + st(w // 40 + 2) * .16 + st(w // 12 + 2) * .07
    out = np.zeros((h, w, 3), np.float32); y = 0
    while y < h:
        t = rng.normal(1, .1); y2 = min(h, y + pl + int(rng.integers(-14, 20)))
        out[y:y2] = np.array(base, np.float32) * t * (1 + g[y:y2, :, None]); out[y:y2][:3] *= .35; out[max(y, y2 - 3):y2] *= .3; y = y2
    return out
# ------------------------------------------------------------------ alchemy lab plate (portrait 1080x1920)
def lab():
    W, H = 1080, 1920; yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    # stone wall
    wall = np.zeros((H, W, 3), np.float32); wall[...] = (36, 40, 42)
    bl = Image.new('L', (W, H), 0); d = ImageDraw.Draw(bl); y = 0; row = 0
    shade = np.zeros((H, W), np.float32)
    while y < 1500:
        h = int(rng.integers(105, 135)); x = -int(rng.integers(0, 200)) if row % 2 else 0
        while x < W:
            w = int(rng.integers(190, 320)); v = rng.normal(0, 6); shade[max(0, y):y + h, max(0, x):x + w] = v; d.rectangle([x, y, x + w, y + h], outline=255, width=5); x += w
        y += h; row += 1
    edges = gblur(np.asarray(bl).astype(np.float32) / 255.0, 2.2)
    wall += shade[..., None] + noise(H, W, 3, 4)[..., None] + noise(H, W, 18, 5)[..., None]
    wall = wall * (1 - .55 * edges[..., None]); wall *= (.8 + .35 * np.clip(1 - np.hypot((xx - 540) / 700, (yy - 700) / 900), 0, 1))[..., None]
    wall[..., 2] += 4
    # arched window onto the misty oak forest
    ar = mask((W, H), lambda dd: (dd.rectangle([300, 420, 780, 760], fill=255), dd.ellipse([300, 150, 780, 690], fill=255)))
    fo = Image.open(SP + '28.webp').convert('RGB'); fo = fo.resize((int(fo.width * 700 / fo.height), 700)).crop((0, 0, 480, 700)) if fo.width * 700 / fo.height >= 480 else fo.resize((480, 700))
    win = np.zeros((H, W, 3), np.float32); win[150:850 if False else 850, 300:780] = 0
    fo = fo.resize((480, 610)); fa = np.asarray(fo).astype(np.float32) * np.array([.55, .72, .95]) + np.array([4, 10, 22])
    win[150:760, 300:780] = fa; arch = gblur(ar, 1.2)
    frame = gblur(mask((W, H), lambda dd: (dd.rectangle([262, 420, 818, 780], fill=255), dd.ellipse([262, 112, 818, 728], fill=255))), 1.2) - arch
    wall = blend(wall, win, arch); fr = np.stack([22, 24, 25], -1)[None, None, :] * (.7 + .5 * np.clip(1 - (xx - 262) / 556, 0, 1))[..., None] * (1 + noise(H, W, 4, .08)[..., None])
    wall = blend(wall, fr, np.clip(frame, 0, 1))
    wall[150:780, 300:780] *= (1 - arch[150:780, 300:780, None] * (.15 - .3 * np.clip(1 - (yy[150:780, 300:780, None] - 150) / 600, 0, 1)))
    # sill + moonlight on it
    sill = mask((W, H), lambda dd: dd.rectangle([240, 760, 840, 800], fill=255)); wall = blend(wall, (58, 62, 64), gblur(sill, 1)) 
    # wood: shelf plank and the bench, textured from the desk photo
    wd = wood(760, W)
    wall[930:980] = wd[40:90] * .75; wall[925:930] = (118, 86, 54); wall[980:996] = wall[980:996] * .5
    bench0 = 1500; bt = (yy[bench0:] - bench0) / (H - bench0)
    wall[bench0:] = wood(H - bench0, W, pl=150) * (.8 - .42 * bt)[..., None]; wall[bench0 - 6:bench0] = (112, 80, 50)
    wall[bench0:bench0 + 70] *= np.linspace(.55, 1, 70)[:, None, None]
    # hearth slab + iron pot with legs
    cx = 540; slab = mask((W, H), lambda dd: dd.ellipse([cx - 360, 1390, cx + 360, 1530], fill=255)); wall = blend(wall, np.stack([54, 52, 50], -1) * (1 + noise(H, W, 3, .08)[..., None]), gblur(slab, 1.2))
    shadow = gblur(mask((W, H), lambda dd: dd.ellipse([cx - 330, 1440, cx + 330, 1540], fill=255)), 26) * .6; wall = wall * (1 - shadow[..., None] * .5)
    rcy, rrx, rry = 1130, 262, 74
    prof = lambda y: 262 + (335 - 262) * np.sin(np.clip((y - rcy) / 150, 0, 1) * np.pi / 2) if y < rcy + 150 else 335 - (335 - 190) * ((y - rcy - 150) / 150) ** 1.2
    def potm(dd):
        pts = [(cx - prof(y), y) for y in range(rcy, rcy + 300)] + [(cx + prof(y), y) for y in range(rcy + 299, rcy - 1, -1)]; dd.polygon(pts, fill=255)
        for lx in (-170, 0, 170): dd.polygon([(cx + lx - 28, rcy + 270), (cx + lx + 28, rcy + 270), (cx + lx + 18, rcy + 340), (cx + lx - 18, rcy + 340)], fill=255)
    pm = mask((W, H), potm); pm = np.maximum(pm, mask((W, H), lambda dd: dd.ellipse([cx - rrx - 6, rcy - rry, cx + rrx + 6, rcy + rry], fill=255)))
    half = np.where(yy < rcy + 150, 262 + 73 * np.sin(np.clip((yy - rcy) / 150, 0, 1) * np.pi / 2), 335 - 145 * np.clip((yy - rcy - 150) / 150, 0, 1) ** 1.2)
    nxp = np.clip((xx - cx) / half, -1, 1); lit = .22 + .5 * np.clip(.1 - nxp * .9, 0, 1) + .5 * np.exp(-((nxp + .5) * 4) ** 2) * .5
    warm = np.clip((yy - (rcy + 100)) / 220, 0, 1) * np.exp(-(nxp * 1.3) ** 2) * .5
    pot = np.stack([30 * lit + 130 * warm, 29 * lit + 52 * warm, 29 * lit + 14 * warm], -1) * (1 + (noise(H, W, 3, .07) + noise(H, W, 30, .05))[..., None])
    wall = blend(wall, pot, gblur(pm, .9))
    ro = mask((W, H), lambda dd: dd.ellipse([cx - rrx - 8, rcy - rry - 4, cx + rrx + 8, rcy + rry + 4], fill=255)); ri = mask((W, H), lambda dd: dd.ellipse([cx - rrx + 22, rcy - rry + 14, cx + rrx - 22, rcy + rry - 12], fill=255))
    rl = .6 + .4 * np.clip(-(xx - cx) / rrx, -1, 1); wall = blend(wall, np.stack([92 * rl, 86 * rl, 78 * rl], -1) * (1 + noise(H, W, 2, .05)[..., None]), gblur(np.clip(ro - ri, 0, 1), .8))
    wall = blend(wall, (8, 7, 6), gblur(ri, 1))
    # vignette + grade
    v = np.clip(1 - np.hypot((xx - 540) / 820, (yy - 960) / 1250) ** 1.7, .18, 1); wall *= v[..., None]
    out = np.clip(wall + noise(H, W, 1, 2.2)[..., None], 0, 255).astype(np.uint8)
    Image.fromarray(out).save(OUT + 'lab.webp', quality=82, method=6); print('lab')

# ------------------------------------------------------------------ library backdrop (portrait 1080x1920) from the user's photo
def lib():
    im = Image.open(SP + '23.webp').convert('RGB'); W, H = 1080, 1920
    s = max(W / im.width, H / im.height); im = im.resize((int(im.width * s) + 1, int(im.height * s) + 1), Image.LANCZOS); x0 = (im.width - W) // 2
    im = im.crop((x0, 0, x0 + W, H)).filter(ImageFilter.GaussianBlur(2.2)); a = np.asarray(im).astype(np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); v = np.clip(1 - np.hypot((xx - 540) / 800, (yy - 700) / 1300) ** 1.6, .15, 1)
    a = a * (.62 * v[..., None]) + np.array([2, 1, 0]); out = np.clip(a + noise(H, W, 1, 2)[..., None], 0, 255).astype(np.uint8)
    Image.fromarray(out).save(OUT + 'lib.webp', quality=80, method=6); print('lib')
if __name__ == '__main__':
    import sys
    for f in (sys.argv[1:] or ['bowl', 'lab', 'lib']): globals()[f]()
