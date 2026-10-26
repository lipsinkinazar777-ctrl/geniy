#!/usr/bin/env python3
# Anchor points for the hand sprites: fingertip, wrist pivot (where the sleeve leaves the frame), cuff width and, for the grasp poses, the contact edge.
import numpy as np, json
from PIL import Image
O = '/home/user/geniy/aisel/src/img/'
def info(name, edge=None):
    im = Image.open(O + name + '.webp').convert('RGBA'); a = np.asarray(im)[..., 3] > 40; H, W = a.shape
    ys, xs = np.where(a); top = ys.min(); rows = a[top:top + max(3, int(H * .025))]; ty, tx = np.where(rows); tip = [float(tx.mean()), float(top + ty.mean())]
    bot = a[int(H * .96):]; by, bx = np.where(bot); piv = [float(bx.mean()), float(H * .96 + by.mean())]; cuff = float(bx.max() - bx.min())
    d = {'w': W, 'h': H, 'tip': [round(v) for v in tip], 'piv': [round(v) for v in piv], 'cuff': round(cuff)}
    if edge == 'right':   # rightmost point among the upper 70% rows
        sub = a[:int(H * .7)]; yy, xx = np.where(sub); i = xx.argmax(); d['edge'] = [int(xx.max()), int(np.median(yy[xx > xx.max() - 6]))]
    if edge == 'left':
        sub = a[:int(H * .7)]; yy, xx = np.where(sub); d['edge'] = [int(xx.min()), int(np.median(yy[xx < xx.min() + 6]))]
    return d
ART = {'hand-l': info('hand-l'), 'hand-r': info('hand-r'), 'pose-2': info('pose-2', 'right'), 'pose-3': info('pose-3', 'left'), 'pose-4': info('pose-4'), 'pose-0': info('pose-0'), 'pose-1': info('pose-1'), 'pose-5': info('pose-5')}
for k, v in ART.items(): print(k, v)
bk = json.load(open('/home/user/geniy/aisel/src/js/bookart.json'))
open('/home/user/geniy/aisel/src/js/bookart.js', 'w').write('A.HANDART = ' + json.dumps(ART) + ';\nA.BOOKART = ' + json.dumps(bk) + ';\n')
