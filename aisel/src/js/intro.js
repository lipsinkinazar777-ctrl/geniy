/* ============================================================ the entrance: the flythrough (graveyard, the key, the gate opens, the candlelit hall) with its own sound.
   There is no button: the gate opens by itself and she walks into the room. Sound starts on the first touch (browsers forbid it earlier). */
A.introInit = () => A.intro = (() => {
  const el = A.$('#intro'), v = A.$('#introV'), skip = A.$('#introSkip');
  let done = false, played = false, soundOn = false, tOut = 0;
  const first = !A.state.introSeen;
  const wantSound = () => A.state.settings.sound !== false;

  function finish() {
    if (done) return; done = true; clearTimeout(tOut);
    A.state.introSeen = true; A.save(); el.classList.add('out'); document.body.classList.add('ui');
    A.snd.setMood('room'); if (soundOn) A.snd.chime([392, 523.25, 659.25, 783.99], .16, .9);
    A.ui.enterApp(first);
    setTimeout(() => { try { v.pause(); } catch (e) {} el.hidden = true; }, 1800);
    setTimeout(() => { if (A.tab !== 'room') return; const h = A.$('#hint'); h.textContent = first ? 'Проведи пальцем, чтобы осмотреться. Коснись любого предмета.' : ''; h.classList.add('on'); setTimeout(() => h.classList.remove('on'), 6500); }, 3800);
  }
  function unmute() {
    if (soundOn || !wantSound()) return; soundOn = true; A.snd.unlock();
    try { v.muted = false; v.volume = 1; if (v.paused && !done) v.play().catch(() => {}); } catch (e) {} el.classList.add('snd');
  }
  /* landscape: the film is 9:16, so a tiny live copy of the frame is blurred behind it as ambient light instead of black bars */
  const amb = A.$('#introAmb'), ag = amb.getContext('2d'); let ambT = 0;
  function ambient() {
    if (done) return; requestAnimationFrame(ambient); if (innerWidth <= innerHeight || v.readyState < 2) return;
    const now = performance.now(); if (now - ambT < 60) return; ambT = now;
    const cw = 96, ch = Math.max(30, Math.round(96 * innerHeight / innerWidth)); if (amb.width !== cw || amb.height !== ch) { amb.width = cw; amb.height = ch; }
    const h = ch, w = v.videoWidth * h / v.videoHeight, n = Math.ceil(cw / w / 2) + 1;       // mirrored copies of the frame continue it to both sides, so the strip melts into the screen
    for (let i = -n; i <= n; i++) { ag.save(); ag.translate(cw / 2 + i * w, 0); if (i & 1) ag.scale(-1, 1); ag.drawImage(v, -w / 2, 0, w, h); ag.restore(); }
  }
  function begin() {
    if (played) return; played = true; el.classList.add('play'); ambient();
    setTimeout(() => el.classList.add('skippable'), 2600);
  }
  v.addEventListener('playing', begin);
  v.addEventListener('timeupdate', () => { if (v.currentTime > v.duration - 2.6 && !el.classList.contains('title')) el.classList.add('title'); });
  v.addEventListener('ended', () => { el.classList.add('title'); setTimeout(finish, 2100); });          // hold the last frame (the candlelit hall) with the title, then walk in
  v.addEventListener('error', () => { if (!played) finish(); });
  skip.addEventListener('click', e => { e.stopPropagation(); A.snd.unlock(); finish(); });
  ['pointerdown', 'touchend', 'keydown'].forEach(t => addEventListener(t, () => { A.snd.unlock(); unmute(); }, { capture: true, passive: true }));

  /* start: try with sound (works where the browser allows it), else muted, else wait for the first touch */
  function start() {
    v.muted = !wantSound() ? true : false; v.playsInline = true;
    const p = v.play(); const mute = () => { v.muted = true; return v.play(); };
    if (p && p.then) p.then(() => { if (!v.muted) { soundOn = true; el.classList.add('snd'); } }).catch(() => mute().catch(() => { el.classList.add('play'); const go = () => { v.play().catch(finish); unmute(); }; addEventListener('pointerdown', go, { once: true }); }));
    tOut = setTimeout(() => { if (!played && !el.classList.contains('play')) finish(); }, 9000);          // never a stuck door: no video in 9 s means we simply walk in
  }
  if (!v.canPlayType || (!v.canPlayType('video/mp4') && !v.canPlayType('video/webm'))) finish();
  else if (window.__INTRO) fetch(window.__INTRO).then(r => r.blob()).then(b => { v.src = URL.createObjectURL(b); start(); }).catch(finish);
  else start();
  return { finish, unmute, get done() { return done; } };
})();
