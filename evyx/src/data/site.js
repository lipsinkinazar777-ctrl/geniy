/* Studio-wide settings: contacts, prices and payment wallets. */

export const contact = {
  telegram: 'evyx_studio',
  email: 'hello@evyx.studio',
  instagram: 'evyx.studio'
};

export const telegramLink = (text = '') =>
  `https://t.me/${contact.telegram}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const prices = { remake: [15, 18, 20], course: 100 };

/* USDT wallets for the shared studio wallet.
   An empty address puts checkout into preview mode: the flow works end to end,
   shows a clearly invalid sample address and marks the receipt as a preview.
   For two owners use a multisig (Safe for TRC20/ERC20, Squads for Solana)
   or one exchange account that both of you can open. */
export const networks = [
  { id: 'trc20', token: 'USDT', chain: 'TRC20', address: '', hint: 'Tron network. Lowest fee, the most common choice.' },
  { id: 'erc20', token: 'USDT', chain: 'ERC20', address: '', hint: 'Ethereum network. Higher network fee.' },
  { id: 'sol', token: 'USDT', chain: 'Solana', address: '', hint: 'Solana network. Fast and cheap.' }
];

export const nav = [
  { to: '/', label: 'Home', end: true },
  { to: '/work', label: 'Work Showcase' },
  { to: '/services', label: 'Services (EU Business)' },
  { to: '/academy', label: 'Academy' }
];

/* Offer facts shown as quick stats. Every figure here is a property of the offer, not a claim about past results. */
export const stats = [
  { value: '$15', label: 'Starting price for one video remake' },
  { value: '1–2', label: 'Days to deliver most orders' },
  { value: '9:16', label: 'Vertical by default, any ratio on request' },
  { value: '$0', label: 'Subscriptions needed for the Academy method' }
];

export const requests =
  'AI video production, AI video studio, order an AI video, make an animated clip, promo video, advertising video, music video, AI cartoon, AI character, AI avatar, greeting video, video without a camera crew, video without actors, video from text, AI video with voiceover, personalised AI video, branded AI content for Europe, Reels and TikTok videos, video ads for Meta and TikTok, affordable AI video production, an alternative to a video studio.';
