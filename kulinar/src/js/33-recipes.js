/* ===== РЕЦЕПТЫ: СПИСОК, СТРАНИЦА, ТАЙМЕРЫ, РЕЖИМ ГОТОВКИ ===== */
let F={q:'',cu:'',cat:'',time:0,sort:'pop',lvl:0,col:'',ln:''};
let curServ=0;
/* ---------- РЕЦЕПТЫ + КОЛЛЕКЦИИ ---------- */
function vRecipes(el){
  F={q:route.q.q?decodeURIComponent(route.q.q):'',cu:route.q.cu||'',cat:route.q.cat||'',time:+route.q.time||0,sort:route.q.sort||'pop',lvl:0,col:route.q.col||'',ln:''};
  el.innerHTML=`<div class="page-h"><div><div class="eyebrow">Каталог</div><h1>Все рецепты</h1><p>Ищите по названию, ингредиенту или кухне. Коллекции помогут выбрать блюдо под настроение: от римских паст до уровня «Мишлен».</p></div></div>
  <div class="sec-h" style="margin-top:34px"><h2 style="font-size:28px">Коллекции</h2></div><div class="coll" id="fcol"></div><div id="fcolmore" class="collmore"></div>
  <div class="filters" style="margin-top:34px">
   <div class="toolbar"><input id="rq" placeholder="Например: курица, паста, грузинская…" style="flex:1;min-width:220px" value="${esc(F.q)}">
    <select id="rtime" class="field"><option value="0">Любое время</option><option value="20">до 20 мин</option><option value="40">до 40 мин</option><option value="90">до 1,5 ч</option></select>
    <select id="rlvl" class="field"><option value="0">Любая сложность</option><option value="1">Просто</option><option value="2">Средне</option><option value="3">Мастер</option></select>
    <select id="rln" class="field"><option value="">Все блюда</option><option value="no">Ещё не освоено</option><option value="yes">Освоено ✓</option></select>
    <select id="rsort" class="field"><option value="pop">По умолчанию</option><option value="time">Быстрые сначала</option><option value="kcal">Меньше калорий</option><option value="name">По алфавиту</option></select></div>
   <div class="chips sc" id="fcu"></div><div class="chips sc" id="fcat"></div></div>
  <div id="rcount" class="muted" style="margin-bottom:14px"></div><div class="grid" id="rgrid"></div>`;
  $('#rtime').value=F.time;$('#rsort').value=F.sort;
  const draw=()=>{
    $('#fcu').innerHTML=`<button class="pill ${!F.cu?'on':''}" data-k="cu" data-v="">Все кухни</button>`+Object.entries(CUISINES).map(([k,c])=>`<button class="pill ${F.cu===k?'on':''}" data-k="cu" data-v="${k}">${c.f} ${c.n}</button>`).join('');
    $('#fcat').innerHTML=`<button class="pill ${!F.cat?'on':''}" data-k="cat" data-v="">Все типы</button>`+Object.entries(CATS).map(([k,n])=>`<button class="pill ${F.cat===k?'on':''}" data-k="cat" data-v="${k}">${n}</button>`).join('');
    const idxSel=COLLECTIONS.findIndex(c=>c.id===F.col);const showAll=F.colAll||idxSel>=8;const list0=showAll?COLLECTIONS:COLLECTIONS.slice(0,8);
    $('#fcol').innerHTML=list0.map(c=>`<button class="${F.col===c.id?'on':''}" data-k="col" data-v="${F.col===c.id?'':c.id}"><span>${collRecipes(c).length} рецептов</span><b>${c.e} ${c.n}</b><small>${c.d}</small></button>`).join('');
    $('#fcolmore').innerHTML=`<button class="btn sm" data-k="colAll" data-v="${F.colAll?'':'1'}">${F.colAll?'Свернуть коллекции':'Показать все '+COLLECTIONS.length+' коллекций'}</button>`;
    let list=searchRecipes(F.q);
    if(F.col){const c=COLLECTIONS.find(x=>x.id===F.col);if(c){const set=new Set(collRecipes(c).map(r=>r.id));list=list.filter(r=>set.has(r.id))}}
    if(F.cu)list=list.filter(r=>r.cu===F.cu);if(F.cat)list=list.filter(r=>r.cat===F.cat);
    if(F.time)list=list.filter(r=>r.t<=F.time);if(F.lvl)list=list.filter(r=>r.lvl===F.lvl);
    if(F.ln==='yes')list=list.filter(r=>S.learned[r.id]);if(F.ln==='no')list=list.filter(r=>!S.learned[r.id]);
    if(F.sort==='time')list=[...list].sort((a,b)=>a.t-b.t);else if(F.sort==='kcal')list=[...list].sort((a,b)=>a.kcal-b.kcal);else if(F.sort==='name')list=[...list].sort((a,b)=>a.name.localeCompare(b.name,'ru'));
    $('#rcount').textContent='Найдено: '+list.length+(F.col?' · коллекция «'+(COLLECTIONS.find(x=>x.id===F.col)||{}).n+'»':'');
    $('#rgrid').innerHTML=list.length?list.map(card).join(''):'<div class="empty" style="grid-column:1/-1"><div class="e">🔎</div><p>Ничего не нашлось. Попробуйте другой запрос или сбросьте фильтры.</p></div>';
    afterRender();
  };
  draw();
  $('#rq').oninput=e=>{F.q=e.target.value;draw()};
  $('#rtime').onchange=e=>{F.time=+e.target.value;draw()};$('#rlvl').onchange=e=>{F.lvl=+e.target.value;draw()};$('#rsort').onchange=e=>{F.sort=e.target.value;draw()};$('#rln').onchange=e=>{F.ln=e.target.value;draw()};
  el.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(b){F[b.dataset.k]=b.dataset.v;if(b.dataset.k==='col'&&b.dataset.v){F.cu='';F.cat=''}draw()}});
}


function vRecipeFav(b,id){const on=S.fav.includes(id);b.textContent=on?'♥ В избранном':'♡ В избранное'}
function setServ(d){curServ=Math.max(1,Math.min(20,curServ+d));render()}


/* ---------- ТАЙМЕР ---------- */
const timers=[];
function startTimer(min,label){
  const end=Date.now()+min*60000;const id=Date.now();timers.push({id,end,label});toast('⏱ Таймер '+min+' мин запущен');tickTimers();
}
function tickTimers(){
  let box=$('#timers');if(!box){box=document.createElement('div');box.id='timers';box.style.cssText='position:fixed;right:14px;bottom:80px;z-index:150;display:flex;flex-direction:column;gap:8px';document.body.appendChild(box)}
  box.innerHTML=timers.map(t=>{const s=Math.max(0,Math.round((t.end-Date.now())/1000));return `<div style="background:var(--card);border:1px solid var(--gold);border-radius:14px;padding:10px 14px;box-shadow:var(--shadow);display:flex;gap:10px;align-items:center">⏱ <b style="font-family:var(--serif);font-size:20px">${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}</b><small class="muted">${esc(t.label||'')}</small><button class="x" onclick="stopTimer(${t.id})">✕</button></div>`}).join('');
  for(const t of [...timers])if(t.end<=Date.now()){beep();toast('⏰ Время вышло: '+(t.label||'таймер'));stopTimer(t.id)}
  clearTimeout(tickTimers.t);if(timers.length)tickTimers.t=setTimeout(tickTimers,1000);
}
function stopTimer(id){const i=timers.findIndex(t=>t.id===id);if(i>=0)timers.splice(i,1);tickTimers()}
function beep(){try{const a=new (window.AudioContext||window.webkitAudioContext)();[0,.25,.5].forEach(d=>{const o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.value=.15;o.start(a.currentTime+d);o.stop(a.currentTime+d+.15)})}catch(e){}}
function timerBtn(step){
  const m=step.match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*(мин|час)/);if(!m)return'';
  let v=+(m[2]||m[1]);if(m[3]==='час')v*=60;if(v>240)return'';
  return ` <button class="pill" style="cursor:pointer" onclick="startTimer(${v},'${esc(step).slice(0,30).replace(/'/g,'')}…')">⏱ ${v} мин</button>`;
}


/* ---------- РЕЦЕПТ ---------- */
function vRecipe(el){
  const r=byId(route.a[0]);if(!r){el.innerHTML='<div class="empty"><div class="e">🤷</div><p>Рецепт не найден. <a href="#/recipes" style="color:var(--gold)">К каталогу</a></p></div>';return}
  curServ=curServ&&route.a[0]===vRecipe.last?curServ:r.serv;vRecipe.last=r.id;
  const cu=CUISINES[r.cu]||{};const fv=S.fav.includes(r.id);const k=curServ/r.serv;const ln=!!S.learned[r.id];
  const related=RECIPES.filter(x=>x.id!==r.id&&(x.cu===r.cu||x.cat===r.cat)).sort(()=>.5-Math.random()).slice(0,4);
  el.innerHTML=`<a class="back" href="#/recipes" onclick="event.preventDefault();goBack()">← Назад</a>
  <div class="rhero ${hasPhoto(r.id)?'has':''}" ${cuBg(r.cu)}><div class="rtext"><div class="em">${r.em}</div>
   <div class="eyebrow">${cu.n||''} · ${CATS[r.cat]}</div><h1 style="margin:14px 0">${esc(r.name)}</h1><p>${esc(r.desc)}</p>
   <div class="chips"><span class="pill">⏱ ${fmtT(r.t)}</span><span class="pill">🔥 ${r.kcal} ккал / порция</span><span class="pill">${LVL[r.lvl]}</span></div></div>${hasPhoto(r.id)?`<div class="rimg" data-bg="${r.id}" data-w="960"></div>`:''}</div>
  <div class="chips noprint" style="margin-bottom:28px">
   <button class="btn gold" onclick="startCook('${r.id}')">▶ Режим готовки</button>
   <button class="btn learn-btn ${ln?'on':''}" id="lnb" onclick="toggleLearn('${r.id}')">${ln?'✓ Я научился':'☐ Я научился готовить'}</button>
   <button class="btn" onclick="toggleFav('${r.id}');vRecipeFav(this,'${r.id}')">${fv?'♥ В избранном':'♡ В избранное'}</button>
   <button class="btn" onclick="planModal('${r.id}')">В планер</button>
   <button class="btn" onclick="diaryAddRecipe('${r.id}')">В дневник калорий</button>
   <a class="btn" href="#/school/stove">Плита 0–9</a>
   <button class="btn" onclick="window.print()">Печать</button></div>
  <div class="rp"><div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><h2 style="font-size:36px">Ингредиенты</h2>
    <div class="stepper noprint"><button onclick="setServ(-1)">−</button><span>${curServ}</span><button onclick="setServ(1)">+</button></div></div>
   <div class="muted" style="font-size:13px;margin-bottom:8px">на ${curServ} ${curServ===1?'порцию':curServ<5?'порции':'порций'} · отмечайте нужное</div>
   <ul class="ing">${r.ing.map(i=>`<li onclick="this.classList.toggle('done');const c=this.querySelector('input');if(event.target!==c)c.checked=!c.checked"><input type="checkbox" onclick="event.stopPropagation();this.parentElement.classList.toggle('done')"><span>${esc(i.n)}</span><b>${ingStr(i,k)}</b></li>`).join('')}</ul>
   <div class="nut"><div><b>${r.kcal}</b><span>ккал на порцию</span></div><div><b>${r.kcal*curServ}</b><span>всего блюдо</span></div><div><b>${r.t}</b><span>минут</span></div><div><b>${r.ing.length}</b><span>ингредиентов</span></div></div></div>
  <div><h2 style="font-size:36px;margin-bottom:14px">Приготовление</h2><ol class="steps">${r.steps.map(s=>`<li><div>${esc(s)}${timerBtn(s)}</div></li>`).join('')}</ol>
   ${r.tip?`<div class="tip"><b>Совет шефа.</b> ${esc(r.tip)}</div>`:''}
   <div class="panel" style="margin-top:18px;text-align:center"><p class="muted" style="margin-bottom:12px">Получилось? Отметьте блюдо — оно попадёт в «Мой путь» и повысит ваш уровень.</p><button class="btn learn-btn ${ln?'on':''}" id="lnb2" onclick="toggleLearn('${r.id}')">${ln?'✓ Я научился':'☐ Я научился готовить'}</button></div></div></div>
  <div class="sec-h"><h2>Похожие блюда</h2></div><div class="grid">${related.map(card).join('')}</div>`;
}
function toggleLearn(id){
  if(S.learned[id])delete S.learned[id];else S.learned[id]=Date.now();save('learned');
  const on=!!S.learned[id];['lnb','lnb2'].forEach(i=>{const b=document.getElementById(i);if(b){b.classList.toggle('on',on);b.textContent=on?'✓ Я научился':'☐ Я научился готовить'}});
  const k=rank();toast(on?'Освоено! Уровень: '+k.r[1]+' · '+k.sc:'Отметка снята');
}


/* ---------- РЕЖИМ ГОТОВКИ ---------- */
let cookState={};
function startCook(id){
  const r=byId(id);cookState={r,i:0};$('#cook').classList.add('on');document.body.style.overflow='hidden';
  try{navigator.wakeLock&&navigator.wakeLock.request('screen').catch(()=>{})}catch(e){}
  drawCook();
}
function drawCook(){
  const {r,i}=cookState;const n=r.steps.length;
  $('#cook').innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div><div class="eyebrow">${r.em} ${esc(r.name)}</div></div><button class="ibtn" onclick="endCook()">✕</button></div>
  <div class="bar"><i style="width:${(i+1)/n*100}%"></i></div>
  <div class="cb"><div><small>Шаг ${i+1} из ${n}</small><p>${esc(r.steps[i])}</p><div style="margin-top:22px">${timerBtn(r.steps[i])}</div></div></div>
  <div class="ctl"><button class="btn" ${i===0?'disabled style="opacity:.4"':''} onclick="cookMove(-1)">← Назад</button><button class="btn" onclick="cookIng()">🧾 Ингредиенты</button><button class="btn gold" onclick="${i===n-1?'endCook(true)':'cookMove(1)'}">${i===n-1?'Готово! 🎉':'Далее →'}</button></div>`;
}
function cookMove(d){cookState.i=Math.max(0,Math.min(cookState.r.steps.length-1,cookState.i+d));drawCook()}
function cookIng(){const r=cookState.r;openModal('Ингредиенты',`<ul class="ing">${r.ing.map(i=>`<li style="cursor:default"><span>${esc(i.n)}</span><b>${ingStr(i,curServ/r.serv)}</b></li>`).join('')}</ul>`);$('#modal').style.zIndex=120}
function endCook(done){$('#cook').classList.remove('on');document.body.style.overflow='';$('#modal').style.zIndex='';if(done)toast('Приятного аппетита! 🍽️')}
document.addEventListener('keydown',e=>{if($('#cook').classList.contains('on')){if(e.key==='ArrowRight')cookMove(1);if(e.key==='ArrowLeft')cookMove(-1);if(e.key==='Escape')endCook()}else if(e.key==='Escape')closeModal()});


VIEWS.recipes=vRecipes;VIEWS.r=vRecipe;
