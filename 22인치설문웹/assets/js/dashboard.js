/* 실시간 통계 대시보드 */
(() => {
  NX.ensureSeed();
  NX.fitStage('.stage');
  NX.fullscreenToggle(document.getElementById('btn-fs'));

  const $ = id => document.getElementById(id);

  function bars(el, labels, counts, alt) {
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    el.innerHTML = '';
    labels.forEach((lb, i) => {
      const pct = Math.round(counts[i] / total * 100);
      const row = document.createElement('div');
      row.className = 'mini-bar-item' + (alt ? ' alt' : '');
      row.innerHTML =
        '<span class="lb" title="' + lb + '">' + lb + '</span>' +
        '<span class="tk"><span class="fl" style="width:' + pct + '%"></span></span>' +
        '<span class="vl">' + pct + '% <small>(' + counts[i] + ')</small></span>';
      el.appendChild(row);
    });
  }

  function render() {
    const t = NX.totals();
    $('kpi-all').innerHTML = t.all + '<small> 명</small>';
    $('kpi-k1').innerHTML = t.k1 + '<small> 건</small>';
    $('kpi-k2').innerHTML = t.k2 + '<small> 건</small>';
    $('last-ts').textContent = t.last
      ? new Date(t.last).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '—';

    const k2 = NX.countK2();
    const topIdx = k2.indexOf(Math.max(...k2));
    $('kpi-top').textContent = k2[topIdx] > 0
      ? NX.K2_FEATURES[topIdx].icon + ' ' + NX.K2_FEATURES[topIdx].tag
      : '—';

    bars($('chart-k2'), NX.K2Q.options, k2);
    bars($('chart-q1'), NX.K1Q[0].options, NX.countK1(0));
    bars($('chart-q2'), NX.K1Q[1].options, NX.countK1(1));
    bars($('chart-q3'), NX.K1Q[2].options, NX.countK1(2));
    bars($('chart-q4'), NX.K1Q[3].options, NX.countK1(3), true);
  }

  document.getElementById('btn-demo').addEventListener('click', () => {
    NX.addDemoBurst(5);
    render();
  });

  NX.onChange(render);
  render();
})();
