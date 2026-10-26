/* ============================================================ the writing desk: a slip of parchment for a new quote, from any room.
   choose the book, type the line, and the quill writes it; the slip then flies off into the archive. */
A.qslip = (() => {
  const wait = ms => new Promise(r => setTimeout(r, ms)), esc = A.esc;
  let el, card, busy = false, sel = '', onDone = null;
  function build() {
    el = A.h(`<div id="qs" class="qs" hidden><div class="qs__veil"></div><div class="qs__card paper" id="qsCard"><h3 class="hw">Новая цитата</h3><div class="qs__books" id="qsBooks"></div>
      <textarea class="lined hw" id="qsTxt" placeholder="Строки, которые хочется сохранить навсегда…" spellcheck="false"></textarea>
      <div class="qrow"><label class="pgin"><span>стр.</span><input id="qsPg" inputmode="numeric"></label><button class="seal tapable" id="qsGo"><svg viewBox="0 0 24 24" class="ico"><use href="#i-quill"/></svg>Записать пером</button></div></div>
      <button class="qs__x" id="qsX" aria-label="Закрыть"><svg viewBox="0 0 24 24" class="ico"><use href="#i-close"/></svg></button></div>`);
    document.body.appendChild(el); card = A.$('#qsCard', el);
    A.$('#qsX', el).addEventListener('click', () => close()); A.$('.qs__veil', el).addEventListener('click', () => !busy && close());
    A.$('#qsGo', el).addEventListener('click', go);
    A.$('#qsBooks', el).addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; sel = b.dataset.id; A.snd.tap(); A.$$('#qsBooks .chip', el).forEach(c => c.classList.toggle('on', c === b)); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !el.hidden && !busy) { e.stopImmediatePropagation(); close(); } }, true);
  }
  function open(opt = {}) {
    if (!el) build(); if (!el.hidden) return; busy = false; onDone = opt.onDone || null; sel = opt.bookId != null ? opt.bookId : ((A.state.books.find(b => b.status === 'reading') || A.state.books[0] || {}).id || '');
    A.$('#qsBooks', el).innerHTML = A.state.books.map(b => `<button class="chip ${b.id === sel ? 'on' : ''}" data-id="${b.id}">${esc(b.title)}</button>`).join('') + `<button class="chip ${sel === '' ? 'on' : ''}" data-id="">другая</button>`;
    A.$('#qsTxt', el).value = opt.text || ''; A.$('#qsPg', el).value = ''; card.style.visibility = ''; card.hidden = false; el.hidden = false; void el.offsetWidth; el.classList.add('on'); A.snd.page();
    card.animate([{ opacity: 0, transform: 'translate(-50%,-44%) rotate(-3deg) scale(.94)' }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(-1.2deg) scale(1)' }], { duration: 600, easing: 'cubic-bezier(.2,.9,.25,1)', fill: 'forwards' });
  }
  function close() { if (!el || el.hidden) return; el.classList.remove('on'); A.quill.hide(); setTimeout(() => { el.hidden = true; A.$$('.qslip', el).forEach(n => n.remove()); }, 500); }
  async function go() {
    if (busy) return; const text = A.$('#qsTxt', el).value.trim(); if (!text) { A.toast('Впиши строки, которые хочется сохранить'); A.$('#qsTxt', el).focus(); return; }
    busy = true; A.$('#qsTxt', el).blur(); const page = A.$('#qsPg', el).value.trim(), b = A.state.books.find(x => x.id === sel), title = b ? b.title : '';
    const slip = A.h(`<div class="qslip"><div class="qslip__in"><p class="qslip__t hw"></p><cite>${title ? '— «' + esc(title) + '»' : ''}${page ? ', стр. ' + esc(page) : ''}</cite></div></div>`); el.appendChild(slip);
    const p = A.$('.qslip__t', slip); p.textContent = text; p.style.fontSize = text.length > 220 ? '19px' : text.length > 120 ? '22px' : '26px';
    card.style.visibility = 'hidden'; slip.animate([{ opacity: 0, transform: 'translate(-50%,-50%) rotate(-1.2deg) scale(.96)' }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(-1.4deg) scale(1)' }], { duration: 420, easing: 'ease-out', fill: 'forwards' });
    await wait(480); await A.quill.write(p, { box: slip, cps: Math.min(34, Math.max(19, text.length / 5)) }); p.textContent = text; await wait(380); A.snd.chime && A.snd.chime([659.25, 783.99, 987.77], .12, .7);
    A.addQuote({ id: A.uid(), bookId: sel, bookTitle: b ? b.title : '', author: b ? b.author : '', text, page, tags: [], sticker: '', paper: 'parch', photo: null, date: Date.now() });
    const ink = A.$('.lb__ink'), tr = ink ? ink.getBoundingClientRect() : { left: innerWidth - 50, top: 40, width: 40, height: 60 }, sr = slip.getBoundingClientRect(), dx = tr.left + tr.width / 2 - (sr.left + sr.width / 2), dy = tr.top + tr.height / 2 - (sr.top + sr.height / 2);
    A.snd.page(); await slip.animate([{ transform: 'translate(-50%,-50%) rotate(-1.4deg) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${dx * .5}px),calc(-50% + ${dy * .5 - 30}px)) rotate(-8deg) scale(.5)`, opacity: .9, offset: .55 }, { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(-14deg) scale(.08)`, opacity: 0 }], { duration: 1000, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }).finished;
    A.fx.sparks(tr.left + tr.width / 2, tr.top + tr.height / 2, 18, '#f3d9a0'); busy = false; close(); A.toast('Цитата легла в архив 🪶'); onDone && onDone();
  }
  return { open, close, get isOpen() { return !!el && !el.hidden; } };
})();
