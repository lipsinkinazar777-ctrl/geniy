// Product visuals for the website (transparent PNGs), drawn from the same mug designs as the stories
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const P=require('/home/user/geniy/instagram/generate_pack.js');
const pick=(list,name)=>list.find(([n])=>n===name)[1];
const PHOTO_SRC=require('fs').readFileSync('/home/user/geniy/instagram/generate_pack.js','utf8');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:2});
 const shot=async(html,file,w,h)=>{await p.setViewportSize({width:w,height:h});await p.setContent(`<!doctype html><html><head><meta charset="utf-8">${P.FONTS}</head><body style="margin:0;background:transparent">${html}</body></html>`,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:'img/'+file,omitBackground:true,clip:{x:0,y:0,width:w,height:h}})};
 const mug=(d,f)=>shot(`<div style="width:300px;height:290px">${P.mug(d,300)}</div>`,f,300,290);
 // photo scenes come from the "Votre photo" story page; rebuild them through the exported page list
 const ph=await (async()=>{const src=PHOTO_SRC.slice(PHOTO_SRC.indexOf('const PH='),PHOTO_SRC.indexOf('const photoPage='));const HEART=(x,y,s,c)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M0 6C-6-4-20 0-14 10L0 22 14 10C20 0 6-4 0 6Z" fill="${c}"/>`;return eval(src+';PHOTO')})();
 const PH=Object.fromEntries(ph);
 await mug(PH['Famille'],'tasse-famille.png');await mug(PH['En couple'],'tasse-couple.png');await mug(PH['Bébé'],'tasse-bebe.png');await mug(PH['Votre animal'],'tasse-animal.png');
 await mug(pick(P.PROCHES,'Meilleure maman'),'tasse-maman.png');await mug(pick(P.PROCHES,'Super papa'),'tasse-papa.png');
 await mug(pick(P.HUMOUR,'Lundi ?'),'tasse-lundi.png');await mug(pick(P.GAMING,'Level up'),'tasse-level.png');
 // magic mug: black (cold) and revealed (hot)
 await mug(`<rect width="182" height="188" fill="#141114"/><text x="91" y="100" text-anchor="middle" font-family="Cormorant Garamond" font-style="italic" font-size="15" fill="#5a4a40">versez du chaud…</text>`,'magique-froid.png');
 await mug(PH['En couple'],'magique-chaud.png');
 // big hero mug
 await shot(`<div style="width:560px;height:540px">${P.mug(PH['Famille'],560)}</div>`,'hero-tasse.png',560,540);
 // photo on metal plate (tilted, brushed aluminium edge)
 const plate=(scene,w,h,f,rot)=>shot(`<div style="width:${w+80}px;height:${h+80}px;display:grid;place-items:center"><div style="width:${w}px;height:${h}px;transform:rotate(${rot}deg);border-radius:6px;padding:6px;background:linear-gradient(135deg,#f4f4f2,#b9bcc0 30%,#eef0f1 52%,#9ea2a7 75%,#e6e7e9);box-shadow:0 26px 40px rgba(0,0,0,.45),0 4px 10px rgba(0,0,0,.3)"><div style="position:relative;width:100%;height:100%;border-radius:3px;overflow:hidden"><svg viewBox="0 0 182 188" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style="display:block">${scene}</svg><div style="position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.35) 0%,rgba(255,255,255,0) 28%,rgba(255,255,255,0) 60%,rgba(255,255,255,.18) 75%,rgba(255,255,255,0) 90%)"></div></div></div></div>`,f,w+80,h+80);
 await plate(PH['Famille'],300,400,'metal-famille.png',-6);
 await plate(P.SUNSET(182,188,false),300,225,'metal-route.png',4);
 await plate(PH['Votre animal'],220,290,'metal-animal.png',3);
 await b.close();console.log('ok')})();
