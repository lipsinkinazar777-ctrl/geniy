/* ============================================================ scene: cinematic photographic backdrop
   photo layers (parallax + dolly) + volumetric fog + moon shafts + three-depth gold sparks & fireflies + grain */
A.scene = (() => {
  const cv = A.$('#scene'), g = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, last = 0, running = false;
  const IMG = {};
  ['pines', 'oak', 'finale', 'library', 'lantern', 'moon'].forEach(n => { const im = new Image(); im.decoding = 'async'; im.onload = () => { IMG[n].ok = true; }; IMG[n] = { el: im, ok: false }; im.src = `img/bg-${n}.webp`; });
  const S = { mode: 'gate', t: 0, p: 0, px: 0, py: 0, warm: 0, bg: 'moon', prev: null, mix: 1, appear: 0, zoomUI: 1.08 };
  const walk = { t: 0, dur: 10, done: null, on: false };
  let pxT = 0, paused = false, frame = 0;
  const FOCUS = { pines: [.5, .62], oak: [.5, .6], finale: [.4, .56], library: [.5, .55], lantern: [.5, .5], moon: [.5, .5] };

  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const clamp = A.clamp || ((v, a, b) => Math.min(b, Math.max(a, v)));

  /* ---- procedural sprites */
  const fogTex = (() => { const c = mk(1024, 384), x = c.getContext('2d');
    for (let i = 0; i < 70; i++) { const px = rnd(0, 1024), py = rnd(60, 330), r = rnd(80, 230), a = rnd(.05, .15);
      for (const o of [-1024, 0, 1024]) { const gr = x.createRadialGradient(px + o, py, 0, px + o, py, r); gr.addColorStop(0, `rgba(176,206,220,${a})`); gr.addColorStop(1, 'rgba(176,206,220,0)'); x.fillStyle = gr; x.fillRect(px + o - r, py - r, r * 2, r * 2); } }
    x.globalCompositeOperation = 'destination-in'; const mg = x.createLinearGradient(0, 0, 0, 384); mg.addColorStop(0, 'rgba(0,0,0,0)'); mg.addColorStop(.3, 'rgba(0,0,0,1)'); mg.addColorStop(.7, 'rgba(0,0,0,1)'); mg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = mg; x.fillRect(0, 0, 1024, 384);
    return c; })();
  const glowSpr = (rgb) => { const c = mk(64, 64), x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.16, `rgba(${rgb},.7)`); gr.addColorStop(.42, `rgba(${rgb},.18)`); gr.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c; };
  const SPR = { gold: glowSpr('255,214,140'), fly: glowSpr('216,255,160'), ember: glowSpr('255,150,70'), fire: glowSpr('255,170,80') };
  const grain = (() => { const c = mk(160, 160), x = c.getContext('2d'), d = x.createImageData(160, 160); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); return c; })();

  /* ---- particles in three depth planes */
  let P = [], embers = [];
  function seed() {
    const area = W * H / (390 * 844), n = Math.round(clamp(area, .8, 2.2) * 1);
    P = [];
    for (let i = 0; i < 46 * n; i++) P.push({ k: 's', d: [.25, .55, 1][i % 3], x: rnd(0, W), y: rnd(0, H), vx: rnd(-4, 5), vy: rnd(-12, -3), ph: rnd(0, 6.28), sz: rnd(.7, 1.9), sp: rnd(.6, 1.8) });
    for (let i = 0; i < 16 * n; i++) P.push({ k: 'f', d: [.3, .6, 1][i % 3], x: rnd(0, W), y: rnd(H * .25, H), vx: rnd(-9, 9), vy: rnd(-5, 5), ph: rnd(0, 6.28), sz: rnd(7, 15), sp: rnd(.35, 1.1), h: Math.random() < .3 });
  }
  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); g.setTransform(DPR, 0, 0, DPR, 0, 0); seed();
  }

  /* ---- photo placement (cover + focal point + zoom + parallax) */
  function place(name, zoom, fx, fy, shiftX = 0, shiftY = 0) {
    const im = IMG[name]; if (!im || !im.ok) return null;
    const iw = im.el.naturalWidth, ih = im.el.naturalHeight, s = Math.max(W / iw, H / ih) * zoom, w = iw * s, h = ih * s;
    let x = W * .5 - fx * w + shiftX, y = H * .5 - fy * h + shiftY; x = clamp(x, W - w, 0); y = clamp(y, H - h, 0);
    return { im: im.el, x, y, w, h, s };
  }
  function drawPhoto(r, alpha = 1) { if (!r) return; g.globalAlpha = alpha; g.drawImage(r.im, r.x, r.y, r.w, r.h); g.globalAlpha = 1; }

  /* ---- fog, shafts, particles, fire */
  function fog(t, strength, lowOnly) {
    const speeds = [[14, .5, .42, 1.1], [-9, .3, .3, 1.5]];
    speeds.forEach(([v, ypos, a, sc], i) => {
      const h = 384 * sc * (W / 560 > 1 ? W / 560 : 1), w = 1024 * sc * (W / 560 > 1 ? W / 560 : 1), y = H * (lowOnly ? .56 + i * .1 : ypos) - h * .5 + Math.sin(t * .12 + i) * 10;
      const off = ((t * v) % w + w) % w; g.globalAlpha = clamp(a * strength, 0, 1);
      for (let x = -off; x < W; x += w) g.drawImage(fogTex, x, y, w, h);
    });
    g.globalAlpha = 1;
  }
  function shafts(t, a) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const x0 = W * (.55 + i * .12) + S.px * 14 * (i + 1) * .3, wd = 36 + i * 22, pulse = .55 + .45 * Math.sin(t * .35 + i * 1.7);
      const gr = g.createLinearGradient(x0, 0, x0 - W * .32, H * .85); gr.addColorStop(0, `rgba(170,205,255,${.10 * a * pulse})`); gr.addColorStop(.6, `rgba(120,160,210,${.035 * a * pulse})`); gr.addColorStop(1, 'rgba(120,160,210,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + wd, 0); g.lineTo(x0 + wd - W * .32 - 30, H * .85); g.lineTo(x0 - W * .32 - 30 - wd * .4, H * .85); g.closePath(); g.fill();
    }
    g.restore();
  }
  function particles(dt, t, a) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const p of P) {
      const par = (p.d - .35) * 34; p.x += (p.vx + Math.sin(t * p.sp + p.ph) * 6 * p.d) * dt * (.4 + p.d * .6); p.y += p.vy * dt * (.4 + p.d * .6);
      if (p.y < -30) { p.y = H + 20; p.x = rnd(0, W); } if (p.y > H + 40) p.y = -20; if (p.x < -30) p.x = W + 20; if (p.x > W + 30) p.x = -20;
      const x = p.x + S.px * par, y = p.y + S.py * par * .6;
      if (p.k === 's') {
        const tw = .35 + .65 * Math.abs(Math.sin(t * p.sp * 1.6 + p.ph)), r = p.sz * (.55 + p.d * .75) * 5;
        g.globalAlpha = tw * (.45 + p.d * .5) * a; g.drawImage(SPR.gold, x - r, y - r, r * 2, r * 2);
      } else {
        const bl = Math.pow(Math.max(0, Math.sin(t * p.sp + p.ph)), 3), r = p.sz * (.55 + p.d * .7) * (.7 + bl * .6);
        g.globalAlpha = (.12 + bl * .88) * (.45 + p.d * .55) * a; g.drawImage(p.h ? SPR.gold : SPR.fly, x - r * 2, y - r * 2, r * 4, r * 4);
      }
    }
    g.globalAlpha = 1; g.restore();
  }
  function firePos(r) { return r ? { x: r.x + 520 * r.s, y: r.y + 1190 * r.s, k: r.s } : null; }
  function fireFx(dt, t, r, a) {
    const f = firePos(r); if (!f) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    const fl = .8 + .2 * Math.sin(t * 9) * Math.sin(t * 5.3) + .06 * Math.sin(t * 23), R = 170 * f.k * 2.4;
    g.globalAlpha = .62 * fl * a; g.drawImage(SPR.fire, f.x - R, f.y - R * .95, R * 2, R * 2);
    if (Math.random() < dt * 22) embers.push({ x: f.x + rnd(-24, 24) * f.k, y: f.y - rnd(20, 70) * f.k, vx: rnd(-14, 18), vy: rnd(-70, -28), life: 0, max: rnd(1.6, 3.4), s: rnd(1, 2.6) });
    embers = embers.filter(e => { e.life += dt; if (e.life > e.max) return false; e.x += (e.vx + Math.sin(t * 3 + e.max * 5) * 12) * dt; e.y += e.vy * dt; const k = 1 - e.life / e.max, r2 = e.s * 5 * (.5 + k); g.globalAlpha = k * .9 * a; g.drawImage(SPR.ember, e.x - r2, e.y - r2, r2 * 2, r2 * 2); return true; });
    g.restore();
  }
  function noise() { g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .09; const ox = (frame * 37) % 160, oy = (frame * 53) % 160; for (let x = -ox; x < W; x += 160) for (let y = -oy; y < H; y += 160) g.drawImage(grain, x, y); g.restore(); }

  /* ---- timeline */
  function shot(t) {   // returns {a:[name,zoom,fx,fy,sx,sy,alpha], b:[...]|null, fog}
    const e = ease(t), px = S.px * 18, py = S.py * 10; let fogS = .55;
    const bump = (c, w) => Math.exp(-Math.pow((t - c) / w, 2));
    fogS = .55 + .9 * bump(.45, .07) + .9 * bump(.80, .06);
    const seg = (a, b, tt) => clamp((tt - a) / (b - a), 0, 1);
    const L = [];
    if (t < .47) L.push(['pines', 1.04 + .55 * ease(seg(0, .47, t)), .5, .62 - .1 * seg(0, .47, t), px, py, 1]);
    if (t >= .42 && t < .84) L.push(['oak', 1.0 + .5 * ease(seg(.42, .84, t)), .5, .6, px, py, ease(seg(.42, .5, t))]);
    if (t >= .78) L.push(['finale', 1.45 - .45 * ease(seg(.78, 1, t)), .4, .56 + .0 * seg(.78, 1, t), px, py, ease(seg(.78, .86, t))]);
    return { L, fog: fogS };
  }

  function loop(now) {
    if (!running) return; requestAnimationFrame(loop);
    const dtm = now - last; if (paused) { last = now; return; } if (S.mode === 'ui' && dtm < 30) return;
    const dt = Math.min(.05, dtm / 1000); last = now; S.t += dt; frame++;
    S.px += (pxT - S.px) * Math.min(1, dt * 3); S.warm += ((warmT) - S.warm) * Math.min(1, dt * 2.5);
    S.appear = Math.min(1, S.appear + dt * .55);
    g.fillStyle = '#020605'; g.fillRect(0, 0, W, H);
    let fogS = .5, pa = 1, fireA = 0, fireR = null;
    if (S.mode === 'gate') {
      const z = 1.04 + .012 * Math.sin(S.t * .2), r = place('pines', z, .5, .62, S.px * 14, S.py * 8); drawPhoto(r, S.appear); fogS = .7;
    } else if (S.mode === 'walk') {
      walk.t += dt; const t = clamp(walk.t / walk.dur, 0, 1), sh = shot(t); fogS = sh.fog;
      sh.L.forEach(([n, z, fx, fy, sx, sy, al], i) => { const r = place(n, z, fx, fy, sx, sy); drawPhoto(r, al); if (n === 'finale') { fireR = r; fireA = al; } });
      if (t >= 1 && walk.on) { walk.on = false; S.mode = 'finale'; S.t0 = S.t; const d = walk.done; walk.done = null; d && d(); }
    } else if (S.mode === 'finale') {
      const z = 1.0 + .01 * Math.sin(S.t * .25), r = place('finale', z, .4, .56, S.px * 12, S.py * 6); drawPhoto(r, 1); fireR = r; fireA = 1; fogS = .55;
    } else {  // ui
      S.mix = Math.min(1, S.mix + dt / 1.2);
      const draw = (n, al) => { const r = place(n, S.zoomUI + .012 * Math.sin(S.t * .17), FOCUS[n][0], FOCUS[n][1], S.px * 16, S.py * 8); drawPhoto(r, al); };
      if (S.prev && S.mix < 1) draw(S.prev, 1); draw(S.bg, S.prev && S.mix < 1 ? ease(S.mix) : 1);
      fogS = .5; pa = .85;
    }
    shafts(S.t, S.mode === 'ui' ? .5 : 1);
    fog(S.t, fogS, false);
    if (fireR) fireFx(dt, S.t, fireR, fireA);
    if (S.warm > .02) { g.save(); g.globalCompositeOperation = 'lighter'; const R = Math.max(W, H) * .9, gr = g.createRadialGradient(W * .2, H * .98, 0, W * .2, H * .98, R); gr.addColorStop(0, `rgba(255,140,60,${.3 * S.warm * (.85 + .15 * Math.sin(S.t * 8))})`); gr.addColorStop(1, 'rgba(255,140,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
    particles(dt, S.t, pa); noise();
  }

  function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(loop); }
  let warmT = 0;
  addEventListener('resize', resize);
  addEventListener('pointermove', e => { pxT = (e.clientX / innerWidth - .5) * 2; S.py += ((e.clientY / innerHeight - .5) * 2 - S.py) * .08; }, { passive: true });
  addEventListener('deviceorientation', e => { if (e.gamma != null) { pxT = clamp(e.gamma / 28, -1, 1); S.py += (clamp((e.beta - 50) / 40, -1, 1) - S.py) * .08; } }, { passive: true });
  document.addEventListener('visibilitychange', () => { paused = document.hidden; });

  return {
    init() { resize(); }, start,
    mode() { return S.mode; },
    walk(dur, done) { S.mode = 'walk'; walk.t = 0; walk.dur = dur; walk.done = done; walk.on = true; },
    skipWalk() { if (S.mode === 'walk') walk.t = walk.dur * .985; },
    toUI() { S.mode = 'ui'; S.bg = S.bg || 'moon'; S.mix = 1; },
    setTab(tab) { const n = { path: 'moon', books: 'library', quotes: 'lantern', sky: 'moon', potion: 'oak' }[tab] || 'moon'; if (n === S.bg) return; S.prev = S.bg; S.bg = n; S.mix = 0; },
    setWarm(v) { warmT = v; }, setParallax(x) { pxT = x; },
    avatar() { const c = mk(200, 200), x = c.getContext('2d'), gr = x.createRadialGradient(100, 90, 4, 100, 100, 120); gr.addColorStop(0, '#16352f'); gr.addColorStop(1, '#030807'); x.fillStyle = gr; x.fillRect(0, 0, 200, 200);
      x.font = '500 124px "Cormorant Garamond",Georgia,serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = 'rgba(255,214,140,.7)'; x.shadowBlur = 24; x.fillStyle = '#f3d79a'; x.fillText('А', 100, 108); return c.toDataURL('image/jpeg', .9); },
    pause(v) { /* tabs keep their own photo; nothing to stop */ },
    freeze(mode) { S.mode = mode; }
  };
})();
