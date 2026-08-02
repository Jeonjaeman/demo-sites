/* ============================================================
   CLASSKIT — 데모 인터랙션
   무료체험 폼(아동 개인정보 동의 게이트·즉시 알림) · 상담 폼
   시리즈 소개 · 콘텐츠 보호(워터마크·청약철회) · 리스크 · 관리자
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var won = function (n) { return n.toLocaleString('ko-KR') + '원'; };

  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.innerHTML = msg;
    $('#toasts').appendChild(el);
    setTimeout(function () { el.style.transition = '.35s'; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(function () { el.remove(); }, 360); }, 3600);
  }

  /* ---------------- 시리즈 소개 ---------------- */
  function renderSeries() {
    $('#seriesGrid').innerHTML = SERIES.map(function (s) {
      return '<article class="scard g-reveal">' +
        '<div class="thumb">📚' + (s.sample ? '<div class="play" data-sample="' + s.id + '">▶</div>' : '') + '</div>' +
        '<div class="body"><span class="cat">' + s.cat + '</span><h3>' + s.title + '</h3><p>' + s.desc + '</p>' +
        '<div class="foot"><span class="price">' + won(s.price) + '</span><span class="stars">★ ' + s.stars + '</span>' +
        '<span class="soon">' + (s.sample ? '샘플 영상' : '소개만') + ' · 1단계 결제 없음</span></div></div></article>';
    }).join('');
    $$('#seriesGrid [data-sample]').forEach(function (el) {
      el.onclick = function () { toast('▶ 샘플 영상 재생(유튜브 임베드) — <b>본편 자료는 결제 후 제공</b>됩니다', 'ok'); };
    });
  }

  /* ---------------- 무료체험 신청 폼 ---------------- */
  function fillGrades() {
    $('#tGrade').innerHTML = '<option value="">자녀 학년 선택</option>' + GRADES.map(function (g) { return '<option>' + g + '</option>'; }).join('');
  }
  function validTrial() {
    var ok = true;
    var checks = [
      ['#tName', function (v) { return v.trim().length >= 2; }],
      ['#tPhone', function (v) { return /^01[016789]-?\d{3,4}-?\d{4}$/.test(v.replace(/\s/g, '')); }],
      ['#tGrade', function (v) { return !!v; }],
    ];
    checks.forEach(function (c) {
      var el = $(c[0]), fld = el.closest('.fld');
      if (!c[1](el.value)) { fld.classList.add('bad'); ok = false; } else { fld.classList.remove('bad'); }
    });
    return ok;
  }
  function bindTrial() {
    $('#trialFill').onclick = function () {
      $('#tName').value = '홍길동'; $('#tPhone').value = '010-1234-5678'; $('#tGrade').value = '초3';
      $('#tConsent1').checked = true; $('#tConsent2').checked = true;
      $$('.fld').forEach(function (f) { f.classList.remove('bad'); });
      toast('예시값을 채웠습니다 · 이제 <b>무료체험 신청하기</b>를 눌러 보세요', 'ok');
    };
    $('#trialSubmit').onclick = function () {
      var okFields = validTrial();
      var c1 = $('#tConsent1').checked, c2 = $('#tConsent2').checked;
      if (!okFields) { toast('입력값을 확인해 주세요 (이름·연락처·학년)', 'err'); return; }
      if (!c1 || !c2) {
        toast('<b>법정대리인 동의</b> 없이는 자녀 정보를 받을 수 없습니다', 'warn');
        $$('.consent').forEach(function (el) { el.style.borderColor = 'var(--red)'; setTimeout(function () { el.style.borderColor = ''; }, 1200); });
        return;
      }
      // 즉시 알림 시뮬 + 접수
      var grade = $('#tGrade').value, name = $('#tName').value.trim();
      $('#trialNotify').classList.add('show');
      $('#trialNotify').innerHTML = '✅ 접수 완료 · <b>담당자에게 즉시 알림 발송</b>(이메일 + 카카오톡). 자녀 정보는 <b>학년만</b> 저장했습니다.';
      LEADS.unshift({ kind: 'trial', name: name + ' 학부모', sub: '자녀 ' + grade + ' · 방금 접수 · 즉시 알림 발송됨', t: '방금' });
      renderLeads();
      toast('🔔 무료체험 접수 — 담당자 즉시 알림 발송', 'ok');
    };
  }

  /* ---------------- 상담 문의 폼 ---------------- */
  function bindAsk() {
    $('#askFill').onclick = function () {
      $('#aName').value = '김문의'; $('#aPhone').value = '010-2222-3333';
      $('#aBody').value = '교사용 지도안을 개별로 구매할 수 있나요?'; $('#aConsent').checked = true;
      toast('예시값을 채웠습니다 · 이제 <b>문의 접수</b>를 눌러 보세요', 'ok');
    };
    $('#askSubmit').onclick = function () {
      var name = $('#aName').value.trim(), phone = $('#aPhone').value.trim(), body = $('#aBody').value.trim();
      if (name.length < 2 || !phone || body.length < 5) { toast('이름·연락처·문의 내용을 입력해 주세요', 'err'); return; }
      if (!$('#aConsent').checked) { toast('개인정보 수집·이용 동의가 필요합니다', 'warn'); return; }
      LEADS.unshift({ kind: 'ask', name: name, sub: '상담 문의 — ' + body.slice(0, 24) + (body.length > 24 ? '…' : ''), t: '방금' });
      renderLeads();
      $('#aName').value = $('#aPhone').value = $('#aBody').value = ''; $('#aConsent').checked = false;
      toast('✅ 상담 문의가 접수되었습니다', 'ok');
    };
  }

  /* ---------------- 콘텐츠 보호(워터마크·청약철회) ---------------- */
  function bindProtect() {
    var doc = $('#protectDoc'), wm = $('#wmToggle'), refund = $('#refundToggle'), verdict = $('#protectVerdict');
    function upd() {
      doc.classList.toggle('on', wm.checked);
      var msgs = [];
      if (!wm.checked) msgs.push('워터마크 <b>꺼짐</b> — 누가 유출했는지 추적 불가');
      else msgs.push('워터마크 <b>켜짐</b> — 구매자 ID가 문서에 박혀 유출 억제·추적');
      if (!refund.checked) { verdict.className = 'callout bad'; verdict.innerHTML = '<b>환불 분쟁 위험.</b> 청약철회 불가 고지가 없으면 다운로드 후에도 환불해줘야 합니다. ' + msgs.join(' · '); }
      else if (!wm.checked) { verdict.className = 'callout warn'; verdict.innerHTML = '<b>보완 필요.</b> 고지는 했지만 유출 추적이 없습니다. ' + msgs.join(' · '); }
      else { verdict.className = 'callout ok'; verdict.innerHTML = '<b>안전.</b> 청약철회 불가 고지 + 무료체험/샘플 제공 + 구매자 워터마크로 유출·환불 리스크를 함께 막았습니다.'; }
    }
    wm.onchange = upd; refund.onchange = upd; upd();
  }

  /* ---------------- 관리자 접수 ---------------- */
  function renderLeads() {
    var kinds = { trial: ['trial', '무료체험'], ask: ['ask', '상담'], b2b: ['b2b', 'B2B'] };
    $('#leadList').innerHTML = LEADS.slice(0, 6).map(function (l) {
      var k = kinds[l.kind];
      return '<div class="lead"><span class="kind ' + k[0] + '">' + k[1] + '</span><span class="info"><div>' + l.name + '</div><div class="sub">' + l.sub + '</div></span><span class="t">' + l.t + '</span></div>';
    }).join('');
    var tr = LEADS.filter(function (l) { return l.kind === 'trial'; }).length;
    var b2 = LEADS.filter(function (l) { return l.kind === 'b2b'; }).length;
    $('#leadTag').textContent = LEADS.length + '건 · 체험 ' + tr + ' · B2B ' + b2;
  }

  /* ---------------- 리스크 ---------------- */
  function renderRisks() {
    $('#riskGrid').innerHTML = RISKS.map(function (r) {
      var lvl = r.lv === 'high' ? '치명' : r.lv === 'mid' ? '주의' : '양호';
      return '<article class="risk g-reveal" data-lv="' + r.lv + '"><span class="lv">● ' + lvl + '</span><h3>' + r.t + '</h3><div class="d">' + r.d + '</div><div class="fix"><b>대응 →</b> ' + r.fix + '</div><div class="src">근거 · ' + r.src + '</div></article>';
    }).join('');
  }

  /* ---------------- 단계별 견적 (1단계 상세) ---------------- */
  function renderStage1() {
    $('#stage1List').innerHTML = STAGE1.map(function (t) { return '<li>' + t + '</li>'; }).join('');
  }

  /* ---------------- 리빌 · 카운트업 · 틸트 ---------------- */
  var reduceM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var parallax = $$('[data-parallax]'), counted = {}, _id = 0;
  function uid(el) { if (!el._u) el._u = ++_id; return el._u; }
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
  addEventListener('scroll', runReveal, { passive: true });
  addEventListener('resize', runReveal); addEventListener('load', runReveal);
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

  /* ---------------- init ---------------- */
  fillGrades(); renderSeries(); bindTrial(); bindAsk(); bindProtect(); renderLeads(); renderRisks(); renderStage1();
  runReveal();
})();
