/* OBZEN B안 "Confluence" — 데모 콘텐츠 (전부 제안용 가상 데이터) */
window.OBZEN_STORY = {
  /* CH.05 통합 서비스·제품 — 아코디언 */
  services: [
    {
      code: "S1",
      name: "Customer Data Platform",
      kor: "고객 데이터 플랫폼",
      summary: "흩어진 고객 접점 데이터를 하나의 고객 관점으로 모읍니다. 오브젠이 오래 다뤄 온 CRM·캠페인 데이터가 출발점입니다.",
      points: ["실시간·배치 데이터 통합", "동의 기반 고객 식별", "세그먼트·여정 설계"],
      metaLabel: "합류 이전",
      metaValue: "오브젠 · 고객 데이터"
    },
    {
      code: "S2",
      name: "Data & Analytics Engineering",
      kor: "데이터·분석 엔지니어링",
      summary: "기업 전반의 데이터를 연결하고 신뢰할 수 있는 분석 기반으로 정리합니다. 잘레시아의 데이터 엔지니어링 역량이 중심입니다.",
      points: ["데이터 파이프라인·품질 관리", "통합 BI·경영 대시보드", "데이터 계보와 거버넌스"],
      metaLabel: "합류 이전",
      metaValue: "잘레시아 · 경영 데이터"
    },
    {
      code: "S3",
      name: "AI Decision Layer",
      kor: "AI 의사결정 레이어",
      summary: "두 데이터가 만나 예측·추천·생성형 AI가 실제 업무 언어로 답합니다. 합병으로 새로 가능해진 영역입니다.",
      points: ["예측 모델과 시나리오 분석", "근거 추적 가능한 생성형 AI", "업무 맥락에 연결된 추천"],
      metaLabel: "합류 이후",
      metaValue: "통합 · 새로운 역량"
    },
    {
      code: "S4",
      name: "Activation & Governance",
      kor: "실행·거버넌스",
      summary: "결정을 캠페인·현장·경영 프로세스로 안전하게 전달하고, 누가 무엇을 했는지 설명할 수 있게 남깁니다.",
      points: ["다채널 캠페인·업무 실행", "접근 통제와 처리 이력", "온프레미스·클라우드 배포 선택"],
      metaLabel: "합류 이후",
      metaValue: "통합 · 책임 있는 실행"
    }
  ],

  /* CH.03 시너지 카운트업 */
  synergy: [
    { value: 2, suffix: "→1", cap: "두 전문 조직이 하나로", sub: "오브젠 · 잘레시아 통합 법인" },
    { value: 24, suffix: "년+", cap: "누적 데이터·마케팅 경험", sub: "두 회사 역량의 합" },
    { value: 4, suffix: "단계", cap: "수집→통합→분석→실행", sub: "하나의 연속된 흐름" },
    { value: 100, suffix: "%", cap: "설명 가능한 AI 지향", sub: "근거 추적 · 거버넌스" }
  ],

  /* CH.04 연혁 타임라인 */
  timeline: [
    { year: "2003", tag: "obzen", tagLabel: "OBZEN", firm: "오브젠", title: "고객 데이터·마케팅의 시작", body: "고객 접점 데이터를 다루는 CRM·캠페인 실행 역량을 축적하기 시작했습니다." },
    { year: "2011", tag: "zalesia", tagLabel: "ZALESIA", firm: "잘레시아", title: "데이터 엔지니어링 기반 구축", body: "기업 데이터 통합과 BI·분석 인프라를 설계하는 전문성을 쌓았습니다." },
    { year: "2020", tag: "obzen", tagLabel: "OBZEN", firm: "오브젠", title: "AI 마케팅으로 확장", body: "예측과 개인화를 실무에 적용하며 데이터 실행의 폭을 넓혔습니다." },
    { year: "2026", tag: "one", tagLabel: "MERGER", firm: "통합", title: "두 흐름이 하나로 — 통합 법인 출범", body: "고객 데이터 실행과 데이터 엔지니어링이 만나, 수집부터 실행까지 이어지는 하나의 회사가 되었습니다.", merge: true },
    { year: "NEXT", tag: "one", tagLabel: "VISION", firm: "통합", title: "데이터에서 다음 행동까지", body: "고객 데이터와 경영 데이터를 잇는 통합 AI 파트너로 나아갑니다." }
  ],

  /* CH.06 뉴스룸 & IR */
  ir: [
    { id: 1, type: "notice", label: "공지", date: "2026.07.29", title: "통합 법인 출범 및 홈페이지 개편 방향 안내" },
    { id: 2, type: "ir", label: "IR", date: "2026.07.24", title: "2026년 상반기 경영현황 설명자료" },
    { id: 3, type: "news", label: "보도자료", date: "2026.07.18", title: "오브젠, 통합 AI 데이터 사업 전략 발표" },
    { id: 4, type: "ir", label: "IR", date: "2026.07.11", title: "기업지배구조 주요 현황" },
    { id: 5, type: "notice", label: "공지", date: "2026.07.03", title: "합병에 따른 개인정보 이전 안내" },
    { id: 6, type: "news", label: "보도자료", date: "2026.06.27", title: "고객 데이터와 경영 데이터를 잇는 통합 브랜드 공개" }
  ],

  /* 통합검색 */
  search: [
    { category: "회사", title: "오브젠·잘레시아 통합 비전", meta: "회사소개 · 합류 스토리", target: "#story" },
    { category: "합병", title: "두 흐름이 하나로 — 합병의 순간", meta: "합병 정보 · 통합 서사", target: "#merge" },
    { category: "서비스", title: "AI 의사결정 레이어", meta: "통합 서비스 · 새로운 역량", target: "#services" },
    { category: "서비스", title: "고객 데이터 플랫폼(CDP)", meta: "통합 서비스 · 고객 데이터", target: "#services" },
    { category: "연혁", title: "2026 통합 법인 출범", meta: "연혁 · 합병", target: "#history" },
    { category: "IR", title: "2026년 상반기 경영현황 설명자료", meta: "뉴스룸·IR · 제안용 가상 데이터", target: "#newsroom" }
  ]
};
