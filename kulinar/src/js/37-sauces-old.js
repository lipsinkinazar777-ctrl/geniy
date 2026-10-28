/* ===== СОУСЫ ===== */
/* ---------- СОУСЫ ---------- */
function tabSaucesPage(el){
  el.innerHTML=`<p class="muted" style="max-width:780px">Соус превращает хороший продукт в блюдо. Начните с пяти материнских соусов — из них рождаются сотни других. Ниже — семейства соусов и рецепты: от цацики и хумуса до красновинного соуса к стейку.</p>
  <div class="sec-h"><h2>Пять материнских соусов</h2></div>
  ${MOTHER_SAUCES.map(s=>`<div class="acc"><button onclick="accToggle(this)"><span class="e">${s.e}</span><div><h3>${s.n}</h3><small>${s.base}</small></div></button><div class="ab"><p>${s.h}</p><div class="kv"><b>Для чего</b><span>${s.use}</span><b>Производные</b><span>${s.deriv}</span></div></div></div>`).join('')}
  <div class="sec-h"><h2>Семейства соусов</h2></div>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">${SAUCE_FAMILIES.map(f=>`<div class="panel"><h3 style="font-size:19px;color:var(--gold2)">${f[0]}</h3><p class="muted" style="font-size:14px">${f[1]}</p></div>`).join('')}</div>
  <div class="sec-h"><h2>Рецепты соусов</h2></div>
  <div class="grid">${RECIPES.filter(r=>r.cat==='sauce').map(card).join('')}</div>`;
}

