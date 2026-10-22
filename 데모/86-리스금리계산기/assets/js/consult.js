/* 승계 상담 신청 시트 (계산기·보고서 화면 공용) */
(function () {
  'use strict';
  const { $, $$, h, esc, toast, sheet, normalizePlate, formatPhone, SS } = LTL;

  function open({ lead, lease, type } = {}) {
    lead = lead || SS.get('lead');
    const who = lead ? `<div class="cs-who"><span>신청자</span><b>${esc(lead.plate)}</b><em>· 시작 화면에서 입력한 정보로 접수돼요</em></div>` : `
      <div class="field"><label class="field__label" for="cs-plate">차량번호 <span class="req">*</span></label><div class="input"><input id="cs-plate" placeholder="예) 123우1234" maxlength="12"></div></div>
      <div class="grid2"><div class="field"><label class="field__label" for="cs-name">성함 <span class="req">*</span></label><div class="input"><input id="cs-name" placeholder="이름" maxlength="20"></div></div>
      <div class="field"><label class="field__label" for="cs-phone">전화번호 <span class="req">*</span></label><div class="input"><input id="cs-phone" inputmode="numeric" placeholder="010-0000-0000" maxlength="13"></div></div></div>
      <label class="check cs-agree"><input type="checkbox" id="cs-agree"><span class="check__box"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="check__txt">개인정보 수집·이용 및 상담 연락에 동의합니다. <em>(필수)</em></span></label>`;
    const body = h(`<form class="cs" novalidate>
      <p class="cs-lead">리스·장기렌트를 중도에 정리하는 방법은 <b>즉시 판매 · 일반 승계 · 차량 반납</b> 세 가지예요. 승계 전문가가 정산서를 함께 보고 손익이 가장 나은 방법을 알려 드려요.</p>
      ${who}
      <div class="field"><label class="field__label" for="cs-model">차종 <small>(모델명)</small></label><div class="input"><input id="cs-model" placeholder="예) 기아 K8 1.6 HEV" maxlength="40"></div></div>
      <div class="grid2">
        <div class="field"><label class="field__label">색상</label><div class="cs-chips" data-g="color">${['흰색', '검정', '회색', '은색', '기타'].map((c) => `<button type="button" class="chip" aria-pressed="false" data-v="${c}">${c}</button>`).join('')}</div></div>
        <div class="field"><label class="field__label" for="cs-km">현재 주행거리</label><div class="input input--num"><input id="cs-km" inputmode="numeric" placeholder="0"><span class="unit">km</span></div></div>
      </div>
      <div class="field"><p class="field__label">원하는 처리 방법</p>
        <div class="cs-wish" data-g="wish">
          <button type="button" data-v="즉시 판매" aria-pressed="false"><b>즉시 판매</b><span>바로 처분하고 정리</span></button>
          <button type="button" data-v="일반 승계" aria-pressed="false"><b>일반 승계</b><span>남은 계약을 넘기기</span></button>
          <button type="button" data-v="차량 반납" aria-pressed="false"><b>차량 반납</b><span>리스사에 반납</span></button>
          <button type="button" data-v="상담 후 결정" aria-pressed="true"><b>잘 모르겠어요</b><span>손익 비교 후 결정</span></button>
        </div></div>
      <div class="field"><p class="field__label">연락 받기 편한 시간</p><div class="cs-chips" data-g="time">${['언제든', '오전', '오후', '저녁'].map((c, i) => `<button type="button" class="chip" aria-pressed="${i === 0}" data-v="${c}">${c}</button>`).join('')}</div></div>
      <div class="field"><label class="field__label" for="cs-memo">남기실 말씀 <small>(선택)</small></label><textarea id="cs-memo" class="cs-memo" rows="3" maxlength="300" placeholder="예) 남은 회차가 30회 정도이고, 다음 달까지 정리하고 싶어요."></textarea></div>
    </form>`);
    const s = sheet({ title: '승계 상담 신청', body, cls: 'sheet--consult', foot: '<button class="btn btn--primary btn--block" type="button" data-send>상담 신청하기</button>' });
    const val = { color: '', wish: '상담 후 결정', time: '언제든' };
    $$('[data-g]', body).forEach((g) => g.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; val[g.dataset.g] = b.dataset.v; $$('button', g).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
    const km = LTL.bindMoney($('#cs-km', body));
    if (!lead) { const ph = $('#cs-phone', body); ph.addEventListener('input', () => { ph.value = formatPhone(ph.value); }); }
    const send = $('[data-send]', s.el);
    async function submit(force) {
      let leadId = lead && lead.id;
      if (!leadId) {
        const pl = normalizePlate($('#cs-plate', body).value), nm = $('#cs-name', body).value.trim(), ph = $('#cs-phone', body).value;
        if (!pl || nm.length < 2 || ph.replace(/\D/g, '').length < 10 || !$('#cs-agree', body).checked) { toast('차량번호·성함·전화번호와 동의를 확인해 주세요', 'info'); return; }
        try { const r = await API.post('/leads', { plate: pl.text, name: nm, phone: ph, consent: { collect: true, contact: true } }); leadId = r.id; lead = { id: r.id, plate: pl.text, rental: r.rental }; SS.set('lead', lead); }
        catch (e) { toast('입력값을 확인해 주세요', 'info'); return; }
      }
      send.disabled = true; send.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,.35);border-top-color:#fff"></span>접수하는 중';
      try {
        const r = await API.post('/consults', { leadId, model: $('#cs-model', body).value.trim(), color: val.color, mileage: km.get(), wish: val.wish, time: val.time, memo: $('#cs-memo', body).value, force });
        done(r);
      } catch (e) {
        send.disabled = false; send.textContent = '상담 신청하기';
        if (e.status === 409) {
          const t = new Date(e.detail.at); const hm = `${t.getHours() < 12 ? '오전' : '오후'} ${((t.getHours() + 11) % 12) + 1}:${String(t.getMinutes()).padStart(2, '0')}`;
          const box = h(`<div class="cs-dup" role="alert"><b>오늘 ${hm}에 이미 신청하셨어요.</b><span>새로 적은 내용으로 바꿔 접수할까요?</span><button type="button" class="btn btn--soft btn--sm">바꿔서 접수</button></div>`);
          $('.cs-dup', body)?.remove(); body.prepend(box); $('button', box).addEventListener('click', () => { box.remove(); submit(true); });
        } else toast(e.status === 0 ? '인터넷 연결을 확인해 주세요 · 입력 내용은 그대로 있어요' : '잠시 문제가 생겼어요. 다시 눌러 주세요', 'info');
      }
    }
    function done() {
      s.body.innerHTML = `<div class="cs-done">
        <div class="cs-burst" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => `<i style="--a:${i * 36}deg;--d:${i * 18}ms"></i>`).join('')}<span><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg></span></div>
        <h3>상담 신청이 접수됐어요</h3>
        <p>영업일 기준 1일 안에 승계 전문가가<br><b>${esc(val.time === '언제든' ? '편한 시간' : val.time)}</b>에 연락드릴게요.</p>
        <dl><div><dt>희망 처리</dt><dd>${esc(val.wish)}</dd></div><div><dt>차량번호</dt><dd>${esc(lead.plate)}</dd></div></dl>
      </div>`;
      const foot = $('.sheet__foot', s.el); foot.innerHTML = '<button class="btn btn--primary btn--block" type="button" data-close>확인</button>';
      toast('승계 상담 신청이 관리자 화면에 바로 들어갔어요');
    }
    send.addEventListener('click', () => submit(false));
  }
  window.Consult = { open };
})();
