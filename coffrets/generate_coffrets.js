const {chromium}=require('/opt/node-tools/node_modules/playwright');
const I={
 mug:'<path d="M5 8h13v9a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z"/><path d="M18 10.5h2.5a3 3 0 0 1 0 6H18"/><path d="M9 5c-1-1.3 1-2.3 0-3.6M13 5c-1-1.3 1-2.3 0-3.6"/>',
 photo:'<rect x="3" y="4" width="20" height="17" rx="1.5"/><path d="M6 18l5-6 3.5 4 2.5-2.5L21 18"/><circle cx="17" cy="9" r="1.6"/>',
 key:'<circle cx="8" cy="13" r="4.6"/><circle cx="8" cy="13" r="1.4"/><path d="M12.6 13H23M19.5 13v3.2M22 13v2.4"/>',
 magnet:'<path d="M6 4v8a7 7 0 0 0 14 0V4"/><path d="M6 4h4v8a3 3 0 0 0 6 0V4h4"/><path d="M6 8h4M16 8h4"/>',
 heart:'<path d="M13 3v4"/><circle cx="13" cy="2.4" r="1"/><path d="M13 22c-5-3.5-8-6.5-8-10a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 3.5-3 6.5-8 10z"/>'
};
const ic=(k,n=1)=>Array.from({length:n},()=>`<svg viewBox="0 0 26 24" class="i"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${I[k]}</g></svg>`).join('');
const S=[
 {n:'Petit Souvenir',o:'Sans occasion',c:'Magnet · porte-clés métal · mini photo',ic:[['magnet'],['key'],['photo']],p:12},
 {n:'Pour Maman',o:'Fête des mères',c:'Mug photo · photo 15×20 · magnet',ic:[['mug'],['photo'],['magnet']],p:21},
 {n:'Pour Papa',o:'Fête des pères',c:'Mug photo · porte-clés double métal · magnet',ic:[['mug'],['key'],['magnet']],p:20},
 {n:'Duo Amoureux',o:'Saint-Valentin',c:'2 mugs photo · photo 10×15 · magnet',ic:[['mug',2],['photo'],['magnet']],p:27},
 {n:'Grands-parents',o:'Papi & Mamie',c:'Photo 20×30 · mug photo · magnet',ic:[['photo'],['mug'],['magnet']],p:24},
 {n:'Bébé',o:'Naissance',c:'Mug photo · photo 10×15 · porte-clés · magnet',ic:[['mug'],['photo'],['key'],['magnet']],p:23},
 {n:'Coffret Famille',o:'Notre best-seller',c:'Mug photo · photo 15×20 · porte-clés double · magnet',ic:[['mug'],['photo'],['key'],['magnet']],p:26,best:1},
 {n:'Coffret Noël',o:'Noël & Nouvel An',c:'2 mugs photo · photo 15×20 · porte-clés · 2 magnets',ic:[['mug',2],['photo'],['key'],['magnet',2]],p:37},
 {n:'Coffret Prestige',o:'Le grand cadeau',c:'Photo 30×40 · mug photo · pendentif · porte-clés double · magnet',ic:[['photo'],['mug'],['heart'],['key'],['magnet']],p:49,v:54,prem:1},
 {n:'Prestige Duo',o:'Pour deux familles',c:'Photo 30×40 · 2 mugs photo · 2 pendentifs · 2 magnets',ic:[['photo'],['mug',2],['heart',2],['magnet',2]],p:62,v:68,prem:1}
];
const icons=s=>s.ic.map(([k,n])=>ic(k,n||1)).join('');
const BASE=`<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}body{font-family:Poppins,Arial,sans-serif;color:#f3e7cf}
.bg{background:radial-gradient(900px 600px at 80% 0%,rgba(224,138,60,.22),transparent 60%),radial-gradient(800px 700px at 0% 100%,rgba(40,90,70,.55),transparent 60%),linear-gradient(#123326,#0b1f18)}
.cu{color:#f0a257}.serif{font-family:"Cormorant Garamond",Georgia,serif}
.i{width:1em;height:1em;display:inline-block;color:#f0a257}
.logo{display:flex;align-items:center;gap:.5em;letter-spacing:.32em;text-transform:uppercase;font-weight:600;color:#f0a257}
.logo svg{width:1.6em;height:1.6em}
</style>`;
const HOUSE=`<svg viewBox="0 0 24 24"><g fill="none" stroke="#f0a257" stroke-width="1.6" stroke-linejoin="round"><path d="M3 11L12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/><rect x="10" y="14" width="4" height="6"/></g></svg>`;
// 1) Instagram post 1080x1350
const post=`<!doctype html><html><head><meta charset="utf-8">${BASE}<style>
body{width:1080px;height:1350px;overflow:hidden}
.w{width:1080px;height:1350px;padding:50px 56px 34px;display:flex;flex-direction:column}
.logo{font-size:20px}
h1{font:600 80px/1 "Cormorant Garamond",Georgia,serif;margin:14px 0 4px;color:#f7ead2}
.sub{font-size:22px;color:#d9c4a3}
.g{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-top:22px;flex:1}
.c{position:relative;border:1.5px solid rgba(240,162,87,.45);border-radius:18px;padding:13px 18px;background:rgba(10,28,21,.55);display:flex;flex-direction:column}
.c.best{border-color:#f0a257;background:rgba(240,162,87,.1)}.c.prem{border:2px solid #f0a257;background:linear-gradient(135deg,rgba(240,162,87,.18),rgba(10,28,21,.6))}
.tag{position:absolute;top:-12px;right:18px;background:#f0a257;color:#14281f;font-size:14px;font-weight:700;padding:3px 12px;border-radius:99px;letter-spacing:.06em;text-transform:uppercase}
.n{font:700 31px/1.05 "Cormorant Garamond",Georgia,serif;color:#f7ead2}.o{font-size:15px;color:#d9c4a3;letter-spacing:.06em;text-transform:uppercase;margin-top:2px}
.ct{font-size:15px;line-height:1.3;color:#ecdcc0;margin-top:5px;flex:1}
.b{display:flex;align-items:flex-end;justify-content:space-between;margin-top:8px}.ics{font-size:26px;display:flex;gap:6px}
.p{font:700 42px/1 Poppins,sans-serif;color:#f0a257}.v{font-size:14px;color:#d9c4a3;text-align:right;margin-bottom:4px}
.f{display:flex;justify-content:space-between;align-items:center;margin-top:16px;font-size:20px;color:#ecdcc0;border-top:1px solid rgba(240,162,87,.35);padding-top:14px}
</style></head><body><div class="w bg">
<div class="logo">${HOUSE}Maison Volodymyr</div>
<h1>Nos coffrets cadeaux</h1><div class="sub">Personnalisés avec vos photos · fait main à Paris · coffret inclus</div>
<div class="g">${S.map(s=>`<div class="c ${s.best?'best':''} ${s.prem?'prem':''}">${s.best?'<span class="tag">Best-seller</span>':s.prem?'<span class="tag">Prestige</span>':''}<div class="n">${s.n}</div><div class="o">${s.o}</div><div class="ct">${s.c}</div><div class="b"><div class="ics">${icons(s)}</div><div>${s.v?`<div class="v">Valeur ${s.v} €</div>`:''}<div class="p">${s.p} €</div></div></div></div>`).join('')}</div>
<div class="f"><span>Instagram @maison.volodymyr</span><span>WhatsApp +33 7 58 18 15 15</span></div>
</div></body></html>`;
// 2) Story 1080x1920 Prestige
const P=S.filter(s=>s.prem);
const story=`<!doctype html><html><head><meta charset="utf-8">${BASE}<style>
body{width:1080px;height:1920px;overflow:hidden}.w{width:1080px;height:1920px;padding:120px 80px 120px;display:flex;flex-direction:column;align-items:center;text-align:center}
.logo{font-size:24px}h1{font:600 120px/1 "Cormorant Garamond",Georgia,serif;margin:44px 0 10px;color:#f7ead2}.sub{font:italic 500 44px "Cormorant Garamond",Georgia,serif;color:#f0a257}
.c{width:100%;margin-top:48px;border:2px solid #f0a257;border-radius:30px;padding:36px 46px;background:linear-gradient(135deg,rgba(240,162,87,.18),rgba(10,28,21,.6))}
.n{font:700 64px/1 "Cormorant Garamond",Georgia,serif;color:#f7ead2}.ct{font-size:30px;line-height:1.45;color:#ecdcc0;margin:20px 0 26px}
.ics{font-size:54px;display:flex;justify-content:center;gap:14px;margin-bottom:26px}.v{font-size:30px;color:#d9c4a3}.p{font:700 100px/1.05 Poppins,sans-serif;color:#f0a257}
.f{margin-top:auto;padding-top:40px;font-size:32px;color:#ecdcc0;line-height:1.6}
</style></head><body><div class="w bg"><div class="logo">${HOUSE}Maison Volodymyr</div>
<h1>Coffrets<br>Prestige</h1><div class="sub">Le cadeau qui reste au mur et dans le cœur</div>
${P.map(s=>`<div class="c"><div class="n">${s.n}</div><div class="ct">${s.c}</div><div class="ics">${icons(s)}</div><div class="v">Valeur ${s.v} € · coffret inclus</div><div class="p">${s.p} €</div></div>`).join('')}
<div class="f">Envoyez votre photo sur WhatsApp<br><span class="cu">+33 7 58 18 15 15</span> · aperçu gratuit</div></div></body></html>`;
// 3) A4 price tags 90x55mm x10
const tags=`<!doctype html><html><head><meta charset="utf-8">${BASE}<style>
@page{size:A4;margin:0}body{width:210mm;height:297mm;background:#fff}
.sheet{width:210mm;height:297mm;padding:11mm 15mm;display:grid;grid-template-columns:90mm 90mm;grid-auto-rows:55mm;gap:0;justify-content:center;align-content:center}
.t{width:90mm;height:55mm;outline:.2mm dashed #bbb;outline-offset:0;padding:5mm 6mm;display:flex;flex-direction:column;position:relative;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.logo{font-size:2.4mm;letter-spacing:.3em}.logo svg{width:4mm;height:4mm}
.n{font:700 7.4mm/1 "Cormorant Garamond",Georgia,serif;color:#f7ead2;margin-top:2.2mm}.o{font-size:2.3mm;color:#d9c4a3;letter-spacing:.08em;text-transform:uppercase;margin-top:.6mm}
.ct{font-size:2.55mm;line-height:1.35;color:#ecdcc0;margin-top:1.8mm;flex:1}
.b{display:flex;justify-content:space-between;align-items:flex-end}.ics{font-size:4.6mm;display:flex;gap:1mm}
.v{font-size:2.3mm;color:#d9c4a3;text-align:right}.p{font:700 10mm/1 Poppins,sans-serif;color:#f0a257}
.t.prem{box-shadow:inset 0 0 0 .6mm #f0a257}
.rib{position:absolute;top:4.6mm;right:5mm;background:#f0a257;color:#14281f;font-size:2.1mm;font-weight:700;padding:.5mm 2mm;border-radius:2mm;text-transform:uppercase;letter-spacing:.06em}
</style></head><body><div class="sheet">${S.map(s=>`<div class="t bg ${s.prem?'prem':''}">${s.best?'<span class="rib">Best-seller</span>':s.prem?'<span class="rib">Prestige</span>':''}<div class="logo">${HOUSE}Maison Volodymyr</div><div class="n">${s.n}</div><div class="o">${s.o}</div><div class="ct">${s.c}<br>Coffret cadeau inclus</div><div class="b"><div class="ics">${icons(s)}</div><div>${s.v?`<div class="v">Valeur ${s.v} €</div>`:''}<div class="p">${s.p} €</div></div></div></div>`).join('')}</div></body></html>`;
(async()=>{const b=await chromium.launch();
 const out='/home/user/geniy/coffrets/';
 let p=await b.newPage({viewport:{width:1080,height:1350}});await p.setContent(post,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:out+'coffrets_instagram_post.png'});
 await p.setViewportSize({width:1080,height:1920});await p.setContent(story,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:out+'coffrets_prestige_story.png'});
 await p.setViewportSize({width:794,height:1123});await p.setContent(tags,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
 await p.pdf({path:out+'etiquettes_prix_A4.pdf',format:'A4',printBackground:true,margin:{top:0,right:0,bottom:0,left:0}});
 await p.screenshot({path:out+'etiquettes_prix_A4_apercu.png',fullPage:true});
 console.log('fonts',await p.evaluate(()=>[...document.fonts].filter(f=>f.status=='loaded').map(f=>f.family).join(',')));
 await b.close()})();
