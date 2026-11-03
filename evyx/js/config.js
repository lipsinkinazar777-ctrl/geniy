/* ============================================================
   EVYX — единственный файл, который нужно править.
   Контакты, оплата, цены, видео и инструкции.
   ============================================================ */
window.EVYX = {
  contact: {
    telegram: "evyx_studio",          // без @
    email: "hello@evyx.studio",
    instagram: "evyx.studio"
  },

  prices: {
    recreateFrom: 15,
    recreateTo: 20,
    course: 100
  },

  /* Оплата. Метод с пустым адресом/ссылкой или с текстом PASTE_ на сайте не показывается.
     Совет для доступа на двоих: Stripe/Lemon Squeezy с двумя участниками команды
     или крипто-кошелёк мультиподписью (например Safe / Binance Pay на общий аккаунт). */
  pay: {
    methods: [
      { id: "card",  label: "Card",              url: "PASTE_PAYMENT_LINK_URL",
        note: "Stripe Payment Link или Lemon Squeezy. Оплата картой, Apple Pay, Google Pay." },
      { id: "usdt",  label: "USDT · TRC-20",     address: "PASTE_USDT_TRC20_ADDRESS",
        note: "Отправьте ровно 100 USDT. Сеть только TRC-20." },
      { id: "usdc",  label: "USDC · Polygon",    address: "PASTE_USDC_POLYGON_ADDRESS",
        note: "Отправьте ровно 100 USDC. Сеть только Polygon." },
      { id: "btc",   label: "Bitcoin",           address: "PASTE_BTC_ADDRESS",
        note: "Сумма эквивалентна 100 USD по курсу на момент оплаты." }
    ]
  },

  /* Видео-витрина. Положите файл в assets/videos/ и впишите путь в src.
     Вертикальный формат 9:16, mp4, лучше до 6 МБ. Пока src пустой — показывается заставка. */
  videos: [
    { id: "gold-pour",    title: "Liquid gold pour",       cat: "Product",   len: "0:08", src: "", poster: "" },
    { id: "street-run",   title: "Paris street run",       cat: "Fashion",   len: "0:10", src: "", poster: "" },
    { id: "perfume-mist", title: "Perfume in mist",        cat: "Product",   len: "0:06", src: "", poster: "" },
    { id: "cafe-loop",    title: "Café morning loop",      cat: "Lifestyle", len: "0:07", src: "", poster: "" },
    { id: "car-night",    title: "Night drive, rain",      cat: "Cinematic", len: "0:12", src: "", poster: "" },
    { id: "ring-orbit",   title: "Ring orbit macro",       cat: "Product",   len: "0:06", src: "", poster: "" },
    { id: "model-walk",   title: "Runway walk, stone hall",cat: "Fashion",   len: "0:09", src: "", poster: "" },
    { id: "ocean-villa",  title: "Villa at the cliff",     cat: "Real estate",len: "0:11", src: "", poster: "" },
    { id: "chef-hands",   title: "Chef hands, slow",       cat: "Lifestyle", len: "0:08", src: "", poster: "" },
    { id: "robot-city",   title: "City of glass",          cat: "Cinematic", len: "0:10", src: "", poster: "" },
    { id: "watch-sweep",  title: "Watch dial sweep",       cat: "Product",   len: "0:07", src: "", poster: "" },
    { id: "salon-reveal", title: "Salon before/after",     cat: "Beauty",    len: "0:09", src: "", poster: "" }
  ],

  /* Вкладки «How to make this video free». free — открытые шаги, locked — что внутри платного продукта. */
  tutorials: [
    { id: "gold-pour", title: "Liquid gold pour", tag: "Product",
      free: [
        "Create one clean still of the product on a dark surface. Any image generator with a free daily allowance is enough. Prompt the object, the surface and the light. Skip the story.",
        "Open an image-to-video generator with free credits and upload the still. Ask for one slow camera move and one physical event, for example gold poured over the object.",
        "Generate four takes. Keep the one where the object does not change shape. Throw the rest away.",
        "Trim to 6–8 seconds in CapCut or DaVinci Resolve, both free. Add a slow push-in and nothing else."
      ],
      locked: "Exact prompts, camera words that work, the colour grade preset and the 9:16 export settings." },
    { id: "street-run", title: "Paris street run", tag: "Fashion",
      free: [
        "Write the character once: age, clothes, hair, one distinctive detail. Reuse this block word for word in every prompt.",
        "Generate a still of the character in the street, medium shot, soft overcast light.",
        "Animate it with image-to-video. Ask for walking toward camera and keep the move simple.",
        "Cut on movement. Two 4-second shots read better than one 8-second shot."
      ],
      locked: "The character-lock prompt, the shot list for 3 angles and the stitching template." },
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
        "Generate wide establishing frame, then a close detail frame (wheel, headlight).",
        "Animate both. Wide gets a slow tracking move, detail gets a rack focus.",
        "Cut between them in rhythm with a free music track and export vertical."
      ],
      locked: "Camera vocabulary sheet, the 12-shot night pack and the sound-bed list." }
  ],

  /* Что входит в продукт за $100 */
  courseIncludes: [
    "Full recipes for 12 videos: prompts, settings, edit files",
    "The free-stack workflow. No paid subscription needed at any step",
    "Character-lock and product-lock templates",
    "Camera and lighting vocabulary that generators actually respond to",
    "Colour grade presets and vertical export settings",
    "How to price and sell these videos to local businesses",
    "Updates to the pack when the tools change"
  ]
};
