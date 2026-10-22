/* 미래 승계시점 예상 가격 그래프 (SVG) — 서버가 준 점들만 그린다 (감가 함수는 내려오지 않음) */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  function draw(el, pts, { height = 250, animate = true } = {}) {
    if (!pts || !pts.length) { el.innerHTML = ''; return; }
    const W = Math.max(280, el.clientWidth || 600), H = height, padL = 46, padR = 24, padT = 34, padB = 40;
    const vals = pts.map((p) => p.value);
    let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    const span = Math.max(100, hi - lo); lo -= span * 0.18; hi += span * 0.2;
    const step = (() => { const raw = (hi - lo) / 4; const pow = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / pow; return (n < 1.5 ? 1 : n < 3.5 ? 2.5 : n < 7.5 ? 5 : 10) * pow; })();
    const x = (i) => padL + (W - padL - padR) * (i / Math.max(1, pts.length - 1));
    const y = (v) => padT + (H - padT - padB) * (1 - (v - lo) / (hi - lo));
    const k = pts.length - 1;
    const marks = [0]; for (let t = 12; t < k; t += 12) marks.push(t); if (k > 0) marks.push(k);
    const maxI = vals.indexOf(Math.max(...vals));
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
    const zero = y(0);
    const area = `${line}L${x(k).toFixed(1)},${zero.toFixed(1)}L${x(0).toFixed(1)},${zero.toFixed(1)}Z`;
    const ticks = []; for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) ticks.push(v);
    const id = 'fc' + Math.random().toString(36).slice(2, 7);
    const fmt = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString('ko-KR');
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="미래 승계시점 예상 손익 그래프, 현재 ${fmt(vals[0])}만원, 마지막 회차 ${fmt(vals[k])}만원">
      <defs><clipPath id="${id}p"><rect x="0" y="0" width="${W}" height="${zero}"/></clipPath><clipPath id="${id}n"><rect x="0" y="${zero}" width="${W}" height="${H}"/></clipPath>
      <clipPath id="${id}r"><rect x="0" y="0" width="${animate ? 0 : W}" height="${H}">${animate ? `<animate attributeName="width" from="0" to="${W}" dur="1.1s" fill="freeze" calcMode="spline" keySplines=".2 .7 .2 1" keyTimes="0;1"/>` : ''}</rect></clipPath></defs>
      ${ticks.map((v) => `<g><line x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? '#9AA59F' : '#E6E9E6'}" stroke-dasharray="${v === 0 ? '0' : '4 4'}"/><text x="${padL - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11.5" fill="#6A716C" font-weight="${v === 0 ? 700 : 500}">${fmt(Math.round(v))}</text></g>`).join('')}
      <g clip-path="url(#${id}r)">
        <path d="${area}" fill="#DCEBE4" opacity=".75" clip-path="url(#${id}p)"/>
        <path d="${area}" fill="#F6DED8" opacity=".75" clip-path="url(#${id}n)"/>
        <path d="${line}" fill="none" stroke="#2F6B55" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
      </g>
      ${marks.map((i, n) => { const p = pts[i], pos = p.value >= 0; return `<g class="fc-pt" style="animation-delay:${animate ? 300 + n * 140 : 0}ms">
        <circle cx="${x(i)}" cy="${y(p.value)}" r="${i === maxI ? 7 : 5.5}" fill="#fff" stroke="${pos ? '#1F7A52' : '#B03A22'}" stroke-width="2.4"/>
        <circle cx="${x(i)}" cy="${y(p.value)}" r="2.6" fill="${pos ? '#1F7A52' : '#B03A22'}"/>
        <text x="${x(i)}" y="${y(p.value) + (pos ? -12 : 22)}" text-anchor="middle" font-size="12.5" font-weight="800" fill="${pos ? '#1F7A52' : '#B03A22'}">${fmt(p.value)}</text></g>`; }).join('')}
      ${maxI > 0 ? `<g class="fc-pt" style="animation-delay:${animate ? 1100 : 0}ms"><rect x="${x(maxI) - 18}" y="${Math.max(2, y(vals[maxI]) - 40)}" width="36" height="18" rx="9" fill="#163E30"/><text x="${x(maxI)}" y="${Math.max(2, y(vals[maxI]) - 40) + 12.5}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">최대</text></g>` : ''}
      ${marks.map((i) => i === 0 ? `<g><rect x="${x(0) - 19}" y="${H - 26}" width="38" height="18" rx="9" fill="#163E30"/><text x="${x(0)}" y="${H - 13}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">현재</text></g>` : `<text x="${x(i)}" y="${H - 12}" text-anchor="middle" font-size="11.5" fill="#4D5550" font-weight="600">${pts[i].label || ''}</text>`).join('')}
    </svg>`;
  }
  function mount(el, pts, opts) {
    draw(el, pts, opts);
    let t, w0 = el.clientWidth; const ro = new ResizeObserver(() => { if (Math.abs(el.clientWidth - w0) < 2) return; w0 = el.clientWidth; clearTimeout(t); t = setTimeout(() => draw(el, pts, { ...opts, animate: false }), 120); });
    ro.observe(el);
    return { update: (p) => { pts = p; draw(el, pts, { ...opts, animate: false }); } };
  }
  window.ForecastChart = { draw, mount };
})();
