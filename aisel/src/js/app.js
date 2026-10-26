/* ============================================================ boot: gate (title over the dark room) -> walk into the room -> the fire lights */
(() => {
  const $ = A.$;
  A.load(); A.txt.migrate();
  if (!A.state.books.length && !A.state.quotes.length && A.state.samples) A.seed();
  A.scene.init(); A.scene.start();
  let entered = false;
  function enter() {
    if (entered) return; entered = true;
    A.snd.unlock(); A.snd.setMood('room'); A.snd.chime([392, 523.25, 659.25, 783.99], .16, .9);
    const first = !A.state.introSeen; A.state.introSeen = true; A.save();
    $('#gate').classList.add('out'); document.body.classList.add('ui');
    A.ui.enterApp(first);
    setTimeout(() => { $('#gate').hidden = true; }, 1800);
    setTimeout(() => { const h = $('#hint'); h.textContent = first ? 'Проведи пальцем, чтобы осмотреться. Коснись любого предмета.' : ''; h.classList.add('on'); setTimeout(() => h.classList.remove('on'), 6500); }, 3800);
  }
  $('#gateBtn').addEventListener('click', enter);
  $('#gateBtn').addEventListener('pointermove', e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', (e.clientX - r.left) / r.width * 100 + '%'); });
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  A.debug = { enter };
})();
