/* =====================================================================
   GREENDESK 그린데스크 — 교사 전용 B2B 견적·주문 데모
   data.js : 공용 데이터 모델 + 계산 엔진 + 샘플 시드 (localStorage 공유)
   ---------------------------------------------------------------------
   · index.html(교사)과 admin.html(관리자)이 같은 origin에서 이 파일을
     공유하여, 한쪽에서 바꾼 상태(승인/발행/주문)가 다른 쪽에 즉시 반영됨.
   · 모든 데이터는 가상입니다. 실제 사업자·인물·연락처가 아닙니다.
   ===================================================================== */
(function (global) {
  'use strict';

  /* ---------- 발행처(가상) ---------- */
  const ISSUER = {
    company: '(주)초록순환교육',
    ceo: '한지수',
    bizno: '215-88-01924',                 // 가상
    addr: '서울특별시 성동구 성수이로 24, 3층',
    tel: '02-6925-4849',
    email: 'b2b@chorok-edu.example',
    brand: 'GREENDESK'
  };

  /* ---------- 교구 카탈로그(단가) ---------- */
  const PRODUCTS = [
    { id: 'sea-wallet',    name: '바다 지갑 KIT',            unit: '개',   price: 12000, group: '신규 교구' },
    { id: 'paper-gacha',   name: '페이퍼 가챠',              unit: '개',   price: 8000,  group: '신규 교구' },
    { id: 'energy-theater',name: '미래 에너지 페이퍼 씨어터', unit: '개',   price: 15000, group: '신규 교구' },
    { id: 'jean-pouch',    name: '청바지 업사이클 파우치',    unit: '개',   price: 9000,  group: '청바지 4종' },
    { id: 'jean-pen',      name: '청바지 필통',              unit: '개',   price: 11000, group: '청바지 4종' },
    { id: 'jean-tote',     name: '청바지 미니 토트',          unit: '개',   price: 13000, group: '청바지 4종' },
    { id: 'jean-coaster',  name: '청바지 코스터 세트',        unit: '세트', price: 10000, group: '청바지 4종' },
    { id: 'cap-board',     name: '병뚜껑 아트보드',           unit: '개',   price: 7000,  group: '병뚜껑 2종' },
    { id: 'cap-magnet',    name: '병뚜껑 자석 KIT',           unit: '개',   price: 6000,  group: '병뚜껑 2종' }
  ];

  /* ---------- 출강 클래스(수업) ---------- */
  const CLASSES = [
    { id: 'cls-sea',    name: '해양 업사이클 클래스',        material: 'sea-wallet',     minutes: 80 },
    { id: 'cls-energy', name: '친환경 미래 에너지 클래스',   material: 'energy-theater', minutes: 90 },
    { id: 'cls-jean',   name: '청바지 업사이클 클래스',      material: 'jean-pouch',     minutes: 80 }
  ];

  /* ---------- 인원 구간별 강사비 규칙 (15명당 강사 1인) ---------- */
  const FEE_TIERS = [
    { min: 1,  max: 15, teachers: 1, fee: 250000 },
    { min: 16, max: 30, teachers: 2, fee: 480000 },
    { min: 31, max: 45, teachers: 3, fee: 690000 },
    { min: 46, max: 60, teachers: 4, fee: 880000 }
  ];

  /* ---------- 출강 지역 교통비 ---------- */
  const REGIONS = [
    { id: 'seoul',   name: '서울·경기',        travel: 0 },
    { id: 'incheon', name: '인천·충청·강원',   travel: 50000 },
    { id: 'far',     name: '그 외 지역',        travel: 100000 }
  ];

  /* ---------- 정책 상수 ---------- */
  const POLICY = {
    vatRate: 0.10,
    shipping: 30000,          // 교구 주문 배송비
    shippingFreeOver: 300000, // 공급가 이상이면 배송 무료
    partnerDiscount: 0.05,    // 협약기관 할인율
    qtyDiscountTiers: [       // 교구 총수량 기준 수량 할인
      { minQty: 100, rate: 0.10 },
      { minQty: 50,  rate: 0.05 }
    ]
  };

  const INSTITUTES = ['어린이집', '유치원', '초등학교', '중학교', '고등학교'];

  /* ===================================================================
     유틸
     =================================================================== */
  const won = (n) => (Math.round(n) || 0).toLocaleString('ko-KR') + '원';
  const num = (n) => (Math.round(n) || 0).toLocaleString('ko-KR');
  const pad = (n, w) => String(n).padStart(w, '0');

  function today() { return new Date(); }
  function ymd(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); }
  function ymdhm(d) { d = d || new Date(); return ymd(d) + ' ' + pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2); }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function uid(prefix) { return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  const product = (id) => PRODUCTS.find(p => p.id === id);
  const klass = (id) => CLASSES.find(c => c.id === id);
  const region = (id) => REGIONS.find(r => r.id === id) || REGIONS[0];

  function feeTier(headcount) {
    const t = FEE_TIERS.find(t => headcount >= t.min && headcount <= t.max);
    return t || null; // null이면 61명 이상 → 별도 협의
  }

  /* ===================================================================
     견적 계산 엔진
     input:
       { type:'goods'|'class',
         lines:[{productId, qty}],            // goods
         classId, headcount, regionId,        // class
         partner:bool }
     output: 상세 계산 결과 객체
     =================================================================== */
  function calcQuote(input) {
    const partner = !!input.partner;
    const detail = [];      // 표시용 라인 [{label, qty, unit, unitPrice, amount}]
    let supply = 0;
    let goodsQty = 0;
    let note = '';

    if (input.type === 'class') {
      const c = klass(input.classId);
      const n = Math.max(0, parseInt(input.headcount, 10) || 0);
      const r = region(input.regionId);
      const tier = feeTier(n);

      if (c && n > 0 && tier) {
        const mat = product(c.material);
        const feeAmt = tier.fee;
        const matAmt = mat.price * n;
        const travelAmt = r.travel;
        detail.push({ label: c.name + ' 강사비 (' + tier.teachers + '인 · ' + n + '명)', qty: 1, unit: '식', unitPrice: feeAmt, amount: feeAmt });
        detail.push({ label: '재료비 · ' + mat.name, qty: n, unit: '명', unitPrice: mat.price, amount: matAmt });
        if (travelAmt > 0) detail.push({ label: '출강 교통비 · ' + r.name, qty: 1, unit: '식', unitPrice: travelAmt, amount: travelAmt });
        supply = feeAmt + matAmt + travelAmt;
      } else if (c && n > 60) {
        note = '61명 이상은 별도 협의가 필요합니다. 관리자에게 문의해 주세요.';
      }
    } else { // goods
      (input.lines || []).forEach(function (ln) {
        const p = product(ln.productId);
        const q = Math.max(0, parseInt(ln.qty, 10) || 0);
        if (p && q > 0) {
          detail.push({ label: p.name, qty: q, unit: p.unit, unitPrice: p.price, amount: p.price * q });
          supply += p.price * q;
          goodsQty += q;
        }
      });
      // 배송비
      if (supply > 0) {
        const ship = supply >= POLICY.shippingFreeOver ? 0 : POLICY.shipping;
        detail.push({ label: '배송비' + (ship === 0 ? ' (무료)' : ''), qty: 1, unit: '식', unitPrice: ship, amount: ship, muted: true });
        supply += ship;
      }
    }

    // 할인 계산 (배송비 제외한 물품/서비스 공급가에만 적용)
    const discountBase = detail.filter(d => !d.muted && !/배송비/.test(d.label)).reduce((s, d) => s + d.amount, 0);
    let discountRate = 0;
    const discountReasons = [];
    if (partner) { discountRate += POLICY.partnerDiscount; discountReasons.push('협약기관 5%'); }
    if (input.type === 'goods') {
      const qt = POLICY.qtyDiscountTiers.find(t => goodsQty >= t.minQty);
      if (qt) { discountRate += qt.rate; discountReasons.push('수량 ' + qt.minQty + '개↑ ' + Math.round(qt.rate * 100) + '%'); }
    }
    const discount = Math.round(discountBase * discountRate);

    const taxBase = supply - discount;          // 과세표준
    const vat = Math.round(taxBase * POLICY.vatRate);
    const total = taxBase + vat;

    return {
      type: input.type, detail: detail,
      goodsQty: goodsQty,
      supply: supply, discount: discount, discountRate: discountRate, discountReasons: discountReasons,
      taxBase: taxBase, vat: vat, total: total, note: note,
      valid: supply > 0,
      meta: input.type === 'class'
        ? { classId: input.classId, headcount: input.headcount, regionId: input.regionId, partner: partner }
        : { lines: input.lines, partner: partner }
    };
  }

  /* ===================================================================
     저장소 (localStorage)
     =================================================================== */
  const KEY = 'greendesk_v1';

  function fresh() {
    const now = new Date();
    const d = (off) => ymd(addDays(now, off));

    // 회원
    const members = [
      { id: 'm-kim',  name: '김민서', inst: '유치원',   org: '햇살유치원',      grade: '만 5세반', tel: '010-2201-3388', email: 'kim@haetsal.example', status: '승인',   bizfile: '햇살유치원_고유번호증.pdf', joinedAt: d(-40), approvedAt: d(-39) },
      { id: 'm-lee',  name: '이도현', inst: '초등학교', org: '푸른초등학교',    grade: '3학년',    tel: '010-4412-7781', email: 'lee@pureun.example',  status: '승인',   bizfile: '푸른초_고유번호증.pdf',    joinedAt: d(-25), approvedAt: d(-24) },
      { id: 'm-park', name: '박서연', inst: '어린이집', org: '새싹어린이집',    grade: '누리 7세', tel: '010-3345-9902', email: 'park@saesac.example', status: '승인대기', bizfile: '새싹어린이집_고유번호증.jpg', joinedAt: d(-2) },
      { id: 'm-choi', name: '최지우', inst: '중학교',   org: '한들중학교',      grade: '2학년',    tel: '010-7788-1120', email: 'choi@handeul.example',status: '승인대기', bizfile: '한들중_고유번호증.pdf',    joinedAt: d(-1) },
      { id: 'm-jung', name: '정하准', inst: '고등학교', org: '미래고등학교',    grade: '1학년',    tel: '010-9910-2231', email: 'jung@miraehs.example',status: '반려',   bizfile: '미래고_서류.png', rejectReason: '고유번호증이 아닌 다른 서류가 첨부되어 반려되었습니다.', joinedAt: d(-6), approvedAt: d(-5) }
    ];
    members[4].name = '정하준';

    // 견적서 (회차 보존 구조: parentNo로 묶고 rev로 회차)
    const quotes = [];
    const orders = [];

    // 샘플 견적: 김민서 - 출강 수업, 1차→수정요청→2차 확정
    const q1base = calcQuote({ type: 'class', classId: 'cls-sea', headcount: 24, regionId: 'seoul', partner: false });
    const no1 = 'Q-2026-0001';
    quotes.push(mkQuote(no1, 1, 'm-kim', q1base, '확정', d(-20), '재발행됨: 인원 24→28명 정정 요청'));
    const q1b = calcQuote({ type: 'class', classId: 'cls-sea', headcount: 28, regionId: 'seoul', partner: false });
    quotes.push(mkQuote(no1, 2, 'm-kim', q1b, '확정', d(-19)));

    // 샘플 견적: 이도현 - 교구 주문 1차 발행(확정) → 주문 생성됨
    const q2 = calcQuote({ type: 'goods', lines: [{ productId: 'energy-theater', qty: 40 }, { productId: 'paper-gacha', qty: 40 }], partner: true });
    const no2 = 'Q-2026-0002';
    quotes.push(mkQuote(no2, 1, 'm-lee', q2, '확정', d(-12)));

    // 샘플 견적: 김민서 - 교구 주문 1차 발행(발행 상태, 미확정)
    const q3 = calcQuote({ type: 'goods', lines: [{ productId: 'jean-pouch', qty: 20 }, { productId: 'cap-board', qty: 20 }], partner: false });
    const no3 = 'Q-2026-0003';
    quotes.push(mkQuote(no3, 1, 'm-kim', q3, '1차 발행', d(-3)));

    // 주문: 이도현 교구주문 → 진행중/청구완료/미결제
    orders.push({
      id: 'O-2026-0001', quoteNo: no2, rev: 1, memberId: 'm-lee', kind: '교구 주문',
      summary: '미래 에너지 페이퍼 씨어터 40 · 페이퍼 가챠 40',
      amount: q2.total,
      ship: { addr: '경기도 수원시 팔달구 창룡대로 123 푸른초등학교 교무실', roster: '3학년_명단_80.xlsx' },
      status: '진행중',
      billed: true, billMethod: '세금계산서', billDate: d(-10),
      paid: false, paidDate: '',
      createdAt: d(-11)
    });
    // 주문: 김민서 출강 → 완료/청구완료/결제완료
    orders.push({
      id: 'O-2026-0002', quoteNo: no1, rev: 2, memberId: 'm-kim', kind: '수업 예약',
      summary: '해양 업사이클 클래스 · 28명 · 6/14(토)',
      amount: q1b.total,
      ship: { addr: '서울 강남구 햇살유치원 강당', roster: '만5세_참여명단.pdf' },
      status: '완료',
      billed: true, billMethod: '카드', billDate: d(-16),
      paid: true, paidDate: d(-15),
      createdAt: d(-18)
    });

    function mkQuote(no, rev, memberId, calc, status, dateStr, memo) {
      return {
        no: no, rev: rev, docNo: no + '-' + rev, memberId: memberId,
        type: calc.type, calc: calc,
        status: status, issuedAt: dateStr, validUntil: ymd(addDays(new Date(dateStr), 14)),
        memo: memo || '', sent: true
      };
    }

    return {
      seq: { quote: 3, order: 2 },
      members, quotes, orders,
      // 편집 가능한 단가/규칙 (관리자 단가 기준 화면에서 수정 → calc에 반영)
      products: JSON.parse(JSON.stringify(PRODUCTS)),
      feeTiers: JSON.parse(JSON.stringify(FEE_TIERS)),
      session: { memberId: null, admin: false }
    };
  }

  function load() {
    let db;
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db || !db.members) { db = fresh(); save(db); }
    return db;
  }
  function save(db) { localStorage.setItem(KEY, JSON.stringify(db)); }
  function reset() { localStorage.removeItem(KEY); return load(); }

  /* ---------- 라운드 직인 SVG (문서에 합성) ---------- */
  function sealSVG(size) {
    size = size || 96;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="직인">' +
      '<circle cx="50" cy="50" r="47" fill="none" stroke="#c62828" stroke-width="3"/>' +
      '<circle cx="50" cy="50" r="38" fill="none" stroke="#c62828" stroke-width="1.4"/>' +
      '<text x="50" y="34" text-anchor="middle" font-family="serif" font-size="12" fill="#c62828" font-weight="700">초록순환</text>' +
      '<text x="50" y="52" text-anchor="middle" font-family="serif" font-size="12" fill="#c62828" font-weight="700">교육 직인</text>' +
      '<text x="50" y="70" text-anchor="middle" font-family="serif" font-size="8.5" fill="#c62828">GREENDESK</text>' +
      '</svg>';
  }

  /* ---------- export ---------- */
  global.GD = {
    ISSUER, PRODUCTS, CLASSES, FEE_TIERS, REGIONS, POLICY, INSTITUTES,
    won, num, pad, today, ymd, ymdhm, addDays, uid,
    product, klass, region, feeTier, calcQuote,
    load, save, reset, sealSVG,
    KEY
  };
})(window);
