// Renders the 3D product scenes to PNG/WebP via headless Chromium (Three.js, software GL).
import { chromium } from 'playwright-core';
import http from 'http'; import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
const root = path.resolve(new URL('.', import.meta.url).pathname), site = path.resolve(root, '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); let f = u.startsWith('/assets') ? path.join(site, u) : path.join(root, u === '/' ? 'render.html' : u);
  if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port;
const jobs = JSON.parse(process.argv[2]);              // [{out,q}]
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
for (const j of jobs) {
  const pg = await browser.newPage({ viewport: { width: 800, height: 600 } });
  pg.on('console', m => { if (m.type() === 'error') console.log('console.error:', m.text()); }); pg.on('pageerror', e => console.log('pageerror:', e.message));
  const t = Date.now(); await pg.goto(`http://localhost:${port}/render.html?${j.q}`);
  await pg.waitForFunction('window.__done===true', null, { timeout: 280000 });
  const data = await pg.evaluate('window.__png'); await pg.close();
  const out = path.join(site, 'assets', j.out); const tmp = out + '.tmp.png';
  fs.writeFileSync(tmp, Buffer.from(data.split(',')[1], 'base64'));
  const ext = path.extname(out).slice(1);
  if (ext === 'png') fs.renameSync(tmp, out);
  else { execFileSync('python3', ['-c', `from PIL import Image;im=Image.open('${tmp}');${ext === 'jpg' ? "im=im.convert('RGB');im.save('" + out + "',quality=90,optimize=True)" : "im.save('" + out + "',quality=88,method=5)"}`]); fs.unlinkSync(tmp); }
  console.log('ok', j.out, ((Date.now() - t) / 1000).toFixed(1) + 's');
}
await browser.close(); srv.close();
