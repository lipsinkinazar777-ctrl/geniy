// Loads every language, checks errors / overflow / lang+dir, captures hero + a few sections
import { chromium } from 'playwright-core'; import http from 'http'; import fs from 'fs'; import path from 'path';
const site = path.resolve(new URL('..', import.meta.url).pathname); const SP = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html'; const f = path.join(site, u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const base = `http://localhost:${srv.address().port}/`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
for (const [lang, w, h] of [['fr', 1440, 900], ['en', 1440, 900], ['uk', 1440, 900], ['ru', 1440, 900], ['ar', 1440, 900], ['fr', 390, 844], ['uk', 390, 844], ['ar', 390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 700, isMobile: w < 700 }); const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::/.test(m.text())) errs.push(m.text()); });
  await pg.goto(base + (lang === 'fr' && w > 700 ? '' : '?lang=' + lang)); await pg.waitForTimeout(2600);
  const info = await pg.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, ov: document.documentElement.scrollWidth - innerWidth, title: document.title, h1: document.querySelector('.headline').getAttribute('aria-label'), raw: [...document.querySelectorAll('[data-i18n]')].filter(e => !e.textContent.trim() && !e.hasAttribute('data-i18n-attr')).length }));
  ok(info.lang === lang && info.dir === (lang === 'ar' ? 'rtl' : 'ltr'), `${lang} ${w}px: lang/dir set (${info.lang}/${info.dir}) title="${info.title}"`);
  ok(info.ov <= 0, `${lang} ${w}px: no horizontal overflow (${info.ov})`); ok(info.raw === 0, `${lang} ${w}px: no empty translated nodes (${info.raw})`);
  await pg.screenshot({ path: `${SP}/l-${lang}-${w}.png` });
  if (w > 700 && lang !== 'fr') { for (const [id, off] of [['#coffrets', -40], ['#composer', 60]]) { await pg.evaluate(([i, o]) => scrollTo(0, document.querySelector(i).offsetTop + o), [id, off]); await pg.waitForTimeout(1700); await pg.screenshot({ path: `${SP}/l-${lang}-${id.slice(1)}.png` }); } }
  ok(errs.length === 0, `${lang} ${w}px: no console errors ${errs.join('|')}`); await ctx.close();
}
await b.close(); srv.close(); console.log(fails ? fails + ' FAILED' : 'ALL OK'); process.exit(fails ? 1 : 0);
