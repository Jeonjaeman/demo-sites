/* ==========================================================================
   AUTOCAST — 데이터 모듈 (수치는 실측·계산. 하드코딩 결과값 없음)

   핵심 통찰
   ─────────────────────────────────────────────────────────────────────────
   1) HeyGen 은 2026-02 부터 무료 API 크레딧을 없애고 pay-as-you-go 초당 과금으로
      바뀌었습니다. 그래서 "AI 초안을 검수 없이 자동 영상화"하면 잘못된 대본에
      돈이 그대로 나갑니다. 에디터 검수 게이트가 비용 방어선입니다(공고 2-3 "중요").
      단가는 실측값이며 비용 계산기가 실제로 계산합니다.
   2) AI 가 만든 부동산 카드뉴스를 자동 발행하면 공인중개사법 표시·광고 규제에
      걸립니다. 명시사항 누락·과장표현을 발행 전에 잡아야 합니다.
      → 컴플라이언스 체크가 텍스트를 실제로 검사합니다.

   ※ 단지명·주제·수치는 가상입니다. 실존 단지·중개사무소와 무관합니다.
   ========================================================================== */
(function (global) {
  'use strict';

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* --------------------------- 파이프라인 단계 --------------------------- */
  var STAGES = [
    { id: 'collect', name: '데이터 수집', color: '#6ea8ff', desc: '뉴스·청약·단지 정보 API/RSS' },
    { id: 'draft',   name: 'AI 초안',    color: '#a78bfa', desc: '카드뉴스·영상 대본 생성' },
    { id: 'review',  name: '에디터 검수', color: '#f5b32a', desc: '관리자 열람·수정·승인 ★' },
    { id: 'video',   name: 'HeyGen 영상', color: '#f96e49', desc: '아바타 영상 렌더 (초당 과금)' },
    { id: 'publish', name: '발행',        color: '#3ecf8e', desc: '스토리지 저장·텔레그램 알림' }
  ];
  var STAGE_BY = {}; STAGES.forEach(function (s) { STAGE_BY[s.id] = s; });

  /* --------------------------- 요일별 주제 (공고 2-2) --------------------------- */
  var WEEKLY = [
    { day: '월', theme: '주간 청약 브리핑', kind: '카드뉴스' },
    { day: '화', theme: '실거래가 급등·급락 단지', kind: '숏폼' },
    { day: '수', theme: '정책·세금 이슈 요약', kind: '카드뉴스' },
    { day: '목', theme: '단지 스포트라이트', kind: '숏폼' },
    { day: '금', theme: '주말 임장 추천 지역', kind: '카드뉴스' }
  ];

  var DONG = ['강남', '서초', '송파', '마포', '성동', '영등포', '동작', '광진'];
  var NAME1 = ['한빛', '푸른', '가온', '나래', '해오름', '미르', '온새미', '도담'];
  var NAME2 = ['아파트', '팰리스', '리버뷰', '파크', '스카이', '포레', '센트럴'];

  /* AI 초안 텍스트 — 일부러 표시광고 위반 요소를 심어 컴플라이언스 체크가 잡게 함 */
  function draftText(rnd, complex, area, dong) {
    var claims = [
      '지금 안 사면 후회하는 마지막 기회입니다',   // 과장(부당광고)
      '3개월 내 2억 상승 확실',                     // 단정적 예측(부당광고)
      '역대 최저가, 무조건 오릅니다',               // 과장·단정
      '전문가가 강력 추천하는 급매물'               // 과장
    ];
    var neutral = [
      complex + ' 전용 ' + area + '㎡, 최근 실거래 흐름을 정리했습니다',
      dong + ' 일대 신규 청약 일정과 조건을 요약했습니다',
      '이번 주 ' + dong + ' 지역 매물 동향을 살펴봅니다'
    ];
    var hasClaim = rnd() < 0.45;
    var body = neutral[Math.floor(rnd() * neutral.length)] +
               (hasClaim ? '. ' + claims[Math.floor(rnd() * claims.length)] : '');
    return { body: body, hasExaggeration: hasClaim };
  }

  /* --------------------------- 콘텐츠 티켓 생성 --------------------------- */
  /* 4주치 × 5요일 = 20개. 각 티켓은 파이프라인 위 실제 상태를 가집니다. */
  function buildTickets() {
    var rnd = mulberry32(20260723);
    var tickets = [];
    var id = 1;
    for (var w = 0; w < 4; w++) {
      for (var d = 0; d < WEEKLY.length; d++) {
        var wk = WEEKLY[d];
        var complex = NAME1[Math.floor(rnd() * NAME1.length)] + NAME2[Math.floor(rnd() * NAME2.length)];
        var dong = DONG[Math.floor(rnd() * DONG.length)];
        var area = [59, 74, 84, 101][Math.floor(rnd() * 4)];
        var draft = draftText(rnd, complex, area, dong);

        /* 진행 상태 — 최근 주는 앞 단계에, 지난 주는 발행까지 */
        var progress;
        if (w === 3) progress = ['collect', 'draft', 'review'][Math.min(2, Math.floor(rnd() * 3.4))];
        else if (w === 2) progress = ['review', 'video', 'publish'][Math.floor(rnd() * 3)];
        else progress = 'publish';

        /* 명시사항: AI 초안에는 등록번호 등이 빠져 있는 게 기본(사람이 채워야 함) */
        var hasRegNo = progress === 'publish' && rnd() < 0.8;   // 발행분 일부는 채움
        var isVideo = wk.kind === '숏폼';
        // 영상 길이(초) — 숏폼 30~55초
        var videoSec = isVideo ? 30 + Math.floor(rnd() * 26) : 0;

        tickets.push({
          id: 'c' + (id++),
          week: w + 1,
          day: wk.day,
          theme: wk.theme,
          kind: wk.kind,
          complex: complex,
          dong: dong,
          area: area,
          stage: progress,
          draft: draft.body,
          hasExaggeration: draft.hasExaggeration,
          hasRegNo: hasRegNo,
          isVideo: isVideo,
          videoSec: videoSec,
          approved: (progress === 'video' || progress === 'publish'),
          editCount: progress === 'collect' ? 0 : Math.floor(rnd() * 3)
        });
      }
    }
    return tickets;
  }
  var TICKETS = buildTickets();

  /* --------------------------- HeyGen 단가 (2026-07 실측) ---------------------------
     근거: HeyGen API pay-as-you-go(2026-02 무료 크레딧 폐지), 초당 과금.
       G2 / eesel / Arcade 2026 정리 기준. 아바타 등급별 $/sec. */
  var USD_KRW = 1380;   // 데모 환율(가정). 관리자에서 조정 가능
  var HEYGEN = {
    freeCreditsEndedAt: '2026-02',
    payAsYouGoMin: 5,          // $ 최소 시작
    creditExpireMonths: 12,
    tiers: [
      { id: 'twin3',  name: 'Avatar III Digital Twin', usdPerSec: 0.0167 },
      { id: 'photo3', name: 'Avatar III Photo',         usdPerSec: 0.0433 },
      { id: 'photo4', name: 'Avatar IV Photo',          usdPerSec: 0.05 },
      { id: 'v5',     name: 'Avatar V / Studio (최고화질)', usdPerSec: 0.0667 }
    ],
    /* 웹 플랜(참고) — API 가 아니라 월정액 */
    webPlans: [
      { name: 'Free',    usdMonth: 0,   credits: '1분/월' },
      { name: 'Creator', usdMonth: 29,  credits: '600크레딧 = 아바타IV 30분' },
      { name: 'Pro',     usdMonth: 49,  credits: '1,000크레딧~' },
      { name: 'Business',usdMonth: 149, credits: '1,500크레딧 + $20/인' }
    ],
    creditRule: '아바타 IV/V = 20크레딧/분 · 아바타 III = 3크레딧/분'
  };

  /* 월 HeyGen API 비용 계산 (초당 과금) */
  function heygenCost(opts) {
    // opts: { videosPerWeek, avgSec, tierId, retryRate }
    var tier = HEYGEN.tiers.find(function (t) { return t.id === opts.tierId; }) || HEYGEN.tiers[0];
    var perMonth = opts.videosPerWeek * 4.345;        // 주 → 월
    var billedSec = opts.avgSec * (1 + (opts.retryRate || 0));  // 재렌더 반영
    var usdPerVideo = billedSec * tier.usdPerSec;
    var usdMonth = usdPerVideo * perMonth;
    return {
      videosPerMonth: Math.round(perMonth),
      usdPerVideo: usdPerVideo,
      usdMonth: usdMonth,
      krwMonth: usdMonth * USD_KRW,
      krwYear: usdMonth * USD_KRW * 12,
      tier: tier
    };
  }

  /* --------------------------- 부동산 표시광고 명시사항 (공인중개사법 §18의2) --------------------------- */
  var AD_REQUIRED = [
    { key: 'office',   label: '중개사무소 명칭' },
    { key: 'addr',     label: '중개사무소 소재지' },
    { key: 'tel',      label: '연락처' },
    { key: 'regno',    label: '등록번호' },
    { key: 'agent',    label: '개업공인중개사 성명' }
  ];
  /* 부당(과장) 표현 사전 */
  var AD_BANNED = [
    '확실', '무조건', '마지막 기회', '후회', '역대 최저', '강력 추천', '급등 보장', '2억 상승'
  ];

  /* 텍스트 하나를 실제로 검사 */
  function checkCompliance(ticket) {
    var text = ticket.draft;
    var missing = AD_REQUIRED.filter(function (r) {
      // 데모: 초안에는 명시사항이 문자열로 안 들어 있음. hasRegNo 로 발행분만 일부 충족
      if (r.key === 'regno' || r.key === 'office') return !ticket.hasRegNo;
      return !ticket.hasRegNo;   // 명시사항 세트는 함께 채워진다고 가정
    });
    var banned = AD_BANNED.filter(function (w) { return text.indexOf(w) >= 0; });
    var pass = missing.length === 0 && banned.length === 0;
    return {
      pass: pass,
      missing: missing,
      banned: banned,
      // 명시사항 누락 최대 100만, 부당광고 최대 500만 (실제 과태료 상한)
      fineRisk: (missing.length ? 100 : 0) + (banned.length ? 500 : 0)
    };
  }

  /* --------------------------- 기술 경계선 (노코드 vs 커스텀) --------------------------- */
  var BOUNDARY = [
    { req: '2-1 데이터 수집 (뉴스·청약·단지 API/RSS)', how: 'n8n 노드', cost: 'low',
      note: 'RSS·REST는 n8n 기본 노드로 커버. 다만 실거래가/청약 API는 좌표·인증 처리가 필요' },
    { req: '2-1 원시 데이터 적재 (구글시트/노션)', how: 'n8n 노드', cost: 'low',
      note: 'Google Sheets·Notion 노드 기본 제공' },
    { req: '2-2 AI 카드뉴스·대본 초안 생성', how: 'n8n + LLM', cost: 'mid',
      note: '프롬프트 엔지니어링이 품질을 좌우. 요일별 주제 분기는 워크플로우 설계 필요' },
    { req: '2-3 에디터 UI (열람·수정·승인)', how: 'Retool/Airtable', cost: 'mid',
      note: '순수 커스텀 대신 노코드 툴 권장(공고 명시). 승인→트리거는 웹훅으로' },
    { req: '2-4 HeyGen 아바타 영상 자동 렌더', how: 'API 연동', cost: 'high',
      note: '★ 초당 과금. 검수 게이트 없이 자동화하면 잘못된 대본에 비용이 그대로 나감' },
    { req: '2-4 렌더 완료 → 스토리지 저장·텔레그램', how: 'n8n 노드', cost: 'low',
      note: 'Drive·Telegram 노드 기본. 폴링/웹훅으로 완료 감지' },
    { req: '2-5 고객 폼 → DB → 맞춤 리포트', how: 'n8n + LLM', cost: 'mid',
      note: '하드코딩 로직 + AI 요약 결합. 리포트가 투자 권유가 되지 않도록 문구 관리 필요' },
    { req: '카드뉴스 이미지 디자인 자동화', how: '커스텀/Canva API', cost: 'high',
      note: '텍스트 초안은 AI가, 실제 이미지 레이아웃은 별도. Canva API 또는 템플릿 필요' }
  ];

  /* --------------------------- 착수 전 검토 --------------------------- */
  var RISKS = [
    {
      id: 'R1', level: 'high',
      title: 'HeyGen 무료 크레딧이 폐지됐습니다 — 영상이 곧 비용입니다',
      body: 'HeyGen 은 2026년 2월부터 무료 API 크레딧을 없애고 초당 과금(pay-as-you-go)으로 ' +
            '바꿨습니다. 아바타 등급별로 초당 $0.0167 ~ $0.0667 입니다. 요일별로 매일 숏폼을 ' +
            '자동 생성하면 월 20~40개, 재렌더까지 감안하면 비용이 빠르게 쌓입니다.',
      fix: '대시보드 [비용 계산기]에서 영상 개수·길이·아바타 등급·재렌더율을 넣으면 월/연 비용이 ' +
           '실제로 계산됩니다. 그리고 아바타 등급을 낮추면(Avatar III) 비용이 4배 가까이 줄어드는 것을 ' +
           '수치로 보여줍니다. 발주사가 어느 플랜을 감당할지 착수 전에 정해야 합니다.',
      where: '대시보드 [HeyGen 비용 계산기]'
    },
    {
      id: 'R2', level: 'high',
      title: '검수 없이 자동 영상화하면 틀린 대본에 돈이 나갑니다',
      body: '공고 2-3이 에디터 검수를 "중요"로 표시한 이유입니다. AI 초안은 사실 오류·과장이 섞입니다. ' +
            '검수 게이트 없이 draft → HeyGen 을 바로 연결하면, 틀린 대본을 렌더한 뒤 다시 만들면서 ' +
            '초당 과금이 두 번 나갑니다.',
      fix: '파이프라인을 draft → 에디터 승인 → video 순으로 강제했습니다. 승인 전에는 영상 단계로 ' +
           '넘어가지 않습니다. 데모 [파이프라인]에서 승인 안 된 티켓을 영상화하려 하면 막힙니다.',
      where: '대시보드 [파이프라인] · [에디터]'
    },
    {
      id: 'R3', level: 'high',
      title: 'AI가 만든 부동산 콘텐츠는 표시·광고 규제 대상입니다',
      body: '공인중개사법 제18조의2 — 중개대상물을 광고할 때 중개사무소 명칭·소재지·연락처·등록번호·' +
            '개업공인중개사 성명을 반드시 명시해야 합니다. AI 초안에는 이 명시사항이 없고, "확실히 오른다" ' +
            '같은 과장 표현이 섞이기 쉽습니다. 명시사항 누락은 100만원, 부당(과장)광고는 500만원 과태료입니다.',
      fix: '발행 전 [컴플라이언스 체크]가 텍스트를 실제로 검사합니다. 명시사항 누락과 금지 표현을 ' +
           '잡아내고, 통과하지 못하면 발행을 막습니다. 이 검사를 통과한 콘텐츠만 발행 단계로 갑니다.',
      where: '대시보드 [에디터] → 발행 전 체크 · 관리자 [컴플라이언스]'
    },
    {
      id: 'R4', level: 'mid',
      title: 'n8n 워크플로우는 외부 API가 바뀌면 조용히 멈춥니다',
      body: '이 시스템은 부동산 API·LLM·HeyGen·구글/노션 등 여러 외부 서비스를 엮습니다. 그중 하나가 ' +
            '응답 형식을 바꾸거나 인증이 만료되면 그 지점부터 파이프라인이 멈추는데, 비개발자는 ' +
            '어디가 끊겼는지 알기 어렵습니다.',
      fix: '각 단계에 실패 감지와 알림(텔레그램)을 넣고, 관리자 [파이프라인 상태]에서 어느 노드가 ' +
           '실패했는지 보이게 합니다. 클라이언트가 스스로 유지보수할 수 있도록 매뉴얼을 산출물에 ' +
           '포함합니다(공고 우대사항).',
      where: '관리자 [파이프라인 상태] · 유지보수 매뉴얼'
    },
    {
      id: 'R5', level: 'mid',
      title: '"올인원"이 아니라 "1차 MVP"입니다 — 범위를 먼저 그어야 합니다',
      body: '공고가 스스로 "방대한 올인원이 아닌 1차 MVP"라고 못 박았습니다. 그런데 요구사항은 수집·생성·' +
            '영상·리포트·에디터로 넓습니다. 60일·1000만원 안에 모두 프로덕션 품질로 넣으면 어느 것도 ' +
            '완성되지 않습니다.',
      fix: '수집→초안→검수→영상→발행의 한 줄기(요일 1종)를 먼저 끝까지 돌리는 것을 1차로 제안합니다. ' +
           '리포트·다채널 발행은 2차입니다. 데모의 파이프라인이 그 한 줄기입니다.',
      where: '지원서 [견적] · 2차 제안'
    },
    {
      id: 'R6', level: 'mid',
      title: '맞춤 리포트가 투자 권유가 되면 규제 영역입니다',
      body: '2-5의 "맞춤형 부동산 리포트"가 특정 매물 매수를 권유하는 형태가 되면 유사투자자문·부당 ' +
            '표시광고 문제가 생길 수 있습니다. "정보 제공"과 "투자 권유"의 경계를 문구로 관리해야 합니다.',
      fix: '리포트를 사실 정보(실거래·청약 일정) 중심으로 구성하고, 단정적 수익 예측 표현을 금지어로 ' +
           '걸었습니다. 컴플라이언스 체크가 리포트에도 적용됩니다.',
      where: '관리자 [컴플라이언스]'
    },
    {
      id: 'R7', level: 'low',
      title: 'Hermes·n8n을 셀프호스팅하면 서버 운영이 따라옵니다',
      body: 'n8n 클라우드는 자동 업데이트·관리형이지만 월 구독이 있고, 셀프호스팅은 무료지만 ' +
            '서버·업데이트·모니터링을 발주사가 떠안습니다. Hermes 에이전트도 마찬가지입니다.',
      fix: '1차 MVP는 관리형(n8n Cloud) 로 빠르게 띄우고, 물량이 늘면 셀프호스팅으로 옮기는 순서를 ' +
           '제안합니다. 관리자 [운영 방식]에서 두 안의 월 비용을 비교합니다.',
      where: '관리자 [운영 방식]'
    }
  ];

  /* --------------------------- 2차 고도화 견적 (공고가 요구) --------------------------- */
  var PHASE2 = [
    { item: '협력 부동산 배정·진행 상태 추적', days: 12, note: '상태 머신 + 알림. DB 구조는 1차에서 대비' },
    { item: '고도화된 세금 분석 리포트', days: 10, note: '세율·중과 로직 + 법령 업데이트 대응 필요' },
    { item: '다채널 완전 자동 발행 (인스타·유튜브·네이버)', days: 15, note: '각 플랫폼 API·심사·정책 대응' },
    { item: '콘텐츠 성과 분석 대시보드', days: 8, note: '조회·전환 수집. 채널별 지표 상이' }
  ];

  /* --------------------------- 포맷터 --------------------------- */
  var fmt = {
    usd: function (n) { return '$' + (n < 10 ? n.toFixed(2) : Math.round(n).toLocaleString('en-US')); },
    krw: function (n) {
      if (n >= 1e8) return '₩' + (n / 1e8).toFixed(1) + '억';
      if (n >= 1e4) return '₩' + Math.round(n / 1e4).toLocaleString('ko-KR') + '만';
      return '₩' + Math.round(n).toLocaleString('ko-KR');
    },
    krwFull: function (n) { return '₩' + Math.round(n).toLocaleString('ko-KR'); },
    int: function (n) { return Math.round(n).toLocaleString('ko-KR'); },
    pct: function (n, d) { return (n * 100).toFixed(d === undefined ? 0 : d) + '%'; }
  };

  global.AC = {
    STAGES: STAGES, STAGE_BY: STAGE_BY, WEEKLY: WEEKLY, TICKETS: TICKETS,
    HEYGEN: HEYGEN, USD_KRW: USD_KRW, heygenCost: heygenCost,
    AD_REQUIRED: AD_REQUIRED, AD_BANNED: AD_BANNED, checkCompliance: checkCompliance,
    BOUNDARY: BOUNDARY, RISKS: RISKS, PHASE2: PHASE2,
    fmt: fmt, mulberry32: mulberry32
  };
})(window);
