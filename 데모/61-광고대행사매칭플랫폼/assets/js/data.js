/* ADRING — 샘플 데이터 (전부 가상. 실존 업체·인물과 무관) */
'use strict';
const AD = window.AD || (window.AD = {});

AD.CATS = {
  '검색광고': { cls:'search', subs:['네이버 파워링크','구글 검색광고','쇼핑 검색'] },
  'SNS광고': { cls:'sns', subs:['인스타그램·페이스북','틱톡','카카오 모먼트'] },
  '콘텐츠(블로그·바이럴)': { cls:'content', subs:['블로그 체험단','기자단·바이럴','플레이스 마케팅'] },
  '영상(유튜브)': { cls:'video', subs:['유튜브 광고','숏폼 제작·운영','인플루언서 협업'] },
  '홈페이지·디자인': { cls:'design', subs:['홈페이지 제작','상세페이지','브랜딩·로고'] },
};
AD.PURPOSES = ['매출 증대','브랜드 인지도','신규 고객 유입','재방문·리텐션'];
AD.BUDGETS = ['월 50만원 이하','월 50~100만원','월 100~300만원','월 300만원 이상'];
AD.PERIODS = ['1개월','3개월','6개월','협의 후 결정'];

/* 데모 요청서 (프리필: 소상공인 시점) */
AD.REQ = {
  id:'RQ-2608-042', cat:'SNS광고', sub:'인스타그램·페이스북', biz:'요식업(카페)',
  purposes:['매출 증대','신규 고객 유입'], budget:'월 100~300만원', period:'3개월',
  detail:'강남역 인근 카페 2호점 오픈을 앞두고 있습니다. 오픈 첫 달 방문자 확보가 목표이고, 인스타그램 중심으로 지역 타겟 광고를 원합니다. 기존 1호점 계정(팔로워 3,200)이 있어 연계 운영이 가능하면 좋겠습니다. 주중 낮 시간대 30대 여성 고객이 주 타겟입니다.',
  region:'서울 강남구 역삼동', deadline:'2026-08-19', slotMax:5,
  owner:'박**', shop:'ㄷ카페 (강남 2호점 예정)', phone:'010-****-3921', email:'da***@naver.com',
  createdAt:'2026-08-12',
};

/* 제안서 — 단가유형 혼재 (F1 시연), 유효기간은 마감 종속 계산 (F3) */
AD.PROPOSALS = [
  { id:'P1', agency:'그로우랩 마케팅', grade:'우수', boost:true, rating:4.9, ratingLabel:'매우 좋음', reviews:127,
    priceType:'월', amount:1800000, months:3, days:'D-5',
    strategy:'지역 반경 3km 타겟 인스타 릴스 + 방문 인증 이벤트 2주 사이클. 1호점 계정 연계 리그램 운영으로 초기 도달 확보. 주 2회 콘텐츠 제작 포함.',
    manager:'김민지 팀장 · 7년차', verified:true, respHours:2.1, confirmRate:34, portfolio:12, expired:false },
  { id:'P2', agency:'브릿지애드', grade:'인증', boost:false, rating:4.6, ratingLabel:'좋음', reviews:58,
    priceType:'총액', amount:4200000, months:3, days:'D-3',
    strategy:'인스타+네이버 플레이스 병행. 오픈 프로모션 세트(오픈 D-7 티저 → D-day 이벤트 → 후기 리뷰단 15명). 월간 리포트 제공.',
    manager:'이서준 실장 · 5년차', verified:true, respHours:4.8, confirmRate:28, portfolio:8, expired:false },
  { id:'P3', agency:'스파크미디어', grade:'신규', boost:false, rating:0, ratingLabel:'신규', reviews:0,
    priceType:'월', amount:990000, months:3, days:'D-1',
    strategy:'저비용 고효율 세팅. 메타 광고 계정 셋업과 타겟 A/B 테스트 중심으로 운영합니다.',
    manager:'박도현 대표 · 3년차', verified:true, respHours:1.2, confirmRate:0, portfolio:2, expired:false },
  { id:'P4', agency:'애드원커머스', grade:'인증', boost:false, rating:4.2, ratingLabel:'좋음', reviews:31,
    priceType:'협의', amount:0, months:0, days:'만료',
    strategy:'예산과 목표에 따라 맞춤 설계해 드립니다. 미팅 후 상세 견적 제공.',
    manager:'최연우 매니저 · 4년차', verified:false, respHours:9.5, confirmRate:12, portfolio:4, expired:true },
];

/* 대행사 시점: 요청 목록 (마스킹 + 슬롯 + 시간차 오픈) */
AD.REQ_LIST = [
  { id:'RQ-2608-042', title:'강남구 카페 · 인스타그램 오픈 마케팅', cat:'SNS광고', budget:'월 100~300만원', period:'3개월',
    region:'서울 강남구', slots:'3/5', deadline:'D-6', tierOpen:'열림', quality:82 },
  { id:'RQ-2608-045', title:'수원 필라테스 · 네이버 플레이스 상위 노출', cat:'콘텐츠(블로그·바이럴)', budget:'월 50~100만원', period:'6개월',
    region:'경기 수원시', slots:'5/5', deadline:'D-4', tierOpen:'마감', quality:74 },
  { id:'RQ-2608-047', title:'온라인 편집숍 · 숏폼 제작 + 운영', cat:'영상(유튜브)', budget:'월 300만원 이상', period:'협의 후 결정',
    region:'무관(온라인)', slots:'1/8', deadline:'D-7', tierOpen:'신규 등급 2시간 후 열림', quality:91 },
  { id:'RQ-2608-048', title:'(검증 대기) 마케팅 잘하는 곳 찾아요', cat:'SNS광고', budget:'월 50만원 이하', period:'1개월',
    region:'-', slots:'0/5', deadline:'D-7', tierOpen:'열림', quality:38, lowq:true },
];

/* 금지 표현 (F10) + 연락처 우회 패턴 (F5/B) */
AD.BANNED_CLAIMS = ['매출 보장','1위 보장','상위노출 보장','정부지원','전액 환불','파워등급 보장'];
AD.CONTACT_PATTERNS = [/01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/, /카톡|카카오톡\s*(아이디|id)|kakao\s*id/i, /@[a-z0-9_.]{3,}/i, /(만나서|미팅|전화)\s*(주세요|주시면)/];

/* 관리자 데이터 */
AD.ADMIN = {
  queue: [
    { type:'auto', label:'사업자 자동대조 통과', n:14, note:'국세청 진위확인 일치 — 자동 승인 처리됨' },
    { type:'human', label:'가입 심사 (수동)', items:[
      { firm:'퍼포먼스원 (대표 정**)', issue:'사업자 진위확인 불일치 — 개업일자 상이', action:'반려/보완' },
      { firm:'애드마스터즈 (대표 한**)', issue:'동일 실체 의심 — 기존 정지 계정과 주소·전화 뒷자리 일치', action:'정밀 심사' },
      { firm:'디지털브릿지 (대표 오**)', issue:'포트폴리오 무단 도용 신고 1건', action:'소명 요청' },
    ]},
  ],
  suspects: [
    { key:'주소 강남구 테헤란로 ***-* · 전화 **-8821 · 계좌 동일', accounts:['애드마스터즈','(정지) 탑애드컴퍼니','(정지) 애드윈스'], pattern:'정지 후 상호 변경 재가입 — 공정위 수사의뢰 55개 업체 패턴과 일치' },
  ],
  reviews: [
    { agency:'그로우랩 마케팅', src:'플랫폼 매칭', matchId:'MT-2607-118', text:'오픈 첫 달 방문 목표 초과 달성. 리포트가 구체적', ok:true },
    { agency:'브릿지애드', src:'플랫폼 외 실거래', matchId:null, evidence:'세금계산서 사본', text:'플레이스 순위 개선 경험', ok:true, extLabel:true },
  ],
  states: ['작성중','모집중','마감','비교중','확정','종료','제안0-자동연장','확정취소-슬롯복구'],
  fallback: { alimtalk: 128, alimFail: 12, lms: 11, email: 1, cost: 1430 },
  midCount: 47,
};
