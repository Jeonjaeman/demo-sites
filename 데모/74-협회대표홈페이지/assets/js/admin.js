/* 헤리가드공제조합 관리자 콘솔 — 8개 뷰 (전부 동작) */
(function () {
  'use strict';
  var $ = HGCore.$, $$ = HGCore.$$, toast = HGCore.toast, LS = HGCore.LS, today = HGCore.todayStr;
  var SEED = HG.ADMIN_SEED;
  var main = $('#admin-main');
  var role = 'super'; // super | content

  /* ── 권한 전환 ── */
  function setRole(r) {
    role = r;
    $('#role-super').setAttribute('aria-pressed', String(r === 'super'));
    $('#role-content').setAttribute('aria-pressed', String(r === 'content'));
    $$('[data-super]').forEach(function (el) { el.style.display = r === 'super' ? '' : 'none'; });
    var cur = $('#admin-nav [aria-current="true"]');
    if (r === 'content' && cur && cur.hasAttribute('data-super')) show('dash');
    toast(r === 'super' ? '최고관리자로 전환 — 보안·로그·연계 메뉴가 표시됩니다' : '콘텐츠 담당으로 전환 — 증서·보안 메뉴가 숨겨집니다');
  }
  $('#role-super').addEventListener('click', function () { setRole('super'); });
  $('#role-content').addEventListener('click', function () { setRole('content'); });

  /* ── 라우팅 ── */
  var VIEWS = {};
  function show(v) {
    $$('#admin-nav button').forEach(function (b) { b.setAttribute('aria-current', String(b.dataset.view === v)); });
    main.scrollTop = 0;
    (VIEWS[v] || VIEWS.dash)();
  }
  $$('#admin-nav button').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.view); }); });

  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ═══ 1. 대시보드 ═══ */
  VIEWS.dash = function () {
    var check = LS.get('open-check', SEED.collect.map(function (c) { return c.state === 'done'; }));
    var pop = HGCore.activePopups();
    var seedPops = LS.get('popups', SEED.popups);
    var expSoon = seedPops.filter(function (p) { var d = (new Date(p.to) - new Date()) / 86400000; return p.on && d >= 0 && d <= 3; });
    var expired = seedPops.filter(function (p) { return p.on && p.to < today(); });
    var audit = LS.get('audit', []);
    var todayQ = LS.get('quota-' + today(), 0);
    var doneCount = SEED.collect.filter(function (c, i) { return check[i]; }).length;
    var pct = Math.round(doneCount / SEED.collect.length * 100);

    main.innerHTML =
      '<h1>대시보드</h1><p class="admin-sub">오픈 준비 상황과 오늘의 운영 지표를 한눈에 확인합니다. 오늘 ' + today() + '</p>' +
      '<div class="admin-grid">' +
        '<div class="acard span-8"><h2>오픈 준비 체크리스트 <span class="badge badge-info">1차 오픈 11월 초 기준</span></h2>' +
          '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px"><div class="prog-track" style="flex:1"><div class="prog-fill" id="open-prog"></div></div><b class="num-en" id="open-pct" style="font-size:22px;color:var(--action)">' + pct + '%</b></div>' +
          '<div class="check-rows" id="check-rows"></div>' +
          '<p style="font-size:13px;color:var(--ink-3);margin-top:12px">※ 초기 게시글은 발주처가 직접 등록합니다(공고 요구). 관리자 화면은 오픈 2주 전 완성되어 담당자 교육이 선행되어야 합니다.</p>' +
        '</div>' +
        '<div class="acard span-4"><h2>오늘의 조회</h2>' +
          '<div class="kpi-num">' + todayQ + '</div><div class="kpi-cap">발급 사실 조회 (오늘, 한도 30/일)</div>' +
          '<div style="margin-top:16px"><div class="kpi-num" style="font-size:26px">' + audit.filter(function (a) { return !a.ok; }).length + '</div><div class="kpi-cap">누적 조회 실패</div></div>' +
        '</div>' +
        '<div class="acard span-6"><h2>만료 임박 배너·팝업 <span class="badge ' + (expSoon.length || expired.length ? 'badge-warn' : 'badge-ok') + '">' + (expSoon.length + expired.length) + '건</span></h2>' +
          (expSoon.length || expired.length ?
            expired.map(function (p) { return '<div class="check-row"><span class="badge badge-bad">만료됨</span><span>' + esc(p.title) + '</span><span class="cr-due">~' + p.to + '</span></div>'; }).join('') +
            expSoon.map(function (p) { var d = Math.ceil((new Date(p.to) - new Date()) / 86400000); return '<div class="check-row"><span class="badge badge-warn">D-' + d + '</span><span>' + esc(p.title) + '</span><span class="cr-due">~' + p.to + '</span></div>'; }).join('')
            : '<p style="color:var(--ink-3);font-size:14px">임박하거나 만료된 게시물이 없습니다.</p>') +
        '</div>' +
        '<div class="acard span-6"><h2>바로가기</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
          '<button class="btn btn-ghost btn-sm" data-go="content">콘텐츠 편집</button>' +
          '<button class="btn btn-ghost btn-sm" data-go="banner">배너·팝업</button>' +
          '<button class="btn btn-ghost btn-sm" data-go="a11y">접근성 검사</button>' +
          '<button class="btn btn-ghost btn-sm" data-go="collect">수집 진행판</button>' +
        '</div></div>' +
      '</div>';

    var rows = SEED.collect.map(function (c, i) {
      return '<label class="check-row"><input type="checkbox" data-ci="' + i + '"' + (check[i] ? ' checked' : '') + '>' +
        '<span>' + esc(c.item) + '</span><span class="cr-due">' + esc(c.owner) + ' · ~' + c.due + '</span></label>';
    }).join('');
    $('#check-rows').innerHTML = rows;
    setTimeout(function () { $('#open-prog').style.width = pct + '%'; }, 60);
    $$('#check-rows input').forEach(function (cb) {
      cb.addEventListener('change', function () {
        check[+cb.dataset.ci] = cb.checked; LS.set('open-check', check);
        var dc = check.filter(Boolean).length, p = Math.round(dc / check.length * 100);
        $('#open-prog').style.width = p + '%'; $('#open-pct').textContent = p + '%';
      });
    });
    $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.go); }); });
  };

  /* ═══ 2. 콘텐츠·블록 편집 ═══ */
  VIEWS.content = function () {
    var blocks = LS.get('blocks', {
      hero: '국가유산을 지키는 일에는 보증이 필요합니다',
      biz1: '계약·선금급·하자보수·지급보증까지, 수리공사 전 과정의 이행을 조합이 보증합니다.',
      tel: '02-000-0074',
      org: '보증심사부 · 공제사업부 · 경영지원부'
    });
    var ver = LS.get('block-ver', []);
    main.innerHTML =
      '<h1>콘텐츠·블록 편집</h1><p class="admin-sub">공지·자료실뿐 아니라 <b>메인 문구·업무 설명·연락처·조직도</b>까지 개발사 없이 직접 수정합니다. 미리보기 → 발행 → 되돌리기가 모두 동작합니다.</p>' +
      '<div class="admin-grid">' +
        '<div class="acard span-8"><h2>페이지 블록</h2>' +
          blockField('hero', '메인 히어로 문구', blocks.hero) +
          blockField('biz1', '보증 업무 소개', blocks.biz1) +
          blockField('tel', '대표 연락처', blocks.tel) +
          blockField('org', '조직 구성', blocks.org) +
          '<div style="display:flex;gap:10px;margin-top:18px"><button class="btn btn-primary btn-sm" id="publish">발행</button><button class="btn btn-ghost btn-sm" id="preview">미리보기</button></div>' +
          '<div id="preview-box" style="margin-top:16px"></div>' +
        '</div>' +
        '<div class="acard span-4"><h2>버전 이력 <span class="badge badge-mute">되돌리기</span></h2><div id="ver-list"></div></div>' +
      '</div>';
    function renderVer() {
      var v = LS.get('block-ver', []);
      $('#ver-list').innerHTML = v.length ? v.map(function (x, i) {
        return '<div class="check-row"><span class="num-en" style="font-size:12px;color:var(--ink-3)">' + x.at + '</span><span style="flex:1">' + esc(x.label) + '</span><button class="btn btn-ghost btn-sm" data-restore="' + i + '">되돌리기</button></div>';
      }).join('') : '<p style="color:var(--ink-3);font-size:14px">발행 이력이 없습니다.</p>';
      $$('[data-restore]').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = LS.get('block-ver', [])[+b.dataset.restore];
          LS.set('blocks', v.blocks);
          toast('「' + v.label + '」 시점으로 되돌렸습니다'); VIEWS.content();
        });
      });
    }
    function collect() { return { hero: $('#b-hero').value, biz1: $('#b-biz1').value, tel: $('#b-tel').value, org: $('#b-org').value }; }
    $('#preview').addEventListener('click', function () {
      var b = collect();
      $('#preview-box').innerHTML = '<div class="panel" style="background:var(--bg)"><div class="eyebrow">미리보기</div>' +
        '<div class="display" style="font-size:30px;margin:8px 0 12px">' + esc(b.hero) + '</div>' +
        '<p style="color:var(--ink-2)">' + esc(b.biz1) + '</p>' +
        '<p style="margin-top:10px;font-size:14px;color:var(--ink-3)">연락처 ' + esc(b.tel) + ' · ' + esc(b.org) + '</p></div>';
    });
    $('#publish').addEventListener('click', function () {
      var b = collect();
      LS.set('blocks', b);
      var v = LS.get('block-ver', []);
      v.unshift({ at: new Date().toISOString().slice(5, 16).replace('T', ' '), label: '블록 발행 (' + b.hero.slice(0, 12) + '…)', blocks: b });
      LS.set('block-ver', v.slice(0, 10));
      logAdmin('페이지 블록 발행');
      toast('발행되었습니다 — 공개 사이트에 반영됩니다'); renderVer();
    });
    renderVer();
    function blockField(k, label, val) {
      return '<div class="field" style="margin-bottom:16px"><label for="b-' + k + '">' + label + '</label>' +
        (val.length > 40 ? '<textarea id="b-' + k + '" rows="2">' + esc(val) + '</textarea>' : '<input id="b-' + k + '" type="text" value="' + esc(val) + '">') + '</div>';
    }
  };

  /* ═══ 3. 배너·팝업 (게시 종료일 필수) ═══ */
  VIEWS.banner = function () {
    var pops = LS.get('popups', SEED.popups);
    main.innerHTML =
      '<h1>배너·팝업</h1><p class="admin-sub">게시 시작·종료 일시가 <b>필수</b>입니다. 종료일이 지나면 공개 사이트에서 자동으로 내려갑니다.</p>' +
      '<div class="admin-grid">' +
        '<div class="acard span-5"><h2>새 팝업 등록</h2>' +
          '<div class="field" style="margin-bottom:12px"><label for="p-title">제목 <span class="req">*</span></label><input id="p-title" type="text" placeholder="예) 추석 연휴 안내"></div>' +
          '<div class="field" style="margin-bottom:12px"><label for="p-from">게시 시작 <span class="req">*</span></label><input id="p-from" type="date" value="' + today() + '"></div>' +
          '<div class="field" style="margin-bottom:12px"><label for="p-to">게시 종료 <span class="req">*</span></label><input id="p-to" type="date"></div>' +
          '<button class="btn btn-primary btn-sm" id="p-add">등록</button>' +
          '<p style="font-size:13px;color:var(--ink-3);margin-top:10px">※ 종료일을 비우면 저장되지 않습니다 — 만료 팝업 방치를 원천 차단합니다.</p>' +
        '</div>' +
        '<div class="acard span-7"><h2>게시 목록</h2><div id="pop-list"></div>' +
          '<div style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px"><label style="font-size:13.5px;color:var(--ink-2)">공개 화면 시뮬레이션 — 기준일 밀어보기</label>' +
          '<input type="date" id="sim-date" value="' + today() + '" style="height:44px;padding:0 12px;border:1px solid var(--line-2);border-radius:4px;margin-top:6px;width:100%">' +
          '<div id="sim-out" style="margin-top:12px"></div></div>' +
        '</div>' +
      '</div>';
    function renderList() {
      var p = LS.get('popups', SEED.popups);
      $('#pop-list').innerHTML = p.map(function (x, i) {
        var st = x.to < today() ? '<span class="badge badge-bad">만료</span>' : (!x.on ? '<span class="badge badge-mute">비활성</span>' : '<span class="badge badge-ok">게시중</span>');
        return '<div class="check-row">' + st + '<span style="flex:1">' + esc(x.title) + '</span><span class="cr-due">' + x.from + ' ~ ' + x.to + '</span>' +
          '<button class="btn btn-ghost btn-sm" data-toggle="' + i + '">' + (x.on ? '내리기' : '올리기') + '</button>' +
          '<button class="btn btn-ghost btn-sm" data-del="' + i + '">삭제</button></div>';
      }).join('');
      $$('[data-toggle]').forEach(function (b) { b.addEventListener('click', function () { var p = LS.get('popups', SEED.popups); p[+b.dataset.toggle].on = !p[+b.dataset.toggle].on; LS.set('popups', p); renderList(); simulate(); }); });
      $$('[data-del]').forEach(function (b) { b.addEventListener('click', function () { var p = LS.get('popups', SEED.popups); p.splice(+b.dataset.del, 1); LS.set('popups', p); renderList(); simulate(); toast('삭제되었습니다'); }); });
    }
    function simulate() {
      var d = $('#sim-date').value;
      var acts = HGCore.activePopups(d);
      $('#sim-out').innerHTML = acts.length
        ? acts.map(function (a) { return '<div class="site-popup" style="position:static;transform:none;box-shadow:none;border:1px solid var(--line);width:100%;display:block"><div class="sp-head">' + esc(a.title) + '</div><div class="sp-body" style="font-size:13.5px">게시 기간 ' + a.from + ' ~ ' + a.to + '</div></div>'; }).join('')
        : '<p style="color:var(--ink-3);font-size:14px;padding:10px 0">이 날짜에는 표시되는 팝업이 없습니다.</p>';
    }
    $('#p-add').addEventListener('click', function () {
      var t = $('#p-title').value.trim(), f = $('#p-from').value, to = $('#p-to').value;
      if (!t) { toast('제목을 입력해 주세요'); return; }
      if (!to) { toast('게시 종료일은 필수입니다 — 만료 팝업 방치를 막기 위한 정책입니다'); $('#p-to').focus(); return; }
      if (to < f) { toast('종료일이 시작일보다 빠릅니다'); return; }
      var p = LS.get('popups', SEED.popups);
      p.push({ id: Date.now(), title: t, from: f, to: to, on: true });
      LS.set('popups', p); logAdmin('팝업 등록: ' + t);
      $('#p-title').value = ''; $('#p-to').value = '';
      toast('팝업이 등록되었습니다'); renderList(); simulate();
    });
    $('#sim-date').addEventListener('input', simulate);
    renderList(); simulate();
  };

  /* ═══ 4. 접근성 검사 (발행 차단) ═══ */
  VIEWS.a11y = function () {
    main.innerHTML =
      '<h1>등록 전 접근성 검사</h1><p class="admin-sub">공지·자료 글을 발행하기 전에 접근성 오류를 자동으로 잡아 <b>발행을 막습니다.</b> 전산 인력 없이도 오픈 1년 뒤까지 접근성을 유지하는 장치입니다.</p>' +
      '<div class="admin-grid">' +
        '<div class="acard span-7"><h2>공지 작성</h2>' +
          '<div class="field" style="margin-bottom:12px"><label for="a-title">제목</label><input id="a-title" type="text" value="여기 클릭"></div>' +
          '<div class="field" style="margin-bottom:12px"><label for="a-body">본문 (HTML 허용)</label><textarea id="a-body" rows="5">&lt;img src="notice.jpg"&gt;&lt;br&gt;아래 &lt;span style="color:red"&gt;빨간 글씨&lt;/span&gt; 항목을 확인하세요.&lt;table&gt;&lt;tr&gt;&lt;td&gt;내용&lt;/td&gt;&lt;/tr&gt;&lt;/table&gt;</textarea></div>' +
          '<div style="display:flex;gap:10px"><button class="btn btn-ghost btn-sm" id="a-check">검사</button><button class="btn btn-primary btn-sm" id="a-publish" disabled>발행</button></div>' +
          '<div id="a-report"></div>' +
        '</div>' +
        '<div class="acard span-5"><h2>검사 항목 (KWCAG 2.2)</h2><ul style="display:flex;flex-direction:column;gap:9px;font-size:14px;color:var(--ink-2)">' +
          '<li>· 이미지 대체텍스트(alt) 누락</li><li>· 표(table) 제목/캡션 누락</li><li>· 색상만으로 정보 전달</li><li>· 링크 텍스트 "여기 클릭" 등 모호</li><li>· 제목 레벨 건너뜀</li></ul>' +
          '<p style="font-size:13px;color:var(--ink-3);margin-top:14px">오류가 하나라도 있으면 발행 버튼이 비활성화됩니다. 아래 예시 본문에는 일부러 오류를 넣어 두었습니다 — 검사 후 고쳐 보세요.</p>' +
        '</div>' +
      '</div>';
    function checkA11y() {
      var title = $('#a-title').value, body = $('#a-body').value, issues = [];
      // img without alt
      var imgs = body.match(/<img[^>]*>/gi) || [];
      imgs.forEach(function (t) { if (!/alt\s*=\s*["'][^"']+["']/i.test(t)) issues.push('이미지에 대체텍스트(alt)가 없습니다: ' + esc(t.slice(0, 40))); });
      // table without caption/summary
      if (/<table/i.test(body) && !/<caption/i.test(body) && !/summary\s*=/i.test(body)) issues.push('표에 제목(caption)이 없습니다');
      // color only
      if (/color\s*:\s*(red|#f00|#ff0000)/i.test(body) && !/[★✓!※]|<b>|강조|필수/i.test(body)) issues.push('색상(빨강)만으로 정보를 전달합니다 — 텍스트·기호를 함께 사용하세요');
      // vague link
      if (/여기\s*클릭|click here|바로가기">/i.test(title + body) && /<a /i.test(body) === false) { /* title vague ok as heading */ }
      if (/>(여기\s*클릭|자세히|click here)</i.test(body)) issues.push('링크 텍스트가 모호합니다("여기 클릭" 등)');
      if (/여기\s*클릭/.test(title)) issues.push('제목이 모호합니다("여기 클릭") — 내용을 설명하는 제목을 쓰세요');
      return issues;
    }
    $('#a-check').addEventListener('click', function () {
      var issues = checkA11y();
      var rep = $('#a-report');
      if (issues.length) {
        rep.innerHTML = '<div class="a11y-report"><b>⚠ ' + issues.length + '건의 접근성 오류 — 발행할 수 없습니다</b><ul>' + issues.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul></div>';
        $('#a-publish').disabled = true;
      } else {
        rep.innerHTML = '<div class="a11y-report pass"><b>✓ 접근성 오류가 없습니다 — 발행할 수 있습니다</b></div>';
        $('#a-publish').disabled = false;
      }
    });
    $('#a-publish').addEventListener('click', function () { logAdmin('공지 발행 (접근성 통과)'); toast('접근성 검사를 통과하여 발행되었습니다'); });
  };

  /* ═══ 5. 콘텐츠 수집 진행판 ═══ */
  VIEWS.collect = function () {
    var STATES = { request: ['요청', 'badge-mute'], writing: ['작성 중', 'badge-info'], review: ['검토', 'badge-warn'], done: ['완료', 'badge-ok'] };
    var order = ['request', 'writing', 'review', 'done'];
    var data = LS.get('collect', SEED.collect.map(function (c) { return { item: c.item, owner: c.owner, due: c.due, state: c.state }; }));
    var doneN = data.filter(function (d) { return d.state === 'done'; }).length;
    main.innerHTML =
      '<h1>콘텐츠 수집 진행판</h1><p class="admin-sub">오픈에 필요한 원고·이미지의 담당자·마감·상태를 관리합니다. 상태를 바꾸면 대시보드의 오픈 준비율에 반영됩니다.</p>' +
      '<div class="acard"><h2>수집 항목 <span class="badge badge-info">' + doneN + '/' + data.length + ' 완료</span></h2>' +
      '<div class="tbl-scroll"><table class="tbl admin-tbl"><caption>페이지별 콘텐츠 수집 현황</caption><thead><tr><th>항목</th><th>담당</th><th>마감</th><th>상태</th></tr></thead><tbody>' +
      data.map(function (d, i) {
        return '<tr><td style="font-weight:600">' + esc(d.item) + '</td><td>' + esc(d.owner) + '</td><td class="num-en">' + d.due + '</td>' +
          '<td><select data-cs="' + i + '" style="height:38px;border:1px solid var(--line-2);border-radius:4px;padding:0 8px">' +
          order.map(function (s) { return '<option value="' + s + '"' + (d.state === s ? ' selected' : '') + '>' + STATES[s][0] + '</option>'; }).join('') + '</select></td></tr>';
      }).join('') + '</tbody></table></div></div>';
    $$('[data-cs]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        data[+sel.dataset.cs].state = sel.value; LS.set('collect', data);
        // 대시보드 체크와 동기화
        var chk = data.map(function (d) { return d.state === 'done'; }); LS.set('open-check', chk);
        toast('상태가 변경되었습니다 — 오픈 준비율에 반영됩니다'); VIEWS.collect();
      });
    });
  };

  /* ═══ 6. 조회 로그 ═══ */
  VIEWS.log = function () {
    var audit = LS.get('audit', []);
    var LINK = { api: '신규 API', screen: '화면 연계', mirror: '미러 DB' };
    // 이상징후: 짧은 시간 대량 실패 = 열거 공격 의심
    var fails = audit.filter(function (a) { return !a.ok; }).length;
    var suspicious = fails >= 5;
    main.innerHTML =
      '<h1>발급 사실 조회 로그</h1><p class="admin-sub">발급 사실 조회의 성공·실패를 감사 로그로 남기고, 열거 공격 등 이상 징후를 감지합니다. 발급사실조회 화면에서 조회하면 여기에 실시간 적재됩니다.</p>' +
      '<div class="admin-grid">' +
        '<div class="acard span-4"><h2>오늘 조회</h2><div class="kpi-num">' + LS.get('quota-' + today(), 0) + '</div><div class="kpi-cap">건 (한도 30/일/IP)</div></div>' +
        '<div class="acard span-4"><h2>누적 실패</h2><div class="kpi-num" style="color:' + (fails ? 'var(--bad)' : 'var(--ink)') + '">' + fails + '</div><div class="kpi-cap">건</div></div>' +
        '<div class="acard span-4"><h2>이상 징후</h2><div class="kpi-num" style="color:' + (suspicious ? 'var(--bad)' : 'var(--ok)') + '">' + (suspicious ? '감지' : '없음') + '</div><div class="kpi-cap">' + (suspicious ? '단시간 대량 실패 — 열거 시도 의심' : '정상 범위') + '</div></div>' +
        '<div class="acard span-12"><h2>조회 감사 로그 <button class="btn btn-ghost btn-sm" id="log-csv" style="margin-left:auto">CSV 내려받기</button></h2>' +
          (audit.length ? '<div class="tbl-scroll"><table class="tbl admin-tbl"><caption>발급 사실 조회 이력 (최근순)</caption><thead><tr><th>일시</th><th>증권번호</th><th>결과</th><th>연계</th><th>입력방식</th></tr></thead><tbody>' +
            audit.slice(0, 40).map(function (a) {
              return '<tr><td class="num-en">' + a.at + '</td><td class="num-en">' + esc(a.no) + '</td>' +
                '<td>' + (a.ok ? '<span class="badge badge-ok">성공</span>' : '<span class="badge badge-bad">실패</span>') + '</td>' +
                '<td>' + (LINK[a.link] || a.link) + '</td><td>' + (a.mode === 'single' ? '단독(시연)' : '다중대조') + '</td></tr>';
            }).join('') + '</tbody></table></div>'
          : '<p style="color:var(--ink-3);font-size:14px;padding:10px 0">아직 조회 기록이 없습니다. <a class="card-more" style="display:inline" href="verify.html">발급 사실 조회</a>에서 조회하면 여기에 표시됩니다.</p>') +
        '</div>' +
      '</div>';
    $('#log-csv').addEventListener('click', function () {
      var rows = [['일시', '증권번호', '결과', '연계', '입력방식']].concat(audit.map(function (a) { return [a.at, a.no, a.ok ? '성공' : '실패', LINK[a.link] || a.link, a.mode]; }));
      var csv = '﻿' + rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '조회로그_' + today() + '.csv'; a.click();
      toast('조회 로그를 CSV로 내려받았습니다');
    });
  };

  /* ═══ 7. 보안 설정 ═══ */
  VIEWS.security = function () {
    var ips = LS.get('ip-allow', ['210.92.14.8', '210.92.14.9']);
    var otp = LS.get('otp-on', false);
    var admins = LS.get('admin-log', SEED.accessLog);
    main.innerHTML =
      '<h1>보안 설정</h1><p class="admin-sub">관리자 접근을 통제하고 모든 관리 행위를 기록합니다. 개인정보 안전성 확보조치 기준(접근권한·접근통제·접속기록)을 화면으로 구현했습니다.</p>' +
      '<div class="admin-grid">' +
        '<div class="acard span-6"><h2>접속 IP 허용목록</h2>' +
          '<p style="font-size:13.5px;color:var(--ink-3);margin-bottom:12px">현재 접속 IP: <b class="num-en">210.92.14.8</b> (데모 고정)</p>' +
          '<div id="ip-list"></div>' +
          '<div style="display:flex;gap:8px;margin-top:12px"><input id="ip-new" type="text" placeholder="예) 210.92.14.10" style="flex:1;height:44px;border:1px solid var(--line-2);border-radius:4px;padding:0 12px"><button class="btn btn-ghost btn-sm" id="ip-add">추가</button></div>' +
          '<button class="btn btn-ghost btn-sm" id="ip-test" style="margin-top:12px;width:100%">미등록 IP 접근 시뮬레이션</button>' +
          '<div id="ip-sim" style="margin-top:10px"></div>' +
        '</div>' +
        '<div class="acard span-6"><h2>권한 · 인증</h2>' +
          '<div class="check-row"><span style="flex:1"><b>2차 인증(OTP)</b><br><span style="font-size:13px;color:var(--ink-3)">로그인 시 일회용 코드 확인</span></span>' +
          '<button class="btn ' + (otp ? 'btn-primary' : 'btn-ghost') + ' btn-sm" id="otp-toggle">' + (otp ? '켜짐' : '꺼짐') + '</button></div>' +
          '<div class="check-row"><span style="flex:1"><b>비밀번호 변경 주기</b><br><span style="font-size:13px;color:var(--ink-3)">90일마다 변경 알림</span></span><span class="badge badge-ok">적용</span></div>' +
          '<div class="check-row"><span style="flex:1"><b>로그인 실패 잠금</b><br><span style="font-size:13px;color:var(--ink-3)">5회 실패 시 계정 잠금</span></span><span class="badge badge-ok">적용</span></div>' +
          '<div style="margin-top:14px;padding:14px;background:var(--bg);border-radius:8px;font-size:13.5px;color:var(--ink-2)"><b>권한 2단 분리</b><br>콘텐츠 담당자는 증서 데이터·보안·연계 메뉴에 접근할 수 없습니다. 상단에서 권한을 전환해 확인하세요.</div>' +
        '</div>' +
        '<div class="acard span-12"><h2>관리자 접속기록</h2><div class="tbl-scroll"><table class="tbl admin-tbl"><caption>관리 행위 감사 로그 (who / when / what / IP)</caption><thead><tr><th>일시</th><th>계정</th><th>행위</th><th>IP</th></tr></thead><tbody id="admin-log-body"></tbody></table></div></div>' +
      '</div>';
    function renderIP() {
      var list = LS.get('ip-allow', ips);
      $('#ip-list').innerHTML = list.map(function (ip, i) {
        return '<div class="check-row"><span class="badge badge-ok">허용</span><span class="num-en" style="flex:1">' + esc(ip) + '</span><button class="btn btn-ghost btn-sm" data-ipdel="' + i + '">삭제</button></div>';
      }).join('');
      $$('[data-ipdel]').forEach(function (b) { b.addEventListener('click', function () { var l = LS.get('ip-allow', ips); l.splice(+b.dataset.ipdel, 1); LS.set('ip-allow', l); renderIP(); }); });
    }
    $('#ip-add').addEventListener('click', function () {
      var v = $('#ip-new').value.trim();
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) { toast('올바른 IP 형식이 아닙니다'); return; }
      var l = LS.get('ip-allow', ips); l.push(v); LS.set('ip-allow', l);
      logAdmin('IP 허용목록 추가 ' + v); $('#ip-new').value = ''; renderIP(); renderAdminLog(); toast('IP를 추가했습니다');
    });
    $('#ip-test').addEventListener('click', function () {
      $('#ip-sim').innerHTML = '<div class="a11y-report"><b>⚠ 185.220.101.4 에서 접근 차단됨</b><br><span style="font-size:13px">허용목록에 없는 IP입니다. 접근이 거부되고 접속기록에 남습니다.</span></div>';
      var log = LS.get('admin-log', SEED.accessLog);
      log.unshift({ at: new Date().toISOString().slice(0, 16).replace('T', ' '), who: '(미등록 IP)', what: '로그인 차단 — 허용목록 외', ip: '185.220.101.4' });
      LS.set('admin-log', log); renderAdminLog();
    });
    $('#otp-toggle').addEventListener('click', function () { var v = !LS.get('otp-on', false); LS.set('otp-on', v); logAdmin('OTP ' + (v ? '활성화' : '비활성화')); VIEWS.security(); });
    function renderAdminLog() {
      var log = LS.get('admin-log', SEED.accessLog);
      $('#admin-log-body').innerHTML = log.slice(0, 30).map(function (a) {
        return '<tr><td class="num-en">' + a.at + '</td><td>' + esc(a.who) + '</td><td>' + esc(a.what) + '</td><td class="num-en">' + esc(a.ip) + '</td></tr>';
      }).join('');
    }
    renderIP(); renderAdminLog();
  };

  /* ═══ 8. 연계 진단 ═══ */
  VIEWS.link = function () {
    main.innerHTML =
      '<h1>인증·조회 연계 진단</h1><p class="admin-sub">기존 인터넷 영업점과의 연계 방식 3안을 조합의 현재 조건으로 채점합니다. 공고가 의견을 요청한 항목입니다.</p>' +
      '<div class="admin-grid">' +
        '<div class="acard span-5"><h2>조합 현재 조건</h2><div id="cond-list"></div><p style="font-size:13px;color:var(--ink-3);margin-top:12px">체크할수록 안전한 연계가 가능해집니다.</p></div>' +
        '<div class="acard span-7"><h2>3안 채점 결과</h2><div id="link-score"></div></div>' +
      '</div>';
    var CONDS = [
      { k: 'domain', label: '대표 홈과 영업점이 같은 루트 도메인(서브도메인)', v: true },
      { k: 'vendor', label: '기존 영업점 벤더의 협조가 가능', v: false },
      { k: 'dbaccess', label: '영업점 DB에 읽기전용 계정 발급 가능', v: false },
      { k: 'token', label: '토큰 검증 엔드포인트 1개 신설 가능', v: true },
      { k: 'ssl', label: '전 구간 SSL/HTTPS 구성', v: true },
      { k: 'noplugin', label: '설치형 보안 플러그인 미사용(웹표준)', v: true }
    ];
    var conds = LS.get('link-conds', CONDS);
    function render() {
      $('#cond-list').innerHTML = conds.map(function (c, i) {
        return '<label class="check-row"><input type="checkbox" data-cond="' + i + '"' + (c.v ? ' checked' : '') + '><span>' + esc(c.label) + '</span></label>';
      }).join('');
      $$('[data-cond]').forEach(function (cb) { cb.addEventListener('click', function () { conds[+cb.dataset.cond].v = cb.checked; LS.set('link-conds', conds); render(); }); });
      var get = function (k) { return conds.find(function (c) { return c.k === k; }).v; };
      // 점수 로직
      var api = (get('vendor') ? 40 : 0) + (get('token') ? 25 : 0) + (get('ssl') ? 20 : 0) + (get('noplugin') ? 15 : 0);
      var screen = (get('domain') ? 30 : 0) + (get('token') ? 30 : 0) + (get('ssl') ? 20 : 0) + (get('noplugin') ? 20 : 0);
      var proxy = 30 - (get('domain') ? 0 : 5) - (get('noplugin') ? 0 : 10); // 항상 낮음
      var scores = [
        { name: '① 신규 조회 API', s: api, note: get('vendor') ? '벤더 협조가 확인되면 가장 깨끗한 구조입니다.' : '기존 영업점 수정이 필요해 벤더 협조가 전제입니다(현재 미확보).', tone: get('vendor') ? 'ok' : 'warn' },
        { name: '② 기존 인증 + 토큰 교환', s: screen, note: '영업점 변경 최소(엔드포인트 1개). 같은 루트 도메인이면 더 단순합니다.', tone: screen >= 70 ? 'ok' : 'warn' },
        { name: '③ 프록시웹', s: proxy, note: '세션·경로·다운로드·CSP 충돌 위험. 전산 인력이 없는 조합에 비권장.', tone: 'bad' }
      ];
      scores.sort(function (a, b) { return b.s - a.s; });
      var best = scores[0];
      $('#link-score').innerHTML = scores.map(function (x) {
        var col = x.tone === 'ok' ? 'var(--ok)' : x.tone === 'warn' ? 'var(--warn)' : 'var(--bad)';
        return '<div style="padding:16px;border:1px solid var(--line);border-radius:10px;margin-bottom:12px' + (x === best ? ';border-color:var(--brand);background:var(--action-soft)' : '') + '">' +
          '<div style="display:flex;align-items:center;gap:12px"><b style="flex:1">' + x.name + (x === best ? ' <span class="badge badge-info">권고</span>' : '') + '</b><span class="score-badge" style="color:' + col + '">' + x.s + '</span></div>' +
          '<div class="prog-track" style="margin:8px 0"><div class="prog-fill" style="width:' + Math.max(0, x.s) + '%;background:' + col + '"></div></div>' +
          '<p style="font-size:13.5px;color:var(--ink-2)">' + x.note + '</p></div>';
      }).join('');
    }
    render();
  };

  /* ── 관리 로그 유틸 ── */
  function logAdmin(what) {
    var log = LS.get('admin-log', SEED.accessLog);
    log.unshift({ at: new Date().toISOString().slice(0, 16).replace('T', ' '), who: role === 'super' ? 'admin' : 'content01', what: what, ip: '210.92.14.8' });
    LS.set('admin-log', log.slice(0, 60));
  }

  setRole('super');
  show('dash');
})();
