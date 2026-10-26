/* ============================================================ the alchemy room, built from stills of the user's own film: the cauldron and the table.
   pick up to three moods from the shelf: each vial flies to the cauldron and pours in, the brew changes colour (the scene is cross-faded between pre-coloured plates);
   brew: the camera pushes in, her hand dips an empty vial, lifts it glowing, the scene whips over to the table and the vial is set down among the bottles with the book's name on a tag. */
A.mods.potion = (() => {
  const W = 720, H = 1280;
  const MOODS = ['cozy', 'fantasy', 'detective', 'romance', 'melancholy', 'adventure'];
  const RGB = { cozy: [255, 176, 70], fantasy: [165, 110, 255], detective: [70, 205, 220], romance: [255, 100, 165], melancholy: [100, 140, 255], adventure: [80, 230, 125], green: [70, 235, 110] };
  const LIQ = { cx: 360, cy: 772, rx: 255, ry: 58 };
  const CANDLES = { c: [[22, 458, 1], [66, 520, .8], [657, 505, 1], [703, 522, .9], [710, 822, 1], [37, 1152, 1.2]], t: [[160, 598, 1.1], [612, 600, 1.2], [5, 682, 1.2], [122, 418, .8], [55, 470, .8], [660, 238, .7]] };
  const VIAL_BASE = [368, 886], ANCHOR = { portrait: { c: .55, t: .52 }, landscape: { c: .56, t: .62 } };
  const sleep = ms => new Promise(r => setTimeout(r, ms)), eio = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, eo = k => 1 - Math.pow(1 - k, 3), lerp = (a, b, k) => a + (b - a) * k, R = (a, b) => a + Math.random() * (b - a);
  let el, sc = {}, fx, g, built = false, shown = false, sel = [], mode = 'pick', scene = 'c', heat = .35, T = 0, last = 0, raf = 0, token = 0, vialId = 0, G = { c: null, t: null }, zoom = { z: 1, fx: 0, fy: 0 }, cam = { z: 1, t: 1 };
  let bubbles = [], motes = [], mist = [], drops = [], ripples = [], steam = [], table = null, mixRgb = RGB.green.slice(), spriteCache = {};

  /* ---------------------------------------------------------------- the glass vial (tall, like the bottle in the film) */
  function vialSVG(rgb, id) {
    id = id || 'v' + (++vialId); const [r, g_, b] = rgb, lt = `rgb(${Math.min(255, r + 42)},${Math.min(255, g_ + 42)},${Math.min(255, b + 42)})`, dk = `rgb(${r * .32 | 0},${g_ * .32 | 0},${b * .32 | 0})`;
    const body = 'M34 44 L34 84 C20 96 8 108 8 132 L8 318 Q8 336 26 336 L74 336 Q92 336 92 318 L92 132 C92 108 80 96 66 84 L66 44 Z';
    return `<svg viewBox="0 0 100 340" aria-hidden="true"><defs><linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".2" stop-color="#dff6f0" stop-opacity=".12"/><stop offset=".75" stop-color="#a8d4cc" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".38"/></linearGradient>
      <radialGradient id="${id}l" cx=".35" cy=".25" r="1"><stop offset="0" stop-color="${lt}"/><stop offset=".5" stop-color="rgb(${r},${g_},${b})"/><stop offset="1" stop-color="${dk}"/></radialGradient>
      <linearGradient id="${id}k" x1="0" x2="1"><stop offset="0" stop-color="#7a4d24"/><stop offset=".5" stop-color="#c58c4e"/><stop offset="1" stop-color="#63391b"/></linearGradient><clipPath id="${id}c"><path d="${body}"/></clipPath></defs>
      <g clip-path="url(#${id}c)"><g class="pv__liq"><rect x="0" y="340" width="100" height="300" fill="url(#${id}l)"/><ellipse cx="50" cy="340" rx="42" ry="4" fill="${lt}" opacity=".9"/><circle cx="30" cy="420" r="4" fill="#fff" opacity=".3"/><circle cx="66" cy="470" r="3" fill="#fff" opacity=".28"/><circle cx="46" cy="530" r="5" fill="#fff" opacity=".22"/></g></g>
      <path d="${body}" fill="url(#${id}g)" stroke="rgba(235,255,250,.62)" stroke-width="1.6"/><path d="M20 130 C17 190 17 250 24 305" stroke="rgba(255,255,255,.55)" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M82 140 C85 190 85 250 80 300" stroke="rgba(255,255,255,.22)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <rect x="22" y="188" width="56" height="74" rx="3" fill="rgba(240,224,176,.88)"/><path d="M50 204 l5 11 12 1-9 8 3 12-11-7-11 7 3-12-9-8 12-1z" fill="none" stroke="#7a5420" stroke-width="1.4"/><path d="M30 246 H70" stroke="#7a5420" stroke-width="1"/>
      <rect x="31" y="50" width="38" height="9" rx="2" fill="#8a1c24"/><rect x="29" y="6" width="42" height="46" rx="5" fill="url(#${id}k)"/><path d="M31 18 H69 M31 28 H69 M31 38 H69" stroke="rgba(60,30,10,.35)" stroke-width="1"/></svg>`;
  }
  const vivid = c => { const mn = Math.min(...c) * .85, mx = Math.max(...c); return mx - mn < 1 ? c : c.map(v => Math.round(A.clamp((v - mn) / (mx - mn) * 255, 0, 255))); };   // an average of moods is pastel: pull it back to a rich liquid colour
const mkVial = (lv, lit, rgb) => { const c = rgb || vivid(mixRgb); return A.h(`<div class="pv ${lit ? 'pv--lit' : ''}" style="--lv:${lv};--lc:${c.join(',')}">${vialSVG(c)}</div>`); };

  /* ---------------------------------------------------------------- the stage */
  function build() {
    if (built) return; built = true; const ori = A.scene.ori();
    el = A.h(`<div id="pz" class="pz" hidden><div class="pz__sc" id="pzC">${['green', ...MOODS].map(m => `<img data-m="${m}" src="img/lab-c-${m}.webp" alt="" draggable="false">`).join('')}</div><div class="pz__sc" id="pzT">${['green', ...MOODS].map(m => `<img data-m="${m}" src="img/lab-t-${m}.webp" alt="" draggable="false">`).join('')}</div>
      <canvas class="pz__fx" id="pzFx"></canvas><div class="pz__cover" id="pzCover"></div>
      <h2 class="pz__title" id="pzTitle">алхимия</h2><p class="pz__hint" id="pzHint"></p>
      <div class="pz__tray" id="pzTray">${MOODS.map(k => `<button class="pzv" data-k="${k}" aria-label="${A.MOODS[k]}"><span class="pzv__g" style="--c:${RGB[k].join(',')}">${vialSVG(RGB[k], 'tr' + k)}</span><b>${A.MOODS[k]}</b></button>`).join('')}</div>
      <button class="seal pz__go" id="pzGo">Сварить зелье</button><div class="pz__tag" id="pzTag"></div><div class="pz__btns" id="pzBtns"></div></div>`);
    document.body.appendChild(el); sc.c = A.$('#pzC', el); sc.t = A.$('#pzT', el); fx = A.$('#pzFx', el); g = fx.getContext('2d');
    A.$$('.pzv', el).forEach(b => { b.addEventListener('pointerdown', e => e.stopPropagation()); b.addEventListener('click', () => pick(b.dataset.k, b)); });
    A.$('#pzGo', el).addEventListener('click', () => brew()); el.addEventListener('pointerdown', e => { if (mode === 'pick' && scene === 'c') { const p = toPlate('c', e.clientX, e.clientY); if (Math.hypot((p[0] - LIQ.cx) / (LIQ.rx * 1.1), (p[1] - LIQ.cy) / (LIQ.ry * 3)) < 1) brew(); } });
    addEventListener('resize', () => { if (shown) layout(); });
  }
  function layout() {
    const vw = innerWidth, vh = innerHeight, ori = vw > vh ? 'landscape' : 'portrait', s = Math.max(vw / W, vh / H); fx.width = vw; fx.height = vh;
    ['c', 't'].forEach(k => { const hh = vh / (2 * s), cy = A.clamp(ANCHOR[ori][k] * H, hh, H - hh); G[k] = { s, ox: vw / 2 - W / 2 * s, oy: vh / 2 - cy * s }; }); applyScene();
  }
  const camZ = () => cam.z;
  function applyScene() {
    ['c', 't'].forEach(k => { const q = G[k]; if (!q) return; const z = scene === k ? cam.z : 1, fx_ = innerWidth / 2, fy_ = innerHeight * .55, ox = fx_ - (fx_ - q.ox) * z, oy = fy_ - (fy_ - q.oy) * z; sc[k].style.transform = `translate3d(${ox.toFixed(1)}px,${oy.toFixed(1)}px,0) scale(${(q.s * z).toFixed(4)})`; q.zx = ox; q.zy = oy; q.zs = q.s * z; });
  }
  const P = (k, x, y) => { const q = G[k]; return [q.zx + x * q.zs, q.zy + y * q.zs]; };
  const toPlate = (k, sx, sy) => { const q = G[k]; return [(sx - q.zx) / q.zs, (sy - q.zy) / q.zs]; };

  function mixOf() { if (!sel.length) return RGB.green.slice(); const m = [0, 0, 0]; sel.forEach(k => RGB[k].forEach((v, i) => m[i] += v / sel.length)); return m; }
  function setMix() {
    mixRgb = mixOf(); spriteCache = {};
    ['c', 't'].forEach(k => { const imgs = A.$$('img', sc[k]), order = sel.length ? sel : ['green']; imgs.forEach(im => { const i = order.indexOf(im.dataset.m); im.style.opacity = i < 0 ? 0 : (1 / (i + 1)).toFixed(3); im.style.zIndex = i < 0 ? 0 : i + 1; }); });
    A.$$('.pzv', el).forEach(b => b.classList.toggle('on', sel.includes(b.dataset.k))); A.$('#pzGo', el).classList.toggle('on', sel.length > 0 && mode === 'pick');
    hint(sel.length ? (sel.length < 3 ? 'Добавь ещё или вари' : 'Три настроения: пора варить') : 'Выбери настроения: склянки сами польются в котёл');
  }
  const hint = s => { const h = A.$('#pzHint', el); h.classList.remove('on'); void h.offsetWidth; h.textContent = s; if (s) h.classList.add('on'); };

  /* ---------------------------------------------------------------- picking: a vial flies from the shelf and pours into the cauldron */
  function pick(k, btn) {
    if (mode !== 'pick' || scene !== 'c') return; A.vibrate(10);
    if (sel.includes(k)) { sel = sel.filter(x => x !== k); A.snd.tap(); setMix(); return; }
    if (sel.length >= 3) { const f = sel.shift(); } sel.push(k); A.snd.bubble();
    const r = btn.querySelector('.pzv__g').getBoundingClientRect(), [mx, my] = P('c', LIQ.cx - 40, LIQ.cy), vW = 38, vH = vW * 3.4, fly = mkVial(210, false, RGB[k]); fly.style.cssText += `;position:fixed;left:0;top:0;width:${vW}px;height:${vH}px;z-index:24;pointer-events:none;transform-origin:50% 40%`; A.$('svg', fly).setAttribute('width', vW); A.$('svg', fly).setAttribute('height', vH); el.appendChild(fly);
    const x0 = r.left + r.width / 2 - vW / 2, y0 = r.top + r.height / 2 - vH / 2, x1 = mx - vW / 2 + 40, y1 = my - vH - 30; const t0 = performance.now(), D = 760; let poured = false;
    const step = now => { const t = (now - t0) / D, k_ = A.clamp(t, 0, 1), e = eio(k_), x = lerp(x0, x1, e), y = lerp(y0, y1, e) - Math.sin(e * Math.PI) * 80, rot = -108 * Math.pow(k_, 2.2);
      fly.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rot}deg)`; fly.style.setProperty('--lv', (210 * (1 - Math.max(0, (k_ - .72) / .28))).toFixed(1));
      if (k_ > .74 && !poured) { poured = true; pourFrom(() => { const q = fly.getBoundingClientRect(); return [q.left + q.width * .2, q.top + q.height * .08]; }, RGB[k], 650); setTimeout(() => { setMix(); heat = Math.min(1, heat + .18); for (let i = 0; i < 24; i++) bubbles.push(newBubble(1)); ripple(); A.snd.bubble(); }, 380); }
      if (k_ < 1 || now - t0 < D + 700) { if (now - t0 > D + 560) fly.style.opacity = Math.max(0, 1 - (now - t0 - D - 560) / 140); requestAnimationFrame(step); } else fly.remove(); };
    requestAnimationFrame(step);
  }
  function pourFrom(fn, rgb, ms) { const t0 = performance.now(); const iv = setInterval(() => { const dt = performance.now() - t0; if (dt > ms) return clearInterval(iv); const [x, y] = fn(), [lx, ly] = P(scene, LIQ.cx - 30, LIQ.cy); for (let i = 0; i < 3; i++) drops.push({ x: x + R(-2, 2), y, vx: (lx - x) * .5 + R(-14, 14), vy: R(60, 150), life: 0, max: R(.5, .8), rgb, ly }); }, 30); }
  const ripple = () => { for (let i = 0; i < 3; i++) setTimeout(() => ripples.push({ x: LIQ.cx + R(-90, 40), y: LIQ.cy + R(-14, 14), r: 8, a: .8 }), i * 130); };

  /* ---------------------------------------------------------------- brewing, the film */
  async function brew() {
    if (mode !== 'pick' || scene !== 'c') return; if (!sel.length) { A.toast('Выбери настроение: коснись склянки на полке'); A.snd.owl && A.snd.owl(); A.vibrate(20); return; }
    const my = ++token; mode = 'brew'; el.classList.add('brewing'); hint('Зелье варится…'); A.snd.unlock && A.snd.unlock(); A.snd.brew && A.snd.brew(); A.vibrate([20, 30, 20]); cam.t = 1.1; heat = 1;
    const ori = innerWidth > innerHeight ? 'landscape' : 'portrait', vH = ori === 'portrait' ? A.clamp(innerHeight * .3, 150, 280) : A.clamp(innerHeight * .46, 120, 200), vW = vH * .295, ox = vW * .95, oy = vH * .6;
    const vial = mkVial(0, false); vial.style.cssText += `;width:${vW}px;height:${vH}px;transform-origin:${ox}px ${oy}px`; A.$('svg', vial).setAttribute('width', vW); A.$('svg', vial).setAttribute('height', vH);
    A.hands.show(true, true); A.$('#hands').classList.add('top'); const t0 = performance.now(); let dipped = false, whipped = false, placed = false;
    const geoC = () => { const [lx, ly] = P('c', LIQ.cx - 70, LIQ.cy), s = G.c.zs; return { above: [lx, ly - vH * .72], dip: [lx, ly - vH * .05 + 6 * s], surf: ly + 10 * s, top: [lx + vW * .3, -vH * .6] }; };
    const geoT = () => { const [bx, by] = P('t', VIAL_BASE[0], VIAL_BASE[1]); return { onT: [bx + vW * .45, by - vH * .4], aboveT: [bx + vW * .45, by - vH * .4 - vH * .55] }; };
    const path = t => { let x, y, r = 0, lv = 0, lit = false, clip = 0;
      const C = geoC(); const Tt = G.t && scene === 't' ? geoT() : null;
      if (t < 1000) { const k = eo(t / 1000); x = lerp(innerWidth + 90, C.above[0], k); y = lerp(innerHeight * .98, C.above[1], k); r = lerp(6, -6, k); }
      else if (t < 1700) { const k = eio((t - 1000) / 700); x = C.above[0]; y = lerp(C.above[1], C.dip[1], k); r = lerp(-6, -16, k); }
      else if (t < 3100) { x = C.dip[0]; y = C.dip[1] + Math.sin((t - 1700) / 140) * 2.5; r = -16; lv = A.clamp((t - 1850) / 1100, 0, 1); }
      else if (t < 3900) { const k = eio((t - 3100) / 800); x = C.dip[0]; y = lerp(C.dip[1], C.above[1] - vH * .15, k); r = lerp(-16, -4, k); lv = 1; lit = true; }
      else if (t < 4700) { const k = eio((t - 3900) / 800); x = lerp(C.above[0], C.top[0], k); y = lerp(C.above[1] - vH * .15, C.top[1], k); r = lerp(-4, 4, k); lv = 1; lit = true; }
      else { const T2 = Tt || geoT(), k = eio(A.clamp((t - 4900) / 1500, 0, 1)); x = lerp(T2.aboveT[0] + vW * .3, T2.onT[0], k); y = lerp(-vH * .6, T2.onT[1], k); r = lerp(4, 0, k); lv = 1; lit = true; }
      const bottom = y - oy + vH, inLiquid = t > 1150 && t < 3300; clip = inLiquid ? Math.max(0, bottom - C.surf) : 0;
      return { x, y, r, lv, lit, clip, prop: { x: x - ox, y: y - oy, r, s: 1 } }; };
    A.hands.carry('R', () => { const t = performance.now() - t0, c = path(t); vial.style.setProperty('--lv', (c.lv * 220).toFixed(1)); vial.classList.toggle('pv--lit', c.lit);
      if (!dipped && t > 1450) { dipped = true; ripple(); A.snd.bubble(); for (let i = 0; i < 30; i++) bubbles.push(newBubble(1.6)); }
      return { x: c.x, y: c.y, r: c.r, s: 1, prop: c.prop, clip: c.clip ? `inset(0 0 ${c.clip}px 0)` : 'none', snap: t < 40 }; }, vial);
    await sleep(1500); if (my !== token) return; for (let i = 0; i < 40; i++) bubbles.push(newBubble(1.5)); heat = 1.2; A.snd.bubble();
    await sleep(1500); if (my !== token) return; A.snd.unlock2 && A.snd.unlock2();
    await sleep(1300); if (my !== token) return; whip('t'); A.snd.whoosh && A.snd.whoosh(1);
    await sleep(1900); if (my !== token) return;
    const pk = recommend(); A.hands.uncarry(); A.hands.show(false); setTimeout(() => A.$('#hands').classList.remove('top'), 900); setTable(pk, vW, vH); mode = 'result'; el.classList.remove('brewing'); el.classList.add('result');
  }
  /* the cut of the film: the cauldron slides up and blurs away, the table rises in */
  function whip(to) {
    const from = scene; if (from === to) return; const a = sc[from], b = sc[to]; scene = to; cam.z = cam.t = 1; applyScene(); heat = to === 'c' ? .4 : .3;
    b.style.transition = 'none'; b.style.opacity = 0; b.classList.add('pz__in'); void b.offsetWidth; b.style.transition = ''; a.classList.add('pz__out'); b.style.opacity = 1; b.classList.remove('pz__in');
    A.$('#pzCover', el).animate([{ opacity: 0 }, { opacity: .55, offset: .4 }, { opacity: 0 }], { duration: 900, easing: 'ease-in-out' });
    setTimeout(() => { a.classList.remove('pz__out'); a.style.opacity = 0; }, 900); if (to === 'c') a.style.opacity = 0;
  }
  function setTable(p, vW, vH) {
    const b = p.b, vial = mkVial(220, true); vial.classList.add('pv--table'); vial.style.cssText += `;position:absolute;left:0;top:0;width:${vW}px;height:${vH}px`; A.$('svg', vial).setAttribute('width', vW); A.$('svg', vial).setAttribute('height', vH); el.appendChild(vial);
    table = { vial, vW, vH, p }; const tag = A.$('#pzTag', el); tag.innerHTML = `<i></i><b>${A.esc(b.title)}</b><small>${A.esc(b.author || '')}</small><em>${sel.map(k => A.MOODS[k]).join(' · ')}</em>`; tag.classList.add('on');
    vial.animate([{ filter: 'brightness(2.4)', transform: vial.style.transform }, { filter: 'none', transform: vial.style.transform }], { duration: 900 }); A.snd.chime && A.snd.chime([523.25, 659.25, 783.99, 1046.5], .1, .8); A.vibrate(24);
    const bt = A.$('#pzBtns', el); bt.innerHTML = `${p.own ? `<button class="seal" id="rcOpen">Открыть книгу</button>` : `<button class="seal" id="rcAdd">В «Хочу»</button>`}<button class="seal seal--ghost" id="rcAgain">Ещё раз</button>`; bt.classList.add('on'); A.$$('button', bt).forEach(x => x.addEventListener('pointerdown', e => e.stopPropagation()));
    A.$('#rcAgain', bt).addEventListener('click', again);
    const add = A.$('#rcAdd', bt), open = A.$('#rcOpen', bt);
    add && add.addEventListener('click', () => { A.state.books.push({ id: A.uid(), title: b.title, author: b.author, pages: b.pages || 300, read: 0, status: 'want', rating: 0, tags: [...(b.tags || [])], impression: '', added: Date.now(), cover: {} }); A.save(); A.mods.books && A.mods.books.refresh(); A.snd.coin(); A.fx.stars(innerWidth / 2, innerHeight * .6, 30); add.textContent = 'Добавлено ✓'; add.disabled = true; });
    open && open.addEventListener('click', () => { const bk = b.id ? b : A.state.books.find(x => x.title === b.title); A.snd.page(); A.go('books'); setTimeout(() => { if (bk && bk.hasText) A.reader.open(bk, null); else if (bk) A.mods.books.openBook(bk.id); }, 1800); });
  }
  function again() { A.snd.tap(); const my = ++token; el.classList.remove('result'); clearResult(); whip('c'); sel = []; mode = 'pick'; setMix(); }
  function clearResult() { if (table) { table.vial.remove(); table = null; } A.$('#pzTag', el).classList.remove('on'); A.$('#pzBtns', el).classList.remove('on'); steam.length = 0; }
  function recommend() {
    const mine = A.state.books.filter(b => b.status === 'want'), have = new Set(A.state.books.map(b => b.title.toLowerCase())), has = m => sel.includes(m);
    const score = b => { const tg = b.tags || b.m || []; let s = 0; tg.forEach(m => { if (has(m)) s += 3; }); return s + Math.random() * .9; };
    const own = mine.map(b => ({ b, s: score(b), own: true })).filter(x => x.s >= 1.5).sort((a, b) => b.s - a.s)[0];
    const cands = A.SUGGEST.filter(x => !have.has(x.t.toLowerCase())).map(x => ({ b: { title: x.t, author: x.a, pages: x.p, tags: x.m }, s: score(x) })).sort((a, b) => b.s - a.s);
    return own || cands[0] || { b: { title: A.SUGGEST[0].t, author: A.SUGGEST[0].a, pages: A.SUGGEST[0].p, tags: A.SUGGEST[0].m }, s: 0 };
  }

  /* ---------------------------------------------------------------- the living layer: bubbles, floating spheres, mist, candle light, glow */
  const blob = (rgb, soft) => { const key = rgb.join() + soft; if (spriteCache[key]) return spriteCache[key]; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); for (let i = 0; i < (soft ? 1 : 7); i++) { const px = 64 + (soft ? 0 : R(-24, 24)), py = 64 + (soft ? 0 : R(-24, 24)), r = soft ? 64 : R(22, 40), gr = x.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, `rgba(${rgb.map(v => Math.min(255, v + 40)).join(',')},${soft ? .9 : .32})`); gr.addColorStop(1, `rgba(${rgb.join(',')},0)`); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); } return spriteCache[key] = c; };
  const newBubble = (k = 1) => ({ x: LIQ.cx + R(-1, 1) * LIQ.rx * .92, y: LIQ.cy + R(-1, 1) * LIQ.ry * .8, r: R(2, 5) * k, max: R(.5, 1.3), life: 0 });
  function frame(now) {
    raf = requestAnimationFrame(frame); if (!shown || document.hidden) { last = now; return; } const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
    cam.z += (cam.t - cam.z) * Math.min(1, dt * 1.6); if (Math.abs(cam.t - cam.z) > .0005 || scene === 'c') applyScene(); g.clearRect(0, 0, fx.width, fx.height); if (!G.c) return;
    const rgb = mixRgb.map(Math.round), light = scene === 'c' ? drawCauldron(dt, rgb) : drawTable(dt, rgb); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }
  function candles(k) { g.globalCompositeOperation = 'lighter'; CANDLES[k].forEach(([x, y, s], i) => { const f = .78 + .16 * Math.sin(T * (6 + i * 1.7) + i) + .08 * Math.sin(T * (13 + i)), [sx, sy] = P(k, x, y), R_ = 70 * s * G[k].zs * (1.7 + .15 * Math.sin(T * 9 + i)); const gr = g.createRadialGradient(sx, sy, 0, sx, sy, R_); gr.addColorStop(0, `rgba(255,190,100,${(.32 * f).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gr; g.fillRect(sx - R_, sy - R_, R_ * 2, R_ * 2); }); }
  function drawCauldron(dt, rgb) {
    const zs = G.c.zs; heat += ((mode === 'brew' ? 1.1 : .4 + .15 * sel.length) - heat) * dt * 1.5; candles('c');
    // glow over the brew
    const [lx, ly] = P('c', LIQ.cx, LIQ.cy - 40), gr = g.createRadialGradient(lx, ly, 0, lx, ly, 420 * zs); const f = .88 + .1 * Math.sin(T * 2.4); gr.addColorStop(0, `rgba(${rgb},${((.07 + .1 * heat) * f).toFixed(3)})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, fx.width, fx.height); g.globalCompositeOperation = 'source-over';
    // mist rises from the brew in soft sprites
    if (Math.random() < dt * (5 + heat * 9)) mist.push({ x: LIQ.cx + R(-120, 140), y: LIQ.cy - 20, vx: R(-8, 14), vy: -R(30, 70), life: 0, max: R(3, 5.4), s: R(70, 120) });
    mist = mist.filter(m => { m.life += dt; if (m.life > m.max) return false; const k = m.life / m.max; m.x += (m.vx + Math.sin(T * .9 + m.max * 3) * 12) * dt; m.y += m.vy * dt; const [sx, sy] = P('c', m.x, m.y), r = m.s * (1 + k * 1.6) * zs; g.globalAlpha = Math.min(1, k * 5) * (1 - k) * (.24 + .08 * heat); g.drawImage(blob(rgb, false), sx - r, sy - r, r * 2, r * 2); return true; });
    // spheres floating in the mist, like in the film
    if (Math.random() < dt * (4 + heat * 12)) motes.push({ x: LIQ.cx + R(-70, 120), y: LIQ.cy - R(20, 90), vx: R(-10, 10), vy: -R(26, 60), life: 0, max: R(2.4, 4.8), r: R(2, 6), ph: R(0, 6.3) });
    g.globalAlpha = 1; motes = motes.filter(m => { m.life += dt; if (m.life > m.max) return false; const k = m.life / m.max; m.x += (m.vx + Math.sin(T * 1.4 + m.ph) * 14) * dt; m.y += m.vy * dt; const [sx, sy] = P('c', m.x, m.y), r = m.r * zs * (1 + k * .3), a = Math.min(1, k * 6) * (1 - k); g.globalAlpha = a * .85; g.strokeStyle = `rgba(${rgb.map(v => Math.min(255, v + 70)).join(',')},1)`; g.lineWidth = 1.2; g.beginPath(); g.arc(sx, sy, r, 0, 6.283); g.stroke(); g.globalAlpha = a * .22; g.fillStyle = `rgb(${rgb})`; g.fill(); g.globalAlpha = a; g.fillStyle = '#fff'; g.beginPath(); g.arc(sx - r * .3, sy - r * .3, Math.max(.7, r * .22), 0, 6.283); g.fill(); return true; });
    // bubbles in the liquid
    if (Math.random() < dt * (7 + heat * 40)) bubbles.push(newBubble(1)); g.globalAlpha = 1;
    bubbles = bubbles.filter(b => { b.life += dt; if (b.life > b.max) { if (mode === 'brew' && Math.random() < .12) A.snd.bubble && A.snd.bubble(); const [sx, sy] = P('c', b.x, b.y); ripples.push({ x: b.x, y: b.y, r: b.r * 2, a: .5, small: 1 }); return false; } const k = b.life / b.max, [sx, sy] = P('c', b.x, b.y - k * 12), r = b.r * (.6 + k * .8) * zs; g.globalAlpha = .7 * (1 - k * .4); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(sx, sy, r, r * .7, 0, 0, 6.283); g.stroke(); g.globalAlpha = .18; g.fillStyle = `rgb(${rgb.map(v => Math.min(255, v + 90))})`; g.fill(); g.globalAlpha = .9; g.fillStyle = '#fff'; g.beginPath(); g.arc(sx - r * .3, sy - r * .3, Math.max(.6, r * .2), 0, 6.283); g.fill(); return true; });
    ripples = ripples.filter(r => { r.r += dt * (r.small ? 30 : 120); r.a -= dt * (r.small ? 1.2 : .9); if (r.a <= 0) return false; const [sx, sy] = P('c', r.x, r.y); g.globalAlpha = r.a * .6; g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(sx, sy, r.r * zs, r.r * zs * .26, 0, 0, 6.283); g.stroke(); return true; });
    g.globalAlpha = 1; drops = drops.filter(d => { d.life += dt; if (d.life > d.max) { if (Math.random() < .3) ripples.push({ x: LIQ.cx - 30 + R(-30, 30), y: LIQ.cy, r: 4, a: .6 }); return false; } d.vy += 620 * dt; d.x += d.vx * dt; d.y += d.vy * dt; if (d.y > d.ly) { d.life = d.max; } g.globalCompositeOperation = 'lighter'; g.globalAlpha = .9; g.fillStyle = `rgb(${d.rgb.map(v => Math.min(255, v + 60))})`; g.beginPath(); g.arc(d.x, d.y, 2.2, 0, 6.283); g.fill(); g.globalCompositeOperation = 'source-over'; return true; });
  }
  function drawTable(dt, rgb) {
    candles('t'); const zs = G.t.zs, [bx, by] = P('t', VIAL_BASE[0], VIAL_BASE[1]);
    if (table) { const { vial, vW, vH } = table; vial.style.transform = `translate3d(${(bx - vW * .5).toFixed(1)}px,${(by - vH + 6).toFixed(1)}px,0)`; const tg = A.$('#pzTag', el), tl = bx + vW * .5 + 6, tw = Math.max(104, Math.min(vH * .8, innerWidth - tl - 12)); tg.style.cssText = `left:${tl.toFixed(0)}px;top:${(by - vH * .78).toFixed(0)}px;width:${tw.toFixed(0)}px;--tw:${tw.toFixed(0)}px`;
      const gr = g.createRadialGradient(bx, by - vH * .45, 0, bx, by - vH * .45, vH * 1.25), f = .9 + .1 * Math.sin(T * 2.6); g.globalCompositeOperation = 'lighter'; gr.addColorStop(0, `rgba(${rgb},${(.34 * f).toFixed(3)})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(bx - vH * 1.4, by - vH * 1.8, vH * 2.8, vH * 2.4);
      const sg = g.createRadialGradient(bx, by, 0, bx, by, vH * .8); sg.addColorStop(0, `rgba(${rgb},${(.3 * f).toFixed(3)})`); sg.addColorStop(1, `rgba(${rgb},0)`); g.save(); g.translate(bx, by); g.scale(1, .22); g.translate(-bx, -by); g.fillStyle = sg; g.fillRect(bx - vH, by - vH, vH * 2, vH * 2); g.restore();
      if (Math.random() < dt * 11) steam.push({ x: bx + R(-3, 3), y: by - vH + 4, vx: R(-6, 6), vy: -R(22, 44), life: 0, max: R(2.8, 4.6), s: R(10, 18) }); }
    g.globalCompositeOperation = 'source-over'; steam = steam.filter(q => { q.life += dt; if (q.life > q.max) return false; const k = q.life / q.max; q.x += (q.vx + Math.sin(q.life * 2 + q.max) * 16) * dt; q.y += q.vy * dt; const r = q.s * (1 + k * 4.4) * Math.max(.6, zs); g.globalAlpha = Math.min(1, k * 6) * (1 - k) * .34; g.drawImage(blob(rgb.map(v => Math.min(255, v + 40)), true), q.x - r, q.y - r, r * 2, r * 2); return true; });
  }

  return {
    init() { build(); }, beforeShow() {}, refresh() {},
    rebuild() { if (shown) layout(); },
    show() {
      build(); shown = true; el.hidden = false; layout(); token++; mode = 'pick'; scene = 'c'; cam.z = cam.t = 1; sel = []; el.classList.remove('result', 'brewing'); clearResult(); sc.c.style.opacity = 1; sc.t.style.opacity = 0; sc.c.className = 'pz__sc'; sc.t.className = 'pz__sc'; setMix(); A.scene.freeze(true); A.$('#pzGo', el).classList.remove('on');
      void el.offsetWidth; el.classList.add('on'); bubbles.length = mist.length = motes.length = drops.length = 0; for (let i = 0; i < 16; i++) mist.push({ x: LIQ.cx + R(-120, 140), y: LIQ.cy - R(20, 300), vx: R(-8, 14), vy: -R(30, 70), life: R(0, 2), max: R(3, 5.4), s: R(70, 120) });
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    },
    hide() { token++; shown = false; mode = 'pick'; A.hands.uncarry && A.hands.uncarry(); A.hands.show(false); const hd = A.$('#hands'); hd && hd.classList.remove('top'); if (!el) return; el.classList.remove('on', 'brewing', 'result'); setTimeout(() => { if (!shown) el.hidden = true; }, 700); A.scene.freeze(false); clearResult(); if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  };
})();
