// Editable Canva/PowerPoint project for the stories (9:16): mug catalogues editable, other stories as images
const pptxgen=require('pptxgenjs');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs');
const P=require('/home/user/geniy/instagram/generate_pack.js');
const OUT='/home/user/geniy/instagram/canva/';const IMG=OUT+'images/';fs.mkdirSync(IMG,{recursive:true});
const PX=144; // px per inch (1080px = 7.5in)
const i=v=>v/PX;
const slug=s=>s.normalize('NFD').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase();
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
 // background without any text
 await p.setContent(`<!doctype html><html><body style="margin:0;width:1080px;height:1920px;overflow:hidden;position:relative;background:#25060e">${P.BG}<svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0">${P.DEFS}${P.dots()}<rect x="70" y="560" width="1.4" height="900" fill="rgba(243,217,150,.5)"/>${P.STAR(71,640,46)}${P.STAR(71,1330,34,.9)}${P.STAR(1010,250,22,.7)}</svg></body></html>`);
 await p.screenshot({path:IMG+'fond.png'});await p.screenshot({path:IMG+'fond.jpg',type:'jpeg',quality:88});
 // monogram (transparent)
 const tp=await b.newPage({viewport:{width:400,height:400},deviceScaleFactor:2});
 const shotEl=async(html,file,w,h)=>{await tp.setViewportSize({width:w,height:h});await tp.setContent(`<!doctype html><html><head><meta charset="utf-8">${P.FONTS}</head><body style="margin:0;background:transparent">${html}</body></html>`,{waitUntil:'networkidle'});await tp.evaluate(()=>document.fonts.ready);await tp.screenshot({path:file,omitBackground:true,clip:{x:0,y:0,width:w,height:h}})};
 await shotEl(`<div style="width:160px;height:160px;display:grid;place-items:center"><div style="width:116px;height:116px;border-radius:50%;background:#5a0f22;border:3px solid #e2bb6c;box-shadow:0 0 0 7px #5a0f22,0 0 0 8.5px rgba(226,187,108,.8),0 0 30px rgba(255,200,170,.35);display:grid;place-items:center;font:600 44px Cinzel,serif;color:#f0cf88;box-sizing:border-box">MV</div></div>`,IMG+'monogramme.png',160,160);
 // mugs
 const sets={gaming:P.GAMING,proches:P.PROCHES,humour:P.HUMOUR};const files={};
 for(const [k,list] of Object.entries(sets)){files[k]=[];for(const [n,d] of list){const f=`${IMG}tasse-${k}-${slug(n)}.png`;await shotEl(`<div style="width:300px;height:290px">${P.mug(d,300)}</div>`,f,300,290);files[k].push([n,f])}}
 const banner=IMG+'sunset-drive-bandeau.png';await shotEl(`<svg viewBox="0 0 880 300" width="880" height="300">${P.SUNSET(880,300)}</svg>`,banner,880,300);
 const sunMug=IMG+'tasse-sunset-drive-grande.png';await shotEl(`<div style="width:520px;height:500px">${P.mug(P.SUNSET(182,188),520)}</div>`,sunMug,520,500);
 await b.close();

 const pres=new pptxgen();pres.defineLayout({name:'STORY',width:7.5,height:13.333});pres.layout='STORY';
 pres.title='Maison Volodymyr – stories';
 const SERIF='Cormorant Garamond',SANS='Montserrat';
 const head=(s,title,sub)=>{
  s.addImage({path:IMG+'fond.jpg',x:0,y:0,w:7.5,h:13.333});
  s.addImage({path:IMG+'monogramme.png',x:i(460),y:i(174),w:i(160),h:i(160)});
  s.addText('MAISON VOLODYMYR',{x:i(140),y:i(344),w:i(800),h:i(50),fontFace:SERIF,fontSize:18,color:'ECDCC6',charSpacing:6,align:'center',valign:'middle',margin:0,isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:i(300),y:i(405),w:i(480),h:0.012,fill:{color:'E2BB6C'},line:{color:'E2BB6C',width:0}});
  s.addText(title,{x:i(40),y:i(442),w:i(1000),h:i(100),fontFace:SERIF,fontSize:36,color:'F4E6D3',align:'center',valign:'middle',margin:0,isTextBox:true});
  s.addText(sub,{x:i(90),y:i(542),w:i(900),h:i(60),fontFace:SERIF,fontSize:23,italic:true,color:'E9C47E',align:'center',valign:'middle',margin:0,isTextBox:true});
 };
 const foot=(s,f1)=>{
  s.addShape(pres.shapes.RECTANGLE,{x:i(330),y:i(1478),w:i(420),h:0.012,fill:{color:'E2BB6C'},line:{color:'E2BB6C',width:0}});
  s.addText(f1,{x:i(60),y:i(1500),w:i(960),h:i(40),fontFace:SANS,fontSize:11,bold:true,color:'E9CF98',charSpacing:3,align:'center',valign:'middle',margin:0,isTextBox:true});
  s.addText('@maison.volodymyr',{x:i(240),y:i(1542),w:i(600),h:i(50),fontFace:SERIF,fontSize:17,italic:true,color:'F4E6D3',align:'center',valign:'middle',margin:0,isTextBox:true});
 };
 const cat=(k,title,sub,f1)=>{const s=pres.addSlide();head(s,title,sub);
  files[k].forEach(([n,f],idx)=>{const c=idx%3,r=Math.floor(idx/3),cx=213+327*c,top=626+250*r;
   s.addImage({path:f,x:i(cx-116),y:i(top),w:i(232),h:i(224)});
   s.addText(n,{x:i(cx-160),y:i(top+208),w:i(320),h:i(42),fontFace:SERIF,fontSize:16,bold:true,color:'FBEFDC',align:'center',valign:'middle',margin:0,isTextBox:true})});
  foot(s,f1);};
 cat('gaming','Tasses gaming','Pour les joueurs de la famille','VOTRE PSEUDO ? ON LE MET SUR LA TASSE');
 cat('proches','Tasses pour vos proches','Un mot doux pour chaque jour','VOTRE IDÉE ? ON LA CRÉE POUR VOUS');
 cat('humour','Tasses avec humour','Le café, mais avec le sourire','VOTRE PHRASE ? ON LA CRÉE POUR VOUS');
 const s=pres.addSlide();head(s,'Tasse Sunset Drive','L’esprit road trip au coucher du soleil');
 s.addImage({path:banner,x:i(100),y:i(640),w:i(880),h:i(300),rounding:false});
 s.addImage({path:sunMug,x:i(320),y:i(968),w:i(440),h:i(423)});
 foot(s,'VOTRE PSEUDO OU VOTRE PHOTO  ✦  FAIT MAIN À PARIS');
 // other ready stories as full images (text is part of the picture)
 for(const [f,t] of [['/home/user/geniy/instagram/stories/commander.png','Comment commander'],['/home/user/geniy/instagram/stories/tarifs.png','Nos tarifs'],['/home/user/geniy/coffrets/story_coffrets_1.png','Coffrets 1'],['/home/user/geniy/coffrets/story_coffrets_2.png','Coffrets 2']]){
  const s2=pres.addSlide();const j=IMG+'story-'+slug(t)+'.jpg';{const b2=await chromium.launch();const q=await b2.newPage({viewport:{width:1080,height:1920}});await q.goto('file://'+f);await q.screenshot({path:j,type:'jpeg',quality:90});await b2.close()}s2.addImage({path:j,x:0,y:0,w:7.5,h:13.333});}
 await pres.writeFile({fileName:OUT+'Maison_Volodymyr_tasses_EDITABLE.pptx'});
 console.log('done');
})();
