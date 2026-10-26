/* ============================================================ goals: daily pages -> acorns, week bars, stickers, logging + book completion */
A.goal = (() => {
  let el;
  const C = 2 * Math.PI * 42;
  const msgs = { zero: ['Страничка-другая перед сном? Лес подождёт.', 'Сегодня ещё тихо. Открой любимую книгу.', 'Чай, плед и пара страниц: самое время.'], part: ['Ещё {n} {w}, и желудь твой.', 'Отлично идёшь! Осталось {n} {w}.', 'Лес уже шепчет: ещё {n} {w}.'], done: ['Цель дня выполнена! Желудь в кармане.', 'Идеально. Можно читать дальше просто так.', 'Принцесса сегодня молодец ✨'] };
  const pick = a => a[Math.floor(Date.now() / 86400000) % a.length];
  function mount(root) {
    el = root; root.innerHTML = `<div class="goal glass"><div class="goal__top"><div class="ring"><svg viewBox="0 0 100 100"><defs><linearGradient id="gRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0bf"/><stop offset="1" stop-color="#f1a94b"/></linearGradient></defs><circle cx="50" cy="50" r="42" class="ring__bg"/><circle cx="50" cy="50" r="42" class="ring__fg" id="ringFg" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg><div class="ring__c"><b id="gToday">0</b><small>из <span id="gGoal">20</span> стр.</small></div></div>
      <div class="goal__txt"><div class="eyebrow">сегодня</div><p class="goal__msg" id="gMsg"></p><button class="btn btn--gold goal__btn" id="gLog"><svg class="ico" viewBox="0 0 24 24"><use href="#i-plus"/></svg>Записать страницы</button></div></div>
      <div class="week" id="weekBars"></div><div class="goal__foot"><span id="wTxt"></span><div class="wbar"><i id="wFill"></i></div></div></div>`;
    A.$('#gLog', root).addEventListener('click', () => { A.snd.tap(); logSheet(); });
    refresh();
  }
  function refresh() {
    if (!el) return; const g = A.state.goal, t = A.pagesToday(), p = Math.min(1, t / g.day);
    A.$('#gToday', el).textContent = t; A.$('#gGoal', el).textContent = g.day;
    A.$('#ringFg', el).setAttribute('stroke-dashoffset', C * (1 - p));
    const left = Math.max(0, g.day - t);
    A.$('#gMsg', el).textContent = t === 0 ? pick(msgs.zero) : left > 0 ? pick(msgs.part).replace('{n}', left).replace('{w}', A.plural(left, 'страница', 'страницы', 'страниц')) : pick(msgs.done);
    const keys = A.weekKeys(), vals = keys.map(A.pagesOn), mx = Math.max(g.day * 1.5, ...vals), today = A.dayKey(), names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    A.$('#weekBars', el).innerHTML = keys.map((k, i) => `<div class="wd ${k === today ? 'today' : ''} ${vals[i] >= g.day ? 'ok' : ''}"><div class="wd__bar"><i style="height:${Math.max(4, vals[i] / mx * 100)}%"></i>${vals[i] >= g.day ? '<em>🌰</em>' : ''}</div><span>${names[i]}</span></div>`).join('');
    const w = A.pagesWeek(); A.$('#wTxt', el).textContent = `Неделя: ${w} из ${g.week}`; A.$('#wFill', el).style.width = Math.min(100, w / g.week * 100) + '%';
    A.refreshHud();
  }
  function animateIn() { if (!el) return; const f = A.$('#ringFg', el), v = f.getAttribute('stroke-dashoffset'); f.style.transition = 'none'; f.setAttribute('stroke-dashoffset', C); void f.getBoundingClientRect(); f.style.transition = ''; requestAnimationFrame(() => f.setAttribute('stroke-dashoffset', v)); }

  function logSheet(preBook) {
    const reading = A.state.books.filter(b => b.status === 'reading'), first = preBook || (reading[0] && reading[0].id) || '';
    let n = 10, sel = first;
    A.sheet.open({ title: 'Сколько страниц?', html: `<div class="eyebrow" style="margin-bottom:10px">что читала</div><div class="chips" id="lgBooks" style="margin-bottom:14px">${reading.map(b => `<button class="chip ${b.id === sel ? 'on' : ''}" data-id="${b.id}">${A.esc(b.title)}</button>`).join('')}<button class="chip ${!sel ? 'on' : ''}" data-id="">без книги</button></div>
      <div class="bigstep"><button id="lgM" aria-label="Меньше">−</button><div><b id="lgN">10</b><small>страниц</small></div><button id="lgP" aria-label="Больше">+</button></div>
      <div class="chips" style="justify-content:center;margin:6px 0 20px;padding-bottom:0">${[5, 10, 20, 30, 50].map(v => `<button class="chip" data-q="${v}">+${v}</button>`).join('')}</div>
      <button class="btn btn--gold" style="width:100%" id="lgOk">Записать в дневник</button>`, onMount: s => {
        const q = x => A.$(x, s.el), upd = () => { q('#lgN').textContent = n; };
        A.$$('#lgBooks .chip', s.el).forEach(c => c.addEventListener('click', () => { sel = c.dataset.id; A.$$('#lgBooks .chip', s.el).forEach(x => x.classList.toggle('on', x === c)); A.snd.tap(); }));
        q('#lgM').addEventListener('click', () => { n = Math.max(1, n - 1); upd(); A.snd.tap(); }); q('#lgP').addEventListener('click', () => { n = Math.min(500, n + 1); upd(); A.snd.tap(); });
        A.$$('[data-q]', s.el).forEach(c => c.addEventListener('click', () => { n = Math.min(500, n + +c.dataset.q); upd(); A.snd.twinkle(n % 5); }));
        q('#lgOk').addEventListener('click', () => { s.close(); setTimeout(() => A.logPages(n, sel), 350); });
      } });
  }

  function acornSheet() {
    const st = A.state, open = A.stickersOpen().length;
    A.sheet.open({ title: 'Желуди и стикеры', tall: true, html: `<div class="glass" style="padding:18px;display:flex;align-items:center;gap:16px;margin-bottom:16px"><svg viewBox="0 0 24 24" style="width:46px;height:46px;color:#d9a05b;fill:currentColor"><use href="#i-acorn"/></svg><div><div style="font:200 34px/1 var(--f)">${st.acorns}</div><div class="sub" style="font-size:15px">всего собрано ${st.earned}</div></div></div>
      <p class="sub" style="margin-bottom:14px;font-size:15px">Желудь за каждые 10 страниц, +5 за цель дня, +15 за неделю и +15 за законченную книгу. Новые стикеры открываются сами и пригодятся для открыток.</p>
      <div class="sec__h"><h3>Стикеры</h3><small>${open} из ${A.STICKERS.length}</small></div><div class="stk">${A.STICKERS.map(s => { const ok = st.earned >= s.at; return `<div class="stk__i ${ok ? 'ok' : ''}"><span>${ok ? s.e : '🔒'}</span><small>${ok ? s.n : s.at + ' 🌰'}</small></div>`; }).join('')}</div>` });
  }
  return { mount, refresh, animateIn, acornSheet, logSheet };
})();

A.finishBook = (b, silent) => {
  if (b.status === 'done' && b.finished) return; b.status = 'done'; b.finished = Date.now(); if (b.pages) b.read = b.pages;
  const first = !b.rewarded; b.rewarded = true; A.save(); if (silent) return; if (first) A.addAcorns(15);
  A.snd.unlock2(); A.vibrate([40, 30, 60]); A.fx.petals(innerWidth / 2, innerHeight * .55, 36); A.fx.stars(innerWidth / 2, innerHeight * .4, 24);
  A.toast(`«${b.title}» прочитана. На небе зажглась новая звезда`, 3600);
  A.mods.sky && A.mods.sky.markNew && A.mods.sky.markNew(b.id);
};
A.logPages = (n, bookId) => {
  if (!(n > 0)) return; const st = A.state, key = A.dayKey(), oldTotal = A.pagesTotal(), oldDay = A.pagesToday(), oldWeek = A.pagesWeek();
  st.log[key] = (st.log[key] || 0) + n;
  let finished = null;
  if (bookId) { const b = A.bookById(bookId); if (b) { b.read = Math.min(b.pages || 1e9, (b.read || 0) + n); if (b.status === 'want') b.status = 'reading'; if (b.pages && b.read >= b.pages) finished = b; } }
  const gain = Math.floor((oldTotal + n) / 10) - Math.floor(oldTotal / 10); if (gain > 0) A.addAcorns(gain);
  A.snd.coin(); A.fx.float(innerWidth / 2, innerHeight * .45, `+${n} стр.`); A.vibrate(15);
  if (oldDay < st.goal.day && A.pagesToday() >= st.goal.day && !st.claimedDays[key]) { st.claimedDays[key] = 1; A.addAcorns(5); A.fx.acornRain(); setTimeout(() => { A.snd.chime([659.25, 783.99, 987.77, 1318.5], .1); A.toast('Цель дня выполнена! +5 желудей 🌰', 3200); }, 500); }
  const wk = A.weekId(); if (oldWeek < st.goal.week && A.pagesWeek() >= st.goal.week && !st.claimedWeeks[wk]) { st.claimedWeeks[wk] = 1; A.addAcorns(15); setTimeout(() => { A.fx.acornRain(40); A.toast('Цель недели выполнена! +15 желудей 🌰', 3600); }, 1800); }
  A.save(); if (finished) setTimeout(() => A.finishBook(finished), 600);
  A.goal.refresh(); A.refreshHud(true); A.mods.books && A.mods.books.refresh && A.mods.books.refresh();
  if (A.tab === 'path') setTimeout(() => A.mods.path.checkUnlock(), 1600);
};
