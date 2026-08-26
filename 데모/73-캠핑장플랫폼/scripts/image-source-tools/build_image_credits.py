#!/usr/bin/env python3
"""위험 이미지 교체 + SOURCES/credits 정적 생성 도구.

기본 실행은 현재 SOURCES.json으로 credits.html만 재생성한다.
--replace-risky를 주면 Wikimedia Commons 공식 API의 공개영역 원본 7개를
다운로드·중앙 크롭·리사이즈·WebP 변환한 뒤 manifest를 갱신한다.
외부 메타는 html.escape 후 정적 HTML로만 기록한다.
"""
import argparse
import html
import io
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
IMG_DIR = ROOT / 'assets' / 'img'
MANIFEST = IMG_DIR / 'SOURCES.json'
UA = {'User-Agent': 'campflow-demo/2.0 (license compliance build)'}
MODIFICATIONS = '중앙 크롭, 리사이즈, WebP 변환 및 손실 압축; 색상 픽셀 보정 없음, 쿨톤 후보 우선 선별'
PDM_URL = 'https://creativecommons.org/publicdomain/mark/1.0/'

REPLACEMENTS = {
    'hero-main.webp': {
        'title': 'File:Tent camping Lake crescent campground orange nps photo (22350549763).jpg',
        'ratio': (4, 5), 'width': 960,
    },
    'mag-01.webp': {
        'title': 'File:Lake Mountain Landscape.jpg',
        'ratio': (3, 2), 'width': 1200,
    },
    'theme-wide.webp': {
        'title': 'File:Scenic landscape of Greek mountains and lake.jpg',
        'ratio': (21, 9), 'width': 1920,
    },
    'camp-caravan-01.webp': {
        'title': 'File:Mountain lake landscape.JPG',
        'ratio': (4, 3), 'width': 800,
    },
    'camp-glamp-02.webp': {
        'title': 'File:Tent Camping (5f54eba0-1993-47d8-a640-e1038a89471a).JPG',
        'ratio': (4, 3), 'width': 800,
    },
    'detail-02.webp': {
        'title': 'File:Landscape view at campground (53584942642).jpg',
        'ratio': (4, 3), 'width': 800,
    },
    'detail-01.webp': {
        'title': 'File:Boiling water over campfire at Dewey Lake in William O Douglas Wilderness. (54b8b3daa539454d8e14587e097c2b49).JPG',
        'ratio': (4, 3), 'width': 800,
    },
}


def get(url):
    for attempt in range(5):
        request = urllib.request.Request(url, headers=UA)
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return response.read(), response.status
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt == 4:
                raise
            time.sleep(8 * (attempt + 1))


def plain(value):
    text = re.sub(r'<[^>]+>', '', value or '')
    return html.unescape(re.sub(r'\s+', ' ', text)).strip()


def commons_metadata(title):
    params = urllib.parse.urlencode({
        'action': 'query', 'titles': title, 'prop': 'imageinfo',
        'iiprop': 'url|size|extmetadata', 'iiurlwidth': 1920, 'format': 'json',
    })
    raw, _ = get('https://commons.wikimedia.org/w/api.php?' + params)
    pages = json.loads(raw).get('query', {}).get('pages', {})
    page = next(iter(pages.values()))
    info = page['imageinfo'][0]
    meta = info.get('extmetadata', {})
    license_name = plain(meta.get('LicenseShortName', {}).get('value'))
    if not re.search(r'public domain|cc0|pdm', license_name, re.I):
        raise RuntimeError(f'{title}: public-domain 계열 아님 ({license_name})')
    creator = plain(meta.get('Artist', {}).get('value')) or plain(meta.get('Credit', {}).get('value')) or 'Wikimedia Commons 제공 기관'
    source_page = info['descriptionurl']
    # 소스와 라이선스 URL을 실제 GET으로 검증한다.
    get(source_page)
    get(PDM_URL if license_name.lower() == 'public domain' else plain(meta.get('LicenseUrl', {}).get('value')) or PDM_URL)
    return {
        'title': page['title'].removeprefix('File:'),
        'creator': creator,
        'license': 'Public Domain' if license_name.lower() == 'public domain' else license_name,
        'license_url': PDM_URL if license_name.lower() == 'public domain' else plain(meta.get('LicenseUrl', {}).get('value')) or PDM_URL,
        'source_page': source_page,
        'provider': 'Wikimedia Commons 공식 API',
        'download_url': info.get('thumburl') or info['url'],
    }


def crop(image, ratio):
    width, height = image.size
    wanted = ratio[0] / ratio[1]
    if width / height > wanted:
        new_width = int(height * wanted)
        left = (width - new_width) // 2
        return image.crop((left, 0, left + new_width, height))
    new_height = int(width / wanted)
    top = (height - new_height) // 2
    return image.crop((0, top, width, top + new_height))


def replace_risky(manifest, filenames=None):
    by_file = {row['file']: row for row in manifest}
    targets = set(filenames or REPLACEMENTS)
    seen_sources = {row.get('source_page') for row in manifest if row['file'] not in targets}
    for filename, spec in REPLACEMENTS.items():
        if filenames and filename not in filenames:
            continue
        meta = commons_metadata(spec['title'])
        if meta['source_page'] in seen_sources:
            raise RuntimeError(f'{filename}: source 중복')
        seen_sources.add(meta['source_page'])
        raw, _ = get(meta.pop('download_url'))
        image = Image.open(io.BytesIO(raw)).convert('RGB')
        output = crop(image, spec['ratio'])
        if output.width > spec['width']:
            output = output.resize((spec['width'], round(spec['width'] * spec['ratio'][1] / spec['ratio'][0])), Image.Resampling.LANCZOS)
        output.save(IMG_DIR / filename, 'WEBP', quality=82, method=6)
        by_file[filename] = {
            'file': filename, **meta, 'modifications': MODIFICATIONS,
            'replaced_in_round2': True,
        }
        if filename == 'camp-caravan-01.webp':
            by_file[filename]['replaced_visual_round2b'] = True
            by_file[filename]['replaced_visual_round2c'] = True
        print(f'REPLACED {filename} {output.width}x{output.height} {meta["license"]}')
    return [by_file[name] for name in sorted(by_file)]


def normalize_manifest(manifest):
    mapping = {
        'by': ('CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0/'),
        'by-sa': ('CC BY-SA 2.0', 'https://creativecommons.org/licenses/by-sa/2.0/'),
        'pdm': ('PDM 1.0', PDM_URL),
        'cc0': ('CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/'),
    }
    out = []
    for original in manifest:
        row = dict(original)
        short = str(row.get('license', '')).lower()
        if short in mapping:
            row['license'], row['license_url'] = mapping[short]
        row['creator'] = plain(str(row.get('creator') or '원 출처 제공 기관'))
        row['title'] = plain(str(row.get('title') or row['file']))
        row['modifications'] = MODIFICATIONS
        row.pop('query', None)
        if 'BY-SA' in row['license']:
            row['derivative_license'] = row['license']
        out.append(row)
    return sorted(out, key=lambda row: row['file'])


def build_credits(manifest):
    cards = []
    for row in manifest:
        esc = {key: html.escape(str(value), quote=True) for key, value in row.items()}
        share_alike = ''
        if row.get('derivative_license'):
            share_alike = f'<p class="small"><strong>변경 이미지 배포:</strong> 이 변경 이미지 파일은 <a href="{esc["license_url"]}">{esc["derivative_license"]}</a>으로 배포합니다.</p>'
        cards.append(f'''<article class="credit-card" data-credit-file="{esc['file']}">
          <img src="assets/img/{esc['file']}" alt="" width="320" height="240" loading="lazy">
          <div><h2>{esc['file']}</h2><p>“{esc['title']}” — {esc['creator']}</p>
          <p><a href="{esc['source_page']}">원본 보기</a> · <a href="{esc['license_url']}">{esc['license']}</a></p>
          <p class="small"><strong>변경:</strong> {esc['modifications']}</p>{share_alike}</div>
        </article>''')
    document = f'''<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>이미지 출처·라이선스 — CAMP FLOW 데모</title><link rel="icon" href="data:,"><link rel="stylesheet" href="assets/css/style.css"></head>
<body><a class="skip-link" href="#main">본문 바로가기</a><header class="site-header"><div class="header-inner"><a class="wordmark" href="index.html"><span class="mark" aria-hidden="true"></span>CAMP FLOW <span class="badge badge-neutral">데모</span></a><a class="btn btn-secondary btn-compact" href="index.html" style="margin-left:auto">홈으로</a></div></header>
<main id="main" class="container page-head credits-page"><p class="eyebrow">IMAGE CREDITS</p><h1 class="page-title" style="margin-top:12px">이미지 출처·라이선스</h1>
<p class="lead credits-intro">이 데모의 사진은 각 항목에 표시된 원 저작자의 라이선스에 따라 사용했습니다. 사진은 레이아웃에 맞게 중앙 크롭·리사이즈하고 WebP로 변환·압축했습니다. 별도 기재가 없는 한 색상 픽셀 보정은 하지 않았으며, 수집 단계에서 쿨톤 이미지를 우선 선별했습니다. 각 라이선스는 해당 이미지에 적용되며, 데모 운영자나 원 저작자의 상호 보증·제휴를 의미하지 않습니다.</p>
<section class="credits-list" aria-label="파일별 이미지 출처">{''.join(cards)}</section>
<div class="demo-notice">CC BY-SA 동일조건변경허락 표시는 해당 변경 이미지 파일만을 가리킵니다. 사이트 자체의 코드·문구·브랜드는 별도 고지가 없는 한 CC BY-SA로 제공되는 것이 아닙니다.</div></main>
<footer class="site-footer"><div class="footer-inner"><div class="footer-links"><a href="index.html">홈</a><a href="credits.html" aria-current="page">이미지 출처·라이선스</a></div><p class="demo-notice">가상 캠핑장 예약 MVP의 이미지 라이선스 고지 페이지입니다.</p></div></footer>
<script type="module">import {{ boot }} from './assets/js/app.js'; boot();</script></body></html>'''
    (ROOT / 'credits.html').write_text(document, encoding='utf-8')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--replace-risky', action='store_true')
    parser.add_argument('--replace-file', choices=sorted(REPLACEMENTS))
    args = parser.parse_args()
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    if args.replace_risky or args.replace_file:
        manifest = replace_risky(manifest, {args.replace_file} if args.replace_file else None)
    manifest = normalize_manifest(manifest)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    build_credits(manifest)
    print(f'GENERATED manifest={len(manifest)} credits={len(manifest)}')

if __name__ == '__main__':
    main()
