/* 제안 노트 — 보증금 비율에 따른 금리 차이 (계산은 API) */
(function () {
  'use strict';
  const { $ } = LTL;
  const dep = $('#dep'), out = $('.pp-w-out');
  let t, seq = 0;
  async function run() {
    const pct = +dep.value, my = ++seq;
    $('#depV').textContent = pct + '%';
    out.classList.add('is-busy');
    try {
      const r = await API.post('/calc/lease', { type: 'lease', price: 80000000, prepay: 0, deposit: 80000000 * pct / 100, residual: 40000000, months: 48, payment: 1250000, startDate: '2026-10-20' });
      if (my !== seq) return;
      const a = r.compare.withoutDeposit, b = r.rate;
      $('#wA').textContent = a.toFixed(2) + '%'; $('#wB').textContent = b.toFixed(2) + '%';
      $('#wC').textContent = (b - a >= 0 ? '+' : '') + (b - a).toFixed(2) + '%p';
    } catch (e) { $('#wB').textContent = '계산 불가'; }
    out.classList.remove('is-busy');
  }
  dep.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 120); });
  run();
})();
