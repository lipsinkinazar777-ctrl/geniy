// Clean story backgrounds for Canva: no mugs, no text (+ one with only the MV logo)
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const P=require('/home/user/geniy/instagram/generate_pack.js');
const deco=`<svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0">${P.DEFS}${P.dots()}<rect x="70" y="560" width="1.4" height="900" fill="rgba(243,217,150,.5)"/>${P.STAR(71,640,46)}${P.STAR(71,1330,34,.9)}${P.STAR(1010,250,22,.7)}</svg>`;
const logo=`<div style="position:absolute;top:196px;left:0;right:0;text-align:center"><div style="width:116px;height:116px;margin:0 auto;border-radius:50%;background:#5a0f22;border:3px solid #e2bb6c;box-shadow:0 0 0 7px #5a0f22,0 0 0 8.5px rgba(226,187,108,.8),0 0 50px rgba(255,200,170,.35);display:grid;place-items:center;font:600 44px Cinzel,serif;color:#f0cf88">MV</div><div style="font:500 36px 'Cormorant Garamond',serif;letter-spacing:.32em;color:#ecdcc6;margin-top:34px">MAISON VOLODYMYR</div><div style="width:480px;height:1.6px;margin:18px auto 0;background:linear-gradient(90deg,transparent,#e2bb6c,transparent)"></div></div>`;
const page=x=>`<!doctype html><html><head><meta charset="utf-8">${P.FONTS}</head><body style="margin:0;width:1080px;height:1920px;overflow:hidden;position:relative;background:#25060e">${P.BG}${deco}${x}</body></html>`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
 for(const [f,x] of [['Fond_vide.png',''],['Fond_avec_logo.png',logo]]){await p.setContent(page(x),{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:__dirname+'/'+f})}
 await b.close()})();
