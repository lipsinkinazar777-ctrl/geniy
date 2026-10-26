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

/* ---------------------------------------------------------------- hud (the numbers live in the bag now) */
A.refreshHud = (bump) => { const a = A.$('#acornN'), s = A.$('#streakN'); if (a) a.textContent = A.state.acorns; if (s) s.textContent = A.streak(); };
A.onSticker = s => { setTimeout(() => { A.snd.unlock2(); A.fx.stars(innerWidth / 2, innerHeight * .4, 36); A.toast(`Новый стикер: ${s.e} ${s.n}`); }, 600); };

/* ---------------------------------------------------------------- the room is the router:
   touching an object glides the camera in, the object "opens" as a full-screen panel with an iris from that spot, and back reverses it */
const TABS = ['books', 'quotes', 'potion', 'bag'];
const ROOMOF = { books: 'lib', potion: 'lab', quotes: 'cit' }, MOOD = { books: 'books', potion: 'potion', quotes: 'quotes' };
const OBJ = { books: 'lib', quotes: 'quotes', potion: 'lab', bag: 'bag' };
A.tab = 'room'; let moving = false, lockT = 0;
const busy = (on = true) => { moving = on; clearTimeout(lockT); if (on) lockT = setTimeout(() => { moving = false; }, 3600); };      // a transition can never leave the room stuck
const irisR = (x, y) => Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 40;
const curtain = A.$('#curtain');
function enterRoom(tab, obj) {
  const name = ROOMOF[tab], prev = A.tab; if (prev === tab || moving) return;
  if (prev !== 'room' && !ROOMOF[prev]) { A.leave(); return setTimeout(() => A.go(tab), 1050); }
  busy(); A.tab = tab; A.$('#hint').classList.remove('on'); document.body.dataset.tab = tab; document.body.classList.add('inroom'); A.snd.setMood(MOOD[tab]); A.fab && A.fab.hide();
  const swap = () => { A.scene.setRoom(name, 1); A.scene.dolly(1.32); A.mods[tab] && A.mods[tab].show && A.mods[tab].show(); curtain.classList.remove('on'); setTimeout(() => { busy(false); }, 900); };
  A.snd.whoosh(1);
  if (prev === 'room') { A.scene.focus(obj || OBJ[tab]); setTimeout(() => curtain.classList.add('on'), 330); setTimeout(swap, 980); } else { curtain.classList.add('on'); setTimeout(swap, 620); }
}
function exitRoom() {
  if (moving) return; busy(); const tab = A.tab; curtain.classList.add('on'); A.snd.whoosh(-1); if (tab === 'quotes') A.casket.hide(); if (A.mods[tab] && A.mods[tab].hide) A.mods[tab].hide();
  setTimeout(() => { A.scene.returnMain(OBJ[tab]); A.tab = 'room'; document.body.dataset.tab = 'room'; document.body.classList.remove('inroom'); A.snd.setMood('room'); curtain.classList.remove('on'); setTimeout(() => { busy(false); }, 900); }, 620);
}
A.go = (tab, opt = {}) => {
  if (tab === 'room' || tab === 'back') return A.leave();
  if (ROOMOF[tab]) return enterRoom(tab, opt.obj);
  const from = A.tab, toEl = A.$('#v-' + tab); if (!toEl) return;
  if (from === tab && !opt.force) { toEl.scrollTo({ top: 0, behavior: 'smooth' }); A.snd.tap(); return; }
  if (moving) return; busy();
  const fromEl = from !== 'room' && A.$('#v-' + from), mod = A.mods[tab];
  A.tab = tab; document.body.dataset.tab = tab; document.body.classList.add('panel'); A.snd.setMood(tab); A.fab && A.fab.hide(); mod && mod.beforeShow && mod.beforeShow();
  const reveal = () => {
    const [x, y] = fromEl ? [innerWidth / 2, innerHeight / 2] : A.scene.focusPoint(), R = irisR(x, y);
    toEl.classList.add('active'); toEl.scrollTop = 0; toEl.style.zIndex = 2; A.snd.whoosh(1);
    if (!A.reduceMotion) {
      toEl.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${R}px at ${x}px ${y}px)` }], { duration: 950, easing: 'cubic-bezier(.5,0,.12,1)' });
      toEl.firstElementChild && toEl.firstElementChild.animate([{ transform: 'translateY(34px) scale(.97)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 1000, delay: 160, easing: 'cubic-bezier(.2,.9,.2,1)', fill: 'backwards' });
      const ir = A.$('#iris'); ir.style.left = x + 'px'; ir.style.top = y + 'px';
      ir.animate([{ opacity: .9, transform: 'scale(.4)' }, { opacity: .45, transform: `scale(${R / 14})`, offset: .7 }, { opacity: 0, transform: `scale(${R / 12})` }], { duration: 950, easing: 'cubic-bezier(.45,.05,.2,1)' });
      A.fx.fireflies(x, y, 14, 150);
    }
    if (fromEl) { fromEl.style.zIndex = 1; setTimeout(() => { fromEl.classList.remove('active'); }, 900); }
    setTimeout(() => { mod && mod.show && mod.show(); busy(false); }, 240);
  };
  if (fromEl || opt.instant) reveal(); else A.scene.focus(opt.obj || OBJ[tab]).then(reveal);
};
A.leave = () => {
  if (A.reader && A.reader.isOpen()) return A.reader.close();
  if (ROOMOF[A.tab]) return exitRoom();
  if (A.tab === 'room' || moving) return; busy(); const tab = A.tab, el = A.$('#v-' + tab); A.fab && A.fab.hide();
  const [x, y] = A.scene.focusPoint(), R = irisR(x, y); A.snd.whoosh(-1);
  const done = () => { el.classList.remove('active'); el.getAnimations().forEach(a => a.cancel()); el.style.clipPath = ''; A.tab = 'room'; document.body.dataset.tab = 'room'; document.body.classList.remove('panel'); A.scene.unfocus(); A.snd.setMood('room'); busy(false); };
  A.scene.lock(true); document.body.classList.remove('panel');
  if (A.reduceMotion) return done();
  el.animate([{ clipPath: `circle(${R}px at ${x}px ${y}px)`, opacity: 1 }, { clipPath: `circle(0px at ${x}px ${y}px)`, opacity: .6 }], { duration: 720, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'forwards' }).finished.then(done);
  setTimeout(() => A.scene.unfocus(), 280);
};
A.rise = (root) => { A.$$('[data-rise]', root).forEach((el, i) => { el.classList.remove('rise'); el.style.setProperty('--i', i); void el.offsetWidth; el.classList.add('rise'); }); };

A.ui = {
  enterApp(first) {
    A.$('#app').hidden = false; A.applyPortrait(); A.refreshHud();
    TABS.forEach(t => A.mods[t] && A.mods[t].init && A.mods[t].init(A.$('#v-' + t)));
    A.scene.init(); A.fire.init(); A.scene.enter(first); A.snd.setMood('room');
    const on = first ? true : A.state.fireOn !== false; setTimeout(() => A.fire.set(on, !first), first ? 1700 : 600);
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
      A.$$('.tog', sh.el).forEach(b => b.addEventListener('click', () => { const k = b.dataset.k; s[k] = !s[k]; b.classList.toggle('on', s[k]); A.save(); A.snd.refresh(); if (k === 'music') A.musicBox && A.musicBox.sync(); A.snd.tap(); }));
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

/* ---------------------------------------------------------------- back control: the glass chevron, or swipe in from the left edge */
A.$('#back').addEventListener('click', () => { A.snd.tap(); A.leave(); });
(() => { let sx = null, sy = 0; addEventListener('pointerdown', e => { sx = e.clientX < 22 && A.tab !== 'room' && !ROOMOF[A.tab] && !(A.bookview && A.bookview.isOpen()) ? e.clientX : null; sy = e.clientY; }, { passive: true });   // the rooms have their own gestures and a back button
  addEventListener('pointermove', e => { if (sx != null && e.clientX - sx > 70 && Math.abs(e.clientY - sy) < 60) { sx = null; A.leave(); } }, { passive: true }); addEventListener('pointerup', () => sx = null); })();
addEventListener('keydown', e => { if (e.key === 'Escape') A.leave(); });
A.fab = { el: null, show(onClick, label = '+') { const f = A.fab.el || (A.fab.el = A.h(`<button class="fab" aria-label="Добавить"><svg class="ico" viewBox="0 0 24 24"><use href="#i-plus"/></svg></button>`)); if (!f.isConnected) A.$('#app').appendChild(f); f.onclick = () => { A.snd.tap(); A.fx.sparks(innerWidth - 46, innerHeight - 100, 12); onClick(); }; setTimeout(() => f.classList.add('show'), 50); }, hide() { A.fab.el && A.fab.el.classList.remove('show'); } };
