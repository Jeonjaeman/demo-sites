/* ATHLEDGER — 3D 바디 렌더러 (외부 라이브러리 없음 · canvas 2D 래스터라이즈)
   절차적 인체 메시(회전체 세그먼트 14개 · 약 3,600 삼각형)를 화가 알고리즘으로 그린다.
   · 영역(region)별 히트값 → 색 보간          · 절단 부위(side·level) → 반투명 고스트
   · IMU 자세(roll/pitch/yaw) → 몸통 그룹 회전  · 센서 위치 마커(가려지면 숨김)
   · 드래그 회전 · 휠 줌 · 리셋 · 터치 지원 · dpr 대응 · prefers-reduced-motion 존중
   데모 데이터는 전부 가상입니다. */
(function (W) {
  'use strict';

  /* ---------- 작은 벡터·행렬 ---------- */
  const V = {
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  };
  // 3×3 회전 (열 우선 아님 — 단순 배열 9개, 행 우선)
  const rotX = t => { const c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, c, -s, 0, s, c]; };
  const rotY = t => { const c = Math.cos(t), s = Math.sin(t); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
  const rotZ = t => { const c = Math.cos(t), s = Math.sin(t); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
  const mul = (a, b) => {
    const r = new Array(9);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
      r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
    return r;
  };
  const apply = (m, v) => [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
  ];
  const ID = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const D2R = Math.PI / 180;

  /* ---------- 회전체(lathe) 메시 ----------
     profile: [{y, rx, rz}] (local, y 아래로 갈수록 작아질 수 있음) · segs: 둘레 분할
     반환: {verts:[[x,y,z]...], tris:[[i,j,k]...]} */
  function lathe(profile, segs) {
    const verts = [], tris = [];
    const n = profile.length;
    for (let i = 0; i < n; i++) {
      const p = profile[i];
      for (let s = 0; s < segs; s++) {
        const a = (s / segs) * Math.PI * 2;
        verts.push([Math.cos(a) * p.rx, p.y, Math.sin(a) * p.rz]);
      }
    }
    for (let i = 0; i < n - 1; i++) {
      for (let s = 0; s < segs; s++) {
        const a = i * segs + s, b = i * segs + (s + 1) % segs;
        const c = (i + 1) * segs + s, d = (i + 1) * segs + (s + 1) % segs;
        tris.push([a, c, b]); tris.push([b, c, d]);
      }
    }
    return { verts, tris };
  }
  // 둥근 캡이 있는 세그먼트 프로파일 (y: 0 → -len) — r0: 시작 반지름, r1: 끝 반지름
  function limbProfile(len, r0, r1, rings, flat) {
    const prof = [];
    const cap = 3;
    for (let i = 0; i <= cap; i++) { // 위 캡
      const t = i / cap; const ang = (1 - t) * Math.PI / 2;
      prof.push({ y: Math.sin(ang) * r0 * .9, rx: Math.cos(ang) * r0 + 1e-4, rz: (Math.cos(ang) * r0 + 1e-4) * (flat || 1) });
    }
    for (let i = 1; i < rings; i++) {
      const t = i / rings; const r = r0 + (r1 - r0) * t;
      prof.push({ y: -len * t, rx: r, rz: r * (flat || 1) });
    }
    for (let i = 0; i <= cap; i++) { // 아래 캡
      const t = i / cap; const ang = t * Math.PI / 2;
      prof.push({ y: -len - Math.sin(ang) * r1 * .9, rx: Math.cos(ang) * r1 + 1e-4, rz: (Math.cos(ang) * r1 + 1e-4) * (flat || 1) });
    }
    return prof;
  }
  function ellipsoidProfile(rx, ry, rz, rings) {
    const prof = [];
    for (let i = 0; i <= rings; i++) {
      const t = i / rings; const ang = Math.PI / 2 - t * Math.PI;
      prof.push({ y: Math.sin(ang) * ry, rx: Math.cos(ang) * rx + 1e-4, rz: Math.cos(ang) * rz + 1e-4 });
    }
    return prof;
  }

  /* ---------- 인체 정의 (단위 m · Y 위 · +Z 정면) ----------
     region: 히트맵 키. side: 'L' | 'R' | ''. group: 'trunk' (IMU 자세로 함께 회전) | 'pelvis' | 'leg'
     arm: 절단 레벨 판정용 { side, part:'upper'|'fore'|'hand' } */
  function buildBody(cfg) {
    const S = [];
    const shoulderW = cfg.shoulderW || .185, hipW = cfg.hipW || .092;
    // 골반 + 하복부
    S.push({ name: 'pelvis', group: 'pelvis', region: 'pelvis', side: '',
      mesh: lathe([
        { y: 1.06, rx: .155, rz: .105 }, { y: 1.00, rx: .168, rz: .112 }, { y: .94, rx: .172, rz: .115 },
        { y: .88, rx: .160, rz: .108 }, { y: .84, rx: .120, rz: .085 }, { y: .82, rx: .02, rz: .02 }
      ], 22), m: ID, t: [0, 0, 0] });
    // 몸통 (허리~어깨) — 영역은 삼각형 위치로 세분
    S.push({ name: 'torso', group: 'trunk', region: 'torso', side: '', split: true,
      mesh: lathe([
        { y: 1.05, rx: .150, rz: .100 }, { y: 1.12, rx: .142, rz: .096 }, { y: 1.19, rx: .150, rz: .100 },
        { y: 1.26, rx: .170, rz: .118 }, { y: 1.31, rx: .182, rz: .128 }, { y: 1.36, rx: .188, rz: .120 },
        { y: 1.41, rx: .186, rz: .108 }, { y: 1.45, rx: .150, rz: .090 }, { y: 1.47, rx: .09, rz: .06 }
      ], 26), m: ID, t: [0, 0, 0] });
    S.push({ name: 'neck', group: 'trunk', region: 'neck', side: '',
      mesh: lathe([{ y: 1.44, rx: .058, rz: .058 }, { y: 1.50, rx: .052, rz: .052 }, { y: 1.555, rx: .056, rz: .056 }], 14), m: ID, t: [0, 0, 0] });
    S.push({ name: 'head', group: 'trunk', region: 'head', side: '',
      mesh: lathe(ellipsoidProfile(.092, .118, .105, 12), 18), m: ID, t: [0, 1.655, .005] });
    // 팔 — 어깨에서 아래로, 약간 바깥·앞으로
    for (const side of ['L', 'R']) {
      const sx = side === 'L' ? 1 : -1; // 선수 기준 왼팔 = 화면 +X (정면을 보는 선수의 왼쪽이 관찰자 오른쪽)
      const abd = cfg.armAbd != null ? cfg.armAbd : 9; // 벌림 각
      const mU = mul(rotZ(-sx * abd * D2R), rotX(-6 * D2R));
      const shoulder = [sx * shoulderW, 1.405, -.005];
      S.push({ name: 'uarm' + side, group: 'trunk', region: 'uarm' + side, side, arm: { side, part: 'upper' },
        mesh: lathe(limbProfile(.295, .050, .040, 7), 14), m: mU, t: shoulder });
      const elbowLocal = apply(mU, [0, -.295, 0]);
      const elbow = [shoulder[0] + elbowLocal[0], shoulder[1] + elbowLocal[1], shoulder[2] + elbowLocal[2]];
      const mF = mul(mU, rotX(-14 * D2R));
      S.push({ name: 'farm' + side, group: 'trunk', region: 'farm' + side, side, arm: { side, part: 'fore' },
        mesh: lathe(limbProfile(.255, .040, .031, 7), 14), m: mF, t: elbow });
      const wristLocal = apply(mF, [0, -.255, 0]);
      const wrist = [elbow[0] + wristLocal[0], elbow[1] + wristLocal[1], elbow[2] + wristLocal[2]];
      S.push({ name: 'hand' + side, group: 'trunk', region: 'hand' + side, side, arm: { side, part: 'hand' },
        mesh: lathe(limbProfile(.085, .034, .028, 4, .55), 12), m: mF, t: wrist });
      // 어깨 캡 (승모근·삼각근) — 보상 움직임이 드러나는 영역
      S.push({ name: 'shoulder' + side, group: 'trunk', region: 'shoulder' + side, side,
        mesh: lathe(ellipsoidProfile(.072, .058, .068, 8), 14), m: ID, t: [sx * (shoulderW - .005), 1.41, -.002] });
    }
    // 다리
    for (const side of ['L', 'R']) {
      const sx = side === 'L' ? 1 : -1;
      const hip = [sx * hipW, .935, .005];
      const mT = rotZ(-sx * 2.5 * D2R);
      S.push({ name: 'thigh' + side, group: 'leg', region: 'thigh' + side, side,
        mesh: lathe(limbProfile(.43, .088, .064, 9), 16), m: mT, t: hip });
      const kneeL = apply(mT, [0, -.43, 0]);
      const knee = [hip[0] + kneeL[0], hip[1] + kneeL[1], hip[2] + kneeL[2]];
      S.push({ name: 'shin' + side, group: 'leg', region: 'shin' + side, side,
        mesh: lathe(limbProfile(.43, .060, .040, 9), 16), m: ID, t: knee });
      const ankle = [knee[0], knee[1] - .43, knee[2]];
      S.push({ name: 'foot' + side, group: 'leg', region: 'foot' + side, side,
        mesh: lathe(limbProfile(.115, .040, .030, 4, .6), 12), m: rotX(-82 * D2R), t: [ankle[0], ankle[1] - .02, ankle[2] - .02] });
    }
    // 세그먼트 → 월드 정점·삼각형 전개
    const tris = []; // {a,b,c (vertex index), region, seg}
    const verts = []; // [x,y,z] in body space
    for (const seg of S) {
      const base = verts.length;
      for (const v of seg.mesh.verts) { const r = apply(seg.m, v); verts.push([r[0] + seg.t[0], r[1] + seg.t[1], r[2] + seg.t[2]]); }
      for (const t of seg.mesh.tris) {
        let region = seg.region;
        if (seg.split) { // 몸통 영역 세분: 앞/뒤 × 좌/우 × 상/하
          const c = [0, 1, 2].map(i => verts[base + t[i]]);
          const cx = (c[0][0] + c[1][0] + c[2][0]) / 3, cy = (c[0][1] + c[1][1] + c[2][1]) / 3, cz = (c[0][2] + c[1][2] + c[2][2]) / 3;
          const front = cz >= 0, left = cx >= 0, upper = cy >= 1.22;
          region = (front ? (upper ? 'chest' : 'abd') : (upper ? 'upperBack' : 'lowBack')) + (left ? 'L' : 'R');
        }
        tris.push({ a: base + t[0], b: base + t[1], c: base + t[2], region, seg });
      }
    }
    return { verts, tris, segs: S };
  }

  /* ---------- 색 ---------- */
  const hexToRgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rgbStr = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')';

  /* ---------- 메인 ---------- */
  function mount(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    const reduced = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = {
      yaw: opts.yaw != null ? opts.yaw : -28 * D2R,
      pitch: opts.pitch != null ? opts.pitch : 6 * D2R,
      zoom: opts.zoom || 1,
      pose: { roll: 0, pitch: 0, yaw: 0 },   // IMU 자세(도)
      heat: {},                              // region → 0..1
      mode: opts.mode || 'heat',             // heat | symmetry | fit | plain
      amputation: opts.amputation || null,   // {side:'L'|'R', level:'hand'|'forearm'|'upperarm'|'shoulder'|'limited'}
      sensors: opts.sensors || [],           // [{id,label,pos:[x,y,z]}]
      colors: Object.assign({
        base: '#e9edf1', baseDark: '#c9d1d9', heat: '#ff6a3d', heat2: '#ffb020', left: '#2f7bff', right: '#ff5a5f',
        fit: '#1fb8a6', ghost: '#9aa5b1', line: '#0b0f14', bg: null
      }, opts.colors || {}),
      autoRotate: opts.autoRotate && !reduced,
      light: V.norm([-.45, .8, .9]),
      dragging: false, lastX: 0, lastY: 0, lastT: 0, vel: 0,
      raf: 0, dirty: true, dpr: 1, w: 0, h: 0,
      hover: null, labels: opts.labels !== false,
      onPick: opts.onPick || null
    };
    const body = buildBody(opts.body || {});
    const INK = a => opts.dark ? 'rgba(207,222,229,' + a + ')' : 'rgba(11,15,20,' + a + ')'; // 라벨 잉크 — 다크 스테이지는 밝게
    const C = {}; for (const k in state.colors) C[k] = hexToRgb(state.colors[k] || '#000000');
    const regionCenters = {}; // 라벨용 중심
    (function () {
      const acc = {};
      for (const t of body.tris) {
        const r = t.region; const a = acc[r] || (acc[r] = [0, 0, 0, 0]);
        for (const i of [t.a, t.b, t.c]) { const v = body.verts[i]; a[0] += v[0]; a[1] += v[1]; a[2] += v[2]; a[3]++; }
      }
      for (const r in acc) { const a = acc[r]; regionCenters[r] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; }
      // 삼각형마다 영역 중심까지의 가우시안 가중치 — 히트값을 매끈하게 보간 (톱니 경계 제거)
      const names = Object.keys(regionCenters); const sig = .085;
      for (const t of body.tris) {
        const a = body.verts[t.a], b = body.verts[t.b], c = body.verts[t.c];
        const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3, cz = (a[2] + b[2] + c[2]) / 3;
        const w = []; let sum = 0;
        for (const r of names) {
          const rc = regionCenters[r]; const d2 = (cx - rc[0]) ** 2 + (cy - rc[1]) ** 2 + (cz - rc[2]) ** 2;
          // 같은 세그먼트 영역은 가중 2배 (팔 다리 경계가 몸통으로 번지지 않게)
          let g = Math.exp(-d2 / (2 * sig * sig)); if (r === t.region) g = Math.max(g, .6) * 2;
          if (g > .004) { w.push([r, g]); sum += g; }
        }
        t.w = w.map(([r, g]) => [r, g / sum]);
      }
    })();
    function smoothHeat(t) { let h = 0; for (const [r, g] of t.w) h += (state.heat[r] || 0) * g; return h; }

    function resize() {
      const dpr = Math.min(W.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height));
      if (w === state.w && h === state.h && dpr === state.dpr) return;
      state.w = w; state.h = h; state.dpr = dpr;
      canvas.width = w * dpr; canvas.height = h * dpr;
      state.dirty = true;
    }

    // 절단 판정: 이 세그먼트가 고스트인가
    function ghostOf(seg) {
      const a = state.amputation; if (!a || !seg.arm || seg.arm.side !== a.side) return false;
      const lv = a.level;
      if (lv === 'shoulder') return true;
      if (lv === 'upperarm') return seg.arm.part !== 'upper' ? true : 'partial';
      if (lv === 'forearm') return seg.arm.part === 'fore' ? 'partial' : seg.arm.part === 'hand';
      if (lv === 'hand') return seg.arm.part === 'hand';
      return false; // limited: 그리되 색만 다르게
    }

    function regionColor(t) {
      const region = t.region, seg = t.seg;
      const g = ghostOf(seg);
      if (g) return { c: C.ghost, a: .16, ghost: true };
      const mode = state.mode;
      if (mode === 'plain') return { c: C.base, a: 1 };
      const h = Math.max(0, Math.min(1, smoothHeat(t)));
      if (mode === 'symmetry') {
        const side = region.slice(-1);
        if (side === 'L') return { c: mix(C.base, C.left, .14 + .86 * h), a: 1 };
        if (side === 'R') return { c: mix(C.base, C.right, .14 + .86 * h), a: 1 };
        return { c: C.base, a: 1 };
      }
      if (mode === 'fit') return { c: mix(C.base, C.fit, h), a: 1 };
      if (h <= 0.01) return { c: C.base, a: 1 };
      const c = h < .5 ? mix(C.base, C.heat2, h / .5) : mix(C.heat2, C.heat, (h - .5) / .5);
      return { c, a: 1 };
    }
    // 절단 라벨 기준점 — 고스트가 시작되는 관절 (몸 좌표)
    function amputationAnchor() {
      const a = state.amputation; if (!a) return null;
      const find = n => body.segs.find(s => s.name === n + a.side);
      const u = find('uarm'), f = find('farm'), h = find('hand');
      if (a.level === 'shoulder') return u && u.t;
      if (a.level === 'upperarm') { if (!u || !f) return null; return [(u.t[0] + f.t[0]) / 2, (u.t[1] + f.t[1]) / 2, (u.t[2] + f.t[2]) / 2]; }
      if (a.level === 'forearm') return f && f.t;
      if (a.level === 'hand') return h && h.t;
      return null;
    }

    // 프레임 변환 준비
    function transformed() {
      const pm = mul(rotY(state.pose.yaw * D2R), mul(rotX(state.pose.pitch * D2R), rotZ(state.pose.roll * D2R)));
      const pivot = [0, 1.04, 0];
      const viewM = mul(rotX(state.pitch), rotY(state.yaw));
      const center = [0, 1.0, 0];
      const out = new Array(body.verts.length);
      // 정점별 그룹 판정은 삼각형 seg로 — 정점 인덱스 → 그룹 테이블을 한 번 만든다
      if (!body.vgroup) {
        body.vgroup = new Array(body.verts.length).fill('');
        for (const t of body.tris) { body.vgroup[t.a] = t.seg.group; body.vgroup[t.b] = t.seg.group; body.vgroup[t.c] = t.seg.group; }
      }
      const posed = (state.pose.roll || state.pose.pitch || state.pose.yaw);
      for (let i = 0; i < body.verts.length; i++) {
        let v = body.verts[i];
        if (posed && body.vgroup[i] === 'trunk') {
          const r = apply(pm, [v[0] - pivot[0], v[1] - pivot[1], v[2] - pivot[2]]);
          v = [r[0] + pivot[0], r[1] + pivot[1], r[2] + pivot[2]];
        }
        out[i] = apply(viewM, [v[0] - center[0], v[1] - center[1], v[2] - center[2]]);
      }
      return { out, viewM, pm, pivot, center };
    }

    function project(v) {
      const f = 2.6 * state.zoom, cz = 3.4;
      const s = (state.h * .52) * f / (cz - v[2]);
      return [state.w / 2 + v[0] * s, state.h / 2 - v[1] * s + state.h * .02, s];
    }

    // 바디 레이어는 오프스크린에 캐시 — 시점·자세·히트·모드가 바뀔 때만 다시 그린다. 오버레이(센서·라벨·기즈모)는 매 프레임.
    const off = document.createElement('canvas'); const offCtx = off.getContext('2d');
    let bodyKey = '';
    function renderBody() {
      const { out, viewM, pm, pivot, center } = transformed();
      const dpr = state.dpr; off.width = state.w * dpr; off.height = state.h * dpr;
      const ctx2 = offCtx; ctx2.setTransform(dpr, 0, 0, dpr, 0, 0); ctx2.clearRect(0, 0, state.w, state.h);
      if (state.colors.bg) { ctx2.fillStyle = state.colors.bg; ctx2.fillRect(0, 0, state.w, state.h); }
      // 바닥 그림자(타원)
      const gp = project(apply(viewM, [0, -1.0, 0]));
      ctx2.fillStyle = 'rgba(0,0,0,.07)'; ctx2.beginPath(); ctx2.ellipse(gp[0], gp[1] + 4, 0.34 * gp[2], 0.10 * gp[2] * Math.max(.25, Math.cos(state.pitch)), 0, 0, Math.PI * 2); ctx2.fill();
      const P = out.map(project);
      const list = [];
      const L = state.light;
      for (const t of body.tris) {
        const a = out[t.a], b = out[t.b], c = out[t.c];
        const n = V.norm(V.cross(V.sub(b, a), V.sub(c, a)));
        if (n[2] < -0.05 && !ghostOf(t.seg)) continue; // 뒷면 제거 (고스트는 실루엣 유지 위해 그림)
        const z = (a[2] + b[2] + c[2]) / 3;
        list.push({ t, n, z });
      }
      list.sort((p, q) => p.z - q.z);
      ctx2.lineJoin = 'round';
      for (const it of list) {
        const t = it.t; const rc = regionColor(t);
        const lam = Math.max(0, V.dot(it.n, L));
        const rim = Math.pow(1 - Math.max(0, it.n[2]), 3) * .22;
        const k = rc.ghost ? 1 : (.56 + .44 * lam + rim);
        const col = [rc.c[0] * k, rc.c[1] * k, rc.c[2] * k];
        const fill = rgbStr(col, rc.a);
        const pa = P[t.a], pb = P[t.b], pc = P[t.c];
        ctx2.beginPath(); ctx2.moveTo(pa[0], pa[1]); ctx2.lineTo(pb[0], pb[1]); ctx2.lineTo(pc[0], pc[1]); ctx2.closePath();
        ctx2.fillStyle = fill; ctx2.fill();
        if (!rc.ghost) { ctx2.strokeStyle = fill; ctx2.lineWidth = .7; ctx2.stroke(); }
      }
      state._lastP = P; state._lastList = list;
      return { viewM, pm, pivot, center };
    }
    let viewCache = null;
    function draw() {
      resize();
      const heatKey = Object.keys(state.heat).map(k => k + ':' + (state.heat[k] * 100 | 0)).join(',');
      const key = [state.yaw.toFixed(4), state.pitch.toFixed(4), state.zoom.toFixed(3), state.pose.roll.toFixed(2), state.pose.pitch.toFixed(2), state.pose.yaw.toFixed(2), state.mode, JSON.stringify(state.amputation), state.w, state.h, state.dpr, heatKey].join('|');
      if (key !== bodyKey) { viewCache = renderBody(); bodyKey = key; }
      const { viewM, pm, pivot, center } = viewCache;
      const ctx2 = ctx; const dpr = state.dpr;
      ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2.clearRect(0, 0, state.w, state.h);
      ctx2.drawImage(off, 0, 0, state.w, state.h);
      // 절단 부위 표시 — 고스트 팔 끝에 라벨
      const anchor = state.labels && amputationAnchor();
      if (anchor) {
        const r0 = apply(pm, [anchor[0] - pivot[0], anchor[1] - pivot[1], anchor[2] - pivot[2]]);
        const wp = apply(viewM, [r0[0] + pivot[0] - center[0], r0[1] + pivot[1] - center[1], r0[2] + pivot[2] - center[2]]);
        const pp = project(wp);
        const dir = pp[0] >= state.w / 2 ? 1 : -1; // 화면 바깥쪽으로 라벨
        ctx2.beginPath(); ctx2.arc(pp[0], pp[1], 3.2, 0, Math.PI * 2); ctx2.fillStyle = INK(.75); ctx2.fill();
        ctx2.strokeStyle = INK(.55); ctx2.setLineDash([3, 3]); ctx2.lineWidth = 1;
        ctx2.beginPath(); ctx2.moveTo(pp[0], pp[1]); ctx2.lineTo(pp[0] + dir * 34, pp[1]); ctx2.stroke(); ctx2.setLineDash([]);
        ctx2.font = '600 11px ' + (opts.font || 'Pretendard, sans-serif'); ctx2.fillStyle = INK(.85);
        ctx2.textAlign = dir > 0 ? 'left' : 'right'; ctx2.textBaseline = 'middle';
        ctx2.fillText(opts.amputationLabel || '절단 부위', pp[0] + dir * 38, pp[1]);
      }
      // 센서 마커
      for (const s of state.sensors) {
        let v = s.pos;
        if (s.trunk !== false) { const r = apply(pm, [v[0] - pivot[0], v[1] - pivot[1], v[2] - pivot[2]]); v = [r[0] + pivot[0], r[1] + pivot[1], r[2] + pivot[2]]; }
        const w = apply(viewM, [v[0] - center[0], v[1] - center[1], v[2] - center[2]]);
        const nrm = apply(viewM, s.normal || [0, 0, 1]);
        const visible = nrm[2] > 0.08;
        const p = project(w);
        const col = s.color || '#0b0f14';
        ctx2.globalAlpha = visible ? 1 : .22;
        ctx2.beginPath(); ctx2.arc(p[0], p[1], 5.5, 0, Math.PI * 2); ctx2.fillStyle = col; ctx2.fill();
        ctx2.lineWidth = 2; ctx2.strokeStyle = '#fff'; ctx2.stroke();
        if (s.pulse && visible && !reduced) {
          const ph = ((performance.now() / 1400) % 1);
          ctx2.beginPath(); ctx2.arc(p[0], p[1], 6 + ph * 14, 0, Math.PI * 2); ctx2.strokeStyle = col; ctx2.globalAlpha = (1 - ph) * .5; ctx2.lineWidth = 1.5; ctx2.stroke();
          state.dirty = true;
        }
        if (state.labels && visible && s.label) {
          ctx2.globalAlpha = 1; ctx2.font = '600 11px ' + (opts.font || 'Pretendard, sans-serif');
          ctx2.textAlign = 'left'; ctx2.textBaseline = 'middle'; ctx2.fillStyle = col;
          const lx = p[0] + 10, ly = p[1] - 10;
          const tw = ctx2.measureText(s.label).width;
          ctx2.fillStyle = opts.dark ? 'rgba(8,9,13,.78)' : 'rgba(255,255,255,.92)'; roundRect(ctx2, lx - 5, ly - 9, tw + 10, 18, 4); ctx2.fill();
          ctx2.fillStyle = col; ctx2.fillText(s.label, lx, ly);
        }
        ctx2.globalAlpha = 1;
      }
      // 자세 기즈모(선택) — 몸통 좌표축
      if (opts.gizmo) {
        const o = apply(viewM, [pivot[0] - center[0], pivot[1] + .25 - center[1], pivot[2] - center[2]]);
        const po = project(o);
        const axes = [[[.16, 0, 0], state.colors.right || '#ff5a5f', 'X'], [[0, .16, 0], '#1fb8a6', 'Y'], [[0, 0, .16], state.colors.left || '#2f7bff', 'Z']];
        for (const [ax, colr, lab] of axes) {
          const r = apply(pm, ax); const w = apply(viewM, r); const pe = project([o[0] + w[0], o[1] + w[1], o[2] + w[2]]);
          ctx2.strokeStyle = colr; ctx2.lineWidth = 2; ctx2.beginPath(); ctx2.moveTo(po[0], po[1]); ctx2.lineTo(pe[0], pe[1]); ctx2.stroke();
          ctx2.fillStyle = colr; ctx2.font = '700 10px ' + (opts.font || 'Pretendard, sans-serif'); ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
          ctx2.fillText(lab, pe[0] + (pe[0] - po[0]) * .12, pe[1] + (pe[1] - po[1]) * .12);
        }
      }
      // 영역 라벨 (hover 또는 heat 상위)
      if (state.labels && state.hoverRegion && regionCenters[state.hoverRegion]) {
        const rc0 = regionCenters[state.hoverRegion];
        const w = apply(viewM, [rc0[0] - center[0], rc0[1] - center[1], rc0[2] - center[2]]);
        const p = project(w);
        const txt = (opts.regionNames && opts.regionNames[state.hoverRegion]) || state.hoverRegion;
        const val = state.heat[state.hoverRegion];
        const s = txt + (val != null ? ' · ' + Math.round(val * 100) + '%' : '');
        ctx2.font = '600 12px ' + (opts.font || 'Pretendard, sans-serif'); const tw = ctx2.measureText(s).width;
        ctx2.fillStyle = opts.dark ? 'rgba(236,255,62,.95)' : 'rgba(11,15,20,.9)'; roundRect(ctx2, p[0] + 10, p[1] - 24, tw + 16, 24, 6); ctx2.fill();
        ctx2.fillStyle = opts.dark ? '#08090d' : '#fff'; ctx2.textAlign = 'left'; ctx2.textBaseline = 'middle'; ctx2.fillText(s, p[0] + 18, p[1] - 12);
      }
      state.dirty = false;
    }
    function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

    // 픽킹: 화면 점 → 영역 (마지막 프레임의 삼각형을 역순으로 검사)
    function pick(x, y) {
      const P = state._lastP, list = state._lastList; if (!P || !list) return null;
      for (let i = list.length - 1; i >= 0; i--) {
        const t = list[i].t; const a = P[t.a], b = P[t.b], c = P[t.c];
        const d1 = (x - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (y - b[1]);
        const d2 = (x - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (y - c[1]);
        const d3 = (x - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (y - a[1]);
        const neg = (d1 < 0) || (d2 < 0) || (d3 < 0), pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        if (!(neg && pos)) return t.region;
      }
      return null;
    }

    /* 루프 */
    function loop() {
      state.raf = 0;
      if (state.autoRotate && !state.dragging) { state.yaw += .0035; state.dirty = true; }
      if (!state.dragging && Math.abs(state.vel) > .0004) { state.yaw += state.vel; state.vel *= .92; state.dirty = true; }
      if (state.dirty) draw();
      if (state.autoRotate || Math.abs(state.vel) > .0004 || state.dirty) state.raf = requestAnimationFrame(loop);
    }
    function kick() { if (dead) return; if (!state.raf) state.raf = requestAnimationFrame(loop); }

    /* 입력 */
    function px(e) { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    canvas.addEventListener('pointerdown', e => {
      state.dragging = true; state.vel = 0; const p = px(e); state.lastX = p[0]; state.lastY = p[1]; state.lastT = performance.now();
      canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('pointermove', e => {
      const p = px(e);
      if (state.dragging) {
        const dx = p[0] - state.lastX, dy = p[1] - state.lastY;
        state.yaw += dx * .011; state.pitch = Math.max(-.9, Math.min(.9, state.pitch + dy * .008));
        const now = performance.now(); state.vel = dx * .011 * Math.min(1, 16 / Math.max(1, now - state.lastT)); state.lastT = now;
        state.lastX = p[0]; state.lastY = p[1]; state.dirty = true; kick();
      } else if (state.labels) {
        const r = pick(p[0], p[1]);
        if (r !== state.hoverRegion) { state.hoverRegion = r; state.dirty = true; kick(); canvas.style.cursor = r ? 'pointer' : 'grab'; }
      }
    });
    const up = e => { if (!state.dragging) return; state.dragging = false; canvas.style.cursor = 'grab'; kick(); };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', () => { if (state.hoverRegion) { state.hoverRegion = null; state.dirty = true; kick(); } });
    canvas.addEventListener('click', e => { const p = px(e); const r = pick(p[0], p[1]); if (r && state.onPick) state.onPick(r, state.heat[r]); });
    canvas.addEventListener('wheel', e => {
      if (opts.wheelZoom === false) return;
      e.preventDefault(); state.zoom = Math.max(.6, Math.min(2.2, state.zoom * (e.deltaY < 0 ? 1.08 : .926))); state.dirty = true; kick();
    }, { passive: false });
    canvas.style.cursor = 'grab'; canvas.style.touchAction = 'none';
    let ro = null; if (W.ResizeObserver) { ro = new ResizeObserver(() => { state.dirty = true; kick(); }); ro.observe(canvas); }
    let dead = false;

    const api = {
      setHeat(map, animate) {
        if (animate && !reduced) {
          const from = Object.assign({}, state.heat); const keys = new Set([...Object.keys(from), ...Object.keys(map)]);
          const t0 = performance.now(); const dur = 520;
          const step = () => { const t = Math.min(1, (performance.now() - t0) / dur); const e = 1 - Math.pow(1 - t, 3);
            for (const k of keys) state.heat[k] = (from[k] || 0) + ((map[k] || 0) - (from[k] || 0)) * e; state.dirty = true; kick();
            if (t < 1) requestAnimationFrame(step); };
          step();
        } else { state.heat = Object.assign({}, map); state.dirty = true; kick(); }
        return api;
      },
      setMode(m) { state.mode = m; state.dirty = true; kick(); return api; },
      setAmputation(a) { state.amputation = a; state.dirty = true; kick(); return api; },
      setPose(p) { state.pose = { roll: p.roll || 0, pitch: p.pitch || 0, yaw: p.yaw || 0 }; state.dirty = true; kick(); return api; },
      setSensors(s) { state.sensors = s || []; state.dirty = true; kick(); return api; },
      setView(yawDeg, pitchDeg, animate) {
        const ty = yawDeg * D2R, tp = pitchDeg * D2R;
        if (!animate || reduced) { state.yaw = ty; state.pitch = tp; state.dirty = true; kick(); return api; }
        const fy = state.yaw, fp = state.pitch, t0 = performance.now(), dur = 600;
        const step = () => { const t = Math.min(1, (performance.now() - t0) / dur); const e = 1 - Math.pow(1 - t, 3);
          state.yaw = fy + (ty - fy) * e; state.pitch = fp + (tp - fp) * e; state.dirty = true; kick(); if (t < 1) requestAnimationFrame(step); };
        step(); return api;
      },
      resetView(animate) { return api.setView(-28, 6, animate !== false); },
      setAutoRotate(on) { state.autoRotate = !!on && !reduced; kick(); return api; },
      setZoom(z) { state.zoom = z; state.dirty = true; kick(); return api; },
      redraw() { state.dirty = true; kick(); return api; },
      regions: () => Object.keys(regionCenters),
      state, triCount: body.tris.length,
      destroy() { dead = true; state.autoRotate = false; if (state.raf) cancelAnimationFrame(state.raf); state.raf = 0; if (ro) ro.disconnect(); }
    };
    resize(); kick();
    return api;
  }

  // 영역 한글명 (앱에서 재사용)
  const REGION_NAMES = {
    head: '머리', neck: '목', chestL: '가슴 왼쪽', chestR: '가슴 오른쪽', abdL: '복부 왼쪽', abdR: '복부 오른쪽',
    upperBackL: '등 위 왼쪽', upperBackR: '등 위 오른쪽', lowBackL: '허리 왼쪽', lowBackR: '허리 오른쪽', pelvis: '골반',
    shoulderL: '왼쪽 어깨', shoulderR: '오른쪽 어깨', uarmL: '왼쪽 위팔', uarmR: '오른쪽 위팔', farmL: '왼쪽 아래팔', farmR: '오른쪽 아래팔',
    handL: '왼손', handR: '오른손', thighL: '왼쪽 허벅지', thighR: '오른쪽 허벅지', shinL: '왼쪽 종아리', shinR: '오른쪽 종아리', footL: '왼발', footR: '오른발'
  };

  W.Body3D = { mount, REGION_NAMES };
})(window);
