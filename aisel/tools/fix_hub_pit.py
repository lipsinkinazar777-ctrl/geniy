#!/usr/bin/env python3
# The hub fire pit: the old plate had a brown smear where the flame was wiped. The pit is rebuilt from the original reference (image 43):
# the fire's light is taken out of the flame zone (soft luminance cap), blue-white flame cores become charred wood, the logs keep a weak red ember glow.
# The live flame sprite is drawn over it when the fire is on, and a clean cold hearth shows when it is off.
import numpy as np, cv2, pathlib, shutil
root = pathlib.Path(__file__).resolve().parent.parent
D = pathlib.Path('/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/images/'); SP = pathlib.Path('/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad')
hub_path = root / 'src/img/hub.webp'; keep = root / 'tools/_cache/hub-before-pit.webp'
if not keep.exists(): shutil.copy(hub_path, keep)
hub = cv2.imread(str(keep)); src = cv2.imread(str(D / '43.webp'))
RX0, RY0, RX1, RY1 = 900, 360, 1280, 719                      # working region in the reference (1280x719)
reg = src[RY0:RY1, RX0:RX1].astype(np.float32); H, W = reg.shape[:2]; rng = np.random.default_rng(5)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
def box(b, f):
    x0, y0, x1, y1 = b; m = np.zeros((H, W), np.float32); m[y0 - RY0:y1 - RY0, x0 - RX0:x1 - RX0] = 1; return cv2.GaussianBlur(m, (0, 0), f)
FP = [(150,420),(130,320),(150,250),(200,200),(260,130),(330,60),(380,70),(390,120),(400,200),(430,300),(420,370),(330,430),(200,440)]   # the flame outline used for the live sprite
pm = np.zeros((H, W), np.uint8); cv2.fillPoly(pm, [np.array([(920 + x / 2 - RX0, 380 + y / 2 - RY0) for x, y in FP], np.int32)], 255)
pm = cv2.dilate(pm, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
flame = cv2.GaussianBlur(pm.astype(np.float32) / 255, (0, 0), 6)
logs = box((985, 538, 1140, 595), 4) * flame                  # the log bed at the foot of the flame
# inside the stone ring the cold hearth is dark; above its back rim the flame stood in front of the leather and the page edge, so there the background is continued from the surroundings
IN = [(985, 506), (1113, 466), (1122, 523), (1142, 568), (1112, 604), (985, 616)]
im_ = np.zeros((H, W), np.uint8); cv2.fillPoly(im_, [np.array([(x - RX0, y - RY0) for x, y in IN], np.int32)], 255)
inside = cv2.GaussianBlur(im_.astype(np.float32) / 255, (0, 0), 12)
hole = cv2.dilate(pm, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))
bg8 = cv2.inpaint(reg.astype(np.uint8), hole, 14, cv2.INPAINT_NS)
# the page edge behind the flame is a stack of fine diagonal lines: continue them by cloning the clean part of the stack along its own direction
SHX, SHY = 62, -9                                                   # (reference pixels) along the stripes
srcsh = np.roll(np.roll(reg.astype(np.uint8), SHX, axis=1), SHY, axis=0)
left_part = hole.copy(); left_part[:, (1066 - RX0):] = 0; left_part[(470 - RY0):, :] = 0       # only the page-edge part of the hole
lp = cv2.morphologyEx(left_part, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
if lp.any():
    ys_, xs_ = np.where(lp > 0); cx_, cy_ = int((xs_.min() + xs_.max()) / 2), int((ys_.min() + ys_.max()) / 2)
    try: bg8 = cv2.seamlessClone(srcsh, bg8, lp, (cx_, cy_), cv2.NORMAL_CLONE)
    except Exception as e: print('clone failed', e)
bg = bg8.astype(np.float32)
bg = bg + cv2.GaussianBlur(rng.normal(0, 6, (H, W)).astype(np.float32), (0, 0), .9)[..., None]
b, g, r = reg[..., 0], reg[..., 1], reg[..., 2]; lum = r * .3 + g * .59 + b * .11
cap = 255 * (1 - flame) + flame * (inside * 66 + (1 - inside) * 255); cap = cap * (1 - logs) + 82 * logs
lum_s = cap * np.tanh(lum / cap)
out = reg * np.where(lum > 1, lum_s / np.maximum(lum, 1), 1.0)[..., None]
# no blue-white fire left: cap blue and green by red inside the zone, then tint the zone like charred wood
wz = flame[..., None]; Rr = out[..., 2:3]
capped = np.concatenate([np.minimum(out[..., 0:1], Rr * .62), np.minimum(out[..., 1:2], Rr * .82), Rr], 2)
out = out * (1 - wz) + capped * wz
lm = out.mean(2, keepdims=True); tint = np.array([.50, .74, 1.12], np.float32)
tint2 = np.array([.46, .70, 1.15], np.float32)
out = out * (1 - wz * .7) + lm * tint2 * (wz * .7)
above = (flame * (1 - inside))[..., None]
out = out * (1 - above) + bg * above
ember = np.clip((r - g - 30) / 80, 0, 1) * logs
out[..., 2] += ember * 36; out[..., 1] += ember * 6
out += cv2.GaussianBlur(rng.normal(0, 5, (H, W)).astype(np.float32), (0, 0), 1.0)[..., None] * (flame[..., None] * .8)
res = np.clip(out, 0, 255).astype(np.uint8)
# to the hub's scale, treated like the rest of the plate (lanczos + a little unsharp + grain)
big = cv2.resize(res, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_LANCZOS4); bl = cv2.GaussianBlur(big, (0, 0), 1.2); big = cv2.addWeighted(big, 1.4, bl, -.4, 0)
big = np.clip(big.astype(np.float32) + rng.normal(0, 1.2, big.shape), 0, 255).astype(np.uint8)
HX0, HY0 = int(RX0 * 1.5), int(RY0 * 1.5); h2, w2 = big.shape[:2]; h2 = min(h2, hub.shape[0] - HY0); w2 = min(w2, hub.shape[1] - HX0); big = big[:h2, :w2]
al = np.ones((h2, w2), np.float32); fe = 40
for k in range(fe):
    v = (k + 1) / (fe + 1); al[k, :] = np.minimum(al[k, :], v); al[:, k] = np.minimum(al[:, k], v)       # feather only the top and left edges (the other two are the image border)
al = np.minimum(al, 1 - cv2.GaussianBlur(np.zeros((h2, w2), np.float32), (0, 0), 1))
cur = hub[HY0:HY0 + h2, HX0:HX0 + w2].astype(np.float32); hub[HY0:HY0 + h2, HX0:HX0 + w2] = (cur * (1 - al[..., None]) + big * al[..., None]).astype(np.uint8)
cv2.imwrite(str(hub_path), hub, [cv2.IMWRITE_WEBP_QUALITY, 90])
cv2.imwrite(str(SP / 'hubpit_new11.png'), cv2.resize(hub[560:1020, 1340:1900], None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)); print('ok')
