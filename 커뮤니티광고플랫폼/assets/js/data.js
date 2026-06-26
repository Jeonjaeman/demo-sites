/* =========================================================
 *  MOA — 앱 커뮤니티 + 자체 광고 플랫폼 데모 (mock 데이터)
 *  실제 구축 시 Supabase(PostgreSQL/Auth/Storage/Edge Fn)로 대체
 *  ※ 운송포탈·창업지원협회 데모와 의도적으로 다른 톤/구조/색/폰트
 * =======================================================*/
window.MOA = (function () {

  /* ---- 브랜드 ---- */
  const brand = {
    name: "MOA",
    ko: "모아",
    tagline: "앱 속 커뮤니티 & 자체 광고 플랫폼",
    desc: "Flutter 앱 웹뷰로 연동되는 익명 커뮤니티 게시판과, 노출·클릭을 직접 트래킹하는 자체 광고 시스템을 Supabase 기반으로 통합한 플랫폼입니다."
  };

  /* ---- 랜딩 핵심 지표 ---- */
  const stats = [
    { n: 184000, suffix: "+", label: "월간 활성 유저(MAU)" },
    { n: 12, suffix: "종", label: "광고 소재·노출 위치" },
    { n: 99.2, suffix: "%", label: "트래킹 집계 정확도", float: true },
    { n: 38, suffix: "ms", label: "평균 노출 트래킹 지연" }
  ];

  /* ---- 랜딩: 3개 진입 surface ---- */
  const surfaces = [
    { key: "app", en: "COMMUNITY", title: "사용자 커뮤니티", target: "app.html",
      desc: "Flutter 앱 웹뷰에 임베드되는 익명 게시판. 글·댓글·투표·신고·스크랩·AI 번역과 5종 광고 소재 노출까지.",
      points: ["익명 닉네임·이미지 3장", "댓글·대댓글·신고", "스포일러·투표·번역"] },
    { key: "admin", en: "BACKOFFICE", title: "관리자 어드민", target: "admin.html",
      desc: "회원·권한 4단계 관리, 게시글/신고 처리, 광고 캠페인·소재 운영과 노출/클릭/CTR 트래킹 통계까지 한 곳에서.",
      points: ["4단계 권한·제재", "캠페인·5종 소재", "트래킹 통계·CSV"] },
    { key: "advertiser", en: "DASHBOARD", title: "광고주 대시보드", target: "advertiser.html",
      desc: "광고주가 본인 캠페인의 집행 현황과 소재별 성과를 실시간 그래프로 확인하고 리포트를 CSV로 내려받습니다.",
      points: ["내 캠페인 현황", "소재별 성과", "기간별 추이·CSV"] }
  ];

  /* ---- 랜딩: 기능 하이라이트 ---- */
  const features = [
    { ico: "feed", title: "익명 커뮤니티 게시판", desc: "익명 닉네임 글쓰기(500자·이미지 3장), 댓글·대댓글, 좋아요·스크랩, 내 글/스크랩 보기." },
    { ico: "ad", title: "5종 자체 광고 소재", desc: "피드 카드·전면 팝업·하단 배너·바텀시트·하단 슬라이드를 위치별로 노출하고 클릭을 외부 링크로 라우팅." },
    { ico: "track", title: "노출·클릭 트래킹", desc: "Batch 적재로 DB 과부하 없이 노출수·클릭수·CTR를 집계하고 캠페인별로 자동 만료 처리." },
    { ico: "shield", title: "신고·제재 운영", desc: "악성 유저·게시글 신고 접수와 처리, 4단계 권한(관리자/광고주/유료/무료) 승인·반려·차단." },
    { ico: "globe", title: "클라이언트 AI 번역", desc: "Edge Function 프록시로 API Key 노출 없이 번역. 캐시·로딩·재시도·원문 보기 지원, DB 미저장." },
    { ico: "seo", title: "SEO 메타·웹뷰 최적화", desc: "URL Slug·OG Image·JSON-LD 등 SEO 메타와 모바일 이미지 클라이언트 리사이징/압축." }
  ];

  /* ---- 광고주(브랜드) ---- */
  const advertisers = [
    { id: "AD-01", name: "프레시밀 키트", color: "#22c08b" },
    { id: "AD-02", name: "노바 핀테크", color: "#3b82f6" },
    { id: "AD-03", name: "글로우업 뷰티", color: "#ff5d8f" },
    { id: "AD-04", name: "런모어 러닝화", color: "#f59e0b" },
    { id: "AD-05", name: "스테이코지 호텔", color: "#8b5cf6" }
  ];

  /* ---- 5종 광고 소재 (위치 타입) ---- */
  const adTypes = {
    feed:       { label: "피드 카드형", pos: "피드 인스트림", note: "리스트 중간 카드" },
    popup:      { label: "전면 팝업형", pos: "앱 진입 인터스티셜", note: "전체 화면 오버레이" },
    banner:     { label: "하단 배너형", pos: "화면 하단 고정", note: "320×100 고정 배너" },
    bottomsheet:{ label: "바텀시트형", pos: "하단 시트 슬라이드업", note: "행동 유도 시트" },
    slide:      { label: "하단 슬라이드형", pos: "하단 가로 슬라이드", note: "추천 카드 캐러셀" }
  };

  /* ---- 커뮤니티 광고 소재 (피드/오버레이에 노출) ---- */
  const ads = {
    feed: { id: "CR-1007", type: "feed", adv: "AD-01", campaign: "프레시밀 6월 런칭",
      badge: "AD", brand: "프레시밀 키트", headline: "오늘 저녁, 15분이면 끝나는 집밥",
      body: "신선 재료 손질 끝. 레시피대로 굽기만 하면 완성되는 밀키트, 첫 주문 40% 할인.",
      cta: "첫 주문 할인받기", grad: "linear-gradient(135deg,#0fb37a,#1ed6a0)" },
    popup: { id: "CR-1009", type: "popup", adv: "AD-03", campaign: "글로우업 여름 세일",
      badge: "광고", brand: "글로우업 뷰티", headline: "여름맞이 빅세일\n전 품목 최대 50%",
      body: "선크림·쿠션·세럼까지. 오늘 자정까지만, 앱 전용가로 만나보세요.",
      cta: "세일 보러가기", grad: "linear-gradient(135deg,#ff5d8f,#ff8f6b)" },
    banner: { id: "CR-1011", type: "banner", adv: "AD-02", campaign: "노바페이 전환",
      badge: "AD", brand: "노바 핀테크", headline: "수수료 0원 송금, 노바페이",
      body: "지금 가입하면 1만 포인트", cta: "가입", grad: "linear-gradient(135deg,#2563eb,#4f9bff)" },
    bottomsheet: { id: "CR-1013", type: "bottomsheet", adv: "AD-04", campaign: "런모어 신상 드롭",
      badge: "광고", brand: "런모어 러닝화", headline: "가볍게 더 멀리 — 신상 러닝화 출시",
      body: "초경량 158g, 반발 폼 탑재. 출시 기념 한정 컬러를 가장 먼저 만나보세요.",
      cta: "신상 보기", grad: "linear-gradient(135deg,#f59e0b,#fbbf24)" },
    slide: [
      { id: "CR-1015", type: "slide", adv: "AD-05", brand: "스테이코지 호텔", headline: "주말 호캉스 특가", body: "도심 5성급 ~38%", grad: "linear-gradient(135deg,#8b5cf6,#a78bfa)" },
      { id: "CR-1016", type: "slide", adv: "AD-01", brand: "프레시밀 키트", headline: "신메뉴 4종", body: "샐러드 밀키트", grad: "linear-gradient(135deg,#0fb37a,#34d399)" },
      { id: "CR-1017", type: "slide", adv: "AD-03", brand: "글로우업 뷰티", headline: "1+1 쿠션", body: "오늘만 특가", grad: "linear-gradient(135deg,#ff5d8f,#fb7185)" }
    ]
  };

  /* ---- 커뮤니티 피드 게시글 ---- */
  const posts = [
    { id: 5102, kind: "notice", nick: "모아 운영팀", tag: "공지", pinned: true,
      title: "📢 커뮤니티 이용 수칙 및 신고 안내 (필독)",
      body: "건강한 커뮤니티를 위해 욕설·비방·도배·홍보성 글은 신고 대상입니다. 신고가 누적되면 자동으로 노출이 제한되며 운영팀 검토 후 제재됩니다. 누구나 안심하고 활동할 수 있도록 함께 지켜주세요.",
      imgs: 0, likes: 312, comments: 24, scraps: 88, time: "고정", mine: false },
    { id: 5101, kind: "poll", nick: "산책하는판다", tag: "투표",
      title: "주말 러닝 모임, 토요일 vs 일요일 언제가 좋아요?",
      body: "이번 달 정기 러닝 모임 요일을 정하려고 합니다. 투표 부탁드려요! 코스는 한강 10km 예정입니다.",
      imgs: 0, likes: 64, comments: 31, scraps: 12, time: "12분 전", mine: false,
      poll: { total: 0, options: [ { label: "토요일 아침", votes: 142 }, { label: "일요일 아침", votes: 97 }, { label: "아무때나 좋아요", votes: 38 } ] } },
    { id: 5100, kind: "user", nick: "코딩하는너구리", tag: "일반", hot: true,
      title: "드디어 사이드프로젝트 첫 결제가 찍혔습니다 🎉",
      body: "6개월 동안 퇴근 후에 붙잡고 있던 앱에서 오늘 첫 유료 결제가 들어왔어요. 금액은 작지만 누군가 내 서비스에 돈을 냈다는 게 너무 신기하네요. 다들 포기하지 마세요!",
      imgs: 2, likes: 421, comments: 57, scraps: 134, time: "1시간 전", mine: false,
      lang: "en", orig: "Finally got my first paid subscription on my side project after 6 months of after-work grind." },
    { id: 5099, kind: "user", nick: "익명의소금빵", tag: "일반", spoiler: true,
      title: "어제 그 드라마 마지막화 보신 분 (스포 주의)",
      body: "진짜 마지막에 주인공이 사실 쌍둥이였다는 거… 복선이 1화부터 깔려 있었더라고요. 다시 보니까 소름. 결말 해석 같이 해요.",
      imgs: 1, likes: 88, comments: 42, scraps: 9, time: "3시간 전", mine: false },
    { id: 5098, kind: "user", nick: "퇴근후헬스장", tag: "일반",
      title: "직장인 3대 운동 루틴 공유합니다 (초보용)",
      body: "헬스 시작한 지 3개월, 처음 짤 때 도움받았던 분할 루틴을 정리했어요. 무리하지 말고 자세부터. 질문 환영합니다.",
      imgs: 3, likes: 203, comments: 19, scraps: 71, time: "5시간 전", mine: true },
    { id: 5097, kind: "user", nick: "월급요정", tag: "일반",
      title: "재테크 입문 6개월차, 이건 진짜 미리 알았으면",
      body: "연금저축·IRP 세액공제만 챙겨도 연말정산이 달라집니다. 사회초년생이라면 비상금 통장부터 만드세요. 제 시행착오 공유해요.",
      imgs: 0, likes: 156, comments: 28, scraps: 96, time: "8시간 전", mine: false }
  ];

  /* ---- 게시글별 댓글(대댓글 포함) ---- */
  const comments = {
    5100: [
      { id: 1, nick: "빵먹는레서판다", body: "와 축하드려요! 저도 자극받고 갑니다 🔥", time: "52분 전", likes: 12,
        replies: [ { nick: "코딩하는너구리", op: true, body: "감사합니다 ㅎㅎ 같이 화이팅해요!", time: "40분 전", likes: 3 } ] },
      { id: 2, nick: "주말코더", body: "결제 연동은 어떤 거 쓰셨어요? 저도 붙이는 중인데 막막하네요", time: "44분 전", likes: 5, replies: [] },
      { id: 3, nick: "야근의민족", body: "퇴근 후 6개월… 그 꾸준함이 진짜 대단합니다", time: "30분 전", likes: 8, replies: [] }
    ],
    5101: [
      { id: 1, nick: "한강러너", body: "토요일 아침이 회복할 시간 있어서 좋아요", time: "8분 전", likes: 4, replies: [] },
      { id: 2, nick: "느림보거북", body: "일요일은 늦잠 포기 못함…", time: "5분 전", likes: 2, replies: [] }
    ],
    5099: [
      { id: 1, nick: "드라마폐인", body: "헐 저도 다시 봤는데 1화 거울 장면이 복선이었어요", time: "2시간 전", likes: 9, replies: [] }
    ]
  };

  /* ---- 광고 캠페인 (어드민) ---- */
  const campaigns = [
    { id: "CMP-2041", name: "프레시밀 6월 런칭", adv: "AD-01", plan: "프리미엄", type: "feed",
      start: "2026-06-01", end: "2026-06-30", target: "20–40 / 관심:요리", status: "진행중",
      budget: 4800000, imp: 512400, clk: 9220 },
    { id: "CMP-2040", name: "글로우업 여름 세일", adv: "AD-03", plan: "프리미엄", type: "popup",
      start: "2026-06-10", end: "2026-06-26", target: "여성 / 18–34", status: "진행중",
      budget: 6200000, imp: 388900, clk: 14760 },
    { id: "CMP-2039", name: "노바페이 전환", adv: "AD-02", plan: "스탠다드", type: "banner",
      start: "2026-06-05", end: "2026-07-05", target: "전체 / 핀테크", status: "진행중",
      budget: 3000000, imp: 901200, clk: 7150 },
    { id: "CMP-2038", name: "런모어 신상 드롭", adv: "AD-04", plan: "스탠다드", type: "bottomsheet",
      start: "2026-06-15", end: "2026-06-25", target: "20–39 / 운동", status: "진행중",
      budget: 2500000, imp: 145600, clk: 5980 },
    { id: "CMP-2035", name: "스테이코지 호캉스", adv: "AD-05", plan: "베이직", type: "slide",
      start: "2026-05-20", end: "2026-06-12", target: "25–45 / 여행", status: "종료",
      budget: 1800000, imp: 274300, clk: 4120 },
    { id: "CMP-2030", name: "프레시밀 봄 프로모션", adv: "AD-01", plan: "스탠다드", type: "feed",
      start: "2026-06-28", end: "2026-07-20", target: "20–40 / 관심:요리", status: "예약",
      budget: 3600000, imp: 0, clk: 0 }
  ];

  /* ---- 캠페인 일자별 트래킹 (최근 7일, 노출/클릭) ---- */
  const tracking = [
    { d: "06-20", imp: 286400, clk: 7180 },
    { d: "06-21", imp: 312800, clk: 8240 },
    { d: "06-22", imp: 298100, clk: 7960 },
    { d: "06-23", imp: 341200, clk: 9510 },
    { d: "06-24", imp: 372600, clk: 10840 },
    { d: "06-25", imp: 358900, clk: 10120 },
    { d: "06-26", imp: 389300, clk: 11460 }
  ];

  /* ---- 회원 (4단계 권한) ---- */
  const members = [
    { id: "U-90412", nick: "코딩하는너구리", email: "raccoon@moa.app", role: "무료", joined: "2026-06-24", status: "정상", posts: 14, reports: 0 },
    { id: "U-90411", nick: "프레시밀 키트", email: "ads@freshmeal.co", role: "광고주", joined: "2026-06-22", status: "정상", posts: 0, reports: 0 },
    { id: "U-90410", nick: "월급요정", email: "fairy@moa.app", role: "유료", joined: "2026-06-20", status: "정상", posts: 63, reports: 0 },
    { id: "U-90409", nick: "광고도배계정", email: "spam9@temp.io", role: "무료", joined: "2026-06-19", status: "정지", posts: 41, reports: 7 },
    { id: "U-90408", nick: "글로우업 뷰티", email: "mkt@glowup.kr", role: "광고주", joined: "2026-06-18", status: "정상", posts: 0, reports: 0 },
    { id: "U-90407", nick: "퇴근후헬스장", email: "gymrat@moa.app", role: "유료", joined: "2026-06-15", status: "정상", posts: 88, reports: 1 },
    { id: "U-90406", nick: "산책하는판다", email: "panda@moa.app", role: "무료", joined: "2026-06-12", status: "정상", posts: 27, reports: 0 }
  ];

  /* ---- 권한 신청 (승인/반려 대기) ---- */
  const roleRequests = [
    { id: "RQ-318", nick: "런모어 러닝화", from: "무료", to: "광고주", reason: "신상 러닝화 캠페인 집행 예정", date: "2026-06-25" },
    { id: "RQ-317", nick: "월급요정", from: "무료", to: "유료", reason: "스크랩·번역 무제한 이용 희망", date: "2026-06-24" },
    { id: "RQ-316", nick: "스테이코지 호텔", from: "무료", to: "광고주", reason: "여름 호캉스 프로모션 광고", date: "2026-06-23" }
  ];

  /* ---- 신고 접수 (게시글/댓글) ---- */
  const reports = [
    { id: "RP-771", target: "게시글", ref: "광고성 도배글 — “초저가 명품 DM주세요”", by: "익명3명", reason: "스팸·홍보", date: "2026-06-26", status: "접수" },
    { id: "RP-770", target: "댓글", ref: "“너 진짜 한심하다” 외 1건", by: "퇴근후헬스장", reason: "욕설·비방", date: "2026-06-26", status: "접수" },
    { id: "RP-769", target: "게시글", ref: "타 커뮤니티 비방 유도글", by: "익명2명", reason: "분란 유발", date: "2026-06-25", status: "처리완료" },
    { id: "RP-768", target: "댓글", ref: "외부 결제 유도 링크", by: "월급요정", reason: "사기 의심", date: "2026-06-25", status: "접수" }
  ];

  /* ---- 어드민 관리 게시글(콘텐츠) ---- */
  const adminPosts = [
    { id: 5102, cat: "공지", title: "커뮤니티 이용 수칙 및 신고 안내 (필독)", date: "2026-06-20", state: "게시", views: 12840 },
    { id: 5090, cat: "광고", title: "[제휴] 프레시밀 키트 첫 주문 40% 기획전", date: "2026-06-18", state: "게시", views: 9210 },
    { id: 5081, cat: "공지", title: "6월 점검 안내 (06-29 02:00~04:00)", date: "2026-06-15", state: "예약", views: 0 },
    { id: 5074, cat: "일반", title: "이주의 인기글 모음 (운영팀 큐레이션)", date: "2026-06-12", state: "임시저장", views: 0 }
  ];

  /* =====================================================
   *  광고주 대시보드 — 로그인 광고주 본인 데이터 (AD-01)
   * ===================================================*/
  const advertiserSelf = {
    id: "AD-01", name: "프레시밀 키트",
    kpi: { imp: 658000, clk: 9220, ctr: 1.40, spend: 3120000 },
    campaigns: [
      { id: "CMP-2041", name: "프레시밀 6월 런칭", type: "feed", status: "진행중", imp: 512400, clk: 9220, ctr: 1.80, spend: 2870000 },
      { id: "CMP-2030", name: "프레시밀 봄 프로모션", type: "feed", status: "예약", imp: 0, clk: 0, ctr: 0, spend: 0 },
      { id: "CMP-1990", name: "프레시밀 5월 리타겟", type: "slide", status: "종료", imp: 145600, clk: 2010, ctr: 1.38, spend: 250000 }
    ],
    daily: [
      { d: "06-20", imp: 64200, clk: 1080 },
      { d: "06-21", imp: 71800, clk: 1240 },
      { d: "06-22", imp: 68100, clk: 1190 },
      { d: "06-23", imp: 84200, clk: 1610 },
      { d: "06-24", imp: 92600, clk: 1840 },
      { d: "06-25", imp: 88900, clk: 1720 },
      { d: "06-26", imp: 98300, clk: 1960 }
    ],
    creatives: [
      { id: "CR-1007", type: "feed", name: "집밥 15분 카드", imp: 312400, clk: 6210, ctr: 1.99 },
      { id: "CR-1008", type: "feed", name: "첫주문 40% 카드", imp: 200000, clk: 3010, ctr: 1.51 },
      { id: "CR-1015", type: "slide", name: "신메뉴 4종 슬라이드", imp: 145600, clk: 2010, ctr: 1.38 }
    ]
  };

  return {
    brand, stats, surfaces, features, advertisers, adTypes, ads,
    posts, comments, campaigns, tracking, members, roleRequests,
    reports, adminPosts, advertiserSelf
  };
})();
