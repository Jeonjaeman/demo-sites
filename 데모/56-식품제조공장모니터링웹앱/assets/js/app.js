/* ONDO — 웹 앱 로직 (상태는 전부 온도 vs 한계 실비교 · 하드코딩 없음) */
(() => {
  const D = window.ONDO;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

  /* ---------- 전역 상태 ---------- */
  let LANG = localStorage.getItem('ondo_lang') || 'ko';
  let FS = localStorage.getItem('ondo_fs') || 'md';
  let CVD = localStorage.getItem('ondo_cvd') === '1';
  const t = k => (D.I18N[LANG] || D.I18N.ko)[k] || k;
  const eqName = eq => eq[LANG] || eq.ko;
  const zName = z => D.ZONES[z][LANG] || D.ZONES[z].ko;

  /* 이탈 시뮬 상태: e5(급속 냉각기)를 이탈시킴 */
  let SIM = false;
  let simTemp = 0;
  const series = {}; D.EQUIP.forEach(eq => series[eq.id] = D.seriesFor(eq));
  const nowTemp = eq => {
    const s = series[eq.id];
    if (SIM && eq.id === 'e5') return +(eq.hi + 1.8 + simTemp).toFixed(1);
    return s[s.length - 1];
  };
  const stateOf = eq => D.judge(eq, nowTemp(eq));

  /* ---------- 아이콘 (신호등: 색+아이콘+텍스트 병행 — 색각 접근성) ---------- */
  const IC = {
    ok: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.6" stroke="currentColor" stroke-width="1.6"/><path d="M5.2 8.2l2 2 3.6-4" stroke="currentColor" stroke-width="1.6"/></svg>',
    warn: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2 15 14H1L8 2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 6.6v3M8 11.6v.6" stroke="currentColor" stroke-width="1.6"/></svg>',
    bad: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2.2" y="2.2" width="11.6" height="11.6" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="currentColor" stroke-width="1.6"/></svg>'
  };
  const stBadge = st => `<span class="st ${st}">${IC[st]}<span>${t('st_' + st)}</span></span>`;

  /* ---------- 토스트 ---------- */
  let toastEl;
  const toast = m => {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = m; toastEl.classList.add('on');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('on'), 2600);
  };

  /* ---------- 캔버스 (dpr 대응) ---------- */
  const setupCanvas = (cv, h) => {
    const dpr = devicePixelRatio || 1;
    const w = cv.clientWidth || cv.parentElement.clientWidth;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    return { ctx, w, h };
  };
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  const spark = (cv, pts, eq) => {
    const { ctx, w, h } = setupCanvas(cv, 44);
    const min = Math.min(...pts), max = Math.max(...pts), pad = 4;
    const x = i => i / (pts.length - 1) * w;
    const y = v => h - pad - (v - min) / ((max - min) || 1) * (h - pad * 2);
    ctx.clearRect(0, 0, w, h);
    const st = stateOf(eq);
    ctx.strokeStyle = st === 'bad' ? css('--bad') : st === 'warn' ? css('--warn') : css('--accent');
    ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((v, i) => i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))); ctx.stroke();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, ctx.strokeStyle + '33'); grad.addColorStop(1, ctx.strokeStyle + '00');
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
  };

  const bigChart = (cv, pts, eq) => {
    const { ctx, w, h } = setupCanvas(cv, 300);
    const padL = 44, padB = 24, padT = 14;
    const vals = [...pts, eq.lo, eq.hi];
    const min = Math.min(...vals) - 1.5, max = Math.max(...vals) + 1.5;
    const x = i => padL + i / (pts.length - 1) * (w - padL - 8);
    const y = v => padT + (1 - (v - min) / (max - min)) * (h - padT - padB);
    ctx.clearRect(0, 0, w, h);
    /* 그리드·라벨 */
    ctx.strokeStyle = css('--line'); ctx.fillStyle = css('--ink-faint');
    ctx.font = '11px Inter'; ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
      const v = min + (max - min) * g / 4, yy = y(v);
      ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(w - 8, yy); ctx.stroke();
      ctx.fillText(v.toFixed(0) + '°', 8, yy + 4);
    }
    ['00:00', '06:00', '12:00', '18:00', '24:00'].forEach((lab, i) => {
      ctx.fillText(lab, x(i / 4 * (pts.length - 1)) - 12, h - 6);
    });
    /* 한계선 (CL) */
    ctx.setLineDash([6, 5]); ctx.lineWidth = 1.6;
    ctx.strokeStyle = css('--bad');
    [eq.lo, eq.hi].forEach(L => {
      if (eq.type === 'heat' && L === eq.hi) return; // 가열은 하한이 CL
      if (eq.type !== 'heat' && L === eq.lo && eq.type !== 'frozen') return;
      const yy = y(L);
      ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(w - 8, yy); ctx.stroke();
    });
    ctx.setLineDash([]);
    /* 본선 */
    ctx.strokeStyle = css('--accent'); ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((v, i) => i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))); ctx.stroke();
    /* 이탈 포인트 강조 */
    ctx.fillStyle = css('--bad');
    pts.forEach((v, i) => { if (D.judge(eq, v) === 'bad') { ctx.beginPath(); ctx.arc(x(i), y(v), 3.4, 0, 7); ctx.fill(); } });
    /* 현재값 점 */
    const lastV = SIM && eq.id === 'e5' ? nowTemp(eq) : pts[pts.length - 1];
    ctx.fillStyle = css('--accent');
    ctx.beginPath(); ctx.arc(x(pts.length - 1), y(lastV), 4.4, 0, 7); ctx.fill();
  };

  /* ---------- i18n 적용 ---------- */
  const applyI18n = () => {
    $$('[data-i]').forEach(el => { el.textContent = t(el.dataset.i); });
    document.documentElement.lang = LANG;
    $('#brandName').textContent = t('brand');
    $$('#langSeg button, #langSeg2 button').forEach(b => b.classList.toggle('on', b.dataset.lang === LANG));
    $$('#fsSeg button, #fsSeg2 button').forEach(b => b.classList.toggle('on', b.dataset.fs === FS));
    $('#cvdTgl').classList.toggle('on', CVD);
  };

  /* ---------- KPI ---------- */
  const renderKpis = () => {
    const states = D.EQUIP.map(stateOf);
    const n = st => states.filter(s => s === st).length;
    const recs = D.RECORDS.length * 6; // 센서 8대 × 반복 자동기록 (표시용 합산)
    $('#kpis').innerHTML = `
      <div class="kpi"><span>${t('kpi_total')}</span><b data-count="${D.EQUIP.length}">0</b></div>
      <div class="kpi k-ok"><span>${t('kpi_ok')} ${IC.ok.replace('width="15"','width="13"')}</span><b data-count="${n('ok')}">0</b></div>
      <div class="kpi k-warn"><span>${t('kpi_warn')}</span><b data-count="${n('warn')}">0</b></div>
      <div class="kpi k-bad"><span>${t('kpi_bad')}</span><b data-count="${n('bad')}">0</b></div>
      <div class="kpi"><span>${t('kpi_records')}</span><b data-count="${recs}">0</b><div class="sub">AUTO · ${t('chain_ok')}</div></div>`;
    /* 카운트업 */
    $$('#kpis b[data-count]').forEach(el => {
      const end = +el.dataset.count, t0 = performance.now(), dur = 900;
      const tick = now => { const p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      setTimeout(() => el.textContent = end, dur + 150);
    });
  };

  /* ---------- 설비 카드 ---------- */
  const renderEquip = () => {
    $('#equipGrid').innerHTML = D.EQUIP.map(eq => {
      const st = stateOf(eq), tv = nowTemp(eq);
      const lim = eq.type === 'heat' ? `≥ ${eq.lo}℃` : eq.type === 'frozen' ? `≤ ${eq.hi}℃` : `${eq.lo}~${eq.hi}℃`;
      return `<div class="eqCard ${st}" data-eq="${eq.id}">
        <div class="zone">${zName(eq.zone)}</div>
        <h4>${eqName(eq)}</h4>
        <div class="temp">${tv.toFixed(1)}<small>℃</small></div>
        <div class="lim">${t('limit')} ${lim}</div>
        <canvas></canvas>
        <div class="stRow">${stBadge(st)}<span class="ccp">${eq.ccp}</span></div>
      </div>`;
    }).join('');
    $$('#equipGrid .eqCard').forEach(card => {
      const eq = D.EQUIP.find(e => e.id === card.dataset.eq);
      spark(card.querySelector('canvas'), series[eq.id].slice(-48), eq);
      card.addEventListener('click', () => openDetail(eq.id));
    });
  };

  /* ---------- 공장 현장도 ---------- */
  const renderFloor = () => {
    const zoneOrder = ['in', 'prep', 'heat', 'cool', 'pack', 'store'];
    $('#floor').innerHTML = zoneOrder.map(z => {
      const eqs = D.EQUIP.filter(e => e.zone === z);
      return `<div class="zoneBox"><div class="zName"><i></i>${zName(z)}</div>
        ${eqs.map(eq => { const st = stateOf(eq);
          return `<div class="tag ${st}" data-eq="${eq.id}"><span>${nowTemp(eq).toFixed(1)}℃</span>${IC[st]}</div>`; }).join('')}
      </div>`;
    }).join('');
    $$('#floor .tag').forEach(tag => tag.addEventListener('click', () => openDetail(tag.dataset.eq)));
  };

  /* ---------- 알림 피드 ---------- */
  const liveAlerts = [];
  const renderFeed = () => {
    const rows = [...liveAlerts, ...D.ALERTS];
    $('#feed').innerHTML = rows.map(a =>
      `<div class="item ${a.type}"><span class="t">${a.time}</span><div class="msg">${a[LANG] || a.ko}</div></div>`).join('');
    const unread = liveAlerts.length;
    $('#bellBadge').style.display = unread ? 'grid' : 'none';
    $('#bellBadge').textContent = unread;
  };

  /* ---------- 설비 상세 ---------- */
  let curEq = null;
  const openDetail = id => {
    curEq = D.EQUIP.find(e => e.id === id);
    switchView('det');
    renderDetail();
  };
  const renderDetail = () => {
    if (!curEq) return;
    const eq = curEq, st = stateOf(eq), tv = nowTemp(eq);
    $('#detName').textContent = eqName(eq);
    $('#detSt').innerHTML = stBadge(st);
    $('#detTemp').textContent = tv.toFixed(1);
    $('#detTemp').style.color = st === 'bad' ? css('--bad') : st === 'warn' ? css('--warn') : css('--ink');
    const lim = eq.type === 'heat' ? `CL ≥ ${eq.lo}℃` : eq.type === 'frozen' ? `CL ≤ ${eq.hi}℃` : `CL ${eq.lo}~${eq.hi}℃`;
    $('#detLim').textContent = lim;
    bigChart($('#detChart'), series[eq.id], eq);
    $('#detLegend').innerHTML = `
      <span><i style="background:${css('--accent')}"></i>${eqName(eq)}</span>
      <span><i style="background:${css('--bad')}"></i>${t('limit')} (CL)</span>`;
    $('#ccpInfo').innerHTML = `
      <div class="row"><span>CCP</span><span>${eq.ccp}</span></div>
      <div class="row"><span>${t('limit')}</span><span>${lim}</span></div>
      <div class="row"><span>Zone</span><span>${zName(eq.zone)}</span></div>
      <div class="row"><span>Sensor</span><span>SN-${eq.id.toUpperCase()}4${eq.id.slice(1)}2 · RS-485</span></div>
      <div class="row"><span>Interval</span><span>10 min · AUTO</span></div>`;
    const devs = D.DEVIATIONS.filter(d => d.eq === eq.id);
    $('#devList').innerHTML = devs.length ? devs.map(d => `
      <div class="dev"><div class="top"><span>${d.date}</span><span style="color:var(--bad);font-weight:700">${d.temp}℃</span></div>
      <div class="act">${d.action[LANG] || d.action.ko} <span style="color:var(--ink-faint)">— ${d.by}</span></div></div>`).join('')
      : `<div class="dev"><div class="act" style="color:var(--ink-faint)">${t('all_ok')}</div></div>`;
    /* 해시 체인 */
    const rows = D.RECORDS.filter(r => r.eq === eq.id).slice(-4);
    $('#chainBox').innerHTML = (rows.length ? rows : D.RECORDS.slice(-4)).map(r => `
      <div class="crow"><span class="h">#${r.hash}</span><span class="arrow">←</span><span class="h" style="color:var(--ink-faint)">#${r.prev.slice(0, 8)}</span>
      <span class="meta">${r.time.slice(11)} · ${r.temp}℃ · ${r.by}</span></div>`).join('')
      + `<span class="verify">${IC.ok} ${t('chain_ok')}</span>`;
  };

  /* ---------- 점검 ---------- */
  const inspState = {};
  const renderInspect = () => {
    $('#inspList').innerHTML = D.INSPECTION.map((q, i) => `
      <div class="inspRow">
        <span class="q">${i + 1}. ${q[LANG] || q.ko}</span>
        <div class="triBtns" data-q="${i}">
          <button class="ok ${inspState[i] === 'ok' ? 'sel' : ''}">${IC.ok}<span>${t('st_ok')}</span></button>
          <button class="warn ${inspState[i] === 'warn' ? 'sel' : ''}">${IC.warn}<span>${t('st_warn')}</span></button>
          <button class="bad ${inspState[i] === 'bad' ? 'sel' : ''}">${IC.bad}<span>${t('st_bad')}</span></button>
        </div>
      </div>`).join('');
    $$('#inspList .triBtns').forEach(g => {
      g.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        inspState[g.dataset.q] = b.classList.contains('ok') ? 'ok' : b.classList.contains('warn') ? 'warn' : 'bad';
        renderInspect(); updateInspFoot();
      });
    });
    updateInspFoot();
  };
  const updateInspFoot = () => {
    const done = Object.keys(inspState).length, total = D.INSPECTION.length;
    $('#inspBar').style.width = (done / total * 100) + '%';
    $('#inspCount').textContent = `${done} / ${total}`;
    $('#inspSave').disabled = done < total;
  };
  $('#inspSave').addEventListener('click', () => toast(t('inspect_done')));

  /* ---------- 리포트 ---------- */
  const renderReport = () => {
    const today = '2026-08-07';
    $('#repSheet').innerHTML = `
      <h3>CCP 모니터링 일일 기록부</h3>
      <div class="meta">${t('factory')} · ${today} · ${t('chain_ok')} <span class="stamp">SMART HACCP</span></div>
      <table>
        <thead><tr><th>시각</th><th>설비</th><th>CCP</th><th>측정값</th><th>한계기준</th><th>판정</th><th>기록 해시</th></tr></thead>
        <tbody>${D.RECORDS.map(r => { const eq = D.EQUIP.find(e => e.id === r.eq);
          const lim = eq.type === 'heat' ? `≥${eq.lo}℃` : eq.type === 'frozen' ? `≤${eq.hi}℃` : `${eq.lo}~${eq.hi}℃`;
          const ok = D.judge(eq, r.temp) === 'ok';
          return `<tr><td>${r.time.slice(11)}</td><td>${eq.ko}</td><td>${eq.ccp}</td><td>${r.temp}℃</td><td>${lim}</td>
          <td style="color:${ok ? '#0a7d40' : '#c0262d'};font-weight:700">${ok ? '적합' : '부적합'}</td>
          <td style="font-family:monospace">#${r.hash}</td></tr>`; }).join('')}</tbody>
      </table>
      <div class="sign"><span>기록: AUTO-SENSOR (자동)</span><span>확인: 박품질 (인)</span><span>승인: 김공장 (인)</span></div>
      <p style="margin-top:14px;font-size:11.5px;color:#999">본 문서는 데모이며 모든 데이터는 가상입니다. 전자기록은 해시 체인으로 위·변조가 방지됩니다.</p>`;
  };
  $('#repPdf').addEventListener('click', () => window.print());
  $('#repCsv').addEventListener('click', () => {
    const esc = v => `"${String(v).replace(/"/g, '""')}"`;
    const head = ['시각', '설비', 'CCP', '측정값(℃)', '판정', '해시'];
    const rows = D.RECORDS.map(r => { const eq = D.EQUIP.find(e => e.id === r.eq);
      return [r.time, eq.ko, eq.ccp, r.temp, D.judge(eq, r.temp) === 'ok' ? '적합' : '부적합', r.hash]; });
    const body = [head, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'ccp_records_20260807.csv'; a.click(); URL.revokeObjectURL(a.href);
    toast('ccp_records_20260807.csv ⬇');
  });

  /* ---------- 설정 ---------- */
  const renderSettings = () => {
    const noti = [['push', true], ['sms', true], ['kakao', false]];
    $('#notiRows').innerHTML = noti.map(([k, on]) => `
      <div class="setRow"><div class="lab"><b>${t(k)}</b></div>
      <button class="tgl ${on ? 'on' : ''}" data-noti="${k}"></button></div>`).join('');
    $$('#notiRows .tgl').forEach(b => b.addEventListener('click', () => b.classList.toggle('on')));
    $('#roleTable').innerHTML = `
      <thead><tr><th>USER</th><th>ROLE</th><th>SCOPE</th></tr></thead>
      <tbody>
        <tr><td>김공장</td><td><span class="roleTag">${t('role_admin')}</span></td><td>전체 · 설정 · 승인</td></tr>
        <tr><td>박품질</td><td><span class="roleTag">${t('role_qa')}</span></td><td>기록 확인 · 리포트</td></tr>
        <tr><td>응우옌 반 안</td><td><span class="roleTag">${t('role_field')}</span></td><td>모니터링 · 점검 입력</td></tr>
      </tbody>`;
  };

  /* ---------- 이탈 시뮬레이션 (최소 조작 동선: 알림 → 카드 → 조치 → 복귀) ---------- */
  const push = (title, body) => {
    $('#pushTitle').textContent = title;
    $('#pushBody').textContent = body;
    $('#pushBanner').classList.add('on');
    clearTimeout(window._pt); window._pt = setTimeout(() => $('#pushBanner').classList.remove('on'), 5000);
  };
  $('#simBtn').addEventListener('click', () => {
    if (!SIM) {
      SIM = true; simTemp = 0;
      const eq = D.EQUIP.find(e => e.id === 'e5');
      liveAlerts.unshift({ time: '15:02', eq: 'e5', type: 'bad',
        ko: `⚠ ${eq.ko} 한계 이탈 — ${nowTemp(eq)}℃ (CL ${eq.lo}~${eq.hi}℃). 개선조치를 입력하세요`,
        en: `⚠ ${eq.en} deviation — ${nowTemp(eq)}℃`, vi: `⚠ ${eq.vi} vượt ngưỡng — ${nowTemp(eq)}℃` });
      push(t('kpi_bad') + ' — ' + eqName(eq), `${nowTemp(eq)}℃ · CL ${eq.lo}~${eq.hi}℃ · ${t('act_note')}`);
      $('#simBtn').innerHTML = '✓ ' + t('simulating');
      renderAll();
      /* 이탈 흐름: 카드 클릭 → 상세 → 복귀 모달 */
      openDetail('e5');
      setTimeout(() => {
        $('#mActDesc').textContent = `${eqName(eq)} — ${nowTemp(eq)}℃ / CL ${eq.lo}~${eq.hi}℃`;
        $('#mActText').value = LANG === 'ko' ? '냉각팬 필터 점검·교체. 해당 배치 격리 후 품질검사 의뢰.' : 'Filter checked/replaced. Batch quarantined for QA.';
        $('#mAct').classList.add('on');
      }, 900);
    }
  });
  $('#mActCancel').addEventListener('click', () => $('#mAct').classList.remove('on'));
  $('#mAct').addEventListener('click', e => { if (e.target === $('#mAct')) $('#mAct').classList.remove('on'); });
  $('#mActSave').addEventListener('click', () => {
    $('#mAct').classList.remove('on');
    SIM = false;
    const eq = D.EQUIP.find(e => e.id === 'e5');
    liveAlerts.unshift({ time: '15:07', eq: 'e5', type: 'ok',
      ko: `${eq.ko} 정상 복귀 — 개선조치 전자기록 저장 (#${D.hash8('act' + Date.now())})`,
      en: `${eq.en} recovered — action recorded`, vi: `${eq.vi} phục hồi — đã ghi nhận` });
    $('#simBtn').innerHTML = '⚡ <span>' + t('simulate') + '</span>';
    toast(t('chain_ok'));
    renderAll();
    if (curEq?.id === 'e5') renderDetail();
  });
  $('#bellBtn').addEventListener('click', () => { switchView('dash'); $('#feed').scrollIntoView({ behavior: 'smooth', block: 'center' }); });

  /* ---------- 뷰 전환 ---------- */
  const switchView = v => {
    $$('.view').forEach(x => x.classList.toggle('on', x.id === 'v-' + v));
    $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.v === v || (v === 'det' && b.dataset.v === 'dash')));
    if (v === 'rep') renderReport();
  };
  $('#nav').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; switchView(b.dataset.v);
  });
  $('#detBack').addEventListener('click', () => switchView('dash'));

  /* ---------- 언어·글자크기·색각 토글 ---------- */
  const setLang = l => { LANG = l; localStorage.setItem('ondo_lang', l); renderAll(); };
  const setFs = f => { FS = f; localStorage.setItem('ondo_fs', f); document.documentElement.dataset.fs = f; applyI18n(); rerenderCharts(); };
  $$('#langSeg button, #langSeg2 button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $$('#fsSeg button, #fsSeg2 button').forEach(b => b.addEventListener('click', () => setFs(b.dataset.fs)));
  $('#cvdTgl').addEventListener('click', () => {
    CVD = !CVD; localStorage.setItem('ondo_cvd', CVD ? '1' : '0');
    document.documentElement.dataset.cvd = CVD ? '1' : '';
    applyI18n(); renderAll();
  });

  const rerenderCharts = () => {
    $$('#equipGrid .eqCard').forEach(card => {
      const eq = D.EQUIP.find(e => e.id === card.dataset.eq);
      spark(card.querySelector('canvas'), series[eq.id].slice(-48), eq);
    });
    if ($('#v-det').classList.contains('on')) renderDetail();
  };

  /* ---------- 전체 렌더 ---------- */
  const renderAll = () => {
    applyI18n(); renderKpis(); renderEquip(); renderFloor(); renderFeed(); renderInspect(); renderSettings();
    if ($('#v-det').classList.contains('on')) renderDetail();
    if ($('#v-rep').classList.contains('on')) renderReport();
  };

  /* ---------- 초기화 ---------- */
  document.documentElement.dataset.fs = FS;
  if (CVD) document.documentElement.dataset.cvd = '1';
  renderAll();
  addEventListener('resize', () => { clearTimeout(window._rz); window._rz = setTimeout(rerenderCharts, 200); });

  /* 라이브 틱 — 마지막 포인트 미세 변동 (실시간 감각) */
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setInterval(() => {
      D.EQUIP.forEach(eq => {
        const s = series[eq.id];
        const drift = (Math.random() - .5) * .15;
        s[s.length - 1] = +(s[s.length - 1] + drift).toFixed(1);
      });
      if ($('#v-dash').classList.contains('on') && !document.hidden) { renderEquip(); renderFloor(); }
    }, 5000);
  }
})();
