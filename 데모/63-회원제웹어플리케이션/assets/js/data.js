/* INCIRCLE 샘플 데이터 — 전부 가상. const IC 선언은 이 파일 한 번만. */
const IC = window.IC || (window.IC = {});

/* 시야(뷰어) 6종 — 발견 A3 */
IC.VIEWS = [
  { id:"anon",    label:"비로그인",   grade:0, authed:false },
  { id:"pending", label:"승인 대기",  grade:0, authed:true  },
  { id:"g1",      label:"1등급 회원", grade:1, authed:true  },
  { id:"g2",      label:"2등급 정회원", grade:2, authed:true },
  { id:"g3",      label:"3등급 핵심회원", grade:3, authed:true },
  { id:"admin",   label:"관리자",     grade:9, authed:true  }
];

/* 게시판 6종 — 카테고리 컬러(Discourse 문법) · 밀도 3종 · 최소 등급 */
IC.BOARDS = [
  { id:"lounge",  name:"라운지",       color:"var(--cat-lounge)",  density:"row",  minRead:0, minWrite:1, minComment:1, minDown:1,
    desc:"승인 전에도 열려 있는 공개 게시판 — 대기 중 이탈을 막는 표면입니다." },
  { id:"free",    name:"자유게시판",   color:"var(--cat-free)",    density:"card", minRead:1, minWrite:1, minComment:1, minDown:1,
    desc:"회원 간 자유 주제. 카드형(인프런 문법)으로 발췌·태그가 함께 보입니다." },
  { id:"info",    name:"정보공유",     color:"var(--cat-info)",    density:"row",  minRead:1, minWrite:2, minComment:1, minDown:2,
    desc:"검증된 정보 아카이브. 일반형 5열(국내 게시판 문법)." },
  { id:"lecture", name:"강의영상",     color:"var(--cat-lecture)", density:"lec",  minRead:2, minWrite:9, minComment:2, minDown:9,
    desc:"운영진이 등록하는 강의. 영상 보호 방식에 따라 실제 보안 수준이 달라집니다." },
  { id:"archive", name:"자료실·갤러리", color:"var(--cat-archive)", density:"gal",  minRead:2, minWrite:3, minComment:2, minDown:3,
    desc:"열람은 2등급, 다운로드는 3등급. 다운로드 파일에는 열람자 워터마크가 각인됩니다." },
  { id:"staff",   name:"멤버 전용",    color:"var(--cat-staff)",   density:"row",  minRead:3, minWrite:3, minComment:3, minDown:3,
    desc:"3등급 핵심회원 전용. 발제·운영 논의." }
];

/* 게시물 — 라운지/정보공유/멤버전용(row) · 자유(card) */
IC.POSTS = {
  lounge: [
    { no:"공지", notice:true, title:"인서클 커뮤니티 이용 안내 — 등급과 게시판", who:"운영진", view:412, time:"08.01", cmt:6,
      body:["인서클은 승인제로 운영되는 회원제 커뮤니티입니다. 등급은 1~3단계로 나뉘며, 게시판마다 열람·쓰기·댓글·다운로드 권한이 다르게 설정되어 있습니다.","우측 상단의 계정 상태를 바꿔 보시면 등급별로 보이는 게시판이 실제로 달라지는 것을 확인하실 수 있습니다."] },
    { no:24, title:"가입 인사드립니다 — 승인 기다리는 중이에요", who:"새싹**", view:86, time:"13:40", cmt:4,
      body:["안녕하세요, 어제 가입 신청하고 승인 기다리고 있습니다. 라운지는 열려 있어서 먼저 인사드려요.","승인되면 자유게시판에서 자주 뵙겠습니다."] },
    { no:23, title:"이번 달 오프라인 모임 후기 (라운지 공개분)", who:"모임지기", view:203, time:"08.11", cmt:9,
      body:["이번 모임에는 열두 분이 참석해 주셨습니다. 상세 후기와 자료는 정보공유 게시판에 올렸으니 회원 등급이 되시면 확인해 주세요."] },
    { no:22, title:"커뮤니티가 처음이신 분들께 — 자주 묻는 질문", who:"운영진", view:317, time:"08.09", cmt:3,
      body:["승인은 보통 하루 안에 처리됩니다. 거절되는 경우에도 사유를 함께 안내드립니다."] }
  ],
  free: [
    { title:"요즘 다들 어떤 도구로 자료 정리하시나요?", excerpt:"노션에서 옵시디언으로 옮겼다가 다시 돌아왔습니다. 팀과 공유할 때는 결국 문서 링크가 제일 편하더라고요. 다들 어떻게 하시는지 궁금합니다.",
      tags:["생산성","도구"], who:"기록러", time:"21분 전", like:14, view:112, cmt:8,
      body:["노션에서 옵시디언으로 옮겼다가 다시 돌아왔습니다. 로컬 보관은 마음이 편한데, 팀과 공유할 때는 결국 문서 링크가 제일 편하더라고요.","다들 자료 정리 어떻게 하시는지 궁금합니다. 댓글로 각자 조합을 공유해 주세요."] },
    { title:"스터디 발표 자료를 만들 때 시간을 줄이는 법", excerpt:"발표 구조를 먼저 세 줄로 요약하고 시작하면 슬라이드 수가 절반으로 줄었습니다. 이번 주 발표 준비하면서 정리한 내용을 공유합니다.",
      tags:["스터디","발표"], who:"세줄요약", time:"1시간 전", like:22, view:186, cmt:11,
      body:["발표 구조를 먼저 세 줄로 요약하고 시작하면 슬라이드 수가 절반으로 줄었습니다.","이번 주 발표 준비하면서 정리한 내용을 공유합니다. 첨부는 자료실에 올렸습니다."] },
    { title:"블라인드 처리된 게시물입니다", blinded:true, who:"-", time:"2시간 전", like:0, view:0, cmt:0,
      body:["임시조치된 게시물입니다."] },
    { title:"신입 회원 환영합니다 — 8월 둘째 주", excerpt:"이번 주 새로 합류하신 세 분을 환영합니다. 자기소개는 부담 없이, 관심 분야만 남겨 주셔도 좋아요.",
      tags:["환영"], who:"모임지기", time:"08.11", like:31, view:240, cmt:15,
      body:["이번 주 새로 합류하신 세 분을 환영합니다. 자기소개는 부담 없이, 관심 분야만 남겨 주셔도 좋아요."] }
  ],
  info: [
    { no:57, title:"2026 하반기 지원사업 정리 (마감일 순)", who:"정리왕", view:198, time:"11:20", cmt:7,
      body:["하반기 지원사업을 마감일 순으로 정리했습니다. 상세 표는 첨부를 확인해 주세요.","다음 갱신은 9월 첫 주 예정입니다."] },
    { no:56, title:"세미나실 대관 비교 — 강남권 6곳 실사용 후기", who:"발품러", view:164, time:"08.12", cmt:12,
      body:["여섯 곳을 직접 써 보고 비교했습니다. 결론은 인원 규모에 따라 갈립니다."] },
    { no:55, title:"회계 처리 자주 틀리는 항목 모음", who:"숫자지기", view:221, time:"08.10", cmt:5,
      body:["모임 회계에서 자주 틀리는 항목을 모았습니다."] },
    { no:54, title:"임시조치된 게시물입니다", blinded:true, who:"-", view:0, time:"08.09", cmt:0,
      body:["임시조치된 게시물입니다."] }
  ],
  staff: [
    { no:12, title:"9월 발제 순서와 주제 확정", who:"운영진", view:34, time:"08.12", cmt:6,
      body:["9월 발제 순서를 확정합니다. 변경이 필요하면 이 글에 댓글로 남겨 주세요."] },
    { no:11, title:"자료실 다운로드 정책 재논의 — 워터마크 표기 범위", who:"운영진", view:41, time:"08.08", cmt:9,
      body:["다운로드 파일의 워터마크 표기 범위를 재논의합니다. 현재는 닉네임·시각·토큰이 각인됩니다."] }
  ]
};

/* 강의영상 — videoId는 가상. 보호 방식은 전역 상태로 전환 */
IC.LECTURES = [
  { title:"1강 — 커뮤니티 운영의 첫 90일", dur:"42:18", vid:"dQw4-DEMO01", img:"assets/img/l1.webp", date:"08.05", views:58 },
  { title:"2강 — 갈등이 생겼을 때 운영자가 하는 일", dur:"37:05", vid:"xK9p-DEMO02", img:"assets/img/l2.webp", date:"08.12", views:31 }
];

/* 영상 보호 3안 — 발견 A1. 비용·공수는 계산식에서 사용 */
IC.PROTECT = [
  { id:"yt", name:"유튜브 미등록 임베드", protect:"없음", protectCls:"bad",
    cost0: 0, costPerGB: 0, days:1,
    note:"공고 원안. <b>URL을 아는 누구나(비회원 포함) 시청할 수 있고</b>, 페이지 소스에서 videoId가 그대로 추출됩니다. 워터마크·열람 이력·등급 제한이 영상에는 적용되지 않습니다. 비공개(Private) 영상은 임베드 자체가 불가능합니다." },
  { id:"vimeo", name:"Vimeo 도메인 제한", protect:"중간", protectCls:"mid",
    cost0: 27000, costPerGB: 0, days:3,
    note:"허용한 도메인에서만 임베드 재생됩니다(전 플랜 제공·최대 50개 도메인). 직링크 접근은 막히지만 <b>화면 녹화·회원 간 계정 공유는 막지 못하고</b>, 사용자별 워터마크는 불가합니다. 월 구독료가 발생합니다." },
  { id:"self", name:"자체 스토리지 + 서명 URL", protect:"높음", protectCls:"good",
    cost0: 33000, costPerGB: 120, days:8,
    note:"Supabase Storage에 원본을 두고 <b>등급 검증 후 만료형 서명 URL</b>로만 재생합니다. 열람 이력이 URL 발급 단위로 남고, 사용자 식별 워터마크를 플레이어에 합성할 수 있습니다. 스토리지·전송량 비용이 회원 수에 비례합니다." }
];

/* 갤러리 (자료실) — img는 생성 이미지 */
IC.GALLERY = [
  { title:"7월 세미나 발표자료 표지", who:"세줄요약", img:"assets/img/g1.webp", size:"2.4MB" },
  { title:"모임 공간 답사 기록", who:"발품러", img:"assets/img/g2.webp", size:"1.8MB" },
  { title:"하반기 계획 워크시트", who:"운영진", img:"assets/img/g3.webp", size:"3.1MB" },
  { title:"추천 도서 서가 정리", who:"기록러", img:"assets/img/g4.webp", size:"2.2MB" }
];

/* 회원 — 관리자 화면용. phone/email 원문은 서버 마스킹 시연 대조용 */
IC.MEMBERS = [
  { id:"M-0071", nick:"새싹**",  name:"김서연", grade:0, status:"pending", joined:"2026-08-12 14:22", via:"카카오", ref:"기록러 초대", waitH:27,
    phone:"010-4821-7733", email:"seoyeon.k@example.com", posts:0, cmts:0, visits:2 },
  { id:"M-0072", nick:"준비된",  name:"박도현", grade:0, status:"pending", joined:"2026-08-13 09:10", via:"네이버", ref:"-", waitH:8,
    phone:"010-2214-9051", email:"dohyun.p@example.com", posts:0, cmts:0, visits:1 },
  { id:"M-0073", nick:"관망중",  name:"이하늘", grade:0, status:"pending", joined:"2026-08-13 15:45", via:"카카오", ref:"-", waitH:2,
    phone:"010-7702-3318", email:"haneul.l@example.com", posts:0, cmts:0, visits:1 },
  { id:"M-0034", nick:"기록러",  name:"정민재", grade:2, status:"active", joined:"2026-05-02", via:"카카오", ref:"-", waitH:0,
    phone:"010-9182-4467", email:"minjae.j@example.com", posts:18, cmts:64, visits:88 },
  { id:"M-0021", nick:"세줄요약", name:"최유진", grade:3, status:"active", joined:"2026-03-14", via:"네이버", ref:"-", waitH:0,
    phone:"010-5530-2296", email:"yujin.c@example.com", posts:41, cmts:120, visits:150 },
  { id:"M-0058", nick:"발품러",  name:"한지우", grade:1, status:"active", joined:"2026-07-01", via:"카카오", ref:"세줄요약 초대", waitH:0,
    phone:"010-3348-8810", email:"jiwoo.h@example.com", posts:6, cmts:21, visits:30 }
];

/* 신고 큐 — 정보통신망법 44조의2 상태머신 (발견 B3) */
IC.REPORTS = [
  { id:"R-31", target:"자유게시판 · 특정 회원 비방 게시물", reporter:"발품러", reason:"명예훼손", filed:"2026-08-12 10:05",
    stage:2, dday:28, notified:{ reporter:true, author:true }, posted:true },
  { id:"R-30", target:"정보공유 · 무단 전재 의심 자료", reporter:"세줄요약", reason:"저작권(제3자)", filed:"2026-08-09 16:31",
    stage:3, dday:25, notified:{ reporter:true, author:true }, posted:true },
  { id:"R-29", target:"자유게시판 · 광고성 게시물", reporter:"기록러", reason:"스팸·광고", filed:"2026-08-13 08:12",
    stage:0, dday:30, notified:{ reporter:false, author:false }, posted:false }
];
IC.REPORT_STAGES = ["접수","조치(블라인드)","양측 통지","게시판 공시","기간 만료 분기"];

/* 활동 로그 — 접속기록(발견 B1). keepUntil = 기록일 + 1년 */
IC.LOGS = [
  { t:"2026-08-13 16:02", who:"admin", act:"회원정보 열람", target:"M-0071 김**", ip:"211.36.xx.xx", kind:"privacy" },
  { t:"2026-08-13 15:47", who:"세줄요약", act:"자료 다운로드(서명 URL 발급)", target:"자료실 · 하반기 계획 워크시트", ip:"118.235.xx.xx", kind:"download" },
  { t:"2026-08-13 14:20", who:"admin", act:"가입 승인", target:"M-0069 서**", ip:"211.36.xx.xx", kind:"approve" },
  { t:"2026-08-13 11:08", who:"기록러", act:"강의영상 재생", target:"강의영상 · 2강", ip:"223.62.xx.xx", kind:"view" },
  { t:"2026-08-12 19:44", who:"admin", act:"신고 처리(임시조치)", target:"R-31", ip:"211.36.xx.xx", kind:"report" },
  { t:"2026-08-12 10:31", who:"admin", act:"회원정보 마스킹 해제", target:"M-0034 정** (사유: 환불 문의 본인 확인)", ip:"211.36.xx.xx", kind:"privacy" }
];

/* 권한 매트릭스 기본값 — 게시판 6종 × 액션 4종의 최소 등급 (발견 D1) */
IC.MATRIX = {};
IC.BOARDS.forEach(b => { IC.MATRIX[b.id] = { read:b.minRead, write:b.minWrite, comment:b.minComment, down:b.minDown }; });

/* 보안 자가진단 8항목 (발견 C2) — 기존 바이브 코딩 데모 인수 점검표 */
IC.AUDIT = [
  { name:"프론트 번들 내 키 종류", bad:"service_role 키 발견", good:"anon 키만 존재", risk:35, state:false,
    fix:"① 대시보드에서 service_role 키 즉시 회전 ② 서버 전용 코드(Edge Function)로 이동 ③ 번들 재배포" },
  { name:"RLS 미적용 테이블", bad:"3개 테이블 미적용(= anon 키로 전체 공개)", good:"전 테이블 RLS 활성", risk:25, state:false,
    fix:"ALTER TABLE … ENABLE ROW LEVEL SECURITY 후 정책 작성 — 정책 없는 활성화는 전면 차단이므로 순서 주의" },
  { name:"정책 TO 절 명시", bad:"TO 절 없는 정책 4건(anon에도 평가)", good:"전 정책 TO authenticated", risk:8, state:false,
    fix:"TO authenticated 명시 — 공식 실측 170ms → 0.1ms" },
  { name:"공개(public) 버킷", bad:"자료실 버킷이 public", good:"전 버킷 private + 서명 URL", risk:15, state:false,
    fix:"버킷 private 전환 + storage.objects 정책 작성" },
  { name:"서명 URL 만료시간", bad:"7일(유출 창 과다)", good:"5분 이하", risk:6, state:false,
    fix:"다운로드 60초~5분 / 스트리밍 세그먼트 단위" },
  { name:"storage.objects 정책", bad:"버킷 정책 없음", good:"등급 검증 정책 존재", risk:5, state:false,
    fix:"테이블 RLS와 별개로 storage.objects에 등급 정책 작성" },
  { name:"관리자 판정 방식", bad:"테이블 서브쿼리(재귀 위험)", good:"JWT 클레임", risk:4, state:false,
    fix:"Custom Access Token Hook으로 grade 클레임 주입" },
  { name:"자동 백업", bad:"무료 플랜(백업 없음)", good:"Pro 일일 백업 + 필요 시 PITR", risk:2, state:false,
    fix:"Pro 플랜 전환(월 $25) — 공고 비기능 요구 충족의 전제" }
];

/* RLS 성능 계수 (발견 C1 — Supabase 공식 실측 배율 기반 근사)
   naive: auth.uid() 행마다 재평가 → 시간 ∝ 행수. 공식 실측 11,000ms@100k행 기준 계수 0.11ms/행
   wrap: (select auth.uid()) initplan → 상수항 + 미미한 행 비례
   idx: + RLS 컬럼 인덱스 → 스캔 자체가 로그 스케일 */
IC.RLS_PERF = {
  rowsPerMember: 42,                 /* 회원당 평균 행 수(게시물+댓글+로그) */
  naive: rows => Math.round(rows * 0.11),
  wrap:  rows => Math.max(8, Math.round(rows * 0.0012)),
  idx:   rows => Math.max(2, Math.round(Math.log2(Math.max(rows,2)) * 0.9)),
  full:  rows => Math.max(1, Math.round(Math.log2(Math.max(rows,2)) * 0.45))
};

/* 프로바이더 검수 상태 (발견 A2·C7) */
IC.PROVIDERS = [
  { id:"kakao", name:"카카오", type:"Supabase 네이티브", stage:1,
    stages:["미신청","비즈앱 전환(사업자번호)","동의항목 심사(1~3일)","승인"],
    checklist:[
      { t:"사업자등록번호 등록", owner:"의뢰자", done:false },
      { t:"동의항목별 수집 사유 기재(이메일 등)", owner:"지원사", done:true },
      { t:"비즈앱 전환 심사 제출", owner:"지원사", done:false }
    ] },
  { id:"naver", name:"네이버", type:"Custom OIDC (기본 미지원)", stage:0,
    stages:["미신청","검수 요청","검수(3~4영업일)","승인"],
    checklist:[
      { t:"서비스 URL·Callback URL 일치 확인", owner:"지원사", done:true },
      { t:"가입 화면 스크린샷 준비(필수 제출)", owner:"지원사", done:false },
      { t:"추가 수집 항목(소속·직함) 기재", owner:"의뢰자", done:false }
    ] }
];

/* 인프라 비용 계수 (발견 C4 — Supabase 가격 기준 근사, 환율 1,400원) */
IC.INFRA = {
  planFree:{ name:"Free", monthly:0, backup:false, note:"자동 백업 없음 · 7일 미사용 시 일시정지" },
  planPro:{ name:"Pro", monthly:35000, backup:true, note:"일일 백업 7일 보관 · MAU 10만 포함" },
  pitr: 140000,
  storagePerGB: 30,     /* $0.021/GB ≈ 30원 */
  egressPerGB: 126      /* $0.09/GB ≈ 126원 */
};

/* 탈퇴 처리 3안 대상 회원 영향(가상 집계) — 발견 D2 */
IC.WITHDRAW = { posts:12, comments:47, threads:5 };
