/* QUILL — 응답 대시보드. 권한 3단계가 실제로 데이터 범위·마스킹·내보내기를 바꾼다. */
(function () {
  'use strict';
  var Q = window.QUILL;
  var role = Q.ROLES[0];      // 기본: 슈퍼관리자
  var view = 'dash';
  var filt = { period: 90, store: 'all', designer: 'all', menu: 'all' };
  var viewRoot = document.getElementById('viewRoot');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ============ 권한 규칙 (문서가 아니라 코드) ============ */
  function scoped() {
    var rows = Q.RESPONSES.slice();
    if (role.id === 'owner') rows = rows.filter(function (r) { return r.store === role.store; });
    if (role.id === 'designer') rows = rows.filter(function (r) { return r.designer === role.designer; });
    // 필터
    if (filt.store !== 'all') rows = rows.filter(function (r) { return r.store === filt.store; });
    if (filt.designer !== 'all') rows = rows.filter(function (r) { return r.designer === filt.designer; });
    if (filt.menu !== 'all') rows = rows.filter(function (r) { return r.menus.indexOf(filt.menu) >= 0; });
    if (filt.period < 999) {
      var cut = new Date(2026, 7, 3 - filt.period);
      var cs = cut.getFullYear() + '-' + String(cut.getMonth() + 1).padStart(2, '0') + '-' + String(cut.getDate()).padStart(2, '0');
      rows = rows.filter(function (r) { return r.date >= cs; });
    }
    return rows;
  }
  function canExport() { return role.id !== 'designer'; }
  function showPhone(r) { return role.id === 'designer' ? Q.maskPhone(r.phone) : r.phone; }
  function showBirth(r) { return role.id === 'designer' ? Q.maskBirth(r.birth) : r.birth; }

  /* ============ 역할 탭 ============ */
  var roleTabs = document.getElementById('roleTabs');
  Q.ROLES.forEach(function (r) {
    var b = document.createElement('button');
    b.innerHTML = r.ico + ' ' + r.name;
    b.className = r.id === role.id ? 'on' : '';
    b.addEventListener('click', function () {
      role = r;
      [].forEach.call(roleTabs.children, function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      filt.store = 'all'; filt.designer = 'all';
      Q.toast(r.name + ' 시점으로 전환 — ' + r.scope, 'ok');
      renderScope(); render();
    });
    roleTabs.appendChild(b);
  });
  function renderScope() {
    document.getElementById('scopeWho').textContent = role.who + ' · ' + role.scope;
  }

  /* ============ 사이드 네비 ============ */
  document.getElementById('sideNav').addEventListener('click', function (e) {
    var a = e.target.closest('.a-nav'); if (!a) return;
    view = a.dataset.view;
    [].forEach.call(document.querySelectorAll('.a-nav'), function (n) { n.classList.remove('on'); });
    a.classList.add('on');
    render();
  });

  /* ============ 필터 UI ============ */
  function filterBar(withMenu) {
    var stores = role.id === 'super' ? Q.STORES : Q.STORES.filter(function (s) { return s.id === role.store; });
    var designers = Q.DESIGNERS.filter(function (d) {
      if (role.id === 'designer') return d.id === role.designer;
      if (role.id === 'owner') return d.store === role.store;
      return filt.store === 'all' || d.store === filt.store;
    });
    var menus = ['스타일링', '컷', '펌', '컬러', '두피관리', '모발케어', '상담 후 선택'];
    return '<div class="filters">' +
      '<div class="filt"><label>기간</label><select id="fPeriod">' +
      [[7, '최근 7일'], [30, '최근 30일'], [90, '최근 90일'], [999, '전체']].map(function (p) { return '<option value="' + p[0] + '"' + (filt.period === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="filt"><label>매장</label><select id="fStore"' + (role.id !== 'super' ? ' disabled' : '') + '>' +
      '<option value="all">전체 매장</option>' + stores.map(function (s) { return '<option value="' + s.id + '"' + (filt.store === s.id ? ' selected' : '') + '>' + s.name + '</option>'; }).join('') + '</select></div>' +
      '<div class="filt"><label>디자이너</label><select id="fDesigner"' + (role.id === 'designer' ? ' disabled' : '') + '>' +
      '<option value="all">전체</option>' + designers.map(function (d) { return '<option value="' + d.id + '"' + (filt.designer === d.id ? ' selected' : '') + '>' + d.name + '</option>'; }).join('') + '</select></div>' +
      (withMenu ? '<div class="filt"><label>관심 메뉴</label><select id="fMenu"><option value="all">전체</option>' +
        menus.map(function (m) { return '<option' + (filt.menu === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></div>' : '') +
      '<div class="filt"><label>&nbsp;</label>' +
      (canExport()
        ? '<button class="btn btn-sm btn-pri" id="btnXlsx" style="height:38px">⬇ 엑셀(xlsx) 내보내기</button>'
        : '<button class="btn btn-sm btn-gho" id="btnXlsx" style="height:38px" title="디자이너 권한은 대량 내보내기가 차단됩니다">🔒 내보내기 권한 없음</button>') +
      '</div></div>';
  }
  function bindFilters() {
    ['fPeriod', 'fStore', 'fDesigner', 'fMenu'].forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      el.addEventListener('change', function () {
        if (id === 'fPeriod') filt.period = +el.value;
        if (id === 'fStore') { filt.store = el.value; filt.designer = 'all'; }
        if (id === 'fDesigner') filt.designer = el.value;
        if (id === 'fMenu') filt.menu = el.value;
        render();
      });
    });
    var bx = document.getElementById('btnXlsx');
    if (bx) bx.addEventListener('click', exportXlsx);
  }

  /* ============ 뷰: 대시보드 ============ */
  function vDash() {
    var rows = scoped();
    var mktY = rows.filter(function (r) { return r.mkt; }).length;
    var avgR = rows.length ? (rows.reduce(function (a, r) { return a + r.rating; }, 0) / rows.length) : 0;
    var last7 = rows.filter(function (r) { return r.date >= '2026-07-28'; }).length;

    var html = filterBar(true);
    html += '<div class="kpis">' +
      kpi('총 응답', rows.length, '건', '기간 내 제출 합계') +
      kpi('최근 7일', last7, '건', '신규 고객 유입') +
      kpi('평균 첫인상 별점', avgR.toFixed(2), '', '5점 만점') +
      kpi('마케팅 수신 동의', rows.length ? Math.round(mktY / rows.length * 100) : 0, '%', mktY + '명 / ' + rows.length + '명 · 선택 동의만 집계') +
      '</div>';

    html += '<div class="charts">' +
      '<div class="chart-box"><h4>일별 응답 추이</h4><div class="ch-sub">최근 6주 · 실집계</div><canvas id="cvTrend" height="180"></canvas></div>' +
      '<div class="chart-box"><h4>방문 동기</h4><div class="ch-sub">유입 채널 분석 — 마케팅 예산 배분 근거</div><canvas id="cvVisit" height="180"></canvas></div>' +
      '</div>';

    html += '<div class="charts" style="margin-top:16px">' +
      '<div class="chart-box"><h4>관심 메뉴 TOP</h4><div class="ch-sub">복수 선택 합산</div><div class="bars" id="barMenus"></div></div>' +
      '<div class="chart-box"><h4>두피·모발 고민 TOP</h4><div class="ch-sub">시술·홈케어 제안 근거</div><div class="bars" id="barWorry"></div></div>' +
      '</div>';
    return html;
  }
  function kpi(k, v, suffix, s) {
    return '<div class="kpi"><div class="k">' + k + '</div><div class="v" data-count="' + v + '" data-suffix="' + (suffix || '') + '">0</div><div class="s">' + s + '</div></div>';
  }

  function drawDash() {
    var rows = scoped();
    // 카운트업
    [].forEach.call(viewRoot.querySelectorAll('.kpi .v'), function (el) {
      var t = parseFloat(el.dataset.count);
      if (String(el.dataset.count).indexOf('.') >= 0) { el.textContent = el.dataset.count; return; }
      Q.countUp(el, t, el.dataset.suffix, 800);
    });
    // 추이 (최근 42일 일별)
    var byDay = {};
    rows.forEach(function (r) { byDay[r.date] = (byDay[r.date] || 0) + 1; });
    var days = [], vals = [];
    for (var i = 41; i >= 0; i--) {
      var d = new Date(2026, 7, 3 - i);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      days.push(key.slice(5)); vals.push(byDay[key] || 0);
    }
    lineChart(document.getElementById('cvTrend'), days, vals);
    // 방문 동기 도넛
    var vc = {};
    rows.forEach(function (r) { vc[r.visit] = (vc[r.visit] || 0) + 1; });
    donut(document.getElementById('cvVisit'), Object.keys(vc).map(function (k) { return { l: k, v: vc[k] }; }));
    // 메뉴/고민 바
    barList('barMenus', count(rows, 'menus'));
    var worry = count(rows, 'scalp').concat(count(rows, 'hair'));
    worry.sort(function (a, b) { return b.v - a.v; });
    barList('barWorry', worry.slice(0, 6));
  }
  function count(rows, key) {
    var c = {};
    rows.forEach(function (r) { (r[key] || []).forEach(function (x) { c[x] = (c[x] || 0) + 1; }); });
    return Object.keys(c).map(function (k) { return { l: k, v: c[k] }; }).sort(function (a, b) { return b.v - a.v; });
  }
  function barList(id, items) {
    var box = document.getElementById(id); if (!box) return;
    var mx = items.length ? items[0].v : 1;
    box.innerHTML = items.map(function (it) {
      return '<div class="bar-row"><span class="bl" title="' + esc(it.l) + '">' + esc(it.l) + '</span><div class="bar-track"><div class="bar-fill" data-w="' + Math.round(it.v / mx * 100) + '"></div></div><span class="bv">' + it.v + '</span></div>';
    }).join('') || '<p class="small muted">데이터 없음</p>';
    setTimeout(function () {
      [].forEach.call(box.querySelectorAll('.bar-fill'), function (f) { f.style.width = f.dataset.w + '%'; });
    }, 60);
  }

  /* ---------- canvas 차트 (dpr 대응) ---------- */
  function setupCv(cv, h) {
    var dpr = window.devicePixelRatio || 1;
    var w = cv.clientWidth || cv.parentElement.clientWidth - 40;
    cv.width = w * dpr; cv.height = h * dpr;
    cv.style.height = h + 'px';
    var ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx: ctx, w: w, h: h };
  }
  function lineChart(cv, labels, vals) {
    if (!cv) return;
    var s = setupCv(cv, 180), ctx = s.ctx, W = s.w, H = s.h;
    var mx = Math.max(4, Math.max.apply(null, vals));
    var px = 30, py = 16;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#ECE9E2'; ctx.lineWidth = 1;
    for (var g = 0; g <= 3; g++) {
      var gy = py + (H - py - 24) * g / 3;
      ctx.beginPath(); ctx.moveTo(px, gy); ctx.lineTo(W - 6, gy); ctx.stroke();
      ctx.fillStyle = '#9A968C'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(mx * (1 - g / 3)), px - 6, gy + 3);
    }
    function X(i) { return px + (W - px - 10) * i / (vals.length - 1); }
    function Y(v) { return py + (H - py - 24) * (1 - v / mx); }
    // area
    ctx.beginPath(); ctx.moveTo(X(0), Y(vals[0]));
    vals.forEach(function (v, i) { ctx.lineTo(X(i), Y(v)); });
    ctx.lineTo(X(vals.length - 1), H - 24); ctx.lineTo(X(0), H - 24); ctx.closePath();
    ctx.fillStyle = 'rgba(224,82,61,.08)'; ctx.fill();
    // line
    ctx.beginPath();
    vals.forEach(function (v, i) { i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)); });
    ctx.strokeStyle = '#E0523D'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
    // x labels (7일 간격)
    ctx.fillStyle = '#9A968C'; ctx.textAlign = 'center';
    for (var i = 0; i < labels.length; i += 7) ctx.fillText(labels[i], X(i), H - 8);
  }
  function donut(cv, items) {
    if (!cv) return;
    var s = setupCv(cv, 180), ctx = s.ctx, W = s.w, H = s.h;
    var total = items.reduce(function (a, x) { return a + x.v; }, 0) || 1;
    var colors = ['#E0523D', '#2C6AA0', '#1F8A5B', '#B9762A', '#7B5CC6', '#6D6A62'];
    var cx = H / 2 + 10, cy = H / 2, R = H / 2 - 16, r = R * 0.62;
    var a0 = -Math.PI / 2;
    ctx.clearRect(0, 0, W, H);
    items.forEach(function (it, i) {
      var a1 = a0 + it.v / total * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, a0, a1); ctx.arc(cx, cy, r, a1, a0, true);
      ctx.closePath(); ctx.fillStyle = colors[i % colors.length]; ctx.fill();
      a0 = a1;
    });
    ctx.fillStyle = '#16150F'; ctx.font = '700 18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(total + '건', cx, cy + 6);
    // legend
    var lx = cx + R + 18, ly = 18;
    ctx.textAlign = 'left'; ctx.font = '11.5px sans-serif';
    items.forEach(function (it, i) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(lx, ly - 8, 10, 10);
      ctx.fillStyle = '#3B3A33';
      ctx.fillText(it.l + ' · ' + it.v + '건 (' + Math.round(it.v / total * 100) + '%)', lx + 16, ly + 1);
      ly += 20;
    });
  }

  /* ============ 뷰: 응답 목록 ============ */
  function vResp() {
    var rows = scoped().slice().reverse();
    var html = filterBar(true);
    if (role.id === 'designer') {
      html += '<div class="notice" style="margin-bottom:14px">🔐 디자이너 권한 — <b>본인 담당 고객만</b> 보이며, 연락처·생년월일은 마스킹됩니다. 대량 내보내기는 차단됩니다(퇴사 시 고객 DB 유출 방지).</div>';
    } else if (role.id === 'owner') {
      html += '<div class="notice" style="margin-bottom:14px">🏪 원장 권한 — <b>' + Q.storeName(role.store) + ' 소속 데이터만</b> 보입니다. 타 매장 데이터에는 접근할 수 없습니다.</div>';
    }
    html += '<div class="panel"><div class="panel-h"><h3>응답 목록</h3><span class="sub">' + rows.length + '건 · 행을 누르면 상세</span></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th>제출일</th><th>고객</th><th>연락처</th><th>생년월일</th><th>매장</th><th>담당</th><th>관심 메뉴</th><th>별점</th><th>마케팅</th>' +
      '</tr></thead><tbody>' +
      rows.slice(0, 60).map(function (r) {
        return '<tr class="row-click" data-id="' + r.id + '">' +
          '<td class="mono small">' + r.date + '</td>' +
          '<td class="cell-name">' + esc(r.name) + '</td>' +
          '<td class="' + (role.id === 'designer' ? 'masked' : 'mono small') + '">' + showPhone(r) + '</td>' +
          '<td class="' + (role.id === 'designer' ? 'masked' : 'mono small') + '">' + showBirth(r) + '</td>' +
          '<td>' + Q.storeName(r.store) + '</td>' +
          '<td>' + Q.designerName(r.designer) + '</td>' +
          '<td class="small">' + r.menus.join(' · ') + '</td>' +
          '<td>' + '★'.repeat(r.rating) + '</td>' +
          '<td>' + (r.mkt ? '<span class="tag ok">동의</span>' : '<span class="tag mut">미동의</span>') + '</td></tr>';
      }).join('') +
      '</tbody></table></div>' +
      (rows.length > 60 ? '<p class="small muted" style="margin-top:10px">최근 60건만 표시 — 전체는 엑셀 내보내기로 확인' : '') + '</div>';
    return html;
  }

  function openDrawer(id) {
    var r = Q.RESPONSES.filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    var b = document.getElementById('drBody');

    // 종이 설문지 뷰 — 전체 선택지를 ☐로 깔고 응답만 ☑
    function cks(all, picked) {
      var arr = Array.isArray(picked) ? picked : [picked];
      return all.map(function (o) {
        var on = arr.indexOf(o) >= 0;
        return '<span class="p-ck' + (on ? ' on' : '') + '"><span class="bx">' + (on ? '☑' : '☐') + '</span>' + esc(o) + '</span>';
      }).join('');
    }
    function pq(label, inner) { return '<div class="p-q"><div class="pqh">' + label + '</div><div class="pqb">' + inner + '</div></div>'; }

    b.innerHTML =
      '<div class="psheet">' +
      '<div class="p-logo">id<i>HAIR</i></div>' +
      '<div class="p-mgr">담당 디자이너 : <b>' + Q.designerName(r.designer) + '</b> <span style="color:#999">(' + Q.storeName(r.store) + ')</span></div>' +
      '<table class="p-info"><tr>' +
      '<td class="pl">성 함</td><td class="pv">' + esc(r.name) + '</td>' +
      '<td class="pl">생년월일</td><td class="pv ' + (role.id === 'designer' ? 'masked' : 'mono') + '" style="font-size:12.5px">' + showBirth(r) + '</td></tr>' +
      '<tr><td class="pl">연락처</td><td class="pv ' + (role.id === 'designer' ? 'masked' : 'mono') + '" style="font-size:12.5px">' + showPhone(r) + '</td>' +
      '<td class="pl">제출일</td><td class="pv mono" style="font-size:12.5px">' + r.date + '</td></tr></table>' +
      '<div class="p-consent-line"><span>개인정보 수집 동의 <span class="p-ck on" style="margin:0"><span class="bx">☑</span>동의(필수)</span></span>' +
      '<span>마케팅 수신 ' + (r.mkt
        ? '<span class="p-ck on" style="margin:0"><span class="bx">☑</span>동의(선택)</span>'
        : '<span class="p-ck" style="margin:0"><span class="bx">☐</span>미동의 — 광고 발송 금지</span>') + '</span></div>' +
      '<div style="border:1px solid #E4E0D6; border-bottom:none; margin-top:12px">' +
      pq('방문동기', cks(Q.OPTS.visit, r.visit)) +
      pq('스타일 사진', cks(Q.OPTS.stylePhoto, r.stylePhoto)) +
      pq('희망 직급', cks(Q.OPTS.grade, r.grade)) +
      pq('관심 있는 메뉴', cks(Q.OPTS.menus, r.menus)) +
      pq('원하는 이미지', r.images.length ? cks(Q.OPTS.images, r.images) : cks(Q.OPTS.images, [])) +
      pq('두피 고민', cks(Q.OPTS.scalp, r.scalp)) +
      pq('모발 고민', cks(Q.OPTS.hair, r.hair)) +
      pq('홈케어 구매', cks(Q.OPTS.home, r.home)) +
      pq('첫인상', '<span class="p-stars"><b>' + '★'.repeat(r.rating) + '</b>' + '★'.repeat(5 - r.rating) + '</span><span style="margin-left:8px; color:#8b877c">(' + r.rating + '/5)</span>') +
      '<div class="p-q" style="grid-template-columns:1fr"><div class="p-memo"><div style="font-weight:750; font-size:12px; margin-bottom:6px">디자이너에게 미리 전하는 말</div>' +
      '<div class="ml">' + (esc(r.memo) || '<span style="color:#bbb">—</span>') + '</div></div></div>' +
      '</div>' +
      '<div class="p-foot"><span>QUILL 디지털 설문 · 종이 설문지 뷰</span><span>응답 번호 ' + r.id.toUpperCase() + '</span></div>' +
      '</div>';

    document.getElementById('drTitle').textContent = esc(r.name) + ' 님 — 설문지 보기';
    document.getElementById('drawer').classList.add('wide');
    document.getElementById('drawerBg').classList.add('on');
    document.getElementById('drawer').classList.add('on');
  }
  document.getElementById('drClose').addEventListener('click', closeDrawer);
  document.getElementById('drawerBg').addEventListener('click', closeDrawer);
  function closeDrawer() {
    document.getElementById('drawerBg').classList.remove('on');
    document.getElementById('drawer').classList.remove('on');
  }

  /* ============ 뷰: 마케팅 대상 (동의 필터가 핵심) ============ */
  function vMkt() {
    var rows = scoped();
    var yes = rows.filter(function (r) { return r.mkt; });
    var html = filterBar(false);
    html += '<div class="notice warn" style="margin-bottom:16px">⚠️ 이 목록은 <b>마케팅 수신에 「선택 동의」한 고객만</b> 자동 추출합니다. 미동의 고객에게 광고성 문자를 보내면 정보통신망법 위반(최대 3천만원 과태료)입니다 — 시스템이 원천적으로 걸러줍니다.</div>';
    html += '<div class="kpis" style="grid-template-columns:repeat(3,1fr)">' +
      kpi('전체 응답', rows.length, '건', '기간 내') +
      kpi('발송 가능(동의)', yes.length, '명', '선택 동의 완료') +
      kpi('발송 제외(미동의)', rows.length - yes.length, '명', '자동 차단') + '</div>';
    html += '<div class="panel"><div class="panel-h"><h3>알림톡 발송 대상</h3><span class="sub">' + yes.length + '명</span></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>고객</th><th>연락처</th><th>매장</th><th>관심 메뉴</th><th>마지막 방문</th></tr></thead><tbody>' +
      yes.slice(0, 30).map(function (r) {
        return '<tr><td class="cell-name">' + esc(r.name) + '</td><td class="' + (role.id === 'designer' ? 'masked' : 'mono small') + '">' + showPhone(r) + '</td><td>' + Q.storeName(r.store) + '</td><td class="small">' + r.menus.join(' · ') + '</td><td class="mono small">' + r.date + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="row" style="margin-top:14px"><button class="btn btn-pri" id="btnSend">📣 알림톡 발송 시뮬레이션</button><span class="small muted">실제 발송 없음 — 동의자에게만 발송되는 흐름 확인용</span></div></div>';
    return html;
  }

  /* ============ 뷰: 알림톡 (연동 설정 → 템플릿 검수 → 발송) ============ */
  var talk = {
    channel: true,                 // 1. 카카오 비즈니스 채널 개설 (완료 가정)
    profile: false,                // 2. 발신프로필 등록
    api: false,                    // 3. 발송 API 연동
    profileKey: 'KA01PF2026IDHAIR',
    agency: '메시지허브',
    templates: [
      { id: 't1', name: '설문 제출 완료 안내', kind: '정보성', st: 'ok',
        body: '#{고객명}님, #{매장명} 설문이 접수되었습니다.\n담당 디자이너 #{디자이너명}이 시술 전에 꼭 확인할게요.\n\n· 제출일시: #{제출일시}\n· 문의: 매장으로 연락해 주세요' },
      { id: 't2', name: '예약 리마인드', kind: '정보성', st: 'ok',
        body: '#{고객명}님, 내일 #{예약시간} #{매장명} 예약이 있습니다.\n변경이 필요하면 매장으로 연락해 주세요.' },
      { id: 't3', name: '가을 컬러 이벤트 20% 할인', kind: '광고성', st: 'reject',
        body: '#{고객명}님! 9월 한 달간 컬러 시술 20% 할인 이벤트를 진행합니다. 지금 예약하세요!' }
    ]
  };
  function talkLinked() { return talk.channel && talk.profile && talk.api; }
  var AD_RE = /할인|이벤트|특가|무료|쿠폰|프로모션|세일|절약|증정|추첨|경품|(\d+\s*%)/;

  function vTalk() {
    if (role.id === 'designer') {
      return '<div class="panel"><div class="panel-h"><h3>알림톡</h3></div>' +
        '<div class="notice bad">🔒 알림톡은 <b>본사·원장 권한</b>에서만 사용할 수 있습니다. 디자이너 권한은 발송·설정 모두 차단됩니다(고객 연락처 대량 사용 경로 차단).</div></div>';
    }
    var isSuper = role.id === 'super';
    var html = '';

    /* --- 1. 연동 설정 --- */
    html += '<div class="panel"><div class="panel-h"><h3>① 카카오 알림톡 연동 설정</h3>' +
      '<span class="sub">' + (talkLinked() ? '<span class="tag ok">연동 완료</span>' : '<span class="tag warn">미연동 — 아래 단계를 완료하세요</span>') + '</span></div>';
    if (!isSuper) {
      html += '<div class="notice">연동 설정은 <b>슈퍼관리자(본사) 전용</b>입니다. 원장 권한은 아래 발송 기능만 사용할 수 있습니다.</div>';
    } else {
      html += '<div class="talk-steps">' +
        '<div class="talk-step done"><span class="tn">✓</span><div class="tb"><b>카카오 비즈니스 채널 개설</b><div class="small muted">@idhair — 채널 검색 허용 · 비즈니스 인증 완료</div></div><span class="tag ok">완료</span></div>' +
        '<div class="talk-step' + (talk.profile ? ' done' : '') + '"><span class="tn">' + (talk.profile ? '✓' : '2') + '</span><div class="tb"><b>발신프로필 키 등록</b><div class="small muted">카카오 비즈니스 → 발신프로필에서 발급한 키</div></div>' +
        '<span class="row"><input id="tkProfile" value="' + talk.profileKey + '" style="width:180px" ' + (talk.profile ? 'disabled' : '') + '>' +
        (talk.profile ? '<span class="tag ok">등록됨</span>' : '<button class="btn btn-sm btn-pri" id="tkRegProfile">등록</button>') + '</span></div>' +
        '<div class="talk-step' + (talk.api ? ' done' : '') + '"><span class="tn">' + (talk.api ? '✓' : '3') + '</span><div class="tb"><b>발송 API 연동</b><div class="small muted">발송 대행사 선택 후 API 키 검증 (건당 6~9원 수준 · 의뢰자 부담)</div></div>' +
        '<span class="row"><select id="tkAgency" ' + (talk.api ? 'disabled' : '') + '><option' + (talk.agency === '메시지허브' ? ' selected' : '') + '>메시지허브</option><option' + (talk.agency === '톡센드' ? ' selected' : '') + '>톡센드</option></select>' +
        (talk.api ? '<span class="tag ok">연동됨</span>' : '<button class="btn btn-sm btn-pri" id="tkRegApi">연동 테스트</button>') + '</span></div>' +
        '</div>';
      if (talkLinked()) html += '<div class="notice ok" style="margin-top:12px">✓ 연동 완료 — 아래에서 템플릿을 검수받고 발송할 수 있습니다. (운영에서는 발신프로필·API 키를 서버에 암호화 보관합니다)</div>';
    }
    html += '</div>';

    /* --- 2. 템플릿 관리 --- */
    html += '<div class="panel"><div class="panel-h"><h3>② 알림톡 템플릿 — 카카오 검수 시뮬레이션</h3><span class="sub">알림톡은 「정보성」만 허용 — 광고성은 검수 반려</span></div>' +
      '<div class="warn-line" style="margin-bottom:14px"><span class="ic">⚠️</span><span><b>알림톡으로 광고를 보낼 수 없습니다.</b> 할인·이벤트 등 광고성 내용은 카카오 검수에서 반려되며, 광고는 「친구톡」(채널 친구+수신동의) 또는 문자(LMS·동의자만)로 보내야 합니다. 이 데모의 검수 시뮬레이션이 광고성 문구를 자동 감지합니다.</span></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>템플릿명</th><th>유형</th><th>검수 상태</th><th>미리보기</th></tr></thead><tbody>' +
      talk.templates.map(function (t) {
        var st = t.st === 'ok' ? '<span class="tag ok">승인</span>' : t.st === 'pend' ? '<span class="tag warn">검수중</span>' : '<span class="tag bad">반려</span>';
        return '<tr><td class="cell-name">' + esc(t.name) + '</td><td>' + (t.kind === '정보성' ? '<span class="tag info">정보성</span>' : '<span class="tag warn">광고성</span>') + '</td><td class="tpl-status">' + st +
          (t.st === 'reject' ? '<div class="small muted" style="margin-top:4px">사유: 광고성 문구 — 친구톡/LMS로 발송</div>' : '') +
          '</td><td><button class="btn btn-sm btn-gho tk-pv" data-id="' + t.id + '">보기</button></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<hr class="hr"><h4 style="font-size:14px; margin-bottom:10px">새 템플릿 등록</h4>' +
      '<div class="stack-8"><input id="tkNewName" class="s-input" style="height:40px; font-size:14px" value="시술 후 홈케어 안내" placeholder="템플릿명">' +
      '<textarea id="tkNewBody" class="s-input" style="min-height:80px; font-size:13.5px">#{고객명}님, 오늘 #{시술명} 시술 후 홈케어 방법을 안내드립니다.\n· 48시간 내 샴푸는 피해주세요\n· 궁금한 점은 담당 디자이너에게 문의해 주세요</textarea>' +
      '<div class="row"><button class="btn btn-sm btn-pri" id="tkSubmit">검수 요청</button><span class="small muted">광고성 문구(할인·이벤트·% 등)가 있으면 자동 반려됩니다 — 넣어서 테스트해 보세요</span></div>' +
      '<div id="tkVerdict"></div></div></div>';

    /* --- 3. 발송 --- */
    var approved = talk.templates.filter(function (t) { return t.st === 'ok'; });
    var rows = scoped();
    var mktN = rows.filter(function (r) { return r.mkt; }).length;
    html += '<div class="panel"><div class="panel-h"><h3>③ 발송</h3><span class="sub">' + (role.id === 'owner' ? Q.storeName(role.store) + ' 범위만' : '전체 범위') + '</span></div>';
    if (!talkLinked()) {
      html += '<div class="notice warn">연동 설정(①)을 먼저 완료해야 발송할 수 있습니다.' + (isSuper ? '' : ' — 본사에 연동을 요청하세요.') + '</div></div>';
    } else {
      html += '<div class="row" style="margin-bottom:14px; align-items:flex-end">' +
        '<div class="filt"><label>템플릿 (승인된 것만)</label><select id="tkSendTpl">' +
        approved.map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join('') + '</select></div>' +
        '<div class="filt"><label>발송 대상</label><div id="tkTarget" class="small" style="height:38px; display:flex; align-items:center; padding:0 12px; border:1px solid var(--line-2); border-radius:9px; background:var(--paper)"></div></div>' +
        '<button class="btn btn-pri" id="tkSend" style="height:38px">💬 발송 시뮬레이션</button></div>' +
        '<div class="notice" style="margin-bottom:14px">정보성 알림톡은 수신동의와 무관하게 발송 가능(<b>' + rows.length + '명</b>) · 광고는 알림톡 불가 — 마케팅 동의자(<b>' + mktN + '명</b>)에게 친구톡/LMS만 가능합니다. 템플릿을 바꾸면 대상이 자동으로 바뀝니다.</div>' +
        '<div class="row" style="align-items:flex-start; gap:20px"><div class="ktalk" id="tkPreview"></div><div style="flex:1; min-width:220px" id="tkResult"></div></div></div>';
    }
    return html;
  }

  function talkSample(t, forRole) {
    var body = t.body
      .replace(/#\{고객명\}/g, '김서연')
      .replace(/#\{매장명\}/g, role.id === 'owner' ? Q.storeName(role.store) : '강남점')
      .replace(/#\{디자이너명\}/g, '이유진 디자이너')
      .replace(/#\{제출일시\}/g, '2026-08-04 14:20')
      .replace(/#\{예약시간\}/g, '오후 2시')
      .replace(/#\{시술명\}/g, '펌');
    return '<div class="kch">idHAIR</div><div class="kb"><div class="kh">알림톡 도착</div><div class="km">' + esc(body) + '</div><div class="kf">채널 추가</div></div>';
  }

  function bindTalk() {
    var rp = document.getElementById('tkRegProfile');
    if (rp) rp.addEventListener('click', function () {
      var v = document.getElementById('tkProfile').value.trim();
      if (v.length < 10) { Q.toast('발신프로필 키 형식이 올바르지 않습니다', 'bad'); return; }
      talk.profileKey = v; talk.profile = true;
      Q.toast('발신프로필을 등록했습니다', 'ok'); render();
    });
    var ra = document.getElementById('tkRegApi');
    if (ra) ra.addEventListener('click', function () {
      talk.agency = document.getElementById('tkAgency').value; talk.api = true;
      Q.toast(talk.agency + ' API 연동 테스트 성공 — 테스트 메시지 1건 수신 확인 (시뮬레이션)', 'ok'); render();
    });
    [].forEach.call(document.querySelectorAll('.tk-pv'), function (b) {
      b.addEventListener('click', function () {
        var t = talk.templates.filter(function (x) { return x.id === b.dataset.id; })[0];
        var v = document.getElementById('tkVerdict');
        v.innerHTML = '<div class="ktalk" style="margin-top:10px">' + talkSample(t) + '</div>';
      });
    });
    var ts = document.getElementById('tkSubmit');
    if (ts) ts.addEventListener('click', function () {
      var name = document.getElementById('tkNewName').value.trim() || '(무제)';
      var body = document.getElementById('tkNewBody').value;
      var isAd = AD_RE.test(name + body);
      var v = document.getElementById('tkVerdict');
      if (isAd) {
        talk.templates.push({ id: 'tx' + talk.templates.length, name: name, kind: '광고성', st: 'reject', body: body });
        v.innerHTML = '<div class="warn-line bad" style="margin-top:10px"><span class="ic">⛔</span><span><b>검수 반려 (시뮬레이션)</b> — 광고성 문구가 감지되었습니다: ' +
          esc((name + ' ' + body).match(AD_RE)[0]) + '. 알림톡은 정보성만 허용됩니다. 이 내용은 「친구톡」(채널 친구+수신동의) 또는 문자(마케팅 동의자만)로 보내야 합니다.</span></div>';
        Q.toast('검수 반려 — 광고성 문구 감지', 'bad');
      } else {
        talk.templates.push({ id: 'tx' + talk.templates.length, name: name, kind: '정보성', st: 'ok', body: body });
        v.innerHTML = '<div class="notice ok" style="margin-top:10px">✓ 검수 승인 (시뮬레이션 — 실제 카카오 검수는 1~3영업일) — 발송(③)에서 사용할 수 있습니다.</div>';
        Q.toast('템플릿 검수 승인', 'ok');
      }
      render();
      var v2 = document.getElementById('tkVerdict');
      if (v2) v2.innerHTML = isAd
        ? '<div class="warn-line bad" style="margin-top:10px"><span class="ic">⛔</span><span><b>검수 반려</b> — 광고성 문구 감지. 친구톡/LMS(동의자만)로 발송하세요.</span></div>'
        : '<div class="notice ok" style="margin-top:10px">✓ 검수 승인 — 발송(③)에서 사용할 수 있습니다.</div>';
    });
    var sel = document.getElementById('tkSendTpl');
    if (sel) {
      var upd = function () {
        var t = talk.templates.filter(function (x) { return x.id === sel.value; })[0];
        if (!t) return;
        document.getElementById('tkPreview').innerHTML = talkSample(t);
        var rows = scoped();
        var target = t.kind === '정보성' ? rows.length + '명 (정보성 — 전체 응답자)' : rows.filter(function (r) { return r.mkt; }).length + '명 (광고 — 마케팅 동의자만)';
        document.getElementById('tkTarget').textContent = target;
      };
      sel.addEventListener('change', upd); upd();
      document.getElementById('tkSend').addEventListener('click', function () {
        var t = talk.templates.filter(function (x) { return x.id === sel.value; })[0];
        var rows = scoped();
        var n = t.kind === '정보성' ? rows.length : rows.filter(function (r) { return r.mkt; }).length;
        var fail = Math.max(1, Math.round(n * 0.03));
        document.getElementById('tkResult').innerHTML =
          '<div class="notice ok">✓ 발송 완료 (시뮬레이션)</div>' +
          '<div class="backup-row"><span>발송 대상</span><b class="mono">' + n + '명</b></div>' +
          '<div class="backup-row"><span>알림톡 성공</span><b class="mono">' + (n - fail) + '건</b></div>' +
          '<div class="backup-row"><span>실패(미가입·차단)</span><b class="mono">' + fail + '건</b></div>' +
          '<div class="backup-row"><span>문자(LMS) 대체 발송</span><b class="mono">' + fail + '건</b></div>' +
          '<p class="small muted" style="margin-top:8px">운영에서는 발송 이력·수신 상태가 저장되고, 실패분은 자동으로 문자 대체 발송됩니다(대체 발송 요금 별도).</p>';
        Q.toast('알림톡 ' + (n - fail) + '건 발송 + 문자 대체 ' + fail + '건 (시뮬레이션)', 'ok');
      });
    }
  }

  /* ============ 뷰: 백업·복구 ============ */
  function vBackup() {
    var html = '<div class="panel"><div class="panel-h"><h3>백업·복구</h3><span class="sub">공고 요구사항 — 데이터 백업/복구 기능</span></div>';
    if (role.id !== 'super') {
      html += '<div class="notice bad">🔒 백업·복구는 <b>슈퍼관리자(본사) 전용</b>입니다. 현재 역할(' + role.name + ')에서는 실행할 수 없습니다. 위 역할 전환에서 슈퍼관리자로 바꿔 보세요.</div></div>';
      return html;
    }
    html += '<div class="backup-row"><div><b>수동 백업 (JSON)</b><div class="small muted">전체 응답 + 설문 구조를 파일로 다운로드</div></div><button class="btn btn-sm btn-pri" id="btnBk">지금 백업</button></div>' +
      '<div class="backup-row"><div><b>자동 백업</b><div class="small muted">매일 04:00 · 최근 30개 보관 (운영 서버 기준 — 데모 시뮬레이션)</div></div><span class="tag ok">켜짐</span></div>' +
      '<div class="backup-row"><div><b>복구 시뮬레이션</b><div class="small muted">특정 시점 백업본으로 되돌리기</div></div><button class="btn btn-sm btn-gho" id="btnRestore">복구 테스트</button></div>' +
      '<hr class="hr"><h4 class="small" style="text-transform:uppercase;color:var(--mut-2);letter-spacing:.04em;margin-bottom:10px">백업 이력 (시뮬레이션)</h4><div id="bkLog">' +
      ['2026-08-03 04:00 자동 백업 완료 · 184건 · 412KB', '2026-08-02 04:00 자동 백업 완료 · 181건 · 408KB', '2026-08-01 04:00 자동 백업 완료 · 177건 · 399KB'].map(function (l) { return '<div class="log-line">' + l + '</div>'; }).join('') +
      '</div></div>';
    html += '<div class="notice" style="margin-top:4px">개인정보가 든 백업 파일 자체도 암호화·접근통제 대상입니다. 운영에서는 백업 파일 암호화(AES-256)·보관 주기·파기 절차를 함께 설계합니다.</div>';
    return html;
  }

  /* ============ 뷰: 권한 설계 ============ */
  function vPerm() {
    function row(fn, s, o, d) {
      return '<tr><td>' + fn + '</td><td class="center">' + s + '</td><td class="center">' + o + '</td><td class="center">' + d + '</td></tr>';
    }
    var Y = '<span class="tag ok">가능</span>', N = '<span class="tag bad">차단</span>', P = '<span class="tag warn">일부</span>';
    return '<div class="panel"><div class="panel-h"><h3>권한 매트릭스 — 이 데모에서 실제로 작동하는 규칙</h3><span class="sub">역할 전환으로 직접 확인 가능</span></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>기능</th><th class="center">🏢 슈퍼관리자</th><th class="center">🏪 원장</th><th class="center">✂️ 디자이너</th></tr></thead><tbody>' +
      row('전 매장 응답 열람', Y, N, N) +
      row('소속 매장 응답 열람', Y, Y, N) +
      row('본인 담당 고객 열람', Y, Y, Y) +
      row('연락처·생년월일 원문', Y, Y, '<span class="tag warn">마스킹</span>') +
      row('엑셀(xlsx) 내보내기', Y, P + '<div class="small muted">매장분만</div>', N) +
      row('설문 편집(빌더)', Y, N, N) +
      row('백업·복구', Y, N, N) +
      row('마케팅 발송', Y, P + '<div class="small muted">매장분만</div>', N) +
      row('알림톡 연동 설정(발신프로필·API)', Y, N, N) +
      row('알림톡 템플릿·발송', Y, P + '<div class="small muted">매장분만</div>', N) +
      '</tbody></table></div>' +
      '<div class="notice" style="margin-top:16px">💡 <b>왜 디자이너에게 마스킹·내보내기 차단인가</b> — 미용업계 최다 분쟁이 <b>퇴사 디자이너의 고객 명단 유출</b>입니다. 열람은 시술에 필요한 만큼 허용하되, 대량 유출 경로(원문 연락처 + 내보내기)를 시스템에서 끊습니다. 접속 기록은 감사 로그로 남깁니다.</div>' +
      '<div class="notice warn" style="margin-top:10px">⚠️ <b>100개 지점 구조 확인 필요</b> — 각 지점이 별도 사업자(가맹점)라면 지점→본사 데이터 흐름은 「처리위탁」인지 「제3자 제공」인지 계약 형태에 따라 달라지고, 후자는 고객 동의 문구에 명시해야 합니다. 착수 미팅에서 가맹 계약 구조를 확인한 뒤 동의 문구를 확정하는 것이 안전합니다.</div></div>';
  }

  /* ============ xlsx 내보내기 (권한 반영) ============ */
  function exportXlsx() {
    if (!canExport()) {
      Q.toast('디자이너 권한은 대량 내보내기가 차단되어 있습니다 (고객 DB 유출 방지)', 'bad');
      return;
    }
    var rows = scoped();
    var head = ['제출일', '고객명', '연락처', '생년월일', '매장', '담당 디자이너', '방문동기', '관심메뉴', '두피고민', '모발고민', '첫인상별점', '마케팅동의'];
    var lines = [head.join(',')];
    rows.forEach(function (r) {
      lines.push([r.date, r.name, r.phone, r.birth, Q.storeName(r.store), Q.designerName(r.designer), r.visit,
        '"' + r.menus.join('·') + '"', '"' + r.scalp.join('·') + '"', '"' + r.hair.join('·') + '"', r.rating, r.mkt ? '동의' : '미동의'].join(','));
    });
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'QUILL_응답_' + (role.id === 'owner' ? Q.storeName(role.store) : '전체') + '_2026-08-03.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    Q.toast(rows.length + '건 내보내기 완료 — ' + (role.id === 'owner' ? '소속 매장분만 포함됩니다' : '전체 데이터'), 'ok');
  }

  /* ============ 렌더 ============ */
  function render() {
    if (view === 'dash') { viewRoot.innerHTML = vDash(); bindFilters(); drawDash(); }
    else if (view === 'resp') {
      viewRoot.innerHTML = vResp(); bindFilters();
      [].forEach.call(viewRoot.querySelectorAll('.row-click'), function (tr) {
        tr.addEventListener('click', function () { openDrawer(tr.dataset.id); });
      });
    }
    else if (view === 'mkt') {
      viewRoot.innerHTML = vMkt(); bindFilters();
      [].forEach.call(viewRoot.querySelectorAll('.kpi .v'), function (el) {
        Q.countUp(el, parseFloat(el.dataset.count), el.dataset.suffix, 700);
      });
      var bs = document.getElementById('btnSend');
      if (bs) bs.addEventListener('click', function () {
        var n = scoped().filter(function (r) { return r.mkt; }).length;
        Q.toast('알림톡 ' + n + '건 발송 시뮬레이션 — 미동의 ' + (scoped().length - n) + '명은 자동 제외되었습니다', 'ok');
      });
    }
    else if (view === 'talk') { viewRoot.innerHTML = vTalk(); bindTalk(); }
    else if (view === 'backup') {
      viewRoot.innerHTML = vBackup();
      var bb = document.getElementById('btnBk');
      if (bb) bb.addEventListener('click', function () {
        var data = { exportedAt: '2026-08-03', form: 'f-idhair', responses: Q.RESPONSES };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'QUILL_backup_2026-08-03.json';
        a.click(); URL.revokeObjectURL(a.href);
        var log = document.getElementById('bkLog');
        log.insertAdjacentHTML('afterbegin', '<div class="log-line"><b>2026-08-03 수동 백업 완료 · 184건 · 412KB</b></div>');
        Q.toast('백업 파일을 다운로드했습니다', 'ok');
      });
      var br = document.getElementById('btnRestore');
      if (br) br.addEventListener('click', function () {
        Q.toast('2026-08-02 04:00 백업본으로 복구 시뮬레이션 완료 (데모 — 실제 데이터 변경 없음)', 'ok');
      });
    }
    else if (view === 'perm') { viewRoot.innerHTML = vPerm(); }
  }

  renderScope();
  render();
})();
