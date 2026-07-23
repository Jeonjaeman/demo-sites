/* 키오스크 1 — 일반 설문형 (4문항 순차) */
(() => {
  NX.ensureSeed();
  NX.fitStage('.stage');
  NX.lockKiosk();
  NX.fullscreenToggle(document.getElementById('btn-fs'));

  const $ = id => document.getElementById(id);
  const scrAttract = $('scr-attract');
  const scrSurvey = $('scr-survey');
  const scrDone = $('scr-done');

  const DONE_RETURN_SEC = 7;   // 완료 후 자동 복귀
  const IDLE_LIMIT_MS = 60000; // 설문 중 무응답 60초 → 초기화

  let step = 0;
  let answers = [null, null, null, null];
  let cdTimer = null;
  let idleTimer = null;

  function show(el) {
    [scrAttract, scrSurvey, scrDone].forEach(s => s.classList.add('hidden'));
    el.classList.remove('hidden');
    el.classList.remove('fade-in');
    void el.offsetWidth;
    el.classList.add('fade-in');
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    if (!scrSurvey.classList.contains('hidden'))
      idleTimer = setTimeout(goHome, IDLE_LIMIT_MS);
  }
  document.addEventListener('pointerdown', resetIdle);

  function goHome() {
    clearInterval(cdTimer);
    clearTimeout(idleTimer);
    step = 0;
    answers = [null, null, null, null];
    show(scrAttract);
  }

  function renderStep() {
    const q = NX.K1Q[step];
    $('progress-label').textContent = (step + 1) + ' / ' + NX.K1Q.length;
    $('progress-fill').style.width = ((step + 1) / NX.K1Q.length * 100) + '%';
    $('q-title').innerHTML = '<span class="qno">Q' + (step + 1) + '.</span>' + q.title;

    const grid = $('opt-grid');
    grid.innerHTML = '';
    q.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'opt-btn' + (answers[step] === opt ? ' selected' : '');
      b.innerHTML = '<span class="oi">' + q.icons[i] + '</span><span>' + opt + '</span>';
      b.addEventListener('click', () => {
        answers[step] = opt;
        grid.querySelectorAll('.opt-btn').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        $('btn-next').disabled = false;
      });
      grid.appendChild(b);
    });

    $('btn-prev').style.visibility = step === 0 ? 'hidden' : 'visible';
    $('btn-next').disabled = !answers[step];
    $('btn-next').textContent = step === NX.K1Q.length - 1 ? '제출하기 ✓' : '다음 →';
    scrSurvey.classList.remove('fade-in');
    void scrSurvey.offsetWidth;
    scrSurvey.classList.add('fade-in');
  }

  const modal = $('consent-modal');

  scrAttract.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });

  $('btn-consent-cancel').addEventListener('click', e => {
    e.stopPropagation();
    modal.classList.add('hidden');
  });

  $('btn-consent-ok').addEventListener('click', e => {
    e.stopPropagation();
    modal.classList.add('hidden');
    show(scrSurvey);
    renderStep();
    resetIdle();
  });

  $('btn-prev').addEventListener('click', () => {
    if (step > 0) { step--; renderStep(); }
  });

  $('btn-next').addEventListener('click', () => {
    if (!answers[step]) return;
    if (step < NX.K1Q.length - 1) {
      step++;
      renderStep();
      return;
    }
    // 제출
    NX.add({ kiosk: 'K1', answers: answers.slice() });
    clearTimeout(idleTimer);
    show(scrDone);
    let remain = DONE_RETURN_SEC;
    $('cd').textContent = remain;
    cdTimer = setInterval(() => {
      remain--;
      $('cd').textContent = remain;
      if (remain <= 0) goHome();
    }, 1000);
  });
})();
