/* ARGILO 공통 UI — 헤더(aria-current)·푸터·플로팅 퀵메뉴·토스트·스크롤 리빌·텍스트 리빌·카운트업·틸트 카드·풀블리드 캐러셀·패럴랙스 */
(function (global) {
  'use strict';
  const A = global.Argilo;
  const esc = A.esc;
  const page = (location.pathname.split('/').pop() || 'index.html').replace(/\?.*$/, '');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const NAV = [
    { label: '아르길로', href: 'about.html', group: ['about.html', 'stone.html', 'display.html', 'solar.html'],
      sub: [['아르길로란', 'about.html', '점토계 연질 외장재의 정체'], ['아르길로 스톤', 'stone.html', '스톤·브릭·우드·라지 포맷'], ['아르길로 디스플레이', 'display.html', '소재 일체형 디스플레이 (소개)'], ['아르길로 쏠라', 'solar.html', '비유리 BIPV 외장 (상담)']] },
    { label: '시공사례', href: 'cases.html', group: ['cases.html', 'case.html'] },
    { label: '제품보기', href: 'products.html', group: ['products.html', 'product.html'] },
    { label: '기타자재', href: 'others.html', group: ['others.html', 'others-fields.html'],
      sub: [['소개', 'others.html', '부자재·마감재 취급 품목'], ['제품보기', 'products.html?line=other', '롤·포대·개 단위'], ['적용분야', 'others-fields.html', '분야별 자재 매칭'], ['시공사례', 'cases.html?line=other', '부자재가 쓰인 현장']] },
    { label: '셀프견적', href: 'estimate.html', group: ['estimate.html', 'quote.html'] },
    { label: '자료실', href: 'resources.html', group: ['resources.html', 'resource.html'] },
    { label: '고객센터', href: 'support.html', group: ['support.html', 'sample.html', 'done.html'] }
  ];

  function header() {
    const el = document.getElementById('site-header'); if (!el) return;
    const dark = el.dataset.theme === 'dark';
    el.className = 'hdr' + (dark ? ' hdr--dark' : '');
    el.innerHTML = `
      <div class="hdr__in">
        <a class="hdr__logo" href="index.html" aria-label="ARGILO 아르길로 홈"><span class="logo-mark" aria-hidden="true"></span>ARGILO</a>
        <nav class="hdr__nav" aria-label="주 메뉴">
          <ul>${NAV.map(n => `<li class="${n.sub ? 'has-sub' : ''}"><a href="${n.href}" ${n.group.includes(page) ? 'aria-current="page"' : ''}>${n.label}</a>${n.sub ? `<div class="sub"><ul>${n.sub.map(s => `<li><a href="${s[1]}"><strong>${s[0]}</strong><span>${s[2]}</span></a></li>`).join('')}</ul></div>` : ''}</li>`).join('')}</ul>
        </nav>
        <div class="hdr__cta">
          <a class="btn btn--ghost btn--sm" href="sample.html">샘플신청 <b class="cart-badge" data-cart hidden>0</b></a>
          <a class="btn btn--ink btn--sm" href="estimate.html">셀프견적</a>
          <a class="hdr__admin" href="admin.html" title="관리자 (데모)">관리자</a>
          <button class="hdr__burger" aria-label="메뉴 열기" aria-expanded="false"><span></span><span></span></button>
        </div>
      </div>
      <div class="hdr__mobile" hidden>
        <ul>${NAV.map(n => `<li><a href="${n.href}" ${n.group.includes(page) ? 'aria-current="page"' : ''}>${n.label}</a>${n.sub ? `<ul>${n.sub.map(s => `<li><a href="${s[1]}">${s[0]}</a></li>`).join('')}</ul>` : ''}</li>`).join('')}
        <li class="hdr__mobile-cta"><a class="btn btn--ink" href="estimate.html">셀프견적</a><a class="btn btn--ghost" href="sample.html">샘플신청</a><a class="btn btn--ghost" href="admin.html">관리자</a></li></ul>
      </div>`;
    const burger = el.querySelector('.hdr__burger'), mob = el.querySelector('.hdr__mobile');
    burger.addEventListener('click', () => { const open = mob.hidden; mob.hidden = !open; burger.setAttribute('aria-expanded', String(open)); burger.classList.toggle('is-open', open); document.body.classList.toggle('no-scroll', open); });
    let last = 0;
    addEventListener('scroll', () => { const y = scrollY; el.classList.toggle('is-scrolled', y > 24); el.classList.toggle('is-hidden', y > 320 && y > last && mob.hidden); last = y; }, { passive: true });
    updateCart();
  }

  function footer() {
    const el = document.getElementById('site-footer'); if (!el) return;
    const s = A.get('settings');
    el.className = 'ftr';
    el.innerHTML = `
      <div class="ftr__in">
        <div class="ftr__brand"><a class="hdr__logo" href="index.html">ARGILO</a><p>점토로 빚은 3mm의 돌.<br>휘고, 가볍고, 타지 않는 외장재.</p><p class="ftr__meta">${esc(s.company)} · ${esc(s.region)}<br>데모 — 모든 제품·사례·접수 데이터는 가상입니다.</p></div>
        <div class="ftr__cols">
          ${NAV.filter(n => n.sub).map(n => `<div><h4>${n.label}</h4><ul>${n.sub.map(x => `<li><a href="${x[1]}">${x[0]}</a></li>`).join('')}</ul></div>`).join('')}
          <div><h4>바로가기</h4><ul><li><a href="cases.html">시공사례</a></li><li><a href="products.html">제품보기</a></li><li><a href="estimate.html">셀프견적</a></li><li><a href="resources.html">자료실</a></li><li><a href="support.html">고객센터</a></li></ul></div>
          <div><h4>정책</h4><ul><li><a href="privacy.html">개인정보처리방침</a></li><li><a href="resources.html?cat=cert">시험성적서</a></li><li><a href="admin.html">관리자 (데모)</a></li></ul></div>
        </div>
      </div>
      <div class="ftr__bottom"><div class="ftr__in"><span>© 2026 ARGILO KOREA (가상) · 위시켓 제안용 데모</span><span>성능 수치는 국내 시험성적서와 제조사 발표를 구분해 표기합니다.</span></div></div>`;
  }

  function quick() {
    if (document.getElementById('quick-menu') || document.body.dataset.noQuick != null) return;
    const s = A.get('settings');
    const q = document.createElement('div'); q.id = 'quick-menu'; q.className = 'quick'; q.setAttribute('aria-label', '빠른 메뉴');
    q.innerHTML = `
      <a href="sample.html" class="quick__item" data-tip="샘플신청"><svg viewBox="0 0 24 24"><path d="M4 7h16v13H4zM4 7l2-3h12l2 3M9 11h6"/></svg><b class="cart-badge" data-cart hidden>0</b></a>
      <a href="support.html#consult" class="quick__item" data-tip="상담신청"><svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z M8 9h8M8 12h5"/></svg></a>
      <a href="https://pf.kakao.com/${esc(s.kakaoId)}/chat" target="_blank" rel="noopener" class="quick__item quick__item--kakao" data-tip="카톡문의"><svg viewBox="0 0 24 24"><path d="M12 4C7 4 3 7.2 3 11.1c0 2.5 1.7 4.7 4.2 6L6.5 20l3.6-2.3c.6.1 1.2.2 1.9.2 5 0 9-3.2 9-7.1S17 4 12 4z"/></svg></a>
      <button type="button" class="quick__item quick__top" data-tip="맨 위로" aria-label="맨 위로"><svg viewBox="0 0 24 24"><path d="M12 19V6M6 12l6-6 6 6"/></svg></button>`;
    document.body.appendChild(q);
    q.querySelector('.quick__top').addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
    addEventListener('scroll', () => q.classList.toggle('show-top', scrollY > 600), { passive: true });
    updateCart();
  }

  function updateCart() {
    const n = A.cart().length;
    document.querySelectorAll('[data-cart]').forEach(b => { b.textContent = n; b.hidden = n === 0; });
  }
  addEventListener('argilo:cart', updateCart);
  addEventListener('storage', e => { if (e.key === 'argilo.db.v1') { try { A.load(); } catch (x) {} global.dispatchEvent(new CustomEvent('argilo:change')); } });

  // 토스트
  function toast(msg, kind) {
    let box = document.getElementById('toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast' + (kind ? ' toast--' + kind : ''); t.innerHTML = msg; box.appendChild(t);
    requestAnimationFrame(() => t.classList.add('is-in'));
    setTimeout(() => { t.classList.remove('is-in'); setTimeout(() => t.remove(), 300); }, 3200);
  }

  // 스크롤 리빌 (뷰포트 진입분만) + stagger
  function reveal(root) {
    const els = (root || document).querySelectorAll('[data-reveal]:not(.is-in)');
    if (reduce) { els.forEach(e => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(e => io.observe(e));
    (root || document).querySelectorAll('[data-stagger]').forEach(g => Array.from(g.children).forEach((c, i) => { c.style.transitionDelay = (i * (Number(g.dataset.stagger) || 70)) + 'ms'; }));
  }

  // 텍스트 리빌 — 단어 단위 스크럽 (스크롤 위치에 따라 또렷해짐)
  function textScrub() {
    const els = document.querySelectorAll('[data-scrub]');
    els.forEach(el => {
      const words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map(w => `<span class="w">${esc(w)}</span>`).join(' ');
      el.classList.add('scrub');
    });
    if (!els.length) return;
    if (reduce) { els.forEach(el => el.querySelectorAll('.w').forEach(w => w.style.opacity = 1)); return; }
    const tick = () => {
      els.forEach(el => {
        const r = el.getBoundingClientRect(); const vh = innerHeight;
        const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.6)));
        const ws = el.querySelectorAll('.w'); const n = ws.length;
        ws.forEach((w, i) => { const t = Math.min(1, Math.max(0, (p * (n + 4) - i) / 4)); w.style.opacity = 0.18 + 0.82 * t; });
      });
    };
    let raf = 0; addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { tick(); raf = 0; }); }, { passive: true }); tick();
  }

  // 라인 마스크 리빌 — 히어로 제목
  function lines() {
    document.querySelectorAll('[data-lines]').forEach(el => {
      const html = el.innerHTML.split(/<br\s*\/?>/i);
      el.innerHTML = html.map((l, i) => `<span class="line"><span class="line__in" style="transition-delay:${i * 110 + 80}ms">${l}</span></span>`).join('');
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
    });
  }

  // 카운트업
  function countUp(root) {
    (root || document).querySelectorAll('[data-count]').forEach(el => {
      if (el.dataset.done) return;
      const run = () => {
        el.dataset.done = '1';
        const to = parseFloat(el.dataset.count), dec = Number(el.dataset.dec || 0), dur = reduce ? 0 : 1100, t0 = performance.now();
        const step = t => { const k = dur ? Math.min(1, (t - t0) / dur) : 1; const e = 1 - Math.pow(1 - k, 3); el.textContent = (to * e).toLocaleString('ko-KR', { minimumFractionDigits: dec, maximumFractionDigits: dec }); if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      };
      const io = new IntersectionObserver(en => { if (en[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.4 }); io.observe(el);
    });
  }

  // 틸트 카드 (데스크톱 포인터만) — rAF 스로틀, transform만 갱신
  function tilt(root) {
    if (reduce || !matchMedia('(pointer:fine)').matches) return;
    (root || document).querySelectorAll('[data-tilt]').forEach(card => {
      let raf = 0, rx = 0, ry = 0, px = 50, py = 50;
      const inner = card.querySelector('.tilt__in') || card;
      const apply = () => { inner.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`; card.style.setProperty('--px', px + '%'); card.style.setProperty('--py', py + '%'); raf = 0; };
      card.addEventListener('pointermove', e => { const r = card.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; ry = (x - 0.5) * 10; rx = (0.5 - y) * 8; px = x * 100; py = y * 100; if (!raf) raf = requestAnimationFrame(apply); });
      card.addEventListener('pointerenter', () => { inner.style.willChange = 'transform'; card.classList.add('is-hover'); });
      card.addEventListener('pointerleave', () => { rx = ry = 0; px = py = 50; apply(); inner.style.willChange = ''; card.classList.remove('is-hover'); });
    });
  }

  // 풀블리드 캐러셀 — 스냅·드래그·화살표·자동·키보드
  function carousel(el) {
    if (!el) return;
    const track = el.querySelector('.car__track'); const prev = el.querySelector('.car__prev'), next = el.querySelector('.car__next'); const dots = el.querySelector('.car__dots');
    const slides = Array.from(track.children); let i = 0, timer = 0;
    if (!slides.length || el.dataset.ready) return; el.dataset.ready = '1';
    const go = (n, user) => { i = (n + slides.length) % slides.length; const s = slides[i]; track.scrollTo({ left: s.offsetLeft - track.offsetLeft - (track.clientWidth - s.clientWidth) / 2, behavior: reduce ? 'auto' : 'smooth' }); mark(); if (user) restart(); };
    const mark = () => { slides.forEach((s, k) => s.classList.toggle('is-active', k === i)); if (dots) Array.from(dots.children).forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false')); };
    if (dots) { dots.innerHTML = slides.map((s, k) => `<button type="button" aria-label="${k + 1}번 슬라이드"></button>`).join(''); Array.from(dots.children).forEach((d, k) => d.addEventListener('click', () => go(k, true))); }
    prev && prev.addEventListener('click', () => go(i - 1, true)); next && next.addEventListener('click', () => go(i + 1, true));
    el.tabIndex = 0; el.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(i + 1, true); if (e.key === 'ArrowLeft') go(i - 1, true); });
    // 드래그
    let down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('pointerdown', e => { down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; track.classList.add('is-drag'); });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; track.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = false; track.classList.remove('is-drag'); // 가장 가까운 슬라이드
      const c = track.scrollLeft + track.clientWidth / 2; let best = 0, bd = 1e9; slides.forEach((s, k) => { const d = Math.abs(s.offsetLeft - track.offsetLeft + s.clientWidth / 2 - c); if (d < bd) { bd = d; best = k; } }); go(best, true); });
    track.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    const restart = () => { clearInterval(timer); if (!reduce && el.dataset.auto !== 'off') timer = setInterval(() => go(i + 1), Number(el.dataset.auto) || 4500); };
    el.addEventListener('pointerenter', () => clearInterval(timer)); el.addEventListener('pointerleave', restart);
    let sraf = 0; track.addEventListener('scroll', () => { if (sraf) return; sraf = requestAnimationFrame(() => { sraf = 0; const c = track.scrollLeft + track.clientWidth / 2; let best = 0, bd = 1e9; slides.forEach((s, k) => { const d = Math.abs(s.offsetLeft - track.offsetLeft + s.clientWidth / 2 - c); if (d < bd) { bd = d; best = k; } }); if (best !== i) { i = best; mark(); } }); }, { passive: true });
    mark(); restart();
  }

  // 패럴랙스 — transform만
  function parallax() {
    const els = document.querySelectorAll('[data-parallax]'); if (!els.length || reduce) return;
    let raf = 0;
    const tick = () => { els.forEach(el => { const r = el.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const k = Number(el.dataset.parallax) || 0.18; const y = (r.top + r.height / 2 - innerHeight / 2) * -k; el.style.transform = `translate3d(0,${y.toFixed(1)}px,0) scale(${1 + Math.abs(k) * 1.2})`; }); raf = 0; };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true }); tick();
  }

  // 마그네틱 버튼 (살짝)
  function magnetic() {
    if (reduce || !matchMedia('(pointer:fine)').matches) return;
    document.querySelectorAll('.btn--mag').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px,${(e.clientY - r.top - r.height / 2) * 0.28}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  // 이미지 로드 페이드
  function imgs(root) { (root || document).querySelectorAll('img[loading="lazy"]').forEach(im => { if (im.complete) im.classList.add('loaded'); else im.addEventListener('load', () => im.classList.add('loaded'), { once: true }); }); }

  function init(root) { reveal(root); countUp(root); tilt(root); imgs(root); }

  document.addEventListener('DOMContentLoaded', () => {
    header(); footer(); quick(); lines(); textScrub(); parallax(); magnetic(); init();
    document.querySelectorAll('[data-carousel]').forEach(carousel);
    document.body.classList.add('ready');
  });

  global.UI = { toast, reveal, countUp, tilt, carousel, init, imgs, updateCart, NAV, reduce };
})(window);
