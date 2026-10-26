/* ============================================================ "Цитаты": postcards on aged paper, with stickers, photos and tags */
(() => {
  let el, book = 'all';
  const PAPER = { parch: 'Пергамент', kraft: 'Крафт', night: 'Ночь' };
  const noise = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .3  0 0 0 0 .2  0 0 0 0 .1  0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
  document.documentElement.style.setProperty('--noise', noise);
  const jag = (seed) => { const r = A.rng(A.hash(seed)); const pts = []; const n = 18; for (let i = 0; i <= n; i++) pts.push(`${(i / n * 100).toFixed(1)}% ${(r() * 1.6).toFixed(2)}%`); for (let i = 0; i <= 8; i++) pts.push(`${(99.2 + r() * .8).toFixed(1)}% ${(i / 8 * 100).toFixed(1)}%`); for (let i = n; i >= 0; i--) pts.push(`${(i / n * 100).toFixed(1)}% ${(98.4 + r() * 1.6).toFixed(2)}%`); for (let i = 8; i >= 0; i--) pts.push(`${(r() * .8).toFixed(1)}% ${(i / 8 * 100).toFixed(1)}%`); return `polygon(${pts.join(',')})`; };
  const srcLine = q => { const b = q.bookId && A.bookById(q.bookId); const t = b ? b.title : q.bookTitle, a = b ? b.author : q.author; return [t && `«${t}»`, a].filter(Boolean).join(' · '); };
  const sizeFor = len => len > 220 ? 19 : len > 140 ? 22 : len > 80 ? 25 : 29;

  function cardHTML(q, cls = '', i = 0) {
    return `<div class="pc ${cls}" data-id="${q.id}" style="--rot:${((A.hash(q.id) % 30) - 15) / 10}deg;--i:${i}"><div class="pc__in paper--${q.paper || 'parch'}" style="clip-path:${jag(q.id)}">
      ${q.sticker ? `<span class="pc__stk" style="--r:${((A.hash(q.id + 's') % 40) - 20)}deg">${q.sticker}</span>` : ''}
      <p class="pc__t" style="font-size:${sizeFor(q.text.length)}px">${A.esc(q.text)}</p>
      <div class="pc__src">${A.esc(srcLine(q))}${q.page ? `, стр. ${A.esc(q.page)}` : ''}</div>
      ${q.tags && q.tags.length ? `<div class="pc__tags">${q.tags.map(t => `<i>#${A.esc(t)}</i>`).join('')}</div>` : ''}
      ${q.photo ? `<div class="pc__ph"><img src="${q.photo}" alt=""><b></b></div>` : ''}
      </div></div>`;
  }

  const mod = A.mods.quotes = {
    init() {}, show() { A.casket.enter(); }, refresh() { A.casket && A.casket.refresh(); }, view, editQuote, cardHTML
  };

  function render() { A.casket && A.casket.refresh(); }

  /* ---------------------------------------------------------------- viewer */
  function view(id) {
    const q = A.state.quotes.find(x => x.id === id); if (!q) return;
    A.sheet.open({ title: '', noHead: true, tall: true, html: `<div class="pcv">${cardHTML(q, 'big')}</div><div class="row" style="margin-top:22px"><button class="btn btn--gold" id="qvShare">Сохранить картинкой</button><button class="btn btn--ghost" id="qvEdit">Изменить</button></div><button class="btn btn--danger" style="width:100%;margin-top:12px" id="qvDel">Удалить</button>`,
      onMount: s => {
        A.$('#qvShare', s.el).addEventListener('click', async () => { A.snd.quill(); const url = await renderPNG(q); showImage(url, q); });
        A.$('#qvEdit', s.el).addEventListener('click', () => { s.close(); setTimeout(() => editQuote(q.id), 450); });
        A.$('#qvDel', s.el).addEventListener('click', () => { const b = A.$('#qvDel', s.el); if (b.dataset.sure) { A.state.quotes = A.state.quotes.filter(x => x.id !== q.id); A.save(); s.close(); A.snd.pop(); render(); A.toast('Открытка улетела'); } else { b.dataset.sure = 1; b.textContent = 'Точно? Нажми ещё раз'; setTimeout(() => { b.textContent = 'Удалить'; delete b.dataset.sure; }, 3200); } });
      } });
  }
  function showImage(url, q) {
    A.sheet.open({ title: 'Открытка готова', tall: true, html: `<p class="sub" style="margin-bottom:14px;font-size:15px">Нажми на картинку и удерживай палец, затем «Сохранить в Фото».</p><img src="${url}" alt="" style="width:100%;border-radius:14px;box-shadow:0 20px 50px rgba(0,0,0,.5);-webkit-user-select:auto;user-select:auto;-webkit-touch-callout:default"><button class="btn btn--gold" style="width:100%;margin-top:16px" id="qiSh">Поделиться</button>`,
      onMount: s => A.$('#qiSh', s.el).addEventListener('click', async () => { try { const blob = await (await fetch(url)).blob(), f = new File([blob], 'otkrytka.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: 'Цитата' }); else A.toast('Сохрани картинку долгим нажатием'); } catch (e) { A.toast('Сохрани картинку долгим нажатием'); } }) });
  }
  async function renderPNG(q) {
    try { await document.fonts.load('italic 36px "Cormorant Garamond"'); } catch (e) {}
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), P = { parch: ['#f6e9c8', '#e3cd9b', '#2b2114'], kraft: ['#d9b184', '#b8895a', '#2a1a0e'], night: ['#1c2c55', '#0b1330', '#ffe6a3'] }[q.paper || 'parch'];
    const bg = g.createRadialGradient(W * .3, H * .2, 80, W / 2, H / 2, H * .85); bg.addColorStop(0, P[0]); bg.addColorStop(1, P[1]); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const r = A.rng(A.hash(q.id)); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${q.paper === 'night' ? '255,255,255' : '90,60,20'},${r() * .06})`; g.fillRect(r() * W, r() * H, 2 + r() * 3, 2 + r() * 3); }
    for (let i = 0; i < 6; i++) { const x = r() * W, y = r() * H, rr = 120 + r() * 220, st = g.createRadialGradient(x, y, 0, x, y, rr); st.addColorStop(0, q.paper === 'night' ? 'rgba(120,150,255,.08)' : 'rgba(150,100,40,.12)'); st.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = st; g.fillRect(0, 0, W, H); }
    const ed = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .75); ed.addColorStop(0, 'rgba(0,0,0,0)'); ed.addColorStop(1, q.paper === 'night' ? 'rgba(0,0,10,.5)' : 'rgba(80,40,0,.38)'); g.fillStyle = ed; g.fillRect(0, 0, W, H);
    g.strokeStyle = q.paper === 'night' ? 'rgba(255,226,160,.45)' : 'rgba(90,55,20,.35)'; g.lineWidth = 3; g.strokeRect(48, 48, W - 96, H - 96);
    g.fillStyle = P[2]; g.textAlign = 'center'; const text = '«' + q.text + '»', fs = q.text.length > 220 ? 52 : q.text.length > 140 ? 62 : q.text.length > 80 ? 72 : 84; g.font = `italic 500 ${Math.round(fs*1.14)}px "Cormorant Garamond", Georgia, serif`;
    const words = text.split(/\s+/), lines = []; let ln = ''; words.forEach(w => { const t = ln ? ln + ' ' + w : w; if (g.measureText(t).width > W - 260 && ln) { lines.push(ln); ln = w; } else ln = t; }); lines.push(ln);
    const lh = fs * 1.3, hasPh = !!q.photo, top = (hasPh ? 330 : 440) - lines.length * lh / 2 + 220;
    lines.forEach((l, i) => g.fillText(l, W / 2, top + i * lh));
    g.font = 'italic 40px "Cormorant Garamond", serif'; g.globalAlpha = .8; g.fillText([srcLine(q), q.page && `стр. ${q.page}`].filter(Boolean).join(', '), W / 2, top + lines.length * lh + 50); g.globalAlpha = 1;
    if (q.tags && q.tags.length) { g.font = '300 34px "Inter Tight", sans-serif'; g.globalAlpha = .65; g.fillText(q.tags.map(t => '#' + t).join('   '), W / 2, H - 150); g.globalAlpha = 1; }
    if (q.sticker) { g.font = '170px serif'; g.save(); g.translate(W - 190, 190); g.rotate(.2); g.fillText(q.sticker, 0, 0); g.restore(); }
    g.font = "italic 400 48px \"Cormorant Garamond\", serif"; g.globalAlpha = .75; g.fillText('Уголок принцессы Айсель', W / 2, H - 90); g.globalAlpha = 1;
    if (q.photo) { await new Promise(res => { const im = new Image(); im.onload = () => { g.save(); g.translate(W - 330, H - 480); g.rotate(.06); g.fillStyle = '#fffaf0'; g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 30; g.fillRect(-170, -190, 340, 400); g.shadowBlur = 0; const k = Math.max(300 / im.width, 300 / im.height); g.save(); g.beginPath(); g.rect(-150, -170, 300, 300); g.clip(); g.drawImage(im, -150 + (300 - im.width * k) / 2, -170 + (300 - im.height * k) / 2, im.width * k, im.height * k); g.restore(); g.fillStyle = 'rgba(240,220,160,.8)'; g.fillRect(-60, -210, 120, 36); g.restore(); res(); }; im.onerror = res; im.src = q.photo; }); }
    return c.toDataURL('image/png');
  }

  /* ---------------------------------------------------------------- editor */
  function editQuote(id, preBook) {
    const old = id ? A.state.quotes.find(x => x.id === id) : null;
    const q = old ? JSON.parse(JSON.stringify(old)) : { id: A.uid(), bookId: preBook || (A.state.books.find(b => b.status === 'reading') || {}).id || '', bookTitle: '', author: '', text: '', page: '', tags: [], sticker: '🌙', paper: 'parch', photo: null, date: Date.now() };
    const stk = A.STICKERS;
    A.sheet.open({ title: old ? 'Изменить открытку' : 'Новая цитата', tall: true, html: `<div class="qprev" id="qPrev"></div>
      <label class="field"><span>Цитата</span><textarea class="in" id="qeT" placeholder="Фраза, которая запомнилась…" style="min-height:120px;font-family:var(--serif);font-size:22px;font-style:italic">${A.esc(q.text)}</textarea></label>
      <div class="field"><span>Из какой книги</span><div class="chips wrapchips" id="qeB">${A.state.books.map(b => `<button class="chip ${q.bookId === b.id ? 'on' : ''}" data-id="${b.id}">${A.esc(b.title)}</button>`).join('')}<button class="chip ${!q.bookId ? 'on' : ''}" data-id="">другая</button></div></div>
      <div id="qeFree" ${q.bookId ? 'hidden' : ''}><div class="row"><label class="field"><span>Книга</span><input class="in" id="qeBT" value="${A.esc(q.bookTitle)}"></label><label class="field"><span>Автор</span><input class="in" id="qeBA" value="${A.esc(q.author)}"></label></div></div>
      <div class="row"><label class="field"><span>Страница</span><input class="in" id="qeP" value="${A.esc(q.page)}" inputmode="numeric"></label><label class="field"><span>Теги через запятую</span><input class="in" id="qeG" value="${A.esc((q.tags || []).join(', '))}" placeholder="любовь, осень"></label></div>
      <div class="field"><span>Бумага</span><div class="seg" id="qeS">${Object.entries(PAPER).map(([k, v]) => `<button data-p="${k}" class="${q.paper === k ? 'on' : ''}">${v}</button>`).join('')}</div></div>
      <div class="field"><span>Стикер</span><div class="stkpick" id="qeK">${stk.map(s => { const ok = A.state.earned >= s.at; return `<button class="${ok ? '' : 'lock'} ${q.sticker === s.e ? 'on' : ''}" data-e="${s.e}" data-at="${s.at}">${ok ? s.e : '🔒'}</button>`; }).join('')}<button data-e="" class="${!q.sticker ? 'on' : ''}">∅</button></div></div>
      <div class="field"><span>Фото</span><div class="row" style="gap:10px"><label class="btn btn--ghost" style="height:44px"><svg class="ico" viewBox="0 0 24 24"><use href="#i-camera"/></svg>${q.photo ? 'Заменить' : 'Добавить'}<input type="file" id="qeF" accept="image/*" hidden></label><button class="btn btn--ghost" style="height:44px" id="qeNoF" ${q.photo ? '' : 'hidden'}>Убрать</button></div></div>
      <button class="btn btn--gold" style="width:100%;margin-top:8px" id="qeOk">${old ? 'Сохранить' : 'Сделать открытку'}</button>`,
      onMount: s => {
        const Q = x => A.$(x, s.el), prev = () => { const tmp = Object.assign({}, q, { text: q.text || 'Здесь появится твоя цитата…' }); Q('#qPrev').innerHTML = cardHTML(tmp, 'prev'); };
        prev();
        Q('#qeT').addEventListener('input', e => { q.text = e.target.value; prev(); });
        A.$$('#qeB .chip', s.el).forEach(c => c.addEventListener('click', () => { q.bookId = c.dataset.id; A.$$('#qeB .chip', s.el).forEach(x => x.classList.toggle('on', x === c)); Q('#qeFree').hidden = !!q.bookId; A.snd.tap(); prev(); }));
        Q('#qeBT').addEventListener('input', e => { q.bookTitle = e.target.value; prev(); }); Q('#qeBA').addEventListener('input', e => { q.author = e.target.value; prev(); });
        Q('#qeP').addEventListener('input', e => { q.page = e.target.value; prev(); }); Q('#qeG').addEventListener('input', e => { q.tags = e.target.value.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean).slice(0, 5); prev(); });
        A.$$('#qeS button', s.el).forEach(b => b.addEventListener('click', () => { q.paper = b.dataset.p; A.$$('#qeS button', s.el).forEach(x => x.classList.toggle('on', x === b)); A.snd.page(); prev(); }));
        A.$$('#qeK button', s.el).forEach(b => b.addEventListener('click', () => { if (b.classList.contains('lock')) { A.snd.owl(); A.toast(`Откроется на ${b.dataset.at} 🌰: читай больше`); return; } q.sticker = b.dataset.e; A.$$('#qeK button', s.el).forEach(x => x.classList.toggle('on', x === b)); A.snd.twinkle(3); prev(); }));
        Q('#qeF').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; q.photo = await A.imgToData(f, 560, .8); Q('#qeNoF').hidden = false; A.snd.chime([659.25, 880], .1, .6); prev(); });
        Q('#qeNoF').addEventListener('click', () => { q.photo = null; Q('#qeNoF').hidden = true; prev(); });
        Q('#qeOk').addEventListener('click', () => {
          if (!q.text.trim()) { A.toast('Впиши фразу, которую хочется сохранить'); Q('#qeT').focus(); return; }
          q.text = q.text.trim(); const b = q.bookId && A.bookById(q.bookId); if (b) { q.bookTitle = b.title; q.author = b.author; }
          if (old) Object.assign(old, q); else { q.date = Date.now(); A.state.quotes.unshift(q); const key = 'q' + A.dayKey(); A.state.bonusDone[key] = (A.state.bonusDone[key] || 0) + 1; if (A.state.bonusDone[key] <= 3) A.addAcorns(1); }
          A.save(); s.close(); A.snd.quill(); setTimeout(() => A.snd.chime([783.99, 987.77], .12, .7), 250); A.fx.sparks(innerWidth / 2, innerHeight * .55, 30, '#f3d9a0'); A.toast('Открытка в цитатнике 🪶'); render(true);
        });
      } });
  }
})();
