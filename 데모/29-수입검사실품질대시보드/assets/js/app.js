/* =====================================================================
   QWALL 큐월 — 품질 대시보드 (index.html)
   로그인(권한) → 14 KPI · 필터 재계산 · 전년 비교 · ETL 통합 · 대형 모니터 상시표출
   ===================================================================== */
(function () {
  'use strict';
  var QW = window.QW;
  var recs = QW.records();
  var ops = QW.loadOps();

  var TODAY = QW.ymd();
  var YEAR = new Date().getFullYear();
  var filter = { preset: 'ytd', from: YEAR + '-01-01', to: TODAY, supplierId: 'all', deviceId: 'all', stage: 'all' };

  /* ---------- DOM 헬퍼 ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function h(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  var app = $('#app');

  function toast(msg, kind) {
    var t = h('<div class="toast ' + (kind || '') + '"><span class="dot"></span><span>' + msg + '</span></div>');
    $('#toasts').appendChild(t); requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, 3200);
  }
  function modal(title, body, foot) {
    var ov = h('<div class="ov"><div class="modal"><div class="modal-h"><h3>' + title + '</h3><button class="x">✕</button></div><div class="modal-b">' + body + '</div>' + (foot ? '<div class="modal-f">' + foot + '</div>' : '') + '</div></div>');
    $('#modalRoot').appendChild(ov); requestAnimationFrame(function () { ov.classList.add('on'); });
    function close() { ov.classList.remove('on'); setTimeout(function () { ov.remove(); }, 220); }
    ov.querySelector('.x').onclick = close; ov.onclick = function (e) { if (e.target === ov) close(); };
    return { ov: ov, close: close };
  }
  function countUp(node, to, fmt) {
    var t0 = null, dur = 640; to = +to || 0;
    function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur); var e = 1 - Math.pow(1 - p, 3); node.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { threshold: .1 });
  function wireReveal(root) { (root || document).querySelectorAll('.reveal:not(.in)').forEach(function (n, i) { n.style.transitionDelay = (i % 8 * 45) + 'ms'; io.observe(n); }); }
  function animBars(root) { (root || document).querySelectorAll('.barcell .fill,.w-bar .f').forEach(function (f) { var w = f.getAttribute('data-w'); setTimeout(function () { f.style.width = w; }, 60); }); }

  /* ---------- 세션(권한) ---------- */
  function me() { return ops.session.user; }
  function renderAuth() {
    var a = $('#authArea'); var u = me();
    if (u) {
      a.innerHTML = '<span class="badge b-ok plain small">' + u + '</span><button class="btn sm" id="logout">로그아웃</button>';
      $('#logout').onclick = function () { ops.session.user = null; QW.saveOps(ops); renderAuth(); go('login'); };
    } else { a.innerHTML = '<span class="small muted">권한 필요</span>'; }
  }

  /* ---------- 라우터 ---------- */
  var routes = { login: viewLogin, dash: viewDash, compare: viewCompare, etl: viewETL };
  function go(p) { location.hash = '#/' + p; }
  function router() {
    ops = QW.loadOps();
    var name = (location.hash.replace(/^#\//, '') || 'dash').split('/')[0];
    document.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#/' + name); });
    window.scrollTo(0, 0);
    if (name !== 'login' && !me()) { return viewLogin('게시된 대시보드는 지정 인원만 열람할 수 있습니다.'); }
    (routes[name] || viewDash)();
    wireReveal(app); animBars(app);
  }
  window.addEventListener('hashchange', router);

  /* =====================================================================
     로그인 (권한 게이트)
     ===================================================================== */
  function viewLogin(msg) {
    if (location.hash !== '#/login') location.hash = '#/login';
    app.innerHTML =
      '<div style="max-width:430px;margin:32px auto">' +
      '<div class="brand" style="justify-content:center;margin-bottom:14px"><span class="mark" style="width:44px;height:44px;font-size:20px">Q</span></div>' +
      '<h2 style="font-size:23px;text-align:center;margin-bottom:6px">QWALL 품질 대시보드</h2>' +
      (msg ? '<div class="banner info" style="margin:12px 0">' + msg + '</div>' : '<p class="muted" style="text-align:center;margin-bottom:16px">지정 인원만 열람 가능합니다.</p>') +
      '<div class="card pad">' +
        '<div class="field" style="margin-bottom:12px"><label>계정(사번 ID)</label><input class="inp" id="lId" placeholder="kim.qc" value="kim.qc" /></div>' +
        '<div class="field" style="margin-bottom:14px"><label>비밀번호</label><input class="inp" type="password" id="lPw" value="demo1234" /></div>' +
        '<button class="btn pri wide lg" id="lBtn">로그인</button>' +
        '<div class="divider"></div>' +
        '<div class="small muted" style="margin-bottom:8px">열람 허용 계정(데모):</div>' +
        '<div class="wrap-g">' + ops.settings.viewers.map(function (v) { return '<button class="btn sm" data-u="' + v + '">' + v + '</button>'; }).join('') +
        '<button class="btn sm" data-u="guest.x" style="border-color:#f0c9c4;color:var(--bad)">guest.x (미승인)</button></div>' +
      '</div></div>';
    app.querySelectorAll('[data-u]').forEach(function (b) { b.onclick = function () { doLogin(b.getAttribute('data-u')); }; });
    $('#lBtn').onclick = function () { doLogin($('#lId').value.trim()); };
  }
  function doLogin(id) {
    if (ops.settings.viewers.indexOf(id) < 0) { toast('열람 권한이 없는 계정입니다. (' + id + ')', 'err'); return; }
    ops.session.user = id; QW.saveOps(ops); renderAuth(); toast(id + ' 로그인'); go('dash');
  }

  /* =====================================================================
     필터 바
     ===================================================================== */
  function presets() {
    return [
      { k: 'm', label: '이번 달', from: TODAY.slice(0, 7) + '-01', to: TODAY },
      { k: 'q', label: '최근 3개월', from: shift(TODAY, -3), to: TODAY },
      { k: 'ytd', label: '올해', from: YEAR + '-01-01', to: TODAY },
      { k: 'all', label: '전체', from: '2025-01-01', to: TODAY }
    ];
  }
  function shift(d, months) { var p = d.split('-').map(Number); var dt = new Date(p[0], p[1] - 1 + months, p[2]); return dt.getFullYear() + '-' + QW.pad(dt.getMonth() + 1, 2) + '-' + QW.pad(dt.getDate(), 2); }
  function filterBar() {
    return '<div class="card pad reveal" style="margin-bottom:14px"><div class="filterbar">' +
      '<div class="seg" id="preseg">' + presets().map(function (p) { return '<button data-p="' + p.k + '"' + (filter.preset === p.k ? ' class="on"' : '') + '>' + p.label + '</button>'; }).join('') + '</div>' +
      '<div class="field"><label>공급업체</label><select class="sel" id="fSup"><option value="all">전체 업체</option>' + QW.SUPPLIERS.map(function (s) { return '<option value="' + s.id + '"' + (filter.supplierId === s.id ? ' selected' : '') + '>' + s.name + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>장치·설비</label><select class="sel" id="fDev"><option value="all">전체 장치</option>' + QW.DEVICES.map(function (d) { return '<option value="' + d.id + '"' + (filter.deviceId === d.id ? ' selected' : '') + '>' + d.name + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>검사 단계</label><select class="sel" id="fStage"><option value="all">전체</option><option value="수입"' + (filter.stage === '수입' ? ' selected' : '') + '>수입검사</option><option value="공정"' + (filter.stage === '공정' ? ' selected' : '') + '>공정·완성</option></select></div>' +
      '<div class="grow"></div>' +
      (filterDirty() ? '<button class="btn" id="resetFilter">↺ 필터 초기화</button>' : '') +
      '<button class="btn" id="wallBtn">🖥 대형 모니터 표출</button>' +
      '</div></div>';
  }
  function filterDirty() { return filter.preset !== 'ytd' || filter.supplierId !== 'all' || filter.deviceId !== 'all' || filter.stage !== 'all'; }
  function resetFilter() { filter.preset = 'ytd'; filter.from = YEAR + '-01-01'; filter.to = TODAY; filter.supplierId = 'all'; filter.deviceId = 'all'; filter.stage = 'all'; }
  function wireFilter(rerender) {
    app.querySelectorAll('#preseg button').forEach(function (b) { b.onclick = function () { var p = presets().find(function (x) { return x.k === b.getAttribute('data-p'); }); filter.preset = p.k; filter.from = p.from; filter.to = p.to; rerender(); }; });
    var s = $('#fSup'); if (s) s.onchange = function () { filter.supplierId = this.value; rerender(); };
    var d = $('#fDev'); if (d) d.onchange = function () { filter.deviceId = this.value; rerender(); };
    var st = $('#fStage'); if (st) st.onchange = function () { filter.stage = this.value; rerender(); };
    var rb = $('#resetFilter'); if (rb) rb.onclick = function () { resetFilter(); toast('필터를 초기화했습니다.'); rerender(); };
    var w = $('#wallBtn'); if (w) w.onclick = openWall;
  }

  /* =====================================================================
     메인 대시보드
     ===================================================================== */
  function viewDash() {
    var c = QW.compute(recs, filter, ops.settings);
    var prev = QW.compute(recs, QW.prevYearFilter(filter), ops.settings);
    app.innerHTML =
      refreshBanner() +
      filterBar() +
      dedupNotice(c) +
      '<div class="kpis" id="kpis" style="margin-bottom:14px"></div>' +
      '<div style="display:grid;grid-template-columns:1.1fr 1fr;gap:14px;margin-bottom:14px" class="dash-grid">' +
        '<div class="card reveal"><div class="card-h"><h3>부적합 유형 분포</h3><span class="small muted" id="typeTot"></span></div><div class="card-b"><div class="center" style="gap:22px;align-items:center"><canvas id="typeDonut" width="150" height="150" style="width:150px;height:150px"></canvas><div class="legend grow" id="typeLeg"></div></div></div></div>' +
        '<div class="card reveal"><div class="card-h"><h3>발생 원인</h3><span class="small muted">부적합 원인별</span></div><div class="card-b" id="causeBars"></div></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px" class="dash-grid">' +
        '<div class="card reveal"><div class="card-h"><h3>TOP5 부적합 공급업체</h3><span class="small muted">집중도 <b id="top5share"></b></span></div><div class="card-b" id="top5Bars"></div></div>' +
        '<div class="card reveal"><div class="card-h"><h3>장치·설비별 부적합</h3></div><div class="card-b" id="devBars"></div></div>' +
      '</div>' +
      '<div class="card reveal"><div class="card-h"><h3>부적합률 · ITP 정합율 추이</h3><span class="small muted">월별</span></div><div class="card-b"><canvas id="trend" width="900" height="220" style="width:100%;height:220px"></canvas></div></div>';

    wireFilter(viewDash);
    renderKPIs($('#kpis'), c, prev);
    // 유형 도넛
    var typeColors = ['#1f5fd0', '#3b78e6', '#5b9bff', '#f0a020', '#d0392b', '#1f9d55', '#7c5cff', '#888'];
    var td = c.typeDist.map(function (x, i) { return { k: x.k, n: x.n, color: typeColors[i % typeColors.length] }; });
    donut($('#typeDonut'), td, c.defectCountDedup);
    $('#typeTot').textContent = '총 ' + c.defectCountDedup + '건';
    $('#typeLeg').innerHTML = td.map(function (x) { return '<div class="li"><span><span class="sw" style="background:' + x.color + '"></span>' + x.k + '</span><b>' + x.n + '건 · ' + QW.pct(c.defectCountDedup ? x.n / c.defectCountDedup : 0, 0) + '</b></div>'; }).join('');
    // 원인 bars
    rankBars($('#causeBars'), c.causeDist.map(function (x) { return { name: x.k, n: x.n }; }));
    // TOP5
    rankBars($('#top5Bars'), c.top5.map(function (x) { return { name: x.name, n: x.n }; }));
    $('#top5share').textContent = QW.pct(c.kpi.top5Share, 0);
    // 장치
    rankBars($('#devBars'), c.byDevice.map(function (x) { return { name: x.name, n: x.n }; }));
    // 추이
    drawTrend($('#trend'), c);
    animBars(app);
  }

  function renderKPIs(host, c, prev) {
    host.innerHTML = QW.KPI_DEFS.map(function (def) {
      var cur = c.kpi[def.key], pv = prev.kpi[def.key];
      var cmp = compareHTML(def, cur, pv);
      var hl = (def.key === 'defectRate' || def.key === 'failCost') ? ' hl' : '';
      // 최종값을 먼저 채운다(비표시 탭에서 rAF 미실행 시에도 값이 보이도록). 카운트업이 그 위에 애니메이션.
      return '<div class="kpi reveal' + hl + '"><div class="lab">' + def.label + '</div><div class="val" data-k="' + def.key + '">' + QW.fmtKPI(def, cur) + '</div>' + cmp + '</div>';
    }).join('');
    host.querySelectorAll('.val').forEach(function (n) {
      var def = QW.KPI_DEFS.find(function (d) { return d.key === n.getAttribute('data-k'); });
      var v = c.kpi[def.key];
      if (def.fmt === 'pct') countUp(n, v * 100, function (x) { return x.toFixed(1) + '%'; });
      else if (def.fmt === 'won') countUp(n, v, function (x) { return QW.won(x); });
      else countUp(n, v, function (x) { return QW.num(x) + (def.unit || ''); });
    });
  }
  function compareHTML(def, cur, prev) {
    if (prev == null || (!prev && !cur)) return '<div class="cmp flat">전년 비교 —</div>';
    var diff = cur - prev; var eps = 1e-9;
    var improving = def.good === 'up' ? diff > eps : diff < -eps;
    var flat = Math.abs(diff) < eps;
    var cls = flat ? 'flat' : (improving ? 'up' : 'down');
    var arrow = flat ? '→' : (diff > 0 ? '▲' : '▼');
    var txt;
    if (def.fmt === 'pct') txt = (diff >= 0 ? '+' : '') + (diff * 100).toFixed(1) + 'p';
    else if (prev === 0) txt = '신규';
    else txt = (diff >= 0 ? '+' : '') + Math.round(diff / prev * 100) + '%';
    return '<div class="cmp ' + cls + '">' + arrow + ' ' + txt + ' <span class="faint" style="font-weight:500">전년비</span></div>';
  }

  function dedupNotice(c) {
    if (ops.settings.dedup) {
      return c.dupCount > 0 ? '<div class="banner ok reveal" style="margin-bottom:14px">✔ ERP·QMS 오더 매핑으로 중복 <b>' + c.dupCount + '건</b> 제거됨 — 순 부적합 ' + c.defectCountDedup + '건으로 집계. <a href="#/etl" style="color:inherit;text-decoration:underline">통합 상세</a></div>' : '';
    }
    return '<div class="banner bad reveal" style="margin-bottom:14px">⚠ 중복 제거 꺼짐 — ERP·QMS 이중 계상으로 부적합이 <b>' + c.defectCountNaive + '건</b>(순 ' + c.defectCountDedup + '건)으로 <b>' + Math.round((c.defectCountNaive / c.defectCountDedup - 1) * 100) + '% 부풀려짐</b>. <a href="./admin.html" target="_blank" style="color:inherit;text-decoration:underline">운영 콘솔에서 켜기</a></div>';
  }

  function refreshBanner() {
    var r = ops.refresh;
    if (r.stale || r.status === '실패') {
      return '<div class="banner bad reveal" style="margin-bottom:14px">🔴 마지막 자동 새로고침 <b>실패</b> — 화면은 <b>' + QW.fmtDT(r.lastAt) + '</b> 시점의 이전 데이터입니다. 최신 아님. <a href="./admin.html" target="_blank" style="color:inherit;text-decoration:underline">운영 콘솔에서 재실행</a></div>';
    }
    var mins = Math.round((Date.now() - new Date(r.lastAt).getTime()) / 60000);
    return '<div class="banner ok reveal" style="margin-bottom:14px">🟢 최신 새로고침 <b>' + QW.fmtDT(r.lastAt) + '</b> (' + mins + '분 전) · 3개 소스 통합 정상 · 자동 스케줄 ' + r.schedule + '</div>';
  }

  /* =====================================================================
     전년 비교·추이
     ===================================================================== */
  function viewCompare() {
    var c = QW.compute(recs, filter, ops.settings);
    var prev = QW.compute(recs, QW.prevYearFilter(filter), ops.settings);
    app.innerHTML =
      filterBar() +
      '<div class="card reveal" style="margin-bottom:14px"><div class="card-h"><h3>14개 KPI · 전년 동기 비교</h3><span class="small muted">' + filter.from + ' ~ ' + filter.to + '</span></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>KPI</th><th class="num">올해</th><th class="num">전년 동기</th><th class="num">증감</th><th>평가</th></tr></thead><tbody>' +
      QW.KPI_DEFS.map(function (def) {
        var cur = c.kpi[def.key], pv = prev.kpi[def.key];
        var diff = cur - pv; var improving = def.good === 'up' ? diff > 1e-9 : diff < -1e-9; var flat = Math.abs(diff) < 1e-9;
        var dtxt = def.fmt === 'pct' ? ((diff >= 0 ? '+' : '') + (diff * 100).toFixed(1) + 'p') : (pv === 0 ? '신규' : (diff >= 0 ? '+' : '') + Math.round(diff / pv * 100) + '%');
        return '<tr><td class="name">' + def.label + '</td><td class="num">' + QW.fmtKPI(def, cur) + '</td><td class="num muted">' + QW.fmtKPI(def, pv) + '</td>' +
          '<td class="num" style="color:' + (flat ? 'var(--muted)' : improving ? 'var(--ok)' : 'var(--bad)') + ';font-weight:700">' + (flat ? '→' : diff > 0 ? '▲' : '▼') + ' ' + dtxt + '</td>' +
          '<td>' + (flat ? '<span class="badge b-gray">유지</span>' : improving ? '<span class="badge b-ok">개선</span>' : '<span class="badge b-bad">악화</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="dash-grid">' +
        '<div class="card reveal"><div class="card-h"><h3>월별 부적합률 (올해 vs 전년)</h3></div><div class="card-b"><canvas id="cmpRate" width="500" height="220" style="width:100%;height:220px"></canvas></div></div>' +
        '<div class="card reveal"><div class="card-h"><h3>월별 실패비용</h3></div><div class="card-b"><canvas id="cmpCost" width="500" height="220" style="width:100%;height:220px"></canvas></div></div>' +
      '</div>';
    wireFilter(viewCompare);

    var mThis = [], mPrev = [];
    for (var m = 1; m <= 7; m++) { mThis.push('2026-' + QW.pad(m, 2)); mPrev.push('2025-' + QW.pad(m, 2)); }
    var tThis = QW.monthlyTrend(recs, { supplierId: filter.supplierId, deviceId: filter.deviceId, stage: filter.stage }, ops.settings, mThis);
    var tPrev = QW.monthlyTrend(recs, { supplierId: filter.supplierId, deviceId: filter.deviceId, stage: filter.stage }, ops.settings, mPrev);
    lineCompare($('#cmpRate'), mThis.map(function (x) { return x.slice(5) + '월'; }), tThis.map(function (x) { return x.defectRate * 100; }), tPrev.map(function (x) { return x.defectRate * 100; }), '%');
    barsCompare($('#cmpCost'), mThis.map(function (x) { return x.slice(5) + '월'; }), tThis.map(function (x) { return x.failCost; }));
  }

  /* =====================================================================
     데이터 통합(ETL) — 읽기 뷰
     ===================================================================== */
  function viewETL() {
    var c = QW.compute(recs, filter, ops.settings);
    var cNoDedup = QW.compute(recs, filter, Object.assign({}, ops.settings, { dedup: false }));
    var r = ops.refresh;
    app.innerHTML =
      '<h2 style="font-size:22px;margin-bottom:4px">데이터 통합 (ETL)</h2><p class="muted small" style="margin-bottom:16px">ERP·QMS·오프라인 엑셀 3개 소스를 추출·정제·통합합니다. 코드 통일·중복 제거 규칙은 운영 콘솔에서 관리합니다.</p>' +
      '<div class="card pad reveal" style="margin-bottom:14px"><div class="pipe">' +
        '<div class="node"><b>① 소스 추출</b>' +
          '<div style="margin-top:10px">' +
          srcChip('ERP', '수입/완성검사 · 합부 · 품목 · S오더', r.sources.ERP) +
          srcChip('QMS', '부적합 등록 · NCR · 실패비용 · F오더', r.sources.QMS) +
          srcChip('Excel', 'ITP 성적서 정합성 (일간)', r.sources.Excel) + '</div></div>' +
        '<div class="arrow">→</div>' +
        '<div class="node"><b>② 정제·통합</b><div class="st muted" style="margin-top:10px">· 결측·형식 표준화<br>· ERP-QMS 코드 통일 <b>' + (ops.settings.codeUnify ? 'ON' : 'OFF') + '</b><br>· S오더-F오더 매핑<br>· 중복 제거 <b>' + (ops.settings.dedup ? 'ON' : 'OFF') + '</b><br>· 스타 스키마 적재</div></div>' +
        '<div class="arrow">→</div>' +
        '<div class="node"><b>③ 대시보드</b><div class="st muted" style="margin-top:10px">14개 KPI · 실패비용<br>전년 비교 · 추이<br>대형 모니터 상시표출</div><div style="margin-top:8px"><span class="badge ' + (r.stale ? 'b-bad' : 'b-ok') + '">' + (r.stale ? '이전 데이터' : '최신 반영') + '</span></div></div>' +
      '</div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="dash-grid">' +
        '<div class="card pad reveal"><h3 style="font-size:15px;margin-bottom:6px">중복 제거 효과</h3><p class="small muted" style="margin-bottom:12px">같은 부적합이 ERP(S오더)와 QMS(F오더)에 각각 있으면 이중 계상됩니다. 오더 매핑으로 유니크 건만 집계합니다.</p>' +
          cmpRow('원시 합산(중복 포함)', cNoDedup.defectCountNaive + '건', 'bad') +
          cmpRow('중복 제거 후(순 부적합)', c.defectCountDedup + '건', 'ok') +
          cmpRow('제거된 중복', (cNoDedup.defectCountNaive - c.defectCountDedup) + '건', 'info') +
          '<div class="banner ' + (ops.settings.dedup ? 'ok' : 'bad') + '" style="margin-top:12px">현재 집계: <b>' + (ops.settings.dedup ? '중복 제거 적용(정상)' : '원시 합산 — ' + Math.round((cNoDedup.defectCountNaive / c.defectCountDedup - 1) * 100) + '% 부풀림') + '</b></div>' +
        '</div>' +
        '<div class="card reveal"><div class="card-h"><h3>새로고침 이력</h3><span class="small muted">스케줄 ' + r.schedule + '</span></div><div class="card-b" style="padding:6px 0">' +
          r.history.slice().reverse().map(function (hh) { return '<div class="between" style="padding:9px 18px;border-bottom:1px solid var(--line2)"><div><span class="badge ' + (hh.status === '완료' ? 'b-ok' : 'b-bad') + '">' + hh.status + '</span> <span class="small muted">' + QW.fmtDT(hh.at) + '</span>' + (hh.note ? '<div class="tiny" style="color:var(--bad)">' + hh.note + '</div>' : '') + '</div><span class="small mono muted">' + hh.rows + ' rows</span></div>'; }).join('') +
        '</div></div>' +
      '</div>';
  }
  function srcChip(name, desc, st) { return '<div class="src-chip"><div><b>' + name + '</b> <span class="small muted">' + desc + '</span></div><span class="badge ' + (st === '완료' ? 'b-ok' : st === '실패' ? 'b-bad' : 'b-warn') + '">' + st + '</span></div>'; }
  function cmpRow(k, v, tone) { return '<div class="between" style="padding:9px 0;border-bottom:1px solid var(--line2)"><span class="small">' + k + '</span><b style="color:var(--' + (tone === 'bad' ? 'bad' : tone === 'ok' ? 'ok' : 'info') + ')">' + v + '</b></div>'; }

  /* =====================================================================
     차트
     ===================================================================== */
  function donut(cv, items, total) {
    if (!cv) return; var dpr = window.devicePixelRatio || 1; cv.width = 150 * dpr; cv.height = 150 * dpr;
    var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    var sum = items.reduce(function (s, x) { return s + x.n; }, 0) || 1, start = -Math.PI / 2, cx = 75, cy = 75, r = 58, w = 22;
    items.forEach(function (x) { if (x.n <= 0) return; var end = start + x.n / sum * Math.PI * 2; ctx.beginPath(); ctx.arc(cx, cy, r, start, end); ctx.lineWidth = w; ctx.strokeStyle = x.color; ctx.stroke(); start = end; });
    ctx.fillStyle = '#0f1b2d'; ctx.font = '800 24px Pretendard'; ctx.textAlign = 'center'; ctx.fillText(total, cx, cy - 1);
    ctx.fillStyle = '#647087'; ctx.font = '600 11px Pretendard'; ctx.fillText('부적합', cx, cy + 15);
  }
  function rankBars(host, items) {
    if (!host) return; var max = Math.max.apply(null, items.map(function (x) { return x.n; }).concat([1]));
    host.innerHTML = items.map(function (x) {
      return '<div style="margin-bottom:9px"><div class="between" style="margin-bottom:3px"><span class="small" style="font-weight:600">' + x.name + '</span><b class="small">' + x.n + '건</b></div>' +
        '<div class="barcell" style="height:10px"><div class="fill" data-w="' + Math.round(x.n / max * 100) + '%"></div></div></div>';
    }).join('');
  }
  function drawTrend(cv, c) {
    if (!cv) return; var W = cv.clientWidth || 900, H = 220, dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    var months = []; for (var m = 1; m <= 7; m++) months.push('2026-' + QW.pad(m, 2));
    var tr = QW.monthlyTrend(recs, { supplierId: filter.supplierId, deviceId: filter.deviceId, stage: filter.stage }, ops.settings, months);
    var rate = tr.map(function (x) { return x.defectRate * 100; }), itp = tr.map(function (x) { return x.itp * 100; });
    var labels = months.map(function (x) { return x.slice(5) + '월'; });
    var padL = 38, padR = 38, padB = 26, padT = 16, plotW = W - padL - padR, plotH = H - padB - padT;
    ctx.clearRect(0, 0, W, H);
    // grid
    ctx.strokeStyle = '#eaeef5'; ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) { var y = padT + plotH * g / 4; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke(); }
    function X(i) { return padL + plotW * i / (labels.length - 1); }
    function Yrate(v) { return padT + plotH * (1 - Math.min(1, v / 12)); } // 0~12%
    function Yitp(v) { return padT + plotH * (1 - (v - 80) / 20); }        // 80~100%
    labels.forEach(function (l, i) { ctx.fillStyle = '#647087'; ctx.font = '600 11px Pretendard'; ctx.textAlign = 'center'; ctx.fillText(l, X(i), H - 8); });
    var t0 = null;
    function frame(ts) {
      if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 720); var e = 1 - Math.pow(1 - p, 3);
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = '#eaeef5'; for (var g = 0; g <= 4; g++) { var y = padT + plotH * g / 4; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke(); }
      labels.forEach(function (l, i) { ctx.fillStyle = '#647087'; ctx.font = '600 11px Pretendard'; ctx.textAlign = 'center'; ctx.fillText(l, X(i), H - 8); });
      drawLine(ctx, rate, X, Yrate, '#d0392b', e, true);
      drawLine(ctx, itp, X, Yitp, '#1f9d55', e, false);
      // legend
      ctx.textAlign = 'left'; ctx.font = '700 11px Pretendard';
      ctx.fillStyle = '#d0392b'; ctx.fillText('● 부적합률', padL + 4, padT + 4);
      ctx.fillStyle = '#1f9d55'; ctx.fillText('● ITP 정합율', padL + 84, padT + 4);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function drawLine(ctx, arr, X, Y, color, e, fill) {
    ctx.beginPath();
    arr.forEach(function (v, i) { var x = X(i), y = Y(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.globalAlpha = e; ctx.stroke(); ctx.globalAlpha = 1;
    arr.forEach(function (v, i) { if (i / (arr.length) > e) return; var x = X(i), y = Y(v); ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); });
  }
  function lineCompare(cv, labels, cur, prev, unit) {
    if (!cv) return; var W = cv.clientWidth || 500, H = 220, dpr = window.devicePixelRatio || 1; cv.width = W * dpr; cv.height = H * dpr; var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    var padL = 34, padR = 16, padB = 26, padT = 16, plotW = W - padL - padR, plotH = H - padB - padT;
    var max = Math.max.apply(null, cur.concat(prev)) * 1.15 || 1;
    function X(i) { return padL + plotW * i / (labels.length - 1); } function Y(v) { return padT + plotH * (1 - v / max); }
    ctx.clearRect(0, 0, W, H); ctx.strokeStyle = '#eaeef5';
    for (var g = 0; g <= 4; g++) { var y = padT + plotH * g / 4; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke(); }
    labels.forEach(function (l, i) { ctx.fillStyle = '#647087'; ctx.font = '600 10px Pretendard'; ctx.textAlign = 'center'; ctx.fillText(l, X(i), H - 8); });
    var t0 = null;
    function frame(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 700); var e = 1 - Math.pow(1 - p, 3);
      ctx.clearRect(0, 0, W, H); ctx.strokeStyle = '#eaeef5'; for (var g = 0; g <= 4; g++) { var y = padT + plotH * g / 4; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke(); }
      labels.forEach(function (l, i) { ctx.fillStyle = '#647087'; ctx.font = '600 10px Pretendard'; ctx.textAlign = 'center'; ctx.fillText(l, X(i), H - 8); });
      drawLine(ctx, prev, X, Y, '#93a0b5', e, false);
      drawLine(ctx, cur, X, Y, '#1f5fd0', e, false);
      ctx.textAlign = 'left'; ctx.font = '700 11px Pretendard'; ctx.fillStyle = '#1f5fd0'; ctx.fillText('● 올해', padL + 4, padT + 2); ctx.fillStyle = '#93a0b5'; ctx.fillText('● 전년', padL + 60, padT + 2);
      if (p < 1) requestAnimationFrame(frame);
    } requestAnimationFrame(frame);
  }
  function barsCompare(cv, labels, vals) {
    if (!cv) return; var W = cv.clientWidth || 500, H = 220, dpr = window.devicePixelRatio || 1; cv.width = W * dpr; cv.height = H * dpr; var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    var max = Math.max.apply(null, vals) * 1.15 || 1, padL = 44, padR = 12, padB = 26, padT = 12, plotW = W - padL - padR, base = H - padB, bw = plotW / labels.length;
    var t0 = null;
    function frame(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 700); var e = 1 - Math.pow(1 - p, 3);
      ctx.clearRect(0, 0, W, H); ctx.strokeStyle = '#eaeef5'; ctx.beginPath(); ctx.moveTo(padL, base); ctx.lineTo(W - padR, base); ctx.stroke();
      labels.forEach(function (l, i) {
        var hh = vals[i] / max * (base - padT) * e; var x = padL + i * bw + bw * 0.2, w = bw * 0.6;
        var grad = ctx.createLinearGradient(0, base - hh, 0, base); grad.addColorStop(0, '#3b78e6'); grad.addColorStop(1, '#1f5fd0'); ctx.fillStyle = grad;
        roundRect(ctx, x, base - hh, w, hh, 4); ctx.fill();
        ctx.fillStyle = '#647087'; ctx.font = '600 10px Pretendard'; ctx.textAlign = 'center'; ctx.fillText(l, x + w / 2, H - 8);
      });
      if (p < 1) requestAnimationFrame(frame);
    } requestAnimationFrame(frame);
  }
  function roundRect(ctx, x, y, w, hh, r) { if (hh <= 0) return; r = Math.min(r, w / 2, hh / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + hh, r); ctx.arcTo(x + w, y + hh, x, y + hh, r); ctx.arcTo(x, y + hh, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  /* =====================================================================
     대형 모니터 상시 표출 (풀스크린)
     ===================================================================== */
  var wallTimer = null, clockTimer = null;
  function openWall() {
    var c = QW.compute(recs, filter, ops.settings);
    var prev = QW.compute(recs, QW.prevYearFilter(filter), ops.settings);
    var stale = ops.refresh.stale || ops.refresh.status === '실패';
    var topKeys = ['total', 'defectRate', 'defectCount', 'ncrIssued', 'failCost', 'itpConformity', 'top5Share'];
    var maxType = Math.max.apply(null, c.typeDist.map(function (x) { return x.n; }).concat([1]));
    var maxSup = Math.max.apply(null, c.top5.map(function (x) { return x.n; }).concat([1]));
    var maxDev = Math.max.apply(null, c.byDevice.map(function (x) { return x.n; }).concat([1]));
    var wall = h('<div class="wallmode' + (stale ? ' stale' : '') + '">' +
      '<button class="btn sm exit" id="wallExit">✕ 닫기 (Esc)</button>' +
      '<div class="w-head"><div class="w-title">수입검사실 품질 현황판<small>QWALL · 실시간 통합 대시보드</small></div>' +
        '<div class="w-clock"><span id="wClock">--:--:--</span><small id="wDate"></small></div></div>' +
      (stale ? '<div class="wall-stale">🔴 새로고침 실패 — 이 화면은 ' + QW.fmtDT(ops.refresh.lastAt) + ' 시점의 이전 데이터입니다 (최신 아님)</div>' : '') +
      '<div class="w-kpis">' + topKeys.map(function (k) {
        var def = QW.KPI_DEFS.find(function (d) { return d.key === k; });
        var cmp = compareHTML(def, c.kpi[k], prev.kpi[k]).replace('cmp ', 'c ').replace(/<span class="faint[^>]*>.*?<\/span>/, '');
        return '<div class="w-kpi"><div class="l">' + def.label + '</div><div class="v">' + QW.fmtKPI(def, c.kpi[k]) + '</div>' + cmp + '</div>';
      }).join('') + '</div>' +
      '<div class="w-body">' +
        '<div class="w-panel"><h4>부적합 유형 분포</h4>' + c.typeDist.map(function (x) { return '<div class="w-bar"><div class="f" data-w="' + Math.round(x.n / maxType * 100) + '%"></div><div class="t"><span>' + x.k + '</span><span>' + x.n + '건</span></div></div>'; }).join('') + '</div>' +
        '<div class="w-panel"><h4>TOP5 부적합 공급업체</h4>' + c.top5.map(function (x) { return '<div class="w-bar"><div class="f" data-w="' + Math.round(x.n / maxSup * 100) + '%"></div><div class="t"><span>' + x.name + '</span><span>' + x.n + '건</span></div></div>'; }).join('') + '</div>' +
        '<div class="w-panel"><h4>장치·설비별</h4>' + c.byDevice.map(function (x) { return '<div class="w-bar"><div class="f" data-w="' + Math.round(x.n / maxDev * 100) + '%"></div><div class="t"><span>' + x.name + '</span><span>' + x.n + '건</span></div></div>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="w-foot"><span><span class="refresh-dot"></span>' + (stale ? '새로고침 실패 · 이전 데이터 유지' : '자동 새로고침 정상 · 마지막 ' + QW.fmtDT(ops.refresh.lastAt)) + '</span><span>다음 자동 새로고침까지 <b id="wCount">60</b>초</span></div>' +
    '</div>');
    $('#wallRoot').appendChild(wall);
    animBars(wall);
    function tick() { var d = new Date(); wall.querySelector('#wClock').textContent = QW.pad(d.getHours(), 2) + ':' + QW.pad(d.getMinutes(), 2) + ':' + QW.pad(d.getSeconds(), 2); wall.querySelector('#wDate').textContent = QW.ymd(d); }
    tick(); clockTimer = setInterval(tick, 1000);
    var cnt = 60; wallTimer = setInterval(function () { cnt--; if (cnt <= 0) { cnt = 60; wall.querySelectorAll('.w-bar .f').forEach(function (f) { f.style.width = '0'; }); setTimeout(function () { animBars(wall); }, 60); } var wc = wall.querySelector('#wCount'); if (wc) wc.textContent = cnt; }, 1000);
    function close() { clearInterval(wallTimer); clearInterval(clockTimer); document.removeEventListener('keydown', esc); wall.remove(); }
    function esc(e) { if (e.key === 'Escape') close(); }
    wall.querySelector('#wallExit').onclick = close; document.addEventListener('keydown', esc);
  }

  /* ---------- 시작 ---------- */
  renderAuth();
  router();
})();
