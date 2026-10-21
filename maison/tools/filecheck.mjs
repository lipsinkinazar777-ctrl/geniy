import { chromium } from 'playwright-core'; import path from 'path';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs=[]; pg.on('pageerror', e=>errs.push(e.message)); pg.on('console', m=>{ if(m.type()==='error' && !/fonts\.g|ERR_|net::/.test(m.text())) errs.push(m.text()); });
await pg.goto('file://' + path.resolve('..', 'index.html')); await pg.waitForTimeout(3000);
console.log('ready:', await pg.evaluate(()=>document.documentElement.classList.contains('is-ready')), 'errors:', errs);
await pg.mouse.move(720,500); await pg.waitForTimeout(3000); console.log('open:', await pg.evaluate(()=>document.querySelector('#hero').classList.contains('is-open')));
await b.close();
