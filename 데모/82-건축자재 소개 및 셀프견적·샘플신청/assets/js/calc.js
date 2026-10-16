/* ARGILO 셀프견적 계산 엔진 — 공개 셀프견적과 관리자 「계산 미리보기」가 같은 함수를 쓴다.
   근거: 분석/_리서치_원자료.md 7-2 (순 면적 → 줄눈 포함 모듈 면적 → 패턴 로스 → 올림 → 박스 → 남는 장수 → 부자재 → 판 배치 참고 → 방화 플래그)
   모든 수치는 제품 데이터(variants / rule)에서 온다. 코드에 박힌 상수는 '검증 임계값'뿐이다. */
(function (global) {
  'use strict';

  const EPS = 1e-9;
  const round = (v, d) => { const p = Math.pow(10, d); return Math.round(v * p) / p; };

  /** 패턴 라벨 */
  const PATTERNS = {
    straight:    { label: '일자(정형)',   hint: '판을 같은 줄에 맞춰 붙임' },
    offset:      { label: '엇갈림',       hint: '반 장씩 어긋나게 붙임' },
    herringbone: { label: '헤링본·사선', hint: '45° 또는 V자 — 재단 손실이 큼' },
    curve:       { label: '곡면·기둥',    hint: '감싸기 시공 — 현장 실측 확정 권장' }
  };

  const LOCATIONS = {
    interior: { label: '실내 벽',  joint: 'gIn',  exterior: false },
    bath:     { label: '욕실·습식', joint: 'gIn',  exterior: false },
    exterior: { label: '외벽',      joint: 'gOut', exterior: true }
  };

  /** 외벽 방화마감 의무 판정 (건축법 시행령 제61조② — 3층 이상 또는 높이 9m 이상, 특정 용도) */
  function fireReview(bld) {
    if (!bld) return { required: false, reasons: [] };
    const reasons = [];
    if ((bld.floors || 0) >= 3) reasons.push('3층 이상');
    if ((bld.height || 0) >= 9) reasons.push('높이 9m 이상');
    if (bld.useSpecial) reasons.push('의료·교육연구·노유자·수련시설 등 해당 용도');
    if (bld.overlay) reasons.push('기존 외벽 위 덧붙임(대수선·실물모형시험 검토)');
    return { required: reasons.length > 0, reasons };
  }

  /**
   * 계산
   * @param {object} p  제품 { variants:[{id,w,h,perBox,m2Box}], rule:{gIn,gOut,loss:{...},adhesive:{min,max,bag}}, estimable }
   * @param {object} input {
   *   variantId, location:'interior'|'bath'|'exterior', pattern:'straight'|..,
   *   walls:[{w,h}] (m), openings:[{w,h,qty}] (m), building:{floors,height,useSpecial,overlay},
   *   lossOverride(%) 선택, openingMin(㎡) 선택
   * }
   */
  function estimate(p, input) {
    const warnings = [], errors = [];
    if (!p) return { ok: false, errors: ['제품을 선택해 주세요.'] };
    if (p.estimable === false) return { ok: false, errors: ['이 제품은 셀프견적 대상이 아닙니다. 도입 상담으로 안내됩니다.'] };
    const v = (p.variants || []).find(x => x.id === input.variantId) || (p.variants || [])[0];
    if (!v) return { ok: false, errors: ['판형 정보가 없습니다. 관리자에서 판형을 등록해 주세요.'] };
    const rule = Object.assign({ gIn: 0, gOut: 2, loss: { straight: 10, offset: 15, herringbone: 20, curve: 15 }, adhesive: { min: 1.5, max: 2.5, bag: 20 } }, p.rule || {});
    const loc = LOCATIONS[input.location] || LOCATIONS.interior;
    const pat = PATTERNS[input.pattern] ? input.pattern : 'straight';

    // 1. 총 면적
    const walls = (input.walls || []).filter(w => w && w.w > 0 && w.h > 0);
    if (!walls.length) errors.push('벽 치수를 한 면 이상 입력해 주세요.');
    walls.forEach((w, i) => {
      if (w.w > 50 || w.h > 50) warnings.push(`벽 ${i + 1}의 치수가 50m를 넘습니다. mm로 입력하지 않으셨는지 확인해 주세요.`);
    });
    const grossParts = walls.map(w => w.w * w.h);
    const gross = grossParts.reduce((a, b) => a + b, 0);

    // 2. 개구부 공제
    const openingMin = input.openingMin != null ? input.openingMin : 0;
    const ops = (input.openings || []).filter(o => o && o.w > 0 && o.h > 0 && (o.qty || 1) > 0);
    let openArea = 0, skipped = 0;
    ops.forEach(o => {
      const a = o.w * o.h;
      if (a < openingMin) { skipped += (o.qty || 1); return; }
      openArea += a * (o.qty || 1);
    });
    if (gross > 0 && openArea > 0.8 * gross) warnings.push('개구부 면적이 벽 면적의 80%를 넘습니다. 입력을 확인해 주세요.');
    if (gross > 0 && openArea >= gross) errors.push('개구부가 벽보다 큽니다.');
    if (errors.length) return { ok: false, errors, warnings };

    // 3. 순 면적
    const net = gross - openArea;

    // 4. 모듈 면적 (줄눈 포함)
    const g = rule[loc.joint] || 0;
    const module = (v.w + g) * (v.h + g) / 1e6;        // ㎡
    const sheetArea = v.w * v.h / 1e6;

    // 5. 로스
    const lossPct = input.lossOverride != null ? Number(input.lossOverride) : (rule.loss[pat] != null ? rule.loss[pat] : 10);
    const withLoss = net * (1 + lossPct / 100);

    // 6. 장수·박스
    const sheets = Math.max(1, Math.ceil(withLoss / module - EPS));
    const perBox = v.perBox || 1;
    const boxes = Math.ceil(sheets / perBox - EPS);
    const leftover = boxes * perBox - sheets;
    const orderArea = boxes * perBox * sheetArea;
    const sheetsNoLoss = Math.ceil(net / module - EPS);

    // 7. 부자재
    const ad = rule.adhesive || {};
    const adhesive = ad.min && ad.max ? {
      kgMin: round(net * ad.min, 1), kgMax: round(net * ad.max, 1),
      bagsMin: ad.bag ? Math.ceil(net * ad.min / ad.bag - EPS) : null,
      bagsMax: ad.bag ? Math.ceil(net * ad.max / ad.bag - EPS) : null, bag: ad.bag || null
    } : null;

    // 8. 판 배치 참고 (대형 판 — 장당 1㎡ 초과)
    let layout = null;
    if (sheetArea > 1) {
      const W = (v.w + g) / 1000, H = (v.h + g) / 1000;
      let total = 0;
      walls.forEach(w => {
        const a = Math.ceil(w.w / W - EPS) * Math.ceil(w.h / H - EPS);
        const b = Math.ceil(w.w / H - EPS) * Math.ceil(w.h / W - EPS);
        total += Math.min(a, b);
      });
      layout = { sheets: total, note: '개구부 미반영 · 벽마다 가로/세로 방향 중 적은 쪽' };
    }

    // 9. 방화 플래그
    const fire = loc.exterior ? fireReview(input.building) : { required: false, reasons: [] };
    if (loc.exterior && !input.building) warnings.push('외벽은 건물 층수·높이에 따라 방화 성능 확인 대상이 될 수 있습니다.');

    // 10. 성적서 상태
    const certs = (p.certsKr || []);
    const extCert = certs.find(c => c.exterior && (!c.validUntil || new Date(c.validUntil) >= new Date()));
    if (loc.exterior && !extCert) warnings.push('이 제품은 외부용 국내 시험성적서가 등록되어 있지 않습니다(확인 중). 외벽 적용은 상담 후 확정됩니다.');

    return {
      ok: true, warnings, errors: [],
      product: { id: p.id, code: p.code, name: p.name, updatedAt: p.updatedAt },
      variant: { id: v.id, w: v.w, h: v.h, perBox, m2Box: v.m2Box, sheetArea: round(sheetArea, 4) },
      location: input.location || 'interior', locationLabel: loc.label,
      pattern: pat, patternLabel: PATTERNS[pat].label,
      joint: g, lossPct,
      area: { gross: round(gross, 2), opening: round(openArea, 2), net: round(net, 2), withLoss: round(withLoss, 2), order: round(orderArea, 2), skippedOpenings: skipped },
      module: round(module, 4),
      sheets, sheetsNoLoss, boxes, leftover, perBox,
      adhesive, layout, fire,
      certExterior: !!extCert,
      snapshot: { v: 1, at: new Date().toISOString(), input: JSON.parse(JSON.stringify(input)), rule: JSON.parse(JSON.stringify(rule)), variant: JSON.parse(JSON.stringify(v)) }
    };
  }

  /** 관리자 판형 저장 검증 — 장수×판 면적과 ㎡/박스가 2% 넘게 다르면 경고(박스 외형을 판 크기로 오입력) */
  function validateVariant(v) {
    const issues = [];
    if (!(v.w > 0 && v.h > 0)) issues.push({ level: 'error', msg: '판 가로·세로는 0보다 커야 합니다.' });
    if (!(Number.isInteger(Number(v.perBox)) && v.perBox > 0)) issues.push({ level: 'error', msg: '박스당 장수는 1 이상의 정수여야 합니다.' });
    if (v.w > 0 && v.h > 0 && v.perBox > 0 && v.m2Box > 0) {
      const calc = v.perBox * v.w * v.h / 1e6;
      const diff = Math.abs(calc - v.m2Box) / v.m2Box;
      if (diff > 0.02) issues.push({ level: 'warn', msg: `장수×판 면적(${round(calc, 2)}㎡)과 입력한 ㎡/박스(${v.m2Box}㎡)가 ${round(diff * 100, 1)}% 다릅니다. 박스 외형 치수를 판 크기로 입력하지 않았는지 확인해 주세요.`, diff: round(diff * 100, 1) });
    }
    return issues;
  }

  function validateRule(rule) {
    const issues = [];
    const loss = rule.loss || {};
    Object.keys(loss).forEach(k => { if (loss[k] < 0 || loss[k] > 50) issues.push({ level: 'error', msg: `로스율(${k})은 0~50% 범위여야 합니다.` }); });
    ['gIn', 'gOut'].forEach(k => { if (rule[k] < 0 || rule[k] > 20) issues.push({ level: 'error', msg: `줄눈(${k})은 0~20mm 범위여야 합니다.` }); });
    return issues;
  }

  /** 운영비 계산기 (관리자 설정) — 무료 한도 대비 사용률. 한도 수치는 settings.freeLimits에서 */
  function opsCost(inp, lim) {
    lim = Object.assign({ requestsPerDay: 100000, d1RowsRead: 5000000, r2GB: 10, pagesFileMiB: 25, mailPerMonth: 3000, paidWorkers: 5 }, lim || {});
    const reqPerDay = (inp.visitsMonth || 0) * (inp.pagesPerVisit || 4) * 2 / 30;      // 페이지+API
    const rowsRead = reqPerDay * 40;
    const photoGB = (inp.casesYear || 0) * (inp.photosPerCase || 10) * (inp.photoMB || 0.3) / 1024;
    const storageGB = photoGB + (inp.pdfGB || 0);
    const mail = (inp.inboxMonth || 0) * 2;
    const pct = {
      requests: round(reqPerDay / lim.requestsPerDay * 100, 1),
      rows: round(rowsRead / lim.d1RowsRead * 100, 1),
      storage: round(storageGB / lim.r2GB * 100, 1),
      mail: round(mail / lim.mailPerMonth * 100, 1)
    };
    const max = Math.max(pct.requests, pct.rows, pct.storage, pct.mail);
    const monthsToPaid = max > 0 && max < 100 ? Math.ceil(12 * 100 / max) : (max >= 100 ? 0 : null);
    return { reqPerDay: Math.round(reqPerDay), rowsRead: Math.round(rowsRead), storageGB: round(storageGB, 2), mail, pct, max, paid: max >= 100, monthlyUSD: max >= 100 ? lim.paidWorkers : 0, monthsToPaid };
  }

  global.ArgiloCalc = { estimate, validateVariant, validateRule, fireReview, opsCost, PATTERNS, LOCATIONS };
})(typeof window !== 'undefined' ? window : globalThis);
