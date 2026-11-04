(function(){
const C=window.EVYX, gsap=window.gsap, ST=window.ScrollTrigger;
gsap.registerPlugin(ST);
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const tg=C.contact.telegram;
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const fine=matchMedia('(hover:hover)').matches;
const vid=id=>C.videos.find(v=>v.id===id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const tgLink=t=>`https://t.me/${tg}?text=${encodeURIComponent(t)}`;
const store={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

/* ---------------- smooth scroll ---------------- */
let lenis=null;
if(!reduce&&window.Lenis){
  lenis=new Lenis({lerp:.085,smoothWheel:true});
  lenis.on('scroll',ST.update);
  gsap.ticker.add(t=>lenis.raf(t*1000));
  gsap.ticker.lagSmoothing(0);
}
if(history.scrollRestoration)history.scrollRestoration='manual';
const toTop=()=>{lenis?lenis.scrollTo(0,{immediate:true,force:true}):scrollTo(0,0)};

/* ---------------- shell ---------------- */
const NAV=[["home","Home"],["work","Work Showcase"],["services","Services (EU Business)"],["academy","Academy"]];
document.body.insertAdjacentHTML("afterbegin",
`<header class="hdr"><div class="wrap">
  <a class="logo" href="#home" aria-label="EVYX home">EV<b>Y</b>X</a>
  <nav class="nav" id="nav">${NAV.map(n=>`<a href="#${n[0]}" data-r="${n[0]}">${n[1]}</a>`).join("")}</nav>
  <button class="hlink hdr-cta" data-order>Order · $${C.prices.tiers[0]}</button>
  <button class="burger" aria-label="Menu" aria-expanded="false"><i></i><i></i></button>
</div></header>`);
$("#yr").textContent=new Date().getFullYear();
$("#contacts").innerHTML=`<li><a href="https://t.me/${tg}" target="_blank" rel="noopener">Telegram</a></li><li><a href="mailto:${C.contact.email}">${C.contact.email}</a></li><li><a href="https://instagram.com/${C.contact.instagram}" target="_blank" rel="noopener">Instagram</a></li>`;
$("#quote-tg").href=tgLink("Hi EVYX, I want a quote for business content in Europe.");
$$("[data-course]").forEach(e=>e.textContent=C.prices.course);
$$(".includes").forEach(ul=>ul.innerHTML=C.courseIncludes.map(i=>`<li style="padding-left:26px;position:relative;color:#d6cfba"><span style="position:absolute;left:0;top:.5em;width:7px;height:7px;background:var(--gold-hi);transform:rotate(45deg)"></span>${i}</li>`).join(""));
const burger=$(".burger"),nav=$("#nav");
burger.addEventListener("click",()=>{const o=nav.classList.toggle("open");burger.setAttribute("aria-expanded",o)});

function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("on"),2200)}
function copy(t){const ok=()=>toast("Copied");(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(ok,()=>{const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();try{document.execCommand("copy")}catch(e){}a.remove();ok()})}

/* cursor + magnetic */
if(fine&&!reduce){
  const cur=$(".cur");let x=innerWidth/2,y=innerHeight/2,tx=x,ty=y;
  addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY});
  gsap.ticker.add(()=>{x+=(tx-x)*.2;y+=(ty-y)*.2;cur.style.left=x+'px';cur.style.top=y+'px'});
  document.addEventListener('pointerover',e=>{
    const p=e.target.closest('.card'),l=e.target.closest('a,button,input,select,textarea');
    cur.classList.toggle('big',!!p);cur.textContent=p?'VIEW':'';cur.classList.toggle('link',!p&&!!l);
  });
  document.addEventListener('pointermove',e=>{
    const b=e.target.closest&&e.target.closest('.btn');if(!b)return;
    const r=b.getBoundingClientRect();gsap.to(b,{x:(e.clientX-r.left-r.width/2)*.2,y:(e.clientY-r.top-r.height/2)*.3,duration:.4,ease:'power3.out',overwrite:'auto'});
  });
  document.addEventListener('pointerout',e=>{const b=e.target.closest&&e.target.closest('.btn');if(b)gsap.to(b,{x:0,y:0,duration:.6,ease:'elastic.out(1,.5)'})});
}

/* split text */
function split(el){
  if(el._s)return el._s;
  const walk=n=>{[...n.childNodes].forEach(c=>{
    if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(w=>{
      if(!w)return;if(/^\s+$/.test(w)){f.appendChild(document.createTextNode(' '));return}
      const o=document.createElement('span');o.className='w';const i=document.createElement('span');i.textContent=w;o.appendChild(i);f.appendChild(o)});c.replaceWith(f)}
    else if(c.nodeType===1&&c.tagName!=='BR')walk(c)})};
  walk(el);el.classList.add('split');return el._s=$$('.w>span',el);
}
function reveal(el,delay=0){const sp=split(el);reduce?gsap.set(sp,{y:0}):gsap.to(sp,{y:0,duration:1.1,ease:'power4.out',stagger:.05,delay})}
function armView(view){
  $$('[data-split]',view).forEach(el=>{split(el);ST.create({trigger:el,start:'top 90%',once:true,onEnter:()=>reveal(el)})});
}

/* =================== MODAL =================== */
const modal=$("#modal"),mbody=$("#mbody"),mbox=$("#mbox");
function openModal(wide){mbox.classList.toggle("wide",!!wide);modal.classList.add("open");lenis&&lenis.stop();gsap.fromTo(mbox,{y:30,opacity:0},{y:0,opacity:1,duration:.5,ease:'power3.out'})}
function closeModal(){modal.classList.remove("open");lenis&&lenis.start();mbody.innerHTML=""}
$("#mclose").addEventListener("click",closeModal);
modal.addEventListener("click",e=>{if(e.target===modal)closeModal()});
addEventListener("keydown",e=>{if(e.key==="Escape"&&modal.classList.contains("open"))closeModal()});

function openPreview(v){
  const i=C.videos.indexOf(v);
  mbody.innerHTML=`<div class="preview"><div id="pv"></div><div><span class="kick">${esc(v.cat)}</span><h3 class="h2" style="font-size:clamp(24px,3vw,40px);margin:16px 0 10px">${esc(v.title)}</h3><p class="mute" style="margin-bottom:6px">Duration ${v.len}</p><p style="margin-bottom:26px;color:#d0c9b4">We rebuild this kind of video with your product and brand, vertical, no watermark, in one or two days.</p><div class="num gtext" style="font:600 56px/1 var(--disp);letter-spacing:-.05em;margin-bottom:24px">from $${C.prices.tiers[0]}</div><button class="btn fill" id="pv-order">Remake this video <span class="ar"></span></button></div></div>`;
  const t=window.EVYXTile(v,i,{static:true,autoplay:true});t.classList.remove('pop');t.style.cursor='default';
  const vd=$("video",t);if(vd){vd.controls=true;vd.muted=false;vd.play().catch(()=>{})}
  $("#pv").appendChild(t);
  $("#pv-order").onclick=()=>openOrder({product:"Video remake · "+v.title,tier:0});
  openModal(true);
}

/* =================== CHECKOUT COMPONENT =================== */
const isReal=a=>a&&!/PASTE_/i.test(a);
function qrSvg(text){
  const q=qrcode(0,"M");q.addData(text);q.make();const n=q.getModuleCount();let d="";
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+=`M${c} ${r}h1v1h-1z`;
  return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><path d="${d}" fill="#000"/></svg>`;
}
function renderCheckout(host,opts){
  const st={step:opts.brief?1:2,net:C.pay.networks[0],amount:opts.amount,product:opts.product,brief:opts.brief||null,contact:opts.contact||"",tier:opts.tier||0};
  const total=opts.brief?3:2,off=opts.brief?0:1;
  const stepper=()=>`<div class="stepper">${Array.from({length:total},(_,i)=>`<i class="${st.step-off>=i+1?'on':''}"></i>`).join("")}</div>`;
  function draw(){
    if(st.step===1){
      host.innerHTML=`${stepper()}<span class="kick">Step 1 · Your video</span>
      <form id="ck-brief" style="margin-top:22px"><div class="field"><span>Price</span><div class="seg" id="ck-tier">${C.prices.tiers.map((p,i)=>`<button type="button" data-i="${i}" aria-pressed="${i===st.tier}">$${p}</button>`).join("")}</div></div>
      <div class="field"><label for="ck-ref">Reference link</label><input id="ck-ref" required placeholder="https://" value="${esc(st.brief&&st.brief.ref||"")}"></div>
      <div class="field"><label for="ck-note">What should change</label><input id="ck-note" placeholder="Your product, colours, text" value="${esc(st.brief&&st.brief.note||"")}"></div>
      <div class="field"><label for="ck-contact">Your Telegram or email</label><input id="ck-contact" required value="${esc(st.contact)}"></div>
      <button class="btn fill" type="submit">Continue to payment <span class="ar"></span></button></form>`;
      $$("#ck-tier button",host).forEach(b=>b.onclick=()=>{st.tier=+b.dataset.i;st.amount=C.prices.tiers[st.tier];$$("#ck-tier button",host).forEach(x=>x.setAttribute("aria-pressed",x===b))});
      $("#ck-brief",host).onsubmit=e=>{e.preventDefault();st.brief={ref:$("#ck-ref",host).value.trim(),note:$("#ck-note",host).value.trim()};st.contact=$("#ck-contact",host).value.trim();st.step=2;draw()};
    }
    else if(st.step===2){
      const n=st.net,ok=isReal(n.address);
      host.innerHTML=`${stepper()}<span class="kick">Step ${opts.brief?2:1} · Pay in USDT</span>
      <div style="margin:22px 0 6px" class="small">${esc(st.product)}</div><div class="amt gtext" style="margin-bottom:20px">${st.amount} ${n.token}</div>
      <div class="nets">${C.pay.networks.map(x=>`<button class="net" type="button" data-id="${x.id}" aria-pressed="${x.id===n.id}"><b>${x.token}</b>${x.chain}</button>`).join("")}</div>
      ${ok?`<div class="paybox"><div class="qr">${qrSvg(n.address)}</div><div><span class="small">${esc(n.hint||"")}</span><div class="addr" id="ck-addr">${esc(n.address)}</div><button class="btn sm" type="button" id="ck-copy">Copy address</button></div></div>
      <p class="small" style="margin-bottom:22px">Send exactly <b class="gold">${st.amount} ${n.token}</b> on the <b class="gold">${n.chain}</b> network. A different network means lost funds.</p>
      <form id="ck-confirm"><div class="field"><label for="ck-tx">Transaction hash</label><input id="ck-tx" required minlength="16" placeholder="Paste the TX hash after sending"></div>
      ${st.contact?"":`<div class="field"><label for="ck-c2">Your Telegram or email</label><input id="ck-c2" required></div>`}
      <button class="btn fill" type="submit">Confirm payment <span class="ar"></span></button></form>`
      :`<div class="warn">This wallet is not connected yet. Message us and we will send the address for this network right away.</div><a class="btn fill" target="_blank" rel="noopener" href="${tgLink(`Hi EVYX, I want to pay ${st.amount} ${n.token} (${n.chain}) for: ${st.product}. Please send the wallet address.`)}">Request wallet address <span class="ar"></span></a>`}`;
      $$(".net",host).forEach(b=>b.onclick=()=>{st.net=C.pay.networks.find(x=>x.id===b.dataset.id);draw()});
      const cp=$("#ck-copy",host);cp&&(cp.onclick=()=>copy(n.address));
      const f=$("#ck-confirm",host);
      f&&(f.onsubmit=e=>{e.preventDefault();
        const tx=$("#ck-tx",host).value.trim();const c2=$("#ck-c2",host);if(c2)st.contact=c2.value.trim();
        const r={id:"EVYX-"+Date.now().toString(36).toUpperCase().slice(-6)+Math.random().toString(36).slice(2,4).toUpperCase(),time:new Date().toISOString().replace("T"," ").slice(0,16)+" UTC",product:st.product,amount:`${st.amount} ${n.token}`,network:n.chain,tx,contact:st.contact,brief:st.brief};
        const all=store.get("evyx-receipts")||[];all.push(r);store.set("evyx-receipts",all);
        st.receipt=r;st.step=3;draw();});
    }
    else{
      const r=st.receipt;
      const text=`EVYX receipt ${r.id}\n${r.product}\nAmount: ${r.amount} (${r.network})\nTX: ${r.tx}\nTime: ${r.time}\nContact: ${r.contact}`+(r.brief?`\nReference: ${r.brief.ref}\nNote: ${r.brief.note||"-"}`:"");
      host.innerHTML=`${stepper()}<span class="kick">Receipt</span>
      <div class="receipt" style="margin-top:20px"><div class="amt gtext">Payment submitted</div>
      <dl><dt>Receipt</dt><dd>${esc(r.id)}</dd><dt>Product</dt><dd>${esc(r.product)}</dd><dt>Amount</dt><dd>${esc(r.amount)} · ${esc(r.network)}</dd><dt>Transaction</dt><dd>${esc(r.tx)}</dd><dt>Time</dt><dd>${esc(r.time)}</dd><dt>Status</dt><dd class="gold">Pending verification</dd></dl>
      <p class="small">We check the transaction on-chain and send your ${r.brief?"order update":"access"} in Telegram. Keep this receipt number.</p></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px"><button class="btn" id="rc-copy">Copy receipt</button><a class="btn fill" target="_blank" rel="noopener" href="${tgLink(text)}">Send to Telegram <span class="ar"></span></a></div>`;
      $("#rc-copy",host).onclick=()=>copy(text);
    }
    gsap.from(host.children,{opacity:0,y:18,duration:.5,stagger:.05,ease:'power3.out'});
  }
  draw();
}
function openOrder(o={}){
  const tier=o.tier||0;
  openModal(false);
  renderCheckout(mbody,{product:o.product||"Video remake",amount:C.prices.tiers[tier],tier,brief:o.brief||{ref:"",note:""},contact:o.contact||""});
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-order]");if(b){e.preventDefault();openOrder({})}
});

/* =================== VIEWS =================== */
const views={};
const mounted={ctx:null,name:null};

/* ----- HOME ----- */
let hudBuilt=false;
const poses=[
  {camX:0,camY:2.3,camZ:9,lookX:.8,lookY:.45,seam:1.5,vortex:1},
  {camX:-1.6,camY:1.7,camZ:6.8,lookX:.5,lookY:.4,seam:-.6,vortex:1},
  {camX:1.3,camY:1.25,camZ:5.4,lookX:-.4,lookY:.7,seam:-2.8,vortex:.9},
  {camX:-.5,camY:3.4,camZ:7.8,lookX:0,lookY:-.2,seam:-5,vortex:.7},
  {camX:0,camY:2.6,camZ:10.5,lookX:0,lookY:.4,seam:-9,vortex:.25}
];
function fcHTML(v,cls,r,mini){
  return `<div class="fc ${mini?'mini':''}" data-id="${v.id}"><div class="fl"></div></div>`;
}
function buildHud(){
  if(hudBuilt)return;hudBuilt=true;
  const hud=$("#hud");
  C.stages.forEach((s,k)=>{
    const right=s.side==="right"; // main card on the right, text on the left
    const st=document.createElement("div");st.className="st"+(right?"":" r");st.dataset.k=k+1;
    st.innerHTML=`<span class="kick">${esc(s.kicker)}</span><h2>${esc(s.title)}</h2><p>${esc(s.text)}</p>`;
    hud.appendChild(st);
    [["main",s.main],["mini",s.mini]].forEach(([role,id])=>{
      const v=vid(id);if(!v)return;
      const fc=document.createElement("div");fc.className="fc "+role;fc.dataset.k=k+1;fc.dataset.role=role;
      const mainRight=right;
      const onRight=role==="main"?mainRight:!mainRight;
      if(onRight)fc.style.right=`calc(var(--g) + ${role==="main"?"5vw":"2vw"})`;else fc.style.left=`calc(var(--g) + ${role==="main"?"5vw":"2vw"})`;
      fc.dataset.side=onRight?"r":"l";
      if(role==="mini")fc.style.top="30%";
      const fl=document.createElement("div");fl.className="fl";
      const card=window.EVYXTile(v,C.videos.indexOf(v),{static:true});card.setAttribute("role","button");card.tabIndex=0;card.setAttribute("aria-label","Open "+v.title);
      card.addEventListener("click",e=>{if(e.target.closest(".order"))return;openPreview(v)});card.addEventListener("keydown",e=>{if(e.key==="Enter")openPreview(v)});
      fl.appendChild(card);
      if(role==="main"){const ob=document.createElement("button");ob.className="btn sm fill order";ob.textContent="Remake · $"+C.prices.tiers[0];ob.onclick=e=>{e.stopPropagation();openOrder({product:"Video remake · "+v.title})};card.appendChild(ob)}
      fc.appendChild(fl);hud.appendChild(fc);
    });
  });
  const dots=$(".dots",hud);dots.innerHTML=Array.from({length:C.stages.length+1},()=>"<i></i>").join("");
  const css=document.createElement("style");css.textContent=`.fl{animation:flo 6s ease-in-out infinite alternate}.fc.mini .fl{animation-duration:7.5s;animation-direction:alternate-reverse}@keyframes flo{from{transform:translateY(-7px)}to{transform:translateY(7px)}}@media (prefers-reduced-motion:reduce){.fl{animation:none}}`;
  document.head.appendChild(css);
}
views.home={
  mount(view){
    buildHud();
    const S=window.EVYXScene&&window.EVYXScene.S;
    const hud=$("#hud");
    hud.hidden=false;
    window.EVYXScene&&window.EVYXScene.view("home",0.01);
    /* grid of templates */
    const grid=$("#home-grid");
    if(!grid.children.length)C.videos.slice(0,8).forEach(v=>{const t=window.EVYXTile(v,C.videos.indexOf(v));t.addEventListener("click",()=>openPreview(v));grid.appendChild(t)});
    armView(view);
    if(!S)return;

    const tl=gsap.timeline({defaults:{ease:"none"},scrollTrigger:{trigger:"#story",start:"top top",end:"bottom bottom",scrub:.9,
      onUpdate:self=>{const k=Math.min(C.stages.length,Math.floor(self.progress*5.6+.15));$$(".dots i",hud).forEach((d,i)=>d.classList.toggle("on",i===k))}}});
    const sts=$$(".st",hud),fcs=$$(".fc",hud);
    gsap.set(fcs,{yPercent:-50,autoAlpha:0});
    /* hero out */
    tl.to($(".hero-cta",hud),{autoAlpha:0,y:40,duration:.3},.3).to($(".hint",hud),{autoAlpha:0,duration:.2},.1);
    /* camera */
    poses.forEach((p,k)=>{if(k>0)tl.to(S,{...p,duration:.85,ease:"power2.inOut"},k-.4)});
    /* stages */
    C.stages.forEach((s,i)=>{
      const k=i+1,tin=k+.05,tout=k+(k===C.stages.length?.9:.8);
      const st=$(`.st[data-k="${k}"]`,hud);
      tl.fromTo(st,{autoAlpha:0,y:50},{autoAlpha:1,y:0,duration:.35,ease:"power3.out"},tin).to(st,{autoAlpha:0,y:-30,duration:.25,ease:"power2.in"},tout);
      $$(`.fc[data-k="${k}"]`,hud).forEach(fc=>{
        const sgn=fc.dataset.side==="r"?1:-1,mini=fc.dataset.role==="mini";
        tl.fromTo(fc,{autoAlpha:0,x:sgn*(mini?480:640),z:-700,rotationY:-sgn*55,scale:.8},{autoAlpha:1,x:0,z:0,rotationY:-sgn*(mini?14:9),scale:1,duration:.5,ease:"power3.out"},tin+(mini?.12:0))
          .to(fc,{autoAlpha:0,x:sgn*(mini?300:420),z:-500,rotationY:-sgn*40,scale:.85,duration:.3,ease:"power2.in"},tout-(mini?.05:0));
      });
    });
    /* outro */
    tl.to(hud,{autoAlpha:0,duration:.35},5.15).to(S,{op:.3,vortex:0,duration:.6},5.0);
    tl.duration(5.6);
    ST.refresh();
    return()=>{ /* cleanup handled by context */ gsap.set([hud,".hero-cta",".hint"],{clearProps:"all"});sts.forEach(e=>gsap.set(e,{clearProps:"all"}));fcs.forEach(e=>gsap.set(e,{clearProps:"all"}));hud.hidden=true;if(S)S.op=1};
  }
};

/* ----- WORK ----- */
views.work={
  mount(view){
    const grid=$("#work-grid");
    if(!grid.children.length){
      C.videos.forEach(v=>{const t=window.EVYXTile(v,C.videos.indexOf(v));t.addEventListener("click",()=>openPreview(v));grid.appendChild(t)});
      const chips=$("#chips");
      ["All",...C.niches].forEach((c,i)=>{const b=document.createElement("button");b.className="chip";b.textContent=c;b.setAttribute("aria-pressed",i===0);
        b.onclick=()=>{$$(".chip",chips).forEach(x=>x.setAttribute("aria-pressed",x===b));const cards=$$(".card",grid);
          gsap.to(cards,{opacity:0,scale:.96,duration:.22,onComplete:()=>{cards.forEach(t=>t.classList.toggle("hide",c!=="All"&&t.dataset.cat!==c));gsap.to(cards,{opacity:1,scale:1,duration:.5,stagger:.03});ST.refresh()}})};
        chips.appendChild(b)});
      /* calculator */
      const sel=$("#c-niche");sel.innerHTML=C.niches.map(n=>`<option>${n}</option>`).join("");
      const tiers=[["Up to 8 seconds, one scene",15],["Up to 15 seconds, two scenes",18],["15 seconds, character and product",20]];
      let tier=0;const tb=$("#c-tier");
      tb.innerHTML=tiers.map((t,i)=>`<button type="button" data-i="${i}" aria-pressed="${i===0}"><b>$${t[1]}</b><br><span style="font-size:11px">${t[0]}</span></button>`).join("");
      $$("button",tb).forEach(b=>b.onclick=()=>{tier=+b.dataset.i;$$("button",tb).forEach(x=>x.setAttribute("aria-pressed",x===b));gsap.fromTo("#c-price",{y:-14,opacity:0},{y:0,opacity:1,duration:.35});$("#c-price").textContent=tiers[tier][1]});
      $("#calcform").onsubmit=e=>{e.preventDefault();openOrder({product:`Video remake · ${sel.value} · ${tiers[tier][0]}`,tier:tier,contact:$("#c-contact").value.trim(),brief:{ref:$("#c-ref").value.trim().split("\n")[0],note:$("#c-note").value.trim()}})};
    }
    armView(view);
    gsap.from("#work-grid .card",{opacity:0,y:50,duration:.9,stagger:.05,ease:"power3.out",delay:.35});
    gsap.from("#chips .chip",{opacity:0,y:20,duration:.6,stagger:.05,delay:.2});
  }
};

/* ----- SERVICES ----- */
views.services={
  mount(view){
    const t=$("#tariffs");
    if(!t.children.length){
      const data=[["Starter","Up to 8 seconds, one scene",["Any reference you send","Your product and brand","Vertical 9:16","One round of fixes"]],
        ["Standard","Up to 15 seconds, two scenes",["Everything in Starter","Two scenes, one story","Sound and captions","Delivery in 1–2 days"]],
        ["Studio","15 seconds, character and product",["Everything in Standard","A consistent character","Product close-ups","Priority queue"]]];
      data.forEach((d,i)=>{const el=document.createElement("div");el.className="glass tariff"+(i===1?" hot":"");
        el.innerHTML=`<span class="kick">${d[0]}</span><div class="price gtext">$${C.prices.tiers[i]}</div><p class="small" style="margin-top:-8px">${d[1]}</p><ul>${d[2].map(x=>`<li>${x}</li>`).join("")}</ul><button class="btn ${i===1?"fill":""}" data-i="${i}">Order $${C.prices.tiers[i]} <span class="ar"></span></button>`;
        $("button",el).onclick=()=>openOrder({product:"Video remake · "+d[0],tier:i});t.appendChild(el)});
      const fq=$("#faq");
      C.faq.forEach(([q,a])=>{const d=document.createElement("div");d.className="mod";d.innerHTML=`<button aria-expanded="false"><span>${esc(q)}</span><i></i></button><div class="a"><p>${esc(a)}</p></div>`;
        d.querySelector("button").onclick=()=>{const o=d.classList.toggle("open");gsap.to(d.querySelector(".a"),{height:o?"auto":0,duration:.45,ease:"power3.inOut",onComplete:()=>ST.refresh()})};fq.appendChild(d)});
    }
    armView(view);
    gsap.from(".tariff",{opacity:0,y:60,duration:1,stagger:.12,ease:"power3.out",delay:.35});
  }
};

/* ----- ACADEMY ----- */
views.academy={
  mount(view){
    const list=$("#tablist"),panels=$("#tpanels");
    if(!list.children.length){
      C.tutorials.forEach((t,n)=>{
        const v=vid(t.id)||C.videos[0];
        const b=document.createElement("button");b.className="tab";b.setAttribute("role","tab");b.setAttribute("aria-selected",n===0);b.innerHTML=`<span>${esc(t.title)}</span><small>${esc(t.tag)}</small>`;list.appendChild(b);
        const p=document.createElement("div");p.className="tpanel"+(n===0?" on":"");p.setAttribute("role","tabpanel");
        const left=document.createElement("div");const card=window.EVYXTile(v,C.videos.indexOf(v));card.addEventListener("click",()=>openPreview(v));left.appendChild(card);
        const right=document.createElement("div");
        right.innerHTML=`<h3 class="h3" style="margin-bottom:6px">How to make this video free</h3><p class="small" style="margin-bottom:12px">Four steps. No paid subscription.</p><ol>${t.free.map(s=>`<li>${esc(s)}</li>`).join("")}</ol><div class="lock"><div><b>INSIDE THE PROGRAM</b><p>${esc(t.locked)}</p></div><a class="btn sm fill" href="#checkout">Get it · $${C.prices.course}</a></div>`;
        p.append(left,right);panels.appendChild(p);
        b.onclick=()=>{$$(".tab",list).forEach(x=>x.setAttribute("aria-selected",x===b));$$(".tpanel",panels).forEach(x=>x.classList.toggle("on",x===p));gsap.fromTo($$("li",p),{opacity:0,x:30},{opacity:1,x:0,duration:.55,stagger:.09,ease:"power3.out"});ST.refresh()};
      });
      const pr=$("#program");
      C.program.forEach(([q,a],i)=>{const d=document.createElement("div");d.className="mod"+(i===0?" open":"");d.innerHTML=`<button aria-expanded="${i===0}"><span>${esc(q)}</span><i></i></button><div class="a" style="height:${i===0?"auto":0}"><p>${esc(a)}</p></div>`;
        d.querySelector("button").onclick=()=>{const o=d.classList.toggle("open");gsap.to(d.querySelector(".a"),{height:o?"auto":0,duration:.45,ease:"power3.inOut",onComplete:()=>ST.refresh()})};pr.appendChild(d)});
    }
    armView(view);
    gsap.from(".tab",{opacity:0,x:-30,stagger:.08,duration:.7,delay:.35});
  }
};

/* ----- CHECKOUT ----- */
views.checkout={
  mount(view){
    renderCheckout($("#ck-host"),{product:"EVYX Academy · full program",amount:C.prices.course});
    armView(view);
  }
};

/* =================== ROUTER =================== */
const wipe=$(".wipe");
let current=null,busy=false;
function routeFromHash(){const h=(location.hash||"#home").slice(1);return views[h]?h:"home"}
function activate(name){
  if(mounted.ctx){mounted.ctx.revert&&mounted.ctx.revert();if(mounted.cleanup)mounted.cleanup();ST.getAll().forEach(s=>s.kill())}
  $$(".view").forEach(v=>v.classList.remove("on"));
  const view=$("#v-"+name);view.classList.add("on");
  document.title=view.dataset.title||"EVYX";
  $$("#nav a").forEach(a=>{a.toggleAttribute("aria-current",a.dataset.r===name)});
  $("#nav").classList.remove("open");burger.setAttribute("aria-expanded","false");
  toTop();
  window.EVYXScene&&window.EVYXScene.view(name==="home"?"home":"inner",1.2);
  if(name!=="home"){$("#hud").hidden=true;const S=window.EVYXScene&&window.EVYXScene.S;if(S)S.op=S.op}
  let clean=null;
  mounted.ctx=gsap.context(()=>{clean=views[name].mount(view)},view);
  mounted.cleanup=clean;mounted.name=name;current=name;
  requestAnimationFrame(()=>ST.refresh());
}
function go(name,first){
  if(name===current&&!first)return;
  if(first||reduce){activate(name);return}
  if(busy){return}
  busy=true;
  gsap.timeline({onComplete:()=>{busy=false;if(routeFromHash()!==current)go(routeFromHash())}})
    .set(wipe,{y:"101%"}).to(wipe,{y:"0%",duration:.55,ease:"power3.inOut"})
    .add(()=>activate(name))
    .to(wipe,{y:"-101%",duration:.65,ease:"power3.inOut",delay:.1});
}
addEventListener("hashchange",()=>go(routeFromHash()));

/* =================== LOADER + BOOT =================== */
function loader(){
  return new Promise(res=>{
    if(reduce){res();return}
    lenis&&lenis.stop();
    const L=document.createElement("div");
    L.style.cssText="position:fixed;inset:0;z-index:200;background:#030304;display:grid;place-items:center;clip-path:circle(150% at 50% 50%)";
    L.innerHTML=`<svg viewBox="0 0 260 60" style="width:min(260px,60vw);overflow:visible"><defs><clipPath id="lc"><rect class="lr" x="0" y="60" width="260" height="60"/></clipPath></defs>
      <text x="130" y="46" text-anchor="middle" style="font:600 44px Unbounded,sans-serif;letter-spacing:.14em;fill:transparent;stroke:rgba(201,169,107,.5);stroke-width:1">EVYX</text>
      <text x="130" y="46" text-anchor="middle" style="font:600 44px Unbounded,sans-serif;letter-spacing:.14em;fill:#c9a96b" clip-path="url(#lc)">EVYX</text></svg>
      <div class="n" style="position:absolute;bottom:8vh;font:400 12px Unbounded,sans-serif;color:#948d7f;letter-spacing:.2em">0</div>`;
    document.body.appendChild(L);
    const o={v:0},rect=$(".lr",L),num=$(".n",L);
    gsap.timeline({onComplete:()=>{L.remove();lenis&&lenis.start();res()}})
      .to(o,{v:100,duration:1.9,ease:"power2.inOut",onUpdate:()=>{rect.setAttribute("y",60-60*o.v/100);num.textContent=Math.round(o.v)}})
      .to(L,{clipPath:"circle(0% at 50% 50%)",duration:1,ease:"power3.inOut"},"+=.12");
  });
}
loader().then(()=>{
  go(routeFromHash(),true);
  gsap.from(".hdr .wrap",{y:-80,opacity:0,duration:1,ease:"power3.out"});
  if(current==="home"&&!reduce){
    gsap.from(".hero-cta > *",{opacity:0,y:30,duration:1,stagger:.12,delay:.5,ease:"power3.out"});
  }
});
})();
