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
  mbody.innerHTML = `<div class="preview"><div id="pv"></div><div><span class="kicker">${esc(v.cat)}</span><h3 class="h2" style="font-size:clamp(24px,3vw,38px);margin:16px 0 10px">${esc(v.title)}</h3><p class="small" style="margin-bottom:8px">Sample · ${esc(v.len)}</p><p style="margin-bottom:26px;color:var(--ink-2)">We make this kind of video with your product and brand: vertical, no watermark, ready to post.</p><div class="h1 gtext" style="font-size:52px;margin-bottom:24px">from $${C.prices.tiers[0]}</div><button class="btn btn--fill" id="pv-order">Order this video <span class="arrow"></span></button></div></div>`;
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
          <div class="field"><span>Price</span><div class="seg" id="ck-tier">${C.prices.tiers.map((p, i) => `<button type="button" data-i="${i}" aria-pressed="${i === st.tier}"><b>$${p}</b>${['One scene', 'Two scenes', 'Character + product'][i]}</button>`).join('')}</div></div>
          <div class="field"><label for="ck-ref">Reference link</label><input id="ck-ref" required placeholder="https://" value="${esc((st.brief && st.brief.ref) || '')}"></div>
          <div class="field"><label for="ck-note">What should change</label><input id="ck-note" placeholder="Your product, colours, text" value="${esc((st.brief && st.brief.note) || '')}"></div>
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
const robots = {hero: null, story: null};
let homeBuilt = false;
function buildStory(){
  const el = $('#story'), N = C.stages.length;
  el.innerHTML = `<div class="story__stage">
    ${C.stages.map((s, k) => `<div class="word story__word" data-k="${k}" aria-hidden="true">${esc(s.word)}</div>`).join('')}
    <div class="robot story__robot" id="storyRobot" aria-hidden="true"><canvas></canvas><span class="lens-glow"></span></div>
    <div class="story__nav">${C.stages.map((s, k) => `<button type="button" data-k="${k}">${esc(s.title.split(' and ')[0])}</button>`).join('')}</div>
  </div>`;
  const stage = $('.story__stage', el);
  C.stages.forEach((s, k) => {
    const v = vid(s.video), other = s.side === 'left' ? 'right' : 'left';
    const cw = document.createElement('div'); cw.className = 'story__item is-card'; cw.dataset.k = k; cw.dataset.side = s.side;
    const card = window.EVYXCard(v, {static: true, eager: true});
    card.setAttribute('role', 'button'); card.tabIndex = 0; card.style.cursor = 'pointer'; card.setAttribute('aria-label', 'Open ' + v.title);
    card.addEventListener('click', () => openPreview(v));
    card.addEventListener('keydown', e => { if (e.key === 'Enter') openPreview(v); });
    const play = document.createElement('span'); play.className = 'card__play'; card.appendChild(play);
    cw.appendChild(card);
    const ob = document.createElement('button'); ob.className = 'btn btn--sm btn--fill'; ob.style.cssText = 'width:100%;margin-top:12px';
    ob.textContent = 'Remake this · $' + C.prices.tiers[0]; ob.onclick = () => openOrder({product: 'Video · ' + v.title});
    cw.appendChild(ob);
    stage.appendChild(cw);
    const tw = document.createElement('div'); tw.className = 'story__item is-text'; tw.dataset.k = k; tw.dataset.side = other;
    const niche = s.title.split(' and ')[0];
    tw.innerHTML = `<span class="kicker">${esc(s.title)}</span><h3 class="h2" style="font-size:clamp(24px,2.6vw,40px)">${esc(v.title)}</h3><p>${esc(s.text)}</p><a class="tlink" href="#work" data-filter="${esc(niche === 'E-commerce' ? 'E-commerce' : niche)}">See ${esc(niche)} examples <span class="arrow"></span></a>`;
    stage.appendChild(tw);
  });
  $$('.story__nav button', el).forEach(b => b.onclick = () => {
    const k = +b.dataset.k, top = scrollY + el.getBoundingClientRect().top, dist = el.offsetHeight - innerHeight;
    scrollToY(top + (k + .5) / N * dist);
  });
}

views.home = {
  mount(view){
    if (!homeBuilt){
      homeBuilt = true;
      const wrap = document.createElement('div');
      wrap.innerHTML = [...C.niches, 'Reels', 'Ads'].concat([...C.niches, 'Reels', 'Ads']).map(w => `<span>${esc(w)}</span>`).join('');
      $('#marquee').append(...wrap.children);
      buildStory();
      const g = $('#home-grid'); C.videos.slice(0, 8).forEach(v => { const c = window.EVYXCard(v); c.addEventListener('click', () => openPreview(v)); g.appendChild(c); });
      robots.hero = window.EVYXRobot.create($('#heroRobot'), {range: 26});
      robots.story = window.EVYXRobot.create($('#storyRobot'), {follow: false, wobble: 5});
    }
    const hero = $('#hero'), hw = $('#heroWord'), hm = $('#heroMirror');
    function layout(){
      const fs = fitWord(hw, .94); fitWord(hm, .94);
      const top = Math.max(hero.clientHeight * .12, 100);
      hw.style.top = top + 'px';
      hm.style.top = (top + hw.offsetHeight - fs * .035) + 'px';
      $$('.story__word').forEach(w => fitWord(w, .9, 24));
    }
    layout();
    const onResize = () => layout();
    addEventListener('resize', onResize);

    /* story: one stage per slice of scroll, the robot looks at the sample */
    const story = $('#story'), N = C.stages.length;
    let curK = -1;
    function setStage(k){
      if (k === curK) return; curK = k; story.dataset.k = k;
      robots.story.setManual(C.stages[k].side === 'left' ? -22 : 22);
    }
    setStage(0);
    ST.create({trigger: story, start: 'top top', end: 'bottom bottom', onUpdate: self => setStage(clamp(Math.floor(self.progress * N * .999), 0, N - 1))});

    /* gentle parallax on the hero */
    ST.create({trigger: hero, start: 'top top', end: 'bottom top', scrub: true, onUpdate: self => {
      hero.style.setProperty('--py', (self.progress * 90) + 'px');
      $('#heroRobot').style.setProperty('--ry', (self.progress * -50) + 'px');
    }});

    revealCards($('#home-grid'));
    revealBlocks(view);
    return () => { removeEventListener('resize', onResize); hero.style.removeProperty('--py'); };
  }
};

/* ----- WORK ----- */
views.work = {
  mount(view){
    const grid = $('#work-grid');
    if (!grid.children.length){
      C.videos.forEach(v => { const c = window.EVYXCard(v); c.addEventListener('click', () => openPreview(v)); grid.appendChild(c); });
      const chips = $('#chips');
      ['All', ...C.niches].forEach((c, i) => {
        const b = document.createElement('button'); b.className = 'chip'; b.type = 'button'; b.textContent = c; b.setAttribute('aria-pressed', i === 0);
        b.onclick = () => applyFilter(c);
        chips.appendChild(b);
      });
      const sel = $('#c-niche'); sel.innerHTML = C.niches.map(n => `<option>${esc(n)}</option>`).join('');
      const tiers = [['Up to 8 seconds, one scene', C.prices.tiers[0]], ['Up to 15 seconds, two scenes', C.prices.tiers[1]], ['15 seconds, character and product', C.prices.tiers[2]]];
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
    if (window.EVYX_filter){ const f = window.EVYX_filter; window.EVYX_filter = null; applyFilter(C.niches.includes(f) ? f : 'All'); }
    gsap.from($$('.page > .page__head > *', view), {y: 28, opacity: 0, stagger: .09, duration: .8, ease: 'power3.out', delay: .1, clearProps: 'transform'});
    revealCards(grid); revealBlocks(view);
  }
};

/* ----- SERVICES ----- */
views.services = {
  mount(view){
    const t = $('#tariffs');
    if (!t.children.length){
      const data = [['Single scene', 'Up to 8 seconds, one scene', ['Any reference you send', 'Your product and brand', 'Vertical 9:16', 'One round of fixes']],
        ['Two scenes', 'Up to 15 seconds, two scenes', ['Everything in Single scene', 'Two scenes, one story', 'Sound and captions', 'Delivery in 1–2 days']],
        ['Character & product', '15 seconds, character and product', ['Everything in Two scenes', 'A consistent character', 'Product close-ups', 'Priority queue']]];
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
function loader(){
  return new Promise(res => {
    if (reduce){ res(); return; }
    lenis && lenis.stop();
    const L = document.createElement('div');
    L.style.cssText = 'position:fixed;inset:0;z-index:200;background:#070605;display:grid;place-items:center';
    L.innerHTML = `<div style="text-align:center"><div style="font:600 clamp(34px,6vw,64px)/1 Unbounded,sans-serif;letter-spacing:.24em;position:relative;color:rgba(236,217,173,.18)">EVYX<span class="lf" style="position:absolute;left:0;top:0;overflow:hidden;width:0;white-space:nowrap;background:linear-gradient(115deg,#8b6d3c,#d0ad70 40%,#f2e3bf 55%,#cfa966 70%,#8b6d3c);-webkit-background-clip:text;background-clip:text;color:transparent">EVYX</span></div></div>`;
    document.body.appendChild(L);
    const lf = $('.lf', L), o = {v: 0};
    const ready = Promise.all([document.fonts && document.fonts.ready, window.EVYXRobot.load()]).catch(() => {});
    let done = false, minDone = false;
    const finish = () => {
      if (!(done && minDone)) return;
      gsap.to(L, {opacity: 0, duration: .7, ease: 'power2.inOut', onComplete: () => { L.remove(); lenis && lenis.start(); res(); }});
    };
    ready.then(() => { done = true; finish(); });
    setTimeout(() => { done = true; finish(); }, 5000);
    gsap.to(o, {v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { lf.style.width = o.v + '%'; }, onComplete: () => { minDone = true; finish(); }});
  });
}

loader().then(() => {
  go(routeFromHash(), true);
  if (!reduce){
    gsap.from('.hdr__in > *', {opacity: 0, y: -16, stagger: .06, duration: .9, ease: 'power3.out'});
    if (current === 'home'){
      const hero = $('#hero');
      gsap.fromTo($('#heroWord'), {opacity: 0, '--wy': '40px'}, {opacity: 1, '--wy': '0px', duration: 1.6, ease: 'power3.out'});
      gsap.fromTo($('#heroMirror'), {opacity: 0}, {opacity: .2, duration: 1.8, delay: .3});
      gsap.fromTo($('#heroRobot'), {opacity: 0}, {opacity: 1, duration: 1.4, delay: .15, ease: 'power2.out'});
      gsap.from(['.hero__card', '.hero__stack'], {opacity: 0, y: 24, duration: 1, stagger: .12, delay: .7, ease: 'power3.out'});
      gsap.from('.hero__cta', {opacity: 0, duration: 1, delay: 1, ease: 'power3.out'});
    }
  }
});
})();
