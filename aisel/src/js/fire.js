/* ============================================================ the fire in its iron bowl on the table
   three flame layers + pulsing coals (driven by the real crackle level) + smoke when it dies + warm pooled light that flickers on wood and paper */
A.fire = (() => {
  const cv = A.$('#fireCv'), ctx = cv.getContext('2d'), glow = A.$('#glow'), dim = A.$('#dim'), shade = A.$('#shade'), CW = 720, CH = 820, BX = 360, BY = 640;
  const gl = (() => { try { const L0 = A.scene.layout(), c = A.$('#fireGl'), g = c.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }); if (!g) return null;
    const vs = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;v.y=1.-v.y;gl_Position=vec4(a,0.,1.);}';
    const fs = `precision highp float; varying vec2 v; uniform sampler2D S; uniform float T,L,A;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
      float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
      void main(){
        float hh=1.-v.y;                                  // 0 at the logs, 1 at the top of the sprite
        float k=mix(.28,1.,L)*(1.+A*.08);                  // the flame shrinks to the coals as it dies
        float hs=hh/k; if(hs>1.) discard;
        vec2 u=vec2(v.x,1.-hs);
        float sw=(fbm(vec2(v.x*2.4,hs*3.-T*1.5))-.5)*.20*pow(hs,1.15)+(fbm(vec2(v.x*5.,hs*6.-T*3.7))-.5)*.07*hs;
        u.x+=sw; u.y+=(fbm(vec2(v.x*3.,T*2.1))-.5)*.035*hs;
        vec4 c=texture2D(S,clamp(u,0.,1.));
        float fl=.9+.1*sin(T*13.)*sin(T*7.3)+A*.18+(fbm(vec2(T*4.,hs))-.5)*.2;
        float rr=length((vec2(v.x,1.-hs)-vec2(.5,.6))/vec2(.5,.58)); float a=c.a*smoothstep(0.,.1,hh)*smoothstep(1.,.78,hs)*smoothstep(1.02,.55,rr)*clamp(L*1.6,0.,1.);
        vec3 col=c.rgb*fl*(1.12+.25*(1.-hs));
        gl_FragColor=vec4(col*a,a);
      }`;
    const sh = (t, src) => { const x = g.createShader(t); g.shaderSource(x, src); g.compileShader(x); if (!g.getShaderParameter(x, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(x)); return x; };
    const pr = g.createProgram(); g.attachShader(pr, sh(g.VERTEX_SHADER, vs)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, fs)); g.linkProgram(pr); g.useProgram(pr);
    const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW); const a = g.getAttribLocation(pr, 'a'); g.enableVertexAttribArray(a); g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
    const tex = g.createTexture(); const o = { g, c, u: n => g.getUniformLocation(pr, n), ready: false, uri: '' };
    o.load = uri => { if (o.uri === uri) return; o.uri = uri; const im = new Image(); im.onload = () => { g.bindTexture(g.TEXTURE_2D, tex); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, im); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE); o.ready = true; }; im.src = uri; };
    o.load(L0.flameUri); return o;
  } catch (e) { return null; } })();
  let ps = [], smoke = [], level = 0, target = 0, T = 0, fl = 1, flT = 1, sparkAcc = 0, knob = null, au = 0, ready = false;
  const R = (a, b) => a + Math.random() * (b - a), K = 1, SC = 1;
  const spr = (rgb, mid = .35) => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(mid, `rgba(${rgb},.5)`); gr.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c; };
  const S = { hot: spr('255,246,210', .25), yel: spr('255,206,90'), mid: spr('255,140,36'), red: spr('222,58,16'), smoke: spr('140,140,140', .2) };
  const COALS = [...Array(26)].map(() => { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()); return [Math.cos(a) * r * 110, 6 + Math.sin(a) * r * 40, R(10, 20), Math.random() * 6.3]; });

  function place() {
    const f = A.scene.fireBase(); const sc = (A.scene.layout().fireScale || 1), box = `left:${f.x - BX}px;top:${f.y - BY}px;width:${CW}px;height:${CH}px;transform:scale(${sc});transform-origin:${BX}px ${BY}px`; cv.style.cssText = box; if (gl) { const fr = A.scene.layout().flame; gl.load(A.scene.layout().flameUri); gl.c.style.cssText = `left:${fr[0]}px;top:${fr[1]}px;width:${fr[2]}px;height:${fr[3]}px`; gl.c.width = Math.round(fr[2] * 1.6); gl.c.height = Math.round(fr[3] * 1.6); }
    glow.style.cssText = `left:${f.x - 1400}px;top:${f.y - 1500}px;width:2800px;height:2800px`;
    shade.style.background = `radial-gradient(circle 1700px at ${f.x}px ${f.y}px, rgba(8,10,24,0) 0%, rgba(6,8,20,.30) 38%, rgba(4,5,14,.82) 100%)`; ready = true;
  }

  function frame(dt, t) {
    if (!ready) return; T = t; level += (target - level) * Math.min(1, dt * (target > level ? 2.4 : 2.6)); if (Math.abs(target - level) < .002) level = target;
    flT += (Math.random() - .5) * 1.8 * dt * 14; flT = A.clamp(flT, .55, 1.2); fl += (flT - fl) * Math.min(1, dt * 16);
    au += ((A.snd.fireLevel ? A.snd.fireLevel() : 0) - au) * .4;
    const L = level, flick = (.8 + .2 * Math.sin(T * 11.3) * Math.sin(T * 6.1) + au * .25) * fl;
    glow.style.opacity = (L * .5 * Math.min(1.15, flick)).toFixed(3); dim.style.opacity = ((1 - L) * .55).toFixed(3); shade.style.opacity = (L * (.45 + (1 - flick) * .2)).toFixed(3);
    if (knob) knob.style.opacity = (.3 + L * .7).toFixed(3);
    if (A.tab !== 'room' && A.tab !== 'back' && !A.fire.always) return;       // out of sight (a panel or another room): keep the light state, skip drawing
    ctx.clearRect(0, 0, CW, CH); ctx.globalCompositeOperation = 'lighter';
    if (gl && gl.ready) { const g = gl.g; g.viewport(0, 0, gl.c.width, gl.c.height); g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT); if (L > .01) { g.uniform1f(gl.u('T'), T); g.uniform1f(gl.u('L'), L); g.uniform1f(gl.u('A'), au); g.drawArrays(g.TRIANGLE_STRIP, 0, 4); } }
    // coals breathe with the crackle
    const cg = .22 + L * .78;
    [].forEach(([x, y, r, ph], i) => { const p = .5 + .5 * Math.sin(T * (1.4 + i % 5 * .6) + ph), pulse = (.35 + .65 * p) * (.7 + au * 1.1 * (i % 3 === 0 ? 1.4 : .6)); ctx.globalAlpha = Math.min(1, cg * pulse * .85); const rr = r * 1.7; ctx.drawImage(i % 5 ? S.red : S.mid, BX + x - rr, BY + y - rr * .6, rr * 2, rr * 1.2); });
    // sprite tongues: fallback only when WebGL is missing
    if (!gl && L > .02) {
      const n = (70 + 170 * L) * L * dt;
      for (let i = 0; i < n; i++) { const ly = Math.random() < .5 ? 0 : Math.random() < .6 ? 1 : 2; ps.push({ ly, x: BX + R(-64, 64) * SC * (ly === 0 ? 1 : ly === 1 ? .65 : .35) * (.5 + .5 * L), y: BY + R(-6, 8), vx: R(-10, 10), vy: -R(150, 270) * SC * (.55 + .45 * L) * (ly === 0 ? 1 : ly === 1 ? 1.15 : .8), life: 0, ttl: R(.75, 1.5) * (ly === 2 ? .7 : 1), s: R(26, 46) * SC * (ly === 0 ? 1.15 : ly === 1 ? .9 : .6) * (.55 + .45 * L), ph: R(0, 6.3) }); }
      if (Math.random() < dt * 3.6 * L) ps.push({ ly: 1, x: BX + R(-30, 30), y: BY - 10, vx: R(-16, 16), vy: -R(330, 470) * SC, life: 0, ttl: R(.6, .95), s: R(16, 26) * SC, ph: 0 });   // a long licking tongue
    }
    if (gl) ps.length = 0;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]; p.life += dt; if (p.life > p.ttl) { ps.splice(i, 1); continue; } const k = p.life / p.ttl;
      p.x += (p.vx + Math.sin(T * 7 + p.ph) * 34 * k - (p.x - BX) * 2.1) * dt; p.y += p.vy * dt; p.vy *= 1 - .28 * dt;
      const sz = p.s * (1 - k * .74), w = sz * 1.1, h = sz * 2.6;
      const sp = p.ly === 2 ? (k < .35 ? S.hot : S.yel) : p.ly === 1 ? (k < .5 ? S.mid : S.red) : (k < .45 ? S.mid : S.red);
      ctx.globalAlpha = Math.min(1, (1 - k) * 1.25) * (p.ly === 0 ? .42 : p.ly === 1 ? .5 : .62) * Math.min(1, L * 1.5); ctx.drawImage(sp, p.x - w, p.y - h * .62, w * 2, h);
    }
    const bg = 170 * SC * (.35 + L * .65); ctx.globalAlpha = L * .5 * flick;  ctx.globalAlpha = L * .42 * flick; if (!gl) ctx.drawImage(S.mid, BX - bg * 1.2, BY - bg * .8, bg * 2.4, bg * 1.3);
    ctx.globalCompositeOperation = 'source-over';
    if (target === 0 && L > .015 && Math.random() < dt * 30 * L) smoke.push({ x: BX + R(-26, 26), y: BY - R(10, 40), vy: -R(30, 62), vx: R(-8, 8), life: 0, ttl: R(2.4, 4), s: R(28, 46) });
    for (let i = smoke.length - 1; i >= 0; i--) { const p = smoke[i]; p.life += dt; if (p.life > p.ttl) { smoke.splice(i, 1); continue; } const k = p.life / p.ttl; p.x += (p.vx + Math.sin(T * 1.6 + i) * 10) * dt; p.y += p.vy * dt; const r = p.s * (1 + k * 2.4); ctx.globalAlpha = .2 * (1 - k) * Math.min(1, k * 6); ctx.drawImage(S.smoke, p.x - r, p.y - r, r * 2, r * 2); }
    ctx.globalAlpha = 1;
    sparkAcc += dt * (3 + au * 7) * L * L; while (sparkAcc > 1) { sparkAcc--; const f = A.scene.fireBase(); A.scene.spark(f.x + R(-40, 40), f.y - R(30, 110)); }
  }

  function set(on, quiet) {
    target = on ? 1 : 0; A.state.fireOn = on; A.save && A.save(); document.body.classList.toggle('warm', on);
    if (!quiet) { A.snd.unlock && A.snd.unlock(); on ? (A.snd.fireLit(), setTimeout(() => A.snd.setFire(1), 380)) : (A.snd.fireOut && A.snd.fireOut(), A.snd.setFire(0)); A.vibrate(on ? [14, 30, 20] : 12); if (on) { const f = A.scene.fireBase(); for (let i = 0; i < 18; i++) A.scene.spark(f.x + R(-50, 50), f.y - R(20, 120)); } }
    else A.snd.setFire(on ? 1 : 0);
  }
  return {
    place, reset() { knob = null; }, attachKnob() {}, init() { place(); },
    frame, set, toggle() { set(!(target > 0)); }, get on() { return target > 0; }, get level() { return level; }, always: false
  };
})();
