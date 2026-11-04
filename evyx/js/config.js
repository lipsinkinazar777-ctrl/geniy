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

  /* VIDEOS. Put a vertical 9:16 mp4 in assets/videos/ and set src (plays on hover).
     img is the poster. These are sample stills until you add your own. */
  videos: [
    { id: "android-portrait", title: "Android portrait", cat: "Characters", len: "0:08", img: "assets/cards/android-portrait.webp", src: "" },
    { id: "profile-turn",     title: "Profile turn",     cat: "Cinematic",  len: "0:06", img: "assets/cards/profile-turn.webp",     src: "" },
    { id: "rear-view",        title: "Rear view",        cat: "Characters", len: "0:07", img: "assets/cards/rear-view.webp",        src: "" },
    { id: "hand-reach",       title: "Hand reach",       cat: "Cinematic",  len: "0:05", img: "assets/cards/hand-reach.webp",       src: "" },
    { id: "full-figure",      title: "Full figure",      cat: "Characters", len: "0:09", img: "assets/cards/full-figure.webp",      src: "" },
    { id: "close-up",         title: "Close-up",         cat: "Cinematic",  len: "0:06", img: "assets/cards/close-up.webp",         src: "" },
    { id: "portal",           title: "Portal opening",   cat: "VFX",        len: "0:07", img: "assets/cards/portal.webp",           src: "" },
    { id: "liquid-metal",     title: "Liquid metal",     cat: "VFX",        len: "0:08", img: "assets/cards/liquid-metal.webp",     src: "" }
  ],

  /* Kinds of video we make (used by the calculator and the "What we create" block). */
  niches: ["Ad video", "Promo clip", "Cartoon", "Music clip", "Greeting / meme", "AI character"],

  kinds: [
    { img: "assets/kinds/cartoon.webp", title: "Cartoons", text: "From short animated stories to full projects. Any style: 2D, 3D, hand-drawn or anime." },
    { img: "assets/kinds/ad.webp",      title: "Ad videos", text: "Selling through visuals. Videos for Instagram, YouTube, TikTok, websites and screens." },
    { img: "assets/kinds/promo.webp",   title: "Promo clips", text: "Presenter-style and brand videos for launches, events and campaigns, shot without a crew." },
    { img: "assets/kinds/music.webp",   title: "Music clips", text: "Clips for artists and labels. Performance, lyrics and abstract worlds, with or without a person." },
    { img: "assets/kinds/meme.webp",    title: "Greetings and memes", text: "Personal videos, video cards, parodies and memes, made for the person and the moment." },
    { img: "assets/kinds/any.webp",     title: "Any format", text: "Have an idea? We make it. Format, platform, style and script are up to you." }
  ],

  how: [
    ["Send a reference", "A link or a file of the video you want, plus one line on what to change."],
    ["Get a price and a date", "You see the cost and the delivery time before anything starts."],
    ["We build it", "Generation, selection, edit, grade and sound. Vertical 9:16 by default."],
    ["Post it", "One round of fixes is included. Files arrive without watermarks."]
  ],

  tutorials: [
    { id: "close-up", title: "Cinematic close-up", tag: "Cinematic",
      free: [
        "Create one clean still of your subject on a dark background. Any image generator with a free daily allowance is enough. Prompt the subject, the setting and the light. Skip the story.",
        "Open an image-to-video generator with free credits and upload the still. Ask for one slow camera move and one physical event, for example a slow turn of the head.",
        "Generate four takes. Keep the one where the subject does not change shape. Throw the rest away.",
        "Trim to 6–8 seconds in CapCut or DaVinci Resolve, both free. Add a slow push-in and nothing else."
      ],
      locked: "Exact prompts, the camera words that work, the colour grade preset and the 9:16 export settings." },
    { id: "android-portrait", title: "AI character", tag: "Characters",
      free: [
        "Write the character once: who, what they wear, one distinctive detail. Reuse this block word for word in every prompt.",
        "Generate a still of the subject, medium shot, soft top light.",
        "Animate it with image-to-video. Ask for a slow turn toward camera and keep the move simple.",
        "Cut on movement. Two 4-second shots read better than one 8-second shot."
      ],
      locked: "The character-lock prompt, a shot list for 3 angles and the stitching template." },
    { id: "portal", title: "Portal opening", tag: "VFX",
      free: [
        "Generate the scene first, with no effect. A clean frame gives the effect something to work on.",
        "Add the effect in a second step: rings, glow, light spill. Keep it to one light colour.",
        "Animate with a locked camera. Let the light do the motion.",
        "Add glow and grain in the editor, not in the generator. It is faster and easier to control."
      ],
      locked: "Effect prompt library, glow presets and the grain overlay pack." },
    { id: "profile-turn", title: "Camera move", tag: "Cinematic",
      free: [
        "Pick one camera move: push-in, orbit or tilt. Write it as a single short sentence.",
        "Generate the first frame and the last frame of the move as two stills.",
        "Animate between them. Small, natural motion works best.",
        "Add sound and a slow grade in the editor so the shot feels expensive."
      ],
      locked: "Camera vocabulary, 12 move presets and the grade pack." }
  ],

  program: [
    ["The free stack", "Which free generators and editors to use, how to rotate daily credits, and how to never pay for a subscription."],
    ["Pipelines that work", "Five complete pipelines from still to finished video: characters, cinematic shots, VFX, ads and music clips."],
    ["The viral formats", "The video types that perform in Reels and TikTok, with the structure behind each one."],
    ["Prompts and camera", "Prompt blocks, camera words and lighting terms that generators actually respond to."],
    ["Finishing", "Colour grade presets, sound beds, captions and export settings for vertical video."],
    ["Selling it", "How to price these videos, find clients and deliver without calls."]
  ],

  courseIncludes: [
    "Full recipes for 12 videos: prompts, settings, edit files",
    "The free-stack workflow. No paid subscription at any step",
    "Character-lock and scene-lock templates",
    "Camera and lighting words that generators respond to",
    "Colour grade presets and vertical export settings",
    "How to price and sell these videos to clients",
    "Updates to the pack when the tools change"
  ],

  requests: "AI video production, AI video studio, order an AI video, make an animated clip, promo video, advertising video, music video, AI cartoon, AI character, AI avatar, greeting video, video without a camera crew, video without actors, video from text, AI video with voiceover, personalised AI video, branded AI content for Europe, Reels and TikTok videos, video ads for Meta and TikTok, cheap AI video production, alternative to a video studio.",

  faq: [
    ["Do I really not need any subscription?", "Correct. The method is built on free tiers and free editors. Free tiers have daily limits, so the program shows how to plan around them."],
    ["How fast do you deliver a video?", "Most orders ship in one or two days. You see the price and the date before we start."],
    ["Can you match my brand, not just copy a look?", "Yes. We rebuild the idea, then dress it in your idea, colours, logo and language."],
    ["How do I get access after paying?", "Send the transaction hash in the confirmation form. We verify it on-chain and send access in Telegram."],
    ["Do you work with businesses outside Europe?", "Yes. We focus on Europe, but delivery is digital and works anywhere."]
  ]
};
