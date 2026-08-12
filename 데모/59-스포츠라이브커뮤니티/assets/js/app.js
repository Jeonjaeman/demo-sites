/* FANPIT — 사용자 화면 로직 (라이브 시뮬레이터 · 응원방 · 게시판 · 마이페이지 · 리스크 시뮬레이터) */
'use strict';

const FPAPP = (() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const fmt = n => n.toLocaleString('ko-KR');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const state = {
    view: 'board', sport: 'football', date: 1, cat: 'all',
    detailId: null, detailTab: 'cheer',
    favs: new Set(FP.MY.favorites),
    banned: (() => { // 관리자 화면에서 편집한 금칙어를 공유 (localStorage)
      try { const v = JSON.parse(localStorage.getItem('fanpit_banned')); if (Array.isArray(v) && v.length) return v; } catch (e) {}
      return [...FP.BANNED_DEFAULT];
    })(),
    blockedUsers: new Set(FP.MY.blocked.map(b => b.nick)),
    liked: new Set(), cheerPick: null,
    chatTimer: null, liveTimer: null,
  };

  /* ── 공통: 토스트 ── */
  function toast(msg, warn) {
    const el = document.createElement('div');
    el.className = 'toast' + (warn ? ' warn' : '');
    el.textContent = msg;
    $('#toastWrap').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2600);
    setTimeout(() => el.remove(), 3000);
  }

  /* ── 공통: 뷰 전환 ── */
  function go(view) {
    state.view = view;
    $$('.view').forEach(v => v.classList.remove('on'));
    $('#view-' + view).classList.add('on');
    $$('#gnb button').forEach(b => b.classList.toggle('on', b.dataset.view === view));
    if (view !== 'detail' && state.chatTimer) { clearInterval(state.chatTimer); state.chatTimer = null; }
    if (view === 'board') renderBoard();
    if (view === 'community') renderPosts();
    if (view === 'my') renderMy();
    if (view === 'risk') { runSim(); revealInit(); }
    window.scrollTo({ top: 0 });
  }

  /* ── 팀 헬퍼 ── */
  const T = id => FP.TEAMS[id];
  const crest = (id, cls) => {
    const t = T(id);
    return `<span class="crest ${cls || ''}" style="background:${t.color}">${t.short}</span>`;
  };

  /* ── 티커 ── */
  function renderTicker() {
    const lives = FP.MATCHES.filter(m => m.status === 'live');
    const items = lives.map(m => {
      const unit = m.sport === 'baseball' ? `${m.minute}회` : m.sport === 'basketball' ? `${m.minute}Q` : m.sport === 'volleyball' ? `${m.minute}세트` : `${m.minute}'`;
      return `<span><b class="t-live">LIVE ${unit}</b> ${esc(T(m.home).name)} <b>${m.hs}</b> : <b>${m.as}</b> ${esc(T(m.away).name)}</span>`;
    });
    const fins = FP.MATCHES.filter(m => m.status === 'finished').map(m =>
      `<span>종료 · ${esc(T(m.home).name)} <b>${m.hs}:${m.as}</b> ${esc(T(m.away).name)}</span>`);
    const seq = [...items, ...fins];
    $('#ticker').innerHTML = seq.concat(seq).map(h => h).join('');
    $('#liveCount').textContent = lives.length;
  }

  /* ── 스코어보드 ── */
  function renderSportTabs() {
    $('#sportTabs').innerHTML = FP.SPORTS.map(s => {
      const liveN = FP.MATCHES.filter(m => m.sport === s.id && m.status === 'live').length;
      return `<button data-sport="${s.id}" class="${state.sport === s.id ? 'on' : ''}">${s.icon} ${s.name}${liveN ? `<span class="cnt">${liveN}</span>` : ''}</button>`;
    }).join('');
    $$('#sportTabs button').forEach(b => b.onclick = () => { state.sport = b.dataset.sport; renderSportTabs(); renderBoard(); });
  }

  function renderDateStrip() {
    const labels = ['그저께', '어제', '오늘', '내일', '모레'];
    $('#dateStrip').innerHTML = labels.map((l, i) =>
      `<button data-d="${i}" class="${state.date + 1 === i ? 'on' : ''}">${i === 2 ? '오늘 · 8.12' : l}</button>`).join('');
    $$('#dateStrip button').forEach(b => b.onclick = () => {
      state.date = +b.dataset.d - 1; renderDateStrip(); renderBoard();
      if (state.date !== 1) toast('데모에는 오늘 경기만 준비되어 있습니다 — 실제 구축 시 날짜별 일정 API 연동');
    });
  }

  function renderBoard() {
    const wrap = $('#boardList');
    const list = state.date === 1 ? FP.MATCHES.filter(m => m.sport === state.sport) : [];
    if (!list.length) {
      wrap.innerHTML = `<div style="padding:70px 0;text-align:center;color:var(--ink-3);font-size:13.5px">
        해당 날짜의 경기가 없습니다.<br><span style="font-size:12px">실제 구축에서는 일정 API(fixtures)로 전 날짜를 제공합니다.</span></div>`;
      return;
    }
    const byLeague = {};
    list.forEach(m => (byLeague[m.league] = byLeague[m.league] || []).push(m));
    wrap.innerHTML = Object.entries(byLeague).map(([lg, ms]) => {
      const meta = FP.LEAGUES[state.sport].find(l => l.id === lg);
      return `<div class="league-group rv in">
        <div class="league-hd"><span class="flag">${meta.country}</span>${esc(meta.name)} · ${esc(ms[0].round)}</div>
        ${ms.map(matchRow).join('')}
      </div>`;
    }).join('');
    $$('.match-row').forEach(r => {
      r.onclick = e => { if (e.target.closest('.fav-btn')) return; openDetail(r.dataset.id); };
      const fb = r.querySelector('.fav-btn');
      fb.onclick = () => toggleFav(r.dataset.id, fb);
    });
  }

  function unitOf(m) {
    return m.status !== 'live' ? '' :
      m.sport === 'baseball' ? `${m.minute}회` :
      m.sport === 'basketball' ? `${m.minute}Q` :
      m.sport === 'volleyball' ? `${m.minute}세트` : `${m.minute}′`;
  }

  function matchRow(m) {
    const live = m.status === 'live';
    const timeCell = live
      ? `<span class="live-min"><i class="pulse"></i>${unitOf(m)}</span>`
      : m.status === 'finished' ? `<span class="fin">종료</span>` : `<span>${m.kickoff}</span>`;
    const score = m.hs === null
      ? `<span class="vs">VS</span>`
      : `<span class="s" data-side="h">${m.hs}</span><span class="vs">:</span><span class="s" data-side="a">${m.as}</span>`;
    return `<div class="match-row" data-id="${m.id}">
      <div class="m-time">${timeCell}</div>
      <div class="m-team">${crest(m.home)}<span class="nm">${esc(T(m.home).name)}</span></div>
      <div class="m-score ${live ? 'live' : ''}">${score}</div>
      <div class="m-team away"><span class="nm">${esc(T(m.away).name)}</span>${crest(m.away)}</div>
      <div class="m-meta">
        ${live ? `<span class="m-viewers">👀 ${fmt(m.viewers)}</span>` : ''}
        <button class="fav-btn ${state.favs.has(m.id) ? 'on' : ''}" title="관심 경기">${state.favs.has(m.id) ? '★' : '☆'}</button>
      </div>
    </div>`;
  }

  function toggleFav(id, btn) {
    if (state.favs.has(id)) { state.favs.delete(id); toast('관심 경기에서 해제했습니다'); }
    else { state.favs.add(id); toast('관심 경기로 등록 — 마이페이지에서 확인'); }
    if (btn) { btn.classList.toggle('on'); btn.textContent = state.favs.has(id) ? '★' : '☆'; }
  }

  /* ── 경기 상세 ── */
  function openDetail(id) {
    state.detailId = id; state.detailTab = 'cheer'; state.cheerPick = null;
    renderDetail();
    go('detail');
    startChat();
  }

  function renderDetail() {
    const m = FP.MATCHES.find(x => x.id === state.detailId);
    if (!m) return;
    const live = m.status === 'live';
    const bb = m.bbLabel || {};
    $('#detailWrap').innerHTML = `
      <div class="detail-hero rv in">
        <div class="round">${esc(FP.LEAGUES[m.sport].find(l => l.id === m.league).name)} · ${esc(m.round)} · ${m.kickoff} 시작</div>
        <div class="detail-grid">
          <div class="d-team">${crest(m.home)}<span class="nm">${esc(T(m.home).name)}</span></div>
          <div class="d-score"><span class="s" id="dsH">${m.hs ?? '-'}</span><span class="sep">:</span><span class="s" id="dsA">${m.as ?? '-'}</span></div>
          <div class="d-team">${crest(m.away)}<span class="nm">${esc(T(m.away).name)}</span></div>
        </div>
        ${live ? `<div class="d-live-badge"><i class="pulse"></i>LIVE ${unitOf(m)} 진행 중 · 👀 <span id="dViewers">${fmt(m.viewers)}</span>명 시청</div>` : ''}
        <div class="cheer-bar-wrap">
          <div class="cheer-bar-lbl"><span>${esc(T(m.home).name)} <b id="cheerHomePct">${m.cheerHome}%</b></span><span><b id="cheerAwayPct">${100 - m.cheerHome}%</b> ${esc(T(m.away).name)}</span></div>
          <div class="cheer-bar"><i id="cheerBarH" style="width:${m.cheerHome}%;background:${T(m.home).color}"></i><i id="cheerBarA" style="width:${100 - m.cheerHome}%;background:${T(m.away).color}"></i></div>
        </div>
      </div>
      <div class="detail-tabs">
        <button data-t="cheer" class="on">💬 응원방</button>
        <button data-t="timeline">타임라인</button>
        <button data-t="lineup">라인업</button>
        <button data-t="stats">통계</button>
      </div>
      <div class="detail-pane on" id="pane-cheer">${paneCheer(m)}</div>
      <div class="detail-pane" id="pane-timeline">${paneTimeline(m)}</div>
      <div class="detail-pane" id="pane-lineup">${paneLineup(m)}</div>
      <div class="detail-pane" id="pane-stats">${paneStats(m, bb)}</div>`;

    $$('.detail-tabs button').forEach(b => b.onclick = () => {
      state.detailTab = b.dataset.t;
      $$('.detail-tabs button').forEach(x => x.classList.toggle('on', x === b));
      $$('.detail-pane').forEach(p => p.classList.toggle('on', p.id === 'pane-' + b.dataset.t));
      if (b.dataset.t === 'stats') animateStats(m);
    });
    bindCheer(m);
  }

  function paneTimeline(m) {
    if (!m.timeline.length) return `<div style="padding:50px 0;text-align:center;color:var(--ink-3);font-size:13px">아직 기록된 이벤트가 없습니다. 경기 시작 후 실시간으로 쌓입니다.</div>`;
    return `<div class="tl" id="tlList">${m.timeline.map((e, i) => tlItem(m, e, i)).join('')}</div>`;
  }
  function tlItem(m, e, i) {
    const badge = e.type === 'goal' || e.type === 'run' ? `<span class="tl-badge goal">${e.type === 'run' ? '득점' : 'GOAL'}</span>`
      : e.type === 'yellow' ? `<span class="tl-badge yellow">경고</span>` : `<span class="tl-badge etc">${e.type === 'q' ? '쿼터' : e.type === 'set' ? '세트' : '기록'}</span>`;
    const unit = m.sport === 'baseball' ? `${e.min}회` : m.sport === 'basketball' ? `${e.min}Q` : m.sport === 'volleyball' ? `${e.min}세트` : `${e.min}′`;
    return `<div class="tl-item ${e.type}" style="animation-delay:${Math.min(i * 60, 400)}ms">
      <span class="tl-min">${unit}</span>
      <span class="tl-txt">${badge}${esc(e.text)}${e.score ? `<span class="sc">${e.score}</span>` : ''}</span></div>`;
  }

  function paneLineup(m) {
    if (!m.lineupHome.length) return `<div style="padding:50px 0;text-align:center;color:var(--ink-3);font-size:13px">라인업은 경기 시작 1시간 전 공개됩니다.</div>`;
    const col = (tid, list) => `<div class="lineup-col"><h4>${crest(tid)} ${esc(T(tid).name)}</h4><ul>${list.map(p => {
      const sp = p.split(' ');
      return `<li><span class="pos">${esc(sp[0])}</span>${esc(sp.slice(1).join(' '))}</li>`;
    }).join('')}</ul></div>`;
    return `<div class="lineup-grid">${col(m.home, m.lineupHome)}${col(m.away, m.lineupAway)}</div>`;
  }

  function paneStats(m, bb) {
    const rows = [];
    if (m.sport === 'football') rows.push(['점유율', 'possession', '%']);
    rows.push([bb.shots || '슈팅', 'shots', ''], [bb.onTarget || '유효슈팅', 'onTarget', ''], [bb.corners || '코너킥', 'corners', ''], [bb.fouls || '파울', 'fouls', '']);
    return `<div class="stats-list">${rows.map(([label, key, suf]) => {
      const [h, a] = m.stats[key];
      return `<div class="stat-row" data-key="${key}">
        <div class="lbls"><span>${h}${suf}</span><span class="k">${label}</span><span>${a}${suf}</span></div>
        <div class="stat-bars">
          <i data-side="h" data-v="${h}" data-o="${a}" style="background:${T(m.home).color};margin-left:auto"></i>
          <i data-side="a" data-v="${a}" data-o="${h}" style="background:${T(m.away).color}"></i>
        </div></div>`;
    }).join('')}</div>`;
  }
  function animateStats() {
    setTimeout(() => $$('#pane-stats .stat-bars i').forEach(bar => {
      const v = +bar.dataset.v, o = +bar.dataset.o, tot = v + o || 1;
      bar.style.width = (v / tot * 50) + '%';
    }), 60);
  }

  /* ── 응원방 ── */
  function paneCheer(m) {
    return `<div class="cheer-layout">
      <div class="chat-box">
        <div class="chat-hd"><span>실시간 응원 채팅</span><span>접속 <span class="n" id="chatN">${fmt(Math.round(m.viewers * .32) || 1200)}</span></span></div>
        <div class="chat-scroll" id="chatScroll"></div>
        <div class="chat-input">
          <input id="chatInput" placeholder="응원 메시지를 입력하세요 (금칙어는 자동 블라인드)" maxlength="200">
          <button id="chatSend">보내기</button>
        </div>
      </div>
      <div class="cheer-side">
        <div class="side-card">
          <h4>어느 팀을 응원하나요?</h4>
          <div class="cheer-pick">
            <button id="pickHome"><span>${esc(T(m.home).name)}</span><small id="pickHomePct">${m.cheerHome}%</small></button>
            <button id="pickAway"><span>${esc(T(m.away).name)}</span><small id="pickAwayPct">${100 - m.cheerHome}%</small></button>
          </div>
        </div>
        <div class="side-card">
          <h4>클린 응원방 안내</h4>
          <p class="guard-note">
            도박·홍보성 메시지는 <b>금칙어 필터가 자동 블라인드</b> 처리합니다.
            메시지에 마우스를 올리면 <b>신고·차단</b>할 수 있고, 차단한 이용자의 메시지는 즉시 숨겨집니다.
            신고는 운영팀이 <b>24시간 내</b> 처리합니다. (App Store 가이드라인 1.2 대응)
          </p>
        </div>
        <div class="side-card">
          <h4>응원 매너</h4>
          <p class="guard-note">상대 팀 비하·선수 인신공격은 제재 대상입니다. 스포츠는 응원으로 완성됩니다.</p>
        </div>
      </div>
    </div>`;
  }

  function isBanned(text) {
    const low = text.replace(/\s/g, '').toLowerCase();
    return state.banned.find(w => low.includes(w.toLowerCase()));
  }

  let chatSeq = 0;
  const NICKS = ['골수팬98', '치킨은살안쪄', '직관러버', '전반전요정', '수비수출신', '하이라이트봇아님', '광클의신', '막차타자', '응원단장', '데이터충'];
  function pushChat(m, opts) {
    const scroll = $('#chatScroll'); if (!scroll) return;
    chatSeq++;
    let side, text, who;
    if (opts && opts.mine) { side = 'neutral'; text = opts.text; who = FP.MY.nick; }
    else {
      const r = Math.random();
      const spam = r > 0.93;
      side = spam ? 'neutral' : r < .45 ? 'home' : r < .8 ? 'away' : 'neutral';
      const pool = spam ? FP.CHAT_POOL.spam : FP.CHAT_POOL[side];
      text = pool[Math.floor(Math.random() * pool.length)];
      who = spam ? 'pick_master' : NICKS[Math.floor(Math.random() * NICKS.length)];
    }
    if (state.blockedUsers.has(who)) return; // 차단 이용자 메시지 미표시
    const bannedWord = isBanned(text);
    const el = document.createElement('div');
    el.className = `chat-msg side-${side}` + (bannedWord ? ' blinded' : '');
    el.dataset.who = who;
    el.innerHTML = bannedWord
      ? `<span class="who">${esc(who)}</span><span class="txt"><span class="blind-tag">🛡 자동 블라인드</span><br>금칙어 「${esc(bannedWord)}」 감지 — 도박·홍보성 메시지로 분류되어 숨김 처리되었습니다</span>`
      : `<span class="who">${esc(who)}</span><span class="txt">${esc(text)}</span>
         <span class="m-actions"><button data-act="reply">답장</button><button data-act="report">신고</button><button data-act="block">차단</button></span>`;
    el.querySelectorAll('.m-actions button').forEach(b => b.onclick = () => {
      if (b.dataset.act === 'reply') {
        const inp = $('#chatInput');
        inp.value = `@${who} `; inp.focus();
        toast(`「${who}」님에게 답글 작성 중`);
      }
      else if (b.dataset.act === 'report') { toast('신고가 접수되었습니다 — 운영팀이 24시간 내 처리합니다'); }
      else {
        state.blockedUsers.add(who);
        FP.MY.blocked.push({ nick: who, reason: '응원방에서 차단', time: '방금' });
        $$('#chatScroll .chat-msg').forEach(msg => { if (msg.dataset.who === who) msg.remove(); });
        toast(`「${who}」님을 차단했습니다 — 마이페이지에서 관리`, true);
      }
    });
    scroll.appendChild(el);
    while (scroll.children.length > 60) scroll.firstChild.remove();
    scroll.scrollTop = scroll.scrollHeight;
    if (bannedWord && !(opts && opts.mine)) bumpSpamCounter();
  }

  let spamCaught = 0;
  function bumpSpamCounter() { spamCaught++; }

  function bindCheer(m) {
    const send = () => {
      const inp = $('#chatInput');
      const v = inp.value.trim(); if (!v) return;
      pushChat(m, { mine: true, text: v });
      if (isBanned(v)) toast('금칙어가 포함되어 다른 이용자에게 표시되지 않습니다', true);
      inp.value = '';
    };
    $('#chatSend').onclick = send;
    $('#chatInput').onkeydown = e => { if (e.key === 'Enter') send(); };
    $('#pickHome').onclick = () => pickCheer(m, 'home');
    $('#pickAway').onclick = () => pickCheer(m, 'away');
  }

  function pickCheer(m, side) {
    if (state.cheerPick) { toast('이미 응원 투표에 참여했습니다'); return; }
    state.cheerPick = side;
    m.cheerHome = Math.min(97, Math.max(3, m.cheerHome + (side === 'home' ? 2 : -2)));
    $('#pickHome').classList.toggle('picked-home', side === 'home');
    $('#pickAway').classList.toggle('picked-away', side === 'away');
    updateCheerBar(m);
    toast(`${T(side === 'home' ? m.home : m.away).name} 응원에 참여했습니다 📣`);
  }
  function updateCheerBar(m) {
    const h = m.cheerHome, a = 100 - h;
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    const bh = $('#cheerBarH'), ba = $('#cheerBarA');
    if (bh) { bh.style.width = h + '%'; ba.style.width = a + '%'; }
    set('#cheerHomePct', h + '%'); set('#cheerAwayPct', a + '%');
    set('#pickHomePct', h + '%'); set('#pickAwayPct', a + '%');
  }

  function startChat() {
    if (state.chatTimer) clearInterval(state.chatTimer);
    const m = FP.MATCHES.find(x => x.id === state.detailId);
    if (!m) return;
    for (let i = 0; i < 7; i++) pushChat(m);
    state.chatTimer = setInterval(() => { if (state.view === 'detail') pushChat(m); }, 2200);
  }

  /* ── 라이브 시뮬레이터 (스코어·시간·이벤트) ── */
  function liveTick() {
    const lives = FP.MATCHES.filter(m => m.status === 'live');
    lives.forEach(m => {
      // 시간 진행
      if (m.sport === 'football' && m.minute < 90 && Math.random() < .5) m.minute++;
      // 득점 확률
      const p = m.sport === 'basketball' ? .55 : m.sport === 'baseball' ? .12 : .06;
      if (Math.random() < p) {
        const homeSide = Math.random() < .5;
        const inc = m.sport === 'basketball' ? (Math.random() < .3 ? 3 : 2) : 1;
        if (homeSide) m.hs += inc; else m.as += inc;
        if (m.sport === 'football') {
          m.timeline.push({ min: m.minute, team: homeSide ? 'home' : 'away', type: 'goal',
            text: `골! ${homeSide ? T(m.home).name : T(m.away).name} 추가골 (라이브)`, score: `${m.hs}-${m.as}` });
        }
        if (state.view === 'detail' && state.detailId === m.id) {
          const el = $(homeSide ? '#dsH' : '#dsA');
          if (el) { el.textContent = homeSide ? m.hs : m.as; el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 600); }
          const tl = $('#tlList');
          if (tl && m.sport === 'football') tl.insertAdjacentHTML('beforeend', tlItem(m, m.timeline[m.timeline.length - 1], 0));
          toast(`⚡ ${homeSide ? T(m.home).name : T(m.away).name} 득점! ${m.hs} : ${m.as}`);
        }
      }
      m.viewers = Math.max(500, m.viewers + Math.round((Math.random() - .45) * 300));
      // 응원 비율 미세 변동
      m.cheerHome = Math.min(97, Math.max(3, m.cheerHome + (Math.random() < .5 ? -1 : 1)));
    });
    renderTicker();
    if (state.view === 'board') {
      // 행 갱신 (재렌더 없이 스코어만 갱신하면 좋지만 데모는 단순 재렌더 — 스크롤 유지)
      const y = window.scrollY; renderBoard(); window.scrollTo({ top: y });
    }
    if (state.view === 'detail') {
      const m = FP.MATCHES.find(x => x.id === state.detailId);
      if (m && m.status === 'live') {
        const dv = $('#dViewers'); if (dv) dv.textContent = fmt(m.viewers);
        updateCheerBar(m);
        const cn = $('#chatN'); if (cn) cn.textContent = fmt(Math.round(m.viewers * .32));
      }
    }
  }

  /* ── 게시판 ── */
  function renderPosts() {
    const wrap = $('#postArea');
    const list = FP.POSTS.filter(p => state.cat === 'all' || p.cat === state.cat);
    wrap.innerHTML = `<div class="post-list">${list.map(p => `
      <div class="post-item ${p.blinded ? 'blinded' : ''}" data-id="${p.id}">
        <span class="cat ${p.cat === '분석' ? 'c-analysis' : 'c-free'}">${p.cat}</span>
        <div class="t">
          <h3>${p.hot ? '<span class="hot">HOT</span> ' : ''}${esc(p.title)}</h3>
          <div class="meta"><span>${esc(p.author)}</span><span>${p.time}</span>${p.blinded ? `<span style="color:var(--live)">🛡 ${esc(p.blindReason)}</span>` : ''}</div>
        </div>
        <div class="nums"><span>👁 ${fmt(p.views)}</span><span>👍 ${p.likes}</span><span>💬 ${p.comments}</span></div>
      </div>`).join('')}</div>`;
    $$('#postArea .post-item').forEach(el => el.onclick = () => openPost(el.dataset.id));
  }

  function openPost(id) {
    const p = FP.POSTS.find(x => x.id === id);
    if (p.blinded) { toast('블라인드 처리된 게시글입니다 — 관리자 화면에서 사유 확인 가능', true); return; }
    const liked = state.liked.has(id);
    $('#postArea').innerHTML = `
      <button class="back-btn" id="postBack">← 목록으로</button>
      <div class="post-detail rv in">
        <h2>${esc(p.title)}</h2>
        <div class="meta"><span>${esc(p.author)}</span><span>${p.time}</span><span>조회 ${fmt(p.views)}</span></div>
        <div class="body">${esc(p.body)}</div>
        <div class="post-actions">
          <button class="pa-btn ${liked ? 'liked' : ''}" id="likeBtn">👍 추천 <b id="likeN">${p.likes + (liked ? 1 : 0)}</b></button>
          <button class="pa-btn report" id="reportBtn">🚨 신고</button>
          <button class="pa-btn" onclick="FPAPP.toast('댓글 ${p.comments}개 — 데모에서는 목록을 생략했습니다')">💬 댓글 ${p.comments}</button>
        </div>
      </div>`;
    $('#postBack').onclick = () => renderPosts();
    $('#likeBtn').onclick = () => {
      if (state.liked.has(id)) { state.liked.delete(id); } else { state.liked.add(id); }
      const on = state.liked.has(id);
      $('#likeBtn').classList.toggle('liked', on);
      $('#likeN').textContent = p.likes + (on ? 1 : 0);
      toast(on ? '추천했습니다' : '추천을 취소했습니다');
    };
    $('#reportBtn').onclick = () => toast('신고가 접수되었습니다 — 운영팀이 24시간 내 검토합니다');
  }

  /* ── 마이페이지 ── */
  function renderMy() {
    const favs = [...state.favs].map(id => FP.MATCHES.find(m => m.id === id)).filter(Boolean);
    $('#myWrap').innerHTML = `
      <div class="my-profile rv in">
        <div class="avatar">승</div>
        <h3>${esc(FP.MY.nick)}</h3>
        <div class="lv">${FP.MY.level}</div>
        <div class="jd">가입 ${FP.MY.joined} · 데모 계정</div>
      </div>
      <div>
        <div class="my-sec rv in">
          <h4>관심 경기 <span class="n">${favs.length}</span></h4>
          ${favs.length ? favs.map(m => `<div class="my-row">
            <span>${esc(T(m.home).name)} <b style="font-family:var(--mono)">${m.hs ?? '-'}:${m.as ?? '-'}</b> ${esc(T(m.away).name)}
              ${m.status === 'live' ? '<span style="color:var(--live);font-weight:800;font-size:11px"> ● LIVE</span>' : ''}</span>
            <button class="unblock" data-fav="${m.id}">해제</button>
          </div>`).join('') : '<div class="my-row sub">스코어보드에서 ☆를 눌러 등록하세요</div>'}
        </div>
        <div class="my-sec rv in">
          <h4>내가 쓴 글 <span class="n">${FP.MY.myPosts.length}</span></h4>
          ${FP.MY.myPosts.map(p => `<div class="my-row"><span>${esc(p.title)}<div class="sub">${p.time} · 👍 ${p.likes}</div></span></div>`).join('')}
        </div>
        <div class="my-sec rv in">
          <h4>내가 쓴 댓글 <span class="n">${FP.MY.myComments.length}</span></h4>
          ${FP.MY.myComments.map(c => `<div class="my-row"><span>${esc(c.text)}<div class="sub">${esc(c.match)} · ${c.time}</div></span></div>`).join('')}
        </div>
        <div class="my-sec rv in">
          <h4>차단한 이용자 <span class="n" id="blockN">${FP.MY.blocked.length}</span></h4>
          <div id="blockList">
          ${FP.MY.blocked.map((b, i) => `<div class="my-row"><span>${esc(b.nick)}<div class="sub">${esc(b.reason)} · ${b.time}</div></span>
            <button class="unblock" data-unblock="${i}">차단 해제</button></div>`).join('') || '<div class="my-row sub">차단한 이용자가 없습니다</div>'}
          </div>
          <p class="guard-note" style="margin-top:10px">차단한 이용자의 채팅·댓글은 나에게 보이지 않습니다. (App Store 가이드라인 1.2의 필수 요건)</p>
        </div>
      </div>`;
    $$('#myWrap [data-fav]').forEach(b => b.onclick = () => { state.favs.delete(b.dataset.fav); renderMy(); toast('관심 경기에서 해제했습니다'); });
    $$('#myWrap [data-unblock]').forEach(b => b.onclick = () => {
      const removed = FP.MY.blocked.splice(+b.dataset.unblock, 1)[0];
      if (removed) state.blockedUsers.delete(removed.nick);
      renderMy(); toast('차단을 해제했습니다');
    });
  }

  /* ── API 비용 시뮬레이터 ── */
  function runSim() {
    const range = $('#simRange'); if (!range) return;
    const calc = () => {
      const n = +range.value;
      $('#simVal').textContent = fmt(n) + '명';
      // 직접 폴링: 동접 × 시청 2h × (3600/15) 요청
      const direct = n * 2 * (3600 / 15);
      // 서버 폴링: livescore 15초 일괄 5,760 + 부가(라인업·통계) ≈ 1,400
      const server = Math.round(86400 / 15) + 1400;
      const planFor = req => FP.API_PLANS.find(p => p.reqPerDay >= req);
      const dPlan = planFor(direct), sPlan = planFor(server);
      $('#simBadNum').innerHTML = fmt(direct) + '<small> 요청/일</small>';
      $('#simGoodNum').innerHTML = fmt(server) + '<small> 요청/일</small>';
      $('#simBadLine').innerHTML = `동접 <b>${fmt(n)}명</b> × 평균 시청 2시간 × 15초 폴링.<br>동접이 늘수록 요청이 <b>정비례로 폭발</b>합니다.`;
      $('#simGoodLine').innerHTML = `서버가 전 경기를 15초에 1회 일괄 폴링 → Redis 캐시 → WebSocket 배포.<br>동접이 <b>${fmt(n)}명이어도 요청 수는 동일</b>합니다.`;
      $('#simBadVerdict').textContent = dPlan
        ? `${dPlan.name} 요금제 필요 ($${dPlan.usd}/월)`
        : `최고 요금제(MEGA 150,000/일)로도 ${Math.ceil(direct / 150000)}배 초과 — 운영 불가`;
      $('#simBadVerdict').className = 'plan-verdict ' + (dPlan ? 'ok' : 'over');
      $('#simGoodVerdict').textContent = `${sPlan.name} 요금제로 충분 ($${sPlan.usd}/월) · 캐시 히트율 96%+`;
    };
    range.oninput = calc;
    calc();
  }

  /* ── 스크롤 리빌 ── */
  let io;
  function revealInit() {
    if (!io) io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
    $$('.rv:not(.in)').forEach(el => io.observe(el));
  }

  /* ── 초기화 ── */
  function init() {
    renderSportTabs(); renderDateStrip(); renderBoard(); renderTicker();
    $$('#gnb button').forEach(b => b.onclick = () => go(b.dataset.view));
    $$('#catTabs button').forEach(b => b.onclick = () => {
      state.cat = b.dataset.cat;
      $$('#catTabs button').forEach(x => x.classList.toggle('on', x === b));
      renderPosts();
    });
    // 로그인 모달 (이메일 + 소셜)
    const modal = $('#loginModal');
    $('#loginBtn').onclick = () => modal.classList.add('on');
    $('#loginClose').onclick = () => modal.classList.remove('on');
    modal.onclick = e => { if (e.target === modal) modal.classList.remove('on'); };
    $$('#loginModal .social').forEach(b => b.onclick = () => {
      modal.classList.remove('on');
      toast(`${b.dataset.social} 계정으로 로그인했습니다 — 웹·앱이 같은 세션을 공유합니다 (데모)`);
    });
    $('#loginSubmit').onclick = () => {
      const email = $('#loginEmail').value.trim();
      if (!email || !email.includes('@')) { toast('이메일 형식을 확인해 주세요', true); return; }
      if (!$('#loginPw').value.trim()) { toast('비밀번호를 입력해 주세요', true); return; }
      modal.classList.remove('on');
      toast(`${email} 계정으로 로그인했습니다 (데모)`);
    };
    state.liveTimer = setInterval(liveTick, 4000);
    revealInit();
  }
  document.addEventListener('DOMContentLoaded', init);

  return { go, toast };
})();
