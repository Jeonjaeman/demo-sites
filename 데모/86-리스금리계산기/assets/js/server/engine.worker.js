/* =====================================================================
 * LEASE TRANSFER LAB — 계산 엔진 (서버 역할)
 * ---------------------------------------------------------------------
 * 공고 요구: "모든 계산 서버 처리 (계산식은 영업기밀로 화면 코드 포함 금지)"
 * 데모는 정적 호스팅이라 서버 대신 이 Web Worker가 같은 API 계약으로 응답한다.
 * 화면 스크립트(start/calc/report/transfer/admin-*.js)에는 계산식이 한 줄도 없고
 * API.post('/api/v1/...')만 호출한다. 실제 구축 시 이 파일은 서버 전용 모듈
 * (Next.js route handler + `server-only`)로 옮겨 브라우저 번들에 포함되지 않는다.
 *
 * ※ 승계 손익·감가율·해지수수료 체감은 데모용 "예시 산식"이다.
 *    발주사 실제 산식·감가율은 NDA 후 이 모듈의 quoteTransfer()만 교체한다.
 * ===================================================================== */
'use strict';

/* ---------- 날짜 ---------- */
function parseDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  return { y: +m[1], m: +m[2], d: +m[3] };
}
function addMonths(base, k) {
  const total = base.y * 12 + (base.m - 1) + k;
  const y = Math.floor(total / 12), m = total % 12 + 1;
  const last = new Date(y, m, 0).getDate();
  return { y, m, d: Math.min(base.d, last) };
}
const fmtDate = (o) => `${o.y}-${String(o.m).padStart(2, '0')}-${String(o.d).padStart(2, '0')}`;

/* ---------- 금리 역산 (IRR) ----------
 * f(r) = PV − Σ pmt·(1+r)^−t − FV·(1+r)^−n
 * 후취(arrears): t = 1..n / 선취(advance): t = 0..n−1
 * 뉴턴법은 초기값에 따라 발산하므로 구간 이분법 + 마지막에 정밀화. */
function npvGap(r, pv, pmt, n, fv, advance) {
  if (Math.abs(r) < 1e-14) return pv - pmt * n - fv;
  const v = 1 / (1 + r);
  let annuity = (1 - Math.pow(v, n)) / r;
  if (advance) annuity *= (1 + r);
  return pv - pmt * annuity - fv * Math.pow(v, n);
}
function solveMonthlyRate(pv, pmt, n, fv, advance) {
  let lo = -0.0833, hi = 0.25; // 연 −100% ~ +300%
  let flo = npvGap(lo, pv, pmt, n, fv, advance), fhi = npvGap(hi, pv, pmt, n, fv, advance);
  if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2, fm = npvGap(mid, pv, pmt, n, fv, advance);
    if (fm === 0) return mid;
    if (fm * flo < 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
    if (hi - lo < 1e-15) break;
  }
  return (lo + hi) / 2;
}

/* ---------- 상환표 ---------- */
/* 실수로 누적하고 표시할 때만 반올림 — 시안 예시(원 단위)와 같은 방식.
 * 회차 행은 이자를 반올림하고 원금 = 납입금 − 이자로 두어 행 합계가 항상 맞는다. */
function buildSchedule({ pv, pmt, n, fv, r, advance, start }) {
  const rows = [];
  let bal = pv;
  for (let k = 1; k <= n; k++) {
    const interestF = advance && k === 1 ? 0 : bal * r;
    bal = bal - (pmt - interestF);
    if (k === n && !advance) bal = fv;   // 마지막 잔금 = 잔존가치(보증금 반영 시 잔존가치 − 보증금)
    const interest = Math.round(interestF);
    rows.push({ no: k, date: fmtDate(addMonths(start, k - 1)), payment: pmt, principal: pmt - interest, interest, balance: Math.round(bal), _p: pmt - interestF, _i: interestF, _b: bal });
  }
  if (advance) {                         // 선취: 마지막 납입 후 1개월 이자가 만기에 붙는다
    const tail = fv - bal;
    rows.push({ no: n + 1, date: fmtDate(addMonths(start, n)), payment: 0, principal: 0, interest: Math.round(tail), balance: Math.round(fv), _p: 0, _i: tail, _b: fv, closing: true });
  }
  let cum = 0;
  rows.forEach((x) => { cum += x._p; x.cumPrincipal = Math.round(cum); });
  return rows;
}
function yearly(rows) {
  const map = new Map();
  rows.forEach((r) => {
    const y = r.date.slice(0, 4);
    const o = map.get(y) || { year: +y, count: 0, _p: 0, _i: 0, _b: 0 };
    if (!r.closing) o.count++;
    o._p += r._p; o._i += r._i; o._b = r._b;
    map.set(y, o);
  });
  return [...map.values()].map((o) => ({ year: o.year, count: o.count, principal: Math.round(o._p), interest: Math.round(o._i), balance: Math.round(o._b) }));
}
const strip = (rows) => rows.map(({ _p, _i, _b, ...rest }) => rest);

/* ---------- 입력 검증 ---------- */
function num(v) { const x = Number(v); return Number.isFinite(x) ? x : NaN; }
function validateLease(b) {
  const errors = {};
  const price = num(b.price), prepay = num(b.prepay || 0), deposit = num(b.deposit || 0), residual = num(b.residual || 0);
  const months = num(b.months), payment = num(b.payment), service = num(b.service || 0);
  if (!(price > 0)) errors.price = '취득원가를 입력해 주세요.';
  else if (price > 2e9) errors.price = '20억 원 이하로 입력해 주세요.';
  if (prepay < 0) errors.prepay = '0원 이상으로 입력해 주세요.';
  if (deposit < 0) errors.deposit = '0원 이상으로 입력해 주세요.';
  if (residual < 0) errors.residual = '0원 이상으로 입력해 주세요.';
  if (price > 0 && residual >= price) errors.residual = '잔존가치는 취득원가보다 작아야 해요.';
  if (price > 0 && prepay + deposit >= price) errors.deposit = '선납금과 보증금 합계가 취득원가보다 커요.';
  if (!(months >= 1 && months <= 120 && Number.isInteger(months))) errors.months = '1~120개월 사이로 입력해 주세요.';
  if (!(payment > 0)) errors.payment = b.type === 'rent' ? '월 렌트료를 입력해 주세요.' : '월 리스료를 입력해 주세요.';
  if (service < 0) errors.service = '0원 이상으로 입력해 주세요.';
  if (payment > 0 && service >= payment) errors.service = '포함 비용이 월 납입금보다 커요.';
  if (!parseDate(b.startDate)) errors.startDate = '시작일을 선택해 주세요.';
  return { errors, v: { price, prepay, deposit, residual, months, payment, service } };
}

/* ---------- 리스·장기렌트 금리 계산 ---------- */
function calcLease(b) {
  const { errors, v } = validateLease(b);
  if (Object.keys(errors).length) return { status: 422, error: { code: 'INVALID_INPUT', fields: errors } };
  const isRent = b.type === 'rent';
  const depositMode = b.depositMode === 'ignore' ? 'ignore' : 'net';   // 기본: 보증금을 실제 현금흐름대로 반영
  const advance = b.timing === 'advance';
  const finPmt = isRent ? v.payment - v.service : v.payment;           // 장기렌트: 포함 비용을 뺀 금융 부분
  const start = parseDate(b.startDate);

  const scenario = (dm, adv, pmt) => {
    const pv = v.price - v.prepay - (dm === 'net' ? v.deposit : 0);
    const fv = v.residual - (dm === 'net' ? v.deposit : 0);
    const r = solveMonthlyRate(pv, pmt, v.months, fv, adv);
    return { pv, fv, r };
  };

  const main = scenario(depositMode, advance, finPmt);
  const totalPaid = v.payment * v.months;
  const finPaid = finPmt * v.months;
  if (main.r === null || finPaid + main.fv < main.pv - 1) {
    const shortfall = Math.round(main.pv - main.fv - finPaid);
    return { status: 422, error: { code: 'PAYMENT_TOO_LOW', message: '입력하신 월 납입금으로는 원금도 다 갚지 못해요.', shortfall: Math.max(shortfall, 0) } };
  }
  const rows = buildSchedule({ pv: main.pv, pmt: finPmt, n: v.months, fv: main.fv, r: main.r, advance, start });
  const totalInterest = Math.round(finPaid + main.fv - main.pv);
  const principalRepaid = Math.round(main.pv - main.fv);
  const residualPay = Math.round(v.residual - v.deposit);               // 만기 인수 시 납부
  const buyTotal = Math.round(totalPaid + Math.max(residualPay, 0) + v.prepay + v.deposit + (residualPay < 0 ? residualPay : 0));

  // 비교값 — 시안 방식(보증금 미반영) · 선취/후취 · 장기렌트 포함 비용 미차감
  const asDesigned = scenario('ignore', false, finPmt);
  const withDeposit = scenario('net', advance, finPmt);
  const withoutDeposit = scenario('ignore', advance, finPmt);
  const other = scenario(depositMode, !advance, finPmt);
  const rentGross = isRent && v.service > 0 ? scenario(depositMode, advance, v.payment) : null;
  const pct = (r) => (r === null ? null : Math.round(r * 12 * 10000) / 100);

  const notes = [];
  if (v.deposit > 0 && depositMode === 'net') notes.push({ code: 'DEPOSIT_NET', text: `보증금 ${v.deposit.toLocaleString('ko-KR')}원을 리스사가 만기까지 무이자로 보유하는 것으로 반영했어요.` });
  if (v.deposit > 0 && depositMode === 'ignore') notes.push({ code: 'DEPOSIT_IGNORED', text: '보증금을 원금에서 빼지 않고 계산했어요. 실제 부담 금리보다 낮게 보일 수 있어요.' });
  if (isRent && v.service === 0) notes.push({ code: 'RENT_SERVICE_UNKNOWN', text: '렌트료에 포함된 보험료·자동차세·정비비를 빼지 않아 금리가 실제보다 높게 보일 수 있어요.' });
  if (pct(main.r) > 20) notes.push({ code: 'RATE_HIGH', text: '연 20%를 넘어요. 입력값(특히 잔존가치·보증금)을 계약서와 한 번 더 맞춰 보세요.' });

  return {
    status: 200,
    data: {
      type: isRent ? 'rent' : 'lease',
      method: depositMode === 'net' ? '월 납입금으로 이율 역산 · 보증금 반영' : '월 납입금으로 이율 역산 · 보증금 미반영',
      timing: advance ? 'advance' : 'arrears',
      rate: pct(main.r),
      monthlyRate: Math.round(main.r * 1e8) / 1e8,
      input: { ...v, startDate: b.startDate, depositMode },
      financed: Math.round(main.pv),
      endBalance: Math.round(main.fv),
      totalPaid, totalInterest, principalRepaid, residualPay, buyTotal,
      servicePaid: isRent ? Math.round(v.service * v.months) : 0,
      share: { principal: Math.round(principalRepaid / finPaid * 1000) / 10, interest: Math.round(totalInterest / finPaid * 1000) / 10 },
      period: { start: rows[0].date, lastPayment: rows[v.months - 1].date, contractEnd: fmtDate(addMonths(start, v.months)) },
      compare: {
        asDesigned: pct(asDesigned.r),          // 시안 방식(보증금 미반영·후취)
        withDeposit: pct(withDeposit.r),        // 현재 납입 시점 기준, 보증금 반영
        withoutDeposit: pct(withoutDeposit.r),  // 현재 납입 시점 기준, 보증금 미반영
        otherTiming: pct(other.r),              // 1회차 납입 시점을 반대로 했을 때
        rentGross: rentGross ? pct(rentGross.r) : null,
      },
      schedule: strip(rows),
      yearly: yearly(rows),
      notes,
    },
  };
}

/* =====================================================================
 * 승계 상담 계산 — 예시 산식 (발주사 산식·감가율로 교체할 부분)
 * ===================================================================== */
const DEPRECIATION = {          // 연 감가율(예시) — 실제 값은 NDA 후 발주사 자료
  'domestic-sedan': 0.155, 'domestic-suv': 0.13, 'import-sedan': 0.19, 'import-suv': 0.165, 'ev': 0.21,
};
const MARKET_RATE = 0.069 / 12;   // 승계인이 새로 리스할 때 시장 금리(예시)
const RETURN_COST = 300000;       // 반납 탁송·평가 비용(예시)
/* 계약 유형별 규칙 — 표준 약관 구조(운용리스 중도 매입가 = 잔여원금 × 110%,
 * 금융리스 규정손해금 = 미회수 채권 × 103%, 금융리스는 중도 반납 불가) · 비율은 리스사별 설정값 */
const KIND = {
  operating: { label: '운용리스', buyout: 1.10, canReturn: true },
  finance: { label: '금융리스', buyout: 1.03, canReturn: false },
  rent: { label: '장기렌트', buyout: 1.08, canReturn: true },
};

function pmtOf(r, n, pv, fv) { // 후취 월 납입금
  if (Math.abs(r) < 1e-12) return (pv - fv) / n;
  const v = Math.pow(1 + r, -n);
  return (pv - fv * v) * r / (1 - v);
}
function pvOf(r, n, pmt) { return Math.abs(r) < 1e-12 ? pmt * n : pmt * (1 - Math.pow(1 + r, -n)) / r; }
const won = (x) => Math.round(x);
const man = (x) => Math.round(x / 10000);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const daysBetween = (a, b) => Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 864e5);
const nowDate = () => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }; };

function quoteTransfer(b) {
  const m = num(b.monthly), k = num(b.remain), D = num(b.deposit || 0), RV = num(b.residual || 0), M = num(b.market);
  const total = num(b.totalMonths) || k;
  const kindKey = KIND[b.leaseKind] ? b.leaseKind : 'operating';
  const kind = KIND[kindKey];
  const errors = {};
  if (!(m > 0)) errors.monthly = '월 납입금을 입력해 주세요.';
  if (!(k >= 1 && k <= 120)) errors.remain = '남은 회차를 입력해 주세요.';
  if (!(M > 0)) errors.market = '현재 시세를 입력해 주세요.';
  if (Object.keys(errors).length) return { status: 422, error: { code: 'INVALID_INPUT', fields: errors } };

  const takeoverTotal = won(m * k + RV);          // 승계 인수 총액 (남은 납입 + 인수가)
  const remainPay = won(m * k);                   // 남은 월 납입 합계
  const contractRate = num(b.contractRate) > 0 ? num(b.contractRate) / 1200 : 0.06 / 12;
  let B = num(b.balance);                         // 잔여 원금(정산서) — 없으면 계약 금리로 추정
  const balanceEstimated = !(B > 0);
  if (balanceEstimated) B = pvOf(contractRate, k, m) + RV * Math.pow(1 + contractRate, -k);
  const buyout = B * kind.buyout;                 // 중도 매입가 = 할부총액(매입 자금)

  // 주행거리 — 약정거리를 일 단위로 환산, 공제 후 초과분 × 단가, 상한 = 잔존가치
  const today = parseDate(b.today) || nowDate();
  const start = parseDate(b.startDate);
  const annual = num(b.annualKm) || 0, cur = num(b.currentKm) || 0, perKm = num(b.perKm) || 0;
  const deduct = b.deductKm === '' || b.deductKm == null ? 500 : num(b.deductKm) || 0;
  const elapsedDays = start ? Math.max(1, daysBetween(start, today)) : Math.max(1, (total - k) * 30.4);
  const totalDays = start ? daysBetween(start, addMonths(start, total)) : total * 30.4;
  const allowedNow = annual * elapsedDays / 365;
  const excessNow = Math.max(0, cur - allowedNow - deduct);
  const pace = cur / elapsedDays;
  const excessEnd = Math.max(0, pace * totalDays - annual * totalDays / 365 - deduct);
  const cap = RV > 0 ? RV : Infinity;
  const mileage = { allowedNow: won(allowedNow), excessNow: won(excessNow), penaltyNow: won(Math.min(excessNow * perKm, cap)), excessAtEnd: won(excessEnd), penaltyAtEnd: won(Math.min(excessEnd * perKm, cap)), capped: excessNow * perKm > cap, deduct };

  // 수수료 ① 리스사 명의변경 (리스: 미회수원금 × 2% × 잔여비율 / 렌트: (잔여렌트료 + 인수가) × 1%, 30만~100만)
  const rawName = kindKey === 'rent' ? (m * k + RV) * 0.01 : B * 0.02 * (k / total);
  const nameFee = won(clamp(rawName, 300000, 1000000));
  const nameFeeClamped = rawName < 300000 ? 'min' : rawName > 1000000 ? 'max' : '';
  // 수수료 ② 중개 수수료 — 기준금액 선택 + 금액 ↔ 율 양방향
  const bases = { takeover: takeoverTotal, remainPay, balance: won(B) };
  const feeBase = bases[b.feeBase] ? b.feeBase : 'takeover';
  const baseAmt = bases[feeBase];
  let fee, feeRate;
  if (b.feeMode === 'rate') { feeRate = num(b.feeRate) || 0; fee = Math.round(baseAmt * feeRate / 100 / 10000) * 10000; }
  else { fee = num(b.fee) || 0; feeRate = baseAmt > 0 ? Math.round(fee / baseAmt * 10000) / 100 : 0; }

  // 처리 방법별 고객 손익 (+ 받는 금액 / − 내는 금액) · 항목 분해
  const salePart = [
    { label: '예상 매각가 (현재 시세)', amount: won(M) },
    { label: `중도 매입가 (잔여 원금 × ${Math.round(kind.buyout * 100)}%)`, amount: -won(buyout) },
  ];
  if (D > 0) salePart.push({ label: '보증금 상계', amount: won(D) });
  const sale = salePart.reduce((s2, x) => s2 + x.amount, 0);

  let ret = null, retParts = null;
  if (kind.canReturn) {
    const termRate = b.termFeeRate === '' || b.termFeeRate == null ? 0.15 : Math.max(0, num(b.termFeeRate)) / 100;
    const termFee = (m * k + RV) * termRate;
    retParts = [{ label: `중도해지수수료 ((잔여 납입 + 잔존가치) × ${Math.round(termRate * 1000) / 10}%)`, amount: -won(termFee) }];
    if (mileage.penaltyNow) retParts.push({ label: '주행거리 초과 위약금', amount: -mileage.penaltyNow });
    retParts.push({ label: '반납 탁송·평가 비용', amount: -RETURN_COST });
    if (D > 0) retParts.push({ label: '보증금 반환', amount: won(D) });
    ret = retParts.reduce((s2, x) => s2 + x.amount, 0);
  }

  const fairPmt = pmtOf(MARKET_RATE, k, M, Math.min(RV, M));
  const premiumPV = pvOf(MARKET_RATE, k, m - fairPmt);
  const trParts = [{ label: premiumPV > 0 ? '인수자 지원금 (월 납입이 시세보다 높은 만큼)' : '인수자에게 받는 인수금', amount: -won(premiumPV) }];
  if (D > 0) trParts.push({ label: '보증금 회수 (인수자에게서)', amount: won(D) });
  if (mileage.penaltyNow) trParts.push({ label: '초과 주행 보전 (인수자 부담분)', amount: -mileage.penaltyNow });
  trParts.push({ label: '리스사 명의변경 수수료', amount: -nameFee });
  if (fee) trParts.push({ label: '승계 중개 수수료', amount: -fee });
  const transfer = trParts.reduce((s2, x) => s2 + x.amount, 0);

  const methods = [
    { key: 'sale', label: '즉시 판매', amount: won(sale), kind: sale >= 0 ? '인수금' : '지원금', parts: salePart, available: true },
    { key: 'return', label: '차량 반납', amount: ret == null ? null : won(ret), kind: '고객 부담', parts: retParts, available: kind.canReturn, reason: kind.canReturn ? '' : '금융리스는 약관상 중도 반납이 불가하고 매입만 가능해요.' },
    { key: 'transfer', label: '일반 승계', amount: won(transfer), kind: transfer >= 0 ? '인수금' : '지원금', parts: trParts, available: true },
  ];
  const recommend = methods.filter((x) => x.available).reduce((a, c) => (c.amount > a.amount ? c : a)).key;

  // 승계 심사 기한 — 만기 5주 전까지 심사 완료(리스사 공통 안내 기준, 설정값)
  let deadline = null;
  if (start) {
    const end = addMonths(start, total);
    const endUtc = Date.UTC(end.y, end.m - 1, end.d) - 35 * 864e5;
    const dd = new Date(endUtc);
    deadline = { date: `${dd.getUTCFullYear()}-${String(dd.getUTCMonth() + 1).padStart(2, '0')}-${String(dd.getUTCDate()).padStart(2, '0')}`, daysLeft: Math.round((endUtc - Date.UTC(today.y, today.m - 1, today.d)) / 864e5) };
  }

  // 미래 승계시점 예상 가격 — 지금 ~ 마지막 회차, 즉시 판매 기준 손익(만원)
  const dep = DEPRECIATION[b.segment] ?? DEPRECIATION['domestic-sedan'];
  const r = solveMonthlyRate(B, m, k, RV, false) ?? contractRate;
  const forecast = [];
  let bal = B;
  for (let t = 0; t <= k; t++) {
    if (t > 0) bal = bal * (1 + r) - m;
    const mt = M * Math.pow(1 - dep, t / 12);
    const premium = 1 + (kind.buyout - 1) * (k - t) / k;   // 중도 매입 할증은 남은 기간에 비례해 줄어든다(예시)
    const value = t === k ? mt - (RV - D) : mt - (bal * premium - D);
    const dt = addMonths(today, t);
    forecast.push({ t, value: man(value), label: `${String(dt.y).slice(2)}.${String(dt.m).padStart(2, '0')}` });
  }

  return {
    status: 200,
    data: {
      leaseKind: kindKey, leaseKindLabel: kind.label,
      takeoverTotal, remainPay, installmentTotal: won(buyout), buyout: won(buyout), balance: won(B), balanceEstimated,
      nameFee, nameFeeClamped, fee, feeRate, feeBase, feeBaseAmount: baseAmt,
      mileage, methods, recommend, deadline,
      forecast,
      fairMonthly: won(fairPmt), monthlyGap: won(m - fairPmt),
    },
  };
}

/* ---------- 장기렌트 포함 비용 추정 (예시) ----------
 * 렌트료 = 차량 금융 + 보험료 + 자동차세(영업용) + 정비. 금리 역산 전에 금융 외 비용을 빼야 한다. */
function rentService(b) {
  const price = num(b.price) || 0;
  const insurance = Math.round((780000 + price * 0.0095) / 12 / 1000) * 1000;   // 연 보험료 추정 ÷ 12
  const tax = Math.round(((num(b.cc) || 1998) * 19 * 1.3) / 12 / 100) * 100;     // 영업용 cc당 19원 + 지방교육세
  const maintenance = b.maintenance === false ? 0 : 20000;
  return { status: 200, data: { monthly: insurance + tax + maintenance, breakdown: { insurance, tax, maintenance } } };
}

/* ---------- 라우터 ---------- */
const routes = {
  'POST /api/v1/calc/lease': calcLease,
  'POST /api/v1/calc/transfer': quoteTransfer,
  'POST /api/v1/calc/rent-service': rentService,
};
self.onmessage = (e) => {
  const { id, method, path, body } = e.data;
  const fn = routes[`${method} ${path}`];
  let res;
  try { res = fn ? fn(body || {}) : { status: 404, error: { code: 'NOT_FOUND' } }; }
  catch (err) { res = { status: 500, error: { code: 'INTERNAL', message: String(err && err.message || err) } }; }
  self.postMessage({ id, ...res });
};
