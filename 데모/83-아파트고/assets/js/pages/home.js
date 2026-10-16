/* C-01 메인 홈 */
(function () {
  const { $, $$, esc, icon, fmt } = UI;
  UI.init();

  /* 자동완성 — 동명이 단지는 주소·준공·세대수로 구분 */
  const q = $('#q'), drop = $('#sb-drop');
  let focus = -1;
  function render(list) {
    if (!list.length) { drop.innerHTML = `<div class="sd-empty">일치하는 단지가 없습니다. 철자를 바꾸거나 주소로 검색해 보세요. <a href="search.html?q=${encodeURIComponent(q.value)}" style="color:var(--action);font-weight:700">도면 등록 요청 →</a></div>`; }
    else drop.innerHTML = list.map((c, i) => `<a href="complex.html?id=${c.id}" role="option" data-i="${i}">${icon('building', 'ico-16')}<span><span class="sd-name">${esc(c.name)}</span><br><span class="sd-sub">${esc(c.addr)} · ${c.built}년 · ${fmt.num(c.households)}세대</span></span><span class="sd-cnt">도면 ${APT.typesOf(c.id).length}타입</span></a>`).join('');
    drop.classList.add('open'); q.setAttribute('aria-expanded', 'true'); focus = -1;
  }
  q.addEventListener('input', () => render(UI.suggest(q.value)));
  q.addEventListener('focus', () => render(UI.suggest(q.value)));
  q.addEventListener('keydown', e => {
    const items = $$('a', drop); if (!items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); focus = (focus + 1) % items.length; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focus = (focus - 1 + items.length) % items.length; }
    else if (e.key === 'Enter' && focus >= 0) { e.preventDefault(); location.href = items[focus].href; return; }
    else if (e.key === 'Escape') { drop.classList.remove('open'); return; }
    items.forEach((a, i) => a.classList.toggle('is-focus', i === focus));
  });
  document.addEventListener('click', e => { if (!e.target.closest('.search-big')) { drop.classList.remove('open'); q.setAttribute('aria-expanded', 'false'); } });

  /* 카운트업 */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { UI.countUp(e.target, +e.target.dataset.count); io.unobserve(e.target); } }), { threshold: .5 });
  $$('[data-count]').forEach(el => io.observe(el));

  /* 이용 3단계 — 스티키 도면 시퀀스: 같은 도면이 ① 검색 카드 썸네일 → ② 워터마크 미리보기 → ③ 치수가 그려진 뷰어로 변함 */
  const t = APT.type('c01-84A');
  $('#seq-l1').innerHTML = APT.planSVG(t, 'thumb'); $('#seq-l2').innerHTML = APT.planSVG(t, 'preview'); $('#seq-l3').innerHTML = APT.planSVG(t, 'full');
  const fig = $('.seq-fig'); const caps = { 1: ['검색 결과', '서강 리버파크 84A · 전용 84.97㎡ · 1,240세대'], 2: ['미리보기', '워터마크 · 치수 마스킹 · 확대 200% 상한'], 3: ['구매 후 뷰어', '치수선 · 실별 면적 · JPG/PDF/DWG 다운로드'] };
  const sio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const st = e.target.dataset.step; fig.dataset.stage = st; $('[data-cap]').textContent = caps[st][0]; $('[data-cap2]').textContent = caps[st][1]; $$('.seq-step').forEach(x => x.classList.toggle('is-on', x === e.target)); } }), { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  $$('.seq-step').forEach(el => sio.observe(el));
  /* 신뢰 섹션 — 주석 달린 도면 */
  $('#tr-plan').innerHTML = APT.planSVG(t, 'full');

  /* 최근 등록 단지 카드 */
  const list = APT.allComplexes(Store.get('stress')).slice().sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 4);
  $('#recent-cards').innerHTML = list.map(c => {
    const types = APT.typesOf(c.id).filter(x => x.status === 'public');
    const main = types[Math.min(2, types.length - 1)] || types[0];
    return `<a class="complex-card" href="complex.html?id=${c.id}">
      <div class="cc-media">${APT.planSVG(main, 'thumb')}<div class="cc-badges"><span class="badge-pill">${esc(c.region)} · ${esc(c.gu)}</span>${c.updated >= '2026.10.10' ? '<span class="badge badge-action">NEW</span>' : ''}</div></div>
      <div class="cc-body"><div class="cc-name clamp2" title="${esc(c.name)}">${esc(c.name)}</div><div class="cc-meta">${c.built}년 준공 · ${fmt.num(c.households)}세대 · ${c.dongs}개동</div><div class="cc-sub">${types.length}개 타입 · 전용 ${Math.min(...types.map(x => x.exclusive)).toFixed(0)}~${Math.max(...types.map(x => x.exclusive)).toFixed(0)}㎡</div>
      <div class="cc-foot"><span class="micro muted-3">갱신 ${c.updated}</span><span class="caption" style="color:var(--action)">${fmt.won(APT.FORMATS.jpg.price)}부터</span></div></div></a>`;
  }).join('');
  UI.reveal();

  /* 포맷 카드 + 스포트라이트 */
  const F = APT.FORMATS;
  $('#fmt-cards').innerHTML = [['jpg', false, ['치수선·실별 면적 포함', '4000px 고해상', '인쇄·상담 자료용']], ['pdf', true, ['A3 축척 1:100 벡터', '확대해도 선명', '발주서 첨부용']], ['dwg', false, ['벽·창호·치수 레이어 분리', 'AutoCAD 2018+ 호환', '설계·시공 편집용']]].map(([k, alt, pts]) => `
    <article class="fmt-card ${alt ? 'alt' : ''}" data-spot><span class="fc-ext">${F[k].ext.toUpperCase()}</span><h3>${F[k].label}</h3><p>${F[k].desc}</p><ul>${pts.map(p => `<li>${p}</li>`).join('')}</ul><div class="fc-price">${fmt.price(F[k].price)}<span class="price-sub">VAT 포함 · 공급가 ${fmt.won(APT.calc.supplyOf(F[k].price))}</span></div></article>`).join('');
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    $$('[data-spot]').forEach(c => { let raf; c.addEventListener('pointermove', e => { if (raf) return; raf = requestAnimationFrame(() => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); raf = null; }); }); });
  }

  /* 패럴랙스 (풀블리드 단락) · 텍스트 스크럽 */
  const bg = $('[data-parallax]'), scrub = $('[data-scrub]');
  if (scrub) { const words = scrub.textContent.trim().split(/\s+/); scrub.innerHTML = words.map(w => `<span>${esc(w)}</span> `).join(''); }
  const spans = scrub ? $$('span', scrub) : [];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function onScroll() {
    if (bg && !reduce) { const r = bg.parentElement.getBoundingClientRect(); const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; bg.style.transform = `translateY(${(-p * 60).toFixed(1)}px) scale(1.04)`; }
    if (scrub) { const r = scrub.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (innerHeight * .78 - r.top) / (r.height + innerHeight * .25))); const n = Math.round(p * spans.length); spans.forEach((s, i) => s.classList.toggle('on', reduce || i < n)); }
  }
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive: true });
  onScroll();
})();
