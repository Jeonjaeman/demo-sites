/* 2-5 맞춤 알림 발송 — 발송 준비 체크(F5) · 조건 기반 대상 추출 · 템플릿(승인 상태·정보성/광고성·신청자 전용 F4) · 개인화 미리보기 · 발송 · 이력(실패 사유·SMS 대체·비용) · 미확인 재발송 */
(function () {
  'use strict';
  const role = UI.requireRole(); if (!role) return;
  const { $, $$, esc, toast, modal, badge } = UI;
  const content = ADMIN.mountShell(role, { actions: `<a class="btn btn--ghost btn--sm" href="settings.html#templates">템플릿·발송 준비 →</a>` });
  const st = CP.load();
  const cond = { dept: '', job: '', noCert: false, docPending: false, proofPending: false, placed: false, notPlaced: false, optIn: false, jobTrack: false };
  let tplId = 'T07', who = 'student', previewIdx = 0, hFilter = 'all', hPage = 1;
  const ready = CPX.readinessOk(); const readiness = st.readiness || [];

  content.innerHTML = `
    ${ready ? '' : `<div class="notice notice--danger">발송 준비가 끝나지 않았습니다 — ${readiness.filter((r) => !r.done && r.k !== 'tpl').map((r) => r.label).join(', ')}. 완료 전까지 실발송이 잠깁니다.</div>`}
    <div class="grid-2 grid-2--wide">
      <section class="panel" data-reveal>
        <header class="panel__head"><h2 class="panel__title">1. 받을 학생 고르기</h2><span class="muted t-small">조건을 누를 때마다 대상 수가 바뀝니다</span></header>
        <div class="filters"><select class="select" id="cDept" aria-label="학과"><option value="">전체 학과</option>${CP.DEPARTMENTS.map((d) => `<option value="${d.id}">${d.name}</option>`).join('')}</select><select class="select" id="cJob" aria-label="희망 직무"><option value="">전체 희망 직무</option>${Object.keys(st.specs).map((j) => `<option>${j}</option>`).join('')}</select></div>
        <div class="filters mt-s" role="group" aria-label="세부 조건">${[['noCert', '필수 자격증 미보유'], ['docPending', '동의서 미제출'], ['proofPending', '증빙 확인 대기'], ['notPlaced', '실습 미배정'], ['placed', '실습 배정·취업'], ['jobTrack', '취업 희망만'], ['optIn', '채용 알림 신청자']].map(([k, l]) => `<button class="chip" data-c="${k}" aria-pressed="false">${l}</button>`).join('')}</div>
        <div class="audience"><div class="audience__num"><b id="aud">0</b><span>명</span></div><div class="audience__chips" id="audChips"></div><div class="seg" aria-label="수신자"><label><input type="radio" name="who" value="student" checked><span>학생에게</span></label><label><input type="radio" name="who" value="guardian"><span>보호자에게</span></label></div></div>
        <details class="mt-s"><summary class="t-small">대상 명단 보기</summary><ul class="namelist" id="names"></ul></details>
      </section>
      <section class="panel" data-reveal>
        <header class="panel__head"><h2 class="panel__title">2. 템플릿 고르기</h2><span class="muted t-small">승인된 템플릿만 알림톡 발송 가능</span></header>
        <div class="tpl-list" id="tpls">${st.templates.map((t) => `<label class="tpl ${t.status !== 'approved' ? 'is-off' : ''}"><input type="radio" name="tpl" value="${t.id}" ${t.id === tplId ? 'checked' : ''} ${t.status !== 'approved' ? 'disabled' : ''}><span class="tpl__name">${esc(t.name)} ${badge(t.kind, t.kind === '광고성' ? 'warn' : 'neutral')} ${badge({ approved: '승인', review: '심사 중', rejected: '반려' }[t.status], { approved: 'ok', review: 'warn', rejected: 'danger' }[t.status])}${t.optInOnly ? badge('신청자 전용', 'info') : ''}</span>${t.reason ? `<span class="tpl__reason">${esc(t.reason)}</span>` : t.note ? `<span class="tpl__reason tpl__reason--ok">${esc(t.note)}</span>` : ''}</label>`).join('')}</div>
      </section>
    </div>
    <section class="panel" data-reveal>
      <header class="panel__head panel__head--wrap"><h2 class="panel__title">3. 개인화 미리보기 · 발송</h2><div class="filters"><button class="btn btn--ghost btn--sm" id="prevPrev" aria-label="이전 학생">◀</button><span class="t-small" id="prevWho"></span><button class="btn btn--ghost btn--sm" id="prevNext" aria-label="다음 학생">▶</button></div></header>
      <div class="preview-row">
        <div class="phone-sim"><div class="phone-sim__bar">카카오톡 · ${CP.SCHOOL.short} 채널</div><div class="phone-sim__bubble" id="bubble"></div></div>
        <div class="send-box"><dl class="kv" id="sendMeta"></dl><div id="sendWarn"></div><div class="filters"><button class="btn btn--primary btn--lg" id="send" ${role.can.send ? '' : 'disabled title="발송 권한 없음"'}>지금 발송</button><button class="btn btn--ghost btn--lg" id="schedule" ${role.can.send ? '' : 'disabled'}>내일 08:30 예약</button><button class="btn btn--text" id="testSend">나에게 테스트 발송</button></div><p class="t-small muted">알림톡 실패(카톡 미가입·72시간 미사용·번호 오류·수신거부)는 자동으로 SMS/LMS로 대체되고 사유가 이력에 남습니다. 광고성은 21~08시 발송 금지, 수신동의자에게만.</p></div>
      </div>
    </section>
    <section class="panel" id="history" data-reveal>
      <header class="panel__head panel__head--wrap"><h2 class="panel__title">발송 이력</h2><div class="filters" role="group" aria-label="이력 필터">${[['all', '전체'], ['kakao', '알림톡'], ['sms-fallback', 'SMS 대체'], ['delivered', '미확인'], ['read', '열람']].map(([k, l], i) => `<button class="chip${i === 0 ? ' is-on' : ''}" data-h="${k}" aria-pressed="${i === 0}">${l} <b data-hc="${k}"></b></button>`).join('')}<button class="btn btn--soft btn--sm" id="resendUnread" ${role.can.send ? '' : 'disabled'}>미확인자 전체 재발송</button></div></header>
      <div class="sumline" id="costLine"></div>
      <div class="table-wrap"><table class="table table--compact"><thead><tr><th>일시</th><th>템플릿</th><th>받는 사람</th><th>번호</th><th>채널</th><th>결과 · 사유</th><th class="actions"></th></tr></thead><tbody id="hBody"></tbody></table></div>
      <footer class="panel__foot" id="hPager"></footer>
    </section>`;

  const tpl = () => st.templates.find((t) => t.id === tplId);
  const list = () => { const c = { ...cond }; if (tpl().optInOnly) c.optIn = true; return CPX.audience(role, c); };
  function updAud() {
    const l = list(); UI.countUp($('#aud'), l.length, { dur: 500 });
    const chips = [cond.dept && CP.dept(cond.dept).name, cond.job, cond.noCert && '필수 자격증 미보유', cond.docPending && '동의서 미제출', cond.proofPending && '증빙 대기', cond.notPlaced && '미배정', cond.placed && '배정·취업', cond.jobTrack && '취업 희망', (cond.optIn || tpl().optInOnly) && '채용 알림 신청자'].filter(Boolean);
    $('#audChips').innerHTML = chips.length ? chips.map((c) => `<span class="badge badge--info">${esc(c)}</span>`).join('') : '<span class="muted t-small">조건 없음 — 보이는 범위 전체</span>';
    $('#names').innerHTML = l.slice(0, 60).map((s) => `<li>${esc(s.name)} <span class="muted">${CP.dept(s.dept).short} 3-${s.cls}</span></li>`).join('') + (l.length > 60 ? `<li class="muted">외 ${l.length - 60}명</li>` : '');
    previewIdx = 0; updPreview();
  }
  function updPreview() {
    const l = list(); const t = tpl(); const s = l[previewIdx];
    if (!s) { $('#bubble').innerHTML = '<p class="muted">대상이 없습니다</p>'; $('#prevWho').textContent = '0 / 0'; $('#sendMeta').innerHTML = ''; $('#send').disabled = true; return; }
    $('#prevWho').textContent = `${previewIdx + 1} / ${l.length} · ${who === 'guardian' ? s.guardian.name + '(' + s.guardian.rel + ')' : s.name}`;
    $('#bubble').innerHTML = `<pre>${esc(CPX.fill(t, s, { '받는분': who === 'guardian' ? s.guardian.name : s.name }))}</pre>${t.buttons.map((b) => `<span class="phone-sim__btn">${b}</span>`).join('')}`;
    const win = CPX.sendWindow(t);
    $('#sendMeta').innerHTML = `<div><dt>대상</dt><dd>${l.length}명 · ${who === 'guardian' ? '보호자' : '학생'} 번호${t.optInOnly ? ' · 신청자만 자동 필터' : ''}</dd></div><div><dt>템플릿</dt><dd>${esc(t.name)} (${t.id}) · ${t.kind}</dd></div><div><dt>예상 비용</dt><dd>알림톡 ${l.length}건 × 13원 = ${(l.length * 13).toLocaleString()}원 · 실패분 LMS 전환 시 건당 45원 추가</dd></div><div><dt>발송 가능</dt><dd>${win.ok && ready ? badge('가능', 'ok') + (win.night ? ' · 야간 — 예약 권장' : '') : badge('불가', 'danger')}</dd></div>`;
    $('#sendWarn').innerHTML = win.ok ? '' : `<p class="notice notice--danger">${win.reason}</p>`;
    $('#send').disabled = !role.can.send || !win.ok || !l.length || !ready;
  }
  function updHistory() {
    const ids = new Set(CP.scopedStudents(role).map((s) => s.id));
    const all = st.messages.filter((m) => !m.studentId || ids.has(m.studentId));
    ['all', 'kakao', 'sms-fallback', 'delivered', 'read'].forEach((k) => { const el = $(`[data-hc="${k}"]`); if (el) el.textContent = k === 'all' ? all.length : all.filter((m) => (k === 'kakao' ? m.channel === 'kakao' : m.result === k)).length; });
    const kakao = all.filter((m) => m.channel === 'kakao').length, sms = all.filter((m) => m.channel === 'sms').length; const reasons = {}; all.filter((m) => m.failReason).forEach((m) => { reasons[m.failReason] = (reasons[m.failReason] || 0) + 1; });
    $('#costLine').innerHTML = `이번 달 알림톡 ${kakao}건 × 13원 + SMS/LMS 대체 ${sms}건 × 45원 = <b>${(kakao * 13 + sms * 45).toLocaleString()}원</b> (VAT 별도) · 실패 사유: ${Object.entries(reasons).map(([k, v]) => `${CPX.FAIL_LABEL[k] || k} ${v}`).join(' · ') || '없음'}`;
    const l = all.filter((m) => hFilter === 'all' || (hFilter === 'kakao' ? m.channel === 'kakao' : m.result === hFilter));
    const pg = ADMIN.paginate(l, hPage, 15);
    $('#hBody').innerHTML = pg.items.map((m) => { const t = st.templates.find((x) => x.id === m.templateId) || { name: m.templateId }; return `<tr><td class="mono t-small">${m.at}</td><td>${esc(t.name)}</td><td>${esc(m.to)}</td><td class="mono t-small">${CP.fmt.phoneMask(m.phone)}</td><td>${m.channel === 'kakao' ? badge('알림톡', 'info') : badge('SMS 대체', 'warn')}</td><td>${{ delivered: badge('전달 · 미열람', 'neutral'), read: badge('열람', 'ok'), 'sms-fallback': badge(`알림톡 실패 → SMS`, 'warn') + (m.failReason ? ` <span class="t-small muted">${CPX.FAIL_LABEL[m.failReason] || ''}</span>` : ''), failed: badge('실패', 'danger') }[m.result]}</td><td class="actions">${m.result === 'delivered' && role.can.send ? `<button class="btn btn--ghost btn--sm" data-re="${m.id}">재발송</button>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="7" class="empty">이력이 없습니다</td></tr>';
    $('#hPager').innerHTML = ADMIN.pagerHtml(pg);
  }
  updAud(); updHistory();

  $('#cDept').addEventListener('change', (e) => { cond.dept = e.target.value; updAud(); });
  $('#cJob').addEventListener('change', (e) => { cond.job = e.target.value; updAud(); });
  $$('[data-c]').forEach((c) => c.addEventListener('click', () => { const k = c.dataset.c; cond[k] = !cond[k]; if (k === 'placed' && cond.placed) cond.notPlaced = false; if (k === 'notPlaced' && cond.notPlaced) cond.placed = false; $$('[data-c]').forEach((x) => { x.classList.toggle('is-on', cond[x.dataset.c]); x.setAttribute('aria-pressed', cond[x.dataset.c]); }); updAud(); }));
  $$('input[name=who]').forEach((r) => r.addEventListener('change', () => { who = r.value; updPreview(); }));
  $('#tpls').addEventListener('change', (e) => { tplId = e.target.value; const t = tpl(); if (t.optInOnly) toast('신청자 전용 템플릿 — 「채용 알림 신청」 학생만 자동으로 대상이 됩니다', 'info'); updAud(); });
  $('#prevPrev').addEventListener('click', () => { previewIdx = Math.max(0, previewIdx - 1); updPreview(); });
  $('#prevNext').addEventListener('click', () => { previewIdx = Math.min(list().length - 1, previewIdx + 1); updPreview(); });
  $('#send').addEventListener('click', () => { const l = list(); const t = tpl(); if (!role.can.send) return ADMIN.deny(role, '발송'); modal({ title: '발송 확인', size: 'sm', body: `<p class="t-body"><b>${l.length}명</b>에게 「${esc(t.name)}」을 ${who === 'guardian' ? '보호자' : '학생'} 번호로 보냅니다. 개인화 변수는 학생마다 치환됩니다.</p>`, actions: [{ label: '취소' }, { label: '발송', kind: 'btn--primary', onClick: (m) => { const r = CPX.sendCampaign(role, t, l, who); m.close(); toast(`발송 완료 — 알림톡 ${r.ok}건${r.sms ? ` · 실패 ${r.sms}건 SMS 대체(${Object.entries(r.reasons).map(([k, v]) => `${CPX.FAIL_LABEL[k]} ${v}`).join(', ')})` : ''} · 약 ${r.cost.toLocaleString()}원`, 'ok', 5500); hFilter = 'all'; hPage = 1; updHistory(); $('#history').scrollIntoView({ behavior: 'smooth' }); } }] }); });
  $('#schedule').addEventListener('click', () => { const l = list(); CP.audit('예약 발송', `${tpl().name} · ${l.length}명 · 내일 08:30`); toast(`내일 08:30 예약 — ${l.length}명 (예약 목록은 운영 화면에서 취소 가능)`, 'ok'); });
  $('#testSend').addEventListener('click', () => { CP.audit('테스트 발송', `${tpl().name} → ${role.person}`); toast(`${role.person} 번호로 테스트 1건을 보냈습니다`, 'ok'); });
  $$('[data-h]').forEach((c) => c.addEventListener('click', () => { hFilter = c.dataset.h; hPage = 1; $$('[data-h]').forEach((x) => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-pressed', x === c); }); updHistory(); }));
  $('#hPager').addEventListener('click', (e) => { const b = e.target.closest('[data-page]'); if (b) { hPage = Number(b.dataset.page); updHistory(); } });
  $('#hBody').addEventListener('click', (e) => { const b = e.target.closest('[data-re]'); if (!b) return; const m = st.messages.find((x) => x.id === b.dataset.re); st.messages.unshift({ ...m, id: `m${Date.now().toString(36)}`, at: `${CP.iso(CP.TODAY)} ${new Date().toTimeString().slice(0, 5)}`, result: 'delivered', resendOf: m.id }); m.result = 'read'; CP.save(); CP.audit('재발송', m.to); toast(`${m.to}에게 재발송했습니다`, 'ok'); updHistory(); });
  $('#resendUnread').addEventListener('click', () => { const ids = new Set(CP.scopedStudents(role).map((s) => s.id)); const un = st.messages.filter((m) => m.result === 'delivered' && (!m.studentId || ids.has(m.studentId))); if (!un.length) return toast('미확인 건이 없습니다', 'info'); un.forEach((m) => { st.messages.unshift({ ...m, id: `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, at: `${CP.iso(CP.TODAY)} ${new Date().toTimeString().slice(0, 5)}`, result: 'delivered', resendOf: m.id }); m.result = 'read'; }); CP.save(); CP.audit('미확인 전체 재발송', `${un.length}건`); toast(`미확인 ${un.length}건 재발송`, 'ok'); updHistory(); });
  if (location.hash === '#history') setTimeout(() => $('#history').scrollIntoView(), 200);
  UI.reveal();
})();
