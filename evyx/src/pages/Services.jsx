import { useRef, useState } from 'react';
import PageHead from '../components/PageHead.jsx';
import PricingTable from '../components/PricingTable.jsx';
import KindsGrid from '../components/KindsGrid.jsx';
import Accordion from '../components/Accordion.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import { euSolutions, faq } from '../data/services.js';
import { telegramLink } from '../data/site.js';
import { useReveal } from '../hooks/useReveal.js';

export default function Services() {
  const root = useRef(null);
  const [tab, setTab] = useState(euSolutions[0].id);
  const current = euSolutions.find(s => s.id === tab);
  useReveal(root);

  return (
    <div className="page" ref={root}>
      <PageHead kicker="Services" title="Three prices. One for business.">
        A small fixed price for a single video, or a steady stream of content for your company in Europe.
      </PageHead>

      <div className="container"><PricingTable /></div>

      <section className="sec">
        <div className="container">
          <div className="head head--center" data-reveal><div><span className="kicker">What we make</span><h2 className="h2 bar">Cartoons, ad videos, promo clips and more</h2></div></div>
          <KindsGrid detailed />
        </div>
      </section>

      <section className="sec sec--soft sec--line" id="business">
        <div className="container">
          <div className="head" data-reveal>
            <div><span className="kicker">EU business</span><h2 className="h2">A feed that never goes dark</h2></div>
            <a className="btn btn--pill btn--fill btn--lg" href={telegramLink('Hi EVYX, I want a quote for business content in Europe.')} target="_blank" rel="noopener noreferrer">Request a quote <span className="arrow" /></a>
          </div>
          <div className="eutabs" data-reveal>
            <div className="tablist" role="tablist" aria-label="Business solutions">
              {euSolutions.map(s => (
                <button key={s.id} type="button" role="tab" className="tab" aria-selected={tab === s.id} onClick={() => setTab(s.id)}>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
            <div className="glass eupanel" role="tabpanel" key={current.id}>
              <h3 className="h2" style={{ fontSize: 'clamp(24px,2.6vw,38px)' }}>{current.title}</h3>
              <p className="lede" style={{ margin: '16px 0 26px' }}>{current.text}</p>
              <ul className="ticks">{current.points.map(p => <li key={p}>{p}</li>)}</ul>
              <p className="small">Restaurants, salons, brands, agencies and studios. Tell us what you want to say and who you want to reach.</p>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />

      <section className="sec"><div className="container"><h2 className="h2 center" style={{ marginBottom: 48 }} data-reveal>Questions</h2><div data-reveal><Accordion items={faq} /></div></div></section>
    </div>
  );
}
