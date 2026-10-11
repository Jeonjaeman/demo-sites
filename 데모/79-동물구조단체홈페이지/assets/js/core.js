/* 홈워드 HOMEWARD 데모 — 공통 동작
   저장소(localStorage · 공개/관리자 공유) · 헤더/푸터/플로팅 · 영문 변환(용어집 제외) · 리빌 · 카운트업 · 토스트 · 드로어 */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const D = window.HW;

  /* ── 저장소: 시드 버전이 바뀌면 초기화. 관리자에서 바꾼 값이 공개 사이트에 그대로 반영된다 ── */
  const SEED_VER = '2026-10-11.4';
  const PREFIX = 'hw79:';
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(PREFIX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) { } },
    del(k) { try { localStorage.removeItem(PREFIX + k); } catch (e) { } }
  };
  if (LS.get('ver') !== SEED_VER) {
    ['animals', 'posts', 'inbox', 'glossary', 'users', 'settings', 'redirects', 'log'].forEach(k => LS.del(k));
    LS.set('ver', SEED_VER);
  }
  const clone = o => JSON.parse(JSON.stringify(o));
  const store = {
    animals() { return LS.get('animals', null) || clone(D.ANIMALS); },
    posts() { return LS.get('posts', null) || clone(D.POSTS); },
    inbox() { return LS.get('inbox', null) || clone(D.INBOX); },
    glossary() { return LS.get('glossary', null) || clone(D.GLOSSARY); },
    users() { return LS.get('users', null) || clone(D.USERS); },
    settings() { return Object.assign(clone(D.SETTINGS), LS.get('settings', {}) || {}); },
    redirects() { return LS.get('redirects', null) || clone(D.REDIRECTS); },
    log() { return LS.get('log', []) || []; },
    save(k, v) { LS.set(k, v); },
    reset() { ['animals', 'posts', 'inbox', 'glossary', 'users', 'settings', 'redirects', 'log', 'role', 'lang', 'photos'].forEach(k => LS.del(k)); },
    photos() { return LS.get('photos', {}) || {}; } // 관리자에서 올린 사진(dataURL) — id → [dataURL]
  };

  /* ── 날짜·나이·포맷 ── */
  const today = () => D.TODAY;
  function ageText(birth) {
    if (!birth) return '나이 미상';
    const [y, m] = birth.split('-').map(Number);
    const [ty, tm] = today().split('-').map(Number);
    const months = (ty - y) * 12 + (tm - m);
    if (months < 12) return `${Math.max(1, months)}개월`;
    return `약 ${Math.floor(months / 12)}세`;
  }
  function ageTextEn(birth) {
    if (!birth) return 'Age unknown';
    const [y, m] = birth.split('-').map(Number);
    const [ty, tm] = today().split('-').map(Number);
    const months = (ty - y) * 12 + (tm - m);
    if (months < 12) return `${Math.max(1, months)} months`;
    const yrs = Math.floor(months / 12);
    return `about ${yrs} year${yrs > 1 ? 's' : ''}`;
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = s => s ? s.replace(/-/g, '.') : '';
  const qs = k => new URLSearchParams(location.search).get(k);
  const fmtNum = n => Number(n).toLocaleString('ko-KR');

  /* ── 언어: ko | en. 영문 변환 버튼(RFP 7쪽) — 용어집 단어는 translate="no"로 제외 ── */
  const lang = () => LS.get('lang', 'ko');
  const isEn = () => lang() === 'en';
  // 콘텐츠 번역: EN 모드면 data-en.js의 번역문(실제 구축에서는 번역 API 결과)을, 없으면 원문
  const tr = (obj, field) => { if (isEn()) { const e = (D.EN_CONTENT || {})[obj.id]; if (e && e[field]) return e[field]; if (obj[field + '_en']) return obj[field + '_en']; } return obj[field]; };
  const L = (group, key) => {
    const ko = (D.LABELS[group] || {})[key] || key;
    if (!isEn()) return ko;
    return D.EN.ui[ko] || ko;
  };
  const T = ko => isEn() ? (D.EN.ui[ko] || ko) : ko;

  /* 개체·단체명은 용어집: 어느 언어에서도 번역하지 않는다 */
  const glossary = () => store.glossary();
  function nameSpan(name) {
    const inGl = glossary().includes(name);
    return `<span class="gl${inGl ? '' : ' gl-off'}" translate="no" lang="ko" title="${inGl ? '용어집: 번역 제외' : ''}">${esc(name)}</span>`;
  }

  /* ── 이미지 경로: 관리자에서 올린 사진(dataURL) 우선, 없으면 정적 WebP, 없으면 플레이스홀더 ── */
  const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 4"><rect width="3" height="4" fill="#efe9dc"/><circle cx="1.5" cy="1.7" r=".55" fill="#d8cfbd"/><path d="M.6 3.4c.3-.9.7-1.2.9-1.2s.5.4.6.4.3-.4.6-.4.6.3.9 1.2z" fill="#d8cfbd"/></svg>');
  // -sm 썸네일은 개체 사진·히어로에만 있다. 섹션 이미지는 원본 한 장뿐.
  const SM_OK = /^(bori|haneul|gamja|dubu|gureum|bamtol|choco|nabi|meokmul|baekseol|danggeun|boksun|hodu)-\d+$|^(hero|mission)-\d+$/;
  function img(id, variant) {
    if (!id) return PLACEHOLDER;
    const up = store.photos()[id];
    if (up) return up;
    if (variant && !SM_OK.test(id)) variant = '';
    return `assets/img/${id}${variant ? '-' + variant : ''}.webp`;
  }
  function photoOf(a, i, variant) {
    const p = (a.photos || [])[i || 0];
    return img(p, variant);
  }

  /* ── 개체 조회 규칙: 공개 사이트는 공개 + 보호중만. 사망·숨김·임시저장은 어떤 경로로도 노출하지 않는다 ── */
  function publicAnimals() { return store.animals().filter(a => a.pub === 'public' && a.care === 'passed' ? false : (a.pub === 'public')); }
  function animalById(id) { return store.animals().find(a => a.id === id) || null; }
  function isVisible(a) { return !!a && a.pub === 'public' && a.care !== 'passed'; }
  function publicPosts() { return store.posts().filter(p => p.pub === 'public').sort((a, b) => b.date.localeCompare(a.date)); }

  function badge(a) {
    if (a.care === 'passed') return `<span class="badge badge-gray">${T('사망')}</span>`;
    if (a.adopt === 'done') return `<span class="badge badge-done">${T('입양 완료')}</span>`;
    if (a.adopt === 'review') return `<span class="badge badge-review">${T('심사 중')}</span>`;
    if (a.foster === 'active') return `<span class="badge badge-foster">${T('임보 중')}</span>`;
    return `<span class="badge badge-open">${T('모집 중')}</span>`;
  }

  /* ── 공통 UI: 헤더·푸터·플로팅·안내 바 ── */
  const NAV = [
    ['about', '소개', 'about.html'], ['activities', '활동', 'activities.html'], ['adopt', '입양&임시보호', 'adopt.html'],
    ['volunteer', '봉사', 'volunteer.html'], ['donate', '후원', 'donate.html'], ['news', '소식·문의', 'news.html']
  ];
  function renderHeader(active) {
    const en = isEn();
    const links = NAV.map(([k, ko, href]) => `<a href="${href}"${active === k ? ' aria-current="page"' : ''}>${en ? D.EN.nav[k] : ko}</a>`).join('');
    const dlinks = NAV.map(([k, ko, href]) => `<a href="${href}"${active === k ? ' aria-current="page"' : ''}>${en ? D.EN.nav[k] : ko}</a>`).join('');
    const bar = en ? `<div class="mt-bar" role="status"><span>${T('자동 번역된 페이지입니다. 동물 이름과 단체명은 번역하지 않습니다.')}</span><button type="button" class="mt-gl" data-act="gl">Show glossary</button><button type="button" class="mt-back" data-act="ko">${T('한국어로 보기')}</button></div>` : '';
    return `${bar}<header class="header"><div class="header-in">
      <a class="logo" href="index.html" aria-label="홈워드 메인으로"><span class="logo-mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 3 2.5 11h2.6v8h5.2v-5h3.4v5h5.2v-8h2.6z"/></svg></span><span class="logo-txt" translate="no">홈워드<small>HOMEWARD</small></span></a>
      <nav class="gnb" aria-label="주요 메뉴">${links}</nav>
      <div class="header-tools">
        <button type="button" class="lang-btn" data-act="lang" aria-pressed="${en}">${en ? '한국어' : 'EN'}<span class="sr">${T('영문 변환')}</span></button>
        <a class="btn btn-primary header-cta" href="donate.html">${T('후원하기')}</a>
        <button type="button" class="menu-btn" aria-label="메뉴 열기" aria-expanded="false"><span></span><span></span><span></span></button>
      </div></div></header>
      <div class="drawer" aria-hidden="true"><div class="drawer-bg"></div><div class="drawer-panel" role="dialog" aria-label="메뉴"><button type="button" class="drawer-close" aria-label="닫기">×</button>${dlinks}<a href="donate.html" class="btn btn-primary" style="margin-top:12px">${T('후원하기')}</a><a href="admin.html" class="drawer-admin">관리자 (데모)</a></div></div>`;
  }
  function renderFooter() {
    const en = isEn();
    return `<footer class="footer"><div class="shell">
      <div class="footer-grid">
        <div class="footer-brand"><div class="logo-txt" translate="no">홈워드<small>HOMEWARD</small></div>
          <p>${en ? 'A non-profit animal rescue that takes responsibility from rescue and treatment to adoption.' : '위기와 학대 상황의 동물을 구조해 치료와 입양까지 책임지는 비영리 동물구조단체입니다.'}</p>
          <p class="footer-meta">${en ? 'Non-profit organization · Registration No. 000-00-00000 (fictional)' : '비영리 단체 · 고유번호 000-00-00000 (가상)'}<br>${en ? 'Yongin Shelter, Gyeonggi (fictional address)' : '경기도 용인시 ○○면 ○○로 00 홈워드 보호센터 (가상 주소)'}<br>hello@homeward.example</p></div>
        <div><h4>${en ? 'Take part' : '함께하기'}</h4><a href="adopt.html">${T('입양하기')}</a><a href="adopt-guide.html">${en ? 'Fostering' : '임시보호'}</a><a href="volunteer.html">${en ? 'Volunteer' : '봉사'}</a><a href="donate.html">${T('후원하기')}</a></div>
        <div><h4>${en ? 'About' : '단체'}</h4><a href="about.html">${en ? 'Mission' : '미션·비전'}</a><a href="activities.html">${en ? 'Rescue news' : '구조 소식'}</a><a href="news.html">${en ? 'Notices' : '공지'}</a><a href="news.html#report">${en ? 'Financial report' : '후원금 사용 내역'}</a><a href="https://www.hometax.go.kr" target="_blank" rel="noopener" title="공익법인 결산서류 공시">${en ? 'Public filings (NTS)' : '기부금 모금·활용 명세 공시 ↗'}</a><a href="https://www.acrc.go.kr" target="_blank" rel="noopener" title="공익위반 신고">${en ? 'Report misconduct' : '공익위반 신고 ↗'}</a></div>
        <div><h4>${en ? 'Newsletter' : '뉴스레터'}</h4><p class="small">${en ? 'Monthly: who found a home, who just arrived.' : '매달 가족을 만난 아이들과 새로 온 아이들 소식을 보내 드려요.'}</p><form class="nl-form" data-form="newsletter"><input type="email" placeholder="email@example.com" aria-label="이메일" value="demo@example.com"><button class="btn btn-dark" type="submit">${en ? 'Subscribe' : '구독'}</button></form>
          <div class="sns"><a href="#" aria-label="Instagram">IG</a><a href="#" aria-label="YouTube">YT</a><a href="#" aria-label="Facebook">FB</a></div></div>
      </div>
      <div class="footer-bar"><span>© 2026 HOMEWARD. ${en ? 'Proposal demo — all data is fictional.' : '제안용 데모 — 모든 데이터는 가상입니다.'}</span><a href="admin.html">${en ? 'Admin (demo)' : '관리자 (데모)'}</a></div>
    </div></footer>
    <div class="fab" aria-label="바로가기"><a href="adopt.html" class="fab-adopt">${T('입양하기')}</a><a href="donate.html" class="fab-donate">${T('후원하기')}</a><a href="news.html#contact" class="fab-contact">${T('문의하기')}</a></div>`;
  }
  function mountChrome(active) {
    const h = $('#site-header'), f = $('#site-footer');
    if (h) h.innerHTML = renderHeader(active);
    if (f) f.innerHTML = renderFooter();
    document.documentElement.lang = isEn() ? 'en' : 'ko';
    document.body.classList.toggle('is-en', isEn());
    // 정적 문구: data-en 속성이 있으면 EN 모드에서 교체(원문은 data-ko에 보관)
    $$('[data-en]').forEach(el => {
      if (!el.dataset.ko) el.dataset.ko = el.innerHTML;
      el.innerHTML = isEn() ? el.dataset.en : el.dataset.ko;
    });
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'lang') { LS.set('lang', isEn() ? 'ko' : 'en'); location.reload(); }
      if (b.dataset.act === 'ko') { LS.set('lang', 'ko'); location.reload(); }
      if (b.dataset.act === 'gl') { document.body.classList.toggle('show-gl'); toast(document.body.classList.contains('show-gl') ? 'Glossary terms highlighted — these are never machine-translated.' : 'Glossary highlight off'); }
    });
    initDrawer();
    // 고정 헤더 높이(EN 안내 바 포함)를 CSS 변수로 — 입양 목록의 고정 필터 바가 바로 아래에 붙도록
    const setSticky = () => { if (h) document.documentElement.style.setProperty('--sticky-h', h.offsetHeight + 'px'); };
    setSticky(); addEventListener('resize', setSticky);
    $$('form[data-form="newsletter"]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); toast(isEn() ? 'Subscribed (demo)' : '뉴스레터 구독 신청이 접수됐어요 (데모)'); }));
  }

  /* ── 접수함에 넣기(봉사·문의·제보·입양·임보 — 자체 CMS가 원본) ── */
  function submitInbox(type, data) {
    const inbox = store.inbox();
    const id = 'i' + Date.now().toString(36);
    const at = today() + ' ' + new Date().toTimeString().slice(0, 5);
    const keep = (() => { const d = new Date(today()); d.setMonth(d.getMonth() + (store.settings().retentionMonths || 12)); return d.toISOString().slice(0, 10); })();
    inbox.unshift({ id, type, animal: data.animal || '', name: data.name || '익명', phone: data.phone || '', email: data.email || '', at, state: 'new', assignee: '', memo: '', keep, fields: data.fields || {} });
    store.save('inbox', inbox);
    addLog(`${D.LABELS.inboxType[type]} 접수 — ${data.name || '익명'}`);
    return id;
  }
  function addLog(text, by) {
    const log = store.log();
    log.unshift({ at: today() + ' ' + new Date().toTimeString().slice(0, 5), text, by: by || '방문자' });
    store.save('log', log.slice(0, 200));
  }

  /* ── 리빌·카운트업·토스트·드로어 (리빌 불가 환경 폴백 포함) ── */
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let revealDisabled = false;
  function showAll() { document.documentElement.classList.add('reveal-off'); $$('.rv').forEach(e => e.classList.add('in')); }
  function initReveal() {
    const els = $$('.rv');
    if (!els.length) return;
    if (reduced || !('IntersectionObserver' in window)) { showAll(); return; }
    let rafOk = false;
    try { requestAnimationFrame(() => { rafOk = true; }); } catch (e) { }
    setTimeout(() => { if (!rafOk || !(window.innerHeight > 0)) { revealDisabled = true; showAll(); } }, 250);
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    els.forEach(e => io.observe(e));
  }
  function countUp(el) {
    const target = parseFloat(el.dataset.count || '0');
    const fmt = n => Math.round(n).toLocaleString('ko-KR');
    if (reduced || revealDisabled) { el.textContent = fmt(target); return; }
    const t0 = performance.now(), dur = 1500; let done = false;
    function tick(t) {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * (0.6 + 0.4 * e));
      if (p < 1) requestAnimationFrame(tick); else { el.textContent = fmt(target); done = true; }
    }
    requestAnimationFrame(tick);
    setTimeout(() => { if (!done) el.textContent = fmt(target); }, 400);
  }
  function initCount() {
    const els = $$('[data-count]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(countUp); return; }
    const io = new IntersectionObserver(entries => { entries.forEach(en => { if (en.isIntersecting) { countUp(en.target); io.unobserve(en.target); } }); }, { threshold: 0.4 });
    els.forEach(e => io.observe(e));
    setTimeout(() => { if (revealDisabled) els.forEach(e => countUp(e)); }, 350);
  }
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }
  function initDrawer() {
    const btn = $('.menu-btn'), drawer = $('.drawer');
    if (!btn || !drawer) return;
    const close = () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); };
    btn.addEventListener('click', () => { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); btn.setAttribute('aria-expanded', 'true'); $('.drawer-close', drawer).focus(); });
    $('.drawer-bg', drawer).addEventListener('click', close);
    $('.drawer-close', drawer).addEventListener('click', close);
    drawer.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ── 헤더 스크롤 상태 ── */
  function initHeaderScroll() {
    const onS = () => document.body.classList.toggle('scrolled', window.scrollY > 24);
    onS(); window.addEventListener('scroll', onS, { passive: true });
  }

  window.HWCore = { $, $$, LS, store, today, ageText, ageTextEn, esc, fmtDate, fmtNum, qs, lang, isEn, tr, L, T, nameSpan, glossary, img, photoOf, PLACEHOLDER,
    publicAnimals, animalById, isVisible, publicPosts, badge, mountChrome, submitInbox, addLog, toast, initReveal, initCount, reduced, clone };

  document.addEventListener('DOMContentLoaded', () => { initHeaderScroll(); });
})();
