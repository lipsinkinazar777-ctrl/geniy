/* ============================================================ sound: everything is synthesised (no files), so it works offline */
A.snd = (() => {
  let ctx, master, amb, sfx, mus, rev, noise, started = false, fire = 0, mood = 'path';
  const timers = [];
  const S = () => A.state.settings;
  const SCALES = { path: [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33], books: [146.83, 196, 220, 246.94, 293.66, 392, 440, 493.88], quotes: [174.61, 220, 261.63, 293.66, 349.23, 440, 523.25], sky: [329.63, 392, 493.88, 587.33, 659.25, 783.99, 987.77], potion: [110, 130.81, 164.81, 196, 261.63, 329.63] };

  function impulse(sec, decay) { const n = ctx.sampleRate * sec, b = ctx.createBuffer(2, n, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); } return b; }
  function makeNoise(sec) { const n = ctx.sampleRate * sec, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
  const now = () => ctx.currentTime;
  function env(g, t, a, peak, d) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function osc(type, f, t, a, peak, d, dest, f2) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d); env(g, t, a, peak, d); o.connect(g); g.connect(dest || sfx); o.start(t); o.stop(t + a + d + .05); return o; }
  function noiseHit(t, dur, type, f, q, peak, dest, f2) { const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise; s.loop = true; fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = q || 1; env(g, t, Math.min(.02, dur / 3), peak, dur); s.connect(fl); fl.connect(g); g.connect(dest || sfx); s.start(t, Math.random() * 2); s.stop(t + dur + .05); }
  const loop = (fn, min, max) => { let stop = false; const run = () => { if (stop || !ctx) return; try { fn(); } catch (e) {} timers.push(setTimeout(run, (min + Math.random() * (max - min)) * 1000)); }; timers.push(setTimeout(run, min * 500)); return () => { stop = true; }; };

  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.connect(master);
    rev = ctx.createConvolver(); rev.buffer = impulse(2.6, 2.4); const rg = ctx.createGain(); rg.gain.value = .38; rev.connect(rg); rg.connect(comp);
    amb = ctx.createGain(); amb.gain.value = 1; amb.connect(comp);
    sfx = ctx.createGain(); sfx.gain.value = 1; sfx.connect(comp); sfx.connect(rev);
    mus = ctx.createGain(); mus.gain.value = .9; mus.connect(comp); mus.connect(rev);
    noise = makeNoise(4);
    applyVol(); return true;
  }
  function applyVol() { if (!ctx) return; const v = S().sound ? S().vol : 0; master.gain.cancelScheduledValues(now()); master.gain.linearRampToValueAtTime(v * .9, now() + .35); mus.gain.value = S().music ? .9 : 0; }

  /* ---- ambient bed */
  function bed() {
    // wind: band-passed noise with slow swell
    const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    s.buffer = noise; s.loop = true; bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = .5; lp.type = 'lowpass'; lp.frequency.value = 900; g.gain.value = .05;
    lfo.frequency.value = .07; lg.gain.value = .03; lfo.connect(lg); lg.connect(g.gain); s.connect(bp); bp.connect(lp); lp.connect(g); g.connect(amb); s.start(); lfo.start();
    // leaves
    const s2 = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g2 = ctx.createGain(), l2 = ctx.createOscillator(), lg2 = ctx.createGain();
    s2.buffer = noise; s2.loop = true; hp.type = 'highpass'; hp.frequency.value = 3800; g2.gain.value = .006; l2.frequency.value = .11; lg2.gain.value = .005; l2.connect(lg2); lg2.connect(g2.gain); s2.connect(hp); hp.connect(g2); g2.connect(amb); s2.start(); l2.start();
    // fire roar (level driven)
    const s3 = ctx.createBufferSource(), lp3 = ctx.createBiquadFilter(); fireG = ctx.createGain();
    s3.buffer = noise; s3.loop = true; lp3.type = 'lowpass'; lp3.frequency.value = 520; fireG.gain.value = 0; s3.connect(lp3); lp3.connect(fireG); fireG.connect(amb); s3.start();
    // crickets
    loop(() => { const t = now() + .02, f = 4100 + Math.random() * 500, n = 3 + (Math.random() * 4 | 0); for (let i = 0; i < n; i++) osc('sine', f, t + i * .045, .006, .004 + (mood === 'sky' ? .004 : 0), .03, amb); }, .5, 1.7);
    // birds (daylight scenes only)
    loop(() => { if (mood === 'sky' || mood === 'potion') return; const t = now() + .02, b = 2300 + Math.random() * 1400, n = 2 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) osc('sine', b, t + i * .11, .01, .014, .09, amb, b * (1.15 + Math.random() * .3)); }, 3.5, 9);
    // owl
    loop(() => { if (mood !== 'sky' && Math.random() < .7) return; const t = now() + .05; osc('sine', 392, t, .05, .02, .35, amb, 340); osc('sine', 349, t + .55, .05, .018, .45, amb, 300); }, 14, 30);
    // fire crackle
    const crack = () => { if (fire < .04) { timers.push(setTimeout(crack, 350)); return; } const t = now() + .01, pn = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (pn) { pn.pan.value = (Math.random() * 2 - 1) * .7; pn.connect(amb); } const d = pn || amb, lvl = .4 + fire * 1.6;
      noiseHit(t, .012 + Math.random() * .02, 'highpass', 1800 + Math.random() * 2500, 1, (.03 + fire * .1) * (.5 + Math.random()), d); if (Math.random() < .16 + fire * .22) noiseHit(t, .07 + Math.random() * .05, 'bandpass', 600 + Math.random() * 600, 3, .05 + fire * .09, d);
      if (Math.random() < .05) { for (let i = 0; i < 4; i++) noiseHit(t + i * .018, .012, 'highpass', 2500, 1, .09 * fire, d); }
      timers.push(setTimeout(crack, (110 + Math.random() * 480) / lvl)); };
    timers.push(setTimeout(crack, 400));
    // music box + pad
    const note = (f, vel = 1, when) => { const t = when || now(); [[1, .05], [2, .014], [3, .005]].forEach(([m, p]) => osc(m === 1 ? 'triangle' : 'sine', f * m, t, .004, p * vel, m === 1 ? 2.2 : 1.1, mus)); };
    loop(() => { if (!S().music) return; const sc = SCALES[mood] || SCALES.path, i = Math.floor(Math.random() * sc.length), t = now() + .05, arp = Math.random() < .4; note(sc[i], 1, t); if (arp) { note(sc[(i + 2) % sc.length], .8, t + .32); note(sc[(i + 4) % sc.length], .7, t + .62); } else if (Math.random() < .35) note(sc[i] * 2, .5, t + .4); }, 1.8, 4.2);
    padLoop(); started = true;
  }
  let fireG;
  function padLoop() {
    const roots = { path: [110, 164.81, 196], books: [73.42, 110, 146.83], quotes: [87.31, 130.81, 174.61], sky: [82.41, 123.47, 164.81], potion: [55, 82.41, 110] };
    const run = () => { if (!ctx) return; const r = roots[mood] || roots.path, t = now(); r.forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createBiquadFilter(); o.type = 'sine'; o.frequency.value = f * (1 + (i - 1) * .002); l.type = 'lowpass'; l.frequency.value = 600; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(S().music ? .016 : 0, t + 4); g.gain.linearRampToValueAtTime(0.0001, t + 9); o.connect(l); l.connect(g); g.connect(mus); o.start(t); o.stop(t + 9.2); }); timers.push(setTimeout(run, 7500)); };
    run();
  }

  /* ---- public */
  const api = {
    get ready() { return !!ctx; },
    unlock() { if (!init()) return; if (ctx.state === 'suspended') ctx.resume(); if (!started) bed(); applyVol(); },
    setMood(m) { mood = m; },
    setFire(v) { fire = v; if (fireG && ctx) { fireG.gain.cancelScheduledValues(now()); fireG.gain.setTargetAtTime(v ? .13 : .0001, now(), v ? .5 : .7); } },
    refresh() { applyVol(); },
    suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); },
    resume() { if (ctx && S().sound && ctx.state === 'suspended') ctx.resume(); },
    tap() { if (!ctx) return; osc('sine', 880, now(), .003, .05, .05); },
    whoosh(dir = 1) { if (!ctx) return; const t = now(); noiseHit(t, .6, 'bandpass', dir > 0 ? 260 : 2000, .9, .12, sfx, dir > 0 ? 2400 : 260); osc('sine', dir > 0 ? 392 : 523, t + .18, .01, .035, .6); osc('sine', dir > 0 ? 587 : 392, t + .3, .01, .03, .7); },
    page() { if (!ctx) return; const t = now(); noiseHit(t, .16, 'bandpass', 2600, 1.2, .09, sfx, 900); noiseHit(t + .09, .12, 'highpass', 3500, 1, .04, sfx); },
    step() { if (!ctx) return; const t = now(); noiseHit(t, .09, 'lowpass', 420 + Math.random() * 120, 1, .1, sfx); noiseHit(t + .02, .05, 'highpass', 4500, 1, .012, sfx); },
    coin() { if (!ctx) return; const t = now(); osc('sine', 1318.5, t, .002, .09, .25); osc('sine', 1760, t + .07, .002, .08, .55); osc('triangle', 2637, t + .07, .002, .02, .4); },
    twinkle(i = 0) { if (!ctx) return; const f = [1568, 1760, 2093, 2349, 2637][i % 5], t = now(); osc('sine', f, t, .003, .05, .9); osc('sine', f * 1.5, t + .05, .003, .02, .6); },
    chime(notes = [523.25, 659.25, 783.99, 1046.5], gap = .11, vel = 1) { if (!ctx) return; const t = now(); notes.forEach((f, i) => { osc('sine', f, t + i * gap, .004, .06 * vel, 1.2); osc('triangle', f * 2, t + i * gap, .004, .012 * vel, .7); }); },
    unlock2() { api.chime([392, 523.25, 659.25, 783.99, 1046.5, 1318.5], .13, 1.2); if (ctx) noiseHit(now() + .1, 1.4, 'highpass', 5000, 1, .02, sfx); },
    bubble() { if (!ctx) return; const f = 180 + Math.random() * 300; osc('sine', f, now(), .004, .05, .09, sfx, f * 2.2); },
    pop() { if (!ctx) return; osc('sine', 700, now(), .002, .06, .08, sfx, 180); },
    brew() { if (!ctx) return; const t = now(); noiseHit(t, 1.8, 'bandpass', 600, 2, .07, sfx, 3200); [293.66, 349.23, 440, 587.33, 698.46, 880].forEach((f, i) => osc('triangle', f, t + .15 * i, .01, .045, 1.4)); },
    quill() { if (!ctx) return; const t = now(); for (let i = 0; i < 4; i++) noiseHit(t + i * .06, .05, 'bandpass', 3000 + i * 500, 2, .03, sfx); },
    fireOut() { if (!ctx) return; const t = now(); noiseHit(t, 1.1, 'highpass', 2200, .8, .1, sfx, 7000); noiseHit(t + .05, .5, 'bandpass', 500, 1.2, .08, sfx, 200); },
    fireLit() { if (!ctx) return; noiseHit(now(), .5, 'bandpass', 800, 1.5, .12, sfx, 2400); osc('sine', 220, now() + .05, .01, .04, .5); },
    owl() { if (!ctx) return; const t = now(); osc('sine', 392, t, .05, .05, .35, sfx, 340); osc('sine', 349, t + .55, .05, .045, .45, sfx, 300); },
    stream(sec = 5) { if (!ctx) return; const t = now(); noiseHit(t, sec, 'bandpass', 1500, .7, .05, amb, 2300); },
    shooting() { if (!ctx) return; const t = now(); noiseHit(t, .9, 'highpass', 3000, 1, .05, sfx, 9000); osc('sine', 2093, t, .01, .03, .9, sfx, 3136); }
  };
  document.addEventListener('visibilitychange', () => document.hidden ? api.suspend() : api.resume());
  return api;
})();
