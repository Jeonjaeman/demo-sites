/* 금리 분석 보고서 뷰어 — 서버가 준 스냅샷을 A4로 배치만 한다 (계산식 없음) */
(function () {
  'use strict';
  const { $, $$, h, esc, won, dot, toast, copy, SS, reduce } = LTL;
  const qs = new URLSearchParams(location.search);
  const t = qs.get('t') || '';
  const sheetsEl = $('#sheets');
  const ROWS_PER = 30;
  let data = null, fit = 1, zoom = 1;

  const admin = SS.get('admin');
  if (admin) { const b = $('#back'); b.href = 'admin/customers.html'; $('span', b).textContent = '관리자 화면'; }
  else if (!SS.get('lead')) { const b = $('#back'); b.href = 'calc.html'; $('span', b).textContent = '내 금리 계산'; }

  async function load(verified) {
    sheetsEl.innerHTML = `<div class="rp-wrap" style="--i:0;width:${794 * fitScale()}px;height:${1123 * fitScale()}px"><div class="a4" style="transform:scale(${fitScale()})"><div class="skel" style="height:28px;width:40%"></div><div class="skel" style="height:150px;margin-top:28px"></div><div class="skel" style="height:60px;margin-top:16px"></div><div class="skel" style="height:280px;margin-top:22px"></div></div></div>`;
    try {
      data = await API.get('/reports/' + encodeURIComponent(t) + (verified ? '?verified=' + verified : ''));
      render();
      return true;
    } catch (e) {
      if (e.status === 404 || e.status === 410) missing(e.status);
      else if (e.status === 0) { sheetsEl.innerHTML = `<div class="state"><div class="state__ic"><svg viewBox="0 0 24 24" fill="none" stroke="#3E4440" stroke-width="2.2" stroke-linecap="round"><path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01M3 3l18 18"/></svg></div><h2>인터넷 연결이 끊겼어요</h2><p>연결을 확인한 뒤 다시 시도해 주세요.</p><button class="btn btn--primary" type="button" onclick="location.reload()">다시 시도</button></div>`; }
      else sheetsEl.innerHTML = `<div class="state"><div class="state__ic state__ic--err"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 4l9.5 16h-19z"/><path d="M12 10v4.5M12 17.5v.01" stroke-linecap="round"/></svg></div><h2>잠시 문제가 생겼어요</h2><p>보고서를 불러오지 못했어요.</p><button class="btn btn--primary" type="button" onclick="location.reload()">다시 시도</button><p class="state__code">오류 코드 ${e.status}</p></div>`;
      return false;
    }
  }

  function missing(code) {
    document.body.classList.add('is-missing');
    document.title = '링크를 찾을 수 없어요 · 리스승계연구소';
    $('#view').outerHTML = `<main class="rp-missing"><div class="state">
      <div class="state__ic state__ic--sq"><svg viewBox="0 0 24 24" fill="none" stroke="#163E30" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 14.5l5-5M8 11l-2.2 2.2a3.5 3.5 0 0 0 5 5L13 16M16 13l2.2-2.2a3.5 3.5 0 0 0-5-5L11 8M4 4l16 16"/></svg></div>
      <h2>${code === 410 ? '보관 기간이 지난 보고서예요' : '링크를 찾을 수 없어요'}</h2>
      <p>${code === 410 ? '공유 링크는 발급일로부터 30일 동안만 열려요.<br>개인정보 보호를 위해 기간이 지나면 열 수 없어요.' : '링크 주소가 잘못됐거나<br>보관 기간이 지나 열 수 없는 보고서예요.'}<br>보고서를 보낸 분께 새 링크를 요청해 주세요.</p>
      <a class="btn btn--primary" href="calc.html">내 금리 직접 계산해 보기</a>
      <p class="state__tel">궁금하신 사항이 있으시면<br>관리자 전화 <b>1600-0000</b>로 문의 주세요.</p></div></main>`;
  }

  /* ---------- A4 시트 구성 ---------- */
  function head(d, r) {
    return `<div class="sh-head"><div><img src="assets/img/logo.png" alt="리스승계연구소"><h2>내 ${r.type === 'rent' ? '장기렌트' : '리스'} 금리 분석 보고서</h2></div>
      <div class="sh-meta"><b>${esc(d.name)} 귀하</b>차량번호 <strong>${esc(d.plate)}</strong> · 작성일 ${dot(d.createdAt).replace(/\./g, '. ').replace(/\. (\d)$/, '. $1')}<br>계산 방식 · ${esc(r.method.replace('월 납입금으로 ', `${r.type === 'rent' ? '월 렌트료' : '월 리스료'}로 `))}</div></div>`;
  }
  function foot(i, n) {
    return `<div class="sh-foot"><span>본 보고서는 입력값 기준 원리금균등 방식의 추정치이며, 실제 리스사 계약 조건(수수료 · 납입 시점 · 일할 이자 등)과 다를 수 있습니다.<br>계산은 서버에서 처리되며 보고서에는 결과만 담깁니다. · 링크 보관 ${dot(data.expiresAt)}까지</span><b>${i} / ${n}</b></div>`;
  }
  function build() {
    const d = data, r = d.result, inp = r.input, pay = r.type === 'rent' ? '월 렌트료' : '월 리스료';
    const rows = r.schedule;
    const tablePages = Math.max(1, Math.ceil(rows.length / ROWS_PER));
    const N = 1 + tablePages;
    const pct = (v) => (inp.price > 0 ? Math.round(v / inp.price * 100) : 0);
    const alert = inp.deposit > 0 && inp.depositMode === 'net'
      ? `<div class="sh-alert">보증금 <b>${won(inp.deposit)}원</b>을 리스사가 만기까지 무이자로 보유하는 실제 현금흐름으로 계산했어요. 보증금을 원금에서 빼지 않으면 연 ${r.compare.withoutDeposit.toFixed(2)}%로 낮게 보이지만, 같은 이자를 더 적은 돈에 내는 것이라 실제 금리는 <b>연 ${r.rate.toFixed(2)}%</b>예요.</div>`
      : inp.deposit > 0 ? `<div class="sh-alert">이 보고서는 보증금을 원금에서 빼지 않은 방식(보증금 미반영)으로 계산했어요. 보증금을 반영한 실제 금리는 <b>연 ${(r.compare.withDeposit ?? 0).toFixed(2)}%</b>예요.</div>` : '';
    const p1 = `<div class="a4">${head(d, r)}
      <div class="sh-kpi">
        <div class="sh-rate"><span>실제 적용 이율 (연)</span><b>${r.rate.toFixed(2)}<small>%</small></b><em>${pay} ${won(inp.payment)}원 · ${inp.months}개월</em></div>
        <div class="sh-boxes"><div class="sh-box"><span>총 이자비용</span><b class="red">${won(r.totalInterest)}원</b></div><div class="sh-box"><span>총 납부액 (${pay} × ${inp.months}회)</span><b>${won(r.totalPaid)}원</b></div></div>
      </div>
      <div class="sh-sum">${pay} ${won(inp.payment)}원 기준으로 계산한 실제 적용 이율은 연 ${r.rate.toFixed(2)}%이며,<br>계약기간 ${inp.months}개월 동안 부담하는 총 이자비용은 ${won(r.totalInterest)}원입니다.</div>
      ${alert}
      <div class="sh-cols">
        <div><p class="sh-sec"><i>1</i>계약 조건</p><dl class="sh-dl">
          <div><dt>취득원가</dt><dd>${won(inp.price)}원</dd></div>
          <div><dt>선납금</dt><dd>${won(inp.prepay)}원</dd></div>
          <div><dt>보증금</dt><dd>${won(inp.deposit)}원 <small>(${pct(inp.deposit)}%)</small></dd></div>
          <div><dt>${r.type === 'rent' ? '인수가' : '잔존가치'}</dt><dd>${won(inp.residual)}원 <small>(${pct(inp.residual)}%)</small></dd></div>
          <div><dt>계약기간</dt><dd>${inp.months}개월</dd></div>
          <div><dt>${r.type === 'rent' ? '렌트' : '리스'} 기간</dt><dd>${r.period.start} ~ ${r.period.lastPayment}</dd></div>
          <div><dt>${pay}</dt><dd>${won(inp.payment)}원</dd></div>
          ${r.type === 'rent' && inp.service ? `<div><dt>포함 비용(보험·세금·정비)</dt><dd>월 ${won(inp.service)}원</dd></div>` : ''}
        </dl></div>
        <div><p class="sh-sec"><i>2</i>비용 구성</p><dl class="sh-dl">
          <div><dt>총 납부액 (${pay} 합계)</dt><dd>${won(r.totalPaid)}원</dd></div>
          <div><dt>기간 중 상환 원금</dt><dd>${won(r.principalRepaid)}원</dd></div>
          <div><dt>총 이자비용</dt><dd class="red">${won(r.totalInterest)}원</dd></div>
          ${r.servicePaid ? `<div><dt>포함 비용 합계</dt><dd>${won(r.servicePaid)}원</dd></div>` : ''}
          <div><dt>만기 인수 시 납부</dt><dd>${won(Math.max(r.residualPay, 0))}원</dd></div>
          <div><dt>인수 시 총 비용</dt><dd>${won(r.buyTotal)}원</dd></div>
        </dl>
        <div class="sh-bar"><i style="width:${r.share.principal}%"></i><i style="width:${r.share.interest}%"></i></div>
        <div class="sh-bar-l"><span>상환 원금 ${r.share.principal}%</span><span>이자 ${r.share.interest}%</span></div></div>
      </div>
      <p class="sh-sec" style="margin-top:18px"><i>3</i>연도별 납부 요약 <small>(단위 : 원)</small></p>
      <table class="sh-tbl"><thead><tr><th>연도</th><th>상환 원금</th><th>이자</th><th>연말 잔금</th></tr></thead><tbody>
        ${r.yearly.map((y) => `<tr><td><b>${y.year}년</b><small>${String(y.count).padStart(2, '0')}회</small></td><td>${won(y.principal)}</td><td class="red">${won(y.interest)}</td><td>${won(y.balance)}</td></tr>`).join('')}
      </tbody></table>
      ${foot(1, N)}</div>`;
    const pages = [p1];
    for (let k = 0; k < tablePages; k++) {
      const slice = rows.slice(k * ROWS_PER, (k + 1) * ROWS_PER);
      pages.push(`<div class="a4">${head(d, r)}
        <p class="sh-sec" style="margin-top:20px"><i>4</i>회차별 상환표 <small>(단위 : 원 · 마지막 잔금은 ${inp.deposit > 0 && inp.depositMode === 'net' ? '잔존가치 − 보증금' : '잔존가치'})${tablePages > 1 ? ` · ${k + 1}/${tablePages}` : ''}</small></p>
        <table class="sh-tbl sh-tbl--rounds"><thead><tr><th>회차</th><th>납입일</th><th>${pay}</th><th>상환 원금</th><th>이자</th><th>잔금</th></tr></thead><tbody>
        ${slice.map((x) => `<tr><td>${x.closing ? '만기' : x.no}</td><td>${x.date}</td><td>${x.closing ? '-' : won(x.payment)}</td><td>${won(x.principal)}</td><td class="red">${won(x.interest)}</td><td>${won(x.balance)}</td></tr>`).join('')}
        </tbody></table>${foot(k + 2, N)}</div>`);
    }
    return pages;
  }

  function fitScale() { const avail = Math.min(innerWidth, 1000) - (innerWidth < 768 ? 32 : 64); return Math.min(1, avail / 794); }
  function render() {
    const pages = build();
    $('#pages').textContent = `A4 · ${pages.length}장`;
    fit = fitScale();
    sheetsEl.innerHTML = pages.map((p, i) => `<div class="rp-wrap" style="--i:${i}">${p}</div>`).join('');
    applyZoom();
    verifyBox();
  }
  function applyZoom() {
    const s = fit * zoom;
    $$('.rp-wrap', sheetsEl).forEach((w) => { w.style.width = 794 * s + 'px'; w.style.height = 1123 * s + 'px'; $('.a4', w).style.transform = `scale(${s})`; });
    $('#zv').value = Math.round(zoom * 100) + '%';
    $('#zv').textContent = Math.round(zoom * 100) + '%';
  }
  const STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5];
  function setZoom(dir) {
    let i = STEPS.findIndex((z) => Math.abs(z - zoom) < 0.01); if (i < 0) i = 2;
    const n = STEPS[Math.max(0, Math.min(STEPS.length - 1, i + dir))];
    if (n === zoom) { $('#zoom').animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 260 }); return; }
    const view = $('#view'); const cx = (view.scrollLeft + view.clientWidth / 2) / (view.scrollWidth || 1); const cy = (scrollY + innerHeight / 2) / document.documentElement.scrollHeight;
    zoom = n; applyZoom();
    view.scrollLeft = cx * view.scrollWidth - view.clientWidth / 2;
    window.scrollTo({ top: cy * document.documentElement.scrollHeight - innerHeight / 2 });
  }
  $$('#zoom [data-z]').forEach((b) => b.addEventListener('click', () => setZoom(+b.dataset.z)));
  $('#zv').addEventListener('click', () => { zoom = 1; applyZoom(); });
  window.addEventListener('wheel', (e) => { if (!e.ctrlKey || !data) return; e.preventDefault(); setZoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });
  window.addEventListener('keydown', (e) => { if (!data || e.target.closest('input')) return; if (e.key === '+' || e.key === '=') setZoom(1); if (e.key === '-') setZoom(-1); if (e.key === '0') { zoom = 1; applyZoom(); } });
  let rT; window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { if (data) { fit = fitScale(); applyZoom(); } }, 120); });

  /* ---------- 본인 확인 (공유 링크) ---------- */
  function verifyBox() {
    const v = $('#verify');
    if (!data.masked) { v.hidden = true; return; }
    v.hidden = false;
    v.innerHTML = `<div class="rp-verify__in"><p><b>공유 링크로 열린 보고서예요.</b> 개인정보 보호를 위해 이름·차량번호 일부를 가렸어요. 본인이라면 전화번호 뒤 4자리로 확인해 주세요.</p>
      <form novalidate><input inputmode="numeric" maxlength="4" placeholder="0000" aria-label="전화번호 뒤 4자리"><button class="btn btn--primary" type="submit">확인</button></form></div>`;
    $('form', v).addEventListener('submit', async (e) => {
      e.preventDefault(); const val = $('input', v).value.replace(/\D/g, '');
      if (val.length !== 4) { $('input', v).classList.add('shake'); setTimeout(() => $('input', v).classList.remove('shake'), 450); return; }
      const before = data;
      try { data = await API.get('/reports/' + encodeURIComponent(t) + '?verified=' + val); } catch (err) { data = before; }
      if (data.masked) { toast('번호가 맞지 않아요', 'info'); $('input', v).value = ''; return; }
      render(); toast('본인 확인이 됐어요');
    });
  }

  /* ---------- 상단 버튼 ---------- */
  $('#copy').addEventListener('click', async () => {
    const b = $('#copy'), sp = $('span', b);
    await copy(location.href.replace(/[?&]verified=\d+/, ''));
    sp.textContent = '복사됨'; b.classList.add('is-done');
    toast(data ? `링크를 복사했어요 · ${dot(data.expiresAt)}까지 열 수 있어요` : '링크를 복사했어요');
    setTimeout(() => { sp.textContent = '링크 복사'; b.classList.remove('is-done'); }, 2000);
  });
  $('#print').addEventListener('click', () => { const z = zoom; window.print(); zoom = z; });
  $('#ctaTransfer').addEventListener('click', () => Consult.open({}));

  load();
  window.DEMO_HOOKS = {
    states: { '없는 링크': () => { location.href = 'report.html?t=wrongLink123'; }, '만료 링크': () => { location.href = 'report.html?t=Exp1redLinkSample0000'; } },
    actions: { '본인 확인 (뒤 4자리 2929)': () => { const i = $('#verify input'); if (i) { i.value = '2929'; $('#verify form').requestSubmit(); } else toast('이미 전체가 보이는 보고서예요'); }, '확대': () => setZoom(1), '축소': () => setZoom(-1) },
  };
})();
