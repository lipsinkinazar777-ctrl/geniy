const {chromium}=require('playwright');
const URL='file://'+require('path').resolve(__dirname,'../../index.html')+'';
const ok=(c,m)=>console.log((c?'✓ ':'✗ ')+m);
(async()=>{
const b=await chromium.launch();const errs=[];
async function mk(vw,vh){const p=await b.newPage({viewport:{width:vw,height:vh}});
 p.on('pageerror',e=>errs.push(vw+' PE '+e.message));
 p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load|net::/.test(m.text()))errs.push(vw+' CE '+m.text())});
 p.on('dialog',d=>d.accept());
 await p.goto(URL);await p.waitForTimeout(400);return p}
const p=await mk(1280,900);
// 1. top nav clicks
const nav=await p.locator('#nav a').count();ok(nav===8,'nav items '+nav);
for(let i=0;i<nav;i++){const a=p.locator('#nav a').nth(i);const t=await a.innerText();await a.click();await p.waitForTimeout(250);const len=await p.evaluate(()=>document.querySelector('#app').innerText.length);ok(len>150,'nav → '+t+' ('+(await p.evaluate(()=>location.hash))+')')}
// 2. hub tabs clicking
for(const [h,sel] of [['school',9],['wiki',13],['health',4],['shop',4]]){
  await p.goto(URL+'#/'+h);await p.reload();await p.waitForTimeout(250);
  const n=await p.locator('#htabs button').count();ok(n===sel,h+' tabs '+n);
  for(let i=0;i<n;i++){await p.locator('#htabs button').nth(i).click();await p.waitForTimeout(200);const len=await p.evaluate(()=>document.querySelector('#hbody').innerText.length);const t=await p.locator('#htabs button').nth(i).innerText();if(len<100)ok(false,h+' tab '+t+' empty')}
}
// 3. search
await p.goto(URL+'#/');await p.reload();await p.waitForTimeout(300);
await p.fill('#gs','оливье');await p.waitForTimeout(250);let c=await p.locator('#sres a').count();ok(c>=2,'search оливье → '+c);
await p.locator('#sres a').first().click();await p.waitForTimeout(250);ok((await p.evaluate(()=>location.hash)).includes('olivie'),'search click → recipe '+await p.evaluate(()=>location.hash));
await p.fill('#gs','нарезка лук');await p.waitForTimeout(250);const pg=await p.locator('#sres a b').allInnerTexts();ok(pg.some(x=>/Нарезка/.test(x)),'search page result: '+pg.slice(0,3).join(' | '));
await p.press('#gs','Enter');await p.waitForTimeout(250);ok((await p.evaluate(()=>location.hash)).startsWith('#/recipes'),'enter → recipes');
// 4. random modal
await p.goto(URL+'#/');await p.reload();await p.waitForTimeout(300);
await p.click('#diceBtn');await p.waitForTimeout(3500);
ok(await p.locator('#modal.on .rnd-card').count()===1,'random: result card shown');
const name1=await p.locator('.rnd-card h3').innerText();await p.click('text=Ещё вариант');await p.waitForTimeout(3500);const name2=await p.locator('.rnd-card h3').innerText();ok(true,'random again: '+name1+' → '+name2);
await p.click('.rnd-act .btn.gold');await p.waitForTimeout(400);ok((await p.evaluate(()=>location.hash)).startsWith('#/r/'),'random → cook link '+await p.evaluate(()=>location.hash));
// 5. planner random
await p.goto(URL+'#/planner');await p.reload();await p.waitForTimeout(300);
await p.locator('.slot .dicebtn').nth(10).click();await p.waitForTimeout(3500);
ok(await p.locator('.rnd-card').count()===1,'planner slot random shown');
await p.click('text=Выбрать это блюдо');await p.waitForTimeout(500);
const filled=await p.evaluate(()=>Object.values(S.plan).flatMap(d=>Object.values(d).flat()).length);ok(filled===1,'planner slot filled '+filled);
await p.locator('.dayrnd').nth(3).click();await p.waitForTimeout(500);
const filled2=await p.evaluate(()=>Object.values(S.plan).flatMap(d=>Object.values(d).flat()).length);ok(filled2>=3,'day random fill → '+filled2);
await p.screenshot({path:require('os').tmpdir()+'/planner.png',fullPage:true});
await p.click('[onclick="clearWeek()"]');await p.waitForTimeout(200);ok(await p.locator('#modal.on #askYes').count()===1,'clear week: confirm inside the page');
await p.click('#askYes');await p.waitForTimeout(300);ok(await p.evaluate(()=>Object.values(S.plan).flatMap(d=>Object.values(d).flat()).length)===0,'clear week → plan empty');
// 6. gear toggles
await p.goto(URL+'#/shop/gear');await p.reload();await p.waitForTimeout(300);
await p.locator('.gear .gchk').first().click();await p.waitForTimeout(200);
await p.locator('.gear .gchk.want').nth(2).click();await p.waitForTimeout(200);
ok(await p.evaluate(()=>Object.keys(S.gear).length)===2,'gear marked '+await p.evaluate(()=>JSON.stringify(S.gear)));
await p.locator('.gear .gmore').nth(1).click();await p.waitForTimeout(300);ok(await p.locator('#modal.on .gm').count()===1,'gear modal');await p.click('#modal .ibtn');
await p.goto(URL+'#/my/gear');await p.reload();await p.waitForTimeout(300);ok((await p.locator('.gl').count())===2,'my gear lists '+await p.locator('.gl').count());
// 7. levels & lessons & quiz
await p.goto(URL+'#/level/1');await p.reload();await p.waitForTimeout(400);
ok(await p.locator('.lesson').count()>=14,'level 1 lessons '+await p.locator('.lesson').count());
await p.locator('.lesson .lchk').first().click();await p.waitForTimeout(400);ok(await p.evaluate(()=>Object.keys(S.lessons).length)===1,'lesson toggled');
await p.locator('.lesson > button').nth(2).click();await p.waitForTimeout(500);ok(await p.locator('.lesson.open').count()===1,'lesson opens');
await p.locator('#qz-lvl1 .btn.gold').click();await p.waitForTimeout(200);
for(let i=0;i<10;i++){await p.locator('.qopt').first().click();await p.waitForTimeout(80);await p.locator('#qz-lvl1 .btn.gold.sm').click();await p.waitForTimeout(80)}
ok(/\/ 10/.test(await p.locator('#qz-lvl1').innerText()),'quiz finished: '+(await p.locator('#qz-lvl1').innerText()).replace(/\s+/g,' ').slice(0,90));
await p.screenshot({path:require('os').tmpdir()+'/level1.png',fullPage:false});
// 8. learned toggle + my path rank click
await p.goto(URL+'#/r/carbonara');await p.reload();await p.waitForTimeout(300);await p.click('#lnb');await p.waitForTimeout(200);ok(await p.evaluate(()=>S.learned.carbonara>0),'learned toggled');
await p.goto(URL+'#/my');await p.reload();await p.waitForTimeout(300);await p.click('.rank-main');await p.waitForTimeout(300);ok((await p.evaluate(()=>location.hash)).startsWith('#/level/'),'rank click → '+await p.evaluate(()=>location.hash));
// 9. recipes filters
await p.goto(URL+'#/recipes');await p.reload();await p.waitForTimeout(400);
const cnt0=await p.innerText('#rcount');await p.click('#fcol button >> nth=1');await p.waitForTimeout(250);ok((await p.innerText('#rcount'))!==cnt0,'collection filter: '+await p.innerText('#rcount'));
await p.fill('#rq','паста');await p.waitForTimeout(250);ok(/Найдено/.test(await p.innerText('#rcount')),'text filter '+await p.innerText('#rcount'));
// 10. smooth wheel scroll
await p.goto(URL+'#/');await p.reload();await p.waitForTimeout(500);
await p.mouse.move(600,500);await p.mouse.wheel(0,400);await p.waitForTimeout(80);const y1=await p.evaluate(()=>scrollY);await p.waitForTimeout(900);const y2=await p.evaluate(()=>scrollY);ok(y2>=380&&y2<=450,'wheel smooth scroll: '+y1+' → '+y2);
// 11. theme
await p.click('#themeBtn');ok(await p.evaluate(()=>document.documentElement.dataset.theme)==='light','theme toggled');await p.click('#themeBtn');
// 12. mobile
const m=await mk(390,844);
const bn=await m.locator('#bnav a').count();ok(bn===8,'bottom nav '+bn);
for(let i=0;i<bn;i++){await m.locator('#bnav a').nth(i).click();await m.waitForTimeout(220)}
ok(true,'mobile bottom nav clicked all, last hash '+await m.evaluate(()=>location.hash));
await m.goto(URL+'#/');await m.reload();await m.waitForTimeout(500);await m.screenshot({path:require('os').tmpdir()+'/m_home.png'});
await m.goto(URL+'#/shop/gear');await m.reload();await m.waitForTimeout(500);await m.screenshot({path:require('os').tmpdir()+'/m_gear.png'});
const ov=await m.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2);ok(!ov,'no horizontal overflow on mobile gear');
console.log('ERRS',errs.length?errs.join('\n'):'none');
await b.close();
})();
