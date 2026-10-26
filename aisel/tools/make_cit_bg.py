#!/usr/bin/env python3
# Archive backdrop: the drawer plates are low-res crops, so they are baked as a soft-focus, dimmed, vignetted backdrop (depth of field) for the sharp parchment scroll in front.
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np, pathlib
src = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'img'
for k, size in (('p', (720, 1280)), ('l', (1280, 720))):
    im = Image.open(src / f'cit-{k}.webp').convert('RGB').resize(size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(5.5))
    im = ImageEnhance.Brightness(im).enhance(1.0); im = ImageEnhance.Color(im).enhance(1.08)
    a = np.asarray(im).astype(np.float32); h, w = a.shape[:2]; yy, xx = np.mgrid[0:h, 0:w]
    r = np.hypot((xx - w / 2) / (w * .62), (yy - h * .48) / (h * .62)); v = np.clip(1.1 - .5 * r ** 1.7, .4, 1)[..., None]
    a *= v; rng = np.random.default_rng(3); a += rng.normal(0, 2.2, a.shape[:2])[..., None]                      # a little film grain so the soft focus does not band
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(src / f'cit-bg-{k}.webp', quality=82, method=6)
    print(k, size)
