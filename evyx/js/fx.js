/* Общая оболочка: скролл, шапка, футер, курсор, анимации текста, загрузчик */
(function(){
const C = window.EVYX, gsap = window.gsap, ST = window.ScrollTrigger;
gsap.registerPlugin(ST);
const $ = (s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const page = document.body.dataset.page, tg = C.contact.telegram;
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const fine = matchMedia('(hover:hover)').matches;

/* smooth scroll */
let lenis=null;
if(!reduce && window.Lenis){
  lenis = new Lenis({lerp:.085,smoothWheel:true});
  lenis.on('scroll',ST.update);
  gsap.ticker.add(t=>lenis.raf(t*1000));
  gsap.ticker.lagSmoothing(0);
}
window.EVYXLenis = lenis;
if(history.scrollRestoration) history.scrollRestoration='manual';

/* shell */
const links=[["index.html","Home","home"],["work.html","Work","work"],["services.html","Services","services"],["academy.html","Free guides","academy"],["pay.html","Get the pack","pay"]];
document.body.insertAdjacentHTML("afterbegin",
`<div id="scene" aria-hidden="true"></div><div class="guides" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="cur" aria-hidden="true"></div>
<header class="hdr"><div class="wrap">
  <a class="logo" href="index.html" aria-label="EVYX home">EV<b>Y</b>X</a>
  <nav class="nav" id="nav">${links.map(l=>`<a href="${l[0]}"${page===l[2]?' aria-current="page"':''}>${l[1]}</a>`).join("")}</nav>
  <a class="btn sm hdr-cta" href="services.html#order">Order a video</a>
  <button class="burger" aria-label="Menu" aria-expanded="false"><i></i><i></i></button>
</div></header>`);
document.body.insertAdjacentHTML("beforeend",
`<footer class="ftr"><div class="wrap">
  <div class="cols">
    <div><span class="logo">EV<b>Y</b>X</span><p class="small">AI video for brands that want to be remembered.<br>Made in Europe, delivered anywhere.</p></div>
    <div><h4>Pages</h4><ul>${links.map(l=>`<li><a href="${l[0]}">${l[1]}</a></li>`).join("")}</ul></div>
    <div><h4>Contact</h4><ul>
      <li><a href="https://t.me/${tg}" target="_blank" rel="noopener">Telegram</a></li>
      <li><a href="mailto:${C.contact.email}">${C.contact.email}</a></li>
      <li><a href="https://instagram.com/${C.contact.instagram}" target="_blank" rel="noopener">Instagram</a></li></ul></div>
  </div>
  <p class="small">© <span id="yr"></span> EVYX</p>
</div></footer><div class="toast" id="toast" role="status"></div>`);
$("#yr").textContent=new Date().getFullYear();
const hdr=$(".hdr"),burger=$(".burger"),nav=$("#nav");
ST.create({start:60,onUpdate:s=>hdr.classList.toggle("solid",s.scroll()>60)});
burger.addEventListener("click",()=>{const o=nav.classList.toggle("open");burger.setAttribute("aria-expanded",o)});
$$("a[href^='#'],a[href*='.html#']").forEach(a=>a.addEventListener('click',e=>{
  const h=a.getAttribute('href').split('#')[1]; const t=h&&document.getElementById(h);
  if(t&&(a.getAttribute('href').startsWith('#')||a.pathname===location.pathname)){e.preventDefault();lenis?lenis.scrollTo(t,{offset:-40}):t.scrollIntoView();nav.classList.remove('open')}
}));

window.EVYXUtil={
  $,$$,
  toast(t){const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(this._t);this._t=setTimeout(()=>e.classList.remove("on"),2200)},
  copy(t){const ok=()=>this.toast("Copied");(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(ok,()=>{const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();document.execCommand("copy");a.remove();ok()})}
};

/* cursor */
if(fine&&!reduce){
  const cur=$(".cur");let x=innerWidth/2,y=innerHeight/2,tx=x,ty=y;
  addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY});
  gsap.ticker.add(()=>{x+=(tx-x)*.2;y+=(ty-y)*.2;cur.style.left=x+'px';cur.style.top=y+'px'});
  document.addEventListener('pointerover',e=>{
    const p=e.target.closest('[data-cursor="play"]'),l=e.target.closest('a,button,input,select,textarea,summary');
    cur.classList.toggle('big',!!p);cur.textContent=p?'VIEW':'';cur.classList.toggle('link',!p&&!!l);
  });
}

/* magnetic buttons */
if(fine&&!reduce)$$('.btn').forEach(b=>{
  b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();gsap.to(b,{x:(e.clientX-r.left-r.width/2)*.25,y:(e.clientY-r.top-r.height/2)*.35,duration:.4,ease:'power3.out'})});
  b.addEventListener('pointerleave',()=>gsap.to(b,{x:0,y:0,duration:.6,ease:'elastic.out(1,.5)'}));
});

/* split text */
function split(el){
  if(el._s)return el._s;
  const walk=(n)=>{[...n.childNodes].forEach(c=>{
    if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(w=>{
      if(!w)return; if(/^\s+$/.test(w)){f.appendChild(document.createTextNode(' '));return}
      const o=document.createElement('span');o.className='w';const i=document.createElement('span');i.textContent=w;o.appendChild(i);f.appendChild(o)});c.replaceWith(f)}
    else if(c.nodeType===1&&c.tagName!=='BR')walk(c)})};
  walk(el);el.classList.add('split');return el._s=$$('.w>span',el);
}
window.EVYXSplit=split;
function reveal(el,delay=0){
  const sp=split(el);
  if(reduce){gsap.set(sp,{y:0});return}
  gsap.to(sp,{y:0,duration:1.1,ease:'power4.out',stagger:.05,delay});
}
window.EVYXReveal=reveal;
function armReveals(){
  $$('[data-split]').forEach(el=>{
    if(el.hasAttribute('data-hero'))return;
    split(el);
    ST.create({trigger:el,start:'top 88%',once:true,onEnter:()=>reveal(el)});
  });
  $$('[data-up]').forEach(el=>{
    gsap.set(el,{opacity:0,y:40});
    ST.create({trigger:el,start:'top 90%',once:true,onEnter:()=>gsap.to(el,{opacity:1,y:0,duration:1,ease:'power3.out',delay:+(el.dataset.up||0)})});
  });
  $$('[data-stagger]').forEach(box=>{
    const kids=[...box.children];gsap.set(kids,{opacity:0,y:30});
    ST.create({trigger:box,start:'top 85%',once:true,onEnter:()=>gsap.to(kids,{opacity:1,y:0,duration:.9,ease:'power3.out',stagger:.09})});
  });
}

/* loader */
function loader(){
  return new Promise(res=>{
    const seen=sessionStorage.getItem('evyx-seen');
    if(page!=='home'||reduce||seen){res();return}
    sessionStorage.setItem('evyx-seen','1');
    lenis&&lenis.stop();
    const L=document.createElement('div');L.className='loader';
    L.innerHTML=`<svg viewBox="0 0 260 60"><defs><clipPath id="lc"><rect class="lr" x="0" y="60" width="260" height="60"/></clipPath></defs>
      <text class="t" x="130" y="46" text-anchor="middle">EVYX</text>
      <text class="t" x="130" y="46" text-anchor="middle" style="fill:#ffd60a;stroke:none" clip-path="url(#lc)">EVYX</text></svg><div class="num">0</div>`;
    document.body.appendChild(L);
    const o={v:0},rect=$('.lr',L),num=$('.num',L);
    L.style.clipPath='circle(150% at 50% 50%)';
    gsap.timeline({onComplete:()=>{L.remove();lenis&&lenis.start();res()}})
      .to(o,{v:100,duration:2.1,ease:'power2.inOut',onUpdate:()=>{rect.setAttribute('y',60-60*o.v/100);num.textContent=Math.round(o.v)}})
      .to(L,{clipPath:'circle(0% at 50% 50%)',duration:1.1,ease:'power3.inOut'},'+=.15');
  });
}

window.EVYXBoot=function(intro){
  armReveals();
  loader().then(()=>{
    gsap.from(hdr,{y:-90,opacity:0,duration:1,ease:'power3.out'});
    intro&&intro();
    ST.refresh();
  });
};
})();
