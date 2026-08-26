#!/usr/bin/env python3
# hero-main — Wikimedia Commons에서 1600px 썸네일로 재수집 (라이선스 메타 포함)
import json, time, urllib.request, urllib.parse, io, os
from PIL import Image

UA = {'User-Agent': 'campflow-demo/1.0 (static demo image collection)'}
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'img'))

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()

def commons_search(query, n=20):
    q = urllib.parse.urlencode({
        'action': 'query', 'generator': 'search', 'gsrsearch': f'filetype:bitmap {query}',
        'gsrnamespace': 6, 'gsrlimit': n,
        'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata', 'iiurlwidth': 1600,
        'format': 'json',
    })
    data = json.loads(get('https://commons.wikimedia.org/w/api.php?' + q))
    pages = (data.get('query') or {}).get('pages') or {}
    out = []
    for p in pages.values():
        ii = (p.get('imageinfo') or [{}])[0]
        em = ii.get('extmetadata') or {}
        lic = (em.get('LicenseShortName') or {}).get('value', '')
        if not any(k in lic.lower() for k in ['cc by', 'cc0', 'public domain', 'cc by-sa']):
            continue
        out.append({
            'title': p.get('title'),
            'thumb': ii.get('thumburl'),
            'page': ii.get('descriptionurl'),
            'width': ii.get('width'), 'height': ii.get('height'),
            'license': lic,
            'artist': (em.get('Artist') or {}).get('value', ''),
        })
    return out

def is_cool(img):
    px = list(img.convert('RGB').resize((8, 8)).getdata())
    r = sum(p[0] for p in px) / 64
    b = sum(p[2] for p in px) / 64
    return b >= r * 0.92

def crop_to(img, ratio):
    w, h = img.size
    want = ratio[0] / ratio[1]
    if w / h > want:
        nw = int(h * want); x = (w - nw) // 2
        return img.crop((x, 0, x + nw, h))
    nh = int(w / want); y = (h - nh) // 2
    return img.crop((0, y, w, y + nh))

picked = None
for query in ['camping tent lake morning', 'camping tent mountain lake', 'tent lake sunrise camping']:
    try:
        cands = commons_search(query)
    except Exception as e:
        print('retry', e); time.sleep(5); continue
    for c in cands:
        if not c.get('thumb') or (c.get('width') or 0) < 1200:
            continue
        try:
            img = Image.open(io.BytesIO(get(c['thumb']))).convert('RGB')
        except Exception:
            continue
        if img.width < 900:
            continue
        if is_cool(img):
            picked = (c, img); break
        if not picked:
            picked = (c, img)
    if picked:
        break

if not picked:
    print('FAIL hero-main commons (keep existing)')
    raise SystemExit(0)

c, img = picked
print('source:', c['title'], img.size, c['license'])
out = crop_to(img, (4, 5))
if out.width > 960:
    out = out.resize((960, 1200), Image.LANCZOS)
out.save(os.path.join(OUT, 'hero-main.webp'), 'WEBP', quality=82)

src_path = os.path.join(OUT, 'SOURCES.json')
sources = [s for s in json.load(open(src_path, encoding='utf-8')) if s['file'] != 'hero-main.webp']
sources.append({
    'file': 'hero-main.webp', 'title': c['title'], 'creator': c['artist'],
    'license': c['license'], 'license_url': '',
    'source_page': c['page'], 'provider': 'wikimedia commons',
    'query': 'hero-large',
})
json.dump(sources, open(src_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(f'OK hero-main.webp {out.width}x{out.height}')
