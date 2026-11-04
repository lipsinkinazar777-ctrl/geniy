import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import QRCode from '../components/QRCode.jsx';
import { useCart, lineDetails } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { tiers, videoTypes } from '../data/services.js';
import { networks, telegramLink } from '../data/site.js';
import { program } from '../data/academy.js';
import { copyText } from '../lib/clipboard.js';
import { load, save } from '../lib/storage.js';
import { gsap, reduceMotion, scrollToTop } from '../lib/motion.js';

const STEPS = ['Cart', 'Details', 'Payment', 'Receipt'];
const SAMPLE_ADDRESS = 'PREVIEW-NOT-A-REAL-ADDRESS';
const isUrlish = v => /^(https?:\/\/|www\.)\S+/i.test(v.trim()) || v.trim().startsWith('EVYX showcase:');

function Stepper({ step }) {
  return (
    <ol className="csteps" aria-label="Checkout steps">
      {STEPS.map((s, i) => (
        <li key={s} className={i < step ? 'done' : i === step ? 'on' : ''} aria-current={i === step ? 'step' : undefined}>
          <span>{i + 1}</span>{s}
        </li>
      ))}
    </ol>
  );
}

function Summary({ lines, total }) {
  return (
    <aside className="glass csum">
      <span className="kicker">Order summary</span>
      <ul className="csum__lines">
        {lines.map(l => {
          const d = lineDetails(l);
          return <li key={l.key}><span><b>{d.title}</b><small>{d.subtitle}</small></span><span>${d.price}</span></li>;
        })}
      </ul>
      <div className="csum__total"><span>Total</span><b className="gtext">${total}</b></div>
      <p className="small">Paid in USDT. 1 USDT = 1 USD.</p>
    </aside>
  );
}

export default function Checkout() {
  const cart = useCart();
  const { lines, total, addRemake, update, remove, clear } = cart;
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [contact, setContact] = useState(() => load('evyx-contact', { name: '', handle: '' }));
  const [net, setNet] = useState(networks[0].id);
  const [tx, setTx] = useState('');
  const [errors, setErrors] = useState({});
  const [receipt, setReceipt] = useState(null);
  const panel = useRef(null);

  /* "Order - $15" buttons land here with ?add=remake: add one standard remake unless the cart already has one. */
  useEffect(() => {
    if (params.get('add') === 'remake') {
      if (!lines.some(l => l.kind === 'remake')) addRemake({});
      setParams({}, { replace: true });
    }
  }, [params, lines, addRemake, setParams]);

  useEffect(() => { save('evyx-contact', contact); }, [contact]);

  useEffect(() => {
    if (panel.current && !reduceMotion) gsap.fromTo(panel.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
  }, [step]);

  const go = s => { setErrors({}); setStep(s); scrollToTop(); };
  const network = networks.find(n => n.id === net);
  const preview = !network.address;
  const address = network.address || SAMPLE_ADDRESS;
  const remakes = lines.filter(l => l.kind === 'remake');

  const validateDetails = () => {
    const e = {};
    remakes.forEach(l => { if (!l.reference.trim() || !isUrlish(l.reference)) e[l.key] = 'Paste a link to the reference video, starting with https://'; });
    if (!contact.handle.trim()) e.handle = 'Add your Telegram username or email so we can deliver the video.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const confirmPayment = ev => {
    ev.preventDefault();
    if (tx.trim().length < 12) { setErrors({ tx: 'Paste the full transaction hash from your wallet.' }); return; }
    const r = {
      id: `EVYX-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.random().toString(36).slice(2, 4).toUpperCase()}`,
      time: `${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC`,
      items: lines.map(l => ({ ...lineDetails(l), reference: l.reference || '', note: l.note || '', type: l.type || '' })),
      total, network: network.chain, tx: tx.trim(), contact: contact.handle.trim(), name: contact.name.trim(), preview
    };
    save('evyx-receipts', [...load('evyx-receipts', []), r]);
    setReceipt(r);
    clear();
    setTx('');
    go(3);
  };

  const receiptText = r => [
    `EVYX receipt ${r.id}`,
    ...r.items.map(i => `- ${i.title} (${i.subtitle}) $${i.price}${i.reference ? `\n  Reference: ${i.reference}` : ''}${i.note ? `\n  Note: ${i.note}` : ''}`),
    `Total: ${r.total} USDT (${r.network})`, `TX: ${r.tx}`, `Time: ${r.time}`, `Contact: ${r.contact}`
  ].join('\n');

  const copy = async (text, label) => { toast((await copyText(text)) ? `${label} copied` : 'Copy failed, select the text instead'); };

  /* ---------- empty cart ---------- */
  if (step < 3 && lines.length === 0) {
    return (
      <div className="page">
        <PageHead kicker="Checkout" title="Your cart is empty">Start with a video remake or enrol in the EVYX Program.</PageHead>
        <div className="container empty">
          <button type="button" className="glass empty__opt" onClick={() => addRemake({})}>
            <span className="kicker">Video remake</span><b className="gtext">$15</b><span>One scene, up to 8 seconds. Add the reference on the next step.</span>
          </button>
          <button type="button" className="glass empty__opt" onClick={cart.addCourse}>
            <span className="kicker">Academy</span><b className="gtext">${program.price}</b><span>{program.title}: every recipe, free tools only.</span>
          </button>
          <p className="small center" style={{ gridColumn: '1/-1' }}>Or browse the <Link className="tlink" to="/work">work showcase</Link> and order a look you like.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHead kicker="Checkout" title={step === 3 ? 'Thank you' : 'Complete your order'} />
      <div className="container">
        <Stepper step={step} />
        <div className="ck">
          <div className="glass ckpanel" ref={panel}>

            {step === 0 && (
              <>
                <h2 className="h3">Your cart</h2>
                <ul className="cart">
                  {lines.map(l => {
                    const d = lineDetails(l);
                    return (
                      <li key={l.key} className="cart__line">
                        <div className="cart__info"><b>{d.title}</b><small>{d.subtitle}</small></div>
                        {l.kind === 'remake' && (
                          <div className="seg seg--sm" role="radiogroup" aria-label="Tier">
                            {tiers.map(t => <button key={t.id} type="button" role="radio" aria-checked={l.tierId === t.id} aria-pressed={l.tierId === t.id} onClick={() => update(l.key, { tierId: t.id })}><b>${t.price}</b>{t.name}</button>)}
                          </div>
                        )}
                        <div className="cart__side"><span className="cart__price">${d.price}</span><button type="button" className="tlink" onClick={() => remove(l.key)}>Remove</button></div>
                      </li>
                    );
                  })}
                </ul>
                <div className="cart__more">
                  <button type="button" className="btn btn--sm" onClick={() => { addRemake({}); toast('Another remake added'); }}>Add another remake</button>
                  {!cart.hasCourse && <button type="button" className="btn btn--sm" onClick={() => { cart.addCourse(); toast('Program added'); }}>Add the EVYX Program · ${program.price}</button>}
                </div>
                <div className="ck__nav"><Link className="tlink" to="/work">Keep browsing</Link><button type="button" className="btn btn--pill btn--fill btn--lg" onClick={() => go(1)}>Continue <span className="arrow" /></button></div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="h3">Details</h2>
                {remakes.map((l, i) => (
                  <fieldset key={l.key} className="brief">
                    <legend>{lineDetails(l).title}{remakes.length > 1 ? ` · ${i + 1}` : ''}</legend>
                    <div className="field"><label htmlFor={`ref-${l.key}`}>Reference video link</label>
                      <input id={`ref-${l.key}`} value={l.reference} placeholder="https://" onChange={e => update(l.key, { reference: e.target.value })} aria-invalid={!!errors[l.key]} />
                      {errors[l.key] && <span className="err">{errors[l.key]}</span>}
                    </div>
                    <div className="field"><label htmlFor={`type-${l.key}`}>Video type</label>
                      <select id={`type-${l.key}`} value={l.type} onChange={e => update(l.key, { type: e.target.value })}>{videoTypes.map(t => <option key={t}>{t}</option>)}</select>
                    </div>
                    <div className="field"><label htmlFor={`note-${l.key}`}>What should change</label>
                      <textarea id={`note-${l.key}`} value={l.note} placeholder="Your idea, style, text, language" onChange={e => update(l.key, { note: e.target.value })} />
                    </div>
                  </fieldset>
                ))}
                <fieldset className="brief">
                  <legend>Delivery</legend>
                  <div className="field"><label htmlFor="c-name">Name (optional)</label><input id="c-name" value={contact.name} onChange={e => setContact(c => ({ ...c, name: e.target.value }))} /></div>
                  <div className="field"><label htmlFor="c-handle">Telegram username or email</label>
                    <input id="c-handle" value={contact.handle} placeholder="@username or you@email.com" onChange={e => setContact(c => ({ ...c, handle: e.target.value }))} aria-invalid={!!errors.handle} />
                    {errors.handle && <span className="err">{errors.handle}</span>}
                  </div>
                </fieldset>
                <div className="ck__nav"><button type="button" className="tlink" onClick={() => go(0)}>Back to cart</button><button type="button" className="btn btn--pill btn--fill btn--lg" onClick={() => validateDetails() && go(2)}>Continue to payment <span className="arrow" /></button></div>
              </>
            )}

            {step === 2 && (
              <form onSubmit={confirmPayment}>
                <h2 className="h3">Pay in USDT</h2>
                <div className="amt gtext" style={{ margin: '14px 0 18px' }}>{total} USDT</div>
                <ol className="steps3"><li>Choose the network.</li><li>Send exactly <b className="gold">{total} USDT</b> to the address.</li><li>Paste the transaction hash and confirm.</li></ol>
                {preview && <div className="notice"><b className="gold">Preview mode.</b> Wallets are not connected yet, so the address below is a sample that cannot receive funds. Add the wallet addresses in <b>src/data/site.js</b> to go live.</div>}
                <div className="nets" role="radiogroup" aria-label="Network">
                  {networks.map(n => <button key={n.id} type="button" role="radio" aria-checked={net === n.id} className="net" aria-pressed={net === n.id} onClick={() => setNet(n.id)}><b>{n.token}</b>{n.chain}</button>)}
                </div>
                <div className="paybox">
                  <QRCode value={address} />
                  <div><span className="small">{network.hint}</span><div className="addr">{address}</div><button type="button" className="btn btn--sm" onClick={() => copy(address, 'Address')}>Copy address</button></div>
                </div>
                <p className="small" style={{ marginBottom: 22 }}>Use the <b className="gold">{network.chain}</b> network only. A different network means lost funds.</p>
                <div className="field"><label htmlFor="tx">Transaction hash</label>
                  <input id="tx" value={tx} onChange={e => setTx(e.target.value)} placeholder="Paste the TX hash after sending" aria-invalid={!!errors.tx} />
                  {errors.tx && <span className="err">{errors.tx}</span>}
                </div>
                <div className="ck__nav"><button type="button" className="tlink" onClick={() => go(1)}>Back to details</button><button type="submit" className="btn btn--pill btn--fill btn--lg">Confirm payment <span className="arrow" /></button></div>
              </form>
            )}

            {step === 3 && receipt && (
              <>
                <div className="receipt">
                  <div className="amt gtext">{receipt.preview ? 'Preview receipt' : 'Payment submitted'}</div>
                  <dl>
                    <dt>Receipt</dt><dd>{receipt.id}</dd>
                    {receipt.items.map((i, n) => <Fragment key={`${i.title}-${n}`}><dt>Item {n + 1}</dt><dd>{i.title} · ${i.price}</dd></Fragment>)}
                    <dt>Total</dt><dd>{receipt.total} USDT · {receipt.network}</dd>
                    <dt>Transaction</dt><dd>{receipt.tx}</dd>
                    <dt>Time</dt><dd>{receipt.time}</dd>
                    <dt>Status</dt><dd className="gold">{receipt.preview ? 'Preview, no payment made' : 'Pending verification'}</dd>
                  </dl>
                  <p className="small">{receipt.preview ? 'Wallets are not connected yet, so nothing was sent.' : 'We check the transaction on-chain and reply in Telegram with your delivery date and access. Keep this receipt number.'}</p>
                </div>
                <div className="ck__nav ck__nav--wrap">
                  <button type="button" className="btn btn--pill btn--ghost btn--lg" onClick={() => copy(receiptText(receipt), 'Receipt')}>Copy receipt</button>
                  <a className="btn btn--pill btn--fill btn--lg" href={telegramLink(receiptText(receipt))} target="_blank" rel="noopener noreferrer">Send to Telegram <span className="arrow" /></a>
                  <button type="button" className="tlink" onClick={() => navigate('/')}>Back to home</button>
                </div>
              </>
            )}
          </div>

          {step < 3 ? <Summary lines={lines} total={total} /> : (
            <aside className="glass csum">
              <span className="kicker">What happens next</span>
              <ol className="steps3" style={{ marginTop: 16 }}><li>We verify the transaction.</li><li>We confirm the brief and the date in Telegram.</li><li>You get the files, without watermarks.</li></ol>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
