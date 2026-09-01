/* 마음터 사용자 앱 — 폰 프레임 안 화면 흐름 (전부 동작) */
(function () {
  'use strict';
  var $ = MC.$, toast = MC.toast, LS = MC.LS;
  var screen = $('#app-screen');
  if (!screen) return;

  var state = { doctor: null, careType: null, slot: null, survey: {}, crisis: false, cur: 'home' };

  var SCREENS = [
    { key: 'home', name: '홈' }, { key: 'search', name: '의사 찾기' }, { key: 'survey', name: '사전 문진' },
    { key: 'doctor', name: '의사 상세' }, { key: 'book', name: '예약·유형 선택' }, { key: 'pay', name: '결제' },
    { key: 'consult', name: '상담 연결' }, { key: 'rx', name: '처방전' }, { key: 'pharmacy', name: '약국 찾기' }, { key: 'mypage', name: '마이페이지' },
  ];

  function statusbar() { return '<div class="app-statusbar"><span>9:41</span><span>● ● ● 100%</span></div>'; }
  function head(title, back) { return '<div class="app-head">' + (back ? '<button class="app-back" data-go="' + back + '" aria-label="뒤로">‹</button>' : '') + '<div class="app-title">' + title + '</div></div>'; }
  function tabbar(active) {
    var tabs = [['home', '🏠', '홈'], ['search', '🔍', '찾기'], ['mypage', '👤', '내정보']];
    return '<div class="app-tabbar">' + tabs.map(function (t) { return '<button data-go="' + t[0] + '" class="' + (active === t[0] ? 'on' : '') + '"><span class="tb-ic">' + t[1] + '</span>' + t[2] + '</button>'; }).join('') + '</div>';
  }

  function go(key) {
    state.cur = key;
    var body = '';
    if (key === 'home') body = scHome();
    else if (key === 'search') body = scSearch();
    else if (key === 'survey') body = scSurvey();
    else if (key === 'doctor') body = scDoctor();
    else if (key === 'book') body = scBook();
    else if (key === 'pay') body = scPay();
    else if (key === 'crisis') body = scCrisis();
    else if (key === 'consult') body = scConsult();
    else if (key === 'rx') body = scRx();
    else if (key === 'pharmacy') body = scPharmacy();
    else if (key === 'mypage') body = scMypage();
    screen.innerHTML = statusbar() + body;
    bind();
    renderIndex();
    screen.scrollTop = 0;
  }

  /* 홈 */
  function scHome() {
    return head('마음터', null) +
      '<div class="app-body">' +
      '<div style="background:linear-gradient(135deg,var(--sage),var(--sage-dk));color:#fff;border-radius:18px;padding:22px;margin-bottom:16px">' +
      '<div style="font-size:13px;opacity:.85">안녕하세요</div><div style="font-size:20px;font-weight:800;margin:4px 0 12px">오늘 마음은 어떠세요?</div>' +
      '<button class="btn btn-warm btn-sm" data-go="survey" style="background:#fff;color:var(--sage-dk)">셀프 체크 시작</button></div>' +
      '<h3 style="font-size:15px;margin:8px 0 10px">이렇게 이용해요</h3>' +
      '<div class="app-card" data-go="survey" style="cursor:pointer"><b style="font-size:14.5px">1. 사전 문진</b><p style="font-size:12.5px;color:var(--ink-3);margin-top:2px">2분이면 충분해요. 위기 신호도 함께 확인해요.</p></div>' +
      '<div class="app-card" data-go="search" style="cursor:pointer"><b style="font-size:14.5px">2. 의사 찾기</b><p style="font-size:12.5px;color:var(--ink-3);margin-top:2px">후기와 평점을 보고 나에게 맞는 분을 골라요.</p></div>' +
      '<div class="app-card" style="cursor:default"><b style="font-size:14.5px">3. 예약 · 상담</b><p style="font-size:12.5px;color:var(--ink-3);margin-top:2px">약이 필요 없으면 기록이 남지 않는 상담을 선택해요.</p></div>' +
      '<div style="margin-top:14px;padding:14px;background:var(--calm-soft);border-radius:12px;font-size:12.5px;color:var(--ink-2)">💡 이 앱은 데모입니다. 실제 진료·처방은 이뤄지지 않으며 모든 정보는 가상입니다.</div>' +
      '</div>' + tabbar('home');
  }

  /* 의사 찾기 */
  function scSearch() {
    var docs = MT.DOCTORS;
    return head('의사 찾기', 'home') +
      '<div class="app-body">' +
      '<div style="display:flex;gap:6px;margin-bottom:12px;overflow-x:auto"><span class="mini-chip">평점순</span><span class="mini-chip" style="background:#eee;color:var(--ink-3)">우울·불안</span><span class="mini-chip" style="background:#eee;color:var(--ink-3)">불면</span><span class="mini-chip" style="background:#eee;color:var(--ink-3)">공황</span></div>' +
      docs.map(function (d) {
        return '<div class="app-card" data-doc="' + d.id + '" style="cursor:pointer"><div class="doc-row">' +
          '<img class="doc-av" src="assets/img/' + d.img + '" alt="' + d.name + ' 원장">' +
          '<div style="flex:1"><div class="doc-name">' + d.name + ' <span style="font-size:12px;color:var(--ink-3);font-weight:500">원장</span></div>' +
          '<div class="doc-meta">' + d.field + ' · ' + d.years + '년 · ' + d.region + '</div>' +
          '<div style="margin-top:3px"><span class="doc-rating">★ ' + d.rating + '</span> <span style="font-size:11.5px;color:var(--ink-3)">후기 ' + d.reviews + '</span></div></div></div></div>';
      }).join('') +
      '<p style="font-size:12px;color:var(--ink-3);margin-top:6px;text-align:center">평점순 정렬 · 특정 의료인 유인을 막기 위해 상세 화면에는 공정 노출 안내가 표시됩니다</p>' +
      '</div>' + tabbar('search');
  }

  /* 사전 문진 */
  function scSurvey() {
    var qs = MT.SURVEY;
    return head('사전 문진', 'home') +
      '<div class="app-body">' +
      '<p style="font-size:13px;color:var(--ink-2);margin-bottom:14px">최근 2주간의 상태를 알려주세요. <b>이것은 진단이 아니라 의사에게 전달되는 사전 정보</b>입니다.</p>' +
      '<div id="survey-form">' + qs.map(function (q, i) {
        return '<div class="app-card"><b style="font-size:13.5px;display:block;margin-bottom:8px">' + (i + 1) + '. ' + q.q + '</b>' +
          '<div style="display:flex;flex-direction:column;gap:6px">' + q.opts.map(function (o, oi) {
            return '<label style="display:flex;gap:8px;align-items:center;font-size:13px;padding:8px 10px;border:1px solid var(--line);border-radius:8px"><input type="radio" name="q' + i + '" value="' + oi + '"' + (q.crisis ? ' data-crisis="' + oi + '"' : '') + '> ' + o + '</label>';
          }).join('') + '</div></div>';
      }).join('') + '</div>' +
      '<button class="btn btn-primary btn-block" id="survey-submit" style="margin-top:8px">문진 완료</button>' +
      '</div>' + tabbar('home');
  }

  /* 위기 화면 */
  function scCrisis() {
    return head('잠시만요', null) +
      '<div class="app-body">' +
      '<div class="crisis-panel">' +
      '<h3>🆘 지금 많이 힘드신 것 같아요</h3>' +
      '<p>혼자 견디지 않으셔도 됩니다. 지금 바로 전문 상담원과 연결할 수 있어요. 예약을 기다리지 마세요.</p>' +
      '<a class="btn btn-crisis btn-block" href="tel:109" onclick="return false" data-crisis-call>📞 109 자살예방 상담전화 (24시간)</a>' +
      '<div style="height:8px"></div>' +
      '<button class="btn btn-ghost btn-block" data-crisis-emergency>가까운 응급실 안내</button>' +
      '</div>' +
      '<div style="margin-top:14px;padding:14px;background:var(--sage-soft);border-radius:12px;font-size:13px;color:var(--ink-2)">' +
      '전문의 상담도 <b>가장 빠른 시간으로 자동 배정</b>해 두었어요.<br>' +
      '<div id="crisis-slot" style="margin-top:8px;font-weight:700;color:var(--sage-dk)"></div></div>' +
      '<button class="btn btn-primary btn-block" data-go="search" style="margin-top:14px">배정된 의사 보기</button>' +
      '<p style="font-size:11px;color:var(--ink-3);margin-top:10px;text-align:center">이것은 진단이 아니며, 데모 화면입니다.</p>' +
      '</div>';
  }

  /* 의사 상세 */
  function scDoctor() {
    var d = state.doctor || MT.DOCTORS[0];
    var reviews = MT.REVIEWS.filter(function (r) { return r.doctor === d.id && r.status === 'ok'; });
    return head('의사 상세', 'search') +
      '<div class="app-body">' +
      '<div style="text-align:center"><img src="assets/img/' + d.img + '" alt="' + d.name + ' 원장" style="width:96px;height:96px;border-radius:26px;object-fit:cover;margin:0 auto 10px">' +
      '<div style="font-size:19px;font-weight:800">' + d.name + ' 원장</div>' +
      '<div style="font-size:13px;color:var(--ink-3)">' + d.field + ' · ' + d.years + '년 · ' + d.hospital + '</div>' +
      '<div style="margin-top:6px"><span class="doc-rating">★ ' + d.rating + '</span> <span style="font-size:12px;color:var(--ink-3)">후기 ' + d.reviews + '</span></div></div>' +
      '<div class="app-card" style="margin-top:14px"><p style="font-size:13.5px;color:var(--ink-2)">' + d.bio + '</p></div>' +
      '<div style="display:flex;gap:8px;margin:4px 0 12px"><div class="app-card" style="flex:1;margin:0;text-align:center"><div style="font-size:12px;color:var(--ink-3)">초진</div><b class="num">' + d.first + '분</b></div>' +
      '<div class="app-card" style="flex:1;margin:0;text-align:center"><div style="font-size:12px;color:var(--ink-3)">재진</div><b class="num">' + d.again + '분</b></div>' +
      '<div class="app-card" style="flex:1;margin:0;text-align:center"><div style="font-size:12px;color:var(--ink-3)">상담료</div><b class="num">' + d.fee.toLocaleString() + '원</b></div></div>' +
      '<div style="padding:10px 12px;background:var(--calm-soft);border-radius:10px;font-size:11.5px;color:var(--ink-2);margin-bottom:14px">ℹ️ 노출 순서는 평점·후기 기반이며, 특정 의사를 광고하지 않습니다(공정 노출 로테이션 적용).</div>' +
      '<h3 style="font-size:14px;margin-bottom:8px">후기 <span style="font-size:12px;color:var(--ink-3)">(치료 효과 표현은 자동 비노출)</span></h3>' +
      reviews.map(function (r) { return '<div class="app-card" style="padding:12px"><span class="doc-rating">★ ' + r.rating + '</span><p style="font-size:13px;color:var(--ink-2);margin-top:4px">' + r.text + '</p></div>'; }).join('') +
      '<button class="btn btn-primary btn-block" data-go="book" style="margin-top:8px">예약하기</button>' +
      '</div>';
  }

  /* 예약·유형 선택 (Z/F 분기) */
  function scBook() {
    var d = state.doctor || MT.DOCTORS[0];
    return head('예약', 'doctor') +
      '<div class="app-body">' +
      '<div class="app-steps"><div class="as on"></div><div class="as"></div><div class="as"></div></div>' +
      '<h3 style="font-size:15px;margin-bottom:6px">진료 유형을 선택하세요</h3>' +
      '<p style="font-size:12.5px;color:var(--ink-3);margin-bottom:12px">약이 필요 없는 상담이라면 진단 기록이 남지 않습니다.</p>' +
      MT.CARE_TYPES.map(function (c) {
        return '<div class="app-card care-opt" data-care="' + c.key + '" style="cursor:pointer;border:1.5px solid var(--line)">' +
          '<div style="display:flex;align-items:center;gap:8px"><b style="font-size:14.5px;flex:1">' + c.name + '</b>' +
          '<span class="code-badge ' + (c.prescribe ? 'code-f' : 'code-z') + '">' + c.code + '</span></div>' +
          '<p style="font-size:12.5px;color:var(--ink-2);margin-top:6px">' + c.desc + '</p></div>';
      }).join('') +
      '<div id="care-note"></div>' +
      '<h3 style="font-size:15px;margin:16px 0 8px">시간 선택</h3>' +
      '<div class="slot-grid" id="slots">' + d.slots.map(function (s, i) { return '<button class="slot-btn" data-slot="' + i + '">' + s + '</button>'; }).join('') + '</div>' +
      '<button class="btn btn-primary btn-block" id="to-pay" style="margin-top:16px" disabled>결제로 진행</button>' +
      '</div>';
  }

  /* 결제 (수가 자동 산출) */
  function scPay() {
    var fee = MT.FEE_TABLE.firstVisit;
    var isTalk = state.careType === 'talk';
    return head('결제', 'book') +
      '<div class="app-body">' +
      '<div class="app-steps"><div class="as on"></div><div class="as on"></div><div class="as"></div></div>' +
      '<div class="app-card"><b style="font-size:14px">진료 요약</b>' +
      '<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:13.5px"><span>의사</span><b>' + (state.doctor ? state.doctor.name + ' 원장' : '—') + '</b></div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:6px;font-size:13.5px"><span>유형</span><b>' + (isTalk ? '상담 중심 (Z71.9)' : '진료+처방 검토 (F코드)') + '</b></div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:6px;font-size:13.5px"><span>시간</span><b>' + (state.slot != null && state.doctor ? state.doctor.slots[state.slot] : '—') + '</b></div></div>' +
      '<div class="app-card"><b style="font-size:14px">결제 금액 (건강보험 급여)</b>' +
      '<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:13px;color:var(--ink-3)"><span>총 진찰료</span><span class="num">' + fee.total.toLocaleString() + '원</span></div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:4px;font-size:13px;color:var(--ink-3)"><span>공단 부담 (70%)</span><span class="num">− ' + fee.insurance.toLocaleString() + '원</span></div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-size:15px;font-weight:800"><span>본인 부담</span><span class="num" style="color:var(--sage-dk)">' + fee.patient.toLocaleString() + '원</span></div>' +
      '<p style="font-size:11px;color:var(--ink-3);margin-top:8px">' + fee.note + '. 금액은 수가로 자동 산출되며 임의로 정하지 않습니다.</p></div>' +
      '<label style="display:flex;gap:8px;font-size:12.5px;color:var(--ink-2);margin:8px 0"><input type="checkbox" id="pay-refund"> 취소·환불 규정에 동의합니다 (상담 전 취소 시 전액 환불)</label>' +
      '<button class="btn btn-primary btn-block" id="do-pay">결제하고 예약 확정</button>' +
      '<p style="font-size:11px;color:var(--ink-3);margin-top:8px;text-align:center">상담 시간 초과 시 자동 추가 과금은 없습니다(급여 진료 임의비급여 방지).</p>' +
      '</div>';
  }

  /* 상담 연결 */
  function scConsult() {
    var isTalk = state.careType === 'talk';
    return head('상담 연결', null) +
      '<div class="app-body" style="text-align:center">' +
      '<div style="width:96px;height:96px;border-radius:50%;background:var(--sage-soft);display:grid;place-items:center;margin:16px auto;font-size:40px">📞</div>' +
      '<div style="font-size:17px;font-weight:800">' + (state.doctor ? state.doctor.name + ' 원장' : '') + '과 연결되었습니다</div>' +
      '<p style="font-size:13px;color:var(--ink-3);margin:6px 0 4px">050 안심번호로 연결 · 양측 실번호 비공개</p>' +
      '<div class="timer-ring" id="consult-timer" style="margin:14px 0">30:00</div>' +
      '<div style="font-size:12px;color:var(--ink-3)">남은 상담 시간</div>' +
      '<div class="app-card" style="margin-top:16px;text-align:left"><b style="font-size:13px">연결 상태</b><div id="consult-log" style="font-size:12px;color:var(--ink-2);margin-top:6px;line-height:1.8">· 통화 연결됨 (0:00)<br>· 문진 정보가 의사에게 전달됨</div></div>' +
      '<div style="display:flex;gap:8px;margin-top:14px"><button class="btn btn-ghost btn-sm" style="flex:1" data-consult-drop>통화 끊김 시뮬</button>' +
      '<button class="btn btn-primary btn-sm" style="flex:1" data-consult-end>상담 종료</button></div>' +
      '</div>';
  }

  /* 처방전 (열람권 · 카운트다운) */
  function scRx() {
    var isTalk = state.careType === 'talk';
    if (isTalk) {
      return head('상담 완료', null) +
        '<div class="app-body" style="text-align:center">' +
        '<div style="width:80px;height:80px;border-radius:50%;background:var(--ok-soft);color:var(--ok);display:grid;place-items:center;margin:20px auto;font-size:36px">✓</div>' +
        '<div style="font-size:18px;font-weight:800">상담이 끝났어요</div>' +
        '<p style="font-size:13.5px;color:var(--ink-2);margin:10px 0 6px">약 처방이 없는 상담이라 <b>진단명(F코드)이 기록되지 않았습니다.</b></p>' +
        '<span class="code-badge code-z" style="margin:6px 0">청구 코드 Z71.9 · 보건서비스 상담</span>' +
        '<div style="height:16px"></div>' +
        '<button class="btn btn-primary btn-block" data-go="mypage">상담 내역 보기</button>' +
        '<button class="btn btn-ghost btn-block" data-go="home" style="margin-top:8px">홈으로</button>' +
        '</div>';
    }
    return head('처방전', null) +
      '<div class="app-body">' +
      '<div class="rx-doc"><div class="rx-watermark">마음터 · 열람용</div>' +
      '<b style="font-size:14px">처방전 (열람용)</b>' +
      '<div style="font-size:12.5px;color:var(--ink-2);margin-top:10px;line-height:1.9">' +
      '· 처방: 에스시탈로프람 10mg<br>· 용법: 1일 1회, 아침 식후<br>· 처방일수: 14일<br>· 발행: ' + (state.doctor ? state.doctor.name + ' 원장' : '') + '</div>' +
      '<div style="margin-top:12px;padding:10px;background:var(--warn-soft);border-radius:8px;font-size:12px;color:var(--warn)">⏱ 남은 열람 시간 <b class="num" id="rx-timer">04:59</b> · 시간이 지나면 열람할 수 없습니다(보관이 아닌 열람권).</div></div>' +
      '<div style="padding:12px;background:var(--sage-soft);border-radius:10px;font-size:12px;color:var(--ink-2);margin:12px 0">✓ 향정신성 약물이 아닌 SSRI로 안전하게 처방되었습니다.</div>' +
      '<button class="btn btn-primary btn-block" data-go="pharmacy">약국 찾기</button>' +
      '</div>';
  }

  /* 약국 찾기 */
  function scPharmacy() {
    return head('약국 찾기', 'rx') +
      '<div class="app-body">' +
      '<div style="height:150px;border-radius:14px;background:linear-gradient(135deg,#e6edf6,#dfe9e4);display:grid;place-items:center;color:var(--ink-3);font-size:13px;margin-bottom:12px">📍 위치 기반 지도 (데모)</div>' +
      ['가까운 온누리약국 · 240m', '건강샘약국 · 380m', '중앙약국 · 510m'].map(function (p) {
        return '<div class="app-card" style="display:flex;align-items:center;gap:10px"><span style="font-size:20px">💊</span><div style="flex:1"><b style="font-size:14px">' + p.split(' · ')[0] + '</b><div style="font-size:12px;color:var(--ink-3)">' + p.split(' · ')[1] + ' · 영업 중</div></div></div>';
      }).join('') +
      '<div style="padding:12px;background:var(--calm-soft);border-radius:10px;font-size:12px;color:var(--ink-2);margin-top:8px">ℹ️ 거리순으로만 표시하며, 특정 약국을 추천·배지로 강조하지 않습니다(약사법·특정 약국 유인 금지).</div>' +
      '<div style="padding:12px;background:var(--warn-soft);border-radius:10px;font-size:12px;color:var(--warn);margin-top:8px">약 배송은 현재 섬·벽지, 거동 불편자 등 제한 대상만 가능합니다. 대상 여부는 처방 후 안내됩니다.</div>' +
      '<button class="btn btn-primary btn-block" data-go="mypage" style="margin-top:12px">완료 · 마이페이지</button>' +
      '</div>';
  }

  /* 마이페이지 */
  function scMypage() {
    return head('내 정보', 'home') +
      '<div class="app-body">' +
      '<div class="app-card"><b style="font-size:14px">상담 내역</b>' +
      '<div style="margin-top:8px;padding:10px;background:var(--bg);border-radius:8px;font-size:13px"><div style="display:flex;justify-content:space-between"><b>' + (state.doctor ? state.doctor.name + ' 원장' : '김서연 원장') + '</b><span class="badge badge-sage">완료</span></div>' +
      '<div style="font-size:12px;color:var(--ink-3);margin-top:4px">' + (state.careType === 'talk' ? '상담 중심 (Z71.9)' : '진료+처방 (F코드)') + ' · 오늘</div></div></div>' +
      '<div class="app-card"><b style="font-size:14px">예약 상태</b><p style="font-size:13px;color:var(--ink-2);margin-top:6px">예정된 재진 예약이 없습니다.</p><button class="btn btn-ghost btn-sm" data-go="search" style="margin-top:8px">재진 예약하기</button></div>' +
      '<div class="app-card"><b style="font-size:14px">결제 내역</b><div style="display:flex;justify-content:space-between;font-size:13px;margin-top:6px"><span>본인부담금</span><b class="num">8,100원</b></div></div>' +
      '<div class="app-card"><b style="font-size:14px">개인정보</b><p style="font-size:12px;color:var(--ink-3);margin-top:6px">상담 내용은 담당 의사만 열람할 수 있습니다. 관리자는 내용에 접근할 수 없습니다.</p></div>' +
      '</div>' + tabbar('mypage');
  }

  /* 이벤트 바인딩 */
  function bind() {
    MC.$$('[data-go]', screen).forEach(function (el) { el.addEventListener('click', function (e) { e.stopPropagation(); go(el.dataset.go); }); });
    MC.$$('[data-doc]', screen).forEach(function (el) { el.addEventListener('click', function () { state.doctor = MT.docOf(el.dataset.doc); go('doctor'); }); });

    // 문진
    var sub = $('#survey-submit', screen);
    if (sub) sub.addEventListener('click', function () {
      var crisis = false;
      MC.$$('[data-crisis]', screen).forEach(function (inp) { if (inp.checked && +inp.value >= 2) crisis = true; });
      var answered = MC.$$('#survey-form input:checked', screen).length;
      if (answered < MT.SURVEY.length) { toast('모든 문항에 답해 주세요'); return; }
      if (crisis) { state.crisis = true; go('crisis'); afterCrisis(); return; }
      toast('문진이 완료되었어요. 의사를 찾아볼까요?');
      go('search');
    });

    // 예약 care 선택
    MC.$$('.care-opt', screen).forEach(function (el) {
      el.addEventListener('click', function () {
        state.careType = el.dataset.care;
        MC.$$('.care-opt', screen).forEach(function (x) { x.style.borderColor = 'var(--line)'; x.style.background = '#fff'; });
        el.style.borderColor = 'var(--sage)'; el.style.background = 'var(--sage-soft)';
        var note = $('#care-note', screen);
        note.innerHTML = state.careType === 'talk'
          ? '<div style="padding:12px;background:var(--ok-soft);border-radius:10px;font-size:12.5px;color:var(--ok);margin-top:10px">✓ 약 처방이 없어 진단명이 기록되지 않습니다. 결제 단계에서 처방 항목이 표시되지 않습니다.</div>'
          : '<div style="padding:12px;background:var(--warn-soft);border-radius:10px;font-size:12.5px;color:var(--warn);margin-top:10px">진단명(F코드)이 기록될 수 있습니다. 처방은 비대면 가능 약물만 이뤄집니다.</div>';
        checkBookReady();
      });
    });
    MC.$$('.slot-btn', screen).forEach(function (b) {
      b.addEventListener('click', function () { MC.$$('.slot-btn', screen).forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); state.slot = +b.dataset.slot; checkBookReady(); });
    });
    var toPay = $('#to-pay', screen);
    if (toPay) toPay.addEventListener('click', function () { go('pay'); });

    // 결제
    var doPay = $('#do-pay', screen);
    if (doPay) doPay.addEventListener('click', function () { if (!$('#pay-refund', screen).checked) { toast('취소·환불 규정 동의가 필요해요'); return; } toast('결제 완료 · 예약이 확정되었어요'); go('consult'); startTimer(); });

    // 상담
    var end = $('[data-consult-end]', screen);
    if (end) end.addEventListener('click', function () { stopTimer(); go('rx'); if (state.careType !== 'talk') startRxTimer(); });
    var drop = $('[data-consult-drop]', screen);
    if (drop) drop.addEventListener('click', function () {
      var lg = $('#consult-log', screen);
      lg.innerHTML += '<br>· ⚠ 통화 끊김 감지 (자동 시간 정지)<br>· 3분 이내 재연결 유예 · 재연결됨';
      toast('통화가 끊겼어요 — 끊긴 시간은 차감되지 않아요 (3분 유예)');
    });

    // 위기
    var call = $('[data-crisis-call]', screen);
    if (call) call.addEventListener('click', function () { toast('109 자살예방 상담전화로 연결합니다 (데모)'); });
    var er = $('[data-crisis-emergency]', screen);
    if (er) er.addEventListener('click', function () { toast('가장 가까운 응급실을 안내합니다 (데모)'); });
  }

  function checkBookReady() { var t = $('#to-pay', screen); if (t) t.disabled = !(state.careType && state.slot != null); }
  function afterCrisis() { var el = $('#crisis-slot', screen); if (el) el.textContent = '박지민 원장 · 오늘 18:00 (가장 빠른 슬롯)'; state.doctor = MT.docOf('d3'); }

  var timer, rxTimer;
  function startTimer() {
    var left = 30 * 60;
    timer = setInterval(function () {
      left--; var el = $('#consult-timer'); if (!el) { clearInterval(timer); return; }
      var m = Math.floor(left / 60), s = left % 60;
      el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      if (left <= 0) { clearInterval(timer); }
    }, 100); // 데모는 빠르게
  }
  function stopTimer() { clearInterval(timer); }
  function startRxTimer() {
    var left = 5 * 60;
    rxTimer = setInterval(function () {
      left--; var el = $('#rx-timer'); if (!el) { clearInterval(rxTimer); return; }
      var m = Math.floor(left / 60), s = left % 60;
      el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      if (left <= 0) { clearInterval(rxTimer); el.textContent = '만료'; }
    }, 200);
  }

  function renderIndex() {
    var idx = $('#screen-index'); if (!idx) return;
    idx.innerHTML = SCREENS.map(function (s) {
      return '<button data-jump="' + s.key + '" style="text-align:left;padding:9px 12px;border-radius:8px;font-size:13.5px;font-weight:600;' + (state.cur === s.key ? 'background:var(--sage);color:#fff' : 'background:#fff;border:1px solid var(--line);color:var(--ink-2)') + '">' + s.name + '</button>';
    }).join('');
    MC.$$('[data-jump]', idx).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.jump;
        // 점프 시 필요한 상태 프리필
        if ((k === 'doctor' || k === 'book' || k === 'pay') && !state.doctor) state.doctor = MT.DOCTORS[0];
        if ((k === 'pay' || k === 'consult' || k === 'rx') && !state.careType) state.careType = 'med';
        if ((k === 'pay' || k === 'consult') && state.slot == null) state.slot = 0;
        go(k);
      });
    });
  }

  go('home');
})();
