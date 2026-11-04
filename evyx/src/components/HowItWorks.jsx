import { Link } from 'react-router-dom';
import { how } from '../data/services.js';

export default function HowItWorks() {
  return (
    <section className="sec sec--soft sec--line">
      <div className="container">
        <div className="head head--center" data-reveal><div><span className="kicker">How it works</span><h2 className="h2">From a link to a finished video in 1–2 days</h2></div></div>
        <ol className="how">
          {how.map(([t, d]) => <li key={t} data-reveal><h3 className="h3">{t}</h3><p>{d}</p></li>)}
        </ol>
        <div className="how__cta" data-reveal>
          <Link className="btn btn--pill btn--fill btn--lg" to="/checkout?add=remake">Order a video <span className="arrow" /></Link>
          <span className="small">From $15. You see the price before we start.</span>
        </div>
      </div>
    </section>
  );
}
