/* EVYX android: a pre-rendered turn sequence (path-traced, transparent PNG/WebP frames).
   The head follows the cursor by cross-fading the two nearest frames. */
(function(){
  const BASE = 'assets/robot/';
  let manifest = null, frames = [], pending = null;
  const instances = new Set();
  const pointer = {x: 0, t: 0, has: false};

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const loadFrame = (i) => new Promise(res => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { frames[i] = img; instances.forEach(r => r.dirty = true); res(img); };
    img.onerror = () => res(null);
    img.src = BASE + manifest.files[i];
  });

  function load(){
    if (pending) return pending;
    pending = fetch(BASE + 'robot.json').then(r => r.json()).then(async m => {
      manifest = m; frames = new Array(m.files.length).fill(null);
      const mid = m.yaws.indexOf(0);
      await loadFrame(mid);                                   // the centre frame first
      const order = [...m.yaws.keys()].sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
      for (const i of order) if (i !== mid) loadFrame(i);      // the rest in the background
      return m;
    }).catch(() => null);
    return pending;
  }

  addEventListener('pointermove', e => {
    pointer.x = clamp((e.clientX / innerWidth) * 2 - 1, -1, 1);
    pointer.t = performance.now(); pointer.has = true;
  }, {passive: true});

  class Robot {
    constructor(root, opts = {}){
      this.root = root;
      this.canvas = root.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.glow = root.querySelector('.lens-glow');
      this.yaw = 0; this.target = 0; this.dirty = true; this.visible = true;
      this.follow = opts.follow !== false;       // follow the cursor
      this.range = opts.range || 26;             // degrees at the screen edge
      this.manual = null;                        // forced yaw (scroll story)
      this.manualWobble = opts.wobble || 0;
      this.size();
      new ResizeObserver(() => this.size()).observe(root);
      new IntersectionObserver(es => { this.visible = es[0].isIntersecting; }).observe(root);
      instances.add(this);
      load().then(() => { this.dirty = true; });
    }
    size(){
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(2, Math.round(this.root.clientWidth * dpr));
      const h = Math.max(2, Math.round(this.root.clientHeight * dpr));
      if (this.canvas.width !== w || this.canvas.height !== h){ this.canvas.width = w; this.canvas.height = h; this.dirty = true; }
    }
    setManual(deg){ this.manual = deg; }
    nearest(i){
      if (frames[i]) return frames[i];
      for (let d = 1; d < frames.length; d++){ if (frames[i - d]) return frames[i - d]; if (frames[i + d]) return frames[i + d]; }
      return null;
    }
    tick(t, dt){
      if (!manifest || !this.visible) return;
      let want;
      if (this.manual !== null){
        want = this.manual + (pointer.has ? pointer.x * this.manualWobble : 0);
      } else if (this.follow && pointer.has && performance.now() - pointer.t < 3500){
        want = pointer.x * this.range;
      } else {
        want = Math.sin(t * 0.42) * 9;                      // idle: a slow look around
      }
      this.target = want;
      const k = 1 - Math.exp(-dt * 6.5);
      const next = this.yaw + (this.target - this.yaw) * k;
      if (Math.abs(next - this.yaw) > 0.01 || this.dirty){ this.yaw = next; this.draw(); }
    }
    draw(){
      this.dirty = false;
      const m = manifest, ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
      const min = m.yaws[0], max = m.yaws[m.yaws.length - 1], step = m.yaws[1] - m.yaws[0];
      const y = clamp(this.yaw, min, max);
      const f = (y - min) / step; let i = Math.floor(f); let u = f - i;
      if (i >= m.yaws.length - 1){ i = m.yaws.length - 1; u = 0; }
      const A = this.nearest(i), B = u > 0.002 ? this.nearest(i + 1) : null;
      ctx.clearRect(0, 0, W, H);
      if (A) ctx.drawImage(A, 0, 0, W, H);
      if (B && B !== A){ ctx.globalAlpha = u; ctx.drawImage(B, 0, 0, W, H); ctx.globalAlpha = 1; }
      if (this.glow && m.lens){
        const la = m.lens[clamp(i, 0, m.lens.length - 1)], lb = m.lens[clamp(i + 1, 0, m.lens.length - 1)];
        this.glow.style.left = ((la[0] + (lb[0] - la[0]) * u) * 100) + '%';
        this.glow.style.top = ((la[1] + (lb[1] - la[1]) * u) * 100) + '%';
      }
    }
  }

  let last = performance.now();
  function loop(now){
    requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    instances.forEach(r => r.tick(now / 1000, dt));
  }
  requestAnimationFrame(loop);

  window.EVYXRobot = { create: (root, opts) => new Robot(root, opts), load };
})();
