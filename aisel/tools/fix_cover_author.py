#!/usr/bin/env python3
# The six covers carried the old author line ("Алия Айсель") baked into the picture: the line is wiped (inpainted from the leather around it) and the new one is typeset in the same
# face and size and colour: src/img/book-*.webp. Run once on the originals (kept in tools/_cache/covers/).
import cv2, numpy as np, pathlib, shutil
from PIL import Image, ImageDraw, ImageFont
root = pathlib.Path(__file__).resolve().parent.parent; keep = root / 'tools/_cache/covers'; keep.mkdir(parents=True, exist_ok=True)
FONT = root / 'tools/_cache/CormorantGaramond-500.ttf'; TEXT = 'Хакимова Айсель'
BANDS = {'lantern': (408, 425, 161, 283), 'prince': (379, 393, 137, 241), 'souls': (370, 384, 121, 223), 'alice': (372, 387, 131, 239), 'ash': (371, 386, 129, 235), 'pride': (373, 388, 139, 242)}
for n, (y0, y1, x0, x1) in BANDS.items():
    src = keep / f'book-{n}.webp'; dst = root / f'src/img/book-{n}.webp'
    if not src.exists(): shutil.copy(dst, src)
    im0 = cv2.imread(str(src), cv2.IMREAD_UNCHANGED); alpha = im0[..., 3] if im0.shape[2] == 4 else None; im = im0[..., :3].copy(); h, w = im.shape[:2]; pad = 6
    ya, yb, xa, xb = y0 - pad, y1 + pad, x0 - pad, x1 + pad
    reg = im[ya:yb, xa:xb].astype(int); gold = ((reg[..., 2] > 120) & (reg[..., 1] > 85) & (reg[..., 2] > reg[..., 0] + 20)).astype(np.uint8) * 255
    gold = cv2.dilate(gold, np.ones((5, 5), np.uint8)); mask = np.zeros((h, w), np.uint8); mask[ya:yb, xa:xb] = gold
    clean = cv2.inpaint(im, mask, 4, cv2.INPAINT_TELEA)
    # colour of the old lettering
    old = im[y0:y1, x0:x1].reshape(-1, 3).astype(int); sel = old[(old[:, 2] > 150) & (old[:, 1] > 110)]
    col = np.median(sel, 0) if len(sel) else np.array([100, 185, 225])
    S = 6; size = int((y1 - y0) / 0.74 * S); font = ImageFont.truetype(str(FONT), size)
    bb = font.getbbox(TEXT); tw, th = bb[2] - bb[0], bb[3] - bb[1]
    layer = Image.new('L', (tw + 40, th + 40), 0); ImageDraw.Draw(layer).text((20 - bb[0], 20 - bb[1]), TEXT, font=font, fill=255)
    tw_px = layer.width // S; maxw = (x1 - x0) * 1.55
    sc = min(1.0, maxw / (tw / S)); lw, lh = int(layer.width / S * sc), int(layer.height / S * sc)
    a = np.asarray(layer.resize((lw, lh), Image.LANCZOS)).astype(np.float32) / 255
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2; px, py = cx - lw // 2, cy - lh // 2
    out = clean.astype(np.float32)
    yy = np.linspace(1.12, .82, lh)[:, None, None]; fill = (col[None, None, :] * yy).clip(0, 255)
    sh = cv2.GaussianBlur(a, (0, 0), 1.1)[..., None]
    r = out[py:py + lh, px:px + lw]; r[...] = r * (1 - sh * .45)                      # a soft dark edge like the printed lettering
    r[...] = r * (1 - a[..., None]) + fill * a[..., None]
    res = np.clip(out, 0, 255).astype(np.uint8)
    if alpha is not None: res = np.dstack([res, alpha])                                # the cut-out edges (transparency) are kept
    cv2.imwrite(str(dst), res, [cv2.IMWRITE_WEBP_QUALITY, 92]); print(n, 'ok', (lw, lh), res.shape)
