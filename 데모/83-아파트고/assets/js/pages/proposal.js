/* 제안 — 범위 계산기(F1) · 6주 승인 게이트(F18) · 뷰어 기능×구현 방식 매트릭스(F7) · 납품 범위 선 · 미팅 확인 항목 · 치명적 발견 요약 */
(function () {
  const { $, $$, esc, icon, fmt } = UI;
  UI.init();
  GuideNav.mount('proposal');
  const main = $('#main');
  const SCREENS = {
    'C 고객 (23)': [['C-01', '메인 홈'], ['C-02', '로그인'], ['C-03', '가입 ① 유형·고지'], ['C-04', '가입 ② 정보'], ['C-05', '가입 완료'], ['C-06', '계정 찾기'], ['C-07', '검색 결과(목록)'], ['C-08', '검색(지도 분할)'], ['C-09', '단지 상세'], ['C-10', '타입 상세'], ['C-11', '미리보기 모달'], ['C-12', '뷰어(데스크톱)'], ['C-13', '도면 비교'], ['C-14', '뷰어(모바일)'], ['C-15', '장바구니'], ['C-16', '주문서'], ['C-17', '입금 대기'], ['C-18', '결제 완료'], ['C-19', '결제 실패'], ['C-20', '내 도면함'], ['C-21', '주문 내역·상세'], ['C-22', '환불 신청'], ['C-23', '회원정보·탈퇴']],
    'A 관리자 (11)': [['A-01', '대시보드'], ['A-02', '회원 목록'], ['A-03', '회원 상세'], ['A-04', '단지 목록'], ['A-05', '단지 등록 폼'], ['A-06', '도면 목록'], ['A-07', '도면 등록 폼'], ['A-08', '도면 검수'], ['A-09', '주문 목록'], ['A-10', '주문 상세·환불'], ['A-11', '계정·권한']],
    'S 상태 (6)': [['S-01', '빈 화면 세트'], ['S-02', '404'], ['S-03', '로딩 세트'], ['S-04', '권한 없음 세트'], ['S-05', '500·점검'], ['S-06', '결제·다운로드 예외']],
    'G 가이드 (4)': [['G-01', 'Foundations'], ['G-02', 'Components'], ['G-03', 'Patterns'], ['G-04', 'Handoff']]
  };
  let sel = new Set(Object.values(SCREENS).flat().map(s => s[0])), mode = 'core', statesMode = 'pattern';
  const gates = JSON.parse(localStorage.getItem('aptgo.gates') || '{}');

  function calcBox() {
    const r = APT.calc.scope([...sel], mode, statesMode);
    const budget = 5000000; const days = Math.max(1, r.days); const rate = Math.round(budget / days / 10000) * 10000;
    return `<div class="calc-result"><span class="eyebrow">범위 계산</span><div class="cr-big mt-2">${r.frames}<span style="font-size:16px;font-weight:600;color:var(--ink-3)"> 프레임</span></div><p class="micro muted-3">선택 화면 ${sel.size}본 · 반응형 계수 ×${r.factor}</p>
      <h5 class="micro muted-3 mt-4" style="margin-bottom:6px">반응형 범위</h5><div class="seg" data-mode><button type="button" data-v="pc" aria-pressed="${mode === 'pc'}">PC만</button><button type="button" data-v="core" aria-pressed="${mode === 'core'}">PC + 핵심 모바일 10</button><button type="button" data-v="all" aria-pressed="${mode === 'all'}">PC + 전체 모바일</button></div>
      <h5 class="micro muted-3 mt-3" style="margin-bottom:6px">상태 화면</h5><div class="seg" data-states><button type="button" data-v="pattern" aria-pressed="${statesMode === 'pattern'}">패턴 1벌 + 규칙</button><button type="button" data-v="each" aria-pressed="${statesMode === 'each'}">화면마다 그림</button></div>
      <div class="mt-4"><div class="cr-row"><span>예상 공수</span><b>${r.days}일</b></div><div class="cr-row"><span>Figma + 기초 퍼블리싱</span><b>${fmt.won(budget)} <span class="micro muted-3">VAT 별도</span></b></div><div class="cr-row"><span>환산 단가</span><b>${fmt.won(rate)}/일</b></div><div class="cr-row"><span>기간</span><b>${r.days <= 30 ? '6주 이내' : r.days <= 38 ? '6주 (타이트)' : '6주 초과 — 1차/후속 분리'}</b></div></div>
      <p class="micro muted-3 mt-3">공고 예상금액 500만 원에 맞춘 산정입니다. 23본이 PC 기준인지 반응형 46프레임인지에 따라 공수가 2배 차이 나므로 첫 미팅에서 이 화면으로 기준을 확정합니다. 시장 관행은 「PC 10p + 모바일 10p = 20p」로 셉니다.</p></div>`;
  }
  function render() {
    main.innerHTML = `
    <div class="page-head"><div><span class="eyebrow">제안 · 아파트고 UI/UX 리뉴얼</span><h1 class="h1">범위 · 일정 · 납품의 선</h1><p class="muted body-sm mt-2">공고의 결과물인 <strong>Figma 원본</strong>에 더해, 같은 500만 원에 <strong>같은 토큰으로 만든 기초 퍼블리싱 HTML</strong>까지 납품합니다. 이 데모가 그 HTML 납품물의 축소판입니다. 아래는 첫 미팅에서 함께 확정할 것들입니다.</p></div><a class="btn btn-secondary btn-sm" href="index.html">데모 처음으로</a></div>

    <section class="g-sec"><h2 class="h2">1. 범위 계산기 <span class="g-src">화면 수를 세는 기준을 먼저 합의</span></h2>
      <div class="calc"><div class="calc-list">${Object.entries(SCREENS).map(([g, list]) => `<div class="calc-group"><h4>${g}<button type="button" class="caption" style="color:var(--action)" data-grp="${g}">전체 ${list.every(s => sel.has(s[0])) ? '해제' : '선택'}</button></h4>${list.map(([id, n]) => `<label><input type="checkbox" ${sel.has(id) ? 'checked' : ''} data-id="${id}"><span class="cid">${id}</span><span>${n}</span>${mode !== 'pc' && id[0] === 'C' && (mode === 'all' || ['C-01', 'C-02', 'C-07', 'C-09', 'C-10', 'C-12', 'C-14', 'C-15', 'C-16', 'C-20'].includes(id)) ? '<span class="badge badge-outline" style="margin-left:auto">+모바일</span>' : ''}</label>`).join('')}</div>`).join('')}</div>${calcBox()}</div></section>

    <section class="g-sec"><h2 class="h2">1-b. 현행 화면 진단 양식 <span class="g-src">수행 범위 「기존 화면 분석」 — 1주차 산출물</span></h2><p class="g-desc">리뉴얼 대상 페이지 리스트를 받으면 화면마다 아래 양식으로 진단합니다. 발견은 닐슨 10원칙으로 분류하고, 각 발견이 데모의 어느 화면에서 어떻게 해결됐는지 매핑합니다. 예시 1행은 가상의 현행 화면을 가정해 채웠습니다.</p>
      <div class="table-wrap"><table class="table"><thead><tr><th>AS-IS 화면</th><th>발견 (휴리스틱)</th><th>심각도</th><th>TO-BE 화면 ID</th><th>데모에서 확인</th></tr></thead><tbody>
        <tr><td><div style="width:120px;aspect-ratio:4/3;background:var(--surface-2);border-radius:6px;display:grid;place-items:center;font-size:11px;color:var(--ink-3)">AS-IS 캡처 자리</div><div class="micro muted-3 mt-1">단지 상세 (가상 예시)</div></td><td class="wrap" style="white-space:normal;max-width:320px">타입 탭이 7개를 넘으면 두 줄로 꺾이고, 가격이 「5,000원(VAT 별도)」로 표시됨 — #6 인식보다 회상 · #4 일관성(총액 규칙)</td><td><span class="badge badge-danger">상</span></td><td>C-09 · C-10</td><td><a href="complex.html?id=c90" style="color:var(--action);text-decoration:underline">극단값 단지 상세</a> 탭 넘침 처리 · VAT 포함 총액 컴포넌트</td></tr>
        <tr><td><div style="width:120px;aspect-ratio:4/3;background:var(--surface-2);border-radius:6px;display:grid;place-items:center;font-size:11px;color:var(--ink-3)">AS-IS 캡처 자리</div><div class="micro muted-3 mt-1">결제 완료 (가상 예시)</div></td><td class="wrap" style="white-space:normal;max-width:320px">결제 직후 도면이 바로 열려 「열람 시작」 시점이 기록되지 않음 — #1 시스템 상태 가시성 · 법적 요건(청약철회 증명)</td><td><span class="badge badge-danger">상</span></td><td>C-18 · C-21 · A-10</td><td><a href="complete.html" style="color:var(--action);text-decoration:underline">첫 열람 확인 모달</a> · 주문 상세 열람 배지</td></tr>
        <tr><td colspan="5" class="muted-3" style="text-align:center;padding:14px">… 리뉴얼 대상 페이지 리스트 수령 후 화면마다 1행씩 (1주차 게이트 산출물)</td></tr></tbody></table></div></section>

    <section class="g-sec"><h2 class="h2">2. 6주 승인 게이트 <span class="g-src">IT PM 경험 없음 → 승인 절차를 파트너가 설계</span></h2><p class="g-desc">게이트마다 체크리스트를 채우면 다음 단계가 열립니다. 게이트별 수정 2회, 주 1회 정기 리뷰(화상 30분). 톤앤매너는 2안 비교로 2주차에 확정합니다.</p>
      <div class="gates">${[['1주', '현황 분석·범위 확정', ['현행 화면·페이지 리스트 수령', '극단값 데이터 수집(최장 단지명·최다 타입)', '화면 수 기준·반응형 범위 서면 확정']], ['2주', '톤앤매너 2안', ['무드 2안 + 대표 화면 1장씩', '색·타이포 토큰 초안', '의뢰자 1안 선택']], ['3주', '대표 3화면 하이파이', ['메인·단지 상세·뷰어 승인', '컴포넌트 8상태 정의', '모션 토큰 확정']], ['4주', '고객 23본 확장', ['전 화면 HTML/CSS', '모바일 프레임(합의 범위)', '빈·로딩·권한 상태 적용']], ['5주', '관리자 11본 + 상태', ['관리자 스코프 토큰', '상태 매트릭스', '접근성 대비 검사']], ['6주', '가이드·핸드오프', ['가이드 4본', 'Figma 원본 정리(Variants·Variables·주석)', '핸드오프 세션 · 질의 대응 시작']]].map(([w, t, chk], i) => { const done = gates[i] && gates[i].length === chk.length; const locked = i > 0 && !(gates[i - 1] && gates[i - 1].length === chk.length); return `<div class="gate-card ${done ? 'is-done' : ''} ${locked ? 'is-locked' : ''}"><span class="gc-w">${w} · 게이트 ${i + 1}</span><b>${t}</b><div class="gc-chk">${chk.map((c, j) => `<label><input type="checkbox" ${gates[i] && gates[i].includes(j) ? 'checked' : ''} ${locked ? 'disabled' : ''} data-g="${i}" data-j="${j}"><span>${c}</span></label>`).join('')}</div></div>`; }).join('')}</div>
      <p class="src-caption mt-3">체크 상태는 이 브라우저에만 저장됩니다. 예전 공고(65명 지원 후 재등록)와 「세부 요구사항 준비 중」 단서로 보아, 범위를 단계별로 잠그지 않으면 45일 안에 끝나지 않습니다.</p></section>

    <section class="g-sec"><h2 class="h2">3. 도면 뷰어 — 기능 × 구현 방식 <span class="g-src">개발이 불가능한 기능을 그리지 않기 위해</span></h2><p class="g-desc">현재 뷰어가 단일 이미지인지, 타일 딥줌인지, 벡터인지에 따라 그릴 수 있는 기능이 다릅니다. 뷰어 화면에서 구현 방식을 바꾸면 버튼이 실제로 켜지고 꺼집니다. 미팅 확인 1순위 항목입니다.</p>
      <div class="table-wrap"><table class="table impl-table"><thead><tr><th>기능</th><th>단일 이미지(JPG)</th><th>타일 딥줌</th><th>벡터(SVG)</th><th>필요한 데이터 · 난이도</th></tr></thead><tbody>
        <tr><td>확대·이동·회전</td><td class="y">가능</td><td class="y">가능</td><td class="y">가능</td><td>— · 낮음</td></tr>
        <tr><td>모바일 고해상 (4000px↑)</td><td class="p">무거움</td><td class="y">가능</td><td class="y">가능</td><td>타일 피라미드 생성 · 중간</td></tr>
        <tr><td>실별 면적 레이어 토글</td><td class="n">불가</td><td class="n">불가</td><td class="y">가능</td><td>실 폴리곤 좌표 · 중간</td></tr>
        <tr><td>방 클릭 → 면적 하이라이트·합산</td><td class="n">불가</td><td class="n">불가</td><td class="y">가능</td><td>실 폴리곤 + 면적 · 중간</td></tr>
        <tr><td>치수 측정</td><td class="n">불가</td><td class="p">축척 있으면</td><td class="y">가능</td><td>축척(px/m) · 낮음~중간</td></tr>
        <tr><td>다이내믹 워터마크</td><td class="y">서버 합성</td><td class="y">타일 합성</td><td class="y">오버레이</td><td>구매자 ID 주입 · 낮음</td></tr>
        <tr><td>DWG 열람</td><td colspan="3" class="p">브라우저 직접 불가 — 서버에서 SVF 등으로 변환 후 렌더</td><td>변환 파이프라인 · 높음</td></tr></tbody></table></div>
      <div class="row gap-2 mt-3"><a class="btn btn-sm btn-secondary" href="viewer.html?id=c01-84A">뷰어에서 구현 방식 바꿔 보기</a></div></section>

    <section class="g-sec"><h2 class="h2">4. 납품 범위의 선</h2>
      <div class="scope-line"><div class="in"><h4>이 금액에 포함</h4><ul><li>고객 23본 · 관리자 11본 · 상태 6세트 · 가이드 4본 — <strong>HTML/CSS + 상태 전환 JS + 반응형</strong></li><li>디자인 토큰 파일(Figma 변수 1:1) · 8상태 컴포넌트 · 접근성 대비 검사</li><li>법적 UI 규칙 반영(총액·동의·청약철회 고지·㎡ 표기·단계 수)</li><li><strong>Figma 원본</strong>(Components·Variants·Variables·캔버스 주석) · 핸드오프 세션 90분 · 4주 질의 대응 · 디자인 QA 1회</li></ul></div><div class="out"><h4>개발사·의뢰자 몫</h4><ul><li>백엔드·API·DB·PG 연동 · 실데이터 바인딩 · 세션·권한 서버 검증</li><li>컴포넌트 프레임워크로의 분해·이식(마크업·스타일·상태 규칙은 그대로, 변환 가이드 제공)</li><li>도면 변환·타일링·워터마크 서버 · 호스팅·배포</li><li>법적 판단 책임(약관·청약철회 문구 최종 검토) · 사업자 명의 신고(위치기반 등)</li></ul></div></div></section>

    <section class="g-sec"><h2 class="h2">5. 리서치에서 나온 치명적 발견 → 데모에 구현한 것</h2>
      <div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>발견</th><th>근거</th><th>데모에서 확인</th></tr></thead><tbody>
        <tr><td>F2</td><td>「열람 후 환불 불가」 고지만으로는 청약철회 제한이 성립하지 않음 — 미리보기가 법적 요건, 다건 구매는 미열람분 환불, 증명책임은 사업자</td><td>전자상거래법 17조 2항 5호·6항 · 시행령 21조의2 · 대법원 2018다214746</td><td><a href="checkout.html">주문서 동의</a> · <a href="viewer.html?id=c01-84B">첫 열람 확인</a> · <a href="orders.html">도면별 환불</a> · 관리자 A-10</td></tr>
        <tr><td>F1</td><td>화면 수 기준 없음 — 예전 공고는 「반응형웹」, 관행은 PC+모바일 각각 카운트 → 23본이 46프레임이 될 수 있음</td><td>wishket 158550 · kmong 135563</td><td>위 범위 계산기</td></tr>
        <tr><td>F7</td><td>뷰어 구현 방식에 따라 그릴 수 있는 기능이 다름 — DWG는 브라우저에서 바로 안 열림</td><td>Autodesk APS · OpenSeadragon</td><td><a href="viewer.html?id=c01-84A">뷰어 구현 토글</a> · 위 매트릭스</td></tr>
        <tr><td>F5</td><td>Figma만 넘기면 개발자가 못 읽을 수 있음 — 무료 뷰어 기본 검사만, Starter 3파일×3페이지</td><td>figma.com/pricing-faq · Starter plan</td><td><a href="handoff.html">Figma 원본 + 같은 토큰의 HTML 추가 납품 · 플랜 진단</a></td></tr>
        <tr><td>F6</td><td>아파트 평면도는 저작권 보호가 약함(아파트백과 사건) → 약관·워터마크·DB권·출처 근거로 보호</td><td>대법원 2008도29</td><td>관리자 A-07 출처 필수 · <a href="viewer.html?id=c01-84A">워터마크</a> · <a href="plan.html?id=c01-84A#license">이용 범위 카드</a></td></tr>
        <tr><td>F4</td><td>실데이터가 새 레이아웃에 안 담김 — 최장 단지명 25자, 84개동, 타입 18개</td><td>이투데이 · 헬리오시티</td><td>검토 패널 「극단값」 → <a href="search.html">검색</a> · <a href="complex.html?id=c90">단지 상세</a></td></tr>
        <tr><td>F3</td><td>장바구니·결제는 2025.02 다크패턴 규제 대상 — 총액·사전선택·버튼 위계·탈퇴 단계</td><td>개정 전자상거래법 21조의2</td><td><a href="patterns.html">Do/Don't</a> · <a href="account.html">탈퇴 2단계</a></td></tr>
        <tr><td>F8·F9·F10</td><td>필수 동의 체크 → 고지 전환 · 웹접근성 법인 의무(드래그 대안) · 평 단독 표기 금지</td><td>개인정보위 2024.9 · 장차법 · 계량법</td><td><a href="signup.html">가입 고지 카드</a> · 뷰어 방향 버튼 · ㎡ 컴포넌트</td></tr></tbody></table></div>
      <p class="src-caption mt-3">전체 18건과 근거 URL은 분석 문서(기획_설계.md)에 있습니다. 여기 적은 것은 화면으로 확인할 수 있는 것만입니다.</p></section>

    <section class="g-sec"><h2 class="h2">6. 첫 미팅에서 확인할 것</h2>
      <ol class="stack" style="counter-reset:q;padding-left:0">${['화면 수를 세는 기준 — PC 기준 23본인가, PC+모바일인가. 상태 화면은 포함인가 별도인가', '도면 뷰어의 현재 구현 방식(단일 JPG / PDF / 타일 / DWG 변환)과 판매 포맷', '결제수단(가상계좌 포함 여부)과 「제공 개시」 기준 — 뷰어 첫 오픈인가, 다운로드인가', '비회원 구매 허용 여부 · 다운로드 기한·횟수 · 환불 처리 기간', '도면 출처(자체 재작도 / 건설사 허락 / 카탈로그)와 현행 약관', '관리자 역할 수와 고객 등급(개인/사업자) · 콘텐츠 관리의 범위(공지·FAQ·배너·1:1 문의 포함 여부 — 11본 밖이면 후속 산정)', '퍼블리싱 담당(내부 / 외주 개발사)과 개발 스택 — 컴포넌트 변환 가이드 방향', 'Figma 플랜·소유권 이전 · 기존 브랜드 자산(로고·색·폰트 라이선스)', '검토 주기·수정 횟수 · 핸드오프 후 질의 대응 기간', '시세·실거래 노출 여부(출처·해제 표기) · 「내 주변」 기능 계획(위치기반 신고)'].map((q, i) => `<li style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)"><span class="badge badge-brand" style="flex:none">${i + 1}</span><span class="body-sm">${q}</span></li>`).join('')}</ol></section>`;
    $$('[data-id]').forEach(cb => cb.addEventListener('change', () => { cb.checked ? sel.add(cb.dataset.id) : sel.delete(cb.dataset.id); render(); }));
    $$('[data-grp]').forEach(b => b.addEventListener('click', () => { const list = SCREENS[b.dataset.grp]; const all = list.every(s => sel.has(s[0])); list.forEach(s => all ? sel.delete(s[0]) : sel.add(s[0])); render(); }));
    const ms = $('[data-mode]'); UI.seg(ms); ms.addEventListener('segchange', e => { mode = e.detail; render(); });
    const ss = $('[data-states]'); UI.seg(ss); ss.addEventListener('segchange', e => { statesMode = e.detail; render(); });
    $$('[data-g]').forEach(cb => cb.addEventListener('change', () => { const g = +cb.dataset.g, j = +cb.dataset.j; gates[g] = gates[g] || []; if (cb.checked) { if (!gates[g].includes(j)) gates[g].push(j); } else gates[g] = gates[g].filter(x => x !== j); localStorage.setItem('aptgo.gates', JSON.stringify(gates)); render(); const card = $$('.gate-card')[g]; if (card.classList.contains('is-done')) UI.toast(`게이트 ${g + 1} 통과 — 다음 단계가 열렸습니다`, { type: 'pos', icon: 'check' }); }));
  }
  render();
})();
