/* ATHLEDGER 관리자 — 세션 상세(3D 바디 + IMU 스크럽 + 좌우 분포 + 조건 지문) · 세션 비교 · 기간 추이
   데모 데이터는 전부 가상입니다. */
(function (W) {
  'use strict';
  const { icon, $, $$, esc, fmtN, fmtDur, fmtDate, sign, el, toast, modal, countUp, reveal, growBars } = CORE;
  const D = DATA; const A = ADMIN;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const CH = { roll: { label: '기울기 roll', color: () => css('--ax-x'), unit: '°' }, pitch: { label: '앞뒤 pitch', color: () => css('--ax-y'), unit: '°' }, yaw: { label: '회전 yaw', color: () => css('--ax-z'), unit: '°' }, gx: { label: '각속도 X', color: () => css('--ax-x'), unit: '°/s' }, gy: { label: '각속도 Y', color: () => css('--ax-y'), unit: '°/s' }, gz: { label: '각속도 Z', color: () => css('--ax-z'), unit: '°/s' }, ay: { label: '가속도 Y', color: () => css('--ch-4'), unit: 'g' }, mag: { label: '|자기장|', color: () => css('--ch-5'), unit: 'µT' } };

  /* ---------- 세션 상세 ---------- */
  function session(parts, q) {
    const s = A.sessionOf(parts[0]); if (!s) return A.view({ crumb: '세션 없음', title: '세션을 찾을 수 없습니다' });
    const a = A.athleteOf(s.athlete); const bra = D.PRODUCTS.find(p => p.id === s.bra);
    const fp = D.profileFingerprint(s);
    const aside = '<div class="stack" style="gap:20px">' +
      '<div><div class="eyebrow ko" style="margin-bottom:10px">측정 조건 지문 <span class="badge mono">' + fp + '</span></div>' + D.PROFILE_KEYS.map(([k, label]) => A.mrow(label, '<span class="body-s">' + esc(D.fmtProf(k, D.profileOf(s)[k])) + '</span>')).join('') + '<p class="help" style="margin-top:8px">지문이 다른 세션과의 비교는 <a href="#/compare?a=' + s.id + '"><u>비교 화면</u></a>이 먼저 경고합니다 (F03).</p></div>' +
      '<div><div class="eyebrow ko" style="margin-bottom:10px">업로드 이력 · 원본 불변</div>' + (s.csv ? A.mrow('원본 파일', '<span class="mono" style="text-transform:none;word-break:break-all">' + esc(s.csv.file) + '</span>') + A.mrow('지문 (SHA)', '<span class="mono">' + s.csv.fingerprint + '</span>') + A.mrow('행 · Hz', fmtN(s.csv.rows) + ' · ' + s.csv.hz + 'Hz') + A.mrow('업로드', s.csv.uploadedAt + ' · ' + (s.csv.by === 'admin' ? '관리자 대리' : '선수 본인')) + A.mrow('규격 · 매핑', '<span class="badge mono">spec-v0.1</span> <span class="badge mono">' + s.csv.mappingVersion + '</span>') + A.mrow('처리기', '<span class="badge mono" id="procV">' + (s.csv.processor || 'proc-v1.2') + '</span>') + '<div class="row" style="margin-top:10px"><button class="btn sm" id="reproc">' + icon('reset') + '재처리 (proc-v1.3)</button><button class="btn sm ghost" id="dlRaw">' + icon('download') + '원본 CSV</button></div><p class="help" style="margin-top:8px">규격·처리기 버전이 바뀌면 원본은 그대로 두고 지표만 다시 계산합니다 (F16).</p>' : '<div class="empty"><div class="dash">—</div><b>연결된 CSV가 없습니다.</b><a class="btn sm" href="#/upload?session=' + s.id + '">' + icon('upload') + '올리기</a></div>') + '</div>' +
      '<div><div class="eyebrow ko" style="margin-bottom:10px">착용 제품 · 평가</div>' + A.mrow('브라', (bra ? bra.name : s.bra) + ' <span class="badge mono">' + s.braVersion + '</span> ' + s.braSize) + A.mrow('드로즈', 'DR-A <span class="badge mono">' + s.drawersVersion + '</span> ' + s.drawersSize) + A.mrow('RPE', s.rpe + ' / 10') +
      (s.fit ? '<div style="margin-top:8px">' + D.FIT_ITEMS.map(i => '<div class="mrow" style="padding:6px 0"><span class="k body-s">' + i.label + '</span><span class="v"><span class="bar" style="width:70px"><i data-w="' + (s.fit[i.key] / 5 * 100) + '%"></i></span><span class="num">' + s.fit[i.key] + '</span></span></div>').join('') + (s.fitComment ? '<p class="help" style="margin-top:6px">“' + esc(s.fitComment) + '”</p>' : '') + '</div>' : '<p class="help">착용 평가 없음</p>') +
      (s.note ? '<p class="note" style="margin-top:10px">' + icon('info') + '<span>' + esc(s.note) + '</span></p>' : '') + '</div></div>';
    const body = s.csv ? '<div class="grid g12">' +
      '<div class="span-5 stack">' +
      '<div class="stage rv" id="stage" style="min-height:460px"><canvas id="bodyCv"></canvas><div class="hud"><div class="seg" id="modeSeg"><button data-m="heat" aria-pressed="true">부하</button><button data-m="symmetry" aria-pressed="false">좌 / 우</button><button data-m="fit" aria-pressed="false">압박</button></div></div><div class="hud-r"><div class="seg" id="viewSeg"><button data-v="front">정면</button><button data-v="side">측면</button><button data-v="back">후면</button></div><button class="btn icon sm" id="resetView" title="시점 리셋">' + icon('reset') + '</button></div><div class="hud-b"><div class="stack" style="gap:6px"><button class="chip on" id="poseBtn" aria-pressed="true">' + icon('body') + '자세 따라가기</button><div class="legend" id="stageLegend"></div></div><div class="stack" style="gap:4px;text-align:right;justify-items:end"><span class="angle" id="poseRead">ROLL 0° · PITCH 0° · YAW 0°</span><span class="angle" id="angle">YAW −28° · PITCH 6°</span></div></div></div>' +
      '<div class="panel rv"><div class="panel-h"><div class="heading">' + icon('scale') + '좌 / 우 분포</div><div class="seg" id="axisSeg"><button data-ax="lr" aria-pressed="true">왼쪽 · 오른쪽</button><button data-ax="side" aria-pressed="false">절단측 · 건측</button></div></div><div class="panel-b stack" style="gap:16px">' +
      '<div class="chart" style="height:96px"><canvas id="gaugeCv"></canvas></div>' +
      '<div id="mirror" class="stack" style="gap:10px"></div>' +
      '<div class="note" id="yawNote">' + icon('info') + '<div>회전(yaw)은 자기센서에 의존해 실내 철골·금속에서 왜곡됩니다. 자기장 크기 변동이 큰 구간은 차트에 회색 음영으로 표시하고 회전 지표 신뢰도를 낮춤으로 표기합니다 (F01).</div></div>' +
      '</div><div class="panel-f">' + A.DISCLAIMER + '</div></div>' +
      '</div>' +
      '<div class="span-7 stack">' +
      '<div class="panel rv"><div class="panel-h"><div class="heading">' + icon('activity') + 'IMU 시계열</div><div class="row"><div class="seg" id="rangeSeg"><button data-r="all">전체</button><button data-r="60" aria-pressed="true">1분</button><button data-r="10">10초</button></div><button class="btn icon sm" id="playBtn" title="재생">' + icon('play') + '</button></div></div><div class="panel-b stack">' +
      '<div class="chart-h"><div class="legend" id="chLegend"></div><span class="bracket" id="chRange">0 → ' + fmtDur(s.duration) + '</span></div>' +
      '<div class="chart h260"><canvas id="tsCv"></canvas></div><div class="chart-note"><span id="tsNote">원본 ' + fmtN(s.csv.rows) + '점 → 표시 —점</span><span>마우스 이동 = 스크럽 · 드래그 = 구간 선택 · 회색 = 자기장 불안정</span></div>' +
      '<div class="chart-h" style="margin-top:8px"><div class="legend" id="gLegend"></div><span class="bracket">각속도 °/s</span></div><div class="chart h160"><canvas id="gyCv"></canvas></div>' +
      '</div></div>' +
      '<div class="grid g2">' +
      '<div class="panel rv"><div class="panel-h"><div class="subheading">' + icon('cube') + '3축 산점 (회전 · 기울기 · 각속도)</div><span class="muted body-s">점 색 = 기울기 방향</span></div><div class="panel-b"><div class="chart h320"><canvas id="scCv"></canvas></div><div class="chart-note"><span>표시 1,200점 · 드래그 회전</span><span id="scCent"></span></div></div></div>' +
      '<div class="hair c2 rv" id="metricGrid"></div>' +
      '</div></div></div>' : '<div class="panel rv"><div class="panel-b"><div class="empty"><div class="dash">—</div><b>이 세션에는 아직 센서 CSV가 연결되지 않았습니다.</b>운동 정보·착용 제품·평가는 우측에 있습니다. CSV를 올리면 3D 바디·시계열·좌우 분포가 계산됩니다.<div style="margin-top:14px"><a class="btn primary" href="#/upload?session=' + s.id + '">' + icon('upload') + 'CSV 올리기</a></div></div></div></div>';
    A.view({ crumb: '<a href="#/sessions">운동 기록</a> / <b>' + s.id + '</b>', eyebrow: fmtDate(s.date) + ' ' + s.time + ' · ' + A.sportName(s.sport) + ' · ' + s.type + ' · ' + fmtDur(s.duration), title: s.id + ' <span class="muted" style="font-weight:400">· ' + a.id + '</span>', lede: a.id + ' (' + A.ampLabel(a) + ') · 건측 ' + (A.soundSide(a) === 'L' ? '왼쪽' : '오른쪽') + '. 브라 속 IMU 1개가 알려주는 "좌우"는 팔의 좌우가 아니라 몸통이 좌우로 기울고 도는 정도입니다.', actions: '<a class="btn" href="#/compare?a=' + s.id + '">' + icon('compare') + '비교에 추가</a><a class="btn" href="#/export?session=' + s.id + '">' + icon('download') + '추출</a>', body, aside });
    D.log({ who: A.roleInfo().id, role: A.roleInfo().name, target: a.id, action: '세션 상세 조회', detail: s.id });
    if (!s.csv) return;

    /* 데이터 */
    const series = D.imu(s, a); const M = D.metrics(series, a);
    const st = { cursor: 6.5, range: [0, 60], axis: 'lr', pose: true, playing: false, vis: { roll: true, pitch: true, yaw: true }, gvis: { gx: true, gy: true, gz: true } };
    const magCV = magBands(series);
    const calib = s.profile.calibration ? [{ from: 0, to: 5, color: css('--ink-3'), alpha: .08, label: '정지' }, { from: 5, to: 8, color: css('--left'), alpha: .1, label: '왼쪽 기울이기' }] : [];

    /* 3D */
    const B = Body3D.mount($('#bodyCv'), { mode: 'heat', amputation: a.amp, sensors: A.bodySensors(s), regionNames: Body3D.REGION_NAMES, colors: A.BODY_COLORS, dark: true, gizmo: true, font: 'Pretendard, sans-serif', onPick: (r, v) => toast('<b>' + Body3D.REGION_NAMES[r] + '</b> 부하 ' + Math.round((v || 0) * 100) + '%', 'info') });
    A.stageControls(B, a); B.setHeat(M.heat, true);
    $('#poseBtn').onclick = () => { st.pose = !st.pose; $('#poseBtn').setAttribute('aria-pressed', st.pose); $('#poseBtn').classList.toggle('on', st.pose); if (!st.pose) B.setPose({}); else applyPose(); };
    function applyPose() { if (!st.pose) return; const i = Math.max(0, Math.min(series.n - 1, Math.round(st.cursor * series.hz))); const p = { roll: series.roll[i], pitch: series.pitch[i], yaw: series.yaw[i] * .5 }; B.setPose(p); $('#poseRead').textContent = 'ROLL ' + fmtDeg(series.roll[i]) + ' · PITCH ' + fmtDeg(series.pitch[i]) + ' · YAW ' + fmtDeg(series.yaw[i]); }
    const fmtDeg = v => (v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '°';

    /* 시계열 */
    const tsCv = $('#tsCv'), gyCv = $('#gyCv');
    let ds, gds;
    function resample() { const rg = st.range; ds = D.downsample(series, ['roll', 'pitch', 'yaw'], 1800, rg); gds = D.downsample(series, ['gx', 'gy', 'gz'], 1200, rg); $('#tsNote').textContent = '원본 ' + fmtN(s.csv.rows) + '점 → 표시 ' + fmtN(ds.t.length) + '점 (LTTB 대체: 구간 평균)'; $('#chRange').textContent = (rg ? rg[0].toFixed(0) + 's → ' + rg[1].toFixed(0) + 's' : '0 → ' + fmtDur(s.duration)); }
    function drawTS(prog) {
      const keys = ['roll', 'pitch', 'yaw'];
      Charts.timeseries(tsCv, { t: ds.t, series: keys.map(k => ({ key: k, label: CH[k].label.split(' ')[0], data: ds[k], color: CH[k].color(), hidden: !st.vis[k] })), cursor: st.cursor, bands: [...calib, ...magCV.map(b => ({ from: b[0], to: b[1], color: css('--ink-3'), alpha: .12 }))], unit: '°', progress: prog, marks: [] });
      Charts.timeseries(gyCv, { t: gds.t, series: ['gx', 'gy', 'gz'].map(k => ({ key: k, label: k.toUpperCase(), data: gds[k], color: CH[k].color(), hidden: !st.gvis[k] })), cursor: st.cursor, unit: '°/s', progress: prog, cursorLabel: false, padL: 46 });
    }
    function legend() {
      $('#chLegend').innerHTML = ['roll', 'pitch', 'yaw'].map(k => '<button data-k="' + k + '" aria-pressed="' + st.vis[k] + '"><i style="background:' + CH[k].color() + '"></i>' + CH[k].label + '</button>').join('');
      $('#gLegend').innerHTML = ['gx', 'gy', 'gz'].map(k => '<button data-g="' + k + '" aria-pressed="' + st.gvis[k] + '"><i style="background:' + CH[k].color() + '"></i>' + CH[k].label + '</button>').join('');
      $$('#chLegend button').forEach(b => b.onclick = () => { st.vis[b.dataset.k] = !st.vis[b.dataset.k]; legend(); drawTS(); });
      $$('#gLegend button').forEach(b => b.onclick = () => { st.gvis[b.dataset.g] = !st.gvis[b.dataset.g]; legend(); drawTS(); });
    }
    resample(); legend(); Charts.animate(600, e => drawTS(e));
    // 스크럽 · 구간 드래그
    let drag = null;
    const toT = (cv, e) => { const r = cv.getBoundingClientRect(); const x = e.clientX - r.left; const padL = 46, padR = 14; const t0 = ds.t[0], t1 = ds.t[ds.t.length - 1]; return Math.max(t0, Math.min(t1, t0 + (x - padL) / (r.width - padL - padR) * (t1 - t0))); };
    [tsCv, gyCv].forEach(cv => {
      cv.addEventListener('pointermove', e => { const t = toT(cv, e); if (drag) { drag.to = t; st.range = [Math.min(drag.from, drag.to), Math.max(drag.from, drag.to)]; } st.cursor = t; drawTS(); applyPose(); updateMetrics(); });
      cv.addEventListener('pointerdown', e => { drag = { from: toT(cv, e), to: toT(cv, e) }; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointerup', () => { if (drag && Math.abs(drag.to - drag.from) > 1) { st.range = [Math.min(drag.from, drag.to), Math.max(drag.from, drag.to)]; resample(); $$('#rangeSeg button').forEach(x => x.setAttribute('aria-pressed', 'false')); toast('구간 ' + st.range[0].toFixed(0) + '~' + st.range[1].toFixed(0) + 's 지표를 다시 계산했습니다', 'info', 1800); } else if (drag) { st.range = st.range; } drag = null; drawTS(); updateMetrics(true); });
    });
    $$('#rangeSeg button').forEach(b => b.onclick = () => { $$('#rangeSeg button').forEach(x => x.setAttribute('aria-pressed', x === b)); const r = b.dataset.r; if (r === 'all') st.range = null; else { const w = Number(r); const c = st.cursor; st.range = [Math.max(0, c - w / 2), Math.min(series.t[series.n - 1], Math.max(0, c - w / 2) + w)]; } resample(); drawTS(); updateMetrics(true); });
    // 재생
    let raf = 0, lastT = 0;
    $('#playBtn').onclick = () => { st.playing = !st.playing; $('#playBtn').innerHTML = icon(st.playing ? 'pause' : 'play'); if (st.playing) { lastT = performance.now(); const step = now => { if (!st.playing) return; const dt = (now - lastT) / 1000; lastT = now; const end = st.range ? st.range[1] : series.t[series.n - 1]; const beg = st.range ? st.range[0] : 0; st.cursor += dt * 4; if (st.cursor > end) st.cursor = beg; drawTS(); applyPose(); raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); } else cancelAnimationFrame(raf); };
    A.onLeave(() => { st.playing = false; cancelAnimationFrame(raf); });

    /* 산점 */
    const scCv = $('#scCv'); const sc = { yaw: -.6, pitch: .42 }; let pts = [];
    function buildPts() { const d = D.downsample(series, ['yaw', 'roll', 'gz'], 1200, st.range); pts = d.t.map((t, i) => ({ x: d.yaw[i], y: d.roll[i], z: Math.abs(d.gz[i]), side: d.roll[i] > 2 ? 'R' : d.roll[i] < -2 ? 'L' : '', t })); }
    function drawSC(prog) { buildPts(); let hi = null; for (let i = 0; i < pts.length; i++) if (pts[i].t >= st.cursor) { hi = i; break; } Charts.scatter3d(scCv, { points: pts, axes: ['회전 yaw', '기울기 roll', '|각속도 z|'], yaw: sc.yaw, pitch: sc.pitch, centroids: true, highlight: hi, progress: prog }); const L = pts.filter(p => p.side === 'L').length, R = pts.filter(p => p.side === 'R').length; $('#scCent').textContent = '왼쪽 ' + L + ' · 오른쪽 ' + R + ' · 중립 ' + (pts.length - L - R); }
    Charts.animate(700, e => drawSC(e));
    let sd = null; scCv.addEventListener('pointerdown', e => { sd = [e.clientX, e.clientY]; scCv.setPointerCapture(e.pointerId); }); scCv.addEventListener('pointermove', e => { if (!sd) return; sc.yaw += (e.clientX - sd[0]) * .01; sc.pitch = Math.max(-1.2, Math.min(1.2, sc.pitch + (e.clientY - sd[1]) * .008)); sd = [e.clientX, e.clientY]; drawSC(); }); scCv.addEventListener('pointerup', () => sd = null); scCv.style.cursor = 'grab';

    /* 좌우 분포 · 지표 */
    $$('#axisSeg button').forEach(b => b.onclick = () => { $$('#axisSeg button').forEach(x => x.setAttribute('aria-pressed', x === b)); st.axis = b.dataset.ax; updateMetrics(true); });
    function updateMetrics(animate) {
      const m = D.metrics(series, a, st.range); const sound = A.soundSide(a);
      const lab = side => st.axis === 'lr' ? (side === 'L' ? '왼쪽' : '오른쪽') : (side === sound ? '건측' : '절단측');
      // 절단측·건측 축: 절단측을 왼쪽에 두도록 정규화 (왼쪽 절단 선수와 오른쪽 절단 선수를 같은 축에서)
      const flip = st.axis === 'side' && a.amp.side === 'R';
      const v = flip ? -m.asym : m.asym;
      Charts.gauge($('#gaugeCv'), { value: v, leftLabel: flip ? lab('R') : lab('L'), rightLabel: flip ? lab('L') : lab('R'), tolerance: 5, progress: animate ? undefined : 1 });
      const rows = [['±2° 밖에 머문 시간', m.tL / series.hz, m.tR / series.hz, 's'], ['회전 피크 평균', m.rotL, m.rotR, '°'], ['기울기 최대', Math.abs(minOf(series.roll, st.range, series.hz)), Math.abs(maxOf(series.roll, st.range, series.hz)), '°']];
      $('#mirror').innerHTML = rows.map(r => { const L = flip ? r[2] : r[1], R = flip ? r[1] : r[2]; const mx = Math.max(L, R) || 1; return '<div><div class="row between body-s" style="margin-bottom:4px"><span class="muted">' + r[0] + '</span><span class="muted">' + (flip ? lab('R') : lab('L')) + ' · ' + (flip ? lab('L') : lab('R')) + '</span></div><div class="mirror"><div class="lb"><i data-w="' + (L / mx * 100) + '%"></i></div><div class="c"><span class="num ink-l">' + fmtN(L, r[3] === 's' ? 0 : 1) + '</span> <span class="muted">' + r[3] + '</span> <span class="num ink-r">' + fmtN(R, r[3] === 's' ? 0 : 1) + '</span></div><div class="rb"><i data-w="' + (R / mx * 100) + '%"></i></div></div></div>'; }).join('');
      growBars($('#mirror'));
      const ratio = sound === 'R' ? m.rotR / (m.rotL || 1) : m.rotL / (m.rotR || 1);
      const base = baseTilt(series);
      $('#metricGrid').innerHTML = kpiBox('치우침 지수', (m.asym > 0 ? '+' : '') + m.asym.toFixed(1), '%', A.towardLabel(a, m.asym), 'roll ±2° 밖 (R−L)/(R+L)') + kpiBox('회전 비 (건측/절단측)', ratio.toFixed(2), '×', ratio > 1.15 ? '건측 회전 ' + ((ratio - 1) * 100).toFixed(0) + '% 큼' : '좌우 비슷', 'yaw 피크 평균 · 자기장 ' + (magCV.length ? '<span style="color:var(--warn)">신뢰도 낮음</span>' : '안정')) + kpiBox('각속도 RMS', m.rms.toFixed(0), '°/s', '움직임 강도', '3축 합') + kpiBox('선 자세 기본 기울기', (base >= 0 ? '+' : '') + base.toFixed(1), '°', base > 0.5 ? '오른쪽으로 기움' : base < -.5 ? '왼쪽으로 기움' : '거의 수직', '정지 구간 평균 · 0으로 지우지 않음 (F02)');
    }
    function kpiBox(l, v, u, sub, range) { return '<div class="kpi"><div class="lab">' + l + '</div><div class="val"><b>' + v + '</b><span class="unit">' + u + '</span></div><div class="sub">' + sub + '</div><div class="range">' + range + '</div></div>'; }
    updateMetrics(true); applyPose();
    // 재처리 · 원본
    const rp = $('#reproc'); if (rp) rp.onclick = () => { const before = M.asym; rp.innerHTML = '<span class="spin"></span>재처리 중'; setTimeout(() => { D.patchSession(s.id, { csv: Object.assign({}, s.csv, { processor: 'proc-v1.3' }) }); $('#procV').textContent = 'proc-v1.3'; rp.innerHTML = icon('check') + '재처리 완료'; toast('처리기 proc-v1.3으로 재계산 — 치우침 ' + before.toFixed(1) + '% → ' + (before * .97).toFixed(1) + '% (원본 CSV는 그대로)', 'good', 4200); }, 900); };
    const dl = $('#dlRaw'); if (dl) dl.onclick = () => { const rows = []; const step = Math.max(1, Math.floor(series.n / 3000)); for (let i = 0; i < series.n; i += step) rows.push([series.t[i].toFixed(3), series.ax[i].toFixed(4), series.ay[i].toFixed(4), series.az[i].toFixed(4), series.gx[i].toFixed(2), series.gy[i].toFixed(2), series.gz[i].toFixed(2), series.mx[i].toFixed(2), series.my[i].toFixed(2), series.mz[i].toFixed(2), series.roll[i].toFixed(3), series.pitch[i].toFixed(3), series.yaw[i].toFixed(3)]); IO.downloadCSV(s.csv.file, ['t_s', 'acc_x_g', 'acc_y_g', 'acc_z_g', 'gyro_x_dps', 'gyro_y_dps', 'gyro_z_dps', 'mag_x_ut', 'mag_y_ut', 'mag_z_ut', 'roll_deg', 'pitch_deg', 'yaw_deg'], rows); D.log({ who: A.roleInfo().id, role: A.roleInfo().name, target: a.id, action: '원본 CSV 다운로드', detail: s.id }); toast('원본 CSV(요약 샘플 ' + rows.length + '행 · UTF-8 BOM) 다운로드 — 접속기록에 남았습니다', 'good'); };
  }
  function minOf(arr, range, hz) { const [i0, i1] = range ? [Math.floor(range[0] * hz), Math.ceil(range[1] * hz)] : [0, arr.length]; let m = Infinity; for (let i = i0; i < i1; i++) if (arr[i] < m) m = arr[i]; return m; }
  function maxOf(arr, range, hz) { const [i0, i1] = range ? [Math.floor(range[0] * hz), Math.ceil(range[1] * hz)] : [0, arr.length]; let m = -Infinity; for (let i = i0; i < i1; i++) if (arr[i] > m) m = arr[i]; return m; }
  function baseTilt(series) { const k = Math.min(series.n, series.hz * 4); let s = 0; for (let i = 0; i < k; i++) s += series.roll[i]; return s / k; }
  // 자기장 크기 변동이 큰 구간 (10초 창) → [from,to]
  function magBands(series) { const win = series.hz * 10; const out = []; let cur = null; for (let i = 0; i + win <= series.n; i += win) { let s = 0, s2 = 0; for (let j = i; j < i + win; j++) { const m = Math.hypot(series.mx[j], series.my[j], series.mz[j]); s += m; s2 += m * m; } const mean = s / win, sd = Math.sqrt(Math.max(0, s2 / win - mean * mean)); const bad = sd / mean > .06; const t0 = series.t[i], t1 = series.t[Math.min(series.n - 1, i + win)]; if (bad) { if (cur && Math.abs(cur[1] - t0) < .01) cur[1] = t1; else { cur = [t0, t1]; out.push(cur); } } else cur = null; } return out; }

  /* ---------- 세션 비교 (F03) ---------- */
  function compare(parts, q) {
    const S = D.sessions().filter(s => s.csv); const ath = q.athlete ? A.athleteOf(q.athlete) : null;
    // 기본 선택: 같은 조건 지문의 세션이 둘 이상인 선수 (공정 비교가 바로 보이게)
    const withPair = S.find(x => S.some(y => y.id !== x.id && y.athlete === x.athlete && D.profileFingerprint(x) === D.profileFingerprint(y)));
    let sa = q.a ? A.sessionOf(q.a) : (ath ? S.find(s => s.athlete === ath.id) : (withPair || S[0])); if (!sa) sa = S[0];
    const fair = q.fair === '1';
    let cands = S.filter(s => s.id !== sa.id && s.athlete === sa.athlete); if (fair) cands = cands.filter(s => D.profileFingerprint(s) === D.profileFingerprint(sa));
    let sb = q.b ? A.sessionOf(q.b) : cands[0];
    const a = A.athleteOf(sa.athlete);
    const diff = sb ? D.profileDiff(sa, sb) : [];
    const link = o => '#/compare?' + Object.entries(Object.assign({ a: sa.id, b: sb ? sb.id : '', fair: fair ? '1' : '' }, o)).filter(([, v]) => v).map(([k, v]) => k + '=' + v).join('&');
    const pick = (which, cur) => '<select class="select" data-pick="' + which + '">' + (which === 'b' ? cands : S).map(s => '<option value="' + s.id + '"' + (cur && s.id === cur.id ? ' selected' : '') + '>' + s.id + ' · ' + s.athlete + ' · ' + fmtDate(s.date) + ' · ' + s.braVersion + '</option>').join('') + (which === 'b' && !cands.length ? '<option value="">같은 조건의 세션 없음</option>' : '') + '</select>';
    const body = '<div class="panel rv"><div class="panel-b"><div class="grid g2" style="align-items:end"><div class="field"><label>세션 A</label>' + pick('a', sa) + '</div><div class="field"><label>세션 B <span class="muted">(같은 선수)</span></label>' + pick('b', sb) + '</div></div><div class="row between" style="margin-top:14px"><label class="row" style="gap:10px;cursor:pointer"><button class="switch" role="switch" aria-checked="' + fair + '" id="fairSw"></button><span><b>공정 비교</b> <span class="muted body-s">— 측정 조건 지문이 같은 세션만 B 후보로</span></span></label><a class="btn sm" href="#/compare?preset=version&athlete=' + a.id + '">' + icon('layers') + '버전 비교 프리셋</a></div></div></div>' +
      (sb ? (diff.length ? '<div class="note crit rv">' + icon('alert') + '<div><b>조건이 달라 차이를 제품 효과로 해석할 수 없습니다.</b> 다른 항목 ' + diff.length + '개: <span class="chips" style="display:inline-flex;margin-left:6px">' + diff.map(d => '<span class="chip diff">' + d.label + ' · ' + esc(d.a) + ' ↔ ' + esc(d.b) + '</span>').join('') + '</span></div></div>' : '<div class="note good rv">' + icon('checkC') + '<div><b>측정 조건 지문 일치</b> (' + D.profileFingerprint(sa) + ') — 센서·펌웨어·Hz·장착 위치·방향·의수·종목·보정·장소가 같아 비교해도 됩니다.</div></div>') : '<div class="note warn rv">' + icon('info') + '<div>공정 비교 조건에 맞는 세션이 없습니다. 토글을 끄면 조건이 다른 세션도 고를 수 있지만 경고와 함께 표시됩니다.</div></div>') +
      (sb ? '<div class="grid g2 rv"><div class="stage mini" id="stA"><canvas></canvas><div class="hud"><span class="badge mono">A · ' + sa.id + '</span></div><div class="hud-b"><span class="angle">' + fmtDate(sa.date) + ' · ' + sa.braVersion + ' · 의수 ' + sa.profile.prosthesis + '</span></div></div><div class="stage mini" id="stB"><canvas></canvas><div class="hud"><span class="badge mono">B · ' + sb.id + '</span></div><div class="hud-b"><span class="angle">' + fmtDate(sb.date) + ' · ' + sb.braVersion + ' · 의수 ' + sb.profile.prosthesis + '</span></div></div></div>' +
        '<div class="panel rv"><div class="panel-h"><div class="heading">' + icon('compare') + '지표 나란히</div>' + A.DISCLAIMER + '</div><div class="tbl-wrap" style="border:0;border-radius:0"><table class="tbl" id="cmpTbl"><thead><tr><th>지표</th><th class="r">A · ' + sa.id + '</th><th class="r">B · ' + sb.id + '</th><th class="r">B − A</th><th>해석</th></tr></thead><tbody></tbody></table></div></div>' +
        '<div class="panel rv"><div class="panel-h"><div class="heading">' + icon('activity') + '기울기(roll) 겹쳐 보기 · 세션 시작 기준 정규화</div><div class="legend"><span><i style="background:var(--ch-4)"></i>A</span><span><i style="background:var(--ch-5)"></i>B</span></div></div><div class="panel-b"><div class="chart h200"><canvas id="cmpCv"></canvas></div></div></div>' : '');
    A.view({ crumb: '<b>세션 비교</b>', eyebrow: a.id + ' · ' + A.ampLabel(a), title: '세션 비교', lede: 'CSV를 정확한 세션에 붙이는 것만으로는 부족합니다. 의수 착용·센서 위치·펌웨어·샘플링이 다른 세션끼리 비교하면 브라 v2의 개선 효과가 허상이 됩니다 — 그래서 비교 화면이 먼저 조건을 대조합니다.', body });
    $$('[data-pick]').forEach(sel => sel.onchange = () => { location.hash = link(sel.dataset.pick === 'a' ? { a: sel.value, b: '' } : { b: sel.value }); });
    $('#fairSw').onclick = () => { location.hash = link({ fair: fair ? '' : '1', b: '' }); };
    if (q.preset === 'version') { versionPreset(a); return; }
    if (!sb) return;
    const serA = D.imu(sa, a), serB = D.imu(sb, a); const mA = D.metrics(serA, a), mB = D.metrics(serB, a);
    const BA = Body3D.mount($('#stA canvas'), { mode: 'symmetry', amputation: a.amp, sensors: A.bodySensors(sa), colors: A.BODY_COLORS, dark: true, labels: false, yaw: -.4, zoom: .95 }); BA.setHeat(mA.heat, true);
    const BB = Body3D.mount($('#stB canvas'), { mode: 'symmetry', amputation: a.amp, sensors: A.bodySensors(sb), colors: A.BODY_COLORS, dark: true, labels: false, yaw: -.4, zoom: .95 }); BB.setHeat(mB.heat, true); A.onLeave(() => { BA.destroy(); BB.destroy(); });
    const sound = A.soundSide(a); const ratio = m => sound === 'R' ? m.rotR / (m.rotL || 1) : m.rotL / (m.rotR || 1);
    const rows = [['치우침 지수 (%)', mA.asym, mB.asym, 1, v => Math.abs(v) < 2 ? '차이 미미' : (Math.abs(mB.asym) < Math.abs(mA.asym) ? '치우침 ' + Math.abs(v).toFixed(1) + '%p 감소' : '치우침 ' + Math.abs(v).toFixed(1) + '%p 증가')], ['회전 비 건측/절단측 (×)', ratio(mA), ratio(mB), 2, v => Math.abs(v) < .05 ? '차이 미미' : v < 0 ? '건측 회전 우세 감소' : '건측 회전 우세 증가'], ['각속도 RMS (°/s)', mA.rms, mB.rms, 0, v => '강도 ' + (v > 0 ? '증가' : '감소')], ['충격 횟수', mA.impacts, mB.impacts, 0, v => '세션 길이 ' + fmtDur(sa.duration) + ' / ' + fmtDur(sb.duration)], ['회전 피크 왼쪽 (°)', mA.rotL, mB.rotL, 1, () => ''], ['회전 피크 오른쪽 (°)', mA.rotR, mB.rotR, 1, () => '']];
    $('#cmpTbl tbody').innerHTML = rows.map(r => { const d = r[2] - r[1]; return '<tr><td>' + r[0] + '</td><td class="r num">' + fmtN(r[1], r[3]) + '</td><td class="r num">' + fmtN(r[2], r[3]) + '</td><td class="r"><span class="delta ' + (Math.abs(d) < (r[3] ? .05 : 1) ? '' : d < 0 ? 'up' : 'down') + '">' + (d > 0 ? '+' : d < 0 ? '−' : '') + fmtN(Math.abs(d), r[3]) + '</span></td><td class="muted body-s">' + r[4](d) + (diff.length ? ' <span style="color:var(--crit)">· 조건 다름</span>' : '') + '</td></tr>'; }).join('');
    const dA = D.downsample(serA, ['roll'], 900), dB = D.downsample(serB, ['roll'], 900); const n = Math.min(dA.t.length, dB.t.length);
    Charts.animate(600, e => Charts.timeseries($('#cmpCv'), { t: dA.t.slice(0, n), series: [{ key: 'A', label: 'A roll', data: dA.roll.slice(0, n), color: css('--ch-4') }, { key: 'B', label: 'B roll', data: dB.roll.slice(0, n), color: css('--ch-5') }], unit: '°', progress: e }));
  }
  // 버전 비교 프리셋 — 같은 조건 쌍만 자동 매칭
  function versionPreset(a) {
    const S = D.sessions().filter(s => s.csv); const pairs = []; const unmatched = [];
    const byAth = {}; S.forEach(s => (byAth[s.athlete] = byAth[s.athlete] || []).push(s));
    Object.values(byAth).forEach(list => { const used = new Set(); list.forEach(x => list.forEach(y => { if (x.id < y.id && x.braVersion !== y.braVersion && D.profileFingerprint(x) === D.profileFingerprint(y) && !used.has(x.id) && !used.has(y.id)) { pairs.push([x, y]); used.add(x.id); used.add(y.id); } })); list.forEach(x => { if (!used.has(x.id)) unmatched.push(x); }); });
    const page = $('.page');
    page.insertAdjacentHTML('beforeend', '<div class="panel rv in"><div class="panel-h"><div class="heading">' + icon('layers') + '버전 비교 프리셋 — 같은 조건 쌍 자동 매칭</div><span class="muted body-s">쌍 ' + pairs.length + ' · 짝 없는 세션 ' + unmatched.length + '</span></div><div class="tbl-wrap" style="border:0;border-radius:0"><table class="tbl"><thead><tr><th>선수</th><th>이전 버전</th><th>이후 버전</th><th>조건 지문</th><th class="r">치우침 (전 → 후)</th><th class="r">변화</th><th></th></tr></thead><tbody class="rv-rows">' +
      pairs.map(([x, y]) => { const ath = A.athleteOf(x.athlete); const mx = D.summary(x), my = D.summary(y); const d = Math.abs(my.asym) - Math.abs(mx.asym); return '<tr><td><span class="id">' + x.athlete + '</span> ' + A.sideBadge(ath.amp.side, ath.amp.side === 'L' ? '좌' : '우') + '</td><td class="body-s">' + x.id + ' <span class="badge mono">' + x.braVersion + '</span></td><td class="body-s">' + y.id + ' <span class="badge mono">' + y.braVersion + '</span></td><td><span class="badge mono">' + D.profileFingerprint(x) + '</span></td><td class="r num">' + Math.abs(mx.asym).toFixed(1) + '% → ' + Math.abs(my.asym).toFixed(1) + '%</td><td class="r"><span class="delta ' + (d < -1 ? 'up' : d > 1 ? 'down' : '') + '">' + (d > 0 ? '+' : '') + d.toFixed(1) + '%p</span></td><td class="r"><a class="btn sm" href="#/compare?a=' + x.id + '&b=' + y.id + '&fair=1">열기</a></td></tr>'; }).join('') +
      '</tbody></table></div><div class="panel-f">짝 없는 세션 ' + unmatched.length + '개는 조건(센서·위치·의수·종목 등)이 같은 다른 버전 세션이 없어 제외했습니다 — 버전 효과를 말하려면 조건을 고정한 재측정이 필요합니다.</div></div>');
  }

  /* ---------- 기간 추이 ---------- */
  function trend(parts, q) {
    const As = D.athletes(); const a = A.athleteOf(q.athlete) || As[0]; const metric = q.m || 'asym';
    const ss = A.sessionsOf(a.id).filter(s => s.csv).slice().reverse();
    const METR = { asym: ['치우침 지수 |%|', m => Math.abs(m.asym), '%'], rot: ['회전 비 (건측/절단측)', m => A.soundSide(a) === 'R' ? m.rotR / (m.rotL || 1) : m.rotL / (m.rotR || 1), '×'], rms: ['각속도 RMS', m => m.rms, '°/s'] };
    const body = '<div class="row rv between"><div class="chips">' + As.map(x => '<a class="chip' + (x.id === a.id ? ' on' : '') + '" href="#/trend?athlete=' + x.id + '&m=' + metric + '"><span class="mono">' + x.id.slice(4) + '</span></a>').join('') + '</div><div class="seg">' + Object.keys(METR).map(k => '<a href="#/trend?athlete=' + a.id + '&m=' + k + '"><button aria-pressed="' + (k === metric) + '">' + METR[k][0].split(' ')[0] + '</button></a>').join('') + '</div></div>' +
      '<div class="panel rv"><div class="panel-h"><div class="heading">' + icon('trend') + METR[metric][0] + ' · ' + a.id + '</div><div class="legend"><span><i style="background:var(--ink-1)"></i>조건 동일</span><span><i style="background:transparent;border:1.5px solid var(--ink-1)"></i>조건 다름</span><span><i style="background:var(--accent);width:2px"></i>버전 변경</span></div></div><div class="panel-b"><div class="chart h320"><canvas id="trCv"></canvas></div><div class="chart-note"><span>세션 ' + ss.length + '회 · 최근 ' + ss.length + '세션 기준 · 점선 = 본인 평균</span><span>' + A.DISCLAIMER + '</span></div></div></div>' +
      '<div class="tbl-wrap rv"><table class="tbl"><thead><tr><th>세션</th><th>일자</th><th>브라 버전</th><th>조건 지문</th><th class="r">' + METR[metric][0] + '</th><th class="r">본인 평균 대비</th></tr></thead><tbody class="rv-rows" id="trTbl"></tbody></table></div>';
    A.view({ crumb: '<b>기간 추이</b>', eyebrow: '세션 요약 지표 · 날짜축', title: '기간별 추이', lede: '세션마다 저장한 요약 지표를 날짜축에 놓습니다. 제품 버전이 바뀐 시점을 세로선으로, 측정 조건이 다른 세션은 속이 빈 점으로 분리해 "버전 개선 전후"가 허상이 되지 않게 합니다.', body });
    const vals = ss.map(s => ({ s, m: D.summary(s) })).filter(x => x.m).map(x => ({ s: x.s, v: METR[metric][1](x.m), fp: D.profileFingerprint(x.s) }));
    const mean = vals.length ? vals.reduce((t, x) => t + x.v, 0) / vals.length : 0;
    const base = vals.length ? vals[0].fp : '';
    $('#trTbl').innerHTML = vals.slice().reverse().map(x => '<tr class="click" data-h="#/session/' + x.s.id + '"><td class="id">' + x.s.id + '</td><td>' + fmtDate(x.s.date) + '</td><td><span class="badge mono">' + x.s.braVersion + '</span></td><td><span class="badge mono' + (x.fp !== base ? ' warn' : '') + '">' + x.fp + '</span></td><td class="r num">' + fmtN(x.v, metric === 'rot' ? 2 : 1) + ' ' + METR[metric][2] + '</td><td class="r"><span class="delta ' + (x.v < mean ? 'up' : 'down') + '">' + (x.v - mean > 0 ? '+' : '−') + fmtN(Math.abs(x.v - mean), metric === 'rot' ? 2 : 1) + '</span></td></tr>').join('');
    $$('[data-h]').forEach(r => r.onclick = () => location.hash = r.dataset.h);
    Charts.animate(700, e => drawTrend($('#trCv'), vals, mean, METR[metric][2], e));
  }
  function drawTrend(cv, vals, mean, unit, prog) {
    const { ctx, w, h } = Charts.setup(cv); const font = css('--font') || 'Pretendard, sans-serif';
    const ink = css('--ink-1'), ink3 = css('--ink-3'), line = css('--line'), acc = css('--accent');
    const padL = 46, padR = 20, padT = 20, padB = 30; const pw = w - padL - padR, ph = h - padT - padB;
    if (!vals.length) { ctx.fillStyle = ink3; ctx.font = '500 13px ' + font; ctx.textAlign = 'center'; ctx.fillText('- 기록이 없습니다.', w / 2, h / 2); return; }
    const ds = vals.map(v => new Date(v.s.date + 'T00:00:00').getTime()); const t0 = Math.min(...ds) - 864e5 * 2, t1 = Math.max(...ds) + 864e5 * 2;
    let mn = Math.min(...vals.map(v => v.v), mean), mx = Math.max(...vals.map(v => v.v), mean); const pad = (mx - mn) * .25 || 1; mn -= pad; mx += pad;
    const X = t => padL + (t - t0) / (t1 - t0) * pw, Y = v => padT + (1 - (v - mn) / (mx - mn)) * ph;
    ctx.strokeStyle = line; ctx.setLineDash([2, 2]); ctx.lineWidth = 1; ctx.font = '400 10px ' + (css('--mono') || 'monospace'); ctx.fillStyle = ink3; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) { const v = mn + (mx - mn) * i / 4; const y = Math.round(Y(v)) + .5; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke(); ctx.fillText(v.toFixed(unit === '×' ? 2 : 0), padL - 6, y); }
    ctx.setLineDash([]);
    // 월 라벨
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let m = new Date(t0); m.getTime() < t1; m.setDate(m.getDate() + 7)) { const x = X(m.getTime()); ctx.fillStyle = ink3; ctx.fillText((m.getMonth() + 1) + '/' + m.getDate(), x, h - padB + 8); }
    // 평균 점선
    ctx.strokeStyle = ink3; ctx.setLineDash([4, 3]); const my = Math.round(Y(mean)) + .5; ctx.beginPath(); ctx.moveTo(padL, my); ctx.lineTo(w - padR, my); ctx.stroke(); ctx.setLineDash([]); ctx.textAlign = 'left'; ctx.fillStyle = ink3; ctx.fillText('AVG ' + mean.toFixed(unit === '×' ? 2 : 1), padL + 4, my - 12);
    // 버전 변경 세로선
    for (let i = 1; i < vals.length; i++) if (vals[i].s.braVersion !== vals[i - 1].s.braVersion) { const x = Math.round(X((ds[i] + ds[i - 1]) / 2)) + .5; ctx.strokeStyle = acc; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + ph); ctx.stroke(); ctx.fillStyle = acc; ctx.font = '600 10px ' + font; ctx.textAlign = 'left'; ctx.fillText(vals[i].s.braVersion, x + 4, padT); }
    // 선 + 점
    const n = Math.max(1, Math.round(vals.length * prog)); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath();
    for (let i = 0; i < n; i++) { const x = X(ds[i]), y = Y(vals[i].v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    const base = vals[0].fp;
    for (let i = 0; i < n; i++) { const x = X(ds[i]), y = Y(vals[i].v); ctx.beginPath(); ctx.rect(x - 4, y - 4, 8, 8); if (vals[i].fp === base) { ctx.fillStyle = ink; ctx.fill(); } else { ctx.fillStyle = css('--surface-1'); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke(); } ctx.fillStyle = ink3; ctx.font = '500 10px ' + font; ctx.textAlign = 'center'; ctx.fillText(vals[i].v.toFixed(unit === '×' ? 2 : 0), x, y - 14); }
  }

  A.route('session', session); A.route('compare', compare); A.route('trend', trend);
})(window);
