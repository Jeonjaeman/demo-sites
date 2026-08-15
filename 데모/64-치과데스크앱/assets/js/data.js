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
  { t:"2026-08-14 12:05", p:"오은영", item:"임플란트 1차 식립(비급여)", method:"현금", amount:1200000, cash10:true, receipt:true },
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

/* 물품(재고) — 잔여량·안전재고·유효기간 (헤어사랑넷 goods 재고원장 계승) */
DD.INVENTORY = [
  { id:"IV-01", name:"임플란트 픽스처(레귤러)", cat:"임플란트", unit:"개", stock:14, safety:10, exp:"2029-08", supplier:"오스템임플란트", perUse:1, uses:["임플란트 1차(식립)"] },
  { id:"IV-02", name:"임플란트 힐링 어벗먼트", cat:"임플란트", unit:"개", stock:6, safety:8, exp:"2030-01", supplier:"오스템임플란트", perUse:1, uses:["임플란트 2차(보철)"] },
  { id:"IV-03", name:"레진 A2", cat:"수복재료", unit:"시린지", stock:3, safety:4, exp:"2027-02", supplier:"GC코리아", perUse:1, uses:["레진 치료"] },
  { id:"IV-04", name:"레진 A3", cat:"수복재료", unit:"시린지", stock:5, safety:4, exp:"2028-02", supplier:"GC코리아", perUse:1, uses:["레진 치료"] },
  { id:"IV-05", name:"마취제(리도카인)", cat:"약제", unit:"앰플", stock:48, safety:20, exp:"2026-11", supplier:"신흥治材", perUse:2, uses:["발치","신경치료(근관)"] },
  { id:"IV-06", name:"거타퍼차 포인트", cat:"근관재료", unit:"박스", stock:9, safety:3, exp:"2031-05", supplier:"신흥治材", perUse:1, uses:["신경치료(근관)"] },
  { id:"IV-07", name:"글러브(라텍스 M)", cat:"소모품", unit:"박스", stock:2, safety:5, exp:"2027-08", supplier:"㈜덴탈메이트", perUse:0, uses:[] },
  { id:"IV-08", name:"스케일링 팁", cat:"소모품", unit:"개", stock:12, safety:6, exp:"-", supplier:"㈜덴탈메이트", perUse:0, uses:["스케일링"] },
  { id:"IV-09", name:"불소 바니시", cat:"예방재료", unit:"팩", stock:7, safety:5, exp:"2026-09", supplier:"GC코리아", perUse:1, uses:["불소 도포"] }
];

/* 진료항목 마스터 (헤어사랑넷 serviceMstr 계승 — 진료과 계층 + 급여구분·소요시간) */
DD.SERVICES = [
  { cat:"보존", items:[
    { name:"레진 치료", ins:"비급여", min:60, price:100000 },
    { name:"신경치료(근관)", ins:"비급여", min:90, price:300000 },
    { name:"인레이/온레이", ins:"비급여", min:60, price:350000 } ] },
  { cat:"보철", items:[
    { name:"크라운 장착", ins:"비급여", min:60, price:500000 },
    { name:"보철 본뜨기", ins:"비급여", min:60, price:0 },
    { name:"임플란트 1차(식립)", ins:"비급여", min:90, price:900000 },
    { name:"임플란트 2차(보철)", ins:"비급여", min:60, price:400000 } ] },
  { cat:"예방·위생", items:[
    { name:"스케일링", ins:"급여(연1회)", min:30, price:null },
    { name:"불소 도포", ins:"비급여", min:30, price:30000 },
    { name:"잇몸 치료", ins:"급여", min:30, price:null } ] },
  { cat:"구강외과", items:[
    { name:"발치", ins:"급여", min:30, price:null },
    { name:"발치 상담", ins:"상담", min:30, price:null } ] },
  { cat:"교정", items:[
    { name:"교정 상담", ins:"상담", min:30, price:null },
    { name:"교정 조정", ins:"비급여", min:30, price:50000 } ] }
];

/* EMR 규제 키워드 (R② 저장 차단) */
DD.EMR_WORDS = ["근관치료","발치","크라운 장착","레진 수복","치수염","임플란트 식립","#\\d{2}","rct","신경치료 시행","진단"];

/* ── 문자·알림톡 마케팅 스위트 (헤어사랑넷 06-SMS 계승 · 병원 매핑) ── */

/* 발송 잔액·이번 달 사용 요약 */
DD.SMS_WALLET = { cash:12400, price:{ SMS:9, LMS:30, 알림톡:8, 친구톡:15 },
  monthUse:[ {type:"알림톡", cnt:388, cost:3104}, {type:"SMS", cnt:18, cost:162}, {type:"LMS", cnt:6, cost:180} ] };

/* 발송 내역 (smsSendList — 상태코드 매핑 §1.5) */
DD.SMS_HISTORY = [
  { t:"2026-08-14 17:00", to:"010-****-8823", name:"장미래", type:"알림톡", tpl:"예약 D-1 리마인드", body:"장미래님, 내일 14:00 김이현 원장 예약이 있습니다.", st:"성공", cost:8 },
  { t:"2026-08-14 17:00", to:"010-****-1147", name:"최강훈", type:"알림톡", tpl:"예약 D-1 리마인드", body:"최강훈님, 내일 10:30 박서준 원장 예약이 있습니다.", st:"성공", cost:8 },
  { t:"2026-08-14 17:00", to:"010-****-6621", name:"박세라", type:"알림톡", tpl:"예약 D-1 리마인드", body:"박세라님, 내일 09:00 스케일링 예약이 있습니다.", st:"실패", stMsg:"카카오 미채널(친구아님)→SMS 대체", cost:9 },
  { t:"2026-08-14 12:05", to:"010-****-0084", name:"오은영", type:"알림톡", tpl:"수납 완료 안내", body:"오은영님, 임플란트 1차 식립 1,200,000원이 수납 처리되었습니다.", st:"성공", cost:8 },
  { t:"2026-08-14 09:12", to:"010-****-3388", name:"김민수", type:"SMS", tpl:"직접 발송", body:"김민수님, 보철 본뜨기 결과물이 도착했습니다. 내원 예약 부탁드립니다.", st:"성공", cost:9 },
  { t:"2026-08-13 17:00", to:"010-****-9902", name:"홍성민", type:"알림톡", tpl:"미수금 안내", body:"홍성민님, 크라운 잔액 550,000원 분납 예정일이 도래했습니다.", st:"성공", cost:8 },
  { t:"2026-08-13 14:30", to:"010-****-2201", name:"이수진", type:"LMS", tpl:"진료 후 주의사항", body:"발치 후 주의사항 안내: 2시간 거즈 물기, 당일 음주·흡연 금지, 빨대 사용 금지…", st:"성공", cost:30 },
  { t:"2026-08-13 11:00", to:"010-****-4417", name:"정우석", type:"알림톡", tpl:"교정 조정 안내", body:"정우석님, 다음 교정 조정일은 8/27 15:00입니다.", st:"수신거부", stMsg:"080 수신거부 등록번호", cost:0 },
  { t:"2026-08-12 08:00", to:"010-****-7788", name:"강나래", type:"알림톡", tpl:"생일 축하·검진 안내", body:"강나래님, 생신을 축하드립니다. 정기 구강검진 시기가 되었습니다.", st:"성공", cost:8 },
  { t:"2026-08-12 17:00", to:"010-****-5560", name:"윤도현", type:"SMS", tpl:"예약 D-1 리마인드", body:"윤도현님, 내일 16:30 크라운 장착 예약이 있습니다.", st:"실패", stMsg:"결번(1000: 없는 번호)", cost:0 }
];

/* 예약 문자 (sendFlag=1 예약발송 큐 §4) */
DD.SMS_SCHEDULED = [
  { at:"2026-08-15 17:00", title:"예약 D-1 리마인드 (자동)", type:"알림톡", target:"내일 내원 예정 14명", cnt:14, st:"예약됨", auto:true },
  { at:"2026-08-16 10:00", title:"스케일링 급여 리셋 안내", type:"알림톡", target:"올해 미수검 · 동의자 63명", cnt:63, st:"예약됨", auto:false },
  { at:"2026-08-18 09:00", title:"임플란트 2차 내원 안내", type:"LMS", target:"1차 완료 후 14일 경과 8명", cnt:8, st:"예약됨", auto:true },
  { at:"2026-08-20 08:00", title:"8월 생일 고객 검진 안내", type:"알림톡", target:"8월 생일 · 동의자 21명", cnt:21, st:"예약됨", auto:true }
];

/* 문자 보관함 (smsKeep — 재사용 템플릿 §4) */
DD.SMS_KEEP = [
  { name:"예약 리마인드(기본)", type:"알림톡", body:"#{환자명}님, #{예약일시} #{담당의} 예약이 있습니다. 변경은 #{병원번호}" },
  { name:"발치 후 주의사항", type:"LMS", body:"#{환자명}님, 발치 후 주의사항 안내드립니다. 2시간 거즈 물기, 당일 음주·흡연·빨대 금지, 통증 지속 시 내원 바랍니다." },
  { name:"임플란트 2차 안내", type:"알림톡", body:"#{환자명}님, 임플란트 식립 후 골유착 기간이 지나 보철(2차) 시기가 되었습니다. 내원 예약 부탁드립니다." },
  { name:"수납 완료·영수증", type:"알림톡", body:"#{환자명}님, #{진료항목} #{금액}원이 수납 처리되었습니다. 제증명 발급은 데스크에 문의하세요." },
  { name:"스케일링 급여 안내", type:"알림톡", body:"#{환자명}님, 건강보험 스케일링은 연 1회 급여 적용됩니다. 올해 미수검 시 내원 예약을 권장드립니다." }
];

/* 자동 발송 설정 (autoType 병원 매핑 §3·§8.2) */
DD.SMS_AUTO = [
  { key:"resD1",    name:"예약 리마인드",     trig:"내원 D-1 정시", ch:"알림톡", tpl:"예약 D-1 리마인드",  on:true,  info:true,  cnt:14, msg:"#{환자명}님, 내일 #{예약일시} #{담당의} 예약이 있습니다. 변경은 02-000-0000 (1 확인 / 2 변경 / 3 취소)" },
  { key:"resAccept",name:"예약 접수·확정 안내", trig:"예약 등록·확정 즉시", ch:"알림톡", tpl:"예약 접수 안내", on:true, info:true, cnt:0, msg:"#{환자명}님, #{예약일시} #{담당의} 예약이 정상 접수되었습니다. 내원 10분 전 도착 부탁드립니다." },
  { key:"afterCare",name:"진료 후 안내",       trig:"시술 완료 D+1", ch:"LMS",  tpl:"진료 후 주의사항", on:true,  info:true,  cnt:6, msg:"#{환자명}님, 어제 진료 후 주의사항 안내드립니다. 2시간 후 식사, 당일 음주·흡연·격한 운동은 삼가시고 통증 지속 시 내원 바랍니다." },
  { key:"pay",      name:"수납 완료·영수증",   trig:"수납 완료 즉시", ch:"알림톡", tpl:"수납 완료 안내",  on:true,  info:true,  cnt:0, msg:"#{환자명}님, #{진료항목} #{금액}원이 수납 처리되었습니다. 제증명 발급은 데스크에 문의하세요." },
  { key:"arrears",  name:"미수금 분납 안내",    trig:"분납 예정일 도래", ch:"알림톡", tpl:"미수금 안내",   on:true,  info:true,  cnt:3, msg:"#{환자명}님, 진료비 잔액 #{금액}원의 분납 예정일이 도래했습니다. 내원 또는 계좌 납부 부탁드립니다." },
  { key:"recall",   name:"검진 주기 리콜",     trig:"스케일링 급여 리셋(연1회)", ch:"알림톡", tpl:"검진 안내", on:false, info:false, cnt:63, msg:"#{환자명}님, 건강보험 스케일링은 연 1회 적용됩니다. 올해 미수검 시 정기 검진 예약을 권장드립니다." },
  { key:"birth",    name:"생일 축하·검진",     trig:"생일 당일 08시", ch:"알림톡", tpl:"생일·검진 안내", on:true, info:false, cnt:21, msg:"#{환자명}님, 생신을 진심으로 축하드립니다. 건강한 미소를 오래 지켜드리겠습니다. 정기 검진도 잊지 마세요!" },
  { key:"welcome",  name:"신규 환자 인사",     trig:"최초 등록 당일",  ch:"알림톡", tpl:"신규 환자 인사", on:false, info:true, cnt:0, msg:"#{환자명}님, 서울밝은치과를 찾아주셔서 감사합니다. 첫 내원 후 궁금하신 점은 언제든 문의해 주세요." },
  { key:"noshow",   name:"노쇼 후 재예약 유도", trig:"노쇼 D+2",       ch:"SMS",  tpl:"재예약 안내",   on:false, info:false, cnt:1, msg:"#{환자명}님, 예약하신 진료에 내원하지 못하셨습니다. 편하신 시간으로 재예약 도와드리겠습니다. 02-000-0000" }
];

/* 문자 샘플 갤러리 (뷰티사랑넷 문자샘플 계승 · 치과 톤) — 카테고리별 문안 카드 */
DD.SMS_SAMPLES = [
  { cat:"예약", type:"알림톡", title:"예약 리마인드", body:"#{환자명}님, 내일 #{예약일시} #{담당의} 예약이 있습니다. 변경은 02-000-0000 (1 확인 / 2 변경 / 3 취소)" },
  { cat:"예약", type:"알림톡", title:"예약 접수 확인", body:"#{환자명}님, #{예약일시} 예약이 접수되었습니다. 내원 10분 전 도착 부탁드립니다." },
  { cat:"진료후", type:"LMS", title:"발치 후 주의사항", body:"#{환자명}님, 발치 후 주의사항 안내드립니다. 2시간 거즈 물기, 당일 음주·흡연·빨대 사용 금지, 통증 지속 시 내원 바랍니다." },
  { cat:"진료후", type:"LMS", title:"임플란트 식립 후", body:"#{환자명}님, 임플란트 식립 후 골유착 기간이 중요합니다. 딱딱한 음식은 피하시고 처방약을 잊지 말고 복용하세요." },
  { cat:"검진리콜", type:"알림톡", title:"스케일링 급여 안내", body:"#{환자명}님, 건강보험 스케일링은 연 1회 적용됩니다. 올해 미수검 시 정기 검진 예약을 권장드립니다." },
  { cat:"검진리콜", type:"알림톡", title:"교정 정기 점검", body:"#{환자명}님, 교정 장치 정기 점검 시기가 되었습니다. 예약 도와드릴까요?" },
  { cat:"생일", type:"알림톡", title:"생일 축하", body:"#{환자명}님, 생신을 진심으로 축하드립니다. 건강한 미소를 오래 지켜드리겠습니다. 정기 검진도 잊지 마세요!" },
  { cat:"신규", type:"알림톡", title:"첫 내원 감사", body:"#{환자명}님, 서울밝은치과를 찾아주셔서 감사합니다. 첫 내원 후 궁금하신 점은 언제든 문의해 주세요." },
  { cat:"휴면", type:"알림톡", title:"장기 미내원 안내", body:"#{환자명}님, 마지막 내원 후 시간이 꽤 지났습니다. 구강 상태 점검이 필요한 시기이니 편하실 때 방문해 주세요." },
  { cat:"안부", type:"알림톡", title:"환절기 안부", body:"#{환자명}님, 환절기 잇몸 건강 잘 챙기고 계신가요? 서울밝은치과가 늘 건강한 미소를 응원합니다." },
  { cat:"안부", type:"알림톡", title:"명절 인사", body:"#{환자명}님, 즐거운 명절 보내세요. 연휴 중 치과 응급은 02-000-0000으로 안내드립니다." },
  { cat:"이벤트", type:"SMS", title:"(광고) 검진 캠페인", body:"#{환자명}님, 8월 구강검진 캠페인 안내입니다. 자세한 내용은 문의 주세요. (무료수신거부 080-000-0000)", ad:true }
];

/* 알림톡 설정 (kakaoMapping·채널·템플릿 심사 §2) */
DD.KAKAO = {
  channel:{ yellowId:"@서울밝은치과", senderKey:"a1b2****f9", status:"연동", profile:"서울밝은치과의원", connectedAt:"2026-05-02" },
  templates:[
    { name:"예약 D-1 리마인드", code:"DENT_RES_D1", vars:"환자명·예약일시·담당의", status:"승인", body:"#{환자명}님, #{예약일시} #{담당의} 예약이 있습니다." },
    { name:"수납 완료 안내",   code:"DENT_PAY_OK", vars:"환자명·항목·금액", status:"승인", body:"#{환자명}님, #{진료항목} #{금액}원이 수납 처리되었습니다." },
    { name:"진료 후 안내",     code:"DENT_AFTER",  vars:"환자명·주의사항", status:"승인", body:"#{환자명}님, 진료 후 주의사항 안내드립니다." },
    { name:"검진 리콜(정기)",  code:"DENT_RECALL", vars:"환자명", status:"심사중", body:"#{환자명}님, 정기 구강검진 시기가 되었습니다.", note:"영업일 2일 심사" },
    { name:"여름 임플란트 할인", code:"DENT_EVENT", vars:"환자명·할인율", status:"반려", body:"#{환자명}님, 8월 임플란트 30% 할인 이벤트!", note:"반려: 정보성 채널에 광고성 문구·의료법 유인성 표현" }
  ]
};

/* 발신번호 설정 (regNumber KISA 사전등록 §1.3) */
DD.SENDERS = [
  { number:"02-000-0000", label:"대표번호", nominee:"사업자", auth:"서류인증", status:"등록완료", regAt:"2026-05-01" },
  { number:"1588-0000",   label:"콜센터",   nominee:"사업자", auth:"서류인증", status:"등록완료", regAt:"2026-05-01" },
  { number:"010-****-2200", label:"실장 직통", nominee:"본인",  auth:"휴대폰 실명인증", status:"심사중", regAt:"2026-08-13" },
  { number:"070-0000-0000", label:"신규 인터넷전화", nominee:"사업자", auth:"서류인증", status:"반려", regAt:"2026-08-10", note:"통신가입증명원 사업자명 불일치" }
];

/* 충전·사용 내역 (cash_member_log §1.4) */
DD.SMS_CHARGE = [
  { t:"2026-08-14 17:03", type:"차감", detail:"알림톡 발송 388건", amt:-3104, bal:12400 },
  { t:"2026-08-10 09:20", type:"충전", detail:"카드 충전", amt:15000, bal:15504 },
  { t:"2026-08-07 17:02", type:"차감", detail:"알림톡·SMS 혼합 발송", amt:-2960, bal:504 },
  { t:"2026-08-01 10:00", type:"충전", detail:"자동충전(잔액 5천원 미만)", amt:10000, bal:3464 }
];

/* 수신거부 목록 (smsDenyList §1.6) */
DD.SMS_DENY = [
  { number:"010-****-4417", name:"정우석", at:"2026-08-13", src:"080 자동 수신거부" },
  { number:"010-****-1120", name:"김민수(P-0912)", at:"2026-07-22", src:"데스크 직접 등록" },
  { number:"010-****-8890", name:"(미매칭)", at:"2026-07-15", src:"그룹 수신거부 동기화" },
  { number:"010-****-3345", name:"이하늘", at:"2026-06-30", src:"광고 문자 하단 수신거부" }
];

/* ── 통계 분석 카탈로그 (헤어사랑넷 통계/인센 트리 계승 · 병원 매핑) ── */
DD.STATS = {
  months:["9월","10월","11월","12월","1월","2월","3월","4월","5월","6월","7월","8월"],
  salesMonthly:[4820,5130,4990,5560,4210,4680,5240,5010,5380,5620,5910,6180], // 만원
  salesLastYear:[4210,4380,4510,4820,3980,4120,4450,4610,4880,5020,5310,5480],
  newPtMonthly:[14,17,12,19,9,11,16,15,18,20,17,18],
  visitMonthly:[142,151,138,166,120,131,158,149,168,175,171,160],
  noshowMonthly:[12,14,10,18,9,11,15,13,17,19,16,19],
  byType:[["비급여 진료",4180],["급여 진료",1240],["재료·판매",180],["기타",60]], // 만원 (이번달)
  byMethod:[["카드",3980],["현금",1120],["계좌이체",560]],
  byDoc:[["김이현 원장",3210],["박서준 원장",2450]],
  byDept:[["보철·임플란트",3650],["보존(신경·레진)",980],["교정",720],["예방·급여",240],["구강외과",180]],
  ptRankSales:[["오은영",8600],["최강훈",5400],["장미래",4200],["김민수",3100],["박세라",1800],["윤도현",1500]], // 천원 누적
  visitByHour:[["09시",18],["10시",34],["11시",31],["12시",9],["14시",28],["15시",30],["16시",26],["17시",22],["18시",14]],
  visitByDow:[["월",142],["화",168],["수",151],["목",173],["금",196],["토",210]],
  ptAge:[["10대",8],["20대",22],["30대",38],["40대",34],["50대",26],["60대+",32]],
  ptGender:[["여성",96],["남성",64]],
  ptByDoc:[["김이현 원장",92],["박서준 원장",68]],
  birthMonthly:[11,9,14,10,13,8,12,15,10,9,11,7],
  procCount:[["임플란트",6],["보철",7],["신경치료",9],["레진",11],["스케일링",42],["발치",14],["교정 조정",8]],
  procSalesY:[["임플란트",8640],["보철",2450],["교정",1980],["신경치료",1080],["레진",760],["기타",520]], // 만원 연간
  procByAge:[["20대","레진·교정"],["30대","임플란트·보철"],["40대","임플란트·크라운"],["50대+","임플란트·틀니"]],
  matUse:[["레진",210],["픽스처",48],["마취제",320],["거타퍼차",90],["글러브",180]], // 이번달 사용량
  docHours:[["김이현 원장",148],["박서준 원장",121]], // 월 진료시간(시간)
  docProc:[["김이현 원장",210],["박서준 원장",168]], // 월 진료건
  smsMonthly:[280,310,295,340,260,290,360,330,388,402,412,388],
  callMonthly:[[ "수신",320],["발신",210]], // 이번달
  callMonthlySeries:{ in:[290,310,280,340,250,270,330,300,350,360,340,320], out:[180,200,190,220,160,175,210,195,230,240,225,210] }
};

/* 분석 트리 — folder→items. kind: month(12개월 막대)·hbar(가로 랭킹)·table·compare(2계열) */
DD.STAT_TREE = [
  { folder:"⭐ 즐겨찾기", star:true, items:[
    { code:"fav1", t:"월별 신규환자", kind:"month", src:"newPtMonthly", unit:"명" },
    { code:"fav2", t:"월별 내원수", kind:"month", src:"visitMonthly", unit:"명" } ] },
  { folder:"매출분석 — 연간", items:[
    { code:"s01", t:"연간 매출 추이", kind:"month", src:"salesMonthly", unit:"만원" },
    { code:"s02", t:"매출 구분별", kind:"hbar", src:"byType", unit:"만원" },
    { code:"s03", t:"결제 수단별", kind:"hbar", src:"byMethod", unit:"만원" },
    { code:"s04", t:"담당의별 매출", kind:"hbar", src:"byDoc", unit:"만원" },
    { code:"s05", t:"진료과별 매출", kind:"hbar", src:"byDept", unit:"만원" } ] },
  { folder:"매출분석 — 비교", items:[
    { code:"c01", t:"작년 대비 올해 매출", kind:"compare", src:"salesMonthly", src2:"salesLastYear", unit:"만원" },
    { code:"c02", t:"진료과별 연간 매출", kind:"hbar", src:"procSalesY", unit:"만원" } ] },
  { folder:"고객분석 — 매출", items:[
    { code:"p01", t:"환자 매출 순위", kind:"hbar", src:"ptRankSales", unit:"천원" } ] },
  { folder:"고객분석 — 예약/방문", items:[
    { code:"v01", t:"월별 신규환자", kind:"month", src:"newPtMonthly", unit:"명" },
    { code:"v02", t:"월별 내원수", kind:"month", src:"visitMonthly", unit:"명" },
    { code:"v03", t:"월별 노쇼", kind:"month", src:"noshowMonthly", unit:"건" },
    { code:"v04", t:"시간대별 내원", kind:"hbar", src:"visitByHour", unit:"명" },
    { code:"v05", t:"요일별 내원", kind:"hbar", src:"visitByDow", unit:"명" } ] },
  { folder:"고객분석 — 정보", items:[
    { code:"i01", t:"성별 분포", kind:"hbar", src:"ptGender", unit:"명" },
    { code:"i02", t:"연령대 분포", kind:"hbar", src:"ptAge", unit:"명" },
    { code:"i03", t:"담당의별 환자수", kind:"hbar", src:"ptByDoc", unit:"명" },
    { code:"i04", t:"월별 생일 환자", kind:"month", src:"birthMonthly", unit:"명" } ] },
  { folder:"진료분석", items:[
    { code:"t01", t:"진료 인기도(건수)", kind:"hbar", src:"procCount", unit:"건" },
    { code:"t02", t:"진료별 연간 매출", kind:"hbar", src:"procSalesY", unit:"만원" },
    { code:"t03", t:"연령대별 인기 진료", kind:"table", src:"procByAge", cols:["연령대","인기 진료"] } ] },
  { folder:"재료·물품분석", items:[
    { code:"m01", t:"이번 달 재료 사용량", kind:"hbar", src:"matUse", unit:"단위" } ] },
  { folder:"직원분석", items:[
    { code:"e01", t:"담당의별 진료시간", kind:"hbar", src:"docHours", unit:"시간" },
    { code:"e02", t:"담당의별 진료건", kind:"hbar", src:"docProc", unit:"건" } ] },
  { folder:"문자분석", items:[
    { code:"x01", t:"월별 문자 발송", kind:"month", src:"smsMonthly", unit:"건" } ] },
  { folder:"전화분석 (CID)", items:[
    { code:"n01", t:"월별 수·발신 추이", kind:"compare", src:"callMonthlySeries.in", src2:"callMonthlySeries.out", unit:"건", legend:["수신","발신"] },
    { code:"n02", t:"이번 달 수·발신", kind:"hbar", src:"callMonthly", unit:"건" } ] }
];

/* 진료시간·휴무 (헤어사랑넷 업무시간/휴무 계승 · 치과) */
DD.HOURS = [
  { day:"월", open:true,  s:"09:00", e:"18:00", brk:"13:00~14:00", note:"" },
  { day:"화", open:true,  s:"09:00", e:"18:00", brk:"13:00~14:00", note:"" },
  { day:"수", open:true,  s:"09:00", e:"18:00", brk:"13:00~14:00", note:"" },
  { day:"목", open:true,  s:"09:00", e:"20:30", brk:"13:00~14:00", note:"야간 진료" },
  { day:"금", open:true,  s:"09:00", e:"18:00", brk:"13:00~14:00", note:"" },
  { day:"토", open:true,  s:"09:00", e:"13:00", brk:"", note:"오전 진료" },
  { day:"일", open:false, s:"", e:"", brk:"", note:"" }
];
DD.HOLIDAYS = { regular:"매주 일요일 · 공휴일 휴진",
  days:["신정","설 연휴(3일)","삼일절","석가탄신일","어린이날","현충일","광복절","추석 연휴(3일)","개천절","한글날","성탄절"] };

/* 월간·목록용 날짜 스케줄 (2026-08) — 타임라인 day뷰는 APPTS(오늘), 이건 달력/목록용 */
DD.SCHED = [
  { date:"2026-08-03", time:"10:00", len:2, p:"과거 홍정민", proc:"신경치료 1차", doc:"d1", hyg:null, chair:"c1", st:"done" },
  { date:"2026-08-03", time:"15:10", len:1, p:"이수진", proc:"스케일링", doc:null, hyg:"h1", chair:"c5", st:"done" },
  { date:"2026-08-05", time:"11:00", len:2, p:"김남식", proc:"임플란트 1차", doc:"d2", hyg:"h2", chair:"c3", st:"done" },
  { date:"2026-08-06", time:"11:00", len:1, p:"이혜정", proc:"불소 도포", doc:null, hyg:"h1", chair:"c5", st:"done" },
  { date:"2026-08-07", time:"14:20", len:2, p:"황윤희", proc:"크라운 장착", doc:"d1", hyg:null, chair:"c2", st:"done" },
  { date:"2026-08-10", time:"09:30", len:2, p:"문수빈", proc:"보철 본뜨기", doc:"d2", hyg:null, chair:"c4", st:"done" },
  { date:"2026-08-11", time:"16:00", len:1, p:"배준영", proc:"스케일링", doc:null, hyg:"h1", chair:"c5", st:"done" },
  { date:"2026-08-12", time:"10:00", len:2, p:"김남식", proc:"임플란트 2차", doc:"d2", hyg:"h2", chair:"c3", st:"done" },
  { date:"2026-08-13", time:"14:30", len:2, p:"이수진", proc:"발치", doc:"d1", hyg:null, chair:"c2", st:"done" },
  { date:"2026-08-13", time:"11:00", len:1, p:"정우석", proc:"교정 조정", doc:"d2", hyg:null, chair:"c4", st:"done" },
  /* 오늘 2026-08-14 (APPTS와 정합) */
  { date:"2026-08-14", time:"09:00", len:2, p:"김민지", proc:"보철 본뜨기", doc:"d1", hyg:null, chair:"c1", st:"done" },
  { date:"2026-08-14", time:"09:30", len:2, p:"이준호", proc:"임플란트 2차", doc:"d2", hyg:"h2", chair:"c3", st:"done" },
  { date:"2026-08-14", time:"10:30", len:1, p:"박세라", proc:"스케일링", doc:null, hyg:"h1", chair:"c5", st:"done" },
  { date:"2026-08-14", time:"11:00", len:2, p:"최강훈", proc:"레진 치료", doc:"d1", hyg:null, chair:"c2", st:"noshow" },
  { date:"2026-08-14", time:"12:00", len:2, p:"오은영", proc:"발치 상담", doc:"d2", hyg:"h2", chair:"c4", st:"conf" },
  { date:"2026-08-14", time:"14:30", len:2, p:"장미래", proc:"신경치료 3차", doc:"d1", hyg:null, chair:"c1", st:"conf" },
  { date:"2026-08-14", time:"14:30", len:2, p:"서예진", proc:"교정 조정", doc:"d2", hyg:null, chair:"c3", st:"conf" },
  { date:"2026-08-14", time:"15:30", len:2, p:"임현우", proc:"임플란트 상담", doc:"d1", hyg:"h2", chair:"c2", st:"wait" },
  { date:"2026-08-14", time:"16:30", len:2, p:"홍성민", proc:"크라운 장착", doc:"d2", hyg:null, chair:"c4", st:"cancel" },
  { date:"2026-08-14", time:"11:30", len:1, p:"한지원", proc:"스케일링", doc:null, hyg:"h1", chair:"c5", st:"conf" },
  { date:"2026-08-14", time:"14:00", len:1, p:"윤도현", proc:"스케일링", doc:null, hyg:"h1", chair:"c5", st:"wait" },
  { date:"2026-08-14", time:"16:00", len:1, p:"강나래", proc:"불소 도포", doc:null, hyg:"h1", chair:"c5", st:"conf" },
  /* 미래 예약 */
  { date:"2026-08-18", time:"09:00", len:2, p:"김남식", proc:"임플란트 2차", doc:"d2", hyg:"h2", chair:"c3", st:"conf" },
  { date:"2026-08-18", time:"14:00", len:1, p:"강나래", proc:"불소 도포", doc:null, hyg:"h1", chair:"c5", st:"conf" },
  { date:"2026-08-19", time:"10:00", len:2, p:"오은영", proc:"임플란트 2차(보철)", doc:"d2", hyg:"h2", chair:"c4", st:"conf" },
  { date:"2026-08-20", time:"11:00", len:2, p:"문수빈", proc:"크라운 장착", doc:"d1", hyg:null, chair:"c1", st:"conf" },
  { date:"2026-08-21", time:"15:00", len:1, p:"신아름", proc:"스케일링", doc:null, hyg:"h1", chair:"c5", st:"conf" },
  { date:"2026-08-24", time:"09:30", len:2, p:"장미래", proc:"신경치료 4차", doc:"d1", hyg:null, chair:"c1", st:"conf" },
  { date:"2026-08-26", time:"10:00", len:2, p:"김남식", proc:"임플란트 정기점검", doc:"d2", hyg:"h2", chair:"c3", st:"conf" },
  { date:"2026-08-27", time:"15:00", len:2, p:"정우석", proc:"교정 조정", doc:"d2", hyg:null, chair:"c4", st:"conf" },
  { date:"2026-08-28", time:"11:00", len:1, p:"이혜정", proc:"스케일링", doc:null, hyg:"h1", chair:"c5", st:"conf" },
  { date:"2026-08-31", time:"14:00", len:2, p:"황윤희", proc:"보철 본뜨기", doc:"d1", hyg:null, chair:"c2", st:"conf" }
];

/* 환자 차트 보조정보 (포인트·비급여 패키지·진료사진 메타) — 차트 다탭용 */
DD.PT_EXTRA = {
  "P-1042": { points:12400, grade:"골드", packages:[{name:"신경치료 패키지", total:4, used:2, expire:"2026-12-31"}],
    photos:[{date:"2026-08-01", label:"#36 근관 치근단 X-ray"},{date:"2026-07-18", label:"#36 초진 파노라마"}] },
  "P-0871": { points:2100, grade:"일반", packages:[],
    photos:[{date:"2026-06-20", label:"#25 레진 수복 전후"}] },
  "P-1156": { points:800, grade:"일반", packages:[{name:"스케일링 정기(연1회)", total:1, used:1, expire:"2026-12-31"}],
    photos:[] },
  "P-0233": { points:34500, grade:"VIP", packages:[{name:"임플란트 2본 분납", total:2, used:1, expire:"2027-08-14"},{name:"교정 유지 관찰", total:12, used:3, expire:"2028-08-14"}],
    photos:[{date:"2026-08-14", label:"#46 발치 전 파노라마"},{date:"2026-08-14", label:"임플란트 식립 계획 CT"}] }
};
