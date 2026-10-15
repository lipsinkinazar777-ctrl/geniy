// Instagram pack for Maison Volodymyr: avatar, Commander / Tarifs stories, mug catalogues (1080x1920)
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const OUT='/home/user/geniy/instagram/stories/';
const STAR=(x,y,r,o=1)=>`<g transform="translate(${x} ${y})" opacity="${o}"><circle r="${r*1.7}" fill="url(#glow)"/><path d="M0 ${-r} Q0 0 ${r*.16} 0 Q0 0 0 ${r} Q0 0 ${-r*.16} 0 Q0 0 0 ${-r}Z M${-r*.75} 0 Q0 0 0 ${-r*.12} Q0 0 ${r*.75} 0 Q0 0 0 ${r*.12} Q0 0 ${-r*.75} 0Z" fill="#fff3d6"/></g>`;
const DEFS=`<defs><radialGradient id="glow"><stop offset="0" stop-color="rgba(255,240,205,.85)"/><stop offset=".3" stop-color="rgba(243,217,150,.3)"/><stop offset="1" stop-color="rgba(243,217,150,0)"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe7b0"/><stop offset=".5" stop-color="#e2bb6c"/><stop offset="1" stop-color="#b8863a"/></linearGradient></defs>`;
const dots=(w=1080,h=1920,n=70)=>{let s='';for(let i=0;i<n;i++){const r=v=>{const q=Math.sin(i*91.7+v*17.3)*1e4;return q-Math.floor(q)};s+=`<circle cx="${(r(1)*w).toFixed(0)}" cy="${(r(2)*h).toFixed(0)}" r="${(1+r(4)*2.4).toFixed(1)}" fill="rgba(243,217,150,${(.1+r(3)*.35).toFixed(2)})"/>`}return s};
const BG=`<div style="position:absolute;inset:0;background:radial-gradient(70% 48% at 50% 42%,#8c1b38 0%,#5f1026 48%,#25060e 100%)"></div>
<div style="position:absolute;inset:-400px;background:repeating-linear-gradient(115deg,transparent 0 230px,rgba(255,220,200,.05) 230px 310px)"></div>
<div style="position:absolute;left:0;right:0;bottom:0;height:620px;background:radial-gradient(50% 60% at 50% 100%,rgba(255,190,150,.1),transparent)"></div>`;
const FONTS=`<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Montserrat:wght@500;600;700;800&family=Dancing+Script:wght@600;700&family=Bebas+Neue&family=Press+Start+2P&display=swap" rel="stylesheet">`;
const CSS=`<style>*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;overflow:hidden;position:relative;background:#25060e;font-family:Montserrat,sans-serif;color:#f4e6d3}
.top{position:absolute;top:232px;left:0;right:0;text-align:center}
.mono{width:116px;height:116px;margin:0 auto;border-radius:50%;background:#5a0f22;border:3px solid #e2bb6c;box-shadow:0 0 0 7px #5a0f22,0 0 0 8.5px rgba(226,187,108,.8),0 0 50px rgba(255,200,170,.35);display:grid;place-items:center;font:600 44px Cinzel,serif;color:#f0cf88;letter-spacing:-4px}
.brand{font:500 36px "Cormorant Garamond",serif;letter-spacing:.32em;color:#ecdcc6;margin-top:34px}
.line{width:480px;height:1.6px;margin:18px auto 0;background:linear-gradient(90deg,transparent,#e2bb6c,transparent)}
h1{font:600 78px/1 "Cormorant Garamond",serif;margin-top:46px;text-shadow:0 4px 14px rgba(0,0,0,.35)}.sub{font:italic 500 46px "Cormorant Garamond",serif;color:#e9c47e;margin-top:14px}
.gold{background:linear-gradient(#fbe7b0,#e2bb6c 55%,#b8863a);-webkit-background-clip:text;background-clip:text;color:transparent}
.pill{display:inline-block;border:2.5px solid #e2bb6c;border-radius:99px;background:linear-gradient(#3a0911,#16030a);padding:6px 26px;font:800 40px Montserrat,sans-serif;box-shadow:0 8px 20px rgba(0,0,0,.45)}
.foot{position:absolute;top:1500px;left:0;right:0;text-align:center}.foot .line{margin:0 auto 26px;width:420px}.f1{font-weight:600;font-size:22px;letter-spacing:.18em;color:#e9cf98}.f2{font:italic 500 34px "Cormorant Garamond",serif;margin-top:10px}
</style>`;
const page=(inner,{title,sub,f1})=>`<!doctype html><html><head><meta charset="utf-8">${FONTS}${CSS}</head><body>${BG}
<svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0">${DEFS}${dots()}<rect x="70" y="560" width="1.4" height="900" fill="rgba(243,217,150,.5)"/>${STAR(71,640,46)}${STAR(71,1330,34,.9)}${STAR(1010,250,22,.7)}</svg>
<div class="top"><div class="mono">MV</div><div class="brand">MAISON VOLODYMYR</div><div class="line"></div><h1>${title}</h1><div class="sub">${sub}</div></div>
${inner}
<div class="foot"><div class="line"></div><div class="f1">${f1}</div><div class="f2">@maison.volodymyr</div></div></body></html>`;

/* ---------- avatar ---------- */
const avatar=`<!doctype html><html><head><meta charset="utf-8">${FONTS}</head><body style="margin:0;width:1080px;height:1080px;overflow:hidden;position:relative;background:#25060e">
<div style="position:absolute;inset:0;background:radial-gradient(60% 60% at 50% 45%,#8c1b38 0%,#5f1026 55%,#2a050e 100%)"></div>
<svg viewBox="0 0 1080 1080" width="1080" height="1080" style="position:absolute;inset:0">${DEFS}${dots(1080,1080,40)}
<circle cx="540" cy="540" r="372" fill="none" stroke="url(#gold)" stroke-width="10"/><circle cx="540" cy="540" r="340" fill="none" stroke="url(#gold)" stroke-width="3" opacity=".8"/>
<text x="452" y="590" font-family="Cinzel,serif" font-weight="600" font-size="300" fill="url(#gold)" text-anchor="middle" style="filter:drop-shadow(0 6px 18px rgba(0,0,0,.35))">M</text>
<text x="640" y="700" font-family="Cinzel,serif" font-weight="600" font-size="260" fill="url(#gold)" text-anchor="middle" style="filter:drop-shadow(0 6px 18px rgba(0,0,0,.35))">V</text>
${STAR(800,300,34,.95)}</svg></body></html>`;

/* ---------- Commander ---------- */
const STEP_IC={
 wa:`<path d="M32 6a26 26 0 0 0-22.4 39.2L6 58l13.2-3.5A26 26 0 1 0 32 6z"/><path d="M23 21c1-2 3-2 4 0l2 5c.4 1-.2 2-1 3l-1.5 1.5c1.8 3.8 4.8 6.8 8.6 8.6L36.6 37c1-.8 2-1.4 3-1l5 2c2 1 2 3 0 4-3 3-8 3-14-2-5-4-9-9-10-13-.6-3 .4-5 2.4-6z"/>`,
 photo:`<rect x="8" y="16" width="48" height="36" rx="6"/><circle cx="32" cy="34" r="10"/><path d="M22 16l4-7h12l4 7"/>`,
 eye:`<path d="M4 32s10-18 28-18 28 18 28 18-10 18-28 18S4 32 4 32z"/><circle cx="32" cy="32" r="8"/>`,
 gift:`<rect x="10" y="28" width="44" height="28" rx="2"/><rect x="6" y="18" width="52" height="11" rx="2"/><path d="M32 18v38M32 18c-6-11-18-8-14-1 3 3 9 1 14 1zM32 18c6-11 18-8 14-1-3 3-9 1-14 1z"/>`
};
const step=(n,ic,t,d)=>`<div style="display:flex;align-items:center;gap:30px;border:1.5px solid rgba(226,187,108,.65);border-radius:26px;padding:28px 34px;background:rgba(26,4,9,.45)">
<div style="flex:none;width:120px;height:120px;border-radius:50%;border:2.5px solid #e2bb6c;display:grid;place-items:center;background:rgba(90,15,34,.7);position:relative">
<svg viewBox="0 0 64 64" width="64" height="64"><g fill="none" stroke="#f0cf88" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${STEP_IC[ic]}</g></svg>
<span style="position:absolute;top:-10px;left:-10px;width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#f3d996,#c9963f);color:#2a0b10;font:800 24px Montserrat;display:grid;place-items:center">${n}</span></div>
<div><div class="gold" style="font:600 46px/1.05 'Cormorant Garamond',serif">${t}</div><div style="font-size:24px;line-height:1.35;color:#f0e2cc;margin-top:8px">${d}</div></div></div>`;
const commander=page(`<div style="position:absolute;top:700px;left:100px;right:100px;display:grid;gap:34px">
${step(1,'wa','Ouvrez WhatsApp','Écrivez-nous ce que vous souhaitez commander.')}
${step(2,'photo','Envoyez votre photo','Celle que vous voulez sur votre cadeau.')}
${step(3,'gift','Récupérez votre cadeau','Fait main, avec amour.')}
</div>`,
{title:'Comment commander',sub:'Simple comme un sourire',f1:'FAIT MAIN À PARIS  ✦  AVEC VOS PHOTOS'});

/* ---------- Tarifs ---------- */
const row=(n,p)=>`<div style="display:flex;align-items:baseline;gap:14px;font-size:27px;color:#f4e6d3;padding:4px 0"><span>${n}</span><span style="flex:1;border-bottom:2px dotted rgba(226,187,108,.55);transform:translateY(-8px)"></span><b class="gold" style="font:800 30px Montserrat">${p}</b></div>`;
const grp=(t,rows)=>`<div style="border:1.5px solid rgba(226,187,108,.6);border-radius:24px;padding:16px 34px;background:rgba(26,4,9,.45)"><div style="font:italic 600 36px 'Cormorant Garamond',serif;color:#e9c47e;margin-bottom:6px">${t}</div>${rows.map(r=>row(r[0],r[1])).join('')}</div>`;
const tarifs=page(`<div style="position:absolute;top:680px;left:100px;right:100px;display:grid;gap:16px">
${grp('Tasses & photos sur métal',[['Tasse photo','10 €'],['Photo 5,5 × 8,5 cm','2 €'],['Photo 10 × 15 cm','4 €'],['Photo 15 × 20 cm','6 €'],['Photo 20 × 30 cm','8 €'],['Photo 30 × 40 cm','dès 25 €']])}
${grp('Porte-clés & magnets',[['Magnet photo','3 €'],['Porte-clés plastique / métal','2 € / 4 €'],['Porte-clés double face','5 €'],['Pendentif photo','8 €']])}
<div style="text-align:center;font:italic 600 38px 'Cormorant Garamond',serif;color:#e9c47e">Coffrets cadeaux dès 12 €</div></div>`,
{title:'Nos tarifs',sub:'Avec votre photo ou votre texte',f1:'FAIT MAIN À PARIS  ✦  AVEC VOS PHOTOS'});

/* ---------- mug mockup ---------- */
let MID=0;
function mug(design,w=270){const id='m'+(MID++);
 return `<svg viewBox="0 0 300 280" width="${w}" height="${w*280/300}" style="overflow:visible">
<defs><clipPath id="${id}c"><path d="M44 62 L44 238 Q44 254 60 254 L210 254 Q226 254 226 238 L226 62 Z"/></clipPath>
<linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="rgba(0,0,0,.30)"/><stop offset=".14" stop-color="rgba(0,0,0,.06)"/><stop offset=".32" stop-color="rgba(255,255,255,.38)"/><stop offset=".42" stop-color="rgba(255,255,255,0)"/><stop offset=".8" stop-color="rgba(0,0,0,.06)"/><stop offset="1" stop-color="rgba(0,0,0,.30)"/></linearGradient>
<filter id="${id}b"><feGaussianBlur stdDeviation="7"/></filter></defs>
<ellipse cx="140" cy="262" rx="112" ry="13" fill="rgba(0,0,0,.45)" filter="url(#${id}b)"/>
<path d="M224 96 C292 92 296 210 224 206" fill="none" stroke="#e9e5e0" stroke-width="24" stroke-linecap="round"/>
<path d="M224 96 C292 92 296 210 224 206" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity=".8" transform="translate(-3 -3)"/>
<path d="M44 62 L44 238 Q44 254 60 254 L210 254 Q226 254 226 238 L226 62 Z" fill="#f8f6f3"/>
<g clip-path="url(#${id}c)"><g transform="translate(44 66)">${design}</g></g>
<path d="M44 62 L44 238 Q44 254 60 254 L210 254 Q226 254 226 238 L226 62 Z" fill="url(#${id}s)"/>
<ellipse cx="135" cy="62" rx="91" ry="14" fill="#efebe6" stroke="#d6cfc8" stroke-width="1.5"/><ellipse cx="135" cy="64" rx="82" ry="10" fill="#c9c1b9"/></svg>`}
// design box: 182 x 188 (x 0..182, y 0..188); visible front centre ~ x 30..150
const T=(x,y,txt,f,s,c,extra='')=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="${f}" font-size="${s}" fill="${c}" ${extra}>${txt}</text>`;
const HEART=(x,y,s,c)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M0 6C-6-4-20 0-14 10L0 22 14 10C20 0 6-4 0 6Z" fill="${c}"/>`;
const PROCHES=[
 ['Meilleure maman',T(91,52,'MEILLEURE','Montserrat',13,'#8a1a36','font-weight="700" letter-spacing="3"')+T(91,104,'Maman','Dancing Script',52,'#8a1a36','font-weight="700"')+T(91,128,'DU MONDE','Montserrat',13,'#8a1a36','font-weight="700" letter-spacing="3"')+HEART(91,140,1.3,'#d23a4f')],
 ['Merci maman',`<g fill="#e6a0b0">${[30,150].map(x=>`<circle cx="${x}" cy="40" r="7"/><circle cx="${x+9}" cy="34" r="6"/><circle cx="${x-8}" cy="33" r="5"/>`).join('')}</g>`+T(91,96,'Merci','Dancing Script',44,'#7a2a3a','font-weight="700"')+T(91,138,'Maman','Dancing Script',44,'#c0475f','font-weight="700"')+T(91,162,'d’être toujours là','Cormorant Garamond',16,'#7a2a3a','font-style="italic"')],
 ['Super papa',`<path d="M91 70c-14-12-36-8-40 4 10-4 22 0 40 10 18-10 30-14 40-10-4-12-26-16-40-4z" fill="#3a2a22"/>`+T(91,124,'SUPER','Bebas Neue',46,'#1f3b5c','letter-spacing="2"')+T(91,166,'PAPA','Bebas Neue',46,'#c28a2c','letter-spacing="2"')],
 ['Papa, mon héros',`<path d="M91 26l8 17 18 2-13 12 4 18-17-9-17 9 4-18-13-12 18-2z" fill="#d6a640"/>`+T(91,124,'Papa','Dancing Script',50,'#1f3b5c','font-weight="700"')+T(91,154,'MON HÉROS','Montserrat',14,'#1f3b5c','font-weight="700" letter-spacing="4"')],
 ['Mamie d’amour',`<path transform="translate(91 32) scale(1.6)" d="M0 6C-6-4-20 0-14 10L0 22 14 10C20 0 6-4 0 6Z" fill="none" stroke="#d23a4f" stroke-width="2"/>`+T(91,116,'Mamie','Dancing Script',50,'#8a1a36','font-weight="700"')+T(91,146,'D’AMOUR','Montserrat',14,'#8a1a36','font-weight="700" letter-spacing="4"')],
 ['Papi en or',`<path d="M62 64l10-26 19 18 19-18 10 26z" fill="#d6a640"/><rect x="62" y="64" width="58" height="8" fill="#b8863a"/>`+T(91,124,'Papi','Dancing Script',50,'#3a2a22','font-weight="700"')+T(91,154,'EN OR','Montserrat',15,'#b8863a','font-weight="800" letter-spacing="5"')],
 ['Ma sœur',T(91,80,'Ma sœur,','Dancing Script',44,'#6a3a7a','font-weight="700"')+T(91,116,'ma meilleure','Cormorant Garamond',22,'#6a3a7a','font-style="italic"')+T(91,140,'amie','Cormorant Garamond',22,'#6a3a7a','font-style="italic"')+HEART(91,150,.9,'#b56fc4')],
 ['Toi & moi',HEART(70,40,1.4,'#d23a4f')+HEART(110,48,1.1,'#e98092')+T(91,124,'Toi & moi','Dancing Script',44,'#8a1a36','font-weight="700"')+T(91,152,'DEPUIS 2019','Montserrat',13,'#8a1a36','font-weight="700" letter-spacing="3"')],
 ['Votre photo',`<rect x="22" y="18" width="138" height="150" rx="6" fill="#d9c9b8"/><rect x="22" y="18" width="138" height="150" rx="6" fill="url(#fam)"/><defs><linearGradient id="fam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d9b8"/><stop offset="1" stop-color="#c98e6a"/></linearGradient></defs><g fill="#7a4a3a"><circle cx="62" cy="80" r="15"/><circle cx="104" cy="74" r="17"/><circle cx="84" cy="104" r="11"/><path d="M40 168c0-40 44-52 44-52s46 10 46 52z"/></g>`]
];

// original "Sunset Drive" artwork (road-trip sunset, no third-party marks)
let SID=0;
function SUNSET(w,h,label=true){const k='sd'+(SID++),v=h/188,S=(x)=>x*v,Y=(y)=>y*v,wide=w/h>1.5;
 const palms=(wide?[[0.05,0.9],[0.14,1.05],[0.24,0.8],[0.76,0.85],[0.86,1.05],[0.95,0.9]]:[[0.08,0.9],[0.2,1],[0.78,1.05],[0.93,0.85]]).map(([px,sc])=>{const x=w*px,b=h*0.82,t=b-h*0.42*sc;return `<path d="M${x} ${b} C${x+S(3)} ${b-h*0.2*sc} ${x+S(6)} ${t+h*0.08} ${x+S(4)} ${t}" stroke="#3a1a52" stroke-width="${S(3.2)*sc}" fill="none"/>`+[[-1,0],[1,0],[-0.7,-0.6],[0.7,-0.6],[0,-0.9]].map(([dx,dy])=>`<path d="M${x+S(4)} ${t} q${S(14)*dx*sc} ${Y(-6+dy*6)*sc} ${S(26)*dx*sc} ${Y(8+dy*14)*sc}" stroke="#3a1a52" stroke-width="${S(4)*sc}" fill="none" stroke-linecap="round"/>`).join('')}).join('');
 const bld=(wide?[[0.30,0.30,0.16,'#ffc2d6'],[0.39,0.20,0.12,'#ffe1b3'],[0.47,0.24,0.12,'#bde8e0'],[0.55,0.34,0.15,'#d9c2ff'],[0.64,0.22,0.12,'#ffc2d6']]:[[0.28,0.30,0.16,'#ffc2d6'],[0.45,0.22,0.12,'#bde8e0'],[0.58,0.34,0.15,'#d9c2ff'],[0.36,0.18,0.08,'#ffe1b3']]).map(([x,hh,ww,c])=>{const W=wide?h*ww*1.1:w*ww,X=wide?w*x-W/2:w*x,H=h*hh,B=h*0.74;let win='';for(let i=0;i<3;i++)for(let j=0;j<Math.max(2,Math.round(H/Y(14)));j++)win+=`<rect x="${X+W*(0.15+i*0.27)}" y="${B-H+Y(8)+j*Y(12)}" width="${W*0.16}" height="${Y(6)}" fill="rgba(90,50,120,.35)"/>`;return `<rect x="${X}" y="${B-H}" width="${W}" height="${H}" fill="${c}"/><rect x="${X-S(2)}" y="${B-H-Y(4)}" width="${W+S(4)}" height="${Y(4)}" fill="${c}" opacity=".85"/>`+win}).join('');
 const cy=h*0.86,cx=w*0.5,cw=Math.min(w*0.46,h*0.95);
 const car=`<g fill="#24122f"><path d="M${cx-cw/2} ${cy} l${cw*0.04} ${-h*0.07} l${cw*0.26} ${-h*0.015} l${cw*0.12} ${-h*0.06} l${cw*0.3} 0 l${cw*0.12} ${h*0.06} l${cw*0.14} ${h*0.02} l${cw*0.02} ${h*0.065}z"/><circle cx="${cx-cw*0.3}" cy="${cy}" r="${h*0.045}"/><circle cx="${cx+cw*0.3}" cy="${cy}" r="${h*0.045}"/></g><path d="M${cx-cw*0.06} ${cy-h*0.135} l${cw*0.26} 0 l${cw*0.09} ${h*0.05} l${-cw*0.42} 0z" fill="#ff8fb8" opacity=".55"/>`;
 return `<defs><linearGradient id="${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b3aa0"/><stop offset=".45" stop-color="#e2578b"/><stop offset=".72" stop-color="#ffb36b"/><stop offset="1" stop-color="#ffd59a"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#${k})"/><circle cx="${w*0.5}" cy="${h*0.52}" r="${Math.min(w,h)*(wide?0.3:0.26)}" fill="#ffe08a"/>${[0,1,2,3].map(i=>`<rect x="0" y="${h*(0.5+i*0.045)}" width="${w}" height="${h*(0.012+i*0.004)}" fill="#f2759e"/>`).join('')}
${bld}<rect y="${h*0.74}" width="${w}" height="${h*0.26}" fill="#7a3f8f"/><rect y="${h*0.84}" width="${w}" height="${h*0.012}" fill="#ffd59a" opacity=".6"/>${palms}${car}
${label?`<text x="${w*0.5}" y="${h*0.24}" text-anchor="middle" font-family="Bebas Neue" font-size="${Math.min(w*0.19,h*0.2)}" fill="#fff" letter-spacing="${S(1.5)}" transform="skewX(-8)" style="paint-order:stroke" stroke="#c2286a" stroke-width="${S(2.2)}">SUNSET DRIVE</text>`:''}`}

const GAMING=[
 ['Sunset Drive',SUNSET(182,188)],
 ['Top 1',`<rect width="182" height="188" fill="#7fb6d9"/><rect y="140" width="182" height="48" fill="#6b8f4e"/><path d="M50 60a41 30 0 0 1 82 0z" fill="#e4572e"/><path d="M50 60l41 46M132 60l-41 46M91 30v76" stroke="#3a2a22" stroke-width="2"/><rect x="74" y="104" width="34" height="28" fill="#c4913a" stroke="#6a4a22" stroke-width="3"/>`+T(91,172,'TOP 1','Bebas Neue',34,'#fff','letter-spacing="3"')],
 ['Block World',`<rect width="182" height="188" fill="#8fd0ff"/>${Array.from({length:8},(_,i)=>`<rect x="${i*24-4}" y="120" width="24" height="12" fill="#5cb83a"/><rect x="${i*24-4}" y="132" width="24" height="56" fill="#8a5a32"/><rect x="${i*24+4}" y="146" width="8" height="8" fill="#6e4424"/>`).join('')}<rect x="120" y="70" width="14" height="50" fill="#6e4424"/><rect x="104" y="44" width="46" height="34" fill="#3f9a2e"/>`+T(91,44,'BLOCK WORLD','Press Start 2P',11,'#1a3a5c')],
 ['Mon avatar',`<rect width="182" height="188" fill="#ffd1e8"/><rect x="66" y="40" width="50" height="46" rx="4" fill="#f2c79a"/><rect x="74" y="56" width="8" height="8" fill="#2a2a2a"/><rect x="100" y="56" width="8" height="8" fill="#2a2a2a"/><rect x="80" y="72" width="22" height="4" fill="#2a2a2a"/><rect x="62" y="88" width="58" height="56" rx="4" fill="#e04f8a"/><rect x="40" y="90" width="20" height="46" rx="3" fill="#f2c79a"/><rect x="122" y="90" width="20" height="46" rx="3" fill="#f2c79a"/>`+T(91,172,'MON AVATAR','Bebas Neue',28,'#8a1a5a','letter-spacing="2"')],
 ['Gamer mode',`<rect width="182" height="188" fill="#141420"/><path d="M48 80h86c18 0 26 40 14 46-10 5-18-8-24-14H58c-6 6-14 19-24 14-12-6-4-46 14-46z" fill="none" stroke="#39ff8e" stroke-width="4"/><path d="M62 94v16M54 102h16" stroke="#39ff8e" stroke-width="4"/><circle cx="118" cy="96" r="4" fill="#39ff8e"/><circle cx="128" cy="106" r="4" fill="#39ff8e"/>`+T(91,48,'GAMER MODE','Bebas Neue',30,'#39ff8e','letter-spacing="2"')+T(91,160,'ON','Press Start 2P',18,'#39ff8e')],
 ['Level up',`<rect width="182" height="188" fill="#1b1b3a"/>`+T(91,76,'LEVEL','Press Start 2P',16,'#ffd36b')+T(91,120,'30','Press Start 2P',36,'#ffd36b')+`<rect x="36" y="138" width="110" height="14" fill="none" stroke="#fff" stroke-width="2"/><rect x="39" y="141" width="88" height="8" fill="#39d0ff"/>`+T(91,174,'UNLOCKED','Press Start 2P',9,'#fff')],
 ['GG',`<rect width="182" height="188" fill="#ffcf3a"/>`+T(91,128,'GG','Bebas Neue',110,'#1a1a1a','letter-spacing="4"')+T(91,162,'GOOD GAME','Montserrat',13,'#1a1a1a','font-weight="800" letter-spacing="4"')],
 ['Pause café',`<rect width="182" height="188" fill="#2b2b2b"/><rect x="60" y="52" width="20" height="64" rx="3" fill="#fff"/><rect x="102" y="52" width="20" height="64" rx="3" fill="#fff"/>`+T(91,150,'PAUSE CAFÉ','Bebas Neue',34,'#ffd36b','letter-spacing="2"')],
 ['Respawn',`<rect width="182" height="188" fill="#0f2a3a"/>`+T(91,74,'RESPAWN','Press Start 2P',14,'#ff5a5a')+T(91,104,'IN 3...2...1','Press Start 2P',8,'#fff')+`<rect x="70" y="118" width="38" height="36" fill="#fff"/><rect x="108" y="126" width="10" height="16" fill="none" stroke="#fff" stroke-width="5"/><rect x="74" y="122" width="30" height="8" fill="#6b3a1f"/>`]
];
const HUMOUR=[
 ['Pas de café…',T(91,70,'Pas de café,','Cormorant Garamond',26,'#2a1a1a','font-weight="600"')+T(91,104,'pas de','Cormorant Garamond',26,'#2a1a1a','font-weight="600"')+T(91,146,'bonjour','Dancing Script',44,'#8a1a36','font-weight="700"')],
 ['Mode avion',`<path d="M91 40l8 28 34 14v8l-34-8v22l10 8v6l-18-5-18 5v-6l10-8V82l-34 8v-8l34-14z" fill="#1f3b5c"/>`+T(91,158,'MODE AVION','Bebas Neue',36,'#1f3b5c','letter-spacing="2"')],
 ['Lundi ?',T(91,92,'Lundi ?','Dancing Script',50,'#8a1a36','font-weight="700"')+T(91,136,'NON MERCI.','Montserrat',17,'#2a1a1a','font-weight="800" letter-spacing="3"')],
 ['J’peux pas',T(91,72,'Je peux pas,','Cormorant Garamond',26,'#2a1a1a','font-weight="600"')+T(91,128,'j’ai café','Dancing Script',44,'#6b3a1f','font-weight="700"')],
 ['Boss',`<path d="M62 70l10-26 19 18 19-18 10 26z" fill="#d6a640"/>`+T(91,124,'BOSS','Bebas Neue',58,'#2a1a1a','letter-spacing="4"')+T(91,154,'DE LA FAMILLE','Montserrat',12,'#2a1a1a','font-weight="800" letter-spacing="3"')],
 ['Parisien',`<path d="M91 30l7 46h10l-5 6 10 54H79l10-54-5-6h10z" fill="none" stroke="#1f3b5c" stroke-width="3"/>`+T(91,160,'100 % PARISIEN','Montserrat',13,'#1f3b5c','font-weight="800" letter-spacing="2"')],
 ['Ne pas déranger',T(91,70,'NE PAS','Bebas Neue',40,'#b8323f','letter-spacing="3"')+T(91,108,'DÉRANGER','Bebas Neue',40,'#b8323f','letter-spacing="3"')+T(91,140,'je bois mon café','Cormorant Garamond',20,'#2a1a1a','font-style="italic"')],
 ['Café d’abord',T(91,80,'Café d’abord,','Dancing Script',38,'#6b3a1f','font-weight="700"')+T(91,124,'questions','Cormorant Garamond',24,'#2a1a1a','font-weight="600"')+T(91,150,'après','Cormorant Garamond',24,'#2a1a1a','font-weight="600"')],
 ['Fragile',T(91,82,'FRAGILE','Bebas Neue',52,'#b8323f','letter-spacing="4"')+`<rect x="34" y="40" width="114" height="54" fill="none" stroke="#b8323f" stroke-width="3"/>`+T(91,134,'avant le café','Cormorant Garamond',22,'#2a1a1a','font-style="italic"')]
];
const catalogue=(items,o)=>page(`<div style="position:absolute;top:680px;left:80px;right:80px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px 6px">
${items.map(([n,d])=>`<div style="text-align:center">${mug(d,208)}<div style="font:italic 600 26px 'Cormorant Garamond',serif;color:#f4e6d3;margin-top:-6px">${n}</div></div>`).join('')}</div>`,o);
const heroSunset=page(`<div style="position:absolute;top:690px;left:100px;right:100px;height:300px;border-radius:22px;overflow:hidden;border:2.5px solid #e2bb6c;box-shadow:0 18px 40px rgba(0,0,0,.45)"><svg viewBox="0 0 880 300" width="880" height="300">${SUNSET(880,300)}</svg></div>
<div style="position:absolute;top:1015px;left:0;right:0;display:flex;justify-content:center">${mug(SUNSET(182,188),500)}</div>`,{title:'Tasse Sunset Drive',sub:'L’esprit road trip au coucher du soleil',f1:'VOTRE PSEUDO OU VOTRE PHOTO  ✦  FAIT MAIN À PARIS'});
module.exports={mug,SUNSET,PROCHES,GAMING,HUMOUR,BG,DEFS,dots,STAR,FONTS};
if(require.main===module)(async()=>{require('fs').mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
 const shot=async(html,f,vp)=>{if(vp)await p.setViewportSize(vp);await p.setContent(html,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:OUT+f})};
 await shot(avatar,'avatar_MV.png',{width:1080,height:1080});
 await p.setViewportSize({width:1080,height:1920});
 await shot(commander,'commander.png');await shot(tarifs,'tarifs.png');
 await shot(catalogue(PROCHES,{title:'Tasses pour vos proches',sub:'Un mot doux pour chaque jour',f1:'VOTRE TEXTE OU VOTRE PHOTO  ✦  FAIT MAIN À PARIS'}),'tasses_proches.png');
 await shot(catalogue(GAMING,{title:'Tasses gaming',sub:'Pour les joueurs de la famille',f1:'VOTRE PSEUDO OU VOTRE PHOTO  ✦  FAIT MAIN À PARIS'}),'tasses_gaming.png');
 await shot(catalogue(HUMOUR,{title:'Tasses avec humour',sub:'Le café, mais avec le sourire',f1:'VOTRE PHRASE OU VOTRE PHOTO  ✦  FAIT MAIN À PARIS'}),'tasses_humour.png');
 await shot(heroSunset,'tasse_sunset_drive.png');
 await b.close()})();
