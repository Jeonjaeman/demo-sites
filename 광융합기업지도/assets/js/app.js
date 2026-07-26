/* ============================================================
   LUMINA — 지도 탐색 로직 (데모)
   과업지시서 3.1 사용자 페이지 전 항목 구현
   ============================================================ */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const nf = n => n.toLocaleString('ko-KR');
const SEC = Object.fromEntries(SECTORS.map(s => [s.id, s]));

const S = {
  q: '',
  sido: 'all', sector: 'all', size: 'all', band: 'all',
  zoom: 1,              // 1~4
  pan: { x: 0, y: 0 },
  sel: null,
  favOnly: false,
  moved: false,
  bbox: null,           // 재검색 적용된 영역
  rowH: 84,
};

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.35s'; setTimeout(() => el.remove(), 350); }, 3200);
}

/* ============================================================
   필터링 (과업지시서 3.1 ③)
   ============================================================ */
function filtered() {
  return COMPANIES.filter(c => {
    if (S.favOnly && !c.fav) return false;
    if (S.sido !== 'all' && c.sido !== S.sido) return false;
    if (S.sector !== 'all' && c.sector !== S.sector) return false;
    if (S.size !== 'all' && c.size !== S.size) return false;
    if (S.band !== 'all' && c.band !== S.band) return false;
    if (S.q) {
      const q = S.q.toLowerCase();
      if (!(c.name + c.addr + SEC[c.sector].name + c.products).toLowerCase().includes(q)) return false;
    }
    if (S.bbox) {  // '현재 영역 내 재검색'
      const b = S.bbox;
      if (c.x < b.x1 || c.x > b.x2 || c.y < b.y1 || c.y > b.y2) return false;
    }
    return true;
  });
}

/* ============================================================
   클러스터링 (과업지시서 3.1 ① — 줌 레벨에 따라 그룹화)
   ============================================================ */
function clusterize(list) {
  // 줌이 낮을수록 격자가 커져 많이 묶임
  const grid = [14, 9, 5, 0][S.zoom - 1];
  if (grid === 0) return { clusters: [], singles: list };

  const buckets = new Map();
  list.forEach(c => {
    const k = `${Math.floor(c.x / grid)}_${Math.floor(c.y / grid)}`;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(c);
  });

  const clusters = [], singles = [];
  buckets.forEach(items => {
    if (items.length >= 3) {
      clusters.push({
        x: items.reduce((a, c) => a + c.x, 0) / items.length,
        y: items.reduce((a, c) => a + c.y, 0) / items.length,
        n: items.length, items,
      });
    } else singles.push(...items);
  });
  return { clusters, singles };
}

/* ============================================================
   지도 렌더
   ============================================================ */
function renderMap() {
  const list = filtered();
  const { clusters, singles } = clusterize(list);
  const map = $('#map');

  // 지형(정적) 유지하고 마커만 교체
  $$('.mk, .cl', map).forEach(el => el.remove());

  clusters.forEach(cl => {
    const size = cl.n >= 30 ? 58 : cl.n >= 12 ? 48 : 40;
    const el = document.createElement('div');
    el.className = 'cl';
    el.style.cssText = `left:${cl.x}%;top:${cl.y}%;width:${size}px;height:${size}px;font-size:${size >= 58 ? 15 : 13}px`;
    el.innerHTML = `${cl.n}<small>개사</small>`;
    el.onclick = () => { if (S.zoom < 4) { S.zoom++; render(); toast(`🔍 확대 — 클러스터 ${cl.n}개사`); } };
    map.appendChild(el);
  });

  singles.forEach(c => {
    const s = SEC[c.sector];
    const el = document.createElement('div');
    el.className = 'mk' + (S.sel === c.id ? ' on' : '');
    el.style.cssText = `left:${c.x}%;top:${c.y}%`;
    el.innerHTML = `
      <div class="mk-pin">
        <span class="mk-ico" style="background:${s.hex}">${s.ico}</span>
        ${S.zoom >= 3 ? c.name : ''}
      </div>
      <div class="mk-tail" style="background:${S.sel === c.id ? 'var(--brand)' : s.hex}"></div>`;
    el.onclick = () => openDetail(c.id);
    map.appendChild(el);
  });

  // 줌/팬 반영
  map.style.transform = `scale(${1 + (S.zoom - 1) * 0.55}) translate(${S.pan.x}px, ${S.pan.y}px)`;
  $('#zoomLv').textContent = 'Z' + S.zoom;
  $('#zoomIn').disabled = S.zoom >= 4;
  $('#zoomOut').disabled = S.zoom <= 1;
}

/* ============================================================
   리스트 — 가상 스크롤 (비기능 요구사항 4)
   ============================================================ */
function renderList() {
  const list = filtered();
  const wrap = $('#list'), inner = $('#listInner');
  $('#cnt').textContent = nf(list.length);

  if (!list.length) {
    inner.style.height = 'auto';
    inner.innerHTML = `<div class="empty"><span class="ei">🔍</span>조건에 맞는 기업이 없습니다.<br>필터를 넓혀 보세요.</div>`;
    return;
  }

  const isMobile = window.innerWidth <= 860;
  if (isMobile) {   // 모바일은 전체 렌더 (문서 스크롤)
    inner.style.height = 'auto';
    inner.innerHTML = list.map(c => coHTML(c, null)).join('');
    bindRows();
    return;
  }

  inner.style.height = list.length * S.rowH + 'px';
  const top = wrap.scrollTop, vh = wrap.clientHeight;
  const from = Math.max(0, Math.floor(top / S.rowH) - 3);
  const to = Math.min(list.length, Math.ceil((top + vh) / S.rowH) + 3);

  inner.innerHTML = list.slice(from, to)
    .map((c, i) => coHTML(c, (from + i) * S.rowH)).join('');
  bindRows();
  $('#domCnt').textContent = to - from;
}

function coHTML(c, top) {
  const s = SEC[c.sector];
  return `
    <div class="co ${S.sel === c.id ? 'on' : ''}" data-id="${c.id}"
      ${top !== null ? `style="top:${top}px;height:${S.rowH}px"` : ''}>
      <div class="co-top">
        <span class="co-dot" style="background:${s.hex}"></span>
        <span class="co-nm">${c.name}</span>
        <span class="co-fav ${c.fav ? 'on' : ''}" data-fav="${c.id}">${c.fav ? '★' : '☆'}</span>
      </div>
      <div class="co-sub">${s.name} · ${c.sido} ${c.gun}</div>
      <div class="co-tags">
        <span class="tg">${c.size}</span>
        ${c.rev != null
          ? `<span class="tg ${c.finSrc === 'api' ? 'rev' : 'est'}">매출 ${nf(c.rev)}억</span>`
          : `<span class="tg">재무 미보유</span>`}
        ${c.emp != null ? `<span class="tg">${nf(c.emp)}명</span>` : ''}
      </div>
    </div>`;
}

function bindRows() {
  $$('#listInner .co').forEach(el => {
    el.onclick = e => {
      if (e.target.dataset.fav) { toggleFav(e.target.dataset.fav); e.stopPropagation(); return; }
      openDetail(el.dataset.id);
    };
  });
}

function toggleFav(id) {
  const c = COMPANIES.find(x => x.id === id);
  c.fav = !c.fav;
  render();
  toast(c.fav ? `★ <b>${c.name}</b> 즐겨찾기에 추가했습니다` : '즐겨찾기에서 제거했습니다');
}

/* ============================================================
   상세 패널 (과업지시서 3.1 ②)
   ============================================================ */
function openDetail(id) {
  const c = COMPANIES.find(x => x.id === id);
  if (!c) return;
  S.sel = id;
  const s = SEC[c.sector];

  const srcBadge = {
    api: '<span class="src-tag src-api">✓ 금융공공데이터 API 연동</span>',
    xls: '<span class="src-tag src-xls">엑셀 수기 입력</span>',
    none: '<span class="src-tag src-none">재무제표 미공개 기업</span>',
  }[c.finSrc];

  $('#dtBody').innerHTML = `
    <div class="dt-sec">
      <div class="fin-grid">
        <div class="fin"><div class="fl">매출액</div>
          <div class="fv ${c.rev == null ? 'na' : ''}">${c.rev != null ? nf(c.rev) + '억' : '미보유'}</div></div>
        <div class="fin"><div class="fl">영업이익</div>
          <div class="fv ${c.rev == null ? 'na' : ''}">${c.rev != null ? nf(Math.round(c.rev * 0.082)) + '억' : '미보유'}</div></div>
        <div class="fin"><div class="fl">종업원</div>
          <div class="fv ${c.emp == null ? 'na' : ''}">${c.emp != null ? nf(c.emp) + '명' : '미공개'}</div></div>
      </div>
      ${srcBadge}
      ${c.finSrc === 'none' ? `<p style="font-size:11.5px;color:var(--ink-3);margin-top:7px;line-height:1.7">
        비상장·외부감사 비대상 기업은 재무제표가 공개되지 않아 API로 조회되지 않습니다. 관리자에서 엑셀로 입력할 수 있습니다.</p>` : ''}
      ${c.emp == null ? `<p style="font-size:11.5px;color:var(--ink-3);margin-top:5px;line-height:1.7">
        종업원 수는 국민연금 가입 사업장(법인 3인 이상)만 공개됩니다.</p>` : ''}
    </div>

    <div class="dt-sec">
      <h3>기업 기본 정보</h3>
      <div class="dt-row"><span class="k">업종</span><span class="v">${s.ico} ${s.name}</span></div>
      <div class="dt-row"><span class="k">대표자</span><span class="v">${c.ceo}</span></div>
      <div class="dt-row"><span class="k">설립</span><span class="v">${c.founded}년</span></div>
      <div class="dt-row"><span class="k">규모</span><span class="v">${c.size}</span></div>
      <div class="dt-row"><span class="k">주소</span><span class="v">${c.addr}</span></div>
      <div class="dt-row"><span class="k">연락처</span><span class="v mono">${c.tel}</span></div>
    </div>

    <div class="dt-sec">
      <h3>소개 및 주요 제품</h3>
      <p style="font-size:13px;color:var(--ink-2);line-height:1.8">${c.desc}</p>
      <div style="margin-top:9px"><span class="tg" style="background:var(--brand-soft);color:var(--brand-dark)">${c.products}</span></div>
    </div>

    <div class="dt-btns">
      <button class="btn btn-l" onclick="toggleFav('${c.id}')">${c.fav ? '★ 즐겨찾기됨' : '☆ 즐겨찾기'}</button>
      <button class="btn btn-p" onclick="toast('🗺 카카오맵/네이버 지도 길찾기로 연결됩니다 (협의 사항)')">길찾기</button>
    </div>`;

  $('#dtName').textContent = c.name;
  $('#dtSub').textContent = `${s.name} · ${c.sido} ${c.gun}`;
  $('#detail').classList.add('show');

  // 선택 마커로 지도 이동
  S.pan = { x: (50 - c.x) * 3.2, y: (50 - c.y) * 3.2 };
  render();
}
function closeDetail() { S.sel = null; $('#detail').classList.remove('show'); render(); }

/* ============================================================
   필터 UI
   ============================================================ */
function renderFilters() {
  const chips = [];
  const add = (key, label, val) => chips.push(
    `<button class="fchip ${S[key] !== 'all' ? 'on' : ''}" onclick="cycleFilter('${key}')">
       ${S[key] === 'all' ? label : S[key]}${S[key] !== 'all' ? '<span class="x">✕</span>' : ' <span class="cnt">▾</span>'}
     </button>`);
  add('sido', '지역'); add('sector', '산업분류'); add('size', '기업규모'); add('band', '매출구간');
  chips.push(`<button class="fchip ${S.favOnly ? 'on' : ''}" onclick="S.favOnly=!S.favOnly;render()">★ 즐겨찾기</button>`);
  if (S.bbox) chips.push(`<button class="fchip on" onclick="S.bbox=null;render();toast('영역 필터를 해제했습니다')">📍 현재 영역<span class="x">✕</span></button>`);
  $('#filters').innerHTML = chips.join('');
}

const CYCLES = {
  sido: ['all', ...REGIONS.map(r => r.sido)],
  sector: ['all', ...SECTORS.map(s => s.name)],
  size: ['all', ...SIZES],
  band: ['all', ...REV_BANDS],
};
function cycleFilter(key) {
  const arr = CYCLES[key];
  let cur = S[key];
  if (key === 'sector') cur = S.sector === 'all' ? 'all' : SEC[S.sector].name;
  const i = arr.indexOf(cur);
  const next = arr[(i + 1) % arr.length];
  S[key] = key === 'sector' && next !== 'all'
    ? SECTORS.find(s => s.name === next).id
    : next;
  render();
}

/* ============================================================
   지도 조작
   ============================================================ */
function zoom(d) {
  S.zoom = Math.min(4, Math.max(1, S.zoom + d));
  render();
}
function panMap(dx, dy) {
  S.pan.x += dx; S.pan.y += dy;
  S.moved = true;
  $('#research').classList.add('show');
  renderMap();
}
function doResearch() {
  // 현재 보이는 영역을 bbox로 환산 (데모: 줌·팬 기반 근사)
  const z = 1 + (S.zoom - 1) * 0.55;
  const half = 50 / z;
  const cx = 50 - S.pan.x / 3.2, cy = 50 - S.pan.y / 3.2;
  S.bbox = { x1: cx - half, x2: cx + half, y1: cy - half, y2: cy + half };
  S.moved = false;
  $('#research').classList.remove('show');
  render();
  toast(`📍 현재 지도 영역에서 <b>${nf(filtered().length)}개사</b>를 찾았습니다`, 'ok');
}

/* ============================================================
   렌더
   ============================================================ */
function render() {
  renderFilters();
  renderMap();
  renderList();
}

document.addEventListener('DOMContentLoaded', () => {
  // 지형 정적 렌더
  const map = $('#map');
  REGIONS.forEach(r => {
    const d = document.createElement('div');
    d.className = 'geo land';
    d.style.cssText = `left:${r.x - 3}%;top:${r.y - 3}%;width:${r.w + 6}%;height:${r.h + 6}%`;
    map.appendChild(d);
  });
  [['water', 8, 30, 20, 46], ['water', 62, 78, 30, 14]].forEach(([c, x, y, w, h]) => {
    const d = document.createElement('div');
    d.className = 'geo ' + c;
    d.style.cssText = `left:${x}%;top:${y}%;width:${w}%;height:${h}%`;
    map.appendChild(d);
  });
  [[0, 30, 'h'], [0, 58, 'h'], [40, 0, 'v'], [66, 0, 'v']].forEach(([x, y, dir]) => {
    const d = document.createElement('div');
    d.className = 'road ' + dir;
    d.style.cssText = dir === 'h' ? `left:0;top:${y}%;width:100%` : `left:${x}%;top:0;height:100%`;
    map.appendChild(d);
  });
  [[0, 44, 'h'], [0, 70, 'h'], [22, 0, 'v'], [54, 0, 'v'], [82, 0, 'v']].forEach(([x, y, dir]) => {
    const d = document.createElement('div');
    d.className = 'road sm ' + dir;
    d.style.cssText = dir === 'h' ? `left:0;top:${y}%;width:100%` : `left:${x}%;top:0;height:100%`;
    map.appendChild(d);
  });

  // 범례
  $('#legend').innerHTML = `<b>산업 분류 (8대)</b>` +
    SECTORS.map(s => `<div class="legend-row"><i style="background:${s.hex}"></i>${s.name}</div>`).join('');

  // 검색
  $('#q').addEventListener('input', e => { S.q = e.target.value; S.sel = null; render(); });

  // 지도 컨트롤
  $('#zoomIn').onclick = () => zoom(1);
  $('#zoomOut').onclick = () => zoom(-1);
  $('#research').onclick = doResearch;
  $('#dtClose').onclick = closeDetail;

  // 지도 드래그 팬
  const mw = $('#mapWrap');
  let dragging = false, last = null;
  mw.addEventListener('pointerdown', e => {
    if (e.target.closest('.mk,.cl,.map-ctl,.research,.legend,.detail')) return;
    dragging = true; last = { x: e.clientX, y: e.clientY }; mw.setPointerCapture(e.pointerId);
  });
  mw.addEventListener('pointermove', e => {
    if (!dragging) return;
    panMap((e.clientX - last.x) * 0.5, (e.clientY - last.y) * 0.5);
    last = { x: e.clientX, y: e.clientY };
  });
  mw.addEventListener('pointerup', () => { dragging = false; });
  mw.addEventListener('pointercancel', () => { dragging = false; });

  // 가상 스크롤
  $('#list').addEventListener('scroll', () => { if (window.innerWidth > 860) renderList(); });
  window.addEventListener('resize', () => renderList());

  $('#total').textContent = nf(COMPANIES.length);
  render();
});
