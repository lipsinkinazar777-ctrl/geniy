// Highlight covers for the 3 key highlights, inverted (gold background, burgundy icon) so they stand out
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const src=require('fs').readFileSync(__dirname+'/generate_stories.js','utf8');
const ICONS=eval('('+src.slice(src.indexOf('const ICONS=')+12,src.indexOf('};',src.indexOf('const ICONS='))+1)+')');
const page=k=>`<!doctype html><html><body style="margin:0;width:1080px;height:1920px;overflow:hidden;position:relative;background:radial-gradient(70% 48% at 50% 45%,#fbe7b0 0%,#e2bb6c 45%,#a9782e 100%)">
<div style="position:absolute;inset:-400px;background:repeating-linear-gradient(115deg,transparent 0 230px,rgba(255,255,255,.10) 230px 310px)"></div>
<svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0">
<defs><radialGradient id="d" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#9a1f33"/><stop offset="1" stop-color="#4c0915"/></radialGradient></defs>
<circle cx="540" cy="960" r="400" fill="rgba(255,248,230,.35)"/>
<circle cx="540" cy="960" r="380" fill="none" stroke="#6e1424" stroke-width="6"/><circle cx="540" cy="960" r="352" fill="none" stroke="#6e1424" stroke-width="2" opacity=".6"/>
<g transform="translate(340 760) scale(4)" fill="none" stroke="url(#d)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[k].replace(/fill="currentColor"/g,'fill="#6e1424"')}</g>
${[[830,640,40],[250,1300,30]].map(([x,y,r])=>`<g transform="translate(${x} ${y})"><path d="M0 ${-r} Q0 0 ${r*.16} 0 Q0 0 0 ${r} Q0 0 ${-r*.16} 0 Q0 0 0 ${-r}Z M${-r*.75} 0 Q0 0 0 ${-r*.12} Q0 0 ${r*.75} 0 Q0 0 0 ${r*.12} Q0 0 ${-r*.75} 0Z" fill="#fff8e6"/></g>`).join('')}
</svg></body></html>`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
 for(const k of ['commander','tarifs','avis']){await p.setContent(page(k));await p.screenshot({path:`/home/user/geniy/instagram/covers/or-${k}.png`})}
 await b.close()})();
