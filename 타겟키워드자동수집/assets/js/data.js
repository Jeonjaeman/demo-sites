/* ============================================================
   미식데스크 — 목(mock) 데이터 + 인메모리 스토어 (localStorage 영속)
   실제 구축 시 이 스키마가 RDBMS ERD / API 응답의 출발점.
   ============================================================ */
(function (global) {
  "use strict";

  const AVATAR_COLORS = ["#5046e5", "#0ea5a4", "#d8453b", "#c98a12", "#7c3aed", "#2475d6", "#1f9d57", "#db2777"];
  const avatarColor = (name) => {
    let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  };
  const initials = (name) => name ? name.trim().slice(-2) : "?";

  /* ---- 사용자 / 권한 ---- */
  const USERS = [
    { id: "u1", name: "김도윤", email: "doyun@misikdesk.io", role: "관리자", status: "활성", last: "2026-06-27 09:12", perms: ["조회","등록","수정","삭제","관리"] },
    { id: "u2", name: "이서연", email: "seoyeon@misikdesk.io", role: "매니저", status: "활성", last: "2026-06-27 08:40", perms: ["조회","등록","수정","삭제"] },
    { id: "u3", name: "박지호", email: "jiho@misikdesk.io", role: "일반", status: "활성", last: "2026-06-26 18:22", perms: ["조회","등록"] },
    { id: "u4", name: "최민아", email: "mina@misikdesk.io", role: "일반", status: "활성", last: "2026-06-25 14:05", perms: ["조회","등록","수정"] },
    { id: "u5", name: "정우진", email: "woojin@misikdesk.io", role: "매니저", status: "비활성", last: "2026-05-30 11:48", perms: ["조회","등록","수정","삭제"] },
  ];

  /* ---- 카테고리 / 상태 (관리자 편집 가능) ---- */
  const CATEGORIES = [
    { id: "c1", name: "신규 오픈", color: "#5046e5" },
    { id: "c2", name: "트렌드·이슈", color: "#0ea5a4" },
    { id: "c3", name: "인물·셰프", color: "#7c3aed" },
    { id: "c4", name: "프랜차이즈", color: "#2475d6" },
    { id: "c5", name: "미디어 노출", color: "#c98a12" },
    { id: "c6", name: "리스크·폐업", color: "#d8453b" },
    { id: "c7", name: "행사·팝업", color: "#db2777" },
  ];
  const SOURCES = ["공식자료", "언론보도", "커뮤니티", "블로그", "SNS"];
  const STATUSES = ["확인전", "확인중", "완료", "보류"];
  const IMPORTANCE = ["일반", "중요", "긴급"];
  const VERIFY = ["미확인", "확인필요", "검증완료"];
  const REGIONS = ["강남", "성수", "연남", "이태원", "홍대", "잠실", "판교", "광교", "부산 해운대", "제주"];

  const cmt = (author, text, type, at) => ({ author, text, type, at });
  const hist = (who, action, at) => ({ who, action, at });

  /* ---- 정보(레코드) ---- */
  const RECORDS = [
    {
      id: "r1", title: "성수동 오마카세 '하루' 7월 2호점 오픈 예정", category: "신규 오픈",
      summary: "성수 연무장길에 위치한 오마카세 '하루'가 7월 중 성수 2호점을 오픈한다. 좌석 12석 규모, 디너 단일 코스 운영 예정. 예약 플랫폼 캐치테이블 연동 확인.",
      source: "커뮤니티", sourceUrl: "https://community.example.com/post/48211",
      company: "오마카세 하루", person: "정한울", region: "성수", contact: "02-465-1102",
      keywords: ["성수 오마카세", "하루", "신규오픈", "캐치테이블"], importance: "중요", status: "확인중", verify: "확인필요",
      assignee: "이서연", createdBy: "박지호", createdAt: "2026-06-26 10:21", updatedBy: "이서연", updatedAt: "2026-06-27 08:42",
      favorite: true, archived: false,
      attachments: [{ name: "하루_2호점_조감도.pdf", size: "1.8MB", type: "pdf" }, { name: "연무장길_위치.png", size: "640KB", type: "img" }],
      comments: [ cmt("박지호", "캐치테이블에 7월 예약 오픈 페이지 생성됨. 좌석수 12석 확인.", "comment", "2026-06-26 10:25"),
                  cmt("이서연", "공식 채널 확인 필요 — 오픈일 확정되면 '검증완료'로 변경.", "memo", "2026-06-27 08:42") ],
      history: [ hist("박지호","정보 등록","2026-06-26 10:21"), hist("이서연","상태 변경: 확인전 → 확인중","2026-06-27 08:40"), hist("이서연","담당자 지정: 이서연","2026-06-27 08:42") ],
    },
    {
      id: "r2", title: "강남 '미슐랭 1스타' 레스토랑 위생 행정처분 보도", category: "리스크·폐업",
      summary: "강남구 소재 파인다이닝이 위생 점검에서 적발돼 영업정지 7일 행정처분을 받았다는 언론 보도. 후속 입장문 모니터링 필요.",
      source: "언론보도", sourceUrl: "https://news.example.com/2026/06/25/food-safety",
      company: "(비공개)", person: "", region: "강남", contact: "",
      keywords: ["위생 처분", "강남 파인다이닝", "영업정지", "리스크"], importance: "긴급", status: "확인중", verify: "확인필요",
      assignee: "김도윤", createdBy: "이서연", createdAt: "2026-06-25 16:03", updatedBy: "김도윤", updatedAt: "2026-06-26 09:10",
      favorite: true, archived: false,
      attachments: [{ name: "보도원문_캡처.png", size: "910KB", type: "img" }],
      comments: [ cmt("김도윤", "긴급 — 업체명 비공개 보도라 추가 출처 교차확인 필요. 텔레그램 알림 발송함.", "memo", "2026-06-26 09:10") ],
      history: [ hist("이서연","정보 등록","2026-06-25 16:03"), hist("김도윤","중요도 변경: 중요 → 긴급","2026-06-26 09:05") ],
    },
    {
      id: "r3", title: "셰프 강민재, 연남동 비스트로 '노트르' 단독 오픈", category: "인물·셰프",
      summary: "전 호텔 수셰프 강민재가 연남동에 캐주얼 비스트로 '노트르'를 오픈. 시즈널 메뉴 중심, 와인페어링 운영. 인스타그램 팔로워 급증.",
      source: "SNS", sourceUrl: "https://instagram.com/p/notre_seoul",
      company: "노트르", person: "강민재", region: "연남", contact: "0507-1234-9981",
      keywords: ["강민재 셰프", "연남 비스트로", "노트르", "와인페어링"], importance: "중요", status: "완료", verify: "검증완료",
      assignee: "최민아", createdBy: "최민아", createdAt: "2026-06-24 13:30", updatedBy: "최민아", updatedAt: "2026-06-24 17:55",
      favorite: false, archived: false,
      attachments: [],
      comments: [ cmt("최민아", "공식 인스타 + 네이버 플레이스 등록 확인. 검증완료 처리.", "comment", "2026-06-24 17:55") ],
      history: [ hist("최민아","정보 등록","2026-06-24 13:30"), hist("최민아","검증 상태: 미확인 → 검증완료","2026-06-24 17:55"), hist("최민아","상태 변경: 확인중 → 완료","2026-06-24 17:56") ],
    },
    {
      id: "r4", title: "제주 흑돼지 프랜차이즈 '돈블랙' 수도권 5개점 동시 가맹", category: "프랜차이즈",
      summary: "제주 기반 흑돼지 브랜드 '돈블랙'이 수도권 5개 가맹점 계약을 체결. 7~8월 순차 오픈 예정. 가맹 조건/평수 정보 수집 중.",
      source: "공식자료", sourceUrl: "https://donblack.co.kr/news/franchise",
      company: "돈블랙", person: "", region: "제주", contact: "064-700-2200",
      keywords: ["돈블랙", "흑돼지 프랜차이즈", "가맹", "수도권 출점"], importance: "일반", status: "확인전", verify: "미확인",
      assignee: "", createdBy: "박지호", createdAt: "2026-06-27 09:02", updatedBy: "박지호", updatedAt: "2026-06-27 09:02",
      favorite: false, archived: false,
      attachments: [{ name: "가맹안내서_2026.pdf", size: "2.4MB", type: "pdf" }],
      comments: [],
      history: [ hist("박지호","정보 등록","2026-06-27 09:02") ],
    },
    {
      id: "r5", title: "백종원 유튜브 '성수 솔티드카라멜 베이커리' 소개 — 방문객 폭증", category: "미디어 노출",
      summary: "유명 유튜브 채널에서 성수 베이커리를 소개한 뒤 주말 웨이팅 2시간 이상. 매장 측 한정 수량 운영 공지. 트래픽 키워드 급상승.",
      source: "블로그", sourceUrl: "https://blog.example.com/review/saltedcaramel",
      company: "솔티드 성수", person: "", region: "성수", contact: "",
      keywords: ["성수 베이커리", "솔티드카라멜", "유튜브 맛집", "웨이팅"], importance: "중요", status: "확인중", verify: "확인필요",
      assignee: "이서연", createdBy: "최민아", createdAt: "2026-06-26 19:40", updatedBy: "이서연", updatedAt: "2026-06-27 07:30",
      favorite: false, archived: false,
      attachments: [],
      comments: [ cmt("이서연", "방문객 수치는 블로그 추정치. 매장 공식 공지로 교차확인 필요.", "memo", "2026-06-27 07:30") ],
      history: [ hist("최민아","정보 등록","2026-06-26 19:40"), hist("이서연","담당자 지정: 이서연","2026-06-27 07:30") ],
    },
    {
      id: "r6", title: "이태원 루프탑 바 '스카이라인' 여름 시즌 팝업 운영", category: "행사·팝업",
      summary: "이태원 루프탑 바가 7~8월 한정 칵테일 팝업을 운영. 예약제 전환. 인플루언서 협업 예정.",
      source: "SNS", sourceUrl: "https://instagram.com/p/skyline_pop",
      company: "스카이라인", person: "", region: "이태원", contact: "0507-9090-1234",
      keywords: ["이태원 루프탑", "여름 팝업", "칵테일", "예약제"], importance: "일반", status: "보류", verify: "미확인",
      assignee: "박지호", createdBy: "박지호", createdAt: "2026-06-23 11:15", updatedBy: "박지호", updatedAt: "2026-06-23 11:15",
      favorite: false, archived: false,
      attachments: [],
      comments: [ cmt("박지호", "팝업 일정 미확정 — 확정 시 재오픈.", "memo", "2026-06-23 11:15") ],
      history: [ hist("박지호","정보 등록","2026-06-23 11:15"), hist("박지호","상태 변경: 확인전 → 보류","2026-06-23 11:16") ],
    },
    {
      id: "r7", title: "판교 직장인 점심 '한상차림' 가성비 식당 커뮤니티 화제", category: "트렌드·이슈",
      summary: "판교 테크노밸리 직장인 커뮤니티에서 1만원 한상차림 식당이 화제. 점심 회전율/대기 정보 수집.",
      source: "커뮤니티", sourceUrl: "https://community.example.com/pangyo/lunch",
      company: "정담 한상", person: "", region: "판교", contact: "031-600-7788",
      keywords: ["판교 점심", "가성비 맛집", "한상차림", "직장인"], importance: "일반", status: "완료", verify: "검증완료",
      assignee: "최민아", createdBy: "최민아", createdAt: "2026-06-22 12:48", updatedBy: "최민아", updatedAt: "2026-06-22 15:10",
      favorite: false, archived: true,
      attachments: [],
      comments: [],
      history: [ hist("최민아","정보 등록","2026-06-22 12:48"), hist("최민아","아카이브 처리","2026-06-22 15:11") ],
    },
    {
      id: "r8", title: "부산 해운대 신상 해산물 다이닝 '블루웨이브' 예약 오픈", category: "신규 오픈",
      summary: "해운대 마린시티 인근 해산물 파인다이닝이 7월 예약 오픈. 오션뷰 다이닝, 코스 단일 운영.",
      source: "블로그", sourceUrl: "https://blog.example.com/busan/bluewave",
      company: "블루웨이브", person: "", region: "부산 해운대", contact: "051-700-3300",
      keywords: ["해운대 다이닝", "블루웨이브", "해산물", "오션뷰"], importance: "일반", status: "확인전", verify: "미확인",
      assignee: "", createdBy: "박지호", createdAt: "2026-06-27 08:05", updatedBy: "박지호", updatedAt: "2026-06-27 08:05",
      favorite: false, archived: false, attachments: [], comments: [],
      history: [ hist("박지호","정보 등록","2026-06-27 08:05") ],
    },
    {
      id: "r9", title: "잠실 디저트 카페 프랜차이즈 본사 — 가맹점 분쟁 제보", category: "리스크·폐업",
      summary: "잠실 소재 디저트 프랜차이즈 본사와 가맹점 간 물류 단가 분쟁 제보 접수. 사실관계 확인 필요.",
      source: "커뮤니티", sourceUrl: "https://community.example.com/report/9912",
      company: "(확인 중)", person: "", region: "잠실", contact: "",
      keywords: ["프랜차이즈 분쟁", "잠실 디저트", "가맹 본사", "제보"], importance: "중요", status: "확인중", verify: "확인필요",
      assignee: "김도윤", createdBy: "이서연", createdAt: "2026-06-26 14:22", updatedBy: "김도윤", updatedAt: "2026-06-26 16:00",
      favorite: false, archived: false, attachments: [],
      comments: [ cmt("김도윤", "제보 단계 — 출처 신뢰도 낮음. 추가 제보/언론 보도 대기.", "memo", "2026-06-26 16:00") ],
      history: [ hist("이서연","정보 등록","2026-06-26 14:22"), hist("김도윤","담당자 지정: 김도윤","2026-06-26 16:00") ],
    },
    {
      id: "r10", title: "광교 호수공원 인근 브런치 카페 3곳 동시 오픈 트렌드", category: "트렌드·이슈",
      summary: "광교 호수공원 상권에 브런치 카페가 잇따라 오픈하며 상권 트렌드 형성. 키워드 검색량 상승.",
      source: "블로그", sourceUrl: "https://blog.example.com/gwanggyo/brunch",
      company: "복수", person: "", region: "광교", contact: "",
      keywords: ["광교 브런치", "호수공원 카페", "상권 트렌드"], importance: "일반", status: "확인전", verify: "미확인",
      assignee: "", createdBy: "최민아", createdAt: "2026-06-25 10:10", updatedBy: "최민아", updatedAt: "2026-06-25 10:10",
      favorite: false, archived: false, attachments: [], comments: [],
      history: [ hist("최민아","정보 등록","2026-06-25 10:10") ],
    },
    {
      id: "r11", title: "홍대 '대왕 떡볶이' 본점 임대료 인상으로 이전 검토", category: "리스크·폐업",
      summary: "홍대 유명 분식 본점이 임대료 인상으로 이전을 검토한다는 SNS 게시글. 이전 시 상권 영향 모니터링.",
      source: "SNS", sourceUrl: "https://x.com/post/hongdae_tteok",
      company: "대왕 떡볶이", person: "", region: "홍대", contact: "",
      keywords: ["홍대 분식", "임대료 인상", "이전", "상권"], importance: "일반", status: "보류", verify: "미확인",
      assignee: "박지호", createdBy: "박지호", createdAt: "2026-06-21 17:32", updatedBy: "박지호", updatedAt: "2026-06-21 17:32",
      favorite: false, archived: false, attachments: [], comments: [],
      history: [ hist("박지호","정보 등록","2026-06-21 17:32") ],
    },
    {
      id: "r12", title: "강남 '소바 전문점' 미디어 협찬 후기 다수 — 신뢰도 점검 필요", category: "미디어 노출",
      summary: "강남 소바 전문점 관련 협찬성 블로그 후기가 다수 확인됨. 실제 평판과의 괴리 점검 필요.",
      source: "블로그", sourceUrl: "https://blog.example.com/gangnam/soba",
      company: "소바하우스", person: "", region: "강남", contact: "02-540-2211",
      keywords: ["강남 소바", "협찬 후기", "평판 점검"], importance: "일반", status: "확인중", verify: "확인필요",
      assignee: "이서연", createdBy: "이서연", createdAt: "2026-06-24 09:18", updatedBy: "이서연", updatedAt: "2026-06-24 09:18",
      favorite: false, archived: false, attachments: [], comments: [],
      history: [ hist("이서연","정보 등록","2026-06-24 09:18") ],
    },
  ];

  /* ---- 대시보드용 추이 데이터 ---- */
  const TREND_DAYS = ["6/21", "6/22", "6/23", "6/24", "6/25", "6/26", "6/27"];
  const TREND_TOTAL = [4, 6, 5, 9, 7, 11, 8];
  const TREND_URGENT = [0, 1, 0, 1, 1, 2, 1];
  const RISING = [
    { kw: "성수 오마카세", delta: 182, vol: "12,400" },
    { kw: "위생 행정처분", delta: 96, vol: "5,900" },
    { kw: "해운대 다이닝", delta: 71, vol: "8,100" },
    { kw: "광교 브런치", delta: 54, vol: "6,300" },
    { kw: "흑돼지 가맹", delta: 38, vol: "3,200" },
  ];

  /* ---- 자동수집(2차) 데모용 수집 후보 ---- */
  const COLLECT_TARGETS = ["성수 오마카세", "해운대 다이닝", "흑돼지 프랜차이즈", "위생 행정처분"];

  /* ---- 활동 로그 ---- */
  const LOGS = [
    { who: "이서연", action: "상태 변경", target: "성수동 오마카세 '하루' …", at: "2026-06-27 08:42", ip: "211.49.x.x" },
    { who: "박지호", action: "정보 등록", target: "돈블랙 수도권 5개점 가맹", at: "2026-06-27 09:02", ip: "121.130.x.x" },
    { who: "김도윤", action: "로그인", target: "-", at: "2026-06-27 09:12", ip: "211.49.x.x" },
    { who: "최민아", action: "검증 상태 변경", target: "노트르 단독 오픈", at: "2026-06-24 17:55", ip: "175.223.x.x" },
    { who: "김도윤", action: "알림 발송(텔레그램)", target: "강남 위생 행정처분", at: "2026-06-26 09:10", ip: "211.49.x.x" },
    { who: "박지호", action: "정보 등록", target: "블루웨이브 예약 오픈", at: "2026-06-27 08:05", ip: "121.130.x.x" },
  ];

  /* ============================================================
     Store — 인메모리 + localStorage 영속
     ============================================================ */
  const LS_KEY = "misikdesk.records.v1";
  const clone = (o) => JSON.parse(JSON.stringify(o));

  const Store = {
    users: USERS, categories: CATEGORIES, sources: SOURCES, statuses: STATUSES,
    importance: IMPORTANCE, verify: VERIFY, regions: REGIONS,
    trend: { days: TREND_DAYS, total: TREND_TOTAL, urgent: TREND_URGENT },
    rising: RISING, collectTargets: COLLECT_TARGETS.slice(), logs: LOGS,
    records: clone(RECORDS),

    load() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) this.records = JSON.parse(raw);
      } catch (e) { /* ignore */ }
      return this;
    },
    save() {
      try { localStorage.setItem(LS_KEY, JSON.stringify(this.records)); } catch (e) {}
    },
    reset() { this.records = clone(RECORDS); this.save(); },

    get(id) { return this.records.find((r) => r.id === id); },
    active() { return this.records.filter((r) => !r.archived); },
    archived() { return this.records.filter((r) => r.archived); },
    favorites() { return this.records.filter((r) => r.favorite && !r.archived); },

    update(id, patch, who) {
      const i = this.records.findIndex((r) => r.id === id);
      if (i < 0) return null;
      const prev = this.records[i];
      const next = Object.assign({}, prev, patch, { updatedBy: who || prev.updatedBy, updatedAt: nowStr() });
      this.records = this.records.slice(0, i).concat([next], this.records.slice(i + 1));
      this.save();
      return next;
    },
    addComment(id, comment) {
      const r = this.get(id); if (!r) return;
      r.comments = (r.comments || []).concat([comment]);
      r.history = (r.history || []).concat([hist(comment.author, comment.type === "memo" ? "내부 메모 작성" : "댓글 작성", comment.at)]);
      this.save();
    },
    addHistory(id, who, action) {
      const r = this.get(id); if (!r) return;
      r.history = (r.history || []).concat([hist(who, action, nowStr())]);
      this.save();
    },
    addRecord(rec) { this.records = [rec].concat(this.records); this.save(); },

    // counts
    counts() {
      const a = this.active();
      return {
        total: a.length,
        unconfirmed: a.filter((r) => r.status === "확인전").length,
        important: a.filter((r) => r.importance === "중요" || r.importance === "긴급").length,
        urgent: a.filter((r) => r.importance === "긴급").length,
        today: a.filter((r) => (r.createdAt || "").slice(0, 10) === "2026-06-27").length,
        needVerify: a.filter((r) => r.verify === "확인필요" || r.verify === "미확인").length,
        favorites: this.favorites().length,
        archived: this.archived().length,
      };
    },
    byCategory() {
      const map = {};
      this.categories.forEach((c) => (map[c.name] = 0));
      this.active().forEach((r) => { if (map[r.category] != null) map[r.category]++; });
      return this.categories.map((c) => ({ name: c.name, color: c.color, n: map[c.name] }))
        .sort((a, b) => b.n - a.n);
    },
  };

  function nowStr() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  // helpers exposed
  Store.helpers = { avatarColor, initials, nowStr, cmt, hist };

  global.MISIK = Store.load();
})(window);
