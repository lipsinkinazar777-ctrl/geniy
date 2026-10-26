/* ============================================================ the reading room: leather spines on three shelves; touching one pulls it out and opens it */
A.lib = (() => {
  let layer, rows = [], built = false, lastOri = '';
  const LC = { portrait: { w: 1080, rows: [[380, 104, 872, 340], [760, 104, 872, 340], [1140, 104, 872, 340]], title: [118, 540], add: [540, 1650], lect: null }, landscape: { w: 1920, rows: [[250, 120, 1540, 310], [590, 120, 1540, 310]], title: [150, 960], add: [1790, 540], lect: null } };
  const hue = b => (b.cover && b.cover.hue != null) ? b.cover.hue : (A.hash(b.title + (b.author || '')) % 360);
  const dims = (b, ph) => { const h = A.hash(b.title); return { w: 78 + (h % 30), h: Math.round(ph * (.7 + ((h >> 4) % 28) / 100)) }; };
  const order = { reading: 0, want: 1, done: 2 };

  function init() {
    const ori = A.scene.ori(); if (built && lastOri === ori) return render(); built = true; lastOri = ori; layer = A.$('#libLayer'); const C = LC[ori];
    layer.innerHTML = `<div class="lib__t" style="top:${C.title[0]}px"><small>читальный зал</small><b>Книги Айсель</b></div>
      ${C.rows.map(([y, x, w, h]) => `<div class="shelf3" style="top:${y}px;left:${x}px;width:${w}px;height:${h}px"><div class="shelf3__in"></div></div>`).join('')}
      <button class="lib__add" aria-label="Добавить книгу" style="left:${C.add[0]}px;top:${C.add[1]}px"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/></svg></button>
      <div class="lib__tag" id="libTag"></div><p class="lib__note" id="libNote"></p>`;
    rows = A.$$('.shelf3', layer); rows.forEach(r => drag(r));
    A.$('.lib__add', layer).addEventListener('pointerdown', e => e.stopPropagation());
    A.$('.lib__add', layer).addEventListener('click', () => { A.snd.coin(); A.fx.sparks(innerWidth / 2, innerHeight * .88, 16); A.mods.books.editBook(); });
    render();
  }

  function render() {
    if (!built) return; const C = LC[lastOri], list = [...A.state.books].sort((a, b) => order[a.status] - order[b.status] || (b.added || 0) - (a.added || 0));
    const inner = rows.map(r => A.$('.shelf3__in', r)); inner.forEach(n => { n.innerHTML = ''; n._w = 0; n.style.transform = ''; n._x = 0; });
    list.forEach(b => {
      const ph = C.rows[0][3] - 70, d = dims(b, ph), tgt = inner.reduce((m, n) => n._w < m._w ? n : m, inner[0]), hh = hue(b), len = b.title.length;
      const fs = Math.max(20, Math.min(30, Math.round((d.h - 120) / Math.max(7, len * .56))));
      const el = A.h(`<button class="sp ${b.status}" data-id="${b.id}" style="--w:${d.w}px;--h:${d.h}px;--hu:${hh};--fs:${fs}px" aria-label="${A.esc(b.title)}">${b.status === 'reading' ? '<i class="sp__rib"></i>' : ''}<span class="sp__band"></span><b>${A.esc(b.title)}</b><span class="sp__band sp__band--b"></span>${b.status === 'done' ? '<i class="sp__star"></i>' : ''}${b.cover && b.cover.img ? `<i class="sp__cov" style="background-image:url(${b.cover.img})"></i>` : ''}</button>`);
      el._b = b; tgt.appendChild(el); tgt._w += d.w + 9;
    });
    A.$('#libNote', layer).textContent = list.length ? '' : 'Полки пусты. Нажми «+», чтобы поставить первую книгу.';
  }

  function drag(row) {
    const inner = A.$('.shelf3__in', row); let st = null, vel = 0, raf = 0;
    const lim = () => Math.min(0, row.clientWidth - inner._w - 40);
    const set = x => { inner._x = A.clamp(x, lim() - 80, 80); inner.style.transform = `translate3d(${inner._x}px,0,0)`; };
    const settle = () => { cancelAnimationFrame(raf); const step = () => { const l = lim(), over = inner._x > 0 ? 0 - inner._x : inner._x < l ? l - inner._x : 0; vel *= .94; set(inner._x + vel + over * .16); if (Math.abs(vel) > .3 || Math.abs(over) > .5) raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); };
    row.addEventListener('pointerdown', e => { e.stopPropagation(); row.setPointerCapture(e.pointerId); st = { x: e.clientX, x0: inner._x, moved: false, t: performance.now(), tg: e.target.closest('.sp'), lx: e.clientX, long: setTimeout(() => { if (st && !st.moved && st.tg) { st.moved = true; A.vibrate(20); A.mods.books.openBook(st.tg.dataset.id); } }, 650) }; cancelAnimationFrame(raf); if (st.tg) tag(st.tg); });
    row.addEventListener('pointermove', e => { if (!st) return; const k = 1 / sc(); if (!st.moved && Math.abs(e.clientX - st.x) > 8) { st.moved = true; clearTimeout(st.long); hideTag(); } if (st.moved) { vel = (e.clientX - st.lx) * k; st.lx = e.clientX; set(st.x0 + (e.clientX - st.x) * k); } });
    const up = () => { if (!st) return; const s = st; st = null; clearTimeout(s.long); hideTag(); if (!s.moved && s.tg && performance.now() - s.t < 500) pull(s.tg); else settle(); };
    row.addEventListener('pointerup', up); row.addEventListener('pointercancel', () => { st = null; hideTag(); settle(); });
  }
  const sc = () => { const m = /scale\(([\d.]+)\)/.exec(A.$('#room').style.transform); return m ? +m[1] : 1; };
  function tag(sp) { const t = A.$('#libTag', layer), r = sp.getBoundingClientRect(), lr = layer.getBoundingClientRect(), k = 1 / sc(); t.textContent = sp._b.title + (sp._b.author ? ' · ' + sp._b.author : ''); t.style.cssText = `left:${(r.left + r.width / 2 - lr.left) * k}px;top:${(r.top - lr.top) * k - 20}px;opacity:1`; }
  function hideTag() { const t = A.$('#libTag', layer); t && (t.style.opacity = 0); }
  function pull(sp) { A.snd.page(); A.vibrate(10); sp.classList.add('out'); const b = sp._b, r = sp.getBoundingClientRect(); setTimeout(() => { A.reader.open(b, r); setTimeout(() => sp.classList.remove('out'), 700); }, 280); }

  return { init, render, rebuild() { built = false; init(); }, show() { init(); } };
})();
