import { useNavigate } from 'react-router-dom';
import { tiers } from '../data/services.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { telegramLink } from '../data/site.js';

export default function PricingTable({ withBusiness = true }) {
  const { addRemake } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const order = tier => {
    addRemake({ tierId: tier.id });
    toast(`${tier.name} added to cart`);
    navigate('/checkout');
  };

  return (
    <div className={`tariffs${withBusiness ? ' tariffs--4' : ''}`}>
      {tiers.map(t => (
        <div key={t.id} className={`glass tariff${t.featured ? ' tariff--hot' : ''}`} data-reveal>
          {t.featured && <span className="tariff__flag">Most chosen</span>}
          <span className="kicker">{t.name}</span>
          <div className="price gtext">${t.price}</div>
          <p className="small">{t.summary}</p>
          <ul>{t.features.map(f => <li key={f}>{f}</li>)}</ul>
          <button type="button" className={`btn btn--pill btn--lg ${t.featured ? 'btn--fill' : 'btn--ghost'}`} onClick={() => order(t)}>Order ${t.price} <span className="arrow" /></button>
        </div>
      ))}
      {withBusiness && (
        <div className="glass tariff tariff--biz" data-reveal>
          <span className="kicker">EU business</span>
          <div className="price gtext price--word">Custom</div>
          <p className="small">Monthly plans, ad creatives and multilingual versions</p>
          <ul><li>Content plan agreed in advance</li><li>Delivered weekly</li><li>Volume pricing</li><li>One contact person</li></ul>
          <a className="btn btn--pill btn--ghost btn--lg" href={telegramLink('Hi EVYX, I want a quote for business content in Europe.')} target="_blank" rel="noopener noreferrer">Request a quote <span className="arrow" /></a>
        </div>
      )}
    </div>
  );
}
