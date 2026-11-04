import { Link } from 'react-router-dom';
import { contact, nav, telegramLink } from '../data/site.js';

export default function Footer() {
  return (
    <footer className="ftr">
      <div className="container">
        <div className="ftr__cols">
          <div>
            <span className="logo">EVYX</span>
            <p className="small">AI video for brands that want to be remembered.<br />Made in Europe, delivered anywhere.</p>
          </div>
          <div>
            <h4>Pages</h4>
            <ul>
              {nav.map(item => <li key={item.to}><Link to={item.to}>{item.label}</Link></li>)}
              <li><Link to="/checkout">Checkout</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li><a href={telegramLink()} target="_blank" rel="noopener noreferrer">Telegram</a></li>
              <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
              <li><a href={`https://instagram.com/${contact.instagram}`} target="_blank" rel="noopener noreferrer">Instagram</a></li>
            </ul>
          </div>
        </div>
        <p className="small">© {new Date().getFullYear()} EVYX</p>
      </div>
    </footer>
  );
}
