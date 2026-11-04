import sys, os, time
import numpy as np
from sdflib import *
import parts

def build(vox, outdir, only=None):
    os.makedirs(outdir, exist_ok=True)
    for name, (f, lo, hi, mat, grp, vs) in parts.PARTS.items():
        if only and name not in only: continue
        t = time.time()
        v, n, fc = mesh_sdf(f, lo, hi, vox*vs)
        write_ply(os.path.join(outdir, name + '.ply'), v, n, fc)
        print(f'{name:12s} verts={len(v):8d} faces={len(fc):8d}  {time.time()-t:5.1f}s', flush=True)

if __name__ == '__main__':
    vox = float(sys.argv[1]); out = sys.argv[2]
    only = sys.argv[3].split(',') if len(sys.argv) > 3 else None
    build(vox, out, only)
