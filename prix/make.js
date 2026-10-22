const {chromium}=require('/opt/node-tools/node_modules/playwright');
const S=[
['ФОТО НА МЕТАЛЛЕ',['5,5 × 8,5 см','5,5 × 8,5 см — магнит','10 × 10 см (квадрат)','Круг Ø 100 мм','Круг Ø 100 мм — магнит','10 × 15 см','10 × 15 см — в рамке','10 × 15 см — магнит','10 × 15 см — на деревянной подложке','15 × 20 см','15 × 20 см — в рамке','15 × 20 см — магнит','20 × 30 см','20 × 30 см — в рамке','20 × 30 см — магнит','20 × 30 см — на деревянной подложке','30 × 40 см','30 × 40 см — в рамке','30 × 40 см — на деревянной подложке','A4 (21 × 29,7 см)','A3 (29,7 × 42 см)']],
['БРЕЛОКИ С ФОТО (металл)',['Сердце','Круг','Прямоугольник','Длинный прямоугольник (планка)','Круг вращающийся (спиннер)','Овал вращающийся','Медальон двойной (открывается)','Сердце с крыльями «Forever in my heart»','«I ♥ MAMA»','«I ♥ PAPA»','Лапка','Подсолнух','Маленькое сердце с карабином','Маленький круг с карабином','Жетон (dog tag) на цепочке','Кулон золотой со стразами на цепочке','Брелок со стразами «Slava Ukraini»']],
['БРЕЛОКИ (кожа / дерево / пластик)',['Кожаный круглый','Кожаный квадратный чёрный','Кожаный квадратный с клапаном','Кожаная бирка для багажа (красная)','Большой овал (дерево / МДФ)','Пластиковый круглый','Пластиковый квадратный']],
['ФЛАГИ',['Брелок-флаг круглый (в пакете)','Брелок-флаг прямоугольный металлический','Брелок-флаг цветной (деревянный / фигурный)','Табличка-флаг прямоугольная (магнит)','Табличка-герб (Украина, Молдова, Румыния, Польша, Франция…)','Круглая эмблема-флаг на телефон','Большой круглый флаг / герб (Ø ~20 см)','Мини-флажки (коробка)','Чехол для телефона с флагом']],
['ТАБЛИЧКИ И ЗНАКИ',['Маленькая табличка (юмор / запрет)','Средняя табличка','Большая табличка (Warning, Alarme 24H…)','Entrée / Sortie / Privé (с котом)','Cuisine / Salle de bain / Toilette','Pas de publicité','Interdiction de fumer','Attention au chien / Wi-Fi','Area 51 (жёлтая)','Знак оплаты CB / Visa','Знаки Sortie de secours / огнетушитель','Табличка «F» (Франция) овал','Табличка «18+»','Большая монета евро']],
['ДЛЯ ЖИВОТНЫХ',['Бейдж-адресник (круг / сердце / косточка)','Брелок с фото питомца']],
['ДРУГОЕ',['Значки круглые (pins)','Мини-фото / открытка 5,5 × 8,5','Металлические номерки с кольцом','Кружка с фото','Кружка-хамелеон (Tasse magique)']]];
const html=`<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&display=swap" rel="stylesheet"><style>
@page{size:A4;margin:12mm}body{font:500 11.5px Montserrat,sans-serif;color:#1a1a1a}
h1{font-size:18px;margin:0 0 4px;color:#6e1424}p{margin:0 0 10px;color:#555}
h2{font-size:12px;letter-spacing:.12em;color:#fff;background:#6e1424;padding:5px 8px;margin:12px 0 0;break-after:avoid}
table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #ccc;padding:6px 8px;height:16px}
td.p{width:28%;border-left:1px solid #ccc;text-align:right;color:#999}tr{break-inside:avoid}
</style></head><body><h1>Maison Volodymyr — ассортимент и цены</h1><p>Папа, впиши цену справа. Если вариант не продаём — зачеркни.</p>
${S.map(([t,r])=>`<h2>${t}</h2><table>${r.map(x=>`<tr><td>${x}</td><td class="p">€</td></tr>`).join('')}</table>`).join('')}
<h2>ДОПИСАТЬ</h2><table>${'<tr><td>&nbsp;</td><td class="p">€</td></tr>'.repeat(6)}</table></body></html>`;
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.setContent(html,{waitUntil:'networkidle'});await p.pdf({path:__dirname+'/Assortiment_prix.pdf',format:'A4',printBackground:true});await b.close()})();
