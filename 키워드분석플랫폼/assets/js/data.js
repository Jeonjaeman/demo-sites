/* ============================================================
   키워드펄스 — 목(mock) 데이터 생성기 (결정적/seeded)
   같은 키워드 → 항상 같은 결과. 실제 구축 시 네이버 API/SNS 수집으로 대체.
   ============================================================ */
(function (global) {
  "use strict";

  // 키워드 팔레트 (비교 차트 색상)
  const PALETTE = ["#7c6cff", "#22d3ee", "#34d399", "#fbbf24", "#f472b6", "#fb923c", "#60a5fa", "#a78bfa", "#f87171", "#2dd4bf"];

  const CHANNELS = [
    { key: "naver", name: "네이버", color: "#03c75a", unit: "검색량", abbr: "N" },
    { key: "instagram", name: "인스타그램", color: "#e1306c", unit: "게시물", abbr: "IG" },
    { key: "x", name: "엑스(X)", color: "#1d9bf0", unit: "트윗", abbr: "X" },
    { key: "youtube", name: "유튜브", color: "#ff3b30", unit: "영상", abbr: "YT" },
    { key: "tiktok", name: "틱톡", color: "#25f4ee", unit: "영상", abbr: "TT" },
  ];

  const AGES = ["10대", "20대", "30대", "40대", "50대", "60대+"];
  const WEEK = ["월", "화", "수", "목", "금", "토", "일"];
  const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

  const REL_SUFFIX = ["추천", "가격", "후기", "순위", "브랜드", "효과", "방법", "비교", "챌린지", "내돈내산", "협찬", "인기", "신상", "할인", "이벤트"];
  const REL_PREFIX = ["인기", "신상", "2026", "요즘", "국내", "직구"];

  // ---- 결정적 난수 ----
  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const ri = (r, min, max) => Math.floor(min + r() * (max - min + 1));

  // 연관 키워드 클러스터 분류
  function clusterOf(label, keyword) {
    const s = label.split(keyword).join(" ");
    if (/추천|순위|인기|비교/.test(s)) return "추천·순위";
    if (/가격|할인|이벤트/.test(s)) return "가격·프로모션";
    if (/후기|내돈내산|협찬/.test(s)) return "후기·평판";
    if (/챌린지|신상|트렌드|요즘/.test(s)) return "트렌드·신상";
    if (/효과|방법|브랜드|종류/.test(s)) return "정보·브랜드";
    return "확장 검색";
  }

  function normalize(arr) {
    const sum = arr.reduce((a, b) => a + b, 0) || 1;
    const out = arr.map((v) => Math.round((v / sum) * 1000) / 10);
    // 보정 합 100
    const diff = Math.round((100 - out.reduce((a, b) => a + b, 0)) * 10) / 10;
    out[0] = Math.round((out[0] + diff) * 10) / 10;
    return out;
  }

  // ---- 키워드 1개 분석 데이터 ----
  function analyze(keyword, days) {
    days = days || 30;
    const seed = hashStr(keyword.trim().toLowerCase());
    const r = mulberry32(seed);

    // 네이버 30일 검색량
    const naver30 = ri(r, 8000, 240000);
    // 채널별 언급량 (네이버 검색량에 비례 + 채널 특성)
    const channels = {
      naver: naver30,
      instagram: Math.round(naver30 * (0.15 + r() * 0.5)),
      x: Math.round(naver30 * (0.05 + r() * 0.25)),
      youtube: Math.round(naver30 * (0.02 + r() * 0.08)),
      tiktok: Math.round(naver30 * (0.03 + r() * 0.22)),
    };
    const youtubeViews = channels.youtube * ri(r, 800, 6000);
    const snsTotal = channels.instagram + channels.x + channels.youtube + channels.tiktok;

    // 최초 검색일 — 데이터 수집 시작 2016-01-01. 그 이전 키워드는 2016-01-01로 표시.
    let firstSeen;
    if (r() < 0.28) firstSeen = "2016-01-01";
    else {
      const year = ri(r, 2016, 2025), mon = ri(r, 1, 12), day = ri(r, 1, 28);
      firstSeen = `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    // 인구통계 (기간 독립)
    const genderM = ri(r, 28, 72);
    const gender = { m: genderM, f: 100 - genderM };
    const age = normalize(AGES.map(() => 5 + r() * 30));
    const weekday = normalize(WEEK.map((_, i) => (i >= 5 ? 1.1 : 1) * (5 + r() * 20)));
    const month = normalize(MONTHS.map(() => 5 + r() * 20));

    // 추이 (일자별) — 채널별 시리즈. 기간 독립성 위해 별도 시드 사용
    const tr = mulberry32(hashStr(keyword + "::trend"));
    const base = naver30 / 30;
    const trendShape = []; // 0..1 곡선 (계절/노이즈)
    let level = 0.6 + tr() * 0.3;
    for (let i = 0; i < days; i++) {
      level += (tr() - 0.5) * 0.12;
      level = Math.max(0.25, Math.min(1.15, level));
      const wk = 1 + (i % 7 >= 5 ? 0.12 : -0.04); // 주말 가중
      trendShape.push(level * wk);
    }
    const seriesFor = (scale) => trendShape.map((s) => Math.max(0, Math.round(base * scale * s * (0.9 + tr() * 0.2))));
    const trend = {
      naver: seriesFor(1),
      instagram: seriesFor(channels.instagram / naver30),
      x: seriesFor(channels.x / naver30),
      youtube: seriesFor(channels.youtube / naver30),
      tiktok: seriesFor(channels.tiktok / naver30),
    };
    // 전기간 대비 증감률
    const half = Math.floor(days / 2);
    const recent = trend.naver.slice(half).reduce((a, b) => a + b, 0);
    const prev = trend.naver.slice(0, half).reduce((a, b) => a + b, 0) || 1;
    const change = Math.round(((recent - prev) / prev) * 1000) / 10;

    // 연관 키워드 (+ 클러스터, 기간 내 총 검색량)
    const relCount = ri(r, 12, 18);
    const rel = [];
    const used = {};
    for (let i = 0; i < relCount; i++) {
      let label;
      const mode = r();
      if (mode < 0.55) label = keyword + " " + REL_SUFFIX[ri(r, 0, REL_SUFFIX.length - 1)];
      else if (mode < 0.8) label = REL_PREFIX[ri(r, 0, REL_PREFIX.length - 1)] + " " + keyword;
      else label = keyword + REL_SUFFIX[ri(r, 0, REL_SUFFIX.length - 1)];
      if (used[label]) continue; used[label] = 1;
      const score = ri(r, 20, 100);
      const vol = Math.round(naver30 * (score / 100) * (0.35 + r() * 0.6));
      rel.push({ label, score, vol, cluster: clusterOf(label, keyword) });
    }
    rel.sort((a, b) => b.vol - a.vol);

    // 월별 / 연별 시리즈 (2016-01 ~ 2026-06) — 일/월/연 단위 토글용
    const mr = mulberry32(hashStr(keyword + "::month"));
    const months = [];
    let ml = 0.5 + mr() * 0.5;
    for (let y = 2016; y <= 2026; y++) {
      for (let m = 1; m <= 12; m++) {
        if (y === 2026 && m > 6) break;
        ml += (mr() - 0.5) * 0.16; ml = Math.max(0.2, Math.min(1.5, ml));
        const seas = 1 + 0.15 * Math.sin((m / 12) * Math.PI * 2);
        months.push({ y, m, label: `${String(y).slice(2)}.${String(m).padStart(2, "0")}`, value: Math.round(naver30 * ml * seas) });
      }
    }
    const years = [];
    for (let y = 2016; y <= 2026; y++) {
      years.push({ y, label: String(y), value: months.filter((x) => x.y === y).reduce((a, b) => a + b.value, 0) });
    }

    return { keyword, days, naver30, channels, youtubeViews, snsTotal, firstSeen, trend, months, years, change, gender, age, weekday, month, related: rel };
  }

  global.KP = {
    PALETTE, CHANNELS, AGES, WEEK, MONTHS,
    analyze,
    fmt(n) { return (n == null ? 0 : Math.round(n)).toLocaleString(); },
    fmtK(n) {
      if (n >= 100000000) return (n / 100000000).toFixed(1) + "억";
      if (n >= 10000) return (n / 10000).toFixed(1) + "만";
      if (n >= 1000) return (n / 1000).toFixed(1) + "천";
      return String(Math.round(n));
    },
    color(i) { return PALETTE[i % PALETTE.length]; },
  };
})(window);
