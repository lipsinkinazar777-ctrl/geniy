/* Maison Volodymyr — interactions, shop and WhatsApp checkout */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const WA = '33758181515';

/* ---------------------------------------------------------------- catalogue
   Prices come from the atelier's price sheet (launch/whatsapp_quick_replies.txt, coffrets/generate_bordeaux.js).
   Items flagged `from` are "dès" prices, confirmed by the atelier after the preview. */
const PRODUCTS = [
  { id: 'tasse', cat: 'tasse', name: 'Tasse photo', badge: 'mug', img: 'assets/card-mug.webp',
    desc: 'Votre photo ou votre dessin, imprimé sur tout le tour de la tasse. Thèmes gaming, voiture ou famille possibles.',
    opts: [{ l: 'Tasse blanche', p: 10 }] },
  { id: 'metal', cat: 'metal', name: 'Photo sur métal', badge: 'frame', img: 'assets/card-metal.webp',
    desc: 'Votre photo sur une plaque de métal brillante. Quatre formats, du cadre de bureau au grand format.',
    opts: [{ l: '10×15 cm', p: 4 }, { l: '15×20 cm', p: 6 }, { l: '20×30 cm', p: 8 }, { l: '30×40 cm', p: 25, from: true }] },
  { id: 'aimant', cat: 'aimant', name: 'Aimant photo', badge: 'magnet', img: 'assets/card-magnet.webp',
    desc: 'Un petit format pour le frigo, avec la photo du moment. Se glisse dans un coffret.',
    opts: [{ l: 'Aimant photo', p: 3 }] },
  { id: 'cles', cat: 'cles', name: 'Porte-clés photo', badge: 'key', img: 'assets/card-key.webp',
    desc: 'Votre photo, sur une face ou sur deux. Léger, solide, facile à offrir.',
    opts: [{ l: 'Simple face', p: 2, from: true }, { l: 'Double face', p: 5 }] }
];
const COFFRETS = [
  { id: 'c-maman', name: 'Pour Maman', occ: 'Fête des mères', p: 23, items: [['tasse', 0], ['metal', 1], ['aimant', 0]] },
  { id: 'c-papa', name: 'Pour Papa', occ: 'Fête des pères', p: 22, items: [['tasse', 0], ['cles', 1], ['aimant', 0]] },
  { id: 'c-duo', name: 'Duo Amoureux', occ: 'Saint-Valentin', p: 31, items: [['tasse', 0], ['tasse', 0], ['metal', 0], ['aimant', 0]] },
  { id: 'c-gp', name: 'Grands-parents', occ: 'Papi & Mamie', p: 26, items: [['metal', 2], ['tasse', 0], ['aimant', 0]] },
  { id: 'c-bebe', name: 'Bébé', occ: 'Naissance', p: 25, items: [['tasse', 0], ['metal', 0], ['cles', 0], ['aimant', 0]] },
  { id: 'c-fam', name: 'Coffret Famille', occ: 'Pour toute la famille', p: 28, rib: 'Best-seller', items: [['tasse', 0], ['metal', 1], ['cles', 1], ['aimant', 0]] },
  { id: 'c-noel', name: 'Coffret Noël', occ: 'Noël & Nouvel An', p: 41, items: [['tasse', 0], ['tasse', 0], ['metal', 1], ['cles', 0], ['aimant', 0], ['aimant', 0]] },
  { id: 'c-prest', name: 'Coffret Prestige', occ: 'Le grand cadeau', p: 51, was: 56, rib: 'Prestige', items: [['metal', 3], ['tasse', 0], ['pendant', 0], ['cles', 1], ['aimant', 0]] },
  { id: 'c-duo2', name: 'Prestige Duo', occ: 'Pour deux familles', p: 66, was: 72, rib: 'Prestige', items: [['metal', 3], ['tasse', 0], ['tasse', 0], ['pendant', 0], ['pendant', 0], ['aimant', 0], ['aimant', 0]] }
];
const eur = n => (Math.round(n * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0 }) + ' €';

/* ---------------------------------------------------------------- items inside a box (builder + coffret showcase) */
// opts: label, price, s = relative size of the cut-out in the box
const ITEMS = {
  tasse: { name: 'Tasse photo', img: 'assets/cut-mug.webp', size: .98, ar: 1.31, opts: [{ l: 'Tasse', p: 10, s: 1 }] },
  metal: { name: 'Photo sur métal', img: 'assets/cut-metal.webp', size: 1, ar: .73, opts: [{ l: '10×15', p: 4, s: .62 }, { l: '15×20', p: 6, s: .76 }, { l: '20×30', p: 8, s: .92 }, { l: '30×40', p: 25, s: 1.1 }] },
  aimant: { name: 'Aimant photo', img: 'assets/cut-magnet.webp', size: .62, ar: .98, opts: [{ l: 'Aimant', p: 3, s: 1 }] },
  cles: { name: 'Porte-clés', img: 'assets/cut-key.webp', size: .98, ar: .52, opts: [{ l: 'Simple face', p: 2, s: 1 }, { l: 'Double face', p: 5, s: 1 }] },
  pendant: { name: 'Pendentif photo', img: 'assets/cut-pendant.webp', size: .86, ar: .75, opts: [{ l: 'Pendentif', p: 8, s: 1 }] }
};
Object.values(ITEMS).forEach(d => { const i = new Image(); i.onload = () => { if (i.naturalHeight) d.ar = i.naturalWidth / i.naturalHeight; }; i.src = d.img; });
const itemLabel = (pid, o) => { const d = ITEMS[pid]; return (d.opts.length > 1 ? `${d.name} ${d.opts[o].l}` : d.name).toLowerCase(); };
const STAGE_AR = 1400 / 1100;
/* Packs items in one or two rows by their real widths, so nothing overlaps badly.
   Returns {x,b,h,z} in % of the stage for each item (same order as the input). */
function pack(list) {
  const n = list.length, out = new Array(n);
  const rows = n <= 3 ? [list.map((_, i) => i), []] : [list.map((_, i) => i).filter(i => i % 2 === 0), list.map((_, i) => i).filter(i => i % 2 === 1).reverse()]; // back row reversed so same items do not stack
  [[rows[0], 60, 27, 1, 0], [rows[1], 52, 22, 0, 1]].forEach(([idx, b, base, zb, back]) => {
    if (!idx.length) return;
    const hs = idx.map(i => { const d = ITEMS[list[i].pid]; return base * d.size * d.opts[list[i].o].s; });
    const ws = idx.map((i, k) => hs[k] * ITEMS[list[i].pid].ar / STAGE_AR);
    const gap = 1.4, total = ws.reduce((a, v) => a + v, 0) + gap * (idx.length - 1), fit = Math.min(1, 45 / total);
    let x = 50 - total * fit / 2 + (back ? 2.2 : 0);
    idx.forEach((i, k) => { const w = ws[k] * fit; out[i] = { x: x + w / 2, b, h: Math.min(hs[k] * fit, 31), z: zb * 100 + Math.round(b * 4) + k }; x += w + gap * fit; });
  });
  return out;
}
function place(it, pos) { const el = it.el; el.style.left = pos.x + '%'; el.style.bottom = (100 - pos.b) + '%'; el.style.height = pos.h + '%'; el.style.zIndex = pos.z; }
function makeEl(pid) { const el = document.createElement('img'); el.className = 'slot'; el.src = ITEMS[pid].img; el.alt = ''; return el; }


/* ---------------------------------------------------------------- split text */
$$('[data-split]').forEach(el => {
  const t = el.textContent; el.textContent = ''; el.setAttribute('aria-hidden', 'true');
  [...t].forEach((c, i) => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i); s.textContent = c; el.appendChild(s); });
});
$$('[data-split-lines]').forEach(el => {
  let i = 0;
  const walk = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span'); w.className = 'w'; const wi = document.createElement('span'); wi.className = 'wi'; wi.style.setProperty('--i', i++); wi.textContent = part; w.appendChild(wi); frag.appendChild(w);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
  });
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  walk(el);
});
$$('.steps li, .coff, .card, .index li, .info li, .atelier__txt, .offre__in').forEach((el, i) => el.classList.add('rv'));

/* ---------------------------------------------------------------- reveal on scroll */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
const observeReveals = () => $$('.h2, .rv:not(.in)').forEach(el => io.observe(el));

/* ---------------------------------------------------------------- page load */
const bg = $('.stage__bg');
const start = () => document.documentElement.classList.add('is-ready');
if (bg.complete) start(); else { bg.addEventListener('load', start, { once: true }); bg.addEventListener('error', start, { once: true }); setTimeout(start, 2500); }
const hintT = $('.hint__t'); if (hintT && !fine) hintT.textContent = hintT.dataset.coarse;
$('#yr').textContent = new Date().getFullYear();

/* ---------------------------------------------------------------- header */
const top = $('#top');
const onScroll = () => top.classList.toggle('is-stuck', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------------------------------------------------------------- hero reveal (closed box → mug) */
const hero = $('#hero'), hit = $('#hit'), sparks = $('#sparks');
let opened = false, closeTimer;
function burst() {
  if (reduce) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('i'); sparks.appendChild(p);
    const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 260, s = .5 + Math.random() * 1.6;
    p.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d - 120}px) scale(${s * .2})`, opacity: 0 }],
      { duration: 1100 + Math.random() * 900, delay: 350 + Math.random() * 250, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' }).onfinish = () => p.remove();
  }
}
function setOpen(v) {
  if (v === opened) return; opened = v;
  hero.classList.toggle('is-open', v); hit.setAttribute('aria-pressed', v);
  hit.setAttribute('aria-label', v ? 'Refermer le coffret' : 'Ouvrir le coffret : découvrir la tasse');
  hit.dataset.cursor = v ? 'Fermer' : 'Ouvrir'; const cl = $('.cursor__label'); if (cl && cl.textContent) cl.textContent = hit.dataset.cursor;
  if (v) burst();
}
// open when the pointer is over the box (rect test on mousemove: more reliable in Safari than enter/leave on a button)
let pinned = false;
const inHit = e => { const r = hit.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
if (fine) {
  const move = e => {
    if (pinned && !inHit(e)) pinned = false;
    if (pinned) return;
    if (inHit(e)) { clearTimeout(closeTimer); setOpen(true); }
    else if (opened) { clearTimeout(closeTimer); closeTimer = setTimeout(() => setOpen(false), 350); }
  };
  hero.addEventListener('mousemove', move); hero.addEventListener('pointermove', move);
  hero.addEventListener('mouseleave', () => { if (!pinned) { clearTimeout(closeTimer); closeTimer = setTimeout(() => setOpen(false), 350); } });
  hit.addEventListener('focus', () => setOpen(true)); hit.addEventListener('blur', () => { if (!pinned) setOpen(false); });
}
// click toggles and keeps it open (works with mouse, touch and keyboard)
hit.addEventListener('click', () => { if (fine) { pinned = true; clearTimeout(closeTimer); setOpen(true); } else setOpen(!opened); });
hit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!opened); } });
// parallax of the headline against the scene
if (fine && !reduce) {
  const hl = $('.headline'); let px = 0, py = 0, tx = 0, ty = 0;
  hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); tx = (e.clientX / r.width - .5); ty = (e.clientY / r.height - .5); });
  (function loop() { px += (tx - px) * .06; py += (ty - py) * .06; hl.style.transform = `translate(${px * -18}px,${py * -10}px)`; requestAnimationFrame(loop); })();
}
const aboutDlg = $('#aboutDlg');
$('#aboutOpen').addEventListener('click', () => { document.documentElement.classList.remove('has-cursor'); const c = $('.cursor'); if (c) c.style.display = 'none'; aboutDlg.showModal(); });
aboutDlg.addEventListener('close', () => { if (fine) { document.documentElement.classList.add('has-cursor'); const c = $('.cursor'); if (c) c.style.display = ''; } });
$$('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
$('#aboutDlg').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });

/* ---------------------------------------------------------------- cursor */
if (fine) {
  document.documentElement.classList.add('has-cursor');
  const c = $('.cursor'), lab = $('.cursor__label'); let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; }, { passive: true });
  (function loop() { cx += (x - cx) * .22; cy += (y - cy) * .22; c.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
  document.addEventListener('pointerover', e => {
    const l = e.target.closest('[data-cursor]');
    if (l) { lab.textContent = l.dataset.cursor; c.classList.add('is-label'); c.classList.remove('is-link'); return; }
    c.classList.remove('is-label');
    c.classList.toggle('is-link', !!e.target.closest('a,button,input,textarea,label,.chip,.opt'));
  });
}

/* ---------------------------------------------------------------- magnetic buttons + tilt + spotlight */
if (fine && !reduce) {
  $$('[data-magnet]').forEach(el => {
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
    el.addEventListener('pointerleave', () => el.style.transform = '');
  });
}
function bindTilt(el, max = 6) {
  if (!fine || reduce) return;
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%');
    el.style.setProperty('--ry', (px - .5) * max + 'deg'); el.style.setProperty('--rx', (.5 - py) * max + 'deg');
  });
  el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
}
$$('[data-tilt], .steps li, .box__visual, .offre__in').forEach(el => bindTilt(el, el.classList.contains('plaque') ? 8 : 5));

/* ---------------------------------------------------------------- creations: floating preview */
const flo = $('#float');
if (fine && flo) {
  const imgs = $$('img', flo); let cur = 0, fx = 0, fy = 0, tx = 0, ty = 0, vx = 0;
  const ul = $('#index');
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  ul.addEventListener('pointerover', e => {
    const a = e.target.closest('a'); if (!a) return;
    const n = imgs[cur ^ 1]; n.src = a.dataset.img; n.classList.add('show'); imgs[cur].classList.remove('show'); cur ^= 1;
    flo.classList.add('on'); flo.style.scale = 1;
  });
  ul.addEventListener('pointerleave', () => { flo.classList.remove('on'); flo.style.scale = .6; });
  (function loop() { const px = fx; fx += (tx - fx) * .12; fy += (ty - fy) * .12; vx += ((fx - px) - vx) * .2;
    flo.style.transform = `translate(${fx + 40}px,${fy}px) translate(-50%,-50%) rotate(${Math.max(-12, Math.min(12, vx * .6))}deg)`; requestAnimationFrame(loop); })();
}

/* ---------------------------------------------------------------- marquee reacts to scroll speed */
const mq = $('#marquee');
if (mq && !reduce) {
  let last = scrollY, skew = 0;
  (function loop() { const d = scrollY - last; last = scrollY; skew += (Math.max(-8, Math.min(8, d * .35)) - skew) * .15; mq.style.transform = ''; mq.style.setProperty('--sk', skew); mq.parentElement.style.transform = `skewX(${-skew * .6}deg)`; requestAnimationFrame(loop); })();
}

/* ---------------------------------------------------------------- shop */
const grid = $('#grid');
const state = {}; // selected option per product
grid.innerHTML = PRODUCTS.map(p => {
  state[p.id] = 0;
  const o = p.opts[0];
  return `<article class="card" data-cat="${p.cat}" data-id="${p.id}">
    <div class="card__img"><img src="${p.img}" alt="${p.name}" loading="lazy" width="1000" height="1250"><span class="card__badge"><svg class="ico"><use href="#i-${p.badge}"/></svg>${p.cat === 'metal' ? 'Gravé' : 'Fait main'}</span></div>
    <div class="card__body">
      <h3 class="card__name">${p.name}</h3>
      <p class="card__desc">${p.desc}</p>
      ${p.opts.length > 1 ? `<div class="opts" role="radiogroup" aria-label="Choix pour ${p.name}">${p.opts.map((op, i) => `<button class="opt${i ? '' : ' is-on'}" role="radio" aria-checked="${i === 0}" data-i="${i}">${op.l}</button>`).join('')}</div>` : ''}
      <div class="card__buy"><span class="price"><small>${o.from ? 'dès' : ''}</small><b>${eur(o.p)}</b></span>
        <button class="add" data-cursor="Ajouter"><svg class="ico"><use href="#i-plus"/></svg><span>Ajouter</span></button></div>
    </div></article>`;
}).join('');
grid.addEventListener('click', e => {
  const card = e.target.closest('.card'); if (!card) return;
  const p = PRODUCTS.find(x => x.id === card.dataset.id);
  const opt = e.target.closest('.opt');
  if (opt) {
    state[p.id] = +opt.dataset.i; $$('.opt', card).forEach(b => { b.classList.toggle('is-on', b === opt); b.setAttribute('aria-checked', b === opt); });
    const o = p.opts[state[p.id]]; $('.price small', card).textContent = o.from ? 'dès' : ''; $('.price b', card).textContent = eur(o.p); return;
  }
  const add = e.target.closest('.add');
  if (add) { const o = p.opts[state[p.id]]; addToCart({ key: p.id + ':' + o.l, name: p.name, opt: p.opts.length > 1 ? o.l : '', price: o.p, from: !!o.from, img: p.img }); flash(add); }
});
grid.querySelectorAll('.card').forEach(c => bindTilt(c, 6));
function filter(f) {
  $$('.chip').forEach(c => { const on = c.dataset.f === f; c.classList.toggle('is-on', on); c.setAttribute('aria-selected', on); });
  $$('.card', grid).forEach(c => { const show = f === 'all' || c.dataset.cat === f; c.classList.toggle('is-hidden', !show); if (show) c.classList.add('in'); });
}
$('#chips').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) filter(c.dataset.f); });
$$('#index a[data-filter]').forEach(a => a.addEventListener('click', () => filter(a.dataset.filter)));
$$('#index a:not([data-filter])').forEach(a => a.addEventListener('click', () => filter('all')));

$('#coffs').innerHTML = COFFRETS.map(c => `<li class="coff" data-id="${c.id}" tabindex="0">
  <div><span class="coff__n">${c.name}${c.rib ? `<em class="coff__r">${c.rib}</em>` : ''}</span>
    <span class="coff__ic">${chips(c.items)}</span><span class="coff__o">${c.occ}</span></div>
  <div class="coff__p">${c.was ? `<s>${eur(c.was)}</s>` : ''}${eur(c.p)}</div>
  <button class="add" aria-label="Ajouter ${c.name} au panier" data-cursor="Ajouter"><svg class="ico"><use href="#i-plus"/></svg><span>Ajouter</span></button></li>`).join('');
function chips(items) {
  const n = {}; items.forEach(([pid, o]) => { const k = pid + ':' + o; n[k] = n[k] || { pid, o, n: 0 }; n[k].n++; });
  return Object.values(n).map(x => { const d = ITEMS[x.pid]; return `<span class="ic" title="${itemLabel(x.pid, x.o)}"><img src="${d.img}" alt="" loading="lazy"><span>${x.n > 1 ? x.n + ' × ' : ''}${itemLabel(x.pid, x.o)}</span></span>`; }).join('');
}
$('#coffs').addEventListener('click', e => {
  const li = e.target.closest('.coff'); if (!li) return; const c = COFFRETS.find(x => x.id === li.dataset.id);
  const b = e.target.closest('.add');
  if (!b) return showcase(c.id);
  addToCart({ key: c.id, name: c.name, opt: '', price: c.p, from: false, img: 'assets/card-coffret.webp' }); flash(b);
});
$$('.coff').forEach(li => { li.addEventListener('pointerenter', () => showcase(li.dataset.id)); li.addEventListener('focus', () => showcase(li.dataset.id)); });
function flash(btn) { const s = $('span', btn), t = s.textContent; btn.classList.add('done'); s.textContent = 'Ajouté'; setTimeout(() => { btn.classList.remove('done'); s.textContent = t; }, 1300); }

/* ---------------------------------------------------------------- cart */
let cart = []; try { cart = JSON.parse(localStorage.getItem('mv-cart') || '[]'); } catch (e) { cart = []; }
const cartEl = $('#cart'), veil = $('#veil'), body = $('#cartBody'), foot = $('#cartFoot');
const save = () => { try { localStorage.setItem('mv-cart', JSON.stringify(cart)); } catch (e) {} };
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2200); }
function addToCart(item) {
  const f = cart.find(i => i.key === item.key); if (f) f.qty++; else cart.push({ ...item, qty: 1 });
  save(); renderCart(); const b = $('#openCart'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); toast(item.name + ' ajouté au panier');
}
function totals() {
  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0), disc = $('#cFirst').checked ? Math.round(sub * .2 * 100) / 100 : 0;
  return { sub, disc, tot: sub - disc };
}
function waMessage() {
  const { sub, disc, tot } = totals(), name = $('#cName').value.trim(), note = $('#cNote').value.trim();
  const L = ['Bonjour Maison Volodymyr 🌿', '', 'Je souhaite commander :'];
  cart.forEach(i => L.push(`• ${i.qty} × ${i.name}${i.opt ? ' (' + i.opt + ')' : ''} — ${i.from ? 'dès ' : ''}${eur(i.price * i.qty)}`));
  L.push('', `Sous-total : ${eur(sub)}`);
  if (disc) L.push(`Carte de visite Maison Volodymyr (−20 % 1ère commande) : −${eur(disc)}`, 'Je présente la carte / son QR code.');
  L.push(`Total estimé : ${eur(tot)}`);
  if (name) L.push('', `Prénom : ${name}`);
  if (note) L.push(`Précisions : ${note}`);
  L.push('', 'Je vous envoie mes photos dans ce chat 📸');
  return L.join('\n');
}
function renderCart() {
  const n = cart.reduce((s, i) => s + i.qty, 0);
  $('#cartCount').textContent = n; $('#openCart').classList.toggle('has-items', n > 0);
  foot.classList.toggle('is-empty', !n);
  if (!n) { body.innerHTML = `<div class="empty"><svg class="ico"><use href="#i-bag"/></svg><p>Votre panier est vide.</p><a class="btn btn--ghost" href="#boutique" data-closecart>Voir la boutique</a></div>`; return; }
  body.innerHTML = cart.map((i, idx) => `<div class="line"><img src="${i.img}" alt=""><div><p class="line__n">${i.name}</p>${i.opt ? `<p class="line__o">${i.opt}</p>` : ''}
    <div class="qty"><button data-a="dec" data-i="${idx}" aria-label="Retirer un"><svg class="ico"><use href="#i-minus"/></svg></button><span>${i.qty}</span><button data-a="inc" data-i="${idx}" aria-label="Ajouter un"><svg class="ico"><use href="#i-plus"/></svg></button></div></div>
    <div class="line__r"><span class="line__p">${i.from ? '<small>dès </small>' : ''}${eur(i.price * i.qty)}</span><button class="line__x" data-a="del" data-i="${idx}">Supprimer</button></div></div>`).join('');
  const { sub, disc, tot } = totals();
  $('#sSub').textContent = eur(sub); $('#sDiscRow').hidden = !disc; $('#sDisc').textContent = '−' + eur(disc); $('#sTot').textContent = eur(tot);
  $('#sendWa').href = `https://wa.me/${WA}?text=${encodeURIComponent(waMessage())}`;
}
body.addEventListener('click', e => {
  if (e.target.closest('[data-closecart]')) return closeCart();
  const b = e.target.closest('[data-a]'); if (!b) return; const i = +b.dataset.i;
  if (b.dataset.a === 'inc') cart[i].qty++; else if (b.dataset.a === 'dec') { if (--cart[i].qty <= 0) cart.splice(i, 1); } else cart.splice(i, 1);
  save(); renderCart();
});
['cName', 'cNote', 'cFirst'].forEach(id => $('#' + id).addEventListener('input', renderCart));
$('#sendWa').addEventListener('click', e => { if (!cart.length) { e.preventDefault(); return; } renderCart(); });
function openCart() { cartEl.classList.add('on'); veil.classList.add('on'); cartEl.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; $('#closeCart').focus(); }
function closeCart() { cartEl.classList.remove('on'); veil.classList.remove('on'); cartEl.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
$('#openCart').addEventListener('click', openCart); $('#closeCart').addEventListener('click', closeCart); veil.addEventListener('click', closeCart);
addEventListener('keydown', e => { if (e.key === 'Escape' && cartEl.classList.contains('on')) closeCart(); });

/* ---------------------------------------------------------------- coffret showcase: its own open box with its own items */
const showBox = $('#bsShow'), showSlots = $('#bsShowSlots');
let showId = null, showItems = [];
function showcase(id) {
  if (!showBox || id === showId) return; showId = id; const c = COFFRETS.find(x => x.id === id);
  $$('.coff').forEach(li => li.classList.toggle('is-active', li.dataset.id === id));
  $('#bsShowName').textContent = c.name; $('#bsShowOcc').textContent = c.occ; $('#bsShowP').textContent = eur(c.p);
  const old = showItems; showItems = [];
  old.forEach(it => { it.el.style.transition = 'none'; it.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }).finished.then(() => it.el.remove()); });
  const list = c.items.map(([pid, o]) => ({ pid, o, el: makeEl(pid) })), pos = pack(list);
  list.forEach((it, i) => {
    it.el.style.opacity = 0; place(it, pos[i]); it.el.style.transition = 'none'; showSlots.appendChild(it.el); showItems.push(it);
    if (reduce) { it.el.style.opacity = 1; return; }
    it.el.animate([{ transform: 'translateX(-50%) translateY(-90px) rotate(-8deg)', opacity: 0 }, { transform: 'translateX(-50%) translateY(6px) rotate(1deg)', opacity: 1, offset: .65 }, { transform: 'translateX(-50%)', opacity: 1 }], { duration: 620, delay: 120 + i * 95, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'both' });
    setTimeout(() => { it.el.style.opacity = 1; it.el.style.transition = ''; }, 120 + i * 95 + 700);
  });
}
if (showBox) showcase('c-fam');

/* ---------------------------------------------------------------- gift builder ("Composez votre coffret") */
const BOX_FEE = 4; // black box + gold ribbon: derived from the set prices (e.g. Coffret Famille 28 € = 10 + 6 + 5 + 3 + 4)
const MAXITEMS = 6;
const PICK = ['tasse', 'metal', 'aimant', 'cles', 'pendant'];
const bs = $('#bs'), bsSlots = $('#bsSlots'), bsLid = $('#bsLid'), bsStatus = $('#bsStatus'), pickEl = $('#pick'), bClose = $('#bClose'), bReset = $('#bReset');
let bItems = [], bClosed = false, bBusy = false, uid = 0; const bSel = {};
pickEl.innerHTML = PICK.map(id => { const p = ITEMS[id]; bSel[id] = 0; return `<li class="pk" data-id="${id}">
  <img class="pk__img" src="${p.img}" alt="" width="56" height="56" loading="lazy">
  <div class="pk__m"><span class="pk__n">${p.name}</span>
    ${p.opts.length > 1 ? `<span class="pk__o" role="radiogroup" aria-label="${p.name}">${p.opts.map((o, i) => `<button class="pk__opt${i ? '' : ' is-on'}" role="radio" aria-checked="${i === 0}" data-i="${i}">${o.l}</button>`).join('')}</span>` : `<span class="pk__sub">${p.opts[0].l}</span>`}</div>
  <span class="pk__p">${eur(p.opts[0].p)}</span>
  <div class="qty pk__q"><button data-a="rm" aria-label="Retirer ${p.name}"><svg class="ico"><use href="#i-minus"/></svg></button><span>0</span><button data-a="add" aria-label="Ajouter ${p.name}"><svg class="ico"><use href="#i-plus"/></svg></button></div></li>`; }).join('');
function layout() { const pos = pack(bItems); bItems.forEach((it, i) => place(it, pos[i])); }
function bTotals() { const sum = bItems.reduce((t, i) => t + ITEMS[i.pid].opts[i.o].p, 0); return { sum, tot: sum + (bItems.length ? BOX_FEE : 0) }; }
function bRefresh() {
  const { sum, tot } = bTotals(); $('#bCount').textContent = bItems.length; $('#bItems').textContent = eur(sum); $('#bTot').textContent = eur(tot);
  $$('.pk', pickEl).forEach(li => { const n = bItems.filter(i => i.pid === li.dataset.id).length; $('.qty span', li).textContent = n; $('[data-a="rm"]', li).disabled = !n || bClosed || bBusy; $('[data-a="add"]', li).disabled = bClosed || bBusy || bItems.length >= MAXITEMS; li.classList.toggle('has', n > 0); });
  bClose.disabled = !bItems.length || bBusy;
  const full = bItems.length >= MAXITEMS;
  bsStatus.textContent = bClosed ? 'Coffret fermé, prêt à offrir' : !bItems.length ? 'Ajoutez un premier article' : full ? 'Coffret plein : fermez-le' : `${bItems.length} article${bItems.length > 1 ? 's' : ''} dans le coffret`;
  const t = $('.btn__t', bClose); t.textContent = bClosed ? `Ajouter au panier · ${eur(tot)}` : 'Fermer le coffret';
  $('use', $('.ico', bClose)).setAttribute('href', bClosed ? '#i-bag' : '#i-gift'); bReset.hidden = !bItems.length;
}
function flyIn(it, srcImg) {
  const t = it.el.getBoundingClientRect(), s = srcImg.getBoundingClientRect();
  if (reduce || !t.width) { it.el.style.opacity = 1; return Promise.resolve(); }
  const c = document.createElement('img'); c.src = it.el.src; c.alt = '';
  Object.assign(c.style, { position: 'fixed', left: s.left + 'px', top: s.top + 'px', width: s.width + 'px', height: s.height + 'px', objectFit: 'contain', zIndex: 130, pointerEvents: 'none', filter: 'drop-shadow(0 18px 24px rgba(0,0,0,.5))' });
  document.body.appendChild(c);
  const dx = t.left + t.width / 2 - (s.left + s.width / 2), dy = t.top + t.height / 2 - (s.top + s.height / 2), k = Math.min(t.width / s.width, t.height / s.height), lift = Math.min(260, 120 + Math.abs(dy) * .25);
  const a = c.animate([
    { transform: 'translate(0,0) scale(1) rotate(0deg)', offset: 0 },
    { transform: `translate(${dx * .45}px,${dy * .45 - lift}px) scale(${1 + (k - 1) * .35}) rotate(-12deg)`, offset: .45, easing: 'cubic-bezier(.4,0,.8,.6)' },
    { transform: `translate(${dx}px,${dy}px) scale(${k}) rotate(0deg)`, offset: 1 }], { duration: 950, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' });
  return a.finished.then(() => { it.el.style.opacity = 1; c.remove(); it.el.animate([{ transform: 'translateX(-50%) translateY(-14px) scaleY(.94)' }, { transform: 'translateX(-50%) translateY(3px) scaleY(1.03)', offset: .6 }, { transform: 'translateX(-50%)' }], { duration: 420, easing: 'ease-out' }); bs.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(5px)', offset: .35 }, { transform: 'translateY(0)' }], { duration: 380, easing: 'ease-out' }); });
}
async function bAdd(pid, srcImg) {
  if (bClosed || bBusy || bItems.length >= MAXITEMS) return;
  const el = makeEl(pid); el.style.opacity = 0; bsSlots.appendChild(el);
  const it = { id: ++uid, pid, o: bSel[pid], el }; bItems.push(it); layout(); bBusy = true; bRefresh();
  await flyIn(it, srcImg); bBusy = false; bRefresh();
}
function bRemove(pid) {
  if (bClosed || bBusy) return; const i = bItems.map(x => x.pid).lastIndexOf(pid); if (i < 0) return; const [it] = bItems.splice(i, 1);
  it.el.style.transition = 'none'; const a = it.el.animate([{ transform: 'translateX(-50%) translateY(0) rotate(0)', opacity: 1 }, { transform: 'translateX(-50%) translateY(-90px) rotate(8deg)', opacity: 0 }], { duration: 420, easing: 'ease-in', fill: 'forwards' });
  a.finished.then(() => it.el.remove()); layout(); bRefresh();
}
function bSparks() {
  if (reduce) return; const box = $('#bsSparks');
  for (let i = 0; i < 36; i++) { const p = document.createElement('i'); box.appendChild(p); const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 240;
    p.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * .7 - 80}px) scale(.1)`, opacity: 0 }], { duration: 900 + Math.random() * 900, delay: Math.random() * 200, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' }).onfinish = () => p.remove(); }
}
async function bCloseBox() {
  if (!bItems.length || bBusy) return; bBusy = true; bRefresh();
  if (reduce) { bsLid.style.opacity = 1; } else {
    await bsLid.animate([{ transform: 'translateY(-125%) rotate(-7deg)', opacity: 0 }, { opacity: 1, offset: .15 }, { transform: 'translateY(3%) rotate(.6deg)', opacity: 1, offset: .74 }, { transform: 'translateY(-1%)', opacity: 1, offset: .88 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 1000, easing: 'cubic-bezier(.4,0,.3,1)', fill: 'forwards' }).finished;
    bs.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(6px) scale(1.012)', offset: .4 }, { transform: 'none' }], { duration: 450, easing: 'ease-out' });
    $('#bsShine').classList.remove('go'); void $('#bsShine').offsetWidth; $('#bsShine').classList.add('go'); bSparks();
  }
  bClosed = true; bBusy = false; bs.dataset.state = 'closed'; bRefresh();
}
async function bOpenBox(reset) {
  if (reduce) bsLid.style.opacity = 0; else await bsLid.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-125%) rotate(6deg)', opacity: 0 }], { duration: 650, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' }).finished;
  bClosed = false; bs.dataset.state = 'open'; if (reset) { bItems.forEach(i => i.el.remove()); bItems = []; } bRefresh();
}
pickEl.addEventListener('click', e => {
  const li = e.target.closest('.pk'); if (!li) return; const id = li.dataset.id, p = ITEMS[id];
  const opt = e.target.closest('.pk__opt');
  if (opt) { bSel[id] = +opt.dataset.i; $$('.pk__opt', li).forEach(b => { b.classList.toggle('is-on', b === opt); b.setAttribute('aria-checked', b === opt); }); $('.pk__p', li).textContent = eur(p.opts[bSel[id]].p); return; }
  const a = e.target.closest('[data-a]'); if (!a) return;
  if (a.dataset.a === 'add') bAdd(id, $('.pk__img', li)); else bRemove(id);
});
bClose.addEventListener('click', () => {
  if (!bClosed) return bCloseBox();
  const { tot } = bTotals(), names = {}; bItems.forEach(i => { const k = itemLabel(i.pid, i.o); names[k] = (names[k] || 0) + 1; });
  const list = Object.entries(names).map(([k, n]) => (n > 1 ? n + ' × ' : '') + k).join(', ');
  addToCart({ key: 'custom:' + list, name: 'Coffret sur mesure', opt: list, price: tot, from: false, img: 'assets/card-coffret.webp' });
  bOpenBox(true);
});
bReset.addEventListener('click', () => { if (!bBusy) { if (bClosed) bOpenBox(true); else { bItems.forEach(i => i.el.remove()); bItems = []; bRefresh(); } } });
bRefresh();
renderCart(); observeReveals();
})();
