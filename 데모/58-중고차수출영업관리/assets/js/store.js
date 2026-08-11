/* =====================================================================
   EXCARO 엑스카로 — 중고차 수출 영업·입찰 시스템 (제안 데모)
   공유 상태 저장소: localStorage + storage 이벤트
   → 랜딩(접수) · 영업팀 어드민 · 바이어 어드민을 창 두 개로 열면
     입찰·상태 변경이 실시간처럼 흐른다 (공고 3-2 "실시간 작동" 대응)

   ★ 실서비스 구현 전제(데모와 다른 점)를 코드에 명시한다:
   - 시각 권위: 실서비스는 DB(서버) 시각으로 마감 판정. 클라이언트 시계는
     표시용일 뿐이다. 데모는 브라우저 시각을 "서버 시각"으로 가정.
   - 입찰 마감: 데모 배속 — 실서비스 24시간 = 데모 24분 (1h→1min).
   - 바이어 데이터 차단: buyerView()가 서버 응답을 흉내 — 고객정보·비교견적·
     폐차기준가 필드를 "응답 자체에서 제거"한다. 화면 숨김이 아니다.
   ===================================================================== */
(function (global) {
  "use strict";

  const KEY = "excaro_v1";
  const DEMO_SCALE = 60;                      // 실서비스 24h → 데모 24min (60배속)

  /* ---------- 유틸 ---------- */
  const now = () => Date.now();               // "서버 권위 시각" (데모 가정)
  const uid = () => Math.random().toString(36).slice(2, 9);
  const won = (n) => (n == null ? "—" : Number(n).toLocaleString("ko-KR") + "만원");
  const pad = (n) => String(n).padStart(2, "0");
  const hhmm = (t) => { const d = new Date(t); return pad(d.getHours()) + ":" + pad(d.getMinutes()); };
  const mmss = (ms) => {
    if (ms <= 0) return "00:00";
    const s = Math.floor(ms / 1000);
    return pad(Math.floor(s / 60)) + ":" + pad(s % 60);
  };
  /* 데모 잔여시간 → 실서비스 환산 표기 (24분 = 24시간) */
  const realLeft = (ms) => {
    if (ms <= 0) return "마감";
    const h = Math.floor(ms / 60000);         // 데모 1분 = 실제 1시간
    const m = Math.floor((ms % 60000) / 1000);
    return h + "시간 " + m + "분";
  };

  /* ---------- 상태 ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* 손상 시 초기화 */ }
    const st = global.EXCARO_SEED ? global.EXCARO_SEED() : { cases: [], buyers: [], staff: [], logs: [] };
    localStorage.setItem(KEY, JSON.stringify(st));
    return st;
  }
  function save(st) {
    localStorage.setItem(KEY, JSON.stringify(st));
    document.dispatchEvent(new CustomEvent("excaro:change"));
  }
  function reset() { localStorage.removeItem(KEY); location.reload(); }

  /* 다른 창(표면)의 변경을 이 창에 반영 */
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) document.dispatchEvent(new CustomEvent("excaro:change"));
  });

  /* ---------- 발송 로그 (알림톡/SMS 폴백 — 심사 전 SMS 대체 표기) ---------- */
  function log(st, kind, to, msg) {
    st.logs.unshift({ id: uid(), at: now(), kind, to, msg,
      channel: st.alimtalkReady ? "알림톡" : "SMS(폴백)" });
    st.logs = st.logs.slice(0, 60);
  }

  /* ---------- 접수 (랜딩 → 영업) ---------- */
  function submitLead(st, { plate, owner, phone, model, year, fuel }) {
    // 담당자 규칙 배정: 활성 영업직원 중 보유 건수가 가장 적은 사람 (라운드로빈 대체)
    const sales = st.staff.filter((s) => s.role === "sales");
    const count = (id) => st.cases.filter((c) => c.assignee === id && c.status !== "sent").length;
    sales.sort((a, b) => count(a.id) - count(b.id));
    const c = {
      id: uid(), createdAt: now(), plate, owner, phone, model, year, fuel,
      km: null, status: "new", assignee: sales[0] ? sales[0].id : null, autoAssigned: true,
      checklist: null, memo: "", photos: [],
      compare: null,                     // 상담 후 카마트 조회 (계약 필요 — 데모는 모의)
      bids: [], auction: null, round: 1, wishPrice: null, erpLog: [], docs: null,
    };
    st.cases.unshift(c);
    log(st, "접수", owner, `[엑스카로] ${plate} 무료 수출 문의가 접수되었습니다. 담당자가 곧 연락드립니다. (연락은 담당자 1명만 드립니다)`);
    return c;
  }

  /* ---------- 상담 저장 ---------- */
  function saveConsult(st, id, checklist, memo, km) {
    const c = st.cases.find((x) => x.id === id); if (!c) return;
    c.checklist = checklist; c.memo = memo; if (km) c.km = km;
    // 카마트 비교견적·폐차기준가 — 실서비스: B2B 계약 API. 데모: 연식·주행 기반 모의 산출
    const base = Math.max(120, 3200 - (2026 - c.year) * 260 - (c.km ? c.km / 100 : 800));
    const dmg = (checklist.accident === "유" ? 0.82 : 1) * (checklist.flood === "유" ? 0.6 : 1);
    c.compare = {
      market: Math.round(base * dmg),                 // 비교견적(시세)
      scrap: Math.round(Math.max(60, base * 0.22)),   // 폐차기준가
      at: now(),
    };
    if (c.status === "new" || c.status === "assigned") c.status = "consulted";
  }

  /* ---------- 입찰 ---------- */
  const SOFT_CLOSE_WINDOW = 3 * 60 * 1000;    // 마감 3분(=실서비스 3시간) 내 입찰 시
  const SOFT_CLOSE_EXTEND = 5 * 60 * 1000;    // 5분(=5시간) 연장 — 스나이핑 방어

  function startAuction(st, id, demoMinutes) {
    const c = st.cases.find((x) => x.id === id); if (!c) return;
    c.status = "bidding";
    c.auction = { startedAt: now(), endsAt: now() + (demoMinutes || 24) * 60000,
      extended: 0, stopped: false };
    st.buyers.forEach((b) => log(st, "입찰요청", b.name,
      `[엑스카로] 신규 입찰 요청 — ${c.model} (${c.year}). 마감 24시간. 입찰가를 제시해 주세요.`));
    return c;
  }

  function auctionLeft(c) {
    if (!c.auction) return 0;
    return Math.max(0, c.auction.endsAt - now());
  }
  function auctionOpen(c) {
    return c.status === "bidding" && c.auction && !c.auction.stopped && auctionLeft(c) > 0;
  }

  /* 입찰 제출/수정 — 마감 검증은 "서버 시각" 기준. 소프트클로즈 연장 포함 */
  function placeBid(st, caseId, buyerId, amount, memo) {
    const c = st.cases.find((x) => x.id === caseId); if (!c) return { ok: false, reason: "notfound" };
    if (!auctionOpen(c)) return { ok: false, reason: "closed" };   // ★ 마감 후 입찰 거부
    const prev = c.bids.find((b) => b.buyer === buyerId);
    if (prev) { prev.amount = amount; prev.memo = memo || prev.memo; prev.at = now(); prev.revised = (prev.revised || 0) + 1; }
    else c.bids.push({ id: uid(), buyer: buyerId, amount, memo: memo || "", at: now(), revised: 0 });
    // 소프트클로즈: 마감 3분(실서비스 3시간) 안에 들어온 입찰은 마감을 5분(5시간) 연장
    let extended = false;
    if (c.auction.endsAt - now() < SOFT_CLOSE_WINDOW) {
      c.auction.endsAt += SOFT_CLOSE_EXTEND;
      c.auction.extended += 1; extended = true;
    }
    return { ok: true, extended };
  }

  function topBid(c) {
    if (!c.bids.length) return null;
    return c.bids.slice().sort((a, b) => b.amount - a.amount || a.at - b.at)[0]; // 동가는 선입찰 우선
  }
  /* 바이어 본인 순위만 (블라인드 — 타 입찰가 비공개, 헤이딜러 관행) */
  function myRank(c, buyerId) {
    const sorted = c.bids.slice().sort((a, b) => b.amount - a.amount || a.at - b.at);
    const i = sorted.findIndex((b) => b.buyer === buyerId);
    return i < 0 ? null : { rank: i + 1, of: sorted.length };
  }

  function stopAuction(st, id) {                 // 임의 중지 → 그 시점 최고가 확정
    const c = st.cases.find((x) => x.id === id); if (!c || !c.auction) return;
    c.auction.stopped = true; c.auction.endsAt = now();
    const t = topBid(c);
    if (t) { c.status = "renegotiate"; c.finalBid = t; }
    else { c.status = "consulted"; c.auction = null; } // 입찰 0건 → 상담 상태로 회귀
  }

  function rebid(st, id, wishPrice) {            // 가격 불일치 → 희망가 협의 후 재입찰
    const c = st.cases.find((x) => x.id === id); if (!c) return { ok: false };
    if (c.round >= 2) return { ok: false, reason: "limit" }; // ★ 재입찰 2회 제한 (무한 재입찰 방지)
    c.round += 1; c.wishPrice = wishPrice; c.bids = []; c.finalBid = null;
    startAuction(st, id, 24);
    return { ok: true };
  }

  /* ---------- 매입 확정 → ERP 전송 (멱등키 + 재시도) ---------- */
  function confirmPurchase(st, id) {
    const c = st.cases.find((x) => x.id === id); if (!c) return;
    c.status = "confirmed";
    c.docs = { 매입계약서: false, 소유자신분증빙: false, 대금지급증빙: false,
      말소등록: false, 수출신고: false };      // 수출 실무 서류 추적 (건별 파일링)
    log(st, "확정", c.owner, `[엑스카로] ${c.plate} 매입이 확정되었습니다. 담당자가 서류 안내를 드립니다.`);
  }

  function erpSend(st, id, simulateFail) {
    const c = st.cases.find((x) => x.id === id); if (!c) return;
    const key = c.erpKey || (c.erpKey = "EXC-" + c.id.toUpperCase()); // ★ 멱등키 — 중복 전송 방지
    const ok = !simulateFail;
    c.erpLog.push({ at: now(), key, ok,
      msg: ok ? "ERP 수신 확인 (200)" : "타임아웃 — 자동 재시도 대기열 등록" });
    if (ok) c.status = "sent";
    return ok;
  }

  /* ---------- 바이어 응답 뷰 — 서버 필드 차단 ----------
     ★ 공고 2-3 "고객정보·비교견적·폐차견적 철저히 비노출"
     화면에서 가리는 게 아니라, 응답 객체 자체에 해당 필드가 없다.
     (실서비스: API 계층에서 role별 serializer 분리) */
  function buyerView(c) {
    return {
      id: c.id, model: c.model, year: c.year, km: c.km, fuel: c.fuel,
      plateMasked: c.plate ? c.plate.slice(0, 2) + "**" + c.plate.slice(-2) : "",
      checklist: c.checklist, memo: c.memo, photos: c.photos,
      round: c.round, auction: c.auction, status: c.status,
      // owner ✗ / phone ✗ / compare(비교견적·폐차기준가) ✗ / wishPrice ✗ — 필드 자체가 없음
    };
  }

  /* ---------- 라벨 ---------- */
  const STATUS = {
    new:        { ko: "신규 접수", cls: "st-new" },
    assigned:   { ko: "배정 완료", cls: "st-new" },
    consulted:  { ko: "상담 완료 · 입찰 전", cls: "st-ready" },
    bidding:    { ko: "입찰 진행 중", cls: "st-live" },
    renegotiate:{ ko: "낙찰 · 고객 협의", cls: "st-nego" },
    confirmed:  { ko: "매입 확정", cls: "st-done" },
    sent:       { ko: "ERP 전송 완료", cls: "st-sent" },
  };

  global.Excaro = {
    load, save, reset, log, submitLead, saveConsult,
    startAuction, auctionOpen, auctionLeft, placeBid, topBid, myRank,
    stopAuction, rebid, confirmPurchase, erpSend, buyerView,
    STATUS, won, hhmm, mmss, realLeft, now, uid, DEMO_SCALE,
  };
})(window);
