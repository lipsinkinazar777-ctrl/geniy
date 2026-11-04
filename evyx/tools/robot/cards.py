"""Product / VFX still frames for the video cards (9:16), path-traced with Mitsuba.
usage: cards.py <scene|all> <preview|final> [threads]"""
import os, sys, glob, time, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import numpy as np
import cv2
from PIL import Image
from sdflib import *
import parts as RP
import render as R
from render import MATS, rgb, rect_light, aces, to_srgb
import mitsuba as mi
import drjit as dr
from mitsuba import ScalarTransform4f as T

OUT = os.path.join(HERE, '..', 'cards_out'); os.makedirs(OUT, exist_ok=True)

MATS = dict(MATS)
MATS['mirrorgold'] = {'type': 'conductor', 'material': 'Au', 'specular_reflectance': rgb(1.0, 0.90, 0.72)}
MATS['leather'] = {'type': 'roughplastic', 'diffuse_reflectance': rgb(0.012, 0.010, 0.009), 'int_ior': 1.5, 'alpha': 0.14}
MATS['diamond'] = {'type': 'dielectric', 'int_ior': 2.42, 'specular_transmittance': rgb(1, 1, 1)}
MATS['gold'] = {'type': 'roughconductor', 'material': 'Au', 'alpha': 0.14, 'specular_reflectance': rgb(1.0, 0.955, 0.87)}
MATS['goldS'] = {'type': 'roughconductor', 'material': 'Au', 'alpha': 0.07, 'specular_reflectance': rgb(1.0, 0.95, 0.86)}
MATS['black'] = {'type': 'roughplastic', 'diffuse_reflectance': rgb(0.008, 0.008, 0.010), 'int_ior': 1.6, 'alpha': 0.045}

# ------------------------------------------------------------------ geometry helpers
def theta_z(x, y): return np.arctan2(y, x)

def capsule(x, y, z, a, b, r):
    pa = np.stack(np.broadcast_arrays(x - a[0], y - a[1], z - a[2]), -1)
    ba = np.array(b, float) - np.array(a, float)
    h = np.clip((pa @ ba) / (ba @ ba), 0, 1)
    d = np.linalg.norm(pa - h[..., None]*ba, axis=-1)
    return d - r

def plane_poly(x, y, z, planes):
    d = -1e9
    for n, off in planes:
        d = np.maximum(d, n[0]*x + n[1]*y + n[2]*z - off)
    return d

# ------------------------------------------------------------------ scenes
def scene_watch():
    def case(x, y, z):
        rho = vlen(x, y); th = theta_z(x, y)
        c = rbox2d(rho, z, 0.5, 0.0, 0.5, 0.17, 0.07)
        c = smax(c, -np.maximum(rho - 0.845, -(z - 0.055)), 0.01)
        for sx in (-1, 1):
            for sy in (-1, 1):
                c = smin(c, rbox(x, y, z, (sx*0.56, sy*1.03, -0.02), (0.11, 0.25, 0.08), 0.06), 0.05)
        bez = rbox2d(rho + 0.012*np.cos(60*th), z, 0.915, 0.14, 0.085, 0.045, 0.02)
        c = np.minimum(c, bez)
        xx, rr = axes(x, y, z, 'x', (1.10, 0, 0))
        thx = np.arctan2(z, y)
        crown = np.maximum(rr + 0.008*np.cos(24*thx) - 0.09, np.abs(xx) - 0.09)
        c = np.minimum(c, crown)
        return c
    def hand(x, y, z, ang, L, tail, w, zc):
        a = np.deg2rad(ang); u = x*np.sin(a) + y*np.cos(a); v = x*np.cos(a) - y*np.sin(a)
        wv = w*(1 - 0.55*np.clip(u/L, 0, 1))
        d = np.maximum(np.abs(v) - wv, np.abs(u - (L - tail)/2) - (L + tail)/2)
        return np.maximum(d, np.abs(z - zc) - 0.011)
    def details(x, y, z):
        rho = vlen(x, y); th = theta_z(x, y)
        sec = 2*np.pi/12
        a = ((th + sec/2) % sec) - sec/2
        px, py = rho*np.cos(a), rho*np.sin(a)
        d = rbox(px, py, z, (0.69, 0, 0.098), (0.085, 0.017, 0.012), 0.006)
        track = rbox2d(rho, z, 0.79, 0.092, 0.006, 0.006, 0.003)
        d = np.minimum(d, track)
        d = np.minimum(d, hand(x, y, z, 305, 0.46, 0.08, 0.04, 0.112))
        d = np.minimum(d, hand(x, y, z, 62, 0.68, 0.10, 0.028, 0.126))
        d = np.minimum(d, hand(x, y, z, 176, 0.74, 0.16, 0.008, 0.140))
        d = np.minimum(d, vlen(rho, z - 0.135) - 0.055)
        return d
    def dial(x, y, z):
        rho = vlen(x, y)
        return rbox2d(rho, z, 0.42, 0.073, 0.42, 0.014, 0.004)
    def glass(x, y, z):
        rho = vlen(x, y)
        sph = vlen(rho, z + 5.80) - 6.0
        return np.maximum(sph, np.maximum(rho - 0.855, -(z - 0.092)))
    def strap(x, y, z):
        ay = np.abs(y); sc = 1 - 0.07*np.maximum(ay - 1.15, 0)
        return rbox(x/sc, ay, z, (0, 1.95, -0.045), (0.52, 0.75, 0.055), 0.04)
    return dict(
        parts=[('w_case', case, (-1.3, -1.45, -0.3), (1.3, 1.45, 0.35), 0.0045, 'gold', False),
               ('w_det', details, (-0.9, -0.9, 0.0), (0.9, 0.9, 0.2), 0.0035, 'gold', False),
               ('w_dial', dial, (-0.9, -0.9, 0.0), (0.9, 0.9, 0.15), 0.004, 'black', False),
               ('w_glass', glass, (-0.9, -0.9, 0.05), (0.9, 0.9, 0.22), 0.004, 'glass', False),
               ('w_strap', strap, (-0.6, -3.0, -0.2), (0.6, 3.0, 0.1), 0.008, 'leather', False)],
        xf=T().rotate([0, 1, 0], -32) @ T().rotate([1, 0, 0], 10) @ T().rotate([0, 0, 1], -8),
        cam=dict(origin=[0, 0.25, 9.0], target=[0.05, 0.0, 0], fov=27),
        reflect=False, glow=0.9, sx=0.5, sy=0.46)

def scene_ring():
    def band(x, y, z):
        rho = vlen(x, y)
        return rbox2d(rho, z, 1.0, 0.0, 0.14, 0.115, 0.06)
    def prongs(x, y, z):
        d = 1e9
        for sx in (-1, 1):
            for sz in (-1, 1):
                d = np.minimum(d, capsule(x, y, z, (sx*0.25, 1.06, sz*0.25), (sx*0.38, 1.60, sz*0.38), 0.045))
                d = np.minimum(d, vlen(x - sx*0.40, y - 1.63, z - sz*0.40) - 0.06)
        d = np.minimum(d, rbox(x, y, z, (0, 1.10, 0), (0.17, 0.07, 0.17), 0.05))
        return d
    def gem(x, y, z):
        cy = 1.62; R_ = 0.46
        planes = []
        for k in range(8):
            ph = k*np.pi/4
            g = np.deg2rad(38); dlt = np.deg2rad(41)
            planes.append(((np.cos(ph)*np.sin(g), np.cos(g), np.sin(ph)*np.sin(g)), R_*np.sin(g)*0.995))
            planes.append(((np.cos(ph)*np.sin(dlt), -np.cos(dlt), np.sin(ph)*np.sin(dlt)), R_*np.sin(dlt)*0.995))
            ph2 = ph + np.pi/8; g2 = np.deg2rad(26)
            planes.append(((np.cos(ph2)*np.sin(g2), np.cos(g2), np.sin(ph2)*np.sin(g2)), R_*np.sin(g2)*0.80 + 0.0))
        d = plane_poly(x, y - cy, z, planes)
        d = np.maximum(d, y - cy - 0.17)
        d = np.maximum(d, vlen(x, z) - R_)
        return d
    return dict(
        parts=[('r_band', band, (-1.25, -1.25, -0.25), (1.25, 1.25, 0.25), 0.0045, 'goldS', False),
               ('r_prongs', prongs, (-0.5, 0.95, -0.5), (0.5, 1.8, 0.5), 0.0035, 'gold', False),
               ('r_gem', gem, (-0.55, 1.1, -0.55), (0.55, 1.95, 0.55), 0.0035, 'diamond', True)],
        xf=T().rotate([0, 1, 0], 36) @ T().rotate([1, 0, 0], -16),
        cam=dict(origin=[0, 0.9, 9.0], target=[0, 0.6, 0], fov=25),
        reflect=False, depth=18, glow=0.6, sx=0.5, sy=0.44)

def scene_liquid():
    t = np.linspace(0, 2*np.pi, 700)
    k = 0.46
    pts = [((np.cos(3*u) + 2.2)*np.cos(2*u)*k, (np.cos(3*u) + 2.2)*np.sin(2*u)*k, -np.sin(3*u)*k*1.05) for u in t]
    return dict(parts=[], knot=(pts, 0.205),
        xf=T().rotate([0, 1, 0], 24) @ T().rotate([1, 0, 0], 58),
        cam=dict(origin=[0, 0.2, 9.5], target=[0, 0.0, 0], fov=33),
        glow=0.3, sx=0.5, sy=0.5, light_scale=1.15)

def scene_portal():
    def slabs(x, y, z):
        d = 1e9
        for sx in (-1, 1):
            d = np.minimum(d, rbox(x, y, z, (sx*0.64, 1.35, 0.0), (0.52, 1.85, 0.36), 0.035))
        return d
    return dict(
        parts=[('m_slabs', slabs, (-1.3, -0.6, -0.5), (1.3, 3.4, 0.5), 0.0055, 'black', False)],
        slit=dict(pos=(0, 1.35, -0.55), size=(0.55, 1.95), rad=(20, 13.5, 5.5)),
        floor_y=-0.5, show_emitters=True, depth=14,
        xf=T(), cam=dict(origin=[0, 0.55, 9.6], target=[0, 1.05, 0], fov=31),
        light_scale=0.5, glow=0.8, sx=0.5, sy=0.4)

def scene_glasses():
    def lens2d(x, y, cx): return rbox2d(x, y, cx, 0.0, 0.60, 0.44, 0.30)
    def frame(x, y, z):
        d = 1e9
        for cx in (-0.72, 0.72):
            s = lens2d(x, y, cx); ring = np.maximum(s, -(s + 0.085))
            d = np.minimum(d, smax(ring, np.abs(z) - 0.05, 0.025))
        d = np.minimum(d, rbox(x, y, z, (0, 0.2, 0), (0.17, 0.045, 0.04), 0.03))
        for sx in (-1, 1):
            d = np.minimum(d, capsule(x, y*1.5, z, (sx*1.32, 0.39, -0.02), (sx*1.40, 0.33, -1.7), 0.034))
        return d
    def lens(x, y, z):
        d = 1e9
        for cx in (-0.72, 0.72):
            s = lens2d(x, y, cx)
            bulge = -0.07*(((x - cx)/0.6)**2 + (y/0.44)**2)*0.5
            d = np.minimum(d, np.maximum(s + 0.080, np.abs(z - bulge) - 0.013))
        return d
    def gold(x, y, z):
        d = 1e9
        for sx in (-1, 1):
            d = np.minimum(d, rbox(x, y, z, (sx*1.33, 0.26, -0.05), (0.05, 0.10, 0.075), 0.02))
            d = np.minimum(d, capsule(x, y*1.5, z, (sx*1.40, 0.33, -1.35), (sx*1.40, 0.33, -1.72), 0.040))
        d = np.minimum(d, rbox(x, y, z, (0, 0.2, 0), (0.05, 0.045, 0.045), 0.02))
        return d
    return dict(
        parts=[('g_frame', frame, (-1.65, -0.8, -1.9), (1.65, 0.8, 0.2), 0.0045, 'black', False),
               ('g_lens', lens, (-1.5, -0.6, -0.2), (1.5, 0.6, 0.2), 0.0035, 'mirrorgold', False),
               ('g_gold', gold, (-1.65, -0.4, -1.9), (1.65, 0.6, 0.2), 0.0035, 'gold', False)],
        xf=T().rotate([0, 1, 0], -16) @ T().rotate([1, 0, 0], 9) @ T().rotate([0, 0, 1], 5),
        cam=dict(origin=[0, 0.1, 9.5], target=[0, 0.1, -0.5], fov=31), glow=0.5, sx=0.5, sy=0.5,
        extra_lights=[((2.9, 0.6, 7.0), 0.26, 2.6, (6.0, 5.0, 3.6)), ((-3.5, 0.3, 6.2), 0.20, 2.6, (5.0, 4.2, 3.0)), ((0.2, 3.2, 7.0), 1.6, 0.3, (4.0, 3.4, 2.6)), ((0.0, 1.5, 8.6), 5.5, 3.2, (0.9, 0.7, 0.42))])

def scene_perfume():
    def body(x, y, z):
        d = rbox(x, y, z, (0, -0.15, 0), (0.62, 0.82, 0.30), 0.16)
        neck = np.maximum(vlen(x, z) - 0.20, np.abs(y - 0.85) - 0.22)
        d = smin(d, neck, 0.10)
        return d
    def gold(x, y, z):
        th = np.arctan2(z, x); rho = vlen(x, z)
        collar = np.maximum(rho - 0.275, np.abs(y - 1.03) - 0.05)
        cap = np.maximum(rho + 0.012*np.cos(40*th) - 0.31, np.abs(y - 1.48) - 0.40)
        cap = smax(cap, np.abs(y - 1.48) - 0.40, 0.04)
        sh = body(x, y, z)
        fr = np.abs(rbox2d(x, y, 0.0, -0.18, 0.44, 0.56, 0.12)) - 0.0055
        label = np.maximum(np.maximum(fr, np.abs(sh + 0.003) - 0.010), -(z - 0.10))
        ring = np.maximum(np.maximum(np.abs(vlen(x, y + 0.10) - 0.16) - 0.0055, np.abs(sh + 0.003) - 0.010), -(z - 0.10))
        return np.minimum(np.minimum(collar, cap), np.minimum(label, ring))
    return dict(
        parts=[('p_body', body, (-0.8, -1.1, -0.5), (0.8, 1.25, 0.5), 0.0045, 'black', False),
               ('p_gold', gold, (-0.8, -1.1, -0.5), (0.8, 1.95, 0.5), 0.0035, 'gold', False)],
        xf=T().rotate([0, 1, 0], -24) @ T().rotate([1, 0, 0], 4),
        cam=dict(origin=[0, 0.4, 9.5], target=[0, 0.42, 0], fov=34),
        reflect=True, floor=-0.97, glow=0.4, sx=0.5, sy=0.42)

def scene_jar():
    def jar(cx, cz, r, h0, h1, lid_h):
        def body(x, y, z):
            xx, yy = x - cx, z - cz
            rho = vlen(xx, yy)
            return rbox2d(rho, y, r/2, (h0 + h1)/2, r/2, (h1 - h0)/2, 0.07)
        def lid(x, y, z):
            xx, yy = x - cx, z - cz
            rho = vlen(xx, yy); th = np.arctan2(yy, xx)
            return rbox2d(rho + 0.010*np.cos(48*th), y, (r + 0.04)/2, h1 + lid_h/2, (r + 0.04)/2, lid_h/2, 0.05)
        def band(x, y, z):
            xx, yy = x - cx, z - cz
            rho = vlen(xx, yy)
            return rbox2d(rho, y, r + 0.005, h0 + (h1 - h0)*0.45, 0.012, 0.014, 0.006)
        return body, lid, band
    A = jar(-0.32, -0.15, 0.82, -0.52, 0.12, 0.30)
    B = jar(0.98, 0.62, 0.52, -0.52, -0.10, 0.22)
    def bodies(x, y, z): return np.minimum(A[0](x, y, z), B[0](x, y, z))
    def golds(x, y, z): return np.minimum(np.minimum(A[1](x, y, z), B[1](x, y, z)), np.minimum(A[2](x, y, z), B[2](x, y, z)))
    return dict(
        parts=[('j_body', bodies, (-1.3, -0.6, -1.1), (1.6, 0.3, 1.3), 0.0045, 'black', False),
               ('j_gold', golds, (-1.3, -0.6, -1.1), (1.6, 0.6, 1.3), 0.0035, 'gold', False)],
        xf=T().rotate([0, 1, 0], -14),
        cam=dict(origin=[0, 1.6, 9.0], target=[0.15, -0.05, 0], fov=34),
        reflect=True, floor=-0.52, glow=0.3, sx=0.5, sy=0.52)

SCENES = {'luxury-watch': scene_watch, 'ring-macro': scene_ring, 'liquid-metal': scene_liquid, 'portal': scene_portal,
          'laser-glasses': scene_glasses, 'perfume': scene_perfume, 'catalog-jar': scene_jar}

# ------------------------------------------------------------------ rendering
def build_scene(name, scn, W, H, spp, vscale):
    d = os.path.join(OUT, 'mesh_' + name); os.makedirs(d, exist_ok=True)
    S = {'type': 'scene', 'integrator': {'type': 'path', 'max_depth': scn.get('depth', 12), 'rr_depth': 8, 'hide_emitters': not scn.get('show_emitters', False)},
         'env': {'type': 'constant', 'radiance': rgb(0.008, 0.0075, 0.007)}}
    c = scn['cam']
    S['sensor'] = {'type': 'perspective', 'fov': c['fov'], 'fov_axis': 'y',
                   'to_world': T().look_at(origin=c['origin'], target=c['target'], up=[0, 1, 0]),
                   'film': {'type': 'hdrfilm', 'width': W, 'height': H, 'pixel_format': 'rgba', 'rfilter': {'type': 'gaussian', 'stddev': 0.5}},
                   'sampler': {'type': 'independent', 'sample_count': spp}}
    t0 = time.time()
    for (pn, f, lo, hi, vox, mat, flat) in scn['parts']:
        v, n, fc = mesh_sdf(f, lo, hi, vox*vscale, flat=flat)
        path = os.path.join(d, pn + '.ply'); write_ply(path, v, n, fc)
        S[pn] = {'type': 'ply', 'filename': path, 'bsdf': MATS[mat], 'to_world': scn['xf']}
    for (tn, pts, rad, em) in scn.get('tubes', []):
        v, n, fc, _ = tube(pts, rad, seg=14, smooth=False)
        path = os.path.join(d, tn + '.ply'); write_ply(path, v, n, fc)
        S[tn] = {'type': 'ply', 'filename': path, 'bsdf': {'type': 'diffuse', 'reflectance': rgb(0, 0, 0)},
                 'emitter': {'type': 'area', 'radiance': rgb(*em)}, 'to_world': scn['xf']}
    if 'knot' in scn:
        pts, rad = scn['knot']
        v, n, fc, _ = tube(pts, rad, seg=56, smooth=False)
        path = os.path.join(d, 'knot.ply'); write_ply(path, v, n, fc)
        S['knot'] = {'type': 'ply', 'filename': path, 'bsdf': MATS['mirrorgold'], 'to_world': scn['xf']}
    if 'slit' in scn:
        sl = scn['slit']
        S['slit'] = {'type': 'rectangle', 'to_world': T().translate(list(sl['pos'])) @ T().scale([sl['size'][0], sl['size'][1], 1.0]),
                     'bsdf': {'type': 'diffuse', 'reflectance': rgb(0, 0, 0)}, 'emitter': {'type': 'area', 'radiance': rgb(*sl['rad'])}}
    if 'floor_y' in scn:
        S['floor'] = {'type': 'rectangle', 'to_world': T().translate([0, scn['floor_y'], 0]) @ T().rotate([1, 0, 0], -90) @ T().scale(14.0),
                      'bsdf': {'type': 'roughplastic', 'diffuse_reflectance': rgb(0.006, 0.006, 0.007), 'int_ior': 1.6, 'alpha': 0.07}}
    if 'disc' in scn:
        dd = scn['disc']
        S['disc'] = {'type': 'sphere', 'to_world': T().translate([0, 0, dd['z']]) @ T().scale(dd['radius']),
                     'bsdf': {'type': 'diffuse', 'reflectance': rgb(0, 0, 0)}, 'emitter': {'type': 'area', 'radiance': rgb(*dd['rad'])}}
    if not scn.get('nolights'):
        tg = c['target']; ls = scn.get('light_scale', 1.0)
        def L(*v): return tuple(x*ls for x in v)
        S['key'] = rect_light((-3.4, 3.8, 4.4), tg, 1.8, 1.2, L(14, 13, 11.5))
        S['rimR'] = rect_light((4.4, 0.8, -2.4), tg, 0.5, 2.6, L(30, 22, 10))
        S['rimL'] = rect_light((-4.4, 0.6, -2.8), tg, 0.45, 2.4, L(20, 15, 8.5))
        S['top'] = rect_light((0, 5.4, 0.8), tg, 2.2, 1.5, L(6, 5.5, 5), up=(0, 0, -1))
        S['stripL'] = rect_light((-3.4, 0.4, 3.8), tg, 0.34, 2.0, L(11, 10, 8.8))
        S['stripR'] = rect_light((3.6, 0.8, 3.4), tg, 0.32, 2.0, L(9, 7.8, 6))
        S['fill'] = rect_light((2.6, -0.2, 5.4), tg, 0.9, 0.9, L(1.3, 1.2, 1.1))
        for i, (pos, sx_, sy_, rad) in enumerate(scn.get('extra_lights', [])):
            S[f'extra{i}'] = rect_light(pos, tg, sx_, sy_, rad)
    print(f'  meshing {time.time()-t0:.1f}s', flush=True)
    return mi.load_dict(S)

def grade(img, scn, W, H, gain=0.62):
    rgbv = img[..., :3]*gain; a = np.clip(img[..., 3], 0, 1)
    hot = np.maximum(rgbv - 1.0, 0)
    glow = (cv2.GaussianBlur(hot, (0, 0), W*0.010)*1.4 + cv2.GaussianBlur(hot, (0, 0), W*0.035)*1.0)*scn.get('glow', 0.5)*0.45
    lin = rgbv + glow
    obj = to_srgb(aces(lin))
    lum = obj.mean(axis=2, keepdims=True)
    obj = lum + (obj - lum)*0.86
    glowa = np.clip(glow.max(axis=2), 0, 1)
    a = np.maximum(a, glowa*0.9)
    # background: warm spot, dark edges
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy = scn.get('sx', 0.5)*W, scn.get('sy', 0.45)*H
    r = np.sqrt(((xx - cx)/(0.78*W))**2 + ((yy - cy)/(0.62*H))**2)
    k = np.exp(-r*r*1.9)
    k = np.exp(-r*r*2.6)
    bg = np.stack([0.030 + 0.19*k, 0.026 + 0.140*k, 0.020 + 0.078*k], -1)
    # reflection on an implied glossy floor
    comp = bg.copy()
    if scn.get('reflect'):
        rows = np.where((np.clip(img[..., 3], 0, 1) > 0.5).any(axis=1))[0]
        r_c = int(rows.max()); top = int(rows.min()); hh = r_c - top
        rh = int(min(hh*0.5, H - r_c - 2))
        src = obj[r_c - rh:r_c][::-1]; sa = (np.clip(img[..., 3], 0, 1)[r_c - rh:r_c][::-1])
        fade = np.linspace(0.34, 0.0, rh)[:, None]
        src = cv2.GaussianBlur(src, (0, 0), 2.2)
        sa = cv2.GaussianBlur(sa, (0, 0), 2.2)*fade
        reg = comp[r_c:r_c + rh]
        comp[r_c:r_c + rh] = reg*(1 - sa[..., None]) + src*sa[..., None]
        # contact shadow
        sh = np.zeros((H, W), np.float32)
        cols = np.where((np.clip(img[..., 3], 0, 1)[r_c - 4:r_c + 1] > 0.3).any(axis=0))[0]
        if len(cols):
            cxm = (cols.min() + cols.max())/2; wd = (cols.max() - cols.min())/2*1.15
            yy2 = (yy - (r_c + 4))/(0.05*H); xx2 = (xx - cxm)/wd
            sh = np.exp(-(xx2**2 + yy2**2)*1.2)*0.6
        comp = comp*(1 - sh[..., None])
    out = comp*(1 - a[..., None]) + obj*a[..., None]
    rng = np.random.default_rng(3)
    out = out + rng.normal(0, 0.006, size=(H, W, 1))
    return (np.clip(out, 0, 1)*255 + 0.5).astype(np.uint8)

def render_scene(name, mode, threads=2):
    dr.set_thread_count(threads)
    scn = SCENES[name]()
    if mode == 'preview': W, H, spp, passes, vscale = 360, 640, 64, 1, 2.2
    else:                 W, H, spp, passes, vscale = 720, 1280, 32, 8, 1.0
    t = time.time()
    sc = build_scene(name, scn, W, H, spp, vscale)
    img = R.render(sc, spp=spp, passes=passes, seed0=11)
    np.save(os.path.join(OUT, f'{name}_{mode}.npy'), img.astype(np.float32))
    out = grade(img, scn, W, H)
    if mode == 'final':
        out = cv2.fastNlMeansDenoisingColored(out, None, 2, 2, 5, 15)
    Image.fromarray(out).save(os.path.join(OUT, f'{name}_{mode}.png'))
    print(f'{name}: {time.time()-t:.0f}s mean={img[..., :3].mean():.3f}', flush=True)

if __name__ == '__main__':
    which = sys.argv[1]; mode = sys.argv[2]; th = int(sys.argv[3]) if len(sys.argv) > 3 else 2
    names = list(SCENES) if which == 'all' else which.split(',')
    for n in names:
        try: render_scene(n, mode, th)
        except Exception as e:
            import traceback; traceback.print_exc(); print('FAILED', n, e, flush=True)
