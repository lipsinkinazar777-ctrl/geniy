/* ===== ИСТОЧНИКИ ФОТО ===== */
function vCredits(el){
  const ids=Object.keys(PHOTO_CREDITS);
  const nm=id=>{const r=byId(id);if(r)return r.name;const g=GEAR.find(x=>'gear-'+x.id===id);if(g)return g.name;return id};
  el.innerHTML=`<a class="back" href="#/" onclick="event.preventDefault();goBack()">← Назад</a><div class="page-h"><div><div class="eyebrow">О приложении</div><h1>Источники фото</h1><p>Фотографии блюд принадлежат своим авторам. Часть изображений предоставлена владельцем приложения, часть загружается из Википедии, Wikimedia Commons и TheMealDB — ссылки и лицензии указаны ниже. Приложение личное и некоммерческое.</p></div></div>
  ${ids.length?`<div class="tbl-w" style="margin-top:24px"><table class="t"><tr><th>Блюдо / предмет</th><th>Источник</th><th>Автор</th><th>Лицензия</th></tr>${ids.map(i=>{const c=PHOTO_CREDITS[i];return `<tr><td><b>${esc(nm(i))}</b></td><td>${/^https?:\/\//.test(c[1]||'')?`<a style="color:var(--gold)" data-native href="${esc(c[1])}" target="_blank" rel="noopener noreferrer">${esc(c[0])}</a>`:esc(c[0])}</td><td class="muted">${esc(c[2])}</td><td class="muted">${esc(c[3])}</td></tr>`}).join('')}</table></div>`:'<div class="empty"><p>Пока фотографии подгружаются из Википедии прямо в браузере. Список появится после запуска скрипта tools/fetch_photos.py.</p></div>'}
  <p class="mini" style="margin-top:18px">Изображения, подгружаемые в браузере из Википедии, лицензированы Wikimedia (CC BY-SA, CC BY, общественное достояние) — подробности на странице каждого файла.</p>`;
}
VIEWS.credits=vCredits;
