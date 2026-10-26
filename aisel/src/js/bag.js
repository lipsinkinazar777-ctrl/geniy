/* ============================================================ the leather bag on the table: today's pages, acorns, stickers, settings */
(() => {
  let el;
  const mod = A.mods.bag = {
    init(root) {
      el = root;
      root.innerHTML = `<div class="wrap"><div data-rise><div class="eyebrow">сумка принцессы</div><h1 class="h1">Мои <em>мелочи</em></h1><p class="sub">Страницы за сегодня, желуди и стикеры для открыток.</p></div>
        <div id="goalMount" data-rise style="margin-top:22px"></div>
        <div class="bagrow" data-rise><button class="bagit" id="bgAc"><span>Желуди и стикеры</span><b><span id="acornN">0</span></b></button><button class="bagit" id="bgSet"><span>Настройки и копия</span><svg class="ico" viewBox="0 0 24 24"><use href="#i-sound"/></svg></button></div>
        <p class="sub bagnote" data-rise>Дней подряд: <b id="streakN">0</b></p><div style="height:40px"></div></div>`;
      A.goal.mount(A.$('#goalMount', root));
      A.$('#bgAc', root).addEventListener('click', () => { A.snd.tap(); A.goal.acornSheet(); });
      A.$('#bgSet', root).addEventListener('click', () => { A.snd.tap(); A.settings(); });
      A.refreshHud();
    },
    show() { A.rise(el); mod.refreshGoal(); A.goal.animateIn(); },
    refreshGoal() { A.goal.refresh(); }
  };
  A.mods.path && (A.mods.path.acornSheet = () => A.goal.acornSheet());
})();
