/* 2-1 통합 대시보드 — 주의 우선 인사 · KPI 4(취업률 분모 토글 F9) · 학과별 비교 차트 · 오늘 할 일 · 배정 학생 4단 체인 상태 실시간 필터 · 미완료 독려 알림톡 즉시 발송 */
(function () {
  'use strict';
  const role = UI.requireRole(); if (!role) return;
  const { $, $$, esc, toast, modal, badge } = UI;
  const content = ADMIN.mountShell(role, { actions: `<a class="btn btn--ghost btn--sm" href="stats.html">통계·보고 →</a>` });
  const st = CP.load();
  let denom = 'moe';
  const ids = new Set(CP.scopedStudents(role).map((s) => s.id));
  const pls = st.placements.filter((p) => ids.has(p.studentId));
  const todayTxt = CP.fmt.date(CP.iso(CP.TODAY));
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(), okc = getComputedStyle(document.documentElement).getPropertyValue('--ok').trim();

  // 오늘 할 일(실제 계산)
  const declined = pls.filter((p) => CPX.placementState(p) === 'declined');
  const expired = pls.filter((p) => CPX.placementState(p) === 'expired');
  const unsent = pls.filter((p) => CPX.placementState(p) === 'unsent');
  const seal = pls.filter((p) => CPX.nextStep(p) === 'principal' && CPX.placementState(p) !== 'complete');
  const soon = st.jobs.filter((j) => j.status === 'open' && (new Date(j.start) - CP.TODAY) / 86400000 <= 10 && pls.some((p) => p.jobId === j.id && CPX.placementState(p) !== 'complete'));
  const proofPending = CP.scopedStudents(role).filter((s) => [...s.certs, ...s.langs, ...s.awards].some((x) => x.status === 'pending'));
  const legalCheck = pls.filter((p) => p.docs.guardian.legalGuardian === false);
  const noVisit = pls.filter((p) => CP.job(p.jobId).status === 'ongoing' && !st.visits.some((v) => v.placementId === p.id && (CP.TODAY - new Date(v.date)) / 86400000 <= 30));
  const fails = st.messages.filter((m) => m.result === 'sms-fallback' && (!m.studentId || ids.has(m.studentId))).length;
  const noHifive = pls.filter((p) => CPX.placementState(p) === 'complete' && !p.hifive);
  const todo = [
    declined.length && { tone: 'danger', text: `동의 거부 <b>${declined.length}건</b> — 보호자 연락 후 재발송`, href: 'consents.html?f=declined' },
    expired.length && { tone: 'danger', text: `72시간 지난 링크 <b>${expired.length}건</b> — 새 링크 발송`, href: 'consents.html?f=expired' },
    soon.length && { tone: 'warn', text: `실습 시작 10일 이내인데 체결 미완료 기업 <b>${soon.length}곳</b>`, href: 'consents.html?f=progress' },
    seal.length && { tone: 'warn', text: `학교장 날인 대기 <b>${seal.length}건</b>`, href: 'consents.html?f=seal' },
    unsent.length && { tone: 'warn', text: `배정됐는데 보호자 동의서 미발송 <b>${unsent.length}건</b>`, href: 'consents.html?f=unsent' },
    legalCheck.length && { tone: 'warn', text: `법정대리인 확인 필요 <b>${legalCheck.length}건</b> (기타 보호자 서명)`, href: 'consents.html' },
    noVisit.length && { tone: 'info', text: `이번 달 현장 점검 미실시 <b>${noVisit.length}건</b> (월 1회 기준)`, href: 'stats.html' },
    proofPending.length && { tone: 'info', text: `증빙 확인 대기 학생 <b>${proofPending.length}명</b>`, href: 'students.html?f=proof' },
    noHifive.length && { tone: 'info', text: `HIFIVE 미등재 협약 <b>${noHifive.length}건</b>`, href: 'consents.html?f=complete' },
    fails && { tone: 'info', text: `알림톡 실패 → SMS 대체 <b>${fails}건</b> 사유 확인`, href: 'messages.html#history' },
  ].filter(Boolean);
  const urgent = todo.filter((t) => t.tone === 'danger').length;

  content.innerHTML = `
    <section class="greet" data-reveal>
      <h2 class="greet__h">${esc(role.person)}, 오늘 확인할 일 <b>${todo.length}건</b>${urgent ? ` · 긴급 <span class="t-danger">${urgent}건</span>` : ''}</h2>
      <p class="greet__p">${todayTxt} · ${esc(role.scope)}${role.can.viewAll ? '' : ' (담임 권한 — 우리 반만)'}</p>
    </section>
    <section class="kpis" aria-label="핵심 지표" id="kpis"></section>
    <section class="grid-2">
      <article class="panel" data-reveal>
        <header class="panel__head panel__head--wrap"><h2 class="panel__title">학과별 파견·취업 확정 현황</h2><div class="filters"><div class="seg seg--sm" aria-label="취업률 분모"><label><input type="radio" name="denom" value="moe" checked><span>교육부 기준</span></label><label><input type="radio" name="denom" value="all"><span>3학년 전체</span></label></div><span class="legend"><i style="--c:${accent}"></i>파견율 <i style="--c:${okc}"></i>확정률</span></div></header>
        <div class="chart-wrap"><canvas id="deptChart" height="220" role="img" aria-label="학과별 파견율과 취업 확정률 막대 그래프"></canvas></div>
        <div class="table-wrap"><table class="table table--compact" aria-label="학과별 수치"><thead><tr><th>학과</th><th class="num">3학년</th><th class="num" id="thBase">분모</th><th class="num">파견</th><th class="num">파견율</th><th class="num">확정</th><th class="num">확정률</th></tr></thead><tbody id="deptBody"></tbody></table></div>
        <p class="t-small muted mt-s" id="denomNote"></p>
      </article>
      <article class="panel" data-reveal>
        <header class="panel__head"><h2 class="panel__title">오늘 처리할 일</h2></header>
        <ul class="todo" id="todo">${todo.length ? todo.map((t, i) => `<li class="todo__item todo__item--${t.tone}" style="--i:${i}" data-reveal><a href="${t.href}"><span>${t.text}</span><span class="todo__go">→</span></a></li>`).join('') : '<li class="empty">처리할 일이 없습니다</li>'}</ul>
      </article>
    </section>
    <section class="panel" data-reveal>
      <header class="panel__head panel__head--wrap">
        <h2 class="panel__title">현장실습 배정 학생 · 협약·동의 4단 진행</h2>
        <div class="filters" role="group" aria-label="상태 필터">${['all:전체', 'unsent:미발송', 'progress:진행 중', 'expired:만료', 'declined:거부', 'complete:체결 완료'].map((f, i) => { const [v, l] = f.split(':'); return `<button class="chip${i === 0 ? ' is-on' : ''}" data-f="${v}" aria-pressed="${i === 0}">${l} <b data-cnt="${v}"></b></button>`; }).join('')}<label class="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="q" type="search" placeholder="학생·기업 검색" aria-label="학생 또는 기업 검색"></label></div>
      </header>
      <div class="bulk" id="bulk"><span id="bulkTxt" class="t-small"></span><button class="btn btn--primary btn--sm" id="remindAll" ${role.can.send ? '' : 'disabled title="취업지원부·총괄 관리자만 발송할 수 있습니다"'}>미완료 전원 독려 알림톡 발송</button></div>
      <div class="table-wrap"><table class="table" id="plTable"><thead><tr><th>학생</th><th>실습 기업 · 직무</th><th>보호자 동의</th><th>학생 동의</th><th>기업 서명</th><th>학교장 날인</th><th>종합</th><th class="actions">처리</th></tr></thead><tbody id="plBody"></tbody></table></div>
      <p class="empty" id="plEmpty" hidden>조건에 맞는 배정이 없습니다.</p>
    </section>`;

  function renderKpis() {
    const k = CPX.kpis(role, denom);
    $('#kpis').innerHTML = [
      kpi('재학생', k.enrollment, '명', role.can.viewAll ? `1·2학년 ${CP.ENROLLMENT.g1 + CP.ENROLLMENT.g2} · 3학년 ${k.g3}` : '담당 학급 3학년', 0),
      kpi('현장실습 파견율', k.placeRate, '%', `${denom === 'moe' ? `취업 희망 ${k.base}명` : `3학년 ${k.base}명`} 중 ${k.placed}명 배정·파견`, 1, 1),
      kpi('취업 확정률', k.hireRate, '%', `${k.hired}명 확정 · ${denom === 'moe' ? `진학·입대 ${k.excluded}명 제외(교육부 기준)` : '3학년 전체 기준'}`, 2, 1),
      kpi('협약·동의 미완료', k.pendingDocs, '건', `만료 ${k.expiredDocs} · 거부 ${k.declined} · 공식 통계 기준일 4월 1일`, 3, 0, k.pendingDocs ? 'warn' : 'ok'),
    ].join('');
    $$('[data-count]').forEach((el) => UI.countUp(el, Number(el.dataset.count), { decimals: Number(el.dataset.dec), dur: 900 + Number(el.dataset.i || 0) * 100 }));
    const dept = CPX.byDept(role, denom);
    UI.barChart($('#deptChart'), dept.map((d) => ({ label: d.short, values: [d.placeRate, d.hireRate] })), [{ color: accent }, { color: okc }], { unit: '%' });
    $('#thBase').textContent = denom === 'moe' ? '취업 희망' : '전체';
    $('#deptBody').innerHTML = dept.map((d) => `<tr><td><span class="dot" style="--c:${d.color}"></span>${esc(d.name)}</td><td class="num">${d.total}</td><td class="num">${d.base}</td><td class="num">${d.placed}</td><td class="num">${CP.fmt.pct(d.placeRate)}</td><td class="num">${d.hired}</td><td class="num"><b>${CP.fmt.pct(d.hireRate)}</b></td></tr>`).join('');
    $('#denomNote').innerHTML = denom === 'moe' ? '교육부·KEDI 취업통계 방식: 분모 = 졸업(예정)자 − 진학자 − 입대자. 같은 데이터를 3학년 전체로 나누면 수치가 절반 가까이 내려갑니다 — 토글로 비교해 보세요.' : '3학년 전체를 분모로 한 수치. 교육청 보고·공식 통계와 다른 정의라 대외 자료에는 쓰지 않습니다.';
    UI.reveal($('#kpis'));
  }
  function kpi(label, value, unit, sub, i, dec = 0, tone = '') { return `<article class="kpi kpi--${tone}" data-reveal style="--i:${i}"><span class="kpi__label">${label}<i class="kpi__sq" aria-hidden="true"></i></span><span class="kpi__value"><b data-count="${value}" data-dec="${dec}" data-i="${i}">0</b><small>${unit}</small></span><span class="kpi__sub">${sub}</span></article>`; }
  renderKpis();
  $$('input[name=denom]').forEach((r) => r.addEventListener('change', () => { denom = r.value; renderKpis(); toast(denom === 'moe' ? '교육부 기준(진학·입대 제외)으로 재계산' : '3학년 전체 기준으로 재계산', 'info', 1800); }));

  /* 배정 목록 */
  let filter = new URLSearchParams(location.search).get('f') || 'all', q = '';
  const rows = () => pls.map((p) => ({ p, s: CP.student(p.studentId), j: CP.job(p.jobId), state: CPX.placementState(p) }));
  function renderTable() {
    const all = rows();
    ['all', 'unsent', 'progress', 'expired', 'declined', 'complete'].forEach((f) => { const el = $(`[data-cnt="${f}"]`); if (el) el.textContent = f === 'all' ? all.length : all.filter((r) => r.state === f).length; });
    const list = all.filter((r) => (filter === 'all' || r.state === filter) && (!q || (r.s.name + r.j.company + r.j.role).includes(q)));
    $('#plBody').innerHTML = list.map((r) => `<tr>
      <td>${ADMIN.studentLink(r.s)}</td>
      <td><b>${esc(r.j.company)}</b><br><span class="muted t-small">${esc(r.j.role)} · ${CP.fmt.date(r.j.start)} 시작</span></td>
      ${CP.DOC_CHAIN.map((k) => docCell(r.p, k)).join('')}
      <td>${badge(CPX.PSTATE_LABEL[r.state], CPX.PSTATE_KIND[r.state])}</td>
      <td class="actions"><a class="btn btn--ghost btn--sm" href="consents.html?p=${r.p.id}">상세</a>${r.state !== 'complete' && r.state !== 'declined' && role.can.send && ['guardian', 'student', 'agreement'].includes(CPX.nextStep(r.p)) ? `<button class="btn btn--soft btn--sm" data-remind="${r.p.id}">독려</button>` : ''}</td></tr>`).join('');
    $('#plEmpty').hidden = list.length > 0;
    const pending = all.filter((r) => !['complete', 'declined'].includes(r.state) && ['guardian', 'student', 'agreement'].includes(CPX.nextStep(r.p))).length;
    $('#bulkTxt').innerHTML = `지금 서명 차례인데 아직 안 한 건 <b>${pending}건</b> · 차례인 사람(보호자·학생·기업)에게만 「독려(T02)」를 보냅니다. 거부·날인 대기는 제외`;
    $('#remindAll').disabled = !role.can.send || pending === 0;
  }
  function docCell(p, k) { const d = p.docs[k]; const e = CPX.effStatus(d); const next = CPX.nextStep(p) === k; const when = d.signedAt ? CP.fmt.date(d.signedAt) : d.viewedAt ? `열람 ${CP.fmt.date(d.viewedAt)}` : d.sentAt ? `발송 ${CP.fmt.date(d.sentAt)}` : next ? '지금 차례' : ''; return `<td class="${next ? 'is-next' : ''}">${badge(k === 'principal' && e === 'sent' ? '날인 대기' : k === 'principal' && e === 'signed' ? '날인' : CPX.STATUS_LABEL[e], UI.DOC_KIND[e])}<br><span class="muted t-small">${when}</span></td>`; }
  renderTable();
  $$('.chip[data-f]').forEach((c) => c.addEventListener('click', () => { filter = c.dataset.f; $$('.chip[data-f]').forEach((x) => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-pressed', x === c); }); renderTable(); }));
  $('#q').addEventListener('input', (e) => { q = e.target.value.trim(); renderTable(); });
  if (filter !== 'all') { const c = $(`.chip[data-f="${filter}"]`); if (c) c.click(); }

  content.addEventListener('click', (e) => { const b = e.target.closest('[data-remind]'); if (b) remind([CP.placement(b.dataset.remind)]); });
  $('#remindAll').addEventListener('click', () => remind(rows().filter((r) => !['complete', 'declined'].includes(r.state)).map((r) => r.p)));
  function remind(list) {
    if (!role.can.send) return ADMIN.deny(role, '알림톡을 발송');
    const targets = list.map((p) => ({ p, who: CPX.nextStep(p) })).filter((t) => ['guardian', 'student', 'agreement'].includes(t.who) && t.p.docs[t.who].status !== 'declined');
    if (!targets.length) return toast('지금 차례인 미서명 건이 없습니다', 'info');
    const T = st.templates.find((t) => t.id === 'T02'); const win = CPX.sendWindow(T); const s0 = CP.student(targets[0].p.studentId);
    const cnt = { guardian: 0, student: 0, agreement: 0 }; targets.forEach((t) => cnt[t.who]++);
    modal({ title: '서명 독려 알림톡 발송', size: 'md', body: `<p class="t-body">대상 <b>${targets.length}건</b> — 보호자 ${cnt.guardian} · 학생 ${cnt.student} · 기업 ${cnt.agreement}. 미발송 건은 최초 발송(T01), 나머지는 독려(T02). 순서상 차례가 아닌 사람에게는 가지 않습니다.</p><div class="tpl-preview"><span class="tpl-preview__name">${T.name} · ${badge('승인', 'ok')}</span><pre>${esc(CPX.fill(T, s0))}</pre><span class="tpl-preview__btn">${T.buttons[0]}</span></div>${win.night ? `<p class="notice notice--warn">지금은 야간(21~08시)입니다. 정보성 알림은 발송 가능하지만 <b>내일 08:30 예약</b>을 권장합니다.</p>` : ''}<p class="t-small muted">알림톡 실패(카톡 미가입·72시간 미사용·번호 오류)는 자동으로 SMS로 대체되고 사유가 이력에 남습니다. 예상 비용 약 ${(targets.length * 13).toLocaleString()}원.</p>`, actions: [{ label: '취소' }, { label: `${targets.length}건 발송`, kind: 'btn--primary', onClick: (m) => { let kakao = 0, sms = 0; targets.forEach(({ p, who }) => { const ch = CPX.sendDoc(p, who, { resend: p.docs[who].status !== 'none' }); if (ch === 'sms') sms++; else kakao++; }); CP.audit('독려 발송', `${targets.length}건 (알림톡 ${kakao} · SMS ${sms})`); m.close(); toast(`발송 완료 — 알림톡 ${kakao}건${sms ? ` · SMS 대체 ${sms}건` : ''}. 발송 이력에서 확인할 수 있어요`, 'ok', 4500); renderTable(); renderKpis(); } }] });
  }
  UI.reveal();
})();
