import { gsap } from './motion.js';

/* Opening sequence for the first page load: logo fill, a warp of gold light, then the hero assembles. */

function logoLoader() {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.className = 'loader';
    el.innerHTML = '<div class="loader__logo">EVYX<span class="loader__fill">EVYX</span></div>';
    document.body.appendChild(el);
    const fill = el.querySelector('.loader__fill');
    const o = { v: 0 };
    gsap.to(o, {
      v: 100, duration: 1.4, ease: 'power2.inOut',
      onUpdate: () => { fill.style.width = `${o.v}%`; },
      onComplete: () => gsap.to(el, { opacity: 0, duration: 0.5, onComplete: () => { el.remove(); resolve(); } })
    });
  });
}

function warp() {
  const cv = document.createElement('canvas');
  cv.className = 'warp';
  document.body.appendChild(cv);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = (cv.width = window.innerWidth * dpr);
  const H = (cv.height = window.innerHeight * dpr);
  const g = cv.getContext('2d');
  const stars = Array.from({ length: 420 }, () => ({ a: Math.random() * 6.283, d: Math.random(), s: 0.4 + Math.random() * 0.9, c: Math.random() < 0.25 }));
  const t0 = performance.now();
  const D = 2300;
  const frame = now => {
    const t = Math.min((now - t0) / D, 1);
    const e = t * t * (3 - 2 * t);
    g.fillStyle = 'rgba(5,4,3,.28)';
    g.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.47, R = Math.hypot(W, H) / 2, sp = 0.006 + e * 0.05;
    for (const p of stars) {
      const len = 18 + e * 520 * p.s;
      p.d += sp * p.s * (0.6 + p.d);
      if (p.d > 1) { p.d = Math.random() * 0.08; p.a = Math.random() * 6.283; }
      const r1 = p.d * p.d * R, rr = Math.max(0, r1 - len * p.d);
      g.strokeStyle = p.c ? `rgba(255,240,205,${0.35 + 0.5 * e})` : `rgba(214,170,100,${0.25 + 0.5 * e})`;
      g.lineWidth = (0.6 + p.d * 2.2) * dpr;
      g.beginPath();
      g.moveTo(cx + Math.cos(p.a) * rr, cy + Math.sin(p.a) * rr);
      g.lineTo(cx + Math.cos(p.a) * r1, cy + Math.sin(p.a) * r1);
      g.stroke();
    }
    const gl = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.5);
    gl.addColorStop(0, `rgba(255,214,150,${0.5 * e})`);
    gl.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gl;
    g.fillRect(0, 0, W, H);
    if (t < 1) requestAnimationFrame(frame);
    else gsap.to(cv, { opacity: 0, duration: 0.9, onComplete: () => cv.remove() });
  };
  requestAnimationFrame(frame);
}

function assemble(root) {
  const q = s => root.querySelectorAll(s);
  const hdr = document.querySelector('.hdr__in');
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .set([...q('.hero__ui > *'), hdr], { opacity: 0 })
    .fromTo(q('.hero'), { scale: 1.35 }, { scale: 1, duration: 2.8, ease: 'expo.out', clearProps: 'transform' }, 0)
    .fromTo(q('.hero__bg'), { opacity: 0 }, { opacity: 1, duration: 1.4 }, 0)
    .fromTo(q('.ring1'), { attr: { r: 40 }, opacity: 0 }, { attr: { r: 262 }, opacity: 1, duration: 2.2, ease: 'expo.out' }, 0.1)
    .fromTo(q('.ring2'), { attr: { r: 60 }, opacity: 0 }, { attr: { r: 430 }, opacity: 1, duration: 2.6, ease: 'expo.out' }, 0.25)
    .fromTo(q('.hero__flare'), { opacity: 0, scaleX: 0.2 }, { opacity: 1, scaleX: 1, duration: 2, transformOrigin: '100% 50%' }, 0.4)
    .fromTo(q('.hl > span'), { scale: 2.2, opacity: 0, filter: 'blur(24px)' }, { scale: 1, opacity: 0.9, filter: 'blur(0px)', duration: 2.1, stagger: 0.18, ease: 'expo.out' }, 0.2)
    .fromTo(q('.robot__in'), { opacity: 0, scale: 1.25, yPercent: 8, filter: 'brightness(.12) blur(12px)' }, { opacity: 1, scale: 1, yPercent: 0, filter: 'brightness(1) blur(0px)', duration: 2.4, ease: 'expo.out', clearProps: 'filter' }, 0.5)
    .to(hdr, { opacity: 1, duration: 1 }, 1.6)
    .fromTo(q('.hero__ui > *'), { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.12, clearProps: 'transform' }, 1.6)
    .fromTo(q('.visor'), { opacity: 0 }, { opacity: 1, duration: 1.2 }, 1.3);
}

let played = false;

export function playIntro(root) {
  if (played) return;
  played = true;
  gsap.set(root.querySelectorAll('.hl > span, .robot__in'), { opacity: 0 });
  logoLoader().then(() => { warp(); assemble(root); });
}
