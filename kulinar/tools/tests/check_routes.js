const {chromium}=require('playwright');
const URL='file://'+require('path').resolve(__dirname,'../../index.html')+'';
(async()=>{
const b=await chromium.launch();const errs=[];
const p=await b.newPage({viewport:{width:1280,height:900}});
p.on('pageerror',e=>errs.push('PE '+e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load|net::|fonts|favicon/.test(m.text()))errs.push('CE '+m.text())});
await p.goto(URL);await p.waitForTimeout(500);
// data validation
const data=await p.evaluate(()=>{const o=[];
 const ids=RECIPES.map(r=>r.id);ids.filter((x,i)=>ids.indexOf(x)!==i).forEach(x=>o.push('dup recipe '+x));
 COLLECTIONS.forEach(c=>c.ids&&c.ids.forEach(i=>{if(!byId(i))o.push('coll '+c.id+' missing '+i)}));
 LEVELS.forEach(L=>L.practice.forEach(i=>{if(!byId(i))o.push('level '+L.id+' practice missing '+i)}));
 Object.keys(WP).forEach(k=>{if(!byId(k)&&!/^(gear|knife|store)-/.test(k))o.push('WP stale '+k)});
 RECIPES.forEach(r=>{if(!CUISINES[r.cu])o.push('cuisine? '+r.id+' '+r.cu);if(!CATS[r.cat])o.push('cat? '+r.id+' '+r.cat);if(r.steps.length<2)o.push('few steps '+r.id);if(!r.ing.length)o.push('no ing '+r.id);r.ing.forEach(i=>{if(!i.n)o.push('ing name '+r.id)});if(!(r.kcal>0&&r.t>0&&r.serv>0))o.push('nums '+r.id)});
 // refs in code to recipe ids
 const refs=[...document.documentElement.innerHTML.matchAll(/byId\)\.filter|\['([a-z0-9-]+)'(?:,'[a-z0-9-]+')*\]\.map\(byId/g)];
 return {n:RECIPES.length,problems:o,collections:COLLECTIONS.length,gear:GEAR.length}});
console.log('DATA',JSON.stringify(data,null,0));
// all hubs and tabs
const routes=['','recipes','recipes?col=resto-cream','recipes?col=salads','r/olivie','r/pasta-cream-mushroom','r/steak-garlic-butter','level/1','level/2','level/3','level/4','level/5','planner','my','my/levels','my/skills','my/fav','my/gear'];
const hubs=await p.evaluate(()=>Object.fromEntries(Object.entries(HUBS).map(([k,h])=>[k,h.tabs.map(t=>t[0])])));
for(const [h,tabs] of Object.entries(hubs))for(const t of tabs)routes.push(h+'/'+t);
const bad=[];
for(const r of routes){
  await p.goto(URL+'#/'+r);await p.reload();await p.waitForTimeout(250);
  const info=await p.evaluate(()=>{const a=document.querySelector('#app');const t=a.innerText;return{len:t.length,bad:(t.match(/undefined|NaN|\[object|null\b/g)||[]).slice(0,3),h1:(a.querySelector('h1,.hh')||{}).innerText}});
  if(info.len<200||info.bad.length)bad.push(r+' '+JSON.stringify(info));
}
console.log('ROUTES',routes.length,'BAD',JSON.stringify(bad,null,1));
console.log('ERRS',errs.length?errs.join('\n'):'none');
await b.close();
})();
