/* 승계 리포트 (고객용) — 관리자가 발급한 스냅샷을 그대로 보여 준다 */
(function () {
  'use strict';
  const { $, $$, esc, won, dot, toast, reduce } = LTL;
  const qs = new URLSearchParams(location.search);
  const t = qs.get('t');
  const example = !t;
  const box = $('#tr');
  const KIND = { operating: '운용리스', finance: '금융리스', rent: '장기렌트' };
  const sign = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + won(Math.abs(n));

  box.innerHTML = `<div class="tr-skel"><div class="skel" style="height:30px;width:60%"></div><div class="skel" style="height:240px;border-radius:20px"></div><div class="skel" style="height:96px;border-radius:18px"></div><div class="skel" style="height:96px;border-radius:18px"></div></div>`;

  async function load() {
    try {
      const d = await API.get('/transfer-reports/' + encodeURIComponent(t || 'Tr5fHv8KqWm2ZpXc7NdY'));
      render(d);
    } catch (e) {
      if (e.status === 404 || e.status === 410) location.replace('report.html?t=' + encodeURIComponent(t) + '&k=transfer');
      else box.innerHTML = `<div class="state"><div class="state__ic state__ic--err"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 4l9.5 16h-19z"/><path d="M12 10v4.5M12 17.5v.01" stroke-linecap="round"/></svg></div><h2>잠시 문제가 생겼어요</h2><p>리포트를 불러오지 못했어요.</p><button class="btn btn--primary" type="button" onclick="location.reload()">다시 시도</button></div>`;
    }
  }

  function render(d) {
    const quoted = dot(d.quotedAt || d.createdAt);
    $('#hdDate').textContent = `기준일 ${quoted}`;
    const pay = d.contractType === 'rent' ? '월 렌트료' : '월 리스료';
    box.innerHTML = `<div class="tr-page">
      ${example ? '<p class="tr-demo">예시 화면 · 관리자가 링크를 만들면 실제 리포트가 보여요</p>' : ''}
      <h1>처리 방법별 예상 손익</h1>
      <p class="tr__date">견적일 ${quoted}</p>
      <dl class="tr-info">
        <div><dt>고객명</dt><dd>${esc(d.maskedName)}</dd></div>
        <div><dt>차량번호</dt><dd>${esc(d.plate)}</dd></div>
        <div><dt>차종</dt><dd>${esc(d.model)}</dd></div>
        <div><dt>계약 구분</dt><dd>${esc(KIND[d.leaseKind] || (d.contractType === 'rent' ? '장기렌트' : '리스'))}</dd></div>
        <div><dt>${pay}</dt><dd>${won(d.monthly)}원</dd></div>
        <div><dt>남은 회차</dt><dd>${d.remain}회</dd></div>
      </dl>
      <div class="tr-sec"><h2>처리 방법별 고객 손익 <small>(현재 기준)</small></h2><p>+ 받는 금액 · − 내는 금액</p></div>
      <div class="tr-methods">${d.methods.map((m, i) => method(m, i, d.recommend)).join('')}</div>
      ${d.deadline && d.deadline.daysLeft > 0 ? `<div class="tr-dead"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C55604" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>일반 승계는 <b>${dot(d.deadline.date)}</b>까지 리스사 심사가 끝나야 해요 (만기 5주 전)</span><em>D-${d.deadline.daysLeft}</em></div>` : ''}
      <div class="tr-sec"><h2>미래 승계시점 예상 가격</h2><p>현재 ~ 마지막 회차 · 단위 만원</p></div>
      <div class="tr-chart" id="fc"></div>
      <p class="tr-legend"><b>+ 인수금</b> (받는 금액) · <em>− 지원금</em> (내는 금액)</p>
      <p class="tr-note">본 리포트는 기준일 시세와 입력된 계약 정보로 계산한 예상 금액이에요.<br>실제 금액은 차량 상태와 시세 변동에 따라 달라질 수 있어요.
        <small>본 리포트는 입력값 기준 추정이며 금융상품 계약 체결의 권유·중개가 아닙니다. 공유 링크는 ${dot(d.expiresAt)}까지 열려요.</small></p>
    </div>`;
    // 금액 카운트업
    $$('[data-amt]', box).forEach((el) => {
      const to = +el.dataset.amt; if (reduce()) { el.textContent = sign(to) + '원'; return; }
      const t0 = performance.now(); const step = (now) => { const p = Math.min(1, (now - t0) / 850), e = 1 - Math.pow(1 - p, 3); el.textContent = sign(Math.round(to * e)) + '원'; if (p < 1) requestAnimationFrame(step); }; setTimeout(() => requestAnimationFrame(step), 200);
    });
    ForecastChart.mount($('#fc'), d.forecast, { height: innerWidth < 640 ? 230 : 260, animate: !reduce() });
    // 재견적
    const cta = $('#cta'); cta.hidden = false;
    const btn = $('#requote'), note = $('#requoteNote');
    const lock = (next) => { btn.disabled = true; $('span', btn).textContent = '재견적 신청 완료'; note.innerHTML = `재견적은 30일에 한 번 · 다음 재견적 신청 가능일 <b>${dot(next)}</b>`; };
    if (d.requote && !d.requote.available) lock(d.requote.next);
    else note.textContent = '재견적은 30일에 한 번 신청할 수 있어요';
    btn.onclick = async () => {
      if (example) { toast('예시 화면이에요 · 관리자가 보낸 링크에서 신청할 수 있어요', 'info'); return; }
      btn.disabled = true; $('span', btn).textContent = '신청하는 중';
      try { const r = await API.post('/transfer-reports/' + encodeURIComponent(t) + '/requote', {}); lock(r.next); toast('재견적을 신청했어요 · 새 시세로 다시 계산해 드려요'); }
      catch (e) { if (e.status === 429) { lock(e.detail.next); toast('이미 신청하셨어요 · ' + dot(e.detail.next) + '부터 다시 신청할 수 있어요', 'info'); } else { btn.disabled = false; $('span', btn).textContent = '재견적 신청'; toast('잠시 후 다시 시도해 주세요', 'info'); } }
    };
  }

  function method(m, i, rec) {
    if (!m.available) return `<div class="tr-m is-off" style="--i:${i}"><div class="tr-m__row"><span class="tr-m__name">${esc(m.label)}</span><span class="tr-m__off">${esc(m.reason)}</span></div></div>`;
    const plus = m.amount >= 0;
    return `<details class="tr-m ${m.key === rec ? 'is-rec' : ''}" style="--i:${i}"><summary>
      <div class="tr-m__row"><span class="tr-m__name">${esc(m.label)}${m.key === rec ? '<span class="tr-m__badge">추천</span>' : ''}</span>
      <span class="tr-m__amt"><span>${esc(m.kind)}</span><b class="${plus ? 'plus' : 'minus'}" data-amt="${m.amount}">${sign(0)}원</b></span></div>
      <span class="tr-m__how">어떻게 계산했나요?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></span></summary>
      <div class="tr-parts">${(m.parts || []).map((p) => `<div><span>${esc(p.label.replace(/\s*\([^)]*×[^)]*\)/, ''))}</span><b>${sign(p.amount)}원</b></div>`).join('')}${m.edited ? '<div><span>담당자 조정</span><b>' + sign(m.amount - m.original) + '원</b></div>' : ''}<div class="sum"><span>합계</span><b>${sign(m.amount)}원</b></div></div>
    </details>`;
  }

  load();
  window.DEMO_HOOKS = {
    states: { '예시 화면(토큰 없음)': () => { location.href = 'transfer.html'; }, '실제 링크': () => { location.href = 'transfer.html?t=Tr5fHv8KqWm2ZpXc7NdY'; }, '운용리스 링크': () => { location.href = 'transfer.html?t=Tq9Lw2HmXa7PcN4vR8sK'; }, '없는 링크': () => { location.href = 'transfer.html?t=nope123'; } },
  };
})();
