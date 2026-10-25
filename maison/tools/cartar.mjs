import { chromium } from 'playwright-core'; import http from 'http'; import fs from 'fs'; import path from 'path';
const site = path.resolve(new URL('..', import.meta.url).pathname); const SP = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html'; const f = path.join(site, u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } }); await pg.goto(`http://localhost:${srv.address().port}/?lang=ar`); await pg.waitForTimeout(2000);
await pg.locator('#grid .card .add').first().click(); await pg.click("#openCart"); await pg.waitForTimeout(4500);
console.log(await pg.evaluate(() => { const r = document.querySelector('#cart').getBoundingClientRect(); return [r.left, r.right, getComputedStyle(document.querySelector('#cart')).transform]; }));
await pg.screenshot({ path: SP + '/cart-ar.png' }); await b.close(); srv.close();
