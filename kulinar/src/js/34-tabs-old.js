/* ===== ВКЛАДКИ (перенесены из первой версии) ===== */
let stoveLv=6;
function tabStove(w){
    w.innerHTML=`<p class="muted" style="max-width:780px">Двухконфорочная плитка с регулятором от 0 до 9 — всё, что нужно, чтобы готовить как в ресторане. Выберите уровень и посмотрите, что на нём готовят.</p>
    <div class="dial" id="dial">${STOVE_LEVELS.map(l=>`<button data-l="${l[0]}"><b>${l[0]}</b><small>${l[1].split(' ')[0]}</small></button>`).join('')}</div><div id="dd2" class="dial-d"></div>
    <div class="sec-h"><h2>Что и сколько готовить</h2></div>
    <input class="field" id="st" placeholder="Фильтр: рис, стейк, яйца…" style="max-width:320px;margin-bottom:12px">
    <div class="tbl-w"><table class="t" id="stt"></table></div>
    <div class="sec-h"><h2>Две конфорки: планы приготовления</h2></div>
    ${STOVE_PLANS.map((p,i)=>`<div class="acc ${i===0?'open':''}"><button onclick="accToggle(this)"><span class="e">🔥</span><div><h3>${p.n}</h3><small>${p.t}</small></div></button><div class="ab"><ol class="timeline">${p.s.map(x=>`<li>${x}</li>`).join('')}</ol></div></div>`).join('')}
    <div class="sec-h"><h2>Как работает плита</h2></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${STOVE_NOTES.map(n=>`<div class="panel"><h3>${n[0]}</h3><p class="muted">${n[1]}</p></div>`).join('')}</div>
    <div class="sec-h"><h2>Кухня в однушке</h2></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${STUDIO_TIPS.map(n=>`<div class="panel"><h3>${n[0]}</h3><p class="muted">${n[1]}</p></div>`).join('')}</div>
    <div class="sec-h"><h2>Подходящая посуда</h2></div>
    <div class="tbl-w"><table class="t"><tr><th>Посуда</th><th>Особенности</th><th>Для чего</th></tr>${PANS.map(p=>`<tr><td><b>${p[0]}</b></td><td>${p[1]}</td><td>${p[2]}</td></tr>`).join('')}</table></div>
    <div class="sec-h"><h2>Рецепты только на плите</h2><a href="#/recipes?col=stove">Все →</a></div><div class="grid">${collRecipes(COLLECTIONS.find(c=>c.id==='stove')).slice(0,8).map(card).join('')}</div>`;
    const showL=l=>{const d=STOVE_LEVELS[l];stoveLv=l;const e=$('#dd2');e.style.setProperty('--lc',d[3]);e.innerHTML=`<div class="eyebrow">Уровень ${d[0]} из 9</div><h3 style="margin:8px 0">${d[1]}</h3><p style="font-size:16px">${d[2]}</p>`;document.querySelectorAll('#dial button').forEach((b,i)=>b.classList.toggle('on',i===l))};
    showL(stoveLv);$('#dial').onclick=e=>{const b=e.target.closest('button');if(b)showL(+b.dataset.l)};
    const drawT=q=>{$('#stt').innerHTML='<tr><th>Продукт</th><th>Способ</th><th>Старт</th><th>Дальше</th><th>Время</th><th>Подсказка</th></tr>'+STOVE_TIMES.filter(r=>norm(r.join(' ')).includes(norm(q))).map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td class="muted">${r[5]}</td></tr>`).join('')};
    drawT('');$('#st').oninput=e=>drawT(e.target.value);
}

function tabGrains(w){
    w.innerHTML=`<p class="muted" style="max-width:780px">Крупы и бобовые — основа питания. Таблица: калорийность сухого продукта на 100 г, гликемический индекс готового продукта, пропорция «крупа : жидкость», время варки.</p>
    <input class="field" id="gq" placeholder="Найти крупу…" style="max-width:320px;margin:14px 0"><div class="tbl-w"><table class="t" id="gtt"></table></div>
    <div class="sec-h"><h2>Общие правила варки круп</h2></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${[['Промывайте','Рис, пшено, киноа — до прозрачной воды: уходит лишний крахмал и горечь.'],['Считайте пропорции','Объём воды к объёму крупы. Лучше стакан-мерка, чем «на глаз».'],['Крышка закрыта','Пока крупа томится, крышку не открываем — пар работает.'],['Отдых','После выключения 10 минут под крышкой — крупа «дойдёт» и станет рассыпчатой.'],['Соль и жир','Соль — в начале (1 ч. л. на 200 г крупы), масло — в конце для блеска.'],['Подбирайте ГИ','Крупы с низким ГИ дольше насыщают: гречка, перловка, бурый рис, овсянка.']].map(n=>`<div class="panel"><h3>${n[0]}</h3><p class="muted">${n[1]}</p></div>`).join('')}</div>`;
    const dr=q=>{$('#gtt').innerHTML='<tr><th>Крупа</th><th>Ккал/100 г</th><th>ГИ</th><th>Пропорция</th><th>Время</th><th>Особенности</th></tr>'+GRAINS.filter(r=>norm(r.join(' ')).includes(norm(q))).map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td class="muted">${r[5]}</td></tr>`).join('')};
    dr('');$('#gq').oninput=e=>dr(e.target.value);
}

function tabPantry(w){
    w.innerHTML=`<p class="muted" style="max-width:780px">Что чем является и на что влияет: соль, перец, масла, кислоты, сахара, специи, зелень, сыры, мука. Откройте группу — внутри таблица «что это / как использовать».</p>
    <div style="margin-top:18px">${PANTRY.map((g,i)=>`<div class="acc ${i===0?'open':''}"><button onclick="accToggle(this)"><span class="e">${g.e}</span><div><h3>${g.g}</h3><small>${g.items.length} позиций</small></div></button><div class="ab"><p>${g.intro}</p><div class="tbl-w" style="margin-top:12px"><table class="t"><tr><th>Позиция</th><th>Что это</th><th>Как влияет / применять</th></tr>${g.items.map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="muted">${r[2]}</td></tr>`).join('')}</table></div><div class="tip"><b>Важно.</b> ${g.tip}</div></div></div>`).join('')}</div>`;
}

function tabFry(w){
    w.innerHTML=`<p class="muted" style="max-width:780px">Жарка — это не «поставить на огонь». Это управление температурой, влагой и жиром. Пять температурных этапов и десять правил превратят любую сковороду в инструмент шефа.</p>
    <div class="sec-h"><h2>Температурные ступени</h2></div><ul class="timeline">${TEMP_STAGES.map(t=>`<li><b style="color:var(--gold2)">${t[0]}</b> — ${t[1]}</li>`).join('')}</ul>
    <div class="sec-h"><h2>10 правил жарки</h2></div>${FRY_RULES.map((r,i)=>`<div class="acc ${i<2?'open':''}"><button onclick="accToggle(this)"><h3>${r[0]}</h3></button><div class="ab">${r[1]}</div></div>`).join('')}
    <div class="sec-h"><h2>Температура дымления масел</h2></div><div class="tbl-w"><table class="t"><tr><th>Масло</th><th>Характер</th><th>Когда применять</th></tr>${PANTRY[2].items.map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="muted">${r[2]}</td></tr>`).join('')}</table></div>
    <div class="sec-h"><h2>Какая сковорода для чего</h2></div><div class="tbl-w"><table class="t"><tr><th>Посуда</th><th>Особенности</th><th>Для чего</th></tr>${PANS.map(p=>`<tr><td><b>${p[0]}</b></td><td>${p[1]}</td><td>${p[2]}</td></tr>`).join('')}</table></div>
    <div class="sec-h"><h2>Здоровая жарка</h2></div><div class="panel"><ul style="padding-left:20px;display:grid;gap:8px"><li>Масла хватает на 1 ч. л. на порцию — не заливайте до половины.</li><li>Не доводите масло до дыма; если дымит — остановите и начните заново.</li><li>Мясо и рыбу маринуйте с лимоном и травами — снижает образование вредных соединений на гриле.</li><li>Срезайте подгоревшие участки; не ешьте обугленное.</li><li>Крахмалистые продукты (картофель) не доводите до тёмно-коричневого: акриламид.</li><li>Для здоровья чередуйте жарку с варкой, тушением и запеканием.</li></ul></div>`;
}

function tabHarm(w){
    w.innerHTML=`<div class="tip" style="margin:0 0 24px"><b>Важно.</b> Это образовательный справочник на основе рекомендаций ВОЗ, IARC и WCRF; он не заменяет консультацию врача или диетолога. Вредность определяется количеством и частотой — «запрещённых» продуктов почти нет.</div>
    <div class="sec-h" style="margin-top:20px"><h2>Светофор продуктов</h2></div><div class="chips" id="hf" style="margin-bottom:14px"><button class="pill on" data-s="0">Все</button><button class="pill" data-s="5">🟢 Очень полезно</button><button class="pill" data-s="4">🟢 Полезно</button><button class="pill" data-s="3">🟡 Умеренно</button><button class="pill" data-s="2">🟠 Ограничивать</button><button class="pill" data-s="1">🔴 Минимизировать</button></div>
    <div class="panel" id="hl"></div>
    <div class="sec-h"><h2>Что самое вредное — разбор</h2></div>${WORST.map((r,i)=>`<div class="acc ${i<2?'open':''}"><button onclick="accToggle(this)"><span class="e" style="font-family:var(--serif);color:#d1553a;font-weight:700">${i+1}</span><h3>${r[0]}</h3></button><div class="ab">${r[1]}</div></div>`).join('')}
    <div class="sec-h"><h2>Способы приготовления: от полезных к вредным</h2></div><div class="panel">${COOK_HEALTH.map(r=>`<div class="tl-row"><b>${r[0]}</b><span>${dots(r[1],'green')}</span><span class="muted">${r[2]}</span></div>`).join('')}</div>
    <div class="sec-h"><h2>Как сохранить пользу при готовке</h2></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${[['Не переваривайте овощи','Витамин C и B разрушаются при длительном нагреве и уходят в воду. Готовьте на пару или в малом объёме воды, бульон используйте.'],['Жиры помогают усвоению','Витамины A, D, E, K и каротиноиды (морковь, томаты) лучше усваиваются с каплей масла.'],['Томаты — в тепле','Ликопин в томатах усваивается лучше после нагрева с маслом.'],['Чеснок — отдохнуть','Раздавите и подождите 10 минут: активируется аллицин.'],['Цельные продукты','Цельные зёрна и овощи с кожурой сохраняют клетчатку и микроэлементы.'],['Кислота и железо','Витамин C (лимон, перец) улучшает усвоение железа из растительных продуктов.']].map(n=>`<div class="panel"><h3>${n[0]}</h3><p class="muted">${n[1]}</p></div>`).join('')}</div>`;
    const dh=s=>{$('#hl').innerHTML=HEALTH_FOODS.filter(r=>!s||r[1]===s).map(r=>`<div class="tl-row"><b>${r[0]}</b><span class="score">${dots(r[1],r[1]>=4?'green':r[1]<=2?'red':'')}</span><span class="muted">${r[2]}</span></div>`).join('')};
    dh(0);$('#hf').onclick=e=>{const b=e.target.closest('[data-s]');if(!b)return;document.querySelectorAll('#hf .pill').forEach(x=>x.classList.remove('on'));b.classList.add('on');dh(+b.dataset.s)};
}

function tabTips(w){
    w.innerHTML=`<p class="muted" style="max-width:780px">Приёмы, которые отделяют хорошего повара от отличного. Выберите тему.</p><div style="margin-top:18px">${TIPS.map((g,i)=>`<div class="acc ${i<2?'open':''}"><button onclick="accToggle(this)"><span class="e">${g.e}</span><div><h3>${g.g}</h3><small>${g.t.length} фишек</small></div></button><div class="ab"><ul style="padding-left:20px;display:grid;gap:8px;margin-top:6px">${g.t.map(x=>`<li>${x}</li>`).join('')}</ul></div></div>`).join('')}</div>`;
}
