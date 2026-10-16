// Canva-friendly PDF of all stories (1080x1920 per page, real text so Canva keeps it editable)
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const A=require('/home/user/geniy/instagram/generate_pack.js').PAGES();
const B=require('/home/user/geniy/coffrets/generate_stories.js').PAGES();
const out=process.argv[2];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
 const list=[...A,...B];
 for(const [i,[n,html]] of list.entries()){await p.setContent(html,{waitUntil:'networkidle'});await p.addStyleTag({content:'@page{size:1080px 1920px;margin:0}html{overflow:hidden!important;width:1080px;height:1920px}.gold,.n,.p span,.b2{background:none!important;-webkit-text-fill-color:#ecc77a!important;color:#ecc77a!important}'});await p.evaluate(()=>document.fonts.ready);
  await p.pdf({path:`${out}/${String(i+1).padStart(2,'0')}-${n}.pdf`,width:'1080px',height:'1920px',printBackground:true,preferCSSPageSize:true,margin:{top:0,right:0,bottom:0,left:0}})}
 await b.close();console.log(list.length)})();
