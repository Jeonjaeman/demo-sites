/* 2-2 학생 목록 — 학과/반/희망 직무/증빙 상태 필터 · 검색 · 정렬 · 표준 엑셀 템플릿 일괄 업로드(매핑 → 검증 → 반영) */
(function () {
  'use strict';
  const role = UI.requireRole(); if (!role) return;
  const { $, $$, esc, toast, modal, badge } = UI;
  const content = ADMIN.mountShell(role, { actions: `<button class="btn btn--ghost btn--sm" id="tplDl">표준 템플릿 받기</button><button class="btn btn--primary btn--sm" id="upload">엑셀 일괄 업로드</button>` });
  const st = CP.load();
  const qs = new URLSearchParams(location.search);
  const scoped = () => CP.scopedStudents(role);
  const f = { dept: qs.get('dept') || '', cls: '', job: '', proof: qs.get('f') === 'proof', status: '', track: '', q: '' };
  let page = 1;

  const depts = role.can.viewAll ? CP.DEPARTMENTS : CP.DEPARTMENTS.filter((d) => d.id === role.dept);
  content.innerHTML = `
    <section class="panel" data-reveal>
      <header class="panel__head panel__head--wrap">
        <div class="filters">
          <select class="select" id="fDept" aria-label="학과"><option value="">전체 학과</option>${depts.map((d) => `<option value="${d.id}" ${f.dept === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select>
          <select class="select" id="fCls" aria-label="반"><option value="">전체 반</option><option value="1">1반</option><option value="2">2반</option></select>
          <select class="select" id="fJob" aria-label="희망 직무"><option value="">전체 희망 직무</option>${Object.keys(st.specs).map((j) => `<option>${j}</option>`).join('')}</select>
          <select class="select" id="fStatus" aria-label="취업 상태"><option value="">전체 상태</option><option value="preparing">준비 중</option><option value="placed">실습 배정</option><option value="hired">취업 확정</option></select>
          <select class="select" id="fTrack" aria-label="진로 트랙"><option value="">전체 트랙</option><option value="job">취업</option><option value="college">진학</option><option value="military">입대</option></select>
          <button class="chip${f.proof ? ' is-on' : ''}" id="fProof" aria-pressed="${f.proof}">증빙 확인 대기만</button>
          <label class="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="q" type="search" placeholder="이름·학번 검색" aria-label="이름 또는 학번 검색"></label>
        </div>
        <div class="panel__tools"><span id="count" class="muted t-small"></span><button class="btn btn--ghost btn--sm" id="csv">목록 CSV</button></div>
      </header>
      <div class="table-wrap">
        <table class="table" id="tbl">
          <thead><tr><th data-sort="sid">학번</th><th data-sort="name">이름</th><th>학과 · 반</th><th data-sort="job">희망 직무</th><th class="num" data-sort="score">진로 준비도</th><th>자격증(확인/전체)</th><th>포트폴리오</th><th>트랙</th><th data-sort="jobStatus">상태</th><th class="actions"></th></tr></thead>
          <tbody id="body"></tbody>
        </table>
      </div>
      <footer class="panel__foot" id="pager"></footer>
    </section>`;

  const rows = () => scoped().filter((s) => (!f.dept || s.dept === f.dept) && (!f.cls || s.cls === Number(f.cls)) && (!f.job || s.job === f.job) && (!f.status || s.jobStatus === f.status) && (!f.track || s.track === f.track) && (!f.proof || [...s.certs, ...s.langs, ...s.awards].some((x) => x.status === 'pending')) && (!f.q || s.name.includes(f.q) || s.sid.includes(f.q))).map((s) => ({ ...s, score: CPX.gap(s).score, _s: s }));
  let sorted = null;
  function render(list) {
    const data = list || sorted || rows(); if (!list) sorted = null;
    const pg = ADMIN.paginate(data, page, 25);
    $('#body').innerHTML = pg.items.map((r) => { const s = r._s; const vc = s.certs.filter((c) => c.status === 'verified').length; const pend = [...s.certs, ...s.langs, ...s.awards].filter((x) => x.status === 'pending').length; const pf = s.portfolio.filter((p) => p.ver > 0); return `<tr>
      <td class="mono">${s.sid}</td><td><a class="plink" href="student.html?id=${s.id}">${esc(s.name)}</a></td><td>${esc(CP.dept(s.dept).short)} 3-${s.cls}</td><td>${esc(s.job)}</td>
      <td class="num"><span class="meter" title="필수 70% + 권장 30% 가중"><i style="--v:${r.score}%"></i></span><b>${r.score}</b></td>
      <td>${vc}/${s.certs.length}${pend ? ` ${badge(`대기 ${pend}`, 'warn')}` : ''}</td>
      <td>${pf.length ? `v${pf.length} <span class="muted t-small">${CP.fmt.date(pf[pf.length - 1].date)}</span>` : '<span class="muted">없음</span>'}</td>
      <td>${{ job: '취업', college: '진학', military: '입대' }[s.track]}</td><td>${ADMIN.jobStatusBadge(s)}</td><td class="actions"><a class="btn btn--ghost btn--sm" href="student.html?id=${s.id}">상세</a></td></tr>`; }).join('');
    $('#count').textContent = `${pg.total}명`;
    $('#pager').innerHTML = ADMIN.pagerHtml(pg);
    if (!pg.items.length) $('#body').innerHTML = `<tr><td colspan="10" class="empty">조건에 맞는 학생이 없습니다.</td></tr>`;
  }
  render();
  ADMIN.sortable($('#tbl'), rows, (list) => { sorted = list; page = 1; render(list); });
  $('#pager').addEventListener('click', (e) => { const b = e.target.closest('[data-page]'); if (b) { page = Number(b.dataset.page); render(sorted); } });
  const bind = (id, key, isNum) => $(id).addEventListener('change', (e) => { f[key] = e.target.value; page = 1; render(); });
  bind('#fDept', 'dept'); bind('#fCls', 'cls'); bind('#fJob', 'job'); bind('#fStatus', 'status'); bind('#fTrack', 'track');
  $('#fProof').addEventListener('click', (e) => { f.proof = !f.proof; e.currentTarget.classList.toggle('is-on', f.proof); e.currentTarget.setAttribute('aria-pressed', f.proof); page = 1; render(); });
  $('#q').addEventListener('input', (e) => { f.q = e.target.value.trim(); page = 1; render(); });
  $('#csv').addEventListener('click', () => { const list = rows(); CPX.csv(`학생목록_${CP.iso(CP.TODAY)}.csv`, ['학번', '이름', '학과', '반', '번호', '희망 직무', '진로 트랙', '진로 준비도', '확인 자격증 수', '전체 자격증 수', '포트폴리오 버전', '상태'], list.map((r) => { const s = r._s; return [s.sid, s.name, CP.dept(s.dept).name, s.cls, s.no, s.job, { job: '취업', college: '진학', military: '입대' }[s.track], r.score, s.certs.filter((c) => c.status === 'verified').length, s.certs.length, s.portfolio.filter((p) => p.ver > 0).length, { preparing: '준비 중', placed: '실습 배정', hired: '취업 확정' }[s.jobStatus]]; })); CP.audit('학생 목록 CSV', `${list.length}명`); toast(`CSV ${list.length}행을 내려받았습니다 (UTF-8 BOM · 엑셀 한글 정상)`, 'ok'); });
  $('#tplDl').addEventListener('click', () => { CPX.xlsx('학생기초데이터_표준템플릿.xlsx', [{ name: '학생 기초 데이터', rows: [CPX.TEMPLATE_COLS, ['3010101', '홍길동', '스마트소프트웨어과', 1, 1, '2008-03-01', '010-1234-5678', '홍판서', '부', '010-8765-4321', '웹 개발자', '취업']] }, { name: '학과 기준표', rows: [['학과명(정확히 입력)'], ...CP.DEPARTMENTS.map((d) => [d.name])] }, { name: '희망 직무 기준표', rows: [['희망 직무(정확히 입력)'], ...Object.keys(st.specs).map((j) => [j])] }]); toast('표준 템플릿 XLSX를 내려받았습니다 — 학과·직무 기준표 시트 포함', 'ok'); });

  /* ───── 엑셀 일괄 업로드: 1 파일 → 2 열 매핑 → 3 검증 → 4 반영 ───── */
  $('#upload').addEventListener('click', () => {
    if (!role.can.assign) return ADMIN.deny(role, '일괄 업로드');
    let step = 1, rowsIn = null, result = null;
    const m = modal({ title: '학생 기초 데이터 일괄 업로드', size: 'lg', body: '<div id="upBody"></div>', actions: [{ label: '닫기' }, { label: '다음', kind: 'btn--primary', id: 'upNext', onClick: () => next() }] });
    const body = $('#upBody', m.el), nextBtn = $('#upNext', m.el);
    const stepsHtml = () => `<ol class="wizard">${['파일 선택', '열 맞추기', '검증', '반영'].map((t, i) => `<li class="${i + 1 === step ? 'is-current' : i + 1 < step ? 'is-done' : ''}"><span>${i + 1}</span>${t}</li>`).join('')}</ol>`;
    function draw() {
      if (step === 1) body.innerHTML = `${stepsHtml()}<div class="drop" id="drop"><p><b>표준 템플릿 XLSX/CSV</b>를 여기에 끌어다 놓거나</p><label class="btn btn--soft btn--sm">파일 선택<input type="file" id="file" accept=".xlsx,.csv" hidden></label><p class="muted t-small">또는</p><button class="btn btn--primary" id="sample">샘플 파일로 체험 (12행 · 오류 4행 포함)</button></div><p class="t-small muted">실서비스는 서버에서 파싱합니다. 데모는 샘플 행으로 검증 흐름을 그대로 보여 줍니다.</p>`;
      if (step === 2) body.innerHTML = `${stepsHtml()}<p class="t-body">파일의 열 제목을 시스템 항목과 맞춥니다. 표준 템플릿이면 자동으로 맞춰집니다.</p><table class="table table--compact"><thead><tr><th>파일 열</th><th>→ 시스템 항목</th><th>첫 행 값</th></tr></thead><tbody>${CPX.TEMPLATE_COLS.map((c, i) => `<tr><td>${c}</td><td><select class="select select--sm">${CPX.TEMPLATE_COLS.map((x) => `<option ${x === c ? 'selected' : ''}>${x}</option>`).join('')}</select></td><td class="muted">${esc(rowsIn[0][i])}</td></tr>`).join('')}</tbody></table>`;
      if (step === 3) { result = CPX.validateRows(rowsIn); const ok = result.filter((r) => r.status === 'ok').length, warn = result.filter((r) => r.status === 'warn').length, err = result.filter((r) => r.status === 'error').length; body.innerHTML = `${stepsHtml()}<div class="sumline">${badge(`정상 ${ok}`, 'ok')} ${badge(`자동 보정 ${warn}`, 'warn')} ${badge(`오류 ${err}`, 'danger')} <span class="muted t-small">오류 행은 반영에서 제외되고, 보정 행은 고친 값으로 들어갑니다.</span></div><div class="table-wrap table-wrap--h"><table class="table table--compact"><thead><tr><th>행</th><th>학번</th><th>이름</th><th>학과</th><th>결과</th><th>내용</th></tr></thead><tbody>${result.map((r) => `<tr class="row--${r.status}"><td>${r.row}</td><td class="mono">${esc(r.data[0])}</td><td>${esc(r.data[1])}${r.update ? ' <span class="muted t-small">(갱신)</span>' : ''}</td><td>${esc(r.data[2])}</td><td>${badge({ ok: '정상', warn: '보정', error: '오류' }[r.status], { ok: 'ok', warn: 'warn', error: 'danger' }[r.status])}</td><td class="t-small">${[...r.errs.map((x) => `<span class="t-danger">${esc(x)}</span>`), ...r.warns.map((x) => `<span class="t-warn">${esc(x)}</span>`)].join('<br>') || '—'}</td></tr>`).join('')}</tbody></table></div>`; nextBtn.textContent = `오류 ${err}행 제외하고 ${ok + warn}행 반영`; }
      if (step === 4) { const apply = result.filter((r) => r.status !== 'error'); let added = 0, updated = 0; apply.forEach((r) => { const [sid, name, deptName, cls, no, birth, phone, gName, gRel, gPhone, job, trackK] = r.data; const fix = (p) => { const s = String(p); return /^\d{10}$/.test(s) ? `010-${s.slice(2, 6)}-${s.slice(6)}` : s; }; const ex = st.students.find((x) => x.sid === sid); if (ex) { ex.phone = fix(phone); ex.guardian = { name: gName, rel: gRel, phone: fix(gPhone) }; if (st.specs[job]) ex.job = job; ex.track = { '진학': 'college', '입대': 'military' }[trackK] || 'job'; updated++; } else { const d = CP.DEPARTMENTS.find((x) => x.name === deptName); st.students.push({ id: `s${Date.now().toString(36)}${added}`, sid, name, dept: d.id, cls: Number(cls), no: Number(no), birth, phone: fix(phone), job: st.specs[job] ? job : CP.JOBS_BY_DEPT[d.id][0], goal: '미정', track: { '진학': 'college', '입대': 'military' }[trackK] || 'job', infoConsent: false, jobAlertOptIn: false, guardian: { name: gName, rel: gRel, phone: fix(gPhone), legal: /^(부|모)$/.test(gRel) }, certs: [], langs: [], awards: [], portfolio: [], memos: [], jobStatus: 'preparing', imported: true }); added++; } }); st.uploads.unshift({ at: new Date().toISOString().slice(0, 16).replace('T', ' '), by: role.person, rows: rowsIn.length, added, updated, errors: result.length - apply.length }); CP.save(); CP.audit('엑셀 일괄 업로드', `${rowsIn.length}행 · 신규 ${added} · 갱신 ${updated} · 오류 제외 ${result.length - apply.length}`); body.innerHTML = `${stepsHtml()}<div class="done-inline"><b>반영 완료</b> — 신규 ${added}명 · 갱신 ${updated}명 · 제외 ${result.length - apply.length}행<br><span class="muted t-small">제외된 행은 오류 내용과 함께 CSV로 내려받아 고친 뒤 다시 올리면 됩니다.</span></div>`; nextBtn.textContent = '오류 행 CSV 받기'; nextBtn.onclick = () => { CPX.csv('업로드_오류행.csv', ['행', ...CPX.TEMPLATE_COLS, '오류'], result.filter((r) => r.status === 'error').map((r) => [r.row, ...r.data, r.errs.join(' / ')])); }; render(); }
    }
    function next() { if (step === 1) { if (!rowsIn) return toast('파일을 고르거나 샘플로 체험을 누르세요', 'warn'); step = 2; } else if (step === 2) step = 3; else if (step === 3) step = 4; draw(); }
    draw();
    body.addEventListener('click', (e) => { if (e.target.id === 'sample') { rowsIn = CPX.sampleUploadRows(); step = 2; draw(); } });
    body.addEventListener('change', (e) => { if (e.target.id === 'file') { toast(`"${e.target.files[0].name}" — 데모는 서버 파싱 대신 샘플 행으로 진행합니다`, 'info'); rowsIn = CPX.sampleUploadRows(); step = 2; draw(); } });
    body.addEventListener('dragover', (e) => { e.preventDefault(); const d = $('#drop', body); if (d) d.classList.add('is-over'); });
    body.addEventListener('dragleave', () => { const d = $('#drop', body); if (d) d.classList.remove('is-over'); });
    body.addEventListener('drop', (e) => { e.preventDefault(); rowsIn = CPX.sampleUploadRows(); step = 2; draw(); });
  });
  UI.reveal();
})();
