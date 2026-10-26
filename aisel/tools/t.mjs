// node tools/t.mjs <prefix> <w> <h> "<steps>"   steps (;-separated): shot:name | wait:ms | eval:js | click:sel | tap:x,y | mouse:x,y | drag:x0,y0,x1,y1 | hold:x,y,ms | log:js
import { chromium } from '../../maison/tools/node_modules/playwright-core/index.mjs';
import path from 'path';
const SP = '/tmp/claude-0/-home-user-geniy/9d6c210a-1d40-575b-b4e9-4f41d3869cb9/scratchpad';
const [pre = 't', w = 390, h = 844, steps = 'shot:a', touch = '1'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const pg = await (await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(process.env.DSF || 2), hasTouch: touch === '1', isMobile: touch === '1' })).newPage();
const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::|webm|mp4/.test(m.text())) errs.push(m.text()); if (m.type() === 'log' && m.text().startsWith('>>')) console.log(m.text()); });
await pg.goto('file://' + path.resolve('dist/index.html'));
for (const st of steps.split(';')) { const [k, ...r] = st.split(':'), v = r.join(':'); if (!k) continue;
  if (k === 'shot') await pg.screenshot({ path: `${SP}/${pre}_${v}.png` });
  else if (k === 'eclip') { const [sel, nm, pad = 20] = v.split('|'); const r = await pg.evaluate(`(()=>{const b=document.querySelector('${sel}').getBoundingClientRect();return [b.left,b.top,b.width,b.height]})()`); await pg.screenshot({ path: `${SP}/${pre}_${nm}.png`, clip: { x: Math.max(0, r[0] - +pad), y: Math.max(0, r[1] - +pad), width: r[2] + 2 * +pad, height: r[3] + 2 * +pad } }); }
  else if (k === 'wait') await pg.waitForTimeout(+v);
  else if (k === 'click') await pg.click(v);
  else if (k === 'eval') { try { await pg.evaluate(v); } catch (e) { errs.push('EVAL ' + e.message); } }
  else if (k === 'log') { try { console.log('>>', JSON.stringify(await pg.evaluate(v))); } catch (e) { errs.push('LOG ' + e.message); } }
  else if (k === 'tap') { const [x, y] = v.split(',').map(Number); await pg.mouse.click(x, y); }
  else if (k === 'mouse') { const [x, y] = v.split(',').map(Number); await pg.mouse.move(x, y, { steps: 6 }); }
  else if (k === 'hold') { const [x, y, ms] = v.split(',').map(Number); await pg.mouse.move(x, y); await pg.mouse.down(); await pg.waitForTimeout(ms); await pg.mouse.up(); }
  else if (k === 'drag') { const [x0, y0, x1, y1] = v.split(',').map(Number); await pg.mouse.move(x0, y0); await pg.mouse.down(); for (let i = 1; i <= 10; i++) { await pg.mouse.move(x0 + (x1 - x0) * i / 10, y0 + (y1 - y0) * i / 10); await pg.waitForTimeout(12); } await pg.mouse.up(); } }
console.log('errors:', errs.length ? errs : 'none'); await b.close();
