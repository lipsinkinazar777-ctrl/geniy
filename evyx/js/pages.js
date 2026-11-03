(function(){
const C=window.EVYX, gsap=window.gsap, ST=window.ScrollTrigger, U=window.EVYXUtil, $=U.$, $$=U.$$;
const page=document.body.dataset.page, tg=C.contact.telegram;
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const mobile=()=>innerWidth<900;

$$("[data-from]").forEach(e=>e.textContent=C.prices.recreateFrom);
$$("[data-to]").forEach(e=>e.textContent=C.prices.recreateTo);
$$("[data-course]").forEach(e=>e.textContent=C.prices.course);
$$("#includes,.includes").forEach(ul=>ul.innerHTML=C.courseIncludes.map(i=>`<li>${i}</li>`).join(""));

/* ---------- modal (shared) ---------- */
function openModal(v,i){
  let m=$(".modal");
  if(!m){
    m=document.createElement("div");m.className="modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");
    m.innerHTML=`<div class="box"><button class="x" aria-label="Close">CLOSE</button><div id="mslot"></div><div class="cap"><span class="small" id="mcap"></span><a class="btn sm fill" id="mbtn" target="_blank" rel="noopener">Order this video</a></div></div>`;
    document.body.appendChild(m);
    const close=()=>{m.classList.remove("open");window.EVYXLenis&&window.EVYXLenis.start();const vv=$("video",m);vv&&vv.pause()};
    m.addEventListener("click",e=>{if(e.target===m||e.target.classList.contains("x"))close()});
    addEventListener("keydown",e=>{if(e.key==="Escape")close()});
  }
  const slot=$("#mslot",m);slot.innerHTML="";
  const t=window.EVYXTile(v,i,{static:true,autoplay:true});t.removeAttribute('data-cursor');
  const vd=$("video",t);if(vd){vd.controls=true;vd.muted=false;vd.play().catch(()=>{})}
  slot.appendChild(t);
  $("#mcap",m).textContent=v.title+" · "+v.cat;
  $("#mbtn",m).href=`https://t.me/${tg}?text=${encodeURIComponent("Hi EVYX, I want a video like: "+v.title)}`;
  m.classList.add("open");window.EVYXLenis&&window.EVYXLenis.stop();$(".x",m).focus();
}

/* ======================= HOME ======================= */
if(page==="home"){
  /* cards */
  const track=$("#track");
  C.videos.forEach((v,i)=>{const t=window.EVYXTile(v,i);t.addEventListener("click",()=>openModal(v,i));track.appendChild(t)});

  /* marquee */
  const words=["Product films","Fashion","Real estate","Beauty","Hospitality","Cinematic","Ad creatives","Reels"];
  const mq=$(".marq .tr");mq.innerHTML=[...words,...words].map(w=>`<span>${w}</span>`).join("");

  /* services pinned */
  const items=$$(".svc-item"), bar=$(".svc-prog i"), cnt=$(".svc-prog em");
  if(!mobile()){
    gsap.set(items,{autoAlpha:0});gsap.set(items[0],{autoAlpha:1});
    const tl=gsap.timeline({scrollTrigger:{trigger:".svc",start:"top top",end:"+=260%",pin:true,scrub:.6,anticipatePin:1,
      onUpdate:s=>{bar.style.transform=`scaleX(${s.progress})`;cnt.textContent=Math.min(items.length,1+Math.floor(s.progress*items.length*.999))+" / "+items.length}}});
    items.forEach((it,i)=>{
      const ch=$$(".sv",it);
      if(i>0)tl.fromTo(it,{autoAlpha:0},{autoAlpha:1,duration:.01},">");
      if(i>0)tl.fromTo(ch,{y:70,opacity:0},{y:0,opacity:1,duration:.5,stagger:.08,ease:"power3.out"},"<");
      tl.to({},{duration:.7});
      if(i<items.length-1)tl.to(ch,{y:-70,opacity:0,duration:.4,stagger:.04,ease:"power2.in"}).set(it,{autoAlpha:0});
    });
  }else{
    items.forEach(it=>gsap.set(it,{position:"relative",autoAlpha:1,marginBottom:60}));
    $(".svc").style.height="auto";$(".svc-stage").style.height="auto";$(".svc-prog").style.display="none";$(".svc").style.padding="90px 0";
  }

  /* showcase horizontal */
  const sh=$(".show");
  const dist=()=>track.scrollWidth-innerWidth+40;
  gsap.to(track,{x:()=>-dist(),ease:"none",scrollTrigger:{trigger:sh,start:"top top",end:()=>"+="+dist(),pin:true,scrub:.7,invalidateOnRefresh:true,anticipatePin:1,
    onUpdate:s=>{$("#showbar").style.transform=`scaleX(${s.progress})`}}});

  /* process beam */
  const steps=$$(".step"), beam=$(".beam");
  gsap.fromTo(beam,{scaleY:0},{scaleY:1,ease:"none",transformOrigin:"top",scrollTrigger:{trigger:".steps",start:"top 60%",end:"bottom 60%",scrub:.4}});
  steps.forEach(s=>ST.create({trigger:s,start:"top 62%",onEnter:()=>s.classList.add("on"),onLeaveBack:()=>s.classList.remove("on")}));

  /* price counter */
  const cn={v:0},num=$("#pnum");
  ST.create({trigger:".pricing",start:"top 60%",once:true,onEnter:()=>gsap.to(cn,{v:C.prices.course,duration:1.8,ease:"power3.out",onUpdate:()=>num.textContent=Math.round(cn.v)})});

  /* faq */
  const fq=$("#faqlist");
  C.faq.forEach(([q,a],i)=>{
    const d=document.createElement("div");d.className="q";
    d.innerHTML=`<button aria-expanded="false"><span>${q}</span><i></i></button><div class="a"><p>${a}</p></div>`;
    const btn=$("button",d),pa=$(".a",d);
    btn.addEventListener("click",()=>{
      const open=d.classList.toggle("open");btn.setAttribute("aria-expanded",open);
      gsap.to(pa,{height:open?"auto":0,duration:.5,ease:"power3.inOut",onComplete:()=>ST.refresh()});
    });
    fq.appendChild(d);
  });

  /* pay methods row */
  const ms=C.pay.methods.filter(m=>(m.url||m.address)&&!/PASTE_/i.test(m.url||m.address));
  const names=(ms.length?ms:C.pay.methods).map(m=>m.label).join(" · ");
  $("#paynames").textContent=names;

  /* side nav */
  const sn=$("#sidenav");
  $$("[data-nav]").forEach(sec=>{
    const a=document.createElement("a");a.href="#"+sec.id;a.setAttribute("aria-label",sec.dataset.nav);sn.appendChild(a);
    ST.create({trigger:sec,start:"top 50%",end:"bottom 50%",onToggle:s=>a.classList.toggle("on",s.isActive)});
    a.addEventListener("click",e=>{e.preventDefault();window.EVYXLenis?window.EVYXLenis.scrollTo(sec):sec.scrollIntoView()});
  });

  /* hero parallax out */
  gsap.to(".hero-copy",{y:-120,opacity:.0,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom 30%",scrub:true}});

  window.EVYXBoot(()=>{
    const h=$("#h1");
    window.EVYXReveal(h,.05);
    gsap.fromTo(".hero [data-i]",{opacity:0,y:30},{opacity:1,y:0,duration:1,ease:"power3.out",stagger:.12,delay:.5});
    $$(".callout").forEach((c,i)=>{
      gsap.fromTo(c,{opacity:0},{opacity:1,duration:.8,delay:1+i*.25});
      gsap.fromTo(c,{"--l":"0px"},{"--l":c.dataset.l||"120px",duration:1.2,delay:1+i*.25,ease:"power3.out"});
    });
    gsap.from("#sidenav a",{scale:0,stagger:.08,delay:1.3,duration:.5});
  });
}

/* ======================= WORK ======================= */
if(page==="work"){
  const grid=$("#grid");
  C.videos.forEach((v,i)=>{const t=window.EVYXTile(v,i);t.addEventListener("click",()=>openModal(v,i));grid.appendChild(t)});
  const cats=["All",...new Set(C.videos.map(v=>v.cat))],chips=$("#chips");
  cats.forEach((c,i)=>{const b=document.createElement("button");b.className="chip";b.textContent=c;b.setAttribute("aria-pressed",i===0);
    b.onclick=()=>{$$(".chip",chips).forEach(x=>x.setAttribute("aria-pressed",x===b));
      const cards=$$(".card",grid);
      gsap.to(cards,{opacity:0,scale:.96,duration:.25,onComplete:()=>{cards.forEach(t=>t.classList.toggle("hide",c!=="All"&&t.dataset.cat!==c));gsap.to(cards,{opacity:1,scale:1,duration:.5,stagger:.04});ST.refresh()}})};
    chips.appendChild(b)});
  gsap.from(".card",{opacity:0,y:60,duration:1,stagger:.06,ease:"power3.out",delay:.3});
  window.EVYXBoot();
}

/* ======================= SERVICES ======================= */
if(page==="services"){
  const f=$("#brief");
  f.addEventListener("submit",e=>{e.preventDefault();
    const d=Object.fromEntries(new FormData(f));
    const msg=`EVYX order\nType: ${d.kind}\nReference: ${d.ref}\nGoal: ${d.goal||"-"}\nContact: ${d.contact}`;
    U.copy(msg);window.open(`https://t.me/${tg}?text=${encodeURIComponent(msg)}`,"_blank","noopener");});
  gsap.from(".list li",{opacity:0,x:-30,duration:.8,stagger:.08,ease:"power3.out",scrollTrigger:{trigger:".list",start:"top 85%"}});
  window.EVYXBoot();
}

/* ======================= ACADEMY ======================= */
if(page==="academy"){
  const list=$("#tablist"),panels=$("#panels");
  C.tutorials.forEach((t,n)=>{
    const vi=Math.max(0,C.videos.findIndex(v=>v.id===t.id)),v=C.videos[vi];
    const b=document.createElement("button");b.className="tab";b.setAttribute("role","tab");b.id="tab-"+t.id;b.setAttribute("aria-selected",n===0);
    b.innerHTML=`<span>${t.title}</span><small>${t.tag}</small>`;list.appendChild(b);
    const p=document.createElement("div");p.className="panel"+(n===0?" on":"");p.id="p-"+t.id;p.setAttribute("role","tabpanel");
    const left=document.createElement("div");left.appendChild(window.EVYXTile(v,vi,{static:true}));
    const right=document.createElement("div");
    right.innerHTML=`<h3 class="h3" style="margin-bottom:8px">How to make this video free</h3><p class="small" style="margin-bottom:14px">Four steps. No paid subscription.</p><ol>${t.free.map(s=>`<li>${s}</li>`).join("")}</ol>
      <div class="lock"><div><b>INSIDE THE PACK</b><p>${t.locked}</p></div><a class="btn sm fill" href="pay.html">Get the pack · $${C.prices.course}</a></div>`;
    p.append(left,right);panels.appendChild(p);
    b.onclick=()=>{$$(".tab",list).forEach(x=>x.setAttribute("aria-selected",x===b));$$(".panel",panels).forEach(x=>x.classList.toggle("on",x===p));
      gsap.fromTo(p.querySelectorAll("li"),{opacity:0,x:30},{opacity:1,x:0,duration:.6,stagger:.1,ease:"power3.out"});ST.refresh()};
  });
  gsap.from("#tablist .tab",{opacity:0,x:-30,stagger:.08,duration:.8,delay:.4});
  const cn={v:0};ST.create({trigger:"#pnum",start:"top 85%",once:true,onEnter:()=>gsap.to(cn,{v:C.prices.course,duration:1.6,ease:"power3.out",onUpdate:()=>$("#pnum").textContent=Math.round(cn.v)})});
  window.EVYXBoot();
}

/* ======================= PAY ======================= */
if(page==="pay"){
  const ok=m=>(m.url||m.address)&&!/PASTE_/i.test(m.url||m.address);
  const ms=C.pay.methods.filter(ok),box=$("#methods"),out=$("#out");
  const order="EVYX-"+Math.random().toString(36).slice(2,8).toUpperCase();
  $("#order").textContent=order;
  function qr(text){
    const q=qrcode(0,"M");q.addData(text);q.make();const n=q.getModuleCount();let d="";
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+=`M${c} ${r}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><path d="${d}" fill="#000"/></svg>`;
  }
  if(!ms.length){
    box.innerHTML="";
    const ask=`https://t.me/${tg}?text=${encodeURIComponent("Order "+order+": I want the EVYX pack ($"+C.prices.course+"). Please send payment details.")}`;
    out.innerHTML=`<div class="pay-out"><b class="h3">Pay by card or crypto</b><p class="small" style="margin:12px 0 22px">Tap the button and we will send you a payment link or wallet address within minutes. Access is sent as soon as the payment is confirmed.</p><a class="btn fill" href="${ask}" target="_blank" rel="noopener">Request payment details <span class="ar"></span></a></div>`;
  }else{
    const show=(m,anim=true)=>{
      $$(".method",box).forEach(b=>b.setAttribute("aria-pressed",b.dataset.id===m.id));
      const help=`https://t.me/${tg}?text=${encodeURIComponent(`Order ${order}: paid for the EVYX pack via ${m.label}. TX / receipt: `)}`;
      out.innerHTML = m.type==="link"
        ? `<div class="pay-out"><p class="small">${m.note||""}</p><br><a class="btn fill" href="${m.url}" target="_blank" rel="noopener">Pay $${C.prices.course} <span class="ar"></span></a></div>`
        : `<div class="pay-out"><div class="qr">${qr(m.address)}</div><p class="small">${m.note||""}</p>
           <code id="addr">${m.address}</code>
           <div class="row"><button class="btn sm" id="cp">Copy address</button><a class="btn sm fill" href="${help}" target="_blank" rel="noopener">I paid</a></div>
           <p class="small" style="margin-top:18px">After sending, tap <b>I paid</b> and paste the transaction hash. Access arrives within a few hours.</p></div>`;
      const cp=$("#cp");cp&&cp.addEventListener("click",()=>U.copy(m.address));
      anim&&gsap.from(out.firstElementChild,{opacity:0,y:24,duration:.6,ease:"power3.out"});
    };
    ms.forEach(m=>{const b=document.createElement("button");b.className="method";b.dataset.id=m.id;b.innerHTML=`<b>${m.label}</b><span class="small">${m.sub||""}</span>`;b.onclick=()=>show(m);box.appendChild(b)});
    show(ms[0],false);
  }
  gsap.from(".method,.sum",{opacity:0,y:40,duration:.9,stagger:.1,ease:"power3.out",delay:.4});
  window.EVYXBoot();
}
})();
