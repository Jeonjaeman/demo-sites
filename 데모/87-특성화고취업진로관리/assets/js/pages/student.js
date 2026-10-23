/* 2-2·2-4 학생 상세 — 인적사항·진로 트랙·정보 제공 동의 · 이력 타임라인(증빙 확인/반려·확인자 기록) · 포트폴리오 버전 · 진로 갭 · 4단 서명자 상태 패널 · 취업(전환) 동의 · 상담 메모 */
(function () {
  'use strict';
  const role = UI.requireRole(); if (!role) return;
  const { $, $$, esc, toast, modal, badge } = UI;
  const id = new URLSearchParams(location.search).get('id');
  const st = CP.load();
  const scoped0 = CP.scopedStudents(role); let s = CP.student(id) || scoped0.find((x) => CP.placementOf(x.id) && x.certs.some((c) => c.status === 'pending')) || scoped0.find((x) => x.certs.length >= 2) || scoped0[0];
  const inScope = CP.scopedStudents(role).some((x) => x.id === s.id);
  const content = ADMIN.mountShell(role, { title: `${s.name} · 학생 상세`, actions: `<a class="btn btn--ghost btn--sm" href="students.html">← 목록</a><a class="btn btn--primary btn--sm" href="report.html?id=${s.id}">진로 가이드 리포트</a>` });
  if (!inScope) { content.innerHTML = `<div class="panel"><p class="empty">담임 권한으로는 다른 학급 학생(${esc(s.name)})을 열람할 수 없습니다 — 서버가 행 단위로 범위를 강제합니다. 이 열람 시도는 기록되었습니다.</p><a class="btn btn--primary" href="students.html">내 학급 목록으로</a></div>`; CP.audit('권한 외 열람 시도 차단', s.name); return; }
  const TRACK = { job: '취업', college: '진학', military: '입대' };

  function render() {
    s = CP.student(s.id); const g = CPX.gap(s), guide = CPX.guide(g); const pl = CP.placementOf(s.id); const job = pl ? CP.job(pl.jobId) : null; const minor = CP.age(s.birth) < 18;
    content.innerHTML = `
      <section class="profile" data-reveal>
        <div class="profile__id"><span class="avatar" aria-hidden="true">${esc(s.name[0])}</span>
          <div><h2 class="profile__name">${esc(s.name)} ${ADMIN.jobStatusBadge(s)} ${badge(`${TRACK[s.track]} 트랙`, s.track === 'job' ? 'info' : 'neutral')}${minor ? badge('만 18세 미만', 'neutral') : ''}</h2><p class="profile__meta">${esc(CP.dept(s.dept).name)} 3학년 ${s.cls}반 ${s.no}번 · 학번 <span class="mono">${s.sid}</span> · ${CP.fmt.date(s.birth)} (만 ${CP.age(s.birth)}세)</p>
          <p class="profile__meta" id="contacts">학생 ${CP.fmt.phoneMask(s.phone)} · 보호자 ${esc(s.guardian.name)}(${s.guardian.rel}${s.guardian.legal ? '' : ' · 비친권자'}) ${CP.fmt.phoneMask(s.guardian.phone)} <button class="btn btn--text btn--sm" id="reveal">번호 보기</button></p></div></div>
        <div class="profile__goal">
          <div class="kv-inline"><span>희망 직무</span><b>${esc(s.job)}</b></div>
          <div class="kv-inline"><span>진로 목표</span><b>${esc(s.goal)}</b></div>
          <div class="kv-inline"><span>기업 정보 제공 동의</span><b>${s.infoConsent ? badge('동의', 'ok') : badge('미동의 — 매칭 시 프로필 잠김', 'warn')}</b></div>
          <div class="kv-inline"><span>채용 알림 신청</span><b>${s.jobAlertOptIn ? badge('신청', 'ok') : badge('미신청', 'neutral')}</b></div>
          <button class="btn btn--ghost btn--sm" id="editGoal">수정</button>
        </div>
        <div class="profile__score"><canvas id="ring" width="96" height="96" aria-hidden="true"></canvas><div><b id="scoreNum">0</b><span>진로 준비도</span><small>필수 ${g.must.ok}/${g.must.total} · 권장 ${g.all.ok - g.must.ok}/${g.all.total - g.must.total}</small></div></div>
      </section>
      <div class="grid-2 grid-2--wide">
        <section class="panel" data-reveal>
          <header class="panel__head"><h2 class="panel__title">취업·진로 이력</h2><button class="btn btn--soft btn--sm" id="addItem">이력 추가</button></header>
          <ol class="timeline">${timeline()}</ol>
        </section>
        <div class="stack">
          <section class="panel" data-reveal>
            <header class="panel__head"><h2 class="panel__title">희망 직무 「${esc(s.job)}」 권장 스펙 대조</h2><a class="btn btn--text btn--sm" href="report.html?id=${s.id}">리포트 →</a></header>
            <ul class="gaplist">${g.items.map((it) => `<li class="gap gap--${it.state}"><span class="gap__state" aria-hidden="true"></span><span class="gap__name">${esc(it.name)} ${it.must ? badge('필수', 'neutral') : ''}</span><span class="gap__label">${{ ok: '충족', pending: '확인 대기', missing: '미취득' }[it.state]}</span></li>`).join('')}</ul>
            ${guide.length ? `<h3 class="t-eyebrow mt">보완 가이드</h3><ul class="bullets bullets--tight">${guide.map((x) => `<li><b>${x.kind}</b> ${esc(x.text)}</li>`).join('')}</ul>` : '<p class="notice notice--ok">권장 스펙을 모두 충족했습니다.</p>'}
          </section>
          <section class="panel" data-reveal>
            <header class="panel__head"><h2 class="panel__title">자기소개서 · 포트폴리오</h2><button class="btn btn--soft btn--sm" id="addVer">새 버전 올리기</button></header>
            ${portfolio()}
          </section>
          <section class="panel" data-reveal>
            <header class="panel__head"><h2 class="panel__title">현장실습 · 서명 진행</h2>${pl ? `<a class="btn btn--text btn--sm" href="consents.html?p=${pl.id}">전자동의 →</a>` : ''}</header>
            ${pl ? `<p class="t-body"><b>${esc(job.company)}</b> · ${esc(job.role)} · ${CP.fmt.date(job.start)}~${CP.fmt.date(job.end)} ${badge(CPX.PSTATE_LABEL[CPX.placementState(pl)], CPX.PSTATE_KIND[CPX.placementState(pl)])}</p>
              <ol class="signers">${CP.DOC_CHAIN.map((k) => { const d = pl.docs[k]; const e = CPX.effStatus(d); const nm = k === 'guardian' ? `${s.guardian.name}(${d.rel || s.guardian.rel})` : k === 'student' ? s.name : k === 'agreement' ? job.ceo : `${CP.SCHOOL.short}장`; return `<li class="signer signer--${e}"><span class="signer__dot"></span><div><b>${CPX.DOC_SHORT[k]}</b> <span class="muted t-small">${esc(nm)}</span></div><span class="t-small">${badge(CPX.STATUS_LABEL[e], UI.DOC_KIND[e])} ${d.signedTime ? CP.fmt.dt(d.signedTime) : d.viewedAt ? `열람 ${CP.fmt.date(d.viewedAt)}` : d.sentAt ? `발송 ${CP.fmt.date(d.sentAt)}` : CPX.nextStep(pl) === k ? '지금 차례' : ''}</span></li>`; }).join('')}</ol>
              ${s.jobStatus === 'hired' && pl.employment ? `<h3 class="t-eyebrow mt">취업(전환) 동의서 ${minor ? badge('친권자 동의서 비치 안내', 'info') : ''}</h3><p class="t-small">보호자 ${badge(CPX.STATUS_LABEL[CPX.effStatus(pl.employment.guardian)], UI.DOC_KIND[CPX.effStatus(pl.employment.guardian)])} · 학생 ${badge(CPX.STATUS_LABEL[CPX.effStatus(pl.employment.student)], UI.DOC_KIND[CPX.effStatus(pl.employment.student)])}</p>` : ''}` : `<p class="empty">아직 배정된 현장실습이 없습니다.${s.track !== 'job' ? ` ${TRACK[s.track]} 트랙이라 취업률 분모에서 제외됩니다.` : ''}</p><a class="btn btn--ghost btn--sm" href="jobs.html?dept=${s.dept}">맞는 공고 보기</a>`}
          </section>
          <section class="panel" data-reveal>
            <header class="panel__head"><h2 class="panel__title">상담 메모</h2><span class="muted t-small">담임·취업지원부만 열람 · 학생 공개 설정 가능</span></header>
            <ul class="memos">${s.memos.map((m) => `<li><span class="memos__meta">${CP.fmt.date(m.date)} · ${esc(m.by)}</span><p>${esc(m.text)}</p></li>`).join('') || '<li class="empty">메모가 없습니다.</li>'}</ul>
            <form class="memo-form" id="memoForm"><textarea class="input" id="memoText" rows="2" placeholder="상담 내용을 적고 Ctrl+Enter 또는 저장" aria-label="상담 메모"></textarea><button class="btn btn--primary btn--sm" type="submit">저장</button></form>
          </section>
        </div>
      </div>`;
    UI.countUp($('#scoreNum'), g.score);
    const css = getComputedStyle(document.documentElement);
    UI.donut($('#ring'), [{ value: g.score, color: css.getPropertyValue(g.score >= 70 ? '--ok' : g.score >= 40 ? '--accent' : '--warn').trim() }, { value: 100 - g.score, color: 'transparent' }], { thick: 8 });
    UI.reveal();
  }
  function timeline() {
    const items = [...s.certs.map((c) => ({ kind: '자격증', ...c, title: c.name, sub: `${c.issuer}${c.no ? ' · 자격번호 ' + c.no : ''}` })), ...s.langs.map((l) => ({ kind: '어학', ...l, title: `${l.test} ${l.score}`, sub: '성적표' })), ...s.awards.map((a) => ({ kind: '수상', ...a, title: a.name, sub: '상장' }))].sort((a, b) => b.date.localeCompare(a.date));
    if (!items.length) return '<li class="empty">등록된 이력이 없습니다. 학생 앱에서 학생이 직접 올리거나 「이력 추가」로 등록합니다.</li>';
    let lastMonth = '';
    return items.map((it) => { const mon = it.date.slice(0, 7).replace('-', '.'); const head = mon !== lastMonth ? `<li class="tl-month">${mon}</li>` : ''; lastMonth = mon; return `${head}<li class="tl tl--${it.status}"><span class="tl__date">${it.date.slice(8)}일</span><div class="tl__body"><div class="tl__title"><span class="tl__kind">${it.kind}</span> ${esc(it.title)} ${badge({ verified: '교사 확인', pending: '확인 대기', rejected: '반려' }[it.status], { verified: 'ok', pending: 'warn', rejected: 'danger' }[it.status])}</div><div class="tl__sub muted t-small">${esc(it.sub)} · 증빙 <a href="#" class="plink" data-file="${esc(it.file)}">${esc(it.file)}</a>${it.verifiedBy ? ` · 확인 ${esc(it.verifiedBy)} ${CP.fmt.date(it.verifiedAt)}` : ''}${it.note ? ` · <span class="t-danger">${esc(it.note)}</span>` : ''}</div></div><div class="tl__act">${it.status === 'pending' && role.can.verify ? `<button class="btn btn--primary btn--sm" data-verify="${it.id}">확인</button><button class="btn btn--ghost btn--sm" data-reject="${it.id}">반려</button>` : it.status === 'rejected' ? `<button class="btn btn--ghost btn--sm" data-verify="${it.id}">재확인</button>` : ''}</div></li>`; }).join('');
  }
  function portfolio() {
    const pf = s.portfolio.filter((p) => p.ver > 0).sort((a, b) => b.ver - a.ver); const rs = s.portfolio.filter((p) => p.kind === 'resume');
    return `<div class="versions">${pf.length ? pf.map((p, i) => `<div class="ver ${i === 0 ? 'is-latest' : ''}"><span class="ver__tag">v${p.ver}</span><div><b>${esc(p.file)}</b><span class="muted t-small">${CP.fmt.date(p.date)} · ${p.size}${p.memo ? ` · ${esc(p.memo)}` : ''}</span></div><button class="btn btn--text btn--sm" data-file="${esc(p.file)}">열람</button></div>`).join('') : '<p class="empty">포트폴리오가 없습니다.</p>'}</div>${rs.length ? `<h3 class="t-eyebrow mt">자기소개서</h3><div class="versions">${rs.map((p) => `<div class="ver"><span class="ver__tag">자소서</span><div><b>${esc(p.file)}</b><span class="muted t-small">${CP.fmt.date(p.date)} · ${p.size}</span></div><button class="btn btn--text btn--sm" data-file="${esc(p.file)}">열람</button></div>`).join('')}</div>` : ''}<p class="t-small muted">이전 버전은 지우지 않고 쌓입니다. 기업 열람 시에는 최신본만, 정보 제공 동의가 있을 때만 보입니다.</p>`;
  }
  render();
  content.addEventListener('click', (e) => {
    const v = e.target.closest('[data-verify]'); if (v) return setStatus(v.dataset.verify, 'verified');
    const r = e.target.closest('[data-reject]'); if (r) return rejectFlow(r.dataset.reject);
    const f = e.target.closest('[data-file]'); if (f) { e.preventDefault(); return toast(`"${f.dataset.file}" — 데모라 파일은 열리지 않습니다 (실서비스: 서명된 URL로 10분간 열람 · 열람 기록)`, 'info'); }
    if (e.target.id === 'reveal') { $('#contacts').innerHTML = `학생 ${s.phone} · 보호자 ${esc(s.guardian.name)}(${s.guardian.rel}) ${s.guardian.phone} <span class="muted t-small">열람 기록됨</span>`; CP.audit('연락처 열람', s.name); }
    if (e.target.id === 'editGoal') editGoal();
    if (e.target.id === 'addItem') addItem();
    if (e.target.id === 'addVer') addVer();
  });
  function find(itemId) { return [...s.certs, ...s.langs, ...s.awards].find((x) => x.id === itemId); }
  function setStatus(itemId, status, note) { const it = find(itemId); it.status = status; it.note = note || ''; if (status === 'verified') { it.verifiedBy = role.name; it.verifiedAt = CP.iso(CP.TODAY); } CP.save(); CP.audit(status === 'verified' ? '증빙 확인' : '증빙 반려', `${s.name} · ${it.name || it.test}`); toast(status === 'verified' ? '교사 확인 처리 — 진로 준비도에 바로 반영됩니다' : '반려 처리 — 학생 앱에 보완 요청이 뜹니다', status === 'verified' ? 'ok' : 'warn'); render(); }
  function rejectFlow(itemId) { modal({ title: '증빙 반려', size: 'sm', body: `<label class="field"><span class="field__label">반려 사유 (학생에게 그대로 보입니다)</span><select class="select" id="why"><option>파일이 흐려서 내용을 읽을 수 없음</option><option>자격증명과 파일 내용이 다름</option><option>발급일·성명 확인 불가</option><option>만료된 자격</option></select></label>`, actions: [{ label: '취소' }, { label: '반려', kind: 'btn--danger', onClick: (m) => { setStatus(itemId, 'rejected', $('#why', m.el).value); m.close(); } }] }); }
  function editGoal() { modal({ title: '희망 직무 · 진로 목표 · 동의 수정', size: 'sm', body: `<label class="field"><span class="field__label">희망 직무</span><select class="select" id="job">${Object.keys(st.specs).map((j) => `<option ${j === s.job ? 'selected' : ''}>${j}</option>`).join('')}</select></label><label class="field"><span class="field__label">진로 트랙 (취업률 분모)</span><select class="select" id="track"><option value="job" ${s.track === 'job' ? 'selected' : ''}>취업</option><option value="college" ${s.track === 'college' ? 'selected' : ''}>진학(분모 제외)</option><option value="military" ${s.track === 'military' ? 'selected' : ''}>입대(분모 제외)</option></select></label><label class="field"><span class="field__label">진로 목표</span><select class="select" id="goal">${['졸업 후 바로 취업', '취업 후 재직자 전형 진학', '전문대 진학 후 취업', '공기업·공공기관 취업', '4년제 진학', '미정'].map((g) => `<option ${g === s.goal ? 'selected' : ''}>${g}</option>`).join('')}</select></label><label class="check"><input type="checkbox" id="ic" ${s.infoConsent ? 'checked' : ''}><span>기업 열람용 정보 제공 동의 수령(학생+보호자 · 교육기본법 §23의3)</span></label><p class="t-small muted">희망 직무를 바꾸면 권장 스펙 대조와 준비도가 즉시 다시 계산됩니다.</p>`, actions: [{ label: '취소' }, { label: '저장', kind: 'btn--primary', onClick: (m) => { s.job = $('#job', m.el).value; s.track = $('#track', m.el).value; s.goal = $('#goal', m.el).value; s.infoConsent = $('#ic', m.el).checked; CP.save(); CP.audit('학생 정보 수정', `${s.name} → ${s.job} · ${TRACK[s.track]}`); m.close(); toast('저장 — 준비도·통계를 다시 계산했습니다', 'ok'); render(); } }] }); }
  function addItem() { const certs = [...new Set(Object.values(st.specs).flatMap((x) => x.items.filter((i) => i.kind === 'cert').map((i) => i.name)))]; modal({ title: '이력 추가 (교사 대리 등록)', size: 'sm', body: `<label class="field"><span class="field__label">종류</span><select class="select" id="kind"><option value="cert">자격증</option><option value="lang">어학</option><option value="award">수상</option></select></label><label class="field"><span class="field__label">명칭</span><input class="input" id="name" list="certs" value="${certs[0]}"><datalist id="certs">${certs.map((c) => `<option>${c}</option>`).join('')}</datalist></label><label class="field"><span class="field__label">취득일</span><input class="input" id="date" type="date" value="${CP.iso(CP.TODAY)}"></label><label class="field"><span class="field__label">증빙 파일</span><input class="input" id="file" type="file" accept=".pdf,.jpg,.png"></label>`, actions: [{ label: '취소' }, { label: '등록 (교사 확인 상태로)', kind: 'btn--primary', onClick: (m) => { const kind = $('#kind', m.el).value, name = $('#name', m.el).value.trim(), date = $('#date', m.el).value; if (!name) return toast('명칭을 입력하세요', 'warn'); const idn = `x${Date.now().toString(36)}`; if (kind === 'cert') s.certs.push({ id: idn, name, issuer: CP.issuerOf(name), date, file: name + '.pdf', status: 'verified', note: '', verifiedBy: role.name, verifiedAt: CP.iso(CP.TODAY) }); else if (kind === 'lang') s.langs.push({ id: idn, test: name.split(' ')[0], score: name.split(' ')[1] || '', date, file: '성적표.pdf', status: 'verified' }); else s.awards.push({ id: idn, name, date, file: '상장.jpg', status: 'verified' }); CP.save(); CP.audit('이력 대리 등록', `${s.name} · ${name}`); m.close(); toast('등록했습니다', 'ok'); render(); } }] }); }
  function addVer() { const next = Math.max(0, ...s.portfolio.filter((p) => p.ver > 0).map((p) => p.ver)) + 1; modal({ title: `포트폴리오 v${next} 올리기`, size: 'sm', body: `<label class="field"><span class="field__label">파일</span><input class="input" id="pf" type="file" accept=".pdf,.pptx,.zip"></label><label class="field"><span class="field__label">변경 메모</span><input class="input" id="memo" value="교사 피드백 반영 · 프로젝트 1건 추가"></label><p class="t-small muted">v${next - 1 || 0}는 그대로 남고 v${next}가 최신이 됩니다.</p>`, actions: [{ label: '취소' }, { label: '올리기', kind: 'btn--primary', onClick: (m) => { s.portfolio.forEach((p) => { if (p.ver > 0) p.memo = ''; }); s.portfolio.push({ ver: next, file: `${s.name}_포트폴리오_v${next}.pdf`, date: CP.iso(CP.TODAY), size: '3.9MB', memo: $('#memo', m.el).value || '최신' }); CP.save(); CP.audit('포트폴리오 버전 추가', `${s.name} v${next}`); m.close(); toast(`v${next} 등록 — 이전 버전은 보존됩니다`, 'ok'); render(); } }] }); }
  content.addEventListener('submit', (e) => { if (e.target.id !== 'memoForm') return; e.preventDefault(); const t = $('#memoText').value.trim(); if (!t) return toast('내용을 입력하세요', 'warn'); s.memos.unshift({ date: CP.iso(CP.TODAY), by: role.name, text: t }); CP.save(); CP.audit('상담 메모 저장', s.name); toast('상담 메모를 저장했습니다', 'ok'); render(); });
  content.addEventListener('keydown', (e) => { if (e.target.id === 'memoText' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('#memoForm').requestSubmit(); });
})();
