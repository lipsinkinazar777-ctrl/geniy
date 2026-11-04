import sys, os, time, json
sys.path.insert(0, 'robot')
import numpy as np
import render as R
import mitsuba as mi

def main():
    meshdir = sys.argv[1]; outdir = sys.argv[2]
    yaws = [float(v) for v in sys.argv[3].split(',')]
    W = int(sys.argv[4]); H = int(sys.argv[5])
    passes = int(sys.argv[6]); spp = int(sys.argv[7])
    threads = int(sys.argv[8]) if len(sys.argv) > 8 else 3
    import drjit as dr
    try: dr.set_thread_count(threads)
    except Exception as e: print("thread count not set:", e)
    os.makedirs(outdir, exist_ok=True)
    for yaw in yaws:
        path = os.path.join(outdir, f'yaw_{yaw:+06.1f}.npy')
        if os.path.exists(path):
            print('skip', path, flush=True); continue
        t = time.time()
        sc = R.build_scene(meshdir, yaw=yaw, W=W, H=H, spp=spp)
        img = R.render(sc, spp=spp, passes=passes, seed0=int(abs(yaw)*10) + 1000)
        np.save(path, img.astype(np.float32))
        print(f'yaw {yaw:+.1f} done in {time.time()-t:.0f}s  mean={img[..., :3].mean():.4f}', flush=True)

if __name__ == '__main__':
    main()
