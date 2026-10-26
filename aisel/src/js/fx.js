/* ============================================================ fx: one overlay canvas for fireflies, sparks, falling acorns, petals, stars */
A.fx = (() => {
  const cv = A.$('#fx'), ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, ps = [], raf = 0, last = 0;
  const glow = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return c; })();
  function size() { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  addEventListener('resize', size); size();

  function acornPath(g, s) { g.beginPath(); g.moveTo(0, -s * .95); g.lineTo(0, -s * .75); g.fill(); g.beginPath(); g.ellipse(0, -s * .15, s * .55, s * .5, 0, Math.PI, 0); g.closePath(); g.fill(); g.beginPath(); g.moveTo(-s * .5, -s * .1); g.quadraticCurveTo(-s * .5, s * .75, 0, s * .95); g.quadraticCurveTo(s * .5, s * .75, s * .5, -s * .1); g.closePath(); g.fill(); }
  function leaf(g, s) { g.beginPath(); g.moveTo(0, -s); g.quadraticCurveTo(s * .8, -s * .2, 0, s); g.quadraticCurveTo(-s * .8, -s * .2, 0, -s); g.fill(); }
  function star(g, s) { g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * .45 : s, a = i * Math.PI / 5 - Math.PI / 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); }

  function add(p) { ps.push(p); if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function tick(t) {
    const dt = Math.min(.05, (t - last) / 1000); last = t; ctx.clearRect(0, 0, W, H);
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]; p.life += dt; if (p.life > p.ttl) { ps.splice(i, 1); continue; }
      const k = p.life / p.ttl;
      p.vy += (p.g || 0) * dt; p.vx *= (1 - (p.drag || 0) * dt); p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.vr || 0) * dt;
      if (p.sway) p.x += Math.sin(p.life * p.sway + p.ph) * 22 * dt;
      const a = (k < .12 ? k / .12 : k > .6 ? 1 - (k - .6) / .4 : 1) * (p.alpha == null ? 1 : p.alpha);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.max(0, a);
      if (p.kind === 'glow') { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = p.color; const s = p.size * (1 - k * (p.shrink || .5)); ctx.drawImage(tint(p.color), -s, -s, s * 2, s * 2); }
      else if (p.kind === 'acorn') { ctx.fillStyle = p.color; acornPath(ctx, p.size); }
      else if (p.kind === 'leaf') { ctx.fillStyle = p.color; leaf(ctx, p.size); }
      else if (p.kind === 'star') { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = p.color; star(ctx, p.size * (1 - k * .4)); }
      else if (p.kind === 'text') { ctx.fillStyle = p.color; ctx.font = p.font; ctx.textAlign = 'center'; ctx.fillText(p.text, 0, 0); }
      ctx.restore();
    }
    if (ps.length) raf = requestAnimationFrame(tick); else { raf = 0; ctx.clearRect(0, 0, W, H); }
  }
  const tints = {};
  function tint(color) { if (tints[color]) return tints[color]; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.drawImage(glow, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, 64, 64); return tints[color] = c; }
  const R = (a, b) => a + Math.random() * (b - a);
  const GOLD = ['#ffd98a', '#ffc766', '#fff1c4', '#ffb86b'];

  return {
    fireflies(x, y, n = 18, spread = 120) { if (A.reduceMotion) n = Math.min(n, 4); for (let i = 0; i < n; i++) { const a = R(0, 6.28), v = R(20, spread); add({ kind: 'glow', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, g: -10, drag: 1.4, rot: 0, ttl: R(1.2, 2.6), life: 0, size: R(5, 13), color: GOLD[i % 4], sway: R(2, 5), ph: R(0, 6) }); } },
    sparks(x, y, n = 30, color = '#ffd98a') { for (let i = 0; i < n; i++) { const a = R(-3.4, .25), v = R(80, 320); add({ kind: 'glow', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 420, drag: .8, rot: 0, ttl: R(.6, 1.4), life: 0, size: R(3, 8), color, shrink: .8 }); } },
    acornRain(n = 26) { for (let i = 0; i < n; i++) add({ kind: 'acorn', x: R(10, W - 10), y: R(-200, -20), vx: R(-20, 20), vy: R(60, 160), g: 520, rot: R(-1, 1), vr: R(-3, 3), ttl: R(1.8, 2.8), life: 0, size: R(7, 12), color: ['#c58b4a', '#b0743a', '#d9a05b'][i % 3], alpha: .95 }); },
    petals(x, y, n = 24, colors = ['#ffadc2', '#ffd1dc', '#fff0f4']) { for (let i = 0; i < n; i++) { const a = R(-2.9, -.25), v = R(80, 300); add({ kind: 'leaf', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 160, drag: 1.1, rot: R(0, 6), vr: R(-4, 4), ttl: R(1.8, 3.2), life: 0, size: R(5, 10), color: colors[i % colors.length], sway: R(2, 4), ph: R(0, 6) }); } },
    leaves(n = 18) { for (let i = 0; i < n; i++) add({ kind: 'leaf', x: R(-40, W), y: R(-80, -10), vx: R(40, 120), vy: R(50, 130), g: 40, rot: R(0, 6), vr: R(-2, 2), ttl: R(3, 5), life: 0, size: R(6, 11), color: ['#8fb85a', '#d9a441', '#c4762f', '#6e9b5a'][i % 4], sway: R(1.5, 3), ph: R(0, 6) }); },
    stars(x, y, n = 20) { for (let i = 0; i < n; i++) { const a = R(0, 6.28), v = R(40, 220); add({ kind: 'star', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 1.5, rot: R(0, 6), vr: R(-3, 3), ttl: R(.9, 1.8), life: 0, size: R(4, 9), color: '#fff3c8' }); } },
    float(x, y, text, color = '#ffe3a1') { add({ kind: 'text', x, y, vx: 0, vy: -48, rot: 0, ttl: 1.5, life: 0, text, color, font: '500 18px "Inter Tight", system-ui' }); },
    glowSprite: glow
  };
})();
