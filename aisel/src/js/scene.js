/* ============================================================ the room: a first-person desk you look around and touch
   one photographic plate (img/room.webp) + live fire + three-depth parallax dust. Objects are the navigation. */
A.scene = (() => {
  const RW = 2368, RH = 1320, U = RW / 1500;                  // room plate size; hotspot art is drawn in 1500-wide units
  const stage = A.$('#stage'), room = A.$('#room'), cv = A.$('#scene'), g = cv.getContext('2d');
  const FIRE = { x: 945 * U, y: 372 * U };                    // base of the flame, room px
  const HOME = { cx: 930 * U, cy: RH * .5, z: 1 };

  /* ---- objects (polygons in plate units).  act:'fire' toggles the flame, tab opens a panel */
  const P = (...a) => a;
  const HS = [
    { id: 'fire', act: 'fire', n: 'Костёр', polys: [P([835, 235], [1070, 235], [1075, 400], [830, 400])], pad: 4 },
    { id: 'knob', act: 'fire', n: 'Живой костёр', circle: [210, 590, 95] },
    { id: 'matches', act: 'fire', n: 'Спички', polys: [P([203, 396], [312, 338], [338, 372], [232, 440])] },
    { id: 'quill', tab: 'quotes', n: 'Цитаты', polys: [P([1092, 78], [1195, 78], [1205, 170], [1100, 170]), P([1160, 0], [1285, 0], [1215, 95], [1160, 85])] },
    { id: 'potion', tab: 'potion', n: 'Зельеварня', polys: [P([258, 98], [300, 80], [372, 24], [458, 28], [476, 124], [452, 196], [372, 244], [270, 236]), P([984, 24], [1066, 24], [1070, 135], [986, 135])] },
    { id: 'stars', tab: 'sky', n: 'Небо', polys: [P([1215, 168], [1500, 298], [1500, 474], [1312, 430], [1246, 336])] },
    { id: 'scope', tab: 'path', n: 'Лесная карта', polys: [P([1242, 62], [1335, 46], [1500, 160], [1500, 212], [1424, 192])] },
    { id: 'bag', tab: 'bag', n: 'Сумка', polys: [P([1072, 172], [1236, 238], [1324, 332], [1330, 522], [1292, 524], [1238, 396], [1108, 262])] },
    { id: 'book', tab: 'books', n: 'Книга', polys: [P([428, 238], [745, 202], [882, 146], [1034, 132], [1262, 436], [1290, 504], [1002, 608], [882, 596], [452, 676], [398, 642])] }
  ];
  HS.forEach(h => {
    h.P = h.circle ? [P(...[...Array(18)].map((_, i) => [h.circle[0] + Math.cos(i / 18 * 6.283) * h.circle[2], h.circle[1] + Math.sin(i / 18 * 6.283) * h.circle[2]]))] : h.polys;
    const pts = h.P.flat(); h.bb = [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))].map(v => v * U);
    h.c = [(h.bb[0] + h.bb[2]) / 2, (h.bb[1] + h.bb[3]) / 2]; h.big = Math.max(h.bb[2] - h.bb[0], h.bb[3] - h.bb[1]);
  });
  const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const hit = (rx, ry) => { const x = rx / U, y = ry / U; return HS.find(h => h.P.some(p => inPoly(x, y, p))) || null; };

  /* ---- springs + camera */
  const sp = (x) => ({ x, v: 0, t: x });
  const step = (s, dt, k, c) => { const n = Math.ceil(dt / .008); const h = dt / n; for (let i = 0; i < n; i++) { s.v += (k * (s.t - s.x) - c * s.v) * h; s.x += s.v * h; } };
  const cam = { x: sp(HOME.cx), y: sp(HOME.cy), z: sp(1.9) };
  let VW = innerWidth, VH = innerHeight, DPR = 1, s0 = 1, gx = 0, gy = 0, gxT = 0, gyT = 0, dirty = true, locked = true, focusId = null, saved = null, running = false, last = 0, T = 0, mode = 'gate';
  const KC = [150, 24];                                           // spring stiffness / damping: lively but settled
  const sNow = () => s0 * cam.z.x;
  function limits(z) { const s = s0 * z, hw = VW / (2 * s), hh = VH / (2 * s); return { x0: Math.min(hw, RW / 2), x1: Math.max(RW - hw, RW / 2), y0: Math.min(hh, RH / 2), y1: Math.max(RH - hh, RH / 2) }; }
  const clampT = () => { const l = limits(cam.z.t); cam.x.t = A.clamp(cam.x.t, l.x0, l.x1); cam.y.t = A.clamp(cam.y.t, l.y0, l.y1); };
  function resize() {
    VW = innerWidth; VH = innerHeight; DPR = Math.min(devicePixelRatio || 1, 2); s0 = Math.max(VW / RW, VH * .64 / RH);
    cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR); g.setTransform(DPR, 0, 0, DPR, 0, 0); clampT(); dirty = true;
  }
  function apply() {
    const s = sNow(), l = limits(cam.z.x), cx = A.clamp(cam.x.x, l.x0 - 140, l.x1 + 140), cy = A.clamp(cam.y.x, l.y0 - 90, l.y1 + 90);
    room.style.transform = `translate3d(${(VW / 2 - cx * s + gx).toFixed(2)}px,${(VH / 2 - cy * s + gy).toFixed(2)}px,0) scale(${s.toFixed(4)})`;
  }
  const toRoom = (sx, sy) => { const s = sNow(); return [cam.x.x + (sx - VW / 2 - gx) / s, cam.y.x + (sy - VH / 2 - gy) / s]; };
  const toScreen = (rx, ry) => { const s = sNow(); return [VW / 2 + (rx - cam.x.x) * s + gx, VH / 2 + (ry - cam.y.x) * s + gy]; };

  /* ---- dust & bokeh in three depth planes, plus embers from the fire */
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const glowSpr = (rgb) => { const c = mk(64, 64), x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.18, `rgba(${rgb},.65)`); gr.addColorStop(.5, `rgba(${rgb},.14)`); gr.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c; };
  const SPR = { gold: glowSpr('255,214,140'), warm: glowSpr('255,236,200'), ember: glowSpr('255,140,60') };
  const rnd = (a, b) => a + Math.random() * (b - a);
  let dust = [], embers = [];
  function seed() {
    dust = [];
    const mkp = (n, d, rMin, rMax, a, kind) => { for (let i = 0; i < n; i++) dust.push({ x: rnd(0, 2400), y: rnd(0, 1400), d, r: rnd(rMin, rMax), a: a * rnd(.5, 1), ph: rnd(0, 6.28), sp: rnd(.3, 1.1), vx: rnd(-6, 6), vy: rnd(-9, -2), kind }); };
    mkp(46, .8, 1.2, 2.6, .5, 'warm'); mkp(52, 1.08, 1.8, 3.8, .75, 'gold'); mkp(9, 1.75, 16, 34, .16, 'gold');
  }
  function particles(dt, vis) {
    g.clearRect(0, 0, VW, VH); const s = sNow(), padX = VW + 120, padY = VH + 120;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const p of dust) {
      p.x += (p.vx + Math.sin(T * p.sp + p.ph) * 5) * dt; p.y += p.vy * dt;
      let sx = VW / 2 + (p.x - cam.x.x) * s * p.d + gx * p.d * 1.3, sy = VH / 2 + (p.y - cam.y.x) * s * p.d + gy * p.d * 1.3;
      sx = ((sx % padX) + padX) % padX - 60; sy = ((sy % padY) + padY) % padY - 60;
      const tw = .45 + .55 * Math.abs(Math.sin(T * p.sp * 1.4 + p.ph)), r = p.r * (p.d > 1.5 ? 1 : s0 * 3.2 + .6);
      g.globalAlpha = p.a * tw * vis; g.drawImage(p.kind === 'warm' ? SPR.warm : SPR.gold, sx - r, sy - r, r * 2, r * 2);
    }
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i]; e.life += dt; if (e.life > e.max) { embers.splice(i, 1); continue; }
      e.x += (e.vx + Math.sin(T * 3 + e.ph) * 14) * dt; e.y += e.vy * dt; e.vy *= .995;
      const k = 1 - e.life / e.max, [sx, sy] = toScreen(e.x, e.y), r = e.r * s * 3.4 * (.4 + k * .6) + 1.5;
      g.globalAlpha = Math.min(1, k * 1.4) * .95 * vis; g.drawImage(SPR.ember, sx - r, sy - r, r * 2, r * 2);
    }
    g.restore();
  }

  /* ---- the open book on the table speaks: it shows what she is reading (handwriting follows the page's perspective) */
  const quadMatrix = (w, h, q) => {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q, dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3, det = dx1 * dy2 - dx2 * dy1;
    const gg = (dx3 * dy2 - dx2 * dy3) / det, hh = (dx1 * dy3 - dx3 * dy1) / det, a = x1 - x0 + gg * x1, b = x3 - x0 + hh * x3, d = y1 - y0 + gg * y1, e = y3 - y0 + hh * y3;
    return `matrix3d(${a / w},${d / w},0,${gg / w},${b / h},${e / h},0,${hh / h},0,0,1,0,${x0},${y0},0,1)`;
  };
  const PAGE = [[486, 262], [716, 232], [836, 546], [496, 626]].map(([x, y]) => [x * U, y * U]);
  function refreshPage() {
    const el = A.$('#pageTxt'), b = A.state.books.find(x => x.status === 'reading'), done = A.doneBooks().length;
    el.style.cssText = `width:620px;height:900px;transform:${quadMatrix(620, 900, PAGE)}`;
    el.innerHTML = `<h2>Книга Айсель</h2><i class="fl"></i>${b ? `<p>Сейчас читаю</p><b>${A.esc(b.title)}</b>` : `<p>Страницы ждут</p><b>Коснись книги</b>`}${done ? `<small>прочитано ${done} ${A.plural(done, 'книга', 'книги', 'книг')}</small>` : ''}`;
  }

  /* ---- hotspot decoration: press-glow, idle glint, label (all opacity/transform only) */
  function buildHs() {
    const fx = A.$('#hsFx'), lb = A.$('#labels'); fx.innerHTML = lb.innerHTML = '';
    HS.forEach((h, i) => {
      const [x0, y0, x1, y1] = h.bb, w = x1 - x0, hh = y1 - y0;
      const d = A.h(`<div class="hs" data-id="${h.id}" style="left:${x0}px;top:${y0}px;width:${w}px;height:${hh}px;clip-path:polygon(${h.P[0].map(([x, y]) => `${x * U - x0}px ${y * U - y0}px`).join(',')})"></div>`);
      if (h.P.length > 1) d.style.clipPath = 'none', d.style.borderRadius = '40%';
      fx.appendChild(d); h.fx = d;
      if (h.id !== 'fire') { const gl = A.h(`<i class="glint" style="left:${h.c[0]}px;top:${h.c[1]}px;animation-delay:${(i * 1.7) % 9}s"></i>`); fx.appendChild(gl); h.gl = gl; }
      const l = A.h(`<span class="lab" data-id="${h.id}" style="left:${h.c[0]}px;top:${Math.max(70, h.bb[1] - 6)}px">${h.n}</span>`); lb.appendChild(l); h.lab = l;
    });
  }
  const press = (h, on) => { HS.forEach(x => x.fx && x.fx.classList.remove('on')); if (h && on) { h.fx.classList.add('on'); if (h.act === 'fire') (HS.filter(o => o.act === 'fire').forEach(o => o.fx.classList.add('on'))); } };
  let labelsT = 0;
  const showLabels = (ms = 4200) => { A.$('#labels').classList.add('show'); clearTimeout(labelsT); labelsT = setTimeout(() => A.$('#labels').classList.remove('show'), ms); };

  /* ---- input: drag to look around with inertia, tap an object */
  let drag = null, sweepOn = false;
  const cancelSweep = () => { sweepOn = false; };
  stage.addEventListener('pointerdown', e => {
    if (locked || e.button > 0) return; cancelSweep(); stage.setPointerCapture(e.pointerId);
    const [rx, ry] = toRoom(e.clientX, e.clientY); drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: false, vx: 0, vy: 0, h: hit(rx, ry), lx: e.clientX, ly: e.clientY, lt: performance.now() };
    press(drag.h, true);
  });
  stage.addEventListener('pointermove', e => {
    if (!drag) { if (!locked && e.pointerType === 'mouse') { const [rx, ry] = toRoom(e.clientX, e.clientY), h = hit(rx, ry); stage.style.cursor = h ? 'pointer' : 'grab'; press(h, true); } return; }
    if (e.pointerId !== drag.id) return; const s = sNow();
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 9) { drag.moved = true; press(null); stage.classList.add('grab'); }
    if (drag.moved) {
      const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly, now = performance.now(), dt = Math.max(1, now - drag.lt);
      cam.x.t -= dx / s; cam.y.t -= dy / s; drag.vx = drag.vx * .7 + (-dx / s / dt * 1000) * .3; drag.vy = drag.vy * .7 + (-dy / s / dt * 1000) * .3; drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = now; clampT();
      cam.x.x = cam.x.t; cam.y.x = cam.y.t; cam.x.v = cam.y.v = 0; dirty = true;                      // follows the finger 1:1
    }
  });
  const up = e => {
    if (!drag || e.pointerId !== drag.id) return; const d = drag; drag = null; stage.classList.remove('grab'); press(null);
    if (!d.moved && performance.now() - d.t < 600) { const [rx, ry] = toRoom(e.clientX, e.clientY), h = hit(rx, ry); tap(h, e.clientX, e.clientY); }
    else if (d.moved) { cam.x.t += d.vx * .22; cam.y.t += d.vy * .22; clampT(); cam.x.v = d.vx * .3; cam.y.v = d.vy * .3; }
  };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', e => { if (drag && e.pointerId === drag.id) { drag = null; press(null); } });
  stage.addEventListener('wheel', e => { if (locked) return; e.preventDefault(); cancelSweep(); const s = sNow(); cam.x.t += (e.deltaX + (e.shiftKey ? e.deltaY : 0)) / s; cam.y.t += (e.shiftKey ? 0 : e.deltaY) / s; clampT(); }, { passive: false });
  addEventListener('keydown', e => { if (locked) return; const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (k) { cam.x.t += k[0] * 260; cam.y.t += k[1] * 200; clampT(); } });
  function tap(h, sx, sy) {
    if (!h) { showLabels(); A.snd.tap && A.snd.tap(); A.fx.sparks(sx, sy, 6, '#ffd98a'); return; }
    A.vibrate(12); if (h.act === 'fire') { A.fire.toggle(); return; }
    A.snd.chime && A.snd.chime([392, 523.25], .08, .6); A.go(h.tab);
  }
  if (window.DeviceOrientationEvent) addEventListener('deviceorientation', e => { if (e.gamma == null) return; gxT = A.clamp(e.gamma / 30, -1, 1) * -16; gyT = A.clamp(((e.beta || 45) - 50) / 40, -1, 1) * -10; }, { passive: true });
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && !drag) { gxT = -((e.clientX / VW) - .5) * 22; gyT = -((e.clientY / VH) - .5) * 14; } }, { passive: true });
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) last = performance.now(); });

  /* ---- frame */
  function loop(now) {
    if (!running) return; requestAnimationFrame(loop);
    const dtm = now - last; if (document.hidden) { last = now; return; } if (mode === 'panel' && dtm < 30) return;
    const dt = Math.min(.05, dtm / 1000); last = now; T += dt;
    if (!drag || !drag.moved) { step(cam.x, dt, KC[0], KC[1]); step(cam.y, dt, KC[0], KC[1]); }
    step(cam.z, dt, 120, 20); gx += (gxT - gx) * Math.min(1, dt * 3); gy += (gyT - gy) * Math.min(1, dt * 3);
    apply(); A.fire && A.fire.frame(dt, T);
    particles(dt, mode === 'panel' ? .5 : 1);
  }

  /* ---- public */
  const api = {
    init() { resize(); seed(); buildHs(); refreshPage(); },
    start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(loop); },
    mode: () => mode, hs: id => HS.find(h => h.id === id), fireBase: () => FIRE, refreshPage, showLabels,
    spark(x, y) { embers.push({ x, y, vx: rnd(-26, 36), vy: rnd(-150, -50), r: rnd(.9, 2.2), life: 0, max: rnd(1.8, 3.8), ph: rnd(0, 6) }); },
    enter(first) {                                         // walk into the room: dolly in from the dark, then look around once
      mode = 'room'; locked = false; cam.z.x = 2.1; cam.z.v = 0; cam.z.t = 1; cam.x.x = HOME.cx - 40; cam.x.t = HOME.cx; cam.y.x = HOME.cy - 120; cam.y.t = HOME.cy; cam.x.v = cam.y.v = 0;
      stage.classList.add('in'); if (first) setTimeout(() => api.sweep(), 2300); setTimeout(() => showLabels(first ? 6500 : 3200), first ? 1500 : 900);
    },
    sweep() {
      if (sweepOn || locked) return; sweepOn = true; const pts = [[560 * U, RH * .55], [1400 * U, RH * .4], [HOME.cx, HOME.cy]]; let i = 0;
      const go = () => { if (!sweepOn || i >= pts.length) { sweepOn = false; return; } cam.x.t = pts[i][0]; cam.y.t = pts[i][1]; clampT(); i++; setTimeout(go, 1900); }; go();
    },
    focus(id) {                                            // camera glides to the object; resolves when it fills the view
      const h = HS.find(o => o.id === id); if (!h) return Promise.resolve(); cancelSweep();
      if (!saved) saved = { x: cam.x.t, y: cam.y.t, z: cam.z.t }; focusId = id; mode = 'panel'; locked = true; A.$('#labels').classList.remove('show');
      cam.z.t = A.clamp(.58 * Math.min(VW, VH) / (h.big * s0), 1.5, 3.4); cam.x.t = h.c[0]; cam.y.t = h.c[1]; clampT();
      return new Promise(r => setTimeout(r, 420));
    },
    unfocus() { if (saved) { cam.x.t = saved.x; cam.y.t = saved.y; cam.z.t = saved.z; saved = null; } focusId = null; mode = 'room'; locked = false; clampT(); refreshPage(); },
    focusPoint() { return toScreen(...(HS.find(o => o.id === focusId) || { c: [cam.x.x, cam.y.x] }).c); },
    avatar() { const c = mk(200, 200), x = c.getContext('2d'), gr = x.createRadialGradient(100, 90, 4, 100, 100, 120); gr.addColorStop(0, '#2a1d12'); gr.addColorStop(1, '#050302'); x.fillStyle = gr; x.fillRect(0, 0, 200, 200);
      x.font = '500 124px "Cormorant Garamond",Georgia,serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = 'rgba(255,214,140,.7)'; x.shadowBlur = 24; x.fillStyle = '#f3d79a'; x.fillText('А', 100, 108); return c.toDataURL('image/jpeg', .9); },
    look(u, v, z = 1) { cancelSweep(); cam.x.t = u * U; cam.y.t = v * U; cam.z.t = z; clampT(); },
    lock(v) { locked = v; }, screenOf(id) { const h = HS.find(o => o.id === id); return toScreen(...h.c); }, cam: () => ({ x: cam.x.x, y: cam.y.x, z: cam.z.x })
  };
  return api;
})();
