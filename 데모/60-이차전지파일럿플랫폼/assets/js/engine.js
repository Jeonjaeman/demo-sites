/* CELLFAB — 계산 엔진 (결정적 · 정수 연산)
   원칙: ① 입력 즉시 정수 최소단위 환산(µm·mg·mL·원) 후 정수 연산 — ceil 부동소수 함정(Math.ceil(0.1*60)=7) 회피
        ② 같은 입력 → 항상 같은 출력 (스냅샷: 상수 v + 엔진 v + 입력 해시)
        ③ 참조: 면적용량=로딩×비용량 · 나선 L=π(D²out−D²in)/4t · N/P 1.10 · 초회효율 NMC 85~88% */
'use strict';
const CF = window.CF || (window.CF = {});

CF.ENGINE_VERSION = '1.0.0';

/* 정수 올림 나눗셈 — 부동소수 개입 없음 */
CF.ceilDiv = (a, b) => Math.floor((a + b - 1) / b);

/* 간단 입력 해시 (djb2) — 재현성 배지용 */
CF.hash = obj => {
  const s = JSON.stringify(obj);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
};

/* ── 전극 배치 사이징 (공고 수식 체인 9단계) ──────────────
   in: { widthMm, lengthM, sides(1|2), loading(mg/cm²·소수1), duty(%정수), yield(%정수),
         comp:{am,cb,bd}(합100), solids(%정수), lanes, matId }
   상수는 CF.CONST(활성 버전)에서 — 전 항목 정수 최소단위 */
CF.calcElectrode = function (inp, C) {
  const steps = [];
  // 1. duty → 유효 웹 길이 (m×1000 = mm 정수)
  const coatedMm = inp.lengthM * 1000;
  const webMm = CF.ceilDiv(coatedMm * 100, inp.duty); // duty % 정수
  steps.push({ k: '유효 웹 길이', f: 'L_web = L_coat / duty', v: `${inp.lengthM}m ÷ ${inp.duty}% = ${(webMm / 1000).toFixed(1)}m` });
  // 2. 코팅 면적 (cm² 정수): mm×mm → cm² = /100
  const areaCm2 = Math.round(coatedMm * inp.widthMm * inp.sides / 100);
  steps.push({ k: '코팅 면적', f: 'A = L × W × 면수', v: `${inp.lengthM}m × ${inp.widthMm}mm × ${inp.sides}면 = ${areaCm2.toLocaleString()}cm²` });
  // 3. 활물질 질량 (mg 정수): loading은 mg/cm²×10 정수로 받음
  const amMg = areaCm2 * inp.loading10 / 10;
  steps.push({ k: '활물질 질량', f: 'm_AM = A × loading', v: `${areaCm2.toLocaleString()}cm² × ${(inp.loading10 / 10).toFixed(1)}mg/cm² = ${(amMg / 1e6).toFixed(2)}kg` });
  // 4. 계획수율 반영 (★ G-1: 질량 단계 적용 — 가정, 착수 전 확정 필요)
  const amReqMg = CF.ceilDiv(amMg * 100, inp.yield);
  steps.push({ k: '계획수율 반영', f: 'm_req = m_AM / η', v: `÷ ${inp.yield}% = ${(amReqMg / 1e6).toFixed(2)}kg`, note: 'η 적용 지점은 명세 미정의 — 질량 단계 적용 가정 (G-1)' });
  // 5. 조성비 환산 → 고형분 총량
  const solidMg = CF.ceilDiv(amReqMg * 100, inp.comp.am);
  const cbMg = Math.round(solidMg * inp.comp.cb / 100), bdMg = Math.round(solidMg * inp.comp.bd / 100);
  steps.push({ k: '조성비 환산', f: 'm_solid = m_AM / w_AM', v: `고형분 ${(solidMg / 1e6).toFixed(2)}kg (도전재 ${(cbMg / 1e6).toFixed(2)} · 바인더 ${(bdMg / 1e6).toFixed(2)})` });
  // 6. 슬러리 총량
  const slurryMg = CF.ceilDiv(solidMg * 100, inp.solids);
  steps.push({ k: '슬러리 환산', f: 'm_slurry = m_solid / 고형분', v: `÷ ${inp.solids}% = ${(slurryMg / 1e6).toFixed(2)}kg` });
  // 7. 슬러리 부피 (mL 정수) — 밀도(g/cm³×100 정수)
  const volMl = Math.round(amReqMg / C.rhoAm100 * 100 / 1000) + Math.round(cbMg / C.rhoCb100 * 100 / 1000)
    + Math.round(bdMg / C.rhoBd100 * 100 / 1000) + Math.round((slurryMg - solidMg) / C.rhoSol100 * 100 / 1000);
  steps.push({ k: '슬러리 부피', f: 'V = Σ(mᵢ/ρᵢ)', v: `${(volMl / 1000).toFixed(1)}L` });
  // 8. 배치 수 — 정수 올림 (믹서 작업용적 mL)
  const batches = CF.ceilDiv(volMl, C.mixerMl);
  const headroomMl = batches * C.mixerMl - volMl;
  steps.push({ k: '배치 수', f: 'N = ⌈V / V_mixer⌉ (정수 올림)', v: `⌈${(volMl / 1000).toFixed(1)}L ÷ ${C.mixerMl / 1000}L⌉ = ${batches}배치` });
  // 9. 가격 (원 정수 — KRW minor unit 0)
  const matCost = Math.round(amReqMg * C.amWon1kg / 1e6) + Math.round(cbMg * C.cbWon1kg / 1e6) + Math.round(bdMg * C.bdWon1kg / 1e6);
  const passes = inp.sides; // tandem 2패스 (A-9)
  const procHours = Math.ceil(webMm * passes / 1000 / C.webSpeedMpm / 60);
  const price = matCost + batches * C.batchFixWon + procHours * C.procWonHour + C.setupWon;
  steps.push({ k: '가격 합산', f: '재료비 + 배치고정비×N + 공정비 + 셋업비', v: `${matCost.toLocaleString()} + ${(batches * C.batchFixWon).toLocaleString()} + ${(procHours * C.procWonHour).toLocaleString()} + ${C.setupWon.toLocaleString()} = ${price.toLocaleString()}원` });

  // 폭 판정 (G-9: 레인 + 간격 + 에지 트림 포함)
  const totalWidthMm = inp.widthMm * inp.lanes + C.laneGapMm * (inp.lanes - 1) + C.edgeTrimMm * 2;
  const widthOk = totalWidthMm <= C.maxWebMm;
  const maxLanes = Math.max(1, Math.floor((C.maxWebMm - C.edgeTrimMm * 2 + C.laneGapMm) / (inp.widthMm + C.laneGapMm)));
  return {
    steps, batches, volMl, price, amReqMg, procHours, passes,
    headroomMl, boundary: { low: (batches - 1) * C.mixerMl, high: batches * C.mixerMl },
    width: { totalWidthMm, widthOk, overMm: totalWidthMm - C.maxWebMm, maxLanes },
    slotDays: Math.max(C.minRunDays, Math.ceil(procHours / 8)),
    hash: CF.hash({ inp, cv: C.version, ev: CF.ENGINE_VERSION }),
  };
};

/* ── 셀 계산 (A-4 초회효율 · A-5 N/P · A-6 권취 나선 · A-7 스택) ──
   in: { type('pouch'|'cyl'), model, capMah, arealMah100(mAh/cm²×100), np100(N/P×100), dir('cathode'|'anode') } */
CF.calcCell = function (inp, C) {
  const steps = [];
  const preset = inp.type === 'pouch' ? C.pouch[inp.model] : C.cyl[inp.model];
  let sheets = 0, patternMm = 0, cathodeM = 0;
  if (inp.type === 'pouch') {
    const areaCm2 = Math.round(preset.wMm * preset.hMm / 100);
    steps.push({ k: '유효 면적', f: 'A = W × H', v: `${preset.wMm}×${preset.hMm}mm = ${areaCm2}cm² (가정값 — 미확정 #5)`, warn: true });
    sheets = CF.ceilDiv(inp.capMah * 100, inp.arealMah100 * areaCm2 * 2); // 양면
    steps.push({ k: '양극 시트 수', f: 'N = ⌈용량 / (면적용량×A×2면)⌉', v: `⌈${inp.capMah} ÷ (${(inp.arealMah100 / 100).toFixed(1)}×${areaCm2}×2)⌉ = ${sheets}장` });
    steps.push({ k: '음극 시트 수', f: 'N_anode = N + 1 (양 끝단 음극)', v: `${sheets + 1}장` });
    cathodeM = Math.round(sheets * (preset.hMm + C.sheetGapMm) / 1000 * 100) / 100;
  } else {
    const t = C.cathodeUm + C.anodeUm + 2 * C.sepUm; // 권취 피치 µm
    steps.push({ k: '권취 피치', f: 't = 양극 + 음극 + 2×분리막', v: `${C.cathodeUm}+${C.anodeUm}+2×${C.sepUm} = ${t}µm` });
    patternMm = Math.round(Math.PI * (preset.dOutUm * preset.dOutUm - preset.dInUm * preset.dInUm) / (4 * t) / 1000);
    steps.push({ k: '전극 길이(나선)', f: 'L = π(D²out−D²in)/4t', v: `≈ ${patternMm}mm (내경 ${preset.dInUm / 1000}mm 가정 — 미확정 #5)`, warn: true });
    const areaCm2 = Math.round(patternMm * preset.coatWmm / 100);
    sheets = CF.ceilDiv(inp.capMah * 100, inp.arealMah100 * areaCm2);
    steps.push({ k: '셀당 용량 검산', f: 'cap = 면적용량 × A', v: `${(inp.arealMah100 / 100).toFixed(1)}mAh/cm² × ${areaCm2}cm² 기준 ${sheets}셀 분량` });
    cathodeM = Math.round(patternMm * inp.qty / 1000 * 100) / 100;
  }
  // N/P → 음극 소요 (A-5: 음극이 양극보다 길다/크다)
  const anodeM = Math.round(cathodeM * inp.np100) / 100;
  // 200m 하한 (양·음극 각각 — G-3: 소요량 산출 직후 적용 가정)
  const cathodeOrderM = Math.max(C.minOrderM, Math.ceil(cathodeM));
  const anodeOrderM = Math.max(C.minOrderM, Math.ceil(anodeM));
  steps.push({ k: '전극 소요 (양/음 분리)', f: '음극 = 양극 × N/P', v: `양극 ${cathodeOrderM}m · 음극 ${anodeOrderM}m (N/P ${(inp.np100 / 100).toFixed(2)}, 각 최소 ${C.minOrderM}m 적용)` });
  // 초회효율 (A-4)
  const fce = Math.round(C.fceCathode * C.fceAnode / 100); // %
  const realMah = Math.round(inp.capMah * fce / 100);
  steps.push({ k: '예상 실용량', f: '설계 용량 × 초회효율', v: `${inp.capMah}mAh × ${fce}% = ${realMah}mAh (화성 후)`, warn: true });
  return { steps, sheets, patternMm, cathodeOrderM, anodeOrderM, designMah: inp.capMah, realMah, fce,
    hash: CF.hash({ inp, cv: C.version, ev: CF.ENGINE_VERSION }) };
};

/* ── 환불 티어 (C-5: 기준 = 취소 요청 접수 서버 시각, 첫 예약 런 D-day 역산) ── */
CF.calcRefund = function (paidWon, daysBeforeRun, produced, C) {
  if (produced) return { pct: 0, refund: 0, tier: '생산 착수 후 — 환불 불가', parts: C.refundParts };
  const tier = C.refundTiers.find(t => daysBeforeRun >= t.minDays) || C.refundTiers[C.refundTiers.length - 1];
  return { pct: tier.pct, refund: Math.round(paidWon * tier.pct / 100), tier: tier.label, parts: C.refundParts };
};

/* ── 불변식 검사 (property-based, B-4) ── */
CF.runInvariants = function (C, n = 500) {
  const fails = [];
  let seed = 42;
  const rnd = (a, b) => { seed = (seed * 1103515245 + 12345) % 2147483648; return a + seed % (b - a + 1); };
  for (let i = 0; i < n; i++) {
    const inp = { widthMm: rnd(50, 280), lengthM: rnd(50, 2000), sides: rnd(1, 2), loading10: rnd(50, 250),
      duty: rnd(50, 100), yield: rnd(50, 95), comp: { am: 96, cb: 2, bd: 2 }, solids: rnd(45, 60), lanes: 1 };
    const r = CF.calcElectrode(inp, C);
    // ① 배치 경계: (N-1)×cap < V ≤ N×cap
    if (!((r.batches - 1) * C.mixerMl < r.volMl && r.volMl <= r.batches * C.mixerMl)) fails.push(['배치 경계', inp]);
    // ② 비음수
    if (r.price < 0 || r.batches < 1 || r.volMl < 0) fails.push(['비음수', inp]);
    // ③ 단조성: 길이 +10% → 배치 비감소·가격 비감소
    const r2 = CF.calcElectrode({ ...inp, lengthM: Math.round(inp.lengthM * 1.1) }, C);
    if (r2.batches < r.batches || r2.price < r.price) fails.push(['단조성(길이↑)', inp]);
    // ④ 멱등성: 같은 입력 재계산 동일
    const r3 = CF.calcElectrode(inp, C);
    if (r3.price !== r.price || r3.batches !== r.batches || r3.hash !== r.hash) fails.push(['멱등성', inp]);
  }
  return { n: n * 4, fails };
};
