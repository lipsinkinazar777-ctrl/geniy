/* ============================================================ "Полка": the catalogue */
(() => {
  let el, filter = 'all', query = '';
  const ST = { want: 'Хочу прочитать', reading: 'Читаю', done: 'Прочитано' };
  const IMP = ['Мурашки', 'Плакала', 'Не оторваться', 'Уютная', 'Затянуло', 'Заставила думать', 'Смеялась', 'Разочарование'];

  const mod = A.mods.books = {
    init(root) {
      el = root;
      root.innerHTML = `<div class="wrap"><div data-rise><div class="eyebrow" id="bkEb"></div><h1 class="h1">Моя <em>полка</em></h1></div>
        <div class="search glass" data-rise><svg class="ico" viewBox="0 0 24 24"><use href="#i-search"/></svg><input id="bkQ" class="srch" placeholder="Найти книгу или автора" autocomplete="off"></div>
        <div class="chips" data-rise id="bkF"><button class="chip on" data-f="all">Все</button><button class="chip" data-f="reading">Читаю</button><button class="chip" data-f="want">Хочу</button><button class="chip" data-f="done">Прочитано</button></div>
        <div id="bkSample"></div><div class="shelf" id="bkGrid"></div></div>`;
      A.$('#bkQ', root).addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); render(); });
      A.$('#bkF', root).addEventListener('click', e => { const c = e.target.closest('.chip'); if (!c) return; filter = c.dataset.f; A.$$('#bkF .chip', root).forEach(x => x.classList.toggle('on', x === c)); A.snd.page(); render(); });
      A.$('#bkGrid', root).addEventListener('click', e => { const c = e.target.closest('.bk'); if (!c) return; A.snd.page(); const bk = A.bookById(c.dataset.id); if (bk && bk.text) A.reader.open(bk, A.$('.bk__c', c).getBoundingClientRect()); else openBook(c.dataset.id); });
      render();
    },
    show() { A.rise(el); render(true); A.fab.show(() => editBook()); },
    beforeShow() {}, refresh() { el && render(); }, openBook, editBook
  };

  function stats() { const b = A.state.books, d = b.filter(x => x.status === 'done').length, r = b.filter(x => x.status === 'reading').length; return `${b.length} ${A.plural(b.length, 'книга', 'книги', 'книг')} · ${r} читаю · ${d} прочитано`; }
  function render(anim) {
    A.$('#bkEb', el).textContent = stats();
    const s = A.state, list = s.books.filter(b => (filter === 'all' || b.status === filter) && (!query || (b.title + ' ' + (b.author || '')).toLowerCase().includes(query)));
    const order = { reading: 0, want: 1, done: 2 }; list.sort((a, b) => order[a.status] - order[b.status] || b.added - a.added);
    const hasSample = s.books.some(b => b.sample) || s.quotes.some(q => q.sample);
    A.$('#bkSample', el).innerHTML = hasSample ? `<div class="glass note" data-rise><span>Это примеры, чтобы было не пусто.</span><button class="btn btn--ghost" id="bkClr">Убрать</button></div>` : '';
    const clr = A.$('#bkClr', el); clr && clr.addEventListener('click', () => { s.books = s.books.filter(b => !b.sample); s.quotes = s.quotes.filter(q => !q.sample); s.samples = false; A.save(); A.snd.pop(); render(); A.mods.quotes && A.mods.quotes.refresh(); A.mods.path && A.mods.path.rebuild(); A.toast('Полка очищена, теперь она только твоя'); });
    const g = A.$('#bkGrid', el);
    if (!list.length) { g.innerHTML = `<div class="empty"><b>${s.books.length ? 'Ничего не нашлось' : 'Полка пока пуста'}</b>${s.books.length ? 'Попробуй другое слово.' : 'Нажми на золотую кнопку, чтобы поселить первую книгу.'}</div>`; return; }
    g.innerHTML = list.map((b, i) => { const pr = b.pages ? Math.round((b.read || 0) / b.pages * 100) : 0;
      return `<button class="bk ${anim ? 'fall' : ''}" data-id="${b.id}" style="--i:${i}"><div class="bk__c">${A.coverHTML(b)}${b.status === 'reading' ? `<div class="bk__bar"><i style="width:${pr}%"></i></div><span class="bk__tag">${pr}%</span>` : ''}${b.status === 'done' ? `<span class="bk__tag bk__tag--ok">${b.rating ? '★'.repeat(b.rating) : '✓'}</span>` : ''}${b.status === 'want' ? '<span class="bk__ribbon"></span>' : ''}</div><b class="bk__t">${A.esc(b.title)}</b><i class="bk__a">${A.esc(b.author || '')}</i></button>`; }).join('');
  }

  /* ---------------------------------------------------------------- detail */
  function openBook(id) {
    const b = A.bookById(id); if (!b) return;
    const quotes = () => A.state.quotes.filter(q => q.bookId === b.id);
    const sh = A.sheet.open({ tall: true, noHead: true, html: '', onClose: () => { render(); A.mods.path && A.mods.path.refreshHello && A.mods.path.refreshHello(); }, onMount: s => { paint(s); } });
    function paint(s) {
      const pr = b.pages ? Math.round((b.read || 0) / b.pages * 100) : 0;
      s.body.innerHTML = `<div class="bd"><div class="bd__cover tilt">${A.coverHTML(b)}<span class="bd__glow"></span></div>
        <h2 class="bd__t">${A.esc(b.title)}</h2><p class="sub bd__a">${A.esc(b.author || 'автор неизвестен')}</p>
        <div class="seg" id="bdSt">${Object.keys(ST).map(k => `<button data-s="${k}" class="${b.status === k ? 'on' : ''}">${ST[k]}</button>`).join('')}</div>
        ${b.text ? '<button class="btn btn--gold" style="width:100%;margin:2px 0 16px" id="bdRead">Читать</button>' : ''}
        ${b.status !== 'want' ? `<div class="glass bd__pr"><div class="bd__prh"><span>${b.read || 0} из ${b.pages || '?'} стр.</span><b>${pr}%</b></div><div class="wbar big"><i style="width:${pr}%"></i></div>${b.status === 'reading' ? `<div class="row" style="margin-top:14px"><button class="btn btn--gold" id="bdLog">Записать страницы</button><button class="btn btn--ghost" id="bdDone">Дочитала</button></div>` : ''}</div>` : `<button class="btn btn--gold" style="width:100%;margin:6px 0 18px" id="bdStart">Начать читать</button>`}
        <div class="sec__h"><h3>Оценка</h3></div><div class="stars5" id="bdRate">${[1, 2, 3, 4, 5].map(n => `<button data-n="${n}" class="${b.rating >= n ? 'on' : ''}" aria-label="${n}"><svg class="ico" viewBox="0 0 24 24"><use href="#i-star"/></svg></button>`).join('')}</div>
        <div class="sec__h" style="margin-top:22px"><h3>Впечатление</h3></div><div class="chips wrapchips" id="bdImp">${IMP.map(t => `<button class="chip ${(b.imp || []).includes(t) ? 'on' : ''}" data-t="${t}">${t}</button>`).join('')}</div>
        <textarea class="in" id="bdTxt" placeholder="Что осталось в сердце после этой книги?" style="margin-top:6px;min-height:110px">${A.esc(b.impression || '')}</textarea>
        <div class="sec__h" style="margin-top:22px"><h3>Цитаты</h3><small>${quotes().length}</small></div>
        <div id="bdQ">${quotes().map(q => `<div class="qmini" data-id="${q.id}">«${A.esc(q.text.length > 120 ? q.text.slice(0, 118) + '…' : q.text)}»</div>`).join('') || '<p class="sub" style="font-size:15px;margin-bottom:8px">Пока нет. Запиши фразу, которая зацепила.</p>'}</div>
        <button class="btn btn--ghost" style="width:100%;margin-top:10px" id="bdAddQ"><svg class="ico" viewBox="0 0 24 24"><use href="#i-quill"/></svg>Добавить цитату</button>
        <div class="row" style="margin-top:26px"><button class="btn btn--ghost" id="bdEdit">Изменить</button><button class="btn btn--danger" id="bdDel">Удалить</button></div></div>`;
      const q = x => A.$(x, s.body); tilt(q('.tilt'));
      A.$$('#bdSt button', s.body).forEach(bt => bt.addEventListener('click', () => { const k = bt.dataset.s; if (k === b.status) return; A.snd.page(); setStatus(k); paint(s); }));
      const rd = q('#bdRead'); rd && rd.addEventListener('click', () => { s.close(); setTimeout(() => A.reader.open(b), 380); });
      const lg = q('#bdLog'); lg && lg.addEventListener('click', () => { A.goal.logSheet(b.id); });
      const dn = q('#bdDone'); dn && dn.addEventListener('click', () => { setStatus('done'); paint(s); });
      const stt = q('#bdStart'); stt && stt.addEventListener('click', () => { setStatus('reading'); paint(s); });
      A.$$('#bdRate button', s.body).forEach(bt => bt.addEventListener('click', () => { const n = +bt.dataset.n; b.rating = b.rating === n ? 0 : n; A.save(); A.snd.twinkle(n - 1); A.fx.stars(bt.getBoundingClientRect().left + 19, bt.getBoundingClientRect().top + 19, 8); A.$$('#bdRate button', s.body).forEach((x, i) => x.classList.toggle('on', i < b.rating)); }));
      A.$$('#bdImp .chip', s.body).forEach(c => c.addEventListener('click', () => { b.imp = b.imp || []; const t = c.dataset.t, i = b.imp.indexOf(t); i >= 0 ? b.imp.splice(i, 1) : b.imp.push(t); c.classList.toggle('on', i < 0); A.save(); A.snd.tap(); }));
      q('#bdTxt').addEventListener('input', e => { b.impression = e.target.value; A.save(); });
      q('#bdAddQ').addEventListener('click', () => { A.mods.quotes.editQuote(null, b.id); });
      A.$$('.qmini', s.body).forEach(m => m.addEventListener('click', () => A.mods.quotes.view(m.dataset.id)));
      q('#bdEdit').addEventListener('click', () => { s.close(); setTimeout(() => editBook(b.id), 500); });
      q('#bdDel').addEventListener('click', () => { const bt = q('#bdDel'); if (bt.dataset.sure) { A.state.books = A.state.books.filter(x => x.id !== b.id); A.state.quotes.forEach(x => { if (x.bookId === b.id) x.bookId = null; }); A.save(); s.close(); A.snd.pop(); A.toast('Книга ушла с полки'); } else { bt.dataset.sure = 1; bt.textContent = 'Точно? Нажми ещё раз'; setTimeout(() => { bt.textContent = 'Удалить'; delete bt.dataset.sure; }, 3200); } });
      s._repaint = () => paint(s);
    }
    mod._detail = sh;
    function setStatus(k) { const was = b.status; b.status = k; if (k === 'reading' && !b.started) b.started = Date.now(); if (k === 'want') { b.read = 0; } if (k === 'done' && was !== 'done') { b.finished = null; A.finishBook(b); } else A.save(); A.mods.path && A.mods.path.refreshHello && 0; }
  }
  mod.repaintDetail = () => { if (mod._detail && mod._detail.el.isConnected && mod._detail._repaint) mod._detail._repaint(); };
  const baseRefresh = mod.refresh; mod.refresh = () => { baseRefresh(); mod.repaintDetail(); };

  function tilt(card) { if (!card || !A.fine) return; card.addEventListener('pointermove', e => { const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; card.style.transform = `perspective(700px) rotateY(${x * 24}deg) rotateX(${-y * 18}deg)`; }); card.addEventListener('pointerleave', () => card.style.transform = ''); }

  /* ---------------------------------------------------------------- add / edit */
  function editBook(id) {
    const old = id ? A.bookById(id) : null;
    const b = old ? JSON.parse(JSON.stringify(old)) : { id: A.uid(), title: '', author: '', pages: 0, read: 0, status: 'want', rating: 0, tags: [], imp: [], impression: '', added: Date.now(), cover: {} };
    A.sheet.open({ title: old ? 'Изменить книгу' : 'Новая книга', tall: true, html: `<div class="eb"><div class="eb__prev" id="ebPrev"></div><div class="eb__f">
      <label class="field"><span>Название</span><input class="in" id="ebT" value="${A.esc(b.title)}" placeholder="Например, Маленький принц"></label>
      <label class="field"><span>Автор</span><input class="in" id="ebA" value="${A.esc(b.author)}" placeholder="Кто написал"></label></div></div>
      ${old ? '' : `<div class="sec__h"><h3 style="font-size:16px">Подсказки от леса</h3></div><div class="chips" id="ebSug">${A.SUGGEST.map((x, i) => `<button class="chip" data-i="${i}">${A.esc(x.t)}</button>`).join('')}</div>`}
      <div class="row"><label class="field"><span>Страниц</span><input class="in" id="ebP" type="number" inputmode="numeric" min="0" value="${b.pages || ''}"></label><label class="field"><span>Прочитано</span><input class="in" id="ebR" type="number" inputmode="numeric" min="0" value="${b.read || ''}"></label></div>
      <div class="field"><span>Статус</span><div class="seg" id="ebS">${Object.keys(ST).map(k => `<button data-s="${k}" class="${b.status === k ? 'on' : ''}">${ST[k]}</button>`).join('')}</div></div>
      <div class="field"><span>Настроение книги</span><div class="chips wrapchips" id="ebM">${Object.entries(A.MOODS).map(([k, v]) => `<button class="chip ${b.tags.includes(k) ? 'on' : ''}" data-k="${k}">${v}</button>`).join('')}</div></div>
      <div class="field"><span>Текст истории, чтобы читать здесь</span><textarea class="in" id="ebTx" placeholder="Вставь текст или загрузи файл" style="min-height:110px;font-size:14px">${A.esc(b.text || '')}</textarea><label class="btn btn--ghost" style="margin-top:10px;width:100%">Загрузить файл (.txt, .md)<input type="file" id="ebTf" accept=".txt,.md,.text,text/plain,text/markdown" hidden></label></div>
      <div class="field"><span>Обложка</span><div class="hues" id="ebH">${[...Array(9)].map((_, i) => { const h = i * 40; return `<button data-h="${h}" style="background:linear-gradient(160deg,hsl(${h} 45% 34%),hsl(${h + 25} 50% 16%))"></button>`; }).join('')}<label class="hues__ph"><svg class="ico" viewBox="0 0 24 24"><use href="#i-camera"/></svg><input type="file" accept="image/*" id="ebF" hidden></label></div></div>
      <button class="btn btn--gold" style="width:100%;margin-top:10px" id="ebOk">${old ? 'Сохранить' : 'Поставить на полку'}</button>`,
      onMount: s => {
        const q = x => A.$(x, s.el), prev = () => { q('#ebPrev').innerHTML = A.coverHTML({ title: b.title || 'Название', author: b.author, cover: b.cover }); };
        prev();
        q('#ebT').addEventListener('input', e => { b.title = e.target.value; prev(); }); q('#ebA').addEventListener('input', e => { b.author = e.target.value; prev(); });
        q('#ebP').addEventListener('input', e => b.pages = +e.target.value || 0); q('#ebR').addEventListener('input', e => b.read = +e.target.value || 0);
        A.$$('#ebS button', s.el).forEach(bt => bt.addEventListener('click', () => { b.status = bt.dataset.s; A.$$('#ebS button', s.el).forEach(x => x.classList.toggle('on', x === bt)); A.snd.tap(); }));
        A.$$('#ebM .chip', s.el).forEach(c => c.addEventListener('click', () => { const k = c.dataset.k, i = b.tags.indexOf(k); i >= 0 ? b.tags.splice(i, 1) : b.tags.push(k); c.classList.toggle('on', i < 0); A.snd.tap(); }));
        A.$$('#ebH button', s.el).forEach(h => h.addEventListener('click', () => { b.cover = { hue: +h.dataset.h }; prev(); A.snd.tap(); }));
        q('#ebTx').addEventListener('input', e => { b.text = e.target.value; if (!old || !old.pages) { b.pages = b.text ? A.pagesEst(b.text) : 0; q('#ebP').value = b.pages || ''; } });
        q('#ebTf').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; if (f.size > 3e6) { A.toast('Файл слишком большой для телефона'); return; } const fr = new FileReader(); fr.onload = () => { b.text = String(fr.result); q('#ebTx').value = b.text; if (!b.pages) { b.pages = A.pagesEst(b.text); q('#ebP').value = b.pages; } if (!b.title.trim()) { b.title = f.name.replace(/\.[^.]+$/, ''); q('#ebT').value = b.title; prev(); } A.snd.chime([659.25, 880], .1, .6); A.toast('Текст добавлен, книга откроется как читалка'); }; fr.readAsText(f, 'utf-8'); });
        q('#ebF').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; b.cover = { img: await A.imgToData(f, 520, .8) }; prev(); A.snd.chime([659.25, 880], .1, .6); });
        A.$$('#ebSug .chip', s.el).forEach(c => c.addEventListener('click', () => { const x = A.SUGGEST[+c.dataset.i]; b.title = x.t; b.author = x.a; b.pages = x.p; b.tags = [...x.m]; q('#ebT').value = x.t; q('#ebA').value = x.a; q('#ebP').value = x.p; A.$$('#ebM .chip', s.el).forEach(m => m.classList.toggle('on', b.tags.includes(m.dataset.k))); prev(); A.snd.twinkle(2); }));
        q('#ebOk').addEventListener('click', () => {
          if (!b.title.trim()) { A.toast('Как называется книга?'); q('#ebT').focus(); return; }
          b.title = b.title.trim(); if (b.status === 'reading' && !b.started) b.started = Date.now(); if (b.status === 'want') b.read = 0; if (b.pages && b.read > b.pages) b.read = b.pages;
          const wasDone = old && old.status === 'done'; const becomeDone = b.status === 'done' && !wasDone;
          if (b.status === 'done') { b.read = b.pages || b.read; if (!wasDone) b.status = 'reading'; }
          if (old) Object.assign(old, b); else A.state.books.unshift(b);
          const target = old || A.state.books[0]; A.save(); s.close(); A.snd.coin(); A.fx.sparks(innerWidth / 2, innerHeight * .6, 26);
          if (becomeDone) setTimeout(() => A.finishBook(target), 500); else A.toast(old ? 'Сохранено' : 'Книга на полке');
          render(true); A.mods.path && A.mods.path.refreshHello && A.mods.path.refreshHello();
        });
      } });
  }
})();
