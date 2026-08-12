/* FANPIT — 사용자 화면 (재구축: Opus 분석 구현안 반영) */
'use strict';

const FPAPP = (() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const fmt = n => n.toLocaleString('ko-KR');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const T = id => FP.TEAMS[id];

  const state = {
    view:'board', sport:'football', league:'all', filter:'all',
    detailId:null, favs:new Set(FP.MY.favorites),
    blocked:new Set(FP.MY.blocked.map(b=>b.nick)),
    cat:'all', vp:'fan', liked:new Set(), votePick:null,
    delay:0, chatTimer:null, delayQueue:[],
    dataAge:12, // "N초 전 데이터" (C-4)
  };

  function toast(msg, warn) {
    const el = document.createElement('div');
    el.className = 'toast' + (warn ? ' warn' : '');
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2800);
    setTimeout(() => el.remove(), 3200);
  }

  function go(view) {
    state.view = view;
    $$('.view').forEach(v => v.classList.remove('on'));
    $('#view-' + view).classList.add('on');
    $$('#gnb button').forEach(b => b.classList.toggle('on', b.dataset.view === view));
    if (view !== 'detail' && state.chatTimer) { clearInterval(state.chatTimer); state.chatTimer = null; }
    if (view === 'board') renderBoard();
    if (view === 'community') renderPosts();
    if (view === 'my') renderMy();
    if (view === 'review') { runSim(); renderCmp(); reveal(); }
    window.scrollTo({ top: 0 });
  }

  const crest = (id, sz) => `<span class="crest" style="background:${T(id).color}${sz?`;width:${sz}px;height:${sz}px;flex-basis:${sz}px;font-size:${Math.round(sz*.3)}px`:''}">${T(id).short}</span>`;
  const unitOf = m => m.sport==='football' ? `${m.minute}<span class="tick">′</span>` : `${m.minute}${m.unit||''}`;

  /* ── 좌측 리그 내비 ── */
  function renderLnav() {
    let html = '';
    FP.SPORTS.forEach(s => {
      const liveN = FP.MATCHES.filter(m => m.sport===s.id && m.status==='live').length;
      html += `<button data-sport="${s.id}" data-league="all" class="${state.sport===s.id && state.league==='all' ? 'on':''}">
        <b>${s.name}</b>${liveN?`<span class="cnt">● ${liveN}</span>`:''}</button>`;
      FP.LEAGUES[s.id].forEach(l => {
        html += `<button data-sport="${s.id}" data-league="${l.id}" class="${state.sport===s.id && state.league===l.id ? 'on':''}" style="padding-left:30px">
          <span>${l.name}</span></button>`;
      });
    });
    $('#lnav').innerHTML = html;
    $$('#lnav button').forEach(b => b.onclick = () => {
      state.sport = b.dataset.sport; state.league = b.dataset.league;
      renderLnav(); renderBoard();
    });
  }

  /* ── 스코어보드 ── */
  function renderBoard() {
    const wrap = $('#boardList');
    let list = FP.MATCHES.filter(m => m.sport === state.sport);
    if (state.league !== 'all') list = list.filter(m => m.league === state.league);
    if (state.filter !== 'all') list = list.filter(m => m.status === state.filter);
    if (!list.length) {
      wrap.innerHTML = `<div class="card" style="padding:48px 16px;text-align:center;color:var(--ink3);font-size:13px">
        조건에 맞는 경기가 없습니다.<br><span style="font-size:11.5px">실제 구축에서는 일정 API(fixtures)로 전 날짜를 제공합니다.</span></div>`;
      return;
    }
    const byLg = {};
    list.forEach(m => (byLg[m.league] = byLg[m.league] || []).push(m));
    wrap.innerHTML = Object.entries(byLg).map(([lg, ms]) => {
      const meta = FP.LEAGUES[state.sport].find(l => l.id === lg);
      return `<div class="lg card" data-lg="${lg}">
        <div class="lg-hd"><span class="country">${meta.country}</span><span class="lname">${esc(meta.name)} · ${esc(ms[0].round)}</span><span class="fold">▾</span></div>
        <div class="lg-body">${ms.map(mrow).join('')}</div>
      </div>`;
    }).join('');
    $$('.lg-hd').forEach(h => h.onclick = () => h.closest('.lg').classList.toggle('folded'));
    $$('.mrow').forEach(r => {
      r.onclick = e => { if (e.target.closest('.fav')) return; openDetail(r.dataset.id); };
      const fb = r.querySelector('.fav');
      if (fb) fb.onclick = () => toggleFav(r.dataset.id, fb);
    });
  }

  function mrow(m) {
    const live = m.status === 'live';
    const fin = m.status === 'finished';
    const homeDim = fin && m.hs < m.as ? ' dim' : '';
    const awayDim = fin && m.as < m.hs ? ' dim' : '';
    const time = live ? `<span class="tm live">${unitOf(m)}</span>`
      : fin ? `<span class="tm">종료</span>` : `<span class="tm">${m.kickoff}</span>`;
    const sc = m.hs === null ? `<span class="vs">vs</span>`
      : `<span data-s="h">${m.hs}</span><span class="vs">-</span><span data-s="a">${m.as}</span>`;
    return `<div class="mrow" data-id="${m.id}">
      ${time}
      <div class="team${homeDim}">${crest(m.home)}<span class="nm">${esc(T(m.home).name)}</span></div>
      <div class="sc ${live?'live':''}">${sc}</div>
      <div class="team away${awayDim}"><span class="nm">${esc(T(m.away).name)}</span>${crest(m.away)}</div>
      <div class="fav-cell" style="text-align:right"><button class="fav ${state.favs.has(m.id)?'on':''}">${state.favs.has(m.id)?'★':'☆'}</button></div>
    </div>`;
  }

  function toggleFav(id, btn) {
    if (state.favs.has(id)) { state.favs.delete(id); toast('관심 경기에서 해제했습니다'); }
    else { state.favs.add(id); toast('관심 경기 등록 — 마이페이지·모든 기기에서 이어집니다'); }
    if (btn) { btn.classList.toggle('on'); btn.textContent = state.favs.has(id) ? '★' : '☆'; }
  }

  function renderHot() {
    $('#hotList').innerHTML = FP.POSTS.filter(p => p.hot && p.status === 'normal').map(p =>
      `<a class="hot-item" data-id="${p.id}"><div class="t">${esc(p.title)}</div><div class="m">${esc(p.author)} · ${p.time} · 👍 ${p.likes}</div></a>`).join('');
    $$('#hotList .hot-item').forEach(el => el.onclick = () => { go('community'); openPost(el.dataset.id); });
  }

  /* ── 경기 상세 ── */
  function openDetail(id) {
    state.detailId = id; state.votePick = null; state.delay = 0; state.delayQueue = [];
    renderDetail(); go('detail'); startChat();
  }

  function renderDetail() {
    const m = FP.MATCHES.find(x => x.id === state.detailId); if (!m) return;
    const live = m.status === 'live';
    const fin = m.status === 'finished';
    const homeDim = fin && m.hs < m.as ? ' dim' : '', awayDim = fin && m.as < m.hs ? ' dim' : '';
    const lgMeta = FP.LEAGUES[m.sport].find(l => l.id === m.league);
    const tabs = m.status === 'upcoming'
      ? [['preview','미리보기'],['standings','순위'],['h2h','전적']]
      : [['cheer','응원방'],['overview','개요'],['lineup','라인업'],['stats','통계'],['standings','순위'],['h2h','전적']];
    $('#detailWrap').innerHTML = `
      <div class="hero rv in">
        <span class="meta-label">${esc(lgMeta.name)} · ${esc(m.round)} · ${esc(m.venue)} · ${m.kickoff}</span>
        <div class="hero-grid">
          <div class="team${homeDim}">${crest(m.home,44)}<span>${esc(T(m.home).name)}</span></div>
          <div class="score ${live?'live':''}">
            ${m.hs===null?`<span class="sep" style="font-size:.4em;color:var(--ink3)">VS</span>`:`<span id="dsH">${m.hs}</span><span class="sep">–</span><span id="dsA">${m.as}</span>`}
          </div>
          <div class="team${awayDim}">${crest(m.away,44)}<span>${esc(T(m.away).name)}</span></div>
        </div>
        <div class="sub">
          ${live?`<span class="live-min">LIVE ${unitOf(m)}</span><span>👀 <b id="dViewers">${fmt(m.viewers)}</b></span>`:fin?'<span>경기 종료</span>':`<span>${m.kickoff} 시작 예정</span>`}
          <span class="meta-label" id="dataAge" title="C-4: 실시간인 척하지 않기 — 데이터 기준 시각 상시 표시">data ${state.dataAge}s ago</span>
        </div>
        <div class="src-bar" title="B-3: 데이터 블록별 권리 상태 — 스코어·기록은 API 계약 범위, 중계 영상은 별도 권리">
          <span class="src-badge ok">스코어·기록 — 공식 API 계약분</span>
          <span class="src-badge ok">라인업·통계 — 공식 API 계약분</span>
          <span class="src-badge locked">중계 영상 — 권리 미확보 · 표시 불가</span>
        </div>
      </div>
      <div class="dtabs" id="dtabs">${tabs.map(([k,l],i)=>`<button data-t="${k}" class="${i===0?'on':''}">${l}</button>`).join('')}</div>
      ${tabs.map(([k],i)=>`<div class="pane ${i===0?'on':''}" id="pane-${k}">${paneHTML(m,k)}</div>`).join('')}`;
    $$('#dtabs button').forEach(b => b.onclick = () => {
      $$('#dtabs button').forEach(x => x.classList.toggle('on', x===b));
      $$('.pane').forEach(p => p.classList.toggle('on', p.id==='pane-'+b.dataset.t));
      if (b.dataset.t === 'stats') animStats();
      if (b.dataset.t === 'overview') drawMomentum(m);
    });
    if (tabs[0][0] === 'cheer') bindCheer(m);
  }

  function paneHTML(m, k) {
    if (k==='cheer') return paneCheer(m);
    if (k==='overview') return paneOverview(m);
    if (k==='lineup') return paneLineup(m);
    if (k==='stats') return paneStats(m);
    if (k==='standings') return paneStandings(m);
    if (k==='h2h') return paneH2H(m);
    if (k==='preview') return panePreview(m);
    return '';
  }

  function paneOverview(m) {
    const tl = m.timeline.length ? m.timeline.map((e,i)=>{
      const badge = ['goal','run','set'].includes(e.type) ? `<span class="tl-badge ${e.type}">${e.type==='goal'?'goal':'득점'}</span>`
        : e.type==='yellow' ? `<span class="tl-badge yellow">경고</span>` : `<span class="tl-badge etc">기록</span>`;
      const unit = m.sport==='football' ? `${e.min}′` : `${e.min}${m.unit||''}`;
      return `<div class="tl-i ${e.type}" style="animation-delay:${Math.min(i*60,360)}ms">
        <span class="min">${unit}</span><span class="tx">${badge}${esc(e.text)}${e.score?`<span class="sc">${e.score}</span>`:''}</span></div>`;
    }).join('') : `<div style="padding:40px 0;text-align:center;color:var(--ink3);font-size:13px">기록된 이벤트가 없습니다.</div>`;
    return `<div class="tl" id="tlList">${tl}</div>
      <div class="momentum"><div class="meta-label" style="margin-bottom:6px">match momentum</div><canvas id="momCv"></canvas></div>`;
  }

  function drawMomentum(m) {
    const cv = $('#momCv'); if (!cv || !m.momentum.length) return;
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w*dpr; cv.height = h*dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr,dpr);
    const mid = h/2, bw = Math.min(26, (w-8)/m.momentum.length - 4);
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(0,mid); ctx.lineTo(w,mid); ctx.stroke();
    const t0 = performance.now();
    const frame = now => {
      const p = Math.min(1,(now-t0)/700), e = 1-Math.pow(1-p,3);
      ctx.clearRect(0,0,w,h);
      ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(0,mid); ctx.lineTo(w,mid); ctx.stroke();
      m.momentum.forEach((v,i)=>{
        const x = 4 + i*((w-8)/m.momentum.length);
        const bh = Math.abs(v)/24*(h/2-6)*e;
        ctx.fillStyle = v>=0 ? T(m.home).color : T(m.away).color;
        ctx.fillRect(x, v>=0 ? mid-bh : mid, bw, bh);
      });
      if (p<1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  function paneLineup(m) {
    if (!m.lineupHome.length) return `<div style="padding:40px 0;text-align:center;color:var(--ink3);font-size:13px">라인업은 경기 시작 1시간 전 공개됩니다.</div>`;
    const col = (tid,list)=>`<div class="lu"><h4>${crest(tid)} ${esc(T(tid).name)}</h4><ul>${list.map(p=>{
      const sp = p.split(' ');
      return `<li><span class="pos">${esc(sp[0])}</span>${esc(sp.slice(1).join(' '))}</li>`;}).join('')}</ul></div>`;
    return `<div class="two-col">${col(m.home,m.lineupHome)}${col(m.away,m.lineupAway)}</div>`;
  }

  function paneStats(m) {
    const keys = Object.keys(m.stats);
    if (!keys.length) return `<div style="padding:40px 0;text-align:center;color:var(--ink3);font-size:13px">경기 시작 후 집계됩니다.</div>`;
    return `<div class="stats">${keys.map(k=>{
      const [h,a]=m.stats[k];
      return `<div class="st-row"><div class="lbl"><span>${h}</span><span class="k">${esc(k)}</span><span>${a}</span></div>
        <div class="st-bars"><i data-v="${h}" data-o="${a}" style="background:${T(m.home).color};margin-left:auto"></i><i data-v="${a}" data-o="${h}" style="background:${T(m.away).color}"></i></div></div>`;
    }).join('')}</div>`;
  }
  function animStats() {
    setTimeout(()=>$$('#view-detail .st-bars i').forEach(bar=>{
      const v=+bar.dataset.v, o=+bar.dataset.o, tot=v+o||1;
      bar.style.width=(v/tot*50)+'%';
    }),60);
  }

  function paneStandings(m) {
    const rows = FP.STANDINGS[m.league] || [];
    const isBB = m.sport==='baseball';
    const inMatch = [T(m.home).name, T(m.away).name];
    return `<div style="max-width:640px;margin:0 auto" class="card"><table class="mini">
      <thead><tr><th>#&nbsp;&nbsp;팀</th><th>경기</th><th>승</th><th>무</th><th>패</th><th>${isBB?'승률':'승점'}</th></tr></thead>
      <tbody>${rows.map((r,i)=>`<tr class="${inMatch.includes(r[0])?'hl':''}"><td>${i+1}&nbsp;&nbsp;${esc(r[0])}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td></tr>`).join('')}</tbody>
    </table></div>`;
  }

  function paneH2H(m) {
    const dots = f => `<span class="form-dots">${f.map(x=>`<i class="${x}">${x}</i>`).join('')}</span>`;
    return `<div style="max-width:640px;margin:0 auto">
      <div class="two-col" style="margin-bottom:14px">
        <div class="lu"><h4>${crest(m.home)} 최근 5경기</h4><div style="padding:14px 16px">${dots(m.form.home)}</div></div>
        <div class="lu"><h4>${crest(m.away)} 최근 5경기</h4><div style="padding:14px 16px">${dots(m.form.away)}</div></div>
      </div>
      <div class="card"><table class="mini">
        <thead><tr><th>날짜</th><th>${esc(T(m.home).name)} 기준 스코어</th></tr></thead>
        <tbody>${m.h2h.map(r=>`<tr><td>${r.d}</td><td>${r.s}</td></tr>`).join('')}</tbody>
      </table></div></div>`;
  }

  /* FotMob 문법: 경기 전엔 미리보기·순위·전적으로 화면을 채운다 */
  function panePreview(m) {
    return `<div class="preview-note"><b>프리뷰</b> — ${esc(m.preview||'')}</div>
      ${paneH2H(m)}`;
  }

  /* ── 응원방 (B-1 필터 · B-5 차단 · C-4 지연 보정) ── */
  function paneCheer(m) {
    return `<div class="cheer">
      <div class="chat">
        <div class="chat-hd"><span>실시간 응원 채팅 · 접속 <span id="chatN" style="font-family:var(--mono);color:var(--win)">${fmt(Math.round(m.viewers*.32)||900)}</span></span>
          <span class="sync" id="syncLbl">지연 보정 없음</span></div>
        <div class="chat-bd" id="chatBd"></div>
        <div class="chat-in">
          <input id="chatInput" placeholder="응원 메시지 — 도박·홍보 우회 표기도 자동 차단됩니다" maxlength="200">
          <button id="chatSend">보내기</button>
        </div>
      </div>
      <div class="cside">
        <div class="card"><div class="card-hd"><span>응원 투표</span><span class="meta-label">vote</span></div>
          <div class="card-bd">
            <div class="cheer-vote">
              <button id="voteH"><span>${esc(T(m.home).name)}</span><small id="voteHP">58%</small></button>
              <button id="voteA"><span>${esc(T(m.away).name)}</span><small id="voteAP">42%</small></button>
            </div>
            <div class="vote-bar"><i id="vbH" style="width:58%;background:${T(m.home).color}"></i><i id="vbA" style="width:42%;background:${T(m.away).color}"></i></div>
          </div></div>
        <div class="card"><div class="card-hd"><span>중계 지연 보정</span><span class="meta-label">c-4</span></div>
          <div class="card-bd">
            <div class="delay-opts" id="delayOpts">
              <button data-d="0" class="on">없음</button><button data-d="15">15s</button><button data-d="30">30s</button><button data-d="60">60s</button>
            </div>
            <p class="gnote" style="margin-top:10px">내가 보는 중계의 지연만큼 채팅을 늦춰 받아 <b>스포일러를 차단</b>합니다. 상단에 데이터 기준 시각을 상시 표시합니다.</p>
          </div></div>
        <div class="card"><div class="card-bd gnote">
          메시지에 올리면 <b>신고·차단·답장</b>이 뜹니다. 차단하면 그 이용자의 메시지가 즉시 사라지고(App Store 1.2 ③),
          도박 홍보는 우회 표기(공백·숫자 삽입·자모 분리)까지 <b>정규화 필터</b>가 잡아 발송 자체를 차단합니다.
        </div></div>
      </div>
    </div>`;
  }

  const NICKS = ['골수팬98','치킨은살안쪄','직관러버','전반전요정','수비수출신','광클의신','막차타자','응원단장','데이터충'];

  function makeMsg(m, opts) {
    let side, text, who;
    if (opts && opts.mine) { side='n'; text=opts.text; who=FP.MY.nick; }
    else {
      const r = Math.random();
      const spam = r > 0.9;
      side = spam ? 'n' : r < .42 ? 'h' : r < .78 ? 'a' : 'n';
      const pool = spam ? FP.CHAT_POOL.spam : FP.CHAT_POOL[side==='h'?'home':side==='a'?'away':'neutral'];
      text = pool[Math.floor(Math.random()*pool.length)];
      who = spam ? 'pick_master' : NICKS[Math.floor(Math.random()*NICKS.length)];
    }
    return { side, text, who, mine: !!(opts&&opts.mine) };
  }

  function renderMsg(msg) {
    const bd = $('#chatBd'); if (!bd) return;
    if (state.blocked.has(msg.who)) return;
    const hit = FPFilter.check(msg.text);
    const el = document.createElement('div');
    el.className = `msg ${msg.side}` + (hit ? ' blind' : '');
    el.dataset.who = msg.who;
    el.innerHTML = hit
      ? `<span class="who">${esc(msg.who)}</span><span class="tx"><span class="blind-tag">auto-block</span>금칙어 「${esc(hit.hit)}」 ${esc(hit.via)} 감지 — 발송이 차단되고 운영자 홀드 큐에 적재되었습니다</span>`
      : `<span class="who">${esc(msg.who)}</span><span class="tx">${esc(msg.text)}</span>
         <span class="acts"><button data-a="reply">답장</button><button data-a="report">신고</button><button data-a="block">차단</button></span>`;
    el.querySelectorAll('.acts button').forEach(b => b.onclick = () => {
      if (b.dataset.a==='reply') { const i=$('#chatInput'); i.value=`@${msg.who} `; i.focus(); }
      else if (b.dataset.a==='report') toast('신고 접수 — 운영자 큐에 적재, 24시간 내 처리(SLA 타이머 동작)');
      else {
        state.blocked.add(msg.who);
        FP.MY.blocked.push({nick:msg.who, reason:'응원방에서 차단', time:'방금'});
        $$('#chatBd .msg').forEach(x => { if (x.dataset.who===msg.who) x.remove(); });
        toast(`「${msg.who}」 차단 — 마이페이지 차단 목록에서 관리 (1.2 ③)`, true);
      }
    });
    bd.appendChild(el);
    while (bd.children.length > 60) bd.firstChild.remove();
    bd.scrollTop = bd.scrollHeight;
  }

  /* C-4: 지연 큐 — 선택한 지연만큼 늦춰 표시 */
  function enqueueMsg(msg) {
    if (state.delay === 0) { renderMsg(msg); return; }
    state.delayQueue.push({ msg, at: Date.now() + state.delay*1000 });
  }
  function flushQueue() {
    const now = Date.now();
    state.delayQueue = state.delayQueue.filter(q => { if (q.at <= now) { renderMsg(q.msg); return false; } return true; });
  }

  function bindCheer(m) {
    const send = () => {
      const i = $('#chatInput'); const v = i.value.trim(); if (!v) return;
      renderMsg(makeMsg(m,{mine:true,text:v}));
      if (FPFilter.check(v)) toast('금칙어 감지 — 다른 이용자에게 표시되지 않으며 홀드 큐에 적재됩니다', true);
      i.value = '';
    };
    $('#chatSend').onclick = send;
    $('#chatInput').onkeydown = e => { if (e.key==='Enter') send(); };
    $('#voteH').onclick = () => vote(m,'h'); $('#voteA').onclick = () => vote(m,'a');
    $$('#delayOpts button').forEach(b => b.onclick = () => {
      state.delay = +b.dataset.d;
      $$('#delayOpts button').forEach(x => x.classList.toggle('on', x===b));
      $('#syncLbl').textContent = state.delay ? `지연 보정 ${state.delay}초 — 스포일러 차단` : '지연 보정 없음';
      toast(state.delay ? `채팅을 ${state.delay}초 늦춰 받습니다 — 중계 화면과 동기화` : '지연 보정을 껐습니다');
    });
  }

  let votes = { h: 58 };
  function vote(m, side) {
    if (state.votePick) { toast('이미 투표에 참여했습니다'); return; }
    state.votePick = side;
    votes.h = Math.min(97, Math.max(3, votes.h + (side==='h'?2:-2)));
    $('#voteH').classList.toggle('pick', side==='h');
    $('#voteA').classList.toggle('pick', side==='a');
    updVote();
    toast(`${T(side==='h'?m.home:m.away).name} 응원 참여 📣`);
  }
  function updVote() {
    const h = votes.h, a = 100-h;
    const set=(id,v)=>{const el=$(id); if(el)el.textContent=v;};
    set('#voteHP',h+'%'); set('#voteAP',a+'%');
    const bh=$('#vbH'), ba=$('#vbA');
    if (bh){bh.style.width=h+'%'; ba.style.width=a+'%';}
  }

  function startChat() {
    if (state.chatTimer) clearInterval(state.chatTimer);
    const m = FP.MATCHES.find(x=>x.id===state.detailId); if (!m || m.status==='upcoming') return;
    for (let i=0;i<7;i++) renderMsg(makeMsg(m));
    state.chatTimer = setInterval(() => {
      if (state.view!=='detail') return;
      enqueueMsg(makeMsg(m)); flushQueue();
      state.dataAge = 3 + Math.floor(Math.random()*13);
      const da = $('#dataAge'); if (da) da.textContent = `data ${state.dataAge}s ago`;
    }, 2300);
  }

  /* ── 라이브 시뮬레이터 ── */
  function liveTick() {
    FP.MATCHES.filter(m=>m.status==='live').forEach(m => {
      if (m.sport==='football' && m.minute<90 && Math.random()<.5) m.minute++;
      const p = m.sport==='basketball'?.5:m.sport==='baseball'?.1:.06;
      if (Math.random()<p) {
        const hs = Math.random()<.5;
        const inc = m.sport==='basketball'?(Math.random()<.3?3:2):1;
        if (hs) m.hs+=inc; else m.as+=inc;
        if (m.sport==='football') m.timeline.push({min:m.minute,team:hs?'home':'away',type:'goal',text:`${hs?T(m.home).name:T(m.away).name} 추가골 (라이브)`,score:`${m.hs}-${m.as}`});
        if (state.view==='detail' && state.detailId===m.id) {
          const el = $(hs?'#dsH':'#dsA');
          if (el){el.textContent=hs?m.hs:m.as; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');}
          toast(`⚡ ${hs?T(m.home).name:T(m.away).name} 득점! ${m.hs} – ${m.as}`);
        }
      }
      m.viewers = Math.max(500, m.viewers + Math.round((Math.random()-.45)*280));
    });
    const liveN = FP.MATCHES.filter(m=>m.status==='live').length;
    $('#liveCount').textContent = liveN; $('#chipLiveN').textContent = liveN;
    if (state.view==='board') { const y=window.scrollY; renderBoard(); window.scrollTo({top:y}); }
    if (state.view==='detail') {
      const m = FP.MATCHES.find(x=>x.id===state.detailId);
      if (m && m.status==='live') { const dv=$('#dViewers'); if(dv)dv.textContent=fmt(m.viewers);
        const cn=$('#chatN'); if(cn)cn.textContent=fmt(Math.round(m.viewers*.32)); }
    }
  }

  /* ── 게시판 (B-2 시점 전환) ── */
  function renderPosts() {
    const wrap = $('#postArea');
    const list = FP.POSTS.filter(p => state.cat==='all' || p.cat===state.cat);
    wrap.innerHTML = `<div class="plist">${list.map(p => {
      const tb = p.status==='tempblock';
      const isMineVp = state.vp==='author';
      const isAdminVp = state.vp==='admin';
      let title = esc(p.title), meta = `<span>${esc(p.author)}</span><span>${p.time}</span>`;
      if (tb) {
        if (state.vp==='fan') { title = '임시 차단된 게시물입니다'; meta = `<span class="tb-tag">임시조치</span><span>권리 침해 주장 접수 — 검토 중</span>`; }
        else if (isMineVp) { title = esc(p.title); meta = `<span class="tb-tag">임시조치 D-${30-p.blockDay}</span><span style="color:#eab308">${esc(p.blockReason)}</span>`; }
        else if (isAdminVp) { title = esc(p.title); meta = `<span class="tb-tag">임시조치 ${p.blockDay}일차 / 30일</span><span>${esc(p.blockReason)}</span><span>원문 보존됨</span>`; }
      }
      return `<div class="pitem ${tb?'tb':''}" data-id="${p.id}">
        <span class="cat ${p.cat==='분석'?'c1':'c2'}">${p.cat==='분석'?'분석':'자유'}</span>
        <div class="tt"><h3>${p.hot&&!tb?'<span class="hot-b">HOT</span>':''}${title}</h3><div class="mm">${meta}</div></div>
        <div class="nums"><span>👁 ${fmt(p.views)}</span><span>👍 ${p.likes}</span><span>💬 ${p.comments}</span></div>
      </div>`;
    }).join('')}</div>
    <p class="gnote" style="margin-top:10px;max-width:640px">우측 상단 <b>시점 전환</b> — 같은 게시판이 팬·작성자·운영자에게 다르게 보입니다.
      임시조치(정보통신망법 44조의2)는 30일 이내로 하고, 작성자에게 사유를 알리고 이의신청을 받아야 합니다. 작성자 시점에서 임시조치 글을 눌러 보세요.</p>`;
    $$('#postArea .pitem').forEach(el => el.onclick = () => openPost(el.dataset.id));
  }

  function openPost(id) {
    const p = FP.POSTS.find(x=>x.id===id);
    const tb = p.status==='tempblock';
    if (tb && state.vp==='fan') { toast('임시 차단된 게시물 — 권리 침해 주장이 접수되어 검토 중입니다', true); return; }
    const liked = state.liked.has(id);
    let body = esc(p.body);
    let appeal = '';
    if (tb && state.vp==='author') {
      body = '(임시조치로 본문이 숨겨졌습니다 — 아래에서 사유 확인·이의신청이 가능합니다)';
      appeal = `<div class="appeal-box"><b>임시조치 통지</b> — 사유: ${esc(p.blockReason)}<br>
        조치일로부터 30일 이내 검토 후 재게시 또는 삭제됩니다 (현재 ${p.blockDay}일차, D-${30-p.blockDay}).
        조치에 동의하지 않으면 이의신청(재게시 요청)을 할 수 있습니다.<br>
        <button id="appealBtn">이의신청 (재게시 요청)</button></div>`;
    }
    if (tb && state.vp==='admin') appeal = `<div class="appeal-box"><b>운영자 뷰</b> — 원문이 보존되어 있습니다. 30일 만료 시 「만료 — 재게시 대기」로 자동 이동합니다. 처리(재게시/삭제 확정)는 관리자 화면 임시조치 탭에서.</div>`;
    $('#postArea').innerHTML = `
      <button class="back" id="pBack">← 목록</button>
      <div class="pdetail rv in">
        <h2>${esc(p.title)}</h2>
        <div class="mm"><span>${esc(p.author)}</span><span>${p.time}</span><span>조회 ${fmt(p.views)}</span>${tb?`<span class="tb-tag">임시조치 ${p.blockDay}일차</span>`:''}</div>
        <div class="bd">${body}</div>
        ${appeal}
        ${tb?'':`<div class="pacts">
          <button id="likeBtn" class="${liked?'liked':''}">👍 추천 <b id="likeN">${p.likes+(liked?1:0)}</b></button>
          <button id="repBtn">🚨 신고</button>
          <button onclick="FPAPP.toast('댓글 ${p.comments}개 — 데모에서는 목록 생략')">💬 댓글 ${p.comments}</button>
        </div>`}
      </div>`;
    $('#pBack').onclick = () => renderPosts();
    const lb = $('#likeBtn');
    if (lb) lb.onclick = () => {
      state.liked.has(id) ? state.liked.delete(id) : state.liked.add(id);
      const on = state.liked.has(id);
      lb.classList.toggle('liked',on); $('#likeN').textContent = p.likes+(on?1:0);
      toast(on?'추천했습니다':'추천 취소');
    };
    const rb = $('#repBtn');
    if (rb) rb.onclick = () => toast('신고 접수 — 운영자 큐 적재, 24시간 내 처리');
    const ab = $('#appealBtn');
    if (ab) ab.onclick = () => { toast('이의신청 접수 — 운영자가 재게시 여부를 검토합니다 (44조의2 절차)'); ab.disabled = true; ab.textContent = '이의신청 접수됨'; };
  }

  /* ── 마이페이지 (D-2 기기 연속성) ── */
  let myDevice = 'pc';
  function renderMy() {
    const favs = [...state.favs].map(id=>FP.MATCHES.find(m=>m.id===id)).filter(Boolean);
    const favRows = favs.map(m=>`<div class="sec-row"><span>${esc(T(m.home).name)} <b style="font-family:var(--mono)">${m.hs??'-'}–${m.as??'-'}</b> ${esc(T(m.away).name)}
        ${m.status==='live'?'<span style="color:var(--live);font-weight:700;font-size:10.5px"> ●LIVE</span>':''}</span>
        <button class="ghost-btn" data-fav="${m.id}">해제</button></div>`).join('') || '<div class="sec-row" style="color:var(--ink3)">스코어보드에서 ☆를 눌러 등록하세요</div>';
    $('#myWrap').innerHTML = `
      <div>
        <div class="card rv in" style="text-align:center;padding:22px 16px 14px">
          <div class="avatar" style="width:56px;height:56px;font-size:19px;margin:0 auto 10px">승</div>
          <h3 style="font-size:17px;font-weight:800">${esc(FP.MY.nick)}</h3>
          <div class="meta-label" style="margin-top:6px">joined ${FP.MY.joined} · demo</div>
          <div style="margin-top:16px">
            <div class="dev-toggle" id="devToggle"><button data-dev="pc" class="on">PC 웹</button><button data-dev="app">모바일 앱</button></div>
            <div id="deviceView"></div>
            <p class="gnote" style="padding:0 16px 14px;text-align:left">전환해 보세요 — 관심 경기·읽던 위치가 <b>기기 간 그대로 이어집니다.</b>
            "웹-앱 동기화"의 실제 니즈는 세션 토큰이 아니라 이 상태 연속성입니다.</p>
          </div>
        </div>
      </div>
      <div>
        <div class="card rv in" style="margin-bottom:12px"><div class="card-hd"><span>관심 경기</span><span class="meta-label">${favs.length}</span></div>${favRows}</div>
        <div class="card rv in" style="margin-bottom:12px"><div class="card-hd"><span>내가 쓴 글</span><span class="meta-label">${FP.MY.myPosts.length}</span></div>
          ${FP.MY.myPosts.map(p=>`<div class="sec-row"><span>${esc(p.title)}<div class="sub">${p.time} · 👍 ${p.likes}</div></span></div>`).join('')}</div>
        <div class="card rv in" style="margin-bottom:12px"><div class="card-hd"><span>내가 쓴 댓글</span><span class="meta-label">${FP.MY.myComments.length}</span></div>
          ${FP.MY.myComments.map(c=>`<div class="sec-row"><span>${esc(c.text)}<div class="sub">${esc(c.match)} · ${c.time}</div></span></div>`).join('')}</div>
        <div class="card rv in"><div class="card-hd"><span>차단한 이용자</span><span class="meta-label" id="blockN">${FP.MY.blocked.length}</span></div>
          ${FP.MY.blocked.map((b,i)=>`<div class="sec-row"><span>${esc(b.nick)}<div class="sub">${esc(b.reason)} · ${b.time}</div></span>
            <button class="ghost-btn" data-ub="${i}">차단 해제</button></div>`).join('')||'<div class="sec-row" style="color:var(--ink3)">차단한 이용자가 없습니다</div>'}
          <div class="side-note">차단한 이용자의 채팅·댓글은 나에게 보이지 않습니다 — App Store 1.2 ③ 필수 요건.</div></div>
      </div>`;
    renderDevice();
    $$('#devToggle button').forEach(b=>b.onclick=()=>{
      myDevice=b.dataset.dev;
      $$('#devToggle button').forEach(x=>x.classList.toggle('on',x===b));
      renderDevice();
      toast(myDevice==='app'?'모바일 앱 시점 — 같은 계정 상태가 그대로 이어집니다':'PC 웹 시점');
    });
    $$('#myWrap [data-fav]').forEach(b=>b.onclick=()=>{state.favs.delete(b.dataset.fav);renderMy();toast('관심 경기 해제');});
    $$('#myWrap [data-ub]').forEach(b=>b.onclick=()=>{
      const rm = FP.MY.blocked.splice(+b.dataset.ub,1)[0];
      if (rm) state.blocked.delete(rm.nick);
      renderMy(); toast('차단을 해제했습니다');
    });
  }
  function renderDevice() {
    const favs = [...state.favs].map(id=>FP.MATCHES.find(m=>m.id===id)).filter(Boolean);
    const rows = favs.slice(0,3).map(m=>`<div class="ph-row"><span>${esc(T(m.home).short)} – ${esc(T(m.away).short)}</span><b>${m.hs??'-'}:${m.as??'-'}</b></div>`).join('');
    $('#deviceView').innerHTML = myDevice==='app'
      ? `<div class="phone"><div class="meta-label" style="text-align:center;margin-bottom:8px">fanpit app</div>${rows}
         <div class="ph-row"><span>읽던 글</span><b>p6</b></div></div>`
      : `<div style="border:1px solid var(--line);margin:0 16px 14px;padding:12px"><div class="meta-label" style="margin-bottom:8px">fanpit web</div>
         ${rows}<div class="ph-row" style="border:0"><span>읽던 글</span><b style="font-family:var(--mono)">p6</b></div></div>`;
  }

  /* ── API 예산 시뮬레이터 (A-1·A-2·A-3·D-1) ── */
  const simState = { provider:'apisports', selected:new Set(['ksl','epr']), pollIdx:1 };
  const POLLS = [5,15,30,60];
  function runSim() {
    // 리그 체크리스트 (D-1: 미커버 리그는 잠김)
    $('#lgCheck').innerHTML = FP.SIM.leagues.map(l => {
      const covered = l.cover[simState.provider];
      const checked = simState.selected.has(l.id) && covered;
      return `<label class="${covered?'':'na'}"><input type="checkbox" data-lg="${l.id}" ${checked?'checked':''} ${covered?'':'disabled'}>
        <span class="sp">${l.sport}</span><span>${esc(l.name)}</span>
        ${covered?`<span style="margin-left:auto;font-family:var(--mono);font-size:10px;color:var(--ink3)">${l.perDay}경기/일</span>`:`<span class="cover-x">커버리지 없음</span>`}</label>`;
    }).join('');
    $$('#lgCheck input').forEach(c => c.onchange = () => {
      c.checked ? simState.selected.add(c.dataset.lg) : simState.selected.delete(c.dataset.lg);
      calcSim();
    });
    $$('#provTabs button').forEach(b => b.onclick = () => {
      simState.provider = b.dataset.p;
      $$('#provTabs button').forEach(x=>x.classList.toggle('on',x===b));
      runSim();
    });
    const pr = $('#pollRange');
    pr.oninput = () => { simState.pollIdx = +pr.value; $('#pollVal').textContent = POLLS[simState.pollIdx]+'초'; calcSim(); };
    $('#redisToggle').onchange = calcSim;
    calcSim();
  }
  function calcSim() {
    const poll = POLLS[simState.pollIdx];
    const prov = FP.SIM.providers[simState.provider];
    const sel = FP.SIM.leagues.filter(l => simState.selected.has(l.id) && l.cover[simState.provider]);
    // 요청/일 = Σ 경기수 × 시간 × (3600/주기) + 고정 500 (일정·라인업)
    const req = Math.round(sel.reduce((a,l)=>a + l.perDay*l.hours*(3600/poll), 0) + (sel.length?500:0));
    const sports = new Set(sel.map(l=>l.sport));
    const redis = $('#redisToggle').checked;
    let planHtml='', verdict='', quotaPct=0, over=false, monthly=0, planName='—';
    if (simState.provider==='apisports') {
      // 종목별 별도 구독 (A-2): 종목마다 그 종목 요청량에 맞는 플랜
      let total=0, parts=[];
      sports.forEach(sp=>{
        const spReq = Math.round(sel.filter(l=>l.sport===sp).reduce((a,l)=>a+l.perDay*l.hours*(3600/poll),0)+250);
        const plan = FP.SIM.plans.find(p=>p.cap>=spReq);
        if (plan){total+=plan.usd; parts.push(`${sp} ${plan.name} $${plan.usd}`);} else {over=true; parts.push(`${sp} 한도 초과`);}
      });
      monthly=total; planName=parts.join(' + ')||'—';
      const maxCap = 7500; quotaPct=Math.min(100, req/maxCap*100);
      over = over || req>150000*sports.size;
      verdict = over
        ? `✕ 이 구성은 최고 요금제로도 한도를 넘습니다. 폴링 주기를 늘리거나(30~60초) 라이브 경기만 추적하는 스케줄러가 필요합니다.`
        : `✓ 서버 1곳이 폴링하는 구조 기준 — 종목 ${sports.size}개 = 구독 ${sports.size}개 + 정규화 어댑터 ${sports.size}종 개발. Redis는 ${redis?'유저 응답 42ms(캐시 히트 96%)':'유저 요청이 상류로 직행 — 응답 720ms·한도 즉시 소진'} — 상류 호출 수는 캐시와 무관하게 ${fmt(req)}회입니다.`;
    } else if (simState.provider==='sportradar') {
      monthly=null; planName='견적제 (보고되는 최소 구간: 월 수천 달러 — 추정)';
      quotaPct=30; verdict=`✕ 공개 요금 없음 · 용도 심사 계약. 월 최소 구간만으로 개발 예산(2,500만 원)과 별개의 연간 수천만 원 고정비가 발생할 수 있습니다.`;
      over=true;
    } else {
      monthly=null; planName='B2B 협의 (KBO 등 국내 공식 기록)';
      quotaPct=20; verdict=`△ 국내 리그 공식 기록 확보에 유리 — 단 해외 리그 미커버. 해외는 API-Sports 병행이 현실적입니다.`;
    }
    $('#simNums').innerHTML = `
      <div class="sim-num"><div class="k">상류 요청 / 일</div><div class="v">${fmt(req)}<small> req</small></div></div>
      <div class="sim-num"><div class="k">월 구독료</div><div class="v">${monthly===null?'견적':'$'+monthly}<small>${monthly===null?'':'/월'}</small></div></div>
      <div class="sim-num"><div class="k">정규화 어댑터</div><div class="v">${sports.size}<small> 종목</small></div></div>
      <div class="sim-num"><div class="k">유저 응답 (redis ${redis?'on':'off'})</div><div class="v">${redis?'42':'720'}<small> ms</small></div></div>`;
    const qb = $('#quotaBar'); qb.style.width = Math.min(100,quotaPct)+'%';
    $('#quotaWrap').classList.toggle('over', over || quotaPct>=100);
    $('#quotaTxt').textContent = `일일 요청 ${fmt(req)}`;
    $('#planTxt').textContent = planName;
    const sv = $('#simVerdict');
    sv.textContent = verdict; sv.className = 'verdict ' + (over?'over': simState.provider==='domestic'?'warn':'ok');
    const lv = $('#leadVerdict');
    if (prov.lead>0) { lv.style.display='block'; lv.textContent = `⚠ 계약 리드타임 약 ${prov.lead}주(협상·심사) — 착수 후 계약 시작이면 8주 일정 내 "4주차 API 연동 완료" 마일스톤이 성립하지 않습니다. 계약은 착수 전에 시작해야 합니다.`; }
    else lv.style.display='none';
  }

  /* ── 렌더링 비교 패널 (A-4) ── */
  function renderCmp() {
    const sample = `<div style="font-size:12px;line-height:1.8">
      <div style="font-weight:800;font-size:14px">서울 노바 2 – 1 부산 하버</div>
      <div style="color:var(--ink2)">K-슈퍼리그 24R · 63′ 진행 중</div>
      <div style="color:var(--ink2)">55′ 박지우 페널티킥 골 · 41′ 이서준 동점골</div>
      <a style="color:var(--accent)">경기 상세 보기</a></div>`;
    const drawCv = () => {
      const cv = document.createElement('canvas');
      cv.width = 260; cv.height = 90; cv.style.cssText='width:100%;max-width:260px';
      const x = cv.getContext('2d');
      x.fillStyle='#1d1d1d'; x.fillRect(0,0,260,90);
      x.fillStyle='#fff'; x.font='700 14px sans-serif'; x.fillText('서울 노바 2 – 1 부산 하버', 12, 28);
      x.fillStyle='#9f9f9f'; x.font='11px sans-serif'; x.fillText('K-슈퍼리그 24R · 63′ 진행 중', 12, 48);
      x.fillText('55′ 박지우 페널티킥 골', 12, 66);
      return cv;
    };
    const upd = () => {
      const crawler = $('#crawlerToggle').checked;
      const ssr = $('#ssrView'), cvv = $('#canvasView');
      if (!crawler) {
        ssr.innerHTML = sample;
        cvv.innerHTML = ''; cvv.appendChild(drawCv());
        cvv.insertAdjacentHTML('beforeend','<p style="margin-top:8px;color:var(--ink3);font-size:11px">사람 눈에는 동일하게 보입니다.</p>');
      } else {
        ssr.innerHTML = `<div class="crawler-out">&lt;h1&gt;서울 노바 2 – 1 부산 하버&lt;/h1&gt;
&lt;p&gt;K-슈퍼리그 24R · 63′ 진행 중&lt;/p&gt;
&lt;p&gt;55′ 박지우 페널티킥 골 · 41′ 이서준 동점골&lt;/p&gt;
&lt;a href="/match/m1"&gt;경기 상세 보기&lt;/a&gt;

→ 제목·본문·링크 전부 색인 가능 · 검색 유입 발생</div>`;
        cvv.innerHTML = `<div class="crawler-out empty">&lt;canvas width="260" height="90"&gt;&lt;/canvas&gt;

→ 크롤러가 읽을 텍스트가 없습니다.
"손흥민 골 반응" 같은 검색으로 유입될 경로가 0이 됩니다.</div>`;
      }
    };
    $('#crawlerToggle').onchange = upd;
    upd();
  }

  /* ── 권리침해 신고 창구 (C-3) — 관리자 큐와 localStorage로 연동 ── */
  function bindRights() {
    $('#rfSubmit').onclick = () => {
      const item = { id:'rq'+Date.now(), type:'third', label:'권리침해(제3자)',
        target:`${$('#rfName').value.trim()||'익명'} · 접수 폼`, elapsed:0, conf:null,
        excerpt:($('#rfBody').value.trim()||'').slice(0,60), norm:'임시조치 30일 절차 대상 (정보통신망법 44조의2)' };
      try {
        const arr = JSON.parse(localStorage.getItem('fanpit_rights')||'[]');
        arr.unshift(item); localStorage.setItem('fanpit_rights', JSON.stringify(arr.slice(0,10)));
      } catch(e){}
      toast('권리침해 신고 접수 — 관리자 「오늘 처리할 것」 큐에 제3자 요청으로 적재되었습니다');
    };
  }

  /* ── 로그인 + 연령 게이트 (B-4) ── */
  function bindLogin() {
    const modal = $('#loginModal');
    $('#loginBtn').onclick = () => modal.classList.add('on');
    $('#loginClose').onclick = () => modal.classList.remove('on');
    modal.onclick = e => { if (e.target===modal) modal.classList.remove('on'); };
    $$('#loginModal .socials button').forEach(b => b.onclick = () => {
      modal.classList.remove('on');
      toast(`${b.dataset.social} 로그인 — 소셜은 생년월일 미제공 → 최초 1회 연령 확인이 이어집니다 (데모 생략)`);
    });
    const doEmail = () => {
      const email = $('#loginEmail').value.trim();
      if (!email.includes('@')) { toast('이메일 형식을 확인해 주세요', true); return; }
      const birth = new Date($('#loginBirth').value);
      const age = (Date.now() - birth.getTime()) / 31557600000;
      if (age < 14) {
        $('#minorBranch').innerHTML = `<div class="minor-box"><b>만 14세 미만 — 가입 보류</b><br>
          개인정보 보호법 22조의2에 따라 법정대리인 동의가 필요합니다. 보호자 휴대전화 인증 요청을 보냈습니다(데모).
          동의 완료 전까지 계정은 「보호자 동의 대기」 상태로 관리자 화면에 표시됩니다.</div>`;
        toast('14세 미만 — 법정대리인 동의 절차로 분기했습니다', true);
        return;
      }
      $('#minorBranch').innerHTML = '';
      modal.classList.remove('on');
      toast(`${email} 로그인 — 웹·앱이 같은 상태(관심 경기·읽음 위치)를 공유합니다 (데모)`);
    };
    $('#loginGo').onclick = doEmail;
    $('#tryMinor').onclick = () => { $('#loginBirth').value = '2014-06-01'; doEmail(); };
  }

  /* ── 스크롤 리빌 ── */
  let io;
  function reveal() {
    if (!io) io = new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.08});
    $$('.rv:not(.in)').forEach(el=>io.observe(el));
  }

  /* ── 초기화 ── */
  function init() {
    renderLnav(); renderBoard(); renderHot();
    $$('#gnb button').forEach(b=>b.onclick=()=>go(b.dataset.view));
    $$('#statusChips .chip').forEach(b=>b.onclick=()=>{
      state.filter=b.dataset.f;
      $$('#statusChips .chip').forEach(x=>x.classList.toggle('on',x===b));
      renderBoard();
    });
    $('#dPrev').onclick = $('#dNext').onclick = () => toast('데모에는 오늘 경기만 준비 — 실제 구축 시 fixtures API로 전 날짜 제공');
    $$('.btb .chip').forEach(b=>b.onclick=()=>{
      state.cat=b.dataset.cat;
      $$('.btb .chip').forEach(x=>x.classList.toggle('on',x===b));
      renderPosts();
    });
    $$('#viewpoint button').forEach(b=>b.onclick=()=>{
      state.vp=b.dataset.vp;
      $$('#viewpoint button').forEach(x=>x.classList.toggle('on',x===b));
      renderPosts();
      toast({fan:'팬 시점 — 임시조치 글은 사유 없이 가려집니다',author:'작성자 시점 — 조치 사유·D-30·이의신청이 보입니다',admin:'운영자 시점 — 원문 보존·만료 처리까지 보입니다'}[state.vp]);
    });
    bindLogin(); bindRights();
    setInterval(liveTick, 4000);
    setInterval(flushQueue, 500);
    reveal();
  }
  document.addEventListener('DOMContentLoaded', init);
  return { go, toast };
})();
