/* NOLPAN 놀판 — 공통 셸·상태·기능 (의존성 0) */
(function () {
  'use strict';
  const D = window.NP_DATA;
  const LS = 'nolpan.';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const load = (k, d) => { try { const v = localStorage.getItem(LS + k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch { } };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────── 상태 ───────── */
  const state = {
    text: load('text', 0),                 // 0 기본 · 1 크게 · 2 더 크게
    account: load('account', 'verified'),  // verified | self | biz | guest
    appFrame: load('appFrame', false),
    posts: load('posts', []),              // 사용자가 쓴 글
    comments: load('comments', []),
    likes: load('likes', {}),              // {postId: true}
    blocked: load('blocked', []),          // [uid]
    reports: load('reports', {}),          // {postId: reasonKey}
    read: load('read', []),                // 읽은 알림 id
    deletedComments: load('deletedComments', []),
    profile: load('profile', {}),          // {nick, color}
    ageMode: load('ageMode', 'youth'),     // youth(청소년보호법) | civil(민법)
    hideSponsored: load('hideSponsored', false),
    textSystem: load('textSystem', false),
  };
  const me = () => {
    const acc = D.demoAccounts.find(a => a.key === state.account) || D.demoAccounts[0];
    const u = acc.uid ? D.users.find(u => u.id === acc.uid) : null;
    return { acc, user: u ? Object.assign({}, u, state.profile) : null };
  };

  /* ───────── 글자 크기 ───────── */
  const TEXT_STEPS = [{ key: 0, label: '기본', px: 17 }, { key: 1, label: '크게', px: 19 }, { key: 2, label: '더 크게', px: 21 }];
  function applyText() {
    document.documentElement.dataset.text = String(state.text);
    document.documentElement.style.setProperty('--fs-base', TEXT_STEPS[state.text].px + 'px');
    $$('[data-text-step]').forEach(b => { const on = +b.dataset.textStep === state.text; b.setAttribute('aria-pressed', on); });
    $$('[data-text-label]').forEach(e => e.textContent = TEXT_STEPS[state.text].label);
  }
  function setText(n) { state.text = Math.max(0, Math.min(2, n)); save('text', state.text); applyText(); toast(`글자 크기: ${TEXT_STEPS[state.text].label} (본문 ${TEXT_STEPS[state.text].px}px)`); }
  applyText();

  /* ───────── 앱 화면(edge-to-edge) 토글 ───────── */
  function applyFrame() {
    document.documentElement.dataset.app = state.appFrame ? '1' : '0';
    document.documentElement.style.setProperty('--sat', state.appFrame ? '34px' : '0px');
    document.documentElement.style.setProperty('--sab', state.appFrame ? '24px' : '0px');
    $$('[data-app-toggle]').forEach(b => b.setAttribute('aria-pressed', state.appFrame));
  }
  applyFrame();

  /* ───────── 유틸 ───────── */
  const NOW = new Date('2026-10-20T09:30:00+09:00');
  function ago(iso) {
    const d = new Date(iso), diff = (NOW - d) / 1000;
    if (diff < 60) return '방금'; if (diff < 3600) return Math.floor(diff / 60) + '분 전';
    if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
    const days = Math.floor(diff / 86400); if (days < 7) return days + '일 전';
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }
  const fmt = (n) => n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, '') + '만' : String(n);
  const user = (id) => (id === 'me' ? me().user : D.users.find(u => u.id === id)) || { nick: '탈퇴한 회원', color: '#9a9a9a', level: 'gone' };
  function avatar(u, size = 40) {
    const n = (u.nick || '?').trim(); const ch = n ? n[0] : '?';
    if (u.photo) return `<span class="avatar" style="--av:${u.color};width:${size}px;height:${size}px" aria-hidden="true"><img src="${u.photo}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%"></span>`;
    return `<span class="avatar" style="--av:${u.color};width:${size}px;height:${size}px;font-size:${Math.round(size * .42)}px" aria-hidden="true">${esc(ch)}</span>`;
  }
  const badge = (u) => u.level === 'biz' ? '<span class="badge badge-biz">업체</span>' : u.level === 'self' ? '<span class="badge badge-self">자기신고</span>' : u.level === 'verified' ? '<span class="badge badge-ok">성인확인</span>' : '';
  const boardOf = (p) => D.boards[p.board];
  const regionOf = (p) => boardOf(p).regions.find(r => r.key === p.region);
  const catOf = (p) => boardOf(p).cats.find(c => c.key === p.cat);
  const crumb = (p) => [boardOf(p).name, regionOf(p)?.name, catOf(p)?.name].filter(Boolean).join(' · ');
  const img = (key) => key && key.startsWith('data:') ? key : D.IMG + key + '.webp';

  /* ───────── 데이터 접근 (사용자 작성분 병합·차단·상태 반영) ───────── */
  function allPosts() {
    const mine = state.posts.map(p => Object.assign({}, p, { uid: 'me', mine: true }));
    return mine.concat(D.posts).map(p => Object.assign({}, p, { likes: p.likes + (state.likes[p.id] ? 1 : 0), reported: (p.reported || 0) + (state.reports[p.id] ? 1 : 0), status: p.status || (state.reports[p.id] ? 'reported' : 'ok') }));
  }
  const visible = (p) => !state.blocked.includes(p.uid);
  function posts(filter = {}) {
    let list = allPosts().filter(visible);
    if (filter.board) list = list.filter(p => p.board === filter.board);
    if (filter.region) list = list.filter(p => p.region === filter.region);
    if (filter.cat) list = list.filter(p => p.cat === filter.cat);
    if (filter.hideSponsored) list = list.filter(p => !p.sponsored);
    if (filter.excludeReview) list = list.filter(p => p.status !== 'review');
    return list.sort((a, b) => new Date(b.at) - new Date(a.at));
  }
  const post = (id) => allPosts().find(p => String(p.id) === String(id));
  function commentsOf(pid) {
    const mine = state.comments.filter(c => String(c.post) === String(pid)).map(c => Object.assign({}, c, { uid: 'me', mine: true }));
    return D.comments.filter(c => String(c.post) === String(pid)).concat(mine).filter(c => !state.blocked.includes(c.uid)).map(c => Object.assign({}, c, { deleted: state.deletedComments.includes(c.id) }));
  }
  const commentCount = (pid) => commentsOf(pid).filter(c => !c.deleted).length;
  function hotPosts(limit = 8) {
    // 실제 계산: 48시간 내 글, 점수 = 좋아요×3 + 댓글×4 + 조회/50, 광고 글은 토글에 따라 제외, 검토 중 제외
    return posts({ hideSponsored: state.hideSponsored, excludeReview: true })
      .filter(p => (NOW - new Date(p.at)) / 36e5 <= 48)
      .map(p => Object.assign({}, p, { score: p.likes * 3 + commentCount(p.id) * 4 + Math.round(p.views / 50) }))
      .sort((a, b) => b.score - a.score).slice(0, limit);
  }
  const canReadBody = (p) => {
    const { acc } = me(); const r = regionOf(p);
    if (acc.key === 'guest') return { ok: false, why: 'guest' };
    if (r && r.casino && acc.key === 'self') return { ok: false, why: 'self' };
    return { ok: true };
  };

  /* ───────── 작성 가드 ───────── */
  function guardCheck(text) {
    const hits = [];
    const lower = text.toLowerCase();
    D.guard.block.forEach(g => g.words.forEach(w => { if (lower.includes(w.toLowerCase())) hits.push({ level: 'block', cat: g.cat, word: w }); }));
    D.guard.warn.forEach(g => {
      if (g.words) g.words.forEach(w => { if (lower.includes(w.toLowerCase())) hits.push({ level: 'warn', cat: g.cat, word: w }); });
      if (g.pattern) { const m = text.match(g.pattern); if (m) hits.push({ level: 'warn', cat: g.cat, word: m[0] }); }
    });
    // 단축 URL·외부 링크 패턴
    const urls = text.match(/https?:\/\/[^\s]+/gi) || [];
    urls.forEach(u => { if (/bit\.ly|han\.gl|url\.kr|t\.me|tinyurl/i.test(u)) hits.push({ level: 'block', cat: '외부 메신저·단축 URL 유도', word: u }); });
    const level = hits.some(h => h.level === 'block') ? 'block' : hits.length ? 'warn' : 'ok';
    return { level, hits };
  }
  function highlight(text, hits) {
    let html = esc(text);
    hits.forEach(h => { const re = new RegExp(esc(h.word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); html = html.replace(re, m => `<mark class="g-${h.level}">${m}</mark>`); });
    return html.replace(/\n/g, '<br>');
  }

  /* ───────── 연령 판정 ───────── */
  function ageJudge(y, m, d, mode = state.ageMode, today = NOW) {
    const birth = new Date(y, m - 1, d);
    if (isNaN(birth) || y < 1900 || birth > today) return { valid: false };
    let full = today.getFullYear() - y; if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) full--;
    const yearAge = today.getFullYear() - y; // 연 나이
    const adult = mode === 'youth' ? yearAge >= 19 : full >= 19;
    const sinceYouth = `${y + 19}년 1월 1일`;
    return { valid: true, full, yearAge, adult, mode, text: mode === 'youth' ? `청소년보호법 기준 ${adult ? '성인' : '청소년'} (${y + 19}년 1월 1일부터 성인) · 만 ${full}세` : `민법 기준 ${adult ? '성년' : '미성년'} (만 19세 생일 기준) · 만 ${full}세`, sinceYouth };
  }

  /* ───────── UI: 토스트·시트 ───────── */
  let toastT;
  function toast(msg, kind = '') {
    let t = $('#np-toast'); if (!t) { t = document.createElement('div'); t.id = 'np-toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    t.textContent = msg; t.className = 'show ' + kind; clearTimeout(toastT); toastT = setTimeout(() => t.className = '', 2600);
  }
  function sheet(html, opts = {}) {
    closeSheet();
    const wrap = document.createElement('div'); wrap.className = 'sheet-wrap'; wrap.innerHTML = `<div class="sheet-bg"></div><div class="sheet" role="dialog" aria-modal="true" ${opts.label ? `aria-label="${esc(opts.label)}"` : ''}><div class="sheet-grip" aria-hidden="true"></div>${html}</div>`;
    document.body.appendChild(wrap); document.body.classList.add('no-scroll');
    requestAnimationFrame(() => wrap.classList.add('in'));
    wrap.querySelector('.sheet-bg').addEventListener('click', closeSheet);
    wrap.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });
    const f = wrap.querySelector('button,[href],input,select,textarea'); if (f) setTimeout(() => f.focus(), 60);
    return wrap;
  }
  function closeSheet() { const w = $('.sheet-wrap'); if (!w) return; w.classList.remove('in'); document.body.classList.remove('no-scroll'); setTimeout(() => w.remove(), reduce ? 0 : 220); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  /* ───────── 외부 링크 경고 ───────── */
  function externalLink(url) {
    const host = (() => { try { return new URL(url).host; } catch { return url; } })();
    sheet(`<h3 class="sheet-title">놀판 밖 사이트로 이동합니다</h3>
      <p class="sheet-host">${esc(host)}</p>
      <div class="notice notice-warn"><strong>강원랜드를 사칭한 온라인카지노 광고는 불법입니다.</strong> 가입코드·첫 충전 보너스·환전을 안내하는 사이트라면 열지 말고 신고해 주세요. 도박문제 상담 <a href="tel:1336">1336</a></div>
      <div class="sheet-actions"><button class="btn btn-ghost" data-close>돌아가기</button><button class="btn btn-primary" id="ext-go">그래도 열기</button></div>`, { label: '외부 링크 경고' });
    $('#ext-go').onclick = () => { closeSheet(); toast('데모에서는 외부 사이트를 열지 않습니다'); };
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="http"]'); if (!a || a.dataset.allow) return;
    e.preventDefault(); externalLink(a.href);
  });

  /* ───────── 신고·차단 ───────── */
  function reportSheet(target) { // target: {type:'post'|'comment', id, uid}
    const u = user(target.uid);
    const reasons = D.reportReasons.map((r, i) => `<label class="radio-row"><input type="radio" name="rr" value="${r.key}" ${i === 0 ? 'checked' : ''}><span><strong>${esc(r.label)}</strong><small>${esc(r.desc)}</small></span></label>`).join('');
    const w = sheet(`<h3 class="sheet-title">${target.type === 'post' ? '게시글' : '댓글'} 신고</h3><p class="sheet-sub">${esc(u.nick)} 님의 ${target.type === 'post' ? '글' : '댓글'} · 사유를 골라 주세요</p>
      <div class="radio-list">${reasons}</div>
      <div class="sheet-actions"><button class="btn btn-ghost" data-close>취소</button><button class="btn btn-danger" id="rp-go">신고하기</button></div>`, { label: '신고' });
    $('#rp-go', w).onclick = () => {
      const key = w.querySelector('input[name=rr]:checked').value; const label = D.reportReasons.find(r => r.key === key).label;
      if (target.type === 'post') { state.reports[target.id] = key; save('reports', state.reports); }
      sheet(`<div class="done-ico" aria-hidden="true">✓</div><h3 class="sheet-title">신고가 접수되었습니다</h3>
        <p class="sheet-sub">사유: ${esc(label)}<br>운영진이 <strong>24시간 안에</strong> 확인합니다. 신고가 2건 이상 쌓이면 검토가 끝날 때까지 글이 가려집니다.</p>
        <div class="sheet-actions col"><button class="btn btn-danger-ghost" id="rp-block">${esc(u.nick)} 님 차단하기</button><button class="btn btn-primary" data-close>확인</button></div>`, { label: '신고 접수' });
      $('#rp-block').onclick = () => { block(target.uid); closeSheet(); };
    };
  }
  function block(uid) {
    if (uid === 'me') return toast('내 계정은 차단할 수 없습니다');
    if (!state.blocked.includes(uid)) { state.blocked.push(uid); save('blocked', state.blocked); }
    toast(`${user(uid).nick} 님을 차단했습니다. 이 회원의 글·댓글이 보이지 않습니다`);
    document.dispatchEvent(new CustomEvent('np:refresh'));
  }
  function unblock(uid) { state.blocked = state.blocked.filter(x => x !== uid); save('blocked', state.blocked); toast('차단을 해제했습니다'); document.dispatchEvent(new CustomEvent('np:refresh')); }
  function moreSheet(target) {
    const p = target.type === 'post' ? post(target.id) : null;
    const mine = target.uid === 'me';
    const u = user(target.uid);
    const w = sheet(`<ul class="menu-list">
      ${mine ? `<li><button data-act="edit">수정</button></li><li><button data-act="del" class="danger">삭제</button></li>` : `<li><button data-act="share">링크 복사</button></li><li><button data-act="report" class="danger">신고</button></li><li><button data-act="block" class="danger">${esc(u.nick)} 님 차단</button></li>`}
      <li><button data-close>닫기</button></li></ul>`, { label: '더보기' });
    w.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const act = b.dataset.act; closeSheet();
      if (act === 'report') setTimeout(() => reportSheet(target), 240);
      if (act === 'block') block(target.uid);
      if (act === 'share') { navigator.clipboard?.writeText(location.href).catch(() => { }); toast('링크를 복사했습니다'); }
      if (act === 'edit') location.href = `write.html?edit=${target.id}`;
      if (act === 'del') {
        if (target.type === 'post') { state.posts = state.posts.filter(x => String(x.id) !== String(target.id)); save('posts', state.posts); toast('글을 삭제했습니다'); setTimeout(() => location.href = p ? boardOf(p).page : 'index.html', 500); }
        else { state.deletedComments.push(target.id); save('deletedComments', state.deletedComments); toast('댓글을 삭제했습니다'); document.dispatchEvent(new CustomEvent('np:refresh')); }
      }
    });
  }

  /* ───────── 좋아요 ───────── */
  function toggleLike(pid, btn) {
    if (me().acc.key === 'guest') return needLogin('좋아요');
    if (state.likes[pid]) delete state.likes[pid]; else state.likes[pid] = true;
    save('likes', state.likes);
    if (btn) { btn.classList.toggle('on', !!state.likes[pid]); const c = btn.querySelector('[data-count]'); if (c) c.textContent = fmt(post(pid).likes); if (state.likes[pid] && !reduce) burst(btn); }
  }
  function burst(el) {
    const b = document.createElement('span'); b.className = 'burst'; for (let i = 0; i < 8; i++) { const d = document.createElement('i'); d.style.setProperty('--a', (i * 45) + 'deg'); b.appendChild(d); } el.appendChild(b); setTimeout(() => b.remove(), 700);
  }
  function needLogin(what) {
    sheet(`<h3 class="sheet-title">로그인이 필요합니다</h3><p class="sheet-sub">${esc(what)}은(는) 성인 확인을 마친 회원만 할 수 있습니다.</p>
    <div class="sheet-actions col"><a class="btn btn-primary" href="signup.html">카카오·네이버로 시작하기</a><button class="btn btn-ghost" data-close>둘러보기</button></div>`, { label: '로그인 필요' });
  }

  /* ───────── 카드 렌더 ───────── */
  function postCard(p, opts = {}) {
    const u = user(p.uid); const cc = commentCount(p.id); const r = canReadBody(p);
    const thumb = p.photos && p.photos.length ? `<div class="pc-thumb"><img src="${img(p.photos[0])}" alt="" loading="lazy" width="96" height="96">${p.photos.length > 1 ? `<span class="pc-more">+${p.photos.length - 1}</span>` : ''}</div>` : '';
    const labels = `${p.sponsored ? '<span class="label label-ad">광고·협찬</span>' : ''}${p.status === 'review' ? '<span class="label label-review">검토 중</span>' : ''}${p.answered ? '<span class="label label-ok">답변 완료</span>' : ''}${!r.ok && r.why === 'self' ? '<span class="label label-lock">본인확인 필요</span>' : ''}`;
    const isNew = p.mine && (Date.now() - new Date(p.at)) < 120000;
    return `<a class="post-card ${p.status === 'review' ? 'is-review' : ''} ${isNew ? 'is-new' : ''}" href="post.html?id=${p.id}" data-id="${p.id}">
      <div class="pc-main">
        ${opts.crumb ? `<div class="pc-crumb">${esc(crumb(p))}</div>` : ''}
        <h3 class="pc-title">${labels}${esc(p.status === 'review' ? '신고가 접수되어 검토 중인 게시물입니다' : p.title)}</h3>
        ${p.body && p.status !== 'review' && opts.preview !== false ? `<p class="pc-body">${esc(p.body.split('\n')[0])}</p>` : ''}
        <div class="pc-meta"><span class="pc-nick" style="--av:${u.color}">${esc(u.nick)}</span>${u.level === 'biz' ? '<span class="badge badge-biz">업체</span>' : ''}<span>${ago(p.at)}</span><span class="pc-stat">♡ ${fmt(p.likes)}</span><span class="pc-stat">💬 ${cc}</span></div>
      </div>${thumb}</a>`;
  }
  function galleryCell(p) {
    return `<a class="g-cell" href="post.html?id=${p.id}"><img src="${img(p.photos[0])}" alt="${esc(p.title)}" loading="lazy"><span class="g-time">${ago(p.at)}</span><span class="g-cap"><span>${esc(p.title)}</span><b>♡ ${fmt(p.likes)}</b></span></a>`;
  }

  /* ───────── 셸: 헤더·탭바·글자 팝오버 ───────── */
  function header(opts = {}) {
    const unread = D.notifications.filter(n => !n.read && !state.read.includes(n.id)).length;
    return `<header class="hdr" role="banner"><div class="hdr-in">
      ${opts.back ? `<a class="hdr-btn" href="${opts.back}" aria-label="뒤로"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></a>` : `<a class="hdr-logo" href="index.html" aria-label="놀판 홈"><span class="logo-mark" aria-hidden="true">놀</span><span class="logo-word">놀판</span></a>`}
      ${opts.title ? `<h1 class="hdr-title">${esc(opts.title)}</h1>` : '<span class="hdr-title"></span>'}
      <div class="hdr-actions">
        <button class="hdr-btn" id="text-pop-btn" aria-haspopup="dialog" aria-label="글자 크기 · 현재 ${TEXT_STEPS[state.text].label}"><span class="ga">가</span></button>
        <a class="hdr-btn" href="search.html" aria-label="검색"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></a>
        <a class="hdr-btn" href="notify.html" aria-label="알림${unread ? ` ${unread}개 안 읽음` : ''}"><svg viewBox="0 0 24 24"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4"/></svg>${unread ? `<span class="dot">${unread}</span>` : ''}</a>
      </div></div>
      <div class="text-pop" id="text-pop" role="dialog" aria-label="글자 크기" hidden>
        <p>글자 크기</p><div class="text-steps">${TEXT_STEPS.map(s => `<button data-text-step="${s.key}" aria-pressed="${s.key === state.text}"><span style="font-size:${13 + s.key * 4}px">가</span>${s.label}</button>`).join('')}</div>
        <a href="text.html">자세히 설정 →</a></div></header>`;
  }
  function tabbar(current) {
    const tabs = [
      ['index.html', '홈', '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'],
      ['overseas.html', '해외', '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'],
      ['domestic.html', '국내', '<path d="M3 20l6-12 4 7 3-4 5 9z"/>'],
      ['lounge.html', '라운지', '<path d="M4 6h16v10H8l-4 4z"/>'],
      ['my.html', '내정보', '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'],
    ];
    return `<nav class="tabbar" aria-label="주요 메뉴">${tabs.map(([h, l, s]) => `<a href="${h}" ${h === current ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24">${s}</svg><span>${l}</span></a>`).join('')}</nav>`;
  }
  function fab() { return `<a class="fab" href="write.html" aria-label="글쓰기"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>글쓰기</span></a>`; }

  function mountShell(opts) {
    const app = $('#app'); if (!app) return;
    app.insertAdjacentHTML('afterbegin', header(opts));
    if (opts.tab) app.insertAdjacentHTML('beforeend', tabbar(opts.tab));
    if (opts.fab) app.insertAdjacentHTML('beforeend', fab());
    const pop = $('#text-pop'), btn = $('#text-pop-btn');
    btn.onclick = () => { pop.hidden = !pop.hidden; btn.setAttribute('aria-expanded', !pop.hidden); };
    document.addEventListener('click', e => { if (!e.target.closest('#text-pop') && !e.target.closest('#text-pop-btn')) pop.hidden = true; });
    app.addEventListener('click', e => { const b = e.target.closest('[data-text-step]'); if (b) setText(+b.dataset.textStep); });
    // 데스크톱 안내 패널
    if (!$('#side')) {
      const side = document.createElement('aside'); side.id = 'side'; side.setAttribute('aria-label', '데모 안내');
      const acc = me().acc;
      side.innerHTML = `<div class="side-in">
        <a class="side-logo" href="index.html"><span class="logo-mark">놀</span> 놀판 <small>NOLPAN · 제안용 데모</small></a>
        <p class="side-lead">중장년을 위한 여행·여가 커뮤니티. 모바일 웹 → 안드로이드 웹뷰 앱. 아래는 데모를 보는 분을 위한 안내이며 실제 앱에는 없습니다.</p>
        <section><h2>지금 체험 중인 계정</h2><div class="side-acc"><strong>${esc(acc.label)}</strong><span>${esc(acc.desc)}</span><a href="my.html#account">계정 바꾸기 →</a></div></section>
        <section><h2>글자 크기</h2><div class="text-steps side-steps">${TEXT_STEPS.map(s => `<button data-text-step="${s.key}" aria-pressed="${s.key === state.text}"><span style="font-size:${13 + s.key * 4}px">가</span>${s.label} ${s.px}px</button>`).join('')}</div><p class="side-note">단계가 올라가면 목록 썸네일이 위로 가고 지역 탭이 2줄이 됩니다. 말줄임은 쓰지 않습니다.</p></section>
        <section><h2>앱 화면으로 보기</h2><button class="toggle" data-app-toggle aria-pressed="${state.appFrame}"><i></i><span>상태바·제스처 바 영역 표시</span></button><p class="side-note">Android 16(API 36)부터 edge-to-edge를 끌 수 없습니다. 헤더·탭바가 시스템 바 아래로 깔리지 않는지 확인하세요.</p></section>
        <section><h2>화면</h2><ul class="side-links">
          <li><a href="index.html">홈</a></li><li><a href="overseas.html">해외여행</a></li><li><a href="domestic.html">국내여행</a></li><li><a href="lounge.html">여행 라운지</a></li><li><a href="post.html?id=201">글 상세 · 댓글</a></li><li><a href="write.html">글쓰기 · 작성 가드</a></li><li><a href="signup.html">가입 4단계 · 연령 확인</a></li><li><a href="search.html">검색</a></li><li><a href="notify.html">알림</a></li><li><a href="my.html">마이페이지</a></li><li><a href="text.html">글자 크기 설정</a></li><li><a href="withdraw.html">회원 탈퇴</a></li><li><a href="review.html"><strong>검토 항목 (리스크 14건)</strong></a></li></ul></section>
        <p class="side-foot">모든 글·회원·사진은 가상 데이터입니다. 실존 업체·인물과 무관합니다.</p></div>`;
      document.body.appendChild(side);
      side.addEventListener('click', e => { const b = e.target.closest('[data-text-step]'); if (b) setText(+b.dataset.textStep); const t = e.target.closest('[data-app-toggle]'); if (t) { state.appFrame = !state.appFrame; save('appFrame', state.appFrame); applyFrame(); } });
    }
    // 앱 프레임 오버레이
    headerCollapse();
    if (!$('.sysbar')) { app.insertAdjacentHTML('afterbegin', '<div class="sysbar sysbar-top" aria-hidden="true"><span>9:41</span><span>▮▮▮ ◢ ▭</span></div><div class="sysbar sysbar-bottom" aria-hidden="true"><i></i></div>'); }
    reveal();
  }

  function headerCollapse() {
    let lastY = window.scrollY, hidden = false; const hdr = $('.hdr');
    if (!hdr || reduce) return;
    window.addEventListener('scroll', () => { const y = window.scrollY; const down = y > lastY + 6 && y > 120; const up = y < lastY - 6; if (down && !hidden) { hidden = true; hdr.classList.add('hide'); } else if (up && hidden) { hidden = false; hdr.classList.remove('hide'); } lastY = y; }, { passive: true });
  }

  /* ───────── 스크롤 리빌·stagger ───────── */
  function reveal() {
    if (reduce) { $$('.rv').forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv:not(.in)').forEach(e => io.observe(e));
  }
  function stagger(container) { if (!container) return; $$('.post-card, .g-cell, .li', container).forEach((el, i) => { el.classList.add('rv'); el.style.transitionDelay = Math.min(i, 8) * 40 + 'ms'; }); reveal(); }
  function countUp(el, to, ms = 900) {
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(to * e)); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
  }

  /* ───────── 사진 처리 (canvas 리사이즈 → EXIF 제거) ───────── */
  function processImage(file, maxEdge = 1600) {
    return new Promise((res, rej) => {
      const isHeic = /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
      const url = URL.createObjectURL(file); const im = new Image();
      im.onload = () => {
        const r = Math.min(1, maxEdge / Math.max(im.width, im.height));
        const cv = document.createElement('canvas'); cv.width = Math.round(im.width * r); cv.height = Math.round(im.height * r);
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        cv.toBlob(b => { URL.revokeObjectURL(url); res({ dataUrl: cv.toDataURL('image/jpeg', .82), before: file.size, after: b.size, w: cv.width, h: cv.height, heic: isHeic }); }, 'image/jpeg', .82);
      };
      im.onerror = () => { URL.revokeObjectURL(url); rej(isHeic ? new Error('heic') : new Error('decode')); };
      im.src = url;
    });
  }
  const kb = (n) => n >= 1048576 ? (n / 1048576).toFixed(1) + 'MB' : Math.round(n / 1024) + 'KB';

  /* ───────── 공개 API ───────── */
  const q = new URLSearchParams(location.search);
  window.NP = { $, $$, esc, state, burst, save, load, me, TEXT_STEPS, setText, applyText, ago, fmt, user, avatar, badge, boardOf, regionOf, catOf, crumb, img, allPosts, posts, post, commentsOf, commentCount, hotPosts, canReadBody, guardCheck, highlight, ageJudge, toast, sheet, closeSheet, externalLink, reportSheet, moreSheet, block, unblock, toggleLike, needLogin, postCard, galleryCell, mountShell, reveal, stagger, countUp, processImage, kb, q, NOW, reduce, D };
})();
