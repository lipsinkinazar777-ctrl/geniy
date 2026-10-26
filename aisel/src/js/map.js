/* ============================================================ "Тропа": goal card + photographic trail of forest places that open as she reads */
A.LOCS = [
  { n: 'Опушка костра', at: 0, s: 'Здесь всё начинается: тёплый огонь, тихая долина и первая страница.', snd: 'owl' },
  { n: 'Привал у ручья', at: 10, s: 'Закат, горячий кофе и книга в палатке. Лучшее место для первой главы.', snd: 'stream' },
  { n: 'Поляна светлячков', at: 30, s: 'Светлячки собираются вокруг тех, кто читает вслух. Присядь на мох.', snd: 'twinkle' },
  { n: 'Туманная чаща', at: 60, s: 'Здесь шепчутся тайны и детективы. Туман расступается только для внимательных.', snd: 'owl' },
  { n: 'Лесная читальня', at: 100, s: 'Ветви сходятся, как своды. Тишина такая, что слышно, как переворачивается страница.', snd: 'stream' },
  { n: 'Хрустальный фонарь', at: 150, s: 'Одинокий фонарь освещает тропу тем, кто дочитывает до последней строки.', snd: 'chime' },
  { n: 'Тайная библиотека', at: 210, s: 'Старые корешки, запах бумаги и свечей. Каждая полка хранит чью-то историю.', snd: 'twinkle' },
  { n: 'Замок принцессы', at: 280, s: 'Дорога привела домой. Здесь твоя корона, твой трон и все твои истории.', snd: 'unlock' }
];
A.unlockedCount = () => { const p = A.points(); let n = 0; A.LOCS.forEach((l, i) => { if (p >= l.at) n = i + 1; }); return n; };

(() => {
  let el, trail, marker, cards = [];
  const IMGS = i => `img/loc-${i}.webp`;
  const mod = A.mods.path = {
    init(root) {
      el = root; if (!A.state.locSeen) { A.state.locSeen = A.unlockedCount(); A.save(); }
      root.innerHTML = `<div class="wrap"><div data-rise><div class="eyebrow" id="helloEb">карта леса</div><h1 class="h1">Лесная <em>тропа</em></h1><p class="sub">Чем больше читаешь, тем дальше ведёт дорога.</p></div>
        <section class="sec" data-rise><div class="sec__h"><h3>Места</h3><small id="mapCount"></small></div><div class="trail" id="trail"></div></section><div style="height:40px"></div></div>`;
      buildMap();
    },
    show() { A.rise(el); setTimeout(() => { mod.checkUnlock(); const cur = Math.max(0, A.unlockedCount() - 1), c = cards[cur]; if (c) el.scrollTo({ top: Math.max(0, c.offsetTop + trail.offsetTop - innerHeight * .32), behavior: 'smooth' }); }, 700); },
    refreshGoal() { A.mods.bag && A.mods.bag.refreshGoal(); }, refreshHello() {},
    checkUnlock() { const n = A.unlockedCount(); if (n > A.state.locSeen) { const from = A.state.locSeen; A.state.locSeen = n; A.save(); celebrate(from, n); } },
    acornSheet: () => A.goal.acornSheet(),
    rebuild() { if (el) buildMap(); }
  };

  function buildMap() {
    trail = A.$('#trail', el); const unl = A.unlockedCount(), cur = Math.max(0, unl - 1);
    trail.innerHTML = `<div class="trail__line"><i class="trail__fill"></i></div>` + A.LOCS.map((l, i) => {
      const open = i < unl, bk = booksAt(i), need = Math.max(1, l.at - A.points());
      return `<article class="loc ${open ? 'open' : 'locked'} ${i === cur ? 'cur' : ''}" data-i="${i}" style="--i:${i}"><i class="loc__dot"></i>
        <div class="loc__card"><div class="loc__ph" style="background-image:url(${IMGS(i)})"></div><div class="loc__shade"></div>
        ${open ? '' : `<svg class="ico loc__lock" viewBox="0 0 24 24"><use href="#i-lock"/></svg>`}
        <div class="loc__txt"><small>место ${i + 1}</small><h4>${open ? l.n : 'Скрыто в тумане'}</h4>${open ? `<p>${l.s}</p>` : ''}</div>
        <div class="loc__meta">${open ? (bk.length ? `${bk.length} ${A.plural(bk.length, 'книга', 'книги', 'книг')}` : 'пока пусто') : `ещё ${need} ${A.plural(need, 'шаг', 'шага', 'шагов')}`}</div></div></article>`;
    }).join('') + `<div class="trail__me" id="trailMe"><span class="medal__img"></span></div>`;
    cards = A.$$('.loc', trail); marker = A.$('#trailMe', trail);
    A.$('#mapCount', el).textContent = `открыто ${unl} из ${A.LOCS.length}`;
    cards.forEach(c => c.addEventListener('click', () => openLoc(+c.dataset.i)));
    A.applyPortrait && A.applyPortrait();
    requestAnimationFrame(() => { layout(cur); });
  }
  const dotY = i => cards[i] ? cards[i].offsetTop + 34 : 0;
  function layout(cur) { const y = dotY(cur); marker.style.transform = `translateY(${y}px)`; const f = A.$('.trail__fill', trail), top = dotY(0); f.style.top = top + 'px'; f.style.height = Math.max(0, y - top) + 'px'; A.$('.trail__line', trail).style.top = top + 'px'; A.$('.trail__line', trail).style.bottom = (trail.offsetHeight - dotY(cards.length - 1)) + 'px'; }
  function booksAt(i) { const unl = A.unlockedCount(), done = A.doneBooks().sort((a, b) => (a.finished || 0) - (b.finished || 0)); return done.filter((_, k) => (k % Math.max(1, unl)) === i); }
  function travel(from, to) { const a = dotY(from), b = dotY(to), t0 = performance.now(), dur = 2200; A.snd.whoosh(1); (function step(t) { const k = A.clamp((t - t0) / dur, 0, 1), y = A.lerp(a, b, A.ease.inOut(k)); marker.style.transform = `translateY(${y}px)`; A.$('.trail__fill', trail).style.height = (y - dotY(0)) + 'px'; if (Math.random() < .2) { const bb = marker.getBoundingClientRect(); A.fx.fireflies(bb.left + bb.width / 2, bb.top + bb.height / 2, 2, 40); } if (k < 1) requestAnimationFrame(step); })(t0); }
  const hero = (i, locked) => `<div class="loc-hero"><div class="loc-hero__ph" style="background-image:url(${IMGS(i)})"></div><div class="loc-hero__shade"></div></div>`;
  function celebrate(from, to) {
    const loc = A.LOCS[to - 1]; A.snd.unlock2(); A.fx.fireflies(innerWidth / 2, innerHeight * .4, 40, 260); A.vibrate([30, 40, 30]);
    A.addAcorns(5);
    A.sheet.open({ title: 'Открыто новое место', html: `${hero(to - 1)}<h2 class="h1" style="text-align:center;margin:18px 0 8px"><em>${loc.n}</em></h2><p class="sub" style="text-align:center;margin-bottom:18px">${loc.s}</p><button class="btn btn--gold" style="width:100%" id="lcGo">Отправиться туда</button>`, onMount: s => { A.$('#lcGo', s.el).addEventListener('click', () => { s.close(); A.go('path', { force: true }); setTimeout(() => { buildMap(); setTimeout(() => { layout(from - 1); setTimeout(() => travel(from - 1, to - 1), 300); }, 80); }, 600); }); }, onClose: () => { buildMap(); } });
  }
  function openLoc(i) {
    const loc = A.LOCS[i], unl = A.unlockedCount();
    if (i >= unl) { A.snd.owl(); A.vibrate(20); const c = cards[i]; c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); const need = loc.at - A.points(); A.toast(`Здесь густой туман. Ещё ${need} ${A.plural(need, 'шаг', 'шага', 'шагов')}: читай, и он рассеется`); return; }
    const books = booksAt(i); A.snd.page();
    setTimeout(() => { if (loc.snd === 'stream') A.snd.stream(5); else if (loc.snd === 'twinkle') { A.snd.twinkle(1); setTimeout(() => A.snd.twinkle(3), 300); setTimeout(() => A.snd.twinkle(0), 700); } else if (loc.snd === 'owl') A.snd.owl(); else if (loc.snd === 'chime') A.snd.chime([523.25, 659.25, 783.99, 987.77], .16); else A.snd.unlock2(); }, 350);
    A.sheet.open({ title: '', noHead: true, html: `${hero(i)}<div class="eyebrow" style="text-align:center;margin-top:16px">место ${i + 1} из ${A.LOCS.length}</div><h2 class="h1" style="text-align:center;margin:8px 0 8px"><em>${loc.n}</em></h2><p class="sub" style="text-align:center;margin-bottom:18px">${loc.s}</p>
      <div class="sec__h"><h3>Здесь живут книги</h3></div>${books.length ? `<div class="shelf-row">${books.map(b => `<div class="mini" data-id="${b.id}">${A.coverHTML(b)}</div>`).join('')}</div>` : `<div class="glass" style="padding:18px;text-align:center;color:var(--ink2)">Пока тихо. Дочитай книгу, и она поселится здесь.</div>`}`,
      onMount: s => A.$$('.mini', s.el).forEach(m => m.addEventListener('click', () => { s.close(); A.go('books'); setTimeout(() => A.mods.books.openBook(m.dataset.id), 900); })) });
  }
})();
