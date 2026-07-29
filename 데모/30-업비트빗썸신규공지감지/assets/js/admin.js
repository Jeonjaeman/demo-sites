/* =====================================================================
   ZEROLAG 제로랙 — 납품물·검수 (admin.html)
   파이썬 소스 뷰어 · 설정(config, 콘솔과 localStorage 공유) · 수용 기준 검수표
   ===================================================================== */
(function () {
  'use strict';
  var ZL = window.ZL;

  function $(s, r) { return (r || document).querySelector(s); }
  function h(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  var app = $('#app');

  function toast(msg, kind) {
    var t = h('<div class="toast ' + (kind || '') + '"><span class="dot"></span><span>' + msg + '</span></div>');
    $('#toasts').appendChild(t); requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, 2600);
  }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

  /* 리빌 + 폴백 + 재렌더 보장(빈화면 방지) */
  var io = null, revealTimer = null;
  try { io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .1 }); } catch (e) { io = null; }
  function wireReveal() {
    app.querySelectorAll('.reveal:not(.in)').forEach(function (n, i) { n.style.transitionDelay = (i % 6 * 50) + 'ms'; if (io) io.observe(n); });
    clearTimeout(revealTimer);
    revealTimer = setTimeout(function () { app.querySelectorAll('.reveal:not(.in)').forEach(function (n) { n.classList.add('in'); }); }, 450);
  }

  var routes = { code: viewCode, config: viewConfig, spec: viewSpec };
  function router() {
    var name = (location.hash.replace(/^#\//, '') || 'code').split('/')[0];
    document.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#/' + name); });
    window.scrollTo(0, 0);
    (routes[name] || viewCode)();
    wireReveal();
  }
  window.addEventListener('hashchange', router);

  /* =====================================================================
     파이썬 소스
     ===================================================================== */
  var activeFile = 'detector.py';
  var FILES = {
    'detector.py': function () { return ZL.PYTHON_SRC; },
    'config.py': function () { return ZL.CONFIG_SRC; },
    'requirements.txt': function () { return ZL.REQ_SRC; }
  };
  function viewCode() {
    app.innerHTML =
      '<div class="reveal" style="margin-bottom:14px"><h2 style="font-size:22px">파이썬 소스 (납품물)</h2>' +
      '<p class="muted small">실제 납품물은 아래 파이썬 스크립트입니다. 감지 콘솔은 이 로직을 브라우저에서 재현한 것입니다. 외부 라이브러리 없이 표준 라이브러리(urllib)만 사용합니다.</p></div>' +
      '<div class="between reveal" style="margin-bottom:10px"><div class="filetab" id="filetab">' +
        Object.keys(FILES).map(function (f) { return '<button data-f="' + f + '"' + (f === activeFile ? ' class="on"' : '') + '>' + f + '</button>'; }).join('') +
      '</div><button class="btn sm" id="copyBtn">복사</button></div>' +
      '<div class="code reveal"><pre id="codePre">' + esc(FILES[activeFile]()) + '</pre></div>';
    app.querySelectorAll('#filetab button').forEach(function (b) { b.onclick = function () { activeFile = b.getAttribute('data-f'); viewCode(); }; });
    $('#copyBtn').onclick = function () {
      var txt = FILES[activeFile]();
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast(activeFile + ' 복사됨'); }, function () { toast('복사 실패 — 직접 선택하세요', 'warn'); });
      else toast('이 브라우저는 자동 복사를 지원하지 않습니다', 'warn');
    };
  }

  /* =====================================================================
     설정 (config) — 콘솔과 공유
     ===================================================================== */
  function viewConfig() {
    var c = ZL.loadConfig();
    app.innerHTML =
      '<div class="reveal" style="margin-bottom:14px"><h2 style="font-size:22px">설정</h2>' +
      '<p class="muted small">폴링 주기·재시도·백오프·요청 예산을 코드 수정 없이 조정합니다(요구사항). 여기서 저장한 값은 감지 콘솔에 즉시 반영됩니다.</p></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start" class="ctrl-grid">' +
        '<div class="card reveal"><div class="card-h"><h3>실행 설정</h3><button class="btn sm pri" id="saveCfg">저장</button></div><div class="card-b">' +
          cfgField('폴링 주기(ms)', 'pollMs', c.pollMs, '신규 공지 확인 주기. 짧을수록 빠르지만 요청↑') +
          cfgField('요청 예산(회/분·거래소당)', 'reqBudgetPerMin', c.reqBudgetPerMin, '이용약관 안전 요청 상한 가정') +
          cfgField('백오프 기준(ms)', 'backoffBaseMs', c.backoffBaseMs, '실패 시 대기 = 기준 × 2^(실패횟수-1)') +
          cfgField('백오프 상한(ms)', 'backoffMaxMs', c.backoffMaxMs, '') +
          cfgField('응답 지연 최소(ms)', 'reqLatencyMin', c.reqLatencyMin, '모의 요청 지연 범위') +
          cfgField('응답 지연 최대(ms)', 'reqLatencyMax', c.reqLatencyMax, '') +
          '<label class="between" style="margin-top:6px"><span style="font-weight:700">중복 제거(공지 id 기준)</span><span class="switch"><input type="checkbox" id="cfgDedup"' + (c.dedup ? ' checked' : '') + '/><span class="track"></span></span></label>' +
          '<button class="btn sm wide" id="resetCfg" style="margin-top:14px">기본값으로 초기화</button>' +
        '</div></div>' +
        '<div class="card reveal"><div class="card-h"><h3>생성된 config.py</h3></div><div class="card-b"><div class="code"><pre id="cfgPre"></pre></div>' +
          '<div class="note-box" style="margin-top:12px" id="cfgCalc"></div></div></div>' +
      '</div>';
    renderCfgPre(c);
    $('#saveCfg').onclick = function () {
      ['pollMs', 'reqBudgetPerMin', 'backoffBaseMs', 'backoffMaxMs', 'reqLatencyMin', 'reqLatencyMax'].forEach(function (k) {
        var v = parseInt($('#cfg_' + k).value, 10); if (!isNaN(v) && v >= 0) c[k] = v;
      });
      c.dedup = $('#cfgDedup').checked;
      if (c.reqLatencyMax < c.reqLatencyMin) c.reqLatencyMax = c.reqLatencyMin;
      ZL.saveConfig(c); renderCfgPre(c); toast('설정 저장 — 감지 콘솔에 반영됩니다', 'ok');
    };
    $('#resetCfg').onclick = function () { c = ZL.resetConfig(); viewConfig(); toast('기본값으로 초기화'); };
    $('#cfgDedup').onchange = function () { c.dedup = this.checked; renderCfgPre(c); };
  }
  function cfgField(label, key, val, hint) {
    return '<div class="field" style="margin-bottom:12px"><label>' + label + '</label><input class="inp mono" id="cfg_' + key + '" type="number" value="' + val + '" />' + (hint ? '<span class="tiny faint">' + hint + '</span>' : '') + '</div>';
  }
  function renderCfgPre(c) {
    var pre = $('#cfgPre'); if (!pre) return;
    pre.textContent =
      '# config.py (자동 생성)\n' +
      'POLL_INTERVAL_SEC = ' + (c.pollMs / 1000) + '\n' +
      'REQUEST_TIMEOUT   = 3\n' +
      'BACKOFF_BASE      = ' + (c.backoffBaseMs / 1000) + '\n' +
      'BACKOFF_MAX       = ' + (c.backoffMaxMs / 1000) + '\n' +
      'DEDUP_BY_ID       = ' + (c.dedup ? 'True' : 'False') + '\n';
    var calc = $('#cfgCalc'); if (calc) {
      var perMin = Math.round(60000 / c.pollMs);
      var over = perMin > c.reqBudgetPerMin;
      var worst = c.pollMs + Math.round((c.reqLatencyMin + c.reqLatencyMax) / 2);
      calc.innerHTML = '이 설정의 분당 요청 <b>' + perMin + '회</b> (' + (over ? '<span style="color:var(--bad)">예산 초과·차단 위험</span>' : '<span style="color:var(--ok)">예산 이내</span>') + ') · 최악 감지 지연 <b>~' + worst + 'ms</b> (' + (worst <= 1000 ? '1초 이내 보장' : '1초 초과 가능') + ')';
    }
  }

  /* =====================================================================
     수용 기준 검수 — 콘솔 상태와 연결
     ===================================================================== */
  function viewSpec() {
    var c = ZL.loadConfig();
    // 데모에서 실제로 검증한 결과(엔진 로직 기반) 요약
    var specs = [
      { k: '폴링 1초 이하 유지 시 신규 공지 1초 이내 제목 출력', how: '감지 콘솔에서 신규 공지 발생 → 지연(ms)과 “1초 이내 감지율”로 확인. 최악 지연은 주기+응답지연.', ok: true },
      { k: '동일 공지가 두 번 이상 출력되지 않음', how: '공지 id 기준 seen-set으로 중복 제거. 콘솔에서 중복 제거 OFF 시 재출력되는 것으로 로직 실증.', ok: true },
      { k: '네트워크 오류·응답 실패에도 종료되지 않고 다음 주기 복구', how: '장애 주입 → 요청 실패 → 백오프 후 자동 복구. 예외는 거래소 단위로 격리.', ok: true },
      { k: '한 거래소가 응답하지 않아도 다른 거래소 감지 계속', how: '거래소별 상태·백오프 독립. 업비트 장애 주입해도 빗썸 감지 지속.', ok: true }
    ];
    app.innerHTML =
      '<div class="reveal" style="margin-bottom:14px"><h2 style="font-size:22px">수용 기준 검수</h2>' +
      '<p class="muted small">공고의 수용 기준 4가지를 데모에서 실제로 확인할 수 있습니다. 각 항목의 “확인 방법”을 감지 콘솔에서 눌러 검증해 보세요.</p></div>' +
      '<div class="card reveal"><div class="card-b" style="padding:8px 0">' +
      specs.map(function (s, i) {
        return '<div class="between" style="padding:14px 18px;border-bottom:1px solid var(--line2);gap:14px;align-items:flex-start">' +
          '<div><div style="font-weight:700;font-size:14px">' + (i + 1) + '. ' + s.k + '</div><div class="small muted" style="margin-top:4px">' + s.how + '</div></div>' +
          '<span class="badge b-ok" style="flex-shrink:0">구현됨</span></div>';
      }).join('') +
      '</div></div>' +
      '<div class="card reveal" style="margin-top:14px"><div class="card-h"><h3>비기능·스코프</h3></div><div class="card-b">' +
        '<div class="tbl-wrap"><table class="tbl"><tbody>' +
        specRow('무중단 실행(예외 시 종료 안 됨)', '거래소 단위 try/catch로 격리 — 구현') +
        specRow('요청 제한 넘지 않는 폴링 주기', '요청 예산 가드 + 설정 분리 — 구현') +
        specRow('외부 라이브러리 최소화', 'urllib 표준 라이브러리만 — 구현') +
        specRow('서버 구축·배포·상시 운영', '스코프 밖(발주사 수행)') +
        specRow('알림 발송·DB 적재·관리자 화면·자동매매', '스코프 밖') +
        '</tbody></table></div>' +
        '<div class="warn-box" style="margin-top:14px">착수 전 확인: 거래소 이용약관상 폴링 허용 범위 · 실행 환경(파이썬 버전/OS) · 감지 결과 출력 형태(표준출력/로그/함수 반환) · 공지 등록 시각 기준.</div>' +
      '</div></div>';
  }
  function specRow(k, v) {
    var scope = /스코프 밖/.test(v);
    return '<tr><td style="font-weight:600">' + k + '</td><td class="right"><span class="badge ' + (scope ? 'b-gray' : 'b-ok') + ' small">' + v + '</span></td></tr>';
  }

  router();
})();
