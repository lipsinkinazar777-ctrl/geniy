// node tools/room.mjs <prefix> "<steps>"  steps: comma list of  shot:name | wait:ms | tap:hsid | eval:js | drag:dx,dy
import { chromium } from '../../maison/tools/node_modules/playwright-core/index.mjs';
import path from 'path';
const SP = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad';
const [pre = 'r', steps = 'shot:gate'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const pg = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false, isMobile: false })).newPage();
const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::/.test(m.text())) errs.push(m.text()); });
await pg.goto('file://' + path.resolve('dist/index.html')); await pg.waitForTimeout(1500);
for (const st of steps.split(';')) { const [k, ...r] = st.split(':'), v = r.join(':');
  if (k === 'shot') await pg.screenshot({ path: `${SP}/${pre}_${v}.png` });
  else if (k === 'wait') await pg.waitForTimeout(+v);
  else if (k === 'click') await pg.click(v);
  else if (k === 'eval') { try { await pg.evaluate(v); } catch (e) { errs.push('EVAL ' + e.message); } }
  else if (k === 'tap') { const [x, y] = await pg.evaluate(`A.scene.screenOf('${v}')`); await pg.mouse.click(x, y); }
  else if (k === 'drag') { const [dx, dy] = v.split(',').map(Number); await pg.mouse.move(195, 420); await pg.mouse.down(); for (let i = 1; i <= 8; i++) await pg.mouse.move(195 + dx * i / 8, 420 + dy * i / 8); await pg.mouse.up(); } }
console.log('errors:', errs.length ? errs : 'none'); await b.close();
