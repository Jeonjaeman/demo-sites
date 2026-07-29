/* ==========================================================================
   AUTOCAST — 착수 전 검토 (한계점·대안)
   ========================================================================== */
(function () {
  'use strict';
  var AC = window.AC, F = AC.fmt;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  function toast(msg, kind) {
    var box = $('#toasts');
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.innerHTML = msg;
    box.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2400);
    setTimeout(function () { el.remove(); }, 2900);
  }

  function reveal() {
    var vh = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 800);
    var io = null;
    try {
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: .05 });
    } catch (e) { io = null; }
    [].forEach.call(document.querySelectorAll('.rv:not(.in)'), function (el, i) {
      el.style.transitionDelay = Math.min(i, 5) * 45 + 'ms';
      var r = el.getBoundingClientRect();
      if (r.top < vh * 1.05 && r.bottom > -60) el.classList.add('in');
      else if (io) io.observe(el);
    });
  }

  /* ① 기술 경계선 */
  var COST_BD = { low: ['노코드', 'ok'], mid: ['일부 개발', 'warn'], high: ['개발 집중', 'bad'] };
  function renderBoundary() {
    $('#tblBoundary tbody').innerHTML = AC.BOUNDARY.map(function (b) {
      var c = COST_BD[b.cost];
      return '<tr><td class="l"><b>' + b.req + '</b></td>' +
        '<td>' + b.how + '</td>' +
        '<td><span class="bd ' + c[1] + '">' + c[0] + '</span></td>' +
        '<td class="l small muted">' + b.note + '</td></tr>';
    }).join('');
  }

  /* ② HeyGen */
  function renderHeygen() {
    $('#tblTier tbody').innerHTML = AC.HEYGEN.tiers.map(function (t) {
      var per45 = 45 * t.usdPerSec;
      var month = per45 * 22;
      return '<tr><td class="l">' + t.name + '</td>' +
        '<td class="num">$' + t.usdPerSec + '</td>' +
        '<td class="num">$' + per45.toFixed(2) + '</td>' +
        '<td class="num">$' + Math.round(month) + ' · ' + F.krw(month * AC.USD_KRW) + '</td></tr>';
    }).join('');
    $('#tblPlan tbody').innerHTML = AC.HEYGEN.webPlans.map(function (p) {
      return '<tr><td class="l">' + p.name + '</td><td class="num">$' + p.usdMonth + '</td>' +
        '<td class="l small">' + p.credits + '</td></tr>';
    }).join('');
    $('#creditRule').innerHTML = '<b>크레딧 규칙</b> — ' + AC.HEYGEN.creditRule +
      '. 무료 크레딧은 ' + AC.HEYGEN.freeCreditsEndedAt + '에 폐지, pay-as-you-go 최소 $' +
      AC.HEYGEN.payAsYouGoMin + ', 크레딧 ' + AC.HEYGEN.creditExpireMonths + '개월 만료.';
  }

  /* ③ 컴플라이언스 — 전체 콘텐츠 실제 검사 */
  function renderCompliance() {
    var checked = AC.TICKETS.map(function (t) {
      return { t: t, chk: AC.checkCompliance(t) };
    });
    var fail = checked.filter(function (x) { return !x.chk.pass; });
    var banned = checked.filter(function (x) { return x.chk.banned.length; });
    var totalFine = fail.reduce(function (a, x) { return a + x.chk.fineRisk; }, 0);

    $('#compCards').innerHTML =
      '<div class="kpi"><div class="k">검사한 콘텐츠</div><div class="v num">' + AC.TICKETS.length + '</div><div class="d">최근 4주</div></div>' +
      '<div class="kpi" style="border-color:rgba(255,90,106,.3)"><div class="k">위반 감지</div><div class="v num" style="color:var(--bad)">' + fail.length + '</div><div class="d">과장 ' + banned.length + '건 포함</div></div>' +
      '<div class="kpi" style="border-color:rgba(245,179,42,.3)"><div class="k">누적 과태료 위험</div><div class="v num" style="color:var(--warn)">' + F.krw(totalFine * 1e4) + '</div><div class="d">발행됐다면</div></div>';

    // 위반 있는 것 위주로
    var rows = checked.filter(function (x) { return !x.chk.pass; }).slice(0, 12);
    $('#tblComp tbody').innerHTML = rows.map(function (x) {
      var parts = [];
      if (x.chk.banned.length) parts.push('과장 "' + x.chk.banned.join('","') + '"');
      if (x.chk.missing.length) parts.push('명시사항 ' + x.chk.missing.length + '종 누락');
      return '<tr><td class="l"><b>' + x.t.day + ' · ' + x.t.theme + '</b><div class="tiny faint">' + x.t.complex + '</div></td>' +
        '<td class="l small" style="color:var(--bad)">' + parts.join(' · ') + '</td>' +
        '<td class="num">' + F.krw(x.chk.fineRisk * 1e4) + '</td>' +
        '<td><span class="bd bad">발행 차단</span></td></tr>';
    }).join('') || '<tr><td colspan="4" class="l" style="text-align:center;padding:20px;color:var(--ok)">위반 없음</td></tr>';
  }

  /* ⑤ 2차 견적 */
  function renderPhase2() {
    var total = AC.PHASE2.reduce(function (a, p) { return a + p.days; }, 0);
    $('#tblPhase2 tbody').innerHTML = AC.PHASE2.map(function (p) {
      return '<tr><td class="l"><b>' + p.item + '</b></td>' +
        '<td class="num">' + p.days + '일</td>' +
        '<td class="num">' + F.krwFull(p.days * 50000) + '</td>' +
        '<td class="l small muted">' + p.note + '</td></tr>';
    }).join('');
    $('#tblPhase2 tfoot').innerHTML = '<tr><td class="l">합계</td><td class="num">' + total + '일</td>' +
      '<td class="num">' + F.krwFull(total * 50000) + '</td><td class="l small faint">VAT 별도</td></tr>';
  }

  /* ⑥ 검토 항목 */
  var LV = { high: ['그대로 만들면 터짐', 'bad'], mid: ['운영 중 문제', 'warn'], low: ['확인 필요', 'mute'] };
  var lv = 'all';
  function renderRisk() {
    var rows = AC.RISKS.filter(function (r) { return lv === 'all' || r.level === lv; });
    $('#riskBody').innerHTML = rows.map(function (r) {
      var l = LV[r.level];
      return '<div class="card pad" style="margin-bottom:10px;border-color:' +
        (r.level === 'high' ? 'rgba(255,90,106,.3)' : r.level === 'mid' ? 'rgba(245,179,42,.28)' : 'var(--line)') + '">' +
        '<div class="between" style="align-items:flex-start"><b style="font-size:14.5px">' + r.id + '. ' + r.title + '</b>' +
        '<span class="bd ' + l[1] + '" style="flex:none">' + l[0] + '</span></div>' +
        '<p class="small muted" style="margin-top:7px">' + r.body + '</p>' +
        '<p class="small" style="margin-top:7px;color:var(--accent)"><b>대응</b> — ' + r.fix + '</p>' +
        '<p class="tiny faint" style="margin-top:5px">확인 위치: ' + r.where + '</p></div>';
    }).join('') || '<p class="muted small">해당 등급 항목이 없습니다.</p>';
    reveal();
  }
  $('#riskFilter').addEventListener('click', function (e) {
    var b = e.target.closest('.chip[data-lv]'); if (!b) return;
    [].forEach.call(this.querySelectorAll('.chip'), function (c) { c.setAttribute('aria-pressed', String(c === b)); });
    lv = b.dataset.lv; renderRisk();
  });

  renderBoundary();
  renderHeygen();
  renderCompliance();
  renderPhase2();
  renderRisk();
  reveal();
  window.addEventListener('scroll', reveal, { passive: true });

  window.__AC_ADMIN_TEST = { renderCompliance: renderCompliance, renderRisk: renderRisk };
})();
