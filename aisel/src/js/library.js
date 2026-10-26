/* ============================================================ the reading hall: her books stand on a wooden shelf; swipe and the one in the middle lifts, turns
   its cover to you and its title appears in plain letters. Tap it and the reader opens at once. */
A.lib = (() => {
  let layer, shelf, track, tag, built = false, lastOri = '', items = [], p = 0, pv = 0, pt = 0, raf = 0, drag = null, G = null;
  const hue = b => (b.cover && b.cover.hue != null) ? b.cover.hue : (A.hash(b.title + (b.author || '')) % 360);
  const order = { reading: 0, want: 1, done: 2 };
  const geo = () => { const L = A.scene.layout(), [y, x, w, h] = L.libRows[0], land = A.scene.ori() === 'landscape'; return { y, x, w, h, base: y + h, step: land ? 112 : 130, sw: land ? 56 : 78, sh: land ? 170 : 240, cw: land ? 150 : 175, ch: land ? 215 : 250, gap: land ? 100 : 130, add: L.libAdd }; };

  function init() {
    const ori = A.scene.ori(); if (built && lastOri === ori) return render(); built = true; lastOri = ori; layer = A.$('#libLayer'); G = geo();
    layer.innerHTML = `<div class="shelfbd" style="left:${G.x - 30}px;top:${G.base - 14}px;width:${G.w + 60}px"><i></i></div><div class="coverflow" id="cf" style="left:${G.x}px;top:${G.y - 140}px;width:${G.w}px;height:${G.h + 140}px"></div>
      <div class="lib__tag" id="libTag" style="left:${A.scene.ori() === 'landscape' ? 360 : G.x + G.w / 2}px;top:${A.scene.ori() === 'landscape' ? 470 : 150}px"></div><p class="lib__note" id="libNote"></p>
      <button class="lib__add" aria-label="Добавить книгу" style="left:${G.add[0]}px;top:${G.add[1]}px"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/></svg></button>`;
    track = A.$('#cf', layer); tag = A.$('#libTag', layer); bind();
    const HS = A.scene.layout().libHs || {}, NM = { lab: ['Алхимия', 'potion'], quotes: ['Архив цитат', 'quotes'] };
    Object.entries(HS).forEach(([k, polys]) => polys.forEach(pl => { const xs = pl.map(q => q[0]), ys = pl.map(q => q[1]), b = A.h(`<button class="lib__hs" data-k="${k}" aria-label="${NM[k][0]}" style="left:${Math.min(...xs)}px;top:${Math.min(...ys)}px;width:${Math.max(...xs) - Math.min(...xs)}px;height:${Math.max(...ys) - Math.min(...ys)}px"><i></i><span>${NM[k][0]}</span></button>`); b.addEventListener('pointerdown', e => e.stopPropagation()); b.addEventListener('click', () => { A.snd.chime && A.snd.chime([392, 523.25], .08, .6); A.vibrate(10); A.go(NM[k][1]); }); layer.appendChild(b); }));
    A.$('.lib__add', layer).addEventListener('pointerdown', e => e.stopPropagation());
    A.$('.lib__add', layer).addEventListener('click', () => { A.snd.coin(); A.fx.sparks(innerWidth / 2, innerHeight * .88, 16); A.mods.books.editBook(); });
    render(); layer.classList.add('hints'); setTimeout(() => layer.classList.remove('hints'), 5200);
  }

  function render() {
    if (!built) return; const list = [...A.state.books].sort((a, b) => order[a.status] - order[b.status] || (b.added || 0) - (a.added || 0));
    track.innerHTML = ''; items = list.map(b => {
      const h = A.hash(b.title), hh = Math.round(G.sh * (.78 + (h % 22) / 100)), sw = G.sw + (h >> 3) % 18;
      const el = A.h(`<div class="bk3 ${b.status}" style="--hu:${hue(b)};--sw:${sw}px;--sh:${hh}px;--cw:${G.cw}px;--ch:${G.ch}px"><button class="bk3__sp" aria-label="${A.esc(b.title)}"><span class="sp__band"></span><b>${A.esc(b.title)}</b><span class="sp__band sp__band--b"></span>${b.status === 'reading' ? '<i class="sp__rib"></i>' : ''}${b.status === 'done' ? '<i class="sp__star"></i>' : ''}</button><div class="bk3__cv">${A.coverHTML(b)}</div></div>`);
      track.appendChild(el); return { b, el, sp: A.$('.bk3__sp', el), cv: A.$('.bk3__cv', el) };
    });
    A.$('#libNote', layer).textContent = list.length ? '' : 'Полка пуста. Нажми «+», чтобы поставить первую книгу.';
    const start = Math.max(0, items.findIndex(i => i.b.status === 'reading')); p = pt = start; pv = 0; draw(); label();
  }
  function draw() {
    const cx = G.w / 2, n = items.length;
    items.forEach((it, i) => {
      const d = i - p, ad = Math.abs(d), lift = Math.max(0, 1 - ad), sgn = Math.sign(d) || 0, x = cx + d * G.step + sgn * Math.min(ad, 1) * G.gap * .55, vis = ad < 7;
      it.el.style.display = vis ? '' : 'none'; if (!vis) return;
      it.el.style.transform = `translate3d(${x.toFixed(1)}px,${(-lift * 46).toFixed(1)}px,${(lift * 120).toFixed(1)}px) rotateY(${(-sgn * Math.min(ad, 1) * 28).toFixed(1)}deg)`;
      it.el.style.zIndex = 100 - Math.round(ad * 10); it.sp.style.display = 'none'; it.cv.style.opacity = '1';
      it.cv.style.transform = `translate(-50%,0) rotateY(${(sgn * Math.min(ad, 1) * -18).toFixed(1)}deg) scale(${(.6 + lift * .4).toFixed(3)})`; it.el.classList.toggle('on', ad < .5);
      it.cv.style.filter = `brightness(${(.55 + lift * .55).toFixed(2)}) drop-shadow(0 ${(14 + lift * 16).toFixed(0)}px 18px rgba(0,0,0,.7))`;
    });
  }
  let lastIdx = -1;
  function label() { const i = A.clamp(Math.round(p), 0, items.length - 1), it = items[i]; if (!it) { tag.style.opacity = 0; return; } if (i !== lastIdx) { lastIdx = i; A.snd.page && A.snd.page(); A.vibrate(6); const b = it.b; tag.innerHTML = `<b>${A.esc(b.title)}</b><small>${A.esc(b.author || '')}${b.hasText ? ' · читать' : ''}</small>`; tag.classList.remove('pop'); void tag.offsetWidth; tag.classList.add('pop'); } tag.style.opacity = 1; }
  function loop() { raf = 0; const dt = .016, k = 180, c = 22; pv += ((pt - p) * k - pv * c) * dt; p += pv * dt; draw(); label(); if (Math.abs(pt - p) > .002 || Math.abs(pv) > .01) raf = requestAnimationFrame(loop); else { p = pt; draw(); } }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const sc = () => { const m = /scale\(([\d.]+)\)/.exec(A.$('#room').style.transform); return m ? +m[1] : 1; };

  function bind() {
    track.addEventListener('pointerdown', e => { e.stopPropagation(); track.setPointerCapture(e.pointerId); drag = { x: e.clientX, p0: p, t: performance.now(), moved: false, lx: e.clientX, lt: performance.now(), v: 0, tg: e.target.closest('.bk3'), long: 0 }; pv = 0;
      if (drag.tg) { const i = items.findIndex(it => it.el === drag.tg); drag.i = i; drag.long = setTimeout(() => { if (drag && !drag.moved && Math.abs(i - p) < .6) { drag.moved = true; A.vibrate(20); A.mods.books.openBook(items[i].b.id); } }, 650); } });
    track.addEventListener('pointermove', e => { if (!drag) return; const k = 1 / sc(), dx = (e.clientX - drag.x) * k; if (!drag.moved && Math.abs(e.clientX - drag.x) > 8) { drag.moved = true; clearTimeout(drag.long); }
      if (drag.moved && drag.i != null || drag.moved) { const now = performance.now(); drag.v = drag.v * .6 + ((e.clientX - drag.lx) * k / Math.max(1, now - drag.lt)) * .4; drag.lx = e.clientX; drag.lt = now; p = A.clamp(drag.p0 - dx / G.step, -.4, items.length - 1 + .4); pt = p; draw(); label(); } });
    const up = () => { if (!drag) return; const d = drag; drag = null; clearTimeout(d.long); if (d.moved) { pt = A.clamp(Math.round(p - d.v * 14), 0, Math.max(0, items.length - 1)); pv = 0; kick(); return; }
      if (d.i == null || d.i < 0) return; const it = items[d.i], far = Math.abs(d.i - p) >= .6; if (far) { pt = d.i; kick(); }
      A.snd.page(); A.vibrate(10); setTimeout(() => { it.el.classList.add('open'); const r = it.cv.getBoundingClientRect(); setTimeout(() => { A.reader.open(it.b, r); setTimeout(() => it.el.classList.remove('open'), 700); }, 240); }, far ? 380 : 0); };
    track.addEventListener('pointerup', up); track.addEventListener('pointercancel', () => { if (drag) { clearTimeout(drag.long); drag = null; pt = Math.round(p); kick(); } });
    track.addEventListener('wheel', e => { e.preventDefault(); pt = A.clamp(Math.round(pt + Math.sign(e.deltaX || e.deltaY)), 0, Math.max(0, items.length - 1)); kick(); }, { passive: false });
  }
  return { init, render, rebuild() { built = false; lastIdx = -1; init(); }, show() { init(); } };
})();
