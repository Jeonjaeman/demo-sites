/* ==========================================================================
   PINDEX — 목데이터 생성기 (전부 결정론적으로 계산됩니다. 하드코딩 수치 없음)

   설계 의도
   ─────────────────────────────────────────────────────────────────────────
   1) 실거래가 원본에는 좌표가 없습니다.
      국토부 실거래가 API는 법정동코드(5)+계약년월로 조회하고, 응답에는
      법정동명·지번·단지명만 옵니다. GPS 좌표가 없습니다.
      그래서 이 데이터도 raw 레코드에는 좌표를 넣지 않고, 별도의
      '지오코딩 결과' 테이블에서 매칭합니다. 매칭 실패분은 지도에 못 찍힙니다.
      → 이것이 화면의 [지오코딩 파이프라인]에서 그대로 드러납니다.

   2) 마커 성능은 실제로 그려서 잽니다.
      캔버스에 N개를 그리고 프레임 시간을 측정합니다. 클러스터링 on/off 비교도
      같은 방식입니다. 수치를 지어내지 않습니다.

   ※ 단지명·지번·가격은 전부 가상입니다. 실존 단지와 무관합니다.
   ========================================================================== */
(function (global) {
  'use strict';

  /* --------------------------- 결정론적 난수 --------------------------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* --------------------------- 자치구 (가상 좌표 박스) --------------------------- */
  /* 법정동코드 앞 5자리 = 실거래가 API 조회 단위 */
  var GU = [
    { code: '11110', name: '종로구', lon: 126.979, lat: 37.573 },
    { code: '11140', name: '중구',   lon: 126.997, lat: 37.564 },
    { code: '11170', name: '용산구', lon: 126.965, lat: 37.532 },
    { code: '11200', name: '성동구', lon: 127.037, lat: 37.563 },
    { code: '11215', name: '광진구', lon: 127.082, lat: 37.538 },
    { code: '11230', name: '동대문구', lon: 127.040, lat: 37.574 },
    { code: '11305', name: '강북구', lon: 127.011, lat: 37.640 },
    { code: '11440', name: '마포구', lon: 126.908, lat: 37.563 },
    { code: '11500', name: '강서구', lon: 126.849, lat: 37.551 },
    { code: '11530', name: '구로구', lon: 126.887, lat: 37.495 },
    { code: '11590', name: '동작구', lon: 126.951, lat: 37.512 },
    { code: '11620', name: '관악구', lon: 126.951, lat: 37.478 },
    { code: '11650', name: '서초구', lon: 127.032, lat: 37.484 },
    { code: '11680', name: '강남구', lon: 127.048, lat: 37.517 },
    { code: '11710', name: '송파구', lon: 127.106, lat: 37.514 },
    { code: '11740', name: '강동구', lon: 127.147, lat: 37.530 }
  ];

  var DONG = ['1가', '2가', '3가', '본동', '신동', '중앙동', '남동', '북동'];
  var NAME1 = ['한빛', '푸른', '해오름', '가온', '나래', '다온', '라온', '미르', '새록', '아람',
               '온새미', '자미', '하늘', '너울', '도담', '벼리'];
  var NAME2 = ['아파트', '팰리스', '리버뷰', '파크', '스카이', '포레', '센트럴', '더힐'];
  var TRADE = [
    { id: 'sale',   name: '매매',  color: '#2b6fff' },
    { id: 'jeonse', name: '전세',  color: '#7a3fd6' },
    { id: 'rent',   name: '월세',  color: '#c2571f' }
  ];
  var TRADE_BY = {}; TRADE.forEach(function (t) { TRADE_BY[t.id] = t; });

  /* --------------------------- 원본 레코드 생성 ---------------------------
     실거래가 API 응답을 흉내냅니다 — 좌표 없음. */
  function buildRaw() {
    var rnd = mulberry32(20260803);
    var rows = [];
    var id = 1;
    GU.forEach(function (gu, gi) {
      // 강남 3구는 단지 수와 가격이 높게
      var premium = /강남구|서초구|송파구/.test(gu.name) ? 1 : 0;
      var n = 120 + Math.floor(rnd() * 60) + premium * 40;
      for (var i = 0; i < n; i++) {
        var name = NAME1[Math.floor(rnd() * NAME1.length)] + NAME2[Math.floor(rnd() * NAME2.length)];
        var t = TRADE[rnd() < 0.55 ? 0 : (rnd() < 0.6 ? 1 : 2)];
        var area = [39, 49, 59, 74, 84, 101, 114, 134][Math.floor(rnd() * 8)];   // 전용 m²
        var built = 1988 + Math.floor(rnd() * 36);
        var households = 80 + Math.floor(rnd() * 2200);
        var floor = 1 + Math.floor(rnd() * 28);
        /* 가격(만원) — ㎡당 단가 × 전용면적. 실제 서울 시세대(2026 기준)에 맞춥니다.
           비강남 84㎡ 매매 ≈ 10억 / 강남3구 84㎡ ≈ 25억 수준이 나오도록 잡았습니다. */
        var perM2 = t.id === 'sale'   ? 1190 * (1 + premium * 1.50)
                  : t.id === 'jeonse' ?  700 * (1 + premium * 1.30)
                  :                      1.7 * (1 + premium * 0.90);   // 월세는 만원/월
        var ageAdj = 1 - Math.min(0.28, (2026 - built) * 0.006);
        var raw = area * perM2 * ageAdj * (0.82 + rnd() * 0.4);
        var price = t.id === 'rent'
          ? Math.round(raw / 5) * 5                       // 월세는 5만원 단위
          : Math.round(raw / 100) * 100;                  // 매매·전세는 100만원 단위
        var deposit = t.id === 'rent'
          ? Math.round(price * (20 + rnd() * 60) / 100) * 100   // 보증금 = 월세의 20~80배
          : 0;
        rows.push({
          id: 'p' + (id++),
          lawdCd: gu.code,
          gu: gu.name,
          dong: gu.name.replace('구', '') + DONG[Math.floor(rnd() * DONG.length)],
          jibun: (1 + Math.floor(rnd() * 900)) + '-' + (1 + Math.floor(rnd() * 40)),
          name: name,
          trade: t.id,
          area: area,
          floor: floor,
          built: built,
          households: households,
          price: price,           // 매매가/전세가/월세(만원)
          deposit: deposit,       // 월세 보증금
          dealYm: '2026' + String(1 + Math.floor(rnd() * 7)).padStart(2, '0'),
          _gi: gi                 // 좌표 생성용(내부)
        });
      }
    });
    return rows;
  }
  var RAW = buildRaw();

  /* --------------------------- 지오코딩 결과 테이블 ---------------------------
     실거래가 응답에 좌표가 없으므로 별도로 매칭해야 합니다.
     현실을 그대로 반영해 3가지 상태로 나눕니다.
       hit    : 좌표 캐시에 이미 있음 (재조회 불필요)
       geo    : 지오코딩 API를 호출해 좌표를 얻음 (쿼터 소모)
       fail   : 주소 표기 불일치로 매칭 실패 → 지도에 찍히지 않음
     구·지번 표기가 옛 지번이거나 블록 표기면 실패율이 올라갑니다. */
  function buildGeo() {
    var rnd = mulberry32(90112026);
    var map = {};
    var stat = { hit: 0, geo: 0, fail: 0 };
    RAW.forEach(function (r) {
      var gu = GU[r._gi];
      var roll = rnd();
      var state = roll < 0.72 ? 'hit' : (roll < 0.955 ? 'geo' : 'fail');
      stat[state]++;
      if (state === 'fail') { map[r.id] = { state: state }; return; }
      // 구 중심에서 흩뿌림 (가상 좌표)
      var a = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
      map[r.id] = {
        state: state,
        lon: gu.lon + Math.cos(a) * d * 0.030,
        lat: gu.lat + Math.sin(a) * d * 0.021
      };
    });
    return { map: map, stat: stat };
  }
  var GEO = buildGeo();

  /* 원본 + 좌표를 합친 화면용 레코드 */
  var ITEMS = RAW.map(function (r) {
    var g = GEO.map[r.id];
    var o = {};
    for (var k in r) if (k !== '_gi') o[k] = r[k];
    o.geoState = g.state;
    o.lon = g.lon; o.lat = g.lat;
    o.plotted = g.state !== 'fail';
    return o;
  });

  /* --------------------------- 좌표 범위 --------------------------- */
  var BOUNDS = (function () {
    var xs = ITEMS.filter(function (i) { return i.plotted; });
    return {
      lon0: Math.min.apply(null, xs.map(function (i) { return i.lon; })),
      lon1: Math.max.apply(null, xs.map(function (i) { return i.lon; })),
      lat0: Math.min.apply(null, xs.map(function (i) { return i.lat; })),
      lat1: Math.max.apply(null, xs.map(function (i) { return i.lat; }))
    };
  })();

  /* --------------------------- 필터 (호갱노노 축) --------------------------- */
  var FILTERS = {
    trade: { label: '거래유형', opts: [['sale', '매매'], ['jeonse', '전세'], ['rent', '월세']] },
    area: {
      label: '평형',
      opts: [['s', '~59㎡'], ['m', '60~84㎡'], ['l', '85~114㎡'], ['xl', '115㎡~']],
      test: function (i, v) {
        return v === 's' ? i.area < 60 : v === 'm' ? (i.area >= 60 && i.area < 85)
             : v === 'l' ? (i.area >= 85 && i.area < 115) : i.area >= 115;
      }
    },
    price: {
      label: '가격',
      opts: [['p1', '~5억'], ['p2', '5~10억'], ['p3', '10~20억'], ['p4', '20억~']],
      test: function (i, v) {
        var p = i.price;   // 만원
        return v === 'p1' ? p < 50000 : v === 'p2' ? (p >= 50000 && p < 100000)
             : v === 'p3' ? (p >= 100000 && p < 200000) : p >= 200000;
      }
    },
    households: {
      label: '세대수',
      opts: [['h1', '~300'], ['h2', '300~1000'], ['h3', '1000~']],
      test: function (i, v) {
        return v === 'h1' ? i.households < 300 : v === 'h2' ? (i.households >= 300 && i.households < 1000) : i.households >= 1000;
      }
    },
    built: {
      label: '입주년차',
      opts: [['b1', '5년 이내'], ['b2', '5~15년'], ['b3', '15~30년'], ['b4', '30년~']],
      test: function (i, v) {
        var age = 2026 - i.built;
        return v === 'b1' ? age <= 5 : v === 'b2' ? (age > 5 && age <= 15)
             : v === 'b3' ? (age > 15 && age <= 30) : age > 30;
      }
    }
  };

  function applyFilters(state) {
    return ITEMS.filter(function (i) {
      if (!i.plotted && state.onlyPlotted) return false;
      if (state.trade.length && state.trade.indexOf(i.trade) < 0) return false;
      for (var key of ['area', 'price', 'households', 'built']) {
        var sel = state[key];
        if (sel.length && !sel.some(function (v) { return FILTERS[key].test(i, v); })) return false;
      }
      if (state.q) {
        var q = state.q.trim();
        if (q && (i.name + ' ' + i.gu + ' ' + i.dong).indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  /* --------------------------- 클러스터링 (그리드 기반) --------------------------- */
  function cluster(list, project, cell) {
    var buckets = {};
    for (var i = 0; i < list.length; i++) {
      var p = project(list[i]);
      var kx = Math.floor(p.x / cell), ky = Math.floor(p.y / cell);
      var key = kx + ',' + ky;
      var b = buckets[key];
      if (!b) { b = buckets[key] = { n: 0, sx: 0, sy: 0, one: null }; }
      b.n++; b.sx += p.x; b.sy += p.y;
      if (b.n === 1) b.one = list[i];
    }
    var out = [];
    for (var k in buckets) {
      var v = buckets[k];
      out.push({ x: v.sx / v.n, y: v.sy / v.n, n: v.n, item: v.n === 1 ? v.one : null });
    }
    return out;
  }

  /* --------------------------- 요구사항 경계 (프론트/백엔드) ---------------------------
     공고가 프론트 과업으로 잡은 항목 중, 브라우저에서 원리적으로 못 하는 것을 가릅니다. */
  var BOUNDARY = [
    {
      req: '2-1 반응형 퍼블리싱 · 라우팅 · 전역 상태(Zustand)',
      where: 'front', ok: true,
      why: '순수 프론트엔드 작업. 이 데모의 화면 전체가 그 결과물입니다.'
    },
    {
      req: '2-2 카카오 지도 초기화 · 마커 · 요약 오버레이',
      where: 'front', ok: true,
      why: 'JavaScript 키는 도메인 등록으로 보호되므로 프론트에 두는 것이 정상입니다.'
    },
    {
      req: '2-2 백엔드 API 데이터로 마커 표시',
      where: 'front', ok: true,
      why: '백엔드가 좌표를 내려준다는 전제라면 프론트 작업입니다. 좌표를 안 주면 아래 항목이 됩니다.'
    },
    {
      req: '2-3 공공데이터 API 연동 · 프론트 데이터 바인딩',
      where: 'back', ok: false,
      why: '서비스키가 URL 쿼리에 들어가고 공공데이터포털 키에는 도메인 제한이 없습니다. ' +
           '프론트에서 호출하면 네트워크 탭에 그대로 노출되고, 유출 즉시 남이 일일 한도를 소진합니다. ' +
           '커스텀 헤더를 붙이면 프리플라이트(OPTIONS)에 ACAO가 없어 요청 자체가 실패합니다(실측).'
    },
    {
      req: '2-3 소셜 로그인(OAuth) · JWT 토큰 처리',
      where: 'mixed', ok: true,
      why: '인가 코드 교환과 토큰 발급은 백엔드, 토큰 보관·갱신·인터셉터는 프론트. 경계 합의가 필요합니다.'
    },
    {
      req: '2-4 PG 결제 모듈 연동 · 성공/실패/취소 라우팅',
      where: 'mixed', ok: true,
      why: '결제창 호출과 결과 라우팅은 프론트. 다만 결제 승인·금액 검증은 반드시 서버에서 PG API로 재확인해야 합니다.'
    },
    {
      req: '3-2 결제·공공 API 호출 시 안전한 토큰 관리',
      where: 'back', ok: false,
      why: '브라우저에 내려간 값은 전부 열람 가능합니다. 프론트에서 "안전한 토큰 관리"는 원리적으로 성립하지 않습니다. ' +
           '서버 프록시가 유일한 답이며, 그 엔드포인트가 이미 있는지가 착수 전 1순위 확인 항목입니다.'
    }
  ];

  /* --------------------------- 착수 전 검토 --------------------------- */
  var RISKS = [
    {
      id: 'R1', level: 'high',
      title: '"프론트엔드 프로젝트"인데 프론트에서 못 하는 항목이 두 개 있습니다',
      body: '공고 2-3(공공 API 연동)과 3-2(안전한 토큰 관리)는 브라우저 단독으로 성립하지 않습니다. ' +
            '공공데이터포털 서비스키는 URL 쿼리에 들어가고 도메인 제한 기능이 없어, 프론트에서 호출하면 ' +
            '네트워크 탭에 그대로 보입니다. 유출되면 남이 일일 한도(기본 1,000회)를 소진합니다.',
      fix: '백엔드에 공공 API 프록시 엔드포인트가 이미 있는지 확인해야 합니다. 없다면 프론트 단독으로는 ' +
           '이 항목을 완료할 수 없고, 백엔드 작업이 추가로 필요합니다. 데모의 [프론트 경계선] 화면에서 ' +
           '브라우저로 실제 호출해 키가 노출되는 것을 그대로 보여줍니다.',
      where: '관리자 [프론트 경계선]'
    },
    {
      id: 'R2', level: 'high',
      title: '실거래가 API 응답에는 좌표가 없습니다',
      body: '국토부 실거래가 API는 법정동코드 5자리 + 계약년월로 조회하고, 응답에는 법정동명·지번·단지명만 ' +
            '옵니다. GPS 좌표가 없어 그대로는 지도에 핀을 찍을 수 없습니다. 지오코딩이 필요하고, ' +
            '카카오 로컬 API 쿼터(일 10만)를 소모합니다.',
      fix: '서버에서 1회 지오코딩 후 좌표를 캐시하는 구조를 제안합니다. 매 조회마다 지오코딩하면 쿼터가 ' +
           '녹고 화면도 느려집니다. 데모 [지오코딩 파이프라인]에서 캐시 히트/신규 지오코딩/매칭 실패를 ' +
           '실제 데이터로 계산해 보여줍니다 — 실패분은 지도에서 실제로 빠집니다.',
      where: '관리자 [지오코딩 파이프라인] · 지도의 "미표시" 카운트'
    },
    {
      id: 'R3', level: 'high',
      title: '마커가 1,000개를 넘으면 지도가 버벅입니다',
      body: '공고 3-1은 "지도 렌더링 지연 최소화"를 요구합니다. 카카오맵 데브톡에 마커 1,000개 이상에서 ' +
            '렌더링 지연, 2만 개 클러스터링에 10초 이상이라는 보고가 있습니다. 서울 전역 매물은 ' +
            '쉽게 수천 건이 됩니다.',
      fix: '클러스터링과 뷰포트 기반 로딩을 기본값으로 두었습니다. 데모의 [성능] 패널에서 클러스터링을 ' +
           '끄고 켜 보면 프레임 시간이 실제로 측정되어 바뀝니다 — 지어낸 수치가 아닙니다.',
      where: '지도 좌하단 [성능] 패널'
    },
    {
      id: 'R4', level: 'mid',
      title: 'PG 결제는 프론트 콜백만 믿으면 금액을 위조할 수 있습니다',
      body: '공고 2-4는 "결제 모듈 프론트엔드 연동 및 성공/실패/취소 라우팅"만 프론트 과업으로 적었습니다. ' +
            '그런데 결제 성공 콜백의 금액을 그대로 신뢰하면 클라이언트에서 값을 바꿔 0원 결제를 만들 수 있습니다.',
      fix: '결제 승인은 서버가 PG API로 재조회해 주문 금액과 대조해야 합니다. 백엔드에 결제 검증 ' +
           '엔드포인트가 있는지 확인이 필요합니다. 데모 [결제 검증]에서 프론트 값을 바꿔 보면 ' +
           '서버 검증이 있을 때와 없을 때가 갈립니다.',
      where: '관리자 [결제 검증]'
    },
    {
      id: 'R5', level: 'mid',
      title: '계약 30일과 오픈 희망일 9월 중순 사이에 2주가 빕니다',
      body: '착수 2026-08-03 + 30일 = 9월 2일입니다. 마일스톤도 4주 내(8/31) PG 연동 완료로 잡혀 있습니다. ' +
            '그런데 최종 오픈 희망일은 9월 중순입니다. 그 사이 약 2주가 계약 기간 밖에 있습니다.',
      fix: '그 2주가 QA·안정화 기간이라면 계약 범위에 포함할지, 별도로 볼지 착수 전에 정해야 합니다. ' +
           '적지 않으면 무상 대응 구간이 됩니다.',
      where: '관리자 [일정]'
    },
    {
      id: 'R6', level: 'mid',
      title: '일부 공공 API는 국내 IP에서만 열립니다',
      body: 'Next.js를 Vercel 같은 해외 리전에 올리면 서버사이드에서 공공 API 호출이 차단될 수 있습니다. ' +
            '프록시를 서버에 두기로 해도 그 서버가 어디에 있는지가 문제가 됩니다.',
      fix: '배포 리전을 국내로 고정하거나(예: 서울 리전), 공공 API 호출만 국내 서버를 거치도록 분리합니다. ' +
           '배포 환경은 착수 전 확인 항목입니다.',
      where: '관리자 [검토 항목]'
    },
    {
      id: 'R7', level: 'low',
      title: '"디자인 공수 최소화"인데 카테고리는 디자인·퍼블리싱입니다',
      body: '공고 카테고리는 「디자인 · 웹 · 퍼블리싱·반응형」인데, 실제 과업은 SPA 개발 + 지도 SDK + ' +
            '공공 API + OAuth/JWT + PG 결제 + 게시판입니다. 퍼블리싱 단가로 보기에는 개발 비중이 큽니다.',
      fix: '데모와 공수표로 범위를 먼저 그어 두었습니다. 화면 수와 연동 건수 기준으로 산정합니다.',
      where: '지원서 [견적]'
    }
  ];

  /* --------------------------- 공공 API 실측 (2026-07-29) --------------------------- */
  var PUBLIC_API = {
    testedAt: '2026-07-29',
    endpoint: 'apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev',
    rows: [
      { case: '단순 GET (Origin 포함)', result: '통과', detail: 'Access-Control-Allow-Origin: * 응답. 브라우저에서 읽힙니다', ok: true },
      { case: 'CORS 프리플라이트 (OPTIONS)', result: '실패', detail: '204 응답에 Access-Control-Allow-Origin 헤더 없음', ok: false },
      { case: '커스텀 헤더 붙인 GET', result: '실패', detail: '프리플라이트가 막혀 TypeError: Failed to fetch', ok: false },
      { case: '서비스키 노출', result: '노출', detail: 'serviceKey 가 URL 쿼리에 그대로. 도메인 제한 기능 없음', ok: false }
    ],
    conclusion: 'CORS 자체는 단순 GET이면 통과합니다. 문제는 CORS가 아니라 키입니다 — ' +
                '프론트에서 호출하는 순간 서비스키가 네트워크 탭에 남고, 도메인 제한이 없어 ' +
                '누구나 그 키로 호출할 수 있습니다. 공고 3-2 "안전한 토큰 관리"는 ' +
                '브라우저에서 성립하지 않습니다.'
  };

  /* --------------------------- 일정 --------------------------- */
  var SCHEDULE = {
    start: '2026-08-03',
    contractDays: 30,
    contractEnd: '2026-09-02',
    milestones: [
      { at: '2026-08-16', label: '2주 — UI 퍼블리싱 + 지도 연동', inContract: true },
      { at: '2026-08-31', label: '4주 — 공공 API + PG 결제 연동 완료', inContract: true }
    ],
    openHope: '2026-09-15',
    gapDays: 13
  };

  /* --------------------------- 포맷터 --------------------------- */
  var fmt = {
    /* 만원 단위 → 억/만원 표기 */
    price: function (man) {
      if (man >= 10000) {
        var eok = Math.floor(man / 10000), rest = man % 10000;
        return eok + '억' + (rest ? ' ' + rest.toLocaleString('ko-KR') : '');
      }
      return man.toLocaleString('ko-KR') + '만';
    },
    priceOf: function (i) {
      if (i.trade === 'rent') return fmt.price(i.deposit) + ' / ' + i.price.toLocaleString('ko-KR') + '만';
      return fmt.price(i.price);
    },
    int: function (n) { return Math.round(n).toLocaleString('ko-KR'); },
    pct: function (n, d) { return (n * 100).toFixed(d === undefined ? 1 : d) + '%'; },
    area: function (a) { return a + '㎡ (' + Math.round(a / 3.3058) + '평)'; },
    age: function (b) { var a = 2026 - b; return a <= 0 ? '신축' : a + '년차'; }
  };

  global.PX = {
    GU: GU, TRADE: TRADE, TRADE_BY: TRADE_BY,
    ITEMS: ITEMS, RAW: RAW, GEO: GEO, BOUNDS: BOUNDS,
    FILTERS: FILTERS, applyFilters: applyFilters, cluster: cluster,
    BOUNDARY: BOUNDARY, RISKS: RISKS, PUBLIC_API: PUBLIC_API, SCHEDULE: SCHEDULE,
    fmt: fmt, mulberry32: mulberry32
  };
})(window);
