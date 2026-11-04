import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import VideoCard from '../components/VideoCard.jsx';
import VideoModal from '../components/VideoModal.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { videos, categories } from '../data/videos.js';
import { useReveal } from '../hooks/useReveal.js';

export default function Work() {
  const root = useRef(null);
  const [params, setParams] = useSearchParams();
  const active = categories.includes(params.get('type')) ? params.get('type') : 'All';
  const [open, setOpen] = useState(null);
  const shown = useMemo(() => (active === 'All' ? videos : videos.filter(v => v.cat === active)), [active]);
  useReveal(root, '[data-reveal]', [active]);

  const choose = c => setParams(c === 'All' ? {} : { type: c }, { replace: true });

  return (
    <div className="page" ref={root}>
      <PageHead kicker="Work showcase" title="Every video can be yours">
        Filter by type, open a video and read the brief behind it. Then order the same kind of video for your brand.
      </PageHead>

      <div className="container">
        <div className="chips" role="toolbar" aria-label="Filter by type">
          {categories.map(c => (
            <button key={c} type="button" className="chip" aria-pressed={active === c} onClick={() => choose(c)}>
              {c} <span className="chip__n">{c === 'All' ? videos.length : videos.filter(v => v.cat === c).length}</span>
            </button>
          ))}
        </div>
        <div className="grid">
          {shown.map(v => <div key={v.id} data-reveal><VideoCard video={v} onOpen={setOpen} /></div>)}
        </div>
      </div>

      <section className="sec">
        <div className="container">
          <div className="head" data-reveal><div><span className="kicker">Case studies</span><h2 className="h2">The brief behind each look</h2></div></div>
          <div className="cases">
            {shown.slice(0, 4).map(v => (
              <article key={v.id} className="glass case" data-reveal>
                <img src={v.poster} alt="" loading="lazy" />
                <div>
                  <span className="kicker">{v.cat} · sample brief</span>
                  <h3 className="h3">{v.title}</h3>
                  <p>{v.case.brief}</p>
                  <p className="small">{v.case.approach}</p>
                  <button type="button" className="tlink" onClick={() => setOpen(v)}>Open the video <span className="arrow" /></button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title="Seen a look you like?" text="Order the same kind of video with your idea, your brand and your language." />
      <VideoModal video={open} onClose={() => setOpen(null)} />
    </div>
  );
}
