import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import VideoCard from '../components/VideoCard.jsx';
import VideoModal from '../components/VideoModal.jsx';
import KindsGrid from '../components/KindsGrid.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import Accordion from '../components/Accordion.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { videos } from '../data/videos.js';
import { stats, requests } from '../data/site.js';
import { euSolutions } from '../data/services.js';
import { program } from '../data/academy.js';
import { useReveal } from '../hooks/useReveal.js';

export default function Home({ intro }) {
  const root = useRef(null);
  const [open, setOpen] = useState(null);
  useReveal(root);

  return (
    <div ref={root}>
      <Hero onOpenVideo={setOpen} intro={intro} />

      <section className="stats" aria-label="The offer in numbers">
        <div className="container stats__in">
          {stats.map(s => (
            <div key={s.label} className="stat" data-reveal>
              <b className="gtext">{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sec">
        <div className="container">
          <div className="head head--center" data-reveal><div><h2 className="h2 bar">We create ad videos, promo clips, cartoons and music videos</h2></div></div>
          <KindsGrid />
          <div className="center" style={{ marginTop: 56 }} data-reveal><Link className="btn btn--pill btn--ghost btn--lg" to="/services">All services and prices <span className="arrow" /></Link></div>
        </div>
      </section>

      <HowItWorks />

      <section className="sec">
        <div className="container">
          <div className="head" data-reveal>
            <div><span className="kicker">Top showcases</span><h2 className="h2">Pick a look.<br />We make it yours.</h2></div>
            <Link className="btn" to="/work">All work <span className="arrow" /></Link>
          </div>
          <div className="grid">
            {videos.slice(0, 4).map(v => <div key={v.id} data-reveal><VideoCard video={v} onOpen={setOpen} /></div>)}
          </div>
        </div>
      </section>

      <section className="sec sec--soft sec--line">
        <div className="container split">
          <div data-reveal>
            <span className="kicker">For European business</span>
            <h2 className="h2" style={{ margin: '20px 0 22px' }}>Content that gets you seen in Europe</h2>
            <p className="lede" style={{ marginBottom: 34 }}>Shoots are slow and costly. We turn your ideas and your brand into a steady stream of AI video, in the language of the market you sell to.</p>
            <Link className="btn btn--pill btn--fill btn--lg" to="/services#business">See business plans <span className="arrow" /></Link>
          </div>
          <div className="rows">
            {euSolutions.slice(0, 3).map(s => <div key={s.id} className="row" data-reveal><div><h3 className="h3">{s.title}</h3><p>{s.text}</p></div></div>)}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="container split">
          <div data-reveal>
            <span className="kicker">EVYX Academy</span>
            <h2 className="h2" style={{ margin: '20px 0 22px' }}>Learn to make it yourself. For free.</h2>
            <p className="lede" style={{ marginBottom: 34 }}>Free guides for every video type: which free tools, in which order, and what to avoid. No subscriptions at any step.</p>
            <Link className="btn" to="/academy">Open the Academy <span className="arrow" /></Link>
          </div>
          <div className="glass product product--stack" data-reveal>
            <div className="product__l"><span className="kicker">{program.title}</span><div className="num gtext">${program.price}</div><p className="small">{program.edition}</p></div>
            <div><ul className="ticks">{program.includes.slice(0, 3).map(i => <li key={i}>{i}</li>)}</ul><Link className="btn btn--fill" to="/academy#program">See the program <span className="arrow" /></Link></div>
          </div>
        </div>
      </section>

      <section className="sec sec--line"><div className="container" data-reveal><Accordion items={[['What requests do you work with?', requests]]} /></div></section>

      <CtaBand />
      <VideoModal video={open} onClose={() => setOpen(null)} />
    </div>
  );
}
