/* ============================================================ Зельеварня: flasks of moods + ingredients -> cauldron -> a book to read tonight */
(() => {
  const FLASKS = [
    { k: 'cozy', c: '#f0b25a' }, { k: 'fantasy', c: '#9b7bff' }, { k: 'detective', c: '#5aa6b0' },
    { k: 'romance', c: '#e86a8f' }, { k: 'melancholy', c: '#5f86d6' }, { k: 'adventure', c: '#58c28a' }
  ];
  const INGR = [
    { id: 'moss', n: 'лунный мох', c: '#7fd29a', b: ['cozy', 'tale'], ic: '<path d="M5 18c2-6 4-9 7-9s5 3 7 9M8 18c1-3 2-5 4-5s3 2 4 5"/>' },
    { id: 'fly', n: 'светлячок', c: '#e6f58a', b: ['fantasy', 'adventure'], ic: '<circle cx="12" cy="12" r="3"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.5 6.5l1.400 1.400M16.100 16.100l1.400 1.400M17.500 6.500l-1.400 1.400M7.900 16.100l-1.400 1.400"/>' },
    { id: 'dew', n: 'капля росы', c: '#8fc7ff', b: ['melancholy', 'deep'], ic: '<path d="M12 4c3 4 5 6.500 5 9.500a5 5 0 0 1-10 0C7 10.500 9 8 12 4z"/>' },
    { id: 'cin', n: 'корица', c: '#d79a63', b: ['romance', 'cozy'], ic: '<path d="M6 17L17 6M9 19L19 8M5 14L14 5"/>' },
    { id: 'leaf', n: 'сухой лист', c: '#d9a441', b: ['mist', 'detective', 'classic'], ic: '<path d="M19 5C9 5 5 10 5 15c0 1.500.4 2.800 1 4 6 0 13-3 13-14zM6 19c3-6 7-9 11-11"/>' }
  ];
  let el, sel = new Set(), ing = [], brewing = false, cv, cx, bubbles = [], steam = [], liquid = '#2d5a52', liqT = '#2d5a52', t = 0, run = false, last = 0;

  const flaskSVG = (c) => `<svg viewBox="0 0 64 88" class="fl"><defs><linearGradient id="g${c.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".95"/><stop offset="1" stop-color="${c}" stop-opacity=".55"/></linearGradient></defs>
    <path d="M24 6h16M26 6v20L8 66c-3 8 1 16 10 16h28c9 0 13-8 10-16L38 26V6" fill="rgba(255,255,255,.04)" stroke="rgba(255,226,160,.7)" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M14 52c8-4 14 4 22 0s12-4 14 0l5 14c3 8-1 14-9 14H18c-8 0-12-6-9-14z" fill="url(#g${c.slice(1)})"/><path d="M28 10v14" stroke="rgba(255,255,255,.35)" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="22" cy="62" rx="3" ry="9" fill="#fff" opacity=".12"/><circle cx="32" cy="0" r="0"/></svg>`;

  A.mods.potion = {
    init(root) {
      el = root;
      root.innerHTML = `<div class="wrap potion"><div data-rise><div class="eyebrow">чтение по рецептам</div><h1 class="h1"><em>Зельеварня</em></h1><p class="sub">Выбери настроение вечера и брось в котёл пару ингредиентов. Лес подскажет, что читать.</p></div>
        <div class="flasks" data-rise id="flasks">${FLASKS.map(f => `<button class="flask" data-k="${f.k}" style="--c:${f.c}">${flaskSVG(f.c)}<span>${A.MOODS[f.k]}</span></button>`).join('')}</div>
        <div class="cauldron" data-rise id="cauldron"><canvas id="potCv"></canvas><div class="cauldron__hint" id="potHint">Выбери до двух настроений</div></div>
        <div class="ingr" data-rise id="ingr">${INGR.map(g => `<button class="ing" data-id="${g.id}" style="--c:${g.c}"><svg viewBox="0 0 24 24" class="ico">${g.ic}</svg><span>${g.n}</span></button>`).join('')}</div>
        <div style="text-align:center;margin-top:20px" data-rise><button class="btn btn--gold" id="potGo">Сварить зелье</button></div>
        <div id="potRes"></div><div style="height:30px"></div></div>`;
      cv = A.$('#potCv', root); cx = cv.getContext('2d');
      A.$('#flasks', root).addEventListener('click', e => { const b = e.target.closest('.flask'); if (b) toggle(b); });
      A.$$('.ing', root).forEach(b => bindDrag(b));
      A.$('#potGo', root).addEventListener('click', brew);
    },
    show() { A.rise(el); size(); if (!run) { run = true; last = performance.now(); requestAnimationFrame(frame); } },
    beforeShow() {}
  };
  const hint = s => { const h = A.$('#potHint', el); h.textContent = s; };
  function size() { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); cv.width = r.width * d; cv.height = r.height * d; cx.setTransform(d, 0, 0, d, 0, 0); }
  function toggle(b) {
    if (brewing) return; const k = b.dataset.k; A.snd.bubble();
    if (sel.has(k)) sel.delete(k); else { if (sel.size >= 2) { const first = [...sel][0]; sel.delete(first); A.$(`.flask[data-k="${first}"]`, el).classList.remove('on'); } sel.add(k); pour(b); }
    b.classList.toggle('on', sel.has(k)); mixColor(); hint(sel.size ? `В котле: ${[...sel].map(x => A.MOODS[x]).join(' + ')}${ing.length ? ' · ' + ing.length + ' ингр.' : ''}` : 'Выбери до двух настроений');
  }
  function pour(b) { const r = b.getBoundingClientRect(), c = A.$('#cauldron', el).getBoundingClientRect(); A.fx.sparks(r.left + r.width / 2, r.top + r.height * .3, 10, b.style.getPropertyValue('--c')); for (let i = 0; i < 9; i++) bubbles.push(newBubble(.5 + (Math.random() - .5) * .3)); }
  function mixColor() { const cs = [...sel].map(k => FLASKS.find(f => f.k === k).c).concat(ing.map(i => i.c)); if (!cs.length) { liqT = '#2d5a52'; return; } const rgb = cs.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))), m = [0, 1, 2].map(i => Math.round(rgb.reduce((a, c) => a + c[i], 0) / rgb.length)); liqT = `rgb(${m})`; }
  const hex = c => c.startsWith('#') ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : c.match(/\d+/g).slice(0, 3).map(Number);
  let cur = [45, 90, 82];
  function newBubble(x) { return { x, y: 0.62, r: 2 + Math.random() * 5, v: .12 + Math.random() * .2, ph: Math.random() * 6 }; }

  function bindDrag(b) {
    let drag = null, ghost = null;
    b.addEventListener('pointerdown', e => { if (brewing) return; b.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, moved: false }; });
    b.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.hypot(dx, dy) > 8) { drag.moved = true; ghost = b.cloneNode(true); ghost.classList.add('ghost'); document.body.appendChild(ghost); b.classList.add('lift'); } if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; const hot = overPot(e.clientX, e.clientY); A.$('#cauldron', el).classList.toggle('hot', hot); } });
    const end = e => { if (!drag) return; const moved = drag.moved; drag = null; b.classList.remove('lift'); A.$('#cauldron', el).classList.remove('hot'); if (ghost) { const ok = overPot(e.clientX, e.clientY); ghost.remove(); ghost = null; if (ok) drop(b); } else if (!moved) drop(b); };
    b.addEventListener('pointerup', end); b.addEventListener('pointercancel', () => { drag = null; if (ghost) { ghost.remove(); ghost = null; } b.classList.remove('lift'); });
  }
  const overPot = (x, y) => { const r = A.$('#cauldron', el).getBoundingClientRect(); return x > r.left && x < r.right && y > r.top - 20 && y < r.bottom + 20; };
  function drop(b) {
    const g = INGR.find(i => i.id === b.dataset.id); const has = ing.includes(g);
    if (has) { ing = ing.filter(i => i !== g); b.classList.remove('on'); A.snd.tap(); }
    else { if (ing.length >= 3) { A.toast('В котёл помещается три ингредиента'); return; } ing.push(g); b.classList.add('on'); A.snd.pop(); const r = A.$('#cauldron', el).getBoundingClientRect(); A.fx.sparks(r.left + r.width / 2, r.top + r.height * .45, 16, g.c); for (let i = 0; i < 8; i++) bubbles.push(newBubble(.5 + (Math.random() - .5) * .4)); }
    mixColor(); hint(sel.size ? `В котле: ${[...sel].map(x => A.MOODS[x]).join(' + ')}${ing.length ? ' · ' + ing.length + ' ингр.' : ''}` : ing.length ? 'Теперь выбери настроение' : 'Выбери до двух настроений');
  }

  function frame(now) {
    requestAnimationFrame(frame); if (A.tab !== 'potion') { last = now; return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    const w = cv.clientWidth, h = cv.clientHeight; if (!w) return; cx.clearRect(0, 0, w, h);
    const tg = hex(liqT); cur = cur.map((v, i) => v + (tg[i] - v) * Math.min(1, dt * 3)); const col = `rgb(${cur.map(Math.round)})`, k = brewing ? 1 : .4;
    // glow behind
    const gl = cx.createRadialGradient(w / 2, h * .5, 0, w / 2, h * .5, w * .6); gl.addColorStop(0, `rgba(${cur.map(Math.round)},${.28 * (brewing ? 1.6 : 1)})`); gl.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = gl; cx.fillRect(0, 0, w, h);
    const cxm = w / 2, top = h * .42, rw = w * .34, body = h * .34;
    // pot body
    cx.save(); const pg = cx.createLinearGradient(cxm - rw, 0, cxm + rw, 0); pg.addColorStop(0, '#050606'); pg.addColorStop(.35, '#1a1d1c'); pg.addColorStop(.6, '#0b0d0c'); pg.addColorStop(1, '#030404');
    cx.fillStyle = pg; cx.beginPath(); cx.moveTo(cxm - rw, top); cx.bezierCurveTo(cxm - rw * 1.18, top + body * .9, cxm - rw * .7, top + body * 1.35, cxm, top + body * 1.35); cx.bezierCurveTo(cxm + rw * .7, top + body * 1.35, cxm + rw * 1.18, top + body * .9, cxm + rw, top); cx.closePath(); cx.fill();
    cx.strokeStyle = 'rgba(255,226,160,.35)'; cx.lineWidth = 1; cx.stroke();
    // rim + liquid
    cx.fillStyle = '#0a0c0b'; cx.beginPath(); cx.ellipse(cxm, top, rw, rw * .22, 0, 0, 6.3); cx.fill(); cx.strokeStyle = 'rgba(255,226,160,.55)'; cx.stroke();
    const lg = cx.createRadialGradient(cxm, top, 0, cxm, top, rw); lg.addColorStop(0, col); lg.addColorStop(1, `rgba(${cur.map(v => Math.round(v * .45))},1)`);
    cx.fillStyle = lg; cx.beginPath(); cx.ellipse(cxm, top, rw * .9, rw * .17, 0, 0, 6.3); cx.fill();
    cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = .16 + .1 * Math.sin(t * 3); cx.fillStyle = col; cx.beginPath(); cx.ellipse(cxm, top - 4, rw * .5, rw * .08, 0, 0, 6.3); cx.fill(); cx.globalAlpha = 1;
    // bubbles
    if (Math.random() < dt * (brewing ? 40 : 4 + sel.size * 3 + ing.length * 2)) bubbles.push(newBubble(.5 + (Math.random() - .5) * .45));
    bubbles = bubbles.filter(b => { b.y -= b.v * dt * (brewing ? 2.4 : 1); if (b.y < .38) { if (brewing && Math.random() < .3) A.snd.bubble(); return false; } const bx = cxm + (b.x - .5) * rw * 1.6 + Math.sin(t * 3 + b.ph) * 3, by = top + (b.y - .42) * h * .5; cx.globalAlpha = .55; cx.strokeStyle = `rgba(255,255,255,.7)`; cx.beginPath(); cx.arc(bx, by, b.r * (1 - (b.y - .38) * .2), 0, 6.3); cx.stroke(); cx.fillStyle = col; cx.globalAlpha = .12; cx.fill(); cx.globalAlpha = 1; return true; });
    // steam
    if (Math.random() < dt * (3 + k * 8)) steam.push({ x: cxm + (Math.random() - .5) * rw, y: top - 4, vx: (Math.random() - .5) * 6, vy: -(12 + Math.random() * 18), life: 0, max: 2.4 + Math.random() * 2, s: 14 + Math.random() * 20 });
    steam = steam.filter(s => { s.life += dt; if (s.life > s.max) return false; s.x += (s.vx + Math.sin(t * 1.4 + s.max) * 6) * dt; s.y += s.vy * dt; const kk = s.life / s.max, r = s.s * (1 + kk * 1.6); const g2 = cx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r); g2.addColorStop(0, `rgba(${cur.map(v => Math.round(120 + v * .5))},${.2 * (1 - kk)})`); g2.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = g2; cx.fillRect(s.x - r, s.y - r, r * 2, r * 2); return true; });
    cx.restore();
    // fire under the pot
    cx.save(); cx.globalCompositeOperation = 'lighter'; const fy = top + body * 1.38; const fg = cx.createRadialGradient(cxm, fy, 0, cxm, fy, rw * 1.2); fg.addColorStop(0, `rgba(255,150,60,${.5 + .15 * Math.sin(t * 9)})`); fg.addColorStop(1, 'rgba(255,100,20,0)'); cx.fillStyle = fg; cx.fillRect(0, fy - rw * 1.2, w, rw * 2.4); cx.restore();
  }

  function brew() {
    if (brewing) return; if (!sel.size && !ing.length) { A.toast('Выбери настроение или брось ингредиент в котёл'); A.snd.owl(); return; }
    brewing = true; const res = A.$('#potRes', el); res.innerHTML = ''; hint('Зелье варится…'); A.snd.brew(); A.vibrate([20, 30, 20]); const r = A.$('#cauldron', el).getBoundingClientRect();
    let n = 0; const iv = setInterval(() => { A.fx.sparks(r.left + r.width / 2, r.top + r.height * .42, 8, '#ffd98a'); A.snd.bubble(); if (++n > 6) clearInterval(iv); }, 380);
    A.$('#cauldron', el).classList.add('boil');
    setTimeout(() => { const pick = recommend(); brewing = false; A.$('#cauldron', el).classList.remove('boil'); show(pick); }, 3000);
  }
  function recommend() {
    const want = new Set([...sel]); ing.forEach(i => i.b.forEach(m => want.add(m)));
    const mine = A.state.books.filter(b => b.status === 'want'), have = new Set(A.state.books.map(b => b.title.toLowerCase()));
    const score = b => { const tg = b.tags || b.m || []; let s = 0; tg.forEach(m => { if (sel.has(m)) s += 3; else if (want.has(m)) s += 1; }); return s + Math.random() * .9; };
    const own = mine.map(b => ({ b, s: score(b), own: true })).filter(x => x.s >= 1.5).sort((a, b) => b.s - a.s)[0];
    const cands = A.SUGGEST.filter(x => !have.has(x.t.toLowerCase())).map(x => ({ b: { title: x.t, author: x.a, pages: x.p, tags: x.m }, s: score(x) })).sort((a, b) => b.s - a.s);
    return own || cands[0] || { b: A.SUGGEST[0] && { title: A.SUGGEST[0].t, author: A.SUGGEST[0].a, pages: A.SUGGEST[0].p, tags: A.SUGGEST[0].m }, s: 0 };
  }
  function show(p) {
    const b = p.b, res = A.$('#potRes', el); A.snd.unlock2(); A.fx.fireflies(innerWidth / 2, innerHeight * .5, 30, 220); A.vibrate(30); hint('Зелье готово');
    const why = [...sel].map(k => A.MOODS[k]).concat(ing.map(i => i.n)).join(' · ');
    res.innerHTML = `<div class="reco glass" style="margin-top:22px"><div class="eyebrow">на этот вечер</div><div class="reco__row">${A.coverHTML(b, 'reco__cover')}<div><h3>${A.esc(b.title)}</h3><p class="sub" style="font-size:16px">${A.esc(b.author || '')}</p><p class="reco__why">${why ? 'рецепт: ' + A.esc(why) : ''}</p>${(b.tags || []).slice(0, 3).map(m => `<span class="tag">${A.MOODS[m] || m}</span>`).join('')}</div></div>
      <div class="row" style="margin-top:16px">${p.own ? `<button class="btn btn--gold" id="rcOpen">Открыть книгу</button>` : `<button class="btn btn--gold" id="rcAdd">Добавить в «Хочу»</button>`}<button class="btn btn--ghost" id="rcAgain">Ещё раз</button></div></div>`;
    A.rise(res); res.scrollIntoView({ behavior: 'smooth', block: 'center' });
    A.$('#rcAgain', res).addEventListener('click', () => { A.snd.tap(); res.innerHTML = ''; sel.clear(); ing = []; A.$$('.flask,.ing', el).forEach(x => x.classList.remove('on')); mixColor(); hint('Выбери до двух настроений'); el.scrollTo({ top: 0, behavior: 'smooth' }); });
    const add = A.$('#rcAdd', res), open = A.$('#rcOpen', res);
    add && add.addEventListener('click', () => { const nb = { id: A.uid(), title: b.title, author: b.author, pages: b.pages || 300, read: 0, status: 'want', rating: 0, tags: [...(b.tags || [])], impression: '', added: Date.now(), cover: {} }; A.state.books.push(nb); A.save(); A.mods.books && A.mods.books.refresh(); A.snd.coin(); A.fx.stars(innerWidth / 2, innerHeight * .6, 24); A.toast('Книга добавлена на полку'); add.disabled = true; add.textContent = 'Добавлено'; });
    open && open.addEventListener('click', () => { A.snd.page(); A.go('books'); setTimeout(() => A.mods.books.openBook(b.id), 900); });
  }
  addEventListener('resize', () => { if (cv && cv.isConnected) size(); });
})();
