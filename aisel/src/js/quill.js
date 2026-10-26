/* ============================================================ the quill: a feather pen that writes a text letter by letter into a host element, the way ink would go on paper.
   Each letter is revealed left to right with wet ink that dries; the nib follows the letter being written and the feather leans with the motion. */
A.quill = (() => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function feather() {
    const bez = (t, p) => { const u = 1 - t; return [u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0], u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]]; };
    const sh = [[10, 212], [34, 150], [66, 80], [108, 8]];                                        // the shaft, nib at the bottom left
    let barbs = '', left = [], right = [];
    for (let i = 0; i <= 26; i++) {
      const t = .16 + i / 26 * .84, [x, y] = bez(t, sh), [x2, y2] = bez(Math.min(1, t + .01), sh), dx = x2 - x, dy = y2 - y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      const w = Math.sin(Math.PI * Math.min(1, (t - .1) / .95)) * 19 + 3, sw = w * (.9 + .12 * Math.sin(i * 1.7)), lw = w * 1.05;
      left.push([x + nx * lw, y + ny * lw - 4]); right.push([x - nx * sw, y - ny * sw + 4]);
      if (i % 2 === 0) { barbs += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} L${(x + nx * lw).toFixed(1)} ${(y + ny * lw - 6).toFixed(1)}" /><path d="M${x.toFixed(1)} ${y.toFixed(1)} L${(x - nx * sw).toFixed(1)} ${(y - ny * sw + 6).toFixed(1)}" />`; }
    }
    const vane = 'M' + left.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L') + ' L' + right.reverse().map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L') + ' Z';
    return `<svg class="quill__svg" viewBox="0 0 130 226" width="86" height="150" aria-hidden="true"><defs><linearGradient id="qv" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#f4ecd6"/><stop offset=".55" stop-color="#fffaf0"/><stop offset="1" stop-color="#cfc3a6"/></linearGradient></defs>
      <path d="${vane}" fill="url(#qv)" stroke="#a89a7a" stroke-width=".8" stroke-linejoin="round"/><g stroke="#b3a688" stroke-width=".55" opacity=".8" fill="none">${barbs}</g>
      <path d="M10 212 C34 150 66 80 108 8" stroke="#e9dcc0" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M10 212 C34 150 66 80 108 8" stroke="#fff" stroke-width="1" fill="none" opacity=".7" transform="translate(-.8 -.6)"/>
      <path d="M10 212 l3.4 -16 l4.6 7.2z" fill="#26190d"/><circle cx="10" cy="212.4" r="1.5" fill="#0c0805"/></svg>`;
  }
  let node = null;
  const getNode = host => { if (!node) { node = A.h(`<div class="quill" aria-hidden="true">${feather()}</div>`); } if (node.parentNode !== host) host.appendChild(node); return node; };

  /* host: the element whose text is written; box: positioned ancestor the quill lives in */
  async function write(host, { box, cps = 17, onWord } = {}) {
    const text = host.textContent; if (!text.trim()) return;
    host.textContent = ''; const spans = [];
    text.split(/(\s+)/).forEach(tok => {
      if (!tok) return; if (/^\s+$/.test(tok)) { host.appendChild(document.createTextNode(tok)); return; }
      const w = document.createElement('span'); w.className = 'qw'; for (const ch of tok) { const s = document.createElement('span'); s.className = 'qc'; s.textContent = ch; w.appendChild(s); spans.push(s); } host.appendChild(w);
    });
    const q = getNode(box), br = () => box.getBoundingClientRect(); let qx = 0, qy = 0, vx = 0, vy = 0, T = 0, i = 0;
    const first = spans[0].getBoundingClientRect(), b0 = br(); qx = first.left - b0.left - 30; qy = first.bottom - b0.top + 110; q.classList.add('on'); q.style.transform = `translate3d(${qx}px,${qy}px,0)`;
    await new Promise(res => {
      let last = performance.now(), wordN = 0, nextAt = .35;
      const frame = now => {
        const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
        while (i < spans.length && T >= nextAt) {                                              // the next letter appears as the nib arrives
          const s = spans[i], ch = s.textContent, pause = /[.!?…]/.test(ch) ? .32 : /[,;:—–]/.test(ch) ? .15 : 0;
          s.classList.add('on', 'wet'); setTimeout(() => s.classList.remove('wet'), 1500); i++; nextAt = T + 1 / cps * (.7 + Math.random() * .6) + pause;
          if (s.parentNode.lastChild === s) { wordN++; onWord && onWord(wordN); if (wordN % 2 === 0) A.snd.quill && A.snd.quill(); }
          if (pause) break;
        }
        const ref = spans[Math.max(0, i - 1)], r = ref.getBoundingClientRect(), b = br(), tx = (i ? r.right : r.left) - b.left + 1, ty = r.bottom - b.top - r.height * .2;
        const k = 150, c = 17; vx += ((tx - qx) * k - vx * c) * dt; vy += ((ty - qy) * k - vy * c) * dt; qx += vx * dt; qy += vy * dt;   // the nib follows with a little lag
        const lean = A.clamp(vx * .012, -14, 14), bob = Math.sin(T * 26) * 1.1 * (Math.abs(vx) > 8 ? 1 : .3);
        q.style.transform = `translate3d(${qx.toFixed(1)}px,${(qy + bob).toFixed(1)}px,0) rotate(${(-8 + lean).toFixed(2)}deg)`;
        if (i >= spans.length && Math.hypot(tx - qx, ty - qy) < 6) return res();
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    await sleep(380);
    q.classList.remove('on'); q.style.transform += ' translate(60px,-90px)';                          // lifts away
    await sleep(500);
    const plain = text; host.textContent = plain; if (q.parentNode) q.remove();
  }
  return { write, hide() { if (node && node.parentNode) node.remove(); } };
})();
