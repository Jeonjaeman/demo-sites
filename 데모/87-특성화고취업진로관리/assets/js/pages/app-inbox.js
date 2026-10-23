/* 알림함 — 받은 알림톡/문자(동의서 링크·공고·일정) · 열람 시 교사 측 상태 변경 · 상담 예약 요청 */
(function () {
  'use strict';
  const { $, $$, esc, toast, modal, badge } = UI;
  const { root, s } = APP.mount({ title: '알림' });
  const st = CP.load();
  const pl = CP.placementOf(s.id);
  function render() {
    const msgs = st.messages.filter((m) => m.studentId === s.id && m.who !== 'guardian').sort((a, b) => b.at.localeCompare(a.at));
    root.innerHTML = `
      <section class="sec" data-reveal>
        <div class="sec__head"><h2 class="sec__title">받은 알림 <b>${msgs.length}</b></h2>${msgs.some((m) => m.result === 'delivered') ? `<button class="btn btn--text btn--sm" id="readAll">모두 읽음</button>` : ''}</div>
        <ul class="msgs">${msgs.map((m, i) => { const T = st.templates.find((t) => t.id === m.templateId) || { name: m.templateId, body: '', buttons: [] }; const link = m.templateId === 'T01' || m.templateId === 'T02' ? (pl ? `../sign.html?t=${pl.token}&who=student` : null) : m.templateId === 'T07' || m.templateId === 'T04' ? 'jobs.html' : m.templateId === 'T05' ? 'me.html' : m.templateId === 'T06' && pl ? `../sign.html?t=${pl.token}&who=student` : null; return `<li class="msg ${m.result === 'delivered' ? 'is-unread' : ''}" style="--i:${i}" data-reveal data-id="${m.id}"><div class="msg__head"><span class="msg__ch">${m.channel === 'kakao' ? '카카오 알림톡' : '문자(SMS)'} · 한빛직업고</span><time>${m.at}</time></div><p class="msg__title">${esc(T.name)}</p><pre class="msg__body">${esc(CPX.fill(T, s))}</pre>${link ? `<a class="btn btn--soft btn--block btn--sm" href="${link}" data-open="${m.id}">${T.buttons[0] || '열기'}</a>` : ''}</li>`; }).join('') || '<li class="empty">받은 알림이 없어요</li>'}</ul>
      </section>
      <section class="sec" data-reveal>
        <h2 class="sec__title">선생님께</h2>
        <div class="askgrid"><button class="btn btn--ghost" id="askMeet">상담 예약 요청</button><button class="btn btn--ghost" id="askFix">내 정보 수정 요청</button></div>
        <p class="t-small muted">요청은 담임 선생님 화면의 「오늘 처리할 일」에 올라가요. 긴급한 일은 학교 02-123-4567.</p>
      </section>
      <section class="sec sec--tip" data-reveal>
        <h2 class="sec__title">알림 설정</h2>
        <label class="switch"><input type="checkbox" checked id="pushOn"><span class="switch__track"></span><span>앱 푸시 알림 (홈 화면에 추가하면 켜져요)</span></label>
        <label class="switch"><input type="checkbox" id="optIn" ${s.jobAlertOptIn ? 'checked' : ''}><span class="switch__track"></span><span>채용 공고 알림 신청 (내가 신청해야 와요 · 언제든 해지)</span></label>
        <label class="switch"><input type="checkbox" checked disabled><span class="switch__track"></span><span>동의서·일정 안내 (필수 · 끌 수 없어요)</span></label>
      </section>`;
    UI.reveal(root);
  }
  render();
  root.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]'); if (o) { const m = st.messages.find((x) => x.id === o.dataset.open); if (m && m.result === 'delivered') { m.result = 'read'; CP.save(); } }
    if (e.target.id === 'readAll') { st.messages.forEach((m) => { if (m.studentId === s.id && m.result === 'delivered') m.result = 'read'; }); CP.save(); toast('모두 읽음 처리 — 선생님 화면에서 「열람」으로 바뀌어요', 'ok'); render(); }
    if (e.target.id === 'askMeet') modal({ title: '상담 예약 요청', size: 'sm', body: `<label class="field"><span class="field__label">희망 시간</span><select class="select"><option>점심시간 (12:40~13:20)</option><option>방과 후 (16:30~17:30)</option><option>아무 때나</option></select></label><label class="field"><span class="field__label">상담 내용</span><textarea class="input" rows="3">희망 직무를 바꿀지 고민돼요. 지금 가진 자격증으로 어디까지 되는지 같이 봐 주세요.</textarea></label>`, actions: [{ label: '취소' }, { label: '요청', kind: 'btn--primary', onClick: (m) => { s.memos.unshift({ date: CP.iso(CP.TODAY), by: '학생 요청', text: '상담 예약 요청 — 희망 직무 변경 고민' }); CP.save(); CP.audit('상담 예약 요청', s.name); m.close(); toast('요청했어요 — 선생님이 확인하면 알림이 와요', 'ok'); } }] });
    if (e.target.id === 'askFix') modal({ title: '내 정보 수정 요청', size: 'sm', body: `<p class="t-body">연락처·보호자 정보는 학생이 직접 바꾸지 못하고 선생님 확인을 거쳐요(동의서가 가는 번호라서요).</p><label class="field"><span class="field__label">바꿀 항목</span><select class="select"><option>내 휴대폰 번호</option><option>보호자 연락처</option><option>보호자 성명·관계</option></select></label><label class="field"><span class="field__label">새 값</span><input class="input" placeholder="010-0000-0000"></label>`, actions: [{ label: '취소' }, { label: '요청', kind: 'btn--primary', onClick: (m) => { CP.audit('정보 수정 요청', s.name); m.close(); toast('요청했어요 — 담임 선생님이 확인 후 반영해요', 'ok'); } }] });
    if (e.target.id === 'optIn') { s.jobAlertOptIn = e.target.checked; CP.save(); CP.audit(e.target.checked ? '채용 알림 신청' : '채용 알림 해지', s.name); toast(e.target.checked ? '채용 공고 알림을 신청했어요 — 선생님 발송 대상에 들어가요' : '해지했어요 — 더 이상 채용 공고 알림이 오지 않아요', 'ok'); }
    if (e.target.id === 'pushOn') toast(e.target.checked ? '푸시 알림을 켰어요' : '푸시 알림을 껐어요 — 알림톡은 계속 와요', 'info');
  });
})();
