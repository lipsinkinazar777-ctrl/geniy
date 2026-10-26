/* ============================================================ the archive of quotes: a parchment scroll unrolls out of the drawer, held between two wooden rods.
   the paper wraps around the rods (entries tilt away and fade toward the edges like a cylinder); swipe to roll it, the newest quote is written by the quill when the scroll opens. */
A.casket = (() => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const list = () => A.state.quotes.slice().sort((a, b) => b.date - a.date);
  let el, scroll, view, listEl, hintEl, cntEl, built = false, open = false, entries = [], y = 0, yv = 0, yt = 0, vh = 0, raf = 0, drag = null, wrote = false, moved = 0, busy = false;
  const srcLine = q => { const b = q.bookId && A.bookById(q.bookId), t = b ? b.title : q.bookTitle, a = b ? b.author : q.author; return [t && `«${t}»`, a].filter(Boolean).join(' · '); };
  const sizeFor = n => Math.round((n > 220 ? 21 : n > 140 ? 24 : n > 80 ? 27 : 31) * (innerWidth > innerHeight ? .78 : 1));
  const dfmt = ts => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  function build() {
    if (built) return; built = true;
    el = A.h(`<div id="cask" hidden><div class="cask__veil"></div>
      <div class="cask__scroll" id="cskScroll"><div class="sc__rod sc__rod--t"><i></i><i></i></div>
        <div class="sc__paper"><div class="sc__view" id="cskView"><div class="sc__list" id="cskList"></div></div><i class="sc__sh sc__sh--t"></i><i class="sc__sh sc__sh--b"></i></div>
        <div class="sc__rod sc__rod--b"><i></i><i></i></div></div>
      <p class="cask__count" id="ckCnt"></p><p class="cask__hint" id="ckHint"></p>
      <button class="cask__add seal" id="ckAdd"><svg viewBox="0 0 24 24" class="ico"><use href="#i-quill"/></svg>Записать цитату</button></div>`);
    document.body.appendChild(el); scroll = A.$('#cskScroll', el); view = A.$('#cskView', el); listEl = A.$('#cskList', el); hintEl = A.$('#ckHint', el); cntEl = A.$('#ckCnt', el);
    A.$('#ckAdd', el).addEventListener('click', () => { A.snd.tap(); A.mods.quotes.editQuote(); });
    view.addEventListener('pointerdown', e => { if (!open) return; view.setPointerCapture(e.pointerId); drag = { y: e.clientY, y0: y, t: performance.now(), ly: e.clientY, lt: performance.now(), v: 0, moved: false, tg: e.target.closest('.sq') }; yv = 0; });
    view.addEventListener('pointermove', e => { if (!drag) return; if (!drag.moved && Math.abs(e.clientY - drag.y) > 8) drag.moved = true;
      if (drag.moved) { const now = performance.now(); drag.v = drag.v * .6 + ((e.clientY - drag.ly) / Math.max(1, now - drag.lt)) * .4; drag.ly = e.clientY; drag.lt = now; y = yt = clampY(drag.y0 - (e.clientY - drag.y), .08); kick(); } });
    const end = () => { if (!drag) return; const d = drag; drag = null; if (d.moved) { moved = performance.now(); yt = clampY(y - d.v * 260); snap(); kick(); return; }
      if (d.tg) { const q = list()[+d.tg.dataset.i]; if (q) { A.vibrate(10); A.snd.page && A.snd.page(); A.mods.quotes.view(q.id); } } };
    view.addEventListener('pointerup', end); view.addEventListener('pointercancel', () => { drag = null; });
    view.addEventListener('wheel', e => { if (!open) return; e.preventDefault(); yt = clampY(yt + e.deltaY); snap(); kick(); }, { passive: false });
    addEventListener('keydown', e => { if (!open || (A.bookview && A.bookview.isOpen())) return; if (e.key === 'ArrowDown') { stepTo(1); } else if (e.key === 'ArrowUp') { stepTo(-1); } });
    addEventListener('resize', () => { if (open) fill(); });
  }
  const clampY = (v, slack = 0) => { const max = Math.max(0, (entries.length ? entries[entries.length - 1].c : 0)); return A.clamp(v, -slack * vh, max + slack * vh); };
  function snap() { if (!entries.length) return; let best = 0, bd = 1e9; entries.forEach((e, i) => { const d = Math.abs(e.c - yt); if (d < bd) { bd = d; best = i; } }); yt = entries[best].c; }
  function stepTo(d) { const i = nearest() + d; if (i < 0 || i >= entries.length) return; yt = entries[i].c; kick(); }
  const nearest = () => { let best = 0, bd = 1e9; entries.forEach((e, i) => { const d = Math.abs(e.c - y); if (d < bd) { bd = d; best = i; } }); return best; };

  /* the entries: each a handwritten quote with its source; positions are measured once and reused every frame */
  function fill() {
    const qs = list(); vh = view.clientHeight; listEl.style.paddingTop = listEl.style.paddingBottom = Math.round(vh * .5) + 'px';
    if (!qs.length) { listEl.innerHTML = `<article class="sq sq--empty" data-i="-1"><i class="sq__orn"></i><p class="sq__t" style="font-size:25px">Свиток пока чист.<br>Запиши первую строку, которая запомнилась.</p></article>`; }
    else listEl.innerHTML = qs.map((q, i) => `<article class="sq" data-i="${i}"><i class="sq__orn"></i><p class="sq__t" style="font-size:${sizeFor(q.text.length)}px">${A.esc(q.text)}</p><cite>${A.esc(srcLine(q))}${q.page ? ', стр. ' + A.esc(q.page) : ''}</cite><small>${dfmt(q.date)}</small>${q.tags && q.tags.length ? `<div class="sq__tags">${q.tags.map(t => `<i>#${A.esc(t)}</i>`).join('')}</div>` : ''}${q.sticker ? `<span class="sq__stk" style="--r:${(A.hash(q.id) % 40) - 20}deg">${q.sticker}</span>` : ''}${q.photo ? `<div class="sq__ph" style="--r:${(A.hash(q.id + 'p') % 10) - 5}deg"><img src="${q.photo}" alt=""></div>` : ''}</article>`).join('');
    entries = [...A.$$('.sq', listEl)].map(n => ({ n, c: n.offsetTop + n.offsetHeight / 2 - vh / 2, h: n.offsetHeight }));
    y = yt = entries.length ? A.clamp(y, 0, entries[entries.length - 1].c) : 0; if (entries.length) { let b = 0; entries.forEach((e, i) => { if (Math.abs(e.c - y) < Math.abs(entries[b].c - y)) b = i; }); y = yt = entries[b].c; } paint(); cntEl.textContent = qs.length ? `${nearest() + 1} / ${qs.length}` : '';
  }
  function paint() {
    const half = vh / 2;
    entries.forEach(e => {
      const rel = e.c - y;                                         // distance of the entry's centre from the middle of the view
      if (Math.abs(rel) > vh * 1.1 + e.h) { if (e.on) { e.n.style.visibility = 'hidden'; e.on = false; } return; } if (!e.on) { e.n.style.visibility = ''; e.on = true; }
      const t = A.clamp(rel / half, -1.4, 1.4), a = -t * 34, ab = Math.abs(t);
      e.n.style.transform = `translate3d(0,${(rel * -0).toFixed(1)}px,${(-ab * ab * 90).toFixed(1)}px) rotateX(${a.toFixed(2)}deg) scale(${(1 - ab * .06).toFixed(3)})`; e.n.style.opacity = A.clamp(1.25 - Math.max(0, ab - .55) * 1.9, 0, 1).toFixed(3);
    });
    listEl.style.transform = `translate3d(0,${(-y).toFixed(1)}px,0)`;
  }
  function loop(now) {
    raf = 0; if (!open) return; if (!drag) { yv += ((yt - y) * 120 - yv * 17) * .016; y += yv * .016; }
    paint(); const i = nearest(); cntEl.textContent = entries.length && list().length ? `${i + 1} / ${list().length}` : '';
    if (drag || Math.abs(yt - y) > .3 || Math.abs(yv) > 1) raf = requestAnimationFrame(loop); else { y = yt; paint(); }
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  async function enter() {
    build(); if (open) return; open = true; busy = true; wrote = false; y = yt = 0; yv = 0; el.hidden = false; void el.offsetWidth; el.classList.add('on'); hintEl.classList.remove('on');
    fill();
    const r = scroll.getBoundingClientRect(), mid = r.top + r.height / 2, H = innerHeight;
    A.snd.page && A.snd.page(); A.snd.quill && A.snd.quill();
    const a = scroll.animate([{ top: mid - 34 + 'px', bottom: H - mid - 34 + 'px', opacity: 0, filter: 'brightness(.6)' }, { opacity: 1, offset: .25 }, { top: r.top + 'px', bottom: H - r.bottom + 'px', opacity: 1, filter: 'none' }], { duration: 1150, easing: 'cubic-bezier(.25,.9,.25,1)' });   // the scroll unrolls from its middle, right where it will stay
    await a.finished; busy = false; kick();
    if (list().length && !A.state.arcTip) { A.state.arcTip = true; A.save(); A.toast('Листай свиток пальцем. Нажми на цитату, чтобы поделиться.', 4200); }
    if (list().length && !wrote && open) { wrote = true; await wait(500); const first = A.$('.sq .sq__t', listEl); if (first && open) { try { await A.quill.write(first, { box: scroll, cps: Math.min(34, Math.max(18, first.textContent.length / 5)) }); } catch (e) {} } }
  }
  function hide() { if (!el) return; open = false; busy = false; el.classList.remove('on'); A.quill.hide(); hintEl.classList.remove('on'); cntEl.textContent = ''; setTimeout(() => { if (!open) el.hidden = true; }, 500); }
  return { enter, hide, leave: async () => { hide(); }, relayout() {}, refresh() { if (open && !busy) { fill(); } }, get isOpen() { return open; } };
})();
