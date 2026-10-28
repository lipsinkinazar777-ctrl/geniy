/* ===== ЗНАНИЯ: старые вкладки ===== */
function tabWikiPasta(w){
    w.innerHTML=`<p class="muted" style="margin-bottom:14px;max-width:760px">В Италии насчитывают более 350 форм пасты. Форма определяет, какой соус к ней подходит: длинная и тонкая — к лёгким и маслянистым, трубочки и спирали — к густым и мясным, плоская — к сливочным и рагу.</p>
    <div class="toolbar" style="margin-bottom:14px"><input class="field" id="wp" placeholder="Найти пасту…" style="max-width:320px"></div><div id="wpl"></div>
    <div class="sec-h"><h2>Рецепты с пастой</h2></div><div class="grid">${RECIPES.filter(r=>r.cat==='pasta').map(card).join('')}</div>`;
    const draw=q=>{$('#wpl').innerHTML=WIKI_PASTA.filter(p=>norm(p.n+p.reg+p.form+p.h).includes(norm(q))).map(p=>`<div class="acc"><button onclick="accToggle(this)"><span class="e">${p.e}</span><div><h3>${p.n}</h3><small>${p.form} · ${p.reg}</small></div></button><div class="ab"><p>${p.h}</p><div class="kv"><b>Соусы</b><span>${p.s}</span><b>Варка</b><span>${p.c}</span></div></div></div>`).join('')||'<div class="empty">Не найдено</div>'};
    draw('');$('#wp').oninput=e=>draw(e.target.value);
}

function tabWikiMeat(w){
    w.innerHTML=WIKI_MEAT.map((g,i)=>`<div class="acc ${i===0?'open':''}"><button onclick="accToggle(this)"><span class="e">${g.e}</span><div><h3>${g.g}</h3><small>${g.cuts.length} отрубов</small></div></button><div class="ab"><p>${g.intro}</p><div class="cutlist">${g.cuts.map(c=>`<div class="cut"><h4>${c[0]}</h4><p>${c[1]}</p><em>🔥 ${c[2]}</em></div>`).join('')}</div></div></div>`).join('')+
    `<div class="sec-h"><h2>Как читать качество мяса</h2></div><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${MARBLING.map(m=>`<div class="panel"><h3 style="font-size:19px;color:var(--gold2)">${m[0]}</h3><p class="muted" style="font-size:14px">${m[1]}</p></div>`).join('')}</div>
    <div class="sec-h"><h2>Безопасные температуры</h2></div><div class="panel"><table class="t"><tr><th>Продукт</th><th>Температура внутри</th></tr><tr><td>Говядина, баранина (стейки)</td><td>от 52 °C (rare) до 71 °C</td></tr><tr><td>Свинина</td><td>63 °C + отдых 3 мин</td></tr><tr><td>Фарш (любой)</td><td>71 °C</td></tr><tr><td>Птица (курица, индейка)</td><td>74 °C</td></tr><tr><td>Утиная грудка</td><td>57 °C (розовая) — 74 °C</td></tr><tr><td>Рыба</td><td>50–60 °C</td></tr></table></div>
    <div class="sec-h"><h2>Рецепты с мясом</h2></div><div class="grid">${RECIPES.filter(r=>r.cat==='meat').map(card).join('')}</div>`;
}

function tabWikiSauce(w){
    w.innerHTML=MOTHER_SAUCES.map(s=>`<div class="acc"><button onclick="accToggle(this)"><span class="e">${s.e}</span><div><h3>${s.n}</h3><small>${s.base}</small></div></button><div class="ab"><p>${s.h}</p><div class="kv"><b>Для чего</b><span>${s.use}</span><b>Производные</b><span>${s.deriv}</span></div></div></div>`).join('')+`<div class="sec-h"><h2>Семейства</h2></div><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">${SAUCE_FAMILIES.map(f=>`<div class="panel"><h3 style="font-size:19px;color:var(--gold2)">${f[0]}</h3><p class="muted" style="font-size:14px">${f[1]}</p></div>`).join('')}</div><p style="margin-top:18px"><a class="btn gold" href="#/sauces">Все рецепты соусов →</a></p>`;
}

function tabWikiCuisine(w){
    w.innerHTML=CUISINE_HISTORY.map((c,i)=>{const cu=CUISINES[c.k];return `<div class="acc ${i===0?'open':''}"><button onclick="accToggle(this)"><span class="e">${cu.f}</span><div><h3>${cu.n} кухня</h3><small>история, этапы, особенности</small></div></button><div class="ab"><p>${c.h}</p><ul class="timeline">${c.t.map(x=>`<li>${x}</li>`).join('')}</ul><div class="eyebrow" style="margin-bottom:6px">Особенности</div><ul style="padding-left:20px">${c.d.map(x=>`<li>${x}</li>`).join('')}</ul><p style="margin-top:14px"><a class="btn sm gold" href="#/recipes?cu=${c.k}">Рецепты ${cu.n.toLowerCase()} кухни →</a></p></div></div>`}).join('')+
    `<div class="sec-h"><h2>Истории знаменитых блюд</h2></div><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${[['Карбонара','Возникла в Риме после 1944 года: по одной версии, итальянские повара готовили пасту из американского пайка — яичного порошка и бекона. Первые печатные рецепты — 1950-е.'],['Маргарита','1889 г., Неаполь: пиццайоло Рафаэле Эспозито приготовил пиццу в цветах итальянского флага для королевы Маргариты.'],['Тирамису','Родом из Тревизо: появился в 1960–70-х в ресторане Le Beccherie. Название — «подними меня» (бодрит эспрессо).'],['Цезарь','Цезарь Кардини придумал салат в 1924 г. в Тихуане, когда в ресторане заканчивались продукты.'],['Борщ','Происходит от слова «борщевик» — первое кислое блюдо славян. Свёкла и томаты вошли позже. Борщ — культурное наследие, внесённое ЮНЕСКО в 2022 г.'],['Хачапури','Сыр в тесте — наследие Кавказа. Аджарская «лодочка» символизирует лодку с Чёрного моря: сыр — море, желток — солнце.'],['Крем-брюле','Спорят Франция, Англия и Испания. Французская версия описана в 1691 г. в книге Франсуа Массиало.'],['Котлета по-киевски','Считается изобретением начала XX века в Киеве (отель «Континенталь» и ресторан на Крещатике).']].map(x=>`<div class="panel"><h3 style="font-size:19px;color:var(--gold2)">${x[0]}</h3><p class="muted" style="font-size:14px">${x[1]}</p></div>`).join('')}</div>`;
}

function tabWikiSushi(w){
    w.innerHTML=`<p class="muted" style="max-width:760px;margin-bottom:14px">Суши — это не «сырая рыба», а рис с уксусом. Сырая рыба без риса — сашими. Слово «суси» буквально означает «кислый вкус» — от ферментированной рыбы в рисе.</p>
    <div class="cutlist">${WIKI_SUSHI.map(s=>`<div class="cut"><h4>${s[0]}</h4><p>${s[1]}</p></div>`).join('')}</div>
    <div class="sec-h"><h2>Сырая рыба: безопасность</h2></div><div class="panel"><ul style="padding-left:20px;display:grid;gap:6px"><li>Используйте рыбу «sushi-grade»: заморожена при −20 °C минимум 24 часа или −35 °C 15 часов (паразиты).</li><li>Покупайте у проверенных поставщиков, храните при 0–2 °C.</li><li>Сырую рыбу не рекомендуется беременным и маленьким детям.</li><li>Васаби чаще всего — хрен с горчицей; настоящий — натёртый корень вазаби.</li></ul></div>
    <div class="sec-h"><h2>Рецепты суши и японской кухни</h2></div><div class="grid">${RECIPES.filter(r=>r.cu==='jp').map(card).join('')}</div>`;
}

function tabWikiTech(w){
    w.innerHTML=`<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(290px,1fr))">${TECHNIQUES.map(t=>`<div class="panel"><h3 style="font-size:19px;color:var(--gold2)">${t[0]}</h3><p class="muted" style="font-size:14px">${t[1]}</p></div>`).join('')}</div>
    <div class="sec-h"><h2>Ножи, без которых не обойтись</h2></div><div class="cutlist">${KNIVES.map(k=>`<div class="cut"><h4>${k[0]}</h4><p>${k[1]}</p></div>`).join('')}</div>`;
}
