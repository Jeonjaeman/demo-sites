/* =====================================================================
   GREENDESK 그린데스크 — 교사 화면 (index.html)
   가입·승인대기 → 로그인 → 견적 계산 → 견적서 PDF 발행 → 수정요청/재발행
   → 주문·예약 → 마이페이지(회차별 재다운로드)
   ===================================================================== */
(function () {
  'use strict';
  var GD = window.GD;
  var db = GD.load();
  syncCatalog();

  /* GD 카탈로그를 관리자 편집값(db)과 동기화 */
  function syncCatalog() {
    (db.products || []).forEach(function (p) { var g = GD.product(p.id); if (g) { g.price = p.price; g.name = p.name; } });
    (db.feeTiers || []).forEach(function (t, i) { if (GD.FEE_TIERS[i]) GD.FEE_TIERS[i].fee = t.fee; });
  }
  function saveDB() { GD.save(db); }

  /* ---------- DOM 헬퍼 ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function h(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  var app = $('#app');

  function toast(msg, kind) {
    var t = h('<div class="toast ' + (kind || '') + '"><span class="dot"></span><span>' + msg + '</span></div>');
    $('#toasts').appendChild(t);
    requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, 3200);
  }

  function modal(title, bodyHTML, footHTML) {
    var ov = h('<div class="ov"><div class="modal"><div class="modal-h"><h3>' + title + '</h3><button class="x" aria-label="닫기">✕</button></div>' +
      '<div class="modal-b">' + bodyHTML + '</div>' + (footHTML ? '<div class="modal-f">' + footHTML + '</div>' : '') + '</div></div>');
    $('#modalRoot').appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('on'); });
    function close() { ov.classList.remove('on'); setTimeout(function () { ov.remove(); }, 240); }
    ov.querySelector('.x').onclick = close;
    ov.onclick = function (e) { if (e.target === ov) close(); };
    return { ov: ov, close: close };
  }

  /* 카운트업 */
  function countUp(node, to, opt) {
    opt = opt || {}; var from = opt.from || 0, dur = opt.dur || 620, suffix = opt.suffix || '', t0 = null;
    to = Math.round(to);
    function step(ts) {
      if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur); var e = 1 - Math.pow(1 - p, 3);
      node.textContent = GD.num(from + (to - from) * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* 스크롤 리빌 */
  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  function wireReveal(root) { (root || document).querySelectorAll('.reveal:not(.in)').forEach(function (n, i) { n.style.transitionDelay = (i % 6 * 55) + 'ms'; io.observe(n); }); }

  /* ---------- 세션 ---------- */
  function me() { return db.session.memberId ? db.members.find(function (m) { return m.id === db.session.memberId; }) : null; }
  function login(id) { db.session.memberId = id; saveDB(); renderAuth(); }
  function logout() { db.session.memberId = null; saveDB(); renderAuth(); go('home'); toast('로그아웃되었습니다.'); }

  function renderAuth() {
    var m = me(); var a = $('#authArea');
    if (m) {
      a.innerHTML = '<span class="small muted" style="margin-right:2px">' + m.org + '</span>' +
        '<span class="badge b-green plain">' + m.name + ' 선생님</span>' +
        '<button class="btn sm" id="logoutBtn">로그아웃</button>';
      $('#logoutBtn').onclick = logout;
    } else {
      a.innerHTML = '<a class="btn sm" href="#/login">로그인</a><a class="btn sm pri" href="#/join">교사 회원가입</a>';
    }
  }

  /* ---------- 라우터 ---------- */
  var routes = {
    home: viewHome, join: viewJoin, login: viewLogin, calc: viewCalc,
    order: viewOrderList, mypage: viewMypage, downloads: viewDownloads, terms: viewTerms
  };
  function go(path) { location.hash = '#/' + path; }
  function router() {
    var parts = (location.hash.replace(/^#\//, '') || 'home').split('/');
    var name = parts[0] || 'home';
    // 네비 활성
    document.querySelectorAll('#nav a').forEach(function (a) {
      a.classList.toggle('on', a.getAttribute('href') === '#/' + name);
    });
    window.scrollTo(0, 0);
    if (name === 'quote') return viewQuoteDetail(parts[1]);
    if (name === 'ordernew') return viewOrderNew(parts[1]);
    (routes[name] || viewHome)();
    wireReveal(app);
  }
  window.addEventListener('hashchange', router);

  /* 로그인 가드 */
  function requireLogin(cb) {
    var m = me();
    if (!m) { viewLogin('로그인이 필요한 메뉴입니다.'); return null; }
    if (m.status !== '승인') { viewPending(m); return null; }
    return m;
  }

  /* =====================================================================
     안내 (홈)
     ===================================================================== */
  function viewHome() {
    var newProducts = GD.PRODUCTS.filter(function (p) { return p.group === '신규 교구'; });
    app.innerHTML =
      '<section class="reveal" style="text-align:center;padding:34px 0 26px">' +
        '<span class="badge b-green plain" style="font-size:12.5px">친환경 업사이클 환경교육 교구 · 교사 전용</span>' +
        '<h1 style="font-size:clamp(30px,5vw,50px);letter-spacing:-.03em;line-height:1.1;margin:16px 0 12px">교구 수량과 인원만 넣으면<br><span style="color:var(--brand-d)">견적서가 직인까지 찍혀</span> 바로 발행됩니다</h1>' +
        '<p class="muted" style="max-width:600px;margin:0 auto;font-size:16px">담당자가 매번 손으로 만들던 견적서를, 승인된 선생님이 직접 발행하고 재다운로드합니다. 주문·예약부터 청구·결제 현황까지 한 곳에서.</p>' +
        '<div class="center" style="justify-content:center;margin-top:22px;gap:10px">' +
          '<a class="btn pri lg" href="#/join">교사 회원가입</a>' +
          '<a class="btn lg" href="#/calc">견적 먼저 계산해보기</a>' +
        '</div>' +
        '<div class="small muted" style="margin-top:12px">이미 승인된 데모 계정으로 바로 체험 → <a href="#/login" style="color:var(--brand-d);font-weight:700">로그인</a></div>' +
      '</section>' +

      '<section class="card pad reveal" style="margin-top:14px">' +
        '<div class="between" style="margin-bottom:14px"><h3 style="font-size:16px">진행 절차</h3><span class="small muted">가입 후 관리자 승인까지 영업일 기준 1일 이내</span></div>' +
        '<div class="steps">' +
          step(1, '가입 · 서류 제출', '교사 정보와 고유번호증 업로드') +
          step(2, '관리자 승인', '승인 시 안내 문자 발송') +
          step(3, '견적 자동 계산', '수량·인원 입력 → 즉시 금액') +
          step(4, '견적서 PDF 발행', '직인·문서번호 포함, 메일 발송') +
          step(5, '주문 · 예약', '진행·청구·결제까지 기록') +
        '</div>' +
      '</section>' +

      '<section class="reveal" style="margin-top:28px">' +
        '<div class="between" style="margin-bottom:12px"><h3 style="font-size:18px">2026 신규 교구</h3><span class="small muted">모바일에서도 표가 깨지지 않게 정비</span></div>' +
        '<div class="tbl-wrap card"><table class="tbl"><thead><tr><th>교구</th><th>분류</th><th>단위</th><th class="num">공급 단가</th><th class="num">30개 예상(부가세 포함)</th></tr></thead><tbody>' +
          GD.PRODUCTS.map(function (p) {
            var t = Math.round(p.price * 30 * 1.1);
            return '<tr><td class="name">' + p.name + '</td><td><span class="badge b-gray plain small">' + p.group + '</span></td><td>' + p.unit + '</td><td class="num">' + GD.won(p.price) + '</td><td class="num muted">' + GD.won(t) + '</td></tr>';
          }).join('') +
        '</tbody></table></div>' +
      '</section>' +

      '<section class="reveal" style="margin-top:28px">' +
        '<div class="note-box">💡 <b>이 화면은 제안용 데모입니다.</b> 회원·견적·주문 데이터는 모두 가상이며, 브라우저에 저장되어 관리자 화면과 실시간으로 연동됩니다. 상단 우측 “관리자 화면 열기”로 승인·주문 처리를 직접 확인해 보세요.</div>' +
      '</section>';
  }
  function step(n, t, s) { return '<div class="step"><span class="n">' + n + '</span><b>' + t + '</b><span>' + s + '</span></div>'; }

  /* =====================================================================
     회원가입
     ===================================================================== */
  function viewJoin() {
    app.innerHTML =
      '<div style="max-width:620px;margin:0 auto">' +
      '<h2 style="font-size:24px;margin-bottom:6px">교사 회원가입</h2>' +
      '<p class="muted" style="margin-bottom:20px">기관 소속을 증명하는 <b>고유번호증</b>을 첨부하면 승인 대기 상태로 저장됩니다. 업로드 파일은 비공개로 저장됩니다.</p>' +
      '<div class="card pad">' +
        '<div class="grid2">' +
          field('이름', '<input class="inp" id="jName" placeholder="김선생" />', true) +
          field('연락처(문자 수신)', '<input class="inp" id="jTel" placeholder="010-0000-0000" />', true) +
        '</div>' +
        '<div class="grid2">' +
          field('기관 유형', '<select class="sel" id="jInst">' + GD.INSTITUTES.map(function (i) { return '<option>' + i + '</option>'; }).join('') + '</select>', true) +
          field('담당 학년·반', '<input class="inp" id="jGrade" placeholder="예) 만 5세반 / 3학년" />') +
        '</div>' +
        field('기관명(근무 학교·원)', '<input class="inp" id="jOrg" placeholder="예) 햇살유치원" />', true) +
        field('이메일(견적서 수신)', '<input class="inp" id="jEmail" placeholder="teacher@school.example" />', true) +
        '<div class="field"><label>고유번호증 <span class="req">*</span></label>' +
          '<label class="filebox" id="jFileBox"><input type="file" id="jFile" style="display:none" accept="image/*,.pdf" />' +
          '<span style="font-size:20px">📎</span><span class="fake" id="jFileName">파일 선택 (JPG·PNG·PDF)</span><span class="btn sm">찾아보기</span></label>' +
          '<span class="hint">기관 고유번호증 또는 사업자등록증. 승인 심사에만 사용되며 외부에 공개되지 않습니다.</span></div>' +
        '<label class="center small muted" style="margin:4px 0 16px"><input type="checkbox" id="jAgree" /> <span><a href="#/terms" style="color:var(--brand-d);font-weight:700">이용약관·개인정보 처리방침</a>에 동의합니다.</span></label>' +
        '<button class="btn pri wide lg" id="jSubmit">가입 신청</button>' +
      '</div></div>';

    var fileData = { name: '' };
    $('#jFile').onchange = function (e) {
      var f = e.target.files[0]; if (!f) return;
      fileData.name = f.name;
      $('#jFileName').textContent = f.name + '  (' + Math.max(1, Math.round(f.size / 1024)) + 'KB)';
      $('#jFileBox').classList.add('has');
    };
    $('#jSubmit').onclick = function () {
      var name = $('#jName').value.trim(), tel = $('#jTel').value.trim(), org = $('#jOrg').value.trim(), email = $('#jEmail').value.trim();
      if (!name || !tel || !org || !email) return toast('필수 항목을 모두 입력해 주세요.', 'warn');
      if (!/@/.test(email)) return toast('이메일 형식을 확인해 주세요.', 'warn');
      if (!fileData.name) return toast('고유번호증을 첨부해 주세요.', 'warn');
      if (!$('#jAgree').checked) return toast('약관에 동의해 주세요.', 'warn');
      var m = {
        id: GD.uid('m'), name: name, inst: $('#jInst').value, org: org, grade: $('#jGrade').value.trim(),
        tel: tel, email: email, status: '승인대기', bizfile: fileData.name, joinedAt: GD.ymd()
      };
      db.members.unshift(m); saveDB();
      db.session.memberId = m.id; saveDB(); renderAuth();
      viewPending(m, true);
    };
  }
  function field(label, inner, req) {
    return '<div class="field"><label>' + label + (req ? ' <span class="req">*</span>' : '') + '</label>' + inner + '</div>';
  }

  function viewPending(m, justJoined) {
    app.innerHTML =
      '<div style="max-width:560px;margin:30px auto;text-align:center">' +
      '<div style="font-size:46px">🕓</div>' +
      '<h2 style="font-size:23px;margin:10px 0 8px">' + (justJoined ? '가입 신청이 접수되었습니다' : '승인 대기 중입니다') + '</h2>' +
      '<p class="muted">관리자가 <b>' + m.bizfile + '</b> 를 확인한 뒤 승인하면, 지정 템플릿 문자가 발송되고 로그인할 수 있습니다.</p>' +
      '<div class="card pad" style="margin-top:20px;text-align:left">' +
        row('상태', '<span class="badge b-amber">승인대기</span>') + row('이름', m.name) + row('기관', m.inst + ' · ' + m.org) + row('연락처', m.tel) + row('첨부 서류', m.bizfile) +
      '</div>' +
      '<div class="warn-box" style="margin-top:16px;text-align:left">데모에서는 <a href="./admin.html" target="_blank" style="font-weight:800;color:var(--amber)">관리자 화면 → 회원 관리</a>에서 이 계정을 승인하면 즉시 로그인됩니다.</div>' +
      '<div class="center" style="justify-content:center;margin-top:16px"><a class="btn" href="#/home">홈으로</a><button class="btn pri" id="refreshBtn">승인 확인</button></div>' +
      '</div>';
    $('#refreshBtn').onclick = function () {
      db = GD.load(); var mm = db.members.find(function (x) { return x.id === m.id; });
      if (mm && mm.status === '승인') { toast('승인되었습니다! 로그인 상태로 전환합니다.'); renderAuth(); go('mypage'); }
      else if (mm && mm.status === '반려') { toast('반려된 계정입니다. 사유를 확인해 주세요.', 'err'); router(); }
      else toast('아직 승인 대기 중입니다.', 'warn');
    };
  }
  function row(k, v) { return '<div class="between" style="padding:7px 0;border-bottom:1px solid var(--line2)"><span class="small muted">' + k + '</span><span style="font-weight:600">' + v + '</span></div>'; }

  /* =====================================================================
     로그인
     ===================================================================== */
  function viewLogin(msg) {
    location.hash = '#/login';
    var approved = db.members.filter(function (m) { return m.status === '승인'; });
    app.innerHTML =
      '<div style="max-width:440px;margin:24px auto">' +
      '<h2 style="font-size:24px;margin-bottom:6px">로그인</h2>' +
      (msg ? '<div class="warn-box" style="margin-bottom:14px">' + msg + '</div>' : '<p class="muted" style="margin-bottom:18px">네이버 간편 로그인은 실제 구축 범위입니다. 데모에서는 승인된 계정을 선택해 체험하세요.</p>') +
      '<div class="card pad">' +
        '<div class="field"><label>이메일</label><input class="inp" id="lEmail" placeholder="teacher@school.example" /></div>' +
        '<div class="field"><label>비밀번호</label><input class="inp" type="password" id="lPw" placeholder="••••••••" value="demo1234" /></div>' +
        '<button class="btn pri wide lg" id="lSubmit">로그인</button>' +
        '<div class="divider"></div>' +
        '<div class="small muted" style="margin-bottom:8px">승인된 데모 계정으로 바로 체험:</div>' +
        '<div class="pill-row">' + approved.map(function (m) { return '<button class="btn sm" data-login="' + m.id + '">' + m.name + ' · ' + m.org + '</button>'; }).join('') + '</div>' +
        '<div class="divider"></div>' +
        '<div class="center" style="justify-content:space-between"><a class="small muted" href="#/join">교사 회원가입</a><a class="small muted" href="#/home">아이디·비밀번호 찾기</a></div>' +
      '</div></div>';

    app.querySelectorAll('[data-login]').forEach(function (b) {
      b.onclick = function () { login(b.getAttribute('data-login')); toast(me().name + ' 선생님으로 로그인했습니다.'); go('mypage'); };
    });
    $('#lSubmit').onclick = function () {
      var email = $('#lEmail').value.trim().toLowerCase();
      var m = db.members.find(function (x) { return x.email.toLowerCase() === email; });
      if (!m) return toast('가입되지 않은 이메일입니다. 데모 계정을 선택해 보세요.', 'warn');
      if (m.status === '승인대기') { login(m.id); return toast('아직 승인 대기 중입니다.', 'warn'), viewPending(m); }
      if (m.status === '반려') { login(m.id); return router(); }
      login(m.id); toast(m.name + ' 선생님으로 로그인했습니다.'); go('mypage');
    };
  }

  /* =====================================================================
     견적 계산
     ===================================================================== */
  var calcState = { type: 'goods', lines: [{ productId: 'sea-wallet', qty: 30 }], classId: 'cls-sea', headcount: 24, regionId: 'seoul', partner: false };

  function viewCalc() {
    app.innerHTML =
      '<div class="between" style="margin-bottom:16px"><div><h2 style="font-size:24px">견적 계산</h2><p class="muted small">교구 수량 또는 수업 인원을 입력하면 강사비·재료비·부가세가 즉시 계산됩니다.</p></div>' +
        '<div class="seg" id="typeSeg"><button data-type="goods">교구 주문</button><button data-type="class">수업 예약(출강)</button></div></div>' +
      '<div class="calc-grid" style="display:grid;grid-template-columns:1.35fr 1fr;gap:20px;align-items:start">' +
        '<div class="card pad" id="calcForm"></div>' +
        '<div class="card" style="position:sticky;top:80px"><div class="card-h"><h3>실시간 견적</h3><span class="small muted">부가세 포함</span></div><div class="card-b" id="calcSum"></div></div>' +
      '</div>';
    app.querySelectorAll('#typeSeg button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-type') === calcState.type);
      b.onclick = function () { calcState.type = b.getAttribute('data-type'); viewCalc(); };
    });
    renderCalcForm(); renderCalcSum();
  }

  function renderCalcForm() {
    var f = $('#calcForm'); if (!f) return;
    if (calcState.type === 'goods') {
      f.innerHTML =
        '<h3 style="font-size:15px;margin-bottom:12px">교구 품목</h3><div id="lines"></div>' +
        '<button class="btn sm" id="addLine" style="margin-top:6px">＋ 품목 추가</button>' +
        '<div class="divider"></div>' + partnerToggle();
      renderLines();
      $('#addLine').onclick = function () { calcState.lines.push({ productId: GD.PRODUCTS[0].id, qty: 10 }); renderLines(); renderCalcSum(); };
    } else {
      f.innerHTML =
        field('클래스', '<select class="sel" id="cClass">' + GD.CLASSES.map(function (c) { return '<option value="' + c.id + '"' + (c.id === calcState.classId ? ' selected' : '') + '>' + c.name + '</option>'; }).join('') + '</select>') +
        '<div class="grid2">' +
          field('참여 인원', '<input class="inp" type="number" min="1" max="80" id="cHead" value="' + calcState.headcount + '" />') +
          field('출강 지역', '<select class="sel" id="cRegion">' + GD.REGIONS.map(function (r) { return '<option value="' + r.id + '"' + (r.id === calcState.regionId ? ' selected' : '') + '>' + r.name + ' (교통비 ' + GD.won(r.travel) + ')</option>'; }).join('') + '</select>') +
        '</div>' +
        '<div class="note-box small" id="tierInfo"></div>' +
        '<div class="divider"></div>' + partnerToggle();
      $('#cClass').onchange = function () { calcState.classId = this.value; renderCalcSum(); renderTierInfo(); };
      $('#cHead').oninput = function () { calcState.headcount = this.value; renderCalcSum(); renderTierInfo(); };
      $('#cRegion').onchange = function () { calcState.regionId = this.value; renderCalcSum(); };
      renderTierInfo();
    }
    var pt = $('#cPartner'); if (pt) pt.onchange = function () { calcState.partner = this.checked; renderCalcSum(); };
  }
  function partnerToggle() {
    return '<label class="center" style="gap:9px"><input type="checkbox" id="cPartner"' + (calcState.partner ? ' checked' : '') + ' /> <span style="font-weight:700">정기 협약기관 할인 적용</span> <span class="small muted">(공급가 5%)</span></label>';
  }
  function renderTierInfo() {
    var box = $('#tierInfo'); if (!box) return;
    var n = parseInt(calcState.headcount, 10) || 0; var t = GD.feeTier(n);
    if (t) box.innerHTML = '👩‍🏫 ' + n + '명 → 강사 <b>' + t.teachers + '인</b> 배정 · 강사비 <b>' + GD.won(t.fee) + '</b> (15명당 1인 기준)';
    else box.innerHTML = '<span style="color:var(--amber)">61명 이상은 별도 협의가 필요합니다.</span>';
  }
  function renderLines() {
    var box = $('#lines'); if (!box) return;
    box.innerHTML = calcState.lines.map(function (ln, i) {
      return '<div class="center" style="gap:8px;margin-bottom:8px">' +
        '<select class="sel" data-li="' + i + '" style="flex:1">' + GD.PRODUCTS.map(function (p) { return '<option value="' + p.id + '"' + (p.id === ln.productId ? ' selected' : '') + '>' + p.name + ' · ' + GD.won(p.price) + '</option>'; }).join('') + '</select>' +
        '<input class="inp mono" type="number" min="1" data-qty="' + i + '" value="' + ln.qty + '" style="width:92px;text-align:right" />' +
        '<button class="btn sm iconbtn" data-del="' + i + '" title="삭제">✕</button></div>';
    }).join('');
    box.querySelectorAll('[data-li]').forEach(function (s) { s.onchange = function () { calcState.lines[+s.getAttribute('data-li')].productId = s.value; renderCalcSum(); }; });
    box.querySelectorAll('[data-qty]').forEach(function (q) { q.oninput = function () { calcState.lines[+q.getAttribute('data-qty')].qty = q.value; renderCalcSum(); }; });
    box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (calcState.lines.length <= 1) return toast('최소 1개 품목이 필요합니다.', 'warn'); calcState.lines.splice(+b.getAttribute('data-del'), 1); renderLines(); renderCalcSum(); }; });
  }

  function renderCalcSum() {
    var box = $('#calcSum'); if (!box) return;
    var r = GD.calcQuote(calcState);
    var rows = r.detail.map(function (d) {
      return '<div class="sumline"><span>' + d.label + (d.qty > 1 ? ' <span class="muted small">×' + d.qty + '</span>' : '') + '</span><span class="v">' + GD.won(d.amount) + '</span></div>';
    }).join('');
    var discRow = r.discount > 0 ? '<div class="sumline disc"><span>할인 <span class="small muted">(' + r.discountReasons.join(', ') + ')</span></span><span class="v">− ' + GD.won(r.discount) + '</span></div>' : '';
    box.innerHTML =
      (r.valid ? rows +
        '<div class="sumline"><span>공급가액</span><span class="v">' + GD.won(r.supply) + '</span></div>' +
        discRow +
        '<div class="sumline"><span>부가세(10%)</span><span class="v">' + GD.won(r.vat) + '</span></div>' +
        '<div class="sumline total"><span>합계</span><span class="v" id="grand">0원</span></div>' +
        '<button class="btn pri wide lg" id="issueBtn" style="margin-top:16px">견적서 발행 →</button>' +
        '<p class="hint" style="margin-top:8px;text-align:center">발행 시 직인·문서번호가 포함된 PDF가 생성되고 가입 이메일로 발송됩니다.</p>'
        : (r.note ? '<div class="warn-box">' + r.note + '</div>' : '<div class="empty"><div class="big">수량 또는 인원을 입력하세요</div><span>입력하면 강사비와 총액이 즉시 계산됩니다.</span></div>'));
    var g = $('#grand'); if (g) countUp(g, r.total, { suffix: '원' });
    var ib = $('#issueBtn'); if (ib) ib.onclick = function () { issueQuote(r); };
  }

  /* ---------- 견적서 발행 ---------- */
  function issueQuote(calc) {
    var m = me();
    if (!m) { modal('로그인이 필요합니다', '<p class="muted">견적서를 발행하려면 승인된 교사 계정으로 로그인해야 합니다. 지금은 계산만 확인할 수 있어요.</p>', '<a class="btn" href="#/login">로그인</a> <a class="btn pri" href="#/join">회원가입</a>'); return; }
    if (m.status !== '승인') { viewPending(m); return; }
    db.seq.quote += 1;
    var no = 'Q-2026-' + GD.pad(db.seq.quote, 4);
    var q = {
      no: no, rev: 1, docNo: no + '-1', memberId: m.id,
      type: calc.type, calc: calc, status: '1차 발행', issuedAt: GD.ymd(),
      validUntil: GD.ymd(GD.addDays(new Date(), 14)), memo: '', sent: true
    };
    db.quotes.unshift(q); saveDB();
    toast('견적서 ' + q.docNo + ' 가 발행되었습니다. (이메일 발송: ' + m.email + ')');
    go('quote/' + q.docNo);
  }

  /* =====================================================================
     견적서 상세
     ===================================================================== */
  function findQuote(docNo) { return db.quotes.find(function (q) { return q.docNo === docNo; }); }

  function viewQuoteDetail(docNo) {
    var q = findQuote(docNo);
    if (!q) { app.innerHTML = notFound('견적서를 찾을 수 없습니다.'); return; }
    var m = db.members.find(function (x) { return x.id === q.memberId; });
    var revs = db.quotes.filter(function (x) { return x.no === q.no; }).sort(function (a, b) { return a.rev - b.rev; });

    app.innerHTML =
      '<div class="between" style="margin-bottom:14px">' +
        '<div><a class="small muted" href="#/mypage">← 발급 이력</a><h2 style="font-size:22px;margin-top:4px">견적서 ' + q.docNo + ' ' + statusBadge('quote', q.status) + '</h2></div>' +
        '<div class="center noprint">' +
          '<button class="btn" id="reqBtn">수정 요청</button>' +
          '<button class="btn" id="orderBtn">이 견적으로 주문</button>' +
          '<button class="btn pri" id="pdfBtn">PDF 다운로드</button>' +
        '</div>' +
      '</div>' +
      (revs.length > 1 ? '<div class="pill-row noprint" style="margin-bottom:12px"><span class="small muted" style="align-self:center">회차:</span>' +
        revs.map(function (rv) { return '<a class="btn sm ' + (rv.docNo === q.docNo ? 'pri' : '') + '" href="#/quote/' + rv.docNo + '">' + rv.rev + '차' + (rv.status === '확정' ? ' ✓' : '') + '</a>'; }).join('') + '</div>' : '') +
      '<div class="card" style="padding:8px;overflow:auto"><div id="docHost">' + quoteDocHTML(q, m) + '</div></div>' +
      '<div class="center noprint" style="margin-top:14px;gap:10px">' +
        '<button class="btn sm" id="giftBtn">자원기부 확인서 발행</button>' +
        '<span class="small muted">회차별 견적서는 덮어쓰지 않고 모두 보존됩니다.</span>' +
      '</div>';

    $('#pdfBtn').onclick = function () { downloadPDF(q, m, '견적서'); };
    $('#orderBtn').onclick = function () { go('ordernew/' + q.docNo); };
    $('#giftBtn').onclick = function () { downloadPDF(q, m, '자원기부확인서'); };
    $('#reqBtn').onclick = function () { requestRevision(q); };
  }

  function requestRevision(q) {
    if (q.status === '확정') return toast('이미 확정된 견적서입니다. 새 견적을 발행해 주세요.', 'warn');
    var mo = modal('견적서 수정 요청',
      '<p class="muted small" style="margin-bottom:12px">요청을 보내면 관리자에게 알림이 갑니다. 관리자가 재발행하면 <b>2차·3차</b>가 생기고 이전 회차도 그대로 남습니다.</p>' +
      '<div class="field"><label>수정 요청 내용</label><textarea class="inp" id="revMemo" placeholder="예) 인원을 24명에서 28명으로 정정하고 싶습니다.">인원/수량 정정을 요청합니다.</textarea></div>',
      '<button class="btn" id="revCancel">취소</button><button class="btn pri" id="revSend">요청 보내기</button>');
    mo.ov.querySelector('#revCancel').onclick = mo.close;
    mo.ov.querySelector('#revSend').onclick = function () {
      q.status = '수정요청'; q.memo = mo.ov.querySelector('#revMemo').value.trim(); saveDB();
      mo.close(); toast('수정 요청이 관리자에게 전달되었습니다.'); router();
    };
  }

  /* 견적서 문서 HTML (화면·PDF 공용) */
  function quoteDocHTML(q, m) {
    var iss = GD.ISSUER; var c = q.calc;
    var isGift = q._giftMode;
    var title = isGift ? '자원기부 확인서' : '견 적 서';
    var rows = c.detail.map(function (d, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + d.label + '</td><td class="num">' + (d.qty || 1) + d.unit + '</td><td class="num">' + GD.won(d.unitPrice) + '</td><td class="num">' + GD.won(d.amount) + '</td></tr>';
    }).join('');
    var giftBody = '<p style="margin:18px 0;font-size:13.5px;line-height:2">위 기관은 친환경 업사이클 환경교육에 참여하며, 아래와 같이 폐자원(청바지·병뚜껑 등)을 기부·제공하였음을 확인합니다. 본 확인서는 교육 목적의 자원순환 실적 증빙용으로 발행됩니다.</p>';
    return '' +
      '<div class="doc" data-doc="' + q.docNo + '">' +
        '<div class="d-top"><div><h1>' + title + '</h1><div class="small" style="color:var(--muted);margin-top:6px">' + iss.brand + ' · 친환경 업사이클 교구</div></div>' +
          '<div class="d-meta"><div><b>문서번호</b> ' + q.docNo + (isGift ? 'C' : '') + '</div><div><b>발행일시</b> ' + GD.ymdhm(new Date(q.issuedAt + 'T09:00')) + '</div>' + (isGift ? '' : '<div><b>유효기간</b> ' + q.validUntil + '까지</div>') + '<div><b>회차</b> ' + q.rev + '차 (' + q.status + ')</div></div></div>' +
        '<div class="d-parties">' +
          '<div class="party"><b>수 신</b>' + pline('기관', (m ? m.org : '-')) + pline('담당', (m ? m.name + ' 선생님' : '-')) + pline('연락처', (m ? m.tel : '-')) + pline('이메일', (m ? m.email : '-')) + '</div>' +
          '<div class="party"><b>공급자</b>' + pline('상호', iss.company) + pline('대표', iss.ceo) + pline('등록번호', iss.bizno) + pline('주소', iss.addr) + pline('연락처', iss.tel) + '</div>' +
        '</div>' +
        (isGift ? giftBody :
        '<table class="dtbl"><thead><tr><th style="width:34px">No</th><th>품목·항목</th><th class="num">수량</th><th class="num">단가</th><th class="num">금액</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="d-sum"><table>' +
          '<tr><td class="muted">공급가액</td><td class="num">' + GD.won(c.supply) + '</td></tr>' +
          (c.discount > 0 ? '<tr><td class="muted">할인 (' + c.discountReasons.join(', ') + ')</td><td class="num" style="color:var(--brand-d)">− ' + GD.won(c.discount) + '</td></tr>' : '') +
          '<tr><td class="muted">부가세 (10%)</td><td class="num">' + GD.won(c.vat) + '</td></tr>' +
          '<tr class="grand"><td>합계 금액</td><td class="num">' + GD.won(c.total) + '</td></tr>' +
        '</table></div>') +
        '<div class="d-foot"><div class="small muted">' + (isGift ? '본 확인서는 자원순환 교육 실적 증빙용입니다.' : '· 상기 금액은 견적일 기준이며 유효기간 내 유효합니다.<br>· 결제는 세금계산서 발행 후 계좌 입금 또는 카드로 진행됩니다.') + '</div>' +
          '<div class="stamp-area">' + iss.company + '<div style="font-weight:400;color:var(--muted);font-size:11px;margin-top:2px">대표 ' + iss.ceo + ' (인)</div><span class="seal">' + GD.sealSVG(74) + '</span></div>' +
        '</div>' +
        '<div class="d-note">본 문서는 GREENDESK 데모에서 자동 생성된 가상 문서입니다. 실제 거래·법적 효력이 없습니다. · 문서번호 ' + q.docNo + ' · 발행 ' + iss.brand + '</div>' +
      '</div>';
  }
  function pline(k, v) { return '<div class="line"><span>' + k + '</span><div>' + v + '</div></div>'; }

  /* ---------- PDF 생성 (html2canvas + jsPDF, 실패 시 인쇄 폴백) ---------- */
  function downloadPDF(q, m, kind) {
    var isGift = kind === '자원기부확인서';
    var qc = Object.assign({}, q, { _giftMode: isGift });
    var stage = $('#docStage');
    stage.innerHTML = quoteDocHTML(qc, m);
    var docNode = stage.querySelector('.doc');
    var fname = kind + '_' + q.docNo + '.pdf';

    var jspdfReady = window.jspdf && window.jspdf.jsPDF;
    var h2cReady = typeof window.html2canvas === 'function';
    if (!jspdfReady || !h2cReady) {
      toast('PDF 라이브러리 로딩 중… 인쇄 창으로 발행합니다.', 'warn');
      return printFallback(docNode);
    }
    toast('PDF를 생성하는 중입니다…');
    window.html2canvas(docNode, { scale: 2, backgroundColor: '#ffffff', useCORS: true }).then(function (canvas) {
      var img = canvas.toDataURL('image/png');
      var pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
      var pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
      var iw = pw, ih = canvas.height * pw / canvas.width;
      var y = 0;
      if (ih <= ph) { pdf.addImage(img, 'PNG', 0, 0, iw, ih); }
      else { // 다중 페이지
        var left = ih;
        while (left > 0) { pdf.addImage(img, 'PNG', 0, y, iw, ih); left -= ph; if (left > 0) { pdf.addPage(); y -= ph; } }
      }
      pdf.save(fname);
      toast(fname + ' 다운로드 완료');
      markSent(q);
    }).catch(function (e) { console.warn(e); printFallback(docNode); });
  }
  function printFallback(docNode) {
    var w = window.open('', '_blank');
    if (!w) return toast('팝업이 차단되어 PDF를 열 수 없습니다.', 'err');
    w.document.write('<html><head><meta charset="utf-8"><title>견적서</title>' +
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">' +
      '<link rel="stylesheet" href="./assets/css/style.css"></head><body style="padding:20px">' + docNode.outerHTML +
      '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print();},400);}</scr' + 'ipt></body></html>');
    w.document.close();
  }
  function markSent(q) { q.sent = true; saveDB(); }

  /* =====================================================================
     주문 신청 (견적 → 주문)
     ===================================================================== */
  function viewOrderNew(docNo) {
    var m = requireLogin(); if (!m) return;
    var q = findQuote(docNo);
    if (!q) { app.innerHTML = notFound('견적서를 찾을 수 없습니다.'); return; }
    var isClass = q.type === 'class';
    app.innerHTML =
      '<div style="max-width:620px;margin:0 auto">' +
      '<a class="small muted" href="#/quote/' + docNo + '">← 견적서로</a>' +
      '<h2 style="font-size:23px;margin:4px 0 6px">' + (isClass ? '수업 예약 신청' : '교구 주문 신청') + '</h2>' +
      '<p class="muted small" style="margin-bottom:16px">견적서 ' + q.docNo + ' · 합계 <b>' + GD.won(q.calc.total) + '</b> 기준으로 주문을 접수합니다.</p>' +
      '<div class="card pad">' +
        field(isClass ? '수업 장소' : '배송 주소', '<input class="inp" id="oAddr" placeholder="' + (isClass ? '예) 햇살유치원 강당' : '예) 서울시 ○○구 ○○로 12 ○○학교 교무실') + '" />', true) +
        (isClass ? field('희망 수업일', '<input class="inp" type="date" id="oDate" />', true) : '') +
        '<div class="field"><label>' + (isClass ? '참여 명단' : '수령·명단') + ' 파일 <span class="req">*</span></label>' +
          '<label class="filebox" id="oFileBox"><input type="file" id="oFile" style="display:none" /><span style="font-size:20px">📄</span><span class="fake" id="oFileName">명단 파일 (xlsx·pdf)</span><span class="btn sm">찾아보기</span></label></div>' +
        field('요청사항', '<textarea class="inp" id="oMemo" placeholder="배송·수업 관련 요청사항"></textarea>') +
        '<button class="btn pri wide lg" id="oSubmit">주문 접수</button>' +
      '</div></div>';
    var fd = { name: '' };
    $('#oFile').onchange = function (e) { var f = e.target.files[0]; if (!f) return; fd.name = f.name; $('#oFileName').textContent = f.name; $('#oFileBox').classList.add('has'); };
    $('#oSubmit').onclick = function () {
      var addr = $('#oAddr').value.trim();
      if (!addr) return toast('주소·장소를 입력해 주세요.', 'warn');
      if (isClass && !$('#oDate').value) return toast('희망 수업일을 선택해 주세요.', 'warn');
      if (!fd.name) return toast('명단 파일을 첨부해 주세요.', 'warn');
      db.seq.order += 1;
      var o = {
        id: 'O-2026-' + GD.pad(db.seq.order, 4), quoteNo: q.no, rev: q.rev, memberId: m.id,
        kind: isClass ? '수업 예약' : '교구 주문',
        summary: orderSummary(q) + (isClass ? ' · ' + $('#oDate').value : ''),
        amount: q.calc.total,
        ship: { addr: addr, roster: fd.name, memo: $('#oMemo').value.trim() },
        status: '접수', billed: false, billMethod: '', billDate: '', paid: false, paidDate: '',
        createdAt: GD.ymd()
      };
      db.orders.unshift(o);
      q.status = '확정'; saveDB();
      toast('주문 ' + o.id + ' 이(가) 접수되었습니다.');
      go('order');
    };
  }
  function orderSummary(q) {
    var c = q.calc;
    if (c.type === 'class') { var cl = GD.klass(c.meta.classId); return (cl ? cl.name : '수업') + ' · ' + c.meta.headcount + '명'; }
    return c.detail.filter(function (d) { return !/배송비/.test(d.label); }).map(function (d) { return d.label + ' ' + d.qty; }).join(' · ');
  }

  /* =====================================================================
     주문·예약 목록 (교사 본인)
     ===================================================================== */
  function viewOrderList() {
    var m = requireLogin(); if (!m) return;
    var mine = db.orders.filter(function (o) { return o.memberId === m.id; });
    app.innerHTML =
      '<div class="between" style="margin-bottom:16px"><h2 style="font-size:24px">내 주문·예약</h2><a class="btn pri" href="#/calc">＋ 새 견적·주문</a></div>' +
      (mine.length ? '<div class="tbl-wrap card"><table class="tbl"><thead><tr><th>주문번호</th><th>유형</th><th>내역</th><th class="num">금액</th><th>진행</th><th>청구</th><th>결제</th></tr></thead><tbody>' +
        mine.map(function (o) {
          return '<tr><td class="name mono">' + o.id + '</td><td>' + o.kind + '</td><td class="small">' + o.summary + '</td><td class="num">' + GD.won(o.amount) + '</td>' +
            '<td>' + statusBadge('order', o.status) + '</td>' +
            '<td>' + (o.billed ? '<span class="badge b-blue">' + o.billMethod + '</span>' : '<span class="badge b-gray">미청구</span>') + '</td>' +
            '<td>' + (o.paid ? '<span class="badge b-green">완료</span>' : '<span class="badge b-amber">대기</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div>'
        : emptyBox('아직 주문·예약이 없습니다', '견적을 계산해 주문을 접수해 보세요.', '#/calc', '견적 계산하기'));
  }

  /* =====================================================================
     마이페이지
     ===================================================================== */
  function viewMypage() {
    var m = me();
    if (!m) return viewLogin('로그인이 필요합니다.');
    if (m.status === '반려') {
      app.innerHTML = '<div style="max-width:560px;margin:24px auto"><h2 style="font-size:23px">가입 반려</h2>' +
        '<div class="warn-box" style="margin-top:12px">' + (m.rejectReason || '제출 서류를 확인할 수 없어 반려되었습니다.') + '</div>' +
        '<a class="btn pri" href="#/join" style="margin-top:16px">다시 가입 신청</a></div>';
      return;
    }
    if (m.status === '승인대기') return viewPending(m);

    var myQuotes = db.quotes.filter(function (q) { return q.memberId === m.id; });
    var byNo = {}; myQuotes.forEach(function (q) { (byNo[q.no] = byNo[q.no] || []).push(q); });
    var groups = Object.keys(byNo).sort().reverse();
    var myOrders = db.orders.filter(function (o) { return o.memberId === m.id; });

    app.innerHTML =
      '<div class="between" style="margin-bottom:16px"><h2 style="font-size:24px">마이페이지</h2><a class="btn pri" href="#/calc">＋ 새 견적</a></div>' +
      '<div style="display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:start" class="my-grid">' +
        '<div class="card pad reveal">' +
          '<div class="center" style="gap:12px;margin-bottom:14px"><div class="brand"><span class="mark">' + m.name.charAt(0) + '</span></div><div><b style="font-size:16px">' + m.name + ' 선생님</b><div class="small muted">' + m.inst + ' · ' + m.org + '</div></div></div>' +
          row('승인 상태', '<span class="badge b-green">승인 완료</span>') + row('담당', m.grade || '-') + row('연락처', m.tel) + row('이메일', m.email) + row('가입일', m.joinedAt) +
          '<button class="btn wide sm" id="editMe" style="margin-top:12px">내 정보 수정</button>' +
        '</div>' +
        '<div>' +
          '<div class="card reveal" style="margin-bottom:18px"><div class="card-h"><h3>발급 이력 · 견적서</h3><span class="small muted">회차별 재다운로드</span></div><div class="card-b" style="padding:8px 0">' +
            (groups.length ? groups.map(function (no) {
              var revs = byNo[no].sort(function (a, b) { return a.rev - b.rev; });
              var last = revs[revs.length - 1];
              return '<div style="padding:12px 18px;border-bottom:1px solid var(--line2)">' +
                '<div class="between"><div><b class="mono">' + no + '</b> ' + statusBadge('quote', last.status) + '<div class="small muted" style="margin-top:2px">' + orderSummary(last) + ' · ' + GD.won(last.calc.total) + '</div></div>' +
                '<a class="btn sm" href="#/quote/' + last.docNo + '">열기</a></div>' +
                '<div class="pill-row" style="margin-top:8px">' + revs.map(function (rv) { return '<button class="btn sm" data-dl="' + rv.docNo + '">' + rv.rev + '차 PDF ↓</button>'; }).join('') +
                  '<button class="btn sm ghost" data-gift="' + last.docNo + '">자원기부 확인서 ↓</button></div>' +
                '</div>';
            }).join('') : '<div class="empty"><div class="big">발급된 견적서가 없습니다</div><span>견적을 계산해 발행해 보세요.</span></div>') +
          '</div></div>' +
          '<div class="card reveal"><div class="card-h"><h3>내 주문·예약</h3><a class="small" style="color:var(--brand-d)" href="#/order">전체 보기</a></div><div class="card-b" style="padding:8px 0">' +
            (myOrders.length ? myOrders.slice(0, 4).map(function (o) {
              return '<div class="between" style="padding:11px 18px;border-bottom:1px solid var(--line2)"><div><b class="mono small">' + o.id + '</b> ' + statusBadge('order', o.status) + '<div class="small muted">' + o.summary + '</div></div><div class="right"><div style="font-weight:700">' + GD.won(o.amount) + '</div><div class="small muted">' + (o.paid ? '결제완료' : o.billed ? '청구됨' : '미청구') + '</div></div></div>';
            }).join('') : '<div class="empty"><span>주문·예약 내역이 없습니다.</span></div>') +
          '</div></div>' +
        '</div>' +
      '</div>';

    app.querySelectorAll('[data-dl]').forEach(function (b) { b.onclick = function () { var q = findQuote(b.getAttribute('data-dl')); downloadPDF(q, m, '견적서'); }; });
    app.querySelectorAll('[data-gift]').forEach(function (b) { b.onclick = function () { var q = findQuote(b.getAttribute('data-gift')); downloadPDF(q, m, '자원기부확인서'); }; });
    $('#editMe').onclick = function () { editMe(m); };
  }
  function editMe(m) {
    var mo = modal('내 정보 수정',
      field('담당 학년·반', '<input class="inp" id="eGrade" value="' + (m.grade || '') + '" />') +
      field('연락처', '<input class="inp" id="eTel" value="' + m.tel + '" />') +
      field('기관명', '<input class="inp" id="eOrg" value="' + m.org + '" />'),
      '<button class="btn" id="eCancel">취소</button><button class="btn pri" id="eSave">저장</button>');
    mo.ov.querySelector('#eCancel').onclick = mo.close;
    mo.ov.querySelector('#eSave').onclick = function () {
      m.grade = mo.ov.querySelector('#eGrade').value.trim(); m.tel = mo.ov.querySelector('#eTel').value.trim(); m.org = mo.ov.querySelector('#eOrg').value.trim();
      saveDB(); mo.close(); toast('정보가 수정되었습니다.'); router(); renderAuth();
    };
  }

  /* =====================================================================
     다운로드 센터 · 약관
     ===================================================================== */
  function viewDownloads() {
    var docs = [
      { n: 'GREENDESK 교사 B2B 이용약관', f: '이용약관.txt', body: termsText() },
      { n: '개인정보 처리방침', f: '개인정보처리방침.txt', body: privacyText() },
      { n: '2026 교구 카탈로그(단가표)', f: '교구_단가표.csv', body: catalogCSV(), csv: true }
    ];
    app.innerHTML =
      '<h2 style="font-size:24px;margin-bottom:6px">다운로드 센터</h2><p class="muted small" style="margin-bottom:18px">기본 서류와 단가표를 내려받을 수 있습니다.</p>' +
      '<div class="card" style="max-width:640px"><div class="card-b" style="padding:8px 0">' +
      docs.map(function (d, i) { return '<div class="between" style="padding:14px 18px;border-bottom:1px solid var(--line2)"><div><b>' + d.n + '</b><div class="small muted">' + d.f + '</div></div><button class="btn sm" data-dc="' + i + '">다운로드 ↓</button></div>'; }).join('') +
      '</div></div>';
    app.querySelectorAll('[data-dc]').forEach(function (b, i) { b.onclick = function () { var d = docs[i]; downloadBlob(d.f, d.body, d.csv); }; });
  }
  function downloadBlob(name, text, csv) {
    var prefix = csv ? '﻿' : ''; // CSV는 엑셀 한글 대응 BOM
    var blob = new Blob([prefix + text], { type: (csv ? 'text/csv' : 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = url; a.download = name; a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500); toast(name + ' 다운로드');
  }
  function catalogCSV() {
    return '교구명,분류,단위,공급단가\n' + GD.PRODUCTS.map(function (p) { return [p.name, p.group, p.unit, p.price].join(','); }).join('\n');
  }
  function viewTerms() { app.innerHTML = '<div style="max-width:720px;margin:0 auto"><h2 style="font-size:23px;margin-bottom:12px">이용약관 · 개인정보</h2><div class="card pad" style="white-space:pre-wrap;font-size:13.5px;line-height:1.9;color:var(--ink2)">' + termsText() + '\n\n──────────\n\n' + privacyText() + '</div></div>'; }
  function termsText() { return '[GREENDESK 교사 전용 B2B 이용약관]\n\n제1조(목적) 본 약관은 (주)초록순환교육이 제공하는 교사 전용 견적·주문 서비스의 이용 조건을 규정합니다.\n제2조(회원) 회원은 어린이집·유치원·초중고 소속 교사로, 고유번호증 제출과 관리자 승인을 거쳐 가입됩니다.\n제3조(견적·주문) 견적서는 회차별로 보존되며, 유효기간 내 유효합니다. 결제는 세금계산서 발행 후 오프라인으로 진행됩니다.\n제4조(면책) 본 데모의 모든 데이터는 가상이며 실제 거래 효력이 없습니다.'; }
  function privacyText() { return '[개인정보 처리방침]\n\n1. 수집항목: 이름, 연락처, 이메일, 소속 기관명, 담당 학년, 고유번호증 파일\n2. 이용목적: 회원 승인 심사, 견적서·확인서 발행 및 발송, 주문 처리\n3. 보관·파기: 업로드 서류는 비공개 저장되며 승인 심사 목적 외 사용되지 않습니다.\n4. 본 데모는 실제 개인정보를 수집하지 않습니다.'; }

  /* ---------- 공용 뱃지/빈 상태 ---------- */
  function statusBadge(kind, s) {
    var map = kind === 'quote'
      ? { '1차 발행': 'b-blue', '수정요청': 'b-amber', '재발행': 'b-blue', '확정': 'b-green' }
      : { '접수': 'b-blue', '진행중': 'b-amber', '완료': 'b-green', '청구': 'b-blue', '결제완료': 'b-green' };
    return '<span class="badge ' + (map[s] || 'b-gray') + '">' + s + '</span>';
  }
  function emptyBox(big, sub, href, btn) { return '<div class="card"><div class="empty"><div class="big">' + big + '</div><span>' + sub + '</span><div style="margin-top:14px"><a class="btn pri" href="' + href + '">' + btn + '</a></div></div></div>'; }
  function notFound(msg) { return '<div class="empty"><div class="big">' + msg + '</div><a class="btn" href="#/mypage" style="margin-top:12px">마이페이지로</a></div>'; }

  /* ---------- 시작 ---------- */
  renderAuth();
  router();
})();
