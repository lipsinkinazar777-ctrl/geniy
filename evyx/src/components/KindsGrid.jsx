import { useLayoutEffect, useRef } from 'react';
import { kinds } from '../data/services.js';
import { gsap, reduceMotion } from '../lib/motion.js';

/* "What we create": photo tiles that rise in with a little parallax. */
export default function KindsGrid({ detailed = false }) {
  const root = useRef(null);

  useLayoutEffect(() => {
    if (reduceMotion || !root.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.kind').forEach(k => {
        gsap.fromTo(k, { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: k, start: 'top 90%', once: true } });
        gsap.fromTo(k.querySelector('img'), { yPercent: 8 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: k, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div className="kinds" ref={root}>
      {kinds.map(k => (
        <div key={k.id} className="kind" id={detailed ? k.id : undefined}>
          <div className="kind__pic"><img src={k.img} alt={k.title} loading="lazy" /></div>
          <h3 className="h3">{k.title}</h3>
          <p>{k.text}</p>
          {detailed && <ul className="ticks kind__list">{k.includes.map(i => <li key={i}>{i}</li>)}</ul>}
        </div>
      ))}
    </div>
  );
}
