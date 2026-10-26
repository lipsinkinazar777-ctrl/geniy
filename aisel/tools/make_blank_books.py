#!/usr/bin/env python3
# Blank covers (title, author and emblem wiped, leather re-synthesised) + emblem sprites cut from the originals, for the user's own books.
import numpy as np, json
from PIL import Image, ImageFilter, ImageDraw
O = '/home/user/geniy/aisel/src/img/'; SP = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad/'
rng = np.random.default_rng(12)
def gblur(x, s):
    s = max(s, .3); r = max(1, int(s * 3)); k = np.exp(-(np.arange(-r, r + 1) ** 2) / (2 * s * s)); k /= k.sum()
    for ax in (0, 1):
        pad = [(0, 0)] * x.ndim; pad[ax] = (r, r); p = np.pad(x, pad, mode='edge'); n = x.shape[ax]; o = np.zeros_like(x)
        for i, w in enumerate(k): o += w * np.take(p, np.arange(i, i + n), axis=ax)
        x = o
    return x
names = ['lantern', 'prince', 'souls', 'alice', 'ash', 'pride']; ART = {}
for n in names:
    im = Image.open(O + f'book-{n}.webp').convert('RGBA'); a = np.asarray(im).astype(np.float32); H, W = a.shape[:2]; rgb = a[..., :3]; al = a[..., 3] / 255
    mx = rgb.max(2); gold = (mx > 125) & (rgb[..., 1] > .52 * rgb[..., 0]) & (al > .8)
    ys, xs = np.mgrid[0:H, 0:W]
    body = gold & (xs > .17 * W)
    # frame bounds: outermost gold in the cover area
    cols = np.where(body[int(.25 * H):int(.75 * H)].any(0))[0]; rows = np.where(body[:, int(.3 * W):int(.9 * W)].any(1))[0]
    FL, FR, FT, FB = int(cols.min()), int(cols.max()), int(rows.min()), int(rows.max()); fw, fh = FR - FL, FB - FT
    # spine edge: the face starts where the leather turns from spine to cover; take the frame's left minus a margin
    face = [max(0, FL - 14), max(0, FT - 12), min(W, FR + 10), min(H, FB + 14)]
    # wipe region: central content zone
    cx0, cx1 = FL + .20 * fw, FR - .20 * fw; wx0, wx1 = FL + .105 * fw, FR - .105 * fw; wy0, wy1 = FT + .125 * fh, FT + .84 * fh; cy1 = FB - .02 * fh
    wm = np.zeros((H, W), np.float32)
    wm[int(wy0):int(wy1), int(wx0):int(wx1)] = 1; wm[int(wy0):int(cy1), int(cx0):int(cx1)] = 1
    wm = gblur(wm, 2.0)
    # emblem: the gold cluster in the upper part of the panel
    ex0, ex1, ey0, ey1 = int(FL + .2 * fw), int(FR - .2 * fw), int(FT + .11 * fh), int(FT + .45 * fh)
    sub = body[ey0:ey1, ex0:ex1]; rr = np.where(sub.any(1))[0]; cc = np.where(sub.any(0))[0]
    # emblem is the first block of gold rows separated from the title by a gap
    rowsum = sub.sum(1); gap = None
    for yy in range(len(rowsum) // 2, len(rowsum)):
        if rowsum[yy] < 2: gap = yy; break
    eb = (ex0, ey0, ex1, ey0 + (gap if gap else len(rowsum)))
    # leather sample: non-gold, bright enough, inside the face but outside the wipe zone
    leather = (~gold) & (al > .9) & (ys > face[1] + 10) & (ys < face[3] - 10) & (xs > face[0] + 10) & (xs < face[2] - 10) & (wm < .05) & (mx > 18)
    dom = leather & (mx < 78) & (mx > 22); mu = np.median(rgb[dom], 0); sd = rgb[dom].std(0)
    # low-frequency lighting from the surroundings (multi-scale normalised blur-fill, proven in the other tools), grain synthesised on top
    hole = (wm > .02).astype(np.float32); keep = ((1 - hole) * ((~gold) & (al > .5) & (mx > 16) & (mx < 80) & (xs > .2 * W)).astype(np.float32))[..., None]; fillv = np.zeros_like(rgb) + mu; kk = keep.copy(); fillv = np.where(keep > .5, rgb, fillv)
    for sg in (7, 16, 34, 70):
        den = gblur(kk, sg); est = gblur(fillv * kk, sg) / np.maximum(den, 1e-3); ok = den > .02
        sel = (kk < .5) & ok; fillv = np.where(sel, est, fillv); kk = np.where(sel, 1.0, kk)
    hf = rgb - gblur(rgb, 2.6); hf_std = hf[leather].std()
    noise = gblur(rng.normal(0, 1, (H, W)).astype(np.float32), 1.5) * 2.2 + gblur(rng.normal(0, 1, (H, W)).astype(np.float32), 4.0) * 4.5
    noise = (noise / noise.std() * hf_std * .62)[..., None]; tex = fillv + noise
    out = rgb * (1 - wm[..., None]) + tex * wm[..., None]
    blank = np.dstack([np.clip(out, 0, 255), a[..., 3]]).astype(np.uint8); Image.fromarray(blank, 'RGBA').save(O + f'blank-{n}.webp', quality=92, method=6)
    # emblem cut with gold-keyed alpha
    emb = rgb[eb[1]:eb[3], eb[0]:eb[2]]; ma = np.clip((emb.max(2) - 95) / 70, 0, 1) * ((emb[..., 1] > .5 * emb[..., 0]).astype(np.float32)); ma = gblur(ma, .8)
    ee = np.dstack([emb, ma * 255]).astype(np.uint8); eim = Image.fromarray(ee, 'RGBA'); box = np.asarray(eim)[..., 3] > 20; yy_, xx_ = np.where(box)
    eim = eim.crop((xx_.min(), yy_.min(), xx_.max() + 1, yy_.max() + 1)); eim.save(O + f'emblem-{n}.webp', quality=92, method=6)
    ART[n] = {'w': W, 'h': H, 'face': [int(v) for v in face], 'frame': [FL, FT, FR, FB], 'emb': [eim.width, eim.height], 'mu': [int(v) for v in mu]}
    print(n, ART[n])
json.dump(ART, open('/home/user/geniy/aisel/src/js/bookart.json', 'w'))
sheet = Image.new('RGBA', (2000, 700), (50, 36, 26, 255)); x = 0
for n in names:
    b = Image.open(O + f'blank-{n}.webp'); sheet.alpha_composite(b, (x, 5)); x += b.width + 8
sheet.convert('RGB').resize((1400, 490)).save(SP + 'blank_books.png')
