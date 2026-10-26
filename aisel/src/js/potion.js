/* ============================================================ alchemy lab: the bottles on the shelf and bench are the controls.
   touch a bottle: it glows, a stream of its colour arcs into the cauldron; touch the cauldron to brew */
(() => {
  const FL = { cozy: '#f0b25a', fantasy: '#9b7bff', detective: '#5aa6b0', romance: '#e86a8f', melancholy: '#5f86d6', adventure: '#58c28a' };
  let motes = [], layer, cv, cx, sel = new Set(), brewing = false, bubbles = [], steam = [], sparks = [], pours = [], ripples = [], liq = [40, 90, 82], liqT = [40, 90, 82], t = 0, last = 0, run = false, built = false, lastOri = '', hot = 0, LAB = null, L = null;
  const R = (a, b) => a + Math.random() * (b - a), hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const inP = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };

  A.mods.potion = {
    init() { build(); }, beforeShow() {}, rebuild() { built = false; if (A.scene.room() === 'lab') build(); },
    show() { build(); if (!run) { run = true; last = performance.now(); requestAnimationFrame(frame); } hint('Коснись склянки, чтобы влить её в котёл'); },
    hide() { filmT++; brewing = false; brewFx = 0; A.hands.uncarry && A.hands.uncarry(); A.hands.show(false); const hd = A.$('#hands'); hd && hd.classList.remove('top'); clearTable(); if (scr) scr.classList.remove('on'); layer && layer.classList.remove('boil'); A.$$('.mood3', layer || document).forEach(x => x.style.pointerEvents = ''); },
    light: () => ({ x: LAB ? LAB.pour[0] : 0, y: LAB ? LAB.pour[1] : 0, rgb: liq.map(Math.round), k: Math.min(1, .25 + hot * .75) })
  };
  const hint = s => { const h = A.$('#labHint', layer); if (!h) return; h.classList.remove('on'); void h.offsetWidth; h.textContent = s; h.classList.add('on'); clearTimeout(hint._t); hint._t = setTimeout(() => h.classList.remove('on'), 4200); };
  function build() {
    const ori = A.scene.ori(); if (built && lastOri === ori) return; built = true; lastOri = ori; L = A.scene.layout(); LAB = L.lab; layer = A.$('#labLayer');
    layer.innerHTML = `<canvas id="labCv" width="${L.room[0]}" height="${L.room[1]}"></canvas><div class="lab__t"><small>алхимическая лаборатория</small></div><div class="lab__hint" id="labHint"></div><div class="lab__res" id="labRes"></div>
      ${Object.entries(LAB.bottles).map(([k, [x, y]]) => `<button class="mood3 ${sel.has(k) ? 'on' : ''}" data-k="${k}" style="--c:${FL[k]};left:${x}px;top:${y}px"><i></i><span>${A.MOODS[k]}</span></button>`).join('')}
      <button class="lab__pot" aria-label="Котёл" style="left:${LAB.cauldron[0][0]}px;top:${LAB.cauldron[0][1]}px;width:${LAB.cauldron[1][0] - LAB.cauldron[0][0]}px;height:${LAB.cauldron[2][1] - LAB.cauldron[0][1]}px"></button>`;
    cv = A.$('#labCv'); cv.style.width = L.room[0] + 'px'; cv.style.height = L.room[1] + 'px'; cx = cv.getContext('2d');
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
    cx.clearRect(0, 0, cv.width, cv.height);
    if (Math.random() < dt * (6 + hot * 22)) motes.push({ x: LAB.pour[0] + R(-.9, .9) * (LAB.rx || 150), y: LAB.pour[1] + R(-10, 10), vx: R(-14, 14), vy: -R(40, 110), life: 0, max: R(2.4, 4.6), s: R(2, 5.5), ph: R(0, 6.3) });
    cx.globalCompositeOperation = 'lighter'; const gcol = liq.map(Math.round).join(','); const gw = (LAB.rx || 150) * 2.4, gg = cx.createRadialGradient(LAB.pour[0], LAB.pour[1] + 20, 0, LAB.pour[0], LAB.pour[1] + 20, gw); gg.addColorStop(0, `rgba(${gcol},${.2 + .1 * Math.sin(t * 2.2) + hot * .16})`); gg.addColorStop(1, `rgba(${gcol},0)`); cx.fillStyle = gg; cx.fillRect(LAB.pour[0] - gw, LAB.pour[1] - gw, gw * 2, gw * 2);
    motes = motes.filter(m => { m.life += dt; if (m.life > m.max) return false; const k = m.life / m.max; m.x += (m.vx + Math.sin(t * 1.7 + m.ph) * 16) * dt; m.y += m.vy * dt; const r = m.s * (1 + k) * 3.2; const g3 = cx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r); g3.addColorStop(0, `rgba(${gcol.split(',').map(v => Math.min(255, +v + 90)).join(',')},${.75 * (1 - k)})`); g3.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = g3; cx.fillRect(m.x - r, m.y - r, r * 2, r * 2); return true; });
    cx.globalCompositeOperation = 'source-over'; liq = liq.map((v, i) => v + (liqT[i] - v) * Math.min(1, dt * 2.5)); const col = `rgb(${liq.map(Math.round)})`, rgb = liq.map(Math.round).join(','), [px, py] = LAB.pour, w = LAB.rx || 150, h = LAB.ry || 34;
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

  /* ---------------------------------------------------------------- the brewing film: camera to the cauldron, her hand dips an empty vial, lifts it glowing, carries it across the room and sets it on the table */
  const sleep = ms => new Promise(r => setTimeout(r, ms)), eio = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, eo = k => 1 - Math.pow(1 - k, 3), lerp = (a, b, k) => a + (b - a) * k;
  const TABLE = { portrait: [560, 1490], landscape: [880, 940] };
  let scr = null, vialId = 0, pv = null, brewFx = 0, filmT = 0, tableVial = null, pvSteam = [], pvLoop = 0;
  const kPlate = () => { const a = A.scene.plateToScreen(0, 0), b = A.scene.plateToScreen(100, 0); return (b[0] - a[0]) / 100; };
  const rgbOf = () => { const m = (liqT[0] + liqT[1] + liqT[2]) / 3; return liqT.map(v => Math.round(A.clamp(m + (v - m) * 1.6, 30, 235))); };       // the potion is a deeper, richer colour than the pale mix in the cauldron
  function vialSVG(rgb) {
    const id = 'v' + (++vialId), [r, g, b] = rgb, lt = `rgb(${Math.min(255, r + 38)},${Math.min(255, g + 38)},${Math.min(255, b + 38)})`, dk = `rgb(${r * .35 | 0},${g * .35 | 0},${b * .35 | 0})`, body = 'M33 20 L33 52 C14 62 6 80 6 102 C6 128 22 146 40 146 C58 146 74 128 74 102 C74 80 66 62 47 52 L47 20 Z';
    return `<svg viewBox="0 0 80 150" width="80" height="150" aria-hidden="true"><defs><linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".22" stop-color="#d8f2ee" stop-opacity=".14"/><stop offset=".72" stop-color="#a8d4cc" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity=".4"/></linearGradient>
      <radialGradient id="${id}l" cx=".38" cy=".3" r=".9"><stop offset="0" stop-color="${lt}"/><stop offset=".55" stop-color="rgb(${r},${g},${b})"/><stop offset="1" stop-color="${dk}"/></radialGradient><linearGradient id="${id}k" x1="0" x2="1"><stop offset="0" stop-color="#8a5a2c"/><stop offset=".5" stop-color="#c38a4d"/><stop offset="1" stop-color="#6a4020"/></linearGradient><clipPath id="${id}c"><path d="${body}"/></clipPath></defs>
      <g clip-path="url(#${id}c)"><g class="pv__liq"><rect x="0" y="150" width="80" height="150" fill="url(#${id}l)"/><ellipse cx="40" cy="150" rx="26" ry="3.4" fill="${lt}" opacity=".85"/><circle cx="28" cy="190" r="3" fill="#fff" opacity=".35"/><circle cx="50" cy="210" r="2" fill="#fff" opacity=".3"/><circle cx="40" cy="240" r="4" fill="#fff" opacity=".25"/></g></g>
      <path d="${body}" fill="url(#${id}g)" stroke="rgba(235,255,250,.6)" stroke-width="1.5"/><path d="M14 92 C12 106 16 120 24 130" stroke="rgba(255,255,255,.55)" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M62 70 C68 80 70 90 70 98" stroke="rgba(255,255,255,.3)" stroke-width="2" fill="none" stroke-linecap="round"/>
      <rect x="29" y="6" width="22" height="18" rx="3" fill="url(#${id}k)"/><path d="M31 10 H49 M31 15 H49" stroke="rgba(60,30,10,.4)" stroke-width="1"/><ellipse cx="40" cy="22" rx="12" ry="2" fill="rgba(0,0,0,.25)"/></svg>`;
  }
  const mkVial = (lv, lit) => { const d = A.h(`<div class="pv ${lit ? 'pv--lit' : ''}" style="--lv:${lv};--lc:${rgbOf().join(',')}">${vialSVG(rgbOf())}</div>`); return d; };
  function ensureScreen() { if (scr) return; scr = A.h(`<div id="potion3d" aria-hidden="false"><canvas id="pvFx"></canvas><div class="pvtable" id="pvTable"></div><div class="pvbtns" id="pvBtns"></div></div>`); document.body.appendChild(scr); const c = A.$('#pvFx', scr); c.width = innerWidth; c.height = innerHeight; addEventListener('resize', () => { c.width = innerWidth; c.height = innerHeight; }); }

  async function brew() {
    if (brewing) return; if (!sel.size) { A.toast('Выбери настроение: коснись любой склянки'); A.snd.owl(); return; }
    brewing = true; const my = ++filmT; A.$('#labRes', layer).classList.remove('on'); clearTable(); hint('Зелье варится…'); A.snd.brew(); A.vibrate([20, 30, 20]); layer.classList.add('boil'); ensureScreen(); scr.classList.add('on');
    const ori = A.scene.ori(), TB = TABLE[ori], rx = LAB.rx || 150, vH = A.clamp(innerHeight * .2, 110, 190), vW = vH * 80 / 150, ox = vW * .92, oy = vH * .42, vial = mkVial(0, false);
    vial.style.cssText += `;width:${vW}px;height:${vH}px;transform-origin:${ox}px ${oy}px`; const svg = A.$('svg', vial); svg.setAttribute('width', vW); svg.setAttribute('height', vH);
    A.$$('.mood3', layer).forEach(x => x.style.pointerEvents = 'none'); A.hands.show(true, true); A.$('#hands').classList.add('top');
    // keyframes of the grip point, in screen pixels, recomputed every frame because the camera moves under them
    const t0 = performance.now(); let phase = 0, dipped = false;
    const cp = () => { const [px, py] = A.scene.plateToScreen(LAB.pour[0], LAB.pour[1]), k = kPlate(), [tx, ty] = A.scene.plateToScreen(TB[0], TB[1]), vk = vH / 150, w = innerWidth, h = innerHeight;
      return { start: [w + 80, h * .95], above: [px - rx * k * .42, py - 190 * vk - vH * .1], dip: [px - rx * k * .42, py + 4 * k - vH * .02], aboveT: [tx + vW * .42, ty - vH * .58 - 120 * vk], onT: [tx + vW * .42, ty - vH * .58], surf: py + 8 * k, mouth: [px, py] }; };
    const path = t => { const P = cp(); let x, y, r, lv = 0, lit = false;
      if (t < 900) { const k = eo(t / 900); x = lerp(P.start[0], P.above[0], k); y = lerp(P.start[1], P.above[1], k); r = lerp(4, -8, k); }
      else if (t < 1500) { const k = eio((t - 900) / 600); x = P.above[0]; y = lerp(P.above[1], P.dip[1], k); r = lerp(-8, -22, k); }
      else if (t < 2800) { x = P.dip[0]; y = P.dip[1] + Math.sin((t - 1500) / 120) * 2; r = -22; lv = A.clamp((t - 1650) / 1000, 0, 1); }
      else if (t < 3600) { const k = eio((t - 2800) / 800); x = P.dip[0]; y = lerp(P.dip[1], P.above[1], k); r = lerp(-22, -6, k); lv = 1; lit = true; }
      else if (t < 5100) { const k = eio((t - 3600) / 1500), a = Math.sin(k * Math.PI) * 60; x = lerp(P.above[0], P.aboveT[0], k); y = lerp(P.above[1], P.aboveT[1], k) - a; r = lerp(-6, 0, k); lv = 1; lit = true; }
      else { const k = eio(A.clamp((t - 5100) / 700, 0, 1)); x = P.aboveT[0]; y = lerp(P.aboveT[1], P.onT[1], k); r = 0; lv = 1; lit = true; }
      const bottom = y - oy + vH, clip = (t > 1100 && t < 2900) ? Math.max(0, bottom - P.surf) : 0;
      return { x, y, r, s: 1, lv, lit, clip, P, prop: { x: x - ox, y: y - oy, r, s: 1 } }; };
    A.scene.look(LAB.pour[0], LAB.pour[1] + 40, 1.45);
    A.hands.carry('R', () => { const t = performance.now() - t0, c = path(t); if (c.lv != null) { vial.style.setProperty('--lv', (c.lv * 96).toFixed(1)); vial.classList.toggle('pv--lit', c.lit); } if (!dipped && t > 1300) { dipped = true; ripple(c.P.mouth); A.snd.bubble(); for (let i = 0; i < 18; i++) sparks.push({ x: LAB.pour[0] + R(-90, 90), y: LAB.pour[1], vx: R(-90, 90), vy: -R(160, 340), life: 0, max: R(.6, 1.2) }); }
      return { x: c.x, y: c.y, r: c.r, s: 1, prop: c.prop, clip: c.clip ? `inset(0 0 ${c.clip}px 0)` : 'none', snap: t < 40 }; }, vial);
    brewFx = 1; hot = 1;
    await sleep(1650); if (my !== filmT) return; for (let i = 0; i < 40; i++) bubbles.push(nb()); A.snd.bubble();
    await sleep(900); if (my !== filmT) return; A.snd.unlock2 && A.snd.unlock2(); A.fx.fireflies(innerWidth / 2, innerHeight * .4, 22, 180);
    await sleep(500); if (my !== filmT) return; A.scene.look(TB[0], TB[1] - 120, 1.12); A.snd.whoosh && A.snd.whoosh(1);
    await sleep(2900); if (my !== filmT) return;
    // the vial stands on the table; the hand lets go and slips away
    const pk = recommend(); const [tx, ty] = [0, 0]; A.hands.uncarry(); A.hands.show(false); setTimeout(() => A.$('#hands').classList.remove('top'), 900);
    placeTable(pk, vW, vH); brewing = false; brewFx = 0; layer.classList.remove('boil'); hint(''); A.$$('.mood3', layer).forEach(x => x.style.pointerEvents = '');
  }
  function ripple(m) { const [rx, ry] = LAB.pour; for (let i = 0; i < 3; i++) setTimeout(() => ripples.push({ x: rx + R(-30, 30), y: ry + R(-6, 10), r: 6, a: .8 }), i * 140); }

  /* the vial on the table, in screen space: it follows the camera, smoke curls out of the cork, a tag with the book's name hangs from its neck */
  function placeTable(p, vW, vH) {
    const b = p.b, TB = TABLE[A.scene.ori()], el = mkVial(96, true); el.style.cssText += `;width:${vW}px;height:${vH}px`; const svg = A.$('svg', el); svg.setAttribute('width', vW); svg.setAttribute('height', vH);
    const holder = A.$('#pvTable', scr); holder.innerHTML = ''; const wrap = A.h(`<div class="pvt" style="--vw:${vW}px;--vh:${vH}px"></div>`); wrap.appendChild(el);
    wrap.appendChild(A.h(`<div class="pvt__tag"><i></i><b>${A.esc(b.title)}</b><small>${A.esc(b.author || '')}</small><em>${[...sel].map(k => A.MOODS[k]).join(' · ')}</em></div>`)); holder.appendChild(wrap); smkS = tintSprite(rgbOf()); tableVial = { wrap, el, TB, vW, vH, p };
    wrap.animate([{ transform: 'translateY(-6px) scale(1.04)', filter: 'brightness(1.8)' }, { transform: 'none', filter: 'none' }], { duration: 900, easing: 'cubic-bezier(.2,.9,.3,1)' });
    A.snd.chime && A.snd.chime([523.25, 659.25, 783.99, 1046.5], .1, .8); A.vibrate(24); A.fx.sparks(innerWidth / 2, innerHeight * .55, 24, '#bff5cf');
    const bt = A.$('#pvBtns', scr), why = [...sel].map(k => A.MOODS[k]).join(' · ');
    bt.innerHTML = `${p.own ? `<button class="seal" id="rcOpen">Открыть книгу</button>` : `<button class="seal" id="rcAdd">В «Хочу»</button>`}<button class="seal seal--ghost" id="rcAgain">Ещё раз</button>`;
    bt.classList.add('on'); A.$$('button', bt).forEach(x => x.addEventListener('pointerdown', e => e.stopPropagation()));
    A.$('#rcAgain', bt).addEventListener('click', () => { A.snd.tap(); clearTable(); sel.clear(); A.$$('.mood3', layer).forEach(x => x.classList.remove('on')); mix(); A.scene.look(LAB.pour[0], LAB.pour[1], 1); hint('Коснись склянки, чтобы влить её в котёл'); });
    const add = A.$('#rcAdd', bt), open = A.$('#rcOpen', bt);
    add && add.addEventListener('click', () => { A.state.books.push({ id: A.uid(), title: b.title, author: b.author, pages: b.pages || 300, read: 0, status: 'want', rating: 0, tags: [...(b.tags || [])], impression: '', added: Date.now(), cover: {} }); A.save(); A.mods.books && A.mods.books.refresh(); A.snd.coin(); A.fx.stars(innerWidth / 2, innerHeight * .6, 30); add.textContent = 'Добавлено ✓'; add.disabled = true; });
    open && open.addEventListener('click', () => { const bk = b.id ? b : A.state.books.find(x => x.title === b.title); A.snd.page(); A.go('books'); setTimeout(() => { if (bk && bk.hasText) A.reader.open(bk, null); else if (bk) A.mods.books.openBook(bk.id); }, 1800); });
    if (!pvLoop) { pvLoop = 1; requestAnimationFrame(pvFrame); }
  }
  function clearTable() { tableVial = null; pvSteam.length = 0; if (scr) { A.$('#pvTable', scr).innerHTML = ''; A.$('#pvBtns', scr).classList.remove('on'); const c = A.$('#pvFx', scr); c.getContext('2d').clearRect(0, 0, c.width, c.height); } }
  const tintSprite = rgb => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32), m = rgb.map(v => Math.min(255, v + 60)).join(','); gr.addColorStop(0, `rgba(${m},.6)`); gr.addColorStop(.5, `rgba(${m},.22)`); gr.addColorStop(1, `rgba(${m},0)`); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c; };
  let smkS = null;
  let pvLast = 0;
  function pvFrame(now) {
    if (!scr) { pvLoop = 0; return; } requestAnimationFrame(pvFrame); const dt = Math.min(.05, (now - (pvLast || now)) / 1000); pvLast = now; if (A.scene.room() !== 'lab') return;
    const c = A.$('#pvFx', scr), g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); if (!tableVial) return;
    const { wrap, TB, vW, vH } = tableVial, [tx, ty] = A.scene.plateToScreen(TB[0], TB[1]); wrap.style.transform = `translate3d(${(tx - vW / 2).toFixed(1)}px,${(ty - vH).toFixed(1)}px,0)`;
    const rgb = rgbOf(); if (Math.random() < dt * 9) pvSteam.push({ x: tx + R(-2, 2), y: ty - vH + 2, vx: R(-5, 5), vy: -R(22, 46), life: 0, max: R(2.6, 4.2), s: R(5, 11) });
    g.globalCompositeOperation = 'lighter';
    pvSteam = pvSteam.filter(q => { q.life += dt; if (q.life > q.max) return false; const k = q.life / q.max; q.x += (q.vx + Math.sin(q.life * 2.4 + q.max) * 14) * dt; q.y += q.vy * dt; const r = q.s * (1 + k * 4.2); g.globalAlpha = Math.min(1, k * 6) * (1 - k) * .3; g.drawImage(smkS, q.x - r, q.y - r, r * 2, r * 2); return true; });
    const gr = g.createRadialGradient(tx, ty - vH * .45, 0, tx, ty - vH * .45, vH * 1.3); gr.addColorStop(0, `rgba(${rgb},${.28 + .06 * Math.sin(performance.now() / 400)})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(tx - vH * 1.4, ty - vH * 1.8, vH * 2.8, vH * 2.4); g.globalCompositeOperation = 'source-over';
  }

  function recommend() {
    const mine = A.state.books.filter(b => b.status === 'want'), have = new Set(A.state.books.map(b => b.title.toLowerCase()));
    const score = b => { const tg = b.tags || b.m || []; let s = 0; tg.forEach(m => { if (sel.has(m)) s += 3; }); return s + Math.random() * .9; };
    const own = mine.map(b => ({ b, s: score(b), own: true })).filter(x => x.s >= 1.5).sort((a, b) => b.s - a.s)[0];
    const cands = A.SUGGEST.filter(x => !have.has(x.t.toLowerCase())).map(x => ({ b: { title: x.t, author: x.a, pages: x.p, tags: x.m }, s: score(x) })).sort((a, b) => b.s - a.s);
    return own || cands[0] || { b: { title: A.SUGGEST[0].t, author: A.SUGGEST[0].a, pages: A.SUGGEST[0].p, tags: A.SUGGEST[0].m }, s: 0 };
  }
  function show() {}
})();
