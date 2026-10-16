/* ATHLEDGER — 차트 엔진 (외부 라이브러리 없음 · canvas 2D · dpr 대응 · CSS 변수 색)
   timeseries : 다채널 시계열 + 공유 시간축 + 스크럽 커서 + 구간 선택 + 좌/우 밴드
   scatter3d  : 3축 산점(회전·기울기·속도) — 드래그 회전 · 좌/우 색
   gauge      : 좌우 대칭 게이지 (−100 … +100)
   spark      : 스파크라인 · bars : 수직 막대(0에서 자람) · donut
   모든 차트는 draw(opts) 한 번으로 그리고, 애니메이션은 rAF + easeOutCubic. */
(function (W) {
  'use strict';
  const css0 = (name, el) => getComputedStyle(el || document.documentElement).getPropertyValue(name).trim();
  // 토큰 별칭: 이 데모의 토큰(--ink-1 · --line-strong)과 구 이름(--ink · --line-2) 둘 다 받는다
  const ALIAS = { '--ink': ['--ink', '--ink-1'], '--line-2': ['--line-2', '--line-strong'], '--accent': ['--accent', '--ink-1'] };
  const css = (name, el) => { const names = ALIAS[name] || [name]; for (const n of names) { const v = css0(n, el); if (v) return v; } return ''; };
  const ease = t => 1 - Math.pow(1 - t, 3);
  const reduced = () => W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fontOf = el => (css('--font', el) || 'Pretendard, sans-serif');

  function setup(canvas) {
    const dpr = Math.min(W.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    return { ctx, w, h, dpr };
  }
  function animate(dur, fn) {
    if (reduced()) { fn(1); return; }
    const t0 = performance.now();
    const step = () => { const t = Math.min(1, (performance.now() - t0) / dur); fn(ease(t)); if (t < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  const fmt = (v, d) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(d == null ? 1 : d));

  /* ---------------- 시계열 ----------------
     opts: { t:[sec...], series:[{key,label,data:[...],color,unit,hidden}], cursor:sec|null, range:[a,b]|null,
             bands:[{from,to,color,label}], marks:[{t,label}], yLabel, unit, grid:true, fill:false, lineWidth } */
  function timeseries(canvas, opts) {
    const { ctx, w, h } = setup(canvas);
    const font = fontOf(canvas);
    const ink = css('--ink') || '#0b0f14', ink3 = css('--ink-3') || '#8a94a6', line = css('--line') || '#e6e9ee';
    const padL = opts.padL != null ? opts.padL : 46, padR = 14, padT = 14, padB = 26;
    const pw = w - padL - padR, ph = h - padT - padB;
    const t = opts.t; const n = t.length; if (!n) return;
    const series = opts.series.filter(s => !s.hidden);
    let min = Infinity, max = -Infinity;
    for (const s of series) for (let i = 0; i < n; i++) { const v = s.data[i]; if (v < min) min = v; if (v > max) max = v; }
    if (opts.ymin != null) min = opts.ymin; if (opts.ymax != null) max = opts.ymax;
    if (min === max) { min -= 1; max += 1; }
    const padY = (max - min) * .08; min -= padY; max += padY;
    const t0 = t[0], t1 = t[n - 1];
    const X = s => padL + (s - t0) / (t1 - t0 || 1) * pw;
    const Y = v => padT + (1 - (v - min) / (max - min)) * ph;
    // 밴드
    for (const b of (opts.bands || [])) {
      ctx.fillStyle = b.color; ctx.globalAlpha = b.alpha != null ? b.alpha : .10;
      ctx.fillRect(X(b.from), padT, X(b.to) - X(b.from), ph); ctx.globalAlpha = 1;
      if (b.label) { ctx.fillStyle = b.color; ctx.font = '600 10px ' + font; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(b.label, X(b.from) + 4, padT + 2); }
    }
    // 그리드 + y 축
    ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.font = '500 10px ' + font; ctx.fillStyle = ink3; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const v = min + (max - min) * i / ticks; const y = Math.round(Y(v)) + .5;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      ctx.fillText(fmt(v, 0) + (opts.unit && i === ticks ? '' : ''), padL - 6, y);
    }
    if (opts.unit) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(opts.unit, 2, 2); }
    // 0 선 강조
    if (min < 0 && max > 0) { const y = Math.round(Y(0)) + .5; ctx.strokeStyle = css('--line-2') || '#cfd5de'; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke(); }
    // x 축 라벨 (분:초)
    ctx.fillStyle = ink3; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const xt = 6;
    const short = (t1 - t0) < 90;
    for (let i = 0; i <= xt; i++) {
      const s = t0 + (t1 - t0) * i / xt; const x = X(s);
      const m = Math.floor(s / 60), sec = s % 60;
      ctx.fillText(short ? s.toFixed(1) + 's' : m + ':' + String(Math.floor(sec)).padStart(2, '0'), x, h - padB + 8);
    }
    // 구간 선택
    if (opts.range) {
      const a = X(opts.range[0]), b = X(opts.range[1]);
      ctx.fillStyle = ink; ctx.globalAlpha = .05; ctx.fillRect(a, padT, b - a, ph); ctx.globalAlpha = 1;
      ctx.strokeStyle = ink; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(a + .5, padT); ctx.lineTo(a + .5, padT + ph); ctx.moveTo(b + .5, padT); ctx.lineTo(b + .5, padT + ph); ctx.stroke(); ctx.setLineDash([]);
    }
    // 선 — 진행도(애니메이션) 지원
    const prog = opts.progress == null ? 1 : opts.progress;
    const upto = Math.max(2, Math.floor(n * prog));
    const step = Math.max(1, Math.floor(n / (pw * 2))); // 픽셀당 2점 이상은 건너뜀
    for (const s of series) {
      ctx.strokeStyle = s.color; ctx.lineWidth = s.lineWidth || opts.lineWidth || 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < upto; i += step) { const x = X(t[i]), y = Y(s.data[i]); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      if (opts.fill || s.fill) {
        ctx.save(); ctx.lineTo(X(t[Math.min(upto - 1, n - 1)]), Y(Math.max(min, 0)) ); ctx.lineTo(X(t[0]), Y(Math.max(min, 0))); ctx.closePath();
        ctx.fillStyle = s.color; ctx.globalAlpha = .12; ctx.fill(); ctx.restore();
        ctx.beginPath(); for (let i = 0; i < upto; i += step) { const x = X(t[i]), y = Y(s.data[i]); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      }
      ctx.stroke();
    }
    // 마크
    for (const m of (opts.marks || [])) {
      const x = Math.round(X(m.t)) + .5; ctx.strokeStyle = m.color || ink3; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + ph); ctx.stroke(); ctx.setLineDash([]);
      if (m.label) { ctx.fillStyle = m.color || ink3; ctx.font = '600 10px ' + font; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(m.label, x + 4, padT); }
    }
    // 커서
    if (opts.cursor != null) {
      const x = Math.round(X(opts.cursor)) + .5;
      ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + ph); ctx.stroke();
      let idx = Math.round((opts.cursor - t0) / (t1 - t0 || 1) * (n - 1)); idx = Math.max(0, Math.min(n - 1, idx));
      let ly = padT + 4;
      for (const s of series) {
        const v = s.data[idx]; const y = Y(v);
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fillStyle = s.color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      if (opts.cursorLabel !== false) {
        const lines = series.map(s => (s.label || s.key) + ' ' + fmt(series.length > 3 ? s.data[idx] : s.data[idx], 1) + (s.unit || opts.unit || ''));
        ctx.font = '600 11px ' + font; const tw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 14;
        const bx = x + 10 + tw > w - padR ? x - 10 - tw : x + 10; const bh = lines.length * 15 + 8;
        ctx.fillStyle = ink; ctx.globalAlpha = .92; roundRect(ctx, bx, ly, tw, bh, 6); ctx.fill(); ctx.globalAlpha = 1;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        lines.forEach((l, i) => { ctx.fillStyle = series[i].color; ctx.fillRect(bx + 6, ly + 8 + i * 15, 6, 6); ctx.fillStyle = '#fff'; ctx.fillText(l, bx + 16, ly + 4 + i * 15); });
      }
    }
    return { X, Y, padL, padR, padT, padB, t0, t1, toTime: px => t0 + (px - padL) / pw * (t1 - t0) };
  }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  /* ---------------- 3축 산점 ----------------
     opts: { points:[{x,y,z,side:'L'|'R'|'',t}], axes:['회전','기울기','속도'], yaw, pitch, colors:{L,R,n}, highlight:index } */
  function scatter3d(canvas, opts) {
    const { ctx, w, h } = setup(canvas);
    const font = fontOf(canvas);
    const ink = css('--ink') || '#0b0f14', ink3 = css('--ink-3') || '#8a94a6', line = css('--line') || '#e6e9ee';
    const yaw = opts.yaw == null ? -.6 : opts.yaw, pitch = opts.pitch == null ? .42 : opts.pitch;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const rot = v => { const x = v[0] * cy + v[2] * sy, z = -v[0] * sy + v[2] * cy; const y = v[1] * cp - z * sp, z2 = v[1] * sp + z * cp; return [x, y, z2]; };
    const pts = opts.points; if (!pts.length) return;
    const ext = ['x', 'y', 'z'].map(k => { let a = Infinity, b = -Infinity; for (const p of pts) { if (p[k] < a) a = p[k]; if (p[k] > b) b = p[k]; } if (a === b) b = a + 1; return [a, b]; });
    const N = (p, k, i) => ((p[k] - ext[i][0]) / (ext[i][1] - ext[i][0]) - .5);
    const S = Math.min(w, h) * (opts.scale || .62);
    const P = v => { const r = rot(v); const d = 1 / (1 + r[2] * .28); return [w / 2 + r[0] * S * d, h / 2 - r[1] * S * d + h * .04, d, r[2]]; };
    // 큐브 틀
    const C = [];
    for (let i = 0; i < 8; i++) C.push([(i & 1 ? .5 : -.5), (i & 2 ? .5 : -.5), (i & 4 ? .5 : -.5)]);
    const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    ctx.strokeStyle = line; ctx.lineWidth = 1;
    for (const [a, b] of E) { const pa = P(C[a]), pb = P(C[b]); ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke(); }
    // 바닥 그리드
    ctx.strokeStyle = line; ctx.globalAlpha = .7;
    for (let i = 1; i < 4; i++) { const k = -.5 + i / 4; let a = P([k, -.5, -.5]), b = P([k, -.5, .5]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); a = P([-.5, -.5, k]); b = P([.5, -.5, k]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // 축 라벨
    const ax = opts.axes || ['X', 'Y', 'Z']; ctx.font = '600 11px ' + font; ctx.fillStyle = ink3; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lx = P([0, -.5, -.62]), ly = P([-.66, 0, -.5]), lz = P([.62, -.5, 0]);
    ctx.fillText(ax[0], lx[0], lx[1]); ctx.fillText(ax[1], ly[0], ly[1]); ctx.fillText(ax[2], lz[0], lz[1]);
    // 점 — 깊이순
    const colors = Object.assign({ L: css('--left') || '#2f7bff', R: css('--right') || '#ff5a5f', '': ink3 }, opts.colors || {});
    const prog = opts.progress == null ? 1 : opts.progress;
    const upto = Math.floor(pts.length * prog);
    const list = [];
    for (let i = 0; i < upto; i++) { const p = pts[i]; const q = P([N(p, 'x', 0), N(p, 'y', 1), N(p, 'z', 2)]); list.push({ q, p, i }); }
    list.sort((a, b) => b.q[3] - a.q[3]);
    const r0 = opts.radius || 2.6;
    for (const it of list) {
      const r = r0 * it.q[2]; const col = colors[it.p.side || ''];
      ctx.beginPath(); ctx.arc(it.q[0], it.q[1], r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.globalAlpha = .55 + .45 * (1 - it.q[2]); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (opts.highlight != null && opts.highlight < pts.length) {
      const p = pts[opts.highlight]; const q = P([N(p, 'x', 0), N(p, 'y', 1), N(p, 'z', 2)]);
      ctx.beginPath(); ctx.arc(q[0], q[1], 7, 0, Math.PI * 2); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(q[0], q[1], 3.5, 0, Math.PI * 2); ctx.fillStyle = ink; ctx.fill();
    }
    // 좌/우 중심(평균)
    if (opts.centroids) {
      for (const side of ['L', 'R']) {
        const ps = pts.filter(p => p.side === side); if (!ps.length) continue;
        const m = { x: 0, y: 0, z: 0 }; for (const p of ps) { m.x += p.x; m.y += p.y; m.z += p.z; } m.x /= ps.length; m.y /= ps.length; m.z /= ps.length;
        const q = P([N(m, 'x', 0), N(m, 'y', 1), N(m, 'z', 2)]);
        ctx.beginPath(); ctx.arc(q[0], q[1], 9, 0, Math.PI * 2); ctx.strokeStyle = colors[side]; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(q[0], q[1], 2.5, 0, Math.PI * 2); ctx.fillStyle = colors[side]; ctx.fill();
        ctx.font = '700 11px ' + font; ctx.fillStyle = colors[side]; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(side === 'L' ? '왼쪽 중심' : '오른쪽 중심', q[0] + 13, q[1]);
      }
    }
  }

  /* ---------------- 좌우 대칭 게이지 ---------------- value: −100(왼쪽 치우침) … +100(오른쪽 치우침) */
  function gauge(canvas, opts) {
    const { ctx, w, h } = setup(canvas);
    const font = fontOf(canvas);
    const ink = css('--ink') || '#0b0f14', ink3 = css('--ink-3') || '#8a94a6', line = css('--line-2') || '#cfd5de';
    const L = css('--left') || '#2f7bff', R = css('--right') || '#ff5a5f';
    const v = Math.max(-100, Math.min(100, opts.value * (opts.progress == null ? 1 : opts.progress)));
    const padX = 18, cx = w / 2, y = h * .52, bw = w - padX * 2, bh = 10;
    // 트랙
    const g = ctx.createLinearGradient(padX, 0, w - padX, 0); g.addColorStop(0, L); g.addColorStop(.5, line); g.addColorStop(1, R);
    ctx.fillStyle = g; ctx.globalAlpha = .35; roundRect(ctx, padX, y - bh / 2, bw, bh, bh / 2); ctx.fill(); ctx.globalAlpha = 1;
    // 허용 범위
    const tol = opts.tolerance == null ? 10 : opts.tolerance;
    ctx.fillStyle = ink; ctx.globalAlpha = .08; ctx.fillRect(cx - bw / 2 * tol / 100, y - bh / 2 - 4, bw * tol / 100, bh + 8); ctx.globalAlpha = 1;
    // 중심선
    ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx + .5, y - 14); ctx.lineTo(cx + .5, y + 14); ctx.stroke();
    // 바늘
    const x = cx + bw / 2 * v / 100;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fillStyle = v < -tol ? L : v > tol ? R : ink; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
    // 라벨
    ctx.font = '600 11px ' + font; ctx.fillStyle = ink3; ctx.textBaseline = 'top';
    ctx.textAlign = 'left'; ctx.fillText(opts.leftLabel || '왼쪽', padX, y + 16); ctx.textAlign = 'right'; ctx.fillText(opts.rightLabel || '오른쪽', w - padX, y + 16);
    ctx.textAlign = 'center'; ctx.fillText('균형', cx, y + 16);
    ctx.font = '800 22px ' + font; ctx.fillStyle = ink; ctx.textBaseline = 'bottom'; ctx.fillText((v > 0 ? '+' : '') + v.toFixed(1) + '%', cx, y - 18);
  }

  /* ---------------- 스파크라인 ---------------- */
  function spark(canvas, opts) {
    const { ctx, w, h } = setup(canvas);
    const d = opts.data; if (!d || d.length < 2) return;
    const color = opts.color || css('--accent') || '#0b0f14';
    let min = Math.min(...d), max = Math.max(...d); if (min === max) { min -= 1; max += 1; }
    const X = i => 2 + i / (d.length - 1) * (w - 4), Y = v => 2 + (1 - (v - min) / (max - min)) * (h - 4);
    const prog = opts.progress == null ? 1 : opts.progress; const upto = Math.max(2, Math.round(d.length * prog));
    ctx.beginPath(); for (let i = 0; i < upto; i++) { i ? ctx.lineTo(X(i), Y(d[i])) : ctx.moveTo(X(i), Y(d[i])); }
    if (opts.fill !== false) { ctx.save(); ctx.lineTo(X(upto - 1), h); ctx.lineTo(X(0), h); ctx.closePath(); ctx.fillStyle = color; ctx.globalAlpha = .12; ctx.fill(); ctx.restore(); }
    ctx.beginPath(); for (let i = 0; i < upto; i++) { i ? ctx.lineTo(X(i), Y(d[i])) : ctx.moveTo(X(i), Y(d[i])); }
    ctx.strokeStyle = color; ctx.lineWidth = opts.lineWidth || 1.6; ctx.lineJoin = 'round'; ctx.stroke();
    const li = upto - 1; ctx.beginPath(); ctx.arc(X(li), Y(d[li]), 2.6, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  }

  /* ---------------- 막대 (카테고리) ---------------- opts: { items:[{label,value,color}], max, progress, horizontal } */
  function bars(canvas, opts) {
    const { ctx, w, h } = setup(canvas);
    const font = fontOf(canvas);
    const ink = css('--ink') || '#0b0f14', ink3 = css('--ink-3') || '#8a94a6', line = css('--line') || '#e6e9ee';
    const items = opts.items; const max = opts.max || Math.max(...items.map(i => i.value)) || 1;
    const prog = opts.progress == null ? 1 : opts.progress;
    if (opts.horizontal) {
      const rowH = h / items.length; const labW = opts.labelWidth || 92;
      items.forEach((it, i) => {
        const y = i * rowH + rowH / 2; const bw = (w - labW - 48) * (it.value / max) * prog;
        ctx.font = '600 12px ' + font; ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(it.label, 0, y);
        ctx.fillStyle = line; roundRect(ctx, labW, y - 5, w - labW - 48, 10, 5); ctx.fill();
        ctx.fillStyle = it.color || ink; roundRect(ctx, labW, y - 5, Math.max(10, bw), 10, 5); ctx.fill();
        ctx.fillStyle = ink3; ctx.textAlign = 'right'; ctx.fillText((it.display != null ? it.display : fmt(it.value * prog, 0)) + (opts.unit || ''), w, y);
      });
      return;
    }
    const padB = 20, gap = 10; const bw = (w - gap * (items.length - 1)) / items.length;
    items.forEach((it, i) => {
      const x = i * (bw + gap); const bh = (h - padB - 16) * (it.value / max) * prog;
      ctx.fillStyle = it.color || ink; roundRect(ctx, x, h - padB - bh, bw, bh, 4); ctx.fill();
      ctx.font = '500 10px ' + font; ctx.fillStyle = ink3; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(it.label, x + bw / 2, h - padB + 4);
      ctx.fillStyle = ink; ctx.font = '600 11px ' + font; ctx.textBaseline = 'bottom'; ctx.fillText(it.display != null ? it.display : fmt(it.value * prog, 0), x + bw / 2, h - padB - bh - 2);
    });
  }

  /* ---------------- 도넛 ---------------- */
  function donut(canvas, opts) {
    const { ctx, w, h } = setup(canvas);
    const font = fontOf(canvas);
    const ink = css('--ink') || '#0b0f14', line = css('--line') || '#e6e9ee';
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 4, lw = opts.width || 10;
    const total = opts.items.reduce((s, i) => s + i.value, 0) || 1; const prog = opts.progress == null ? 1 : opts.progress;
    let a = -Math.PI / 2;
    ctx.lineWidth = lw; ctx.strokeStyle = line; ctx.beginPath(); ctx.arc(cx, cy, r - lw / 2, 0, Math.PI * 2); ctx.stroke();
    for (const it of opts.items) { const sw = it.value / total * Math.PI * 2 * prog; ctx.strokeStyle = it.color; ctx.beginPath(); ctx.arc(cx, cy, r - lw / 2, a, a + sw); ctx.stroke(); a += sw; }
    if (opts.center) { ctx.fillStyle = ink; ctx.font = '800 ' + (opts.centerSize || 20) + 'px ' + font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(opts.center, cx, cy - (opts.sub ? 6 : 0)); }
    if (opts.sub) { ctx.fillStyle = css('--ink-3') || '#8a94a6'; ctx.font = '500 11px ' + font; ctx.fillText(opts.sub, cx, cy + 12); }
  }

  /* ---------------- 카운트업 ---------------- */
  function countUp(el, to, opts) {
    opts = opts || {}; const dec = opts.decimals || 0; const from = opts.from || 0; const dur = opts.duration || 900;
    const f = v => (opts.prefix || '') + v.toLocaleString('ko-KR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (opts.suffix || '');
    if (reduced()) { el.textContent = f(to); return; }
    animate(dur, e => { el.textContent = f(from + (to - from) * e); });
  }

  W.Charts = { timeseries, scatter3d, gauge, spark, bars, donut, countUp, animate, setup };
})(window);
