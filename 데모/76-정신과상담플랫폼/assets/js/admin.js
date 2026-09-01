/* 마음터 관리자 백오피스 — 규제 준수 대시보드 외 (전부 동작) */
(function () {
  'use strict';
  var $ = MC.$, $$ = MC.$$, toast = MC.toast, LS = MC.LS;
  var main = $('#admin-main');
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // 규제 적용 시점 스위치: current(시범사업) / future(개정법 2026.12.24~)
  var law = LS.get('law-mode', 'future');
  function lawLabel() { return law === 'future' ? '개정 의료법 (2026.12.24~)' : '현행 시범사업 지침'; }
  function updateLawIndicator() { $('#law-indicator').innerHTML = '적용 기준: <b style="color:var(--sage-dk)">' + lawLabel() + '</b>'; }

  var VIEWS = {};
  function show(v) { $$('#admin-nav button').forEach(function (b) { b.setAttribute('aria-current', String(b.dataset.view === v)); }); main.scrollTop = 0; (VIEWS[v] || VIEWS.dash)(); }
  $$('#admin-nav button').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.view); }); });

  /* ═══ 규제 준수 대시보드 ═══ */
  VIEWS.dash = function () {
    var blocked = LS.get('rx-blocked', 0) + MT.ADMIN_SEED.rxLog.filter(function (r) { return r.result === 'blocked'; }).length;
    var issued = LS.get('rx-issued', 0) + MT.ADMIN_SEED.rxLog.filter(function (r) { return r.result === 'issued'; }).length;
    var over = MT.ADMIN_SEED.ratio.filter(function (r) { return r.pct > 30; }).length;
    main.innerHTML =
      '<h1>규제 준수 대시보드</h1><p class="admin-sub">이 서비스의 본체는 규제 준수입니다. 오픈 시점의 법으로 만들었는지 한 화면에서 증명합니다. (IR·감독기관 대응용)</p>' +
      // 규제 시점 스위치
      '<div class="acard" style="margin-bottom:20px;border:1.5px solid var(--sage)"><h2>규제 적용 시점 <span class="badge badge-sage">개정법 대응</span></h2>' +
      '<p style="font-size:13.5px;color:var(--ink-2);margin-bottom:12px">개정 의료법이 <b>2026년 12월 24일</b> 시행됩니다. 이 프로젝트 완료(2027.02) 시점엔 이미 새 법이 적용되므로, <b>오픈 시점의 법</b>으로 개발합니다. 스위치로 두 기준의 차이를 비교할 수 있습니다.</p>' +
      '<div style="display:flex;gap:8px"><button class="btn ' + (law === 'current' ? 'btn-primary' : 'btn-ghost') + ' btn-sm" data-law="current">현행 시범사업 기준</button>' +
      '<button class="btn ' + (law === 'future' ? 'btn-primary' : 'btn-ghost') + ' btn-sm" data-law="future">개정법 기준 (오픈 시점·권장)</button></div>' +
      '<div id="law-diff" style="margin-top:12px"></div></div>' +
      // KPI
      '<div class="admin-grid">' +
      kpi(3, issued, '비대면 처방 발행', '') +
      kpi(3, blocked, '향정신성 처방 차단', blocked ? 'var(--ok)' : '') +
      kpi(3, over, '30% 상한 초과 기관', over ? 'var(--bad)' : 'var(--ok)') +
      kpi(3, MT.ADMIN_SEED.reviewQueue, '심의 대기 후기', 'var(--warn)') +
      '<div class="acard span-6"><h2>처방 성분 차단 로그</h2><div class="tbl-scroll"><table class="tbl admin-tbl"><thead><tr><th>시각</th><th>의사</th><th>약물</th><th>결과</th></tr></thead><tbody>' +
      MT.ADMIN_SEED.rxLog.map(function (r) { return '<tr><td class="num">' + r.at + '</td><td>' + r.doctor + '</td><td>' + r.drug + '</td><td>' + (r.result === 'blocked' ? '<span class="badge badge-bad">차단</span>' : '<span class="badge badge-ok">발행</span>') + '</td></tr>'; }).join('') +
      '</tbody></table></div><p style="font-size:12px;color:var(--ink-3);margin-top:8px">"위법 처방 0건"을 로그로 증명 — 향정신성 성분은 의사 웹에서 발행 자체가 차단됩니다.</p></div>' +
      '<div class="acard span-6"><h2>준수 상태 요약</h2><div id="compliance-list"></div></div>' +
      '</div>';
    $$('[data-law]').forEach(function (b) { b.addEventListener('click', function () { law = b.dataset.law; LS.set('law-mode', law); updateLawIndicator(); VIEWS.dash(); }); });
    renderLawDiff(); renderCompliance();
  };
  function renderLawDiff() {
    var el = $('#law-diff'); if (!el) return;
    var rows = [
      ['향정신성 비대면 처방', law === 'future' ? '금지 (§34-3 ④)' : '제한적', law === 'future' ? 'bad' : 'warn'],
      ['초진 허용', law === 'future' ? '거주 지역 내 제한' : '한시적 허용', 'warn'],
      ['중개매체 신고', law === 'future' ? '신고 의무 (§34-8)' : '없음', law === 'future' ? 'warn' : 'ok'],
      ['의료광고 심의', law === 'future' ? '중개매체 심의 대상 (§57)' : '해당 없음', 'warn'],
    ];
    el.innerHTML = '<div class="tbl-scroll"><table class="tbl admin-tbl"><caption>기준별 차이</caption><thead><tr><th>항목</th><th>' + lawLabel() + '</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td><span class="badge badge-' + r[2] + '">' + r[1] + '</span></td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function renderCompliance() {
    var el = $('#compliance-list'); if (!el) return;
    var items = [
      ['향정신성 처방 시스템 차단', true],
      ['상담 중심(Z코드) 분기 제공', true],
      ['후기 치료효과 표현 필터', true],
      ['약국 특정 유인 없음(거리순만)', true],
      ['진료기록 관리자 열람 차단', true],
      ['위기 대응(109) 연계', true],
      ['중개매체 신고 (사업자 절차)', false],
      ['의료광고 사전심의 (성장 시)', false],
    ];
    el.innerHTML = items.map(function (it) {
      return '<div class="check-row" style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--line);font-size:14px">' +
        '<span class="badge ' + (it[1] ? 'badge-ok' : 'badge-warn') + '">' + (it[1] ? '구현' : '사업자 절차') + '</span><span>' + it[0] + '</span></div>';
    }).join('');
  }
  function kpi(span, num, cap, col) { return '<div class="acard span-' + span + '"><div class="kpi-num"' + (col ? ' style="color:' + col + '"' : '') + '>' + num + '</div><div class="kpi-cap">' + cap + '</div></div>'; }

  /* ═══ 의사 회원 관리 ═══ */
  VIEWS.doctors = function () {
    var docs = LS.get('doc-approval', MT.DOCTORS.map(function (d) { return { name: d.name, hospital: d.hospital, region: d.region, status: 'active' }; }));
    // 승인 대기 1건 추가
    if (!docs.find(function (d) { return d.status === 'pending'; })) docs.push({ name: '한지훈', hospital: '광주 온마음의원', region: '광주 서구', status: 'pending' });
    main.innerHTML = '<h1>의사 회원 관리</h1><p class="admin-sub">가입 신청 검토, 승인·반려, 계정 활성·비활성. 면허·의료기관 확인 후 승인합니다.</p>' +
      '<div class="acard"><h2>의사 목록</h2><div class="tbl-scroll"><table class="tbl admin-tbl"><thead><tr><th>의사</th><th>의료기관</th><th>지역</th><th>상태</th><th></th></tr></thead><tbody id="doc-rows"></tbody></table></div></div>';
    function render() {
      $('#doc-rows').innerHTML = docs.map(function (d, i) {
        var st = d.status === 'active' ? '<span class="badge badge-ok">활성</span>' : d.status === 'pending' ? '<span class="badge badge-warn">승인 대기</span>' : '<span class="badge badge-mute">비활성</span>';
        var btn = d.status === 'pending' ? '<button class="btn btn-primary btn-sm" data-approve="' + i + '">승인</button>' :
          d.status === 'active' ? '<button class="btn btn-ghost btn-sm" data-toggle="' + i + '">비활성</button>' : '<button class="btn btn-ghost btn-sm" data-toggle="' + i + '">활성</button>';
        return '<tr><td style="font-weight:600">' + esc(d.name) + ' 원장</td><td>' + esc(d.hospital) + '</td><td>' + esc(d.region) + '</td><td>' + st + '</td><td>' + btn + '</td></tr>';
      }).join('');
      $$('[data-approve]').forEach(function (b) { b.addEventListener('click', function () { docs[+b.dataset.approve].status = 'active'; LS.set('doc-approval', docs); render(); toast('의사 회원을 승인했습니다'); }); });
      $$('[data-toggle]').forEach(function (b) { b.addEventListener('click', function () { var d = docs[+b.dataset.toggle]; d.status = d.status === 'active' ? 'inactive' : 'active'; LS.set('doc-approval', docs); render(); }); });
    }
    render();
  };

  /* ═══ 30% 상한 모니터링 ═══ */
  VIEWS.ratio = function () {
    var rows = MT.ADMIN_SEED.ratio.slice().sort(function (a, b) { return b.pct - a.pct; });
    main.innerHTML = '<h1>비대면 30% 상한 모니터링</h1><p class="admin-sub">의료기관별 월 비대면 비율을 감시합니다. 상한(30%) 초과 기관은 정렬 상단에 강조되고, 신규 비대면 슬롯이 자동 잠깁니다.</p>' +
      '<div class="acard"><h2>기관별 비율 <span class="badge badge-bad" id="over-count"></span></h2><div id="ratio-list"></div></div>' +
      '<div class="acard" style="margin-top:20px"><h2>대안 흐름 — 대면 초진 연계</h2><p style="font-size:13.5px;color:var(--ink-2)">개정법상 초진은 환자 거주 지역 내에서만 가능하고, 상한을 넘긴 의사는 비대면을 받을 수 없습니다. 이때 <b>거주 지역 내 제휴 의료기관 대면 예약</b>으로 자동 연계해 "지역 무관 선택" 컨셉과 규제를 양립시킵니다.</p><button class="btn btn-ghost btn-sm" id="sim-relink" style="margin-top:10px">상한 초과 → 대면 연계 시뮬레이션</button><div id="relink-out" style="margin-top:10px"></div></div>';
    var over = rows.filter(function (r) { return r.pct > 30; }).length;
    $('#over-count').textContent = over + '개 초과';
    $('#ratio-list').innerHTML = rows.map(function (r) {
      var d = MT.docOf(r.doctor);
      var isOver = r.pct > 30;
      return '<div style="padding:14px 4px;border-bottom:1px solid var(--line)' + (isOver ? ';background:var(--bad-soft);border-radius:8px;padding-left:12px;padding-right:12px' : '') + '">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><b style="flex:1">' + d.name + ' 원장 <span style="font-size:12px;color:var(--ink-3);font-weight:500">' + d.hospital + '</span></b>' +
        '<b class="num" style="color:' + (isOver ? 'var(--bad)' : r.pct > 25 ? 'var(--warn)' : 'var(--sage-dk)') + '">' + r.pct + '%</b>' +
        (isOver ? '<span class="badge badge-bad">슬롯 잠금</span>' : '') + '</div>' +
        '<div class="gauge-track"><div class="gauge-fill" style="width:' + Math.min(100, r.pct / 0.4) + '%;background:' + (isOver ? 'var(--bad)' : r.pct > 25 ? 'var(--warn)' : 'var(--sage)') + ';transition:none"></div><div class="gauge-limit" style="left:30%"></div></div>' +
        '<div style="font-size:12px;color:var(--ink-3);margin-top:4px">' + r.remote + ' / ' + r.total + '건</div></div>';
    }).join('');
    $('#sim-relink').addEventListener('click', function () {
      $('#relink-out').innerHTML = '<div style="padding:12px;background:var(--sage-soft);border-radius:10px;font-size:13px;color:var(--ink-2)"><b style="color:var(--sage-dk)">이준호 원장(33.9%)</b>의 신규 비대면 예약 요청 → 환자 거주 지역(대구 중구) 내 제휴 대면 의료기관 3곳으로 자동 연계되었습니다.</div>';
      toast('상한 초과 의사의 예약이 대면 연계로 전환되었습니다');
    });
  };

  /* ═══ 정산 (급여/비급여 분리) ═══ */
  VIEWS.settle = function () {
    main.innerHTML = '<h1>정산</h1><p class="admin-sub">급여 진찰료는 건강보험공단이 의료기관에 직접 지급하며 플랫폼이 관여하지 않습니다. 플랫폼 수익은 건당 수수료가 아니라 월 정액 이용료입니다(환자 유인·알선 방지).</p>' +
      '<div class="admin-grid">' +
      '<div class="acard span-6"><h2>급여분 (플랫폼 미관여)</h2>' +
      '<div style="padding:16px;background:var(--bg);border-radius:10px"><div style="display:flex;justify-content:space-between;font-size:14px;padding:6px 0"><span>흐름</span><b>공단 → 의료기관 직접</b></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:14px;padding:6px 0"><span>플랫폼 수취</span><b style="color:var(--ok)">0원 (미관여)</b></div></div>' +
      '<p style="font-size:12.5px;color:var(--ink-3);margin-top:10px">' + MT.ADMIN_SEED.settlement.insuranceNote + '</p></div>' +
      '<div class="acard span-6"><h2>플랫폼 수익 모델</h2>' +
      '<div style="padding:16px;background:var(--bg);border-radius:10px"><div style="display:flex;justify-content:space-between;font-size:14px;padding:6px 0"><span>구조</span><b>월 정액 이용료 + PG 원가</b></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:14px;padding:6px 0"><span>건당 수수료</span><b style="color:var(--bad)">없음</b></div></div>' +
      '<p style="font-size:12.5px;color:var(--ink-3);margin-top:10px">건당 수수료는 환자 유인·알선(의료법 §27 ③)에 해당해 의사가 먼저 처벌받습니다. 정액 모델로 그 리스크를 제거합니다.</p></div>' +
      '<div class="acard span-12"><h2>의사별 정산 요약</h2><div class="tbl-scroll"><table class="tbl admin-tbl"><thead><tr><th>의사</th><th>급여(공단→기관)</th><th>플랫폼 이용료</th></tr></thead><tbody>' +
      MT.DOCTORS.map(function (d) { return '<tr><td>' + d.name + ' 원장</td><td class="num" style="color:var(--ink-3)">직접 지급 (미관여)</td><td class="num">월 99,000원</td></tr>'; }).join('') +
      '</tbody></table></div></div></div>';
  };

  /* ═══ 후기 심의 ═══ */
  VIEWS.reviews = function () {
    var reviews = LS.get('review-mod', MT.REVIEWS.map(function (r) { return Object.assign({}, r); }));
    main.innerHTML = '<h1>후기 심의</h1><p class="admin-sub">치료 효과·완치·추천 유도 표현은 불법 의료광고(의료법 §56)입니다. 자동 필터가 잡은 후기를 심의해 노출·비노출을 결정합니다.</p>' +
      '<div class="acard"><h2>후기 심의 큐</h2><div id="review-rows"></div></div>';
    function render() {
      $('#review-rows').innerHTML = reviews.map(function (r, i) {
        var d = MT.docOf(r.doctor);
        var st = r.status === 'ok' ? '<span class="badge badge-ok">노출</span>' : r.status === 'blocked' ? '<span class="badge badge-bad">비노출</span>' : '<span class="badge badge-warn">심의 대기</span>';
        return '<div style="padding:14px 4px;border-bottom:1px solid var(--line)"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' + st +
          '<b style="font-size:13.5px">' + (d ? d.name + ' 원장' : '') + '</b><span class="num" style="font-size:12px;color:var(--warm)">★ ' + r.rating + '</span><span style="font-size:11.5px;color:var(--ink-3);margin-left:auto">' + r.at + '</span></div>' +
          '<p style="font-size:13.5px;color:var(--ink-2)">' + esc(r.text) + '</p>' +
          (r.reason ? '<p style="font-size:12px;color:var(--bad);margin-top:4px">⚠ ' + r.reason + '</p>' : '') +
          (r.status !== 'ok' ? '<div style="display:flex;gap:6px;margin-top:8px"><button class="btn btn-primary btn-sm" data-ok="' + i + '">노출 승인</button><button class="btn btn-ghost btn-sm" data-block="' + i + '">비노출 유지</button></div>' : '') +
          '</div>';
      }).join('');
      $$('[data-ok]').forEach(function (b) { b.addEventListener('click', function () { reviews[+b.dataset.ok].status = 'ok'; reviews[+b.dataset.ok].reason = null; LS.set('review-mod', reviews); render(); toast('후기를 노출 승인했습니다'); }); });
      $$('[data-block]').forEach(function (b) { b.addEventListener('click', function () { reviews[+b.dataset.block].status = 'blocked'; LS.set('review-mod', reviews); render(); toast('후기를 비노출 처리했습니다'); }); });
    }
    render();
  };

  /* ═══ 사업자 준수 체크리스트 ═══ */
  VIEWS.checklist = function () {
    main.innerHTML = '<h1>사업자 준수 체크리스트</h1><p class="admin-sub">발주사(사업자)가 직접 이행해야 하는 행정 절차입니다. 개발과 별개로 사업자 명의로 진행해야 서비스가 합법적으로 운영됩니다.</p>' +
      '<div class="acard"><h2>필수 절차</h2>' +
      [
        ['비대면진료 중개매체 신고 (§34-8 ②)', '사업자 법인 설립 후 관할 기관에 신고. 미신고 운영 시 처벌.', false],
        ['민감정보(건강정보) 별도 동의', '일반 개인정보 동의와 분리된 별도 동의 + 강화된 안전조치. 앱 가입 화면에 구현됨(미체크 시 진행 차단).', true],
        ['의료광고 사전심의 준비', '일평균 이용자 10만 명 초과 시 중개매체가 심의 대상. 성장 시 자동 적용.', false],
        ['정신건강의학과 전문의 의학적 감수', '공동대표 합류 시 서비스 정책·문진·처방 로직 감수.', false],
        ['진료기록 보관 주체 확정', '의료기관 vs 플랫폼 — 법적 책임 소재. 미팅에서 확정 필요.', false],
      ].map(function (it) {
        return '<div style="padding:14px 4px;border-bottom:1px solid var(--line)"><div style="display:flex;align-items:center;gap:10px"><span class="badge ' + (it[2] ? 'badge-ok' : 'badge-warn') + '">' + (it[2] ? '구현' : '사업자 이행') + '</span><b style="flex:1;font-size:14.5px">' + it[0] + '</b></div><p style="font-size:12.5px;color:var(--ink-3);margin-top:6px">' + it[1] + '</p></div>';
      }).join('') + '</div>';
  };

  updateLawIndicator();
  show('dash');
})();
