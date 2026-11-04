import closeUp from '../assets/cards/close-up.webp';
import androidPortrait from '../assets/cards/android-portrait.webp';
import portal from '../assets/cards/portal.webp';
import profileTurn from '../assets/cards/profile-turn.webp';
import { prices } from './site.js';

/* Free guides: every lesson is open. */
export const freeCourses = [
  { id: 'close-up', title: 'Cinematic close-up', tag: 'Cinematic', cover: closeUp, minutes: 12,
    lessons: [
      ['One clean still', 'Create one clean still of your subject on a dark background. Any image generator with a free daily allowance is enough. Prompt the subject, the setting and the light. Skip the story.'],
      ['One move, one event', 'Open an image-to-video generator with free credits and upload the still. Ask for one slow camera move and one physical event, for example a slow turn of the head.'],
      ['Pick the keeper', 'Generate four takes. Keep the one where the subject does not change shape. Throw the rest away.'],
      ['Finish for free', 'Trim to 6–8 seconds in CapCut or DaVinci Resolve, both free. Add a slow push-in and nothing else.']
    ] },
  { id: 'character', title: 'AI character', tag: 'Characters', cover: androidPortrait, minutes: 14,
    lessons: [
      ['Write the character once', 'Write the character once: who, what they wear, one distinctive detail. Reuse this block word for word in every prompt.'],
      ['The hero still', 'Generate a still of the subject, medium shot, soft top light.'],
      ['Animate simply', 'Animate it with image-to-video. Ask for a slow turn toward camera and keep the move simple.'],
      ['Cut on movement', 'Two 4-second shots read better than one 8-second shot. Cut on movement so the join is invisible.']
    ] },
  { id: 'portal', title: 'Portal opening', tag: 'VFX', cover: portal, minutes: 10,
    lessons: [
      ['Clean plate first', 'Generate the scene first, with no effect. A clean frame gives the effect something to work on.'],
      ['Add the light', 'Add the effect in a second step: rings, glow, light spill. Keep it to one light colour.'],
      ['Locked camera', 'Animate with a locked camera. Let the light do the motion.'],
      ['Glow in the edit', 'Add glow and grain in the editor, not in the generator. It is faster and easier to control.']
    ] },
  { id: 'camera-move', title: 'Camera move', tag: 'Cinematic', cover: profileTurn, minutes: 11,
    lessons: [
      ['Choose the move', 'Pick one camera move: push-in, orbit or tilt. Write it as a single short sentence.'],
      ['First and last frame', 'Generate the first frame and the last frame of the move as two stills.'],
      ['Animate between them', 'Animate between the two frames. Small, natural motion works best.'],
      ['Make it feel expensive', 'Add sound and a slow grade in the editor so the shot feels expensive.']
    ] }
];

/* The paid program: lesson titles are visible, the first lesson of each module is a free preview. */
export const program = {
  id: 'evyx-program',
  title: 'The EVYX Program',
  price: prices.course,
  edition: 'One exclusive edition. Pay once, keep it.',
  includes: [
    'Full recipes for 12 videos: prompts, settings, edit files',
    'The free-stack workflow. No paid subscription at any step',
    'Character-lock and scene-lock templates',
    'Camera and lighting words that generators respond to',
    'Colour grade presets and vertical export settings',
    'How to price and sell these videos to clients',
    'Updates to the pack when the tools change'
  ],
  modules: [
    { title: 'The free stack', text: 'Which free generators and editors to use, how to rotate daily credits, and how to never pay for a subscription.',
      lessons: ['Map of free tools', 'Rotating daily credits', 'A workspace that costs nothing'] },
    { title: 'Pipelines that work', text: 'Five complete pipelines from still to finished video: characters, cinematic shots, VFX, ads and music clips.',
      lessons: ['Character pipeline', 'Cinematic shot pipeline', 'VFX, ads and music pipelines'] },
    { title: 'The viral formats', text: 'The video types that perform in Reels and TikTok, with the structure behind each one.',
      lessons: ['Hooks that stop the scroll', 'Loop structures', 'Series that build an audience'] },
    { title: 'Prompts and camera', text: 'Prompt blocks, camera words and lighting terms that generators actually respond to.',
      lessons: ['Prompt blocks', 'Camera vocabulary', 'Light and lens terms'] },
    { title: 'Finishing', text: 'Colour grade presets, sound beds, captions and export settings for vertical video.',
      lessons: ['Grade presets', 'Sound and captions', 'Export for every platform'] },
    { title: 'Selling it', text: 'How to price these videos, find clients and deliver without calls.',
      lessons: ['Pricing your work', 'Finding the first clients', 'Delivery without calls'] }
  ]
};

export const academyFaq = [
  ['Do I really not need any subscription?', 'Correct. The method is built on free tiers and free editors. Free tiers have daily limits, so the program shows how to plan around them.'],
  ['How do I get access after paying?', 'Paste the transaction hash at checkout. We verify it on-chain and send access in Telegram.'],
  ['Is it a live course?', 'No. It is a written and video pack you keep, with updates when the tools change.']
];
