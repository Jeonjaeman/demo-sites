/* ATTEST — QR 인코더 (외부 라이브러리 없음 · ISO/IEC 18004 · 바이트 모드 · 버전 1~10 · EC L/M/Q/H)
   실제 스캔 가능한 코드 생성. GF(256) Reed-Solomon · 8종 마스크 페널티 평가 · 포맷/버전 정보 BCH. */
'use strict';
const QR = (() => {
  /* ── GF(256) ───────────────────────────────── */
  const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (() => {
    let x = 1;
    for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  const gmul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];
  function rsGenerator(n) {
    let g = [1];
    for (let i = 0; i < n; i++) {
      const ng = new Array(g.length + 1).fill(0);
      for (let j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= gmul(g[j], EXP[i]); }
      g = ng;
    }
    return g;
  }
  function rsEncode(data, n) {
    const gen = rsGenerator(n), res = new Array(n).fill(0);
    for (const d of data) {
      const f = d ^ res[0];
      res.shift(); res.push(0);
      if (f) for (let j = 0; j < n; j++) res[j] ^= gmul(gen[j + 1], f);
    }
    return res;
  }

  /* ── 테이블 (버전 1~10): [ec/block, g1 blocks, g1 data, g2 blocks, g2 data] ── */
  const EC = {
    L: [[7,1,19,0,0],[10,1,34,0,0],[15,1,55,0,0],[20,1,80,0,0],[26,1,108,0,0],[18,2,68,0,0],[20,2,78,0,0],[24,2,97,0,0],[30,2,116,0,0],[18,2,68,2,69]],
    M: [[10,1,16,0,0],[16,1,28,0,0],[26,1,44,0,0],[18,2,32,0,0],[24,2,43,0,0],[16,4,27,0,0],[18,4,31,0,0],[22,2,38,2,39],[22,3,36,2,37],[26,4,43,1,44]],
    Q: [[13,1,13,0,0],[22,1,22,0,0],[18,2,17,0,0],[26,2,24,0,0],[18,2,15,2,16],[24,4,19,0,0],[18,2,14,4,15],[22,4,18,2,19],[20,4,16,4,17],[24,6,19,2,20]],
    H: [[17,1,9,0,0],[28,1,16,0,0],[22,2,13,0,0],[16,4,9,0,0],[22,2,11,2,12],[28,4,15,0,0],[26,4,13,1,14],[26,4,14,2,15],[24,4,12,4,13],[28,6,15,2,16]],
  };
  const ALIGN = [null, [], [6,18], [6,22], [6,26], [6,30], [6,34], [6,22,38], [6,24,42], [6,26,46], [6,28,50]];
  const ECBITS = { L: 1, M: 0, Q: 3, H: 2 };
  const dataCap = (v, ec) => { const t = EC[ec][v - 1]; return t[1] * t[2] + t[3] * t[4]; };

  /* ── 데이터 코드워드 ─────────────────────────── */
  function encodeData(bytes, v, ec) {
    const cap = dataCap(v, ec) * 8, bits = [];
    const push = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); };
    push(0b0100, 4);
    push(bytes.length, v < 10 ? 8 : 16);
    for (const b of bytes) push(b, 8);
    push(0, Math.min(4, cap - bits.length));
    while (bits.length % 8) bits.push(0);
    const pads = [0xEC, 0x11]; let k = 0;
    while (bits.length < cap) push(pads[k++ & 1], 8);
    const out = [];
    for (let i = 0; i < bits.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; out.push(b); }
    return out;
  }
  function interleave(data, v, ec) {
    const [ecn, g1, d1, g2, d2] = EC[ec][v - 1];
    const blocks = [], ecs = []; let p = 0;
    for (let i = 0; i < g1; i++) { const b = data.slice(p, p + d1); p += d1; blocks.push(b); ecs.push(rsEncode(b, ecn)); }
    for (let i = 0; i < g2; i++) { const b = data.slice(p, p + d2); p += d2; blocks.push(b); ecs.push(rsEncode(b, ecn)); }
    const out = [], maxd = Math.max(d1, d2);
    for (let i = 0; i < maxd; i++) for (const b of blocks) if (i < b.length) out.push(b[i]);
    for (let i = 0; i < ecn; i++) for (const e of ecs) out.push(e[i]);
    return out;
  }

  /* ── 매트릭스 ──────────────────────────────── */
  function buildMatrix(v, codewords) {
    const N = v * 4 + 17;
    const m = Array.from({ length: N }, () => new Array(N).fill(0));
    const fn = Array.from({ length: N }, () => new Array(N).fill(false));
    const set = (r, c, val) => { if (r < 0 || c < 0 || r >= N || c >= N) return; m[r][c] = val ? 1 : 0; fn[r][c] = true; };
    const finder = (r0, c0) => {
      for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
        const on = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6)) || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        set(r0 + r, c0 + c, on);
      }
    };
    finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
    for (let i = 8; i < N - 8; i++) { if (!fn[6][i]) set(6, i, i % 2 === 0); if (!fn[i][6]) set(i, 6, i % 2 === 0); }
    for (const r of ALIGN[v]) for (const c of ALIGN[v]) {
      if ((r === 6 && c === 6) || (r === 6 && c === N - 7) || (r === N - 7 && c === 6)) continue;  // 파인더와 겹치는 3곳만 제외
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }
    set(N - 8, 8, true);
    for (let i = 0; i < 8; i++) { if (!fn[8][i]) set(8, i, false); if (!fn[i][8]) set(i, 8, false); if (!fn[8][N - 1 - i]) set(8, N - 1 - i, false); if (!fn[N - 1 - i][8]) set(N - 1 - i, 8, false); }
    set(8, 8, false);
    if (v >= 7) for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { set(i, N - 11 + j, false); set(N - 11 + j, i, false); }
    const bits = [];
    for (const cw of codewords) for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1);
    let bi = 0, up = true;
    for (let col = N - 1; col > 0; col -= 2) {
      if (col === 6) col = 5;
      for (let k = 0; k < N; k++) {
        const r = up ? N - 1 - k : k;
        for (let dc = 0; dc < 2; dc++) {
          const c = col - dc;
          if (fn[r][c]) continue;
          m[r][c] = bi < bits.length ? bits[bi++] : 0;
        }
      }
      up = !up;
    }
    return { m, fn, N };
  }
  const MASKS = [
    (i, j) => (i + j) % 2 === 0,
    (i, j) => i % 2 === 0,
    (i, j) => j % 3 === 0,
    (i, j) => (i + j) % 3 === 0,
    (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
    (i, j) => (i * j) % 2 + (i * j) % 3 === 0,
    (i, j) => ((i * j) % 2 + (i * j) % 3) % 2 === 0,
    (i, j) => ((i + j) % 2 + (i * j) % 3) % 2 === 0,
  ];
  function applyMask(base, fn, N, k) {
    const out = base.map(r => r.slice());
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (!fn[i][j] && MASKS[k](i, j)) out[i][j] ^= 1;
    return out;
  }
  function formatBits(ec, mask) {
    const data = (ECBITS[ec] << 3) | mask;
    let rem = data << 10;
    for (let i = 14; i >= 10; i--) if ((rem >> i) & 1) rem ^= 0x537 << (i - 10);
    return ((data << 10) | (rem & 0x3ff)) ^ 0x5412;
  }
  function versionBits(v) {
    let rem = v << 12;
    for (let i = 17; i >= 12; i--) if ((rem >> i) & 1) rem ^= 0x1F25 << (i - 12);
    return (v << 12) | (rem & 0xfff);
  }
  function writeFormat(m, N, ec, mask) {
    const f = formatBits(ec, mask);
    for (let i = 0; i < 15; i++) {
      const bit = (f >> i) & 1;
      if (i < 6) m[i][8] = bit; else if (i < 8) m[i + 1][8] = bit; else m[8][14 - i] = bit;
      if (i < 8) m[8][N - 1 - i] = bit; else m[N - 15 + i][8] = bit;
    }
    m[N - 8][8] = 1;
  }
  function writeVersion(m, N, v) {
    if (v < 7) return;
    const b = versionBits(v);
    for (let i = 0; i < 18; i++) { const bit = (b >> i) & 1; const r = Math.floor(i / 3), c = i % 3; m[r][N - 11 + c] = bit; m[N - 11 + c][r] = bit; }
  }
  function penalty(m, N) {
    let s = 0;
    for (let i = 0; i < N; i++) {
      let runR = 1, runC = 1;
      for (let j = 1; j < N; j++) {
        if (m[i][j] === m[i][j - 1]) { runR++; if (runR === 5) s += 3; else if (runR > 5) s++; } else runR = 1;
        if (m[j][i] === m[j - 1][i]) { runC++; if (runC === 5) s += 3; else if (runC > 5) s++; } else runC = 1;
      }
    }
    for (let i = 0; i < N - 1; i++) for (let j = 0; j < N - 1; j++) {
      const a = m[i][j]; if (a === m[i][j + 1] && a === m[i + 1][j] && a === m[i + 1][j + 1]) s += 3;
    }
    const pat = [1, 0, 1, 1, 1, 0, 1];
    const chk = get => {
      for (let k = 0; k <= N - 7; k++) {
        let ok = true;
        for (let t = 0; t < 7; t++) if (get(k + t) !== pat[t]) { ok = false; break; }
        if (!ok) continue;
        const before = k >= 4 && [0, 1, 2, 3].every(t => get(k - 1 - t) === 0);
        const after = k + 10 < N && [0, 1, 2, 3].every(t => get(k + 7 + t) === 0);
        if (before || after) s += 40;
      }
    };
    for (let i = 0; i < N; i++) { chk(j => m[i][j]); chk(j => m[j][i]); }
    let dark = 0; for (const r of m) for (const x of r) dark += x;
    s += Math.floor(Math.abs(dark * 100 / (N * N) - 50) / 5) * 10;
    return s;
  }

  function encode(text, ecLevel) {
    const ec = ecLevel || 'M';
    const bytes = Array.from(new TextEncoder().encode(text));
    let v = 1;
    while (v <= 10 && dataCap(v, ec) < bytes.length + (v < 10 ? 2 : 3)) v++;
    if (v > 10) throw new Error('QR: 데이터가 버전 10 용량을 초과합니다');
    const cw = interleave(encodeData(bytes, v, ec), v, ec);
    const { m, fn, N } = buildMatrix(v, cw);
    let best = null, bestScore = Infinity, bestMask = 0;
    for (let k = 0; k < 8; k++) {
      const mm = applyMask(m, fn, N, k);
      writeFormat(mm, N, ec, k); writeVersion(mm, N, v);
      const sc = penalty(mm, N);
      if (sc < bestScore) { bestScore = sc; best = mm; bestMask = k; }
    }
    return { size: N, modules: best, version: v, ec, mask: bestMask };
  }

  /* ── 렌더 ──────────────────────────────────── */
  function toCanvas(canvas, text, opt) {
    const o = Object.assign({ ec: 'M', px: 256, margin: 4, dark: '#0f172a', light: '#ffffff' }, opt || {});
    const q = encode(text, o.ec);
    const total = q.size + o.margin * 2;
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    canvas.width = o.px * dpr; canvas.height = o.px * dpr;
    canvas.style.width = o.px + 'px'; canvas.style.height = o.px + 'px';
    const c = canvas.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.fillStyle = o.light; c.fillRect(0, 0, canvas.width, canvas.height);
    const cell = canvas.width / total;
    c.fillStyle = o.dark;
    for (let r = 0; r < q.size; r++) for (let col = 0; col < q.size; col++) if (q.modules[r][col]) {
      const x = Math.round((col + o.margin) * cell), y = Math.round((r + o.margin) * cell);
      const x2 = Math.round((col + o.margin + 1) * cell), y2 = Math.round((r + o.margin + 1) * cell);
      c.fillRect(x, y, x2 - x, y2 - y);
    }
    return q;
  }
  function toSVG(text, opt) {
    const o = Object.assign({ ec: 'M', margin: 4, dark: '#0f172a', light: '#ffffff', size: 512 }, opt || {});
    const q = encode(text, o.ec);
    const total = q.size + o.margin * 2;
    let path = '';
    for (let r = 0; r < q.size; r++) for (let col = 0; col < q.size; col++) if (q.modules[r][col]) path += `M${col + o.margin} ${r + o.margin}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${o.size}" height="${o.size}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="${o.light}"/><path d="${path}" fill="${o.dark}"/></svg>`;
  }
  return { encode, toCanvas, toSVG };
})();
