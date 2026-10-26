#!/usr/bin/env python3
# The alchemy scenes are stills of the user's own film (cauldron + table). The product bottle and the witch hand are inpainted away;
# the green glow is then re-coloured per mood (selective hue shift, candles and wood stay warm) so moods can be cross-faded.
import cv2, numpy as np, pathlib, subprocess, sys
root = pathlib.Path(__file__).resolve().parent.parent; out = root / 'src' / 'img'; tmp = pathlib.Path('/tmp/labp'); tmp.mkdir(exist_ok=True)
VID = sys.argv[1] if len(sys.argv) > 1 else '/root/.claude/uploads/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/14bcfdac-_____________Social_1.mp4'
def frame(t, name, tail=False):
    cmd = ['ffmpeg', '-y', '-loglevel', 'error'] + (['-sseof', str(-t)] if tail else ['-ss', str(t)]) + ['-i', VID, '-frames:v', '1', str(tmp / name)]
    subprocess.run(cmd, check=True); return cv2.imread(str(tmp / name))

def cauldron():
    im = frame(0.05, 'c.png'); h, w = im.shape[:2]; m = np.zeros((h, w), np.uint8)
    cv2.fillPoly(m, [np.array([[398,442],[470,448],[468,520],[462,610],[452,700],[432,770],[350,772],[336,740],[352,650],[372,560],[385,490]])], 255)
    cv2.fillPoly(m, [np.array([[0,575],[120,590],[255,590],[296,640],[240,700],[150,712],[60,690],[0,700]])], 255)
    m = cv2.dilate(m, np.ones((11, 11), np.uint8)); o = cv2.inpaint(im, m, 11, cv2.INPAINT_TELEA)
    # the pointed leftover where the bottle met the liquid is covered with liquid copied from the left
    patch = o[735:800, 200:330].copy(); mk = np.zeros((65, 130), np.float32); cv2.ellipse(mk, (65, 32), (58, 26), 0, 0, 360, 1, -1); mk = cv2.GaussianBlur(mk, (0, 0), 9)[..., None]
    reg = o[735:800, 330:460].astype(np.float32); o[735:800, 330:460] = (reg * (1 - mk) + patch.astype(np.float32) * mk).astype(np.uint8)
    return o

def table():
    im = frame(0.12, 't.png', tail=True); h, w = im.shape[:2]; m = np.zeros((h, w), np.uint8)
    cv2.rectangle(m, (300, 490), (432, 905), 255, -1); cv2.fillPoly(m, [np.array([[286,205],[446,205],[456,340],[424,500],[308,500],[282,380]])], 255); cv2.ellipse(m, (368, 888), (100, 28), 0, 0, 360, 255, -1)
    m = cv2.dilate(m, np.ones((11, 11), np.uint8))
    small = cv2.resize(im, (w // 3, h // 3), interpolation=cv2.INTER_AREA); ms = cv2.resize(m, (w // 3, h // 3), interpolation=cv2.INTER_NEAREST)
    big = cv2.resize(cv2.inpaint(small, ms, 12, cv2.INPAINT_TELEA), (w, h), interpolation=cv2.INTER_CUBIC)
    # above the cap the wall is nearly flat and dark: fill each row by interpolating between the clean pixels on both sides (keeps the shelf boards' level and the dark mood)
    rows = big.copy().astype(np.float32); xa, xb = 258, 484
    for y in range(190, 810):
        a = im[y, xa - 12:xa].astype(np.float32).mean(0); b = im[y, xb:xb + 12].astype(np.float32).mean(0); t = np.linspace(0, 1, xb - xa)[:, None]; rows[y, xa:xb] = a * (1 - t) + b * t
    rows = cv2.GaussianBlur(rows, (0, 0), sigmaX=4, sigmaY=14); ym = np.zeros((h, w), np.float32); ym[190:800, xa:xb] = 1; ym[790:812, xa:xb] *= np.linspace(1, 0, 22)[:, None]; ym = cv2.GaussianBlur(ym, (0, 0), 12)[..., None]; big = (big * (1 - ym) + rows * ym)
    # the table top: its planks run toward us, so the clean wood just below the bottle's footprint is carried up over it
    top = big.copy(); SH = 112
    for y in range(806, 922): top[y, 286:452] = im[min(y + SH, h - 1), 286:452]
    wt_ = np.zeros((h, w), np.float32); wt_[806:922, 286:452] = 1; wt_[806:836, 286:452] *= np.linspace(0, 1, 30)[:, None]; wt_ = cv2.GaussianBlur(wt_, (0, 0), 6)[..., None]; big = big * (1 - wt_) + top * wt_
    mf = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 7)[..., None]; o = (im * (1 - mf) + big * mf).astype(np.float32)
    # the aura the bottle threw on both sides is a green stain after inpainting: pull it back toward the surrounding dark
    g = cv2.cvtColor(o.astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32); g[..., 1] *= (1 - .45 * mf[..., 0]); g[..., 2] *= (1 - .18 * mf[..., 0]); o = cv2.cvtColor(np.clip(g, 0, [180, 255, 255]).astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
    rng = np.random.default_rng(5); o += rng.normal(0, 2.4, o.shape[:2])[..., None] * mf                                   # film grain only where the fill is, so it matches the video
    return np.clip(o, 0, 255).astype(np.uint8)

MOODS = {'green': None, 'cozy': 36, 'fantasy': 268, 'detective': 188, 'romance': 335, 'melancholy': 222, 'adventure': 142}
def recolor(im, ht):
    if ht is None: return im
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(np.float32); H = hsv[..., 0] * 2; S = hsv[..., 1] / 255
    wh = np.clip(1 - (np.abs(H - 125) - 26) / 26, 0, 1); ws = np.clip((S - .12) / .28, 0, 1); wt = (wh * ws)
    wt = cv2.GaussianBlur(wt, (0, 0), 1.2)
    hsv[..., 0] = ((H + wt * (ht - 125)) % 360) / 2; hsv[..., 1] = np.clip(hsv[..., 1] * (1 + wt * .08), 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

for name, fn in (('c', cauldron), ('t', table)):
    base = fn(); cv2.imwrite(str(tmp / f'{name}_base.png'), base)
    for mood, ht in MOODS.items():
        v = recolor(base, ht); p = out / f'lab-{name}-{mood}.webp'
        # 1.5x with lanczos + a little unsharp + fine grain: the page draws it at 720x1280 css px, so retina screens get real extra pixels and edges stay crisp on large windows
        big = cv2.resize(v, (1080, 1920), interpolation=cv2.INTER_LANCZOS4); bl = cv2.GaussianBlur(big, (0, 0), 1.5); big = cv2.addWeighted(big, 1.55, bl, -.55, 0)
        big = np.clip(big.astype(np.float32) + np.random.default_rng(9).normal(0, 1.4, big.shape[:2])[..., None], 0, 255).astype(np.uint8)
        cv2.imwrite(str(p), big, [cv2.IMWRITE_WEBP_QUALITY, 78]); print(p.name, p.stat().st_size // 1024, 'KB')
