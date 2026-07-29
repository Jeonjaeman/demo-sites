/* =====================================================================
   ZEROLAG 제로랙 — 감지 콘솔 (index.html)
   실시간 폴링 루프 · 로그 스트림 · 감지/중복제거 · 장애 주입/복구 · 요청제한 트레이드오프
   ===================================================================== */
(function () {
  'use strict';
  var ZL = window.ZL;
  var state = ZL.createState(ZL.loadConfig());
  var running = false, pollTimer = null, autoTimer = null, auto = true;

  /* ---------- DOM 헬퍼 ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function h(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  var app = $('#app');

  function toast(msg, kind) {
    var t = h('<div class="toast ' + (kind || '') + '"><span class="dot"></span><span>' + msg + '</span></div>');
    $('#toasts').appendChild(t); requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, 2600);
  }

  /* 리빌 + 폴백(28·29 빈화면 버그 재발 방지) */
  var io = null, revealTimer = null;
  try { io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .1 }); } catch (e) { io = null; }
  function wireReveal(root) {
    var scope = root || document;
    scope.querySelectorAll('.reveal:not(.in)').forEach(function (n, i) { n.style.transitionDelay = (i % 6 * 50) + 'ms'; if (io) io.observe(n); });
    clearTimeout(revealTimer);
    revealTimer = setTimeout(function () { scope.querySelectorAll('.reveal:not(.in)').forEach(function (n) { n.classList.add('in'); }); }, 450);
  }

  /* ---------- 시각 ---------- */
  function hhmmss(t) { var d = new Date(t); return p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()) + '.' + String(d.getMilliseconds()).padStart(3, '0').slice(0, 2); }
  function p2(n) { return String(n).padStart(2, '0'); }
  function dur(ms) { var s = Math.floor(ms / 1000); var m = Math.floor(s / 60); s = s % 60; return m + '분 ' + p2(s) + '초'; }

  /* ---------- 엔진 루프 ---------- */
  function startEngine() {
    if (running) return;
    running = true;
    if (state.metrics.startedAt == null) state.metrics.startedAt = Date.now();
    scheduleLoop();
    scheduleAuto();
    reflectRunBtn();
  }
  function stopEngine() {
    running = false; clearInterval(pollTimer); clearInterval(autoTimer); pollTimer = autoTimer = null; reflectRunBtn();
    updateExchanges(); // 정지 상태 반영
  }
  function scheduleLoop() {
    clearInterval(pollTimer);
    pollTimer = setInterval(function () {
      ZL.tick(state, Date.now());
      renderLive();
    }, Math.max(150, state.config.pollMs));
  }
  function scheduleAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(function () {
      if (!running || !auto) return;
      if (Math.random() < 0.55) { var ex = Math.random() < 0.5 ? 'UPBIT' : 'BITHUMB'; ZL.addNotice(state, ex, Date.now()); }
    }, 2600);
  }
  function restartLoop() { if (running) { scheduleLoop(); } }

  /* ---------- 라우터 ---------- */
  var routes = { console: viewConsole, 'trade-off': viewTradeoff };
  function router() {
    var name = (location.hash.replace(/^#\//, '') || 'console').split('/')[0];
    document.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#/' + name); });
    window.scrollTo(0, 0);
    (routes[name] || viewConsole)();
    wireReveal(app);
  }
  window.addEventListener('hashchange', router);

  /* =====================================================================
     감지 콘솔
     ===================================================================== */
  function viewConsole() {
    app.innerHTML =
      '<div class="between reveal" style="margin-bottom:14px;flex-wrap:wrap;gap:12px">' +
        '<div><h2 style="font-size:22px">실시간 감지 콘솔</h2><p class="muted small">업비트·빗썸 공지를 폴링해 신규 등록을 1초 이내에 감지합니다. 이 콘솔은 그 감지 로직(폴링·중복제거·백오프)을 브라우저에서 <b>실제로 실행</b>합니다 — 공지는 데모용 예시이며, 실거래소 감지는 납품 파이썬 코드(detector.py)가 수행합니다.</p></div>' +
        '<div class="center"><button class="btn" id="runBtn"></button><button class="btn sm" id="clearBtn">초기화</button></div>' +
      '</div>' +
      '<div class="kpis reveal" id="kpis" style="margin-bottom:14px"></div>' +
      '<div class="console-grid" style="display:grid;grid-template-columns:340px 1fr;gap:14px;align-items:start">' +
        '<div>' +
          '<div id="exchanges" style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px"></div>' +
          '<div class="card"><div class="card-h"><h3>제어</h3><span class="small muted">코드 수정 없이 조정</span></div><div class="card-b" id="controls"></div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr;gap:14px">' +
          '<div class="card"><div class="card-h"><h3>실시간 로그 스트림</h3><span class="small muted" id="logMeta"></span></div><div class="card-b" style="padding:10px"><div class="logbox" id="logbox"></div></div></div>' +
          '<div class="card"><div class="card-h"><h3>감지된 신규 공지</h3><span class="small muted" id="detMeta"></span></div><div class="card-b" style="padding:12px"><div class="detlist" id="detlist"></div></div></div>' +
        '</div>' +
      '</div>';

    renderControls();
    renderKPIs(); updateExchanges(); renderLog(); renderDet();
    reflectRunBtn();
    $('#runBtn').onclick = function () { running ? stopEngine() : startEngine(); };
    $('#clearBtn').onclick = function () { resetAll(); };
    if (!running && state.metrics.requests === 0) startEngine(); // 진입 시 자동 시작
  }

  function reflectRunBtn() {
    var b = $('#runBtn'); if (!b) return;
    b.innerHTML = running ? '⏸ 일시정지' : '▶ 감지 시작';
    b.classList.toggle('pri', !running);
    var lm = $('#logMeta'); if (lm) lm.innerHTML = running ? '<span class="badge b-ok plain small">● 폴링 중 · ' + (state.config.pollMs) + 'ms 주기</span>' : '<span class="badge b-gray small">정지됨</span>';
  }

  /* 제어 패널 */
  function renderControls() {
    var c = state.config;
    $('#controls').innerHTML =
      '<div class="field" style="margin-bottom:14px"><label>폴링 주기 <b class="mono" id="pollLbl">' + c.pollMs + 'ms</b> <span class="small muted">(' + Math.round(60000 / c.pollMs) + '회/분)</span></label>' +
        '<input type="range" id="pollRange" min="300" max="3000" step="100" value="' + c.pollMs + '" /></div>' +
      '<div id="budgetHint" class="small" style="margin:-6px 0 14px"></div>' +
      '<label class="between" style="margin-bottom:12px"><span style="font-weight:700">중복 제거 <span class="small muted">(공지 id 기준)</span></span><span class="switch"><input type="checkbox" id="dedupTg"' + (c.dedup ? ' checked' : '') + '/><span class="track"></span></span></label>' +
      '<label class="between" style="margin-bottom:14px"><span style="font-weight:700">공지 자동 발생 <span class="small muted">(데모)</span></span><span class="switch"><input type="checkbox" id="autoTg"' + (auto ? ' checked' : '') + '/><span class="track"></span></span></label>' +
      '<div class="divider"></div>' +
      '<div class="small muted" style="margin-bottom:8px">신규 공지 강제 발생</div>' +
      '<div class="wrap-g" style="margin-bottom:6px"><button class="btn sm" data-emit="UPBIT">＋ 업비트 공지</button><button class="btn sm" data-emit="BITHUMB">＋ 빗썸 공지</button></div>';
    updateBudgetHint();
    $('#pollRange').oninput = function () {
      state.config.pollMs = parseInt(this.value, 10); ZL.saveConfig(state.config);
      $('#pollLbl').textContent = state.config.pollMs + 'ms';
      $('#pollLbl').nextElementSibling.textContent = '(' + Math.round(60000 / state.config.pollMs) + '회/분)';
      updateBudgetHint(); restartLoop(); reflectRunBtn();
    };
    $('#dedupTg').onchange = function () { state.config.dedup = this.checked; ZL.saveConfig(state.config); toast('중복 제거 ' + (this.checked ? 'ON' : 'OFF — 같은 공지가 매 주기 재출력됩니다')); };
    $('#autoTg').onchange = function () { auto = this.checked; };
    app.querySelectorAll('[data-emit]').forEach(function (b) {
      b.onclick = function () { var ex = b.getAttribute('data-emit'); var n = ZL.addNotice(state, ex, Date.now()); toast(ZL.EX_LABEL[ex] + ' 신규 공지 발행: ' + n.title.slice(0, 22) + '…'); if (!running) { ZL.tick(state, Date.now()); renderLive(); } };
    });
  }
  function updateBudgetHint() {
    var el = $('#budgetHint'); if (!el) return;
    var perMin = Math.round(60000 / state.config.pollMs);
    var over = perMin > state.config.reqBudgetPerMin;
    el.className = 'small';
    el.innerHTML = over
      ? '<span style="color:var(--bad)">⚠ 분당 ' + perMin + '회 — 이용약관 안전 예산(' + state.config.reqBudgetPerMin + '회/분) 초과. 차단 위험.</span>'
      : '<span style="color:var(--ok)">✓ 분당 ' + perMin + '회 — 안전 예산(' + state.config.reqBudgetPerMin + '회/분) 이내.</span>';
  }

  /* ---------- 라이브 렌더 ---------- */
  function renderLive() { renderKPIs(); updateExchanges(); renderLog(); renderDet(); reflectRunBtn(); }

  function renderKPIs() {
    var host = $('#kpis'); if (!host) return;
    var m = ZL.metrics(state);
    var kpis = [
      { lab: '평균 감지 지연', val: m.avgLatency + 'ms', sub: '공지 등록→감지', hl: true },
      { lab: '1초 이내 감지율', val: (m.within1sRate * 100).toFixed(0) + '%', sub: m.within1s + '/' + m.detections + '건', hl: true },
      { lab: '총 감지', val: ZL.num ? ZL.num(m.uniqueDetections) : m.uniqueDetections, sub: '고유 공지' },
      { lab: '중복 출력', val: m.dupEmitted + '건', sub: state.config.dedup ? 'id 기준 제거 ON' : '제거 OFF — 재출력 중', hl: false },
      { lab: '무중단 가동', val: dur(m.uptimeMs), sub: '요청 ' + m.requests + '회 · 실패 ' + m.failures }
    ];
    host.innerHTML = kpis.map(function (k) {
      return '<div class="kpi' + (k.hl ? ' hl' : '') + '"><div class="lab">' + k.lab + '</div><div class="val">' + k.val + '</div><div class="sub">' + k.sub + '</div></div>';
    }).join('');
  }

  function updateExchanges() {
    var host = $('#exchanges'); if (!host) return;
    host.innerHTML = ZL.EXCHANGES.map(function (ex) {
      var s = state.ex[ex]; var fault = state.faults[ex];
      var st = !running ? 'idle' : fault ? 'fail' : (Date.now() < s.backoffUntil ? 'backoff' : 'ok');
      var stLabel = { idle: '정지', ok: '정상', fail: '장애', backoff: '백오프' }[st];
      var badge = { idle: 'b-gray', ok: 'b-ok', fail: 'b-bad', backoff: 'b-warn' }[st];
      return '<div class="card pad"><div class="between" style="margin-bottom:10px">' +
        '<div class="center"><span class="dot ' + st + (st === 'ok' && running ? ' pulse' : '') + '" style="width:11px;height:11px;border-radius:50%"></span>' +
        '<span class="exname" style="color:' + (ex === 'UPBIT' ? '#7db1ff' : '#ffb865') + '">' + ZL.EX_LABEL[ex] + '</span><span class="badge ' + badge + ' small">' + stLabel + '</span></div>' +
        '<label class="center small" style="gap:6px">장애 주입<span class="switch" style="width:36px;height:20px"><input type="checkbox" data-fault="' + ex + '"' + (fault ? ' checked' : '') + '/><span class="track"></span></span></label></div>' +
        '<div class="between small muted"><span>응답 지연</span><b class="mono" style="color:var(--ink2)">' + (s.lastLatency ? s.lastLatency + 'ms' : '—') + '</b></div>' +
        '<div class="between small muted"><span>폴링 횟수</span><b class="mono" style="color:var(--ink2)">' + s.pollCount + '회</b></div>' +
        '<div class="between small muted"><span>감지 누적</span><b class="mono" style="color:var(--ink2)">' + s.seenCount + '건</b></div>' +
        (st === 'backoff' ? '<div class="tiny" style="color:var(--warn);margin-top:6px">백오프 중 — ' + Math.max(0, Math.ceil((s.backoffUntil - Date.now()) / 1000)) + 's 후 재시도</div>' : '') +
        '</div>';
    }).join('');
    host.querySelectorAll('[data-fault]').forEach(function (t) {
      t.onchange = function () {
        var ex = t.getAttribute('data-fault'); state.faults[ex] = t.checked;
        if (t.checked) { toast(ZL.EX_LABEL[ex] + ' 장애 주입 — 다른 거래소 감지는 계속됩니다', 'warn'); ZL.log(state, 'warn', ex, '장애 주입됨(수동)'); }
        else { state.ex[ex].backoffUntil = 0; state.ex[ex].failStreak = 0; ZL.log(state, 'ok', ex, '장애 해제(수동)'); }
        renderLog();
      };
    });
  }

  function renderLog() {
    var box = $('#logbox'); if (!box) return;
    if (!state.log.length) { box.innerHTML = '<div class="empty small">감지 시작을 누르면 폴링 로그가 실시간으로 쌓입니다.</div>'; return; }
    box.innerHTML = state.log.slice(0, 120).map(function (l) {
      var cls = l.level === 'detect' ? 'detect' : l.level === 'warn' ? 'warn' : l.level === 'ok' ? 'ok' : '';
      var mcls = /\[중복\]/.test(l.msg) ? 'lm dup' : 'lm';
      return '<div class="logline ' + cls + '"><span class="lt">' + hhmmss(l.t) + '</span><span class="lex ' + (l.ex || '') + '">' + (l.ex ? ZL.EX_LABEL[l.ex] : '') + '</span><span class="' + mcls + '">' + esc(l.msg) + '</span></div>';
    }).join('');
  }
  function renderDet() {
    var box = $('#detlist'); if (!box) return;
    var meta = $('#detMeta'); if (meta) meta.textContent = state.detected.filter(function (d) { return !d.dup; }).length + '건';
    var list = state.detected.slice(0, 40);
    if (!list.length) { box.innerHTML = '<div class="empty small">아직 감지된 공지가 없습니다. “＋ 공지”로 신규 공지를 발생시켜 보세요.</div>'; return; }
    box.innerHTML = list.map(function (d) {
      return '<div class="detcard"><div class="top"><span class="badge ' + (d.exchange === 'UPBIT' ? 'b-up' : 'b-bit') + ' small">' + ZL.EX_LABEL[d.exchange] + '</span>' +
        '<span class="badge ' + (d.within1s ? 'b-ok' : 'b-warn') + ' small mono">' + d.latency + 'ms ' + (d.within1s ? '✓' : '⚠') + '</span></div>' +
        '<div class="title">' + esc(d.title) + (d.dup ? ' <span class="badge b-bad small">중복</span>' : '') + '</div>' +
        '<div class="meta"><span>' + d.cat + '</span><span class="mono">감지 ' + hhmmss(d.detectedAt) + '</span></div></div>';
    }).join('');
  }

  function resetAll() {
    stopEngine();
    state = ZL.createState(state.config);
    renderKPIs(); updateExchanges(); renderLog(); renderDet();
    toast('콘솔을 초기화했습니다.');
    startEngine();
  }

  /* =====================================================================
     지연 vs 요청제한 (트레이드오프)
     ===================================================================== */
  function viewTradeoff() {
    var cfg = state.config;
    var avgReq = Math.round((cfg.reqLatencyMin + cfg.reqLatencyMax) / 2);
    var rows = [300, 500, 800, 1000, 1500, 2000, 3000].map(function (p) {
      var perMin = Math.round(60000 / p);
      var over = perMin > cfg.reqBudgetPerMin;
      var worst = p + avgReq;                 // 등록 직후 폴링을 놓친 최악
      var avg = Math.round(p / 2 + avgReq);   // 평균
      var guaranteed = worst <= 1000;         // 1초 보장 가능?
      return { p: p, perMin: perMin, over: over, worst: worst, avg: avg, guaranteed: guaranteed };
    });
    app.innerHTML =
      '<div class="reveal" style="margin-bottom:14px"><h2 style="font-size:22px">지연 vs 요청 제한 — 이 프로젝트의 핵심 트레이드오프</h2>' +
      '<p class="muted small" style="max-width:760px">“1초 이내 감지”와 “거래소 요청 제한 준수”는 서로 당깁니다. 폴링 주기가 짧을수록 감지는 빨라지지만 분당 요청이 늘어 <b>차단 위험</b>이 커집니다. 반대로 주기가 1초면 등록 직후 폴링을 놓친 공지는 <b>최악 ~1초+응답지연</b>이 걸려 1초를 넘길 수 있습니다.</p></div>' +
      '<div class="warn-box reveal" style="margin-bottom:14px">현재 응답 지연 가정 <b>평균 ' + avgReq + 'ms</b> 기준 · 안전 요청 예산 <b>' + cfg.reqBudgetPerMin + '회/분</b>. 아래 표에서 “1초 보장”과 “예산 이내”를 동시에 만족하는 구간이 좁다는 점이 이 과업의 실무 함정입니다.</div>' +
      '<div class="card reveal"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>폴링 주기</th><th class="right">분당 요청</th><th>요청 예산</th><th class="right">평균 지연</th><th class="right">최악 지연</th><th>1초 보장</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr' + (r.p === cfg.pollMs ? ' style="background:var(--accent-l)"' : '') + '><td class="mono">' + r.p + 'ms' + (r.p === cfg.pollMs ? ' <span class="badge b-accent small">현재</span>' : '') + '</td>' +
          '<td class="right mono">' + r.perMin + '회</td>' +
          '<td>' + (r.over ? '<span class="badge b-bad small">초과·위험</span>' : '<span class="badge b-ok small">이내</span>') + '</td>' +
          '<td class="right mono">~' + r.avg + 'ms</td><td class="right mono">~' + r.worst + 'ms</td>' +
          '<td>' + (r.guaranteed ? '<span class="badge b-ok small">가능</span>' : '<span class="badge b-warn small">초과 가능</span>') + '</td></tr>';
      }).join('') +
      '</tbody></table></div></div>' +
      '<div class="note-box reveal" style="margin-top:14px">제안: 단순 고정 주기 대신 <b>적응형 폴링</b>(평상시 여유 주기 → 신규 감지 직후 짧게)과 <b>백오프·요청 예산 가드</b>를 넣으면, 대부분의 공지를 1초 이내로 잡으면서도 분당 요청을 안전 범위로 유지할 수 있습니다. 결과 출력 형태(표준출력/로그/함수 반환)와 폴링 허용 범위는 착수 전 확정합니다.</div>';
  }

  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

  /* ---------- 시작 ---------- */
  router();
})();
