/* ATHLEDGER 관리자 — CSV 업로드 3단계(매핑 → 물리 검사 → 확정) · 규격 검증기(불량 8종) · 자료 추출(xlsx/CSV 실제 생성)
   데모 데이터는 전부 가상입니다. */
(function (W) {
  'use strict';
  const { icon, $, $$, esc, fmtN, fmtDur, fmtDate, el, toast, modal, reveal, growBars } = CORE;
  const D = DATA; const A = ADMIN;
  const FX = IO.fixtures();
  // 중복 지문 — 기존 세션 파일 + 픽스처 ⑥을 SES-003에 이미 붙은 것으로 등록
  const dupFx = FX.find(f => f.id === 'dup'); dupFx.csv = dupFx.csv + '\n';
  const KNOWN = () => { const m = {}; D.sessions().forEach(s => { if (s.csv && s.csv.fingerprint) m[s.csv.fingerprint] = s.id; }); m[IO.parseCSV(dupFx.csv).fingerprint] = 'SES-003'; return m; }; // parseCSV는 BOM을 뗀 뒤 지문을 만든다

  /* ---------- 업로드 ---------- */
  function upload(parts, q) {
    const S = D.sessions(); const As = D.athletes();
    let ses = q.session ? A.sessionOf(q.session) : null;
    if (!ses && q.athlete) ses = S.find(s => s.athlete === q.athlete && !s.csv) || S.find(s => s.athlete === q.athlete);
    if (!ses) ses = S.find(s => !s.csv) || S[0];
    const st = { step: 1, ses, text: null, name: '', parsed: null, mapping: null, v: null, phys: null, fixes: new Set() };
    render();
    function render() {
      const a = A.athleteOf(st.ses.athlete); const c = D.consentOf(a.id); const consentOk = c.personal && c.sensitive;
      const steps = '<div class="steps rv"><div class="' + (st.step > 1 ? 'done' : 'cur') + '"><span class="n">1</span>파일 · 세션 선택</div><div class="' + (st.step > 2 ? 'done' : st.step === 2 ? 'cur' : '') + '"><span class="n">2</span>컬럼 매핑 · 규격 버전</div><div class="' + (st.step === 3 ? 'cur' : '') + '"><span class="n">3</span>물리 검사 · 연결</div></div>';
      let body = steps;
      if (st.step === 1) {
        body += '<div class="grid g2 rv"><div class="panel"><div class="panel-h"><div class="subheading">연결할 세션</div>' + A.consentBadge(a.id) + '</div><div class="panel-b stack">' +
          '<div class="field"><label>세션</label><select class="select" id="sesSel">' + S.map(s => '<option value="' + s.id + '"' + (s.id === st.ses.id ? ' selected' : '') + '>' + s.id + ' · ' + s.athlete + ' · ' + fmtDate(s.date) + ' ' + s.time + (s.csv ? ' · CSV 있음' : '') + '</option>').join('') + '</select></div>' +
          A.mrow('선수', '<span class="id">' + a.id + '</span> ' + A.sideBadge(a.amp.side)) + A.mrow('운동', fmtDate(st.ses.date) + ' ' + st.ses.time + ' · ' + fmtDur(st.ses.duration) + ' · ' + A.sportName(st.ses.sport)) + A.mrow('선언 조건', st.ses.profile.sensorId + ' · ' + st.ses.profile.hz + 'Hz · ' + st.ses.profile.position + ' · 보정 ' + (st.ses.profile.calibration ? '있음' : '없음')) +
          (consentOk ? '' : '<div class="note crit">' + icon('lock') + '<div><b>업로드 차단</b> — ' + a.id + '은(는) 민감정보 별도 동의가 없습니다. 장애·신체 정보와 결합되는 센서 데이터는 동의 전에 저장할 수 없습니다 (F07). <a href="#/athlete/' + a.id + '"><u>동의 받기</u></a></div></div>') +
          (st.ses.csv ? '<div class="note warn">' + icon('info') + '<div>이 세션에는 이미 파일이 있습니다. 같은 파일이면 지문으로 차단되고, 다른 파일이면 「구간 추가」로 1:N 연결됩니다 (앱 중단·재시작 분할).</div></div>' : '') +
          '</div></div>' +
          '<div class="panel"><div class="panel-h"><div class="subheading">센서 앱 CSV</div><span class="muted body-s">UTF-8 · CP949 · 구분자 자동</span></div><div class="panel-b stack">' +
          '<label class="file-btn' + (consentOk ? '' : ' disabled') + '" id="dropZone">' + icon('upload') + '<span>파일 선택 (탭 한 번)</span><small>또는 여기에 끌어 놓기 · 최대 50MB</small><input type="file" accept=".csv,text/csv" class="sr" id="fileIn"' + (consentOk ? '' : ' disabled') + '></label>' +
          '<div class="eyebrow ko">샘플로 체험 — 가상 센서 CSV</div><div class="chips">' + FX.map(f => '<button class="chip" data-fx="' + f.id + '"' + (consentOk ? '' : ' disabled') + '>' + esc(f.name.split(' — ')[0]) + '</button>').join('') + '</div>' +
          '<p class="help">각 샘플은 규격 검증기의 불량 픽스처와 같습니다. 정상 파일 외에는 경고 또는 차단이 납니다.</p></div></div></div>';
      }
      if (st.step === 2) {
        const p = st.parsed; const used = Object.values(st.mapping);
        body += '<div class="panel rv"><div class="panel-h"><div class="subheading">' + icon('file') + esc(st.name) + ' <span class="badge mono">' + (p.bytes / 1024).toFixed(0) + ' KB</span> <span class="badge mono">구분자 ' + (p.delim === '\t' ? 'TAB' : p.delim) + '</span> <span class="badge mono">' + (p.header ? '헤더 있음' : '헤더 없음') + '</span> <span class="badge mono">행 ' + fmtN(p.rows.length - (p.header ? 1 : 0)) + '</span></div><div class="row"><span class="badge accent">spec-v0.1</span><span class="badge mono">map-v' + (used.length >= 12 ? '2' : '1') + '</span></div></div>' +
          '<div class="tbl-wrap" style="border:0;border-radius:0"><table class="tbl"><thead><tr><th>CSV 열</th><th>샘플 1</th><th>샘플 2</th><th>→ 표준 채널</th><th>단위 힌트</th></tr></thead><tbody class="rv-rows">' +
          p.headers.map((h, i) => '<tr><td class="id">' + esc(h) + '</td><td class="mono" style="text-transform:none">' + esc((p.rows[p.header ? 1 : 0] || [])[i]) + '</td><td class="mono" style="text-transform:none">' + esc((p.rows[p.header ? 2 : 1] || [])[i]) + '</td><td><select class="select" data-col="' + i + '" style="height:32px"><option value="">(건너뜀)</option>' + IO.CHANNELS.map(ch => '<option value="' + ch.key + '"' + (st.mapping[i] === ch.key ? ' selected' : '') + '>' + ch.label + (ch.unit ? ' (' + ch.unit + ')' : '') + '</option>').join('') + '</select></td><td class="muted body-s">' + ((p.mapping.__hints || {})[st.mapping[i]] || '-') + '</td></tr>').join('') +
          '</tbody></table></div><div class="panel-f row between"><span>자동 매칭 ' + used.length + ' / ' + p.headers.length + '열 · 센서 업체 규격이 바뀌면 별칭 사전만 늘리면 됩니다. 매핑은 버전으로 저장됩니다.</span><div class="row"><button class="btn" id="back1">' + icon('back') + '이전</button><button class="btn primary" id="go3">물리 검사 실행 ' + icon('arrowR') + '</button></div></div></div>';
      }
      if (st.step === 3) {
        const v = st.v, ph = st.phys; const lv = ph.level; const known = KNOWN(); const dupOf = known[st.parsed.fingerprint];
        const blocked = lv === 'block' || !!dupOf;
        body += '<div class="note ' + (blocked ? 'crit' : lv === 'warn' ? 'warn' : 'good') + ' rv">' + icon(blocked ? 'alert' : lv === 'warn' ? 'info' : 'checkC') + '<div><b>' + (blocked ? '차단 — 이 파일은 연결할 수 없습니다' : lv === 'warn' ? '경고 — 보정 후 연결 가능' : '통과 — 연결 가능') + '</b> · ' + esc(st.name) + ' · 행 ' + fmtN(v.rows) + ' · 실제 ' + (v.stats.hz || 0).toFixed(1) + 'Hz · ' + (v.stats.duration / 60).toFixed(1) + '분 · 지문 <span class="mono" style="text-transform:none">' + st.parsed.fingerprint + '</span>' + (dupOf ? '<br><b>같은 파일이 이미 ' + dupOf + '에 붙어 있습니다</b> — 중복 집계를 막기 위해 차단합니다 (연결 규칙의 구현체).' : '') + '</div></div>' +
          '<div class="grid g12 rv"><div class="span-7"><div class="checks">' + (dupOf ? '<div class="block"><span class="ic">' + icon('close') + '</span><div><b>중복 파일</b><p>지문이 ' + dupOf + '의 파일과 같습니다. 다른 파일이면 「구간 추가」, 같은 파일이면 올릴 필요가 없습니다.</p></div></div>' : '') + ph.checks.map(c => '<div class="' + c.level + '"><span class="ic">' + icon(c.level === 'pass' ? 'check' : c.level === 'warn' ? 'alert' : 'close') + '</span><div><b>' + esc(c.title) + '</b><p>' + esc(c.detail) + '</p></div>' + (c.fix && c.level === 'warn' ? '<button class="btn sm' + (st.fixes.has(c.fix) ? ' primary' : '') + '" data-fix="' + c.fix + '">' + (st.fixes.has(c.fix) ? icon('check') + '적용됨' : '적용') + '</button>' : '') + '</div>').join('') + '</div></div>' +
          '<div class="span-5 stack"><div class="panel"><div class="panel-h"><div class="subheading">행 단위 오류 · 경고</div><span class="badge ' + (v.errors.length ? 'crit' : 'good') + '">' + v.errors.length + '</span></div><div class="panel-b stack">' +
          (v.errors.length ? '<ul class="stack" style="gap:6px;max-height:200px;overflow:auto">' + v.errors.slice(0, 30).map(e => '<li class="body-s"><span class="mono" style="color:var(--crit)">' + (e.line === '-' ? '—' : 'LINE ' + e.line) + '</span> ' + esc(e.msg) + '</li>').join('') + (v.errors.length > 30 ? '<li class="muted body-s">… 외 ' + (v.errors.length - 30) + '건</li>' : '') + '</ul><button class="btn sm" id="dlErr">' + icon('download') + '오류 목록 CSV</button>' : '<p class="muted body-s">값 오류 없음</p>') +
          (v.warnings.length ? '<div class="eyebrow ko">파서 경고</div><ul class="stack" style="gap:4px">' + v.warnings.map(w => '<li class="body-s muted">· ' + esc(w.msg) + '</li>').join('') + '</ul>' : '') +
          '</div></div>' +
          '<div class="panel"><div class="panel-h"><div class="subheading">연결 메타데이터 (원본은 그대로)</div></div><div class="panel-b">' + A.mrow('규격 · 매핑', '<span class="badge mono">spec-v0.1</span> <span class="badge mono">map-v' + (Object.values(st.mapping).length >= 12 ? '2' : '1') + '</span>') + A.mrow('처리기', '<span class="badge mono">proc-v1.2</span>') + A.mrow('적용 보정', st.fixes.size ? [...st.fixes].map(f => '<span class="badge warn">' + ({ acc_ms2: '가속도 ÷9.80665', gyro_rad: '각속도 ×57.3', rad: '각도 rad→°', utc9: '시각 +9h', flip: '좌우 반전' })[f] + '</span>').join(' ') : '<span class="muted">없음</span>') + A.mrow('업로드자', A.roleInfo().id + ' (대리 입력 표기)') + '</div></div></div></div>' +
          '<div class="row between rv"><button class="btn" id="back2">' + icon('back') + '매핑으로</button><div class="row"><button class="btn ghost" id="discard">버리기</button><button class="btn primary' + (blocked ? ' disabled' : '') + '" id="commit"' + (blocked ? ' disabled' : '') + '>' + icon('link') + '세션에 연결 · 저장</button></div></div>';
      }
      A.view({ crumb: '<b>CSV 업로드</b>', eyebrow: '관리자 대행 업로드 · 선수 세션에 연결', title: 'CSV 업로드', lede: '컬럼 이름이 같아도 단위·시간·장착 방향이 바뀐 파일을 값 자체로 잡습니다 — 정지 구간 가속도가 1g인지, 실제 샘플링이 몇 Hz인지, 보정 동작 구간의 기울기 부호가 맞는지를 계산해 통과·경고·차단으로 나눕니다.', actions: '<a class="btn" href="#/validator">' + icon('zap') + '규격 검증기</a>', body });
      bind();
    }
    function bind() {
      const sel = $('#sesSel'); if (sel) sel.onchange = () => { st.ses = A.sessionOf(sel.value); render(); };
      const fi = $('#fileIn'); if (fi) fi.onchange = () => { const f = fi.files[0]; if (!f) return; if (f.size > 50 * 1024 * 1024) { toast('50MB를 넘습니다 — 무료 티어 업로드 한도(F06). 분할 또는 Pro 플랜 필요', 'crit'); return; } const r = new FileReader(); r.onload = () => load(r.result, f.name); r.readAsText(f); };
      const dz = $('#dropZone'); if (dz) { dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); }); dz.addEventListener('dragleave', () => dz.classList.remove('over')); dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); const f = e.dataTransfer.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => load(r.result, f.name); r.readAsText(f); }); }
      $$('[data-fx]').forEach(b => b.onclick = () => { const f = FX.find(x => x.id === b.dataset.fx); load(f.csv, 'sample_' + f.id + '.csv'); });
      $$('[data-col]').forEach(s => s.onchange = () => { const m = {}; $$('[data-col]').forEach(x => { if (x.value) m[x.dataset.col] = x.value; }); m.__hints = st.parsed.mapping.__hints; st.mapping = m; });
      const b1 = $('#back1'); if (b1) b1.onclick = () => { st.step = 1; render(); };
      const b2 = $('#back2'); if (b2) b2.onclick = () => { st.step = 2; render(); };
      const g3 = $('#go3'); if (g3) g3.onclick = () => { g3.innerHTML = '<span class="spin"></span>검사 중'; setTimeout(check, 350); };
      $$('[data-fix]').forEach(b => b.onclick = () => { const f = b.dataset.fix; if (st.fixes.has(f)) st.fixes.delete(f); else st.fixes.add(f); render(); toast(st.fixes.has(f) ? '보정을 메타데이터로 기록했습니다 — 원본 파일은 바뀌지 않습니다' : '보정을 해제했습니다', 'info', 2200); });
      const de = $('#dlErr'); if (de) de.onclick = () => IO.downloadCSV('upload_errors_' + st.ses.id + '.csv', ['line', 'channel', 'message'], st.v.errors.map(e => [e.line, e.col, e.msg]));
      const dc = $('#discard'); if (dc) dc.onclick = () => { st.step = 1; st.text = null; render(); toast('파일을 버렸습니다 — 저장된 것은 없습니다', 'info'); };
      const cm = $('#commit'); if (cm && !cm.disabled) cm.onclick = commit;
    }
    function load(text, name) {
      st.text = text; st.name = name; st.parsed = IO.parseCSV(text); st.mapping = Object.assign({}, st.parsed.mapping); st.fixes = new Set(); st.step = 2; render();
      const n = Object.keys(st.mapping).filter(k => k !== '__hints').length; toast(n ? '자동 매칭 ' + n + '열 — 확인 후 물리 검사를 실행하세요' : '표준 채널과 맞는 열이 없습니다 — 수동으로 매핑하세요', n ? 'good' : 'warn');
    }
    function check() {
      const v = IO.validate(st.parsed.rows, st.mapping, { headerRow: st.parsed.header });
      st.v = v.ok ? IO.applyFixes(v) : v;
      st.phys = v.ok ? IO.physicsCheck(st.v, { date: st.ses.date, time: st.ses.time, duration: st.ses.duration, declaredHz: st.ses.profile.hz }, v.rawT) : { level: 'block', checks: v.errors.filter(e => e.fatal).map(e => ({ key: 'fatal', level: 'block', title: e.msg, detail: '매핑 단계에서 필수 채널을 지정해야 합니다' })) };
      st.step = 3; render();
    }
    function commit() {
      const s = st.ses; const files = s.csv ? 1 : 0;
      D.patchSession(s.id, { csv: { file: st.name, hz: Math.round(st.v.stats.hz) || s.profile.hz, rows: st.v.rows, uploadedAt: '2026-10-16 ' + new Date().toTimeString().slice(0, 5), by: 'admin', fingerprint: st.parsed.fingerprint, mappingVersion: 'map-v' + (Object.values(st.mapping).length >= 12 ? '2' : '1'), processor: 'proc-v1.2', fixes: [...st.fixes], parts: files + 1 } });
      D.log({ who: A.roleInfo().id, role: A.roleInfo().name, target: s.athlete, action: 'CSV 업로드(대리)', detail: s.id + ' · ' + st.name + (st.fixes.size ? ' · 보정 ' + [...st.fixes].join(',') : '') });
      toast('<b>' + s.id + '</b>에 연결했습니다 — 원본 보존 · 지표 계산 proc-v1.2' + (files ? ' · 구간 ' + (files + 1) : ''), 'good', 3600);
      location.hash = '#/session/' + s.id;
    }
  }

  /* ---------- 규격 검증기 (센서 업체용 · 저장 안 함) ---------- */
  function validator() {
    const body = '<div class="grid g12 rv"><div class="span-5 stack"><div class="panel"><div class="panel-h"><div class="subheading">' + icon('zap') + '샘플 CSV 판정</div><span class="muted body-s">저장하지 않음</span></div><div class="panel-b stack">' +
      '<label class="file-btn" id="vDrop">' + icon('upload') + '<span>센서 앱 CSV 넣기</span><small>판정만 하고 버립니다 — 실데이터 테이블에 닿지 않습니다</small><input type="file" accept=".csv,text/csv" class="sr" id="vFile"></label>' +
      '<div class="eyebrow ko">불량 픽스처 8종 + 정상 (성공 기준 3)</div><div class="stack" style="gap:6px">' + FX.map(f => '<button class="list-row" data-vfx="' + f.id + '" style="min-height:48px;padding:10px 12px"><span class="badge ' + (f.expect === 'pass' ? 'good' : f.expect === 'warn' ? 'warn' : 'crit') + '">' + ({ pass: '통과', warn: '경고', block: '차단' })[f.expect] + '</span><span class="t"><b style="font-size:13px">' + esc(f.name) + '</b><small>' + esc(f.note) + '</small></span>' + icon('chevR', 'chev') + '</button>').join('') + '</div></div></div></div>' +
      '<div class="span-7 stack"><div class="panel" id="vResult"><div class="panel-b"><div class="empty"><div class="dash">—</div><b>왼쪽에서 샘플을 고르거나 파일을 넣으세요.</b>매핑 → 검증 → 물리 검사 결과가 여기에 나옵니다.</div></div></div>' +
      '<div class="panel"><div class="panel-h"><div class="subheading">' + icon('file') + 'CSV 규격서 v0.1 (센서 업체 공유용 초안)</div><button class="btn sm" id="dlSpec">' + icon('download') + '샘플 CSV</button></div><div class="tbl-wrap" style="border:0;border-radius:0"><table class="tbl" style="min-width:0"><thead><tr><th>열</th><th>단위</th><th>필수</th><th>비고</th></tr></thead><tbody>' +
      [['timestamp', 'ms (세션 시작 0 또는 epoch ms)', '필수', '단조 증가 · 지수 표기 금지'], ['acc_x/y/z', 'g', '권장', '정지 구간 |a| = 1.00 ± 0.15'], ['gyro_x/y/z', '°/s', '권장', 'rad/s면 헤더에 (rad) 표기'], ['mag_x/y/z', 'µT', '선택', '회전 신뢰도 판정에 사용'], ['roll / pitch / yaw', '°', '자세값 필수 (또는 쿼터니언)', '센서 퓨전은 센서 앱 책임 — 원시값만 오면 자세 계산 불가'], ['qw/qx/qy/qz', '-', '대안', 'scalar-first · 노름 1'], ['sensor_id', '-', '권장', '멀티 센서 대비'], ['(파일명)', '-', '권장', 'imu_<익명ID>_<YYYYMMDD>_<HHMM>.csv']].map(r => '<tr><td class="id">' + r[0] + '</td><td class="body-s">' + r[1] + '</td><td><span class="badge' + (r[2].startsWith('필수') || r[2].includes('필수') ? ' accent' : '') + '">' + r[2] + '</span></td><td class="muted body-s">' + r[3] + '</td></tr>').join('') +
      '</tbody></table></div><div class="panel-f">시작 프로토콜: <b>5초 정지 + 왼쪽으로 기울이기 3초</b> — 이 구간으로 장착 방향과 선 자세 기본 기울기를 자동 확인합니다. 인코딩 UTF-8(BOM 허용), 구분자 콤마 권장(세미콜론·탭 허용).</div></div></div></div>';
    A.view({ crumb: '<b>규격 검증기</b>', eyebrow: '센서 업체용 · 실데이터 접근 없음', title: '규격 검증기', lede: '센서 앱은 별도 업체가 개발 중이고 실데이터는 납품 뒤에 들어옵니다. 센서 업체가 샘플 CSV만 넣어 우리 규격에 맞는지 미리 확인하는 도구 — 제3자에게 선수 데이터를 열지 않습니다.', body });
    const run = (text, name) => {
      const p = IO.parseCSV(text); const v0 = IO.validate(p.rows, p.mapping, { headerRow: p.header }); const v = v0.ok ? IO.applyFixes(v0) : v0;
      const ph = v0.ok ? IO.physicsCheck(v, { date: '2026-10-14', time: '10:30', duration: 40, declaredHz: 100 }, v0.rawT) : { level: 'block', checks: v0.errors.filter(e => e.fatal).map(e => ({ level: 'block', title: e.msg, detail: '필수 채널 매핑 실패' })) };
      const dupOf = KNOWN()[p.fingerprint]; const lv = dupOf ? 'block' : ph.level;
      $('#vResult').innerHTML = '<div class="panel-h"><div class="subheading">' + esc(name) + '</div><span class="badge ' + (lv === 'pass' ? 'good' : lv === 'warn' ? 'warn' : 'crit') + ' count-in">' + ({ pass: '통과', warn: '경고', block: '차단' })[lv] + '</span></div><div class="panel-b stack">' +
        '<div class="row"><span class="badge mono">구분자 ' + (p.delim === '\t' ? 'TAB' : p.delim) + '</span><span class="badge mono">' + (p.header ? '헤더' : '헤더 없음') + '</span><span class="badge mono">매핑 ' + Object.keys(p.mapping).filter(k => k !== '__hints').length + '/' + p.headers.length + '</span><span class="badge mono">행 ' + fmtN(v.rows || p.rows.length) + '</span>' + (v.stats && v.stats.hz ? '<span class="badge mono">' + v.stats.hz.toFixed(0) + 'Hz · ' + (v.stats.duration).toFixed(0) + 's</span>' : '') + '</div>' +
        '<div class="checks">' + (dupOf ? '<div class="block"><span class="ic">' + icon('close') + '</span><div><b>중복 파일 — 이미 ' + dupOf + '에 연결됨</b><p>파일 지문 ' + p.fingerprint + '</p></div></div>' : '') + ph.checks.map(c => '<div class="' + c.level + '"><span class="ic">' + icon(c.level === 'pass' ? 'check' : c.level === 'warn' ? 'alert' : 'close') + '</span><div><b>' + esc(c.title) + '</b><p>' + esc(c.detail) + '</p></div></div>').join('') + '</div>' +
        (v.errors && v.errors.length ? '<div class="eyebrow ko">행 오류 ' + v.errors.length + '</div><ul class="stack" style="gap:4px;max-height:160px;overflow:auto">' + v.errors.slice(0, 12).map(e => '<li class="body-s"><span class="mono" style="color:var(--crit)">' + (e.line === '-' ? '—' : 'LINE ' + e.line) + '</span> ' + esc(e.msg) + '</li>').join('') + '</ul>' : '') +
        (v.warnings && v.warnings.length ? '<ul class="stack" style="gap:4px">' + v.warnings.map(w => '<li class="body-s muted">· ' + esc(w.msg) + '</li>').join('') + '</ul>' : '') + '</div>';
      reveal($('#vResult'));
    };
    $$('[data-vfx]').forEach(b => b.onclick = () => { const f = FX.find(x => x.id === b.dataset.vfx); run(f.csv, 'sample_' + f.id + '.csv'); });
    $('#vFile').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => run(r.result, f.name); r.readAsText(f); };
    $('#dlSpec').onclick = () => IO.download(new Blob([FX[0].csv], { type: 'text/csv;charset=utf-8' }), 'imu_sample_spec_v0.1.csv');
    // 처음 열면 정상 샘플을 바로 보여 준다 (입력 없이 체험)
    run(FX[0].csv, 'sample_good.csv');
  }

  /* ---------- 자료 추출 ---------- */
  function exportPage(parts, q) {
    if (!A.can('export')) return A.denied('자료 추출');
    const S = D.sessions(); const As = D.athletes();
    const st = { type: q.type || 'summary', quasi: false, athlete: q.athlete || '' };
    const bin5 = v => Math.floor(v / 5) * 5 + '~' + (Math.floor(v / 5) * 5 + 4);
    const ampCoarse = lv => ({ hand: '전완 이하', forearm: '전완 이하', upperarm: '상완 이상', shoulder: '상완 이상', limited: '기능 제한' })[lv];
    const san = s => /^[=+\-@\t\r]/.test(String(s)) ? "'" + s : s;
    render();
    function render() {
      const rows = buildRows();
      const rawTotal = S.filter(s => s.csv).reduce((t, s) => t + s.csv.rows, 0);
      const k = kAnon();
      const body = '<div class="grid g12 rv"><div class="span-4 stack"><div class="panel"><div class="panel-h"><div class="subheading">무엇을 내보낼까</div></div><div class="panel-b stack" style="gap:8px">' +
        [['summary', '세션 요약 .xlsx', '세션 1행 — 치우침·회전 비·RMS·조건 지문 · 엑셀 피벗용'], ['raw', '원본 CSV (UTF-8 BOM)', '세션별 원본 · 엑셀 한도 104만 행 초과 시 분할'], ['fit', '착용 평가 .xlsx', '제품·버전·사이즈 스냅샷 + 7항목 + 메모']].map(t => '<button class="list-row" data-type="' + t[0] + '" style="' + (st.type === t[0] ? 'border-color:var(--accent);background:var(--accent-t)' : '') + '"><span class="t"><b>' + t[1] + '</b><small>' + t[2] + '</small></span>' + (st.type === t[0] ? icon('check', 'chev') : icon('chevR', 'chev')) + '</button>').join('') +
        '</div></div>' +
        '<div class="panel"><div class="panel-h"><div class="subheading">옵션</div></div><div class="panel-b stack">' +
        '<div class="field"><label>선수</label><select class="select" id="exAth"><option value="">전체</option>' + As.map(a => '<option value="' + a.id + '"' + (a.id === st.athlete ? ' selected' : '') + '>' + a.id + '</option>').join('') + '</select></div>' +
        '<div class="switch-row"><div><b>준식별자 포함</b><div class="help">종목·절단 측/수준·신체 치수 그대로. 끄면 치수는 5cm 구간, 절단 수준은 상위 범주로</div></div><button class="switch" role="switch" aria-checked="' + st.quasi + '" id="quasiSw"></button></div>' +
        (st.quasi && k.risky.length ? '<div class="note crit">' + icon('alert') + '<div><b>재식별 경고 k&lt;3</b> — 종목+절단 측+수준 조합이 ' + k.risky.length + '건에서 선수 1~2명만 해당합니다: ' + k.risky.map(r => '<span class="badge crit">' + r.key + ' · ' + r.n + '명</span>').join(' ') + '<br>실증 인원이 적어 조합만으로 특정될 수 있습니다. 외부 공유 파일은 준식별자를 끄세요.</div></div>' : '<div class="note good">' + icon('checkC') + '<div>' + (st.quasi ? '모든 조합이 k ≥ 3' : '준식별자 제외 — 신체 치수 구간화 · 절단 수준 상위 범주') + '</div></div>') +
        '</div></div></div>' +
        '<div class="span-8 stack"><div class="panel"><div class="panel-h"><div class="subheading">' + icon('eye') + '미리보기 · ' + fmtN(rows.rows.length) + '행 × ' + rows.headers.length + '열</div><div class="row">' + (st.type === 'raw' ? '<span class="badge ' + (rawTotal > 1048576 ? 'warn' : '') + '">원본 합계 ' + fmtN(rawTotal) + '행' + (rawTotal > 1048576 ? ' → ' + Math.ceil(rawTotal / 1000000) + '개 파일로 분할' : '') + '</span>' : '') + '<button class="btn primary" id="doExport">' + icon('download') + '다운로드</button></div></div>' +
        '<div class="tbl-wrap" style="border:0;border-radius:0;max-height:420px"><table class="tbl"><thead><tr>' + rows.headers.map(h => '<th class="ko">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.rows.slice(0, 12).map(r => '<tr>' + r.map(c => '<td class="body-s" style="white-space:nowrap">' + esc(typeof c === 'number' ? fmtN(c, Number.isInteger(c) ? 0 : 2) : c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' +
        '<div class="panel-f">' + (st.type === 'raw' ? '13자리 타임스탬프는 텍스트로 보존됩니다. 엑셀로 열었다 저장하면 1.79E+12로 망가지므로 <b>원본은 CSV, 요약은 xlsx</b>로 분리합니다 (F05).' : st.type === 'fit' ? '자유 텍스트 메모가 <b>-</b> <b>=</b> <b>+</b> <b>@</b>로 시작하면 엑셀이 수식으로 실행합니다 → 앞에 작은따옴표를 붙여 무해화합니다 (OWASP CSV Injection). 미리보기에 「-압박감이…」 항목을 확인하세요.' : 'xlsx 안 날짜는 날짜 셀, 지문·ID는 텍스트 셀. 다운로드는 접속기록에 남습니다.') + '</div></div>' +
        '<div class="panel"><div class="panel-h"><div class="subheading">' + icon('history') + '최근 추출 기록</div></div><div class="panel-b">' + D.accessLog().filter(l => /추출|다운로드/.test(l.action)).slice(0, 5).map(l => A.mrow('<span class="mono" style="text-transform:none">' + l.at + '</span> · ' + l.who, '<span class="body-s">' + esc(l.action) + ' · ' + esc(l.detail) + '</span>')).join('') + '</div></div></div></div>';
      A.view({ crumb: '<b>자료 추출</b>', eyebrow: 'Excel · CSV · 실제 파일 생성', title: '자료 추출', lede: '저장된 기록을 Excel 또는 CSV로 내려받습니다. 엑셀이 데이터를 조용히 망가뜨리는 지점(104만 행 한도·지수 표기·CP949·수식 주입)을 피하도록 3종으로 분리했고, 외부 공유용은 준식별자를 뺍니다.', body });
      $$('[data-type]').forEach(b => b.onclick = () => { st.type = b.dataset.type; render(); });
      $('#exAth').onchange = e => { st.athlete = e.target.value; render(); };
      $('#quasiSw').onclick = () => { st.quasi = !st.quasi; render(); };
      $('#doExport').onclick = () => doExport(rows);
    }
    function kAnon() { const groups = {}; As.forEach(a => { const key = A.sportName(a.sport) + '/' + (a.amp.side === 'L' ? '좌' : '우') + '/' + D.AMP_LEVELS[a.amp.level]; groups[key] = (groups[key] || 0) + 1; }); return { risky: Object.entries(groups).filter(([, n]) => n < 3).map(([key, n]) => ({ key, n })) }; }
    function buildRows() {
      const list = S.filter(s => !st.athlete || s.athlete === st.athlete);
      if (st.type === 'summary') {
        const headers = ['세션', '익명ID', '일자', '시간', '길이(초)', '종목', '유형', '절단측', st.quasi ? '절단수준' : '절단범주', '브라', '버전', '사이즈', '의수', '센서', 'Hz', '장착위치', '조건지문', '치우침%', '치우침방향', '회전비(건측/절단측)', '각속도RMS', '충격수', 'CSV파일', '파일지문'];
        const rows = list.filter(s => s.csv).map(s => { const a = A.athleteOf(s.athlete); const m = D.summary(s) || {}; const sound = A.soundSide(a); const ratio = m.rotL ? (sound === 'R' ? m.rotR / m.rotL : m.rotL / m.rotR) : 0; return [s.id, s.athlete, s.date, s.time, s.duration, A.sportName(s.sport), s.type, a.amp.side === 'L' ? '좌' : '우', st.quasi ? D.AMP_LEVELS[a.amp.level] : ampCoarse(a.amp.level), s.bra, s.braVersion, s.braSize, s.profile.prosthesis, s.profile.sensorId, s.profile.hz, s.profile.position, D.profileFingerprint(s), Math.round((m.asym || 0) * 10) / 10, m.asym > 0 ? '오른쪽' : '왼쪽', Math.round(ratio * 100) / 100, Math.round(m.rms || 0), m.impacts || 0, s.csv.file, s.csv.fingerprint]; });
        return { headers, rows, name: 'athledger_세션요약_' + D.TODAY.replace(/-/g, '') + '.xlsx' };
      }
      if (st.type === 'fit') {
        const headers = ['세션', '익명ID', '일자', '제품', '버전', '사이즈', ...D.FIT_ITEMS.map(i => i.label), '메모', '입력자'];
        const rows = list.filter(s => s.fit).map(s => [s.id, s.athlete, s.date, s.bra, s.braVersion, s.braSize, ...D.FIT_ITEMS.map(i => s.fit[i.key]), san(s.fitComment || ''), s.csv && s.csv.by === 'admin' ? '관리자 대리' : '선수']);
        if (rows.length) rows[0][headers.length - 2] = san('-압박감이 밴드 쪽에 집중됨 (수식 주입 테스트)');
        return { headers, rows, name: 'athledger_착용평가_' + D.TODAY.replace(/-/g, '') + '.xlsx' };
      }
      const headers = ['세션', '익명ID', '파일', '행', 'Hz', '지문', '시작 timestamp(ms, 텍스트)'];
      const rows = list.filter(s => s.csv).map(s => [s.id, s.athlete, s.csv.file, s.csv.rows, s.csv.hz, s.csv.fingerprint, "'" + String(new Date(s.date + 'T' + s.time + ':00+09:00').getTime())]);
      return { headers, rows, name: 'athledger_원본목록_' + D.TODAY.replace(/-/g, '') + '.csv' };
    }
    function doExport(rows) {
      if (st.type === 'raw') { IO.downloadCSV(rows.name, rows.headers, rows.rows); } else IO.downloadXlsx(rows.name, [{ name: st.type === 'summary' ? '세션 요약' : '착용 평가', headers: rows.headers, rows: rows.rows }, { name: '메타', headers: ['항목', '값'], rows: [['생성', D.TODAY], ['준식별자', st.quasi ? '포함' : '제외(구간화)'], ['행 수', rows.rows.length], ['주의', '운동 기록 기술 통계 — 의학적 판단이 아닙니다'], ['데이터', '전부 가상']] }]);
      D.log({ who: A.roleInfo().id, role: A.roleInfo().name, target: st.athlete || '전체', action: '자료 추출 (' + (st.type === 'raw' ? 'csv' : 'xlsx') + ')', detail: rows.name + ' · ' + rows.rows.length + '행 · 준식별자 ' + (st.quasi ? '포함' : '제외') });
      toast('<b>' + rows.name + '</b> 다운로드 — ' + rows.rows.length + '행 · 접속기록에 남았습니다', 'good', 3600);
    }
  }

  A.route('upload', upload); A.route('validator', validator); A.route('export', exportPage);
})(window);
