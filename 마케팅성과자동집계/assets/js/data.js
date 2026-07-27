/* ==========================================================================
   ADSUM — 목데이터 생성기 (전부 결정론적으로 "계산"됩니다. 하드코딩 수치 없음)

   설계 의도
   ─────────────────────────────────────────────────────────────────────────
   1) 주문(스마트스토어 실매출)을 먼저 만들고, 각 주문에 광고 "터치"를 붙입니다.
      각 광고 채널은 자기가 터치한 주문의 전액을 자기 전환매출로 신고합니다.
      → 채널 전환매출 합계 > 광고 기여 매출(중복 제거) 이 자연스럽게 발생합니다.
      이것이 실제 광고 대시보드에서 ROAS가 부풀려지는 구조입니다.
   2) 전환은 지연되어 들어옵니다. 각 일자 레코드는 최종값(final)과
      "수집 시점의 성숙도"에 따른 관측값(observed)을 함께 가집니다.
      1회 수집 방식은 D+1 성숙도에 고정되고, 롤링 재수집은 성숙도가 올라갑니다.
   3) 소재 이미지 URL은 서명+만료시각을 가집니다. 만료된 URL은 실제로 실패합니다.

   ※ 브랜드·상품·소재·수치는 전부 가상입니다. 실존 업체와 무관합니다.
   ========================================================================== */

/* --------------------------- 결정론적 난수 --------------------------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* --------------------------- 기준일 --------------------------- */
/* 데모 기준일 고정 — 오늘을 2026-07-27로 둡니다 (공고 모집 마감 직전) */
const TODAY = new Date(2026, 6, 27);
const DAYS = 60;

function dayKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
         String(d.getDate()).padStart(2, '0');
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

/* --------------------------- 채널 정의 --------------------------- */
/* window: 각 매체가 "자기 성과"로 인정하는 기여 기간. 전부 다릅니다. */
const CHANNELS = [
  {
    id: 'meta', name: '메타', full: '메타(페이스북·인스타그램)', color: '#4C8DFF',
    window: '클릭 7일 + 조회 1일', windowDays: 7,
    api: 'Marketing API v23.0', costField: 'spend', valueField: 'action_values.purchase',
    note: '어트리뷰션 설정에 따라 값이 달라지며, 과거 일자도 재집계됩니다.'
  },
  {
    id: 'google', name: '구글', full: '구글 애즈(검색·PMax)', color: '#FFB020',
    window: '클릭 30일(기본 · 1~90일 설정)', windowDays: 30,
    api: 'Google Ads API', costField: 'metrics.cost_micros', valueField: 'metrics.conversions_value',
    note: '전환 지연(conversion lag)으로 과거 리포팅 값이 몇 주간 계속 올라갑니다.'
  },
  {
    id: 'kakao', name: '카카오', full: '카카오모먼트', color: '#FEE500',
    window: '클릭 7일 + 조회 1일(기본)', windowDays: 7,
    api: '카카오모먼트 오픈API', costField: 'cost', valueField: 'convPurchaseAmount',
    note: '비즈니스 인증 + 권한 심사를 통과해야 호출 자체가 가능합니다.'
  },
  {
    id: 'naver', name: '네이버', full: '네이버 검색광고', color: '#00C950',
    window: '직접전환 + 간접전환(추적 7~20일 설정)', windowDays: 14,
    api: '검색광고 API(StatReport)', costField: 'salesAmt', valueField: 'convAmt',
    note: '간접전환 추적기간을 늘릴수록 다른 채널과의 중복이 커집니다.'
  }
];
const CH_BY_ID = Object.fromEntries(CHANNELS.map(c => [c.id, c]));

/* --------------------------- 소재 정의 --------------------------- */
/* 소재 디자인 요소 — "소재 디자인 요소 분석 포함" 요구를 정량화하기 위한 속성 */
const FORMATS = ['이미지', '영상', '캐러셀'];
const TONES   = ['혜택 강조', '고객 후기', '문제 제기', '성분·스펙'];
const KEYS    = ['라이트', '다크'];
const PRODUCTS = ['데일리 유산균', '이너 콜라겐', '루테인 아이', '오메가 밸런스',
                  '마그네슘 나이트', '멀티비타 데일리'];

function buildCreatives() {
  const rnd = mulberry32(20260722);
  const list = [];
  let n = 1;
  for (const ch of CHANNELS) {
    const count = ch.id === 'meta' ? 9 : ch.id === 'google' ? 6 : ch.id === 'kakao' ? 5 : 6;
    for (let i = 0; i < count; i++) {
      const product = PRODUCTS[Math.floor(rnd() * PRODUCTS.length)];
      const format = FORMATS[Math.floor(rnd() * FORMATS.length)];
      const tone = TONES[Math.floor(rnd() * TONES.length)];
      const key = KEYS[Math.floor(rnd() * KEYS.length)];
      const model = rnd() < 0.45;      // 인물 등장
      const price = rnd() < 0.5;       // 가격 표기
      /* 품질 계수 — 디자인 속성이 실제로 성과에 반영되도록 가중합으로 만듭니다.
         (분석 화면에서 이 관계를 "발견"하게 됩니다) */
      const q = 0.72
        + (tone === '고객 후기' ? 0.20 : tone === '문제 제기' ? 0.08 : tone === '혜택 강조' ? 0.02 : -0.06)
        + (format === '영상' ? 0.14 : format === '캐러셀' ? 0.03 : -0.02)
        + (model ? 0.09 : -0.03)
        + (price ? 0.05 : 0)
        + (key === '다크' ? 0.02 : 0)
        + (rnd() - 0.5) * 0.16;
      const budget = 40000 + Math.floor(rnd() * 230000);   // 일 예산 규모
      list.push({
        id: 'cr' + String(n).padStart(3, '0'),
        ch: ch.id,
        name: `${product}_${format}_${tone}_${String(n).padStart(2, '0')}`,
        product, format, tone, key, model, price,
        q: Math.max(0.35, q),
        budget,
        targetCPA: [15000, 18000, 22000, 26000, 32000][Math.floor(rnd() * 5)],
        imageHash: 'h' + Math.floor(rnd() * 1e10).toString(36),
        startOffset: Math.floor(rnd() * 26),  // 며칠 전부터 집행했는지
        /* 현실에서 실제로 벌어지는 두 상태 —
           dead: 랜딩 연결 오류·타깃 불일치로 돈만 쓰고 전환 0
           weak: 소액 집행이라 표본이 며칠치로는 안 쌓임 */
        dead: n % 13 === 7,
        weak: n % 9 === 4
      });
      n++;
    }
  }
  return list;
}
const CREATIVES = buildCreatives();
const CR_BY_ID = Object.fromEntries(CREATIVES.map(c => [c.id, c]));

/* --------------------------- 성숙도 곡선 --------------------------- */
/* 전환은 지연 도착합니다. age = 데이터 수집 시점 − 광고 노출 일자 (일).
   age가 커질수록 관측되는 전환/매출이 최종값에 수렴합니다. */
function maturity(age) {
  if (age <= 0) return 0.42;
  if (age >= 21) return 1;
  //  1일 0.62 / 3일 0.84 / 7일 0.97 / 14일 1.00
  return Math.min(1, 1 - Math.exp(-age / 2.36) * 0.5804);
}

/* --------------------------- 일별 데이터 생성 --------------------------- */
/*
   반환 구조
   days: [{ date, key, weekday, orders:[...], realRevenue, adTouchedRevenue,
            byCh: { meta:{spend,imp,clk,convFinal,valFinal}, ... },
            crRows: [{crId, spend, imp, clk, convFinal, valFinal}] }]
*/
function buildDaily() {
  const rnd = mulberry32(77712026);
  const days = [];

  for (let i = DAYS - 1; i >= 0; i--) {
    const date = addDays(TODAY, -i);
    const key = dayKey(date);
    const wd = date.getDay();               // 0=일
    const weekendBoost = (wd === 0 || wd === 6) ? 0.86 : 1.06;
    const trend = 1 + (DAYS - 1 - i) * 0.004;   // 완만한 성장
    const noise = 0.86 + rnd() * 0.3;

    /* --- 소재별 일 성과 --- */
    const crRows = [];
    const byCh = {};
    for (const ch of CHANNELS) byCh[ch.id] = { spend: 0, imp: 0, clk: 0, convFinal: 0, valFinal: 0 };

    for (const cr of CREATIVES) {
      const age = DAYS - 1 - i;
      if (age < cr.startOffset) continue;         // 아직 집행 전
      if (rnd() < 0.06) continue;                 // 그날 미집행
      const spend = Math.round(cr.budget * weekendBoost * trend * (0.72 + rnd() * 0.56) / 100) * 100;
      const cpc = 380 + (1 - cr.q) * 520 + rnd() * 140;
      const clk = Math.max(1, Math.round(spend / cpc));
      const ctr = 0.006 + cr.q * 0.019 + rnd() * 0.004;
      const imp = Math.round(clk / ctr);
      crRows.push({ crId: cr.id, ch: cr.ch, spend, imp, clk, convFinal: 0, valFinal: 0 });
      byCh[cr.ch].spend += spend; byCh[cr.ch].imp += imp; byCh[cr.ch].clk += clk;
    }

    /* --- 주문 생성 → 광고 터치 부여 --- */
    const dayClicks = crRows.reduce((s, r) => s + r.clk, 0);
    const baseCvr = 0.021 * noise;
    const orderCount = Math.max(4, Math.round(dayClicks * baseCvr) + Math.round(rnd() * 9));
    let realRevenue = 0, adTouchedRevenue = 0;

    for (let o = 0; o < orderCount; o++) {
      const amount = Math.round((26000 + rnd() * 84000) / 10) * 10;
      realRevenue += amount;

      /* 광고 터치 없음(직접 유입·재구매·검색 자연유입) = 18% */
      if (rnd() < 0.18) continue;
      adTouchedRevenue += amount;

      /* 터치 채널 수: 1개 58% / 2개 29% / 3개 13%
         → 여러 채널이 같은 주문을 각자 자기 성과로 신고합니다 */
      const r = rnd();
      const touches = r < 0.58 ? 1 : r < 0.87 ? 2 : 3;
      /* dead 소재는 전환 경로가 끊겨 있어 후보에서 제외됩니다 (광고비만 나갑니다) */
      const pool = crRows.filter(x => !CR_BY_ID[x.crId].dead);
      const picked = [];
      const w = x => x.clk * CR_BY_ID[x.crId].q * (CR_BY_ID[x.crId].weak ? 0.05 : 1);
      /* 클릭 수 × 소재 품질에 비례해 터치 소재를 뽑습니다 */
      for (let t = 0; t < touches && pool.length; t++) {
        const total = pool.reduce((s, x) => s + w(x), 0);
        let acc = rnd() * total, idx = 0;
        for (let k = 0; k < pool.length; k++) {
          acc -= w(pool[k]);
          if (acc <= 0) { idx = k; break; }
        }
        const chosen = pool.splice(idx, 1)[0];
        if (picked.some(p => p.ch === chosen.ch)) { t--; continue; }  // 같은 채널 중복 터치 제외
        picked.push(chosen);
      }
      /* 각 채널이 전액을 자기 전환매출로 신고 */
      for (const p of picked) {
        p.convFinal += 1;
        p.valFinal += amount;
        byCh[p.ch].convFinal += 1;
        byCh[p.ch].valFinal += amount;
      }
    }

    days.push({ date, key, wd, realRevenue, adTouchedRevenue, byCh, crRows });
  }
  return days;
}
const DAILY = buildDaily();

/* --------------------------- 관측값 계산 --------------------------- */
/*
   mode = 'once'   : 일별 배치 1회 수집 후 재조회하지 않음 → 모든 일자가 D+1 성숙도에 고정
   mode = 'rolling': 최근 windowN일을 매일 다시 조회해 덮어씀 → 실제 나이만큼 성숙
*/
function observed(day, idx, mode, rollDays) {
  const age = DAILY.length - 1 - idx;                       // 오늘 기준 며칠 전인지
  const m = mode === 'once'
    ? maturity(1)                                            // 다음날 한 번 긁고 끝
    : maturity(Math.min(age, rollDays));                     // 롤링 재수집 창 안에서만 갱신
  return m;
}

/* --------------------------- 집계 --------------------------- */
/*
   basis:
     'channel' — 채널이 신고한 전환매출 합계 (중복 포함)
     'adonly'  — 광고 터치가 있었던 주문만 (중복 제거)
     'total'   — 스마트스토어 전체 실매출 (MER 기준)
*/
function aggregate(opts) {
  const { fromIdx, toIdx, mode, rollDays, channels } = opts;
  const chSet = channels && channels.length ? new Set(channels) : null;

  let spend = 0, imp = 0, clk = 0;
  let convCh = 0, valCh = 0;
  let real = 0, adTouched = 0;
  const perCh = {};
  for (const c of CHANNELS) perCh[c.id] = { spend: 0, imp: 0, clk: 0, conv: 0, val: 0 };
  const series = [];

  for (let i = fromIdx; i <= toIdx; i++) {
    const d = DAILY[i];
    const m = observed(d, i, mode, rollDays);
    let dSpend = 0, dValCh = 0, dConvCh = 0, dImp = 0, dClk = 0;
    for (const c of CHANNELS) {
      if (chSet && !chSet.has(c.id)) continue;
      const b = d.byCh[c.id];
      const v = Math.round(b.valFinal * m);
      const cv = Math.round(b.convFinal * m);
      perCh[c.id].spend += b.spend; perCh[c.id].imp += b.imp; perCh[c.id].clk += b.clk;
      perCh[c.id].conv += cv; perCh[c.id].val += v;
      dSpend += b.spend; dImp += b.imp; dClk += b.clk; dValCh += v; dConvCh += cv;
    }
    spend += dSpend; imp += dImp; clk += dClk; valCh += dValCh; convCh += dConvCh;
    /* 실매출은 주문 시스템(스마트스토어) 값이라 광고 어트리뷰션과 무관하게 확정입니다 */
    real += d.realRevenue;
    adTouched += d.adTouchedRevenue;
    series.push({
      key: d.key, date: d.date, spend: dSpend, valCh: dValCh, conv: dConvCh,
      real: d.realRevenue, ad: d.adTouchedRevenue, maturity: m
    });
  }

  const revenue = { channel: valCh, adonly: adTouched, total: real };
  return { spend, imp, clk, convCh, valCh, real, adTouched, perCh, series, revenue };
}

/* --------------------------- 소재 단위 집계 --------------------------- */
function creativeStats(opts) {
  const { fromIdx, toIdx, mode, rollDays } = opts;
  const map = {};
  for (let i = fromIdx; i <= toIdx; i++) {
    const d = DAILY[i];
    const m = observed(d, i, mode, rollDays);
    for (const r of d.crRows) {
      const t = map[r.crId] || (map[r.crId] = { crId: r.crId, ch: r.ch, spend: 0, imp: 0, clk: 0, conv: 0, val: 0, days: 0 });
      t.spend += r.spend; t.imp += r.imp; t.clk += r.clk;
      t.conv += Math.round(r.convFinal * m);
      t.val += Math.round(r.valFinal * m);
      t.days++;
    }
  }
  return Object.values(map).map(t => {
    const cr = CR_BY_ID[t.crId];
    return Object.assign(t, {
      cr,
      ctr: t.imp ? t.clk / t.imp : 0,
      cpc: t.clk ? t.spend / t.clk : 0,
      cpa: t.conv ? t.spend / t.conv : null,
      roas: t.spend ? t.val / t.spend : 0
    });
  });
}

/* --------------------------- 목표 CPA 판정 --------------------------- */
/*
   ★ 요구사항 그대로 "CPA > 목표"만 비교하면 전환 0건 소재가 판정에서 사라집니다.
     (0으로 나눈 값은 비교 대상이 아니기 때문)
   그래서 3단계로 나눕니다.
     over    : 표본 충족 + 목표 초과
     noconv  : 전환 0인데 목표CPA × 배수 이상 소진 → 별도 경보
     hold    : 표본 부족 → 판정 보류 (하루치로 끄면 오판)
     ok      : 정상
*/
function judge(stat, params) {
  const { minConv, spendMultiple } = params;
  const target = stat.cr.targetCPA;
  if (stat.conv >= minConv) {
    const cpa = stat.spend / stat.conv;
    return { status: cpa > target ? 'over' : 'ok', cpa, target };
  }
  if (stat.conv === 0 && stat.spend >= target * spendMultiple) {
    return { status: 'noconv', cpa: null, target };
  }
  return { status: 'hold', cpa: stat.conv ? stat.spend / stat.conv : null, target };
}
/* 비교용 — 의뢰자 요구사항을 문자 그대로 구현했을 때 */
function judgeNaive(stat) {
  const target = stat.cr.targetCPA;
  if (!stat.conv) return { status: 'invisible', cpa: null, target };  // 목록에서 사라짐
  const cpa = stat.spend / stat.conv;
  return { status: cpa > target ? 'over' : 'ok', cpa, target };
}

/* --------------------------- 소재 이미지 URL --------------------------- */
/* 메타 image_url / thumbnail_url 은 서명이 붙은 임시 URL이며 영구 링크가 없습니다.
   수집 시점에 URL을 그대로 저장하면 며칠 뒤 'URL signature expired'로 깨집니다. */
const COLLECTED_AT = addDays(TODAY, -9);      // 소재 메타데이터를 긁어온 시점

function storedImageUrl(cr) {
  const exp = addDays(COLLECTED_AT, 1);       // 서명 유효기간 24시간
  return {
    url: `https://scontent.xx.example/v/t45/${cr.imageHash}.jpg?_nc_cat=104&ccb=1-7` +
         `&_nc_sid=${cr.imageHash.slice(1, 7)}&oe=${exp.getTime().toString(16).toUpperCase()}`,
    expiresAt: exp,
    expired: exp < TODAY
  };
}
function resolvedImageUrl(cr) {
  const exp = addDays(TODAY, 1);
  return {
    url: `https://graph.facebook.com/v23.0/adimages?hashes=["${cr.imageHash}"]` +
         `  →  permanent_url ⇒ https://scontent.xx.example/v/t45/${cr.imageHash}.jpg?oe=${exp.getTime().toString(16).toUpperCase()}`,
    expiresAt: exp, expired: false
  };
}
function mirroredImageUrl(cr) {
  return { url: `https://cdn.adsum.internal/creatives/${cr.ch}/${cr.imageHash}.webp`, expiresAt: null, expired: false };
}

/* 썸네일은 외부 요청 없이 소재 속성으로 그립니다 (데모용 SVG) */
function thumbDataUri(cr) {
  const dark = cr.key === '다크';
  const bg = dark ? '#171a20' : '#eef1f6';
  const fg = dark ? '#f2f3f5' : '#1b1f26';
  const acc = CH_BY_ID[cr.ch].color;
  const shape = cr.format === '영상'
    ? `<polygon points="26,18 42,28 26,38" fill="${acc}"/>`
    : cr.format === '캐러셀'
      ? `<rect x="12" y="20" width="16" height="20" rx="3" fill="${acc}" opacity=".55"/>
         <rect x="32" y="16" width="20" height="28" rx="3" fill="${acc}"/>`
      : `<circle cx="32" cy="26" r="11" fill="${acc}"/>`;
  const person = cr.model
    ? `<circle cx="52" cy="46" r="6" fill="${fg}" opacity=".8"/><path d="M42 60c0-6 5-9 10-9s10 3 10 9z" fill="${fg}" opacity=".55"/>`
    : '';
  const priceTag = cr.price
    ? `<rect x="6" y="50" width="26" height="9" rx="4" fill="${acc}" opacity=".85"/>`
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="${bg}"/>${shape}${person}${priceTag}
    <rect x="0" y="0" width="64" height="64" fill="none" stroke="${acc}" stroke-opacity=".35"/></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* --------------------------- 연동 상태 (관리자) --------------------------- */
const KICKOFF = addDays(TODAY, -11);          // 계약 착수일 가정
const SOURCES = [
  {
    id: 'meta', name: '메타 Marketing API', kind: '광고', color: '#4C8DFF',
    state: 'live', since: addDays(KICKOFF, 2),
    detail: '시스템 사용자 토큰(60일) · ads_read 권한',
    tokenExp: addDays(TODAY, 41)
  },
  {
    id: 'google', name: '구글 Ads API', kind: '광고', color: '#FFB020',
    state: 'live', since: addDays(KICKOFF, 3),
    detail: 'OAuth 리프레시 토큰 · developer token(기본 액세스)',
    tokenExp: null
  },
  {
    id: 'naver', name: '네이버 검색광고 API', kind: '광고', color: '#00C950',
    state: 'live', since: addDays(KICKOFF, 1),
    detail: 'CUSTOMER_ID + 서명 인증 · StatReport 일별',
    tokenExp: null
  },
  {
    id: 'kakao', name: '카카오모먼트 오픈API', kind: '광고', color: '#FEE500',
    state: 'review', since: null,
    detail: '비즈니스 앱 전환 → 본인인증 → 추가 기능 신청(심사 중)',
    fallback: 'CSV 수동 업로드로 임시 수집 중 — 담당자가 카카오모먼트 관리자에서 ' +
              '일 1회 내려받아 올립니다. 자동 수집이 아니므로 누락·지연이 발생할 수 있습니다.',
    appliedAt: addDays(KICKOFF, 1), tokenExp: null
  },
  {
    id: 'commerce', name: '네이버 커머스API(스마트스토어 주문)', kind: '매출', color: '#A78BFA',
    state: 'live', since: addDays(KICKOFF, 4),
    detail: '★ 공고에 없던 소스 — 실매출 기준선이 없으면 ROAS를 검증할 수 없습니다',
    tokenExp: null
  }
];

/* --------------------------- 리스크 검토 항목 --------------------------- */
const RISKS = [
  {
    id: 'R1', level: 'high', title: '"매출"을 주는 API가 4개 중 어디에도 없습니다',
    body: '요구사항 2-2는 광고비·매출·ROAS를 함께 표기하라고 합니다. 그런데 광고 API가 주는 매출은 ' +
          '각 매체가 자체 추적한 전환매출입니다. 판매 채널이 스마트스토어인데 스마트스토어는 외부 ' +
          '스크립트 설치가 자유롭지 않아 메타 픽셀을 직접 심을 수 없습니다. 별도 솔루션을 경유하지 ' +
          '않으면 메타·카카오·구글이 신고하는 매출이 0이거나 심하게 과소로 나옵니다.',
    fix: '네이버 커머스API(주문)를 5번째 소스로 붙여 실매출을 단일 기준선으로 삼았습니다. ' +
         '대시보드 상단 [매출 기준] 세그먼트에서 세 가지 기준을 전환하면 ROAS가 실제로 바뀝니다.',
    where: '대시보드 상단 [매출 기준] · 관리자 [연동 상태] 5번째 행'
  },
  {
    id: 'R2', level: 'high', title: '채널 ROAS를 더하면 실매출을 넘습니다',
    body: '매체마다 기여 인정 기간이 다릅니다. 메타는 클릭 7일, 구글은 기본 30일, 네이버는 간접전환 ' +
          '추적기간 설정값입니다. 한 건의 주문을 세 매체가 각각 자기 성과로 전액 신고하므로 ' +
          '단순 합산은 구조적으로 부풀려집니다.',
    fix: '중복 진단 카드에서 [채널 합산]과 [광고 기여(중복 제거)]의 차이를 금액과 비율로 계산해 ' +
         '보여줍니다. 합계 지표는 MER(전체 실매출÷총 광고비)을 기본값으로 두었습니다.',
    where: '대시보드 [중복 진단] 카드'
  },
  {
    id: 'R3', level: 'high', title: '일별 1회 수집이면 어제 숫자가 영원히 틀립니다',
    body: '전환은 지연 도착합니다. 구글은 전환 지연으로 과거 리포팅 값이 몇 주간 계속 갱신되고, ' +
          '메타도 어트리뷰션 재계산이 소급됩니다. D+1에 한 번 긁고 끝내면 그 날짜는 성숙도 ' +
          '38% 수준에서 굳어버립니다.',
    fix: '상단 [수집 방식] 토글로 1회 수집 ↔ 롤링 재수집(최근 N일 재조회 후 덮어쓰기)을 ' +
         '전환할 수 있습니다. 누르면 과거 60일 수치 전체가 실제로 달라집니다. ' +
         '최근 구간은 확정/잠정 배지로 구분합니다.',
    where: '대시보드 상단 [수집 방식] 토글 · 관리자 [배치 로그]'
  },
  {
    id: 'R4', level: 'mid', title: '소재 이미지 URL은 저장하면 깨집니다',
    body: '요구사항 2-2의 "이미지 바로보기(URL 연동)"를 문자 그대로 구현하면 실패합니다. ' +
          '메타의 image_url·thumbnail_url은 서명이 붙은 임시 URL이고 영구 링크가 없습니다. ' +
          '호출할 때마다 새 URL이 발급되며 이전 URL은 만료됩니다.',
    fix: '소재 표의 이미지 버튼에서 세 가지 방식을 직접 비교할 수 있게 했습니다. ' +
         '① 저장된 URL(실제로 만료 오류 재현) ② image_hash로 조회 시점 재해결 ③ 자체 스토리지 사본.',
    where: '대시보드 [소재] 표 → 이미지 버튼'
  },
  {
    id: 'R5', level: 'mid', title: '전환 0건 소재는 목표 CPA 초과 목록에서 사라집니다',
    body: 'CPA는 광고비÷전환수입니다. 전환이 0이면 정의되지 않으므로 "목표 CPA 초과" 비교에 ' +
          '걸리지 않습니다. 정작 위험한 소재(돈만 쓰고 전환 0)가 목록에서 빠집니다. ' +
          '반대로 전환 1~2건짜리 소재를 하루 성과로 끄면 표본 부족으로 인한 오판입니다.',
    fix: '판정을 정상 / 목표 초과 / 무전환 소진 / 판정 보류 4단계로 나누고, 최소 전환수와 ' +
         '무전환 소진 배수를 화면에서 조절할 수 있게 했습니다. ' +
         '[요구사항 그대로] 토글을 켜면 몇 건이 사라지는지 숫자로 나옵니다.',
    where: '대시보드 [목표 CPA 트래킹] 판정 기준'
  },
  {
    id: 'R6', level: 'mid', title: '카카오모먼트는 개발 기간 안에 안 끝날 수 있습니다',
    body: '카카오모먼트 API는 비즈니스 앱 전환 → 앱 소유자 본인인증 → 추가 기능(권한) 신청 심사를 ' +
          '통과해야 호출할 수 있습니다. 심사 기간이 공식적으로 명시돼 있지 않아 통제 불가능한 ' +
          '변수입니다. 공고 우대사항에 이 항목이 들어 있는 것으로 보아 이미 인지하고 계신 것 같습니다.',
    fix: '착수 첫날 신청을 걸고, 3채널 자동 수집 선오픈 + 카카오 후결합 구조로 설계했습니다. ' +
         '심사가 끝날 때까지는 카카오모먼트 관리자에서 내려받은 CSV를 업로드해 공백 없이 채웁니다. ' +
         '데모의 카카오 수치도 "수동 수집" 배지가 붙어 있습니다 — 자동이 아니라는 것을 화면에서 구분합니다. ' +
         '표준 스키마를 먼저 확정해 두면 카카오는 어댑터 한 장만 추가하면 전환됩니다.',
    where: '관리자 [연동 상태] 카카오 행 · 대시보드 [채널별 성과] 카카오 배지'
  },
  {
    id: 'R7', level: 'mid', title: 'LLM 인사이트에 사내 매출이 그대로 실려 나갑니다',
    body: '"MCP·클로드 등을 최대한 활용"하려면 프롬프트에 광고비와 매출이 들어갑니다. ' +
          '사내용이라 해도 외부 모델 API로 나가는 순간 사내 데이터의 외부 전송입니다.',
    fix: '정량 스코어링(무엇이 잘 됐는지의 판단)은 서버에서 계산하고, LLM은 그 결과를 ' +
         '문장으로 옮기는 역할만 맡깁니다. 전송 필드를 화이트리스트로 제한하고, ' +
         '실제로 나가는 JSON을 화면에서 미리 볼 수 있게 했습니다.',
    where: '대시보드 [인사이트] → 전송 페이로드 미리보기'
  },
  {
    id: 'R8', level: 'low', title: '"베스트 소재"를 ROAS만으로 뽑으면 소액 소재가 1등이 됩니다',
    body: '주간 ROAS 기준 정렬은 광고비 3만원 쓰고 우연히 1건 팔린 소재를 최상단에 올립니다. ' +
          '다음 광고 기획에 그 소재를 참고하면 잘못된 학습입니다.',
    fix: '최소 소진액과 최소 전환수를 만족한 소재만 베스트/워스트 후보로 올립니다. ' +
         '기준 미달 소재는 별도로 "표본 부족" 목록에 보여 줍니다.',
    where: '대시보드 [베스트 / 워스트]'
  }
];

/* --------------------------- 지표 매핑 (관리자) --------------------------- */
const FIELD_MAP = [
  { std: 'date',        label: '일자',        meta: 'date_start', google: 'segments.date', kakao: 'start', naver: 'statDt' },
  { std: 'spend',       label: '광고비',      meta: 'spend', google: 'metrics.cost_micros ÷ 1e6', kakao: 'cost', naver: 'salesAmt' },
  { std: 'impressions', label: '노출',        meta: 'impressions', google: 'metrics.impressions', kakao: 'imp', naver: 'impCnt' },
  { std: 'clicks',      label: '클릭',        meta: 'clicks(link_click 권장)', google: 'metrics.clicks', kakao: 'click', naver: 'clkCnt' },
  { std: 'conversions', label: '전환수',      meta: 'actions[purchase]', google: 'metrics.conversions', kakao: 'convPurchase', naver: 'ccnt(직접+간접)' },
  { std: 'conv_value',  label: '전환매출',    meta: 'action_values[purchase]', google: 'metrics.conversions_value', kakao: 'convPurchaseAmount', naver: 'convAmt' },
  { std: 'currency',    label: '통화',        meta: 'account_currency', google: 'customer.currency_code', kakao: '(KRW 고정)', naver: '(KRW 고정)' },
  { std: 'creative_id', label: '소재 식별자', meta: 'ad_id / creative_id', google: 'ad_group_ad.ad.id', kakao: 'creativeId', naver: 'adId(소재 단위 없음 → 키워드 단위)' }
];

/* --------------------------- 포맷터 --------------------------- */
const fmt = {
  won: n => '₩' + Math.round(n).toLocaleString('ko-KR'),
  wonShort: n => {
    const a = Math.abs(n);
    if (a >= 1e8) return (n / 1e8).toFixed(a >= 1e9 ? 0 : 1) + '억';
    if (a >= 1e4) return Math.round(n / 1e4).toLocaleString('ko-KR') + '만';
    return Math.round(n).toLocaleString('ko-KR');
  },
  int: n => Math.round(n).toLocaleString('ko-KR'),
  pct: (n, d = 1) => (n * 100).toFixed(d) + '%',
  roas: n => (n * 100).toFixed(0) + '%',
  date: d => (d.getMonth() + 1) + '/' + d.getDate(),
  dateFull: d => d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0'),
  days: (a, b) => Math.round((b - a) / 86400000)
};

window.ADSUM = {
  TODAY, DAYS, CHANNELS, CH_BY_ID, CREATIVES, CR_BY_ID, DAILY, SOURCES, RISKS, FIELD_MAP,
  KICKOFF, COLLECTED_AT, FORMATS, TONES, KEYS,
  aggregate, creativeStats, judge, judgeNaive, maturity, observed,
  storedImageUrl, resolvedImageUrl, mirroredImageUrl, thumbDataUri,
  fmt, dayKey, addDays, mulberry32
};
