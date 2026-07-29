/* =====================================================================
   ZEROLAG 제로랙 — 실행 증거 페이지 (index.html)
   모의 시뮬레이션 없음. 실제로 동작하는 것만:
   실제 실행 로그 · 검증 항목 · CORS 근거 · 지연/요청 분석 · 파이썬 소스 링크
   ===================================================================== */
(function () {
  'use strict';
  var ZL = window.ZL;
  var cfg = ZL.loadConfig();

  function $(s, r) { return (r || document).querySelector(s); }
  function h(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  var app = $('#app');
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

  /* 리빌 + 폴백 + 재렌더 보장 */
  var io = null, revealTimer = null;
  try { io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .1 }); } catch (e) { io = null; }
  function wireReveal() {
    app.querySelectorAll('.reveal:not(.in)').forEach(function (n, i) { n.style.transitionDelay = (i % 6 * 50) + 'ms'; if (io) io.observe(n); });
    clearTimeout(revealTimer);
    revealTimer = setTimeout(function () { app.querySelectorAll('.reveal:not(.in)').forEach(function (n) { n.classList.add('in'); }); }, 450);
  }

  function view() {
    var t = ZL.tradeoff(cfg);
    app.innerHTML =
      /* 히어로 */
      '<section class="reveal" style="padding:26px 0 20px">' +
        '<span class="badge b-accent plain" style="font-size:12.5px">실제 실행 · 파이썬 스크립트 납품물</span>' +
        '<h1 style="font-size:clamp(26px,4.4vw,40px);letter-spacing:-.03em;line-height:1.15;margin:14px 0 12px">업비트·빗썸 신규 공지를<br><span style="color:var(--accent)">1초 안에</span> 잡는 감지 스크립트</h1>' +
        '<p class="muted" style="max-width:680px;font-size:15px">실제 감지는 서버에서 도는 파이썬 스크립트(<code style="color:var(--accent)">detector.py</code>)가 수행합니다. 아래는 <b>모의가 아니라 실제 거래소 엔드포인트를 폴링해 나온 실행 로그</b>입니다.</p>' +
        '<div class="center" style="gap:10px;margin-top:18px;flex-wrap:wrap">' +
          '<a class="btn pri lg" href="./admin.html#/code" target="_blank" rel="noopener">파이썬 소스 보기 →</a>' +
          '<a class="btn lg" href="https://jeonjaeman.github.io/demo-sites/데모/30-업비트빗썸신규공지감지/python/detector.py" target="_blank" rel="noopener">detector.py 원본 ↓</a>' +
        '</div>' +
      '</section>' +

      /* 왜 브라우저가 아니라 서버인가 (CORS) */
      '<section class="card reveal" style="margin-bottom:16px"><div class="card-h"><h3>왜 브라우저에서 직접 안 돌리나 — CORS 확인 (' + ZL.CORS.testedAt + ')</h3></div><div class="card-b">' +
        '<p class="muted small" style="margin-bottom:12px">두 거래소 공지 엔드포인트는 브라우저의 교차 출처(CORS) 요청을 허용하지 않습니다. 그래서 실시간 감지는 <b>서버에서 파이썬으로</b> 돌려야 합니다(공고도 “파이썬 스크립트를 발주사 서버에서 운영”이 전제). 아래는 실제 테스트 결과입니다.</p>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>거래소</th><th>엔드포인트</th><th>응답</th><th>ACAO 헤더</th><th>브라우저 fetch</th></tr></thead><tbody>' +
        ZL.CORS.rows.map(function (r) {
          return '<tr><td class="name" style="color:' + (r.ex === 'UPBIT' ? '#7db1ff' : '#ffb865') + '">' + ZL.EX_LABEL[r.ex] + '</td><td class="mono small">' + r.url + '</td>' +
            '<td><span class="badge ' + (r.status.indexOf('403') >= 0 ? 'b-bad' : 'b-warn') + ' small">' + r.status + '</span></td>' +
            '<td><span class="badge b-bad small">' + r.acao + '</span></td><td><span class="badge b-bad small">차단</span></td></tr>';
        }).join('') +
        '</tbody></table></div>' +
        '<div class="warn-box" style="margin-top:12px">브라우저 <code>fetch()</code> 실측: <b>' + esc(ZL.CORS.browserFetch) + '</b>. → 실시간 폴링은 detector.py(서버)가 담당합니다.</div>' +
      '</div></section>' +

      /* 실제 실행 로그 — 감지 + 중복 제거 */
      '<section class="card reveal" style="margin-bottom:16px"><div class="card-h"><h3>실제 실행 로그 ① — 신규 감지 · 중복 제거</h3><span class="small muted">python detector.py · 실제 엔드포인트</span></div>' +
        '<div class="card-b" style="padding:10px"><div class="logbox" style="height:auto;max-height:none"><pre style="margin:0;font-family:var(--mono);font-size:12px;line-height:1.7;color:#cdd6e6;white-space:pre-wrap">' + esc(ZL.REAL_LOG_DETECT) + '</pre></div></div></section>' +

      /* 검증 항목 */
      '<section class="reveal" style="margin-bottom:16px"><h3 style="font-size:16px;margin-bottom:10px">검증된 것 (실행으로 확인)</h3>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px" class="proven-grid">' +
        ZL.PROVEN.map(function (p) {
          return '<div class="card pad" style="display:flex;gap:10px;align-items:flex-start"><span class="badge b-ok plain" style="margin-top:2px">✓</span><div><b style="font-size:13.5px">' + p.k + '</b><div class="small muted" style="margin-top:3px">' + p.d + '</div></div></div>';
        }).join('') +
        '</div></section>' +

      /* 실제 실행 로그 — 장애 격리 */
      '<section class="card reveal" style="margin-bottom:16px"><div class="card-h"><h3>실제 실행 로그 ② — 장애 격리 · 지수 백오프</h3><span class="small muted">한 거래소 접속 불가 시</span></div>' +
        '<div class="card-b" style="padding:10px"><div class="logbox" style="height:auto;max-height:none"><pre style="margin:0;font-family:var(--mono);font-size:12px;line-height:1.7;color:#cdd6e6;white-space:pre-wrap">' + esc(ZL.REAL_LOG_FAULT) + '</pre></div></div></section>' +

      /* 지연 vs 요청제한 */
      '<section class="card reveal" style="margin-bottom:16px"><div class="card-h"><h3>지연 vs 요청 제한 — 핵심 트레이드오프</h3><span class="small muted">실측 응답 ~' + ZL.OBSERVED_LATENCY.worstAssume + 'ms 기준</span></div><div class="card-b">' +
        '<p class="muted small" style="margin-bottom:12px">“1초 이내”와 “요청 제한 준수”는 서로 당깁니다. 폴링을 촘촘히 하면 감지는 빨라지지만 분당 요청이 늘어 차단 위험이 커집니다. 아래 표는 실측 응답 지연을 기준으로 계산한 것입니다(가짜 데이터 아님).</p>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>폴링 주기</th><th class="right">분당 요청</th><th>요청 예산(' + cfg.reqBudgetPerMin + '/분)</th><th class="right">평균 지연</th><th class="right">최악 지연</th><th>1초 보장</th></tr></thead><tbody>' +
        t.map(function (r) {
          return '<tr' + (r.current ? ' style="background:var(--accent-l)"' : '') + '><td class="mono">' + r.p + 'ms' + (r.current ? ' <span class="badge b-accent small">현재</span>' : '') + '</td>' +
            '<td class="right mono">' + r.perMin + '회</td><td>' + (r.over ? '<span class="badge b-bad small">초과·위험</span>' : '<span class="badge b-ok small">이내</span>') + '</td>' +
            '<td class="right mono">~' + r.avg + 'ms</td><td class="right mono">~' + r.worst + 'ms</td>' +
            '<td>' + (r.guaranteed ? '<span class="badge b-ok small">가능</span>' : '<span class="badge b-warn small">초과 가능</span>') + '</td></tr>';
        }).join('') +
        '</tbody></table></div>' +
        '<div class="note-box" style="margin-top:12px">제안: 고정 주기 대신 <b>적응형 폴링</b>(평상시 여유 → 신규 감지 직후 짧게)과 요청 예산 가드로, 대부분의 공지를 1초 이내로 잡으면서 분당 요청을 안전 범위로 유지합니다. 폴링 주기·출력 형태는 <a href="./admin.html#/config" target="_blank" style="color:var(--accent)">설정</a>에서 조정합니다.</div>' +
      '</div></section>' +

      /* 납품물 안내 */
      '<section class="card pad reveal"><div class="between" style="flex-wrap:wrap;gap:12px"><div><b style="font-size:15px">납품물</b><div class="small muted" style="margin-top:4px">python/{detector.py · config.py · requirements.txt · README.md} — 표준 라이브러리만, <code>python detector.py</code>로 바로 실행</div></div>' +
        '<div class="center"><a class="btn" href="./admin.html#/code" target="_blank" rel="noopener">소스·설정·검수 ↗</a></div></div></section>';

    wireReveal();
  }

  /* 라우터(단일 페이지) */
  function router() {
    document.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#/proof'); });
    window.scrollTo(0, 0);
    view();
  }
  window.addEventListener('hashchange', router);
  router();
})();
