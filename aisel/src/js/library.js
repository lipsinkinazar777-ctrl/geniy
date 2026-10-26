/* ============================================================ the reading hall: her books stand in a gentle arc on the rug in front of the fireplace, built as real 3D boxes (cover, spine, page block, loose leaves).
   swipe: the arc turns; the nearer hand drifts toward the book in the middle (hover); tap it: both hands take the book, lift it, carry it to the empty middle of the rug and lay it down,
   the other books fade away, the cover swings open and the pages riffle, and the reading book (bookview.js) takes over. The inkwell opens the writing desk for a new quote; the bin takes a book off the shelf.
   Everything is transform/opacity driven from one rAF loop. */
A.lib = (() => {
  const root = A.$('#lib3d'), BA = A.BOOKART;
  const KNOWN = [[/фонар/i, 'lantern'], [/ленн|принц/i, 'prince'], [/зов|умирающ/i, 'souls'], [/алис/i, 'alice'], [/пепл|проклят/i, 'ash'], [/гордост|предубежд/i, 'pride']];
  const PAL = Object.keys(BA);
  const artOf = b => { const t = b.title || '', au = b.author || ''; if (/айсел/i.test(au)) for (const [re, k] of KNOWN) if (re.test(t)) return { k, own: true }; return { k: PAL[A.hash(t + au) % PAL.length], own: false }; };
  class Sp { constructor(x = 0, k = 90, c = 15) { this.x = x; this.t = x; this.v = 0; this.k = k; this.c = c; } step(dt) { const n = Math.ceil(dt / .008), h = dt / n; for (let i = 0; i < n; i++) { this.v += (this.k * (this.t - this.x) - this.c * this.v) * h; this.x += this.v * h; } } get moving() { return Math.abs(this.t - this.x) > .0008 || Math.abs(this.v) > .004; } }
  const sgn = Math.sign, wait = ms => new Promise(r => setTimeout(r, ms)), ease = k => 1 - Math.pow(1 - A.clamp(k, 0, 1), 3), rnd = (a, b) => a + Math.random() * (b - a);
  let stage, tagEl, noteEl, poolEl, delEl, askEl, built = false, lastOri = '', items = [], p = 0, pv = 0, pt = 0, drag = null, G = null, active = false, busy = false, raf = 0, last = 0, T = 0, sel = null, hoverT = 0, lastIdx = -1, parx = 0, pary = 0, fl = 1, kick = 0, hs = [], others = new Sp(0, 46, 9.5), fireOn = true, fireL = new Sp(1, 26, 8.5), offEl = null, darkEl = null, fireBtn = null;
  const order = { reading: 0, want: 1, done: 2 };
  const fireSnd = () => A.snd.syncFire();

  const geo = () => { const vw = innerWidth, vh = innerHeight, land = vw > vh, W0 = land ? Math.min(vh * .34, vw * .16, 230) : Math.min(vw * .5, 210); return { vw, vh, land, W0, base: land ? vh * .935 : vh * .9, cx: vw / 2, step: W0 * .86 }; };
  const natOf = k => BA[k] || BA.lantern;
  const PAPER = 'radial-gradient(120% 90% at 50% 40%,#efe2bd,#e0cd9b 70%,#cdb883)';

  /* ---------------------------------------------------------------- one 3D book */
  function bookHTML(it) {
    const { k, own } = it.art, n = natOf(k), D = Math.round(n.w * .19), f = n.face, bh = f[3] - f[1], lc = `rgb(${n.mu.join(',')})`, lcL = `rgb(${n.mu.map(v => Math.min(255, v * 2.1 + 12)).join(',')})`;
    const b = it.b, tl = (b.title || '').length, fs = Math.round(n.w * (tl > 28 ? .064 : tl > 18 ? .076 : .09));
    const front = it.add ? `<img src="img/blank-ash.webp" alt=""><span class="bk__plus"></span><div class="bk__ttl" style="top:62%"><i style="font-size:${Math.round(n.w * .06)}px">новая книга</i></div>`
      : own ? `<img src="img/book-${k}.webp" alt="">`
      : `<img src="img/blank-${k}.webp" alt=""><img class="bk__emb" src="img/emblem-${k}.webp" alt="" style="left:${n.emb[0]}px;top:${n.emb[1]}px;width:${Math.round(n.w * .3)}px"><div class="bk__ttl"><b style="font-size:${fs}px">${A.esc(b.title)}</b><i style="font-size:${Math.round(n.w * .06)}px">${A.esc(b.author || '')}</i></div>`;
    const bx = f[0] + 8, bw = f[2] - f[0] - 12, by = f[1] + 5;
    const leaves = [0, 1, 2].map(i => `<div class="bk__lf" style="top:${by}px;height:${bh - 10}px;left:${bx}px;width:${bw}px;background:${PAPER}"></div>`).join('');
    return `<div class="bk__box" style="width:${n.w}px;height:${n.h}px;--D:${D}px;--bh:${bh}px;--by:${f[1]}px;--lc:${lc};--lcl:${lcL}">
      <div class="bk__shadow" style="top:${f[3]}px;width:${n.w * 1.25}px"></div>
      <div class="bk__f bk__back" style="top:${f[1]}px;height:${bh}px;transform:translateZ(${-D / 2}px)"></div>
      <div class="bk__f bk__spine" style="top:${f[1]}px;height:${bh}px;width:${D}px;left:${-D / 2 + 3}px"></div>
      <div class="bk__f bk__edge" style="top:${f[1]}px;height:${bh}px;width:${D}px;left:${f[2] - D / 2 - 2}px"></div>
      <div class="bk__f bk__top" style="top:${f[1] - D / 2}px;height:${D}px;left:${f[0] - 4}px;width:${f[2] - f[0]}px"></div>
      <div class="bk__f bk__tail" style="top:${f[3] - D / 2 - 4}px;height:${D}px;left:${f[0] - 4}px;width:${f[2] - f[0]}px"></div>
      <div class="bk__f bk__block" style="top:${by}px;height:${bh - 10}px;left:${bx}px;width:${bw}px;transform:translateZ(${D / 2 - 5}px)"><p>${it.add ? '' : A.esc(b.title)}</p></div>
      ${leaves}
      <div class="bk__cv" style="transform:translateZ(${D / 2}px)"><div class="bk__front">${front}<div class="bk__lit"></div></div><div class="bk__lining" style="top:${f[1]}px;height:${bh}px;left:${f[0]}px;width:${f[2] - f[0]}px"></div></div>
    </div>`;
  }

  /* ---------------------------------------------------------------- the fireplace: a patch of the plate with the flames put out fades in over the live plate; the light, embers and crackle follow the same level */
  function mountFire() {
    const lay = A.$('#libLayer'); if (!lay) return; if (offEl && offEl.parentNode) offEl.remove(); if (darkEl && darkEl.parentNode) darkEl.remove();
    darkEl = A.h('<div class="lb__dark"></div>'); offEl = A.h('<img class="lb__off" src="img/lib-fireoff.webp" alt="" draggable="false" style="left:700px;top:140px;width:510px;height:340px">'); lay.appendChild(darkEl); lay.appendChild(offEl); paintFire();
  }
  function paintFire() { const k = 1 - fireL.x; if (offEl) offEl.style.opacity = k.toFixed(3); if (darkEl) darkEl.style.opacity = (k * .55).toFixed(3); if (fireBtn) fireBtn.classList.toggle('on', fireOn); }
  function toggleFire() {
    fireOn = !fireOn; fireL.t = fireOn ? 1 : 0; A.state.libFire = fireOn; A.save && A.save(); A.snd.unlock && A.snd.unlock(); A.vibrate(fireOn ? [12, 24, 14] : 10);
    if (fireOn) { A.snd.fireLit && A.snd.fireLit(); setTimeout(fireSnd, 380); } else { A.snd.fireOut && A.snd.fireOut(); fireSnd(); } paintFire(); wake();
  }

  function init() {
    const ori = A.scene.ori(); if (built && lastOri === ori) return; built = true; lastOri = ori; G = geo();
    root.innerHTML = `<i class="lb__pool" id="lbPool"></i><div class="lb__stage" id="lbStage"></div><div class="lb__tag" id="lbTag"></div><p class="lb__note" id="lbNote"></p>
      <button class="lb__ink" id="lbInk" aria-label="Записать цитату"><img src="img/ink.webp" alt=""><span>цитата</span></button>
      <button class="lb__fire on" id="lbFire" aria-label="Камин: огонь"><svg viewBox="0 0 24 24" class="ico"><use href="#i-flame"/></svg><i></i></button>
      <button class="lb__del" id="lbDel" aria-label="Убрать книгу с полки"><svg viewBox="0 0 24 24" class="ico"><g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.500 7h15M9.500 7V4.800h5V7M6.500 7l.9 12.200h9.200L17.500 7M10 10.500v5.500M14 10.500v5.500"/></g></svg></button>
      <div class="lb__ask" id="lbAsk" hidden><div class="lb__ask-in"><p>Убрать эту книгу с полки?</p><b id="lbAskT"></b><small>Её цитаты останутся в свитке</small><div class="lb__ask-row"><button class="seal seal--ghost" data-a="no">Оставить</button><button class="seal" data-a="yes">Убрать</button></div></div></div>`;
    stage = A.$('#lbStage', root); tagEl = A.$('#lbTag', root); noteEl = A.$('#lbNote', root); poolEl = A.$('#lbPool', root); delEl = A.$('#lbDel', root); askEl = A.$('#lbAsk', root); fireBtn = A.$('#lbFire', root); fireOn = A.state.libFire !== false; fireL.x = fireL.t = fireOn ? 1 : 0; mountFire();
    A.$('#lbInk', root).addEventListener('pointerdown', e => e.stopPropagation()); delEl.addEventListener('pointerdown', e => e.stopPropagation()); fireBtn.addEventListener('pointerdown', e => e.stopPropagation()); fireBtn.addEventListener('click', () => toggleFire()); askEl.addEventListener('pointerdown', e => e.stopPropagation());
    A.$('#lbInk', root).addEventListener('click', () => { if (busy || A.qslip.isOpen) return; const ib = A.$('#lbInk', root); ib.classList.remove('dip'); void ib.offsetWidth; ib.classList.add('dip'); A.snd.tap(); A.snd.quill && A.snd.quill(); A.vibrate(10); const it = items[Math.round(p)]; setTimeout(() => A.qslip.open({ bookId: it && it.b && it.b.id ? it.b.id : '' }), 260); });
    delEl.addEventListener('click', () => { if (busy) return; const it = items[Math.round(p)]; if (!it || it.add) return; A.snd.tap(); A.vibrate(10); A.$('#lbAskT', askEl).textContent = '«' + (it.b.title || 'Без названия') + '»'; askEl.hidden = false; void askEl.offsetWidth; askEl.classList.add('on'); busy = true; });
    askEl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b && e.target !== askEl) return; const yes = b && b.dataset.a === 'yes'; askEl.classList.remove('on'); setTimeout(() => { askEl.hidden = true; }, 380); if (yes) removeBook(items[Math.round(p)]); else { busy = false; A.snd.tap(); } });
    bind(); render();
  }

  function render() {
    if (!built) return; const keep = items[Math.round(p)] && items[Math.round(p)].b && items[Math.round(p)].b.id;
    const list = [...A.state.books].sort((a, b) => order[a.status] - order[b.status] || (b.added || 0) - (a.added || 0));
    stage.innerHTML = ''; items = list.map(b => ({ b, art: artOf(b) })); items.push({ add: true, b: { title: '', author: '' }, art: { k: 'ash', own: false } });
    items.forEach(it => {
      const el = A.h(`<div class="bk">${bookHTML(it)}</div>`); el.style.display = 'none'; it.on = false; stage.appendChild(el); it.el = el; it.box = A.$('.bk__box', el); it.cv = A.$('.bk__cv', el); it.lit = A.$('.bk__lit', el); it.lf = A.$$('.bk__lf', el); it.n = natOf(it.art.k);
      it.jit = ((A.hash((it.b.title || 'x') + (it.b.author || '')) % 9) - 4) * .35;                                         // each book is set down a little differently
      it.press = new Sp(0, 160, 18); it.lift = new Sp(0, 60, 9); it.lay = new Sp(0, 34, 8.4); it.open = new Sp(0, 46, 8); it.fan = new Sp(0, 36, 8.2); it.zoom = new Sp(0, 40, 11.5);
    });
    noteEl.textContent = ''; const at = keep ? items.findIndex(i => i.b && i.b.id === keep) : -1, start = at >= 0 ? at : Math.max(0, items.findIndex(i => i.b.status === 'reading'));
    p = pt = start; pv = 0; lastIdx = -1; layoutPool(); draw(); label(); wake();
  }
  function layoutPool() { const g = G; poolEl.style.cssText = `left:${g.cx - g.W0 * 1.35}px;top:${g.base - g.W0 * .2}px;width:${g.W0 * 2.7}px;height:${g.W0 * .6}px`; }

  /* ---------------------------------------------------------------- the arc: the book in the middle steps forward and floats a little, the others stand back, turned toward it */
  function place(it, d) {
    const g = G, ad = Math.abs(d), e = Math.min(ad, 1), far = Math.max(0, ad - 1), s0 = g.W0 / it.n.w, lift = Math.max(0, 1 - ad), side = sgn(d) || 0;
    let x = g.cx + side * g.W0 * (.86 * e + .46 * far), y = e * 7 + far * 9 + it.jit * e - lift * (1.6 + 1.6 * Math.sin(T * 1.5)), z = 80 * lift - 85 * e - 60 * far, ry = -side * e * 17 + it.jit * .5 * e, rx = 0, s = s0 * (1 - .1 * e - .035 * far), dim = A.clamp(.05 + .5 * e + .05 * far, 0, .8);
    const L = it.lift.x, O = it.open.x, Z = it.zoom.x, P = it.press.x, Y = it.lay.x;
    if (P) { y += P * 8; s *= 1 - P * .03; rx += P * 3; }
    if (L || O || Z || Y) {
      const f = it.n.face, fw = f[2] - f[0], fh = f[3] - f[1];
      ry *= 1 - Math.max(L, Y); dim *= 1 - Math.max(L, Y); y -= L * g.W0 * .4; z += L * 120; rx += L * 5; s *= 1 + L * .14;
      if (Y) { const tb = g.land ? g.vh * .86 : g.vh * .70; y += (tb - g.base - y) * Y; x += (g.cx - x) * Y; rx += 58 * Y; s *= 1 + (g.land ? .5 : .42) * Y; z += 40 * Y; }                    // carried to the empty middle of the rug and laid down flat
      x += O * fw * s * .5;                                                                      // the swung cover and the book are centred together
      if (Z) { const S = g.land ? Math.min(g.vh * .78 / fh, g.vw * .22 / fw) : Math.min(g.vh * .72 / fh, g.vw * .9 / fw); s = s + (S - s) * Z; x = x + (g.cx - x) * Z; ry *= 1 - Z; rx *= 1 - Z; z *= 1 - Z; }
    }
    it.s = s; it.x = x; it.y = y; it.z = z; it.ry = ry; it.rx = rx; it.dim = dim;
  }
  const setS = (el, k, v) => { const c = el._s || (el._s = {}); if (c[k] !== v) { c[k] = v; if (k === 'dim') el.style.setProperty('--dim', v); else el.style[k] = v; } };
  function paint(it) {
    const g = G, f = it.n.face, fw = f[2] - f[0], fh = f[3] - f[1], Z = it.zoom.x;
    // anchor: bottom-centre of the book body stands on the rug; zoom pulls it to the middle of the screen
    const by = g.base + it.y + (Z ? ((g.vh * .5 + fh * it.s * .5) - g.base - it.y) * Z : 0);
    setS(it.el, 'transform', `translate3d(${(it.x + parx * (1 + Math.max(0, it.z) / 500)).toFixed(1)}px,${(by + pary).toFixed(1)}px,${it.z.toFixed(1)}px) rotateY(${it.ry.toFixed(2)}deg) rotateX(${it.rx.toFixed(2)}deg) scale(${it.s.toFixed(4)})`);
    if (!it.placed) { it.placed = true; it.box.style.transform = `translate(${-(f[0] + fw / 2).toFixed(1)}px,${-f[3]}px)`; it.D = parseFloat(it.box.style.getPropertyValue('--D')); }
    setS(it.cv, 'transform', `translateZ(${it.D / 2}px) rotateY(${(-it.open.x * 168).toFixed(1)}deg)`);
    const fan = it.fan.x; it.lf.forEach((l, i) => { const k = ease((fan - i * .13) / .55), a = k * (158 + i * 3), on = fan > .004; setS(l, 'display', on ? '' : 'none'); if (on) setS(l, 'transform', `translateZ(${it.D / 2 - 4 + i * .8}px) rotateY(${(-a).toFixed(1)}deg)`); });
    setS(it.el, 'dim', it.dim.toFixed(2)); setS(it.el, 'zIndex', String(100 - Math.round(Math.abs(it.pos) * 10) + (it === sel ? 50 : 0))); setS(it.el, 'opacity', it === sel ? '1' : (1 - others.x).toFixed(3));
  }
  function draw() {
    items.forEach((it, i) => { const d = i - p; it.pos = d; const vis = Math.abs(d) < 4.6 && !(sel && it !== sel && others.x > .985); if (!vis) { if (it.on) { it.el.style.display = 'none'; it.on = false; } return; } if (!it.on) { it.el.style.display = ''; it.on = true; } place(it, d); paint(it); });
    const c = items[A.clamp(Math.round(p), 0, items.length - 1)]; if (poolEl && c) poolEl.style.opacity = (.9 * (1 - Math.max(c.lift.x, c.lay.x) * .8) * (1 - others.x * .6) * (1 - Math.min(1, Math.abs(c.pos)) * .5)).toFixed(2);
  }
  function label() {
    const i = A.clamp(Math.round(p), 0, items.length - 1), it = items[i]; if (!it) return;
    if (delEl) delEl.classList.toggle('on', !it.add && !busy);
    if (i !== lastIdx) { lastIdx = i; if (active) { A.snd.page && A.snd.page(); A.vibrate(6); } const b = it.b;
      const mk = b.pos > .002 && b.pages ? ` · стр. ${Math.max(1, Math.round(b.pos * b.pages))} из ${b.pages}` : '';
      tagEl.innerHTML = it.add ? '<b>Новая книга</b><small>поставь её на полку</small>' : `<b>${A.esc(b.title)}</b><small>${A.esc(b.author || '')}${b.status === 'reading' ? ' · читаю' : b.status === 'done' ? ' · прочитано' : ''}${mk}</small>`;
      tagEl.classList.remove('pop'); void tagEl.offsetWidth; tagEl.classList.add('pop'); }
  }

  /* ---------------------------------------------------------------- loop */
  function wake() { if (!raf && active) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  function loop(now) {
    raf = 0; if (!active) return; const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
    if (!drag) { pv += ((pt - p) * 170 - pv * 21) * dt; p += pv * dt; if (Math.abs(pt - p) <= .002 && Math.abs(pv) <= .01) { p = pt; pv = 0; } }
    items.forEach(it => { [it.press, it.lift, it.lay, it.open, it.fan, it.zoom].forEach(s => { s.step(dt); if (!s.moving) s.x = s.t; }); }); others.step(dt); if (!others.moving) others.x = others.t; fireL.step(dt); if (!fireL.moving) fireL.x = fireL.t; paintFire();
    if (A.bookview && A.bookview.isOpen()) { raf = requestAnimationFrame(loop); return; }                 // the open book owns the frame
    const par = A.scene.parallax(); parx = par.x * 2.4; pary = par.y * 2.0;
    fl = .9 + .06 * Math.sin(T * 6.3) + .04 * Math.sin(T * 11.3 + 1.3) + (A.snd.fireLevel ? A.snd.fireLevel() * .12 : 0);
    draw(); label();
    if ((kick = (kick + 1) % 2) === 0) items.forEach(it => { if (it.on && Math.abs(it.pos) < 1.6) it.lit.style.opacity = (fl * .55).toFixed(3); });
    raf = requestAnimationFrame(loop);        // keeps the firelight on the covers breathing; cheap: only the centre books are repainted by the browser
  }

  /* ---------------------------------------------------------------- hands */
  const rectOf = it => it.box.getBoundingClientRect();
  function hover() {
    if (!active || busy || drag) return; const it = items[Math.round(p)]; if (!it || Math.abs(it.pos) > .3) return; const r = rectOf(it), side = Math.round(p) % 2 ? 'R' : 'L';
    A.hands.hover([r.left + r.width * (side === 'L' ? .36 : .64), r.top + r.height * .74]);
  }
  const rehover = () => { clearTimeout(hoverT); hoverT = setTimeout(hover, 520); };

  /* ---------------------------------------------------------------- the choreography: both hands take the book, lift it, carry it to the empty middle of the rug, lay it down; the others fade; the cover opens; she reads */
  async function select(it) {
    if (busy) return; if (it.add) { A.snd.coin(); A.mods.books.editBook(); return; }
    busy = true; sel = it; clearTimeout(hoverT); A.vibrate(14); A.snd.page(); A.snd.unlock && A.snd.unlock(); fireSnd(); root.classList.add('pick');
    it.press.t = 1; A.hands.grasp(() => rectOf(it)); A.scene.push && A.scene.push(1.06); await wait(520);
    it.press.t = 0; it.lift.t = 1; others.t = 1; A.snd.whoosh && A.snd.whoosh(1); A.vibrate([8, 20, 8]); await wait(560);                          // taken up; the others step back into the dark
    it.lay.t = 1; await wait(420); it.lift.t = .12; await wait(560);                                                                            // carried over, then lowered onto the rug
    A.snd.tap(); A.vibrate(12); await wait(200);
    A.hands.retreat(); it.open.t = .55; await wait(380);                                                                                          // she lets go; the cover starts to lift
    it.open.t = 1; it.zoom.t = 1; A.hands.show(false); A.snd.page(); setTimeout(() => A.snd.chime && A.snd.chime([523.25, 659.25, 783.99], .06, .6), 300); await wait(1000);          // the cover swings open as we lean in
    A.bookview.open(it.b, { onClose: () => back(it) });
  }
  function back(it) {
    busy = true; A.hands.show(true, true); A.hands.back(); A.hands.idle(); it.zoom.t = 0; it.open.t = 0; A.scene.push && A.scene.push(1.02); wake();
    setTimeout(() => { it.lift.t = .5; }, 420); setTimeout(() => { it.lay.t = 0; it.lift.t = 0; others.t = 0; A.snd.whoosh && A.snd.whoosh(.6); }, 900);
    setTimeout(() => { root.classList.remove('pick'); A.scene.push && A.scene.push(1); }, 1500); setTimeout(() => { busy = false; sel = null; rehover(); }, 2100);
  }
  function removeBook(it) {
    if (!it || it.add || !it.b.id) { busy = false; return; } const id = it.b.id;
    A.snd.pop && A.snd.pop(); A.vibrate([10, 20]);
    it.el.animate([{ opacity: 1, filter: 'none' }, { opacity: 0, filter: 'blur(5px) brightness(.5)' }], { duration: 520, easing: 'ease-in', fill: 'forwards' });
    setTimeout(() => {
      A.state.books = A.state.books.filter(x => x.id !== id); A.txt && A.txt.del && A.txt.del(id); A.state.quotes.forEach(x => { if (x.bookId === id) x.bookId = null; }); A.save();
      busy = false; render(); A.toast('Книга ушла с полки'); A.mods.books && A.mods.books.refresh && 0;
    }, 540);
  }

  /* ---------------------------------------------------------------- input */
  function bind() {
    stage.addEventListener('pointerdown', e => {
      if (busy) return; stage.setPointerCapture(e.pointerId); const el = e.target.closest('.bk'), i = el ? items.findIndex(it => it.el === el) : -1;
      drag = { x: e.clientX, y: e.clientY, p0: p, t: performance.now(), moved: false, lx: e.clientX, lt: performance.now(), v: 0, i, long: 0 }; pv = 0; clearTimeout(hoverT);
      if (i >= 0 && !items[i].add) drag.long = setTimeout(() => { if (drag && !drag.moved && Math.abs(i - p) < .6) { drag.moved = true; A.vibrate(20); A.mods.books.openBook(items[i].b.id); drag = null; } }, 700);
    });
    stage.addEventListener('pointermove', e => {
      if (!drag) return; if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 9) { drag.moved = true; clearTimeout(drag.long); A.hands.idle(); }
      if (drag.moved) { const now = performance.now(); drag.v = drag.v * .6 + ((e.clientX - drag.lx) / Math.max(1, now - drag.lt)) * .4; drag.lx = e.clientX; drag.lt = now; p = A.clamp(drag.p0 - (e.clientX - drag.x) / G.step, -.35, items.length - 1 + .35); pt = p; wake(); }
    });
    const end = () => {
      if (!drag) return; const d = drag; drag = null; clearTimeout(d.long);
      if (d.moved) { pt = A.clamp(Math.round(p - d.v * 9), 0, items.length - 1); pv = 0; wake(); rehover(); return; }
      if (d.i < 0) { return; }
      const it = items[d.i]; if (Math.abs(d.i - p) < .55) select(it); else { pt = d.i; wake(); rehover(); }
    };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', () => { if (drag) { clearTimeout(drag.long); drag = null; pt = Math.round(p); wake(); } });
    stage.addEventListener('wheel', e => { e.preventDefault(); if (busy) return; pt = A.clamp(Math.round(pt + sgn(e.deltaX || e.deltaY)), 0, items.length - 1); wake(); rehover(); }, { passive: false });
    addEventListener('keydown', e => { if (!active || busy || (A.bookview && A.bookview.isOpen()) || A.qslip.isOpen) return; if (e.key === 'ArrowRight') { pt = Math.min(items.length - 1, Math.round(pt) + 1); wake(); rehover(); } else if (e.key === 'ArrowLeft') { pt = Math.max(0, Math.round(pt) - 1); wake(); rehover(); } else if (e.key === 'Enter' || e.key === ' ') { const it = items[Math.round(p)]; it && select(it); } });
    addEventListener('resize', () => { if (!built) return; if (A.scene.ori() !== lastOri) return; G = geo(); layoutPool(); wake(); });
  }

  /* ---------------------------------------------------------------- the alchemy table, wherever the frame shows it */
  function doors() {
    hs.forEach(h => h.remove()); hs = []; const H = A.scene.layout().libHs || {}, NM = { lab: ['Алхимия', 'potion'], fire: ['Камин', 'fire'] };
    Object.entries(H).forEach(([k, polys]) => NM[k] && polys.forEach(pl => {
      const xs = pl.map(q => q[0]), ys = pl.map(q => q[1]), a = A.scene.plateFinal(Math.min(...xs), Math.min(...ys)), b = A.scene.plateFinal(Math.max(...xs), Math.max(...ys)), cx = (a[0] + b[0]) / 2;
      if (cx < 24 || cx > innerWidth - 24 || b[1] < 0) return;
      const el = A.h(`<button class="lb__door" aria-label="${NM[k][0]}" style="left:${a[0]}px;top:${a[1]}px;width:${b[0] - a[0]}px;height:${b[1] - a[1]}px"><i></i>${NM[k][1] === 'fire' ? '' : `<span>${NM[k][0]}</span>`}</button>`);
      el.addEventListener('pointerdown', e => e.stopPropagation()); el.addEventListener('click', () => { if (busy) return; if (NM[k][1] === 'fire') { toggleFire(); return; } A.snd.chime && A.snd.chime([392, 523.25], .08, .6); A.vibrate(10); A.go(NM[k][1]); }); root.appendChild(el); hs.push(el);
    }));
  }

  return {
    init, render, rebuild() { built = false; lastIdx = -1; if (active) { init(); doors(); } },
    show() {
      init(); active = true; busy = false; sel = null; others.x = others.t = 0; root.classList.remove('pick'); root.classList.add('on'); G = geo(); layoutPool(); A.hands.show(true); fireSnd(); doors(); render(); wake();
      root.classList.add('hints'); setTimeout(() => root.classList.remove('hints'), 5200); rehover();
      if (!A.state.libTip) { A.state.libTip = true; A.save(); setTimeout(() => { if (!active) return; noteEl.textContent = 'Листай книги пальцем. Коснись книги, и она раскроется.'; noteEl.classList.add('on'); setTimeout(() => noteEl.classList.remove('on'), 5500); }, 1800); }
    },
    hide() { active = false; busy = false; root.classList.remove('on'); A.hands.show(false); A.snd.setFire(A.fire && A.fire.on ? 1 : 0); clearTimeout(hoverT); root.classList.remove('pick'); hs.forEach(h => h.remove()); hs = []; A.scene.push && A.scene.push(1); A.qslip && A.qslip.close(); if (raf) { cancelAnimationFrame(raf); raf = 0; } },
    openBook(id) { const i = items.findIndex(it => it.b && it.b.id === id); if (i < 0 || busy) return false; p = pt = i; pv = 0; draw(); label(); wake(); setTimeout(() => { if (active && !busy) select(items[i]); }, 650); return true; },
    get active() { return active; }, fireLevel: () => fireL.x, _items: () => items
  };
})();
