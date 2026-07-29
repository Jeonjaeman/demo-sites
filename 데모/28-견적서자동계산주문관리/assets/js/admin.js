/* =====================================================================
   GREENDESK 그린데스크 — 관리자 백오피스 (admin.html)
   대시보드 · 회원 승인 · 견적 발급 내역/재발행 · 주문·청구·결제 · 단가 기준
   ===================================================================== */
(function () {
  'use strict';
  var GD = window.GD;
  var db = GD.load();
  syncCatalog();

  function syncCatalog() {
    (db.products || []).forEach(function (p) { var g = GD.product(p.id); if (g) { g.price = p.price; g.name = p.name; } });
    (db.feeTiers || []).forEach(function (t, i) { if (GD.FEE_TIERS[i]) GD.FEE_TIERS[i].fee = t.fee; });
  }
  function saveDB() { GD.save(db); }
  function reload() { db = GD.load(); syncCatalog(); }

  function $(s, r) { return (r || document).querySelector(s); }
  function h(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  var app = $('#app');

  function toast(msg, kind) {
    var t = h('<div class="toast ' + (kind || '') + '"><span class="dot"></span><span>' + msg + '</span></div>');
    $('#toasts').appendChild(t); requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, 3200);
  }
  function modal(title, bodyHTML, footHTML, wide) {
    var ov = h('<div class="ov"><div class="modal"' + (wide ? ' style="max-width:680px"' : '') + '><div class="modal-h"><h3>' + title + '</h3><button class="x">✕</button></div><div class="modal-b">' + bodyHTML + '</div>' + (footHTML ? '<div class="modal-f">' + footHTML + '</div>' : '') + '</div></div>');
    $('#modalRoot').appendChild(ov); requestAnimationFrame(function () { ov.classList.add('on'); });
    function close() { ov.classList.remove('on'); setTimeout(function () { ov.remove(); }, 240); }
    ov.querySelector('.x').onclick = close; ov.onclick = function (e) { if (e.target === ov) close(); };
    return { ov: ov, close: close };
  }
  function countUp(node, to, opt) {
    opt = opt || {}; var dur = opt.dur || 640, suffix = opt.suffix || '', pre = opt.pre || '', t0 = null; to = Math.round(to);
    function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur); var e = 1 - Math.pow(1 - p, 3); node.textContent = pre + GD.num(to * e) + suffix; if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  function member(id) { return db.members.find(function (m) { return m.id === id; }); }
  function field(label, inner, req) { return '<div class="field"><label>' + label + (req ? ' <span class="req">*</span>' : '') + '</label>' + inner + '</div>'; }

  /* ---------- 라우터 ---------- */
  var routes = { dash: viewDash, members: viewMembers, quotes: viewQuotes, orders: viewOrders, pricing: viewPricing };
  function go(p) { location.hash = '#/' + p; }
  function router() {
    reload();
    var name = (location.hash.replace(/^#\//, '') || 'dash').split('/')[0];
    document.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#/' + name); });
    window.scrollTo(0, 0);
    (routes[name] || viewDash)();
  }
  window.addEventListener('hashchange', router);
  $('#resetBtn').onclick = function () {
    var mo = modal('샘플 데이터 초기화', '<p class="muted">모든 회원·견적·주문을 초기 샘플 상태로 되돌립니다. 계속할까요?</p>', '<button class="btn" id="rc">취소</button><button class="btn danger" id="rok">초기화</button>');
    mo.ov.querySelector('#rc').onclick = mo.close;
    mo.ov.querySelector('#rok').onclick = function () { db = GD.reset(); syncCatalog(); mo.close(); toast('초기화되었습니다.'); router(); };
  };

  /* =====================================================================
     대시보드
     ===================================================================== */
  function viewDash() {
    var pending = db.members.filter(function (m) { return m.status === '승인대기'; });
    var thisMonth = new Date().toISOString().slice(0, 7);
    var issuedThisMonth = db.quotes.filter(function (q) { return (q.issuedAt || '').slice(0, 7) === thisMonth; });
    var activeOrders = db.orders.filter(function (o) { return o.status === '접수' || o.status === '진행중'; });
    var unpaid = db.orders.filter(function (o) { return !o.paid; });
    var unpaidSum = unpaid.reduce(function (s, o) { return s + o.amount; }, 0);

    app.innerHTML =
      '<h2 style="font-size:24px;margin-bottom:4px">대시보드</h2><p class="muted small" style="margin-bottom:18px">주문 진행과 대금 회수 현황을 한 화면에서 봅니다.</p>' +
      '<div class="kpis">' +
        kpi('👤', '승인 대기 회원', pending.length, '건 · 확인 필요', pending.length ? 'amber' : '') +
        kpi('📄', '이번달 발급 견적', issuedThisMonth.length, '건', '') +
        kpi('📦', '진행 중 주문', activeOrders.length, '건 (접수·진행중)', '') +
        kpi('💳', '미결제 금액', unpaidSum, '원 · ' + unpaid.length + '건', unpaidSum ? 'red' : '', true) +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1.1fr 1fr;gap:18px;margin-top:18px" class="dash-grid">' +
        '<div class="card"><div class="card-h"><h3>주문 상태 분포</h3><span class="small muted">전체 ' + db.orders.length + '건</span></div><div class="card-b"><div class="center" style="gap:20px"><canvas id="donut" width="150" height="150" style="width:150px;height:150px"></canvas><div id="donutLeg" style="flex:1"></div></div></div></div>' +
        '<div class="card"><div class="card-h"><h3>월별 견적 발급</h3><span class="small muted">최근 6개월</span></div><div class="card-b"><canvas id="bars" width="440" height="180" style="width:100%;height:180px"></canvas></div></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px" class="dash-grid">' +
        '<div class="card"><div class="card-h"><h3>승인 대기</h3><a class="small" style="color:var(--brand-d)" href="#/members">회원 관리 →</a></div><div class="card-b" style="padding:6px 0">' +
          (pending.length ? pending.map(function (m) { return '<div class="between" style="padding:10px 18px;border-bottom:1px solid var(--line2)"><div><b>' + m.name + '</b> <span class="small muted">' + m.inst + ' · ' + m.org + '</span><div class="tiny faint">' + m.bizfile + '</div></div><button class="btn sm pri" data-appr="' + m.id + '">승인</button></div>'; }).join('') : '<div class="empty small">대기 중인 회원이 없습니다.</div>') +
        '</div></div>' +
        '<div class="card"><div class="card-h"><h3>미결제·미청구 주문</h3><a class="small" style="color:var(--brand-d)" href="#/orders">주문 관리 →</a></div><div class="card-b" style="padding:6px 0">' +
          (unpaid.length ? unpaid.map(function (o) { var m = member(o.memberId); return '<div class="between" style="padding:10px 18px;border-bottom:1px solid var(--line2)"><div><b class="mono small">' + o.id + '</b> <span class="small muted">' + (m ? m.org : '') + '</span><div class="tiny faint">' + o.summary + '</div></div><div class="right"><div style="font-weight:700">' + GD.won(o.amount) + '</div>' + (o.billed ? '<span class="badge b-blue">청구됨</span>' : '<span class="badge b-amber">미청구</span>') + '</div></div>'; }).join('') : '<div class="empty small">미결제 주문이 없습니다.</div>') +
        '</div></div>' +
      '</div>';

    app.querySelectorAll('[data-appr]').forEach(function (b) { b.onclick = function () { approve(member(b.getAttribute('data-appr'))); }; });
    document.querySelectorAll('.kpi .val[data-cv]').forEach(function (n) { countUp(n, +n.getAttribute('data-cv'), { suffix: n.getAttribute('data-suf') || '' }); });
    drawDonut(); drawBars();
  }
  function kpi(ic, lab, val, sub, tone, isWon) {
    var color = tone === 'amber' ? 'var(--amber)' : tone === 'red' ? 'var(--red)' : 'var(--ink)';
    return '<div class="kpi reveal"><div class="lab"><span class="ic">' + ic + '</span>' + lab + '</div>' +
      '<div class="val mono" data-cv="' + val + '" data-suf="' + (isWon ? '' : '') + '" style="color:' + color + '">0</div>' +
      '<div class="sub">' + (isWon ? '' : '') + sub + '</div></div>';
  }

  function drawDonut() {
    var cv = $('#donut'); if (!cv) return;
    var dpr = window.devicePixelRatio || 1; cv.width = 150 * dpr; cv.height = 150 * dpr;
    var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    var counts = { '접수': 0, '진행중': 0, '완료': 0 };
    db.orders.forEach(function (o) { if (counts[o.status] != null) counts[o.status]++; });
    var colors = { '접수': '#2564cf', '진행중': '#b7791f', '완료': '#1f8a4c' };
    var total = db.orders.length || 1, start = -Math.PI / 2, cx = 75, cy = 75, r = 58, w = 20;
    Object.keys(counts).forEach(function (k) {
      var frac = counts[k] / total; if (frac <= 0) return;
      var end = start + frac * Math.PI * 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, start, end); ctx.lineWidth = w; ctx.strokeStyle = colors[k]; ctx.lineCap = 'butt'; ctx.stroke();
      start = end;
    });
    ctx.fillStyle = '#16211b'; ctx.font = '700 22px Pretendard'; ctx.textAlign = 'center'; ctx.fillText(db.orders.length, cx, cy - 2);
    ctx.fillStyle = '#6a7b70'; ctx.font = '600 11px Pretendard'; ctx.fillText('총 주문', cx, cy + 15);
    $('#donutLeg').innerHTML = Object.keys(counts).map(function (k) { return '<div class="between" style="padding:5px 0"><span class="center small"><span style="width:10px;height:10px;border-radius:3px;background:' + colors[k] + ';display:inline-block"></span>' + k + '</span><b class="small">' + counts[k] + '건</b></div>'; }).join('');
  }
  function drawBars() {
    var cv = $('#bars'); if (!cv) return;
    var W = cv.clientWidth || 440, H = 180, dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    var months = [], now = new Date();
    for (var i = 5; i >= 0; i--) { var d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: d.toISOString().slice(0, 7), label: (d.getMonth() + 1) + '월', n: 0 }); }
    db.quotes.forEach(function (q) { var m = months.find(function (x) { return x.key === (q.issuedAt || '').slice(0, 7); }); if (m) m.n++; });
    var max = Math.max(1, Math.max.apply(null, months.map(function (m) { return m.n; })));
    var pad = 26, bw = (W - pad * 2) / months.length, base = H - 28;
    ctx.strokeStyle = '#eef2ec'; ctx.beginPath(); ctx.moveTo(pad, base); ctx.lineTo(W - pad, base); ctx.stroke();
    var t0 = null;
    function frame(ts) {
      if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 700); var e = 1 - Math.pow(1 - p, 3);
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = '#eef2ec'; ctx.beginPath(); ctx.moveTo(pad, base); ctx.lineTo(W - pad, base); ctx.stroke();
      months.forEach(function (m, i) {
        var full = (m.n / max) * (base - 16), hh = full * e;
        var x = pad + i * bw + bw * 0.22, w = bw * 0.56;
        var grad = ctx.createLinearGradient(0, base - hh, 0, base); grad.addColorStop(0, '#2fa564'); grad.addColorStop(1, '#1f8a4c');
        ctx.fillStyle = grad; roundRect(ctx, x, base - hh, w, hh, 5); ctx.fill();
        ctx.fillStyle = '#6a7b70'; ctx.font = '600 11px Pretendard'; ctx.textAlign = 'center'; ctx.fillText(m.label, x + w / 2, base + 16);
        if (p > 0.6 && m.n) { ctx.fillStyle = '#16211b'; ctx.font = '700 11px Pretendard'; ctx.fillText(m.n, x + w / 2, base - hh - 6); }
      });
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function roundRect(ctx, x, y, w, h, r) { r = Math.min(r, h / 2, w / 2); if (h <= 0) { ctx.beginPath(); return; } ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  /* =====================================================================
     회원 관리
     ===================================================================== */
  var memFilter = 'all';
  function viewMembers() {
    var counts = { all: db.members.length };
    ['승인대기', '승인', '반려'].forEach(function (s) { counts[s] = db.members.filter(function (m) { return m.status === s; }).length; });
    var list = db.members.filter(function (m) { return memFilter === 'all' || m.status === memFilter; });
    app.innerHTML =
      '<div class="between" style="margin-bottom:14px"><h2 style="font-size:24px">회원 관리</h2></div>' +
      '<div class="seg" id="mSeg" style="margin-bottom:14px">' +
        seg('all', '전체', counts.all) + seg('승인대기', '승인대기', counts['승인대기']) + seg('승인', '승인', counts['승인']) + seg('반려', '반려', counts['반려']) +
      '</div>' +
      '<div class="tbl-wrap card"><table class="tbl"><thead><tr><th>이름</th><th>기관</th><th>담당</th><th>연락처</th><th>서류</th><th>상태</th><th>가입일</th><th class="right">처리</th></tr></thead><tbody>' +
      (list.length ? list.map(function (m) {
        return '<tr><td class="name">' + m.name + '</td><td>' + m.inst + ' · ' + m.org + '</td><td class="small">' + (m.grade || '-') + '</td><td class="small mono">' + m.tel + '</td>' +
          '<td><button class="btn sm ghost" data-file="' + m.id + '">📎 확인</button></td>' +
          '<td>' + mBadge(m.status) + '</td><td class="small muted">' + m.joinedAt + '</td>' +
          '<td class="right"><button class="btn sm" data-detail="' + m.id + '">상세</button></td></tr>';
      }).join('') : '<tr><td colspan="8"><div class="empty small">해당 상태의 회원이 없습니다.</div></td></tr>') +
      '</tbody></table></div>';
    app.querySelectorAll('#mSeg button').forEach(function (b) { b.onclick = function () { memFilter = b.getAttribute('data-seg'); viewMembers(); }; });
    app.querySelectorAll('[data-detail]').forEach(function (b) { b.onclick = function () { memberDetail(member(b.getAttribute('data-detail'))); }; });
    app.querySelectorAll('[data-file]').forEach(function (b) { b.onclick = function () { showFile(member(b.getAttribute('data-file'))); }; });
  }
  function seg(k, label, n) { return '<button data-seg="' + k + '"' + (memFilter === k ? ' class="on"' : '') + '>' + label + ' <span class="small" style="opacity:.7">' + n + '</span></button>'; }
  function mBadge(s) { var c = s === '승인' ? 'b-green' : s === '승인대기' ? 'b-amber' : s === '반려' ? 'b-red' : 'b-gray'; return '<span class="badge ' + c + '">' + s + '</span>'; }

  function showFile(m) {
    modal('고유번호증 확인 · ' + m.name,
      '<div class="warn-box small" style="margin-bottom:12px">업로드 파일은 비공개 저장됩니다. 데모에서는 미리보기 자리표시자를 표시합니다.</div>' +
      '<div style="border:1px solid var(--line);border-radius:10px;padding:26px;text-align:center;background:var(--surface2)">' +
      '<div style="font-size:40px">🧾</div><b>' + m.bizfile + '</b><div class="small muted" style="margin-top:6px">' + m.inst + ' · ' + m.org + ' / ' + m.name + '</div></div>',
      '<button class="btn x-close">닫기</button>').ov.querySelector('.x-close').onclick = function (e) { e.target.closest('.ov').querySelector('.x').click(); };
  }

  function memberDetail(m) {
    var body =
      '<div class="between" style="margin-bottom:12px"><div><b style="font-size:17px">' + m.name + '</b> ' + mBadge(m.status) + '<div class="small muted">' + m.inst + ' · ' + m.org + '</div></div></div>' +
      '<div class="grid2">' + field('담당 학년', '<input class="inp" id="dGrade" value="' + (m.grade || '') + '" />') + field('연락처', '<input class="inp" id="dTel" value="' + m.tel + '" />') + '</div>' +
      field('기관명(근무 학교·원)', '<input class="inp" id="dOrg" value="' + m.org + '" />') +
      '<div class="between" style="padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface2)"><span class="small">고유번호증: <b>' + m.bizfile + '</b></span><button class="btn sm" id="dFile">파일 확인</button></div>' +
      (m.status === '반려' && m.rejectReason ? '<div class="warn-box small" style="margin-top:12px">반려 사유: ' + m.rejectReason + '</div>' : '');
    var foot = m.status === '승인대기'
      ? '<button class="btn danger" id="mReject">반려</button><button class="btn" id="mSave">정보 저장</button><button class="btn pri" id="mApprove">승인 + 문자 발송</button>'
      : m.status === '승인'
        ? '<button class="btn danger" id="mDelete">삭제</button><button class="btn pri" id="mSave">정보 저장</button>'
        : '<button class="btn" id="mSave">정보 저장</button><button class="btn pri" id="mApprove">재승인</button>';
    var mo = modal('회원 상세 · ' + m.name, body, foot, true);
    var q = function (s) { return mo.ov.querySelector(s); };
    if (q('#dFile')) q('#dFile').onclick = function () { showFile(m); };
    function persistEdits() { m.grade = q('#dGrade').value.trim(); m.tel = q('#dTel').value.trim(); m.org = q('#dOrg').value.trim(); }
    if (q('#mSave')) q('#mSave').onclick = function () { persistEdits(); saveDB(); mo.close(); toast('회원 정보가 저장되었습니다.'); viewMembers(); };
    if (q('#mApprove')) q('#mApprove').onclick = function () { persistEdits(); approve(m); mo.close(); };
    if (q('#mReject')) q('#mReject').onclick = function () { mo.close(); rejectMember(m); };
    if (q('#mDelete')) q('#mDelete').onclick = function () {
      m.status = '삭제'; db.members = db.members.filter(function (x) { return x.id !== m.id; }); saveDB(); mo.close(); toast('회원이 삭제되었습니다.', 'warn'); viewMembers();
    };
  }
  function approve(m) {
    m.status = '승인'; m.approvedAt = GD.ymd(); delete m.rejectReason; saveDB();
    toast('✅ ' + m.name + ' 선생님 승인 완료 — 안내 문자 발송됨 (' + m.tel + ')');
    router();
  }
  function rejectMember(m) {
    var mo = modal('가입 반려 · ' + m.name, field('반려 사유(문자로 발송)', '<textarea class="inp" id="rjReason" placeholder="예) 고유번호증이 아닌 서류가 첨부되었습니다.">제출 서류를 확인할 수 없어 반려되었습니다.</textarea>'),
      '<button class="btn" id="rjCancel">취소</button><button class="btn danger" id="rjOk">반려 + 문자 발송</button>');
    mo.ov.querySelector('#rjCancel').onclick = mo.close;
    mo.ov.querySelector('#rjOk').onclick = function () { m.status = '반려'; m.rejectReason = mo.ov.querySelector('#rjReason').value.trim(); saveDB(); mo.close(); toast('반려 처리 — 사유 문자 발송됨', 'warn'); viewMembers(); };
  }

  /* =====================================================================
     발급 내역 (견적서) · 재발행
     ===================================================================== */
  function viewQuotes() {
    var byNo = {}; db.quotes.forEach(function (q) { (byNo[q.no] = byNo[q.no] || []).push(q); });
    var nos = Object.keys(byNo).sort().reverse();
    var reqCount = db.quotes.filter(function (q) { return q.status === '수정요청'; }).length;
    app.innerHTML =
      '<div class="between" style="margin-bottom:14px"><h2 style="font-size:24px">견적 발급 내역</h2>' + (reqCount ? '<span class="badge b-amber">수정 요청 ' + reqCount + '건</span>' : '') + '</div>' +
      '<div class="tbl-wrap card"><table class="tbl"><thead><tr><th>견적번호</th><th>교사·기관</th><th>유형</th><th>내역</th><th class="num">합계</th><th>회차</th><th>상태</th><th class="right">처리</th></tr></thead><tbody>' +
      nos.map(function (no) {
        var revs = byNo[no].sort(function (a, b) { return a.rev - b.rev; }); var last = revs[revs.length - 1]; var m = member(last.memberId);
        return '<tr><td class="name mono">' + no + '</td><td>' + (m ? m.name + '<div class="tiny muted">' + m.org + '</div>' : '-') + '</td><td>' + (last.type === 'class' ? '수업' : '교구') + '</td>' +
          '<td class="small">' + qSummary(last) + '</td><td class="num">' + GD.won(last.calc.total) + '</td>' +
          '<td><div class="pill-row">' + revs.map(function (r) { return '<span class="badge b-gray plain tiny">' + r.rev + '차</span>'; }).join('') + '</td>' +
          '<td>' + qBadge(last.status) + '</td>' +
          '<td class="right"><button class="btn sm" data-reissue="' + last.docNo + '">재발행</button> <button class="btn sm ghost" data-resend="' + last.docNo + '">재발송</button></td></tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<p class="hint" style="margin-top:10px">· 재발행 시 이전 회차는 보존되고 새 회차(2차·3차)가 추가됩니다. · 재발송은 가입 이메일로 PDF를 다시 보냅니다.</p>';
    app.querySelectorAll('[data-reissue]').forEach(function (b) { b.onclick = function () { reissue(findQuote(b.getAttribute('data-reissue'))); }; });
    app.querySelectorAll('[data-resend]').forEach(function (b) { b.onclick = function () { var q = findQuote(b.getAttribute('data-resend')); var m = member(q.memberId); toast('견적서 ' + q.docNo + ' 재발송됨 → ' + (m ? m.email : '')); }; });
  }
  function findQuote(docNo) { return db.quotes.find(function (q) { return q.docNo === docNo; }); }
  function qBadge(s) { var map = { '1차 발행': 'b-blue', '수정요청': 'b-amber', '재발행': 'b-blue', '확정': 'b-green' }; return '<span class="badge ' + (map[s] || 'b-gray') + '">' + s + '</span>'; }
  function qSummary(q) { var c = q.calc; if (c.type === 'class') { var cl = GD.klass(c.meta.classId); return (cl ? cl.name : '수업') + ' · ' + c.meta.headcount + '명'; } return c.detail.filter(function (d) { return !/배송비/.test(d.label); }).map(function (d) { return d.label + ' ' + d.qty; }).join(', '); }

  function reissue(q) {
    var c = q.calc; var isClass = c.type === 'class';
    var body = '<p class="muted small" style="margin-bottom:12px">' + (q.memo ? '교사 요청: “' + q.memo + '”' : '입력값을 조정해 새 회차를 발행합니다.') + '</p>';
    if (isClass) {
      body += field('참여 인원', '<input class="inp" type="number" id="riHead" value="' + c.meta.headcount + '" />') +
        field('출강 지역', '<select class="sel" id="riRegion">' + GD.REGIONS.map(function (r) { return '<option value="' + r.id + '"' + (r.id === c.meta.regionId ? ' selected' : '') + '>' + r.name + '</option>'; }).join('') + '</select>') +
        '<label class="center small"><input type="checkbox" id="riPartner"' + (c.meta.partner ? ' checked' : '') + '/> 협약기관 할인</label>';
    } else {
      body += '<div id="riLines">' + c.meta.lines.map(function (ln, i) { var p = GD.product(ln.productId); return '<div class="center" style="gap:8px;margin-bottom:8px"><span class="grow small">' + (p ? p.name : '') + '</span><input class="inp mono" type="number" data-ri="' + i + '" value="' + ln.qty + '" style="width:90px;text-align:right"/></div>'; }).join('') + '</div>' +
        '<label class="center small"><input type="checkbox" id="riPartner"' + (c.meta.partner ? ' checked' : '') + '/> 협약기관 할인</label>';
    }
    var mo = modal('견적서 재발행 · ' + q.no + ' → ' + (q.rev + 1) + '차', body, '<button class="btn" id="riCancel">취소</button><button class="btn pri" id="riOk">' + (q.rev + 1) + '차 발행</button>', true);
    var qs = function (s) { return mo.ov.querySelector(s); };
    qs('#riCancel').onclick = mo.close;
    qs('#riOk').onclick = function () {
      var input;
      if (isClass) input = { type: 'class', classId: c.meta.classId, headcount: qs('#riHead').value, regionId: qs('#riRegion').value, partner: qs('#riPartner').checked };
      else { var lines = c.meta.lines.map(function (ln, i) { return { productId: ln.productId, qty: mo.ov.querySelector('[data-ri="' + i + '"]').value }; }); input = { type: 'goods', lines: lines, partner: qs('#riPartner').checked }; }
      var calc = GD.calcQuote(input);
      if (!calc.valid) { toast('유효한 금액이 계산되지 않았습니다.', 'warn'); return; }
      // 이전 회차 상태 정리
      db.quotes.filter(function (x) { return x.no === q.no; }).forEach(function (x) { if (x.status !== '확정') x.status = '재발행'; });
      var nq = { no: q.no, rev: q.rev + 1, docNo: q.no + '-' + (q.rev + 1), memberId: q.memberId, type: calc.type, calc: calc, status: '재발행', issuedAt: GD.ymd(), validUntil: GD.ymd(GD.addDays(new Date(), 14)), memo: '', sent: true };
      db.quotes.unshift(nq); saveDB(); mo.close();
      var m = member(q.memberId);
      toast('✅ ' + nq.docNo + ' 재발행 — 이전 회차 보존 · 문자 발송됨 (' + (m ? m.tel : '') + ')');
      viewQuotes();
    };
  }

  /* =====================================================================
     주문 관리 (진행 · 청구 · 결제)
     ===================================================================== */
  var oFilter = { status: 'all', bill: 'all', pay: 'all', q: '' };
  function viewOrders() {
    var list = db.orders.filter(function (o) {
      var m = member(o.memberId);
      if (oFilter.status !== 'all' && o.status !== oFilter.status) return false;
      if (oFilter.bill === 'billed' && !o.billed) return false;
      if (oFilter.bill === 'unbilled' && o.billed) return false;
      if (oFilter.pay === 'paid' && !o.paid) return false;
      if (oFilter.pay === 'unpaid' && o.paid) return false;
      if (oFilter.q) { var s = (o.id + ' ' + o.summary + ' ' + (m ? m.name + m.org : '')).toLowerCase(); if (s.indexOf(oFilter.q.toLowerCase()) < 0) return false; }
      return true;
    });
    var billedSum = db.orders.filter(function (o) { return o.billed; }).reduce(function (s, o) { return s + o.amount; }, 0);
    var paidSum = db.orders.filter(function (o) { return o.paid; }).reduce(function (s, o) { return s + o.amount; }, 0);
    app.innerHTML =
      '<div class="between" style="margin-bottom:6px"><h2 style="font-size:24px">주문 관리</h2><div class="small muted">청구 ' + GD.won(billedSum) + ' · 수금 ' + GD.won(paidSum) + '</div></div>' +
      '<p class="muted small" style="margin-bottom:14px">완료 여부·청구 방법과 일자·결제 여부와 완료일을 기록하면 조건별로 조회됩니다.</p>' +
      '<div class="card pad" style="margin-bottom:14px"><div class="wrap-g" style="align-items:end">' +
        '<div class="field" style="margin:0;min-width:180px"><label class="small">검색</label><input class="inp" id="oQ" placeholder="주문번호·교사·기관" value="' + oFilter.q + '" /></div>' +
        selField('진행 상태', 'oStat', [['all', '전체'], ['접수', '접수'], ['진행중', '진행중'], ['완료', '완료']], oFilter.status) +
        selField('청구', 'oBill', [['all', '전체'], ['billed', '청구됨'], ['unbilled', '미청구']], oFilter.bill) +
        selField('결제', 'oPay', [['all', '전체'], ['paid', '결제완료'], ['unpaid', '미결제']], oFilter.pay) +
        '<div class="small muted grow right">조회 ' + list.length + '건</div>' +
      '</div></div>' +
      '<div class="tbl-wrap card"><table class="tbl"><thead><tr><th>주문번호</th><th>교사·기관</th><th>유형</th><th>내역</th><th class="num">금액</th><th>진행</th><th>청구</th><th>결제</th><th class="right">관리</th></tr></thead><tbody>' +
      (list.length ? list.map(function (o) { var m = member(o.memberId);
        return '<tr><td class="name mono">' + o.id + '</td><td>' + (m ? m.name + '<div class="tiny muted">' + m.org + '</div>' : '-') + '</td><td>' + o.kind + '</td>' +
          '<td class="small">' + o.summary + '</td><td class="num">' + GD.won(o.amount) + '</td>' +
          '<td>' + oBadge(o.status) + '</td>' +
          '<td>' + (o.billed ? '<span class="badge b-blue">' + o.billMethod + '</span><div class="tiny faint">' + o.billDate + '</div>' : '<span class="badge b-gray">미청구</span>') + '</td>' +
          '<td>' + (o.paid ? '<span class="badge b-green">완료</span><div class="tiny faint">' + o.paidDate + '</div>' : '<span class="badge b-amber">대기</span>') + '</td>' +
          '<td class="right"><button class="btn sm" data-manage="' + o.id + '">관리</button></td></tr>';
      }).join('') : '<tr><td colspan="9"><div class="empty small">조건에 맞는 주문이 없습니다.</div></td></tr>') +
      '</tbody></table></div>';
    $('#oQ').oninput = function () { oFilter.q = this.value; viewOrders(); var el = $('#oQ'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); };
    $('#oStat').onchange = function () { oFilter.status = this.value; viewOrders(); };
    $('#oBill').onchange = function () { oFilter.bill = this.value; viewOrders(); };
    $('#oPay').onchange = function () { oFilter.pay = this.value; viewOrders(); };
    app.querySelectorAll('[data-manage]').forEach(function (b) { b.onclick = function () { manageOrder(db.orders.find(function (o) { return o.id === b.getAttribute('data-manage'); })); }; });
  }
  function selField(label, id, opts, val) {
    return '<div class="field" style="margin:0;min-width:130px"><label class="small">' + label + '</label><select class="sel" id="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === val ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
  }
  function oBadge(s) { var map = { '접수': 'b-blue', '진행중': 'b-amber', '완료': 'b-green' }; return '<span class="badge ' + (map[s] || 'b-gray') + '">' + s + '</span>'; }

  function manageOrder(o) {
    var m = member(o.memberId);
    var body =
      '<div class="between" style="margin-bottom:10px"><div><b class="mono">' + o.id + '</b> ' + oBadge(o.status) + '<div class="small muted">' + (m ? m.org + ' · ' + m.name : '') + ' / ' + o.kind + '</div></div><b>' + GD.won(o.amount) + '</b></div>' +
      '<div class="card pad" style="background:var(--surface2);margin-bottom:14px"><div class="small">' + o.summary + '</div><div class="tiny muted" style="margin-top:4px">배송·장소: ' + o.ship.addr + ' · 파일: ' + o.ship.roster + (o.ship.memo ? ' · ' + o.ship.memo : '') + '</div></div>' +
      field('진행 상태', '<select class="sel" id="mgStat">' + ['접수', '진행중', '완료'].map(function (s) { return '<option' + (o.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>') +
      '<div class="divider"></div>' +
      '<label class="center" style="margin-bottom:8px"><input type="checkbox" id="mgBilled"' + (o.billed ? ' checked' : '') + '/> <b>청구 완료</b></label>' +
      '<div class="grid2" id="mgBillBox" style="' + (o.billed ? '' : 'opacity:.5') + '">' +
        field('청구 방법', '<select class="sel" id="mgMethod">' + ['세금계산서', '카드', '계좌이체'].map(function (s) { return '<option' + (o.billMethod === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>') +
        field('청구 일자', '<input class="inp" type="date" id="mgBillDate" value="' + (o.billDate || GD.ymd()) + '" />') +
      '</div>' +
      '<div class="divider"></div>' +
      '<label class="center" style="margin-bottom:8px"><input type="checkbox" id="mgPaid"' + (o.paid ? ' checked' : '') + '/> <b>결제 완료</b></label>' +
      '<div id="mgPayBox" style="' + (o.paid ? '' : 'opacity:.5') + '">' + field('결제 완료일', '<input class="inp" type="date" id="mgPaidDate" value="' + (o.paidDate || GD.ymd()) + '" />') + '</div>';
    var mo = modal('주문 관리 · ' + o.id, body, '<button class="btn" id="mgCancel">취소</button><button class="btn pri" id="mgSave">저장</button>', true);
    var qs = function (s) { return mo.ov.querySelector(s); };
    qs('#mgBilled').onchange = function () { qs('#mgBillBox').style.opacity = this.checked ? '1' : '.5'; };
    qs('#mgPaid').onchange = function () { qs('#mgPayBox').style.opacity = this.checked ? '1' : '.5'; };
    qs('#mgCancel').onclick = mo.close;
    qs('#mgSave').onclick = function () {
      o.status = qs('#mgStat').value;
      o.billed = qs('#mgBilled').checked; o.billMethod = o.billed ? qs('#mgMethod').value : ''; o.billDate = o.billed ? qs('#mgBillDate').value : '';
      o.paid = qs('#mgPaid').checked; o.paidDate = o.paid ? qs('#mgPaidDate').value : '';
      if (o.paid && !o.billed) { toast('결제 완료는 청구 완료 후 기록됩니다.', 'warn'); return; }
      saveDB(); mo.close(); toast('주문 ' + o.id + ' 상태가 저장되었습니다.'); viewOrders();
    };
  }

  /* =====================================================================
     단가 기준
     ===================================================================== */
  function viewPricing() {
    app.innerHTML =
      '<h2 style="font-size:24px;margin-bottom:6px">단가 기준</h2><p class="muted small" style="margin-bottom:16px">여기서 바꾼 단가·강사비는 교사 견적 계산에 즉시 반영됩니다.</p>' +
      '<div style="display:grid;grid-template-columns:1.3fr 1fr;gap:18px;align-items:start" class="dash-grid">' +
        '<div class="card"><div class="card-h"><h3>교구 단가표</h3><button class="btn sm pri" id="savePrice">단가 저장</button></div><div class="card-b" style="padding:8px 0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>교구</th><th>분류</th><th>단위</th><th class="num">단가(원)</th></tr></thead><tbody>' +
          db.products.map(function (p, i) { return '<tr><td class="name">' + p.name + '</td><td class="small muted">' + p.group + '</td><td>' + p.unit + '</td><td class="num"><input class="inp mono" type="number" data-price="' + i + '" value="' + p.price + '" style="width:120px;text-align:right" /></td></tr>'; }).join('') +
        '</tbody></table></div></div></div>' +
        '<div class="card"><div class="card-h"><h3>인원 구간별 강사비</h3><button class="btn sm pri" id="saveFee">규칙 저장</button></div><div class="card-b" style="padding:8px 0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>인원 구간</th><th class="num">강사</th><th class="num">강사비(원)</th></tr></thead><tbody>' +
          db.feeTiers.map(function (t, i) { return '<tr><td>' + t.min + ' ~ ' + t.max + '명</td><td class="num">' + t.teachers + '인</td><td class="num"><input class="inp mono" type="number" data-fee="' + i + '" value="' + t.fee + '" style="width:120px;text-align:right" /></td></tr>'; }).join('') +
        '</tbody></table></div><p class="hint" style="padding:10px 18px">15명당 강사 1인 배정 · 61명 이상은 별도 협의</p></div></div>' +
      '</div>';
    $('#savePrice').onclick = function () {
      app.querySelectorAll('[data-price]').forEach(function (inp) { db.products[+inp.getAttribute('data-price')].price = Math.max(0, parseInt(inp.value, 10) || 0); });
      saveDB(); syncCatalog(); toast('교구 단가가 저장되었습니다. 교사 견적에 즉시 반영됩니다.');
    };
    $('#saveFee').onclick = function () {
      app.querySelectorAll('[data-fee]').forEach(function (inp) { db.feeTiers[+inp.getAttribute('data-fee')].fee = Math.max(0, parseInt(inp.value, 10) || 0); });
      saveDB(); syncCatalog(); toast('강사비 규칙이 저장되었습니다.');
    };
  }

  /* ---------- 시작 ---------- */
  router();
})();
