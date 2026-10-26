/* ============================================================ the fire in its iron bowl on the table
   three flame layers + pulsing coals (driven by the real crackle level) + smoke when it dies + warm pooled light that flickers on wood and paper */
A.fire = (() => {
  const cv = A.$('#fireCv'), ctx = cv.getContext('2d'), glow = A.$('#glow'), dim = A.$('#dim'), shade = A.$('#shade'), CW = 720, CH = 820, BX = 360, BY = 640;
  const gl = (() => { try { const c = A.$('#fireGl'), g = c.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }); if (!g) return null;
    const vs = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    const fs = `precision highp float; uniform vec2 O; uniform float K,T,L,A; 
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
      float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
      float tongue(vec2 q,float off,float hg,float wd,float ph){
        float y=q.y/hg; if(y<-.06||y>1.) return 0.;
        float sway=(fbm(vec2(y*2.1+ph,T*.7+ph))-.5)*1.5*y;
        float x=(q.x-off)/wd+sway;
        float tex=fbm(vec2(x*1.6+ph*3.,y*2.3-T*1.8+ph));
        float w=mix(1.1,.05,pow(y,.7))*(.8+.5*tex);
        float body=smoothstep(w,w*.02,abs(x+(tex-.5)*.55*(.25+y)));
        float tex2=fbm(vec2(x*4.3-2.,y*5.-T*3.3));
        return max(body*(1.-clamp(y,0.,1.)*.92)*(.5+1.05*tex)-tex2*.24*max(y,0.),0.)*smoothstep(-.06,.07,y);
      }
      void main(){
        vec2 q=(gl_FragCoord.xy-O)/K; float lv=L; float au=1.+A*.35;
        float f=0.;
        f=max(f,tongue(q,0.,340.*lv*au,64.,0.));
        f=max(f,tongue(q,-46.,200.*lv,44.,1.7));
        f=max(f,tongue(q,50.,225.*lv,46.,3.3));
        f=max(f,tongue(q,6.,150.*lv,34.,5.1));
        f+=.24*exp(-dot(q/vec2(120.,36.),q/vec2(120.,36.)))*lv*smoothstep(-26.,8.,q.y);
        f=clamp(f*1.0,0.,1.);
        vec3 c=mix(vec3(.55,.04,0.),vec3(1.,.34,.03),smoothstep(.0,.34,f));
        c=mix(c,vec3(1.,.66,.08),smoothstep(.3,.7,f));
        c=mix(c,vec3(1.,.92,.6),smoothstep(.86,1.06,f));
        float a=smoothstep(.015,.3,f);
        gl_FragColor=vec4(c*a,a);
      }`;
    const sh = (t, src) => { const x = g.createShader(t); g.shaderSource(x, src); g.compileShader(x); if (!g.getShaderParameter(x, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(x)); return x; };
    const pr = g.createProgram(); g.attachShader(pr, sh(g.VERTEX_SHADER, vs)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, fs)); g.linkProgram(pr); g.useProgram(pr);
    const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW); const a = g.getAttribLocation(pr, 'a'); g.enableVertexAttribArray(a); g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
    return { g, c, u: n => g.getUniformLocation(pr, n) };
  } catch (e) { return null; } })();
  let ps = [], smoke = [], level = 0, target = 0, T = 0, fl = 1, flT = 1, sparkAcc = 0, knob = null, au = 0, ready = false;
  const R = (a, b) => a + Math.random() * (b - a), K = 1, SC = 1;
  const spr = (rgb, mid = .35) => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(mid, `rgba(${rgb},.5)`); gr.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c; };
  const S = { hot: spr('255,246,210', .25), yel: spr('255,206,90'), mid: spr('255,140,36'), red: spr('222,58,16'), smoke: spr('140,140,140', .2) };
  const COALS = [...Array(26)].map(() => { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()); return [Math.cos(a) * r * 110, 6 + Math.sin(a) * r * 40, R(10, 20), Math.random() * 6.3]; });

  function place() {
    const f = A.scene.fireBase(); const box = `left:${f.x - BX}px;top:${f.y - BY}px;width:${CW}px;height:${CH}px`; cv.style.cssText = box; if (gl) { gl.c.style.cssText = box; gl.c.width = Math.round(CW * .8); gl.c.height = Math.round(CH * .8); }
    glow.style.cssText = `left:${f.x - 1400}px;top:${f.y - 1100}px;width:2800px;height:2200px`;
    shade.style.background = `radial-gradient(circle 1700px at ${f.x}px ${f.y}px, rgba(8,10,24,0) 0%, rgba(6,8,20,.30) 38%, rgba(4,5,14,.82) 100%)`; ready = true;
  }

  function frame(dt, t) {
    if (!ready) return; T = t; level += (target - level) * Math.min(1, dt * (target > level ? 2.4 : 1.1)); if (Math.abs(target - level) < .002) level = target;
    flT += (Math.random() - .5) * 1.8 * dt * 14; flT = A.clamp(flT, .55, 1.2); fl += (flT - fl) * Math.min(1, dt * 16);
    au += ((A.snd.fireLevel ? A.snd.fireLevel() : 0) - au) * .4;
    const L = level, flick = (.8 + .2 * Math.sin(T * 11.3) * Math.sin(T * 6.1) + au * .25) * fl;
    glow.style.opacity = (L * 1.0 * Math.min(1.15, flick)).toFixed(3); dim.style.opacity = ((1 - L) * .64).toFixed(3); shade.style.opacity = (L * (.9 + (1 - flick) * .35)).toFixed(3);
    if (knob) knob.style.opacity = (.3 + L * .7).toFixed(3);
    if (A.tab !== 'room' && A.tab !== 'back' && !A.fire.always) return;       // out of sight (a panel or another room): keep the light state, skip drawing
    ctx.clearRect(0, 0, CW, CH); ctx.globalCompositeOperation = 'lighter';
    if (gl) { const g = gl.g, K = gl.c.width / CW; g.viewport(0, 0, gl.c.width, gl.c.height); g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT); if (L > .01) { g.uniform2f(gl.u('O'), BX * K, (CH - BY) * K); g.uniform1f(gl.u('K'), K * SC); g.uniform1f(gl.u('T'), T); g.uniform1f(gl.u('L'), L); g.uniform1f(gl.u('A'), au); g.drawArrays(g.TRIANGLE_STRIP, 0, 4); } }
    // coals breathe with the crackle
    const cg = .22 + L * .78;
    COALS.forEach(([x, y, r, ph], i) => { const p = .5 + .5 * Math.sin(T * (1.4 + i % 5 * .6) + ph), pulse = (.35 + .65 * p) * (.7 + au * 1.1 * (i % 3 === 0 ? 1.4 : .6)); ctx.globalAlpha = Math.min(1, cg * pulse * .85); const rr = r * 1.7; ctx.drawImage(i % 5 ? S.red : S.mid, BX + x - rr, BY + y - rr * .6, rr * 2, rr * 1.2); });
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
    const bg = 170 * SC * (.35 + L * .65); ctx.globalAlpha = L * .5 * flick; if (gl) ctx.drawImage(S.red, BX - bg * 1.3, BY - bg * .5, bg * 2.6, bg * 1.0); ctx.globalAlpha = L * .42 * flick; if (!gl) ctx.drawImage(S.mid, BX - bg * 1.2, BY - bg * .8, bg * 2.4, bg * 1.3);
    ctx.globalCompositeOperation = 'source-over';
    if (target === 0 && L > .015 && Math.random() < dt * 30 * L) smoke.push({ x: BX + R(-40, 40), y: BY - R(10, 40), vy: -R(30, 62), vx: R(-8, 8), life: 0, ttl: R(2.4, 4), s: R(28, 46) });
    for (let i = smoke.length - 1; i >= 0; i--) { const p = smoke[i]; p.life += dt; if (p.life > p.ttl) { smoke.splice(i, 1); continue; } const k = p.life / p.ttl; p.x += (p.vx + Math.sin(T * 1.6 + i) * 10) * dt; p.y += p.vy * dt; const r = p.s * (1 + k * 2.4); ctx.globalAlpha = .2 * (1 - k) * Math.min(1, k * 6); ctx.drawImage(S.smoke, p.x - r, p.y - r, r * 2, r * 2); }
    ctx.globalAlpha = 1;
    sparkAcc += dt * (14 + au * 40) * L * L; while (sparkAcc > 1) { sparkAcc--; const f = A.scene.fireBase(); A.scene.spark(f.x + R(-50, 50), f.y - R(40, 200)); }
  }

  function set(on, quiet) {
    target = on ? 1 : 0; A.state.fireOn = on; A.save && A.save(); document.body.classList.toggle('warm', on);
    if (!quiet) { A.snd.unlock && A.snd.unlock(); on ? (A.snd.fireLit(), setTimeout(() => A.snd.setFire(1), 380)) : (A.snd.fireOut && A.snd.fireOut(), A.snd.setFire(0)); A.vibrate(on ? [14, 30, 20] : 12); if (on) { const f = A.scene.fireBase(); for (let i = 0; i < 18; i++) A.scene.spark(f.x + R(-50, 50), f.y - R(20, 120)); } }
    else A.snd.setFire(on ? 1 : 0);
  }
  return {
    place, reset() { knob = null; }, attachKnob() { const k = A.scene.hs('knob'); if (!k) return; knob = A.h('<i class="knoblight"></i>'); knob.style.cssText = `left:${k.c[0]}px;top:${k.c[1]}px;opacity:0`; A.$('#hsFx').appendChild(knob); }, init() { place(); },
    frame, set, toggle() { set(!(target > 0)); }, get on() { return target > 0; }, get level() { return level; }, always: false
  };
})();
