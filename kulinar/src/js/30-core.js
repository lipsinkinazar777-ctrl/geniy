/* ===== ЯДРО: утилиты, состояние, роутер, хабы, фото, анимации, поиск ===== */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().replace(/ё/g,'е');
const store={
  get(k,d){try{const v=localStorage.getItem('gk_'+k);return v?JSON.parse(v):d}catch(e){return d}},
  set(k,v){try{localStorage.setItem('gk_'+k,JSON.stringify(v))}catch(e){}}
};
let S={
  fav:store.get('fav',[]),plan:store.get('plan',{}),diary:store.get('diary',{}),
  prof:store.get('prof',{sex:'m',age:30,h:178,w:78,act:1.375,goal:'keep'}),
  shop:store.get('shop',{}),people:store.get('people',2),theme:store.get('theme','dark'),
  learned:store.get('learned',{}),skills:store.get('skills',{}),ph:store.get('ph',{}),
  lessons:store.get('lessons',{}),quiz:store.get('quiz',{}),gear:store.get('gear',{}),groc:store.get('groc',{})
};
const save=k=>store.set(k,S[k]);
const REC={};
const byId=id=>REC[id]||(REC[id]=RECIPES.find(r=>r.id===id));
const ymd=d=>{const z=new Date(d);return z.getFullYear()+'-'+String(z.getMonth()+1).padStart(2,'0')+'-'+String(z.getDate()).padStart(2,'0')};
const addDays=(d,n)=>{const z=new Date(d);z.setDate(z.getDate()+n);return z};
const monday=d=>{const z=new Date(d);z.setHours(12,0,0,0);const w=(z.getDay()+6)%7;return addDays(z,-w)};
const DOW=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const MONTHS=['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const MEALS=[['b','Завтрак','🌅'],['l','Обед','☀️'],['d','Ужин','🌙'],['s','Перекус','🍎']];
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2400)}
function fq(q){if(!q)return'';q=+q;if(q>=100)q=Math.round(q/5)*5;else if(q>=10)q=Math.round(q);else q=Math.round(q*10)/10;return String(q).replace('.',',')}
function ingStr(i,k){return i.q?fq(i.q*k)+' '+i.u:(i.u||'по вкусу')}
const cuBg=cu=>`style="--c1:color-mix(in srgb,${(CUISINES[cu]||CUISINES.wd).c} 55%,#0b0806);--c2:#140e09"`;
const lvlDots=l=>`<span class="lvl">${[1,2,3].map(i=>`<i class="${i<=l?'on':''}"></i>`).join('')}</span>`;
const LVL=['','Просто','Средне','Мастер'];
const fmtT=t=>t>=60?Math.floor(t/60)+' ч'+(t%60?' '+t%60+' м':''):t+' мин';
const REDUCED=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- ИКОНКИ ---------- */
const IC={
 home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
 recipes:'<path d="M12 6c-2-1.5-5-2-8-1.5V18c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5C17 4 14 4.5 12 6z"/><path d="M12 6v13.5"/>',
 school:'<path d="M7 14a4 4 0 0 1-.5-7.9 5 5 0 0 1 9.9-.1A4 4 0 0 1 17 14z"/><path d="M7 14v5h10v-5"/>',
 wiki:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
 health:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
 shop:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
 planner:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
 my:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 dice:'<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.1" fill="currentColor"/><circle cx="15" cy="9" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/><circle cx="9" cy="15" r="1.1" fill="currentColor"/><circle cx="15" cy="15" r="1.1" fill="currentColor"/>'
};
const ico=(k,s=22)=>`<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]||''}</svg>`;

/* ---------- РОУТЕР ---------- */
const NAV=[['','Главная','home'],['recipes','Рецепты','recipes'],['school','Школа','school'],['wiki','Знания','wiki'],['health','Здоровье','health'],['shop','Покупки','shop'],['planner','Планер','planner'],['my','Мой путь','my']];
/* старые адреса → новые */
const ALIAS={'steaks':'school/steaks','sauces':'wiki/sauce','calc':'health/calc','nutrition':'health/nutrition','fav':'my/fav',
 'school/grains':'wiki/grains','school/pantry':'wiki/pantry','school/health':'health/harm','wiki/cuisine':'wiki/cuisine'};
let route={p:'',a:[],q:{}},CUR=location.hash||'#/',HIST=[];
function parseHash(h){
  h=String(h||'').replace(/^#\/?/,'');let qs='';const qi=h.indexOf('?');if(qi>=0){qs=h.slice(qi+1);h=h.slice(0,qi)}
  try{h=decodeURIComponent(h)}catch(e){}
  let a=h.split('/').filter(Boolean);
  const two=a.slice(0,2).join('/');
  if(ALIAS[two]){a=ALIAS[two].split('/')}else if(ALIAS[a[0]]&&a.length<=1){a=ALIAS[a[0]].split('/')}
  const q={};if(qs)qs.split('&').forEach(x=>{const i=x.indexOf('=');if(i>0)q[x.slice(0,i)]=x.slice(i+1)});
  return{p:a[0]||'',a:a.slice(1),q}
}
function go(h){
  h=String(h);if(h[0]!=='#')h='#'+h;
  try{if(location.hash!==h)history.pushState(null,'',h)}catch(e){try{location.hash=h}catch(_){}}
  CUR=h;render();
}
function goBack(){HIST.pop();const t=HIST.pop();go(t||'#/recipes')}
const VIEWS={};
function activeNav(){const p=route.p;return p==='r'?'recipes':p==='level'?'my':p}
function render(){
  route=parseHash(CUR);HIST.push(CUR);if(HIST.length>80)HIST.shift();
  const act=activeNav();
  $('#nav').innerHTML=NAV.map(n=>`<a href="#/${n[0]}" class="${act===n[0]?'on':''}">${n[1]}</a>`).join('');
  $('#bnav').innerHTML=NAV.map(n=>`<a href="#/${n[0]}" class="${act===n[0]?'on':''}">${ico(n[2],21)}<b>${n[1]}</b></a>`).join('');
  const v=VIEWS[route.p]||VIEWS[''];
  const app=$('#app');app.innerHTML='';
  smoothReset();
  try{v(app)}catch(e){console.error(e);app.innerHTML='<div class="empty"><p>Что-то пошло не так на этой странице. <a href="#/" style="color:var(--gold)">На главную</a></p></div>'}
  app.classList.remove('pin');void app.offsetWidth;app.classList.add('pin');
  window.scrollTo(0,0);
  const t=$('h1',app);document.title=(t?t.textContent.trim().slice(0,60)+' — ':'')+'Гений кухни';
  afterRender();
}
function afterRender(){photoScan();revealScan();countScan();parallaxInit()}
document.addEventListener('click',e=>{
  const a=e.target.closest&&e.target.closest('a[href^="#"]');
  if(a&&a.getAttribute('href').length>1&&!e.defaultPrevented&&!(e.ctrlKey||e.metaKey||e.shiftKey)&&!a.hasAttribute('data-native')){e.preventDefault();go(a.getAttribute('href'))}
});
window.addEventListener('popstate',()=>{CUR=location.hash||'#/';render()});
window.addEventListener('hashchange',()=>{if(location.hash&&location.hash!==CUR){CUR=location.hash;render()}});

/* ---------- ХАБЫ С ВКЛАДКАМИ ---------- */
const HUBS={};
function vHub(el,key){
  const h=HUBS[key];let cur=route.a[0];if(!h.tabs.find(t=>t[0]===cur))cur=h.tabs[0][0];
  el.innerHTML=`<div class="page-h"><div><div class="eyebrow">${h.eyebrow}</div><h1>${h.title}</h1><p>${h.lead}</p></div></div>${h.pre?h.pre():''}
  <div class="hubtabs"><div class="tabs" id="htabs">${h.tabs.map(t=>`<button data-t="${t[0]}" class="${t[0]===cur?'on':''}" onclick="hubGo('${key}','${t[0]}')">${t[1]}</button>`).join('')}</div></div><div id="hbody"></div>`;
  drawHub(key,cur);
}
function drawHub(key,tab){
  const h=HUBS[key];const t=h.tabs.find(x=>x[0]===tab)||h.tabs[0];const body=$('#hbody');if(!body)return;
  $$('#htabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t[0]));
  const act=$('#htabs button.on');if(act&&act.scrollIntoView){try{const bar=$('#htabs');bar.scrollTo({left:act.offsetLeft-40,behavior:REDUCED?'auto':'smooth'})}catch(e){}}
  body.classList.remove('tabin');body.innerHTML='';
  try{t[2](body,t)}catch(e){console.error(e);body.innerHTML='<div class="empty"><p>Раздел временно недоступен.</p></div>'}
  void body.offsetWidth;body.classList.add('tabin');
  document.title=t[1]+' — '+h.title+' — Гений кухни';
  afterRender();
}
function hubGo(key,tab){
  const h='#/'+key+'/'+tab;try{history.pushState(null,'',h)}catch(e){try{location.hash=h}catch(_){}}
  CUR=h;route=parseHash(h);HIST.push(h);smoothReset();
  const bar=$('#htabs');const top=bar?bar.getBoundingClientRect().top+window.scrollY-84:0;
  drawHub(key,tab);if(window.scrollY>top)window.scrollTo(0,Math.max(0,top));
}
VIEWS.school=el=>vHub(el,'school');VIEWS.wiki=el=>vHub(el,'wiki');VIEWS.health=el=>vHub(el,'health');VIEWS.shop=el=>vHub(el,'shop');

/* ---------- ФОТО ---------- */
const photoQ=[];let photoBusy=0;
const THUMB_STEPS=[250,330,500,960,1280,1920];
const thumbSize=(u,w)=>{const st=THUMB_STEPS.find(x=>x>=w)||1920;return u.replace(/\/(\d+)px-/,'/'+st+'px-')};
function photoGet(id){return(typeof PHOTOS!=='undefined'&&PHOTOS[id])||S.ph[id]||null}
const photoFail=new Set();
const PQ_STOP=new Set(['the','and','with','alla','al','di','de','la','style','homemade','classic','recipe']);
const pqTok=t=>String(t).toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>2&&!PQ_STOP.has(w));
function photoFetch(id){
  return new Promise(res=>{
    const t=(typeof WP!=='undefined'&&WP[id])||null;
    const finish=u=>{S.ph[id]=u||0;save('ph');res(u||null)};          /* ответ получен: запоминаем (в т.ч. «фото нет») */
    const fail=()=>{photoFail.add(id);res(null)};                      /* сеть недоступна: не запоминаем, попробуем позже */
    /* запасной источник: TheMealDB, принимаем только близкое совпадение названия */
    const mealdb=()=>{
      const q=(typeof PQ!=='undefined'&&PQ[id])||null;if(!q){finish(null);return}
      fetch('https://www.themealdb.com/api/json/v1/1/search.php?s='+encodeURIComponent(q)).then(r=>r.json()).then(j=>{
        const qt=pqTok(q);const m=(j&&j.meals||[]).find(x=>{const mt=new Set(pqTok(x.strMeal));return qt.length&&qt.filter(w=>mt.has(w)).length/qt.length>=.75});
        finish(m&&m.strMealThumb)}).catch(fail);
    };
    if(!t){mealdb();return}
    fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+t).then(r=>r.status===404?{notfound:1}:(r.ok?r.json():null)).then(j=>{
      if(!j){fail();return}const u=j.thumbnail&&j.thumbnail.source;if(u&&j.type!=='disambiguation')finish(u);else mealdb()}).catch(fail);
  });
}
function photoApply(id,url){
  const direct=url.startsWith('data:');
  $$('img[data-ph="'+id+'"]').forEach(im=>{
    if(im.dataset.done)return;im.dataset.done=1;
    const w=+im.dataset.w||500;
    if(!direct)im.onerror=()=>{if(im.src!==url){im.onerror=null;im.src=url}};
    im.onload=()=>im.classList.add('on');im.src=direct?url:thumbSize(url,w);
  });
  $$('[data-bg="'+id+'"]').forEach(b=>{
    if(b.dataset.done)return;b.dataset.done=1;const w=+b.dataset.w||960;const im=new Image();
    const show=u=>{b.style.backgroundImage='url("'+u+'")';b.classList.add('on')};
    im.onload=()=>show(im.src);
    if(!direct)im.onerror=()=>{const i2=new Image();i2.onload=()=>show(url);i2.src=url};
    im.src=direct?url:thumbSize(url,w);
  });
}
function photoPump(){
  while(photoBusy<4&&photoQ.length){
    const id=photoQ.shift();photoBusy++;
    photoFetch(id).then(u=>{photoBusy--;if(u)photoApply(id,u);photoPump()});
  }
}
let photoIO=null;
function photoScan(root=document){
  /* фото из кэша/вшитые применяем сразу; за остальными идём в сеть только когда карточка близко к экрану */
  const bgs=new Set();
  $$('[data-bg]',root).forEach(n=>{if(!n.dataset.done)bgs.add(n.dataset.bg)});
  bgs.forEach(id=>{const c=photoGet(id);if(c)photoApply(id,c);else if(c===null&&!photoFail.has(id)&&!photoQ.includes(id))photoQ.push(id)});
  const imgs=$$('img[data-ph]',root).filter(n=>!n.dataset.done);
  const need=[];
  imgs.forEach(im=>{const id=im.dataset.ph;const c=photoGet(id);if(c)photoApply(id,c);else if(c===null&&!photoFail.has(id))need.push(im)});
  if(need.length){
    if(!('IntersectionObserver' in window)){need.slice(0,24).forEach(im=>{const id=im.dataset.ph;if(!photoQ.includes(id))photoQ.push(id)})}
    else{
      if(!photoIO)photoIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){photoIO.unobserve(e.target);const id=e.target.dataset.ph;if(!e.target.dataset.done&&!photoQ.includes(id)&&!photoFail.has(id)){photoQ.push(id);photoPump()}}}),{rootMargin:'300px 0px'});
      need.forEach(im=>photoIO.observe(im));
    }
  }
  photoPump();
}
const hasPhoto=id=>!!((typeof PHOTOS!=='undefined'&&PHOTOS[id])||(typeof WP!=='undefined'&&WP[id])||(typeof PQ!=='undefined'&&PQ[id]));
const imgTag=(id,w=500,alt='')=>hasPhoto(id)&&S.ph[id]!==0?`<img data-ph="${id}" data-w="${w}" alt="${esc(alt)}" decoding="async">`:'';

/* ---------- АНИМАЦИИ ---------- */
const RV_SEL='#app .rc, #app .panel, #app .acc, #app .tile, #app .coll>*, #app .lvl-card, #app .cut, #app .sec-h, #app .tbl-w, #app .tip, #app .gear, #app .empty, #app .done-wrap, #app .lesson, #app .tl-row, #app .qz, #app .mod, #app .art';
let rvIO=null;
function revealScan(){
  if(REDUCED||!('IntersectionObserver' in window))return;
  if(!rvIO)rvIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rvIO.unobserve(e.target)}}),{rootMargin:'0px 0px -5% 0px',threshold:.04});
  let i=0;$$(RV_SEL).forEach(n=>{if(n.dataset.rv)return;n.dataset.rv=1;n.classList.add('rv');n.style.setProperty('--d',((i++%6)*55)+'ms');rvIO.observe(n)});
}
function countScan(){
  $$('[data-count]').forEach(n=>{
    if(n.dataset.cd)return;n.dataset.cd=1;const to=+n.dataset.count;if(REDUCED){n.textContent=to;return}
    const t0=performance.now(),D=900;n.textContent='0';
    const tick=t=>{const p=Math.min(1,(t-t0)/D);n.textContent=Math.round(to*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(tick)};requestAnimationFrame(tick);
  });
}
let parRAF=0;
function parallaxInit(){
  const hb=$('#app .hb');if(!hb||REDUCED)return;
  const f=()=>{parRAF=0;const y=window.scrollY;if(y<900)hb.style.transform='translate3d(0,'+(y*.18)+'px,0) scale(1.08)'};
  if(!parallaxInit.on){parallaxInit.on=1;window.addEventListener('scroll',()=>{const h=$('#app .hb');if(h&&!parRAF){parRAF=requestAnimationFrame(()=>{parRAF=0;const y=window.scrollY;if(y<900)h.style.transform='translate3d(0,'+(y*.18)+'px,0) scale(1.08)'})}},{passive:true})}
}
/* плавный скролл колесом мыши (для тачпада остаётся нативный) */
let smooth={t:0,c:0,on:false,last:0};
function smoothReset(){smooth.on=false;smooth.t=smooth.c=window.scrollY}
(function(){
  if(REDUCED)return;
  const maxS=()=>Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
  function loop(now){
    if(!smooth.on)return;const dt=Math.min(50,now-smooth.last||16);smooth.last=now;
    const k=1-Math.pow(1-.13,dt/16.67);smooth.c+=(smooth.t-smooth.c)*k;
    if(Math.abs(smooth.t-smooth.c)<.5){smooth.c=smooth.t;smooth.on=false;window.scrollTo(0,smooth.c);return}
    window.scrollTo(0,smooth.c);requestAnimationFrame(loop);
  }
  window.addEventListener('wheel',e=>{
    if(e.ctrlKey||e.defaultPrevented||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
    if(document.body.style.overflow==='hidden'||$('#modal.on')||$('#cook.on'))return;
    let n=e.target;while(n&&n!==document.body&&n!==document.documentElement){
      if(n.nodeType===1){const o=getComputedStyle(n).overflowY;if((o==='auto'||o==='scroll')&&n.scrollHeight>n.clientHeight+1)return}
      n=n.parentNode}
    const dy=e.deltaMode===1?e.deltaY*34:e.deltaMode===2?e.deltaY*window.innerHeight:e.deltaY;
    if(e.deltaMode===0&&Math.abs(dy)<40){smoothReset();return}
    e.preventDefault();
    if(!smooth.on){smooth.c=window.scrollY;smooth.t=smooth.c;smooth.on=true;smooth.last=performance.now();requestAnimationFrame(loop)}
    smooth.t=Math.max(0,Math.min(maxS(),smooth.t+dy*1.05));
  },{passive:false});
  window.addEventListener('scroll',()=>{if(!smooth.on){smooth.c=smooth.t=window.scrollY}},{passive:true});
})();

/* ---------- ОБЩИЕ КОМПОНЕНТЫ ---------- */
function card(r){
  const cu=CUISINES[r.cu]||{};const fv=S.fav.includes(r.id);const ln=!!S.learned[r.id];
  return `<article class="card rc" onclick="go('#/r/${r.id}')">
   <div class="ph" ${cuBg(r.cu)}><span class="ime">${r.em}</span>${imgTag(r.id,500,r.name)}${ln?'<span class="lr">✓ Освоено</span>':''}<button class="fv ${fv?'on':''}" onclick="event.stopPropagation();toggleFav('${r.id}',this)" aria-label="В избранное">${fv?'♥':'♡'}</button></div>
   <div class="bd"><div class="cu">${cu.n||''} · ${CATS[r.cat]||''}</div><h3>${esc(r.name)}</h3><p>${esc(r.desc)}</p>
   <div class="meta"><span>⏱ <b>${fmtT(r.t)}</b></span><span>🔥 <b>${r.kcal}</b> ккал</span>${lvlDots(r.lvl)}</div></div></article>`;
}
function toggleFav(id,btn){
  const i=S.fav.indexOf(id);if(i>=0)S.fav.splice(i,1);else S.fav.push(id);save('fav');
  if(btn){const on=S.fav.includes(id);btn.classList.toggle('on',on);btn.textContent=on?'♥':'♡'}
  toast(S.fav.includes(id)?'Добавлено в избранное ❤️':'Убрано из избранного');
  if(route.p==='my'&&route.a[0]==='fav')render();
}
function openModal(t,h,cls){$('#mt').textContent=t;$('#mb').innerHTML=h;const m=$('#modal');m.className='modal on'+(cls?' '+cls:'');revealScan()}
function closeModal(){$('#modal').classList.remove('on')}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
/* плавное раскрытие аккордеона */
function accToggle(btn){
  const acc=btn.parentElement;const ab=acc.querySelector('.ab');if(!ab){acc.classList.toggle('open');return}
  if(REDUCED){acc.classList.toggle('open');return}
  if(acc.classList.contains('open')){
    ab.style.display='block';ab.style.height=ab.scrollHeight+'px';ab.style.overflow='hidden';void ab.offsetWidth;
    ab.style.transition='height .38s cubic-bezier(.3,.7,.2,1),opacity .3s';ab.style.height='0px';ab.style.opacity='0';acc.classList.remove('open');
    setTimeout(()=>{if(!acc.classList.contains('open')){ab.style.cssText=''}},400);
  }else{
    acc.classList.add('open');ab.style.height='0px';ab.style.overflow='hidden';ab.style.opacity='0';void ab.offsetWidth;
    ab.style.transition='height .42s cubic-bezier(.3,.7,.2,1),opacity .4s';ab.style.height=ab.scrollHeight+'px';ab.style.opacity='1';
    setTimeout(()=>{ab.style.cssText=''},440);
  }
}

/* ---------- ПОИСК ---------- */
function searchRecipes(q){
  const n=norm(q).trim();const words=n.split(/\s+/).filter(Boolean);
  return RECIPES.map(r=>{
    const hay=r._h||(r._h=norm(r.name+' '+r.desc+' '+(CUISINES[r.cu]||{}).n+' '+(CATS[r.cat]||'')+' '+r.ing.map(i=>i.n).join(' ')));
    let sc=0;
    if(words.length){
      for(const w of words){
        if(norm(r.name).includes(w))sc+=10;else if(hay.includes(w))sc+=3;else return null;
      }
    }
    return{r,sc};
  }).filter(Boolean).sort((a,b)=>b.sc-a.sc).map(x=>x.r);
}
function searchPages(q){
  const words=norm(q).split(/\s+/).filter(Boolean);if(!words.length||typeof PAGES==='undefined')return[];
  return PAGES.filter(p=>{const h=norm(p[0]+' '+p[1]);return words.every(w=>h.includes(w))}).slice(0,4);
}
const gs=$('#gs'),sres=$('#sres');
gs.addEventListener('input',()=>{
  const q=gs.value.trim();if(!q){sres.style.display='none';return}
  const res=searchRecipes(q).slice(0,7);const pg=searchPages(q);
  sres.innerHTML=(res.map(r=>`<a href="#/r/${r.id}"><span class="sr-i">${r.em}</span><div><b>${esc(r.name)}</b><br><small>${(CUISINES[r.cu]||{}).n} · ${r.kcal} ккал · ${fmtT(r.t)}</small></div></a>`).join('')
   +pg.map(p=>`<a href="${p[2]}"><span class="sr-i">📘</span><div><b>${esc(p[0])}</b><br><small>Раздел приложения</small></div></a>`).join(''))
   ||'<a><small>Ничего не найдено</small></a>';
  if(res.length)sres.innerHTML+=`<a href="#/recipes?q=${encodeURIComponent(q)}"><b style="color:var(--gold)">Показать все результаты →</b></a>`;
  sres.style.display='block';
});
gs.addEventListener('keydown',e=>{if(e.key==='Enter'&&gs.value.trim()){go('#/recipes?q='+encodeURIComponent(gs.value.trim()));sres.style.display='none';gs.blur()}});
document.addEventListener('click',e=>{if(!e.target.closest('.sbox'))sres.style.display='none'});
sres.addEventListener('click',()=>{sres.style.display='none';gs.value=''});
$('#themeBtn').onclick=()=>{S.theme=S.theme==='dark'?'light':'dark';save('theme');applyTheme()};
function applyTheme(){document.documentElement.dataset.theme=S.theme;$('#themeBtn').textContent=S.theme==='dark'?'☾':'☀'}
document.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||'')){e.preventDefault();gs.focus()}});
