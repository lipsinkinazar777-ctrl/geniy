/* ============================================================ ui: toast, sheets, router with iris transitions, hud, settings */
A.mods = {};
A.toast = (msg, ms = 2600) => { const t = A.$('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), ms); };

/* ---------------------------------------------------------------- sheets */
A.sheet = (() => {
  const root = A.$('#sheets'); let z = 1;
  function open({ title = '', html = '', tall = false, onMount, onClose, noHead = false }) {
    const bg = A.h('<div class="sheet-bg"></div>'), el = A.h(`<div class="sheet ${tall ? 'tall' : ''}"><div class="sheet__grab"></div>${noHead ? '' : `<div class="sheet__head"><h3>${title}</h3><button class="sheet__x" aria-label="Закрыть"><svg class="ico" viewBox="0 0 24 24"><use href="#i-close"/></svg></button></div>`}<div class="sheet__body">${html}</div></div>`);
    bg.style.zIndex = el.style.zIndex = 10 + (z += 2); root.append(bg, el); root.style.pointerEvents = 'auto';
    requestAnimationFrame(() => requestAnimationFrame(() => { bg.classList.add('in'); el.classList.add('in'); }));
    A.snd.page();
    let closed = false;
    const close = () => { if (closed) return; closed = true; bg.classList.remove('in'); el.classList.remove('in'); el.style.transform = ''; setTimeout(() => { bg.remove(); el.remove(); if (!root.children.length) root.style.pointerEvents = 'none'; }, 750); onClose && onClose(); };
    bg.addEventListener('click', close); const x = A.$('.sheet__x', el); x && x.addEventListener('click', close);
    // swipe down on the grab bar / header
    let sy = 0, dy = 0, drag = false;
    const hd = [A.$('.sheet__grab', el), A.$('.sheet__head', el)].filter(Boolean);
    hd.forEach(h => { h.addEventListener('pointerdown', e => { if (e.target.closest('.sheet__x')) return; drag = true; sy = e.clientY; dy = 0; el.style.transition = 'none'; h.setPointerCapture(e.pointerId); });
      h.addEventListener('pointermove', e => { if (!drag) return; dy = Math.max(0, e.clientY - sy); el.style.transform = `translateY(${dy}px)`; });
      const end = () => { if (!drag) return; drag = false; el.style.transition = ''; if (dy > 110) close(); else el.style.transform = ''; };
      h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end); });
    const api = { el, body: A.$('.sheet__body', el), close };
    onMount && onMount(api); return api;
  }
  return { open };
})();

/* ---------------------------------------------------------------- hud */
A.refreshHud = (bump) => {
  A.$('#acornN').textContent = A.state.acorns; A.$('#streakN').textContent = A.streak();
  if (bump) { const p = A.$('#acornPill'); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
};
A.onSticker = s => { setTimeout(() => { A.snd.unlock2(); A.fx.stars(innerWidth / 2, innerHeight * .4, 36); A.toast(`Новый стикер: ${s.e} ${s.n}`); }, 600); };

/* ---------------------------------------------------------------- router */
const TABS = ['path', 'books', 'quotes', 'sky', 'potion'];
A.tab = null;
A.go = (tab, opt = {}) => {
  if (tab === A.tab && !opt.force) { const v = A.$('#v-' + tab); v.scrollTo({ top: 0, behavior: 'smooth' }); A.snd.tap(); return; }
  const from = A.tab, fromEl = from && A.$('#v-' + from), toEl = A.$('#v-' + tab), btn = A.$(`.tabs button[data-tab="${tab}"]`);
  const idx = TABS.indexOf(tab), dir = from ? Math.sign(idx - TABS.indexOf(from)) || 1 : 1;
  A.tab = tab; document.body.dataset.tab = tab;
  A.$$('.tabs button').forEach(b => b.classList.toggle('on', b === btn));
  const glow = A.$('#tabGlow'), r = btn.getBoundingClientRect(), tr = A.$('#tabs').getBoundingClientRect();
  glow.style.width = r.width + 'px'; glow.style.transform = `translateX(${r.left - tr.left}px)`;
  A.snd.setMood(tab); A.fab && A.fab.hide();
  const mod = A.mods[tab]; mod && mod.beforeShow && mod.beforeShow();
  A.scene.setTab(tab);
  toEl.classList.add('active'); toEl.scrollTop = 0; toEl.style.zIndex = 2;
  if (opt.instant || !fromEl) { if (fromEl) fromEl.classList.remove('active'); mod && mod.show && mod.show(); return; }
  fromEl.style.zIndex = 1; A.snd.whoosh(dir);
  const x = r.left + r.width / 2, y = r.top + r.height / 2, R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 40;
  if (!A.reduceMotion) {
    toEl.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${R}px at ${x}px ${y}px)` }], { duration: 900, easing: 'cubic-bezier(.55,.05,.15,1)' });
    fromEl.animate([{ opacity: 1, transform: 'scale(1) translateX(0)', filter: 'blur(0)' }, { opacity: 0, transform: `scale(.93) translateX(${-dir * 26}px)`, filter: 'blur(10px)' }], { duration: 700, easing: 'ease-in', fill: 'forwards' }).finished.then(() => { fromEl.classList.remove('active'); fromEl.getAnimations().forEach(a => a.cancel()); });
    const ir = A.$('#iris'); ir.style.left = x + 'px'; ir.style.top = y + 'px';
    ir.animate([{ opacity: .95, transform: 'scale(.4)' }, { opacity: .5, transform: `scale(${R / 14})`, offset: .7 }, { opacity: 0, transform: `scale(${R / 12})` }], { duration: 950, easing: 'cubic-bezier(.45,.05,.2,1)' });
    A.fx.fireflies(x, y, 16, 160);
  } else { fromEl.classList.remove('active'); }
  setTimeout(() => { mod && mod.show && mod.show(); }, 260);
};
A.rise = (root) => { A.$$('[data-rise]', root).forEach((el, i) => { el.classList.remove('rise'); el.style.setProperty('--i', i); void el.offsetWidth; el.classList.add('rise'); }); };

A.ui = {
  enterApp() {
    A.$('#app').hidden = false; A.applyPortrait(); A.refreshHud();
    TABS.forEach(t => A.mods[t] && A.mods[t].init && A.mods[t].init(A.$('#v-' + t)));
    A.fire && A.fire.init();
    A.go('path', { instant: true, force: true });
    const g = A.$('#tabGlow'); g.style.transition = 'none'; const b = A.$('.tabs button.on'), r = b.getBoundingClientRect(), tr = A.$('#tabs').getBoundingClientRect(); g.style.width = r.width + 'px'; g.style.transform = `translateX(${r.left - tr.left}px)`; requestAnimationFrame(() => g.style.transition = '');
    setTimeout(() => A.fire && A.fire.tip(), 4500);
    if (!A.state.welcomed) setTimeout(A.ui.welcome, 1800);
    A.snd.setMood('path');
  },
  welcome() {
    A.state.welcomed = true; A.save();
    A.sheet.open({ title: 'Добро пожаловать', html: `<p class="sub" style="margin-bottom:16px">Это твой уютный уголок для книг. Здесь всё живёт: тропа открывает новые места, книги зажигают звёзды, а цитаты превращаются в открытки.</p>
      <div class="glass" style="padding:8px 18px;margin-bottom:18px"><div class="wrow"><span class="eyebrow">Тропа</span><span>читай, и лес будет открываться</span></div><div class="wrow"><span class="eyebrow">Полка</span><span>все твои книги и впечатления</span></div><div class="wrow"><span class="eyebrow">Цитаты</span><span>открытки с твоими любимыми строками</span></div><div class="wrow"><span class="eyebrow">Небо</span><span>каждая прочитанная книга станет звездой</span></div><div class="wrow"><span class="eyebrow">Зелье</span><span>сваришь рекомендацию на вечер</span></div><div class="wrow"><span class="eyebrow">Костёр</span><span>слева внизу: коснись, и станет теплее</span></div></div>
      <button class="btn btn--gold" style="width:100%" id="wOk">В уголок</button>`, onMount: s => A.$('#wOk', s.el).addEventListener('click', () => { A.snd.chime([523.25, 659.25, 783.99], .1, .8); s.close(); }) });
  }
};

/* ---------------------------------------------------------------- settings sheet */
A.settings = () => {
  const s = A.state.settings;
  A.sheet.open({ title: 'Настройки', tall: true, html: `
    <div class="glass" style="padding:18px;margin-bottom:16px;display:flex;align-items:center;gap:16px"><div class="medal" style="width:72px;height:72px"><span class="medal__img" id="stPortrait"></span></div><div style="flex:1"><div class="eyebrow" style="margin-bottom:8px">портрет принцессы</div><label class="btn btn--ghost" style="height:40px;padding:0 16px;font-size:14px">Выбрать фото<input type="file" id="stFile" accept="image/*" hidden></label></div></div>
    <div class="glass" style="padding:6px 18px;margin-bottom:16px">
      <div class="set"><span>Звуки</span><button class="tog ${s.sound ? 'on' : ''}" data-k="sound"><i></i></button></div>
      <div class="set"><span>Музыкальная шкатулка</span><button class="tog ${s.music ? 'on' : ''}" data-k="music"><i></i></button></div>
      <div class="set"><span>Громкость</span><input type="range" min="0" max="1" step=".05" value="${s.vol}" id="stVol" style="width:55%;accent-color:#f1c76e"></div>
    </div>
    <div class="glass" style="padding:18px;margin-bottom:16px"><div class="eyebrow" style="margin-bottom:12px">цели чтения</div>
      <div class="set" style="border:0;padding:6px 0"><span>Страниц в день</span><div class="stepper"><button data-g="day" data-d="-5">−</button><b id="gDay">${A.state.goal.day}</b><button data-g="day" data-d="5">+</button></div></div>
      <div class="set" style="border:0;padding:6px 0"><span>Страниц в неделю</span><div class="stepper"><button data-g="week" data-d="-10">−</button><b id="gWeek">${A.state.goal.week}</b><button data-g="week" data-d="10">+</button></div></div></div>
    <div class="glass" style="padding:18px;margin-bottom:16px"><div class="eyebrow" style="margin-bottom:10px">сохранить уголок</div><p class="sub" style="margin-bottom:14px;font-size:15px">Все данные хранятся в этом телефоне. Скопируй резервную копию и спрячь в заметках, чтобы ничего не потерять.</p>
      <div class="row"><button class="btn btn--ghost" id="stCopy">Скопировать</button><button class="btn btn--ghost" id="stPaste">Восстановить</button></div></div>
    <button class="btn btn--danger" style="width:100%" id="stReset">Начать всё сначала</button>
    <p class="sub" style="text-align:center;margin-top:22px;font-size:14px;opacity:.7">Сделано с любовью для Айсель</p>`,
    onMount: sh => {
      const q = (x) => A.$(x, sh.el);
      const por = q('#stPortrait'); if (s.portrait) por.style.backgroundImage = `url(${s.portrait})`;
      q('#stFile').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; const url = await A.imgToData(f, 360, .86); s.portrait = url; A.save(); por.style.backgroundImage = `url(${url})`; A.applyPortrait(); A.snd.chime(); });
      A.$$('.tog', sh.el).forEach(b => b.addEventListener('click', () => { const k = b.dataset.k; s[k] = !s[k]; b.classList.toggle('on', s[k]); A.save(); A.snd.refresh(); A.snd.tap(); }));
      q('#stVol').addEventListener('input', e => { s.vol = +e.target.value; A.save(); A.snd.refresh(); });
      A.$$('[data-g]', sh.el).forEach(b => b.addEventListener('click', () => { const k = b.dataset.g, g = A.state.goal; g[k] = A.clamp(g[k] + +b.dataset.d, k === 'day' ? 5 : 20, 1000); q(k === 'day' ? '#gDay' : '#gWeek').textContent = g[k]; A.save(); A.snd.tap(); A.mods.path && A.mods.path.refreshGoal && A.mods.path.refreshGoal(); }));
      q('#stCopy').addEventListener('click', async () => { const txt = JSON.stringify(A.state); try { await navigator.clipboard.writeText(txt); A.toast('Копия скопирована. Вставь её в заметки'); } catch (e) { A.backupBox(txt); } });
      q('#stPaste').addEventListener('click', () => A.backupBox(''));
      q('#stReset').addEventListener('click', () => { if (q('#stReset').dataset.sure) { localStorage.removeItem('aisel-corner-v1'); location.reload(); } else { q('#stReset').dataset.sure = 1; q('#stReset').textContent = 'Точно? Нажми ещё раз'; setTimeout(() => { q('#stReset').textContent = 'Начать всё сначала'; delete q('#stReset').dataset.sure; }, 3500); } });
    } });
};
A.backupBox = (txt) => {
  A.sheet.open({ title: txt ? 'Копия уголка' : 'Восстановить', html: `<p class="sub" style="margin-bottom:12px;font-size:15px">${txt ? 'Нажми на текст, выдели всё и скопируй.' : 'Вставь сюда сохранённый текст копии.'}</p><textarea class="in" id="bk" style="min-height:180px;font-size:12px" ${txt ? 'readonly' : ''}>${A.esc(txt)}</textarea><button class="btn btn--gold" style="width:100%;margin-top:14px" id="bkOk">${txt ? 'Готово' : 'Восстановить'}</button>`,
    onMount: s => { const ta = A.$('#bk', s.el); txt && ta.addEventListener('focus', () => ta.select()); A.$('#bkOk', s.el).addEventListener('click', () => { if (txt) return s.close(); try { const o = JSON.parse(ta.value); if (!o || !Array.isArray(o.books)) throw 0; A.state = Object.assign({}, A.state, o); A.save(true); location.reload(); } catch (e) { A.toast('Не получилось прочитать копию'); } }); } });
};
A.imgToData = (file, max = 720, q = .78) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q)); }; im.onerror = rej; im.src = fr.result; }; fr.onerror = rej; fr.readAsDataURL(file); });
A.applyPortrait = () => { const p = A.state.settings.portrait || (A._av = A._av || A.scene.avatar()); A.$$('.medal__img').forEach(m => { m.style.backgroundImage = p ? `url(${p})` : ''; }); };

/* ---------------------------------------------------------------- tab bar + hud wiring */
A.$$('.tabs button').forEach(b => b.addEventListener('click', () => A.go(b.dataset.tab)));
A.$('#medal').addEventListener('click', () => { A.snd.tap(); A.settings(); });
A.$('#acornPill').addEventListener('click', () => { A.snd.tap(); A.mods.path && A.mods.path.acornSheet && A.mods.path.acornSheet(); });
A.$('#streakPill').addEventListener('click', () => { A.snd.tap(); const n = A.streak(); A.toast(n ? `${n} ${A.plural(n, 'день', 'дня', 'дней')} подряд: огонёк горит` : 'Почитай сегодня, и загорится огонёк'); });
A.fab = { el: null, show(onClick, label = '+') { const f = A.fab.el || (A.fab.el = A.h(`<button class="fab" aria-label="Добавить"><svg class="ico" viewBox="0 0 24 24"><use href="#i-plus"/></svg></button>`)); if (!f.isConnected) A.$('#app').appendChild(f); f.onclick = () => { A.snd.coin && A.snd.tap(); A.fx.sparks(innerWidth - 46, innerHeight - 140, 12); onClick(); }; setTimeout(() => f.classList.add('show'), 50); }, hide() { A.fab.el && A.fab.el.classList.remove('show'); } };
addEventListener('resize', () => { const b = A.$('.tabs button.on'); if (!b || A.$('#app').hidden) return; const g = A.$('#tabGlow'), r = b.getBoundingClientRect(), tr = A.$('#tabs').getBoundingClientRect(); g.style.width = r.width + 'px'; g.style.transform = `translateX(${r.left - tr.left}px)`; });
