/* C-12 도면 뷰어(구매자) · C-14 모바일 — 구현 방식(image/tile/vector)에 따라 기능이 켜지고 꺼짐(F7)
   접근성: 드래그 대안 방향 버튼·키보드(WCAG 2.5.7), 툴바 40px·모바일 44px(2.5.8) · 다이내믹 워터마크(F6) · 첫 열람 시각 기록(F2) */
(function () {
  const { $, $$, esc, icon, fmt, qs } = UI;
  UI.init({ footer: false, header: false, banner: false });
  document.documentElement.style.setProperty('--chrome-h', '0px');
  const main = $('#main');
  const t = APT.type(qs('id') || 'c01-84A');
  if (!t) { main.innerHTML = `<div class="gate"><h1 class="h2">도면을 찾을 수 없습니다</h1><a class="btn btn-primary" href="search.html">단지 검색</a></div>`; return; }
  const c = APT.complex(t.complexId);
  const impl = Store.get('viewerImpl');
  const role = Store.get('role');
  const S = 60; // px per m (planSVG 축척)
  let z = 1, rot = 0, px = 0, py = 0, areaLayer = true, measure = false, mpts = [];

  /* ── 권한 없음 ① 비로그인 / ② 미구매 ── */
  if (role === 'guest') { UI.gateLogin(main, 'viewer.html?id=' + t.id); return; }
  const p = Store.purchasedItem(t.id);
  if (!p) { renderGated(); return; }
  if (!p.item.viewedAt) {
    UI.confirm({ title: '이 도면을 지금 열까요?', body: `<strong>열람을 시작하면 이 도면(${t.code} ${APT.FORMATS[p.item.format].label})은 환불할 수 없게 됩니다.</strong><br><br>디지털 콘텐츠는 제공이 시작되면 청약철회가 제한됩니다(전자상거래법 제17조). 열람 시작 시각은 주문 내역에 기록됩니다.`, yes: '열람 시작', no: '나중에' }).then(ok => { if (ok) { Store.markViewed(t.id); boot(); } else history.length > 1 ? history.back() : location.href = 'my.html'; });
    main.innerHTML = `<div class="loading-box" style="height:60vh"><div class="spinner"></div><span>열람 확인 대기 중</span></div>`;
  } else boot();

  function renderGated() {
    main.innerHTML = `<div class="vw">${topBar(false)}<div class="vw-main"><div class="vw-stage" style="display:grid;place-items:center;padding:24px"><div style="max-width:720px;width:100%;filter:blur(1.5px);opacity:.8">${APT.planSVG(t, 'preview')}</div>
      <div class="vw-gate"><div class="card"><div class="g-ico" style="margin:0 auto 12px;width:56px;height:56px;border-radius:16px;background:var(--surface-2);display:grid;place-items:center;color:var(--brand)">${icon('lock', 'ico-24')}</div><h2 class="h3">구매한 도면만 뷰어에서 열 수 있습니다</h2><p class="body-sm muted mt-2">${esc(c.name)} ${t.code} 타입은 아직 구매하지 않았습니다. 미리보기로 방 구성을 확인한 뒤 구매하세요.</p><div class="row jc-c gap-2 mt-4"><a class="btn btn-secondary" href="plan.html?id=${t.id}#preview">미리보기</a><a class="btn btn-primary" href="plan.html?id=${t.id}">구매하기</a></div><p class="micro muted-3 mt-3 dev-note">권한 없음 ② — 미구매 도면 원본 접근 (S-04)</p></div></div></div>${rail()}</div></div>`;
    bindRail();
  }
  function topBar(full) {
    return `<div class="vw-top"><a class="ibtn" href="complex.html?id=${c.id}" aria-label="단지로 돌아가기">${icon('arrowL')}</a><a class="logo" href="index.html" style="font-size:16px"><span class="logo-mark" style="width:24px;height:24px"></span></a><div class="vt-title ellip">${esc(c.name)} <span style="color:var(--action)">${t.code}</span> 타입<small>전용 ${t.exclusive}㎡ · 방 ${t.rooms} 욕실 ${t.baths} · ${APT.BASIS[t.meta.basis]} · ${t.meta.updated}</small></div>
      <div class="seg" data-modeseg><button type="button" data-v="plan" aria-pressed="true">평면도</button><button type="button" data-v="site" aria-pressed="false">배치도</button><a href="compare.html?a=${t.id}&b=${(APT.typesOf(c.id).find(x => x.id !== t.id) || t).id}" style="display:inline-flex;align-items:center;height:34px;padding:0 14px;font-size:14px;font-weight:600;color:var(--ink-3)">비교</a></div>
      <div class="vt-right">${full ? `<button class="btn btn-sm btn-primary" data-dl>${icon('download', 'ico-16')}<span>다운로드</span></button><button class="ibtn" data-fs aria-label="전체화면">${icon('fullscreen')}</button>` : ''}</div></div>`;
  }
  function rail() {
    const list = APT.typesOf(c.id);
    return `<aside class="vw-rail"><h4>같은 단지 타입 ${list.length}</h4>${list.map(x => { const b = Store.isPurchased(x.id); return `<a class="rail-item ${x.id === t.id ? 'is-cur' : ''}" href="${b ? 'viewer.html?id=' + x.id : 'plan.html?id=' + x.id}">${APT.planSVG(x, 'thumb')}<div class="ri-lbl"><span>${x.code}</span><small>${x.exclusive.toFixed(0)}㎡</small></div>${b ? '' : `<span class="ri-lock badge">${icon('lock', 'ico-16')}미구매</span>`}</a>`; }).join('')}
      <div class="vw-info"><strong>도면 정보</strong><dl><dt>작성 기준</dt><dd>${APT.BASIS[t.meta.basis]}</dd><dt>확장</dt><dd>${t.meta.expansion ? '반영' : '미반영'}</dd><dt>출처</dt><dd>${APT.SOURCE_KINDS[t.source.kind]}</dd><dt>버전</dt><dd>${t.meta.version} · ${t.meta.updated}</dd></dl><p>도면은 근사치이며 실제 세대와 다를 수 있습니다. 설계·시공 전 실측하세요.</p>${p ? `<p class="mt-2">다운로드 ${p.item.downloads}/${APT.DOWNLOAD_MAX}회 · ${fmt.daysLeft(p.order.createdAt, APT.DOWNLOAD_DAYS)}일 남음</p>` : ''}</div></aside>`;
  }
  function bindRail() { const seg = $('[data-modeseg]'); seg && UI.seg(seg); }

  function boot() {
    const wm = `${Store.get('profile').email.split('@')[0]} · ${p.order.id} · ${fmt.dt(p.item.viewedAt || new Date().toISOString())}`;
    main.innerHTML = `<div class="vw">${topBar(true)}<div class="vw-main">
      <div class="vw-stage" id="stage" tabindex="0" aria-label="도면 뷰어 — 드래그 또는 화살표 키로 이동, +/- 확대·축소, 0 초기화, R 회전, F 맞춤">
        <div class="vw-badge"><span class="badge badge-brand">${impl === 'image' ? '단일 이미지' : impl === 'tile' ? '타일 딥줌' : '벡터(SVG)'}</span><span class="badge badge-outline">${APT.FORMATS[p.item.format].label} 구매본</span><span class="badge ${t.meta.expansion ? 'badge-info' : 'badge-outline'}">확장 ${t.meta.expansion ? '반영' : '미반영'}</span></div>
        <div class="vw-impl">구현 방식 <div class="seg" data-implseg><button type="button" data-v="image" aria-pressed="${impl === 'image'}">이미지</button><button type="button" data-v="tile" aria-pressed="${impl === 'tile'}">타일</button><button type="button" data-v="vector" aria-pressed="${impl === 'vector'}">벡터</button></div></div>
        <div class="vw-canvas no-anim" id="canvas"></div>

        <div class="vw-dir" aria-label="도면 이동 버튼 (드래그 대안)"><button data-mv="0,-1" aria-label="위로">${icon('arrowU', 'ico-16')}</button><button data-mv="-1,0" aria-label="왼쪽으로">${icon('arrowL', 'ico-16')}</button><button class="c" data-reset aria-label="초기화">${icon('fit', 'ico-16')}</button><button data-mv="1,0" aria-label="오른쪽으로">${icon('arrowR', 'ico-16')}</button><button data-mv="0,1" aria-label="아래로">${icon('arrowD', 'ico-16')}</button></div>
        <div class="vw-tool" role="toolbar" aria-label="뷰어 도구">
          <button class="ibtn" data-z="-1" aria-label="축소">${icon('minus')}</button><span class="zv" data-zv>100%</span><button class="ibtn" data-z="1" aria-label="확대">${icon('plus')}</button>
          <button class="ibtn" data-fit aria-label="화면 맞춤" data-tip="화면 맞춤 (F)">${icon('fit')}</button><button class="ibtn" data-100 aria-label="100%" data-tip="100% (0)"><span style="font-size:11px;font-weight:800">1:1</span></button><button class="ibtn" data-rot aria-label="회전" data-tip="90° 회전 (R)">${icon('rotate')}</button>
          <span class="sep"></span>
          <button class="ibtn" data-area aria-pressed="true" aria-label="실별 면적 레이어" data-tip="실별 면적 레이어">${icon('layers')}</button>
          <button class="ibtn ${impl === 'vector' ? '' : 'is-off'}" data-hi aria-pressed="false" aria-label="방 하이라이트" data-tip="${impl === 'vector' ? '방 클릭 → 면적 하이라이트' : '벡터 구현에서만 가능 (좌표 데이터 필요)'}">${icon('hand')}</button>
          <button class="ibtn ${impl === 'vector' ? '' : 'is-off'}" data-measure aria-pressed="false" aria-label="치수 측정" data-tip="${impl === 'vector' ? '두 점을 클릭해 거리 측정' : '벡터 구현에서만 가능 (축척 데이터 필요)'}">${icon('ruler')}</button>
          <span class="sep"></span><button class="ibtn" data-kb aria-label="키보드 안내" data-tip="키보드 조작 안내">${icon('keyboard')}</button>
          <button class="ibtn" data-info aria-label="도면 정보">${icon('info')}</button><button class="ibtn" data-more aria-label="더보기">${icon('menu')}</button>
        </div>
      </div>${rail()}</div></div>`;
    bindRail();
    const stage = $('#stage'), cv = $('#canvas');
    const svg = APT.planSVG(t, 'full', { watermark: wm });
    const g = APT.planGeometry(t); const W = g.W * S + 80, H = g.H * S + 80;

    /* 구현 방식별 렌더 */
    function mount() {
      if (impl === 'vector') { cv.innerHTML = svg; }
      else {
        const img = new Image(); img.width = W; img.height = H; img.alt = `${t.code} 타입 평면도 — 방 ${t.rooms}, 욕실 ${t.baths}, 전용 ${t.exclusive}㎡`;
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); img.draggable = false; cv.innerHTML = ''; cv.append(img);
        if (impl === 'tile') { const tiles = document.createElement('div'); tiles.className = 'vw-tiles'; tiles.innerHTML = '<i></i>'.repeat(12); cv.append(tiles); const prog = document.createElement('div'); prog.className = 'vw-progress'; prog.innerHTML = `<span>타일 불러오는 중 <b data-tp>0</b>/12</span><div class="progress" style="width:200px"><i></i></div>`; stage.append(prog); const d = Math.min(+Store.get('loadDelay'), 15) * 1000 / 12; $$('i', tiles).forEach((ti, i) => setTimeout(() => { ti.classList.add('ok'); $('[data-tp]', prog).textContent = i + 1; $('.progress>i', prog).style.width = ((i + 1) / 12 * 100) + '%'; if (i === 11) setTimeout(() => prog.remove(), 300); }, d * (i + 1))); }
      }
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      if (impl === 'vector') { const s = $('svg', cv); s.style.width = W + 'px'; s.style.height = H + 'px'; $$('.room', cv).forEach(r => r.addEventListener('click', e => { if (measure) return; if ($('[data-hi]').getAttribute('aria-pressed') !== 'true') return; r.classList.toggle('is-hi'); const hi = $$('.room.is-hi', cv); UI.toast(hi.length ? `선택 ${hi.length}실 · 합계 ${hi.reduce((a, b) => a + +b.dataset.area, 0).toFixed(1)}㎡ (${hi.map(x => x.dataset.name).join('·')})` : '선택 해제', { ms: 2500 }); })); }
      applyArea();
    }
    function applyArea() { $$('.room text:nth-of-type(2)', cv).forEach(el => el.style.display = areaLayer ? '' : 'none'); }
    function apply(anim) { cv.classList.toggle('no-anim', !anim); cv.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px)) scale(${z}) rotate(${rot}deg)`; $('[data-zv]').textContent = Math.round(z * 100) + '%'; }
    function fit() { const r = stage.getBoundingClientRect(); z = Math.min((r.width - 80) / W, (r.height - 140) / H, 4); px = 0; py = -20; apply(true); }
    function setZ(nz, anim, ax, ay) { const oz = z; z = Math.min(4, Math.max(.25, nz)); if (ax != null) { const r = stage.getBoundingClientRect(); const cx = ax - r.left - r.width / 2, cy = ay - r.top - r.height / 2; px = cx - (cx - px) * z / oz; py = cy - (cy - py) * z / oz; } apply(anim !== false); if (z >= 4 && oz < 4) UI.toast('최대 확대 400%', { ms: 1500 }); }
    mount(); fit();
    if (!sessionStorage.getItem('aptgo.vwhint')) { sessionStorage.setItem('aptgo.vwhint', '1'); setTimeout(() => UI.toast('드래그 · 휠 · 핀치로 조작 — 키보드: 화살표 이동 · + − 확대 · 0 초기화 · R 회전', { ms: 5000, icon: 'info' }), 400); }
    $('[data-info]').addEventListener('click', () => UI.sheet(`<h3 class="h3 mb-3">도면 정보</h3><dl class="vw-info" style="border:0;margin:0;font-size:14px"><dt>작성 기준</dt><dd>${APT.BASIS[t.meta.basis]}</dd><dt>확장</dt><dd>${t.meta.expansion ? '반영' : '미반영'}</dd><dt>출처</dt><dd>${APT.SOURCE_KINDS[t.source.kind]}</dd><dt>버전</dt><dd>${t.meta.version} · ${t.meta.updated}</dd><dt>다운로드</dt><dd>${p.item.downloads}/${APT.DOWNLOAD_MAX}회 · ${fmt.daysLeft(p.order.createdAt, APT.DOWNLOAD_DAYS)}일 남음</dd></dl><div class="notice notice-warn mt-3">${icon('alert', 'ico-16')}<span>도면은 근사치이며 실제 세대와 다를 수 있습니다. 설계·시공 전 실측하세요.</span></div><button class="btn btn-secondary btn-block mt-3" data-close>닫기</button>`));
    $('[data-more]').addEventListener('click', () => { const sh = UI.sheet(`<h3 class="h3 mb-3">도구</h3><div class="grid g2"><button class="btn btn-secondary" data-m="rot">${icon('rotate', 'ico-16')} 90° 회전</button><button class="btn btn-secondary" data-m="area">${icon('layers', 'ico-16')} 면적 레이어 ${areaLayer ? '끄기' : '켜기'}</button><button class="btn btn-secondary" data-m="hi" ${impl === 'vector' ? '' : 'disabled'}>${icon('hand', 'ico-16')} 방 하이라이트</button><button class="btn btn-secondary" data-m="measure" ${impl === 'vector' ? '' : 'disabled'}>${icon('ruler', 'ico-16')} 치수 측정</button><button class="btn btn-secondary" data-m="dl">${icon('download', 'ico-16')} 다운로드</button><button class="btn btn-secondary" data-m="impl">구현 방식: ${impl}</button></div>${impl !== 'vector' ? '<p class="micro muted-3 mt-3">방 하이라이트·치수 측정은 벡터(SVG) 구현에서만 가능합니다.</p>' : ''}`); $$('[data-m]', sh).forEach(b => b.addEventListener('click', () => { const k = b.dataset.m; sh.close(); if (k === 'rot') $('[data-rot]').click(); else if (k === 'area') $('[data-area]').click(); else if (k === 'hi') $('[data-hi]').click(); else if (k === 'measure') $('[data-measure]').click(); else if (k === 'dl') $('[data-dl]').click(); else if (k === 'impl') { const n = { image: 'tile', tile: 'vector', vector: 'image' }[impl]; Store.set('viewerImpl', n); location.reload(); } })); });
    $$('[data-z]').forEach(b => b.addEventListener('click', () => setZ(z * (b.dataset.z > 0 ? 1.25 : .8))));
    $('[data-fit]').addEventListener('click', fit); $('[data-reset]').addEventListener('click', fit);
    $('[data-100]').addEventListener('click', () => { z = 1; px = py = 0; apply(true); });
    $('[data-rot]').addEventListener('click', () => { rot = (rot + 90) % 360; apply(true); });
    $('[data-area]').addEventListener('click', e => { areaLayer = !areaLayer; e.currentTarget.setAttribute('aria-pressed', String(areaLayer)); applyArea(); });
    $$('[data-mv]').forEach(b => b.addEventListener('click', () => { const [dx, dy] = b.dataset.mv.split(',').map(Number); px -= dx * 80; py -= dy * 80; apply(true); b.style.setProperty('--nx', dx * 2 + 'px'); b.style.setProperty('--ny', dy * 2 + 'px'); b.classList.add('is-nudge'); setTimeout(() => b.classList.remove('is-nudge'), 120); }));
    const hiBtn = $('[data-hi]'), mBtn = $('[data-measure]');
    hiBtn.addEventListener('click', () => { if (impl !== 'vector') { UI.toast('방 하이라이트는 벡터(SVG) 구현에서만 가능합니다 — 래스터 도면에는 방 좌표가 없습니다', { icon: 'info' }); return; } const on = hiBtn.getAttribute('aria-pressed') !== 'true'; hiBtn.setAttribute('aria-pressed', String(on)); if (!on) $$('.room.is-hi', cv).forEach(x => x.classList.remove('is-hi')); else UI.toast('방을 클릭하면 면적이 합산됩니다', { ms: 2500 }); });
    mBtn.addEventListener('click', () => { if (impl !== 'vector') { UI.toast('치수 측정은 축척 데이터가 있는 벡터 구현에서만 가능합니다', { icon: 'info' }); return; } measure = !measure; mBtn.setAttribute('aria-pressed', String(measure)); cv.classList.toggle('measure', measure); mpts = []; $$('.vw-measure', stage).forEach(x => x.remove()); if (measure) UI.toast('도면 위 두 점을 클릭하세요', { ms: 2500 }); });
    $('[data-kb]').addEventListener('click', () => UI.modal(`<ul style="display:grid;gap:8px;font-size:14px"><li><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> 도면 이동 (80px)</li><li><kbd>+</kbd> <kbd>-</kbd> 확대·축소</li><li><kbd>0</kbd> 100% · <kbd>F</kbd> 화면 맞춤 · <kbd>R</kbd> 90° 회전</li><li><kbd>Tab</kbd> 툴바·레일 순서대로 초점 이동</li></ul><p class="micro muted-3 mt-3">드래그·핀치로 하는 모든 동작은 버튼과 키보드로도 가능합니다 (WCAG 2.5.7). 툴바 버튼은 40px, 모바일 44px (2.5.8).</p>`, { title: '키보드 조작' }));
    $('[data-fs]').addEventListener('click', () => { const el = $('.vw'); if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen && el.requestFullscreen(); });
    $('[data-dl]').addEventListener('click', download);
    const implSeg = $('[data-implseg]'); UI.seg(implSeg); implSeg.addEventListener('segchange', e => { Store.set('viewerImpl', e.detail); location.reload(); });

    /* 포인터: 드래그·휠·핀치 */
    let drag = null, pinch = null;
    stage.addEventListener('pointerdown', e => { if (e.target.closest('button,a,.vw-tool,.vw-dir,.vw-impl')) return; if (measure && impl === 'vector') { const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) / z, y = (e.clientY - r.top) / z; mpts.push({ x, y, cx: e.clientX - stage.getBoundingClientRect().left, cy: e.clientY - stage.getBoundingClientRect().top }); if (mpts.length === 2) { const d = Math.hypot(mpts[1].x - mpts[0].x, mpts[1].y - mpts[0].y) / S; const lbl = document.createElement('div'); lbl.className = 'vw-measure'; lbl.style.left = ((mpts[0].cx + mpts[1].cx) / 2) + 'px'; lbl.style.top = ((mpts[0].cy + mpts[1].cy) / 2) + 'px'; lbl.textContent = (d * 1000).toFixed(0) + ' mm'; stage.append(lbl); mpts = []; } return; } drag = { x: e.clientX, y: e.clientY, px, py }; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', e => { if (!drag) return; px = drag.px + (e.clientX - drag.x); py = drag.py + (e.clientY - drag.y); apply(false); });
    stage.addEventListener('pointerup', () => drag = null); stage.addEventListener('pointercancel', () => drag = null);
    stage.addEventListener('wheel', e => { e.preventDefault(); setZ(z * (e.deltaY < 0 ? 1.1 : 1 / 1.1), false, e.clientX, e.clientY); }, { passive: false });
    stage.addEventListener('touchstart', e => { if (e.touches.length === 2) pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), z }; }, { passive: true });
    stage.addEventListener('touchmove', e => { if (pinch && e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); setZ(pinch.z * d / pinch.d, false); } }, { passive: true });
    stage.addEventListener('touchend', () => pinch = null);
    let lastTap = 0; stage.addEventListener('click', e => { const now = Date.now(); if (now - lastTap < 300 && !e.target.closest('button,a')) { setZ(z < 2 ? z * 2 : 1, true, e.clientX, e.clientY); } lastTap = now; });
    stage.addEventListener('keydown', e => { const k = e.key; if (k === 'ArrowLeft') px += 80; else if (k === 'ArrowRight') px -= 80; else if (k === 'ArrowUp') py += 80; else if (k === 'ArrowDown') py -= 80; else if (k === '+' || k === '=') { setZ(z * 1.25); return; } else if (k === '-') { setZ(z * .8); return; } else if (k === '0') { z = 1; px = py = 0; } else if (k.toLowerCase() === 'r') rot = (rot + 90) % 360; else if (k.toLowerCase() === 'f') { fit(); return; } else return; e.preventDefault(); apply(true); });
    new ResizeObserver(() => apply(false)).observe(stage);

    /* 다운로드 — 실제 파일 생성: JPG(canvas) · PDF(JPEG 임베드 최소 PDF) · DXF(LINE 엔티티, DWG 변환은 서버 몫) */
    function download() {
      if (p.item.downloads >= APT.DOWNLOAD_MAX) { UI.modal(`<p>이 도면의 다운로드 횟수(${APT.DOWNLOAD_MAX}회)를 모두 사용했습니다. 재발급은 고객센터에 요청하세요.</p><p class="micro muted-3 mt-2 dev-note">결제·다운로드 예외 — S-06</p>`, { title: '다운로드 한도 초과' }); return; }
      const f = p.item.format;
      const m = UI.modal(`<p class="body-sm muted">구매한 포맷 <strong>${APT.FORMATS[f].label}</strong>으로 내려받습니다. 파일에는 구매자 식별 정보가 희미하게 포함됩니다.</p><dl class="vw-info" style="border:0;margin-top:8px"><dt>파일명</dt><dd>${esc(c.name)}_${t.code}${f === 'dwg' ? '.dxf' : APT.FORMATS[f].ext}</dd><dt>남은 횟수</dt><dd>${APT.DOWNLOAD_MAX - p.item.downloads - 1}회 (기한 ${fmt.daysLeft(p.order.createdAt, APT.DOWNLOAD_DAYS)}일)</dd></dl>${f === 'dwg' ? '<p class="notice notice-info" style="margin-top:8px">CAD 파일은 교환 포맷 DXF로 제공됩니다. AutoCAD·오토캐드 호환 프로그램에서 열립니다.<span class="dev-note"> 데모 한계: DWG 변환은 서버 작업(F7)</span></p>' : ''}`, { title: '다운로드', foot: `<button class="btn btn-secondary" data-close>취소</button><button class="btn btn-primary" data-go>내려받기</button>` });
      $('[data-go]', m).addEventListener('click', async () => {
        const btn = $('[data-go]', m); btn.classList.add('is-loading');
        const name = `${c.name}_${t.code}`;
        try {
          if (f === 'jpg') { const blob = await svgToJpeg(svg, W, H, 2); save(blob, name + '.jpg'); }
          else if (f === 'pdf') { const blob = await svgToJpeg(svg, W, H, 2); const pdf = await jpegToPdf(blob, W * 2, H * 2); save(pdf, name + '.pdf'); }
          else { save(new Blob([toDXF(g)], { type: 'application/dxf' }), name + '.dxf'); }
          Store.markDownloaded(t.id); m.close(); UI.toast('다운로드를 시작했습니다', { type: 'pos', icon: 'download' }); $('.vw-rail').outerHTML = rail();
        } catch (e) { btn.classList.remove('is-loading'); UI.toast('파일 생성에 실패했습니다 — 다시 시도하세요', { type: 'danger' }); }
      });
    }
    function save(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
    function svgToJpeg(svgText, w, h, scale) { return new Promise((res, rej) => { const img = new Image(); img.onload = () => { const cvs = document.createElement('canvas'); cvs.width = w * scale; cvs.height = h * scale; const ctx = cvs.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cvs.width, cvs.height); ctx.drawImage(img, 0, 0, cvs.width, cvs.height); cvs.toBlob(b => b ? res(b) : rej(new Error('blob')), 'image/jpeg', .92); }; img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText); }); }
    async function jpegToPdf(jpegBlob, w, h) {
      const bytes = new Uint8Array(await jpegBlob.arrayBuffer()); const enc = s => new TextEncoder().encode(s);
      const pw = 841.89, ph = 595.28; // A4 landscape pt
      const sc = Math.min((pw - 60) / w, (ph - 60) / h); const iw = w * sc, ih = h * sc; const ix = (pw - iw) / 2, iy = (ph - ih) / 2;
      const content = `q ${iw.toFixed(2)} 0 0 ${ih.toFixed(2)} ${ix.toFixed(2)} ${iy.toFixed(2)} cm /Im0 Do Q`;
      const objs = []; const parts = [enc('%PDF-1.4\n')]; let len = parts[0].length; const offs = [];
      const push = (u8) => { parts.push(u8); len += u8.length; };
      const add = (s, bin) => { offs.push(len); push(enc(s)); if (bin) { push(bin); push(enc('\nendstream\nendobj\n')); } };
      add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
      add('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
      add(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
      add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`, bytes);
      add(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
      const xref = len; push(enc(`xref\n0 6\n0000000000 65535 f \n${offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`));
      return new Blob(parts, { type: 'application/pdf' });
    }
    function toDXF(geo) {
      const L = []; const line = (x1, y1, x2, y2, layer) => L.push(`0\nLINE\n8\n${layer}\n10\n${(x1 * 1000).toFixed(0)}\n20\n${(-y1 * 1000).toFixed(0)}\n30\n0\n11\n${(x2 * 1000).toFixed(0)}\n21\n${(-y2 * 1000).toFixed(0)}\n31\n0`);
      geo.rooms.forEach(r => { line(r.x, r.y, r.x + r.w, r.y, 'WALL'); line(r.x + r.w, r.y, r.x + r.w, r.y + r.h, 'WALL'); line(r.x + r.w, r.y + r.h, r.x, r.y + r.h, 'WALL'); line(r.x, r.y + r.h, r.x, r.y, 'WALL'); L.push(`0\nTEXT\n8\nTEXT\n10\n${((r.x + r.w / 2) * 1000).toFixed(0)}\n20\n${(-(r.y + r.h / 2) * 1000).toFixed(0)}\n30\n0\n40\n250\n1\n${r.name} ${(r.w * r.h).toFixed(1)}m2`); });
      line(0, geo.H + .6, geo.W, geo.H + .6, 'DIM'); L.push(`0\nTEXT\n8\nDIM\n10\n${(geo.W / 2 * 1000).toFixed(0)}\n20\n${(-(geo.H + .9) * 1000).toFixed(0)}\n30\n0\n40\n250\n1\n${(geo.W * 1000).toFixed(0)}`);
      return `0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n3\n0\nLAYER\n2\nWALL\n70\n0\n62\n7\n6\nCONTINUOUS\n0\nLAYER\n2\nTEXT\n70\n0\n62\n8\n6\nCONTINUOUS\n0\nLAYER\n2\nDIM\n70\n0\n62\n1\n6\nCONTINUOUS\n0\nENDTAB\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${L.join('\n')}\n0\nENDSEC\n0\nEOF\n`;
    }
  }
})();
