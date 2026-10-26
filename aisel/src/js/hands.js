/* ============================================================ hands: soft-lit silhouettes that reach in from the edge of the frame to take things
   kinds: 'pinch' (thumb and finger pinch an edge), 'cup' (a palm from below holding something), 'open' (flat hand lifting a lid) */
A.hands = (() => {
  let n = 0;
  const defs = id => `<defs>
    <linearGradient id="sk${id}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#f0c8a2"/><stop offset=".55" stop-color="#d49d77"/><stop offset="1" stop-color="#8f5a40"/></linearGradient>
    <linearGradient id="sl${id}" x1="0" x2="1"><stop offset="0" stop-color="#6b2433"/><stop offset=".5" stop-color="#4a1522"/><stop offset="1" stop-color="#220a12"/></linearGradient>
    <linearGradient id="sh${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2a1208" stop-opacity=".5"/></linearGradient></defs>`;
  const finger = (d, id) => `<path d="${d}" fill="url(#sk${id})" stroke="rgba(70,30,14,.6)" stroke-width="1.6" stroke-linejoin="round"/>`;
  const nail = (x, y, rx, ry, rot = 0) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="#f6dccb" opacity=".75"/>`;
  const sleeve = id => `<path d="M34 430 L54 262 Q110 246 166 262 L186 430 Z" fill="url(#sl${id})"/><path d="M54 262 Q110 246 166 262" fill="none" stroke="#d9b36a" stroke-width="2.4"/><path d="M48 296 Q110 280 172 296" fill="none" stroke="rgba(233,201,132,.45)" stroke-width="1.4" stroke-dasharray="2 6"/><rect x="60" y="262" width="100" height="40" fill="url(#sh${id})" opacity=".35"/>`;
  const wrist = id => `<path d="M68 268 C66 236 64 200 66 160 L158 156 C160 200 156 238 152 268 Z" fill="url(#sk${id})" stroke="rgba(70,30,14,.5)" stroke-width="1.4"/>`;
  const KINDS = {
    pinch: id => `${sleeve(id)}${wrist(id)}
      ${finger('M92 160 C86 120 86 70 96 36 C100 22 118 22 120 36 C126 74 124 126 118 160 Z', id)}${nail(108, 34, 8, 11)}
      ${finger('M124 158 C124 120 128 84 138 62 C144 50 158 54 158 66 C158 100 152 132 148 160 Z', id)}${nail(148, 62, 6, 8)}
      ${finger('M150 160 C152 130 158 108 166 94 C172 86 184 90 182 102 C180 130 172 148 168 164 Z', id)}
      ${finger('M66 190 C44 170 34 126 46 82 C52 62 72 54 82 66 C88 80 84 108 82 134 C80 156 80 176 78 192 Z', id)}${nail(66, 66, 8, 10, -18)}
      <path d="M100 160 C96 120 102 76 108 44" fill="none" stroke="rgba(255,225,190,.5)" stroke-width="3" stroke-linecap="round"/>`,
    cup: id => `${sleeve(id)}${wrist(id)}
      ${finger('M62 176 C40 150 38 100 54 62 C62 44 84 46 86 64 C88 98 84 140 84 178 Z', id)}${nail(66, 56, 8, 10, -10)}
      ${finger('M88 156 C86 112 88 74 98 52 C104 40 122 42 124 56 C128 90 124 130 120 160 Z', id)}${nail(112, 50, 8, 10)}
      ${finger('M122 156 C122 118 128 92 138 76 C146 64 160 70 158 84 C156 116 150 140 148 162 Z', id)}
      ${finger('M148 164 C150 136 158 114 168 104 C176 96 188 102 184 114 C180 140 172 156 166 172 Z', id)}
      <path d="M96 150 C94 112 98 80 106 58" fill="none" stroke="rgba(255,225,190,.45)" stroke-width="3" stroke-linecap="round"/>`,
    open: id => `${sleeve(id)}${wrist(id)}
      ${finger('M62 170 C40 150 36 110 50 70 C56 56 76 56 78 72 C82 104 80 140 82 172 Z', id)}
      ${finger('M82 164 C80 110 82 60 90 26 C94 12 112 12 114 26 C120 64 120 118 118 164 Z', id)}${nail(102, 24, 8, 11)}
      ${finger('M116 162 C116 110 120 62 128 34 C132 20 150 22 150 36 C152 72 150 120 148 164 Z', id)}${nail(139, 33, 8, 11)}
      ${finger('M146 166 C148 124 154 84 162 62 C168 48 184 54 182 68 C180 104 174 136 168 172 Z', id)}${nail(173, 62, 7, 9)}
      <path d="M100 150 C98 100 102 60 104 32" fill="none" stroke="rgba(255,225,190,.45)" stroke-width="3" stroke-linecap="round"/>`
  };
  /** returns an element (220x430 svg, hand pointing up, tip near the top); size = css px width */
  function make(kind = 'pinch', o = {}) {
    const id = ++n, el = A.h(`<svg class="hand hand--${kind}" viewBox="0 0 220 430" width="${o.w || 150}" aria-hidden="true">${defs(id)}${KINDS[kind](id)}</svg>`);
    if (o.flip) el.style.transform = 'scaleX(-1)'; return el;
  }
  /** slide a hand in from below to (x,y) = where its tip goes; resolves when it arrives */
  function reach(host, kind, x, y, o = {}) {
    const w = o.w || 150, hd = make(kind, o), H = w * 430 / 220, rot = o.rot || 0;
    hd.style.cssText = `position:absolute;left:${x - w * .5}px;top:${y - 22 * w / 220}px;width:${w}px;pointer-events:none;z-index:${o.z || 50};transform-origin:50% 100%;filter:drop-shadow(0 14px 14px rgba(0,0,0,.55)) brightness(.9) saturate(.92)`;
    host.appendChild(hd);
    const from = `translate(${(o.fromX || 0)}px,${H + 60}px) rotate(${rot}deg)`, to = `translate(0,0) rotate(${rot}deg)`;
    const a = hd.animate([{ transform: from, opacity: 0 }, { transform: to, opacity: 1 }], { duration: o.dur || 620, easing: 'cubic-bezier(.2,.9,.25,1)', fill: 'forwards' });
    hd.retreat = (dur = 480) => hd.animate([{ transform: to, opacity: 1 }, { transform: from, opacity: 0 }], { duration: dur, easing: 'cubic-bezier(.5,0,.8,.3)', fill: 'forwards' }).finished.then(() => hd.remove());
    hd.move = (nx, ny, dur = 600) => { const dx = nx - x, dy = ny - y; return hd.animate([{ transform: `translate(${hd._dx || 0}px,${hd._dy || 0}px) rotate(${rot}deg)` }, { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg)` }], { duration: dur, easing: 'cubic-bezier(.3,.8,.3,1)', fill: 'forwards' }).finished.then(() => { hd._dx = dx; hd._dy = dy; }); };
    hd.arrived = a.finished.then(() => hd); return hd;
  }
  return { make, reach };
})();
