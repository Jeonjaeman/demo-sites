/* =====================================================
   SALESUP 데모 시드 데이터
   - 실제 백엔드 대신 localStorage + 시드 데이터로 동작
   - 회사/게시글/리뷰/회원/큐레이션 전부 가상 데이터
   ===================================================== */

const SEED = {

  /* ---------- 회원 ---------- */
  users: [
    { id: "u1",  nick: "영업9단",     grade: "expert",  level: 12, pts: 4820, company: "테크노클라우드", job: "B2B SaaS 영업", joined: "2025-11-02" },
    { id: "u2",  nick: "월천보험왕",  grade: "pro",     level: 9,  pts: 3110, company: "한빛생명",       job: "보험 영업(GA)",  joined: "2025-12-14" },
    { id: "u3",  nick: "카마스터K",   grade: "pro",     level: 7,  pts: 2050, company: "미래모터스",     job: "자동차 판매",    joined: "2026-01-20" },
    { id: "u4",  nick: "제약러버",    grade: "normal",  level: 4,  pts: 880,  company: "대성제약",       job: "제약 영업(MR)",  joined: "2026-02-11" },
    { id: "u5",  nick: "렌탈의신",    grade: "pro",     level: 8,  pts: 2760, company: "부강렌탈",       job: "렌탈 영업",      joined: "2026-01-05" },
    { id: "u6",  nick: "대표J",       grade: "ceo",     level: 15, pts: 7200, company: "다온커머스",     job: "대표이사",       joined: "2025-10-28" },
    { id: "u7",  nick: "신입세일즈",  grade: "normal",  level: 2,  pts: 310,  company: "비공개",         job: "IT 영업 준비",   joined: "2026-06-01" },
    { id: "u8",  nick: "핏한제안서",  grade: "expert",  level: 11, pts: 4100, company: "스마트오피스솔루션", job: "B2B 컨설팅 영업", joined: "2025-11-19" },
  ],

  /* 데모 로그인 계정 (게스트 체험용) */
  me: { id: "me", nick: "데모영업인", grade: "normal", level: 3, pts: 540, company: "비공개", job: "영업 3년차", joined: "2026-05-10", streak: 6 },

  grades: {
    ceo:    { label: "대표인증", cls: "g-ceo" },
    expert: { label: "전문가",   cls: "g-expert" },
    pro:    { label: "영업인",   cls: "g-pro" },
    normal: { label: "일반",     cls: "g-normal" },
  },

  /* ---------- 회사 (관리자 사전 등록) ---------- */
  companies: [
    { id: "c1",  name: "한빛생명",           industry: "생명보험",      size: "대기업(2,400명)", location: "서울 중구",
      rating: 3.4, cats: { pay: 3.8, wlb: 2.6, culture: 3.2, growth: 3.5, mgmt: 3.1 }, reviews: 128, views: 1841, salaryHint: "초봉 3,400 + 인센티브" },
    { id: "c2",  name: "대성제약",           industry: "제약",          size: "중견(890명)",     location: "서울 서초구",
      rating: 3.8, cats: { pay: 4.1, wlb: 3.2, culture: 3.6, growth: 4.0, mgmt: 3.7 }, reviews: 96,  views: 1530, salaryHint: "초봉 4,100 + 법인차" },
    { id: "c3",  name: "테크노클라우드",     industry: "IT·SaaS",       size: "중견(410명)",     location: "경기 성남시",
      rating: 4.2, cats: { pay: 4.3, wlb: 4.0, culture: 4.4, growth: 4.5, mgmt: 3.9 }, reviews: 87,  views: 2210, salaryHint: "초봉 4,600 + 스톡옵션" },
    { id: "c4",  name: "미래모터스",         industry: "자동차 판매",   size: "대기업(5,100명)", location: "전국 지점",
      rating: 3.1, cats: { pay: 3.6, wlb: 2.4, culture: 2.9, growth: 3.0, mgmt: 3.4 }, reviews: 214, views: 1975, salaryHint: "기본급 + 판매수당" },
    { id: "c5",  name: "세종화재",           industry: "손해보험",      size: "대기업(3,000명)", location: "서울 종로구",
      rating: 3.6, cats: { pay: 3.9, wlb: 3.1, culture: 3.4, growth: 3.6, mgmt: 3.8 }, reviews: 143, views: 1230, salaryHint: "초봉 3,800" },
    { id: "c6",  name: "다온커머스",         industry: "유통·이커머스", size: "중소(120명)",     location: "서울 강남구",
      rating: 3.9, cats: { pay: 3.7, wlb: 3.8, culture: 4.2, growth: 4.1, mgmt: 3.6 }, reviews: 41,  views: 890,  salaryHint: "초봉 3,600 + 성과급" },
    { id: "c7",  name: "한결캐피탈",         industry: "금융·캐피탈",   size: "중견(560명)",     location: "서울 영등포구",
      rating: 2.9, cats: { pay: 3.4, wlb: 2.2, culture: 2.6, growth: 2.8, mgmt: 3.3 }, reviews: 77,  views: 1104, salaryHint: "기본급 + 실적수당" },
    { id: "c8",  name: "프라임에듀",         industry: "교육",          size: "중소(200명)",     location: "서울 마포구",
      rating: 3.3, cats: { pay: 3.0, wlb: 3.5, culture: 3.4, growth: 3.2, mgmt: 3.2 }, reviews: 52,  views: 640,  salaryHint: "초봉 3,200" },
    { id: "c9",  name: "글로벌푸드시스템",   industry: "식자재 B2B",    size: "중견(700명)",     location: "경기 광주시",
      rating: 3.5, cats: { pay: 3.5, wlb: 3.3, culture: 3.5, growth: 3.6, mgmt: 3.5 }, reviews: 63,  views: 720,  salaryHint: "초봉 3,500 + 유류지원" },
    { id: "c10", name: "부강렌탈",           industry: "렌탈·구독",     size: "중견(980명)",     location: "서울 금천구",
      rating: 3.0, cats: { pay: 3.3, wlb: 2.7, culture: 2.9, growth: 3.0, mgmt: 3.1 }, reviews: 118, views: 1310, salaryHint: "기본급 + 설치수당" },
    { id: "c11", name: "스마트오피스솔루션", industry: "사무기기 B2B",  size: "중소(150명)",     location: "서울 구로구",
      rating: 3.7, cats: { pay: 3.6, wlb: 3.7, culture: 3.8, growth: 3.7, mgmt: 3.7 }, reviews: 38,  views: 560,  salaryHint: "초봉 3,700" },
    { id: "c12", name: "헬스케어원",         industry: "의료기기",      size: "중견(320명)",     location: "서울 송파구",
      rating: 4.0, cats: { pay: 4.2, wlb: 3.6, culture: 4.0, growth: 4.3, mgmt: 3.9 }, reviews: 45,  views: 1420, salaryHint: "초봉 4,300 + 학회지원" },
  ],

  /* 영업 특화 별점 축 (RepVue 벤치마킹: 일반 5축이 아닌 영업 지표 중심) */
  ratingCats: {
    pay:     "급여·인센티브",
    wlb:     "워라밸",
    culture: "영업문화",
    growth:  "성장·커리어",
    mgmt:    "목표·평가 합리성",
  },

  /* ---------- 회사 리뷰 ---------- */
  companyReviews: [
    { id: "r1", cid: "c3", status: "현직", job: "B2B 영업", date: "2026-07-12", rating: 4.5,
      cats: { pay: 5, wlb: 4, culture: 5, growth: 5, mgmt: 4 },
      oneline: "영업을 '갈아넣기'가 아니라 시스템으로 하는 회사",
      pros: "CRM·리드 배분이 체계적이라 콜드콜 비중이 낮고, 인센티브 정산이 투명합니다. 분기별 세일즈 교육 지원도 실제로 돌아갑니다.",
      cons: "목표치가 매년 공격적으로 올라가고, 분기 말 마감 주간은 야근이 불가피합니다.",
      helpful: 41 },
    { id: "r2", cid: "c3", status: "전직", job: "인사이드세일즈", date: "2026-06-28", rating: 4.0,
      cats: { pay: 4, wlb: 4, culture: 4, growth: 4, mgmt: 4 },
      oneline: "주니어가 커리어 시작하기 좋은 SaaS 영업 조직",
      pros: "SDR→AE 승격 트랙이 명확하고 온보딩 프로그램이 탄탄합니다.",
      cons: "연봉 인상 폭이 성과 대비 보수적인 편.",
      helpful: 18 },
    { id: "r3", cid: "c1", status: "현직", job: "FC(설계사)", date: "2026-07-10", rating: 3.0,
      cats: { pay: 4, wlb: 2, culture: 3, growth: 3, mgmt: 3 },
      oneline: "버는 만큼 가져가지만, 버티는 게 실력인 곳",
      pros: "수수료 체계가 업계 상위권이고 상위 10%는 확실히 고소득. 지점별 동행 교육이 있습니다.",
      cons: "주말 고객 미팅이 잦고, 리크루팅 압박이 있습니다. 정착 지원금 조건을 꼼꼼히 봐야 합니다.",
      helpful: 66 },
    { id: "r4", cid: "c4", status: "전직", job: "카마스터", date: "2026-07-05", rating: 2.5,
      cats: { pay: 3, wlb: 2, culture: 2, growth: 3, mgmt: 3 },
      oneline: "판매 수당은 좋지만 재고·프로모션 압박이 큼",
      pros: "브랜드 인지도가 높아 내방 고객이 꾸준하고, 판매왕 포상(해외연수)이 확실합니다.",
      cons: "월말 목표 미달 시 자비 프로모션 부담이 생기는 문화가 지점마다 있습니다.",
      helpful: 52 },
    { id: "r5", cid: "c2", status: "현직", job: "MR(병원영업)", date: "2026-07-08", rating: 4.0,
      cats: { pay: 4, wlb: 3, culture: 4, growth: 4, mgmt: 4 },
      oneline: "법인차+유류비 등 지원은 최고 수준, 대신 학회 시즌은 각오",
      pros: "차량·통신비 지원이 확실하고 CP(공정경쟁규약) 교육이 잘 되어 있어 리스크가 적습니다.",
      cons: "담당 병원 콜 수 관리가 빡빡하고 학회 시즌 주말 근무가 있습니다.",
      helpful: 29 },
    { id: "r6", cid: "c7", status: "전직", job: "대출상담", date: "2026-06-20", rating: 2.0,
      cats: { pay: 3, wlb: 2, culture: 2, growth: 2, mgmt: 2 },
      oneline: "실적 압박 대비 기본급이 낮아 이직률이 높음",
      pros: "금융권 영업 경력을 짧게 쌓기에는 진입장벽이 낮습니다.",
      cons: "DB 품질 편차가 크고, 팀별 분위기 차이가 심합니다.",
      helpful: 37 },
    { id: "r7", cid: "c12", status: "현직", job: "의료기기 영업", date: "2026-07-14", rating: 4.5,
      cats: { pay: 5, wlb: 3, culture: 4, growth: 5, mgmt: 4 },
      oneline: "전문성이 곧 연봉이 되는 곳, 공부할 각오는 필수",
      pros: "제품 교육·해외 학회 지원이 좋고, 임상 지식이 쌓이면 몸값이 확실히 오릅니다.",
      cons: "수술 참관 등 온콜성 일정이 있어 워라밸은 포기해야 할 때가 있습니다.",
      helpful: 23 },
    { id: "r8", cid: "c10", status: "전직", job: "렌탈 영업", date: "2026-06-15", rating: 2.5,
      cats: { pay: 3, wlb: 3, culture: 2, growth: 3, mgmt: 2 },
      oneline: "계정 해지 방어까지 영업 몫이라 체감 업무량이 많음",
      pros: "제품군이 다양해 교차판매 기회가 많고 수당 정산 주기가 짧습니다.",
      cons: "해지 방어·미납 관리가 영업 실적에 섞여 들어옵니다.",
      helpful: 19 },
  ],

  /* ---------- 게시글 ---------- */
  posts: [
    { id: "p1", board: "qna", uid: "u7", title: "콜드콜 거절 멘트에 매번 무너집니다. 멘탈 관리 어떻게 하시나요?",
      body: "IT 솔루션 신입 영업입니다. 하루 50콜 하는데 '필요 없어요' 소리만 들으면 오후엔 손이 안 갑니다. 선배님들은 거절을 어떻게 소화하시나요?",
      date: "2026-07-17 09:42", views: 482, likes: 36, scraps: 12, comments: 2, hot: true,
      aiAnswer: { done: true, at: "2026-07-17 09:43",
        text: "거절 멘탈 관리는 '수치화'가 핵심입니다.\n\n1) 거절을 데이터로 바꾸세요 — 50콜 중 통계적으로 2~3건이 미팅으로 전환된다면, 거절 1건은 '실패'가 아니라 전환까지 남은 카운트다운입니다.\n2) 거절 유형을 3가지로 분류해 보세요 — ①타이밍(지금은 아님) ②적합도(대상 아님) ③방식(접근이 불편함). ①은 리마인드 대상, ②는 리스트 정비, ③만 스크립트 개선 대상입니다.\n3) 콜 블록 사이 5분 리셋 루틴(자리 이탈, 스트레칭)을 넣으면 오후 슬럼프가 완화된다는 인사이드세일즈 사례가 많습니다.\n\n※ 본 답변은 AI가 자동 생성한 참고용 답변입니다. 커뮤니티 선배들의 실전 답변을 함께 확인해 보세요." } },
    { id: "p2", board: "qna", uid: "u4", title: "제약영업 3년차, 의료기기로 이직 시 연봉 협상 팁 있을까요?",
      body: "대성제약에서 MR 3년 했습니다. 헬스케어원 쪽 제안을 받았는데, 제약 경력을 의료기기에서 어떻게 어필해야 할지 감이 안 옵니다.",
      date: "2026-07-16 20:11", views: 356, likes: 21, scraps: 18, comments: 1, hot: true,
      aiAnswer: { done: true, at: "2026-07-16 20:12",
        text: "제약→의료기기 이직 시 어필 포인트 3가지를 정리했습니다.\n\n1) KOL(핵심 오피니언 리더) 네트워크 — 담당했던 진료과·병원 리스트를 정량화해 제시하세요. 의료기기 영업의 진입 비용을 줄여주는 자산입니다.\n2) CP/규제 이해도 — 공정경쟁규약 아래에서 영업해 본 경험은 의료기기 업계에서도 컴플라이언스 리스크를 낮추는 강점입니다.\n3) 연봉 협상은 '기본급'보다 '인센티브 구조+차량·학회 지원' 총보상 기준으로 비교표를 만들어 제시하는 것이 유리합니다.\n\n※ 본 답변은 AI가 자동 생성한 참고용 답변입니다. 실제 이직 조건은 회사 리뷰 게시판의 현직자 리뷰를 함께 참고하세요." } },
    { id: "p3", board: "record", uid: "u2", title: "[실적인증] 7월 2주차 — 종신 3건·연금 2건 체결 (월납 187만)",
      body: "이번 주 상담 14건 중 5건 체결했습니다. 포인트는 '보장 분석 리포트'를 미리 보내고 미팅에 들어간 것. 증빙은 블러 처리해서 첨부합니다.",
      date: "2026-07-15 18:30", views: 1024, likes: 88, scraps: 45, comments: 2, hot: true, verified: true },
    { id: "p4", board: "knowhow", uid: "u8", title: "B2B 제안서, '가격 페이지' 앞에 반드시 넣어야 하는 한 장",
      body: "10년간 제안서 수백 건을 쓰며 정리한 결론: 가격 페이지 직전에 'ROI 산출 근거' 한 장을 넣으면 가격 저항이 확 줄어듭니다. 고객사 데이터로 절감액을 역산해 보여주는 템플릿을 공유합니다.",
      date: "2026-07-14 11:20", views: 1893, likes: 152, scraps: 210, comments: 2, hot: true },
    { id: "p5", board: "free", uid: "u3", title: "월말 마감 끝나고 먹는 삼겹살이 제일 맛있다",
      body: "이번 달도 목표 106% 마감. 지점 식구들이랑 회식 중입니다. 다들 이번 달 어떠셨나요?",
      date: "2026-07-17 19:05", views: 214, likes: 43, scraps: 2, comments: 2 },
    { id: "p6", board: "knowhow", uid: "u5", title: "렌탈 영업 5년차의 해지 방어 스크립트 (실사용)",
      body: "해지 전화가 오면 '해지 사유'가 아니라 '사용 패턴'부터 묻습니다. 사유를 물으면 방어 논리가 시작되고, 패턴을 물으면 대화가 시작됩니다. 상황별 스크립트 6개 정리했습니다.",
      date: "2026-07-13 09:10", views: 987, likes: 76, scraps: 134, comments: 1 },
    { id: "p7", board: "free", uid: "u1", title: "영업직 무기계약/정규직 전환 조건, 회사마다 너무 다르네요",
      body: "이직 알아보면서 느낀 건데 같은 업계도 전환 조건이 천차만별입니다. 리뷰 게시판에 전환 조건 항목도 있으면 좋겠어요.",
      date: "2026-07-16 14:44", views: 301, likes: 19, scraps: 6, comments: 1 },
    { id: "p8", board: "qna", uid: "u7", title: "첫 B2B 미팅, 아이스브레이킹 어느 정도가 적당한가요?",
      body: "다음 주 첫 단독 미팅입니다. 스몰토크를 길게 하는 게 좋은지, 바로 본론이 좋은지 궁금합니다.",
      date: "2026-07-15 08:20", views: 178, likes: 9, scraps: 4, comments: 1,
      aiAnswer: { done: true, at: "2026-07-15 08:21",
        text: "B2B 첫 미팅의 아이스브레이킹은 '2분 룰'을 권합니다.\n\n1) 2분 이내 — 상대 회사 최근 뉴스·오피스 등 '상대와 관련된' 소재 1개면 충분합니다. 날씨·교통 같은 무관한 소재는 오히려 시간을 뺏는 인상을 줍니다.\n2) 전환 멘트를 준비하세요 — \"바쁘실 테니 오늘 논의드릴 세 가지부터 말씀드릴게요\"처럼 어젠다 제시로 자연스럽게 본론 전환.\n3) 미팅 첫 5분의 주도권은 '준비된 질문'에서 나옵니다. 상대 업무 프로세스에 대한 구체적 질문 2개를 준비해 가세요.\n\n※ 본 답변은 AI가 자동 생성한 참고용 답변입니다." } },
    { id: "p9", board: "record", uid: "u5", title: "[실적인증] 정수기+공기청정기 패키지 12계정 (6월 최종)",
      body: "오피스텔 신축 입주 시기를 노린 단지 집중 공략이 적중했습니다. 관리사무소 제휴가 핵심이었어요.",
      date: "2026-07-12 10:02", views: 654, likes: 51, scraps: 28, comments: 1, verified: true },
    { id: "p10", board: "free", uid: "u6", title: "[대표인증] 저는 영업 출신 대표입니다. 무엇이든 물어보세요",
      body: "식자재 B2B에서 10년 영업하고 창업해 5년째 회사를 운영 중입니다. 영업직 커리어, 창업, 조직 운영 관련 질문 받습니다.",
      date: "2026-07-11 15:00", views: 2431, likes: 198, scraps: 87, comments: 2, hot: true },
  ],

  comments: [
    { id: "cm1", pid: "p1", uid: "u1", text: "거절은 통계로 받아들이는 게 답입니다. 전 '거절 30개 모으기' 게임으로 바꿨더니 오히려 콜이 늘었어요.", date: "2026-07-17 10:02", likes: 12, best: true },
    { id: "cm2", pid: "p1", uid: "u2", text: "AI 답변의 거절 3분류 실제로 씁니다. ①타이밍 거절은 3개월 뒤 리마인드 걸어두세요.", date: "2026-07-17 10:31", likes: 8 },
    { id: "cm3", pid: "p2", uid: "u8", text: "총보상 비교표 만들라는 AI 답변에 +1. 저는 엑셀로 3사 비교표 만들어 협상에서 400 올렸습니다.", date: "2026-07-16 21:04", likes: 15, best: true },
    { id: "cm4", pid: "p3", uid: "u7", text: "보장 분석 리포트 먼저 보내는 방식, 노하우 게시판에 정리해 주시면 안 될까요?", date: "2026-07-15 19:12", likes: 6 },
    { id: "cm5", pid: "p3", uid: "u6", text: "사전 리포트 발송은 신뢰 구축의 정석이죠. 체결률 데이터도 궁금하네요.", date: "2026-07-15 20:40", likes: 4 },
    { id: "cm6", pid: "p4", uid: "u4", text: "ROI 역산 한 장 추가하고 나서 견적 반려율이 눈에 띄게 줄었습니다. 강추.", date: "2026-07-14 13:55", likes: 21, best: true },
    { id: "cm7", pid: "p4", uid: "u3", text: "템플릿 스크랩했습니다. 자동차 법인판매 쪽에도 응용해 볼게요.", date: "2026-07-14 15:20", likes: 5 },
    { id: "cm8", pid: "p5", uid: "u2", text: "106% 축하드립니다! 저는 98%로 아쉽게 마감했네요.", date: "2026-07-17 19:30", likes: 3 },
    { id: "cm9", pid: "p5", uid: "u5", text: "마감 후 삼겹살은 진리입니다.", date: "2026-07-17 19:41", likes: 2 },
    { id: "cm10", pid: "p6", uid: "u7", text: "'사유 말고 패턴을 물어라' 오늘 바로 써먹었습니다. 감사합니다.", date: "2026-07-13 17:02", likes: 9 },
    { id: "cm11", pid: "p7", uid: "u8", text: "동의합니다. 리뷰 항목에 '고용 형태/전환 조건'이 있으면 정보 가치가 클 것 같아요.", date: "2026-07-16 16:10", likes: 7 },
    { id: "cm12", pid: "p8", uid: "u1", text: "어젠다 제시 전환 멘트가 핵심입니다. 상대도 시간 아끼는 걸 좋아해요.", date: "2026-07-15 09:15", likes: 5, best: true },
    { id: "cm13", pid: "p9", uid: "u3", text: "관리사무소 제휴 아이디어 좋네요. 신축 입주 시즌 캘린더 관리하시나요?", date: "2026-07-12 11:20", likes: 4 },
    { id: "cm14", pid: "p10", uid: "u7", text: "영업 몇 년 차에 창업을 결심하셨나요? 준비 기간이 궁금합니다.", date: "2026-07-11 16:22", likes: 11 },
    { id: "cm15", pid: "p10", uid: "u2", text: "영업 출신 대표가 뽑고 싶은 영업사원의 조건이 궁금합니다.", date: "2026-07-11 17:45", likes: 14 },
  ],

  boards: {
    free:    { label: "자유게시판",  desc: "영업인들의 일상과 소통" },
    qna:     { label: "질문답변",    desc: "질문을 올리면 AI가 1분 내 답변 · 선배들의 실전 답변까지", ai: true },
    record:  { label: "실적인증",    desc: "증빙과 함께하는 실적 자랑 (증빙은 블러 처리)" },
    knowhow: { label: "노하우공유",  desc: "현장에서 검증된 영업 노하우" },
  },

  /* ---------- 관리자: 뱃지(등급) 신청 큐 ---------- */
  badgeRequests: [
    { id: "b1", uid: "u4", nick: "제약러버",   want: "pro",    file: "사원증_대성제약.jpg",   date: "2026-07-16", status: "대기" },
    { id: "b2", uid: "u7", nick: "신입세일즈", want: "pro",    file: "재직증명서.pdf",        date: "2026-07-15", status: "대기" },
    { id: "b3", uid: "u3", nick: "카마스터K",  want: "expert", file: "판매왕_수상내역.png",   date: "2026-07-14", status: "대기" },
    { id: "b4", uid: "u5", nick: "렌탈의신",   want: "expert", file: "경력증명서_5년.pdf",    date: "2026-07-12", status: "승인" },
    { id: "b5", uid: "u6", nick: "대표J",      want: "ceo",    file: "사업자등록증.jpg",      date: "2026-07-10", status: "승인" },
  ],

  /* ---------- 관리자: 신고 큐 ---------- */
  reports: [
    { id: "rp1", target: "게시글", title: "○○보험 절대 가지 마세요 (욕설 포함)", reason: "욕설·비방", reporter: "월천보험왕", date: "2026-07-17", status: "접수" },
    { id: "rp2", target: "댓글",   title: "리크루팅 DM 드립니다 (연락처 포함)",   reason: "영리 목적 홍보", reporter: "영업9단", date: "2026-07-16", status: "접수" },
    { id: "rp3", target: "리뷰",   title: "특정 팀장 실명 거론 리뷰",             reason: "개인정보 노출", reporter: "핏한제안서", date: "2026-07-15", status: "처리완료" },
  ],

  /* ---------- 메인 큐레이션 (관리자 수동 배치) ---------- */
  curation: {
    hotPosts:   ["p4", "p10", "p3", "p1", "p2"],
    hotCompanies: ["c3", "c4", "c1", "c12"],
    todayKnowhow: "p4",
    recordRank: [
      { uid: "u2", label: "월납 187만 (보험)" },
      { uid: "u5", label: "12계정 (렌탈)" },
      { uid: "u8", label: "수주 2.4억 (B2B)" },
    ],
  },

  /* ---------- AI 자동답변 시뮬레이션 사전 ---------- */
  aiTemplates: [
    { keys: ["콜드콜", "거절", "멘탈"], text: "거절 대응의 핵심은 수치화입니다.\n\n1) 거절을 전환 퍼널의 통계로 재해석하세요 — 거절 1건은 실패가 아니라 전환까지의 카운트다운입니다.\n2) 거절 유형을 ①타이밍 ②적합도 ③방식 3가지로 분류해 ①은 리마인드, ②는 리스트 정비, ③만 스크립트 개선 대상으로 관리하세요.\n3) 콜 블록 사이 5분 리셋 루틴을 권장합니다." },
    { keys: ["이직", "연봉", "협상"], text: "연봉 협상은 '기본급'이 아니라 '총보상' 프레임으로 접근하세요.\n\n1) 기본급+인센티브 구조+차량·통신·교육 지원을 합산한 3사 비교표를 만들어 제시하면 협상력이 올라갑니다.\n2) 현 직장에서의 정량 실적(달성률·수주액)을 최근 4분기 기준으로 정리하세요.\n3) 희망 연봉은 범위가 아닌 '근거 있는 단일 숫자'로 제시하는 것이 유리하다는 연구가 많습니다." },
    { keys: ["미팅", "제안", "발표", "아이스"], text: "미팅 준비는 '2분 룰 + 어젠다 제시'가 기본입니다.\n\n1) 아이스브레이킹은 상대 회사와 관련된 소재 1개, 2분 이내로.\n2) \"오늘 논의드릴 세 가지부터 말씀드릴게요\" 같은 어젠다 제시로 본론 전환.\n3) 상대 업무 프로세스에 대한 구체적 질문 2개를 준비해 가면 첫 5분의 주도권을 가져올 수 있습니다." },
    { keys: ["인센티브", "수당", "정산"], text: "인센티브 구조를 볼 때는 3가지를 확인하세요.\n\n1) 정산 주기(월/분기)와 지급 지연 조건 — 리뷰 게시판에서 '정산' 키워드로 현직자 평을 검색해 보세요.\n2) 클로백(환수) 조항 — 해지·반품 시 수당 환수 기준이 회사별로 크게 다릅니다.\n3) 목표(쿼터) 산정 방식이 투명한지 — 목표가 일방 통보되는 조직은 이탈률이 높은 경향이 있습니다." },
  ],
  aiFallback: "질문 주신 내용을 분석했습니다.\n\n1) 이 주제는 회사·업계별 편차가 큰 영역입니다. 소속 업계(보험/제약/IT/렌탈 등)를 함께 적어주시면 더 구체적인 답변이 가능합니다.\n2) 커뮤니티의 노하우공유 게시판에서 관련 키워드를 검색해 보시길 권합니다 — 현직 선배들의 검증된 사례가 축적되어 있습니다.\n3) 회사 관련 질문이라면 회사리뷰 게시판의 항목별 별점과 현직자 리뷰를 교차 확인해 보세요.",

  aiDisclaimer: "본 답변은 OpenAI GPT 기반 AI가 자동 생성한 참고용 답변입니다. 부정확할 수 있으며, 커뮤니티 선배들의 실전 답변을 함께 확인하세요.",
};

/* 통계(관리자 대시보드용) */
const ADMIN_STATS = {
  kpi: { members: 12847, todayPosts: 84, pendingBadges: 3, pendingReports: 2 },
  weekly: {
    labels: ["7/11", "7/12", "7/13", "7/14", "7/15", "7/16", "7/17"],
    posts:  [61, 48, 55, 73, 68, 79, 84],
    reviews:[14, 11, 9,  17, 15, 19, 22],
    signups:[32, 25, 28, 41, 38, 45, 51],
  },
};
