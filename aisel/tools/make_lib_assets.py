#!/usr/bin/env python3
# Library assets from the user's art: six books (image 77, black ground -> alpha), hands (images 73/74, true alpha), clean room plate (image 72).
import numpy as np, json
from PIL import Image, ImageFilter, ImageDraw
D = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/images/'; OUT = '/home/user/geniy/aisel/src/img/'; SP = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad/'
def gblur(x, s):
    s = max(s, .3); r = max(1, int(s * 3)); k = np.exp(-(np.arange(-r, r + 1) ** 2) / (2 * s * s)); k /= k.sum()
    for ax in (0, 1):
        pad = [(0, 0)] * x.ndim; pad[ax] = (r, r); p = np.pad(x, pad, mode='edge'); n = x.shape[ax]; o = np.zeros_like(x)
        for i, w in enumerate(k): o += w * np.take(p, np.arange(i, i + n), axis=ax)
        x = o
    return x
def trim(im, pad=6):
    a = np.asarray(im)[..., 3]; ys, xs = np.where(a > 12); x0, x1, y0, y1 = max(0, xs.min() - pad), min(im.width, xs.max() + pad), max(0, ys.min() - pad), min(im.height, ys.max() + pad); return im.crop((x0, y0, x1, y1))

# ---------------------------------------------------------------- books from 77 (RGB on black)
b77 = Image.open(D + '77.webp').convert('RGB'); a = np.asarray(b77).astype(np.float32); lum = a.max(2)
fg = lum > 14
# flood-fill the background from the frame, then everything unreachable is the book (fills dark covers)
H, W = fg.shape; bg = np.zeros((H, W), bool); stack = [(0, 0), (0, W - 1), (H - 1, 0), (H - 1, W - 1)] + [(y, 0) for y in range(0, H, 40)] + [(y, W - 1) for y in range(0, H, 40)] + [(0, x) for x in range(0, W, 40)] + [(H - 1, x) for x in range(0, W, 40)]
ms = np.asarray(Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
stack = [p for p in stack if not ms[p]]
while stack:
    y, x = stack.pop()
    if bg[y, x] or ms[y, x]: continue
    bg[y, x] = True
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and not bg[ny, nx] and not ms[ny, nx]: stack.append((ny, nx))
alpha = (~bg).astype(np.float32); alpha = gblur(np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))).astype(np.float32) / 255, 1.1)
rgba = np.dstack([a, alpha * 255]).astype(np.uint8); sheet = Image.fromarray(rgba, 'RGBA')
col = (alpha > .5).any(0); edges = np.diff(col.astype(int)); starts = list(np.where(edges == 1)[0] + 1); ends = list(np.where(edges == -1)[0] + 1)
print('book spans', list(zip(starts, ends)))
names = ['lantern', 'prince', 'souls', 'alice', 'ash', 'pride']; info = {}
for i, (s, e) in enumerate(zip(starts, ends)):
    if e - s < 150: continue
    bk = trim(sheet.crop((max(0, s - 4), 0, min(W, e + 4), H))); bk.save(OUT + f'book-{names[len(info)]}.webp', quality=92, method=6, lossless=False); info[names[len(info)]] = [bk.width, bk.height]
print(info)
bg_ = Image.new('RGBA', (2000, 700), (50, 36, 26, 255)); x = 0
for n in info: im = Image.open(OUT + f'book-{n}.webp'); bg_.alpha_composite(im, (x, 10)); x += im.width + 10
bg_.convert('RGB').resize((1400, 490)).save(SP + 'books_cut.png')

# ---------------------------------------------------------------- hands (true alpha)
h74 = Image.open(D + '74.webp').convert('RGBA'); a74 = np.asarray(h74)[..., 3]
colm = (a74 > 20).any(0); mid = 930
L = trim(h74.crop((0, 0, mid, h74.height))); R = trim(h74.crop((mid, 0, h74.width, h74.height)))
L.save(OUT + 'hand-l.webp', quality=92, method=6); R.save(OUT + 'hand-r.webp', quality=92, method=6); print('hand-l', L.size, 'hand-r', R.size)
h73 = Image.open(D + '73.webp').convert('RGBA'); a73 = np.asarray(h73)[..., 3]
# upper band = six hands, lower band = six books (73 books are lower-res than 77)
boxes = [(4, 92, 312, 456), (284, 128, 636, 456), (612, 128, 820, 456), (904, 128, 1124, 456), (1080, 116, 1392, 456), (1380, 172, 1648, 456)]
for i, bx in enumerate(boxes):
    m = np.zeros_like(a73); m[bx[1]:bx[3], bx[0]:bx[2]] = a73[bx[1]:bx[3], bx[0]:bx[2]]; im = h73.copy(); im.putalpha(Image.fromarray(m)); trim(im).save(OUT + f'pose-{i}.webp', quality=92, method=6)
print('poses saved')

# ---------------------------------------------------------------- clean room plate from 72: books and hands removed
def wipe(img, mask, sig=(4, 9, 18, 36, 72)):
    a = np.asarray(img).astype(np.float32); m = np.clip(gblur(mask.astype(np.float32), 2.0), 0, 1)[..., None]; keep = 1 - (mask[..., None] > 0).astype(np.float32); out = a.copy()
    for s in sig:
        den = gblur(keep, s); est = gblur(out * keep, s) / np.maximum(den, 1e-3); ok = den > .015
        hole = (keep < .5); out = np.where(hole & ok, est, out); keep = np.where(hole & ok, 1.0, keep)
    return Image.fromarray(np.clip(a * (1 - m) + out * m, 0, 255).astype(np.uint8))
r72 = Image.open(D + '72.webp').convert('RGB'); W2, H2 = r72.size; arr = np.asarray(r72).astype(np.float32)
# rug rows below the books mirrored upward give the table surface behind/under them
rug = arr[770:925]; fill = np.concatenate([rug[::-1], rug, rug[::-1]], 0)[:420]
for_books = arr.copy(); y0, y1 = 430, 770
band = np.concatenate([rug[::-1], rug, rug[::-1], rug], 0)[:y1 - y0]; band = band * np.linspace(.55, .85, band.shape[0])[:, None, None]
for_books[y0:y1] = band
mk = Image.new('L', (W2, H2), 0); d = ImageDraw.Draw(mk)
d.polygon([(262, 430), (1475, 430), (1475, 770), (262, 770)], fill=255); mk = np.asarray(mk.filter(ImageFilter.GaussianBlur(6))).astype(np.float32)[..., None] / 255
step1 = arr * (1 - mk) + for_books * mk
hm = Image.new('L', (W2, H2), 0); d = ImageDraw.Draw(hm)
d.polygon([(120, 560), (370, 560), (390, 800), (300, 941), (0, 941), (0, 800), (110, 720)], fill=255)          # left hand + sleeve
d.polygon([(1370, 610), (1640, 610), (1671, 941), (1410, 941), (1380, 800)], fill=255)                          # right hand + sleeve
hm = np.asarray(hm) > 0
clean = wipe(Image.fromarray(np.clip(step1, 0, 255).astype(np.uint8)), hm)
clean.save(SP + 'plate72_clean.png'); clean.save(OUT + 'lib-room.webp', quality=90, method=6); print('plate', clean.size)
