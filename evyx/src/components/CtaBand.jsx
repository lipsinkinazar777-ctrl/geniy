import { Link } from 'react-router-dom';

export default function CtaBand({ title = 'Order your first video.', text = 'Send a reference or an idea. We reply with a price and a date.' }) {
  return (
    <section className="cta">
      <div className="container" data-reveal>
        <h2 className="h1">{title}</h2>
        <p className="lede" style={{ margin: '22px auto 0' }}>{text}</p>
        <Link className="btn btn--pill btn--fill btn--lg" to="/checkout?add=remake">Order a video <span className="arrow" /></Link>
      </div>
    </section>
  );
}
