/* ============================================================ core: helpers, state, persistence */
const A = window.A = {};
A.$ = (s, r = document) => r.querySelector(s);
A.$$ = (s, r = document) => [...r.querySelectorAll(s)];
A.h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
A.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
A.uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
A.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
A.lerp = (a, b, t) => a + (b - a) * t;
A.ease = { out: t => 1 - Math.pow(1 - t, 3), inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, smooth: t => t * t * (3 - 2 * t) };
A.hash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); };
A.rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
A.dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
A.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
A.fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
A.plural = (n, one, few, many) => { const m = Math.abs(n) % 100, d = m % 10; return m > 10 && m < 20 ? many : d > 1 && d < 5 ? few : d === 1 ? one : many; };
A.vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

/* ---------------------------------------------------------------- state */
const KEY = 'aisel-corner-v1';
const DEFAULT = () => ({
  v: 1, books: [], quotes: [], log: {}, acorns: 0, earned: 0, claimedDays: {}, claimedWeeks: {}, bonusDone: {},
  goal: { day: 20, week: 120 }, samples: true, locSeen: 0, bonusPoints: 12, welcomed: false,
  settings: { sound: true, music: true, vol: .8, portrait: null }, introSeen: false, fireTip: false
});
A.state = DEFAULT();
A.storageOk = true;
A.load = () => {
  try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw); A.state = Object.assign(DEFAULT(), s, { settings: Object.assign(DEFAULT().settings, s.settings || {}), goal: Object.assign(DEFAULT().goal, s.goal || {}) }); return true; } } catch (e) { A.storageOk = false; }
  return false;
};
let saveT;
A.save = (now) => {
  clearTimeout(saveT);
  const go = () => { try { localStorage.setItem(KEY, JSON.stringify(A.state)); A.storageOk = true; } catch (e) { A.storageOk = false; if (A.toast) A.toast('Память телефона заполнена: сохрани копию в настройках'); } };
  if (now) go(); else saveT = setTimeout(go, 250);
};
addEventListener('pagehide', () => A.save(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) A.save(true); });

/* ---------------------------------------------------------------- derived numbers */
A.pagesOn = (key) => A.state.log[key] || 0;
A.pagesToday = () => A.pagesOn(A.dayKey());
A.pagesTotal = () => Object.values(A.state.log).reduce((s, v) => s + v, 0);
A.weekKeys = () => { const d = new Date(), wd = (d.getDay() + 6) % 7, out = []; for (let i = 0; i <= 6; i++) { const x = new Date(d); x.setDate(d.getDate() - wd + i); out.push(A.dayKey(x)); } return out; };
A.pagesWeek = () => A.weekKeys().reduce((s, k) => s + A.pagesOn(k), 0);
A.weekId = () => A.weekKeys()[0];
A.streak = () => { let n = 0; const d = new Date(); if (!A.pagesOn(A.dayKey(d))) d.setDate(d.getDate() - 1); while (A.pagesOn(A.dayKey(d)) > 0) { n++; d.setDate(d.getDate() - 1); } return n; };
A.doneBooks = () => A.state.books.filter(b => b.status === 'done');
A.points = () => A.doneBooks().length * 60 + Math.floor(A.pagesTotal() / 5) + (A.state.bonusPoints || 0);
A.bookById = id => A.state.books.find(b => b.id === id);

/* ---------------------------------------------------------------- acorns & stickers */
A.STICKERS = [
  { e: '🍄', n: 'Грибок', at: 0 }, { e: '🌿', n: 'Веточка', at: 0 }, { e: '🌙', n: 'Месяц', at: 0 }, { e: '✨', n: 'Искры', at: 0 },
  { e: '🕯️', n: 'Свеча', at: 8 }, { e: '🦋', n: 'Бабочка', at: 16 }, { e: '🍂', n: 'Лист', at: 26 }, { e: '☕', n: 'Чашка', at: 38 },
  { e: '🗝️', n: 'Ключик', at: 52 }, { e: '🪶', n: 'Перо', at: 68 }, { e: '🦊', n: 'Лисёнок', at: 86 }, { e: '🌹', n: 'Роза', at: 106 },
  { e: '🦉', n: 'Сова', at: 130 }, { e: '🏰', n: 'Замок', at: 160 }, { e: '🧚', n: 'Фея', at: 200 }, { e: '👑', n: 'Корона', at: 250 }
];
A.stickersOpen = () => A.STICKERS.filter(s => A.state.earned >= s.at);
A.addAcorns = (n, why) => {
  const before = A.stickersOpen().length;
  A.state.acorns += n; A.state.earned += n; A.save();
  A.refreshHud && A.refreshHud(true);
  const after = A.stickersOpen();
  if (after.length > before && A.onSticker) A.onSticker(after[after.length - 1]);
};

/* ---------------------------------------------------------------- covers */
A.coverHue = b => (b.cover && b.cover.hue != null) ? b.cover.hue : (A.hash(b.title + b.author) % 360);
A.coverHTML = (b, cls = '') => {
  if (b.cover && b.cover.img) return `<div class="cover cover--img ${cls}"><img src="${b.cover.img}" alt=""></div>`;
  const h = A.coverHue(b), g = A.hash(b.title) % 4;
  const orn = ['<path d="M20 4l2.500 6 6.500.5-5 4.300 1.600 6.400L20 17.700 14.400 21.200 16 14.800l-5-4.300 6.500-.5z"/>', '<path d="M20 3c-6 2-9 7-9 12s4 9 9 9 9-4 9-9-3-10-9-12zm0 5v12M20 12l-4 3M20 15l4 3"/>', '<path d="M27 6a10 10 0 1 0 6 12 8 8 0 0 1-6-12z"/>', '<path d="M6 22c4-6 9-8 14-8s10 2 14 8M14 22c1.500-3 3.500-4.500 6-4.500S24.500 19 26 22"/>'][g];
  return `<div class="cover ${cls}" style="--h:${h}"><svg class="cover__orn" viewBox="0 0 40 28">${orn}</svg><b class="cover__t">${A.esc(b.title)}</b><i class="cover__a">${A.esc(b.author || '')}</i></div>`;
};

/* ---------------------------------------------------------------- moods used by the potion room and the sky */
A.MOODS = { cozy: 'уют', fantasy: 'фэнтези', detective: 'детектив', romance: 'романтика', funny: 'смешное', deep: 'глубокое', adventure: 'приключения', melancholy: 'грусть', classic: 'классика', tale: 'сказка', mist: 'туман' };

A.SUGGEST = [
  { t: 'Маленький принц', a: 'Антуан де Сент-Экзюпери', p: 96, m: ['tale', 'deep', 'cozy', 'classic'] },
  { t: 'Алиса в Стране чудес', a: 'Льюис Кэрролл', p: 192, m: ['tale', 'funny', 'fantasy', 'classic'] },
  { t: 'Хоббит, или Туда и обратно', a: 'Дж. Р. Р. Толкин', p: 352, m: ['fantasy', 'adventure', 'cozy'] },
  { t: 'Гарри Поттер и философский камень', a: 'Дж. К. Роулинг', p: 432, m: ['fantasy', 'cozy', 'adventure'] },
  { t: 'Убийство в «Восточном экспрессе»', a: 'Агата Кристи', p: 288, m: ['detective', 'mist', 'classic'] },
  { t: 'Собака Баскервилей', a: 'Артур Конан Дойл', p: 256, m: ['detective', 'mist', 'classic'] },
  { t: 'Гордость и предубеждение', a: 'Джейн Остин', p: 416, m: ['romance', 'cozy', 'classic'] },
  { t: 'Джейн Эйр', a: 'Шарлотта Бронте', p: 576, m: ['romance', 'melancholy', 'mist', 'classic'] },
  { t: 'Мастер и Маргарита', a: 'Михаил Булгаков', p: 480, m: ['fantasy', 'deep', 'romance', 'classic'] },
  { t: 'Тень ветра', a: 'Карлос Руис Сафон', p: 480, m: ['mist', 'romance', 'detective'] },
  { t: 'Ветер в ивах', a: 'Кеннет Грэм', p: 256, m: ['cozy', 'tale', 'adventure'] },
  { t: 'Звёздная пыль', a: 'Нил Гейман', p: 288, m: ['fantasy', 'romance', 'adventure'] },
  { t: 'Бесконечная история', a: 'Михаэль Энде', p: 448, m: ['fantasy', 'adventure', 'deep', 'tale'] },
  { t: 'Аня из Зелёных Мезонинов', a: 'Люси Мод Монтгомери', p: 352, m: ['cozy', 'funny', 'classic'] },
  { t: 'Три товарища', a: 'Эрих Мария Ремарк', p: 480, m: ['melancholy', 'romance', 'deep'] },
  { t: 'Вино из одуванчиков', a: 'Рэй Брэдбери', p: 288, m: ['cozy', 'melancholy', 'deep'] },
  { t: 'Сто лет одиночества', a: 'Габриэль Гарсиа Маркес', p: 448, m: ['deep', 'fantasy', 'melancholy'] },
  { t: 'Дом, в котором…', a: 'Мариам Петросян', p: 960, m: ['deep', 'fantasy', 'mist'] },
  { t: 'Волшебник Земноморья', a: 'Урсула Ле Гуин', p: 224, m: ['fantasy', 'adventure', 'deep'] },
  { t: 'Этюд в багровых тонах', a: 'Артур Конан Дойл', p: 192, m: ['detective', 'classic'] },
  { t: '451 градус по Фаренгейту', a: 'Рэй Брэдбери', p: 224, m: ['deep', 'melancholy', 'adventure'] },
  { t: 'Над пропастью во ржи', a: 'Джером Д. Сэлинджер', p: 288, m: ['melancholy', 'deep'] },
  { t: 'Двенадцать стульев', a: 'Илья Ильф, Евгений Петров', p: 384, m: ['funny', 'classic', 'adventure'] },
  { t: 'Таинственный сад', a: 'Фрэнсис Ходжсон Бёрнетт', p: 320, m: ['cozy', 'mist', 'classic', 'tale'] }
];

const STORY = `/*STORY*/`;
A.seed = () => {
  const mk = (title, author, pages, status, read, tags, extra = {}) => Object.assign({ id: A.uid(), title, author, pages, read, status, rating: 0, tags, impression: '', added: Date.now(), cover: {}, sample: true }, extra);
  A.state.books = [
    mk('Маленький принц', 'Антуан де Сент-Экзюпери', 96, 'reading', 40, ['tale', 'deep', 'classic']),
    mk('Фонарь на опушке', 'Для Айсель', 3, 'reading', 0, ['tale', 'cozy', 'mist'], { hasText: true }),
    mk('Алиса в Стране чудес', 'Льюис Кэрролл', 192, 'want', 0, ['tale', 'funny', 'fantasy']),
    mk('Гордость и предубеждение', 'Джейн Остин', 416, 'want', 0, ['romance', 'cozy', 'classic'])
  ];
  A.txt.put(A.state.books[1].id, STORY);
  const lp = A.state.books[0];
  A.state.quotes = [{ id: A.uid(), bookId: lp.id, bookTitle: lp.title, author: lp.author, text: 'Зорко одно лишь сердце. Самого главного глазами не увидишь.', page: '', tags: ['самое главное', 'сердце'], sticker: '🌙', paper: 'parch', photo: null, date: Date.now(), sample: true }];
};
