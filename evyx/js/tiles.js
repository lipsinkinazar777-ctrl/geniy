/* Живые заставки для видео-карточек. Если у видео задан src — играет реальный ролик. */
(function(){
const C = window.EVYX;
const W = 180, H = 320;
const rnd = (s)=>{let x=Math.sin(s*999)*10000;return x-Math.floor(x)};

const FX = {
  orb(g,t,k){
    g.fillStyle='#060606';g.fillRect(0,0,W,H);
    const x=W/2+Math.sin(t*.7+k)*28,y=H*.45+Math.cos(t*.5+k)*30;
    let r=g.createRadialGradient(x-14,y-18,2,x,y,70);
    r.addColorStop(0,'#fff8d8');r.addColorStop(.18,'#e5c158');r.addColorStop(.5,'#6b4a00');r.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=r;g.fillRect(0,0,W,H);
    g.strokeStyle='rgba(212,175,55,.35)';g.lineWidth=1;g.beginPath();g.ellipse(x,y,80+Math.sin(t)*6,22,t*.4,0,6.3);g.stroke();
  },
  streak(g,t,k){
    g.fillStyle='#050505';g.fillRect(0,0,W,H);
    for(let i=0;i<26;i++){
      const sp=.6+rnd(i+k)*1.8,x=rnd(i*3+k)*W,y=((t*sp*60+rnd(i)*H*2)%(H*1.4))-H*.2,l=30+rnd(i*7)*90;
      const gr=g.createLinearGradient(0,y,0,y+l);gr.addColorStop(0,'rgba(212,175,55,0)');gr.addColorStop(1,i%5?'rgba(212,175,55,.8)':'rgba(255,255,255,.9)');
      g.fillStyle=gr;g.fillRect(x,y,1.2,l);
    }
  },
  mist(g,t,k){
    g.fillStyle='#070707';g.fillRect(0,0,W,H);
    for(let i=0;i<7;i++){
      const x=W*(.5+Math.sin(t*.25+i*1.7+k)*.45),y=H*(.3+i*.1+Math.cos(t*.2+i)*.05),r=60+i*9;
      const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,i%2?'rgba(212,175,55,.22)':'rgba(255,255,255,.14)');gr.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=gr;g.fillRect(0,0,W,H);
    }
    g.fillStyle='rgba(212,175,55,.9)';g.fillRect(W/2-8,H*.5-26+Math.sin(t)*2,16,46);
    g.fillStyle='rgba(255,255,255,.5)';g.fillRect(W/2-8,H*.5-26+Math.sin(t)*2,3,46);
  },
  wave(g,t,k){
    g.fillStyle='#050505';g.fillRect(0,0,W,H);
    for(let i=0;i<30;i++){
      g.beginPath();g.strokeStyle=`rgba(212,175,55,${.1+i/40})`;g.lineWidth=.8;
      for(let x=0;x<=W;x+=4){const y=H*.55+i*3.5-60+Math.sin(x*.035+t*1.1+i*.22+k)*(10+i*.9);x?g.lineTo(x,y):g.moveTo(x,y)}
      g.stroke();
    }
  },
  rain(g,t,k){
    g.fillStyle='#040404';g.fillRect(0,0,W,H);
    const hg=g.createRadialGradient(W/2,H*.72,0,W/2,H*.72,130);hg.addColorStop(0,'rgba(212,175,55,.45)');hg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=hg;g.fillRect(0,0,W,H);
    g.strokeStyle='rgba(255,255,255,.5)';
    for(let i=0;i<70;i++){const x=rnd(i+k)*W,y=((t*260*(.6+rnd(i*2))+rnd(i*5)*H)%(H+30))-15;g.globalAlpha=.15+rnd(i*9)*.5;g.beginPath();g.moveTo(x,y);g.lineTo(x-2,y+12);g.stroke()}
    g.globalAlpha=1;g.fillStyle='#000';g.fillRect(0,H*.72,W,H);
    g.fillStyle='rgba(212,175,55,.8)';g.fillRect(W*.3+Math.sin(t)*8,H*.7,26,3);g.fillRect(W*.3+Math.sin(t)*8+34,H*.7,26,3);
  },
  ring(g,t,k){
    g.fillStyle='#050505';g.fillRect(0,0,W,H);
    g.save();g.translate(W/2,H*.5);
    for(let i=0;i<4;i++){g.save();g.rotate(t*.3*(i%2?-1:1)+i);g.scale(1,.34+i*.06);g.strokeStyle=`rgba(212,175,55,${.9-i*.2})`;g.lineWidth=2-i*.3;g.shadowColor='#e5c158';g.shadowBlur=14;g.beginPath();g.arc(0,0,38+i*17,0,6.3);g.stroke();g.restore()}
    g.fillStyle='#fff';g.shadowBlur=20;g.beginPath();g.arc(Math.cos(t*2)*38,Math.sin(t*2)*13,2.6,0,6.3);g.fill();
    g.restore();
  },
  grid(g,t,k){
    g.fillStyle='#050505';g.fillRect(0,0,W,H);
    const hz=H*.42;
    g.strokeStyle='rgba(212,175,55,.55)';g.lineWidth=.8;
    for(let i=-12;i<=12;i++){g.beginPath();g.moveTo(W/2+i*6,hz);g.lineTo(W/2+i*38,H);g.stroke()}
    for(let i=0;i<14;i++){const z=((i+t*.6)%14)/14,y=hz+(H-hz)*z*z;g.globalAlpha=z;g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
    g.globalAlpha=1;
    const gr=g.createLinearGradient(0,hz-70,0,hz);gr.addColorStop(0,'rgba(212,175,55,0)');gr.addColorStop(1,'rgba(212,175,55,.4)');g.fillStyle=gr;g.fillRect(0,hz-70,W,70);
  }
};

const live = new Set();
const io = new IntersectionObserver(es=>es.forEach(e=>{e.isIntersecting?live.add(e.target):live.delete(e.target)}),{rootMargin:'200px'});
let t0 = performance.now();
(function loop(){
  requestAnimationFrame(loop);
  const t=(performance.now()-t0)/1000;
  live.forEach(c=>{ if(c._fx) c._fx(c._g,t,c._k); });
})();

window.EVYXTile = function(v,i,opts={}){
  const el=document.createElement(opts.static?'div':'button');
  el.className='card pop';el.dataset.cat=v.cat;
  if(!opts.static){el.type='button';el.setAttribute('aria-label','Open '+v.title)}
  el.dataset.cursor='play';
  if(v.src){
    const vid=document.createElement('video');vid.src=v.src;vid.muted=true;vid.loop=true;vid.playsInline=true;vid.preload='none';
    el.appendChild(vid);
    el.addEventListener('mouseenter',()=>vid.play().catch(()=>{}));
    el.addEventListener('mouseleave',()=>{vid.pause();vid.currentTime=0});
    if(opts.autoplay){vid.autoplay=true;vid.play().catch(()=>{})}
  }else{
    const c=document.createElement('canvas');c.width=W;c.height=H;
    c._g=c.getContext('2d');c._fx=FX[v.fx]||FX.orb;c._k=i*1.3;
    el.appendChild(c);io.observe(c);
  }
  el.insertAdjacentHTML('beforeend',`<span class="rec">REC</span><span class="len">${v.len}</span><span class="tag">${v.cat}</span><div class="meta"><b>${v.title}</b></div>`);
  return el;
};
})();
