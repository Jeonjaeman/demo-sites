/* ============================================================
   MOLIP — 공개 홈(브랜드) 로직
   요금 · 가입 신청 폼 · 비용 비교 · 리스크 · 견적
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var won = function (n) { return n.toLocaleString('ko-KR') + '원'; };
  function toast(msg, type) {
    var el = document.createElement('div'); el.className = 'toast ' + (type || '');
    el.innerHTML = msg; $('#toasts').appendChild(el);
    setTimeout(function () { el.style.transition = '.35s'; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(function () { el.remove(); }, 360); }, 3600);
  }

  /* 요금 */
  $('#planGrid').innerHTML = PLANS.map(function (p) {
    return '<div class="plan ' + (p.best ? 'best' : '') + ' g-reveal">' + (p.best ? '<span class="flag">가장 인기</span>' : '') +
      '<h3>' + p.name + '</h3><div class="price">' + p.price + '</div>' +
      '<ul>' + p.items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul></div>';
  }).join('');

  /* 학년 옵션 */
  var GRADES = ['미취학', '초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3', 'N수·성인'];
  $('#jGrade').innerHTML = '<option value="">학년</option>' + GRADES.map(function (g) { return '<option>' + g + '</option>'; }).join('');

  /* 가입 신청 폼 */
  function validJoin() {
    var ok = true;
    [['#jName', function (v) { return v.trim().length >= 2; }],
     ['#jPhone', function (v) { return /^01[016789]-?\d{3,4}-?\d{4}$/.test(v.replace(/\s/g, '')); }],
     ['#jParent', function (v) { return /^01[016789]-?\d{3,4}-?\d{4}$/.test(v.replace(/\s/g, '')); }]
    ].forEach(function (c) {
      var el = $(c[0]), f = el.closest('.fld'); if (!c[1](el.value)) { f.classList.add('bad'); ok = false; } else f.classList.remove('bad');
    });
    return ok;
  }
  $('#jFill').onclick = function () {
    $('#jName').value = '홍길동'; $('#jGrade').value = '고2'; $('#jPhone').value = '010-1234-5678'; $('#jParent').value = '010-9876-5432';
    $('#jPlan').value = '고정석 (관리형)'; $('#jConsent').checked = true;
    $$('.fld').forEach(function (f) { f.classList.remove('bad'); });
    toast('예시값을 채웠습니다 · 이제 <b>가입 신청하기</b>를 눌러 보세요', 'ok');
  };
  $('#jSubmit').onclick = function () {
    if (!validJoin()) { toast('이름·연락처를 확인해 주세요', 'warn'); return; }
    if (!$('#jConsent').checked) { toast('학부모(법정대리인) 동의가 필요합니다', 'warn'); return; }
    var pipe = $('#jPipe');
    pipe.classList.add('show');
    pipe.innerHTML = '✅ 접수 완료 · 자체 관리자에 적재되고 구글시트로 <b>자동 백업</b>되었습니다. (아임웹·자동화툴 없이)' +
      '<div class="chain"><span>가입폼</span><span>→ 자체 DB</span><span>→ 구글시트 백업</span><span>→ 실장 알림</span></div>';
    toast('🎉 가입 신청 접수 — 관리자에서 확인됩니다', 'ok');
  };

  /* 비용 비교 */
  var nSum = NOCODE.reduce(function (s, x) { return s + x.won; }, 0);
  var cSum = CUSTOM.reduce(function (s, x) { return s + x.won; }, 0);
  $('#costNocode').innerHTML = NOCODE.map(function (x) { return '<div class="row"><span>' + x.name + '</span><span class="amt">' + won(x.won) + '/월</span></div>'; }).join('') +
    '<div class="tot"><span>월 합계</span><span class="big">' + won(nSum) + '</span></div><div class="note">연 ' + won(nSum * 12) + ' + 연결 끊기면 수리 비용·중단 · 도구마다 학습·관리 부담</div>';
  $('#costCustom').innerHTML = CUSTOM.map(function (x) { return '<div class="row"><span>' + x.name + '</span><span class="amt">' + (x.won ? won(x.won) + '/월' : '0원') + '</span></div>'; }).join('') +
    '<div class="tot"><span>월 합계</span><span class="big">' + won(cSum) + '</span></div><div class="note">구독료 0원 · 연결 끊길 지점 없음 · 한 화면에서 관리 · 구글시트는 백업만</div>';
  $('#costCallout').innerHTML = '<b>연 약 ' + won((nSum - cSum) * 12) + ' 절감.</b> 게다가 도구 4개를 잇는 방식은 그중 하나만 끊겨도 신청·리포트가 멈추지만, 통합 자체 제작은 <b>끊길 지점이 없어 훨씬 안정적</b>입니다. (금액은 시연용 추정)';

  /* 리스크 */
  $('#riskGrid').innerHTML = RISKS.map(function (r) {
    var lvl = r.lv === 'high' ? '핵심' : r.lv === 'mid' ? '주의' : '제안';
    return '<article class="risk g-reveal" data-lv="' + r.lv + '"><span class="lv">● ' + lvl + '</span><h3>' + r.t + '</h3><div class="d">' + r.d + '</div><div class="fix"><b>대응 →</b> ' + r.fix + '</div><div class="src">근거 · ' + r.src + '</div></article>';
  }).join('');

  /* 견적 */
  $('#estItems').innerHTML = EST_ITEMS.map(function (t) { return '<li>' + t + '</li>'; }).join('');
  $('#estQ').innerHTML = EST_QUESTIONS.map(function (q) { return '<div class="qitem"><span class="qn"></span><span>' + q + '</span></div>'; }).join('');

  /* 리빌·틸트·카운트업 */
  var reduceM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var parallax = $$('[data-parallax]'), counted = {}, _id = 0;
  function uid(el) { if (!el._u) el._u = ++_id; return el._u; }
  function runReveal() {
    var vh = innerHeight || document.documentElement.clientHeight;
    $$('.g-reveal:not(.is-visible), .mask:not(.is-visible)').forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('is-visible');
    });
    parallax.forEach(function (el) {
      var w = el.closest('.statement-bg') || el.parentElement, r = w.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return; var p = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = 'translateY(' + (-p * 50).toFixed(1) + 'px) scale(1.14)';
    });
    $$('[data-count]').forEach(function (el) {
      if (counted[uid(el)]) return; var r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) { counted[uid(el)] = 1; countOne(el); }
    });
  }
  function countOne(el) {
    var end = +el.dataset.count, u = el.dataset.u || '', t0 = null, dur = 1000;
    function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur); var e = 1 - Math.pow(1 - p, 3); el.innerHTML = Math.round(end * e) + (u ? '<span class="u">' + u + '</span>' : ''); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  addEventListener('scroll', runReveal, { passive: true }); addEventListener('resize', runReveal); addEventListener('load', runReveal);
  if (!reduceM && matchMedia('(hover:hover)').matches) {
    $$('.pillar').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.classList.add('tilting');
        el.style.setProperty('--ry', ((px - .5) * 9) + 'deg'); el.style.setProperty('--rx', ((.5 - py) * 9) + 'deg');
        el.style.setProperty('--mx', (px * 100) + '%'); el.style.setProperty('--my', (py * 100) + '%');
      });
      el.addEventListener('pointerleave', function () { el.classList.remove('tilting'); el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
    });
  }
  runReveal();
})();
