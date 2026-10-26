#!/usr/bin/env python3
# The entrance: the old film's masked man is gone. The film now goes: the same misty graveyard (first 3.2 s of the original), it melts into the princess and her knight
# (the user's art, slow push-in, falling rose petals), the knight's gauntlet and her hand meet (push-in, light gathers), the light floods the screen and turns into the
# first seconds of the original hall (the gate opens into the candlelit hall), then the camera keeps flying in. Same length (11.83 s), same frame format as before.
import cv2, numpy as np, subprocess, pathlib, shutil, sys
root = pathlib.Path(__file__).resolve().parent.parent; C = root / 'tools/_cache'; OUT = root / 'src/video'; TMP = pathlib.Path('/tmp/introbuild'); shutil.rmtree(TMP, ignore_errors=True); TMP.mkdir()
W, H, FPS, N = 720, 1280, 24, 284
rng = np.random.default_rng(21)

# ---- sources
orig = []; v = cv2.VideoCapture(str(C / 'intro-original.mp4'))
while True:
    ok, f = v.read()
    if not ok: break
    orig.append(f)
assert len(orig) == N, len(orig)
P1 = cv2.imread(str(C / 'intro-princess.webp')); P2 = cv2.imread(str(C / 'intro-hands.webp'))
for im in (P1, P2):                                           # soften compression blocks before the push-in magnifies them
    pass
P1 = cv2.fastNlMeansDenoisingColored(P1, None, 3, 3, 5, 15); P2 = cv2.fastNlMeansDenoisingColored(P2, None, 3, 3, 5, 15)

def kb(img, cx, cy, z):
    """cover-fit the still to the 9:16 frame, zoomed by z around (cx, cy) (source pixels)"""
    h, w = img.shape[:2]; s = max(W / w, H / h) * z
    M = np.array([[s, 0, W / 2 - cx * s], [0, s, H / 2 - cy * s]], np.float32)
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
vig = (1 - np.clip(((xx - W / 2) / (W * .62)) ** 2 + ((yy - H / 2) / (H * .62)) ** 2, 0, 1) ** 1.3 * .78)[..., None]
def finish(f, t, warm=1.0, bloom=.22):
    f = f.astype(np.float32); b = cv2.GaussianBlur(np.clip(f - 150, 0, 255), (0, 0), 22); f = f + b * bloom * 3
    f *= np.array([.92, .98, 1.04], np.float32) * (1 - warm) + np.array([.86, .96, 1.08], np.float32) * warm      # BGR: a little gold
    f *= vig; f += rng.normal(0, 3.2, f.shape[:2]).astype(np.float32)[..., None]
    return np.clip(f, 0, 255)

# ---- petals
PET = [dict(x=rng.uniform(-100, W + 100), y=rng.uniform(-200, H), vx=rng.uniform(-30, -6), vy=rng.uniform(40, 110), s=rng.uniform(5, 15), ph=rng.uniform(0, 6.3), w=rng.uniform(1, 2.6), rot=rng.uniform(0, 6.3), vr=rng.uniform(-3, 3), c=(rng.integers(40, 80), rng.integers(40, 90), rng.integers(170, 235))) for _ in range(46)]
def petals(f, t):
    ov = np.zeros((H, W, 4), np.float32)
    for p in PET:
        x = (p['x'] + p['vx'] * t + 26 * np.sin(p['ph'] + p['w'] * t)) % (W + 200) - 100; y = (p['y'] + p['vy'] * t) % (H + 300) - 150; a = p['rot'] + p['vr'] * t; sz = p['s']
        sq = abs(np.sin(p['ph'] + p['w'] * t * 1.3)) * .7 + .3                                        # the petal turns in the air
        pts = cv2.ellipse2Poly((int(x), int(y)), (int(sz), max(1, int(sz * .62 * sq))), int(np.degrees(a)), 0, 360, 24)
        cv2.fillConvexPoly(ov, pts, (*[float(c) for c in p['c']], 210 if sz < 11 else 170), lineType=cv2.LINE_AA)
    ov[..., :3] = cv2.GaussianBlur(ov[..., :3], (0, 0), .9); al = (cv2.GaussianBlur(ov[..., 3], (0, 0), .9) / 255)[..., None]
    return f * (1 - al) + ov[..., :3] * al

def glow(f, cx, cy, r, k, col=(150, 215, 255)):
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r; g = np.clip(1 - d, 0, 1) ** 2.2 * k
    return f + g[..., None] * np.array(col, np.float32)

def blend(a, b, k): return a.astype(np.float32) * (1 - k) + b.astype(np.float32) * k
def ease(k): k = np.clip(k, 0, 1); return k * k * (3 - 2 * k)

L1, L2 = 94, 72                                                # frames of the princess shot / the hands shot
def princess(k):
    u = k / L1; z = 1.0 + .30 * ease(u); cx = 372 + 58 * ease(u); cy = 470 - 110 * ease(u)
    f = finish(kb(P1, cx, cy, z), k / FPS); f = petals(f, k / FPS)
    return glow(f, W * .56, H * (.46 - .02 * u), 340, .10 + .06 * np.sin(k / 9))
def hands(k):
    u = k / L2; z = 1.0 + .26 * ease(u); cx = 372 - 6 * u; cy = 560 + 40 * ease(u)
    f = finish(kb(P2, cx, cy, z), k / FPS, bloom=.3)
    s = 1.0; px, py = W * .50, H * (.455 - .03 * u)                                       # where the fingertips meet
    f = glow(f, px, py, 170 + 330 * ease(u), .25 + .95 * ease(u) ** 1.5, (170, 225, 255))
    return glow(f, px, py, 60 + 40 * ease(u), .5 * ease(u), (230, 245, 255))
GOLD = np.array([170, 218, 255], np.float32)                   # BGR warm white

def frame(i):
    if i < 64: return orig[i].astype(np.float32)
    if i < 74: return blend(orig[i], princess(i - 64), ease((i - 63) / 10))
    if i < 158: return princess(i - 64)
    if i < 166: return blend(princess(i - 64), hands(i - 158), ease((i - 157) / 8))
    if i < 222: return hands(i - 158)
    if i < 230: return blend(hands(i - 158), np.full((H, W, 3), GOLD, np.float32), ease((i - 221) / 8) ** 1.2)
    hi = i - 230; h = orig[min(262 + hi, N - 1)].astype(np.float32)
    if i >= 252:                                                # the camera keeps flying in after the last frame of the film
        u = (i - 251) / 32; z = 1 + .34 * ease(u); M = cv2.getRotationMatrix2D((W / 2, H * .52), 0, z); h = cv2.warpAffine(orig[N - 1], M, (W, H), flags=cv2.INTER_CUBIC).astype(np.float32)
    return blend(np.full((H, W, 3), GOLD, np.float32), h, ease(hi / 9))

for i in range(N):
    cv2.imwrite(str(TMP / f'f{i:04d}.png'), np.clip(frame(i), 0, 255).astype(np.uint8))
    if i % 40 == 0: print('frame', i, file=sys.stderr)
print('frames done')
