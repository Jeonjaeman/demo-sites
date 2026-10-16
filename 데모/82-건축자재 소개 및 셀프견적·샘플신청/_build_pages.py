# -*- coding: utf-8 -*-
"""공개 페이지 19개를 공통 셸로 생성한다. (빌드 보조 스크립트 — 배포 대상 아님)"""
import os
ROOT = os.path.dirname(os.path.abspath(__file__))

def shell(page, title, desc, body, theme='light', grid=True, extra_head=''):
    return f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#19170e">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2319170e'/%3E%3Cpath d='M8 8h16v16H8z' fill='none' stroke='%23b1a781' stroke-width='2'/%3E%3Cpath d='M14 14h10v10' fill='none' stroke='%23b1a781' stroke-width='2'/%3E%3C/svg%3E">
<link rel="stylesheet" href="assets/css/style.css">
{extra_head}
</head>
<body data-page="{page}" class="{'grid-bg' if grid else ''}">
<header id="site-header" data-theme="{theme}"></header>
<main id="main">
{body}
</main>
<footer id="site-footer"></footer>
<script src="assets/js/data.js"></script>
<script src="assets/js/store.js"></script>
<script src="assets/js/calc.js"></script>
<script src="assets/js/ui.js"></script>
<script src="assets/js/pages.js"></script>
</body>
</html>
'''

OTHERS_SUB = '''<nav class="subnav shell" id="others-sub" aria-label="기타자재 하위 메뉴"><a href="others.html" {a0}>소개</a><a href="products.html?line=other" {a1}>제품보기</a><a href="others-fields.html" {a2}>적용분야</a><a href="cases.html?line=other" {a3}>시공사례</a></nav>'''
def sub(i):
    return OTHERS_SUB.format(**{f'a{k}': ('aria-current="page"' if k == i else '') for k in range(4)})

PAGES = {}

# ───────────────────────── 홈 ─────────────────────────
PAGES['index.html'] = ('home', 'ARGILO 아르길로 — 점토로 빚은 3mm의 돌 · 건축 내외장재', '휘고, 가볍고, 타지 않는 점토계 외장재 아르길로. 제품·시공사례·셀프견적·샘플신청.', 'dark', False, '''
<div class="intro" id="intro" aria-hidden="true"><div class="intro__word"></div><button class="intro__skip">건너뛰기</button></div>

<section class="hero">
  <div class="hero__media"><img src="assets/img/hero-facade.webp" alt="아르길로 라지 포맷 판으로 마감한 저층 건물 외벽, 석양빛" data-parallax="0.16" fetchpriority="high"></div>
  <div class="hero__in">
    <div>
      <div class="hero__meta"><span>Clay-based flexible cladding</span><span>경기 안양 · 쇼룸</span></div>
      <h1 class="d-xl hero__title" data-lines>점토로 빚은<br>3mm의 돌.</h1>
    </div>
    <div class="hero__side"><p>휘어지고, 타일의 4분의 1 무게이고, 불에 타지 않습니다. 벽 한 면의 치수만 넣으면 몇 박스가 필요한지 지금 바로 계산됩니다.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn--clay btn--arrow btn--mag" href="estimate.html">셀프견적 시작</a><a class="btn btn--light" href="products.html">제품 보기</a></div></div>
  </div>
  <div class="hero__scroll">Scroll</div>
</section>

<section class="sec">
  <div class="shell">
    <p class="eyebrow eyebrow--serif muted" data-reveal>What it is</p>
    <p class="lead leadcol mt3" data-scrub>석회암의 결, 쪼갠 돌의 요철, 노출 콘크리트의 흙손 자국. 아르길로는 그 표정을 점토와 광물 분말로 다시 빚어 3밀리미터 안에 담습니다. 칼로 재단되고 기둥을 감싸며, 기존 벽 위에 그대로 붙습니다.</p>
    <div class="stats mt5" id="home-stats"></div>
  </div>
</section>

<section class="sec sec--light">
  <div class="shell">
    <div class="sec-head" data-reveal><h2 class="h2">네 가지 라인업</h2><p class="muted">스톤은 지금 주문할 수 있는 라인, 디스플레이와 쏠라는 국내 인증 상태를 함께 표기하는 소개·상담 라인입니다.</p></div>
    <div class="tilt-grid" id="lineup" data-stagger="90"></div>
  </div>
</section>

<section class="sec" style="padding-bottom:0">
  <div class="shell"><div class="sec-head" data-reveal><h2 class="h2">자재는 현장에서 증명됩니다</h2><a class="link" href="cases.html">시공사례 전체</a></div></div>
  <div class="bleed car" id="case-car" data-carousel data-auto="5000" aria-roledescription="carousel" aria-label="시공사례">
    <div class="car__track" id="case-track"></div>
    <div class="car__ctrl"><div class="car__dots"></div><div class="car__arrows"><button class="car__prev" aria-label="이전"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button><button class="car__next" aria-label="다음"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></div></div>
  </div>
</section>

<section class="sec">
  <div class="shell mini">
    <div data-reveal>
      <p class="eyebrow eyebrow--serif muted">Self-estimate</p>
      <h2 class="h2 mt3">숫자가 아니라<br>데이터로 계산합니다.</h2>
      <p class="xl muted mt4">같은 아르길로라도 판은 1200×600부터 1200×3000까지, 박스에는 2장부터 60장까지 들어갑니다. 계산식을 코드에 박지 않고 제품마다 판형·박스·로스율을 데이터로 두었기 때문에, 관리자에서 로스율을 바꾸면 이 결과도 그 자리에서 바뀝니다.</p>
      <a class="link mt4" href="estimate.html?preset=facade">외벽 예시로 전체 계산기 열기</a>
    </div>
    <div class="mini__panel" data-reveal>
      <div class="field"><label for="mini-p">자재</label><select class="in" id="mini-p"></select></div>
      <div class="frow"><div class="field"><label for="mini-w">벽 가로</label><div class="in-wrap"><input id="mini-w" type="number" step="0.1" min="0.1" value="4.2"><span class="unit">m</span></div></div><div class="field"><label for="mini-h">벽 세로</label><div class="in-wrap"><input id="mini-h" type="number" step="0.1" min="0.1" value="2.4"><span class="unit">m</span></div></div></div>
      <div class="mini__out"><div><b class="num" id="mini-area">—</b><span>순 면적 ㎡</span></div><div><b class="num" id="mini-sheets">—</b><span>필요 장수</span></div><div><b class="num" id="mini-boxes">—</b><span>박스</span></div></div>
      <p class="mini__note" id="mini-note"></p>
      <a class="btn btn--ink btn--arrow" id="mini-go" href="estimate.html">개구부·패턴까지 넣어 정확히</a>
    </div>
  </div>
</section>

<section class="band">
  <div class="band__media"><img src="assets/img/hero-courtyard.webp" alt="트라버틴 질감 아르길로 판으로 마감한 중정 벽" data-parallax="0.12"></div>
  <div class="band__in">
    <p class="eyebrow">Fire performance</p>
    <h2 class="h2" data-reveal>외벽은 성적서로 말합니다.</h2>
    <p class="xl" data-reveal>3층 이상이거나 높이 9미터를 넘는 건물의 외벽 마감재는 방화 성능을 확인해야 합니다. 제품마다 국내 시험성적서와 제조사의 해외 인증을 분리해 표기하고, 셀프견적에서 외벽을 고르면 건물 높이부터 묻습니다.</p>
    <div class="band__stats" data-reveal><div><b class="num">KS F ISO 1182</b><span>불연 시험 규격</span></div><div><b class="num">9m · 3F</b><span>외벽 방화 확인 기준</span></div><div><b class="num">D-30</b><span>성적서 만료 사전 경고</span></div></div>
    <div class="mt5" data-reveal><a class="btn btn--light btn--arrow" href="resources.html?cat=cert">시험성적서 내려받기</a></div>
  </div>
</section>

<section class="sec">
  <div class="shell split">
    <div data-reveal>
      <p class="eyebrow eyebrow--serif muted">Resources & Support</p>
      <h2 class="h2 mt3">설계자에게는 자료를,<br>건축주에게는 샘플을.</h2>
      <p class="muted b-l mt4">시험성적서·시방서·시공 가이드는 로그인 없이 내려받고, 샘플은 개인 5개까지 무료로 보내 드립니다. 궁금한 것은 카카오톡으로 바로 물어보세요.</p>
      <div class="mt4" style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn--ink" href="resources.html">자료실</a><a class="btn btn--sand" href="sample.html">샘플 신청</a><a class="btn btn--ghost" href="support.html">고객센터</a></div>
    </div>
    <div data-reveal><p class="eyebrow muted mb3">News</p><div class="news-list" id="home-news"></div></div>
  </div>
</section>

<section class="sec--night" style="padding:0">
  <div class="marquee"><div class="marquee__in"><span>Clay · Mineral · 3mm</span><span>휘어지는 돌</span><span>타일의 1/4 무게</span><span>불연 · 준불연 국내 성적서</span><span>기존 벽 위 덧방</span><span>곡면 · 기둥 감싸기</span><span>Clay · Mineral · 3mm</span><span>휘어지는 돌</span><span>타일의 1/4 무게</span><span>불연 · 준불연 국내 성적서</span><span>기존 벽 위 덧방</span><span>곡면 · 기둥 감싸기</span></div></div>
</section>
''')

# ───────────────────────── 아르길로란 ─────────────────────────
PAGES['about.html'] = ('about', '아르길로란 — 점토계 연질 외장재의 정체 · ARGILO', '아르길로가 무엇으로 만들어지고, 무엇과 다르며, 어디까지 쓸 수 있는지.', 'dark', True, '''
<section class="hero hero--short">
  <div class="hero__media"><img src="assets/img/about-bend.webp" alt="장갑 낀 손이 3mm 두께의 아르길로 판을 부드럽게 휘고 있다" data-parallax="0.12" fetchpriority="high"></div>
  <div class="hero__in"><div><div class="hero__meta"><span>About ARGILO</span></div><h1 class="d-l hero__title" data-lines>돌처럼 보이고,<br>종이처럼 휩니다.</h1></div><div class="hero__side"><p>아르길로는 점토와 광물 분말을 얇게 성형해 고온 소결한 연질 외장재입니다. 영어권에서 MCM이라 부르는 금속복합패널과는 이름만 같을 뿐 다른 소재입니다.</p></div></div>
</section>

<section class="sec">
  <div class="shell layer">
    <div data-reveal><p class="eyebrow eyebrow--serif muted">Composition</p><h2 class="h2 mt3">네 겹, 3밀리미터</h2><p class="muted b-l mt4">표면의 질감층부터 뒷면의 접착층까지 네 겹이 한 장을 이룹니다. 두께가 3밀리미터 안팎이라 기존 타일이나 벽지 위에 그대로 덧붙일 수 있고, 무게는 같은 면적 타일의 4분의 1입니다.</p></div>
    <div class="layer__stack" data-reveal><div>질감 표면층<span>UV 코팅 · 색상 안정</span></div><div>점토·광물 소결층<span>불연 성능의 본체 · 2.0mm</span></div><div>유연 섬유 보강층<span>곡면 추종 · 균열 억제</span></div><div>접착 바탕층<span>시멘트계 유연 접착제와 결합</span></div></div>
  </div>
</section>

<section class="sec sec--light">
  <div class="shell">
    <div class="sec-head" data-reveal><h2 class="h2">같은 이름, 다른 소재</h2><p class="muted">설계자와 감리가 가장 자주 묻는 질문입니다. "MCM이면 복합패널 품질인정 대상 아닌가요?"</p></div>
    <div class="compare">
      <div class="cmp is-us" data-reveal><span class="tag">ARGILO · 점토계 MCM</span><h3>Modified Clay Material</h3><dl><dt>구성</dt><dd>점토 · 광물 분말 · 섬유 보강</dd><dt>두께</dt><dd>2.5~4mm</dd><dt>무게</dt><dd>약 4~5 kg/㎡</dd><dt>시공</dt><dd>접착제 · 칼 재단 · 곡면 가능</dd><dt>국내 기준</dt><dd>단일 판 — 제품별 시험성적서로 성능 확인</dd></dl></div>
      <div class="cmp" data-reveal><span class="tag">일반 MCM · 금속복합패널</span><h3>Metal Composite Material</h3><dl><dt>구성</dt><dd>알루미늄 스킨 2장 + 심재</dd><dt>두께</dt><dd>3~5mm</dd><dt>무게</dt><dd>약 5.5~7.5 kg/㎡</dd><dt>시공</dt><dd>절곡 · 프레임 고정</dd><dt>국내 기준</dt><dd>복합자재 — 심재 성능 · 실물모형시험 등 별도</dd></dl></div>
    </div>
    <p class="small mt3">※ 단열재 등 다른 재료와 결합해 외벽을 구성하면 아르길로도 전체 구성의 실물모형시험이 필요할 수 있습니다. 최종 판단은 설계자·감리 확인이 필요합니다.</p>
  </div>
</section>

<section class="sec">
  <div class="shell">
    <div class="sec-head" data-reveal><h2 class="h2">성능 근거는 둘로 나눠 적습니다</h2><p class="muted">국내 시험성적서와 제조사의 해외 인증은 다른 것입니다. 섞어 쓰지 않습니다.</p></div>
    <div class="stats mb4"><div class="stat" data-reveal><b><span id="n-kr">0</span></b><span>국내 성적서 보유 제품</span></div><div class="stat" data-reveal><b><span id="n-ext">0</span></b><span>외부용 성적서 보유 제품</span></div><div class="stat" data-reveal><b><span id="n-pending">0</span></b><span>국내 성적서 확인 중</span></div><div class="stat" data-reveal><b class="txt">EN 13501-1</b><span>제조사 해외 인증 규격 (참고)</span></div></div>
    <div class="cert-row" id="cert-list"></div>
    <div class="mt4"><a class="link" href="resources.html?cat=cert">성적서 원본 내려받기</a></div>
  </div>
</section>

<section class="sec sec--dark">
  <div class="shell">
    <p class="eyebrow" style="color:var(--gold)">Where it goes</p>
    <h2 class="h2 mt3" data-reveal>실내 벽에서 외벽까지</h2>
    <div class="proc mt5" data-stagger="60" style="--line:rgba(243,239,235,.18)">
      <div data-reveal style="background:rgba(243,239,235,.05);border-color:rgba(243,239,235,.18)"><b>거실 · 침실 아트월</b>벽지 위 프라이머 후 하루 시공</div>
      <div data-reveal style="background:rgba(243,239,235,.05);border-color:rgba(243,239,235,.18)"><b>욕실 · 습식</b>줄눈 없이 밀착, 타일 위 덧방</div>
      <div data-reveal style="background:rgba(243,239,235,.05);border-color:rgba(243,239,235,.18)"><b>기둥 · 곡면</b>반지름 150mm까지 감싸기</div>
      <div data-reveal style="background:rgba(243,239,235,.05);border-color:rgba(243,239,235,.18)"><b>상업 공간</b>카운터 · 로비 · 복도 포인트월</div>
      <div data-reveal style="background:rgba(243,239,235,.05);border-color:rgba(243,239,235,.18)"><b>외벽 덧방</b>외부용 성적서 제품 · 메쉬 보강</div>
      <div data-reveal style="background:rgba(243,239,235,.05);border-color:rgba(243,239,235,.18)"><b>공공 · 교육</b>준불연 이상 + 품질관리서 제출</div>
    </div>
    <div class="hr" style="border-color:rgba(243,239,235,.18)"></div>
    <div class="split" style="align-items:center"><div><p class="eyebrow" style="color:var(--gold)">Supply</p><p class="xl mt3" data-reveal>이 사이트는 <b id="supply"></b>이 운영합니다. 제품 이미지와 카탈로그 가운데 제조사 제공분은 캡션에 출처를 표기합니다.</p></div><div><a class="btn btn--light btn--arrow" href="stone.html">아르길로 스톤 라인 보기</a></div></div>
  </div>
</section>
''')

# ───────────────────────── 스톤 라인 ─────────────────────────
PAGES['stone.html'] = ('stone', '아르길로 스톤 — 스톤 · 브릭 · 우드 · 라지 포맷 · ARGILO', '지금 주문할 수 있는 아르길로 스톤 라인. 판형·두께·박스 구성 비교.', 'dark', True, '''
<section class="hero hero--short">
  <div class="hero__media"><img src="assets/img/case-lobby-column.webp" alt="록페이스 질감으로 감싼 호텔 로비 원기둥" data-parallax="0.12" fetchpriority="high"></div>
  <div class="hero__in"><div><div class="hero__meta"><span>ARGILO Stone</span><span>지금 주문 가능</span></div><h1 class="d-l hero__title" data-lines>여섯 가지 표정,<br>하나의 두께.</h1></div><div class="hero__side"><p>트라버틴에서 테라코타 벽돌까지. 질감은 다르지만 전부 3밀리미터 안팎의 점토 판이라 같은 접착제, 같은 공구로 시공합니다.</p></div></div>
</section>
<section class="sec--info sec">
  <div class="shell">
    <div class="sec-head" data-reveal><h2 class="h2">제품</h2><p class="muted">성적서가 있는 제품은 배지로, 참고 단가가 공개된 제품은 가격으로 구분됩니다. 샘플은 카드에서 바로 담깁니다.</p></div>
    <div class="p-grid" id="stone-grid" data-stagger="70"></div>
  </div>
</section>
<section class="sec sec--light">
  <div class="shell">
    <div class="sec-head" data-reveal><h2 class="h2">판형 한눈에</h2><p class="muted">폭 1200mm는 공통이고 길이 코드 Z·A·B·C(600·2400·2700·3000)가 색상마다 다릅니다. 셀프견적은 벽 높이에 맞는 길이를 먼저 추천합니다.</p></div>
    <div style="overflow:auto"><table class="variants" id="variant-table" data-reveal></table></div>
  </div>
</section>
<section class="sec">
  <div class="shell">
    <div class="sec-head" data-reveal><h2 class="h2">시공은 여섯 단계</h2><a class="link" href="resources.html?cat=guide">시공 가이드 내려받기</a></div>
    <div class="proc" data-stagger="60"><div data-reveal><b>바탕 확인</b>평활도 2mm/2m · 들뜸 제거</div><div data-reveal><b>프라이머</b>벽지·도장면은 필수 · 건조 2시간</div><div data-reveal><b>접착제 도포</b>빗살 흙손 6mm · 1.5~2.5kg/㎡</div><div data-reveal><b>판 부착</b>줄눈 실내 0~2mm · 외벽 2mm</div><div data-reveal><b>재단 · 코너</b>커터 재단 · 알루미늄 트림</div><div data-reveal><b>양생</b>24시간 후 줄눈 마감</div></div>
    <div class="mt5" style="display:flex;gap:10px;flex-wrap:wrap" data-reveal><a class="btn btn--clay btn--arrow" href="estimate.html">셀프견적으로 수량 계산</a><a class="btn btn--sand" href="sample.html">샘플 신청</a></div>
  </div>
</section>
''')

def special_page(file, key, title, desc, hero_img, hero_alt, h1, side, eyebrow, body_lead, body_p, bullets, cta_note):
    PAGES[file] = (key, title, desc, 'dark', True, f'''
<section class="hero hero--short">
  <div class="hero__media"><img src="{hero_img}" alt="{hero_alt}" data-parallax="0.12" fetchpriority="high"></div>
  <div class="hero__in"><div><div class="hero__meta"><span>{eyebrow}</span><span id="sp-status"></span></div><h1 class="d-l hero__title" data-lines>{h1}</h1></div><div class="hero__side"><p>{side}</p></div></div>
</section>
<section class="sec">
  <div class="shell split">
    <div data-reveal><p class="eyebrow eyebrow--serif muted">Overview</p><p class="lead mt3">{body_lead}</p></div>
    <div data-reveal><p class="b-l muted">{body_p}</p><ul class="mt4" style="display:grid;gap:10px">{''.join(f'<li style="display:flex;gap:12px;align-items:flex-start"><span style="width:6px;height:6px;border-radius:50%;background:var(--clay);margin-top:10px;flex:none"></span><span>{b}</span></li>' for b in bullets)}</ul></div>
  </div>
</section>
<section class="sec sec--sage" style="padding:var(--s8) 0">
  <div class="shell spec-grid">
    <div class="spec" style="padding:0;background:none"><h3>Specifications</h3><table><tbody id="sp-specs"></tbody></table><p class="small mt3" style="color:rgba(26,26,26,.7)">「제조사 발표 기준」 표기는 국내 시험·인증을 거치지 않은 수치입니다. 국내 인증이 등록되면 관리자에서 상태를 바꾸는 것만으로 표기가 바뀝니다.</p></div>
    <div><h3 class="h3">도입 상담</h3><p class="mt2" style="color:rgba(26,26,26,.8)">{cta_note}</p><div class="mt4" style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn--clay btn--arrow" href="support.html#consult">도입 상담 신청</a><a class="btn btn--ghost" href="resources.html?cat=catalog" style="border-color:rgba(26,26,26,.4)">제조사 소개 자료</a></div></div>
  </div>
</section>
''')

special_page('display.html', 'display', '아르길로 디스플레이 — 소재 일체형 외벽 디스플레이 (소개) · ARGILO', '꺼지면 돌, 켜면 외벽 전체가 화면이 되는 소재 일체형 디스플레이. 국내 인증 전 소개 전용.',
  'assets/img/hero-display.webp', '외벽 판 표면에서 은은한 빛 패턴이 비치는 중층 건물의 저녁', '꺼지면 돌,<br>켜면 화면.',
  '외장재 표면에서 영상 신호를 내보내는 소재 일체형 디스플레이입니다. 국내 전기용품 인증 전이라 소개와 도입 상담만 받습니다.',
  'ARGILO Display', '건물의 벽이 간판이 되고, 저녁이면 다시 돌로 돌아갑니다. 패널을 덧대는 대신 소재 자체가 빛을 냅니다.',
  '디스플레이 라인은 전기·전자 제품이라 외장재와 다른 규제를 받습니다. 성능 수치는 전부 제조사 발표 기준으로 표기하고, 옥외광고물 허가와 전기용품 안전인증은 도입 상담에서 함께 검토합니다.',
  ['주간에는 스톤 질감, 야간에는 저해상 영상·패턴 송출', '옥외 전자 표시 광고물은 지자체 허가·신고 대상이 될 수 있음', '국내 KC 인증 전 — 셀프견적 대상에서 제외'],
  '건물 용도·위치·송출 계획을 알려 주시면 제조사와 국내 인증 일정을 확인해 회신합니다.')

special_page('solar.html', 'solar', '아르길로 쏠라 — 비유리 건물일체형 태양광 외장 (상담) · ARGILO', '유리가 아닌 소재 표면에서 발전하는 BIPV 외장재. 국내 KS 인증 진행 중.',
  'assets/img/hero-solar.webp', '매트한 다크 그레이 광물 판으로 마감된 오피스 건물 외벽', '유리 없이<br>발전하는 벽.',
  '유리 모듈을 붙이는 대신 소재 표면에서 발전하는 건물일체형 태양광 외장입니다. 국내 KS C 8577 인증을 진행 중인 수입 상담 라인입니다.',
  'ARGILO Solar', '반사가 없는 매트한 외벽이 낮 동안 전기를 만듭니다. 유리 BIPV와 달리 깨지지 않고, 외장재와 같은 방식으로 붙입니다.',
  '정부 보급·의무화 사업에 쓰려면 KS 인증 제품이 요구될 수 있습니다. 발전 용량 같은 수치는 제조사 발표 기준으로만 표기하며, 국내 인증이 등록되는 시점에 관리자에서 상태를 바꾸면 표기가 바뀝니다.',
  ['신재생설비 KS 인증(KS C 8577) 진행 중', '발전 용량·탄소 저감 수치는 제조사 발표 기준', '전기 공사·계통 연계는 전문 업체 협업'],
  '건물의 방위·면적·연계 계획을 알려 주시면 발전 시뮬레이션과 인증 일정을 함께 안내합니다.')

# ───────────────────────── 제품보기 · 상세 ─────────────────────────
PAGES['products.html'] = ('products', '제품보기 — ARGILO 아르길로', '아르길로 제품 목록. 용도·시리즈·성적서 유무로 필터.', 'light', True, '''
<section class="page-hero"><div class="shell"><div class="crumbs"><a href="index.html">홈</a><span>제품보기</span></div><h1 class="d-l" id="pl-title" data-lines>아르길로 스톤 제품</h1><p class="lead-p" id="pl-lead"></p></div></section>
''' + sub(1) + '''
<section class="sec--info" style="padding-top:0"><div class="shell"><div class="filters" id="filters"></div><div class="p-grid" id="p-grid"></div></div></section>
''')

PAGES['product.html'] = ('product', '제품 상세 — ARGILO 아르길로', '제품 스펙·성능 근거·연계 시공사례.', 'light', True, '''
<section class="page-hero" style="padding-bottom:var(--s6)"><div class="shell"><div class="crumbs"><a href="index.html">홈</a><span><a href="products.html">제품보기</a></span><span>상세</span></div></div></section>
<section class="sec--info" style="padding-top:0"><div class="shell"><div class="pd" id="pd"></div></div></section>
<section class="sec--info"><div class="shell"><div class="spec spec-grid" id="pd-spec" data-reveal></div></div></section>
<section class="sec--info" id="pd-cases-wrap"><div class="shell"><div class="sec-head" data-reveal><h2 class="h2">이 자재를 쓴 시공사례 <span class="muted" style="font-size:.5em;vertical-align:middle" id="pd-cases-n"></span></h2><a class="link" href="cases.html">전체 사례</a></div><div class="related" id="pd-cases"></div></div></section>
''')

# ───────────────────────── 시공사례 ─────────────────────────
PAGES['cases.html'] = ('cases', '시공사례 — ARGILO 아르길로', '공간·사용 자재·지역으로 찾는 아르길로 시공사례.', 'light', True, '''
<section class="page-hero"><div class="shell"><div class="crumbs"><a href="index.html">홈</a><span>시공사례</span></div><h1 class="d-l" id="cs-title" data-lines>자재는 현장에서<br>증명됩니다.</h1><p class="lead-p" id="cs-lead">사례마다 사용한 자재와 시공 면적·패턴을 함께 적었습니다. 사진 속 자재를 누르면 제품으로, 제품에서 다시 비슷한 사례로 이어집니다. 위치는 구 단위까지만 공개합니다.</p></div></section>
''' + sub(3) + '''
<section class="sec--info" style="padding-top:0"><div class="shell"><div class="filters" id="filters"></div><div class="cases-grid" id="cases-grid"></div></div></section>
''')

PAGES['case.html'] = ('case', '시공사례 상세 — ARGILO 아르길로', '시공사례 상세 — 사용 자재·시공 설명·연계 사례.', 'dark', True, '''
<section class="hero hero--short case-hero" id="case-hero"></section>
<section class="shell"><dl class="credits" id="credits"></dl></section>
<section class="shell"><div class="overview" id="overview"></div></section>
<section class="shell"><div class="collage" id="collage"></div></section>
<section class="sec"><div class="shell"><div class="sec-head" data-reveal><h2 class="h2">같은 자재를 쓴 다른 사례</h2><a class="link" href="cases.html">전체 사례</a></div><div class="related" id="related"></div></div></section>
''')

# ───────────────────────── 기타자재 ─────────────────────────
PAGES['others.html'] = ('others', '기타자재 — 소개 · ARGILO 아르길로', '아르길로 시공에 함께 쓰는 접착제·메쉬·트림·프라이머.', 'dark', True, '''
<section class="hero hero--short">
  <div class="hero__media"><img src="assets/img/others-materials.webp" alt="팔레트 위에 쌓인 메쉬 롤, 접착제 포대, 알루미늄 트림, 판재" data-parallax="0.12" fetchpriority="high"></div>
  <div class="hero__in"><div><div class="hero__meta"><span>Other materials</span></div><h1 class="d-l hero__title" data-lines>판 한 장 뒤에<br>네 가지가 더 있습니다.</h1></div><div class="hero__side"><p>접착제의 양, 메쉬의 폭, 트림의 길이. 셀프견적은 판 수량과 함께 부자재 소요량도 범위로 알려 드립니다.</p></div></div>
</section>
''' + sub(0) + '''
<section class="sec--info" style="padding-top:0"><div class="shell">
  <div class="sec-head" data-reveal><h2 class="h2">취급 품목</h2><p class="muted">롤·포대·개처럼 판매 단위가 다른 품목은 단위를 그대로 표기합니다. 같은 계산 엔진이 단위만 바꿔 다룹니다.</p></div>
  <div class="p-grid" id="others-grid" data-stagger="70"></div>
</div></section>
<section class="sec sec--light"><div class="shell split" style="align-items:center"><div data-reveal><p class="eyebrow eyebrow--serif muted">Why it matters</p><h2 class="h2 mt3">외벽은 메쉬부터</h2><p class="b-l muted mt4">기존 외벽 위에 덧붙이는 시공은 접착층의 균열이 곧 탈락으로 이어집니다. 외벽 사례에는 보강 메쉬와 유연 접착제가 빠짐없이 들어갔고, 셀프견적에서 외벽을 고르면 이 두 품목이 결과에 함께 나옵니다.</p></div><div data-reveal><a class="btn btn--clay btn--arrow" href="estimate.html?preset=facade">외벽 예시 견적 보기</a></div></div></section>
''')

PAGES['others-fields.html'] = ('others', '기타자재 — 적용분야 · ARGILO 아르길로', '외벽·상업·주거·공공·욕실 분야별 자재 매칭.', 'light', True, '''
<section class="page-hero"><div class="shell"><div class="crumbs"><a href="index.html">홈</a><span><a href="others.html">기타자재</a></span><span>적용분야</span></div><h1 class="d-l" data-lines>분야마다<br>조합이 다릅니다.</h1><p class="lead-p">외벽은 메쉬와 외부용 성적서 제품, 욕실은 방수 프라이머와 줄눈 없는 콘크리트 질감. 분야를 고르면 맞는 자재 조합으로 안내합니다.</p></div></section>
''' + sub(2) + '''
<section class="sec--info" style="padding-top:0"><div class="shell"><div class="fields" id="fields" data-stagger="80"></div></div></section>
''')

# ───────────────────────── 셀프견적 ─────────────────────────
PAGES['estimate.html'] = ('estimate', '셀프견적 — 자재와 치수로 수량 계산 · ARGILO', '자재·판형·시공 위치·치수·개구부·패턴을 넣으면 장수·박스·부자재가 계산됩니다.', 'light', True, '''
<section class="page-hero" style="padding-bottom:var(--s6)"><div class="shell"><div class="crumbs"><a href="index.html">홈</a><span>셀프견적</span></div><div class="sec-head" style="margin:0"><div><h1 class="d-l" data-lines>몇 장이 필요한지,<br>지금 계산해 보세요.</h1><p class="lead-p">자재와 벽 치수를 넣으면 장수·박스·남는 장수·접착제까지 나옵니다. 입력하기 번거로우시면 예시를 눌러 보세요.</p></div><div class="presets" style="align-self:end"><button class="chip" data-preset="living">예시 · 거실 아트월</button><button class="chip" data-preset="facade">예시 · 주택 외벽 덧방</button><button class="chip" data-preset="brick">예시 · 벽돌형 포인트월</button><button class="chip" data-preset="column">예시 · 로비 기둥 감싸기</button></div></div></div></section>
<section class="sec--info" style="padding-top:0" id="est"><div class="shell est">
  <div class="est__steps">
    <div class="step is-done"><div class="step__n">1</div><div><h3>자재와 판형</h3><p class="help">색상마다 판형이 다릅니다. 벽 높이에 맞는 길이를 추천합니다.</p><div class="tiles" id="st-prods"></div><div class="mt3" id="st-vars"></div></div></div>
    <div class="step is-done"><div class="step__n">2</div><div><h3>시공 위치</h3><p class="help">위치에 따라 줄눈 기본값이 바뀌고, 외벽은 방화 성능 확인 여부를 묻습니다.</p><div class="seg" id="st-loc"></div><div class="fire-q" id="st-fire" hidden></div></div></div>
    <div class="step"><div class="step__n">3</div><div><h3>벽 치수와 개구부</h3><p class="help">벽은 여러 면을 더할 수 있고, 창·문은 공제됩니다. 단위는 m입니다.</p><div class="walls" id="st-walls"></div><h4 class="mt3 mb2" style="font-size:14px;font-weight:600">개구부 공제</h4><div class="walls" id="st-opens"></div></div></div>
    <div class="step"><div class="step__n">4</div><div><h3>붙이는 패턴</h3><p class="help">패턴에 따라 재단 손실(로스율)이 달라집니다. 값은 제품마다 관리자가 입력합니다.</p><div class="tiles" id="st-pats"></div></div></div>
  </div>
  <aside class="result" id="result" aria-live="polite"></aside>
</div></section>
<section class="sec sec--light"><div class="shell split"><div data-reveal><p class="eyebrow eyebrow--serif muted">How it works</p><h2 class="h2 mt3">계산식은 하나,<br>값은 제품마다.</h2></div><div data-reveal class="b-l muted"><p>순 면적에서 개구부를 빼고, 줄눈을 포함한 판 한 장의 모듈 면적으로 나눈 뒤, 패턴별 로스율을 곱해 올림합니다. 박스 단위로 다시 올림하고 남는 장수를 보여 드립니다. 벽돌형처럼 작은 판은 줄눈을 무시하면 20% 넘게 과다 발주되고, 대형 판은 개구부를 빼지 않으면 한 박스가 더 나옵니다. 그래서 둘 다 계산에 넣었습니다.</p><p class="mt3">판형·박스당 장수·로스율·줄눈·접착제 소요량은 전부 관리자 제품 데이터입니다. <a href="admin.html#/products" style="text-decoration:underline">관리자</a>에서 값을 바꾸면 이 계산기가 그 자리에서 따라옵니다.</p></div></div></section>
''')

PAGES['quote.html'] = ('quote', '최종 견적 의뢰 — ARGILO 아르길로', '셀프견적 계산 내역을 첨부해 견적을 의뢰합니다.', 'light', True, '''
<section class="page-hero" style="padding-bottom:var(--s6)"><div class="shell"><div class="crumbs"><a href="index.html">홈</a><span><a href="estimate.html">셀프견적</a></span><span>견적 의뢰</span></div><h1 class="d-l" data-lines>계산 내역 그대로,<br>연락처만 더합니다.</h1><p class="lead-p">셀프견적 결과가 자동으로 첨부되어 다시 입력하지 않습니다. 담당자가 수량·단가·납기를 확인해 견적서를 보내 드립니다.</p></div></section>
<section class="sec--info" style="padding-top:0"><div class="shell form-wrap"><aside class="summary" id="q-summary"></aside><form class="form-grid" id="q-form" novalidate></form></div></section>
''')

PAGES['sample.html'] = ('sample', '샘플 신청 — ARGILO 아르길로', '질감 샘플을 골라 배송 정보를 입력하면 무료로 보내 드립니다.', 'light', True, '''
<section class="page-hero" style="padding-bottom:var(--s6)"><div class="shell"><div class="crumbs"><a href="index.html">홈</a><span>샘플 신청</span></div><h1 class="d-l" data-lines>화면의 색과<br>손의 질감은 다릅니다.</h1><p class="lead-p">조각 샘플을 무료로 보내 드립니다. 개인은 5개, 시공·설계 사업자는 10개까지. 택배사에는 배송 필드만 전달됩니다.</p></div></section>
<section class="sec--info" style="padding-top:0"><div class="shell form-wrap"><aside><div class="summary" id="s-list" style="position:static"></div><h3 class="t-s mt4 mb2">질감 고르기</h3><div class="pick-grid" id="s-pick"></div></aside><form class="form-grid" id="s-form" novalidate></form></div></section>
<section class="sec sec--light"><div class="shell split" style="align-items:center"><div data-reveal><img src="assets/img/samples-flatlay.webp" alt="오크 테이블 위에 놓인 여섯 가지 질감 샘플" loading="lazy" class="fade" style="width:100%"></div><div data-reveal><p class="eyebrow eyebrow--serif muted">After you receive</p><h2 class="h2 mt3">받아 보신 뒤가 진짜 상담입니다.</h2><p class="b-l muted mt4">수령 3일 뒤 담당자가 소감을 여쭙고, 마음에 드는 질감이 있으면 그 자재로 바로 셀프견적을 이어 갈 수 있습니다. 샘플 신청 이력은 연락처 단위로 묶여 두 번째 신청부터는 담당자가 먼저 알아봅니다.</p></div></div></section>
''')

PAGES['support.html'] = ('support', '고객센터 — 상담신청 · 카톡문의 · FAQ · ARGILO', '상담 신청, 카카오톡 채널, 샘플 신청, 자주 묻는 질문.', 'light', True, '''
<section class="page-hero"><div class="shell"><div class="crumbs"><a href="index.html">홈</a><span>고객센터</span></div><h1 class="d-l" data-lines>세 가지 길로<br>연결됩니다.</h1><p class="lead-p">급하면 카카오톡, 현장 정보를 남기려면 상담 신청, 실물이 궁금하면 샘플. 영업일 기준 4시간 안에 담당자가 연락드립니다.</p></div></section>
<section class="sec--info" style="padding-top:0"><div class="shell"><div class="ways" data-stagger="80">
  <a class="way way--kakao" data-kakao target="_blank" rel="noopener" data-reveal><svg viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M12 4C7 4 3 7.2 3 11.1c0 2.5 1.7 4.7 4.2 6L6.5 20l3.6-2.3c.6.1 1.2.2 1.9.2 5 0 9-3.2 9-7.1S17 4 12 4z"/></svg><h3>카카오톡 문의</h3><p>평일 10~18시 실시간 응대. 업무시간 외에는 자동응답이 접수 사실을 안내하고 다음 영업일에 회신합니다.</p><span class="btn btn--ink btn--sm">채널 열기 ↗</span></a>
  <a class="way" href="#consult" data-reveal><svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z M8 9h8M8 12h5"/></svg><h3>상담 신청</h3><p>시공 부위와 대략적인 면적만 알려 주셔도 됩니다. 정확한 치수를 아시면 셀프견적이 더 빠릅니다.</p><span class="btn btn--ghost btn--sm">아래 폼으로 →</span></a>
  <a class="way" href="sample.html" data-reveal><svg viewBox="0 0 24 24"><path d="M4 7h16v13H4zM4 7l2-3h12l2 3M9 11h6"/></svg><h3>샘플 신청</h3><p>조각 샘플 무료 발송. 개인 5개 · 사업자 10개. 영업일 2일 내 출고합니다.</p><span class="btn btn--sand btn--sm">샘플 고르기 →</span></a>
</div></div></section>
<section class="sec--info" id="consult"><div class="shell form-wrap"><div data-reveal><p class="eyebrow eyebrow--serif muted">Consultation</p><h2 class="h2 mt3">상담 신청</h2><p class="muted b-l mt4">접수 즉시 관리자 접수함에 올라가고 담당자 2명에게 알림이 갑니다. 알림 메일에는 이름 일부와 건수만 실립니다.</p><div class="tl mt5"><div><span>접수 직후</span><span>접수번호 발급 · 담당자 알림</span></div><div><span>4시간 이내</span><span>담당자 1차 연락 (영업일)</span></div><div><span>1영업일</span><span>자료·견적 회신</span></div></div></div><form class="form-grid" id="c-form" novalidate></form></div></section>
<section class="sec sec--light"><div class="shell"><div class="sec-head" data-reveal><h2 class="h2">자주 묻는 질문 <span class="muted" style="font-size:.5em;vertical-align:middle"><span id="faq-n">0</span>개</span></h2><div class="in-wrap" style="width:min(360px,100%)"><input id="faq-q" placeholder="외벽, 샘플, 성적서…" aria-label="FAQ 검색"><span class="unit">검색</span></div></div><div class="faq" id="faq"></div></div></section>
''')

PAGES['resources.html'] = ('resources', '자료실 — 인증/기술자료 · 시공가이드 · News · 카탈로그 · ARGILO', '시험성적서·시방서·시공 가이드·카탈로그 다운로드와 소식.', 'light', True, '''
<section class="page-hero"><div class="shell"><div class="crumbs"><a href="index.html">홈</a><span>자료실</span></div><h1 class="d-l" data-lines>스펙인에 필요한 것은<br>막지 않습니다.</h1><p class="lead-p">시험성적서와 시방서는 로그인 없이 바로 내려받습니다. 성적서에는 유효기간이 붙어 있고, 만료되면 목록에서 자동으로 내려갑니다.</p></div></section>
<section class="sec--info" style="padding-top:0"><div class="shell"><div class="res-tabs" role="tablist" id="res-tabs"></div><div class="res-bar" id="res-bar"></div><div id="res-body"></div></div></section>
<dialog id="gate" style="border:0;padding:0;background:var(--stone-50);color:var(--ink);box-shadow:0 30px 80px -20px rgba(0,0,0,.5)"></dialog>
''')

PAGES['resource.html'] = ('resource', '자료 상세 — ARGILO 아르길로', '자료·소식 상세.', 'light', True, '''
<section class="page-hero"><div class="shell col" id="res-detail" style="max-width:900px"></div></section>
''')

PAGES['privacy.html'] = ('privacy', '개인정보처리방침 — ARGILO 아르길로', '개인정보 수집·이용·위탁·파기 안내.', 'light', True, '''
<section class="page-hero"><div class="shell"><div class="crumbs"><a href="index.html">홈</a><span>개인정보처리방침</span></div><h1 class="d-l" data-lines>개인정보처리방침</h1><p class="lead-p" id="gen-at"></p></div></section>
<section class="sec--info" style="padding-top:0"><div class="shell col b-l" style="display:grid;gap:28px">
  <div><h2 class="h3">1. 수집 항목과 목적</h2><p class="muted mt2"><b id="company"></b>은 견적 의뢰·샘플 배송·상담 회신을 위해 이름·연락처·(샘플) 배송지·(사업자) 회사명·문의 내용·셀프견적 계산 내역을 수집합니다. 요청하신 서비스 이행에 필요한 범위(개인정보보호법 제15조①4호)에서 수집하며, 마케팅 수신은 별도로 선택 동의를 받습니다.</p></div>
  <div><h2 class="h3">2. 보유 기간</h2><p class="muted mt2">처리 완료 후 <b id="keep"></b>. 기간이 지나면 복구할 수 없는 방법으로 지체 없이(5일 이내) 파기하며, 파기 일시·건수·처리자를 기록합니다.</p></div>
  <div><h2 class="h3">3. 처리 위탁</h2><p class="muted mt2 mb2">아래 수탁자에게 업무를 위탁하며, 각 수탁자에게는 해당 업무에 필요한 항목만 전달합니다.</p><table class="variants" id="proc-table"></table></div>
  <div><h2 class="h3">4. 안전성 확보</h2><p class="muted mt2">관리자 접근은 이메일 인증을 거친 계정으로 제한하고, 접수 내역 열람·내려받기는 접속기록(1년 이상 보관)을 남깁니다. 알림 메일에는 이름 일부와 건수만 실립니다.</p></div>
  <div><h2 class="h3">5. 정보주체의 권리</h2><p class="muted mt2">열람·정정·삭제·처리정지를 요구하실 수 있습니다. 접수번호와 연락처 뒷자리로 본인 확인 후 처리합니다. 문의: 고객센터 상담 신청.</p></div>
  <p class="small">※ 데모 문안입니다. 실제 구축 시 의뢰자 법무 검토를 거쳐 확정합니다.</p>
</div></section>
''')

PAGES['done.html'] = ('done', '접수 완료 — ARGILO 아르길로', '접수가 완료되었습니다.', 'light', True, '''
<section class="shell"><div class="done-wrap" id="done" style="padding-top:calc(var(--hdr) + 72px)"></div></section>
''')

if __name__ == '__main__':
    for fn, (page, title, desc, theme, grid, body) in PAGES.items():
        with open(os.path.join(ROOT, fn), 'w', encoding='utf-8') as f:
            f.write(shell(page, title, desc, body, theme, grid))
        print('wrote', fn)
