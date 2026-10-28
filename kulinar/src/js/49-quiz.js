/* ===== ТЕСТЫ (викторины) ===== */
const QUIZ={};   // id -> {title, pass:0..1, q:[{q,o:[],a:idx,why}]}
const QZ={};     // состояние прохождения
function quizBox(id){
  const z=QUIZ[id];if(!z)return'';const best=S.quiz[id];
  return `<div class="qz panel" id="qz-${id}"><div class="eyebrow">Тест</div><h3 style="margin:8px 0">${esc(z.title)}</h3>
   <p class="muted">${z.q.length} вопросов · для зачёта нужно ${Math.ceil(z.q.length*(z.pass||.7))} правильных${best?` · ваш лучший результат: <b style="color:var(--gold2)">${best.best}/${z.q.length}</b>${best.ok?' ✓ сдано':''}`:''}</p>
   <button class="btn gold" onclick="quizStart('${id}')">${best?'Пройти ещё раз':'Начать тест'}</button></div>`;
}
function quizStart(id){QZ[id]={i:0,score:0,sel:null};quizDraw(id)}
function quizDraw(id){
  const z=QUIZ[id],st=QZ[id],box=$('#qz-'+id);if(!box||!st)return;
  if(st.i>=z.q.length){
    const need=Math.ceil(z.q.length*(z.pass||.7));const ok=st.score>=need;
    const prev=S.quiz[id];if(!prev||st.score>prev.best||(ok&&!prev.ok)){S.quiz[id]={best:Math.max(st.score,prev?prev.best:0),ok:ok||(prev&&prev.ok)||false};save('quiz')}
    box.innerHTML=`<div class="eyebrow">Результат</div><div class="big-n" style="margin:10px 0">${st.score}<small style="font-size:22px;color:var(--mut)"> / ${z.q.length}</small></div>
     <p style="font-size:17px">${ok?'<b style="color:#7fc99a">Тест сдан! 🎉</b> Отличный результат — это засчитано в ваш прогресс.':'Пока не хватает до зачёта ('+need+' правильных). Перечитайте раздел и попробуйте ещё раз — это нормально.'}</p>
     <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><button class="btn gold" onclick="quizStart('${id}')">Пройти ещё раз</button><button class="btn" onclick="render()">Закрыть</button></div>`;
    if(ok)toast('Тест сдан: '+z.title);
    return;
  }
  const q=z.q[st.i];
  box.innerHTML=`<div class="qh"><div class="eyebrow">Вопрос ${st.i+1} из ${z.q.length}</div><div class="qbar"><i style="width:${st.i/z.q.length*100}%"></i></div></div>
   <h3 style="margin:14px 0 14px;font-size:26px">${esc(q.q)}</h3>
   <div class="qo">${q.o.map((o,k)=>`<button class="qopt" data-k="${k}" onclick="quizPick('${id}',${k})">${esc(o)}</button>`).join('')}</div><div id="qwhy-${id}"></div>`;
}
function quizPick(id,k){
  const z=QUIZ[id],st=QZ[id];if(st.sel!==null&&st.sel!==undefined&&st.locked)return;
  const q=z.q[st.i];st.locked=true;st.sel=k;const good=k===q.a;if(good)st.score++;
  $$('#qz-'+id+' .qopt').forEach((b,i)=>{b.disabled=true;if(i===q.a)b.classList.add('good');else if(i===k)b.classList.add('bad')});
  $('#qwhy-'+id).innerHTML=`<div class="tip" style="margin-top:14px"><b>${good?'Верно!':'Не совсем.'}</b> ${esc(q.why||'')}</div><div style="margin-top:12px"><button class="btn gold sm" onclick="quizNext('${id}')">${st.i+1>=z.q.length?'Посмотреть результат':'Дальше →'}</button></div>`;
}
function quizNext(id){const st=QZ[id];st.i++;st.sel=null;st.locked=false;quizDraw(id)}
const quizPassed=id=>!!(S.quiz[id]&&S.quiz[id].ok);
