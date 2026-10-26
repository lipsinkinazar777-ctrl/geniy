// node tools/shot.mjs <out> [w] [h] "<js to run>" [waitMs]
import { chromium } from '../../maison/tools/node_modules/playwright-core/index.mjs';
import fs from 'fs'; import path from 'path';
const SP = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad';
const [out, w = 390, h = 844, js = '', wait = 1500] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }); const pg = await ctx.newPage();
const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (['error'].includes(m.type()) && !/fonts\.g|ERR_|net::/.test(m.text())) errs.push(m.text()); });
await pg.goto('file://' + path.resolve('dist/index.html')); await pg.waitForTimeout(1200);
if (js) { try { await pg.evaluate(js); } catch (e) { errs.push('EVAL ' + e.message); } }
await pg.waitForTimeout(+wait); await pg.screenshot({ path: `${SP}/${out}.png` });
console.log('errors:', errs.length ? errs : 'none'); await b.close();
