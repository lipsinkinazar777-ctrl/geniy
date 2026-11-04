import sys, os, json, glob
sys.path.insert(0, 'robot')
import numpy as np
import cv2
from PIL import Image

def aces(x):
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x*(a*x + b))/(x*(c*x + d) + e), 0, 1)

def to_srgb(x):
    return np.where(x <= 0.0031308, 12.92*x, 1.055*np.power(np.maximum(x, 1e-9), 1/2.4) - 0.055)

def process(img, exposure=1.25, bloom=0.16, denoise=True, fade_from=0.68, fade_to=0.90):
    rgb = img[..., :3].astype(np.float32); a = img[..., 3].astype(np.float32)
    H, W = a.shape
    # un-premultiply check done empirically: Mitsuba rgba is NOT premultiplied -> composite with alpha later
    lin = rgb*exposure
    # bloom on very bright pixels (lens core, gold glints)
    hot = np.maximum(lin - 1.2, 0)
    glow = cv2.GaussianBlur(hot, (0, 0), sigmaX=W*0.012) * 1.6 + cv2.GaussianBlur(hot, (0, 0), sigmaX=W*0.035) * 1.1
    lin = lin + bloom*glow
    out = to_srgb(aces(lin))
    out8 = (np.clip(out, 0, 1)*255).astype(np.uint8)
    if denoise:
        out8 = cv2.fastNlMeansDenoisingColored(out8, None, 3, 3, 5, 15)
    # soft fade of the cut-off bottom of the bust
    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    fade = 1.0 - np.clip((yy - fade_from)/(fade_to - fade_from), 0, 1)
    fade = fade*fade*(3 - 2*fade)
    a2 = np.clip(a, 0, 1)*fade
    a8 = (a2*255 + 0.5).astype(np.uint8)
    rgba = np.dstack([out8, a8])
    return rgba

def lens_center(img):
    lum = img[..., :3].max(axis=2)
    H, W = lum.shape
    sub = lum[int(H*0.25):int(H*0.60), int(W*0.25):int(W*0.80)]
    thr = max(sub.max()*0.5, 4.0)
    ys, xs = np.nonzero(sub > thr)
    if len(xs) == 0: return None
    return [float((xs.mean() + W*0.25)/W), float((ys.mean() + H*0.25)/H)]

if __name__ == '__main__':
    src = sys.argv[1]; dst = sys.argv[2]
    img = np.load(src)
    rgba = process(img, denoise=(len(sys.argv) < 4 or sys.argv[3] != 'nodenoise'))
    Image.fromarray(rgba, 'RGBA').save(dst)
    print('lens', lens_center(img), rgba.shape)
