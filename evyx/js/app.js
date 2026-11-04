(function(){
'use strict';
const C = window.EVYX, gsap = window.gsap, ST = window.ScrollTrigger;
gsap.registerPlugin(ST);
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const tg = C.contact.telegram;
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const vid = id => C.videos.find(v => v.id === id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tgLink = t => `https://t.me/${tg}?text=${encodeURIComponent(t)}`;
const store = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};

/* ---------------- smooth scroll ---------------- */
let lenis = null;
if (!reduce && window.Lenis){
  lenis = new Lenis({lerp: .09, smoothWheel: true});
  lenis.on('scroll', ST.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
if (history.scrollRestoration) history.scrollRestoration = 'manual';
const toTop = () => { lenis ? lenis.scrollTo(0, {immediate: true, force: true}) : scrollTo(0, 0); };
const scrollToY = y => { lenis ? lenis.scrollTo(y, {duration: 1.2}) : scrollTo({top: y, behavior: 'smooth'}); };

/* ---------------- static fills ---------------- */
$('#yr').textContent = new Date().getFullYear();
$('#contacts').innerHTML = `<li><a href="https://t.me/${tg}" target="_blank" rel="noopener">Telegram</a></li><li><a href="mailto:${C.contact.email}">${C.contact.email}</a></li><li><a href="https://instagram.com/${C.contact.instagram}" target="_blank" rel="noopener">Instagram</a></li>`;
$('#quote-tg').href = tgLink('Hi EVYX, I want a quote for business content in Europe.');
$$('[data-course]').forEach(e => e.textContent = C.prices.course);
$$('.hdr__cta').forEach(e => e.textContent = 'Order · $' + C.prices.tiers[0]);
$$('[data-includes]').forEach(ul => {
  const n = +ul.dataset.includes || C.courseIncludes.length;
  ul.innerHTML = C.courseIncludes.slice(0, n).map(i => `<li>${esc(i)}</li>`).join('');
});

/* ---------------- header ---------------- */
const hdr = $('#hdr'), nav = $('#nav'), burger = $('#burger');
const onScroll = () => hdr.classList.toggle('solid', scrollY > 40);
addEventListener('scroll', onScroll, {passive: true}); onScroll();
burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });

/* ---------------- toast / copy ---------------- */
function toast(t){ const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 2200); }
function copy(t){
  const ok = () => toast('Copied');
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(ok, () => {
    const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select();
    try { document.execCommand('copy'); } catch(e){} a.remove(); ok();
  });
}

/* ---------------- modal ---------------- */
const modal = $('#modal'), mbody = $('#mbody'), mbox = $('#mbox');
function openModal(wide){
  mbox.classList.toggle('mbox--wide', !!wide);
  modal.classList.add('open'); lenis && lenis.stop();
  gsap.fromTo(mbox, {y: 28, opacity: 0}, {y: 0, opacity: 1, duration: .5, ease: 'power3.out'});
  setTimeout(() => $('#mclose').focus(), 50);
}
function closeModal(){ modal.classList.remove('open'); lenis && lenis.start(); mbody.innerHTML = ''; }
$('#mclose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

function openPreview(v){
  mbody.innerHTML = `<div class="preview"><div id="pv"></div><div><span class="kicker">${esc(v.cat)}</span><h3 class="h2" style="font-size:clamp(24px,3vw,38px);margin:16px 0 10px">${esc(v.title)}</h3><p class="small" style="margin-bottom:8px">Sample · ${esc(v.len)}</p><p style="margin-bottom:26px;color:var(--ink-2)">We make this kind of video for you: vertical, no watermark, ready to post.</p><div class="h1 gtext" style="font-size:52px;margin-bottom:24px">from $${C.prices.tiers[0]}</div><button class="btn btn--fill" id="pv-order">Order this video <span class="arrow"></span></button></div></div>`;
  const card = window.EVYXCard(v, {static: true, autoplay: true, eager: true});
  const vd = $('video', card); if (vd){ vd.controls = true; vd.muted = false; vd.play().catch(() => {}); }
  $('#pv').appendChild(card);
  $('#pv-order').onclick = () => openOrder({product: 'Video · ' + v.title});
  openModal(true);
}

/* =================== CHECKOUT =================== */
const isReal = a => a && !/PASTE_/i.test(a);
function qrSvg(text){
  const q = qrcode(0, 'M'); q.addData(text); q.make();
  const n = q.getModuleCount(); let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img" aria-label="QR code"><path d="${d}" fill="#000"/></svg>`;
}
function renderCheckout(host, opts){
  const hasBrief = !!opts.brief;
  const st = {step: hasBrief && !opts.skipBrief ? 1 : 2, net: C.pay.networks[0], amount: opts.amount, product: opts.product,
              brief: opts.brief || null, contact: opts.contact || '', tier: opts.tier || 0};
  const total = hasBrief ? 3 : 2, off = hasBrief ? 0 : 1;
  const stepper = () => `<div class="stepper">${Array.from({length: total}, (_, i) => `<i class="${st.step - off >= i + 1 ? 'on' : ''}"></i>`).join('')}</div>`;

  function draw(){
    if (st.step === 1){
      host.innerHTML = `${stepper()}<span class="kicker">Step 1 · Your video</span>
        <form id="ck-brief" style="margin-top:22px">
          <div class="field"><span>Price</span><div class="seg" id="ck-tier">${C.prices.tiers.map((p, i) => `<button type="button" data-i="${i}" aria-pressed="${i === st.tier}"><b>$${p}</b>${['One scene', 'Two scenes', 'Character + effects'][i]}</button>`).join('')}</div></div>
          <div class="field"><label for="ck-ref">Reference link</label><input id="ck-ref" required placeholder="https://" value="${esc((st.brief && st.brief.ref) || '')}"></div>
          <div class="field"><label for="ck-note">What should change</label><input id="ck-note" placeholder="Your idea, style, text" value="${esc((st.brief && st.brief.note) || '')}"></div>
          <div class="field"><label for="ck-contact">Your Telegram or email</label><input id="ck-contact" required value="${esc(st.contact)}"></div>
          <button class="btn btn--fill" type="submit">Continue to payment <span class="arrow"></span></button>
        </form>`;
      $$('#ck-tier button', host).forEach(b => b.onclick = () => {
        st.tier = +b.dataset.i; st.amount = C.prices.tiers[st.tier];
        $$('#ck-tier button', host).forEach(x => x.setAttribute('aria-pressed', x === b));
      });
      $('#ck-brief', host).onsubmit = e => {
        e.preventDefault();
        st.brief = {ref: $('#ck-ref', host).value.trim(), note: $('#ck-note', host).value.trim()};
        st.contact = $('#ck-contact', host).value.trim(); st.step = 2; draw();
      };
    }
    else if (st.step === 2){
      const n = st.net, real = isReal(n.address), addr = real ? n.address : 'DEMO-NOT-A-REAL-ADDRESS';
      host.innerHTML = `${stepper()}<span class="kicker">Step ${hasBrief ? 2 : 1} · Pay in USDT</span>
        <div class="small" style="margin:20px 0 6px">${esc(st.product)}</div>
        <div class="amt gtext" style="margin-bottom:18px">${st.amount} ${n.token}</div>
        <ol class="steps3"><li>Choose the network.</li><li>Send exactly <b class="gold">${st.amount} ${n.token}</b> to the address.</li><li>Paste the transaction hash and confirm.</li></ol>
        ${real ? '' : '<div class="notice"><b class="gold">Preview mode.</b> Wallets are not connected yet, so this is a sample address that cannot receive funds. Add your wallets in <b>js/config.js</b> and this notice disappears.</div>'}
        <div class="nets">${C.pay.networks.map(x => `<button class="net" type="button" data-id="${x.id}" aria-pressed="${x.id === n.id}"><b>${x.token}</b>${x.chain}</button>`).join('')}</div>
        <div class="paybox"><div class="qr">${qrSvg(addr)}</div><div><span class="small">${esc(n.hint || '')}</span><div class="addr" id="ck-addr">${esc(addr)}</div><button class="btn btn--sm" type="button" id="ck-copy">Copy address</button></div></div>
        <p class="small" style="margin-bottom:22px">Use the <b class="gold">${n.chain}</b> network only. A different network means lost funds.</p>
        <form id="ck-confirm"><div class="field"><label for="ck-tx">Transaction hash</label><input id="ck-tx" required minlength="12" placeholder="Paste the TX hash after sending"></div>
        ${st.contact ? '' : '<div class="field"><label for="ck-c2">Your Telegram or email</label><input id="ck-c2" required></div>'}
        <button class="btn btn--fill" type="submit">Confirm payment <span class="arrow"></span></button></form>`;
      $$('.net', host).forEach(b => b.onclick = () => { st.net = C.pay.networks.find(x => x.id === b.dataset.id); draw(); });
      $('#ck-copy', host).onclick = () => copy(addr);
      $('#ck-confirm', host).onsubmit = e => {
        e.preventDefault();
        const tx = $('#ck-tx', host).value.trim(); const c2 = $('#ck-c2', host); if (c2) st.contact = c2.value.trim();
        const r = {id: 'EVYX-' + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).slice(2, 4).toUpperCase(),
          time: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC', product: st.product, amount: `${st.amount} ${n.token}`,
          network: n.chain, tx, contact: st.contact, brief: st.brief, preview: !real};
        const all = store.get('evyx-receipts') || []; all.push(r); store.set('evyx-receipts', all);
        st.receipt = r; st.step = 3; draw();
      };
    }
    else {
      const r = st.receipt;
      const text = `EVYX receipt ${r.id}\n${r.product}\nAmount: ${r.amount} (${r.network})\nTX: ${r.tx}\nTime: ${r.time}\nContact: ${r.contact}` + (r.brief ? `\nReference: ${r.brief.ref}\nNote: ${r.brief.note || '-'}` : '');
      host.innerHTML = `${stepper()}<span class="kicker">Receipt</span>
        <div class="receipt" style="margin-top:20px"><div class="amt gtext">${r.preview ? 'Preview receipt' : 'Payment submitted'}</div>
        <dl><dt>Receipt</dt><dd>${esc(r.id)}</dd><dt>Product</dt><dd>${esc(r.product)}</dd><dt>Amount</dt><dd>${esc(r.amount)} · ${esc(r.network)}</dd><dt>Transaction</dt><dd>${esc(r.tx)}</dd><dt>Time</dt><dd>${esc(r.time)}</dd><dt>Status</dt><dd class="gold">${r.preview ? 'Preview, no payment made' : 'Pending verification'}</dd></dl>
        <p class="small">${r.preview ? 'Wallets are not connected yet, so nothing was sent.' : 'We check the transaction on-chain and send your ' + (r.brief ? 'order update' : 'access') + ' in Telegram. Keep this receipt number.'}</p></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px"><button class="btn" id="rc-copy">Copy receipt</button><a class="btn btn--fill" target="_blank" rel="noopener" href="${tgLink(text)}">Send to Telegram <span class="arrow"></span></a></div>`;
      $('#rc-copy', host).onclick = () => copy(text);
    }
    gsap.from(host.children, {opacity: 0, y: 16, duration: .45, stagger: .04, ease: 'power3.out'});
  }
  draw();
}
function openOrder(o = {}){
  const tier = o.tier || 0;
  openModal(false);
  renderCheckout(mbody, {product: o.product || 'Video order', amount: C.prices.tiers[tier], tier,
                         brief: o.brief || {ref: '', note: ''}, contact: o.contact || '', skipBrief: !!o.skipBrief});
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-order]');
  if (b){ e.preventDefault(); openOrder({}); return; }
  const f = e.target.closest('[data-filter]');
  if (f) window.EVYX_filter = f.dataset.filter;
  const a = e.target.closest('a[href^="#"]');
  if (a){
    nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false');
    if (a.getAttribute('href') === location.hash) toTop();     // same page: scroll up
  }
});

/* =================== helpers for views =================== */
function fitWord(el, frac, maxVw){
  el.style.fontSize = '100px';
  const w = el.getBoundingClientRect().width || el.scrollWidth || 1;
  let fs = 100 * Math.min(innerWidth * frac, 2300) / w;
  if (maxVw) fs = Math.min(fs, innerWidth * maxVw / 100);
  el.style.fontSize = fs + 'px';
  return fs;
}
function accordion(host, items, openFirst){
  host.innerHTML = '';
  items.forEach(([q, a], i) => {
    const d = document.createElement('div'); d.className = 'mod' + (openFirst && i === 0 ? ' open' : '');
    d.innerHTML = `<button aria-expanded="${!!(openFirst && i === 0)}"><span>${esc(q)}</span><i></i></button><div class="a" style="height:${openFirst && i === 0 ? 'auto' : 0}"><p>${esc(a)}</p></div>`;
    d.querySelector('button').onclick = () => {
      const o = d.classList.toggle('open'); d.querySelector('button').setAttribute('aria-expanded', o);
      gsap.to(d.querySelector('.a'), {height: o ? 'auto' : 0, duration: .45, ease: 'power3.inOut', onComplete: () => ST.refresh()});
    };
    host.appendChild(d);
  });
}
function revealBlocks(view){
  if (reduce) return;
  $$('.head, .split > *, .tariffs > *, .rows .row, .faq > *, .calc, .product, .tablist, #tpanels', view).forEach(el => {
    gsap.set(el, {opacity: 0, y: 34});
    ST.create({trigger: el, start: 'top 92%', once: true, onEnter: () => gsap.to(el, {opacity: 1, y: 0, duration: .9, ease: 'power3.out'})});
  });
}
function revealCards(grid){
  if (reduce) return;
  const cards = $$('.card', grid);
  gsap.set(cards, {opacity: 0, y: 46});
  ST.batch(cards, {start: 'top 94%', once: true, onEnter: b => gsap.to(b, {opacity: 1, y: 0, duration: .9, stagger: .07, ease: 'power3.out'})});
}

/* =================== VIEWS =================== */
const views = {};

/* ----- HOME ----- */
let homeBuilt = false;
function buildHome(){
  $('#kindsGrid').innerHTML = C.kinds.map(k => `<div class="kind"><div class="kind__pic"><img src="${k.img}" alt="${esc(k.title)}" loading="lazy"></div><h3 class="h3">${esc(k.title)}</h3><p>${esc(k.text)}</p></div>`).join('');
  $('#howList').innerHTML = C.how.map(([t, d]) => `<li><h3 class="h3">${esc(t)}</h3><p>${esc(d)}</p></li>`).join('');
  const g = $('#home-grid');
  C.videos.forEach(v => { const c = window.EVYXCard(v); c.addEventListener('click', () => openPreview(v)); g.appendChild(c); });
  accordion($('#reqs'), [['What requests do you work with?', C.requests]], false);
  const rc = $('#reelCards');
  C.videos.forEach((v, i) => {
    const w = document.createElement('div'); w.className = 'reel__card'; w.dataset.i = i;
    const c = window.EVYXCard(v, {static: true, eager: true});
    c.classList.remove('card--static'); c.style.cursor = 'pointer'; c.setAttribute('role', 'button'); c.tabIndex = 0; c.setAttribute('aria-label', 'Open ' + v.title);
    c.addEventListener('click', () => openPreview(v)); c.addEventListener('keydown', e => { if (e.key === 'Enter') openPreview(v); });
    w.appendChild(c); rc.appendChild(w);
  });
}
views.home = {
  mount(view){
    if (!homeBuilt){ homeBuilt = true; buildHome(); }
    const intro = $('#intro'), hero = $('#hero'), robot = $('#heroRobot'), title = $('#heroTitle');
    const lines = $$('.hl', title), spans = lines.map(l => l.firstElementChild);
    function fit(){
      let size = 1e9;
      spans.forEach(sp => { sp.style.fontSize = '100px'; size = Math.min(size, 100 * Math.min(hero.clientWidth * .875, 2000) / (sp.offsetWidth || 1)); });
      spans.forEach(sp => { sp.style.fontSize = size + 'px'; });
    }
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    const onResize = () => fit(); addEventListener('resize', onResize);

    /* cursor: parallax, a gold light on the robot, a light that sweeps through the words */
    let mx = 0, my = 0, cx = 0, cy = 0, px = -9999, py = -9999;
    const onMove = e => { mx = (e.clientX / innerWidth - .5) * 2; my = (e.clientY / innerHeight - .5) * 2; px = e.clientX; py = e.clientY; };
    addEventListener('pointermove', onMove, {passive: true});
    const tick = () => {
      cx += (mx - cx) * .06; cy += (my - cy) * .06;
      robot.style.setProperty('--px', (cx * 16) + 'px'); robot.style.setProperty('--py2', (cy * 8) + 'px');
      title.style.setProperty('--tx', (cx * -12) + 'px'); title.style.setProperty('--ty', (cy * -5) + 'px');
      const r = robot.getBoundingClientRect();
      const inside = px > r.left + r.width * .18 && px < r.right - r.width * .14 && py > r.top + r.height * .06 && py < r.bottom;
      robot.style.setProperty('--hov', inside ? 1 : 0);
      robot.style.setProperty('--gx', ((px - r.left) / r.width * 100) + '%'); robot.style.setProperty('--gy', ((py - r.top) / r.height * 100) + '%');
      spans.forEach(sp => { const b = sp.getBoundingClientRect(); sp.style.setProperty('--lx', (px - b.left) + 'px'); sp.style.setProperty('--ly', (py - b.top) + 'px'); });
    };
    if (!reduce) gsap.ticker.add(tick);

    /* one continuous scroll: the words recede, videos fly out of the android */
    const cards = $$('.reel__card', hero);
    if (innerWidth > 900 && !reduce){
      const slots = [[-31, -6, -13], [31, -20, 9], [-40, 22, 7], [40, 16, -8], [-20, -30, -5], [22, 30, 11], [-27, 34, 13], [31, 0, -12]];
      gsap.set(cards, {xPercent: -50, yPercent: -50, left: '50%', top: '46%', autoAlpha: 0, scale: .15, z: -900});
      const tl = gsap.timeline({defaults: {ease: 'power2.out'}, scrollTrigger: {trigger: intro, start: 'top top', end: 'bottom bottom', scrub: .8}});
      tl.to('#heroUI', {autoAlpha: 0, y: 30, duration: .5, ease: 'power2.in'}, 0)
        .to(title, {scale: 1.35, opacity: 0, duration: 2.2, ease: 'power1.in'}, .1)
        .to('.hero__rings', {scale: 1.6, opacity: 0, duration: 3, ease: 'none'}, 0)
        .to(robot, {scale: 1.04, duration: 6, ease: 'none'}, 0)
        .to('.reel__cap', {opacity: 1, duration: .6}, 4.6);
      cards.forEach((c, i) => {
        const [x, y, r] = slots[i % slots.length], t = .7 + i * .5;
        tl.fromTo(c, {autoAlpha: 0, scale: .15, z: -900, x: 0, y: 0, rotationY: 0, rotation: 0},
                     {autoAlpha: 1, scale: 1, z: 0, x: x * innerWidth / 100, y: y * innerHeight / 100 * .9, rotation: r * .5, rotationY: x < 0 ? 14 : -14, duration: 1.5}, t)
          .to(c, {x: x * innerWidth / 100 * 1.07, y: y * innerHeight / 100 * 1.04, z: 120, duration: 1.6, ease: 'none'}, t + 1.5);
      });
    }

    revealBlocks(view);
    revealCards($('#home-grid'));
    /* "what we create": pictures rise in as you scroll, with a little parallax */
    $$('.kind', view).forEach((k, i) => {
      if (reduce) return;
      gsap.fromTo(k, {opacity: 0, y: 70}, {opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: {trigger: k, start: 'top 90%', once: true}});
      gsap.fromTo($('img', k), {yPercent: 8}, {yPercent: -8, ease: 'none', scrollTrigger: {trigger: k, start: 'top bottom', end: 'bottom top', scrub: true}});
    });
    $$('.how li', view).forEach((li, i) => { if (!reduce) gsap.fromTo(li, {opacity: 0, y: 40}, {opacity: 1, y: 0, duration: .9, delay: i * .1, scrollTrigger: {trigger: li, start: 'top 92%', once: true}}); });
    return () => { removeEventListener('resize', onResize); removeEventListener('pointermove', onMove); gsap.ticker.remove(tick); };
  }
};

/* ----- WORK ----- */
views.work = {
  mount(view){
    const grid = $('#work-grid');
    if (!grid.children.length){
      C.videos.forEach(v => { const c = window.EVYXCard(v); c.addEventListener('click', () => openPreview(v)); grid.appendChild(c); });
      const chips = $('#chips');
      ['All', ...new Set(C.videos.map(v => v.cat))].forEach((c, i) => {
        const b = document.createElement('button'); b.className = 'chip'; b.type = 'button'; b.textContent = c; b.setAttribute('aria-pressed', i === 0);
        b.onclick = () => applyFilter(c);
        chips.appendChild(b);
      });
      const sel = $('#c-niche'); sel.innerHTML = C.niches.map(n => `<option>${esc(n)}</option>`).join('');
      const tiers = [['Up to 8 seconds, one scene', C.prices.tiers[0]], ['Up to 15 seconds, two scenes', C.prices.tiers[1]], ['15 seconds, character and effects', C.prices.tiers[2]]];
      let tier = 0; const tb = $('#c-tier');
      tb.innerHTML = tiers.map((t, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}"><b>$${t[1]}</b>${t[0]}</button>`).join('');
      $$('button', tb).forEach(b => b.onclick = () => {
        tier = +b.dataset.i; $$('button', tb).forEach(x => x.setAttribute('aria-pressed', x === b));
        $('#c-price').textContent = tiers[tier][1];
        gsap.fromTo('#c-price', {y: -12, opacity: 0}, {y: 0, opacity: 1, duration: .35});
      });
      $('#calcform').onsubmit = e => {
        e.preventDefault();
        openOrder({product: `Video · ${sel.value} · ${tiers[tier][0]}`, tier, contact: $('#c-contact').value.trim(), skipBrief: true,
                   brief: {ref: $('#c-ref').value.trim(), note: $('#c-note').value.trim()}});
      };
    }
    function applyFilter(c){
      $$('.chip', $('#chips')).forEach(x => x.setAttribute('aria-pressed', x.textContent === c));
      const cards = $$('.card', grid);
      gsap.to(cards, {opacity: 0, scale: .97, duration: .2, onComplete: () => {
        cards.forEach(t => t.classList.toggle('hide', c !== 'All' && t.dataset.cat !== c));
        gsap.fromTo(cards.filter(t => !t.classList.contains('hide')), {opacity: 0, scale: .97}, {opacity: 1, scale: 1, duration: .5, stagger: .04, clearProps: 'transform'});
        ST.refresh();
      }});
    }
    if (window.EVYX_filter){ const f = window.EVYX_filter; window.EVYX_filter = null; applyFilter(C.videos.some(v => v.cat === f) ? f : 'All'); }
    gsap.from($$('.page > .page__head > *', view), {y: 28, opacity: 0, stagger: .09, duration: .8, ease: 'power3.out', delay: .1, clearProps: 'transform'});
    revealCards(grid); revealBlocks(view);
  }
};

/* ----- SERVICES ----- */
views.services = {
  mount(view){
    const t = $('#tariffs');
    if (!t.children.length){
      const data = [['Single scene', 'Up to 8 seconds, one scene', ['Any reference you send', 'Your idea and brand', 'Vertical 9:16', 'One round of fixes']],
        ['Two scenes', 'Up to 15 seconds, two scenes', ['Everything in Single scene', 'Two scenes, one story', 'Sound and captions', 'Delivery in 1–2 days']],
        ['Character + effects', '15 seconds, character and effects', ['Everything in Two scenes', 'A consistent character', 'Custom VFX', 'Priority queue']]];
      data.forEach((d, i) => {
        const el = document.createElement('div'); el.className = 'glass tariff' + (i === 1 ? ' tariff--hot' : '');
        el.innerHTML = `<span class="kicker">${esc(d[0])}</span><div class="price gtext">$${C.prices.tiers[i]}</div><p class="small" style="margin-top:-8px">${esc(d[1])}</p><ul>${d[2].map(x => `<li>${esc(x)}</li>`).join('')}</ul><button class="btn ${i === 1 ? 'btn--fill' : ''}" type="button">Order $${C.prices.tiers[i]} <span class="arrow"></span></button>`;
        $('button', el).onclick = () => openOrder({product: 'Video · ' + d[0], tier: i});
        t.appendChild(el);
      });
      accordion($('#faq'), C.faq, false);
    }
    gsap.from($$('.page > .page__head > *', view), {y: 28, opacity: 0, stagger: .09, duration: .8, ease: 'power3.out', delay: .1, clearProps: 'transform'});
    revealBlocks(view);
  }
};

/* ----- ACADEMY ----- */
views.academy = {
  mount(view){
    const list = $('#tablist'), panels = $('#tpanels');
    if (!list.children.length){
      C.tutorials.forEach((t, n) => {
        const v = vid(t.id) || C.videos[0];
        const b = document.createElement('button'); b.className = 'tab'; b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', n === 0);
        b.innerHTML = `<span>${esc(t.title)}</span><small>${esc(t.tag)}</small>`; list.appendChild(b);
        const p = document.createElement('div'); p.className = 'tpanel' + (n === 0 ? ' on' : ''); p.setAttribute('role', 'tabpanel');
        const left = document.createElement('div'); const card = window.EVYXCard(v); card.addEventListener('click', () => openPreview(v)); left.appendChild(card);
        const right = document.createElement('div');
        right.innerHTML = `<h3 class="h3" style="margin-bottom:6px">How to make this video free</h3><p class="small" style="margin-bottom:12px">Four steps. No paid subscription.</p><ol>${t.free.map(s => `<li>${esc(s)}</li>`).join('')}</ol><div class="lock"><div><b>INSIDE THE PROGRAM</b><p>${esc(t.locked)}</p></div><a class="btn btn--sm btn--fill" href="#checkout">Get it · $${C.prices.course}</a></div>`;
        p.append(left, right); panels.appendChild(p);
        b.onclick = () => {
          $$('.tab', list).forEach(x => x.setAttribute('aria-selected', x === b));
          $$('.tpanel', panels).forEach(x => x.classList.toggle('on', x === p));
          gsap.fromTo($$('li', p), {opacity: 0, x: 26}, {opacity: 1, x: 0, duration: .5, stagger: .08, ease: 'power3.out'});
          ST.refresh();
        };
      });
      accordion($('#program'), C.program, true);
    }
    gsap.from($$('.page > .page__head > *', view), {y: 28, opacity: 0, stagger: .09, duration: .8, ease: 'power3.out', delay: .1, clearProps: 'transform'});
    revealBlocks(view);
  }
};

/* ----- CHECKOUT ----- */
views.checkout = {
  mount(view){
    renderCheckout($('#ck-host'), {product: 'EVYX Academy · full program', amount: C.prices.course});
    gsap.from($$('.page > .page__head > *', view), {y: 28, opacity: 0, stagger: .09, duration: .8, ease: 'power3.out', delay: .1, clearProps: 'transform'});
  }
};

/* =================== ROUTER =================== */
const routes = Object.keys(views);
const veil = $('#veil');
let current = null, busy = false, mounted = {ctx: null, clean: null};
const routeFromHash = () => { const h = (location.hash || '#home').slice(1); return routes.includes(h) ? h : 'home'; };

function activate(name){
  if (mounted.ctx){ mounted.ctx.revert(); mounted.clean && mounted.clean(); ST.getAll().forEach(s => s.kill()); }
  $$('.view').forEach(v => v.classList.remove('on'));
  const view = $('#v-' + name); view.classList.add('on');
  document.title = view.dataset.title || 'EVYX';
  $$('#nav a').forEach(a => a.toggleAttribute('aria-current', a.dataset.r === name));
  nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false');
  toTop();
  let clean = null;
  mounted.ctx = gsap.context(() => { clean = views[name].mount(view); }, view);
  mounted.clean = clean; current = name;
  requestAnimationFrame(() => ST.refresh());
}
function go(name, first){
  if (first || reduce){ activate(name); return; }
  if (name === current || busy) return;
  busy = true; veil.style.pointerEvents = 'auto';
  gsap.timeline({onComplete: () => { busy = false; veil.style.pointerEvents = 'none'; if (routeFromHash() !== current) go(routeFromHash()); }})
    .to(veil, {opacity: 1, duration: .28, ease: 'power2.in'})
    .add(() => activate(name))
    .to(veil, {opacity: 0, duration: .5, ease: 'power2.out'}, '+=.05');
}
addEventListener('hashchange', () => go(routeFromHash()));

/* =================== LOADER + BOOT =================== */
go(routeFromHash(), true);
})();
