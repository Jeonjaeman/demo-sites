/* 키오스크 2 — 특장점 소개(탭) + 단일 질문 투표 + 실시간 결과 */
(() => {
  NX.ensureSeed();
  NX.fitStage('.stage');
  NX.lockKiosk();
  NX.fullscreenToggle(document.getElementById('btn-fs'));

  const $ = id => document.getElementById(id);
  const RESULT_RETURN_SEC = 10;
  const TAB_AUTO_MS = 8000; // 자동 탭 순환 (아무도 안 만질 때)

  let tabIdx = 0;
  let myPick = null;
  let cdTimer = null;
  let autoTimer = null;

  /* ---------- 특장점 탭 ---------- */
  function renderTabs() {
    const bar = $('tab-bar');
    bar.innerHTML = '';
    NX.K2_FEATURES.forEach((f, i) => {
      const b = document.createElement('button');
      b.className = 'tab-btn' + (i === tabIdx ? ' active' : '');
      b.innerHTML = '<span class="ti">' + f.icon + '</span>' + f.tag;
      b.addEventListener('click', () => { tabIdx = i; renderTabs(); restartAuto(); });
      bar.appendChild(b);
    });

    const f = NX.K2_FEATURES[tabIdx];
    const body = $('tab-body');
    body.innerHTML =
      '<div class="tb-text">' +
        '<div class="f-icon">' + f.icon + '</div>' +
        '<h3>' + f.title + '</h3>' +
        '<p>' + f.desc + '</p>' +
        '<div class="tab-nav">' +
        NX.K2_FEATURES.map((_, i) => '<span class="dot' + (i === tabIdx ? ' on' : '') + '"></span>').join('') +
        '</div>' +
      '</div>' +
      '<img class="tb-img" src="' + (f.img || 'assets/img/nexa-one.png') + '" alt="' + f.title + '" draggable="false">';
    body.classList.remove('fade-in');
    void body.offsetWidth;
    body.classList.add('fade-in');
  }

  function restartAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      tabIdx = (tabIdx + 1) % NX.K2_FEATURES.length;
      renderTabs();
    }, TAB_AUTO_MS);
  }

  /* 터치 슬라이드(스와이프)로 탭 전환 */
  let swipeX = null;
  $('tab-body').addEventListener('pointerdown', e => { swipeX = e.clientX; });
  $('tab-body').addEventListener('pointerup', e => {
    if (swipeX == null) return;
    const dx = e.clientX - swipeX;
    if (Math.abs(dx) > 60) {
      tabIdx = (tabIdx + (dx < 0 ? 1 : -1) + NX.K2_FEATURES.length) % NX.K2_FEATURES.length;
      renderTabs();
      restartAuto();
    }
    swipeX = null;
  });

  /* ---------- 투표 ---------- */
  function renderVote() {
    $('vote-title').textContent = NX.K2Q.title;
    const list = $('vote-list');
    list.innerHTML = '';
    NX.K2Q.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'vote-btn';
      b.innerHTML = '<span class="vi">' + NX.K2_FEATURES[i].icon + '</span><span>' + opt + '</span>';
      b.addEventListener('click', () => submit(opt));
      list.appendChild(b);
    });
  }

  function submit(opt) {
    myPick = opt;
    NX.add({ kiosk: 'K2', pick: opt });
    showResults();
  }

  /* ---------- 실시간 결과 ---------- */
  function renderResults() {
    const counts = NX.countK2();
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    const list = $('result-list');
    list.innerHTML = '';
    NX.K2Q.options.forEach((opt, i) => {
      const pct = Math.round(counts[i] / total * 100);
      const item = document.createElement('div');
      item.className = 'result-item' + (opt === myPick ? ' mine' : '');
      item.innerHTML =
        '<div class="result-head">' +
          '<span class="name">' + NX.K2_FEATURES[i].icon + ' ' + opt + '</span>' +
          '<span><span class="pct">' + pct + '%</span><span class="cnt">' + counts[i] + '표</span></span>' +
        '</div>' +
        '<div class="result-track"><div class="result-fill" data-w="' + pct + '"></div></div>';
      list.appendChild(item);
    });
    requestAnimationFrame(() => {
      list.querySelectorAll('.result-fill').forEach(el => { el.style.width = el.dataset.w + '%'; });
    });
  }

  function showResults() {
    $('vote-card').classList.add('hidden');
    $('result-card').classList.remove('hidden');
    renderResults();

    let remain = RESULT_RETURN_SEC;
    $('cd').textContent = remain;
    clearInterval(cdTimer);
    cdTimer = setInterval(() => {
      remain--;
      $('cd').textContent = remain;
      if (remain <= 0) backToVote();
    }, 1000);
  }

  function backToVote() {
    clearInterval(cdTimer);
    myPick = null;
    $('result-card').classList.add('hidden');
    $('vote-card').classList.remove('hidden');
  }

  /* 다른 키오스크 응답이 들어와도 결과 화면이면 실시간 갱신 */
  NX.onChange(() => {
    if (!$('result-card').classList.contains('hidden')) renderResults();
  });

  /* 이미지 프리로드 (탭 전환 깜빡임 방지) */
  NX.K2_FEATURES.forEach(f => { if (f.img) { const im = new Image(); im.src = f.img; } });

  renderTabs();
  renderVote();
  restartAuto();
})();
