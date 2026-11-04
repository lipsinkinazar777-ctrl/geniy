"""Tiny signed-distance-field toolkit (numpy) + marching cubes meshing.
Convention: negative inside, positive outside. y is up, +z faces the camera."""
import numpy as np
from skimage.measure import marching_cubes

def vlen(*c):
    s = c[0]*c[0]
    for a in c[1:]: s = s + a*a
    return np.sqrt(s)

def smin(a, b, k):
    h = np.clip(0.5 + 0.5*(b-a)/k, 0.0, 1.0)
    return b*(1-h) + a*h - k*h*(1-h)

def smax(a, b, k): return -smin(-a, -b, k)

def ellipsoid(x, y, z, c, r):
    px, py, pz = x-c[0], y-c[1], z-c[2]
    k0 = vlen(px/r[0], py/r[1], pz/r[2])
    k1 = vlen(px/(r[0]*r[0]), py/(r[1]*r[1]), pz/(r[2]*r[2]))
    return k0*(k0-1.0)/np.maximum(k1, 1e-6)

def rbox(x, y, z, c, b, r):
    qx = np.abs(x-c[0]) - b[0] + r
    qy = np.abs(y-c[1]) - b[1] + r
    qz = np.abs(z-c[2]) - b[2] + r
    out = vlen(np.maximum(qx, 0), np.maximum(qy, 0), np.maximum(qz, 0))
    ins = np.minimum(np.maximum(np.maximum(qx, qy), qz), 0)
    return out + ins - r

def rbox2d(u, v, cu, cv, hu, hv, r):
    qu = np.abs(u-cu) - hu + r
    qv = np.abs(v-cv) - hv + r
    return vlen(np.maximum(qu, 0), np.maximum(qv, 0)) + np.minimum(np.maximum(qu, qv), 0) - r

def circle2d(u, v, cu, cv, r): return vlen(u-cu, v-cv) - r

# axis-aligned helpers: (axial coordinate, radial distance)
def axes(x, y, z, axis, c):
    if axis == 'x': return x-c[0], vlen(y-c[1], z-c[2])
    if axis == 'y': return y-c[1], vlen(x-c[0], z-c[2])
    return z-c[2], vlen(x-c[0], y-c[1])

def revolve(x, y, z, axis, c, profile):
    """profile(rho, t) -> 2D SDF in (radius, axial) plane"""
    t, rho = axes(x, y, z, axis, c)
    return profile(rho, t)

def theta(x, y, z, axis, c):
    if axis == 'z': return np.arctan2(y-c[1], x-c[0])
    if axis == 'x': return np.arctan2(z-c[2], y-c[1])
    return np.arctan2(z-c[2], x-c[0])

def eval_grid(f, lo, hi, vox, chunk_x=24):
    xs = np.arange(lo[0], hi[0]+vox, vox, dtype=np.float32)
    ys = np.arange(lo[1], hi[1]+vox, vox, dtype=np.float32)
    zs = np.arange(lo[2], hi[2]+vox, vox, dtype=np.float32)
    vol = np.empty((len(xs), len(ys), len(zs)), np.float32)
    Y = ys[None, :, None]; Z = zs[None, None, :]
    for i in range(0, len(xs), chunk_x):
        X = xs[i:i+chunk_x, None, None]
        vol[i:i+chunk_x] = f(X, Y, Z).astype(np.float32)
    return vol, (xs[0], ys[0], zs[0])

def mesh_sdf(f, lo, hi, vox, refine=2, eps=None, flat=False):
    vol, org = eval_grid(f, lo, hi, vox)
    # pad with positive values so surfaces touching the bbox are closed
    vol = np.pad(vol, 1, mode='constant', constant_values=1.0)
    org = (org[0]-vox, org[1]-vox, org[2]-vox)
    v, fcs, _, _ = marching_cubes(vol, level=0.0, spacing=(vox, vox, vox), allow_degenerate=False)
    v = v.astype(np.float64) + np.array(org)
    eps = eps or vox*0.35
    def grad(p):
        out = np.empty_like(p)
        for i in range(0, len(p), 400000):
            q = p[i:i+400000]
            gx = f(q[:,0]+eps, q[:,1], q[:,2]) - f(q[:,0]-eps, q[:,1], q[:,2])
            gy = f(q[:,0], q[:,1]+eps, q[:,2]) - f(q[:,0], q[:,1]-eps, q[:,2])
            gz = f(q[:,0], q[:,1], q[:,2]+eps) - f(q[:,0], q[:,1], q[:,2]-eps)
            out[i:i+400000] = np.stack([gx, gy, gz], 1)/(2*eps)
        return out
    for _ in range(refine):          # snap vertices onto the true zero set
        g = grad(v)
        d = f(v[:,0], v[:,1], v[:,2])
        gn = np.maximum((g*g).sum(1), 1e-9)
        v = v - (d/gn)[:, None]*g
    n = grad(v); n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)
    # consistent winding: make face normals agree with SDF normals
    a, b, c = v[fcs[:,0]], v[fcs[:,1]], v[fcs[:,2]]
    fn = np.cross(b-a, c-a)
    agree = (fn*(n[fcs[:,0]]+n[fcs[:,1]]+n[fcs[:,2]])).sum(1)
    flip = agree < 0
    fcs[flip] = fcs[flip][:, [0, 2, 1]]
    if flat:
        a, b, c = v[fcs[:,0]], v[fcs[:,1]], v[fcs[:,2]]
        fn = np.cross(b-a, c-a); fn /= np.maximum(np.linalg.norm(fn, axis=1, keepdims=True), 1e-12)
        V = v[fcs].reshape(-1, 3); N = np.repeat(fn, 3, axis=0)
        F = np.arange(len(V), dtype=np.int32).reshape(-1, 3)
        return V.astype(np.float32), N.astype(np.float32), F
    return v.astype(np.float32), n.astype(np.float32), fcs.astype(np.int32)

def write_ply(path, v, n, f):
    nv, nf = len(v), len(f)
    hdr = ("ply\nformat binary_little_endian 1.0\n"
           f"element vertex {nv}\nproperty float x\nproperty float y\nproperty float z\n"
           "property float nx\nproperty float ny\nproperty float nz\n"
           f"element face {nf}\nproperty list uchar int vertex_indices\nend_header\n").encode()
    vd = np.empty(nv, dtype=[('p','<f4',3),('n','<f4',3)])
    vd['p'] = v; vd['n'] = n
    fd = np.empty(nf, dtype=[('c','u1'),('i','<i4',3)])
    fd['c'] = 3; fd['i'] = f
    with open(path, 'wb') as fh:
        fh.write(hdr); fh.write(vd.tobytes()); fh.write(fd.tobytes())


def _catmull(P, n=200):
    P = np.asarray(P, float)
    Q = np.vstack([2*P[0]-P[1], P, 2*P[-1]-P[-2]])
    out = []
    per = max(n//(len(P)-1), 2)
    for i in range(1, len(Q)-2):
        p0, p1, p2, p3 = Q[i-1], Q[i], Q[i+1], Q[i+2]
        for t in np.linspace(0, 1, per, endpoint=False):
            out.append(0.5*((2*p1) + (-p0+p2)*t + (2*p0-5*p1+4*p2-p3)*t*t + (-p0+3*p1-3*p2+p3)*t**3))
    out.append(P[-1])
    return np.array(out)

def tube(points, radius, seg=24, smooth=True):
    C = _catmull(points, 400) if smooth else np.asarray(points, float)
    T_ = np.gradient(C, axis=0); T_ /= np.maximum(np.linalg.norm(T_, axis=1, keepdims=True), 1e-9)
    up = np.array([0, 1, 0.])
    if abs(np.dot(T_[0], up)) > 0.95: up = np.array([1, 0, 0.])
    N = np.cross(T_[0], up); N /= np.linalg.norm(N)
    verts, norms = [], []
    ang = np.linspace(0, 2*np.pi, seg, endpoint=False)
    for i in range(len(C)):
        if i > 0:
            b = np.cross(T_[i-1], T_[i])
            if np.linalg.norm(b) > 1e-8:
                b /= np.linalg.norm(b)
                a = np.arccos(np.clip(np.dot(T_[i-1], T_[i]), -1, 1))
                N = N*np.cos(a) + np.cross(b, N)*np.sin(a) + b*np.dot(b, N)*(1-np.cos(a))
        B = np.cross(T_[i], N)
        r = radius(i/(len(C)-1)) if callable(radius) else radius
        for a_ in ang:
            nrm = np.cos(a_)*N + np.sin(a_)*B
            verts.append(C[i] + r*nrm); norms.append(nrm)
    verts = np.array(verts, np.float32); norms = np.array(norms, np.float32)
    faces = []
    for i in range(len(C)-1):
        for j in range(seg):
            a = i*seg + j; b = i*seg + (j+1) % seg
            c = (i+1)*seg + j; d_ = (i+1)*seg + (j+1) % seg
            faces += [[a, c, b], [b, c, d_]]
    return verts, norms, np.array(faces, np.int32), C
