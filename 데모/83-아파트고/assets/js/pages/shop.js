/* C-15 장바구니 · C-16 주문서·결제 · C-17 결제 진행/입금 대기 · C-18 결제 완료 · C-19 결제 실패
   법적 UI(F2·F3): 첫 화면부터 VAT 포함 총액 · 선택 동의 기본 미체크 · 청약철회 제한 고지 + 명시 동의(미체크 시 결제 불가) · 최종 확인(정정 기회) · 버튼 라벨에 최종 금액 · 동의 시각·IP 기록 */
(function () {
  const { $, $$, esc, icon, fmt, qs } = UI;
  UI.init();
  const main = $('#main');
  const page = document.body.dataset.page;
  const prof = Store.get('profile');
  const F = APT.FORMATS;

  function effectiveCart() { return Store.get('cart').filter(it => !Store.purchasedItem(it.typeId) || it.keep); }
  function totals() { return APT.calc.cartTotal(effectiveCart(), APT.types); }
  function summary(tt, cta) {
    return `<div class="summary"><h3 class="h3">결제 금액</h3>
      <div class="sm-row"><span>도면 ${effectiveCart().length}건${Store.get('cart').length !== effectiveCart().length ? ` <span class="micro">(구매분 ${Store.get('cart').length - effectiveCart().length}건 제외)</span>` : ''}</span><span>${fmt.won(tt.subtotal)}</span></div>
      ${tt.discount ? `<div class="sm-row disc"><span>묶음 할인 (같은 단지 3타입↑ 10%)</span><span>−${fmt.won(tt.discount)}</span></div>` : ''}
      <div class="sm-total"><span class="body-sm muted">총 결제 금액 <span class="micro">(VAT 포함)</span></span>${fmt.price(tt.total)}</div>
      <div class="sm-sub">공급가 ${fmt.won(tt.supply)} + 부가세 ${fmt.won(tt.vat)}</div>
      ${cta || ''}</div>`;
  }

  /* ── C-15 장바구니 ── */
  if (page === 'cart') {
    function render() {
      const cart = Store.get('cart');
      if (!cart.length) {
        const recent = Store.get('recent').map(id => APT.complex(id)).filter(Boolean).slice(0, 2);
        main.innerHTML = `<div class="page-head"><h1 class="h1">장바구니</h1></div><div class="empty"><div class="em-ico">${icon('cart', 'ico-24')}</div><div class="em-title">장바구니가 비어 있습니다</div><div class="em-desc">단지를 검색해 타입별 도면을 담으세요. 같은 단지 3개 타입 이상이면 10% 묶음 할인이 자동 적용됩니다.</div><div class="em-actions"><a class="btn btn-primary" href="search.html">단지 검색</a>${recent.map(c => `<a class="btn btn-secondary" href="complex.html?id=${c.id}">최근 본 ${esc(c.name)}</a>`).join('')}</div><p class="micro muted-3 dev-note">빈 상태 S-01 — 최근 본 단지로 직접 경로</p></div>`; return;
      }
      const tt = totals(); const ttAll = APT.calc.cartTotal(Store.get('cart'), APT.types);
      main.innerHTML = `<div class="page-head"><div><h1 class="h1">장바구니 <span class="muted-3" style="font-size:18px;font-weight:500">${cart.length}</span></h1><p class="muted body-sm mt-2">단지별로 묶어 보여 드립니다. 이미 구매한 도면은 결제에서 자동으로 빠지고, 다른 포맷이 필요할 때만 다시 넣을 수 있습니다.</p></div></div>
      <div class="cart-layout"><div><div class="cart-head-row"><span class="body-sm muted">${ttAll.groups.length}개 단지 · ${cart.length}건</span><button class="btn btn-ghost btn-sm" data-clear>${icon('trash', 'ico-16')} 전체 비우기</button></div>${ttAll.groups.map(ga => { const c = APT.complex(ga.complexId); const g = tt.groups.find(x => x.complexId === ga.complexId) || { distinctTypes: 0, bundle: false, disc: 0, items: [] }; return `<section class="cart-group"><div class="cg-head"><div><b>${esc(c.name)}</b> <span class="muted">· ${g.distinctTypes}개 타입 결제</span></div>${g.bundle ? `<span class="badge badge-pos">묶음 할인 10% · −${fmt.won(g.disc)}</span>` : `<span class="micro muted-3">${APT.BUNDLE_MIN - g.distinctTypes}개 타입 더 담으면 10% 할인</span>`}</div>
        ${ga.items.map(it => { const t = it.t; const dup = Store.purchasedItem(t.id); return `<div class="cart-row ${dup ? 'is-dup' : ''} ${dup && !it.keep ? 'is-excluded' : ''}"><div class="cr-thumb">${APT.planSVG(t, 'thumb')}</div><div><div class="cr-name"><a href="plan.html?id=${t.id}">${t.code} 타입</a> <span class="muted-3" style="font-weight:500">전용 ${t.exclusive}㎡</span></div><div class="cr-meta">${APT.BASIS[t.meta.basis]} · 확장 ${t.meta.expansion ? '반영' : '미반영'} · ${t.meta.updated}</div>${dup ? `<div class="cr-dup">${icon('alert', 'ico-16')}<span>이미 ${F[dup.item.format].label}으로 구매한 도면입니다 (주문 ${dup.order.id}). 결제에서 제외됩니다.</span></div><label class="check mt-2" style="font-size:13px"><input type="checkbox" data-keep="${t.id}" ${it.keep ? 'checked' : ''}><span>다른 포맷(${F[it.format].label})으로 추가 구매</span></label>` : ''}</div>
          <div class="cr-right"><select class="select" data-fmt="${t.id}" aria-label="포맷">${t.formats.map(f => `<option value="${f}" ${it.format === f ? 'selected' : ''}>${F[f].label} · ${fmt.won(Store.priceOf(t, f))}</option>`).join('')}</select><div class="row gap-3">${fmt.price(Store.priceOf(t, it.format), 'num-md')}<button class="ibtn" data-rm="${t.id}" aria-label="삭제">${icon('trash')}</button></div></div></div>`; }).join('')}</section>`; }).join('')}
        <p class="src-caption">가격은 부가세 포함 총액입니다. 결제 전 주문서에서 증빙(세금계산서·현금영수증)과 청약철회 안내를 확인합니다.</p></div>
      <aside>${summary(tt, `<a class="btn btn-primary btn-lg btn-block mt-4 ${tt.total ? '' : 'is-disabled'}" href="checkout.html" ${tt.total ? '' : 'aria-disabled="true" onclick="return false"'}>${fmt.won(tt.total)} 주문하기</a><a class="btn btn-ghost btn-block mt-2" href="search.html">더 담기</a>`)}</aside></div><div class="sticky-bar"><div class="sb-price">${fmt.price(tt.total, 'num-md')}<span class="micro">VAT 포함 · ${effectiveCart().length}건</span></div><a class="btn btn-primary" href="checkout.html">주문하기</a></div>`; document.body.classList.add('has-sticky');
      $$('[data-fmt]').forEach(s => s.addEventListener('change', () => { Store.cartAdd(s.dataset.fmt, s.value); render(); }));
      $$('[data-rm]').forEach(b => b.addEventListener('click', () => { const it = Store.get('cart').find(x => x.typeId === b.dataset.rm); Store.cartRemove(b.dataset.rm); UI.toast('장바구니에서 뺐습니다', { undo: () => { Store.cartAdd(it.typeId, it.format); render(); } }); render(); }));
      $$('[data-keep]').forEach(cb => cb.addEventListener('change', () => { const c = Store.get('cart'); const it = c.find(x => x.typeId === cb.dataset.keep); it.keep = cb.checked; Store.set('cart', c); render(); }));
      $('[data-clear]').addEventListener('click', async () => { if (await UI.confirm({ title: '장바구니 비우기', body: '담긴 도면을 모두 뺄까요?', yes: '비우기', danger: true })) { Store.cartClear(); render(); } });
    }
    render(); return;
  }

  /* ── C-16 주문서·결제 ── */
  if (page === 'checkout') {
    if (Store.get('role') === 'guest') { UI.gateLogin(main, 'checkout.html'); return; }
    const cart = effectiveCart();
    if (!cart.length) { main.innerHTML = `<div class="empty"><div class="em-ico">${icon('cart', 'ico-24')}</div><div class="em-title">주문할 도면이 없습니다</div><div class="em-desc">${Store.get('cart').length ? '담긴 도면이 모두 이미 구매한 도면입니다. 장바구니에서 「다른 포맷으로 추가 구매」를 체크하면 결제할 수 있습니다.' : '단지를 검색해 도면을 담으세요.'}</div><div class="em-actions"><a class="btn btn-primary" href="${Store.get('cart').length ? 'cart.html' : 'search.html'}">${Store.get('cart').length ? '장바구니' : '단지 검색'}</a></div></div>`; return; }
    const tt = totals();
    let receipt = prof.biz ? 'tax' : 'card', method = 'card';
    main.innerHTML = `<div class="page-head"><h1 class="h1">주문서</h1><span class="body-sm muted">단계 2/3<span class="dev-note"> · 결제 취소는 2단계로 더 짧습니다(다크패턴 규정)</span></span></div>
    <ol class="stepper co-steps"><li class="done">장바구니</li><li class="current">주문·결제</li><li>완료</li></ol>
    <div class="cart-layout"><form id="co" novalidate>
      <section class="co-sec"><h2 class="h3">주문자</h2><div class="co-grid"><div class="field"><label>이름</label><input class="input" value="${esc(prof.name)}" readonly></div><div class="field"><label>이메일 (도면 발송·영수증)</label><input class="input" value="${esc(prof.email)}" readonly></div></div><p class="help mt-2">회원정보에서 가져왔습니다. 변경은 <a href="account.html" style="text-decoration:underline">회원정보</a>에서.</p></section>
      <section class="co-sec"><h2 class="h3">증빙</h2><div class="pay-opts">
        <label class="radio-card"><input type="radio" name="receipt" value="card" ${receipt === 'card' ? 'checked' : ''}><span class="rc-dot"></span><span><b>카드 전표</b><br><span class="body-sm muted">카드 결제 시 자동 발행</span></span></label>
        <label class="radio-card"><input type="radio" name="receipt" value="cash" ${receipt === 'cash' ? 'checked' : ''}><span class="rc-dot"></span><span><b>현금영수증</b><br><span class="body-sm muted">${esc(prof.phone)}</span></span></label>
        <label class="radio-card"><input type="radio" name="receipt" value="tax" ${receipt === 'tax' ? 'checked' : ''} ${prof.biz ? '' : 'disabled'}><span class="rc-dot"></span><span><b>세금계산서</b><br><span class="body-sm muted">${prof.biz ? esc(prof.company) + ' · ' + esc(prof.bizNo) : '사업자 회원만'}</span></span></label></div>
        <div id="tax-box" class="mt-3" style="${receipt === 'tax' ? '' : 'display:none'}"><div class="co-grid"><div class="field"><label>상호 · 사업자번호</label><input class="input" value="${esc(prof.company || '')} · ${esc(prof.bizNo || '')}" readonly></div><div class="field"><label>계산서 수신 이메일</label><input class="input" id="taxEmail" value="${esc(prof.taxEmail || prof.email)}"></div></div></div></section>
      <section class="co-sec" id="method"><h2 class="h3">결제수단</h2><div class="pay-opts">
        <label class="radio-card"><input type="radio" name="method" value="card" checked><span class="rc-dot"></span><span><b>신용·체크카드</b><br><span class="body-sm muted">즉시 열람 가능</span></span></label>
        <label class="radio-card"><input type="radio" name="method" value="easy"><span class="rc-dot"></span><span><b>간편결제</b><br><span class="body-sm muted">카카오페이·네이버페이·토스</span></span></label>
        <label class="radio-card"><input type="radio" name="method" value="vbank"><span class="rc-dot"></span><span><b>가상계좌</b><br><span class="body-sm muted">입금 확인 후 열람 (2일 내)</span></span></label></div></section>
      <section class="co-sec"><h2 class="h3">청약철회 안내 <span class="badge badge-outline">필수 확인</span></h2>
        <div class="consent-box" id="consent"><div class="cb-title">${icon('info', 'ico-16')} 열람을 시작한 도면은 환불되지 않습니다</div>
          <ul><li>도면은 디지털 콘텐츠로, 뷰어 열람 또는 다운로드를 시작한 도면은 청약철회가 제한됩니다(전자상거래법 제17조 제2항 제5호).</li><li>여러 도면을 함께 산 경우 <strong>열람하지 않은 도면은 7일 내 환불</strong>됩니다(가분적 콘텐츠).</li><li>구매 전 각 타입의 <strong>미리보기</strong>로 방 구성·확장 여부를 확인하세요(시험 사용).</li><li>동의 시각과 도면별 첫 열람 시각은 주문 내역에 기록됩니다.</li></ul>
          <label class="check"><input type="checkbox" id="agree"><span>미리보기를 확인했고, 열람을 시작한 도면은 환불되지 않음에 동의합니다</span></label>
          <div class="error-msg mt-2" id="agree-err" style="display:none">결제하려면 청약철회 안내에 동의해야 합니다</div></div>
        <label class="check mt-4" style="color:var(--ink-2)"><input type="checkbox" id="mkt"><span>[선택] 신규 단지 등록·할인 소식 받기 — 기본 해제, 언제든 변경 가능</span></label></section>
      <section class="co-sec"><h2 class="h3">최종 확인</h2><p class="body-sm muted mb-3">결제 전에 내용을 확인하고 고칠 수 있습니다.<span class="dev-note"> 전자상거래법 제7조 확인·정정 절차</span></p>
        <table class="table review-table"><tbody><tr><td>도면</td><td>${tt.groups.map(g => `${esc(APT.complex(g.complexId).name)} ${g.items.map(i => i.t.code + '(' + i.format.toUpperCase() + ')').join(' · ')}`).join('<br>')} <a href="cart.html" class="caption" style="color:var(--action);margin-left:6px">수정</a></td></tr><tr><td>증빙</td><td data-rv-receipt>${{ card: '카드 전표', cash: '현금영수증', tax: '세금계산서' }[receipt]}</td></tr><tr><td>결제수단</td><td data-rv-method>신용·체크카드</td></tr><tr><td>금액</td><td><b>${fmt.won(tt.total)}</b> (공급가 ${fmt.won(tt.supply)} + VAT ${fmt.won(tt.vat)})</td></tr></tbody></table></section>
    </form>
    <aside>${summary(tt, `<button class="btn btn-primary btn-lg btn-block mt-4" id="pay" type="button">${fmt.won(tt.total)} 결제하기</button><button class="btn btn-ghost btn-block mt-2 dev-note" type="button" data-fail>결제 실패 상태 보기 (데모)</button><p class="micro muted-3 mt-3">버튼의 금액이 최종 금액입니다. 결제 후 금액이 바뀌지 않습니다.</p>`)}</aside></div>`;
    $$('input[name=receipt]').forEach(r => r.addEventListener('change', () => { receipt = r.value; $('#tax-box').style.display = receipt === 'tax' ? '' : 'none'; $('[data-rv-receipt]').textContent = { card: '카드 전표', cash: '현금영수증', tax: '세금계산서' }[receipt]; }));
    $$('input[name=method]').forEach(r => r.addEventListener('change', () => { method = r.value; $('[data-rv-method]').textContent = { card: '신용·체크카드', easy: '간편결제', vbank: '가상계좌 (입금 후 열람)' }[method]; }));
    const pay = $('#pay');
    pay.addEventListener('click', () => {
      if (!$('#agree').checked) { $('#consent').classList.add('is-err'); $('#agree-err').style.display = ''; $('#consent').scrollIntoView({ block: 'center', behavior: 'smooth' }); $('#agree').focus({ preventScroll: true }); UI.toast('청약철회 안내에 동의해야 결제할 수 있습니다', { type: 'danger', icon: 'alert' }); return; }
      $('#consent').classList.remove('is-err'); $('#agree-err').style.display = 'none';
      pay.classList.add('is-loading');
      const items = tt.groups.flatMap(g => g.items.map(i => ({ typeId: i.typeId, format: i.format, price: Store.priceOf(i.t, i.format) })));
      // 묶음 할인은 항목별 안분
      if (tt.discount) { const sum = items.reduce((a, b) => a + b.price, 0); items.forEach(i => i.price = Math.round(i.price * (1 - tt.discount / sum))); }
      // C-17a 결제 진행 상태 — 결제창 → 승인 → 기록 (중복 클릭 방지 · 이탈 안내)
      const steps = method === 'vbank' ? ['가상계좌 발급 요청', '계좌 발급', '주문 기록'] : ['결제창 열림', '카드사 승인', '주문 기록'];
      const sh = UI.sheet(`<h3 class="h3 mb-2">${method === 'vbank' ? '가상계좌를 발급하고 있습니다' : '결제사 승인 중입니다'}</h3><p class="body-sm muted mb-3">창을 닫거나 뒤로 가지 마세요. 중복 결제를 막기 위해 버튼은 잠깁니다.</p><ol class="stepper" id="pay-steps">${steps.map((x, i) => `<li class="${i === 0 ? 'current' : ''}">${x}</li>`).join('')}</ol><div class="loading-box" style="padding:20px 0 4px"><div class="spinner"></div></div>`);
      sh.onclick = e => e.stopPropagation(); const bg = $('.sheet-bg'); if (bg) bg.onclick = null;
      const lis = $$('#pay-steps li', sh); let k = 0; const tick = setInterval(() => { lis[k].className = 'done'; k++; if (lis[k]) lis[k].className = 'current'; }, 550);
      setTimeout(() => { clearInterval(tick); const keepCart = Store.get('cart').filter(it => Store.purchasedItem(it.typeId) && !it.keep); const o = Store.placeOrder(items, { method, receipt, marketing: $('#mkt').checked, total: tt.total, discount: tt.discount }); if (keepCart.length) Store.set('cart', keepCart); if ($('#mkt').checked) Store.set('marketing', true); location.href = (method === 'vbank' ? 'pending.html' : 'complete.html') + '?order=' + o.id; }, 1900);
    });
    $('[data-fail]').addEventListener('click', () => location.href = 'failed.html?reason=limit');
    return;
  }

  let o = Store.order(qs('order')); let fallback = false;
  if (!o && qs('order') !== 'none') { const list = Store.get('orders'); o = page === 'pending' ? (list.find(x => x.status === 'pending') || Object.assign({}, list[0], { status: 'pending', vbank: { bank: '하나은행', account: '123-910028-45607', holder: '(주)아파트고', due: new Date(Date.now() + 864e5 * 1.5).toISOString() }, total: list[0] ? list[0].items.reduce((a, b) => a + b.price, 0) : 0 })) : list[0]; fallback = !!o; }
  const fallbackChip = () => fallback ? `<div class="chips jc-c" style="justify-content:center;margin-bottom:12px"><span class="chip is-active">${icon('eye', 'ico-16')} 예시 주문으로 보는 중 · ${o.id}</span></div>` : '';
  const emptyOrder = (title) => `<div class="empty"><div class="em-ico">${icon('receipt', 'ico-24')}</div><div class="em-title">${title}</div><div class="em-desc">주문번호가 없거나 삭제된 주문입니다. 주문 내역에서 다시 선택하세요.</div><div class="em-actions"><a class="btn btn-primary" href="orders.html">주문 내역</a><a class="btn btn-secondary" href="search.html">단지 검색</a></div></div>`;
  /* ── C-17 입금 대기 ── */
  if (page === 'pending') {
    if (!o) { main.innerHTML = emptyOrder('주문을 찾을 수 없습니다'); return; }
    const vb = o.vbank || { bank: '하나은행', account: '123-910028-45607', holder: '(주)아파트고', due: new Date(Date.now() + 864e5 * 2).toISOString() };
    const left = Math.max(0, Math.round((new Date(vb.due) - Date.now()) / 36e5));
    main.innerHTML = `<div class="result">${fallbackChip()}<div class="rs-ico wait">${icon('clock', 'ico-24')}</div><h1 class="h1">입금을 기다리고 있습니다</h1><p class="lead mt-3" style="margin-inline:auto;text-align:center">아래 계좌로 <b>${fmt.won(o.total)}</b>을 입금하면 확인 즉시 도면을 열 수 있습니다. 입금 확인 전에는 뷰어가 열리지 않습니다.</p>
      <div class="rs-box"><div class="vbank"><div><div class="vb-l">입금 계좌</div><div class="vb-v">${vb.bank} ${vb.account}</div></div><button class="ibtn" data-copy="${vb.account}" aria-label="계좌 복사">${icon('copy')}</button><div><div class="vb-l">예금주</div><div class="vb-v">${vb.holder}</div></div><span></span><div><div class="vb-l">입금 금액 (정확히)</div><div class="vb-v">${fmt.won(o.total)}</div></div><button class="ibtn" data-copy="${o.total}" aria-label="금액 복사">${icon('copy')}</button><div><div class="vb-l">입금 기한</div><div class="vb-v ${left < 6 ? 'up' : ''}">${fmt.dt(vb.due)} <span class="badge ${left < 6 ? 'badge-danger' : 'badge-warn'}">${left}시간 남음</span></div></div><span></span></div>
      <div class="notice notice-info mt-4">${icon('info', 'ico-16')}<span>주문번호 <b>${o.id}</b> · 기한이 지나면 주문이 자동 취소되고 장바구니는 유지됩니다. 입금자명이 다르면 고객센터로 알려 주세요.</span></div>
      <div class="order-items mt-4">${o.items.map(it => { const t = APT.type(it.typeId); return `<div class="order-item"><div class="oi-thumb">${APT.planSVG(t, 'thumb')}</div><div><div class="oi-name">${esc(APT.complex(t.complexId).name)} ${t.code}</div><div class="oi-meta">${F[it.format].label} · 입금 확인 후 열람</div></div><div class="oi-right">${fmt.price(it.price)}<span class="badge badge-warn">대기</span></div></div>`; }).join('')}</div>
      <div class="row gap-2 mt-6 jc-c"><button class="btn btn-primary" data-confirm>입금 확인 처리<span class="dev-note"> (데모 시뮬레이션)</span></button><a class="btn btn-secondary" href="orders.html">주문 내역</a></div><p class="micro muted-3 mt-3 dev-note">결제 예외 상태 S-06 — 입금 기한 임박(6시간 미만)이면 빨간 배지</p></div></div>`;
    $$('[data-copy]').forEach(b => b.addEventListener('click', () => { try { navigator.clipboard.writeText(b.dataset.copy); } catch (e) { } UI.toast('복사했습니다', { icon: 'copy' }); }));
    $('[data-confirm]').addEventListener('click', () => { Store.confirmVbank(o.id); UI.toast('입금이 확인되었습니다', { type: 'pos', icon: 'check' }); setTimeout(() => location.href = 'complete.html?order=' + o.id, 600); });
    return;
  }

  /* ── C-18 결제 완료 — 첫 열람 확인 모달 ── */
  if (page === 'complete') {
    if (!o) { main.innerHTML = emptyOrder('주문을 찾을 수 없습니다'); return; }
    main.innerHTML = `<div class="result">${fallbackChip()}<div class="rs-ico ok">${icon('check', 'ico-24')}</div><h1 class="h1">결제가 완료되었습니다</h1><p class="lead mt-3" style="margin-inline:auto;text-align:center">주문번호 <b>${o.id}</b> · ${fmt.dt(o.createdAt)} · ${{ card: '카드', easy: '간편결제', vbank: '가상계좌' }[o.method]} ${fmt.won(o.total)}<br>${{ card: '카드 전표', cash: '현금영수증', tax: '세금계산서' }[o.receipt]}는 이메일로 보내 드렸습니다.</p>
      <div class="rs-box"><div class="notice notice-warn">${icon('alert', 'ico-16')}<span><strong>도면을 열기 전에 확인하세요.</strong> 열람을 시작한 도면은 환불할 수 없습니다. 열지 않은 도면은 7일 내 <a href="refund.html?order=${o.id}" style="text-decoration:underline">환불 신청</a>할 수 있습니다.</span></div>
      <div class="order-items mt-4">${o.items.map(it => { const t = APT.type(it.typeId); return `<div class="order-item"><div class="oi-thumb">${APT.planSVG(t, 'thumb')}</div><div><div class="oi-name">${esc(APT.complex(t.complexId).name)} ${t.code}</div><div class="oi-meta">${F[it.format].label} · ${it.viewedAt ? '열람 ' + fmt.dt(it.viewedAt) : '미열람 · 환불 가능'}</div></div><div class="oi-right">${fmt.price(it.price)}<button class="btn btn-sm ${it.viewedAt ? 'btn-secondary' : 'btn-primary'}" data-open="${t.id}">${it.viewedAt ? '뷰어 열기' : '지금 열기'}</button></div></div>`; }).join('')}</div>
      <div class="row gap-2 mt-6 jc-c"><a class="btn btn-secondary" href="my.html">내 도면함</a><a class="btn btn-ghost" href="order.html?id=${o.id}">주문 상세·영수증</a></div></div></div>`;
    $$('[data-open]').forEach(b => b.addEventListener('click', async () => { const t = APT.type(b.dataset.open); const p = Store.purchasedItem(t.id); if (p && !p.item.viewedAt) { const ok = await UI.confirm({ title: '이 도면을 지금 열까요?', body: `<strong>지금 열면 ${t.code} 타입 도면은 환불할 수 없게 됩니다.</strong><br><br>열람 시작 시각이 기록되며, 미리보기로 이미 확인한 도면이라면 바로 여셔도 됩니다.`, yes: '열람 시작', no: '나중에' }); if (!ok) return; Store.markViewed(t.id); } location.href = 'viewer.html?id=' + t.id; }));
    return;
  }

  /* ── C-19 결제 실패·취소 ── */
  if (page === 'failed') {
    const reason = qs('reason') || 'limit';
    const R = { limit: ['한도 초과', '카드 한도를 초과해 승인이 거절되었습니다. 다른 카드나 간편결제로 다시 시도하세요.'], cancel: ['결제 취소', '결제 창에서 취소했습니다. 장바구니는 그대로 남아 있습니다.'], network: ['통신 오류', '결제사 응답이 없습니다. 중복 결제가 되지 않도록 카드사 승인 내역을 확인한 뒤 다시 시도하세요.'] }[reason] || ['오류', '알 수 없는 오류입니다.'];
    main.innerHTML = `<div class="result"><div class="rs-ico fail">${icon('close', 'ico-24')}</div><h1 class="h1">결제가 완료되지 않았습니다</h1><p class="lead mt-3" style="margin-inline:auto;text-align:center"><b>${R[0]}</b> — ${R[1]}</p>
      <div class="rs-box"><div class="notice">${icon('cart', 'ico-16')}<span>${Store.get('cart').length ? `장바구니 ${Store.get('cart').length}건은 그대로 보존되어 있습니다. ` : ''}결제 금액은 청구되지 않았습니다.</span></div>
      <div class="row gap-2 mt-6 jc-c"><a class="btn btn-primary" href="checkout.html">다시 시도</a><a class="btn btn-secondary" href="checkout.html#method">다른 결제수단 선택</a><a class="btn btn-ghost" href="cart.html">장바구니</a></div>
      <div class="chips mt-6 jc-c dev-note" style="justify-content:center"><span class="micro muted-3">실패 사유 보기(데모):</span><a class="chip" href="failed.html?reason=limit">한도 초과</a><a class="chip" href="failed.html?reason=cancel">사용자 취소</a><a class="chip" href="failed.html?reason=network">통신 오류</a></div><p class="micro muted-3 mt-3 dev-note">결제 예외 상태 S-06</p></div></div>`;
    return;
  }
})();
