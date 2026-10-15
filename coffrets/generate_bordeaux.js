const {chromium}=require('/opt/node-tools/node_modules/playwright');
const I={
 mug:'<path d="M5 8h13v9a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z"/><path d="M18 10.5h2.5a3 3 0 0 1 0 6H18"/><path d="M9 5c-1-1.3 1-2.3 0-3.6M13 5c-1-1.3 1-2.3 0-3.6"/>',
 photo:'<rect x="3" y="4" width="20" height="17" rx="1.5"/><path d="M6 18l5-6 3.5 4 2.5-2.5L21 18"/><circle cx="17" cy="9" r="1.6"/>',
 key:'<circle cx="8" cy="13" r="4.6"/><circle cx="8" cy="13" r="1.4"/><path d="M12.6 13H23M19.5 13v3.2M22 13v2.4"/>',
 magnet:'<path d="M6 4v8a7 7 0 0 0 14 0V4"/><path d="M6 4h4v8a3 3 0 0 0 6 0V4h4"/><path d="M6 8h4M16 8h4"/>',
 heart:'<path d="M13 3v4"/><circle cx="13" cy="2.4" r="1"/><path d="M13 22c-5-3.5-8-6.5-8-10a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 3.5-3 6.5-8 10z"/>'
};
const ic=(k,n=1)=>Array.from({length:n},()=>`<svg viewBox="0 0 26 24" class="i"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${I[k]}</g></svg>`).join('');
const icons=a=>a.map(([k,n])=>ic(k,n||1)).join('');
const ITEMS=[
 {n:'Tasse photo',o:'Votre photo, votre cadeau',c:'Mug céramique personnalisé',ic:[['mug']],p:'10 €'},
 {n:'Photo sur métal',o:'15 × 20 cm',c:'Votre photo, sublimée',ic:[['photo']],p:'6 €'},
 {n:'Photo sur métal',o:'20 × 30 cm',c:'Votre photo, sublimée',ic:[['photo']],p:'8 €'},
 {n:'Grand format',o:'30 × 40 cm',c:'Photo sur métal, idéale pour le salon',ic:[['photo']],p:'dès 25 €'},
 {n:'Photo sur métal',o:'10 × 15 cm',c:'Votre photo, sublimée',ic:[['photo']],p:'4 €'},
 {n:'Mini photo',o:'5,5 × 8,5 cm',c:'Format portefeuille',ic:[['photo']],p:'2 €'},
 {n:'Magnet photo',o:'Pour le frigo',c:'Votre photo en magnet',ic:[['magnet']],p:'3 €'},
 {n:'Porte-clés',o:'Métal',c:'Plastique dès 2 €',ic:[['key']],p:'4 €'},
 {n:'Porte-clés',o:'Double face métal',c:'Une photo de chaque côté',ic:[['key']],p:'5 €'},
 {n:'Pendentif photo',o:'À porter sur soi',c:'Votre photo en pendentif',ic:[['heart']],p:'8 €'}
];
const SETS=[
 {n:'Petit Souvenir',o:'Sans occasion',c:'Magnet · porte-clés métal · mini photo',ic:[['magnet'],['key'],['photo']],p:'12 €'},
 {n:'Pour Maman',o:'Fête des mères',c:'Tasse photo · photo 15×20 · magnet',ic:[['mug'],['photo'],['magnet']],p:'23 €'},
 {n:'Pour Papa',o:'Fête des pères',c:'Tasse photo · porte-clés double · magnet',ic:[['mug'],['key'],['magnet']],p:'22 €'},
 {n:'Duo Amoureux',o:'Saint-Valentin',c:'2 tasses photo · photo 10×15 · magnet',ic:[['mug',2],['photo'],['magnet']],p:'31 €'},
 {n:'Grands-parents',o:'Papi & Mamie',c:'Photo 20×30 · tasse photo · magnet',ic:[['photo'],['mug'],['magnet']],p:'26 €'},
 {n:'Bébé',o:'Naissance',c:'Tasse photo · photo 10×15 · porte-clés · magnet',ic:[['mug'],['photo'],['key'],['magnet']],p:'25 €'},
 {n:'Coffret Famille',o:'Notre best-seller',c:'Tasse photo · photo 15×20 · porte-clés double · magnet',ic:[['mug'],['photo'],['key'],['magnet']],p:'28 €',rib:'Best-seller'},
 {n:'Coffret Noël',o:'Noël & Nouvel An',c:'2 tasses photo · photo 15×20 · porte-clés · 2 magnets',ic:[['mug',2],['photo'],['key'],['magnet',2]],p:'41 €'},
 {n:'Coffret Prestige',o:'Le grand cadeau',c:'Photo 30×40 · tasse photo · pendentif · porte-clés double · magnet',ic:[['photo'],['mug'],['heart'],['key'],['magnet']],p:'51 €',v:'56 €',rib:'Prestige'},
 {n:'Prestige Duo',o:'Pour deux familles',c:'Photo 30×40 · 2 tasses photo · 2 pendentifs · 2 magnets',ic:[['photo'],['mug',2],['heart',2],['magnet',2]],p:'66 €',v:'72 €',rib:'Prestige'}
];
const MONO=`<svg viewBox="0 0 40 40" class="mono"><circle cx="20" cy="20" r="18" fill="#5a0f22" stroke="#e2bb6c" stroke-width="1.6"/><circle cx="20" cy="20" r="15" fill="none" stroke="#e2bb6c" stroke-width=".6"/><text x="11" y="23" font-family="Cinzel,serif" font-weight="600" font-size="14" fill="#f3d996">M</text><text x="20" y="28" font-family="Cinzel,serif" font-weight="600" font-size="12" fill="#f3d996">V</text></svg>`;
const BASE=`<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@1,500;1,600&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>
*{box-sizing:border-box;margin:0}body{font-family:Montserrat,Arial,sans-serif;color:#f6e9d6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.bg{background:radial-gradient(120% 90% at 50% 0%,#8e1c3a 0%,#5e0f24 55%,#2a050e 100%)}
.i{width:1em;height:1em;display:inline-block;color:#e2bb6c}
.gold{background:linear-gradient(#fbe7b0,#e2bb6c 50%,#b8863a);-webkit-background-clip:text;background-clip:text;color:transparent}
.pill{display:inline-block;border:.5mm solid #e2bb6c;border-radius:99px;background:linear-gradient(#3a0911,#16030a);font-weight:800;white-space:nowrap}
</style>`;
const tag=s=>`<div class="t bg">${s.rib?`<span class="rib">${s.rib}</span>`:''}<div class="hd">${MONO}<span>MAISON VOLODYMYR</span></div><div class="n gold">${s.n}</div><div class="o">${s.o}</div><div class="ct">${s.c}${SETS.includes(s)?'<br>Coffret cadeau inclus':''}</div><div class="b"><div class="ics">${icons(s.ic)}</div><div class="pr">${s.v?`<div class="v">Valeur ${s.v}</div>`:''}<span class="pill"><span class="gold">${s.p}</span></span></div></div></div>`;
const A4=`<!doctype html><html><head><meta charset="utf-8">${BASE}<style>
@page{size:A4;margin:0}body{background:#fff}
.sheet{width:210mm;height:297mm;padding:11mm 15mm;display:grid;grid-template-columns:90mm 90mm;grid-auto-rows:55mm;justify-content:center;align-content:center;page-break-after:always;break-after:page}
.t{width:90mm;height:55mm;outline:.2mm dashed #bbb;padding:4.6mm 5.6mm;display:flex;flex-direction:column;position:relative;overflow:hidden}
.t:before{content:"";position:absolute;inset:1.6mm;border:.35mm solid rgba(226,187,108,.75);border-radius:1.6mm;pointer-events:none}
.hd{display:flex;align-items:center;gap:1.4mm;font:600 2.2mm Cinzel,serif;letter-spacing:.32em;color:#ecd6b4}.mono{width:5.4mm;height:5.4mm}
.n{font:600 6.4mm/1.05 Cinzel,serif;margin-top:2.2mm;letter-spacing:.02em}.o{font:italic 600 3.6mm "Cormorant Garamond",serif;color:#f3d996;margin-top:.6mm}
.ct{font-size:2.4mm;line-height:1.35;color:#f0e2cc;margin-top:1.2mm;flex:1}
.b{display:flex;justify-content:space-between;align-items:flex-end}.ics{font-size:4.2mm;display:flex;gap:.9mm}
.v{font-size:2.2mm;color:#e9cf98;text-align:right;margin-bottom:.8mm}.pill{font-size:6.6mm;padding:.8mm 4mm}
.rib{position:absolute;top:4.2mm;right:5mm;background:linear-gradient(135deg,#f3d996,#c9963f);color:#2a0b10;font-size:2mm;font-weight:700;padding:.5mm 2mm;border-radius:2mm;text-transform:uppercase;letter-spacing:.06em}
</style></head><body><div class="sheet">${ITEMS.map(tag).join('')}</div><div class="sheet">${SETS.map(tag).join('')}</div></body></html>`;
const post=`<!doctype html><html><head><meta charset="utf-8">${BASE}<style>
body{width:1080px;height:1350px;overflow:hidden}.w{width:1080px;height:1350px;padding:40px 52px 30px;display:flex;flex-direction:column}
.hd{display:flex;flex-direction:column;align-items:center}.mono{width:84px;height:84px}.brand{font:500 24px Cinzel,serif;letter-spacing:.38em;color:#ecd6b4;margin-top:10px}
h1{font:600 64px/1 Cinzel,serif;text-align:center;margin:16px 0 4px;letter-spacing:.03em}.sub{text-align:center;font-weight:600;font-size:18px;letter-spacing:.32em}
.g{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px;flex:1}
.c{position:relative;border:1.5px solid rgba(226,187,108,.6);border-radius:16px;padding:12px 16px;background:rgba(26,4,9,.45);display:flex;flex-direction:column}
.c.hl{border:2px solid #e2bb6c;background:linear-gradient(135deg,rgba(243,217,150,.14),rgba(26,4,9,.5))}
.rib{position:absolute;top:-11px;right:16px;background:linear-gradient(135deg,#f3d996,#c9963f);color:#2a0b10;font-size:13px;font-weight:700;padding:3px 12px;border-radius:99px;letter-spacing:.06em;text-transform:uppercase}
.n{font:600 28px/1.05 Cinzel,serif}.o{font:italic 600 20px "Cormorant Garamond",serif;color:#f3d996}.ct{font-size:14.5px;line-height:1.3;color:#f0e2cc;margin-top:4px;flex:1}
.b{display:flex;justify-content:space-between;align-items:flex-end;margin-top:6px}.ics{font-size:24px;display:flex;gap:5px}.v{font-size:13px;color:#e9cf98;text-align:right;margin-bottom:3px}.pill{font-size:30px;padding:3px 18px}
.f{margin-top:14px;border-top:2px solid #e2bb6c;padding-top:12px;text-align:center}.f1{font-weight:600;font-size:17px;letter-spacing:.14em;color:#e9cf98}.f2{font:italic 600 24px "Cormorant Garamond",serif;margin-top:4px}
</style></head><body><div class="w bg"><div class="hd">${MONO}<div class="brand">MAISON VOLODYMYR</div></div><h1 class="gold">COFFRETS CADEAUX</h1><div class="sub">PERSONNALISÉS AVEC VOS PHOTOS · COFFRET INCLUS</div>
<div class="g">${SETS.map(s=>`<div class="c ${s.rib?'hl':''}">${s.rib?`<span class="rib">${s.rib}</span>`:''}<div class="n gold">${s.n}</div><div class="o">${s.o}</div><div class="ct">${s.c}</div><div class="b"><div class="ics">${icons(s.ic)}</div><div>${s.v?`<div class="v">Valeur ${s.v}</div>`:''}<span class="pill"><span class="gold">${s.p}</span></span></div></div></div>`).join('')}</div>
<div class="f"><div class="f1">APERÇU GRATUIT  ✦  FAIT MAIN À PARIS  ✦  WHATSAPP +33 7 58 18 15 15</div><div class="f2">@maison.volodymyr</div></div></div></body></html>`;
(async()=>{const b=await chromium.launch();const out='/home/user/geniy/coffrets/';
 let p=await b.newPage({viewport:{width:794,height:1123}});await p.setContent(A4,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
 await p.pdf({path:out+'etiquettes_bordeaux_A4.pdf',format:'A4',printBackground:true,margin:{top:0,right:0,bottom:0,left:0}});
 await p.screenshot({path:out+'etiquettes_bordeaux_apercu.png',fullPage:true});
 await p.setViewportSize({width:1080,height:1350});await p.setContent(post,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:out+'coffrets_bordeaux_post.png'});
 console.log('fonts',await p.evaluate(()=>[...document.fonts].filter(f=>f.status=='loaded').map(f=>f.family).join(',')));await b.close()})();
