/* ============================================================ campfire in the corner: tap it, the whole forest turns warmer and the crackle gets louder */
A.fire = (() => {
  const btn = A.$('#fire'), cv = A.$('#fireCv'), ctx = cv.getContext('2d'), tip = A.$('#fireTip');
  let ps = [], level = .3, target = .3, warm = false, run = false, last = 0, t = 0;
  const R = (a, b) => a + Math.random() * (b - a);
  function log(x, y, ang) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); const g = ctx.createLinearGradient(0, -9, 0, 9); g.addColorStop(0, '#2b1c12'); g.addColorStop(.5, '#120a06'); g.addColorStop(1, '#050302'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-52, -9, 104, 18, 9) : ctx.rect(-52, -9, 104, 18); ctx.fill(); ctx.fillStyle = '#4a2a14'; ctx.beginPath(); ctx.ellipse(52, 0, 5, 8.5, 0, 0, 6.3); ctx.fill(); ctx.restore(); }
  function stones() { [[58,190,12,8],[76,194,9,6],[146,192,13,8],[162,190,9,7],[96,198,10,6],[128,197,11,6]].forEach(([x,y,rx,ry]) => { const g = ctx.createLinearGradient(x, y-ry, x, y+ry); g.addColorStop(0, '#3a3d3c'); g.addColorStop(1, '#0c0e0d'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.3); ctx.fill(); }); }
  function frame(now) {
    if (!run) return; requestAnimationFrame(frame); const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; level += (target - level) * Math.min(1, dt * 3);
    ctx.clearRect(0, 0, 220, 220);
    const gl = ctx.createRadialGradient(110, 168, 0, 110, 168, 70 + level * 36); gl.addColorStop(0, `rgba(255,140,50,${.22 + level * .3})`); gl.addColorStop(1, 'rgba(255,150,50,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, 220, 220);
    stones(); log(110, 186, -.28); log(110, 186, .28);
    // coals
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const cg = ctx.createRadialGradient(110, 182, 0, 110, 182, 36); cg.addColorStop(0, `rgba(255,120,30,${.7 + .2 * Math.sin(t * 8)})`); cg.addColorStop(1, 'rgba(255,60,0,0)'); ctx.fillStyle = cg; ctx.fillRect(60, 150, 100, 60);
    const n = (1 + level * 2.2) * 70 * dt; for (let i = 0; i < n; i++) ps.push({ x: 110 + R(-22, 22), y: 180 + R(-4, 6), vx: R(-8, 8), vy: -R(50, 95) * (.7 + level * .8), life: 0, ttl: R(.55, 1.1), s: R(11, 22) * (.7 + level * .5) });
    if (Math.random() < dt * (2 + level * 6)) ps.push({ x: 110 + R(-14, 14), y: 160, vx: R(-26, 26), vy: -R(80, 160), life: 0, ttl: R(.8, 1.6), s: 2, spark: true });
    for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.life += dt; if (p.life > p.ttl) { ps.splice(i, 1); continue; } const k = p.life / p.ttl; p.x += p.vx * dt + Math.sin(t * 9 + i) * .4; p.y += p.vy * dt; p.vx *= .99;
      if (p.spark) { ctx.fillStyle = `rgba(255,${190 - k * 90 | 0},90,${1 - k})`; ctx.beginPath(); ctx.arc(p.x, p.y, 1.8 * (1 - k * .5), 0, 6.3); ctx.fill(); continue; }
      const s = p.s * (1 - k * .75), g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s); const c = k < .25 ? '255,208,120' : k < .55 ? '255,170,50' : '230,70,20'; g.addColorStop(0, `rgba(${c},${.75 * (1 - k)})`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, 6.3); ctx.fill(); }
    ctx.restore();
  }
  function setWarm(v) { warm = v; target = v ? 1 : .3; document.body.classList.toggle('warm', v); A.scene.setWarm(v ? 1 : 0); A.snd.setFire(v ? 1 : .1); A.state.warm = v; }
  btn.addEventListener('click', () => {
    A.snd.fireLit(); A.vibrate(20); setWarm(!warm); A.state.fireTip = true; tip.classList.remove('on');
    const r = btn.getBoundingClientRect(); A.fx.sparks(r.left + r.width / 2, r.top + r.height * .7, 28, '#ffb45a');
    A.toast(warm ? 'Костёр разгорелся. Стало теплее' : 'Костёр тихо тлеет');
  });
  return {
    init() { cv.width = 220 * 2; cv.height = 220 * 2; ctx.setTransform(2, 0, 0, 2, 0, 0); if (!run) { run = true; last = performance.now(); requestAnimationFrame(frame); } },
    tip() { if (!A.state.fireTip) { tip.classList.add('on'); setTimeout(() => tip.classList.remove('on'), 5200); } },
    get warm() { return warm; }
  };
})();
