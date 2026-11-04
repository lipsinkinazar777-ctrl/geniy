import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import robotImg from '../assets/hero/robot.webp';
import VideoCard from './VideoCard.jsx';
import { videos } from '../data/videos.js';
import { gsap, reduceMotion } from '../lib/motion.js';
import { playIntro } from '../lib/intro.js';

const SLOTS = [[-31, -6, -13], [31, -20, 9], [-40, 22, 7], [40, 16, -8], [-20, -30, -5], [22, 30, 11], [-27, 34, 13], [31, 0, -12]];

/* Pinned hero: the headline recedes and sample videos fly out of the android as you scroll. */
export default function Hero({ onOpenVideo, intro }) {
  const root = useRef(null);

  useLayoutEffect(() => {
    const el = root.current;
    const hero = el.querySelector('.hero');
    const robot = el.querySelector('.hero__robot');
    const title = el.querySelector('.hero__title');
    const spans = [...title.querySelectorAll('.hl > span')];

    const fit = () => {
      let size = Infinity;
      spans.forEach(sp => {
        sp.style.fontSize = '100px';
        size = Math.min(size, (100 * Math.min(hero.clientWidth * 0.875, 2000)) / (sp.offsetWidth || 1));
      });
      spans.forEach(sp => { sp.style.fontSize = `${size}px`; });
    };
    fit();
    document.fonts && document.fonts.ready.then(fit);
    window.addEventListener('resize', fit);

    let mx = 0, my = 0, cx = 0, cy = 0, px = -9999, py = -9999;
    const onMove = e => { mx = (e.clientX / window.innerWidth - 0.5) * 2; my = (e.clientY / window.innerHeight - 0.5) * 2; px = e.clientX; py = e.clientY; };
    window.addEventListener('pointermove', onMove, { passive: true });
    const tick = () => {
      cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06;
      robot.style.setProperty('--px', `${cx * 16}px`); robot.style.setProperty('--py2', `${cy * 8}px`);
      title.style.setProperty('--tx', `${cx * -12}px`); title.style.setProperty('--ty', `${cy * -5}px`);
      const r = robot.getBoundingClientRect();
      const inside = px > r.left + r.width * 0.18 && px < r.right - r.width * 0.14 && py > r.top + r.height * 0.06 && py < r.bottom;
      robot.style.setProperty('--hov', inside ? 1 : 0);
      robot.style.setProperty('--gx', `${((px - r.left) / r.width) * 100}%`);
      robot.style.setProperty('--gy', `${((py - r.top) / r.height) * 100}%`);
      spans.forEach(sp => { const b = sp.getBoundingClientRect(); sp.style.setProperty('--lx', `${px - b.left}px`); sp.style.setProperty('--ly', `${py - b.top}px`); });
    };
    if (!reduceMotion) gsap.ticker.add(tick);

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.reel__card');
      if (window.innerWidth > 900 && !reduceMotion) {
        gsap.set(cards, { xPercent: -50, yPercent: -50, left: '50%', top: '46%', autoAlpha: 0, scale: 0.15, z: -900 });
        const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.8 } });
        tl.to('.hero__ui', { autoAlpha: 0, y: 30, duration: 0.5, ease: 'power2.in' }, 0)
          .to(title, { scale: 1.35, opacity: 0, duration: 2.2, ease: 'power1.in' }, 0.1)
          .to('.hero__rings', { scale: 1.6, opacity: 0, duration: 3, ease: 'none' }, 0)
          .to('.robot__scroll', { scale: 1.04, duration: 6, ease: 'none' }, 0)
          .to('.reel__cap', { opacity: 1, duration: 0.6 }, 4.6);
        cards.forEach((c, i) => {
          const [x, y, rot] = SLOTS[i % SLOTS.length];
          const t = 0.7 + i * 0.5;
          const vx = x * window.innerWidth / 100, vy = (y * window.innerHeight) / 100;
          tl.fromTo(c, { autoAlpha: 0, scale: 0.15, z: -900, x: 0, y: 0, rotationY: 0, rotation: 0 },
            { autoAlpha: 1, scale: 1, z: 0, x: vx, y: vy * 0.9, rotation: rot * 0.5, rotationY: x < 0 ? 14 : -14, duration: 1.5 }, t)
            .to(c, { x: vx * 1.07, y: vy * 1.04, z: 120, duration: 1.6, ease: 'none' }, t + 1.5);
        });
      }
      if (intro && !reduceMotion) playIntro(el);
    }, el);

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', fit);
      window.removeEventListener('pointermove', onMove);
    };
  }, [intro]);

  return (
    <div className="intro" ref={root}>
      <section className="hero">
        <div className="hero__bg" aria-hidden="true" />
        <svg className="hero__rings" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <circle className="ring1" cx="640" cy="360" r="262" fill="none" stroke="rgba(214,176,112,.42)" strokeWidth="1.2" />
          <circle className="ring2" cx="700" cy="330" r="430" fill="none" stroke="rgba(214,176,112,.28)" strokeWidth="1" />
        </svg>
        <div className="hero__flare" aria-hidden="true" />
        <h1 className="hero__title" aria-label="Remake any AI videos">
          <span className="hl" aria-hidden="true"><span>REMAKE ANY</span></span>
          <span className="hl" aria-hidden="true"><span>AI VIDEOS</span></span>
        </h1>
        <div className="hero__robot" aria-hidden="true">
          <div className="robot__scroll">
            <div className="robot__in" style={{ '--robot': `url(${robotImg})` }}>
              <img src={robotImg} alt="" width="1980" height="1710" fetchpriority="high" />
              <span className="lit" />
              <span className="visor" />
            </div>
          </div>
        </div>
        <div className="reel__cards">
          {videos.map(v => <div key={v.id} className="reel__card"><VideoCard video={v} onOpen={onOpenVideo} eager /></div>)}
        </div>
        <div className="hero__ui">
          <div className="hero__card glass">
            <div className="hero__cardhead">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" /><path d="M10 8l6 4-6 4z" fill="currentColor" /></svg>
              <span>AI VIDEO STUDIO</span>
            </div>
            <p>We make AI video from scratch, and rebuild any video you send us.</p>
            <Link className="tlink" to="/work">See our work <span className="arrow" /></Link>
          </div>
          <div className="hero__btns">
            <Link className="btn btn--pill btn--fill btn--lg" to="/checkout?add=remake">ORDER A VIDEO <span className="arrow" /></Link>
            <Link className="btn btn--pill btn--ghost btn--lg" to="/academy">LEARN IT FREE</Link>
          </div>
          <div className="hero__stack" aria-hidden="true"><span>ANY VIDEO.</span><span>REMADE.</span><span className="gold">FROM $15.</span></div>
          <div className="hero__scroll"><span>SCROLL DOWN</span><i /></div>
        </div>
        <p className="reel__cap">Every card is a video we can make for you. <Link className="tlink" to="/work">See all work</Link></p>
      </section>
    </div>
  );
}
