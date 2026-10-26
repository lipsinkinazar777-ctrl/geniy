#!/usr/bin/env python3
# Antique wooden casket with brass fittings: closed and open sprites (RGBA) for the table.
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
rng = np.random.default_rng(21)
W, H = 640, 520
def gb(x, s):
    s = max(s, .3); r = max(1, int(s * 3)); k = np.exp(-(np.arange(-r, r + 1) ** 2) / (2 * s * s)); k /= k.sum()
    for ax in (0, 1):
        pad = [(0, 0)] * x.ndim; pad[ax] = (r, r); p = np.pad(x, pad, mode='edge'); n = x.shape[ax]; o = np.zeros_like(x)
        for i, w in enumerate(k): o += w * np.take(p, np.arange(i, i + n), axis=ax)
        x = o
    return x
def noise(sx, sy, amp):
    n = rng.normal(0, 1, (H // sy + 2, W // sx + 2)).astype(np.float32); return np.asarray(Image.fromarray(n, 'F').resize((W, H), Image.BICUBIC)) * amp
def mask(fn): m = Image.new('L', (W, H), 0); fn(ImageDraw.Draw(m)); return np.asarray(m).astype(np.float32) / 255.0
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
def wood(light):   # horizontal grain walnut
    g = noise(60, 3, .22) + noise(18, 2, .12) + noise(200, 8, .1)
    base = np.array([92, 58, 34], np.float32) * light[..., None]; return base * (1 + g[..., None])
def brass(shape, hl):
    t = np.clip(hl, 0, 1)[..., None]; return (np.array([120, 84, 34]) * (1 - t) + np.array([255, 224, 140]) * t) * (1 + noise(3, 3, .06)[..., None])
def over(dst, rgb, a): a = a[..., None]; return dst * (1 - a) + rgb * a
def render(open_):
    img = np.zeros((H, W, 3), np.float32); alpha = np.zeros((H, W), np.float32)
    sh = gb(mask(lambda d: d.ellipse([30, 400, 610, 500], fill=255)), 18) * .75
    alpha = np.maximum(alpha, sh)
    # body: front face + top rim
    front = mask(lambda d: d.polygon([(40, 250), (600, 250), (590, 440), (50, 440)], fill=255))
    top = mask(lambda d: d.polygon([(70, 190), (570, 190), (600, 250), (40, 250)], fill=255))
    lf = (.55 + .45 * np.clip((yy - 250) / 190, 0, 1) * -1 + .5) * (.75 + .25 * np.clip(1 - np.abs(xx - 250) / 330, 0, 1))
    front_c = wood(np.clip(lf * .95, .25, 1.1)); img = over(img, front_c, gb(front, .8)); alpha = np.maximum(alpha, gb(front, .8))
    img = over(img, wood(np.full((H, W), .62, np.float32)) * (1 + .1 * np.clip((yy - 190) / 60, 0, 1))[..., None], gb(top, .8)); alpha = np.maximum(alpha, gb(top, .8))
    # brass straps + corners + lock on the front
    for x0 in (96, 500):
        st = mask(lambda d, x0=x0: d.rectangle([x0, 250, x0 + 34, 440], fill=255)); hl = np.exp(-((xx - x0 - 10) / 8) ** 2) * .9; img = over(img, brass(st, hl), gb(st, .6))
    for (a, b, c, d_) in ((40, 250, 66, 276), (574, 250, 600, 276), (50, 414, 76, 440), (564, 414, 590, 440)):
        cm = mask(lambda dd, a=a, b=b, c=c, d_=d_: dd.rectangle([a, b, c, d_], fill=255)); img = over(img, brass(cm, np.exp(-(((xx - a) - 6) / 10) ** 2)), gb(cm, .6))
    lock = mask(lambda d: d.rounded_rectangle([282, 236, 358, 316], 12, fill=255)); lk = np.exp(-(((xx - 300) ** 2 + (yy - 258) ** 2) / 700)) ; img = over(img, brass(lock, lk), gb(lock, .6))
    kh = mask(lambda d: (d.ellipse([312, 262, 328, 278], fill=255), d.rectangle([318, 276, 322, 298], fill=255))); img = over(img, np.array([14, 10, 6], np.float32), gb(kh, .6))
    if not open_:
        lid = mask(lambda d: d.polygon([(46, 250), (594, 250), (556, 120), (84, 120)], fill=255)); dome = np.clip(1 - np.abs((yy - 185) / 70), 0, 1)
        lc = wood(np.clip(.55 + .55 * dome - .1 * (xx - 320) / 300, .3, 1.15)); img = over(img, lc, gb(lid, .8)); alpha = np.maximum(alpha, gb(lid, .8))
        for x0 in (96, 500):
            st = mask(lambda d, x0=x0: d.polygon([(x0 - 4, 250), (x0 + 36, 250), (x0 + 28, 120), (x0 + 4, 120)], fill=255)); img = over(img, brass(st, np.exp(-((xx - x0 - 8) / 8) ** 2)), gb(st, .6))
        rim = mask(lambda d: d.line([(46, 250), (594, 250)], fill=255, width=5)); img = over(img, brass(rim, np.exp(-((yy - 250) / 3) ** 2)), gb(rim, .6))
        topb = mask(lambda d: d.line([(84, 120), (556, 120)], fill=255, width=4)); img = over(img, brass(topb, np.exp(-((yy - 120) / 3) ** 2)), gb(topb, .6))
    else:
        # lid thrown back: seen from its inside, behind the box
        lid = mask(lambda d: d.polygon([(78, 190), (562, 190), (540, 28), (100, 28)], fill=255)); lc = wood(np.clip(.7 - .25 * (yy - 28) / 160, .3, 1)); img = over(img, lc, gb(lid, .8)); alpha = np.maximum(alpha, gb(lid, .8))
        lin = mask(lambda d: d.polygon([(100, 176), (540, 176), (526, 44), (114, 44)], fill=255)); vel = np.array([96, 20, 30], np.float32) * (.6 + .4 * np.clip(1 - np.abs(xx - 320) / 260, 0, 1))[..., None] * (1 + noise(2, 2, .08)[..., None]); img = over(img, vel, gb(lin, .8))
        cav = mask(lambda d: d.polygon([(92, 200), (548, 200), (578, 246), (62, 246)], fill=255)); img = over(img, np.array([30, 6, 10], np.float32), gb(cav, .8)); alpha = np.maximum(alpha, gb(cav, .8))
        for i in range(7):   # the edges of cards standing in the box
            x0 = 120 + i * 62; cm = mask(lambda d, x0=x0: d.polygon([(x0, 205), (x0 + 38, 205), (x0 + 44, 236), (x0 - 4, 236)], fill=255)); img = over(img, np.array([226, 206, 160], np.float32) * (.7 + .3 * (i % 2)), gb(cm, .7))
        rim = mask(lambda d: d.line([(62, 246), (578, 246)], fill=255, width=6)); img = over(img, brass(rim, np.exp(-((yy - 246) / 3) ** 2)), gb(rim, .6))
    img *= (1 + noise(1, 1, .03)[..., None])
    out = np.dstack([np.clip(img, 0, 255), np.clip(alpha * 255, 0, 255)]).astype(np.uint8)
    # anything painted has alpha: rebuild alpha from the union of shape masks
    return out
for nm, o in (('casket', False), ('casket-open', True)):
    a = render(o); img = Image.fromarray(a, 'RGBA'); img.save(f'/home/user/geniy/aisel/src/img/{nm}.webp', quality=90, method=6); print(nm)
bg = Image.new('RGBA', (W * 2, H), (60, 40, 25, 255)); bg.alpha_composite(Image.open('/home/user/geniy/aisel/src/img/casket.webp'), (0, 0)); bg.alpha_composite(Image.open('/home/user/geniy/aisel/src/img/casket-open.webp'), (W, 0)); bg.convert('RGB').resize((W, H // 2)).save('/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad/casket.png')
