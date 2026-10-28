#!/usr/bin/env python3
"""Скачивает фотографии блюд, приборов, ножей и баночек для приложения «Гений кухни».

Запуск (нужен интернет; Python 3.8+; Pillow по желанию — на macOS есть встроенный sips):

    python3 kulinar/tools/fetch_photos.py            # докачать всё, чего ещё нет
    python3 kulinar/tools/fetch_photos.py --only carbonara,olivie
    python3 kulinar/tools/fetch_photos.py --redo     # заново скачать всё
    python3 kulinar/tools/fetch_photos.py --sheet    # + контактные листы для просмотра (нужен Pillow)
    python3 kulinar/tools/fetch_photos.py --build    # + пересобрать index.html

Источники по порядку:
  1. Википедия (REST summary по точному названию статьи из карты WP)       — свободные лицензии
  2. TheMealDB (поиск по английскому названию, строгая проверка совпадения)
  3. Википедия: поиск по английскому названию (PQ), проверка заголовка
  4. Wikimedia Commons: поиск файла, jpeg не меньше 800×500

Результат: kulinar/src/img/<id>.webp (или .jpg), kulinar/src/img/ATTRIBUTION.tsv и
kulinar/src/js/23-photo-credits.js (источники/лицензии для раздела «Источники фото»).
Файлы, уже лежащие в src/img (например, ваши собственные фото), не перезаписываются без --redo.
"""
import argparse
import glob
import html
import io
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
IMG = os.path.join(SRC, 'img')
WORK = os.path.join(ROOT, 'tools', '_work')
UA = 'GeniyKukhni/1.0 (personal recipe app; contact: owner of the repository)'
STOP = {'the', 'and', 'with', 'alla', 'al', 'di', 'de', 'la', 'style', 'homemade', 'classic', 'recipe', 'in', 'of'}

try:
    from PIL import Image  # type: ignore
except Exception:  # Pillow не установлен
    Image = None


# ---------- разбор исходников приложения ----------
def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def js_sources():
    return {os.path.basename(p): read(p) for p in sorted(glob.glob(os.path.join(SRC, 'js', '*.js')))}


def parse_targets():
    """Возвращает dict id -> {'name', 'wp', 'pq'} для рецептов, приборов, ножей и хранения."""
    js = js_sources()
    allsrc = '\n'.join(js.values())
    names = {}
    for m in re.finditer(r"\bR\('([a-z0-9-]+)','([^']+)'", allsrc):
        names[m.group(1)] = m.group(2)
    wp = {}
    m = re.search(r"const WP=\{(.*?)\};", allsrc, re.S)
    if m:
        for k, v in re.findall(r"'?([a-z0-9-]+)'?:'([^']+)'", m.group(1)):
            wp[k] = v
    pq = {}
    m = re.search(r"const PQ=Object\.fromEntries\(`(.*?)`", allsrc, re.S)
    if m:
        for line in m.group(1).strip().splitlines():
            if '=' in line:
                k, v = line.split('=', 1)
                pq[k.strip()] = v.strip()
    targets = {}
    for i, n in names.items():
        targets[i] = {'name': n, 'wp': wp.get(i), 'pq': pq.get(i)}
    # приборы: G('id','Название','группа',prio,price,'эмодзи','WikiTitle',
    for m in re.finditer(r"\bG\('([a-z0-9-]+)','([^']+)','[a-z]+',\d,\d,'[^']*','([^']*)'", allsrc):
        gid, name, w = m.groups()
        targets['gear-' + gid] = {'name': name, 'wp': w or None, 'pq': urllib.parse.unquote(w).replace('_', ' ') if w else name}
    # ножи: ['chef','Название','длина','эмодзи','WikiTitle',
    kn = js.get('55-knives-storage.js', '')
    for m in re.finditer(r"\['([a-z]+)','([^']+)','[^']*','[^']*','([^']+)',", kn.split('const STEELS')[0]):
        targets['knife-' + m.group(1)] = {'name': m.group(2), 'wp': m.group(3), 'pq': urllib.parse.unquote(m.group(3)).replace('_', ' ')}
    # хранение: ['jars','Название','эмодзи','WikiTitle',
    st = kn.split('const STORAGE=')[-1].split('STORAGE.forEach')[0]
    for m in re.finditer(r"\['([a-z]+)','([^']+)','[^']*','([^']+)',", st):
        targets['store-' + m.group(1)] = {'name': m.group(2), 'wp': m.group(3), 'pq': urllib.parse.unquote(m.group(3)).replace('_', ' ')}
    return targets


# ---------- сеть ----------
def http_get(url, binary=False, timeout=30, tries=3):
    last = None
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*'})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                data = r.read()
            return data if binary else data.decode('utf-8', 'replace')
        except urllib.error.HTTPError as e:
            if e.code in (404, 400):
                return None
            last = e
        except Exception as e:  # noqa: BLE001
            last = e
        time.sleep(1.5 * (k + 1))
    print('   ! сеть:', last, file=sys.stderr)
    return None


def get_json(url):
    t = http_get(url)
    if not t:
        return None
    try:
        return json.loads(t)
    except Exception:  # noqa: BLE001
        return None


def tok(s):
    return [w for w in re.sub(r'[^a-z0-9 ]', ' ', s.lower()).split() if len(w) > 2 and w not in STOP]


def overlap(q, title):
    qt, tt = tok(q), set(tok(title))
    return (sum(1 for w in qt if w in tt) / len(qt)) if qt else 0


def bad_image_url(u):
    return not u or re.search(r'\.(svg|gif|tif|tiff|ogg|webm|pdf)(\?|$)', u, re.I)


def strip_tags(s):
    """Только простой текст: теги убираются ДО и ПОСЛЕ раскодировки сущностей, служебные символы вырезаются."""
    t = re.sub(r'<[^>]*>', '', s or '')
    t = html.unescape(t)
    t = re.sub(r'<[^>]*>', '', t)
    t = re.sub(r'[<>&\u2028\u2029\x00-\x1f]', ' ', t)
    return re.sub(r'\s+', ' ', t).strip()[:160]


def safe_url(u):
    """Принимаем только http(s)-ссылки без символов, способных выйти из кавычек/тегов."""
    u = (u or '').strip()
    return u if re.match(r'^https?://[^\s<>"\'`\\]+$', u) else ''


# ---------- поиск изображений ----------
def from_wikipedia_summary(title):
    j = get_json('https://en.wikipedia.org/api/rest_v1/page/summary/' + urllib.parse.quote(title, safe='%_()'))
    if not j or j.get('type') == 'disambiguation':
        return None
    img = (j.get('originalimage') or {}).get('source') or (j.get('thumbnail') or {}).get('source')
    if bad_image_url(img):
        return None
    w = (j.get('originalimage') or {}).get('width', 0)
    if w and w > 1280:  # берём уменьшенную копию, а не оригинал на 6000 px
        th = (j.get('thumbnail') or {}).get('source')
        if th:
            img = re.sub(r'/(\d+)px-', '/1280px-', th)
    page = safe_url(((j.get('content_urls') or {}).get('desktop') or {}).get('page', ''))
    return {'url': img, 'source': 'Wikipedia', 'page': page, 'author': 'см. страницу файла', 'license': 'CC / Public domain (Wikimedia)'}


def from_mealdb(q):
    j = get_json('https://www.themealdb.com/api/json/v1/1/search.php?s=' + urllib.parse.quote(q))
    for m in (j or {}).get('meals') or []:
        if overlap(q, m.get('strMeal', '')) >= 0.75 and m.get('strMealThumb'):
            return {'url': m['strMealThumb'], 'source': 'TheMealDB', 'page': 'https://www.themealdb.com/meal/' + str(m.get('idMeal')),
                    'author': 'TheMealDB', 'license': 'TheMealDB (личное, некоммерческое использование)'}
    return None


def from_wikipedia_search(q):
    url = ('https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrlimit=4&prop=pageimages'
           '&piprop=thumbnail&pithumbsize=1000&gsrsearch=' + urllib.parse.quote(q))
    j = get_json(url)
    pages = sorted(((j or {}).get('query') or {}).get('pages', {}).values(), key=lambda p: p.get('index', 99))
    for p in pages:
        th = (p.get('thumbnail') or {}).get('source')
        if th and not bad_image_url(th) and overlap(q, p.get('title', '')) >= 0.66:
            return {'url': th, 'source': 'Wikipedia', 'page': 'https://en.wikipedia.org/wiki/' + urllib.parse.quote(p['title'].replace(' ', '_')),
                    'author': 'см. страницу статьи', 'license': 'CC / Public domain (Wikimedia)'}
    return None


def from_commons(q):
    url = ('https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=6'
           '&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1000&gsrsearch=' + urllib.parse.quote(q + ' filetype:bitmap'))
    j = get_json(url)
    pages = sorted(((j or {}).get('query') or {}).get('pages', {}).values(), key=lambda p: p.get('index', 99))
    for p in pages:
        ii = (p.get('imageinfo') or [{}])[0]
        if ii.get('mime') != 'image/jpeg' or ii.get('width', 0) < 800 or ii.get('height', 0) < 500:
            continue
        if overlap(q, p.get('title', '')) < 0.5:
            continue
        meta = ii.get('extmetadata') or {}
        return {'url': ii.get('thumburl') or ii.get('url'), 'source': 'Wikimedia Commons', 'page': ii.get('descriptionurl', ''),
                'author': strip_tags((meta.get('Artist') or {}).get('value')) or 'неизвестен',
                'license': strip_tags((meta.get('LicenseShortName') or {}).get('value')) or 'CC'}
    return None


def find_image(t):
    if t.get('wp'):
        r = from_wikipedia_summary(t['wp'])
        if r:
            return r
    q = t.get('pq') or t['name']
    for fn in (from_mealdb, from_wikipedia_search, from_commons):
        r = fn(q)
        if r:
            return r
        time.sleep(0.15)
    return None


# ---------- обработка изображений ----------
def save_image(raw, dst_base, maxw=720, quality=76):
    """Сохраняет в WebP (Pillow) или JPEG (sips); возвращает путь или None."""
    os.makedirs(IMG, exist_ok=True)
    if Image:
        try:
            im = Image.open(io.BytesIO(raw)).convert('RGB')
            if im.width < 400 or im.height < 280:
                return None
            if im.width > maxw:
                im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
            path = dst_base + '.webp'
            im.save(path, 'WEBP', quality=quality, method=6)
            return path
        except Exception as e:  # noqa: BLE001
            print('   ! обработка:', e, file=sys.stderr)
            return None
    os.makedirs(WORK, exist_ok=True)
    tmp = os.path.join(WORK, 'dl.bin')
    with open(tmp, 'wb') as f:
        f.write(raw)
    path = dst_base + '.jpg'
    if shutil.which('sips'):
        r = subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', str(quality), '-Z', str(maxw), tmp, '--out', path],
                           capture_output=True)
        return path if r.returncode == 0 and os.path.exists(path) else None
    shutil.copy(tmp, path)  # без обработки
    return path


def existing(i):
    for ext in ('webp', 'jpg', 'jpeg', 'png'):
        if os.path.exists(os.path.join(IMG, i + '.' + ext)):
            return True
    return False


def write_credits(rows):
    os.makedirs(IMG, exist_ok=True)
    with open(os.path.join(IMG, 'ATTRIBUTION.tsv'), 'w', encoding='utf-8') as f:
        f.write('id\tsource\tpage\tauthor\tlicense\n')
        for i, r in sorted(rows.items()):
            f.write('\t'.join([i, r['source'], r['page'], r['author'].replace('\t', ' '), r['license']]) + '\n')
    data = {i: [strip_tags(r['source']), safe_url(r['page']), strip_tags(r['author']), strip_tags(r['license'])] for i, r in sorted(rows.items())}
    # JSON внутри инлайн-скрипта: экранируем символы, которыми можно «выйти» из <script>
    js = json.dumps(data, ensure_ascii=False)
    js = js.replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    with open(os.path.join(SRC, 'js', '23-photo-credits.js'), 'w', encoding='utf-8') as f:
        f.write('/* Источники фото: создаётся скриптом tools/fetch_photos.py */\nconst PHOTO_CREDITS=' + js + ';\n')


def load_credits():
    rows = {}
    p = os.path.join(IMG, 'ATTRIBUTION.tsv')
    if os.path.exists(p):
        for line in read(p).splitlines()[1:]:
            c = line.split('\t')
            if len(c) >= 5:
                rows[c[0]] = {'source': c[1], 'page': c[2], 'author': c[3], 'license': c[4]}
    return rows


def contact_sheets():
    if not Image:
        print('Для контактных листов нужен Pillow: pip3 install pillow')
        return
    from PIL import ImageDraw  # type: ignore
    os.makedirs(WORK, exist_ok=True)
    files = sorted(f for f in glob.glob(os.path.join(IMG, '*')) if f.lower().endswith(('.webp', '.jpg', '.jpeg', '.png')))
    cols, cw, ch = 6, 260, 220
    for n in range(0, len(files), 30):
        chunk = files[n:n + 30]
        sheet = Image.new('RGB', (cols * cw, ((len(chunk) + cols - 1) // cols) * ch), (24, 22, 20))
        d = ImageDraw.Draw(sheet)
        for k, f in enumerate(chunk):
            im = Image.open(f).convert('RGB')
            im.thumbnail((cw - 8, ch - 28))
            x, y = (k % cols) * cw + 4, (k // cols) * ch + 4
            sheet.paste(im, (x, y))
            d.text((x, y + ch - 24), os.path.splitext(os.path.basename(f))[0][:34], fill=(230, 200, 140))
        out = os.path.join(WORK, 'sheet_%02d.jpg' % (n // 30 + 1))
        sheet.save(out, quality=82)
        print('лист:', out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--only', help='список id через запятую')
    ap.add_argument('--redo', action='store_true', help='перекачать даже существующие')
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--width', type=int, default=720)
    ap.add_argument('--quality', type=int, default=76)
    ap.add_argument('--sheet', action='store_true', help='собрать контактные листы для просмотра')
    ap.add_argument('--build', action='store_true', help='после скачивания пересобрать index.html')
    ap.add_argument('--list', action='store_true', help='только показать, что будет скачано')
    a = ap.parse_args()

    targets = parse_targets()
    ids = [i for i in targets if (not a.only or i in a.only.split(','))]
    todo = [i for i in ids if a.redo or not existing(i)]
    if a.limit:
        todo = todo[:a.limit]
    print('целей: %d, к скачиванию: %d' % (len(ids), len(todo)))
    if a.list:
        for i in todo:
            print(' ', i, '|', targets[i]['name'], '|', targets[i]['wp'] or '', '|', targets[i]['pq'] or '')
        return
    credits = load_credits()
    ok = fail = 0
    for n, i in enumerate(todo, 1):
        t = targets[i]
        print('[%d/%d] %s — %s' % (n, len(todo), i, t['name']))
        found = find_image(t)
        if not found:
            print('   — нет подходящего фото')
            fail += 1
            continue
        raw = http_get(found['url'], binary=True, timeout=60)
        if not raw:
            fail += 1
            continue
        path = save_image(raw, os.path.join(IMG, i), a.width, a.quality)
        if not path:
            print('   — картинка не подошла (маленькая/битая)')
            fail += 1
            continue
        credits[i] = found
        ok += 1
        print('   ✓ %s (%s, %d КБ)' % (os.path.basename(path), found['source'], os.path.getsize(path) // 1024))
        if n % 10 == 0:
            write_credits(credits)
        time.sleep(0.25)
    write_credits(credits)
    print('готово: скачано %d, не нашлось %d' % (ok, fail))
    if a.sheet:
        contact_sheets()
    if a.build:
        subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'build.py')])
    else:
        print('Теперь соберите приложение: python3 kulinar/tools/build.py')


if __name__ == '__main__':
    main()
