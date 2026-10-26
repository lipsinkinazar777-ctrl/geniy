/* ============================================================ alchemy lab: flasks on the shelf, jars on the bench, an iron cauldron you feed with your own hands */
(() => {
  const FLASKS = [{ k: 'cozy', c: '#f0b25a' }, { k: 'fantasy', c: '#9b7bff' }, { k: 'detective', c: '#5aa6b0' }, { k: 'romance', c: '#e86a8f' }, { k: 'melancholy', c: '#5f86d6' }, { k: 'adventure', c: '#58c28a' }];
  const JAR = {
    moss: '<g fill="#6fbf7f"><circle cx="30" cy="62" r="12"/><circle cx="42" cy="58" r="11"/><circle cx="34" cy="50" r="10"/><circle cx="22" cy="56" r="9"/></g><g fill="#9be3a5" opacity=".6"><circle cx="36" cy="52" r="4"/><circle cx="26" cy="58" r="3"/></g>',
    fly: '<g fill="#eaff8c"><circle cx="24" cy="48" r="3"/><circle cx="40" cy="42" r="2.4"/><circle cx="34" cy="60" r="3.2"/><circle cx="46" cy="56" r="2"/><circle cx="22" cy="64" r="2"/></g><circle cx="34" cy="54" r="22" fill="#f4ff9e" opacity=".22"/>',
    dew: '<g fill="#8fc7ff"><path d="M30 44c4 6 7 9 7 13a7 7 0 0 1-14 0c0-4 3-7 7-13z"/><path d="M44 52c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z" opacity=".8"/></g><ellipse cx="34" cy="72" rx="20" ry="4" fill="#8fc7ff" opacity=".4"/>',
    cin: '<g stroke="#b5703c" stroke-width="5" stroke-linecap="round"><path d="M20 70L44 42"/><path d="M28 72L50 50"/><path d="M16 62L34 44"/></g><g stroke="#e0a066" stroke-width="1.5" opacity=".7"><path d="M22 66L42 44"/></g>',
    leaf: '<g fill="#d9a441"><path d="M20 66c2-12 10-18 22-18-2 12-10 18-22 18z"/><path d="M34 70c0-9 6-15 16-16-1 9-7 15-16 16z" fill="#c4762f"/></g>'
  };
  const INGR = [
    { id: 'moss', n: 'лунный мох', c: '#7fd29a', b: ['cozy', 'tale'] }, { id: 'fly', n: 'светлячки', c: '#e6f58a', b: ['fantasy', 'adventure'] }, { id: 'dew', n: 'роса', c: '#8fc7ff', b: ['melancholy', 'deep'] },
    { id: 'cin', n: 'корица', c: '#d79a63', b: ['romance', 'cozy'] }, { id: 'leaf', n: 'сухой лист', c: '#d9a441', b: ['mist', 'detective', 'classic'] }
  ];
  let POT = { x: 540, y: 1130, rx: 252, ry: 62 }, CFG = null;
  const LABCFG = { portrait: { w: 1080, h: 1920, pot: { x: 540, y: 1130, rx: 252, ry: 62 }, fl: i => [102 + i * 148, 762], jar: i => [112 + i * 176, 1590], hint: [60, 1005], res: [130, 120, 820], title: 64, fire: [540, 1430] }, landscape: { w: 1920, h: 1080, pot: { x: 1290, y: 600, rx: 252, ry: 62 }, fl: i => [770 + i * 168, 270], jar: i => [250 + i * 200, 640], hint: [740, 440], res: [200, 60, 640], title: 40, fire: [1290, 800] } };
  let layer, cv, cx, sel = new Set(), ing = [], brewing = false, bubbles = [], steam = [], sparks = [], pours = [], ripples = [], liq = [40, 90, 82], liqT = [40, 90, 82], t = 0, last = 0, run = false, built = false, hot = 0, flames = [], lastOri = '';
  const R = (a, b) => a + Math.random() * (b - a), hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const flask = c => `<svg viewBox="0 0 64 88" class="fl"><defs><linearGradient id="g${c.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".95"/><stop offset="1" stop-color="${c}" stop-opacity=".5"/></linearGradient></defs><path d="M24 6h16M26 6v20L8 66c-3 8 1 16 10 16h28c9 0 13-8 10-16L38 26V6" fill="rgba(255,255,255,.05)" stroke="rgba(255,226,160,.75)" stroke-width="1.3" stroke-linejoin="round"/><path d="M14 52c8-4 14 4 22 0s12-4 14 0l5 14c3 8-1 14-9 14H18c-8 0-12-6-9-14z" fill="url(#g${c.slice(1)})"/><path d="M28 10v14" stroke="rgba(255,255,255,.4)" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="22" cy="62" rx="3" ry="9" fill="#fff" opacity=".14"/></svg>`;
  const jar = g => `<svg viewBox="0 0 68 92" class="jar"><rect x="22" y="2" width="24" height="12" rx="3" fill="#7a5436"/><rect x="24" y="4" width="20" height="3" fill="#a07850" opacity=".7"/><path d="M18 14h32v6c8 4 12 12 12 24v30c0 8-6 14-14 14H20c-8 0-14-6-14-14V44c0-12 4-20 12-24z" fill="rgba(210,230,235,.10)" stroke="rgba(255,226,160,.6)" stroke-width="1.3"/>${JAR[g.id]}<path d="M14 40v38" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".22"/></svg>`;

  A.mods.potion = {
    init() { build(); }, beforeShow() {}, rebuild() { built = false; build(); },
    show() { build(); if (!run) { run = true; last = performance.now(); requestAnimationFrame(frame); } sizeCv(); }
  };
  function build() {
    const ori = A.scene.ori(); if (built && lastOri === ori) return; built = true; lastOri = ori; CFG = LABCFG[ori]; POT = CFG.pot; layer = A.$('#labLayer'); const sel0 = [...sel], ing0 = [...ing];
    layer.innerHTML = `<img class="lab__fg" src="img/lab-fg${ori === 'landscape' ? '-l' : ''}.webp" alt=""><canvas id="labCv" width="${CFG.w}" height="${CFG.h}"></canvas>${ori === 'portrait' ? '<div class="lab__moon"></div>' : ''}
      <div class="lab__t" style="top:${CFG.title}px"><small>алхимическая лаборатория</small></div>
      ${FLASKS.map((f, i) => { const [x, y] = CFG.fl(i); return `<button class="flask3 ${sel.has(f.k) ? 'on' : ''}" data-k="${f.k}" style="--c:${f.c};left:${x}px;top:${y}px"><div class="fl3">${flask(f.c)}</div><span>${A.MOODS[f.k]}</span></button>`; }).join('')}
      <div class="lab__hint" id="labHint" style="left:${CFG.hint[0]}px;top:${CFG.hint[1]}px;width:${ori === 'landscape' ? 900 : 960}px;text-align:center">Выбери настроение на полке</div>
      ${INGR.map((g, i) => { const [x, y] = CFG.jar(i); return `<div class="ing3" data-id="${g.id}" style="--c:${g.c};left:${x}px;top:${y}px"><div class="jar3">${jar(g)}</div><span>${g.n}</span></div>`; }).join('')}
      <button class="lab__pot" aria-label="Котёл" style="left:${POT.x - 290}px;top:${POT.y - 70}px"></button><div class="lab__res" id="labRes" style="left:${CFG.res[0]}px;top:${CFG.res[1]}px;width:${CFG.res[2]}px"></div>`;
    cv = A.$('#labCv'); cx = cv.getContext('2d');
    A.$$('.flask3', layer).forEach(b => { b.addEventListener('pointerdown', e => e.stopPropagation()); b.addEventListener('click', () => pickFlask(b)); });
    A.$$('.ing3', layer).forEach(bindDrag);
    const pot = A.$('.lab__pot', layer); pot.addEventListener('pointerdown', e => e.stopPropagation()); pot.addEventListener('click', brew); mix();
  }
  const sizeCv = () => {};
  const hint = s => { const h = A.$('#labHint', layer); h.classList.remove('on'); void h.offsetWidth; h.textContent = s; h.classList.add('on'); };
  const status = () => sel.size ? (ing.length ? 'Теперь коснись котла: пора варить' : 'Добавь ингредиенты или вари сразу: коснись котла') : ing.length ? 'Выбери настроение на полке' : 'Выбери настроение на полке';
  function mix() { const cs = [...sel].map(k => FLASKS.find(f => f.k === k).c).concat(ing.map(i => i.c)); liqT = cs.length ? [0, 1, 2].map(i => Math.round(cs.map(h => hex(h)[i]).reduce((a, c) => a + c, 0) / cs.length * .9)) : [40, 90, 82]; }
  function pickFlask(b) {
    if (brewing) return; const k = b.dataset.k; A.snd.bubble();
    if (sel.has(k)) { sel.delete(k); b.classList.remove('on'); } else { if (sel.size >= 2) { const f = [...sel][0]; sel.delete(f); A.$(`.flask3[data-k="${f}"]`, layer).classList.remove('on'); } sel.add(k); b.classList.add('on'); pourFrom(b); }
    mix(); hint(status());
  }
  function pourFrom(b) { const r = b.getBoundingClientRect(), p = toPlate(r.left + r.width / 2, r.top + r.height * .3), c = b.style.getPropertyValue('--c'); setTimeout(() => { for (let i = 0; i < 26; i++) pours.push({ x: p[0] + R(-6, 6), y: p[1], tx: POT.x + R(-60, 60), ty: POT.y + R(-8, 14), t: -i * .018, c, life: 0 }); }, 120); }
  const toPlate = (sx, sy) => { const [x, y] = A.scene.clientToRoom(sx, sy); return [x, y]; };

  function bindDrag(el) {
    let st = null, gh = null; const jarEl = A.$('.jar3', el);
    el.addEventListener('pointerdown', e => { if (brewing) return; e.stopPropagation(); el.setPointerCapture(e.pointerId); const r = jarEl.getBoundingClientRect(); st = { w: r.width, h: r.height, dx: e.clientX - (r.left + r.width / 2), dy: e.clientY - (r.top + r.height / 2), moved: false, x: e.clientX, y: e.clientY }; });
    el.addEventListener('pointermove', e => { if (!st) return; if (!st.moved && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 6) { st.moved = true; gh = jarEl.cloneNode(true); gh.classList.add('ghost3'); gh.style.width = st.w + 'px'; gh.style.height = st.h + 'px'; document.body.appendChild(gh); el.classList.add('lift'); A.snd.tap(); }
      if (gh) { gh.style.left = (e.clientX - st.dx) + 'px'; gh.style.top = (e.clientY - st.dy) + 'px'; const [px, py] = toPlate(e.clientX, e.clientY); gh.classList.toggle('over', overPot(px, py)); gh.style.transform = `translate(-50%,-50%) scale(${1.25}) rotate(${overPot(px, py) ? 38 : 0}deg)`; } });
    const end = e => { if (!st) return; const s = st; st = null; el.classList.remove('lift'); if (gh) { const [px, py] = toPlate(e.clientX, e.clientY), ok = overPot(px, py); if (ok) drop(el, px, py); gh.classList.add('back'); const g = gh; gh = null; g.style.transition = 'all .5s cubic-bezier(.3,1.3,.5,1)'; if (!ok) { const r = jarEl.getBoundingClientRect(); g.style.left = (r.left + r.width / 2) + 'px'; g.style.top = (r.top + r.height / 2) + 'px'; g.style.transform = 'translate(-50%,-50%) scale(1)'; } else g.style.opacity = 0; setTimeout(() => g.remove(), 520); } else if (!s.moved) { hint('Возьми банку пальцем и перетащи в котёл'); jarEl.classList.remove('wob'); void jarEl.offsetWidth; jarEl.classList.add('wob'); } };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', () => { st = null; if (gh) { gh.remove(); gh = null; } el.classList.remove('lift'); });
  }
  const overPot = (x, y) => Math.pow((x - POT.x) / (POT.rx + 70), 2) + Math.pow((y - POT.y) / (POT.ry + 150), 2) < 1;
  function drop(el, px, py) {
    const g = INGR.find(i => i.id === el.dataset.id);
    if (ing.includes(g)) { A.toast('Это уже в котле'); return; } if (ing.length >= 3) { A.toast('В котёл помещается три ингредиента'); return; }
    ing.push(g); A.snd.pop(); A.vibrate(15); mix(); for (let i = 0; i < 18; i++) pours.push({ x: POT.x + R(-30, 30), y: POT.y - 160 - R(0, 60), tx: POT.x + R(-50, 50), ty: POT.y + R(-6, 14), t: -i * .02, c: g.c, life: 0 });
    setTimeout(() => { ripples.push({ x: POT.x + R(-30, 30), y: POT.y + 4, r: 6, a: 1 }); for (let i = 0; i < 10; i++) bubbles.push(nb()); A.snd.bubble(); }, 380); hint(status());
  }
  const nb = () => ({ x: POT.x + R(-.8, .8) * POT.rx * .8, y: POT.y + R(-8, 10), r: R(3, 11), v: R(30, 60), ph: R(0, 6.3), life: 0, max: R(.8, 1.8) });

  function frame(now) {
    requestAnimationFrame(frame); if (A.scene.room() !== 'lab') { last = now; return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; hot += ((brewing ? 1 : .35 + .1 * (sel.size + ing.length)) - hot) * dt * 2;
    cx.clearRect(0, 0, CFG.w, CFG.h);
    liq = liq.map((v, i) => v + (liqT[i] - v) * Math.min(1, dt * 2.5)); const col = `rgb(${liq.map(Math.round)})`, rgb = liq.map(Math.round).join(',');
    // fire under the pot
    cx.globalCompositeOperation = 'lighter';
    const fg = cx.createRadialGradient(CFG.fire[0], CFG.fire[1], 0, CFG.fire[0], CFG.fire[1], 330); fg.addColorStop(0, `rgba(255,150,60,${.32 + .12 * Math.sin(t * 9) * hot})`); fg.addColorStop(1, 'rgba(255,100,20,0)'); cx.fillStyle = fg; cx.fillRect(CFG.fire[0] - 440, CFG.fire[1] - 280, 880, 560);
    if (Math.random() < dt * (30 + 50 * hot)) flames.push({ x: CFG.fire[0] + R(-120, 120), y: CFG.fire[1] + 22, vy: -R(60, 150), life: 0, ttl: R(.4, .8), s: R(10, 22) });
    flames = flames.filter(f => { f.life += dt; if (f.life > f.ttl) return false; const k = f.life / f.ttl; f.y += f.vy * dt; f.x += Math.sin(t * 8 + f.s) * 12 * dt; cx.globalAlpha = (1 - k) * .55; const g = cx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.s * (1 - k * .5)); g.addColorStop(0, 'rgba(255,200,90,1)'); g.addColorStop(1, 'rgba(255,90,20,0)'); cx.fillStyle = g; cx.fillRect(f.x - 30, f.y - 40, 60, 80); return true; });
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
    // the liquid
    cx.save(); cx.beginPath(); cx.ellipse(POT.x, POT.y + 6, POT.rx - 4, POT.ry - 2, 0, 0, 6.283); cx.clip();
    const lg = cx.createRadialGradient(POT.x, POT.y, 0, POT.x, POT.y, POT.rx); lg.addColorStop(0, col); lg.addColorStop(1, `rgb(${liq.map(v => Math.round(v * .35))})`); cx.fillStyle = lg; cx.fillRect(POT.x - POT.rx, POT.y - POT.ry, POT.rx * 2, POT.ry * 2 + 20);
    cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = .18 + .12 * Math.sin(t * 2.4) + hot * .12; cx.fillStyle = col; cx.beginPath(); cx.ellipse(POT.x - 40, POT.y - 8, POT.rx * .5, POT.ry * .4, 0, 0, 6.283); cx.fill(); cx.globalAlpha = 1;
    for (let i = ripples.length - 1; i >= 0; i--) { const r = ripples[i]; r.r += dt * 120; r.a -= dt * .9; if (r.a <= 0) { ripples.splice(i, 1); continue; } cx.strokeStyle = `rgba(255,255,255,${r.a * .5})`; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(r.x, r.y, r.r, r.r * .26, 0, 0, 6.283); cx.stroke(); }
    if (Math.random() < dt * (3 + hot * 30)) bubbles.push(nb());
    bubbles = bubbles.filter(b => { b.life += dt; if (b.life > b.max) { if (brewing && Math.random() < .5) A.snd.bubble(); return false; } const k = b.life / b.max; cx.globalAlpha = .6 * (1 - k * .5); cx.strokeStyle = 'rgba(255,255,255,.75)'; cx.lineWidth = 1.6; cx.beginPath(); cx.arc(b.x + Math.sin(t * 3 + b.ph) * 4, b.y - b.v * b.life * .3, b.r * (1 + k * .6), 0, 6.283); cx.stroke(); cx.fillStyle = `rgba(${rgb},.2)`; cx.fill(); return true; });
    cx.restore(); cx.globalAlpha = 1;
    // steam
    if (Math.random() < dt * (5 + hot * 24)) steam.push({ x: POT.x + R(-.7, .7) * POT.rx, y: POT.y - 10, vx: R(-10, 10), vy: -R(30, 70), life: 0, max: R(2.4, 4.4), s: R(36, 64) });
    steam = steam.filter(s => { s.life += dt; if (s.life > s.max) return false; const k = s.life / s.max; s.x += (s.vx + Math.sin(t * 1.3 + s.max) * 14) * dt; s.y += s.vy * dt; const r = s.s * (1 + k * 1.8), g = cx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r); g.addColorStop(0, `rgba(${liq.map(v => Math.round(150 + v * .35)).join(',')},${.2 * (1 - k)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = g; cx.fillRect(s.x - r, s.y - r, r * 2, r * 2); return true; });
    // liquid streams from flasks and jars
    cx.globalCompositeOperation = 'lighter';
    pours = pours.filter(p => { p.t += dt * 1.8; if (p.t < 0) return true; if (p.t > 1) { if (Math.random() < .3) ripples.push({ x: p.tx, y: p.ty, r: 4, a: .7 }); return false; } const k = p.t, x = p.x + (p.tx - p.x) * k, y = p.y + (p.ty - p.y) * k - Math.sin(k * Math.PI) * 120; cx.globalAlpha = .9; const g = cx.createRadialGradient(x, y, 0, x, y, 14); g.addColorStop(0, p.c); g.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = g; cx.fillRect(x - 14, y - 14, 28, 28); return true; });
    sparks = sparks.filter(s => { s.life += dt; if (s.life > s.max) return false; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; cx.globalAlpha = 1 - s.life / s.max; cx.fillStyle = '#ffd98a'; cx.fillRect(s.x, s.y, 3, 3); return true; });
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
  }

  function brew() {
    if (brewing) return; if (!sel.size && !ing.length) { A.toast('Выбери настроение на полке или брось ингредиент в котёл'); A.snd.owl(); return; }
    brewing = true; A.$('#labRes', layer).classList.remove('on'); hint('Зелье варится…'); A.snd.brew(); A.vibrate([20, 30, 20]); layer.classList.add('boil');
    let n = 0; const iv = setInterval(() => { for (let i = 0; i < 10; i++) sparks.push({ x: POT.x + R(-110, 110), y: POT.y, vx: R(-90, 90), vy: -R(160, 360), life: 0, max: R(.6, 1.2) }); for (let i = 0; i < 6; i++) bubbles.push(nb()); A.snd.bubble(); if (++n > 7) clearInterval(iv); }, 380);
    setTimeout(() => { const pick = recommend(); brewing = false; layer.classList.remove('boil'); show(pick); }, 3200);
  }
  function recommend() {
    const want = new Set([...sel]); ing.forEach(i => i.b.forEach(m => want.add(m)));
    const mine = A.state.books.filter(b => b.status === 'want'), have = new Set(A.state.books.map(b => b.title.toLowerCase()));
    const score = b => { const tg = b.tags || b.m || []; let s = 0; tg.forEach(m => { if (sel.has(m)) s += 3; else if (want.has(m)) s += 1; }); return s + Math.random() * .9; };
    const own = mine.map(b => ({ b, s: score(b), own: true })).filter(x => x.s >= 1.5).sort((a, b) => b.s - a.s)[0];
    const cands = A.SUGGEST.filter(x => !have.has(x.t.toLowerCase())).map(x => ({ b: { title: x.t, author: x.a, pages: x.p, tags: x.m }, s: score(x) })).sort((a, b) => b.s - a.s);
    return own || cands[0] || { b: { title: A.SUGGEST[0].t, author: A.SUGGEST[0].a, pages: A.SUGGEST[0].p, tags: A.SUGGEST[0].m }, s: 0 };
  }
  function show(p) {
    const b = p.b, res = A.$('#labRes', layer); A.snd.unlock2(); A.fx.fireflies(innerWidth / 2, innerHeight * .5, 30, 220); A.vibrate(30); hint('');
    const why = [...sel].map(k => A.MOODS[k]).concat(ing.map(i => i.n)).join(' · ');
    res.innerHTML = `<div class="scroll3"><small>на этот вечер</small><div class="scroll3__row">${A.coverHTML(b, 'reco__cover')}<div><h3>${A.esc(b.title)}</h3><p>${A.esc(b.author || '')}</p><em>${why ? 'рецепт: ' + A.esc(why) : ''}</em></div></div>
      <div class="scroll3__btn">${p.own ? `<button class="btn btn--gold" id="rcOpen">Открыть</button>` : `<button class="btn btn--gold" id="rcAdd">В «Хочу»</button>`}<button class="btn btn--ghost" id="rcAgain">Ещё раз</button></div></div>`;
    res.classList.add('on'); [...res.querySelectorAll('button')].forEach(x => x.addEventListener('pointerdown', e => e.stopPropagation()));
    A.$('#rcAgain', res).addEventListener('click', () => { A.snd.tap(); res.classList.remove('on'); sel.clear(); ing = []; A.$$('.flask3', layer).forEach(x => x.classList.remove('on')); mix(); hint('Выбери настроение на полке'); });
    const add = A.$('#rcAdd', res), open = A.$('#rcOpen', res);
    add && add.addEventListener('click', () => { A.state.books.push({ id: A.uid(), title: b.title, author: b.author, pages: b.pages || 300, read: 0, status: 'want', rating: 0, tags: [...(b.tags || [])], impression: '', added: Date.now(), cover: {} }); A.save(); A.mods.books && A.mods.books.refresh(); A.snd.coin(); A.fx.stars(innerWidth / 2, innerHeight * .6, 24); A.toast('Книга ждёт тебя на полке'); add.disabled = true; add.textContent = 'Добавлено'; });
    open && open.addEventListener('click', () => { A.snd.page(); const bk = A.state.books.find(x => x.title === b.title); A.go('books'); setTimeout(() => { if (bk) bk.hasText ? A.reader.open(bk, null) : A.mods.books.openBook(bk.id); }, 1700); });
  }
})();
