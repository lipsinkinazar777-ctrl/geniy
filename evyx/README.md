# EVYX

Статичный сайт без сборки и без внешних зависимостей: three.js, GSAP, Lenis и шрифты лежат
в `vendor/` и `fonts/`. Выложить папку можно на любой хостинг (Cloudflare Pages, Netlify,
Vercel, GitHub Pages), домен привязывается там же.

Локальный запуск (из-за ES-модулей нужен сервер, а не двойной клик):

    python3 -m http.server 8000   # затем http://localhost:8000

## Что где менять — `js/config.js`
- `contact` — Telegram, почта, Instagram
- `pay.methods` — оплата. Метод с `PASTE_...` на сайте скрыт; если не подключён ни один,
  страница оплаты предлагает запросить реквизиты в Telegram
- `videos` — свой ролик: mp4 9:16 в `assets/videos/`, путь в `src`. Пока `src` пуст, карточка
  показывает живую анимированную заставку (`fx`)
- `tutorials` — шаги «How to make this video free»
- `courseIncludes`, `faq`, `prices`

## Структура
- `index.html` — главная: 3D-сцена, закреплённые секции, горизонтальная галерея, цена, FAQ
- `work.html`, `services.html`, `academy.html`, `pay.html`
- `js/scene.js` — 3D-объект, кольца, частицы, свечение; состояния сцены по секциям
- `js/fx.js` — плавный скролл, курсор, загрузчик, анимации текста
