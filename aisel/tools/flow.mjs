// node tools/flow.mjs <prefix> tab1,tab2,...  — runs gate->walk->finale->app and shoots each tab (390x844 @2x)
import { chromium } from '../../maison/tools/node_modules/playwright-core/index.mjs';
import path from 'path';
const SP = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad';
const [pre = 'f', tabs = 'path,books,quotes,sky,potion', extra = ''] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const pg = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })).newPage();
const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::/.test(m.text())) errs.push(m.text()); });
await pg.goto('file://' + path.resolve('dist/index.html')); await pg.waitForTimeout(1200);
await pg.evaluate("A.debug.startWalk()"); await pg.waitForTimeout(500); await pg.evaluate("A.scene.skipWalk()");
await pg.waitForFunction("A.scene.mode()==='finale'", null, { timeout: 30000 }); await pg.waitForTimeout(3200);
await pg.evaluate("A.debug.enter()"); await pg.waitForTimeout(2800);
await pg.evaluate("document.querySelector('.sheet__x')&&document.querySelector('.sheet__x').click()"); await pg.waitForTimeout(1200);
for (const t of tabs.split(',')) { await pg.evaluate(`A.go('${t}')`); await pg.waitForTimeout(2200); if (extra) { try { await pg.evaluate(extra.replace('$T', t)); } catch (e) { errs.push('EVAL ' + e.message); } await pg.waitForTimeout(1200); } await pg.screenshot({ path: `${SP}/${pre}_${t}.png` }); }
console.log('errors:', errs.length ? errs : 'none'); await b.close();
