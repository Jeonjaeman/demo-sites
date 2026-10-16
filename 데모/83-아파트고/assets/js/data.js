/* 아파트고 리뉴얼 데모 — 데이터 계층
   모든 단지·타입·회원·주문 데이터는 가상입니다. 실존 단지·브랜드·인물과 무관합니다.
   결제·환불·열람 기록은 브라우저(localStorage)에만 저장되며 서버로 전송되지 않습니다. */
(function (global) {
  'use strict';

  /* ── 결정적 난수 (새로고침해도 같은 데이터) ── */
  function rng(seed) {
    let s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  /* ── 가격 (VAT 포함 총액 — 첫 노출부터 총액 표시 · 전자상거래법 다크패턴 규정) ── */
  const FORMATS = {
    jpg: { code: 'jpg', label: 'JPG 이미지', desc: '고해상 래스터 · 치수선 포함 · 4000px', price: 5500, ext: '.jpg', size: '2.4MB' },
    pdf: { code: 'pdf', label: 'PDF 도면', desc: '인쇄용 벡터 PDF · A3 축척 1:100', price: 7700, ext: '.pdf', size: '1.1MB' },
    dwg: { code: 'dwg', label: 'DWG (CAD)', desc: '편집 가능한 CAD 원본 · 레이어 분리', price: 16500, ext: '.dwg', size: '860KB' }
  };
  const VAT_RATE = 0.1;
  const BUNDLE_MIN = 3;      // 같은 단지 3개 타입 이상 담으면
  const BUNDLE_RATE = 0.10;  // 10% 묶음 할인
  const DOWNLOAD_DAYS = 90;  // 다운로드 기한(가정 — 미팅 확인 항목)
  const DOWNLOAD_MAX = 5;    // 다운로드 횟수(가정)

  /* ── 단지 (가상) ── */
  const COMPLEXES = [
    { id: 'c01', name: '서강 리버파크', region: '서울', gu: '마포구', addr: '서울특별시 마포구 신수동 112-3', built: 2016, households: 1240, dongs: 12, floors: '15~29', builder: '한결건설', lat: 37.547, lng: 126.933, heat: 0.0, updated: '2026.10.14' },
    { id: 'c02', name: '하늘채 센트럴 1차', region: '경기', gu: '성남시 분당구', addr: '경기도 성남시 분당구 정자동 25', built: 2004, households: 860, dongs: 8, floors: '12~25', builder: '하늘건설', lat: 37.366, lng: 127.108, heat: 0.3, updated: '2026.10.02' },
    { id: 'c03', name: '하늘채 센트럴 2차', region: '경기', gu: '성남시 분당구', addr: '경기도 성남시 분당구 정자동 41', built: 2006, households: 640, dongs: 6, floors: '15~22', builder: '하늘건설', lat: 37.362, lng: 127.112, heat: 0.4, updated: '2026.09.21' },
    { id: 'c04', name: '광교 호수마을 에듀타운', region: '경기', gu: '수원시 영통구', addr: '경기도 수원시 영통구 이의동 1332', built: 2012, households: 1580, dongs: 14, floors: '20~33', builder: '호수개발', lat: 37.288, lng: 127.065, heat: 0.6, updated: '2026.10.11' },
    { id: 'c05', name: '송도 더블유파크', region: '인천', gu: '연수구', addr: '인천광역시 연수구 송도동 30-1', built: 2020, households: 2100, dongs: 16, floors: '29~45', builder: '더블유건설', lat: 37.392, lng: 126.639, heat: 0.8, updated: '2026.10.16' },
    { id: 'c06', name: '둔산 그린빌', region: '대전', gu: '서구', addr: '대전광역시 서구 둔산동 1460', built: 1996, households: 1320, dongs: 11, floors: '15~20', builder: '그린종합건설', lat: 36.352, lng: 127.385, heat: 0.2, updated: '2026.08.30' },
    { id: 'c07', name: '해운대 마린타워', region: '부산', gu: '해운대구', addr: '부산광역시 해운대구 우동 1500', built: 2019, households: 980, dongs: 5, floors: '38~52', builder: '마린건설', lat: 35.161, lng: 129.163, heat: 0.7, updated: '2026.10.09' },
    { id: 'c08', name: '가경 솔마루', region: '충북', gu: '청주시 흥덕구', addr: '충청북도 청주시 흥덕구 가경동 1460', built: 2009, households: 720, dongs: 7, floors: '15~20', builder: '솔마루건설', lat: 36.628, lng: 127.431, heat: 0.1, updated: '2026.07.18' },
    { id: 'c09', name: '목동 파크사이드', region: '서울', gu: '양천구', addr: '서울특별시 양천구 목동 917', built: 1988, households: 1880, dongs: 15, floors: '12~15', builder: '파크종합건설', lat: 37.527, lng: 126.868, heat: 0.5, updated: '2026.09.05' },
    { id: 'c10', name: '세종 한울마을 3단지', region: '세종', gu: '세종시', addr: '세종특별자치시 한솔동 1110', built: 2014, households: 1150, dongs: 10, floors: '18~29', builder: '한울건설', lat: 36.479, lng: 127.258, heat: 0.4, updated: '2026.09.28' },
    { id: 'c11', name: '대구 수성 레이크뷰', region: '대구', gu: '수성구', addr: '대구광역시 수성구 두산동 520', built: 2017, households: 540, dongs: 4, floors: '25~34', builder: '레이크건설', lat: 35.830, lng: 128.620, heat: 0.3, updated: '2026.10.01' },
    { id: 'c12', name: '김해 장유 에코힐', region: '경남', gu: '김해시', addr: '경상남도 김해시 장유동 1150', built: 2011, households: 890, dongs: 9, floors: '15~25', builder: '에코건설', lat: 35.195, lng: 128.808, heat: 0.1, updated: '2026.06.12' }
  ];

  /* 극단값(F4): 전국 최장 단지명은 실제로 25자. 가상 25자 이름 + 동명이 단지 + 84개동 + 타입 18개 */
  const STRESS_COMPLEX = [
    { id: 'c90', name: '충청내륙행정복합도시한울마루더클래식로얄카운티 1차', region: '충남', gu: '내포신도시', addr: '충청남도 홍성군 홍북읍 신경리 1250', built: 2021, households: 9510, dongs: 84, floors: '25~35', builder: '한울마루컨소시엄', lat: 36.66, lng: 126.67, heat: 0.9, updated: '2026.10.15' },
    { id: 'c91', name: '충청내륙행정복합도시한울마루더클래식로얄카운티 2차', region: '충남', gu: '내포신도시', addr: '충청남도 홍성군 홍북읍 신경리 1312', built: 2023, households: 4120, dongs: 38, floors: '25~35', builder: '한울마루컨소시엄', lat: 36.655, lng: 126.68, heat: 0.9, updated: '2026.10.15' }
  ];

  /* ── 타입 정의 ── 전용면적(㎡) 기준 타입명 (계량법: ㎡ 기본, 평은 참고 표기) */
  const TYPE_TEMPLATES = {
    c01: [['59A', 59.96, 2, 1], ['59B', 59.98, 3, 1], ['74', 74.92, 3, 2], ['84A', 84.97, 3, 2], ['84B', 84.99, 3, 2], ['101', 101.95, 4, 2]],
    c02: [['84A', 84.98, 3, 2], ['84B', 84.87, 3, 2], ['114', 114.72, 4, 2], ['134', 134.50, 4, 2]],
    c03: [['84A', 84.96, 3, 2], ['114', 114.88, 4, 2], ['134', 134.12, 4, 2], ['164', 164.30, 5, 3]],
    c04: [['59', 59.94, 3, 1], ['74', 74.95, 3, 2], ['84A', 84.96, 3, 2], ['84B', 84.94, 3, 2], ['99', 99.89, 4, 2]],
    c05: [['39', 39.84, 1, 1], ['49', 49.80, 2, 1], ['59A', 59.97, 2, 1], ['59B', 59.95, 3, 1], ['84A', 84.98, 3, 2], ['84B', 84.96, 3, 2], ['101', 101.76, 4, 2], ['120', 120.44, 4, 2], ['150', 150.21, 5, 3]],
    c06: [['59', 59.90, 3, 1], ['84', 84.90, 3, 2], ['101', 101.90, 4, 2]],
    c07: [['84', 84.99, 3, 2], ['114', 114.95, 4, 2], ['150', 150.80, 4, 3], ['198', 198.60, 5, 3]],
    c08: [['59', 59.93, 3, 1], ['84A', 84.91, 3, 2], ['84B', 84.93, 3, 2]],
    c09: [['51', 51.48, 2, 1], ['65', 65.10, 3, 1], ['89', 89.70, 3, 2], ['116', 116.30, 4, 2]],
    c10: [['59', 59.99, 3, 1], ['74', 74.98, 3, 2], ['84', 84.99, 3, 2]],
    c11: [['84', 84.95, 3, 2], ['101', 101.90, 4, 2], ['124', 124.70, 4, 2]],
    c12: [['59', 59.94, 3, 1], ['74', 74.91, 3, 2], ['84', 84.92, 3, 2]]
  };
  // 극단값 단지: 타입 18개
  TYPE_TEMPLATES.c90 = [['39', 39.90, 1, 1], ['46', 46.80, 2, 1], ['49A', 49.90, 2, 1], ['49B', 49.95, 2, 1], ['59A', 59.96, 3, 1], ['59B', 59.98, 3, 1], ['59C', 59.91, 3, 1], ['74A', 74.92, 3, 2], ['74B', 74.97, 3, 2], ['84A', 84.97, 3, 2], ['84B', 84.99, 3, 2], ['84C', 84.91, 3, 2], ['84D', 84.95, 3, 2], ['99', 99.90, 4, 2], ['110', 110.40, 4, 2], ['120', 120.44, 4, 2], ['135', 135.60, 4, 3], ['150', 150.21, 5, 3]];
  TYPE_TEMPLATES.c91 = [['59A', 59.96, 3, 1], ['59B', 59.98, 3, 1], ['74', 74.92, 3, 2], ['84A', 84.97, 3, 2], ['84B', 84.99, 3, 2], ['99', 99.90, 4, 2]];

  const SOURCE_KINDS = { redraw: '자체 재작도', builder: '건설사 제공·허락', other: '기타(출처 확인 필요)' };
  const BASIS = { sale: '분양 도면 기준', survey: '실측 기준' };

  function buildTypes(complexes) {
    const out = [];
    complexes.forEach((c, ci) => {
      const r = rng(1000 + ci * 7);
      (TYPE_TEMPLATES[c.id] || []).forEach((t, ti) => {
        const [code, ex, rooms, baths] = t;
        const supply = +(ex * (1.28 + r() * 0.08)).toFixed(2);
        const contract = +(supply * (1.35 + r() * 0.1)).toFixed(2);
        const formats = ti % 7 === 5 ? ['jpg', 'pdf'] : ['jpg', 'pdf', 'dwg']; // 일부 타입은 DWG 없음
        const sourceKind = r() < 0.7 ? 'redraw' : (r() < 0.8 ? 'builder' : 'other');
        const status = (ti % 11 === 9) ? 'hidden' : 'public';
        out.push({
          id: `${c.id}-${code}`, complexId: c.id, code, exclusive: ex, supply, contract, rooms, baths,
          households: Math.round(c.households / (TYPE_TEMPLATES[c.id].length) * (0.6 + r() * 0.8)),
          formats, status,
          meta: { basis: r() < 0.8 ? 'sale' : 'survey', expansion: r() < 0.4, updated: c.updated, version: 'v' + (1 + Math.floor(r() * 3)) },
          source: { kind: sourceKind, evidence: sourceKind === 'other' ? null : (sourceKind === 'builder' ? '허락서_' + c.id + '.pdf' : '재작도 작업기록 #' + (120 + ti)) },
          seed: 5000 + ci * 31 + ti * 7
        });
      });
    });
    return out;
  }

  /* ── 도면 SVG 생성기 ──
     rooms/baths/면적을 받아 결정적인 평면도 SVG를 만든다.
     mode: 'full'(구매자 원본) | 'preview'(저해상·워터마크·치수 마스킹) | 'thumb'(카드용)
     opts.watermark: 다이내믹 워터마크 문자열(구매자 ID·주문번호·시각) */
  function planGeometry(type) {
    const r = rng(type.seed);
    const area = type.exclusive;
    const variant = type.seed % 4;           // 0 판상형(거실 우) · 1 판상형(거실 좌, 미러) · 2 타워형(발코니 하단) · 3 코너형(거실 하단 넓게)
    const W = Math.round(Math.sqrt(area * (variant === 3 ? 1.25 : 1.45)) * 100) / 100;
    const H = Math.round((area / W) * 100) / 100;
    const rooms = [];
    const livingW = W * (0.46 + r() * 0.06);
    const bedW = W - livingW;
    const balH = H * 0.09;
    const bodyH = H - balH;
    const balTop = variant !== 2;
    const by = balTop ? balH : 0;            // 본체 시작 y
    rooms.push({ k: 'balcony', name: '발코니', x: 0, y: balTop ? 0 : bodyH, w: W, h: balH, ext: true });
    const lx = variant === 1 ? 0 : bedW;    // 거실 블록 x
    const bx = variant === 1 ? livingW : 0; // 침실 블록 x
    if (variant === 3) {
      rooms.push({ k: 'living', name: '거실', x: 0, y: by + bodyH * 0.5, w: W * 0.62, h: bodyH * 0.5 });
      rooms.push({ k: 'kitchen', name: '주방·식당', x: W * 0.62, y: by + bodyH * 0.5, w: W * 0.38, h: bodyH * 0.3 });
      rooms.push({ k: 'entry', name: '현관', x: W * 0.62, y: by + bodyH * 0.8, w: W * 0.2, h: bodyH * 0.2 });
      rooms.push({ k: 'util', name: '다용도실', x: W * 0.82, y: by + bodyH * 0.8, w: W * 0.18, h: bodyH * 0.2 });
      rooms.push({ k: 'bath1', name: '욕실 1', x: W * 0.62, y: by + bodyH * 0.3, w: W * 0.18, h: bodyH * 0.2 });
      rooms.push({ k: 'bed1', name: '안방', x: W * 0.62, y: by, w: W * 0.38, h: bodyH * 0.3 });
      if (type.baths >= 2) rooms.push({ k: 'bath2', name: '욕실 2', x: W * 0.8, y: by + bodyH * 0.3, w: W * 0.2, h: bodyH * 0.2 });
      const n = type.rooms - 1; const each = W * 0.62 / Math.max(1, n);
      for (let i = 0; i < n; i++) rooms.push({ k: 'bed' + (i + 2), name: '침실 ' + (i + 2), x: i * each, y: by, w: each, h: bodyH * 0.5 });
      return { W, H, rooms, variant };
    }
    rooms.push({ k: 'living', name: '거실', x: lx, y: by, w: livingW, h: bodyH * 0.52 });
    rooms.push({ k: 'kitchen', name: '주방·식당', x: lx, y: by + bodyH * 0.52, w: livingW * 0.62, h: bodyH * 0.30 });
    rooms.push({ k: 'entry', name: '현관', x: lx + livingW * 0.62, y: by + bodyH * 0.72, w: livingW * 0.38, h: bodyH * 0.28 });
    rooms.push({ k: 'util', name: '다용도실', x: lx, y: by + bodyH * 0.82, w: livingW * 0.62, h: bodyH * 0.18 });
    rooms.push({ k: 'bath1', name: '욕실 1', x: lx + livingW * 0.62, y: by + bodyH * 0.52, w: livingW * 0.38, h: bodyH * 0.20 });
    const n = type.rooms;
    const masterH = bodyH * (n <= 2 ? 0.5 : 0.42);
    const mw = type.baths >= 2 ? 0.68 : 1;
    rooms.push({ k: 'bed1', name: '안방', x: bx + (variant === 1 && type.baths >= 2 ? bedW * 0.32 : 0), y: by, w: bedW * mw, h: masterH });
    if (type.baths >= 2) { const sx = bx + (variant === 1 ? 0 : bedW * 0.68); rooms.push({ k: 'bath2', name: '욕실 2', x: sx, y: by, w: bedW * 0.32, h: masterH * 0.55 }); rooms.push({ k: 'dress', name: '드레스룸', x: sx, y: by + masterH * 0.55, w: bedW * 0.32, h: masterH * 0.45 }); }
    const rest = bodyH - masterH;
    const others = n - 1;
    if (others >= 1) {
      const rows = Math.max(1, Math.ceil(others / 2)); const each = rest / rows;
      for (let i = 0; i < others; i++) {
        const col = i % 2, row = Math.floor(i / 2);
        const last = i === others - 1 && others % 2 === 1; // 홀수면 마지막 침실을 전폭으로
        const w = others === 1 || last ? bedW : bedW / 2;
        rooms.push({ k: 'bed' + (i + 2), name: '침실 ' + (i + 2), x: bx + (last ? 0 : col * (bedW / 2)), y: by + masterH + row * each, w, h: each });
      }
      if (type.baths >= 3) { const b3 = rooms.find(x => x.k === 'bed' + (others + 1)); if (b3) { b3.w -= bedW * 0.3; if (variant === 1) b3.x += bedW * 0.3; rooms.push({ k: 'bath3', name: '욕실 3', x: variant === 1 ? bx : bx + bedW * 0.7, y: b3.y, w: bedW * 0.3, h: b3.h }); } }
    }
    return { W, H, rooms, variant };
  }

  function planSVG(type, mode, opts) {
    opts = opts || {};
    const g = planGeometry(type);
    const S = 60; // px per m (viewBox)
    const pad = 56;
    const vw = Math.round(g.W * S + pad * 2), vh = Math.round(g.H * S + pad * 2);
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const isPreview = mode === 'preview';
    const isThumb = mode === 'thumb';
    const ink = opts.ink || '#1b2430';
    const wall = opts.wall || '#2a3442';
    const fillMap = { balcony: '#eef2f6', living: '#faf7f1', kitchen: '#f3efe6', entry: '#edf0f3', util: '#eef1f3', bath1: '#e6eef6', bath2: '#e6eef6', bath3: '#e6eef6', dress: '#f1eef8' };
    const P = (x, y) => [pad + x * S, pad + y * S];
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" ${isThumb ? 'preserveAspectRatio="xMidYMid meet"' : `width="${vw}" height="${vh}"`} role="img" aria-label="${esc(type.code)} 타입 평면도 — 방 ${type.rooms}, 욕실 ${type.baths}, 전용 ${type.exclusive}㎡">`;
    s += isThumb ? '' : `<rect width="${vw}" height="${vh}" fill="#ffffff"/>`;
    if (!isThumb && !isPreview) {
      s += `<g stroke="#eef1f4" stroke-width="1">`;
      for (let x = pad; x <= vw - pad; x += S) s += `<line x1="${x}" y1="${pad}" x2="${x}" y2="${vh - pad}"/>`;
      for (let y = pad; y <= vh - pad; y += S) s += `<line x1="${pad}" y1="${y}" x2="${vw - pad}" y2="${y}"/>`;
      s += `</g>`;
    }
    const inner = isThumb ? 2.5 : 4, outer = isThumb ? 4 : 9;
    s += `<g id="rooms">`;
    g.rooms.forEach(rm => {
      const [x, y] = P(rm.x, rm.y), w = rm.w * S, h = rm.h * S;
      const area = (rm.w * rm.h).toFixed(1);
      s += `<g class="room" data-k="${rm.k}" data-name="${esc(rm.name)}" data-area="${area}">`;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fillMap[rm.k] || '#fbfaf7'}" stroke="${wall}" stroke-width="${inner}" stroke-linejoin="miter"/>`;
      if (!isThumb) {
        const fs = Math.max(11, Math.min(16, w / 7));
        s += `<text x="${x + w / 2}" y="${y + h / 2 - 2}" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="${fs}" font-weight="600" fill="${ink}">${esc(rm.name)}</text>`;
        if (!isPreview) s += `<text x="${x + w / 2}" y="${y + h / 2 + fs}" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="${fs * 0.8}" fill="#6b7684">${area}㎡</text>`;
        else s += `<rect x="${x + w / 2 - 22}" y="${y + h / 2 + 4}" width="44" height="10" rx="2" fill="#cfd5dc"/>`;
      }
      s += `</g>`;
    });
    s += `</g>`;
    // 문 호 (방마다 거실 쪽 벽에) · 창 (외벽 접한 방)
    const ox = pad, oy = pad, ow = g.W * S, oh = g.H * S;
    const living = g.rooms.find(r => r.k === 'living');
    const eps = 0.02;
    s += `<g class="doors" fill="none" stroke="${ink}" stroke-width="${isThumb ? 1 : 1.5}">`;
    g.rooms.forEach(rm => {
      if (['balcony', 'living', 'kitchen', 'util'].includes(rm.k) || !living) return;
      const dr = Math.min(0.8, rm.w * 0.45, rm.h * 0.45) * S; if (dr < 10) return;
      // 거실과 접한 변 찾기
      if (Math.abs(rm.x + rm.w - living.x) < eps && rm.y < living.y + living.h && rm.y + rm.h > living.y) { const [x, y] = P(rm.x + rm.w, Math.max(rm.y, living.y) + 0.25); s += `<path d="M ${x} ${y} A ${dr} ${dr} 0 0 0 ${x - dr} ${y + dr}"/><line x1="${x - 3}" y1="${y}" x2="${x - 3}" y2="${y + dr}" stroke="#fff" stroke-width="${inner + 2}"/>`; }
      else if (Math.abs(rm.x - (living.x + living.w)) < eps && rm.y < living.y + living.h && rm.y + rm.h > living.y) { const [x, y] = P(rm.x, Math.max(rm.y, living.y) + 0.25); s += `<path d="M ${x} ${y} A ${dr} ${dr} 0 0 1 ${x + dr} ${y + dr}"/><line x1="${x + 3}" y1="${y}" x2="${x + 3}" y2="${y + dr}" stroke="#fff" stroke-width="${inner + 2}"/>`; }
      else if (Math.abs(rm.y + rm.h - living.y) < eps && rm.x < living.x + living.w && rm.x + rm.w > living.x) { const [x, y] = P(Math.max(rm.x, living.x) + 0.25, rm.y + rm.h); s += `<path d="M ${x} ${y} A ${dr} ${dr} 0 0 1 ${x + dr} ${y - dr}"/><line x1="${x}" y1="${y - 3}" x2="${x + dr}" y2="${y - 3}" stroke="#fff" stroke-width="${inner + 2}"/>`; }
      else if (Math.abs(rm.y - (living.y + living.h)) < eps && rm.x < living.x + living.w && rm.x + rm.w > living.x) { const [x, y] = P(Math.max(rm.x, living.x) + 0.25, rm.y); s += `<path d="M ${x} ${y} A ${dr} ${dr} 0 0 0 ${x + dr} ${y + dr}"/><line x1="${x}" y1="${y + 3}" x2="${x + dr}" y2="${y + 3}" stroke="#fff" stroke-width="${inner + 2}"/>`; }
    });
    s += `</g>`;
    // 창: 외벽에 접한 방(욕실·현관·다용도실 제외) — 이중선
    s += `<g class="windows" stroke="#5b7fb5" stroke-width="${isThumb ? 1.5 : 2}">`;
    g.rooms.forEach(rm => {
      if (['bath1', 'bath2', 'bath3', 'entry', 'util', 'dress', 'balcony'].includes(rm.k)) return;
      const segs = [];
      if (rm.y < eps) segs.push([rm.x + rm.w * 0.25, rm.y, rm.x + rm.w * 0.75, rm.y]);
      if (Math.abs(rm.y + rm.h - g.H) < eps) segs.push([rm.x + rm.w * 0.25, rm.y + rm.h, rm.x + rm.w * 0.75, rm.y + rm.h]);
      if (rm.x < eps) segs.push([rm.x, rm.y + rm.h * 0.25, rm.x, rm.y + rm.h * 0.75]);
      if (Math.abs(rm.x + rm.w - g.W) < eps) segs.push([rm.x + rm.w, rm.y + rm.h * 0.25, rm.x + rm.w, rm.y + rm.h * 0.75]);
      segs.forEach(([x1, y1, x2, y2]) => { const [a, b] = P(x1, y1), [c, d] = P(x2, y2); const vert = x1 === x2; s += `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#fff" stroke-width="${outer + 1}"/><line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/><line x1="${a + (vert ? 3 : 0)}" y1="${b + (vert ? 0 : 3)}" x2="${c + (vert ? 3 : 0)}" y2="${d + (vert ? 0 : 3)}"/>`; });
    });
    s += `</g>`;
    s += `<rect x="${ox}" y="${oy}" width="${ow}" height="${oh}" fill="none" stroke="${wall}" stroke-width="${outer}"/>`;
    if (!isThumb) {
      const dimY = oy + oh + 26, dimX = ox - 26;
      s += `<g stroke="${ink}" stroke-width="1" fill="${ink}" font-family="Pretendard, sans-serif" font-size="11">`;
      s += `<line x1="${ox}" y1="${dimY}" x2="${ox + ow}" y2="${dimY}"/><line x1="${ox}" y1="${dimY - 5}" x2="${ox}" y2="${dimY + 5}"/><line x1="${ox + ow}" y1="${dimY - 5}" x2="${ox + ow}" y2="${dimY + 5}"/>`;
      s += `<line x1="${dimX}" y1="${oy}" x2="${dimX}" y2="${oy + oh}"/><line x1="${dimX - 5}" y1="${oy}" x2="${dimX + 5}" y2="${oy}"/><line x1="${dimX - 5}" y1="${oy + oh}" x2="${dimX + 5}" y2="${oy + oh}"/>`;
      if (isPreview) {
        s += `<rect x="${ox + ow / 2 - 26}" y="${dimY + 4}" width="52" height="11" rx="2" fill="#cfd5dc" stroke="none"/>`;
        s += `<rect x="${dimX - 16}" y="${oy + oh / 2 - 26}" width="11" height="52" rx="2" fill="#cfd5dc" stroke="none"/>`;
      } else {
        s += `<text x="${ox + ow / 2}" y="${dimY + 15}" text-anchor="middle" stroke="none">${(g.W * 1000).toFixed(0)}</text>`;
        s += `<text transform="translate(${dimX - 8} ${oy + oh / 2}) rotate(-90)" text-anchor="middle" stroke="none">${(g.H * 1000).toFixed(0)}</text>`;
        // 스케일 바 · 방위
        s += `<g transform="translate(${ox} ${oy - 22})"><line x1="0" y1="0" x2="${S * 2}" y2="0" stroke-width="3"/><line x1="0" y1="-4" x2="0" y2="4"/><line x1="${S}" y1="-4" x2="${S}" y2="4"/><line x1="${S * 2}" y1="-4" x2="${S * 2}" y2="4"/><text x="${S * 2 + 8}" y="4" stroke="none" font-size="10">0 · 1 · 2 m</text></g>`;
        s += `<g transform="translate(${ox + ow - 14} ${oy - 24})" stroke="none"><path d="M0 -10 L5 4 L0 1 L-5 4 Z" fill="${ink}"/><text x="0" y="16" text-anchor="middle" font-size="9">N</text></g>`;
      }
      s += `</g>`;
    }
    // 현관 외부 문
    const entry = g.rooms.find(r => r.k === 'entry');
    if (entry && !isThumb) {
      const onRight = Math.abs(entry.x + entry.w - g.W) < eps; const [ex, ey] = P(onRight ? entry.x + entry.w : entry.x, entry.y + entry.h * 0.5);
      s += onRight ? `<path d="M ${ex} ${ey - 24} A 24 24 0 0 1 ${ex - 24} ${ey}" fill="none" stroke="${ink}" stroke-width="1.5"/>` : `<path d="M ${ex} ${ey - 24} A 24 24 0 0 0 ${ex + 24} ${ey}" fill="none" stroke="${ink}" stroke-width="1.5"/>`;
    }
    if (isPreview) {
      s += `<defs><pattern id="wm${type.seed}" width="180" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)"><text x="0" y="60" font-family="Pretendard, sans-serif" font-size="18" font-weight="700" fill="rgba(27,36,48,.10)">미리보기 · 구매 전 확인용</text></pattern></defs>`;
      s += `<rect width="${vw}" height="${vh}" fill="url(#wm${type.seed})"/>`;
    } else if (opts.watermark) {
      s += `<defs><pattern id="wm${type.seed}" width="260" height="140" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)"><text x="0" y="70" font-family="Pretendard, sans-serif" font-size="13" font-weight="600" fill="rgba(27,36,48,.09)">${esc(opts.watermark)}</text></pattern></defs>`;
      s += `<rect width="${vw}" height="${vh}" fill="url(#wm${type.seed})" pointer-events="none"/>`;
    }
    s += `</svg>`;
    return s;
  }

  /* ── 회원 (가상) ── */
  const FIRST = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'];
  const LAST = ['지우', '서연', '민준', '하은', '도윤', '수아', '예준', '지호', '하린', '시우', '지민', '유진', '현우', '다은', '승현'];
  const COMPANIES = ['온리빙 인테리어', '라움 디자인', '집다움 리모델링', '모노 하우징', '행복공인중개사사무소', '세움 건축사사무소', '프레임 인테리어', '더홈 공인중개사', '리디자인랩', '나무결 인테리어'];
  function buildMembers() {
    const r = rng(777);
    const out = [];
    for (let i = 0; i < 42; i++) {
      const biz = r() < 0.6;
      const name = FIRST[Math.floor(r() * FIRST.length)] + LAST[Math.floor(r() * LAST.length)];
      const d = new Date(2026, 9, 17 - Math.floor(r() * 400));
      out.push({
        id: 'm' + String(1001 + i), name, biz,
        company: biz ? COMPANIES[Math.floor(r() * COMPANIES.length)] : null,
        bizNo: biz ? `${100 + Math.floor(r() * 900)}-${10 + Math.floor(r() * 90)}-${10000 + Math.floor(r() * 90000)}` : null,
        bizVerified: biz ? (r() < 0.8 ? 'verified' : 'pending') : null,
        email: `user${1001 + i}@example.com`, phone: `010-${1000 + Math.floor(r() * 9000)}-${1000 + Math.floor(r() * 9000)}`,
        joined: d.toISOString().slice(0, 10).replace(/-/g, '.'),
        orders: Math.floor(r() * 12), downloads: Math.floor(r() * 40), ips: 1 + Math.floor(r() * (r() < 0.1 ? 9 : 2)),
        status: r() < 0.05 ? 'suspended' : 'active', marketing: r() < 0.3
      });
    }
    return out;
  }

  /* ── 관리자용 샘플 주문 (가상) ── */
  function buildAdminOrders(types, members) {
    const r = rng(4242);
    const out = [];
    const statuses = ['paid', 'paid', 'paid', 'pending', 'refunded_part', 'refunded', 'paid'];
    for (let i = 0; i < 36; i++) {
      const m = members[Math.floor(r() * members.length)];
      const n = 1 + Math.floor(r() * 4);
      const items = [];
      const base = Math.floor(r() * types.length);
      for (let k = 0; k < n; k++) {
        const t = types[(base + k) % types.length];
        const f = t.formats[Math.floor(r() * t.formats.length)];
        const viewed = r() < 0.6;
        items.push({ typeId: t.id, format: f, price: FORMATS[f].price, viewedAt: viewed ? ts(r, i) : null, downloads: viewed ? Math.floor(r() * 3) : 0 });
      }
      const status = statuses[Math.floor(r() * statuses.length)];
      const created = new Date(2026, 9, 17 - Math.floor(r() * 45), Math.floor(r() * 24), Math.floor(r() * 60));
      out.push({
        id: 'O' + created.toISOString().slice(2, 10).replace(/-/g, '') + '-' + String(100 + i),
        memberId: m.id, items, status, method: ['card', 'card', 'vbank', 'easy'][Math.floor(r() * 4)],
        receipt: m.biz ? 'tax' : (r() < 0.5 ? 'cash' : 'card'),
        consentAt: created.toISOString(), consentIp: `211.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}`,
        createdAt: created.toISOString()
      });
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  function ts(r, i) { const d = new Date(2026, 9, 17 - Math.floor(r() * 30), 9 + Math.floor(r() * 10), Math.floor(r() * 60)); return d.toISOString(); }

  /* ── 계산 ── */
  const calc = {
    pyeong(m2) { return +(m2 * 0.3025).toFixed(1); },
    won(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; },
    supplyOf(total) { return Math.round(total / (1 + VAT_RATE)); },
    vatOf(total) { return total - Math.round(total / (1 + VAT_RATE)); },
    /* 장바구니 합계: 단지별 그룹 · 같은 단지 3개 타입↑ 묶음 10% */
    cartTotal(items, types) {
      const byComplex = {};
      items.forEach(it => { const t = types.find(x => x.id === it.typeId); if (!t) return; (byComplex[t.complexId] = byComplex[t.complexId] || []).push({ ...it, t }); });
      let subtotal = 0, discount = 0;
      const groups = Object.keys(byComplex).map(cid => {
        const list = byComplex[cid];
        const sum = list.reduce((a, b) => a + FORMATS[b.format].price, 0);
        const distinctTypes = new Set(list.map(x => x.typeId)).size;
        const bundle = distinctTypes >= BUNDLE_MIN;
        const disc = bundle ? Math.round(sum * BUNDLE_RATE) : 0;
        subtotal += sum; discount += disc;
        return { complexId: cid, items: list, sum, bundle, disc, distinctTypes };
      });
      const total = subtotal - discount;
      return { groups, subtotal, discount, total, supply: this.supplyOf(total), vat: this.vatOf(total) };
    },
    /* 환불 가능액: 미열람 도면만 (전자상거래법 17조 2항 5호 단서 — 가분적 디지털콘텐츠) */
    refundable(order) {
      const items = order.items.filter(it => !it.viewedAt);
      return { items, amount: items.reduce((a, b) => a + b.price, 0) };
    },
    /* WCAG 명도 대비 */
    luminance(hex) {
      const c = hex.replace('#', ''); const n = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
      const [r, g, b] = [0, 2, 4].map(i => parseInt(n.substr(i, 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    },
    contrast(a, b) { const l1 = this.luminance(a), l2 = this.luminance(b); return +((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2); },
    /* 범위 계산기 공수(일): 화면당 기준 공수 × 반응형 계수 */
    scope(selected, mode, statesMode) {
      const perScreen = { C: 0.55, A: 0.5, S: 0.3, G: 0.8 };
      const respFactor = { pc: 1, core: 1.35, all: 1.8 };
      let frames = 0, days = 0;
      selected.forEach(id => {
        const k = id[0];
        const mobile = mode === 'all' ? (k === 'C' ? 1 : 0) : (mode === 'core' && k === 'C' && ['C-01', 'C-02', 'C-07', 'C-09', 'C-10', 'C-12', 'C-14', 'C-15', 'C-16', 'C-20'].includes(id) ? 1 : 0);
        frames += 1 + mobile;
        days += perScreen[k] * (1 + mobile * 0.6);
      });
      if (statesMode === 'each') { const c = selected.filter(i => i[0] === 'C').length; frames += c * 2; days += c * 0.25; }
      else { days += 2; frames += 6; }
      return { frames, days: Math.round(days * 10) / 10, factor: respFactor[mode] };
    }
  };

  const base = { complexes: COMPLEXES, stress: STRESS_COMPLEX };
  const types = buildTypes(COMPLEXES.concat(STRESS_COMPLEX));
  const members = buildMembers();
  const adminOrders = buildAdminOrders(types.filter(t => !t.complexId.startsWith('c9')), members);

  global.APT = {
    FORMATS, VAT_RATE, BUNDLE_MIN, BUNDLE_RATE, DOWNLOAD_DAYS, DOWNLOAD_MAX, SOURCE_KINDS, BASIS,
    complexes: COMPLEXES, stressComplexes: STRESS_COMPLEX, types, members, adminOrders,
    planSVG, planGeometry, calc, rng,
    complex(id) { return COMPLEXES.concat(STRESS_COMPLEX).find(c => c.id === id); },
    type(id) { return types.find(t => t.id === id); },
    typesOf(cid) { return types.filter(t => t.complexId === cid); },
    allComplexes(stress) { return stress ? COMPLEXES.concat(STRESS_COMPLEX) : COMPLEXES; }
  };
})(window);
