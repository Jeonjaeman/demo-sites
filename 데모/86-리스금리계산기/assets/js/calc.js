/* 계산기 화면 — 입력·상태·결과 렌더링만 담당. 계산식은 없다(전부 API 응답). */
(function () {
  'use strict';
  const { $, $$, h, esc, won, bindMoney, toast, sheet, countUp, copy, SS, today, reduce } = LTL;

  const MONEY = ['price', 'prepay', 'deposit', 'residual', 'payment', 'service'];
  const money = {};
  const st = { type: 'lease', depositMode: 'net', timing: 'arrears' };
  const lead = SS.get('lead');
  const monthsEl = $('#i-months'), startEl = $('#i-start');
  const result = $('#result');
  let last = null, lastBody = null, seq = 0, timer = null, issued = null, firstRender = true;

  /* ---------- 입력 바인딩 ---------- */
  MONEY.forEach((k) => {
    const fd = $(`[data-f="${k}"]`);
    money[k] = bindMoney($('input', fd), { readEl: $('.field__read', fd), onInput: () => { clearErr(k); onChange(); } });
  });
  monthsEl.addEventListener('input', () => { monthsEl.value = monthsEl.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 3); if (+monthsEl.value > 120) monthsEl.value = '120'; clearErr('months'); onChange(); });
  startEl.value = today();
  startEl.addEventListener('change', () => { clearErr('startDate'); onChange(); });
  $('.input--date').addEventListener('click', () => { try { startEl.showPicker(); } catch (e) { startEl.focus(); } });
  $$('.chip').forEach((c) => c.addEventListener('click', () => { monthsEl.value = c.dataset.m; clearErr('months'); onChange(); }));

  function setType(t, silent) {
    st.type = t; const seg = $('#type'); seg.dataset.v = t;
    $$('button', seg).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === t)));
    const rent = t === 'rent';
    $('[data-l="price"]').textContent = rent ? '취득원가 · 렌트 원금' : '취득원가 · 리스원금';
    $('[data-s="price"]').textContent = rent ? '(차량가 + 부대비용)' : '(신차출고가 + 부대비용)';
    $('[data-l="residual"]').textContent = rent ? '인수가' : '잔존가치';
    $('[data-s="residual"]').textContent = rent ? '(만기 인수 시)' : '(만기 인수가)';
    $('[data-l="payment"]').textContent = rent ? '월 렌트료' : '월 리스료';
    $('[data-l="start"]').textContent = rent ? '렌트 시작일' : '리스 시작일';
    const svc = $('[data-f="service"]'); const was = svc.hidden; svc.hidden = !rent;
    if (rent && was) { svc.classList.remove('is-new'); void svc.offsetWidth; svc.classList.add('is-new'); }
    if (!silent) onChange();
  }
  $$('#type button').forEach((b) => b.addEventListener('click', () => setType(b.dataset.v)));
  $$('.mini-seg').forEach((g) => g.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    st[g.dataset.k] = b.dataset.v; $$('button', g).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); onChange();
  }));
  $('#reset').addEventListener('click', () => {
    MONEY.forEach((k) => money[k].set('')); monthsEl.value = ''; startEl.value = today(); $$('.field__err').forEach((e) => e.remove()); $$('.input.is-error').forEach((e) => e.classList.remove('is-error'));
    issued = null; onChange(); toast('계산 조건을 비웠어요');
    const ic = $('#reset svg'); ic.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-360deg)' }], { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)' });
  });
  $('#svcEst').addEventListener('click', async () => {
    const b = $('#svcEst'); b.disabled = true; b.textContent = '계산 중…';
    try {
      const r = await API.post('/calc/rent-service', { price: money.price.get() || 45000000 });
      money.service.set(r.monthly); onChange();
      toast(`보험 ${won(r.breakdown.insurance)} + 세금 ${won(r.breakdown.tax)} + 정비 ${won(r.breakdown.maintenance)}원 (월 추정)`);
    } catch (e) { toast('예상값을 불러오지 못했어요', 'info'); }
    b.disabled = false; b.textContent = '예상값 넣기';
  });

  /* ---------- 보조 표시 ---------- */
  function ratios() {
    const p = money.price.get();
    ['deposit', 'residual'].forEach((k) => { const el = $(`[data-ratio="${k}"]`), v = money[k].get(); const on = p > 0 && v > 0 && v < p; el.textContent = on ? `${Math.round(v / p * 100)}%` : ''; el.classList.toggle('is-on', on); });
    $$('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.m === monthsEl.value)));
    $('#basisSum').textContent = `${st.depositMode === 'net' ? '보증금 반영' : '보증금 미반영'} · ${st.timing === 'arrears' ? '후납' : '선납'}`;
  }
  function clearErr(k) { const fd = $(`[data-f="${k}"]`); if (!fd) return; $('.field__err', fd)?.remove(); $('.input', fd).classList.remove('is-error'); }
  function showErrs(fields) {
    Object.entries(fields || {}).forEach(([k, msg]) => { const fd = $(`[data-f="${k}"]`); if (!fd) return; clearErr(k); $('.input', fd).classList.add('is-error'); $('.input', fd).after(h(`<p class="field__err" role="alert">${esc(msg)}</p>`)); });
  }

  function body() {
    return { type: st.type, price: money.price.get(), prepay: money.prepay.get() || 0, deposit: money.deposit.get() || 0, residual: money.residual.get() || 0,
      months: +monthsEl.value || null, payment: money.payment.get(), service: st.type === 'rent' ? money.service.get() || 0 : 0, startDate: startEl.value,
      depositMode: st.depositMode, timing: st.timing, leadId: lead && lead.id };
  }
  const complete = (b) => b.price > 0 && b.months > 0 && b.payment > 0 && !!b.startDate;
  function save() { const b = body(); delete b.leadId; SS.set('calc', b); }

  function onChange() {
    ratios(); save();
    clearTimeout(timer);
    const b = body();
    if (!complete(b)) { seq++; if (last || !result.firstElementChild || result.dataset.v !== 'empty') renderEmpty(); last = null; peekEl && peekEl.classList.remove('is-on'); return; }
    timer = setTimeout(() => run(b), 450);
  }

  async function run(b) {
    const my = ++seq; lastBody = b;
    if (!last) renderLoading(); else { const s = $('.sum'); s && s.classList.add('is-busy'); }
    try {
      const r = await API.post('/calc/lease', b);
      if (my !== seq) return;
      const prev = last; last = r; issued = null;
      renderResult(r, prev);
    } catch (e) {
      if (my !== seq) return;
      if (e.status === 422 && e.code === 'PAYMENT_TOO_LOW') { last = null; renderLow(e.detail); }
      else if (e.status === 422) { last = null; showErrs(e.detail.fields); renderInvalid(); }
      else if (e.status === 0) showState('offline');
      else showState('error');
    }
  }

  /* ---------- 결과 영역 렌더 ---------- */
  const ICON_CALC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/></svg>';
  function renderEmpty() {
    result.dataset.v = 'empty';
    result.innerHTML = `
      <div class="res-empty res-empty--m">
        <div class="res-empty__ic">${ICON_CALC}</div>
        <h4>아직 계산 결과가 없어요</h4>
        <p>위 계산 조건에 차량가격 · 월 납입금 · 기간을 넣으면<br>금리와 총 이자비용을 바로 계산해 드려요.</p>
        <button class="btn btn--soft btn--md" type="button" data-sample>예시 값으로 계산해 보기</button>
      </div>
      <div class="res-empty res-empty--pc">
        <p>조건을 입력하면 회차별 상환표가 여기에 표시돼요.</p>
        <div><button class="btn btn--soft btn--md" type="button" data-sample>예시 값으로 계산해 보기</button></div>
      </div>`;
    $$('[data-sample]', result).forEach((b) => b.addEventListener('click', () => fill(SAMPLES[0])));
  }
  function renderLoading() {
    result.dataset.v = 'loading';
    const bar = (w, ht = 14, dk) => `<div class="skel${dk ? ' skel--dk' : ''}" style="height:${ht}px;width:${w}"></div>`;
    result.innerHTML = `
      <div class="res-loading"><span class="loading-pill"><span class="spinner"></span>금리를 계산하고 있어요</span></div>
      <div class="skel-card skel-card--dk">${bar('34%', 16, 1)}${bar('52%', 42, 1)}<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${bar('100%', 64, 1)}${bar('100%', 64, 1)}</div>${bar('100%', 10, 1)}</div>
      <div class="skel-card">${bar('40%', 18)}${Array.from({ length: 5 }, () => `<div class="skel-row">${bar('100%', 14)}${bar('100%', 14)}${bar('100%', 14)}${bar('100%', 14)}${bar('100%', 14)}</div>`).join('')}</div>`;
  }
  function renderLow(d) {
    result.dataset.v = 'low';
    result.innerHTML = `<div class="res-err" role="alert"><div class="res-err__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.01"/></svg></div>
      <div><h4>입력값이 서로 맞지 않아요</h4><p>${esc(d.message || '')} 월 납입금 합계가 원금보다 <b>${won(d.shortfall)}원</b> 부족해요.<br>잔존가치(인수가)·보증금·월 납입금을 계약서와 다시 맞춰 보세요.</p></div></div>`;
  }
  function renderInvalid() {
    result.dataset.v = 'invalid';
    result.innerHTML = `<div class="res-err" role="alert"><div class="res-err__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg></div><div><h4>확인이 필요한 항목이 있어요</h4><p>빨간색으로 표시된 칸을 고치면 바로 다시 계산해요.</p></div></div>`;
  }

  function renderResult(r, prev) {
    const rent = r.type === 'rent', payLabel = rent ? '월 렌트료' : '월 리스료';
    const c = r.compare, inp = r.input;
    let cmp = '';
    if (inp.deposit > 0 && r.input.depositMode === 'net' && c.withoutDeposit != null && Math.abs(c.withoutDeposit - r.rate) >= 0.01)
      cmp = `<div class="sum__cmp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg><span>보증금을 빼지 않고 계산하면 <b>연 ${c.withoutDeposit.toFixed(2)}%</b>로 낮게 보여요. 실제 부담은 <b>${(r.rate - c.withoutDeposit).toFixed(2)}%p</b> 더 높아요. <button type="button" data-why>왜 다른가요?</button></span></div>`;
    else if (inp.deposit > 0 && r.input.depositMode === 'ignore')
      cmp = `<div class="sum__cmp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg><span>시안 방식(보증금 미반영)으로 계산 중이에요. 보증금을 반영한 실제 금리는 <b>연 ${(c.withDeposit ?? 0).toFixed(2)}%</b>예요. <button type="button" data-net>반영해서 보기</button></span></div>`;
    else if (rent && c.rentGross != null)
      cmp = `<div class="sum__cmp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg><span>렌트료 전체로 역산하면 <b>연 ${c.rentGross.toFixed(2)}%</b>로 보이지만, 포함 비용 월 ${won(inp.service)}원을 빼면 금융 금리는 연 ${r.rate.toFixed(2)}%예요.</span></div>`;
    else if (rent && !inp.service)
      cmp = `<div class="sum__cmp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg><span>렌트료에 보험료·자동차세·정비비가 들어 있다면 금리가 실제보다 높게 나와요. <button type="button" data-svc>포함 비용 넣기</button></span></div>`;
    const notes = r.notes.filter((n) => !['DEPOSIT_NET', 'DEPOSIT_IGNORED', 'RENT_SERVICE_UNKNOWN'].includes(n.code));

    const keep = result.dataset.v === 'result' && prev;
    result.dataset.v = 'result';
    result.innerHTML = `
      <div class="sum">
        <div class="sum__main">
          <div>
            <div class="sum__top"><span class="sum__label">실제 적용 이율 (연)</span><span class="sum__chip">${inp.deposit > 0 ? (inp.depositMode === 'net' ? '보증금 반영' : '보증금 미반영') : rent ? '장기렌트' : '리스'} · ${r.timing === 'arrears' ? '후납' : '선납'}</span></div>
            <div class="sum__rate"><span data-rate>${keep ? prev.rate.toFixed(2) : '0.00'}</span><small>%</small></div>
            <div class="sum__sub">${payLabel} ${won(inp.payment)}원 · ${inp.months}개월</div>
          </div>
          <div class="sum__boxes">
            <div class="sum__box"><span>총 이자비용</span><b class="int" data-int>${won(keep ? prev.totalInterest : 0)}</b><b class="int">원</b></div>
            <div class="sum__box"><span>총 납부액 (${rent ? '렌트료' : '리스료'} × ${inp.months}회)</span><b data-paid>${won(keep ? prev.totalPaid : 0)}</b><b>원</b></div>
          </div>
        </div>
        <div class="sum__bar" aria-hidden="true"><i data-bp></i><i data-bi></i></div>
        <div class="sum__legend"><span>상환 원금 ${r.share.principal}%</span><span>이자 ${r.share.interest}%</span></div>
        ${cmp}
        ${notes.length ? `<ul class="sum__notes">${notes.map((n) => `<li>${esc(n.text)}</li>`).join('')}</ul>` : ''}
      </div>
      <div class="res-actions">
        <button class="btn btn--primary" type="button" id="openReport"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6" stroke-linecap="round"/></svg>금리 분석 보고서 보기</button>
        <button class="btn btn--ghost" type="button" id="copyLink"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg><span>링크 복사</span></button>
      </div>
      <div class="pane">
        <div class="pane__head"><h4>회차별 원금 · 이자 구성</h4><div class="legend"><span><i style="background:#3E8A6E"></i>납입원금</span><span><i style="background:#C9523A"></i>납입이자</span></div></div>
        <div class="chart" id="chart"><canvas></canvas><div class="chart__tip"></div></div>
        <div class="chart__x"><span>1회차</span><span>${Math.ceil(inp.months / 2)}회차</span><span>${inp.months}회차</span></div>
      </div>
      <div class="pane">
        <div class="pane__head"><h4>회차별 상환표 <small>단위 : 원</small></h4><div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-tab="round">회차별</button><button type="button" role="tab" aria-selected="false" data-tab="year">연도별</button></div></div>
        <div class="tbl-wrap" id="tblWrap"></div>
        <p class="tbl-foot">마지막 잔금은 ${inp.depositMode === 'net' && inp.deposit > 0 ? `잔존가치 − 보증금 = <b>만기 인수 시 납부액 ${won(r.residualPay)}원</b>이에요.` : '잔존가치(만기 인수가)예요.'} 리스 기간 ${r.period.start} ~ ${r.period.lastPayment} (마지막 납입일)</p>
      </div>`;

    // 숫자 카운트업 · 막대
    const rateEl = $('[data-rate]', result);
    const from = keep ? prev.rate : 0;
    if (reduce()) rateEl.textContent = r.rate.toFixed(2);
    else { const t0 = performance.now(); const step = (t) => { const p = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - p, 3); rateEl.textContent = (from + (r.rate - from) * e).toFixed(2); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
    countUp($('[data-int]', result), r.totalInterest); countUp($('[data-paid]', result), r.totalPaid);
    requestAnimationFrame(() => setTimeout(() => { $('[data-bp]', result).style.width = r.share.principal + '%'; $('[data-bi]', result).style.width = r.share.interest + '%'; }, 60));

    $('[data-why]', result)?.addEventListener('click', () => whySheet(r));
    $('[data-net]', result)?.addEventListener('click', () => { $('.mini-seg[data-k="depositMode"] [data-v="net"]').click(); });
    $('[data-svc]', result)?.addEventListener('click', () => { $('#i-service').focus(); $('#svcEst').click(); });
    $('#openReport').addEventListener('click', openReport);
    $('#copyLink').addEventListener('click', copyLink);
    drawChart(r);
    let tab = 'round', all = false;
    const renderTbl = (animate) => {
      $('#tblWrap').innerHTML = table(r, tab, all, animate);
      const more = $('[data-more]', result); more && more.addEventListener('click', () => { all = true; renderTbl(false); });
      $$('.m-row', result).forEach((tr) => { const tog = () => { const det = tr.nextElementSibling, open = det.hidden; det.hidden = !open; tr.setAttribute('aria-expanded', String(open)); }; tr.addEventListener('click', tog); tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } }); });
    };
    let mq = window.matchMedia('(max-width: 480px)').matches;
    window.addEventListener('resize', () => { const n = window.matchMedia('(max-width: 480px)').matches; if (n !== mq) { mq = n; renderTbl(false); } });
    $$('.tabs button', result).forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; $$('.tabs button', result).forEach((x) => x.setAttribute('aria-selected', String(x === b))); renderTbl(true); }));
    renderTbl(firstRender);
    firstRender = false;
    peek(r);
  }

  /* 모바일: 결과가 화면 밖이면 금리 미리보기 알약 → 탭하면 결과로 */
  let peekEl, peekIO;
  function peek(r) {
    if (innerWidth >= 960) return;
    if (!peekEl) {
      peekEl = h('<button class="peek" type="button" aria-live="polite"></button>'); document.body.appendChild(peekEl);
      peekEl.addEventListener('click', () => { $('.sum').scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' }); });
      peekIO = new IntersectionObserver(([en]) => peekEl.classList.toggle('is-on', !en.isIntersecting && !!last), { threshold: 0.15 });
    }
    peekEl.innerHTML = `<span>실제 금리</span><b>연 ${r.rate.toFixed(2)}%</b><em>결과 보기</em><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>`;
    peekIO.disconnect(); peekIO.observe($('.sum'));
  }

  function table(r, tab, all, animate) {
    const rent = r.type === 'rent';
    if (tab === 'year') {
      return `<table class="tbl"><thead><tr><th>연도</th><th>납입 회차</th><th>상환 원금</th><th>이자</th><th>연말 잔금</th></tr></thead><tbody>${r.yearly.map((y, i) => `<tr class="${animate ? 'rv' : ''}" style="animation-delay:${i * 40}ms"><td>${y.year}년</td><td>${y.count}회</td><td>${won(y.principal)}</td><td class="c-int">${won(y.interest)}</td><td class="c-bal">${won(y.balance)}</td></tr>`).join('')}</tbody></table>`;
    }
    const rows = all ? r.schedule : r.schedule.slice(0, 12);
    if (window.matchMedia('(max-width: 480px)').matches) {
      return `<table class="tbl tbl--m"><thead><tr><th>회차</th><th>상환 원금</th><th>이자</th><th aria-label="자세히"></th></tr></thead><tbody>${rows.map((x, i) => `<tr class="m-row ${x.closing ? 'is-close' : ''} ${animate && i < 14 ? 'rv' : ''}" style="animation-delay:${i * 28}ms" tabindex="0" aria-expanded="false"><td>${x.closing ? '만기' : x.no}<small>${x.date.slice(2).replace(/-/g, '.')}</small></td><td>${won(x.principal)}</td><td class="c-int">${won(x.interest)}</td><td class="c-arr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></td></tr><tr class="m-det" hidden><td colspan="4"><dl><div><dt>상환일</dt><dd>${x.date}</dd></div><div><dt>상환금(월)</dt><dd>${x.closing ? '-' : won(x.payment)}</dd></div><div><dt>원금 누계</dt><dd>${won(x.cumPrincipal)}</dd></div><div><dt>잔금</dt><dd><b>${won(x.balance)}</b></dd></div></dl></td></tr>`).join('')}</tbody></table>${!all && r.schedule.length > 12 ? `<button class="tbl-more" type="button" data-more>전체 ${r.schedule.length}회차 보기</button>` : ''}`;
    }
    return `<table class="tbl"><thead><tr><th>회차</th><th>상환일</th><th>납입원금</th><th>납입이자</th><th>원금 누계</th><th>상환금 (월)</th><th>잔금</th></tr></thead><tbody>${rows.map((x, i) => `<tr class="${x.closing ? 'is-close' : ''} ${animate && i < 14 ? 'rv' : ''}" style="animation-delay:${i * 28}ms"><td>${x.closing ? '만기' : x.no}</td><td class="c-date">${x.date}</td><td>${won(x.principal)}</td><td class="c-int">${won(x.interest)}</td><td>${won(x.cumPrincipal)}</td><td>${x.closing ? '-' : won(x.payment)}</td><td class="c-bal">${won(x.balance)}</td></tr>`).join('')}</tbody></table>${!all && r.schedule.length > 12 ? `<button class="tbl-more" type="button" data-more>전체 ${r.schedule.length}회차 보기</button>` : ''}`;
  }

  /* ---------- 그래프 (canvas · dpr 대응 · 0에서 자라기) ---------- */
  let chartRaf;
  function drawChart(r) {
    const box = $('#chart'), cv = $('canvas', box), tip = $('.chart__tip', box);
    const rows = r.schedule.filter((x) => !x.closing);
    const max = Math.max(...rows.map((x) => x.principal + x.interest));
    let hover = -1, prog = reduce() ? 1 : 0;
    const paint = () => {
      const dpr = window.devicePixelRatio || 1, W = box.clientWidth, H = box.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; const g = cv.getContext('2d'); g.scale(dpr, dpr); g.clearRect(0, 0, W, H);
      g.strokeStyle = '#EEF0EC'; g.lineWidth = 1;
      for (let i = 1; i <= 3; i++) { const y = Math.round(H - (H - 8) * i / 3) + .5; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      const n = rows.length, gap = n > 60 ? 1 : 2, bw = Math.max(1.5, (W - gap * (n - 1)) / n);
      rows.forEach((x, i) => {
        const local = Math.min(1, Math.max(0, prog * 1.35 - (i / n) * 0.35));
        const e = 1 - Math.pow(1 - local, 3);
        const hp = (x.principal / max) * (H - 8) * e, hi = (x.interest / max) * (H - 8) * e, X = i * (bw + gap);
        g.globalAlpha = hover === -1 || hover === i ? 1 : 0.45;
        g.fillStyle = '#3E8A6E'; g.fillRect(X, H - hp, bw, hp);
        g.fillStyle = '#C9523A'; g.fillRect(X, H - hp - hi, bw, hi);
      });
      g.globalAlpha = 1;
    };
    const start = performance.now();
    cancelAnimationFrame(chartRaf);
    const loop = (t) => { prog = reduce() ? 1 : Math.min(1, (t - start) / 900); paint(); if (prog < 1) chartRaf = requestAnimationFrame(loop); };
    chartRaf = requestAnimationFrame(loop);
    const at = (ev) => { const rc = box.getBoundingClientRect(); const i = Math.floor((ev.clientX - rc.left) / rc.width * rows.length); return Math.max(0, Math.min(rows.length - 1, i)); };
    box.onpointermove = (ev) => {
      const i = at(ev); if (i === hover) return; hover = i; paint();
      const x = rows[i], rc = box.getBoundingClientRect();
      tip.innerHTML = `${x.no}회차 · ${x.date}<br><b>원금 ${won(x.principal)}</b> · <em>이자 ${won(x.interest)}</em>`;
      const cx = (i + .5) / rows.length * rc.width; tip.style.left = Math.max(70, Math.min(rc.width - 70, cx)) + 'px'; tip.style.top = '8px'; tip.classList.add('is-on');
    };
    box.onpointerleave = () => { hover = -1; tip.classList.remove('is-on'); paint(); };
    window.onresize = () => paint();
  }

  /* ---------- 보고서 · 링크 ---------- */
  async function issue() {
    const key = JSON.stringify(lastBody);
    if (issued && issued.key === key) return issued;
    const r = await API.post('/reports', { leadId: lead && lead.id, input: lastBody });
    issued = { ...r, key }; return issued;
  }
  async function openReport() {
    const b = $('#openReport'); b.disabled = true; b.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,.35);border-top-color:#fff"></span>보고서를 만들고 있어요';
    try { const r = await issue(); location.href = 'report.html?t=' + r.token; }
    catch (e) { b.disabled = false; b.textContent = '금리 분석 보고서 보기'; toast(e.status === 0 ? '인터넷 연결을 확인해 주세요' : '보고서를 만들지 못했어요. 다시 눌러 주세요', 'info'); }
  }
  async function copyLink() {
    const b = $('#copyLink'), label = $('span', b);
    try {
      const r = await issue();
      const url = new URL('report.html?t=' + r.token, location.href).href;
      await copy(url);
      label.textContent = '복사됨'; b.classList.add('copy-ok');
      toast('보고서 링크를 복사했어요 · 30일 동안 열 수 있어요');
      setTimeout(() => { label.textContent = '링크 복사'; b.classList.remove('copy-ok'); }, 2200);
    } catch (e) { toast('링크를 만들지 못했어요', 'info'); }
  }

  /* ---------- 왜 다른가요? ---------- */
  function whySheet(r) {
    const i = r.input, a = r.compare.withoutDeposit, n = r.rate;
    sheet({ title: '보증금을 넣으면 왜 금리가 올라가나요?', body: `
      <div class="why">
        <div class="why__col"><span class="why__tag">보증금 미반영 (시안 방식)</span><b>연 ${a.toFixed(2)}%</b>
          <ul><li>빌린 돈 <em>${won(i.price - i.prepay)}원</em></li><li>매달 ${won(i.payment)}원 × ${i.months}회</li><li>만기 잔금 <em>${won(i.residual)}원</em></li></ul></div>
        <div class="why__col is-real"><span class="why__tag">실제 현금흐름</span><b>연 ${n.toFixed(2)}%</b>
          <ul><li>처음에 보증금 <em>${won(i.deposit)}원</em>을 냄 → 실제로 빌린 돈 <em>${won(r.financed)}원</em></li><li>매달 ${won(i.payment)}원 × ${i.months}회</li><li>만기에 <em>${won(r.residualPay)}원</em>만 내면 인수 (잔존가치 − 보증금)</li></ul></div>
      </div>
      <p class="why__p">두 방식 모두 총 이자는 <b>${won(r.totalInterest)}원</b>으로 같아요. 하지만 보증금만큼 리스사가 돈을 덜 빌려준 셈이라, <b>더 적은 돈에 같은 이자</b>를 내는 것 — 그래서 실제 금리가 ${(n - a).toFixed(2)}%p 높아요.</p>
      <p class="why__p why__p--s">보증금은 리스사가 만기까지 이자 없이 보관했다가 잔존가치와 상계(또는 반환)하는 돈이에요. 계약서의 「보증금」·「잔존가치」 항목으로 확인할 수 있어요.</p>` });
  }

  /* ---------- 페이지 상태 (오프라인·오류) ---------- */
  function showState(kind) {
    const ps = $('#pageState');
    document.body.classList.add('has-state');
    if (kind === 'offline') { $('#offlineBar').hidden = false; document.body.classList.add('has-offline'); }
    ps.innerHTML = kind === 'offline' ? `
      <div class="state"><div class="state__ic"><svg viewBox="0 0 24 24" fill="none" stroke="#3E4440" stroke-width="2.2" stroke-linecap="round"><path d="M2 8.8a15 15 0 0 1 4.2-2.6M9.6 5.2A15 15 0 0 1 22 8.8M5 12.5a10 10 0 0 1 4.6-2.4M15 10.4a10 10 0 0 1 4 2.1M8.5 16a5 5 0 0 1 7 0M12 20h.01M3 3l18 18"/></svg></div>
        <h2>인터넷 연결이 끊겼어요</h2><p>와이파이나 모바일 데이터 연결을 확인한 뒤<br>다시 시도해 주세요.</p><p><strong>입력하신 계산 조건은 그대로 남아 있어요.</strong></p>
        <button class="btn btn--primary" type="button" data-retry><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4h-4"/></svg>다시 시도</button></div>`
      : `<div class="state"><div class="state__ic state__ic--err"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l9.5 16h-19z"/><path d="M12 10v4.5M12 17.5v.01"/></svg></div>
        <h2>잠시 문제가 생겼어요</h2><p>일시적인 오류로 계산 결과를 불러오지 못했어요.<br>잠시 후 다시 시도해 주세요.</p>
        <button class="btn btn--primary" type="button" data-retry><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4h-4"/></svg>다시 시도</button>
        <div class="state__box">궁금하신 사항이 있으시면<br>관리자 전화 <b>1600-0000</b>로 문의 주세요.</div>
        <p class="state__code">오류 코드 500 · 문의 시 알려 주시면 빠르게 확인해 드려요</p></div>`;
    ps.hidden = false;
    $('[data-retry]', ps).focus({ preventScroll: true });
    $('[data-retry]', ps).addEventListener('click', async (e) => {
      const b = e.currentTarget; b.disabled = true; b.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,.35);border-top-color:#fff"></span>다시 시도하는 중';
      hideState(); if (lastBody) run(lastBody);
    });
  }
  function hideState() { $('#pageState').hidden = true; document.body.classList.remove('has-state', 'has-offline'); $('#offlineBar').hidden = true; }
  window.addEventListener('offline', () => { $('#offlineBar').hidden = false; document.body.classList.add('has-offline'); });
  window.addEventListener('online', () => { const wasState = !$('#pageState').hidden; hideState(); toast('다시 연결됐어요'); if (wasState && lastBody) run(lastBody); });

  /* ---------- 예시 값 ---------- */
  const SAMPLES = [
    { type: 'lease', price: 80000000, prepay: 0, deposit: 24000000, residual: 40000000, months: 48, payment: 1250000, startDate: '2026-10-20' },
    { type: 'lease', price: 73151810, prepay: 0, deposit: 0, residual: 28511000, months: 60, payment: 999430, startDate: '2024-05-24' },
    { type: 'rent', price: 45200000, prepay: 0, deposit: 0, residual: 27120000, months: 48, payment: 649660, service: 0, startDate: '2024-09-15' },
    { type: 'lease', price: 80000000, prepay: 0, deposit: 0, residual: 40000000, months: 48, payment: 500000, startDate: '2026-10-20' },
  ];
  function fill(s) {
    setType(s.type, true);
    MONEY.forEach((k) => money[k].set(s[k] || ''));
    monthsEl.value = s.months; startEl.value = s.startDate;
    $$('.field__err').forEach((e) => e.remove()); $$('.input.is-error').forEach((e) => e.classList.remove('is-error'));
    $$('.cond .input').forEach((el, i) => el.animate([{ backgroundColor: '#E6F1EC' }, { backgroundColor: '#fff' }], { duration: 700, delay: i * 40 }));
    onChange();
    if (innerWidth < 960) setTimeout(() => $('.calc__right').scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' }), 300);
  }

  /* ---------- 승계 상담 ---------- */
  const openConsult = (e) => { e && e.preventDefault(); Consult.open({ lead, lease: lastBody, type: st.type }); };
  $('#ctaTransfer').addEventListener('click', openConsult);
  $('#bn2').addEventListener('click', openConsult);

  /* ---------- 시작 ---------- */
  const saved = SS.get('calc');
  if (saved && complete(saved)) { setType(saved.type || 'lease', true); MONEY.forEach((k) => money[k].set(saved[k] || '')); monthsEl.value = saved.months; startEl.value = saved.startDate || today(); st.depositMode = saved.depositMode || 'net'; st.timing = saved.timing || 'arrears';
    $$('.mini-seg').forEach((g) => $$('button', g).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === st[g.dataset.k])))); }
  else if (lead && lead.rental) { setType('rent', true); setTimeout(() => toast(`‘${lead.plate.replace(/^\D*\d+(\D)\d+$/, '$1')}’ 번호는 렌터카예요 · 장기렌트로 맞춰 뒀어요`), 500); }
  renderEmpty(); ratios();
  const qs = new URLSearchParams(location.search);
  if (qs.has('demo')) setTimeout(() => fill(SAMPLES[+qs.get('demo') - 1] || SAMPLES[0]), 250);
  else if (saved && complete(saved)) onChange();

  window.DEMO_HOOKS = {
    states: {
      '빈 화면': () => $('#reset').click(),
      '로딩': () => { if (!complete(body())) fill(SAMPLES[0]); setTimeout(() => { last = null; API.inject('slow'); run(body()); }, 520); },
      '오프라인': () => { if (!complete(body())) fill(SAMPLES[0]); setTimeout(() => { API.inject('offline'); run(body()); }, 520); },
      '오류 500': () => { if (!complete(body())) fill(SAMPLES[0]); setTimeout(() => { API.inject('error'); run(body()); }, 520); },
    },
    actions: {
      '시안 예시 ① 보증금 30%': () => fill(SAMPLES[0]),
      '시안 예시 ② 60개월': () => fill(SAMPLES[1]),
      '장기렌트(허 번호)': () => fill(SAMPLES[2]),
      '입력 모순': () => fill(SAMPLES[3]),
      '승계 상담 신청': openConsult,
    },
  };
})();
