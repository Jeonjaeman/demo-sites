/* =====================================================================
   ZEROLAG 제로랙 — 실행 증거 페이지 (index.html)
   ① 라이브 감지 엔진: 지금 이 브라우저에서 실제로 폴링합니다.
   ② 서버 실행 로그: detector.py 실제 출력을 원래 간격으로 재생합니다.
   소스 본문은 계약 시 공개(잠금).
   ===================================================================== */
(function () {
  'use strict';
  var ZL = window.ZL;
  var cfg = ZL.loadConfig();

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }
  var app = $('#app');

  /* ---------- 리빌 ---------- */
  var io = null, revealTimer = null;
  try {
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .1 });
  } catch (e) { io = null; }
  function wireReveal() {
    app.querySelectorAll('.reveal:not(.in)').forEach(function (n, i) {
      n.style.transitionDelay = (i % 6 * 50) + 'ms'; if (io) io.observe(n);
    });
    clearTimeout(revealTimer);
    revealTimer = setTimeout(function () {
      app.querySelectorAll('.reveal:not(.in)').forEach(function (n) { n.classList.add('in'); });
    }, 450);
  }

  function toast(msg) {
    var box = $('#toasts'); if (!box) return;
    var el = document.createElement('div');
    el.className = 'toast'; el.innerHTML = '<span class="dot"></span>' + esc(msg);
    box.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('in'); });
    setTimeout(function () { el.classList.add('in'); }, 30);   // rAF 미동작 환경 대비
    setTimeout(function () { el.style.opacity = '0'; }, 2400);
    setTimeout(function () { el.remove(); }, 2900);
  }

  /* ---------- 잠금 안내 ---------- */
  function lockNotice() {
    toast('소스 본문은 계약 후 전달드립니다');
  }

  var live = null, replayTimers = [], replayRunning = false;

  function view() {
    var t = ZL.tradeoff(cfg);
    var M = ZL.MEASURED;

    app.innerHTML =
      /* ── 히어로 ───────────────────────────────────────────── */
      '<section class="reveal" style="padding:26px 0 18px">' +
        '<span class="badge b-accent plain" style="font-size:12.5px">지금 이 화면에서 감지 엔진이 돌고 있습니다</span>' +
        '<h1 style="font-size:clamp(26px,4.4vw,40px);letter-spacing:-.03em;line-height:1.15;margin:14px 0 12px">' +
          '업비트·빗썸 신규 공지를<br><span style="color:var(--accent)">1초 안에</span> 잡는 감지 스크립트</h1>' +
        '<p class="muted" style="max-width:700px;font-size:15px">' +
          '아래 콘솔은 <b>실제 네트워크 요청을 보내고 있습니다.</b> 주기·응답시간·성공률은 전부 실측값입니다. ' +
          '공지 엔드포인트는 브라우저에서 읽을 수 없어(CORS·아래 표) <b>공지 감지는 서버의 <code style="color:var(--accent)">detector.py</code></b>가 맡고, ' +
          '그 실제 실행 출력을 원래 간격 그대로 재생합니다.</p>' +
        '<div class="center" style="gap:10px;margin-top:18px;flex-wrap:wrap">' +
          '<button class="btn pri lg" id="btnSrcLocked" style="opacity:.55;cursor:not-allowed">🔒 파이썬 소스 보기 — 계약 시 공개</button>' +
          '<a class="btn lg" href="./admin.html#/deliverables">납품물 구성 보기 →</a>' +
        '</div>' +
        '<p class="small muted" style="margin-top:10px">전체 소스는 계약 후 전달드립니다. 아래에서 <b>동작</b>은 그대로 확인하실 수 있습니다.</p>' +
      '</section>' +

      /* ── ① 라이브 감지 콘솔 ───────────────────────────────── */
      '<section class="card reveal" style="margin-bottom:16px;border-color:rgba(90,200,140,.35)">' +
        '<div class="card-h"><h3><span id="liveDot" class="live-dot"></span> 라이브 감지 엔진 — 지금 실행 중</h3>' +
          '<span class="small muted">브라우저에서 실제 폴링 · detector.py와 같은 로직</span></div>' +
        '<div class="card-b">' +
          '<div id="liveStat" class="stat-grid"></div>' +
          '<div class="center" style="gap:8px;margin:12px 0;flex-wrap:wrap">' +
            '<button class="btn sm" id="btnLiveToggle">일시정지</button>' +
            '<button class="btn sm" id="btnDemoNew">신규 등록 감지 시연</button>' +
            '<button class="btn sm" id="btnBreak">장애 주입</button>' +
            '<span class="small muted" id="liveHint">신규 항목이 나타나면 즉시 잡아 출력합니다</span>' +
          '</div>' +
          '<div class="logbox" id="liveLog" style="height:210px"></div>' +
          '<p class="small muted" style="margin-top:10px">' +
            '대상은 <b>CORS가 열려 있는 공개 API</b>(업비트 <code>market/all</code> · 빗썸 <code>ticker/ALL_KRW</code> · 빗썸 <code>assetsstatus/ALL</code>)입니다. ' +
            '공지 엔드포인트는 브라우저 차단이라 여기서 못 씁니다 — 감지 <b>로직</b>은 납품 코드와 동일합니다.<br>공개 API는 CORS가 열려 있어도 <b>Origin 단위 요청 제한</b>이 걸립니다(업비트: 분당 약 6회). 한도를 넘겨 실패가 이어지는 소스는 “요청 제한(429)”으로 표시하고 폴링에서 빼며, 그건 서버 detector.py 몫입니다.</p>' +
        '</div></section>' +

      /* ── ② 서버 공지 감지 로그 (재생) ─────────────────────── */
      '<section class="card reveal" style="margin-bottom:16px">' +
        '<div class="card-h"><h3>서버 공지 감지 — detector.py 실제 실행 재생</h3>' +
          '<span class="small muted">2026-07-29 실행 출력 · 원래 시각 간격 그대로</span></div>' +
        '<div class="card-b">' +
          '<div class="center" style="gap:8px;margin-bottom:10px;flex-wrap:wrap">' +
            '<button class="btn sm pri" id="btnReplay">▶ 재생</button>' +
            '<span class="small muted">신규 공지 4건 감지 → 2·3주기 재출력 없음(중복 제거)</span></div>' +
          '<div class="logbox" id="replayLog" style="height:190px"></div>' +
        '</div></section>' +

      /* ── 수정 전/후 실측 ──────────────────────────────────── */
      '<section class="card reveal" style="margin-bottom:16px">' +
        '<div class="card-h"><h3>공고 수용기준 — “폴링 주기 1초 이하” 실측 대조</h3>' +
          '<span class="small muted">' + esc(M.sample) + '</span></div><div class="card-b">' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>항목</th><th class="right">수정 전</th><th class="right">수정 후</th><th>비고</th></tr></thead><tbody>' +
          '<tr><td>정상 상태 폴링 주기</td><td class="right mono" style="color:var(--bad)">' + M.before.period.toFixed(3) + 's</td>' +
            '<td class="right mono" style="color:var(--ok)">' + M.after.period.toFixed(3) + 's</td>' +
            '<td class="small muted">sleep(주기)를 요청 뒤에 두면 <b>주기+응답지연</b>이 된다</td></tr>' +
          '<tr><td>한 거래소 타임아웃 시<br>다른 거래소 주기</td><td class="right mono" style="color:var(--bad)">' + M.before.isolatedPeriod.toFixed(3) + 's</td>' +
            '<td class="right mono" style="color:var(--ok)">' + M.after.isolatedPeriod.toFixed(3) + 's</td>' +
            '<td class="small muted">순차 폴링 → <b>거래소별 독립 스레드</b></td></tr>' +
        '</tbody></table></div>' +
        '<div class="note-box" style="margin-top:12px">고친 방식: 다음 폴링 <b>마감 시각</b>을 미리 정해 남은 시간만 대기하고, 거래소마다 <b>독립 스레드</b>로 돌립니다. 두 줄 바꿔서 수용기준을 맞췄습니다.</div>' +
      '</div></section>' +

      /* ── CORS 근거 ────────────────────────────────────────── */
      '<section class="card reveal" style="margin-bottom:16px"><div class="card-h">' +
        '<h3>왜 공지는 서버에서 돌려야 하나 — CORS 실측 (' + ZL.CORS.testedAt + ')</h3></div><div class="card-b">' +
        '<p class="muted small" style="margin-bottom:12px">' +
          'Origin 헤더만 바꿔 가며 응답 헤더를 직접 확인했습니다(<code>' + ZL.CORS.origins.join('</code> · <code>') + '</code>). ' +
          '<b>공지 엔드포인트는 어느 도메인에서도 403</b>입니다 — 도메인을 옮겨도 달라지지 않습니다. ' +
          '공개 시세 API는 CORS가 전면 허용(<code>*</code>)이지만 <b>Origin 단위 요청 제한</b>에 걸립니다(아래 표).</p>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>거래소</th><th>종류</th><th>엔드포인트</th><th>응답</th><th>ACAO</th><th>요청 제한</th><th>브라우저</th></tr></thead><tbody>' +
        ZL.CORS.rows.map(function (r) {
          return '<tr><td class="name" style="color:' + (r.ex === 'UPBIT' ? '#7db1ff' : '#ffb865') + '">' + ZL.EX_LABEL[r.ex] + '</td>' +
            '<td class="small">' + r.kind + '</td><td class="mono small">' + r.url + '</td>' +
            '<td><span class="badge ' + (r.status.indexOf('403') >= 0 ? 'b-bad' : r.status.indexOf('429') >= 0 ? 'b-warn' : 'b-ok') + ' small">' + r.status + '</span></td>' +
            '<td><span class="badge ' + (r.acao === '없음' ? 'b-bad' : 'b-ok') + ' small">' + r.acao + '</span></td>' +
            '<td class="small mono">' + r.limit + '</td>' +
            '<td><span class="badge ' + (r.ok ? 'b-ok' : r.browser === '제한' ? 'b-warn' : 'b-bad') + ' small">' + r.browser + '</span></td></tr>' +
            '<tr><td colspan="7" class="tiny faint" style="padding-top:0;border-top:0">↳ ' + r.note + '</td></tr>';
        }).join('') +
        '</tbody></table></div>' +
        '<div class="warn-box" style="margin-top:12px">공지 엔드포인트 브라우저 <code>fetch()</code> 실측: <b>' + esc(ZL.CORS.browserFetch) + '</b> → 실시간 공지 폴링은 detector.py(서버)가 담당합니다. 공고의 “발주사 서버에서 운영”과 같은 전제입니다.</div>' +
      '</div></section>' +

      /* ── 업비트 요청 제한 실측 ────────────────────────────── */
      '<section class="card reveal" style="margin-bottom:16px"><div class="card-h">' +
        '<h3>업비트 요청 제한 — 헤더로 확인한 실측</h3>' +
        '<span class="small muted">' + esc(ZL.RATE_LIMIT.note) + '</span></div><div class="card-b">' +
        '<p class="muted small" style="margin-bottom:10px">공고 비기능 요구의 “거래소 요청 제한을 넘지 않는 폴링 주기”는 추정이 아니라 <b>응답 헤더로 확인됩니다</b>.</p>' +
        '<pre class="mono" style="margin:0 0 12px;padding:11px 13px;background:#080b12;border:1px solid var(--line);border-radius:10px;font-size:12px;color:#9fe8c8;overflow:auto">' +
          esc(ZL.RATE_LIMIT.header) + '</pre>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>폴링 주기</th><th class="right">분당 요청</th><th class="right">성공</th><th class="right">성공률</th><th>판정</th></tr></thead><tbody>' +
        ZL.RATE_LIMIT.rows.map(function (r) {
          var pct = Math.round(r.ok / r.n * 100);
          return '<tr><td class="mono">' + r.interval + '초</td>' +
            '<td class="right mono">' + Math.round(60 / r.interval) + '회</td>' +
            '<td class="right mono">' + r.ok + '/' + r.n + '</td>' +
            '<td class="right mono">' + pct + '%</td>' +
            '<td><span class="badge ' + (pct === 100 ? 'b-ok' : pct >= 50 ? 'b-warn' : 'b-bad') + ' small">' +
              (pct === 100 ? '안정' : pct >= 50 ? '절반 차단' : '대부분 차단') + '</span></td></tr>';
        }).join('') +
        '</tbody></table></div>' +
        '<div class="warn-box" style="margin-top:12px">' + ZL.RATE_LIMIT.conclusion + '</div>' +
        '<div class="note-box" style="margin-top:10px">' + ZL.RATE_LIMIT.server + '</div>' +
      '</div></section>' +

      /* ── 검증 항목 ────────────────────────────────────────── */
      '<section class="reveal" style="margin-bottom:16px"><h3 style="font-size:16px;margin-bottom:10px">실행으로 확인한 것</h3>' +
        '<div class="proven-grid">' +
        ZL.PROVEN.map(function (p) {
          return '<div class="card pad" style="display:flex;gap:10px;align-items:flex-start">' +
            '<span class="badge b-ok plain" style="margin-top:2px">✓</span>' +
            '<div><b style="font-size:13.5px">' + p.k + '</b><div class="small muted" style="margin-top:3px">' + p.d + '</div></div></div>';
        }).join('') + '</div></section>' +

      /* ── 장애 격리 로그 ───────────────────────────────────── */
      '<section class="card reveal" style="margin-bottom:16px"><div class="card-h">' +
        '<h3>장애 격리 — 업비트가 “응답 없음”일 때</h3><span class="small muted">--hang 주입 · 실제 실행</span></div>' +
        '<div class="card-b" style="padding:10px"><div class="logbox" style="height:auto;max-height:none">' +
        '<pre style="margin:0;font-family:var(--mono);font-size:12px;line-height:1.7;color:#cdd6e6;white-space:pre-wrap">' +
        esc(ZL.SERVER_LOG_FAULT.join('\n')) + '</pre></div>' +
        '<div class="note-box" style="margin:10px">업비트가 타임아웃(3초)까지 매달려도 <b>빗썸 폴링 간격은 1.000초로 유지</b>됩니다(간격 실측 최대 1.010초). 독립 스레드라 서로 기다리지 않습니다.</div>' +
        '</div></section>' +

      /* ── 지연 vs 요청제한 ─────────────────────────────────── */
      '<section class="card reveal" style="margin-bottom:16px"><div class="card-h">' +
        '<h3>지연 vs 요청 제한 — 핵심 트레이드오프</h3>' +
        '<span class="small muted">실측 응답 ~' + ZL.OBSERVED_LATENCY.worstAssume + 'ms 기준</span></div><div class="card-b">' +
        '<p class="muted small" style="margin-bottom:12px">주기가 설정값 그대로 지켜지므로 <b>최악 지연 = 주기 + 응답지연</b>입니다. 촘촘히 할수록 빨라지지만 분당 요청이 늘어 차단 위험이 커집니다(거래소 2곳이라 요청은 2배).</p>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>폴링 주기</th><th class="right">분당 요청</th><th>요청 예산(' + (cfg.reqBudgetPerMin * 2) + '/분)</th><th class="right">평균 지연</th><th class="right">최악 지연</th><th>1초 보장</th></tr></thead><tbody>' +
        t.map(function (r) {
          return '<tr' + (r.current ? ' style="background:var(--accent-l)"' : '') + '>' +
            '<td class="mono">' + r.p + 'ms' + (r.current ? ' <span class="badge b-accent small">현재</span>' : '') + '</td>' +
            '<td class="right mono">' + r.perMin + '회</td>' +
            '<td>' + (r.over ? '<span class="badge b-bad small">초과·위험</span>' : '<span class="badge b-ok small">이내</span>') + '</td>' +
            '<td class="right mono">~' + r.avg + 'ms</td><td class="right mono">~' + r.worst + 'ms</td>' +
            '<td>' + (r.guaranteed ? '<span class="badge b-ok small">가능</span>' : '<span class="badge b-warn small">초과 가능</span>') + '</td></tr>';
        }).join('') +
        '</tbody></table></div>' +
        '<div class="note-box" style="margin-top:12px">제안: 고정 주기 대신 <b>적응형 폴링</b>(평상시 여유 → 신규 감지 직후 짧게)과 요청 예산 가드로, 대부분의 공지를 1초 이내로 잡으면서 분당 요청을 안전 범위로 유지합니다.</div>' +
      '</div></section>' +

      /* ── 납품물 (잠금) ────────────────────────────────────── */
      '<section class="card reveal"><div class="card-h"><h3>🔒 납품물 — 계약 시 전달</h3>' +
        '<span class="small muted">구성과 분량은 아래에 공개</span></div><div class="card-b">' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>파일</th><th class="right">줄 수</th><th>내용</th></tr></thead><tbody>' +
        ZL.DELIVERABLES.map(function (d) {
          return '<tr><td class="mono">python/' + d.f + '</td><td class="right mono">' + d.lines + '</td><td class="small muted">' + d.d + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<div class="warn-box" style="margin-top:12px">지금 보시는 <b>동작·실측치·설계 판단</b>은 전부 공개돼 있습니다. <b>소스 본문만</b> 계약 후 전달드립니다 — 계약과 동시에 이 버튼이 열립니다.</div>' +
        '<div class="center" style="margin-top:12px"><button class="btn pri" id="btnSrcLocked2" style="opacity:.55;cursor:not-allowed">🔒 전체 소스 — 계약 시 공개</button></div>' +
      '</div></section>';

    wireReveal();
    mountLive();
    wireReplay();
  }

  /* ===================== 라이브 엔진 ===================== */
  function logLine(box, o) {
    var color = o.kind === 'new' ? 'var(--ok)' :
                o.kind === 'fail' ? 'var(--bad)' :
                o.kind === 'blocked' ? 'var(--warn)' :
                o.kind === 'base' ? '#9fb4d4' : '#cdd6e6';
    var el = document.createElement('div');
    el.style.cssText = 'font-family:var(--mono);font-size:12px;line-height:1.75;color:' + color +
                       ';white-space:pre-wrap;word-break:break-all';
    if (o.kind === 'new') el.style.fontWeight = '700';
    el.textContent = o.text;
    box.appendChild(el);
    while (box.childElementCount > 200) box.removeChild(box.firstChild);
    box.scrollTop = box.scrollHeight;
  }

  function renderStat(rows) {
    var box = $('#liveStat'); if (!box) return;
    box.innerHTML = rows.map(function (s) {
      var badge = s.blocked ? ' <span class="badge b-warn small">요청 제한(429)</span>'
                : s.down ? ' <span class="badge b-bad small">장애</span>'
                : ' <span class="badge b-ok small">정상</span>';
      var body = s.blocked
        ? '<div class="stat-v mono" style="font-size:15px;color:var(--warn)">서버 담당</div>' +
          '<div class="stat-d small muted">1초 폴링이 이 API의 <b>Origin 단위 한도(분당 약 6회)</b>를 넘어 429가 돌아옵니다' +
          (typeof s.blockTries === 'number'
            ? ' (이 세션 성공 ' + Math.round((s.blockRate || 0) * s.blockTries) + '/' + s.blockTries + '회)'
            : '') + '. ' +
          '429 응답에는 ACAO 헤더가 없어 브라우저에는 CORS 오류로 보입니다. <b>detector.py(서버)</b>는 Origin 헤더를 보내지 않아 영향받지 않습니다.</div>'
        : '<div class="stat-v mono">' + (s.periodMs ? (s.periodMs / 1000).toFixed(3) + 's' : '—') + '</div>' +
          '<div class="stat-d small muted">실측 주기 · 응답 ' + (s.lastMs || 0) + 'ms · ' +
          s.cycles + '회 폴링(성공 ' + s.ok + ' / 실패 ' + s.fail + ') · 추적 ' + s.tracking + '건</div>';
      return '<div class="stat"' + (s.blocked ? ' style="opacity:.72"' : '') + '>' +
        '<div class="stat-k">' + s.label + ' <span class="small muted">' + s.what + '</span>' + badge + '</div>' +
        body + '</div>';
    }).join('');
  }

  function mountLive() {
    var box = $('#liveLog'); if (!box) return;
    if (live) live.stop();
    live = new ZL.LiveDetector({
      intervalMs: cfg.pollMs,
      backoffBaseMs: cfg.backoffBaseMs,
      backoffMaxMs: cfg.backoffMaxMs,
      seenMax: cfg.seenMax,
      onLog: function (o) { logLine(box, o); },
      onStat: renderStat
    });
    live.start();

    var paused = false;
    $('#btnLiveToggle').addEventListener('click', function () {
      paused = !paused;
      if (paused) { live.stop(); this.textContent = '재개'; $('#liveDot').classList.add('off'); }
      else { live.start(); this.textContent = '일시정지'; $('#liveDot').classList.remove('off'); }
    });

    $('#btnDemoNew').addEventListener('click', function () {
      // 실제 응답에서 받은 진짜 id 중 마지막 2건을 미확인 처리 → 다음 주기에 신규로 잡힘
      var n = 0;
      live.states.forEach(function (st) {
        var ids = Array.from(st.seen.keys());
        for (var i = 0; i < 2 && ids.length; i++) { st.seen.delete(ids[ids.length - 1 - i]); n++; }
      });
      $('#liveHint').textContent = n + '건을 미확인으로 되돌렸습니다 — 다음 주기에 신규로 잡힙니다';
      toast('실제 응답의 id ' + n + '건을 신규 취급 — 감지 경로 시연');
    });

    /* 장애 주입 대상은 '이 도메인에서 실제로 돌고 있는' 소스 중 첫 번째로 잡는다.
       업비트가 CORS로 막힌 환경에서는 그쪽에 주입해도 보여줄 게 없기 때문. */
    var broken = false, target = null, targetLabel = '';
    $('#btnBreak').addEventListener('click', function () {
      if (!target) {
        var alive = live.states.filter(function (st) { return !st.blocked && st.ok > 0; });
        var other = alive.length > 1 ? alive[1] : null;
        if (!alive.length) { toast('폴링 중인 소스가 없습니다'); return; }
        target = alive[0];
        targetLabel = target.src.label + ' ' + target.src.what;
        if (!other) { toast('비교할 다른 소스가 없어 격리 효과가 안 보일 수 있습니다'); }
      }
      broken = !broken;
      live.breakExchange(target.src.name, broken);
      this.textContent = broken ? targetLabel + ' 복구' : '장애 주입';
      $('#liveHint').textContent = broken
        ? targetLabel + '를 접속 불가로 바꿨습니다 — 다른 소스의 주기가 유지되는지 보세요'
        : '신규 항목이 나타나면 즉시 잡아 출력합니다';
      toast(broken ? targetLabel + ' 장애 주입 — 나머지는 계속 돕니다' : targetLabel + ' 복구');
    });

    [$('#btnSrcLocked'), $('#btnSrcLocked2')].forEach(function (b) {
      if (b) b.addEventListener('click', lockNotice);
    });
  }

  /* ===================== 서버 로그 재생 ===================== */
  function wireReplay() {
    var btn = $('#btnReplay'), box = $('#replayLog');
    if (!btn || !box) return;
    var lines = ZL.logOffsets(ZL.SERVER_LOG_DETECT);

    function play() {
      replayTimers.forEach(clearTimeout); replayTimers = [];
      box.innerHTML = ''; replayRunning = true;
      btn.textContent = '재생 중…'; btn.disabled = true;
      lines.forEach(function (l) {
        replayTimers.push(setTimeout(function () {
          logLine(box, { kind: /신규 공지/.test(l.text) ? 'new' : /실패/.test(l.text) ? 'fail' : 'sys', text: l.text });
        }, l.at));
      });
      var end = lines[lines.length - 1].at + 400;
      replayTimers.push(setTimeout(function () {
        replayRunning = false; btn.textContent = '↻ 다시 재생'; btn.disabled = false;
      }, end));
    }
    btn.addEventListener('click', play);
    setTimeout(play, 600);   // 진입 시 한 번 자동 재생
  }

  /* ---------- 라우터 ---------- */
  function router() {
    document.querySelectorAll('#nav a').forEach(function (a) {
      a.classList.toggle('on', a.getAttribute('href') === '#/proof');
    });
    window.scrollTo(0, 0);
    view();
  }
  window.addEventListener('hashchange', router);
  window.addEventListener('beforeunload', function () { if (live) live.stop(); });
  router();
})();
