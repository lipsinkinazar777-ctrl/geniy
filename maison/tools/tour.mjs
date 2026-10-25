// usage: node tour.mjs <prefix> <w> <h> <y1,y2,...>
import { chromium } from 'playwright-core'; import http from 'http'; import fs from 'fs'; import path from 'path';
const site = path.resolve(new URL('..', import.meta.url).pathname); const SP = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html'; const f = path.join(site, u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const [pre, w, h, ys] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: +w, height: +h }, hasTouch: +w < 700, isMobile: +w < 700 });
const errs = []; pg.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|favicon|net::/.test(m.text())) errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
await pg.goto(`http://localhost:${srv.address().port}/${process.env.Q||''}`); await pg.waitForTimeout(2500);
const total = await pg.evaluate(() => document.documentElement.scrollHeight); console.log('page height', total);
for (const y of ys.split(',')) { 
  // scroll gradually so IntersectionObservers fire
  const cur = await pg.evaluate(() => scrollY); const steps = 6; for (let i = 1; i <= steps; i++) { await pg.evaluate(v => scrollTo(0, v), cur + (+y - cur) * i / steps); await pg.waitForTimeout(120); }
  await pg.waitForTimeout(1500); await pg.screenshot({ path: `${SP}/${pre}-${y}.png` }); }
console.log('errors:', errs.length ? errs : 'none'); await b.close(); srv.close();
