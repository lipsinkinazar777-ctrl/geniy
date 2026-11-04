/* ============================================================
   EVYX — settings. Edit this file, nothing else, to change
   contacts, wallets, prices, videos and copy.
   ============================================================ */
window.EVYX = {
  contact: { telegram: "evyx_studio", email: "hello@evyx.studio", instagram: "evyx.studio" },

  prices: { tiers: [15, 18, 20], course: 100 },

  /* WALLETS. Paste the real address instead of PASTE_...
     Until then the checkout runs in a clearly marked preview mode with a fake,
     invalid address, so you can test the whole flow without risking funds.
     For two owners use a shared wallet: a multisig (Safe for TRC20/ERC20,
     Squads for Solana) or one exchange account both of you can open. */
  pay: {
    networks: [
      { id: "trc20", token: "USDT", chain: "TRC20",  address: "PASTE_USDT_TRC20_ADDRESS",
        hint: "Tron network. Lowest fee, the most common choice." },
      { id: "erc20", token: "USDT", chain: "ERC20",  address: "PASTE_USDT_ERC20_ADDRESS",
        hint: "Ethereum network. Higher network fee." },
      { id: "sol",   token: "USDT", chain: "Solana", address: "PASTE_USDT_SOLANA_ADDRESS",
        hint: "Solana network. Fast and cheap." }
    ]
  },

  /* VIDEOS. Put a vertical 9:16 mp4 in assets/videos/ and set src to play it
     on hover; img is the poster shown before. Until you replace them these
     are rendered sample stills. */
  videos: [
    { id: "laser-glasses", title: "Laser glasses",  cat: "Fashion",    len: "0:06", img: "assets/cards/laser-glasses.webp", src: "" },
    { id: "liquid-metal",  title: "Liquid metal",   cat: "VFX",        len: "0:08", img: "assets/cards/liquid-metal.webp",  src: "" },
    { id: "portal",        title: "Portal opening", cat: "VFX",        len: "0:07", img: "assets/cards/portal.webp",        src: "" },
    { id: "luxury-watch",  title: "Luxury watch",   cat: "Product",    len: "0:07", img: "assets/cards/luxury-watch.webp",  src: "" },
    { id: "ring-macro",    title: "Ring macro",     cat: "Product",    len: "0:06", img: "assets/cards/ring-macro.webp",    src: "" },
    { id: "perfume",       title: "Perfume",        cat: "Product",    len: "0:09", img: "assets/cards/perfume.webp",       src: "" },
    { id: "catalog-jar",   title: "Catalog loop",   cat: "E-commerce", len: "0:08", img: "assets/cards/catalog-jar.webp",   src: "" },
    { id: "ai-presenter",  title: "AI presenter",   cat: "UGC AI",     len: "0:12", img: "assets/cards/ai-presenter.webp",  src: "" },
    { id: "creator-lens",  title: "Creator avatar", cat: "UGC AI",     len: "0:10", img: "assets/cards/creator-lens.webp",  src: "" }
  ],

  niches: ["Fashion", "VFX", "Product", "E-commerce", "UGC AI"],

  /* Home scroll story: a word behind the robot, a sample on one side, text on the other. */
  stages: [
    { word: "FASHION", title: "Fashion", video: "laser-glasses", side: "left",
      text: "Garments, drops and lookbooks that move like a campaign shot. No studio, no models, no travel." },
    { word: "VFX", title: "VFX", video: "portal", side: "right",
      text: "Light, portals and camera moves that would cost a film crew. Built around your brand." },
    { word: "PRODUCT", title: "Product", video: "luxury-watch", side: "left",
      text: "Macro, metal and reflections. A product film that makes the object feel worth the price." },
    { word: "E-COMMERCE", title: "E-commerce and UGC", video: "catalog-jar", side: "right",
      text: "Catalogue loops and creator-style videos for shops that need fresh content every week." }
  ],

  tutorials: [
    { id: "luxury-watch", title: "Luxury watch", tag: "Product",
      free: [
        "Create one clean still of the product on a dark surface. Any image generator with a free daily allowance is enough. Prompt the object, the surface and the light. Skip the story.",
        "Open an image-to-video generator with free credits and upload the still. Ask for one slow camera move and one physical event, for example mist rolling over the dial.",
        "Generate four takes. Keep the one where the object does not change shape. Throw the rest away.",
        "Trim to 6–8 seconds in CapCut or DaVinci Resolve, both free. Add a slow push-in and nothing else."
      ],
      locked: "Exact prompts, the camera words that work, the colour grade preset and the 9:16 export settings." },
    { id: "laser-glasses", title: "Laser glasses", tag: "Fashion",
      free: [
        "Write the subject once: who, what they wear, one distinctive detail. Reuse this block word for word in every prompt.",
        "Generate a still of the subject, medium shot, soft top light.",
        "Animate it with image-to-video. Ask for a slow turn toward camera and keep the move simple.",
        "Cut on movement. Two 4-second shots read better than one 8-second shot."
      ],
      locked: "The subject-lock prompt, a shot list for 3 angles and the stitching template." },
    { id: "portal", title: "Portal opening", tag: "VFX",
      free: [
        "Generate the scene first, with no effect. A clean frame gives the effect something to work on.",
        "Add the effect in a second step: rings, glow, light spill. Keep it to one light colour.",
        "Animate with a locked camera. Let the light do the motion.",
        "Add glow and grain in the editor, not in the generator. It is faster and easier to control."
      ],
      locked: "Effect prompt library, glow presets and the grain overlay pack." },
    { id: "ai-presenter", title: "AI presenter", tag: "UGC AI",
      free: [
        "Pick one presenter look and describe it in a single reusable sentence: age, setting, light, camera height.",
        "Generate a handheld-style still of the presenter holding the product.",
        "Animate with small, natural motion. Big gestures break faces.",
        "Add real voice or captions in the editor so the video feels human."
      ],
      locked: "Presenter-lock templates, 20 hook lines and the caption style presets." }
  ],

  program: [
    ["The free stack", "Which free generators and editors to use, how to rotate daily credits, and how to never pay for a subscription."],
    ["Pipelines that work", "Five complete pipelines from still to finished video: product, fashion, VFX, e-commerce and UGC."],
    ["The viral formats", "The video types that perform in Reels and TikTok, with the structure behind each one."],
    ["Prompts and camera", "Prompt blocks, camera words and lighting terms that generators actually respond to."],
    ["Finishing", "Colour grade presets, sound beds, captions and export settings for vertical video."],
    ["Selling it", "How to price these videos, find clients and deliver without calls."]
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
    ["How fast do you deliver a video?", "Most orders ship in one or two days. You see the price and the date before we start."],
    ["Can you match my brand, not just copy a look?", "Yes. We rebuild the idea, then dress it in your product, colours, logo and language."],
    ["How do I get access after paying?", "Send the transaction hash in the confirmation form. We verify it on-chain and send access in Telegram."],
    ["Do you work with businesses outside Europe?", "Yes. We focus on Europe, but delivery is digital and works anywhere."]
  ]
};
