/* ATHLEDGER — 입출력 모듈 (외부 라이브러리 없음)
   CSV  : BOM·구분자 자동 감지(, ; \t |) · 따옴표 · 헤더 추정 · 컬럼 자동 매핑(동의어 사전) · 행 단위 검증 · 샘플링 주기 추정 · 지문(중복 업로드)
   XLSX : 실제 .xlsx 파일 생성 (ZIP stored + sharedStrings 없는 inlineStr) — 엑셀에서 바로 열림
   CSV 내보내기는 UTF-8 BOM. 데모 데이터는 전부 가상입니다. */
(function (W) {
  'use strict';

  /* ---------------- CSV 파싱 ---------------- */
  function sniffDelimiter(text) {
    const head = text.slice(0, 4000).split(/\r?\n/).slice(0, 8).filter(Boolean);
    const cands = [',', ';', '\t', '|'];
    let best = ',', bestScore = -1;
    for (const d of cands) {
      const counts = head.map(l => l.split(d).length - 1);
      if (!counts.length) continue;
      const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
      const varc = counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length;
      const score = mean > 0 ? mean - varc * 2 : -1;
      if (score > bestScore) { bestScore = score; best = d; }
    }
    return best;
  }
  function parseRows(text, delim) {
    const rows = []; let row = [], field = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
  }
  // 센서 앱 CSV의 흔한 헤더 → 표준 채널. 센서 업체 규격이 바뀌어도 매핑 사전만 늘리면 된다.
  const CHANNELS = [
    { key: 't', label: '시간', unit: 's', syn: ['t', 'time', 'timestamp', 'ts', 'time_s', 'time(s)', 'sec', 'seconds', 'elapsed', 'millis', 'ms', '시간', '타임스탬프'] },
    { key: 'ax', label: '가속도 X', unit: 'g', syn: ['ax', 'acc_x', 'accx', 'accel_x', 'accelx', 'a_x', 'acceleration_x', '가속도x'] },
    { key: 'ay', label: '가속도 Y', unit: 'g', syn: ['ay', 'acc_y', 'accy', 'accel_y', 'accely', 'a_y', 'acceleration_y', '가속도y'] },
    { key: 'az', label: '가속도 Z', unit: 'g', syn: ['az', 'acc_z', 'accz', 'accel_z', 'accelz', 'a_z', 'acceleration_z', '가속도z'] },
    { key: 'gx', label: '각속도 X', unit: '°/s', syn: ['gx', 'gyro_x', 'gyrox', 'gyr_x', 'g_x', 'angular_x', '각속도x'] },
    { key: 'gy', label: '각속도 Y', unit: '°/s', syn: ['gy', 'gyro_y', 'gyroy', 'gyr_y', 'g_y', 'angular_y', '각속도y'] },
    { key: 'gz', label: '각속도 Z', unit: '°/s', syn: ['gz', 'gyro_z', 'gyroz', 'gyr_z', 'g_z', 'angular_z', '각속도z'] },
    { key: 'mx', label: '자기 X', unit: 'µT', syn: ['mx', 'mag_x', 'magx', 'magnet_x', 'm_x', '자기x'] },
    { key: 'my', label: '자기 Y', unit: 'µT', syn: ['my', 'mag_y', 'magy', 'magnet_y', 'm_y', '자기y'] },
    { key: 'mz', label: '자기 Z', unit: 'µT', syn: ['mz', 'mag_z', 'magz', 'magnet_z', 'm_z', '자기z'] },
    { key: 'roll', label: '롤(좌우 기울기)', unit: '°', syn: ['roll', 'euler_x', 'rollrad', 'roll_deg', '롤', '좌우기울기'] },
    { key: 'pitch', label: '피치(앞뒤 기울기)', unit: '°', syn: ['pitch', 'euler_y', 'pitch_deg', '피치', '앞뒤기울기'] },
    { key: 'yaw', label: '요(회전)', unit: '°', syn: ['yaw', 'heading', 'euler_z', 'yaw_deg', '요', '회전', 'heading_deg'] },
    { key: 'qw', label: '쿼터니언 W', unit: '', syn: ['qw', 'quat_w', 'q0', 'quaternion_w'] },
    { key: 'qx', label: '쿼터니언 X', unit: '', syn: ['qx', 'quat_x', 'q1', 'quaternion_x'] },
    { key: 'qy', label: '쿼터니언 Y', unit: '', syn: ['qy', 'quat_y', 'q2', 'quaternion_y'] },
    { key: 'qz', label: '쿼터니언 Z', unit: '', syn: ['qz', 'quat_z', 'q3', 'quaternion_z'] },
    { key: 'speed', label: '속도', unit: 'm/s', syn: ['speed', 'velocity', 'v', 'vel', 'speed_ms', '속도'] },
    { key: 'sensor', label: '센서 ID', unit: '', syn: ['sensor', 'sensor_id', 'device', 'device_id', 'node', 'id', '센서'] },
    { key: 'batt', label: '배터리', unit: '%', syn: ['batt', 'battery', 'bat', 'battery_pct'] }
  ];
  const normHeader = s => String(s || '').trim().toLowerCase().replace(/[\s()\-\.\[\]/°²]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  // 헤더에 붙은 단위 토큰 → 힌트. 예: Timestamp(ms) → t:'ms' · Roll(rad) → 'rad' · Acc_X(m/s2) → 'ms2'
  const UNIT_TOKENS = { ms: 'ms', millis: 'ms', msec: 'ms', s: 's', sec: 's', deg: 'deg', rad: 'rad', g: 'g', ms2: 'ms2', m_s2: 'ms2', mps2: 'ms2', dps: 'dps', deg_s: 'dps', ut: 'ut', pct: 'pct' };
  function stripUnit(n) {
    let hint = null;
    for (let k = 0; k < 2; k++) { // 끝 토큰 최대 2개까지 단위로 본다 (acc_x_m_s2)
      const m = n.match(/^(.*)_([a-z0-9]+)$/); if (!m) break;
      const tok = m[2];
      if (UNIT_TOKENS[tok]) { hint = hint || UNIT_TOKENS[tok]; n = m[1]; continue; }
      const m2 = n.match(/^(.*)_(m_s2|deg_s)$/); if (m2) { hint = hint || UNIT_TOKENS[m2[2]]; n = m2[1]; continue; }
      break;
    }
    return { n, hint };
  }
  function autoMap(headers) {
    const map = {}, hints = {}; const used = new Set();
    headers.forEach((h, i) => {
      const raw = normHeader(h); const { n, hint } = stripUnit(raw);
      const cands = [raw, n, raw.replace(/_/g, ''), n.replace(/_/g, '')];
      for (const ch of CHANNELS) {
        if (used.has(ch.key)) continue;
        if (ch.syn.some(s => cands.includes(s) || cands.includes(s.replace(/_/g, '')))) {
          map[i] = ch.key; used.add(ch.key); if (hint) hints[ch.key] = hint; break;
        }
      }
    });
    return Object.assign(map, { __hints: hints }); // {colIndex: channelKey, __hints:{key:unit}}
  }
  // 헤더 행이 있는지 추정: 첫 행에 숫자가 아닌 셀이 절반 이상
  function hasHeader(rows) {
    if (!rows.length) return false; const r = rows[0];
    const nonNum = r.filter(c => c.trim() !== '' && isNaN(Number(c))).length;
    return nonNum >= Math.ceil(r.length / 2);
  }
  const num = s => { if (s == null) return NaN; const t = String(s).trim().replace(/,/g, ''); if (t === '') return NaN; return Number(t); };

  /* 검증 — 행 단위 오류 목록 + 요약
     mapping: {colIndex: key}. 반환 { ok, rows:n, errors:[{line, col, msg}], warnings:[], stats:{hz, duration, gaps, dups}, data:{key:[...]} } */
  function validate(rows, mapping, opts) {
    opts = opts || {};
    const errors = [], warnings = [];
    const hints = Object.assign({}, mapping.__hints || {}, opts.hints || {});
    mapping = Object.fromEntries(Object.entries(mapping).filter(([k]) => k !== '__hints'));
    const keys = Object.values(mapping);
    const start = opts.headerRow === false ? 0 : 1;
    const data = {}; keys.forEach(k => data[k] = []);
    const required = opts.required || ['t'];
    for (const r of required) if (!keys.includes(r)) errors.push({ line: 1, col: '-', msg: '필수 채널 「' + chLabel(r) + '」에 매핑된 열이 없습니다', fatal: true });
    const hasMotion = keys.some(k => ['gx', 'gy', 'gz', 'roll', 'pitch', 'yaw', 'qw'].includes(k));
    if (!hasMotion) errors.push({ line: 1, col: '-', msg: '움직임 채널(각속도·롤/피치/요·쿼터니언) 중 하나 이상이 필요합니다', fatal: true });
    if (errors.some(e => e.fatal)) return { ok: false, rows: 0, errors, warnings, stats: {}, data };
    let bad = 0;
    for (let i = start; i < rows.length; i++) {
      const row = rows[i]; let rowBad = false;
      for (const ci in mapping) {
        const key = mapping[ci]; const raw = row[ci];
        if (key === 'sensor') { data[key].push(String(raw || '').trim()); continue; }
        const v = num(raw);
        if (isNaN(v)) {
          if (errors.length < 400) errors.push({ line: i + 1, col: key, msg: '「' + chLabel(key) + '」 열 값이 숫자가 아닙니다: ' + JSON.stringify(String(raw || '').slice(0, 20)) });
          rowBad = true; data[key].push(NaN);
        } else data[key].push(v);
      }
      if (rowBad) bad++;
    }
    // 시간축 검사
    const t = data.t || [];
    let unitScale = 1; // 초 단위로 정규화
    if (hints.t === 'ms') { unitScale = 1e-3; warnings.push({ msg: '헤더에 (ms)가 있어 시간을 초로 환산했습니다 (×0.001)', info: true }); }
    else if (t.length > 2) {
      const span = t[t.length - 1] - t[0];
      if (span > 1e9) { unitScale = 1e-3; warnings.push({ msg: '시간이 밀리초(또는 epoch ms)로 보여 초로 환산했습니다 (×0.001)' }); }
      else if (span > 36000) { unitScale = 1e-3; warnings.push({ msg: '시간 범위가 10시간을 넘어 밀리초로 간주해 초로 환산했습니다' }); }
    }
    const ts = t.map(v => v * unitScale);
    const t0 = ts[0]; for (let i = 0; i < ts.length; i++) ts[i] -= t0; // 0부터
    const epochStart = t0 > 1e9 ? t0 : null; // 절대 시각(epoch 초)이면 보관
    let nonMono = 0, dups = 0; const diffs = [];
    for (let i = 1; i < ts.length; i++) { const d = ts[i] - ts[i - 1]; if (d < 0) nonMono++; else if (d === 0) dups++; else diffs.push(d); }
    diffs.sort((a, b) => a - b);
    const med = diffs.length ? diffs[Math.floor(diffs.length / 2)] : 0;
    const hz = med > 0 ? 1 / med : 0;
    let gaps = 0, gapMax = 0;
    for (const d of diffs) if (med > 0 && d > med * 3) { gaps++; if (d > gapMax) gapMax = d; }
    if (nonMono) errors.push({ line: '-', col: 't', msg: '시간이 거꾸로 가는 행이 ' + nonMono + '개 있습니다 (센서 시계 재동기 의심)' });
    if (dups) warnings.push({ msg: '같은 시간이 연속으로 찍힌 행 ' + dups + '개 — 중복 샘플로 보고 평균 처리합니다' });
    if (gaps) warnings.push({ msg: '샘플 누락 구간 ' + gaps + '곳 (최대 ' + gapMax.toFixed(2) + '초) — 그래프에 끊김으로 표시합니다' });
    if (hz && (hz < 20 || hz > 1000)) warnings.push({ msg: '추정 샘플링 ' + hz.toFixed(0) + 'Hz — 일반적인 IMU(50~200Hz) 범위 밖입니다. 시간 단위를 확인하세요' });
    const duration = ts.length ? ts[ts.length - 1] : 0;
    if (duration < 10) warnings.push({ msg: '세션 길이가 ' + duration.toFixed(1) + '초로 매우 짧습니다' });
    // 값 범위 검사 (단위 추정)
    const rng = k => { const a = data[k]; if (!a) return null; let mx = 0; for (const v of a) if (!isNaN(v) && Math.abs(v) > mx) mx = Math.abs(v); return mx; };
    const amax = Math.max(rng('ax') || 0, rng('ay') || 0, rng('az') || 0);
    if (hints.ax === 'ms2' || hints.ay === 'ms2' || hints.az === 'ms2') warnings.push({ msg: '헤더 단위 (m/s²) → g로 환산했습니다 (÷9.80665)', fix: 'acc_ms2', info: true });
    else if (amax > 50) warnings.push({ msg: '가속도 최대 ' + amax.toFixed(0) + ' — m/s²로 보여 g로 환산했습니다 (÷9.80665)', fix: 'acc_ms2' });
    const rollMax = Math.max(rng('roll') || 0, rng('pitch') || 0);
    if (hints.roll === 'rad' || hints.pitch === 'rad' || hints.yaw === 'rad') warnings.push({ msg: '헤더 단위 (rad) → 도(°)로 환산했습니다', fix: 'rad', info: true });
    else if (rollMax && rollMax < 3.2 && !keys.includes('qw') && !(hints.roll === 'deg')) warnings.push({ msg: '롤·피치 값이 ±π 안이라 라디안으로 보여 도(°)로 환산했습니다', fix: 'rad' });
    if (hints.gx === 'rad' || hints.gy === 'rad') warnings.push({ msg: '각속도 단위 (rad/s) → °/s로 환산했습니다', fix: 'gyro_rad', info: true });
    if (bad) warnings.push({ msg: '값이 비거나 숫자가 아닌 행 ' + bad + '개 — 해당 행은 제외합니다' });
    data.t = ts;
    if (bad && opts.dropBad !== false) { // 한 값이라도 NaN인 행은 모든 채널에서 제거
      const n = ts.length; const keep = new Array(n).fill(true);
      for (const k of keys) { const a = data[k]; if (!a || k === 'sensor') continue; for (let i = 0; i < n; i++) if (isNaN(a[i])) keep[i] = false; }
      for (const k of keys) { const a = data[k]; if (!a) continue; data[k] = a.filter((_, i) => keep[i]); } // keys에 't' 포함
    }
    const rawT = []; { const ci = Object.keys(mapping).find(k => mapping[k] === 't'); if (ci != null) for (let i = start; i < Math.min(rows.length, start + 50); i++) rawT.push(rows[i][ci]); }
    return { ok: !errors.some(e => e.fatal), rows: rows.length - start, badRows: bad, errors, warnings, stats: { hz, duration, gaps, gapMax, dups, nonMono, unitScale, epochStart }, data, rawT };
  }
  function chLabel(k) { const c = CHANNELS.find(c => c.key === k); return c ? c.label : k; }
  function chUnit(k) { const c = CHANNELS.find(c => c.key === k); return c ? c.unit : ''; }

  // 단위 정규화 적용
  function applyFixes(v) {
    const fx = new Set(v.warnings.filter(w => w.fix).map(w => w.fix));
    if (fx.has('acc_ms2')) for (const k of ['ax', 'ay', 'az']) if (v.data[k]) v.data[k] = v.data[k].map(x => x / 9.80665);
    if (fx.has('rad')) for (const k of ['roll', 'pitch', 'yaw']) if (v.data[k]) v.data[k] = v.data[k].map(x => x * 180 / Math.PI);
    if (fx.has('gyro_rad')) for (const k of ['gx', 'gy', 'gz']) if (v.data[k]) v.data[k] = v.data[k].map(x => x * 180 / Math.PI);
    // 쿼터니언 → 오일러 (롤/피치/요 없을 때)
    if (v.data.qw && !v.data.roll) {
      const n = v.data.qw.length; v.data.roll = new Array(n); v.data.pitch = new Array(n); v.data.yaw = new Array(n);
      for (let i = 0; i < n; i++) {
        const w = v.data.qw[i], x = v.data.qx[i], y = v.data.qy[i], z = v.data.qz[i];
        v.data.roll[i] = Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)) * 180 / Math.PI;
        const sp = 2 * (w * y - z * x); v.data.pitch[i] = Math.asin(Math.max(-1, Math.min(1, sp))) * 180 / Math.PI;
        v.data.yaw[i] = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)) * 180 / Math.PI;
      }
      v.warnings.push({ msg: '쿼터니언을 롤·피치·요로 변환했습니다' });
    }
    return v;
  }

  /* ---------- 물리 검사 (F04 · F02) ----------
     컬럼 이름이 같아도 단위·방향·시간이 바뀐 것을 값 자체로 잡는다.
     session: { time:'HH:MM', date:'YYYY-MM-DD', duration:초, declaredHz } (선택)
     rawT: 원본 시간 문자열 배열(지수 표기 탐지용) */
  function physicsCheck(v, session, rawT) {
    const checks = []; const d = v.data; const hz = v.stats.hz || 0; const n = d.t ? d.t.length : 0;
    const add = (key, level, title, detail, fix) => checks.push({ key, level, title, detail, fix }); // level: pass | warn | block
    // 0) 엑셀 재저장 — 지수 표기 타임스탬프
    if (rawT && rawT.some(s => /\d(?:\.\d+)?e\+?\d+/i.test(String(s)))) add('sci', 'block', '엑셀에서 다시 저장된 파일로 보입니다', '시간 열에 지수 표기(예: 1.79213E+12)가 있습니다. 13자리 타임스탬프가 잘려 복원할 수 없습니다 — 센서 앱이 만든 원본 CSV를 올려 주세요.');
    else add('sci', 'pass', '타임스탬프 정밀도', '지수 표기 없음 — 원본 정밀도 유지');
    // 1) 정지 구간 가속도 크기 → 단위 (처음 5초)
    if (d.ax && d.ay && d.az && n > hz * 5) {
      const k = Math.floor(hz * 5); let s = 0; for (let i = 0; i < k; i++) s += Math.hypot(d.ax[i], d.ay[i], d.az[i]); const mean = s / k;
      if (mean > .85 && mean < 1.15) add('gunit', 'pass', '가속도 단위 = g', '정지 구간 |a| 평균 ' + mean.toFixed(3) + ' g (중력 1.00 기대)');
      else if (mean > 8.5 && mean < 11.5) add('gunit', 'warn', '가속도가 m/s²로 기록됨', '정지 구간 |a| 평균 ' + mean.toFixed(2) + ' → 9.80665로 나눠 g로 환산합니다', 'acc_ms2');
      else if (mean < .3) add('gunit', 'warn', '정지 구간 가속도가 거의 0', '중력이 제거된(선형 가속도) 값이거나 센서가 꺼져 있었습니다 — 자세 계산에 중력을 쓸 수 없습니다');
      else add('gunit', 'warn', '가속도 단위를 판정할 수 없음', '정지 구간 |a| 평균 ' + mean.toFixed(2) + ' — 시작 5초 정지 프로토콜이 지켜졌는지 확인하세요');
    }
    // 2) 자이로 단위 (deg/s vs rad/s)
    if (d.gx && d.gy && d.gz && n) {
      let mx = 0; for (let i = 0; i < n; i++) { const m = Math.max(Math.abs(d.gx[i]), Math.abs(d.gy[i]), Math.abs(d.gz[i])); if (m > mx) mx = m; }
      if (mx < 12) add('gyro', 'warn', '각속도가 rad/s로 보입니다', '최대 |ω| ' + mx.toFixed(2) + ' — 운동 중 각속도가 12 미만이면 rad/s일 가능성이 큽니다 (×57.3으로 °/s 환산)', 'gyro_rad');
      else if (mx > 2500) add('gyro', 'warn', '각속도가 비정상적으로 큼', '최대 |ω| ' + mx.toFixed(0) + '°/s — 센서 포화 또는 단위 오류');
      else add('gyro', 'pass', '각속도 단위 = °/s', '최대 |ω| ' + mx.toFixed(0) + '°/s (운동 범위 내)');
    }
    // 3) 쿼터니언 노름
    if (d.qw && n) {
      let s = 0; for (let i = 0; i < n; i++) s += Math.hypot(d.qw[i], d.qx[i], d.qy[i], d.qz[i]); const m = s / n;
      if (Math.abs(m - 1) < .02) add('quat', 'pass', '쿼터니언 노름 ≈ 1', '평균 ' + m.toFixed(4)); else add('quat', 'block', '쿼터니언이 단위 사원수가 아님', '평균 노름 ' + m.toFixed(3) + ' — 성분 순서(w,x,y,z / x,y,z,w) 또는 스케일 확인 필요');
    }
    // 4) 실제 Hz vs 선언 Hz · 결측
    const decl = session && session.declaredHz;
    if (hz) {
      if (decl && Math.abs(hz - decl) / decl > .1) add('hz', 'warn', '실제 샘플링 ' + hz.toFixed(1) + 'Hz ≠ 선언 ' + decl + 'Hz', 'Δt 중앙값으로 계산한 실제 주기가 세션에 선언한 값과 10% 이상 다릅니다 — 파일 기준으로 저장합니다');
      else add('hz', 'pass', '샘플링 ' + hz.toFixed(1) + 'Hz', 'Δt 중앙값 ' + (1000 / hz).toFixed(1) + 'ms' + (decl ? ' · 선언 ' + decl + 'Hz와 일치' : ''));
      const gapPct = v.stats.gaps ? (v.stats.gaps / n * 100) : 0;
      if (v.stats.gaps > 0) add('gaps', v.stats.gapMax > 2 ? 'warn' : 'pass', '샘플 누락 ' + v.stats.gaps + '곳 (최대 ' + v.stats.gapMax.toFixed(2) + 's)', 'BLE 패킷 손실로 보이는 구간 — 그래프에 끊김으로 표시, 지표 계산에서 제외');
      else add('gaps', 'pass', '샘플 누락 없음', '연속 Δt > 1.5×주기 구간 0곳');
    }
    if (v.stats.nonMono) add('mono', 'block', '시간이 거꾸로 가는 행 ' + v.stats.nonMono + '개', '센서 시계 재동기 또는 파일 병합 오류 — 원본 확인 필요');
    // 5) 세션 길이 vs CSV 길이
    if (session && session.duration && v.stats.duration && v.stats.duration < 90) add('dur', 'pass', 'CSV 길이 ' + v.stats.duration.toFixed(0) + '초 (짧은 샘플)', '90초 미만 파일은 세션 길이 대조를 생략합니다');
    else if (session && session.duration && v.stats.duration) {
      const r = v.stats.duration / session.duration;
      if (r < .5 || r > 1.5) add('dur', 'warn', 'CSV 길이 ' + (v.stats.duration / 60).toFixed(1) + '분 vs 세션 ' + (session.duration / 60).toFixed(0) + '분', '길이가 크게 다릅니다 — 앱 중단·재시작 분할 파일이거나 다른 세션의 파일일 수 있습니다');
      else add('dur', 'pass', 'CSV 길이 ' + (v.stats.duration / 60).toFixed(1) + '분', '세션 ' + (session.duration / 60).toFixed(0) + '분과 일치');
    }
    // 6) UTC 9시간 — 절대 시각(epoch)이 들어온 경우
    if (session && session.date && session.time && v.stats.epochStart) {
      const local = new Date(session.date + 'T' + session.time + ':00+09:00').getTime() / 1000;
      const diff = (v.stats.epochStart - local) / 3600;
      if (Math.abs(diff + 9) < .5) add('utc', 'warn', 'CSV 시각이 입력한 운동 시간보다 9시간 빠름', 'UTC로 기록된 파일로 보입니다 — 한국 시간(+09:00)으로 보정해 연결할까요? (원본은 그대로, 보정값만 기록)', 'utc9');
      else if (Math.abs(diff) > 1) add('utc', 'warn', 'CSV 시각과 운동 시간이 ' + diff.toFixed(1) + '시간 차이', '다른 날짜·세션의 파일이거나 센서 시계가 틀렸습니다');
      else add('utc', 'pass', 'CSV 시각 = 운동 시간', '차이 ' + (diff * 60).toFixed(0) + '분');
    }
    // 7) 장착 방향 — 보정 동작 구간(5~8초: 왼쪽으로 기울이기 → roll < 0 기대)
    if (d.roll && n > hz * 8) {
      const a = Math.floor(hz * 5.5), b = Math.floor(hz * 7.5); let s = 0; for (let i = a; i < b; i++) s += d.roll[i]; const m = s / (b - a);
      let base = 0; const k = Math.floor(hz * 4); for (let i = 0; i < k; i++) base += d.roll[i]; base /= k;
      const delta = m - base;
      if (delta < -4) add('dir', 'pass', '장착 방향 정방향', '보정 동작(왼쪽 기울이기) 구간 roll 변화 ' + delta.toFixed(1) + '° — 왼쪽 = 음수 규약과 일치');
      else if (delta > 4) add('dir', 'warn', '장착 방향 반전 추정', '왼쪽으로 기울인 구간에서 roll이 +' + delta.toFixed(1) + '° — 센서가 뒤집혀 달린 것으로 보입니다. 좌우 반전을 적용할까요? (원본 보존, 반전은 메타데이터로 기록)', 'flip');
      else add('dir', 'warn', '보정 동작이 확인되지 않음', '5~8초 구간 roll 변화 ' + delta.toFixed(1) + '° — 시작 프로토콜(5초 정지 + 왼쪽 기울이기 3초)이 없으면 좌우 방향을 검증할 수 없습니다');
      add('base', 'pass', '선 자세 기본 기울기 ' + (base >= 0 ? '+' : '') + base.toFixed(1) + '°', '정지 구간 평균 — 0으로 지우지 않고 별도 보관합니다 (절단자 자세 비대칭 F02)');
    }
    // 8) 자기장 크기 안정성 (yaw 신뢰도)
    if (d.mx && n) {
      let s = 0, s2 = 0; for (let i = 0; i < n; i++) { const m = Math.hypot(d.mx[i], d.my[i], d.mz[i]); s += m; s2 += m * m; } const mean = s / n, sd = Math.sqrt(Math.max(0, s2 / n - mean * mean));
      const cv = mean ? sd / mean : 0;
      if (cv > .12) add('mag', 'warn', '자기장 크기 변동 ' + (cv * 100).toFixed(0) + '%', '실내 철골·금속 교란 — 회전(yaw) 지표의 신뢰도를 낮음으로 표시합니다');
      else add('mag', 'pass', '자기장 안정 (변동 ' + (cv * 100).toFixed(0) + '%)', '회전(yaw) 지표 사용 가능');
    }
    const level = checks.some(c => c.level === 'block') ? 'block' : checks.some(c => c.level === 'warn') ? 'warn' : 'pass';
    return { level, checks };
  }

  /* ---------- 불량 픽스처 8종 + 정상 1종 (규격 검증기·성공 기준 3) ---------- */
  function fixtures() {
    const NL = '\n';
    const mk = (opts) => {
      const o = Object.assign({ hz: 100, sec: 40, delim: ',', tUnit: 'ms', epoch: null, acc: 'g', gyro: 'dps', header: true, flip: false, bom: true, gaps: false, sci: false, missingCol: false, dup: false, cp949: false }, opts);
      const cols = ['timestamp', 'acc_x', 'acc_y', 'acc_z', 'gyro_x', 'gyro_y', 'gyro_z', 'mag_x', 'mag_y', 'mag_z', 'roll', 'pitch', 'yaw'];
      if (o.missingCol) cols.splice(0, 1, 'sample_no');
      let out = (o.bom ? '﻿' : '') + (o.header ? cols.join(o.delim) + NL : '');
      const n = o.hz * o.sec; let r = 1;
      for (let i = 0; i < n; i++) {
        if (o.gaps && i % 700 > 640) continue;
        const t = i / o.hz; const rest = t < 5; const calib = t >= 5 && t < 8;
        const ph = t * 2 * Math.PI * 1.4;
        let roll = rest ? .4 : calib ? -11 : 4 * Math.sin(ph) + 1.5; if (o.flip) roll = -roll;
        const pitch = rest ? -1 : 3 * Math.sin(2 * ph) - 2, yaw = rest ? 0 : 25 * Math.sin(ph * .5);
        let ax = Math.sin(roll * Math.PI / 180), ay = Math.cos(roll * Math.PI / 180) + (rest ? 0 : .4 * Math.max(0, Math.sin(2 * ph)) ** 4), az = Math.sin(pitch * Math.PI / 180);
        let gx = rest ? 0 : 4 * Math.cos(ph) * 2 * Math.PI * 1.4, gy = rest ? 0 : 6 * Math.cos(2 * ph) * 2 * Math.PI * 1.4, gz = rest ? 0 : 25 * .5 * Math.cos(ph * .5) * 2 * Math.PI * 1.4;
        if (o.acc === 'ms2') { ax *= 9.80665; ay *= 9.80665; az *= 9.80665; }
        if (o.gyro === 'rad') { gx /= 57.2958; gy /= 57.2958; gz /= 57.2958; }
        let ts = o.epoch ? (o.epoch + i * 1000 / o.hz) : o.tUnit === 'ms' ? i * 1000 / o.hz : t;
        let tsStr = o.sci && o.epoch ? (ts / 1e12).toFixed(5) + 'E+12' : String(Math.round(ts * 1000) / 1000);
        const row = [o.missingCol ? i : tsStr, ax.toFixed(4), ay.toFixed(4), az.toFixed(4), gx.toFixed(3), gy.toFixed(3), gz.toFixed(3), (22 * Math.cos(yaw * Math.PI / 180)).toFixed(2), '-40.10', (22 * Math.sin(yaw * Math.PI / 180)).toFixed(2), roll.toFixed(3), pitch.toFixed(3), yaw.toFixed(3)];
        out += row.join(o.delim) + NL; r++;
      }
      return out;
    };
    const good = mk({});
    return [
      { id: 'good', name: '정상 — 100Hz · g · °/s · ms · 보정 동작 포함', expect: 'pass', csv: good, note: '규격서 v0.1 그대로' },
      { id: 'enc', name: '① 인코딩 — BOM 없는 CP949 한글 헤더', expect: 'warn', csv: mk({ bom: false, cp949: true }).replace('timestamp,acc_x,acc_y,acc_z,gyro_x,gyro_y,gyro_z,mag_x,mag_y,mag_z,roll,pitch,yaw', '시간(ms),가속도x,가속도y,가속도z,각속도x,각속도y,각속도z,자기x,자기y,자기z,롤,피치,요'), note: '한글 헤더 별칭 매핑으로 통과 · 인코딩 경고' },
      { id: 'unit', name: '② 단위 — 가속도 m/s² · 자이로 rad/s (컬럼 이름은 동일)', expect: 'warn', csv: mk({ acc: 'ms2', gyro: 'rad' }), note: '매핑은 통과하지만 정지 구간 |a|=9.8 · 최대 |ω|<12로 단위 판정 → 환산' },
      { id: 'hz', name: '③ Hz — 선언 100Hz인데 실제 50Hz', expect: 'warn', csv: mk({ hz: 50 }), note: 'Δt 중앙값 20ms → 50Hz' },
      { id: 'gaps', name: '④ 결측 — BLE 손실 구간 반복', expect: 'warn', csv: mk({ gaps: true }), note: '연속 Δt > 1.5×주기 구간 탐지' },
      { id: 'utc', name: '⑤ 9시간 시차 — UTC epoch 기록', expect: 'warn', csv: mk({ epoch: Date.UTC(2026, 9, 14, 1, 30) }), note: '세션 10:30 KST vs CSV 01:30 → UTC 추정' },
      { id: 'dup', name: '⑥ 중복 — 이미 다른 세션에 붙은 파일', expect: 'block', csv: good, note: '파일 지문이 같음 → 차단 (업로드 화면에서 확인)' },
      { id: 'sci', name: '⑦ 지수 표기 — 엑셀로 열었다 저장한 파일', expect: 'block', csv: mk({ epoch: Date.UTC(2026, 9, 14, 1, 30), sci: true }), note: '1.79213E+12 → 정밀도 손실, 복원 불가' },
      { id: 'missing', name: '⑧ 필수 컬럼 누락 — 시간 열 없음', expect: 'block', csv: mk({ missingCol: true }), note: '시간 채널 매핑 실패 → 차단' },
      { id: 'flip', name: '＋ 장착 방향 반전 — 센서를 뒤집어 단 세션', expect: 'warn', csv: mk({ flip: true }), note: '보정 구간 roll 부호 반대 → 반전 제안' }
    ];
  }

  // 지문 — 같은 파일을 다시 올리면 잡는다 (FNV-1a 32bit × 2 — 내용 전체)
  function fingerprint(text) {
    let h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0x5bd1e995;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      h1 ^= c; h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 ^= c; h2 = Math.imul(h2, 0x5bd1e995) >>> 0; h2 ^= h2 >>> 13;
    }
    return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  }

  function parseCSV(text) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    const delim = sniffDelimiter(text);
    const rows = parseRows(text, delim);
    const header = hasHeader(rows);
    const headers = header ? rows[0].map(h => h.trim()) : rows[0].map((_, i) => '열 ' + (i + 1));
    return { delim, rows, header, headers, mapping: autoMap(headers), fingerprint: fingerprint(text), bytes: text.length };
  }

  /* ---------------- 내보내기 ---------------- */
  const csvEscape = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  function toCSV(headers, rows) { return '﻿' + [headers, ...rows].map(r => r.map(csvEscape).join(',')).join('\r\n'); }
  function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }
  function downloadCSV(name, headers, rows) { download(new Blob([toCSV(headers, rows)], { type: 'text/csv;charset=utf-8' }), name); }

  /* 최소 XLSX — ZIP(stored) + inlineStr 워크시트. sheets: [{name, headers, rows}] */
  const CRC = (() => { const t = new Uint32Array(256); for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[i] = c >>> 0; } return t; })();
  function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  const enc = new TextEncoder();
  const xml = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const colName = n => { let s = ''; n++; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  function sheetXml(sh) {
    const all = [sh.headers, ...sh.rows]; let out = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>';
    sh.headers.forEach((h, i) => { out += '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + Math.max(10, Math.min(40, String(h).length * 2 + 4)) + '" customWidth="1"/>'; });
    out += '</cols><sheetData>';
    all.forEach((row, r) => {
      out += '<row r="' + (r + 1) + '">';
      row.forEach((v, c) => {
        const ref = colName(c) + (r + 1);
        if (typeof v === 'number' && isFinite(v)) out += '<c r="' + ref + '"' + (r === 0 ? ' s="1"' : '') + '><v>' + v + '</v></c>';
        else out += '<c r="' + ref + '" t="inlineStr"' + (r === 0 ? ' s="1"' : '') + '><is><t>' + xml(v) + '</t></is></c>';
      });
      out += '</row>';
    });
    out += '</sheetData><autoFilter ref="A1:' + colName(sh.headers.length - 1) + (all.length) + '"/></worksheet>';
    return out;
  }
  function buildXlsx(sheets) {
    const files = [];
    files.push(['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + sheets.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>']);
    files.push(['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>']);
    files.push(['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map((s, i) => '<sheet name="' + xml(s.name.slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>']);
    files.push(['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map((_, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>']);
    files.push(['xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Malgun Gothic"/></font><font><b/><sz val="11"/><name val="Malgun Gothic"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFF2F6"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']);
    sheets.forEach((s, i) => files.push(['xl/worksheets/sheet' + (i + 1) + '.xml', sheetXml(s)]));
    // ZIP stored
    const parts = [], central = []; let offset = 0;
    const now = new Date(); const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF; const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
    const u16 = n => [n & 255, (n >> 8) & 255], u32 = n => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
    for (const [name, content] of files) {
      const nameB = enc.encode(name), data = enc.encode(content), crc = crc32(data);
      const local = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(dosTime), ...u16(dosDate), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameB.length), ...u16(0), ...nameB]);
      parts.push(local, data);
      central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(dosTime), ...u16(dosDate), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameB.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...nameB]));
      offset += local.length + data.length;
    }
    const cdSize = central.reduce((s, c) => s + c.length, 0);
    const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
    return new Blob([...parts, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function downloadXlsx(name, sheets) { download(buildXlsx(sheets), name); }

  W.IO = { parseCSV, autoMap, validate, applyFixes, physicsCheck, fixtures, fingerprint, CHANNELS, chLabel, chUnit, toCSV, downloadCSV, buildXlsx, downloadXlsx, download, sniffDelimiter, normHeader };
})(window);
