/* C-02 로그인 · C-03~05 회원가입 3단계 · C-06 계정 찾기/비밀번호 재설정
   F8: 필수 동의 체크박스 대신 수집 항목 고지 카드, 체크박스는 [선택] 마케팅만(기본 미체크) · 프리필로 입력 없이 진행 가능 */
(function () {
  const { $, $$, esc, icon, fmt, qs } = UI;
  UI.init();
  const main = $('#main');
  const page = document.body.dataset.page;
  const next = qs('next') || 'my.html';

  if (page === 'login') {
    let fails = +(sessionStorage.getItem('aptgo.fails') || 0);
    function render(state) {
      main.innerHTML = `<div class="auth"><h1 class="h1">로그인</h1><p class="auth-sub">로그인하면 <b>${UI.pageLabel(decodeURIComponent(next))}</b> 화면으로 돌아갑니다.</p>
        ${state === 'locked' ? `<div class="notice notice-danger mb-4">${icon('lock', 'ico-16')}<span><strong>5회 연속 실패로 10분간 잠겼습니다.</strong> 비밀번호 재설정 메일을 보내 드릴까요? <a href="recover.html" style="text-decoration:underline;font-weight:700">재설정</a></span></div>` : ''}
        <form id="f" novalidate>
          <div class="field"><label class="req">이메일</label><input class="input" id="email" type="email" value="jiwoo.kim@example.com" autocomplete="username" ${state === 'error' ? 'aria-invalid="true"' : ''}></div>
          <div class="field"><label class="req">비밀번호</label><div class="input-wrap"><input class="input" id="pw" type="password" value="demo1234!" autocomplete="current-password" style="padding-left:14px;padding-right:48px" ${state === 'error' ? 'aria-invalid="true"' : ''}><button type="button" class="ibtn" style="position:absolute;right:4px" data-eye aria-label="비밀번호 보기">${icon('eye')}</button></div>${state === 'error' ? `<div class="error-msg">이메일 또는 비밀번호가 맞지 않습니다 (${fails}/5)</div>` : ''}</div>
          <div class="row-between"><label class="check"><input type="checkbox" checked><span>로그인 유지</span></label><a href="recover.html" class="body-sm" style="color:var(--action);font-weight:600">비밀번호를 잊으셨나요?</a></div>
          <button class="btn btn-primary btn-lg btn-block" type="submit" ${state === 'locked' ? 'disabled' : ''}>로그인</button>
        </form>
        <div class="or">또는</div>
        <div class="social"><button class="btn" type="button" data-social="카카오" style="background:#fee500;color:#191919"><i style="background:#191919;color:#fee500;display:grid;place-items:center;font-size:12px;font-weight:900;border-radius:50%">K</i>카카오로 계속</button><button class="btn" type="button" data-social="네이버" style="background:#03c75a;color:#fff"><i style="background:#fff;color:#03c75a;display:grid;place-items:center;font-size:12px;font-weight:900;border-radius:4px">N</i>네이버로 계속</button></div><p class="micro muted-3 tac dev-note">공식 심볼은 각 사 브랜드 가이드의 버튼 에셋으로 교체(라이선스)</p>
        <p class="tac body-sm muted">아직 회원이 아니신가요? <a href="signup.html" style="color:var(--action);font-weight:700">회원가입</a></p>
        <div class="demo-row dev-note"><span class="micro muted-3">상태 보기(데모) —</span><button class="chip" type="button" data-demo="error">오류 상태</button><button class="chip" type="button" data-demo="locked">5회 잠금</button><button class="chip" type="button" data-demo="loading">로딩</button><button class="chip" type="button" data-demo="social">소셜 최초 가입</button></div></div>`;
      $('#f').addEventListener('submit', e => { e.preventDefault(); const b = $('button[type=submit]', main); b.classList.add('is-loading'); setTimeout(() => { Store.set('role', Store.get('orders').length ? 'buyer' : 'member'); sessionStorage.removeItem('aptgo.fails'); UI.toast('로그인했습니다 — 원래 화면으로 돌아갑니다', { type: 'pos', icon: 'check' }); setTimeout(() => location.href = decodeURIComponent(next), 500); }, 900); });
      $('[data-eye]').addEventListener('click', e => { const i = $('#pw'); i.type = i.type === 'password' ? 'text' : 'password'; e.currentTarget.innerHTML = icon(i.type === 'password' ? 'eye' : 'eyeOff'); });
      $$('[data-social]').forEach(b => b.addEventListener('click', () => { b.classList.add('is-loading'); setTimeout(() => { b.classList.remove('is-loading'); socialFirst(b.dataset.social); }, 700); }));
      $$('[data-demo]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.demo; if (k === 'social') { socialFirst('카카오'); return; } if (k === 'error') { fails = Math.min(5, fails + 1); sessionStorage.setItem('aptgo.fails', fails); render(fails >= 5 ? 'locked' : 'error'); } else if (k === 'locked') { fails = 5; render('locked'); } else { $('button[type=submit]', main).classList.add('is-loading'); setTimeout(() => $('button[type=submit]', main).classList.remove('is-loading'), 2000); } }));
    }
    /* 소셜 최초 가입 — 추가 정보 · 수집 고지 · 기존 이메일 계정 연결 (R14) */
    function socialFirst(provider) {
      const m = UI.modal(`<p class="body-sm muted">${provider} 계정으로 처음 로그인했습니다. 서비스 이용에 필요한 정보만 확인합니다.</p>
        <div class="notice notice-warn mt-3">${icon('alert', 'ico-16')}<span><strong>같은 이메일(jiwoo.kim@example.com)로 가입된 계정이 있습니다.</strong> 기존 계정과 연결하면 구매한 도면·주문 내역이 그대로 유지됩니다.</span></div>
        <div class="type-cards mt-3"><label class="radio-card"><input type="radio" name="link" value="link" checked><span class="rc-dot"></span><span><b>기존 계정과 연결</b><br><span class="body-sm muted">비밀번호 확인 1회</span></span></label><label class="radio-card"><input type="radio" name="link" value="new"><span class="rc-dot"></span><span><b>새 계정으로 가입</b><br><span class="body-sm muted">구매 내역이 분리됩니다</span></span></label></div>
        <div class="field mt-3"><label class="req">이름</label><input class="input" value="김지우"></div>
        <div class="notice-card mt-3"><h4>${icon('shield', 'ico-16')} ${provider}에서 받는 정보</h4><table><tr><td>항목</td><td>이메일, 이름(프로필 닉네임)</td></tr><tr><td>목적</td><td>회원 식별, 도면 제공, 주문 안내</td></tr><tr><td>보유</td><td>탈퇴 시 삭제(거래 기록 5년 분리 보관)</td></tr></table></div>
        <label class="check mt-3" style="color:var(--ink-2)"><input type="checkbox"><span>[선택] 신규 단지·할인 소식 받기</span></label>`, { title: `${provider} 계정으로 시작`, foot: '<button class="btn btn-secondary" data-close>취소</button><button class="btn btn-primary" data-ok>계속</button>' });
      $('[data-ok]', m).addEventListener('click', () => { m.close(); Store.set('role', Store.get('orders').length ? 'buyer' : 'member'); UI.toast(`${provider} 계정을 연결했습니다`, { type: 'pos', icon: 'check' }); setTimeout(() => location.href = decodeURIComponent(next), 500); });
    }
    render(fails >= 5 ? 'locked' : 'default'); return;
  }

  if (page === 'signup') {
    let step = +(qs('step') || 1), biz = qs('type') !== 'personal';
    function render() {
      history.replaceState(null, '', `signup.html?step=${step}&type=${biz ? 'biz' : 'personal'}`);
      const stepper = `<ol class="stepper mb-6"><li class="${step > 1 ? 'done' : 'current'}">유형·안내</li><li class="${step > 2 ? 'done' : step === 2 ? 'current' : ''}">정보 입력</li><li class="${step === 3 ? 'current' : ''}">완료</li></ol>`;
      if (step === 1) main.innerHTML = `<div class="auth"><h1 class="h1">회원가입</h1><p class="auth-sub">3단계 · 1분이면 끝납니다.<span class="dev-note"> 탈퇴는 2단계(다크패턴 규정)</span></p>${stepper}
        <div class="type-cards"><label class="radio-card"><input type="radio" name="t" value="personal" ${!biz ? 'checked' : ''}><span class="rc-dot"></span><span><b>개인</b><br><span class="body-sm muted">이사·리모델링 준비</span></span></label><label class="radio-card"><input type="radio" name="t" value="biz" ${biz ? 'checked' : ''}><span class="rc-dot"></span><span><b>사업자</b><br><span class="body-sm muted">인테리어·중개·설계 — 세금계산서</span></span></label></div>
        <div class="notice-card mt-4"><h4>${icon('shield', 'ico-16')} 가입 시 수집하는 정보</h4><table><tr><td>항목</td><td>이메일, 비밀번호, 이름${biz ? ', 상호, 사업자등록번호, 계산서 수신 이메일' : ''}</td></tr><tr><td>목적</td><td>회원 식별, 도면 제공, 결제·증빙 발행, 환불 처리</td></tr><tr><td>보유 기간</td><td>탈퇴 시 삭제. 거래 기록은 전자상거래법에 따라 5년 보관</td></tr></table><p class="micro muted-3 mt-2">가입에 꼭 필요한 정보라 따로 동의를 받지 않고 안내만 드립니다. <a href="#" style="text-decoration:underline">개인정보처리방침</a><span class="dev-note"> · 개인정보보호법 2023 개정(계약 이행 정보 동의 불요) → 필수 동의 체크박스 제거(F8)</span></p></div>
        <label class="check mt-4" style="color:var(--ink-2)"><input type="checkbox" id="mkt"><span>[선택] 신규 단지·할인 소식 받기 — 기본 해제</span></label>
        <button class="btn btn-primary btn-lg btn-block mt-4" data-next>다음</button><p class="tac body-sm muted mt-3">이미 회원이신가요? <a href="login.html" style="color:var(--action);font-weight:700">로그인</a></p></div>`;
      else if (step === 2) main.innerHTML = `<div class="auth"><h1 class="h1">정보 입력</h1><p class="auth-sub">${biz ? '사업자' : '개인'} 회원 · 예시 값이 미리 채워져 있습니다.</p>${stepper}
        <form id="f" novalidate>
          <div class="field"><label class="req">이메일</label><div class="row"><input class="input flex-1" id="email" type="email" value="${biz ? 'design@onliving.example.com' : 'hana.lee@example.com'}"><button class="btn btn-secondary" type="button" data-verify>인증</button></div><span class="help" id="email-help">인증 메일의 링크를 누르면 완료됩니다</span></div>
          <div class="field"><label class="req">비밀번호</label><input class="input" id="pw" type="password" value="Aptgo2026!"><ul class="pw-rules" id="rules"><li data-r="len">8자 이상</li><li data-r="num">숫자 포함</li><li data-r="alpha">영문 포함</li></ul></div>
          <div class="field"><label class="req">이름</label><input class="input" id="name" value="${biz ? '박서연' : '이하나'}"></div>
          ${biz ? `<div class="field"><label class="req">상호</label><input class="input" id="company" value="라움 디자인"></div><div class="field"><label class="req">사업자등록번호</label><input class="input" id="bizno" value="321-45-67890"><span class="help">국세청 조회로 자동 인증 — 휴·폐업이면 반려됩니다</span></div><div class="field"><label>세금계산서 수신 이메일</label><input class="input" id="tax" value="tax@raum.example.com"></div>` : ''}
          <div class="row gap-2"><button class="btn btn-secondary" type="button" data-back>이전</button><button class="btn btn-primary btn-lg flex-1" type="submit">가입 완료</button></div>
        </form><div class="demo-row dev-note"><span class="micro muted-3">상태 보기(데모) —</span><button class="chip" type="button" data-demo="dup">중복 이메일</button><button class="chip" type="button" data-demo="weak">약한 비밀번호</button></div></div>`;
      else main.innerHTML = `<div class="auth tac"><div class="rs-ico ok" style="width:72px;height:72px;border-radius:22px;background:var(--positive-tint);color:var(--positive);display:grid;place-items:center;margin:0 auto 20px">${icon('check', 'ico-24')}</div><h1 class="h1">가입이 완료되었습니다</h1><p class="auth-sub mt-2">${biz ? '사업자 인증은 영업일 1일 내 처리되며, 인증 전에도 도면 구매는 가능합니다(세금계산서는 인증 후 발행).' : '이제 단지를 검색하고 미리보기로 도면을 확인해 보세요.'}</p>${stepper}<div class="rs-ico ok" style="display:none"></div>${biz ? '<div class="notice notice-warn mb-4" style="text-align:left">' + icon('clock', 'ico-16') + '<span><strong>사업자 인증 대기 중</strong> — 상호·사업자번호를 국세청에서 확인하고 있습니다.</span></div>' : ''}<div class="row gap-2 jc-c"><a class="btn btn-primary btn-lg" href="search.html">단지 검색</a><a class="btn btn-secondary btn-lg" href="index.html">홈으로</a></div></div>`;
      $$('input[name=t]').forEach(r => r.addEventListener('change', () => { biz = r.value === 'biz'; render(); }));
      const n = $('[data-next]'); n && n.addEventListener('click', () => { if ($('#mkt').checked) Store.set('marketing', true); step = 2; render(); scrollTo(0, 0); });
      const b = $('[data-back]'); b && b.addEventListener('click', () => { step = 1; render(); });
      const f = $('#f'); if (f) {
        const pw = $('#pw'); const check = () => { const v = pw.value; $('[data-r=len]').classList.toggle('ok', v.length >= 8); $('[data-r=num]').classList.toggle('ok', /\d/.test(v)); $('[data-r=alpha]').classList.toggle('ok', /[a-zA-Z]/.test(v)); }; pw.addEventListener('input', check); check();
        f.addEventListener('submit', e => { e.preventDefault(); let ok = true; $$('.input', f).forEach(i => { if (i.id !== 'tax' && !i.value.trim()) { i.setAttribute('aria-invalid', 'true'); ok = false; } else i.removeAttribute('aria-invalid'); }); if (!$$('#rules li.ok').length === 3) ok = false; if ($$('#rules li').some(l => !l.classList.contains('ok'))) { ok = false; $('#pw').setAttribute('aria-invalid', 'true'); } if (!ok) { UI.toast('입력을 확인하세요', { type: 'danger', icon: 'alert' }); return; } const sb = $('button[type=submit]', f); sb.classList.add('is-loading'); setTimeout(() => { Store.patch({ role: 'member', profile: { name: $('#name').value, email: $('#email').value, phone: '010-0000-0000', biz, company: biz ? $('#company').value : null, bizNo: biz ? $('#bizno').value : null, taxEmail: biz ? $('#tax').value : null } }); step = 3; render(); scrollTo(0, 0); }, 900); });
        $('[data-verify]').addEventListener('click', e => { e.currentTarget.classList.add('is-loading'); setTimeout(() => { e.target.closest('button').classList.remove('is-loading'); e.target.closest('button').textContent = '인증됨 ✓'; e.target.closest('button').disabled = true; $('#email-help').innerHTML = '<span style="color:var(--positive)">이메일 인증이 완료되었습니다</span>'; }, 1200); });
        $$('[data-demo]').forEach(d => d.addEventListener('click', () => { if (d.dataset.demo === 'dup') { $('#email').setAttribute('aria-invalid', 'true'); $('#email-help').innerHTML = '<span class="error-msg">이미 가입된 이메일입니다 — <a href="login.html" style="text-decoration:underline">로그인</a> 또는 <a href="recover.html" style="text-decoration:underline">비밀번호 찾기</a></span>'; } else { pw.value = 'abc'; check(); pw.setAttribute('aria-invalid', 'true'); } }));
      }
    }
    render(); return;
  }

  if (page === 'recover') {
    let state = qs('state') || 'form';
    function render() {
      main.innerHTML = `<div class="auth"><h1 class="h1">계정 찾기 · 비밀번호 재설정</h1><p class="auth-sub">가입한 이메일로 재설정 링크를 보내 드립니다. 링크는 30분간 유효합니다.</p>
        ${state === 'form' ? `<form id="f" novalidate><div class="field"><label class="req">이메일</label><input class="input" id="email" type="email" value="jiwoo.kim@example.com"></div><button class="btn btn-primary btn-lg btn-block" type="submit">재설정 링크 보내기</button></form>`
        : state === 'sent' ? `<div class="notice notice-pos">${icon('check', 'ico-16')}<span><strong>jiwoo.kim@example.com</strong>으로 링크를 보냈습니다. 메일함(스팸함 포함)을 확인하세요.</span></div><div class="row gap-2 mt-4"><button class="btn btn-secondary" data-resend>다시 보내기 <span class="muted-3" data-cd>(60초)</span></button><a class="btn btn-ghost" href="login.html">로그인으로</a></div>`
        : state === 'expired' ? `<div class="notice notice-danger">${icon('alert', 'ico-16')}<span><strong>링크가 만료되었습니다.</strong> 재설정 링크는 30분간만 유효합니다. 다시 요청해 주세요.</span></div><button class="btn btn-primary btn-lg btn-block mt-4" data-again>다시 요청</button>`
        : `<form id="f2" novalidate><div class="field"><label class="req">새 비밀번호</label><input class="input" type="password" value="NewAptgo2026!"></div><div class="field"><label class="req">새 비밀번호 확인</label><input class="input" type="password" value="NewAptgo2026!"></div><button class="btn btn-primary btn-lg btn-block" type="submit">비밀번호 변경</button></form>`}
        <div class="demo-row dev-note"><span class="micro muted-3">상태 보기(데모) —</span><a class="chip" href="recover.html?state=form">입력</a><a class="chip" href="recover.html?state=sent">발송됨</a><a class="chip" href="recover.html?state=expired">링크 만료</a><a class="chip" href="recover.html?state=reset">재설정</a></div></div>`;
      const f = $('#f'); f && f.addEventListener('submit', e => { e.preventDefault(); $('button[type=submit]', f).classList.add('is-loading'); setTimeout(() => { state = 'sent'; render(); }, 800); });
      const f2 = $('#f2'); f2 && f2.addEventListener('submit', e => { e.preventDefault(); UI.toast('비밀번호를 변경했습니다 — 로그인하세요', { type: 'pos', icon: 'check' }); setTimeout(() => location.href = 'login.html', 700); });
      const rs = $('[data-resend]'); if (rs) { let n = 60; rs.disabled = true; const iv = setInterval(() => { n--; $('[data-cd]').textContent = `(${n}초)`; if (n <= 0) { clearInterval(iv); rs.disabled = false; $('[data-cd]').textContent = ''; } }, 1000); rs.addEventListener('click', () => { UI.toast('다시 보냈습니다', { type: 'pos' }); }); }
      const ag = $('[data-again]'); ag && ag.addEventListener('click', () => { state = 'form'; render(); });
    }
    render(); return;
  }
})();
