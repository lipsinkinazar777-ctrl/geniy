import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap, lockScroll, reduceMotion } from '../lib/motion.js';

export default function Modal({ open, onClose, wide = false, label, children }) {
  const box = useRef(null);
  const closeBtn = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    lockScroll(true);
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    if (box.current && !reduceMotion) gsap.fromTo(box.current, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    closeBtn.current && closeBtn.current.focus();
    return () => { lockScroll(false); window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="modal open" role="dialog" aria-modal="true" aria-label={label} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} className={`mbox glass${wide ? ' mbox--wide' : ''}`}>
        <button ref={closeBtn} type="button" className="mx" onClick={onClose}>CLOSE</button>
        {children}
      </div>
    </div>,
    document.body
  );
}
