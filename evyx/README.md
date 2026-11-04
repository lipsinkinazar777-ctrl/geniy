# EVYX

Static site, no build step, no external dependencies (GSAP, Lenis, QR generator and fonts are in
`vendor/` and `fonts/`). One page with real tabs: `#home`, `#work`, `#services`, `#academy`, `#checkout`.

Run locally (a tiny server is needed so images and fetch work):

    python3 -m http.server 8000   # then open http://localhost:8000

Host the folder anywhere static: Cloudflare Pages, Netlify, Vercel, GitHub Pages. Attach your domain there.

## What to edit: `js/config.js`
- `contact`: Telegram, email, Instagram
- `pay.networks`: the wallet addresses (USDT on TRC20, ERC20, Solana). Replace every `PASTE_...`.
  Until then checkout runs in a clearly marked preview mode with a fake, invalid address.
  For two owners use a shared wallet: a multisig (Safe for TRC20/ERC20, Squads for Solana) or one exchange account.
- `videos`: put a vertical mp4 in `assets/videos/` and set `src` (hover to play). `img` is the poster.
- `stages`, `tutorials`, `program`, `faq`, `prices`: all copy

## Images
The robot and the card images are real path-traced renders made with the scripts in `tools/`
(see `tools/README.md`). The card images are sample stills; replace them with your own videos.

## Files
- `index.html`: all tabs
- `css/style.css`: design system
- `js/app.js`: router, home story, modals, checkout
- `js/robot.js`: the head-turn sequence that follows the cursor
- `assets/robot/`: 15 transparent frames, `robot.json`
