/* ===== СТЕЙКИ ===== */
/* ---------- СТЕЙКИ ---------- */
function tabSteaks(el){
  const beef=WIKI_MEAT[0];
  el.innerHTML=`<div class="hero sm"><div class="hb" data-bg="steak-garlic-butter" data-w="960"></div><div class="hi"><div class="eyebrow">Школа стейков</div><div class="hh">Идеальный стейк <em>за 9 шагов</em></div><p>Выбор отруба, степень прожарки, температура, метод — всё, что нужно, чтобы готовить стейки как в лучших стейкхаусах.</p></div></div>
  <div class="sec-h"><h2>Степень прожарки</h2></div>
  <div class="done-wrap"><div class="dn" id="dn">${DONENESS.map((d,i)=>`<button class="pill ${i===2?'on':''}" data-i="${i}">${d.n}</button>`).join('')}</div>
   <div class="steakviz" id="sv"></div><div id="sd"></div>
   <div style="overflow-x:auto;margin-top:18px"><table class="t"><tr><th>Степень</th><th>Внутр. t° (снять)</th><th>После отдыха</th><th>Описание</th></tr>${DONENESS.map(d=>`<tr><td><b>${d.n}</b></td><td>${d.tr} °C</td><td>${d.t} °C</td><td class="muted">${d.d}</td></tr>`).join('')}</table></div></div>
  <div class="sec-h"><h2>9 правил идеального стейка</h2></div>
  <div>${STEAK_RULES.map((r,i)=>`<div class="acc ${i<2?'open':''}"><button onclick="accToggle(this)"><span class="e" style="font-family:var(--serif);color:var(--gold);font-weight:800">${i+1}</span><h3>${r[0]}</h3></button><div class="ab">${r[1]}</div></div>`).join('')}</div>
  <div class="sec-h"><h2>Отрубы говядины для стейков</h2></div>
  <p class="muted" style="margin-bottom:6px">${beef.intro}</p><div class="cutlist">${beef.cuts.map(c=>`<div class="cut"><h4>${c[0]}</h4><p>${c[1]}</p><em>🔥 ${c[2]}</em></div>`).join('')}</div>
  <div class="sec-h"><h2>Методы приготовления</h2></div>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">${STEAK_METHODS.map(m=>`<div class="panel"><h3 style="font-size:19px">${m[0]}</h3><p class="muted" style="font-size:14px">${m[1]}</p><p style="margin-top:8px;color:var(--gold2);font-size:13px">${m[2]}</p></div>`).join('')}</div>
  <div class="sec-h"><h2>Мраморность и выдержка</h2></div>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${MARBLING.map(m=>`<div class="panel"><h3 style="font-size:19px;color:var(--gold2)">${m[0]}</h3><p class="muted" style="font-size:14px">${m[1]}</p></div>`).join('')}</div>
  <div class="sec-h"><h2>Рецепты стейков</h2><a href="#/recipes?cat=steak">Все →</a></div>
  <div class="grid">${RECIPES.filter(r=>r.cat==='steak').map(card).join('')}</div>
  <div class="sec-h"><h2>Соусы к стейку</h2></div>
  <div class="grid">${['bearnaise','red-wine-sauce','steak-au-poivre','chimichurri','mushroom-cream','bbq'].map(byId).map(card).join('')}</div>`;
  const show=i=>{const d=DONENESS[i];const sv=$('#sv');
   sv.style.background=`radial-gradient(ellipse at center,${d.c} 0 45%,color-mix(in srgb,${d.c} 55%,#7a4a2a) 70%,#5a3318 100%)`;
   $('#sd').innerHTML=`<h3 style="font-size:26px">${d.n} — <span style="color:var(--gold2)">${d.t} °C</span></h3><p class="muted">${d.d}</p><p style="margin-top:6px">⏱ Примерное время (2,5–3 см): <b>${d.time}</b> с каждой стороны</p>`;
   document.querySelectorAll('#dn .pill').forEach((b,j)=>b.classList.toggle('on',j===i))};
  show(2);$('#dn').onclick=e=>{const b=e.target.closest('[data-i]');if(b)show(+b.dataset.i)};
}

