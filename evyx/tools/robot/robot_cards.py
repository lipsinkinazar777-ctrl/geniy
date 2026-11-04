"""Cards derived from the robot: a turned portrait and a lens macro.
usage: robot_cards.py <frames_dir> <meshes_dir> <out_dir> [threads]"""
import os, sys, glob
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import numpy as np, cv2
from PIL import Image
import post
import render as R
import cards as K
import mitsuba as mi
import drjit as dr
from mitsuba import ScalarTransform4f as T

def backdrop(W, H, sx=0.5, sy=0.42):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - sx*W)/(0.78*W))**2 + ((yy - sy*H)/(0.62*H))**2)
    k = np.exp(-r*r*2.6)
    return np.stack([0.030 + 0.19*k, 0.026 + 0.140*k, 0.020 + 0.078*k], -1)

def over(bg, rgba):
    rgb = rgba[..., :3].astype(np.float32)/255.0; a = rgba[..., 3:4].astype(np.float32)/255.0
    return bg*(1 - a) + rgb*a

def finish(arr):
    rng = np.random.default_rng(5)
    arr = arr + rng.normal(0, 0.006, size=arr.shape[:2] + (1,))
    return (np.clip(arr, 0, 1)*255 + 0.5).astype(np.uint8)

def presenter(frames, out):
    f = os.path.join(frames, 'yaw_+024.0.npy')
    img = np.load(f); rgba = post.process(img, fade_from=0.74, fade_to=0.93)
    H, W = rgba.shape[:2]
    cw = int(H*9/16); cx = int(W*0.5)
    x0 = max(0, min(W - cw, cx - cw//2))
    crop = rgba[:, x0:x0 + cw]
    crop = cv2.resize(crop, (720, 1280), interpolation=cv2.INTER_AREA)
    bg = backdrop(720, 1280, 0.5, 0.40)
    Image.fromarray(finish(over(bg, crop))).save(os.path.join(out, 'ai-presenter.png'))

def lens_macro(meshes, out, threads):
    dr.set_thread_count(threads)
    W, H, spp, passes = 720, 1280, 24, 12
    sc = R.build_scene(meshes, yaw=-14.0, W=W, H=H, spp=spp,
                       cam={'origin': [0.55, 0.12, 3.1], 'target': [0.0, 0.02, 0.5], 'fov': 21.0})
    img = R.render(sc, spp=spp, passes=passes, seed0=77)
    np.save(os.path.join(out, 'creator-lens.npy'), img.astype(np.float32))
    rgba = post.process(img, exposure=1.2, fade_from=2.0, fade_to=3.0)
    bg = backdrop(W, H, 0.5, 0.45)
    Image.fromarray(finish(over(bg, rgba))).save(os.path.join(out, 'creator-lens.png'))

if __name__ == '__main__':
    frames, meshes, out = sys.argv[1], sys.argv[2], sys.argv[3]
    th = int(sys.argv[4]) if len(sys.argv) > 4 else 4
    os.makedirs(out, exist_ok=True)
    presenter(frames, out); print('presenter done', flush=True)
    lens_macro(meshes, out, th); print('lens done', flush=True)
