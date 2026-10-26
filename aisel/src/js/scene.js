/* ============================================================ the room: a first-person desk you look around and touch
   one photographic plate (img/room.webp) + live fire + three-depth parallax dust. Objects are the navigation. */
A.scene = (() => {
  const ORI = () => innerWidth >= innerHeight ? 'landscape' : 'portrait';
  const LAYOUTS = A.LAYOUTS;                                               // desk plates + hotspot polygons for both orientations (tools/make_main.py)
  const ROOMKEY = { lab: 'lab', lib: 'lib', cit: 'cit' };
  let ori = ORI(), LAY = LAYOUTS[ori], RW = LAY.w, RH = LAY.h, roomName = 'main';
  const stage = A.$('#stage'), room = A.$('#room'), cv = A.$('#scene'), g = cv.getContext('2d');
  const FIRE = { x: 0, y: 0 }; const HOME = { cx: 0, cy: 0, z: 1 };
  const PL = { main: A.$('#pl-main'), lab: A.$('#pl-lab'), lib: A.$('#pl-lib'), cit: A.$('#pl-cit') }, BG = A.$('#stageBg');
  const setBg = name => { const u = PL[name] && PL[name].src; if (u) BG.style.backgroundImage = `url("${u}")`; };
  const DEFS = [['enter', 'Войти', { act: 'enter' }], ['fire', 'Костёр', { act: 'fire' }], ['read', 'Книжный зал', { tab: 'books' }], ['lab', 'Алхимия', { tab: 'potion' }], ['quotes', 'Архив цитат', { tab: 'quotes' }], ['sky', 'Небо', { tab: 'sky' }], ['path', 'Лесная тропа', { tab: 'path' }], ['bag', 'Сумка', { tab: 'bag' }], ['lib', 'Библиотека', { tab: 'books' }]];
  let HS = [];
  const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const hit = (rx, ry) => roomName !== 'main' ? null : HS.find(h => h.P.some(p => inPoly(rx, ry, p))) || null;
  const bbox = poly => { const xs = poly.map(q => q[0]), ys = poly.map(q => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
  function buildHotspots() {
    HS = DEFS.filter(([id]) => LAY.hs[id]).map(([id, n, o]) => { const h = Object.assign({ id, n }, o); h.P = LAY.hs[id]; h.parts = h.P.map(bbox); h.bb = h.parts[0]; h.c = [(h.bb[0] + h.bb[2]) / 2, (h.bb[1] + h.bb[3]) / 2]; h.big = Math.max(h.bb[2] - h.bb[0], h.bb[3] - h.bb[1]); return h; });
  }

  /* ---- springs + camera */
  const sp = (x) => ({ x, v: 0, t: x });
  const step = (s, dt, k, c) => { const n = Math.ceil(dt / .008); const h = dt / n; for (let i = 0; i < n; i++) { s.v += (k * (s.t - s.x) - c * s.v) * h; s.x += s.v * h; } };
  const cam = { x: sp(0), y: sp(0), z: sp(1.9) };
  let frozen = false, VW = innerWidth, VH = innerHeight, DPR = 1, s0 = 1, gx = 0, gy = 0, gxT = 0, gyT = 0, dirty = true, locked = true, focusId = null, saved = null, running = false, last = 0, T = 0, mode = 'gate';
  const KC = [150, 24];                                           // spring stiffness / damping: lively but settled
  const sNow = () => s0 * cam.z.x;
  function limits(z) { const s = s0 * z, hw = VW / (2 * s), hh = VH / (2 * s); return { x0: Math.min(hw, RW / 2), x1: Math.max(RW - hw, RW / 2), y0: Math.min(hh, RH / 2), y1: Math.max(RH - hh, RH / 2) }; }
  const clampT = () => { const l = limits(cam.z.t); cam.x.t = A.clamp(cam.x.t, l.x0, l.x1); cam.y.t = A.clamp(cam.y.t, l.y0, l.y1); };
  const fitScale = () => { if (roomName !== 'main') return Math.max(VW / RW, VH / RH) * (roomName === 'lib' && VW > VH ? 1.3 : 1); const cover = Math.max(VW / RW, VH / RH), contain = Math.min(VW / RW, VH / RH); return cover / contain <= 1.8 ? Math.min(cover, contain * 1.3) : cover; };   // close aspects: show (almost) the whole frame and let a soft blurred copy fill the rest; far aspects: cover and pan
  function resize() {
    VW = innerWidth; VH = innerHeight; DPR = 1;
    if (ORI() !== ori) { ori = ORI(); relayout(); }
    s0 = fitScale();
    cv.width = VW; cv.height = VH; g.setTransform(1, 0, 0, 1, 0, 0); clampT(); dirty = true;
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
    mkp(10, .8, 1, 1.8, .24, 'warm'); mkp(8, 1.08, 1.2, 2.2, .26, 'gold');
  }
  /* the reading hall: the hearth and every candle breathe on their own phase; embers climb from the logs */
  const LIBL = [[952, 372, 700, 1, .8], [50, 318, 300, .8, 1.3], [790, 122, 220, .55, 2.1], [1068, 104, 240, .6, 3.4], [1640, 92, 230, .6, 4.2], [1384, 292, 200, .5, 5.1], [512, 160, 170, .4, 6], [672, 292, 170, .4, 7.3], [1280, 190, 220, .35, 8.2]];
  let emAcc = 0;
  function libLight(dt, vis) {
    const s = sNow(), au = A.snd.fireLevel ? A.snd.fireLevel() : 0; g.save(); g.globalCompositeOperation = 'lighter';
    LIBL.forEach(([x, y, r, a, ph], i) => {
      const f = i === 0 ? .86 + .08 * Math.sin(T * 5.7) + .05 * Math.sin(T * 9.9 + 1.1) + au * .16 : .82 + .12 * Math.sin(T * (4.6 + i * .7) + ph) + .07 * Math.sin(T * (8.3 + i) + ph * 2), [sx, sy] = toScreen(x, y), R = r * s, gr = g.createRadialGradient(sx, sy, 0, sx, sy, R);
      gr.addColorStop(0, `rgba(255,${i ? 170 : 150},${i ? 80 : 60},${(a * .34 * f * vis).toFixed(3)})`); gr.addColorStop(.4, `rgba(255,${i ? 130 : 110},50,${(a * .1 * f * vis).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,100,30,0)'); g.fillStyle = gr; g.fillRect(sx - R, sy - R, R * 2, R * 2);
    }); g.restore();
    emAcc += dt * (3 + au * 5); while (emAcc > 1) { emAcc--; embers.push({ x: 952 + rnd(-46, 46), y: 392 - rnd(0, 30), vx: rnd(-14, 14), vy: rnd(-105, -45), r: rnd(1, 2), life: 0, max: rnd(1.1, 2.4), ph: rnd(0, 6) }); }
  }
  function particles(dt, vis) {
    g.clearRect(0, 0, VW, VH); const s = sNow(), padX = VW + 120, padY = VH + 120;
    if (roomName === 'main' && A.fire) {                         // the fire lights the table: one soft gradient, redrawn here, no big blended layers
      const { L, f } = A.fire.light();
      if (L < 1) { g.globalAlpha = (1 - L) * .5; g.fillStyle = '#05071a'; g.fillRect(0, 0, VW, VH); g.globalAlpha = 1; }
      if (L > .01) { const [fx, fy] = toScreen(FIRE.x, FIRE.y - 40), R = Math.max(VW, VH) * .75 * Math.min(1.6, s / s0 * .7 + .5), gr = g.createRadialGradient(fx, fy, 0, fx, fy, R); gr.addColorStop(0, `rgba(255,150,60,${(.2 * L * f).toFixed(3)})`); gr.addColorStop(.45, `rgba(255,110,40,${(.07 * L * f).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,100,30,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'source-over'; }
    }
    if (roomName === 'lib') libLight(dt, vis);
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
      e.vx += (Math.sin(T * 2.6 + e.ph) * 26) * dt; e.vy *= 1 - .6 * dt; e.x += e.vx * dt; e.y += e.vy * dt;
      const k = 1 - e.life / e.max, [sx, sy] = toScreen(e.x, e.y), w = Math.max(.6, e.r * s * 1.1 * k), flick = .6 + .4 * Math.sin(T * 24 + e.ph * 9);
      g.globalAlpha = Math.min(1, k * 1.6) * flick * vis * .8; g.fillStyle = k > .55 ? 'rgb(255,214,140)' : k > .25 ? 'rgb(255,150,48)' : 'rgb(220,70,20)'; g.beginPath(); g.arc(sx, sy, w, 0, 6.283); g.fill();
      const r = w * 4; g.globalAlpha *= .35; g.drawImage(SPR.ember, sx - r, sy - r, r * 2, r * 2);
    }
    g.restore();
  }

  const roomPlate = name => name === 'main' ? { w: LAY.w, h: LAY.h, img: LAY.img } : { w: (LAY.sizes && LAY.sizes[name] || LAY.room)[0], h: (LAY.sizes && LAY.sizes[name] || LAY.room)[1], img: LAY.rooms[name] };
  function setPlates() {
    const want = { main: LAY.img, lab: LAY.rooms.lab, lib: LAY.rooms.lib, cit: LAY.rooms.cit };
    Object.keys(PL).forEach(k => { const el = PL[k], u = want[k]; if (el.dataset.src !== u) { el.dataset.src = u; el.src = u; } });
    PL.main.onload = () => { if (roomName === 'main') setBg('main'); };
    setBg(roomName);
  }
  function relayout() {
    LAY = LAYOUTS[ori]; FIRE.x = LAY.fire[0]; FIRE.y = LAY.fire[1]; HOME.cx = LAY.home[0]; HOME.cy = LAY.home[1];
    const r = roomPlate(roomName); RW = r.w; RH = r.h; room.style.width = RW + 'px'; room.style.height = RH + 'px'; setPlates(); s0 = fitScale();
    room.dataset.ori = ori; buildHotspots(); buildHs(); refreshPage(); A.fire && A.fire.place && A.fire.place();
    A.mods.potion && A.mods.potion.rebuild && A.mods.potion.rebuild(); A.lib && A.lib.rebuild && A.lib.rebuild(); A.casket && A.casket.relayout && A.casket.relayout();
    cam.x.x = cam.x.t = roomName === 'main' ? HOME.cx : RW / 2; cam.y.x = cam.y.t = roomName === 'main' ? HOME.cy : RH / 2; cam.x.v = cam.y.v = 0; seed();
  }
  const quadMatrix = (w, h, q) => {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q, dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3, det = dx1 * dy2 - dx2 * dy1;
    const gg = (dx3 * dy2 - dx2 * dy3) / det, hh = (dx1 * dy3 - dx3 * dy1) / det, a = x1 - x0 + gg * x1, b = x3 - x0 + hh * x3, d = y1 - y0 + gg * y1, e = y3 - y0 + hh * y3;
    return `matrix3d(${a / w},${d / w},0,${gg / w},${b / h},${e / h},0,${hh / h},0,0,1,0,${x0},${y0},0,1)`;
  };
  function refreshPage() {                                     // crisp handwriting on the open book: live text mapped onto the page, not baked pixels
    const el = A.$('#pageTxt'); if (!el || !LAY.page) return; const b = A.state.books.find(x => x.status === 'reading'), done = A.doneBooks().length;
    el.style.cssText = `width:600px;height:360px;transform:${quadMatrix(600, 360, LAY.page)}`;
    el.innerHTML = `<h2>Книга Айсель</h2><i></i><p class="a">${b ? 'Сейчас читаю' : 'Страницы ждут'}</p><b>${b ? A.esc(b.title) : 'Выбери книгу'}</b><p class="c">${done ? `прочитано ${done} ${A.plural(done, 'книга', 'книги', 'книг')}` : 'первая страница впереди'}</p>`;
  }
  /* ---- hotspot decoration: press-glow, idle glint, label (all opacity/transform only) */
  function buildHs() {
    const fx = A.$('#hsFx'), lb = A.$('#labels'); fx.innerHTML = lb.innerHTML = ''; A.fire && A.fire.reset && A.fire.reset();
    HS.forEach((h, i) => {
      h.fxs = h.parts.map(([x0, y0, x1, y1]) => { const d = A.h(`<div class="hs" data-id="${h.id}" style="left:${x0}px;top:${y0}px;width:${x1 - x0}px;height:${y1 - y0}px;border-radius:40%"></div>`); fx.appendChild(d); return d; });
      if (h.id !== 'enter' && h.id !== 'fire') { const gl = A.h(`<i class="glint" style="left:${h.c[0]}px;top:${h.c[1]}px;animation-delay:${(i * 1.7) % 9}s"></i>`); fx.appendChild(gl); }
      const l = A.h(`<span class="lab" data-id="${h.id}" style="left:${h.c[0]}px;top:${Math.max(70, h.bb[1] - 6)}px">${h.n}</span>`); lb.appendChild(l);
    });
  }
  const press = (h, on) => { HS.forEach(x => x.fxs && x.fxs.forEach(f => f.classList.remove('on'))); if (h && on && h.id !== 'enter') h.fxs.forEach(f => f.classList.add('on')); };
  let labelsT = 0;
  function untangle() {                                           // labels that would print over each other are stacked apart
    const L = [...A.$$('#labels .lab')]; L.forEach(l => { if (l.dataset.t0 == null) l.dataset.t0 = parseFloat(l.style.top); l.style.top = l.dataset.t0 + 'px'; }); const rs = L.map(l => l.getBoundingClientRect()), k = sNow();
    for (let i = 0; i < L.length; i++) for (let j = 0; j < i; j++) { const a = rs[j], b = rs[i]; if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) { L[i].style.top = (parseFloat(L[i].style.top) + (a.bottom - b.top + 8) / k) + 'px'; rs[i] = L[i].getBoundingClientRect(); } }
  }
  const showLabels = (ms = 4200) => { untangle(); A.$('#labels').classList.add('show'); clearTimeout(labelsT); labelsT = setTimeout(() => A.$('#labels').classList.remove('show'), ms); };

  /* ---- input: drag to look around with inertia, tap an object */
  let drag = null, sweepOn = false;
  const cancelSweep = () => { sweepOn = false; };
  stage.addEventListener('pointerdown', e => {
    if (locked || e.button > 0) return; cancelSweep(); stage.setPointerCapture(e.pointerId);
    const [rx, ry] = toRoom(e.clientX, e.clientY); drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: false, vx: 0, vy: 0, h: hit(rx, ry), lx: e.clientX, ly: e.clientY, lt: performance.now() };
    press(drag.h, true);
  });
  stage.addEventListener('pointermove', e => {
    if (!drag) { if (!locked && roomName === 'main' && e.pointerType === 'mouse') { const [rx, ry] = toRoom(e.clientX, e.clientY), h = hit(rx, ry); stage.style.cursor = h ? 'pointer' : 'grab'; press(h, true); } return; }
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
    if (h.act === 'enter') { A.snd.chime && A.snd.chime([392, 523.25, 659.25], .1, .6); A.snd.page && A.snd.page(); api.showZones(); return; }
    if (h.act === 'read') { const b = A.state.books.find(x => x.status === 'reading' && x.hasText) || A.state.books.find(x => x.hasText); if (b) { A.snd.page(); A.reader.open(b, null); } else A.go('books'); return; }
    A.snd.chime && A.snd.chime([392, 523.25], .08, .6); A.go(h.tab, { obj: h.id });
  }
  if (window.DeviceOrientationEvent) addEventListener('deviceorientation', e => { if (e.gamma == null) return; gxT = A.clamp(e.gamma / 30, -1, 1) * -16; gyT = A.clamp(((e.beta || 45) - 50) / 40, -1, 1) * -10; }, { passive: true });
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && !drag) { gxT = -((e.clientX / VW) - .5) * 22; gyT = -((e.clientY / VH) - .5) * 14; } }, { passive: true });
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) last = performance.now(); });

  /* ---- frame */
  function loop(now) {
    if (!running) return; requestAnimationFrame(loop); if (frozen) { last = now; return; }
    const dtm = now - last; if (document.hidden) { last = now; return; } if (mode === 'panel' && dtm < 30) return;
    const dt = Math.min(.05, dtm / 1000); last = now; T += dt;
    if (!drag || !drag.moved) { step(cam.x, dt, KC[0], KC[1]); step(cam.y, dt, KC[0], KC[1]); }
    step(cam.z, dt, 120, 20); gx += (gxT + Math.sin(T * .45) * 4 - gx) * Math.min(1, dt * 3); gy += (gyT + Math.sin(T * .37 + 1) * 3 - gy) * Math.min(1, dt * 3);
    apply(); A.fire && A.fire.frame(dt, T);
    particles(dt, mode === 'panel' ? .5 : 1);
  }

  /* ---- public */
  const api = {
    init() { ori = ORI(); resize(); relayout(); setTimeout(() => ['lab', 'lib', 'cit'].forEach(k => PL[k].decode && PL[k].decode().catch(() => {})), 600); },
    room: () => roomName, ori: () => ori,
    setRoom(name, z = 1) {                                  // instant swap of the plate; the caller hides the cut behind a curtain
      const r = roomPlate(name); roomName = name; RW = r.w; RH = r.h; room.dataset.room = name; room.style.width = RW + 'px'; room.style.height = RH + 'px';
      setBg(name); saved = name === 'main' ? saved : null; focusId = null; resize();
      cam.z.x = cam.z.t = z; cam.z.v = 0; mode = 'room'; locked = false; cam.x.x = cam.x.t = name === 'main' ? HOME.cx : RW / 2 + (name === 'lab' && ori === 'portrait' ? 110 : 0) + (name === 'lib' && ori === 'portrait' ? 95 : 0); cam.y.x = cam.y.t = name === 'main' ? HOME.cy : RH / 2 + (name === 'lib' && ori === 'landscape' ? RH * .09 : 0); cam.x.v = cam.y.v = 0; clampT(); dirty = true; apply();
    },
    layout: () => LAY, plateToScreen: (x, y) => toScreen(x, y),
    clientToRoom: (x, y) => toRoom(x, y),
    returnMain(id) {
      api.setRoom('main'); const h = HS.find(o => o.id === id);
      if (h) { cam.z.x = A.clamp(.58 * Math.min(VW, VH) / (h.big * s0), 1.5, 3.4); cam.x.x = h.c[0]; cam.y.x = h.c[1]; cam.x.v = cam.y.v = cam.z.v = 0; }
      saved = null; cam.x.t = HOME.cx; cam.y.t = HOME.cy; cam.z.t = 1; mode = 'room'; locked = false; clampT(); refreshPage();
    },
    dolly(z0 = 1.3) { cam.z.x = z0; cam.z.v = 0; cam.z.t = 1; },
    start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(loop); },
    showZones() { cancelSweep(); A.$('#hsFx').classList.add('zones'); showLabels(7000); clearTimeout(api._zt); api._zt = setTimeout(() => A.$('#hsFx').classList.remove('zones'), 7000); const h = A.$('#hint'); h.textContent = 'Коснись подсвеченной зоны'; h.classList.add('on'); setTimeout(() => h.classList.remove('on'), 5000); },
    mode: () => mode, hs: id => HS.find(h => h.id === id), fireBase: () => FIRE, refreshPage, showLabels,
    spark(x, y) { embers.push({ x, y, vx: rnd(-14, 14), vy: rnd(-95, -35), r: rnd(.9, 1.8), life: 0, max: rnd(.9, 2), ph: rnd(0, 6) }); },
    enter(first) {                                         // walk into the room: dolly in from the dark, then look around once
      mode = 'room'; locked = false; cam.z.x = 2.1; cam.z.v = 0; cam.z.t = 1; cam.x.x = HOME.cx - 40; cam.x.t = HOME.cx; cam.y.x = HOME.cy - 120; cam.y.t = HOME.cy; cam.x.v = cam.y.v = 0;
      stage.classList.add('in'); if (first) setTimeout(() => api.sweep(), 2300); setTimeout(() => showLabels(first ? 6500 : 3200), first ? 1500 : 900);
    },
    sweep() {
      if (sweepOn || locked) return; sweepOn = true; const pts = [[RW * .28, RH * .55], [RW * .72, RH * .4], [HOME.cx, HOME.cy]]; let i = 0;
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
    look(u, v, z = 1) { cancelSweep(); cam.x.t = u; cam.y.t = v; cam.z.t = z; clampT(); },
    freeze(v) { frozen = v; }, lock(v) { locked = v; }, parallax: () => ({ x: gx, y: gy }), screenOf(id, k = 0) { const h = HS.find(o => o.id === id), b = h.parts[k] || h.bb; return toScreen((b[0] + b[2]) / 2, (b[1] + b[3]) / 2); }, cam: () => ({ x: cam.x.x, y: cam.y.x, z: cam.z.x })
  };
  return api;
})();
