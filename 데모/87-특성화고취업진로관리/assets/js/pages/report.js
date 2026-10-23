/* 2-4 진로 가이드 리포트 — 인쇄용(A4) · 권장 스펙 vs 보유 갭 · 보완 가이드 · 상담 요약 · 메모 · PDF 저장(print) */
(function () {
  'use strict';
  const role = UI.requireRole(); if (!role) return;
  const { $, $$, esc, toast, badge } = UI;
  const id = new URLSearchParams(location.search).get('id');
  const scoped0 = CP.scopedStudents(role); const s = CP.student(id) || scoped0.find((x) => x.certs.filter((c) => c.status === 'verified').length >= 2) || scoped0[0];
  const content = ADMIN.mountShell(role, { title: `진로 가이드 리포트 · ${s.name}`, actions: `<a class="btn btn--ghost btn--sm" href="student.html?id=${s.id}">← 학생 상세</a><button class="btn btn--ghost btn--sm" id="other">다른 직무로 비교</button><button class="btn btn--primary btn--sm" id="print">인쇄 · PDF 저장</button>` });
  if (!CP.scopedStudents(role).some((x) => x.id === s.id)) { content.innerHTML = '<div class="panel"><p class="empty">담임 권한으로는 다른 학급 학생의 리포트를 열 수 없습니다.</p></div>'; return; }
  let jobName = s.job;
  function render() {
    const g = CPX.gap(s, jobName), guide = CPX.guide(g); const pl = CP.placementOf(s.id); const j = pl ? CP.job(pl.jobId) : null;
    const verified = s.certs.filter((c) => c.status === 'verified');
    content.innerHTML = `
      <div class="a4-wrap"><article class="a4" id="a4">
        <header class="a4__head"><div><p class="a4__eyebrow">한빛직업고등학교 취업지원부 · 진로 가이드 리포트</p><h2 class="a4__title">${esc(s.name)} <small>${esc(CP.dept(s.dept).name)} 3학년 ${s.cls}반 · 학번 ${s.sid}</small></h2></div><div class="a4__meta"><span>작성일 ${CP.fmt.date(CP.iso(CP.TODAY))}</span><span>작성 ${esc(role.person)}</span></div></header>
        <section class="a4__sec a4__sec--grid">
          <div><h3>희망 직무 · 진로 목표</h3><p class="a4__big">${esc(jobName)}${jobName !== s.job ? ` <small class="muted">(비교용 · 등록 희망 직무는 ${esc(s.job)})</small>` : ''}</p><p>${esc(s.goal)}</p></div>
          <div class="a4__score"><b>${g.score}</b><span>진로 준비도 / 100</span><small>필수 ${g.must.ok}/${g.must.total} · 권장 ${g.all.ok - g.must.ok}/${g.all.total - g.must.total}</small></div>
        </section>
        <section class="a4__sec"><h3>권장 스펙 대조 — 「${esc(jobName)}」</h3>
          <table class="a4__table"><thead><tr><th>구분</th><th>권장 항목</th><th>필수</th><th>보유 현황</th><th>판정</th></tr></thead><tbody>${g.items.map((it) => `<tr class="a4__row--${it.state}"><td>${{ cert: '자격증', lang: '어학', exp: '경험', edu: '교육' }[it.kind]}</td><td>${esc(it.name)}</td><td>${it.must ? '●' : '○'}</td><td>${it.evidence ? esc(it.evidence.name || `${it.evidence.test} ${it.evidence.score}` || it.evidence.file) + (it.evidence.date ? ` (${CP.fmt.date(it.evidence.date)})` : '') : '—'}</td><td><b>${{ ok: '충족', pending: '확인 대기', missing: '미취득' }[it.state]}</b></td></tr>`).join('')}</tbody></table></section>
        <section class="a4__sec a4__sec--grid">
          <div><h3>보완 가이드</h3>${guide.length ? `<ol class="a4__list">${guide.map((x) => `<li><b>${x.kind}</b> ${esc(x.text)}</li>`).join('')}</ol>` : '<p>권장 스펙을 모두 충족했습니다. 심화 자격·프로젝트로 차별화를 권합니다.</p>'}</div>
          <div><h3>보유 이력 요약</h3><ul class="a4__list"><li>확인된 자격증 ${verified.length}개${verified.length ? ` — ${verified.map((c) => esc(c.name)).join(', ')}` : ''}</li><li>어학 ${s.langs.length ? s.langs.map((l) => `${l.test} ${l.score}`).join(', ') : '없음'}</li><li>수상 ${s.awards.length ? s.awards.map((a) => esc(a.name)).join(', ') : '없음'}</li><li>포트폴리오 ${s.portfolio.filter((p) => p.ver > 0).length ? `v${Math.max(...s.portfolio.filter((p) => p.ver > 0).map((p) => p.ver))} (최근 ${CP.fmt.date(s.portfolio.filter((p) => p.ver > 0).slice(-1)[0].date)})` : '없음'}</li><li>현장실습 ${j ? `${esc(j.company)} ${esc(j.role)} (${CP.fmt.date(j.start)}~)` : '미배정'} · 취업 ${{ preparing: '준비 중', placed: '실습 배정', hired: '확정' }[s.jobStatus]}</li></ul></div>
        </section>
        <section class="a4__sec"><h3>상담 기록</h3>${s.memos.length ? `<ul class="a4__list">${s.memos.slice(0, 4).map((m) => `<li><span class="muted">${CP.fmt.date(m.date)} ${esc(m.by)}</span> ${esc(m.text)}</li>`).join('')}</ul>` : '<p class="muted">기록 없음</p>'}
          <div class="a4__memo"><label>이번 상담 메모 (저장하면 학생 상세에도 남습니다)</label><textarea id="memo" rows="3" placeholder="예: 11월 정보처리기능사 실기 응시 약속 · 포트폴리오 v3는 캡스톤 결과물 포함"></textarea><button class="btn btn--primary btn--sm no-print" id="saveMemo">메모 저장</button></div></section>
        <footer class="a4__foot"><span>본 리포트의 권장 스펙은 교내 기준이며 채용 요건을 보장하지 않습니다. 학생·보호자 상담용 · 외부 제공 금지</span><span>CAREERPASS 데모 · 가상 데이터</span></footer>
      </article></div>`;
  }
  render();
  content.addEventListener('click', (e) => {
    if (e.target.id === 'saveMemo') { const t = $('#memo').value.trim(); if (!t) return toast('메모를 입력하세요', 'warn'); s.memos.unshift({ date: CP.iso(CP.TODAY), by: role.name, text: t }); CP.save(); CP.audit('리포트 상담 메모', s.name); toast('저장했습니다', 'ok'); render(); }
  });
  $('#print').addEventListener('click', () => { CP.audit('진로 리포트 인쇄/PDF', s.name); window.print(); });
  $('#other').addEventListener('click', () => { UI.modal({ title: '다른 직무 기준으로 비교', size: 'sm', body: `<label class="field"><span class="field__label">비교할 직무</span><select class="select" id="cmp">${Object.keys(CP.load().specs).map((j) => `<option ${j === jobName ? 'selected' : ''}>${j}</option>`).join('')}</select></label><p class="t-small muted">학생이 진로를 바꾸려 할 때 "지금 가진 것으로 어디까지 되는지"를 바로 보여 줍니다. 등록 희망 직무는 바뀌지 않습니다.</p>`, actions: [{ label: '취소' }, { label: '비교', kind: 'btn--primary', onClick: (m) => { jobName = $('#cmp', m.el).value; m.close(); render(); toast(`「${jobName}」 기준으로 다시 계산했습니다`, 'ok'); } }] }); });
})();
