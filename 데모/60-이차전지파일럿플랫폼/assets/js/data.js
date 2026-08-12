/* CELLFAB — 상수(버전 관리) · 샘플 데이터 (전부 가상. 실존 기업·인물과 무관)
   실측 레퍼런스: Xometry·Protolabs·CAPA·Fictiv + Prødux(Awwwards SOTD 26.08.09)·Linear·Stripe */
'use strict';
/* CF는 engine.js에서 선언됨 — 중복 선언 금지 */

/* 상수 세트 — 불변 버전 행 (B-1: UPDATE 금지, 새 버전 INSERT) */
CF.CONST_VERSIONS = [
  { version: 'v12', activatedAt: '2026-08-01 09:00', active: true,
    maxWebMm: 300, laneGapMm: 30, edgeTrimMm: 10, mixerMl: 30000, webSpeedMpm: 5, minRunDays: 1,
    rhoAm100: 470, rhoCb100: 195, rhoBd100: 175, rhoSol100: 103,
    amWon1kg: 85000, cbWon1kg: 42000, bdWon1kg: 68000,
    batchFixWon: 1800000, procWonHour: 250000, setupWon: 1500000,
    minOrderM: 200, sheetGapMm: 8,
    cathodeUm: 125, anodeUm: 126, sepUm: 16, fceCathode: 87, fceAnode: 91,
    pouch: { S: { wMm: 50, hMm: 50 }, M: { wMm: 72, hMm: 110 }, L: { wMm: 86, hMm: 130 } },
    cyl: { '18650': { dOutUm: 17500, dInUm: 2000, coatWmm: 58 }, '21700': { dOutUm: 20400, dInUm: 2000, coatWmm: 65 } },
    refundTiers: [
      { minDays: 21, pct: 100, label: 'D-21 이전 — 전액 환불' },
      { minDays: 15, pct: 80, label: 'D-15~20 — 80%' },
      { minDays: 8, pct: 60, label: 'D-8~14 — 60%' },
      { minDays: 0, pct: 20, label: 'D-0~7 — 20%' },
    ],
    refundParts: ['자재 선발주 소모분 (반품 불가 — 주문형 활물질·전용 폭 호일)', '슬롯 기회비용 (재판매 가능성 차감)', '기투입 엔지니어링 시간'],
  },
  { version: 'v11', activatedAt: '2026-06-12 14:00', active: false, amWon1kg: 78000, note: '활물질 단가 인상 전' },
];
CF.CONST = CF.CONST_VERSIONS[0];

/* 원자재 라이브러리 — CoA 8필드 초안 (미확정 #1 가정 제시) */
CF.MATERIALS = [
  { id: 'nmc622', name: 'NMC622 양극 활물질', masked: 'LiNi●Co●Mn●O₂', d50: '10.2µm', tap: '2.4 g/cm³', bet: '0.55 m²/g', ph: '11.2', moist: '210 ppm', purity: '99.9%', cap: '178 mAh/g', press: '3.4 g/cm³' },
  { id: 'lfp', name: 'LFP 양극 활물질', masked: 'LiFe●O₄', d50: '1.1µm', tap: '1.1 g/cm³', bet: '12.8 m²/g', ph: '9.4', moist: '320 ppm', purity: '99.5%', cap: '162 mAh/g', press: '2.4 g/cm³' },
  { id: 'gr', name: '인조흑연 음극재', masked: 'C (synthetic)', d50: '17.5µm', tap: '1.05 g/cm³', bet: '1.4 m²/g', ph: '—', moist: '85 ppm', purity: '99.95%', cap: '352 mAh/g', press: '1.65 g/cm³' },
];

/* 케이스 12상태 (C-4: 진행×결제 2축 분해를 다이어그램으로 설명) */
CF.STATES = ['임시저장', '제출됨', '심사 중', '보완 요청', '승인·인보이스', '입금 대기', '입금 확인', '자재 발주', '자재 입고', '생산 중', '완료', '취소'];
CF.TRANSITIONS = { // from: [허용 to]
  '임시저장': ['제출됨', '취소'], '제출됨': ['심사 중', '취소'], '심사 중': ['승인·인보이스', '보완 요청', '취소'],
  '보완 요청': ['제출됨', '취소'], '승인·인보이스': ['입금 대기'], '입금 대기': ['입금 확인', '취소'],
  '입금 확인': ['자재 발주'], '자재 발주': ['자재 입고'], '자재 입고': ['생산 중'], '생산 중': ['완료'], '완료': [], '취소': [],
};

/* 샘플 케이스 */
CF.CASES = [
  { id: 'CF-2608-014', type: '전극(양극)', title: 'NMC622 양면 250×420m', state: '생산 중', price: 28400000,
    constV: 'v12', engineV: '1.0.0', hash: '7a3f19c2', runDate: '2026-08-19', paid: true, produced: true,
    flag: null, log: [['08-05 10:12', '제출'], ['08-05 14:02', '심사 승인 (회신 3.8h)'], ['08-06 09:30', '입금 확인'], ['08-08', '자재 발주'], ['08-18', '자재 입고'], ['08-19', '생산 착수']] },
  { id: 'CF-2608-017', type: '셀(파우치 M)', title: '5Ah 파우치 시제 40셀', state: '입금 대기', price: 19750000,
    constV: 'v12', engineV: '1.0.0', hash: 'c41b88e0', runDate: '2026-09-08', paid: false, produced: false,
    holdUntil: '2026-08-15 18:00', flag: null, log: [['08-10 16:40', '제출'], ['08-11 09:15', '심사 승인'], ['08-11 09:20', '인보이스 발행']] },
  { id: 'CF-2608-019', type: '전극(양극)', title: 'Ni83 하이니켈 단면 220×300m', state: '심사 중', price: 21900000,
    constV: 'v12', engineV: '1.0.0', hash: '5e02d7aa', runDate: null, paid: false, produced: false,
    flag: '국가핵심기술 검토', log: [['08-12 11:05', '제출 — Ni 함량 80% 초과 자동 플래그']] },
  { id: 'CF-2607-092', type: '전극(음극)', title: '인조흑연 양면 250×600m', state: '완료', price: 24100000,
    constV: 'v11', engineV: '1.0.0', hash: '90ff31b7', runDate: '2026-07-21', paid: true, produced: true,
    flag: null, log: [['07-02', '제출'], ['07-28', '출하 완료']] },
];

/* 심사 큐 (admin) — CAPA 행 문법·개인명 마스킹 */
CF.REVIEW_QUEUE = [
  { id: 'CF-2608-019', firm: '(주)에이치배터리랩', person: '김**', type: '전극(양극)', spec: 'Ni83 · 로딩 22.0mg/cm² · 폭 220mm', submitted: 3.2,
    issues: ['로딩 22.0 — 타당성 상한(20.0) 초과, 수동 판단 필요 (미확정 #2)', 'Ni 함량 83% — 국가핵심기술 플래그 (산업기술보호법 검토)'], flagged: true },
  { id: 'CF-2608-021', firm: '테크노셀 연구소', person: '박**', type: '셀(원통 21700)', spec: '4.8Ah · N/P 1.08', submitted: 6.5,
    issues: ['N/P 1.08 — 권장(1.10) 하회, 리튬 석출 마진 검토'], flagged: false },
  { id: 'CF-2608-022', firm: '(주)그린모빌 소재', person: '이**', type: '전극(양극)', spec: 'LFP · 로딩 14.5 · 폭 260mm·2레인', submitted: 14.1,
    issues: ['2레인 총폭 560mm — 장비 초과, 1레인 분할 제안 첨부됨'], flagged: false },
];

/* 슬롯 캘린더: 라인 3개 — L1·L2는 캘린더 공유(C-2 핵심), L3 독립. 주 단위 5일 블록 */
CF.SLOTS = {
  weeks: ['9/1 주', '9/8 주', '9/15 주', '9/22 주', '9/29 주', '10/6 주'],
  minBookIdx: 2, // 자재 조달 10영업일 + 리드타임 → 9/15 주부터 (G-g)
  lines: [
    { id: 'CAL-A', name: '라인 1+2 (공유 캘린더)', shared: true, booked: [0, 1, 3] },
    { id: 'CAL-B', name: '라인 3 (대면적)', shared: false, booked: [0, 2] },
  ],
  holds: [{ cal: 'CAL-A', week: 4, until: '2026-08-15 18:00', by: '타사 (입금 대기)' }],
};

/* 골든 케이스 (B-4) — 엔진 7종 대표. expected는 초기화 시 실계산으로 고정 후 비교 */
CF.GOLDEN = [
  { engine: '전극 배치', name: '표준 NMC 양면 250×420m', inp: { widthMm: 250, lengthM: 420, sides: 2, loading10: 150, duty: 100, yield: 85, comp: { am: 96, cb: 2, bd: 2 }, solids: 50, lanes: 1 } },
  { engine: '전극 배치', name: '경계: 믹서 용적 딱 1배치', inp: { widthMm: 200, lengthM: 118, sides: 1, loading10: 150, duty: 100, yield: 100, comp: { am: 96, cb: 2, bd: 2 }, solids: 50, lanes: 1 } },
  { engine: '전극 배치', name: '경계: +1m로 배치 증가', inp: { widthMm: 200, lengthM: 119, sides: 1, loading10: 150, duty: 100, yield: 100, comp: { am: 96, cb: 2, bd: 2 }, solids: 50, lanes: 1 } },
  { engine: '전극 배치', name: '간헐 duty 80% 환산', inp: { widthMm: 250, lengthM: 400, sides: 2, loading10: 150, duty: 80, yield: 85, comp: { am: 96, cb: 2, bd: 2 }, solids: 50, lanes: 1 } },
  { engine: '전극 배치', name: '이상: 폭 280mm 2레인 초과', inp: { widthMm: 280, lengthM: 300, sides: 1, loading10: 150, duty: 100, yield: 85, comp: { am: 96, cb: 2, bd: 2 }, solids: 50, lanes: 2 } },
  { engine: '셀 계산', name: '파우치 M 5Ah', inp: { type: 'pouch', model: 'M', capMah: 5000, arealMah100: 270, np100: 110, qty: 40 } },
  { engine: '셀 계산', name: '원통 21700 4.8Ah', inp: { type: 'cyl', model: '21700', capMah: 4800, arealMah100: 300, np100: 110, qty: 100 } },
  { engine: '환불 티어', name: 'D-22 전액', inp: { paid: 10000000, days: 22, produced: false } },
  { engine: '환불 티어', name: 'D-7 경계(20%)', inp: { paid: 10000000, days: 7, produced: false } },
  { engine: '환불 티어', name: '경계: D-8(60%)', inp: { paid: 10000000, days: 8, produced: false } },
  { engine: '환불 티어', name: '생산 착수 후 0%', inp: { paid: 10000000, days: 30, produced: true } },
  { engine: '상태 전이', name: '입금 확인 전 생산 착수 금지', inp: { from: '입금 대기', to: '생산 중' }, expectBlocked: true },
  { engine: '상태 전이', name: '보완 요청 → 재제출 루프', inp: { from: '보완 요청', to: '제출됨' }, expectBlocked: false },
  { engine: '슬롯 잠금', name: '공유 캘린더 중복 차단', inp: { cal: 'CAL-A', week: 0 }, expectBlocked: true },
];

/* CR(변경요청) — F-6 */
CF.CRS = [
  { id: 'CR-03', title: '미확정 #1 — 호일 스키마 확정 반영', impact: '+2일 · 무상 범위', state: '승인' },
  { id: 'CR-04', title: '파우치 L 사이즈 치수 변경', impact: '+1일 · 무상 범위', state: '검토 중' },
  { id: 'CR-05', title: '영문 인보이스 양식 추가', impact: '+3일 · 유상 견적', state: '요청' },
];
CF.CR_BUDGET = { used: 3, total: 10 };
