/* =====================================================
 * NEXA 22" 설문 키오스크 데모 — 공통 데이터 레이어
 * localStorage 기반. 탭 간 storage 이벤트 + 폴링으로 실시간 동기화.
 * ===================================================== */
const NX = (() => {
  const KEY = 'nx22_responses';
  const SEED_KEY = 'nx22_seeded_v1';

  /* ---------- 설문 정의 ---------- */
  const PRODUCT = 'NEXA One 스마트 공기청정기';

  const K1Q = [
    {
      id: 'q1',
      title: 'NEXA One에서 가장 마음에 드는 기능은 무엇인가요?',
      options: ['AI 자동 청정 모드', '초저소음 운전 (18dB)', '앱 원격 제어', '미니멀 디자인'],
      icons: ['🤖', '🔇', '📱', '🎨'],
    },
    {
      id: 'q2',
      title: '공기청정기 구매 시 가장 중요하게 보는 것은?',
      options: ['청정 성능', '소음 수준', '가격', '디자인'],
      icons: ['💨', '🔉', '💰', '🖼️'],
    },
    {
      id: 'q3',
      title: 'NEXA One의 적정 가격대는 얼마라고 생각하시나요?',
      options: ['30만원 미만', '30~50만원', '50~70만원', '70만원 이상'],
      icons: ['①', '②', '③', '④'],
    },
    {
      id: 'q4',
      title: 'NEXA One을 지인에게 추천할 의향이 있으신가요?',
      options: ['매우 있다', '있는 편이다', '보통이다', '없다'],
      icons: ['😍', '🙂', '😐', '🙁'],
    },
  ];

  const K2_FEATURES = [
    { tag: 'AI 청정',   icon: '🤖', title: 'AI 자동 청정 모드', img: 'assets/img/f1-ai.png',
      desc: '공기질 센서가 미세먼지·VOC를 실시간 감지하고, AI가 풍량을 스스로 조절합니다. 외출·취침 패턴까지 학습해 알아서 최적 모드로 전환됩니다.' },
    { tag: '헤파필터',  icon: '🌀', title: '4단계 H14 헤파필터', img: 'assets/img/f2-hepa.png',
      desc: '프리필터 → 활성탄 → H14 헤파 → UV-C 살균의 4단계 구조로 0.01㎛ 초미세입자를 99.995% 제거합니다. 필터 수명은 앱에서 실시간 확인.' },
    { tag: '초저소음',  icon: '🔇', title: '초저소음 18dB 설계', img: 'assets/img/f3-silent.png',
      desc: 'BLDC 모터와 유체역학 팬 블레이드로 수면 모드 시 나뭇잎 스치는 소리보다 조용한 18dB을 구현했습니다. 침실·서재에서도 존재감 없이 작동합니다.' },
    { tag: 'IoT 연동',  icon: '📱', title: '스마트홈 IoT 연동', img: 'assets/img/f4-iot.png',
      desc: '전용 앱은 물론 구글 홈·스마트싱스와 연동됩니다. 외부에서 공기질 확인, 원격 제어, 자동화 루틴 설정까지 한 번에.' },
    { tag: '에너지',    icon: '⚡', title: '에너지소비효율 1등급', img: 'assets/img/f5-energy.png',
      desc: '24시간 가동해도 한 달 전기료 약 1,900원 수준. 인버터 제어로 불필요한 전력 낭비를 차단한 1등급 제품입니다.' },
    { tag: '디자인',    icon: '🎨', title: '미니멀 패브릭 디자인', img: 'assets/img/f6-design.png',
      desc: '북유럽 감성의 패브릭 마감과 우드 스탠드로 가전이 아닌 가구처럼 공간에 스며듭니다. 3가지 컬러(샌드·차콜·포레스트).' },
  ];

  const K2Q = {
    title: 'NEXA One에서 가장 기대되는 특장점을 골라주세요!',
    options: K2_FEATURES.map(f => f.title),
  };

  /* ---------- 저장소 ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }
  function save(arr) {
    localStorage.setItem(KEY, JSON.stringify(arr));
  }
  function add(resp) {
    const arr = load();
    arr.push(Object.assign({
      id: 'R' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ts: new Date().toISOString(),
    }, resp));
    save(arr);
    return arr;
  }
  function clearAll() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(SEED_KEY);
  }

  /* ---------- 시연용 시드 데이터 ---------- */
  function weightedPick(weights) {
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r < 0) return i; }
    return weights.length - 1;
  }
  function randomTs(hoursBack) {
    return new Date(Date.now() - Math.random() * hoursBack * 3600 * 1000).toISOString();
  }
  function makeK1() {
    return {
      kiosk: 'K1',
      answers: [
        K1Q[0].options[weightedPick([5, 3, 3, 2])],
        K1Q[1].options[weightedPick([6, 2, 4, 2])],
        K1Q[2].options[weightedPick([2, 6, 3, 1])],
        K1Q[3].options[weightedPick([4, 5, 2, 1])],
      ],
    };
  }
  function makeK2() {
    return { kiosk: 'K2', pick: K2Q.options[weightedPick([6, 4, 5, 4, 3, 3])] };
  }
  function ensureSeed() {
    if (localStorage.getItem(SEED_KEY)) return;
    const arr = load();
    for (let i = 0; i < 46; i++) { const r = makeK1(); r.id = 'S1' + i; r.ts = randomTs(6); arr.push(r); }
    for (let i = 0; i < 63; i++) { const r = makeK2(); r.id = 'S2' + i; r.ts = randomTs(6); arr.push(r); }
    arr.sort((a, b) => a.ts < b.ts ? -1 : 1);
    save(arr);
    localStorage.setItem(SEED_KEY, '1');
  }
  function addDemoBurst(n) {
    const arr = load();
    for (let i = 0; i < (n || 5); i++) {
      const r = Math.random() < 0.45 ? makeK1() : makeK2();
      r.id = 'B' + Date.now().toString(36) + i;
      r.ts = new Date().toISOString();
      arr.push(r);
    }
    save(arr);
  }

  /* ---------- 통계 ---------- */
  function countK1(qIndex) {
    const q = K1Q[qIndex];
    const counts = q.options.map(() => 0);
    load().forEach(r => {
      if (r.kiosk !== 'K1' || !r.answers) return;
      const idx = q.options.indexOf(r.answers[qIndex]);
      if (idx >= 0) counts[idx]++;
    });
    return counts;
  }
  function countK2() {
    const counts = K2Q.options.map(() => 0);
    load().forEach(r => {
      if (r.kiosk !== 'K2') return;
      const idx = K2Q.options.indexOf(r.pick);
      if (idx >= 0) counts[idx]++;
    });
    return counts;
  }
  function totals() {
    const arr = load();
    return {
      all: arr.length,
      k1: arr.filter(r => r.kiosk === 'K1').length,
      k2: arr.filter(r => r.kiosk === 'K2').length,
      last: arr.length ? arr[arr.length - 1].ts : null,
    };
  }

  /* ---------- 실시간 감지 (다른 탭 + 폴링) ---------- */
  function onChange(cb) {
    window.addEventListener('storage', e => { if (e.key === KEY) cb(); });
    let snap = localStorage.getItem(KEY);
    setInterval(() => {
      const cur = localStorage.getItem(KEY);
      if (cur !== snap) { snap = cur; cb(); }
    }, 2000);
  }

  /* ---------- 엑셀(CSV) 다운로드 ---------- */
  function csvEscape(v) {
    v = String(v == null ? '' : v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function downloadCSV() {
    const arr = load();
    const header = ['응답ID', '키오스크', '응답일시',
      'K1-Q1 마음에 드는 기능', 'K1-Q2 구매 고려요소', 'K1-Q3 적정 가격대', 'K1-Q4 추천 의향',
      'K2 기대 특장점'];
    const rows = arr.map(r => [
      r.id,
      r.kiosk === 'K1' ? '키오스크1 (일반 설문)' : '키오스크2 (특장점 투표)',
      new Date(r.ts).toLocaleString('ko-KR'),
      r.answers ? r.answers[0] : '', r.answers ? r.answers[1] : '',
      r.answers ? r.answers[2] : '', r.answers ? r.answers[3] : '',
      r.pick || '',
    ]);
    const csv = '﻿' + [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'NEXA_설문응답_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  /* ---------- 1920×1080 고정 스테이지 스케일링 ---------- */
  function fitStage(sel) {
    const stage = document.querySelector(sel || '.stage');
    if (!stage) return;
    const fit = () => {
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
    };
    window.addEventListener('resize', fit);
    fit();
  }

  /* ---------- 키오스크 화면 제어 (제스처/스크롤 차단) ---------- */
  function lockKiosk() {
    ['contextmenu', 'selectstart', 'dragstart'].forEach(ev =>
      document.addEventListener(ev, e => e.preventDefault()));
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault());
    document.addEventListener('keydown', e => {
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && ['r', '+', '-', '0'].includes(e.key)))
        e.preventDefault();
    });
  }
  function fullscreenToggle(btn) {
    btn.addEventListener('click', () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    });
  }

  return {
    PRODUCT, K1Q, K2_FEATURES, K2Q,
    load, add, clearAll, ensureSeed, addDemoBurst,
    countK1, countK2, totals, onChange,
    downloadCSV, fitStage, lockKiosk, fullscreenToggle,
  };
})();
