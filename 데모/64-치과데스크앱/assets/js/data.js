/* DENTDESK 데이터. const DD 선언은 이 파일 한 번만. */
const DD = window.DD || (window.DD = {});

/* 리소스 — 체어는 진료실에 종속(R⑤), 위생사도 리소스 */
DD.ROOMS = [
  { id:"r1", name:"진료실 1", chairs:["c1","c2"] },
  { id:"r2", name:"진료실 2", chairs:["c3","c4"] },
  { id:"r3", name:"예방·스케일링실", chairs:["c5"] }
];
DD.CHAIRS = [
  { id:"c1", name:"체어 1", room:"r1", color:"#357cd2" },
  { id:"c2", name:"체어 2", room:"r1", color:"#1aaa55" },
  { id:"c3", name:"체어 3", room:"r2", color:"#7fa900" },
  { id:"c4", name:"체어 4", room:"r2", color:"#df5286" },
  { id:"c5", name:"체어 5", room:"r3", color:"#915CE0" }
];
DD.DOCTORS = [
  { id:"d1", name:"김이현 원장", color:"#357cd2" },
  { id:"d2", name:"박서준 원장", color:"#df5286" }
];
DD.HYGIENISTS = [
  { id:"h1", name:"최수민 위생사", color:"#0FB3A3" },
  { id:"h2", name:"정다은 위생사", color:"#A0A540" }
];

/* 예약 — 오늘(2026-08-14 가정) 09:00~18:00. t=30분 슬롯 인덱스(09:00=0) */
DD.STATUS = { wait:"예약대기", conf:"확정", done:"내원완료", noshow:"노쇼", cancel:"취소" };
DD.APPTS = [
  { id:"a1", t:0,  len:2, chair:"c1", doc:"d1", hyg:null, st:"done",  p:"김민지", proc:"보철 본뜨기" },
  { id:"a2", t:1,  len:2, chair:"c3", doc:"d2", hyg:"h2", st:"done",  p:"이준호", proc:"임플란트 2차" },
  { id:"a3", t:3,  len:1, chair:"c5", doc:null, hyg:"h1", st:"done",  p:"박세라", proc:"스케일링" },
  { id:"a4", t:4,  len:2, chair:"c2", doc:"d1", hyg:null, st:"noshow",p:"최강훈", proc:"레진 치료" },
  { id:"a5", t:5,  len:1, chair:"c5", doc:null, hyg:"h1", st:"conf",  p:"한지원", proc:"스케일링" },
  { id:"a6", t:6,  len:2, chair:"c4", doc:"d2", hyg:"h2", st:"conf",  p:"오은영", proc:"발치 상담" },
  { id:"a7", t:11, len:2, chair:"c1", doc:"d1", hyg:null, st:"conf",  p:"장미래", proc:"신경치료 3차" },
  { id:"a8", t:10, len:1, chair:"c5", doc:null, hyg:"h1", st:"wait",  p:"윤도현", proc:"스케일링" },
  { id:"a9", t:11, len:2, chair:"c3", doc:"d2", hyg:null, st:"conf",  p:"서예진", proc:"교정 조정" },
  { id:"a10",t:13, len:2, chair:"c2", doc:"d1", hyg:"h2", st:"wait",  p:"임현우", proc:"임플란트 상담" },
  { id:"a11",t:14, len:1, chair:"c5", doc:null, hyg:"h1", st:"conf",  p:"강나래", proc:"불소 도포" },
  { id:"a12",t:15, len:2, chair:"c4", doc:"d2", hyg:null, st:"cancel",p:"홍성민", proc:"크라운 장착" }
];
/* 블록 타임 — 점심 13:00~14:00(t=8), 체어4 정비 09:00~10:00 */
DD.BLOCKS = [
  { chair:"*",  t:8, len:2, label:"점심시간" },
  { chair:"c4", t:0, len:2, label:"체어 정비·소독" }
];
DD.SLOTS = 18;          /* 09:00~18:00 = 30분 × 18 */
DD.NOW_SLOT = 10.6;     /* 현재 시각 라인 위치(14:18) */

/* 대기 목록 (당일 취소 매칭 — R⑤) */
DD.WAITLIST = [
  { p:"문수빈", want:"오후", doc:"d2", proc:"크라운 상담", noshow:0, since:"08.11" },
  { p:"배준영", want:"무관", doc:null, proc:"스케일링", noshow:0, since:"08.12" },
  { p:"신아름", want:"오후", doc:"d2", proc:"레진", noshow:1, since:"08.13" }
];

/* 환자 (마스킹 원문 대조·노쇼 이력·동의) */
DD.PATIENTS = [
  { id:"P-1042", name:"장미래", birth:"1988-04-12", phone:"010-4417-8823", lastVisit:"2026-08-01",
    noshow12m:0, consent:{ privacy:true, sensitive:true, marketing:true, marketingAt:"2024-09-02" },
    desk:[ {t:"2026-08-01 11:20", who:"데스크1", txt:"신경치료 비용 안내 — 비급여 12만원 견적, 다음 내원 시 결제 예정"},
           {t:"2026-07-18 15:02", who:"실장", txt:"통증 문의 전화 — 내원 권유, 야간 통증 시 응급 안내"} ],
    emr:[ {t:"2026-08-01", txt:"#36 근관치료 2차 · 차기 근충 예정 (작성: 김이현)"},
          {t:"2026-07-18", txt:"#36 급성 치수염 진단 · 근관치료 개시 (작성: 김이현)"} ] },
  { id:"P-0871", name:"최강훈", birth:"1995-11-30", phone:"010-9280-1147", lastVisit:"2026-06-20",
    noshow12m:2, consent:{ privacy:true, sensitive:true, marketing:false, marketingAt:null },
    desk:[ {t:"2026-08-14 11:00", who:"데스크1", txt:"노쇼 — 연락 두절. 재예약 시 위약금 동의서 징구 대상"} ],
    emr:[ {t:"2026-06-20", txt:"#25 레진 수복 (작성: 김이현)"} ] },
  { id:"P-1156", name:"박세라", birth:"2001-02-08", phone:"010-3345-6621", lastVisit:"2026-08-14",
    noshow12m:0, consent:{ privacy:true, sensitive:false, marketing:true, marketingAt:"2026-08-01" },
    desk:[ {t:"2026-08-14 10:40", who:"데스크2", txt:"스케일링 완료 — 내년 1월 리콜 등록"} ], emr:[] },
  { id:"P-0233", name:"오은영", birth:"1972-07-19", phone:"010-7729-0084", lastVisit:"2026-08-14",
    noshow12m:1, consent:{ privacy:true, sensitive:true, marketing:true, marketingAt:"2024-08-20" },
    desk:[ {t:"2026-08-14 12:10", who:"실장", txt:"발치 후 임플란트 견적 상담 — 2개 기준 분납 문의"} ],
    emr:[ {t:"2026-08-14", txt:"#46 발치 · 임플란트 식립 계획 (작성: 박서준)"} ] }
];

/* 수납·미수 (R⑦⑧⑨) */
DD.PAYMENTS = [
  { t:"2026-08-14 10:35", p:"박세라", item:"스케일링(급여)", method:"카드", amount:16500, cash10:false, receipt:null },
  { t:"2026-08-14 11:55", p:"이준호", item:"임플란트 2차(비급여)", method:"현금", amount:1200000, cash10:true, receipt:true },
  { t:"2026-08-14 12:20", p:"김민지", item:"보철 본뜨기(비급여)", method:"카드", amount:350000, cash10:false, receipt:null },
  { t:"2026-08-13 17:40", p:"정우석", item:"교정 3회차(비급여)", method:"현금", amount:300000, cash10:true, receipt:false }
];
DD.ARREARS = [
  { p:"오은영", total:2400000, paid:1200000, plan:[["1차(수술)","2026-08-14",1200000,"완납"],["2차(보철)","2026-11-14",1200000,"예정"]],
    due:"2026-11-14", expire:"2029-11-14", stage:0 },
  { p:"홍성민", total:550000, paid:0, plan:[["크라운","2026-05-02",550000,"연체"]],
    due:"2026-05-02", expire:"2029-05-02", stage:1 },
  { p:"고재필", total:180000, paid:0, plan:[["레진 2개","2023-10-20",180000,"연체"]],
    due:"2023-10-20", expire:"2026-10-20", stage:2 }
];
DD.STAGES9 = ["안내","문자 촉구","내용증명 준비","지급명령 검토"];

/* 발송 (R①⑪) — 정보성/광고성 판정 사전 */
DD.AD_WORDS = ["할인","이벤트","프로모션","특가","무료","최저","신규 시술","미백 패키지","정기 검진 안내","검진 받으세요","스케일링 받으세요","예뻐지"];
DD.INFO_WORDS = ["예약","내원","변경","취소","수납","미수","잔액","주의사항","경과 확인"];
DD.BAN_MEDICAL = ["할인","본인부담금 면제","무료","최고","유일","이벤트"];  /* 의료법 27조·56조 린터 */
DD.TEMPLATES = [
  { name:"예약 리마인드 D-1", status:"승인", vars:5, body:"#{환자명}님, 내일 #{시간} #{담당의} 예약이 있습니다. 변경은 02-000-0000 (1 확인 / 2 변경 / 3 취소)" },
  { name:"수납 잔액 안내", status:"승인", vars:3, body:"#{환자명}님, 진료비 잔액 #{금액}원이 있습니다. 내원 시 수납 부탁드립니다." },
  { name:"정기검진 리콜", status:"반려", vars:2, body:"#{환자명}님, 스케일링 받으신 지 오래되셨어요! 이번 달 예약하고 관리 받으세요.", reject:"광고성 문구 포함(권유·유인) — 알림톡은 정보성 메시지 전용입니다" }
];
DD.SEND_STATS = { total:312, consented:88, nightConsent:12 };
DD.RECALL_MONTHLY = [1140,320,180,150,140,120,110,105,120,140,260,690]; /* 1월 스파이크(R⑥) */

/* 통계 (R⑦) */
DD.REV = { occurred: 18400000, collected: 12700000, pendingClaim: 3900000, arrears: 1800000 };
DD.NOSHOW = { total: 214, attended: 182, noshow: 19, sameDayCancel: 13 };

/* 이력 로그 (R④) */
DD.LOGS = [
  { t:"2026-08-14 14:02", who:"desk1", act:"환자 연락처 표시", target:"P-1042 장**", ip:"210.99.xx.xx", kind:"privacy" },
  { t:"2026-08-14 13:47", who:"chief", act:"수납 내역 수정(사유: 카드→현금 정정)", target:"박세라 16,500원", ip:"210.99.xx.xx", kind:"pay" },
  { t:"2026-08-14 11:20", who:"desk2", act:"예약 등록", target:"임현우 15:30 체어2", ip:"210.99.xx.xx", kind:"appt" },
  { t:"2026-08-14 02:14", who:"desk1", act:"환자 목록 217건 조회", target:"전체 목록", ip:"58.121.xx.xx", kind:"privacy", anomaly:"야간·대량 — 이상 접근 의심" },
  { t:"2026-08-13 18:02", who:"owner", act:"매출 통계 조회", target:"8월 누계", ip:"210.99.xx.xx", kind:"stat" }
];

/* SSOT (R③) */
DD.SSOT = { mode:"crm" };  /* crm | emr | sync */

/* 역할 (권한 — 데스크/실장/원장) */
DD.ROLES = {
  desk:  { label:"데스크", export:false, payEdit:false, stats:false, logs:false },
  chief: { label:"실장",   export:"사유 필수", payEdit:true, stats:"일부", logs:false },
  owner: { label:"원장",   export:true, payEdit:true, stats:true, logs:true }
};

/* 중복 고객 후보 (동명이인·전화 일치 — 병합 대상) */
DD.DUP_CANDIDATES = [
  { key:"장미래·010-4417-8823", reason:"이름+전화 완전 일치", records:[
    { id:"P-1042", name:"장미래", phone:"010-4417-8823", birth:"1988-04-12", lastVisit:"2026-08-01", visits:18 },
    { id:"P-1301", name:"장미래", phone:"010-4417-8823", birth:"1988-04-12", lastVisit:"2025-11-20", visits:3 }
  ]},
  { key:"김민수", reason:"동명이인 — 전화·생년 다름(병합 금지 후보)", records:[
    { id:"P-0455", name:"김민수", phone:"010-2201-3388", birth:"1990-03-03", lastVisit:"2026-07-30", visits:6 },
    { id:"P-0912", name:"김민수", phone:"010-8834-1120", birth:"1975-09-15", lastVisit:"2026-06-11", visits:2 }
  ]}
];

/* 삭제·비활성 고객 (물리삭제 없음 — 보존기간·소프트삭제) */
DD.INACTIVE = [
  { id:"P-0233b", name:"정우석", reason:"본인 탈퇴 요청", inactiveAt:"2026-05-02", keepUntil:"2036-05-02", note:"진료기록 10년 보존 중 — 파기 불가" },
  { id:"P-0710", name:"한소희", reason:"중복 병합(→ P-1042)", inactiveAt:"2026-08-01", keepUntil:"병합 보존", note:"병합 이력 보존, 되돌리기 가능" },
  { id:"P-0088", name:"오세훈", reason:"5년 미내원 자동 비활성", inactiveAt:"2026-01-10", keepUntil:"2031-01-10", note:"명부 보존 5년 경과 시 파기 대상" }
];

/* 매입 (재료·약제 — 공급처·외상) */
DD.SUPPLIERS = ["㈜덴탈메이트","오스템임플란트","신흥治材","GC코리아"];
DD.PURCHASES = [
  { t:"2026-08-13", supplier:"오스템임플란트", item:"임플란트 픽스처 (레귤러)", qty:20, amount:1600000, paid:true, lot:"OT-2608-A", exp:"2029-08" },
  { t:"2026-08-12", supplier:"㈜덴탈메이트", item:"글러브·소독재 세트", qty:10, amount:180000, paid:true, lot:"-", exp:"2027-08" },
  { t:"2026-08-10", supplier:"GC코리아", item:"레진 (A2/A3)", qty:8, amount:320000, paid:false, lot:"GC-2607", exp:"2028-02" },
  { t:"2026-08-08", supplier:"신흥治材", item:"마취제 (리도카인)", qty:50, amount:250000, paid:false, lot:"SH-2605", exp:"2027-05" }
];

/* 진료항목 마스터 (헤어사랑넷 serviceMstr 계승 — 진료과 계층 + 급여구분·소요시간) */
DD.SERVICES = [
  { cat:"보존", items:[
    { name:"레진 치료", ins:"비급여", min:60 },
    { name:"신경치료(근관)", ins:"비급여", min:90 },
    { name:"인레이/온레이", ins:"비급여", min:60 } ] },
  { cat:"보철", items:[
    { name:"크라운 장착", ins:"비급여", min:60 },
    { name:"보철 본뜨기", ins:"비급여", min:60 },
    { name:"임플란트 1차(식립)", ins:"비급여", min:90 },
    { name:"임플란트 2차(보철)", ins:"비급여", min:60 } ] },
  { cat:"예방·위생", items:[
    { name:"스케일링", ins:"급여(연1회)", min:30 },
    { name:"불소 도포", ins:"비급여", min:30 },
    { name:"잇몸 치료", ins:"급여", min:30 } ] },
  { cat:"구강외과", items:[
    { name:"발치", ins:"급여", min:30 },
    { name:"발치 상담", ins:"상담", min:30 } ] },
  { cat:"교정", items:[
    { name:"교정 상담", ins:"상담", min:30 },
    { name:"교정 조정", ins:"비급여", min:30 } ] }
];

/* EMR 규제 키워드 (R② 저장 차단) */
DD.EMR_WORDS = ["근관치료","발치","크라운 장착","레진 수복","치수염","임플란트 식립","#\\d{2}","rct","신경치료 시행","진단"];
