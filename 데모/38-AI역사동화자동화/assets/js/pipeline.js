/* ============================================================
   YEODAM 여담 — pipeline.js (사용자 파이프라인 화면)
   · 관광지 선택 · 단계별 계측 실행 · 사실검증/가드레일 게이트
   · 동화 뷰어 · 오프라인 PDF 생성(캔버스→JPEG)
   ============================================================ */
(function () {
  'use strict';
  var Y = window.YEODAM;
  var $ = function (id) { return document.getElementById(id); };
  var selected = ['yeongneung', 'silluksa', 'ceramic'];
  var story = null, factRes = null, guardRes = null, factOk = false, curPage = 0;

  /* ---------- 토스트 ---------- */
  function toast(msg, kind) {
    var t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.textContent = msg;
    $('toastWrap').appendChild(t); requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, 2400);
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- 관광지 칩 ---------- */
  var EMOJI = { yeongneung: '👑', silluksa: '🏯', ceramic: '🏺', queenmin: '🏠' };
  function renderSpots() {
    var box = $('spots'); box.innerHTML = '';
    Y.SPOTS.forEach(function (s) {
      var b = document.createElement('button');
      b.className = 'spotchip'; b.setAttribute('aria-pressed', selected.indexOf(s.id) >= 0);
      b.innerHTML = '<span class="em">' + EMOJI[s.id] + '</span>' + s.name;
      b.onclick = function () {
        var i = selected.indexOf(s.id);
        if (i >= 0) { if (selected.length <= 1) return toast('최소 한 곳은 선택해 주세요', 'warn'); selected.splice(i, 1); }
        else selected.push(s.id);
        b.setAttribute('aria-pressed', selected.indexOf(s.id) >= 0);
      };
      box.appendChild(b);
    });
  }

  /* ---------- 파이프라인 실행 ---------- */
  function stageRow(st) {
    var el = document.createElement('div');
    el.className = 'prow' + (st.key === 'image' ? ' bottleneck' : ''); el.id = 'st_' + st.key;
    el.innerHTML = '<span class="pi">' + '·' + '</span>' +
      '<span class="pl"><b>' + st.label + '</b><small>' + st.engine + '</small></span>' +
      '<span class="pcost">' + (st.credit ? '~' + st.credit + 'cr' : '무료') + '</span>' +
      '<span class="ptime">—</span>';
    return el;
  }

  async function run() {
    var name = ($('childName').value || '').trim() || '하늘';
    var inject = $('injectTg').checked;
    var pageCount = selected.length; /* 삽화 생성 페이지 수(표지는 기존 에셋) */

    /* 초기화 */
    story = Y.buildStory(name, selected.slice(), { injectHallucination: inject });
    factOk = false; curPage = 0;
    $('runBtn').disabled = true; $('runBtn').textContent = '생성 중…';
    ['gateSec', 'bookSec', 'pdfSec'].forEach(function (id) { $(id).classList.add('hidden'); });
    $('pipeSec').classList.remove('hidden');
    $('pipeState').textContent = '실행 중'; $('bottleNote').classList.remove('show');

    var pipe = $('pipe'); pipe.innerHTML = '';
    Y.STAGES.forEach(function (st) { pipe.appendChild(stageRow(st)); });
    $('pipeSec').scrollIntoView({ behavior: 'smooth', block: 'start' });

    var totMs = 0, totCost = 0;
    for (var i = 0; i < Y.STAGES.length; i++) {
      var st = Y.STAGES[i], row = $('st_' + st.key);
      row.classList.add('run'); row.querySelector('.pi').textContent = '▶';
      var dur = st.baseMs * (st.perPage ? pageCount : 1);
      var t0 = Y.now();
      await sleep(dur);
      var el = Y.now() - t0;
      row.classList.remove('run'); row.classList.add('done'); row.querySelector('.pi').textContent = '✓';
      row.querySelector('.ptime').textContent = (el / 1000).toFixed(1) + 's';
      totMs += el; totCost += st.credit * (st.perPage ? pageCount : 1);
      $('totTime').textContent = (totMs / 1000).toFixed(1) + 's';
      $('totCost').textContent = totCost;

      if (st.key === 'factcheck') { factRes = Y.factCheck(story); renderFactGate(); }
      if (st.key === 'guardrail') { guardRes = Y.guardrail(story.pages.map(function (p) { return p.text; }).join(' ')); renderGuardGate(); $('gateSec').classList.remove('hidden'); }
      if (st.key === 'image' && pageCount >= 2) $('bottleNote').classList.add('show');
    }

    $('pipeState').textContent = '완료';
    renderBook();
    finishGates(name, inject);
    $('runBtn').disabled = false; $('runBtn').textContent = '✨ 다시 생성';
  }

  /* ---------- 게이트 렌더 ---------- */
  function renderFactGate() {
    var g = $('gFact'), chip = $('factChip'), body = $('factBody');
    if (factRes.ok) {
      g.className = 'g pass'; chip.className = 'chip ok tag'; chip.textContent = '통과';
      body.innerHTML = '<div class="ok-line">✔ 생성문의 인물·시대·연도가 모두 승인된 여주 원천과 일치합니다.</div>' +
        '<small>승인 관광지 ' + story.groundedSpots.length + '곳으로 그라운딩 · 근거 없는 연도/인물 0건</small>';
    } else {
      g.className = 'g fail'; chip.className = 'chip bad tag'; chip.textContent = factRes.issues.length + '건 검출';
      body.innerHTML = factRes.issues.map(function (x) {
        return '<div class="issue"><span class="it">' + x.type + '</span><span><b>' + x.term + '</b><br><small>' + x.reason + '</small></span></div>';
      }).join('') + '<small style="display:block;margin-top:8px;color:var(--danger);font-weight:700">⛔ 검증 통과 전에는 PDF 발행이 차단됩니다.</small>';
    }
  }
  function renderGuardGate() {
    var g = $('gGuard'), chip = $('guardChip'), body = $('guardBody');
    if (guardRes.clean) {
      g.className = 'g pass'; chip.className = 'chip ok tag'; chip.textContent = '통과';
      body.innerHTML = '<div class="ok-line">✔ 아동 부적절 표현이 발견되지 않았습니다.</div><small>유해표현 사전 ' + Y.BANNED.length + '개 항목 대조</small>';
    } else {
      g.className = 'g fail'; chip.className = 'chip bad tag'; chip.textContent = guardRes.hits.length + '개';
      body.innerHTML = '<small>차단어: <b>' + guardRes.hits.join(', ') + '</b> — 재생성이 필요합니다.</small>';
    }
  }
  function finishGates(name, inject) {
    factOk = factRes.ok && guardRes.clean;
    $('pdfSec').classList.remove('hidden');
    $('pdfBtn').disabled = !factOk;
    $('pdfHint').textContent = factOk
      ? '외부 라이브러리 없이 브라우저에서 실제 PDF를 생성합니다(한글 안전 렌더).'
      : '안전 게이트를 통과해야 발행할 수 있습니다. 위 검증 결과를 확인하세요.';
    /* 저작권 대응 생성 이력 기록 */
    Y.logGen({
      at: Y.fmtDT(), name: name, spots: story.groundedSpots,
      textModel: 'OpenAI GPT(예시)', imageModel: '이미지 생성 API(사전생성 에셋)',
      prompt: Y.DEFAULT_PROMPTS.story, humanEdit: '승인 팩트 DB 그라운딩·검수 게이트 통과',
      factPass: factRes.ok, injected: !!inject
    });
    $('copyNote').innerHTML = '📝 <b>저작권 대응</b> — 이번 생성의 프롬프트·모델·시각·검수 결과가 <b>생성 이력</b>에 기록되었습니다. ' +
      '문체부 「생성형 AI 저작권 안내서」는 인간의 창작적 개입과 생성 과정 기록을 저작권 등록·분쟁의 근거로 봅니다. ' +
      '<a href="./admin.html#/log" style="color:var(--brand);font-weight:700">이력 보기 →</a>';
  }

  /* ---------- 동화 뷰어 ---------- */
  function renderBook() {
    $('bookSec').classList.remove('hidden');
    $('bookMeta').textContent = story.pages.length + '쪽 · ' + story.name;
    var dots = $('dots'); dots.innerHTML = '';
    story.pages.forEach(function (_, i) { var d = document.createElement('span'); d.className = 'dot' + (i === curPage ? ' on' : ''); dots.appendChild(d); });
    drawPage();
  }
  function drawPage() {
    var p = story.pages[curPage];
    var el = $('page');
    el.className = 'page page-anim' + (p.cover ? ' cover' : '') + (p.tainted ? ' tainted' : '');
    el.innerHTML =
      '<div class="pimg"><img src="./' + p.img + '" alt="' + p.title + ' 삽화" /></div>' +
      '<div class="ptext"><div class="pt-title">' + p.title + '</div><div class="pt-body">' + p.text +
      (p.tainted ? '<div style="margin-top:12px;color:var(--danger);font-weight:700;font-size:13px">⚠ 이 쪽에 검증 실패 문장이 포함되어 있습니다.</div>' : '') + '</div></div>';
    Array.prototype.forEach.call($('dots').children, function (d, i) { d.className = 'dot' + (i === curPage ? ' on' : ''); });
    // reflow to restart animation
    void el.offsetWidth;
  }
  $('prevPg').onclick = function () { if (curPage > 0) { curPage--; drawPage(); } };
  $('nextPg').onclick = function () { if (curPage < story.pages.length - 1) { curPage++; drawPage(); } };

  /* ---------- 이미지 프리로드(PDF 렌더용) ---------- */
  var imgCache = {};
  function loadImg(src) {
    return new Promise(function (res) {
      if (imgCache[src]) return res(imgCache[src]);
      var im = new Image(); im.onload = function () { imgCache[src] = im; res(im); }; im.onerror = function () { res(null); };
      im.src = src;
    });
  }

  /* 캔버스 한글 자동 줄바꿈 */
  function wrapText(ctx, text, x, y, maxW, lh) {
    var words = text.split(''); var line = '', yy = y;
    for (var i = 0; i < words.length; i++) {
      var test = line + words[i];
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = words[i]; yy += lh; }
      else line = test;
    }
    if (line) ctx.fillText(line, x, yy);
    return yy + lh;
  }

  /* ---------- PDF 생성(실제) ---------- */
  async function makePDF() {
    if (!factOk) { toast('안전 게이트를 통과해야 발행할 수 있어요', 'warn'); return; }
    $('pdfBtn').disabled = true; $('pdfBtn').textContent = 'PDF 만드는 중…';
    var cv = $('pdfCanvas'), ctx = cv.getContext('2d');
    var W = cv.width, H = cv.height, pages = [];
    try {
      for (var i = 0; i < story.pages.length; i++) {
        var p = story.pages[i];
        var img = await loadImg('./' + p.img);
        /* 배경(종이) */
        ctx.fillStyle = '#f7f1e4'; ctx.fillRect(0, 0, W, H);
        if (p.cover) {
          if (img) drawCover(ctx, img, W, H);
          ctx.fillStyle = 'rgba(255,255,255,.86)'; ctx.fillRect(60, H - 300, W - 120, 220);
          ctx.fillStyle = '#3a2f22'; ctx.textAlign = 'center';
          ctx.font = '800 52px Pretendard, sans-serif'; ctx.fillText(p.title, W / 2, H - 200);
          ctx.font = '400 26px Pretendard, sans-serif'; ctx.fillStyle = '#6b6459';
          ctx.fillText('YEODAM 여담 · 여주 AI 역사동화', W / 2, H - 150);
          ctx.textAlign = 'left';
        } else {
          var ih = Math.round(H * 0.58);
          if (img) drawCoverRegion(ctx, img, 40, 40, W - 80, ih - 40);
          ctx.fillStyle = '#b8541f'; ctx.font = '800 40px Pretendard, sans-serif';
          ctx.fillText(p.title, 56, ih + 40);
          ctx.fillStyle = '#3a2f22'; ctx.font = '400 30px Pretendard, sans-serif';
          wrapText(ctx, p.text, 56, ih + 92, W - 112, 46);
          ctx.fillStyle = '#a99a86'; ctx.font = '400 20px Pretendard, sans-serif';
          ctx.fillText((i) + ' / ' + (story.pages.length - 1), W - 120, H - 40);
        }
        var jpeg = Y.dataURLToBytes(cv.toDataURL('image/jpeg', 0.85));
        pages.push({ jpeg: jpeg, w: W, h: H });
      }
      var blob = Y.jpegPagesToPDF(pages);
      Y.downloadBlob(blob, 'YEODAM_' + story.name + '_역사동화.pdf');
      toast('PDF 전자책이 생성되었습니다', 'ok');
    } catch (e) {
      toast('PDF 생성 중 오류: ' + e.message, 'bad');
    }
    $('pdfBtn').disabled = false; $('pdfBtn').textContent = '📖 PDF 전자책 내려받기';
  }
  /* object-fit: cover 방식으로 이미지 그리기 */
  function drawCover(ctx, img, W, H) { drawCoverRegion(ctx, img, 0, 0, W, H); }
  function drawCoverRegion(ctx, img, dx, dy, dw, dh) {
    var ir = img.width / img.height, dr = dw / dh, sx, sy, sw, sh;
    if (ir > dr) { sh = img.height; sw = sh * dr; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = sw / dr; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  /* ---------- 바인딩 ---------- */
  $('runBtn').onclick = function () { run(); };
  $('pdfBtn').onclick = function () { makePDF(); };
  renderSpots();
})();
