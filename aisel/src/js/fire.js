/* ============================================================ the living fire on the open book (also the knob and the matchbox switch it)
   flame tongues + coals + smoke on a canvas in room space, warm light that dances over the table, sparks into the parallax layer */
A.fire = (() => {
  const cv = A.$('#fireCv'), ctx = cv.getContext('2d'), glow = A.$('#glow'), dim = A.$('#dim'), CW = 420, CH = 480, BX = 210, BY = 410;
  let ps = [], smoke = [], level = 0, target = 0, T = 0, fl = 1, flT = 1, sparkAcc = 0, knob = null;
  const R = (a, b) => a + Math.random() * (b - a);
  const spr = (rgb) => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.3, `rgba(${rgb},.55)`); gr.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c; };
  const S = { hot: spr('255,244,200'), mid: spr('255,170,50'), red: spr('235,70,20'), smoke: spr('150,150,150') };
  const COALS = [[-44, 6, 9], [-22, 14, 11], [4, 10, 12], [30, 14, 10], [50, 4, 8], [-6, 2, 8], [16, 2, 9]];

  function place() { const f = A.scene.fireBase(); cv.style.cssText = `left:${f.x - BX}px;top:${f.y - BY}px;width:${CW}px;height:${CH}px`; glow.style.cssText = `left:${f.x - 1300}px;top:${f.y - 1050}px;width:2600px;height:2100px`; }

  function frame(dt, t) {
    T = t; level += (target - level) * Math.min(1, dt * (target > level ? 2.6 : 1.3)); if (Math.abs(target - level) < .002) level = target;
    flT += (Math.random() - .5) * 1.6 * dt * 12; flT = A.clamp(flT, .6, 1.2); fl += (flT - fl) * Math.min(1, dt * 14);
    const L = level, flick = (.82 + .18 * Math.sin(T * 11.3) * Math.sin(T * 6.1)) * fl;
    glow.style.opacity = (L * .9 * flick).toFixed(3); dim.style.opacity = ((1 - L) * .62).toFixed(3);
    if (knob) knob.style.opacity = (.35 + L * .65).toFixed(3);
    ctx.clearRect(0, 0, CW, CH);
    ctx.globalCompositeOperation = 'lighter';
    // coals: they keep a faint glow after the flames die
    const ember = Math.max(L, target ? 0 : Math.max(0, L * .0) + .0) , cg = .16 + L * .84;
    COALS.forEach(([x, y, r], i) => { const p = .6 + .4 * Math.sin(T * (2 + i) + i * 2); ctx.globalAlpha = Math.min(1, cg * p * (.5 + .5 * flick)) * (L > .02 || target ? 1 : .5); const rr = r * 3.2; ctx.drawImage(S.mid, BX + x - rr, BY + y - rr, rr * 2, rr * 2); });
    // tongues: narrow, tall, orange-dominant blobs; only the root is white-hot
    if (L > .02) {
      const n = (50 + 120 * L) * L * dt; for (let i = 0; i < n; i++) ps.push({ x: BX + R(-17, 17) * (.5 + .5 * L), y: BY + R(-2, 8), vx: R(-8, 8), vy: -R(170, 310) * (.55 + .45 * L), life: 0, ttl: R(.6, 1.2), s: R(24, 42) * (.55 + .45 * L), ph: R(0, 6.3) });
      if (Math.random() < dt * 3.2 * L) ps.push({ x: BX + R(-10, 10), y: BY - 14, vx: R(-14, 14), vy: -R(330, 460), life: 0, ttl: R(.6, .95), s: R(15, 24), ph: 0 });   // a licking tongue
    }
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]; p.life += dt; if (p.life > p.ttl) { ps.splice(i, 1); continue; } const k = p.life / p.ttl;
      p.x += (p.vx + Math.sin(T * 8 + p.ph) * 30 * k - (p.x - BX) * 2.2) * dt; p.y += p.vy * dt; p.vy *= 1 - .3 * dt;
      const sz = p.s * (1 - k * .72), sp = k < .14 ? S.hot : k < .6 ? S.mid : S.red, w = sz * 1.15, h = sz * 2.5;
      ctx.globalAlpha = Math.min(1, (1 - k) * 1.2) * .5 * Math.min(1, L * 1.4); ctx.drawImage(sp, p.x - w, p.y - h * .62, w * 2, h);
    }
    // base glow
    const bg = 90 * (.3 + L * .7); ctx.globalAlpha = L * .4 * flick; ctx.drawImage(S.mid, BX - bg * 1.4, BY - bg * .8, bg * 2.8, bg * 1.4);
    // smoke while the flame is dying
    ctx.globalCompositeOperation = 'source-over';
    if (target === 0 && L > .015 && Math.random() < dt * 30 * L) smoke.push({ x: BX + R(-24, 24), y: BY - R(10, 50), vy: -R(30, 60), vx: R(-8, 8), life: 0, ttl: R(2, 3.6), s: R(24, 40) });
    for (let i = smoke.length - 1; i >= 0; i--) { const p = smoke[i]; p.life += dt; if (p.life > p.ttl) { smoke.splice(i, 1); continue; } const k = p.life / p.ttl; p.x += (p.vx + Math.sin(T * 1.6 + i) * 10) * dt; p.y += p.vy * dt; const r = p.s * (1 + k * 2.2); ctx.globalAlpha = .22 * (1 - k) * Math.min(1, k * 6); ctx.drawImage(S.smoke, p.x - r, p.y - r, r * 2, r * 2); }
    ctx.globalAlpha = 1;
    // sparks fly into the parallax layer
    sparkAcc += dt * 20 * L * L; while (sparkAcc > 1) { sparkAcc--; const f = A.scene.fireBase(); A.scene.spark(f.x + R(-30, 30), f.y - R(40, 160)); }
  }

  function set(on, quiet) {
    target = on ? 1 : 0; A.state.fireOn = on; A.save && A.save(); document.body.classList.toggle('warm', on);
    if (!quiet) { A.snd.unlock && A.snd.unlock(); on ? (A.snd.fireLit(), setTimeout(() => A.snd.setFire(1), 380)) : (A.snd.fireOut && A.snd.fireOut(), A.snd.setFire(0)); A.vibrate(on ? [14, 30, 20] : 12); if (on) { const f = A.scene.fireBase(); for (let i = 0; i < 16; i++) A.scene.spark(f.x + R(-30, 30), f.y - R(20, 80)); } }
    else A.snd.setFire(on ? 1 : 0);
  }
  return {
    init() { place(); const hs = A.$('#hsFx'); knob = A.h('<i class="knoblight"></i>'); const k = A.scene.hs('knob'); knob.style.cssText = `left:${k.c[0]}px;top:${k.c[1]}px`; hs.appendChild(knob); knob.style.opacity = 0; },
    frame, set, toggle() { set(!(target > 0)); }, get on() { return target > 0; }, get level() { return level; }
  };
})();
