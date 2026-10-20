/* 게시판 공통 — overseas.html · domestic.html (지역 탭 × 분류 칩 × 목록 × 잠금) */
(function () {
  const { $, $$, esc, D, q, img, posts, postCard, mountShell, stagger, me, canReadBody, state } = NP;
  const boardKey = document.body.dataset.board;
  const B = D.boards[boardKey];
  mountShell({ tab: B.page, fab: true, title: B.name });

  let region = q.get('region') || B.regions[0].key;
  let cat = q.get('cat') || '';
  let page = 1; const PER = 8;
  const app = $('#app');

  const RULES = {
    jeongseon: { title: '정선·하이원 게시판 규칙', ok: ['숙소·셔틀·교통·주차 정보', '주변 맛집·관광(레일바이크·곤돌라·장터)', '여행 일정·동행 질문'], no: ['베팅 전략·게임 노하우·「출입일수」 이야기', '온라인카지노·바카라사이트·가입코드·환전', '급전·당일대출·차량담보 등 대출 호객', '전화번호·텔레그램·오픈채팅 연락처'], foot: '도박 문제로 힘드시면 상담전화 1336(24시간·무료)으로 연락하세요. 강원랜드를 사칭한 온라인카지노 광고는 전부 불법입니다.' },
    macau: { title: '마카오 게시판 규칙', ok: ['리조트·호텔·셔틀·페리 정보', '세나도 광장·타이파 맛집·관광', '환율·유심·교통'], no: ['카지노 게임 후기·베팅 전략', '온라인카지노·가입코드 안내', '밤문화·유흥 알선'], foot: '해외 카지노 이용도 내국인에게는 처벌 대상이 될 수 있습니다. 여행 정보만 나눠 주세요.' },
    philippines: { title: '필리핀 게시판 규칙', ok: ['세부·보홀·마닐라 숙소·투어·교통', '맛집·마사지·쇼핑', '여행 안전·유심·환전'], no: ['카지노 게임 후기·베팅 전략', '온라인카지노·가입코드 안내', '밤문화·유흥 알선·연락처'], foot: '유흥 알선 글은 성매매처벌법상 광고로 처벌될 수 있어 즉시 삭제됩니다.' },
  };

  function render() {
    const R = B.regions.find(r => r.key === region);
    const acc = me().acc;
    const list = posts({ board: boardKey, region, cat: cat || undefined });
    const lock = R.casino && (acc.key === 'self' || acc.key === 'guest');
    const rule = RULES[region];
    $('#board-body').innerHTML = `
      <figure class="cover rv"><img src="${img(R.cover)}" alt=""><figcaption class="cover-txt"><div><h2>${esc(R.name)}</h2><p>회원 <b data-cu="${R.members}">0</b>명 · 글 ${list.length}건</p></div></figcaption></figure>
      <div class="seg seg-3" role="tablist" aria-label="여행지" style="margin-top:14px">${B.regions.map(r => `<button role="tab" data-region="${r.key}" aria-pressed="${r.key === region}">${esc(r.name)}</button>`).join('')}</div>
      ${rule ? `<details class="rules rv" id="rules" ${q.get('rules') || location.hash === '#rules' ? 'open' : ''}><summary><svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/></svg>${esc(rule.title)}</summary><div class="rules-body"><strong class="ok">이런 글은 환영합니다</strong><ul>${rule.ok.map(x => `<li>${esc(x)}</li>`).join('')}</ul><strong class="no">이런 글은 등록 전에 걸리고, 올라와도 삭제됩니다</strong><ul>${rule.no.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p style="margin:0;color:var(--sub)">${rule.foot}</p>${region==="jeongseon" ? `<a class="tel" href="tel:1336"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>도박문제 상담 1336</a>` : ``}</div></details>` : ''}
      <div class="chips" role="tablist" aria-label="분류" style="margin-top:10px"><button class="chip" role="tab" data-cat="" aria-pressed="${!cat}">전체</button>${B.cats.map(c => `<button class="chip" role="tab" data-cat="${c.key}" aria-pressed="${c.key === cat}">${esc(c.name)}</button>`).join('')}</div>
      ${lock ? `<div class="lock-card rv"><h3>${acc.key === 'guest' ? '회원만 본문을 볼 수 있습니다' : '본인확인이 필요한 게시판입니다'}</h3><p>${acc.key === 'guest' ? '성인 전용 커뮤니티라 제목만 보여 드립니다. 가입하면 본문·사진·댓글을 볼 수 있습니다.' : '카지노가 있는 지역 게시판은 <strong>휴대폰·간편 본인확인</strong>을 마친 성인 회원만 본문을 볼 수 있습니다. 생년월일만 입력한 자기신고 회원은 목록·제목까지 볼 수 있습니다.'}</p><div style="display:flex;gap:8px"><a class="btn btn-primary" href="${acc.key === 'guest' ? 'signup.html' : 'signup.html?step=3&verify=1'}">${acc.key === 'guest' ? '가입하고 보기' : '본인확인하고 열기'}</a><a class="btn btn-ghost" href="my.html#account">체험 계정 바꾸기</a></div></div>` : ''}
      <div class="result-count">${cat ? esc(B.cats.find(c => c.key === cat).name) + ' ' : ''}${list.length}건 · 최신순</div>
      <div class="list" id="list"></div>
      <div class="pager" id="pager"></div>`;
    renderList(list);
    $$('[data-cu]').forEach(el => NP.countUp(el, +el.dataset.cu, 800));
    $$('[data-region]').forEach(b => b.onclick = () => { region = b.dataset.region; page = 1; history.replaceState(null, '', `?region=${region}${cat ? '&cat=' + cat : ''}`); render(); window.scrollTo({ top: 0 }); });
    $$('[data-cat]').forEach(b => b.onclick = () => { cat = b.dataset.cat; page = 1; history.replaceState(null, '', `?region=${region}${cat ? '&cat=' + cat : ''}`); render(); });
    NP.reveal();
  }
  function renderList(list) {
    const shown = list.slice(0, page * PER);
    $('#list').innerHTML = shown.map(p => postCard(p)).join('') || `<div class="empty"><strong>아직 글이 없습니다</strong>이 분류의 첫 글을 올려 보세요<br><a class="btn btn-soft" style="margin-top:14px" href="write.html?board=${boardKey}&region=${region}&cat=${cat}">글쓰기</a></div>`;
    stagger($('#list'));
    $('#pager').innerHTML = list.length > shown.length ? `<button class="btn btn-ghost btn-block" id="more">더 보기 (${list.length - shown.length}건 남음)</button>` : (list.length > PER ? '<p class="lead" style="font-size:.85rem">마지막 글입니다</p>' : '');
    const m = $('#more'); if (m) m.onclick = () => { page++; renderList(list); };
  }
  render();
  document.addEventListener('np:refresh', render);
  const fab = $('.fab'); if (fab) fab.href = `write.html?board=${boardKey}&region=${region}`;
})();
