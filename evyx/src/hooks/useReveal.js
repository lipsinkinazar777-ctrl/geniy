import { useLayoutEffect } from 'react';
import { gsap, ScrollTrigger, reduceMotion } from '../lib/motion.js';

/* Fades and lifts every element matching `selector` inside `ref` as it scrolls into view. */
export function useReveal(ref, selector = '[data-reveal]', deps = []) {
  useLayoutEffect(() => {
    if (!ref.current || reduceMotion) return undefined;
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray(selector);
      items.forEach(el => {
        gsap.fromTo(el, { opacity: 0, y: 40 }, {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true }
        });
      });
    }, ref);
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => { cancelAnimationFrame(id); ctx.revert(); };
  }, deps);
}
