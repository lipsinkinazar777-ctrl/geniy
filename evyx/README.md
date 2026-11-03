# EVYX

Статичный сайт без сборки. Открыть `index.html` или выложить папку на любой хостинг
(GitHub Pages, Netlify, Cloudflare Pages, Vercel) — домен привязывается там же.

Всё редактируется в `js/config.js`:
- `contact` — Telegram, почта, Instagram
- `pay.methods` — карта (ссылка Stripe/Lemon Squeezy) и крипто-кошельки. Пока в поле стоит `PASTE_...`, метод на сайте скрыт
- `videos` — вертикальные mp4 кладутся в `assets/videos/`, путь пишется в `src`
- `tutorials` — шаги «How to make this video free»
- `courseIncludes` — что входит в продукт за $100
