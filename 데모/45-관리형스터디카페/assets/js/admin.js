/* ============================================================
   MOLIP — 통합 관리자(대시보드) 로직
   대시보드 · 회원 · 개인별 출석(엑셀 개인별 계획표) ·
   전체 좌석 출석(엑셀 일별 전체 출석표) · 리포트 · 편집기
   모든 수치는 계획/출석 그리드에서 실계산 (하드코딩 없음)
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function toast(msg, type) {
    var el = document.createElement('div'); el.className = 'toast ' + (type || '');
    el.innerHTML = msg; $('#toasts').appendChild(el);
    setTimeout(function () { el.style.transition = '.35s'; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(function () { el.remove(); }, 360); }, 3600);
  }
  function slotH(n) { return n * 50 / 60; } /* 칸당 50분 → 시간 */
  function fmtH(h) { return (Math.round(h * 10) / 10) + 'h'; }

  /* ---------- 시간 기준 ---------- */
  var NOW = new Date();
  var todayIdx = (NOW.getDay() + 6) % 7;           /* 0=월 */
  var nowHour = NOW.getHours();
  var dayN = Math.floor((NOW.getTime() - NOW.getTimezoneOffset() * 60000) / 86400000);
  var wk0 = Math.floor((dayN + 3) / 7);            /* 월요일 기준 주 id */
  function weekIdOf(offsetDays) { return Math.floor((dayN + offsetDays + 3) / 7); }
  function dayIdxOf(offsetDays) { var d = new Date(NOW.getTime() + offsetDays * 86400000); return (d.getDay() + 6) % 7; }
  function dateOf(offsetDays) { return new Date(NOW.getTime() + offsetDays * 86400000); }
  function dateLabel(d) { return (d.getMonth() + 1) + '/' + d.getDate() + ' (' + DAYS[(d.getDay() + 6) % 7] + ')'; }

  /* past 판정: 해당 주(weekId)의 (요일 d, 시각 h)가 지났는가 */
  function pastFn(weekId) {
    if (weekId < wk0) return function () { return true; };
    if (weekId > wk0) return function () { return false; };
    return function (d, h) { return d < todayIdx || (d === todayIdx && h < nowHour); };
  }

  /* ---------- 상태 ---------- */
  var S = {
    view: 'home', mode: 'term',
    stu: 1, week: 0, attMode: 'check',   /* 개인별 출석 */
    dOff: 0,                              /* 전체 좌석: 오늘 기준 일 오프셋 */
    period: 'weekly', repStu: 1,
    q: '', filter: 'all',
  };

  /* ---------- 그리드 캐시 (뷰 간 공유 — 개인별에서 체크하면 전체 좌석에도 반영) ---------- */
  var GC = {};
  function grids(mi, weekId) {
    var key = S.mode + '|' + mi + '|' + weekId;
    if (!GC[key]) {
      var m = MEMBERS[mi];
      var p = mkPlan(m, weekId, S.mode);
      GC[key] = { plan: p, act: mkActual(m, weekId, S.mode, p, pastFn(weekId)) };
    }
    return GC[key];
  }

  /* ---------- 주간 통계 (실계산) ---------- */
  function weekStats(mi, weekId) {
    var g = grids(mi, weekId), past = pastFn(weekId);
    var st = { planSlots: 0, actSlots: 0, onPlan: 0, pastPlan: 0, missed: 0, days: 0 };
    for (var d = 0; d < 7; d++) {
      var attended = false;
      for (var i = 0; i < HOURS.length; i++) {
        var p = g.plan[i][d], a = g.act[i][d];
        if (p) st.planSlots++;
        if (a) { st.actSlots++; attended = true; }
        if (p && past(d, HOURS[i])) { st.pastPlan++; if (a) st.onPlan++; else st.missed++; }
      }
      if (attended) st.days++;
    }
    return st;
  }
  function sumStats(mi, fromWeek, nWeeks) {
    var t = { planSlots: 0, actSlots: 0, onPlan: 0, pastPlan: 0, missed: 0, days: 0 };
    for (var w = 0; w < nWeeks; w++) {
      var s = weekStats(mi, fromWeek + w);
      for (var k in t) t[k] += s[k];
    }
    return t;
  }
  function adherence(st) { return st.pastPlan ? Math.round(st.onPlan / st.pastPlan * 100) : null; }

  /* ---------- 공통 UI 조각 ---------- */
  function gauge(pct, cls) {
    var w = Math.max(0, Math.min(100, pct));
    return '<span class="track"><span class="fill ' + (cls || '') + '" style="width:' + w + '%"></span></span>';
  }
  function drawBars(canvas, values, labels, hiIdx) {
    var dpr = window.devicePixelRatio || 1;
    var W = canvas.clientWidth || canvas.parentElement.clientWidth, H = canvas.getAttribute('height') * 1;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.height = H + 'px';
    var c = canvas.getContext('2d'); c.scale(dpr, dpr);
    var max = Math.max(1, Math.max.apply(null, values));
    var pad = 4, bw = (W - pad * 2) / values.length;
    var css = getComputedStyle(document.documentElement);
    var amber = css.getPropertyValue('--amber').trim() || '#D89A2E';
    var line = css.getPropertyValue('--line').trim() || '#ECE4D8';
    var muted = css.getPropertyValue('--muted').trim() || '#948A7C';
    c.clearRect(0, 0, W, H);
    for (var i = 0; i < values.length; i++) {
      var h = values[i] / max * (H - 34);
      var x = pad + i * bw + bw * 0.18, w = bw * 0.64;
      c.fillStyle = i === hiIdx ? amber : (values[i] ? '#E8CF9E' : line);
      var y = H - 20 - h;
      c.beginPath();
      if (c.roundRect) c.roundRect(x, y, w, Math.max(h, 2), 3); else c.rect(x, y, w, Math.max(h, 2));
      c.fill();
      if (values[i]) { c.fillStyle = '#7a5410'; c.font = '700 9px ' + css.getPropertyValue('--mono'); c.textAlign = 'center'; c.fillText(values[i], x + w / 2, y - 4); }
      c.fillStyle = muted; c.font = '600 9px ' + css.getPropertyValue('--mono'); c.textAlign = 'center';
      c.fillText(labels[i], x + w / 2, H - 7);
    }
  }
  function csvDownload(name, rows) {
    var csv = '﻿' + rows.map(function (r) {
      return r.map(function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',');
    }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 800);
  }

  var seatMembers = MEMBERS.map(function (m, i) { return { m: m, i: i }; }).filter(function (x) { return x.m.seat !== '—'; });
  function memberAtSeat(seat) {
    for (var k = 0; k < MEMBERS.length; k++) if (MEMBERS[k].seat === seat) return k;
    return -1;
  }

  /* ============================================================
     뷰 1 — 대시보드
     ============================================================ */
  function dayColumn(dOff) { /* 해당 날짜의 좌석×시간 재실 (실계산 + 사용자가 토글한 값 포함) */
    var weekId = weekIdOf(dOff), d = dayIdxOf(dOff);
    return SEATS.map(function (seat) {
      var mi = memberAtSeat(seat);
      if (mi < 0) return null;
      var g = grids(mi, weekId);
      return { seat: seat, mi: mi, act: HOURS.map(function (h, i) { return g.act[i][d]; }), plan: HOURS.map(function (h, i) { return g.plan[i][d]; }) };
    }).filter(Boolean);
  }
  function renderHome() {
    var col = dayColumn(0);
    var act = MEMBERS.filter(function (m) { return m.status === 'act'; }).length;
    var neu = MEMBERS.filter(function (m) { return m.status === 'new'; }).length;
    var todayCnt = col.filter(function (r) { return r.act.some(function (v) { return v; }); }).length;
    var hIdx = HOURS.indexOf(nowHour);
    var nowCnt = hIdx >= 0 ? col.filter(function (r) { return r.act[hIdx]; }).length : 0;
    var adhs = seatMembers.map(function (x) { return adherence(weekStats(x.i, wk0 - 1)); }).filter(function (v) { return v != null; });
    var avgAdh = adhs.length ? Math.round(adhs.reduce(function (a, b) { return a + b; }, 0) / adhs.length) : 0;

    $('#kpis').innerHTML =
      kpi(act + '<u>명</u>', '활동 회원', '고정석 ' + seatMembers.length + ' · 자유/라운지 ' + (act - seatMembers.length), '') +
      kpi(todayCnt + '<u>명</u>', '오늘 출석', hIdx >= 0 ? '현재 재실 ' + nowCnt + '명' : '현재 운영시간 외', 'amber') +
      kpi(avgAdh + '<u>%</u>', '평균 계획 이행률', '지난주 · 고정석 ' + adhs.length + '명 기준', avgAdh >= 80 ? 'green' : avgAdh >= 60 ? 'amber' : 'red') +
      kpi(neu + '<u>명</u>', '신규 신청 대기', '가입 처리 필요', neu ? 'amber' : '');
    function kpi(v, l, sub, c) { return '<div class="kpi"><div class="v ' + c + '">' + v + '</div><div class="l">' + l + '</div><div class="sub">' + sub + '</div></div>'; }

    /* 시간대별 재실 차트 */
    var perHour = HOURS.map(function (h, i) { return col.filter(function (r) { return r.act[i]; }).length; });
    drawBars($('#occChart'), perHour, HOURS.map(function (h) { return h + '시'; }), hIdx);
    $('#occNote').textContent = dateLabel(NOW) + ' · ' + OPEN_HOURS[S.mode].label + ' 운영';

    /* 관리 필요 — 엑셀 규칙(월 60h) + 이행률 실계산 */
    var alerts = [];
    seatMembers.forEach(function (x) {
      var st = weekStats(x.i, wk0 - 1);
      var planM = slotH(st.planSlots) * 4;      /* 주 계획 → 월 환산 */
      var adh = adherence(st);
      var tags = [];
      if (planM < RULE_MIN_MONTH_H) tags.push('<span class="tag red">계획 월 ' + Math.round(planM) + 'h — 60h 규칙 미달</span>');
      if (adh != null && adh < 75) tags.push('<span class="tag amber">이행률 ' + adh + '%</span>');
      if (tags.length) alerts.push({ x: x, adh: adh == null ? 0 : adh, tags: tags });
    });
    alerts.sort(function (a, b) { return a.adh - b.adh; });
    $('#alertList').innerHTML = alerts.length ? alerts.map(function (a) {
      return '<div class="stu-row"><div class="who"><b>' + a.x.m.name + '</b><span>' + a.x.m.grade + ' · ' + a.x.m.seat + '</span></div>' +
        '<div class="tags">' + a.tags.join('') + '</div>' +
        gauge(a.adh, a.adh >= 75 ? 'green' : '') +
        '<button class="btn btn-g btn-xs" data-rep="' + a.x.i + '">리포트</button></div>';
    }).join('') : '<p class="empty">이번 주 관리 필요 학생이 없습니다.</p>';
    $$('#alertList [data-rep]').forEach(function (b) {
      b.onclick = function () { S.repStu = +b.dataset.rep; setView('report'); };
    });

    /* 최근 신청 */
    $('#newBody').innerHTML = MEMBERS.filter(function (m) { return m.status === 'new'; }).map(function (m) {
      return '<tr><td><b>' + m.name + '</b></td><td>' + m.grade + '</td><td>' + m.plan + '</td><td class="mono sm">' + m.phone + '</td><td class="mono sm">' + m.parent + '</td><td><span class="badge new">신규</span></td></tr>';
    }).join('');
  }

  /* ============================================================
     뷰 2 — 회원 관리
     ============================================================ */
  function renderMembers() {
    var q = S.q.trim();
    var rows = MEMBERS.filter(function (m) {
      if (S.filter === 'act' && m.status !== 'act') return false;
      if (S.filter === 'new' && m.status !== 'new') return false;
      if (S.filter === 'fixed' && m.plan !== '고정석') return false;
      if (q && m.name.indexOf(q) < 0 && m.seat.indexOf(q) < 0) return false;
      return true;
    });
    $('#memberBody').innerHTML = rows.map(function (m) {
      var mi = MEMBERS.indexOf(m);
      var st4 = m.seat !== '—' ? sumStats(mi, wk0 - 3, 4) : null;
      var lastW = m.seat !== '—' ? weekStats(mi, wk0 - 1) : null;
      var adh = lastW ? adherence(lastW) : null;
      var badge = m.status === 'act' ? '<span class="badge act">활동</span>' : '<span class="badge new">신규</span>';
      return '<tr><td><b>' + m.name + '</b></td><td>' + m.grade + '</td><td class="mono">' + m.seat + '</td><td>' + m.plan + '</td>' +
        '<td class="mono">' + (m.goalM ? m.goalM + 'h' : '—') + '</td>' +
        '<td class="mono">' + (st4 ? fmtH(slotH(st4.actSlots)) : '—') + '</td>' +
        '<td>' + (adh != null ? '<span class="adh">' + gauge(adh, adh >= 75 ? 'green' : '') + '<b class="mono">' + adh + '%</b></span>' : '<span class="mono sm" style="color:var(--muted)">—</span>') + '</td>' +
        '<td class="mono sm">' + m.parent + '</td><td>' + badge + '</td></tr>';
    }).join('') || '<tr><td colspan="9" class="empty">검색 결과가 없습니다.</td></tr>';
  }

  /* ============================================================
     뷰 3 — 개인별 출석 (엑셀 「개인별 출석 계획표」)
     ============================================================ */
  function renderAttend() {
    var weekId = wk0 + S.week;
    var x = seatMembers[S.stu] || seatMembers[0];
    var g = grids(x.i, weekId), past = pastFn(weekId);

    var head = '<thead><tr><th>시간</th>' + DAYS.map(function (dd, d) {
      var dt = dateOf((S.week * 7) + (d - todayIdx));
      var isToday = S.week === 0 && d === todayIdx;
      return '<th class="' + (isToday ? 'today' : '') + '">' + (dt.getMonth() + 1) + '/' + dt.getDate() + '<br>(' + dd + ')</th>';
    }).join('') + '</tr></thead>';

    var body = '<tbody>' + HOURS.map(function (h, i) {
      return '<tr><th>' + hourLabel(h) + '</th>' + DAYS.map(function (dd, d) {
        if (!isOpen(S.mode, d, h)) return '<td><span class="c closed" title="운영시간 외"></span></td>';
        var p = g.plan[i][d], a = g.act[i][d];
        var cls = a ? 'on' : (p ? (past(d, h) ? 'miss' : 'plan') : '');
        var mark = a ? 'O' : (p ? (past(d, h) ? '×' : 'O') : '');
        return '<td><button class="c ' + cls + '" data-i="' + i + '" data-d="' + d + '" aria-label="' + dd + ' ' + hourLabel(h) + '">' + mark + '</button></td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody>';

    $('#attGrid').innerHTML = head + body;
    $$('#attGrid .c[data-i]').forEach(function (el) {
      el.onclick = function () {
        var i = +el.dataset.i, d = +el.dataset.d;
        if (S.attMode === 'plan') g.plan[i][d] = g.plan[i][d] ? 0 : 1;
        else g.act[i][d] = g.act[i][d] ? 0 : 1;
        renderAttend();
      };
    });

    /* 요약 (실계산) */
    var st = weekStats(x.i, weekId);
    var planH = slotH(st.planSlots), actH = slotH(st.actSlots);
    var adh = adherence(st);
    var m4 = sumStats(x.i, wk0 - 3, 4);           /* 최근 4주 누적 → 월 페이스 */
    var pace = x.m.goalM ? Math.round(slotH(m4.actSlots) / x.m.goalM * 100) : 0;
    var planM = Math.round(planH * 4);
    $('#sumWho').textContent = x.m.seat + ' · ' + x.m.name;
    $('#attSum').innerHTML =
      row('이번 주 계획 (O표시)', fmtH(planH) + ' · ' + st.planSlots + '칸', null) +
      row('실제 출석', fmtH(actH) + ' · ' + st.actSlots + '칸', null) +
      row('계획 이행률', adh == null ? '집계 전' : adh + '%', adh == null ? null : { pct: adh, cls: adh >= 75 ? 'green' : '' }) +
      row('계획 미이행', st.missed + '칸', null) +
      row('월 목표 페이스 (' + x.m.goalM + 'h)', fmtH(slotH(m4.actSlots)) + ' · ' + pace + '%', { pct: pace, cls: pace >= 75 ? 'green' : '' }) +
      '<div class="rule-check ' + (planM >= RULE_MIN_MONTH_H ? 'ok' : 'bad') + '">' +
      (planM >= RULE_MIN_MONTH_H
        ? '규칙 충족 — 계획 월 환산 ' + planM + 'h ≥ 최소 60h'
        : '규칙 미달 — 계획 월 환산 ' + planM + 'h < 최소 60h · 학생과 계획 조정 필요') + '</div>';
    function row(l, v, g2) {
      return '<div class="srow"><span class="k">' + l + '</span><b class="mono">' + v + '</b>' + (g2 ? gauge(g2.pct, g2.cls) : '') + '</div>';
    }
    $('#attHint').textContent = S.attMode === 'plan' ? '계획 편집 모드 — 칸 클릭 = 계획 O 토글' : '출석 체크 모드 — 칸 클릭 = 출석 토글';
    $('#wLabel').textContent = S.week === 0 ? '이번 주' : (S.week === -1 ? '지난주' : Math.abs(S.week) + '주 전');
    $('#wNext').disabled = S.week >= 0;
  }

  /* ============================================================
     뷰 4 — 전체 좌석 출석 (엑셀 「일별 전체 출석표」)
     ============================================================ */
  function renderSeats() {
    var dOff = S.dOff, weekId = weekIdOf(dOff), d = dayIdxOf(dOff), past = pastFn(weekId);
    var isToday = dOff === 0;
    var hIdx = HOURS.indexOf(nowHour);

    var head = '<thead><tr><th>좌석</th>' + HOURS.map(function (h, i) {
      var cur = isToday && i === hIdx;
      return '<th class="hcol ' + (cur ? 'today' : '') + '" data-hi="' + i + '" title="클릭 = 이 시간대 일괄 체크">' + h + '시</th>';
    }).join('') + '</tr></thead>';

    var body = '<tbody>' + ZONES.map(function (z) {
      return '<tr class="zone"><th colspan="' + (HOURS.length + 1) + '">' + z.name + '</th></tr>' +
        z.seats.map(function (seat) {
          var mi = memberAtSeat(seat);
          var g = mi >= 0 ? grids(mi, weekId) : null;
          var name = mi >= 0 ? MEMBERS[mi].name : '공석';
          return '<tr' + (mi < 0 ? ' class="vacant"' : '') + '><th><span class="mono">' + seat + '</span><em>' + name + '</em></th>' +
            HOURS.map(function (h, i) {
              if (mi < 0 || !isOpen(S.mode, d, h)) return '<td><span class="c closed"></span></td>';
              var a = g.act[i][d], p = g.plan[i][d];
              var cls = a ? 'on' : (p && !past(d, h) ? 'plan' : '');
              var cur = isToday && i === hIdx ? ' now' : '';
              return '<td><button class="c ' + cls + cur + '" data-mi="' + mi + '" data-i="' + i + '" aria-label="' + seat + ' ' + h + '시">' + (a ? 'O' : '') + '</button></td>';
            }).join('') + '</tr>';
        }).join('');
    }).join('') + '</tbody>';

    $('#seatGrid').innerHTML = head + body;
    $$('#seatGrid .c[data-mi]').forEach(function (el) {
      el.onclick = function () {
        var g = grids(+el.dataset.mi, weekId);
        var i = +el.dataset.i;
        g.act[i][d] = g.act[i][d] ? 0 : 1;
        renderSeats();
      };
    });
    /* 시간 헤더 = 일괄 토글 */
    $$('#seatGrid .hcol').forEach(function (th) {
      th.onclick = function () {
        var i = +th.dataset.hi;
        if (!isOpen(S.mode, d, HOURS[i])) { toast('운영시간 외 시간대입니다 (' + OPEN_HOURS[S.mode].txt + ')', 'warn'); return; }
        var mis = SEATS.map(memberAtSeat).filter(function (mi) { return mi >= 0; });
        var anyOff = mis.some(function (mi) { return !grids(mi, weekId).act[i][d]; });
        mis.forEach(function (mi) { grids(mi, weekId).act[i][d] = anyOff ? 1 : 0; });
        renderSeats();
        toast(HOURS[i] + '시 전체 좌석을 ' + (anyOff ? '출석 처리' : '해제') + '했습니다 · 개인별 출석·리포트에 즉시 반영', 'ok');
      };
    });

    /* 요약 (실계산) */
    var col = dayColumn(dOff);
    var attSeat = col.filter(function (r) { return r.act.some(Boolean); }).length;
    var totalSlots = col.reduce(function (s, r) { return s + r.act.filter(Boolean).length; }, 0);
    var openCnt = HOURS.filter(function (h) { return isOpen(S.mode, d, h); }).length * col.length;
    var occ = openCnt ? Math.round(totalSlots / openCnt * 100) : 0;
    var vac = SEATS.length - col.length;
    $('#seatSum').innerHTML =
      '<div class="srow"><span class="k">출석 좌석</span><b class="mono">' + attSeat + ' / ' + col.length + '석</b>' + gauge(col.length ? attSeat / col.length * 100 : 0, 'green') + '</div>' +
      '<div class="srow"><span class="k">총 이용 시간</span><b class="mono">' + fmtH(slotH(totalSlots)) + '</b></div>' +
      '<div class="srow"><span class="k">운영시간 내 좌석 가동률</span><b class="mono">' + occ + '%</b>' + gauge(occ, '') + '</div>' +
      '<div class="srow"><span class="k">공석 (배정 가능)</span><b class="mono">' + vac + '석</b></div>';
    var perHour = HOURS.map(function (h, i) { return col.filter(function (r) { return r.act[i]; }).length; });
    drawBars($('#seatChart'), perHour, HOURS.map(function (h) { return h + '시'; }), isToday ? hIdx : -1);
    $('#seatChartNote').textContent = dateLabel(dateOf(dOff));
    $('#dLabel').textContent = dateLabel(dateOf(dOff)) + (isToday ? ' · 오늘' : '');
    $('#seatOpenChip').textContent = OPEN_HOURS[S.mode].label + ' — ' + OPEN_HOURS[S.mode].txt;
  }

  /* CSV — 엑셀 「일별 전체 출석표」 양식 그대로 */
  $('#csvDaily').onclick = function () {
    var dOff = S.dOff, weekId = weekIdOf(dOff), d = dayIdxOf(dOff);
    var dt = dateOf(dOff);
    var rows = [['■ ' + (dt.getMonth() + 1) + '월' + dt.getDate() + '일(' + DAYS[d] + ') — MOLIP 전체 좌석 출석표'], []];
    rows.push(['좌석', '이용자'].concat(HOURS.map(function (h) { return h + '시'; })));
    SEATS.forEach(function (seat) {
      var mi = memberAtSeat(seat);
      var g = mi >= 0 ? grids(mi, weekId) : null;
      rows.push([seat, mi >= 0 ? MEMBERS[mi].name : '공석'].concat(HOURS.map(function (h, i) {
        return g && g.act[i][d] ? 'O' : '';
      })));
    });
    csvDownload('MOLIP_전체좌석출석표_' + (dt.getMonth() + 1) + '-' + dt.getDate() + '.csv', rows);
    toast('엑셀 양식 그대로 CSV를 내려받았습니다 (UTF-8 BOM · 엑셀 호환)', 'ok');
  };
  $('#csvMembers').onclick = function () {
    var rows = [['이름', '학년', '좌석', '요금제', '월 목표(h)', '최근 4주 학습(h)', '지난주 이행률(%)', '학부모 연락처', '상태']];
    MEMBERS.forEach(function (m, mi) {
      var st4 = m.seat !== '—' ? sumStats(mi, wk0 - 3, 4) : null;
      var adh = m.seat !== '—' ? adherence(weekStats(mi, wk0 - 1)) : null;
      rows.push([m.name, m.grade, m.seat, m.plan, m.goalM || '', st4 ? Math.round(slotH(st4.actSlots) * 10) / 10 : '', adh == null ? '' : adh, m.parent, m.status === 'act' ? '활동' : '신규']);
    });
    csvDownload('MOLIP_회원명부.csv', rows);
    toast('회원 명부 CSV를 내려받았습니다', 'ok');
  };

  /* ============================================================
     뷰 5 — 학습 리포트 (계획 대비 실제 — 실계산)
     ============================================================ */
  function reportData(mi, period) {
    var m = MEMBERS[mi];
    if (period === 'weekly') {
      var st = weekStats(mi, wk0 - 1);
      var parts = DAYS.map(function (dd, d) {
        var g = grids(mi, wk0 - 1); var p = 0, a = 0;
        for (var i = 0; i < HOURS.length; i++) { if (g.plan[i][d]) p++; if (g.act[i][d]) a++; }
        return { label: dd, plan: slotH(p), act: slotH(a) };
      });
      return { title: '주간 리포트', range: rangeLabel(-(todayIdx + 7), -(todayIdx + 1)), st: st, goal: m.goalM / 4, days: st.days + '/7일', parts: parts };
    }
    if (period === 'monthly') {
      var st4 = sumStats(mi, wk0 - 4, 4);
      var parts4 = [];
      for (var w = 0; w < 4; w++) {
        var s = weekStats(mi, wk0 - 4 + w);
        parts4.push({ label: (4 - w) + '주 전', plan: slotH(s.planSlots), act: slotH(s.actSlots) });
      }
      return { title: '월간 리포트', range: rangeLabel(-(todayIdx + 28), -(todayIdx + 1)), st: st4, goal: m.goalM, days: st4.days + '/28일', parts: parts4 };
    }
    var stY = sumStats(mi, wk0 - 48, 48);
    var partsY = [];
    for (var mo = 11; mo >= 0; mo--) {
      var sM = sumStats(mi, wk0 - 4 * (mo + 1), 4);
      var dt = new Date(NOW.getFullYear(), NOW.getMonth() - mo, 1);
      partsY.push({ label: (dt.getMonth() + 1) + '월', plan: slotH(sM.planSlots), act: slotH(sM.actSlots) });
    }
    return { title: '연간 리포트', range: '최근 12개월 누적', st: stY, goal: m.goalM * 12, days: stY.days + '/336일', parts: partsY };
  }
  function rangeLabel(a, b) {
    var f = dateOf(a), t = dateOf(b);
    return (f.getMonth() + 1) + '.' + f.getDate() + ' ~ ' + (t.getMonth() + 1) + '.' + t.getDate();
  }
  function noteFor(name, adh, goalPct) {
    if (adh == null) return '집계 기간이 아직 시작되지 않았습니다.';
    if (adh >= 90 && goalPct >= 90) return name + ' 학생이 세운 계획을 거의 그대로 지키고 있습니다. 훌륭한 페이스입니다.';
    if (adh >= 75) return '계획 이행률 ' + adh + '% — 꾸준함이 잘 유지되고 있습니다. 목표까지 조금만 더 챙겨주세요.';
    if (adh >= 50) return '계획 대비 이행률이 ' + adh + '%로 다소 낮습니다. 이번 주 상담에서 계획을 함께 조정하겠습니다.';
    return '계획한 시간의 절반 이상이 지켜지지 않았습니다(' + adh + '%). 원인 파악과 계획 재수립이 필요합니다.';
  }
  function renderReport() {
    var mi = S.repStu, m = MEMBERS[mi];
    if (m.seat === '—') { mi = seatMembers[0].i; m = MEMBERS[mi]; S.repStu = mi; }
    $('#repStu').value = mi;
    var r = reportData(mi, S.period);
    var hours = slotH(r.st.actSlots), planned = slotH(r.st.planSlots);
    var adh = adherence(r.st);
    var goalPct = r.goal ? Math.round(hours / r.goal * 100) : 0;
    var maxPart = Math.max(1, Math.max.apply(null, r.parts.map(function (p) { return Math.max(p.plan, p.act); })));

    $('#mailPreview').innerHTML =
      '<div class="mail-hd"><div class="brand">몰 MOLIP 학습 리포트</div><div class="sub">' + r.title + ' · ' + r.range + ' · ' + m.name + '(' + m.grade + ') 학부모님께</div></div>' +
      '<div class="mail-bd">' +
      '<div class="mstat">' +
      '<div><div class="v">' + r.days + '</div><div class="l">출석일</div></div>' +
      '<div><div class="v">' + fmtH(hours) + '</div><div class="l">실제 학습</div></div>' +
      '<div><div class="v">' + (adh == null ? '—' : adh + '%') + '</div><div class="l">계획 이행률</div></div>' +
      '</div>' +
      '<h4>목표 대비 학습시간</h4>' +
      '<div class="mbar"><span class="nm">목표</span><span class="track"><span class="fill goal" data-w="100"></span></span><span class="pc">' + fmtH(r.goal) + '</span></div>' +
      '<div class="mbar"><span class="nm">실제</span><span class="track"><span class="fill ' + (goalPct >= 80 ? 'green' : '') + '" data-w="' + Math.min(100, goalPct) + '"></span></span><span class="pc">' + fmtH(hours) + ' · ' + goalPct + '%</span></div>' +
      '<h4 style="margin-top:16px">계획(O표시) 대비 실제 출석</h4>' +
      '<div class="pv-grid" style="grid-template-columns:repeat(' + r.parts.length + ',1fr)">' +
      r.parts.map(function (p) {
        return '<div class="pv"><span class="bars"><i class="p" style="height:' + Math.round(p.plan / maxPart * 46) + 'px"></i><i class="a" style="height:' + Math.round(p.act / maxPart * 46) + 'px"></i></span><span class="lb">' + p.label + '</span></div>';
      }).join('') + '</div>' +
      '<div class="pv-legend"><span><i class="p"></i>계획 ' + fmtH(planned) + '</span><span><i class="a"></i>실제 ' + fmtH(hours) + '</span></div>' +
      (m.subj.length ? '<h4 style="margin-top:16px">과목별 진도</h4>' + m.subj.map(function (s2) {
        return '<div class="mbar"><span class="nm">' + s2[0] + '</span><span class="track"><span class="fill" data-w="' + s2[1] + '"></span></span><span class="pc">' + s2[1] + '%</span></div>';
      }).join('') : '') +
      '<div class="mnote">' + noteFor(m.name, adh, goalPct) + '</div>' +
      '</div>' +
      '<div class="mail-ft">MOLIP 몰입 스터디카페 · 하늘도시점 · 본 메일은 동의하신 보호자께 발송됩니다 (수신거부 가능)</div>';
    setTimeout(function () { $$('#mailPreview .fill[data-w]').forEach(function (el) { el.style.width = el.dataset.w + '%'; }); }, 60);

    var nParents = MEMBERS.filter(function (mm) { return mm.parent !== '—' && mm.status === 'act'; }).length;
    $('#repRecv').innerHTML = '수신: <b>학부모 ' + nParents + '명</b> (동의한 보호자만) · 발송: <b>SPF/DKIM 인증</b> 트랜잭셔널 · 스팸 처리 방지';
  }
  $('#repStu').onchange = function () { S.repStu = +this.value; renderReport(); };
  $$('#reportSeg button').forEach(function (b) {
    b.onclick = function () { S.period = b.dataset.p; $$('#reportSeg button').forEach(function (x) { x.classList.toggle('on', x === b); }); renderReport(); };
  });
  $('#sendReport').onclick = function () {
    var nParents = MEMBERS.filter(function (mm) { return mm.parent !== '—' && mm.status === 'act'; }).length;
    var res = $('#sendResult');
    res.style.display = 'block';
    res.innerHTML = '✓ ' + ({ weekly: '주간', monthly: '월간', yearly: '연간' }[S.period]) + ' 리포트를 <b>학부모 ' + nParents + '명</b>에게 발송했습니다 · SPF/DKIM 인증 · 도달 확인됨(시뮬)';
    toast('리포트 발송 완료 — 스팸 처리 없이 도달 (시뮬)', 'ok');
  };

  /* ============================================================
     뷰 6 — 편집기
     ============================================================ */
  $('#edSave').onclick = function () {
    toast('저장됨 — 공개 홈의 요금·공지·이벤트·운영시간 안내에 <b>즉시 반영</b>됩니다 (개발자 요청 없이)', 'ok');
  };

  /* ============================================================
     공통 — 뷰 전환 · 상단바 · 컨트롤 초기화
     ============================================================ */
  var VIEW_META = {
    home: ['대시보드', '오늘의 출석·재실·계획 이행률을 한눈에 — 모든 수치는 출석 데이터에서 실시간 계산됩니다'],
    members: ['회원 관리', '가입 신청 접수부터 월 목표·이행률까지 · 구글시트 자동 백업'],
    attend: ['개인별 출석 체크', '의뢰자 엑셀 「개인별 출석 계획표」 그대로 — 학생이 계획(O)을 제출하고, 실장이 출석을 체크합니다'],
    seats: ['전체 좌석 출석부', '의뢰자 엑셀 「일별 전체 출석표」 그대로 — 좌석×시간을 한 화면에서, 시간대 일괄 체크 지원'],
    report: ['학습 리포트', '계획 대비 실제 출석을 주/월/연 단위로 자동 생성해 학부모 이메일로 발송'],
    edit: ['요금·공지 편집', '자주 바뀌는 내용은 사장님이 직접 — 저장 즉시 공개 홈에 반영'],
  };
  var RENDER = { home: renderHome, members: renderMembers, attend: renderAttend, seats: renderSeats, report: renderReport, edit: function () { } };
  function setView(v) {
    S.view = v;
    $$('#sbNav button').forEach(function (b) { b.classList.toggle('on', b.dataset.view === v); });
    $$('.view').forEach(function (p) { p.classList.toggle('on', p.dataset.view === v); });
    $('#vTitle').textContent = VIEW_META[v][0];
    $('#vSub').textContent = VIEW_META[v][1];
    RENDER[v]();
    window.scrollTo({ top: 0 });
  }
  $$('#sbNav button').forEach(function (b) { b.onclick = function () { setView(b.dataset.view); }; });

  /* 학기중/방학 — 운영시간 규칙 전환 (엑셀 규칙 7번) */
  $$('#modeSeg button').forEach(function (b) {
    b.onclick = function () {
      if (S.mode === b.dataset.m) return;
      S.mode = b.dataset.m; GC = {};
      $$('#modeSeg button').forEach(function (x) { x.classList.toggle('on', x === b); });
      $('#openChip').textContent = OPEN_HOURS[S.mode].txt;
      RENDER[S.view]();
      toast('<b>' + OPEN_HOURS[S.mode].label + '</b> 운영시간으로 전환 — ' + OPEN_HOURS[S.mode].txt, 'ok');
    };
  });

  /* 개인별 출석 컨트롤 */
  $('#seatSel').innerHTML = seatMembers.map(function (x, i) { return '<option value="' + i + '">' + x.m.seat + ' · ' + x.m.name + ' (' + x.m.grade + ')</option>'; }).join('');
  $('#seatSel').value = S.stu;
  $('#seatSel').onchange = function () { S.stu = +this.value; renderAttend(); };
  $('#wPrev').onclick = function () { S.week--; renderAttend(); };
  $('#wNext').onclick = function () { if (S.week < 0) { S.week++; renderAttend(); } };
  $$('#attModeSeg button').forEach(function (b) {
    b.onclick = function () { S.attMode = b.dataset.m; $$('#attModeSeg button').forEach(function (x) { x.classList.toggle('on', x === b); }); renderAttend(); };
  });
  $('#ruleList').innerHTML = XLS_RULES.map(function (r) { return '<li>' + r + '</li>'; }).join('');

  /* 전체 좌석 컨트롤 */
  $('#dPrev').onclick = function () { S.dOff--; renderSeats(); };
  $('#dNext').onclick = function () { S.dOff++; renderSeats(); };
  $('#dToday').onclick = function () { S.dOff = 0; renderSeats(); };

  /* 회원 컨트롤 */
  $('#mSearch').oninput = function () { S.q = this.value; renderMembers(); };
  $$('#mFilter button').forEach(function (b) {
    b.onclick = function () { S.filter = b.dataset.f; $$('#mFilter button').forEach(function (x) { x.classList.toggle('on', x === b); }); renderMembers(); };
  });

  /* 리포트 학생 select */
  $('#repStu').innerHTML = seatMembers.map(function (x) { return '<option value="' + x.i + '">' + x.m.seat + ' · ' + x.m.name + ' (' + x.m.grade + ')</option>'; }).join('');

  /* 상단바 초기값 */
  $('#openChip').textContent = OPEN_HOURS[S.mode].txt;
  $('#todayChip').textContent = (NOW.getFullYear()) + '.' + (NOW.getMonth() + 1) + '.' + NOW.getDate() + ' (' + DAYS[todayIdx] + ')';

  /* 리사이즈 시 차트 다시 */
  var rT; window.addEventListener('resize', function () {
    clearTimeout(rT); rT = setTimeout(function () { if (S.view === 'home') renderHome(); if (S.view === 'seats') renderSeats(); }, 180);
  });

  setView('home');
})();
