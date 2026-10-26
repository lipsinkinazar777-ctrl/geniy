/* ============================================================ the archive of quotes: the drawer is open, a scroll lies in it under real hands;
   a card rises out of the drawer, you turn the cards by swiping */
A.casket = (() => {
  let el, cardsEl, hintEl, cnt, idx = 0, open = false, busy = false, cur = null, built = false, hold = 0;
  const list = () => A.state.quotes.slice().sort((a, b) => b.date - a.date);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const geo = () => { const L = A.scene.layout(), W = innerWidth, H = innerHeight, land = W > H, cw = Math.min(land ? H * .56 : W * .84, 440), ch = cw * 1.36;
    const [rx, ry] = A.scene.plateToScreen(L.cit.slot[0], L.cit.slot[1]); return { W, H, cw, ch, cx: W / 2, cy: land ? H * .5 : H * .4, sx: rx, sy: ry }; };
  function build() {
    if (built) return; built = true;
    el = A.h(`<div id="cask" hidden><div class="cask__veil"></div><div class="cask__cards" id="ckCards"></div><p class="cask__hint" id="ckHint"></p><p class="cask__count" id="ckCnt"></p></div>`);
    document.body.appendChild(el); cardsEl = A.$('#ckCards', el); hintEl = A.$('#ckHint', el); cnt = A.$('#ckCnt', el);
    let st = null;
    el.addEventListener('pointerdown', e => { if (!open || busy) return; st = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, tgt: e.target.closest('.ck__card') }; clearTimeout(hold); if (st.tgt) hold = setTimeout(() => { if (st && !st.moved) { st.moved = true; const q = list()[idx]; if (q) { A.vibrate(20); A.mods.quotes.view(q.id); } } }, 620); });
    el.addEventListener('pointermove', e => { if (st && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 12) { st.moved = true; clearTimeout(hold); } });
    const end = e => { clearTimeout(hold); if (!st) return; const s = st; st = null; const dx = e.clientX - s.x, dt = performance.now() - s.t;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1); else if (!s.moved && dt < 450) go(e.clientX > innerWidth * .35 ? 1 : -1); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', () => { st = null; clearTimeout(hold); });
    addEventListener('keydown', e => { if (!open) return; if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); });
  }
  async function enter() { build(); el.hidden = false; el.classList.add('on'); open = true; busy = true; idx = 0; cardsEl.innerHTML = ''; cnt.textContent = ''; hintEl.classList.remove('on'); await wait(1100); showCard(0, 1); }
  async function showCard(i, dir = 1) {
    const qs = list(); hintEl.classList.remove('on');
    if (!qs.length) { hintEl.textContent = 'Свиток пуст. Запиши первую цитату в читалке или на полке книг.'; hintEl.classList.add('on'); busy = false; return; }
    idx = (i + qs.length) % qs.length; busy = true; const g = geo(), q = qs[idx];
    const wrap = A.h(`<div class="ck__card" style="width:${g.cw}px;height:${g.ch}px;left:${g.cx - g.cw / 2}px;top:${g.cy - g.ch / 2}px">${A.mods.quotes.cardHTML(q, 'big')}</div>`); cardsEl.appendChild(wrap); cur = wrap;
    const dx = g.sx - g.cx, dy = g.sy - g.cy; A.snd.page && A.snd.page(); A.snd.quill && A.snd.quill();
    const a = wrap.animate([{ transform: `translate(${dx}px,${dy}px) scale(.16) rotate(${-10 * dir}deg)`, opacity: 0, filter: 'brightness(.5)' }, { opacity: 1, offset: .18 }, { transform: `translate(${dx * .35}px,${dy * .2 - 40}px) scale(.62) rotate(${-3 * dir}deg)`, opacity: 1, filter: 'brightness(.85)', offset: .55 }, { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1, filter: 'brightness(1)' }], { duration: 1150, easing: 'cubic-bezier(.25,.9,.25,1)', fill: 'forwards' });
    await a.finished; wrap.classList.add('float'); cnt.textContent = `${idx + 1} / ${qs.length}`; hintEl.textContent = 'Листай пальцем. Удерживай карточку, чтобы поделиться.'; hintEl.classList.add('on'); busy = false;
  }
  async function dismissCard(dir) { if (!cur) return; busy = true; const g = geo(), c = cur; cur = null; c.classList.remove('float'); hintEl.classList.remove('on'); A.snd.page && A.snd.page();
    await c.animate([{ transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 }, { transform: `translate(${-dir * g.W * .5}px,-40px) scale(.9) rotate(${-dir * 14}deg)`, opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.5,0,.9,.4)', fill: 'forwards' }).finished; c.remove(); busy = false; }
  async function go(d) { if (!open || busy) return; const qs = list(); if (qs.length < 2) { cur && cur.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${d * 14}px)` }, { transform: 'translateX(0)' }], { duration: 300 }); return; } await dismissCard(d); await showCard(idx + d, d); }
  function hide() { if (!el) return; open = false; busy = false; el.classList.remove('on'); cur = null; setTimeout(() => { el.hidden = true; cardsEl.innerHTML = ''; }, 500); hintEl.classList.remove('on'); cnt.textContent = ''; }
  return { enter, hide, leave: async () => { hide(); }, relayout() {}, refresh() { if (open && !busy) { const c = cur; cur = null; c && c.remove(); showCard(Math.min(idx, Math.max(0, list().length - 1)), 1); } }, get isOpen() { return open; } };
})();
