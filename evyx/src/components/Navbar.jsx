import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { nav } from '../data/site.js';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { count } = useCart();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className={`hdr${solid || open ? ' solid' : ''}`}>
      <div className="hdr__in">
        <Link className="logo" to="/" aria-label="EVYX, home">EVYX</Link>
        <nav className={`nav${open ? ' open' : ''}`} id="nav" aria-label="Main">
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}>{item.label}</NavLink>
          ))}
        </nav>
        <div className="hdr__right">
          <Link className="cartbtn" to="/checkout" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="19.5" r="1.4" fill="currentColor" /><circle cx="17" cy="19.5" r="1.4" fill="currentColor" /></svg>
            {count > 0 && <span className="cartbtn__n">{count}</span>}
          </Link>
          <Link className="hdr__cta" to="/checkout?add=remake">Order - $15</Link>
          <button className="burger" type="button" aria-label="Menu" aria-expanded={open} aria-controls="nav" onClick={() => setOpen(o => !o)}><i /><i /></button>
        </div>
      </div>
    </header>
  );
}
