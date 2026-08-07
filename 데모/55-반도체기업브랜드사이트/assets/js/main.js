/* REONIX — 메인 인터랙션 (레퍼런스 실측 패턴의 자체 구현 · 외부 라이브러리 없음) */
(() => {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 토스트 (메뉴 = 이동 없음 알림) ---------- */
  let toastEl;
  const toast = msg => {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('on'), 2400);
  };
  const navNotice = name => toast(`「${name}」 페이지 이동은 실제 작업 시 반영됩니다 (데모)`);

  /* ---------- 메뉴 데이터 (가상 브랜드) ---------- */
  const MENU = [
    { title: 'About Us', slogan: '나노미터의 정밀함으로 산업의 내일을 만드는 반도체 제조 파트너',
      children: [{ t: '기업개요' }, { t: '비전 & 미션' }, { t: '연혁' }, { t: '품질인증' }, { t: '협력사' }, { t: '찾아오시는 길' }] },
    { title: 'Products', slogan: '웨이퍼에서 모듈까지, 정확성을 위해 설계된 제품',
      children: [
        { t: 'Wafer Solutions', children: [{ t: '8인치 웨이퍼 가공' }, { t: '12인치 웨이퍼 가공' }, { t: '박막 공정' }] },
        { t: 'Power Devices', children: [{ t: 'MOSFET' }, { t: 'IGBT 모듈' }, { t: 'SiC 전력 소자' }] },
        { t: 'Sensor ICs', children: [{ t: '전류 센서 IC' }, { t: '모션 센서 IC' }, { t: '환경 센서 IC' }] },
        { t: 'Package & Test', children: [{ t: 'BGA 패키징' }, { t: 'QFN 패키징' }, { t: '전수 테스트' }] },
        { t: 'Custom Modules', children: [{ t: '커스텀 모듈 설계' }, { t: '턴키 양산' }] }
      ] },
    { title: 'Industries', slogan: '반도체 기술의 정점, 산업 현장에 최적화된 솔루션',
      children: [
        { t: 'Mobility', children: [{ t: '전기차' }, { t: '자율주행' }, { t: '차량 전장' }] },
        { t: 'AI & Data Center', children: [{ t: '서버 전력' }, { t: '연산 가속' }] },
        { t: 'Consumer & IoT', children: [{ t: '스마트 디바이스' }, { t: '웨어러블' }] }
      ] },
    { title: 'Service', slogan: '공정 하나를 맡겨도, 라인 전체를 맡겨도',
      children: [
        { t: 'Foundry Service', children: [{ t: '수탁 제조' }, { t: '공정 관리' }, { t: '수율 리포트' }] },
        { t: 'Package & Test', children: [{ t: '패키징 서비스' }, { t: '번인 · 전수 테스트' }] },
        { t: 'Engineering Support', children: [{ t: '양산 이관' }, { t: '공정 최적화' }, { t: '불량 분석' }] }
      ] },
    { title: 'R&D', slogan: '현장에 적용되는 실질적 혁신을 만듭니다',
      children: [{ t: '연구소 소개' }, { t: '특허' }, { t: '개발실적' }] },
    { title: 'Resources', slogan: '제품 스펙과 적용 산업까지, 한 권으로',
      children: [{ t: '제품 카탈로그' }, { t: '제품문의' }, { t: '공지사항' }] },
    { title: 'Careers', slogan: '나노미터의 세계를 함께 넓혀갈 동료를 찾습니다',
      children: [{ t: '채용공고' }] }
  ];

  /* ---------- 헤더 depth1 렌더 ---------- */
  const depth1List = $('#depth1List');
  depth1List.innerHTML = MENU.map((m, i) =>
    `<li data-idx="${i}"><a href="#" data-nav="${m.title}">${m.title}</a></li>`).join('');

  /* ---------- 서브 패널 (호버 메가 메뉴) ---------- */
  const header = $('#header'), head = $('#head'), subPanel = $('#subPanel');
  const sloganTitle = $('#sloganTitle'), sloganText = $('#sloganText');
  const depth2List = $('#depth2List'), depth3Area = $('#depth3Area');

  const renderDepth3 = children => {
    depth3Area.innerHTML = children && children.length
      ? `<ul class="subDepth3List">${children.map(c => `<li><a href="#" data-nav="${c.t}">${c.t}</a></li>`).join('')}</ul>` : '';
  };
  const openPanel = idx => {
    const m = MENU[idx]; if (!m) return;
    header.classList.add('panelOpen');
    sloganTitle.textContent = m.title;
    sloganText.textContent = m.slogan;
    depth2List.innerHTML = m.children.map((c, i) =>
      `<li class="${c.children ? 'hasDepth3' : ''}" data-i="${i}"><a href="#" data-nav="${c.t}">${c.t}</a></li>`).join('');
    renderDepth3(null);
    subPanel.style.height = subPanel.querySelector('.subPanelInner').scrollHeight + 'px';
  };
  const closePanel = () => {
    header.classList.remove('panelOpen');
    subPanel.style.height = '0px';
  };
  $$('#depth1List > li').forEach(li => li.addEventListener('mouseenter', () => openPanel(+li.dataset.idx)));
  head.addEventListener('mouseleave', closePanel);
  depth2List.addEventListener('mouseover', e => {
    const li = e.target.closest('li[data-i]'); if (!li) return;
    const openIdx = MENU.findIndex(m => m.title === sloganTitle.textContent);
    const child = MENU[openIdx]?.children[+li.dataset.i];
    $$('#depth2List li').forEach(x => x.classList.toggle('active', x === li));
    renderDepth3(child?.children);
    subPanel.style.height = subPanel.querySelector('.subPanelInner').scrollHeight + 'px';
  });

  /* ---------- 전체메뉴 오버레이 ---------- */
  const allMenu = $('#allMenu');
  $('#allMenuGrid').innerHTML = MENU.map(m => `
    <div class="d1"><a href="#" data-nav="${m.title}">${m.title}</a>
      <div class="d2">${m.children.map(c => `<a href="#" data-nav="${c.t}">${c.t}</a>`).join('')}</div>
    </div>`).join('');
  $('#allMenuOpen').addEventListener('click', () => { closePanel(); allMenu.classList.add('active'); document.body.style.overflow = 'hidden'; });
  $('#allMenuClose').addEventListener('click', () => { allMenu.classList.remove('active'); document.body.style.overflow = ''; });

  /* ---------- 모든 내비 링크 = 이동 없이 알림 ---------- */
  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-nav]');
    if (nav) { e.preventDefault(); navNotice(nav.dataset.nav); }
  });

  /* ---------- 헤더 스크롤 상태 ---------- */
  const onScroll = () => header.classList.toggle('scroll', scrollY > 100);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- 리빌 (.ani / .st-item / sec7 워드 → .inView) ---------- */
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('inView'); io.unobserve(en.target); }
  }), { threshold: .18, rootMargin: '0px 0px -8% 0px' });
  $$('.ani, .st-item, .sec1Title, .sec7 .container2').forEach(el => io.observe(el));

  /* ---------- sec2 핀 스크럽 (실측: 27vw·510/290 → 100vw/100vh 확장) ---------- */
  const sec2 = $('#sec2'), media = $('#sec2Media'), mediaText = $('#sec2Text');
  const isMobile = () => matchMedia('(max-width: 812px)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const easeInOut = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const AR = 290 / 510; // 실측 종횡비

  let scrubRaf = 0;
  const scrub = () => {
    scrubRaf = 0;
    const rect = sec2.getBoundingClientRect();
    const total = sec2.offsetHeight - innerHeight;
    const p = clamp01(-rect.top / total);
    const grow = easeInOut(clamp01(p / .62));
    const textP = clamp01((p - .58) / .2);
    const iw = innerWidth, ih = innerHeight;
    if (p === 0) {
      /* 초기 상태는 CSS(27vw · aspect 510/290)로 복원 */
      media.style.cssText = '';
    } else if (isMobile()) {
      const w = lerp(iw * .94, iw, grow);
      const h = lerp(iw * .94 * AR, ih, grow);
      media.style.width = w + 'px';
      media.style.height = h + 'px';
      media.style.aspectRatio = 'auto';
      media.style.left = '50%';
      media.style.top = 'auto';
      media.style.bottom = lerp(.06 * ih, 0, grow) + 'px';
      media.style.transform = 'translateX(-50%)';
      media.style.borderRadius = lerp(20, 0, grow) + 'px';
    } else {
      const w = lerp(iw * .27, iw, grow);
      const h = lerp(iw * .27 * AR, ih, grow);
      media.style.width = w + 'px';
      media.style.height = h + 'px';
      media.style.aspectRatio = 'auto';
      media.style.top = '50%';
      media.style.bottom = 'auto';
      media.style.left = lerp(94, 50, grow) + '%';
      media.style.transform = `translate(${lerp(-100, -50, grow)}%, -50%)`;
      media.style.borderRadius = lerp(20, 0, grow) + 'px';
    }
    mediaText.classList.toggle('show', textP > 0);
    mediaText.style.opacity = textP;
    header.classList.toggle('hidden', p > .05 && p < .98);
  };
  /* 백그라운드 탭(rAF 정지)에서도 위치가 어긋나지 않게 동기 폴백 */
  const queueScrub = () => {
    if (document.hidden) { scrub(); return; }
    if (!scrubRaf) scrubRaf = requestAnimationFrame(scrub);
  };
  if (!reduced) {
    addEventListener('scroll', queueScrub, { passive: true });
    addEventListener('resize', queueScrub);
    scrub();
  } else {
    media.style.cssText = 'position:relative;width:100%;left:0;top:0;transform:none;border-radius:0;height:60vh;aspect-ratio:auto';
    mediaText.classList.add('show'); mediaText.style.opacity = 1;
  }

  /* ---------- sec5 서비스 카드 활성 스왑 (실측: active=흰 배경+scale1.05+마스크 리빌) ---------- */
  const svcItems = $$('#servicesList .listItem');
  const svcBgs = $$('.sec5 .servicesBg');
  svcItems.forEach((li, i) => {
    const act = () => {
      svcItems.forEach(x => x.classList.toggle('active', x === li));
      svcBgs.forEach((bg, bi) => bg.classList.toggle('active', bi === i));
    };
    li.addEventListener('mouseenter', act);
    li.addEventListener('click', act);
  });

  /* ---------- sec4 모바일: 탭으로 open 토글 ---------- */
  $$('#productsList .listItem').forEach(li => {
    li.addEventListener('click', e => {
      if (!isMobile()) return;
      if (!li.classList.contains('open')) {
        e.preventDefault(); e.stopPropagation();
        $$('#productsList .listItem').forEach(x => x.classList.remove('open'));
        li.classList.add('open');
      }
    }, true);
  });

  /* ---------- 뷰포트 밖 영상 정지 (성능) ---------- */
  const vio = new IntersectionObserver(es => es.forEach(en => {
    const v = en.target;
    if (en.isIntersecting) { v.play?.().catch(() => {}); } else { v.pause?.(); }
  }), { threshold: .05 });
  $$('video').forEach(v => vio.observe(v));
})();
