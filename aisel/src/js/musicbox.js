/* ============================================================ the music box on the desk: the melody comes from it. Tap it (or its zone) and the lid closes, the music stops; tap again and the lid opens,
   the key turns and the notes drift up. It only switches the existing music setting: the songs themselves are not touched. */
A.musicBox = (() => {
  const el = A.$('#mbox'); if (!el) return { toggle() {}, get on() { return false; } };
  const lerp = (a, b, k) => a + (b - a) * k, pt = (p, q, k) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k)], fmt = a => a.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
  const HL = [46, 86], HR = [214, 86], CL = [22, 112], CR = [190, 112], OL = [40, 14], OR = [208, 14];            // hinge (back edge of the lid), closed front edge, open front edge
  let k = 0, target = 0, raf = 0, parts = {};
  const on = () => A.state.settings.music !== false;

  el.innerHTML = `<svg viewBox="0 0 240 190" aria-hidden="true">
    <defs>
      <linearGradient id="mbW" x1="0" x2="1"><stop offset="0" stop-color="#6a4122"/><stop offset=".55" stop-color="#4a2a14"/><stop offset="1" stop-color="#2e1809"/></linearGradient>
      <linearGradient id="mbT" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7a4b27"/><stop offset="1" stop-color="#5a3519"/></linearGradient>
      <linearGradient id="mbS" x1="0" x2="1"><stop offset="0" stop-color="#3a2010"/><stop offset="1" stop-color="#1c0d05"/></linearGradient>
      <linearGradient id="mbB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d98a"/><stop offset=".5" stop-color="#c8963c"/><stop offset="1" stop-color="#8f6420"/></linearGradient>
      <linearGradient id="mbM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8cf9a"/><stop offset=".5" stop-color="#9a6f3c"/><stop offset="1" stop-color="#3a2410"/></linearGradient>
      <linearGradient id="mbV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e1a30"/><stop offset="1" stop-color="#3a0c1a"/></linearGradient>
      <radialGradient id="mbG" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#ffcf80" stop-opacity=".55"/><stop offset="1" stop-color="#ff9a40" stop-opacity="0"/></radialGradient>
      <filter id="mbBl" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <ellipse cx="120" cy="166" rx="112" ry="16" fill="#000" opacity=".55" filter="url(#mbBl)"/>
    <ellipse class="mb__glow" cx="124" cy="92" rx="118" ry="86" fill="url(#mbG)"/>
    <polygon points="22,112 190,112 190,162 22,162" fill="url(#mbW)"/>
    <polygon points="190,112 214,86 214,138 190,162" fill="url(#mbS)"/>
    <rect x="30" y="121" width="152" height="33" rx="3" fill="none" stroke="url(#mbB)" stroke-width="1.6"/>
    <path d="M104 148 v-17 l15 -3 v14" fill="none" stroke="url(#mbB)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="101" cy="149" rx="4.4" ry="3.2" fill="url(#mbB)"/><ellipse cx="116" cy="145" rx="4.4" ry="3.2" fill="url(#mbB)"/>
    <line x1="22" y1="112" x2="190" y2="112" stroke="#b27a3d" stroke-width="1.2" opacity=".75"/><line x1="190" y1="112" x2="214" y2="86" stroke="#9a6430" stroke-width="1" opacity=".6"/><line x1="190" y1="112" x2="190" y2="162" stroke="#8a5a2a" stroke-width="1" opacity=".5"/>
    <polygon id="mbTop" points="22,112 190,112 214,86 46,86" fill="url(#mbV)"/>
    <g id="mbMech" opacity="0">
      <polygon points="30,108 184,108 206,88 52,88" fill="#2a1208" opacity=".55"/>
      <g stroke="url(#mbB)" stroke-linecap="round"><line x1="58" y1="92" x2="196" y2="92" stroke-width="2.4"/><line x1="62" y1="96" x2="188" y2="96" stroke-width="1.3" stroke-dasharray="2 3"/></g>
      <path d="M50 104 L180 104 L196 94 L66 94 Z" fill="url(#mbM)" opacity=".92"/>
      <g fill="#fff0c0" opacity=".85"><circle cx="76" cy="99.5" r=".9"/><circle cx="92" cy="98.8" r=".9"/><circle cx="108" cy="99.8" r=".9"/><circle cx="124" cy="99" r=".9"/><circle cx="141" cy="99.6" r=".9"/><circle cx="158" cy="98.7" r=".9"/><circle cx="173" cy="99.4" r=".9"/></g>
    </g>
    <polygon id="mbLid" points="" fill="url(#mbT)"/>
    <polygon id="mbRim" points="" fill="none" stroke="url(#mbB)" stroke-width="1.5" stroke-linejoin="round"/>
    <g class="mb__key" transform="translate(214 112)"><rect x="0" y="-2.6" width="17" height="5.2" rx="2" fill="url(#mbB)"/><g class="mb__wing"><ellipse cx="17" cy="0" rx="5.5" ry="21" fill="url(#mbB)"/><circle cx="17" cy="0" r="3.4" fill="#a07028"/></g></g>
    <g class="mb__notes" fill="#ffe2a4"><text x="62" y="70" font-size="17">♪</text><text x="108" y="56" font-size="22">♫</text><text x="154" y="68" font-size="17">♪</text><text x="86" y="46" font-size="14">♬</text></g>
  </svg>`;
  parts = { lid: A.$('#mbLid', el), rim: A.$('#mbRim', el), mech: A.$('#mbMech', el), top: A.$('#mbTop', el) };

  function draw() {
    const fl = pt(CL, OL, k), fr = pt(CR, OR, k), lid = [HL, HR, fr, fl], open = k > .5;
    parts.lid.setAttribute('points', fmt(lid)); parts.rim.setAttribute('points', fmt(lid));
    parts.lid.setAttribute('fill', open ? 'url(#mbM)' : 'url(#mbT)');                                // inside of the lid is a polished brass mirror, outside is the wood
    parts.mech.setAttribute('opacity', Math.max(0, (k - .35) / .65).toFixed(2));
    parts.top.setAttribute('fill', k > .08 ? 'url(#mbV)' : 'url(#mbV)');
    el.style.setProperty('--ok', k.toFixed(3));
  }
  function loop() { raf = 0; k += (target - k) * .16; if (Math.abs(target - k) < .004) k = target; draw(); if (k !== target) raf = requestAnimationFrame(loop); }
  function apply(quiet) { target = on() ? 1 : 0; el.classList.toggle('on', on()); if (quiet) { k = target; draw(); } else if (!raf) raf = requestAnimationFrame(loop); }
  apply(true);

  return {
    toggle() {
      const s = A.state.settings; s.music = !on(); A.save && A.save(); A.snd.unlock && A.snd.unlock(); A.snd.refresh && A.snd.refresh(); apply(false); A.vibrate && A.vibrate(s.music ? [10, 20, 12] : 10);
      if (s.music) { A.snd.chime && A.snd.chime([659.25, 783.99, 987.77], .09, .45); A.toast && A.toast('Шкатулка играет'); } else { A.snd.tap && A.snd.tap(); A.toast && A.toast('Шкатулка закрыта: тишина'); }
    },
    sync() { apply(true); },
    get on() { return on(); }
  };
})();
