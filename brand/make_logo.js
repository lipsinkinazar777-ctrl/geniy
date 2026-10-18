// Maison Volodymyr round logo: glossy thin gold ring, dark bevel band, ruby disc, metallic ivory M + V
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const OUT=process.argv[2]||'logo_MV_2000.png';
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
<defs>
 <linearGradient id="gold" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="#fff6cc"/><stop offset=".18" stop-color="#f2c862"/><stop offset=".42" stop-color="#a9721c"/><stop offset=".62" stop-color="#e9bd55"/><stop offset=".8" stop-color="#fbe39a"/><stop offset="1" stop-color="#8a5812"/></linearGradient>
 <radialGradient id="band" cx=".5" cy=".5" r=".5"><stop offset=".86" stop-color="#2a030a"/><stop offset=".93" stop-color="#4a0815"/><stop offset="1" stop-color="#22020a"/></radialGradient>
 <radialGradient id="disc" cx=".4" cy=".33" r=".78"><stop offset="0" stop-color="#b02a3e"/><stop offset=".35" stop-color="#8c1a2c"/><stop offset=".75" stop-color="#6e1020"/><stop offset="1" stop-color="#4c0915"/></radialGradient>
 <linearGradient id="metal" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#f4ecdf"/><stop offset=".55" stop-color="#cbbca5"/><stop offset=".7" stop-color="#f7f0e4"/><stop offset="1" stop-color="#b9a68a"/></linearGradient>
 <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="2" dy="8" stdDeviation="8" flood-color="#1f0006" flood-opacity=".6"/></filter>
 <filter id="glow"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<circle cx="500" cy="500" r="492" fill="url(#gold)"/>
<circle cx="500" cy="500" r="468" fill="url(#band)"/>
<circle cx="500" cy="500" r="424" fill="none" stroke="url(#gold)" stroke-width="10"/>
<circle cx="500" cy="500" r="419" fill="url(#disc)"/>
<g filter="url(#sh)" font-family="Playfair Display" font-weight="600" fill="url(#metal)" stroke="#6b4a32" stroke-width="1.2" paint-order="stroke">
 <text x="232" y="600" font-size="370">M</text>
 <text x="488" y="722" font-size="390">V</text>
</g></svg>`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:1000},deviceScaleFactor:2});
 await p.setContent(`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&display=swap" rel="stylesheet"></head><body style="margin:0;background:transparent">${svg}</body></html>`,{waitUntil:'networkidle'});
 await p.evaluate(()=>document.fonts.ready);
 await p.screenshot({path:__dirname+'/'+OUT,omitBackground:true,clip:{x:0,y:0,width:1000,height:1000}});
 require('fs').writeFileSync(__dirname+'/logo_MV.svg',svg);
 await b.close()})();
