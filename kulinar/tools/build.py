#!/usr/bin/env python3
"""Собирает kulinar/index.html из исходников в kulinar/src.

  python3 kulinar/tools/build.py

Порядок: 00-head-open.html -> style*.css -> 90-head-close.html -> js/*.js (по имени)
-> фото из src/img (вшиваются как data-URI в const PHOTOS) -> закрывающие теги.
Имя файла фото без расширения = id рецепта (например carbonara.jpg) или id прибора (gear-airfryer.jpg).
"""
import base64
import glob
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
MIME = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp'}


def rd(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def photos_js():
    items = []
    total = 0
    for p in sorted(glob.glob(os.path.join(SRC, 'img', '*'))):
        ext = os.path.splitext(p)[1].lower()
        if ext not in MIME:
            continue
        key = os.path.splitext(os.path.basename(p))[0]
        with open(p, 'rb') as f:
            raw = f.read()
        total += len(raw)
        items.append('"%s":"data:%s;base64,%s"' % (key, MIME[ext], base64.b64encode(raw).decode()))
    print('photos: %d files, %.1f KB' % (len(items), total / 1024), file=sys.stderr)
    return '/* ===== ФОТО (вшиты) ===== */\nconst PHOTOS={%s};\n' % ',\n'.join(items)


def main():
    out = [rd(os.path.join(SRC, '00-head-open.html'))]
    for css in sorted(glob.glob(os.path.join(SRC, 'style*.css'))):
        out.append(rd(css))
        out.append('\n')
    out.append(rd(os.path.join(SRC, '90-head-close.html')))
    js_files = sorted(glob.glob(os.path.join(SRC, 'js', '*.js')))
    first_app = next((i for i, p in enumerate(js_files) if os.path.basename(p) >= '30'), len(js_files))
    for i, p in enumerate(js_files):
        if i == first_app:
            out.append(photos_js())
        out.append(rd(p))
        out.append('\n')
    out.append('</script></body></html>\n')
    html = ''.join(out)
    dst = os.path.join(ROOT, 'index.html')
    with open(dst, 'w', encoding='utf-8') as f:
        f.write(html)
    print('index.html: %.1f KB' % (len(html.encode('utf-8')) / 1024), file=sys.stderr)


if __name__ == '__main__':
    main()
