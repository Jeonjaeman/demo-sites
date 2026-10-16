/* C-09 단지 상세 — 타입 탭(넘침 시 가로 스크롤 + 전체 드롭다운) · 배치도 · 타입별 도면 카드 · 출처 캡션 · (옵션) 실거래 */
(function () {
  const { $, $$, esc, icon, fmt, qs } = UI;
  UI.init();
  const main = $('#main');
  const id = qs('id') || 'c01';
  const c = APT.complex(id);
  if (!c || (c.id.startsWith('c9') && !Store.get('stress'))) {
    main.innerHTML = `<div class="gate"><div class="g-ico">${icon('search', 'ico-24')}</div><h1 class="h2">단지를 찾을 수 없습니다</h1><p class="muted">주소가 바뀌었거나 삭제된 단지입니다. 단지명으로 다시 검색해 보세요.</p><div class="g-actions"><a class="btn btn-primary" href="search.html">단지 검색</a><a class="btn btn-secondary" href="index.html">홈으로</a></div><p class="micro muted-3 dev-note">404 상태 — S-02</p></div>`; return;
  }
  Store.pushRecent(c.id);
  const types = APT.typesOf(c.id);
  const pub = types.filter(t => t.status === 'public');
  const dup = APT.allComplexes(Store.get('stress')).filter(x => x.id !== c.id && /\d+차$/.test(c.name) && x.name.replace(/\s*\d+차$/, '') === c.name.replace(/\s*\d+차$/, ''));
  const minPrice = Math.min(...pub.map(t => Store.priceOf(t, 'jpg')));
  let cur = types[0].id; let rendered = false; let docBound = false;

  /* 가상 실거래 (옵션 블록) — 해제 건 배지·출처·기준일 표기 (F16) */
  const r = APT.rng(99 + c.households);
  const BASE_DATE = new Date(2026, 9, 15);
  const trades = Array.from({ length: 6 }, (_, i) => { const t = types[Math.floor(r() * types.length)]; const d = new Date(BASE_DATE.getTime() - Math.floor(r() * 75) * 864e5); const base = (c.region === '서울' ? 14 : c.region === '경기' ? 8.5 : 4.2) * (t.exclusive / 84) * (1 + (2026 - c.built) * -0.012 + r() * 0.1); return { d: fmt.date(d.toISOString()), code: t.code, ex: t.exclusive, floor: 3 + Math.floor(r() * 25), price: Math.round(base * 10) / 10, canceled: i === 2, delta: (r() - .45) * 6 }; }).sort((a, b) => b.d.localeCompare(a.d));

  function sitePlan() {
    const rr = APT.rng(c.id.charCodeAt(2) * 7 + c.dongs); const n = Math.min(c.dongs, 24); const cols = Math.ceil(Math.sqrt(n * 2)); let s = `<svg viewBox="0 0 800 400" aria-label="${esc(c.name)} 단지 배치도(도식)"><rect width="800" height="400" fill="#f3f5f8"/><path d="M0 330 H800" stroke="#e6ebf1" stroke-width="22"/><path d="M620 0 V400" stroke="#e6ebf1" stroke-width="18"/><path d="M0 330 H800" stroke="#fff" stroke-width="1" stroke-dasharray="10 10"/>`;
    for (let i = 0; i < n; i++) { const col = i % cols, row = Math.floor(i / cols); const x = 40 + col * (560 / cols) + rr() * 10, y = 40 + row * 70 + rr() * 8; const w = 34 + rr() * 60, h = 26; const hot = pub.some(t => t.id === cur) && (i % types.length === types.findIndex(t => t.id === cur)); s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${hot ? '#0041d9' : '#1f2b5e'}" opacity="${hot ? 1 : .55}"/><text x="${x + w / 2}" y="${y + 17}" font-size="11" fill="#fff" text-anchor="middle" font-family="Pretendard,sans-serif">${101 + i}</text>`; }
    s += `<circle cx="690" cy="120" r="46" fill="#dbe7d6"/><text x="690" y="124" font-size="11" text-anchor="middle" fill="#3a5a40" font-family="Pretendard,sans-serif">중앙광장</text><rect x="650" y="220" width="110" height="60" rx="6" fill="#e6e2d9"/><text x="705" y="254" font-size="11" text-anchor="middle" fill="#5c5244" font-family="Pretendard,sans-serif">커뮤니티</text></svg>`;
    return s;
  }

  function planCard(t) {
    const bought = Store.isPurchased(t.id);
    const inCart = Store.cartHas(t.id);
    const tv = Store.typeView(t);
    if (tv.status === 'hidden') return `<div class="cx-missing"><div class="pc-thumb">${icon('file', 'ico-24')}</div><div><b>${t.code} 타입</b> — 도면 준비 중입니다. <button type="button" class="btn btn-sm btn-ghost" data-req="${t.code}">등록되면 알림 받기</button><div class="micro muted-3 dev-note">빈 상태 — 도면 미등록 타입</div></div></div>`;
    return `<article class="plan-card" id="t-${t.code}">
      <a class="pc-thumb" href="plan.html?id=${t.id}" aria-label="${t.code} 타입 상세">${APT.planSVG(t, 'thumb')}</a>
      <div class="flex col" style="min-width:0">
        <div class="row-between"><span class="pc-code">${t.code}<span class="muted-3" style="font-size:13px;font-weight:500;margin-left:6px">타입</span></span>${bought ? '<span class="badge badge-pos">구매함</span>' : inCart ? '<span class="badge badge-action">장바구니</span>' : ''}</div>
        <div class="pc-area">전용 ${fmt.area(t.exclusive)} · 공급 ${fmt.area(t.supply)} · 방 ${t.rooms} 욕실 ${t.baths}</div>
        <div class="meta-badges mt-2"><span class="badge badge-outline">${APT.BASIS[t.meta.basis]}</span><span class="badge ${t.meta.expansion ? 'badge-info' : 'badge-outline'}">확장 ${t.meta.expansion ? '반영' : '미반영'}</span><span class="badge badge-outline">${t.formats.map(f => f.toUpperCase()).join('·')}</span></div>
        <div class="pc-foot"><div>${fmt.price(Store.priceOf(t, 'jpg'), 'num-md')}<span class="price-sub"> 부터</span></div>
          ${bought ? `<a class="btn btn-sm btn-primary" href="viewer.html?id=${t.id}">뷰어 열기</a>` : `<div class="row"><a class="btn btn-sm btn-secondary" href="plan.html?id=${t.id}#preview">미리보기</a><button type="button" class="btn btn-sm btn-primary" data-cart="${t.id}" ${inCart ? 'disabled' : ''}>${inCart ? '담김' : '담기'}</button></div>`}
        </div>
      </div></article>`;
  }

  function render() {
    const overflow = types.length > 7;
    main.innerHTML = `
    <div class="cx-head">
      <nav class="bc" aria-label="경로"><a href="index.html">홈</a><span class="sep">/</span><a href="search.html?region=${encodeURIComponent(c.region)}">${esc(c.region)}</a><span class="sep">/</span><a href="search.html?q=${encodeURIComponent(c.gu)}">${esc(c.gu)}</a><span class="sep">/</span><span>${esc(c.name)}</span></nav>
      <div class="cx-title">
        <div><h1 class="h1 clamp2" title="${esc(c.name)}">${esc(c.name)}</h1>
          <div class="cx-meta"><span>${icon('pin', 'ico-16')}${esc(c.addr)}</span><span>${icon('building', 'ico-16')}${c.built}년 준공 · ${fmt.num(c.households)}세대 · ${c.dongs}개동 · ${c.floors}층</span><span>시공 ${esc(c.builder)}</span></div>
          ${dup.length ? `<div class="notice notice-warn mt-3" style="display:inline-flex">${icon('alert', 'ico-16')}<span>이름이 같은 단지가 있습니다 — ${dup.map(d => `<a href="complex.html?id=${d.id}" style="text-decoration:underline;font-weight:700">${esc(d.name)}</a> (${d.built}년 · ${d.addr.split(' ').slice(-1)[0]})`).join(', ')}. 주소와 준공년도를 확인하세요.</span></div>` : ''}
        </div>
        <div class="cx-actions"><button type="button" class="btn btn-secondary" data-share>${icon('copy')} 링크 복사</button><a class="btn btn-secondary" href="compare.html?a=${types[0].id}&b=${(types[1] || types[0]).id}">${icon('compare')} 타입 비교</a></div>
      </div>
    </div>
    <div class="cx-tabs"><div class="type-tabs">
      <div class="tabs" role="tablist" aria-label="타입">${types.map(t => `<button class="tab" role="tab" aria-selected="${t.id === cur}" data-t="${t.id}">${t.code}<small>${t.exclusive.toFixed(0)}㎡</small></button>`).join('')}</div>
      ${overflow ? `<div class="tt-all"><button type="button" class="btn btn-sm btn-ghost" data-dd="all">전체 타입 ${types.length} ${icon('chevD', 'ico-16')}</button><div class="dropdown" data-ddbox="all">${types.map(t => `<button type="button" data-t="${t.id}">${t.code} <span class="dd-sub">전용 ${t.exclusive}㎡ · 방 ${t.rooms}</span></button>`).join('')}</div></div>` : ''}
    </div></div>
    <div class="cx-body">
      <div>
        <section class="cx-sec" id="plans"><div class="row-between mb-4"><h2 class="h2" style="margin:0">타입별 도면 <span class="muted-3" style="font-size:16px;font-weight:500">${pub.length}종</span></h2><span class="src-caption">가격은 VAT 포함 · 출처: 아파트고 재작도 · 기준 ${c.updated}</span></div>
          <div class="plan-grid" ${rendered ? 'data-reveal-group class="is-in"' : 'data-reveal-group'}>${types.map(planCard).join('')}</div></section>
        <section class="cx-sec" id="site"><h2 class="h2">단지 배치도 <span class="muted-3" style="font-size:14px;font-weight:500">선택한 타입이 있는 동을 강조</span></h2><div class="site-plan">${sitePlan()}<div class="sp-leg"><span><i style="background:#0041d9"></i>${types.find(t => t.id === cur).code} 타입 동</span><span><i style="background:#1f2b5e;opacity:.55"></i>그 외</span></div></div><p class="src-caption mt-3">배치도는 도식입니다. 동·호 배치는 분양 안내서 기준이며 실제와 다를 수 있습니다.</p></section>
        <section class="cx-sec" id="trades"><div class="row-between mb-4"><h2 class="h2" style="margin:0">최근 실거래 <span class="badge badge-outline">옵션 블록</span></h2></div>
          <div class="table-wrap"><table class="table"><thead><tr><th>계약일</th><th>타입</th><th>전용</th><th>층</th><th class="num">거래가</th><th class="num">직전 대비</th></tr></thead><tbody>${trades.map(t => `<tr class="trade-row"><td>${t.d}${t.canceled ? '<span class="badge badge-danger">해제</span>' : ''}</td><td>${t.code}</td><td>${t.ex}㎡</td><td>${t.floor}층</td><td class="num" style="font-weight:700;${t.canceled ? 'text-decoration:line-through;color:var(--ink-3)' : ''}">${t.price}억</td><td class="num ${t.canceled ? 'muted-3' : t.delta >= 0 ? 'up' : 'down'}" style="font-weight:600">${t.canceled ? '—' : (t.delta >= 0 ? '▲' : '▼') + ' ' + Math.abs(t.delta).toFixed(1) + '%'}</td></tr>`).join('')}</tbody></table></div>
          <p class="src-caption mt-3">출처: 국토교통부 실거래가 공개시스템 · 기준일 2026.10.15 · 「해제」는 계약 해제 신고 건입니다. 시세 색은 상승 빨강·하락 파랑(국내 관행).</p></section>
      </div>
      <aside>
        <div class="aside-card">
          <span class="eyebrow">이 단지 도면</span>
          <div class="ac-price">${fmt.price(minPrice)}<span class="price-sub">부터 · VAT 포함</span></div>
          <p class="body-sm muted">${pub.length}개 타입 · JPG ${fmt.won(APT.FORMATS.jpg.price)} / PDF ${fmt.won(APT.FORMATS.pdf.price)} / DWG ${fmt.won(APT.FORMATS.dwg.price)}</p>
          <ul><li>${icon('check', 'ico-16')}구매 전 미리보기 제공 (시험 사용)</li><li>${icon('check', 'ico-16')}같은 단지 3개 타입↑ 10% 묶음 할인</li><li>${icon('check', 'ico-16')}열람하지 않은 도면은 7일 내 환불</li></ul>
          <button type="button" class="btn btn-primary btn-block" data-cart-all ${pub.filter(t => !Store.isPurchased(t.id) && !Store.cartHas(t.id)).length ? '' : 'disabled'}>${(n => n ? `남은 ${n}개 타입 JPG로 담기` : '모든 타입이 담겼거나 구매됨')(pub.filter(t => !Store.isPurchased(t.id) && !Store.cartHas(t.id)).length)}</button>
          <a class="btn btn-ghost btn-block mt-2" href="plan.html?id=${cur}">선택한 타입 상세 보기</a>
          <p class="micro muted-3 mt-3">도면은 분양 도면 또는 재작도 기준이며 실제 세대와 다를 수 있습니다. 설계·시공 전 실측하세요.</p>
        </div>
      </aside>
    </div>
    <div class="sticky-bar"><div class="sb-price">${fmt.price(minPrice, 'num-md')}<span class="micro">부터 · VAT 포함 · ${pub.length}개 타입</span></div><a class="btn btn-primary" href="plan.html?id=${cur}">${APT.type(cur).code} 타입 보기</a></div>`;
    document.body.classList.add('has-sticky');
    if (!rendered) UI.reveal(); rendered = true;
    $$('[data-t]', main).forEach(b => b.addEventListener('click', () => { cur = b.dataset.t; render(); const el = $('#t-' + APT.type(cur).code); el && el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }));
    const dd = $('[data-dd="all"]', main); dd && dd.addEventListener('click', e => { e.stopPropagation(); $('[data-ddbox="all"]', main).classList.toggle('open'); });
    if (!docBound) { docBound = true; document.addEventListener('click', () => { const b = $('[data-ddbox="all"]', main); b && b.classList.remove('open'); }); }
    const tabsEl = $('.type-tabs .tabs', main); if (tabsEl) { const ind = document.createElement('i'); ind.className = 'tab-ind'; tabsEl.append(ind); const a = $('.tab[aria-selected="true"]', tabsEl); if (a) { ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft}px)`; } }
    const tabs = $('.tabs', main); const act = $('.tab[aria-selected="true"]', tabs); act && act.scrollIntoView({ inline: 'center', block: 'nearest' });
    $$('[data-cart]', main).forEach(b => b.addEventListener('click', () => { Store.cartAdd(b.dataset.cart, 'jpg'); UI.toast(`${APT.type(b.dataset.cart).code} 타입(JPG)을 장바구니에 담았습니다`, { type: 'pos', icon: 'check', action: { href: 'cart.html', label: '장바구니' } }); render(); }));
    $('[data-cart-all]', main).addEventListener('click', () => { let n = 0; pub.forEach(t => { if (!Store.isPurchased(t.id) && !Store.cartHas(t.id)) { Store.cartAdd(t.id, 'jpg'); n++; } }); const distinct = new Set(Store.get('cart').filter(x => APT.type(x.typeId).complexId === c.id).map(x => x.typeId)).size; UI.toast(n ? `${n}개 타입을 담았습니다${distinct >= APT.BUNDLE_MIN ? ' — 묶음 할인 10% 적용' : ''}` : '이미 담겼거나 구매한 타입입니다', { type: n ? 'pos' : '', icon: 'check', action: { href: 'cart.html', label: '장바구니' } }); render(); });
    $$('[data-req]', main).forEach(b => b.addEventListener('click', () => UI.toast(`${b.dataset.req} 타입 도면이 등록되면 알려 드립니다`, { type: 'pos', icon: 'bell' })));
    $('[data-share]', main).addEventListener('click', () => { try { navigator.clipboard.writeText(location.href); } catch (e) { } UI.toast('링크를 복사했습니다', { icon: 'copy' }); });
  }
  render();
})();
