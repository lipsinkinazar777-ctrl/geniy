"""Turn raw float renders (npy) into web-ready WebP frames + robot.json manifest.
usage: make_assets.py <frames_dir> <out_dir> [--dummy file.npy]"""
import sys, os, glob, json, re
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from PIL import Image
import post
import lens_proj

def name_for(yaw):
    y = int(round(yaw))
    if y == 0: return 'r_000.webp'
    return f"r_{'n' if y < 0 else 'p'}{abs(y):02d}.webp"

def main():
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    dummy = sys.argv[sys.argv.index('--dummy') + 1] if '--dummy' in sys.argv else None
    quality = int(sys.argv[sys.argv.index('--q') + 1]) if '--q' in sys.argv else 90
    items = []
    if dummy:
        items = [(-4.0, dummy), (0.0, dummy), (4.0, dummy)]
    else:
        for f in sorted(glob.glob(os.path.join(src, 'yaw_*.npy'))):
            yaw = float(re.search(r'yaw_([+-]?\d+\.\d)', f).group(1))
            items.append((yaw, f))
        items.sort()
    cache = {}
    yaws, files, lens = [], [], []
    for yaw, f in items:
        if f not in cache:
            img = np.load(f)
            rgba = post.process(img, denoise=not dummy)
            cache[f] = (rgba, post.lens_center(img))
        rgba, lc = cache[f]
        name = name_for(yaw)
        Image.fromarray(rgba, 'RGBA').save(os.path.join(out, name), 'WEBP', quality=quality, method=5, alpha_quality=100)
        yaws.append(yaw); files.append(name); lens.append(lens_proj.lens_xy(yaw))
        print(name, os.path.getsize(os.path.join(out, name)) // 1024, 'KB', lc, flush=True)
    json.dump({'yaws': yaws, 'files': files, 'lens': lens, 'w': 1400, 'h': 1500}, open(os.path.join(out, 'robot.json'), 'w'))

if __name__ == '__main__':
    main()
