/* ============================================================
   MOLIP — 통합 관리자(대시보드) 로직
   회원 · 출석 슬롯 · 리포트 발송 · 요금/공지 편집
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function toast(msg, type) {
    var el = document.createElement('div'); el.className = 'toast ' + (type || '');
    el.innerHTML = msg; $('#toasts').appendChild(el);
    setTimeout(function () { el.style.transition = '.35s'; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(function () { el.remove(); }, 360); }, 3400);
  }

  /* KPI */
  var act = MEMBERS.filter(function (m) { return m.status === 'act'; }).length;
  var neu = MEMBERS.filter(function (m) { return m.status === 'new'; }).length;
  var fixed = MEMBERS.filter(function (m) { return m.plan === '고정석'; }).length;
  var parents = MEMBERS.filter(function (m) { return m.parent !== '—'; }).length;
  $('#kpis').innerHTML =
    kpi(act, '명', 'green', '활동 회원') + kpi(neu, '명', 'amber', '신규 신청(대기)') +
    kpi(fixed, '명', '', '고정석(관리형)') + kpi(parents, '명', '', '리포트 대상 학부모');
  function kpi(v, u, c, l) { return '<div class="kpi"><div class="v ' + c + '">' + v + '<span style="font-size:13px;color:var(--muted)">' + u + '</span></div><div class="l">' + l + '</div></div>'; }

  /* 회원 */
  $('#memberBody').innerHTML = MEMBERS.map(function (m) {
    var st = m.status === 'act' ? '<span class="badge act">활동</span>' : '<span class="badge new">신규</span>';
    return '<tr><td><b>' + m.name + '</b></td><td>' + m.grade + '</td><td class="mono">' + m.seat + '</td><td>' + m.plan + '</td><td class="mono" style="font-size:12px">' + m.phone + '</td><td class="mono" style="font-size:12px">' + m.parent + '</td><td class="mono">' + (m.month ? m.month + 'h' : '—') + '</td><td>' + st + '</td></tr>';
  }).join('');

  /* 출석 슬롯 */
  var seatMembers = MEMBERS.filter(function (m) { return m.seat !== '—'; });
  $('#seatSel').innerHTML = seatMembers.map(function (m, i) { return '<option value="' + i + '">' + m.seat + ' · ' + m.name + ' (' + m.grade + ')</option>'; }).join('');
  var attState = null, curSeat = 0;
  function loadAtt(idx) {
    curSeat = idx; var m = seatMembers[idx];
    attState = seedAttendance(m.seat);
    renderAtt();
  }
  function renderAtt() {
    var head = '<thead><tr><th>시간</th>' + DAYS.map(function (d) { return '<th>' + d + '</th>'; }).join('') + '</tr></thead>';
    var body = '<tbody>' + HOURS.map(function (hh, h) {
      return '<tr><th>' + hh + '</th>' + DAYS.map(function (dd, d) {
        var v = attState[h][d];
        return '<td><span class="slot ' + (v === 1 ? 'on' : v === 2 ? 'plan' : '') + '" data-h="' + h + '" data-d="' + d + '"></span></td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody>';
    $('#attGrid').innerHTML = head + body;
    $$('#attGrid .slot').forEach(function (el) {
      el.onclick = function () {
        var h = +el.dataset.h, d = +el.dataset.d;
        attState[h][d] = attState[h][d] === 1 ? 0 : 1; // 클릭 = 출석 토글
        renderAtt();
      };
    });
    sumAtt();
  }
  function sumAtt() {
    var on = 0, plan = 0;
    attState.forEach(function (row) { row.forEach(function (v) { if (v === 1) on++; else if (v === 2) plan++; }); });
    var m = seatMembers[curSeat];
    $('#attSum').innerHTML = '이번 주 출석 <b>' + on + '칸</b> · 누적 학습 <b>' + (on * 50 / 60).toFixed(1) + 'h</b> (칸당 50분)' +
      ' · 계획 <b>' + plan + '칸</b> · 월 목표 대비 <b>' + Math.round((on * 50 / 60) / (m.month || 60) * 100) + '%</b>';
  }
  $('#seatSel').onchange = function () { loadAtt(+this.value); };
  loadAtt(1); // 기본 A-12 이서연

  /* 리포트 */
  var period = 'weekly';
  function renderMail() {
    var r = REPORT[period], m = seatMembers[1];
    var pct = Math.round(r.hours / r.goal * 100);
    $('#mailPreview').innerHTML =
      '<div class="mail-hd"><div class="brand">몰 MOLIP 학습 리포트</div><div class="sub">' + r.period + ' · ' + m.name + '(' + m.grade + ') 학부모님께</div></div>' +
      '<div class="mail-bd">' +
        '<div class="mstat"><div><div class="v">' + r.attend + '</div><div class="l">출석</div></div><div><div class="v">' + r.hours + 'h</div><div class="l">학습시간</div></div><div><div class="v">' + pct + '%</div><div class="l">목표 달성</div></div></div>' +
        '<h4>목표 학습시간</h4>' +
        '<div class="mbar"><span class="nm">누적</span><span class="track"><span class="fill ' + (pct >= 80 ? 'green' : '') + '" data-w="' + Math.min(100, pct) + '"></span></span><span class="pc">' + r.hours + '/' + r.goal + 'h</span></div>' +
        '<h4 style="margin-top:14px">과목별 진도</h4>' +
        r.subjects.map(function (s) { return '<div class="mbar"><span class="nm">' + s[0] + '</span><span class="track"><span class="fill" data-w="' + s[1] + '"></span></span><span class="pc">' + s[1] + '%</span></div>'; }).join('') +
        '<div style="margin-top:12px;font-size:12px;color:var(--ink-2);line-height:1.6;padding:11px;background:var(--bg-2);border-radius:8px">💬 ' + r.note + '</div>' +
      '</div>' +
      '<div class="mail-ft">MOLIP 몰입 스터디카페 · 하늘도시점 · 본 메일은 동의하신 보호자께 발송됩니다 (수신거부 가능)</div>';
    // 바 성장
    setTimeout(function () { $$('#mailPreview .fill[data-w]').forEach(function (el) { el.style.width = el.dataset.w + '%'; }); }, 60);
  }
  $$('#reportSeg button').forEach(function (b) {
    b.onclick = function () { period = b.dataset.p; $$('#reportSeg button').forEach(function (x) { x.classList.toggle('on', x === b); }); renderMail(); };
  });
  $('#sendReport').onclick = function () {
    var res = $('#sendResult');
    res.style.display = 'block';
    res.innerHTML = '✅ ' + ({ weekly: '주간', monthly: '월간', yearly: '연간' }[period]) + ' 리포트를 <b>학부모 ' + MEMBERS.filter(function (m) { return m.parent !== '—'; }).length + '명</b>에게 발송했습니다 · SPF/DKIM 인증 · 도달 확인됨(시뮬)';
    toast('📧 리포트 발송 완료 (스팸 처리 없이 도달)', 'ok');
  };
  renderMail();

  /* 편집기 */
  $('#edSave').onclick = function () {
    toast('💾 저장됨 · 공개 홈의 요금·공지·이벤트에 <b>즉시 반영</b>됩니다 (개발자 요청 없이)', 'ok');
  };

  /* 탭 */
  function setTab(t) {
    $$('.tab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === t); });
    $$('.apanel').forEach(function (p) { p.classList.toggle('on', p.dataset.panel === t); });
  }
  $$('.tab').forEach(function (b) { b.onclick = function () { setTab(b.dataset.tab); }; });
  $$('.hd-nav a[data-jump]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); setTab(a.dataset.jump); window.scrollTo({ top: 0, behavior: 'smooth' }); }; });
})();
