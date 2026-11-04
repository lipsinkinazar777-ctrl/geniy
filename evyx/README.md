# EVYX

AI video studio and academy. React + React Router, built with Vite.

## Pages
| Path | Page |
| --- | --- |
| `/` | Hero with the android, opening sequence, videos that fly out on scroll, quick stats, video types, how it works, top showcases |
| `/work` | Filterable gallery (`/work?type=VFX`), video player modal with case-study tabs, case studies |
| `/services` | Pricing tiers, EU business solutions (tabs), cartoons / ad videos / promo clips and more, FAQ |
| `/academy` | Free courses with enrolment and lesson progress, the $100 program with curriculum and lesson previews |
| `/checkout` | Cart → details → USDT payment (TRC20 / ERC20 / Solana, QR) → receipt |

The navbar is on every page, highlights the active route and shows the cart counter. The cart, Academy progress and receipts are kept in the browser (`localStorage`).

## Run

    npm install
    npm run dev        # http://localhost:5173
    npm run build      # production build in dist/

Host `dist/` on Netlify, Vercel or Cloudflare Pages. `public/_redirects` (Netlify) and `vercel.json` send every path to `index.html`, so `/work` and the other routes open directly.
On a host that cannot do that, build with `npm run build:hash`: routes then live after `#` (`/#/work`).

## Edit
- `src/data/site.js`: contacts, prices, **wallet addresses** (empty = preview mode, nothing can be paid), nav, quick stats
- `src/data/videos.js`: showcase videos. Set `src` to an mp4 URL to play a real video; `poster` is the still
- `src/data/services.js`: tiers, video types, EU solutions, FAQ
- `src/data/academy.js`: free courses, the program, its modules and lessons

## Structure
    src/components   Navbar, Footer, VideoCard, VideoModal, Modal, PricingTable, Hero, KindsGrid, HowItWorks, Accordion, QRCode, PageHead, CtaBand, RouteEffects
    src/pages        Home, Work, Services, Academy, Checkout, NotFound
    src/data         all content and settings
    src/context      CartContext, ToastContext
    src/lib          motion (GSAP + Lenis), intro sequence, QR, clipboard, storage
    src/assets       images and fonts
