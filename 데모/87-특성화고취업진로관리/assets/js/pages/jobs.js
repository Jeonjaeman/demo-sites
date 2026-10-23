/* 2-3 기업 공고·매칭 — 표준협약서 법정 항목 1:1 공고 폼(F7) · 실시간 기준 검증(시급·시간·연장·휴게·보험·승인·유해위험·60일·1:1) · 매칭 보드 · 정보 제공 동의 없는 학생은 기업 열람 잠금(F8) · 배정 시 4단 문서 체인 생성 */
(function () {
  'use strict';
  const role = UI.requireRole(); if (!role) return;
  const { $, $$, esc, toast, modal, badge } = UI;
  const content = ADMIN.mountShell(role, { actions: `<button class="btn btn--ghost btn--sm" id="exampleJob">예시 공고 불러오기</button><button class="btn btn--primary btn--sm" id="newJob">기업 공고 등록</button>` });
  const st = CP.load(); st.applications = st.applications || [];
  const qs = new URLSearchParams(location.search); let fDept = qs.get('dept') || '';
  const R = CP.RULES;

  content.innerHTML = `
    <section class="panel" data-reveal>
      <header class="panel__head panel__head--wrap">
        <div><h2 class="panel__title">매칭 보드</h2><p class="panel__desc">공고에 학생을 배정하면 보호자 → 학생 → 기업 → 학교장 4단 문서 체인이 생깁니다. 공고 항목은 표준협약서 필수 기재사항과 1:1이고, 기준(1일 7시간·주 35시간, 최저 수당, 산재보험, 기업 승인, 유해위험, 60일, 1:1 현장교사)을 넘는 공고는 <b>배정이 잠깁니다.</b></p></div>
        <div class="filters"><select class="select" id="fDept" aria-label="학과"><option value="">전체 학과</option>${CP.DEPARTMENTS.map((d) => `<option value="${d.id}" ${fDept === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select></div>
      </header>
      <div class="board" id="board"></div>
    </section>`;

  const stageOf = (j) => { const pls = st.placements.filter((p) => p.jobId === j.id); if (j.status === 'closed') return 'done'; if (j.status === 'ongoing') return 'ongoing'; if (j.approval === 'none') return 'pending'; if (!pls.length) return 'open'; if (pls.every((p) => CPX.placementState(p) === 'complete')) return 'ready'; return 'assigned'; };
  const STAGES = [['pending', '승인 대기(실사·심의)'], ['open', '모집 중'], ['assigned', '배정 · 체결 진행'], ['ready', '체결 완료 · 파견 대기'], ['ongoing', '실습 진행 중']];
  function render() {
    const jobs = st.jobs.filter((j) => !fDept || j.dept === fDept);
    $('#board').innerHTML = STAGES.map(([k, label]) => { const list = jobs.filter((j) => stageOf(j) === k); return `<div class="col"><h3 class="col__title">${label} <b>${list.length}</b></h3>${list.map((j, i) => jobCard(j, i)).join('') || '<p class="col__empty">없음</p>'}</div>`; }).join('');
    UI.reveal($('#board'));
  }
  function jobCard(j, i) {
    const pls = st.placements.filter((p) => p.jobId === j.id); const d = CP.dept(j.dept); const issues = CPX.jobIssues(j); const blocks = issues.filter((x) => x.level === 'block'); const apps = st.applications.filter((a) => a.jobId === j.id).length;
    return `<article class="jobcard ${blocks.length ? 'is-blocked' : ''}" data-reveal style="--i:${i}">
      <header class="jobcard__head"><span class="dot" style="--c:${d.color}"></span><b>${esc(j.company)}</b>${badge({ leading: '선도기업', participating: '참여기업', none: '미승인' }[j.approval], { leading: 'info', participating: 'neutral', none: 'danger' }[j.approval])}${blocks.length ? badge(`배정 잠김 ${blocks.length}`, 'danger') : issues.length ? badge(`확인 ${issues.length}`, 'warn') : ''}</header>
      <p class="jobcard__role">${esc(j.role)} <span class="muted">· ${esc(d.short)}</span></p>
      <dl class="jobcard__meta"><div><dt>기간</dt><dd>${CP.fmt.date(j.start)}~ ${j.weeks}주</dd></div><div><dt>시간</dt><dd>${j.hoursPerDay}h/일 · ${j.hoursPerWeek}h/주</dd></div><div><dt>수당</dt><dd>${CP.fmt.won(j.wageHour)}/h</dd></div><div><dt>인원</dt><dd>${pls.length}/${j.headcount}${apps ? ` · 지원 ${apps}` : ''}</dd></div></dl>
      <div class="jobcard__people">${pls.map((p) => { const s = CP.student(p.studentId); const stt = CPX.placementState(p); return `<a class="pill pill--${stt}" href="consents.html?p=${p.id}" title="${CPX.PSTATE_LABEL[stt]}">${esc(s.name)}</a>`; }).join('')}</div>
      <footer class="jobcard__foot"><button class="btn btn--ghost btn--sm" data-view="${j.id}">상세</button>${j.status === 'open' && pls.length < j.headcount ? `<button class="btn btn--primary btn--sm" data-assign="${j.id}" ${role.can.assign ? '' : 'disabled title="배정 권한 없음"'}>${blocks.length ? '배정 잠김' : '학생 배정'}</button>` : ''}</footer>
    </article>`;
  }
  render();
  $('#fDept').addEventListener('change', (e) => { fDept = e.target.value; render(); });

  content.addEventListener('click', (e) => {
    const v = e.target.closest('[data-view]'); if (v) return viewJob(CP.job(v.dataset.view));
    const a = e.target.closest('[data-assign]'); if (a) return assign(CP.job(a.dataset.assign));
    if (e.target.id === 'newJob') newJob();
    if (e.target.id === 'exampleJob') newJob(null, true);
  });
  function issueList(j) { const iss = CPX.jobIssues(j); return iss.length ? `<div class="notice notice--${iss.some((x) => x.level === 'block') ? 'danger' : 'warn'}"><b>운영 기준 확인</b><ul>${iss.map((x) => `<li>${x.level === 'block' ? '⛔' : '⚠'} ${esc(x.text)}</li>`).join('')}</ul></div>` : '<p class="notice notice--ok">실습시간·수당·보험·승인·인원 기준을 모두 충족합니다.</p>'; }
  function viewJob(j) { const pls = st.placements.filter((p) => p.jobId === j.id); const apps = st.applications.filter((a) => a.jobId === j.id); modal({ title: `${j.company} · ${j.role}`, size: 'md', body: `
    <dl class="kv"><div><dt>업종 · 소재지</dt><dd>${esc(j.industry)} · ${esc(j.region)}</dd></div><div><dt>기업 구분</dt><dd>${{ leading: '선도기업(교육청 협의체 승인)', participating: '참여기업(학교 위원회 승인)', none: '미승인 — 사전 현장실사 · 위원회 심의 필요' }[j.approval]}</dd></div><div><dt>기간</dt><dd>${CP.fmt.date(j.start)} ~ ${CP.fmt.date(j.end)} (${j.weeks}주 · 실습일 ${j.days}일)</dd></div><div><dt>실습 시간</dt><dd>1일 ${j.hoursPerDay}시간 · 주 ${j.hoursPerWeek}시간 · 휴게 ${j.breakMin}분${j.extension ? ' · 연장 동의(서면)' : ''}</dd></div><div><dt>현장실습 수당</dt><dd>시간당 ${CP.fmt.won(j.wageHour)} (월 약 ${CP.fmt.won(CPX.monthlyAllowance(j))}) · 매월 ${j.payDay}일</dd></div><div><dt>인원</dt><dd>모집 ${j.headcount} · 배정 ${pls.length} · 학생 지원 ${apps.length} · 기업현장교사 ${j.mentors}명</dd></div><div><dt>안전</dt><dd>${j.insurance ? '산재보험 가입' : '산재보험 미확인'} · ${j.safetyEdu ? '사전 안전교육' : '안전교육 미정'} · ${j.hazard ? '유해위험 업종 표시' : '일반 업종'}</dd></div><div><dt>담당</dt><dd>대표 ${esc(j.ceo)} · 현장 ${esc(j.contact)}</dd></div></dl>
    ${issueList(j)}
    <h3 class="t-eyebrow mt">배정 학생</h3>${pls.length ? `<ul class="bullets bullets--tight">${pls.map((p) => { const s = CP.student(p.studentId); return `<li>${esc(s.name)} (${CP.dept(s.dept).short} 3-${s.cls}) — ${CPX.PSTATE_LABEL[CPX.placementState(p)]}</li>`; }).join('')}</ul>` : '<p class="muted">없음</p>'}`, actions: [{ label: '닫기' }, ...(role.can.assign && j.status !== 'closed' ? [{ label: '수정', onClick: (m) => { m.close(); newJob(j); } }] : [])] }); }

  /* 추천 매칭 — 학생 지원 · 희망 직무 일치 · 준비도 순 · 정보 제공 동의(F8) */
  function assign(j) {
    if (!role.can.assign) return ADMIN.deny(role, '배정');
    const blocks = CPX.jobIssues(j).filter((x) => x.level === 'block');
    if (blocks.length) return modal({ title: '배정할 수 없습니다', size: 'sm', body: `<div class="notice notice--danger"><ul>${blocks.map((x) => `<li>${esc(x.text)}</li>`).join('')}</ul></div><p class="t-body">기준을 넘는 조건으로 배정하면 협약서·동의서에 그대로 들어갑니다(표준협약 주요사항 미준수 과태료 대상). 공고를 먼저 수정하세요.</p>`, actions: [{ label: '닫기' }, { label: '공고 수정', kind: 'btn--primary', onClick: (m) => { m.close(); newJob(j); } }] });
    const applied = new Set(st.applications.filter((a) => a.jobId === j.id).map((a) => a.studentId));
    const cands = st.students.filter((s) => s.dept === j.dept && s.jobStatus === 'preparing' && s.track === 'job').map((s) => ({ s, g: CPX.gap(s, j.role), match: s.job === j.role, applied: applied.has(s.id) })).sort((a, b) => (b.applied - a.applied) || (b.match - a.match) || (b.g.score - a.g.score));
    const left = j.headcount - st.placements.filter((p) => p.jobId === j.id).length;
    modal({ title: `학생 배정 — ${j.company} ${j.role} (남은 자리 ${left})`, size: 'lg', body: `
      <p class="t-body">학생이 직접 지원한 순 → 희망 직무 일치 → 「${j.role}」 준비도 순으로 추천합니다(현장실습 참여는 학생 스스로 결정). <b>정보 제공 동의</b>가 없는 학생은 기업에 프로필을 보여줄 수 없어 잠겨 있습니다(교육기본법 §23의3) — 동의서를 먼저 보내세요.</p>
      <div class="table-wrap table-wrap--h"><table class="table table--compact"><thead><tr><th></th><th>학생</th><th>희망 직무</th><th class="num">이 직무 준비도</th><th>필수 충족</th><th>기업 열람 프로필</th><th>보호자 연락처</th></tr></thead><tbody>${cands.map((c, i) => `<tr class="${c.s.infoConsent ? '' : 'row--locked'}"><td><input type="checkbox" class="cand" value="${c.s.id}" ${!c.s.infoConsent ? 'disabled' : i < left && (c.applied || c.match) ? 'checked' : ''} aria-label="${c.s.name} 선택"></td><td>${esc(c.s.name)} <span class="muted t-small">3-${c.s.cls}</span>${c.applied ? badge('지원함', 'ok') : ''}</td><td>${c.match ? `<b>${esc(c.s.job)}</b>` : `<span class="muted">${esc(c.s.job)}</span>`}</td><td class="num"><b>${c.g.score}</b></td><td>${c.g.must.ok}/${c.g.must.total}</td><td>${c.s.infoConsent ? `<span class="t-small">${CP.fmt.nameMask(c.s.name)} · 자격 ${c.s.certs.filter((x) => x.status === 'verified').length} · 포트폴리오 ${c.s.portfolio.filter((p) => p.ver > 0).length ? '최신본' : '없음'}</span>` : `<button class="btn btn--text btn--sm" data-consent="${c.s.id}">🔒 동의 없음 — 동의서 보내기</button>`}</td><td class="t-small">${c.s.guardian.phone ? '등록' : '<span class="t-danger">없음</span>'}</td></tr>`).join('')}</tbody></table></div>`,
      actions: [{ label: '취소' }, { label: '선택 학생 배정 (문서 체인 생성)', kind: 'btn--primary', onClick: (m) => { const picked = $$('.cand:checked', m.el).map((c) => c.value); if (!picked.length) return toast('학생을 선택하세요', 'warn'); if (picked.length > left) return toast(`남은 자리는 ${left}명입니다`, 'warn'); picked.forEach((sid) => { const s = CP.student(sid); s.jobStatus = 'placed'; st.placements.push({ id: `p${Date.now().toString(36)}${sid.slice(-2)}`, studentId: sid, jobId: j.id, assignedAt: CP.iso(CP.TODAY), docs: { guardian: { status: 'none' }, student: { status: 'none' }, agreement: { status: 'none' }, principal: { status: 'none', internal: true } }, version: 1, history: [], hifive: false, token: `t${sid.slice(1)}${j.id.slice(1)}${Math.floor(100 + Math.random() * 899)}`, visits: [] }); }); CP.save(); CP.audit('현장실습 배정', `${j.company} · ${picked.length}명`); m.close(); toast(`${picked.length}명 배정 — 4단 문서 체인이 생성되었습니다. 전자동의에서 보호자 동의서부터 발송하세요`, 'ok', 4500); render(); } }] });
    content.addEventListener('click', onConsent, { once: true });
    function onConsent(e) { const b = e.target.closest('[data-consent]'); if (!b) return; const s = CP.student(b.dataset.consent); s.infoConsent = true; CP.save(); CP.audit('정보 제공 동의서 발송(데모 즉시 동의 처리)', s.name); toast(`${s.name} 학생·보호자에게 정보 제공 동의서를 보냈습니다 (데모: 즉시 동의 처리)`, 'ok'); }
  }

  /* 공고 등록·수정 — 표준협약서 항목 1:1, 입력 즉시 검증 */
  function newJob(j, example) {
    if (!role.can.assign) return ADMIN.deny(role, '공고 등록');
    const v = j || (example ? { company: '예시전자(주)', dept: 'ee', industry: '제조업(전기·전자)', role: '전자 생산·품질', wageHour: 4800, hoursPerDay: 7.5, hoursPerWeek: 37, extension: false, breakMin: 30, payDay: 25, start: CP.iso(CP.addDays(CP.TODAY, 14)), weeks: 14, headcount: 3, mentors: 1, approval: 'none', hazard: false, insurance: true, safetyEdu: true, region: '경기 안산시', contact: '박과장', ceo: '예시대표 대표' } : { company: '', dept: fDept || 'sw', industry: '정보통신업', role: '', wageHour: 5500, hoursPerDay: 7, hoursPerWeek: 35, extension: false, breakMin: 30, payDay: 25, start: CP.iso(CP.addDays(CP.TODAY, 21)), weeks: 8, headcount: 2, mentors: 2, approval: 'participating', hazard: false, insurance: true, safetyEdu: true, region: '서울 마포구', contact: '', ceo: '' });
    const m = modal({ title: j ? '공고 수정' : example ? '예시 공고 — 기준을 넘는 항목이 어떻게 잡히는지' : '기업 공고 등록 (표준협약서 항목)', size: 'lg', body: `
      <form class="form-grid" id="jf">
        <label class="field"><span class="field__label">기업명</span><input class="input" name="company" value="${esc(v.company)}" required placeholder="예: 한결소프트"></label>
        <label class="field"><span class="field__label">대표자</span><input class="input" name="ceo" value="${esc(v.ceo)}" placeholder="협약서 서명자"></label>
        <label class="field"><span class="field__label">업종</span><input class="input" name="industry" value="${esc(v.industry)}"></label>
        <label class="field"><span class="field__label">기업 승인 상태</span><select class="select" name="approval"><option value="leading" ${v.approval === 'leading' ? 'selected' : ''}>선도기업(교육청 승인)</option><option value="participating" ${v.approval === 'participating' ? 'selected' : ''}>참여기업(학교 위원회 승인)</option><option value="none" ${v.approval === 'none' ? 'selected' : ''}>미승인(실사·심의 전)</option></select></label>
        <label class="field"><span class="field__label">학과</span><select class="select" name="dept">${CP.DEPARTMENTS.map((d) => `<option value="${d.id}" ${v.dept === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select></label>
        <label class="field"><span class="field__label">실습 직무</span><input class="input" name="role" list="roles" value="${esc(v.role)}" required><datalist id="roles">${Object.keys(st.specs).map((r) => `<option>${r}</option>`).join('')}</datalist></label>
        <label class="field"><span class="field__label">현장실습 수당 (시간당)</span><input class="input" name="wageHour" type="number" step="100" value="${v.wageHour}"><span class="field__help" id="hWage"></span></label>
        <label class="field"><span class="field__label">수당 지급일 (매월)</span><input class="input" name="payDay" type="number" min="1" max="31" value="${v.payDay}"></label>
        <label class="field"><span class="field__label">1일 실습시간</span><input class="input" name="hoursPerDay" type="number" step="0.5" min="1" max="10" value="${v.hoursPerDay}"><span class="field__help" id="hDay"></span></label>
        <label class="field"><span class="field__label">주 실습시간</span><input class="input" name="hoursPerWeek" type="number" min="5" max="50" value="${v.hoursPerWeek}"><span class="field__help" id="hWeek"></span></label>
        <label class="field"><span class="field__label">휴게 (분)</span><input class="input" name="breakMin" type="number" step="10" value="${v.breakMin}"><span class="field__help">4시간 이상 30분 · 8시간 60분</span></label>
        <label class="field"><span class="field__label">시작일</span><input class="input" name="start" type="date" value="${v.start}"></label>
        <label class="field"><span class="field__label">기간(주)</span><input class="input" name="weeks" type="number" min="1" max="24" value="${v.weeks}"><span class="field__help" id="hDays"></span></label>
        <label class="field"><span class="field__label">모집 인원</span><input class="input" name="headcount" type="number" min="1" max="10" value="${v.headcount}"></label>
        <label class="field"><span class="field__label">기업현장교사 수</span><input class="input" name="mentors" type="number" min="1" max="10" value="${v.mentors}"><span class="field__help" id="hMentor"></span></label>
        <label class="field"><span class="field__label">소재지</span><input class="input" name="region" value="${esc(v.region)}"></label>
        <label class="field"><span class="field__label">현장 담당</span><input class="input" name="contact" value="${esc(v.contact)}" placeholder="○○○ 과장"></label>
        <label class="check"><input type="checkbox" name="extension" ${v.extension ? 'checked' : ''}><span>연장 실습(1일 1시간·주 5시간) — 학생 <b>서면 동의</b> 필요</span></label>
        <label class="check"><input type="checkbox" name="insurance" ${v.insurance ? 'checked' : ''}><span>산재보험 가입 확인</span></label>
        <label class="check"><input type="checkbox" name="safetyEdu" ${v.safetyEdu ? 'checked' : ''}><span>사전 안전교육·입문교육(30%·의무 12h) 계획</span></label>
        <label class="check"><input type="checkbox" name="hazard" ${v.hazard ? 'checked' : ''}><span>유해·위험 업종(운전·운송·건설·기계·화학 등) 해당</span></label>
      </form>
      <div id="live" class="mt-s"></div>
      <p class="t-small muted">기준: ${CP.RULES.minWageHourNote}. 기준을 넘으면 저장은 되지만 <b>배정이 잠깁니다.</b></p>`,
      actions: [{ label: '취소' }, { label: j ? '저장' : '등록', kind: 'btn--primary', onClick: (mm) => { const fd = new FormData($('#jf', mm.el)); const o = Object.fromEntries(fd.entries()); if (!o.company || !o.role) return toast('기업명과 직무는 필수입니다', 'warn'); const weeks = Number(o.weeks); const obj = { ...(j || { id: `j${Date.now().toString(36)}`, status: 'open', createdAt: CP.iso(CP.TODAY) }), company: o.company, ceo: o.ceo || '대표 미입력', industry: o.industry, approval: o.approval, dept: o.dept, role: o.role, wageHour: Number(o.wageHour), payDay: Number(o.payDay), hoursPerDay: Number(o.hoursPerDay), hoursPerWeek: Number(o.hoursPerWeek), breakMin: Number(o.breakMin), start: o.start, end: CP.iso(CP.addDays(new Date(o.start), weeks * 7)), weeks, days: weeks * 5, headcount: Number(o.headcount), mentors: Number(o.mentors), region: o.region, contact: o.contact || '담당 미정', extension: fd.has('extension'), insurance: fd.has('insurance'), safetyEdu: fd.has('safetyEdu'), hazard: fd.has('hazard') }; if (j) Object.assign(j, obj); else st.jobs.unshift(obj); CP.save(); CP.audit(j ? '공고 수정' : '공고 등록', obj.company); mm.close(); const bl = CPX.jobIssues(obj).filter((x) => x.level === 'block'); toast(bl.length ? `저장됨 — 기준 초과 ${bl.length}건이 있어 배정이 잠깁니다` : '저장됨 — 배정할 수 있습니다', bl.length ? 'warn' : 'ok', 4200); render(); } }] });
    const f = $('#jf', m.el);
    const live = () => { const fd = new FormData(f); const o = Object.fromEntries(fd.entries()); const tmp = { ...o, wageHour: Number(o.wageHour), hoursPerDay: Number(o.hoursPerDay), hoursPerWeek: Number(o.hoursPerWeek), breakMin: Number(o.breakMin), headcount: Number(o.headcount), mentors: Number(o.mentors), days: Number(o.weeks) * 5, extension: fd.has('extension'), insurance: fd.has('insurance'), hazard: fd.has('hazard') }; const iss = CPX.jobIssues(tmp); $('#live', m.el).innerHTML = iss.length ? `<div class="notice notice--${iss.some((x) => x.level === 'block') ? 'danger' : 'warn'} t-small"><ul>${iss.map((x) => `<li>${x.level === 'block' ? '⛔ 배정 잠김' : '⚠ 확인'} — ${esc(x.text)}</li>`).join('')}</ul></div>` : '<p class="notice notice--ok t-small">모든 운영 기준 충족 — 배정 가능</p>'; $('#hWage', m.el).innerHTML = tmp.wageHour < R.minWageHour2025 ? `<span class="t-danger">2025 최저 ${CP.fmt.won(R.minWageHour2025)} 미만</span>` : tmp.wageHour < R.minWageHour2026 ? `<span class="t-warn">2026 추정 ${CP.fmt.won(R.minWageHour2026)} 미만</span>` : `월 약 ${CP.fmt.won(tmp.wageHour * tmp.hoursPerDay * 21)}`; $('#hDay', m.el).innerHTML = tmp.hoursPerDay > 7 ? `<span class="t-danger">기준 7시간 초과${tmp.extension ? ' (연장 동의 시 8시간까지)' : ''}</span>` : '기준 이내'; $('#hWeek', m.el).innerHTML = tmp.hoursPerWeek > 35 ? `<span class="t-danger">기준 35시간 초과</span>` : '기준 이내'; $('#hDays', m.el).innerHTML = tmp.days > 60 ? `<span class="t-danger">실습일 ${tmp.days}일 — 60일 초과</span>` : `실습일 ${tmp.days}일`; $('#hMentor', m.el).innerHTML = tmp.headcount > tmp.mentors ? `<span class="t-warn">1:1 배치 원칙 초과</span>` : '1:1 충족'; };
    f.addEventListener('input', live); f.addEventListener('change', live); live();
  }
  UI.reveal();
})();
