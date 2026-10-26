/* ============================================================ book texts live in IndexedDB (a PDF is megabytes; localStorage stays small) */
A.txt = (() => {
  let db = null, mem = {};
  const open = () => new Promise(res => { if (db !== null) return res(db); try { const rq = indexedDB.open('aisel-texts', 1); rq.onupgradeneeded = () => rq.result.createObjectStore('t'); rq.onsuccess = () => { db = rq.result; res(db); }; rq.onerror = () => { db = false; res(false); }; } catch (e) { db = false; res(false); } });
  const tx = async (mode, fn) => { const d = await open(); if (!d) return fn(null); return new Promise((res, rej) => { const t = d.transaction('t', mode), r = fn(t.objectStore('t')); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); };
  return {
    put: async (id, text) => { const d = await open(); if (!d) { mem[id] = text; return; } await tx('readwrite', s => s.put(text, id)); },
    get: async (id) => { const d = await open(); if (!d) return mem[id] || ''; return (await tx('readonly', s => s.get(id))) || ''; },
    putBin: async (id, buf) => { const d = await open(); if (!d) { mem[id + ':bin'] = buf; return; } await tx('readwrite', s => s.put(buf, id + ':bin')); },
    getBin: async (id) => { const d = await open(); if (!d) return mem[id + ':bin'] || null; return (await tx('readonly', s => s.get(id + ':bin'))) || null; },
    del: async (id) => { const d = await open(); if (!d) { delete mem[id]; delete mem[id + ':bin']; return; } await tx('readwrite', s => { s.delete(id); s.delete(id + ':bin'); return null; }); },
    migrate: async () => { for (const b of A.state.books) if (b.text) { await A.txt.put(b.id, b.text); b.hasText = true; delete b.text; } A.save(); }
  };
})();
