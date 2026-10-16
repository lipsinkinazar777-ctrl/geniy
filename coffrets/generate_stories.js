const {chromium}=require('/opt/node-tools/node_modules/playwright');
const {CTA}=require('/home/user/geniy/instagram/generate_pack.js');
const ICONS={
 commander:`<path d="M20 28h60a6 6 0 0 1 6 6v28a6 6 0 0 1-6 6H48L32 82V68h-12a6 6 0 0 1-6-6V34a6 6 0 0 1 6-6z"/><circle cx="36" cy="48" r="2.6" fill="currentColor"/><circle cx="50" cy="48" r="2.6" fill="currentColor"/><circle cx="64" cy="48" r="2.6" fill="currentColor"/>`,
 tarifs:`<path d="M18 22h34l30 30a6 6 0 0 1 0 8L60 82a6 6 0 0 1-8 0L18 48z"/><circle cx="34" cy="38" r="5"/><text x="56" y="62" font-size="22" font-weight="600" text-anchor="middle" fill="currentColor" stroke="none" font-family="Georgia,serif" transform="rotate(45 56 54)">€</text>`,
 tasses:`<path d="M24 34h40v28a14 14 0 0 1-14 14h-12a14 14 0 0 1-14-14z"/><path d="M64 42h8a10 10 0 0 1 0 20h-8"/><path d="M34 26c-3-4 3-7 0-11M46 26c-3-4 3-7 0-11M58 26c-3-4 3-7 0-11"/><path d="M30 84h28"/>`,
 photos:`<rect x="16" y="20" width="68" height="60" rx="4"/><rect x="26" y="30" width="48" height="40" rx="2"/><path d="M28 66l14-16 10 11 8-7 12 12"/><circle cx="60" cy="42" r="4.5"/>`,
 'porte-cles':`<circle cx="30" cy="50" r="15"/><circle cx="30" cy="50" r="5"/><path d="M45 50h40M72 50v11M81 50v8"/>`,
 coffrets:`<rect x="20" y="46" width="60" height="34" rx="2"/><rect x="16" y="34" width="68" height="13" rx="2"/><path d="M50 34v46"/><path d="M50 34c-8-14-24-10-18-1 3 3 12 1 18 1zM50 34c8-14 24-10 18-1-3 3-12 1-18 1z"/>`,
 atelier:`<path d="M14 48L50 18l36 30"/><path d="M24 42v40h52V42"/><rect x="42" y="58" width="16" height="24"/><path d="M62 54h8v8h-8z"/>`,
 avis:`<path d="M50 14l11 24 26 3-19 18 5 26-23-13-23 13 5-26-19-18 26-3z"/>`
};
const STAR=(x,y,r,o=1)=>`<g transform="translate(${x} ${y})" opacity="${o}"><circle r="${r*1.7}" fill="url(#glow)"/><path d="M0 ${-r} Q0 0 ${r*.16} 0 Q0 0 0 ${r} Q0 0 ${-r*.16} 0 Q0 0 0 ${-r}Z M${-r*.75} 0 Q0 0 0 ${-r*.12} Q0 0 ${r*.75} 0 Q0 0 0 ${r*.12} Q0 0 ${-r*.75} 0Z" fill="#fff3d6"/></g>`;
const DEFS=`<defs><radialGradient id="glow"><stop offset="0" stop-color="rgba(255,240,205,.85)"/><stop offset=".3" stop-color="rgba(243,217,150,.3)"/><stop offset="1" stop-color="rgba(243,217,150,0)"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe7b0"/><stop offset=".5" stop-color="#e2bb6c"/><stop offset="1" stop-color="#b8863a"/></linearGradient></defs>`;
const dots=()=>{let s='';for(let i=0;i<70;i++){const r=v=>{const q=Math.sin(i*91.7+v*17.3)*1e4;return q-Math.floor(q)};s+=`<circle cx="${(r(1)*1080).toFixed(0)}" cy="${(r(2)*1920).toFixed(0)}" r="${(1+r(4)*2.4).toFixed(1)}" fill="rgba(243,217,150,${(.1+r(3)*.35).toFixed(2)})"/>`}return s};
const BG=`<div style="position:absolute;inset:0;background:radial-gradient(70% 48% at 50% 42%,#8c1b38 0%,#5f1026 48%,#25060e 100%)"></div>
<div style="position:absolute;inset:-400px;background:repeating-linear-gradient(115deg,transparent 0 230px,rgba(255,220,200,.05) 230px 310px);"></div>
<div style="position:absolute;left:0;right:0;bottom:0;height:620px;background:radial-gradient(50% 60% at 50% 100%,rgba(255,190,150,.1),transparent)"></div>`;
const FONTS=`<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet">`;
const cover=k=>`<!doctype html><html><head><meta charset="utf-8">${FONTS}</head><body style="margin:0;width:1080px;height:1920px;overflow:hidden;position:relative;background:#25060e">${BG}
<svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0">${DEFS}${dots()}
<circle cx="540" cy="960" r="400" fill="rgba(90,15,34,.55)"/>
<circle cx="540" cy="960" r="380" fill="none" stroke="url(#gold)" stroke-width="5"/><circle cx="540" cy="960" r="352" fill="none" stroke="url(#gold)" stroke-width="1.6" opacity=".7"/>
<g transform="translate(340 760) scale(4)" color="#f0cf88" fill="none" stroke="url(#gold)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 16px rgba(243,217,150,.5))">${ICONS[k].replace(/fill="currentColor"/g,'fill="#f0cf88"')}</g>
${STAR(830,640,40)}${STAR(250,1300,30,.85)}</svg></body></html>`;
// coffret stories (2 x 5 sets)
const SETS=[
 ['Petit Souvenir','Sans occasion','Magnet · porte-clés métal · mini photo','12 €'],
 ['Pour Maman','Fête des mères','Tasse photo · photo 15×20 · magnet','23 €'],
 ['Pour Papa','Fête des pères','Tasse photo · porte-clés double · magnet','22 €'],
 ['Duo Amoureux','Saint-Valentin','2 tasses photo · photo 10×15 · magnet','31 €'],
 ['Grands-parents','Papi & Mamie','Photo 20×30 · tasse photo · magnet','26 €'],
 ['Bébé','Naissance','Tasse photo · photo 10×15 · porte-clés · magnet','25 €'],
 ['Coffret Famille','Notre best-seller','Tasse · photo 15×20 · porte-clés double · magnet','28 €','Best-seller'],
 ['Coffret Noël','Noël & Nouvel An','2 tasses · photo 15×20 · porte-clés · 2 magnets','41 €'],
 ['Coffret Prestige','Le grand cadeau','Photo 30×40 · tasse · pendentif · porte-clés double · magnet','51 €','Prestige','56 €'],
 ['Prestige Duo','Pour deux familles','Photo 30×40 · 2 tasses · 2 pendentifs · 2 magnets','66 €','Prestige','72 €']
];
const story=(title,sub,list,cta)=>`<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;overflow:hidden;position:relative;background:#25060e;font-family:Montserrat,sans-serif;color:#f4e6d3}
.top{position:absolute;top:196px;left:0;right:0;text-align:center}
.mono{width:116px;height:116px;margin:0 auto;border-radius:50%;background:#5a0f22;border:3px solid #e2bb6c;box-shadow:0 0 0 7px #5a0f22,0 0 0 8.5px rgba(226,187,108,.8),0 0 50px rgba(255,200,170,.35);display:grid;place-items:center;font:600 44px Cinzel,serif;color:#f0cf88;letter-spacing:-4px}
.brand{font:500 36px "Cormorant Garamond",serif;letter-spacing:.32em;color:#ecdcc6;margin-top:34px}
.line{width:480px;height:1.6px;margin:18px auto 0;background:linear-gradient(90deg,transparent,#e2bb6c,transparent)}
h1{font:600 78px/1 "Cormorant Garamond",serif;margin-top:46px;text-shadow:0 4px 14px rgba(0,0,0,.35)}.sub{font:italic 500 46px "Cormorant Garamond",serif;color:#e9c47e;margin-top:14px}
.list{position:absolute;top:650px;left:80px;right:80px;display:grid;gap:18px}
.c{position:relative;border:1.5px solid rgba(226,187,108,.65);border-radius:22px;padding:13px 28px;background:rgba(26,4,9,.45);display:flex;align-items:center;gap:20px}
.c.hl{border:2.5px solid #e2bb6c;background:linear-gradient(135deg,rgba(243,217,150,.15),rgba(26,4,9,.5))}
.tx{flex:1;min-width:0}.n{font:600 42px/1.05 "Cormorant Garamond",serif;background:linear-gradient(#fbe7b0,#e2bb6c 55%,#b8863a);-webkit-background-clip:text;background-clip:text;color:transparent}
.o{font:italic 500 26px "Cormorant Garamond",serif;color:#e9c47e}.ct{font-size:20px;color:#f0e2cc;margin-top:4px;line-height:1.3}
.p{flex:none;border:2.5px solid #e2bb6c;border-radius:99px;background:linear-gradient(#3a0911,#16030a);padding:6px 24px;font:800 40px Montserrat,sans-serif;box-shadow:0 8px 20px rgba(0,0,0,.45)}
.p span{background:linear-gradient(#fbe7b0,#e2bb6c 55%,#b8863a);-webkit-background-clip:text;background-clip:text;color:transparent}
.rib{position:absolute;top:-14px;right:26px;background:linear-gradient(135deg,#f3d996,#c9963f);color:#2a0b10;font-size:15px;font-weight:700;padding:3px 14px;border-radius:99px;letter-spacing:.08em;text-transform:uppercase}
.foot{position:absolute;top:1452px;left:0;right:0;text-align:center}.foot.soft{top:1478px}.foot.soft .line{margin:0 auto 26px;width:420px;height:1.6px;background:linear-gradient(90deg,transparent,#e2bb6c,transparent)}.soft .f1{margin-top:0;font-size:22px}.soft .f2{font-size:34px;margin-top:10px}.f1{font-weight:600;font-size:21px;letter-spacing:.18em;color:#e9cf98;margin-top:30px}.f2{font:italic 500 32px "Cormorant Garamond",serif;margin-top:6px}
.gold{background:linear-gradient(#fbe7b0,#e2bb6c 55%,#b8863a);-webkit-background-clip:text;background-clip:text;color:transparent}
.cta{display:inline-flex;align-items:center;gap:24px;padding:16px 50px 16px 18px;border:3px solid #e2bb6c;border-radius:99px;background:linear-gradient(#4a0c18,#1a040a);box-shadow:0 0 0 7px rgba(226,187,108,.14),0 14px 34px rgba(0,0,0,.5),0 0 60px rgba(243,217,150,.18);text-align:left}
.cta .ic{flex:none;width:92px;height:92px;border-radius:50%;background:linear-gradient(135deg,#fbe7b0,#c9963f);display:grid;place-items:center}
.cta .b1{font:700 31px Montserrat,sans-serif;color:#f6e9d6;letter-spacing:.01em}.cta .b2{font:600 40px/1.1 Cinzel,serif;letter-spacing:.05em;margin-top:4px}
.pw{flex:none;text-align:center}.was{display:block;font:600 24px Montserrat,sans-serif;color:rgba(244,230,211,.75);text-decoration:line-through;text-decoration-color:#e2bb6c;text-decoration-thickness:3px;margin-bottom:0}
</style></head><body>${BG}<svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0">${DEFS}${dots()}<rect x="70" y="560" width="1.4" height="900" fill="rgba(243,217,150,.5)"/>${STAR(71,640,46)}${STAR(71,1330,34,.9)}${STAR(1010,250,22,.7)}</svg>
<div class="top"><div class="mono">MV</div><div class="brand">MAISON VOLODYMYR</div><div class="line"></div><h1>${title}</h1><div class="sub">${sub}</div></div>
<div class="list">${list.map(s=>`<div class="c ${s[4]?'hl':''}">${s[4]?`<span class="rib">${s[4]}</span>`:''}<div class="tx"><div class="n">${s[0]}</div><div class="o">${s[1]}</div><div class="ct">${s[2]}</div></div><div class="pw">${s[5]?`<span class="was">${s[5]}</span>`:''}<div class="p"><span>${s[3]}</span></div></div></div>`).join('')}</div>
${cta?`<div class="foot">${CTA}`:`<div class="foot soft"><div class="line"></div>`}<div class="f1">COFFRET INCLUS  ✦  FAIT MAIN À PARIS</div><div class="f2">@maison.volodymyr</div></div></body></html>`;
module.exports={PAGES:()=>[['coffrets_1',story('Coffrets cadeaux','Personnalisés avec vos photos',SETS.slice(0,5))],['coffrets_2',story('Nos grands coffrets','Pour les plus beaux cadeaux',SETS.slice(5),1)]]};
if(require.main===module)(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
 for(const k of Object.keys(ICONS)){await p.setContent(cover(k),{waitUntil:'networkidle'});await p.screenshot({path:`/home/user/geniy/instagram/covers/${k}.png`});}
 await p.setContent(story('Coffrets cadeaux','Personnalisés avec vos photos',SETS.slice(0,5)),{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:'/home/user/geniy/coffrets/story_coffrets_1.png'});
 await p.setContent(story('Nos grands coffrets','Pour les plus beaux cadeaux',SETS.slice(5),1),{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:'/home/user/geniy/coffrets/story_coffrets_2.png'});
 await b.close()})();
