/* ============================================================ the dock: on a phone held upright the desk is bigger than the screen, so the places on it are also one tap away at the bottom.
   Books, quotes, potions, the bag, and the two switches (fire, music box). It only calls what the objects on the desk call. */
A.dock = (() => {
  const el = A.$('#dock'); if (!el) return { refresh() {} };
  const fire = A.$('[data-d=fire]', el), music = A.$('[data-d=music]', el);
  function refresh() { fire.classList.toggle('on', !!(A.fire && A.fire.on)); music.classList.toggle('on', !!(A.musicBox && A.musicBox.on)); }
  el.addEventListener('pointerdown', e => e.stopPropagation());
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset.d; A.vibrate && A.vibrate(10);
    if (d === 'fire') { A.fire.toggle(); setTimeout(refresh, 60); return; }
    if (d === 'music') { A.musicBox.toggle(); refresh(); return; }
    A.snd.chime && A.snd.chime([392, 523.25], .08, .5); A.go(d);
  });
  new MutationObserver(refresh).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  refresh(); return { refresh };
})();
