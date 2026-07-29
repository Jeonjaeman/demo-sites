/* =====================================================================
   QWALL 큐월 — 운영 콘솔 (admin.html)
   자동 새로고침 · ETL 통합 규칙(중복 제거·코드 통일) · 실패비용 기준 · 열람 권한
   ===================================================================== */
(function () {
  'use strict';
  var QW = window.QW;
  var recs = QW.records();
  var ops = QW.loadOps();

  function $(s, r) { return (r || document).querySelector(s); }
  function h(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  var app = $('#app');

  function toast(msg, kind) {
    var t = h('<div class="toast ' + (kind || '') + '"><span class="dot"></span><span>' + msg + '</span></div>');
    $('#toasts').appendChild(t); requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, 3200);
  }
  function modal(title, body, foot) {
    var ov = h('<div class="ov"><div class="modal"><div class="modal-h"><h3>' + title + '</h3><button class="x">✕</button></div><div class="modal-b">' + body + '</div>' + (foot ? '<div class="modal-f">' + foot + '</div>' : '') + '</div></div>');
    $('#modalRoot').appendChild(ov); requestAnimationFrame(function () { ov.classList.add('on'); });
    function close() { ov.classList.remove('on'); setTimeout(function () { ov.remove(); }, 220); }
    ov.querySelector('.x').onclick = close; ov.onclick = function (e) { if (e.target === ov) close(); };
    return { ov: ov, close: close };
  }
  function save() { QW.saveOps(ops); }

  var routes = { ops: viewOps, rules: viewRules, cost: viewCost, access: viewAccess };
  function router() {
    ops = QW.loadOps();
    var name = (location.hash.replace(/^#\//, '') || 'ops').split('/')[0];
    document.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#/' + name); });
    window.scrollTo(0, 0); (routes[name] || viewOps)();
    revealAll();
  }
  // 운영 콘솔은 스크롤 리빌 관찰자를 두지 않으므로, 렌더 후 reveal 요소를 반드시 표시(빈 화면 방지).
  function revealAll() { setTimeout(function () { app.querySelectorAll('.reveal:not(.in)').forEach(function (n) { n.classList.add('in'); }); }, 30); }
  window.addEventListener('hashchange', router);
  $('#resetBtn').onclick = function () {
    var mo = modal('설정 초기화', '<p class="muted">ETL 규칙·실패비용 기준·열람 권한·새로고침 상태를 초기값으로 되돌립니다.</p>', '<button class="btn" id="rc">취소</button><button class="btn" style="border-color:#f0c9c4;color:var(--bad)" id="rok">초기화</button>');
    mo.ov.querySelector('#rc').onclick = mo.close;
    mo.ov.querySelector('#rok').onclick = function () { ops = QW.resetOps(); mo.close(); toast('초기화되었습니다.'); router(); };
  };

  /* =====================================================================
     새로고침 · 소스
     ===================================================================== */
  function viewOps() {
    var r = ops.refresh;
    var stale = r.stale || r.status === '실패';
    app.innerHTML =
      '<div class="between" style="margin-bottom:14px"><div><h2 style="font-size:22px">자동 새로고침 · 소스</h2><p class="muted small">온프렘 게이트웨이가 3개 소스를 스케줄에 따라 통합합니다.</p></div>' +
        '<div class="center"><button class="btn" id="failBtn">⚠ 새로고침 실패 재현</button><button class="btn pri" id="runBtn">▶ 지금 새로고침</button></div></div>' +
      '<div class="banner ' + (stale ? 'bad' : 'ok') + '" style="margin-bottom:14px">' + (stale ? '🔴 마지막 새로고침 실패 — 대시보드는 이전 데이터(' + QW.fmtDT(r.lastAt) + ')를 유지 중입니다. 재실행이 필요합니다.' : '🟢 정상 — 마지막 새로고침 ' + QW.fmtDT(r.lastAt) + ' · 스케줄 ' + r.schedule) + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1.1fr;gap:14px" class="dash-grid">' +
        '<div class="card"><div class="card-h"><h3>소스 연결 상태</h3></div><div class="card-b">' +
          srcRow('ERP', '수입/완성검사 · 합부 · 품목 · S오더', 'DB 직접 접근(읽기 전용)', r.sources.ERP) +
          srcRow('QMS', '부적합 등록 · NCR · 실패비용 · F오더', 'DB 직접 접근(읽기 전용)', r.sources.QMS) +
          srcRow('Excel', 'ITP 성적서 정합성', '네트워크 공유 경로 · 일간 갱신', r.sources.Excel) +
        '</div></div>' +
        '<div class="card"><div class="card-h"><h3>새로고침 이력</h3><span class="small muted">스케줄 ' + r.schedule + '</span></div><div class="card-b" style="padding:4px 0;max-height:320px;overflow:auto">' +
          r.history.slice().reverse().map(function (hh) { return '<div class="between" style="padding:9px 18px;border-bottom:1px solid var(--line2)"><div><span class="badge ' + (hh.status === '완료' ? 'b-ok' : 'b-bad') + '">' + hh.status + '</span> <span class="small muted">' + QW.fmtDT(hh.at) + '</span>' + (hh.note ? '<div class="tiny" style="color:var(--bad)">' + hh.note + '</div>' : '') + '</div><span class="small mono muted">' + hh.rows + ' rows</span></div>'; }).join('') +
        '</div></div>' +
      '</div>' +
      '<div class="card pad reveal" style="margin-top:14px"><h3 style="font-size:15px;margin-bottom:6px">왜 “이전 데이터 유지”가 중요한가</h3>' +
        '<p class="small muted">무인 대형 모니터에 상시 표출되는 화면은, 새로고침이 실패해도 <b>겉으로는 정상처럼 보입니다</b>. 오래된 데이터로 품질 판단을 내리는 것을 막기 위해 QWALL은 실패 시 대시보드·현황판에 <b>명시적 stale 경고</b>를 띄우고 마지막 성공 시각을 표기합니다.</p></div>';

    $('#runBtn').onclick = function () { runRefresh(false); };
    $('#failBtn').onclick = function () { runRefresh(true); };
  }
  function srcRow(name, desc, conn, st) {
    return '<div class="between" style="padding:11px 0;border-bottom:1px solid var(--line2)"><div><b>' + name + '</b> <span class="small muted">' + desc + '</span><div class="tiny faint">' + conn + '</div></div><span class="badge ' + (st === '완료' ? 'b-ok' : st === '실패' ? 'b-bad' : 'b-warn') + '">' + st + '</span></div>';
  }
  function runRefresh(fail) {
    var r = ops.refresh;
    r.status = '진행'; toast('소스 추출 → 정제·통합 실행 중…');
    var seq = ['ERP', 'QMS', 'Excel'];
    r.sources = { ERP: '대기', QMS: '대기', Excel: '대기' };
    save();
    seq.forEach(function (s, i) {
      setTimeout(function () {
        r.sources[s] = (fail && s === 'QMS') ? '실패' : '완료'; save();
        if (i === seq.length - 1) {
          setTimeout(function () {
            if (fail) {
              r.status = '실패'; r.stale = true;
              r.history.push({ at: QW.nowMinus(0), status: '실패', rows: 0, note: 'QMS 게이트웨이 응답 지연 — 이전 데이터 유지' });
              toast('새로고침 실패 — 이전 데이터를 유지합니다. 대시보드에 경고 표시.', 'err');
            } else {
              r.status = '완료'; r.stale = false; r.lastAt = QW.nowMinus(0);
              r.sources = { ERP: '완료', QMS: '완료', Excel: '완료' };
              r.history.push({ at: r.lastAt, status: '완료', rows: 820 + Math.floor(Date.now() % 20), note: '' });
              toast('새로고침 완료 — 3개 소스 통합 반영됨', 'ok');
            }
            if (r.history.length > 12) r.history = r.history.slice(-12);
            save(); router();
          }, 400);
        }
      }, 350 * (i + 1));
    });
  }

  /* =====================================================================
     ETL 통합 규칙
     ===================================================================== */
  function viewRules() {
    var c = QW.compute(recs, {}, ops.settings);
    var cNaive = QW.compute(recs, {}, Object.assign({}, ops.settings, { dedup: false }));
    var cNoUnify = QW.compute(recs, {}, Object.assign({}, ops.settings, { codeUnify: false }));
    app.innerHTML =
      '<h2 style="font-size:22px;margin-bottom:4px">통합 규칙</h2><p class="muted small" style="margin-bottom:16px">여기서 켜고 끄는 규칙은 대시보드 14개 KPI에 즉시 반영됩니다.</p>' +
      '<div class="card pad reveal" style="margin-bottom:14px"><div class="between"><div><b style="font-size:15px">ERP·QMS 오더 매핑 중복 제거</b><p class="small muted" style="margin-top:4px">같은 부적합이 ERP(S오더)와 QMS(F오더)에 각각 등록되면 이중 계상됩니다. S오더-F오더 매핑으로 유니크 건만 집계합니다.</p></div>' + toggle('dedup') + '</div>' +
        '<div class="divider"></div><div class="wrap-g">' +
          stat('원시 합산(중복 포함)', cNaive.defectCountNaive + '건', 'bad') +
          stat('중복 제거 후', c.defectCountDedup + '건', 'ok') +
          stat('현재 적용값', (ops.settings.dedup ? c.defectCountDedup : cNaive.defectCountNaive) + '건', ops.settings.dedup ? 'ok' : 'bad') +
          stat('부풀림', ops.settings.dedup ? '없음' : ('+' + Math.round((cNaive.defectCountNaive / c.defectCountDedup - 1) * 100) + '%'), ops.settings.dedup ? 'info' : 'bad') +
        '</div></div>' +
      '<div class="card pad reveal"><div class="between"><div><b style="font-size:15px">ERP·QMS 부적합 유형 코드 통일</b><p class="small muted" style="margin-top:4px">두 시스템의 유형 코드 체계가 달라(예: “용접” vs “W-용접”) 통일하지 않으면 같은 유형이 별도 카테고리로 쪼개져 분석이 왜곡됩니다.</p></div>' + toggle('codeUnify') + '</div>' +
        '<div class="divider"></div><div class="wrap-g">' +
          stat('통일 시 유형 수', QW.compute(recs, {}, Object.assign({}, ops.settings, { codeUnify: true })).typeDist.length + '종', 'ok') +
          stat('미통일 시 유형 수', cNoUnify.typeDist.length + '종', 'bad') +
          stat('현재 적용', ops.settings.codeUnify ? '통일 적용(정상)' : '미통일 — 카테고리 분산', ops.settings.codeUnify ? 'ok' : 'bad') +
        '</div></div>';
    wireToggles(viewRules);
  }
  function toggle(key) {
    return '<label class="switch"><input type="checkbox" data-tg="' + key + '"' + (ops.settings[key] ? ' checked' : '') + ' /><span class="track"></span></label>';
  }
  function wireToggles(rerender) {
    app.querySelectorAll('[data-tg]').forEach(function (t) { t.onchange = function () { ops.settings[t.getAttribute('data-tg')] = t.checked; save(); toast('규칙이 저장되어 대시보드에 반영됩니다.'); rerender(); revealAll(); }; });
  }
  function stat(label, val, tone) {
    return '<div class="card pad" style="flex:1;min-width:150px;box-shadow:none"><div class="small muted">' + label + '</div><div style="font-size:19px;font-weight:800;margin-top:4px;color:var(--' + (tone === 'bad' ? 'bad' : tone === 'ok' ? 'ok' : 'info') + ')">' + val + '</div></div>';
  }

  /* =====================================================================
     실패비용 기준
     ===================================================================== */
  function viewCost() {
    var c = QW.compute(recs, {}, ops.settings);
    app.innerHTML =
      '<h2 style="font-size:22px;margin-bottom:4px">실패비용 산정 기준</h2><p class="muted small" style="margin-bottom:16px">부적합 처분별 단가입니다. 합의된 기준으로 집계되어 대시보드 실패비용 KPI에 즉시 반영됩니다.</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start" class="dash-grid">' +
        '<div class="card"><div class="card-h"><h3>처분별 단가(건당)</h3><button class="btn sm pri" id="saveCost">저장</button></div><div class="card-b"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>처분</th><th>설명</th><th class="num">단가(원)</th></tr></thead><tbody>' +
          QW.DISPOSITIONS.map(function (d) { return '<tr><td class="name">' + d + '</td><td class="small muted">' + dispDesc(d) + '</td><td class="num"><input class="inp mono" type="number" data-cost="' + d + '" value="' + ops.settings.cost[d] + '" style="width:120px;text-align:right" /></td></tr>'; }).join('') +
        '</tbody></table></div></div></div>' +
        '<div class="card pad"><h3 style="font-size:15px;margin-bottom:10px">현재 기준 집계 결과(전체)</h3>' +
          '<div class="between" style="padding:10px 0;border-bottom:1px solid var(--line2)"><span>총 실패비용</span><b style="font-size:20px;color:var(--bad)">' + QW.won(c.kpi.failCost) + '</b></div>' +
          '<div class="between" style="padding:10px 0;border-bottom:1px solid var(--line2)"><span class="muted">부적합 건수</span><b>' + c.defectCountDedup + '건</b></div>' +
          '<div class="between" style="padding:10px 0"><span class="muted">건당 평균</span><b>' + QW.won(c.kpi.avgFailCost) + '</b></div>' +
          '<div class="banner info" style="margin-top:12px">단가를 바꾸고 저장하면 대시보드의 실패비용·건당 실패비용 KPI가 즉시 재계산됩니다.</div>' +
        '</div>' +
      '</div>';
    $('#saveCost').onclick = function () {
      app.querySelectorAll('[data-cost]').forEach(function (inp) { ops.settings.cost[inp.getAttribute('data-cost')] = Math.max(0, parseInt(inp.value, 10) || 0); });
      save(); toast('실패비용 기준이 저장되어 대시보드에 반영됩니다.', 'ok'); viewCost();
    };
  }
  function dispDesc(d) { return { '재작업': '수리·재가공 공수', '폐기': '자재 손실·폐기 처리', '반품': '반품 물류·행정', '특채': '조건부 수용(감액)' }[d] || ''; }

  /* =====================================================================
     열람 권한
     ===================================================================== */
  function viewAccess() {
    app.innerHTML =
      '<div class="between" style="margin-bottom:14px"><div><h2 style="font-size:22px">열람 권한</h2><p class="muted small">게시된 대시보드는 아래 지정 계정만 열람할 수 있습니다.</p></div><button class="btn pri" id="addBtn">＋ 계정 추가</button></div>' +
      '<div class="card"><div class="card-b" style="padding:6px 0">' +
        ops.settings.viewers.map(function (v) { return '<div class="between" style="padding:12px 18px;border-bottom:1px solid var(--line2)"><div class="center"><span class="badge b-ok plain">' + v + '</span></div><button class="btn sm" style="border-color:#f0c9c4;color:var(--bad)" data-del="' + v + '">제거</button></div>'; }).join('') +
      '</div></div>' +
      '<div class="banner info" style="margin-top:14px">권한 없는 계정으로 대시보드에 접근하면 열람이 차단됩니다. (대시보드 로그인 화면에서 <b>guest.x</b> 계정으로 확인)</div>';
    $('#addBtn').onclick = function () {
      var mo = modal('열람 계정 추가', '<div class="field"><label>계정(사번 ID)</label><input class="inp" id="newU" placeholder="hong.qc" /></div>', '<button class="btn" id="ac">취소</button><button class="btn pri" id="aok">추가</button>');
      mo.ov.querySelector('#ac').onclick = mo.close;
      mo.ov.querySelector('#aok').onclick = function () {
        var v = mo.ov.querySelector('#newU').value.trim();
        if (!v) return toast('계정을 입력하세요.', 'warn');
        if (ops.settings.viewers.indexOf(v) >= 0) return toast('이미 있는 계정입니다.', 'warn');
        ops.settings.viewers.push(v); save(); mo.close(); toast(v + ' 열람 권한 부여'); viewAccess();
      };
    };
    app.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () {
      var v = b.getAttribute('data-del');
      if (ops.settings.viewers.length <= 1) return toast('최소 1개 계정이 필요합니다.', 'warn');
      ops.settings.viewers = ops.settings.viewers.filter(function (x) { return x !== v; });
      if (ops.session.user === v) ops.session.user = null;
      save(); toast(v + ' 권한 제거'); viewAccess();
    }; });
  }

  router();
})();
