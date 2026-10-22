/* 시작 화면 — 기본 정보 입력 (계산식 없음) */
(function () {
  'use strict';
  const { $, $$, h, toast, sheet, normalizePlate, formatPhone, SS, reveal } = LTL;

  /* ---------- 인트로: 세션당 1회, 1.9초 또는 건너뛰기 ---------- */
  const intro = $('#intro');
  const hideIntro = () => { if (!intro.isConnected) return; intro.classList.add('is-out'); setTimeout(() => intro.remove(), 650); SS.set('intro', 1); };
  if (SS.get('intro') || new URLSearchParams(location.search).has('nointro')) intro.remove();
  else { $('#skip').addEventListener('click', hideIntro); setTimeout(hideIntro, LTL.reduce() ? 600 : 1900); }

  reveal();
  const form = $('#form');
  const f = { plate: $('#f-plate'), name: $('#f-name'), phone: $('#f-phone'), collect: $('#c-collect'), contact: $('#c-contact') };
  const submits = $$('[data-submit]');
  const touched = new Set();

  /* ---------- 검증 ---------- */
  const rules = {
    plate: () => { const v = f.plate.value.trim(); if (!v) return '차량번호를 입력해 주세요.'; return normalizePlate(v) ? '' : '123우1234 또는 12우1234 형식으로 입력해 주세요.'; },
    name: () => { const v = f.name.value.trim(); if (!v) return '성함을 입력해 주세요.'; if (!/^[가-힣a-zA-Z\s]{2,20}$/.test(v)) return '한글 또는 영문 2자 이상으로 입력해 주세요.'; return ''; },
    phone: () => { const d = f.phone.value.replace(/\D/g, ''); if (!d) return '전화번호를 입력해 주세요.'; return /^01[016789]\d{7,8}$/.test(d) ? '' : '휴대전화 번호 10~11자리를 확인해 주세요.'; },
  };
  function paint(key, force) {
    const err = rules[key](); const fd = $('#fd-' + key), box = $('.input', fd);
    $('.field__err', fd)?.remove();
    const show = (touched.has(key) || force) && err;
    box.classList.toggle('is-error', !!show);
    box.classList.toggle('is-ok', !err);
    f[key].setAttribute('aria-invalid', show ? 'true' : 'false');
    if (show) { const p = h(`<p class="field__err" role="alert"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg>${err}</p>`); const hint = $('.field__hint', fd); hint ? (hint.hidden = true, fd.appendChild(p)) : fd.appendChild(p); }
    else { const hint = $('.field__hint', fd); if (hint) hint.hidden = false; }
    return !err;
  }
  function plateTag() {
    const fd = $('#fd-plate'); $('.plate-tag', fd)?.remove();
    const p = normalizePlate(f.plate.value);
    if (p && p.rental) fd.appendChild(h(`<span class="plate-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.01"/></svg>‘${p.use}’ 번호는 렌터카(대여사업용)예요 · 장기렌트로 계산해요</span>`));
  }
  const allOk = () => !rules.plate() && !rules.name() && !rules.phone() && f.collect.checked;
  const sync = () => submits.forEach((b) => { b.disabled = !allOk(); });

  f.plate.addEventListener('input', () => { f.plate.value = f.plate.value.replace(/[^0-9가-힣\s]/g, ''); paint('plate'); plateTag(); sync(); });
  f.name.addEventListener('input', () => { paint('name'); sync(); });
  f.phone.addEventListener('input', () => { const p = f.phone.selectionStart === f.phone.value.length; f.phone.value = formatPhone(f.phone.value); if (p) f.phone.setSelectionRange(f.phone.value.length, f.phone.value.length); paint('phone'); sync(); });
  ['plate', 'name', 'phone'].forEach((k) => f[k].addEventListener('blur', () => { if (f[k].value) touched.add(k); paint(k); }));
  [f.collect, f.contact].forEach((c) => c.addEventListener('change', sync));

  /* ---------- 동의 안내 ---------- */
  const TERMS = {
    collect: { title: '개인정보 수집·이용 동의 (필수)', body: `
      <table class="terms"><tbody>
        <tr><th>수집 항목</th><td>차량번호, 성함, 휴대전화번호, 계산기에 입력한 계약 조건</td></tr>
        <tr><th>이용 목적</th><td>금리 계산 결과·보고서 제공, 승계 상담 신청 시 상담 진행</td></tr>
        <tr><th>보유 기간</th><td>문의일로부터 1년 (상담이 진행되면 상담 종료 후 1년) 뒤 파기</td></tr>
      </tbody></table>
      <p class="terms__p">동의하지 않을 수 있어요. 다만 동의하지 않으면 계산 결과를 저장·보고서로 발급할 수 없어요.</p>
      <p class="terms__note">※ 시안의 「개인정보 <b>제공</b>에 동의」는 법령상 <b>제3자 제공</b>(개인정보 보호법 제17조)을 뜻해요. 계산기에서 실제로 받는 것은 <b>수집·이용</b>(제15조) 동의라 문구를 바꿨고, 상담 연락은 선택 동의로 분리했어요.</p>` },
    contact: { title: '승계 상담 연락 동의 (선택)', body: `
      <table class="terms"><tbody>
        <tr><th>연락 방법</th><td>전화, 문자(SMS·알림톡)</td></tr>
        <tr><th>내용</th><td>리스·장기렌트 중도 처분·승계 상담 안내</td></tr>
        <tr><th>보유 기간</th><td>동의 철회 시까지 (철회: 관리자 전화 또는 문자 회신)</td></tr>
      </tbody></table>
      <p class="terms__p">선택 항목이에요. 동의하지 않아도 금리 계산과 보고서는 그대로 이용할 수 있어요.</p>` },
  };
  $$('[data-terms]').forEach((b) => b.addEventListener('click', () => {
    const t = TERMS[b.dataset.terms];
    const s = sheet({ title: t.title, body: t.body, foot: '<button class="btn btn--primary btn--block btn--md" type="button" data-agree>동의하고 닫기</button>' });
    $('[data-agree]', s.el).addEventListener('click', () => { const c = b.dataset.terms === 'collect' ? f.collect : f.contact; c.checked = true; sync(); s.close(); });
  }));

  /* ---------- 배너 CTA → 입력 시작 ---------- */
  $('#bannerCta').addEventListener('click', (e) => {
    e.preventDefault();
    const top = form.getBoundingClientRect().top + scrollY - 80;
    window.scrollTo({ top: Math.max(0, top), behavior: LTL.reduce() ? 'auto' : 'smooth' });
    setTimeout(() => { f.plate.focus({ preventScroll: true }); $('.input', $('#fd-plate')).animate([{ boxShadow: '0 0 0 0 rgba(22,62,48,.35)' }, { boxShadow: '0 0 0 10px rgba(22,62,48,0)' }], { duration: 700 }); }, 380);
  });

  /* ---------- 예시 값 (입력 없이 체험) ---------- */
  function fillSample() {
    const typeIn = (el, text, done) => { el.value = ''; let i = 0; const t = setInterval(() => { el.value = text.slice(0, ++i); el.dispatchEvent(new Event('input')); if (i >= text.length) { clearInterval(t); done && done(); } }, LTL.reduce() ? 0 : 28); };
    touched.add('plate'); touched.add('name'); touched.add('phone');
    typeIn(f.plate, '207저7707', () => typeIn(f.name, '강은서', () => typeIn(f.phone, '01029292929', () => { f.collect.checked = true; f.contact.checked = true; sync(); submits.forEach((b) => b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 420 })); })));
  }
  $('#sample').addEventListener('click', fillSample);

  /* ---------- 제출 ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    ['plate', 'name', 'phone'].forEach((k) => { touched.add(k); paint(k, true); });
    if (!f.collect.checked) { $('#consent').classList.remove('shake'); void $('#consent').offsetWidth; $('#consent').classList.add('shake'); toast('개인정보 수집·이용 동의(필수)가 필요해요', 'info'); return; }
    if (!allOk()) { const bad = ['plate', 'name', 'phone'].find((k) => rules[k]()); const box = $('.input', $('#fd-' + bad)); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); f[bad].focus(); return; }
    const pl = normalizePlate(f.plate.value);
    submits.forEach((b) => { b.disabled = true; b.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,.35);border-top-color:#fff"></span>확인 중'; });
    try {
      const r = await API.post('/leads', { plate: pl.text, name: f.name.value.trim(), phone: f.phone.value, consent: { collect: true, contact: f.contact.checked } });
      SS.set('lead', { id: r.id, plate: pl.text, rental: r.rental || pl.rental, at: Date.now() });
      if (r.duplicate) toast('오늘 같은 정보로 접수된 기록을 이어서 쓸게요');
      document.body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' });
      setTimeout(() => { location.href = 'calc.html'; }, 200);
    } catch (err) {
      submits.forEach((b) => { b.innerHTML = '확인'; }); sync();
      if (err.status === 422 && err.detail.fields) Object.keys(err.detail.fields).forEach((k) => { if (rules[k]) { touched.add(k); paint(k, true); } });
      else toast(err.status === 0 ? '인터넷 연결을 확인한 뒤 다시 눌러 주세요' : '잠시 문제가 생겼어요. 다시 시도해 주세요', 'info');
    }
  });

  window.DEMO_HOOKS = { actions: { '예시 값 채우기': fillSample, '인트로 다시 보기': () => { SS.del('intro'); location.reload(); } } };
})();
