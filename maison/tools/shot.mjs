// usage: node shot.mjs <name> <w> <h> [scrollY] [action]
import { chromium } from 'playwright-core'; import http from 'http'; import fs from 'fs'; import path from 'path';
const site = path.resolve(new URL('..', import.meta.url).pathname); const SP = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad';
fs.mkdirSync(SP, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html'; const f = path.join(site, u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const [name, w, h, sy = '0', act = ''] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: +w, height: +h }, hasTouch: +w < 700, isMobile: +w < 700 });
const errs = []; pg.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|favicon|net::/.test(m.text())) errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
await pg.goto(`http://localhost:${srv.address().port}/${process.env.Q||''}`); await pg.waitForTimeout(3200);
if (+sy) { await pg.evaluate(y => window.scrollTo(0, y), +sy); await pg.waitForTimeout(1800); }
if (act === 'open') { if (+w >= 700) await pg.mouse.move(+w / 2, +h * .55); else await pg.tap('#hit'); await pg.waitForTimeout(3200); }
await pg.screenshot({ path: `${SP}/${name}.png` });
console.log('errors:', errs.length ? errs : 'none'); console.log('overflow-x:', await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth));
await b.close(); srv.close();
