from PIL import Image; import os
A=os.path.join(os.path.dirname(__file__),'..','assets')
for n in ['mug','metal','magnet','key','photo']:
    p=os.path.join(A,f'_cut-{n}.png'); im=Image.open(p).convert('RGBA'); a=im.getchannel('A').point(lambda v:255 if v>8 else 0); b=a.getbbox(); im=im.crop(b)
    im.thumbnail((520,520),Image.LANCZOS); im.save(os.path.join(A,f'cut-{n}.webp'),quality=90,method=5); os.remove(p); print(n,im.size)
