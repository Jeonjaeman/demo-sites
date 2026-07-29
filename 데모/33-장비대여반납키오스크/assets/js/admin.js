/* ============================================================
   ALLEND 올렌드 — admin.js (관리자·접근성 검증 대시보드)
   · 재고 실연동(localStorage) · 대여내역 CSV(BOM)
   · KS X 9211 검증 진단(시나리오 A/B 실판정) · 명도대비 실계산
   · 책임 분계표 · 하드웨어 신호 상태 · 실시간 로그
   ============================================================ */
(function () {
  'use strict';
  var A = window.ALLEND;
  var S = A.load();

  /* -------------------- KPI -------------------- */
  function countUp(el, to, suffix) {
    var from = 0, dur = 700, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e) + (suffix || '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function renderKPI() {
    var totalUnits = S.equip.reduce(function (a, e) { return a + e.total; }, 0);
    var availUnits = S.equip.reduce(function (a, e) { return a + e.avail; }, 0);
    var active = A.activeRentals(S).length;
    var soldTypes = S.equip.filter(function (e) { return e.avail <= 0; }).length;
    var box = document.getElementById('kpis');
    box.innerHTML =
      kpi('가용 수량', availUnits, '/ ' + totalUnits + '대', '') +
      kpi('대여중', active, '건 진행', active ? 'warn' : 'ok') +
      kpi('품절 품목', soldTypes, '종', soldTypes ? 'bad' : 'ok') +
      kpi('검증 통과율', '—', '지급 디자인 기준', 'warn', 'kpiPass');
    var kv = box.querySelectorAll('.kv');
    countUp(kv[0], availUnits); countUp(kv[1], active); countUp(kv[2], soldTypes);
  }
  function kpi(label, val, sub, cls, id) {
    return '<div class="kpi card"><div class="kl">' + label + '</div>' +
      '<div class="kv ' + (cls || '') + '"' + (id ? ' id="' + id + '"' : '') + '>' + val + '</div>' +
      '<div class="ks">' + sub + '</div></div>';
  }

  /* -------------------- 재고 바 -------------------- */
  function renderInv() {
    var box = document.getElementById('inv');
    box.innerHTML = '';
    S.equip.forEach(function (e) {
      var pct = Math.round(e.avail / e.total * 100);
      var cls = e.avail <= 0 ? 'out' : (e.avail <= Math.max(1, Math.round(e.total * 0.25)) ? 'low' : '');
      var row = document.createElement('div');
      row.className = 'invrow';
      row.innerHTML = '<span>' + e.icon + ' ' + e.name + '</span>' +
        '<span class="bar ' + cls + '"><i data-w="' + pct + '"></i></span>' +
        '<span class="n">' + e.avail + '/' + e.total + '</span>';
      box.appendChild(row);
    });
    setTimeout(function () { box.querySelectorAll('.bar i').forEach(function (i) { i.style.width = i.getAttribute('data-w') + '%'; }); }, 60);
  }

  /* -------------------- 대여 내역 + CSV -------------------- */
  function renderRentals() {
    var tb = document.querySelector('#rentTbl tbody');
    tb.innerHTML = '';
    if (!S.rentals.length) {
      tb.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--ink-2);padding:22px">대여 내역이 없습니다. 키오스크에서 대여해 보세요.</td></tr>';
      return;
    }
    S.rentals.slice(0, 30).forEach(function (r) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + r.no + '</td>' +
        '<td>' + r.icon + ' ' + r.name + '</td>' +
        '<td class="c">' + r.days + '일</td>' +
        '<td class="r">' + (r.fee ? A.won(r.fee) : '무료') + '</td>' +
        '<td class="c"><span class="chip ' + (r.status === '대여중' ? 'warn' : 'ok') + '">' + r.status + '</span></td>' +
        '<td>' + A.timeStr(r.at) + '</td>';
      tb.appendChild(tr);
    });
  }
  document.getElementById('btnCsv').onclick = function () {
    var rows = [['대여번호', '장비', '기간(일)', '결제금액', '카드(마스킹)', '상태', '대여일시', '반납일시']];
    S.rentals.forEach(function (r) {
      rows.push([r.no, r.name, r.days, r.fee, r.cardMasked || '', r.status, A.timeStr(r.at), r.returnedAt ? A.timeStr(r.returnedAt) : '']);
    });
    A.downloadCSV('ALLEND_대여내역.csv', rows);
  };

  /* -------------------- KS X 9211 검증 진단 -------------------- */
  var curScen = 'A';
  function renderScenToggle() {
    var box = document.getElementById('scen');
    box.innerHTML = '';
    ['A', 'B'].forEach(function (k) {
      var sc = A.DESIGN_SCENARIOS[k];
      var b = document.createElement('button');
      b.setAttribute('aria-pressed', k === curScen);
      b.innerHTML = '<b>' + sc.label + '</b><small>명도대비 ' +
        (A.contrastRatio(sc.fg, sc.bg) || 0).toFixed(2) + ':1 · 본문 ' + sc.baseFontPx + 'px</small>';
      b.onclick = function () { curScen = k; renderScenToggle(); renderDiag(); };
      box.appendChild(b);
    });
  }
  function renderDiag() {
    var sc = A.DESIGN_SCENARIOS[curScen];
    var d = A.diagnose(sc);
    var rowsBox = document.getElementById('diagRows');
    rowsBox.innerHTML = '';
    var pass = 0, judged = 0;
    d.rows.forEach(function (r) {
      var v, vc;
      if (r.pass === true) { v = '통과'; vc = 'pass'; pass++; judged++; }
      else if (r.pass === false) { v = '미달'; vc = 'fail'; judged++; }
      else { v = '확인 필요'; vc = 'info'; }
      var whoCls = r.who.indexOf('HW') >= 0 && r.who.indexOf('SW') < 0 && r.who.indexOf('디자인') < 0 ? 'hw'
        : (r.who === 'SW' ? 'sw' : (r.who.indexOf('디자인') >= 0 ? 'dsn' : 'sw'));
      var row = document.createElement('div');
      row.className = 'drow';
      row.innerHTML = '<div><span class="dk">' + r.key + '</span>' +
        '<span class="who ' + whoCls + '">' + r.who + '</span>' +
        '<div class="dneed">기준: ' + r.need + '</div>' +
        '<div class="dgot">현재: ' + r.got + '</div></div>' +
        '<span class="verdict ' + vc + '">' + v + '</span>';
      rowsBox.appendChild(row);
    });
    drawGauge(pass, judged);
    document.getElementById('gaugeLabel').textContent = '판정 지표 ' + pass + '/' + judged + ' 통과 (확인필요 ' + (d.rows.length - judged) + ')';

    var note = document.getElementById('verdictNote');
    var fails = d.rows.filter(function (r) { return r.pass === false; });
    if (fails.length) {
      note.className = 'verdict-note bad';
      note.innerHTML = '❌ <b>' + sc.label + '</b>로 구현하면 검증 <b>탈락</b>합니다 — ' +
        fails.map(function (f) { return f.key; }).join(', ') + ' 미달. ' +
        '이 항목들은 <b>디자인 단계에서 결정</b>되므로, 지급 디자인을 그대로 구현한 개발사가 책임을 지게 될 위험이 있습니다. ' +
        '→ <b>착수 전 디자인 접근성 사전 검수</b>와 <b>책임 경계 명문화</b>가 필요합니다.';
    } else {
      note.className = 'verdict-note ok';
      note.innerHTML = '✅ <b>' + sc.label + '</b> 기준, 디자인·SW가 통제하는 지표는 모두 통과합니다. ' +
        '남은 <b>확인 필요</b> 항목(이어폰잭·음량·설치높이)은 <b>지급 하드웨어</b> 영역으로, HW 규격서 확인이 전제입니다.';
    }
    /* KPI 통과율 갱신 */
    var kp = document.getElementById('kpiPass');
    if (kp) { kp.textContent = judged ? Math.round(pass / judged * 100) + '%' : '—';
      kp.className = 'kv ' + (fails.length ? 'bad' : 'ok'); }
  }

  function drawGauge(pass, total) {
    var cv = document.getElementById('gauge');
    var dpr = window.devicePixelRatio || 1;
    var size = 150;
    cv.width = size * dpr; cv.height = size * dpr;
    cv.style.width = size + 'px'; cv.style.height = size + 'px';
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    var cx = size / 2, cy = size / 2, r = 58, lw = 16;
    var ratio = total ? pass / total : 0;
    var css = getComputedStyle(document.documentElement);
    var okc = css.getPropertyValue('--ok').trim() || '#0f7a3d';
    var badc = css.getPropertyValue('--danger').trim() || '#c0231f';
    var linec = css.getPropertyValue('--surface-2').trim() || '#e9eef4';
    ctx.lineWidth = lw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = linec; ctx.stroke();
    var start = -Math.PI / 2;
    var target = start + Math.PI * 2 * ratio;
    var col = ratio >= 1 ? okc : (ratio >= 0.7 ? css.getPropertyValue('--warn').trim() || '#9a5b00' : badc);
    var cur = start, t0 = null;
    function anim(ts) {
      if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 600); var e = 1 - Math.pow(1 - p, 3);
      var a = start + (target - start) * e;
      ctx.clearRect(0, 0, size, size);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = linec; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r, start, a); ctx.strokeStyle = col; ctx.stroke();
      ctx.fillStyle = css.getPropertyValue('--ink').trim() || '#111';
      ctx.font = '800 30px Pretendard, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(ratio * 100) + '%', cx, cy - 4);
      ctx.font = '600 12px Pretendard, sans-serif'; ctx.fillStyle = css.getPropertyValue('--ink-2').trim() || '#666';
      ctx.fillText('통과율', cx, cy + 18);
      if (p < 1) requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);
  }

  /* -------------------- 명도대비 계산기 -------------------- */
  function bindCC() {
    var fg = document.getElementById('ccFg'), fgH = document.getElementById('ccFgHex');
    var bg = document.getElementById('ccBg'), bgH = document.getElementById('ccBgHex');
    function sync(fromColor) {
      if (fromColor) { fgH.value = fg.value; bgH.value = bg.value; }
      else {
        if (/^#[0-9a-fA-F]{6}$/.test(fgH.value)) fg.value = fgH.value;
        if (/^#[0-9a-fA-F]{6}$/.test(bgH.value)) bg.value = bgH.value;
      }
      calc();
    }
    function calc() {
      var f = fgH.value, b = bgH.value;
      var cr = A.contrastRatio(f, b);
      var prev = document.getElementById('ccPrev');
      prev.style.background = b; prev.style.color = f; prev.style.borderColor = 'var(--line)';
      var rEl = document.getElementById('ccRatio');
      var small = document.getElementById('ccSmall'), large = document.getElementById('ccLarge');
      if (!cr) { rEl.textContent = '—'; return; }
      rEl.textContent = cr.toFixed(2) + ' : 1';
      setChip(small, cr >= 4.5, '본문 4.5:1');
      setChip(large, cr >= 3.0, '큰글자 3:1');
    }
    function setChip(el, pass, label) {
      el.className = 'chip ' + (pass ? 'ok' : 'bad');
      el.textContent = (pass ? '✓ ' : '✗ ') + label;
    }
    fg.oninput = function () { sync(true); }; bg.oninput = function () { sync(true); };
    fgH.oninput = function () { sync(false); }; bgH.oninput = function () { sync(false); };
    calc();
  }

  /* -------------------- 책임 분계표 -------------------- */
  function renderResp() {
    var d = A.diagnose(A.DESIGN_SCENARIOS[curScen]);
    var groups = { '디자인': [], 'SW': [], 'HW': [] };
    d.rows.forEach(function (r) {
      if (r.who.indexOf('HW') >= 0) groups['HW'].push(r.key);
      else if (r.who.indexOf('디자인') >= 0) groups['디자인'].push(r.key + (r.who.indexOf('SW') >= 0 ? ' (+SW)' : ''));
      else groups['SW'].push(r.key);
    });
    var meta = {
      '디자인': { icon: '🎨', owner: '클라이언트 지급', cls: 'supplied', note: '지급물' },
      'HW': { icon: '🔌', owner: '클라이언트 지급', cls: 'supplied', note: '지급물' },
      'SW': { icon: '💻', owner: '개발사(본 과업)', cls: '', note: '개발' }
    };
    var box = document.getElementById('resp');
    box.innerHTML = '';
    ['디자인', 'SW', 'HW'].forEach(function (k) {
      var m = meta[k];
      var col = document.createElement('div');
      col.className = 'respcol ' + m.cls;
      col.innerHTML = '<h3>' + m.icon + ' ' + k + ' <span class="owner ' + (m.cls ? 'chip warn' : 'chip ok') + '" style="border:none">' + m.owner + '</span></h3>' +
        '<ul>' + groups[k].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
      box.appendChild(col);
    });
  }

  /* -------------------- 하드웨어 신호 -------------------- */
  function renderHW() {
    var items = [
      { ic: '💳', name: '카드결제 단말', st: 'ok', msg: '신호 수신 정상(데모)', warn: '실제: 여신금융협회 등록 단말·밴사 규격 확정 필요' },
      { ic: '🧾', name: '영수증 프린터', st: 'ok', msg: '출력 신호 정상(데모)', warn: '실제: 시리얼/ESC-POS 명령셋 규격 필요' },
      { ic: '⌨', name: '물리버튼·패드', st: 'ok', msg: '4키 입력 매핑됨', warn: '실제: HID/GPIO 신호 규격 필요' },
      { ic: '🔊', name: '음성·이어폰잭', st: 'warn', msg: '음량조절 로직 준비', warn: '실제: 3.5mm잭·앰프·볼륨범위 HW 확인' }
    ];
    var box = document.getElementById('hwlist');
    box.innerHTML = '';
    items.forEach(function (it) {
      var el = document.createElement('div');
      el.className = 'hwitem';
      el.innerHTML = '<span class="dot ' + (it.st === 'ok' ? '' : 'off') + '"></span>' +
        '<span>' + it.ic + ' <b>' + it.name + '</b><br><span class="small">' + it.warn + '</span></span>' +
        '<span class="hx ' + (it.st === 'ok' ? 'ok' : 'warn') + '">' + (it.st === 'ok' ? '연동됨' : '규격확인') + '</span>';
      box.appendChild(el);
    });
  }

  /* -------------------- 로그 -------------------- */
  function renderLog() {
    var box = document.getElementById('log');
    box.innerHTML = '';
    if (!S.log.length) { box.innerHTML = '<div class="small" style="color:var(--ink-2)">로그가 없습니다.</div>'; return; }
    S.log.slice(0, 40).forEach(function (l) {
      var row = document.createElement('div');
      row.className = 'logrow';
      row.innerHTML = '<span class="lt">' + A.timeStr(l.at) + '</span>' +
        '<span class="lk ' + l.kind + '">' + (l.kind === 'rent' ? '대여' : l.kind === 'return' ? '반납' : l.kind) + '</span>' +
        '<span>' + l.msg + '</span>';
      box.appendChild(row);
    });
  }

  /* -------------------- 초기화 버튼 -------------------- */
  document.getElementById('btnReset').onclick = function () {
    S = A.resetState();
    renderAll();
  };

  /* -------------------- 키오스크 실연동(다른 탭) -------------------- */
  window.addEventListener('storage', function (e) {
    if (e.key === A.LS_KEY) { S = A.load(); renderAll(); }
  });

  function renderAll() {
    renderKPI(); renderInv(); renderRentals();
    renderScenToggle(); renderDiag(); renderResp();
    renderHW(); renderLog();
  }

  renderAll();
  bindCC();
})();
