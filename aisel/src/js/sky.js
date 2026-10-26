/* ============================================================ "Небо": every finished book is a star, books of one mood join into constellations. Drag to turn the sky. */
(() => {
  let el, cv, ctx, W = 0, H = 0, dpr = 1, raf = 0, last = 0, t = 0, theta = 0, vel = 0, drag = null, stars = [], bg = [], shoot = null, newId = null, focus = null, panel;
  const NAMES = { classic: 'Любимой Классики', fantasy: 'Волшебного Леса', romance: 'Тёплых Сердец', detective: 'Туманных Тайн', cozy: 'Уютного Пледа', adventure: 'Дальних Дорог', deep: 'Глубоких Мыслей', melancholy: 'Тихой Грусти', funny: 'Весёлого Смеха', tale: 'Сказок', mist: 'Тумана', misc: 'Первых Страниц' };
  const HUES = { classic: 38, fantasy: 280, romance: 335, detective: 200, cozy: 25, adventure: 150, deep: 245, melancholy: 215, funny: 55, tale: 310, mist: 185, misc: 45 };
  const PRI = ['fantasy', 'romance', 'detective', 'adventure', 'tale', 'cozy', 'deep', 'melancholy', 'funny', 'mist', 'classic'];
  const groupOf = b => PRI.find(k => (b.tags || []).includes(k)) || 'misc';

  const mod = A.mods.sky = {
    init(root) {
      el = root; root.innerHTML = `<canvas id="skyCv"></canvas><div class="sky__ui"><div class="wrap"><div data-rise><div class="eyebrow" id="skEb"></div><h1 class="h1">Небо <em>прочитанного</em></h1></div></div><div class="sky__hint" id="skHint"></div><div class="sky__panel" id="skPanel"></div></div>`;
      cv = A.$('#skyCv', root); ctx = cv.getContext('2d'); panel = A.$('#skPanel', root);
      const r = A.rng(77); for (let i = 0; i < 260; i++) bg.push({ x: r(), y: r(), s: r() * 1.4 + .3, p: r() * 6.28, sp: .5 + r() * 2, mw: r() < .5 });
      cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, th: theta, moved: 0, t: performance.now() }; vel = 0; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(e.clientY - drag.y)); const cx = W / 2, cy = H * .46, a1 = Math.atan2(drag.y - cy, drag.x - cx), a2 = Math.atan2(e.clientY - cy, e.clientX - cx); let d = a2 - a1; if (d > Math.PI) d -= 6.283; if (d < -Math.PI) d += 6.283; const nt = drag.th + d; vel = (nt - theta) / .016; theta = nt; });
      cv.addEventListener('pointerup', e => { if (drag && drag.moved < 8) tap(e.clientX, e.clientY); drag = null; });
      addEventListener('resize', size); layout(); size();
    },
    show() { A.rise(el); layout(); hint(); start(); if (newId) setTimeout(shootNew, 900); },
    markNew(id) { newId = id; layout(); },
    stop() { cancelAnimationFrame(raf); raf = 0; }
  };
  const origBefore = () => { };
  function size() { if (!cv) return; dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function layout() {
    const done = A.doneBooks(), groups = {}; done.forEach(b => (groups[groupOf(b)] = groups[groupOf(b)] || []).push(b));
    stars = []; const keys = Object.keys(groups);
    keys.forEach((k, gi) => {
      const ga = (gi / Math.max(keys.length, 1)) * 6.283 + A.hash(k) % 100 / 100 * .5, gr = .28 + (gi % 3) * .17, list = groups[k].sort((a, b) => (a.finished || 0) - (b.finished || 0));
      list.forEach((b, i) => { const r = A.rng(A.hash(b.id)); stars.push({ b, g: k, a: ga + (r() - .5) * .55 + i * .11, r: gr + (r() - .5) * .14 + i * .045, ph: r() * 6.28, size: 3.6 + (b.rating || 3) * 1.15 }); });
    });
    stars.forEach(s => { s.x = 0; s.y = 0; }); A.$('#skEb', el) && (A.$('#skEb', el).textContent = `${done.length} ${A.plural(done.length, 'звезда', 'звезды', 'звёзд')} · ${keys.length} ${A.plural(keys.length, 'созвездие', 'созвездия', 'созвездий')}`);
    const gs = keys.map(k => ({ k, n: groups[k].length }));
    panel.innerHTML = gs.length ? gs.map(g => `<button class="cstl" data-k="${g.k}" style="--h:${HUES[g.k]}"><i></i><b>${NAMES[g.k]}</b><small>${g.n} ${A.plural(g.n, 'книга', 'книги', 'книг')}</small></button>`).join('') : '';
    A.$$('.cstl', panel).forEach(b => b.addEventListener('click', () => { A.snd.twinkle(1); focus = { k: b.dataset.k, t: 0 }; const first = stars.find(s => s.g === b.dataset.k); if (first) { const target = -Math.PI / 2 - first.a; let d = target - theta; d = ((d + Math.PI) % 6.283 + 6.283) % 6.283 - Math.PI; focus.to = theta + d; } }));
  }
  function hint() { const n = A.doneBooks().length; A.$('#skHint', el).innerHTML = n ? '<span>Покрути небо пальцем. Коснись звезды.</span>' : '<span>Небо пока пустое. Дочитай книгу, и здесь зажжётся первая звезда ✨</span>'; }
  function pos(s) { const cx = W / 2, cy = H * .44, R = Math.min(W, H) * 1.0, a = s.a + theta; return { x: cx + Math.cos(a) * s.r * R * .95, y: cy + Math.sin(a) * s.r * R * .78 }; }
  function tap(x, y) { let best = null, bd = 30; stars.forEach(s => { const p = pos(s), d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = s; } }); if (!best) { if (!stars.length) A.snd.twinkle(0); return; } A.snd.twinkle(A.hash(best.b.id) % 5); A.fx.stars(x, y, 10); starCard(best); }
  function starCard(s) { const b = s.b, qn = A.state.quotes.filter(q => q.bookId === b.id).length; A.sheet.open({ noHead: true, html: `<div class="starc"><div class="starc__c">${A.coverHTML(b)}</div><div><div class="eyebrow" style="color:hsl(${HUES[s.g]} 80% 75%)">созвездие ${NAMES[s.g]}</div><h3 style="font:300 24px/1.2 var(--f);margin:8px 0 4px">${A.esc(b.title)}</h3><p class="sub" style="font-size:15px">${A.esc(b.author || '')}</p><div class="stars5 sm">${[1, 2, 3, 4, 5].map(n => `<button class="${(b.rating || 0) >= n ? 'on' : ''}"><svg class="ico" viewBox="0 0 24 24"><use href="#i-star"/></svg></button>`).join('')}</div><p class="sub" style="font-size:14px;margin-top:6px">${b.finished ? 'Прочитана ' + new Date(b.finished).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : ''}${qn ? ' · цитат: ' + qn : ''}</p></div></div><button class="btn btn--gold" style="width:100%;margin-top:16px" id="stgo">Открыть книгу</button>`, onMount: sh => A.$('#stgo', sh.el).addEventListener('click', () => { sh.close(); A.go('books'); setTimeout(() => A.mods.books.openBook(b.id), 900); }) }); }
  function shootNew() { const s = stars.find(x => x.b.id === newId); if (!s) { newId = null; return; } shoot = { t: 0, s, tx: 0, ty: 0 }; A.snd.shooting(); }
  function start() { if (raf) return; last = performance.now(); raf = requestAnimationFrame(frame); }
  function frame(now) {
    if (A.tab !== 'sky') { raf = 0; return; } raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    if (!drag) { if (focus && focus.to != null) { theta += (focus.to - theta) * Math.min(1, dt * 3); if (Math.abs(focus.to - theta) < .01) { focus.t += dt; if (focus.t > 2.4) focus = null; } } else { theta += vel * dt; vel *= .95; if (Math.abs(vel) < .005) vel = 0; theta += dt * .012; } }
    // sky
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#040818'); g.addColorStop(.55, '#0a1233'); g.addColorStop(1, '#190f33'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // milky way
    ctx.save(); ctx.translate(W / 2, H * .4); ctx.rotate(-.5 + theta * .15); const mw = ctx.createLinearGradient(0, -H * .22, 0, H * .22); mw.addColorStop(0, 'rgba(140,150,255,0)'); mw.addColorStop(.5, 'rgba(170,160,255,.14)'); mw.addColorStop(1, 'rgba(140,150,255,0)'); ctx.fillStyle = mw; ctx.fillRect(-W, -H * .22, W * 2, H * .44); ctx.restore();
    bg.forEach(s => { const x = s.x * W, y = s.y * H, a = .35 + .5 * Math.sin(t * s.sp + s.p) ** 2; ctx.fillStyle = `rgba(255,248,230,${a * (s.mw ? .5 : .8)})`; ctx.beginPath(); ctx.arc(x, y, s.s, 0, 6.283); ctx.fill(); });
    // placeholder crown when the sky is empty
    if (!stars.length) { const cx = W / 2, cy = H * .42, pts = [[-70, 20], [-86, -30], [-40, -2], [0, -52], [40, -2], [86, -30], [70, 20]]; ctx.strokeStyle = 'rgba(255,226,160,.28)'; ctx.setLineDash([5, 9]); ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(cx + p[0], cy + p[1]) : ctx.moveTo(cx + p[0], cy + p[1])); ctx.stroke(); ctx.setLineDash([]); pts.forEach((p, i) => { const a = .3 + .4 * Math.sin(t * 1.4 + i); ctx.fillStyle = `rgba(255,226,160,${a})`; ctx.beginPath(); ctx.arc(cx + p[0], cy + p[1], 3, 0, 6.283); ctx.fill(); }); }
    // constellation lines
    const byG = {}; stars.forEach(s => (byG[s.g] = byG[s.g] || []).push(s));
    Object.entries(byG).forEach(([k, list]) => { const hue = HUES[k], f = focus && focus.k === k, pts = list.map(pos); ctx.strokeStyle = `hsla(${hue},80%,78%,${f ? .75 : .32})`; ctx.lineWidth = f ? 1.6 : 1; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
      if (list.length > 1) { const m = pts[Math.floor(pts.length / 2)]; ctx.font = 'italic 400 14px "Cormorant Garamond",serif'; ctx.fillStyle = `hsla(${hue},70%,86%,${f ? .95 : .5})`; ctx.textAlign = 'center'; ctx.fillText(NAMES[k], m.x, m.y + 26); } });
    // stars
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    stars.forEach(s => { const p = pos(s), hue = HUES[s.g], isNew = shoot && shoot.s === s && shoot.t < 1.6, f = focus && focus.k === s.g; if (isNew) return; const tw = .75 + .25 * Math.sin(t * 2 + s.ph), sz = s.size * (f ? 1.25 : 1) * tw, gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 5); gl.addColorStop(0, `hsla(${hue},90%,85%,.9)`); gl.addColorStop(.25, `hsla(${hue},90%,70%,.35)`); gl.addColorStop(1, `hsla(${hue},90%,60%,0)`); ctx.fillStyle = gl; ctx.fillRect(p.x - sz * 5, p.y - sz * 5, sz * 10, sz * 10); ctx.fillStyle = '#fff8e2'; ctx.beginPath(); ctx.arc(p.x, p.y, sz * .5, 0, 6.283); ctx.fill(); ctx.strokeStyle = `hsla(${hue},90%,90%,.8)`; ctx.lineWidth = 1; const L = sz * 2.4 * tw; ctx.beginPath(); ctx.moveTo(p.x - L, p.y); ctx.lineTo(p.x + L, p.y); ctx.moveTo(p.x, p.y - L); ctx.lineTo(p.x, p.y + L); ctx.stroke(); });
    ctx.restore();
    // a new star falls into place
    if (shoot) { shoot.t += dt * .7; const p = pos(shoot.s), k = A.ease.out(Math.min(1, shoot.t)), sx = -40, sy = -20, x = A.lerp(sx, p.x, k), y = A.lerp(sy, p.y, k); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 22; i++) { const kk = Math.max(0, k - i * .018), tx = A.lerp(sx, p.x, kk), ty = A.lerp(sy, p.y, kk), a = (1 - i / 22) * .7, r = 7 * (1 - i / 26); ctx.fillStyle = `rgba(255,236,170,${a})`; ctx.beginPath(); ctx.arc(tx, ty, r, 0, 6.283); ctx.fill(); } ctx.restore(); if (shoot.t >= 1) { A.fx.stars(p.x, p.y, 34); A.snd.unlock2(); A.vibrate(30); const id = shoot.s.b.id; shoot = null; newId = null; focus = { k: stars.find(s => s.b.id === id).g, t: 0 }; } }
    // ambient shooting star
    if (!shoot && Math.random() < dt * .08) { ambient = { t: 0, x: Math.random() * W * .7, y: Math.random() * H * .3 }; A.snd.shooting(); }
    if (typeof ambient !== 'undefined' && ambient) { ambient.t += dt * 1.4; const k = ambient.t, x = ambient.x + k * 260, y = ambient.y + k * 140; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createLinearGradient(x, y, x - 90, y - 48); gr.addColorStop(0, 'rgba(255,248,220,.9)'); gr.addColorStop(1, 'rgba(255,248,220,0)'); ctx.strokeStyle = gr; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 90, y - 48); ctx.stroke(); ctx.restore(); if (k > 1) ambient = null; }
  }
  let ambient = null;
})();
