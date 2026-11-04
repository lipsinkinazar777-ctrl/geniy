import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { load, save } from '../lib/storage.js';
import { tiers } from '../data/services.js';
import { program } from '../data/academy.js';

const KEY = 'evyx-cart';
const CartContext = createContext(null);

const newId = () => Math.random().toString(36).slice(2, 10);

/* A remake line is one video order. Its tier sets the price; its brief is filled in at checkout. */
export function makeRemake({ tierId = tiers[0].id, reference = '', note = '', type = 'Ad video', sample = '' } = {}) {
  return { key: newId(), kind: 'remake', tierId, reference, note, type, sample };
}

export function lineDetails(line) {
  if (line.kind === 'course') return { title: program.title, subtitle: 'EVYX Academy · full program', price: program.price };
  const tier = tiers.find(t => t.id === line.tierId) || tiers[0];
  return {
    title: line.sample ? `Remake: ${line.sample}` : 'Video remake',
    subtitle: `${tier.name} · ${tier.summary}`,
    price: tier.price
  };
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState(() => load(KEY, []));

  useEffect(() => { save(KEY, lines); }, [lines]);

  const addRemake = useCallback(options => setLines(ls => [...ls, makeRemake(options)]), []);

  const addCourse = useCallback(() => setLines(ls => (ls.some(l => l.kind === 'course') ? ls : [...ls, { key: newId(), kind: 'course' }])), []);

  const update = useCallback((key, patch) => setLines(ls => ls.map(l => (l.key === key ? { ...l, ...patch } : l))), []);

  const remove = useCallback(key => setLines(ls => ls.filter(l => l.key !== key)), []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    const total = lines.reduce((sum, l) => sum + lineDetails(l).price, 0);
    return { lines, count: lines.length, total, hasCourse: lines.some(l => l.kind === 'course'), addRemake, addCourse, update, remove, clear };
  }, [lines, addRemake, addCourse, update, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
