/* ============================================================ the fire: the reference flame as a live sprite (WebGL: it rises, sways and breathes), logs and ring stay in the photo.
   One shared level drives the light on the table (drawn by the scene), the crackle and the library fire. Nothing here touches large layers per frame. */
A.fire = (() => {
  const cv = A.$('#fireCv'), ctx = cv.getContext('2d'), CW = 720, CH = 820, BX = 360, BY = 640;
  const VS = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;v.y=1.-v.y;gl_Position=vec4(a,0.,1.);}';
  const FS = `precision highp float; varying vec2 v; uniform sampler2D S; uniform float T,L,A;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
    float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
    void main(){
      float hh=1.-v.y;
      float k=mix(.26,1.,L)*(1.+A*.05);
      float hs=hh/k; if(hs>1.) discard;
      vec2 u=vec2(v.x,1.-hs);
      float sw=(fbm(vec2(v.x*2.4,hs*3.-T*1.2))-.5)*.16*pow(hs,1.15)+(fbm(vec2(v.x*5.,hs*6.-T*3.))-.5)*.05*hs;
      u.x+=sw; u.y+=(fbm(vec2(v.x*3.,T*1.7))-.5)*.03*hs;
      vec4 c=texture2D(S,clamp(u,0.,1.));
      float fl=.93+.05*sin(T*9.)+.03*sin(T*5.3+1.)+A*.05;
      float rr=length((vec2(v.x,1.-hs)-vec2(.5,.6))/vec2(.5,.58));
      float a=c.a*smoothstep(0.,.1,hh)*smoothstep(1.,.78,hs)*smoothstep(1.02,.55,rr)*clamp(L*1.6,0.,1.);
      gl_FragColor=vec4(c.rgb*fl*(1.1+.2*(1.-hs))*a,a);
    }`;
  function makeFlame(c) {
    try {
      const g = c.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }); if (!g) return null;
      const sh = (t, s) => { const x = g.createShader(t); g.shaderSource(x, s); g.compileShader(x); if (!g.getShaderParameter(x, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(x)); return x; };
      const pr = g.createProgram(); g.attachShader(pr, sh(g.VERTEX_SHADER, VS)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(pr); g.useProgram(pr);
      const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
      const a = g.getAttribLocation(pr, 'a'); g.enableVertexAttribArray(a); g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
      const tex = g.createTexture(), U = { T: g.getUniformLocation(pr, 'T'), L: g.getUniformLocation(pr, 'L'), A: g.getUniformLocation(pr, 'A') };
      const o = { c, ready: false, uri: '', cleared: false };
      o.load = uri => { if (!uri || o.uri === uri) return; o.uri = uri; o.ready = false; const im = new Image(); im.onload = () => { g.bindTexture(g.TEXTURE_2D, tex); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, im); [[g.TEXTURE_MIN_FILTER, g.LINEAR], [g.TEXTURE_MAG_FILTER, g.LINEAR], [g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE], [g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE]].forEach(([p, v]) => g.texParameteri(g.TEXTURE_2D, p, v)); o.ready = true; }; im.src = uri; };
      o.size = (w, h) => { const W = Math.round(w * 1.15), H = Math.round(h * 1.15); if (c.width !== W || c.height !== H) { c.width = W; c.height = H; } };
      o.draw = (T, L, Au) => { if (!o.ready) return; if (L <= .008) { if (!o.cleared) { g.viewport(0, 0, c.width, c.height); g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT); o.cleared = true; } return; } o.cleared = false; g.viewport(0, 0, c.width, c.height); g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT); g.uniform1f(U.T, T); g.uniform1f(U.L, L); g.uniform1f(U.A, Au); g.drawArrays(g.TRIANGLE_STRIP, 0, 4); };
      return o;
    } catch (e) { return null; }
  }
  const hubF = makeFlame(A.$('#fireGl')), libF = makeFlame(A.$('#fireGlLib'));
  let smoke = [], level = 0, target = 0, libLevel = 0, T = 0, sparkAcc = 0, au = 0, ready = false, smokeOn = false;
  const R = (a, b) => a + Math.random() * (b - a);
  const smk = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(140,140,140,1)'); gr.addColorStop(.2, 'rgba(140,140,140,.5)'); gr.addColorStop(1, 'rgba(140,140,140,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c; })();

  function place() {
    const L = A.scene.layout(), f = A.scene.fireBase();
    cv.style.cssText = `left:${f.x - BX}px;top:${f.y - BY}px;width:${CW}px;height:${CH}px`;
    if (hubF) { const r = L.flame; hubF.c.style.cssText = `left:${r[0]}px;top:${r[1]}px;width:${r[2]}px;height:${r[3]}px`; hubF.size(r[2], r[3]); hubF.load(L.flameImg); }
    if (libF && L.libFlame) { const r = L.libFlame.rect; libF.c.style.cssText = `left:${r[0]}px;top:${r[1]}px;width:${r[2]}px;height:${r[3]}px`; libF.size(r[2], r[3]); libF.load(L.libFlame.img); }
    ready = true;
  }
  const flick = t => .93 + .045 * Math.sin(t * 6.3) + .03 * Math.sin(t * 11.3 + 1.3) + .03 * au;     // smooth: never a jump from one frame to the next
  function frame(dt, t) {
    if (!ready) return; T = t; const room = A.scene.room();
    level += (target - level) * Math.min(1, dt * (target > level ? 2.4 : 2.6)); if (Math.abs(target - level) < .002) level = target;
    libLevel += ((room === 'lib' ? 1 : 0) - libLevel) * Math.min(1, dt * 2.2);
    au += ((A.snd.fireLevel ? A.snd.fireLevel() : 0) - au) * .12;
    if (room === 'main' && A.tab === 'room') {
      if (hubF) hubF.draw(T, level, au);
      if (smoke.length || smokeOn) drawSmoke(dt);
      const f = A.scene.fireBase(); sparkAcc += dt * (2.4 + au * 4) * level * level; while (sparkAcc > 1) { sparkAcc--; A.scene.spark(f.x + R(-34, 34), f.y - R(30, 100)); }
    } else if (room === 'lib' && libF) {
      libF.draw(T, libLevel, au);
      const b = A.scene.layout().libFlame.base; sparkAcc += dt * (2 + au * 4) * libLevel; while (sparkAcc > 1) { sparkAcc--; A.scene.spark(b[0] + R(-40, 40), b[1] - R(40, 130)); }
    }
  }
  function drawSmoke(dt) {
    ctx.clearRect(0, 0, CW, CH); smokeOn = smoke.length > 0;
    if (target === 0 && level > .02 && Math.random() < dt * 24 * level) smoke.push({ x: BX + R(-26, 26), y: BY - R(10, 40), vy: -R(30, 62), vx: R(-8, 8), life: 0, ttl: R(2.4, 4), s: R(28, 46) });
    for (let i = smoke.length - 1; i >= 0; i--) { const p = smoke[i]; p.life += dt; if (p.life > p.ttl) { smoke.splice(i, 1); continue; } const k = p.life / p.ttl; p.x += (p.vx + Math.sin(T * 1.6 + i) * 10) * dt; p.y += p.vy * dt; const r = p.s * (1 + k * 2.4); ctx.globalAlpha = .2 * (1 - k) * Math.min(1, k * 6); ctx.drawImage(smk, p.x - r, p.y - r, r * 2, r * 2); }
    ctx.globalAlpha = 1; smokeOn = smoke.length > 0 || (target === 0 && level > .02);
  }
  function set(on, quiet) {
    if (on === (target > 0) && quiet) { A.snd.setFire(on ? 1 : 0); return; }
    target = on ? 1 : 0; A.state.fireOn = on; A.save && A.save(); document.body.classList.toggle('warm', on); if (!on) smokeOn = true;
    if (!quiet) { A.snd.unlock && A.snd.unlock(); on ? (A.snd.fireLit(), setTimeout(() => A.snd.setFire(1), 380)) : (A.snd.fireOut && A.snd.fireOut(), A.snd.setFire(0)); A.vibrate(on ? [14, 30, 20] : 12); if (on) { const f = A.scene.fireBase(); for (let i = 0; i < 8; i++) A.scene.spark(f.x + R(-34, 34), f.y - R(20, 70)); } }
    else A.snd.setFire(on ? 1 : 0);
  }
  return {
    place, reset() {}, attachKnob() {}, init() { place(); },
    frame, set, toggle() { set(!(target > 0)); },
    light: () => ({ L: level, f: flick(T) }),
    get on() { return target > 0; }, get level() { return level; }, always: false
  };
})();
