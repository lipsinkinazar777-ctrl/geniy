/* ============================================================ the casket of quotes: hands lift the lid and draw her cards out of the dark one by one */
A.casket = (() => {
  let el, box, lid, cards, hands, hintEl, cnt, idx = 0, open = false, busy = false, cur = null, built = false, hold = 0;
  const list = () => A.state.quotes.slice().sort((a, b) => b.date - a.date);
  const geo = () => { const W = innerWidth, H = innerHeight, land = W > H, bw = Math.min(land ? H * .72 : W * .94, 600), bh = bw * 520 / 640, cw = Math.min(land ? H * .5 : W * .8, 420), ch = cw * 1.38;
    return { W, H, bw, bh, bx: W / 2, by: land ? H * .74 : H * .74, cw, ch, cx: W / 2, cy: land ? H * .36 : H * .33 }; };
  function build() {
    if (built) return; built = true;
    el = A.h(`<div id="cask" hidden><div class="cask__veil"></div><div class="cask__stage"><img class="cask__box" id="ckClosed" src="img/casket.webp" alt=""><img class="cask__box" id="ckOpen" src="img/casket-open.webp" alt=""><div class="cask__cards" id="ckCards"></div><div class="cask__hands" id="ckHands"></div></div><p class="cask__hint" id="ckHint"></p><p class="cask__count" id="ckCnt"></p></div>`);
    document.body.appendChild(el); box = A.$('#ckClosed', el); lid = A.$('#ckOpen', el); cards = A.$('#ckCards', el); hands = A.$('#ckHands', el); hintEl = A.$('#ckHint', el); cnt = A.$('#ckCnt', el);
    // swipe or tap to turn cards; hold to share or edit
    let st = null;
    el.addEventListener('pointerdown', e => { if (!open || busy) return; st = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, id: e.pointerId, tgt: e.target.closest('.ck__card') }; clearTimeout(hold); if (st.tgt) hold = setTimeout(() => { if (st && !st.moved) { st.moved = true; const q = list()[idx]; if (q) { A.vibrate(20); A.mods.quotes.view(q.id); } } }, 620); });
    el.addEventListener('pointermove', e => { if (st && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 12) { st.moved = true; clearTimeout(hold); } });
    const end = e => { clearTimeout(hold); if (!st) return; const s = st; st = null; const dx = e.clientX - s.x, dt = performance.now() - s.t;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1); else if (!s.moved && dt < 450) go(e.clientX > innerWidth * .35 ? 1 : -1); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', () => { st = null; clearTimeout(hold); });
    addEventListener('keydown', e => { if (!open) return; if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); });
    addEventListener('resize', () => { if (open) place(); });
  }
  function place() {
    const g = geo(), s = box.style, l = lid.style; for (const st of [s, l]) { st.position = 'absolute'; st.width = g.bw + 'px'; st.left = (g.bx - g.bw / 2) + 'px'; st.top = (g.by - g.bh * .62) + 'px'; }
    cards.style.cssText = `position:absolute;inset:0`;
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const mouth = () => { const g = geo(); return { x: g.bx, y: g.by - g.bh * .62 + g.bh * .42 }; };       // where the cards sit inside the open box

  async function enter() {
    build(); el.hidden = false; open = false; busy = true; idx = 0; place(); cards.innerHTML = ''; lid.style.opacity = 0; box.style.opacity = 0; hintEl.textContent = ''; cnt.textContent = '';
    el.classList.add('on'); const g = geo();
    box.animate([{ opacity: 0, transform: 'translateY(60px) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 900, easing: 'cubic-bezier(.2,.9,.2,1)', fill: 'forwards' }); await wait(700);
    // two hands take the lid by its sides and lift it
    const top = g.by - g.bh * .62 + g.bh * .36, hl = A.hands.reach(hands, 'open', g.bx - g.bw * .36, top, { w: g.bw * .26, rot: -12, fromX: -40 }), hr = A.hands.reach(hands, 'open', g.bx + g.bw * .36, top, { w: g.bw * .26, rot: 12, fromX: 40, flip: true });
    A.snd.chime && A.snd.chime([196, 261.63], .2, .5); await wait(780);
    lid.style.opacity = 1; box.style.opacity = 0; lid.animate([{ transform: 'scaleY(.82) translateY(14px)', transformOrigin: '50% 100%' }, { transform: 'none', transformOrigin: '50% 100%' }], { duration: 560, easing: 'cubic-bezier(.3,1.4,.4,1)' }); A.snd.unlock2 && A.snd.unlock2(); A.vibrate(15); await wait(300);
    hl.retreat(520); hr.retreat(520); open = true; busy = false; await wait(420); showCard(0, 1);
  }
  async function showCard(i, dir = 1) {
    const qs = list(); cnt.textContent = ''; hintEl.classList.remove('on');
    if (!qs.length) { hintEl.textContent = 'Шкатулка пуста. Коснись пера на столе, чтобы записать первую цитату.'; hintEl.classList.add('on'); return; }
    idx = (i + qs.length) % qs.length; busy = true; const g = geo(), q = qs[idx], m = mouth();
    const wrap = A.h(`<div class="ck__card" style="width:${g.cw}px;height:${g.ch}px;left:${g.cx - g.cw / 2}px;top:${g.cy - g.ch / 2}px">${A.mods.quotes.cardHTML(q, 'big')}</div>`); cards.appendChild(wrap); cur = wrap;
    const dx = m.x - g.cx, dy = m.y - g.cy; wrap.style.opacity = 0;
    const hd = A.hands.reach(hands, 'pinch', m.x + g.cw * .12, m.y - 6, { w: g.bw * .24, rot: 6, dur: 520 }); await wait(420);
    wrap.style.opacity = 1; A.snd.page && A.snd.page(); A.snd.quill && A.snd.quill();
    const from = `translate(${dx}px,${dy}px) scale(.22) rotate(${-8 * dir}deg)`, to = 'translate(0,0) scale(1) rotate(0deg)';
    const a = wrap.animate([{ transform: from, opacity: .0, filter: 'brightness(.5)' }, { transform: `translate(${dx * .4}px,${dy * .1 - 30}px) scale(.7) rotate(${-3 * dir}deg)`, opacity: 1, filter: 'brightness(.85)', offset: .5 }, { transform: to, opacity: 1, filter: 'brightness(1)' }], { duration: 1100, easing: 'cubic-bezier(.25,.9,.25,1)', fill: 'forwards' });
    hd.move(g.cx + g.cw * .12 - (m.x + g.cw * .12) + 0, g.cy + g.ch * .5 - 20 - (m.y - 6), 1000); hd.animate && 0;
    await a.finished; hd.retreat(520); wrap.classList.add('float'); cnt.textContent = `${idx + 1} / ${qs.length}`; hintEl.textContent = 'Листай пальцем. Удерживай карточку, чтобы поделиться.'; hintEl.classList.add('on'); busy = false;
  }
  async function dismissCard(dir) {
    if (!cur) return; busy = true; const g = geo(), m = mouth(), c = cur; cur = null; c.classList.remove('float'); hintEl.classList.remove('on'); A.snd.page && A.snd.page();
    await c.animate([{ transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 }, { transform: `translate(${-dir * g.W * .5}px,-40px) scale(.9) rotate(${-dir * 14}deg)`, opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.5,0,.9,.4)', fill: 'forwards' }).finished; c.remove(); busy = false;
  }
  async function go(d) { if (!open || busy) return; const qs = list(); if (qs.length < 2) { if (cur) { cur.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${d * 14}px)` }, { transform: 'translateX(0)' }], { duration: 300 }); } return; } await dismissCard(d); await showCard(idx + d, d); }
  async function leave() {
    if (!el || busy && !open) return; busy = true; open = false; const g = geo(), m = mouth(); hintEl.classList.remove('on'); cnt.textContent = '';
    if (cur) { const c = cur; cur = null; c.classList.remove('float'); await c.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${m.x - g.cx}px,${m.y - g.cy}px) scale(.22)`, opacity: 0 }], { duration: 560, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' }).finished; c.remove(); }
    lid.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, fill: 'forwards' }); box.style.opacity = 1; A.snd.page && A.snd.page(); await wait(380);
    el.classList.remove('on'); await wait(520); el.hidden = true; hands.innerHTML = ''; busy = false;
  }
  return { enter, leave, refresh() { if (open && !busy) { const c = cur; cur = null; c && c.remove(); showCard(Math.min(idx, Math.max(0, list().length - 1)), 1); } }, get isOpen() { return open; } };
})();
