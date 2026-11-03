import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const host = document.getElementById('scene');
if (host) init();

function init(){
  const gsap = window.gsap, ST = window.ScrollTrigger;
  let renderer;
  try{
    renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  }catch(e){ document.documentElement.classList.add('no-gl'); return; }
  const mobile = innerWidth < 800;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile?1.4:1.8));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(38, innerWidth/innerHeight, .1, 100);
  camera.position.set(0,0,9);

  /* ---- hero object: liquid-metal core ---- */
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
  const uni = {uTime:{value:0}, uAmp:{value:.28}, uFreq:{value:1.25}};
  const coreMat = new THREE.MeshPhysicalMaterial({
    color:0x141414, metalness:.85, roughness:.24, clearcoat:1, clearcoatRoughness:.05, envMapIntensity:1.5
  });
  coreMat.onBeforeCompile = (sh)=>{
    sh.uniforms.uTime = uni.uTime; sh.uniforms.uAmp = uni.uAmp; sh.uniforms.uFreq = uni.uFreq;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime;uniform float uAmp;uniform float uFreq;
        ${noise}
        vec3 disp(vec3 p){
          vec3 d=normalize(p);
          float n=snoise(d*uFreq+vec3(0.,uTime*.22,uTime*.11))*.62+snoise(d*uFreq*2.3-uTime*.15)*.22;
          return d*1.35*(1.+uAmp*n);
        }`)
      .replace('#include <beginnormal_vertex>', `
        vec3 nrm=normalize(normal);
        vec3 tA=normalize(cross(nrm,abs(nrm.y)>.99?vec3(1.,0.,0.):vec3(0.,1.,0.)));
        vec3 tB=normalize(cross(nrm,tA));
        vec3 p0=disp(position);
        vec3 p1=disp(position+tA*.02);
        vec3 p2=disp(position+tB*.02);
        vec3 objectNormal=normalize(cross(p1-p0,p2-p0));
        if(dot(objectNormal,nrm)<0.) objectNormal=-objectNormal;
        #ifdef USE_TANGENT
        vec3 objectTangent=vec3(tangent.xyz);
        #endif`)
      .replace('#include <begin_vertex>','vec3 transformed=disp(position);');
  };
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1, mobile?48:90), coreMat);

  /* neon rings */
  const yellow = new THREE.Color(0xffd60a);
  function ring(r, t, intensity, tiltX, tiltZ){
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 24, 220),
      new THREE.MeshBasicMaterial({color:yellow.clone().multiplyScalar(intensity*.75), toneMapped:false}));
    m.rotation.set(tiltX, 0, tiltZ); return m;
  }
  const r1 = ring(2.25, .018, 3.2, 1.15, .3);
  const r2 = ring(2.65, .008, 1.6, 1.9, -.5);
  const r3 = ring(1.85, .012, 2.0, .35, .9);
  const ringGroup = new THREE.Group(); ringGroup.add(r1,r2,r3);

  /* orbiting spark on main ring */
  const spark = new THREE.Mesh(new THREE.SphereGeometry(.055,16,16), new THREE.MeshBasicMaterial({color:new THREE.Color(0xffffff).multiplyScalar(4),toneMapped:false}));
  const sparkPivot = new THREE.Group(); sparkPivot.rotation.copy(r1.rotation); sparkPivot.add(spark); spark.position.set(2.25,0,0);

  /* particles */
  const N = mobile?700:1800, pos = new Float32Array(N*3), sz = new Float32Array(N);
  for(let i=0;i<N;i++){
    const r = 3+Math.random()*9, a = Math.random()*Math.PI*2, h=(Math.random()-.5)*9;
    pos[i*3]=Math.cos(a)*r; pos[i*3+1]=h; pos[i*3+2]=Math.sin(a)*r-3; sz[i]=Math.random();
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos,3));
  pg.setAttribute('s', new THREE.BufferAttribute(sz,1));
  const pmat = new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:{uT:{value:0}, uPx:{value:renderer.getPixelRatio()}},
    vertexShader:`attribute float s;uniform float uT;uniform float uPx;varying float vA;
      void main(){vec3 p=position;p.y+=sin(uT*.2+s*20.)*.35;p.x+=cos(uT*.15+s*10.)*.25;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=(1.2+s*2.6)*uPx*(8./-mv.z);vA=.25+s*.75;}`,
    fragmentShader:`varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;
      gl_FragColor=vec4(1.,.84,.2,(1.-d*2.)*vA);}`
  });
  const dust = new THREE.Points(pg, pmat);

  const obj = new THREE.Group();
  obj.add(core, ringGroup, sparkPivot);
  scene.add(obj, dust);

  /* lights */
  const key = new THREE.PointLight(0xfff2d0, 35, 20); key.position.set(-3,2.5,4);
  const rim = new THREE.PointLight(0xffd24a, 220, 20); rim.position.set(3.5,-1,-3);
  scene.add(key, rim, new THREE.AmbientLight(0xffffff,.05));

  /* post */
  const composer = new EffectComposer(renderer);
  composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .85, .6, .72);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---- state, driven by sections ---- */
  const S = {x:.55, y:0, s:1, rx:0, ry:0, ringS:1, ringSpeed:1, amp:.28, bloom:.85, op:1, camZ:9, dust:1};
  const STATES = {
    hero:    {x:.42, y:0,   s:1,    ringS:1,   ringSpeed:1,   amp:.26, bloom:.55, camZ:9,  dust:1},
    services:{x:.45, y:0,   s:.95,  ringS:.95,  ringSpeed:2.2, amp:.4,  bloom:.6,  camZ:9,  dust:1.2},
    show:    {x:0,   y:.0,  s:.3,   ringS:2.6,  ringSpeed:.6,  amp:.15, bloom:.3,  camZ:13, dust:.5},
    process: {x:-.2, y:-.1, s:.5,   ringS:1,    ringSpeed:1.4, amp:.2,  bloom:.3,  camZ:13, dust:.8},
    price:   {x:0,   y:.0,  s:.9,   ringS:1.15, ringSpeed:1.8, amp:.34, bloom:.55, camZ:11, dust:1.4},
    faq:     {x:.75, y:.0,  s:.45,  ringS:.9,   ringSpeed:1,   amp:.18, bloom:.3,  camZ:12, dust:.6},
    cta:     {x:0,   y:.25, s:1.0,  ringS:1.15, ringSpeed:1.1, amp:.45, bloom:.4,  camZ:11, dust:1.6},
    inner:   {x:.55, y:0,   s:.7,   ringS:1,    ringSpeed:1,   amp:.24, bloom:.4,  camZ:10, dust:.8}
  };
  function go(name, d=1.6){
    const t = STATES[name]; if(!t) return;
    gsap.to(S, {...t, duration:d, ease:'power3.out', overwrite:'auto'});
  }
  Object.assign(S, STATES[document.body.dataset.page==='home'?'hero':'inner']);
  window.EVYXScene = {go, S};

  if (ST){
    document.querySelectorAll('[data-scene]').forEach(el=>{
      ST.create({trigger:el, start:'top 55%', end:'bottom 45%',
        onEnter:()=>go(el.dataset.scene), onEnterBack:()=>go(el.dataset.scene)});
    });
  }

  /* pointer */
  const mouse = {x:0,y:0,tx:0,ty:0};
  addEventListener('pointermove', e=>{mouse.tx=(e.clientX/innerWidth)*2-1; mouse.ty=(e.clientY/innerHeight)*2-1;});

  /* scroll velocity kicks the object */
  let vel = 0, lastY = scrollY;

  function layout(){
    const w=innerWidth,h=innerHeight;
    renderer.setSize(w,h); composer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', layout);

  let visible = true;
  document.addEventListener('visibilitychange', ()=>visible=!document.hidden);
  const clock = new THREE.Clock();
  function frame(){
    requestAnimationFrame(frame);
    if(!visible) return;
    const t = clock.getElapsedTime(), dt = Math.min(clock.getDelta(),.05);
    mouse.x += (mouse.tx-mouse.x)*.06; mouse.y += (mouse.ty-mouse.y)*.06;
    const dy = scrollY-lastY; lastY = scrollY; vel += (dy-vel)*.1;

    const narrow = innerWidth<900;
    camera.position.z = S.camZ + (narrow?3:0);
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.position.z*camera.aspect;
    const px = narrow ? 0 : S.x*halfW;
    const py = narrow ? 1.7+S.y : S.y*2;
    obj.position.set(px, py, 0);
    const sc = S.s*(narrow?.7:1);
    obj.scale.setScalar(sc);
    obj.rotation.y = t*.12 + mouse.x*.5 + vel*.01;
    obj.rotation.x = mouse.y*.25 + Math.sin(t*.3)*.08;
    ringGroup.scale.setScalar(S.ringS);
    r1.rotation.z += .0035*S.ringSpeed + vel*.0004; r2.rotation.x += .0022*S.ringSpeed; r3.rotation.y -= .003*S.ringSpeed;
    sparkPivot.rotation.z += .02*S.ringSpeed; sparkPivot.scale.setScalar(S.ringS);
    uni.uTime.value = t; uni.uAmp.value = S.amp + Math.min(Math.abs(vel)*.004,.25);
    pmat.uniforms.uT.value = t; dust.rotation.y = t*.015 + mouse.x*.05; dust.visible = S.dust>.05;
    dust.material.opacity = S.dust;
    bloom.strength = S.bloom;
    key.position.x = -3 + mouse.x*2; key.position.y = 2.5 - mouse.y*2;
    composer.render();
  }
  frame();
  document.documentElement.classList.add('gl');
  window.dispatchEvent(new Event('evyx-scene-ready'));
}
