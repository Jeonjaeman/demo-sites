/* G-03 Patterns — 흐름도 3종 · 법적 UI 규칙(Do/Don't) · 반응형 변환 규칙 · 콘텐츠·데이터 규칙 · 버튼 위계·단계 수 */
(function () {
  const { $, $$, esc, icon, fmt } = UI;
  UI.init();
  GuideNav.mount('patterns');
  const main = $('#main');
  const flow = (nodes) => `<div class="flow">${nodes.map((n, i) => `${i ? '<span class="fa">→</span>' : ''}<div class="fn ${n[2] || ''}"><b>${n[0]}</b>${n[1]}${n[3] ? `<div class="fs">${n[3]}</div>` : ''}</div>`).join('')}</div>`;
  main.innerHTML = `
  <div class="page-head"><div><span class="eyebrow">디자인 가이드 · G-03</span><h1 class="h1">Patterns</h1><p class="muted body-sm mt-2">화면을 넘기는 규칙입니다. 흐름도의 노란 노드는 법 조항이 요구하는 단계, 파란 노드는 기록이 남는 단계입니다. 모든 노드는 데모의 실제 화면으로 연결됩니다.</p></div></div>

  <section class="g-sec"><h2 class="h2">흐름 ① 검색 → 미리보기 → 구매 → 열람 <span class="g-src">C-01 → C-07 → C-09 → C-10/11 → C-15 → C-16 → C-18 → C-12</span></h2>
    ${flow([['검색', '단지명·주소 · 동명이 단지 구분', '', 'C-07'], ['단지 상세', '타입 탭 · 배치도', '', 'C-09'], ['미리보기', '시험 사용 (법적 요건)', 'law', 'C-11 · 시행령 21조의2'], ['장바구니', '묶음 할인 · 이중 결제 경고', '', 'C-15'], ['주문서', '총액 · 동의 체크 · 최종 확인', 'law', 'C-16 · 17조 6항 · 7조'], ['결제 완료', '동의 시각·IP 기록', 'rec', 'C-18'], ['첫 열람 확인', '"지금 열면 환불 불가"', 'law', 'C-18 모달'], ['뷰어', '열람 시각 기록 · 워터마크', 'rec', 'C-12']])}
    <div class="row gap-2 mt-4"><a class="btn btn-sm btn-secondary" href="plan.html?id=c01-59B#preview">미리보기 모달 열기</a><a class="btn btn-sm btn-secondary" href="checkout.html">주문서</a><a class="btn btn-sm btn-secondary" href="viewer.html?id=c01-84B">첫 열람 확인 모달</a></div></section>

  <section class="g-sec"><h2 class="h2">흐름 ② 환불(청약철회) <span class="g-src">C-21 → C-22 → A-10</span></h2>
    ${flow([['주문 상세', '도면별 열람 상태 배지', 'rec', 'C-21'], ['환불 신청', '미열람만 선택 가능 · 예정액 계산', 'law', 'C-22 · 가분적 콘텐츠'], ['접수', '사유 · 영업일 3일', '', ''], ['관리자 검토', '동의 시각 · 열람 시각 · 다운로드 횟수 대조', 'rec', 'A-10 · 증명책임'], ['환급', '결제수단으로', '', '']])}
    <p class="src-caption mt-3">환불 2단계(선택 → 신청)는 결제 3단계보다 짧아야 합니다 — 취소·탈퇴 절차가 구매·가입보다 복잡하면 다크패턴(2025.02 시행 전자상거래법).</p></section>

  <section class="g-sec"><h2 class="h2">흐름 ③ 관리자 등록 → 검수 → 공개 <span class="g-src">A-05 → A-07 → A-08 → A-06</span></h2>
    ${flow([['단지 등록', '㎡ 입력 · 평 자동 환산 · 중복 경고', '', 'A-05'], ['도면 업로드', '진행률 · 타입 매핑', '', 'A-07'], ['출처 입력', '출처 유형 · 허락 근거 필수', 'law', 'A-07 · 대법원 2008도29'], ['검수', '원본 vs 미리보기 · 체크리스트', 'rec', 'A-08'], ['공개', '출처 없으면 공개 버튼 비활성', 'law', 'A-06']])}</section>

  <section class="g-sec"><h2 class="h2">법적 UI 규칙 — Do / Don't <span class="g-src">전자상거래법 · 개인정보보호법 · 계량법 · 장차법</span></h2><p class="g-desc">디자인 취향이 아니라 조항입니다. 개발자가 임의로 바꾸지 못하도록 컴포넌트 단위로 고정합니다.</p>
    <div class="dodont">
      <div class="dd do"><div class="dd-l">DO · 첫 화면부터 총액</div><div class="dd-frame"><div>${fmt.price(16500, 'num-md')} <span class="price-sub">VAT 포함 · 공급가 15,000원</span></div><button class="btn btn-primary btn-sm" style="width:fit-content">16,500원 결제하기</button></div><p>카드·상세·장바구니·주문서 어디서나 부가세 포함 총액이 주 숫자. 버튼 라벨에도 최종 금액.</p></div>
      <div class="dd dont"><div class="dd-l">DON'T · 순차공개 가격</div><div class="dd-frame"><div class="num-md">15,000원</div><span class="micro muted-3">* 부가세 별도 · 결제 단계에서 수수료 추가</span><button class="btn btn-primary btn-sm" style="width:fit-content">결제하기</button></div><p>초기 화면에 낮은 가격을 보여 주고 마지막에 올리는 방식 — 시정조치·과태료 대상.</p></div>
      <div class="dd do"><div class="dd-l">DO · 선택 동의는 기본 해제, 필수는 고지</div><div class="dd-frame"><div class="notice-card" style="padding:12px"><h4 style="margin:0 0 4px">${icon('shield', 'ico-16')} 수집 항목 고지</h4><span class="body-sm muted">이메일·비밀번호·이름 — 계약 이행 목적</span></div><label class="check"><input type="checkbox"><span>[선택] 소식 받기</span></label></div><p>계약 이행에 필요한 정보는 동의 없이 수집 가능(2023 개정) → 「필수 동의」 체크박스 대신 고지. 선택 동의만 체크박스, 기본 미체크.</p></div>
      <div class="dd dont"><div class="dd-l">DON'T · 사전 선택 · 묶음 동의</div><div class="dd-frame"><label class="check"><input type="checkbox" checked><span>[필수] 개인정보 수집 동의</span></label><label class="check"><input type="checkbox" checked><span>[선택] 마케팅 수신 동의</span></label><label class="check"><input type="checkbox" checked><span>전체 동의</span></label></div><p>사업자에게 유리한 선택지를 미리 체크하는 것은 특정옵션 사전선택 금지 조항 위반.</p></div>
      <div class="dd do"><div class="dd-l">DO · 소비자 측 선택지도 같은 위계</div><div class="dd-frame"><div class="row gap-2"><button class="btn btn-secondary btn-sm">나중에</button><button class="btn btn-primary btn-sm">열람 시작</button></div><div class="row gap-2"><button class="btn btn-danger btn-sm">탈퇴</button><button class="btn btn-secondary btn-sm">유지</button></div></div><p>「취소」「탈퇴」「나중에」를 흐린 회색·작은 글씨로 만들지 않습니다. 크기·채도 차이로 유도하면 잘못된 계층구조.</p></div>
      <div class="dd dont"><div class="dd-l">DON'T · 흐린 취소 버튼</div><div class="dd-frame"><div class="row gap-2"><button class="btn btn-ghost btn-sm" style="opacity:.35;font-size:11px">나중에</button><button class="btn btn-primary btn-lg">지금 열기</button></div><div class="row gap-2"><span class="micro" style="opacity:.35">탈퇴하기</span><button class="btn btn-primary btn-sm">계속 이용</button></div></div><p>채도·명도 저하, 글자 크기 차이로 특정 선택지를 우위처럼 표시 — 금지.</p></div>
      <div class="dd do"><div class="dd-l">DO · ㎡ 기본, 평은 참고</div><div class="dd-frame"><div class="area-table" style="margin:0;grid-template-columns:1fr"><div class="at"><div class="fl">전용면적</div><div class="fv">84.97<span class="unit">㎡</span></div><div class="py">약 25.7평 (참고)</div></div></div></div><p>평은 비법정 계량단위. 광고·표시 단속 대상. 타입명은 전용면적 기준(84A).</p></div>
      <div class="dd dont"><div class="dd-l">DON'T · 평 단독 표기</div><div class="dd-frame"><div class="num-md">34평형</div><span class="micro muted-3">방 3 · 욕실 2</span></div><p>「34평형」만 쓰면 공급면적 기준인지 전용인지도 불명확.</p></div>
    </div></section>

  <section class="g-sec"><h2 class="h2">단계 수 비교 <span class="g-src">취소·탈퇴 ≤ 구매·가입</span></h2>
    <div class="table-wrap"><table class="table"><thead><tr><th>행위</th><th>단계</th><th>화면</th><th>대응 행위</th><th>단계</th><th>판정</th></tr></thead><tbody>
      <tr><td>회원가입</td><td>3</td><td>유형·안내 → 정보 → 완료</td><td>탈퇴</td><td>2</td><td><span class="badge badge-pos">통과</span></td></tr>
      <tr><td>결제</td><td>3</td><td>장바구니 → 주문서 → 완료</td><td>환불 신청</td><td>2</td><td><span class="badge badge-pos">통과</span></td></tr>
      <tr><td>마케팅 동의</td><td>1</td><td>체크 1회</td><td>동의 철회</td><td>1</td><td><span class="badge badge-pos">통과</span></td></tr></tbody></table></div>
    <div class="row gap-2 mt-3"><a class="btn btn-sm btn-secondary" href="signup.html">가입 3단계</a><a class="btn btn-sm btn-secondary" href="account.html">탈퇴 2단계</a><a class="btn btn-sm btn-secondary" href="orders.html">환불 2단계</a></div></section>

  <section class="g-sec"><h2 class="h2">반응형 변환 규칙 <span class="g-src">모바일 화면을 따로 그린 것 vs 규칙으로 대응한 것</span></h2><p class="g-desc">범위 합의(제안 탭 범위 계산기)와 직접 연결됩니다. 아래 「별도 프레임」 열이 Y인 화면만 모바일 프레임을 따로 세고, 나머지는 규칙으로 변환합니다.</p>
    <div class="table-wrap"><table class="table resp-table"><thead><tr><th>컴포넌트·화면</th><th>데스크톱 (1024↑)</th><th>모바일 (375~639)</th><th>별도 프레임</th></tr></thead><tbody>
      <tr><td>헤더</td><td>64 · 메뉴 5 · 검색 240</td><td>56 · 햄버거 → 전체화면 메뉴</td><td>규칙</td></tr>
      <tr><td>검색 필터바</td><td>칩 가로 한 줄 + 드롭다운</td><td>가로 스크롤 칩 · 상세 필터는 바텀시트</td><td>Y</td></tr>
      <tr><td>지도 분할</td><td>패널 400 + 지도</td><td>지도 상단 62% + 목록 하단 38%</td><td>Y</td></tr>
      <tr><td>단지 상세</td><td>본문 + aside 372 sticky</td><td>1열 · 구매 박스 하단 고정 바</td><td>Y</td></tr>
      <tr><td>타입 탭</td><td>가로 나열 (7개↑ 스크롤 + 전체 드롭다운)</td><td>가로 스크롤 + 전체 드롭다운</td><td>규칙</td></tr>
      <tr><td>도면 뷰어</td><td>레일 우측 216 · 방향 버튼 좌하단</td><td>레일 하단 가로 · 툴바 44px · 핀치·더블탭 · 시트 정보</td><td>Y</td></tr>
      <tr><td>장바구니 요약</td><td>우측 360 sticky</td><td>하단 고정 바(총액 + 주문 버튼)</td><td>규칙</td></tr>
      <tr><td>주문서</td><td>2열 (폼 + 요약)</td><td>1열 · 증빙·결제수단 카드 세로</td><td>Y</td></tr>
      <tr><td>관리자 표</td><td>사이드바 240 + 표</td><td>데스크톱 전용 안내 (1280px 이상)</td><td>—</td></tr>
      <tr><td>모달</td><td>중앙 520</td><td>바텀시트</td><td>규칙</td></tr></tbody></table></div></section>

  <section class="g-sec"><h2 class="h2">콘텐츠·데이터 규칙 <span class="g-src">극단값으로 검증한 것만</span></h2>
    <div class="table-wrap"><table class="table"><thead><tr><th>항목</th><th>규칙</th><th>최대 테스트 값</th><th>처리</th></tr></thead><tbody>
      <tr><td>단지명</td><td>카드 2줄 말줄임 + title 툴팁 · 상세 2줄</td><td>26자 (전국 최장 25자)</td><td>검토 패널 「극단값」 ON</td></tr>
      <tr><td>타입 수</td><td>7개 초과 시 가로 스크롤 + 「전체 타입」 드롭다운</td><td>18개</td><td>동일</td></tr>
      <tr><td>동 수</td><td>배치도 24개까지 표시, 초과 시 「+N」</td><td>84개동</td><td>동일</td></tr>
      <tr><td>금액</td><td>천 단위 쉼표 · 「원」 .75em · tabular-nums</td><td>9자리</td><td>—</td></tr>
      <tr><td>면적</td><td>㎡ 소수 둘째 자리 · 평은 소수 첫째</td><td>198.60</td><td>—</td></tr>
      <tr><td>날짜·시각</td><td>2026.10.17 · 24시간 14:02</td><td>—</td><td>—</td></tr>
      <tr><td>결측값</td><td>숨기지 않고 「없음」 「—」 「준비 중」 명시</td><td>—</td><td>호갱노노·Rightmove 관행</td></tr>
      <tr><td>데이터 출처 캡션</td><td>「출처: ○○ · 기준일 YYYY.MM.DD」 · 해제 건 배지</td><td>—</td><td>공공데이터 출처 표시</td></tr>
      <tr><td>도면 대체 텍스트</td><td>「84A 타입 평면도 — 방 3, 욕실 2, 전용 84.97㎡」</td><td>—</td><td>SVG role=img aria-label</td></tr></tbody></table></div></section>

  <section class="g-sec"><h2 class="h2">접근성 체크 <span class="g-src">WCAG 2.2 AA · 장차법</span></h2>
    <div class="facts"><div class="fact-tile fact-row"><span class="fl">명도 대비</span><span class="fv">본문 4.5:1 · 큰 글자 3:1 — Foundations 검사기</span></div><div class="fact-tile fact-row"><span class="fl">포커스 링</span><span class="fv">2px --focus + offset 2px, 전 요소 (Tab으로 확인)</span></div><div class="fact-tile fact-row"><span class="fl">타겟</span><span class="fv">최소 24 · 터치 44 · 뷰어 툴바 40/44</span></div><div class="fact-tile fact-row"><span class="fl">드래그 대안</span><span class="fv">뷰어 방향 버튼 · 키보드 (2.5.7)</span></div><div class="fact-tile fact-row"><span class="fl">오류 표시</span><span class="fv">색 + 아이콘 + 문구, 레이블 상시 노출</span></div><div class="fact-tile fact-row"><span class="fl">확대 차단 금지</span><span class="fv">viewport maximum-scale 미사용 (호갱노노 반례)</span></div><div class="fact-tile fact-row"><span class="fl">모션</span><span class="fv">prefers-reduced-motion 존중 · hover 가드</span></div><div class="fact-tile fact-row"><span class="fl">건너뛰기</span><span class="fv">본문으로 건너뛰기 링크 · 랜드마크</span></div></div></section>`;
})();
