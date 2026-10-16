/* C-07 단지 검색 결과(목록) · C-08 지도 분할 */
(function () {
  const { $, $$, esc, icon, fmt, qs } = UI;
  UI.init();
  const stress = Store.get('stress');
  const ALL = APT.allComplexes(stress);
  const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '세종', '충북', '충남', '경남'];
  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get('q') || '', region: params.get('region') || '', view: params.get('view') || 'list',
    hh: params.get('hh') || '', built: params.get('built') || '', area: params.get('area') || '', fmtF: params.get('fmt') || '', sort: params.get('sort') || 'updated', page: 1
  };
  const fb = $('#filterbar'), view = $('#view');

  function filtered() {
    let list = ALL.slice();
    const q = state.q.trim().toLowerCase();
    if (q) list = list.filter(c => (c.name + c.addr + c.gu + c.region).toLowerCase().includes(q));
    if (state.region) list = list.filter(c => c.region === state.region);
    if (state.hh) { const [a, b] = state.hh.split('-').map(Number); list = list.filter(c => c.households >= a && (b ? c.households < b : true)); }
    if (state.built) { const [a, b] = state.built.split('-').map(Number); list = list.filter(c => c.built >= a && (b ? c.built < b : true)); }
    if (state.area) { const [a, b] = state.area.split('-').map(Number); list = list.filter(c => APT.typesOf(c.id).some(t => t.exclusive >= a && (b ? t.exclusive < b : true))); }
    if (state.fmtF) list = list.filter(c => APT.typesOf(c.id).some(t => t.formats.includes(state.fmtF)));
    if (state.sort === 'updated') list.sort((a, b) => b.updated.localeCompare(a.updated));
    else if (state.sort === 'hh') list.sort((a, b) => b.households - a.households);
    else if (state.sort === 'built') list.sort((a, b) => b.built - a.built);
    else if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    return list;
  }
  function sync() { const p = new URLSearchParams(); ['q', 'region', 'view', 'hh', 'built', 'area', 'sort'].forEach(k => state[k] && p.set(k, state[k])); if (state.fmtF) p.set('fmt', state.fmtF); history.replaceState(null, '', 'search.html' + (p.toString() ? '?' + p : '')); }

  /* 필터바 */
  const F = {
    hh: ['세대수', [['', '전체'], ['0-500', '500세대 미만'], ['500-1000', '500~1,000'], ['1000-2000', '1,000~2,000'], ['2000-', '2,000세대 이상']]],
    built: ['준공년', [['', '전체'], ['2020-', '2020년 이후'], ['2010-2020', '2010년대'], ['2000-2010', '2000년대'], ['0-2000', '2000년 이전']]],
    area: ['면적대', [['', '전체'], ['0-60', '전용 60㎡ 미만'], ['60-85', '60~85㎡'], ['85-115', '85~115㎡'], ['115-', '115㎡ 이상']]],
    fmtF: ['보유 포맷', [['', '전체'], ['jpg', 'JPG'], ['pdf', 'PDF'], ['dwg', 'DWG(CAD)']]]
  };
  function filterSheet() {
    const sh = UI.sheet(`<div class="fsheet"><h3 class="h3">필터</h3>
      <div class="fs-group"><h5>지역</h5><div class="chips">${['', ...REGIONS].map(r => `<button type="button" class="chip" aria-pressed="${state.region === r}" data-fs="region" data-v="${r}">${r || '전체'}</button>`).join('')}</div></div>
      ${Object.entries(F).map(([k, [label, opts]]) => `<div class="fs-group"><h5>${label}</h5><div class="chips">${opts.map(o => `<button type="button" class="chip" aria-pressed="${state[k] === o[0]}" data-fs="${k}" data-v="${o[0]}">${o[1]}</button>`).join('')}</div></div>`).join('')}
      <div class="fs-foot"><button type="button" class="btn btn-secondary" data-fs-clear>전체 해제</button><button type="button" class="btn btn-primary" data-close>적용</button></div></div>`);
    const tmp = { region: state.region, hh: state.hh, built: state.built, area: state.area, fmtF: state.fmtF };
    $$('[data-fs]', sh).forEach(b => b.addEventListener('click', () => { tmp[b.dataset.fs] = b.dataset.v; $$(`[data-fs="${b.dataset.fs}"]`, sh).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
    $('[data-fs-clear]', sh).addEventListener('click', () => { Object.keys(tmp).forEach(k => tmp[k] = ''); $$('[data-fs]', sh).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.v === ''))); });
    $('[data-close]', sh).addEventListener('click', () => { Object.assign(state, tmp); state.page = 1; update(); });
  }
  function renderBar() {
    const active = ['region', 'hh', 'built', 'area', 'fmtF'].filter(k => state[k]).length;
    fb.innerHTML = `
      <form class="fb-q" role="search" data-qf>${icon('search', 'ico-16')}<input name="q" value="${esc(state.q)}" placeholder="단지명·주소" aria-label="단지명·주소"></form>
      <button type="button" class="fb-btn fb-mobile ${active ? 'is-active' : ''}" data-fsheet>${icon('filter')} 필터${active ? ' ' + active : ''}</button>
      <div class="fb-chips fb-desktop">
      <div style="position:relative"><button class="fb-btn ${state.region ? 'is-active' : ''}" data-dd="region">${state.region || '지역'} ${icon('chevD')}</button><div class="dropdown-f" data-ddbox="region"><div class="chips">${['', ...REGIONS].map(r => `<button type="button" class="chip" aria-pressed="${state.region === r}" data-set="region" data-v="${r}">${r || '전체'}</button>`).join('')}</div></div></div>
      ${Object.entries(F).map(([k, [label, opts]]) => `<div style="position:relative"><button class="fb-btn ${state[k] ? 'is-active' : ''}" data-dd="${k}">${state[k] ? opts.find(o => o[0] === state[k])[1] : label} ${icon('chevD')}</button><div class="dropdown-f" data-ddbox="${k}">${opts.map(o => `<label class="radio" style="padding:6px 0"><input type="radio" name="f-${k}" value="${o[0]}" ${state[k] === o[0] ? 'checked' : ''} data-set="${k}" data-v="${o[0]}"><span>${o[1]}</span></label>`).join('')}</div></div>`).join('')}
      </div>
      <span class="fb-sp"></span>
      <select class="select input-sm" style="width:auto;height:40px;border-radius:12px" data-sort aria-label="정렬"><option value="updated" ${state.sort === 'updated' ? 'selected' : ''}>최근 갱신순</option><option value="hh" ${state.sort === 'hh' ? 'selected' : ''}>세대수 많은 순</option><option value="built" ${state.sort === 'built' ? 'selected' : ''}>준공 최신순</option><option value="name" ${state.sort === 'name' ? 'selected' : ''}>이름순</option></select>
      <div class="seg fb-view" data-viewseg><button type="button" data-v="list" aria-pressed="${state.view === 'list'}">${icon('list', 'ico-16')} 목록</button><button type="button" data-v="map" aria-pressed="${state.view === 'map'}">${icon('map', 'ico-16')} 지도</button></div>`;
    $('[data-qf]', fb).addEventListener('submit', e => { e.preventDefault(); state.q = $('input', e.target).value; state.page = 1; update(); });
    $$('[data-dd]', fb).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const box = $(`[data-ddbox="${b.dataset.dd}"]`, fb); const o = box.classList.contains('open'); $$('.dropdown-f', fb).forEach(x => x.classList.remove('open')); box.classList.toggle('open', !o); }));
    $$('[data-set]', fb).forEach(el => el.addEventListener('click', () => { state[el.dataset.set] = el.dataset.v; state.page = 1; update(); }));
    $('[data-sort]', fb).addEventListener('change', e => { state.sort = e.target.value; update(); });
    $('[data-fsheet]', fb).addEventListener('click', filterSheet);
    UI.seg($('[data-viewseg]', fb)); $('[data-viewseg]', fb).addEventListener('segchange', e => { state.view = e.detail; update(); });
    let fab = $('.view-fab'); if (!fab) { fab = document.createElement('button'); fab.className = 'view-fab'; fab.type = 'button'; document.body.append(fab); fab.addEventListener('click', () => { state.view = state.view === 'map' ? 'list' : 'map'; update(); }); }
    fab.innerHTML = state.view === 'map' ? `${icon('list', 'ico-16')} 목록 보기` : `${icon('map', 'ico-16')} 지도 보기`;
    const hdr = $('.hdr'); if (hdr) document.documentElement.style.setProperty('--chrome-h', (hdr.getBoundingClientRect().bottom + fb.parentElement.offsetHeight) + 'px');
  }
  document.addEventListener('click', e => { if (!e.target.closest('.dropdown-f') && !e.target.closest('[data-dd]')) $$('.dropdown-f').forEach(x => x.classList.remove('open')); });

  function appliedChips() {
    const chips = [];
    if (state.q) chips.push(['q', `“${state.q}”`]);
    if (state.region) chips.push(['region', state.region]);
    Object.entries(F).forEach(([k, [, opts]]) => { if (state[k]) chips.push([k, opts.find(o => o[0] === state[k])[1]]); });
    if (!chips.length) return '';
    return `<div class="applied">${chips.map(([k, l]) => `<button type="button" class="chip is-active" data-clear="${k}">${esc(l)} <span class="x">${icon('close', 'ico-16')}</span></button>`).join('')}<button type="button" class="chip" data-clear="*">전체 해제</button></div>`;
  }
  function bindClear(root) { $$('[data-clear]', root).forEach(b => b.addEventListener('click', () => { const k = b.dataset.clear; if (k === '*') { state.q = state.region = state.hh = state.built = state.area = state.fmtF = ''; } else state[k] = ''; state.page = 1; update(); })); }

  function card(c) {
    const types = APT.typesOf(c.id).filter(t => t.status === 'public');
    const dup = ALL.filter(x => x.id !== c.id && x.name.replace(/\s*\d+차$/, '') === c.name.replace(/\s*\d+차$/, '') && /\d+차$/.test(c.name));
    const main = types[Math.min(2, types.length - 1)] || types[0];
    const bought = types.some(t => Store.isPurchased(t.id));
    return `<a class="complex-card" href="complex.html?id=${c.id}">
      <div class="cc-media">${main ? APT.planSVG(main, 'thumb') : ''}<div class="cc-badges"><span class="badge badge-pill">${esc(c.region)} · ${esc(c.gu)}</span>${bought ? '<span class="badge badge-pos">구매함</span>' : ''}</div></div>
      <div class="cc-body"><div class="cc-name clamp2" title="${esc(c.name)}">${esc(c.name)}</div>
      <div class="cc-meta">${esc(c.addr)}</div>
      <div class="cc-sub">${c.built}년 준공 · ${fmt.num(c.households)}세대 · ${c.dongs}개동 · ${types.length}개 타입</div>
      ${dup.length ? `<div class="cc-dup">${icon('alert', 'ico-16')}<span>같은 이름의 ${dup.map(d => d.name.match(/\d+차$/)[0]).join('·')} 단지가 있습니다 — 주소·준공으로 확인</span></div>` : ''}
      <div class="cc-foot"><span class="micro muted-3">갱신 ${c.updated}</span><span class="caption" style="color:var(--action)">${types.length ? fmt.won(Math.min(...types.map(t => Store.priceOf(t, 'jpg')))) + '부터' : '도면 준비 중'}</span></div></div></a>`;
  }

  function renderList(list) {
    const per = 9, pages = Math.ceil(list.length / per), pg = Math.min(state.page, pages || 1);
    const slice = list.slice((pg - 1) * per, pg * per);
    view.innerHTML = `<div class="shell-wide">
      <div class="results-head"><div><span class="rh-cnt">단지 <b>${list.length}</b>곳${state.q ? ` · “${esc(state.q)}”` : ''}</span><p class="micro muted-3" style="margin-top:2px">이름이 같은 단지는 주소·준공년도·세대수로 구분해 표시합니다</p></div><span class="micro muted-3 dev-note">현재 위치 검색 미제공 — 개인위치정보 수집 시 위치기반서비스 신고 대상(F11)</span></div>
      ${appliedChips()}
      <div id="list-body"></div>
      ${pages > 1 ? `<nav class="pager" aria-label="페이지">${Array.from({ length: pages }, (_, i) => `<button type="button" ${i + 1 === pg ? 'aria-current="page"' : ''} data-pg="${i + 1}">${i + 1}</button>`).join('')}</nav>` : ''}</div>`;
    bindClear(view);
    $$('[data-pg]', view).forEach(b => b.addEventListener('click', () => { state.page = +b.dataset.pg; update(); scrollTo({ top: 0, behavior: 'smooth' }); }));
    const body = $('#list-body');
    const sk = `<div class="cards-3">${Array.from({ length: 6 }, () => `<div class="complex-card"><div class="cc-media skeleton"></div><div class="cc-body"><div class="sk-line skeleton" style="width:70%"></div><div class="sk-line skeleton" style="width:90%"></div><div class="sk-line skeleton" style="width:50%"></div></div></div>`).join('')}</div>`;
    UI.load(body, sk, el => {
      if (!list.length) {
        el.innerHTML = `<div class="empty"><div class="em-ico">${icon('search', 'ico-24')}</div><div class="em-title">조건에 맞는 단지가 없습니다</div><div class="em-desc">${state.q ? `“${esc(state.q)}”와 비슷한 이름이 없습니다. 철자를 바꾸거나 주소(동 이름)로 검색해 보세요.` : '필터를 하나씩 풀어 보세요.'}</div>${appliedChips()}<div class="em-actions"><button type="button" class="btn btn-primary" data-clear="*">검색·필터 해제</button><button type="button" class="btn btn-secondary" data-request>도면 등록 요청</button></div><p class="micro muted-3 dev-note">빈 상태 S-01 — 상태·학습 단서·직접 경로 (NN/g 3원칙)</p></div>`;
        bindClear(el);
        $('[data-request]', el).addEventListener('click', () => UI.toast(`“${state.q || '해당 조건'}” 단지 도면 등록 요청을 접수했습니다. 등록되면 이메일로 알려 드립니다.`, { type: 'pos', icon: 'check' }));
      } else {
        el.innerHTML = `<div class="cards-3" data-reveal-group>${slice.map(card).join('')}</div>`;
        UI.reveal();
      }
    }, '단지를 불러오는 중');
  }

  /* ── 지도 분할 (C-08) — 외부 지도 없이 canvas로 도식 지도 · 핀 = 타입 수 + 가격 2단 ── */
  let sel = null;
  function renderMap(list) {
    view.innerHTML = `<div class="mapview">
      <aside class="mv-panel"><div class="results-head" style="margin-top:0"><span class="rh-cnt">지도 영역 안 <b data-cnt>${list.length}</b>곳</span></div>${appliedChips()}<div id="mv-list"></div></aside>
      <div class="mv-map" id="mv-map"><canvas id="mapc"></canvas>
        <label class="map-sync"><input type="checkbox" checked data-sync> 지도를 움직이면 목록 필터</label>
        <div class="map-ctl"><button type="button" data-z="1" aria-label="확대">+</button><button type="button" data-z="-1" aria-label="축소">−</button><button type="button" data-fit aria-label="전체 보기">${icon('fit', 'ico-16')}</button></div>
        <div class="map-note dev-note">도식 지도 — 실제 지도 API 연동 시 같은 핀·팝오버 규칙 적용 · 「현재 위치」 버튼은 위치기반서비스 신고 대상이라 기본 미포함</div>
      </div></div>`;
    bindClear(view);
    const mapEl = $('#mv-map'), cv = $('#mapc'), ctx = cv.getContext('2d');
    let zoom = 1, ox = 0, oy = 0, drag = null;
    const pts = list.map(c => ({ c, x: (c.lng - 126.0) / (129.8 - 126.0), y: 1 - (c.lat - 35.0) / (37.8 - 35.0) }));
    function proj(p) { const W = mapEl.clientWidth, H = mapEl.clientHeight; return { x: (p.x * W - W / 2) * zoom + W / 2 + ox, y: (p.y * H - H / 2) * zoom + H / 2 + oy }; }
    function draw() {
      const dpr = devicePixelRatio || 1, W = mapEl.clientWidth, H = mapEl.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#eef1f4'; ctx.fillRect(0, 0, W, H);
      // 도로 그리드 + 블록
      const g = 72 * zoom; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, 4 * zoom);
      for (let x = (ox % g + g) % g - g; x < W + g; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = (oy % g + g) % g - g; y < H + g; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.fillStyle = '#dfe6ec'; // 수역
      ctx.beginPath(); ctx.ellipse(W * .18 * zoom + W / 2 * (1 - zoom) + ox, H * .62 * zoom + H / 2 * (1 - zoom) + oy, 140 * zoom, 60 * zoom, -.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d9e4d3'; ctx.beginPath(); ctx.ellipse(W * .72 * zoom + W / 2 * (1 - zoom) + ox, H * .3 * zoom + H / 2 * (1 - zoom) + oy, 120 * zoom, 90 * zoom, .4, 0, Math.PI * 2); ctx.fill();
      // 핀 DOM
      $$('.pin,.pin-pop', mapEl).forEach(e => e.remove());
      const inView = [];
      const placed = [];
      pts.forEach(p => { const { x, y } = proj(p); if (x < -40 || x > W + 40 || y < -40 || y > H + 40) return; inView.push(p.c);
        const near = placed.find(q => Math.abs(q.x - x) < 56 && Math.abs(q.y - y) < 44 && q.c.id !== sel);
        if (near && p.c.id !== sel) { near.members.push(p.c); return; }
        placed.push({ x, y, c: p.c, members: [p.c], p }); });
      placed.forEach(pl => {
        const d = document.createElement('div'); d.style.left = pl.x + 'px'; d.style.top = pl.y + 'px';
        if (pl.members.length > 1) { d.className = 'pin pin-cluster'; d.innerHTML = `<div class="pin-box"><small>단지</small><b>${pl.members.length}곳</b></div>`; d.addEventListener('click', e => { e.stopPropagation(); zoom = Math.min(4, zoom * 1.8); const W2 = mapEl.clientWidth, H2 = mapEl.clientHeight; ox = -(pl.p.x * W2 - W2 / 2) * zoom; oy = -(pl.p.y * H2 - H2 / 2) * zoom; draw(); }); }
        else { const c = pl.c, types = APT.typesOf(c.id); d.className = 'pin' + (sel === c.id ? ' is-sel' : ''); d.dataset.id = c.id;
          d.innerHTML = `<div class="pin-box"><small>${types.length}타입</small><b>${Math.min(...types.map(t => t.exclusive)).toFixed(0)}~${Math.max(...types.map(t => t.exclusive)).toFixed(0)}㎡</b></div>`;
          d.addEventListener('click', e => { e.stopPropagation(); select(c.id, true); }); }
        mapEl.append(d); });
      if (sel) { const p = pts.find(x => x.c.id === sel); if (p) { const { x, y } = proj(p); const c = p.c, types = APT.typesOf(c.id); const pop = document.createElement('div'); pop.className = 'pin-pop'; pop.style.left = x + 'px'; pop.style.top = y + 'px'; pop.innerHTML = `<button class="ibtn pp-x" aria-label="닫기" data-x>${icon('close', 'ico-16')}</button><div style="display:grid;grid-template-columns:64px 1fr;gap:10px"><div style="background:var(--surface-1);border-radius:8px;padding:4px">${APT.planSVG(types[0], 'thumb')}</div><div><div style="font-weight:700;font-size:14px;line-height:1.3">${esc(c.name)}</div><div class="micro muted-3" style="margin-top:2px">${c.built}년 · ${fmt.num(c.households)}세대 · ${types.length}타입</div><a class="btn btn-sm btn-primary mt-2" href="complex.html?id=${c.id}">단지 상세</a></div></div>`; $('[data-x]', pop).addEventListener('click', e => { e.stopPropagation(); select(null); }); mapEl.append(pop); } }
      if ($('[data-sync]').checked) { const lb = $('#mv-list'); $('[data-cnt]').textContent = inView.length; renderItems(inView); }
    }
    function renderItems(arr) {
      const lb = $('#mv-list');
      if (!arr.length) { lb.innerHTML = `<div class="empty" style="padding:32px 8px"><div class="em-ico">${icon('map', 'ico-24')}</div><div class="em-title">이 영역에 단지가 없습니다</div><div class="em-desc">지도를 축소하거나 다른 지역으로 이동해 보세요.</div><div class="em-actions"><button class="btn btn-sm btn-secondary" data-fit2>전체 보기</button></div></div>`; $('[data-fit2]', lb).addEventListener('click', fit); return; }
      lb.innerHTML = arr.map(c => { const types = APT.typesOf(c.id); return `<div class="mv-item ${sel === c.id ? 'is-sel' : ''}" data-id="${c.id}" tabindex="0" role="button"><div class="mi-thumb">${APT.planSVG(types[0], 'thumb')}</div><div><div class="mi-name ellip" title="${esc(c.name)}">${esc(c.name)}</div><div class="mi-meta">${esc(c.gu)} · ${c.built}년 · ${fmt.num(c.households)}세대</div><div class="mi-meta">${types.length}개 타입 · ${fmt.won(Math.min(...types.map(t => Store.priceOf(t, 'jpg'))))}부터</div></div></div>`; }).join('');
      $$('.mv-item', lb).forEach(el => { el.addEventListener('click', () => select(el.dataset.id, true)); el.addEventListener('keydown', e => { if (e.key === 'Enter') select(el.dataset.id, true); }); });
    }
    function select(id, center) { sel = id; if (center && id) { const p = pts.find(x => x.c.id === id); const W = mapEl.clientWidth, H = mapEl.clientHeight; ox = -(p.x * W - W / 2) * zoom; oy = -(p.y * H - H / 2) * zoom + 60; } draw(); const it = $(`.mv-item[data-id="${id}"]`); it && it.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    function fit() { if (!pts.length) { zoom = 1; ox = oy = 0; draw(); return; } const W = mapEl.clientWidth, H = mapEl.clientHeight; const xs = pts.map(p => p.x), ys = pts.map(p => p.y); const bw = Math.max(.08, Math.max(...xs) - Math.min(...xs)), bh = Math.max(.08, Math.max(...ys) - Math.min(...ys)); zoom = Math.min(4, Math.max(.6, Math.min(.78 / bw, .7 / bh))); const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2; ox = -(cx * W - W / 2) * zoom; oy = -(cy * H - H / 2) * zoom + 30; draw(); }
    $$('[data-z]', mapEl).forEach(b => b.addEventListener('click', () => { zoom = Math.min(4, Math.max(.6, zoom * (b.dataset.z > 0 ? 1.3 : 1 / 1.3))); draw(); }));
    $('[data-fit]', mapEl).addEventListener('click', fit);
    $('[data-sync]').addEventListener('change', draw);
    mapEl.addEventListener('pointerdown', e => { if (e.target.closest('.pin,.pin-pop,button,label')) return; drag = { x: e.clientX, y: e.clientY, ox, oy }; mapEl.setPointerCapture(e.pointerId); });
    mapEl.addEventListener('pointermove', e => { if (!drag) return; ox = drag.ox + (e.clientX - drag.x); oy = drag.oy + (e.clientY - drag.y); draw(); });
    mapEl.addEventListener('pointerup', () => drag = null);
    mapEl.addEventListener('click', e => { if (!e.target.closest('.pin,.pin-pop,button,label')) select(null); });
    mapEl.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.min(4, Math.max(.6, zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1))); draw(); }, { passive: false });
    mapEl.addEventListener('keydown', e => { const s = 40; if (e.key === 'ArrowLeft') ox += s; else if (e.key === 'ArrowRight') ox -= s; else if (e.key === 'ArrowUp') oy += s; else if (e.key === 'ArrowDown') oy -= s; else if (e.key === '+' || e.key === '=') zoom = Math.min(4, zoom * 1.2); else if (e.key === '-') zoom = Math.max(.6, zoom / 1.2); else return; e.preventDefault(); draw(); });
    mapEl.tabIndex = 0; mapEl.setAttribute('aria-label', '단지 지도 — 화살표 키로 이동, +/- 로 확대·축소');
    new ResizeObserver(draw).observe(mapEl);
    fit();
  }

  function update() { sync(); renderBar(); const list = filtered(); if (state.view === 'map') renderMap(list); else renderList(list); }
  update();
})();
