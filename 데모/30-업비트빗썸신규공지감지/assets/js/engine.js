/* =====================================================================
   ZEROLAG 제로랙 — 업비트·빗썸 신규 공지 감지 엔진 (데모)
   engine.js : 순수·테스트 가능한 폴링/감지/중복제거/백오프 로직 + 설정
   ---------------------------------------------------------------------
   · 실제 납품물은 파이썬 스크립트. 이 JS는 그 로직을 브라우저에서 그대로
     재현해 "실구동"을 눈으로 보이게 하는 시뮬레이터입니다.
   · 코인 티커·공지는 전부 가상(시뮬레이션)입니다. 실제 상장 정보가 아닙니다.
   ===================================================================== */
(function (global) {
  'use strict';

  var EXCHANGES = ['UPBIT', 'BITHUMB'];
  var EX_LABEL = { UPBIT: '업비트', BITHUMB: '빗썸' };

  // 가상 티커(실존 코인 아님)
  var TICKERS = ['NOVA', 'AXIS', 'ZENITH', 'ORBIT', 'LUMEN', 'PIXL', 'QUARK', 'HELIX', 'VERTO', 'CRUX', 'MYTH', 'AERO', 'KILN', 'DRIFT', 'SOLIS'];
  var TEMPLATES = [
    { cat: '거래', w: 30, fmt: function (t) { return '[거래] ' + t + ' KRW 마켓 디지털 자산 추가'; } },
    { cat: '거래', w: 14, fmt: function (t) { return '[거래] ' + t + ' BTC·USDT 마켓 추가'; } },
    { cat: '입출금', w: 18, fmt: function (t) { return '[입출금] ' + t + ' 입출금 일시 중단 안내'; } },
    { cat: '입출금', w: 10, fmt: function (t) { return '[입출금] ' + t + ' 네트워크 업그레이드 지원 안내'; } },
    { cat: '이벤트', w: 12, fmt: function (t) { return '[이벤트] ' + t + ' 보유 이벤트 안내'; } },
    { cat: '유의', w: 8, fmt: function (t) { return '[유의] ' + t + ' 유의종목 지정 안내'; } },
    { cat: '점검', w: 8, fmt: function (t) { return '[점검] 시스템 정기 점검 안내'; } }
  ];

  /* ---------- 설정 ---------- */
  function defaultConfig() {
    return {
      pollMs: 800,            // 폴링 주기(ms) — 코드 수정 없이 조정 가능(요구사항)
      reqLatencyMin: 60,      // 모의 요청 지연 최소(ms)
      reqLatencyMax: 240,     // 모의 요청 지연 최대(ms)
      backoffBaseMs: 500,     // 재시도 백오프 기준
      backoffMaxMs: 8000,     // 백오프 상한
      reqBudgetPerMin: 60,    // 이용약관 안전 요청 예산(거래소당 분당)
      dedup: true,            // 공지 식별자 기준 중복 제거
      ambientFailRate: 0.0    // 무작위 요청 실패 확률(장애 주입과 별개)
    };
  }
  var CFG_KEY = 'zerolag_cfg_v1';
  function loadConfig() {
    var c; try { c = JSON.parse(localStorage.getItem(CFG_KEY)); } catch (e) { c = null; }
    return Object.assign(defaultConfig(), c || {});
  }
  function saveConfig(c) { localStorage.setItem(CFG_KEY, JSON.stringify(c)); }
  function resetConfig() { localStorage.removeItem(CFG_KEY); return defaultConfig(); }

  /* ---------- 상태 ---------- */
  function createState(config) {
    var st = {
      config: config || loadConfig(),
      feeds: { UPBIT: [], BITHUMB: [] },   // 발행된 공지(모의 서버)
      faults: { UPBIT: false, BITHUMB: false },
      ex: {}, log: [], detected: [],
      seq: 0,
      metrics: { requests: 0, failures: 0, detections: 0, within1s: 0, dupSuppressed: 0, dupEmitted: 0, startedAt: null }
    };
    EXCHANGES.forEach(function (e) {
      st.ex[e] = { seen: {}, seenCount: 0, failStreak: 0, backoffUntil: 0, lastPollAt: 0, lastLatency: 0, pollCount: 0, status: 'idle' };
    });
    return st;
  }

  function rand(a, b) { return Math.round(a + Math.random() * (b - a)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function wpick(arr) { var s = arr.reduce(function (a, x) { return a + x.w; }, 0), r = Math.random() * s; for (var i = 0; i < arr.length; i++) { r -= arr[i].w; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; }

  /* 공지 발행(모의 서버에 신규 공지 등록) */
  function addNotice(state, ex, now, opts) {
    opts = opts || {};
    var tpl = opts.template || wpick(TEMPLATES);
    var ticker = opts.ticker || pick(TICKERS);
    var id = ex + '-' + (++state.seq) + '-' + Math.random().toString(36).slice(2, 6);
    var n = { id: id, exchange: ex, cat: tpl.cat, title: tpl.fmt(ticker), publishedAt: (now == null ? Date.now() : now) };
    state.feeds[ex].unshift(n);
    if (state.feeds[ex].length > 60) state.feeds[ex].pop();
    return n;
  }

  function log(state, level, ex, msg, at) {
    state.log.unshift({ t: at == null ? Date.now() : at, level: level, ex: ex, msg: msg });
    if (state.log.length > 250) state.log.pop();
  }

  /* ---------- 폴링 1회 (핵심) ---------- */
  function poll(state, ex, now) {
    var s = state.ex[ex], cfg = state.config;
    if (now < s.backoffUntil) { s.status = 'backoff'; return { status: 'backoff', until: s.backoffUntil }; }

    state.metrics.requests++; s.pollCount++;
    if (state.metrics.startedAt == null) state.metrics.startedAt = now;

    // 요청 예산 초과 여부(분당) — 폴링 주기가 짧을수록 위험
    var perMin = Math.round(60000 / cfg.pollMs);
    var overBudget = perMin > cfg.reqBudgetPerMin;

    // 장애(주입) 또는 무작위 실패
    var fail = state.faults[ex] || (Math.random() < cfg.ambientFailRate);
    if (fail) {
      s.failStreak++; state.metrics.failures++; s.status = 'fail';
      if (s.failStreak <= cfg.maxRetries || true) {
        var back = Math.min(cfg.backoffBaseMs * Math.pow(2, s.failStreak - 1), cfg.backoffMaxMs);
        s.backoffUntil = now + back;
        log(state, 'warn', ex, '요청 실패(' + s.failStreak + '회) → ' + fmtSec(back) + ' 대기 후 재시도', now);
      }
      return { status: 'fail', streak: s.failStreak, overBudget: overBudget };
    }

    // 성공
    if (s.failStreak > 0) { log(state, 'ok', ex, '응답 복구 — 감지 재개 (실패 ' + s.failStreak + '회 후)', now); s.failStreak = 0; }
    s.status = 'ok';
    var reqLatency = rand(cfg.reqLatencyMin, cfg.reqLatencyMax);
    s.lastLatency = reqLatency; s.lastPollAt = now;

    var detections = [];
    // 오래된→최신 순으로 처리(발행 순서)
    var feed = state.feeds[ex].slice().sort(function (a, b) { return a.publishedAt - b.publishedAt; });
    feed.forEach(function (n) {
      if (n.publishedAt > now) return; // 아직 발행 전
      var seen = !!s.seen[n.id];
      if (cfg.dedup && seen) { state.metrics.dupSuppressed++; return; } // 중복 제거로 억제
      if (!seen) { s.seen[n.id] = true; s.seenCount++; }
      else state.metrics.dupEmitted++; // 중복 제거 OFF → 중복 출력
      var detectedAt = now + reqLatency;
      var latency = detectedAt - n.publishedAt;
      detections.push({ exchange: ex, id: n.id, title: n.title, cat: n.cat, publishedAt: n.publishedAt, detectedAt: detectedAt, latency: latency, within1s: latency <= 1000, dup: seen });
    });
    detections.forEach(function (d) {
      state.metrics.detections++;
      if (d.within1s) state.metrics.within1s++;
      state.detected.unshift(d);
      if (state.detected.length > 80) state.detected.pop();
      log(state, 'detect', ex, (d.dup ? '[중복] ' : '') + '신규 감지: ' + d.title + ' — 지연 ' + d.latency + 'ms ' + (d.within1s ? '✓1초이내' : '⚠1초초과'), d.detectedAt);
    });
    return { status: 'ok', detections: detections, latency: reqLatency, overBudget: overBudget };
  }

  /* 두 거래소 1틱(독립) */
  function tick(state, now) {
    now = now == null ? Date.now() : now;
    var res = {};
    EXCHANGES.forEach(function (e) { try { res[e] = poll(state, e, now); } catch (err) { res[e] = { status: 'error', error: String(err) }; } });
    return res;
  }

  function metrics(state) {
    var m = state.metrics;
    var avg = 0, cnt = 0;
    state.detected.forEach(function (d) { if (!d.dup) { avg += d.latency; cnt++; } });
    avg = cnt ? Math.round(avg / cnt) : 0;
    var uniqueDetections = m.detections - m.dupEmitted;
    return {
      requests: m.requests, failures: m.failures,
      detections: m.detections, uniqueDetections: uniqueDetections,
      within1s: m.within1s,
      within1sRate: m.detections ? m.within1s / m.detections : 0,
      dupSuppressed: m.dupSuppressed, dupEmitted: m.dupEmitted,
      avgLatency: avg,
      reqPerMin: Math.round(60000 / state.config.pollMs),
      overBudget: Math.round(60000 / state.config.pollMs) > state.config.reqBudgetPerMin,
      uptimeMs: m.startedAt ? Date.now() - m.startedAt : 0
    };
  }

  function fmtSec(ms) { return (ms / 1000).toFixed(ms % 1000 ? 1 : 0) + 's'; }

  /* ---------- 납품물: 파이썬 소스(admin 화면에 표시) ---------- */
  var PYTHON_SRC =
`# -*- coding: utf-8 -*-
"""
업비트·빗썸 신규 공지 감지 스크립트 (무중단 폴링)
- 외부 라이브러리 최소화(표준 라이브러리 urllib만 사용)
- 폴링 주기/재시도/백오프는 config.py 로 분리(코드 수정 없이 조정)
- 공지 식별자(id) 기준 중복 제거, 한 거래소 장애가 다른 거래소 감지를 막지 않음
"""
import json, time, urllib.request, urllib.error
from config import POLL_INTERVAL_SEC, REQUEST_TIMEOUT, BACKOFF_BASE, BACKOFF_MAX

UPBIT_URL   = "https://api-manager.upbit.com/api/v1/announcements?per_page=20&page=1"
BITHUMB_URL = "https://api.bithumb.com/v1/notices?count=20"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "notice-detector/1.0"})
    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as r:
        return json.loads(r.read().decode("utf-8"))

def extract(exchange, payload):
    """거래소별 응답을 (id, title) 목록으로 정규화. 스키마 변경 시 이 함수만 수정."""
    items = payload.get("data", payload) if isinstance(payload, dict) else payload
    out = []
    for it in items:
        nid = str(it.get("id") or it.get("seq") or it.get("title"))
        out.append((nid, it.get("title", "").strip()))
    return out

class ExchangeState:
    def __init__(self, name, url):
        self.name, self.url = name, url
        self.seen = set()          # 이미 처리한 공지 id
        self.fail_streak = 0
        self.next_ok_at = 0.0      # 백오프 종료 시각

def poll(state):
    now = time.monotonic()
    if now < state.next_ok_at:     # 백오프 중이면 이번 주기 건너뜀
        return
    try:
        rows = extract(state.name, fetch(state.url))
    except Exception as e:         # 네트워크 오류·응답 실패 → 종료하지 않고 백오프
        state.fail_streak += 1
        wait = min(BACKOFF_BASE * (2 ** (state.fail_streak - 1)), BACKOFF_MAX)
        state.next_ok_at = now + wait
        print(f"[{state.name}] 요청 실패({state.fail_streak}): {e} → {wait:.1f}s 후 재시도")
        return
    if state.fail_streak:
        print(f"[{state.name}] 응답 복구")
        state.fail_streak = 0
    is_first = not state.seen      # 최초 1회는 기존 공지를 출력하지 않고 기준선만 저장
    for nid, title in rows:
        if nid in state.seen:
            continue
        state.seen.add(nid)
        if not is_first:
            print(f"[{state.name}] 신규 공지: {title}")

def main():
    states = [ExchangeState("UPBIT", UPBIT_URL), ExchangeState("BITHUMB", BITHUMB_URL)]
    while True:                    # 무중단 루프
        for s in states:
            poll(s)                # 한 거래소 예외가 다른 거래소를 막지 않음
        time.sleep(POLL_INTERVAL_SEC)

if __name__ == "__main__":
    main()
`;

  var CONFIG_SRC =
`# config.py — 코드 수정 없이 조정 가능한 설정값
POLL_INTERVAL_SEC = 0.8   # 폴링 주기(초). 이용약관 요청 제한을 넘지 않도록 설정
REQUEST_TIMEOUT   = 3     # 요청 타임아웃(초)
BACKOFF_BASE      = 0.5   # 실패 시 백오프 기준(초)
BACKOFF_MAX       = 8     # 백오프 상한(초)
`;

  var REQ_SRC = `# requirements.txt\n# 외부 라이브러리 없음 — Python 3.8+ 표준 라이브러리(urllib)만 사용\n`;

  global.ZL = {
    EXCHANGES: EXCHANGES, EX_LABEL: EX_LABEL,
    defaultConfig: defaultConfig, loadConfig: loadConfig, saveConfig: saveConfig, resetConfig: resetConfig,
    createState: createState, addNotice: addNotice, poll: poll, tick: tick, metrics: metrics, log: log,
    fmtSec: fmtSec,
    PYTHON_SRC: PYTHON_SRC, CONFIG_SRC: CONFIG_SRC, REQ_SRC: REQ_SRC
  };
})(window);
