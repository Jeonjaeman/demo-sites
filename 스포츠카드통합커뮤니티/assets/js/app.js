/* ============================================================
   탑로더 TOPLOADER — 프런트 SPA 로직 (데모)
   - 전역 관심사 필터: localStorage 유지 (요구사항 2-1)
   - 통합 피드 / 이중 말머리 게시판 / 쇼케이스 / 장터 / 시세
   - 글쓰기 2클릭 진입, 스팸 연속등록 제한, 소셜 로그인
   ============================================================ */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const won = n => n.toLocaleString('ko-KR') + '원';

const state = {
  topic: localStorage.getItem('tl_topic') || 'all',   // 전역 관심사 (localStorage 유지)
  view: 'home',
  boardFlair: 'all',
  marketFilter: 'all',
  search: '',
  login: JSON.parse(localStorage.getItem('tl_login') || 'null'),
  liked: new Set(),
  lastPostAt: Number(localStorage.getItem('tl_lastpost') || 0),
  currentPost: null,
};

/* ---------- 토스트 ---------- */
function toast(msg, type = '') {
  const wrap = $('#toastWrap');
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.4s'; setTimeout(() => el.remove(), 400); }, 2600);
}

/* ---------- 시세 틱커 ---------- */
function renderTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]; // 무한 루프용 복제
  $('#tickerTrack').innerHTML = items.map(t => `
    <div class="tick">
      <b>${t.name}</b>
      <span class="price mono">${t.price}</span>
      <span class="chg ${t.up ? 'up' : 'down'}">${t.up && t.chg !== 'LIVE' ? '▲ ' : (t.chg === 'LIVE' ? '● ' : '▼ ')}${t.chg}</span>
    </div>`).join('');
}

/* ---------- 전역 관심사 필터 ---------- */
function bindTopicBar() {
  $$('.chip').forEach(ch => ch.addEventListener('click', () => {
    state.topic = ch.dataset.topic;
    localStorage.setItem('tl_topic', state.topic);          // 재접속 시 유지
    $$('.chip').forEach(c => c.classList.toggle('on', c === ch));
    render();
    const name = ch.dataset.topic === 'all' ? '전체' : TOPICS[ch.dataset.topic].name;
    toast(`🎯 관심사 필터: <b>${name}</b> — 홈·게시판·장터 전체에 적용됩니다`);
  }));
  const cur = $(`.chip[data-topic="${state.topic}"]`);
  if (cur) { $$('.chip').forEach(c => c.classList.remove('on')); cur.classList.add('on'); }
}

const topicFilter = arr => state.topic === 'all' ? arr : arr.filter(p => p.topic === state.topic);

/* ---------- 뷰 전환 ---------- */
function go(view) {
  state.view = view;
  window.scrollTo({ top: view === 'home' ? 0 : $('#appRoot').offsetTop - 130, behavior: 'smooth' });
  $$('.gnb button').forEach(b => b.classList.toggle('on', b.dataset.view === view));
  $$('.mtab').forEach(b => b.classList.toggle('on', b.dataset.view === view));
  render();
}

/* ---------- 게시글 행 템플릿 ---------- */
function postRow(p) {
  const f = FLAIRS[p.flair];
  return `
    <div class="post-row ${p.hot ? 'hot' : ''}" onclick="openPost(${p.id})">
      <span class="flair ${f.cls}">${f.name}</span>
      <span class="topic-dot" data-t="${p.topic}" title="${TOPICS[p.topic].name}"></span>
      <span class="post-title">${p.img ? '<span class="thumb-ico">🖼</span>' : ''}${p.title}<span class="cmt">[${p.cmts}]</span></span>
      <span class="post-meta">
        <span>${p.author}</span>
        <span class="likes ${p.likes >= 40 ? 'hi' : ''}">♥ ${p.likes}</span>
        <span class="time-full">${p.time}</span>
      </span>
    </div>`;
}

/* ---------- 홈 (통합 피드) ---------- */
function viewHome() {
  const posts = topicFilter(POSTS).slice(0, 12);
  const hotShow = topicFilter(POSTS).filter(p => p.flair === 'show' && p.img).slice(0, 3);
  const market = topicFilter(MARKET).filter(m => m.state !== 'done').slice(0, 4);
  return `
    <div class="section-head reveal"><h2>실시간 통합 피드</h2><span class="cnt">${state.topic === 'all' ? '전체' : TOPICS[state.topic].name}</span>
      <span class="more" onclick="go('board')">게시판 전체보기 →</span></div>
    <div class="post-list reveal">${posts.map(postRow).join('')}</div>

    <div class="ad-banner reveal" onclick="toast('📣 광고 슬롯 데모 — 관리자가 수동 등록한 배너입니다 (Phase 1)')">
      <span class="ad-tag">AD</span>
      <div class="ad-banner-ico">🏪</div>
      <div><b>○○카드샵 강남점 — 신탄 박스 입고 완료</b><p>커뮤니티 회원 한정 5% 할인 · 매장 픽업 가능</p></div>
    </div>

    <div class="section-head reveal"><h2>🔥 오늘의 쇼케이스</h2><span class="more" onclick="go('showcase')">더보기 →</span></div>
    <div class="gallery reveal">${hotShow.map(gcard).join('')}</div>

    <div class="section-head reveal" style="margin-top:26px"><h2>⚡ 방금 올라온 매물</h2><span class="more" onclick="go('market')">장터 전체 →</span></div>
    <div class="market-grid reveal">${market.map(mcard).join('')}</div>`;
}

/* ---------- 게시판 ---------- */
function viewBoard() {
  const flairs = [['all','전체'],['free','자유'],['show','쇼케이스'],['qna','질문'],['info','정보']];
  let posts = topicFilter(POSTS);
  if (state.boardFlair !== 'all') posts = posts.filter(p => p.flair === state.boardFlair);
  if (state.search) posts = posts.filter(p => (p.title + p.body).toLowerCase().includes(state.search.toLowerCase()));
  const isGallery = state.boardFlair === 'show';
  return `
    <div class="section-head"><h2>게시판</h2><span class="cnt">${posts.length}개의 글</span></div>
    <div class="subtabs">${flairs.map(([k, n]) =>
      `<button class="subtab ${state.boardFlair === k ? 'on' : ''}" onclick="setBoardFlair('${k}')">${n}</button>`).join('')}</div>
    <div class="searchbar">🔍 <input id="searchInput" placeholder="제목·본문 키워드 검색 (예: PSA, 시세, 그레이딩)" value="${state.search}"></div>
    ${isGallery
      ? `<div class="gallery">${posts.filter(p => p.img).map(gcard).join('')}</div>`
      : `<div class="post-list">${posts.length ? posts.map(postRow).join('') : '<div style="padding:40px;text-align:center;color:var(--ink-faint)">검색 결과가 없습니다</div>'}</div>`}`;
}
function setBoardFlair(k) { state.boardFlair = k; render(); }

/* ---------- 쇼케이스 갤러리 카드 ---------- */
function gcard(p) {
  return `
    <div class="gcard" onclick="openPost(${p.id})">
      <div class="gcard-img"><img src="${p.img}" alt="" loading="lazy"></div>
      <div class="gcard-body">
        <h3>${p.title}</h3>
        <div class="gcard-meta">
          <span class="topic-dot" data-t="${p.topic}"></span><span>${p.author}</span>
          <span class="likes">♥ ${p.likes}</span><span>💬 ${p.cmts}</span>
        </div>
      </div>
    </div>`;
}

function viewShowcase() {
  const posts = topicFilter(POSTS).filter(p => p.flair === 'show' && p.img);
  const all = [...posts, ...posts]; // 데모 볼륨용
  return `
    <div class="section-head"><h2>쇼케이스 갤러리</h2><span class="cnt">자랑은 여기서</span></div>
    <p class="muted" style="margin-bottom:16px;font-size:13.5px">컬렉션 자랑 전용 게시판 — 카드형 갤러리 레이아웃 (요구사항 2-3)</p>
    <div class="gallery">${all.map(gcard).join('')}</div>`;
}

/* ---------- 장터 ---------- */
function mcard(m) {
  const st = { sale: ['판매중', 'mstate-sale'], hold: ['예약중', 'mstate-hold'], done: ['거래완료', 'mstate-done'] }[m.state];
  return `
    <div class="mcard" onclick="openMarket(${m.id})">
      <div class="mcard-img ${m.state === 'done' ? 'done' : ''}">
        <img src="${m.img}" alt="" loading="lazy">
        <span class="mstate ${st[1]}">${st[0]}</span>
        ${m.grade ? `<span class="mgrade">${m.grade}</span>` : ''}
      </div>
      <div class="mcard-body">
        <div class="seller">${m.type === 'buy' ? '🟣 삽니다' : '🔴 팝니다'} · ${m.seller} <span class="trust">거래 ${m.trust}</span></div>
        <h3>${m.title}</h3>
        <div class="mprice mono">${won(m.price)}<small>${m.cond}</small></div>
        <div class="mtags"><span class="mtag">${TOPICS[m.topic].name}</span><span class="mtag">${m.method}</span></div>
      </div>
    </div>`;
}

function viewMarket() {
  const filters = [['all','전체'],['sell','팝니다'],['buy','삽니다'],['sale','판매중만'],['grade','그레이딩만']];
  let items = topicFilter(MARKET);
  if (state.marketFilter === 'sell' || state.marketFilter === 'buy') items = items.filter(m => m.type === state.marketFilter);
  if (state.marketFilter === 'sale') items = items.filter(m => m.state === 'sale');
  if (state.marketFilter === 'grade') items = items.filter(m => m.grade && m.grade !== 'SEALED');
  return `
    <div class="section-head"><h2>장터</h2><span class="cnt">${items.length}건</span></div>
    <div class="ad-banner" style="margin-top:0" onclick="toast('📣 장터 상단 광고 슬롯 (MARKET-A) — 관리자 수동 등록')">
      <span class="ad-tag">AD</span><div class="ad-banner-ico">🛡️</div>
      <div><b>□□스포츠카드 — 위탁판매·그레이딩 대행</b><p>고가 카드 안전거래 대행 · 커뮤니티 회원 수수료 우대</p></div>
    </div>
    <div class="market-toolbar">${filters.map(([k, n]) =>
      `<button class="mfilter ${state.marketFilter === k ? 'on' : ''}" onclick="setMarketFilter('${k}')">${n}</button>`).join('')}
      <span style="margin-left:auto;font-size:12px;color:var(--ink-faint)">💡 모든 거래는 카카오 오픈채팅으로 연결됩니다</span>
    </div>
    <div class="market-grid">${items.map(mcard).join('')}</div>
    <div class="widget" style="margin-top:22px">
      <h3>🛡️ 안전거래 안내</h3>
      <p style="font-size:13px;color:var(--ink-sub);line-height:1.8">
        · 거래 전 <b style="color:var(--ink)">더치트</b>에서 판매자 연락처·계좌를 조회하세요. 프로필의 <b class="up">거래 후기 수</b>를 확인하세요.<br>
        · 고액 거래는 직거래 또는 안전결제를 권장합니다. 시세보다 지나치게 저렴한 매물(급처·반값)은 사기 가능성이 높습니다.<br>
        · 사기 피해 발생 시 우측 하단 신고 버튼으로 제보해 주세요. 24시간 내 조치합니다.
      </p>
    </div>`;
}
function setMarketFilter(k) { state.marketFilter = k; render(); }

/* ---------- 시세 (Phase 2 제안 기능 데모) ---------- */
function viewPrices() {
  return `
    <div class="section-head"><h2>시세 인덱스</h2><span class="cnt">국내 실거래 기반 (데모)</span></div>
    <p class="muted" style="margin-bottom:18px;font-size:13.5px">장터 거래 데이터가 구조화 스키마(가격·상태·거래방식)로 쌓이면, 2차 페이즈에서 이렇게 시세 서비스로 확장됩니다 — 커뮤니티의 핵심 락인(Lock-in) 기능 제안</p>
    <div class="index-cards">
      ${PRICE_INDEX.map((idx, i) => `
        <div class="icard ${idx.up ? 'i-up' : 'i-down'} reveal reveal-d${i}">
          <div class="iname">${idx.name}</div>
          <div class="ival mono">${idx.val}</div>
          <div class="ichg ${idx.up ? 'up' : 'down'}">${idx.up ? '▲' : '▼'} ${idx.chg} <span class="faint">(7일)</span></div>
          <canvas width="120" height="40" data-series="${idx.series.join(',')}" data-up="${idx.up}"></canvas>
        </div>`).join('')}
    </div>
    <div class="price-table reveal">
      <div class="pt-head"><span>#</span><span>카드</span><span style="text-align:right">최근 실거래가</span><span style="text-align:right">7일 변동</span><span style="text-align:right">거래량</span><span>추세</span></div>
      ${PRICE_ROWS.map(r => `
        <div class="pt-row" onclick="toast('📈 카드 상세 시세 차트는 Phase 2 범위입니다 (데모)')">
          <span class="rank">${r.rank}</span>
          <div class="pt-card"><img src="${r.img}" alt=""><div><b>${r.name}</b><span>${r.set}</span></div></div>
          <span class="pt-price mono">${won(r.price)}</span>
          <span class="pt-chg ${r.chg >= 0 ? 'up' : 'down'}">${r.chg >= 0 ? '▲' : '▼'} ${Math.abs(r.chg)}%</span>
          <span style="text-align:right;color:var(--ink-sub)" class="mono">${r.vol}건</span>
          <canvas class="spark" width="54" height="22" data-series="${r.series.join(',')}" data-up="${r.chg >= 0}"></canvas>
        </div>`).join('')}
    </div>`;
}

/* 스파크라인 차트 */
function drawSparks() {
  $$('canvas[data-series]').forEach(cv => {
    const s = cv.dataset.series.split(',').map(Number);
    const up = cv.dataset.up === 'true';
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height, min = Math.min(...s), max = Math.max(...s);
    const x = i => (i / (s.length - 1)) * (W - 4) + 2;
    const y = v => H - 3 - ((v - min) / (max - min || 1)) * (H - 6);
    ctx.clearRect(0, 0, W, H);
    ctx.beginPath();
    s.forEach((v, i) => i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v)));
    ctx.strokeStyle = up ? '#2CE0A7' : '#FF5A6E';
    ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.lineTo(x(s.length - 1), H); ctx.lineTo(x(0), H); ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, up ? 'rgba(44,224,167,.25)' : 'rgba(255,90,110,.25)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fill();
  });
}

/* ---------- 글 상세 ---------- */
function openPost(id) {
  state.currentPost = POSTS.find(p => p.id === id);
  state.view = 'detail';
  window.scrollTo({ top: $('#appRoot').offsetTop - 130, behavior: 'smooth' });
  render();
}

function openMarket(id) {
  const m = MARKET.find(x => x.id === id);
  state.currentPost = { ...m, isMarket: true, flair: m.type, author: m.seller, time: '오늘', cmts: 3, likes: 12, views: 344 };
  state.view = 'detail';
  window.scrollTo({ top: $('#appRoot').offsetTop - 130, behavior: 'smooth' });
  render();
}

function viewDetail() {
  const p = state.currentPost;
  if (!p) return viewHome();
  const f = FLAIRS[p.flair];
  const liked = state.liked.has(p.id);
  return `
    <div class="back-btn" onclick="go('${p.isMarket ? 'market' : 'board'}')">← 목록으로</div>
    <div class="detail">
      <div class="detail-head">
        <div class="detail-flair">
          <span class="flair ${f.cls}">${f.name}</span>
          <span class="topic-dot" data-t="${p.topic}"></span>
          <span style="font-size:12px;color:var(--ink-faint)">${TOPICS[p.topic].name}</span>
        </div>
        <h1>${p.title}</h1>
        <div class="detail-meta">
          <span class="author"><span class="av">${p.author[0]}</span>${p.author}${p.isMarket ? `<span class="up" style="font-size:11px">거래후기 ${p.trust}</span>` : ''}</span>
          <span>${p.time}</span><span>조회 ${p.views || 344}</span>
        </div>
      </div>
      ${p.isMarket ? `
        <div class="trade-panel">
          <div class="trade-cell"><b>${p.type === 'buy' ? '구매 희망가' : '판매가'}</b><span class="price-big mono">${won(p.price)}</span></div>
          <div class="trade-cell"><b>카드 상태</b><span>${p.cond}</span></div>
          <div class="trade-cell"><b>거래 방식</b><span>${p.method}</span></div>
          <button class="btn-openchat" onclick="toast('💬 카카오 오픈채팅으로 이동합니다 (데모) — 자체 쪽지 없이 오픈채팅 연결 (요구사항 2-4)','ok')">
            💬 카카오 오픈채팅으로 거래 문의
          </button>
          <div class="trade-safety">🛡️ 거래 전 <a href="javascript:void(0)" onclick="toast('🔎 더치트 사기조회 연동 지점 (데모)')">더치트 사기이력 조회</a> 를 권장합니다 · 판매자 거래후기 <b class="up" style="margin:0 3px">${p.trust}건</b> 확인</div>
        </div>` : ''}
      <div class="detail-body">
        ${(p.desc || p.body || '').split('\n').map(t => t.trim() ? `<p>${t}</p>` : '').join('')}
        ${p.img ? `<img src="${p.img}" alt="">` : ''}
      </div>
      <div class="detail-actions">
        <button class="btn-like ${liked ? 'on' : ''}" onclick="toggleLike(${p.id})">♥ 좋아요 <span class="mono">${(p.likes || 0) + (liked ? 1 : 0)}</span></button>
        <button class="btn-report" onclick="toast('🚨 신고가 접수되었습니다. 관리자가 검토합니다 (요구사항 2-3 신고 저장)','err')">신고</button>
      </div>
    </div>
    <div class="comments">
      <div class="section-head" style="margin-top:22px"><h2>댓글 ${p.cmts || 3}</h2></div>
      <div class="post-list" style="padding:4px 18px">
        ${COMMENTS.default.map(c => `
          <div class="comment">
            <span class="av" style="background:${c.color}">${c.who[0]}</span>
            <div class="comment-body">
              <div class="who">${c.who}<span>${c.time}</span></div>
              <p>${c.text}</p>
              <div class="c-actions"><button onclick="toast('↳ 대댓글 입력창이 열립니다 (데모)')">답글</button><button>♥ 좋아요</button></div>
            </div>
          </div>
          ${c.reply ? `
          <div class="comment reply">
            <span class="av" style="background:#3E7BFF;color:#fff">${c.reply.who[0]}</span>
            <div class="comment-body">
              <div class="who">${c.reply.who}<span>${c.reply.time}</span></div>
              <p>${c.reply.text}</p>
            </div>
          </div>` : ''}`).join('')}
      </div>
      <div class="comment-write">
        <input id="cmtInput" placeholder="${state.login ? '따뜻한 댓글을 남겨주세요' : '댓글을 쓰려면 소셜 로그인이 필요합니다'}" ${state.login ? '' : 'onclick="openLogin()" readonly'}>
        <button onclick="submitComment()">등록</button>
      </div>
    </div>`;
}

function toggleLike(id) {
  if (!state.login) return openLogin();
  state.liked.has(id) ? state.liked.delete(id) : state.liked.add(id);
  render();
}

function submitComment() {
  if (!state.login) return openLogin();
  const v = $('#cmtInput')?.value.trim();
  if (!v) return toast('댓글 내용을 입력해주세요', 'err');
  COMMENTS.default.push({ who: state.login.nick, time: '방금 전', text: v, color: '#3E7BFF' });
  if (state.currentPost) state.currentPost.cmts = (state.currentPost.cmts || 0) + 1;
  render();
  toast('💬 댓글이 등록되었습니다', 'ok');
}

/* ---------- 렌더 ---------- */
function render() {
  const views = { home: viewHome, board: viewBoard, showcase: viewShowcase, market: viewMarket, prices: viewPrices, detail: viewDetail };
  $('#appRoot').innerHTML = (views[state.view] || viewHome)();
  drawSparks();
  observeReveals();
  const si = $('#searchInput');
  if (si) {
    si.addEventListener('input', e => { state.search = e.target.value; refreshBoardList(); });
    si.focus(); si.setSelectionRange(si.value.length, si.value.length);
  }
  renderSidebar();
}

/* 검색 시 리스트만 부분 갱신 (포커스 유지) */
function refreshBoardList() {
  let posts = topicFilter(POSTS);
  if (state.boardFlair !== 'all') posts = posts.filter(p => p.flair === state.boardFlair);
  if (state.search) posts = posts.filter(p => (p.title + p.body).toLowerCase().includes(state.search.toLowerCase()));
  const list = $('#appRoot .post-list');
  if (list) list.innerHTML = posts.length ? posts.map(postRow).join('') : '<div style="padding:40px;text-align:center;color:var(--ink-faint)">검색 결과가 없습니다</div>';
}

/* ---------- 사이드바 ---------- */
function renderSidebar() {
  const side = $('#sideCol');
  if (!side) return;
  const hot = [...topicFilter(POSTS)].sort((a, b) => b.likes - a.likes).slice(0, 7);
  side.innerHTML = `
    <div class="widget">
      <h3>실시간 인기글 <span class="live">LIVE</span></h3>
      ${hot.map((p, i) => `
        <div class="rank-item" onclick="openPost(${p.id})">
          <span class="rank-num">${i + 1}</span>
          <span class="rank-title">${p.title}</span>
          <span class="rank-meta">♥${p.likes}</span>
        </div>`).join('')}
    </div>
    <div class="widget">
      <h3>📈 실거래 시세 <span style="margin-left:auto;font-size:11px;color:var(--accent);cursor:pointer" onclick="go('prices')">전체보기</span></h3>
      ${PRICE_ROWS.slice(0, 4).map(r => `
        <div class="price-item">
          <img class="price-thumb" src="${r.img}" alt="">
          <div class="price-info"><b>${r.name}</b><span>${r.set}</span></div>
          <canvas class="spark" width="54" height="22" data-series="${r.series.join(',')}" data-up="${r.chg >= 0}"></canvas>
          <div class="price-val"><b class="mono">${(r.price / 10000).toFixed(0)}만</b><span class="${r.chg >= 0 ? 'up' : 'down'}">${r.chg >= 0 ? '+' : ''}${r.chg}%</span></div>
        </div>`).join('')}
    </div>
    <div class="ad-slot" onclick="toast('📣 사이드바 광고 슬롯 (SIDE-A) — Phase 1: 관리자 수동 등록')">
      <span class="ad-tag">AD</span>
      <b>△△그레이딩<br>여름 이벤트 접수</b>
      <p>10장 이상 접수 시 장당 15% 할인<br>커뮤니티 회원 전용 코드 제공</p>
      <span class="ad-cta">자세히 보기 →</span>
    </div>
    <div class="widget">
      <h3>🏪 내 매장·딜러 광고</h3>
      <p style="font-size:12.5px;color:var(--ink-sub);line-height:1.7">월 12만원부터 커뮤니티 타겟 광고를 시작하세요. 콜렉터에게 바로 닿습니다.</p>
      <button class="btn-sm primary" style="margin-top:12px;width:100%;padding:10px" onclick="toast('📩 광고 문의 — Phase 2에서 광고주 셀프 등록으로 확장됩니다')">광고 문의하기</button>
    </div>`;
  drawSparks();
}

/* ---------- 로그인 (소셜 온리 — 요구사항 2-1) ---------- */
function openLogin() { $('#loginModal').classList.add('show'); }
function closeLogin() { $('#loginModal').classList.remove('show'); }
function socialLogin(provider) {
  const nicks = { kakao: '카카오콜렉터', naver: '네이버수집가', google: '구글탑로더' };
  state.login = { nick: nicks[provider], provider };
  localStorage.setItem('tl_login', JSON.stringify(state.login));
  closeLogin();
  updateAuthUI();
  toast(`✅ <b>${nicks[provider]}</b>님 환영합니다! (${provider} OAuth 연동 지점 — 데모 원클릭)`, 'ok');
}
function logout() {
  state.login = null;
  localStorage.removeItem('tl_login');
  updateAuthUI();
  toast('로그아웃 되었습니다');
}
function updateAuthUI() {
  const box = $('#authBox');
  box.innerHTML = state.login
    ? `<div class="avatar-mini" title="${state.login.nick} (클릭 시 로그아웃)" onclick="logout()">${state.login.nick[0]}</div>
       <button class="btn-write" onclick="openWrite()">✏️ 글쓰기</button>`
    : `<button class="btn-login" onclick="openLogin()">로그인</button>
       <button class="btn-write" onclick="openWrite()">✏️ 글쓰기</button>`;
}

/* ---------- 글쓰기 (2클릭 진입 + 이중 말머리 + 스팸 제한) ---------- */
const writeState = { flair: null, topic: null };
function openWrite() {
  if (!state.login) { openLogin(); toast('글쓰기는 소셜 로그인 후 이용할 수 있어요'); return; }
  writeState.flair = null; writeState.topic = null;
  $$('#writeModal .pick').forEach(p => p.classList.remove('on'));
  $('#tradeFields').classList.add('hide');
  $('#aiScanResult').classList.add('hide');
  $('#writeModal').classList.add('show');
}
function closeWrite() { $('#writeModal').classList.remove('show'); }

function pickFlair(el) {
  writeState.flair = el.dataset.v;
  $$('#flairPick .pick').forEach(p => p.classList.toggle('on', p === el));
  // 장터 말머리 선택 시 구조화 입력폼 노출 (요구사항 2-4)
  $('#tradeFields').classList.toggle('hide', !['sell', 'buy'].includes(el.dataset.v));
}
function pickTopic(el) {
  writeState.topic = el.dataset.v;
  $$('#topicPick .pick').forEach(p => p.classList.toggle('on', p === el));
}

/* AI 카드 인식 시뮬레이션 (요구사항 2-5 협의 기능) */
function simulateAIScan() {
  const zone = $('#uploadZone');
  zone.innerHTML = '<span class="spin" style="display:inline-block;width:15px;height:15px;border:2px solid rgba(138,92,255,.3);border-top-color:#B79CFF;border-radius:50%;animation:spin .8s linear infinite;vertical-align:-3px"></span> 이미지 업로드 중…';
  setTimeout(() => {
    zone.innerHTML = '🖼 card_photo_01.jpg 업로드 완료 · <b style="color:var(--up)">AI 인식 성공</b>';
    const r = $('#aiScanResult');
    r.classList.remove('hide');
    r.innerHTML = `<div class="spin"></div><div>🤖 <b>AI 카드 인식</b> — "피카츄 VMAX 홀로 (프로모)" 로 인식됨 · 최근 실거래가 <b>48만원</b> · 제목/카테고리 자동 입력 완료</div>`;
    setTimeout(() => { r.querySelector('.spin').remove(); }, 900);
    $('#wTitle').value = '피카츄 VMAX 홀로 PSA 10 판매합니다';
    const pk = $('#topicPick .pick[data-v="pokemon"]');
    if (pk) pickTopic(pk);
    toast('🤖 클라우드 비전 API 연동 지점 — 카드 자동 인식 (협의 기능 데모)', 'ok');
  }, 1100);
}

function submitPost() {
  // 이중 말머리 필수 검증 (요구사항 2-3)
  if (!writeState.flair) return toast('말머리(게시판 성격)를 선택해주세요', 'err');
  if (!writeState.topic) return toast('주제 태그를 선택해주세요', 'err');
  if (!$('#wTitle').value.trim()) return toast('제목을 입력해주세요', 'err');
  // 스팸 방지: 60초 내 연속 등록 제한 (요구사항 2-1)
  const now = Date.now();
  if (now - state.lastPostAt < 60000) {
    return toast(`🚫 도배 방지: ${Math.ceil((60000 - (now - state.lastPostAt)) / 1000)}초 후에 다시 등록할 수 있어요`, 'err');
  }
  state.lastPostAt = now;
  localStorage.setItem('tl_lastpost', String(now));
  const isTrade = ['sell', 'buy'].includes(writeState.flair);
  const newPost = {
    id: Date.now(), flair: isTrade ? writeState.flair : writeState.flair, topic: writeState.topic,
    title: $('#wTitle').value.trim(), author: state.login.nick, time: '방금 전',
    cmts: 0, likes: 0, views: 1, body: $('#wBody').value.trim() || '(본문 없음)',
  };
  if (isTrade) {
    MARKET.unshift({
      ...newPost, type: writeState.flair, price: Number($('#wPrice').value) || 0,
      cond: $('#wCond').value, method: $('#wMethod').value, state: 'sale',
      seller: state.login.nick, trust: 1, img: IMG.cardMonster, grade: null, desc: newPost.body,
    });
    closeWrite(); go('market');
  } else {
    POSTS.unshift(newPost);
    closeWrite(); go(writeState.flair === 'show' ? 'showcase' : 'board');
  }
  toast('✅ 글이 등록되었습니다 (DB 저장 지점 — 데모는 세션 메모리)', 'ok');
}

/* ---------- 스크롤 인터랙션 ---------- */
function observeReveals() {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .08 });
  $$('.reveal:not(.in)').forEach(el => io.observe(el));
}

/* 히어로 카운트업 */
function countUp() {
  $$('.hstat b[data-n]').forEach(el => {
    const target = Number(el.dataset.n);
    const suffix = el.dataset.suffix || '';
    const t0 = performance.now(), dur = 1600;
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * ease).toLocaleString('ko-KR') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* 히어로 패럴랙스 */
function bindParallax() {
  const bg = $('.hero-bg');
  if (!bg) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < 700) bg.style.transform = `scale(1.08) translateY(${y * .18}px)`;
  }, { passive: true });
}

/* ---------- 초기화 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderTicker();
  bindTopicBar();
  updateAuthUI();
  render();
  bindParallax();

  $$('.gnb button, .mtab').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));

  // 히어로 카운트업은 뷰포트 진입 시
  const hs = $('.hero-stats');
  if (hs) new IntersectionObserver((es, io) => {
    if (es[0].isIntersecting) { countUp(); io.disconnect(); }
  }, { threshold: .4 }).observe(hs);

  // 모달 바깥 클릭 닫기
  $$('.modal-back').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal-back').forEach(m => m.classList.remove('show')); });
});
