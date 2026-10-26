#!/usr/bin/env python3
# The library fireplace with its flames put out: the plate around the firebox with the fire's light taken out (soft luminance cap: tongues sink into the dark
# firebox, logs keep their shape with a weak red ember glow), cross-faded over the live plate when the fire is switched off: src/img/lib-fireoff.webp (RGBA, soft edges)
import numpy as np, cv2, pathlib
from PIL import Image
root = pathlib.Path(__file__).resolve().parent.parent
SP = pathlib.Path('/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad')
X0, Y0, X1, Y1 = 700, 140, 1210, 480                       # patch box in the plate (1671x941)
im = cv2.imread(str(root / 'src/img/lib-room.webp')); reg = im[Y0:Y1, X0:X1].astype(np.float32); H, W = reg.shape[:2]
rng = np.random.default_rng(11)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); px, py = xx + X0, yy + Y0
def soft(box, f):                                             # feathered rectangle weight
    x0, y0, x1, y1 = box; m = np.zeros((H, W), np.float32); m[max(0, y0 - Y0):max(0, y1 - Y0), max(0, x0 - X0):max(0, x1 - X0)] = 1; return cv2.GaussianBlur(m, (0, 0), f)
opening = soft((862, 240, 1040, 408), 9)                      # the dark firebox where the flames stand
jambs = soft((820, 232, 1085, 430), 16)                       # its stone sides, lit by the fire
logs = soft((846, 372, 1050, 418), 5)                         # the log bed
b, g, r = reg[..., 0], reg[..., 1], reg[..., 2]; lum = (r * .3 + g * .59 + b * .11)
cap = 92 - 44 * jambs - 18 * opening + 0 * logs                # lower = darker
cap = cap * (1 - logs) + 70 * logs                              # embers are allowed a little more
k = np.minimum(1.0, cap / np.maximum(lum, 1))                   # hard knee ...
k = k + (1 - k) * 0.0
# smooth the knee so there is no visible edge where the cap starts to act
lum_s = cap * np.tanh(lum / cap) * (1.0)
scale = np.where(lum > 1, lum_s / np.maximum(lum, 1), 1.0)[..., None]
out = reg * scale
# the removed light also removes the orange cast: cool the opening and desaturate it a little
gray = out.mean(2, keepdims=True)
w = (opening * .75 + jambs * .35)[..., None]
out = out * (1 - w * .55) + gray * w * .55 * np.array([.98, .95, 1.06], np.float32)
# the log bed: whatever was white/yellow fire becomes charred wood with a red-brown tint (never blue-white)
lg_l = out.mean(2, keepdims=True); tint = np.array([.50, .74, 1.12], np.float32)           # BGR
out = out * (1 - logs[..., None] * .8) + lg_l * tint * (logs[..., None] * .8)
# embers: keep a faint red where the logs were glowing
ember = np.clip((r - g - 30) / 80, 0, 1) * logs
out[..., 2] = out[..., 2] + ember * 42; out[..., 1] = out[..., 1] + ember * 7
# a fire never leaves a blue-green cast: cap blue and green by red in the area the fire lit
wz = np.maximum(np.maximum(opening, jambs * .8), logs)[..., None]; Rr = out[..., 2:3]
capped = np.concatenate([np.minimum(out[..., 0:1], Rr * .72), np.minimum(out[..., 1:2], Rr * .90), Rr], 2)
out = out * (1 - wz) + capped * wz
# soot grain
out = out + cv2.GaussianBlur(rng.normal(0, 5, (H, W)).astype(np.float32), (0, 0), 1.1)[..., None] * (opening + jambs * .5)[..., None]
res = np.clip(out, 0, 255).astype(np.uint8)
al = np.ones((H, W), np.float32); fe = 34
for kx in range(fe):
    v = ((kx + 1) / (fe + 1)) ** 1.5
    al[kx, :] = np.minimum(al[kx, :], v); al[H - 1 - kx, :] = np.minimum(al[H - 1 - kx, :], v); al[:, kx] = np.minimum(al[:, kx], v); al[:, W - 1 - kx] = np.minimum(al[:, W - 1 - kx], v)
rgba = np.dstack([res[..., ::-1], (al * 255).astype(np.uint8)])
Image.fromarray(rgba, 'RGBA').save(root / 'src/img/lib-fireoff.webp', quality=88, method=6)
prev = im.copy(); pr = prev[Y0:Y1, X0:X1].astype(np.float32); prev[Y0:Y1, X0:X1] = (pr * (1 - al[..., None]) + res * al[..., None]).astype(np.uint8)
cv2.imwrite(str(SP / 'libfireoff_prev2.png'), cv2.resize(prev[200:480, 740:1180], None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)); print('ok', W, H)
