/* ===== ОБЩИЕ ХЕЛПЕРЫ ===== */
const collRecipes=c=>c.ids?c.ids.map(byId).filter(Boolean):RECIPES.filter(c.f);
const dots=(n,cls='')=>`<span class="dots ${cls}">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span>`;
const skillCount=()=>Object.keys(S.skills).filter(k=>S.skills[k]).length;
const learnedCount=()=>Object.keys(S.learned).filter(k=>S.learned[k]&&byId(k)).length;
const SKILL_TOTAL=PATH.reduce((a,l)=>a+l.s.length,0);
