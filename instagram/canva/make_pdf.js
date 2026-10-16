// Canva-friendly PDF: each page = flat picture of the design (background, mugs, frames, glow)
// + live text on top in static fonts, so Canva keeps the look and the text stays editable.
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs');
const A=require('/home/user/geniy/instagram/generate_pack.js').PAGES();
const B=require('/home/user/geniy/coffrets/generate_stories.js').PAGES();
const STATIC=fs.readFileSync(__dirname+'/fonts_static.css','utf8');
const out=process.argv[2];
const NOTEXT=`body *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}
.gold,.n,.p span,.b2{background:none!important}`;
const ONLYTEXT=`@page{size:1080px 1920px;margin:0}html{overflow:hidden!important;width:1080px;height:1920px}
body *{background:transparent!important;border-color:transparent!important;box-shadow:none!important;filter:none!important;text-shadow:none!important}
svg{visibility:hidden!important}
.gold,.n,.p span,.b2{-webkit-text-fill-color:#ecc77a!important;color:#ecc77a!important}`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
 const list=[...A,...B];
 for(const [i,[n,html]] of list.entries()){
  await p.setContent(html,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
  await p.addStyleTag({content:NOTEXT});
  const bg=(await p.screenshot({type:'jpeg',quality:92})).toString('base64');
  const h2=html.replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/,`<style>${STATIC}</style>`);
  await p.setContent(h2,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
  await p.addStyleTag({content:ONLYTEXT+`body{background:url(data:image/jpeg;base64,${bg}) 0 0/1080px 1920px no-repeat!important}`});
  await p.evaluate(()=>document.fonts.ready);
  await p.pdf({path:`${out}/${String(i+1).padStart(2,'0')}-${n}.pdf`,width:'1080px',height:'1920px',printBackground:true,preferCSSPageSize:true,margin:{top:0,right:0,bottom:0,left:0}})}
 await b.close();console.log(list.length)})();
