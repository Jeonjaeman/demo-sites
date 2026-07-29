# -*- coding: utf-8 -*-
"""
업비트·빗썸 신규 공지 감지 스크립트 (무중단 폴링)

- 외부 라이브러리 없음: Python 3.7+ 표준 라이브러리(urllib, threading)만 사용
- 폴링 주기/타임아웃/재시도/백오프는 config.py 로 분리(코드 수정 없이 조정)
- 공지 식별자(id) 기준 중복 제거
- ★ 거래소마다 독립 스레드로 폴링합니다.
    한 거래소가 타임아웃까지 매달려도 다른 거래소의 폴링 주기는 영향을 받지 않습니다.
- ★ 폴링 주기는 '마감 시각' 기준입니다.
    sleep(주기)를 요청 뒤에 붙이면 실제 주기 = 주기 + 응답지연 이 되어 1초를 넘깁니다.
    다음 폴링 시각을 미리 정해 두고 남은 시간만 대기하므로 설정값이 그대로 지켜집니다.

- 실제 엔드포인트(2026-07 확인):
    UPBIT   : https://api-manager.upbit.com/api/v1/announcements  (data.notices[])
    BITHUMB : https://feed-api.bithumb.com/v1/notices             (최상위 배열)

실행:
    python detector.py                 # 무중단 실시간 감지(운영)
    python detector.py --cycles 3      # 거래소별 3주기만 돌고 종료(테스트)
    python detector.py --interval 1.0  # 폴링 주기 덮어쓰기
    python detector.py --demo-new 2    # 첫 주기에 최신 2건을 '신규'로 취급(감지 경로 시연)
    python detector.py --break UPBIT   # (테스트) 즉시 실패 장애 주입
    python detector.py --hang UPBIT    # (테스트) 응답 없음(타임아웃) 장애 주입
"""
import sys, json, time, threading, urllib.request, urllib.error
from collections import OrderedDict
from datetime import datetime

# Windows 콘솔(cp949 등)에서도 한글 출력이 깨지지 않도록 UTF-8로 재설정
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

from config import (POLL_INTERVAL_SEC, REQUEST_TIMEOUT, BACKOFF_BASE,
                    BACKOFF_MAX, DEDUP_BY_ID, USER_AGENT, MAX_ITEMS, SEEN_MAX)

# ---------------------------------------------------------------------------
# 출력 직렬화 — 거래소 스레드가 동시에 출력해도 줄이 섞이지 않게 한다
# ---------------------------------------------------------------------------
_out_lock = threading.Lock()

def log(msg):
    with _out_lock:
        print(msg, flush=True)

def now_str():
    return datetime.now().strftime("%H:%M:%S.%f")[:-3]

# ---------------------------------------------------------------------------
# 거래소 정의: 엔드포인트와 응답 정규화 함수(스키마 변경 시 여기만 수정)
# ---------------------------------------------------------------------------
def _extract_upbit(payload):
    """Upbit: {"success":true,"data":{"notices":[{"id":..,"title":..,"first_listed_at":..}]}}"""
    notices = (payload or {}).get("data", {}).get("notices", [])
    rows = []
    for n in notices:
        nid = str(n.get("id") or n.get("uuid") or n.get("title"))
        rows.append((nid, (n.get("title") or "").strip(),
                     n.get("first_listed_at") or n.get("listed_at") or ""))
    return rows

def _extract_bithumb(payload):
    """Bithumb: [{"title":..,"pc_url":"https://feed.bithumb.com/notice/1654265","published_at":..}]
       고유 id 필드가 없어 pc_url 끝의 공지 번호를 식별자로 사용."""
    rows = []
    for n in (payload or []):
        url = n.get("pc_url") or ""
        nid = url.rstrip("/").split("/")[-1] if url else str(n.get("title"))
        rows.append((str(nid), (n.get("title") or "").strip(), n.get("published_at") or ""))
    return rows

EXCHANGES = [
    {"name": "UPBIT",
     "url": "https://api-manager.upbit.com/api/v1/announcements"
            "?os=web&page=1&per_page={n}&category=all".format(n=MAX_ITEMS),
     "extract": _extract_upbit},
    {"name": "BITHUMB",
     "url": "https://feed-api.bithumb.com/v1/notices?count={n}".format(n=MAX_ITEMS),
     "extract": _extract_bithumb},
]

# ---------------------------------------------------------------------------
def fetch(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as r:
        return json.loads(r.read().decode("utf-8"))

class ExchangeState:
    def __init__(self, name, url, extract):
        self.name, self.url, self.extract = name, url, extract
        # 무중단 실행에서 메모리가 무한정 늘지 않도록 오래된 id부터 버리는 유한 집합
        self.seen = OrderedDict()
        self.fail_streak = 0
        self.next_ok_at = 0.0    # 백오프 종료 시각(monotonic)
        self.baseline = False    # 첫 조회로 기준선을 잡았는지
        self.cycles = 0
        self.skipped = 0         # 백오프로 건너뛴 주기 수

    def mark_seen(self, nid):
        self.seen[nid] = None
        while len(self.seen) > SEEN_MAX:
            self.seen.popitem(last=False)   # 가장 오래된 것부터 제거

def poll(st, demo_new=0):
    """한 거래소를 1회 폴링한다. 감지된 신규 건수를 돌려준다."""
    mono = time.monotonic()
    if mono < st.next_ok_at:      # 백오프 중이면 이번 주기 건너뜀
        st.skipped += 1
        return 0
    t0 = time.monotonic()
    try:
        rows = st.extract(fetch(st.url))
    except Exception as e:        # 네트워크 오류·응답 실패 → 종료하지 않고 백오프
        st.fail_streak += 1
        wait = min(BACKOFF_BASE * (2 ** (st.fail_streak - 1)), BACKOFF_MAX)
        st.next_ok_at = time.monotonic() + wait
        log("[{t}] [{n}] 요청 실패({c}): {et}: {e} → {w:.1f}s 후 재시도".format(
            t=now_str(), n=st.name, c=st.fail_streak, et=type(e).__name__, e=e, w=wait))
        return 0
    latency_ms = int((time.monotonic() - t0) * 1000)
    if st.fail_streak:
        log("[{t}] [{n}] 응답 복구 (실패 {c}회 후)".format(t=now_str(), n=st.name, c=st.fail_streak))
        st.fail_streak = 0

    if not st.baseline:
        # 첫 조회: 기존 공지를 신규로 오인하지 않도록 기준선만 저장
        for nid, _title, _at in rows:
            st.mark_seen(nid)
        # (테스트) 최신 demo_new 건을 미확인 처리해 감지 경로를 실제 데이터로 시연
        for nid, _title, _at in rows[:demo_new]:
            st.seen.pop(nid, None)
        st.baseline = True
        log("[{t}] [{n}] 기준선 확보 — 기존 공지 {k}건 · 응답 {ms}ms · 이후 신규만 출력{d}".format(
            t=now_str(), n=st.name, k=len(rows), ms=latency_ms,
            d=" (시연: 최신 {0}건 신규 취급)".format(demo_new) if demo_new else ""))

    new_count = 0
    for nid, title, at in rows:
        if DEDUP_BY_ID and nid in st.seen:
            continue
        st.mark_seen(nid)
        new_count += 1
        log("[{t}] [{n}] 신규 공지 (id={i}): {ti}  · 등록 {a} · 응답 {ms}ms".format(
            t=now_str(), n=st.name, i=nid, ti=title, a=at, ms=latency_ms))
    return new_count

# ---------------------------------------------------------------------------
# 거래소 1곳 = 스레드 1개. 서로의 응답 지연에 영향을 받지 않는다.
# ---------------------------------------------------------------------------
def run_exchange(st, opts, stop_evt):
    interval = opts["interval"]
    next_tick = time.monotonic()
    while not stop_evt.is_set():
        st.cycles += 1
        try:
            poll(st, demo_new=opts["demo_new"] if st.cycles == 1 else 0)
        except Exception as e:    # 예기치 못한 예외도 이 거래소 안에서만 처리
            log("[{t}] [{n}] 격리된 예외: {e}".format(t=now_str(), n=st.name, e=e))

        if opts["cycles"] is not None and st.cycles >= opts["cycles"]:
            break

        # 마감 시각 기준 대기 — 응답 지연이 주기에 얹히지 않는다
        next_tick += interval
        delay = next_tick - time.monotonic()
        if delay < 0:
            # 요청이 주기보다 오래 걸린 경우: 밀린 슬롯은 버리고 다음 정각에 맞춘다
            missed = int((-delay) // interval) + 1
            next_tick += missed * interval
            delay = next_tick - time.monotonic()
        stop_evt.wait(delay if delay > 0 else 0)

def parse_args(argv):
    opts = {"cycles": None, "interval": POLL_INTERVAL_SEC, "demo_new": 0,
            "break": set(), "hang": set()}
    i = 1
    while i < len(argv):
        a = argv[i]
        if a == "--cycles":     opts["cycles"] = int(argv[i + 1]); i += 2
        elif a == "--interval": opts["interval"] = float(argv[i + 1]); i += 2
        elif a == "--demo-new": opts["demo_new"] = int(argv[i + 1]); i += 2
        elif a == "--break":    opts["break"].add(argv[i + 1].upper()); i += 2
        elif a == "--hang":     opts["hang"].add(argv[i + 1].upper()); i += 2
        else: i += 1
    return opts

def main():
    opts = parse_args(sys.argv)
    states = [ExchangeState(e["name"], e["url"], e["extract"]) for e in EXCHANGES]
    for s in states:
        if s.name in opts["break"]:   # 즉시 실패(DNS 해석 불가)
            s.url = "https://unreachable-exchange.invalid/notices"
        if s.name in opts["hang"]:    # 응답 없음(타임아웃까지 매달림)
            s.url = "https://10.255.255.1/notices"

    log("[{t}] 감지 시작 — 주기 {i}s · 거래소별 독립 스레드 · {n}".format(
        t=now_str(), i=opts["interval"], n=", ".join(s.name for s in states)))

    stop_evt = threading.Event()
    threads = [threading.Thread(target=run_exchange, args=(s, opts, stop_evt),
                                name=s.name, daemon=True) for s in states]
    for th in threads:
        th.start()
    try:
        for th in threads:
            th.join()
    except KeyboardInterrupt:
        stop_evt.set()
        log("[{t}] 중단 요청 — 정리 중".format(t=now_str()))
        for th in threads:
            th.join(timeout=REQUEST_TIMEOUT + 1)

    if opts["cycles"] is not None:
        log("[{t}] 거래소별 {c}주기 완료 — 종료 ({d})".format(
            t=now_str(), c=opts["cycles"],
            d=" · ".join("{0} 백오프 스킵 {1}회".format(s.name, s.skipped) for s in states)))

if __name__ == "__main__":
    main()
