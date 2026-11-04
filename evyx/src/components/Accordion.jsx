import { useState } from 'react';

export default function Accordion({ items, openFirst = false }) {
  const [open, setOpen] = useState(openFirst ? 0 : -1);
  return (
    <div className="faq">
      {items.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <div key={q} className={`mod${isOpen ? ' open' : ''}`}>
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}><span>{q}</span><i aria-hidden="true" /></button>
            <div className="a" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}><div><p>{a}</p></div></div>
          </div>
        );
      })}
    </div>
  );
}
