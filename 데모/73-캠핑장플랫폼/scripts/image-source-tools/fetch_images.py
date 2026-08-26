#!/usr/bin/env python3
# 데모73 — 공개 라이선스 캠핑 사진 수집기
# 소스: Openverse API (CC BY/CC0 등 상업적 이용 가능 라이선스만)
# 결과: assets/img/*.webp + assets/img/SOURCES.json (출처·라이선스 기록)
import json, time, urllib.request, urllib.parse, io, os, sys
from PIL import Image

API = 'https://api.openverse.org/v1/images/'
UA = {'User-Agent': 'campflow-demo/1.0 (static demo image collection)'}
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'img'))
os.makedirs(OUT, exist_ok=True)

# (파일명, 검색어, 가로:세로 비율, 목표 폭)
TARGETS = [
    ('hero-main',     'tent lake morning mist',        (4, 5),  960),
    ('hero-sub-01',   'camping tent forest',           (4, 3),  800),
    ('hero-sub-02',   'camping lake shore',            (4, 3),  800),
    ('mag-01',        'lake morning fog reflection',   (3, 2), 1200),
    ('mag-02',        'pine forest campsite',          (3, 2), 1200),
    ('theme-wide',    'mountain lake morning',         (21, 9),1920),
    ('camp-lake-01',  'campsite lake tent',            (4, 3),  800),
    ('camp-forest-01','forest campground tent',        (4, 3),  800),
    ('camp-glamp-01', 'glamping tent',                 (4, 3),  800),
    ('camp-caravan-01','caravan camping',              (4, 3),  800),
    ('camp-night-01', 'tent night stars camping',      (4, 3),  800),
    ('camp-river-01', 'river camping tent',            (4, 3),  800),
    ('camp-glamp-02', 'dome tent glamping',            (4, 3),  800),
    ('camp-field-01', 'meadow camping tent',           (4, 3),  800),
    ('detail-01',     'campfire kettle outdoor',       (4, 3),  800),
    ('detail-02',     'camping gear backpack',         (4, 3),  800),
    ('detail-03',     'camping morning coffee',        (4, 3),  800),
    ('detail-04',     'camping tarp forest',           (4, 3),  800),
]

def get(url):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=30).read()

def search(query, n=10):
    q = urllib.parse.urlencode({
        'q': query, 'license_type': 'commercial', 'page_size': n,
        'fields': 'id,title,url,license,license_url,creator,foreign_landing_url,width,height,provider',
    })
    return json.loads(get(API + '?' + q))['results']

def is_cool(img):
    small = img.convert('RGB').resize((8, 8))
    px = list(small.getdata())
    r = sum(p[0] for p in px) / 64
    b = sum(p[2] for p in px) / 64
    return b >= r * 0.92  # 쿨톤(청록·파랑 계열) 우선

def crop_to(img, ratio):
    w, h = img.size
    tw, th = ratio
    cur = w / h
    want = tw / th
    if cur > want:  # 좌우 크롭
        nw = int(h * want)
        x = (w - nw) // 2
        return img.crop((x, 0, x + nw, h))
    nh = int(w / want)
    y = (h - nh) // 2
    return img.crop((0, y, w, y + nh))

used = set()
sources = []
fail = []

for name, query, ratio, width in TARGETS:
    picked = None
    try:
        cands = search(query)
    except Exception as e:
        fail.append((name, f'search: {e}'))
        continue
    fallback = None
    for c in cands:
        if c['id'] in used or not c.get('url'):
            continue
        if (c.get('width') or 0) < 600:
            continue
        try:
            raw = get(c['url'])
            img = Image.open(io.BytesIO(raw)).convert('RGB')
        except Exception:
            continue
        if fallback is None:
            fallback = (c, img)
        if is_cool(img):
            picked = (c, img)
            break
    if not picked:
        picked = fallback
    if not picked:
        fail.append((name, 'no candidate'))
        continue
    c, img = picked
    used.add(c['id'])
    out = crop_to(img, ratio)
    if out.width > width:
        out = out.resize((width, int(width * ratio[1] / ratio[0])), Image.LANCZOS)
    path = os.path.join(OUT, name + '.webp')
    out.save(path, 'WEBP', quality=82)
    sources.append({
        'file': name + '.webp', 'title': c.get('title'), 'creator': c.get('creator'),
        'license': c.get('license'), 'license_url': c.get('license_url'),
        'source_page': c.get('foreign_landing_url'), 'provider': c.get('provider'),
        'query': query,
    })
    kb = os.path.getsize(path) // 1024
    print(f'OK {name}.webp {out.width}x{out.height} {kb}KB <- {c.get("title")} ({c.get("license")})')
    time.sleep(0.4)

with open(os.path.join(OUT, 'SOURCES.json'), 'w', encoding='utf-8') as f:
    json.dump(sources, f, ensure_ascii=False, indent=2)
print('saved:', len(sources), 'failed:', fail)
