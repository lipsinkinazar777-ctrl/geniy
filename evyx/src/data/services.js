import cartoon from '../assets/kinds/cartoon.webp';
import ad from '../assets/kinds/ad.webp';
import promo from '../assets/kinds/promo.webp';
import music from '../assets/kinds/music.webp';
import meme from '../assets/kinds/meme.webp';
import any from '../assets/kinds/any.webp';
import { prices } from './site.js';

export const tiers = [
  { id: 'single', name: 'Single scene', price: prices.remake[0], summary: 'Up to 8 seconds, one scene',
    features: ['Any reference you send', 'Your idea and your brand', 'Vertical 9:16', 'One round of fixes'] },
  { id: 'double', name: 'Two scenes', price: prices.remake[1], summary: 'Up to 15 seconds, two scenes', featured: true,
    features: ['Everything in Single scene', 'Two scenes, one story', 'Sound and captions', 'Delivery in 1–2 days'] },
  { id: 'effects', name: 'Character + effects', price: prices.remake[2], summary: '15 seconds, a character and effects',
    features: ['Everything in Two scenes', 'A consistent character', 'Custom VFX', 'Priority queue'] }
];

export const kinds = [
  { id: 'cartoons', img: cartoon, title: 'Cartoons', text: 'From short animated stories to full projects. Any style: 2D, 3D, hand-drawn or anime.',
    includes: ['Character design and style frames', 'Scenes up to several minutes', 'Voice and music on request'] },
  { id: 'ads', img: ad, title: 'Ad videos', text: 'Selling through visuals. Videos for Instagram, YouTube, TikTok, websites and screens.',
    includes: ['Hook in the first second', 'Several variations for testing', 'Cut-downs for every placement'] },
  { id: 'promo', img: promo, title: 'Promo clips', text: 'Presenter-style and brand videos for launches, events and campaigns, made without a crew.',
    includes: ['AI presenter or your own avatar', 'Script help', 'Captions in several languages'] },
  { id: 'music', img: music, title: 'Music clips', text: 'Clips for artists and labels. Performance, lyrics and abstract worlds, with or without a person.',
    includes: ['Visual concept', 'Cut to the beat', 'Vertical and wide versions'] },
  { id: 'greetings', img: meme, title: 'Greetings and memes', text: 'Personal videos, video cards, parodies and memes, made for the person and the moment.',
    includes: ['Name and personal details', 'Fast turnaround', 'Ready to send in a chat'] },
  { id: 'any', img: any, title: 'Any format', text: 'Have an idea? We make it. Format, platform, style and script are up to you.',
    includes: ['Free first consultation', 'A price before we start', 'One round of fixes'] }
];

export const videoTypes = ['Ad video', 'Promo clip', 'Cartoon', 'Music clip', 'Greeting / meme', 'AI character', 'Other'];

export const euSolutions = [
  { id: 'feed', title: 'Monthly content plans', text: 'A fixed number of videos every month, planned around your offer and your calendar.',
    points: ['Content plan agreed in advance', 'Delivered weekly', 'One contact person'] },
  { id: 'ads', title: 'Ad creatives', text: 'Several variations of one idea for Meta and TikTok ads, ready for testing.',
    points: ['Hooks and formats to test', 'All placements and ratios', 'Fast iterations on winners'] },
  { id: 'languages', title: 'Multilingual versions', text: 'The same video adapted for different European markets.',
    points: ['Captions and voice in EU languages', 'Local details in the visuals', 'One master, many markets'] },
  { id: 'brand', title: 'Brand films', text: 'Brand story and venue films that look like a real campaign, without a shoot.',
    points: ['Concept and script', 'Character or presenter', 'Wide and vertical masters'] }
];

export const how = [
  ['Send a reference', 'A link or a file of the video you want, plus one line on what to change.'],
  ['Get a price and a date', 'You see the cost and the delivery time before anything starts.'],
  ['We build it', 'Generation, selection, edit, grade and sound. Vertical 9:16 by default.'],
  ['Post it', 'One round of fixes is included. Files arrive without watermarks.']
];

export const faq = [
  ['How fast do you deliver a video?', 'Most orders ship in one or two days. You see the price and the date before we start.'],
  ['Can you match my brand, not just copy a look?', 'Yes. We rebuild the idea, then dress it in your colours, logo and language.'],
  ['What do I need to send?', 'A link to the reference video or a short description, and one line on what should change.'],
  ['How do I pay?', 'In USDT on TRC20, ERC20 or Solana. After paying you paste the transaction hash and get a receipt.'],
  ['Do you work with businesses outside Europe?', 'Yes. We focus on Europe, but delivery is digital and works anywhere.']
];
