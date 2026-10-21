import { chromium } from 'playwright-core'; import http from 'http'; import fs from 'fs'; import path from 'path';
const site = path.resolve(new URL('..', import.meta.url).pathname); const SP = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html'; const f = path.join(site, u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::/.test(m.text())) errs.push(m.text()); });
await pg.goto(`http://localhost:${srv.address().port}/`); await pg.waitForTimeout(2000);
await pg.evaluate(() => scrollTo(0, document.querySelector('#coffrets').offsetTop - 40)); await pg.waitForTimeout(2200); await pg.screenshot({ path: SP + '/cf0.png' });
for (const id of ['c-noel', 'c-duo2', 'c-maman']) { await pg.locator(`.coff[data-id="${id}"]`).hover(); await pg.waitForTimeout(1800); await pg.screenshot({ path: SP + `/cf-${id}.png` }); }
// builder with 6 items
await pg.evaluate(() => scrollTo(0, document.querySelector('#composer').offsetTop + 60)); await pg.waitForTimeout(1500);
for (const [id, n] of [['tasse', 2], ['metal', 1], ['aimant', 2], ['cles', 1]]) for (let i = 0; i < n; i++) { await pg.locator(`.pk[data-id="${id}"] [data-a="add"]`).click(); await pg.waitForTimeout(1250); }
await pg.screenshot({ path: SP + '/b6.png' });
// dialog cursor
await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(600); await pg.click('#aboutOpen'); await pg.waitForTimeout(500);
console.log('dialog open:', await pg.evaluate(() => document.querySelector('#aboutDlg').open), '| has-cursor:', await pg.evaluate(() => document.documentElement.classList.contains('has-cursor')), '| html cursor:', await pg.evaluate(() => getComputedStyle(document.querySelector('#aboutDlg')).cursor));
await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
console.log('after close has-cursor:', await pg.evaluate(() => document.documentElement.classList.contains('has-cursor')));
console.log('errors', errs); await b.close(); srv.close();
