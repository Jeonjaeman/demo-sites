# -*- coding: utf-8 -*-
"""
업비트·빗썸 신규 공지 감지 스크립트 (무중단 폴링)

- 외부 라이브러리 없음: Python 3.8+ 표준 라이브러리(urllib)만 사용
- 폴링 주기/타임아웃/재시도/백오프는 config.py 로 분리(코드 수정 없이 조정)
- 공지 식별자(id) 기준 중복 제거, 한 거래소 장애가 다른 거래소 감지를 막지 않음
- 실제 엔드포인트(2026-07 확인):
    UPBIT   : https://api-manager.upbit.com/api/v1/announcements  (data.notices[])
    BITHUMB : https://feed-api.bithumb.com/v1/notices             (최상위 배열)

실행:
    python detector.py                 # 무중단 실시간 감지(운영)
    python detector.py --cycles 3      # 3주기만 돌고 종료(테스트)
    python detector.py --interval 1.0  # 폴링 주기 덮어쓰기
    python detector.py --demo-new 2    # 첫 주기에 최신 2건을 '신규'로 취급(감지 경로 시연)
"""
import sys, json, time, urllib.request, urllib.error
from datetime import datetime

# Windows 콘솔(cp949 등)에서도 한글 출력이 깨지지 않도록 UTF-8로 재설정
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
from config import (POLL_INTERVAL_SEC, REQUEST_TIMEOUT, BACKOFF_BASE,
                    BACKOFF_MAX, DEDUP_BY_ID, USER_AGENT, MAX_ITEMS)

# ---------------------------------------------------------------------------
# 거래소 정의: 엔드포인트와 응답 정규화 함수(스키마 변경 시 여기만 수정)
# ---------------------------------------------------------------------------
def _extract_upbit(payload):
    """Upbit: {"success":true,"data":{"notices":[{"id":..,"title":..,"first_listed_at":..}]}}"""
    notices = (payload or {}).get("data", {}).get("notices", [])
    rows = []
    for n in notices:
        nid = str(n.get("id") or n.get("uuid") or n.get("title"))
        rows.append((nid, (n.get("title") or "").strip(), n.get("first_listed_at") or n.get("listed_at") or ""))
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

def now_str():
    return datetime.now().strftime("%H:%M:%S.%f")[:-3]

class ExchangeState:
    def __init__(self, name, url, extract):
        self.name, self.url, self.extract = name, url, extract
        self.seen = set()        # 이미 처리한 공지 id
        self.fail_streak = 0
        self.next_ok_at = 0.0    # 백오프 종료 시각(monotonic)
        self.baseline = False    # 첫 조회로 기준선을 잡았는지

def poll(st, demo_new=0):
    mono = time.monotonic()
    if mono < st.next_ok_at:      # 백오프 중이면 이번 주기 건너뜀
        return
    t0 = time.monotonic()
    try:
        rows = st.extract(fetch(st.url))
    except Exception as e:        # 네트워크 오류·응답 실패 → 종료하지 않고 백오프
        st.fail_streak += 1
        wait = min(BACKOFF_BASE * (2 ** (st.fail_streak - 1)), BACKOFF_MAX)
        st.next_ok_at = mono + wait
        print(f"[{now_str()}] [{st.name}] 요청 실패({st.fail_streak}): "
              f"{type(e).__name__}: {e} → {wait:.1f}s 후 재시도", flush=True)
        return
    latency_ms = int((time.monotonic() - t0) * 1000)
    if st.fail_streak:
        print(f"[{now_str()}] [{st.name}] 응답 복구 (실패 {st.fail_streak}회 후)", flush=True)
        st.fail_streak = 0

    if not st.baseline:
        # 첫 조회: 기존 공지를 신규로 오인하지 않도록 기준선만 저장
        for nid, _title, _at in rows:
            st.seen.add(nid)
        # (테스트) 최신 demo_new 건을 미확인 처리해 감지 경로를 실제 데이터로 시연
        for nid, _title, _at in rows[:demo_new]:
            st.seen.discard(nid)
        st.baseline = True
        print(f"[{now_str()}] [{st.name}] 기준선 확보 — 기존 공지 {len(rows)}건 · "
              f"응답 {latency_ms}ms · 이후 신규만 출력"
              + (f" (시연: 최신 {demo_new}건 신규 취급)" if demo_new else ""), flush=True)

    new_count = 0
    for nid, title, at in rows:
        if DEDUP_BY_ID and nid in st.seen:
            continue
        st.seen.add(nid)
        new_count += 1
        print(f"[{now_str()}] [{st.name}] 신규 공지 (id={nid}): {title}"
              f"  · 등록 {at} · 응답 {latency_ms}ms", flush=True)
    return new_count

def parse_args(argv):
    opts = {"cycles": None, "interval": POLL_INTERVAL_SEC, "demo_new": 0, "break": set()}
    i = 1
    while i < len(argv):
        a = argv[i]
        if a == "--cycles":    opts["cycles"] = int(argv[i + 1]); i += 2
        elif a == "--interval": opts["interval"] = float(argv[i + 1]); i += 2
        elif a == "--demo-new": opts["demo_new"] = int(argv[i + 1]); i += 2
        elif a == "--break":   opts["break"].add(argv[i + 1].upper()); i += 2  # (테스트) 장애 주입
        else: i += 1
    return opts

def main():
    opts = parse_args(sys.argv)
    states = [ExchangeState(e["name"], e["url"], e["extract"]) for e in EXCHANGES]
    for s in states:              # (테스트) 지정 거래소를 접속 불가 주소로 바꿔 장애 시뮬레이션
        if s.name in opts["break"]:
            s.url = "https://unreachable-exchange.invalid/notices"
    print(f"[{now_str()}] 감지 시작 — 주기 {opts['interval']}s · 거래소 "
          + ", ".join(s.name for s in states), flush=True)
    cycle = 0
    while True:                    # 무중단 루프
        cycle += 1
        for s in states:
            try:
                poll(s, demo_new=opts["demo_new"] if cycle == 1 else 0)
            except Exception as e:  # 한 거래소의 예기치 못한 예외가 다른 거래소를 막지 않음
                print(f"[{now_str()}] [{s.name}] 격리된 예외: {e}", flush=True)
        if opts["cycles"] is not None and cycle >= opts["cycles"]:
            print(f"[{now_str()}] {cycle}주기 완료 — 종료", flush=True)
            break
        time.sleep(opts["interval"])

if __name__ == "__main__":
    main()
