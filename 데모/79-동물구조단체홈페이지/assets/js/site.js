/* 홈워드 HOMEWARD — 공개 사이트 페이지 컨트롤러
   body[data-page] 값으로 분기. 모든 데이터는 HWCore.store(관리자와 공유)에서 읽는다. */
(function () {
  'use strict';
  const C = window.HWCore, D = window.HW;
  const { $, $$, store, esc, today, toast, ageText, ageTextEn, fmtDate, fmtNum, qs, isEn, tr, L, T, nameSpan, img, photoOf, publicAnimals, animalById, isVisible, publicPosts, badge, mountChrome, submitInbox } = C;
  const page = document.body.dataset.page;
  const ACTIVE = { home: '', about: 'about', activities: 'activities', post: 'activities', adopt: 'adopt', animal: 'adopt', 'adopt-guide': 'adopt', apply: 'adopt', volunteer: 'volunteer', donate: 'donate', news: 'news', maintenance: '' };
  mountChrome(ACTIVE[page] || '');
  const age = a => isEn() ? ageTextEn(a.birth) : ageText(a.birth);
  const speciesL = a => L('species', a.species);
  const sexL = a => L('sex', a.sex);
  const en = isEn();
  const daysSince = d => Math.max(0, Math.round((new Date(today()) - new Date(d)) / 86400000));
  const firstPublic = a => { const h = (a.history || []).find(x => x.field === 'pub' && x.to === 'public'); return h ? h.at : a.rescueDate; };
  const openOnes = () => publicAnimals().filter(a => a.adopt !== 'done');

  /* ── 공용 렌더: 개체 카드 ── */
  function animalCard(a, opts) {
    opts = opts || {};
    const foster = a.foster === 'wanted' ? `<span class="tag tag-foster">${T('임보 가정 모집')}</span>` : a.foster === 'active' ? `<span class="tag tag-foster">${T('임보 중')}</span>` : '';
    return `<a class="acard${a.adopt === 'done' ? ' is-done' : ''}" href="animal.html?id=${a.id}" aria-label="${esc(a.name)} ${en ? 'profile' : '상세 보기'}">
      <div class="acard-img"><img src="${photoOf(a, 0, 'sm')}" alt="${esc(a.name)}" loading="lazy" onerror="this.src='${C.PLACEHOLDER}'">${badge(a)}</div>
      <div class="acard-body"><div class="acard-name">${nameSpan(a.name)}</div><div class="acard-breed">${esc(tr(a, 'breed'))}</div>
      <div class="acard-meta"><span>${sexL(a)}</span><span>${age(a)}</span><span>${a.weight}kg</span></div>
      <div class="acard-foot"><span class="acard-center">${esc(tr(a, 'center'))}</span>${foster}</div></div></a>`;
  }
  function postCard(p, big) {
    const hero = p.hero ? `<img src="assets/img/${p.hero}.webp" alt="" loading="lazy">` : `<div class="pcard-nohero"><span>${L('postCat', p.cat)}</span></div>`;
    return `<a class="pcard${big ? ' pcard-big' : ''}" href="post.html?id=${p.id}"><div class="pcard-img">${hero}</div><div class="pcard-body"><div class="pcard-meta"><span class="pcat">${L('postCat', p.cat)}</span><time>${fmtDate(p.date)}</time></div><h3>${esc(tr(p, 'title'))}</h3><p>${esc(tr(p, 'summary'))}</p></div></a>`;
  }
  function privateNotice(kind) {
    return `<section class="private fur-b" style="--fur-b:var(--ink)"><div class="shell private-in rv in"><span class="eyebrow">${en ? 'Not available' : '비공개'}</span>
      <h1>${en ? 'This page is not public.' : '이 페이지는 공개되지 않았어요.'}</h1>
      <p>${en ? 'The content you requested is hidden, saved as a draft, or no longer listed. Even with a direct link, the server does not respond with it.' : (kind === 'post' ? '요청하신 글은 숨김·임시저장 상태이거나 더 이상 게시되지 않아요.' : '요청하신 개체 페이지는 숨김·임시저장 상태이거나 더 이상 게시되지 않아요.') + ' 링크를 알고 있어도 서버가 내용을 응답하지 않습니다.'}</p>
      <p class="small">${en ? 'Why: rescue records can be evidence in investigations. We decide when they become public.' : '왜 그럴까요 — 학대 구조 기록은 수사 증거가 될 수 있어요. 공개 시점은 단체가 정합니다. (카페24 시절엔 링크만 알면 열렸던 지점)'}</p>
      <div class="btn-row"><a class="btn btn-primary" href="adopt.html">${T('입양하기')}</a><a class="btn btn-ghost" href="index.html">${en ? 'Home' : '메인으로'}</a></div></div></section>`;
  }

  /* ── 메인 ── */
  function home() {
    const list = openOnes().sort((a, b) => firstPublic(b).localeCompare(firstPublic(a)));
    $('#home-animals').innerHTML = list.slice(0, 8).map(a => animalCard(a)).join('');
    const news = publicPosts().filter(p => ['rescue', 'care', 'aware'].includes(p.cat)).slice(0, 3);
    $('#home-news').innerHTML = news.map((p, i) => postCard(p, i === 0)).join('');
    const st = store.settings(), k = { waiting: openOnes().length, foster: publicAnimals().filter(a => a.foster === 'wanted').length };
    $('#stat-waiting').dataset.count = k.waiting; $('#stat-foster').dataset.count = k.foster;
    // 통계 수치는 관리자 설정 한 곳에서 — 국문·영문 어디서나 같은 값
    $('#stat-rescued').dataset.count = st.statRescued; $('#stat-adopted').dataset.count = st.statAdopted; $('#stat-vol').dataset.count = st.statVolunteers;
    initCarousel($('#home-animals'));
    initFaq();
    requestAnimationFrame(() => setTimeout(() => $('#hero').classList.add('in'), 80));
    // 풀블리드 단락 패럴랙스 (transform만 갱신 · reduced-motion이면 생략)
    const par = $('[data-parallax]');
    if (par && !C.reduced) {
      const onS = () => { const r = par.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; par.style.transform = `translateY(${(-p * 60).toFixed(1)}px)`; };
      onS(); addEventListener('scroll', () => requestAnimationFrame(onS), { passive: true });
    }
  }
  function about() {
    const en = isEn();
    const H = en ? [['2017', 'Rescue work begins · first rescue (11 dogs, Gwangju dog meat farm)'], ['2019', 'Registered non-profit · Yongin shelter opens'], ['2021', 'Overseas adoption program (Toronto · New York) · 500 adoptions'], ['2023', 'Cattery and small-animal wing · 1,000 rescues'], ['2025', '12 slaughterhouse and puppy-mill rescues · 1,500 adoptions'], ['2026', '2,134 rescued · 1,792 adopted · 640 volunteers']] : D.HISTORY.map(h => [h.y, h.t]);
    $('#history').innerHTML = H.map(([y, t]) => `<li><b>${y}</b><span>${esc(t)}</span></li>`).join('');
  }
  function initCarousel(track) {
    if (!track) return;
    const prev = $('[data-car="prev"]'), next = $('[data-car="next"]');
    const step = () => (track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width + 20 : 300);
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -step() * 2, behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: step() * 2, behavior: 'smooth' }));
    // 드래그 스크롤
    let down = false, sx = 0, sl = 0;
    track.addEventListener('pointerdown', e => { down = true; sx = e.clientX; sl = track.scrollLeft; track.classList.add('drag'); });
    window.addEventListener('pointerup', () => { down = false; track.classList.remove('drag'); });
    track.addEventListener('pointermove', e => { if (!down) return; track.scrollLeft = sl - (e.clientX - sx); });
    track.addEventListener('click', e => { if (Math.abs(track.scrollLeft - sl) > 8 && down === false && e.target.closest('a')) { } });
  }

  /* ── 입양 목록 ── */
  const F = { q: '', species: 'all', sex: 'all', age: 'all', weight: 'all', status: 'open', foster: false, sort: 'new' };
  function adopt() {
    const p = new URLSearchParams(location.search);
    ['species', 'sex', 'age', 'weight', 'status', 'sort'].forEach(k => { if (p.get(k)) F[k] = p.get(k); });
    if (p.get('q')) F.q = p.get('q'); if (p.get('foster') === '1') F.foster = true;
    renderFilters(); renderList();
    $('#adopt-filters').addEventListener('click', e => {
      const b = e.target.closest('[data-fk]'); if (!b) return;
      F[b.dataset.fk] = b.dataset.fv; renderFilters(); renderList();
    });
    $('#adopt-q').addEventListener('input', e => { F.q = e.target.value; renderList(); });
    $('#adopt-foster').addEventListener('change', e => { F.foster = e.target.checked; renderList(); });
    $('#adopt-sort').addEventListener('change', e => { F.sort = e.target.value; renderList(); });
    $('#adopt-reset').addEventListener('click', () => { Object.assign(F, { q: '', species: 'all', sex: 'all', age: 'all', weight: 'all', status: 'all', foster: false, sort: 'new' }); $('#adopt-q').value = ''; $('#adopt-foster').checked = false; $('#adopt-sort').value = 'new'; renderFilters(); renderList(); });
    let openedAt = 0;
    const setOpen = (open) => { $('#adopt-filters').classList.toggle('open', open); $('#filter-toggle').setAttribute('aria-expanded', String(open)); if (open) openedAt = window.scrollY; };
    $('#filter-toggle').addEventListener('click', () => setOpen(!$('#adopt-filters').classList.contains('open')));
    // 고정 바 안의 필터 패널은 결과를 내려 보기 시작하면 자동으로 접힌다(화면을 가리지 않게). 필터 버튼에 적용 개수가 남는다
    addEventListener('scroll', () => { if ($('#adopt-filters').classList.contains('open') && window.scrollY - openedAt > 220) setOpen(false); }, { passive: true });
  }
  function renderFilters() {
    const counts = {};
    const base = publicAnimals();
    counts.species = { all: base.length }; ['dog', 'cat', 'rabbit', 'goat'].forEach(s => counts.species[s] = base.filter(a => a.species === s).length);
    const groups = [
      ['species', en ? 'Animal' : '동물 구분', [['all', en ? 'All' : '전체'], ['dog', L('species', 'dog')], ['cat', L('species', 'cat')], ['rabbit', L('species', 'rabbit')], ['goat', L('species', 'goat')]]],
      ['sex', en ? 'Sex' : '성별', [['all', en ? 'Any' : '전체'], ['M', L('sex', 'M')], ['F', L('sex', 'F')]]],
      ['age', en ? 'Age' : '연령', [['all', en ? 'Any' : '전체'], ['baby', en ? 'Under 1' : '1세 미만'], ['young', en ? '1–3' : '1~3세'], ['adult', en ? '4–7' : '4~7세'], ['senior', en ? '8+' : '8세 이상']]],
      ['weight', en ? 'Weight' : '체중', [['all', en ? 'Any' : '전체'], ['s', en ? 'Under 5kg' : '5kg 미만'], ['m', '5~15kg'], ['l', en ? '15kg+' : '15kg 이상']]],
      ['status', en ? 'Status' : '입양 상태', [['open', T('모집 중')], ['review', T('심사 중')], ['done', T('입양 완료')], ['all', en ? 'All' : '전체']]]
    ];
    $('#adopt-filters').innerHTML = groups.map(([k, label, opts]) => `<div class="fgroup"><div class="fgroup-label">${label}</div><div class="chips">${opts.map(([v, l]) => `<button type="button" class="chip" data-fk="${k}" data-fv="${v}" aria-pressed="${F[k] === v}">${l}${k === 'species' ? ` <span class="n">${counts.species[v]}</span>` : ''}</button>`).join('')}</div></div>`).join('');
  }
  function ageBucket(a) { const [y, m] = a.birth.split('-').map(Number); const [ty, tm] = today().split('-').map(Number); const mo = (ty - y) * 12 + (tm - m); return mo < 12 ? 'baby' : mo < 48 ? 'young' : mo < 96 ? 'adult' : 'senior'; }
  function renderList() {
    let list = publicAnimals().filter(a => {
      if (F.species !== 'all' && a.species !== F.species) return false;
      if (F.sex !== 'all' && a.sex !== F.sex) return false;
      if (F.age !== 'all' && ageBucket(a) !== F.age) return false;
      if (F.weight !== 'all' && !((F.weight === 's' && a.weight < 5) || (F.weight === 'm' && a.weight >= 5 && a.weight <= 15) || (F.weight === 'l' && a.weight > 15))) return false;
      if (F.status !== 'all' && a.adopt !== F.status) return false;
      if (F.foster && a.foster !== 'wanted') return false;
      if (F.q.trim() && !(a.name + ' ' + a.breed + ' ' + (a.en || '')).toLowerCase().includes(F.q.trim().toLowerCase())) return false;
      return true;
    });
    const sorters = { new: (a, b) => firstPublic(b).localeCompare(firstPublic(a)), old: (a, b) => firstPublic(a).localeCompare(firstPublic(b)), name: (a, b) => a.name.localeCompare(b.name, 'ko'), young: (a, b) => b.birth.localeCompare(a.birth), senior: (a, b) => a.birth.localeCompare(b.birth) };
    list.sort(sorters[F.sort] || sorters.new);
    if (F.status === 'all') list.sort((a, b) => (a.adopt === 'done') - (b.adopt === 'done'));
    const n = list.length;
    $('#adopt-count').innerHTML = en ? `<b>${n}</b> ${n === 1 ? 'friend is' : 'friends are'} ${F.status === 'done' ? 'home' : 'waiting for a family'}` : `<b>${n}</b>마리가 ${F.status === 'done' ? '가족을 만났어요' : '가족을 기다려요'}`;
    const active = ['species', 'sex', 'age', 'weight'].filter(k => F[k] !== 'all').length + (F.foster ? 1 : 0) + (F.q ? 1 : 0) + (F.status !== 'open' ? 1 : 0);
    $('#filter-active').textContent = active ? (en ? `${active} filters` : `필터 ${active}개`) : (en ? 'Filters' : '필터');
    $('#adopt-grid').innerHTML = n ? list.map(a => animalCard(a)).join('') : `<div class="empty-state"><strong>${en ? 'No friends match these filters.' : '조건에 맞는 친구가 아직 없어요.'}</strong><p>${en ? 'Try widening the age or weight range, or clear the filters.' : '연령·체중 범위를 넓히거나 필터를 지워 보세요. 새 친구가 오면 뉴스레터로 알려 드려요.'}</p><button type="button" class="btn btn-ghost" id="adopt-reset-2">${en ? 'Clear filters' : '필터 지우기'}</button></div>`;
    const r2 = $('#adopt-reset-2'); if (r2) r2.addEventListener('click', () => $('#adopt-reset').click());
    C.initReveal();
  }

  /* ── 개체 상세 ── */
  function animal() {
    const id = qs('id'); const a = animalById(id);
    const root = $('#animal-root');
    if (!isVisible(a)) { root.innerHTML = privateNotice('animal'); document.title = (en ? 'Not available' : '비공개 페이지') + ' — HOMEWARD'; return; }
    document.title = `${a.name} · ${tr(a, 'breed')} — HOMEWARD`;
    const photos = a.photos.length ? a.photos : [''];
    const withRow = [[en ? 'Kids' : '아이', a.with.kids], [en ? 'Other dogs' : '다른 개', a.with.dogs], [en ? 'Cats' : '고양이', a.with.cats]];
    const open = a.adopt === 'open';
    const waitDays = daysSince(firstPublic(a));
    const steps = en ? ['Application', 'Phone chat', 'Meet at the shelter', 'Home check', 'Adoption agreement', 'Welcome home', 'Check-ins at 1·3·6 months'] : ['신청서 작성', '전화 상담', '센터에서 만나기', '가정 환경 확인', '입양 계약', '집으로', '1·3·6개월 안부 확인'];
    const related = publicPosts().filter(p => (p.animals || []).includes(a.id)).slice(0, 3);
    const friends = publicAnimals().filter(x => x.id !== a.id && x.adopt !== 'done').sort((x, y) => (y.center === a.center) - (x.center === a.center)).slice(0, 4);
    const lastAt = (a.history || []).length ? a.history[a.history.length - 1].at : a.rescueDate;
    const cta = a.care !== 'live' ? '' : open ? `<div class="cta-row"><a class="btn btn-primary btn-lg" href="apply.html?type=adopt&animal=${a.id}">${T('입양 신청')}</a>${a.foster === 'wanted' ? `<a class="btn btn-dark btn-lg" href="apply.html?type=foster&animal=${a.id}">${T('임보 신청')}</a>` : ''}<button type="button" class="btn btn-ghost btn-lg" data-share>${en ? 'Share' : '공유하기'}</button></div>`
      : a.adopt === 'review' ? `<div class="notice notice-review"><b>${T('심사 중')}</b> — ${en ? `An application for ${a.name} is being reviewed, so the apply button is hidden for now. If it doesn't work out, ${a.name} will be listed again.` : `${a.name}에게 들어온 입양 신청을 심사하고 있어요. 그동안 신청 버튼을 잠시 닫아 둡니다. 심사 결과에 따라 다시 모집으로 바뀔 수 있어요.`}<button type="button" class="btn btn-ghost btn-sm" data-share>${en ? 'Share' : '공유'}</button></div>`
      : `<div class="notice notice-done"><b>${T('입양 완료')}</b> — ${en ? `${a.name} found a family on ${fmtDate(a.adoptedAt)}.` : `${a.name}는 ${fmtDate(a.adoptedAt)} 가족을 만났어요.`} <a href="adopt.html">${en ? 'Meet friends still waiting →' : '아직 기다리는 친구들 보기 →'}</a></div>`;
    root.innerHTML = `
    <section class="animal-hero"><div class="shell animal-grid">
      <div class="gallery"><div class="gallery-main"><img id="g-main" src="${img(photos[0])}" alt="${esc(a.name)}" onerror="this.src='${C.PLACEHOLDER}'">${badge(a)}</div>
        ${photos.length > 1 || a.video ? `<div class="gallery-thumbs">${photos.map((p, i) => `<button type="button" class="gthumb${i === 0 ? ' on' : ''}" data-g="${esc(img(p))}" aria-label="${en ? 'Photo' : '사진'} ${i + 1}"><img src="${img(p, 'sm')}" alt="" onerror="this.src='${C.PLACEHOLDER}'"></button>`).join('')}${a.video ? `<a class="gthumb gvideo" href="${esc(a.video)}" target="_blank" rel="noopener">▶ ${en ? 'Video' : '영상'}</a>` : ''}</div>` : ''}</div>
      <div class="animal-head">
        <span class="eyebrow">${speciesL(a)} · ${esc(tr(a, 'breed'))}</span>
        <h1>${nameSpan(a.name)}</h1>
        <p class="animal-voice">${en ? `"I've been waiting ${waitDays} days. Could you be my family?"` : `"가족을 기다린 지 ${waitDays}일째예요. 저와 함께 살아 주실래요?"`}</p>
        ${cta}
        <dl class="meta-grid">
          <div><dt>${en ? 'Sex' : '성별'}</dt><dd>${sexL(a)}</dd></div><div><dt>${en ? 'Age' : '나이'}</dt><dd>${age(a)} <small>(${a.birth.replace('-', '.')} ${en ? 'est.' : '추정'})</small></dd></div>
          <div><dt>${en ? 'Weight' : '체중'}</dt><dd>${a.weight}kg</dd></div><div><dt>${en ? 'Neutered' : '중성화'}</dt><dd>${a.neutered ? (en ? 'Done' : '완료') : (en ? 'Planned' : '예정')}</dd></div>
          <div><dt>${en ? 'Vaccinated' : '접종'}</dt><dd>${a.vaccinated ? (en ? 'Done' : '완료') : (en ? 'In progress' : '진행 중')}</dd></div><div><dt>${en ? 'Rescued' : '구조일'}</dt><dd>${fmtDate(a.rescueDate)}</dd></div>
          <div><dt>${en ? 'Rescued from' : '구조 장소'}</dt><dd>${esc(tr(a, 'rescuePlace'))}</dd></div><div><dt>${en ? 'Now at' : '보호 장소'}</dt><dd>${esc(tr(a, 'center'))}</dd></div>
          <div class="span2"><dt>${en ? 'Last updated' : '상태 변경일'}</dt><dd>${fmtDate(lastAt)} <small>${en ? '(recorded automatically)' : '(상태를 바꾸면 자동 기록)'}</small></dd></div>
        </dl>
        <div class="with-row">${withRow.map(([l, v]) => `<span class="with with-${v}"><b>${l}</b>${L('with', v)}</span>`).join('')}</div>
      </div></div></section>
    <section class="sec animal-body"><div class="shell two-col">
      <div class="prose">
        <h2 class="rv">${en ? `Is ${a.name} right for you?` : `${a.name}는 어떤 친구인가요?`}</h2>
        <p class="rv">${esc(tr(a, 'story'))}</p>
        <div class="tags rv">${(a.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <h2 class="rv">${en ? 'Health' : '건강'}</h2><p class="rv">${esc(tr(a, 'health'))}${a.tested ? `<br><small>${esc(a.tested)}</small>` : ''}</p>
        ${a.caution ? `<h2 class="rv">${en ? `Are you right for ${a.name}?` : `${a.name}와 살려면`}</h2><p class="rv callout">${esc(tr(a, 'caution'))}</p>` : ''}
        ${a.review ? `<h2 class="rv">${en ? 'From the family' : '입양 가족의 후기'}</h2><blockquote class="review"><p>${esc(tr(a.review, 'text'))}</p><cite>${esc(a.review.by)} · ${fmtDate(a.review.at)}</cite></blockquote>` : ''}
        ${related.length ? `<h2 class="rv">${en ? 'Stories' : '관련 소식'}</h2><div class="pcard-list rv">${related.map(p => postCard(p)).join('')}</div>` : ''}
      </div>
      <aside class="side-col">
        <div class="side-card rv"><h3>${en ? 'How adoption works' : '입양 절차'}</h3><ol class="steps">${steps.map(s => `<li>${s}</li>`).join('')}</ol><a href="adopt-guide.html" class="link">${en ? 'Details, fees & FAQ →' : '자세한 절차·책임비·FAQ →'}</a></div>
        <div class="side-card rv"><h3>${en ? 'Can\'t adopt right now?' : '지금 입양이 어렵다면'}</h3><p>${en ? 'Foster for 1–3 months, or sponsor treatment costs.' : '1~3개월 임시보호나 치료비 후원으로도 큰 힘이 돼요.'}</p><div class="btn-row"><a class="btn btn-ghost btn-sm" href="adopt-guide.html#foster">${en ? 'Fostering' : '임시보호 안내'}</a><a class="btn btn-ghost btn-sm" href="donate.html">${T('후원하기')}</a></div></div>
      </aside></div></section>
    ${friends.length ? `<section class="sec sec-alt"><div class="shell"><div class="sec-head rv"><h2>${en ? 'More friends waiting' : '함께 기다리는 친구들'}</h2><a class="link" href="adopt.html">${en ? 'See all →' : '전체 보기 →'}</a></div><div class="acard-grid">${friends.map(x => animalCard(x)).join('')}</div></div></section>` : ''}`;
    $$('.gthumb[data-g]').forEach(b => b.addEventListener('click', () => { $('#g-main').src = b.dataset.g; $$('.gthumb').forEach(x => x.classList.toggle('on', x === b)); }));
    $$('[data-share]').forEach(b => b.addEventListener('click', async () => {
      const url = location.href.split('#')[0];
      const text = `${a.name} · ${speciesL(a)} · ${sexL(a)} · ${age(a)} · ${a.weight}kg · ${L('adopt', a.adopt)}`;
      if (navigator.share) { try { await navigator.share({ title: `${a.name} — HOMEWARD`, text, url }); return; } catch (e) { } }
      try { await navigator.clipboard.writeText(url); toast(en ? 'Link copied — name, photo, sex, age, weight and status travel with it.' : '링크를 복사했어요 — 이름·사진·성별·나이·체중·상태가 함께 공유됩니다'); } catch (e) { toast(url); }
    }));
    // 공유 미리보기(OG) — 실제 구축에서는 서버가 넣는다
    const og = (p, v) => { let m = document.querySelector(`meta[property="${p}"]`); if (!m) { m = document.createElement('meta'); m.setAttribute('property', p); document.head.appendChild(m); } m.content = v; };
    og('og:title', `${a.name} · ${tr(a, 'breed')} — HOMEWARD`); og('og:description', `${sexL(a)} · ${age(a)} · ${a.weight}kg · ${L('adopt', a.adopt)}`); og('og:image', new URL(img(photos[0]), location.href).href);
  }

  /* ── 활동·소식 목록 ── */
  function activities() {
    let cat = qs('cat') || 'all';
    const wrap = $('#act-list'), chips = $('#act-chips');
    const cats = [['all', en ? 'All' : '전체'], ['rescue', L('postCat', 'rescue')], ['care', L('postCat', 'care')], ['aware', L('postCat', 'aware')]];
    const draw = () => {
      chips.innerHTML = cats.map(([k, l]) => `<button type="button" class="chip" data-cat="${k}" aria-pressed="${cat === k}">${l}</button>`).join('');
      const list = publicPosts().filter(p => ['rescue', 'care', 'aware'].includes(p.cat) && (cat === 'all' || p.cat === cat));
      wrap.innerHTML = list.map((p, i) => postCard(p, i === 0 && cat === 'all')).join('') || `<div class="empty-state"><strong>${en ? 'No posts yet.' : '아직 글이 없어요.'}</strong></div>`;
      C.initReveal();
    };
    chips.addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (!b) return; cat = b.dataset.cat; draw(); });
    draw();
  }

  /* ── 소식 상세 ── */
  function post() {
    const id = qs('id'); const p = store.posts().find(x => x.id === id);
    const root = $('#post-root');
    if (!p || p.pub !== 'public') { root.innerHTML = privateNotice('post'); document.title = (en ? 'Not available' : '비공개 페이지') + ' — HOMEWARD'; return; }
    document.title = `${tr(p, 'title')} — HOMEWARD`;
    const rel = (p.animals || []).map(animalById).filter(isVisible);
    const all = publicPosts(); const i = all.findIndex(x => x.id === p.id); const prev = all[i + 1], next = all[i - 1];
    root.innerHTML = `<article class="post"><div class="shell post-shell">
      <div class="post-meta rv in"><span class="pcat">${L('postCat', p.cat)}</span><time>${fmtDate(p.date)}</time></div>
      <h1 class="rv in">${esc(tr(p, 'title'))}</h1><p class="lead rv in">${esc(tr(p, 'summary'))}</p></div>
      ${p.hero ? (p.sensitive ? `<div class="post-hero rv in"><figure class="sensitive" id="sens"><img src="assets/img/${p.hero}.webp" alt=""><div class="sens-cover"><strong>${en ? 'Photo from an abuse site' : '학대 현장 사진이 포함돼 있어요'}</strong><p>${en ? 'Published for animal-protection awareness. Tap to view.' : '동물보호 의식 고양 목적으로 게시합니다. 보시려면 눌러 주세요.'}</p><button type="button" class="btn btn-cream btn-sm" data-sens>${en ? 'View photo' : '사진 보기'}</button></div><figcaption>${en ? 'Provided by HOMEWARD · published for animal-protection awareness' : '사진 제공: 홈워드 · 동물보호 의식 고양 목적 게시'}</figcaption></figure></div>` : `<div class="post-hero rv in"><img src="assets/img/${p.hero}.webp" alt=""></div>`) : ''}
      <div class="shell post-shell prose">${(tr(p, 'body') || p.body).map(b => `<p class="rv">${esc(b)}</p>`).join('')}
        ${rel.length ? `<h2 class="rv">${en ? 'Friends in this story' : '이 소식의 주인공'}</h2><div class="acard-grid cols-2 rv">${rel.map(a => animalCard(a)).join('')}</div>` : ''}
        <div class="post-nav rv">${prev ? `<a href="post.html?id=${prev.id}"><small>${en ? 'Older' : '이전 글'}</small>${esc(tr(prev, 'title'))}</a>` : '<span></span>'}${next ? `<a class="next" href="post.html?id=${next.id}"><small>${en ? 'Newer' : '다음 글'}</small>${esc(tr(next, 'title'))}</a>` : ''}</div>
        <div class="btn-row rv"><a class="btn btn-primary" href="donate.html">${T('후원하기')}</a><a class="btn btn-ghost" href="activities.html">${en ? 'All stories' : '소식 목록'}</a></div></div></article>`;
    const sb = $('[data-sens]'); if (sb) sb.addEventListener('click', () => { $('#sens').classList.add('show'); });
  }

  /* ── 절차·후기·FAQ ── */
  function adoptGuide() {
    const reviews = store.animals().filter(a => a.review && a.pub === 'public');
    $('#guide-reviews').innerHTML = reviews.map(a => `<blockquote class="review"><img src="${photoOf(a, 0, 'sm')}" alt="" onerror="this.src='${C.PLACEHOLDER}'"><div><p>${esc(tr(a.review, 'text'))}</p><cite>${nameSpan(a.name)} · ${esc(a.review.by)} · ${fmtDate(a.review.at)}</cite></div></blockquote>`).join('');
    $('#guide-faq').innerHTML = D.FAQ.slice(0, 5).map(f => faqItem(f)).join('');
    initFaq();
  }
  const faqItem = f => `<div class="faq-item"><button type="button" class="faq-q" aria-expanded="false">${esc(tr(f, 'q'))}<span class="faq-i" aria-hidden="true"></span></button><div class="faq-a"><p>${esc(tr(f, 'a'))}</p></div></div>`;
  function initFaq() { $$('.faq-item').forEach(it => { const q = $('.faq-q', it); q.addEventListener('click', () => { const o = it.classList.toggle('open'); q.setAttribute('aria-expanded', String(o)); }); }); }

  /* ── 봉사 ── */
  function volunteer() {
    $('#programs').innerHTML = D.PROGRAMS.map(p => `<article class="prog" id="prog-${p.id}"><div class="prog-img"><img src="assets/img/${p.img}.webp" alt="" loading="lazy"></div><div class="prog-body"><h3>${esc(tr(p, 'title'))}</h3><dl><div><dt>${en ? 'When' : '언제'}</dt><dd>${esc(tr(p, 'when'))}</dd></div><div><dt>${en ? 'Where' : '어디서'}</dt><dd>${esc(tr(p, 'where'))}</dd></div></dl><p>${esc(tr(p, 'desc'))}</p><button type="button" class="btn btn-dark" data-prog="${esc(p.title)}">${en ? 'Apply' : '신청하기'}</button></div></article>`).join('');
    const sel = $('#v-program'); sel.innerHTML = D.PROGRAMS.map(p => `<option>${esc(p.title)}</option>`).join('');
    $$('[data-prog]').forEach(b => b.addEventListener('click', () => { sel.value = b.dataset.prog; $('#v-form').scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => $('#v-name').focus(), 500); }));
    const d = new Date(today()); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); $('#v-date').value = d.toISOString().slice(0, 10);
    // 만 14세 미만은 보호자 동의 단계로 분기 (개인정보보호법)
    const birth = $('#v-birth'); const yNow = Number(today().slice(0, 4));
    birth.innerHTML = Array.from({ length: 70 }, (_, i) => yNow - 8 - i).map(y => `<option value="${y}" ${y === yNow - 30 ? 'selected' : ''}>${y}</option>`).join('');
    const guard = $('#v-guardian');
    const chk = () => { const under = yNow - Number(birth.value) < 14; guard.hidden = !under; $$('input', guard).forEach(i => i.required = under); };
    birth.addEventListener('change', chk); chk();
    bindForm($('#v-form'), f => {
      const under = yNow - Number(f.birth) < 14;
      const fields = { '프로그램': f.program, '희망일': f.date, '인원': f.count + '명', '첫 참여': f.first ? '예' : '아니요', '생년': f.birth, '남기고 싶은 말': f.note || '' };
      if (under) { fields['보호자'] = `${f.gname} (${f.gphone}) · 동의 완료`; }
      const id = submitInbox('volunteer', { name: f.name, phone: f.phone, email: f.email, fields });
      return { id, title: en ? 'Your volunteer application is in.' : '봉사 신청이 접수됐어요.', desc: en ? `Receipt ${id.toUpperCase()}. A staff member will confirm by phone or text.` : `접수 번호 ${id.toUpperCase()} · 담당자가 확인 후 전화나 문자로 안내드려요. 이 신청은 사이트 관리자의 접수함에 바로 들어갑니다.` };
    });
  }

  /* ── 후원 ── */
  function donate() {
    const wrap = $('#usage-bars'); const max = Math.max(...D.DONATE.usage.map(u => u.pct));
    wrap.innerHTML = D.DONATE.usage.map(u => `<div class="ubar"><div class="ubar-label"><span>${esc(tr(u, 'label'))}</span><b>${u.pct}%</b></div><div class="ubar-track"><i style="--w:${u.pct / max * 100}%"></i></div></div>`).join('');
    $('#goods').innerHTML = D.DONATE.goods.map(g => `<li>${esc(g)}</li>`).join('');
    const amounts = $('#amounts');
    amounts.innerHTML = D.DONATE.regular.map((r, i) => `<label class="amount${i === 1 ? ' on' : ''}"><input type="radio" name="amt" value="${r.amount}" ${i === 1 ? 'checked' : ''}><b>${esc(r.label)}</b><span>${esc(tr(r, 'note'))}</span></label>`).join('');
    amounts.addEventListener('change', () => $$('.amount').forEach(l => l.classList.toggle('on', l.querySelector('input').checked)));
    const ext = (kind) => { const s = store.settings(); const url = kind === 'regular' ? (s.donateRegular || D.DONATE.external.regular) : (s.donateOnce || D.DONATE.external.once); const amt = ($('input[name="amt"]:checked') || {}).value; openModal(`<h2>${en ? 'Taking you to our payment partner' : '외부 결제 페이지로 이동해요'}</h2><p>${en ? 'Donations are processed on an external secure page — no card details are entered on this site.' : 'RFP 기준대로 후원 결제는 사이트 안이 아니라 외부 결제 사이트에서 진행됩니다. 이 사이트에는 카드 정보가 들어오지 않아요.'}</p><p class="mono small">${esc(url)}${kind === 'regular' && amt ? `?amount=${amt}` : ''}</p><div class="btn-row"><a class="btn btn-primary" href="${esc(url)}" target="_blank" rel="noopener">${en ? 'Continue' : '결제 페이지 열기 (데모 링크)'}</a><button type="button" class="btn btn-ghost" data-close>${en ? 'Cancel' : '취소'}</button></div>`); };
    $('#btn-regular').addEventListener('click', () => ext('regular'));
    $('#btn-once').addEventListener('click', () => ext('once'));
    setTimeout(() => $$('.ubar-track i').forEach(i => i.classList.add('grow')), 300);
  }

  /* ── 소식·문의 ── */
  function news() {
    let tab = location.hash === '#report' ? 'report' : 'notice';
    const tabs = $('#news-tabs'), list = $('#news-list');
    const kinds = [['notice', L('postCat', 'notice')], ['press', L('postCat', 'press')], ['letter', L('postCat', 'letter')], ['report', L('postCat', 'report')]];
    const draw = () => {
      tabs.innerHTML = kinds.map(([k, l]) => `<button type="button" role="tab" aria-selected="${tab === k}" data-tab="${k}">${l}</button>`).join('');
      const ps = publicPosts().filter(p => p.cat === tab);
      list.innerHTML = ps.map(p => `<a class="nrow" href="post.html?id=${p.id}"><time>${fmtDate(p.date)}</time><div><strong>${esc(tr(p, 'title'))}</strong><p>${esc(tr(p, 'summary'))}</p></div><span class="arrow">→</span></a>`).join('') || `<div class="empty-state"><strong>${en ? 'Nothing here yet.' : '아직 글이 없어요.'}</strong></div>`;
      C.initReveal();
    };
    tabs.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; tab = b.dataset.tab; draw(); });
    draw();
    $('#faq-all').innerHTML = D.FAQ.map(faqItem).join(''); initFaq();
    bindForm($('#c-form'), f => {
      const type = f.kind === 'report' ? 'report' : 'inquiry';
      const id = submitInbox(type, { name: f.name || '익명', phone: f.phone, email: f.email, fields: type === 'report' ? { '위치': f.place || '', '상황': f.content, '첨부': f.file ? '사진 첨부' : '없음' } : { '내용': f.content } });
      return { id, title: type === 'report' ? (en ? 'Your report is in.' : '제보가 접수됐어요.') : (en ? 'Your message is in.' : '문의가 접수됐어요.'), desc: en ? `Receipt ${id.toUpperCase()}. Reporter details are never made public.` : `접수 번호 ${id.toUpperCase()} · ${type === 'report' ? '제보자 정보는 수사기관 외에 공개하지 않아요. 긴급하면 112에 먼저 신고해 주세요.' : '담당자가 확인 후 이메일로 답변드려요.'}` };
    });
    $$('input[name="kind"]').forEach(r => r.addEventListener('change', () => $('#c-form').classList.toggle('is-report', r.value === 'report' && r.checked)));
  }

  /* ── 신청 폼(입양·임보) ── */
  function apply() {
    const type = qs('type') === 'foster' ? 'foster' : 'adopt';
    const a = animalById(qs('animal'));
    const root = $('#apply-root');
    const title = type === 'foster' ? T('임보 신청') : T('입양 신청');
    document.title = `${title} — HOMEWARD`;
    if (a && !isVisible(a)) { root.innerHTML = privateNotice('animal'); return; }
    if (a && a.adopt !== 'open') { root.innerHTML = `<div class="shell"><div class="notice notice-review" style="margin:40px 0"><b>${L('adopt', a.adopt)}</b> — ${en ? `${a.name} is not accepting applications right now.` : `${a.name}는 지금 신청을 받지 않아요.`} <a href="adopt.html">${en ? 'See other friends →' : '다른 친구 보기 →'}</a></div></div>`; return; }
    const s = store.settings();
    root.innerHTML = `<div class="shell apply-grid">
      <div><span class="eyebrow">${title}</span><h1>${a ? (en ? `Apply for ${a.name}` : `${a.name}와 함께하기`) : (en ? 'Application' : '신청서')}</h1>
        <p class="lead">${type === 'foster' ? (en ? 'Foster for 1–3 months. We cover food, supplies and vet costs.' : '1~3개월 임시보호. 사료·용품·치료비는 홈워드가 지원해요.') : (en ? 'Takes about 5 minutes. A staff member will call you within 3 days.' : '5분이면 끝나요. 3일 안에 담당자가 전화드립니다.')}</p>
        <form class="form" id="a-form" novalidate>
          <div class="frow"><div class="fld"><label for="a-name">${en ? 'Name' : '이름'} *</label><input id="a-name" name="name" required value="${en ? 'Demo Applicant' : '홍길동 (데모)'}"></div><div class="fld"><label for="a-phone">${en ? 'Phone' : '연락처'} *</label><input id="a-phone" name="phone" required value="010-0000-0000"></div></div>
          <div class="fld"><label for="a-email">${en ? 'Email' : '이메일'}</label><input id="a-email" name="email" type="email" value="demo@example.com"></div>
          <div class="frow"><div class="fld"><label>${en ? 'Household' : '가족 구성'} *</label><select name="family" required><option>${en ? '2 adults' : '성인 2'}</option><option>${en ? '2 adults · 1 child' : '성인 2 · 초등 1'}</option><option>${en ? '1 adult' : '성인 1'}</option><option>${en ? '3+ adults' : '성인 3 이상'}</option></select></div><div class="fld"><label>${en ? 'Home' : '주거'} *</label><select name="home" required><option>${en ? 'Apartment (pets allowed)' : '아파트 (반려동물 허용)'}</option><option>${en ? 'House' : '단독주택'}</option><option>${en ? 'Villa' : '빌라'}</option></select></div></div>
          ${type === 'foster' ? `<div class="frow"><div class="fld"><label>${en ? 'Foster period' : '임보 가능 기간'} *</label><select name="period" required><option>1~2${en ? ' months' : '개월'}</option><option>2~3${en ? ' months' : '개월'}</option><option>3${en ? '+ months' : '개월 이상'}</option></select></div><div class="fld"><label>${en ? 'Other pets' : '동거 동물'}</label><input name="pets" value="${en ? 'None' : '없음'}"></div></div>` : `<div class="frow"><div class="fld"><label>${en ? 'Hours away per day' : '하루 외출 시간'} *</label><select name="away" required><option>${en ? 'Under 4h' : '4시간 이하'}</option><option>${en ? '4–8h' : '4~8시간'}</option><option>${en ? 'Over 8h' : '8시간 이상'}</option></select></div><div class="fld"><label>${en ? 'Pet experience' : '반려 경험'}</label><input name="exp" value="${en ? 'Mixed-breed dog, 12 years' : '믹스견 12년'}"></div></div>`}
          <div class="fld"><label for="a-why">${en ? 'Why this friend?' : '이 친구와 살고 싶은 이유'}</label><textarea id="a-why" name="why">${en ? 'We have a quiet home and time to help a shy dog settle in.' : '조용한 집이고, 겁 많은 아이가 적응할 시간을 충분히 줄 수 있어요.'}</textarea></div>
          <label class="check"><input type="checkbox" name="consent" required checked> <span>${en ? `I agree to the collection of the information above for application review. It is stored only in HOMEWARD's own system${s.sheetExport === 'on' ? ' and in Google Sheets (servers outside Korea)' : ' (no transfer abroad)'} for ${s.retentionMonths} months, then deleted.` : `위 정보를 입양·임보 심사 목적으로 수집하는 데 동의합니다. 정보는 홈워드 자체 시스템에만 저장되며${s.sheetExport === 'on' ? ' 구글시트(해외 서버)에도 보관되고' : ' 국외로 이전되지 않고'}, 접수일로부터 ${s.retentionMonths}개월 보관 후 파기됩니다.`}</span></label>
          <div class="btn-row"><button type="submit" class="btn btn-primary btn-lg">${en ? 'Submit application' : '신청서 보내기'}</button></div>
          <p class="small muted">${en ? 'Demo: nothing is sent to a server. Your entry appears in the admin inbox of this demo.' : '데모 — 서버로 전송되지 않고 이 데모의 관리자 접수함에 들어가요.'}</p>
        </form></div>
      <aside>${a ? `<div class="apply-animal"><img src="${photoOf(a, 0, 'sm')}" alt="" onerror="this.src='${C.PLACEHOLDER}'"><div><strong>${nameSpan(a.name)}</strong><span>${esc(tr(a, 'breed'))} · ${sexL(a)} · ${age(a)} · ${a.weight}kg</span>${badge(a)}</div></div>${a.caution ? `<div class="side-card"><h3>${en ? 'Before you apply' : '신청 전에 꼭 읽어 주세요'}</h3><p>${esc(tr(a, 'caution'))}</p></div>` : ''}` : ''}
        <div class="side-card"><h3>${en ? 'What happens next' : '다음은 이렇게 진행돼요'}</h3><ol class="steps"><li>${en ? 'Phone chat (within 3 days)' : '전화 상담 (3일 내)'}</li><li>${en ? 'Meet at the shelter' : '센터 방문·만남'}</li><li>${en ? 'Home check' : '가정 환경 확인'}</li><li>${type === 'foster' ? (en ? 'Start fostering' : '임보 시작') : (en ? 'Agreement & welcome home' : '계약·입양')}</li></ol></div></aside></div>`;
    bindForm($('#a-form'), f => {
      const fields = type === 'foster' ? { '가족 구성': f.family, '주거': f.home, '임보 가능 기간': f.period, '동거 동물': f.pets, '이유': f.why } : { '가족 구성': f.family, '주거': f.home, '외출 시간': f.away, '반려 경험': f.exp, '이유': f.why };
      const id = submitInbox(type, { name: f.name, phone: f.phone, email: f.email, animal: a ? a.id : '', fields });
      return { id, title: en ? 'Application received.' : '신청서가 접수됐어요.', desc: en ? `Receipt ${id.toUpperCase()}. We'll call within 3 days.` : `접수 번호 ${id.toUpperCase()} · 3일 안에 전화드릴게요. ${a ? a.name + '에게 곧 소식을 전할게요.' : ''}` };
    });
  }

  /* ── 폼 공통: 검증 → 제출 → 성공 패널 ── */
  function bindForm(form, onSubmit) {
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const bad = $$('[required]', form).filter(el => el.type === 'checkbox' ? !el.checked : !el.value.trim());
      $$('.is-bad', form).forEach(x => x.classList.remove('is-bad'));
      if (bad.length) { bad.forEach(el => (el.closest('.fld') || el.closest('.check') || el).classList.add('is-bad')); bad[0].focus(); toast(en ? 'Please fill the required fields.' : '필수 항목을 채워 주세요'); return; }
      const f = {}; new FormData(form).forEach((v, k) => f[k] = v); $$('input[type="checkbox"]', form).forEach(c => f[c.name] = c.checked);
      const r = onSubmit(f);
      form.innerHTML = `<div class="success"><div class="success-ic" aria-hidden="true">✓</div><h2>${r.title}</h2><p>${r.desc}</p><div class="btn-row"><a class="btn btn-primary" href="adopt.html">${en ? 'Meet more friends' : '다른 친구들 보기'}</a><a class="btn btn-ghost" href="admin.html" target="_blank" rel="noopener">${en ? 'See it in the admin inbox (demo) ↗' : '관리자 접수함에서 확인 (데모) ↗'}</a></div></div>`;
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast(en ? 'Received' : '접수됐어요');
    });
  }

  /* ── 모달 ── */
  function openModal(html) {
    const dim = document.createElement('div'); dim.className = 'modal-dim'; const box = document.createElement('div'); box.className = 'modal'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.innerHTML = html;
    document.body.append(dim, box); requestAnimationFrame(() => { dim.classList.add('show'); box.classList.add('show'); });
    const close = () => { dim.remove(); box.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    dim.addEventListener('click', close); box.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); }); document.addEventListener('keydown', onKey);
    const f = box.querySelector('a, button'); if (f) f.focus();
  }

  const PAGES = { home, about, adopt, animal, activities, post, 'adopt-guide': adoptGuide, volunteer, donate, news, apply };
  document.addEventListener('DOMContentLoaded', () => {
    // EN 모드: placeholder·select option도 교체
    if (isEn()) { $$('[data-en-ph]').forEach(el => el.placeholder = el.dataset.enPh); $$('option[data-en]').forEach(o => o.textContent = o.dataset.en); const fa = $('#filter-active'); if (fa) fa.textContent = 'Filters'; }
    if (PAGES[page]) PAGES[page]();
    C.initReveal(); C.initCount();
    // 모바일에서 플로팅 버튼은 푸터 근처에서 숨김
    const fab = $('.fab'), foot = $('.footer');
    if (fab && foot && 'IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => fab.classList.toggle('hide', e.isIntersecting)), { threshold: 0.05 }).observe(foot);
    if (fab) { const onFab = () => fab.classList.toggle('show', window.scrollY > Math.min(480, window.innerHeight * .6)); onFab(); addEventListener('scroll', onFab, { passive: true }); }
  });
})();
