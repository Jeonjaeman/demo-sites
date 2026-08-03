/* QUILL — 태블릿 응답 화면. 빌더 저장분을 그대로 렌더 + 검증 + 키오스크 초기화 */
(function () {
  'use strict';
  var Q = window.QUILL;
  var form = null;
  var ans = {};        // qid -> value
  var root = document.getElementById('surveyRoot');
  var prog = document.getElementById('prog');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function load() {
    try {
      var raw = localStorage.getItem('quill_form');
      if (raw) { form = JSON.parse(raw); return; }
    } catch (e) {}
    form = JSON.parse(JSON.stringify(Q.TPL_IDHAIR));
  }

  function answerable(q) { return q.type !== 'section'; }

  function render() {
    var theme = form.theme || '#E0523D';
    var designers = Q.DESIGNERS.filter(function (d) { return d.store === 's1'; });
    var html = '';

    html += '<div class="s-cover"><div class="theme-band" style="background:' + theme + '"></div>' +
      '<div class="row" style="justify-content:space-between"><span class="pill dot">idHAIR 강남점 · 태블릿 1</span>' +
      '<span class="small muted">담당 디자이너 <select id="selDesigner" style="border:1px solid var(--line-2);border-radius:7px;height:30px;padding:0 8px;font-size:13px">' +
      designers.map(function (d) { return '<option value="' + d.id + '"' + (d.id === 'd3' ? ' selected' : '') + '>' + d.name + ' ' + d.grade + '</option>'; }).join('') +
      '</select></span></div>' +
      '<h1>' + esc(form.title) + '</h1>' +
      '<p class="desc">' + esc(form.desc || '') + '</p>' +
      '<div class="brandline">약 2분 · 질문 ' + form.questions.filter(answerable).length + '개 · <b style="color:var(--ink)">응답은 담당 디자이너와 매장만 봅니다</b></div></div>';

    html += '<div class="s-body">';
    form.questions.forEach(function (q, i) {
      if (q.type === 'section') {
        html += '<div style="padding:26px 0 4px"><h3 style="font-size:14px;color:' + theme + ';letter-spacing:.02em">' + esc(q.title) + '</h3></div>';
        return;
      }
      html += '<div class="s-q" data-id="' + q.id + '">';
      html += '<div class="ql">' + esc(q.title) + (q.req ? '<span class="rq">*</span>' : '') + '</div>';
      if (q.help) html += '<div class="qh">' + esc(q.help) + '</div>';

      if (q.type === 'radio' || q.type === 'check') {
        var many = (q.opts || []).length > 4;
        html += '<div class="s-opts' + (many ? ' grid' : '') + '">' + (q.opts || []).map(function (o, oi) {
          return '<div class="s-opt ' + q.type + '" data-q="' + q.id + '" data-v="' + esc(o) + '"><span class="mk"></span><span>' + esc(o) + '</span></div>';
        }).join('') + '</div>';
      } else if (q.type === 'select') {
        html += '<select class="s-input" data-q="' + q.id + '"><option value="">선택하세요</option>' +
          (q.opts || []).map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>';
      } else if (q.type === 'short') {
        html += '<input class="s-input" data-q="' + q.id + '" placeholder="' + esc(q.ph || '입력해 주세요') + '">';
      } else if (q.type === 'long') {
        html += '<textarea class="s-input" data-q="' + q.id + '" placeholder="' + esc(q.ph || '자유롭게 적어주세요') + '"></textarea>';
      } else if (q.type === 'phone') {
        html += '<input class="s-input" data-q="' + q.id + '" inputmode="numeric" placeholder="010-0000-0000" maxlength="13">';
      } else if (q.type === 'date') {
        html += '<input class="s-input" type="date" data-q="' + q.id + '" max="2026-12-31">';
      } else if (q.type === 'photo') {
        html += '<div class="row"><button class="btn btn-gho photo-btn" data-q="' + q.id + '">🖼 사진 첨부하기</button><span class="small muted photo-st" data-q="' + q.id + '">첨부 없음</span></div>';
      } else if (q.type === 'rating') {
        var mx = q.max || 5, st = '';
        for (var s = 1; s <= mx; s++) st += '<span class="st" data-q="' + q.id + '" data-v="' + s + '">★</span>';
        html += '<div class="s-stars">' + st + '</div>';
      } else if (q.type === 'scale') {
        var mn = q.min == null ? 0 : q.min, mxx = q.max == null ? 10 : q.max, sc = '';
        for (var v = mn; v <= mxx; v++) sc += '<span class="sc" data-q="' + q.id + '" data-v="' + v + '">' + v + '</span>';
        html += '<div class="s-scale">' + sc + '</div>';
        if (q.lo || q.hi) html += '<div class="s-scale-ends"><span>' + esc(q.lo || '') + '</span><span>' + esc(q.hi || '') + '</span></div>';
      } else if (q.type === 'consent') {
        html += '<div class="s-consent">' + (q.items || []).map(function (it, ii) {
          return '<div class="ch-item ' + it.kind + '"><div class="ch-head"><b>' + esc(it.label.replace(/ \((필수|선택)\)$/, '')) + '</b><span class="badge">' + (it.kind === 'req' ? '필수' : '선택') + '</span></div>' +
            '<div class="ch-body">' + esc(it.body) + '</div>' +
            '<div class="ch-choose"><button class="chbtn" data-q="' + q.id + '" data-i="' + ii + '" data-v="y">동의합니다</button>' +
            '<button class="chbtn" data-q="' + q.id + '" data-i="' + ii + '" data-v="n">동의하지 않습니다</button></div></div>';
        }).join('') + '</div>';
      }
      html += '<div class="qerr" style="display:none;color:var(--bad);font-size:13px;margin-top:8px">필수 항목입니다.</div>';
      html += '</div>';
    });
    html += '</div>';

    html += '<div class="s-submit">' +
      '<div class="warn-line" style="background:var(--info-wash);border-color:#cfe0ef;color:#1f4d75"><span class="ic">🔒</span><span>제출 즉시 이 화면의 입력값은 <b>모두 지워지고 처음 화면으로 돌아갑니다.</b> 다음 손님에게 내 정보가 보이지 않아요.</span></div>' +
      '<button class="btn btn-acc btn-lg" id="btnSubmit" style="width:100%; background:' + theme + '">설문 제출하기</button></div>';

    root.innerHTML = html;
    if (!bound) { bind(); bound = true; }
    updateProg();
  }

  /* ---------- 인터랙션 ---------- */
  var bound = false;
  function bind() {
    root.addEventListener('click', function (e) {
      var opt = e.target.closest('.s-opt');
      if (opt) {
        var qid = opt.dataset.q, v = opt.dataset.v;
        var q = getQ(qid);
        if (q.type === 'radio') {
          [].forEach.call(root.querySelectorAll('.s-opt[data-q="' + qid + '"]'), function (o) { o.classList.remove('on'); });
          opt.classList.add('on');
          ans[qid] = v;
        } else {
          opt.classList.toggle('on');
          var vs = [].map.call(root.querySelectorAll('.s-opt[data-q="' + qid + '"].on'), function (o) { return o.dataset.v; });
          ans[qid] = vs;
        }
        clearErr(qid); updateProg();
        return;
      }
      var st = e.target.closest('.st');
      if (st) {
        var sq = st.dataset.q, sv = +st.dataset.v;
        ans[sq] = sv;
        [].forEach.call(root.querySelectorAll('.st[data-q="' + sq + '"]'), function (s) { s.classList.toggle('on', +s.dataset.v <= sv); });
        clearErr(sq); updateProg();
        return;
      }
      var sc = e.target.closest('.sc');
      if (sc && sc.dataset.q) {
        var cq = sc.dataset.q;
        ans[cq] = +sc.dataset.v;
        [].forEach.call(root.querySelectorAll('.sc[data-q="' + cq + '"]'), function (c) { c.classList.toggle('on', c === sc); });
        clearErr(cq); updateProg();
        return;
      }
      var ch = e.target.closest('.chbtn');
      if (ch) {
        var hq = ch.dataset.q, hi = ch.dataset.i, hv = ch.dataset.v;
        if (!ans[hq]) ans[hq] = {};
        ans[hq][hi] = hv;
        var pair = root.querySelectorAll('.chbtn[data-q="' + hq + '"][data-i="' + hi + '"]');
        [].forEach.call(pair, function (b) { b.classList.remove('on-y', 'on-n'); });
        ch.classList.add(hv === 'y' ? 'on-y' : 'on-n');
        clearErr(hq); updateProg();
        return;
      }
      var pb = e.target.closest('.photo-btn');
      if (pb) {
        var pq = pb.dataset.q;
        ans[pq] = 'style-ref.jpg';
        root.querySelector('.photo-st[data-q="' + pq + '"]').textContent = '✓ style-ref.jpg 첨부됨 (시뮬레이션)';
        Q.toast('사진을 첨부했습니다 (데모 시뮬레이션)');
        updateProg();
        return;
      }
      if (e.target.id === 'btnSubmit') submit();
    });

    root.addEventListener('input', function (e) {
      var qid = e.target.dataset.q; if (!qid) return;
      var q = getQ(qid);
      if (q && q.type === 'phone') {
        var d = e.target.value.replace(/\D/g, '').slice(0, 11);
        var f = d;
        if (d.length > 7) f = d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
        else if (d.length > 3) f = d.slice(0, 3) + '-' + d.slice(3);
        e.target.value = f;
      }
      ans[qid] = e.target.value;
      clearErr(qid); updateProg();
    });
    root.addEventListener('change', function (e) {
      var qid = e.target.dataset.q; if (!qid) return;
      ans[qid] = e.target.value; clearErr(qid); updateProg();
    });
  }

  function getQ(id) { return form.questions.filter(function (q) { return q.id === id; })[0]; }
  function clearErr(qid) {
    var qEl = root.querySelector('.s-q[data-id="' + qid + '"]');
    if (qEl) { var er = qEl.querySelector('.qerr'); if (er) er.style.display = 'none'; }
  }

  function filled(q) {
    var v = ans[q.id];
    if (q.type === 'consent') {
      // 필수 동의 항목이 전부 'y'인가
      var okAll = true;
      (q.items || []).forEach(function (it, i) {
        if (it.kind === 'req' && (!v || v[i] !== 'y')) okAll = false;
      });
      return okAll;
    }
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    return String(v).trim() !== '';
  }

  function updateProg() {
    var qs = form.questions.filter(answerable);
    var done = qs.filter(filled).length;
    prog.style.width = (qs.length ? Math.round(done / qs.length * 100) : 0) + '%';
  }

  /* ---------- 검증 + 제출 ---------- */
  function submit() {
    var bad = null;
    form.questions.forEach(function (q) {
      if (!answerable(q) || !q.req) return;
      if (!filled(q)) {
        var qEl = root.querySelector('.s-q[data-id="' + q.id + '"]');
        if (qEl) {
          var er = qEl.querySelector('.qerr');
          if (er) { er.style.display = 'block'; er.textContent = q.type === 'consent' ? '필수 동의 항목에 응답해 주세요. (동의하지 않아도 되지만 선택은 필요합니다)' : '필수 항목입니다.'; }
          if (!bad) bad = qEl;
        }
      }
    });
    // 필수 동의를 'n'으로 명시한 경우 → 제출 차단 + 대안 안내
    var reqDeclined = false;
    form.questions.forEach(function (q) {
      if (q.type !== 'consent') return;
      (q.items || []).forEach(function (it, i) {
        if (it.kind === 'req' && ans[q.id] && ans[q.id][i] === 'n') reqDeclined = true;
      });
    });
    if (reqDeclined) {
      Q.toast('필수 동의 없이는 설문을 저장할 수 없습니다 — 직원에게 종이 상담을 요청해 주세요', 'warn');
      return;
    }
    if (bad) {
      bad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      Q.toast('필수 항목이 남아 있습니다', 'warn');
      return;
    }

    // 저장 (이 브라우저 한정)
    try {
      var arr = JSON.parse(localStorage.getItem('quill_submissions') || '[]');
      var rec = { at: new Date().toISOString(), formId: form.id || 'f-custom', designer: (document.getElementById('selDesigner') || {}).value || 'd3', answers: {} };
      form.questions.forEach(function (q) {
        if (!answerable(q)) return;
        rec.answers[q.title || q.id] = ans[q.id] == null ? '' : ans[q.id];
      });
      arr.push(rec);
      localStorage.setItem('quill_submissions', JSON.stringify(arr));
    } catch (e) {}

    done();
  }

  /* ---------- 완료 + 키오스크 초기화 ---------- */
  function done() {
    var mktQ = null, mktYes = false;
    form.questions.forEach(function (q) {
      if (q.type !== 'consent') return;
      (q.items || []).forEach(function (it, i) {
        if (it.kind === 'opt' && /마케팅|수신/.test(it.label) && ans[q.id] && ans[q.id][i] === 'y') mktYes = true;
      });
    });
    var secs = 7;
    root.innerHTML = '<div class="s-done">' +
      '<div class="chk">✓</div>' +
      '<h2>설문이 제출되었습니다</h2>' +
      '<p>소중한 답변 감사합니다. 담당 디자이너가 시술 전에 꼭 확인할게요.' + (mktYes ? '<br><span class="small">이벤트 소식은 알림톡으로 보내드릴게요 (선택 동의하심)</span>' : '') + '</p>' +
      '<div class="kiosk-guard"><b>🔒 개인정보 보호 자동 초기화</b>' +
      '매장 공용 태블릿이므로 입력하신 내용은 화면에서 즉시 삭제되었고,<br><span class="kiosk-count" id="kc">' + secs + '</span>초 후 처음 화면으로 돌아갑니다. <button class="btn btn-sm btn-gho" id="resetNow" style="margin-top:10px">지금 초기화</button></div>' +
      '</div>';
    prog.style.width = '100%';
    var kc = document.getElementById('kc');
    var iv = setInterval(function () {
      secs--;
      if (kc) kc.textContent = secs;
      if (secs <= 0) { clearInterval(iv); reset(); }
    }, 1000);
    document.getElementById('resetNow').addEventListener('click', function () { clearInterval(iv); reset(); });
  }

  function reset() { ans = {}; render(); window.scrollTo({ top: 0 }); }

  /* ---------- 예시로 채우기 (클릭만으로 체험) ---------- */
  document.getElementById('btnFill').addEventListener('click', function () {
    ans = {};
    form.questions.forEach(function (q) {
      if (!answerable(q)) return;
      if (q.type === 'radio') ans[q.id] = (q.opts || [])[1] || (q.opts || [])[0];
      else if (q.type === 'check') ans[q.id] = (q.opts || []).slice(0, 2);
      else if (q.type === 'select') ans[q.id] = (q.opts || [])[0];
      else if (q.type === 'short') ans[q.id] = /성함|이름/.test(q.title) ? '김서연' : '예시 답변';
      else if (q.type === 'long') ans[q.id] = '두 달 전 탈색을 해서 모발이 많이 상해 있어요. 두피도 예민한 편입니다.';
      else if (q.type === 'phone') ans[q.id] = '010-4321-8765';
      else if (q.type === 'date') ans[q.id] = /생년월일/.test(q.title) ? '1994-06-15' : '2026-09-01';
      else if (q.type === 'photo') ans[q.id] = 'style-ref.jpg';
      else if (q.type === 'rating') ans[q.id] = 5;
      else if (q.type === 'scale') ans[q.id] = (q.max == null ? 10 : q.max) - 1;
      else if (q.type === 'consent') {
        ans[q.id] = {};
        (q.items || []).forEach(function (it, i) { ans[q.id][i] = it.kind === 'req' ? 'y' : (i % 2 ? 'n' : 'y'); });
      }
    });
    render();     // 다시 그린 뒤 UI에 반영
    applyAnsToUi();
    updateProg();
    Q.toast('가상의 예시 답변으로 채웠습니다 — 그대로 제출해 보세요', 'ok');
  });

  function applyAnsToUi() {
    form.questions.forEach(function (q) {
      var v = ans[q.id];
      if (v == null) return;
      if (q.type === 'radio') {
        var o = root.querySelector('.s-opt[data-q="' + q.id + '"][data-v="' + cssEsc(v) + '"]'); if (o) o.classList.add('on');
      } else if (q.type === 'check') {
        v.forEach(function (vv) { var o = root.querySelector('.s-opt[data-q="' + q.id + '"][data-v="' + cssEsc(vv) + '"]'); if (o) o.classList.add('on'); });
      } else if (q.type === 'select' || q.type === 'short' || q.type === 'long' || q.type === 'phone' || q.type === 'date') {
        var inp = root.querySelector('[data-q="' + q.id + '"]'); if (inp && 'value' in inp) inp.value = v;
      } else if (q.type === 'photo') {
        var stEl = root.querySelector('.photo-st[data-q="' + q.id + '"]'); if (stEl) stEl.textContent = '✓ style-ref.jpg 첨부됨 (시뮬레이션)';
      } else if (q.type === 'rating') {
        [].forEach.call(root.querySelectorAll('.st[data-q="' + q.id + '"]'), function (s) { s.classList.toggle('on', +s.dataset.v <= v); });
      } else if (q.type === 'scale') {
        [].forEach.call(root.querySelectorAll('.sc[data-q="' + q.id + '"]'), function (c) { c.classList.toggle('on', +c.dataset.v === v); });
      } else if (q.type === 'consent') {
        Object.keys(v).forEach(function (i) {
          var b = root.querySelector('.chbtn[data-q="' + q.id + '"][data-i="' + i + '"][data-v="' + v[i] + '"]');
          if (b) b.classList.add(v[i] === 'y' ? 'on-y' : 'on-n');
        });
      }
    });
  }
  function cssEsc(s) { return String(s).replace(/["\\]/g, '\\$&'); }

  load();
  render();
})();
