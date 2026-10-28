/* ===== ГЛАВНАЯ ===== */
function vHome(el){
  const pool=RECIPES.filter(r=>r.cat!=='sauce'&&hasPhoto(r.id));const day=Math.floor(Date.now()/864e5);const dish=pool[day%pool.length]||RECIPES[0];
  const rk=rank();const feat=['resto-cream','salads','su','potato','fast','pizza','meat-grand','ge'].map(id=>COLLECTIONS.find(c=>c.id===id)).filter(Boolean);
  const pr=levelProg(LEVELS[rk.r[3]-1]);
  const sections=[['recipes','01','Рецепты',RECIPES.length+' блюд, '+COLLECTIONS.length+' коллекций, поиск и фильтры'],['school','02','Школа шефа','Курс из 5 уровней, плита 0–9, нарезка, безопасность'],['wiki','03','Знания','Пасты, мясо, соусы, крупы, специи, история'],['health','04','Здоровье','Зачем разбираться в еде, ПП, калории, польза и вред'],['shop','05','Покупки','Приборы с галочками, ножи, закупки на двоих'],['planner','06','Планер недели','Меню, 🎲 случайное блюдо и список покупок'],['my','07','Мой путь','Освоенные блюда, уровни и экзамены'],['school/steaks','08','Школа стейков','Прожарка, отрубы, методы, 12 рецептов']];
  el.innerHTML=`
  <section class="hero"><div class="hb" data-bg="steak-garlic-butter" data-w="960"></div><div class="hi"><div class="eyebrow">Кулинарная академия</div>
   <h1>Готовьте так, чтобы <em>удивлять</em>.</h1>
   <p>${RECIPES.length} рецептов, курс повара из пяти уровней, плита от 0 до 9, школа ножа и стейков, справочник специй и круп, приборы с галочками, закупки на двоих и планер недели.</p>
   <div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn gold" onclick="openRandom()">${ico('dice',18)} Что приготовить сегодня?</button><a class="btn" href="#/recipes">Рецепты</a><a class="btn" href="#/school">Школа шефа</a></div>
   <div class="stats"><div><b data-count="${RECIPES.length}">0</b><span>рецептов</span></div><div><b data-count="${COLLECTIONS.length}">0</b><span>коллекций</span></div><div><b data-count="${WIKI_PASTA.length}">0</b><span>видов пасты</span></div><div><b data-count="${learnedCount()}">0</b><span>вы освоили</span></div></div></div></section>
  <div class="sec-h"><div><div class="eyebrow">Сегодня</div><h2 style="margin-top:8px">Блюдо дня, случайный выбор и ваш уровень</h2></div></div>
  <div class="todayrow">
   <div>${card(dish)}</div>
   <div class="panel dice-panel"><div class="dice-big">${ico('dice',54)}</div><div class="eyebrow">Не знаете, что приготовить?</div><h3 style="font-size:32px;margin:10px 0">Доверьтесь случаю</h3><p class="muted">Выберите приём пищи, время и кухню — приложение само предложит блюдо. Не нравится — крутите ещё.</p><div style="margin-top:16px"><button class="btn gold" onclick="openRandom()">Крутить</button></div></div>
   <a class="panel rank-mini" href="#/level/${rk.r[3]}"><div class="eyebrow">Ваш уровень</div><div style="display:flex;gap:16px;align-items:center;margin:12px 0"><span style="font-size:48px">${rk.r[2]}</span><div><h3 style="font-size:30px">${rk.r[1]}</h3><p class="muted">Что входит в этот уровень →</p></div></div>${ring(pr.pct,100,9)}<p class="mini" style="margin-top:8px">Готовность уровня · очков: ${rk.sc}</p></a>
  </div>
  <div class="sec-h"><h2>Курс повара — 5 уровней</h2><a href="#/school/course">Подробнее →</a></div>
  <div class="lvls-row">${LEVELS.map(L=>{const p=levelProg(L);return `<a class="lvl-chip" href="#/level/${L.id}"><span class="lvl-no sm">${L.id}</span><div><b>${L.e} ${L.n}</b><small>${L.tag}</small><div class="tr"><i style="width:${p.pct}%"></i></div></div></a>`}).join('')}</div>
  <div class="sec-h"><h2>Коллекции</h2><a href="#/recipes">Все рецепты →</a></div>
  <div class="coll">${feat.map(c=>`<a href="#/recipes?col=${c.id}"><span>${collRecipes(c).length} рецептов</span><b>${c.e} ${c.n}</b><small>${c.d}</small></a>`).join('')}</div>
  <div class="sec-h"><h2>Разделы</h2></div>
  <div class="tiles">${sections.map(s=>`<a class="tile" href="#/${s[0]}"><span class="e">${s[1]}</span><div><h3>${s[2]}</h3><p>${s[3]}</p></div></a>`).join('')}</div>
  <div class="sec-h"><h2>Ресторанные пасты</h2><a href="#/recipes?col=resto-cream">Все →</a></div>
  <div class="grid">${['carbonara','pasta-cream-mushroom','bolognese','alfredo','pasta-vodka','cream-shrimp-fettuccine','truffle-pasta','cacioepepe'].map(byId).filter(Boolean).map(card).join('')}</div>
  <div class="sec-h"><h2>Быстро — до 20 минут</h2><a href="#/recipes?col=quick">Все →</a></div>
  <div class="grid">${RECIPES.filter(r=>r.t<=20&&r.cat!=='sauce'&&hasPhoto(r.id)).slice(0,8).map(card).join('')}</div>
  <div class="sec-h"><h2>Для настоящих поваров</h2><a href="#/recipes?col=michelin">Все →</a></div>
  <div class="grid">${['khinkali','beef-wellington','bouillabaisse','confit-canard','bistecca','ossobuco','kyiv-cutlet','ravioli-ricotta'].map(byId).filter(Boolean).map(card).join('')}</div>
  <div class="sec-h"><h2>Кухни мира</h2></div>
  <div class="coll">${Object.entries(CUISINES).filter(([k])=>k!=='wd').map(([k,c])=>`<a href="#/recipes?cu=${k}"><span>${RECIPES.filter(r=>r.cu===k).length} рецептов</span><b>${c.f} ${c.n}</b></a>`).join('')}</div>`;
}
VIEWS['']=vHome;
