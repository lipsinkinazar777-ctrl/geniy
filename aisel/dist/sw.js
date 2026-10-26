const V = 'aisel-e90620a2', FILES = ["./", "index.html", "manifest.webmanifest", "img/apple-touch-icon.png", "img/bg-finale.webp", "img/bg-lantern.webp", "img/bg-library.webp", "img/bg-moon.webp", "img/bg-oak.webp", "img/bg-pines.webp", "img/icon-192.png", "img/icon-512.png", "img/icon-maskable-512.png", "img/loc-0.webp", "img/loc-1.webp", "img/loc-2.webp", "img/loc-3.webp", "img/loc-4.webp", "img/loc-5.webp", "img/loc-6.webp", "img/loc-7.webp"];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('aisel-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url);
  if (u.origin === location.origin) { e.respondWith(caches.match(r, { ignoreSearch: true }).then(h => h || fetch(r).then(n => { const cp = n.clone(); caches.open(V).then(c => c.put(r, cp)); return n; }).catch(() => caches.match('index.html')))); return; }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) e.respondWith(caches.open(V + '-fonts').then(c => c.match(r).then(h => { const n = fetch(r).then(x => { c.put(r, x.clone()); return x; }).catch(() => h); return h || n; })));
});
