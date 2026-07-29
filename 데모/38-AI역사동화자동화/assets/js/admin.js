/* ============================================================
   YEODAM 여담 — admin.js (프롬프트 테스트 · 검토 리포트)
   ============================================================ */
(function () {
  'use strict';
  var Y = window.YEODAM;
  var $ = function (id) { return document.getElementById(id); };

  function toast(msg, kind) {
    var t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.textContent = msg;
    $('toastWrap').appendChild(t); requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, 2200);
  }

  /* ---------- 프롬프트 테스트 ---------- */
  function loadPrompts() {
    $('pmInvite').value = Y.DEFAULT_PROMPTS.invite;
    $('pmStory').value = Y.DEFAULT_PROMPTS.story;
    $('pmImage').value = Y.DEFAULT_PROMPTS.image;
  }
  $('pReset').onclick = function () { loadPrompts(); toast('기본 프롬프트로 되돌렸습니다'); };
  $('pTest').onclick = function () {
    var name = ($('tName').value || '하늘').trim() || '하늘';
    var spots = ['yeongneung', 'silluksa', 'ceramic'];
    var story = Y.buildStory(name, spots, {});
    var storyPrompt = $('pmStory').value.replace('{name}', name).replace('{spots}', spots.map(function (id) { return Y.spot(id).name; }).join(', '));
    var out = '● 적용된 동화 프롬프트(변수 치환)\n' + storyPrompt + '\n\n';
    out += '● 생성 결과 — 초대장\n' + story.invitation + '\n\n';
    out += '● 프롤로그\n' + story.prologue + '\n\n';
    out += '● 1쪽 (' + story.pages[1].title + ')\n' + story.pages[1].text;
    $('pOut').textContent = out;
    Y.logGen({ at: Y.fmtDT(), name: name, spots: story.groundedSpots, textModel: 'OpenAI GPT(프롬프트 테스트)',
      imageModel: '-', prompt: $('pmStory').value, humanEdit: '관리자 프롬프트 수정·테스트', factPass: Y.factCheck(story).ok, injected: false });
    renderLog();
    toast('프롬프트 테스트 실행 — 이력에 기록됨', 'ok');
  };

  /* ---------- 여주 팩트 DB + 검사기 ---------- */
  function renderFactGrid() {
    var box = $('factGrid');
    var people = Object.keys(Y.FACTS.people).map(function (nm) {
      var p = Y.FACTS.people[nm]; return '<span class="ftag person">' + nm + ' · ' + p.era + ' ' + p.century + 'C</span>';
    }).join('');
    box.innerHTML =
      '<div class="factcol"><h4>인물 (승인 · 활동 세기)</h4><div class="tags">' + people + '</div></div>' +
      '<div class="factcol"><h4>장소</h4><div class="tags">' + Y.FACTS.places.map(function (x) { return '<span class="ftag">' + x + '</span>'; }).join('') + '</div></div>' +
      '<div class="factcol"><h4>유물·개념</h4><div class="tags">' + Y.FACTS.things.map(function (x) { return '<span class="ftag">' + x + '</span>'; }).join('') + '</div></div>';
  }
  $('fcRun').onclick = function () {
    var txt = $('fcInput').value || '';
    var res = Y.factCheck({ pages: [{ text: txt }] });
    var out = $('fcOut');
    if (res.ok) {
      out.innerHTML = '<div class="chip ok">✔ 통과 — 근거 없는 연도·인물, 시대 불일치 없음</div>';
    } else {
      out.innerHTML = '<div class="chip bad" style="margin-bottom:8px">✗ ' + res.issues.length + '건 검출 — 발행 차단 대상</div>' +
        res.issues.map(function (x) { return '<div class="issue"><span class="it">' + x.type + '</span><span><b>' + x.term + '</b><br><small style="color:var(--ink-2)">' + x.reason + '</small></span></div>'; }).join('');
    }
  };

  /* ---------- 소요시간·비용 시뮬레이터 ---------- */
  function renderCost() {
    var pages = parseInt($('pgSlider').value, 10);
    $('pgVal').textContent = pages + '쪽';
    var totMs = 0, totCost = 0, rows = [];
    Y.STAGES.forEach(function (st) {
      var mult = st.perPage ? pages : 1;
      var ms = st.baseMs * mult, cost = st.credit * mult;
      totMs += ms; totCost += cost; rows.push({ label: st.label, ms: ms, cost: cost, img: st.key === 'image' });
    });
    var maxMs = Math.max.apply(null, rows.map(function (r) { return r.ms; }));
    $('costKpis').innerHTML =
      kpi('총 소요 시간', (totMs / 1000).toFixed(1) + 's') +
      kpi('예상 비용', totCost + ' 크레딧') +
      kpi('삽화 비중', Math.round(Y.stage('image').baseMs * pages / totMs * 100) + '%');
    $('costBars').innerHTML = rows.map(function (r) {
      return '<div class="bar-row"><span>' + r.label + '</span>' +
        '<span class="bar' + (r.img ? ' img' : '') + '"><i data-w="' + Math.round(r.ms / maxMs * 100) + '"></i></span>' +
        '<span class="mono r">' + (r.ms / 1000).toFixed(1) + 's · ' + r.cost + 'cr</span></div>';
    }).join('');
    setTimeout(function () { $('costBars').querySelectorAll('.bar i').forEach(function (i) { i.style.width = i.getAttribute('data-w') + '%'; }); }, 40);
  }
  function kpi(l, v) { return '<div class="kpi"><div class="kl">' + l + '</div><div class="kv">' + v + '</div></div>'; }
  $('pgSlider').oninput = renderCost;

  /* ---------- 가드레일 ---------- */
  var banned = Y.BANNED.slice();
  function renderWords() {
    $('wordChips').innerHTML = banned.map(function (w, i) {
      return '<span class="wchip">' + w + '<button data-i="' + i + '" aria-label="삭제">×</button></span>';
    }).join('');
    $('wordChips').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { banned.splice(+b.getAttribute('data-i'), 1); renderWords(); };
    });
  }
  $('addWord').onclick = function () {
    var w = ($('newWord').value || '').trim();
    if (!w) return; if (banned.indexOf(w) >= 0) return toast('이미 있는 단어입니다', 'warn');
    banned.push(w); $('newWord').value = ''; renderWords();
  };
  $('grRun').onclick = function () {
    var txt = $('grInput').value || '';
    var hits = banned.filter(function (w) { return txt.indexOf(w) >= 0; });
    var out = $('grOut');
    if (!hits.length) out.innerHTML = '<div class="chip ok">✔ 통과 — 부적절 표현 없음</div>';
    else out.innerHTML = '<div class="chip bad">✗ 차단어 ' + hits.length + '개: <b>' + hits.join(', ') + '</b> — 재생성 필요</div>';
  };

  /* ---------- 생성 이력(저작권) ---------- */
  function renderLog() {
    var log = Y.loadLog().slice().reverse();
    var tb = document.querySelector('#logTbl tbody');
    if (!log.length) { tb.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--ink-2);padding:20px">아직 생성 이력이 없습니다. 파이프라인이나 프롬프트 테스트를 실행하세요.</td></tr>'; return; }
    tb.innerHTML = log.slice(0, 40).map(function (l) {
      return '<tr><td class="mono">' + l.at + '</td><td>' + l.name + '</td><td>' + l.textModel + '</td><td>' + (l.imageModel || '-') + '</td>' +
        '<td class="c"><span class="chip ' + (l.factPass ? 'ok' : 'bad') + '">' + (l.factPass ? '통과' : '실패') + '</span></td>' +
        '<td><small>' + (l.humanEdit || '') + '</small></td></tr>';
    }).join('');
  }
  $('csvBtn').onclick = function () {
    var log = Y.loadLog();
    if (!log.length) return toast('이력이 없습니다', 'warn');
    var rows = [['시각', '주인공', '텍스트모델', '삽화모델', '프롬프트', '인간개입', '사실검증', '환각주입']];
    log.forEach(function (l) { rows.push([l.at, l.name, l.textModel, l.imageModel || '', l.prompt || '', l.humanEdit || '', l.factPass ? '통과' : '실패', l.injected ? 'Y' : 'N']); });
    var esc = function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var body = rows.map(function (r) { return r.map(esc).join(','); }).join('\r\n');
    Y.downloadBlob(new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8;' }), 'YEODAM_생성이력.csv');
  };
  $('clearLog').onclick = function () { Y.clearLog(); renderLog(); toast('생성 이력을 지웠습니다'); };

  /* ---------- 내비 활성 표시 ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('#nav a'));
  function onScroll() {
    var y = window.scrollY + 140, cur = links[0];
    links.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s && s.offsetTop <= y) cur = a; });
    links.forEach(function (a) { a.classList.toggle('on', a === cur); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 초기화 ---------- */
  loadPrompts(); renderFactGrid(); renderCost(); renderWords(); renderLog();
})();
