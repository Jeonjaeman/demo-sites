/* 학생 홈 — 내 진로 목표 · 준비도 링 · 해야 할 일(증빙 보완·동의서·공고) · 새 실습 공고 */
(function () {
  'use strict';
  const { $, $$, esc, toast, badge } = UI;
  const { root, s } = APP.mount({ title: '홈' });
  const st = CP.load();
  const g = CPX.gap(s); const pl = CP.placementOf(s.id); const j = pl ? CP.job(pl.jobId) : null;
  const todos = [];
  const rejected = s.certs.filter((c) => c.status === 'rejected'); if (rejected.length) todos.push({ tone: 'danger', text: `반려된 증빙 ${rejected.length}건 다시 올리기 — ${esc(rejected[0].name)}`, href: 'me.html#certs' });
  if (pl && CPX.nextStep(pl) === 'student' && pl.docs.student.status !== 'none') todos.push({ tone: 'warn', text: `현장실습 학생 동의서 서명하기 (${esc(j.company)})`, href: `../sign.html?t=${pl.token}&who=student` });
  if (pl && CPX.nextStep(pl) === 'guardian') todos.push({ tone: 'info', text: `보호자(${esc(s.guardian.name)}) 동의서가 먼저예요 — 부모님께 알림톡 확인 부탁드리기`, href: 'inbox.html' });
  if (pl && s.jobStatus === 'hired' && pl.employment && CPX.effStatus(pl.employment.student) !== 'signed' && pl.employment.student.status !== 'none') todos.push({ tone: 'warn', text: `취업(전환) 동의서 서명하기 (${esc(j.company)})`, href: `../sign.html?t=${pl.token}&who=empStudent` });
  const missingMust = g.items.filter((i) => i.must && i.state === 'missing'); if (missingMust.length) todos.push({ tone: 'info', text: `필수 스펙 미취득 ${missingMust.length}개 — ${esc(missingMust[0].name)}${missingMust.length > 1 ? ' 외' : ''}`, href: 'path.html' });
  const openJobs = st.jobs.filter((x) => x.dept === s.dept && x.status === 'open' && x.approval !== 'none' && st.placements.filter((p) => p.jobId === x.id).length < x.headcount);
  if (s.jobStatus === 'preparing' && openJobs.length) todos.push({ tone: 'info', text: `지원할 수 있는 실습 공고 ${openJobs.length}건`, href: 'jobs.html' });
  const greeting = (() => { const h = new Date().getHours(); return h < 11 ? '좋은 아침이에요' : h < 17 ? '오늘도 한 걸음' : '오늘 하루 수고했어요'; })();

  root.innerHTML = `
    <section class="hero-card" data-reveal>
      <p class="hero-card__hi">${greeting}, ${esc(s.name)}님</p>
      <div class="hero-card__row">
        <div class="ring-wrap"><canvas id="ring" width="112" height="112" aria-hidden="true"></canvas><div class="ring-num"><b id="score">0</b><span>준비도</span></div></div>
        <div class="hero-card__txt"><p class="t-eyebrow">희망 직무</p><h2>${esc(s.job)}</h2><p class="t-small">필수 ${g.must.ok}/${g.must.total} · 권장 ${g.all.ok - g.must.ok}/${g.all.total - g.must.total} 충족</p><a class="btn btn--soft btn--sm" href="path.html">무엇이 부족한지 보기</a></div>
      </div>
    </section>

    <section class="sec" data-reveal>
      <h2 class="sec__title">해야 할 일 <b>${todos.length}</b></h2>
      ${todos.length ? `<ul class="todo">${todos.map((t, i) => `<li class="todo__item todo__item--${t.tone}" style="--i:${i}"><a href="${t.href}"><span>${t.text}</span><span class="todo__go">→</span></a></li>`).join('')}</ul>` : '<p class="empty">지금 할 일이 없어요. 포트폴리오를 한 번 더 다듬어 볼까요?</p>'}
    </section>

    ${pl ? `<section class="sec" data-reveal><h2 class="sec__title">내 현장실습</h2><article class="jcard jcard--mine"><p class="jcard__co">${esc(j.company)} ${j.leading ? badge('선도기업', 'info') : ''}</p><p class="jcard__role">${esc(j.role)}</p><dl class="jcard__meta"><div><dt>기간</dt><dd>${CP.fmt.date(j.start)} ~ ${CP.fmt.date(j.end)}</dd></div><div><dt>시간</dt><dd>1일 ${j.hoursPerDay}h · 주 ${j.hoursPerWeek}h</dd></div><div><dt>수당</dt><dd>${CP.fmt.won(j.wageHour)}/시간</dd></div></dl><div class="jcard__docs">${CP.DOC_CHAIN.map((k) => `<span>${CPX.DOC_SHORT[k]} ${badge(CPX.STATUS_LABEL[CPX.effStatus(pl.docs[k])], UI.DOC_KIND[CPX.effStatus(pl.docs[k])])}</span>`).join('')}</div><div class="jcard__links"><a class="btn btn--ghost btn--sm" href="https://www.hifive.go.kr/" target="_blank" rel="noopener">실습일지 쓰기 (HIFIVE)</a><a class="btn btn--ghost btn--sm" href="https://www.hifive.go.kr/" target="_blank" rel="noopener">부당 대우 상담 (HIFIVE)</a></div><p class="t-small muted">실습일지·권익침해 상담은 교육부 공식 시스템 HIFIVE에서 해요(학교·교육청·노무사가 함께 봐요). 위험하거나 협약과 다른 일을 시키면 <a class="plink" href="tel:021234567">학교(02-123-4567)</a>로 바로 연락하세요. 중단해도 불이익이 없어요.</p></article></section>` : ''}

    <section class="sec" data-reveal>
      <div class="sec__head"><h2 class="sec__title">새 실습 공고</h2><a class="plink t-small" href="jobs.html">전체 보기</a></div>
      ${openJobs.length ? `<div class="hscroll">${openJobs.slice(0, 5).map((x, i) => `<a class="jmini" href="jobs.html#${x.id}" style="--i:${i}" data-reveal><span class="jmini__co">${esc(x.company)}</span><span class="jmini__role">${esc(x.role)}</span><span class="jmini__meta">${x.weeks}주 · ${CP.fmt.won(x.wageHour)}/h${x.role === s.job ? ' · <b>희망 직무</b>' : ''}</span></a>`).join('')}</div>` : '<p class="empty">우리 과에 열린 공고가 아직 없어요.</p>'}
    </section>

    <section class="sec sec--tip" data-reveal>
      <h2 class="sec__title">최근 활동</h2>
      <ul class="acts">${[...s.certs.map((c) => ({ d: c.date, t: `자격증 「${c.name}」 ${{ verified: '교사 확인 완료', pending: '확인 대기', rejected: '반려' }[c.status]}` })), ...s.portfolio.filter((p) => p.ver > 0).map((p) => ({ d: p.date, t: `포트폴리오 v${p.ver} 올림` })), ...s.memos.map((m) => ({ d: m.date, t: `${m.by} 상담` }))].sort((a, b) => b.d.localeCompare(a.d)).slice(0, 4).map((a) => `<li><span>${CP.fmt.date(a.d)}</span>${esc(a.t)}</li>`).join('') || '<li class="muted">아직 활동이 없어요</li>'}</ul>
    </section>`;
  UI.countUp($('#score'), g.score);
  const css = getComputedStyle(document.documentElement);
  UI.donut($('#ring'), [{ value: g.score, color: css.getPropertyValue('--accent').trim() }, { value: 100 - g.score, color: 'transparent' }], { thick: 9 });
  UI.reveal();
})();
