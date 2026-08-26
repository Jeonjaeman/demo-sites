#!/usr/bin/env python3
"""최종 이미지 링크/중복/간단 사람·표식 위험 검출 기록."""
import json, time, urllib.error, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = json.loads((ROOT / 'assets/img/SOURCES.json').read_text(encoding='utf-8'))
OUT = ROOT / 'qa/round2-image-audit.json'
UA = {'User-Agent': 'campflow-demo/2.0 image audit'}


def status(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=35) as response:
                response.read(512)
                return response.status
        except urllib.error.HTTPError as error:
            if error.code == 429 and attempt < 3:
                time.sleep(6 * (attempt + 1)); continue
            return error.code
        except Exception:
            if attempt < 3:
                time.sleep(3); continue
            return 0


def skin_ratio(path):
    image = Image.open(path).convert('RGB')
    image.thumbnail((240, 240))
    pixels = list(image.get_flattened_data())
    skin = 0
    for red, green, blue in pixels:
        if red > 95 and green > 40 and blue > 20 and max(red, green, blue) - min(red, green, blue) > 15 and abs(red - green) > 15 and red > green and red > blue:
            skin += 1
    return round(skin / max(1, len(pixels)), 4)

seen = set()
rows = []
for row in MANIFEST:
    duplicate = row['source_page'] in seen
    seen.add(row['source_page'])
    title_risk = any(word in row['title'].lower() for word in ['people', 'person', 'man ', 'woman', 'sign', 'store', 'game', 'second life'])
    rows.append({
        'file': row['file'],
        'source_get': status(row['source_page']),
        'license_get': status(row['license_url']),
        'duplicate_source': duplicate,
        'skin_tone_pixel_ratio': skin_ratio(ROOT / 'assets/img' / row['file']),
        'title_risk_keyword': title_risk,
        'manual_review_required': row.get('replaced_in_round2', False),
    })
OUT.write_text(json.dumps({'count': len(rows), 'rows': rows}, ensure_ascii=False, indent=2), encoding='utf-8')
fail = [row for row in rows if row['source_get'] != 200 or row['license_get'] != 200 or row['duplicate_source'] or row['title_risk_keyword']]
print(f'IMAGE_AUDIT count={len(rows)} links_ok={len(rows)-len(fail)} flagged={len(fail)}')
if fail:
    print('FLAGGED_FILES', ','.join(row['file'] for row in fail))
    raise SystemExit(1)
