#!/usr/bin/env python3
# Concatenates src/ into dist/: index.html, manifest.webmanifest, sw.js and img/ (installable, offline-capable PWA)
import pathlib, shutil, json, hashlib, base64
root = pathlib.Path(__file__).resolve().parent.parent; src = root/'src'; out = root/'dist'
css = '\n'.join((src/'css'/f).read_text() for f in sorted(p.name for p in (src/'css').glob('*.css')))
order = ['store','layout','bookart','texts','import','audio','fx','scene','fire','musicbox','ui','dock','hands','library','bookview','quill','quoteslip','books','casket','quotes','potion','goal','bag','intro','app']
js = '\n'.join((src/'js'/f'{n}.js').read_text() for n in order if (src/'js'/f'{n}.js').exists())
story = (src/'story.txt').read_text().replace('\\','\\\\').replace('`','\\`').replace('${','\\${')
js = js.replace('/*STORY*/', story)
shell = (src/'shell.html').read_text(); body = (src/'body.html').read_text()
inner = shell.replace('/*CSS*/', css).replace('<!--BODY-->', body).replace('/*JS*/', js)
art = inner.replace('<link rel="manifest" href="manifest.webmanifest">','').replace('<source src="video/intro.webm" type="video/webm">','')
(root/'artifact.html').write_text(art)
head, rest = inner.split('<style>', 1)
page = '<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">\n' + head + '<style>' + rest.split('</style>',1)[0] + '</style>\n</head>\n<body>\n' + rest.split('</style>',1)[1] + '\n</body>\n</html>\n'
if out.exists(): shutil.rmtree(out)
(out/'img').mkdir(parents=True); (out/'lib').mkdir(); (out/'video').mkdir()
for f in (src/'img').iterdir():
    if f.name.startswith('bg-'): continue          # old forest plates are not used by the room
    shutil.copy(f, out/'img'/f.name)
for f in (src/'lib').iterdir(): shutil.copy(f, out/'lib'/f.name)
shutil.copytree(src/'video', out/'video', dirs_exist_ok=True)
(out/'index.html').write_text(page)
manifest = {
  "name": "Уголок принцессы Айсель", "short_name": "Уголок Айсель", "description": "Уютный каталог книг: полка, цитаты и зельеварня.",
  "lang": "ru", "start_url": "./index.html", "scope": "./", "display": "standalone", "orientation": "any",
  "background_color": "#000000", "theme_color": "#000000",
  "icons": [
    {"src": "img/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
    {"src": "img/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
    {"src": "img/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]
}
(out/'manifest.webmanifest').write_text(json.dumps(manifest, ensure_ascii=False, indent=1))
files = ['./', 'index.html', 'manifest.webmanifest'] + ['img/' + f.name for f in sorted((out/'img').iterdir())] + ['video/' + f.name for f in sorted((out/'video').iterdir()) if f.is_file() and f.suffix in ('.mp4', '.jpg')]   # lib/ (pdf.js, JSZip) is cached on first use
ver = hashlib.md5((page + ''.join(f.name + str(f.stat().st_size) for f in list((out/'img').iterdir()) + [f for f in (out/'video').iterdir() if f.is_file()])).encode()).hexdigest()[:8]
sw = f'''const V = 'aisel-{ver}', FILES = {json.dumps(files)};
self.addEventListener('install', e => {{ e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); }});
self.addEventListener('activate', e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('aisel-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); }});
self.addEventListener('fetch', e => {{
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url);
  if (u.origin === location.origin && r.headers.has('range')) {{ e.respondWith(caches.match(r.url, {{ ignoreSearch: true }}).then(async h => {{ if (!h) return fetch(r); const b = await h.blob(), m = /bytes=(\\d*)-(\\d*)/.exec(r.headers.get('range')) || [], s = m[1] ? +m[1] : 0, en = m[2] ? Math.min(+m[2], b.size - 1) : b.size - 1; return new Response(b.slice(s, en + 1), {{ status: 206, statusText: 'Partial Content', headers: {{ 'Content-Type': h.headers.get('Content-Type') || 'video/mp4', 'Content-Range': 'bytes ' + s + '-' + en + '/' + b.size, 'Content-Length': en - s + 1 }} }}); }})); return; }}
  if (u.origin === location.origin) {{ e.respondWith(caches.match(r, {{ ignoreSearch: true }}).then(h => h || fetch(r).then(n => {{ const cp = n.clone(); caches.open(V).then(c => c.put(r, cp)); return n; }}).catch(() => caches.match('index.html')))); return; }}
  if (/fonts\\.(googleapis|gstatic)\\.com$/.test(u.hostname)) e.respondWith(caches.open(V + '-fonts').then(c => c.match(r).then(h => {{ const n = fetch(r).then(x => {{ c.put(r, x.clone()); return x; }}).catch(() => h); return h || n; }})));
}});
'''
(out/'sw.js').write_text(sw)
print('built', len(page)//1024, 'KB; sw', ver)
