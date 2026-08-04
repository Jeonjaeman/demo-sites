/* PINGUARD 핀가드 — 데모 데이터 (전부 제안용 가상 데이터)
   실제 매입률·거래·계좌·사업자정보가 아닙니다. */
window.PINGUARD = {
  /* 상품권 종류 · 매입률(%)
     mode: auto = 컬처랜드/롯데(자동판별 대상) · manual = 채널톡 상담매입
     소액결제/카드 구매분은 준법상 매입 불가(구매경로 확인 단계에서 차단) */
  giftcards: [
    /* art: 카드 페이스 그라디언트 [상단, 하단] + en 워드마크 — CSS로 직접 그린 가상 카드(실제 브랜드 디자인 아님) */
    { id: "culture",  name: "컬쳐랜드",        en: "CULTURE",  sub: "16핀 · 문화상품권", rate: 92.5, mode: "auto",   trend: "up",   min: 1000, max: 500000,  art: ["#6D6AF0", "#4438CA"] },
    { id: "book",     name: "북앤라이프",      en: "BOOK&LIFE",sub: "도서문화상품권",    rate: 91.0, mode: "auto",   trend: "flat", min: 1000, max: 500000,  art: ["#2FA8E8", "#0B69B4"] },
    { id: "teencash", name: "틴캐시",          en: "TEENCASH", sub: "16핀",              rate: 88.0, mode: "auto",   trend: "down", min: 1000, max: 300000,  art: ["#F5A623", "#C46A08"] },
    { id: "lotte",    name: "롯데모바일상품권", en: "L.MOBILE", sub: "바코드/교환권",     rate: 90.5, mode: "auto",   trend: "up",   min: 1000, max: 500000,  art: ["#F0526E", "#B81C3D"] },
    { id: "happy",    name: "해피머니",        en: "HAPPY",    sub: "18핀",              rate: 87.5, mode: "manual", trend: "flat", min: 1000, max: 500000,  art: ["#FB8A3C", "#C74E10"] },
    { id: "culture-paper", name: "문화상품권(지류)", en: "PAPER", sub: "지류 스캔",      rate: 89.0, mode: "manual", trend: "flat", min: 5000, max: 100000,  art: ["#34B368", "#137A42"] },
    { id: "ssg",      name: "신세계·이마트",    en: "S.MALL",   sub: "모바일교환권",      rate: 84.0, mode: "manual", trend: "down", min: 5000, max: 500000,  art: ["#E8B815", "#96700A"] },
    { id: "starbucks",name: "스타벅스",        en: "COFFEE",   sub: "e카드/기프티콘",    rate: 82.0, mode: "manual", trend: "up",   min: 5000, max: 200000,  art: ["#0FA57E", "#065F46"] },
    { id: "google",   name: "구글기프트카드",  en: "G.PLAY",   sub: "PIN",               rate: 78.0, mode: "manual", trend: "down", min: 10000, max: 500000, art: ["#5E9BF7", "#1D5FD6"] }
  ],

  /* 은행 목록 */
  banks: ["국민","신한","우리","하나","농협","기업","카카오뱅크","토스뱅크","케이뱅크","SC제일","부산","대구"],

  /* 실시간 판매내역 (가상) — 규격(24PIN·라이브콘): 날짜 + 마스킹 이름 + N건 + 금액 + 상태
     status: done 입금완료 / review 검증중 / hold 이상거래 보류 */
  live: [
    { date: "08/04", name: "김*우", gc: "컬쳐랜드 상품권",     count: 1,  amt: 46250,  status: "done" },
    { date: "08/04", name: "이*헌", gc: "롯데모바일 상품권",   count: 1,  amt: 90500,  status: "done" },
    { date: "08/04", name: "박*수", gc: "구글기프트카드",      count: 2,  amt: 234000, status: "review" },
    { date: "08/04", name: "최*정", gc: "컬쳐랜드 상품권",     count: 10, amt: 462500, status: "hold" },
    { date: "08/04", name: "정*훈", gc: "틴캐시 상품권",       count: 1,  amt: 26400,  status: "done" },
    { date: "08/04", name: "강*현", gc: "신세계·이마트 교환권", count: 1,  amt: 42000,  status: "done" },
    { date: "08/04", name: "임*경", gc: "해피머니 상품권",     count: 1,  amt: 87500,  status: "review" },
    { date: "08/03", name: "한*우", gc: "컬쳐랜드 상품권",     count: 5,  amt: 231250, status: "done" },
    { date: "08/03", name: "송*태", gc: "롯데모바일 상품권",   count: 4,  amt: 362000, status: "done" },
    { date: "08/03", name: "황*수", gc: "컬쳐랜드 상품권",     count: 1,  amt: 9250,   status: "done" },
    { date: "08/03", name: "나*균", gc: "북앤라이프 상품권",   count: 1,  amt: 45500,  status: "done" },
    { date: "08/03", name: "차*환", gc: "문화상품권(지류)",    count: 3,  amt: 26700,  status: "done" }
  ],

  /* 공지사항 (가상) — 규격: 제목 + 날짜, 상단 고정 공지 */
  notices: [
    { title: "상품권 매입 이용 안내 — 본인확인(KYC) 절차 안내", date: "08/01", pin: true },
    { title: "2026년 8월 매입 단가표 안내", date: "08/01" },
    { title: "소액결제·신용카드 구매 상품권 매입 불가 안내", date: "07/22", pin: true },
    { title: "이상거래탐지(FDS) 기준 개편 안내", date: "07/15" },
    { title: "심야 시간대(00~05시) 고액 신청 검토 지연 안내", date: "07/08" },
    { title: "상품권 대량 판매 문의 환영", date: "06/30" },
    { title: "고객센터 운영시간 변경 안내", date: "06/21" }
  ],

  /* ★ 준법 진단 — 공고 요구 기능별 위법 신호등 (이 데모의 핵심)
     verdict: pass 준법 / review 조건부·재설계 / block 그대로는 위법 */
  compliance: [
    {
      id: "auto-remit",
      req: "회원가입 없이 즉시 매입대금 자동 송금 (평균 3초)",
      verdict: "block",
      title: "본인확인 없는 즉시 송금은 자금세탁방지 의무 위반",
      law: "특정금융정보법(고객확인의무 KYC/CDD) · 전자금융거래법",
      why: "판매자 본인확인 없이 임의 계좌로 자동 송금하면 대포통장·보이스피싱·불법도박 환전 통로가 됩니다. 대법원은 상품권 매매업으로 가장한 계좌를 도박조직에 제공한 사건을 처벌했습니다(2026 기준 최신 판례).",
      fix: "첫 거래 시 실명·계좌주 일치 확인(KYC)을 통과해야만 송금. 이후 동일 명의 반복 거래는 간소화하되, 이상거래는 자동 보류."
    },
    {
      id: "micropay",
      req: "소액결제·카드로 구매한 상품권도 매입(현금화)",
      verdict: "block",
      title: "소액결제·카드 현금화 알선은 형사처벌 대상",
      law: "정보통신망법 제72조 (3년 이하 징역 또는 3천만원 이하 벌금) · 여신전문금융업법",
      why: "휴대폰 소액결제·신용카드로 구매한 상품권을 현금으로 바꿔주는 것은 '통신과금 현금화(깡)' 알선입니다. 매입업체가 수수료를 받고 알선·대행하면 처벌 대상이 됩니다.",
      fix: "매입 신청 시 '구매 경로' 확인 단계를 넣어 소액결제·카드 구매분은 자동 차단. 본인이 정상 수령·보유한 상품권만 매입."
    },
    {
      id: "pin-scrape",
      req: "컬쳐랜드·롯데 핀번호 자동 등록·잔액 소진(스크래핑/RPA)",
      verdict: "review",
      title: "자동 등록은 발행사 보안에 차단되어 기술적으로 실패",
      law: "발행사 이용약관 위반 · 정보통신망법(자동입력 프로그램) 소지",
      why: "컬쳐랜드는 다중 IP·VPN·반복 접속·매크로를 감지해 계정을 자동 차단하고 본인인증을 요구합니다. 스크래핑 자동화는 곧 계정이 막혀 서비스 자체가 중단되고, 약관 위반 책임이 남습니다.",
      fix: "무단 스크래핑 대신 ①발행사 공식 정산·검증 채널 확보 ②사용자가 직접 등록/양도한 뒤 결과만 검수하는 큐 ③실패 건은 관리자 수동 확인."
    },
    {
      id: "firm-banking",
      req: "판별 성공 시 펌뱅킹으로 매입대금 무인 자동 송금",
      verdict: "review",
      title: "무인 자동 송금은 이상거래 필터 없이 두면 위험",
      law: "특정금융정보법(의심거래보고 STR) · 전자금융거래법",
      why: "무인 송금은 편리하지만, 이상거래(동일 계좌 반복·고액·심야 분할)를 걸러내지 못하면 자금세탁 방조가 됩니다.",
      fix: "KYC 통과 + FDS(이상거래탐지) 통과 건만 자동 송금. 임계값 초과 건은 관리자 검토 큐로 자동 보류하고 필요 시 의심거래보고."
    },
    {
      id: "presale",
      req: "상품권 예약판매·선지급(先지급 후 상품권 수취)",
      verdict: "block",
      title: "예약판매·선지급 구조는 불법 대부(사금융)로 판정",
      law: "대부업법 · 이자제한법",
      why: "먼저 현금을 주고 나중에 상품권으로 이자를 붙여 받는 구조는 '상품권 예약판매'라는 이름의 불법 대부로, 전국 첫 처벌 사례가 나왔습니다.",
      fix: "선지급·이자 구조를 배제하고, 상품권 검증 완료 후 즉시 매입(현금 지급)만 취급."
    },
    {
      id: "rate-display",
      req: "상품권 종류별 실시간 매입률·시세 표시",
      verdict: "pass",
      title: "정상 상품권매매업의 시세 고지 — 준법",
      law: "전자상거래법(표시·광고)",
      why: "발행된 상품권을 할인 매입하며 매입률을 투명하게 고지하는 것은 정상 영업입니다.",
      fix: "매입률·수수료·환불불가 조건을 명확히 표시하고, 최종 지급액을 신청 전에 확정 고지."
    },
    {
      id: "channel-talk",
      req: "그 외 상품권(문화·신세계·스타벅스)은 채널톡 상담 연결",
      verdict: "pass",
      title: "상담 기반 수동 매입 — 준법",
      law: "-",
      why: "자동판별이 어려운 상품권을 상담으로 확인 후 매입하는 것은 문제없습니다.",
      fix: "상담 단계에서도 본인확인·구매경로 확인을 동일하게 적용."
    },
    {
      id: "biz-reg",
      req: "(전제) 사업자 형태·세무 처리",
      verdict: "pass",
      title: "상품권매매업 사업자등록 + 통신판매업 신고 필수",
      law: "부가가치세법(면세) · 전자상거래법(통신판매업 신고)",
      why: "상품권매매업은 부가세 면세(그 외 기타 금융업)로 세금계산서 발급 대상이 아니며, 온라인 판매는 통신판매업 신고가 필수입니다.",
      fix: "사업자등록(상품권매매업) + 통신판매업 신고를 완료하고, 하단에 사업자정보를 표기(본 데모는 가상)."
    }
  ],

  /* FDS 이상거래 룰 (관리자에서 실제 판정) */
  fdsRules: [
    { id: "repeat",  label: "동일 계좌 24시간 내 3건 이상", level: "hold" },
    { id: "high",    label: "1건 300만원 이상 또는 일 누적 500만원 이상", level: "review" },
    { id: "night",   label: "심야(00~05시) 고액 신청", level: "review" },
    { id: "split",   label: "동일 금액 반복(분할 의심)", level: "hold" },
    { id: "newacct", label: "신규 계좌 + 고액 첫 거래", level: "hold" }
  ],

  /* 관리자 주문 시드 (가상) — 핀검증·KYC·FDS·송금 상태 데모용 */
  orders: [
    { id: "P-24815", gc: "컬쳐랜드", face: 50000, rate: 92.5, pins: 1, acct: "국민 04**-**-1234", holder: "김**", kyc: "verified", pin: "ok",   fds: "pass",   status: "paid",     time: "2026-07-30 23:58" },
    { id: "P-24814", gc: "롯데모바일상품권", face: 100000, rate: 90.5, pins: 1, acct: "신한 110-***-4567", holder: "이**", kyc: "verified", pin: "ok", fds: "pass", status: "paid", time: "2026-07-30 23:55" },
    { id: "P-24813", gc: "구글기프트카드", face: 300000, rate: 78.0, pins: 2, acct: "토스뱅크 100-****-8901", holder: "박**", kyc: "pending", pin: "hold", fds: "review", status: "review", time: "2026-07-30 23:51" },
    { id: "P-24812", gc: "컬쳐랜드", face: 500000, rate: 92.5, pins: 10, acct: "카카오뱅크 3333-**-9012", holder: "최**", kyc: "verified", pin: "ok", fds: "hold", status: "hold", time: "2026-07-30 23:47" },
    { id: "P-24811", gc: "틴캐시", face: 30000, rate: 88.0, pins: 1, acct: "농협 302-****-3456", holder: "정**", kyc: "verified", pin: "ok", fds: "pass", status: "ready", time: "2026-07-30 23:44" },
    { id: "P-24810", gc: "신세계·이마트", face: 50000, rate: 84.0, pins: 1, acct: "우리 1002-***-7890", holder: "강**", kyc: "verified", pin: "pending", fds: "pass", status: "review", time: "2026-07-30 23:40" },
    { id: "P-24809", gc: "해피머니", face: 100000, rate: 87.5, pins: 1, acct: "하나 123-******-234", holder: "윤**", kyc: "rejected", pin: "ok", fds: "review", status: "hold", time: "2026-07-30 23:36" }
  ]
};
