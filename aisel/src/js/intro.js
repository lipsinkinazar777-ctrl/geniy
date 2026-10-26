/* ============================================================ the entrance: the flythrough (graveyard, the key, the gate opens, the candlelit hall) with its own sound.
   There is no button: the gate opens by itself and she walks into the room. Sound starts on the first touch (browsers forbid it earlier).
   Playback has two engines so the door can never silently be skipped:  a <video> of the film, and, if the browser cannot play it, the same film as an image sequence on a canvas with its audio on the side. */
A.introInit = () => A.intro = (() => {
  const el = A.$('#intro'), v = A.$('#introV'), skip = A.$('#introSkip'), sc = A.$('#introSeq'), sg = sc.getContext('2d'), amb = A.$('#introAmb'), ag = amb.getContext('2d');
  const DUR = 11.83, FPS = 12, N = 142, first = !A.state.introSeen, wantSound = () => A.state.settings.sound !== false;
  let done = false, played = false, soundOn = false, seq = false, tStart = 0, tFail = 0, frames = [], audio = null, ended = false, ambT = 0, lastDraw = -1;

  function finish() {
    if (done) return; done = true; clearTimeout(tFail);
    A.state.introSeen = true; A.save(); el.classList.add('out'); document.body.classList.add('ui');
    A.snd.setMood('room'); if (soundOn) A.snd.chime([392, 523.25, 659.25, 783.99], .16, .9);
    A.ui.enterApp(first);
    setTimeout(() => { try { v.pause(); audio && audio.pause(); } catch (e) {} el.hidden = true; }, 1800);
    setTimeout(() => { if (A.tab !== 'room') return; const h = A.$('#hint'); h.textContent = first ? 'Проведи пальцем, чтобы осмотреться. Коснись любого предмета.' : ''; h.classList.add('on'); setTimeout(() => h.classList.remove('on'), 6500); }, 3800);
  }
  function unmute() {
    if (soundOn || !wantSound()) return; soundOn = true; A.snd.unlock(); el.classList.add('snd');
    try { if (seq) { if (audio) { audio.currentTime = Math.min(DUR - .1, clock()); audio.volume = 1; audio.play().catch(() => {}); } } else { v.muted = false; v.volume = 1; if (v.paused && !done) v.play().catch(() => {}); } } catch (e) {}
  }
  const clock = () => seq ? Math.max(0, (performance.now() - tStart) / 1000) : v.currentTime;
  function begin() { if (played) return; played = true; clearTimeout(tFail); el.classList.add('play'); ambient(); setTimeout(() => el.classList.add('skippable'), 2600); }
  const endHold = () => { if (ended) return; ended = true; el.classList.add('title'); setTimeout(finish, 2100); };       // hold the last frame (the candlelit hall) with the title, then walk in

  /* landscape: the film is 9:16, so a tiny live copy of the frame, mirrored to both sides and blurred, is the light around it instead of black bars */
  function ambient() {
    if (done) return; requestAnimationFrame(ambient); if (innerWidth <= innerHeight) return; const src = seq ? sc : v; if (!seq && v.readyState < 2) return;
    const now = performance.now(); if (now - ambT < 60) return; ambT = now;
    const cw = 96, ch = Math.max(30, Math.round(96 * innerHeight / innerWidth)); if (amb.width !== cw || amb.height !== ch) { amb.width = cw; amb.height = ch; }
    const sw = seq ? sc.width : v.videoWidth, sh = seq ? sc.height : v.videoHeight, h = ch, w = sw * h / sh, n = Math.ceil(cw / w / 2) + 1;
    for (let i = -n; i <= n; i++) { ag.save(); ag.translate(cw / 2 + i * w, 0); if (i & 1) ag.scale(-1, 1); ag.drawImage(src, -w / 2, 0, w, h); ag.restore(); }
  }

  /* ---------------- engine 1: the video */
  v.addEventListener('playing', begin);
  v.addEventListener('timeupdate', () => { if (v.currentTime > v.duration - 2.6 && !el.classList.contains('title')) el.classList.add('title'); });
  v.addEventListener('ended', endHold);
  v.addEventListener('error', () => { if (!played) toSeq(); });
  function startVideo() {
    v.muted = !wantSound(); v.playsInline = true;
    tFail = setTimeout(() => { if (!played && v.readyState < 2) toSeq(); }, 4500);                  // nothing is moving after 4.5 s: switch engines
    const p = v.play(), mute = () => { v.muted = true; return v.play(); };
    if (p && p.then) p.then(() => { if (!v.muted) { soundOn = true; el.classList.add('snd'); } }).catch(err => mute().catch(() => {
      if (err && err.name !== 'NotAllowedError') return toSeq();
      el.classList.add('play'); const go = () => { v.play().catch(toSeq); unmute(); }; addEventListener('pointerdown', go, { once: true });  // autoplay is forbidden here: the first touch starts the film
    }));
  }

  /* ---------------- engine 2: image sequence + audio */
  function toSeq() {
    if (seq || done || played) return; seq = true; el.classList.add('seq'); clearTimeout(tFail); try { v.pause(); } catch (e) {}
    const url = i => `video/seq/f${String(i + 1).padStart(3, '0')}.webp`; let next = 0, ok = 0;
    const pull = () => { if (next >= N) return; const i = next++, im = new Image(); im.onload = () => { frames[i] = im; ok++; if (ok === 10 && !tStart) { tStart = performance.now(); el.classList.add('play'); begin(); requestAnimationFrame(tick); } pull(); }; let tr = 0; im.onerror = () => { if (++tr <= 3) setTimeout(() => { im.src = url(i) + '?r=' + tr; }, 300 * tr); else pull(); }; im.src = url(i); };
    for (let k = 0; k < 6; k++) pull();
    audio = new Audio('video/intro.mp3'); audio.preload = 'auto';
    tFail = setTimeout(() => { if (!tStart) finish(); }, 6000);                                         // not even the stills arrive: walk in anyway
  }
  function tick() {
    if (done) return; requestAnimationFrame(tick); const t = (performance.now() - tStart) / 1000, i = Math.min(N - 1, Math.floor(t * FPS));
    if (t > DUR - 2.6) el.classList.add('title'); if (t >= DUR) endHold();
    let j = i; while (j > 0 && !frames[j]) j--; if (!frames[j] || j === lastDraw) return; lastDraw = j;
    const im = frames[j]; if (sc.width !== im.naturalWidth) { sc.width = im.naturalWidth; sc.height = im.naturalHeight; } sg.drawImage(im, 0, 0);
  }

  skip.addEventListener('click', e => { e.stopPropagation(); A.snd.unlock(); finish(); });
  ['pointerdown', 'touchend', 'keydown'].forEach(t => addEventListener(t, () => { A.snd.unlock(); unmute(); }, { capture: true, passive: true }));

  if (!v.canPlayType || (!v.canPlayType('video/mp4') && !v.canPlayType('video/webm'))) toSeq(); else startVideo();
  return { finish, unmute, get done() { return done; }, get engine() { return seq ? 'seq' : 'video'; } };
})();
