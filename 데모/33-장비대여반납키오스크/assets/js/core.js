/* ============================================================
   ALLEND 올렌드 — 배리어프리 장비 대여·반납 키오스크 (데모)
   core.js — 사용자/관리자 공유 모듈
   · 목데이터(가상) · 재고 실연산 · localStorage 실연동
   · WCAG 명도대비 실계산 · KS X 9211 검증 스펙 · TTS 래퍼
   ------------------------------------------------------------
   ⚠ 모든 데이터는 가상입니다. 실존 인물·브랜드·기관과 무관합니다.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 장비 목데이터 (가상) --------------------------------
     공공기관 공유·보조 장비 대여소를 가정.
     보조기기(이동/정보) = 무료 대여, 행사·회의 장비 = 유료(일 단위).
     total = 총 보유, 각 대여 시 available 감소 / 반납 시 복구.        */
  const EQUIP_SEED = [
    // 이동 보조
    { id:'WC-STD', cat:'이동보조', name:'수동 휠체어', total:12, avail:8,  fee:0,    barrierFree:true,  icon:'♿', note:'접이식 · 좌폭 43cm' },
    { id:'WC-PWR', cat:'이동보조', name:'전동 휠체어', total:4,  avail:2,  fee:0,    barrierFree:true,  icon:'🦽', note:'조이스틱 · 완충 25km' },
    { id:'ROLL',   cat:'이동보조', name:'보행보조차(롤레이터)', total:6, avail:5, fee:0, barrierFree:true, icon:'🚶', note:'좌석형 · 높이조절' },
    // 정보·학습 보조
    { id:'TAB-10', cat:'정보학습', name:'태블릿 10형',  total:20, avail:12, fee:2000, barrierFree:true,  icon:'📱', note:'화면낭독 내장' },
    { id:'NB-14',  cat:'정보학습', name:'노트북 14형',  total:10, avail:5,  fee:3000, barrierFree:false, icon:'💻', note:'사무·학습용' },
    { id:'BRL',    cat:'정보학습', name:'점자정보단말', total:3,  avail:1,  fee:0,    barrierFree:true,  icon:'⠿', note:'32칸 브레일' },
    // 행사·회의
    { id:'PRJ',    cat:'행사회의', name:'빔프로젝터',   total:3,  avail:2,  fee:5000, barrierFree:false, icon:'📽', note:'4000안시' },
    { id:'MIC',    cat:'행사회의', name:'무선마이크 세트', total:5, avail:4, fee:3000, barrierFree:false, icon:'🎙', note:'2채널 · 수신기' },
    { id:'PA',     cat:'행사회의', name:'이동식 음향장비', total:2, avail:1, fee:8000, barrierFree:false, icon:'🔊', note:'배터리 내장' }
  ];
  const CATS = ['이동보조', '정보학습', '행사회의'];
  const CAT_LABEL = { 이동보조:'이동 보조', 정보학습:'정보·학습', 행사회의:'행사·회의' };

  /* ---------- 상태(localStorage 실연동) ---------------------------
     키오스크에서 대여/반납하면 관리자 화면 재고가 실제로 바뀝니다.   */
  const LS_KEY = 'allend_state_v1';
  function nowStamp() { return new Date().toISOString(); }

  function freshState() {
    return {
      equip: EQUIP_SEED.map(e => ({ ...e })),
      rentals: [],   // {no, id, name, days, fee, paid, cardMasked, at, status:'대여중'|'반납'}
      log: [],       // {at, kind, msg}
      seq: 1037
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return freshState();
      const s = JSON.parse(raw);
      if (!s.equip || !s.rentals) return freshState();
      return s;
    } catch (e) { return freshState(); }
  }

  function save(s) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {}
  }

  function resetState() { const s = freshState(); save(s); return s; }

  function pushLog(s, kind, msg) {
    s.log.unshift({ at: nowStamp(), kind, msg });
    if (s.log.length > 200) s.log.length = 200;
  }

  /* 대여 처리 — 재고 실제 감소, 대여번호 발급 */
  function rent(s, id, days, paid, cardMasked) {
    const e = s.equip.find(x => x.id === id);
    if (!e || e.avail <= 0) return { ok:false, reason:'재고 없음' };
    e.avail -= 1;
    const no = 'R' + (++s.seq);
    const fee = e.fee * days;
    const r = { no, id, name:e.name, icon:e.icon, days, fee, paid:!!paid, cardMasked:cardMasked||null, at:nowStamp(), status:'대여중' };
    s.rentals.unshift(r);
    pushLog(s, 'rent', `${e.name} 대여 (${no}) · ${days}일 · ${fee ? fee.toLocaleString()+'원 결제' : '무료'}`);
    save(s);
    return { ok:true, rental:r };
  }

  /* 반납 처리 — 재고 복구, 상태 갱신 */
  function giveBack(s, no) {
    const r = s.rentals.find(x => x.no === no && x.status === '대여중');
    if (!r) return { ok:false, reason:'대여중 항목 아님' };
    r.status = '반납';
    r.returnedAt = nowStamp();
    const e = s.equip.find(x => x.id === r.id);
    if (e && e.avail < e.total) e.avail += 1;
    pushLog(s, 'return', `${r.name} 반납 (${no})`);
    save(s);
    return { ok:true, rental:r };
  }

  function activeRentals(s) { return s.rentals.filter(r => r.status === '대여중'); }

  /* ---------- WCAG 명도대비 실계산 -------------------------------
     KS X 9211 / WCAG 2.1 대비비 계산. 4.5:1 기준(큰 글자 3:1).      */
  function hexToRgb(hex) {
    hex = (hex || '').trim().replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    return [0, 2, 4].map(i => parseInt(hex.substr(i, 2), 16));
  }
  function relLuminance(rgb) {
    const a = rgb.map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function contrastRatio(hex1, hex2) {
    const a = hexToRgb(hex1), b = hexToRgb(hex2);
    if (!a || !b) return null;
    const l1 = relLuminance(a), l2 = relLuminance(b);
    const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  /* ---------- KS X 9211 검증 스펙 (정량 기준) ---------------------
     근거: 무인정보단말기 정보접근성 검증기준(10원칙 47지표) /
           KS X 9211:2022 / 과기정통부 고시.
     mm 환산 가정: 32형 세로 키오스크 1080px 폭 = 약 396mm
                  → 0.3667 mm/px (px * 0.3667 = mm)                */
  const MM_PER_PX = 0.3667;
  const KSX9211 = {
    contrastMin: 4.5,        // 명도대비(작은 글자)
    contrastMinLarge: 3.0,   // 12mm 초과 글자
    fontHeightMinMM: 12,     // 글자 높이 최소 12mm
    touchMinSideMM: 12,      // 터치 타깃 한 변 최소 12mm
    touchMinAreaMM2: 150,    // 터치 타깃 면적 최소 150mm²
    touchGapMM: 2.5,         // 컨트롤 간격 최소 2.5mm
    controlLowMM: 400,       // 물리 컨트롤 높이 하한
    controlHighMM: 1220,     // 물리 컨트롤/화면 정보 상한
    forceMaxN: 22.2,         // 작동력 상한
    flickerMinHz: 3,         // 깜빡임 금지 대역
    flickerMaxHz: 50,
    volumeRangeDB: 50,       // 음량 조절 범위
    volumeMaxDB: 65          // 최대 음량
  };
  function pxToMm(px) { return +(px * MM_PER_PX).toFixed(1); }
  function mmToPx(mm) { return Math.round(mm / MM_PER_PX); }

  /* ---------- 지급 디자인 시나리오 (검증 진단용) ------------------
     A = 클라이언트가 접근성 미고려로 완성해 지급한 디자인(가정)
     B = 접근성 반영 디자인 — 데모가 실제 구현한 값                   */
  const DESIGN_SCENARIOS = {
    A: {
      label: '지급 디자인 A (접근성 미고려)',
      fg:'#8a8f98', bg:'#eef1f5', baseFontPx:24, btnFontPx:26,
      touchSidePx:28, timeoutSec:20, timeoutShown:false, ttsAll:true
    },
    B: {
      label: '접근성 반영 디자인 B (본 데모 구현)',
      fg:'#14161a', bg:'#ffffff', baseFontPx:34, btnFontPx:40,
      touchSidePx:64, timeoutSec:0, timeoutShown:true, ttsAll:false
    }
  };

  /* 시나리오 → 10개 대표 지표 판정(PASS/FAIL) */
  function diagnose(sc) {
    const cr = contrastRatio(sc.fg, sc.bg);
    const fontMM = pxToMm(sc.baseFontPx);
    const btnMM = pxToMm(sc.btnFontPx);
    const touchMM = pxToMm(sc.touchSidePx);
    const touchArea = +(touchMM * touchMM).toFixed(0);
    const rows = [
      { key:'명도대비', need:`${KSX9211.contrastMin}:1 이상`,
        got:`${cr ? cr.toFixed(2) : '?'}:1`,
        pass: cr >= KSX9211.contrastMin, who:'디자인' },
      { key:'본문 글자높이', need:`${KSX9211.fontHeightMinMM}mm 이상`,
        got:`${fontMM}mm (${sc.baseFontPx}px)`,
        pass: fontMM >= KSX9211.fontHeightMinMM, who:'디자인' },
      { key:'버튼 글자높이', need:`${KSX9211.fontHeightMinMM}mm 이상`,
        got:`${btnMM}mm (${sc.btnFontPx}px)`,
        pass: btnMM >= KSX9211.fontHeightMinMM, who:'디자인' },
      { key:'터치 타깃 한 변', need:`${KSX9211.touchMinSideMM}mm 이상`,
        got:`${touchMM}mm (${sc.touchSidePx}px)`,
        pass: touchMM >= KSX9211.touchMinSideMM, who:'디자인·SW' },
      { key:'터치 타깃 면적', need:`${KSX9211.touchMinAreaMM2}mm² 이상`,
        got:`${touchArea}mm²`,
        pass: touchArea >= KSX9211.touchMinAreaMM2, who:'디자인·SW' },
      { key:'응답시간 제한', need:'없거나 남은시간 표시',
        got: sc.timeoutSec === 0 ? '제한 없음' : (sc.timeoutShown ? `${sc.timeoutSec}s·표시함` : `${sc.timeoutSec}s·표시안함`),
        pass: sc.timeoutSec === 0 || sc.timeoutShown, who:'SW' },
      { key:'개인정보 음성낭독', need:'결제·개인정보 낭독 금지',
        got: sc.ttsAll ? '전 화면 낭독(카드번호 포함)' : '결제화면 낭독 예외',
        pass: !sc.ttsAll, who:'SW' },
      { key:'물리버튼 전기능 도달', need:'터치 없이 100% 조작',
        got: 'SW 초점관리 필요', pass:true, who:'SW', info:true },
      { key:'이어폰잭·음량조절', need:'3.5mm잭·50dB 조절',
        got: '지급 HW 규격 확인 필요', pass:null, who:'HW', info:true },
      { key:'컨트롤 설치높이', need:`${KSX9211.controlLowMM}~${KSX9211.controlHighMM}mm`,
        got: '지급 HW·설치 확인 필요', pass:null, who:'HW', info:true }
    ];
    return { contrast:cr, rows };
  }

  /* ---------- TTS(음성안내) 래퍼 --------------------------------
     Web Speech API. 지원 안 하면 조용히 무시(자막으로 대체).       */
  const TTS = {
    on: false,
    supported: ('speechSynthesis' in global),
    _pick() {
      try {
        const vs = speechSynthesis.getVoices();
        return vs.find(v => /ko/i.test(v.lang)) || vs[0] || null;
      } catch (e) { return null; }
    },
    speak(text, opts) {
      if (!this.on || !this.supported || !text) return;
      opts = opts || {};
      try {
        if (!opts.queue) speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text));
        u.lang = 'ko-KR'; u.rate = 1.0; u.pitch = 1.0;
        const v = this._pick(); if (v) u.voice = v;
        speechSynthesis.speak(u);
      } catch (e) {}
    },
    stop() { try { speechSynthesis.cancel(); } catch (e) {} }
  };

  /* ---------- 유틸 ---------------------------------------------- */
  function won(n) { return (n || 0).toLocaleString('ko-KR') + '원'; }
  function timeStr(iso) {
    const d = new Date(iso);
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function maskCard(num) {
    const d = (num || '').replace(/\D/g, '');
    if (d.length < 8) return '****-****-****-****';
    return d.slice(0, 4) + '-****-****-' + d.slice(-4);
  }

  /* CSV(UTF-8 BOM) Blob 다운로드 — 엑셀 한글 대응 */
  function downloadCSV(filename, rows) {
    const esc = v => {
      v = v == null ? '' : String(v);
      return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    };
    const body = rows.map(r => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 300);
  }

  global.ALLEND = {
    EQUIP_SEED, CATS, CAT_LABEL, LS_KEY,
    load, save, resetState, freshState, pushLog,
    rent, giveBack, activeRentals,
    contrastRatio, hexToRgb, relLuminance,
    KSX9211, MM_PER_PX, pxToMm, mmToPx, DESIGN_SCENARIOS, diagnose,
    TTS, won, timeStr, maskCard, downloadCSV
  };
})(window);
