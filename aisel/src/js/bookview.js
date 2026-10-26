/* ============================================================ the book she reads in: an open leather book with real page turns.
   three ribbons switch what the pages hold:  Читать (the text, paginated live) · Впечатление (stamps, stars, her own words) · Цитаты (this book's quotes; a new one is written by the quill)
   landscape shows a spread, portrait one page; a page follows the finger, settles on a spring, and a hand pinches the corner while it turns. */
A.bookview = (() => {
  const FONTS = { serif: '"Cormorant Garamond",Georgia,serif', book: 'Georgia,"Times New Roman",serif', sans: '"Inter Tight",system-ui,sans-serif' };
  const HAND = '"Marck Script","Caveat","Segoe Script",cursive';
  const IMP = ['Мурашки', 'Плакала', 'Не оторваться', 'Уютная', 'Затянуло', 'Заставила думать', 'Смеялась', 'Разочарование'];
  const ST = { want: 'Хочу', reading: 'Читаю', done: 'Прочитано' };
  const prefs = () => Object.assign({ size: 21, font: 'serif', theme: 'parch' }, A.state.settings.reader || {});
  const wait = ms => new Promise(r => setTimeout(r, ms)), esc = A.esc;
  const TABS = [['read', 'Читать'], ['impr', 'Впечатление'], ['quotes', 'Цитаты']];
  let posT = 0, stillT = 0, warmT = 0, el, book, bookEl, pgL, pgR, leaf, castL, castR, fsh, strips = [], stage, g, open_ = false, onClose = null, S = { tab: 'read', i: 0 }, fl = null, raf = 0, maxFrac = 0, pager = null, qpager = null, textLen = 0, hasText = false, comp = { text: '', page: '' }, drag = null, pressT = 0, selPara = null, busyW = false, freshId = null;

  /* ---------------------------------------------------------------- pagination (lazy: a page is measured only when it is needed) */
  function makePager(paras, measure) {
    const starts = [{ p: 0, o: 0 }], pages = [], cum = []; let tot = 0, finished = !paras.length;
    paras.forEach(q => { cum.push(tot); tot += q.text.length + 1; });
    const over = () => measure.scrollHeight > measure.clientHeight + 1;
    const node = (q, text, cont) => { let e; if (q.html) { e = document.createElement('div'); e.innerHTML = q.html; e = e.firstElementChild; } else { e = document.createElement(q.h ? 'h2' : 'p'); e.textContent = text; } if (cont) e.classList.add('cont'); return e; };
    function build(n) {
      const st = starts[n]; measure.innerHTML = ''; let p = st.p, o = st.o, first = true;
      while (p < paras.length) {
        const q = paras[p], full = q.text.slice(o), e = node(q, full, o > 0); measure.appendChild(e);
        if (!over()) { p++; o = 0; first = false; continue; }
        if (q.keep || q.h) { if (!first) { measure.removeChild(e); } else { p++; o = 0; } break; }
        let lo = 0, hi = full.length;
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; e.textContent = full.slice(0, mid); if (over()) hi = mid; else lo = mid; }
        let cut = lo; const sp = full.lastIndexOf(' ', cut); if (sp > cut * .5) cut = sp;
        if (cut <= 0) { if (!first) { measure.removeChild(e); break; } const ws = full.indexOf(' '); cut = ws > 0 ? ws : full.length; }
        e.textContent = full.slice(0, cut).trimEnd(); const rest = full.slice(cut); o += cut + (rest.length - rest.trimStart().length); if (o >= q.text.length) { p++; o = 0; } break;
      }
      return { html: measure.innerHTML, next: p >= paras.length ? null : { p, o } };
    }
    const startChar = s => cum[s.p] + s.o;
    const api = {
      get(n) { while (pages.length <= n && !finished) { const r = build(pages.length); pages.push(r.html); if (r.next) starts.push(r.next); else finished = true; } return pages[n] != null ? pages[n] : null; },
      count() { if (finished) return pages.length; const last = starts[starts.length - 1], done = startChar(last) / Math.max(1, tot); return Math.max(pages.length + 1, Math.round(pages.length / Math.max(.02, done))); },
      get finished() { return finished; },
      pageOfChar(pos) { let n = 0; for (;;) { api.get(n + 1); if (finished && n + 1 >= pages.length) return Math.min(n, pages.length - 1); if (startChar(starts[n + 1]) > pos) return n; n++; } },
      fracOf(n) { api.get(n); return starts[n] ? startChar(starts[n]) / Math.max(1, tot) : 1; }, tot
    };
    return api;
  }
  const mkMeas = cls => { const m = A.h(`<div class="bv__meas paper" aria-hidden="true"><div class="pgtxt ${cls}"></div></div>`); bookEl.appendChild(m); return m.firstChild; };
  const paragraphs = text => text.replace(/\r/g, '').split(/\n\s*\n/).map(par => { par = par.trim(); if (!par) return null; if (/^#{1,3}\s/.test(par)) return { h: true, text: par.replace(/^#+\s*/, '') };
    const lines = par.split('\n').map(s => s.trim()), avg = lines.reduce((a, l) => a + l.length, 0) / lines.length; return { text: avg > 48 || lines.length === 1 ? lines.join(' ') : lines.join('\n') }; }).filter(Boolean);

  /* ---------------------------------------------------------------- the DOM */
  function build() {
    el = A.h(`<div id="bv" class="bv" hidden data-th="parch">
      <div class="bv__veil"></div>
      <header class="bv__bar"><button class="bv__x" id="bvX" aria-label="Закрыть книгу"><svg viewBox="0 0 24 24" class="ico"><path d="M14.500 5.500 8 12l6.500 6.500" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="bv__t"><b id="bvT"></b><small id="bvA"></small></div><button class="bv__aa" id="bvAa" aria-label="Шрифт и бумага">Aa</button></header>
      <div class="bv__stage" id="bvStage"><div class="bv__book" id="bvBook">
        <i class="bv__ribbon"></i><i class="bv__leather"></i><i class="bv__edges"></i>
        <div class="bv__pg bv__pg--l paper" id="pgL"></div><div class="bv__pg bv__pg--r paper" id="pgR"></div>
        <i class="bv__cast bv__cast--l"></i><i class="bv__cast bv__cast--r"></i><div class="bv__leaf" id="bvLeaf"></div><i class="bv__fsh" id="bvFsh"></i>
        <i class="bv__gutter"></i>
      </div></div>
      <nav class="bv__tabs" id="bvTabs">${TABS.map(([k, n], i) => `<button class="rb rb--${i}" data-t="${k}"><span>${n}</span></button>`).join('')}</nav>
      <footer class="bv__foot"><div class="bv__line"><i id="bvProg"></i></div><span id="bvPg"></span></footer>
      <button class="bv__fin" id="bvFin" hidden>Дочитала</button>
      <button class="bv__sel" id="bvSel" hidden><svg viewBox="0 0 24 24" class="ico"><use href="#i-quill"/></svg>В цитаты</button>
      <div class="bv__set" id="bvSet"><div class="bvs__row"><span>Размер</span><input type="range" min="16" max="32" step="1" id="bvSize"></div>
        <div class="bvs__row"><span>Шрифт</span><div class="bvs__seg" id="bvFont"><button data-v="serif" style="font-family:${FONTS.serif}">Сказка</button><button data-v="book" style="font-family:${FONTS.book}">Книга</button><button data-v="sans" style="font-family:${FONTS.sans}">Строгий</button></div></div>
        <div class="bvs__row"><span>Бумага</span><div class="bvs__seg" id="bvTh"><button data-v="parch">Пергамент</button><button data-v="night">Ночь</button></div></div>
        <div class="bvs__row"><span>Костёр</span><input type="range" min="0" max="1" step=".05" id="bvFire"></div></div>
    </div>`);
    document.body.appendChild(el); bookEl = A.$('#bvBook', el); pgL = A.$('#pgL', el); pgR = A.$('#pgR', el); leaf = A.$('#bvLeaf', el); castL = A.$('.bv__cast--l', el); castR = A.$('.bv__cast--r', el); fsh = A.$('#bvFsh', el); stage = A.$('#bvStage', el);
    A.$('#bvX', el).addEventListener('click', () => close()); A.$('#bvAa', el).addEventListener('click', () => { A.snd.tap(); el.classList.toggle('setting'); });
    A.$$('#bvTabs .rb', el).forEach(b => b.addEventListener('click', () => { A.snd.tap(); switchTab(b.dataset.t); }));
    const setP = (k, v) => { A.state.settings.reader = Object.assign(prefs(), { [k]: v }); A.save(); applyPrefs(); if (k !== 'theme') repaginate(); markPrefs(); };
    A.$('#bvSize', el).addEventListener('input', e => setP('size', +e.target.value));
    A.$('#bvFire', el).addEventListener('input', e => { A.snd.fireVol(+e.target.value); if (+e.target.value > 0) A.snd.setFire(1); });
    [['#bvFont', 'font'], ['#bvTh', 'theme']].forEach(([s, k]) => A.$(s, el).addEventListener('click', e => { const t = e.target.closest('button'); if (t) { A.snd.tap(); setP(k, t.dataset.v); } }));
    A.$('#bvFin', el).addEventListener('click', () => { const bk = book; close(); setTimeout(() => { if (bk.status !== 'done') { bk.status = 'done'; bk.finished = null; A.finishBook(bk); A.mods.books && A.mods.books.refresh(); } }, 900); });
    A.$('#bvSel', el).addEventListener('click', () => { if (!selPara) return; const t = selPara.textContent.trim(); clearSel(); comp.text = t; switchTab('quotes'); });
    bookEl.addEventListener('pointerdown', onDown); bookEl.addEventListener('pointermove', onMove); bookEl.addEventListener('pointerup', onUp); bookEl.addEventListener('pointercancel', () => { cancelPress(); if (drag && drag.flip) settle(); drag = null; });
    addEventListener('keydown', e => { if (!open_ || e.target.closest && e.target.closest('textarea,input')) return; if (e.key === 'Escape') { e.stopImmediatePropagation(); close(); } else if (e.key === 'ArrowRight' || e.key === ' ') go(1); else if (e.key === 'ArrowLeft') go(-1); }, true);
    addEventListener('resize', () => { if (open_) relayout(); });
  }

  /* ---------------------------------------------------------------- geometry + preferences */
  function layout() {
    const vw = innerWidth, vh = innerHeight, land = vw > vh * 1.08; el.classList.toggle('land', land); const r = stage.getBoundingClientRect(); let W = r.width, H = r.height, pw, ph;
    if (land) { ph = Math.min(H - 16, 560); pw = Math.min((W - 24) / 2, ph * .86); } else { pw = Math.min(W - 24, 460); ph = Math.min(H - 14, pw * 1.78); }
    pw = Math.floor(pw); ph = Math.floor(ph); const bw = land ? pw * 2 : pw, bx = Math.round((W - bw) / 2), by = Math.round((H - ph) / 2);
    g = { vw, vh, land, pw, ph, bw, bx, by, W, H };
    bookEl.style.cssText = `left:${bx}px;top:${by}px;width:${bw}px;height:${ph}px;--pw:${pw}px;--ph:${ph}px;--px:${Math.round(pw * .095)}px;--pt:${Math.round(ph * .055)}px;--pb:${Math.round(ph * .085)}px`;
    el.style.setProperty('--fs', Math.round(prefs().size * (land ? .86 : 1)) + 'px');
  }
  function applyPrefs() { const P = prefs(); el.dataset.th = P.theme; el.style.setProperty('--ff', FONTS[P.font]); document.querySelector('meta[name=theme-color]').setAttribute('content', '#0a0605'); }
  function markPrefs() { const P = prefs(); A.$$('#bvFont button', el).forEach(x => x.classList.toggle('on', x.dataset.v === P.font)); A.$$('#bvTh button', el).forEach(x => x.classList.toggle('on', x.dataset.v === P.theme)); A.$('#bvSize', el).value = P.size; A.$('#bvFire', el).value = A.state.settings.fireVol != null ? A.state.settings.fireVol : .85; }

  /* ---------------------------------------------------------------- the faces (what a page holds) */
  const savePos = () => { clearTimeout(posT); posT = setTimeout(() => A.save(), 450); };
  const pgn = (n, tot) => `<span class="pgn">${n}</span>`;
  const pageEl = (inner, cls = '') => { const d = document.createElement('div'); d.className = 'pgc ' + cls; d.innerHTML = inner; return d; };
  const blank = n => pageEl(n ? pgn(n) : '', 'blank');
  const markPage = () => hasText && book.pos > .002 ? pager.pageOfChar(book.pos * textLen) + 1 : 0;
  const titlePage = () => { const n = markPage(), d = pageEl(`<div class="tp"><i class="orn"></i><h2>${esc(book.title)}</h2><p>${esc(book.author || '')}</p><i class="orn orn--b"></i>${n ? `<button class="seal tapable" id="bvResume"><svg viewBox="0 0 24 24" class="ico"><use href="#i-flame"/></svg>Закладка · стр. ${n}</button>` : ''}</div>`, 'title'); const r = A.$('#bvResume', d); r && r.addEventListener('click', () => { A.snd.tap(); const i = g.land ? Math.floor(n / 2) : n; if (begin(1, { tab: 'read', i })) { const f = fl; f.k = 28; f.c = 8.4; launch(f, -180, 260); } }); return d; };
  const noText = () => { const d = pageEl(`<div class="tp tp--empty"><p class="hw">У этой книги пока нет страниц для чтения.</p><p class="small">Её можно загрузить из PDF, EPUB или TXT.</p><button class="seal tapable" id="bvLoad">Загрузить текст</button></div>`, 'title'); A.$('#bvLoad', d).addEventListener('click', () => { A.snd.tap(); A.mods.books.editBook(book.id); }); return d; };
  const textFace = (html, n) => pageEl(`<div class="pgtxt">${html}</div>${pgn(n)}`);

  function imprInfo() {
    const b = book, d = pageEl(`<div class="im"><h3 class="hw">О книге</h3><div class="stamps">${Object.entries(ST).map(([k, v]) => `<button class="stamp tapable ${b.status === k ? 'on' : ''}" data-s="${k}"><span>${v}</span></button>`).join('')}</div>
      <p class="lbl">Оценка</p><div class="stars">${[1, 2, 3, 4, 5].map(n => `<button class="star tapable ${b.rating >= n ? 'on' : ''}" data-n="${n}" aria-label="${n}"><svg viewBox="0 0 24 24"><path d="M12 2.8l2.7 6 6.5.6-4.9 4.3 1.5 6.4L12 16.9l-5.8 3.2 1.5-6.4-4.9-4.3 6.5-.6z"/></svg></button>`).join('')}</div>
      <p class="lbl">Что почувствовала</p><div class="imps">${IMP.map(t => `<button class="chipx tapable ${(b.imp || []).includes(t) ? 'on' : ''}" data-t="${t}">${t}</button>`).join('')}</div>
      <p class="meta">${b.pages ? `${b.read || 0} из ${b.pages} стр.` : ''}</p></div>${pgn(1)}`);
    A.$$('.stamp', d).forEach(x => x.addEventListener('click', () => { const k = x.dataset.s; if (k === b.status) return; A.snd.page(); const was = b.status; b.status = k; if (k === 'reading' && !b.started) b.started = Date.now(); if (k === 'want') b.read = 0; if (k === 'done' && was !== 'done') { b.finished = null; A.finishBook(b); } else A.save(); A.$$('.stamp', d).forEach(y => y.classList.toggle('on', y === x)); x.classList.add('hit'); setTimeout(() => x.classList.remove('hit'), 500); A.mods.books && A.mods.books.refresh(); }));
    A.$$('.star', d).forEach(x => x.addEventListener('click', () => { const n = +x.dataset.n; b.rating = b.rating === n ? 0 : n; A.save(); A.snd.twinkle && A.snd.twinkle(Math.max(0, n - 1)); A.$$('.star', d).forEach(y => y.classList.toggle('on', b.rating >= +y.dataset.n)); const r = x.getBoundingClientRect(); A.fx.stars(r.left + r.width / 2, r.top + r.height / 2, 14); }));
    A.$$('.chipx', d).forEach(x => x.addEventListener('click', () => { b.imp = b.imp || []; const t = x.dataset.t, i = b.imp.indexOf(t); i >= 0 ? b.imp.splice(i, 1) : b.imp.push(t); x.classList.toggle('on', i < 0); A.save(); A.snd.tap(); }));
    return d;
  }
  function imprWrite() {
    const b = book, d = pageEl(`<div class="im im--w"><h3 class="hw">Моё впечатление</h3><textarea class="lined hw" id="bvImp" placeholder="Что осталось в сердце после этой книги?…" spellcheck="false">${esc(b.impression || '')}</textarea></div>${pgn(2)}`); let t = 0;
    A.$('#bvImp', d).addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { b.impression = e.target.value; A.save(); }, 300); });
    return d;
  }
  const myQuotes = () => A.state.quotes.filter(q => q.bookId === book.id).sort((a, b) => b.date - a.date);
  function composer() {
    const d = pageEl(`<div class="im im--c"><h3 class="hw">Новая цитата</h3><textarea class="lined hw" id="bvQt" placeholder="Строки, которые хочется сохранить навсегда…" spellcheck="false">${esc(comp.text)}</textarea>
      <div class="qrow"><label class="pgin"><span>стр.</span><input id="bvQp" inputmode="numeric" value="${esc(comp.page)}"></label><button class="seal tapable" id="bvWrite"><svg viewBox="0 0 24 24" class="ico"><use href="#i-quill"/></svg>Записать пером</button></div></div>${pgn(1)}`);
    const ta = A.$('#bvQt', d), bt = A.$('#bvWrite', d);
    ta.addEventListener('input', () => { comp.text = ta.value; }); A.$('#bvQp', d).addEventListener('input', e => { comp.page = e.target.value; });
    bt.addEventListener('click', () => { const t = ta.value.trim(); if (!t) { A.toast('Впиши или выдели в книге строки, которые хочется сохранить'); ta.focus(); return; } ta.blur(); writeQuote(t, A.$('#bvQp', d).value.trim()); });
    return d;
  }
  const dfmt = ts => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const qEntry = q => `<blockquote class="qe tapable ${q.id === freshId ? 'fresh' : ''}" data-id="${q.id}"><p class="hw">${esc(q.text)}</p><cite>${q.page ? 'стр. ' + esc(q.page) + ' · ' : ''}${dfmt(q.date)}</cite></blockquote>`;
  function quotesPager() {
    const qs = myQuotes(), paras = [{ h: true, text: 'Любимые цитаты' }];
    if (!qs.length) paras.push({ keep: true, text: 'пусто', html: '<p class="qempty hw">Здесь поселятся строки, которые ты сохранишь. Выдели абзац в книге долгим нажатием или впиши цитату пером.</p>' });
    qs.forEach(q => paras.push({ keep: true, text: q.text + ' ' + (q.page || ''), html: qEntry(q) }));
    return makePager(paras, mkMeas('qlist hw'));
  }
  function qFace(n) {
    const html = qpager.get(n); if (html == null) return blank(n + 2); const d = textFace(html, n + 2); d.classList.add('qlist'); d.querySelector('.pgtxt').classList.add('hw');
    A.$$('.qe', d).forEach(x => x.addEventListener('click', () => { if (wasDrag()) return; A.snd.page(); A.mods.quotes.view(x.dataset.id); })); return d;
  }

  /* ---------------------------------------------------------------- modes: how many faces, which face */
  const modes = {
    read: { count: () => hasText ? 1 + pager.count() : 1, face: n => !hasText ? (n === 0 ? noText() : blank()) : n === 0 ? titlePage() : (h => h == null ? blank(n) : textFace(h, n))(pager.get(n - 1)) },
    impr: { count: () => 2, face: n => n === 0 ? imprInfo() : n === 1 ? imprWrite() : blank() },
    quotes: { count: () => 1 + qpager.count(), face: n => n === 0 ? composer() : qFace(n - 1) }
  };
  const faces = tab => modes[tab].count(), spreads = tab => g.land ? Math.ceil(faces(tab) / 2) : faces(tab);
  const slots = st => g.land ? { L: modes[st.tab].face(st.i * 2), R: modes[st.tab].face(st.i * 2 + 1) } : { L: null, R: modes[st.tab].face(st.i) };
  const setSlot = (slot, face) => { const keep = A.$('.sh', slot); slot.innerHTML = ''; if (face) slot.appendChild(face); slot.appendChild(keep || A.h('<i class="sh"></i>')); slot.hidden = false; };
  function renderSlots() {
    const s = slots(S); if (g.land) { setSlot(pgL, s.L); pgL.style.display = ''; } else pgL.style.display = 'none'; setSlot(pgR, s.R); foot();
  }
  
  function foot() {
    const P = A.$('#bvPg', el), fin = A.$('#bvFin', el), prog = A.$('#bvProg', el);
    if (S.tab === 'read' && hasText) {
      const first = g.land ? S.i * 2 : S.i, last = g.land ? S.i * 2 + 1 : S.i, cur = Math.max(0, last - 1), tp = pager.count(); pager.get(cur + 1);
      const tpN = pager.count(), end = pager.finished && cur >= pager.count() - 1 ? 1 : pager.fracOf(cur + 1);
      P.textContent = last === 0 ? 'титул' : `стр. ${last} из ${pager.finished ? '' : '≈ '}${tpN}`; prog.style.transform = `scaleX(${last === 0 ? 0 : Math.min(1, end)})`;
      maxFrac = Math.max(maxFrac, last === 0 ? 0 : end); if (last > 0) { book.pos = pager.fracOf(Math.max(0, first - 1)); savePos(); }
      el.classList.toggle('has-mark', book.pos > .002);
      fin.hidden = !(pager.finished && cur >= pager.count() - 1 && book.status !== 'done');
    } else { P.textContent = S.tab === 'quotes' ? `цитат: ${myQuotes().length}` : ''; prog.style.transform = 'scaleX(0)'; fin.hidden = true; }
    A.$$('#bvTabs .rb', el).forEach(b => b.classList.toggle('on', b.dataset.t === S.tab));
  }

  /* ---------------------------------------------------------------- the turning leaf
     the page is a strip of thin segments hinged on each other: the free edge lags behind the finger (it "sails"), flutters a little, every segment is lit by its own angle,
     the lifted page throws a soft shadow over the page below that grows and slides with it, and the fingertip throws its own shadow that loosens as the corner rises. */
  const flipping = () => fl && !fl.flutter;
  const NS = 9, LIGHT = [-.45, .85, .993];
  function cloneFace(n) { if (!n) return null; const c = n.cloneNode(true); c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); const o = n.querySelectorAll('textarea'); c.querySelectorAll('textarea').forEach((t, i) => { t.value = o[i] ? o[i].value : ''; t.tabIndex = -1; }); c.querySelectorAll('button,input').forEach(b => { b.tabIndex = -1; }); return c; }
  function buildLeaf(front, back) {
    leaf.innerHTML = ''; strips = []; const sw = g.pw / NS, ov = 1; let parent = leaf;                       // neighbouring segments overlap by a pixel on each side, so no seam can open between them
    for (let i = 0; i < NS; i++) {
      const st = document.createElement('div'); st.className = 'ls'; st.style.cssText = `left:${i ? sw.toFixed(3) : -ov}px;width:${(sw + 2 * ov).toFixed(3)}px;transform-origin:${ov}px 50%`;
      st.innerHTML = '<div class="ls__f"><div class="ls__in paper"></div><i class="ls__sh"></i></div><div class="ls__b"><div class="ls__in paper"></div><i class="ls__sh"></i></div>';
      const f = st.children[0], bk = st.children[1], fi = f.firstChild, bi = bk.firstChild;
      fi.style.cssText = `left:${(-(i * sw - ov)).toFixed(3)}px;width:${g.pw}px`; bi.style.cssText = `left:${(-(g.pw - (i + 1) * sw - ov)).toFixed(3)}px;width:${g.pw}px`;
      const cf = cloneFace(front), cb = cloneFace(back); cf && fi.appendChild(cf); cb && bi.appendChild(cb);
      parent.appendChild(st); parent = st; strips.push({ el: st, sf: f.lastChild, sb: bk.lastChild, tf: -1, tb: -1 });
    }
  }
  const corner = () => { const r = bookEl.getBoundingClientRect(); return { side: fl && fl.dir < 0 ? 'L' : 'R', x: r.left + (g.land ? g.pw : 0) + (fl ? fl.tx : g.pw) - 6, y: r.top + g.ph - Math.min(70, g.ph * .1) }; };
  function begin(dir, to) {
    if (fl && fl.flutter) { cancelAnimationFrame(raf); raf = 0; fl = null; leaf.style.display = 'none'; leaf.innerHTML = ''; strips = []; castL.style.opacity = castR.style.opacity = fsh.style.opacity = 0; }
    if (fl || !open_) return false; to = to || { tab: S.tab, i: S.i + dir }; if (to.i < 0 || (to.tab === S.tab && to.i >= spreads(to.tab))) return false; const from = { tab: S.tab, i: S.i }, a = slots(from), b = slots(to); if (to.i >= spreads(to.tab)) return false;
    if (dir > 0) { buildLeaf(a.R, g.land ? b.L : null); setSlot(pgR, b.R); } else { buildLeaf(b.R, g.land ? a.L : null); setSlot(pgR, a.R); if (g.land) setSlot(pgL, b.L); }
    fl = { dir, from, to, a, b, ang: dir > 0 ? 0 : -180, v: 0, t: dir > 0 ? 0 : -180, k: 60, c: 11, bd: 0, bv: 0, fp: 0, flu: 0, vd: 0, tx: dir > 0 ? g.pw : -g.pw, hold: true, pin: true }; leaf.style.display = 'block'; paintLeaf();
    A.hands.show(true, true); A.$('#hands').classList.add('top'); A.hands.pinch(corner); A.snd.page(); run(); return true;
  }
  function paintLeaf() {
    const th = fl.ang, bd = fl.bd + fl.flu, N = strips.length, sw = g.pw / N; let prev = 0, x = 0, h = 0;
    for (let i = 0; i < N; i++) {
      const u = (i + .5) / N, phi = th + bd * Math.pow(u, 1.55) + fl.flu * .55 * Math.sin(u * 6.283), r = phi * Math.PI / 180, sn = Math.sin(r), cs = Math.cos(r), S_ = strips[i];
      S_.el.style.transform = `rotateY(${(phi - prev).toFixed(2)}deg)`; prev = phi; x += sw * cs; h -= sw * sn;
      const fd = (LIGHT[0] * sn + LIGHT[1] * cs) / LIGHT[2], bk = -fd, sf = A.clamp((.86 - fd) * .75, 0, .5), sb = A.clamp((.86 - bk) * .75, 0, .5);
      if (Math.abs(sf - S_.tf) > .008) { S_.tf = sf; S_.sf.style.opacity = sf.toFixed(3); } if (Math.abs(sb - S_.tb) > .008) { S_.tb = sb; S_.sb.style.opacity = sb.toFixed(3); }
    }
    fl.tx = x; fl.h = A.clamp(h / g.pw, 0, 1);
    // the shadow of the lifted page on the page below: it stretches to where the free edge is and softens as the page rises
    const over = x >= 0 ? 'R' : 'L', ca = over === 'R' ? castR : castL, cb2 = over === 'R' ? castL : castR, wpx = Math.abs(x), soft = .5 * Math.pow(Math.sin(Math.min(1, fl.h * 1.15) * 1.5708), .8) * (1 - .35 * fl.h);
    ca.style.cssText = `left:${(over === 'R' ? (g.land ? g.pw : 0) : (g.land ? 0 : -g.pw))}px;width:${(wpx + 26 + fl.h * 34).toFixed(1)}px;opacity:${soft.toFixed(3)};transform:${over === 'R' ? 'none' : `translateX(${(g.pw - wpx - 26 - fl.h * 34).toFixed(1)}px)`};background:linear-gradient(${over === 'R' ? 90 : 270}deg,rgba(24,10,0,.0),rgba(24,10,0,.5) ${Math.max(20, 70 - fl.h * 20).toFixed(0)}%,rgba(24,10,0,.34) ${(92 - fl.h * 6).toFixed(0)}%,rgba(24,10,0,0))`; cb2.style.opacity = 0;
    // the shadow of the fingertip: tight and dark while the corner is low, wide and pale as it lifts
    const bx = (g.land ? g.pw : 0) + x, by = g.ph - Math.min(70, g.ph * .1), k = fl.h, sx = 26 + k * 30, sy = 20 + k * 26, wdt = 50 + k * 56, hgt = 30 + k * 34;
    fsh.style.cssText = `left:${(bx + sx - wdt / 2).toFixed(1)}px;top:${(by + sy - hgt / 2).toFixed(1)}px;width:${wdt.toFixed(0)}px;height:${hgt.toFixed(0)}px;opacity:${(fl.pin ? .62 - k * .34 : 0).toFixed(3)}`;
  }
  function launch(f, t, delay = 110) { setTimeout(() => { if (fl === f) { f.t = t; f.hold = false; run(); } }, delay); }
  function settle() { if (!fl) return; fl.hold = false; fl.v = fl.v || 0; run(); }
  function run() {
    if (raf) return; let last = performance.now(), dragging = false;
    const f = now => {
      if (!fl) { raf = 0; return; } const dt = Math.min(.05, (now - last) / 1000) * (A.slow || 1); last = now; dragging = !!(drag && drag.flip);
      if (!dragging) { fl.v += ((fl.t - fl.ang) * fl.k - fl.v * fl.c) * dt; fl.ang += fl.v * dt; fl.ang = A.clamp(fl.ang, -184, 4); } else fl.vd *= Math.exp(-dt * 7);
      const w = dragging ? fl.vd : fl.v, tb = A.clamp(-w * .085, -34, 34);                       // the free edge lags behind the motion, then springs back and rings a little
      fl.bv += ((tb - fl.bd) * 150 - fl.bv * 8.5) * dt; fl.bd += fl.bv * dt; fl.fp += dt * (30 + Math.abs(w) * .05); fl.flu = Math.sin(fl.fp) * A.clamp(Math.abs(w) / 240, 0, 1) * 2.6;
      paintLeaf();
      if (!dragging && !fl.hold && Math.abs(fl.t - fl.ang) < .5 && Math.abs(fl.v) < 6 && Math.abs(fl.bd) < .8 && Math.abs(fl.bv) < 5) { raf = 0; endFlip(); return; }
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
  }
  function endFlip() {
    const f = fl, done = f.flutter ? false : f.dir > 0 ? f.t <= -179 : f.t >= -1; fl = null; leaf.style.display = 'none'; leaf.innerHTML = ''; strips = []; castL.style.opacity = castR.style.opacity = fsh.style.opacity = 0;
    if (!f.flutter) {
      if (done) { S = { tab: f.to.tab, i: f.to.i }; if (f.dir > 0) { if (g.land) setSlot(pgL, f.b.L); } else setSlot(pgR, f.b.R); }
      else { if (f.dir > 0) setSlot(pgR, f.a.R); else if (g.land) setSlot(pgL, f.a.L); }
      foot();
    }
    if (!f.flutter) { A.hands.unpinch(); setTimeout(() => { if (!fl) A.$('#hands').classList.remove('top'); }, 700); } warm();
  }
  function warm() { clearTimeout(warmT); warmT = setTimeout(() => { if (open_ && S.tab === 'read' && hasText && pager) pager.get(Math.max(0, (g.land ? S.i * 2 + 1 : S.i) - 1) + 3); }, 140); }
  /* a breath of air as the book opens: the top page lifts, sails and settles again */
  function flutter() {
    if (fl || !open_ || busyW || !g) return; const R = slots(S).R; if (!R) return; buildLeaf(R, null);
    fl = { dir: 1, from: S, to: S, ang: 0, v: -125, t: 0, k: 70, c: 8.6, bd: 0, bv: 0, fp: 0, flu: 0, vd: 0, tx: g.pw, hold: false, flutter: true }; leaf.style.display = 'block'; paintLeaf(); A.snd.page && A.snd.page(); run();
  }
  function go(dir) { if (flipping() || busyW) return; if (begin(dir)) { launch(fl, dir > 0 ? -180 : 0, 120); fl.k = 28; fl.c = 8.4; } else if (dir > 0 || dir < 0) { bump(dir); } }
  function bump(dir) { pgR.animate([{ transform: 'none' }, { transform: `translateX(${-dir * 9}px)` }, { transform: 'none' }], { duration: 260, easing: 'ease-out' }); }
  function switchTab(t) {
    if (flipping() || busyW || t === S.tab) return; cancelPress(); clearSel(); const order = TABS.map(x => x[0]), dir = order.indexOf(t) > order.indexOf(S.tab) ? 1 : -1;
    if (t === 'quotes') qpager = quotesPager();
    if (begin(dir, { tab: t, i: 0 })) { const f = fl; f.k = 27; f.c = 8.3; launch(f, dir > 0 ? -180 : 0, 120); }
  }

  /* ---------------------------------------------------------------- touch: drag a page, tap an edge, hold a paragraph */
  const interactive = t => t.closest('textarea,input,button,label'); let dragStamp = 0; const wasDrag = () => performance.now() - dragStamp < 400;
  function onDown(e) {
    if (flipping() || busyW) return; if (interactive(e.target)) { drag = { x: e.clientX, y: e.clientY, ui: true, moved: false }; return; }
    bookEl.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, t: performance.now(), lx: e.clientX, lt: performance.now(), v: 0, moved: false, flip: false, id: e.pointerId };
    if (S.tab === 'read') { const p = e.target.closest('.pgtxt p'); if (p) pressT = setTimeout(() => { if (drag && !drag.moved) { drag.moved = true; pickPara(p); } }, 560); }
  }
  function onMove(e) {
    if (!drag || drag.ui) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 10) { cancelPress(); if (Math.abs(dx) > Math.abs(dy) * 1.1) { drag.moved = true; if (begin(dx < 0 ? 1 : -1)) { drag.flip = true; fl.k = 140; fl.c = 20; clearSel(); } } else { drag.moved = true; } }
    if (drag.flip && fl) { const now = performance.now(); drag.v = drag.v * .6 + ((e.clientX - drag.lx) / Math.max(1, now - drag.lt)) * .4; drag.lx = e.clientX; drag.lt = now; const p = A.clamp(Math.abs(dx) / (g.pw * .85), 0, 1); fl.t = fl.dir > 0 ? -180 * p : -180 * (1 - p); fl.t = fl.dir > 0 ? Math.min(0, fl.t) : Math.max(-180, fl.t); fl.ang = fl.t; fl.vd = 180 / (g.pw * .85) * drag.v * 1000; paintLeaf(); }
  }
  function onUp(e) {
    cancelPress(); if (!drag) return; const d = drag; drag = null; if (d.ui) return;
    if (d.flip && fl) { const p = fl.dir > 0 ? -fl.ang / 180 : 1 + fl.ang / 180, vel = d.v * fl.dir * -1; const complete = p > .3 || vel > .35; fl.t = fl.dir > 0 ? (complete ? -180 : 0) : (complete ? 0 : -180); fl.k = 58; fl.c = 10.5; fl.v = d.v * 1000 * 180 / (g.pw * .85); fl.hold = false; run(); return; }
    if (d.moved) { dragStamp = performance.now(); return; }
    if (performance.now() - d.t < 450 && !e.target.closest('.qe')) { const r = bookEl.getBoundingClientRect(), x = (e.clientX - r.left) / r.width; if (selPara) { clearSel(); return; } if (g.land ? x > .5 : x > .58) go(1); else if (g.land ? x <= .5 : x < .42) go(-1); }
  }
  const cancelPress = () => { clearTimeout(pressT); pressT = 0; };
  function pickPara(p) { clearSel(); selPara = p; p.classList.add('picked'); A.vibrate(16); A.snd.tap(); const r = p.getBoundingClientRect(), b = A.$('#bvSel', el), W = innerWidth; b.hidden = false; b.style.left = A.clamp(r.left + r.width / 2, 70, W - 70) + 'px'; b.style.top = Math.max(innerHeight * .08, r.top - 8) + 'px'; b.classList.remove('in'); void b.offsetWidth; b.classList.add('in'); }
  function clearSel() { if (selPara) selPara.classList.remove('picked'); selPara = null; const b = A.$('#bvSel', el); if (b) b.hidden = true; }

  /* ---------------------------------------------------------------- a quote is written by the quill on a slip of parchment, which then settles into the book */
  async function writeQuote(text, page) {
    if (busyW) return; busyW = true; A.snd.unlock && A.snd.unlock();
    const slip = A.h(`<div class="qslip"><div class="qslip__in"><p class="qslip__t hw"></p><cite>— «${esc(book.title)}»${page ? ', стр. ' + esc(page) : ''}</cite><i class="qslip__fl"></i></div></div>`); el.appendChild(slip);
    const p = A.$('.qslip__t', slip); p.textContent = text; p.style.fontSize = text.length > 220 ? '19px' : text.length > 120 ? '22px' : '26px';
    slip.animate([{ opacity: 0, transform: 'translate(-50%,-44%) rotate(-3deg) scale(.94)', filter: 'blur(6px)' }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(-1.4deg) scale(1)', filter: 'none' }], { duration: 700, easing: 'cubic-bezier(.2,.9,.25,1)', fill: 'forwards' }); A.snd.page();
    await wait(650);
    await A.quill.write(p, { box: slip, cps: Math.min(34, Math.max(19, text.length / 5)) });
    p.textContent = text; await wait(350); A.snd.chime && A.snd.chime([659.25, 783.99, 987.77], .12, .7);
    const q = { id: A.uid(), bookId: book.id, bookTitle: book.title, author: book.author, text, page, tags: [], sticker: '', paper: 'parch', photo: null, date: Date.now() };
    A.addQuote(q); freshId = q.id; comp = { text: '', page: '' };
    qpager = quotesPager();
    const br = bookEl.getBoundingClientRect(), sr = slip.getBoundingClientRect(), tx = br.left + br.width * (g.land ? .75 : .5) - (sr.left + sr.width / 2), ty = br.top + br.height * .2 - (sr.top + sr.height / 2);
    const fly = slip.animate([{ transform: 'translate(-50%,-50%) rotate(-1.4deg) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${tx}px),calc(-50% + ${ty}px)) rotate(0deg) scale(.62)`, opacity: .0 }], { duration: 950, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' });
    if (!g.land) { await wait(380); const to = { tab: 'quotes', i: 1 }; if (S.i !== 1 && begin(1, to)) { const f = fl; f.k = 40; f.c = 9; await wait(160); f.t = -180; f.hold = false; run(); } } else renderSlots();
    await fly.finished; slip.remove(); busyW = false;
    await wait(g.land ? 0 : 600); if (S.tab === 'quotes') { renderSlots(); const n = A.$('.qe.fresh', el); n && n.scrollIntoView && 0; } A.fx.sparks(innerWidth / 2, innerHeight * .4, 20, '#f3d9a0'); setTimeout(() => { freshId = null; A.$$('.qe.fresh', el).forEach(x => x.classList.remove('fresh')); }, 2500);
  }

  /* ---------------------------------------------------------------- open / close */
  function repaginate() {
    if (!el || !g) return; const frac = S.tab === 'read' && hasText && pager ? pager.fracOf(Math.max(0, (g.land ? S.i * 2 + 1 : S.i) - 1)) : (book.pos || 0); layout(); startPagers(); if (S.tab === 'read' && hasText) { const n = pager.pageOfChar(frac * textLen) + 1; S.i = g.land ? Math.floor(n / 2) : n; } else S.i = Math.min(S.i, spreads(S.tab) - 1); if (fl) { fl = null; leaf.style.display = 'none'; } renderSlots();
  }
  const relayout = () => repaginate();
  function startPagers() {
    A.$$('.bv__meas', bookEl).forEach(m => m.remove()); if (hasText) pager = makePager(paragraphs(book._text || ''), mkMeas('')); qpager = quotesPager();
  }
  async function openBook(bk, opt = {}) {
    if (!el) build(); book = bk; open_ = true; onClose = opt.onClose || null; busyW = false; fl = null; maxFrac = 0; comp = { text: '', page: '' }; freshId = null;
    const text = await A.txt.get(bk.id); book._text = text || ''; hasText = !!(text && text.trim()); textLen = (text || '').length;
    if (bk.status === 'want') { bk.status = 'reading'; bk.started = bk.started || Date.now(); }
    if (!bk.pages && hasText) bk.pages = A.pagesEst(text); bk._len = textLen; A.save();
    A.$('#bvT', el).textContent = bk.title; A.$('#bvA', el).textContent = bk.author || ''; el.hidden = false; el.classList.remove('setting', 'in'); applyPrefs(); markPrefs(); layout();
    S = { tab: 'read', i: 0 }; startPagers(); if (hasText && bk.pos > .002) { const n = pager.pageOfChar(bk.pos * textLen) + 1; S.i = g.land ? Math.floor(n / 2) : n; setTimeout(() => open_ && A.toast(`Закладка: продолжаем со стр. ${n}`, 2800), 1700); }
    leaf.style.display = 'none'; renderSlots(); document.body.classList.add('bv-open'); A.$('#lib3d').classList.add('bv');
    A.snd.setMood('books'); A.snd.unlock && A.snd.unlock(); A.snd.setFire(1);
    if (hasText && !A.state.bvTip) { A.state.bvTip = true; A.save(); setTimeout(() => open_ && A.toast('Листай страницы пальцем. Зажми абзац — он станет цитатой.', 4600), 2000); }
    void el.offsetWidth; el.classList.add('in'); setTimeout(() => { if (open_ && !fl && S.tab === 'read') flutter(); }, 1350); clearTimeout(stillT); stillT = setTimeout(() => { if (open_) { document.body.classList.add('bv-still'); A.scene.freeze(true); } }, 900); if (!hasText) setTimeout(() => A.toast('В «Читать» пока пусто — загрузи текст, а впечатления и цитаты работают уже сейчас'), 900);
  }
  function close() {
    if (!open_) return; if (busyW) return; open_ = false; clearSel(); cancelPress(); A.quill.hide(); const b = book; clearTimeout(warmT);
    if (fl) { cancelAnimationFrame(raf); raf = 0; fl = null; leaf.style.display = 'none'; leaf.innerHTML = ''; strips = []; castL.style.opacity = castR.style.opacity = fsh.style.opacity = 0; }
    if (hasText && pager) { b.read = b.read || 0; const reached = Math.round(maxFrac * (b.pages || A.pagesEst('x'.repeat(b._len || 800)))), delta = Math.min(reached, b.pages || reached) - (b.read || 0); if (delta > 0 && b.status !== 'done') A.logPages(delta, b.id); }
    A.save(); el.classList.remove('in', 'setting'); clearTimeout(stillT); document.body.classList.remove('bv-open', 'bv-still'); A.scene.freeze(false); A.$('#lib3d').classList.remove('bv'); A.$('#hands').classList.remove('top'); A.hands.unpinch();
    document.querySelector('meta[name=theme-color]').setAttribute('content', '#000'); A.snd.setMood(A.tab || 'room'); A.snd.setFire(A.tab === 'books' || (A.fire && A.fire.on) ? 1 : 0);
    setTimeout(() => { el.hidden = true; }, 700); const cb = onClose; onClose = null; setTimeout(() => cb && cb(), 160); A.mods.books && A.mods.books.refresh && A.mods.books.refresh();
  }
  return { open: openBook, close, isOpen: () => open_, _dbg: () => ({ fl, raf, S, g, open_, busyW }), _go: go };
})();
A.reader = { open: (b, r) => A.bookview.open(b), close: () => A.bookview.close(), isOpen: () => A.bookview.isOpen() };
A.pagesEst = t => Math.max(1, Math.round((t || '').length / 1800));
