/* ============================================================ boot: gate -> walk -> finale -> app */
(() => {
  const $ = A.$;
  A.load();
  if (!A.state.books.length && !A.state.quotes.length && A.state.samples) A.seed();
  A.scene.init(); A.scene.start();
  const CAPS = ['Тихо… лес давно ждал тебя', 'Светлячки показывают дорогу', 'Там, за деревьями, виден замок', 'Кто-то читает у тропинки…'];
  let walking = false, capT = [];

  function caption(i) { const c = $('#walkCap'); c.classList.remove('on'); setTimeout(() => { c.textContent = CAPS[i]; c.classList.add('on'); }, 500); }
  function startWalk() {
    if (walking) return; walking = true;
    A.snd.unlock(); A.snd.setMood('path'); A.snd.chime([392, 523.25, 659.25, 783.99], .16, .9);
    $('#gate').classList.add('out'); $('#walk').hidden = false; requestAnimationFrame(() => $('#walk').classList.add('on'));
    const dur = A.state.introSeen ? 5.2 : 10.5;
    A.scene.walk(dur, arrive);
    CAPS.forEach((_, i) => capT.push(setTimeout(() => caption(i), (i * dur / 4.1 + .6) * 1000)));
  }
  function arrive() {
    capT.forEach(clearTimeout); $('#walkCap').classList.remove('on'); $('#walk').classList.remove('on'); setTimeout(() => $('#walk').hidden = true, 1500);
    const fin = $('#finale'); fin.hidden = false; requestAnimationFrame(() => fin.classList.add('on'));
    const t = $('#finTitle'); t.innerHTML = ''; let d = 0;
    const em = document.createElement('em');
    const add = (txt, host, cls) => txt.split(' ').forEach((word, wi, arr) => { const w = document.createElement('span'); w.className = 'w'; [...word].forEach(ch => { const s = document.createElement('span'); s.className = 'l'; s.style.animationDelay = (d += .05) + 's'; s.textContent = ch; w.appendChild(s); }); host.appendChild(w); if (wi < arr.length - 1) host.appendChild(document.createTextNode(' ')); });
    add('Уголок принцессы', t); t.appendChild(em); add('Айсель', em);
    A.snd.chime([523.25, 659.25, 783.99, 1046.5, 1318.5], .2, 1); A.snd.twinkle(2);
    setTimeout(() => fin.classList.add('showbtn'), 1900); A.state.introSeen = true; A.save();
    A.fx.fireflies(innerWidth * .5, innerHeight * .55, 26, 200);
  }
  function enter() {
    $('#finale').classList.remove('on'); setTimeout(() => $('#finale').hidden = true, 1400);
    A.snd.chime([392, 523.25, 659.25, 880, 1174.7], .1, .9); A.fx.sparks(innerWidth / 2, innerHeight * .8, 40);
    A.scene.toUI(); document.body.classList.add('ui');
    A.ui && A.ui.enterApp && A.ui.enterApp();
  }
  $('#gateBtn').addEventListener('click', startWalk);
  $('#walkSkip').addEventListener('click', () => A.scene.skipWalk());
  $('#finBtn').addEventListener('click', enter);
  $('#gateBtn').addEventListener('pointermove', e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', (e.clientX - r.left) / r.width * 100 + '%'); });
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  // debug hooks for tests
  A.debug = { startWalk, arrive, enter };
})();
