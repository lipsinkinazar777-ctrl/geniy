(function(){
const C = window.EVYX;
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const page = document.body.dataset.page;
const tg = C.contact.telegram;

/* ---------- header / footer ---------- */
const links = [["index.html","Home","home"],["work.html","Work","work"],["services.html","Services","services"],["academy.html","Free guides","academy"],["pay.html","Get the pack","pay"]];
document.body.insertAdjacentHTML("afterbegin",
`<header class="hdr"><div class="wrap">
  <a class="logo" href="index.html" aria-label="EVYX home">EVYX</a>
  <button class="burger" aria-label="Menu" aria-expanded="false"><i></i><i></i></button>
  <nav class="nav" id="nav">${links.map(l=>`<a href="${l[0]}"${page===l[2]?' aria-current="page"':''}>${l[1]}</a>`).join("")}
    <a class="btn sm" href="https://t.me/${tg}" target="_blank" rel="noopener">Order a video</a></nav>
</div></header>`);
document.body.insertAdjacentHTML("beforeend",
`<footer class="ftr"><div class="wrap">
  <div class="cols">
    <div><span class="logo gold-text">EVYX</span><p class="small">AI video for brands that want to look expensive.<br>Built in Europe, delivered anywhere.</p></div>
    <div><h4>Pages</h4><ul>${links.map(l=>`<li><a href="${l[0]}">${l[1]}</a></li>`).join("")}</ul></div>
    <div><h4>Talk to us</h4><ul>
      <li><a href="https://t.me/${tg}" target="_blank" rel="noopener">Telegram</a></li>
      <li><a href="mailto:${C.contact.email}">${C.contact.email}</a></li>
      <li><a href="https://instagram.com/${C.contact.instagram}" target="_blank" rel="noopener">Instagram</a></li></ul></div>
  </div>
  <p class="small">© <span id="yr"></span> EVYX. All rights reserved.</p>
</div></footer><div class="toast" id="toast" role="status"></div>`);
$("#yr").textContent = new Date().getFullYear();
const hdr = $(".hdr"), burger = $(".burger"), nav = $("#nav");
const onScroll = ()=>hdr.classList.toggle("solid", scrollY>30);
onScroll(); addEventListener("scroll", onScroll, {passive:true});
burger.addEventListener("click",()=>{const o=nav.classList.toggle("open");burger.setAttribute("aria-expanded",o)});

function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("on"),2200)}
function copy(t){(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast("Copied"),()=>{const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();document.execCommand("copy");a.remove();toast("Copied")})}

/* ---------- tiles ---------- */
const hue = i => [42,38,30,46,34,50,28,44,36,40,32,48][i%12];
function tile(v,i,opts={}){
  const el = document.createElement(opts.bg?"div":"button");
  el.className = "tile"+(opts.bg?" bg":"");
  el.style.setProperty("--h",hue(i)); el.style.setProperty("--x",(20+(i*37)%60)+"%"); el.style.setProperty("--y",(10+(i*23)%40)+"%");
  if(!opts.bg){el.type="button";el.dataset.cat=v.cat;el.setAttribute("aria-label","Open "+v.title)}
  el.innerHTML = `<div class="art"></div>`+
    (v.poster?`<img class="poster" src="${v.poster}" alt="" loading="lazy">`:"")+
    (v.src?`<video muted loop playsinline preload="none" ${opts.autoplay?"autoplay":""} src="${v.src}"></video>`:"")+
    (opts.bg?"":`<span class="len">${v.len}</span><span class="play"></span><div class="meta"><b>${v.title}</b><span>${v.cat}</span></div>`);
  const vid = $("video",el);
  if(vid && !opts.bg){
    el.addEventListener("mouseenter",()=>vid.play().catch(()=>{}));
    el.addEventListener("mouseleave",()=>{vid.pause();vid.currentTime=0});
  }
  return el;
}

/* ---------- home ---------- */
if(page==="home"){
  const bg=$("#herobg");
  for(let c=0;c<5;c++){
    const col=document.createElement("div");col.className="col";
    for(let k=0;k<2;k++)for(let j=0;j<6;j++){const i=c*3+j;col.appendChild(tile(C.videos[(i)%C.videos.length],i+c,{bg:true,autoplay:true}))}
    bg.appendChild(col);
  }
  const w=$(".word"),hero=$(".hero");
  hero.addEventListener("pointermove",e=>{const r=w.getBoundingClientRect();w.style.setProperty("--mx",(e.clientX-r.left)+"px");w.style.setProperty("--my",(e.clientY-r.top)+"px")});
  const reel=$("#reel");C.videos.slice(0,6).forEach((v,i)=>{const t=tile(v,i);t.addEventListener("click",()=>openModal(v,i));reel.appendChild(t)});
  $$("[data-from]").forEach(e=>e.textContent=C.prices.recreateFrom);
  $$("[data-to]").forEach(e=>e.textContent=C.prices.recreateTo);
  $$("[data-course]").forEach(e=>e.textContent=C.prices.course);
}

/* ---------- work ---------- */
function openModal(v,i){
  let m=$(".modal");
  if(!m){m=document.createElement("div");m.className="modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");
    m.innerHTML=`<div class="box"><button class="x" aria-label="Close">Close</button><div id="mslot"></div><div class="cap"><span class="small" id="mcap"></span><a class="btn sm" id="mbtn" target="_blank" rel="noopener">Order this video</a></div></div>`;
    document.body.appendChild(m);
    m.addEventListener("click",e=>{if(e.target===m||e.target.classList.contains("x"))close()});
    addEventListener("keydown",e=>{if(e.key==="Escape")close()});
  }
  const slot=$("#mslot",m);slot.innerHTML="";
  const t=tile(v,i,{autoplay:true});t.style.cursor="default";const vd=$("video",t);if(vd){vd.controls=true;vd.autoplay=true;vd.muted=false}
  slot.appendChild(t);$(".meta",t)&&($(".meta",t).style.pointerEvents="none");
  $("#mcap",m).textContent=v.title+" · "+v.cat;
  $("#mbtn",m).href=`https://t.me/${tg}?text=${encodeURIComponent("Hi EVYX, I want to order a video like: "+v.title)}`;
  m.classList.add("open");document.body.style.overflow="hidden";$(".x",m).focus();
  function close(){m.classList.remove("open");document.body.style.overflow="";const vv=$("video",m);vv&&vv.pause()}
}
if(page==="work"){
  const grid=$("#grid");C.videos.forEach((v,i)=>{const t=tile(v,i);t.addEventListener("click",()=>openModal(v,i));grid.appendChild(t)});
  const cats=["All",...new Set(C.videos.map(v=>v.cat))];
  const chips=$("#chips");
  cats.forEach((c,i)=>{const b=document.createElement("button");b.className="chip";b.textContent=c;b.setAttribute("aria-pressed",i===0);
    b.onclick=()=>{$$(".chip",chips).forEach(x=>x.setAttribute("aria-pressed",x===b));$$(".tile",grid).forEach(t=>t.classList.toggle("hide",c!=="All"&&t.dataset.cat!==c))};chips.appendChild(b)});
}

/* ---------- academy ---------- */
if(page==="academy"){
  const list=$("#tablist"),panels=$("#panels");
  C.tutorials.forEach((t,n)=>{
    const vi=C.videos.findIndex(v=>v.id===t.id), v=C.videos[vi]||C.videos[0];
    const b=document.createElement("button");b.className="tab";b.role="tab";b.id="tab-"+t.id;b.setAttribute("aria-selected",n===0);b.setAttribute("aria-controls","p-"+t.id);
    b.innerHTML=`<span>${t.title}</span><small>${t.tag}</small>`;list.appendChild(b);
    const p=document.createElement("div");p.className="panel"+(n===0?" on":"");p.id="p-"+t.id;p.role="tabpanel";p.setAttribute("aria-labelledby",b.id);
    const left=document.createElement("div");left.appendChild(tile(v,Math.max(vi,0)));
    const right=document.createElement("div");
    right.innerHTML=`<h3 style="margin-bottom:6px">How to make this video free</h3><p class="small" style="margin-bottom:18px">Four steps. No paid subscription.</p><ol>${t.free.map(s=>`<li>${s}</li>`).join("")}</ol>
      <div class="lock"><div><b>Inside the pack</b><p>${t.locked}</p></div><a class="btn sm fill" href="pay.html">Get the pack · $${C.prices.course}</a></div>`;
    p.append(left,right);panels.appendChild(p);
    b.onclick=()=>{$$(".tab",list).forEach(x=>x.setAttribute("aria-selected",x===b));$$(".panel",panels).forEach(x=>x.classList.toggle("on",x===p))};
  });
  $("#includes").innerHTML=C.courseIncludes.map(i=>`<li>${i}</li>`).join("");
  $$("[data-course]").forEach(e=>e.textContent=C.prices.course);
}

/* ---------- services ---------- */
if(page==="services"){
  $$("[data-from]").forEach(e=>e.textContent=C.prices.recreateFrom);
  $$("[data-to]").forEach(e=>e.textContent=C.prices.recreateTo);
  const f=$("#brief");
  f.addEventListener("submit",e=>{e.preventDefault();
    const d=Object.fromEntries(new FormData(f));
    const msg=`EVYX order\nType: ${d.kind}\nReference: ${d.ref}\nGoal: ${d.goal||"-"}\nContact: ${d.contact}`;
    copy(msg);window.open(`https://t.me/${tg}?text=${encodeURIComponent(msg)}`,"_blank","noopener");});
}

/* ---------- pay ---------- */
if(page==="pay"){
  $$("[data-course]").forEach(e=>e.textContent=C.prices.course);
  $("#includes").innerHTML=C.courseIncludes.map(i=>`<li>${i}</li>`).join("");
  const ok = m => (m.url||m.address) && !/PASTE_/i.test(m.url||m.address);
  const ms=C.pay.methods.filter(ok), box=$("#methods"), out=$("#out");
  if(!ms.length){box.innerHTML="";out.innerHTML=`<div class="empty">Payments are not connected yet. Open <b>js/config.js</b> and add a payment link or a wallet address in <b>pay.methods</b>.</div>`;}
  else{
    const show=m=>{
      $$(".method",box).forEach(b=>b.setAttribute("aria-pressed",b.dataset.id===m.id));
      out.innerHTML = m.url
        ? `<div class="addr"><p class="small">${m.note||""}</p><br><a class="btn fill" href="${m.url}" target="_blank" rel="noopener">Pay $${C.prices.course}</a></div>`
        : `<div class="addr"><p class="small">${m.note||""}</p><code id="addr">${m.address}</code><button class="btn sm" id="cp">Copy address</button></div>
           <p class="small" style="margin-top:18px">After sending, message us on <a class="link" href="https://t.me/${tg}?text=${encodeURIComponent("Paid for the EVYX pack via "+m.label+". TX/hash: ")}" target="_blank" rel="noopener">Telegram</a> with the transaction hash. Access is sent within a few hours.</p>`;
      const cp=$("#cp");cp&&cp.addEventListener("click",()=>copy(m.address));
    };
    ms.forEach((m,i)=>{const b=document.createElement("button");b.className="method";b.dataset.id=m.id;b.innerHTML=`<span>${m.label}</span><span class="small">${m.url?"Instant":"Manual check"}</span>`;b.onclick=()=>show(m);box.appendChild(b)});
    show(ms[0]);
  }
}
})();
