/* ==========================================================================
   AUTOCAST — 파이프라인 대시보드
   · 파이프라인은 실제 상태를 가지고, 에디터 승인 없이는 영상 단계로 못 넘어감
   · HeyGen 비용은 실측 단가로 실시간 계산
   · 발행 전 표시광고 컴플라이언스를 텍스트에 실제로 적용
   ========================================================================== */
(function () {
  'use strict';
  var AC = window.AC, F = AC.fmt;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  var S = {
    week: 4,                    // 보고 있는 주
    tickets: AC.TICKETS.map(function (t) { return Object.assign({}, t); }),
    sel: null
  };

  /* --------------------------- 토스트 --------------------------- */
  function toast(msg, kind) {
    var box = $('#toasts');
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.innerHTML = msg;
    box.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2600);
    setTimeout(function () { el.remove(); }, 3100);
  }

  /* --------------------------- 리빌 --------------------------- */
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

  function countUp(el, to, format) {
    var from = parseFloat(el.dataset.v || '0');
    el.dataset.v = to;
    el.innerHTML = format(to);            // 최종값 먼저 확정(백그라운드 탭 대비)
    if (Math.abs(to - from) < 1e-9) return;
    var t0 = performance.now(), dur = 560;
    function step(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.innerHTML = format(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step); else el.innerHTML = format(to);
    }
    requestAnimationFrame(step);
  }

  /* --------------------------- KPI --------------------------- */
  function renderKpi() {
    var wk = S.tickets.filter(function (t) { return t.week === S.week; });
    var review = S.tickets.filter(function (t) { return t.stage === 'review'; }).length;
    var pub = S.tickets.filter(function (t) { return t.stage === 'publish'; }).length;
    countUp($('[data-kpi="week"]'), wk.length, function (v) { return F.int(v); });
    countUp($('[data-kpi="review"]'), review, function (v) { return F.int(v); });
    countUp($('[data-kpi="published"]'), pub, function (v) { return F.int(v); });
    var c = currentCost();
    countUp($('[data-kpi="cost"]'), c.krwMonth, function (v) { return F.krw(v); });
    $('#hdWeek').textContent = S.week + '주차';
  }

  /* --------------------------- 주 탭 --------------------------- */
  function renderWeekTabs() {
    $('#weekTabs').innerHTML = [1, 2, 3, 4].map(function (w) {
      return '<button class="chip" data-w="' + w + '" aria-pressed="' + (w === S.week) + '">' + w + '주차</button>';
    }).join('');
  }
  $('#weekTabs').addEventListener('click', function (e) {
    var b = e.target.closest('.chip[data-w]'); if (!b) return;
    S.week = +b.dataset.w; renderWeekTabs(); renderBoard(); renderKpi();
  });

  /* --------------------------- 파이프라인 보드 --------------------------- */
  function renderBoard() {
    var wk = S.tickets.filter(function (t) { return t.week === S.week; });
    $('#board').innerHTML = AC.STAGES.map(function (st) {
      var items = wk.filter(function (t) { return t.stage === st.id; });
      return '<div class="stage-col">' +
        '<div class="stage-h"><span class="dot" style="background:' + st.color + '"></span>' +
        '<span class="nm">' + st.name + '</span><span class="ct">' + items.length + '</span></div>' +
        '<div class="stage-body">' +
        items.map(function (t) {
          return '<div class="ticket' + (S.sel && S.sel.id === t.id ? ' on' : '') + '" data-id="' + t.id + '">' +
            '<div class="day">' + t.day + ' · ' + t.kind + '</div>' +
            '<div class="tt">' + t.theme + '</div>' +
            '<div class="small faint" style="margin-top:3px">' + t.complex + '</div>' +
            (t.hasExaggeration && t.stage !== 'publish' ? '<span class="bd bad" style="margin-top:5px;height:18px;font-size:10px">과장표현 감지</span>' : '') +
            '</div>';
        }).join('') +
        (items.length ? '' : '<div class="tiny faint" style="padding:10px;text-align:center">—</div>') +
        '</div></div>';
    }).join('');
  }

  $('#board').addEventListener('click', function (e) {
    var c = e.target.closest('.ticket'); if (!c) return;
    var t = S.tickets.find(function (x) { return x.id === c.dataset.id; });
    if (t) openEditor(t);
  });

  /* --------------------------- 에디터 모달 --------------------------- */
  function openEditor(t) {
    S.sel = t; renderBoard();
    var chk = AC.checkCompliance(t);
    var st = AC.STAGE_BY[t.stage];
    $('#modal').innerHTML =
      '<button class="x" data-close>×</button>' +
      '<div class="center" style="gap:7px"><span class="bd" style="background:' + st.color + '22;color:' + st.color + '">' + st.name + '</span>' +
      '<span class="bd mute">' + t.day + ' · ' + t.kind + '</span>' +
      (t.approved ? '<span class="bd ok">승인됨</span>' : '<span class="bd warn">미승인</span>') + '</div>' +
      '<h3 style="font-size:19px;margin-top:10px">' + t.theme + '</h3>' +
      '<div class="small faint" style="margin-top:2px">' + t.complex + ' · ' + t.dong + ' · 전용 ' + t.area + '㎡</div>' +

      '<label class="fld" style="margin-top:16px">AI 초안 (수정 가능)</label>' +
      '<textarea id="edText" rows="4">' + t.draft + '</textarea>' +

      '<div id="edChk" style="margin-top:14px"></div>' +

      '<div class="between" style="margin-top:16px;flex-wrap:wrap;gap:10px">' +
        '<div class="small faint">수정 <b class="num">' + t.editCount + '</b>회' +
        (t.isVideo ? ' · 영상 ' + t.videoSec + '초' : '') + '</div>' +
        '<div class="wrap-g">' +
          '<button class="btn sm" id="edRecheck">다시 검사</button>' +
          (t.stage === 'review'
            ? '<button class="btn sm ok" id="edApprove">승인 → 영상 단계로</button>'
            : t.stage === 'video'
              ? '<button class="btn sm pri" id="edPublish">발행</button>'
              : t.stage === 'draft'
                ? '<button class="btn sm" id="edToReview">검수 단계로 보내기</button>'
                : '') +
        '</div>' +
      '</div>';
    renderEdChk(chk, t);
    $('#mask').classList.add('on');

    $('#edText').addEventListener('input', function () { t.draft = this.value; });
    $('#edRecheck').addEventListener('click', function () {
      renderEdChk(AC.checkCompliance(t), t);
      toast('컴플라이언스를 다시 검사했습니다');
    });
    var appr = $('#edApprove');
    if (appr) appr.addEventListener('click', function () {
      var c = AC.checkCompliance(t);
      if (!c.pass) { renderEdChk(c, t); toast('컴플라이언스를 통과해야 승인됩니다', 'bad'); return; }
      t.approved = true; t.stage = 'video'; t.editCount++;
      $('#mask').classList.remove('on'); renderBoard(); renderKpi();
      toast('승인 완료 — HeyGen 영상 단계로 넘어갑니다 (검수 게이트 통과)', 'ok');
    });
    var pub = $('#edPublish');
    if (pub) pub.addEventListener('click', function () {
      var c = AC.checkCompliance(t);
      if (!c.pass) { renderEdChk(c, t); toast('발행 전 컴플라이언스 통과 필요', 'bad'); return; }
      t.stage = 'publish';
      $('#mask').classList.remove('on'); renderBoard(); renderKpi();
      toast('발행 완료 — 스토리지 저장 + 텔레그램 알림', 'ok');
    });
    var tor = $('#edToReview');
    if (tor) tor.addEventListener('click', function () {
      t.stage = 'review';
      $('#mask').classList.remove('on'); renderBoard(); renderKpi();
      toast('검수 단계로 보냈습니다 — 관리자 승인 대기');
    });
  }

  function renderEdChk(chk, t) {
    var host = $('#edChk'); if (!host) return;
    if (chk.pass) {
      host.innerHTML = '<div class="okbox"><b>✓ 발행 가능</b> — 표시·광고 명시사항이 모두 채워졌고 금지 표현이 없습니다.</div>';
      return;
    }
    var parts = [];
    if (chk.banned.length) {
      parts.push('<b>과장·단정 표현 ' + chk.banned.length + '건</b> — ' +
        chk.banned.map(function (w) { return '<span class="mono" style="color:var(--bad)">"' + w + '"</span>'; }).join(', ') +
        ' <span class="faint">(부당광고 최대 500만원)</span>');
    }
    if (chk.missing.length) {
      parts.push('<b>명시사항 누락 ' + chk.missing.length + '건</b> — ' +
        chk.missing.map(function (m) { return m.label; }).join(' · ') +
        ' <span class="faint">(누락 최대 100만원)</span>');
    }
    host.innerHTML = '<div class="badbox"><b>⚠ 이대로 발행하면 공인중개사법 위반 소지</b><br>' +
      parts.map(function (p) { return '· ' + p; }).join('<br>') +
      '<div style="margin-top:8px" class="small">과장 표현을 지우고 명시사항을 채우면 통과합니다. ' +
      '<button class="btn sm" id="edFix" style="margin-left:6px">자동 교정 시연</button></div></div>';
    var fix = $('#edFix');
    if (fix) fix.addEventListener('click', function () {
      // 금지어 제거 + 명시사항 채움
      var txt = t.draft;
      AC.AD_BANNED.forEach(function (w) { txt = txt.split(w).join('').replace(/\s+\./g, '.').replace(/\.\s*\./g, '.'); });
      txt = txt.replace(/\.\s*$/, '') + '. [한빛공인중개사무소 · 서울 강남구 · 02-000-0000 · 등록 11680-2026-00000 · 김중개]';
      t.draft = txt; t.hasRegNo = true; t.hasExaggeration = false;
      var ta = $('#edText'); if (ta) ta.value = txt;
      renderEdChk(AC.checkCompliance(t), t);
      toast('금지 표현 제거 + 명시사항 삽입 — 실제로는 사람이 확인 후 확정', 'ok');
    });
  }

  /* --------------------------- HeyGen 비용 계산기 --------------------------- */
  function fillTiers() {
    $('#tier').innerHTML = AC.HEYGEN.tiers.map(function (t, i) {
      return '<option value="' + t.id + '"' + (i === 2 ? ' selected' : '') + '>' + t.name +
        ' — $' + t.usdPerSec + '/초</option>';
    }).join('');
  }
  function currentCost() {
    return AC.heygenCost({
      videosPerWeek: +$('#vpw').value,
      avgSec: +$('#sec').value,
      retryRate: (+$('#retry').value) / 100,
      tierId: $('#tier').value
    });
  }
  function renderCost() {
    $('#vpwVal').textContent = $('#vpw').value;
    $('#secVal').textContent = $('#sec').value;
    $('#retryVal').textContent = $('#retry').value;
    var c = currentCost();
    // 최저가 등급과 비교
    var cheapest = AC.heygenCost({
      videosPerWeek: +$('#vpw').value, avgSec: +$('#sec').value,
      retryRate: (+$('#retry').value) / 100, tierId: 'twin3'
    });
    $('#costOut').innerHTML =
      '<div class="grid2" style="gap:10px">' +
        '<div class="kpi"><div class="k">영상당 비용</div><div class="v num">' + F.usd(c.usdPerVideo) + '</div>' +
          '<div class="d">' + F.krwFull(c.usdPerVideo * AC.USD_KRW) + '</div></div>' +
        '<div class="kpi"><div class="k">월 영상 개수</div><div class="v num">' + c.videosPerMonth + '<small>개</small></div>' +
          '<div class="d">재렌더 ' + $('#retry').value + '% 반영</div></div>' +
        '<div class="kpi" style="border-color:rgba(249,110,73,.35)"><div class="k">월 예상</div>' +
          '<div class="v num" style="color:var(--accent)">' + F.krw(c.krwMonth) + '</div>' +
          '<div class="d">' + F.usd(c.usdMonth) + '/월</div></div>' +
        '<div class="kpi"><div class="k">연 환산</div><div class="v num">' + F.krw(c.krwYear) + '</div>' +
          '<div class="d">' + F.usd(c.usdMonth * 12) + '/년</div></div>' +
      '</div>';
    var save = c.krwMonth - cheapest.krwMonth;
    $('#costNote').innerHTML =
      '<b>이 설정이면 HeyGen에만 월 ' + F.krw(c.krwMonth) + '</b>이 나갑니다. ' +
      (c.tier.id !== 'twin3'
        ? '아바타 등급을 <b>Avatar III(저가)</b>로 낮추면 월 ' + F.krw(cheapest.krwMonth) +
          '로 <b>' + F.krw(save) + ' 절감</b>됩니다 — 화질과 비용의 트레이드오프를 발주사가 정해야 합니다. '
        : '가장 저렴한 등급입니다. ') +
      '무료 크레딧은 2026-02에 폐지됐고 pay-as-you-go 최소 $' + AC.HEYGEN.payAsYouGoMin +
      ', 크레딧은 ' + AC.HEYGEN.creditExpireMonths + '개월 후 만료됩니다. ' +
      '<b>재렌더율이 비용을 좌우</b>하므로, 검수 게이트로 재렌더를 줄이는 것이 곧 비용 절감입니다.';
    // KPI 동기화
    var el = $('[data-kpi="cost"]');
    if (el) { el.dataset.v = c.krwMonth; el.innerHTML = F.krw(c.krwMonth); }
  }
  ['vpw', 'sec', 'retry'].forEach(function (id) {
    $('#' + id).addEventListener('input', renderCost);
  });
  $('#tier').addEventListener('change', renderCost);

  /* --------------------------- 모달 닫기 --------------------------- */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]') || e.target.id === 'mask') {
      $('#mask').classList.remove('on'); S.sel = null; renderBoard();
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('#mask').classList.remove('on'); });

  /* --------------------------- 초기화 --------------------------- */
  fillTiers();
  renderWeekTabs();
  renderBoard();
  renderCost();
  renderKpi();
  reveal();
  window.addEventListener('scroll', reveal, { passive: true });

  window.__AC_TEST = { S: S, renderBoard: renderBoard, currentCost: currentCost, openEditor: openEditor };
})();
