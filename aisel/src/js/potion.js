/* ============================================================ alchemy lab: the bottles on the shelf and bench are the controls.
   touch a bottle: it glows, a stream of its colour arcs into the cauldron; touch the cauldron to brew */
(() => {
  const FL = { cozy: '#f0b25a', fantasy: '#9b7bff', detective: '#5aa6b0', romance: '#e86a8f', melancholy: '#5f86d6', adventure: '#58c28a' };
  let layer, cv, cx, sel = new Set(), brewing = false, bubbles = [], steam = [], sparks = [], pours = [], ripples = [], liq = [40, 90, 82], liqT = [40, 90, 82], t = 0, last = 0, run = false, built = false, lastOri = '', hot = 0, LAB = null, L = null;
  const R = (a, b) => a + Math.random() * (b - a), hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const inP = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };

  A.mods.potion = {
    init() { build(); }, beforeShow() {}, rebuild() { built = false; if (A.scene.room() === 'lab') build(); },
    show() { build(); if (!run) { run = true; last = performance.now(); requestAnimationFrame(frame); } hint('Коснись склянки, чтобы влить её в котёл'); }
  };
  const hint = s => { const h = A.$('#labHint', layer); if (!h) return; h.classList.remove('on'); void h.offsetWidth; h.textContent = s; h.classList.add('on'); clearTimeout(hint._t); hint._t = setTimeout(() => h.classList.remove('on'), 4200); };
  function build() {
    const ori = A.scene.ori(); if (built && lastOri === ori) return; built = true; lastOri = ori; L = A.scene.layout(); LAB = L.lab; layer = A.$('#labLayer');
    layer.innerHTML = `<canvas id="labCv" width="${L.room[0]}" height="${L.room[1]}"></canvas><div class="lab__t"><small>алхимическая лаборатория</small></div><div class="lab__hint" id="labHint"></div><div class="lab__res" id="labRes"></div>
      ${Object.entries(LAB.bottles).map(([k, [x, y]]) => `<button class="mood3 ${sel.has(k) ? 'on' : ''}" data-k="${k}" style="--c:${FL[k]};left:${x}px;top:${y}px"><i></i><span>${A.MOODS[k]}</span></button>`).join('')}
      <button class="lab__pot" aria-label="Котёл" style="left:${LAB.cauldron[0][0]}px;top:${LAB.cauldron[0][1]}px;width:${LAB.cauldron[1][0] - LAB.cauldron[0][0]}px;height:${LAB.cauldron[2][1] - LAB.cauldron[0][1]}px"></button>`;
    cv = A.$('#labCv'); cx = cv.getContext('2d');
    A.$$('.mood3', layer).forEach(b => { b.addEventListener('pointerdown', e => e.stopPropagation()); b.addEventListener('click', () => pick(b)); });
    const pot = A.$('.lab__pot', layer); pot.addEventListener('pointerdown', e => e.stopPropagation()); pot.addEventListener('click', brew); mix();
  }
  function mix() { const cs = [...sel].map(k => FL[k]); liqT = cs.length ? [0, 1, 2].map(i => Math.round(cs.map(h => hex(h)[i]).reduce((a, c) => a + c, 0) / cs.length * .9)) : [40, 90, 82]; }
  function pick(b) {
    if (brewing) return; const k = b.dataset.k; A.snd.bubble(); A.vibrate(10);
    if (sel.has(k)) { sel.delete(k); b.classList.remove('on'); }
    else { if (sel.size >= 2) { const f = [...sel][0]; sel.delete(f); A.$(`.mood3[data-k="${f}"]`, layer).classList.remove('on'); } sel.add(k); b.classList.add('on'); const [x, y] = LAB.bottles[k]; for (let i = 0; i < 34; i++) pours.push({ x, y, tx: LAB.pour[0] + R(-70, 70), ty: LAB.pour[1] + R(-8, 14), t: -i * .014, c: FL[k], arc: R(160, 260) }); setTimeout(() => { ripples.push({ x: LAB.pour[0], y: LAB.pour[1] + 6, r: 6, a: 1 }); for (let i = 0; i < 10; i++) bubbles.push(nb()); A.snd.bubble(); }, 520); }
    mix(); hint(sel.size ? (sel.size < 2 ? 'Добавь ещё одну или коснись котла' : 'Коснись котла') : 'Коснись склянки, чтобы влить её в котёл');
  }
  const nb = () => ({ x: LAB.pour[0] + R(-.9, .9) * 150, y: LAB.pour[1] + R(-6, 12), r: R(3, 10), v: R(30, 60), ph: R(0, 6.3), life: 0, max: R(.8, 1.8) });

  function frame(now) {
    requestAnimationFrame(frame); if (A.scene.room() !== 'lab' || !cx) { last = now; return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; hot += ((brewing ? 1 : .3 + .12 * sel.size) - hot) * dt * 2;
    cx.clearRect(0, 0, cv.width, cv.height); liq = liq.map((v, i) => v + (liqT[i] - v) * Math.min(1, dt * 2.5)); const col = `rgb(${liq.map(Math.round)})`, rgb = liq.map(Math.round).join(','), [px, py] = LAB.pour, w = LAB.rx || 150, h = LAB.ry || 34;
    // the liquid in the mouth of the cauldron
    cx.save(); cx.beginPath(); cx.ellipse(px, py + 4, w, h, 0, 0, 6.283); cx.clip();
    const lg = cx.createRadialGradient(px, py, 0, px, py, w); lg.addColorStop(0, col); lg.addColorStop(1, `rgb(${liq.map(v => Math.round(v * .3))})`); cx.globalAlpha = .88; cx.fillStyle = lg; cx.fillRect(px - w, py - h, w * 2, h * 2 + 10); cx.globalAlpha = 1;
    cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = .12 + .08 * Math.sin(t * 2.4) + hot * .1; cx.fillStyle = col; cx.beginPath(); cx.ellipse(px - 30, py - 6, w * .5, h * .4, 0, 0, 6.283); cx.fill(); cx.globalAlpha = 1;
    for (let i = ripples.length - 1; i >= 0; i--) { const r = ripples[i]; r.r += dt * 120; r.a -= dt * .9; if (r.a <= 0) { ripples.splice(i, 1); continue; } cx.strokeStyle = `rgba(255,255,255,${r.a * .5})`; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(r.x, r.y, r.r, r.r * .26, 0, 0, 6.283); cx.stroke(); }
    if (Math.random() < dt * (3 + hot * 30)) bubbles.push(nb());
    bubbles = bubbles.filter(b => { b.life += dt; if (b.life > b.max) { if (brewing && Math.random() < .5) A.snd.bubble(); return false; } const k = b.life / b.max; cx.globalAlpha = .6 * (1 - k * .5); cx.strokeStyle = 'rgba(255,255,255,.75)'; cx.lineWidth = 1.6; cx.beginPath(); cx.arc(b.x + Math.sin(t * 3 + b.ph) * 4, b.y - b.v * b.life * .3, b.r * (1 + k * .6), 0, 6.283); cx.stroke(); cx.fillStyle = `rgba(${rgb},.2)`; cx.fill(); return true; });
    cx.restore(); cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
    if (Math.random() < dt * (5 + hot * 24)) steam.push({ x: px + R(-.8, .8) * w, y: py - 10, vx: R(-10, 10), vy: -R(30, 70), life: 0, max: R(2.4, 4.4), s: R(36, 64) });
    steam = steam.filter(s => { s.life += dt; if (s.life > s.max) return false; const k = s.life / s.max; s.x += (s.vx + Math.sin(t * 1.3 + s.max) * 14) * dt; s.y += s.vy * dt; const r = s.s * (1 + k * 1.8), g = cx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r); g.addColorStop(0, `rgba(${liq.map(v => Math.round(150 + v * .35)).join(',')},${.2 * (1 - k)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = g; cx.fillRect(s.x - r, s.y - r, r * 2, r * 2); return true; });
    cx.globalCompositeOperation = 'lighter';
    pours = pours.filter(p => { p.t += dt * 1.6; if (p.t < 0) return true; if (p.t > 1) { if (Math.random() < .25) ripples.push({ x: p.tx, y: p.ty, r: 4, a: .7 }); return false; } const k = p.t, x = p.x + (p.tx - p.x) * k, y = p.y + (p.ty - p.y) * k - Math.sin(k * Math.PI) * p.arc; cx.globalAlpha = .9; const g = cx.createRadialGradient(x, y, 0, x, y, 16); g.addColorStop(0, p.c); g.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = g; cx.fillRect(x - 16, y - 16, 32, 32); return true; });
    sparks = sparks.filter(s => { s.life += dt; if (s.life > s.max) return false; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; cx.globalAlpha = 1 - s.life / s.max; cx.fillStyle = '#ffd98a'; cx.fillRect(s.x, s.y, 3, 3); return true; });
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
  }

  function brew() {
    if (brewing) return; if (!sel.size) { A.toast('Выбери настроение: коснись любой склянки'); A.snd.owl(); return; }
    brewing = true; A.$('#labRes', layer).classList.remove('on'); hint('Зелье варится…'); A.snd.brew(); A.vibrate([20, 30, 20]); layer.classList.add('boil');
    let n = 0; const iv = setInterval(() => { for (let i = 0; i < 10; i++) sparks.push({ x: LAB.pour[0] + R(-110, 110), y: LAB.pour[1], vx: R(-90, 90), vy: -R(160, 360), life: 0, max: R(.6, 1.2) }); for (let i = 0; i < 6; i++) bubbles.push(nb()); A.snd.bubble(); if (++n > 7) clearInterval(iv); }, 380);
    setTimeout(() => { const pick_ = recommend(); brewing = false; layer.classList.remove('boil'); show(pick_); }, 3200);
  }
  function recommend() {
    const mine = A.state.books.filter(b => b.status === 'want'), have = new Set(A.state.books.map(b => b.title.toLowerCase()));
    const score = b => { const tg = b.tags || b.m || []; let s = 0; tg.forEach(m => { if (sel.has(m)) s += 3; }); return s + Math.random() * .9; };
    const own = mine.map(b => ({ b, s: score(b), own: true })).filter(x => x.s >= 1.5).sort((a, b) => b.s - a.s)[0];
    const cands = A.SUGGEST.filter(x => !have.has(x.t.toLowerCase())).map(x => ({ b: { title: x.t, author: x.a, pages: x.p, tags: x.m }, s: score(x) })).sort((a, b) => b.s - a.s);
    return own || cands[0] || { b: { title: A.SUGGEST[0].t, author: A.SUGGEST[0].a, pages: A.SUGGEST[0].p, tags: A.SUGGEST[0].m }, s: 0 };
  }
  function show(p) {
    const b = p.b, res = A.$('#labRes', layer); A.snd.unlock2(); A.fx.fireflies(innerWidth / 2, innerHeight * .5, 30, 220); A.vibrate(30); hint('');
    const why = [...sel].map(k => A.MOODS[k]).join(' · ');
    res.innerHTML = `<div class="scroll3"><small>на этот вечер</small><div class="scroll3__row">${A.coverHTML(b, 'reco__cover')}<div><h3>${A.esc(b.title)}</h3><p>${A.esc(b.author || '')}</p><em>${why ? 'рецепт: ' + A.esc(why) : ''}</em></div></div>
      <div class="scroll3__btn">${p.own ? `<button class="btn btn--gold" id="rcOpen">Открыть</button>` : `<button class="btn btn--gold" id="rcAdd">В «Хочу»</button>`}<button class="btn btn--ghost" id="rcAgain">Ещё раз</button></div></div>`;
    res.classList.add('on'); [...res.querySelectorAll('button')].forEach(x => x.addEventListener('pointerdown', e => e.stopPropagation()));
    A.$('#rcAgain', res).addEventListener('click', () => { A.snd.tap(); res.classList.remove('on'); sel.clear(); A.$$('.mood3', layer).forEach(x => x.classList.remove('on')); mix(); hint('Коснись склянки, чтобы влить её в котёл'); });
    const add = A.$('#rcAdd', res), open = A.$('#rcOpen', res);
    add && add.addEventListener('click', () => { A.state.books.push({ id: A.uid(), title: b.title, author: b.author, pages: b.pages || 300, read: 0, status: 'want', rating: 0, tags: [...(b.tags || [])], impression: '', added: Date.now(), cover: {} }); A.save(); A.mods.books && A.mods.books.refresh(); A.snd.coin(); A.fx.stars(innerWidth / 2, innerHeight * .6, 24); A.toast('Книга ждёт тебя в библиотеке'); add.disabled = true; add.textContent = 'Добавлено'; });
    open && open.addEventListener('click', () => { const bk = b.id ? b : A.state.books.find(x => x.title === b.title); A.snd.page(); A.go('books'); setTimeout(() => { if (bk && bk.hasText) A.reader.open(bk, null); else if (bk) A.mods.books.openBook(bk.id); }, 1800); });
  }
})();
