#!/usr/bin/env python3
# The entrance sound for the new film: the original misty graveyard (first 3 s) and the gate/hall tail are kept, the middle is a warm score made here:
# a slow pad (Am-F-C-G), a music box melody, a wind bed, a riser that gathers into the light at 9.6 s and a soft low bloom.
import numpy as np, subprocess, pathlib, wave
root = pathlib.Path(__file__).resolve().parent.parent; C = root / 'tools/_cache'; SR = 44100; DUR = 11.83; N = int(SR * DUR); rng = np.random.default_rng(8)
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.copy()
o = load(C / 'intro-original.mp3'); out = np.zeros((2, N), np.float32)
def put(buf, t0, gain=1.0, fi=0.0, fo=0.0):
    n = buf.shape[1]; a = int(t0 * SR); b = min(N, a + n); m = b - a; seg = buf[:, :m].copy()
    env = np.ones(m, np.float32)
    if fi: k = int(fi * SR); env[:k] = np.linspace(0, 1, min(k, m))[:m]
    if fo: k = int(fo * SR); env[-k:] *= np.linspace(1, 0, k)[-min(k, m):] if m >= k else 1
    out[:, a:b] += seg * env * gain
put(o[:, :int(3.0 * SR)], 0, 1.0, 0, .5)                                     # the graveyard, as it was
put(o[:, int(10.45 * SR):], 9.45, .8, .25, .4)                                # the gate and the hall, as they were (shifted to meet the light)
t = np.arange(N) / SR
def tone(f, t0, d, a=.6, r=1.2, kind='sine'):
    m = int((d + r) * SR); x = np.arange(m) / SR; w = np.sin(2 * np.pi * f * x) if kind == 'sine' else 2 / np.pi * np.arcsin(np.sin(2 * np.pi * f * x))
    env = np.minimum(1, x / a) * np.where(x > d, np.exp(-(x - d) * 3.5 / r), 1); return w * env
def add(sig, t0, gain, pan=.5):
    a = int(t0 * SR); m = min(len(sig), N - a)
    if m > 0: out[0, a:a + m] += sig[:m] * gain * (1 - pan * .6); out[1, a:a + m] += sig[:m] * gain * (.4 + pan * .6)
# pad: slow chords with a hint of detune
CH = [(2.9, [110, 164.81, 220, 261.63, 329.63]), (5.6, [87.31, 130.81, 174.61, 220, 261.63]), (8.3, [130.81, 164.81, 196, 261.63, 329.63]), (10.4, [98, 146.83, 196, 246.94, 293.66])]
for t0, ns in CH:
    for f in ns:
        for dt in (-.6, .6): add(tone(f + dt, t0, 2.9, a=1.1, r=1.6, kind='tri'), t0, .020 if f < 150 else .014, pan=rng.uniform(.2, .8))
# music box: a slow melody in A minor, bell timbre
MEL = [440, 523.25, 659.25, 587.33, 523.25, 440, 392, 440, 523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 587.33, 440]
for i, f in enumerate(MEL * 2):
    t0 = 3.3 + i * .44 + (rng.random() < .25) * .12
    if t0 > 9.3: break
    x = np.arange(int(2.2 * SR)) / SR; bell = (np.sin(2 * np.pi * f * x) * np.exp(-x * 3.2) + .35 * np.sin(2 * np.pi * f * 2.0 * x) * np.exp(-x * 5.5) + .12 * np.sin(2 * np.pi * f * 3.01 * x) * np.exp(-x * 8))
    add(bell, t0, .055, pan=.3 + .4 * (i % 3) / 2)
# wind bed under the middle
n = rng.standard_normal(N).astype(np.float32)
def bp(sig, lo, hi):
    S = np.fft.rfft(sig); fr = np.fft.rfftfreq(len(sig), 1 / SR); S[(fr < lo) | (fr > hi)] = 0; return np.fft.irfft(S, len(sig)).astype(np.float32)
wind = bp(n, 160, 900) * (.5 + .5 * np.sin(t * .8)) ; wenv = np.clip((t - 2.6) / 1.5, 0, 1) * np.clip((11.0 - t) / 1.2, 0, 1)
out[0] += wind * wenv * .035; out[1] += np.roll(wind, 4000) * wenv * .035
# riser into the light (6.8 -> 9.55), then a soft bloom
rs = bp(rng.standard_normal(N).astype(np.float32), 2500, 9000); renv = np.clip((t - 6.8) / 2.75, 0, 1) ** 2.4 * (t < 9.6) * 0.1
out[0] += rs * renv; out[1] += np.roll(rs, 900) * renv
x = np.arange(int(2.6 * SR)) / SR; boom = np.sin(2 * np.pi * 55 * x) * np.exp(-x * 1.8) * .14 + bp(rng.standard_normal(len(x)).astype(np.float32), 300, 3000) * np.exp(-x * 2.4) * .05
add(boom, 9.58, 1.0)
for f in (523.25, 783.99, 1046.5):                                                  # the light: three bells together
    xx = np.arange(int(3 * SR)) / SR; add(np.sin(2 * np.pi * f * xx) * np.exp(-xx * 1.6), 9.62, .05)
# master: gentle limiter + fade out
out *= np.clip((DUR - t) / .5, 0, 1); pk = np.abs(out).max(); out *= .92 / max(pk, 1e-6)
out = np.tanh(out * 1.1) / np.tanh(1.1)
pcm = (np.clip(out.T, -1, 1) * 32767).astype(np.int16)
with wave.open('/tmp/introbuild/audio.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('audio ok', round(float(pk), 3))
