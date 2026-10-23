/* 서명 페이지 — 로그인 없음 · 1회용 토큰 링크(72시간) · 5단계
   ① 랜딩(문서 요약·학교 신원·마감) → ② 본인 확인(등록 번호 OTP 6자리) → ③ 내용 확인·필수 동의(전자서명 약정 포함) → ④ 관계 선택 + 서명 → ⑤ 완료(확인번호·사본 알림·PDF)
   URL: sign.html?t=<token>&who=guardian|student|agreement|empGuardian|empStudent  (기본 guardian)
   근거: F2 서명 순서 잠금 · F3 OTP·약정·감사추적 · F17 취업(전환) 동의서 · F18 보호자≠법정대리인 */
(function () {
  'use strict';
  const { $, $$, esc, toast, modal, signaturePad } = UI;
  const q = new URLSearchParams(location.search);
  const token = q.get('t') || '';
  const who = ['guardian', 'student', 'agreement', 'empGuardian', 'empStudent'].includes(q.get('who')) ? q.get('who') : 'guardian';
  const view = $('#view'), steps = $('#steps');
  const p = CP.placementByToken(token) || (token === 'sample' ? sampleToken() : null);
  function sampleToken() { const st = CP.load(); return st.placements.find((x) => ['sent', 'viewed'].includes(x.docs.guardian.status) && !CPX.docExpired(x.docs.guardian)) || st.placements.find((x) => x.docs.guardian.status !== 'signed') || st.placements[0]; }

  const setStep = (n) => { $$('li', steps).forEach((li) => { const k = Number(li.dataset.step); li.classList.toggle('is-current', k === n); li.classList.toggle('is-done', k < n); }); window.scrollTo(0, 0); };
  if (!p) { steps.hidden = true; return render(stateCard('🔗', '링크를 찾을 수 없어요', '주소가 잘못되었거나 이미 처리된 링크입니다. 학교 취업지원부로 문의해 주세요.', [{ label: '데모 입구로', href: 'index.html' }])); }

  const s = CP.student(p.studentId), j = CP.job(p.jobId);
  const isEmp = who.startsWith('emp'); const base = isEmp ? (p.employment = p.employment || { guardian: { status: 'sent', sentAt: CP.iso(CP.TODAY) }, student: { status: 'sent', sentAt: CP.iso(CP.TODAY) } }) : p.docs;
  const key = isEmp ? (who === 'empGuardian' ? 'guardian' : 'student') : who;
  const d = base[key];
  const signer = key === 'guardian' ? { name: s.guardian.name, rel: s.guardian.rel, phone: s.guardian.phone, label: '보호자(법정대리인)' } : key === 'student' ? { name: s.name, rel: '본인', phone: s.phone, label: '학생' } : { name: j.ceo, rel: '기업 대표', phone: '02-555-0100', label: '기업 대표(현장실습기관)' };
  const docTitle = isEmp ? (key === 'guardian' ? '취업(전환) 동의서 — 보호자' : '취업(전환) 동의서 — 학생') : { guardian: '현장실습 보호자 사전동의서', student: '현장실습 학생 사전동의서', agreement: '현장실습 표준협약서 (기업 대표 서명)' }[key];
  const expireAt = CPX.expiresAt(d);
  const expStr = expireAt ? CP.fmt.dt(expireAt.toISOString().slice(0, 16)) : '';

  // 열람 기록
  if (d.status === 'sent') { d.status = 'viewed'; d.viewedAt = CP.iso(CP.TODAY); p.visits.push({ at: new Date().toISOString(), who }); CP.save(); }

  if (!isEmp && key !== 'guardian') { const lock = CPX.canSend(p, key); if (!lock.ok && d.status !== 'signed') { steps.hidden = true; return render(stateCard('🔒', '아직 서명 차례가 아니에요', `${lock.reason}. 앞 단계가 끝나면 알림톡으로 다시 안내드립니다.`, [{ label: '교사 화면에서 상태 보기', href: 'admin/consents.html?p=' + p.id, ghost: true }])); } }
  if (d.status === 'signed') { steps.hidden = true; return render(doneCard(true)); }
  if (d.status === 'declined') { steps.hidden = true; return render(stateCard('✋', '동의하지 않음으로 제출되었습니다', `${CP.fmt.date(d.declinedAt)}에 "${esc(d.reason || '사유 미입력')}" 사유로 제출되었습니다. 생각이 바뀌셨다면 학교로 연락해 주세요. 담당 교사가 확인 후 새 링크를 보내 드립니다.`, [{ label: `학교에 전화 (${CP.SCHOOL.phone})`, href: 'tel:' + CP.SCHOOL.phone.replace(/-/g, '') }])); }
  if (CPX.effStatus(d) === 'expired') { steps.hidden = true; return render(stateCard('⏱', '서명 기한(72시간)이 지났어요', `이 링크는 ${expStr}까지만 열 수 있었습니다. 안전을 위해 링크는 발송 후 72시간이 지나면 닫힙니다. 아래 버튼을 누르면 선생님께 재발송 요청이 가고, 새 링크가 알림톡으로 옵니다.`, [{ label: '선생님께 새 링크 요청', onClick: () => { CPX.sendDoc(p, key, { resend: true }); CP.audit('링크 재발송 요청(수신자)', `${s.name} · ${docTitle}`); toast('새 링크를 보냈습니다. 데모에서는 바로 다시 열립니다', 'ok'); setTimeout(() => location.replace(`sign.html?t=${p.token}&who=${who}`), 900); } }, { label: '학교에 전화', href: 'tel:' + CP.SCHOOL.phone.replace(/-/g, ''), ghost: true }])); }
  if (d.status === 'none') { steps.hidden = true; return render(stateCard('📨', '아직 발송 전인 문서예요', '교사가 발송하면 알림톡으로 링크가 갑니다. 교사 화면에서 「발송」을 눌러 보세요.', [{ label: '교사 화면으로', href: 'admin/consents.html?p=' + p.id }])); }

  /* ───── ① 랜딩 ───── */
  function step0() {
    setStep(1);
    render(`
      <p class="sign-from"><span class="sign-from__mark" aria-hidden="true"></span><span><b>${CP.SCHOOL.name} ${CP.SCHOOL.dept}</b>에서 보낸 공식 요청입니다<br><span class="muted">담당 김도윤 교사 · ${CP.SCHOOL.phone} · 발송 ${CP.fmt.date(d.sentAt)}</span></span></p>
      <h1 class="sign-h1">${esc(s.name)} 학생의<br>${docTitle}</h1>
      <div class="card summary summary--compact">
        <dl class="summary__grid">
          <div><dt>${isEmp ? '채용 기업' : '실습 기업'}</dt><dd>${esc(j.company)} <span class="muted">(${esc(j.region)})</span></dd></div>
          <div><dt>직무</dt><dd>${esc(j.role)}</dd></div>
          <div><dt>${isEmp ? '전환 예정' : '기간'}</dt><dd>${isEmp ? '실습 종료 후 · 취업전환 가능일 이후' : `${CP.fmt.date(j.start)} ~ ${CP.fmt.date(j.end)} (${j.weeks}주)`}</dd></div>
          <div><dt>${isEmp ? '근로 조건' : '실습 시간 · 수당'}</dt><dd>${isEmp ? '근로계약서 별도 · 만 18세 미만은 친권자 동의서 비치' : `1일 ${j.hoursPerDay}시간 · 주 ${j.hoursPerWeek}시간 · 시간당 ${CP.fmt.won(j.wageHour)}`}</dd></div>
        </dl>
      </div>
      <p class="sign-lead">서명은 <b>본인 확인 → 내용 확인 → 손가락 서명</b> 순서로 3분이면 끝나요.<br>서명 마감 <b>${expStr}</b> (발송 후 72시간)</p>
      <div class="sign-actions"><button id="go" class="btn btn--primary btn--xl btn--block">본인 확인하고 시작하기</button></div>
      <p class="sign-note">이 링크는 ${esc(CP.fmt.nameMask(signer.name))} ${signer.label}님에게만 발송된 1회용 링크입니다. 본인이 아니시면 열지 말고 학교로 알려 주세요. 링크를 열어도 서명은 본인 확인을 거쳐야 가능합니다.</p>`);
    $('#go').addEventListener('click', step1);
  }

  /* ───── ② 본인 확인 — 학교에 등록된 번호로 OTP 6자리 (F3 ①) ───── */
  let tries = 0, otp = String(100000 + Math.floor(Math.random() * 899999)), timer = null;
  function step1() {
    setStep(2);
    const masked = CP.fmt.phoneMask(signer.phone);
    render(`
      <h1 class="sign-h1">본인 확인</h1>
      <p class="sign-lead">학교에 등록된 ${signer.label} 번호 <b>${masked}</b>로 인증번호 6자리를 보냈어요.<br>이 번호로만 서명할 수 있어요 — 학생이 대신 서명할 수 없게 하기 위해서예요.</p>
      <div class="card">
        <label class="field"><span class="field__label">인증번호 6자리 <span id="otpTimer" class="field__timer">03:00</span></span>
          <input id="otp" class="input input--big" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" placeholder="000000" value="${otp}" aria-describedby="otpHelp">
          <span id="otpHelp" class="field__help">데모라서 인증번호를 미리 채워 두었어요 (실제로는 문자로 받습니다). 지우고 틀리게 넣어 보셔도 돼요 — 5회 실패하면 잠겨요.</span></label>
        <div class="otp-tools"><button id="resendOtp" class="btn btn--text btn--sm">인증번호 다시 받기</button><button id="noOtp" class="btn btn--text btn--sm">인증문자가 안 와요</button></div>
        <button id="verify" class="btn btn--primary btn--xl btn--block">확인</button>
      </div>`);
    let left = 180; const tEl = $('#otpTimer'); clearInterval(timer); timer = setInterval(() => { left--; tEl.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`; if (left <= 0) { clearInterval(timer); tEl.textContent = '만료'; $('#verify').disabled = true; toast('인증번호가 만료됐어요. 다시 받기를 눌러 주세요', 'warn'); } }, 1000);
    const input = $('#otp');
    const go = () => {
      const v = input.value.trim();
      if (v.length !== 6) { input.focus(); input.classList.add('is-error'); toast('6자리를 입력해 주세요', 'warn'); return; }
      if (v !== otp) { tries++; input.classList.add('is-error'); input.select(); if (tries >= 5) { clearInterval(timer); steps.hidden = true; d.locked = true; CP.save(); CP.audit('본인 확인 5회 실패 — 링크 잠금', `${s.name} · ${docTitle}`); return render(stateCard('🔒', '확인에 5회 실패해 잠겼어요', '안전을 위해 이 링크를 잠갔고 담당 교사에게 알림이 갔습니다. 학교에 연락하면 본인 확인 후 새 링크를 보내 드립니다.', [{ label: `학교에 전화 (${CP.SCHOOL.phone})`, href: 'tel:' + CP.SCHOOL.phone.replace(/-/g, '') }])); } toast(`번호가 맞지 않아요 (${tries}/5)`, 'danger'); return; }
      clearInterval(timer); d.otpAt = new Date().toISOString(); d.otpPhone = masked; CP.save(); CP.audit('본인 확인(OTP) 성공', `${docTitle} · ${signer.label} ${CP.fmt.nameMask(signer.name)}`);
      input.classList.add('is-ok'); $('#otpHelp').innerHTML = '<span class="t-ok">본인 확인이 완료되었어요</span>'; setTimeout(step2, 450);
    };
    $('#verify').addEventListener('click', go);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    input.addEventListener('input', () => input.classList.remove('is-error'));
    $('#resendOtp').addEventListener('click', () => { otp = String(100000 + Math.floor(Math.random() * 899999)); input.value = otp; left = 180; $('#verify').disabled = false; toast(`인증번호를 다시 보냈어요 (데모: ${otp})`, 'ok'); });
    $('#noOtp').addEventListener('click', () => modal({ title: '인증문자가 안 올 때', size: 'sm', body: `<ul class="bullets"><li>등록된 번호가 바뀌었다면 이 화면에서 번호를 바꿀 수 없어요(대리 서명 방지). <b>담임 선생님께 변경 요청</b>을 누르면 선생님이 확인 후 새 링크를 보내 드려요.</li><li>스팸함·차단 번호를 확인해 주세요. 발신번호는 ${CP.SCHOOL.phone}입니다.</li><li>카카오톡을 쓰지 않아도 문자(SMS)로 받을 수 있어요.</li></ul>`, actions: [{ label: '닫기' }, { label: '담임께 번호 변경 요청', kind: 'btn--primary', onClick: (m) => { CP.audit('보호자 번호 변경 요청(링크)', s.name); m.close(); toast('담임 선생님께 요청을 보냈어요', 'ok'); } }] }));
  }

  /* ───── ③ 내용 확인 + 필수 동의 ───── */
  function step2() {
    setStep(3);
    const issues = CPX.jobIssues(j).filter((x) => x.level === 'block');
    const over = j.hoursPerDay > CP.RULES.hoursPerDayMax || j.hoursPerWeek > CP.RULES.hoursPerWeekMax;
    const agreeItems = isEmp
      ? [`${esc(s.name)} 학생의 ${esc(j.company)} 취업(전환)에 동의합니다. <b>(필수)</b>`, `만 18세 미만인 경우 근로기준법 제66조에 따라 친권자(후견인) 동의서와 가족관계증명서를 기업에 제출해야 함을 안내받았습니다. <b>(필수)</b>`, `이 전자서명을 자필 서명과 같은 효력으로 사용하는 데 동의합니다(전자서명법 제3조). <b>(필수)</b>`]
      : key === 'agreement'
        ? [`위 표준협약서의 실습 조건(기간·시간·수당·안전·보험)대로 현장실습을 운영하겠습니다. <b>(필수)</b>`, `학생 정보를 실습 운영 외 목적으로 쓰지 않고 종료 30일 내 파기하겠습니다. <b>(필수)</b>`, `이 전자서명을 기명날인과 같은 효력으로 사용하는 데 동의합니다(전자서명법 제3조). <b>(필수)</b>`]
        : [`위 현장실습에 ${key === 'guardian' ? '자녀가' : '제가'} 참여하는 것에 동의합니다. <b>(필수)</b>`, `실습 운영에 필요한 범위에서 학생 정보(성명·학과·연락처)를 실습 기업에 제공하는 것에 동의합니다. <b>(필수)</b>`, `실습 중 위험·부당한 대우 시 학생이 실습을 중단하고 학교에 알릴 권리가 있음을 안내받았습니다. <b>(필수)</b>`, `이 전자서명을 자필 서명과 같은 효력으로 사용하는 데 동의합니다(전자서명법 제3조). <b>(필수)</b>`];
    render(`
      <h1 class="sign-h1">무엇에 동의하는지<br>먼저 요약해 드릴게요</h1>
      <p class="sign-lead">아래 카드만 읽어도 핵심은 다 담겨 있어요. 전문은 그 아래에 있고, 끝까지 내려야 다음으로 갈 수 있어요.</p>
      <div class="card summary">
        <dl class="summary__grid">
          <div><dt>학생</dt><dd>${esc(s.name)} · ${esc(CP.dept(s.dept).name)} 3학년 ${s.cls}반${CP.age(s.birth) < 18 ? ' · <span class="badge badge--info">만 18세 미만</span>' : ''}</dd></div>
          <div><dt>${isEmp ? '채용 기업' : '실습 기업'}</dt><dd>${esc(j.company)} <span class="muted">(${esc(j.industry)} · ${esc(j.region)})</span> · ${j.approval === 'leading' ? '선도기업' : '참여기업'}</dd></div>
          <div><dt>직무</dt><dd>${esc(j.role)}</dd></div>
          ${isEmp ? '' : `<div><dt>기간</dt><dd>${CP.fmt.date(j.start)} ~ ${CP.fmt.date(j.end)} (${j.weeks}주 · 실습일 ${j.days}일)</dd></div>
          <div><dt>실습 시간</dt><dd>1일 ${j.hoursPerDay}시간 · 주 ${j.hoursPerWeek}시간 · 휴게 ${j.breakMin}분 ${over ? '<span class="badge badge--danger">기준 초과 — 학교 확인 필요</span>' : '<span class="badge badge--ok">1일 7시간·주 35시간 이내 · 야간·휴일 없음</span>'}</dd></div>
          <div><dt>현장실습 수당</dt><dd>시간당 ${CP.fmt.won(j.wageHour)} (월 약 ${CP.fmt.won(CPX.monthlyAllowance(j))}) · 매월 ${j.payDay}일 지급</dd></div>
          <div><dt>안전·보험</dt><dd>${j.insurance ? '산재보험 가입' : '<span class="badge badge--danger">산재보험 미확인</span>'} · 사전 안전교육 · 기업현장교사 ${j.mentors}명</dd></div>
          <div><dt>학교 담당</dt><dd>취업지원부 김도윤 교사 · 담임 박지현 교사 — 월 1회 이상 현장 점검, 결과 보호자 안내</dd></div>`}
        </dl>
        ${issues.length ? `<p class="notice notice--danger t-small">학교 확인이 필요한 조건이 있어요: ${issues.map((x) => esc(x.text)).join(' / ')}. 이 상태로 서명하지 않으셔도 됩니다 — 「동의하지 않습니다」로 사유를 남기면 학교가 연락드려요.</p>` : ''}
      </div>
      <div class="card doc">
        <div class="doc__head"><h2 class="doc__title">${docTitle} 전문</h2><span id="readpct" class="doc__pct">0%</span></div>
        <div class="doc__progress" aria-hidden="true"><i id="readbar"></i></div>
        <div id="doctext" class="doc__text" tabindex="0" aria-label="문서 전문. 끝까지 스크롤해 주세요">${docBody()}</div>
      </div>
      <div class="card checks">
        ${agreeItems.map((t, i) => `<label class="check"><input type="checkbox" class="agree" data-k="${i}"><span>${t}</span></label>`).join('')}
        ${key === 'guardian' ? `<label class="check"><input type="checkbox" id="agree-sms" checked><span>실습 일정·현장 점검 결과를 알림톡/문자로 받는 것에 동의합니다. (선택)</span></label>` : ''}
      </div>
      <div class="sign-actions">
        <button id="toSign" class="btn btn--primary btn--xl btn--block" disabled>전문을 끝까지 내려 주세요</button>
        <button id="decline" class="btn btn--text">동의하지 않습니다</button>
      </div>`);
    const dt = $('#doctext'); let readDone = false;
    const upd = () => { const max = dt.scrollHeight - dt.clientHeight; const pct = max <= 2 ? 100 : Math.min(100, Math.round(dt.scrollTop / max * 100)); $('#readpct').textContent = pct + '%'; $('#readbar').style.transform = `scaleX(${pct / 100})`; if (pct >= 98) readDone = true; gate(); };
    const gate = () => { const all = $$('.agree').every((c) => c.checked); const b = $('#toSign'); b.disabled = !(readDone && all); b.textContent = !readDone ? '전문을 끝까지 내려 주세요' : !all ? `필수 항목 ${$$('.agree').length}개에 체크해 주세요` : '서명하러 가기'; };
    dt.addEventListener('scroll', upd); upd();
    $$('.agree').forEach((c) => c.addEventListener('change', gate));
    $('#toSign').addEventListener('click', () => { const sms = $('#agree-sms'); d.smsOptIn = sms ? sms.checked : undefined; d.agreedAt = new Date().toISOString(); CP.save(); step3(); });
    $('#decline').addEventListener('click', declineFlow);
  }
  function declineFlow() {
    modal({ title: '동의하지 않음으로 제출', size: 'sm', body: `<p class="t-body">제출하면 학교에 바로 알림이 가고, 담당 교사가 연락드려요. 불이익은 없습니다. 사유를 골라 주세요.</p><div class="radio-list">${['실습 기업·직무가 희망과 다름', '실습 기간·시간이 맞지 않음', '건강·가정 사정', '내용을 더 상담하고 싶음', '기타'].map((r, i) => `<label class="radio"><input type="radio" name="why" value="${r}" ${i === 3 ? 'checked' : ''}><span>${r}</span></label>`).join('')}</div>`, actions: [{ label: '돌아가기' }, { label: '제출', kind: 'btn--danger', onClick: (mm) => { const r = $('input[name=why]:checked', mm.el).value; d.status = 'declined'; d.reason = r; d.declinedAt = CP.iso(CP.TODAY); CP.save(); CP.audit('동의 거부', `${s.name} · ${docTitle} · ${r}`); mm.close(); steps.hidden = true; render(stateCard('✋', '제출되었습니다', `"${esc(r)}" 사유로 학교에 전달했어요. 담당 교사가 오늘 중 연락드립니다. 생각이 바뀌면 새 링크로 다시 서명할 수 있어요.`, [{ label: '교사 화면에서 확인(데모)', href: 'admin/consents.html?p=' + p.id }])); } }] });
  }

  /* ───── ④ 관계 선택 + 서명 ───── */
  function step3() {
    setStep(4);
    const relOpts = key === 'guardian' ? ['부', '모', '법정후견인', '조부모(기타 보호자)', '기타 보호자'] : null;
    render(`
      <h1 class="sign-h1">손가락으로<br>서명해 주세요</h1>
      <p class="sign-lead">서명자 <b>${esc(signer.name)}</b> · ${CP.fmt.date(CP.iso(CP.TODAY))}<br>서명은 문서에 그대로 들어가고, 본인 확인 시각·서명 시각·접속 정보가 함께 기록돼요.</p>
      ${relOpts ? `<div class="card"><label class="field"><span class="field__label">학생과의 관계</span><select id="rel" class="select select--lg">${relOpts.map((r) => `<option ${r.startsWith(s.guardian.rel) ? 'selected' : ''}>${r}</option>`).join('')}</select><span class="field__help" id="relHelp"></span></label></div>` : ''}
      <div class="card pad-card">
        <div class="pad-wrap"><canvas id="pad" class="pad" aria-label="서명 패드. 손가락이나 마우스로 서명하세요"></canvas><span class="pad__hint" id="padhint">여기에 이름을 써 주세요</span><span class="pad__line" aria-hidden="true"></span></div>
        <div class="pad-tools"><button id="clear" class="btn btn--ghost btn--sm">다시 쓰기</button><span class="muted t-small">가로로 돌리면 더 넓게 쓸 수 있어요</span></div>
      </div>
      <p class="sign-legal">「서명 제출하기」를 누르면 위 서명이 ${esc(signer.name)}님의 전자서명으로 ${docTitle}에 첨부됩니다. 문서 확인번호·서명 시각·접속 정보가 함께 보관되며, 사본이 알림톡으로 전송됩니다.</p>
      <div class="sign-actions">
        <button id="submit" class="btn btn--primary btn--xl btn--block" disabled>서명을 하면 제출할 수 있어요</button>
        <button id="back2" class="btn btn--text">내용 다시 보기</button>
      </div>`);
    const pad = signaturePad($('#pad'), { onChange: (has) => { $('#padhint').style.opacity = has ? 0 : 1; const b = $('#submit'); b.disabled = !has; b.textContent = has ? '서명 제출하기' : '서명을 하면 제출할 수 있어요'; } });
    $('#clear').addEventListener('click', () => pad.clear());
    $('#back2').addEventListener('click', step2);
    const relEl = $('#rel'); const relCheck = () => { if (!relEl) return; const v = relEl.value; const legal = /^(부|모|법정후견인)/.test(v); $('#relHelp').innerHTML = legal ? '법정대리인(친권자·후견인)으로 기록됩니다' : '<span class="t-warn">기타 보호자는 법정대리인이 아닐 수 있어 담임이 확인 요청을 받습니다(민법 §5 · 교육기본법상 보호자와 구분)</span>'; }; if (relEl) { relEl.addEventListener('change', relCheck); relCheck(); }
    $('#submit').addEventListener('click', () => {
      if (pad.isEmpty()) return;
      const b = $('#submit'); b.disabled = true; b.textContent = '제출하는 중…';
      const rel = relEl ? relEl.value : signer.rel; const legal = relEl ? /^(부|모|법정후견인)/.test(rel) : true;
      setTimeout(() => { CPX.signDoc(p, key, pad.dataURL(), { rel, legalGuardian: legal, signerName: signer.name }); if (isEmp) { p.employment[key] = d; CP.save(); } CP.audit('전자서명 완료', `${s.name} · ${docTitle} · ${signer.label}${legal ? '' : ' · 법정대리인 확인 필요'}`); step4(); }, 700);
    });
  }

  /* ───── ⑤ 완료 ───── */
  function step4() { setStep(5); render(doneCard(false)); burst(); }
  function doneCard(already) {
    const dd = base[key];
    setTimeout(() => { const n = $('#sig-img'); if (n && dd.signature) n.src = dd.signature; }, 30);
    const chain = isEmp ? ['guardian', 'student'].map((k) => `<li><span>${k === 'guardian' ? '보호자' : '학생'} 취업(전환) 동의</span>${UI.badge(CPX.STATUS_LABEL[CPX.effStatus(base[k])], UI.DOC_KIND[CPX.effStatus(base[k])])}</li>`).join('') : CP.DOC_CHAIN.map((k) => `<li class="${k === key ? 'is-me' : ''}"><span>${CPX.DOC_SHORT[k]}</span>${UI.badge(CPX.STATUS_LABEL[CPX.effStatus(p.docs[k])], UI.DOC_KIND[CPX.effStatus(p.docs[k])])}</li>`).join('');
    const next = isEmp ? null : CPX.nextStep(p);
    return `
      <div class="done" data-reveal>
        <div class="done__check" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l8 8 15-16"/></svg></div>
        <h1 class="sign-h1 center">${already ? '이미 서명이 완료된 문서예요' : '서명이 제출되었어요'}</h1>
        <p class="sign-lead center">${already ? '같은 링크로 다시 서명할 수 없어요. 아래에서 사본을 내려받을 수 있어요.' : `학교에 바로 반영되었고, 사본 안내가 알림톡으로 갔어요.${next ? `<br>다음 차례는 <b>${CPX.DOC_SHORT[next]}</b>이고, 자동으로 안내돼요.` : '<br>4단계가 모두 끝나 협약이 체결되었어요.'}`}</p>
      </div>
      <div class="card receipt">
        <div class="receipt__row"><span>문서</span><b>${docTitle}${p.version > 1 ? ` (v${p.version})` : ''}</b></div>
        <div class="receipt__row"><span>학생</span><b>${esc(s.name)} · ${esc(j.company)} ${esc(j.role)}</b></div>
        <div class="receipt__row"><span>서명자</span><b>${esc(signer.name)} (${esc(dd.rel || signer.rel)})${dd.legalGuardian === false ? ' <span class="badge badge--warn">법정대리인 확인 필요</span>' : ''}</b></div>
        <div class="receipt__row"><span>본인 확인</span><b>${dd.otpAt ? `OTP ${CP.fmt.dt(dd.otpAt)} · ${dd.otpPhone || ''}` : '등록 번호 인증'}</b></div>
        <div class="receipt__row"><span>서명 시각</span><b>${dd.signedTime ? CP.fmt.dt(dd.signedTime) : CP.fmt.date(dd.signedAt)}</b></div>
        <div class="receipt__row"><span>문서 확인번호</span><b class="mono">${dd.hash || '—'}</b></div>
        ${dd.signature ? `<div class="receipt__sig"><img id="sig-img" alt="제출된 서명 이미지"></div>` : ''}
        <p class="receipt__note">확인번호는 문서·버전·서명 시각으로 만든 값이라, 나중에 PDF가 바뀌었는지 대조할 수 있어요. 본인이 서명한 것이 아니라면 즉시 ${CP.SCHOOL.phone}로 알려 주세요.</p>
      </div>
      <div class="card">
        <h2 class="card__title">${isEmp ? '취업(전환) 동의 진행' : '이 실습의 체결 진행'} <span class="card__num">${isEmp ? ['guardian', 'student'].filter((k) => base[k].status === 'signed').length + ' / 2' : CP.DOC_CHAIN.filter((k) => p.docs[k].status === 'signed').length + ' / 4'}</span></h2>
        <ul class="doclist">${chain}</ul>
        ${!isEmp && key === 'guardian' && p.docs.student.status !== 'signed' ? `<p class="t-small muted">학생 본인 동의서 링크가 ${esc(s.name)} 학생 휴대폰으로 지금 발송돼요.</p>` : ''}
      </div>
      <div class="sign-actions">
        <button id="pdf" class="btn btn--primary btn--xl btn--block">서명본 PDF 받기 (감사추적 포함)</button>
        <a class="btn btn--ghost btn--block" href="admin/consents.html?p=${p.id}">교사 화면에서 상태 보기 (데모)</a>
      </div>`;
  }
  function burst() { if (UI.reduced()) return; const wrap = document.createElement('div'); wrap.className = 'burst'; for (let i = 0; i < 14; i++) { const e = document.createElement('i'); e.style.setProperty('--a', (i / 14 * 360) + 'deg'); e.style.setProperty('--d', (0.4 + Math.random() * 0.4) + 's'); wrap.appendChild(e); } $('.done__check').appendChild(wrap); setTimeout(() => wrap.remove(), 1400); }
  view.addEventListener('click', (e) => { if (e.target.id === 'pdf') openPdf(); });

  /* ───── 서명본 PDF(인쇄 뷰) + 감사추적 페이지 ───── */
  function openPdf() {
    const dd = base[key]; const w = window.open('', '_blank'); if (!w) { toast('팝업이 차단되었습니다. 허용 후 다시 눌러 주세요', 'warn'); return; }
    const trail = [dd.sentAt && ['발송', `${CP.fmt.date(dd.sentAt)} · 알림톡 → ${CP.fmt.phoneMask(signer.phone)}`], dd.viewedAt && ['열람', CP.fmt.date(dd.viewedAt)], dd.otpAt && ['본인 확인', `OTP 6자리 · ${CP.fmt.dt(dd.otpAt)} · ${dd.otpPhone || ''}`], dd.agreedAt && ['필수 동의·전자서명 약정', CP.fmt.dt(dd.agreedAt)], dd.signedTime && ['서명', `${CP.fmt.dt(dd.signedTime)} · ${dd.ip || ''} · ${dd.ua || ''}`]].filter(Boolean);
    w.document.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>${docTitle}_${s.name}</title><style>@page{size:A4;margin:18mm}body{font-family:Pretendard,"Noto Sans KR",sans-serif;color:#111;line-height:1.6;font-size:11pt;margin:0}h1{font-size:18pt;margin:0 0 6mm;letter-spacing:-.02em}h2{font-size:14pt;margin:0 0 4mm}table{border-collapse:collapse;width:100%;margin:4mm 0}td,th{border:1px solid #bbb;padding:2.2mm 3mm;font-size:10pt;text-align:left;vertical-align:top}th{background:#f3f4f6;width:34mm}.art{white-space:pre-wrap;font-size:10pt}.sig{display:flex;justify-content:space-between;align-items:flex-end;margin-top:10mm}.sig img{height:22mm;border-bottom:1px solid #111}.meta{font-size:8.5pt;color:#555;margin-top:8mm;border-top:1px solid #ddd;padding-top:3mm}.stamp{font-size:9pt;color:#555}.page{page-break-before:always}.mono{font-family:ui-monospace,Consolas,monospace}</style></head><body>
      <h1>${docTitle}</h1>
      <table><tr><th>학생</th><td>${esc(s.name)} (${esc(CP.dept(s.dept).name)} 3학년 ${s.cls}반 · 학번 ${s.sid})</td></tr><tr><th>기업</th><td>${esc(j.company)} · ${esc(j.industry)} · ${esc(j.region)} · ${j.approval === 'leading' ? '선도기업' : '참여기업'}</td></tr><tr><th>직무</th><td>${esc(j.role)}</td></tr>${isEmp ? '' : `<tr><th>기간</th><td>${CP.fmt.date(j.start)} ~ ${CP.fmt.date(j.end)} (${j.weeks}주 · 실습일 ${j.days}일)</td></tr><tr><th>실습 시간</th><td>1일 ${j.hoursPerDay}시간 · 주 ${j.hoursPerWeek}시간 · 휴게 ${j.breakMin}분 · 야간(22~06시)·휴일 없음</td></tr><tr><th>현장실습 수당</th><td>시간당 ${CP.fmt.won(j.wageHour)} · 매월 ${j.payDay}일 지급</td></tr><tr><th>보험·안전</th><td>${j.insurance ? '산재보험 가입' : '미확인'} · 사전 안전교육 · 기업현장교사 ${j.mentors}명</td></tr>`}</table>
      <div class="art">${docBody(true)}</div>
      <div class="sig"><div><div class="stamp">서명자: ${esc(signer.name)} (${esc(dd.rel || signer.rel)}) · ${signer.label}</div><div class="stamp">서명 일시: ${dd.signedTime ? CP.fmt.dt(dd.signedTime) : CP.fmt.date(dd.signedAt)}</div></div>${dd.signature ? `<img src="${dd.signature}" alt="서명">` : '<div class="stamp">(서명 없음)</div>'}</div>
      <div class="meta">문서 확인번호 <span class="mono">${dd.hash || '—'}</span> · 전자서명법 제3조(당사자 약정에 따른 전자서명) · 본 문서는 CAREERPASS 데모에서 생성된 가상 문서입니다.</div>
      <div class="page"><h2>감사추적 (Audit Trail)</h2><table><tr><th>문서</th><td>${docTitle}${p.version > 1 ? ` v${p.version}` : ''} · 배정 ${p.id}</td></tr><tr><th>확인번호</th><td class="mono">${dd.hash || '—'}</td></tr><tr><th>서명자</th><td>${esc(signer.name)} (${esc(dd.rel || signer.rel)}) · ${signer.label}${dd.legalGuardian === false ? ' · 법정대리인 확인 필요' : ''}</td></tr>${trail.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}<tr><th>보관</th><td>원본은 학교 서버에 변경 불가 저장 · 실습 종료 후 3년 보존 후 파기</td></tr></table><p class="stamp">이 페이지는 서명 시 자동으로 첨부됩니다. 확인번호가 다르면 문서가 변경된 것입니다.</p></div>
      <script>setTimeout(function(){window.print()},300)<\/script></body></html>`);
    w.document.close(); CP.audit('서명본 PDF(수신자)', `${s.name} · ${docTitle}`);
  }

  /* ───── 문서 본문 ───── */
  function docBody(plain) {
    const nm = esc(s.name), co = esc(j.company);
    let paras;
    if (isEmp) paras = [['제1조 (목적)', `이 동의서는 ${nm} 학생(이하 "학생")이 현장실습을 마치고 ${co}(이하 "기업")에 취업(전환)하는 것에 대해 ${key === 'guardian' ? '보호자(법정대리인)' : '학생 본인'}의 동의를 확인하기 위한 것입니다(교육부 현장실습 운영 매뉴얼 서식3).`], ['제2조 (취업전환 시기)', `취업전환은 ${j.approval === 'leading' ? '선도기업 기준 — 4주(실습일 20일) 이상 실습 후 수업일수 3분의 2 출석 이후' : '참여기업 기준 — 5일 이상 실습 후 3학년 겨울방학 또는 다음 해 1월 1일부터'} 가능합니다.`], ['제3조 (연소자 보호)', `학생이 만 18세 미만인 경우 기업은 근로기준법 제66조에 따라 가족관계기록사항 증명서와 친권자(후견인) 동의서를 사업장에 비치해야 하며, 학교는 사본을 안내합니다.`], ['제4조 (철회)', `${key === 'guardian' ? '보호자' : '학생'}는 근로계약 체결 전까지 동의를 철회할 수 있으며, 철회로 인한 학교 성적·평가상 불이익은 없습니다.`], ['제5조 (전자서명)', `이 동의서는 전자서명법 제3조에 따라 전자적 방법으로 서명하며 서명 시각·식별 정보·확인번호가 함께 보관됩니다.`]];
    else if (key === 'agreement') paras = [['제1조 (목적)', `이 협약은 「직업교육훈련 촉진법」 제7조와 교육부 「직업계고 현장실습 운영 기준」(표준협약서 고시)에 따라 ${CP.SCHOOL.name}(이하 "학교")과 ${co}(이하 "기업")이 ${nm} 학생(이하 "실습생")의 현장실습 운영에 관한 권리·의무를 정하기 위한 것입니다. 협약서는 3부를 작성해 기업 대표·실습생·학교장이 서명 후 1부씩 보관합니다.`], ['제2조 (실습 내용·기간·시간)', `실습 직무는 ${esc(j.role)}이며 기간은 ${CP.fmt.date(j.start)}부터 ${CP.fmt.date(j.end)}까지(${j.weeks}주, 실습일 ${j.days}일)입니다. 실습시간은 1일 ${j.hoursPerDay}시간·주 ${j.hoursPerWeek}시간을 초과하지 않으며, 4시간 이상 30분·8시간 이상 1시간의 휴게를 주고 주 2회 이상 휴일을 둡니다. 야간(22:00~06:00)·휴일 실습은 금지합니다.`], ['제3조 (수당·보험)', `기업은 실습생에게 시간당 ${CP.fmt.won(j.wageHour)}의 현장실습 수당을 매월 ${j.payDay}일 지급하고, 산업재해보상보험에 가입합니다.`], ['제4조 (안전·교육)', `기업은 입문교육(전체 실습시간의 30% 이상, 의무교육 12시간 이상)을 실시하고 유해·위험 작업에 실습생을 투입하지 않습니다. 기업현장교사는 실습생 1명당 1명을 배치합니다.`], ['제5조 (점검·변경·해지)', `학교는 매월 1회 이상 현장을 점검합니다. 실습 내용·기간 변경 시 변경 합의서를 작성하며, 협약 해지는 서면으로 사유를 명시합니다. 안전사고 발생 시 기업은 즉시 보호자와 학교에 통보합니다.`], ['제6조 (개인정보)', `기업은 제공받은 실습생 정보를 실습 운영 외 목적으로 사용하지 않고 종료 30일 이내 파기합니다.`], ['제7조 (전자서명)', `이 협약서는 전자서명법 제3조에 따라 전자적으로 서명하며, 서명 순서는 보호자 사전동의 → 실습생 → 기업 대표 → 학교장 날인입니다.`]];
    else paras = [['제1조 (목적)', `이 동의서는 ${nm} 학생(이하 "학생")이 ${co}(이하 "기업")에서 실시하는 현장실습에 참여함에 있어 ${key === 'guardian' ? '보호자(법정대리인)' : '학생 본인'}의 사전 동의를 확인하기 위한 것입니다. 현장실습은 「직업교육훈련 촉진법」과 교육부 「직업계고 현장실습 운영 기준」에 따라 학교·기업·학생이 체결하는 표준협약서에 근거해 운영되며, 참여 여부는 학생이 스스로 결정합니다.`], ['제2조 (실습 내용과 기간)', `실습 직무는 ${esc(j.role)}이며, 기간은 ${CP.fmt.date(j.start)}부터 ${CP.fmt.date(j.end)}까지 ${j.weeks}주입니다. 실습 시간은 1일 ${j.hoursPerDay}시간, 1주 ${j.hoursPerWeek}시간을 초과하지 않으며, 야간(22시~06시)·휴일 실습은 실시하지 않습니다.`], ['제3조 (현장실습 수당과 보험)', `기업은 학생에게 시간당 ${CP.fmt.won(j.wageHour)}(월 약 ${CP.fmt.won(CPX.monthlyAllowance(j))})의 현장실습 수당을 매월 ${j.payDay}일 지급합니다. 기업은 산업재해보상보험에 가입하며, 학교는 학교안전공제 보상 범위를 안내합니다.`], ['제4조 (안전과 중단권)', `학생은 실습 전 안전·보건 교육을 이수하며, 협약과 다른 업무 지시·위험 작업·폭언 등 부당한 대우가 있을 경우 즉시 실습을 중단하고 학교에 알릴 수 있습니다. 학교는 월 1회 이상 현장을 점검하고 결과를 ${key === 'guardian' ? '보호자에게' : '학생과 보호자에게'} 안내합니다.`], ['제5조 (개인정보 제공)', `학교는 실습 운영에 필요한 최소한의 학생 정보(성명·학과·학년·연락처·보호자 비상연락처)를 기업에 제공하며, 기업은 종료 후 30일 이내 파기합니다. 제공을 거부할 권리가 있으나 거부 시 현장실습 참여가 제한될 수 있습니다(교육기본법 제23조의3).`], ['제6조 (변경과 철회)', `실습 기업·기간·직무가 변경되면 학교는 변경 합의서로 다시 동의를 받습니다. ${key === 'guardian' ? '보호자' : '학생'}는 실습 시작 전까지 동의를 철회할 수 있으며 불이익은 없습니다.`], ['제7조 (전자서명)', `이 동의서는 「전자서명법」 제3조에 따라 당사자 약정에 의한 전자서명으로 작성되며, 본인 확인 시각·서명 시각·서명자 식별 정보·문서 확인번호가 함께 보관됩니다. 서명 후 사본이 알림톡으로 전송됩니다.`]];
    return plain ? paras.map(([h, b]) => `${h}\n${b}`).join('\n\n') : paras.map(([h, b]) => `<h3>${h}</h3><p>${b}</p>`).join('') + '<p class="doc__end">— 끝 —</p>';
  }

  function stateCard(icon, title, text, actions) {
    const btns = actions.map((a) => a.href ? `<a class="btn ${a.ghost ? 'btn--ghost' : 'btn--primary'} btn--xl btn--block" href="${a.href}">${a.label}</a>` : `<button class="btn ${a.ghost ? 'btn--ghost' : 'btn--primary'} btn--xl btn--block" data-act>${a.label}</button>`).join('');
    setTimeout(() => { const b = $('[data-act]'); const a = actions.find((x) => x.onClick); if (b && a) b.addEventListener('click', a.onClick); }, 0);
    return `<div class="state" data-reveal><div class="state__icon" aria-hidden="true">${icon}</div><h1 class="sign-h1 center">${title}</h1><p class="sign-lead center">${text}</p><div class="sign-actions">${btns}</div><p class="sign-note center">${CP.SCHOOL.name} ${CP.SCHOOL.dept} · ${CP.SCHOOL.phone}</p></div>`;
  }
  function render(html) { view.innerHTML = html; view.classList.remove('swap'); void view.offsetWidth; view.classList.add('swap'); UI.reveal(view); }
  step0();
})();
