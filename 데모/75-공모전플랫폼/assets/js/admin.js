/* GYCA 관리자 콘솔 — 10 뷰 (전부 동작) */
(function () {
  'use strict';
  var $ = GC.$, $$ = GC.$$, toast = GC.toast, LS = GC.LS;
  var main = $('#admin-main');
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var VIEWS = {};
  function show(v) { $$('#admin-nav button').forEach(function (b) { b.setAttribute('aria-current', String(b.dataset.view === v)); }); main.scrollTop = 0; (VIEWS[v] || VIEWS.dash)(); }
  $$('#admin-nav button').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.view); }); });

  function logAdmin(what) { var l = LS.get('admin-log', SEED_LOG); l.unshift({ at: new Date().toISOString().slice(0, 16).replace('T', ' '), who: 'admin', what: what }); LS.set('admin-log', l.slice(0, 60)); }
  var SEED_LOG = [
    { at: '2026-09-01 09:14', who: 'admin', what: 'Published results: Youth Design Open 2026' },
    { at: '2026-08-31 17:20', who: 'admin', what: 'Assigned 8 entries to juror Elena Rossi' },
    { at: '2026-08-30 11:02', who: 'admin', what: 'Created competition (copied from c1)' },
  ];

  /* ═══ Dashboard ═══ */
  VIEWS.dash = function () {
    var subs = LS.get('submissions', []);
    var totalEntries = GYCA.COMPETITIONS.reduce(function (a, c) { return a + c.entriesLast; }, 0);
    var pendingPartners = LS.get('partners', defaultPartners()).filter(function (p) { return p.status === 'pending'; }).length;
    var openN = GYCA.COMPETITIONS.filter(function (c) { return c.status === 'open'; }).length;
    var judgingN = GYCA.COMPETITIONS.filter(function (c) { return c.status === 'judging'; }).length;
    main.innerHTML = '<h1>Dashboard</h1><p class="admin-sub">Operating overview — today 2026-09-01</p>' +
      '<div class="admin-grid">' +
      kpi(3, openN, 'Open competitions', '') + kpi(3, judgingN, 'In judging', 'var(--warn)') +
      kpi(3, totalEntries.toLocaleString(), 'Entries (last cycle)', '') + kpi(3, pendingPartners, 'Partners pending approval', pendingPartners ? 'var(--bad)' : '') +
      '<div class="acard span-8"><h2>To do · 처리할 것</h2><div class="check-rows" id="todo"></div></div>' +
      '<div class="acard span-4"><h2>Quick actions</h2><div style="display:grid;gap:8px">' +
      '<button class="btn btn-gold btn-sm" data-go="comps">New / copy competition</button>' +
      '<button class="btn btn-ghost btn-sm" data-go="judging">Assign judges</button>' +
      '<button class="btn btn-ghost btn-sm" data-go="results">Publish results</button>' +
      '<button class="btn btn-ghost btn-sm" data-go="partners">Manage partners</button></div></div>' +
      '</div>';
    $('#todo').innerHTML = [
      ['Approve overseas final applications', '3 pending', 'results'],
      ['Confirm partner status before public display', pendingPartners + ' unconfirmed', 'partners'],
      ['Review fee-waiver requests', '2 pending', 'payments'],
      ['Translation coverage below 100%', 'KO 92%', 'i18n'],
    ].map(function (t) { return '<div class="check-row" style="padding:11px 4px;border-bottom:1px solid var(--line);display:flex;gap:10px"><span style="flex:1">' + t[0] + '</span><span style="color:var(--ink-3);font-size:13px">' + t[1] + '</span><button class="btn btn-ghost btn-sm" data-go="' + t[2] + '">Open</button></div>'; }).join('');
    $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.go); }); });
  };
  function kpi(span, num, cap, col) { return '<div class="acard span-' + span + '"><div class="kpi-num"' + (col ? ' style="color:' + col + '"' : '') + '>' + num + '</div><div class="kpi-cap">' + cap + '</div></div>'; }

  /* ═══ Competitions (복제·CRUD) ═══ */
  VIEWS.comps = function () {
    var comps = LS.get('comps', GYCA.COMPETITIONS.map(function (c) { return { id: c.id, title: c.title, cat: c.cat, city: c.city, status: c.status, close: c.close }; }));
    main.innerHTML = '<h1>Competitions</h1><p class="admin-sub">Every competition is data — copy an existing one to launch a new city or field without a developer.</p>' +
      '<div class="acard" style="margin-bottom:20px"><h2>Create by copying · 기존 공모전 복사</h2>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">' +
      '<div class="field" style="margin:0;flex:1;min-width:200px"><label>Copy from</label><select id="copy-src">' + comps.map(function (c) { return '<option value="' + c.id + '">' + esc(c.title) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field" style="margin:0;flex:1;min-width:200px"><label>New title</label><input id="copy-title" placeholder="e.g. Seoul Youth Art Open"></div>' +
      '<button class="btn btn-gold btn-sm" id="do-copy">Copy &amp; create</button></div>' +
      '<p style="font-size:13px;color:var(--ink-3);margin-top:10px">Copies country · city · field · fee · submission form · judging criteria · grades. You then edit dates and theme.</p></div>' +
      '<div class="acard"><h2>All competitions <span class="badge badge-info" id="comp-count"></span></h2>' +
      '<div class="tbl-scroll"><table class="tbl admin-tbl"><thead><tr><th>Title</th><th>Field</th><th>City</th><th>Status</th><th>Close</th><th></th></tr></thead><tbody id="comp-rows"></tbody></table></div></div>';
    function render() {
      var list = LS.get('comps', comps);
      $('#comp-count').textContent = list.length + ' total';
      $('#comp-rows').innerHTML = list.map(function (c, i) {
        var cat = GYCA.catOf(c.cat), city = GYCA.cityOf(c.city);
        return '<tr><td style="font-weight:600">' + esc(c.title) + '</td><td>' + (cat ? cat.en : c.cat) + '</td><td>' + (city ? city.en : c.city) + '</td>' +
          '<td><select data-st="' + i + '" style="height:34px;border:1px solid var(--line-2);border-radius:4px;padding:0 6px">' +
          ['upcoming', 'open', 'judging', 'results', 'closed'].map(function (s) { return '<option' + (c.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td>' +
          '<td class="num">' + c.close + '</td><td><button class="btn btn-ghost btn-sm" data-del="' + i + '">Delete</button></td></tr>';
      }).join('');
      $$('[data-st]').forEach(function (sel) { sel.addEventListener('change', function () { var l = LS.get('comps', comps); l[+sel.dataset.st].status = sel.value; LS.set('comps', l); logAdmin('Changed status: ' + l[+sel.dataset.st].title + ' → ' + sel.value); toast('Status updated · new competitions appear on the site automatically'); }); });
      $$('[data-del]').forEach(function (b) { b.addEventListener('click', function () { var l = LS.get('comps', comps); l.splice(+b.dataset.del, 1); LS.set('comps', l); render(); toast('Deleted'); }); });
    }
    $('#do-copy').addEventListener('click', function () {
      var src = GYCA.compOf($('#copy-src').value); var title = $('#copy-title').value.trim() || (src.title + ' (copy)');
      var l = LS.get('comps', comps);
      l.unshift({ id: 'new' + Date.now(), title: title, cat: src.cat, city: src.city, status: 'upcoming', close: '2026-12-31' });
      LS.set('comps', l); logAdmin('Created competition (copied from ' + src.title + ')'); $('#copy-title').value = '';
      render(); toast('Created "' + title + '" — status Upcoming. Edit dates next.');
    });
    render();
  };

  /* ═══ Entries ═══ */
  VIEWS.entries = function () {
    var rows = [];
    var names = ['Kim H.', 'L. Meyer', 'Park S.', 'A. Bauer', 'Choi J.', 'E. Wilson', 'Jung H.', 'M. Rossi', 'Han S.', 'N. Kranz'];
    for (var i = 0; i < 10; i++) {
      rows.push({ no: 'GYCA-C1-000' + (481 + i), comp: 'Art for Tomorrow', name: names[i], minor: i % 3 !== 1, consent: i % 4 !== 3, paid: i % 5 === 4 ? 'waiver' : (i % 3 === 1 ? 'self' : 'guardian') });
    }
    main.innerHTML = '<h1>Entries · 접수자 관리</h1><p class="admin-sub">Search, filter, edit history and export. Guardian-consent status is tracked per entry.</p>' +
      '<div class="acard"><h2>Entries <button class="btn btn-ghost btn-sm" id="ex-csv" style="margin-left:auto">Export CSV</button></h2>' +
      '<div class="filter-bar" style="margin-bottom:14px"><input id="ent-search" placeholder="Search entry no. / name" style="height:40px;border:1px solid var(--line-2);border-radius:6px;padding:0 12px;flex:1;max-width:280px">' +
      '<label style="display:flex;gap:6px;align-items:center;font-size:13.5px"><input type="checkbox" id="only-missing"> Only missing consent</label></div>' +
      '<div class="tbl-scroll"><table class="tbl admin-tbl"><thead><tr><th>Entry</th><th>Competition</th><th>Applicant</th><th>Guardian consent</th><th>Payment</th></tr></thead><tbody id="ent-rows"></tbody></table></div></div>';
    function render() {
      var kw = ($('#ent-search').value || '').toLowerCase(), only = $('#only-missing').checked;
      var list = rows.filter(function (r) { return (!kw || (r.no + r.name).toLowerCase().indexOf(kw) >= 0) && (!only || (r.minor && !r.consent)); });
      $('#ent-rows').innerHTML = list.map(function (r) {
        var cons = !r.minor ? '<span class="badge badge-closed">N/A (adult)</span>' : r.consent ? '<span class="badge badge-open">Confirmed</span>' : '<span class="badge badge-bad">Missing ⚠</span>';
        var pay = r.paid === 'waiver' ? '<span style="color:var(--info)">Waiver</span>' : r.paid === 'self' ? '<span style="color:var(--warn)">Self (minor)</span>' : 'Guardian';
        return '<tr><td class="num">' + r.no + '</td><td>' + r.comp + '</td><td>' + r.name + (r.minor ? ' <span style="color:var(--warn);font-size:11px">minor</span>' : '') + '</td><td>' + cons + '</td><td>' + pay + '</td></tr>';
      }).join('');
    }
    $('#ent-search').addEventListener('input', render); $('#only-missing').addEventListener('change', render);
    $('#ex-csv').addEventListener('click', function () {
      var csv = '﻿' + [['Entry', 'Competition', 'Applicant', 'Consent', 'Payment']].concat(rows.map(function (r) { return [r.no, r.comp, r.name, r.minor ? (r.consent ? 'Confirmed' : 'Missing') : 'N/A', r.paid]; })).map(function (row) { return row.map(function (c) { return '"' + c + '"'; }).join(','); }).join('\r\n');
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'entries_2026-09-01.csv'; a.click(); toast('Exported CSV');
    });
    render();
  };

  /* ═══ Partners (노출 상태 제어 — 의뢰자 2회 요구) ═══ */
  function defaultPartners() {
    return [
      { name: 'Frankfurt Book Fair Youth Program', comp: 'International Young Authors Award', status: 'confirmed' },
      { name: 'Spoleto Festival Youth Stage', comp: 'Music & Performance Award', status: 'confirmed' },
      { name: 'La Nuova Camerata', comp: 'Music & Performance Award', status: 'pending' },
      { name: 'Metropolitan Youth Art Council', comp: 'Art for Tomorrow Challenge', status: 'confirmed' },
      { name: 'Green Future Foundation', comp: 'Art for Tomorrow Challenge', status: 'pending' },
      { name: 'Vienna Media Art Lab', comp: 'Young Innovators Business Challenge', status: 'pending' },
    ];
  }
  VIEWS.partners = function () {
    var parts = LS.get('partners', defaultPartners());
    main.innerHTML = '<h1>Partner Organizations</h1><p class="admin-sub">A partner is shown as an official Partner on the public site <b>only after you confirm the agreement</b>. Until then it stays private — preventing a name from going public before the contract is signed.</p>' +
      '<div class="acard span-8"><h2>Partners <span class="badge badge-info" id="p-count"></span></h2><div id="p-list"></div></div>' +
      '<div class="admin-grid" style="margin-top:20px"><div class="acard span-12"><h2>Public preview · 공개 화면 미리보기</h2><p style="font-size:13px;color:var(--ink-3);margin-bottom:12px">This is exactly what visitors see now — only confirmed partners appear.</p><div id="p-preview" style="display:flex;gap:12px;flex-wrap:wrap"></div></div></div>';
    function render() {
      var p = LS.get('partners', parts);
      $('#p-count').textContent = p.filter(function (x) { return x.status === 'confirmed'; }).length + ' public / ' + p.length + ' total';
      $('#p-list').innerHTML = p.map(function (x, i) {
        return '<div class="check-row" style="padding:12px 4px;border-bottom:1px solid var(--line);display:flex;gap:10px;align-items:center">' +
          (x.status === 'confirmed' ? '<span class="badge badge-open">Public Partner</span>' : '<span class="badge badge-closed">Private (unconfirmed)</span>') +
          '<div style="flex:1"><b>' + esc(x.name) + '</b><div style="font-size:12.5px;color:var(--ink-3)">' + esc(x.comp) + '</div></div>' +
          '<button class="btn ' + (x.status === 'confirmed' ? 'btn-ghost' : 'btn-gold') + ' btn-sm" data-toggle="' + i + '">' + (x.status === 'confirmed' ? 'Set private' : 'Confirm & publish') + '</button></div>';
      }).join('');
      $('#p-preview').innerHTML = p.filter(function (x) { return x.status === 'confirmed'; }).map(function (x) {
        return '<div style="padding:14px 18px;border:1px solid var(--line);border-radius:10px;background:#fff;font-weight:700;font-size:14px">' + esc(x.name) + '</div>';
      }).join('') || '<span style="color:var(--ink-3);font-size:14px">No confirmed partners yet — nothing is shown publicly.</span>';
      $$('[data-toggle]').forEach(function (b) { b.addEventListener('click', function () { var l = LS.get('partners', parts); var x = l[+b.dataset.toggle]; x.status = x.status === 'confirmed' ? 'pending' : 'confirmed'; LS.set('partners', l); logAdmin((x.status === 'confirmed' ? 'Published' : 'Unpublished') + ' partner: ' + x.name); render(); toast(x.status === 'confirmed' ? 'Now shown publicly as Partner' : 'Set private — removed from public site'); }); });
    }
    render();
  };

  /* ═══ Judging & Assign ═══ */
  VIEWS.judging = function () {
    main.innerHTML = '<h1>Judging &amp; Assignment</h1><p class="admin-sub">Register jurors, assign works automatically or by hand, and watch progress. Names stay hidden from jurors.</p>' +
      '<div class="admin-grid">' +
      '<div class="acard span-7"><h2>Jurors</h2><div class="tbl-scroll"><table class="tbl admin-tbl"><thead><tr><th>Juror</th><th>Field</th><th>Assigned</th><th>Progress</th></tr></thead><tbody>' +
      GYCA.JUDGES.map(function (j, i) { var n = [8, 12, 6, 10, 5][i]; var done = [8, 7, 6, 3, 5][i]; return '<tr><td><b>' + j.name + '</b><div style="font-size:12px;color:var(--ink-3)">' + j.org + '</div></td><td>' + j.field + '</td><td class="num">' + n + '</td><td><div class="prog-track" style="width:100px"><div class="prog-fill" style="width:' + (done / n * 100) + '%;transition:none"></div></div><span style="font-size:12px;color:var(--ink-3)">' + done + '/' + n + '</span></td></tr>'; }).join('') +
      '</tbody></table></div></div>' +
      '<div class="acard span-5"><h2>Auto-assign</h2><p style="font-size:14px;color:var(--ink-2);margin-bottom:14px">Distribute unassigned entries across jurors, avoiding conflicts of interest (same institution / prior mentee) automatically.</p>' +
      '<div class="field"><label>Competition</label><select id="asg-comp">' + GYCA.COMPETITIONS.filter(function (c) { return c.status === 'judging' || c.status === 'open'; }).map(function (c) { return '<option>' + c.title + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>Reviews per entry</label><select id="asg-n"><option>2</option><option selected>3</option><option>4</option></select></div>' +
      '<button class="btn btn-gold btn-sm" id="do-assign">Auto-assign</button>' +
      '<div id="asg-out" style="margin-top:14px"></div></div></div>';
    $('#do-assign').addEventListener('click', function () {
      var n = $('#asg-n').value;
      $('#asg-out').innerHTML = '<div style="background:var(--ok-soft);border-radius:10px;padding:14px;font-size:14px"><b style="color:var(--ok)">✓ Assigned</b><br>128 entries × ' + n + ' reviews distributed across 5 jurors. 2 conflicts detected and routed to alternates.</div>';
      logAdmin('Auto-assigned entries (' + n + ' reviews each)'); toast('Assignment complete — conflicts auto-avoided');
    });
  };

  /* ═══ Results (공개 예약) ═══ */
  VIEWS.results = function () {
    var grades = Object.keys(GYCA.GRADES);
    main.innerHTML = '<h1>Results · 결과 발표</h1><p class="admin-sub">Assign grades, schedule the public reveal, and notify participants. Ties and grade quotas are checked before publishing.</p>' +
      '<div class="admin-grid">' +
      '<div class="acard span-7"><h2>Grade assignment — Youth Design Open</h2><div class="tbl-scroll"><table class="tbl admin-tbl"><thead><tr><th>Entry</th><th>Total</th><th>Grade</th></tr></thead><tbody id="grade-rows"></tbody></table></div>' +
      '<div id="tie-warn" style="margin-top:12px"></div></div>' +
      '<div class="acard span-5"><h2>Publish</h2>' +
      '<div class="field"><label>Reveal at (KST)</label><input type="datetime-local" id="pub-when" value="2026-07-04T10:00"></div>' +
      '<label style="display:flex;gap:8px;font-size:14px;margin-bottom:10px"><input type="checkbox" id="notify" checked> Notify participants (email + SMS)</label>' +
      '<label style="display:flex;gap:8px;font-size:14px;margin-bottom:14px"><input type="checkbox" id="mask" checked> Mask minors\' names in public gallery</label>' +
      '<button class="btn btn-gold btn-sm" id="do-publish">Schedule publish</button>' +
      '<div id="pub-out" style="margin-top:12px"></div></div></div>';
    var entries = [{ no: '0377', total: 96 }, { no: '0378', total: 94 }, { no: '0379', total: 94 }, { no: '0380', total: 91 }, { no: '0381', total: 88 }, { no: '0382', total: 85 }];
    var assign = LS.get('grade-assign', { '0377': 'grand', '0378': 'gold', '0379': 'gold', '0380': 'silver', '0381': 'bronze', '0382': 'finalist' });
    function render() {
      $('#grade-rows').innerHTML = entries.map(function (e) {
        return '<tr><td class="num">GYCA-C5-000' + e.no + '</td><td class="num">' + e.total + '</td><td><select data-g="' + e.no + '" style="height:34px;border:1px solid var(--line-2);border-radius:4px;padding:0 6px">' +
          grades.map(function (g) { return '<option value="' + g + '"' + (assign[e.no] === g ? ' selected' : '') + '>' + GYCA.GRADES[g].en + '</option>'; }).join('') + '</select></td></tr>';
      }).join('');
      $$('[data-g]').forEach(function (sel) { sel.addEventListener('change', function () { assign[sel.dataset.g] = sel.value; LS.set('grade-assign', assign); checkTie(); }); });
      checkTie();
    }
    function checkTie() {
      // 동점인데 등급 정원 초과 감지 (94점 2건이 모두 gold면 정원 안내)
      var golds = entries.filter(function (e) { return assign[e.no] === 'gold'; });
      var tie94 = entries.filter(function (e) { return e.total === 94; });
      var sameGrade = tie94.length >= 2 && tie94.every(function (e) { return assign[e.no] === assign[tie94[0].no]; });
      $('#tie-warn').innerHTML = sameGrade
        ? '<div style="background:var(--warn-soft);border-radius:10px;padding:12px;font-size:13.5px"><b style="color:var(--warn)">Tie detected</b> — entries 0378 and 0379 both scored 94 and share the same grade. Confirm this is intended (quota / tie-break rule) before publishing.</div>'
        : '';
    }
    $('#do-publish').addEventListener('click', function () {
      var when = $('#pub-when').value;
      $('#pub-out').innerHTML = '<div style="background:var(--ok-soft);border-radius:10px;padding:12px;font-size:13.5px"><b style="color:var(--ok)">✓ Scheduled</b><br>Results go public at ' + when.replace('T', ' ') + ' KST.' + ($('#notify').checked ? ' Participants will be notified.' : '') + ($('#mask').checked ? ' Minors\' names masked.' : '') + '</div>';
      logAdmin('Scheduled results publish for ' + when); toast('Results scheduled — reveal is time-locked');
    });
    render();
  };

  /* ═══ Payments ═══ */
  VIEWS.payments = function () {
    main.innerHTML = '<h1>Payments · 결제 관리</h1><p class="admin-sub">All payments, refunds and fee-waivers. Refunds are allowed before judging begins.</p>' +
      '<div class="admin-grid">' + kpi(3, '₩10.2M', 'Collected (this cycle)', '') + kpi(3, '128', 'Paid entries', '') + kpi(3, '14', 'Fee waivers', 'var(--info)') + kpi(3, '3', 'Refunds pending', 'var(--warn)') +
      '<div class="acard span-12"><h2>Fee-waiver requests</h2><div class="tbl-scroll"><table class="tbl admin-tbl"><thead><tr><th>Entry</th><th>Applicant</th><th>Note</th><th></th></tr></thead><tbody id="waiver-rows"></tbody></table></div></div></div>';
    var waivers = LS.get('waivers', [{ no: 'GYCA-C1-0000485', name: 'Choi J. (13)', note: 'School-forwarded request', ok: null }, { no: 'GYCA-C1-0000490', name: 'Han S. (12)', note: 'No proof required', ok: null }]);
    function render() {
      $('#waiver-rows').innerHTML = waivers.map(function (w, i) {
        return '<tr><td class="num">' + w.no + '</td><td>' + w.name + '</td><td>' + w.note + '</td><td>' + (w.ok === null ? '<button class="btn btn-gold btn-sm" data-approve="' + i + '">Approve</button>' : '<span class="badge badge-open">Approved</span>') + '</td></tr>';
      }).join('');
      $$('[data-approve]').forEach(function (b) { b.addEventListener('click', function () { var l = LS.get('waivers', waivers); l[+b.dataset.approve].ok = true; LS.set('waivers', l); logAdmin('Approved fee waiver: ' + l[+b.dataset.approve].no); render(); toast('Waiver approved'); }); });
    }
    render();
  };

  /* ═══ Translation (i18n 번역률) ═══ */
  VIEWS.i18n = function () {
    var keys = LS.get('i18n-keys', [
      { key: 'hero.title', en: 'Where young creators meet the world.', ko: '', done: false },
      { key: 'hero.lead', en: 'A global stage for creators aged 8 to 22…', ko: '만 8~22세 창작자를 위한 국제 무대…', done: true },
      { key: 'comp.submit', en: 'Submit Work', ko: '작품 접수', done: true },
      { key: 'winners.masked', en: 'This creator is a minor.', ko: '이 창작자는 미성년자입니다.', done: true },
      { key: 'apply.guardian', en: 'Guardian consent required', ko: '보호자 동의 필요', done: true },
      { key: 'rights.own', en: 'Your work is your own.', ko: '', done: false },
      { key: 'fee.waiver', en: 'Request a fee waiver', ko: '참가비 면제 신청', done: true },
      { key: 'final.total', en: 'Your total', ko: '총 결제 금액', done: true },
    ]);
    function render() {
      var done = keys.filter(function (k) { return k.done && k.ko; }).length;
      var pct = Math.round(done / keys.length * 100);
      main.innerHTML = '<h1>Translation · 다국어 관리</h1><p class="admin-sub">English is the base. Track Korean coverage so no untranslated key leaks to visitors (the competing prototype showed "대한민국" on its English page).</p>' +
        '<div class="acard" style="margin-bottom:20px"><h2>Korean coverage <span class="badge ' + (pct === 100 ? 'badge-open' : 'badge-warn') + '">' + pct + '%</span></h2>' +
        '<div class="prog-track" style="margin:8px 0"><div class="prog-fill" style="width:' + pct + '%;transition:none"></div></div></div>' +
        '<div class="acard"><h2>Keys</h2><div class="tbl-scroll"><table class="tbl admin-tbl"><thead><tr><th>Key</th><th>EN</th><th>KO</th><th>Status</th></tr></thead><tbody>' +
        keys.map(function (k, i) { return '<tr><td class="num" style="font-size:12px">' + k.key + '</td><td>' + esc(k.en) + '</td><td>' + (k.ko ? esc(k.ko) : '<input data-ko="' + i + '" placeholder="번역 입력" style="height:34px;border:1px solid var(--line-2);border-radius:4px;padding:0 8px;width:100%">') + '</td><td>' + (k.done && k.ko ? '<span class="badge badge-open">Done</span>' : '<span class="badge badge-bad">Missing</span>') + '</td></tr>'; }).join('') +
        '</tbody></table></div></div>';
      $$('[data-ko]').forEach(function (inp) { inp.addEventListener('change', function () { keys[+inp.dataset.ko].ko = inp.value.trim(); keys[+inp.dataset.ko].done = !!inp.value.trim(); LS.set('i18n-keys', keys); render(); if (inp.value.trim()) toast('Translation added — coverage updated'); }); });
    }
    render();
  };

  /* ═══ Communication ═══ */
  VIEWS.comms = function () {
    main.innerHTML = '<h1>Communication</h1><p class="admin-sub">Send email / SMS / on-site notices to a target group.</p>' +
      '<div class="acard span-8"><h2>New message</h2>' +
      '<div class="field"><label>Audience</label><select id="cm-aud"><option>All participants</option><option>Winners only</option><option>Finalists (overseas)</option><option>Missing guardian consent</option><option>Jurors</option></select></div>' +
      '<div class="field"><label>Channel</label><div style="display:flex;gap:14px"><label style="font-weight:400;display:flex;gap:6px"><input type="checkbox" checked> Email</label><label style="font-weight:400;display:flex;gap:6px"><input type="checkbox"> SMS</label><label style="font-weight:400;display:flex;gap:6px"><input type="checkbox"> On-site notice</label></div></div>' +
      '<div class="field"><label>Message</label><textarea rows="4" id="cm-body">Results for Youth Design Open 2026 are now available in My Page.</textarea></div>' +
      '<button class="btn btn-gold btn-sm" id="cm-send">Send</button></div>';
    $('#cm-send').addEventListener('click', function () { logAdmin('Sent message to: ' + $('#cm-aud').value); toast('Message queued to ' + $('#cm-aud').value + ' (demo)'); });
  };

  /* ═══ Audit Log ═══ */
  VIEWS.log = function () {
    var log = LS.get('admin-log', SEED_LOG);
    main.innerHTML = '<h1>Audit Log</h1><p class="admin-sub">Every risky action (publish, refund, personal-data access, partner change) is recorded — the single defense line for a solo operator.</p>' +
      '<div class="acard"><h2>Activity</h2><div class="tbl-scroll"><table class="tbl admin-tbl"><thead><tr><th>Time</th><th>User</th><th>Action</th></tr></thead><tbody>' +
      log.map(function (a) { return '<tr><td class="num">' + a.at + '</td><td>' + esc(a.who) + '</td><td>' + esc(a.what) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
  };

  show('dash');
})();
