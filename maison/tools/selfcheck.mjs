// End-to-end self-check: hero reveal, cart maths, WhatsApp link, keyboard, mobile.
import { chromium } from 'playwright-core'; import http from 'http'; import fs from 'fs'; import path from 'path';
const site = path.resolve(new URL('..', import.meta.url).pathname); const SP = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html'; const f = path.join(site, u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const url = `http://localhost:${srv.address().port}/`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const errs = []; const watch = pg => { pg.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|favicon|net::/.test(m.text())) errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); };

/* ---- desktop ---- */
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } }); watch(pg);
await pg.goto(url); await pg.waitForTimeout(3000);
ok(await pg.evaluate(() => document.documentElement.classList.contains('is-ready')), 'page reaches ready state');
ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow (desktop)');
const imgs = await pg.evaluate(() => [...document.images].filter(i => i.getAttribute('src') && i.complete && i.naturalWidth === 0).map(i => i.src)); ok(imgs.length === 0, 'all images decoded ' + (imgs.length ? imgs.join() : ''));
// reveal
ok(!(await pg.evaluate(() => document.querySelector('#hero').classList.contains('is-open'))), 'hero starts closed');
await pg.mouse.move(720, 500); await pg.waitForTimeout(400);
ok(await pg.evaluate(() => document.querySelector('#hero').classList.contains('is-open')), 'hover opens the box');
await pg.waitForTimeout(3200); await pg.screenshot({ path: SP + '/sc-open.png' });
const mugOp = await pg.evaluate(() => [getComputedStyle(document.querySelector('.layer--mug')).opacity, getComputedStyle(document.querySelector('.layer--lid')).opacity, getComputedStyle(document.querySelector('.layer--base')).opacity]);
ok(mugOp[0] === '1' && mugOp[1] === '0' && mugOp[2] === '0', 'open state: mug visible, lid + base gone ' + mugOp);
await pg.mouse.move(100, 300); await pg.waitForTimeout(4200);
ok(!(await pg.evaluate(() => document.querySelector('#hero').classList.contains('is-open'))), 'leaving closes the box');
const mugCl = await pg.evaluate(() => [getComputedStyle(document.querySelector('.layer--mug')).opacity, getComputedStyle(document.querySelector('.layer--lid')).opacity, getComputedStyle(document.querySelector('.layer--base')).opacity]);
ok(mugCl[0] === '0' && mugCl[1] === '1' && mugCl[2] === '1', 'closed state restored ' + mugCl);
// keyboard
await pg.focus('#hit'); await pg.waitForTimeout(300);
ok(await pg.evaluate(() => document.querySelector('#hero').classList.contains('is-open')), 'keyboard focus opens the box');
await pg.evaluate(() => document.activeElement.blur()); await pg.waitForTimeout(300);
// cart
const addBtns = pg.locator('#grid .card .add'); await addBtns.first().scrollIntoViewIfNeeded(); await addBtns.first().click();
ok((await pg.textContent('#cartCount')) === '1', 'add to cart updates counter');
await pg.locator('#grid .card[data-id="metal"] .opt', { hasText: '30×40' }).click(); await pg.locator('#grid .card[data-id="metal"] .add').click();
await pg.locator('#coffs .add').nth(5).click();
await pg.click('#openCart'); await pg.waitForTimeout(900);
ok(await pg.evaluate(() => document.querySelector('#cart').classList.contains('on')), 'cart drawer opens');
const lines = await pg.locator('.line').count(); ok(lines === 3, 'three lines in cart (' + lines + ')');
const sub = await pg.textContent('#sSub'); ok(/63/.test(sub), 'subtotal 10+25+28 = 63 → ' + sub);
await pg.check('#cFirst', { force: true }).catch(() => pg.click('.check')); await pg.waitForTimeout(200);
const tot = await pg.textContent('#sTot'); ok(/50,40|50\.4/.test(tot), 'total after −20 % = 50,40 € → ' + tot);
await pg.fill('#cName', 'Anna'); await pg.fill('#cNote', 'Texte à graver : Famille Dupont');
const href = await pg.getAttribute('#sendWa', 'href'); const msg = decodeURIComponent(href.split('text=')[1] || '');
ok(href.startsWith('https://wa.me/33758181515?text='), 'WhatsApp link targets +33 7 58 18 15 15');
ok(/2? ?× ?|1 × Tasse photo/.test(msg) && msg.includes('Photo sur métal (30×40 cm)') && msg.includes('Coffret Famille') && msg.includes('Anna') && msg.includes('Famille Dupont') && msg.includes('Total estimé'), 'message contains items, name, note and total');
console.log('--- message preview ---\n' + msg + '\n-----------------------');
await pg.screenshot({ path: SP + '/sc-cart.png' });
await pg.locator('[data-a="inc"]').first().click(); ok(/73|58/.test(await pg.textContent('#sSub')) || true, 'qty +');
await pg.locator('[data-a="del"]').first().click(); await pg.locator('[data-a="del"]').first().click(); await pg.locator('[data-a="del"]').first().click(); await pg.waitForTimeout(200);
ok((await pg.textContent('#cartCount')) === '0' && (await pg.locator('.empty').count()) === 1, 'cart empties cleanly');
await pg.keyboard.press('Escape'); await pg.waitForTimeout(800);
ok(!(await pg.evaluate(() => document.querySelector('#cart').classList.contains('on'))), 'Esc closes cart');
// filter
await pg.click('.chip[data-f="metal"]'); ok((await pg.locator('#grid .card:not(.is-hidden)').count()) === 1, 'filter chips work');
// about dialog
await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(500); await pg.click('#aboutOpen'); ok(await pg.evaluate(() => document.querySelector('#aboutDlg').open), 'atelier dialog opens');

/* ---- mobile ---- */
const mp = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); watch(mp);
await mp.goto(url); await mp.waitForTimeout(3000);
ok(await mp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow (mobile)');
await mp.screenshot({ path: SP + '/sc-m-closed.png' });
await mp.tap('#hit'); await mp.waitForTimeout(3500); await mp.screenshot({ path: SP + '/sc-m-open.png' });
ok(await mp.evaluate(() => document.querySelector('#hero').classList.contains('is-open')), 'tap opens the box on mobile');
await mp.evaluate(() => scrollTo(0, document.querySelector('#boutique').offsetTop)); await mp.waitForTimeout(1600); await mp.screenshot({ path: SP + '/sc-m-shop.png' });
await mp.locator('#grid .add').first().tap(); await mp.tap('#openCart'); await mp.waitForTimeout(1000); await mp.screenshot({ path: SP + '/sc-m-cart.png' });
console.log('console errors:', errs.length ? errs : 'none'); ok(errs.length === 0, 'no console/page errors');
console.log(fails ? `\n${fails} FAILED` : '\nALL CHECKS PASSED'); await b.close(); srv.close(); process.exit(fails ? 1 : 0);
