/* Проверка варианта для Artifact: страница лежит в песочнице iframe с жёсткой CSP (как у площадки):
   нет сети, нет системных диалогов и печати, у страницы свой origin.
   Запуск: node kulinar/tools/tests/check_sandbox.js   (вариант собирается автоматически во временную папку) */
const {chromium}=require('playwright');
const path=require('path'),os=require('os'),fs=require('fs'),cp=require('child_process');
const ok=(c,m)=>{console.log((c?'✓ ':'✗ ')+m);if(!c)process.exitCode=1};

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gk-art-'));
const art=path.join(tmp,'artifact.html');
cp.execFileSync('python3',[path.resolve(__dirname,'../build.py'),'--artifact',art],{stdio:'ignore'});
const body=fs.readFileSync(art,'utf8');
ok(!/<!doctype|<html|<\/html>|<\/body>|<head>|<\/head>/i.test(body),'вариант Artifact без <html>/<head>/<body>');
ok(/^<title>Гений кухни<\/title>/.test(body),'название — «Гений кухни»');

/* то же, что добавляет площадка: каркас вокруг содержимого */
const page=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`;
const CSP="default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: blob:; connect-src 'none'";

(async()=>{
const b=await chromium.launch();
async function open(sandbox,vw=1280,vh=900){
  const ctx=await b.newContext({viewport:{width:vw,height:vh}});
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await ctx.route('http://host.test/',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><body style="margin:0"><iframe id="f" src="http://art.test/page.html" sandbox="${sandbox}" style="width:100vw;height:100vh;border:0"></iframe>`}));
  await ctx.route('http://art.test/page.html',r=>r.fulfill({contentType:'text/html; charset=utf-8',headers:{'content-security-policy':CSP},body:page}));
  const p=await ctx.newPage();const errs=[];let blocked=0;
  p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{if(m.type()!=='error')return;const t=m.text();if(/Refused to|Content Security Policy|Failed to load resource|net::/.test(t))blocked++;else errs.push(t)});
  await p.goto('http://host.test/');
  const fr=await(await p.waitForSelector('iframe#f')).contentFrame();
  await fr.waitForSelector('#app h1',{timeout:20000});
  return{p,fr,errs,get blocked(){return blocked}};
}
const plan=fr=>fr.evaluate(()=>Object.values(S.plan).flatMap(d=>Object.values(d).flat()).length);

/* A. песочница со своим origin (localStorage работает), без allow-modals */
{
  const t=await open('allow-scripts allow-same-origin allow-popups');const {fr}=t;
  const nav=await fr.locator('#nav a').count();ok(nav===8,'[A] пунктов меню '+nav);
  for(let i=0;i<nav;i++){const a=fr.locator('#nav a').nth(i);const name=await a.innerText();await a.click();await t.p.waitForTimeout(250);
    ok(await fr.evaluate(()=>document.querySelector('#app').innerText.length)>150,'[A] меню → '+name)}
  await fr.evaluate(()=>go('#/'));await t.p.waitForTimeout(400);
  await fr.waitForFunction(()=>document.querySelectorAll('[data-bg].on, img[data-ph].on').length>0,null,{timeout:5000}).then(()=>ok(true,'[A] вшитое фото показано'),()=>ok(false,'[A] вшитое фото не показано'));
  await fr.evaluate(()=>go('#/school/cuts'));await t.p.waitForTimeout(300);
  const tabs=await fr.locator('#htabs button').count();await fr.locator('#htabs button').nth(2).click();await t.p.waitForTimeout(250);
  ok(tabs>=9&&await fr.evaluate(()=>document.querySelector('#hbody').innerText.length)>100,'[A] вкладки хаба ('+tabs+')');
  await fr.evaluate(()=>go('#/r/carbonara'));await t.p.waitForTimeout(400);
  ok(await fr.locator('button:has-text("Печать")').count()===0,'[A] кнопки «Печать» нет (печать в песочнице не работает)');
  ok(await fr.locator('button:has-text("Режим готовки")').count()===1,'[A] карточка рецепта открыта');
  await fr.locator('#lnb').click();await t.p.waitForTimeout(200);
  ok(await fr.evaluate(()=>S.learned.carbonara>0),'[A] «Я научился» сохраняется');
  /* планер: заполнить, очистить через окно подтверждения, список покупок */
  await fr.evaluate(()=>go('#/planner'));await t.p.waitForTimeout(400);
  await fr.locator('[onclick="autoFill()"]').click();await t.p.waitForTimeout(400);
  ok(await plan(fr)>=15,'[A] неделя заполнена: '+await plan(fr));
  await fr.locator('[onclick="clearWeek()"]').click();await t.p.waitForTimeout(250);
  ok(await fr.locator('#modal.on #askYes').count()===1,'[A] «Очистить»: подтверждение в самой странице');
  await fr.locator('#askYes').click();await t.p.waitForTimeout(300);
  ok(await plan(fr)===0,'[A] неделя очищена после «Да»');
  await fr.locator('[onclick="autoFill()"]').click();await t.p.waitForTimeout(400);
  await fr.locator('[onclick="copyShop()"]').click();await t.p.waitForTimeout(500);
  const copied=await fr.evaluate(()=>/скопирован/i.test(document.querySelector('#toast').textContent)&&document.querySelector('#toast').classList.contains('on'));
  const manual=await fr.locator('#modal.on #cpTa').count()===1;
  ok(copied||manual,'[A] «Скопировать» список: '+(copied?'скопировано':'окно с текстом для ручного копирования'));
  if(manual)await fr.evaluate(()=>closeModal());
  /* сеть закрыта: фото-загрузчик сдаётся после нескольких попыток и не шумит */
  await fr.evaluate(()=>go('#/recipes'));await t.p.waitForTimeout(500);
  for(let i=0;i<8;i++){await t.p.mouse.move(640,500);await t.p.mouse.wheel(0,900);await t.p.waitForTimeout(200)}
  const fails=await fr.evaluate(()=>photoNetFails),seen=t.blocked;
  for(const h of ['#/wiki/pasta','#/','#/recipes']){await fr.evaluate(x=>go(x),h);await t.p.waitForTimeout(300);for(let i=0;i<5;i++){await t.p.mouse.wheel(0,900);await t.p.waitForTimeout(150)}}
  ok(fails>=8&&fails<=14&&t.blocked===seen,'[A] нет сети: загрузчик фото остановился (отказов '+fails+', новых блокировок после этого '+(t.blocked-seen)+')');
  ok(await fr.evaluate(()=>document.querySelectorAll('.rc').length)>=30,'[A] карточки рецептов видны без фото');
  /* тема сохраняется между перезагрузками */
  await t.p.click('iframe#f');await fr.locator('#themeBtn').click();
  await fr.evaluate(()=>location.reload());await fr.waitForSelector('#app h1',{timeout:20000}).catch(()=>{});
  const fr2=await(await t.p.$('iframe#f')).contentFrame();await fr2.waitForSelector('#app h1');
  ok(await fr2.evaluate(()=>document.documentElement.dataset.theme)==='light','[A] тема сохраняется после перезагрузки');
  ok(await fr2.evaluate(()=>S.learned.carbonara>0),'[A] отметки сохраняются после перезагрузки');
  ok(t.errs.length===0,'[A] ошибок JS нет '+t.errs.slice(0,3).join(' | '));
  await t.p.context().close();
}

/* B. самая строгая песочница: непрозрачный origin, localStorage недоступен */
{
  const t=await open('allow-scripts allow-popups');const {fr}=t;
  ok(await fr.evaluate(()=>{try{localStorage.getItem('x');return false}catch(e){return true}}),'[B] localStorage действительно недоступен');
  for(let i=0;i<8;i++){await fr.locator('#nav a').nth(i).click();await t.p.waitForTimeout(200)}
  ok(await fr.evaluate(()=>document.querySelector('#app').innerText.length)>150,'[B] меню работает без хранилища');
  await fr.evaluate(()=>go('#/planner'));await t.p.waitForTimeout(300);
  await fr.locator('[onclick="autoFill()"]').click();await t.p.waitForTimeout(400);
  ok(await plan(fr)>=15,'[B] планер работает в памяти: '+await plan(fr));
  ok(t.errs.length===0,'[B] ошибок JS нет '+t.errs.slice(0,3).join(' | '));
  await t.p.context().close();
}

/* C. телефон: без горизонтальной прокрутки */
{
  const t=await open('allow-scripts allow-same-origin allow-popups',390,844);const {fr}=t;
  for(const h of ['#/','#/recipes','#/r/carbonara','#/planner','#/shop/gear','#/shop/grocery','#/shop/storage','#/school/course','#/school/cuts','#/school/stove','#/wiki/pasta','#/wiki/spices','#/wiki/compare','#/health/calc','#/level/1','#/my','#/credits']){
    await fr.evaluate(x=>go(x),h);await t.p.waitForTimeout(350);
    ok(!await fr.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2),'[C] телефон, без горизонтальной прокрутки: '+h)}
  await t.p.context().close();
}
await b.close();
fs.rmSync(tmp,{recursive:true,force:true});
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
