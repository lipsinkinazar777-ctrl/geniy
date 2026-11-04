import os, glob, sys, time
libs = glob.glob('/usr/lib/llvm-*/lib/libLLVM.so*')
if libs: os.environ['DRJIT_LIBLLVM_PATH'] = libs[0]
import numpy as np
import mitsuba as mi
mi.set_variant('llvm_ad_rgb')
from mitsuba import ScalarTransform4f as T

def rgb(r, g, b): return {'type': 'rgb', 'value': [r, g, b]}

MATS = {
  'black': {'type': 'roughplastic', 'diffuse_reflectance': rgb(0.010, 0.010, 0.012), 'int_ior': 1.55, 'alpha': 0.07},
  'satin': {'type': 'roughplastic', 'diffuse_reflectance': rgb(0.016, 0.016, 0.018), 'int_ior': 1.5, 'alpha': 0.24},
  'gold':  {'type': 'roughconductor', 'material': 'Au', 'alpha': 0.20, 'specular_reflectance': rgb(1.0, 0.93, 0.80)},
  'dark':  {'type': 'roughconductor', 'material': 'Cr', 'alpha': 0.28, 'specular_reflectance': rgb(0.35, 0.34, 0.33)},
  'steel': {'type': 'roughconductor', 'material': 'Cr', 'alpha': 0.34, 'specular_reflectance': rgb(0.55, 0.53, 0.50)},
  'glass': {'type': 'dielectric', 'int_ior': 1.52, 'specular_transmittance': rgb(0.96, 0.95, 0.93)},
  'rubber':{'type': 'roughplastic', 'diffuse_reflectance': rgb(0.02, 0.02, 0.022), 'int_ior': 1.45, 'alpha': 0.30},
}

def rect_light(pos, target, sx, sy, radiance, up=(0, 1, 0)):
    return {'type': 'rectangle',
            'to_world': T().look_at(origin=list(pos), target=list(target), up=list(up)) @ T().scale([sx, sy, 1.0]),
            'emitter': {'type': 'area', 'radiance': rgb(*radiance)}}

def build_scene(meshdir, yaw=0.0, W=700, H=760, spp=64, cam=None, light=None):
    from robot_parts_meta import GROUP, MAT
    S = {'type': 'scene',
         'integrator': {'type': 'path', 'max_depth': 12, 'rr_depth': 8, 'hide_emitters': True},
         'env': {'type': 'constant', 'radiance': rgb(0.012, 0.011, 0.010)}}
    c = cam or {}
    origin = c.get('origin', [0.0, -0.20, 8.2]); target = c.get('target', [0.0, -0.50, 0.0]); fov = c.get('fov', 24.0)
    S['sensor'] = {'type': 'perspective', 'fov': fov, 'fov_axis': 'y',
                   'to_world': T().look_at(origin=origin, target=target, up=[0, 1, 0]),
                   'film': {'type': 'hdrfilm', 'width': W, 'height': H, 'pixel_format': 'rgba',
                            'rfilter': {'type': 'gaussian', 'stddev': 0.5}},
                   'sampler': {'type': 'independent', 'sample_count': spp}}
    head_tf = T().translate([0, -0.62, 0]) @ T().rotate([0, 1, 0], yaw) @ T().rotate([1, 0, 0], 2.5) @ T().translate([0, 0.62, 0])
    for f in sorted(glob.glob(os.path.join(meshdir, '*.ply'))):
        name = os.path.splitext(os.path.basename(f))[0]
        if name.startswith('cable'):
            S[name] = {'type': 'ply', 'filename': f, 'bsdf': MATS['rubber']}
            continue
        S[name] = {'type': 'ply', 'filename': f, 'bsdf': MATS[MAT[name]],
                   'to_world': head_tf if GROUP[name] == 'head' else T()}
    # glowing core behind the lens glass (rotates with the head)
    core = (0.0, 0.0, 0.54 - 0.245)
    S['core'] = {'type': 'sphere', 'to_world': head_tf @ T().translate(list(core)) @ T().scale(0.032),
                 'emitter': {'type': 'area', 'radiance': rgb(17.0, 11.5, 6.0)},
                 'bsdf': {'type': 'diffuse', 'reflectance': rgb(0, 0, 0)}}
    L = light or {}
    tgt = [0, -0.3, 0]
    S['key']   = rect_light((-3.4, 3.6, 4.2), tgt, 1.7, 1.15, L.get('key', (16.0, 15.0, 13.0)))
    S['rimR']  = rect_light((4.4, 0.6, -2.2), tgt, 0.45, 2.6, L.get('rimR', (34.0, 24.0, 11.0)))
    S['rimL']  = rect_light((-4.2, 0.4, -2.6), tgt, 0.40, 2.4, L.get('rimL', (22.0, 16.0, 9.0)))
    S['top']   = rect_light((0.0, 5.2, 0.8), tgt, 2.2, 1.4, L.get('top', (6.5, 6.0, 5.4)), up=(0, 0, -1))
    S['fill']  = rect_light((2.6, -0.2, 5.0), tgt, 0.9, 0.9, L.get('fill', (1.4, 1.3, 1.2)))
    S['stripL'] = rect_light((-3.3, 0.4, 3.6), tgt, 0.32, 2.0, L.get('stripL', (12.0, 11.0, 9.5)))
    S['stripR'] = rect_light((3.4, 0.7, 3.3), tgt, 0.30, 2.0, L.get('stripR', (10.0, 8.6, 6.8)))
    S['under'] = rect_light((0.0, -3.4, 3.0), [0, -1.0, 0], 2.4, 0.5, L.get('under', (1.6, 1.3, 0.9)), up=(0, 0, 1))
    return mi.load_dict(S)

def render(scene, spp, passes=1, seed0=0):
    acc = None
    for i in range(passes):
        img = np.array(mi.render(scene, spp=spp, seed=seed0 + i))
        acc = img if acc is None else acc + img
    return acc / passes

def aces(x):
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x*(a*x + b))/(x*(c*x + d) + e), 0, 1)

def to_srgb(x):
    return np.where(x <= 0.0031308, 12.92*x, 1.055*np.power(np.maximum(x, 1e-9), 1/2.4) - 0.055)

def finish(img, exposure=1.0, bloom=0.10):
    rgbv = img[..., :3]; a = img[..., 3:4]
    return rgbv, a

if __name__ == '__main__':
    pass
