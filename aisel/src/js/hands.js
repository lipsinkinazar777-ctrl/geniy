/* ============================================================ the hands: two real hand photos (true alpha) driven like a puppet.
   idle   : they rest at the bottom corners and breathe
   hover  : the nearer hand swings toward a book (arm pivots at the sleeve, stretches a little)
   grasp  : both hands meet the sides of a book (crossfade to the curled poses) and follow it while it lifts
   pinch  : a hand takes the corner of a page and follows it while it turns
   Everything is spring-driven (transform/opacity only). */
A.hands = (() => {
  const root = A.$('#hands'), ART = A.HANDART;
  const POSE = { L: { reach: 'hand-l', grasp: 'pose-2', page: 'pose-1' }, R: { reach: 'hand-r', grasp: 'pose-3', page: 'pose-4' } };
  class Sp { constructor(x, k = 110, c = 17) { this.x = x; this.t = x; this.v = 0; this.k = k; this.c = c; }
    step(dt) { const n = Math.ceil(dt / .008), h = dt / n; for (let i = 0; i < n; i++) { this.v += (this.k * (this.t - this.x) - this.c * this.v) * h; this.x += this.v * h; } } }
  const sides = {}, L = { k: 1, vw: 0, vh: 0 };
  let carryFn = null, carrySide = 'R', propEl = null, pcx = null, pcy = null, hoverPt = null, on = false, raf = 0, last = 0, T = 0, mode = 'idle', follow = null, pinchFn = null, hoverSide = null, parX = 0, parXT = 0, gk = 2;

  function layer(side, kind) {
    const a = ART[POSE[side][kind]], im = new Image(); im.src = `img/${POSE[side][kind]}.webp`; im.className = 'hd__img'; im.draggable = false; im.decoding = 'async';
    let top = im, ext = null;
    if (kind !== 'reach') { top = A.h('<div class="hd__wrap"></div>'); ext = A.h('<div class="hd__ext"></div>'); ext.style.backgroundImage = `url(img/${POSE[side][kind]}.webp)`; top.append(im, ext); im.style.position = 'relative'; }
    const pg = kind === 'page', s = { img: top, im, ext, art: a, x: new Sp(0, pg ? 230 : 120, pg ? 27 : 18), y: new Sp(0, pg ? 230 : 120, pg ? 27 : 18), r: new Sp(0, 90, 15), s: new Sp(1, 110, 17), o: new Sp(kind === 'reach' ? 1 : 0, 150, 22) };
    return s;
  }
  ['L', 'R'].forEach(side => {
    const el = A.h(`<div class="hd hd--${side}"></div>`), o = { el, reach: layer(side, 'reach'), grasp: layer(side, 'grasp'), page: layer(side, 'page'), ph: side === 'L' ? 0 : 2.1, lift: new Sp(0, 80, 14), ap: new Sp(0, 70, 10.5), sw: new Sp(0, 60, 9) };
    ['reach', 'grasp', 'page'].forEach(k => el.appendChild(o[k].img)); root.appendChild(el); sides[side] = o;
  });

  /* ---- layout: sprite size follows the viewport; idle pose bleeds off the bottom corner */
  function layout() {
    L.vw = innerWidth; L.vh = innerHeight; const land = L.vw > L.vh, hs = A.clamp(L.vh * (land ? .6 : .38), 170, 460); L.k = hs / ART['hand-l'].h; gk = land ? 1.85 : 1.95;
    ['L', 'R'].forEach(side => {
      const o = sides[side], a = ART[POSE[side].reach], w = a.w * L.k, h = a.h * L.k;
      o.base = side === 'L' ? { left: -w * .1, top: L.vh - h * .78 } : { left: L.vw - w * .88, top: L.vh - h * .74 };
      const st = o.reach.img.style; st.width = w + 'px'; st.height = h + 'px'; st.left = o.base.left + 'px'; st.top = o.base.top + 'px'; st.transformOrigin = `${a.piv[0] * L.k}px ${a.piv[1] * L.k}px`;
      ['grasp', 'page'].forEach(kd => { const b = ART[POSE[side][kd]], sc = L.k * gk, l = o[kd], s2 = l.im.style; s2.width = b.w * sc + 'px'; s2.height = b.h * sc + 'px'; l.img.style.width = b.w * sc + 'px'; l.img.style.height = b.h * sc + 'px'; l.ext.style.width = b.w * sc + 'px'; l.ext.style.height = L.vh + 'px'; l.ext.style.backgroundSize = `${b.w * sc}px ${b.h * sc * 40}px`; });
    });
  }
  /* pivot / tip of the reach sprite on screen at rest */
  const geo = side => { const o = sides[side], a = ART[POSE[side].reach], k = L.k; return { P: [o.base.left + a.piv[0] * k, o.base.top + a.piv[1] * k], Tp: [o.base.left + a.tip[0] * k, o.base.top + a.tip[1] * k] }; };
  function reachTo(side, target, loose = 1) {            // set the reach layer so its fingertip lands on `target`
    const o = sides[side].reach, g = geo(side), v0 = [g.Tp[0] - g.P[0], g.Tp[1] - g.P[1]], v1 = [target[0] - g.P[0], target[1] - g.P[1]];
    let s = Math.hypot(...v1) / Math.hypot(...v0); s = A.clamp(s, .92, 1.4); const r = Math.atan2(v1[1], v1[0]) - Math.atan2(v0[1], v0[0]), c = Math.cos(r), sn = Math.sin(r);
    const rx = g.P[0] + s * (c * v0[0] - sn * v0[1]), ry = g.P[1] + s * (sn * v0[0] + c * v0[1]);
    o.x.t = (target[0] - rx) * loose; o.y.t = (target[1] - ry) * loose; o.r.t = r * 180 / Math.PI * loose; o.s.t = 1 + (s - 1) * loose;
  }
  function placeLayer(side, kind, anchorScreen, anchorSprite, scale = 1) {   // grasp/page layers: put the sprite's anchor point at a screen point
    const o = sides[side][kind], a = o.art, sc = L.k * gk * scale; o.x.t = anchorScreen[0] - anchorSprite[0] * sc; o.y.t = anchorScreen[1] - anchorSprite[1] * sc; o.s.t = scale;
  }
  const setO = (side, kind, v) => { sides[side][kind].o.t = v; };
  function toIdle(side) { const o = sides[side]; o.reach.x.t = o.reach.y.t = o.reach.r.t = 0; o.reach.s.t = 1; setO(side, 'reach', 1); setO(side, 'grasp', 0); setO(side, 'page', 0); }

  function frame(now) {
    raf = requestAnimationFrame(frame); const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt; parX += (parXT - parX) * Math.min(1, dt * 3);
    if (mode === 'grasp' && follow) { const r = follow(); if (r) {
        const ey = r.top + r.height * .62, lx = r.left + r.width * .06, rx = r.left + r.width * .94, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        if (pcx != null && dt > 0) { const vx = (cx - pcx) / dt, vy = (cy - pcy) / dt; ['L', 'R'].forEach(sd => { sides[sd].sw.t = A.clamp(vx * .0035, -4.5, 4.5); sides[sd].lift.t = A.clamp(-vy * .006, -9, 9) * .0 + sides[sd].lift.t; }); } pcx = cx; pcy = cy;
        reachTo('L', [lx, ey]); reachTo('R', [rx, ey]);
        placeLayer('L', 'grasp', [lx, ey], ART['pose-2'].edge); placeLayer('R', 'grasp', [rx, ey], ART['pose-3'].edge);
      } }
    if (mode === 'carry' && carryFn) { const c = carryFn(); if (c) { const l = sides[carrySide].grasp, a = ART[POSE[carrySide].grasp], sc0 = L.k * gk;
        l.x.x = l.x.t = c.x - a.edge[0] * sc0; l.y.x = l.y.t = c.y - a.edge[1] * sc0; l.r.x = l.r.t = c.r || 0; l.s.x = l.s.t = c.s || 1; l.x.v = l.y.v = l.r.v = l.s.v = 0;     // the hand is welded to what it carries
        if (propEl && c.prop) propEl.style.transform = `translate3d(${c.prop.x.toFixed(1)}px,${c.prop.y.toFixed(1)}px,0) rotate(${(c.prop.r || 0).toFixed(2)}deg) scale(${(c.prop.s || 1).toFixed(3)})`; if (propEl && c.clip != null) propEl.style.clipPath = c.clip; } }
    if (mode === 'pinch' && pinchFn) { const p = pinchFn(); if (p) { const side = p.side; placeLayer(side, 'page', [p.x, p.y], ART[POSE[side].page].tip); reachTo(side, [p.x, p.y], .85); } }
    ['L', 'R'].forEach(side => {
      const o = sides[side], breath = mode === 'idle' || (mode === 'hover' && hoverSide !== side);
      ['reach', 'grasp', 'page'].forEach(kd => {
        const l = o[kd]; ['x', 'y', 'r', 's', 'o'].forEach(n => l[n].step(dt));
        let bx = 0, by = 0, br = 0;
        if (kd === 'reach' && breath) { by = Math.sin(T * 1.05 + o.ph) * 2.6 * L.k * 4; br = Math.sin(T * .72 + o.ph + 1) * .45; bx = Math.sin(T * .6 + o.ph) * 1.2 * L.k * 4; }
        o.lift.step(dt); o.ap.step(dt); o.sw.step(dt);
        const st = l.img.style; st.opacity = A.clamp(l.o.x, 0, 1).toFixed(3);
        const gr = kd === 'grasp' ? 1 : 0, apx = gr * o.ap.x * (side === 'L' ? -1 : 1), apy = gr * Math.abs(o.ap.x) * .35, rsw = gr * o.sw.x * (side === 'L' ? 1 : -1);
        st.transform = `translate3d(${(l.x.x + bx + apx + parX * (side === 'L' ? 1 : -1)).toFixed(2)}px,${(l.y.x + by + apy + o.lift.x).toFixed(2)}px,0) rotate(${(l.r.x + br + rsw).toFixed(3)}deg) scale(${l.s.x.toFixed(4)})`;
        st.display = l.o.x < .01 && l.o.t < .01 ? 'none' : '';
      });
    });
  }
  const loop = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  const api = {
    layout,
    show(v = true, quiet = false) {
      if (v === on) { if (v && !quiet) { toIdle('L'); toIdle('R'); } return; } on = v; layout(); root.classList.toggle('on', v);
      if (v) { ['L', 'R'].forEach(s => { const o = sides[s]; ['reach', 'grasp', 'page'].forEach(k => { o[k].o.x = o[k].o.t = 0; }); if (quiet) { o.lift.x = o.lift.t = o.reach.img.height * .8; return; } toIdle(s); o.lift.x = o.reach.img.height * .55; o.lift.t = 0; o.reach.o.x = 0; o.reach.o.t = 1; }); mode = quiet ? 'away' : 'idle'; loop(); }
      else { ['L', 'R'].forEach(s => { sides[s].lift.t = sides[s].reach.img.height * .6; ['reach', 'grasp', 'page'].forEach(k => sides[s][k].o.t = 0); }); setTimeout(() => { if (!on && raf) { cancelAnimationFrame(raf); raf = 0; } root.classList.remove('on'); }, 1200); }
    },
    idle() { mode = 'idle'; follow = pinchFn = null; hoverSide = null; hoverPt = null; ['L', 'R'].forEach(toIdle); },
    hover(pt) {                                                        // pt = screen point near a book, or null to relax
      if (mode !== 'idle' && mode !== 'hover') return; if (!pt) { api.idle(); return; }
      mode = 'hover'; hoverSide = pt[0] < L.vw * .5 ? 'L' : 'R'; const other = hoverSide === 'L' ? 'R' : 'L'; if (!hoverPt || Math.hypot(pt[0] - hoverPt[0], pt[1] - hoverPt[1]) > 40) { sides[hoverSide].lift.x -= 22; sides[hoverSide].lift.v -= 60; } hoverPt = pt; reachTo(hoverSide, pt, .92); toIdle(other); setO(hoverSide, 'reach', 1);
    },
    grasp(fn) { follow = fn; mode = 'grasp'; pinchFn = null; pcx = pcy = null; ['L', 'R'].forEach(sd => { sides[sd].ap.x = 120; sides[sd].ap.t = 0; sides[sd].sw.x = sides[sd].sw.t = 0; }); ['L', 'R'].forEach(s => { setO(s, 'reach', 0); setO(s, 'grasp', 1); setO(s, 'page', 0); }); return new Promise(r => setTimeout(r, 650)); },
    release(keepOut) { follow = null; mode = 'idle'; ['L', 'R'].forEach(s => { setO(s, 'grasp', 0); setO(s, 'reach', 1); toIdle(s); if (keepOut) sides[s].lift.t = sides[s].reach.img.height * .7; }); },
    retreat() { follow = pinchFn = null; mode = 'away'; ['L', 'R'].forEach(s => { sides[s].lift.t = sides[s].reach.img.height * .75; setO(s, 'grasp', 0); setO(s, 'page', 0); setO(s, 'reach', 1); sides[s].reach.x.t = 0; sides[s].reach.y.t = 0; sides[s].reach.r.t = 0; }); },
    back() { ['L', 'R'].forEach(s => { sides[s].lift.t = 0; }); mode = 'idle'; },
    pinch(fn) {
      pinchFn = fn; mode = 'pinch'; follow = null; const p = fn(); if (!p) return; const o = sides[p.side], l = o.page, other = p.side === 'L' ? 'R' : 'L';
      ['L', 'R'].forEach(sd => { setO(sd, 'reach', 0); setO(sd, 'grasp', 0); if (sd !== p.side) setO(sd, 'page', 0); }); o.lift.x = o.lift.t = 0; setO(p.side, 'page', 1);
      if (l.o.x < .05) { placeLayer(p.side, 'page', [p.x, p.y], ART[POSE[p.side].page].tip); l.x.x = l.x.t + (p.side === 'R' ? 40 : -40); l.y.x = l.y.t + 150; l.x.v = l.y.v = 0; }
    },
    unpinch() { const p = pinchFn; pinchFn = null; mode = 'away'; ['L', 'R'].forEach(s => { const l = sides[s].page; setO(s, 'page', 0); l.y.t += 240; l.x.t += s === 'R' ? 50 : -50; }); },
    carry(side, fn, prop) {
      carryFn = fn; carrySide = side; propEl = prop || null; mode = 'carry'; follow = pinchFn = null; ['L', 'R'].forEach(sd => { setO(sd, 'reach', 0); setO(sd, 'page', 0); setO(sd, 'grasp', sd === side ? 1 : 0); });
      const l = sides[side].grasp, a = ART[POSE[side].grasp], sc0 = L.k * gk; l.img.style.transformOrigin = `${a.edge[0] * sc0}px ${a.edge[1] * sc0}px`; sides[side].lift.x = sides[side].lift.t = 0;
      if (propEl) { propEl.style.cssText += ';position:absolute;left:0;top:0;'; sides[side].el.insertBefore(propEl, sides[side].el.firstChild); } loop();
    },
    uncarry() { const side = carrySide; carryFn = null; const l = sides[side].grasp; l.img.style.transformOrigin = '0 0'; setO(side, 'grasp', 0); if (propEl) { propEl.remove(); propEl = null; } mode = 'away'; },
    parallax(x) { parXT = x; },
    get active() { return on; }, get mode() { return mode; }
  };
  addEventListener('resize', () => { if (on) layout(); });
  return api;
})();
