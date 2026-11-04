import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap, reduceMotion } from '../lib/motion.js';

/* Holds the previous page on screen while a gold curtain sweeps over it,
   swaps the route underneath, then lifts the curtain and eases the new page in. */
export default function PageTransition({ children }) {
  const location = useLocation();
  const [shown, setShown] = useState(location);
  const curtain = useRef(null);
  const page = useRef(null);
  const busy = useRef(false);
  const latest = useRef(location);
  latest.current = location;

  useEffect(() => {
    if (location.pathname === shown.pathname) { setShown(location); return; }
    if (reduceMotion) { setShown(location); return; }
    if (busy.current) return;
    busy.current = true;
    gsap.timeline()
      .set(curtain.current, { display: 'block', yPercent: 100 })
      .to(page.current, { opacity: 0, y: -24, duration: 0.35, ease: 'power2.in' }, 0)
      .to(curtain.current, { yPercent: 0, duration: 0.5, ease: 'power3.inOut' }, 0)
      .add(() => setShown(location));
  }, [location]);

  useLayoutEffect(() => {
    if (!busy.current) return;
    gsap.timeline({ onComplete: () => {
      busy.current = false;
      if (latest.current.pathname !== shown.pathname) setShown(latest.current);
    } })
      .to(curtain.current, { yPercent: -100, duration: 0.6, ease: 'power3.inOut', delay: 0.05 })
      .set(curtain.current, { display: 'none' })
      .fromTo(page.current, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.25);
  }, [shown.pathname]);

  return (
    <>
      <div ref={page} className="pagewrap">{children(shown)}</div>
      <div ref={curtain} className="curtain" aria-hidden="true"><span>EVYX</span></div>
    </>
  );
}
