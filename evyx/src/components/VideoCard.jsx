import { useRef } from 'react';

/* A 9:16 video tile. Plays `video.src` on hover when it is set; otherwise shows the poster. */
export default function VideoCard({ video, onOpen, eager = false }) {
  const vid = useRef(null);
  const play = () => vid.current && vid.current.play().catch(() => {});
  const stop = () => { if (vid.current) { vid.current.pause(); vid.current.currentTime = 0; } };

  return (
    <button type="button" className="card" onClick={() => onOpen && onOpen(video)} onMouseEnter={play} onMouseLeave={stop} aria-label={`Open ${video.title}`}>
      <img className="card__img" src={video.poster} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" />
      {video.src && <video ref={vid} className="card__vid" src={video.src} poster={video.poster} muted loop playsInline preload="none" />}
      <span className="card__play" aria-hidden="true" />
      <span className="card__meta">
        <span>
          <b className="card__title">{video.title}</b>
          <span className="card__sub">{video.cat}</span>
        </span>
        <span className="card__len">{video.len}</span>
      </span>
    </button>
  );
}
