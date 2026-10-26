/* ============================================================ boot: the entrance video (intro.js) -> the hub room, the fire lights */
(() => {
  A.load(); A.txt.migrate(); A.musicBox && A.musicBox.sync();
  if (!A.state.books.length && !A.state.quotes.length && A.state.samples) A.seed();
  else if (A.state.seedV !== 2 && A.state.books.length && A.state.books.every(b => b.sample)) A.seed();      // an untouched older sample shelf becomes her own six books
  A.scene.init(); A.scene.start(); A.introInit();
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  A.debug = { enter: () => A.intro && A.intro.finish() };
})();
