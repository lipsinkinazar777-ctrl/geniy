import segno,os,sys,cairosvg,zxingcpp,cv2,numpy as np
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from PIL import Image
URL="https://broken-meadow-33c8.nestefol7.workers.dev/?lang=en#carte"
TABLE=sys.argv[2] if len(sys.argv)>2 else "01"
OUT=sys.argv[1]; os.makedirs(OUT,exist_ok=True)
F={}
def font(n):
    if n not in F:
        t=TTFont(f'/usr/share/fonts/opentype/inter/{n}.otf'); F[n]=(t,t.getGlyphSet(),t.getBestCmap(),t['head'].unitsPerEm,t['OS/2'].sCapHeight)
    return F[n]
def tp(txt,x,base,cap,fn='Inter-Bold',track=0.0,anchor='middle'):
    t,gs,cm,upm,capH=font(fn); s=cap/capH; items=[];cx=0
    for ch in txt:
        g=cm[ord(ch)]; items.append((g,cx)); cx+=gs[g].width+track*upm
    total=(cx-track*upm)*s; x0={'middle':x-total/2,'start':x,'end':x-total}[anchor]; d=[]
    for g,ox in items:
        pen=SVGPathPen(gs,ntos=lambda v:f"{v:.3f}"); gs[g].draw(TransformPen(pen,(s,0,0,-s,x0+ox*s,base))); d.append(pen.getCommands())
    return f'<path d="{" ".join(d)}"/>'
qr=segno.make(URL,error='q',boost_error=False,micro=False); N=qr.symbol_size(border=0)[0]; mat=[list(r) for r in qr.matrix]
def modules(x,y,size):
    m=size/N; return '<path d="'+''.join(f"M{x+j*m:.3f} {y+i*m:.3f}h{m:.3f}v{m:.3f}h{-m:.3f}z" for i,r in enumerate(mat) for j,v in enumerate(r) if v)+'"/>'
def line(x,y1,y2): return f'<rect x="{x-.2}" y="{y1}" width=".4" height="{y2-y1}"/>'
def plate(W,H,body,kind='eng',guide=''):
    cut=f'<rect x="0" y="0" width="{W}" height="{H}" rx="3" fill="none" stroke="#f00" stroke-width=".1"/>'
    return W,H,body,cut,guide
# --- layout 1: logo zone | QR | TABLE
W1,H1=110,60; QS=38
b1=(tp("Notre menu",58,8.6,3.6,'Inter-Medium',0.04)+modules(39,12,QS)+tp("Scannez-moi",58,56,3.0,'Inter-Medium',0.04)
    +line(35,9,51)+line(80,9,51)+tp("TABLE",95,23.5,3.6,'Inter-Bold',0.18)+tp(TABLE,95,42,11.5,'Inter-Bold',0.02))
g1=f'<rect x="4" y="9" width="27" height="42" fill="none" stroke="#08f" stroke-width=".15" stroke-dasharray="1 1"/><text x="17.5" y="31" font-size="4" font-family="Inter" fill="#08f" text-anchor="middle">LOGO</text>'
# --- layout 2: no logo
W2,H2=100,60
b2=(tp("Notre menu",30,8.6,3.6,'Inter-Medium',0.04)+modules(11,12,QS)+tp("Scannez-moi",30,56,3.0,'Inter-Medium',0.04)
    +line(58,9,51)+tp("TABLE",79,23.5,3.6,'Inter-Bold',0.18)+tp(TABLE,79,42,11.5,'Inter-Bold',0.02))
L={'1_avec-zone-logo':(W1,H1,b1,g1),'2_sans-logo':(W2,H2,b2,'')}
BG={'or':('#d9a441','#c28a2c'),'argent':('#d2d5da','#b3b7bd')}
for k,(W,H,b,g) in L.items():
    cut=f'<rect x="0" y="0" width="{W}" height="{H}" rx="3" fill="none" stroke="#f00" stroke-width=".1"/>'
    svg=lambda inner:f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">{inner}</svg>'
    eng=f'<g id="engrave" fill="#000">{b}</g>'
    open(f'{OUT}/{k}_gravure.svg','w').write(svg(eng))
    open(f'{OUT}/{k}_avec-ligne-de-coupe.svg','w').write(svg(cut+eng))
    cairosvg.svg2pdf(bytestring=svg(eng).encode(),write_to=f'{OUT}/{k}_gravure.pdf')
    cairosvg.svg2png(bytestring=svg(eng).encode(),write_to=f'{OUT}/{k}_6000px_transparent.png',output_width=6000)
    for bn,(c1,c2) in BG.items():
        pv=svg(f'<defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset=".5" stop-color="{c2}"/><stop offset="1" stop-color="{c1}"/></linearGradient></defs><rect width="{W}" height="{H}" rx="3" fill="url(#m)"/>{eng}{g}')
        cairosvg.svg2png(bytestring=pv.encode(),write_to=f'{OUT}/apercu_{k}_{bn}.png',output_width=1400)
        im=cv2.imread(f'{OUT}/apercu_{k}_{bn}.png',0); r=zxingcpp.read_barcodes(im)
        print(k,bn,'decode',bool(r) and r[0].text==URL)
