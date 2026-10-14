/* BUREAU 뷰로 — 공통 모듈: 아이콘 · 날짜 · 공휴일 · 반복 전개 · 충돌 계산 · 빠른 입력 파서 · 저장소
   외부 라이브러리 없음. 데모 데이터는 전부 가상입니다. */
(function (W) {
  'use strict';

  /* ------------------------------------------------------------------
     아이콘 (24 그리드 · 1.75 선 — X 아이콘 두께에 맞춤 · 활성은 채움판)
     ------------------------------------------------------------------ */
  const P = {
    home: '<path d="M3.5 10.2 12 3.6l8.5 6.6V20a.9.9 0 0 1-.9.9h-4.8v-6.3H9.2v6.3H4.4a.9.9 0 0 1-.9-.9z"/>',
    homeF: '<path fill="currentColor" stroke="none" d="M12 2.6 21.4 9.9V20a1.9 1.9 0 0 1-1.9 1.9h-5.7v-6.3h-3.6v6.3H4.5A1.9 1.9 0 0 1 2.6 20V9.9z"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
    calF: '<path fill="currentColor" stroke="none" d="M7.1 2.2h1.8v1.9h6.2V2.2h1.8v1.9h1.4A3.2 3.2 0 0 1 21.5 7.3v1.3h-19V7.3a3.2 3.2 0 0 1 3.2-3.2h1.4zM2.5 10.4h19v8.3a3.2 3.2 0 0 1-3.2 3.2H5.7a3.2 3.2 0 0 1-3.2-3.2z"/>',
    mtg: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.2 19.5c.6-3.2 2.9-5 5.8-5s5.2 1.8 5.8 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.6 14.6c2.7-.2 4.6 1.4 5.2 4.4"/>',
    mtgF: '<g fill="currentColor" stroke="none"><circle cx="9" cy="8.3" r="3.8"/><path d="M2.4 20.4c.5-4.1 3.2-6.6 6.6-6.6s6.1 2.5 6.6 6.6z"/><circle cx="17.2" cy="9.2" r="2.9"/><path d="M16.9 13.6c2.9 0 4.9 2.3 5.2 5.6h-4.9c-.2-2.2-1.1-4-2.5-5.3a6 6 0 0 1 2.2-.3z"/></g>',
    team: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.2"/><path d="M3.5 9.5h17M9 9.5v10M3.5 14.5h17"/>',
    teamF: '<path fill="currentColor" stroke="none" d="M5.7 3.5h12.6a3.2 3.2 0 0 1 3.2 3.2v1.8h-19V6.7a3.2 3.2 0 0 1 3.2-3.2zM2.5 10.3H8v3.3H2.5zm7.3 0h11.7v3.3H9.8zM2.5 15.4H8v5.1H5.7a3.2 3.2 0 0 1-3.2-3.2zm7.3 0h11.7v1.9a3.2 3.2 0 0 1-3.2 3.2H9.8z"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.7 2H4.3z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
    bellF: '<path fill="currentColor" stroke="none" d="M12 2.6a7 7 0 0 1 7 7v6.4l2.3 2.9H2.7L5 16V9.6a7 7 0 0 1 7-7zm-2.9 17.5h5.8a3 3 0 0 1-5.8 0z"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m20.5 20.5-4.9-4.9"/>',
    searchF: '<circle cx="10.8" cy="10.8" r="6.8" stroke-width="2.6"/><path d="m20.5 20.5-4.9-4.9" stroke-width="2.6"/>',
    gear: '<circle cx="12" cy="12" r="3.1"/><path d="M19.4 13.6a7.6 7.6 0 0 0 0-3.2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2.8-1.6L13.9 2.2h-3.8l-.4 2.6A7.4 7.4 0 0 0 7 6.4l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3.2l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2.8 1.6l.4 2.6h3.8l.4-2.6a7.4 7.4 0 0 0 2.8-1.6l2.4 1 2-3.4z"/>',
    gearF: '<path fill="currentColor" stroke="none" fill-rule="evenodd" d="M10.1 1.6h3.8c.4 0 .7.3.8.7l.3 2.1c.8.3 1.5.7 2.1 1.2l2-.8c.4-.2.8 0 1 .4l1.9 3.3c.2.4.1.8-.2 1.1l-1.7 1.3a7.7 7.7 0 0 1 0 2.4l1.7 1.3c.3.3.4.7.2 1.1l-1.9 3.3c-.2.4-.6.5-1 .4l-2-.8c-.6.5-1.3.9-2.1 1.2l-.3 2.1c-.1.4-.4.7-.8.7h-3.8a.8.8 0 0 1-.8-.7L9 19.6a8 8 0 0 1-2.1-1.2l-2 .8c-.4.1-.8 0-1-.4L2 15.5c-.2-.4-.1-.8.2-1.1l1.7-1.3a7.7 7.7 0 0 1 0-2.4L2.2 9.4C1.9 9.1 1.8 8.7 2 8.3l1.9-3.3c.2-.4.6-.6 1-.4l2 .8c.6-.5 1.3-.9 2.1-1.2l.3-2.1c.1-.4.4-.7.8-.7zM12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z"/>',
    shield: '<path d="M12 2.8 4.5 5.6v6c0 4.6 3.1 8.4 7.5 9.6 4.4-1.2 7.5-5 7.5-9.6v-6z"/><path d="m8.7 12 2.3 2.3 4.4-4.6"/>',
    shieldF: '<path fill="currentColor" stroke="none" d="M12 1.9 20.4 5v6.6c0 5.1-3.5 9.3-8.4 10.6C7.1 20.9 3.6 16.7 3.6 11.6V5zm3.9 6.9-5 5.1-2.4-2.4-1.2 1.2 3.6 3.6 6.2-6.3z"/>',
    plus: '<path d="M12 4.5v15M4.5 12h15"/>',
    plusB: '<path d="M12 4v16M4 12h16" stroke-width="2.4"/>',
    more: '<g fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></g>',
    back: '<path d="M20 12H5M11 5.5 4.5 12l6.5 6.5"/>',
    close: '<path d="m5.5 5.5 13 13M18.5 5.5l-13 13"/>',
    chevL: '<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>',
    chevR: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
    chevD: '<path d="m5.5 9 6.5 6.5L18.5 9"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    repeat: '<path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19m-3-3 3 3-3 3M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5m3 3-3-3 3-3"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    checkC: '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.8 2.8L16.2 9.6"/>',
    trash: '<path d="M4.5 6.5h15M9.5 6.5V4.2h5v2.3M6.5 6.5l.9 13.3h9.2l.9-13.3M10 10.5v6M14 10.5v6"/>',
    download: '<path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M4.5 19.5h15"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>',
    alert: '<path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 9.5v4.5M12 16.8v.2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.2"/>',
    edit: '<path d="m4.5 19.5 1-4.2L15.8 5a2 2 0 0 1 2.9 0l.3.3a2 2 0 0 1 0 2.9L8.7 18.5z"/><path d="m13.7 7.1 3.2 3.2"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6.2a1.7 1.7 0 0 0-1.7-1.7H6.2a1.7 1.7 0 0 0-1.7 1.7v7.6a1.7 1.7 0 0 0 1.7 1.7h2.3"/>',
    spark: '<path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7-5.6-1.9L10.1 9z"/><path d="M19 3.5v3M17.5 5h3"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.8 20c.7-3.6 3.2-5.6 6.2-5.6s5.5 2 6.2 5.6M16 5.2a3.4 3.4 0 0 1 0 6.6M18.4 14.6c1.6.8 2.6 2.6 2.9 5.4"/>',
    door: '<path d="M5 20.5h14M7 20.5V4.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><circle cx="14" cy="12.5" r=".9" fill="currentColor"/>',
    note: '<path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14 3.5V8.5h5M9 12.5h7M9 16h5"/>',
    list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r="1" fill="currentColor"/><circle cx="4.8" cy="12" r="1" fill="currentColor"/><circle cx="4.8" cy="17.5" r="1" fill="currentColor"/>',
    flag: '<path d="M5.5 21V4M5.5 4.5h11.8l-2 4 2 4H5.5"/>',
    key: '<circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 8.3-8.3M16.5 6.5l2.5 2.5M14 9l2 2"/>',
    history: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.7"/><path d="M4 4v4.7h4.7M12 8v4.5l3 1.8"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5S14.4 18.2 12 20.5c-2.4-2.3-3.6-5.2-3.6-8.5S9.6 5.8 12 3.5z"/>',
    logout: '<path d="M14 4.5H6.5v15H14M10 12h10.5m-3.5-3.5L20.5 12 17 15.5"/>',
    keyboard: '<rect x="2.8" y="6" width="18.4" height="12" rx="2"/><path d="M6.5 9.5h.1M10 9.5h.1M13.5 9.5h.1M17 9.5h.1M6.5 12.5h.1M17 12.5h.1M8.5 15h7"/>',
    undo: '<path d="M9 14 4.5 9.5 9 5"/><path d="M5 9.5h9a5.5 5.5 0 0 1 0 11h-3"/>',
    db: '<ellipse cx="12" cy="6" rx="7.5" ry="2.8"/><path d="M4.5 6v12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".9" fill="currentColor"/>',
    feather: '<path d="M20 4c-7 0-12 4.5-13.4 11.6L5 20"/><path d="M20 4c0 5.5-3.3 10-9.4 10.8M9.2 12.5h5.3"/>',
    flow: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a3.5 3.5 0 0 1 3.5 3.5V15.5M6 8.5V14a3.5 3.5 0 0 0 3.5 3.5h6"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
  }
  /* BUREAU 마크 — 사무국 책상 위 일정 카드 3장(겹친 정렬) */
  const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="26" height="26" rx="7" fill="#0f1419"/><rect x="8" y="9" width="16" height="3.4" rx="1.7" fill="#fff"/><rect x="8" y="14.3" width="11" height="3.4" rx="1.7" fill="#1d9bf0"/><rect x="8" y="19.6" width="13.5" height="3.4" rx="1.7" fill="#fff" opacity=".55"/></svg>';

  /* ------------------------------------------------------------------
     날짜 유틸 — 저장은 'YYYY-MM-DD' + 'HH:MM' (서버 저장 시 Asia/Seoul 고정, 종일 일정은 날짜형)
     ------------------------------------------------------------------ */
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const dow = s => parse(s).getDay();
  const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
  const startOfWeek = s => addDays(s, -((dow(s) + 6) % 7)); // 월요일 시작
  const toMin = t => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const toHM = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const fmtMD = s => { const d = parse(s); return (d.getMonth() + 1) + '/' + d.getDate() + '(' + WD[d.getDay()] + ')'; };
  const fmtKD = s => { const d = parse(s); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + WD[d.getDay()] + '요일'; };
  const fmtYMK = s => { const d = parse(s); return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월'; };
  function fmtT(t) {
    if (!t) return '';
    const m = toMin(t), h = Math.floor(m / 60), mm = m % 60;
    const ap = h < 12 ? '오전' : '오후';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return ap + ' ' + hh + (mm ? ':' + pad(mm) : '시');
  }
  const fmtShortT = t => { const m = toMin(t); return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
  function durLabel(a, b) {
    const d = toMin(b) - toMin(a);
    if (d <= 0) return '';
    const h = Math.floor(d / 60), m = d % 60;
    return (h ? h + '시간' : '') + (h && m ? ' ' : '') + (m ? m + '분' : '');
  }
  function ago(ts, now) {
    const s = Math.max(0, Math.round(((now || Date.now()) - ts) / 1000));
    if (s < 60) return '방금';
    if (s < 3600) return Math.floor(s / 60) + '분';
    if (s < 86400) return Math.floor(s / 3600) + '시간';
    const d = new Date(ts);
    return (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
  }

  /* ------------------------------------------------------------------
     한국 공휴일 (관공서의 공휴일에 관한 규정 · 대체공휴일 포함)
     운영 시: 공공데이터포털 한국천문연구원 특일정보 API를 매월 동기화 → 임시공휴일 반영
     ------------------------------------------------------------------ */
  const HOLIDAYS = {
    '2026-01-01': '신정', '2026-02-16': '설날 연휴', '2026-02-17': '설날', '2026-02-18': '설날 연휴',
    '2026-03-01': '삼일절', '2026-03-02': '대체공휴일', '2026-05-05': '어린이날', '2026-05-24': '부처님오신날',
    '2026-05-25': '대체공휴일', '2026-06-03': '지방선거', '2026-06-06': '현충일', '2026-08-15': '광복절',
    '2026-08-17': '대체공휴일', '2026-09-24': '추석 연휴', '2026-09-25': '추석', '2026-09-26': '추석 연휴',
    '2026-10-03': '개천절', '2026-10-05': '대체공휴일', '2026-10-09': '한글날', '2026-12-25': '성탄절',
    '2027-01-01': '신정', '2027-02-06': '설날 연휴', '2027-02-07': '설날', '2027-02-08': '설날 연휴',
    '2027-02-09': '대체공휴일', '2027-03-01': '삼일절'
  };
  const isOff = s => dow(s) === 0 || dow(s) === 6 || !!HOLIDAYS[s];
  const nextBiz = s => { let d = s; while (isOff(d)) d = addDays(d, 1); return d; };
  const prevBiz = s => { let d = s; while (isOff(d)) d = addDays(d, -1); return d; };

  /* ------------------------------------------------------------------
     반복 일정 전개 (RFC 5545 RRULE 부분집합 · EXDATE · 회차별 덮어쓰기)
     rule: { freq:'weekly', interval, byday:[1..5] } | { freq:'monthly', nth:1..5|-1, wd } | { freq:'daily' }
     ------------------------------------------------------------------ */
  function nthWeekdayOf(y, m, nth, wd) {
    if (nth === -1) {
      const last = new Date(y, m + 1, 0);
      while (last.getDay() !== wd) last.setDate(last.getDate() - 1);
      return iso(last);
    }
    const d = new Date(y, m, 1);
    while (d.getDay() !== wd) d.setDate(d.getDate() + 1);
    d.setDate(d.getDate() + (nth - 1) * 7);
    return d.getMonth() === m ? iso(d) : null;
  }
  function occurrences(ev, from, to) {
    // 반환: [{ ...ev, date, occ: 'YYYY-MM-DD' | null }]
    const out = [];
    const span = ev.endDate ? diffDays(ev.date, ev.endDate) : 0;
    if (!ev.rule) {
      const end = ev.endDate || ev.date;
      if (end >= from && ev.date <= to) out.push(Object.assign({}, ev, { occ: null }));
      return out;
    }
    const r = ev.rule, until = r.until || '9999-12-31', ex = ev.exdates || [], ov = ev.overrides || {};
    const push = d => {
      if (d < ev.date || d > until || ex.includes(d)) return;
      const end = addDays(d, span);
      if (end < from || d > to) return;
      const o = Object.assign({}, ev, { date: d, endDate: span ? end : null, occ: d }, ov[d] || {});
      out.push(o);
    };
    if (r.freq === 'daily') {
      for (let d = from < ev.date ? ev.date : from; d <= to; d = addDays(d, 1)) if (!isOff(d) || !r.biz) push(d);
    } else if (r.freq === 'weekly') {
      const iv = r.interval || 1, base = startOfWeek(ev.date);
      let w = startOfWeek(from < ev.date ? ev.date : from);
      for (; w <= to; w = addDays(w, 7)) {
        const k = Math.round(diffDays(base, w) / 7);
        if (k % iv) continue;
        (r.byday || [dow(ev.date)]).forEach(bd => push(addDays(w, (bd + 6) % 7)));
      }
    } else if (r.freq === 'monthly') {
      const f = parse(from < ev.date ? ev.date : from); f.setDate(1);
      const t = parse(to);
      for (let y = f.getFullYear(), m = f.getMonth(); y < t.getFullYear() || (y === t.getFullYear() && m <= t.getMonth()); m === 11 ? (m = 0, y++) : m++) {
        const d = r.nth ? nthWeekdayOf(y, m, r.nth, r.wd) : (y + '-' + pad(m + 1) + '-' + pad(parse(ev.date).getDate()));
        if (d) push(d);
      }
    }
    return out.sort((a, b) => a.date < b.date ? -1 : 1);
  }
  function ruleLabel(r, date) {
    if (!r) return '반복 안 함';
    const NTH = { 1: '첫째', 2: '둘째', 3: '셋째', 4: '넷째', 5: '다섯째', '-1': '마지막' };
    if (r.freq === 'daily') return r.biz ? '평일 매일' : '매일';
    if (r.freq === 'weekly') return (r.interval > 1 ? r.interval + '주마다 ' : '매주 ') + (r.byday || [dow(date)]).map(d => WD[d]).join('·') + '요일';
    if (r.freq === 'monthly') return r.nth ? '매월 ' + NTH[r.nth] + ' ' + WD[r.wd] + '요일' : '매월 ' + parse(date).getDate() + '일';
    return '';
  }

  /* ------------------------------------------------------------------
     빠른 입력 파서 — "다음 주 화 2시 학술위원회 회의 @대회의실 김다인"
     규칙 기반(서버 불필요) · 인식한 토큰을 칩으로 돌려줘서 사용자가 바로 확인
     ------------------------------------------------------------------ */
  const CAT_WORDS = [
    ['away', /(연차|반차|휴가|외근|출장|병가|조퇴|재택)/],
    ['conf', /(학술대회|추계|춘계|초록|사전등록|부스|연자|좌장|프로그램북|평점|학회장)/],
    ['comm', /(위원회|이사회|평의원|총회|편집위|간사회|운영위)/],
    ['edu', /(교육|연수|강좌|워크숍|워크샵|세미나|심포지엄|전공의)/],
    ['grant', /(연구비|정산|과제|중간보고|결과보고|협약|집행)/],
    ['intl', /(해외|국제|자매학회|APAC|방문단|대표단|영문|ICS|외국)/i],
    ['admin', /(회비|회계|총무|점검|결산|세무|비품|계약|행정|공문)/]
  ];
  const MTG_WORDS = /(회의|미팅|면담|킥오프|간담회|점검회|리뷰|협의|이사회|총회|간사회|평의원회)/;
  const WD_MAP = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };
  function parseQuick(text, ctx) {
    // ctx: { today, users:[{id,name}], rooms:[{id,name,alias:[]}] }
    let s = ' ' + text + ' ';
    const tok = [];
    const res = { title: '', date: null, start: null, end: null, allDay: false, cat: null, type: 'event', room: null, people: [], rule: null, tokens: tok };
    const today = ctx.today;
    const cut = (re, fn) => { const m = s.match(re); if (m) { fn(m); s = s.replace(m[0], ' '); return true; } return false; };

    // 반복
    cut(/매주\s*([월화수목금토일](?:[·,\s]*[월화수목금토일])*)(?:요일)?/, m => {
      const days = m[1].replace(/[·,\s]/g, '').split('').map(c => WD_MAP[c]);
      res.rule = { freq: 'weekly', byday: days };
      tok.push({ k: 'repeat', v: '매주 ' + m[1].replace(/[·,\s]/g, '·') + '요일' });
    }) ||
    cut(/매월\s*(첫째|둘째|셋째|넷째|마지막)\s*([월화수목금토일])(?:요일)?/, m => {
      const n = { '첫째': 1, '둘째': 2, '셋째': 3, '넷째': 4, '마지막': -1 }[m[1]];
      res.rule = { freq: 'monthly', nth: n, wd: WD_MAP[m[2]] };
      tok.push({ k: 'repeat', v: '매월 ' + m[1] + ' ' + m[2] + '요일' });
    }) ||
    cut(/평일\s*매일|매일/, m => { res.rule = { freq: 'daily', biz: /평일/.test(m[0]) }; tok.push({ k: 'repeat', v: m[0].replace(/\s+/g, ' ') }); });

    // 날짜
    const setDate = (d, label) => { res.date = d; tok.push({ k: 'date', v: label || fmtMD(d) }); };
    cut(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/, m => setDate(m[1] + '-' + pad(m[2]) + '-' + pad(m[3]))) ||
    cut(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/, m => setDate(guessYear(today, +m[1], +m[2]))) ||
    cut(/(?:^|\s)(\d{1,2})\/(\d{1,2})(?=\s|$|[^\d])/, m => setDate(guessYear(today, +m[1], +m[2]))) ||
    cut(/오늘/, () => setDate(today, '오늘 ' + fmtMD(today))) ||
    cut(/내일/, () => setDate(addDays(today, 1), '내일 ' + fmtMD(addDays(today, 1)))) ||
    cut(/모레/, () => setDate(addDays(today, 2), '모레 ' + fmtMD(addDays(today, 2)))) ||
    cut(/(이번\s*주|금주|다음\s*주|담주|차주|다다음\s*주)\s*([월화수목금토일])(?:요일)?/, m => {
      const off = /다다음/.test(m[1]) ? 14 : /(다음|담주|차주)/.test(m[1]) ? 7 : 0;
      setDate(addDays(startOfWeek(today), off + (WD_MAP[m[2]] + 6) % 7));
    }) ||
    cut(/(?:^|\s)([월화수목금])요일/, m => {
      let d = addDays(startOfWeek(today), (WD_MAP[m[1]] + 6) % 7);
      if (d < today) d = addDays(d, 7);
      setDate(d);
    }) ||
    cut(/(?:^|\s)(\d{1,2})\s*일(?!정)/, m => { const t = parse(today); let d = new Date(t.getFullYear(), t.getMonth(), +m[1]); if (iso(d) < today) d = new Date(t.getFullYear(), t.getMonth() + 1, +m[1]); setDate(iso(d)); });

    // 시간 (범위 우선)
    const hm = (ap, h, mi, half) => {
      h = +h; mi = mi ? +mi : (half ? 30 : 0);
      if (ap === '오후' && h < 12) h += 12;
      if (ap === '오전' && h === 12) h = 0;
      if (!ap && h >= 1 && h <= 7) h += 12; // 업무시간 추정: "2시" = 14시
      return toHM(h * 60 + mi);
    };
    const T = '(오전|오후)?\\s*(\\d{1,2})(?:\\s*[:시]\\s*(\\d{1,2})?\\s*분?)?(반)?';
    if (!cut(new RegExp(T + '\\s*(?:~|-|부터|에서)\\s*' + T + '(?:\\s*까지)?'), m => {
      res.start = hm(m[1], m[2], m[3], m[4]);
      res.end = hm(m[5] || (m[1] === '오후' ? '오후' : null), m[6], m[7], m[8]);
      if (toMin(res.end) <= toMin(res.start) && toMin(res.end) < 12 * 60) res.end = toHM(toMin(res.end) + 720);
      if (toMin(res.end) <= toMin(res.start)) res.end = toHM(toMin(res.start) + 60);
      tok.push({ k: 'time', v: fmtShortT(res.start) + '–' + fmtShortT(res.end) });
    })) {
      cut(/정오/, () => { res.start = '12:00'; tok.push({ k: 'time', v: '12:00' }); }) ||
      cut(new RegExp('(오전|오후)?\\s*(\\d{1,2})\\s*(?::\\s*(\\d{2})|시\\s*(\\d{1,2})?\\s*분?)(반)?'), m => {
        res.start = hm(m[1], m[2], m[3] || m[4], m[5]);
        tok.push({ k: 'time', v: fmtShortT(res.start) });
      });
      cut(/(\d+(?:\.\d)?)\s*시간(?:\s*(\d+)\s*분)?|(\d{2,3})\s*분\s*(?:간|동안)?/, m => {
        const mins = m[1] ? Math.round(parseFloat(m[1]) * 60) + (m[2] ? +m[2] : 0) : +m[3];
        if (res.start) { res.end = toHM(Math.min(toMin(res.start) + mins, 23 * 60 + 59)); tok.push({ k: 'dur', v: durLabel(res.start, res.end) }); }
      });
    }
    if (/종일|하루\s*종일/.test(s)) { res.allDay = true; s = s.replace(/하루\s*종일|종일/, ' '); tok.push({ k: 'time', v: '종일' }); }

    // 회의실
    (ctx.rooms || []).forEach(r => {
      const names = [r.name].concat(r.alias || []);
      for (const n of names) {
        const re = new RegExp('@?' + n.replace(/[()]/g, '\\$&') + '(에서)?');
        if (re.test(s)) { res.room = r.id; s = s.replace(re, ' '); tok.push({ k: 'room', v: r.name }); break; }
      }
    });
    // 사람
    (ctx.users || []).forEach(u => {
      if (!u.active) return;
      const re = new RegExp('@?(' + u.name + '|' + u.name.slice(1) + ')(님|과|와|랑)?(?=\\s|$)');
      if (re.test(s)) { res.people.push(u.id); s = s.replace(re, ' '); tok.push({ k: 'person', v: u.name }); }
    });
    // 분류 · 유형 (제목에서 지우지 않음 — 단어가 제목의 일부)
    for (const [k, re] of CAT_WORDS) if (re.test(s)) { res.cat = k; break; }
    if (MTG_WORDS.test(s) && res.cat !== 'away') res.type = 'meeting';
    if (res.cat === 'away' && !res.start) res.allDay = true;

    if (res.rule && !res.date) {
      const first = occurrences({ id: '_', date: today, rule: res.rule }, today, addDays(today, 62))[0];
      if (first) { res.date = first.date; tok.push({ k: 'date', v: fmtMD(first.date) + '부터' }); }
    }
    res.title = s.replace(/\s+/g, ' ').replace(/^\s*(에|에서|까지)\s+/, '').trim();
    if (res.start && !res.end && !res.allDay) res.end = toHM(Math.min(toMin(res.start) + 60, 23 * 60 + 59));
    return res;
  }
  function guessYear(today, m, d) {
    const t = parse(today);
    let y = t.getFullYear();
    const cand = y + '-' + pad(m) + '-' + pad(d);
    if (diffDays(today, cand) < -60) y++;
    return y + '-' + pad(m) + '-' + pad(d);
  }

  /* ------------------------------------------------------------------
     충돌 계산 — 같은 사람·같은 회의실이 겹치는 시간 (반복 일정 전개 후)
     ------------------------------------------------------------------ */
  function overlaps(a, b) {
    if (a.allDay || b.allDay) return false;
    return toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);
  }
  function dayItems(events, date) {
    const out = [];
    events.forEach(ev => { if (!ev.deleted) occurrences(ev, date, date).forEach(o => out.push(o)); });
    return out;
  }
  function conflictsFor(draft, events, users) {
    // draft: { id, date, start, end, allDay, people:[], room }
    const res = { people: [], room: null, away: [] };
    if (!draft.date) return res;
    const items = dayItems(events, draft.date).filter(o => o.id !== draft.id);
    (draft.people || []).forEach(pid => {
      items.forEach(o => {
        if (!(o.people || []).includes(pid)) return;
        if (o.cat === 'away' && (o.allDay || overlaps(draft, o))) res.away.push({ pid, ev: o });
        else if (!draft.allDay && overlaps(draft, o)) res.people.push({ pid, ev: o });
      });
    });
    if (draft.room && !draft.allDay && !/^(online|ext)$/.test(draft.room)) {
      const hit = items.find(o => o.room === draft.room && overlaps(draft, o));
      if (hit) res.room = hit;
    }
    return res;
  }
  function freeSlots(people, date, events, dur, opts) {
    // 09:00~18:00 업무시간 안에서 모두 비는 시작 시각(30분 단위) 상위 N개
    opts = opts || {};
    const items = dayItems(events, date).filter(o => o.id !== opts.exclude && !o.allDay && ((o.people || []).some(p => people.includes(p)) || (opts.room && o.room === opts.room)));
    const awayAll = dayItems(events, date).filter(o => o.cat === 'away' && o.allDay && (o.people || []).some(p => people.includes(p)));
    if (awayAll.length) return [];
    const out = [];
    for (let m = 9 * 60; m + dur <= 18 * 60; m += 30) {
      if (m < 13 * 60 && m + dur > 12 * 60) continue; // 점심 12~13시 제외
      const cand = { start: toHM(m), end: toHM(m + dur) };
      if (!items.some(o => overlaps(cand, o))) out.push(cand.start);
      if (out.length >= (opts.n || 4)) break;
    }
    return out;
  }

  /* ------------------------------------------------------------------
     ICS 내보내기 (RFC 5545 · CRLF · 75옥텟 접기 · TZID=Asia/Seoul)
     ------------------------------------------------------------------ */
  function icsEscape(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function icsFold(line) {
    const enc = new TextEncoder();
    if (enc.encode(line).length <= 75) return line;
    const out = []; let cur = '';
    for (const ch of line) {
      if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ch; } else cur += ch;
    }
    out.push(cur);
    return out.join('\r\n ');
  }
  function toICS(list, calName) {
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BUREAU//Demo//KO', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:' + icsEscape(calName), 'X-WR-TIMEZONE:Asia/Seoul',
      'BEGIN:VTIMEZONE', 'TZID:Asia/Seoul', 'BEGIN:STANDARD', 'DTSTART:19700101T000000', 'TZOFFSETFROM:+0900', 'TZOFFSETTO:+0900', 'TZNAME:KST', 'END:STANDARD', 'END:VTIMEZONE'];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const dt = (d, t) => d.replace(/-/g, '') + 'T' + t.replace(':', '') + '00';
    list.forEach(ev => {
      L.push('BEGIN:VEVENT', 'UID:' + ev.id + '@bureau.demo', 'DTSTAMP:' + stamp);
      if (ev.allDay) {
        L.push('DTSTART;VALUE=DATE:' + ev.date.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + addDays(ev.endDate || ev.date, 1).replace(/-/g, ''));
      } else {
        L.push('DTSTART;TZID=Asia/Seoul:' + dt(ev.date, ev.start), 'DTEND;TZID=Asia/Seoul:' + dt(ev.date, ev.end));
      }
      if (ev.rule) {
        const r = ev.rule, BY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        let rr = '';
        if (r.freq === 'weekly') rr = 'FREQ=WEEKLY' + (r.interval > 1 ? ';INTERVAL=' + r.interval : '') + ';BYDAY=' + (r.byday || [dow(ev.date)]).map(d => BY[d]).join(',');
        if (r.freq === 'monthly') rr = r.nth ? 'FREQ=MONTHLY;BYDAY=' + r.nth + BY[r.wd] : 'FREQ=MONTHLY';
        if (r.freq === 'daily') rr = r.biz ? 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' : 'FREQ=DAILY';
        if (r.until) rr += ';UNTIL=' + r.until.replace(/-/g, '') + 'T235959';
        L.push('RRULE:' + rr);
        (ev.exdates || []).forEach(x => L.push(ev.allDay ? 'EXDATE;VALUE=DATE:' + x.replace(/-/g, '') : 'EXDATE;TZID=Asia/Seoul:' + dt(x, ev.start)));
      }
      L.push('SUMMARY:' + icsEscape(ev.title));
      if (ev.loc) L.push('LOCATION:' + icsEscape(ev.loc));
      if (ev.note) L.push('DESCRIPTION:' + icsEscape(ev.note));
      L.push('END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.map(icsFold).join('\r\n') + '\r\n';
  }
  function download(name, text, type) {
    const blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }

  /* ------------------------------------------------------------------
     HTML 이스케이프 · 간단 해시
     ------------------------------------------------------------------ */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = p => (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* 저장소 — localStorage (실서비스: PostgreSQL · 아래 스키마 참조) */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('bureau:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('bureau:' + k, JSON.stringify(v)); } catch (e) { /* 저장 불가 환경 */ } },
    del(k) { try { localStorage.removeItem('bureau:' + k); } catch (e) { /* noop */ } }
  };

  W.B = {
    icon, LOGO, pad, iso, parse, addDays, dow, diffDays, startOfWeek, toMin, toHM, WD, fmtMD, fmtKD, fmtYMK, fmtT, fmtShortT, durLabel, ago,
    HOLIDAYS, isOff, nextBiz, prevBiz, occurrences, ruleLabel, nthWeekdayOf, parseQuick, overlaps, dayItems, conflictsFor, freeSlots,
    toICS, download, esc, uid, store
  };
})(window);
