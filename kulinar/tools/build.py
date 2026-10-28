#!/usr/bin/env python3
"""Собирает kulinar/index.html из исходников в kulinar/src.

  python3 kulinar/tools/build.py                 # один самодостаточный файл: фото вшиты (data-URI)
  python3 kulinar/tools/build.py --budget 12     # лимит веса вшитых фото, МБ (по умолчанию 12; нужен Pillow для пережатия)
  python3 kulinar/tools/build.py --external      # фото не вшиваются, а лежат рядом в kulinar/img/

Порядок сборки: 00-head-open.html -> style*.css -> 90-head-close.html -> js/*.js (по имени)
-> const PHOTOS (перед js с префиксом 30) -> закрывающие теги.
Имя файла фото без расширения = id рецепта (carbonara.webp) или прибора (gear-airfryer.webp).
"""
import argparse
import base64
import glob
import io
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
MIME = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp'}

try:
    from PIL import Image  # type: ignore
except Exception:
    Image = None


def rd(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def image_files():
    out = []
    for p in sorted(glob.glob(os.path.join(SRC, 'img', '*'))):
        ext = os.path.splitext(p)[1].lower()
        if ext in MIME:
            out.append((os.path.splitext(os.path.basename(p))[0], p, ext))
    return out


def recompress(path, width, quality):
    im = Image.open(path).convert('RGB')
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=quality, method=4)
    return buf.getvalue()


def photos_js(external, budget_mb):
    files = image_files()
    if external:
        dst = os.path.join(ROOT, 'img')
        os.makedirs(dst, exist_ok=True)
        items = []
        for key, p, ext in files:
            shutil.copy(p, os.path.join(dst, key + ext))
            items.append('"%s":"img/%s%s"' % (key, key, ext))
        print('photos: %d файлов -> kulinar/img/ (внешние)' % len(items), file=sys.stderr)
        return '/* ===== ФОТО (внешние файлы) ===== */\nconst PHOTOS={%s};\n' % ',\n'.join(items)
    blobs = {}
    for key, p, ext in files:
        with open(p, 'rb') as f:
            blobs[key] = (f.read(), MIME[ext])
    total = sum(len(b) * 4 / 3 for b, _ in blobs.values())
    budget = budget_mb * 1024 * 1024
    if total > budget:
        if Image:
            for width, quality in [(640, 70), (560, 66), (480, 62), (420, 58), (360, 54)]:
                for key, p, ext in files:
                    blobs[key] = (recompress(p, width, quality), 'image/webp')
                total = sum(len(b) * 4 / 3 for b, _ in blobs.values())
                print('пережатие %dpx q%d -> %.1f МБ' % (width, quality, total / 1048576), file=sys.stderr)
                if total <= budget:
                    break
        else:
            print('ВНИМАНИЕ: фото весят %.1f МБ при бюджете %d МБ; установите Pillow или используйте --external' % (total / 1048576, budget_mb), file=sys.stderr)
    items = ['"%s":"data:%s;base64,%s"' % (k, m, base64.b64encode(b).decode()) for k, (b, m) in blobs.items()]
    print('photos: %d файлов, %.1f МБ в base64' % (len(items), total / 1048576), file=sys.stderr)
    return '/* ===== ФОТО (вшиты) ===== */\nconst PHOTOS={%s};\n' % ',\n'.join(items)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--external', action='store_true')
    ap.add_argument('--budget', type=float, default=12)
    a = ap.parse_args()
    out = [rd(os.path.join(SRC, '00-head-open.html'))]
    for css in sorted(glob.glob(os.path.join(SRC, 'style*.css'))):
        out.append(rd(css))
        out.append('\n')
    out.append(rd(os.path.join(SRC, '90-head-close.html')))
    js_files = sorted(glob.glob(os.path.join(SRC, 'js', '*.js')))
    first_app = next((i for i, p in enumerate(js_files) if os.path.basename(p) >= '30'), len(js_files))
    for i, p in enumerate(js_files):
        if i == first_app:
            out.append(photos_js(a.external, a.budget))
        code = rd(p)
        # защита: ни один встроенный скрипт не должен закрывать тег <script> раньше времени
        code = re.sub(r'</(script)', r'<\\/\1', code, flags=re.I)
        out.append(code)
        out.append('\n')
    out.append('</script></body></html>\n')
    html = ''.join(out)
    dst = os.path.join(ROOT, 'index.html')
    with open(dst, 'w', encoding='utf-8') as f:
        f.write(html)
    print('index.html: %.1f КБ' % (len(html.encode('utf-8')) / 1024), file=sys.stderr)


if __name__ == '__main__':
    main()
