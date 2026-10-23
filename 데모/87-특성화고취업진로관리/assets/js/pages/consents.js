/* 2-3 현장실습 전자동의 — 문서 체인 4단(보호자 → 학생 → 기업 대표 → 학교장 날인) · 순서 잠금(F1·F2) · 발송·재발송·72시간 만료 · 거부 처리 · 학교장 일괄 날인 · 변경 합의 재서명(F16) · HIFIVE 등재(F6) · 취업(전환) 동의서(F17) · 서명본 PDF(감사추적) */
(function () {
  'use strict';
  const role = UI.requireRole(); if (!role) return;
  const { $, $$, esc, toast, modal, badge } = UI;
  const content = ADMIN.mountShell(role, { actions: `<button class="btn btn--ghost btn--sm" id="hifiveExport">HIFIVE 등재용 엑셀</button><a class="btn btn--primary btn--sm" href="jobs.html">배정하러 가기 →</a>` });
  const st = CP.load();
  const ids = new Set(CP.scopedStudents(role).map((s) => s.id));
  const qs = new URLSearchParams(location.search);
  let filter = qs.get('f') || 'all', focusId = qs.get('p');

  content.innerHTML = `
    <section class="panel" data-reveal>
      <header class="panel__head panel__head--wrap">
        <div><h2 class="panel__title">서명 진행 현황</h2><p class="panel__desc">배정 1건마다 <b>보호자 사전동의서 → 학생 사전동의서 → 표준협약서(기업 대표 서명) → 학교장 날인</b> 4단이 순서대로 진행됩니다. 앞 단계가 끝나야 다음 링크를 보낼 수 있고(미성년자 법률행위는 법정대리인 동의 선행), 링크는 발송 후 <b>72시간</b>이 지나면 닫힙니다.</p></div>
        <div class="filters" role="group" aria-label="상태 필터">${['all:전체', 'unsent:미발송', 'progress:진행 중', 'expired:만료 있음', 'declined:거부', 'seal:날인 대기', 'complete:체결 완료'].map((f) => { const [v, l] = f.split(':'); return `<button class="chip${v === filter ? ' is-on' : ''}" data-f="${v}" aria-pressed="${v === filter}">${l} <b data-cnt="${v}"></b></button>`; }).join('')}</div>
      </header>
      <div class="bulk" id="sealBar" hidden><span id="sealTxt" class="t-small"></span><button class="btn btn--primary btn--sm" id="sealAll">학교장 직인 일괄 날인</button></div>
      <div class="cards-list" id="list"></div>
      <p class="empty" id="empty" hidden>조건에 맞는 배정이 없습니다. 기업 공고·매칭에서 학생을 배정하면 여기에 문서 체인이 생깁니다.</p>
    </section>
    <section class="panel" data-reveal id="emp">
      <header class="panel__head"><div><h2 class="panel__title">취업(전환) 동의서 — 취업 확정 학생</h2><p class="panel__desc">실습 후 채용으로 이어지면 학생 + 보호자 동의(매뉴얼 서식3)를 같은 OTP·서명·PDF 흐름으로 받습니다. 만 18세 미만은 기업 비치용 친권자 동의서(근로기준법 §66)를 함께 안내합니다.</p></div></header>
      <div class="cards-list" id="empList"></div>
    </section>
    <section class="panel panel--muted" data-reveal>
      <h2 class="panel__title">서명이 법적으로 유효하려면 — 데모에 들어간 장치</h2>
      <ul class="bullets">
        <li><b>서명자 매트릭스</b> — 표준협약서는 학부모가 아니라 <b>기업 대표·학생·학교장</b>이 서명하는 문서(교육부 고시 표준협약서 제22조). 공고의 "학부모 터치서명 → 협약서 PDF" 흐름을 4단 체인으로 바로잡았습니다.</li>
        <li><b>순서 잠금</b> — 보호자 동의 전에는 학생·기업 링크 발송 버튼이 잠깁니다. 법정대리인 동의가 있었다는 입증책임은 학교·기업에 있습니다(민법 §5).</li>
        <li><b>서명자 식별</b> — 알림톡 배달은 본인 확인이 아닙니다. 학교에 등록된 번호로 OTP 6자리를 받아야 열리고, 5회 실패 시 잠깁니다. 링크에서 번호를 바꿀 수 없습니다(대리 서명 통로 차단).</li>
        <li><b>약정·무결성</b> — "전자서명을 자필 서명과 같은 효력으로 사용"에 개별 동의(전자서명법 §3 당사자 약정), 서명 시각·OTP 시각·IP·확인번호(해시)를 PDF 마지막 장 감사추적에 자동 첨부. 서명 직후 사본 알림톡으로 이의 제기 창구를 둡니다.</li>
        <li><b>거부·철회 경로</b> — "동의하지 않습니다"를 숨기지 않습니다. 사유가 이 화면에 즉시 뜨고, 학교가 연락한 뒤 새 링크를 보냅니다.</li>
      </ul>
    </section>`;

  const pls = () => st.placements.filter((p) => ids.has(p.studentId));
  const stateOf = (p) => { const s = CPX.placementState(p); return s === 'progress' && CPX.nextStep(p) === 'principal' ? 'seal' : s; };
  function render() {
    const all = pls();
    ['all', 'unsent', 'progress', 'expired', 'declined', 'seal', 'complete'].forEach((f) => { const el = $(`[data-cnt="${f}"]`); if (el) el.textContent = f === 'all' ? all.length : all.filter((p) => stateOf(p) === f || (f === 'progress' && stateOf(p) === 'seal')).length; });
    const list = all.filter((p) => filter === 'all' || stateOf(p) === filter || (filter === 'progress' && stateOf(p) === 'seal')).sort((a, b) => (a.id === focusId ? -1 : b.id === focusId ? 1 : 0));
    $('#list').innerHTML = list.map((p, i) => card(p, i)).join('');
    $('#empty').hidden = list.length > 0;
    const seals = all.filter((p) => stateOf(p) === 'seal');
    $('#sealBar').hidden = !seals.length; $('#sealTxt').innerHTML = `기업 서명까지 끝나 <b>학교장 날인 대기 ${seals.length}건</b> — ${role.can.seal ? '총괄 관리자 권한으로 직인 이미지를 일괄 날인합니다(교장 결재 대행 · 기록 남음)' : '날인은 총괄 관리자만 할 수 있습니다'}`; $('#sealAll').disabled = !role.can.seal;
    renderEmp();
    if (focusId) { const el = $(`[data-p="${focusId}"]`); if (el) { el.classList.add('is-focus'); el.scrollIntoView({ block: 'center' }); } focusId = null; }
    UI.reveal($('#list'));
  }
  function card(p, i) {
    const s = CP.student(p.studentId), j = CP.job(p.jobId); const state = stateOf(p); const next = CPX.nextStep(p);
    const issues = CPX.jobIssues(j).filter((x) => x.level === 'block');
    return `<article class="consent" data-p="${p.id}" style="--i:${i % 8}" data-reveal>
      <header class="consent__head">
        <div><h3 class="consent__name">${ADMIN.studentLink(s)} ${CP.age(s.birth) < 18 ? badge('만 18세 미만', 'info') : ''}</h3><p class="consent__job"><b>${esc(j.company)}</b> · ${esc(j.role)} · ${CP.fmt.date(j.start)}~${CP.fmt.date(j.end)} · 배정 ${CP.fmt.date(p.assignedAt)}${p.version > 1 ? ` · ${badge(`변경 합의 v${p.version}`, 'warn')}` : ''}</p></div>
        <div class="consent__state">${badge({ seal: '날인 대기', ...CPX.PSTATE_LABEL }[state], { seal: 'warn', ...CPX.PSTATE_KIND }[state])}${state === 'complete' ? `<label class="check check--inline" title="승인된 협약은 교육부 현장실습 관리 시스템(HIFIVE)에 등재해야 합니다"><input type="checkbox" data-hifive="${p.id}" ${p.hifive ? 'checked' : ''} ${role.can.assign ? '' : 'disabled'}><span>HIFIVE 등재</span></label><button class="btn btn--primary btn--sm" data-zip="${p.id}">3부 PDF</button>` : ''}</div>
      </header>
      <ol class="chain">${CP.DOC_CHAIN.map((k) => chainStep(p, k, s, j, next)).join('')}</ol>
      ${issues.length ? `<p class="notice notice--danger t-small">공고 조건이 운영 기준을 넘습니다: ${issues.map((x) => esc(x.text)).join(' · ')} — 조건 수정 전 발송 금지</p>` : ''}
      <footer class="consent__foot">
        ${state === 'complete' && role.can.assign ? `<button class="btn btn--ghost btn--sm" data-reopen="${p.id}">실습 조건 변경 → 변경 합의서 재서명</button>` : ''}
        ${p.history && p.history.length ? `<button class="btn btn--text btn--sm" data-hist="${p.id}">이전 버전 ${p.history.length}건</button>` : ''}
        <a class="btn btn--text btn--sm" href="student.html?id=${s.id}">학생 상세</a>
      </footer>
    </article>`;
  }
  function chainStep(p, k, s, j, next) {
    const d = p.docs[k]; const status = CPX.effStatus(d); const isNext = next === k; const lock = CPX.canSend(p, k);
    const who = k === 'guardian' ? `${esc(s.guardian.name)} (${s.guardian.rel}) · ${CP.fmt.phoneMask(s.guardian.phone)}` : k === 'student' ? `${esc(s.name)} · ${CP.fmt.phoneMask(s.phone)}` : k === 'agreement' ? `${esc(j.ceo)} · ${esc(j.company)}` : `${CP.SCHOOL.name}장 (대행: 총괄 관리자)`;
    const exp = CPX.expiresAt(d); const tl = [d.sentAt && `발송 ${CP.fmt.date(d.sentAt)}${d.resent ? ` (재발송 ${d.resent}회)` : ''}`, d.viewedAt && `열람 ${CP.fmt.date(d.viewedAt)}`, d.otpAt && `본인 확인 ${CP.fmt.dt(d.otpAt)}`, d.signedAt && `${k === 'principal' ? '날인' : '서명'} ${d.signedTime ? CP.fmt.dt(d.signedTime) : CP.fmt.date(d.signedAt)}`, d.declinedAt && `거부 ${CP.fmt.date(d.declinedAt)} · ${esc(d.reason || '')}`, status === 'expired' && exp && `기한 ${CP.fmt.dt(exp.toISOString().slice(0, 16))} 지남`, ['sent', 'viewed'].includes(status) && exp && `마감 ${CP.fmt.dt(exp.toISOString().slice(0, 16))}`].filter(Boolean).join(' → ') || (lock.ok ? '발송 전' : `대기 — ${lock.reason}`);
    const canSend = role.can.send && lock.ok; let actions = '';
    if (k === 'principal') {
      if (status === 'sent' || (status === 'none' && lock.ok)) actions = role.can.seal ? `<button class="btn btn--primary btn--sm" data-seal="${p.id}">직인 날인</button>` : '<span class="muted t-small">총괄 관리자만</span>';
      else if (status === 'signed') actions = `<button class="btn btn--ghost btn--sm" data-pdf="${p.id}:agreement">협약서 PDF</button>`;
    } else if (status === 'none') actions = lock.ok ? (role.can.send ? `<button class="btn btn--primary btn--sm" data-send="${p.id}:${k}">발송</button>` : '<span class="muted t-small">발송 권한 없음</span>') : `<span class="lock" title="${esc(lock.reason)}">🔒 순서 대기</span>`;
    else if (status === 'sent' || status === 'viewed') actions = `<a class="btn btn--soft btn--sm" href="../sign.html?t=${p.token}&who=${k}" target="_blank" rel="noopener">${k === 'guardian' ? '학부모' : k === 'student' ? '학생' : '기업'} 화면 열기</a>${canSend ? `<button class="btn btn--ghost btn--sm" data-send="${p.id}:${k}:re">재발송</button>` : ''}`;
    else if (status === 'expired') actions = canSend ? `<button class="btn btn--primary btn--sm" data-send="${p.id}:${k}:re">새 링크 발송</button>` : '';
    else if (status === 'declined') actions = `<a class="btn btn--soft btn--sm" href="tel:${(k === 'guardian' ? s.guardian.phone : s.phone).replace(/-/g, '')}">전화</a>${canSend ? `<button class="btn btn--ghost btn--sm" data-send="${p.id}:${k}:re">새 링크 발송</button>` : ''}`;
    else if (status === 'signed') actions = `<button class="btn btn--ghost btn--sm" data-pdf="${p.id}:${k}">서명본 PDF</button>`;
    return `<li class="chain__step chain__step--${status} ${isNext ? 'is-next' : ''}"><span class="chain__dot" aria-hidden="true"></span><div class="chain__main"><div class="chain__title">${CPX.DOC_SHORT[k]} ${badge(k === 'principal' && status === 'signed' ? '날인 완료' : k === 'principal' && status === 'sent' ? '날인 대기' : CPX.STATUS_LABEL[status], UI.DOC_KIND[status])}${d.legalGuardian === false ? badge('법정대리인 확인 필요', 'warn') : ''}${d.locked ? badge('OTP 5회 실패 잠김', 'danger') : ''}</div><div class="chain__who">${who}</div><div class="chain__time muted t-small">${tl}</div></div><div class="chain__actions">${actions}</div></li>`;
  }
  function renderEmp() {
    const list = pls().filter((p) => CP.student(p.studentId).jobStatus === 'hired');
    $('#empList').innerHTML = list.map((p) => { const s = CP.student(p.studentId), j = CP.job(p.jobId); p.employment = p.employment || { guardian: { status: 'none' }, student: { status: 'none' } }; const e = p.employment; const minor = CP.age(s.birth) < 18; const row = (k) => { const d = e[k]; const stt = CPX.effStatus(d); const whoQ = k === 'guardian' ? 'empGuardian' : 'empStudent'; let act = ''; if (stt === 'none') act = role.can.send ? `<button class="btn btn--primary btn--sm" data-empsend="${p.id}:${k}">발송</button>` : ''; else if (['sent', 'viewed'].includes(stt)) act = `<a class="btn btn--soft btn--sm" href="../sign.html?t=${p.token}&who=${whoQ}" target="_blank" rel="noopener">${k === 'guardian' ? '보호자' : '학생'} 화면 열기</a>`; else if (stt === 'signed') act = badge('서명 완료', 'ok'); else if (stt === 'expired') act = role.can.send ? `<button class="btn btn--primary btn--sm" data-empsend="${p.id}:${k}">새 링크</button>` : ''; return `<li class="chain__step chain__step--${stt}"><span class="chain__dot"></span><div class="chain__main"><div class="chain__title">${k === 'guardian' ? '보호자' : '학생'} 취업(전환) 동의 ${badge(CPX.STATUS_LABEL[stt], UI.DOC_KIND[stt])}</div><div class="chain__time muted t-small">${d.sentAt ? `발송 ${CP.fmt.date(d.sentAt)}` : ''}${d.signedAt ? ` → 서명 ${CP.fmt.date(d.signedAt)}` : ''}</div></div><div class="chain__actions">${act}</div></li>`; }; return `<article class="consent"><header class="consent__head"><div><h3 class="consent__name">${ADMIN.studentLink(s)} ${minor ? badge('만 18세 미만 — 친권자 동의서 비치 안내', 'info') : ''}</h3><p class="consent__job"><b>${esc(j.company)}</b> · ${esc(j.role)} · 취업전환 가능일 ${j.approval === 'leading' ? '수업일수 2/3 출석 이후(선도기업·4주 이상 실습)' : '겨울방학 또는 다음 해 1월 1일(참여기업)'}</p></div><div class="consent__state">${badge('취업 확정', 'ok')}</div></header><ol class="chain chain--2">${row('guardian')}${row('student')}</ol></article>`; }).join('') || '<p class="empty">취업 확정 학생이 없습니다.</p>';
  }
  render();
  $$('.chip[data-f]').forEach((c) => c.addEventListener('click', () => { filter = c.dataset.f; $$('.chip[data-f]').forEach((x) => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-pressed', x === c); }); render(); }));

  content.addEventListener('click', (e) => {
    const send = e.target.closest('[data-send]'); if (send) { const [pid, k, re] = send.dataset.send.split(':'); return doSend(CP.placement(pid), k, !!re); }
    const seal = e.target.closest('[data-seal]'); if (seal) return doSeal([CP.placement(seal.dataset.seal)]);
    if (e.target.id === 'sealAll') return doSeal(pls().filter((p) => stateOf(p) === 'seal'));
    const pdf = e.target.closest('[data-pdf]'); if (pdf) { const [pid, k] = pdf.dataset.pdf.split(':'); return pdfOf(CP.placement(pid), k); }
    const zip = e.target.closest('[data-zip]'); if (zip) { const p = CP.placement(zip.dataset.zip); ['guardian', 'student', 'agreement'].forEach((k, i) => setTimeout(() => pdfOf(p, k, true), i * 400)); toast('3부 PDF를 차례로 엽니다 — 실서비스는 ZIP 한 번에 내려받기', 'info'); return; }
    const ro = e.target.closest('[data-reopen]'); if (ro) return reopenFlow(CP.placement(ro.dataset.reopen));
    const hs = e.target.closest('[data-hist]'); if (hs) { const p = CP.placement(hs.dataset.hist); return modal({ title: '이전 버전', size: 'sm', body: `<ul class="bullets">${p.history.map((h) => `<li><b>v${h.version}</b> · ${CP.fmt.date(h.closedAt)} 잠금 · 사유: ${esc(h.reason)}<br><span class="t-small muted">${CP.DOC_CHAIN.map((k) => `${CPX.DOC_SHORT[k]} ${CPX.STATUS_LABEL[h.docs[k].status]}`).join(' · ')}</span></li>`).join('')}</ul><p class="t-small muted">이전 버전 PDF는 변경 불가 상태로 보관됩니다.</p>`, actions: [{ label: '닫기' }] }); }
    const es = e.target.closest('[data-empsend]'); if (es) { const [pid, k] = es.dataset.empsend.split(':'); const p = CP.placement(pid); const s = CP.student(p.studentId); p.employment[k] = { status: 'sent', sentAt: CP.iso(CP.TODAY) }; st.messages.unshift({ id: `m${Date.now().toString(36)}e`, at: `${CP.iso(CP.TODAY)} ${new Date().toTimeString().slice(0, 5)}`, templateId: 'T01', to: k === 'guardian' ? `${s.guardian.name}(${s.guardian.rel})` : s.name, phone: k === 'guardian' ? s.guardian.phone : s.phone, studentId: s.id, channel: 'kakao', result: 'delivered', placementId: p.id, who: k }); CP.save(); CP.audit('취업(전환) 동의서 발송', `${s.name} · ${k}`); toast('취업(전환) 동의서 링크를 보냈습니다', 'ok'); return render(); }
    if (e.target.id === 'hifiveExport') { const list = pls().filter((p) => CPX.placementState(p) === 'complete'); CPX.xlsx(`HIFIVE_등재용_협약목록_${CP.iso(CP.TODAY)}.xlsx`, [{ name: '협약 목록', rows: [['학번', '성명', '학과', '기업명', '사업자 구분', '실습 직무', '시작일', '종료일', '주 실습시간', '시간당 수당', '협약 체결일', 'HIFIVE 등재'], ...list.map((p) => { const s = CP.student(p.studentId), j = CP.job(p.jobId); return [s.sid, s.name, CP.dept(s.dept).name, j.company, j.approval === 'leading' ? '선도기업' : '참여기업', j.role, j.start, j.end, j.hoursPerWeek, j.wageHour, p.docs.principal.signedAt || '', p.hifive ? 'Y' : 'N']; })] }]); CP.audit('HIFIVE 등재용 엑셀', `${list.length}건`); toast(`체결 완료 ${list.length}건을 HIFIVE 등재용 XLSX로 내려받았습니다`, 'ok'); }
  });
  content.addEventListener('change', (e) => { const h = e.target.closest('[data-hifive]'); if (h) { const p = CP.placement(h.dataset.hifive); p.hifive = h.checked; CP.save(); CP.audit(h.checked ? 'HIFIVE 등재 체크' : 'HIFIVE 등재 해제', p.id); toast(h.checked ? 'HIFIVE 등재로 표시했습니다' : '등재 해제', 'ok'); } });

  function doSend(p, k, re) {
    if (!role.can.send) return ADMIN.deny(role, '발송');
    const lock = CPX.canSend(p, k); if (!lock.ok) return toast(lock.reason, 'warn', 4500);
    const s = CP.student(p.studentId), j = CP.job(p.jobId); const T = st.templates.find((t) => t.id === (re ? 'T02' : 'T01'));
    const toWho = k === 'guardian' ? `${s.guardian.name} (${s.guardian.rel}) ${s.guardian.phone}` : k === 'student' ? `${s.name} 학생 ${s.phone}` : `${j.ceo} (${j.company}) — 기업 담당 ${j.contact} 메일·알림톡`;
    const blocks = CPX.jobIssues(j).filter((x) => x.level === 'block');
    const ready = CPX.readinessOk();
    modal({ title: `${CPX.DOC_LABEL[k]} ${re ? '재발송' : '발송'}`, size: 'md', body: `
      <dl class="kv"><div><dt>받는 사람</dt><dd>${esc(toWho)}</dd></div><div><dt>채널</dt><dd>카카오 알림톡 → 실패 시 SMS 자동 대체 ${ready ? badge('발송 준비 완료', 'ok') : badge('발송 준비 미완', 'danger')}</dd></div><div><dt>유효기간</dt><dd>발송 후 72시간 (${CP.fmt.dt(new Date(Date.now() + 72 * 3600000).toISOString().slice(0, 16))}까지)</dd></div><div><dt>본인 확인</dt><dd>${k === 'agreement' ? '기업 담당 이메일 OTP' : '등록된 휴대폰 번호 OTP 6자리'}</dd></div></dl>
      ${blocks.length ? `<div class="notice notice--danger"><b>발송 불가 — 공고 조건이 운영 기준을 넘습니다</b><ul>${blocks.map((x) => `<li>${esc(x.text)}</li>`).join('')}</ul></div>` : ''}
      <div class="tpl-preview"><span class="tpl-preview__name">${T.name} · ${badge('승인', 'ok')}</span><pre>${esc(CPX.fill(T, s, { '문서명': CPX.DOC_LABEL[k].replace(/\(.+\)/, ''), '받는분': k === 'student' ? s.name : k === 'agreement' ? j.ceo : s.guardian.name }))}</pre><span class="tpl-preview__btn">${T.buttons[0]}</span></div>`,
      actions: [{ label: '취소' }, ...(blocks.length ? [] : [{ label: re ? '재발송' : '발송', kind: 'btn--primary', onClick: (m) => { const ch = CPX.sendDoc(p, k, { resend: re }); CP.audit(re ? '동의서 재발송' : '동의서 발송', `${s.name} · ${CPX.DOC_LABEL[k]}`); m.close(); toast(ch === 'sms' ? '알림톡 실패 → SMS로 대체 발송했습니다 (사유는 발송 이력에)' : '알림톡을 발송했습니다. 「화면 열기」로 받는 사람 화면을 볼 수 있어요', ch === 'sms' ? 'warn' : 'ok', 4200); render(); } }])] });
  }
  function doSeal(list) {
    if (!role.can.seal) return ADMIN.deny(role, '학교장 날인');
    const ok = list.filter((p) => CPX.canSend(p, 'principal').ok && p.docs.principal.status !== 'signed'); if (!ok.length) return toast('날인할 건이 없습니다', 'info');
    modal({ title: `학교장 직인 날인 — ${ok.length}건`, size: 'sm', body: `<p class="t-body">기업 대표 서명까지 끝난 표준협약서에 학교장 직인 이미지를 날인합니다. 결재 대행 기록(${esc(role.person)} · 시각)이 남고 3부 PDF가 확정됩니다.</p><ul class="bullets bullets--tight">${ok.map((p) => `<li>${esc(CP.student(p.studentId).name)} · ${esc(CP.job(p.jobId).company)}</li>`).join('')}</ul><div class="seal-preview" aria-hidden="true"><span>한빛직업<br>고등학교장</span></div>`, actions: [{ label: '취소' }, { label: `${ok.length}건 날인`, kind: 'btn--primary', onClick: (m) => { ok.forEach((p) => { CPX.signDoc(p, 'principal', null, { sealedBy: role.person }); }); CP.audit('학교장 직인 날인(대행)', `${ok.length}건`); m.close(); toast(`${ok.length}건 날인 완료 — 협약 체결. HIFIVE 등재를 체크하세요`, 'ok', 4500); render(); } }] });
  }
  function reopenFlow(p) {
    const s = CP.student(p.studentId), j = CP.job(p.jobId);
    modal({ title: '실습 조건 변경 → 변경 합의서', size: 'sm', body: `<p class="t-body">기간·직무·시간이 바뀌면 기존 협약(v${p.version})은 잠그고 <b>변경 합의서(서식4)</b>를 보호자 → 학생 → 기업 → 학교장 순으로 다시 받습니다. 현장실습운영위원회 심의 후 HIFIVE에 등재합니다.</p><label class="field"><span class="field__label">변경 사유</span><select class="select" id="why"><option>실습 직무가 협약과 달라 조정</option><option>실습 기간 연장(교육청 승인 서식8 별도)</option><option>실습 시간·휴게 조정</option><option>기업 담당자·장소 변경</option></select></label><p class="t-small muted">${esc(s.name)} · ${esc(j.company)}</p>`, actions: [{ label: '취소' }, { label: '변경 합의서 열기', kind: 'btn--primary', onClick: (m) => { const why = $('#why', m.el).value; CPX.reopen(p, why); CP.audit('변경 합의서 재서명 시작', `${s.name} · v${p.version} · ${why}`); m.close(); toast(`v${p.version - 1} 잠금 → 변경 합의서 v${p.version} 체인이 열렸습니다. 보호자부터 다시 발송하세요`, 'ok', 5000); render(); } }] });
  }
  function pdfOf(p, k, quiet) {
    const s = CP.student(p.studentId), j = CP.job(p.jobId), d = p.docs[k], seal = p.docs.principal;
    const title = k === 'agreement' ? '현장실습 표준협약서' : CPX.DOC_LABEL[k];
    const w = window.open('', '_blank'); if (!w) return toast('팝업이 차단되었습니다', 'warn');
    const signer = k === 'agreement' ? `${j.ceo} (${j.company}) / 실습생 ${s.name} / ${CP.SCHOOL.name}장 ${seal.status === 'signed' ? '(날인 ' + CP.fmt.dt(seal.signedTime) + ')' : '(날인 전)'}` : k === 'student' ? `${s.name} (학생 본인)` : `${s.guardian.name} (${d.rel || s.guardian.rel})`;
    const trail = [d.sentAt && ['발송', CP.fmt.date(d.sentAt)], d.viewedAt && ['열람', CP.fmt.date(d.viewedAt)], d.otpAt && ['본인 확인(OTP)', CP.fmt.dt(d.otpAt)], d.signedTime && ['서명', `${CP.fmt.dt(d.signedTime)} · ${d.ip || ''} ${d.ua || ''}`], k === 'agreement' && seal.signedTime && ['학교장 날인', `${CP.fmt.dt(seal.signedTime)} · ${seal.sealedBy || '총괄 관리자'}`]].filter(Boolean);
    w.document.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>${title}_${s.name}</title><style>@page{size:A4;margin:18mm}body{font-family:Pretendard,"Noto Sans KR",sans-serif;color:#111;font-size:11pt;line-height:1.6;margin:0}h1{font-size:18pt;margin:0 0 6mm}h2{font-size:14pt;margin:0 0 4mm}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:2.2mm 3mm;font-size:10pt;text-align:left;vertical-align:top}th{background:#f3f4f6;width:34mm}.sig{display:flex;justify-content:space-between;align-items:flex-end;margin-top:12mm;gap:8mm}.sig img{height:22mm;border-bottom:1px solid #111}.seal{width:22mm;height:22mm;border:2px solid #c0392b;color:#c0392b;border-radius:3mm;display:flex;align-items:center;justify-content:center;font-size:8pt;text-align:center;line-height:1.2;font-weight:700}.meta{font-size:8.5pt;color:#555;margin-top:8mm;border-top:1px solid #ddd;padding-top:3mm}p{font-size:10pt}.page{page-break-before:always}.mono{font-family:ui-monospace,Consolas,monospace}</style></head><body>
      <h1>${title}${p.version > 1 ? ` (변경 합의 v${p.version})` : ''}</h1>
      <table><tr><th>학생</th><td>${s.name} · ${CP.dept(s.dept).name} 3학년 ${s.cls}반 · 학번 ${s.sid}</td></tr><tr><th>기업</th><td>${j.company} · ${j.industry} · ${j.region} · ${j.approval === 'leading' ? '선도기업' : '참여기업'} · 대표 ${j.ceo}</td></tr><tr><th>실습 직무</th><td>${j.role}</td></tr><tr><th>기간 · 시간</th><td>${CP.fmt.date(j.start)}~${CP.fmt.date(j.end)} (${j.weeks}주 · 실습일 ${j.days}일) · 1일 ${j.hoursPerDay}시간 · 주 ${j.hoursPerWeek}시간 · 휴게 ${j.breakMin}분</td></tr><tr><th>현장실습 수당</th><td>시간당 ${CP.fmt.won(j.wageHour)} · 매월 ${j.payDay}일</td></tr><tr><th>보험·안전</th><td>${j.insurance ? '산재보험 가입' : '미확인'} · 입문교육 30% 이상(의무교육 12h) · 기업현장교사 ${j.mentors}명</td></tr>${k === 'agreement' ? '<tr><th>학교 담당</th><td>취업지원부 김도윤 · 담임 박지현 · 월 1회 이상 현장 점검</td></tr>' : ''}</table>
      ${k === 'agreement' ? '<p>제1조(목적) 이 협약은 「직업교육훈련 촉진법」 제7조 및 교육부 표준협약서 고시에 따라 현장실습 운영에 관한 학교·기업·실습생의 권리와 의무를 정한다. 3부를 작성해 기업 대표·실습생·학교장이 서명 후 각 1부씩 보관한다.<br>제2조(실습) 기업은 협약서 직무 범위 안에서 교육 목적의 실습을 실시하고 1일 7시간·주 35시간(서면 동의 시 1일 1시간·주 5시간 연장)을 초과하지 않으며 야간·휴일 실습을 하지 않는다.<br>제3조(수당·보험) 기업은 최저 현장실습 수당 이상을 매월 지급하고 산업재해보상보험에 가입한다.<br>제4조(안전) 기업은 입문교육을 실시하고 유해·위험 작업에 실습생을 투입하지 않는다. 학교는 매월 1회 이상 점검한다.<br>제5조(변경·해지) 변경 시 변경 합의서를 작성하고, 해지는 서면으로 사유를 명시한다. 실습생은 위험·부당 대우 시 실습을 중단할 수 있다.<br>제6조(개인정보) 기업은 실습생 정보를 목적 외 사용하지 않고 종료 30일 내 파기한다.</p>' : '<p>본인은 위 현장실습의 내용·기간·시간·수당·안전 조치를 확인하였으며, 실습 참여와 실습 운영에 필요한 범위의 개인정보 제공에 동의합니다. 실습 중 위험 상황 시 중단할 권리와 철회 절차를 안내받았으며, 이 전자서명을 자필 서명과 같은 효력으로 사용하는 데 동의합니다.</p>'}
      <div class="sig"><div><div>서명: ${signer}</div><div>일시: ${d.signedTime ? CP.fmt.dt(d.signedTime) : CP.fmt.date(d.signedAt)}</div></div>${d.signature ? `<img src="${d.signature}" alt="서명">` : '<div style="font-size:9pt;color:#555">(전자서명 접수)</div>'}${k === 'agreement' && seal.status === 'signed' ? '<div class="seal">한빛직업<br>고등학교장<br>直印</div>' : ''}</div>
      <div class="meta">문서 확인번호 <span class="mono">${d.hash || CPX.hashHex(p.id + k + (d.signedAt || ''))}</span> · 전자서명법 제3조 · 본 문서는 CAREERPASS 데모의 가상 문서입니다.</div>
      <div class="page"><h2>감사추적 (Audit Trail)</h2><table><tr><th>문서</th><td>${title} v${p.version} · 배정 ${p.id}</td></tr><tr><th>확인번호</th><td class="mono">${d.hash || '—'}</td></tr><tr><th>서명자</th><td>${signer}${d.legalGuardian === false ? ' · 법정대리인 확인 필요' : ''}</td></tr>${trail.map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join('')}<tr><th>보관</th><td>변경 불가 저장 · 실습 종료 후 3년 보존 후 파기 · 체인 진행 ${CP.DOC_CHAIN.map((x) => `${CPX.DOC_SHORT[x]} ${CPX.STATUS_LABEL[CPX.effStatus(p.docs[x])]}`).join(' / ')}</td></tr></table></div>
      <script>setTimeout(function(){window.print()},300)<\/script></body></html>`);
    w.document.close(); CP.audit('서명본 PDF 다운로드', `${s.name} · ${title}`); if (!quiet) toast('서명본 PDF를 인쇄 대화상자로 엽니다 — 「PDF로 저장」을 고르세요', 'info');
  }
  UI.reveal();
})();
