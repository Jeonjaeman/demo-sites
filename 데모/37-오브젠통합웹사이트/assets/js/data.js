/* =====================================================================
   OBZEN Integrated (B안 · SPECTRUM) — 콘텐츠·다국어·뉴스 CRUD
   ---------------------------------------------------------------------
   · 모든 수치·연혁 연도·IR 문서·연락처는 제안용 가상 데이터입니다.
   · 공개 확인 가능한 사실(합병 맥락·회사명)만 실제로 다룹니다.
   ===================================================================== */
(function (global) {
  'use strict';

  var CONTENT = {
    hero: {
      eyebrow: { ko: 'OBZEN × ZALESIA · 통합 출범 2026', en: 'OBZEN × ZALESIA · INTEGRATION 2026' },
      title_a: { ko: '흩어진 데이터를', en: 'Scattered data,' },
      title_em: { ko: '하나의 초점으로.', en: 'brought into focus.' },
      lead: {
        ko: '고객 데이터와 경영 데이터가 오브젠이라는 하나의 렌즈를 지나 “다음 행동”이라는 선명한 빛으로 모입니다.',
        en: 'Customer and enterprise data pass through one lens — OBZEN — and converge into a single clear beam: the next action.'
      },
      cta1: { ko: '통합 스토리 보기', en: 'See the story' },
      cta2: { ko: '서비스 살펴보기', en: 'Explore services' }
    },
    identity: {
      kicker: { ko: '새로운 정체성', en: 'THE NEW OBZEN' },
      h: { ko: '두 전문성이 만나\n하나의 스펙트럼이 됩니다.', en: 'Two disciplines meet\nand become one spectrum.' },
      p: { ko: '오브젠의 고객 데이터·AI 마케팅 실행력과 잘레시아의 데이터 엔지니어링·경영 분석 역량을 하나의 운영 체계로 통합했습니다.', en: 'OBZEN’s customer-data and AI marketing meet ZALESIA’s data engineering and management analytics — unified into one operating system.' }
    },
    obzen: {
      tag: { ko: 'OBZEN · 고객 스펙트럼', en: 'OBZEN · CUSTOMER' },
      h: { ko: '고객을 이해하고\n정교하게 실행합니다', en: 'Understand customers,\nact with precision' },
      items: {
        ko: ['고객 데이터 플랫폼(CDP)', 'AI 마케팅 자동화', '캠페인 오케스트레이션'],
        en: ['Customer Data Platform', 'AI Marketing Automation', 'Campaign Orchestration']
      }
    },
    zalesia: {
      tag: { ko: 'ZALESIA · 경영 스펙트럼', en: 'ZALESIA · ENTERPRISE' },
      h: { ko: '기업 데이터를 연결하고\n의사결정을 돕습니다', en: 'Connect enterprise data,\nguide decisions' },
      items: {
        ko: ['데이터 엔지니어링', '비즈니스 인텔리전스(BI)', '경영 애널리틱스'],
        en: ['Data Engineering', 'Business Intelligence', 'Management Analytics']
      }
    },
    timeline: {
      kicker: { ko: '연혁 · 합병 정보', en: 'HISTORY & MERGER' },
      h: { ko: '두 갈래의 길이\n하나의 초점으로.', en: 'Two paths,\none focal point.' },
      items: [
        { y: '2003', merge: false, t: { ko: '오브젠 설립', en: 'OBZEN founded' }, d: { ko: '고객 데이터·마케팅 자동화 사업 시작', en: 'Customer data & marketing automation' } },
        { y: '2008', merge: false, t: { ko: '잘레시아 설립', en: 'ZALESIA founded' }, d: { ko: '데이터 엔지니어링·BI 전문 기업', en: 'Data engineering & BI specialist' } },
        { y: '2019', merge: false, t: { ko: '오브젠, CDXP 플랫폼 출시', en: 'OBZEN launches CDXP' }, d: { ko: '고객 데이터 통합 실행 플랫폼', en: 'Unified customer-data activation' } },
        { y: '2023', merge: false, t: { ko: '전략적 협업 시작', en: 'Strategic partnership' }, d: { ko: '두 회사의 데이터·실행 역량 결합 프로젝트', en: 'Joint data + activation projects' } },
        { y: '2026', merge: true, t: { ko: '오브젠 × 잘레시아 통합 출범', en: 'OBZEN × ZALESIA merge' }, d: { ko: '고객 데이터부터 경영 의사결정까지 하나의 회사로', en: 'From customer data to management decisions, as one' } }
      ]
    },
    services: {
      kicker: { ko: '통합 서비스', en: 'UNIFIED SERVICES' },
      h: { ko: '제품을 나열하지 않습니다.\n데이터의 여정을 보여줍니다.', en: 'Not a product list —\nthe journey of your data.' },
      items: [
        { idx: '01', t: { ko: '수집 · 연결', en: 'Collect · Connect' }, d: { ko: '고객 접점·업무 시스템·외부 채널을 표준 파이프라인으로 안전하게 연결합니다.', en: 'Connect touchpoints, internal systems and external channels through standardized pipelines.' }, was: 'ZALESIA', now: 'Data Fabric' },
        { idx: '02', t: { ko: '통합 · 관리', en: 'Unify · Govern' }, d: { ko: '흩어진 데이터를 하나의 고객·경영 뷰로 통합하고 품질과 권한을 관리합니다.', en: 'Unify scattered data into one customer & management view with quality and access control.' }, was: 'OBZEN+ZALESIA', now: 'CDXP+' },
        { idx: '03', t: { ko: '분석 · 예측', en: 'Analyze · Predict' }, d: { ko: '생성형 AI와 예측 모델로 다음에 일어날 일과 최적의 행동을 제시합니다.', en: 'Generative AI and predictive models surface what happens next and the best action.' }, was: 'OBZEN', now: 'AI Studio' },
        { idx: '04', t: { ko: '실행 · 개선', en: 'Activate · Improve' }, d: { ko: '분석 결과를 캠페인·업무·경영 의사결정으로 자동 연결하고 성과를 학습합니다.', en: 'Turn insight into campaigns, operations and decisions — and learn from results.' }, was: 'OBZEN', now: 'Orchestrator' }
      ]
    },
    stats: {
      kicker: { ko: '통합 스냅샷', en: 'INTEGRATION SNAPSHOT' },
      h: { ko: '합병으로 넓어진\n지능의 폭.', en: 'A wider span of\nintelligence, together.' },
      note: { ko: '※ 아래 수치는 기능 시연을 위한 제안용 가상 데이터입니다.', en: '※ Figures below are placeholder demo data for the proposal.' },
      items: [
        { v: 520, suf: '+', l: { ko: '통합 후 임직원(명)', en: 'People after merger' }, pct: 82 },
        { v: 2, pre: '', suf: '개 → 1', l: { ko: '두 회사 → 하나의 운영체계', en: 'Two firms → one system' }, pct: 100 },
        { v: 40, suf: '억+', l: { ko: '연간 처리 데이터 이벤트', en: 'Yearly data events' }, pct: 74 },
        { v: 23, suf: '년', l: { ko: '누적 데이터·AI 전문성', en: 'Years of data & AI craft' }, pct: 66 }
      ]
    },
    governance: {
      kicker: { ko: '신뢰와 거버넌스', en: 'TRUST & GOVERNANCE' },
      h: { ko: 'AI가 더 움직일수록,\n통제는 더 분명하게.', en: 'The more AI acts,\nthe clearer the control.' },
      items: [
        { t: { ko: '접근 통제', en: 'Access control' }, d: { ko: '역할·업무 목적에 맞는 최소 권한 원칙을 적용합니다.', en: 'Least-privilege access by role and purpose.' } },
        { t: { ko: '처리 이력', en: 'Full audit trail' }, d: { ko: '데이터·모델·의사결정 흐름을 추적 가능한 기록으로 남깁니다.', en: 'Every data, model and decision step is traceable.' } },
        { t: { ko: '배포 선택권', en: 'Deployment choice' }, d: { ko: '조직 보안 정책에 맞춘 클라우드·온프레미스 구성을 지원합니다.', en: 'Cloud or on-premise to fit your security policy.' } }
      ]
    },
    contact: {
      kicker: { ko: '문의하기', en: 'CONTACT' },
      h: { ko: '복잡한 데이터 문제,\n연결부터 함께 보겠습니다.', en: 'Complex data problems —\nlet’s start by connecting them.' },
      p: { ko: '문의 유형과 연락 정보를 남겨 주세요. 데모에서는 입력 내용이 외부로 전송되지 않습니다.', en: 'Leave your inquiry and contact info. Nothing is sent externally in this demo.' }
    },
    nav: {
      company: { ko: '회사소개', en: 'Company' },
      history: { ko: '연혁·합병', en: 'History' },
      services: { ko: '서비스', en: 'Services' },
      ir: { ko: '뉴스·IR', en: 'Newsroom' },
      contact: { ko: '문의', en: 'Contact' }
    }
  };

  var NEWS_SEED = [
    { id: 'n1', type: 'ir', date: '2026-08-01', title: { ko: '오브젠·잘레시아 통합 법인 공식 출범', en: 'OBZEN × ZALESIA integration officially launches' } },
    { id: 'n2', type: 'notice', date: '2026-08-01', title: { ko: '통합 브랜드 및 신규 CI 적용 안내', en: 'New integrated brand & CI applied' } },
    { id: 'n3', type: 'news', date: '2026-08-12', title: { ko: '통합 CDXP+ 플랫폼 로드맵 공개', en: 'Unified CDXP+ platform roadmap unveiled' } },
    { id: 'n4', type: 'ir', date: '2026-08-20', title: { ko: '2026 상반기 통합 실적 및 사업 방향 설명', en: 'H1 2026 combined results & outlook' } },
    { id: 'n5', type: 'notice', date: '2026-09-02', title: { ko: '개인정보 처리방침 개정 안내(통합 반영)', en: 'Privacy policy updated for the merged entity' } },
    { id: 'n6', type: 'news', date: '2026-09-15', title: { ko: '생성형 AI 마케팅 스튜디오 정식 출시', en: 'Generative AI Marketing Studio released' } }
  ];
  var TYPE_LABEL = { notice: { ko: '공지', en: 'Notice' }, ir: { ko: 'IR', en: 'IR' }, news: { ko: '보도자료', en: 'Press' } };

  /* ---------- 뉴스 저장소 (관리자 CRUD) ---------- */
  var KEY = 'obzen_b_news_v1';
  function loadNews() {
    var v; try { v = JSON.parse(localStorage.getItem(KEY)); } catch (e) { v = null; }
    if (!v || !Array.isArray(v)) { v = JSON.parse(JSON.stringify(NEWS_SEED)); saveNews(v); }
    return v;
  }
  function saveNews(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
  function resetNews() { localStorage.removeItem(KEY); return loadNews(); }

  /* ---------- 통합 검색 인덱스 ---------- */
  function searchIndex(lang) {
    var mergerBody = lang === 'ko'
      ? '합병 통합 오브젠 잘레시아 통합 출범 2026 새 정체성 통합 기업 IR'
      : 'merger integration OBZEN ZALESIA unified 2026 new identity IR';
    var idx = [
      { k: lang === 'ko' ? '합병' : 'merger', sec: 'history', title: lang === 'ko' ? '오브젠 × 잘레시아 합병' : 'OBZEN × ZALESIA merger', body: mergerBody },
      { k: 'company', sec: 'company', title: CONTENT.identity.h[lang].replace(/\n/g, ' '), body: CONTENT.identity.p[lang] + ' ' + mergerBody },
      { k: 'company', sec: 'company', title: t2(CONTENT.obzen.h, lang), body: CONTENT.obzen.items[lang].join(', ') },
      { k: 'company', sec: 'company', title: t2(CONTENT.zalesia.h, lang), body: CONTENT.zalesia.items[lang].join(', ') },
      { k: 'history', sec: 'history', title: t2(CONTENT.timeline.h, lang), body: CONTENT.timeline.items.map(function (i) { return i.y + ' ' + i.t[lang]; }).join(' · ') }
    ];
    CONTENT.services.items.forEach(function (s) { idx.push({ k: 'service', sec: 'services', title: s.t[lang], body: s.d[lang] }); });
    CONTENT.governance.items.forEach(function (g) { idx.push({ k: 'trust', sec: 'ir', title: g.t[lang], body: g.d[lang] }); });
    loadNews().forEach(function (n) { idx.push({ k: TYPE_LABEL[n.type][lang], sec: 'ir', title: n.title[lang], body: n.date }); });
    return idx;
  }
  function t2(obj, lang) { return (obj[lang] || '').replace(/\n/g, ' '); }

  global.OB = {
    CONTENT: CONTENT, TYPE_LABEL: TYPE_LABEL, NEWS_SEED: NEWS_SEED,
    loadNews: loadNews, saveNews: saveNews, resetNews: resetNews,
    searchIndex: searchIndex,
    t: function (obj, lang) { return obj ? obj[lang] : ''; }
  };
})(window);
