// Empty "Tasses gaming & héros" story for Canva: background + logo as picture, all text live & editable
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs');
const P=require('/home/user/geniy/instagram/generate_pack.js');
const STATIC=fs.readFileSync(__dirname+'/fonts_static.css','utf8');
const caps=[['FORTNITE','RED DEAD II','COUNTER STRIKE'],['ROBLOX','BATMAN','BRAWL STARS']];
const cols=[220,540,860],rows=[1045,1450];
const logo=`<svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0">${P.DEFS}
<image href="data:image/png;base64,${fs.readFileSync(__dirname+'/template/logo_MV.png').toString('base64')}" x="460" y="160" width="160" height="160"/>
<rect x="300" y="404" width="480" height="1.8" fill="url(#lg)"/><defs><linearGradient id="lg"><stop offset="0" stop-color="#e2bb6c" stop-opacity="0"/><stop offset=".5" stop-color="#e2bb6c"/><stop offset="1" stop-color="#e2bb6c" stop-opacity="0"/></linearGradient></defs>
<rect x="400" y="1530" width="280" height="1.6" fill="url(#lg)"/></svg>`;
const deco=`<svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0">${P.DEFS}${P.dots()}<rect x="70" y="560" width="1.4" height="900" fill="rgba(243,217,150,.5)"/>${P.STAR(71,640,46)}${P.STAR(71,1330,34,.9)}${P.STAR(1010,250,22,.7)}</svg>`;
const t=(x,y,css,txt)=>`<div class="t" style="position:absolute;left:${x-480}px;width:960px;top:${y}px;text-align:center;${css}">${txt}</div>`;
const body=`${P.BG}${deco}${logo}
${t(540,340,"font:500 38px 'Cormorant Garamond',serif;letter-spacing:.3em;color:#ecdcc6",'MAISON VOLODYMYR')}
${t(540,420,"font:600 76px/1.1 'Cormorant Garamond',serif;color:#f6e6cf",'Tasses gaming &amp; héros')}
${t(540,520,"font:500 44px 'Cormorant Garamond',serif;color:#e9c47e",'Votre jeu préféré, sur votre tasse')}
${rows.map((y,r)=>cols.map((x,c)=>`<div class="t" style="position:absolute;left:${x-170}px;width:340px;top:${y-22}px;text-align:center;font:600 34px 'Cormorant Garamond',serif;color:#fbefdc">${caps[r][c]}</div>`).join('')).join('')}
${t(540,1552,"font:700 24px Montserrat,sans-serif;letter-spacing:.2em;color:#e9c47e",'VOTRE IDÉE ? ON LA CRÉE POUR VOUS')}
${t(540,1594,"font:500 34px 'Cormorant Garamond',serif;color:#f4e6d3",'@maison.volodymyr')}`;
const html=fonts=>`<!doctype html><html><head><meta charset="utf-8">${fonts}<style>*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;overflow:hidden;position:relative;background:#25060e}</style></head><body>${body}</body></html>`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
 await p.setContent(html(P.FONTS),{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
 await p.screenshot({path:__dirname+'/template/apercu_avec_texte.png'});
 await p.addStyleTag({content:'.t{visibility:hidden}'});
 const bg=await p.screenshot({type:'png'});fs.writeFileSync(__dirname+'/template/fond_sans_texte.png',bg);
 await p.setContent(html(`<style>${STATIC}</style>`),{waitUntil:'networkidle'});
 await p.addStyleTag({content:`@page{size:1080px 1920px;margin:0}html{overflow:hidden}body>*:not(.t){display:none!important}body{background:url(data:image/png;base64,${bg.toString('base64')}) 0 0/1080px 1920px no-repeat!important}`});
 await p.evaluate(()=>{for(const e of document.querySelectorAll('.t'))e.textContent=e.textContent.replace(/ /g,' ')});
 await p.evaluate(()=>document.fonts.ready);
 await p.pdf({path:__dirname+'/template/Tasses_vide_CANVA.pdf',width:'1080px',height:'1920px',printBackground:true,preferCSSPageSize:true,margin:{top:0,right:0,bottom:0,left:0}});
 await b.close()})();
