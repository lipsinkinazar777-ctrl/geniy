import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const host = document.getElementById('scene');
if (host) init();

function init(){
  const gsap = window.gsap;
  let renderer;
  try{ renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'}); }
  catch(e){ document.documentElement.classList.add('no-gl'); return; }
  const mobile = innerWidth < 800;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile?1.4:1.8));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .85;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030304, .05);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture;

  const camera = new THREE.PerspectiveCamera(36, innerWidth/innerHeight, .1, 120);

  /* ---------- materials ---------- */
  const GOLD = new THREE.Color(0xd4af37);
  const goldMat = new THREE.MeshStandardMaterial({color:GOLD, metalness:1, roughness:.26, envMapIntensity:1.8});
  const blackMat = new THREE.MeshPhysicalMaterial({color:0x0c0c0d, metalness:.65, roughness:.16, clearcoat:1, clearcoatRoughness:.06, envMapIntensity:1.1});
  const glowMat = (k)=>new THREE.MeshBasicMaterial({color:new THREE.Color(0xe5c158).multiplyScalar(k), toneMapped:false});

  /* ---------- mannequin ---------- */
  const mk = (geo,mat)=>{const m=new THREE.Mesh(geo,mat);return m};
  const cap = (r,l,mat=blackMat)=>mk(new THREE.CapsuleGeometry(r,l,10,24),mat);
  const sph = (r,mat=blackMat)=>mk(new THREE.SphereGeometry(r,32,24),mat);

  const man = new THREE.Group();       // placement + facing
  const hips = new THREE.Group();      // walk bob
  hips.position.y = 1.0;
  man.add(hips);

  const pelvis = sph(.17); pelvis.scale.set(1.2,.78,.9); hips.add(pelvis);
  const belt = mk(new THREE.TorusGeometry(.172,.011,12,64),goldMat); belt.rotation.x=Math.PI/2; belt.position.y=.07; belt.scale.set(1.18,.92,1); hips.add(belt);

  const torso = new THREE.Group(); torso.position.y=.08; hips.add(torso);
  const waist = mk(new THREE.CylinderGeometry(.115,.13,.2,32),blackMat); waist.position.y=.11; torso.add(waist);
  const chest = cap(.185,.2); chest.scale.set(1.18,1,.78); chest.position.y=.43; torso.add(chest);
  const plate = mk(new THREE.TorusGeometry(.19,.008,10,64),goldMat); plate.rotation.x=Math.PI/2; plate.position.y=.56; plate.scale.set(1.18,.78,1); torso.add(plate);
  const core = sph(.034,glowMat(3)); core.position.set(0,.47,.152); torso.add(core);
  const coreRing = mk(new THREE.TorusGeometry(.05,.006,8,32),goldMat); coreRing.position.set(0,.47,.15); torso.add(coreRing);
  const neck = mk(new THREE.CylinderGeometry(.04,.05,.1,20),goldMat); neck.position.y=.71; torso.add(neck);

  const head = new THREE.Group(); head.position.y=.87; torso.add(head);
  const skull = sph(.118); skull.scale.set(.92,1.14,1.02); head.add(skull);
  /* visor: a glowing arc across the front of the face (+z) */
  const visorPivot = new THREE.Group(); head.add(visorPivot);
  const visor = mk(new THREE.TorusGeometry(.12,.016,14,64,Math.PI*.9),glowMat(2.2));
  visor.rotation.x = Math.PI/2; visor.position.y = .012;
  visorPivot.rotation.y = -Math.PI*.05;
  visorPivot.add(visor);
  [-1,1].forEach(s=>{const ear=mk(new THREE.TorusGeometry(.038,.01,10,32),goldMat);ear.position.set(s*.108,0,0);ear.rotation.y=Math.PI/2;head.add(ear)});

  function arm(side){
    const sh = new THREE.Group(); sh.position.set(side*.245,.56,0); torso.add(sh);
    sh.add(sph(.052,goldMat));
    const up = cap(.045,.2); up.position.y=-.16; sh.add(up);
    const el = new THREE.Group(); el.position.y=-.33; sh.add(el);
    el.add(sph(.044,goldMat));
    const lo = cap(.039,.2); lo.position.y=-.15; el.add(lo);
    const hand = sph(.05); hand.scale.set(.8,1.15,.9); hand.position.y=-.33; el.add(hand);
    return {sh,el};
  }
  function leg(side){
    const hp = new THREE.Group(); hp.position.set(side*.1,-.02,0); hips.add(hp);
    hp.add(sph(.06,goldMat));
    const th = cap(.074,.28); th.position.y=-.23; hp.add(th);
    const kn = new THREE.Group(); kn.position.y=-.45; hp.add(kn);
    kn.add(sph(.055,goldMat));
    const sn = cap(.058,.28); sn.position.y=-.22; kn.add(sn);
    const an = new THREE.Group(); an.position.y=-.46; kn.add(an);
    const ring = mk(new THREE.TorusGeometry(.05,.008,10,32),goldMat); ring.rotation.x=Math.PI/2; an.add(ring);
    const foot = cap(.046,.14); foot.rotation.x=Math.PI/2; foot.scale.set(1.1,1,.8); foot.position.set(0,-.045,.075); an.add(foot);
    return {hp,kn,an};
  }
  const L = {arm:arm(-1), leg:leg(-1)}, R = {arm:arm(1), leg:leg(1)};
  man.scale.setScalar(.98);

  /* ---------- floor, rings, tunnel ---------- */
  const floor = mk(new THREE.PlaneGeometry(14,120), new THREE.MeshStandardMaterial({color:0x040405,metalness:.85,roughness:.4,envMapIntensity:.18}));
  floor.rotation.x=-Math.PI/2; floor.position.set(0,0,-30);

  const rings = new THREE.Group();
  [[1.15,.012,2.2],[1.65,.008,1.4],[2.3,.006,.9],[3.1,.005,.6]].forEach(([r,t,k],i)=>{
    const m=mk(new THREE.TorusGeometry(r,t,10,200),glowMat(k)); m.rotation.x=Math.PI/2; m.position.y=.012; m.userData.sp=(i%2?-1:1)*(.1+i*.04); rings.add(m);
  });
  // glow disc under feet
  const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');
  const gr=g.createRadialGradient(128,128,0,128,128,128);gr.addColorStop(0,'rgba(229,193,88,.26)');gr.addColorStop(.5,'rgba(212,175,55,.06)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,256,256);
  const disc=mk(new THREE.PlaneGeometry(6,6),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  disc.rotation.x=-Math.PI/2;disc.position.y=.02;

  const PERIOD = 7, COUNT = 12;
  const env = new THREE.Group();
  const archGeo = new THREE.TorusGeometry(3.6,.018,10,120,Math.PI);
  const stripGeo = new THREE.BoxGeometry(.05,.03,2.6);
  const ribGeo = new THREE.BoxGeometry(.02,3.6,.02);
  for(let i=-3;i<COUNT;i++){
    const z=-i*PERIOD;
    const a=mk(archGeo,glowMat(.95)); a.position.set(0,0,z); env.add(a);
    const a2=mk(new THREE.TorusGeometry(3.6,.006,8,120,Math.PI),glowMat(.5)); a2.position.set(0,0,z-PERIOD/2); a2.scale.setScalar(1.0); env.add(a2);
    [-1,1].forEach(s=>{
      const st=mk(stripGeo,glowMat(1.3)); st.position.set(s*2.3,.02,z-PERIOD*.25); env.add(st);
      const st2=mk(stripGeo,glowMat(.6)); st2.position.set(s*3.4,.02,z-PERIOD*.75); env.add(st2);
    });
  }

  /* dust */
  const N=mobile?600:1500,pos=new Float32Array(N*3),sz=new Float32Array(N);
  for(let i=0;i<N;i++){pos[i*3]=(Math.random()-.5)*14;pos[i*3+1]=Math.random()*6;pos[i*3+2]=-Math.random()*40+4;sz[i]=Math.random()}
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3));pg.setAttribute('s',new THREE.BufferAttribute(sz,1));
  const pmat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uT:{value:0},uPx:{value:renderer.getPixelRatio()},uOff:{value:0}},
    vertexShader:`attribute float s;uniform float uT;uniform float uPx;uniform float uOff;varying float vA;
      void main(){vec3 p=position;p.z=mod(p.z+uOff+4.,44.)-40.+4.;p.y+=sin(uT*.3+s*30.)*.15;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(1.2+s*2.4)*uPx*(7./-mv.z);vA=.2+s*.7;}`,
    fragmentShader:`varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.9,.72,.28,(1.-d*2.)*vA);}`});
  const dust=new THREE.Points(pg,pmat);

  /* hero title lives inside the scene, behind the walker */
  const tc=document.createElement('canvas');tc.width=2048;tc.height=560;
  const titleTex=new THREE.CanvasTexture(tc);titleTex.colorSpace=THREE.SRGBColorSpace;
  function drawTitle(){
    const x=tc.getContext('2d');x.clearRect(0,0,2048,560);
    const gr=x.createLinearGradient(0,0,0,560);gr.addColorStop(0,'#f3dc8b');gr.addColorStop(.5,'#d4af37');gr.addColorStop(1,'#7a5f1c');
    x.fillStyle=gr;x.textAlign='center';x.textBaseline='alphabetic';x.font='600 188px Unbounded, Arial Black, sans-serif';
    try{x.letterSpacing='-9px'}catch(e){}
    x.fillText('WE REMAKE',1024,215);x.fillText('ANY AI VIDEO',1024,440);titleTex.needsUpdate=true;
  }
  drawTitle();
  if(document.fonts&&document.fonts.load){document.fonts.load('600 188px Unbounded').then(drawTitle).catch(()=>{})}
  const titleMat=new THREE.MeshBasicMaterial({map:titleTex,transparent:true,depthWrite:false,toneMapped:false,fog:false,opacity:0});
  const title=mk(new THREE.PlaneGeometry(10.2,10.2*560/2048),titleMat);title.position.set(0,1.4,-5);title.renderOrder=-1;
  scene.add(title,floor,rings,disc,env,man,dust);

  /* lights */
  const key=new THREE.SpotLight(0xffe2a0,70,16,.5,.7,1.6);key.position.set(-2.5,4.2,4);key.target=hips;
  const rim=new THREE.PointLight(0xd4af37,22,14);rim.position.set(2.8,2.2,-2.5);
  const fill=new THREE.PointLight(0xfff2d6,3,12);fill.position.set(2.4,1.2,3.6);
  scene.add(key,key.target,rim,fill,new THREE.AmbientLight(0xffffff,.04));

  /* post */
  const composer=new EffectComposer(renderer);composer.setSize(innerWidth,innerHeight);
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.5,.55,.88);
  composer.addPass(bloom);composer.addPass(new OutputPass());

  /* ---------- state (tweened by the page) ---------- */
  const S={camX:0,camY:1.25,camZ:5.6,lookX:0,lookY:1.0,charX:0,charS:1,rotY:0,walk:1,bloom:.5,dust:1,op:1,run:0,title:0};
  const VIEWS={
    home :{camX:0,camY:1.25,camZ:5.6,lookX:0,lookY:1.0,charX:0,charS:1,walk:1,bloom:.5,dust:1,op:1,title:1},
    inner:{camX:-.6,camY:1.3,camZ:6.6,lookX:-1.5,lookY:1.0,charX:0,charS:.9,walk:.7,bloom:.4,dust:.7,op:.45,title:0}
  };
  window.EVYXScene={S,view(n,d=1.4){const v=VIEWS[n];v&&gsap.to(S,{...v,duration:d,ease:'power3.inOut',overwrite:'auto'})}};

  const mouse={x:0,y:0,tx:0,ty:0};
  addEventListener('pointermove',e=>{mouse.tx=(e.clientX/innerWidth)*2-1;mouse.ty=(e.clientY/innerHeight)*2-1});
  let vel=0,lastY=scrollY,phase=0,travel=0;
  function layout(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
  addEventListener('resize',layout);layout();
  let visible=true;document.addEventListener('visibilitychange',()=>visible=!document.hidden);
  const clock=new THREE.Clock();let prev=0;

  function frame(){
    requestAnimationFrame(frame);
    if(!visible)return;
    const t=clock.getElapsedTime(),dt=Math.min(t-prev,.05);prev=t;
    mouse.x+=(mouse.tx-mouse.x)*.05;mouse.y+=(mouse.ty-mouse.y)*.05;
    const dy=scrollY-lastY;lastY=scrollY;vel+=(dy-vel)*.08;
    const boost=Math.min(Math.abs(vel)*.012,2.2);

    /* walk cycle */
    phase+=dt*(3.2*S.walk+boost*2.2);
    const p=phase,s=Math.sin(p),c=Math.cos(p);
    const stride=.55+boost*.08;
    L.leg.hp.rotation.x=-s*stride;           R.leg.hp.rotation.x=s*stride;
    L.leg.kn.rotation.x=Math.max(0,c)*.95;   R.leg.kn.rotation.x=Math.max(0,-c)*.95;
    L.leg.an.rotation.x=-Math.max(0,c)*.25;  R.leg.an.rotation.x=-Math.max(0,-c)*.25;
    L.arm.sh.rotation.x=s*.5;                R.arm.sh.rotation.x=-s*.5;
    L.arm.el.rotation.x=-.3-Math.max(0,-s)*.45; R.arm.el.rotation.x=-.3-Math.max(0,s)*.45;
    L.arm.sh.rotation.z=.07;R.arm.sh.rotation.z=-.07;
    hips.position.y=1.0+Math.abs(c)*.035*S.walk-.02;
    hips.rotation.z=s*.035;hips.rotation.y=s*.1;
    torso.rotation.y=-s*.12;torso.rotation.z=-s*.02;
    head.rotation.y=mouse.x*.45-torso.rotation.y-hips.rotation.y;head.rotation.x=mouse.y*.2;
    core.scale.setScalar(1+Math.sin(t*3)*.25);

    man.position.set(S.charX,0,0);man.scale.setScalar(.98*S.charS);
    man.rotation.y=mouse.x*.3;

    /* treadmill: world slides away from the walker */
    travel+=dt*(1.9*S.walk+boost*5);
    env.position.z=(travel%PERIOD);
    pmat.uniforms.uOff.value=travel*1.0;
    rings.children.forEach(r=>r.rotation.z+=r.userData.sp*dt);
    rings.position.x=S.charX;disc.position.x=S.charX;

    camera.position.set(S.camX+mouse.x*.25,S.camY-mouse.y*.12,S.camZ);
    camera.lookAt(S.lookX,S.lookY,0);

    pmat.uniforms.uT.value=t;dust.visible=S.dust>.05;pmat.opacity=S.dust;titleMat.opacity=S.title;title.visible=S.title>.01;
    bloom.strength=S.bloom;
    host.style.opacity=S.op;
    key.position.x=-2.5+mouse.x*1.2;
    composer.render();
  }
  frame();
  document.documentElement.classList.add('gl');
  window.dispatchEvent(new Event('evyx-scene-ready'));
}
