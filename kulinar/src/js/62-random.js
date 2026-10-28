/* ===== СЛУЧАЙНОЕ БЛЮДО: «Что приготовить сегодня?» ===== */
const MEALCATS={b:['breakfast'],l:['soup','salad','pasta','veg','fish','sandwich','pizza','potato','side','meat'],d:['meat','steak','fish','pasta','potato','pizza','veg','sandwich'],s:['salad','dessert','sandwich','side','breakfast']};
const MEAL_N={b:'завтрак',l:'обед',d:'ужин',s:'перекус'};
let RAND={meal:'',time:0,cu:'',stove:false,fresh:true,last:null,opts:{},spinning:false};
const STOVE_ONLY=r=>!/духовк|запека|выпека|гриль|фритюр|аэро/i.test(r.steps.join(' '));
function randPool(o){
  const cats=o.meal?MEALCATS[o.meal]:null;
  return RECIPES.filter(r=>r.cat!=='sauce'&&(!cats||cats.includes(r.cat))&&(!o.time||r.t<=o.time)&&(!o.cu||r.cu===o.cu)&&(!o.stove||STOVE_ONLY(r)));
}
function randPick(o,exclude){
  let pool=randPool(o).filter(r=>!exclude||r.id!==exclude);
  if(o.meal==='l'){pool=pool.filter(r=>r.cat!=='meat'||r.t<=60)}
  if(!pool.length)return null;
  const w=pool.map(r=>(o.fresh&&S.learned[r.id])?.4:2.4);const sum=w.reduce((a,b)=>a+b,0);let x=Math.random()*sum;
  for(let i=0;i<pool.length;i++){x-=w[i];if(x<=0)return pool[i]}
  return pool[pool.length-1];
}
function openRandom(opts){
  opts=opts||{};RAND.opts=opts;
  const h=new Date().getHours();
  RAND.meal=opts.meal||(opts.fixedMeal?opts.fixedMeal:(h<11?'b':h<16?'l':'d'));RAND.last=null;
  openModal(opts.date?'Случайное блюдо — '+MEAL_N[RAND.meal]:'Что приготовить сегодня?',`<div class="rnd" id="rnd"></div>`,'wide');
  randDraw(false);
  setTimeout(()=>randSpin(),350);
}
function randFilters(){
  const o=RAND;const fixed=!!(RAND.opts&&RAND.opts.meal);
  return `<div class="rnd-f">${fixed?'':`<div class="chips sc">${[['','Любое'],['b','Завтрак'],['l','Обед'],['d','Ужин'],['s','Перекус']].map(([k,n])=>`<button class="pill ${o.meal===k?'on':''}" onclick="RAND.meal='${k}';randSpin()">${n}</button>`).join('')}</div>`}
   <div class="rnd-row"><select class="field" onchange="RAND.time=+this.value;randSpin()"><option value="0" ${!o.time?'selected':''}>Любое время</option><option value="20" ${o.time==20?'selected':''}>до 20 минут</option><option value="40" ${o.time==40?'selected':''}>до 40 минут</option><option value="90" ${o.time==90?'selected':''}>до 1,5 часа</option></select>
   <select class="field" onchange="RAND.cu=this.value;randSpin()"><option value="">Любая кухня</option>${Object.entries(CUISINES).map(([k,c])=>`<option value="${k}" ${o.cu===k?'selected':''}>${c.n}</option>`).join('')}</select></div>
   <div class="rnd-row"><label class="chk"><input type="checkbox" ${o.stove?'checked':''} onchange="RAND.stove=this.checked;randSpin()"><span>Только на плите (без духовки)</span></label><label class="chk"><input type="checkbox" ${o.fresh?'checked':''} onchange="RAND.fresh=this.checked;randSpin()"><span>Чаще то, что ещё не освоено</span></label></div></div>`;
}
function randDraw(show){
  const box=$('#rnd');if(!box)return;const r=RAND.last;const o=RAND.opts||{};
  box.innerHTML=randFilters()+`<div class="rnd-stage ${show?'show':''}" id="rstage">${r?randCard(r):'<div class="rnd-reel"><span class="ime">🎲</span><div id="rreel">Крутим…</div></div>'}</div>
   <div class="rnd-act">${r?`${o.date?`<button class="btn gold" onclick="randChoose()">✓ Выбрать это блюдо</button>`:`<a class="btn gold" href="#/r/${r.id}" onclick="closeModal()">Готовить →</a>`}<button class="btn" onclick="randSpin()">🎲 Ещё вариант</button>${o.date?`<a class="btn" href="#/r/${r.id}" onclick="closeModal()">Открыть рецепт</a>`:`<button class="btn" onclick="closeModal();planModal('${r.id}')">В планер</button>`}`:`<button class="btn gold" onclick="randSpin()">🎲 Крутить</button>`}</div>`;
  photoScan(box);
}
function randCard(r){
  const cu=CUISINES[r.cu]||{};
  return `<div class="rnd-card"><div class="rph" ${cuBg(r.cu)}><span class="ime">${r.em}</span>${imgTag(r.id,640,r.name)}</div><div class="rbody"><div class="eyebrow">${cu.n||''} · ${CATS[r.cat]||''}</div><h3>${esc(r.name)}</h3><p class="muted">${esc(r.desc)}</p><div class="meta" style="border:0;padding:0"><span>⏱ <b>${fmtT(r.t)}</b></span><span>🔥 <b>${r.kcal}</b> ккал</span>${lvlDots(r.lvl)}<span class="pill">${LVL[r.lvl]}</span></div></div></div>`;
}
function randSpin(){
  if(RAND.spinning)return;
  const box=$('#rnd');if(!box)return;
  const pool=randPool(RAND);
  if(!pool.length){RAND.last=null;box.innerHTML=randFilters()+'<div class="empty"><p>По таким условиям блюд не нашлось — ослабьте фильтры.</p></div>';return}
  RAND.spinning=true;RAND.last=null;
  const final=randPick(RAND,RAND.prev);RAND.prev=final&&final.id;
  randDraw(false);
  const reel=$('#rreel');let i=0;const total=REDUCED?1:12;
  const tick=()=>{
    if(i>=total){RAND.spinning=false;RAND.last=final;randDraw(true);const st=$('#rstage');if(st){st.classList.remove('show');void st.offsetWidth;st.classList.add('show')}return}
    const r=pool[Math.floor(Math.random()*pool.length)];if(reel)reel.textContent=r.em+'  '+r.name;i++;
    setTimeout(tick,45+i*i*2.1);
  };
  tick();
}
function randChoose(){
  const o=RAND.opts,r=RAND.last;if(!r||!o.date)return;
  planAdd(o.date,o.mealKey||RAND.meal,{id:r.id});closeModal();toast('«'+r.name+'» добавлено в планер');if(route.p==='planner')render();
}
/* случайное блюдо на весь день (завтрак, обед, ужин) — для пустых слотов */
function randomDay(date){
  const p=(S.plan[date]=S.plan[date]||{});const used=new Set(Object.values(S.plan).flatMap(d=>Object.values(d).flat()).map(x=>x.id));
  ['b','l','d'].forEach(m=>{if(!(p[m]||[]).length){const r=randPick({meal:m,fresh:true},null);if(r){p[m]=[{id:r.id}]}}});
  save('plan');render();toast('День заполнен случайными блюдами 🎲');
}
