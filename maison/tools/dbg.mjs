import { chromium } from 'playwright-core'; import http from 'http'; import fs from 'fs'; import path from 'path';
const site = path.resolve(new URL('..', import.meta.url).pathname);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html'; const f = path.join(site, u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage(); await pg.goto(`http://localhost:${srv.address().port}/?lang=ar`); await pg.waitForTimeout(1500);
console.log(await pg.evaluate(() => [...document.querySelector('.pk__p').textContent].map(c => c.charCodeAt(0).toString(16)).join(' ')));
console.log(await pg.evaluate(() => (10).toLocaleString('ar-u-nu-latn')), await pg.evaluate(() => [...(10).toLocaleString('ar-u-nu-latn')].map(c => c.charCodeAt(0).toString(16)).join(' ')));
await b.close(); srv.close();
