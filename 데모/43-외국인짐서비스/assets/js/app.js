/* ============================================================
   Pack&Fly — 데모 인터랙션
   예약 위저드 · 요금/통화 진단 · 예약조회 보안(IDOR) · 관리자 · i18n
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var won = function (n) { return '₩' + Math.round(n).toLocaleString('ko-KR'); };
  var lang = 'en';

  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.innerHTML = msg;
    $('#toasts').appendChild(el);
    setTimeout(function () { el.style.transition = '.35s'; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(function () { el.remove(); }, 360); }, 3400);
  }
  function t(k) { return (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k; }

  /* ---------------- i18n ---------------- */
  function applyLang(l) {
    lang = l;
    $$('.lang button').forEach(function (b) { b.classList.toggle('on', b.dataset.l === l); });
    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    document.documentElement.lang = l;
    renderStep();
  }

  /* ---------------- 예약 위저드 ---------------- */
  var wz = { step: 0, service: null, dir: null, bags: 1, oversized: false, cur: 'KRW', pay: null };
  var STEPS = 6; // 0 서비스, 1 방향, 2 짐, 3 장소/시간, 4 연락처, 5 결제
  function price() { return wz.bags * unitPrice(); }
  function updatePrice() {
    $('#wzPrice').textContent = won(price());
    var bar = $$('#wzSteps i');
    bar.forEach(function (i, idx) { i.classList.toggle('done', idx <= wz.step); });
  }
  function canNext() {
    if (wz.step === 0) return !!wz.service;
    if (wz.step === 1) return !!wz.dir;
    if (wz.step === 4) { return $('#fName') && $('#fName').value.trim() && $('#fPhone') && $('#fPhone').value.trim(); }
    return true;
  }
  function renderStep() {
    var b = $('#wzBody'), s = wz.step, h = '';
    if (s === 0) {
      h = '<div class="step-num">STEP 0</div><div class="wz-q">' + t('q0') + '</div><div class="wz-hint">배송/보관 분기 — 현재 폼에 없던 0단계</div>' +
        '<div class="opt-grid c2">' +
        optCard('service', 'deliver', '📦', t('svcDeliver'), t('svcDeliverD')) +
        optCard('service', 'store', '🧳', t('svcStore'), t('svcStoreD')) + '</div>';
    } else if (s === 1) {
      h = '<div class="step-num">STEP 1</div><div class="wz-q">' + t('q1') + '</div><div class="wz-hint">departing / arriving / moving</div>' +
        '<div class="opt-grid c3">' +
        optCard('dir', 'departing', '🏨→✈️', t('dirDepart'), '') +
        optCard('dir', 'arriving', '✈️→🏨', t('dirArrive'), '') +
        optCard('dir', 'moving', '🏨→🏨', t('dirMove'), '') + '</div>';
    } else if (s === 2) {
      h = '<div class="step-num">STEP 2</div><div class="wz-q">' + t('q2') + '</div><div class="wz-hint">사이즈 구분 없음 · 개당 균일가 (' + won(unitPrice()) + ')</div>' +
        '<div class="bagctl"><button id="bagMinus">−</button><span class="n" id="bagN">' + wz.bags + '</span><button id="bagPlus">+</button><span style="color:var(--muted);font-size:12px">개 · ' + won(price()) + '</span></div>' +
        '<label class="checkrow"><input type="checkbox" id="fOver"' + (wz.oversized ? ' checked' : '') + '><span class="tx"><b>대형·특수 짐 있음</b><span>골프백·유모차 등 — 현장 확인</span></span></label>' +
        '<div class="warn-box">예상 개수로 예약하고, 당일 실제 개수는 관리자가 실측·조정합니다(시트 운영 실태 반영).</div>';
    } else if (s === 3) {
      h = '<div class="step-num">STEP 3</div><div class="wz-q">' + t('q3') + '</div>' +
        (wz.dir === 'arriving'
          ? '<div class="fld"><label>공항 <span class="req">*</span></label><input value="김해공항 국제선 (金海機場)" disabled></div>'
          : '<div class="fld"><label>출발지 주소 <span class="req">*</span></label><input placeholder="Google Places 자동완성" id="fAddr"><div class="hint">현재 폼은 자유 텍스트 → 새 시스템은 자동완성 + 거점 거리</div></div>') +
        '<div class="fld"><label>날짜 · 시간 <span class="req">*</span></label><div class="row"><input type="date"><input type="time"></div></div>' +
        (wz.service === 'store' ? '<div class="fld"><label>맡길 곳(프런트 보관?)</label><select><option>front — 숙소 프런트 보관</option><option>none — 보관 불가(현장)</option><option>unknown — 미정</option></select></div>' : '');
    } else if (s === 4) {
      h = '<div class="step-num">STEP 4</div><div class="wz-q">' + t('q4') + '</div>' +
        '<div class="fld"><label>' + t('name') + ' <span class="req">*</span></label><input id="fName" value="GILDONG HONG" placeholder="GILDONG HONG"></div>' +
        '<div class="fld"><label>' + t('phone') + ' <span class="req">*</span></label><div class="row"><select class="pcode" id="fPcode">' + PCODES.map(function (p) { return '<option' + (p === (LANG_PCODE[lang] || '+886') ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select><input id="fPhone" value="912 345 678" placeholder="912 345 678"></div><div class="hint">예시값이 채워져 있어 타이핑 없이 진행됩니다 · 언어별 국가번호 자동</div></div>' +
        '<div class="fld"><label>' + t('email') + '</label><input id="fEmail" type="email" placeholder="you@example.com"></div>' +
        '<div class="fld"><label>LINE ID</label><input placeholder="line id (선택)"></div>' +
        '<label class="checkrow"><input type="checkbox" id="fTerms"><span class="tx"><b>약관·개인정보(국외이전 포함) 동의</b><span>배상한도·통지기한·수집항목 고지 (2026-07-31 추가)</span></span></label>';
    } else if (s === 5) {
      h = '<div class="step-num">STEP 5</div><div class="wz-q">' + t('q5') + '</div><div class="wz-hint">' + t('payMethod') + ' · 통화별 정액 (환율 자동환산 없음)</div>' +
        payOpt('paypal', '💳', 'PayPal', wz.cur) +
        payOpt('cash', '💵', '현금(현장)', null) +
        '<div class="fld" style="margin-top:6px"><label>통화</label><select id="fCur">' + Object.keys(CUR_PRICE).map(function (c) { return '<option value="' + c + '"' + (c === wz.cur ? ' selected' : '') + '>' + c + ' · ' + (c === 'KRW' ? '₩' : c === 'USD' ? '$' : c === 'JPY' ? '¥' : 'NT$') + CUR_PRICE[c] * wz.bags + '</option>'; }).join('') + '</select></div>' +
        '<div class="warn-box">통화별 정액가는 원화 실수취가 달라집니다 — 아래 <b>통화 진단</b>에서 확인하세요.</div>';
    }
    b.innerHTML = h;
    bindStep();
    updatePrice();
    $('#wzBack').style.visibility = s === 0 ? 'hidden' : 'visible';
    $('#wzNext').textContent = s === 5 ? t('pay') : t('next');
  }
  function optCard(group, val, ic, title, desc) {
    var on = wz[group] === val;
    return '<button class="opt' + (on ? ' on' : '') + '" data-opt="' + group + '" data-val="' + val + '"><span class="ic">' + ic + '</span><b>' + title + '</b>' + (desc ? '<span>' + desc + '</span>' : '') + '</button>';
  }
  function payOpt(val, ic, label, cur) {
    var on = wz.pay === val;
    var amt = cur ? won(CUR_PRICE[wz.cur] * wz.bags * FX[wz.cur]) : '';
    return '<div class="pay-opt' + (on ? ' on' : '') + '" data-pay="' + val + '"><span class="pi">' + ic + '</span><b>' + label + '</b>' + (cur ? '<span class="amt">' + wz.cur + ' ' + (CUR_PRICE[wz.cur] * wz.bags) + '</span>' : '') + '</div>';
  }
  function bindStep() {
    $$('#wzBody [data-opt]').forEach(function (el) {
      el.onclick = function () { wz[el.dataset.opt] = el.dataset.val; renderStep(); };
    });
    $$('#wzBody [data-pay]').forEach(function (el) { el.onclick = function () { wz.pay = el.dataset.pay; renderStep(); }; });
    var bm = $('#bagMinus'), bp = $('#bagPlus');
    if (bm) bm.onclick = function () { wz.bags = Math.max(1, wz.bags - 1); renderStep(); };
    if (bp) bp.onclick = function () { wz.bags = Math.min(20, wz.bags + 1); renderStep(); };
    var ov = $('#fOver'); if (ov) ov.onchange = function () { wz.oversized = ov.checked; };
    var cur = $('#fCur'); if (cur) cur.onchange = function () { wz.cur = cur.value; renderStep(); };
  }
  function genResno() {
    // 결정적(비순차) 예약번호 — enumeration 방지 취지 표현
    var base = (wz.bags * 7 + wz.step * 13 + (wz.name ? wz.name.length : 3) * 3 + 4820);
    var code = (base * 97 % 9000 + 1000);
    return 'PF-' + code + '-' + (['A', 'K', 'M', 'R', 'T'][base % 5]);
  }
  function nextStep() {
    if (!canNext()) { toast('필수 항목을 입력해 주세요', 'err'); return; }
    if (wz.step === 4 && $('#fTerms') && !$('#fTerms').checked) { toast('약관·개인정보 동의가 필요합니다', 'warn'); return; }
    if (wz.step < 5) { if ($('#fName')) wz.name = $('#fName').value.trim(); wz.step++; renderStep(); return; }
    // 결제 완료
    if (!wz.pay) { toast('결제 수단을 선택해 주세요', 'warn'); return; }
    doneScreen();
  }
  function doneScreen() {
    var resno = genResno();
    $('#wzBody').innerHTML = '<div class="done-screen">' +
      '<div class="big-ic">✓</div>' +
      '<div style="font-weight:800;font-size:17px">' + t('done') + '</div>' +
      '<div style="font-size:12.5px;color:var(--muted);margin-top:4px">' + (wz.service === 'store' ? t('svcStore') : t('svcDeliver')) + ' · ' + wz.bags + ' bags · ' + won(price()) + '</div>' +
      '<div class="resno">' + resno + '</div>' +
      '<div style="font-size:12px;color:var(--muted)">' + t('resnoLabel') + ' — 조회 시 <b>연락처</b>와 함께 입력하세요</div>' +
      '<div class="warn-box" style="text-align:center;margin-top:14px">⚠ 현재 폼은 예약번호가 없어 “언제·어떻게”를 손님이 못 물어봅니다 → 새 시스템은 번호 + LINE/WhatsApp 안내로 연결합니다.</div>' +
      '<button class="btn btn-g btn-block" style="margin-top:12px" id="wzReset">새 예약</button></div>';
    $('#wzSteps').querySelectorAll('i').forEach(function (i) { i.classList.add('done'); });
    $('#wzBack').style.visibility = 'hidden'; $('#wzNext').style.display = 'none';
    $('#wzReset').onclick = resetWz;
    // 조회 데모에 방금 번호 연결
    window._lastResno = resno; window._lastTail = ($('#fPhone') ? $('#fPhone').value.trim().slice(-3) : '');
    toast('✅ 예약 완료 · 예약번호 ' + resno + ' 발급');
  }
  function resetWz() { wz = { step: 0, service: null, dir: null, bags: 1, oversized: false, cur: 'KRW', pay: null }; $('#wzNext').style.display = ''; renderStep(); }

  /* ---------------- 요금 진단 (tier vs 균일 vs 프로모) ---------------- */
  function renderRateDiag() {
    var ns = [1, 2, 3, 5, 8];
    var rows = ns.map(function (n) {
      var promo = n * RATE.PROMO, tier = n * legacyTier(n), uni = n * RATE.NORMAL;
      var mism = tier !== uni;
      return '<tr' + (mism ? ' class="hot"' : '') + '><td class="num">' + n + '</td><td class="num">' + won(promo) + '</td><td class="num">' + won(tier) + '</td><td class="num">' + won(uni) + '</td><td>' + (mism ? '<span class="pill up">불일치</span>' : '<span class="pill down">동일</span>') + '</td></tr>';
    }).join('');
    $('#rateDiag').innerHTML =
      '<table class="tbl"><thead><tr><th>짐</th><th class="num">현재 프로모</th><th class="num">현재 tier(프로모 종료 시)</th><th class="num">RFQ 균일 ₩22,000</th><th>tier vs 균일</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="callout warn"><b>진단:</b> 지금은 프로모(개당 ₩10,000)가 tier 할인을 가리고 있습니다. 프로모가 끝나면 코드가 <b>tier(개수 많을수록 할인)</b>로 되돌아가 <b>RFQ 확정 균일가(₩22,000)와 어긋납니다.</b> 요금 로직을 코드에서 빼 관리자 설정(S-14)으로 옮겨야 합니다.</div>';
  }

  /* ---------------- 통화 진단 (PayPal 정액 → 원화 실수취) ---------------- */
  function krwReceived(cur) {
    var p = CUR_PRICE[cur];
    var fee = p * PP.rate + PP.fixed[cur];
    var net = p - fee;
    return cur === 'KRW' ? net : net * FX[cur] * (1 - PP.spread);
  }
  function renderCurDiag() {
    var base = CUR_PRICE.KRW; // 업체가 의도한 개당 원화(≈₩10,000)
    var data = Object.keys(CUR_PRICE).map(function (c) { return { c: c, krw: krwReceived(c) }; });
    var max = Math.max.apply(null, data.map(function (d) { return d.krw; }));
    var min = Math.min.apply(null, data.map(function (d) { return d.krw; }));
    var rows = data.map(function (d) {
      var diff = (d.krw - base) / base * 100;
      var cls = d.krw === min ? ' class="hot"' : d.krw === max ? ' class="best"' : '';
      var sym = { KRW: '₩', USD: '$', JPY: '¥', TWD: 'NT$' }[d.c];
      return '<tr' + cls + '><td><b>' + d.c + '</b></td><td class="num">' + sym + CUR_PRICE[d.c] + '</td><td class="num">' + won(d.krw) + '</td><td><span class="pill ' + (diff < 0 ? 'up' : 'down') + '">' + (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%</span></td></tr>';
    }).join('');
    var spread = ((max - min) / base * 100).toFixed(1);
    $('#curDiag').innerHTML =
      '<table class="tbl"><thead><tr><th>통화</th><th class="num">표시 정액(1개)</th><th class="num">원화 실수취</th><th>기준 ₩' + base + ' 대비</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="callout bad"><b>진단:</b> 같은 “짐 1개”인데 PayPal 수수료·환전 스프레드·통화별 고정수수료 때문에 <b>원화 실수취가 통화마다 ' + spread + '%p 벌어집니다.</b> JPY가 가장 불리, TWD가 가장 유리 — 통화별 정액가를 원화 기준으로 재조정해야 마진 역전이 사라집니다. (시트의 “대만달러 이체불가”도 같은 맥락)</div>';
  }

  /* ---------------- 예약 조회 보안 (IDOR) ---------------- */
  function bindLookup() {
    $('#lkBad').onclick = function () {
      var v = ($('#lkBadNo').value || '').trim().toUpperCase();
      var r = $('#lkBadRes');
      if (!v) { r.innerHTML = '예약번호를 입력하세요.'; return; }
      // 번호만으로 — 아무 번호나 근처면 남의 예약이 나옴(취약)
      r.innerHTML = '<span class="leak">⚠ 노출됨 — ' + SAMPLE_BOOKING.name + ' · ' + SAMPLE_BOOKING.dir + ' · ' + SAMPLE_BOOKING.place + '<br>이메일 ' + SAMPLE_BOOKING.email + ' · 항공편 ' + SAMPLE_BOOKING.flight + '</span><br><span style="color:var(--muted);font-size:11px">번호만 바꿔 넣으면 다음 손님도 그대로 노출됩니다(enumeration).</span>';
      toast('번호만으로 타인 예약이 노출됩니다 (IDOR)', 'err');
    };
    $('#lkGood').onclick = function () {
      var no = ($('#lkGoodNo').value || '').trim().toUpperCase();
      var tail = ($('#lkGoodTail').value || '').trim();
      var r = $('#lkGoodRes');
      if (!no || !tail) { r.innerHTML = '예약번호와 연락처 뒷자리를 모두 입력하세요.'; return; }
      var okNo = (window._lastResno && no === window._lastResno.toUpperCase()) || no === 'PF-8842';
      var okTail = (window._lastTail && tail === window._lastTail) || tail === SAMPLE_BOOKING.phoneTail;
      if (okNo && okTail) {
        r.innerHTML = '<span class="blocked">✓ 본인 확인됨</span> — 예약 상세를 안전하게 표시합니다.';
        toast('번호 + 연락처 일치 — 본인만 조회', '');
      } else {
        r.innerHTML = '<span class="blocked">차단됨</span> — 번호와 연락처가 일치하지 않습니다. 시도 횟수가 제한됩니다(rate limit).';
      }
    };
  }

  /* ---------------- 관리자 오늘 할 일 ---------------- */
  function renderAdmin() {
    $('#todayList').innerHTML = TODAY.map(function (j) {
      return '<div class="job"><span class="time">' + j.time + '</span><span class="dir">' + j.dir + '</span>' +
        '<span class="info"><div>' + j.from + ' <span style="color:var(--muted)">→</span> ' + j.to + '</div><div class="sub">' + j.flight + ' · ' + j.pay + ' (' + j.cur + ') · ' + j.memo + '</div></span>' +
        '<span class="bags">' + j.bags + '개</span></div>';
    }).join('');
    $('#adminTag').textContent = TODAY.length + ' jobs · ' + TODAY.reduce(function (s, j) { return s + j.bags; }, 0) + ' bags';
  }

  /* ---------------- 리스크 · 견적 ---------------- */
  function renderRisks() {
    $('#riskGrid').innerHTML = RISKS.map(function (r) {
      var lvl = r.lv === 'high' ? '치명' : r.lv === 'mid' ? '주의' : '양호';
      return '<article class="risk g-reveal" data-lv="' + r.lv + '"><span class="lv">● ' + lvl + '</span><h3>' + r.t + '</h3><div class="d">' + r.d + '</div><div class="fix"><b>대응 →</b> ' + r.fix + '</div><div class="src">근거 · ' + r.src + '</div></article>';
    }).join('');
  }
  function renderEstimate() {
    var days = ESTIMATE.reduce(function (s, e) { return s + e.d; }, 0);
    $('#estBody').innerHTML = ESTIMATE.map(function (e) {
      return '<tr><td><span class="code">' + e.c + '</span> ' + e.t + '</td><td class="d">' + e.d + '</td></tr>';
    }).join('') +
      '<tr class="tot"><td>합계 (화면 A~M · VAT 별도)</td><td class="d">' + days + '작업일 · 1,500만원</td></tr>';
    $('#estOpts').innerHTML = EST_OPTS.map(function (o) { return '<tr class="opt"><td>' + o.t + '</td><td class="d">' + o.d + '</td></tr>'; }).join('');
    $('#estTotal').textContent = days;
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
  $$('.lang button').forEach(function (b) { b.onclick = function () { applyLang(b.dataset.l); }; });
  $('#wzNext').onclick = nextStep;
  $('#wzBack').onclick = function () { if (wz.step > 0) { wz.step--; renderStep(); } };
  renderRateDiag(); renderCurDiag(); bindLookup(); renderAdmin(); renderRisks(); renderEstimate();
  applyLang('en');
  runReveal();
})();
