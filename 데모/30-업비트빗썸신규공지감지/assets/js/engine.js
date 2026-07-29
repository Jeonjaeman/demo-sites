/* =====================================================================
   ZEROLAG 제로랙 — 업비트·빗썸 신규 공지 감지 (데모)
   engine.js
   ---------------------------------------------------------------------
   이 페이지에서 "실제로 도는 것"과 "실제 실행을 재생하는 것"을 구분합니다.

   ① 라이브 감지 엔진 (LiveDetector)
      지금 이 브라우저에서 두 거래소의 공개 API를 실제로 폴링합니다.
      detector.py와 같은 로직 — 마감시각 기준 주기 · id 중복제거 · 지수 백오프 ·
      거래소별 독립 타이머. 응답시간·주기·성공률은 전부 실측값입니다.

   ② 서버 실행 로그 (SERVER_LOG)
      공지 엔드포인트는 CORS로 브라우저에서 못 읽습니다(하단 표는 실측).
      그래서 공지 감지는 서버의 detector.py가 하고, 그 실제 실행 출력을
      원래 시각 간격 그대로 재생합니다. 지어낸 문장이 아닙니다.
   ===================================================================== */
(function (global) {
  'use strict';

  var EX_LABEL = { UPBIT: '업비트', BITHUMB: '빗썸', BITHUMB2: '빗썸' };

  /* ---------- detector.py 설정(실제 config.py 값) ---------- */
  function defaultConfig() {
    return {
      pollMs: 1000,            // POLL_INTERVAL_SEC
      requestTimeout: 3,       // REQUEST_TIMEOUT
      backoffBaseMs: 500,      // BACKOFF_BASE
      backoffMaxMs: 8000,      // BACKOFF_MAX
      dedup: true,             // DEDUP_BY_ID
      maxItems: 20,            // MAX_ITEMS
      seenMax: 5000,           // SEEN_MAX
      userAgent: 'Mozilla/5.0 (notice-detector/1.0)',
      reqBudgetPerMin: 60      // (분석용) 이용약관 안전 요청 예산 가정
    };
  }
  var CFG_KEY = 'zerolag_cfg_v3';
  function loadConfig() {
    var c; try { c = JSON.parse(localStorage.getItem(CFG_KEY)); } catch (e) { c = null; }
    return Object.assign(defaultConfig(), c || {});
  }
  function saveConfig(c) { localStorage.setItem(CFG_KEY, JSON.stringify(c)); }
  function resetConfig() { localStorage.removeItem(CFG_KEY); return defaultConfig(); }

  function configPy(c) {
    return '# config.py (자동 생성)\n' +
      'POLL_INTERVAL_SEC = ' + (c.pollMs / 1000) + '\n' +
      'REQUEST_TIMEOUT   = ' + c.requestTimeout + '\n' +
      'BACKOFF_BASE      = ' + (c.backoffBaseMs / 1000) + '\n' +
      'BACKOFF_MAX       = ' + (c.backoffMaxMs / 1000) + '\n' +
      'DEDUP_BY_ID       = ' + (c.dedup ? 'True' : 'False') + '\n' +
      'MAX_ITEMS         = ' + c.maxItems + '\n' +
      'SEEN_MAX          = ' + c.seenMax + '\n' +
      'USER_AGENT        = "' + c.userAgent + '"\n';
  }

  /* ---------- CORS 실측 (2026-07-29) ---------- */
  var CORS = {
    testedAt: '2026-07-29',
    browserFetch: 'TypeError: Failed to fetch — 공지 엔드포인트는 양쪽 모두 브라우저 직접 호출 차단',
    rows: [
      { ex: 'UPBIT', kind: '공지', url: 'api-manager.upbit.com/api/v1/announcements',
        status: '403 Forbidden', acao: '없음', browser: '차단', ok: false },
      { ex: 'BITHUMB', kind: '공지', url: 'feed-api.bithumb.com/v1/notices',
        status: '200 OK', acao: '없음', browser: '차단', ok: false },
      { ex: 'UPBIT', kind: '공개 시세', url: 'api.upbit.com/v1/market/all',
        status: '200 OK', acao: '요청 도메인에 따라 다름', browser: 'localhost 100% / github.io 12회 중 1회', ok: false },
      { ex: 'BITHUMB', kind: '공개 시세', url: 'api.bithumb.com/public/ticker/ALL_KRW',
        status: '200 OK', acao: '있음', browser: '허용', ok: true }
    ]
  };

  /* ---------- 실제 측정 응답 지연 ---------- */
  var OBSERVED_LATENCY = { UPBIT: 120, BITHUMB: 116, worstAssume: 130 };

  /* ---------- 수정 전/후 실측 (공고 수용기준 대조) ---------- */
  var MEASURED = {
    before: { period: 1.118, isolatedPeriod: 4.05, note: 'sleep(주기)를 요청 뒤에 붙인 구조' },
    after:  { period: 1.002, isolatedPeriod: 1.000, note: '마감시각 기준 대기 + 거래소별 독립 스레드' },
    sample: '10주기/20주기 각각 실행해 (T20−T10)/10 으로 계산(종료 편향 제거)'
  };

  /* ---------- 서버 detector.py 실제 실행 로그 (재생용) ---------- */
  /* 첫 칼럼의 시각을 그대로 파싱해 원래 간격으로 재생합니다. */
  var SERVER_LOG_DETECT = [
    '[18:40:31.136] 감지 시작 — 주기 1.0s · 거래소별 독립 스레드 · UPBIT, BITHUMB',
    '[18:40:31.255] [BITHUMB] 기준선 확보 — 기존 공지 20건 · 응답 116ms · 이후 신규만 출력 (시연: 최신 2건 신규 취급)',
    '[18:40:31.255] [BITHUMB] 신규 공지 (id=1654250): 이온(AEON) 원화마켓 추가 기념 에어드랍 이벤트  · 등록 2026-07-29 18:00:00 · 응답 116ms',
    '[18:40:31.255] [BITHUMB] 신규 공지 (id=1654265): 리플유에스디(RLUSD), 이온(AEON) 원화 마켓 추가 (RLUSD 거래 오픈 오후 5시 30분 예정)  · 등록 2026-07-29 14:23:17 · 응답 116ms',
    '[18:40:31.258] [UPBIT] 기준선 확보 — 기존 공지 20건 · 응답 120ms · 이후 신규만 출력 (시연: 최신 2건 신규 취급)',
    '[18:40:31.258] [UPBIT] 신규 공지 (id=6423): 디지털 자산 및 예치금 실사보고서 결과 공개 (2026년 07월 01일 기준)  · 등록 2026-07-29T17:20:09+09:00 · 응답 120ms',
    '[18:40:31.258] [UPBIT] 신규 공지 (id=6422): 코스모스(ATOM) 입출금 일시 중단 안내 (08/05 18:00 ~)  · 등록 2026-07-29T17:20:03+09:00 · 응답 120ms',
    '[18:40:32.140] (2주기) — 신규 없음        ← 같은 공지를 다시 출력하지 않음(id 기준 중복 제거)',
    '[18:40:33.142] (3주기) — 신규 없음',
    '[18:40:34.187] 거래소별 4주기 완료 — 종료 (UPBIT 백오프 스킵 0회 · BITHUMB 백오프 스킵 0회)'
  ];

  var SERVER_LOG_FAULT = [
    '[18:40:45.893] 감지 시작 — 주기 1.0s · 거래소별 독립 스레드 · UPBIT, BITHUMB',
    '[18:40:46.015] [BITHUMB] 기준선 확보 — 기존 공지 20건 · 응답 120ms · 이후 신규만 출력',
    '[18:40:48.956] [UPBIT] 요청 실패(1): URLError: <urlopen error timed out> → 0.5s 후 재시도',
    '[18:40:52.916] [UPBIT] 요청 실패(2): URLError: <urlopen error timed out> → 1.0s 후 재시도',
    '[18:40:57.908] [UPBIT] 요청 실패(3): URLError: <urlopen error timed out> → 2.0s 후 재시도',
    '[18:40:59.903] 거래소별 6주기 완료 — 종료 (UPBIT 백오프 스킵 3회 · BITHUMB 백오프 스킵 0회)'
  ];

  /* 로그 첫 칼럼 [HH:MM:SS.mmm] → 첫 줄 기준 상대 ms */
  function logOffsets(lines) {
    var base = null;
    return lines.map(function (l) {
      var m = l.match(/^\[(\d\d):(\d\d):(\d\d)\.(\d{3})\]/);
      var ms = m ? ((+m[1] * 3600 + (+m[2]) * 60 + (+m[3])) * 1000 + (+m[4])) : null;
      if (ms !== null && base === null) base = ms;
      return { text: l, at: ms === null ? 0 : Math.max(0, ms - base) };
    });
  }

  /* ---------- 검증 항목 ---------- */
  var PROVEN = [
    { k: '폴링 주기 1초 유지 (수용기준)', d: '마감시각 기준 대기로 응답 지연이 주기에 얹히지 않음. 실측 1.002초(수정 전 1.118초).' },
    { k: '실제 엔드포인트에서 신규 공지 감지', d: '업비트 api-manager, 빗썸 feed-api를 실제 폴링해 공지 제목·등록시각 출력.' },
    { k: 'id 기준 중복 제거', d: '같은 공지를 두 번 이상 출력하지 않음. 2·3주기에 신규 출력 없음으로 확인.' },
    { k: '거래소 단위 격리 (독립 스레드)', d: '업비트가 타임아웃까지 멈춰도 빗썸 주기 1.000초 유지(간격 실측 최대 1.010초).' },
    { k: '요청 실패 시 지수 백오프·복구', d: '실패마다 0.5→1→2→4초로 대기 확대, 성공 시 리셋. 스크립트 종료 없음.' },
    { k: '외부 라이브러리 없음', d: 'Python 3.7+ 표준 라이브러리(urllib·threading)만. 설치 없이 바로 실행.' }
  ];

  /* ---------- 지연 vs 요청제한 ---------- */
  /* 주기가 설정값 그대로 지켜지므로 최악 지연 = 주기 + 응답지연 */
  function tradeoff(c) {
    var lat = OBSERVED_LATENCY.worstAssume;
    return [300, 500, 800, 1000, 1500, 2000, 3000].map(function (p) {
      var perMin = Math.round(60000 / p) * 2;   // 거래소 2곳 → 요청 2배
      return {
        p: p, perMin: perMin, over: perMin > c.reqBudgetPerMin * 2,
        avg: Math.round(p / 2 + lat), worst: p + lat, guaranteed: (p + lat) <= 1000,
        current: p === c.pollMs
      };
    });
  }

  function pad(n, w) { return String(n).padStart(w, '0'); }

  /* =====================================================================
     라이브 감지 엔진 — 브라우저에서 실제로 도는 폴링
     detector.py와 동일한 규칙:
       · 마감시각 기준 주기(응답 지연이 주기에 얹히지 않음)
       · 거래소별 독립 타이머(한쪽이 느려도 다른 쪽 주기 유지)
       · id 기준 중복 제거 + 상한 있는 seen
       · 실패 시 지수 백오프, 성공 시 리셋
     대상은 CORS가 열려 있는 공개 API입니다(공지 엔드포인트는 차단 — 위 표).
     ===================================================================== */
  /* ★ 공개 API의 CORS 허용은 '요청을 보내는 도메인'에 따라 다릅니다.
       업비트 공개 API는 localhost 에서는 열리지만 github.io 에서는 거부됩니다(실측).
       그래서 시작할 때 실제로 찔러 보고, 막힌 곳은 '브라우저 차단'으로 표시한 뒤
       폴링 대상에서 뺍니다 — 무한 재시도로 화면이 빨개지지 않도록. */
  var LIVE_SOURCES = [
    {
      name: 'UPBIT', label: '업비트',
      url: 'https://api.upbit.com/v1/market/all',
      what: '마켓 목록',
      extract: function (j) {
        return (j || []).filter(function (m) {
          return String(m.market || '').indexOf('KRW-') === 0;
        }).map(function (m) {
          return { id: m.market, title: (m.korean_name || m.market) + ' (' + m.market + ')' };
        });
      }
    },
    {
      name: 'BITHUMB', label: '빗썸',
      url: 'https://api.bithumb.com/public/ticker/ALL_KRW',
      what: '원화마켓 종목',
      extract: function (j) {
        var d = (j || {}).data || {};
        return Object.keys(d).filter(function (k) { return k !== 'date'; }).map(function (k) {
          return { id: 'KRW-' + k, title: k + ' (KRW-' + k + ')' };
        });
      }
    },
    {
      name: 'BITHUMB2', label: '빗썸', what: '입출금 상태',
      url: 'https://api.bithumb.com/public/assetsstatus/ALL',
      extract: function (j) {
        var d = (j || {}).data || {};
        return Object.keys(d).map(function (k) {
          var v = d[k] || {};
          return { id: k + ':' + v.deposit_status + v.withdrawal_status,
                   title: k + ' 입금' + (v.deposit_status ? '정상' : '중단') +
                          ' · 출금' + (v.withdrawal_status ? '정상' : '중단') };
        });
      }
    }
  ];

  function LiveDetector(opts) {
    this.opts = opts || {};
    this.intervalMs = this.opts.intervalMs || 1000;
    this.onLog = this.opts.onLog || function () {};
    this.onStat = this.opts.onStat || function () {};
    this.states = LIVE_SOURCES.map(function (s) {
      return {
        src: s, seen: new Map(), baseline: false, failStreak: 0, nextOkAt: 0,
        cycles: 0, ok: 0, fail: 0, skipped: 0, lastMs: 0, gaps: [], lastStart: 0,
        timer: null, stopped: true
      };
    });
    this.newCount = 0;
    this.startedAt = 0;
  }

  LiveDetector.prototype._now = function () {
    return (global.performance && performance.now) ? performance.now() : Date.now();
  };

  LiveDetector.prototype._stamp = function () {
    var d = new Date();
    return '[' + pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2) + ':' +
           pad(d.getSeconds(), 2) + '.' + pad(d.getMilliseconds(), 3) + ']';
  };

  LiveDetector.prototype._markSeen = function (st, id) {
    st.seen.set(id, 1);
    var cap = this.opts.seenMax || 5000;
    while (st.seen.size > cap) { st.seen.delete(st.seen.keys().next().value); }
  };

  LiveDetector.prototype._poll = function (st) {
    var self = this;
    var now = this._now();
    if (now < st.nextOkAt) { st.skipped++; return Promise.resolve(); }
    var t0 = now;
    st.cycles++;
    if (st.lastStart) st.gaps.push(t0 - st.lastStart);
    if (st.gaps.length > 30) st.gaps.shift();
    st.lastStart = t0;

    return fetch(st.src.url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (j) {
        st.lastMs = Math.round(self._now() - t0);
        if (st.failStreak) {
          self.onLog({ ex: st.src.name, kind: 'ok',
            text: self._stamp() + ' [' + st.src.name + '] 응답 복구 (실패 ' + st.failStreak + '회 후)' });
          st.failStreak = 0;
        }
        st.ok++;
        var rows = st.src.extract(j);

        if (!st.baseline) {
          rows.forEach(function (r) { self._markSeen(st, r.id); });
          var hold = self.opts.demoNew || 0;
          for (var i = 0; i < hold && i < rows.length; i++) st.seen.delete(rows[rows.length - 1 - i].id);
          st.baseline = true;
          self.onLog({ ex: st.src.name, kind: 'base',
            text: self._stamp() + ' [' + st.src.name + '] 기준선 확보 — ' + st.src.what + ' ' +
                  rows.length + '건 · 응답 ' + st.lastMs + 'ms · 이후 신규만 출력' });
        }

        rows.forEach(function (r) {
          if (st.seen.has(r.id)) return;
          self._markSeen(st, r.id);
          self.newCount++;
          self.onLog({ ex: st.src.name, kind: 'new',
            text: self._stamp() + ' [' + st.src.name + '] 신규 등록 (id=' + r.id + '): ' +
                  r.title + '  · 응답 ' + st.lastMs + 'ms' });
        });
      })
      .catch(function (e) {
        st.fail++;
        st.failStreak++;
        var msg = (e && e.message ? e.message : String(e));
        var fast = (self._now() - t0) < 200;
        var corsish = /Failed to fetch|NetworkError|load failed/i.test(msg);
        var tries = st.ok + st.fail;
        var rate = tries ? st.ok / tries : 0;

        /* 이 도메인에서 쓸 수 없는 소스는 폴링을 접고 사유를 밝힌다.
           ① 하드 차단  : 한 번도 성공 못 하고 즉시 실패가 2회 이상
           ② 사실상 불가 : 8회 이상 시도했는데 성공률이 1/3 미만
                          (업비트 공개 API는 github.io 에서 12회 중 1회만 성공 — 실측)
           무한 재시도로 화면이 빨개지는 것보다, 왜 서버가 필요한지 보여주는 게 낫다. */
        var hardBlock = (st.ok === 0 && fast && corsish && st.failStreak >= 2);
        var unreliable = (tries >= 8 && rate < 0.34);
        if (hardBlock || unreliable) {
          st.blocked = true;
          st.blockRate = rate;
          st.stopped = true;
          if (st.timer) { clearTimeout(st.timer); st.timer = null; }
          self.onLog({ ex: st.src.name, kind: 'blocked',
            text: self._stamp() + ' [' + st.src.name + '] 이 도메인(' + location.host + ')에서는 ' +
                  (hardBlock ? '브라우저가 차단합니다'
                             : '성공률 ' + Math.round(rate * 100) + '% (' + st.ok + '/' + tries + ') — 사실상 폴링 불가') +
                  ' → 서버 detector.py 담당으로 넘깁니다' });
          return;
        }
        var wait = Math.min((self.opts.backoffBaseMs || 500) * Math.pow(2, st.failStreak - 1),
                            self.opts.backoffMaxMs || 8000);
        st.nextOkAt = self._now() + wait;
        self.onLog({ ex: st.src.name, kind: 'fail',
          text: self._stamp() + ' [' + st.src.name + '] 요청 실패(' + st.failStreak + '): ' +
                msg + ' → ' + (wait / 1000).toFixed(1) + 's 후 재시도' });
      })
      .then(function () { self.onStat(self.stats()); });
  };

  /* 거래소별 독립 루프 — 마감시각 기준 */
  LiveDetector.prototype._loop = function (st, nextTick) {
    var self = this;
    if (st.stopped) return;
    this._poll(st).then(function () {
      if (st.stopped) return;
      nextTick += self.intervalMs;
      var delay = nextTick - self._now();
      if (delay < 0) {                       // 요청이 주기보다 오래 걸린 경우
        var missed = Math.floor(-delay / self.intervalMs) + 1;
        nextTick += missed * self.intervalMs;
        delay = nextTick - self._now();
      }
      st.timer = setTimeout(function () { self._loop(st, nextTick); }, Math.max(0, delay));
    });
  };

  LiveDetector.prototype.start = function () {
    var self = this;
    this.startedAt = Date.now();
    this.onLog({ ex: '', kind: 'sys',
      text: this._stamp() + ' 감지 시작 — 주기 ' + (this.intervalMs / 1000).toFixed(1) +
            's · 거래소별 독립 타이머 · ' + LIVE_SOURCES.map(function (s) { return s.name; }).join(', ') });
    this.states.forEach(function (st) {
      st.stopped = false;
      self._loop(st, self._now());
    });
  };

  LiveDetector.prototype.stop = function () {
    this.states.forEach(function (st) {
      st.stopped = true;
      if (st.timer) { clearTimeout(st.timer); st.timer = null; }
    });
  };

  LiveDetector.prototype.stats = function () {
    return this.states.map(function (st) {
      var g = st.gaps.filter(function (x) { return x > 0; });
      var avg = g.length ? g.reduce(function (a, b) { return a + b; }, 0) / g.length : 0;
      var worst = g.length ? Math.max.apply(null, g) : 0;
      return {
        ex: st.src.name, label: st.src.label, what: st.src.what,
        cycles: st.cycles, ok: st.ok, fail: st.fail, skipped: st.skipped,
        lastMs: st.lastMs, periodMs: Math.round(avg), worstMs: Math.round(worst),
        tracking: st.seen.size, down: st.failStreak > 0, blocked: !!st.blocked, blockRate: st.blockRate
      };
    });
  };

  /* 장애 주입 — 라이브 엔진에서도 격리를 직접 확인할 수 있게 */
  LiveDetector.prototype.breakExchange = function (name, on) {
    this.states.forEach(function (st) {
      if (st.src.name !== name) return;
      if (on) {
        if (!st._realUrl) st._realUrl = st.src.url;
        st.src = Object.assign({}, st.src, { url: 'https://unreachable-exchange.invalid/x' });
      } else if (st._realUrl) {
        st.src = Object.assign({}, st.src, { url: st._realUrl });
        st._realUrl = null;
        // failStreak 는 남겨 둔다 — 다음 성공 폴링이 "응답 복구" 로그를 남기고 리셋한다
        st.nextOkAt = 0;
      }
    });
  };

  var REQ_SRC = '# requirements.txt\n# 외부 라이브러리 없음 — Python 3.7+ 표준 라이브러리(urllib, threading)만 사용\n# 별도 설치 없이 바로 실행:  python detector.py\n';

  /* 납품물 목차 — 소스 본문은 계약 후 제공(잠금) */
  var DELIVERABLES = [
    { f: 'detector.py', lines: 224, d: '감지 엔진. 거래소별 독립 스레드 · 마감시각 기준 주기 · id 중복제거 · 지수 백오프 · 장애 주입 옵션(--break/--hang)' },
    { f: 'config.py', lines: 11, d: '폴링 주기·타임아웃·백오프·조회건수·seen 상한. 코드 수정 없이 조정' },
    { f: 'requirements.txt', lines: 2, d: '외부 라이브러리 없음(표준 라이브러리만)' },
    { f: 'README.md', lines: 84, d: '실행 방법·설정값·수용기준 대조표 (1페이지)' }
  ];

  global.ZL = {
    EX_LABEL: EX_LABEL,
    defaultConfig: defaultConfig, loadConfig: loadConfig, saveConfig: saveConfig,
    resetConfig: resetConfig, configPy: configPy,
    CORS: CORS, OBSERVED_LATENCY: OBSERVED_LATENCY, MEASURED: MEASURED,
    SERVER_LOG_DETECT: SERVER_LOG_DETECT, SERVER_LOG_FAULT: SERVER_LOG_FAULT,
    logOffsets: logOffsets,
    PROVEN: PROVEN, tradeoff: tradeoff, pad: pad,
    LiveDetector: LiveDetector, LIVE_SOURCES: LIVE_SOURCES,
    DELIVERABLES: DELIVERABLES,
    CONFIG_SRC: configPy(defaultConfig()), REQ_SRC: REQ_SRC,
    LOCKED: true            // 소스 본문 공개 여부 — 계약 시 해제
  };
})(window);
