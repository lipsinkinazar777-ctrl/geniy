import androidPortrait from '../assets/cards/android-portrait.webp';
import profileTurn from '../assets/cards/profile-turn.webp';
import rearView from '../assets/cards/rear-view.webp';
import handReach from '../assets/cards/hand-reach.webp';
import fullFigure from '../assets/cards/full-figure.webp';
import closeUp from '../assets/cards/close-up.webp';
import portal from '../assets/cards/portal.webp';
import liquidMetal from '../assets/cards/liquid-metal.webp';

/* Showcase. `poster` is the still; set `src` to a vertical mp4 URL to play a real video
   on hover and in the player. `case` is the sample brief shown in the case-study tab. */
export const videos = [
  { id: 'android-portrait', title: 'Android portrait', cat: 'Characters', len: '0:08', poster: androidPortrait, src: '',
    case: { brief: 'A recurring AI character for a brand channel, introduced with a slow, moody portrait.', approach: 'Character-lock prompt, one hero still, a slow turn toward camera, warm rim light and a dark grade.', deliverables: ['8 s vertical master', 'Square cut for the feed', 'Character sheet for future videos'] } },
  { id: 'profile-turn', title: 'Profile turn', cat: 'Cinematic', len: '0:06', poster: profileTurn, src: '',
    case: { brief: 'An opener shot that reads in the first second of a Reel.', approach: 'First and last frame generated as stills, the move animated between them, then graded and sound-designed.', deliverables: ['6 s vertical master', 'Loopable version', 'Sound bed'] } },
  { id: 'rear-view', title: 'Rear view', cat: 'Characters', len: '0:07', poster: rearView, src: '',
    case: { brief: 'A reveal from behind for a teaser campaign.', approach: 'Locked character, rear angle, a slow push-in and a light sweep across the armour.', deliverables: ['7 s vertical master', 'Teaser cut with title space'] } },
  { id: 'hand-reach', title: 'Hand reach', cat: 'Cinematic', len: '0:05', poster: handReach, src: '',
    case: { brief: 'A macro detail shot to sit between wider scenes.', approach: 'Shallow focus macro, a single gesture toward camera, rack focus in the edit.', deliverables: ['5 s vertical master', 'Slow-motion variant'] } },
  { id: 'full-figure', title: 'Full figure', cat: 'Characters', len: '0:09', poster: fullFigure, src: '',
    case: { brief: 'A full-length hero shot for a launch page and a 15 s ad.', approach: 'Full figure on a reflective floor, a slow orbit and a light line along the horizon.', deliverables: ['9 s vertical master', '16:9 version for the website'] } },
  { id: 'close-up', title: 'Close-up', cat: 'Cinematic', len: '0:06', poster: closeUp, src: '',
    case: { brief: 'A face close-up with large type behind it for a poster-style ad.', approach: 'Hero still with depth, a breathing glow on the visor, title layered behind the subject.', deliverables: ['6 s vertical master', 'Poster still in high resolution'] } },
  { id: 'portal', title: 'Portal opening', cat: 'VFX', len: '0:07', poster: portal, src: '',
    case: { brief: 'A transition effect to open a product or music launch.', approach: 'Clean plate first, the light slit added as an effect pass, glow and grain in the edit.', deliverables: ['7 s vertical master', 'Transition version with alpha'] } },
  { id: 'liquid-metal', title: 'Liquid metal', cat: 'VFX', len: '0:08', poster: liquidMetal, src: '',
    case: { brief: 'An abstract loop for a background or a logo reveal.', approach: 'Mirror-gold material, slow rotation, reflections tuned for a seamless loop.', deliverables: ['8 s seamless loop', 'Logo reveal variant'] } }
];

export const categories = ['All', ...new Set(videos.map(v => v.cat))];
