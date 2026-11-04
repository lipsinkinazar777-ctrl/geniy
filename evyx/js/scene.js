import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

/* A draft becomes a finished shot: a wireframe landscape on one side,
   the same landscape fully rendered on the other, a soft light curtain
   between them and a thin vortex of data falling into the seam. */

const host = document.getElementById('scene');
if (host) init();

function init(){
  const gsap = window.gsap;
  let renderer;
  try{ renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'}); }
  catch(e){ document.documentElement.classList.add('no-gl'); return; }
  const mobile = innerWidth < 800;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile?1.3:1.6));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  host.appendChild(renderer.domElement);

  const BG = new THREE.Color(0x070605);
  const scene = new THREE.Scene();
  scene.background = BG;
  const camera = new THREE.PerspectiveCamera(36, innerWidth/innerHeight, .1, 120);

  const noise = `
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }`;

  const U = {uTime:{value:0}, uSeam:{value:1.5}};

  /* ---------- terrain ---------- */
  const terrainMat = new THREE.ShaderMaterial({
    uniforms:U, extensions:{derivatives:true},
    vertexShader:`${noise}
      uniform float uTime;varying vec3 vW;varying float vH;
      float hf(vec2 p){
        p.y+=uTime*.12;
        float h=snoise(vec3(p*.11,1.))*1.7+snoise(vec3(p*.27,4.))*.55+snoise(vec3(p*.7,9.))*.1;
        return h*.62;
      }
      void main(){
        vec3 p=position; float e=.06;
        float h0=hf(p.xz),hx=hf(p.xz+vec2(e,0.)),hz=hf(p.xz+vec2(0.,e));
        p.y=h0; vH=h0;
        vec4 w=modelMatrix*vec4(p,1.); vW=w.xyz;
        gl_Position=projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader:`
      uniform float uSeam;uniform float uTime;varying vec3 vW;varying float vH;
      void main(){
        vec3 dx=dFdx(vW),dy=dFdy(vW); vec3 n=normalize(cross(dx,dy));
        vec3 L=normalize(vec3(-.45,.65,.5));
        float d=max(dot(n,L),0.)*.85+.1;
        float hh=smoothstep(-.7,1.3,vH);
        vec3 low=vec3(.03,.026,.022),mid=vec3(.36,.27,.17),hi=vec3(.86,.76,.58);
        vec3 col=mix(low,mid,hh)*d + hi*pow(hh,3.)*d*.28;
        float dist=length(vW-cameraPosition);
        float fog=1.-exp(-dist*.05);
        vec3 fogC=vec3(.07,.06,.05);
        /* wireframe: fixed in space, so the surface appears to slide under it */
        vec2 q=vec2(vW.x,vW.z+uTime*.12)*2.6;
        vec2 g=abs(fract(q-.5)-.5); vec2 fw=fwidth(q);
        float line=1.-min(min(g.x/fw.x,g.y/fw.y),1.);
        vec3 wire=vec3(.84,.74,.56)*line*.3;
        float r=smoothstep(uSeam-.8,uSeam+.8,vW.x);
        vec3 draft=vec3(.012,.011,.01)+wire+vec3(.84,.74,.56)*line*.0;
        vec3 fin=col+wire*.07;
        vec3 c=mix(draft,fin,r);
        c+=vec3(.9,.78,.56)*exp(-abs(vW.x-uSeam)*2.4)*.11;
        c=mix(c,fogC,fog);
        gl_FragColor=vec4(c,1.);
      }`
  });
  const tg=new THREE.PlaneGeometry(50,46,mobile?160:300,mobile?150:260); tg.rotateX(-Math.PI/2); tg.translate(0,-.6,-14);
  const terrain=new THREE.Mesh(tg,terrainMat);

  /* ---------- light curtain at the seam ---------- */
  const curtainMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:U,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv;void main(){
      float v=pow(1.-vUv.y,1.6); float z=smoothstep(0.,.25,vUv.x)*(1.-smoothstep(.6,1.,vUv.x));
      float core=exp(-abs(vUv.y-.0)*30.);
      gl_FragColor=vec4(vec3(.9,.78,.56)*(v*.07+core*.14)*z,1.);}`});
  const curtain=new THREE.Mesh(new THREE.PlaneGeometry(26,5.5),curtainMat);
  curtain.rotation.y=Math.PI/2; curtain.position.set(1.5,2.7-.55,-10);

  /* ---------- vortex of data ---------- */
  const NV=mobile?900:2400,vp=new Float32Array(NV*3),vs=new Float32Array(NV);
  for(let i=0;i<NV;i++){vs[i]=Math.random();vp[i*3]=vp[i*3+1]=vp[i*3+2]=0}
  const vg=new THREE.BufferGeometry();vg.setAttribute('position',new THREE.BufferAttribute(vp,3));vg.setAttribute('s',new THREE.BufferAttribute(vs,1));
  const vortexMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{...U,uPx:{value:renderer.getPixelRatio()},uVis:{value:1}},
    vertexShader:`attribute float s;uniform float uTime;uniform float uSeam;uniform float uPx;varying float vA;
      void main(){
        float t=fract(uTime*.055+s*7.37); float a=s*6.2831+t*9.+uTime*.25;
        float rad=.1+2.3*pow(1.-t,1.25);
        vec3 p=vec3(uSeam+cos(a)*rad*1.2,.2+(1.-t)*4.2,-6.+sin(a)*rad*.9);
        vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=(1.1+s*1.8)*uPx*(9./-mv.z);
        vA=smoothstep(0.,.12,t)*(1.-smoothstep(.82,1.,t))*(.25+s*.5);}`,
    fragmentShader:`varying float vA;uniform float uVis;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.92,.82,.62,(1.-d*2.)*vA*uVis);}`});
  const vortex=new THREE.Points(vg,vortexMat);vortex.frustumCulled=false;

  /* faint ambient dust */
  const ND=mobile?200:500,dp=new Float32Array(ND*3);
  for(let i=0;i<ND;i++){dp[i*3]=(Math.random()-.5)*30;dp[i*3+1]=Math.random()*7;dp[i*3+2]=-Math.random()*30+4}
  const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
  const dust=new THREE.Points(dg,new THREE.PointsMaterial({color:0xd9c39a,size:.025,transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending}));

  scene.add(terrain,curtain,vortex,dust);

  /* post: very gentle */
  const composer=new EffectComposer(renderer);composer.setSize(innerWidth,innerHeight);
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.22,.7,.82);
  composer.addPass(bloom);composer.addPass(new OutputPass());

  /* ---------- state, driven by the page ---------- */
  const S={camX:0,camY:2.3,camZ:9,lookX:.8,lookY:.45,seam:1.5,vortex:1,op:1,bloom:.22};
  const VIEWS={
    home :{camX:0,camY:2.3,camZ:9,lookX:.8,lookY:.45,seam:1.5,vortex:1,op:1,bloom:.22},
    inner:{camX:0,camY:2.6,camZ:10.5,lookX:0,lookY:.3,seam:-9,vortex:.0,op:.38,bloom:.12}
  };
  window.EVYXScene={S,view(n,d=1.4){const v=VIEWS[n];v&&gsap.to(S,{...v,duration:d,ease:'power3.inOut',overwrite:'auto'})}};

  const mouse={x:0,y:0,tx:0,ty:0};
  addEventListener('pointermove',e=>{mouse.tx=(e.clientX/innerWidth)*2-1;mouse.ty=(e.clientY/innerHeight)*2-1});
  function layout(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
  addEventListener('resize',layout);layout();
  let visible=true;document.addEventListener('visibilitychange',()=>visible=!document.hidden);
  const clock=new THREE.Clock();

  function frame(){
    requestAnimationFrame(frame);
    if(!visible)return;
    const t=clock.getElapsedTime();
    mouse.x+=(mouse.tx-mouse.x)*.04;mouse.y+=(mouse.ty-mouse.y)*.04;
    U.uTime.value=t;U.uSeam.value=S.seam;
    curtain.position.x=S.seam;curtain.visible=S.vortex>.02||S.seam>-8;
    vortexMat.uniforms.uVis.value=S.vortex;vortex.visible=S.vortex>.02;
    const narrow=innerWidth<900;
    camera.position.set(S.camX+mouse.x*.35+Math.sin(t*.12)*.25,S.camY-mouse.y*.15+Math.sin(t*.1)*.06,S.camZ+(narrow?2.5:0));
    camera.lookAt(S.lookX+(narrow?-.8:0),S.lookY,-3);
    dust.position.y=Math.sin(t*.1)*.1;
    bloom.strength=S.bloom;
    host.style.opacity=S.op;
    composer.render();
  }
  frame();
  document.documentElement.classList.add('gl');
  window.dispatchEvent(new Event('evyx-scene-ready'));
}
