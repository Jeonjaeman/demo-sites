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
    var dr = document.getElementById('drawer');
    dr.classList.add('wide');
    // PC(넓은 화면)에서는 중앙 모달 — 인라인으로 확정 (미디어쿼리 보강)
    if (window.matchMedia('(min-width:761px)').matches) {
      dr.style.transition = 'opacity .22s';   // 중앙 모달은 페이드만 — transform 즉시 적용
      dr.style.transform = 'translate(-50%,-50%)';
      dr.style.opacity = '1';
    } else { dr.style.transition = ''; dr.style.transform = ''; dr.style.opacity = ''; }
    document.getElementById('drawerBg').classList.add('on');
    dr.classList.add('on');
  }
  document.getElementById('drClose').addEventListener('click', closeDrawer);
  document.getElementById('drawerBg').addEventListener('click', closeDrawer);
  function closeDrawer() {
    document.getElementById('drawerBg').classList.remove('on');
    var dr = document.getElementById('drawer');
    dr.classList.remove('on');
    dr.style.transition = ''; dr.style.transform = ''; dr.style.opacity = '';
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
    html += '<div class="panel"><div class="panel-h"><h3>문자(LMS) 발송 대상</h3><span class="sub">' + yes.length + '명</span></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>고객</th><th>연락처</th><th>매장</th><th>관심 메뉴</th><th>마지막 방문</th></tr></thead><tbody>' +
      yes.slice(0, 30).map(function (r) {
        return '<tr><td class="cell-name">' + esc(r.name) + '</td><td class="' + (role.id === 'designer' ? 'masked' : 'mono small') + '">' + showPhone(r) + '</td><td>' + Q.storeName(r.store) + '</td><td class="small">' + r.menus.join(' · ') + '</td><td class="mono small">' + r.date + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="row" style="margin-top:14px"><button class="btn btn-pri" id="btnSend">📣 문자 발송 시뮬레이션</button><span class="small muted">실제 발송 없음 — 동의자에게만 발송되는 흐름 확인용</span></div></div>';
    return html;
  }

  /* ============ 뷰: 설문별 요약 — 어떤 설문이든 자동 집계 ============ */
  function loadBuilderForm() {
    try { var f = JSON.parse(localStorage.getItem('quill_form')); if (f) return f; } catch (e) {}
    return JSON.parse(JSON.stringify(Q.TPL_IDHAIR));
  }
  function loadSubs(formId) {
    var subs = [];
    try { subs = JSON.parse(localStorage.getItem('quill_submissions') || '[]'); } catch (e) {}
    return subs.filter(function (s) { return s.formId === formId; });
  }

  function vFormSum() {
    var form = loadBuilderForm();
    var formId = form.id || 'f-custom';
    var subs = loadSubs(formId);
    var qs = form.questions.filter(function (q) { return q.type !== 'section'; });

    var html = '<div class="panel"><div class="panel-h"><h3>🧾 ' + esc(form.title || '(제목 없음)') + '</h3>' +
      '<span class="sub">제출 <b>' + subs.length + '건</b> · 질문 ' + qs.length + '개</span></div>' +
      '<div class="notice" style="margin-bottom:0">이 화면은 특정 설문 전용이 아니라 <b>빌더에 저장된 설문 구조를 읽어 자동 생성</b>됩니다. ' +
      '빌더에서 다른 설문(직원 설문·이벤트 폼 등)으로 바꿔 저장하면 이 요약도 그 설문 기준으로 바뀌고, ' +
      '태블릿 응답 화면에서 제출될 때마다 집계에 반영됩니다. <span class="muted">(메인 「대시보드」는 신규 고객 설문 심화 분석용)</span></div>' +
      '<div class="row" style="margin-top:14px">' +
      '<button class="btn btn-sm btn-pri" id="fsSample">✨ 예시 응답 3건 생성</button>' +
      '<a class="btn btn-sm btn-gho" href="survey.html">📱 태블릿에서 직접 제출</a>' +
      '<a class="btn btn-sm btn-gho" href="builder.html">✎ 빌더에서 설문 바꾸기</a>' +
      (subs.length ? '<button class="btn btn-sm btn-gho" id="fsClear">집계 비우기</button>' : '') +
      '</div></div>';

    if (!subs.length) {
      html += '<div class="panel"><div class="empty"><div class="big">🧾</div>아직 제출된 응답이 없습니다.<br>' +
        '<span class="small">「예시 응답 3건 생성」을 누르거나 태블릿 화면에서 제출해 보세요 — 즉시 자동 집계됩니다.</span></div></div>';
      return html;
    }

    qs.forEach(function (q) {
      var vals = subs.map(function (s) { return s.answers[q.title || q.id]; }).filter(function (v) { return v != null && v !== ''; });
      html += '<div class="panel"><div class="panel-h"><h4 style="font-size:15px">' + esc(q.title || '(질문)') + '</h4>' +
        '<span class="sub">' + typeLabel(q.type) + ' · 응답 ' + vals.length + '/' + subs.length + '</span></div>' + sumWidget(q, vals) + '</div>';
    });
    return html;
  }
  function typeLabel(t) {
    var f = Q.FIELD_TYPES.filter(function (x) { return x.id === t; })[0];
    return f ? f.name : t;
  }
  function sumBars(counts, total) {
    var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    if (!keys.length) return '<p class="small muted">응답 없음</p>';
    var mx = counts[keys[0]] || 1;
    return '<div class="bars">' + keys.map(function (k) {
      var pct = total ? Math.round(counts[k] / total * 100) : 0;
      return '<div class="bar-row"><span class="bl" title="' + esc(k) + '">' + esc(k) + '</span>' +
        '<div class="bar-track"><div class="bar-fill" data-w="' + Math.round(counts[k] / mx * 100) + '"></div></div>' +
        '<span class="bv">' + counts[k] + '건 ' + pct + '%</span></div>';
    }).join('') + '</div>';
  }
  function sumWidget(q, vals) {
    var counts = {}, i;
    if (q.type === 'radio' || q.type === 'select') {
      vals.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; });
      return sumBars(counts, vals.length);
    }
    if (q.type === 'check') {
      vals.forEach(function (v) { (Array.isArray(v) ? v : [v]).forEach(function (x) { counts[x] = (counts[x] || 0) + 1; }); });
      return sumBars(counts, vals.length);
    }
    if (q.type === 'rating' || q.type === 'scale') {
      var nums = vals.map(Number).filter(function (n) { return !isNaN(n); });
      if (!nums.length) return '<p class="small muted">응답 없음</p>';
      var avg = nums.reduce(function (a, b) { return a + b; }, 0) / nums.length;
      nums.forEach(function (n) { counts[q.type === 'rating' ? '★' + n : n + '점'] = (counts[q.type === 'rating' ? '★' + n : n + '점'] || 0) + 1; });
      return '<div class="row" style="margin-bottom:12px"><span style="font-size:26px; font-weight:780" class="mono">' + avg.toFixed(2) + '</span>' +
        '<span class="small muted">평균 (' + (q.type === 'rating' ? '5점 만점' : (q.min == null ? 0 : q.min) + '~' + (q.max == null ? 10 : q.max)) + ')</span></div>' + sumBars(counts, nums.length);
    }
    if (q.type === 'consent') {
      var out = '<div class="bars">';
      (q.items || []).forEach(function (it, idx) {
        var yes = 0;
        vals.forEach(function (v) { if (v && v[idx] === 'y') yes++; });
        var pct = vals.length ? Math.round(yes / vals.length * 100) : 0;
        out += '<div class="bar-row"><span class="bl" title="' + esc(it.label) + '">' + esc(it.label.replace(/ \((필수|선택)\)$/, '')) + '</span>' +
          '<div class="bar-track"><div class="bar-fill" data-w="' + pct + '"' + (it.kind === 'opt' ? ' style="background:var(--info)"' : '') + '></div></div>' +
          '<span class="bv">' + pct + '%</span></div>';
      });
      return out + '</div><p class="small muted" style="margin-top:8px">선택 동의율은 마케팅 대상 추출과 연동됩니다.</p>';
    }
    if (q.type === 'photo') {
      var n = vals.length;
      return '<p class="small">🖼 사진 첨부 <b>' + n + '건</b></p>';
    }
    // short / long / phone / date → 최근 응답 목록 (개인정보성 질문은 디자이너 외에도 최소 노출)
    var pii = /성함|이름|연락처|전화|생년월일/.test(q.title || '');
    var recent = vals.slice(-5).reverse().map(function (v) {
      var t = String(v);
      if (pii && role.id === 'designer') t = t.length > 1 ? t[0] + '＊＊' : t;
      return '<div class="log-line">' + esc(t) + '</div>';
    }).join('');
    return recent + (vals.length > 5 ? '<p class="small muted" style="margin-top:6px">최근 5건만 표시 (전체 ' + vals.length + '건)</p>' : '');
  }

  function fsMakeSamples() {
    var form = loadBuilderForm();
    var formId = form.id || 'f-custom';
    var subs = [];
    try { subs = JSON.parse(localStorage.getItem('quill_submissions') || '[]'); } catch (e) {}
    var NAMES = ['김서연', '박도윤', '이하은'];
    for (var s = 0; s < 3; s++) {
      var rec = { at: '2026-08-04T1' + s + ':0' + s + ':00', formId: formId, designer: 'd' + (1 + (s % 3)), answers: {} };
      form.questions.forEach(function (q) {
        if (q.type === 'section') return;
        var k = q.title || q.id, r = (s * 7 + k.length) % 100;
        if (q.type === 'radio' || q.type === 'select') rec.answers[k] = (q.opts || [])[r % Math.max(1, (q.opts || []).length)] || '';
        else if (q.type === 'check') rec.answers[k] = (q.opts || []).slice(r % 2, (r % 2) + 1 + (s % 2));
        else if (q.type === 'short') rec.answers[k] = /성함|이름/.test(k) ? NAMES[s] : '예시 답변 ' + (s + 1);
        else if (q.type === 'long') rec.answers[k] = ['두피가 예민한 편이에요', '앞머리 볼륨이 잘 죽어요', '지난 시술이 마음에 들었어요'][s];
        else if (q.type === 'phone') rec.answers[k] = '010-' + (5100 + s * 37) + '-' + (2200 + s * 511);
        else if (q.type === 'date') rec.answers[k] = /생년월일/.test(k) ? (1988 + s * 4) + '-0' + (s + 2) + '-1' + s : '2026-09-0' + (s + 1);
        else if (q.type === 'photo') { if (s === 0) rec.answers[k] = 'style-ref.jpg'; }
        else if (q.type === 'rating') rec.answers[k] = 3 + (s % 3);
        else if (q.type === 'scale') { var mn = q.min == null ? 0 : q.min, mx = q.max == null ? 10 : q.max; rec.answers[k] = Math.min(mx, mn + 5 + s * 2); }
        else if (q.type === 'consent') { var o = {}; (q.items || []).forEach(function (it, i2) { o[i2] = it.kind === 'req' ? 'y' : (s % 2 ? 'y' : 'n'); }); rec.answers[k] = o; }
      });
      subs.push(rec);
    }
    try { localStorage.setItem('quill_submissions', JSON.stringify(subs)); } catch (e) {}
  }

  function bindFormSum() {
    var bs = document.getElementById('fsSample');
    if (bs) bs.addEventListener('click', function () {
      fsMakeSamples(); render();
      Q.toast('예시 응답 3건을 만들었습니다 — 설문 구조대로 자동 집계됐습니다', 'ok');
      setTimeout(function () {
        [].forEach.call(viewRoot.querySelectorAll('.bar-fill'), function (f) { f.style.width = f.dataset.w + '%'; });
      }, 60);
    });
    var bc = document.getElementById('fsClear');
    if (bc) bc.addEventListener('click', function () {
      try { localStorage.removeItem('quill_submissions'); } catch (e) {}
      render(); Q.toast('집계를 비웠습니다');
    });
    setTimeout(function () {
      [].forEach.call(viewRoot.querySelectorAll('.bar-fill'), function (f) { f.style.width = f.dataset.w + '%'; });
    }, 60);
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
    else if (view === 'formsum') { viewRoot.innerHTML = vFormSum(); bindFormSum(); }
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
        Q.toast('문자 ' + n + '건 발송 시뮬레이션 — 미동의 ' + (scoped().length - n) + '명은 자동 제외되었습니다', 'ok');
      });
    }
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
