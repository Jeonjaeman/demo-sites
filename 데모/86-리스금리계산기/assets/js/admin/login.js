/* 관리자 로그인 — 아이디·비밀번호 → OTP 6자리 (외부 접속 추가 인증: 안전성 확보조치 기준 제6조②) */
(function () {
  'use strict';
  const { $, $$, esc, toast, SS } = LTL;
  const qs = new URLSearchParams(location.search);
  const next = qs.get('next') || 'customers.html';
  const step = $('#step');
  if (SS.get('admin')) { location.replace(next); return; }

  function stepOne(prefill) {
    const msg = qs.has('idle') ? '15분 동안 작업이 없어 자동으로 로그아웃됐어요.' : qs.has('expired') ? '세션이 만료됐어요. 다시 로그인해 주세요.' : '';
    step.innerHTML = `<h1>관리자 로그인</h1>
      <p class="sub">상담 고객 DB는 개인정보처리시스템이에요.<br>로그인 후 휴대전화 인증번호를 한 번 더 확인해요.</p>
      ${msg ? `<p class="alogin__msg">${esc(msg)}</p>` : ''}
      <form id="f1" novalidate>
        <label class="af"><span>아이디</span><input id="lid" autocomplete="username" value="${esc(prefill ? prefill.id : '')}" placeholder="아이디"></label>
        <label class="af"><span>비밀번호</span><input id="lpw" type="password" autocomplete="current-password" value="${prefill ? 'demo1234' : ''}" placeholder="비밀번호"></label>
        <button class="ab ab--teal" type="submit" id="go">로그인</button>
      </form>
      <div class="alogin__demo"><p>체험용 계정 (비밀번호 demo1234)</p>
        <button class="ab ab--line" type="button" data-demo="admin">메인 관리자로 체험</button>
        <button class="ab ab--line" type="button" data-demo="dealer01">서브 관리자로 체험</button></div>`;
    $$('[data-demo]').forEach((b) => b.addEventListener('click', () => { $('#lid').value = b.dataset.demo; $('#lpw').value = 'demo1234'; $('#f1').requestSubmit(); }));
    $('#f1').addEventListener('submit', async (e) => {
      e.preventDefault();
      const go = $('#go'); go.disabled = true; go.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,.35);border-top-color:#fff"></span>확인 중';
      try { const r = await API.post('/admin/login', { loginId: $('#lid').value, password: $('#lpw').value }); stepTwo(r); }
      catch (err) {
        go.disabled = false; go.textContent = '로그인';
        toast(err.code === 'INACTIVE' ? '비활성화된 계정이에요 · 메인 관리자에게 문의해 주세요' : '아이디 또는 비밀번호를 확인해 주세요', 'info');
        $('#card').animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 });
      }
    });
  }

  function stepTwo(r) {
    let left = 180;
    step.innerHTML = `<h1>인증번호 확인</h1>
      <p class="sub">${esc(r.phoneHint)}로 보낸 6자리 인증번호를 입력해 주세요.<br>외부에서 관리자 화면에 접속할 때 필요한 추가 인증이에요.</p>
      <div class="otp-demo"><span>데모 인증번호</span><b>${esc(r.demoCode)}</b><button type="button" id="auto">자동 입력</button></div>
      <form id="f2" novalidate>
        <div class="otp" id="otp">${Array.from({ length: 6 }, (_, i) => `<input inputmode="numeric" maxlength="1" aria-label="인증번호 ${i + 1}번째 자리" autocomplete="${i ? 'off' : 'one-time-code'}">`).join('')}</div>
        <div class="otp-meta"><span>남은 시간 <b id="ttl">3:00</b></span><button type="button" class="reveal" id="back">처음으로</button></div>
        <button class="ab ab--teal" type="submit" id="go2" disabled>확인</button>
      </form>`;
    const ins = $$('#otp input');
    const code = () => ins.map((i) => i.value).join('');
    const sync = () => { ins.forEach((i) => i.classList.toggle('is-filled', !!i.value)); $('#go2').disabled = code().length !== 6; if (code().length === 6) $('#f2').requestSubmit(); };
    ins.forEach((inp, i) => {
      inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(-1); if (inp.value && ins[i + 1]) ins[i + 1].focus(); sync(); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus(); });
      inp.addEventListener('paste', (e) => { const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (!d) return; e.preventDefault(); d.split('').forEach((ch, k) => { if (ins[k]) ins[k].value = ch; }); sync(); });
    });
    ins[0].focus();
    $('#auto').addEventListener('click', () => { r.demoCode.split('').forEach((ch, k) => setTimeout(() => { ins[k].value = ch; ins[k].focus(); ins[k].animate([{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 180 }); if (k === 5) sync(); }, k * 70)); });
    $('#back').addEventListener('click', () => { clearInterval(tm); stepOne(); });
    const tm = setInterval(() => { left--; const t = $('#ttl'); if (!t) return clearInterval(tm); t.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; if (left <= 0) { clearInterval(tm); toast('인증 시간이 지났어요 · 다시 로그인해 주세요', 'info'); stepOne(); } }, 1000);
    let busy = false;
    $('#f2').addEventListener('submit', async (e) => {
      e.preventDefault(); if (busy || code().length !== 6) return; busy = true;
      try {
        const s = await API.post('/admin/otp', { ticket: r.ticket, code: code() });
        clearInterval(tm); SS.set('admin', s); toast(`${s.admin.name}님, 환영해요`);
        setTimeout(() => location.replace(next), 350);
      } catch (err) {
        busy = false; const o = $('#otp'); o.classList.remove('is-err'); void o.offsetWidth; o.classList.add('is-err');
        ins.forEach((i) => { i.value = ''; }); ins[0].focus(); sync();
        toast(err.code === 'OTP_MISMATCH' ? `인증번호가 맞지 않아요 · ${err.detail.left}회 남았어요` : '인증이 만료됐어요 · 다시 로그인해 주세요', 'info');
        if (err.code !== 'OTP_MISMATCH') { clearInterval(tm); stepOne(); }
      }
    });
  }

  stepOne(qs.get('as') ? { id: qs.get('as') } : null);
  window.DEMO_HOOKS = { actions: { '메인 관리자로 바로 로그인': () => $('[data-demo="admin"]')?.click(), '서브 관리자로 바로 로그인': () => $('[data-demo="dealer01"]')?.click() } };
})();
