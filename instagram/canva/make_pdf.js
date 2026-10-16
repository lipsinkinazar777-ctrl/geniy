// Canva-friendly PDF. Each page = flat background picture + every mug / icon / banner as its own
// image (movable, deletable in Canva) + live text in static fonts (editable).
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs');
const A=require('/home/user/geniy/instagram/generate_pack.js').PAGES();
const B=require('/home/user/geniy/coffrets/generate_stories.js').PAGES();
const STATIC=fs.readFileSync(__dirname+'/fonts_static.css','utf8');
const out=process.argv[2];
const NOTEXT=`body *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}
.gold,.n,.p span,.b2{background:none!important}svg[data-k]{visibility:hidden!important}`;
const ONLYTEXT=`@page{size:1080px 1920px;margin:0}html{overflow:hidden!important;width:1080px;height:1920px}
body *:not(.cv){background:transparent!important;border-color:transparent!important;box-shadow:none!important;filter:none!important;text-shadow:none!important}
svg{visibility:hidden!important}
.gold,.n,.p span,.b2{-webkit-text-fill-color:#ecc77a!important;color:#ecc77a!important}`;
const PAD=14;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:2});
 const list=[...A,...B];
 for(const [i,[n,html]] of list.entries()){
  await p.setContent(html,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
  // every svg except the full-page decor layer becomes its own picture
  const rects=await p.evaluate(()=>[...document.querySelectorAll('svg')].filter(s=>s.getAttribute('width')!='1080'&&!s.parentElement.closest('svg')).map((s,k)=>{s.setAttribute('data-k',k);const r=s.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}}));
  const pics=[];
  for(let k=0;k<rects.length;k++){const r=rects[k];
   const st=await p.addStyleTag({content:`html,body{background:transparent!important}body *{visibility:hidden!important}svg[data-k="${k}"],svg[data-k="${k}"] *{visibility:visible!important}`});
   const clip={x:Math.max(0,r.x-PAD),y:Math.max(0,r.y-PAD),width:r.w+PAD*2,height:r.h+PAD*2};
   pics.push({...clip,src:(await p.screenshot({clip,omitBackground:true})).toString('base64')});
   await st.evaluate(e=>e.remove());}
  await p.addStyleTag({content:NOTEXT});
  const bg=(await p.screenshot({type:'jpeg',quality:92,scale:'css'})).toString('base64');
  const h2=html.replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/,`<style>${STATIC}</style>`);
  await p.setContent(h2,{waitUntil:'networkidle'});
  await p.addStyleTag({content:ONLYTEXT+`body{background:url(data:image/jpeg;base64,${bg}) 0 0/1080px 1920px no-repeat!important}`});
  await p.evaluate(pics=>{for(const q of pics){const im=document.createElement('img');im.className='cv';im.src='data:image/png;base64,'+q.src;im.style.cssText=`position:absolute;left:${q.x}px;top:${q.y}px;width:${q.width}px;height:${q.height}px;z-index:1`;document.body.appendChild(im)}},pics);
  await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()))});
  await p.pdf({path:`${out}/${String(i+1).padStart(2,'0')}-${n}.pdf`,width:'1080px',height:'1920px',printBackground:true,preferCSSPageSize:true,margin:{top:0,right:0,bottom:0,left:0}})}
 await b.close();console.log(list.length)})();
