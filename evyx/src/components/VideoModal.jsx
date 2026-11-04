import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { prices } from '../data/site.js';

const TABS = ['Overview', 'Brief', 'Deliverables'];

/* Video player with a case-study panel and an "order this remake" action. */
export default function VideoModal({ video, onClose }) {
  const [tab, setTab] = useState(TABS[0]);
  const { addRemake } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const player = useRef(null);

  useEffect(() => { setTab(TABS[0]); }, [video]);

  const order = goToCheckout => {
    addRemake({ sample: video.title, reference: `EVYX showcase: ${video.title}` });
    toast('Added to cart');
    onClose();
    if (goToCheckout) navigate('/checkout');
  };

  return (
    <Modal open={!!video} onClose={onClose} wide label={video ? video.title : 'Video'}>
      {video && (
        <div className="preview">
          <div className="player">
            {video.src
              ? <video ref={player} src={video.src} poster={video.poster} controls autoPlay playsInline />
              : <img src={video.poster} alt={video.title} />}
            <span className="player__tag">{video.src ? video.len : `Sample · ${video.len}`}</span>
          </div>
          <div>
            <span className="kicker">{video.cat}</span>
            <h3 className="h2 preview__title">{video.title}</h3>
            <div className="ptabs" role="tablist" aria-label="Case study">
              {TABS.map(t => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} className="ptab" onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>
            <div className="ptab__panel" role="tabpanel">
              {tab === 'Overview' && <p>We make this kind of video for you: your idea, your brand, vertical, no watermark, ready to post.</p>}
              {tab === 'Brief' && (<><p><b className="gold">Sample brief.</b> {video.case.brief}</p><p className="small" style={{ marginTop: 10 }}>{video.case.approach}</p></>)}
              {tab === 'Deliverables' && <ul className="ticks">{video.case.deliverables.map(d => <li key={d}>{d}</li>)}</ul>}
            </div>
            <div className="h1 gtext preview__price">from ${prices.remake[0]}</div>
            <div className="preview__btns">
              <button type="button" className="btn btn--pill btn--fill btn--lg" onClick={() => order(true)}>Order this remake <span className="arrow" /></button>
              <button type="button" className="btn btn--pill btn--ghost btn--lg" onClick={() => order(false)}>Add to cart</button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
