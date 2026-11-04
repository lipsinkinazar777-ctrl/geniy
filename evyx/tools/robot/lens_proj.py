import numpy as np
def rot_y(a):
    c, s = np.cos(np.deg2rad(a)), np.sin(np.deg2rad(a)); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
def rot_x(a):
    c, s = np.cos(np.deg2rad(a)), np.sin(np.deg2rad(a)); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])

def lens_xy(yaw, W=1400, H=1500, pt=(0.0, 0.0, 0.30)):
    # head transform used in render.py: T(0,-0.62,0) @ Ry(yaw) @ Rx(2.5) @ T(0,0.62,0)
    p = np.array(pt, float) + np.array([0, 0.62, 0])
    p = rot_y(yaw) @ (rot_x(2.5) @ p)
    p = p + np.array([0, -0.62, 0])
    O = np.array([0.0, -0.20, 8.2]); tgt = np.array([0.0, -0.50, 0.0]); up = np.array([0, 1.0, 0])
    f = tgt - O; f /= np.linalg.norm(f)
    r = np.cross(f, up); r /= np.linalg.norm(r)
    u = np.cross(r, f)
    d = p - O
    x, y, z = d @ r, d @ u, d @ f
    t = np.tan(np.deg2rad(24.0/2))
    nx = (x/z)/(t*W/H); ny = (y/z)/t
    return [float((nx*0.5 + 0.5)), float(0.5 - ny*0.5)]

if __name__ == '__main__':
    for y in (-28, -16, 0, 16, 28): print(y, lens_xy(y))
