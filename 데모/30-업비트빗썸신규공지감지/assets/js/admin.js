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

  var routes = { deliverables: viewDeliverables, code: viewDeliverables, config: viewConfig, spec: viewSpec };
  function router() {
    var name = (location.hash.replace(/^#\//, '') || 'deliverables').split('/')[0];
    if (name === 'code') name = 'deliverables';
    document.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#/' + name); });
    window.scrollTo(0, 0);
    (routes[name] || viewCode)();
    wireReveal();
  }
  window.addEventListener('hashchange', router);

  /* =====================================================================
     납품물 구성 — 소스 본문은 계약 후 전달(잠금)
     ===================================================================== */
  function viewDeliverables() {
    var M = ZL.MEASURED;
    app.innerHTML =
      '<div class="reveal" style="margin-bottom:14px"><h2 style="font-size:22px">🔒 납품물 구성</h2>' +
      '<p class="muted small">파일 구성·분량·설계 판단은 아래에 모두 공개돼 있습니다. ' +
      '<b>소스 본문만 계약 후 전달</b>드립니다. 동작은 ' +
      '<a href="./index.html" style="color:var(--accent)">실행 증거</a> 페이지에서 지금 바로 확인하실 수 있습니다 — ' +
      '라이브 감지 엔진이 실제로 돌고 있습니다.</p></div>' +

      '<div class="card reveal" style="margin-bottom:14px"><div class="card-h"><h3>파일 구성</h3>' +
        '<span class="small muted">python/ · 총 ' +
        ZL.DELIVERABLES.reduce(function (a, d) { return a + d.lines; }, 0) + '줄</span></div><div class="card-b">' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>파일</th><th class="right">줄 수</th><th>내용</th></tr></thead><tbody>' +
        ZL.DELIVERABLES.map(function (d) {
          return '<tr><td class="mono">' + d.f + '</td><td class="right mono">' + d.lines + '</td>' +
                 '<td class="small muted">' + d.d + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
      '</div></div>' +

      '<div class="card reveal" style="margin-bottom:14px"><div class="card-h"><h3>설계 판단 — 공고 수용기준을 맞추기 위해 고친 두 가지</h3></div><div class="card-b">' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>항목</th><th class="right">고치기 전</th><th class="right">납품본</th></tr></thead><tbody>' +
        '<tr><td>정상 상태 폴링 주기<div class="small muted">설정 1.0초</div></td>' +
          '<td class="right mono" style="color:var(--bad)">' + M.before.period.toFixed(3) + 's</td>' +
          '<td class="right mono" style="color:var(--ok)">' + M.after.period.toFixed(3) + 's</td></tr>' +
        '<tr><td>한 거래소 타임아웃 시 다른 거래소 주기</td>' +
          '<td class="right mono" style="color:var(--bad)">' + M.before.isolatedPeriod.toFixed(3) + 's</td>' +
          '<td class="right mono" style="color:var(--ok)">' + M.after.isolatedPeriod.toFixed(3) + 's</td></tr>' +
        '</tbody></table></div>' +
        '<div class="note-box" style="margin-top:12px"><b>①</b> <code>sleep(주기)</code>를 요청 뒤에 붙이면 실제 주기 = 주기 + 응답지연이 되어 1초를 넘깁니다 → <b>마감 시각 기준 대기</b>로 변경. ' +
        '<b>②</b> 두 거래소를 순차로 돌면 한쪽 타임아웃(3초)을 다른 쪽이 그대로 기다립니다 → <b>거래소별 독립 스레드</b>로 분리.</div>' +
        '<p class="tiny faint" style="margin-top:10px">' + esc(M.sample) + '</p>' +
      '</div></div>' +

      '<div class="card reveal"><div class="card-b" style="text-align:center;padding:26px 18px">' +
        '<div style="font-size:34px;margin-bottom:8px">🔒</div>' +
        '<b style="font-size:15px">소스 본문은 계약 시 공개됩니다</b>' +
        '<p class="muted small" style="max-width:520px;margin:8px auto 0">' +
          '지금 공개된 것: 실제 동작(라이브 엔진) · 실행 로그 · 실측 수치 · 설계 판단 · 파일 구성.<br>' +
          '계약과 동시에 <code>detector.py</code> 전문과 저장소 접근 권한을 드립니다.</p>' +
        '<button class="btn pri" id="btnLocked" style="margin-top:16px;opacity:.55;cursor:not-allowed">🔒 전체 소스 보기 — 계약 시 활성화</button>' +
      '</div></div>';

    var b = $('#btnLocked');
    if (b) b.onclick = function () { toast('소스 본문은 계약 후 전달드립니다', 'warn'); };
  }

  /* =====================================================================
     설정 (config) — 콘솔과 공유
     ===================================================================== */
  function viewConfig() {
    var c = ZL.loadConfig();
    app.innerHTML =
      '<div class="reveal" style="margin-bottom:14px"><h2 style="font-size:22px">설정</h2>' +
      '<p class="muted small">폴링 주기·재시도·백오프·요청 예산을 코드 수정 없이 조정합니다(요구사항). 저장하면 아래 config.py 미리보기에 즉시 반영됩니다.</p></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start" class="ctrl-grid">' +
        '<div class="card reveal"><div class="card-h"><h3>실행 설정</h3><button class="btn sm pri" id="saveCfg">저장</button></div><div class="card-b">' +
          cfgField('폴링 주기(ms)', 'pollMs', c.pollMs, '신규 공지 확인 주기. 짧을수록 빠르지만 요청↑') +
          cfgField('요청 타임아웃(초)', 'requestTimeout', c.requestTimeout, 'REQUEST_TIMEOUT') +
          cfgField('백오프 기준(ms)', 'backoffBaseMs', c.backoffBaseMs, '실패 시 대기 = 기준 × 2^(실패횟수-1)') +
          cfgField('백오프 상한(ms)', 'backoffMaxMs', c.backoffMaxMs, '') +
          cfgField('조회 건수(거래소당)', 'maxItems', c.maxItems, 'MAX_ITEMS') +
          cfgField('요청 예산(회/분·거래소당)', 'reqBudgetPerMin', c.reqBudgetPerMin, '이용약관 안전 요청 상한 가정(분석용)') +
          '<label class="between" style="margin-top:6px"><span style="font-weight:700">중복 제거(공지 id 기준)</span><span class="switch"><input type="checkbox" id="cfgDedup"' + (c.dedup ? ' checked' : '') + '/><span class="track"></span></span></label>' +
          '<button class="btn sm wide" id="resetCfg" style="margin-top:14px">기본값으로 초기화</button>' +
        '</div></div>' +
        '<div class="card reveal"><div class="card-h"><h3>생성된 config.py</h3></div><div class="card-b"><div class="code"><pre id="cfgPre"></pre></div>' +
          '<div class="note-box" style="margin-top:12px" id="cfgCalc"></div>' +
          '<p class="tiny faint" style="margin-top:10px">이 값을 config.py로 저장하면 detector.py가 그대로 사용합니다(코드 수정 불필요).</p></div></div>' +
      '</div>';
    renderCfgPre(c);
    $('#saveCfg').onclick = function () {
      ['pollMs', 'requestTimeout', 'backoffBaseMs', 'backoffMaxMs', 'maxItems', 'reqBudgetPerMin'].forEach(function (k) {
        var v = parseInt($('#cfg_' + k).value, 10); if (!isNaN(v) && v >= 0) c[k] = v;
      });
      c.dedup = $('#cfgDedup').checked;
      ZL.saveConfig(c); renderCfgPre(c); toast('설정 저장 — config.py 미리보기에 반영', 'ok');
    };
    $('#resetCfg').onclick = function () { c = ZL.resetConfig(); viewConfig(); toast('기본값으로 초기화'); };
    $('#cfgDedup').onchange = function () { c.dedup = this.checked; renderCfgPre(c); };
  }
  function cfgField(label, key, val, hint) {
    return '<div class="field" style="margin-bottom:12px"><label>' + label + '</label><input class="inp mono" id="cfg_' + key + '" type="number" value="' + val + '" />' + (hint ? '<span class="tiny faint">' + hint + '</span>' : '') + '</div>';
  }
  function renderCfgPre(c) {
    var pre = $('#cfgPre'); if (!pre) return;
    pre.textContent = ZL.configPy(c);
    var calc = $('#cfgCalc'); if (calc) {
      var perEx = Math.round(60000 / c.pollMs);
      var perMin = perEx * 2;                       // 거래소 2곳
      var over = perEx > c.reqBudgetPerMin;
      var worst = c.pollMs + ZL.OBSERVED_LATENCY.worstAssume;
      calc.innerHTML = '이 설정의 분당 요청 <b>거래소당 ' + perEx + '회 · 합계 ' + perMin + '회</b> (' +
        (over ? '<span style="color:var(--bad)">예산 초과·차단 위험</span>' : '<span style="color:var(--ok)">예산 이내</span>') +
        ') · 최악 감지 지연 <b>~' + worst + 'ms</b> (' + (worst <= 1000 ? '1초 이내 보장' : '1초 초과 가능') +
        ', 실측 응답 ~' + ZL.OBSERVED_LATENCY.worstAssume + 'ms 기준)<br>' +
        '<span class="tiny faint">주기는 마감시각 기준이라 응답 지연이 주기에 얹히지 않습니다(실측 ' +
        ZL.MEASURED.after.period.toFixed(3) + '초).</span>';
    }
  }

  /* =====================================================================
     수용 기준 검수 — 콘솔 상태와 연결
     ===================================================================== */
  function viewSpec() {
    var c = ZL.loadConfig();
    // 데모에서 실제로 검증한 결과(엔진 로직 기반) 요약
    var specs = [
      { k: '폴링 주기 1초 이하 유지 시 신규 공지 1초 이내 제목 출력',
        how: '마감시각 기준 대기라 응답 지연이 주기에 얹히지 않습니다. 20주기/10주기 차이로 측정한 정상 상태 주기 ' +
             ZL.MEASURED.after.period.toFixed(3) + '초(고치기 전 ' + ZL.MEASURED.before.period.toFixed(3) +
             '초). 최악 지연 = 주기 + 응답지연(실측 ~' + ZL.OBSERVED_LATENCY.worstAssume + 'ms).', ok: true },
      { k: '동일 공지가 두 번 이상 출력되지 않음',
        how: '공지 id 기준 seen-set으로 중복 제거(상한 5,000건으로 무중단 실행 시 메모리 증가 방지). 실행 로그의 2·3주기에 신규 출력 없음.', ok: true },
      { k: '네트워크 오류·응답 실패에도 종료되지 않고 다음 주기 복구',
        how: '요청 실패 → 지수 백오프(0.5→1→2→4s) 후 재시도, 성공 시 리셋. 예외는 거래소 단위로 격리.', ok: true },
      { k: '한 거래소가 응답하지 않아도 다른 거래소 감지 계속',
        how: '거래소마다 독립 스레드. 업비트를 타임아웃까지 매달리게 두고 측정한 빗썸 폴링 간격 ' +
             ZL.MEASURED.after.isolatedPeriod.toFixed(3) + '초(최대 1.010초). 순차 폴링이던 초안에서는 ' +
             ZL.MEASURED.before.isolatedPeriod.toFixed(2) + '초로 밀렸습니다.', ok: true }
    ];
    app.innerHTML =
      '<div class="reveal" style="margin-bottom:14px"><h2 style="font-size:22px">수용 기준 검수</h2>' +
      '<p class="muted small">공고의 수용 기준 4가지를 detector.py 실제 실행으로 확인했습니다. 근거는 <a href="./index.html" style="color:var(--accent)">실행 증거</a> 페이지의 실행 로그입니다.</p></div>' +
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
