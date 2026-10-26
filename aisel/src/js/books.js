/* ============================================================ "Полка": the catalogue */
(() => {
  let el, filter = 'all', query = '';
  const ST = { want: 'Хочу прочитать', reading: 'Читаю', done: 'Прочитано' };
  const IMP = ['Мурашки', 'Плакала', 'Не оторваться', 'Уютная', 'Затянуло', 'Заставила думать', 'Смеялась', 'Разочарование'];

  const mod = A.mods.books = {
    init() {},
    show() { A.scene.lock(true); A.lib.show(); }, hide() { A.lib.hide(); },
    beforeShow() {}, refresh() { render(); mod.repaintDetail && mod.repaintDetail(); }, openBook, editBook
  };
  function render() { A.lib && A.lib.render(); }

  /* ---------------------------------------------------------------- detail */
  function openBook(id) {
    const b = A.bookById(id); if (!b) return;
    const quotes = () => A.state.quotes.filter(q => q.bookId === b.id);
    const sh = A.sheet.open({ tall: true, noHead: true, html: '', onClose: () => { render(); }, onMount: s => { paint(s); } });
    function paint(s) {
      const pr = b.pages ? Math.round((b.read || 0) / b.pages * 100) : 0;
      s.body.innerHTML = `<div class="bd"><div class="bd__cover tilt">${A.coverHTML(b)}<span class="bd__glow"></span></div>
        <h2 class="bd__t">${A.esc(b.title)}</h2><p class="sub bd__a">${A.esc(b.author || 'автор неизвестен')}</p>
        <div class="seg" id="bdSt">${Object.keys(ST).map(k => `<button data-s="${k}" class="${b.status === k ? 'on' : ''}">${ST[k]}</button>`).join('')}</div>
        ${b.hasText ? '<button class="btn btn--gold" style="width:100%;margin:2px 0 16px" id="bdRead">Читать</button>' : ''}
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
      q('#bdDel').addEventListener('click', () => { const bt = q('#bdDel'); if (bt.dataset.sure) { A.state.books = A.state.books.filter(x => x.id !== b.id); A.txt.del(b.id); A.state.quotes.forEach(x => { if (x.bookId === b.id) x.bookId = null; }); A.save(); s.close(); A.snd.pop(); A.toast('Книга ушла с полки'); } else { bt.dataset.sure = 1; bt.textContent = 'Точно? Нажми ещё раз'; setTimeout(() => { bt.textContent = 'Удалить'; delete bt.dataset.sure; }, 3200); } });
      s._repaint = () => paint(s);
    }
    mod._detail = sh;
    function setStatus(k) { const was = b.status; b.status = k; if (k === 'reading' && !b.started) b.started = Date.now(); if (k === 'want') { b.read = 0; } if (k === 'done' && was !== 'done') { b.finished = null; A.finishBook(b); } else A.save(); A.mods.path && A.mods.path.refreshHello && 0; }
  }
  mod.repaintDetail = () => { if (mod._detail && mod._detail.el.isConnected && mod._detail._repaint) mod._detail._repaint(); };
  

  function tilt(card) { if (!card || !A.fine) return; card.addEventListener('pointermove', e => { const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; card.style.transform = `perspective(700px) rotateY(${x * 24}deg) rotateX(${-y * 18}deg)`; }); card.addEventListener('pointerleave', () => card.style.transform = ''); }

  /* ---------------------------------------------------------------- add / edit */
  function editBook(id) {
    const old = id ? A.bookById(id) : null; let pending = null;
    const b = old ? JSON.parse(JSON.stringify(old)) : { id: A.uid(), title: '', author: '', pages: 0, read: 0, status: 'want', rating: 0, tags: [], imp: [], impression: '', added: Date.now(), cover: {} };
    A.sheet.open({ title: old ? 'Изменить книгу' : 'Новая книга', tall: true, html: `<div class="eb"><div class="eb__prev" id="ebPrev"></div><div class="eb__f">
      <label class="field"><span>Название</span><input class="in" id="ebT" value="${A.esc(b.title)}" placeholder="Например, Маленький принц"></label>
      <label class="field"><span>Автор</span><input class="in" id="ebA" value="${A.esc(b.author)}" placeholder="Кто написал"></label></div></div>
      ${old ? '' : `<div class="sec__h"><h3 style="font-size:16px">Подсказки от леса</h3></div><div class="chips" id="ebSug">${A.SUGGEST.map((x, i) => `<button class="chip" data-i="${i}">${A.esc(x.t)}</button>`).join('')}</div>`}
      <div class="row"><label class="field"><span>Страниц</span><input class="in" id="ebP" type="number" inputmode="numeric" min="0" value="${b.pages || ''}"></label><label class="field"><span>Прочитано</span><input class="in" id="ebR" type="number" inputmode="numeric" min="0" value="${b.read || ''}"></label></div>
      <div class="field"><span>Статус</span><div class="seg" id="ebS">${Object.keys(ST).map(k => `<button data-s="${k}" class="${b.status === k ? 'on' : ''}">${ST[k]}</button>`).join('')}</div></div>
      <div class="field"><span>Настроение книги</span><div class="chips wrapchips" id="ebM">${Object.entries(A.MOODS).map(([k, v]) => `<button class="chip ${b.tags.includes(k) ? 'on' : ''}" data-k="${k}">${v}</button>`).join('')}</div></div>
      <div class="field"><span>Свой текст для читалки</span><label class="btn btn--ghost imp" style="width:100%"><svg class="ico" viewBox="0 0 24 24"><use href="#i-plus"/></svg>Загрузить PDF, EPUB, TXT<input type="file" id="ebTf" accept="${A.importer.ACCEPT}" hidden></label><p class="sub" id="ebImpNote" style="font-size:15px;margin:8px 2px 0">${b.hasText ? 'Текст уже в читалке. Загрузи другой файл, чтобы заменить.' : 'Название, автор и обложка подтянутся сами.'}</p>
        <textarea class="in" id="ebTx" placeholder="…или вставь текст сюда" style="min-height:86px;font-size:14px;margin-top:10px"></textarea></div>
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
        q('#ebTx').addEventListener('input', e => { pending = { text: e.target.value }; if (!old || !old.pages) { b.pages = A.pagesEst(e.target.value); q('#ebP').value = b.pages || ''; } });
        q('#ebTf').addEventListener('change', async e => {
          const f = e.target.files[0]; if (!f) return; const note = q('#ebImpNote'); note.textContent = 'Читаю файл…';
          try { const r = await A.importer.read(f, (i, n) => { note.textContent = `Читаю страницы: ${i} из ${n}`; });
            pending = r; q('#ebTx').value = ''; if (!b.title.trim() || !old) { b.title = r.title; q('#ebT').value = r.title; } if (r.author && !b.author) { b.author = r.author; q('#ebA').value = r.author; }
            if (r.cover) b.cover = { img: r.cover }; b.pages = r.pageCount || A.pagesEst(r.text); q('#ebP').value = b.pages; prev(); note.textContent = `Готово: ${r.text.length > 1e6 ? Math.round(r.text.length / 1e5) / 10 + ' млн' : Math.round(r.text.length / 1000) + ' тыс.'} знаков. Нажми «${old ? 'Сохранить' : 'Поставить на полку'}».`; A.snd.chime([659.25, 880], .1, .6);
          } catch (err) { note.textContent = err.message === 'scan' ? 'В этом PDF нет текста: похоже на скан. Нужен файл с текстовым слоем.' : err.message === 'big' ? 'Файл слишком большой для телефона.' : err.message === 'lib' ? 'Не удалось загрузить модуль чтения. Проверь интернет и попробуй ещё раз.' : 'Не получилось прочитать этот файл.'; A.toast(note.textContent); }
        });
        q('#ebF').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; b.cover = { img: await A.imgToData(f, 520, .8) }; prev(); A.snd.chime([659.25, 880], .1, .6); });
        A.$$('#ebSug .chip', s.el).forEach(c => c.addEventListener('click', () => { const x = A.SUGGEST[+c.dataset.i]; b.title = x.t; b.author = x.a; b.pages = x.p; b.tags = [...x.m]; q('#ebT').value = x.t; q('#ebA').value = x.a; q('#ebP').value = x.p; A.$$('#ebM .chip', s.el).forEach(m => m.classList.toggle('on', b.tags.includes(m.dataset.k))); prev(); A.snd.twinkle(2); }));
        q('#ebOk').addEventListener('click', () => {
          if (!b.title.trim()) { A.toast('Как называется книга?'); q('#ebT').focus(); return; }
          b.title = b.title.trim(); if (b.status === 'reading' && !b.started) b.started = Date.now(); if (b.status === 'want') b.read = 0; if (b.pages && b.read > b.pages) b.read = b.pages;
          const wasDone = old && old.status === 'done'; const becomeDone = b.status === 'done' && !wasDone;
          if (b.status === 'done') { b.read = b.pages || b.read; if (!wasDone) b.status = 'reading'; }
          if (pending && pending.text && pending.text.trim()) { b.hasText = true; if (!b.pages) b.pages = A.pagesEst(pending.text); }
          if (old) Object.assign(old, b); else A.state.books.unshift(b);
          const target = old || A.state.books[0]; if (pending && pending.text && pending.text.trim()) A.txt.put(target.id, pending.text.trim()); A.save(); s.close(); A.snd.coin(); A.fx.sparks(innerWidth / 2, innerHeight * .6, 26);
          if (becomeDone) setTimeout(() => A.finishBook(target), 500); else A.toast(old ? 'Сохранено' : 'Книга на полке');
          render(true);
        });
      } });
  }
})();
