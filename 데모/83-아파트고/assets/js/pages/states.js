/* S-01~S-06 상태 매트릭스 — 행=화면, 열=상태. 셀을 누르면 그 화면의 미니 프레임이 해당 상태로 실제 전환 (F12)
   로딩은 검토 패널의 대기 시간(0.5/3/15초)에 따라 스켈레톤 → 스피너 → 진행률 (NN/g) */
(function () {
  const { $, $$, esc, icon, fmt } = UI;
  UI.init();
  GuideNav.mount('states');
  const main = $('#main');
  const ROWS = [['search', '검색 결과'], ['complex', '단지 상세'], ['viewer', '도면 뷰어'], ['cart', '장바구니'], ['checkout', '주문서'], ['library', '내 도면함'], ['admin', '관리자 목록']];
  const COLS = [['default', '기본'], ['loading', '로딩'], ['empty', '빈 상태'], ['error', '에러'], ['auth', '권한 없음']];
  const NA = { 'viewer:empty': 1, 'checkout:empty': 1 };
  let cur = { r: 'search', c: 'empty' };
  const t = APT.type('c01-84A');

  const EMPTY = {
    search: ['search', '조건에 맞는 단지가 없습니다', '“헬리오시티” 와 비슷한 이름이 없습니다. 철자를 바꾸거나 주소(동 이름)로 검색해 보세요.', [['검색·필터 해제', 'primary'], ['도면 등록 요청', 'secondary']]],
    complex: ['file', '이 타입 도면은 준비 중입니다', '84C 타입 도면이 아직 등록되지 않았습니다. 등록되면 이메일로 알려 드립니다.', [['등록되면 알림 받기', 'primary']]],
    cart: ['cart', '장바구니가 비어 있습니다', '단지를 검색해 타입별 도면을 담으세요. 같은 단지 3개 타입 이상이면 10% 묶음 할인.', [['단지 검색', 'primary'], ['최근 본 서강 리버파크', 'secondary']]],
    library: ['grid', '아직 구매한 도면이 없습니다', '구매한 도면은 단지별로 여기에 쌓이고 90일 동안 5회까지 다시 내려받을 수 있습니다.', [['단지 검색', 'primary']]],
    admin: ['box', '검수 대기 도면이 없습니다', '모든 도면이 검수를 마쳤습니다. 새 도면이 업로드되면 여기에 표시됩니다.', [['도면 등록', 'primary'], ['필터 해제', 'secondary']]]
  };
  const ERR = {
    search: ['검색 결과를 불러오지 못했습니다', '필터는 유지됩니다. 잠시 후 다시 시도하세요.'], complex: ['단지 정보를 불러오지 못했습니다', '네트워크 상태를 확인하고 다시 시도하세요.'], viewer: ['도면 타일을 불러오지 못했습니다', '3/12 타일 실패 — 다시 시도하면 실패한 타일만 다시 받습니다.'], cart: ['장바구니를 동기화하지 못했습니다', '담긴 도면은 기기에 보관되어 있습니다.'], checkout: ['결제사 응답이 없습니다', '중복 결제가 되지 않도록 카드사 승인 내역을 확인한 뒤 다시 시도하세요.'], library: ['도면함을 불러오지 못했습니다', '잠시 후 다시 시도하세요.'], admin: ['목록을 불러오지 못했습니다', '서버 오류(500) — 운영팀에 자동 보고되었습니다.']
  };
  const AUTH = {
    search: ['lock', '로그인하면 관심 단지를 저장할 수 있습니다', '검색 자체는 비회원도 가능합니다. 저장·알림만 로그인이 필요합니다.', '로그인 후 원래 화면 복귀', '①'],
    complex: ['lock', '구매·장바구니는 로그인이 필요합니다', '미리보기는 비회원도 볼 수 있습니다.', '로그인 후 원래 화면 복귀', '①'],
    viewer: ['lock', '구매한 도면만 뷰어에서 열 수 있습니다', '아직 구매하지 않은 타입입니다. 미리보기로 방 구성을 확인한 뒤 구매하세요.', '미리보기 · 구매하기', '②'],
    cart: ['lock', '로그인이 필요한 화면입니다', '로그인하면 지금 이 화면으로 다시 돌아옵니다.', '로그인', '①'],
    checkout: ['lock', '로그인이 필요한 화면입니다', '주문·결제는 회원 계정으로만 가능합니다.', '로그인', '①'],
    library: ['lock', '로그인이 필요한 화면입니다', '구매 내역·도면함·환불 신청은 회원 계정으로만 볼 수 있습니다.', '로그인', '①'],
    admin: ['shield', '이 메뉴를 볼 권한이 없습니다', '현재 역할 CS 담당에는 「도면 검수」 권한이 없습니다. 운영 책임자에게 접근을 요청하세요.', '접근 요청 보내기', '③']
  };

  function defaultFrame(r) {
    if (r === 'search') return `<div class="cards-3" style="grid-template-columns:repeat(2,1fr)">${['c01', 'c05'].map(id => { const c = APT.complex(id); const ty = APT.typesOf(id)[2]; return `<div class="complex-card"><div class="cc-media">${APT.planSVG(ty, 'thumb')}</div><div class="cc-body"><div class="cc-name">${esc(c.name)}</div><div class="cc-meta">${c.built}년 · ${fmt.num(c.households)}세대</div></div></div>`; }).join('')}</div>`;
    if (r === 'complex') return `<div class="plan-card"><div class="pc-thumb">${APT.planSVG(t, 'thumb')}</div><div><div class="pc-code">84A</div><div class="pc-area">전용 84.97㎡ · 방 3 욕실 2</div><div class="pc-foot mt-3">${fmt.price(5500, 'num-md')}<button class="btn btn-sm btn-primary">담기</button></div></div></div>`;
    if (r === 'viewer') return `<div style="max-width:420px;margin:0 auto">${APT.planSVG(t, 'full')}</div>`;
    if (r === 'cart') return `<div class="cart-row" style="border:0;box-shadow:var(--sh-line);border-radius:12px"><div class="cr-thumb">${APT.planSVG(t, 'thumb')}</div><div><div class="cr-name">84A 타입</div><div class="cr-meta">PDF 도면 · 7,700원</div></div><div class="cr-right">${fmt.price(7700, 'num-md')}</div></div>`;
    if (r === 'checkout') return `<div class="consent-box"><div class="cb-title">${icon('info', 'ico-16')} 열람을 시작한 도면은 환불되지 않습니다</div><label class="check"><input type="checkbox"><span>미리보기를 확인했고, 열람을 시작한 도면은 환불되지 않음에 동의합니다</span></label></div><button class="btn btn-primary btn-block mt-3">7,700원 결제하기</button>`;
    if (r === 'library') return `<div class="lib-grid" style="grid-template-columns:repeat(2,1fr)">${['c01-84A', 'c01-59A'].map(id => { const x = APT.type(id); return `<div class="lib-card"><div class="lc-media">${APT.planSVG(x, 'thumb')}<span class="badge badge-action">미열람</span></div><div class="lc-body"><div class="lc-code">${x.code}</div><div class="lc-meta">다운로드 0/5회 · 84일 남음</div></div></div>`; }).join('')}</div>`;
    return `<table class="table"><thead><tr><th>도면</th><th>상태</th><th>출처</th><th class="num">가격</th></tr></thead><tbody><tr><td>서강 리버파크 84A</td><td><span class="badge badge-pos">공개</span></td><td>자체 재작도</td><td class="num">5,500</td></tr><tr><td>송도 더블유파크 59A</td><td><span class="badge badge-warn">검수중</span></td><td>건설사 제공</td><td class="num">5,500</td></tr></tbody></table>`;
  }
  function skeletonFor(r) {
    if (r === 'search' || r === 'library') return `<div class="cards-3" style="grid-template-columns:repeat(2,1fr)">${'<div class="complex-card"><div class="cc-media skeleton"></div><div class="cc-body"><div class="sk-line skeleton" style="width:70%"></div><div class="sk-line skeleton" style="width:45%"></div></div></div>'.repeat(2)}</div>`;
    if (r === 'admin') return `<div class="sk-line skeleton" style="height:40px"></div>${'<div class="sk-line skeleton" style="height:40px"></div>'.repeat(3)}`;
    return `<div class="sk-line skeleton" style="height:120px"></div><div class="sk-line skeleton" style="width:60%"></div><div class="sk-line skeleton" style="width:40%"></div>`;
  }
  function render() {
    main.innerHTML = `<div class="page-head"><div><span class="eyebrow">상태 화면 · S-01~S-06</span><h1 class="h1">상태 매트릭스</h1><p class="muted body-sm mt-2">「빈 화면·404·로딩·권한 없음」은 화면 한 장이 아니라 규칙입니다. 셀을 누르면 그 화면이 해당 상태로 실제 전환됩니다. 개발자가 임의로 만들 여지를 없애는 것이 목적입니다.</p></div><div class="row gap-2"><a class="btn btn-secondary btn-sm" href="404.html">404 보기</a></div></div>
      <div class="sm-grid" role="grid"><div></div>${COLS.map(c => `<div class="sm-h">${c[1]}</div>`).join('')}${ROWS.map(r => `<div class="sm-r">${r[1]}</div>${COLS.map(c => { const na = NA[r[0] + ':' + c[0]]; return `<button type="button" ${na ? 'class="na" disabled' : ''} aria-pressed="${cur.r === r[0] && cur.c === c[0]}" data-r="${r[0]}" data-c="${c[0]}" aria-label="${r[1]} ${c[1]}">${na ? '—' : ({ default: '●', loading: '◐', empty: '○', error: '▲', auth: '🔒' })[c[0]]}</button>`; }).join('')}`).join('')}</div>
      <div class="sm-stage"><div class="ss-bar"><span><b>${ROWS.find(r => r[0] === cur.r)[1]}</b> · ${COLS.find(c => c[0] === cur.c)[1]}</span><span class="muted-3">${cur.c === 'loading' ? `대기 시간 ${Store.get('loadDelay')}초 — 검토 패널에서 바꿔 보세요` : cur.c === 'auth' ? '권한 없음 ' + AUTH[cur.r][4] + ' 유형' : ''}</span></div><div class="ss-body" id="stage"></div></div>
      <div class="sm-rule"><div><b>로딩 규칙 (NN/g)</b>1초 미만 표시 안 함 · 1~2초 스켈레톤 · 2~10초 스피너 · 10초 이상 진행률(%)</div><div><b>빈 상태 3원칙</b>① 지금 상태 설명 ② 이 공간이 무엇을 위한 곳인지 ③ 핵심 작업으로 가는 버튼</div><div><b>에러</b>필터·입력은 유지하고 결과 영역만 교체 · 재시도 버튼 · 중복 결제 경고</div><div><b>권한 없음 3종</b>① 비로그인 → 로그인 후 복귀 ② 미구매 → 미리보기+구매 ③ 역할 부족 → 접근 요청</div></div>
      <section class="mt-8"><h2 class="h2 mb-4">결제·다운로드 예외 (S-06)</h2><div class="states-list">
        <div class="state-card"><h3 class="h3">입금 기한 임박·만료</h3><div class="sc-frame"><div style="width:100%"><div class="vbank"><div><div class="vb-l">입금 기한</div><div class="vb-v up">2026.10.19 14:02 <span class="badge badge-danger">3시간 남음</span></div></div><span></span><div><div class="vb-l">기한 만료 시</div><div class="vb-v">주문 자동 취소 · 장바구니 유지</div></div><span></span></div></div></div></div>
        <div class="state-card"><h3 class="h3">다운로드 기한·횟수 만료</h3><div class="sc-frame"><div class="lib-card is-expired" style="width:260px"><div class="lc-media">${APT.planSVG(t, 'thumb')}<span class="badge badge-outline">열람함</span></div><div class="lc-body"><div class="lc-code">84A</div><div class="lc-meta">다운로드 기한 만료 — 재발급 요청 가능</div><div class="lc-foot"><button class="btn btn-sm btn-secondary">재발급 요청</button></div></div></div></div></div>
        <div class="state-card"><h3 class="h3">세션 만료</h3><div class="sc-frame"><div class="gate" style="padding:0"><div class="g-ico">${icon('clock', 'ico-24')}</div><div class="h3">30분간 활동이 없어 로그아웃되었습니다</div><p class="body-sm muted">장바구니와 작성 중인 주문서는 보관됩니다. 다시 로그인하면 이어서 진행합니다.</p><button class="btn btn-primary btn-sm">다시 로그인</button></div></div></div>
        <div class="state-card"><h3 class="h3">서버 오류 · 점검 중</h3><div class="sc-frame"><div class="gate" style="padding:0"><div class="g-ico">${icon('wrench', 'ico-24')}</div><div class="h3">정기 점검 중입니다</div><p class="body-sm muted">10.20(화) 02:00–04:00 · 예상 복구 03:30. 구매한 도면은 점검 후 그대로 열 수 있습니다.</p><span class="badge badge-live">진행 중</span></div></div></div>
      </div></section>`;
    $$('.sm-grid button:not(.na)').forEach(b => b.addEventListener('click', () => { cur = { r: b.dataset.r, c: b.dataset.c }; render(); }));
    stage();
  }
  function stage() {
    const el = $('#stage'); const r = cur.r, c = cur.c;
    if (c === 'default') el.innerHTML = defaultFrame(r);
    else if (c === 'loading') UI.load(el, skeletonFor(r), x => { x.innerHTML = defaultFrame(r); UI.toast('로딩 완료 — 기본 상태로 전환', { ms: 1500 }); }, '불러오는 중');
    else if (c === 'empty') { const e = EMPTY[r]; el.innerHTML = `<div class="empty"><div class="em-ico">${icon(e[0], 'ico-24')}</div><div class="em-title">${e[1]}</div><div class="em-desc">${e[2]}</div><div class="em-actions">${e[3].map(a => `<button class="btn btn-${a[1]}">${a[0]}</button>`).join('')}</div></div>`; }
    else if (c === 'error') { const e = ERR[r]; el.innerHTML = `<div class="empty"><div class="em-ico" style="background:var(--danger-tint);color:var(--danger)">${icon('alert', 'ico-24')}</div><div class="em-title">${e[0]}</div><div class="em-desc">${e[1]}</div><div class="em-actions"><button class="btn btn-primary" data-retry>다시 시도</button><button class="btn btn-ghost">고객센터</button></div><p class="micro muted-3">오류 코드 E-${r.toUpperCase().slice(0, 3)}-503 · ${fmt.dt(new Date().toISOString())}</p></div>`; $('[data-retry]', el).addEventListener('click', () => { cur.c = 'loading'; render(); }); }
    else { const a = AUTH[r]; el.innerHTML = `<div class="gate" style="padding:16px"><div class="g-ico">${icon(a[0], 'ico-24')}</div><div class="h2">${a[1]}</div><p class="muted">${a[2]}</p><div class="account-box">${icon('user', 'ico-16')}현재 역할: ${Store.ROLE_META[Store.get('role')].label}</div><div class="g-actions">${a[3].split(' · ').map((x, i) => `<button class="btn ${i ? 'btn-secondary' : 'btn-primary'}">${x}</button>`).join('')}</div><p class="micro muted-3 dev-note">권한 없음 ${a[4]}</p></div>`; }
  }
  render();
})();
