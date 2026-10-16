/* C-13 도면 비교 — 두 타입 나란히 · 줌/이동 동기화 토글 · 면적 차이 요약 · 한쪽 미구매면 미리보기 */
(function () {
  const { $, $$, esc, icon, fmt, qs } = UI;
  UI.init();
  const main = $('#main');
  let a = APT.type(qs('a') || 'c01-84A'), b = APT.type(qs('b') || 'c01-84B');
  if (!a || !b) { a = APT.type('c01-84A'); b = APT.type('c01-84B'); }
  let sync = true; const view = { A: { z: 1, x: 0, y: 0 }, B: { z: 1, x: 0, y: 0 } };

  function pane(key, t) {
    const c = APT.complex(t.complexId); const bought = Store.isPurchased(t.id); const logged = Store.get('role') !== 'guest';
    const sib = APT.allComplexes(Store.get('stress')).flatMap(cx => APT.typesOf(cx.id));
    return `<section class="cmp-pane" data-pane="${key}"><div class="cp-head"><div class="ellip"><strong>${esc(c.name)}</strong> <span style="color:var(--action);font-weight:800">${t.code}</span> <span class="muted-3 body-sm">전용 ${t.exclusive}㎡</span></div>
      <select class="select input-sm" style="width:auto;height:36px" data-pick="${key}" aria-label="${key} 타입 선택">${sib.map(x => `<option value="${x.id}" ${x.id === t.id ? 'selected' : ''}>${APT.complex(x.complexId).name} ${x.code}</option>`).join('')}</select></div>
      <div class="cp-stage" data-stage="${key}">${APT.planSVG(t, bought ? 'full' : 'preview', bought ? { watermark: 'compare · ' + Store.get('profile').email.split('@')[0] } : {})}${bought ? '' : `<div class="cp-lock"><div class="card tac" style="max-width:280px"><div class="caption muted">${logged ? '미구매 타입 — 미리보기로 표시' : '비회원 — 미리보기로 표시'}</div><a class="btn btn-sm btn-primary mt-2" href="plan.html?id=${t.id}">구매하기</a></div></div>`}</div></section>`;
  }
  function render() {
    main.innerHTML = `<div class="page-head" style="margin-top:24px"><div><span class="eyebrow">도면 비교</span><h1 class="h1">${a.code} vs ${b.code}</h1><p class="muted body-sm mt-2">두 도면을 나란히 놓고 같은 배율로 봅니다. 줌·이동을 동기화하면 한쪽을 움직일 때 다른 쪽도 따라갑니다.</p></div>
      <div class="row gap-3"><label class="toggle-row" style="padding:0;gap:8px"><span class="body-sm">줌·이동 동기화</span><button type="button" class="toggle" role="switch" aria-checked="${sync}" data-sync></button></label><button class="btn btn-secondary btn-sm" data-reset>${icon('fit', 'ico-16')} 초기화</button></div></div>
      <div class="cmp">${pane('A', a)}${pane('B', b)}</div>
      <section class="cmp-diff card"><h2 class="h3 mb-4">면적 차이</h2>${diffRows()}<p class="src-caption mt-4">면적은 ㎡ 기준. 막대 길이는 값에 비례하며 두 타입 중 큰 값을 100%로 둡니다.</p></section>`;
    $$('[data-pick]').forEach(s => s.addEventListener('change', () => { if (s.dataset.pick === 'A') a = APT.type(s.value); else b = APT.type(s.value); history.replaceState(null, '', `compare.html?a=${a.id}&b=${b.id}`); render(); }));
    $('[data-sync]').addEventListener('click', e => { sync = !sync; e.currentTarget.setAttribute('aria-checked', String(sync)); });
    $('[data-reset]').addEventListener('click', () => { ['A', 'B'].forEach(k => { view[k] = { z: 1, x: 0, y: 0 }; apply(k); }); });
    ['A', 'B'].forEach(bind);
    setTimeout(() => $$('.cmp-diff .bar>i').forEach(i => i.style.width = i.dataset.w + '%'), 80);
  }
  function diffRows() {
    const rows = [['전용면적', a.exclusive, b.exclusive], ['공급면적', a.supply, b.supply], ['계약면적', a.contract, b.contract], ['방 수', a.rooms, b.rooms], ['욕실 수', a.baths, b.baths]];
    return rows.map(([l, x, y]) => { const mx = Math.max(x, y) || 1; return `<div style="display:grid;grid-template-columns:90px 1fr 1fr;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)"><span class="body-sm muted">${l}</span><div><div class="row-between body-sm"><b>${a.code}</b><span>${typeof x === 'number' && x % 1 ? x.toFixed(2) + '㎡' : x}</span></div><div class="bar"><i data-w="${(x / mx * 100).toFixed(0)}"></i></div></div><div><div class="row-between body-sm"><b>${b.code}</b><span>${typeof y === 'number' && y % 1 ? y.toFixed(2) + '㎡' : y} <span class="${y - x > 0 ? 'up' : y - x < 0 ? 'down' : 'muted-3'}" style="font-weight:700">${y - x === 0 ? '' : (y - x > 0 ? '+' : '') + (y % 1 || x % 1 ? (y - x).toFixed(2) : (y - x))}</span></span></div><div class="bar b"><i data-w="${(y / mx * 100).toFixed(0)}"></i></div></div></div>`; }).join('');
  }
  function apply(k) { const s = $(`[data-stage="${k}"] svg`); const v = view[k]; if (s) s.style.transform = `translate(calc(-50% + ${v.x}px), calc(-50% + ${v.y}px)) scale(${v.z})`; }
  function bind(k) {
    const st = $(`[data-stage="${k}"]`); let drag = null; apply(k);
    st.addEventListener('pointerdown', e => { if (e.target.closest('a,button')) return; drag = { x: e.clientX, y: e.clientY, vx: view[k].x, vy: view[k].y }; st.setPointerCapture(e.pointerId); });
    st.addEventListener('pointermove', e => { if (!drag) return; view[k].x = drag.vx + e.clientX - drag.x; view[k].y = drag.vy + e.clientY - drag.y; if (sync) { const o = k === 'A' ? 'B' : 'A'; view[o].x = view[k].x; view[o].y = view[k].y; apply(o); } apply(k); });
    st.addEventListener('pointerup', () => drag = null);
    st.addEventListener('wheel', e => { e.preventDefault(); view[k].z = Math.min(4, Math.max(.4, view[k].z * (e.deltaY < 0 ? 1.1 : 1 / 1.1))); if (sync) { const o = k === 'A' ? 'B' : 'A'; view[o].z = view[k].z; apply(o); } apply(k); }, { passive: false });
  }
  render();
})();
