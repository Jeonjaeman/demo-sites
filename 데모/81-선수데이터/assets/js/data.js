/* ATHLEDGER — 가상 데이터 (선수 · 제품 · 세션 · IMU 합성 시계열 · 지표 계산)
   ★ 전부 가상입니다. 실존 인물·단체·제품과 무관합니다.
   IMU 시계열은 세션 ID를 시드로 한 결정적 난수로 합성하고, 지표(비대칭·회전 범위·부위 부하)는 그 시계열에서 실제로 계산합니다. */
(function (W) {
  'use strict';

  /* ---------- 결정적 난수 ---------- */
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const gauss = r => (r() + r() + r() - 1.5) * 1.63; // 근사 정규 (속도 우선)

  /* ---------- 종목 · 분류 ----------
     분류 코드는 국제 장애인 스포츠 분류 체계의 상지 손상 등급 표기를 참고한 예시입니다 (연구 메모 참조) */
  const SPORTS = {
    track: { name: '육상 단거리', unit: '트랙', cadence: 2.9, rotation: 28, tilt: 6, load: 1.0, cls: ['T46', 'T47'] },
    swim: { name: '수영', unit: '풀', cadence: 0.9, rotation: 42, tilt: 9, load: 0.8, cls: ['S9', 'S10'] },
    cycle: { name: '사이클', unit: '벨로드롬', cadence: 1.5, rotation: 9, tilt: 4, load: 0.7, cls: ['C4', 'C5'] },
    tabletennis: { name: '탁구', unit: '테이블', cadence: 1.2, rotation: 38, tilt: 7, load: 0.75, cls: ['Class 10'] },
    archery: { name: '양궁', unit: '사대', cadence: 0.15, rotation: 6, tilt: 3, load: 0.35, cls: ['W2', 'Open'] },
    badminton: { name: '배드민턴', unit: '코트', cadence: 1.6, rotation: 34, tilt: 8, load: 0.9, cls: ['SU5'] },
    rowing: { name: '조정', unit: '수로', cadence: 0.55, rotation: 14, tilt: 11, load: 0.95, cls: ['PR3'] },
    taekwondo: { name: '태권도', unit: '매트', cadence: 1.1, rotation: 46, tilt: 10, load: 1.0, cls: ['K44'] }
  };
  const AMP_LEVELS = { hand: '손목 이하(손)', forearm: '아래팔(전완)', upperarm: '위팔(상완)', shoulder: '어깨 관절 이하', limited: '기능 제한(절단 아님)' };

  /* ---------- 선수 (익명 ID만 — 실명·연락처는 시스템 밖 대조표) ---------- */
  const ATHLETES = [
    { id: 'ATH-0001', initials: 'K.M', sport: 'track', cls: 'T47', amp: { side: 'L', level: 'forearm' }, sex: 'F', birthYear: 1999, height: 166, weight: 57, chest: 86, underbust: 73, shoulder: 38, dominant: 'R', joined: '2026-08-04', note: '왼쪽 전완 절단 · 의수 미착용으로 훈련' },
    { id: 'ATH-0002', initials: 'J.S', sport: 'swim', cls: 'S9', amp: { side: 'R', level: 'upperarm' }, sex: 'F', birthYear: 2002, height: 171, weight: 62, chest: 90, underbust: 76, shoulder: 40, dominant: 'L', joined: '2026-08-04', note: '오른쪽 상완 절단 · 자유형 주종목' },
    { id: 'ATH-0003', initials: 'P.H', sport: 'tabletennis', cls: 'Class 10', amp: { side: 'L', level: 'hand' }, sex: 'F', birthYear: 1996, height: 160, weight: 54, chest: 84, underbust: 71, shoulder: 37, dominant: 'R', joined: '2026-08-11', note: '왼손 부분 절단' },
    { id: 'ATH-0004', initials: 'L.Y', sport: 'cycle', cls: 'C5', amp: { side: 'R', level: 'limited' }, sex: 'F', birthYear: 1994, height: 168, weight: 60, chest: 88, underbust: 74, shoulder: 39, dominant: 'L', joined: '2026-08-11', note: '오른팔 상완신경총 손상 — 기능 제한' },
    { id: 'ATH-0005', initials: 'C.E', sport: 'archery', cls: 'Open', amp: { side: 'L', level: 'shoulder' }, sex: 'F', birthYear: 1991, height: 163, weight: 59, chest: 89, underbust: 75, shoulder: 38, dominant: 'R', joined: '2026-08-18', note: '왼쪽 어깨 관절 이하 절단 · 발·입 활 보조 장치' },
    { id: 'ATH-0006', initials: 'O.J', sport: 'badminton', cls: 'SU5', amp: { side: 'R', level: 'forearm' }, sex: 'F', birthYear: 2000, height: 165, weight: 56, chest: 85, underbust: 72, shoulder: 38, dominant: 'L', joined: '2026-08-18', note: '오른쪽 전완 절단' },
    { id: 'ATH-0007', initials: 'S.R', sport: 'rowing', cls: 'PR3', amp: { side: 'L', level: 'upperarm' }, sex: 'F', birthYear: 1997, height: 174, weight: 66, chest: 92, underbust: 78, shoulder: 41, dominant: 'R', joined: '2026-09-01', note: '왼쪽 상완 절단 · 의수 착용 노젓기' },
    { id: 'ATH-0008', initials: 'H.N', sport: 'taekwondo', cls: 'K44', amp: { side: 'R', level: 'hand' }, sex: 'F', birthYear: 2003, height: 162, weight: 55, chest: 85, underbust: 72, shoulder: 37, dominant: 'L', joined: '2026-09-01', note: '오른손 절단' },
    { id: 'ATH-0009', initials: 'B.A', sport: 'track', cls: 'T46', amp: { side: 'L', level: 'limited' }, sex: 'F', birthYear: 1998, height: 169, weight: 58, chest: 87, underbust: 73, shoulder: 39, dominant: 'R', joined: '2026-09-15', note: '왼팔 선천성 기능 제한 · 400m' }
  ];

  /* ---------- 동의 · 위임 (F07 · F08 · F09 · F17) ---------- */
  const CONSENTS = {
    'ATH-0001': { personal: true, sensitive: true, research: true, version: 'v1.2', date: '2026-08-04', irb: 'P01-202608-01-004', retainUntil: '2029-11-30' },
    'ATH-0002': { personal: true, sensitive: true, research: true, version: 'v1.2', date: '2026-08-04', irb: 'P01-202608-01-004', retainUntil: '2029-11-30' },
    'ATH-0003': { personal: true, sensitive: true, research: false, version: 'v1.2', date: '2026-08-11', irb: '', retainUntil: '2029-11-30' },
    'ATH-0004': { personal: true, sensitive: true, research: true, version: 'v1.2', date: '2026-08-11', irb: 'P01-202608-01-004', retainUntil: '2029-11-30' },
    'ATH-0005': { personal: true, sensitive: true, research: true, version: 'v1.1', date: '2026-08-18', irb: 'P01-202608-01-004', retainUntil: '2027-01-15' },
    'ATH-0006': { personal: true, sensitive: true, research: true, version: 'v1.2', date: '2026-08-18', irb: 'P01-202608-01-004', retainUntil: '2029-11-30' },
    'ATH-0007': { personal: true, sensitive: true, research: true, version: 'v1.2', date: '2026-09-01', irb: 'P01-202608-01-004', retainUntil: '2029-11-30' },
    'ATH-0008': { personal: true, sensitive: true, research: true, version: 'v1.2', date: '2026-09-01', irb: 'P01-202608-01-004', retainUntil: '2029-11-30' },
    'ATH-0009': { personal: true, sensitive: false, research: false, version: 'v1.2', date: '2026-09-15', irb: '', retainUntil: '2029-11-30' } // 민감정보 동의 미완 → 업로드 차단 재현
  };
  const DELEGATIONS = [
    { athlete: 'ATH-0002', delegate: 'C-02', name: '코치 C-02', scope: 'input', until: '2026-12-31' },
    { athlete: 'ATH-0005', delegate: 'C-01', name: '코치 C-01', scope: 'input+view', until: '2026-11-30' }
  ];
  // 접속기록 시드 (고시: 민감정보 처리 시 2년 보관)
  const LOG_SEED = [
    { at: '2026-10-16 09:12', who: 'admin-01', role: '관리자', target: 'ATH-0006', action: '세션 상세 조회', detail: 'SES-034' },
    { at: '2026-10-16 09:04', who: 'admin-01', role: '관리자', target: '전체', action: '자료 추출 (xlsx)', detail: '세션 요약 41행 · 준식별자 제외' },
    { at: '2026-10-15 17:40', who: 'vault-01', role: '매핑 담당', target: 'ATH-0003', action: '매핑 보관함 열람', detail: '사유: 동의서 재서명 연락' },
    { at: '2026-10-15 16:22', who: 'C-02', role: '관계자(위임)', target: 'ATH-0002', action: 'CSV 업로드(대리)', detail: 'SES-010 · imu_ath0002_20261015.csv' },
    { at: '2026-10-15 11:05', who: 'ATH-0001', role: '선수', target: 'ATH-0001', action: '본인 세션 조회', detail: 'SES-005' },
    { at: '2026-10-14 15:48', who: 'ATH-0001', role: '선수', target: 'ATH-0004', action: '타 선수 세션 조회 시도', detail: '/session/SES-019 → 0건 (권한 거부)', denied: true },
    { at: '2026-10-14 10:30', who: 'maint-01', role: '수탁사', target: '전체', action: '스키마 마이그레이션 적용', detail: '0007_session_metric.sql' },
    { at: '2026-10-13 14:02', who: 'admin-02', role: '관리자', target: 'ATH-0009', action: '선수 등록', detail: '민감정보 동의 미완' }
  ];
  const PERM_LOG = [
    { at: '2026-10-10 10:00', who: 'owner', action: '권한 부여', target: 'maint-01', detail: '수탁사 운영 계정 (위탁 계약 2026-10-10~2027-10-09)' },
    { at: '2026-09-01 09:30', who: 'owner', action: '권한 부여', target: 'vault-01', detail: '매핑 보관함 열람' },
    { at: '2026-08-04 09:00', who: 'owner', action: '권한 부여', target: 'admin-01 · admin-02', detail: '선수관리 · 제품관리 · 추출 · 검수' }
  ];

  /* ---------- 제품 (스포츠브라 · 드로즈) ---------- */
  const PRODUCTS = [
    { id: 'SB-A', type: 'bra', name: '어댑트 브라 A', desc: '한손 착용 전면 자석 클로저 · IMU 포켓 앞중심', versions: ['v0.9', 'v1.0', 'v1.1'], sizes: ['70B', '70C', '75A', '75B', '75C', '80B', '80C', '85B'], sensorPocket: '앞중심 하단밴드', current: 'v1.1' },
    { id: 'SB-B', type: 'bra', name: '어댑트 브라 B', desc: '크로스백 · 비대칭 스트랩 폭 조절 · IMU 포켓 등 상부', versions: ['v0.5', 'v1.0'], sizes: ['70B', '75B', '75C', '80B', '80C'], sensorPocket: '등 상부 견갑 사이', current: 'v1.0' },
    { id: 'DR-A', type: 'drawers', name: '어댑트 드로즈 A', desc: '한손 착용 와이드 밴드 · 자기센서 밴드 좌우', versions: ['v1.0', 'v1.1'], sizes: ['S', 'M', 'L', 'XL'], sensorPocket: '밴드 좌·우', current: 'v1.1' }
  ];
  // 착용 평가 척도 (5점 리커트) — 연구 메모의 의류 착용감 평가 항목을 참고한 예시
  const FIT_ITEMS = [
    { key: 'band', label: '밑단 밴드 압박', low: '너무 헐렁', high: '너무 조임' },
    { key: 'strap', label: '어깨끈 쏠림', low: '안 쏠림', high: '한쪽으로 심하게 쏠림' },
    { key: 'cup', label: '컵 밀착', low: '뜸', high: '눌림' },
    { key: 'rideup', label: '밑단 말려 올라감', low: '없음', high: '자주' },
    { key: 'motion', label: '동작 제한감', low: '없음', high: '심함' },
    { key: 'donning', label: '한손 착탈 난이도', low: '쉬움', high: '매우 어려움' },
    { key: 'sensor', label: '센서 이물감', low: '못 느낌', high: '거슬림' }
  ];

  /* ---------- 세션 생성 ---------- */
  const pad = n => String(n).padStart(2, '0');
  const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const TODAY = '2026-10-16';
  function buildSessions() {
    const out = []; let seq = 1;
    for (const a of ATHLETES) {
      const r = rng(hashStr(a.id));
      const n = 4 + Math.floor(r() * 4);
      let d = a.joined;
      const bra = r() < .7 ? 'SB-A' : 'SB-B'; const braP = PRODUCTS.find(p => p.id === bra);
      const braSize = braP.sizes[Math.floor(r() * braP.sizes.length)];
      const drSize = ['S', 'M', 'L'][Math.floor(r() * 3)];
      for (let i = 0; i < n; i++) {
        d = addDays(d, 4 + Math.floor(r() * 9)); if (d > TODAY) break;
        const sp = SPORTS[a.sport];
        const dur = Math.round((sp.cadence > 1 ? 10 : 16) + r() * 22) * 60; // 초
        const h = 9 + Math.floor(r() * 9), m = [0, 15, 30, 45][Math.floor(r() * 4)];
        const type = i === 0 ? '기초 실측' : r() < .2 ? '모의 경기' : '훈련';
        const vIdx = Math.min(braP.versions.length - 1, Math.floor(i / 2));
        const id = 'SES-' + pad(seq++).padStart(3, '0');
        const hasCsv = r() < .82;
        // 측정 조건 프로필 (F03) — 세션마다 기록, 지문으로 비교 가능성 판정
        const profile = {
          sensorId: 'IMU-' + (r() < .8 ? '07A' : '12B'), firmware: i < 3 ? '1.2.0' : '1.3.1', hz: r() < .9 ? 100 : 200,
          position: braP.id === 'SB-A' ? '앞중심 하단밴드' : '등 상부', orientation: '정방향',
          prosthesis: a.amp.level === 'limited' ? '해당 없음' : (r() < .55 ? '없음' : r() < .5 ? '일상용' : '스포츠용'),
          calibration: r() < .85, venue: r() < .7 ? '실내' : '실외'
        };
        out.push({ id, athlete: a.id, date: d, time: pad(h) + ':' + pad(m), duration: dur, sport: a.sport, type, profile,
          bra: braP.id, braVersion: braP.versions[vIdx], braSize, drawers: 'DR-A', drawersVersion: i < 2 ? 'v1.0' : 'v1.1', drawersSize: drSize,
          csv: hasCsv ? { file: 'imu_' + a.id.toLowerCase().replace('-', '') + '_' + d.replace(/-/g, '') + '.csv', hz: 100, rows: dur * 100, uploadedAt: d + ' ' + pad(h + 1) + ':' + pad(m + 5), by: i % 3 === 0 ? 'admin' : 'athlete', fingerprint: hashStr(id).toString(16).padStart(8, '0') + hashStr(id + 'x').toString(16).padStart(8, '0'), mappingVersion: vIdx === 0 ? 'map-v1' : 'map-v2' } : null,
          rpe: 4 + Math.floor(r() * 6), note: ['', '', '왼쪽 어깨 뻐근함 호소', '밴드 땀에 젖어 말림', '센서 포켓 위치 조정 후 재측정', '의수 미착용 세션'][Math.floor(r() * 6)],
          fit: i % 2 === 0 ? FIT_ITEMS.reduce((o, it) => { o[it.key] = 1 + Math.floor(r() * 5); return o; }, {}) : null,
          fitComment: i % 2 === 0 ? ['밑단이 운동 중 조금 말려 올라감', '어깨끈이 절단 반대쪽으로 쏠림', '전반적으로 편안', '센서 포켓이 숨 쉴 때 느껴짐', '한손으로 착용 1분 이내'][Math.floor(r() * 5)] : '' });
      }
    }
    return out.sort((x, y) => (y.date + y.time).localeCompare(x.date + x.time));
  }

  /* ---------- IMU 합성 ----------
     앞중심 IMU 1개: roll(좌우 기울기) · pitch(앞뒤) · yaw(회전) + 각속도 + 가속도 + 자기.
     절단 반대쪽(건측)으로의 보상 움직임: 건측 방향 roll 평균 오프셋 + 건측 회전 진폭 증가.
     부호 규약: roll > 0 = 선수 오른쪽으로 기울기, yaw > 0 = 오른쪽 회전. */
  const cache = new Map();
  function imu(session, athlete) {
    if (cache.has(session.id)) return cache.get(session.id);
    const r = rng(hashStr(session.id) ^ 0x9e3779b9);
    const sp = SPORTS[session.sport];
    const hz = 50; const n = Math.min(session.duration * hz, 50 * 60 * 20); // 차트·지표용 합성은 최대 20분 (원본 CSV는 100Hz 전체 행 수로 표기)
    const sound = athlete.amp.side === 'L' ? 1 : -1; // 건측 = 절단 반대쪽. +1 = 오른쪽
    const sev = { hand: .35, forearm: .6, upperarm: .8, shoulder: 1, limited: .45 }[athlete.amp.level];
    // 세션 번호가 뒤로 갈수록 제품 버전·적응으로 비대칭이 조금 준다 (데모 추이용)
    const sesIdx = parseInt(session.id.slice(4), 10);
    const adapt = Math.max(.55, 1 - ((sesIdx * 7) % 13) / 40);
    const bias = sound * sp.tilt * .2 * sev * adapt;          // roll 평균 오프셋(°) — 건측으로 살짝 기운 자세
    const rotAsym = 1 + .55 * sev * adapt;                     // 건측 회전 진폭 배율
    const tiltAsym = 1 + .7 * sev * adapt;                     // 건측 방향 기울기 반주기 진폭 배율
    const t = new Float32Array(n), roll = new Float32Array(n), pitch = new Float32Array(n), yaw = new Float32Array(n);
    const gx = new Float32Array(n), gy = new Float32Array(n), gz = new Float32Array(n), ax = new Float32Array(n), ay = new Float32Array(n), az = new Float32Array(n), mx = new Float32Array(n), my = new Float32Array(n), mz = new Float32Array(n);
    let drift = 0, lowR = 0, lowP = 0, lowY = 0; const f = sp.cadence; const phase0 = r() * 6.28;
    // 운동 강도 포락선: 워밍업 → 본 운동(인터벌) → 쿨다운
    const env = i => { const x = i / n; const warm = .62 + .38 * Math.min(1, x / .06); const cool = x > .88 ? Math.max(.35, 1 - (x - .88) / .12) : 1; const interval = .8 + .2 * Math.sin(x * 40 + phase0); return warm * cool * interval; };
    const calib = session.profile ? session.profile.calibration !== false : true; // 시작 프로토콜: 5초 정지 + 왼쪽 기울이기 3초
    const flipped = session.profile && session.profile.orientation === '반전' ? -1 : 1;
    for (let i = 0; i < n; i++) {
      const tt = i / hz; t[i] = tt; let e = env(i);
      if (calib && tt < 8) {
        const rest = tt < 5; lowR += (gauss(r) * .3 - lowR) * .02;
        roll[i] = (rest ? bias * .4 : -11 * Math.min(1, (tt - 5) / .6)) * flipped + lowR + gauss(r) * .25; pitch[i] = -1 + gauss(r) * .25; yaw[i] = gauss(r) * .3 + (rest ? 0 : 1.5);
        if (i > 0) { gx[i] = (roll[i] - roll[i - 1]) * hz; gy[i] = (pitch[i] - pitch[i - 1]) * hz; gz[i] = (yaw[i] - yaw[i - 1]) * hz; }
        ax[i] = Math.sin(roll[i] * Math.PI / 180) + gauss(r) * .01; ay[i] = Math.cos(roll[i] * Math.PI / 180) + gauss(r) * .01; az[i] = Math.sin(pitch[i] * Math.PI / 180) + gauss(r) * .01;
        mx[i] = 22 + gauss(r) * .3; my[i] = -40 + gauss(r) * .3; mz[i] = gauss(r) * .3;
        continue;
      }
      lowR += (gauss(r) * .8 - lowR) * .02; lowP += (gauss(r) * .6 - lowP) * .02; lowY += (gauss(r) * 1.2 - lowY) * .01;
      drift += gauss(r) * .0006;
      const ph = 2 * Math.PI * f * tt + phase0;
      const s = Math.sin(ph);
      // 회전: 건측 반주기 진폭 ↑
      const amp = sp.rotation * e * (s * sound > 0 ? rotAsym : 1);
      yaw[i] = amp * s + lowY * 3 + drift * 10 + gauss(r) * .9;
      const sr = Math.sin(ph + .9);
      roll[i] = bias * e + sp.tilt * .9 * e * sr * (sr * sound > 0 ? tiltAsym : 1) + lowR + gauss(r) * .5;
      pitch[i] = -3 * e + sp.tilt * .4 * e * Math.sin(2 * ph) + lowP + gauss(r) * .5;
      if (i > 0) { gx[i] = (roll[i] - roll[i - 1]) * hz; gy[i] = (pitch[i] - pitch[i - 1]) * hz; gz[i] = (yaw[i] - yaw[i - 1]) * hz; }
      // 가속도(g): 중력 + 스트라이드 충격
      const impact = sp.load * e * Math.max(0, Math.sin(2 * ph)) ** 6 * 1.6;
      ax[i] = Math.sin(roll[i] * Math.PI / 180) * 1 + gauss(r) * .04 + (sound * .05 * e);
      ay[i] = Math.cos(roll[i] * Math.PI / 180) * 1 + impact + gauss(r) * .05;
      az[i] = Math.sin(pitch[i] * Math.PI / 180) + gauss(r) * .04;
      // 자기(µT): 지자기 약 50 + 자기센서 밴드 근접 신호(호흡·밴드 들뜸)
      const yr = yaw[i] * Math.PI / 180;
      mx[i] = 22 * Math.cos(yr) + 3 * Math.sin(tt * .35) + gauss(r) * .4; my[i] = -40 + gauss(r) * .4 + (session.note && session.note.indexOf('말림') >= 0 ? 6 * Math.max(0, Math.sin(tt * .02)) : 0); mz[i] = 22 * Math.sin(yr) + gauss(r) * .4;
    }
    for (let i = 0; i < n; i++) { gx[i] = clampAbs(gx[i], 400); gy[i] = clampAbs(gy[i], 400); gz[i] = clampAbs(gz[i], 600); }
    const res = { hz, n, t, roll, pitch, yaw, gx, gy, gz, ax, ay, az, mx, my, mz };
    if (cache.size > 6) cache.delete(cache.keys().next().value);
    cache.set(session.id, res);
    return res;
  }
  const clampAbs = (v, m) => v > m ? m : v < -m ? -m : v;

  /* ---------- 지표 계산 (실제 계산) ----------
     · 좌우 비대칭 지수: 기울기(roll)가 ±θ 밖에 머문 시간의 좌우 차이 → (R − L)/(R + L) × 100 (+ = 오른쪽 치우침)
     · 회전 범위: 왼쪽/오른쪽 피크 평균(°), 비율
     · 부하: 각속도 RMS (°/s) · 가속도 충격 수
     · 부위 부하(히트맵 0~1): 채널 에너지를 부위에 배분 — 회전→허리·등, 기울기→측면·어깨(치우친 쪽), 충격→골반·다리 */
  function metrics(series, athlete, range) {
    const [i0, i1] = range ? [Math.max(0, Math.floor(range[0] * series.hz)), Math.min(series.n, Math.ceil(range[1] * series.hz))] : [0, series.n];
    const th = 2; let tL = 0, tR = 0, sumRoll = 0, sumPitch = 0, cnt = 0, g2 = 0, impacts = 0; // ±2° 밖에 머문 시간으로 좌우 치우침 계산
    const peaksL = [], peaksR = []; let prev = 0, prevD = 0; let yawMin = Infinity, yawMax = -Infinity;
    for (let i = i0; i < i1; i++) {
      const ro = series.roll[i]; if (ro > th) tR++; else if (ro < -th) tL++;
      sumRoll += ro; sumPitch += series.pitch[i]; cnt++;
      g2 += series.gx[i] ** 2 + series.gy[i] ** 2 + series.gz[i] ** 2;
      if (series.ay[i] > 1.9 && series.ay[i - 1] <= 1.9) impacts++;
      const y = series.yaw[i]; if (y < yawMin) yawMin = y; if (y > yawMax) yawMax = y;
      const d = y - prev; if (i > i0 + 1) { if (prevD > 0 && d <= 0 && y > 4) peaksR.push(y); if (prevD < 0 && d >= 0 && y < -4) peaksL.push(-y); } prev = y; prevD = d;
    }
    const asym = (tR + tL) ? (tR - tL) / (tR + tL) * 100 : 0;
    const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
    const rotL = mean(peaksL), rotR = mean(peaksR);
    const rotRatio = rotL && rotR ? rotR / rotL : 1;
    const rms = Math.sqrt(g2 / Math.max(1, cnt));
    const sound = athlete.amp.side === 'L' ? 'R' : 'L';
    const toward = asym > 0 ? 'R' : 'L';
    // 부위 부하 히트
    const nz = Math.min(1, rms / 140); const tiltMag = Math.min(1, Math.abs(asym) / 40); const rot = Math.min(1, Math.abs(rotRatio - 1) / .6);
    const side = s => s === toward ? 1 : .35;
    const heat = {
      shoulderL: .25 * nz + .65 * tiltMag * side('L') + .3 * rot * (sound === 'L' ? 1 : .3), shoulderR: .25 * nz + .65 * tiltMag * side('R') + .3 * rot * (sound === 'R' ? 1 : .3),
      upperBackL: .3 * nz + .45 * rot * (sound === 'L' ? 1 : .4), upperBackR: .3 * nz + .45 * rot * (sound === 'R' ? 1 : .4),
      chestL: .2 * nz + .25 * tiltMag * side('L'), chestR: .2 * nz + .25 * tiltMag * side('R'),
      lowBackL: .35 * nz + .5 * rot * (sound === 'L' ? .9 : .5), lowBackR: .35 * nz + .5 * rot * (sound === 'R' ? .9 : .5),
      abdL: .15 * nz + .2 * tiltMag * side('L'), abdR: .15 * nz + .2 * tiltMag * side('R'),
      pelvis: .3 * Math.min(1, impacts / 600), uarmL: .2 * nz * (sound === 'L' ? 1.4 : .5), uarmR: .2 * nz * (sound === 'R' ? 1.4 : .5),
      neck: .1 * nz + .2 * tiltMag
    };
    for (const k in heat) heat[k] = Math.max(0, Math.min(1, heat[k]));
    return { asym, tL, tR, meanRoll: sumRoll / Math.max(1, cnt), meanPitch: sumPitch / Math.max(1, cnt), rotL, rotR, rotRatio, yawMin, yawMax, rms, impacts, heat, toward, sound, samples: cnt, seconds: cnt / series.hz };
  }

  // 전체 세션 요약 (목록·추이용) — 메모이즈
  const sumCache = new Map();
  function summary(session) {
    if (sumCache.has(session.id)) return sumCache.get(session.id);
    const a = ATHLETES.find(x => x.id === session.athlete);
    let m = null;
    if (session.csv) { const s = imu(session, a); m = metrics(s, a); }
    const res = m ? { asym: m.asym, rotRatio: m.rotRatio, rms: m.rms, impacts: m.impacts, toward: m.toward, sound: m.sound, rotL: m.rotL, rotR: m.rotR } : null;
    sumCache.set(session.id, res); return res;
  }

  // 다운샘플 (차트용) — 최대 maxN 점. 구간마다 첫 키의 최소·최대 점을 남겨 진동 진폭을 보존한다 (평균을 내면 진동이 사라짐).
  function downsample(series, keys, maxN, range) {
    const [i0, i1] = range ? [Math.max(0, Math.floor(range[0] * series.hz)), Math.min(series.n, Math.ceil(range[1] * series.hz))] : [0, series.n];
    const len = i1 - i0; const out = { t: [] }; keys.forEach(k => out[k] = []);
    if (len <= maxN) { for (let i = i0; i < i1; i++) { out.t.push(series.t[i]); for (const k of keys) out[k].push(series[k][i]); } return out; }
    const buckets = Math.max(1, Math.floor(maxN / 2)); const step = len / buckets; const k0 = series[keys[0]];
    for (let b = 0; b < buckets; b++) {
      const s = i0 + Math.floor(b * step), e = Math.min(i1, i0 + Math.floor((b + 1) * step)); if (e <= s) continue;
      let mi = s, ma = s; for (let j = s; j < e; j++) { if (k0[j] < k0[mi]) mi = j; if (k0[j] > k0[ma]) ma = j; }
      const idx = mi === ma ? [mi] : (mi < ma ? [mi, ma] : [ma, mi]);
      for (const i of idx) { out.t.push(series.t[i]); for (const k of keys) out[k].push(series[k][i]); }
    }
    return out;
  }

  /* ---------- 저장소 (localStorage 오버레이 — 업로드·평가·선수 편집) ---------- */
  const KEY = 'athledger.v1';
  let store = null;
  function load() { if (store) return store; try { store = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { store = null; } if (!store) store = { sessions: {}, athletes: {}, uploads: [], log: [] }; return store; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 용량 초과 무시 */ } }
  function reset() { store = null; try { localStorage.removeItem(KEY); } catch (e) { } }
  function log(entry) { const s = load(); const d = new Date(); const at = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); s.log.unshift(Object.assign({ at }, entry)); s.log = s.log.slice(0, 200); save(); }

  const BASE_SESSIONS = buildSessions();
  function sessions() {
    const s = load(); const list = BASE_SESSIONS.map(x => Object.assign({}, x, s.sessions[x.id] || {}));
    for (const id in s.sessions) if (!BASE_SESSIONS.find(b => b.id === id)) list.push(s.sessions[id]);
    return list.sort((x, y) => (y.date + y.time).localeCompare(x.date + x.time));
  }
  function athletes() { const s = load(); return ATHLETES.map(a => Object.assign({}, a, s.athletes[a.id] || {})); }
  function patchSession(id, patch) { const s = load(); s.sessions[id] = Object.assign({}, s.sessions[id] || {}, patch); sumCache.delete(id); cache.delete(id); save(); }
  function patchAthlete(id, patch) { const s = load(); s.athletes[id] = Object.assign({}, s.athletes[id] || {}, patch); save(); }

  // 측정 조건 지문 — 비교 가능성 판정 (F03)
  const PROFILE_KEYS = [['sensorId', '센서'], ['firmware', '펌웨어'], ['hz', '샘플링'], ['position', '장착 위치'], ['orientation', '방향'], ['prosthesis', '의수'], ['sport', '종목'], ['calibration', '보정 동작'], ['venue', '장소']];
  function profileOf(s) { const p = Object.assign({}, s.profile || {}); p.sport = s.sport; return p; }
  function profileDiff(a, b) { const pa = profileOf(a), pb = profileOf(b); return PROFILE_KEYS.filter(([k]) => String(pa[k]) !== String(pb[k])).map(([k, label]) => ({ key: k, label, a: fmtProf(k, pa[k]), b: fmtProf(k, pb[k]) })); }
  function fmtProf(k, v) { if (k === 'hz') return v + 'Hz'; if (k === 'calibration') return v ? '있음' : '없음'; if (k === 'sport') return (SPORTS[v] || {}).name || v; return String(v); }
  function profileFingerprint(s) { const p = profileOf(s); return hashStr(PROFILE_KEYS.map(([k]) => String(p[k])).join('|')).toString(16).padStart(8, '0'); }
  function consentOf(id) { const s = load(); return Object.assign({}, CONSENTS[id] || { personal: false, sensitive: false, research: false }, (s.consents || {})[id] || {}); }
  function patchConsent(id, patch) { const s = load(); s.consents = s.consents || {}; s.consents[id] = Object.assign({}, s.consents[id] || {}, patch); save(); }
  function accessLog() { const s = load(); return [...s.log.map(e => Object.assign({ role: e.role || '관리자' }, e)), ...LOG_SEED]; }

  W.DATA = { SPORTS, AMP_LEVELS, ATHLETES, PRODUCTS, FIT_ITEMS, TODAY, CONSENTS, DELEGATIONS, LOG_SEED, PERM_LOG, PROFILE_KEYS, imu, metrics, summary, downsample, sessions, athletes, patchSession, patchAthlete, profileOf, profileDiff, fmtProf, profileFingerprint, consentOf, patchConsent, accessLog, load, save, reset, log, rng, hashStr, addDays };
})(window);
