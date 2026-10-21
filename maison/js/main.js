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
  { id: 'c-maman', name: 'Pour Maman', occ: 'Fête des mères', c: 'Tasse photo · photo 15×20 · aimant', p: 23 },
  { id: 'c-papa', name: 'Pour Papa', occ: 'Fête des pères', c: 'Tasse photo · porte-clés double · aimant', p: 22 },
  { id: 'c-duo', name: 'Duo Amoureux', occ: 'Saint-Valentin', c: '2 tasses photo · photo 10×15 · aimant', p: 31 },
  { id: 'c-gp', name: 'Grands-parents', occ: 'Papi & Mamie', c: 'Photo 20×30 · tasse photo · aimant', p: 26 },
  { id: 'c-bebe', name: 'Bébé', occ: 'Naissance', c: 'Tasse photo · photo 10×15 · porte-clés · aimant', p: 25 },
  { id: 'c-fam', name: 'Coffret Famille', occ: 'Pour toute la famille', c: 'Tasse photo · photo 15×20 · porte-clés double · aimant', p: 28, rib: 'Best-seller' },
  { id: 'c-noel', name: 'Coffret Noël', occ: 'Noël & Nouvel An', c: '2 tasses photo · photo 15×20 · porte-clés · 2 aimants', p: 41 },
  { id: 'c-prest', name: 'Coffret Prestige', occ: 'Le grand cadeau', c: 'Photo 30×40 · tasse photo · pendentif · porte-clés double · aimant', p: 51, was: 56, rib: 'Prestige' },
  { id: 'c-duo2', name: 'Prestige Duo', occ: 'Pour deux familles', c: 'Photo 30×40 · 2 tasses photo · 2 pendentifs · 2 aimants', p: 66, was: 72, rib: 'Prestige' }
];
const eur = n => (Math.round(n * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0 }) + ' €';

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
if (fine) {
  hit.addEventListener('pointerenter', () => { clearTimeout(closeTimer); setOpen(true); });
  hit.addEventListener('pointerleave', () => { closeTimer = setTimeout(() => setOpen(false), 350); });
  hit.addEventListener('focus', () => setOpen(true)); hit.addEventListener('blur', () => setOpen(false));
} else hit.addEventListener('click', () => setOpen(!opened));
hit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!opened); } });
// parallax of the headline against the scene
if (fine && !reduce) {
  const hl = $('.headline'); let px = 0, py = 0, tx = 0, ty = 0;
  hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); tx = (e.clientX / r.width - .5); ty = (e.clientY / r.height - .5); });
  (function loop() { px += (tx - px) * .06; py += (ty - py) * .06; hl.style.transform = `translate(${px * -18}px,${py * -10}px)`; requestAnimationFrame(loop); })();
}
$('#aboutOpen').addEventListener('click', () => $('#aboutDlg').showModal());
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

$('#coffs').innerHTML = COFFRETS.map(c => `<li class="coff" data-id="${c.id}">
  <div><span class="coff__n">${c.name}${c.rib ? `<em class="coff__r">${c.rib}</em>` : ''}</span><span class="coff__c">${c.c}</span><span class="coff__o">${c.occ}</span></div>
  <div class="coff__p">${c.was ? `<s>${eur(c.was)}</s>` : ''}${eur(c.p)}</div>
  <button class="add" aria-label="Ajouter ${c.name} au panier" data-cursor="Ajouter"><svg class="ico"><use href="#i-plus"/></svg><span>Ajouter</span></button></li>`).join('');
$('#coffs').addEventListener('click', e => {
  const b = e.target.closest('.add'); if (!b) return; const c = COFFRETS.find(x => x.id === b.closest('.coff').dataset.id);
  addToCart({ key: c.id, name: c.name, opt: '', price: c.p, from: false, img: 'assets/card-coffret.webp' }); flash(b);
});
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
  if (disc) L.push(`Première commande (−20 %) : −${eur(disc)}`);
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
renderCart(); observeReveals();
})();
