/* ============================================================
   CAREON — 운영 대시보드 로직
   배정 현황 · 회비/정산 · 준법 검토 · 역할별 마스킹(민감정보)
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var won = function (n) { return n.toLocaleString('ko-KR'); };
  var cg = function (id) { return CAREGIVERS.find(function (x) { return x.id === id; }); };
  var cl = function (id) { return CLIENTS.find(function (x) { return x.id === id; }); };

  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.innerHTML = msg;
    $('#toasts').appendChild(el);
    setTimeout(function () { el.style.transition = '.35s'; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(function () { el.remove(); }, 360); }, 3400);
  }

  var S = { role: 'admin', me: 'c1', tab: 'assign', af: 'all', df: 'all' };
  var canSee = function (a) { return S.role === 'admin' || a.cg === S.me; };

  /* ---------------- KPI ---------------- */
  function renderKPI() {
    var active = CAREGIVERS.length;
    var live = ASSIGNMENTS.filter(function (a) { return a.status !== 'ended'; });
    var assigned = ASSIGNMENTS.filter(function (a) { return a.status === 'assigned'; }).length;
    var open = ASSIGNMENTS.filter(function (a) { return a.status === 'open'; }).length;
    var rate = live.length ? Math.round(assigned / live.length * 100) : 0;
    var paid = DUES.filter(function (d) { return d.status === 'paid'; }).length;
    var duesRate = Math.round(paid / DUES.length * 100);
    var unpaid = DUES.length - paid;
    $('#kpis').innerHTML =
      kpi(active, '명', 'teal', '활동 간병사') +
      kpi(rate, '%', 'teal', '배정률 (배정/진행)') +
      kpi(duesRate, '%', duesRate >= 80 ? 'teal' : 'warm', '이번달 회비 수납률') +
      kpi(unpaid, '명', unpaid ? 'red' : 'teal', '회비 미납 인원');
  }
  function kpi(v, u, c, l) {
    return '<div class="kpi"><div class="v ' + c + '" data-count="' + v + '" data-u="' + u + '">0<span class="u">' + u + '</span></div><div class="l">' + l + '</div></div>';
  }

  /* ---------------- 배정 현황 ---------------- */
  function renderAssign() {
    var rows = ASSIGNMENTS.filter(function (a) { return S.af === 'all' || a.status === S.af; });
    var body = rows.map(function (a) {
      var c = a.cg ? cg(a.cg) : null;
      var p = cl(a.cl);
      var see = canSee(a);
      var whoCg = c
        ? '<div class="who"><span class="av" style="background:' + c.color + '">' + c.av + '</span><div><div>' + c.name + (c.cert ? ' <span class="badge paid" style="height:18px;font-size:10px">요양보호사</span>' : '') + '</div><div class="sub">' + c.region + '</div></div></div>'
        : '<span class="mask-val">미배정(공석)</span>';
      var cond = see
        ? '<span class="sens" title="민감정보 — 접근 최소범위">' + p.condition + '</span>'
        : '<span class="mask-val">열람권한 없음</span>';
      var place = see ? p.place : p.place.replace(/\(.*\)|\d+층/g, '···');
      var st = { assigned: ['assigned', '배정중'], open: ['open', '공석'], ended: ['ended', '종료'] }[a.status];
      return '<tr>' +
        '<td>' + whoCg + '</td>' +
        '<td><div>' + p.name + '</div><div class="sub" style="font-size:11px;color:var(--muted)">' + place + '</div></td>' +
        '<td>' + cond + '</td>' +
        '<td>' + a.shift + '</td>' +
        '<td class="num">' + won(a.feeDay) + '<span style="color:var(--muted)">/일</span></td>' +
        '<td><span class="badge ' + st[0] + '">' + st[1] + '</span></td>' +
        '</tr>';
    }).join('');
    $('#assignBody').innerHTML = body || emptyRow(6);
    $('#assignCount').textContent = rows.length + '건';
  }

  /* ---------------- 회비 / 정산 ---------------- */
  function renderDues() {
    var list = DUES.slice();
    if (S.role === 'cg') list = list.filter(function (d) { return d.cg === S.me; });
    list = list.filter(function (d) { return S.df === 'all' || (S.df === 'paid' ? d.status === 'paid' : d.status !== 'paid'); });
    var totalAmt = DUES.reduce(function (s, d) { return s + d.amount; }, 0);
    var paidAmt = DUES.filter(function (d) { return d.status === 'paid'; }).reduce(function (s, d) { return s + d.amount; }, 0);
    var body = list.map(function (d) {
      var c = cg(d.cg);
      var st = { paid: ['paid', '완납'], due: ['due', '납부예정'], unpaid: ['unpaid', '미납'] }[d.status];
      return '<tr>' +
        '<td><div class="who"><span class="av" style="background:' + c.color + '">' + c.av + '</span><div><div>' + c.name + '</div><div class="sub">가입 ' + c.join + '</div></div></div></td>' +
        '<td class="num">' + won(d.amount) + '원</td>' +
        '<td><span class="badge ' + st[0] + '">' + st[1] + '</span></td>' +
        '<td>' + (d.date || '<span class="mask-val">—</span>') + '</td>' +
        '</tr>';
    }).join('');
    $('#duesBody').innerHTML = body || emptyRow(4);
    $('#duesSummary').innerHTML = S.role === 'cg'
      ? '내 회비만 표시됩니다 · 타 간병사 회비는 <b>비공개</b>'
      : '수납 <b>' + won(paidAmt) + '원</b> / 총 ' + won(totalAmt) + '원 · 미납 <b style="color:var(--red)">' + won(totalAmt - paidAmt) + '원</b>';
  }

  function emptyRow(n) { return '<tr><td colspan="' + n + '" style="text-align:center;padding:34px;color:var(--muted)">해당 조건의 항목이 없습니다.</td></tr>'; }

  /* ---------------- 준법 검토 ---------------- */
  function renderLegal() {
    $('#legalList').innerHTML = LEGAL.map(function (r) {
      return '<div class="lchk ' + (r.on ? 'on' : '') + '" data-id="' + r.id + '">' +
        '<span class="box">✓</span><div><b>' + r.t + (r.req ? '<span class="tag req">필수</span>' : '') + '</b><span>' + r.d + '</span></div></div>';
    }).join('');
    $$('#legalList .lchk').forEach(function (el) {
      el.onclick = function () { var r = LEGAL.find(function (x) { return x.id === el.dataset.id; }); r.on = !r.on; renderLegal(); scoreLegal(); };
    });
  }
  function scoreLegal() {
    var pct = LEGAL.reduce(function (s, r) { return s + (r.on ? r.w : 0); }, 0);
    var miss = LEGAL.filter(function (r) { return r.req && !r.on; });
    var g = $('#legalGauge');
    g.style.setProperty('--v', pct);
    g.style.setProperty('--gc', pct >= 90 && !miss.length ? 'var(--teal)' : pct >= 55 ? 'var(--warm)' : 'var(--red)');
    $('#legalPct').innerHTML = pct + '<small>%</small>';
    var v = $('#legalVerdict');
    if (miss.length) {
      v.className = 'verdict fail';
      v.innerHTML = '<b>운영 불가 위험.</b> 필수 누락 — ' + miss.map(function (r) { return r.t; }).join(', ') + '. 이 항목이 비면 처벌·분쟁 소지가 그대로 남습니다.';
    } else if (pct >= 90) {
      v.className = 'verdict pass';
      v.innerHTML = '<b>준법 기반 확보.</b> 등록·소개 경계·민감정보·근로자성까지 갖춘 합법 운영 구조입니다.';
    } else {
      v.className = 'verdict risk';
      v.innerHTML = '<b>보완 필요.</b> 핵심 리스크는 덮었지만 근로자성·보험·보안까지 채워야 안정적입니다.';
    }
  }

  /* ---------------- 역할 / 탭 ---------------- */
  function setRole(r) {
    S.role = r;
    $$('#roleSeg button').forEach(function (b) { b.classList.toggle('on', b.dataset.role === r); });
    $('#roleNote').innerHTML = r === 'admin'
      ? '👤 <b>사무실 관리자</b> — 전체 배정·회비·민감정보 열람. 모든 정산 근거 확인.'
      : '📱 <b>외부 간병사(김순임)</b> — 담당 외 환자의 질환·장소·보호자 연락처는 <b>마스킹</b>되고, 타 간병사 회비는 비공개됩니다.';
    renderAssign(); renderDues();
    toast(r === 'admin' ? '사무실 관리자 화면 — 전체 열람' : '외부 간병사 화면 — 민감정보 마스킹 적용', r === 'admin' ? '' : 'warn');
  }
  function setTab(t) {
    S.tab = t;
    $$('.dtab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === t); });
    $$('.dpanel').forEach(function (p) { p.classList.toggle('on', p.dataset.panel === t); });
  }

  /* ---------------- 리빌 · 카운트업 · 틸트 ---------------- */
  var reduceM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var parallax = $$('[data-parallax]'), counted = {};
  function runReveal() {
    var vh = innerHeight || document.documentElement.clientHeight;
    $$('.g-reveal:not(.is-visible), .mask:not(.is-visible)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('is-visible');
    });
    parallax.forEach(function (el) {
      var w = el.closest('.statement-bg') || el.parentElement, r = w.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = 'translateY(' + (-p * 50).toFixed(1) + 'px) scale(1.14)';
    });
    // 카운트업(가시 진입 시)
    $$('[data-count]').forEach(function (el) {
      if (counted[uid(el)]) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) { counted[uid(el)] = 1; countOne(el); }
    });
    // 프리뷰 바 성장
    $$('.pv-bar .fill[data-w]').forEach(function (el) {
      if (el.dataset.done) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh) { el.dataset.done = 1; setTimeout(function () { el.style.width = el.dataset.w + '%'; }, 80); }
    });
  }
  var _id = 0; function uid(el) { if (!el._u) el._u = ++_id; return el._u; }
  function countOne(el) {
    var end = +el.dataset.count, u = el.dataset.u || '', t0 = null, dur = 1000;
    function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur); var e = 1 - Math.pow(1 - p, 3); el.innerHTML = Math.round(end * e) + (u ? '<span class="u">' + u + '</span>' : ''); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  addEventListener('scroll', runReveal, { passive: true });
  addEventListener('resize', runReveal);
  addEventListener('load', runReveal);

  if (!reduceM && matchMedia('(hover:hover)').matches) {
    $$('.pillar').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.classList.add('tilting');
        el.style.setProperty('--ry', ((px - .5) * 9) + 'deg');
        el.style.setProperty('--rx', ((.5 - py) * 9) + 'deg');
        el.style.setProperty('--mx', (px * 100) + '%'); el.style.setProperty('--my', (py * 100) + '%');
      });
      el.addEventListener('pointerleave', function () { el.classList.remove('tilting'); el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
    });
  }

  /* ---------------- init ---------------- */
  $$('#roleSeg button').forEach(function (b) { b.onclick = function () { setRole(b.dataset.role); }; });
  $$('.dtab').forEach(function (b) { b.onclick = function () { setTab(b.dataset.tab); }; });
  $$('#assignFilters .chip').forEach(function (b) { b.onclick = function () { S.af = b.dataset.f; $$('#assignFilters .chip').forEach(function (x) { x.classList.toggle('on', x === b); }); renderAssign(); }; });
  $$('#duesFilters .chip').forEach(function (b) { b.onclick = function () { S.df = b.dataset.f; $$('#duesFilters .chip').forEach(function (x) { x.classList.toggle('on', x === b); }); renderDues(); }; });

  // 리스크 카드
  $('#riskGrid').innerHTML = RISKS.map(function (r) {
    var lvl = r.lv === 'high' ? '치명' : r.lv === 'mid' ? '주의' : '양호';
    return '<article class="risk g-reveal" data-lv="' + r.lv + '"><span class="lv">● ' + lvl + '</span><h3>' + r.t + '</h3><div class="d">' + r.d + '</div><div class="fix"><b>대응 →</b> ' + r.fix + '</div><div class="src">근거 · ' + r.src + '</div></article>';
  }).join('');

  renderKPI(); renderAssign(); renderDues(); renderLegal(); scoreLegal();
  setRole('admin'); setTab('assign');
  runReveal();
})();
