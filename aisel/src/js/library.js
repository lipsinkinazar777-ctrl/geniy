/* ============================================================ the reading hall: her books stand in a gentle arc on the rug in front of the fireplace, built as real 3D boxes (cover, spine, page block, loose leaves).
   swipe: the arc turns; the nearer hand drifts toward the book in the middle (hover); tap it: the book is pressed, both hands take it, it leaps up in a burst of gold light and smoke,
   the cover swings open and the pages riffle, light pours out, and the reading book (bookview.js) takes over. The inkwell opens the writing desk for a new quote.
   Everything is transform/opacity driven from one rAF loop. */
A.lib = (() => {
  const root = A.$('#lib3d'), BA = A.BOOKART;
  const KNOWN = [[/фонар/i, 'lantern'], [/ленн|принц/i, 'prince'], [/зов|умирающ/i, 'souls'], [/алис/i, 'alice'], [/пепл|проклят/i, 'ash'], [/гордост|предубежд/i, 'pride']];
  const PAL = Object.keys(BA);
  const artOf = b => { const t = b.title || '', au = b.author || ''; if (/айсел/i.test(au)) for (const [re, k] of KNOWN) if (re.test(t)) return { k, own: true }; return { k: PAL[A.hash(t + au) % PAL.length], own: false }; };
  class Sp { constructor(x = 0, k = 90, c = 15) { this.x = x; this.t = x; this.v = 0; this.k = k; this.c = c; } step(dt) { const n = Math.ceil(dt / .008), h = dt / n; for (let i = 0; i < n; i++) { this.v += (this.k * (this.t - this.x) - this.c * this.v) * h; this.x += this.v * h; } } get moving() { return Math.abs(this.t - this.x) > .0008 || Math.abs(this.v) > .004; } }
  const sgn = Math.sign, wait = ms => new Promise(r => setTimeout(r, ms)), ease = k => 1 - Math.pow(1 - A.clamp(k, 0, 1), 3), rnd = (a, b) => a + Math.random() * (b - a);
  let bvEl = null, stage, tagEl, noteEl, fxc, fxg, poolEl, raysEl, built = false, lastOri = '', items = [], p = 0, pv = 0, pt = 0, drag = null, G = null, active = false, busy = false, raf = 0, last = 0, T = 0, sel = null, hoverT = 0, lastIdx = -1, parx = 0, pary = 0, puffs = [], blooms = [], rings = [], sparks = [], fl = 1, kick = 0, hs = [], rays = new Sp(0, 40, 9);
  const order = { reading: 0, want: 1, done: 2 };

  const geo = () => { const vw = innerWidth, vh = innerHeight, land = vw > vh, W0 = land ? Math.min(vh * .34, 132) : Math.min(vw * .5, 210); return { vw, vh, land, W0, base: land ? vh * .935 : vh * .9, cx: vw / 2, step: W0 * .86 }; };
  const natOf = k => BA[k] || BA.lantern;
  const PAPER = 'radial-gradient(120% 90% at 50% 40%,#efe2bd,#e0cd9b 70%,#cdb883)';

  /* ---------------------------------------------------------------- one 3D book */
  function bookHTML(it) {
    const { k, own } = it.art, n = natOf(k), D = Math.round(n.w * .19), f = n.face, bh = f[3] - f[1], lc = `rgb(${n.mu.join(',')})`, lcL = `rgb(${n.mu.map(v => Math.min(255, v * 2.1 + 12)).join(',')})`;
    const b = it.b, tl = (b.title || '').length, fs = Math.round(n.w * (tl > 28 ? .064 : tl > 18 ? .076 : .09));
    const front = it.add ? `<img src="img/blank-ash.webp" alt=""><span class="bk__plus"></span><div class="bk__ttl" style="top:62%"><i style="font-size:${Math.round(n.w * .06)}px">новая книга</i></div>`
      : own ? `<img src="img/book-${k}.webp" alt="">`
      : `<img src="img/blank-${k}.webp" alt=""><img class="bk__emb" src="img/emblem-${k}.webp" alt="" style="left:${n.emb[0]}px;top:${n.emb[1]}px;width:${Math.round(n.w * .3)}px"><div class="bk__ttl"><b style="font-size:${fs}px">${A.esc(b.title)}</b><i style="font-size:${Math.round(n.w * .06)}px">${A.esc(b.author || '')}</i></div>`;
    const bx = f[0] + 8, bw = f[2] - f[0] - 12, by = f[1] + 5;
    const leaves = [0, 1, 2].map(i => `<div class="bk__lf" style="top:${by}px;height:${bh - 10}px;left:${bx}px;width:${bw}px;background:${PAPER}"></div>`).join('');
    return `<div class="bk__box" style="width:${n.w}px;height:${n.h}px;--D:${D}px;--bh:${bh}px;--by:${f[1]}px;--lc:${lc};--lcl:${lcL}">
      <div class="bk__shadow" style="top:${f[3]}px;width:${n.w * 1.25}px"></div>
      <div class="bk__f bk__back" style="top:${f[1]}px;height:${bh}px;transform:translateZ(${-D / 2}px)"></div>
      <div class="bk__f bk__spine" style="top:${f[1]}px;height:${bh}px;width:${D}px;left:${-D / 2 + 3}px"></div>
      <div class="bk__f bk__edge" style="top:${f[1]}px;height:${bh}px;width:${D}px;left:${f[2] - D / 2 - 2}px"></div>
      <div class="bk__f bk__top" style="top:${f[1] - D / 2}px;height:${D}px;left:${f[0] - 4}px;width:${f[2] - f[0]}px"></div>
      <div class="bk__f bk__block" style="top:${by}px;height:${bh - 10}px;left:${bx}px;width:${bw}px;transform:translateZ(${D / 2 - 5}px)"><p>${it.add ? '' : A.esc(b.title)}</p></div>
      ${leaves}
      <div class="bk__cv" style="transform:translateZ(${D / 2}px)"><div class="bk__front">${front}<div class="bk__lit"></div></div><div class="bk__lining" style="top:${f[1]}px;height:${bh}px;left:${f[0]}px;width:${f[2] - f[0]}px"></div></div>
    </div>`;
  }

  function init() {
    const ori = A.scene.ori(); if (built && lastOri === ori) return; built = true; lastOri = ori; G = geo();
    root.innerHTML = `<i class="lb__pool" id="lbPool"></i><div class="lb__stage" id="lbStage"></div><i class="lb__rays" id="lbRays"></i><canvas id="lbFx" aria-hidden="true"></canvas><div class="lb__tag" id="lbTag"></div><p class="lb__note" id="lbNote"></p>
      <button class="lb__ink" id="lbInk" aria-label="Записать цитату"><img src="img/ink.webp" alt=""><span>цитата</span></button>`;
    stage = A.$('#lbStage', root); tagEl = A.$('#lbTag', root); noteEl = A.$('#lbNote', root); fxc = A.$('#lbFx', root); fxg = fxc.getContext('2d'); fxc.width = innerWidth; fxc.height = innerHeight; poolEl = A.$('#lbPool', root); raysEl = A.$('#lbRays', root);
    A.$('#lbInk', root).addEventListener('pointerdown', e => e.stopPropagation());
    A.$('#lbInk', root).addEventListener('click', () => { if (busy || A.qslip.isOpen) return; const ib = A.$('#lbInk', root); ib.classList.remove('dip'); void ib.offsetWidth; ib.classList.add('dip'); A.snd.tap(); A.snd.quill && A.snd.quill(); A.vibrate(10); const it = items[Math.round(p)]; setTimeout(() => A.qslip.open({ bookId: it && it.b && it.b.id ? it.b.id : '' }), 260); });
    bind(); render();
  }

  function render() {
    if (!built) return; const keep = items[Math.round(p)] && items[Math.round(p)].b && items[Math.round(p)].b.id;
    const list = [...A.state.books].sort((a, b) => order[a.status] - order[b.status] || (b.added || 0) - (a.added || 0));
    stage.innerHTML = ''; items = list.map(b => ({ b, art: artOf(b) })); items.push({ add: true, b: { title: '', author: '' }, art: { k: 'ash', own: false } });
    items.forEach(it => {
      const el = A.h(`<div class="bk">${bookHTML(it)}</div>`); el.style.display = 'none'; it.on = false; stage.appendChild(el); it.el = el; it.box = A.$('.bk__box', el); it.cv = A.$('.bk__cv', el); it.lit = A.$('.bk__lit', el); it.lf = A.$$('.bk__lf', el); it.n = natOf(it.art.k);
      it.jit = ((A.hash((it.b.title || 'x') + (it.b.author || '')) % 9) - 4) * .35;                                         // each book is set down a little differently
      it.press = new Sp(0, 160, 18); it.lift = new Sp(0, 64, 8.5); it.open = new Sp(0, 50, 7.5); it.fan = new Sp(0, 38, 8); it.zoom = new Sp(0, 60, 14);
    });
    noteEl.textContent = ''; const at = keep ? items.findIndex(i => i.b && i.b.id === keep) : -1, start = at >= 0 ? at : Math.max(0, items.findIndex(i => i.b.status === 'reading'));
    p = pt = start; pv = 0; lastIdx = -1; layoutPool(); draw(); label(); wake();
  }
  function layoutPool() { const g = G; poolEl.style.cssText = `left:${g.cx - g.W0 * 1.35}px;top:${g.base - g.W0 * .2}px;width:${g.W0 * 2.7}px;height:${g.W0 * .6}px`; }

  /* ---------------------------------------------------------------- the arc: the book in the middle steps forward and floats a little, the others stand back, turned toward it */
  function place(it, d) {
    const g = G, ad = Math.abs(d), e = Math.min(ad, 1), far = Math.max(0, ad - 1), s0 = g.W0 / it.n.w, lift = Math.max(0, 1 - ad), side = sgn(d) || 0;
    let x = g.cx + side * g.W0 * (.86 * e + .46 * far), y = e * 7 + far * 9 + it.jit * e - lift * (1.6 + 1.6 * Math.sin(T * 1.5)), z = 80 * lift - 85 * e - 60 * far, ry = -side * e * 17 + it.jit * .5 * e, rx = 0, s = s0 * (1 - .1 * e - .035 * far), dim = A.clamp(.05 + .5 * e + .05 * far, 0, .8);
    const L = it.lift.x, O = it.open.x, Z = it.zoom.x, P = it.press.x;
    if (P) { y += P * 8; s *= 1 - P * .03; rx += P * 3; }
    if (L || O || Z) {
      const f = it.n.face, fw = f[2] - f[0], fh = f[3] - f[1];
      ry *= 1 - L; dim *= 1 - L; y -= L * g.W0 * .45; z += L * 150; rx += L * 6; s *= 1 + L * .2;
      x += O * fw * s * .5;                                                                      // the swung cover and the book are centred together
      if (Z) { const S = g.land ? Math.min(g.vh * .78 / fh, g.vw * .22 / fw) : Math.min(g.vh * .72 / fh, g.vw * .9 / fw); s = s + (S - s) * Z; x = x + (g.cx - x) * Z; ry *= 1 - Z; rx *= 1 - Z; z *= 1 - Z; }
    }
    it.s = s; it.x = x; it.y = y; it.z = z; it.ry = ry; it.rx = rx; it.dim = dim;
  }
  const setS = (el, k, v) => { const c = el._s || (el._s = {}); if (c[k] !== v) { c[k] = v; if (k === 'dim') el.style.setProperty('--dim', v); else el.style[k] = v; } };
  function paint(it) {
    const g = G, f = it.n.face, fw = f[2] - f[0], fh = f[3] - f[1], Z = it.zoom.x;
    // anchor: bottom-centre of the book body stands on the rug; zoom pulls it to the middle of the screen
    const by = g.base + it.y + (Z ? ((g.vh * .5 + fh * it.s * .5) - g.base - it.y) * Z : 0);
    setS(it.el, 'transform', `translate3d(${(it.x + parx * (1 + Math.max(0, it.z) / 500)).toFixed(1)}px,${(by + pary).toFixed(1)}px,${it.z.toFixed(1)}px) rotateY(${it.ry.toFixed(2)}deg) rotateX(${it.rx.toFixed(2)}deg) scale(${it.s.toFixed(4)})`);
    if (!it.placed) { it.placed = true; it.box.style.transform = `translate(${-(f[0] + fw / 2).toFixed(1)}px,${-f[3]}px)`; it.D = parseFloat(it.box.style.getPropertyValue('--D')); }
    setS(it.cv, 'transform', `translateZ(${it.D / 2}px) rotateY(${(-it.open.x * 168).toFixed(1)}deg)`);
    const fan = it.fan.x; it.lf.forEach((l, i) => { const k = ease((fan - i * .13) / .55), a = k * (158 + i * 3), on = fan > .004; setS(l, 'display', on ? '' : 'none'); if (on) setS(l, 'transform', `translateZ(${it.D / 2 - 4 + i * .8}px) rotateY(${(-a).toFixed(1)}deg)`); });
    setS(it.el, 'dim', it.dim.toFixed(2)); setS(it.el, 'zIndex', String(100 - Math.round(Math.abs(it.pos) * 10) + (it === sel ? 50 : 0)));
  }
  function draw() {
    items.forEach((it, i) => { const d = i - p; it.pos = d; const vis = Math.abs(d) < 4.6; if (!vis) { if (it.on) { it.el.style.display = 'none'; it.on = false; } return; } if (!it.on) { it.el.style.display = ''; it.on = true; } place(it, d); paint(it); });
    const c = items[A.clamp(Math.round(p), 0, items.length - 1)]; if (poolEl && c) poolEl.style.opacity = (.9 * (1 - c.lift.x * .8) * (1 - Math.min(1, Math.abs(c.pos)) * .5)).toFixed(2);
  }
  function label() {
    const i = A.clamp(Math.round(p), 0, items.length - 1), it = items[i]; if (!it) return;
    if (i !== lastIdx) { lastIdx = i; if (active) { A.snd.page && A.snd.page(); A.vibrate(6); } const b = it.b;
      const mk = b.pos > .002 && b.pages ? ` · стр. ${Math.max(1, Math.round(b.pos * b.pages))} из ${b.pages}` : '';
      tagEl.innerHTML = it.add ? '<b>Новая книга</b><small>поставь её на полку</small>' : `<b>${A.esc(b.title)}</b><small>${A.esc(b.author || '')}${b.status === 'reading' ? ' · читаю' : b.status === 'done' ? ' · прочитано' : ''}${mk}</small>`;
      tagEl.classList.remove('pop'); void tagEl.offsetWidth; tagEl.classList.add('pop'); }
  }

  /* ---------------------------------------------------------------- loop */
  function wake() { if (!raf && active) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  function loop(now) {
    raf = 0; if (!active) return; const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
    if (!drag) { pv += ((pt - p) * 170 - pv * 21) * dt; p += pv * dt; if (Math.abs(pt - p) <= .002 && Math.abs(pv) <= .01) { p = pt; pv = 0; } }
    items.forEach(it => { [it.press, it.lift, it.open, it.fan, it.zoom].forEach(s => { s.step(dt); if (!s.moving) s.x = s.t; }); }); rays.step(dt);
    if (A.bookview && A.bookview.isOpen()) { raf = requestAnimationFrame(loop); return; }                 // the open book owns the frame
    const par = A.scene.parallax(); parx = par.x * 2.4; pary = par.y * 2.0;
    fl = .9 + .06 * Math.sin(T * 6.3) + .04 * Math.sin(T * 11.3 + 1.3) + (A.snd.fireLevel ? A.snd.fireLevel() * .12 : 0);
    draw(); label(); drawFx(dt); paintRays();
    if ((kick = (kick + 1) % 2) === 0) items.forEach(it => { if (it.on && Math.abs(it.pos) < 1.6) it.lit.style.opacity = (fl * .55).toFixed(3); });
    raf = requestAnimationFrame(loop);        // keeps the firelight on the covers breathing; cheap: only the centre books are repainted by the browser
  }

  /* ---------------------------------------------------------------- effects: smoke, a bloom of gold light, a ring on the rug, sparks, and rays pouring out of the open book */
  const glow = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,236,180,1)'); gr.addColorStop(.25, 'rgba(255,190,90,.7)'); gr.addColorStop(1, 'rgba(255,140,40,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c; })();
  const smk = (() => { const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'); for (let i = 0; i < 12; i++) { const px = 48 + (Math.random() - .5) * 44, py = 48 + (Math.random() - .5) * 44, r = 10 + Math.random() * 16, gr = x.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, 'rgba(190,168,140,.4)'); gr.addColorStop(1, 'rgba(210,190,160,0)'); x.fillStyle = gr; x.fillRect(0, 0, 96, 96); } return c; })();
  function puff(x, y, n = 18, w = 90) { for (let i = 0; i < n; i++) puffs.push({ x: x + (Math.random() - .5) * w, y: y + (Math.random() - .5) * 10, vx: (Math.random() - .5) * 120, vy: -18 - Math.random() * 46, life: 0, ttl: 1.1 + Math.random() * 1.0, s: 14 + Math.random() * 18, rot: Math.random() * 6.28 }); }
  function burst(x, y, floorY, n = 46) {
    blooms.push({ x, y, t: 0, d: 1.15 }); rings.push({ x, y: floorY, t: 0, d: 1.3 });
    for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), v = rnd(120, 520); sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .8 - rnd(40, 240), life: 0, ttl: rnd(.9, 2), r: rnd(1.4, 3.2) }); }
  }
  function drawFx(dt) {
    const any = puffs.length || blooms.length || rings.length || sparks.length; if (!any) { if (fxc.dataset.on) { fxg.clearRect(0, 0, fxc.width, fxc.height); delete fxc.dataset.on; } return; }
    fxc.dataset.on = 1; fxg.clearRect(0, 0, fxc.width, fxc.height); const W0 = G.W0;
    fxg.globalCompositeOperation = 'lighter';
    for (let i = blooms.length - 1; i >= 0; i--) { const b = blooms[i]; b.t += dt; const k = b.t / b.d; if (k >= 1) { blooms.splice(i, 1); continue; } const R = W0 * (1.1 + 2.4 * ease(k)); fxg.globalAlpha = Math.pow(1 - k, 1.6) * .7; fxg.drawImage(glow, b.x - R, b.y - R, R * 2, R * 2); }
    for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; const k = r.t / r.d; if (k >= 1) { rings.splice(i, 1); continue; } const rx = W0 * (.4 + 2.8 * ease(k)); fxg.globalAlpha = Math.pow(1 - k, 1.4) * .7; fxg.strokeStyle = 'rgb(255,208,130)'; fxg.lineWidth = 2.4 * (1 - k) + .6; fxg.beginPath(); fxg.ellipse(r.x, r.y, rx, rx * .2, 0, 0, 6.283); fxg.stroke(); }
    for (let i = sparks.length - 1; i >= 0; i--) { const q = sparks[i]; q.life += dt; if (q.life > q.ttl) { sparks.splice(i, 1); continue; } const k = q.life / q.ttl; q.vy += 360 * dt; q.vx *= 1 - .9 * dt; q.x += q.vx * dt; q.y += q.vy * dt; const r = q.r * 5 * (1 - k * .6); fxg.globalAlpha = (1 - k) * (.6 + .4 * Math.sin(q.life * 30 + i)); fxg.drawImage(glow, q.x - r, q.y - r, r * 2, r * 2); }
    fxg.globalCompositeOperation = 'source-over';
    for (let i = puffs.length - 1; i >= 0; i--) { const q = puffs[i]; q.life += dt; if (q.life > q.ttl) { puffs.splice(i, 1); continue; } const k = q.life / q.ttl; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 1 - 1.4 * dt; q.vy *= 1 - .9 * dt; const r = q.s * (1 + k * 2.6); fxg.globalAlpha = Math.min(1, k * 10) * (1 - k) * (1 - k) * .5; fxg.save(); fxg.translate(q.x, q.y); fxg.rotate(q.rot + k * .6); fxg.drawImage(smk, -r, -r, r * 2, r * 2); fxg.restore(); }
    fxg.globalAlpha = 1;
  }
  function paintRays() {
    const c = sel; const o = c ? A.clamp(rays.x, 0, 1) * (1 - c.zoom.x * .6) : 0; if (!raysEl) return; if (o < .01) { if (raysEl._on) { raysEl.style.opacity = 0; raysEl._on = false; } return; }
    raysEl._on = true; const r = c.box.getBoundingClientRect(), S = Math.max(G.vw, G.vh) * 1.4; raysEl.style.cssText = `left:${r.left + r.width * .62 - S / 2}px;top:${r.top + r.height * .45 - S / 2}px;width:${S}px;height:${S}px;opacity:${(o * .8).toFixed(3)}`;
  }

  /* ---------------------------------------------------------------- hands */
  const rectOf = it => it.box.getBoundingClientRect();
  function hover() {
    if (!active || busy || drag) return; const it = items[Math.round(p)]; if (!it || Math.abs(it.pos) > .3) return; const r = rectOf(it), side = Math.round(p) % 2 ? 'R' : 'L';
    A.hands.hover([r.left + r.width * (side === 'L' ? .36 : .64), r.top + r.height * .74]);
  }
  const rehover = () => { clearTimeout(hoverT); hoverT = setTimeout(hover, 520); };

  /* ---------------------------------------------------------------- the choreography: press, take, leap, open, riffle, read */
  async function select(it) {
    if (busy) return; if (it.add) { A.snd.coin(); A.fx.sparks(innerWidth / 2, innerHeight * .8, 16); A.mods.books.editBook(); return; }
    busy = true; sel = it; clearTimeout(hoverT); A.vibrate(14); A.snd.page(); A.snd.unlock && A.snd.unlock(); A.snd.setFire(1);
    it.press.t = 1; A.hands.grasp(() => rectOf(it)); A.scene.push && A.scene.push(1.09); await wait(540);
    it.press.t = 0; it.lift.t = 1; const r0 = rectOf(it); burst(r0.left + r0.width / 2, r0.top + r0.height * .5, r0.bottom, 52); puff(r0.left + r0.width / 2, r0.bottom - 6, 28, r0.width * .9); A.snd.whoosh && A.snd.whoosh(1); A.snd.chime && A.snd.chime([392, 587.33], .06, .5); A.vibrate([10, 30, 16]); await wait(900);
    it.open.t = 1; rays.t = 1; setTimeout(() => { it.fan.t = 1; A.snd.page(); setTimeout(() => A.snd.page(), 130); setTimeout(() => A.snd.page(), 260); }, 200); setTimeout(() => A.snd.chime && A.snd.chime([523.25, 659.25, 783.99, 1046.5], .08, .7), 420); A.hands.retreat(); await wait(1250);
    it.zoom.t = 1; A.hands.show(false); await wait(540);
    A.bookview.open(it.b, { onClose: () => back(it) });
  }
  function back(it) {
    busy = true; A.hands.show(true); it.zoom.t = 0; it.open.t = 0; it.fan.t = 0; it.lift.t = 0; rays.t = 0; A.scene.push && A.scene.push(1); wake();
    setTimeout(() => { busy = false; sel = null; rehover(); }, 900);
  }

  /* ---------------------------------------------------------------- input */
  function bind() {
    stage.addEventListener('pointerdown', e => {
      if (busy) return; stage.setPointerCapture(e.pointerId); const el = e.target.closest('.bk'), i = el ? items.findIndex(it => it.el === el) : -1;
      drag = { x: e.clientX, y: e.clientY, p0: p, t: performance.now(), moved: false, lx: e.clientX, lt: performance.now(), v: 0, i, long: 0 }; pv = 0; clearTimeout(hoverT);
      if (i >= 0 && !items[i].add) drag.long = setTimeout(() => { if (drag && !drag.moved && Math.abs(i - p) < .6) { drag.moved = true; A.vibrate(20); A.mods.books.openBook(items[i].b.id); drag = null; } }, 700);
    });
    stage.addEventListener('pointermove', e => {
      if (!drag) return; if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 9) { drag.moved = true; clearTimeout(drag.long); A.hands.idle(); }
      if (drag.moved) { const now = performance.now(); drag.v = drag.v * .6 + ((e.clientX - drag.lx) / Math.max(1, now - drag.lt)) * .4; drag.lx = e.clientX; drag.lt = now; p = A.clamp(drag.p0 - (e.clientX - drag.x) / G.step, -.35, items.length - 1 + .35); pt = p; wake(); }
    });
    const end = () => {
      if (!drag) return; const d = drag; drag = null; clearTimeout(d.long);
      if (d.moved) { pt = A.clamp(Math.round(p - d.v * 9), 0, items.length - 1); pv = 0; wake(); rehover(); return; }
      if (d.i < 0) { return; }
      const it = items[d.i]; if (Math.abs(d.i - p) < .55) select(it); else { pt = d.i; wake(); rehover(); }
    };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', () => { if (drag) { clearTimeout(drag.long); drag = null; pt = Math.round(p); wake(); } });
    stage.addEventListener('wheel', e => { e.preventDefault(); if (busy) return; pt = A.clamp(Math.round(pt + sgn(e.deltaX || e.deltaY)), 0, items.length - 1); wake(); rehover(); }, { passive: false });
    addEventListener('keydown', e => { if (!active || busy || (A.bookview && A.bookview.isOpen()) || A.qslip.isOpen) return; if (e.key === 'ArrowRight') { pt = Math.min(items.length - 1, Math.round(pt) + 1); wake(); rehover(); } else if (e.key === 'ArrowLeft') { pt = Math.max(0, Math.round(pt) - 1); wake(); rehover(); } else if (e.key === 'Enter' || e.key === ' ') { const it = items[Math.round(p)]; it && select(it); } });
    addEventListener('resize', () => { if (!built) return; if (A.scene.ori() !== lastOri) return; G = geo(); fxc.width = innerWidth; fxc.height = innerHeight; layoutPool(); wake(); });
  }

  /* ---------------------------------------------------------------- the alchemy table, wherever the frame shows it */
  function doors() {
    hs.forEach(h => h.remove()); hs = []; const H = A.scene.layout().libHs || {}, NM = { lab: ['Алхимия', 'potion'] };
    Object.entries(H).forEach(([k, polys]) => NM[k] && polys.forEach(pl => {
      const xs = pl.map(q => q[0]), ys = pl.map(q => q[1]), a = A.scene.plateFinal(Math.min(...xs), Math.min(...ys)), b = A.scene.plateFinal(Math.max(...xs), Math.max(...ys)), cx = (a[0] + b[0]) / 2;
      if (cx < 24 || cx > innerWidth - 24 || b[1] < 0) return;
      const el = A.h(`<button class="lb__door" aria-label="${NM[k][0]}" style="left:${a[0]}px;top:${a[1]}px;width:${b[0] - a[0]}px;height:${b[1] - a[1]}px"><i></i><span>${NM[k][0]}</span></button>`);
      el.addEventListener('pointerdown', e => e.stopPropagation()); el.addEventListener('click', () => { if (busy) return; A.snd.chime && A.snd.chime([392, 523.25], .08, .6); A.vibrate(10); A.go(NM[k][1]); }); root.appendChild(el); hs.push(el);
    }));
  }

  return {
    init, render, rebuild() { built = false; lastIdx = -1; if (active) { init(); doors(); } },
    show() {
      init(); active = true; busy = false; sel = null; root.classList.add('on'); G = geo(); layoutPool(); A.hands.show(true); A.snd.setFire(1); doors(); render(); wake();
      root.classList.add('hints'); setTimeout(() => root.classList.remove('hints'), 5200); rehover();
      if (!A.state.libTip) { A.state.libTip = true; A.save(); setTimeout(() => { if (!active) return; noteEl.textContent = 'Листай книги пальцем. Коснись книги, и она раскроется.'; noteEl.classList.add('on'); setTimeout(() => noteEl.classList.remove('on'), 5500); }, 1800); }
    },
    hide() { active = false; busy = false; root.classList.remove('on'); A.hands.show(false); A.snd.setFire(A.fire && A.fire.on ? 1 : 0); clearTimeout(hoverT); puffs.length = blooms.length = rings.length = sparks.length = 0; hs.forEach(h => h.remove()); hs = []; A.scene.push && A.scene.push(1); A.qslip && A.qslip.close(); if (raf) { cancelAnimationFrame(raf); raf = 0; } },
    get active() { return active; }
  };
})();
