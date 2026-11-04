/* Video card: poster image (or a quiet gold gradient if the image is missing) and an optional hover-to-play video. */
(function(){
  window.EVYXCard = function(v, opts = {}){
    const el = document.createElement(opts.static ? 'div' : 'button');
    el.className = 'card' + (opts.static ? ' card--static' : '');
    el.dataset.cat = v.cat;
    if (!opts.static){ el.type = 'button'; el.setAttribute('aria-label', 'Open ' + v.title); }
    if (v.img){
      const im = new Image();
      im.className = 'card__img'; im.alt = ''; im.loading = opts.eager ? 'eager' : 'lazy'; im.decoding = 'async';
      im.onerror = () => im.remove();
      im.src = v.img;
      el.appendChild(im);
    }
    if (v.src){
      const vd = document.createElement('video');
      vd.className = 'card__vid'; vd.src = v.src; vd.muted = true; vd.loop = true; vd.playsInline = true; vd.preload = 'none';
      if (v.img) vd.poster = v.img;
      el.appendChild(vd);
      el.addEventListener('mouseenter', () => vd.play().catch(() => {}));
      el.addEventListener('mouseleave', () => { vd.pause(); vd.currentTime = 0; });
      if (opts.autoplay){ vd.autoplay = true; vd.play().catch(() => {}); }
    }
    const meta = document.createElement('div');
    meta.className = 'card__meta';
    meta.innerHTML = `<div><b class="card__title">${v.title}</b><span class="card__sub">${v.cat}</span></div><span class="card__len">${v.len}</span>`;
    el.appendChild(meta);
    if (!opts.static){ const p = document.createElement('span'); p.className = 'card__play'; el.appendChild(p); }
    return el;
  };
})();
