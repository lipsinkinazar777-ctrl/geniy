/* ===== ПИТАНИЕ И КАЛОРИИ ===== */
/* ---------- ПИТАНИЕ ---------- */
function tabNutrition(el){
  el.innerHTML=`<div class="hero sm"><div class="hi"><div class="eyebrow">Правильное питание</div><div class="hh">Как это работает — <em>просто</em></div><p>Без диет и мифов: энергия, белки-жиры-углеводы, баланс тарелки, режим и привычки. Прочитайте — и вы будете понимать свои решения на кухне.</p><div class="row"><a class="btn gold" href="#/health/calc">Рассчитать мои калории</a></div></div></div>
  <div class="sec-h"><h2>Тарелка идеального обеда</h2></div>
  <div class="two"><div class="panel" style="display:grid;place-items:center"><svg viewBox="0 0 200 200" width="280" height="280"><circle cx="100" cy="100" r="92" fill="var(--card2)" stroke="var(--line)" stroke-width="3"/><path d="M100 100 L100 18 A82 82 0 0 1 100 182 Z" fill="#5fae7e"/><path d="M100 100 L100 182 A82 82 0 0 1 18 100 Z" fill="#d1553a"/><path d="M100 100 L18 100 A82 82 0 0 1 100 18 Z" fill="#d9ae5f"/><text x="150" y="104" text-anchor="middle" fill="#fff" font-size="13" font-weight="700">Овощи 50%</text><text x="62" y="152" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">Белок 25%</text><text x="56" y="62" text-anchor="middle" fill="#1a1208" font-size="12" font-weight="700">Крупы 25%</text></svg></div>
   <div class="panel"><h3>Метод тарелки</h3><ul style="padding-left:20px;display:grid;gap:8px;color:var(--mut)"><li><b style="color:#5fae7e">½ овощи и зелень</b> — клетчатка, витамины, объём без лишних калорий.</li><li><b style="color:#d1553a">¼ белок</b> — мясо, рыба, яйца, бобовые, творог.</li><li><b style="color:var(--gold)">¼ сложные углеводы</b> — гречка, рис, киноа, цельнозерновой хлеб, картофель.</li><li>Плюс ложка полезного жира: оливковое масло, орехи, авокадо.</li><li>Порции «ладонью»: белок — ладонь, углеводы — кулак, жиры — большой палец.</li></ul></div></div>
  <div class="sec-h"><h2>Разбор по темам</h2></div>
  ${NUTRITION.map((n,i)=>`<div class="acc ${i===0?'open':''}"><button onclick="accToggle(this)"><span class="e">${n.e}</span><h3>${n.t}</h3></button><div class="ab">${n.p.map(x=>`<p style="margin:8px 0">${x}</p>`).join('')}</div></div>`).join('')}
  <div class="sec-h"><h2>Лёгкие и сбалансированные рецепты</h2><a href="#/recipes?cu=wd">Все →</a></div>
  <div class="grid">${RECIPES.filter(r=>r.cu==='wd'||r.kcal<=350&&r.cat!=='sauce'&&r.cat!=='dessert').slice(0,8).map(card).join('')}</div>`;
}


/* ---------- КАЛОРИИ ---------- */
const today=()=>ymd(new Date());
let diaryDate=today();
function calcTargets(){
  const p=S.prof;const bmr=10*p.w+6.25*p.h-5*p.age+(p.sex==='m'?5:-161);const tdee=bmr*p.act;
  const mult={cut:.8,cutl:.9,keep:1,bulk:1.1}[p.goal];let kcal=Math.round(tdee*mult);
  const prot=Math.round(p.w*(p.goal==='cut'||p.goal==='cutl'?2:p.goal==='bulk'?1.8:1.6));
  const fat=Math.round(kcal*.28/9);const carb=Math.max(0,Math.round((kcal-prot*4-fat*9)/4));
  return{bmr:Math.round(bmr),tdee:Math.round(tdee),kcal,prot,fat,carb,water:Math.round(p.w*33),bmi:+(p.w/Math.pow(p.h/100,2)).toFixed(1)}
}
function bmiLabel(b){return b<18.5?'Недостаток веса':b<25?'Норма':b<30?'Избыточный вес':'Ожирение'}
function dayTotals(d){const items=S.diary[d]||[];return items.reduce((a,i)=>({k:a.k+i.k,p:a.p+(i.p||0),f:a.f+(i.f||0),c:a.c+(i.c||0)}),{k:0,p:0,f:0,c:0})}
function tabCalc(el){
  const p=S.prof;
  el.innerHTML=`  <div class="two" style="margin-top:22px"><div class="panel"><h3>1. Ваши параметры</h3>
   <div class="frm"><label class="full">Пол<div class="seg" id="sx"><button data-v="m" class="${p.sex==='m'?'on':''}">Мужской</button><button data-v="f" class="${p.sex==='f'?'on':''}">Женский</button></div></label>
   <label>Возраст<input class="field" id="pa" type="number" min="14" max="90" value="${p.age}"></label><label>Рост, см<input class="field" id="ph" type="number" min="120" max="230" value="${p.h}"></label>
   <label>Вес, кг<input class="field" id="pw" type="number" min="35" max="250" step="0.1" value="${p.w}"></label>
   <label>Активность<select class="field" id="pact"><option value="1.2">Сидячий образ</option><option value="1.375">Лёгкая (1–3 трен./нед)</option><option value="1.55">Средняя (3–5 трен.)</option><option value="1.725">Высокая (6–7 трен.)</option><option value="1.9">Очень высокая</option></select></label>
   <label class="full">Цель<select class="field" id="pgoal"><option value="cut">Похудение (−20%)</option><option value="cutl">Мягкое похудение (−10%)</option><option value="keep">Поддержание веса</option><option value="bulk">Набор массы (+10%)</option></select></label></div>
   <div id="cres"></div></div>
  <div class="panel"><h3>2. Дневник питания</h3>
   <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px"><button class="ibtn" onclick="diaryNav(-1)">‹</button><input type="date" class="field" id="dd" value="${diaryDate}" style="flex:1"><button class="ibtn" onclick="diaryNav(1)">›</button></div>
   <div id="dsum"></div>
   <div class="sugg" style="margin:14px 0 6px"><input class="field" id="fs" placeholder="🔎 Найти продукт (курица, рис, яблоко…)" autocomplete="off"><div class="list" id="fl" style="display:none"></div></div>
   <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" onclick="diaryRecipeModal()">+ Блюдо из рецептов</button><button class="btn sm" onclick="diaryCustomModal()">+ Свой продукт</button></div>
   <ul class="dl" id="dlist" style="margin-top:12px"></ul></div></div>
  <div class="sec-h"><h2>Калорийность и КБЖУ продуктов (на 100 г)</h2></div>
  <div class="panel"><input class="field" id="ft" placeholder="Фильтр по названию…" style="max-width:320px;margin-bottom:12px"><div style="overflow-x:auto;max-height:480px;overflow-y:auto"><table class="t" id="ftab"></table></div></div>`;
  $('#pact').value=p.act;$('#pgoal').value=p.goal;
  const upd=()=>{S.prof={sex:$('#sx .on').dataset.v,age:+$('#pa').value||30,h:+$('#ph').value||175,w:+$('#pw').value||70,act:+$('#pact').value,goal:$('#pgoal').value};save('prof');drawCalc();drawDiary()};
  ['pa','ph','pw','pact','pgoal'].forEach(i=>$('#'+i).oninput=upd);
  $('#sx').onclick=e=>{const b=e.target.closest('button');if(!b)return;$('#sx .on').classList.remove('on');b.classList.add('on');upd()};
  $('#dd').onchange=e=>{diaryDate=e.target.value||today();drawDiary()};
  const fs=$('#fs'),fl=$('#fl');
  fs.oninput=()=>{const q=norm(fs.value);if(!q){fl.style.display='none';return}const r=FOODS.filter(f=>norm(f.n).includes(q)).slice(0,10);fl.innerHTML=r.map(f=>`<button onclick="diaryFood('${f.id}')"><span>${esc(f.n)}</span><small class="muted">${f.k} ккал/100 г</small></button>`).join('')||'<button><span class="muted">Не найдено</span></button>';fl.style.display='block'};
  fs.onblur=()=>setTimeout(()=>fl.style.display='none',200);
  const drawT=q=>{$('#ftab').innerHTML='<tr><th>Продукт</th><th>Ккал</th><th>Б</th><th>Ж</th><th>У</th></tr>'+FOODS.filter(f=>norm(f.n).includes(norm(q))).map(f=>`<tr><td>${esc(f.n)}</td><td><b>${f.k}</b></td><td>${f.p}</td><td>${f.f}</td><td>${f.c}</td></tr>`).join('')};
  drawT('');$('#ft').oninput=e=>drawT(e.target.value);
  drawCalc();drawDiary();
}
function drawCalc(){
  const t=calcTargets();const goalN={cut:'Похудение',cutl:'Мягкое похудение',keep:'Поддержание',bulk:'Набор массы'}[S.prof.goal];
  $('#cres').innerHTML=`<div style="margin-top:20px;text-align:center"><div class="eyebrow">Ваша цель — ${goalN}</div><div class="big-n" style="margin:8px 0">${t.kcal}<small style="font-size:18px;color:var(--mut)"> ккал/день</small></div></div>
  <div class="res3"><div><b style="color:#d1553a">${t.prot} г</b><span>Белки</span></div><div><b style="color:var(--gold)">${t.fat} г</b><span>Жиры</span></div><div><b style="color:#6f9bd6">${t.carb} г</b><span>Углеводы</span></div></div>
  <div class="res3"><div><b>${t.bmr}</b><span>Базовый обмен</span></div><div><b>${t.tdee}</b><span>Расход за день</span></div><div><b>${t.water} мл</b><span>Вода</span></div></div>
  <p class="muted" style="margin-top:14px;font-size:13px">ИМТ: <b style="color:var(--tx)">${t.bmi}</b> — ${bmiLabel(t.bmi)}. Расчёт ориентировочный; при заболеваниях и беременности проконсультируйтесь с врачом.</p>`;
}
function bar(l,v,max,col,u='г'){const pc=Math.min(100,max?v/max*100:0);return `<div class="mbar"><div class="l"><span>${l}</span><span><b>${Math.round(v)}</b> / ${max} ${u}</span></div><div class="tr"><i style="width:${pc}%;background:${col}"></i></div></div>`}
function drawDiary(){
  const t=calcTargets();const tot=dayTotals(diaryDate);const items=S.diary[diaryDate]||[];
  const R=84,C=2*Math.PI*R;const pc=Math.min(1,tot.k/t.kcal);const over=tot.k>t.kcal;
  $('#dsum').innerHTML=`<div class="ring"><svg width="200" height="200"><circle cx="100" cy="100" r="${R}" fill="none" stroke="var(--bg2)" stroke-width="16"/><circle cx="100" cy="100" r="${R}" fill="none" stroke="${over?'#d1553a':'url(#g)'}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pc)}"/><defs><linearGradient id="g"><stop offset="0" stop-color="#f0cf8e"/><stop offset="1" stop-color="#d9ae5f"/></linearGradient></defs></svg><div class="c"><div><b>${Math.round(tot.k)}</b><span>из ${t.kcal} ккал</span><br><span style="color:${over?'#d1553a':'var(--green)'}">${over?'Перебор '+Math.round(tot.k-t.kcal):'Осталось '+Math.round(t.kcal-tot.k)}</span></div></div></div>
  ${bar('Белки',tot.p,t.prot,'#d1553a')}${bar('Жиры',tot.f,t.fat,'#d9ae5f')}${bar('Углеводы',tot.c,t.carb,'#6f9bd6')}`;
  $('#dlist').innerHTML=items.length?items.map((i,n)=>`<li><span>${esc(i.name)}<small>${i.g?i.g+' г · ':''}${i.s?i.s+' порц. · ':''}Б ${Math.round(i.p||0)} · Ж ${Math.round(i.f||0)} · У ${Math.round(i.c||0)}</small></span><b>${Math.round(i.k)}</b><button class="x" onclick="diaryDel(${n})">✕</button></li>`).join(''):'<div class="muted" style="padding:10px 0">Пока пусто — добавьте продукт или блюдо.</div>';
}
function diaryPush(it){(S.diary[diaryDate]=S.diary[diaryDate]||[]).push(it);save('diary');drawDiary();toast('Добавлено в дневник')}
function diaryDel(n){S.diary[diaryDate].splice(n,1);save('diary');drawDiary()}
function diaryNav(d){diaryDate=ymd(addDays(diaryDate+'T12:00:00',d));$('#dd').value=diaryDate;drawDiary()}
function diaryFood(id){
  const f=FOODS.find(x=>x.id===id);$('#fl').style.display='none';
  openModal(f.n,`<p class="muted">На 100 г: ${f.k} ккал · Б ${f.p} · Ж ${f.f} · У ${f.c}</p><div class="frm" style="margin:14px 0"><label class="full">Масса, г<input class="field" id="gm" type="number" value="100" min="1"></label></div><div id="gpv" class="big-n" style="margin-bottom:14px">${f.k}</div><button class="btn gold" onclick="addFood('${id}')">Добавить в дневник</button>`);
  $('#gm').oninput=e=>$('#gpv').textContent=Math.round(f.k*e.target.value/100)+' ккал';$('#gm').focus();
}
function addFood(id){const f=FOODS.find(x=>x.id===id);const g=+$('#gm').value||100,m=g/100;closeModal();$('#fs').value='';diaryPush({name:f.n,g,k:f.k*m,p:f.p*m,f:f.f*m,c:f.c*m})}
function diaryAddRecipe(id){const r=byId(id);if(!diaryDate)diaryDate=today();diaryDate=today();(S.diary[diaryDate]=S.diary[diaryDate]||[]).push({name:r.name,s:1,k:r.kcal});save('diary');toast('Порция добавлена в дневник на сегодня 🔥')}
function diaryRecipeModal(){
  openModal('Добавить блюдо',`<input class="field" id="drq" placeholder="Поиск рецепта…" style="margin-bottom:10px"><div class="mlist" id="drl"></div>`);
  const draw=q=>{$('#drl').innerHTML=searchRecipes(q).filter(r=>r.cat!=='sauce').slice(0,30).map(r=>`<button onclick="closeModal();diaryPush({name:'${esc(r.name).replace(/'/g,'')}',s:1,k:${r.kcal}})"><span style="font-size:26px">${r.em}</span><div><b>${esc(r.name)}</b><br><small class="muted">${r.kcal} ккал / порция</small></div></button>`).join('')};
  draw('');$('#drq').oninput=e=>draw(e.target.value);
}
function diaryCustomModal(){
  openModal('Свой продукт',`<div class="frm"><label class="full">Название<input class="field" id="cn" placeholder="Например: домашний борщ"></label><label>Ккал<input class="field" id="ck" type="number" min="0"></label><label>Белки, г<input class="field" id="cp" type="number" min="0"></label><label>Жиры, г<input class="field" id="cf" type="number" min="0"></label><label>Углеводы, г<input class="field" id="cc" type="number" min="0"></label></div><p style="margin-top:14px"><button class="btn gold" onclick="addCustom()">Добавить</button></p>`);
}
function addCustom(){const n=$('#cn').value.trim()||'Свой продукт',k=+$('#ck').value;if(!k){toast('Укажите калории');return}closeModal();diaryPush({name:n,k,p:+$('#cp').value||0,f:+$('#cf').value||0,c:+$('#cc').value||0})}

