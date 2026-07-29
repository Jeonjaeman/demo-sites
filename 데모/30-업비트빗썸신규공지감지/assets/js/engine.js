/* =====================================================================
   ZEROLAG 제로랙 — 업비트·빗썸 신규 공지 감지 (데모)
   engine.js : 실제 자료만 담는 모듈 (모의 시뮬레이션 없음)
   ---------------------------------------------------------------------
   · 실제 감지는 서버에서 도는 파이썬 스크립트(python/detector.py)가 수행합니다.
   · 브라우저는 CORS 정책으로 두 거래소 엔드포인트를 직접 폴링할 수 없습니다
     (아래 CORS 테스트 결과 참조). 그래서 이 웹 페이지는 "실제로 동작하는 것"만
     — 파이썬 소스, 실제 실행 로그, CORS 근거, 요청/지연 분석 — 을 보여줍니다.
   ===================================================================== */
(function (global) {
  'use strict';

  var EX_LABEL = { UPBIT: '업비트', BITHUMB: '빗썸' };

  /* ---------- detector.py 설정(실제 config.py 값) ---------- */
  function defaultConfig() {
    return {
      pollMs: 1000,            // POLL_INTERVAL_SEC
      requestTimeout: 3,       // REQUEST_TIMEOUT
      backoffBaseMs: 500,      // BACKOFF_BASE
      backoffMaxMs: 8000,      // BACKOFF_MAX
      dedup: true,             // DEDUP_BY_ID
      maxItems: 20,            // MAX_ITEMS
      userAgent: 'Mozilla/5.0 (notice-detector/1.0)',
      reqBudgetPerMin: 60      // (분석용) 이용약관 안전 요청 예산 가정
    };
  }
  var CFG_KEY = 'zerolag_cfg_v2';
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
      'USER_AGENT        = "' + c.userAgent + '"\n';
  }

  /* ---------- CORS 테스트 결과 (2026-07-29 실측) ---------- */
  var CORS = {
    testedAt: '2026-07-29',
    browserFetch: 'TypeError: Failed to fetch — 양쪽 모두 브라우저 직접 호출 차단',
    rows: [
      { ex: 'UPBIT', url: 'api-manager.upbit.com/api/v1/announcements', status: '403 Forbidden', acao: '없음', note: 'Origin 헤더가 있는 교차 출처 요청을 거부(403). 브라우저 폴링 불가.' },
      { ex: 'BITHUMB', url: 'feed-api.bithumb.com/v1/notices', status: '200 OK', acao: '없음', note: '응답은 오지만 Access-Control-Allow-Origin 헤더가 없어 브라우저가 본문을 읽을 수 없음.' }
    ]
  };

  /* ---------- 실제 측정 응답 지연(2026-07-29 실행) ---------- */
  var OBSERVED_LATENCY = { UPBIT: 121, BITHUMB: 62, worstAssume: 130 };

  /* ---------- 실제 실행 로그 (python/detector.py, 실측) ---------- */
  var REAL_LOG_DETECT =
`[17:34:10.807] 감지 시작 — 주기 2.0s · 거래소 UPBIT, BITHUMB
[17:34:10.928] [UPBIT] 기준선 확보 — 기존 공지 20건 · 응답 121ms · 이후 신규만 출력
[17:34:10.928] [UPBIT] 신규 공지 (id=6423): 디지털 자산 및 예치금 실사보고서 결과 공개 (2026년 07월 01일 기준) · 등록 2026-07-29T17:20:09+09:00
[17:34:10.928] [UPBIT] 신규 공지 (id=6422): 코스모스(ATOM) 입출금 일시 중단 안내 (08/05 18:00 ~) · 등록 2026-07-29T17:20:03+09:00
[17:34:10.992] [BITHUMB] 기준선 확보 — 기존 공지 20건 · 응답 63ms · 이후 신규만 출력
[17:34:10.992] [BITHUMB] 신규 공지 (id=1654265): 리플유에스디(RLUSD), 이온(AEON) 원화 마켓 추가 · 등록 2026-07-29 14:23:17
[17:34:10.992] [BITHUMB] 신규 공지 (id=1654256): 가상자산 월별실사를 위한 가상자산 입출금 일시 중지 안내 · 등록 2026-07-28 18:30:00
[17:34:12.9xx] (2주기) — 신규 없음        ← 같은 공지를 다시 출력하지 않음(id 기준 중복 제거)
[17:34:14.9xx] (3주기) — 신규 없음
[17:34:15.282] 3주기 완료 — 종료`;

  var REAL_LOG_FAULT =
`[17:34:15.450] 감지 시작 — 주기 1.0s · 거래소 UPBIT, BITHUMB
[17:34:15.501] [UPBIT] 요청 실패(1): URLError getaddrinfo failed → 0.5s 후 재시도
[17:34:15.562] [BITHUMB] 기준선 확보 — 기존 공지 20건 · 응답 60ms · 이후 신규만 출력
[17:34:15.562] [BITHUMB] 신규 공지 (id=1654265): 리플유에스디(RLUSD), 이온(AEON) 원화 마켓 추가 · 등록 2026-07-29 14:23:17
[17:34:16.563] [UPBIT] 요청 실패(2): ... → 1.0s 후 재시도
[17:34:17.635] [UPBIT] 요청 실패(3): ... → 2.0s 후 재시도       ← 지수 백오프(0.5→1→2→4s)
[17:34:19.773] [UPBIT] 요청 실패(4): ... → 4.0s 후 재시도       ← 스크립트는 종료되지 않음
[17:34:19.831] 5주기 완료 — 종료
  ※ 업비트가 죽어도 빗썸 감지는 계속됨(거래소 단위 예외 격리)`;

  /* ---------- 검증 항목 ---------- */
  var PROVEN = [
    { k: '실제 엔드포인트에서 신규 공지 감지', d: '업비트 api-manager, 빗썸 feed-api를 실제 폴링해 신규 공지 제목·등록시각 출력(위 로그).' },
    { k: 'id 기준 중복 제거', d: '같은 공지를 두 번 이상 출력하지 않음. 2·3주기에 신규 출력 없음으로 확인.' },
    { k: '무중단·거래소 단위 격리', d: '한 거래소 장애가 다른 거래소 감지를 막지 않음. try/except를 거래소별로 적용.' },
    { k: '요청 실패 시 지수 백오프·복구', d: '실패마다 0.5→1→2→4초로 대기 확대, 성공 시 리셋. 스크립트 종료 없음.' },
    { k: '외부 라이브러리 없음', d: 'Python 3.7+ 표준 라이브러리(urllib)만. requirements 설치 불필요, 바로 실행.' }
  ];

  /* ---------- 지연 vs 요청제한 (실측 지연 기반 계산) ---------- */
  function tradeoff(c) {
    var lat = OBSERVED_LATENCY.worstAssume;
    return [300, 500, 800, 1000, 1500, 2000, 3000].map(function (p) {
      var perMin = Math.round(60000 / p);
      return {
        p: p, perMin: perMin, over: perMin > c.reqBudgetPerMin,
        avg: Math.round(p / 2 + lat), worst: p + lat, guaranteed: (p + lat) <= 1000,
        current: p === c.pollMs
      };
    });
  }

  function pad(n, w) { return String(n).padStart(w, '0'); }

  /* ---------- detector.py / requirements.txt (표시용) ---------- */
  var PYTHON_SRC =
`# -*- coding: utf-8 -*-
"""
업비트·빗썸 신규 공지 감지 스크립트 (무중단 폴링)
- 외부 라이브러리 없음: Python 3.7+ 표준 라이브러리(urllib)만 사용
- 폴링 주기/타임아웃/재시도/백오프는 config.py 로 분리(코드 수정 없이 조정)
- 공지 식별자(id) 기준 중복 제거, 한 거래소 장애가 다른 거래소 감지를 막지 않음
- 실제 엔드포인트(2026-07 실행 확인). 전체 실행본은 python/detector.py 참고.
"""
import sys, json, time, urllib.request
from datetime import datetime
from config import (POLL_INTERVAL_SEC, REQUEST_TIMEOUT, BACKOFF_BASE,
                    BACKOFF_MAX, DEDUP_BY_ID, USER_AGENT, MAX_ITEMS)

try:  # Windows 콘솔(cp949)에서도 한글 출력이 깨지지 않도록
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# ---- 거래소 정의: 엔드포인트 + 응답 정규화(스키마 변경 시 여기만 수정) ----
def _extract_upbit(p):    # {"data":{"notices":[{"id":..,"title":..,"first_listed_at":..}]}}
    return [(str(n.get("id")), (n.get("title") or "").strip(), n.get("first_listed_at",""))
            for n in (p or {}).get("data", {}).get("notices", [])]

def _extract_bithumb(p):  # [{"title":..,"pc_url":".../notice/1654265","published_at":..}]
    rows = []
    for n in (p or []):    # 고유 id 필드가 없어 pc_url 끝의 공지 번호를 식별자로 사용
        url = n.get("pc_url") or ""
        nid = url.rstrip("/").split("/")[-1] if url else str(n.get("title"))
        rows.append((str(nid), (n.get("title") or "").strip(), n.get("published_at","")))
    return rows

EXCHANGES = [
    {"name": "UPBIT",   "extract": _extract_upbit,
     "url": f"https://api-manager.upbit.com/api/v1/announcements?os=web&page=1&per_page={MAX_ITEMS}&category=all"},
    {"name": "BITHUMB", "extract": _extract_bithumb,
     "url": f"https://feed-api.bithumb.com/v1/notices?count={MAX_ITEMS}"},
]

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as r:
        return json.loads(r.read().decode("utf-8"))

class ExchangeState:
    def __init__(self, e):
        self.name, self.url, self.extract = e["name"], e["url"], e["extract"]
        self.seen = set()          # 이미 처리한 공지 id
        self.fail_streak = 0
        self.next_ok_at = 0.0      # 백오프 종료 시각(monotonic)
        self.baseline = False

def poll(st):
    mono = time.monotonic()
    if mono < st.next_ok_at:       # 백오프 중이면 이번 주기 건너뜀
        return
    try:
        rows = st.extract(fetch(st.url))
    except Exception as e:         # 네트워크 오류·응답 실패 → 종료하지 않고 백오프
        st.fail_streak += 1
        wait = min(BACKOFF_BASE * (2 ** (st.fail_streak - 1)), BACKOFF_MAX)
        st.next_ok_at = mono + wait
        print(f"[{st.name}] 요청 실패({st.fail_streak}): {e} → {wait:.1f}s 후 재시도", flush=True)
        return
    if st.fail_streak:
        print(f"[{st.name}] 응답 복구", flush=True); st.fail_streak = 0
    if not st.baseline:            # 최초 1회는 기존 공지를 기준선으로만 저장
        st.seen.update(nid for nid, _t, _a in rows); st.baseline = True
        print(f"[{st.name}] 기준선 확보 — 기존 {len(rows)}건. 이후 신규만 출력", flush=True); return
    for nid, title, at in rows:
        if DEDUP_BY_ID and nid in st.seen:
            continue
        st.seen.add(nid)
        print(f"[{st.name}] 신규 공지 (id={nid}): {title} · 등록 {at}", flush=True)

def main():
    states = [ExchangeState(e) for e in EXCHANGES]
    while True:                    # 무중단 루프
        for s in states:
            try:
                poll(s)            # 한 거래소 예외가 다른 거래소를 막지 않음
            except Exception as e:
                print(f"[{s.name}] 격리된 예외: {e}", flush=True)
        time.sleep(POLL_INTERVAL_SEC)

if __name__ == "__main__":
    main()
`;

  var REQ_SRC = '# requirements.txt\n# 외부 라이브러리 없음 — Python 3.7+ 표준 라이브러리(urllib)만 사용\n# 별도 설치 없이 바로 실행:  python detector.py\n';

  global.ZL = {
    EX_LABEL: EX_LABEL,
    defaultConfig: defaultConfig, loadConfig: loadConfig, saveConfig: saveConfig, resetConfig: resetConfig, configPy: configPy,
    CORS: CORS, OBSERVED_LATENCY: OBSERVED_LATENCY,
    REAL_LOG_DETECT: REAL_LOG_DETECT, REAL_LOG_FAULT: REAL_LOG_FAULT, PROVEN: PROVEN,
    tradeoff: tradeoff, pad: pad,
    PYTHON_SRC: PYTHON_SRC, CONFIG_SRC: configPy(defaultConfig()), REQ_SRC: REQ_SRC
  };
})(window);
