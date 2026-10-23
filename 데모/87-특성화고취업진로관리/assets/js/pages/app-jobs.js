/* 실습 공고 — 우리 과 공고 열람 · 조건 요약(시간·수당·보험) · 지원(→ 교사 콘솔 매칭 보드 반영) · 내 지원 상태 */
(function () {
  'use strict';
  const { $, $$, esc, toast, modal, badge } = UI;
  const { root, s } = APP.mount({ title: '실습 공고' });
  const st = CP.load();
  st.applications = st.applications || [];
  let tab = 'mine';
  function render() {
    const mine = st.jobs.filter((j) => j.dept === s.dept), all = st.jobs;
    const list = (tab === 'mine' ? mine : all).filter((j) => j.status !== 'closed' && j.approval !== 'none').sort((a, b) => (b.role === s.job) - (a.role === s.job) || a.start.localeCompare(b.start));
    const myApps = st.applications.filter((a) => a.studentId === s.id);
    const pl = CP.placementOf(s.id);
    root.innerHTML = `
      <div class="segtabs" role="tablist"><button role="tab" aria-selected="${tab === 'mine'}" data-tab="mine">우리 과 <b>${mine.filter((j) => j.status !== 'closed' && j.approval !== 'none').length}</b></button><button role="tab" aria-selected="${tab === 'all'}" data-tab="all">전체 <b>${all.filter((j) => j.status !== 'closed' && j.approval !== 'none').length}</b></button></div>
      ${pl ? `<p class="notice notice--info t-small">이미 <b>${esc(CP.job(pl.jobId).company)}</b>에 배정되어 있어요. 다른 공고는 열람만 가능해요.</p>` : myApps.length ? `<p class="notice notice--ok t-small">지원한 공고 ${myApps.length}건 — 선생님이 배정하면 알림이 와요.</p>` : ''}
      <ul class="jlist">${list.map((j, i) => { const taken = st.placements.filter((p) => p.jobId === j.id).length; const left = j.headcount - taken; const applied = myApps.some((a) => a.jobId === j.id); const ok = !CPX.jobIssues(j).some((x) => x.level === 'block'); return `<li class="jcard" id="${j.id}" style="--i:${i}" data-reveal>
        <div class="jcard__top"><p class="jcard__co">${esc(j.company)} ${j.leading ? badge('선도기업', 'info') : ''}${j.role === s.job ? badge('내 희망 직무', 'ok') : ''}</p><span class="t-small muted">${esc(j.region)}</span></div>
        <p class="jcard__role">${esc(j.role)} <span class="muted t-small">· ${esc(CP.dept(j.dept).short)}</span></p>
        <dl class="jcard__meta"><div><dt>기간</dt><dd>${CP.fmt.date(j.start)}부터 ${j.weeks}주</dd></div><div><dt>시간</dt><dd>1일 ${j.hoursPerDay}h · 주 ${j.hoursPerWeek}h</dd></div><div><dt>수당</dt><dd>${CP.fmt.won(j.wageHour)}/시간</dd></div><div><dt>모집</dt><dd>${left > 0 ? `${left}자리 남음` : '마감'}</dd></div></dl>
        <div class="jcard__flags">${ok ? badge('시간·보험 기준 충족', 'ok') : badge('기준 확인 중 — 학교 검토', 'warn')}${j.status === 'ongoing' ? badge('진행 중', 'neutral') : ''}</div>
        <div class="jcard__act">${j.status === 'open' && left > 0 && !pl ? (applied ? `<button class="btn btn--ghost btn--block" data-cancel="${j.id}">지원 취소</button>` : `<button class="btn btn--primary btn--block" data-apply="${j.id}" ${ok ? '' : 'disabled'}>${ok ? '지원하기' : '학교 검토 후 지원 가능'}</button>`) : `<button class="btn btn--ghost btn--block" data-detail="${j.id}">자세히</button>`}</div></li>`; }).join('') || '<li class="empty">열린 공고가 없어요</li>'}</ul>`;
    UI.reveal(root);
    if (location.hash) { const el = $(location.hash); if (el) { el.classList.add('is-focus'); el.scrollIntoView({ block: 'center' }); } }
  }
  render();
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[role=tab]'); if (t) { tab = t.dataset.tab; return render(); }
    const a = e.target.closest('[data-apply]'); if (a) return apply(CP.job(a.dataset.apply));
    const c = e.target.closest('[data-cancel]'); if (c) { st.applications = st.applications.filter((x) => !(x.studentId === s.id && x.jobId === c.dataset.cancel)); CP.save(); toast('지원을 취소했어요', 'info'); return render(); }
    const d = e.target.closest('[data-detail]'); if (d) return detail(CP.job(d.dataset.detail));
  });
  function apply(j) { const g = CPX.gap(s, j.role); modal({ title: `${j.company} 지원`, size: 'sm', body: `<p class="t-body">지원하면 취업지원부 선생님 화면의 추천 목록에 올라가고, 선생님이 배정하면 동의서 링크가 나와 보호자에게 가요.</p><dl class="kv"><div><dt>이 직무 준비도</dt><dd><b>${g.score}</b> / 100 (필수 ${g.must.ok}/${g.must.total})</dd></div><div><dt>실습 조건</dt><dd>1일 ${j.hoursPerDay}시간 · 주 ${j.hoursPerWeek}시간 · ${CP.fmt.won(j.wageHour)}/시간 · ${j.insurance ? '산재보험 가입' : '보험 미확인'}</dd></div></dl><label class="check"><input type="checkbox" id="ck" checked><span>보호자와 실습 참여를 상의했어요 (참여는 내가 결정해요)</span></label><label class="check"><input type="checkbox" id="ic" ${s.infoConsent ? 'checked' : ''}><span>기업이 내 프로필(자격증·포트폴리오, 이름은 가림)을 볼 수 있게 제공하는 데 동의해요 — 보호자 동의도 필요</span></label>`, actions: [{ label: '취소' }, { label: '지원', kind: 'btn--primary', onClick: (m) => { if (!$('#ck', m.el).checked) return toast('보호자와 먼저 상의해 주세요', 'warn'); if ($('#ic', m.el).checked) s.infoConsent = true; st.applications.push({ studentId: s.id, jobId: j.id, at: CP.iso(CP.TODAY) }); CP.save(); CP.audit('학생 실습 지원', `${s.name} → ${j.company}`); m.close(); toast('지원 완료 — 선생님이 확인하면 알림이 와요', 'ok'); render(); } }] }); }
  function detail(j) { modal({ title: `${j.company} · ${j.role}`, size: 'sm', body: `<dl class="kv"><div><dt>업종</dt><dd>${esc(j.industry)}</dd></div><div><dt>지역</dt><dd>${esc(j.region)}</dd></div><div><dt>기간</dt><dd>${CP.fmt.date(j.start)} ~ ${CP.fmt.date(j.end)}</dd></div><div><dt>시간</dt><dd>1일 ${j.hoursPerDay}시간 · 주 ${j.hoursPerWeek}시간 (야간·휴일 없음)</dd></div><div><dt>수당</dt><dd>${CP.fmt.won(j.wageHour)}/시간 (월 약 ${CP.fmt.won(CPX.monthlyAllowance(j))})</dd></div><div><dt>안전</dt><dd>${j.insurance ? '산재보험 가입' : '미확인'} · 사전 안전교육 · 주 1회 학교 점검</dd></div></dl>`, actions: [{ label: '닫기' }] }); }
})();
