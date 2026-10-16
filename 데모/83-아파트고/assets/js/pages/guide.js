/* G-01 Foundations — 색 토큰(실측 출처) · 대비 검사기(실제 계산) · 타이포 스케일 · 간격 · radius · 그림자 · 모션(실행 버튼) · 브레이크포인트
   모든 값은 tokens.css에서 getComputedStyle로 읽어 표시 — 문서와 코드가 어긋날 수 없음 */
(function () {
  const { $, $$, esc, icon } = UI;
  UI.init();
  GuideNav.mount('guide');
  const main = $('#main');
  const cs = getComputedStyle(document.documentElement);
  const v = n => cs.getPropertyValue(n).trim();

  const COLORS = [
    ['color/bg', '--bg', '호갱노노 body · Zillow'], ['color/surface/1', '--surface-1', 'Zillow 사실 타일 #f9f9fb'], ['color/surface/2', '--surface-2', '호갱노노 검색칸 #f1f1f2'], ['color/surface/3', '--surface-3', 'RISE gray100'], ['color/surface/brand', '--surface-brand', 'Realevate 스크롤 후 배경'],
    ['color/line', '--line', '호갱노노 칩 inset 1px'], ['color/line/strong', '--line-strong', 'Rightmove 카드 경계'],
    ['color/text/primary', '--ink', '호갱노노 본문 · 17.7:1'], ['color/text/secondary', '--ink-2', 'Zillow 주소'], ['color/text/tertiary', '--ink-3', '호갱노노 비활성 탭 · 4.8:1'], ['color/text/decor', '--ink-4', 'RISE gray400 · 본문 금지'],
    ['color/brand', '--brand', 'Realevate --brand-navy (SOTD 26.09.27)'], ['color/brand/muted', '--brand-muted', 'Realevate --muted'], ['color/action', '--action', 'Zillow 주 버튼 · 7.6:1'], ['color/action/tint', '--action-tint', 'Zillow 활성 필터'],
    ['color/up', '--up', 'RISE #ff3c3c → 4.8:1 보정(계산)'], ['color/down', '--down', 'RISE #3e8bff → 5.2:1 보정(계산)'], ['color/live', '--live', '호갱노노 실시간 배지'], ['color/positive', '--positive', '호갱노노 대출계산기'], ['color/warn', '--warn', '보조 상태색'], ['color/danger', '--danger', '보조 상태색']
  ];
  const TYPES = [['display-xl', '공개 홈 히어로', 'Realevate h2 5.2vw=74.9px@1440 −0.02em · Cerebrium lh 1.0~1.05 · 한글은 700으로 보정'], ['display', '섹션 대제목', 'Cerebrium sticky 인덱스 54px/1.15'], ['h1', '페이지 제목', 'RISE 섹션 제목 32/1.3'], ['h2', '섹션 제목', 'RISE 카드 24 · Zillow H2 24'], ['h3', '카드 제목', 'Rightmove H2 20/28'], ['num-hero', '상세 대표 수치', 'Zillow 상세 가격 36/900'], ['num-lg', '카드·표 대표 수치', '호갱노노 평균가 22/700'], ['num-md', '카드 가격', 'Zillow 카드 20/700'], ['body-lg', '리드', 'Cerebrium 리드 18'], ['body', '본문', 'Zillow 16/24 · Realevate −0.01em'], ['body-sm', '메타', 'RISE 라벨 14/20'], ['caption', '배지·핀', '호갱노노 13/600'], ['micro', '팩트 라벨', 'Rightmove 12/16 · Shopify 12/16']];
  const MOTION = [['motion/ui', '--ease-ui', '150ms', '버튼·칩 색/바탕', '호갱노노 .15s cubic-bezier(.4,0,.2,1)'], ['motion/std', '--ease-std', '200ms', '필터 활성·포커스', 'Zillow .2s cubic-bezier(.25,.1,.25,1)'], ['motion/out-quart', '--ease-out-quart', '200ms', '탭·세그먼트 글자', 'RISE cubic-bezier(.33,1,.68,1)'], ['motion/reveal', '--ease-reveal', '650ms · stagger 150', '스크롤 리빌', 'RISE (GDWEB 26.09.29)'], ['motion/sheet', '--ease-sheet', '500ms', '바텀시트·드로어', '호갱노노 vaul cubic-bezier(.32,.72,0,1)'], ['motion/editorial', '--ease-editorial', '700ms', '공개 홈 라인 리빌', 'Realevate cubic-bezier(.7,.6,0,1)'], ['motion/media', '--ease-media', '800ms', '이미지 카드 호버', 'Realevate cubic-bezier(.18,.13,0,.99)'], ['motion/data', '--ease-data', '250~1200ms 값 비례', '막대 성장·세그먼트', 'Cerebrium cubic-bezier(0,0,.2,1)']];

  function curveSVG(bez) {
    const m = bez.match(/[\d.]+/g); if (!m) return '';
    const [x1, y1, x2, y2] = m.map(Number);
    return `<svg class="mo-curve" viewBox="0 0 100 60" preserveAspectRatio="none"><path d="M0 60 C ${x1 * 100} ${60 - y1 * 60}, ${x2 * 100} ${60 - y2 * 60}, 100 0" fill="none" stroke="var(--action)" stroke-width="2"/><line x1="0" y1="60" x2="${x1 * 100}" y2="${60 - y1 * 60}" stroke="var(--ink-4)" stroke-width="1"/><line x1="100" y1="0" x2="${x2 * 100}" y2="${60 - y2 * 60}" stroke="var(--ink-4)" stroke-width="1"/></svg>`;
  }

  main.innerHTML = `
  <div class="page-head"><div><span class="eyebrow">디자인 가이드 · G-01</span><h1 class="h1">Foundations</h1><p class="muted body-sm mt-2">아래 값은 문서에 적어 둔 것이 아니라 이 사이트의 <code>tokens.css</code>를 실행 시점에 읽어 표시합니다. Figma 변수명 = CSS 변수명 = 코드 상수명이 1:1로 대응합니다. 각 값의 출처는 실측 레퍼런스입니다.</p></div><a class="btn btn-secondary btn-sm" href="handoff.html">토큰 대응표 →</a></div>

  <section class="g-sec" id="color"><h2 class="h2">색 <span class="g-src">호갱노노 · Zillow · Rightmove 실측 + Realevate · RISE 어워드</span></h2><p class="g-desc">브랜드 1색(네이비) + 액션 1색(블루) + 시세 2색(상승 빨강·하락 파랑, 국내 관행) + 그레이스케일. 장식 색은 본문에 쓰지 않습니다.</p>
    <div class="swatches">${COLORS.map(([n, c, s]) => { const val = v(c); const dark = APT.calc.luminance(val) < .4; return `<div class="sw"><div class="sw-c" style="background:${val};color:${dark ? '#fff' : 'var(--ink)'}">${APT.calc.contrast(val, '#ffffff')}:1 on white</div><div class="sw-b"><div class="sw-n">${n}</div><div class="sw-v">${c} · ${val}</div><div class="sw-s">${s}</div></div></div>`; }).join('')}</div></section>

  <section class="g-sec" id="contrast"><h2 class="h2">명도 대비 검사기 <span class="g-src">WCAG 2.2 AA · 실제 계산</span></h2><p class="g-desc">텍스트 4.5:1, 큰 글자(24px↑ 또는 19px 굵게)·UI 경계 3:1. 토큰 조합을 고르면 계산 결과가 바로 바뀝니다. 장애인차별금지법상 법인의 웹접근성은 의무입니다.</p>
    <div class="contrast"><div class="ct-form"><div class="row gap-3"><div class="field flex-1"><label>글자</label><select class="select" id="ct-fg">${COLORS.map(c => `<option value="${v(c[1])}" ${c[1] === '--ink' ? 'selected' : ''}>${c[0]} ${v(c[1])}</option>`).join('')}</select></div><div class="field flex-1"><label>바탕</label><select class="select" id="ct-bg">${COLORS.map(c => `<option value="${v(c[1])}" ${c[1] === '--bg' ? 'selected' : ''}>${c[0]} ${v(c[1])}</option>`).join('')}</select></div></div><div class="row gap-3"><div class="field flex-1"><label>직접 입력 (글자)</label><input class="input" id="ct-fg2" placeholder="#1f2b5e"></div><div class="field flex-1"><label>직접 입력 (바탕)</label><input class="input" id="ct-bg2" placeholder="#ffffff"></div></div><div class="ct-result" id="ct-res"></div></div>
    <div class="ct-preview" id="ct-prev"><span style="font-size:14px">본문 14px — 도면은 분양 도면 또는 재작도 기준이며 실제 세대와 다를 수 있습니다.</span><span style="font-size:24px;font-weight:700">큰 글자 24px 700 — 전용 84.97㎡</span><span style="font-size:13px;font-weight:600">캡션 13px 600 · 구매함</span></div></div>
    <div class="ct-matrix table-wrap"><table class="table"><thead><tr><th>글자 \\ 바탕</th>${['--bg', '--surface-1', '--surface-2', '--surface-brand', '--brand', '--action'].map(b => `<th>${b}</th>`).join('')}</tr></thead><tbody>${['--ink', '--ink-2', '--ink-3', '--ink-4', '--brand', '--action', '--up', '--down', '--ink-inverse'].map(f => `<tr><td style="text-align:left;font-family:ui-monospace,monospace;font-size:12px">${f}</td>${['--bg', '--surface-1', '--surface-2', '--surface-brand', '--brand', '--action'].map(b => { const r = APT.calc.contrast(v(f), v(b)); return `<td><span class="${r >= 4.5 ? 'pass' : r >= 3 ? 'large' : 'fail'}" title="${f} on ${b}">${r}</span></td>`; }).join('')}</tr>`).join('')}</tbody></table><p class="src-caption mt-2">초록 = 본문 가능(4.5:1↑) · 노랑 = 큰 글자·UI 경계만(3:1↑) · 빨강 = 사용 금지. --ink-4는 장식 전용임이 표에서 드러납니다.</p></div></section>

  <section class="g-sec" id="type"><h2 class="h2">타이포 스케일 <span class="g-src">Pretendard (SIL OFL) · 수치 tabular-nums</span></h2><p class="g-desc">수상작의 유료 폰트는 가져올 수 없으므로 메트릭만 em 비율로 이식했습니다. 디스플레이는 letter-spacing −0.03em, 본문 −0.01em. 가격은 언제나 1순위 타이포(업계 공통 문법).</p>
    ${TYPES.map(([k, u, s]) => { const fs = v('--fs-' + k), lh = v('--lh-' + k), ls = v('--ls-' + k); return `<div class="type-row"><div class="tr-meta"><b>type/${k} · ${u}</b>${fs}${lh ? ' / lh ' + lh : ''}${ls ? ' / ls ' + ls : ''}<br><span style="color:var(--ink-4)">${s}</span></div><div class="${k}" style="${k === 'display-xl' ? 'color:var(--brand)' : ''}">${k.startsWith('num') ? '84.97㎡ · 16,500원' : '단지를 찾고, 타입을 고르고, 도면을 바로 엽니다'}</div></div>`; }).join('')}</section>

  <section class="g-sec" id="space"><h2 class="h2">간격 · radius · 그림자 <span class="g-src">4px 기반 · Zillow 8 · RISE 20 · Shopify 12</span></h2>
    <div class="space-row">${[1, 2, 3, 4, 5, 6, 8, 12, 16, 24, 32].map(n => `<div><i style="width:${v('--sp-' + n)};height:${v('--sp-' + n)}"></i>space/${n} ${v('--sp-' + n)}</div>`).join('')}</div>
    <h3 class="h3 mt-8 mb-3">radius</h3><div class="radius-row">${['xs', 'sm', 'md', 'lg', 'xl'].map(r => `<div style="border-radius:${v('--r-' + r)}">radius/${r}<br>${v('--r-' + r)}</div>`).join('')}<div style="border-radius:999px">radius/pill<br>999</div></div>
    <h3 class="h3 mt-8 mb-3">elevation</h3><div class="shadow-row">${[['line', '칩·카드 기본 (호갱노노)'], ['active', '활성 필터 (Zillow)'], ['float', '지도 컨트롤 (호갱노노)'], ['card-hover', '카드 호버 (Zillow)'], ['sticky', 'aside·팝오버 (Rightmove)'], ['zoom', '뷰어 버튼 (Zillow)'], ['modal', '모달']].map(([s, d]) => `<div style="box-shadow:${v('--sh-' + s)}">sh/${s}<br><span style="font-size:10px;color:var(--ink-3)">${d}</span></div>`).join('')}</div></section>

  <section class="g-sec" id="motion"><h2 class="h2">모션 <span class="g-src">실측 이징 8종 · 실행해 보기</span></h2><p class="g-desc">「살짝」「부드럽게」 같은 명세는 개발자가 해석해야 합니다. 여기서는 cubic-bezier·ms·stagger를 그대로 적고 버튼으로 재생합니다. <code>prefers-reduced-motion</code>에서는 리빌·막대·에디토리얼을 끄고 색 전환만 남깁니다. <code>transition: all</code>은 금지.</p>
    <div class="motion-grid">${MOTION.map(([n, c, d, use, src]) => `<div class="mo"><div class="mo-h"><span class="mo-n">${n}</span><button class="btn btn-sm btn-secondary" data-play="${c}" data-d="${parseInt(d)}">재생</button></div><div class="mo-v">${c}: ${v(c)}<br>${d} · ${use}<br><span style="color:var(--ink-4)">${src}</span></div>${curveSVG(v(c))}<div class="mo-stage"><div class="mo-ball" data-ball></div></div></div>`).join('')}</div>
    <div class="mo mt-4"><div class="mo-h"><span class="mo-n">motion/data · 값 비례 막대 (Cerebrium)</span><button class="btn btn-sm btn-secondary" data-bars>재생</button></div><div class="mo-v">width 전환 시간 = 250ms + 값 비율 × 950ms (상한 1.2s) · cubic-bezier(0,0,.2,1)</div>${[['전용 84.97㎡', 84.97, 150], ['공급 113.06㎡', 113.06, 150], ['계약 150.21㎡', 150.21, 150]].map(([l, x, m]) => `<div class="row gap-3 mt-2"><span class="body-sm" style="width:120px">${l}</span><div class="mo-bar" style="position:static;flex:1"><i data-w="${x / m * 100}" style="transition:width ${(250 + x / m * 950).toFixed(0)}ms var(--ease-data)"></i></div></div>`).join('')}</div></section>

  <section class="g-sec" id="layout"><h2 class="h2">브레이크포인트 · 그리드 <span class="g-src">호갱노노 Tailwind 640/768/1024/1280 · RISE 1023</span></h2>
    <div class="table-wrap"><table class="table bp-table"><thead><tr><th>토큰</th><th>폭</th><th>컬럼</th><th>거터</th><th>컨테이너</th><th>전환 규칙</th></tr></thead><tbody>
      <tr><td>bp/mobile</td><td>375~639</td><td>4</td><td>16</td><td>100% − 32</td><td>필터 → 바텀시트 · 뷰어 툴바 하단 가로 · 관리자 표 → 데스크톱 전용 안내</td></tr>
      <tr><td>bp/tablet</td><td>640~1023</td><td>8</td><td>20</td><td>100% − 40</td><td>카드 2열 · 지도 분할 → 상하 분할</td></tr>
      <tr><td>bp/desktop</td><td>1024~1279</td><td>12</td><td>24</td><td>1200</td><td>패널 400 + 지도 · 상세 2열(aside 372 sticky)</td></tr>
      <tr><td>bp/wide</td><td>1280↑</td><td>12</td><td>24</td><td>1200 (목록 1400)</td><td>관리자 사이드바 240 고정</td></tr></tbody></table></div>
    <div class="grid-demo">${Array.from({ length: 12 }, (_, i) => `<i>${i + 1}</i>`).join('')}</div>
    <p class="src-caption mt-3">헤더 64 (모바일 56) · 검색 패널 400 · 뷰어 레일 216 · 터치 타겟 44 · 포커스 링 2px + offset 2px</p></section>`;

  /* 대비 검사기 */
  function ct() {
    const fg = ($('#ct-fg2').value.match(/^#[0-9a-f]{6}$/i) ? $('#ct-fg2').value : $('#ct-fg').value), bg = ($('#ct-bg2').value.match(/^#[0-9a-f]{6}$/i) ? $('#ct-bg2').value : $('#ct-bg').value);
    const r = APT.calc.contrast(fg, bg); $('#ct-prev').style.cssText = `background:${bg};color:${fg}`;
    $('#ct-res').innerHTML = `<div><b>${r}:1</b>대비</div><div class="${r >= 4.5 ? 'ok' : 'ng'}"><b>${r >= 4.5 ? '통과' : '실패'}</b>본문 4.5:1</div><div class="${r >= 3 ? 'ok' : 'ng'}"><b>${r >= 3 ? '통과' : '실패'}</b>큰 글자·UI 3:1</div>`;
  }
  ['#ct-fg', '#ct-bg', '#ct-fg2', '#ct-bg2'].forEach(s => $(s).addEventListener('input', ct)); ct();
  /* 모션 재생 */
  $$('[data-play]').forEach(b => b.addEventListener('click', () => { const ball = $('[data-ball]', b.closest('.mo')); const stage = ball.parentElement; ball.style.transition = 'none'; ball.style.transform = 'translateX(0)'; requestAnimationFrame(() => requestAnimationFrame(() => { ball.style.transition = `transform ${b.dataset.d}ms ${v(b.dataset.play)}`; ball.style.transform = `translateX(${stage.clientWidth - 40}px)`; })); }));
  $('[data-bars]').addEventListener('click', e => { $$('.mo-bar i', e.currentTarget.closest('.mo')).forEach(i => { i.style.width = '0'; requestAnimationFrame(() => requestAnimationFrame(() => i.style.width = i.dataset.w + '%')); }); });
  setTimeout(() => $$('[data-bars]').forEach(b => b.click()), 600);
})();
