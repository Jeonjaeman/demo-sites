/* ARGILO 공개 페이지 렌더 — body[data-page]에 따라 store 데이터로 그린다 (하드코딩 0) */
(function () {
  'use strict';
  const A = window.Argilo, C = window.ArgiloCalc, UI = window.UI;
  const esc = A.esc, fmt = A.fmt, qs = A.qs;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const thumb = src => src.replace(/\.webp$/, '-720.webp');
  const EST_KEY = 'argilo.est.v1';

  // ── 공통 조각 ─────────────────────────────────────────────
  function certBadge(p) {
    const s = A.certState(p);
    if (p.line === 'display' || p.line === 'solar') return `<span class="badge badge--maker">${p.krStatus === 'consult' ? '국내 인증 진행 중' : '소개 전용 · 국내 인증 전'}</span>`;
    if (p.line === 'other') return '';
    if (s.state === 'ok') return `<span class="badge badge--ok"><i class="dot"></i>${esc(s.label)}${s.exterior ? ' · 외부용' : ''}</span>`;
    if (s.state === 'expired') return `<span class="badge badge--expired">성적서 만료</span>`;
    return `<span class="badge badge--pending">국내 성적서 확인 중</span>`;
  }
  function variantLabel(v) { return `${v.w}×${v.h}${v.t ? `×${v.t}` : ''}mm`; }
  function productCard(p) {
    const img = p.images[0] || {};
    const inCart = A.cart().includes(p.id);
    const disc = p.status === 'discontinued';
    const specs = p.variants.length ? `${p.variants.map(v => `${v.w}×${v.h}`).join(' · ')}mm · ${p.variants[0].perBox}장/박스` : (p.unitLabel || A.LINE[p.line]);
    return `<article class="pcard" data-reveal>
      <a class="pcard__img" href="product.html?id=${p.id}"><img src="${thumb(img.src)}" alt="${esc(img.alt || p.name)}" loading="lazy" class="fade">${certBadge(p)}${disc ? '<div class="disc">단종 · 대체 제품 안내</div>' : ''}</a>
      <div class="pcard__body"><span class="pcard__code">${esc(p.code)} · ${esc(p.series)}</span><h3><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3><p class="specs">${esc(specs)}</p>${p.showPrice && p.priceRef ? `<p class="price num">참고가 ${fmt.won(p.priceRef)}<span class="small"> / ${p.unitLabel || '박스'}</span></p>` : '<p class="price small">가격 상담</p>'}</div>
      <div class="pcard__acts">${p.line === 'display' || p.line === 'solar' ? `<a class="btn btn--ghost" href="support.html#consult">도입 상담</a>` : disc ? `<a class="btn btn--ghost" href="product.html?id=${p.replacementId}">대체 제품 보기</a>` : `<button class="btn btn--sand ${inCart ? 'is-on' : ''}" data-sample="${p.id}">${inCart ? '담김 ✓' : '샘플 담기'}</button>${p.estimable ? `<a class="btn btn--ghost" href="estimate.html?p=${p.id}">견적</a>` : ''}`}</div>
    </article>`;
  }
  function caseCard(c, cls) {
    const ph = c.photos[0] || {};
    const mats = c.products.map(x => A.byId('products', x.id)).filter(Boolean).slice(0, 3);
    return `<a class="case-card ${cls || ''}" href="case.html?id=${c.id}" data-reveal="fade"><img src="${thumb(ph.src)}" alt="${esc(ph.alt || c.title)}" loading="lazy" class="fade"><span class="case-card__meta">${esc(A.regionLabel(c.region))} · ${c.year}</span><div class="case-card__body"><span class="tag">${esc(c.space)}</span><h3>${esc(c.title)}</h3><div class="mats">${mats.map(m => `<span>${esc(m.name)}</span>`).join('')}</div></div></a>`;
  }
  function bindSample(root) {
    $$('[data-sample]', root || document).forEach(b => b.addEventListener('click', () => {
      const r = A.cartAdd(b.dataset.sample);
      if (!r.ok) { UI.toast(`샘플은 최대 ${r.limit}개까지 담을 수 있습니다.`, 'bad'); return; }
      if (r.dup) { UI.toast('이미 담긴 샘플입니다.'); return; }
      $$(`[data-sample="${b.dataset.sample}"]`).forEach(x => { x.classList.add('is-on'); x.textContent = '담김 ✓'; });
      UI.toast(`샘플 담기 ${r.count}/${A.get('settings').sampleLimit.person} · <a href="sample.html" style="text-decoration:underline">신청하러 가기</a>`, 'ok');
    }));
  }
  function setText(sel, v) { const el = $(sel); if (el) el.textContent = v; }

  // ── 홈 ────────────────────────────────────────────────────
  function home() {
    // 인트로 (1회 · 세션)
    const intro = $('#intro');
    if (intro) {
      let seen = false; try { seen = sessionStorage.getItem('argilo.intro') === '1'; } catch (e) {}
      if (seen || UI.reduce) intro.remove();
      else {
        const words = ['휘어지는', '가벼운', '타지 않는', 'ARGILO'];
        const w = $('.intro__word', intro);
        const show = (t) => { w.innerHTML = t.split('').map((ch, i) => `<span style="transition-delay:${i * 20}ms">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join(''); w.classList.remove('up'); requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add('is-in'))); };
        let k = 0; show(words[0]);
        const end = () => { intro.classList.add('out'); try { sessionStorage.setItem('argilo.intro', '1'); } catch (e) {} setTimeout(() => intro.remove(), 800); };
        const timer = setInterval(() => { k++; if (k >= words.length) { clearInterval(timer); end(); return; } w.classList.remove('is-in'); w.classList.add('up'); setTimeout(() => show(words[k]), 420); }, 760);
        $('.intro__skip', intro).addEventListener('click', () => { clearInterval(timer); end(); });
      }
    }
    // 라인업 틸트 카드
    const lines = [['stone', '아르길로 스톤', '스톤 · 브릭 · 우드 · 라지 포맷', 'stone.html'], ['display', '아르길로 디스플레이', '꺼지면 돌, 켜면 외벽 전체가 화면', 'display.html'], ['solar', '아르길로 쏠라', '유리 없이 발전하는 외장재', 'solar.html'], ['other', '기타자재', '접착제 · 메쉬 · 트림 · 프라이머', 'others.html']];
    const imgs = { stone: 'assets/img/case-livingroom.webp', display: 'assets/img/hero-display.webp', solar: 'assets/img/hero-solar.webp', other: 'assets/img/others-materials.webp' };
    const lu = $('#lineup');
    if (lu) lu.innerHTML = lines.map((l, i) => { const n = A.publicProducts(l[0]).filter(p => p.status === 'active').length; return `<a class="tcard" href="${l[3]}" data-tilt data-reveal><div class="tilt__in"><img src="${imgs[l[0]]}" alt="" loading="lazy" class="fade"><div class="shade"></div><div class="spot"></div><span class="tcard__num">0${i + 1}</span><span class="tcard__cta" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17L17 7M8 7h9v9"/></svg></span><div class="tcard__body"><span class="tag">${n}개 ${l[0] === 'other' ? '품목' : '제품'}</span><h3>${l[1]}</h3><p>${l[2]}</p></div></div></a>`; }).join('');
    // 캐러셀
    const car = $('#case-track');
    if (car) {
      car.innerHTML = A.publishedCases().slice(0, 6).map(c => { const mats = c.products.map(x => A.byId('products', x.id)).filter(Boolean).slice(0, 2); return `<a class="car__slide" href="case.html?id=${c.id}"><img src="${c.photos[0].src}" alt="${esc(c.photos[0].alt)}" loading="lazy" class="fade"><div class="car__cap"><div><span class="tag">${esc(c.space)} · ${esc(A.regionLabel(c.region))}</span><h3>${esc(c.title)}</h3><div class="mats">${mats.map(m => `<span>${esc(m.name)}</span>`).join('')}</div></div></div></a>`; }).join('');
      UI.carousel($('#case-car'));
    }
    // 미니 견적
    const sel = $('#mini-p');
    if (sel) {
      const ps = A.publicProducts('stone').filter(p => p.estimable);
      sel.innerHTML = ps.map(p => `<option value="${p.id}">${esc(p.name)} · ${p.variants[0].w}×${p.variants[0].h}</option>`).join('');
      const run = () => {
        const p = A.byId('products', sel.value); const w = +$('#mini-w').value, h = +$('#mini-h').value;
        const r = C.estimate(p, { variantId: p.variants[0].id, location: 'interior', pattern: 'straight', walls: [{ w, h }] });
        if (!r.ok) return;
        setText('#mini-area', fmt.num(r.area.net, 2)); setText('#mini-sheets', r.sheets); setText('#mini-boxes', r.boxes);
        $('#mini-go').href = `estimate.html?p=${p.id}&w=${w}&h=${h}`;
        $('#mini-note').textContent = `${variantLabel(r.variant)} · ${r.perBox}장/박스 · 로스 ${r.lossPct}% · 남는 장수 ${r.leftover}장 — 값은 관리자 제품 데이터에서 읽습니다.`;
      };
      ['#mini-p', '#mini-w', '#mini-h'].forEach(s => $(s).addEventListener('input', run)); run();
    }
    // 수치
    const st = $('#home-stats');
    if (st) { const cases = A.publishedCases(); const area = cases.reduce((a, c) => a + (c.area || 0), 0); const certs = A.get('products').reduce((a, p) => a + A.activeCerts(p).length, 0); st.innerHTML = [[cases.length, '', '공개 시공사례'], [Math.round(area), '㎡', '시공 면적 합계'], [A.publicProducts('stone').filter(p => p.status === 'active').length, '', '스톤 라인 제품'], [certs, '', '유효 국내 시험성적서']].map(x => `<div class="stat" data-reveal><b><span data-count="${x[0]}">0</span>${x[1] ? `<small>${x[1]}</small>` : ''}</b><span>${x[2]}</span></div>`).join(''); }
    // 소식·자료
    const nw = $('#home-news');
    if (nw) nw.innerHTML = A.publicResources('news').slice(0, 3).map(n => `<a class="news-row" href="resource.html?id=${n.id}"><time>${esc(n.date)}</time><h3>${esc(n.title)}</h3><span class="arr">→</span></a>`).join('');
    UI.init(); bindSample();
  }

  // ── 아르길로란 ────────────────────────────────────────────
  function about() {
    const ps = A.publicProducts('stone').filter(p => p.status === 'active');
    const kr = ps.filter(p => A.activeCerts(p).length), ext = ps.filter(p => A.certState(p).exterior);
    setText('#n-kr', kr.length); setText('#n-ext', ext.length); setText('#n-pending', ps.length - kr.length);
    const list = $('#cert-list'); if (list) list.innerHTML = ps.map(p => { const s = A.certState(p); const c = A.activeCerts(p)[0]; return `<div class="cert ${s.state !== 'ok' ? 'cert--pending' : ''}"><span class="swatch" style="background-image:url(${thumb(p.images[0].src)})"></span><div><b>${esc(p.name)}</b><small>${c ? `${esc(c.grade)} · ${esc(c.std)} · ${c.exterior ? '외부용' : '내부용'} · 유효 ${esc(c.validUntil)}` : '국내 시험성적서 등록 전 — 외벽 적용은 상담 후 확정'}</small></div>${certBadge(p)}</div>`; }).join('');
    setText('#supply', A.get('settings').company);
    UI.init();
  }

  // ── 스톤 라인 ─────────────────────────────────────────────
  function stone() {
    const ps = A.publicProducts('stone').filter(p => p.status === 'active');
    const g = $('#stone-grid'); if (g) g.innerHTML = ps.map(productCard).join('');
    const t = $('#variant-table');
    if (t) { const rows = []; ps.forEach(p => p.variants.forEach(v => rows.push([p, v]))); t.innerHTML = `<thead><tr><th>제품</th><th>판형 코드</th><th>규격 (mm)</th><th>두께</th><th>박스당</th><th>㎡/박스</th><th>중량</th><th>권장 용도</th></tr></thead><tbody>${rows.map(([p, v]) => `<tr><td><a href="product.html?id=${p.id}">${esc(p.name)}</a></td><td>${esc(v.code || '—')}</td><td class="num">${v.w} × ${v.h}</td><td class="num">${v.t}mm</td><td class="num">${v.perBox}장</td><td class="num">${fmt.num(v.m2Box, 2)}</td><td class="num">${v.kgm2}kg/㎡</td><td>${p.uses.map(u => A.USE[u]).join(' · ')}</td></tr>`).join('')}</tbody>`; }
    UI.init(); bindSample();
  }

  // ── 디스플레이 · 쏠라 ─────────────────────────────────────
  function special(id) {
    const p = A.byId('products', id); if (!p) return;
    setText('#sp-status', p.krStatus === 'consult' ? '수입 상담 라인 — 국내 KS 인증 진행 중' : '소개 전용 라인 — 국내 인증 전');
    const sp = $('#sp-specs'); if (sp) sp.innerHTML = (p.specsAbroad || []).map(s => `<tr><td>${esc(s.k)}</td><td>${esc(s.v)} ${s.src === 'maker' ? '<span class="badge badge--maker">제조사 발표 기준</span>' : ''}</td></tr>`).join('');
    UI.init();
  }

  // ── 제품보기 ──────────────────────────────────────────────
  function products() {
    const line = qs('line') || 'stone';
    const state = { line, use: '', series: '', cert: false, sort: 'recent' };
    const titles = { stone: ['아르길로 스톤 제품', '판형·두께·박스 구성이 다른 제품들을 한 기준으로 비교합니다. 성적서가 있는 제품은 배지로 구분됩니다.'], other: ['기타자재 제품', '롤·포대·개 단위로 판매하는 부자재와 마감재입니다. 셀프견적 결과에 부자재 소요량이 함께 나옵니다.'] };
    const tt = titles[line] || titles.stone; setText('#pl-title', tt[0]); setText('#pl-lead', tt[1]);
    const sub = $('#others-sub'); if (sub) sub.hidden = line !== 'other';
    const all = A.publicProducts(line === 'other' ? 'other' : null).filter(p => line === 'other' ? true : p.line !== 'other');
    const seriesSet = Array.from(new Set(all.map(p => p.series)));
    const fx = $('#filters');
    const render = () => {
      let list = all.filter(p => (!state.use || p.uses.includes(state.use)) && (!state.series || p.series === state.series) && (!state.cert || A.certState(p).state === 'ok'));
      if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'ko')); else if (state.sort === 'price') list.sort((a, b) => (a.priceRef || 1e9) - (b.priceRef || 1e9)); else list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      fx.innerHTML = `<span class="lbl">용도</span>${['', 'interior', 'bath', 'exterior', 'curve'].map(u => `<button class="chip" data-k="use" data-v="${u}" aria-pressed="${state.use === u}">${u ? A.USE[u] : '전체'}<sup>${all.filter(p => !u || p.uses.includes(u)).length}</sup></button>`).join('')}<span class="sep"></span><span class="lbl">시리즈</span>${['', ...seriesSet].map(s => `<button class="chip" data-k="series" data-v="${esc(s)}" aria-pressed="${state.series === s}">${s || '전체'}</button>`).join('')}${line !== 'other' ? `<span class="sep"></span><button class="chip" data-k="cert" aria-pressed="${state.cert}">국내 성적서 있음</button>` : ''}<span class="count"><b>${list.length}</b>개 제품 · <select class="in" style="height:32px;padding:0 30px 0 10px;font-size:13px;display:inline-block;width:auto" id="sort"><option value="recent" ${state.sort === 'recent' ? 'selected' : ''}>최근 갱신순</option><option value="name" ${state.sort === 'name' ? 'selected' : ''}>이름순</option><option value="price" ${state.sort === 'price' ? 'selected' : ''}>참고가순</option></select></span>`;
      $$('.chip', fx).forEach(b => b.addEventListener('click', () => { const k = b.dataset.k; if (k === 'cert') state.cert = !state.cert; else state[k] = b.dataset.v; render(); }));
      $('#sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
      const g = $('#p-grid'); g.innerHTML = list.length ? list.map(productCard).join('') : `<div class="empty" style="grid-column:1/-1"><b>조건에 맞는 제품이 없습니다</b>필터를 줄이거나 상담으로 문의해 주세요. <a class="link" href="support.html#consult">상담신청</a></div>`;
      UI.init(g); bindSample(g);
    };
    render();
    addEventListener('argilo:change', render);
  }

  // ── 제품 상세 ─────────────────────────────────────────────
  function product() {
    const p = A.byId('products', qs('id')) || A.publicProducts('stone')[0];
    document.title = `${p.name} — ARGILO 아르길로`;
    const el = $('#pd'); const cases = A.casesForProduct(p.id); const res = A.publicResources().filter(r => (r.productIds || []).includes(p.id) && r.cat !== 'news');
    const inCart = A.cart().includes(p.id); const isSpecial = p.line === 'display' || p.line === 'solar'; const disc = p.status === 'discontinued';
    const rep = disc ? A.byId('products', p.replacementId) : null;
    let vi = 0;
    const certs = A.activeCerts(p), allKr = p.certsKr || [];
    el.innerHTML = `
      <div class="pd__gal">
        <div class="main clip" data-reveal="fade"><img id="pd-main" src="${p.images[0].src}" alt="${esc(p.images[0].alt)}"></div>
        ${p.images.length > 1 ? `<div class="pd__thumbs">${p.images.map((im, i) => `<button aria-pressed="${i === 0}" data-i="${i}"><img src="${thumb(im.src)}" alt=""></button>`).join('')}</div>` : ''}
        <p class="small">이미지 출처 — ${p.images.map(im => ({ own: '자체 촬영', partner: '시공 파트너 제공', owner: '건축주 제공', maker: '제조사 제공 ©' }[im.source] || im.source)).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}. 촬영·모니터 환경에 따라 실물과 색이 다를 수 있어 샘플 확인을 권합니다.</p>
      </div>
      <div class="pd__buy">
        <div><span class="pcard__code">${esc(p.code)} · ${esc(A.LINE[p.line])} · ${esc(p.series)}</span><h1 class="mt1">${esc(p.name)}</h1><p class="sum mt2">${esc(p.summary)}</p><div class="mt2" style="display:flex;gap:8px;flex-wrap:wrap">${certBadge(p)}${disc ? '<span class="badge badge--expired">단종</span>' : ''}${p.uses.map(u => `<span class="badge badge--pending">${A.USE[u]}</span>`).join('')}</div></div>
        ${disc && rep ? `<div class="notice notice--warn"><b>2024년 단종된 제품입니다.</b> 시공사례 기록용으로 남겨 두었습니다. 대체 제품 <a href="product.html?id=${rep.id}" style="text-decoration:underline">${esc(rep.name)}</a>을 확인해 주세요.</div>` : ''}
        ${p.variants.length ? `<div class="opt"><h4>판형 선택 <span>폭 ${p.variants[0].w}mm 공통 · 길이 코드 ${p.variants.map(v => v.code || '').filter(Boolean).join('·')}</span></h4><div class="opt-row" id="pd-vars">${p.variants.map((v, i) => `<button class="tile" aria-pressed="${i === 0}" data-i="${i}"><b>${v.w}×${v.h}</b><small>${v.t}mm · ${v.perBox}장/박스 · ${fmt.num(v.m2Box, 2)}㎡</small></button>`).join('')}</div></div>` : ''}
        ${p.showPrice && p.priceRef ? `<div class="price-line"><b class="num">${fmt.won(p.priceRef)}</b><small>/ ${p.unitLabel || '박스'} · 자재비 참고가 · 운반비·시공비·부가세 별도</small></div>` : `<div class="price-line"><b style="font-size:18px">가격 상담</b><small>단가는 수량·납기에 따라 견적으로 안내합니다</small></div>`}
        <div class="pd__acts">
          ${isSpecial ? `<a class="btn btn--clay btn--arrow" href="support.html#consult">도입 상담 신청</a><a class="btn btn--ghost" href="resources.html?cat=catalog">제조사 소개 자료</a>` : disc ? `<a class="btn btn--clay" href="product.html?id=${p.replacementId}">대체 제품 보기</a>` : `${p.estimable ? `<a class="btn btn--clay btn--arrow" id="pd-est" href="estimate.html?p=${p.id}">이 자재로 셀프견적</a>` : ''}<button class="btn btn--sand ${inCart ? 'is-on' : ''}" data-sample="${p.id}">${inCart ? '샘플 담김 ✓' : '샘플 담기 · 무료'}</button>`}
        </div>
        <div class="pd__trust">
          <div><svg viewBox="0 0 24 24"><path d="M3 7h13v10H3zM16 10h4l1 3v4h-5"/><circle cx="7" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/></svg>샘플은 개인 5개 · 사업자 10개까지 무료, 영업일 2일 내 발송</div>
          <div><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg>영업일 4시간 안에 담당자 연락 · 업무시간 외 카톡 자동응답</div>
          ${A.get('settings').region ? `<div><svg viewBox="0 0 24 24"><path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>${esc(A.get('settings').region)} 쇼룸 실물 비치</div>` : ''}
        </div>
      </div>`;
    $$('#pd-vars .tile').forEach(b => b.addEventListener('click', () => { vi = +b.dataset.i; $$('#pd-vars .tile').forEach(x => x.setAttribute('aria-pressed', x === b)); $$('#spec-vars tr').forEach((r, i) => r.classList.toggle('is-on', i === vi)); const est = $('#pd-est'); if (est) est.href = `estimate.html?p=${p.id}&v=${p.variants[vi].id}`; }));
    $$('.pd__thumbs button').forEach(b => b.addEventListener('click', () => { $('#pd-main').src = p.images[+b.dataset.i].src; $$('.pd__thumbs button').forEach(x => x.setAttribute('aria-pressed', x === b)); }));
    // 스펙 패널
    const sp = $('#pd-spec');
    sp.innerHTML = `
      <div><h3>Specifications</h3>${p.variants.length ? `<table class="variants spec-vars" id="spec-vars"><thead><tr><th>코드</th><th>규격 (mm)</th><th>두께</th><th>박스당</th><th>㎡/박스</th></tr></thead><tbody>${p.variants.map((v, i) => `<tr class="${i === 0 ? 'is-on' : ''}"><td>${esc(v.code || '—')}</td><td class="num">${v.w} × ${v.h}</td><td class="num">${v.t}mm</td><td class="num">${v.perBox}장</td><td class="num">${fmt.num(v.m2Box, 2)}</td></tr>`).join('')}</tbody></table>` : ''}<table>${p.variants.length ? `<tr><td>중량</td><td>${p.variants[0].kgm2} kg/㎡ (타일 대비 약 1/4)</td></tr>` : `<tr><td>판매 단위</td><td>${esc(p.unitLabel || '—')}</td></tr>`}<tr><td>질감 · 색상</td><td>${esc(p.texture)} · ${esc(p.color)}</td></tr><tr><td>권장 용도</td><td>${p.uses.map(u => A.USE[u]).join(' · ')}</td></tr>${p.rule && p.rule.loss ? `<tr><td>시공 규칙</td><td>줄눈 실내 ${p.rule.gIn}mm · 외벽 ${p.rule.gOut}mm<br>로스율 일자 ${p.rule.loss.straight}% · 엇갈림 ${p.rule.loss.offset}% · 헤링본 ${p.rule.loss.herringbone}% · 곡면 ${p.rule.loss.curve}%</td></tr>` : ''}${p.rule && p.rule.adhesive ? `<tr><td>접착제 소요</td><td>${p.rule.adhesive.min}~${p.rule.adhesive.max} kg/㎡</td></tr>` : ''}${(p.specsAbroad || []).map(s => `<tr><td>${esc(s.k)}</td><td>${esc(s.v)}${s.src === 'maker' ? ' <span class="badge badge--maker">제조사 발표 기준</span>' : ''}</td></tr>`).join('')}<tr><td>데이터 갱신</td><td>${esc(p.updatedAt)} · 관리자 입력값</td></tr></table></div>
      <div><h3>Performance & Downloads</h3>
        <div class="cert-row">${certs.length ? certs.map(c => `<div class="cert"><span class="badge badge--ok">${esc(c.grade)}</span><div><b>${esc(c.std)} · ${c.exterior ? '외부용' : '내부용'}</b><small>${esc(c.org)} · ${esc(c.no)} · 유효 ${esc(c.validUntil)}</small></div>${c.file ? `<button class="btn btn--xs btn--ghost" data-dl="${c.file}">PDF</button>` : ''}</div>`).join('') : (isSpecial ? '' : `<div class="cert cert--pending"><span class="badge badge--pending">확인 중</span><div><b>국내 시험성적서 등록 전</b><small>${allKr.length ? '등록된 성적서가 만료되었습니다. 갱신 중.' : '외벽 적용은 성적서 확인 후 상담으로 확정합니다.'}</small></div></div>`)}
        ${(p.certsAbroad || []).map(c => `<div class="cert cert--abroad"><span class="badge badge--maker">${esc(c.grade)}</span><div><b>${esc(c.std)}</b><small>${esc(c.note)} — 국내 성적서를 대체하지 않습니다</small></div></div>`).join('')}</div>
        ${res.length ? `<div class="dl-list mt3">${res.map(r => `<button data-dl="${r.id}"><span>${esc(r.title)}</span><small>${r.ext.toUpperCase()} · ${fmt.size(r.size)} ↓</small></button>`).join('')}</div>` : ''}
      </div>`;
    $$('[data-dl]').forEach(b => b.addEventListener('click', () => { const r = A.byId('resources', b.dataset.dl); if (r) { A.downloadResource(r); UI.toast('자료를 내려받았습니다 (데모 파일)', 'ok'); } }));
    // 연계 사례
    const cs = $('#pd-cases'); const wrap = $('#pd-cases-wrap');
    if (cases.length) { cs.innerHTML = cases.map(c => caseCard(c)).join(''); setText('#pd-cases-n', `${cases.length}건`); }
    else wrap.innerHTML = `<div class="empty"><b>아직 이 자재의 공개 시공사례가 없습니다</b>관리자에서 시공사례를 등록하며 사용 자재에 ${esc(p.name)}을 체크하면 이 자리에 자동으로 연결됩니다.</div>`;
    UI.init(); bindSample();
    UI.imgs();
  }

  // ── 시공사례 목록 ─────────────────────────────────────────
  function cases() {
    const line = qs('line');
    const state = { space: '', pid: '', region: '' };
    const sub = $('#others-sub'); if (sub) sub.hidden = line !== 'other';
    if (line === 'other') { setText('#cs-title', '기타자재가 쓰인 시공사례'); setText('#cs-lead', '보강 메쉬·접착제·트림 같은 부자재가 함께 들어간 현장입니다.'); }
    const base = A.publishedCases().filter(c => line === 'other' ? c.products.some(x => (A.byId('products', x.id) || {}).line === 'other') : true);
    const spaces = Array.from(new Set(base.map(c => c.space.split(' · ')[0])));
    const pids = Array.from(new Set(base.flatMap(c => c.products.map(x => x.id)))).map(id => A.byId('products', id)).filter(p => p && p.line !== 'other');
    const regions = Array.from(new Set(base.map(c => c.region.si)));
    const fx = $('#filters'), g = $('#cases-grid');
    const render = () => {
      const list = base.filter(c => (!state.space || c.space.startsWith(state.space)) && (!state.pid || c.products.some(x => x.id === state.pid)) && (!state.region || c.region.si === state.region));
      fx.innerHTML = `<span class="lbl">공간</span>${['', ...spaces].map(s => `<button class="chip" data-k="space" data-v="${esc(s)}" aria-pressed="${state.space === s}">${s || '전체'}<sup>${base.filter(c => !s || c.space.startsWith(s)).length}</sup></button>`).join('')}<span class="sep"></span><span class="lbl">사용 자재</span><select class="in" id="f-pid" style="height:32px;padding:0 30px 0 10px;font-size:13px;width:auto"><option value="">전체</option>${pids.map(p => `<option value="${p.id}" ${state.pid === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select><span class="sep"></span><span class="lbl">지역</span><select class="in" id="f-reg" style="height:32px;padding:0 30px 0 10px;font-size:13px;width:auto"><option value="">전체</option>${regions.map(r => `<option ${state.region === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select><span class="count"><b>${list.length}</b>건</span>`;
      $$('.chip', fx).forEach(b => b.addEventListener('click', () => { state.space = b.dataset.v; render(); }));
      $('#f-pid').addEventListener('change', e => { state.pid = e.target.value; render(); });
      $('#f-reg').addEventListener('change', e => { state.region = e.target.value; render(); });
      g.innerHTML = list.length ? list.map(c => caseCard(c)).join('') : `<div class="empty" style="grid-column:1/-1"><b>조건에 맞는 사례가 없습니다</b>필터를 줄여 보세요.</div>`;
      UI.init(g);
    };
    render(); addEventListener('argilo:change', render);
  }

  // ── 시공사례 상세 ─────────────────────────────────────────
  function caseDetail() {
    const c = A.byId('cases', qs('id')) || A.publishedCases()[0];
    document.title = `${c.title} — 시공사례 · ARGILO`;
    const mats = c.products.map(x => ({ x, p: A.byId('products', x.id) })).filter(o => o.p);
    const main = mats.find(m => m.p.line !== 'other') || mats[0];
    $('#case-hero').innerHTML = `<div class="hero__media"><img src="${c.photos[0].src}" alt="${esc(c.photos[0].alt)}" data-parallax="0.14"></div><div class="hero__in"><div><div class="crumbs" style="color:rgba(243,239,235,.7)"><a href="cases.html">시공사례</a><span>${esc(c.space)}</span></div><h1 class="d-l" data-lines>${esc(c.title)}</h1></div><div class="hero__side"><p style="white-space:nowrap">${esc(A.regionLabel(c.region))} · ${c.year}.${String(c.month).padStart(2, '0')} · ${fmt.num(c.area, 1)}㎡</p></div></div>`;
    $('#credits').innerHTML = `<div><dt>공간</dt><dd>${esc(c.space)}</dd></div><div><dt>위치 <span class="small">(구 단위까지만 공개)</span></dt><dd>${esc(A.regionLabel(c.region))}</dd></div><div><dt>사용 자재</dt><dd>${mats.map(m => `<a href="product.html?id=${m.p.id}">${esc(m.p.name)}</a>`).join(', ')}</dd></div><div><dt>사진</dt><dd>${{ own: '자체 촬영', partner: '시공 파트너 제공 (이용 허락 확인)', owner: '건축주 제공 (게시 동의)' }[c.photos[0].source] || '—'}</dd></div>`;
    $('#overview').innerHTML = `<div class="lab">Overview</div><div><p class="xl">${esc(c.body)}</p><div class="mat-chips mt4">${mats.map(m => `<a class="mat-chip ${m.p.status === 'discontinued' ? 'is-disc' : ''}" href="product.html?id=${m.p.id}"><span class="swatch" style="background-image:url(${thumb(m.p.images[0].src)})"></span>${esc(m.p.name)}<small>${m.x.area ? `${fmt.num(m.x.area, 1)}㎡` : ''}${m.x.pattern ? ` · ${C.PATTERNS[m.x.pattern].label}` : ''}${m.p.status === 'discontinued' ? ' · 단종 → 대체 ' + esc((A.byId('products', m.p.replacementId) || {}).name || '') : ''}</small></a>`).join('')}</div>${main && main.p.estimable ? `<div class="mt4" style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn--clay btn--arrow" href="estimate.html?p=${main.p.id}&v=${main.x.variantId || ''}&pattern=${main.x.pattern || 'straight'}&loc=${c.space.includes('외벽') ? 'exterior' : c.space.includes('욕실') ? 'bath' : 'interior'}">이 사례 자재로 견적 내기</a><button class="btn btn--sand" data-sample="${main.p.id}">${A.cart().includes(main.p.id) ? '샘플 담김 ✓' : '이 자재 샘플 담기'}</button></div>` : ''}</div>`;
    // 콜라주 — 사례 사진 + 사용 자재 질감
    const figs = [`<figure class="full clip" data-reveal="fade"><img src="${c.photos[0].src}" alt="${esc(c.photos[0].alt)}">${main ? `<button class="hotspot" style="left:62%;top:38%" aria-label="사용 자재 보기">+<span class="hotspot__tip"><b>${esc(main.p.name)}</b><small>${main.p.variants[0] ? variantLabel(main.p.variants[0]) : ''}</small></span></button>` : ''}</figure>`].concat(mats.slice(0, 2).map(m => `<figure class="half clip" data-reveal="fade"><img src="${m.p.images[0].src}" alt="${esc(m.p.name)} 질감" loading="lazy"></figure>`));
    if (figs.length === 2) figs.push(`<figure class="half clip" data-reveal="fade"><img src="${(main && main.p.images[1] ? main.p.images[1].src : c.photos[0].src)}" alt="" loading="lazy"></figure>`);
    $('#collage').innerHTML = figs.join('');
    $('.hotspot') && $('.hotspot').addEventListener('click', () => location.href = `product.html?id=${main.p.id}`);
    const rel = A.relatedCases(c.id); const rw = $('#related');
    rw.innerHTML = rel.length ? rel.slice(0, 3).map(r => caseCard(r)).join('') : `<div class="empty" style="grid-column:1/-1"><b>같은 자재를 쓴 다른 사례가 아직 없습니다</b>사례가 등록되면 자동으로 연결됩니다.</div>`;
    const tint = { '주거': 'var(--f-res)', '상업': 'var(--f-com)', '공공': 'var(--f-pub)', '교육': 'var(--f-pub)' }[c.space.split(' ')[0]];
    if (tint) document.body.style.setProperty('--case-tint', tint);
    UI.init(); bindSample();
  }

  // ── 기타자재 ──────────────────────────────────────────────
  function others() {
    const g = $('#others-grid'); if (g) { g.innerHTML = A.publicProducts('other').map(productCard).join(''); UI.init(g); bindSample(g); }
    const f = $('#fields');
    if (f) {
      const fields = [['외벽 · 파사드', '보강 메쉬 + 유연 접착제 + 외부용 성적서 제품', 'assets/img/case-house-exterior.webp', 'var(--f-ext)', ['o-mesh', 'o-adh', 'l2613']], ['상업 공간', '카운터·로비 포인트월. 브릭·록페이스 + 코너 트림', 'assets/img/case-cafe-brick.webp', 'var(--f-com)', ['b2406', 'r0858', 'o-trim']], ['주거 · 리모델링', '기존 벽지·타일 위 덧방. 프라이머 선처리', 'assets/img/case-livingroom.webp', 'var(--f-res)', ['s1260', 'o-primer', 'o-adh'], true], ['공공 · 교육', '준불연 이상 + 품질관리서. 곡면 벽은 우드 질감', 'assets/img/case-library.webp', 'var(--f-pub)', ['w1260', 'l2613', 'o-mesh'], true], ['욕실 · 습식', '줄눈 0mm 콘크리트 질감 + 방수 프라이머', 'assets/img/case-bathroom.webp', 'var(--f-int)', ['c1260', 'o-primer']]];
      f.innerHTML = fields.map((x, i) => `<a class="fieldcard ${x[5] ? 'is-ink' : ''}" style="--c:${x[3]}" href="products.html?line=${x[4].some(id => (A.byId('products', id) || {}).line === 'other') ? 'other' : 'stone'}" data-reveal="fade"><img src="${thumb(x[2])}" alt="" loading="lazy"><span class="n">0${i + 1}</span><h3>${x[0]}</h3><p>${x[1]}</p><p style="margin-top:10px;font-size:12px;opacity:.85">${x[4].map(id => (A.byId('products', id) || {}).name).filter(Boolean).join(' · ')}</p></a>`).join('');
      UI.init(f);
    }
  }

  // ── 셀프견적 ──────────────────────────────────────────────
  function estimate() {
    const ps = A.publicProducts('stone').filter(p => p.estimable && p.status === 'active');
    const S = A.get('settings');
    const st = { pid: qs('p') && ps.some(p => p.id === qs('p')) ? qs('p') : ps[0].id, vid: qs('v') || null, loc: qs('loc') || 'interior', pat: qs('pattern') || 'straight', walls: [{ w: +qs('w') || 4.2, h: +qs('h') || 2.4 }], openings: [], bld: { floors: 2, height: 6, useSpecial: false, overlay: false }, lossOverride: null };
    const P = () => A.byId('products', st.pid);
    const V = () => { const p = P(); return p.variants.find(v => v.id === st.vid) || p.variants[0]; };
    const el = {
      prods: $('#st-prods'), vars: $('#st-vars'), loc: $('#st-loc'), fire: $('#st-fire'), walls: $('#st-walls'), opens: $('#st-opens'), pats: $('#st-pats'), out: $('#result'), viz: $('#wallviz')
    };
    const presets = {
      living: { pid: 's1260', vid: 'z', loc: 'interior', pat: 'straight', walls: [{ w: 4.2, h: 2.4 }], openings: [] },
      facade: { pid: 'l2613', vid: 'a', loc: 'exterior', pat: 'straight', walls: [{ w: 8, h: 6 }], openings: [{ w: 1.2, h: 1.5, qty: 3, label: '창' }, { w: 0.9, h: 2.1, qty: 1, label: '현관문' }], bld: { floors: 2, height: 6.4, useSpecial: false, overlay: true } },
      brick: { pid: 'b2406', vid: 'a', loc: 'interior', pat: 'straight', walls: [{ w: 5, h: 2 }], openings: [] },
      column: { pid: 'r0858', vid: 'a', loc: 'interior', pat: 'curve', walls: [{ w: 3.77, h: 3.2 }, { w: 3.77, h: 3.2 }], openings: [] }
    };
    const pre = qs('preset'); if (pre && presets[pre]) Object.assign(st, JSON.parse(JSON.stringify(presets[pre])));
    $$('[data-preset]').forEach(b => b.addEventListener('click', () => { Object.assign(st, JSON.parse(JSON.stringify(presets[b.dataset.preset]))); st.lossOverride = null; drawAll(); UI.toast('예시 값을 채웠습니다 — 바로 결과가 계산됩니다', 'ok'); $('#est').scrollIntoView({ behavior: UI.reduce ? 'auto' : 'smooth', block: 'start' }); }));

    function drawProds() {
      el.prods.innerHTML = ps.map(p => `<button class="tile" aria-pressed="${p.id === st.pid}" data-id="${p.id}"><span class="swatch" style="background-image:url(${thumb(p.images[0].src)})"></span><b>${esc(p.name)}</b><small>${p.variants.map(v => v.h).join('·')}mm · ${A.certState(p).state === 'ok' ? A.certState(p).label : '성적서 확인 중'}</small></button>`).join('');
      $$('.tile', el.prods).forEach(b => b.addEventListener('click', () => { st.pid = b.dataset.id; st.vid = null; drawAll(); }));
    }
    function drawVars() {
      const p = P(); const maxH = Math.max(...st.walls.map(w => w.h || 0));
      // 벽 높이에 맞는 길이 추천: 벽 높이(mm) 이상인 가장 짧은 길이 — 없으면 가장 긴 것
      const fits = p.variants.filter(v => v.h >= maxH * 1000); const rec = fits.length ? fits.reduce((a, b) => a.h < b.h ? a : b) : null;
      if (!st.vid) st.vid = (rec || p.variants[0]).id;
      el.vars.innerHTML = p.variants.length > 1 ? `<div class="opt-row">${p.variants.map(v => `<button class="tile" aria-pressed="${v.id === st.vid}" data-id="${v.id}"><b>${v.w}×${v.h}</b><small>${v.t}mm · ${v.perBox}장/박스${rec && rec.id === v.id ? ' · <strong>벽 높이에 맞음</strong>' : ''}</small></button>`).join('')}</div>` : `<p class="small">판형 ${variantLabel(p.variants[0])} · ${p.variants[0].perBox}장/박스 (단일 판형)</p>`;
      $$('.tile', el.vars).forEach(b => b.addEventListener('click', () => { st.vid = b.dataset.id; drawVars(); compute(); }));
    }
    function drawLoc() {
      el.loc.innerHTML = Object.keys(C.LOCATIONS).map(k => `<button aria-pressed="${st.loc === k}" data-k="${k}">${C.LOCATIONS[k].label}</button>`).join('');
      $$('button', el.loc).forEach(b => b.addEventListener('click', () => { st.loc = b.dataset.k; drawLoc(); compute(); }));
      el.fire.hidden = st.loc !== 'exterior';
      if (st.loc === 'exterior') {
        el.fire.innerHTML = `<p class="small"><b>외벽은 건물에 따라 방화 성능 확인 대상입니다.</b> 3층 이상 · 높이 9m 이상 · 의료/교육/노유자/수련시설이면 외부용 국내 시험성적서가 필요하고, 기존 외벽 위 덧붙임은 대수선·실물모형시험 검토 대상입니다.</p><div class="frow frow--3"><div class="field"><label>건물 층수</label><div class="in-wrap"><input type="number" min="1" max="60" id="f-floors" value="${st.bld.floors}"><span class="unit">층</span></div></div><div class="field"><label>건물 높이</label><div class="in-wrap"><input type="number" min="1" max="300" step="0.1" id="f-height" value="${st.bld.height}"><span class="unit">m</span></div></div><div class="field"><label>용도</label><select class="in" id="f-use"><option value="0" ${!st.bld.useSpecial ? 'selected' : ''}>주거·상업·업무 등</option><option value="1" ${st.bld.useSpecial ? 'selected' : ''}>의료·교육연구·노유자·수련시설</option></select></div></div><label class="check"><input type="checkbox" id="f-overlay" ${st.bld.overlay ? 'checked' : ''}><span>기존 외벽 마감재 위에 덧붙이는 시공입니다 (대수선·실물모형시험 검토)</span></label>`;
        $('#f-floors').addEventListener('input', e => { st.bld.floors = +e.target.value; compute(); });
        $('#f-height').addEventListener('input', e => { st.bld.height = +e.target.value; compute(); });
        $('#f-use').addEventListener('change', e => { st.bld.useSpecial = e.target.value === '1'; compute(); });
        $('#f-overlay').addEventListener('change', e => { st.bld.overlay = e.target.checked; compute(); });
      }
    }
    function drawWalls() {
      el.walls.innerHTML = st.walls.map((w, i) => `<div class="wall"><span class="lab">${i + 1}</span><div class="in-wrap"><input type="number" step="0.1" min="0.1" max="50" value="${w.w}" data-i="${i}" data-k="w" aria-label="벽 ${i + 1} 가로"><span class="unit">m</span></div><span class="x">×</span><div class="in-wrap"><input type="number" step="0.1" min="0.1" max="50" value="${w.h}" data-i="${i}" data-k="h" aria-label="벽 ${i + 1} 세로"><span class="unit">m</span></div><button class="rm" data-rm="${i}" aria-label="벽 ${i + 1} 삭제" ${st.walls.length === 1 ? 'disabled style="opacity:.3"' : ''}>×</button></div>`).join('') + `<button class="add-row" id="add-wall">벽 면 추가</button>`;
      $$('input', el.walls).forEach(inp => inp.addEventListener('input', () => { st.walls[+inp.dataset.i][inp.dataset.k] = +inp.value; st.vid = null; drawVars(); compute(); }));
      $$('[data-rm]', el.walls).forEach(b => b.addEventListener('click', () => { st.walls.splice(+b.dataset.rm, 1); drawWalls(); compute(); }));
      $('#add-wall').addEventListener('click', () => { st.walls.push({ w: 3, h: 2.4 }); drawWalls(); compute(); });
    }
    function drawOpens() {
      el.opens.innerHTML = st.openings.map((o, i) => `<div class="wall"><span class="lab">${esc(o.label || '개구부')}</span><div class="in-wrap"><input type="number" step="0.1" min="0.1" value="${o.w}" data-i="${i}" data-k="w" aria-label="개구부 가로"><span class="unit">m</span></div><span class="x">×</span><div class="in-wrap"><input type="number" step="0.1" min="0.1" value="${o.h}" data-i="${i}" data-k="h" aria-label="개구부 세로"><span class="unit">m</span></div><div style="display:flex;gap:4px;align-items:center"><div class="in-wrap" style="width:92px"><input type="number" min="1" max="50" value="${o.qty || 1}" data-i="${i}" data-k="qty" aria-label="수량"><span class="unit">개</span></div><button class="rm" data-rm="${i}" aria-label="삭제">×</button></div></div>`).join('') + `<div class="presets"><button class="chip" data-add="창|1.2|1.5">+ 창 1.2×1.5</button><button class="chip" data-add="문|0.9|2.1">+ 문 0.9×2.1</button><button class="chip" data-add="개구부|1|1">+ 직접 입력</button></div>`;
      $$('input', el.opens).forEach(inp => inp.addEventListener('input', () => { st.openings[+inp.dataset.i][inp.dataset.k] = +inp.value; compute(); }));
      $$('[data-rm]', el.opens).forEach(b => b.addEventListener('click', () => { st.openings.splice(+b.dataset.rm, 1); drawOpens(); compute(); }));
      $$('[data-add]', el.opens).forEach(b => b.addEventListener('click', () => { const [label, w, h] = b.dataset.add.split('|'); st.openings.push({ label, w: +w, h: +h, qty: 1 }); drawOpens(); compute(); }));
    }
    function drawPats() {
      const p = P(); const loss = (p.rule && p.rule.loss) || S.lossDefaults;
      el.pats.innerHTML = Object.keys(C.PATTERNS).map(k => `<button class="tile" aria-pressed="${st.pat === k}" data-k="${k}"><b>${C.PATTERNS[k].label}</b><small>${C.PATTERNS[k].hint} · 로스 ${loss[k] != null ? loss[k] : S.lossDefaults[k]}%</small></button>`).join('');
      $$('.tile', el.pats).forEach(b => b.addEventListener('click', () => { st.pat = b.dataset.k; st.lossOverride = null; drawPats(); compute(); }));
    }
    function compute() {
      const p = P(); const v = V();
      const r = C.estimate(p, { variantId: v.id, location: st.loc, pattern: st.pat, walls: st.walls, openings: st.openings, building: st.loc === 'exterior' ? st.bld : null, lossOverride: st.lossOverride, openingMin: S.openingMin });
      $$('.step').forEach((s, i) => s.classList.toggle('is-done', r.ok || i < 2));
      if (!r.ok) { el.out.innerHTML = `<span class="eyebrow">Result</span><div class="result__empty"><b>입력을 확인해 주세요</b>${r.errors.map(esc).join('<br>')}</div>`; return; }
      const certS = A.certState(p);
      el.out.innerHTML = `<span class="eyebrow">예상 소요 수량</span>
        <div class="result__big"><b class="num">${r.boxes}</b><span>박스</span><span class="num" style="opacity:.6">= ${r.sheets}장</span></div>
        <p class="result__sub">${esc(p.name)} · ${variantLabel(r.variant)} · ${r.perBox}장/박스 · 남는 장수 ${r.leftover}장</p>
        <div class="result__rows">
          <div><span>순 시공 면적</span><b class="num">${fmt.num(r.area.net, 2)} ㎡</b></div>
          <div><span>개구부 공제</span><b class="num">− ${fmt.num(r.area.opening, 2)} ㎡</b></div>
          <div><span>로스 포함 (${r.patternLabel} ${r.lossPct}%)</span><b class="num">${fmt.num(r.area.withLoss, 2)} ㎡</b></div>
          <div><span>줄눈 (${r.locationLabel})</span><b class="num">${r.joint} mm</b></div>
          <div><span>주문 면적</span><b class="num">${fmt.num(r.area.order, 2)} ㎡</b></div>
          ${r.adhesive ? `<div><span>전용 접착제</span><b class="num">${r.adhesive.kgMin}~${r.adhesive.kgMax} kg${r.adhesive.bag ? ` (${r.adhesive.bagsMin}~${r.adhesive.bagsMax}포)` : ''}</b></div>` : ''}
          ${p.showPrice && p.priceRef ? `<div><span>자재비 참고가</span><b class="num">${fmt.won(r.boxes * p.priceRef)}</b></div>` : ''}
          ${r.layout ? `<div><span>판 배치 기준 참고</span><b class="num">${r.layout.sheets}장 <small style="font-weight:400;opacity:.7">(${r.layout.note})</small></b></div>` : ''}
        </div>
        <div class="result__slider mt3"><label class="small" style="color:inherit;opacity:.8;display:flex;justify-content:space-between"><span>로스율 조정 (현장 상황)</span><b>${r.lossPct}%</b></label><input type="range" min="0" max="30" step="1" value="${r.lossPct}" id="loss-slide" style="width:100%;accent-color:var(--gold);margin-top:6px"></div>
        ${r.fire.required ? `<div class="result__warn result__warn--fire"><b>외벽 마감재 방화 성능 확인 대상</b> — ${r.fire.reasons.join(' · ')}. ${certS.exterior ? '이 제품은 외부용 국내 성적서가 등록되어 있습니다.' : '이 제품은 외부용 국내 성적서 확인이 필요합니다.'} 견적 의뢰에 <b>「방화 검토 필요」</b>가 자동으로 표시됩니다.</div>` : ''}
        ${r.warnings.map(w => `<div class="result__warn">${esc(w)}</div>`).join('')}
        <details><summary>계산 근거 펼쳐보기</summary><div class="basis"><span>총 면적 ${fmt.num(r.area.gross, 2)}㎡ − 개구부 ${fmt.num(r.area.opening, 2)}㎡ = 순 면적 ${fmt.num(r.area.net, 2)}㎡</span><span>모듈 면적 = (${r.variant.w}+${r.joint}) × (${r.variant.h}+${r.joint}) / 10⁶ = ${fmt.num(r.module, 4)}㎡</span><span>필요 장수 = ⌈${fmt.num(r.area.net, 2)} × ${1 + r.lossPct / 100} ÷ ${fmt.num(r.module, 4)}⌉ = ${r.sheets}장 (로스 없이 ${r.sheetsNoLoss}장)</span><span>박스 = ⌈${r.sheets} ÷ ${r.perBox}⌉ = ${r.boxes}박스 · 남는 ${r.leftover}장</span><span>로스율·줄눈·박스 구성은 관리자가 제품마다 입력한 값(갱신 ${esc(p.updatedAt)})</span></div></details>
        <div class="wallviz" id="wallviz"><canvas id="viz"></canvas><small>벽 1 기준 판 배치 그림 — 줄눈 포함 모듈 ${fmt.num(r.module, 3)}㎡ · 개구부는 음영</small></div>
        <div class="result__acts"><button class="btn btn--clay btn--arrow btn--wide" id="go-quote">이 내역으로 견적 의뢰</button><button class="btn btn--sand btn--wide" data-sample="${p.id}">${A.cart().includes(p.id) ? '샘플 담김 ✓' : '샘플 먼저 받아 보기'}</button></div>
        <p class="small mt2" style="color:inherit;opacity:.65">예상 수량은 입력하신 치수 기준 참고값입니다. 바탕면 상태와 재단 방식에 따라 달라질 수 있으며, 최종 수량은 담당자 확인 후 확정됩니다.</p>`;
      $('#loss-slide').addEventListener('input', e => { st.lossOverride = +e.target.value; compute(); });
      $('#go-quote').addEventListener('click', () => { try { sessionStorage.setItem(EST_KEY, JSON.stringify(r)); } catch (e) {} location.href = 'quote.html'; });
      bindSample(el.out);
      drawViz(r);
    }
    function drawViz(r) {
      const cv = $('#viz'); if (!cv) return; const wall = st.walls[0]; if (!wall) return;
      const dpr = Math.min(2, devicePixelRatio || 1); const W = cv.parentElement.clientWidth - 28; const scale = W / wall.w; const H = Math.min(260, wall.h * scale);
      cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px'; const c = cv.getContext('2d'); c.scale(dpr, dpr);
      const sc = Math.min(W / wall.w, H / wall.h); const ox = (W - wall.w * sc) / 2, oy = (H - wall.h * sc) / 2;
      c.fillStyle = 'rgba(243,239,235,.08)'; c.fillRect(ox, oy, wall.w * sc, wall.h * sc);
      const mw = (r.variant.w + r.joint) / 1000 * sc, mh = (r.variant.h + r.joint) / 1000 * sc;
      const cols = Math.ceil(wall.w * sc / mw), rows = Math.ceil(wall.h * sc / mh);
      let n = 0; const total = cols * rows; const t0 = performance.now();
      const stagger = UI.reduce ? 0 : 20;
      const draw = (t) => {
        c.clearRect(0, 0, W, H); c.fillStyle = 'rgba(243,239,235,.08)'; c.fillRect(ox, oy, wall.w * sc, wall.h * sc);
        c.save(); c.beginPath(); c.rect(ox, oy, wall.w * sc, wall.h * sc); c.clip();
        let k = 0; const shown = stagger ? Math.min(total, Math.floor((t - t0) / stagger) + 1) : total;
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { if (k++ >= shown) continue; const off = st.pat === 'offset' && y % 2 ? -mw / 2 : 0; c.fillStyle = `rgba(177,167,129,${0.55 + ((x + y) % 3) * 0.12})`; c.fillRect(ox + x * mw + off + 1, oy + y * mh + 1, Math.max(1, mw - 2), Math.max(1, mh - 2)); }
        c.restore();
        // 개구부 음영 (벽 1 안에 좌측부터 나열)
        let cx = ox + 0.4 * sc; st.openings.forEach(o => { for (let q = 0; q < (o.qty || 1); q++) { const w = o.w * sc, h = o.h * sc; if (cx + w > ox + wall.w * sc) return; c.fillStyle = 'rgba(25,23,14,.85)'; c.fillRect(cx, oy + wall.h * sc - h - (o.label === '창' ? 0.9 * sc : 0), w, h); cx += w + 0.4 * sc; } });
        if (shown < total) requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    }
    function drawAll() { drawProds(); drawVars(); drawLoc(); drawWalls(); drawOpens(); drawPats(); compute(); }
    drawAll();
    addEventListener('argilo:change', () => { drawVars(); drawPats(); compute(); });
    addEventListener('resize', () => compute());
  }

  // ── 폼 공통 ───────────────────────────────────────────────
  function validate(form) {
    let ok = true;
    $$('.field', form).forEach(f => {
      const inp = $('input,select,textarea', f); if (!inp || !inp.required) return;
      let bad = !inp.value.trim(); if (inp.type === 'tel' && inp.value && !/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(inp.value.replace(/\s/g, ''))) bad = true;
      if (inp.type === 'checkbox' && !inp.checked) bad = true;
      f.classList.toggle('is-err', bad); if (bad) ok = false;
    });
    if (!ok) { const first = $('.field.is-err', form); first && first.scrollIntoView({ behavior: 'smooth', block: 'center' }); UI.toast('필수 항목을 확인해 주세요', 'bad'); }
    return ok;
  }
  const privacyNote = (purpose, items, keep) => { const S = A.get('settings'); const proc = S.processors.filter(p => p.task.includes('배송') || p.task.includes('알림')).map(p => p.name).join(', '); return `<div class="legal"><b>개인정보 수집·이용 안내</b> · 목적: ${purpose} · 항목: ${items} · 보유기간: <b>처리 완료 후 ${Math.round(keep / 30)}개월</b>(경과 시 파기) · 위탁: ${proc} · 수집 근거: 요청하신 ${purpose} 이행(개인정보보호법 제15조①4호) · 동의를 거부할 수 있으나 거부 시 ${purpose}이 어렵습니다. <a href="privacy.html" style="text-decoration:underline">처리방침 전문</a></div>`; };
  const marketingBox = () => `<div class="field"><span class="lab">마케팅 정보 수신 <span class="small">(선택 · 거부해도 신청 가능)</span></span><div style="display:flex;gap:18px;flex-wrap:wrap"><label class="check"><input type="checkbox" name="mk_sms"><span>문자 — 신제품·샘플 소식</span></label><label class="check"><input type="checkbox" name="mk_email"><span>이메일 — 시공 가이드·성적서 갱신</span></label></div><p class="help">광고성 정보는 사전 동의한 채널로만 보내며, 견적 회신 같은 거래 안내 메시지에는 광고를 섞지 않습니다.</p></div>`;
  const kindSeg = (kind) => `<div class="seg" id="kind"><button type="button" aria-pressed="${kind === 'person'}" data-k="person">개인 · 건축주</button><button type="button" aria-pressed="${kind === 'biz'}" data-k="biz">시공 · 설계 사업자</button></div>`;

  // ── 견적 의뢰 ─────────────────────────────────────────────
  function quote() {
    let r = null; try { r = JSON.parse(sessionStorage.getItem(EST_KEY) || 'null'); } catch (e) {}
    const sum = $('#q-summary');
    if (!r) sum.innerHTML = `<h3>계산 내역</h3><div class="empty"><b>아직 셀프견적 내역이 없습니다</b>셀프견적에서 자재와 치수를 넣고 「이 내역으로 견적 의뢰」를 누르면 내역이 자동으로 첨부됩니다.<div class="mt3"><a class="btn btn--ink btn--sm" href="estimate.html?preset=living">예시로 계산해 보기</a></div></div>`;
    else sum.innerHTML = `<h3>첨부되는 계산 내역 <a class="small" href="estimate.html" style="text-decoration:underline">수정</a></h3>
      <div class="row"><span>자재</span><b>${esc(r.product.name)} · ${variantLabel(r.variant)}</b></div><div class="row"><span>시공 위치 · 패턴</span><b>${esc(r.locationLabel)} · ${esc(r.patternLabel)}</b></div><div class="row"><span>순 면적</span><b class="num">${fmt.num(r.area.net, 2)}㎡ (개구부 −${fmt.num(r.area.opening, 2)})</b></div><div class="row"><span>로스율 · 줄눈</span><b class="num">${r.lossPct}% · ${r.joint}mm</b></div><div class="row"><span>예상 수량</span><b class="num">${r.sheets}장 = ${r.boxes}박스 (남는 ${r.leftover}장)</b></div>${r.adhesive ? `<div class="row"><span>접착제</span><b class="num">${r.adhesive.kgMin}~${r.adhesive.kgMax}kg</b></div>` : ''}${r.fire && r.fire.required ? `<div class="notice notice--warn mt2"><b>방화 검토 필요</b> — ${r.fire.reasons.join(' · ')}. 담당자가 외부용 성적서·대수선 여부를 함께 안내합니다.</div>` : ''}<p class="small mt2">계산에 쓴 제품 데이터(갱신 ${esc(r.product.updatedAt)})가 스냅샷으로 함께 저장되어, 나중에 제품 데이터가 바뀌어도 이 견적을 그대로 재현할 수 있습니다.</p>`;
    const f = $('#q-form'); let kind = 'person'; const t0 = Date.now();
    f.innerHTML = `<div class="form-sec"><h3>신청자 <small>유형에 따라 필요한 항목만 받습니다</small></h3>${kindSeg(kind)}<div class="frow"><div class="field"><label>이름<span class="req">*</span></label><input class="in" name="name" required placeholder="홍길동" value="김아르"></div><div class="field"><label>연락처<span class="req">*</span></label><input class="in" type="tel" name="phone" required placeholder="010-0000-0000" value="010-2345-6789"><p class="err">연락처 형식을 확인해 주세요</p></div></div><div class="frow"><div class="field"><label>이메일 <span class="small">(선택 · 견적서 회신용)</span></label><input class="in" type="email" name="email" placeholder="name@example.com"></div><div class="field" id="f-company" hidden><label>회사명</label><input class="in" name="company" placeholder="○○인테리어"></div></div></div>
      <div class="form-sec"><h3>현장 <small>알고 계신 것만</small></h3><div class="frow"><div class="field"><label>시공 예정 시기</label><select class="in" name="when"><option>1개월 이내</option><option selected>1~3개월</option><option>3개월 이후 · 검토 단계</option></select></div><div class="field"><label>현장 지역</label><input class="in" name="region" placeholder="경기 안양시" value="경기 안양시 동안구"></div></div><div class="field"><label>요청 사항</label><textarea class="in" name="message" placeholder="바탕면 상태, 희망 납기, 시공 포함 여부 등">기존 벽지 위 시공 가능한지와 시공 포함 견적을 함께 받고 싶습니다.</textarea></div></div>
      <div class="form-sec"><h3>동의</h3>${privacyNote('견적 의뢰 회신', '이름·연락처·(선택) 이메일·회사명·현장 정보·계산 내역', A.get('settings').retentionDays)}<div class="field"><label class="check"><input type="checkbox" name="agree" required><span>위 안내를 확인했습니다<span class="req">*</span></span></label><p class="err">동의가 필요합니다</p></div>${marketingBox()}<div class="legal"><b>무엇이 전달되나요</b> — 담당자에게는 위 계산 내역과 연락처가 전달됩니다. 알림 메일에는 이름 일부와 건수만 실리고 상세 내용은 로그인한 관리자 화면에서만 열람됩니다.</div><input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button class="btn btn--clay btn--arrow btn--wide" type="submit" ${r ? '' : 'disabled'}>견적 의뢰 접수</button><p class="small center">영업일 기준 4시간 안에 담당자가 연락드립니다</p></div>`;
    $$('#kind button').forEach(b => b.addEventListener('click', () => { kind = b.dataset.k; $$('#kind button').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#f-company').hidden = kind !== 'biz'; }));
    f.addEventListener('submit', e => {
      e.preventDefault(); if (!validate(f)) return;
      const d = Object.fromEntries(new FormData(f).entries()); const btn = $('button[type=submit]', f); btn.innerHTML = '<span class="spin"></span> 접수 중'; btn.disabled = true;
      setTimeout(() => {
        const it = A.submit('quote', { name: d.name, phone: d.phone, email: d.email, kind, company: d.company, message: `${d.when} · ${d.region} · ${d.message}`, snapshot: r, snapshotNote: `${r.product.name} · ${r.locationLabel} ${fmt.num(r.area.net, 2)}㎡ → ${r.sheets}장 · ${r.boxes}박스${r.fire.required ? ' · 방화 검토' : ''}`, marketing: { sms: !!d.mk_sms, email: !!d.mk_email }, honeypot: d.website, elapsedMs: Date.now() - t0 });
        try { sessionStorage.removeItem(EST_KEY); } catch (x) {}
        location.href = `done.html?type=quote&no=${encodeURIComponent(it.no)}`;
      }, 600);
    });
  }

  // ── 샘플 신청 ─────────────────────────────────────────────
  function sample() {
    const S = A.get('settings'); let kind = 'person'; const t0 = Date.now();
    const list = $('#s-list'), pick = $('#s-pick'), f = $('#s-form');
    const drawList = () => {
      const ids = A.cart(); const lim = S.sampleLimit[kind];
      list.innerHTML = `<h3>담은 샘플 <span class="small">${ids.length} / ${lim}개</span></h3><div class="limit-bar"><i style="width:${Math.min(100, ids.length / lim * 100)}%"></i></div><p class="small mb2">${kind === 'person' ? '개인은 1회 5개까지 무료' : '시공·설계 사업자는 10개까지 무료'} · 조각 샘플 약 100×100mm · 배송비 무료</p>` + (ids.length ? `<div class="cart-list">${ids.map(id => { const p = A.byId('products', id); return p ? `<div class="cart-item"><img src="${thumb(p.images[0].src)}" alt=""><div><b>${esc(p.name)}</b><small>${esc(p.code)} · ${p.variants[0] ? variantLabel(p.variants[0]) : p.unitLabel || ''}</small></div><button data-rm="${id}" aria-label="제외">×</button></div>` : ''; }).join('')}</div>` : `<div class="empty"><b>아직 담은 샘플이 없습니다</b>아래 목록에서 질감을 골라 담아 주세요.</div>`) + (ids.length > lim ? `<div class="notice notice--warn mt2">한도를 ${ids.length - lim}개 초과했습니다. ${kind === 'person' ? '사업자로 전환하거나 ' : ''}몇 개를 빼 주세요.</div>` : '');
      $$('[data-rm]', list).forEach(b => b.addEventListener('click', () => { A.cartRemove(b.dataset.rm); drawList(); drawPick(); }));
      $('button[type=submit]', f).disabled = !ids.length || ids.length > lim;
    };
    const drawPick = () => { const ids = A.cart(); pick.innerHTML = A.publicProducts('stone').filter(p => p.status === 'active').map(p => `<button type="button" class="pick" aria-pressed="${ids.includes(p.id)}" data-id="${p.id}"><img src="${thumb(p.images[0].src)}" alt=""><span><b>${esc(p.name)}</b><small>${esc(p.texture)} · ${esc(p.color)}</small></span></button>`).join(''); $$('.pick', pick).forEach(b => b.addEventListener('click', () => { const id = b.dataset.id; if (A.cart().includes(id)) A.cartRemove(id); else { const r = A.cartAdd(id); if (!r.ok) { UI.toast(`최대 ${r.limit}개까지 담을 수 있습니다`, 'bad'); return; } } drawList(); drawPick(); })); };
    f.innerHTML = `<div class="form-sec"><h3>신청자 유형</h3>${kindSeg(kind)}<p class="help small">사업자는 한도가 10개로 늘고 회사명을 받습니다.</p></div>
      <div class="form-sec"><h3>받는 분</h3><div class="frow"><div class="field"><label>이름<span class="req">*</span></label><input class="in" name="name" required value="박아르"></div><div class="field"><label>연락처<span class="req">*</span></label><input class="in" type="tel" name="phone" required value="010-7777-7733"><p class="err">연락처 형식을 확인해 주세요</p><p class="help">배송 문의 시에만 사용합니다</p></div></div><div class="field" id="f-company" hidden><label>회사명 · 직무</label><input class="in" name="company" placeholder="○○건축사사무소 · 설계"></div></div>
      <div class="form-sec"><h3>배송지 <small>택배사에 배송 필드만 전달됩니다</small></h3><div class="frow"><div class="field"><label>우편번호<span class="req">*</span></label><div class="in-wrap"><input name="zip" required value="14057" placeholder="검색"><button type="button" class="unit" id="zip-search" style="cursor:pointer;color:var(--ink);font-weight:600;border:0">주소 검색</button></div></div></div><div class="field"><label>도로명 주소<span class="req">*</span></label><input class="in" name="addr1" required value="경기 안양시 동안구 시민대로 000"></div><div class="field"><label>상세 주소</label><input class="in" name="addr2" placeholder="동·호수" value="아르길로빌딩 3층"></div><div class="field"><label>용도 · 메모 <span class="small">(선택)</span></label><input class="in" name="message" placeholder="거실 아트월 검토용"></div></div>
      <div class="form-sec"><h3>동의</h3>${privacyNote('샘플 배송', '이름·연락처·배송지·(사업자) 회사명', S.retentionDays)}<div class="field"><label class="check"><input type="checkbox" name="agree" required><span>위 안내를 확인했습니다<span class="req">*</span></span></label><p class="err">동의가 필요합니다</p></div>${marketingBox()}<input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button class="btn btn--clay btn--arrow btn--wide" type="submit">샘플 신청</button><p class="small center">영업일 2일 내 발송 · 송장번호는 문자로 안내</p></div>`;
    $$('#kind button').forEach(b => b.addEventListener('click', () => { kind = b.dataset.k; $$('#kind button').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#f-company').hidden = kind !== 'biz'; drawList(); }));
    $('#zip-search').addEventListener('click', () => UI.toast('실제 구축에서는 도로명주소 검색(우편번호 서비스)이 열립니다 — 데모는 예시 주소가 채워져 있습니다'));
    f.addEventListener('submit', e => {
      e.preventDefault(); if (!validate(f)) return;
      const d = Object.fromEntries(new FormData(f).entries()); const btn = $('button[type=submit]', f); btn.innerHTML = '<span class="spin"></span> 접수 중'; btn.disabled = true;
      setTimeout(() => {
        const it = A.submit('sample', { name: d.name, phone: d.phone, kind, company: d.company, items: A.cart(), address: `${d.addr1} ${d.addr2 || ''} (${d.zip})`, message: d.message, marketing: { sms: !!d.mk_sms, email: !!d.mk_email }, honeypot: d.website, elapsedMs: Date.now() - t0 });
        A.cartClear(); location.href = `done.html?type=sample&no=${encodeURIComponent(it.no)}`;
      }, 600);
    });
    drawList(); drawPick(); addEventListener('argilo:cart', () => { drawList(); });
  }

  // ── 고객센터 ──────────────────────────────────────────────
  function support() {
    const S = A.get('settings'); const t0 = Date.now();
    $$('[data-kakao]').forEach(a => a.href = `https://pf.kakao.com/${S.kakaoId}/chat`);
    const f = $('#c-form'); let kind = 'person'; const sites = new Set(['interior']); let size = '';
    f.innerHTML = `<div class="form-sec"><h3>어떤 상담인가요</h3><div class="tiles" id="c-sites">${[['interior', '실내 벽'], ['exterior', '외벽'], ['bath', '욕실'], ['curve', '기둥 · 곡면'], ['spec', '설계 스펙인'], ['dealer', '대리점 · 거래']].map(x => `<button type="button" class="tile" aria-pressed="${sites.has(x[0])}" data-k="${x[0]}"><b>${x[1]}</b></button>`).join('')}</div><p class="help small mt1">여러 개 선택할 수 있습니다</p><div class="field mt2"><span class="lab">대략적인 면적 <span class="small">(정확한 치수를 아시면 <a href="estimate.html" style="text-decoration:underline">셀프견적</a>이 더 정확합니다)</span></span><div class="presets">${[['', '모름'], ['s', '10㎡ 미만'], ['m', '10~50㎡'], ['l', '50~150㎡'], ['xl', '150㎡ 이상']].map(x => `<button type="button" class="chip" data-size="${x[0]}" aria-pressed="${size === x[0]}">${x[1]}</button>`).join('')}</div></div></div>
      <div class="form-sec"><h3>연락처</h3>${kindSeg(kind)}<div class="frow"><div class="field"><label>이름<span class="req">*</span></label><input class="in" name="name" required value="최아르"></div><div class="field"><label>연락처<span class="req">*</span></label><input class="in" type="tel" name="phone" required value="010-5500-5502"><p class="err">연락처 형식을 확인해 주세요</p></div></div><div class="field" id="f-company" hidden><label>회사명</label><input class="in" name="company" placeholder="○○건축사사무소"></div><div class="field"><label>문의 내용<span class="req">*</span></label><textarea class="in" name="message" required>2층 단독주택 외벽 덧방을 검토 중입니다. 외부용 성적서와 시공 가능 여부를 알고 싶습니다.</textarea><p class="err">문의 내용을 적어 주세요</p></div></div>
      <div class="form-sec"><h3>동의</h3>${privacyNote('상담 회신', '이름·연락처·(선택) 회사명·문의 내용', S.retentionDays)}<div class="field"><label class="check"><input type="checkbox" name="agree" required><span>위 안내를 확인했습니다<span class="req">*</span></span></label><p class="err">동의가 필요합니다</p></div>${marketingBox()}<input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button class="btn btn--clay btn--arrow btn--wide" type="submit">상담 신청</button><p class="small center">영업일 기준 4시간 안에 연락 · 업무시간 외에는 카카오톡 채널 자동응답이 접수 사실을 안내합니다</p></div>`;
    $$('#c-sites .tile').forEach(b => b.addEventListener('click', () => { const k = b.dataset.k; sites.has(k) ? sites.delete(k) : sites.add(k); b.setAttribute('aria-pressed', sites.has(k)); }));
    $$('[data-size]').forEach(b => b.addEventListener('click', () => { size = b.dataset.size; $$('[data-size]').forEach(x => x.setAttribute('aria-pressed', x === b)); }));
    $$('#kind button').forEach(b => b.addEventListener('click', () => { kind = b.dataset.k; $$('#kind button').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#f-company').hidden = kind !== 'biz'; }));
    f.addEventListener('submit', e => {
      e.preventDefault(); if (!validate(f)) return;
      const d = Object.fromEntries(new FormData(f).entries()); const btn = $('button[type=submit]', f); btn.innerHTML = '<span class="spin"></span> 접수 중'; btn.disabled = true;
      setTimeout(() => { const it = A.submit('consult', { name: d.name, phone: d.phone, kind, company: d.company, message: `[${Array.from(sites).map(s => A.USE[s] || s).join('·')}${size ? ' · ' + size : ''}] ${d.message}`, marketing: { sms: !!d.mk_sms, email: !!d.mk_email }, honeypot: d.website, elapsedMs: Date.now() - t0 }); location.href = `done.html?type=consult&no=${encodeURIComponent(it.no)}`; }, 600);
    });
    // FAQ
    const faqs = A.get('faqs'); const fq = $('#faq'); const search = $('#faq-q');
    const draw = (q) => { const list = faqs.filter(x => !q || (x.q + x.a).includes(q)); fq.innerHTML = list.length ? list.map(x => `<details><summary><span><span class="cat">${esc(x.cat)}</span>${esc(x.q)}</span><i>+</i></summary><div class="a">${esc(x.a)}</div></details>`).join('') : `<div class="empty"><b>검색 결과가 없습니다</b>아래 상담 신청으로 문의해 주세요.</div>`; setText('#faq-n', list.length); };
    draw(''); search && search.addEventListener('input', e => draw(e.target.value.trim()));
    if (location.hash === '#consult') setTimeout(() => $('#consult').scrollIntoView({ behavior: 'smooth' }), 300);
    UI.init();
  }

  // ── 자료실 ────────────────────────────────────────────────
  function resources() {
    const cats = [['cert', '인증/기술자료'], ['guide', '시공가이드'], ['news', 'News'], ['catalog', '카탈로그']];
    let cat = qs('cat') && cats.some(c => c[0] === qs('cat')) ? qs('cat') : 'cert'; const sel = new Set();
    const tabs = $('#res-tabs'), body = $('#res-body'), bar = $('#res-bar');
    const gateLabel = { open: '바로 다운로드', contact: '연락처 남기고 받기', request: '신청 후 발송' };
    const render = () => {
      tabs.innerHTML = cats.map(c => `<button role="tab" aria-selected="${cat === c[0]}" data-c="${c[0]}">${c[1]}<sup>${A.publicResources(c[0]).length}</sup></button>`).join('');
      $$('button', tabs).forEach(b => b.addEventListener('click', () => { cat = b.dataset.c; sel.clear(); history.replaceState(null, '', `?cat=${cat}`); render(); }));
      const list = A.publicResources(cat).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      if (cat === 'news') { bar.innerHTML = ''; body.innerHTML = `<div class="news-list">${list.map(n => `<a class="news-row" href="resource.html?id=${n.id}"><time>${esc(n.date)}</time><h3>${esc(n.title)}</h3><span class="arr">→</span></a>`).join('')}</div>`; return; }
      bar.innerHTML = `<p class="small">${cat === 'cert' ? '성적서는 유효기간이 표시되며 만료되면 목록에서 자동으로 내려갑니다. 로그인 없이 바로 내려받을 수 있습니다.' : cat === 'guide' ? '바탕면 준비 → 접착·줄눈 → 외벽 체크리스트 순서로 보세요.' : '인쇄용 고해상 카탈로그(38.6MB)는 대용량 저장소에서 제공되며 연락처를 남기시면 링크를 보내 드립니다.'}</p><button class="btn btn--ink btn--sm" id="bulk" disabled>선택 ${sel.size}건 일괄 다운로드</button>`;
      body.innerHTML = `<table class="res-table"><thead><tr><th class="cb"></th><th>자료</th><th>관련 제품</th><th>등록일</th><th>${cat === 'cert' ? '유효기간' : '용량'}</th><th>제공 방식</th><th></th></tr></thead><tbody>${list.map(r => { const ps = (r.productIds || []).map(id => (A.byId('products', id) || {}).name).filter(Boolean); const days = r.validUntil ? fmt.daysTo(r.validUntil) : null; return `<tr><td class="cb"><input type="checkbox" data-id="${r.id}" ${r.gate !== 'open' ? 'disabled title="바로 다운로드 자료만 선택할 수 있습니다"' : ''} ${sel.has(r.id) ? 'checked' : ''}></td><td><div style="display:flex;gap:14px;align-items:center"><span class="ext">${esc((r.ext || 'web').toUpperCase())}</span><div><div class="ttl"><a href="resource.html?id=${r.id}">${esc(r.title)}</a></div>${r.body ? `<div class="small">${esc(r.body.slice(0, 70))}${r.body.length > 70 ? '…' : ''}</div>` : ''}</div></div></td><td class="small">${ps.length ? ps.slice(0, 2).join(', ') + (ps.length > 2 ? ` 외 ${ps.length - 2}` : '') : '공통'}</td><td class="small num">${esc(r.date)}</td><td class="small num">${cat === 'cert' ? (r.validUntil ? `${esc(r.validUntil)}${days <= 30 ? ` <span class="exp">(D-${days})</span>` : ''}` : '—') : fmt.size(r.size)}</td><td class="small">${gateLabel[r.gate]}${r.size > 25 ? ' <span class="badge badge--pending">대용량 저장소</span>' : ''}</td><td class="right"><button class="btn btn--ghost btn--xs" data-dl="${r.id}">${r.gate === 'open' ? '다운로드 ↓' : r.gate === 'contact' ? '링크 받기' : '신청'}</button></td></tr>`; }).join('')}</tbody></table>${!list.length ? '<div class="empty mt3"><b>등록된 자료가 없습니다</b></div>' : ''}<div class="empty mt4" style="border-style:solid"><b>찾는 자료가 없나요?</b>시방서·CAD 상세·BIM 등 설계 자료는 상담으로 요청해 주세요. <a class="link" href="support.html#consult">상담신청</a></div>`;
      $$('input[type=checkbox]', body).forEach(c => c.addEventListener('change', () => { c.checked ? sel.add(c.dataset.id) : sel.delete(c.dataset.id); $('#bulk').disabled = !sel.size; $('#bulk').textContent = `선택 ${sel.size}건 일괄 다운로드`; }));
      $('#bulk').addEventListener('click', () => { let i = 0; sel.forEach(id => { const r = A.byId('resources', id); setTimeout(() => A.downloadResource(r), i++ * 350); }); UI.toast(`${sel.size}건을 내려받습니다`, 'ok'); });
      $$('[data-dl]', body).forEach(b => b.addEventListener('click', () => gate(A.byId('resources', b.dataset.dl))));
    };
    const gate = (r) => {
      if (r.gate === 'open') { A.downloadResource(r); UI.toast('내려받았습니다 (데모 파일)', 'ok'); return; }
      if (r.gate === 'request') { location.href = `support.html#consult`; return; }
      const dlg = $('#gate'); dlg.innerHTML = `<form method="dialog" class="form-grid" style="padding:28px;min-width:min(440px,90vw)"><h3 style="font-size:20px;font-weight:600">${esc(r.title)}</h3><p class="small">${fmt.size(r.size)} · 대용량 파일이라 다운로드 링크를 문자로 보내 드립니다.</p><div class="field"><label>이름<span class="req">*</span></label><input class="in" name="name" required value="정아르"></div><div class="field"><label>연락처<span class="req">*</span></label><input class="in" type="tel" name="phone" required value="010-2048-2048"></div>${privacyNote('자료 링크 발송', '이름·연락처', 90)}<label class="check"><input type="checkbox" name="agree" required><span>확인했습니다</span></label><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn--ghost btn--sm" value="cancel">취소</button><button class="btn btn--clay btn--sm" value="ok" id="gate-ok">링크 받기</button></div></form>`;
      dlg.showModal();
      $('#gate-ok').addEventListener('click', e => { const f = e.target.closest('form'); if (!f.reportValidity()) { e.preventDefault(); return; } const d = Object.fromEntries(new FormData(f).entries()); A.submit('consult', { name: d.name, phone: d.phone, message: `[자료 요청] ${r.title}`, kind: 'person' }); A.downloadResource(r); UI.toast('링크를 보냈습니다 (데모: 바로 내려받음)', 'ok'); }, { once: true });
    };
    render(); addEventListener('argilo:change', render);
  }
  function resource() {
    const r = A.byId('resources', qs('id')) || A.publicResources('news')[0];
    document.title = `${r.title} — 자료실 · ARGILO`;
    const cats = { cert: '인증/기술자료', guide: '시공가이드', news: 'News', catalog: '카탈로그' };
    const ps = (r.productIds || []).map(id => A.byId('products', id)).filter(Boolean);
    $('#res-detail').innerHTML = `<div class="crumbs"><a href="resources.html">자료실</a><span><a href="resources.html?cat=${r.cat}">${cats[r.cat]}</a></span></div><h1 class="h2-kr">${esc(r.title)}</h1><p class="small mt2">${esc(r.date)}${r.validUntil ? ` · 유효기간 ${esc(r.validUntil)}` : ''}${r.size ? ` · ${r.ext.toUpperCase()} ${fmt.size(r.size)}` : ''}${r.downloads ? ` · 다운로드 ${fmt.num(r.downloads)}회` : ''}</p><div class="hr"></div><p class="b-l col">${esc(r.body || '본문 없음')}</p>${ps.length ? `<h3 class="t-s mt5 mb2">관련 제품</h3><div class="mat-chips">${ps.map(p => `<a class="mat-chip" href="product.html?id=${p.id}"><span class="swatch" style="background-image:url(${thumb(p.images[0].src)})"></span>${esc(p.name)}</a>`).join('')}</div>` : ''}${r.cat !== 'news' ? `<div class="mt5"><button class="btn btn--clay" id="dl">${r.gate === 'open' ? '다운로드 ↓' : '링크 받기'}</button></div>` : ''}`;
    const b = $('#dl'); b && b.addEventListener('click', () => { A.downloadResource(r); UI.toast('내려받았습니다 (데모 파일)', 'ok'); });
    UI.init();
  }

  // ── 개인정보처리방침 (설정에서 생성) ────────────────────
  function privacy() {
    const S = A.get('settings');
    $('#proc-table').innerHTML = `<thead><tr><th>수탁자</th><th>위탁 업무</th><th>전달 항목</th></tr></thead><tbody>${S.processors.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.task)}</td><td>${esc(p.data)}</td></tr>`).join('')}</tbody>`;
    setText('#keep', `${Math.round(S.retentionDays / 30)}개월`); setText('#company', S.company);
    setText('#gen-at', `이 문안은 관리자 설정의 수탁자 목록(${S.processors.length}곳)·보유기간(${S.retentionDays}일)에서 자동 생성됩니다. 설정을 바꾸면 이 페이지도 바뀝니다.`);
  }

  // ── 접수 완료 ─────────────────────────────────────────────
  function done() {
    const type = qs('type') || 'quote', no = qs('no'); const it = A.get('inbox').find(x => x.no === no);
    const T = { quote: ['견적 의뢰가 접수되었습니다', ['접수', '담당자 확인', '견적서 회신', '상담·계약'], '영업일 기준 4시간 안에 담당자가 연락드리고, 견적서는 확인 후 1영업일 내 보내 드립니다.'], sample: ['샘플 신청이 접수되었습니다', ['접수', '담당자 확인', '발송 (송장 문자)', '수령 후 후속 연락'], '영업일 2일 내 발송하며 송장번호를 문자로 안내합니다. 수령 3일 뒤 담당자가 사용 소감을 여쭙습니다.'], consult: ['상담 신청이 접수되었습니다', ['접수', '담당자 확인', '회신', '완료'], '영업일 기준 4시간 안에 연락드립니다. 업무시간 외에는 다음 영업일 오전에 회신합니다.'] }[type];
    $('#done').innerHTML = `<span class="eyebrow eyebrow--serif">Received</span><h1 class="h2-kr mt2">${T[0]}</h1><div class="done-no num">${esc(no || '—')}</div><p class="b-l muted">${T[2]}</p>${it ? `<div class="summary mt4" style="position:static;text-align:left"><h3>접수 내역 <span class="small">${fmt.date(it.createdAt)} ${fmt.time(it.createdAt)}</span></h3><div class="row"><span>신청자</span><b>${esc(it.name)} · ${esc(it.phone)}</b></div>${it.snapshotNote ? `<div class="row"><span>계산 내역</span><b>${esc(it.snapshotNote)}</b></div>` : ''}${it.items && it.items.length ? `<div class="row"><span>샘플</span><b>${it.items.map(id => (A.byId('products', id) || {}).name).filter(Boolean).join(', ')}</b></div>` : ''}${it.address ? `<div class="row"><span>배송지</span><b>${esc(it.address)}</b></div>` : ''}${it.flags.fire ? `<div class="notice notice--warn mt2"><b>방화 검토 필요</b>로 표시되어 담당자가 외부용 성적서를 함께 안내합니다.</div>` : ''}${it.notify.length ? `<div class="row"><span>담당자 알림</span><b>${it.notify.filter(n => n.ok).length}/${it.notify.length}건 발송 ${it.notify.some(n => !n.ok) ? '<span class="badge badge--warn">1건 재발송 대기</span>' : ''}</b></div>` : ''}</div>` : ''}<div class="done-steps">${T[1].map((s, i) => `<div class="${i === 0 ? 'is-on' : ''}"><b>${i + 1}. ${s}</b>${i === 0 ? '지금' : ''}</div>`).join('')}</div><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a class="btn btn--ink" href="admin.html#/inbox">관리자 접수함에서 확인 (데모)</a><a class="btn btn--ghost" href="index.html">홈으로</a></div><p class="small mt3">알림 메일에는 이름 일부와 건수만 실립니다. 상세 내용은 로그인한 관리자만 열람하며 열람 기록이 남습니다.</p>`;
    UI.init();
  }

  const PAGES = { home, about, stone, products, product, cases, case: caseDetail, others, estimate, quote, sample, support, resources, resource, privacy, done, display: () => special('d01'), solar: () => special('v01') };
  document.addEventListener('DOMContentLoaded', () => { const k = document.body.dataset.page; if (PAGES[k]) PAGES[k](); });
})();
