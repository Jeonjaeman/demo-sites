/* MEDIQ — 규제 3모드 스위치·신뢰 스트립 2모드·마스크 리빌·패럴랙스·스크럽·판독 뷰어 canvas */
'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const fmt = n => n.toLocaleString('ko-KR');
  function toast(msg) {
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3400);
    setTimeout(() => el.remove(), 3800);
  }

  /* ── 규제 3모드 카피셋 (F1) ── */
  const MODES = {
    samd: {
      title: ['영상의학과의 판독 곁에,', '한 번 더 보는 <b>AI 의료기기</b>'],
      lead: '식약처 허가 절차를 밟는 <b>의료기기 소프트웨어(SaMD)</b>입니다. 병변 후보 검출과 판독 우선순위 제안으로 의료진의 판단을 보조합니다 — 진단의 주체는 언제나 의료진입니다.',
      note: '카피 규칙: 의료기기법 적용 — 허가 전 「진단」 표방 금지, 품목·허가번호 병기, 성능 수치는 근거 각주 필수',
    },
    clinic: {
      title: ['검사 결과를 기다리는 시간,', '더 <b>정확하고 짧게</b>'],
      lead: '의료기관이 운영하는 AI 판독 보조 서비스입니다. 의료법 제56조(의료광고 금지 유형)를 준수해 치료 효과 보장·경험담·비교 표현 없이, 검증된 사실만 안내합니다.',
      note: '카피 규칙: 의료법 56조 적용 — "반드시 효과" · 치료경험담 · 타 기관 비교 금지, 자체 홈페이지는 심의 대상 아님(금지 규정은 적용)',
    },
    wellness: {
      title: ['내 건강 기록을,', '읽기 쉬운 <b>언어로</b>'],
      lead: '검진 결과와 건강 기록을 이해하기 쉽게 정리하는 <b>비의료 웰니스 서비스</b>입니다. 질병의 진단·치료 목적이 아니며, 의학적 판단이 필요한 경우 의료진과 상담하세요.',
      note: '카피 규칙: 비의료 고지 필수 — 진단·치료·예방 표방 시 의료기기로 분류되어 허가 대상이 됨',
    },
  };
  let mode = 'samd';
  function renderMode() {
    const m = MODES[mode];
    $('#heroTitle').innerHTML = m.title.map((l, i) =>
      `<span class="ln"><span style="animation-delay:${.15 + i * .12}s">${l}</span></span>`).join('');
    $('#heroLead').innerHTML = m.lead;
    $('#regNote').textContent = '⚖ ' + m.note;
  }
  $$('#modeSwitch button').forEach(b => b.onclick = () => {
    mode = b.dataset.m;
    $$('#modeSwitch button').forEach(x => x.classList.toggle('on', x === b));
    renderMode();
    toast('규제 분기 전환 — 서비스 정체(G1)가 확정되면 한 모드로 고정합니다. 같은 레이아웃, 다른 적법 카피셋입니다.');
  });

  /* ── 신뢰 스트립 2모드 (F8) ── */
  const NUM_MODE = `
    <div class="stats">
      ${[['도입·검증 기관', 14, '곳', '자체 집계 · 2026.08 기준 · MOU 포함'],
         ['누적 분석', 182400, '건', '서비스 로그 집계 · 2026.07.31 기준'],
         ['피어리뷰 논문', 12, '편', 'PubMed 색인 기준 · 목록은 임상 근거 섹션'],
         ['판독 시간 단축', 27, '%', '3개 기관 전향 연구(가상) · 95% CI 21-33%']]
        .map(([l, n, u, s]) => `<div class="stat rv"><div class="n" data-count="${n}">0<small>${u}</small></div><div class="l">${l}</div><div class="src">※ ${s}</div></div>`).join('')}
    </div>`;
  const CERT_MODE = `
    <div class="certs">
      <div class="cert rv"><div class="k">MFDS · 식약처</div><div class="t">의료기기 제조 인증(예시 슬롯)</div><div class="d">품목명·등급·허가번호가 확정되면 이 슬롯에 정확히 표기합니다. 미허가 상태에서는 "허가 진행 중"으로만.</div></div>
      <div class="cert rv"><div class="k">ISO 13485</div><div class="t">의료기기 품질경영시스템</div><div class="d">인증 기관·유효기간 병기 (VUNO 문법 — 유효기간 없는 배지는 신뢰를 깎습니다)</div></div>
      <div class="cert rv"><div class="k">GOV R&D</div><div class="t">정부 연구과제 수행</div><div class="d">부처·전문기관·과제번호를 푸터 사사표기와 연동 — 과제 평가위원이 확인하는 지점입니다.</div></div>
      <div class="cert rv"><div class="k">VALIDATION</div><div class="t">다기관 검증 프로토콜 공개</div><div class="d">숫자가 쌓이기 전에는 검증 절차 자체를 투명하게 — 프로토콜 문서 링크 슬롯.</div></div>
    </div>`;
  function renderTrust(t) {
    $('#trustBody').innerHTML = t === 'num' ? NUM_MODE : CERT_MODE;
    reveal();
    if (t === 'num') $$('#trustBody [data-count]').forEach(countUp);
  }
  $$('#trustSeg button').forEach(b => b.onclick = () => {
    $$('#trustSeg button').forEach(x => x.classList.toggle('on', x === b));
    renderTrust(b.dataset.t);
    toast(b.dataset.t === 'num' ? '지표 보유 모드 — 전 수치에 출처 각주 강제' : '초기 모드 — 숫자가 없을 때도 같은 높이를 인증·절차로 채웁니다');
  });

  /* ── 카운트업 ── */
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function countUp(el) {
    const target = +el.dataset.count, unit = el.querySelector('small');
    const u = unit ? unit.outerHTML : '';
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / 1200);
      el.innerHTML = fmt(Math.round(target * easeOut(p))) + u;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ── 판독 뷰어 canvas (제품이 주인공 — F5) ── */
  function drawScan() {
    const cv = $('#scanCv'); if (!cv) return;
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const x = cv.getContext('2d'); x.scale(dpr, dpr);
    let t = 0;
    const lesions = [[.32, .42, 14], [.61, .3, 10], [.55, .66, 12]];
    function frame() {
      t += .016;
      x.clearRect(0, 0, w, h);
      x.fillStyle = '#0a1626'; x.fillRect(0, 0, w, h);
      // 폐야 실루엣 (타원 2개)
      x.save(); x.translate(w / 2, h / 2);
      for (const s of [-1, 1]) {
        x.beginPath(); x.ellipse(s * w * .17, 0, w * .14, h * .38, 0, 0, Math.PI * 2);
        x.strokeStyle = 'rgba(64,226,222,.35)'; x.lineWidth = 1.2; x.stroke();
        x.fillStyle = 'rgba(64,226,222,.05)'; x.fill();
      }
      x.restore();
      // 스캔 라인
      const sy = (Math.sin(t * .8) * .5 + .5) * h;
      x.fillStyle = 'rgba(0,201,234,.14)'; x.fillRect(0, sy - 1, w, 2);
      // 병변 마커 (펄스)
      lesions.forEach(([lx, ly, r], i) => {
        const pulse = 1 + Math.sin(t * 2 + i) * .15;
        x.beginPath(); x.arc(lx * w, ly * h, r * pulse, 0, Math.PI * 2);
        x.strokeStyle = 'rgba(255,194,5,.9)'; x.lineWidth = 1.5; x.stroke();
        x.beginPath(); x.arc(lx * w, ly * h, 2.5, 0, Math.PI * 2);
        x.fillStyle = '#ffc205'; x.fill();
      });
      // 그리드
      x.strokeStyle = 'rgba(255,255,255,.04)';
      for (let g = 0; g < w; g += 28) { x.beginPath(); x.moveTo(g, 0); x.lineTo(g, h); x.stroke(); }
      requestAnimationFrame(frame);
    }
    frame(); // 첫 프레임 즉시 도장 (백그라운드 탭·헤드리스 캡처 대응)
  }

  /* ── 패럴랙스 (히어로·밴드) + 헤더 ── */
  function onScroll() {
    const y = window.scrollY;
    $('#hdr').classList.toggle('solid', y > 60);
    const hb = $('#heroBg'); if (hb && y < window.innerHeight) hb.style.transform = `scale(1.04) translateY(${y * .16}px)`;
    const band = $('#band'), bb = $('#bandBg');
    if (band && bb) {
      const r = band.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        const p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
        bb.style.transform = `translateY(${(p - .5) * 90}px)`;
      }
    }
    // 텍스트 스크럽 (⑤)
    const sc = $('#scrub');
    if (sc) {
      const r = sc.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (window.innerHeight * .75 - r.top) / (r.height + 160)));
      const spans = sc.querySelectorAll('span');
      const lit = Math.floor(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle('lit', i <= lit));
    }
  }

  /* ── 스크럽 준비: 단어 분할 ── */
  function prepScrub() {
    const sc = $('#scrub'); if (!sc) return;
    sc.innerHTML = sc.textContent.split(' ').map(w => `<span>${w}</span>`).join(' ');
  }

  /* ── 리빌 ── */
  let io;
  function reveal() {
    if (!io) io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        e.target.querySelectorAll?.('[data-count]')?.forEach(el => { if (!el.dataset.done) { el.dataset.done = 1; countUp(el); } });
        if (e.target.dataset?.count && !e.target.dataset.done) { e.target.dataset.done = 1; countUp(e.target); }
        io.unobserve(e.target);
      }
    }), { threshold: .12 });
    $$('.rv:not(.in)').forEach(el => io.observe(el));
    $$('.p-alt [data-count]:not([data-done])').forEach(el => io.observe(el));
  }

  /* ── 디자인 근거 토글 ── */
  $('#noteToggle').onclick = () => {
    document.body.classList.toggle('notes');
    const on = document.body.classList.contains('notes');
    $('#noteToggle').classList.toggle('on', on);
    $('#noteToggle').textContent = on ? '✕ 근거 닫기' : '💡 디자인 근거 보기';
    if (on) toast('설계 근거 주석 — 각 섹션이 왜 이렇게 배치됐는지, 어떤 규제·실측이 근거인지 표시합니다 (검수 경험이 없는 발주자를 위한 장치)');
  };

  document.addEventListener('DOMContentLoaded', () => {
    renderMode(); renderTrust('num'); drawScan(); prepScrub(); reveal();
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  });
})();
