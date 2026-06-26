/* =========================================================
 *  대한창업지원협회(KSSA) 데모 — 목(mock) 데이터
 *  실제 구축 시 백엔드 API / RDBMS 로 대체
 * =======================================================*/
window.KSSA = (function () {

  /* ---- 히어로 롤링 배너 ---- */
  const banners = [
    {
      kw: "CHALLENGE", accent: "을 응원합니다",
      copy: "창업의 시작, 협회가 함께합니다",
      sub: "예비창업부터 스케일업까지 — 멘토링·공간·자금·판로를 한 곳에서 지원합니다.",
      cta: [{ label: "지원사업 보기", href: "#programs", solid: true }, { label: "협회 소개", href: "about.html" }]
    },
    {
      kw: "GROWTH", accent: ", 데이터로 키웁니다",
      copy: "검증된 성장 프로그램으로 다음 단계로",
      sub: "1:1 전담 멘토링과 투자 연계로 예비창업기업의 생존율을 끌어올립니다.",
      cta: [{ label: "멘토링 신청", href: "inquiry.html", solid: true }, { label: "정보·공지", href: "board.html" }]
    },
    {
      kw: "CONNECT", accent: " — 사람과 기회",
      copy: "투자자·선배 창업가와 연결됩니다",
      sub: "데모데이·네트워킹·협력기관 매칭으로 창업가가 필요한 사람을 만납니다.",
      cta: [{ label: "회원가입", href: "member.html", solid: true }, { label: "협회 연혁", href: "about.html#history" }]
    },
    {
      kw: "GLOBAL", accent: " 무대로",
      copy: "국내를 넘어 세계 시장으로",
      sub: "해외 진출 컨설팅과 글로벌 액셀러레이팅으로 창업기업의 도전을 확장합니다.",
      cta: [{ label: "글로벌 지원", href: "#programs", solid: true }, { label: "1:1 문의", href: "inquiry.html" }]
    }
  ];

  /* ---- 퀵 메뉴 ---- */
  const quick = [
    { key: "apply", label: "지원사업 신청", sub: "모집 공고 확인" },
    { key: "mentor", label: "멘토링 예약", sub: "전담 멘토 매칭" },
    { key: "notice", label: "공지·정보", sub: "최신 소식" },
    { key: "inquiry", label: "1:1 문의", sub: "비밀글 상담" },
    { key: "map", label: "오시는 길", sub: "협회 본부 안내" }
  ];

  /* ---- 지원사업(프로그램) ---- */
  const programs = [
    {
      img: "assets/media/prog-mentoring.jpg", tag: "MENTORING",
      title: "1:1 전담 멘토링", target: "inquiry.html",
      desc: "분야별 전문 멘토단이 사업모델 검증부터 IR 전략까지 1:1로 밀착 코칭합니다. 매월 정기 멘토링과 수시 상담을 함께 제공합니다.",
      feats: ["사업모델 검증", "재무·법무 자문", "IR 피칭 코칭"]
    },
    {
      img: "assets/media/prog-funding.jpg", tag: "FUNDING",
      title: "투자 연계 · 데모데이", target: "board.html",
      desc: "정기 데모데이와 투자자 네트워크를 통해 우수 창업기업의 후속 투자를 연결합니다. 협회 추천 기업에는 IR 자료 제작도 지원합니다.",
      feats: ["데모데이 개최", "VC·AC 매칭", "정부지원 연계"]
    },
    {
      img: "assets/media/prog-space.jpg", tag: "SPACE",
      title: "입주공간 · 인프라", target: "inquiry.html",
      desc: "회의실·세미나실을 갖춘 코워킹 입주공간과 시제품 제작, 클라우드 크레딧 등 창업에 필요한 인프라를 합리적으로 제공합니다.",
      feats: ["코워킹 데스크", "회의·세미나실", "시제품·클라우드"]
    },
    {
      img: "assets/media/prog-global.jpg", tag: "GLOBAL",
      title: "글로벌 진출 지원", target: "board.html",
      desc: "해외 시장 조사, 현지 액셀러레이터 연계, 글로벌 IR 통역까지 — 국내를 넘어 세계 시장에 도전하는 창업기업을 지원합니다.",
      feats: ["해외시장 조사", "현지 AC 연계", "글로벌 IR"]
    }
  ];

  /* ---- 핵심 지표 ---- */
  const stats = [
    { n: 12, suffix: "년", label: "협회 운영 노하우" },
    { n: 3200, suffix: "+", label: "누적 지원 창업기업" },
    { n: 480, suffix: "명", label: "활동 멘토단" },
    { n: 2700, suffix: "억+", label: "누적 투자 연계 규모" }
  ];

  /* ---- 게시판: 공지 / 정보 / 보도 ---- */
  const notices = [
    { id: 101, cat: "공지", title: "2026년 예비창업패키지 협회 추천 기업 모집 안내", date: "2026-06-24", views: 1842, isNew: true,
      body: "2026년 예비창업패키지 협회 추천 트랙 참여 기업을 모집합니다. 신청 자격, 제출 서류, 평가 일정은 첨부파일을 확인하시기 바랍니다. 접수는 협회 회원 로그인 후 1:1 문의를 통해 진행됩니다.",
      files: ["2026_예비창업패키지_모집공고.pdf", "신청서_양식.hwp"] },
    { id: 100, cat: "공지", title: "협회 본부 이전 및 입주공간 신규 오픈 안내", date: "2026-06-18", views: 1203, isNew: true,
      body: "협회 본부가 6월 30일자로 신규 입주공간으로 이전합니다. 코워킹 데스크와 세미나실 예약은 7월 1일부터 가능합니다. 자세한 위치는 오시는 길 페이지를 참고하세요.",
      files: ["입주공간_안내.pdf"] },
    { id: 99, cat: "공지", title: "제8기 창업 멘토단 모집 (분야별 전문가)", date: "2026-06-05", views: 980, isNew: false,
      body: "제8기 창업 멘토단을 모집합니다. IT·바이오·제조·마케팅·재무 등 분야별 5년 이상 경력 전문가의 많은 지원 바랍니다.",
      files: ["멘토단_모집요강.pdf"] },
    { id: 98, cat: "공지", title: "여름 정기 휴무 및 상담 운영 시간 변경 안내", date: "2026-05-28", views: 651, isNew: false, body: "8월 첫째 주 협회 정기 휴무에 따라 1:1 상담 운영 시간이 변경됩니다.", files: [] }
  ];
  const infos = [
    { id: 201, cat: "정보", title: "[정책] 2026 하반기 정부 창업지원사업 통합공고 요약", date: "2026-06-22", views: 2410, isNew: true,
      body: "중기부·창업진흥원이 발표한 2026 하반기 창업지원사업 통합공고의 핵심을 협회가 정리했습니다. 예비·초기·도약 단계별 주요 사업과 일정을 한눈에 확인하세요.",
      files: ["2026하반기_통합공고_요약.pdf"] },
    { id: 200, cat: "정보", title: "[가이드] 초기 스타트업을 위한 IR 피칭덱 작성법", date: "2026-06-12", views: 1888, isNew: true,
      body: "투자자의 관심을 끄는 IR 피칭덱 구성 순서와 슬라이드별 핵심 메시지를 예시와 함께 안내합니다.", files: ["IR_피칭덱_템플릿.pptx"] },
    { id: 199, cat: "정보", title: "[세무] 창업 1년차가 꼭 알아야 할 세무 체크리스트", date: "2026-05-30", views: 1320, isNew: false,
      body: "법인 설립 직후 챙겨야 할 세무 신고 일정과 절세 포인트를 정리했습니다.", files: ["창업세무_체크리스트.pdf"] },
    { id: 198, cat: "정보", title: "[지식재산] 스타트업 상표·특허 출원 기초", date: "2026-05-20", views: 1102, isNew: false, body: "초기 창업기업이 알아야 할 IP 보호 전략의 기초를 다룹니다.", files: [] }
  ];
  const press = [
    { id: 301, cat: "보도", title: "대한창업지원협회, 2026 상반기 데모데이 성료… 12개사 투자 유치", date: "2026-06-20", thumb: "assets/media/prog-funding.jpg",
      body: "협회가 개최한 2026 상반기 데모데이에서 참가 12개사가 총 340억 원 규모의 투자 유치에 성공했다.", views: 760 },
    { id: 300, cat: "보도", title: "“창업 생태계 허브로” — 협회 신규 입주공간 개관", date: "2026-06-15", thumb: "assets/media/prog-space.jpg",
      body: "협회가 코워킹·세미나 인프라를 갖춘 신규 입주공간을 개관하고 창업기업 모집에 나섰다.", views: 540 },
    { id: 299, cat: "보도", title: "협회-지자체 업무협약… 지역 창업 글로벌 진출 맞손", date: "2026-05-25", thumb: "assets/media/prog-global.jpg",
      body: "협회와 지자체가 지역 창업기업의 해외 진출 공동 지원을 위한 업무협약을 체결했다.", views: 430 }
  ];

  /* ---- FAQ ---- */
  const faqs = [
    { q: "협회 회원은 어떻게 가입하나요?", a: "상단 ‘회원가입’에서 이메일 기반으로 기업 정보를 입력하면 가입 신청이 접수됩니다. 담당자 확인 후 승인되며, 마이페이지에서 신청 현황과 1:1 문의 답변을 확인할 수 있습니다." },
    { q: "지원사업 신청 자격에 제한이 있나요?", a: "사업별로 업력·매출·대표자 요건이 다릅니다. 각 모집 공고의 첨부파일에서 상세 자격을 확인하시고, 궁금한 점은 1:1 문의로 상담받으실 수 있습니다." },
    { q: "멘토링은 비용이 드나요?", a: "협회 회원사를 대상으로 한 정기 멘토링은 무료로 운영됩니다. 일부 심화 프로그램은 별도 안내됩니다." },
    { q: "1:1 문의는 다른 사람도 볼 수 있나요?", a: "비밀글로 설정하면 작성자 본인과 관리자만 열람할 수 있습니다. 민감한 사업 정보는 비밀글로 작성해 주세요." },
    { q: "입주공간은 어떻게 신청하나요?", a: "입주공간 모집 공고가 게시되면 1:1 문의 또는 신청 폼을 통해 접수합니다. 좌석 현황에 따라 대기가 발생할 수 있습니다." }
  ];

  /* ---- 1:1 문의 (마이페이지/문의 페이지 공용) ---- */
  const inquiries = [
    { id: 5021, cat: "지원사업", title: "예비창업패키지 협회 추천 신청 자격 문의", date: "2026-06-23", secret: true, status: "답변완료",
      question: "법인 설립 8개월차 기업인데 예비창업패키지 협회 추천 트랙에 지원할 수 있을까요? 매출은 발생하지 않았습니다.",
      answer: "예비창업패키지는 창업 이전(예비창업자) 또는 일정 업력 미만을 대상으로 합니다. 법인 설립 8개월차이시면 ‘초기창업패키지’ 트랙이 더 적합할 수 있습니다. 상세 자격은 첨부 공고를 확인하시고, 추가 상담을 원하시면 회신 부탁드립니다.", answeredAt: "2026-06-24" },
    { id: 5018, cat: "멘토링", title: "재무 분야 멘토 매칭 가능 시기", date: "2026-06-19", secret: false, status: "답변완료",
      question: "재무·세무 분야 멘토 매칭을 신청하면 보통 며칠 정도 걸리나요?", answer: "신청 후 영업일 기준 3~5일 내 분야 멘토를 매칭해 드립니다. 일정 조율 후 첫 멘토링이 진행됩니다.", answeredAt: "2026-06-20" },
    { id: 5015, cat: "입주공간", title: "코워킹 데스크 잔여 좌석 문의", date: "2026-06-17", secret: true, status: "접수",
      question: "신규 입주공간 코워킹 데스크 2석을 신청하고 싶은데 잔여 좌석이 있을까요?", answer: "", answeredAt: "" }
  ];

  /* ---- 관리자: 회원 ---- */
  const members = [
    { id: "M-2041", company: "넥스트리프(주)", name: "김도현", email: "dohyun@nextleaf.io", joined: "2026-06-24", status: "대기" },
    { id: "M-2040", company: "블루오션랩", name: "이서연", email: "seoyeon@blueoceanlab.kr", joined: "2026-06-22", status: "정상" },
    { id: "M-2039", company: "코드그로브", name: "박준영", email: "jy.park@codegrove.dev", joined: "2026-06-20", status: "정상" },
    { id: "M-2038", company: "헬스핀", name: "최민지", email: "minji@healthpin.co", joined: "2026-06-18", status: "정상" },
    { id: "M-2037", company: "그린모먼트", name: "정우성", email: "ws.jung@greenmoment.kr", joined: "2026-06-15", status: "정지" },
    { id: "M-2036", company: "딜라이트AI", name: "한지원", email: "jiwon@delight.ai", joined: "2026-06-12", status: "정상" }
  ];

  /* ---- 관리자: 월별 가입 추이 ---- */
  const monthly = [
    { m: "1월", v: 38 }, { m: "2월", v: 52 }, { m: "3월", v: 61 },
    { m: "4월", v: 74 }, { m: "5월", v: 89 }, { m: "6월", v: 112 }
  ];

  /* ---- 협회 연혁 ---- */
  const history = [
    { yr: "2026", events: ["신규 입주공간 개관 · 누적 지원기업 3,200개사 돌파", "2026 상반기 데모데이 12개사 투자 유치"] },
    { yr: "2024", events: ["글로벌 액셀러레이팅 프로그램 신설", "지자체 5곳과 창업 지원 업무협약"] },
    { yr: "2021", events: ["창업 멘토단 300명 위촉", "정부 창업지원사업 운영기관 선정"] },
    { yr: "2018", events: ["사단법인 대한창업지원협회 설립 인가", "제1기 창업지원 프로그램 출범"] },
    { yr: "2014", events: ["창업가 네트워크 모임으로 시작"] }
  ];

  /* ---- 협력기관 ---- */
  const partners = ["KSTARTUP", "MSS", "KIBO", "KODIT", "SBA", "KOTRA", "TIPS", "K-WATER", "NIPA", "KOSME", "VENTURES", "AC LAB"];

  return { banners, quick, programs, stats, notices, infos, press, faqs, inquiries, members, monthly, history, partners };
})();
