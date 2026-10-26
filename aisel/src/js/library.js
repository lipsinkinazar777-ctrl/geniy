/* ============================================================ the reading room: leather spines on three shelves; touching one pulls it out and opens it */
A.lib = (() => {
  let layer, rows = [], built = false;
  const ROWS_Y = [380, 760, 1140];
  const hue = b => (b.cover && b.cover.hue != null) ? b.cover.hue : (A.hash(b.title + (b.author || '')) % 360);
  const dims = b => { const h = A.hash(b.title); return { w: 40 + (h % 26) + Math.min(14, Math.round((b.pages || 120) / 60)), h: 240 + (h >> 3) % 84 }; };
  const order = { reading: 0, want: 1, done: 2 };

  function init() {
    if (built) return render(); built = true; layer = A.$('#libLayer');
    layer.innerHTML = `<div class="lib__t"><small>читальный зал</small><b>Книги Айсель</b></div>
      ${ROWS_Y.map(y => `<div class="shelf3" style="top:${y}px"><div class="shelf3__in"></div></div>`).join('')}
      <button class="lib__lect" aria-label="Продолжить чтение"></button>
      <button class="lib__add" aria-label="Добавить книгу"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/></svg></button>
      <p class="lib__note" id="libNote"></p>`;
    rows = A.$$('.shelf3', layer);
    rows.forEach(r => drag(r));
    A.$('.lib__add', layer).addEventListener('pointerdown', e => e.stopPropagation());
    A.$('.lib__add', layer).addEventListener('click', () => { A.snd.coin(); A.fx.sparks(innerWidth / 2, innerHeight * .88, 16); A.mods.books.editBook(); });
    A.$('.lib__lect', layer).addEventListener('click', () => { const b = A.state.books.find(x => x.status === 'reading' && x.hasText) || A.state.books.find(x => x.hasText); if (b) openText(b, A.$('.lib__lect', layer)); else { A.snd.owl(); A.toast('Загрузи книгу с текстом кнопкой «+», и она ляжет сюда'); } });
    render();
  }

  function render() {
    if (!built) return; const list = [...A.state.books].sort((a, b) => order[a.status] - order[b.status] || (b.added || 0) - (a.added || 0));
    const inner = rows.map(r => A.$('.shelf3__in', r)); inner.forEach(n => { n.innerHTML = ''; n._w = 0; n.style.transform = ''; n._x = 0; });
    list.forEach(b => {
      const d = dims(b), tgt = inner.reduce((m, n) => n._w < m._w ? n : m, inner[0]), hh = hue(b);
      const el = A.h(`<button class="sp ${b.status}" data-id="${b.id}" style="--w:${d.w}px;--h:${d.h}px;--hu:${hh};--fs:${Math.max(15, Math.min(25, Math.round((d.h - 104) / Math.max(6, b.title.length) / .52)))}px" aria-label="${A.esc(b.title)}">${b.status === 'reading' ? '<i class="sp__rib"></i>' : ''}<span class="sp__band"></span><b>${A.esc(b.title)}</b><em>${A.esc((b.author || '').split(/[ ,]+/).pop() || '')}</em><span class="sp__band sp__band--b"></span>${b.status === 'done' ? '<i class="sp__star"></i>' : ''}${b.hasText ? '<i class="sp__txt"></i>' : ''}</button>`);
      el._b = b; tgt.appendChild(el); tgt._w += d.w + 7;
    });
    A.$('#libNote', layer).textContent = list.length ? '' : 'Полки пусты. Нажми «+», чтобы поставить первую книгу.';
  }

  /* drag a shelf sideways; a tap pulls the spine out */
  function drag(row) {
    const inner = A.$('.shelf3__in', row); let st = null, vel = 0, raf = 0;
    const lim = () => Math.min(0, row.clientWidth - inner._w - 40);
    const set = x => { inner._x = A.clamp(x, lim() - 60, 60); inner.style.transform = `translate3d(${inner._x}px,0,0)`; };
    const settle = () => { cancelAnimationFrame(raf); const step = () => { const l = lim(), over = inner._x > 0 ? 0 - inner._x : inner._x < l ? l - inner._x : 0; vel *= .94; set(inner._x + vel + over * .16); if (Math.abs(vel) > .3 || Math.abs(over) > .5) raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); };
    row.addEventListener('pointerdown', e => { e.stopPropagation(); row.setPointerCapture(e.pointerId); st = { x: e.clientX, y: e.clientY, x0: inner._x, moved: false, t: performance.now(), tg: e.target.closest('.sp'), lx: e.clientX, long: setTimeout(() => { if (st && !st.moved && st.tg) { st.moved = true; A.vibrate(20); A.mods.books.openBook(st.tg.dataset.id); } }, 560) }; cancelAnimationFrame(raf); });
    row.addEventListener('pointermove', e => { if (!st) return; const k = 1 / (A.$('#room') ? sc() : 1), dx = (e.clientX - st.x) * k; if (!st.moved && Math.abs(e.clientX - st.x) > 8) { st.moved = true; clearTimeout(st.long); } if (st.moved && !st.done) { vel = (e.clientX - st.lx) * k; st.lx = e.clientX; set(st.x0 + dx); } });
    const up = e => { if (!st) return; const s = st; st = null; clearTimeout(s.long); if (!s.moved && s.tg && performance.now() - s.t < 500) pull(s.tg); else settle(); };
    row.addEventListener('pointerup', up); row.addEventListener('pointercancel', () => { st = null; settle(); });
  }
  const sc = () => { const m = /scale\(([\d.]+)\)/.exec(A.$('#room').style.transform); return m ? +m[1] : 1; };
  function pull(sp) { A.snd.page(); A.vibrate(10); A.$$('.sp.out', layer).forEach(x => x.classList.remove('out')); sp.classList.add('out'); const b = sp._b; setTimeout(() => { if (b.hasText) openText(b, sp); else A.mods.books.openBook(b.id); setTimeout(() => sp.classList.remove('out'), 600); }, 360); }
  function openText(b, el) { A.reader.open(b, el.getBoundingClientRect()); }

  return { init, render, show() { render(); A.rise && 0; } };
})();
