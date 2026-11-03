/* ============================================================
   EVYX — файл настроек. Здесь меняются контакты, оплата, видео, тексты гайдов.
   ============================================================ */
window.EVYX = {
  contact: { telegram: "evyx_studio", email: "hello@evyx.studio", instagram: "evyx.studio" },

  prices: { recreateFrom: 15, recreateTo: 20, course: 100 },

  /* ОПЛАТА. Метод без реквизитов (или с PASTE_) на сайте не показывается.
     card  — ссылка на оплату (Stripe Payment Link / Lemon Squeezy / NOWPayments / Cryptomus invoice link)
     crypto — адрес кошелька; на сайте рисуется QR и кнопка копирования. */
  pay: {
    methods: [
      { id: "card", type: "link",   label: "Card / Apple Pay", sub: "Instant access",
        url: "PASTE_PAYMENT_LINK_URL",
        note: "You will be redirected to a secure checkout page." },
      { id: "usdt", type: "crypto", label: "USDT", sub: "TRC-20 network",
        address: "PASTE_USDT_TRC20_ADDRESS", amount: "100 USDT",
        note: "Send exactly 100 USDT on the TRC-20 network only." },
      { id: "usdc", type: "crypto", label: "USDC", sub: "Polygon network",
        address: "PASTE_USDC_POLYGON_ADDRESS", amount: "100 USDC",
        note: "Send exactly 100 USDC on the Polygon network only." },
      { id: "btc",  type: "crypto", label: "Bitcoin", sub: "BTC network",
        address: "PASTE_BTC_ADDRESS", amount: "≈ 100 USD in BTC",
        note: "Amount equals 100 USD at the moment of payment." }
    ]
  },

  /* Видео. Свой ролик: положите mp4 (вертикаль 9:16) в assets/videos/ и впишите путь в src.
     Пока src пустой — тайл показывает живую заставку (fx — вид анимации). */
  videos: [
    { id: "gold-pour",    title: "Liquid metal pour",    cat: "Product",    len: "0:08", fx: "orb",    src: "" },
    { id: "street-run",   title: "Paris street run",     cat: "Fashion",    len: "0:10", fx: "streak", src: "" },
    { id: "perfume-mist", title: "Perfume in mist",      cat: "Product",    len: "0:06", fx: "mist",   src: "" },
    { id: "cafe-loop",    title: "Café morning loop",    cat: "Lifestyle",  len: "0:07", fx: "wave",   src: "" },
    { id: "car-night",    title: "Night drive, rain",    cat: "Cinematic",  len: "0:12", fx: "rain",   src: "" },
    { id: "ring-orbit",   title: "Ring orbit macro",     cat: "Product",    len: "0:06", fx: "ring",   src: "" },
    { id: "model-walk",   title: "Runway walk",          cat: "Fashion",    len: "0:09", fx: "grid",   src: "" },
    { id: "ocean-villa",  title: "Villa at the cliff",   cat: "Real estate",len: "0:11", fx: "wave",   src: "" },
    { id: "chef-hands",   title: "Chef hands, slow",     cat: "Lifestyle",  len: "0:08", fx: "mist",   src: "" },
    { id: "robot-city",   title: "City of glass",        cat: "Cinematic",  len: "0:10", fx: "grid",   src: "" },
    { id: "watch-sweep",  title: "Watch dial sweep",     cat: "Product",    len: "0:07", fx: "ring",   src: "" },
    { id: "salon-reveal", title: "Salon before / after", cat: "Beauty",     len: "0:09", fx: "orb",    src: "" }
  ],

  tutorials: [
    { id: "gold-pour", title: "Liquid metal pour", tag: "Product",
      free: [
        "Create one clean still of the product on a dark surface. Any image generator with a free daily allowance is enough. Prompt the object, the surface and the light. Skip the story.",
        "Open an image-to-video generator with free credits and upload the still. Ask for one slow camera move and one physical event, for example metal poured over the object.",
        "Generate four takes. Keep the one where the object does not change shape. Throw the rest away.",
        "Trim to 6–8 seconds in CapCut or DaVinci Resolve, both free. Add a slow push-in and nothing else."
      ],
      locked: "Exact prompts, the camera words that work, the colour grade preset and the 9:16 export settings." },
    { id: "street-run", title: "Paris street run", tag: "Fashion",
      free: [
        "Write the character once: age, clothes, hair, one distinctive detail. Reuse this block word for word in every prompt.",
        "Generate a still of the character in the street, medium shot, soft overcast light.",
        "Animate it with image-to-video. Ask for walking toward camera and keep the move simple.",
        "Cut on movement. Two 4-second shots read better than one 8-second shot."
      ],
      locked: "The character-lock prompt, a shot list for 3 angles and the stitching template." },
    { id: "perfume-mist", title: "Perfume in mist", tag: "Product",
      free: [
        "Generate the bottle on its own first. Fix label shape and cap before you add anything else.",
        "Add the environment in a second step: mist, backlight, reflective surface.",
        "Animate with a locked camera. Let the mist do the motion.",
        "Add the real logo in the editor. Generators misspell text, so never trust them with it."
      ],
      locked: "Label-safe workflow, mist and glass prompts, and the logo overlay preset." },
    { id: "car-night", title: "Night drive, rain", tag: "Cinematic",
      free: [
        "Describe lens, time and weather first, then the car. Example: 35mm, night, wet asphalt, neon reflections.",
        "Generate a wide establishing frame, then a close detail frame (wheel, headlight).",
        "Animate both. Wide gets a slow tracking move, detail gets a rack focus.",
        "Cut between them in rhythm with a free music track and export vertical."
      ],
      locked: "Camera vocabulary sheet, the 12-shot night pack and the sound-bed list." }
  ],

  courseIncludes: [
    "Full recipes for 12 videos: prompts, settings, edit files",
    "The free-stack workflow. No paid subscription at any step",
    "Character-lock and product-lock templates",
    "Camera and lighting words that generators actually respond to",
    "Colour grade presets and vertical export settings",
    "How to price and sell these videos to local businesses",
    "Updates to the pack when the tools change"
  ],

  faq: [
    ["Do I really not need any subscription?", "Correct. The method is built on free tiers and free editors. Free tiers have daily limits, so the pack shows how to plan around them."],
    ["How fast do you rebuild a video?", "Most orders ship in 1–2 days. You see the price and the date before we start."],
    ["Can you match my brand, not just copy the look?", "Yes. We rebuild the idea, then dress it in your product, colours, logo and language."],
    ["How do I get the pack after paying?", "Card payments unlock it instantly. Crypto payments are checked by hand and you get access within a few hours."],
    ["Do you work with businesses outside Europe?", "Yes. We focus on Europe, but delivery is digital and works anywhere."],
    ["What if I want a refund?", "If the pack does not work for you, write to us within 7 days and we will sort it out."]
  ]
};
