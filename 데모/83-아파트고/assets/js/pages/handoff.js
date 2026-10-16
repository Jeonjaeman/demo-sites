/* G-04 Handoff — 납품 구조(HTML 기초 퍼블리싱 + Figma 보조) · Figma 플랜 진단(F5) · 토큰 1:1 대응표 · 네이밍 · 에셋 · 변경 이력 */
(function () {
  const { $, $$, esc, icon } = UI;
  UI.init();
  GuideNav.mount('handoff');
  const main = $('#main');
  let plan = 'starter';
  const cs = getComputedStyle(document.documentElement); const v = n => cs.getPropertyValue(n).trim();
  const TOKENS = [['color/brand', '--brand', 'colorBrand'], ['color/action', '--action', 'colorAction'], ['color/action/tint', '--action-tint', 'colorActionTint'], ['color/text/primary', '--ink', 'colorTextPrimary'], ['color/text/secondary', '--ink-2', 'colorTextSecondary'], ['color/line', '--line', 'colorLine'], ['color/up', '--up', 'colorUp'], ['color/down', '--down', 'colorDown'], ['type/h1', '--fs-h1', 'typeH1'], ['type/body', '--fs-body', 'typeBody'], ['space/4', '--sp-4', 'space4'], ['radius/lg', '--r-lg', 'radiusLg'], ['shadow/card-hover', '--sh-card-hover', 'shadowCardHover'], ['motion/ui', '--ease-ui', 'motionUi'], ['motion/reveal', '--ease-reveal', 'motionReveal'], ['layout/header', '--header-h', 'layoutHeader']];

  function render() {
    main.innerHTML = `
    <div class="page-head"><div><span class="eyebrow">디자인 가이드 · G-04</span><h1 class="h1">Handoff</h1><p class="muted body-sm mt-2">「퍼블리싱 제외 디자인 단독 과업」의 가장 큰 위험은 개발자가 Figma를 보고 다시 해석하는 일입니다. 그래서 공고의 결과물인 <strong>Figma 원본(Components · Variants · Variables · Dev Mode 주석)</strong>에 더해, 같은 토큰으로 만든 <strong>기초 퍼블리싱 HTML/CSS/상태 JS</strong>를 같은 금액에 추가로 드립니다. 마크업·스타일·상태 규칙은 그대로 쓰고, 컴포넌트 분해와 데이터 바인딩만 개발사가 합니다.</p></div></div>

    <section class="g-sec"><h2 class="h2">납품 구조 <span class="g-src">HTML 기초 퍼블리싱 = 이 데모의 구조 그대로</span></h2>
      <div class="filetree"><b>aptgo-renewal/</b>
├─ index.html · search.html · complex.html · plan.html · viewer.html · compare.html      <span style="color:var(--ink-3)">고객 23본</span>
├─ cart · checkout · pending · complete · failed · my · orders · order · refund · account
├─ login · signup · recover · 404.html · states.html
├─ admin.html                                                                              <span style="color:var(--ink-3)">관리자 11본 (해시 라우팅)</span>
├─ guide.html · components.html · patterns.html · handoff.html                             <span style="color:var(--ink-3)">가이드 4본</span>
└─ assets/
   ├─ css/tokens.css      <b>← Figma 변수와 1:1</b> (색·타이포·간격·radius·그림자·모션·레이아웃)
   ├─ css/base.css        리셋 · 공통 컴포넌트 (버튼·입력·칩·탭·배지·카드·표·모달·시트·토스트·스켈레톤·빈 상태)
   ├─ css/pages.css       화면별 레이아웃
   ├─ css/admin.css       관리자 스코프 (.admin-scope — 공개 사이트 타이포와 분리)
   ├─ js/data.js          샘플 데이터 + 도면 SVG 생성기 (실서비스에서는 API 응답으로 교체)
   ├─ js/store.js         상태 (실서비스에서는 서버 세션·DB로 교체)
   ├─ js/ui.js            헤더·푸터·토스트·모달·리빌·로딩 규칙
   └─ js/pages/*.js       화면별 상태 전환 로직</div>
      <div class="scope-line mt-4"><div class="in"><h4>포함 (500만 원 · VAT 별도)</h4><ul><li>고객 23본 · 관리자 11본 · 상태 6세트 · 가이드 4본의 HTML/CSS</li><li>8상태 컴포넌트 CSS · 반응형(375/768/1024/1280)</li><li>상태 전환 JS(탭·모달·시트·토스트·로딩·빈 상태·권한 게이트)</li><li>토큰 파일 · 아이콘 SVG · 생성 이미지 WebP</li><li><strong>Figma 원본(공고 결과물)</strong> — Foundations/Components/Customer-PC/Mobile/Admin/States 페이지 · Variants · Variables(토큰 1:1) · 캔버스 주석</li><li>핸드오프 세션 1회 · 질의 대응 4주</li></ul></div><div class="out"><h4>개발사 몫 (범위 밖)</h4><ul><li>백엔드·API·DB·결제(PG) 연동</li><li>실데이터 바인딩 · 로그인·세션 · 권한 서버 검증</li><li>컴포넌트 프레임워크(React/Vue 등)로의 분해·이식 — 마크업·스타일·상태 규칙은 그대로 쓰되 컴포넌트 분해는 개발사 몫, 변환 가이드 제공</li><li>도면 변환 파이프라인(DWG→SVF · 타일링) · 워터마크 서버 생성</li><li>호스팅·배포·모니터링</li></ul></div></div></section>

    <section class="g-sec"><h2 class="h2">Figma 원본 구조 · 플랜 진단 <span class="g-src">공고 결과물</span></h2><p class="g-desc">무료 뷰어는 기본 검사만 되고(Dev Mode 전체는 유료 좌석), Starter 팀은 파일 3개·파일당 3페이지 제한이 있습니다. 의뢰자 플랜을 고르면 납품 파일 구조가 바뀝니다. 어느 플랜이든 모든 스펙은 캔버스 위 주석으로 적어 Dev Mode 없이 읽히게 합니다.</p>
      <div class="a-card" style="box-shadow:var(--sh-line);border-radius:12px;padding:16px;margin-bottom:16px"><h3 class="h3 mb-3">Button 컴포넌트 Variants 표 (Figma)</h3><div class="table-wrap"><table class="table"><thead><tr><th>variant ×</th><th>default</th><th>hover</th><th>focus-visible</th><th>pressed</th><th>disabled</th><th>loading</th><th>error</th><th>selected</th></tr></thead><tbody>${['primary', 'secondary', 'ghost', 'danger'].map(v => `<tr><td><b>${v}</b></td>${['', 'hover', 'focus', 'pressed', 'disabled', 'loading', 'error', 'selected'].map(st => `<td><span class="btn btn-sm btn-${v} ${st === 'loading' ? 'is-loading' : ''} ${st === 'selected' ? 'is-selected' : ''} ${st === 'error' ? 'is-error' : ''}" style="pointer-events:none;${st === 'disabled' ? 'opacity:.45' : ''}${st === 'focus' ? 'outline:2px solid var(--focus);outline-offset:2px' : ''}${st === 'pressed' ? 'transform:scale(.96)' : ''}${st === 'hover' && v === 'primary' ? 'background:var(--action-hover)' : ''}">${v === 'primary' ? '결제' : v === 'secondary' ? '미리보기' : v === 'ghost' ? '더 담기' : '탈퇴'}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="micro muted-3 mt-2">Figma에서는 Type(4) × State(8) × Size(3) = 96 variants 한 컴포넌트 세트. 속성명은 코드 prop과 같은 variant · state · size. 이 표의 렌더가 그 Figma 세트의 원본입니다.</p></div>
      <div class="plan-diag"><label class="radio-card"><input type="radio" name="plan" value="starter" ${plan === 'starter' ? 'checked' : ''}><span class="rc-dot"></span><span><b>Starter (무료)</b><br><span class="body-sm muted">팀 파일 3개 · 파일당 3페이지 · 무료 뷰어 기본 검사</span></span></label><label class="radio-card"><input type="radio" name="plan" value="pro" ${plan === 'pro' ? 'checked' : ''}><span class="rc-dot"></span><span><b>Professional 이상</b><br><span class="body-sm muted">페이지 무제한 · 변수 모드 4 · Dev seat 가능</span></span></label></div>
      <div class="filetree">${plan === 'starter' ? `<b>파일 ①</b> Foundations · Components · Patterns            (3페이지)
<b>파일 ②</b> Customer-PC · Customer-Mobile · States          (3페이지)
<b>파일 ③</b> Admin · Flows · Handoff                          (3페이지)
<span style="color:var(--ink-3)">· 각 프레임 상단에 상태 배지 Draft / In review / Ready for dev (Dev Mode 없이 보이게)
· 납품 시 소유권을 의뢰자 팀으로 이전 — 체크리스트 포함</span>` : `<b>단일 파일</b>
00 Cover · 01 Read me · 02 Foundations · 03 Components · 04 Patterns
10 Customer-PC · 11 Customer-Mobile · 20 Admin · 30 States · 40 Flows · 90 Changelog
<span style="color:var(--ink-3)">· 변수 모드 4개 이내(라이트 1 + 관리자 1 + 예비 2) · Ready for dev 섹션 분리
· Dev seat가 있는 개발자는 Dev Mode로, 없는 개발자는 주석 프레임으로 읽음</span>`}</div></section>

    <section class="g-sec"><h2 class="h2">토큰 대응표 <span class="g-src">Figma 변수 = CSS 변수 = 코드 상수 · 값은 tokens.css에서 실시간</span></h2>
      <div class="table-wrap"><table class="table token-map"><thead><tr><th>Figma 변수</th><th>CSS 변수</th><th>코드 상수 (예: TS)</th><th>현재 값</th></tr></thead><tbody>${TOKENS.map(([f, c, j]) => `<tr><td>${f}</td><td>${c}</td><td>${j}</td><td>${esc(v(c))}</td></tr>`).join('')}</tbody></table></div>
      <p class="src-caption mt-3">전체 토큰은 <a href="guide.html" style="text-decoration:underline">Foundations</a>. 이름이 셋 중 하나라도 다르면 채팅·Figma·코드에서 서로 다른 말을 쓰게 됩니다(핸드오프 실패 유형).</p></section>

    <section class="g-sec"><h2 class="h2">네이밍 규칙</h2>
      <div class="table-wrap"><table class="table"><thead><tr><th>대상</th><th>규칙</th><th>예</th></tr></thead><tbody>
        <tr><td>컴포넌트</td><td>Category/Component · property는 개발 prop과 동일</td><td><code>Button</code> variant=primary · size=md · state=hover</td></tr>
        <tr><td>CSS 클래스</td><td>컴포넌트 = 명사 · 상태 = is-* · 변형 = 컴포넌트-변형</td><td><code>.btn.btn-primary.is-loading</code> · <code>.chip.is-active</code></td></tr>
        <tr><td>레이어</td><td>의미 이름 · Frame 123 금지</td><td><code>price-total</code> · <code>area-exclusive</code></td></tr>
        <tr><td>화면 ID</td><td>표면 접두 + 번호 · 상태 변형은 접미</td><td><code>C-09 단지 상세</code> · <code>C-09__empty</code> · <code>A-07__error</code></td></tr>
        <tr><td>아이콘</td><td>icon/크기/이름 · 24 그리드 · stroke 1.5 round</td><td><code>icon/24/zoom-in</code></td></tr>
        <tr><td>상태 데이터 속성</td><td>data-state · aria-* 우선</td><td><code>aria-pressed</code> · <code>aria-invalid</code> · <code>aria-current</code></td></tr></tbody></table></div></section>

    <section class="g-sec"><h2 class="h2">에셋 · 라이선스</h2>
      <div class="facts"><div class="fact-tile fact-row"><span class="fl">폰트</span><span class="fv">Pretendard Variable (SIL OFL) — 무료 · CDN 또는 셀프호스팅</span></div><div class="fact-tile fact-row"><span class="fl">아이콘</span><span class="fv">자체 제작 라인 아이콘 58종 SVG (24 grid · stroke 1.5) — 라이선스 이전</span></div><div class="fact-tile fact-row"><span class="fl">이미지</span><span class="fv">생성 이미지 5종 WebP (실존 단지·브랜드 아님) — 실서비스 사진으로 교체 권장</span></div><div class="fact-tile fact-row"><span class="fl">도면 샘플</span><span class="fv">SVG 생성기(가상) — 실도면 파이프라인으로 교체</span></div><div class="fact-tile fact-row"><span class="fl">Export</span><span class="fv">아이콘 SVG · 이미지 WebP 1x/2x · 일러스트 SVG</span></div><div class="fact-tile fact-row"><span class="fl">유료 자산</span><span class="fv">없음. 유료 폰트·이미지를 쓰게 되면 라이선스는 의뢰자 부담으로 명시</span></div></div></section>

    <section class="g-sec"><h2 class="h2">변경 이력 <span class="g-src">날짜 · 화면 · 내용 · 이유 · 개발 영향</span></h2>
      <div class="table-wrap"><table class="table changelog"><thead><tr><th>날짜</th><th>화면</th><th>변경</th><th>이유</th><th>개발 영향</th></tr></thead><tbody>
        <tr><td>2026.10.17</td><td>C-16</td><td>청약철회 동의 체크 미체크 시 결제 버튼 비활성</td><td>전자상거래법 17조 6항 · 증명책임</td><td><span class="badge badge-warn">있음</span> 동의 시각·IP 저장</td></tr>
        <tr><td>2026.10.17</td><td>C-12</td><td>방향 이동 버튼 · 키보드 조작 추가</td><td>WCAG 2.5.7 드래그 대안</td><td><span class="badge badge-warn">있음</span></td></tr>
        <tr><td>2026.10.17</td><td>C-07</td><td>동명이 단지 구분 줄(주소·준공·세대수)</td><td>1차/2차 오구매 → 환불 분쟁 1순위</td><td><span class="badge badge-outline">없음</span> 표시만</td></tr>
        <tr><td>2026.10.17</td><td>A-07</td><td>출처 유형·허락 근거 필수, 미입력 시 공개 비활성</td><td>대법원 2008도29 — 평면도 저작권 약함</td><td><span class="badge badge-warn">있음</span> 필드 추가</td></tr>
        <tr><td>2026.10.17</td><td>C-10</td><td>면적 ㎡ 기본 · 평은 토글 참고</td><td>계량법 비법정단위</td><td><span class="badge badge-outline">없음</span></td></tr></tbody></table></div></section>

    <section class="g-sec"><h2 class="h2">핸드오프 절차</h2>
      <div class="flow"><div class="fn"><b>1. 납품</b>HTML 번들 + Figma(요청 시) + 이 가이드<div class="fs">압축 파일 · 저장소</div></div><span class="fa">→</span><div class="fn"><b>2. 핸드오프 세션</b>화상 90분 · 화면 흐름 · 토큰 · 상태 규칙<div class="fs">녹화 제공</div></div><span class="fa">→</span><div class="fn rec"><b>3. 질의 대응</b>4주 · 이슈 단위로 답변·수정<div class="fs">변경 이력에 기록</div></div><span class="fa">→</span><div class="fn"><b>4. 디자인 QA</b>구현 결과를 가이드 기준으로 검수 1회<div class="fs">체크리스트</div></div></div></section>`;
    $$('input[name=plan]').forEach(r => r.addEventListener('change', () => { plan = r.value; render(); }));
  }
  render();
})();
