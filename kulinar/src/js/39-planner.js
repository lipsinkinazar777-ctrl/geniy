/* ===== ПЛАНЕР ===== */
/* ---------- ПЛАНЕР ---------- */
let weekStart=monday(new Date());
function vPlanner(el){
  const days=[...Array(7)].map((_,i)=>addDays(weekStart,i));const a=days[0],b=days[6];
  const title=`${a.getDate()} ${MONTHS[a.getMonth()]} — ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
  el.innerHTML=`<div class="page-h"><div><div class="eyebrow">Планер</div><h1>Меню на неделю</h1><p>Планируйте завтраки, обеды и ужины, смотрите калории по дням и получайте готовый список покупок.</p></div></div>
  <div class="pl-h"><div class="wknav"><button class="ibtn" onclick="weekNav(-1)">‹</button><b class="wkt">${title}</b><button class="ibtn" onclick="weekNav(1)">›</button><button class="btn sm" onclick="weekStart=monday(new Date());render()">Сегодня</button></div>
   <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="muted" style="font-size:13px">Едоков:</span><div class="stepper"><button onclick="setPeople(-1)">−</button><span>${S.people}</span><button onclick="setPeople(1)">+</button></div><button class="btn sm gold" onclick="autoFill()">✨ Заполнить неделю</button><button class="btn sm" onclick="clearWeek()">Очистить</button></div></div>
  <div class="week">${days.map((d,i)=>{const k=ymd(d);const pl=S.plan[k]||{};let kc=0;
    const slots=MEALS.map(([m,n,e])=>{const arr=pl[m]||[];arr.forEach(x=>{if(x.id){const r=byId(x.id);if(r)kc+=r.kcal}else kc+=x.k||0});
      return `<div class="slot"><div class="sh"><span title="${n}">${n}</span><span class="sbtns"><button class="dicebtn" title="Случайное блюдо" aria-label="Случайное блюдо" onclick="openRandom({meal:'${m}',date:'${k}'})">${ico('dice',15)}</button><button title="Выбрать блюдо" aria-label="Добавить блюдо" onclick="planModal(null,'${k}','${m}')">＋</button></span></div>${arr.map((x,j)=>{const r=x.id?byId(x.id):null;return `<div class="pm"><a ${r?`onclick="go('#/r/${r.id}')"`:''}>${r?r.em+' '+esc(r.name):'📝 '+esc(x.note)}${r?`<small>${r.kcal} ккал</small>`:x.k?`<small>${x.k} ккал</small>`:''}</a><button onclick="planDel('${k}','${m}',${j})">✕</button></div>`}).join('')}</div>`}).join('');
    return `<div class="day ${k===today()?'today':''}"><h4><span>${DOW[i]} <button class="dayrnd" title="Заполнить день случайными блюдами" aria-label="Заполнить день случайными блюдами" onclick="randomDay('${k}')">${ico('dice',14)}</button></span><small>${d.getDate()} ${MONTHS[d.getMonth()]}</small></h4>${slots}<div class="dsum">Итого: <b>${kc}</b> ккал</div></div>`}).join('')}</div>
  <div class="sec-h"><h2>Список покупок</h2><button class="btn sm" onclick="copyShop()">Скопировать</button></div><div class="panel" id="shop"></div>`;
  drawShop();
}
function weekNav(d){weekStart=addDays(weekStart,d*7);render()}
function setPeople(d){S.people=Math.max(1,Math.min(12,S.people+d));save('people');render()}
function planAdd(date,meal,item){const p=(S.plan[date]=S.plan[date]||{});(p[meal]=p[meal]||[]).push(item);save('plan')}
function planDel(d,m,j){S.plan[d][m].splice(j,1);save('plan');render()}
function planModal(rid,date,meal){
  if(rid){const days=[...Array(14)].map((_,i)=>addDays(new Date(),i));
    openModal('Добавить в планер',`<p class="muted" style="margin-bottom:12px">${esc(byId(rid).name)}</p><div class="frm"><label>День<select class="field" id="pd">${days.map(d=>`<option value="${ymd(d)}">${DOW[(d.getDay()+6)%7]}, ${d.getDate()} ${MONTHS[d.getMonth()]}</option>`).join('')}</select></label><label>Приём пищи<select class="field" id="pm">${MEALS.map(m=>`<option value="${m[0]}">${m[1]}</option>`).join('')}</select></label></div><p style="margin-top:16px"><button class="btn gold" onclick="planConfirm('${rid}')">Добавить</button></p>`);return}
  openModal('Что приготовим?',`<div style="display:flex;gap:10px;margin-bottom:10px"><input class="field" id="pq" placeholder="Поиск рецепта…" style="flex:1"><button class="btn sm" onclick="closeModal();openRandom({meal:'${meal}',date:'${date}'})">${ico('dice',16)} Случайное</button></div><div class="mlist" id="pl" style="max-height:44vh;overflow:auto"></div><div style="border-top:1px solid var(--line);margin-top:12px;padding-top:12px;display:flex;gap:8px"><input class="field" id="pn" placeholder="Или заметка (например: ужин в ресторане)"><button class="btn sm" onclick="planNote('${date}','${meal}')">Добавить</button></div>`);
  const draw=q=>{$('#pl').innerHTML=searchRecipes(q).filter(r=>r.cat!=='sauce').slice(0,40).map(r=>`<button onclick="planPick('${date}','${meal}','${r.id}')"><span style="font-size:26px">${r.em}</span><div><b>${esc(r.name)}</b><br><small class="muted">${(CUISINES[r.cu]||{}).n} · ${r.kcal} ккал · ${r.t} мин</small></div></button>`).join('')};
  draw('');$('#pq').oninput=e=>draw(e.target.value);
}
function planConfirm(id){planAdd($('#pd').value,$('#pm').value,{id});closeModal();toast('Добавлено в планер 📅')}
function planPick(d,m,id){planAdd(d,m,{id});closeModal();render()}
function planNote(d,m){const n=$('#pn').value.trim();if(!n)return;planAdd(d,m,{note:n});closeModal();render()}
function clearWeek(){askConfirm('Очистить всю неделю?',()=>{for(let i=0;i<7;i++)delete S.plan[ymd(addDays(weekStart,i))];save('plan');render()})}
function autoFill(){
  const pick=(cats,used)=>{const l=RECIPES.filter(r=>cats.includes(r.cat)&&!used.has(r.id));const pool=l.length?l:RECIPES.filter(r=>cats.includes(r.cat));return pool[Math.floor(Math.random()*pool.length)]};
  const used=new Set();
  for(let i=0;i<7;i++){const k=ymd(addDays(weekStart,i));S.plan[k]=S.plan[k]||{};
   [['b',MEALCATS.b],['l',MEALCATS.l.filter(c=>c!=='meat')],['d',MEALCATS.d]].forEach(([m,c])=>{if(!(S.plan[k][m]||[]).length){const r=pick(c,used);if(r){used.add(r.id);S.plan[k][m]=[{id:r.id}]}}})}
  save('plan');render();toast('Неделя заполнена ✨ — поменяйте под себя');
}
function shopList(){
  const map={};
  for(let i=0;i<7;i++){const pl=S.plan[ymd(addDays(weekStart,i))]||{};
    Object.values(pl).flat().forEach(x=>{if(!x.id)return;const r=byId(x.id);if(!r)return;const k=S.people/r.serv;
      r.ing.forEach(g=>{const key=norm(g.n)+'|'+g.u;(map[key]=map[key]||{n:g.n,u:g.u,q:0}).q+=g.q*k})})}
  return Object.values(map).sort((a,b)=>a.n.localeCompare(b.n,'ru'));
}
function drawShop(){
  const l=shopList();const wk=ymd(weekStart);const ch=S.shop[wk]||[];
  $('#shop').innerHTML=l.length?`<ul class="shop">${l.map(i=>{const key=norm(i.n)+'|'+i.u;const d=ch.includes(key);return `<li class="${d?'done':''}" onclick="shopTick('${wk}',this.dataset.k)" data-k="${esc(key)}"><input type="checkbox" ${d?'checked':''}><span>${esc(i.n)}</span><b>${i.q?fq(i.q)+' '+i.u:'по вкусу'}</b></li>`}).join('')}</ul>`:'<div class="empty"><div class="e">🧺</div><p>Добавьте блюда в планер — список покупок соберётся автоматически.</p></div>';
}
function shopTick(wk,key){const a=S.shop[wk]=S.shop[wk]||[];const i=a.indexOf(key);if(i>=0)a.splice(i,1);else a.push(key);save('shop');drawShop()}
function copyShop(){const t=shopList().map(i=>'• '+i.n+(i.q?' — '+fq(i.q)+' '+i.u:'')).join('\n');if(!t){toast('Список пуст');return}copyText(t,'Список скопирован 📋')}


VIEWS.planner=vPlanner;
