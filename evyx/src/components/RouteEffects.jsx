import { useEffect } from 'react';
import { ScrollTrigger, scrollToTop } from '../lib/motion.js';

const TITLES = {
  '/': 'EVYX. AI video studio',
  '/work': 'Work Showcase | EVYX',
  '/services': 'Services | EVYX',
  '/academy': 'Academy | EVYX',
  '/checkout': 'Checkout | EVYX'
};

/* On every route change: scroll to the top (or to #anchor), set the title, re-measure scroll animations. */
export default function RouteEffects({ location }) {
  const { pathname, hash } = location;

  useEffect(() => {
    document.title = TITLES[pathname] || 'EVYX';
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) { requestAnimationFrame(() => target.scrollIntoView()); return; }
    }
    scrollToTop();
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname, hash]);

  return null;
}
