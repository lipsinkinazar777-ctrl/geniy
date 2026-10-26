/* ============================================================ the reader: a book unfolds from its cover into night-black pages
   paged with CSS columns; drag follows the finger, release settles on a spring; font, size, spacing and paper are adjustable */
A.reader = (() => {
  const FONTS = { serif: '"Cormorant Garamond",Georgia,serif', book: 'Georgia,"Times New Roman",serif', sans: '"Inter Tight",system-ui,sans-serif' };
  const THEMES = { oled: ['#000', '#d9d3c4', '#e9c984'], sepia: ['#f1e4c7', '#3b2a17', '#8a5a1f'], dusk: ['#0b1018', '#c9d3e6', '#8fb0ff'] };
  const DEF = { size: 22, font: 'serif', lh: 1.6, theme: 'oled' };
  let el, b, view, flow, pw = 0, ph = 0, pages = 1, cur = 0, maxSeen = 0, off = 0, offV = 0, offT = 0, raf = 0, open_ = false, fromRect = null, drag = null, p = null;
  const prefs = () => Object.assign({}, DEF, A.state.settings.reader || {});

  function build() {
    el = A.h(`<div id="reader" class="rd" hidden><div class="rd__bar"><button class="rd__b" id="rdBack" aria-label="Закрыть"><svg viewBox="0 0 24 24" class="ico"><path d="M14.500 5.500 8 12l6.500 6.500" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="rd__t"><b id="rdT"></b><small id="rdA"></small></div><button class="rd__b rd__b--aa" id="rdAa" aria-label="Шрифт и фон">Aa</button><button class="rd__b" id="rdInfo" aria-label="О книге"><svg viewBox="0 0 24 24" class="ico"><circle cx="5.500" cy="12" r="1.100" fill="currentColor"/><circle cx="12" cy="12" r="1.100" fill="currentColor"/><circle cx="18.500" cy="12" r="1.100" fill="currentColor"/></svg></button></div>
      <div class="rd__view" id="rdView"><div class="rd__flow" id="rdFlow"></div></div><div class="rd__edge rd__edge--l"></div><div class="rd__edge rd__edge--r"></div>
      <div class="rd__foot"><div class="rd__line"><i id="rdProg"></i></div><span id="rdPg"></span></div><button class="rd__fin" id="rdFin" hidden>Дочитала</button>
      <div class="rd__set" id="rdSet"><div class="rd__row"><span>Размер</span><input type="range" min="16" max="34" step="1" id="rdSize"></div>
      <div class="rd__row"><span>Шрифт</span><div class="rd__seg" id="rdFont"><button data-v="serif" style="font-family:${FONTS.serif}">Сказка</button><button data-v="book" style="font-family:${FONTS.book}">Книга</button><button data-v="sans" style="font-family:${FONTS.sans}">Строгий</button></div></div>
      <div class="rd__row"><span>Строки</span><div class="rd__seg" id="rdLh"><button data-v="1.4">Плотно</button><button data-v="1.6">Ровно</button><button data-v="1.85">Свободно</button></div></div>
      <div class="rd__row"><span>Фон</span><div class="rd__seg rd__seg--th" id="rdTh"><button data-v="oled" style="--c:#000"><i></i>Ночь</button><button data-v="dusk" style="--c:#0b1018"><i></i>Сумерки</button><button data-v="sepia" style="--c:#f1e4c7"><i></i>Бумага</button></div></div></div></div>`);
    document.body.appendChild(el); view = A.$('#rdView', el); flow = A.$('#rdFlow', el);
    A.$('#rdBack', el).addEventListener('click', () => close()); A.$('#rdInfo', el).addEventListener('click', () => { A.snd.tap(); A.mods.books.openBook(b.id); });
    A.$('#rdAa', el).addEventListener('click', () => { A.snd.tap(); el.classList.toggle('setting'); });
    const set = (k, v) => { A.state.settings.reader = Object.assign(prefs(), { [k]: v }); A.save(); style(); paginate(true); mark(); };
    A.$('#rdSize', el).addEventListener('input', e => set('size', +e.target.value));
    [['#rdFont', 'font', x => x], ['#rdLh', 'lh', x => +x], ['#rdTh', 'theme', x => x]].forEach(([s, k, f]) => A.$(s, el).addEventListener('click', e => { const t = e.target.closest('button'); if (t) { A.snd.tap(); set(k, f(t.dataset.v)); } }));
    A.$('#rdFin', el).addEventListener('click', () => { const bk = b; close(); setTimeout(() => { if (bk.status !== 'done') { bk.status = 'done'; bk.finished = null; A.finishBook(bk); A.mods.books && A.mods.books.refresh(); } }, 700); });
    // pages
    view.addEventListener('pointerdown', e => { if (el.classList.contains('setting')) { el.classList.remove('setting'); return; } view.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, t: performance.now(), lx: e.clientX, lt: performance.now(), v: 0, on: false }; });
    view.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.on && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) { drag.on = true; cancelAnimationFrame(raf); raf = 0; }
      if (drag.on) { const now = performance.now(); drag.v = drag.v * .6 + ((e.clientX - drag.lx) / Math.max(1, now - drag.lt)) * .4; drag.lx = e.clientX; drag.lt = now; let o = dx; if ((cur === 0 && dx > 0) || (cur === pages - 1 && dx < 0)) o = dx * .28; off = o; offV = 0; paint(); } });
    const end = e => { if (!drag) return; const d = drag; drag = null; if (!d.on) { if (performance.now() - d.t < 450) { const x = e.clientX / innerWidth; if (x < .3) go(-1); else if (x > .7) go(1); else el.classList.toggle('chrome'); } return; }
      const dx = e.clientX - d.x; if ((dx < -pw * .16 || d.v < -.45) && cur < pages - 1) go(1, true); else if ((dx > pw * .16 || d.v > .45) && cur > 0) go(-1, true); else settle(); };
    view.addEventListener('pointerup', end); view.addEventListener('pointercancel', () => { drag = null; settle(); });
    addEventListener('keydown', e => { if (!open_) return; if (e.key === 'Escape') { e.stopImmediatePropagation(); close(); } else if (e.key === 'ArrowRight' || e.key === ' ') go(1); else if (e.key === 'ArrowLeft') go(-1); }, true);
    addEventListener('resize', () => open_ && paginate(true));
  }
  const esc = A.esc;
  function html(text) {
    return text.replace(/\r/g, '').split(/\n\s*\n/).map(par => { par = par.trim(); if (!par) return ''; if (/^#{1,3}\s/.test(par)) return `<h2>${esc(par.replace(/^#+\s*/, ''))}</h2>`;
      const lines = par.split('\n').map(s => s.trim()), avg = lines.reduce((s, l) => s + l.length, 0) / lines.length;
      return `<p>${esc(avg > 48 || lines.length === 1 ? lines.join(' ') : lines.join('\n'))}</p>`; }).join('');
  }
  function style() {
    const P = prefs(), T = THEMES[P.theme]; el.dataset.th = P.theme; el.style.setProperty('--bg', T[0]); el.style.setProperty('--fg', T[1]); el.style.setProperty('--ac', T[2]);
    flow.style.fontFamily = FONTS[P.font]; flow.style.fontSize = P.size + 'px'; flow.style.lineHeight = P.lh;
    A.$('#rdSize', el).value = P.size; mark(); document.querySelector('meta[name=theme-color]').setAttribute('content', T[0]);
  }
  function mark() { const P = prefs(); A.$$('#rdFont button', el).forEach(x => x.classList.toggle('on', x.dataset.v === P.font)); A.$$('#rdLh button', el).forEach(x => x.classList.toggle('on', +x.dataset.v === P.lh)); A.$$('#rdTh button', el).forEach(x => x.classList.toggle('on', x.dataset.v === P.theme)); }
  function paginate(keep) {
    const frac = keep && pages ? cur / pages : (b.pos || 0); pw = view.clientWidth; ph = view.clientHeight;
    flow.style.cssText += `;width:${pw}px;height:${ph}px;column-width:${pw - 56}px;column-gap:56px;padding:0 28px;box-sizing:border-box`;
    pages = Math.max(1, Math.round((flow.scrollWidth - 1) / pw)); cur = A.clamp(Math.round(frac * pages - .001 * 0), 0, pages - 1); if (!keep) cur = A.clamp(Math.floor((b.pos || 0) * pages), 0, pages - 1);
    off = 0; paint(); foot();
  }
  function paint() { const o = -cur * pw + off, k = Math.min(1, Math.abs(off) / pw); flow.style.transform = `translate3d(${o}px,0,0) scale(${1 - k * .025})`; el.style.setProperty('--sh', (k * .9).toFixed(3)); el.dataset.dir = off < 0 ? 'l' : 'r'; }
  function settle() { offT = 0; run(); }
  function go(d, fromDrag) {
    const n = cur + d; if (n < 0 || n >= pages) { if (!fromDrag) { offT = d > 0 ? -34 : 34; run(); setTimeout(settle, 140); } return; }
    if (!fromDrag) { off = 0; }
    off += d * pw; cur = n; maxSeen = Math.max(maxSeen, cur); offT = 0; A.snd.page(); foot(); b.pos = cur / pages; A.save(); run();   // the page travels from where the finger left it into place
  }
  function run() { if (raf) return; let last = performance.now(); const f = now => { const dt = Math.min(.034, (now - last) / 1000); last = now; offV += ((offT - off) * 190 - offV * 25) * dt; off += offV * dt; paint(); if (Math.abs(off - offT) < .3 && Math.abs(offV) < 4) { off = offT; offV = 0; paint(); raf = 0; return; } raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); }
  function foot() {
    A.$('#rdPg', el).textContent = `${cur + 1} из ${pages}`; A.$('#rdProg', el).style.transform = `scaleX(${(cur + 1) / pages})`;
    A.$('#rdFin', el).hidden = !(cur === pages - 1 && b.status !== 'done');
  }

  function openReader(book, rect) {
    if (!el) build(); b = book; open_ = true; fromRect = rect || null; cancelAnimationFrame(raf); raf = 0;
    A.$('#rdT', el).textContent = b.title; A.$('#rdA', el).textContent = b.author || ''; flow.innerHTML = html(b.text || ''); style();
    el.hidden = false; el.classList.remove('setting'); el.classList.add('chrome'); if (b.status === 'want') { b.status = 'reading'; b.started = b.started || Date.now(); } p = b.read || 0;
    if (!b.pages) b.pages = A.pagesEst(b.text); maxSeen = 0; A.save();
    paginate(false); maxSeen = cur; A.snd.page(); A.snd.setMood('books');
    if (!A.reduceMotion) { const r = fromRect, W = innerWidth, H = innerHeight, from = r ? `inset(${r.top}px ${W - r.right}px ${H - r.bottom}px ${r.left}px round 8px)` : 'inset(46% 20% 46% 20% round 18px)';
      el.animate([{ clipPath: from, opacity: .2 }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 }], { duration: 760, easing: 'cubic-bezier(.3,.9,.15,1)' });
      flow.animate([{ opacity: 0, transform: `translate3d(${-cur * pw}px,18px,0) scale(.98)` }, { opacity: 1, transform: `translate3d(${-cur * pw}px,0,0) scale(1)` }], { duration: 700, delay: 280, easing: 'ease-out', fill: 'backwards' }); }
  }
  function close() {
    if (!open_) return; open_ = false; b.pos = cur / pages; const reached = Math.round((maxSeen + 1) / pages * (b.pages || A.pagesEst(b.text))), delta = Math.min(reached, b.pages || reached) - (b.read || 0); A.save();
    const fin = () => { el.hidden = true; el.getAnimations().forEach(a => a.cancel()); document.querySelector('meta[name=theme-color]').setAttribute('content', '#000'); A.snd.setMood(A.tab || 'room'); if (delta > 0 && b.status !== 'done') A.logPages(delta, b.id); A.mods.books && A.mods.books.refresh && A.mods.books.refresh(); };
    if (A.reduceMotion) return fin(); const r = fromRect, W = innerWidth, H = innerHeight, to = r ? `inset(${r.top}px ${W - r.right}px ${H - r.bottom}px ${r.left}px round 8px)` : 'inset(46% 20% 46% 20% round 18px)';
    el.animate([{ clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 }, { clipPath: to, opacity: .1 }], { duration: 560, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' }).finished.then(fin);
  }
  return { open: openReader, close, isOpen: () => open_ };
})();
A.pagesEst = t => Math.max(1, Math.round((t || '').length / 1800));
