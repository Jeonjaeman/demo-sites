/* =====================================================================
   QWALL 큐월 — 수입검사실 품질 대시보드 데모
   data.js : 결정적 데이터 생성 + 14 KPI 계산 엔진 + ETL 통합(중복제거) 로직
   ---------------------------------------------------------------------
   · 데이터는 시드 RNG로 결정적으로 생성 → 새로고침해도 수치가 안 흔들림.
   · ERP(수입/완성검사)·QMS(부적합)·엑셀(ITP) 3개 소스를 통합.
   · 모든 데이터는 가상입니다. 실제 업체·설비·금액이 아닙니다.
   ===================================================================== */
(function (global) {
  'use strict';

  /* ---------- 시드 RNG (결정적) ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------- 마스터 데이터 ---------- */
  var SUPPLIERS = [
    { id: 'S01', name: '대성정밀' }, { id: 'S02', name: '한빛금속' }, { id: 'S03', name: '동방소재' },
    { id: 'S04', name: '금강공업' }, { id: 'S05', name: '신우테크' }, { id: 'S06', name: '우진기전' },
    { id: 'S07', name: '태ان단조' }, { id: 'S08', name: '協進코팅' }
  ];
  SUPPLIERS[6].name = '태안단조'; SUPPLIERS[7].name = '협진코팅';

  var DEVICES = [
    { id: 'D1', name: '용접기 A라인' }, { id: 'D2', name: '프레스 2호' }, { id: 'D3', name: '도장부스' },
    { id: 'D4', name: 'CNC 가공기' }, { id: 'D5', name: '조립 3라인' }, { id: 'D6', name: '표면처리조' }
  ];
  var TYPES = ['원소재', '가공', '용접', '도장', '조립', '표면처리'];
  var CAUSES = ['자재불량', '작업자', '설비', '설계', '측정오차'];
  var DISPOSITIONS = ['재작업', '폐기', '반품', '특채'];

  /* ---------- 기본 설정(운영 콘솔에서 편집) ---------- */
  function defaultSettings() {
    return {
      dedup: true,        // ERP-QMS 오더 매핑으로 중복 제거
      codeUnify: true,    // ERP/QMS 부적합 유형 코드 통일
      cost: { '재작업': 80000, '폐기': 150000, '반품': 50000, '특채': 20000 }, // 처분별 단가(원)
      viewers: ['kim.qc', 'lee.qa', 'park.ops'] // 열람 허용 계정
    };
  }

  /* ---------- 데이터 생성 (2025-01 ~ 2026-07) ---------- */
  function generate() {
    var rnd = mulberry32(20260728);
    var pick = function (arr) { return arr[Math.floor(rnd() * arr.length)]; };
    var wpick = function (arr, w) { // 가중 선택
      var s = w.reduce(function (a, b) { return a + b; }, 0), r = rnd() * s;
      for (var i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1];
    };
    var records = [];
    var seq = 0;
    var months = [];
    for (var y = 2025; y <= 2026; y++) {
      for (var m = 1; m <= 12; m++) {
        if (y === 2026 && m > 7) break;
        months.push([y, m]);
      }
    }
    months.forEach(function (ym) {
      var year = ym[0], mon = ym[1];
      var base = 30 + Math.floor(rnd() * 16);         // 월 검사 건수
      // 2026는 개선 추세(부적합률 하락)
      var defectRate = (year === 2026 ? 0.055 : 0.085) + (rnd() - 0.5) * 0.02;
      for (var i = 0; i < base; i++) {
        var day = 1 + Math.floor(rnd() * 27);
        var date = year + '-' + pad(mon, 2) + '-' + pad(day, 2);
        var supplier = wpick(SUPPLIERS.map(function (s) { return s.id; }), [22, 18, 15, 12, 10, 9, 8, 6]);
        var device = pick(DEVICES).id;
        var stage = rnd() < 0.72 ? '수입' : '공정';
        var isDefect = rnd() < (stage === '공정' ? defectRate * 1.25 : defectRate);
        var type = wpick(TYPES, [28, 22, 16, 14, 12, 8]);
        var cause = wpick(CAUSES, [30, 22, 20, 14, 14]);
        var rec = {
          id: 'R' + (++seq),
          date: date, year: year, month: mon,
          supplierId: supplier, deviceId: device,
          stage: stage, type: type, cause: cause,
          result: isDefect ? '부적합' : '합격',
          sOrder: 'SO-' + year + '-' + pad(seq, 4),
          fOrder: '', sources: ['ERP'],
          ncrIssued: false, ncrReceived: false,
          disposition: '', qty: 0, failCost: 0,
          itpPlanned: 4 + Math.floor(rnd() * 5),
          itpMatched: 0
        };
        // ITP 정합(성적서 일치) — 2026 개선
        var itpConform = (year === 2026 ? 0.94 : 0.88) + (rnd() - 0.5) * 0.06;
        rec.itpMatched = Math.round(rec.itpPlanned * Math.min(1, itpConform));
        if (isDefect) {
          // 부적합관리는 QMS → 대부분 QMS에도 등록(오더 매핑). 일부는 매핑 누락/미등록.
          var inQMS = rnd() < 0.86;
          if (inQMS) { rec.sources.push('QMS'); rec.fOrder = 'FO-' + year + '-' + pad(seq, 4); }
          rec.disposition = wpick(DISPOSITIONS, [40, 22, 20, 18]);
          rec.qty = 1 + Math.floor(rnd() * 18);
          rec.ncrIssued = rnd() < 0.82;
          rec.ncrReceived = rec.ncrIssued && rnd() < 0.7;
          // 코드 통일 전 변형 코드 (예: '용접'→'W-용접') — codeUnify off일 때 별도 카테고리로 셈
          rec.typeRaw = (rnd() < 0.25) ? (type.charAt(0) + '-' + type) : type;
        } else {
          rec.typeRaw = type;
        }
        records.push(rec);
      }
    });
    return records;
  }

  /* ---------- 저장소 (설정·운영 상태만 저장, 데이터는 결정적 재생성) ---------- */
  var KEY = 'qwall_v1';
  function loadOps() {
    var o; try { o = JSON.parse(localStorage.getItem(KEY)); } catch (e) { o = null; }
    if (!o || !o.settings) {
      o = {
        settings: defaultSettings(),
        refresh: {
          status: '완료', lastAt: nowMinus(42), // 42분 전
          sources: { ERP: '완료', QMS: '완료', Excel: '완료' },
          history: seedHistory(), stale: false, schedule: '매일 06:00 · 정시(매시간)'
        },
        session: { user: null }
      };
      saveOps(o);
    }
    return o;
  }
  function saveOps(o) { localStorage.setItem(KEY, JSON.stringify(o)); }
  function resetOps() { localStorage.removeItem(KEY); return loadOps(); }

  function seedHistory() {
    var h = [];
    for (var i = 8; i >= 1; i--) {
      h.push({ at: nowMinus(i * 60 + 42), status: i === 5 ? '실패' : '완료', rows: 812 + i * 3, note: i === 5 ? 'QMS 게이트웨이 응답 지연 — 이전 데이터 유지' : '' });
    }
    return h;
  }

  /* ===================================================================
     KPI 계산 엔진
     filters: { from, to, supplierId('all'), deviceId('all'), stage('all') }
     opts:    { dedup, codeUnify, cost }
     =================================================================== */
  function inRange(rec, f) {
    if (f.from && rec.date < f.from) return false;
    if (f.to && rec.date > f.to) return false;
    if (f.supplierId && f.supplierId !== 'all' && rec.supplierId !== f.supplierId) return false;
    if (f.deviceId && f.deviceId !== 'all' && rec.deviceId !== f.deviceId) return false;
    if (f.stage && f.stage !== 'all' && rec.stage !== f.stage) return false;
    return true;
  }

  function compute(records, filters, settings) {
    var f = filters || {};
    var rows = records.filter(function (r) { return inRange(r, f); });
    var defects = rows.filter(function (r) { return r.result === '부적합'; });

    // 부적합 건수 — dedup on: 유니크 건, off: 소스 행 합(ERP+QMS 이중 계상)
    var defectCountDedup = defects.length;
    var defectCountNaive = defects.reduce(function (s, r) { return s + r.sources.length; }, 0);
    var defectCount = settings.dedup ? defectCountDedup : defectCountNaive;
    var dupCount = defectCountNaive - defectCountDedup;

    var total = rows.length;
    var pass = rows.filter(function (r) { return r.result === '합격'; }).length;
    var incoming = rows.filter(function (r) { return r.stage === '수입'; });
    var incomingDefect = incoming.filter(function (r) { return r.result === '부적합'; }).length;
    var processDefect = defects.filter(function (r) { return r.stage === '공정'; }).length;

    var ncrIssued = defects.filter(function (r) { return r.ncrIssued; }).length;
    var ncrReceived = defects.filter(function (r) { return r.ncrReceived; }).length;

    var failCost = defects.reduce(function (s, r) { return s + (settings.cost[r.disposition] || 0) * r.qty; }, 0);

    var itpPlanned = rows.reduce(function (s, r) { return s + r.itpPlanned; }, 0);
    var itpMatched = rows.reduce(function (s, r) { return s + r.itpMatched; }, 0);

    // TOP5 공급업체 부적합
    var bySup = {};
    defects.forEach(function (r) { bySup[r.supplierId] = (bySup[r.supplierId] || 0) + 1; });
    var top = Object.keys(bySup).map(function (id) { return { id: id, name: supName(id), n: bySup[id] }; })
      .sort(function (a, b) { return b.n - a.n; });
    var top5 = top.slice(0, 5);
    var top5Share = defectCountDedup ? top5.reduce(function (s, x) { return s + x.n; }, 0) / defectCountDedup : 0;

    // 장치별 부적합
    var byDev = DEVICES.map(function (d) { return { id: d.id, name: d.name, n: defects.filter(function (r) { return r.deviceId === d.id; }).length }; })
      .sort(function (a, b) { return b.n - a.n; });

    // 유형 분포 (codeUnify off → 변형 코드 별도 카테고리)
    var typeMap = {};
    defects.forEach(function (r) { var k = settings.codeUnify ? r.type : (r.typeRaw || r.type); typeMap[k] = (typeMap[k] || 0) + 1; });
    var typeDist = Object.keys(typeMap).map(function (k) { return { k: k, n: typeMap[k] }; }).sort(function (a, b) { return b.n - a.n; });

    // 원인 분포
    var causeMap = {};
    defects.forEach(function (r) { causeMap[r.cause] = (causeMap[r.cause] || 0) + 1; });
    var causeDist = CAUSES.map(function (c) { return { k: c, n: causeMap[c] || 0 }; }).sort(function (a, b) { return b.n - a.n; });

    var defectRate = total ? defectCountDedup / total : 0;
    var incomingRate = incoming.length ? incomingDefect / incoming.length : 0;

    return {
      rows: rows, defects: defects,
      kpi: {
        total: total, passRate: total ? pass / total : 0,
        incomingDefect: incomingDefect, incomingRate: incomingRate,
        processDefect: processDefect,
        defectCount: defectCount, defectRate: defectRate,
        ncrIssued: ncrIssued, ncrReceived: ncrReceived, ncrRate: ncrIssued ? ncrReceived / ncrIssued : 0,
        failCost: failCost, avgFailCost: defectCountDedup ? failCost / defectCountDedup : 0,
        itpConformity: itpPlanned ? itpMatched / itpPlanned : 0,
        top5Share: top5Share
      },
      dupCount: dupCount, defectCountNaive: defectCountNaive, defectCountDedup: defectCountDedup,
      top5: top5, byDevice: byDev, typeDist: typeDist, causeDist: causeDist
    };
  }

  /* 전년 동기 필터로 shift */
  function prevYearFilter(f) {
    var g = Object.assign({}, f);
    if (f.from) g.from = shiftYear(f.from, -1);
    if (f.to) g.to = shiftYear(f.to, -1);
    return g;
  }
  function shiftYear(d, delta) { var p = d.split('-'); return (parseInt(p[0], 10) + delta) + '-' + p[1] + '-' + p[2]; }

  /* 월별 추이 (부적합률 · ITP 정합율) */
  function monthlyTrend(records, filters, settings, months) {
    return months.map(function (ym) {
      var f = Object.assign({}, filters, { from: ym + '-01', to: ym + '-31' });
      var c = compute(records, f, settings);
      return { ym: ym, defectRate: c.kpi.defectRate, itp: c.kpi.itpConformity, defects: c.defectCountDedup, total: c.kpi.total, failCost: c.kpi.failCost };
    });
  }

  /* ---------- 유틸 ---------- */
  function pad(n, w) { return String(n).padStart(w, '0'); }
  function supName(id) { var s = SUPPLIERS.find(function (x) { return x.id === id; }); return s ? s.name : id; }
  function devName(id) { var d = DEVICES.find(function (x) { return x.id === id; }); return d ? d.name : id; }
  function won(n) { return (Math.round(n) || 0).toLocaleString('ko-KR') + '원'; }
  function num(n) { return (Math.round(n) || 0).toLocaleString('ko-KR'); }
  function pct(x, d) { return (x * 100).toFixed(d == null ? 1 : d) + '%'; }
  function nowMinus(min) { var d = new Date(); d.setMinutes(d.getMinutes() - min); return d.toISOString(); }
  function fmtDT(iso) { var d = new Date(iso); return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2) + ' ' + pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2); }
  function ymd(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); }

  var _records = null;
  function records() { if (!_records) _records = generate(); return _records; }

  /* KPI 메타 (14개) — 라벨·포맷·좋음방향 */
  var KPI_DEFS = [
    { key: 'total', label: '전체 검사 건수', fmt: 'num', unit: '건', good: 'up' },
    { key: 'passRate', label: '합격률', fmt: 'pct', good: 'up' },
    { key: 'defectCount', label: '부적합 건수', fmt: 'num', unit: '건', good: 'down' },
    { key: 'defectRate', label: '부적합률', fmt: 'pct', good: 'down' },
    { key: 'incomingDefect', label: '수입 부적합', fmt: 'num', unit: '건', good: 'down' },
    { key: 'incomingRate', label: '수입 부적합률', fmt: 'pct', good: 'down' },
    { key: 'processDefect', label: '공정 부적합', fmt: 'num', unit: '건', good: 'down' },
    { key: 'ncrIssued', label: 'NCR 발행', fmt: 'num', unit: '건', good: 'down' },
    { key: 'ncrReceived', label: 'NCR 접수', fmt: 'num', unit: '건', good: 'up' },
    { key: 'ncrRate', label: 'NCR 처리율', fmt: 'pct', good: 'up' },
    { key: 'failCost', label: '실패비용', fmt: 'won', good: 'down' },
    { key: 'avgFailCost', label: '건당 실패비용', fmt: 'won', good: 'down' },
    { key: 'itpConformity', label: 'ITP 성적서 정합율', fmt: 'pct', good: 'up' },
    { key: 'top5Share', label: 'TOP5 업체 집중도', fmt: 'pct', good: 'down' }
  ];
  function fmtKPI(def, v) {
    if (def.fmt === 'pct') return pct(v);
    if (def.fmt === 'won') return won(v);
    return num(v) + (def.unit || '');
  }

  global.QW = {
    SUPPLIERS: SUPPLIERS, DEVICES: DEVICES, TYPES: TYPES, CAUSES: CAUSES, DISPOSITIONS: DISPOSITIONS,
    KPI_DEFS: KPI_DEFS, KEY: KEY,
    records: records, compute: compute, prevYearFilter: prevYearFilter, monthlyTrend: monthlyTrend,
    loadOps: loadOps, saveOps: saveOps, resetOps: resetOps, defaultSettings: defaultSettings,
    supName: supName, devName: devName, won: won, num: num, pct: pct, pad: pad,
    fmtDT: fmtDT, ymd: ymd, fmtKPI: fmtKPI, nowMinus: nowMinus
  };
})(window);
