/* ============================================================ boot: the entrance video (intro.js) -> the hub room, the fire lights */
(() => {
  A.load(); A.txt.migrate();
  { const OLD = /^\s*Алия\s+Айсель\s*$/i, NEW = 'Хакимова Айсель'; let ch = false; [...A.state.books, ...A.state.quotes].forEach(x => { if (x.author && OLD.test(x.author)) { x.author = NEW; ch = true; } }); if (ch) A.save(); } A.musicBox && A.musicBox.sync();
  if (!A.state.books.length && !A.state.quotes.length && A.state.samples) A.seed();
  else if (A.state.seedV !== 2 && A.state.books.length && A.state.books.every(b => b.sample)) A.seed();      // an untouched older sample shelf becomes her own six books
  /* phones report the new size a moment after a rotation (and when the browser bars slide): settle with a few extra resizes */
  { let rt = 0; const settle = () => { clearTimeout(rt); [120, 380, 900].forEach(ms => setTimeout(() => dispatchEvent(new Event('resize')), ms)); }; addEventListener('orientationchange', settle); if (window.visualViewport) { let vt = 0; visualViewport.addEventListener('resize', () => { clearTimeout(vt); vt = setTimeout(() => dispatchEvent(new Event('resize')), 160); }); } }
  A.scene.init(); A.scene.start(); A.introInit();
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  A.debug = { enter: () => A.intro && A.intro.finish() };
})();
