/* ============================================================
   EVYX — файл настроек. Контакты, кошельки, видео, тексты.
   ============================================================ */
window.EVYX = {
  contact: { telegram: "evyx_studio", email: "hello@evyx.studio", instagram: "evyx.studio" },

  prices: { tiers: [15, 18, 20], course: 100 },

  /* КОШЕЛЬКИ (общий кошелёк на двоих). Адрес с PASTE_ на сайте НЕ показывается:
     вместо него клиент видит кнопку «запросить реквизиты в Telegram».
     Рекомендация: общий кошелёк с мультиподписью (Safe для EVM, Squads для Solana)
     или общий аккаунт биржи, где у обоих есть доступ. */
  pay: {
    networks: [
      { id: "trc20", token: "USDT", chain: "TRC20",  address: "PASTE_USDT_TRC20_ADDRESS",
        hint: "Tron network. Lowest fee, most popular." },
      { id: "erc20", token: "USDT", chain: "ERC20",  address: "PASTE_USDT_ERC20_ADDRESS",
        hint: "Ethereum network. Higher fee." },
      { id: "sol",   token: "USDT", chain: "Solana", address: "PASTE_USDT_SOLANA_ADDRESS",
        hint: "Solana network. Fast and cheap." }
    ]
  },

  /* Видео. Свой ролик: mp4 9:16 в assets/videos/, путь в src.
     Пока src пуст, карточка показывает живую заставку (fx). */
  videos: [
    { id: "super-shirt",   title: "Super shirt",       cat: "Fashion",          len: "0:08", fx: "grid",   src: "" },
    { id: "speed-sneaker", title: "Speed sneakers",    cat: "Fashion",          len: "0:07", fx: "streak", src: "" },
    { id: "runway",        title: "Runway walk",       cat: "Fashion",          len: "0:09", fx: "wave",   src: "" },
    { id: "laser-glasses", title: "Laser glasses",     cat: "VFX",              len: "0:06", fx: "ring",   src: "" },
    { id: "city-glass",    title: "City of glass",     cat: "VFX",              len: "0:10", fx: "grid",   src: "" },
    { id: "portal",        title: "Portal opening",    cat: "VFX",              len: "0:08", fx: "ring",   src: "" },
    { id: "luxury-watch",  title: "Luxury watch",      cat: "Product Showcase", len: "0:07", fx: "orb",    src: "" },
    { id: "perfume",       title: "Perfume in mist",   cat: "Product Showcase", len: "0:06", fx: "mist",   src: "" },
    { id: "ring-orbit",    title: "Ring orbit macro",  cat: "Product Showcase", len: "0:06", fx: "ring",   src: "" },
    { id: "catalog-loop",  title: "Catalog loop",      cat: "E-commerce",       len: "0:09", fx: "wave",   src: "" },
    { id: "drop-reveal",   title: "Drop reveal",       cat: "E-commerce",       len: "0:08", fx: "orb",    src: "" },
    { id: "ugc-unbox",     title: "UGC unboxing",      cat: "UGC AI",           len: "0:10", fx: "rain",   src: "" },
    { id: "ugc-review",    title: "UGC review",        cat: "UGC AI",           len: "0:12", fx: "mist",   src: "" }
  ],

  /* Сцены главной: заголовок слева, карточки по бокам. */
  stages: [
    { kicker: "Fashion",          title: "Super shirt",
      text: "Clothes that move like they cost ten times more. Garments, drops and lookbooks, made without a studio.",
      main: "super-shirt", mini: "speed-sneaker", side: "right" },
    { kicker: "VFX",              title: "Laser glasses",
      text: "Light, portals and impossible camera moves. The shot your reference has, rebuilt around your brand.",
      main: "laser-glasses", mini: "portal", side: "left" },
    { kicker: "Product Showcase", title: "Luxury watch",
      text: "Macro, metal, mist and reflections. A product film that makes the object feel worth the price.",
      main: "luxury-watch", mini: "perfume", side: "right" },
    { kicker: "E-commerce and UGC", title: "Made to sell",
      text: "Catalogue loops and creator-style videos for shops that need new content every week.",
      main: "ugc-unbox", mini: "catalog-loop", side: "left" }
  ],

  niches: ["Fashion", "VFX", "Product Showcase", "E-commerce", "UGC AI"],

  tutorials: [
    { id: "luxury-watch", title: "Luxury watch", tag: "Product",
      free: [
        "Create one clean still of the product on a dark surface. Any image generator with a free daily allowance is enough. Prompt the object, the surface and the light. Skip the story.",
        "Open an image-to-video generator with free credits and upload the still. Ask for one slow camera move and one physical event, for example mist rolling over the dial.",
        "Generate four takes. Keep the one where the object does not change shape. Throw the rest away.",
        "Trim to 6–8 seconds in CapCut or DaVinci Resolve, both free. Add a slow push-in and nothing else."
      ],
      locked: "Exact prompts, the camera words that work, the colour grade preset and the 9:16 export settings." },
    { id: "super-shirt", title: "Super shirt", tag: "Fashion",
      free: [
        "Write the character once: age, clothes, hair, one distinctive detail. Reuse this block word for word in every prompt.",
        "Generate a still of the character on a runway, medium shot, soft top light.",
        "Animate it with image-to-video. Ask for a slow walk toward camera and keep the move simple.",
        "Cut on movement. Two 4-second shots read better than one 8-second shot."
      ],
      locked: "The character-lock prompt, a shot list for 3 angles and the stitching template." },
    { id: "laser-glasses", title: "Laser glasses", tag: "VFX",
      free: [
        "Generate the subject first, with no effect. A clean face and clean glasses give the effect something to work on.",
        "Add the effect in a second step: beam, glow, lens flare. Keep it to one light colour.",
        "Animate with a locked camera. Let the light do the motion.",
        "Add glow and grain in the editor, not in the generator. It is faster and easier to control."
      ],
      locked: "Effect prompt library, flare and glow presets, and the grain overlay pack." },
    { id: "ugc-unbox", title: "UGC unboxing", tag: "UGC AI",
      free: [
        "Pick one creator look and describe it in a single reusable sentence: age, setting, light, camera height.",
        "Generate a handheld-style still of the creator holding the product.",
        "Animate with small, natural motion. Big gestures break faces.",
        "Add real voice or captions in the editor so the video feels human."
      ],
      locked: "Creator-lock templates, 20 hook lines and the caption style presets." }
  ],

  /* Программа платного продукта */
  program: [
    ["Module 1 · The free stack", "Which free generators and editors to use, how to rotate daily credits, and how to never pay for a subscription."],
    ["Module 2 · Pipelines that work", "Five complete pipelines from still to finished video: product, fashion, VFX, e-commerce and UGC."],
    ["Module 3 · The viral formats", "The video types that perform in Reels and TikTok, with the structure behind each one."],
    ["Module 4 · Prompts and camera", "Prompt blocks, camera words and lighting terms that generators actually respond to."],
    ["Module 5 · Finishing", "Colour grade presets, sound beds, captions and export settings for vertical video."],
    ["Module 6 · Selling it", "How to price these videos, find local clients and deliver without calls."]
  ],

  courseIncludes: [
    "Full recipes for 12 videos: prompts, settings, edit files",
    "The free-stack workflow. No paid subscription at any step",
    "Character-lock and product-lock templates",
    "Camera and lighting words that generators respond to",
    "Colour grade presets and vertical export settings",
    "How to price and sell these videos to businesses",
    "Updates to the pack when the tools change"
  ],

  faq: [
    ["Do I really not need any subscription?", "Correct. The method is built on free tiers and free editors. Free tiers have daily limits, so the program shows how to plan around them."],
    ["How fast do you rebuild a video?", "Most orders ship in one or two days. You see the price and the date before we start."],
    ["Can you match my brand, not just copy the look?", "Yes. We rebuild the idea, then dress it in your product, colours, logo and language."],
    ["How do I get access after paying?", "Send the transaction hash in the confirmation form. We verify it on-chain and send access in Telegram."],
    ["Do you work with businesses outside Europe?", "Yes. We focus on Europe, but delivery is digital and works anywhere."]
  ]
};
