/* C-10 타입 상세(도면 상품) · C-11 미리보기 모달
   법적 UI: 미리보기 = 시험 사용(전자상거래법 17조 6항 단서·시행령 21조의2) · 가격은 VAT 포함 총액 · 이용 범위 카드 · 도면 메타·정확도 고지 */
(function () {
  const { $, $$, esc, icon, fmt, qs } = UI;
  UI.init();
  const main = $('#main');
  const t = APT.type(qs('id') || 'c01-84A');
  if (!t) { main.innerHTML = `<div class="gate"><div class="g-ico">${icon('search', 'ico-24')}</div><h1 class="h2">도면을 찾을 수 없습니다</h1><p class="muted">삭제됐거나 주소가 바뀐 도면입니다.</p><div class="g-actions"><a class="btn btn-primary" href="search.html">단지 검색</a></div></div>`; return; }
  const c = APT.complex(t.complexId);
  const tv = Store.typeView(t);
  const siblings = APT.typesOf(c.id);
  let format = t.formats.includes('pdf') ? 'pdf' : t.formats[0];
  let areaTab = 'exclusive';

  function render() {
    const bought = Store.purchasedItem(t.id);
    const inCart = Store.cartHas(t.id);
    const hidden = tv.status === 'hidden';
    main.innerHTML = `
    <nav class="bc" style="margin-top:24px" aria-label="경로"><a href="index.html">홈</a><span class="sep">/</span><a href="complex.html?id=${c.id}">${esc(c.name)}</a><span class="sep">/</span><span>${t.code} 타입</span></nav>
    <div class="pl-hero">
      <div>
        <div class="row-between mb-3"><div><h1 class="h1">${esc(c.name)} <span style="color:var(--action)">${t.code}</span> 타입</h1><p class="muted body-sm" style="margin-top:4px">${esc(c.addr)} · ${c.built}년 · 해당 타입 ${fmt.num(t.households)}세대</p></div>${bought ? '<span class="badge badge-pos">구매함</span>' : ''}</div>
        <div class="preview-box" data-open-preview role="button" tabindex="0" aria-label="미리보기 크게 보기">
          ${APT.planSVG(t, 'preview')}
          <div class="pv-tag"><span class="badge badge-brand">미리보기</span><span class="badge badge-outline">치수 일부 마스킹 · 저해상</span></div>
          <div class="pv-zoom">${icon('search', 'ico-16')} 크게 보기</div>
        </div>
        <p class="pv-note">${icon('info', 'ico-16')}<span><strong>구매 전 미리보기로 방 구성과 확장 여부를 확인하세요.</strong> 열람·다운로드를 시작한 도면은 환불되지 않습니다. 미리보기는 청약철회 안내에 필요한 시험 사용 수단으로 제공됩니다.</span></p>

        <section class="cx-sec mt-6"><h2 class="h3">면적</h2>
          <div class="seg area-tabs" data-areaseg><button type="button" data-v="exclusive" aria-pressed="true">전용</button><button type="button" data-v="supply" aria-pressed="false">공급</button><button type="button" data-v="contract" aria-pressed="false">계약</button></div>
          <div class="area-table">
            <div class="at"><div class="fl">전용면적</div><div class="fv">${t.exclusive.toFixed(2)}<span class="unit">㎡</span></div><div class="py">${Store.get('pyeong') ? `약 ${APT.calc.pyeong(t.exclusive)}평` : '&nbsp;'}</div></div>
            <div class="at"><div class="fl">공급면적</div><div class="fv">${t.supply.toFixed(2)}<span class="unit">㎡</span></div><div class="py">${Store.get('pyeong') ? `약 ${APT.calc.pyeong(t.supply)}평` : '&nbsp;'}</div></div>
            <div class="at"><div class="fl">계약면적</div><div class="fv">${t.contract.toFixed(2)}<span class="unit">㎡</span></div><div class="py">${Store.get('pyeong') ? `약 ${APT.calc.pyeong(t.contract)}평` : '&nbsp;'}</div></div>
          </div>
          <p class="src-caption mt-3">면적은 ㎡ 기준(법정 계량단위) · 방 ${t.rooms} · 욕실 ${t.baths}<span class="dev-note"> · 평 참고 표기는 검토 패널 토글(F10)</span></p></section>

        <section class="cx-sec"><h2 class="h3">도면 정보</h2>
          <div class="facts mt-3">
            <div class="fact-tile fact-row"><span class="fl">작성 기준</span><span class="fv">${APT.BASIS[t.meta.basis]}</span></div>
            <div class="fact-tile fact-row"><span class="fl">발코니 확장</span><span class="fv">${t.meta.expansion ? '반영' : '미반영'}</span></div>
            <div class="fact-tile fact-row"><span class="fl">갱신일 · 버전</span><span class="fv">${t.meta.updated} · ${t.meta.version}</span></div>
            <div class="fact-tile fact-row"><span class="fl">출처 유형</span><span class="fv">${APT.SOURCE_KINDS[t.source.kind]}</span></div>
          </div>
          <div class="notice notice-warn mt-3">${icon('alert', 'ico-16')}<span><strong>도면은 실제 세대와 다를 수 있습니다.</strong> ${t.meta.basis === 'sale' ? '분양 도면 기준이라 입주 후 확장·구조 변경이 반영되어 있지 않습니다.' : '실측 기준이지만 세대별 변경이 있을 수 있습니다.'} 자재 발주·시공 전 현장 실측을 권장합니다.</span></div></section>

        <section class="cx-sec"><h2 class="h3">무료 평면도와 구매 도면의 차이</h2>
          <table class="table cmp-table"><thead><tr><th>항목</th><th>포털 무료 평면도</th><th>아파트고 구매 도면</th></tr></thead><tbody>
            <tr><td>치수선 · 벽 두께</td><td>없음</td><td>포함</td></tr><tr><td>실별 면적(㎡)</td><td>없음</td><td>포함</td></tr><tr><td>해상도</td><td>~800px</td><td>4,000px (JPG) · 벡터 (PDF/DWG)</td></tr><tr><td>CAD 레이어</td><td>없음</td><td>${t.formats.includes('dwg') ? '벽·창호·치수 분리' : '<span class="no">이 타입은 DWG 미제공</span>'}</td></tr><tr><td>작성 기준·갱신일</td><td>없음</td><td>표기</td></tr><tr><td>워터마크</td><td>포털 로고</td><td>구매자 식별 정보(희미)</td></tr>
          </tbody></table></section>

        <section class="cx-sec" id="license"><h2 class="h3">이용 범위</h2>
          <div class="license-card mt-3"><div class="lc-ok"><b>가능</b>사내 설계·견적·상담 자료, 인쇄, 편집(DWG)</div><div class="lc-no"><b>불가</b>재판매·양도·대여, 웹하드·메신저·온라인 공유, 타 서비스 게재</div><div class="lc-ask"><b>약관 확인</b>광고·분양 홍보물 게재, 출판물 수록</div></div>
          <p class="src-caption mt-3">도면 자체의 저작권 보호와 별개로, 이용 범위는 구매 약관(계약)과 데이터베이스 제작자 권리로 정합니다. 구매본에는 추적용 식별 정보가 포함됩니다. <a href="#" style="text-decoration:underline">이용약관 전문</a></p></section>

        <section class="cx-sec"><h2 class="h3">같은 단지 다른 타입</h2>
          <div class="chips mt-3">${siblings.map(s => `<a class="chip ${s.id === t.id ? 'is-active' : ''}" href="plan.html?id=${s.id}">${s.code} <span class="muted-3" style="font-weight:500">${s.exclusive.toFixed(0)}㎡</span></a>`).join('')}<a class="chip" href="compare.html?a=${t.id}&b=${(siblings.find(s => s.id !== t.id) || t).id}">${icon('compare', 'ico-16')} 비교</a></div></section>
      </div>

      <aside class="buy-box">
        ${hidden ? `<div class="notice notice-warn">${icon('alert', 'ico-16')}<span>이 타입 도면은 현재 비공개입니다 (관리자 검수 중). 등록되면 알려 드립니다.</span></div><button class="btn btn-secondary btn-block mt-3" data-notify>알림 받기</button>` : bought ? `
          <span class="eyebrow">구매 완료</span><h3 class="h3 mt-2">${APT.FORMATS[bought.item.format].label} · 주문 ${bought.order.id}</h3>
          <ul style="display:grid;gap:8px;font-size:14px;color:var(--ink-2);margin:14px 0"><li>${bought.item.viewedAt ? `열람 시작 ${fmt.dt(bought.item.viewedAt)}` : '아직 열람하지 않음 · 환불 가능'}</li><li>다운로드 ${bought.item.downloads}/${APT.DOWNLOAD_MAX}회 · 기한 ${fmt.daysLeft(bought.order.createdAt, APT.DOWNLOAD_DAYS)}일 남음</li></ul>
          <a class="btn btn-primary btn-block" href="viewer.html?id=${t.id}">뷰어에서 열기</a><a class="btn btn-secondary btn-block mt-2" href="order.html?id=${bought.order.id}">주문 상세</a>
          <p class="micro muted-3 mt-3">다른 포맷이 필요하면 아래에서 추가 구매할 수 있습니다.</p><hr class="divider">` : ''}
        ${hidden ? '' : `
          <span class="eyebrow">포맷 선택</span>
          <div class="fmt-opts">${['jpg', 'pdf', 'dwg'].map(f => { const F = APT.FORMATS[f]; const off = !t.formats.includes(f); return `<label class="fmt-opt ${off ? 'is-off' : ''}"><input type="radio" name="fmt" value="${f}" ${format === f ? 'checked' : ''} ${off ? 'disabled' : ''}><span class="fo-dot"></span><span><span class="fo-name">${F.label}</span><br><span class="fo-desc">${off ? '이 타입은 제공하지 않음' : F.desc + ' · ' + F.size}</span></span>${off ? '<span class="muted-3">—</span>' : fmt.price(Store.priceOf(t, f))}</label>`; }).join('')}</div>
          <div class="bb-total"><span class="body-sm muted">결제 금액 (VAT 포함)</span>${fmt.price(Store.priceOf(t, format))}</div>
          <p class="micro muted-3">공급가 ${fmt.won(APT.calc.supplyOf(Store.priceOf(t, format)))} + 부가세 ${fmt.won(APT.calc.vatOf(Store.priceOf(t, format)))}</p>
          <div class="buy-actions"><button type="button" class="btn btn-secondary" data-cart>${inCart ? '담김 ✓' : '장바구니'}</button><button type="button" class="btn btn-primary" data-buy>바로 구매</button></div>
          <p class="micro muted-3 mt-3">같은 단지 3개 타입 이상 담으면 10% 묶음 할인 · 열람 전 7일 내 환불</p>`}
      </aside>
    </div>
    ${hidden ? '' : `<div class="sticky-bar"><div class="sb-price">${fmt.price(Store.priceOf(t, format), 'num-md')}<span class="micro">${APT.FORMATS[format].label} · VAT 포함</span></div>${bought ? `<a class="btn btn-primary" href="viewer.html?id=${t.id}">뷰어에서 열기</a>` : `<button type="button" class="btn btn-secondary" data-cart2>장바구니</button><button type="button" class="btn btn-primary" data-buy2>바로 구매</button>`}</div>`}`;
    document.body.classList.toggle('has-sticky', !hidden);
    const areaSeg = $('[data-areaseg]'); if (areaSeg) { UI.seg(areaSeg); areaSeg.addEventListener('segchange', e => { areaTab = e.detail; $$('.area-table .at').forEach((el, i) => el.style.boxShadow = ['exclusive', 'supply', 'contract'][i] === areaTab ? 'var(--sh-active)' : 'none'); }); $$('.area-table .at')[0].style.boxShadow = 'var(--sh-active)'; }
    $$('input[name=fmt]', main).forEach(r => r.addEventListener('change', () => { const prev = Store.priceOf(t, format); format = r.value; const next = Store.priceOf(t, format); const pe = $('.bb-total .price > span:first-child'); if (pe) UI.countUp(pe, next, { from: prev, dur: 280 }); const sub = $('.buy-box .micro.muted-3'); if (sub) sub.textContent = `공급가 ${fmt.won(APT.calc.supplyOf(next))} + 부가세 ${fmt.won(APT.calc.vatOf(next))}`; const sb = $('.sticky-bar .price > span:first-child'); if (sb) sb.textContent = Math.round(next).toLocaleString('ko-KR'); }));
    const cb = $('[data-cart]'); cb && cb.addEventListener('click', () => { Store.cartAdd(t.id, format); UI.toast(`${t.code} 타입 ${APT.FORMATS[format].label}을 담았습니다`, { type: 'pos', icon: 'check', action: { href: 'cart.html', label: '장바구니' } }); render(); });
    $$('[data-buy],[data-buy2]').forEach(b => b.addEventListener('click', () => { Store.cartAdd(t.id, format); location.href = 'checkout.html'; }));
    const cb2 = $('[data-cart2]'); cb2 && cb2.addEventListener('click', () => { Store.cartAdd(t.id, format); UI.toast(`${t.code} 타입 ${APT.FORMATS[format].label}을 담았습니다`, { type: 'pos', icon: 'check', action: { href: 'cart.html', label: '장바구니' } }); });
    const nb = $('[data-notify]'); nb && nb.addEventListener('click', () => UI.toast('등록되면 이메일로 알려 드립니다', { type: 'pos', icon: 'bell' }));
    const pv = $('[data-open-preview]'); pv.addEventListener('click', openPreview); pv.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPreview(); } });
  }

  /* C-11 미리보기 모달 — 확대 상한 200% · 로딩/실패 상태 */
  function openPreview() {
    let z = 1;
    const m = UI.modal(`<div class="pv-modal"><div class="pvm-stage" data-stage><div class="loading-box"><div class="spinner"></div><span>미리보기 불러오는 중</span></div></div>
      <div class="pvm-bar"><span class="body-sm muted">미리보기는 치수 일부가 가려지고 확대가 200%로 제한됩니다. 구매 후 뷰어에서는 400%까지 확대되고 치수·실별 면적이 표시됩니다.</span>
      <div class="pvm-zoom"><button class="ibtn" data-z="-1" aria-label="축소">${icon('minus')}</button><span class="caption" data-zv style="min-width:44px;text-align:center">100%</span><button class="ibtn" data-z="1" aria-label="확대">${icon('plus')}</button></div></div>
      <div class="row mt-3 gap-2"><button class="btn btn-primary" data-buy2>이 도면 구매하기</button><button class="btn btn-ghost" data-close>닫기</button></div></div>`, { title: `${t.code} 타입 미리보기`, wide: true });
    const stage = $('[data-stage]', m);
    setTimeout(() => { stage.innerHTML = APT.planSVG(t, 'preview'); }, Math.min(+Store.get('loadDelay') * 1000, 1500));
    $$('[data-z]', m).forEach(b => b.addEventListener('click', () => { z = Math.min(2, Math.max(.5, z + (+b.dataset.z) * .25)); const s = $('svg', stage); if (s) s.style.transform = `scale(${z})`; $('[data-zv]', m).textContent = Math.round(z * 100) + '%'; if (z >= 2) UI.toast('미리보기 확대 상한(200%)입니다 — 구매 후 뷰어에서 400%까지', { icon: 'info' }); }));
    $('[data-buy2]', m).addEventListener('click', () => { Store.cartAdd(t.id, format); location.href = 'checkout.html'; });
  }
  render();
  if (location.hash === '#preview') setTimeout(openPreview, 300);
})();
