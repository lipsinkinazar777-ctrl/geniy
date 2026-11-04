import numpy as np
from sdflib import *

Z0 = 0.54      # lens bezel plane (z)

def _recess(x, y, z):
    t = z - Z0
    r = vlen(x, y)
    seat = np.maximum(r - 0.322, -(t + 0.045))
    well = np.maximum(r - 0.195, -(t + 0.30))
    return np.minimum(seat, well)

def head_shell(x, y, z):
    cran = ellipsoid(x, y, z, (0, 0.12, -0.10), (0.60, 0.64, 0.66))
    face = rbox(x, y, z, (0, -0.06, 0.24), (0.47, 0.50, 0.34), 0.30)
    d = smin(cran, face, 0.32)
    jaw = ellipsoid(x, y, z, (0, -0.44, 0.00), (0.40, 0.28, 0.46))
    d = smin(d, jaw, 0.22)
    d = smax(d, z - 0.58, 0.20)                   # flatten the front: designed faceplate
    for s in (-1, 1):
        xx, rr = axes(x, y, z, 'x', (s*0.60, 0.02, -0.04))
        ear = np.maximum(rr - 0.225, np.abs(xx) - 0.105)
        ear = smax(ear, np.abs(xx) - 0.105, 0.03)
        d = smin(d, ear, 0.06)
        rec = np.maximum(rr - 0.150, -(s*(x - s*0.705) + 0.026))
        d = smax(d, -np.where(s*x > 0, rec, 1.0), 0.010)
    d = smax(d, -_recess(x, y, z), 0.03)
    return d

def _seam(x, y, z):
    return (y - 0.60) + 0.16*z

def head_cap(x, y, z):
    return np.maximum(head_shell(x, y, z), -_seam(x, y, z))

def head_base(x, y, z):
    return np.maximum(head_shell(x, y, z), _seam(x, y, z))

def gold_bezel(x, y, z):
    th = theta(x, y, z, 'z', (0, 0, Z0))
    def bez(rho, t):
        rho2 = rho + 0.0035*np.cos(84*th)
        return rbox2d(rho2, t, 0.287, 0.030, 0.033, 0.046, 0.016)
    ring1 = revolve(x, y, z, 'z', (0, 0, Z0), bez)
    ring2 = revolve(x, y, z, 'z', (0, 0, Z0), lambda rho, t: rbox2d(rho, t, 0.172, 0.018, 0.013, 0.030, 0.007))
    return np.minimum(ring1, ring2)

def make_ear_gold(s):
    def f(x, y, z):
        xx, rr = axes(x, y, z, 'x', (s*0.700, 0.02, -0.04))
        t1 = vlen(rr - 0.178, xx) - 0.019
        cap = np.maximum(rr - 0.075, np.abs(xx + s*0.012) - 0.013)
        return np.minimum(t1, cap)
    return f

def gold_keyline(x, y, z):
    sh = head_shell(x, y, z)
    frame = np.abs(rbox2d(x, y, 0.0, -0.03, 0.395, 0.455, 0.25)) - 0.0050
    band = np.abs(sh + 0.003) - 0.009
    return np.maximum(np.maximum(frame, band), 0.30 - z)

def gold_seam(x, y, z):
    sh = head_shell(x, y, z)
    line = np.abs(_seam(x, y, z)) - 0.0038
    band = np.abs(sh + 0.003) - 0.008
    return np.maximum(line, band)

def lens_barrel(x, y, z):
    t = z - Z0; r = vlen(x, y)
    return rbox2d(r, t, 0.215, -0.035, 0.075, 0.056, 0.018)

def lens_glass(x, y, z):
    t = z - Z0; r = vlen(x, y)
    sph = vlen(r, t + 0.30) - 0.36             # apex at t=+0.06
    body = np.maximum(r - 0.150, -(t + 0.04))
    return smax(sph, body, 0.010)

def lens_iris(x, y, z):
    t = z - Z0; r = vlen(x, y)
    a = rbox2d(r, t, 0.130, -0.075, 0.050, 0.008, 0.004)     # outer aperture ring
    a2 = rbox2d(r, t, 0.126, -0.066, 0.006, 0.012, 0.003)
    b = rbox2d(r, t, 0.098, -0.135, 0.050, 0.008, 0.004)
    c = rbox2d(r, t, 0.058, -0.195, 0.030, 0.008, 0.004)
    return np.minimum(np.minimum(a, a2), np.minimum(b, c))

def lens_gold_inner(x, y, z):
    t = z - Z0; r = vlen(x, y)
    a = rbox2d(r, t, 0.082, -0.075, 0.006, 0.010, 0.003)
    b = rbox2d(r, t, 0.050, -0.135, 0.005, 0.010, 0.003)
    return np.minimum(a, b)

def neck(x, y, z):
    rho = vlen(x, z + 0.02)
    ribs = 0.0065*np.maximum(np.cos((y + 0.8)*64.0), 0.0)
    d = np.maximum(rho - (0.175 + ribs), np.abs(y + 0.86) - 0.22)
    return smax(d, np.abs(y + 0.86) - 0.22, 0.02)

def bust_shell(x, y, z):
    chest = rbox(x, y, z, (0, -1.58, -0.04), (0.80, 0.52, 0.46), 0.34)
    d = chest
    for s_ in (-1, 1):
        sh = ellipsoid(x, y, z, (s_*0.74, -1.20, -0.06), (0.38, 0.27, 0.40))
        d = smin(d, sh, 0.26)
    base = ellipsoid(x, y, z, (0, -1.02, -0.05), (0.40, 0.20, 0.34))
    d = smin(d, base, 0.22)
    rho = vlen(x, z + 0.02)
    groove = np.maximum(rho - 0.33, -(rho - 0.24))
    groove = np.maximum(groove, np.abs(y + 0.97) - 0.016)
    d = np.maximum(d, -np.maximum(groove, -(d + 0.04)))
    return d

def _clav(x, y, z, s_):
    sh = bust_shell(x, y, z)
    u = s_*x
    line = np.abs((y + 1.14) + 0.30*np.maximum(u - 0.24, 0)) - 0.0075
    band = np.abs(sh + 0.003) - 0.008
    seg = np.maximum(line, band)
    seg = np.maximum(seg, np.maximum(-(u - 0.24), (u - 0.62)))
    return np.maximum(seg, -(z - 0.02))

def bust_gold(x, y, z):
    sh = bust_shell(x, y, z)
    rho = vlen(x, z + 0.02)
    d = vlen(rho - 0.285, y + 0.945) - 0.019
    for s_ in (-1, 1):
        u = s_*x
        line = np.abs((y + 1.14) + 0.30*np.maximum(u - 0.24, 0)) - 0.0075
        band = np.abs(sh + 0.003) - 0.008
        seg = np.maximum(line, band)
        seg = np.maximum(seg, np.maximum(-(u - 0.24), (u - 0.62)))
        seg = np.maximum(seg, -(z - 0.02))
        d = np.minimum(d, seg)
    return d

BOX_HEAD = ((-0.92,-0.86,-0.88), (0.92,0.86,0.94))
PARTS = {
  'head_cap':    (head_cap,  *BOX_HEAD, 'satin', 'head', 1.0),
  'head_base':   (head_base, *BOX_HEAD, 'black', 'head', 1.0),
  'gold_seam':   (gold_seam, *BOX_HEAD, 'gold',  'head', 1.1),
  'gold_bezel':  (gold_bezel,(-0.36,-0.36,0.36),(0.36,0.36,0.70), 'gold', 'head', 0.65),
  'gold_earL':   (make_ear_gold(-1),(-0.82,-0.32,-0.30),(-0.50,0.36,0.26), 'gold','head',0.65),
  'gold_earR':   (make_ear_gold(1), (0.50,-0.32,-0.30),(0.82,0.36,0.26), 'gold','head',0.65),
  'gold_key':    (gold_keyline,(-0.46,-0.58,0.28),(0.46,0.54,0.70), 'gold','head', 0.8),
  'lens_barrel': (lens_barrel,(-0.30,-0.30,0.20), (0.30,0.30,0.66), 'dark',  'head', 0.6),
  'lens_glass':  (lens_glass, (-0.22,-0.22,0.30), (0.22,0.22,0.70), 'glass', 'head', 0.5),
  'lens_iris':   (lens_iris,  (-0.22,-0.22,0.20), (0.22,0.22,0.70), 'dark',  'head', 0.5),
  'lens_goldi':  (lens_gold_inner,(-0.14,-0.14,0.20),(0.14,0.14,0.60),'gold','head', 0.4),
  'neck':        (neck,       (-0.26,-1.2,-0.30), (0.26,-0.55,0.26), 'rubber','body', 0.6),
  'bust_shell':  (bust_shell, (-1.40,-2.5,-0.70), (1.40,-0.80,0.70), 'black', 'body', 1.4),
  'gold_collar': (lambda x,y,z: vlen(vlen(x, z+0.02)-0.285, y+0.945)-0.019, (-0.36,-1.02,-0.40),(0.36,-0.87,0.34), 'gold','body',0.5),
  'gold_clavL':  (lambda x,y,z: _clav(x,y,z,-1), (-0.70,-1.52,-0.12),(-0.20,-0.96,0.52), 'gold','body',0.6),
  'gold_clavR':  (lambda x,y,z: _clav(x,y,z, 1), (0.20,-1.52,-0.12),(0.70,-0.96,0.52), 'gold','body',0.6),
}
