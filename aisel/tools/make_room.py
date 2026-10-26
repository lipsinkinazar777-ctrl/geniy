#!/usr/bin/env python3
# Prepares the first-person room image: crops the phone bezel, removes the baked-in page text and the baked flame
# (the flame is re-created live on a canvas), upscales 2x and writes src/img/room.webp (+ coordinates note).
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
SRC = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/images/32.webp'
CROP = (48, 30, 1232, 690)
im = Image.open(SRC).convert('RGB'); W, H = im.size
a = np.asarray(im).astype(np.float32)

def gblur(x, s):
    r = int(s * 3); k = np.exp(-(np.arange(-r, r + 1) ** 2) / (2 * s * s)); k /= k.sum()
    for ax in (0, 1):
        pad = [(0, 0)] * x.ndim; pad[ax] = (r, r); p = np.pad(x, pad, mode='edge'); n = x.shape[ax]; o = np.zeros_like(x)
        for i, w in enumerate(k): o += w * np.take(p, np.arange(i, i + n), axis=ax)
        x = o
    return x

def poly_mask(pts):
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(pts, fill=255); return m

def fill(a, mask, sig=(6, 14, 30)):
    m = (np.asarray(mask).astype(np.float32) / 255.0)[..., None]; out = a.copy(); keep = 1 - m
    for s in sig:                                   # normalised convolution: fill holes from surrounding pixels at growing scales
        num = gblur(out * keep, s); den = gblur(keep, s)
        est = num / np.maximum(den, 1e-3); ok = (den > .02)
        out = np.where((m > .01) & ok, est, out); keep = np.where((m > .01) & ok, 1.0, keep)
    return out

# whole page interiors are rebuilt as smooth lit parchment (text and flame vanish), the stone ring of the fire stays
left = poly_mask([(405, 207), (632, 188), (682, 284), (747, 484), (715, 502), (461, 549), (420, 555), (402, 319)])
right = poly_mask([(650, 188), (786, 135), (856, 142), (933, 207), (1045, 378), (1034, 391), (756, 487), (741, 467), (682, 290)])
pm = np.maximum(np.asarray(left), np.asarray(right)).astype(np.float32)
pmi = Image.fromarray(pm.astype(np.uint8), 'L').filter(ImageFilter.MinFilter(9)).filter(ImageFilter.GaussianBlur(2))
stones = Image.new('L', (W, H), 0); ImageDraw.Draw(stones).ellipse([735, 292, 862, 350], fill=255)
mask = np.clip(np.asarray(pmi).astype(np.float32) - np.asarray(stones.filter(ImageFilter.GaussianBlur(4))).astype(np.float32), 0, 255)
rng = np.random.default_rng(7)
def fnoise(sc):
    n = rng.normal(0, 1, (H // sc + 2, W // sc + 2)).astype(np.float32); return np.asarray(Image.fromarray(n, 'F').resize((W, H), Image.BICUBIC))
sel = (pm > 128) & (a.mean(2) > 185); base = a[sel].mean(0) if sel.any() else np.array([238, 205, 150], np.float32)   # parchment colour taken from the brightest page pixels
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); d = np.hypot(xx - 797, (yy - 318) * 1.25)
light = .50 + .46 * np.exp(-(d / 280) ** 2)                                  # warm pool of light around the fire
inner = gblur(np.asarray(pmi).astype(np.float32) / 255.0, 22); edge = .62 + .38 * np.clip(inner * 1.5, 0, 1)
gut = np.exp(-((xx - (680 + (yy - 190) * .25)) / 30) ** 2) * .22              # soft shade along the gutter
tex = 1 + fnoise(60) * .045 + fnoise(18) * .03 + fnoise(6) * .018
page = base[None, None, :] * (light * edge * (1 - gut) * tex)[..., None]
m3 = (mask / 255.0)[..., None]; out = a * (1 - m3) + np.clip(page, 0, 255) * m3
res = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).crop(CROP)
res = res.resize((res.width * 2, res.height * 2), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.6, 70, 2))
res.save('/home/user/geniy/aisel/src/img/room.webp', quality=82, method=6)
print(res.size)
