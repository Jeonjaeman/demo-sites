/* FANPIT — 관리자 로직 (KPI 카운트업 · canvas 차트 · 신고 SLA 큐 · 금칙어 · API 모니터링) */
'use strict';

(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const fmt = n => n.toLocaleString('ko-KR');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function toast(msg, warn) {
    const el = document.createElement('div');
    el.className = 'toast' + (warn ? ' warn' : '');
    el.textContent = msg;
    $('#toastWrap').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2600);
    setTimeout(() => el.remove(), 3000);
  }

  /* ── 내비게이션 ── */
  const charted = { dash: false };
  $$('#admNav button').forEach(b => b.onclick = () => {
    $$('#admNav button').forEach(x => x.classList.toggle('on', x === b));
    $$('.adm-view').forEach(v => v.classList.toggle('on', v.id === 'adm-' + b.dataset.v));
    if (b.dataset.v === 'dash' && !charted.dash) { drawTraffic(); charted.dash = true; }
    if (b.dataset.v === 'api') animateQuota();
  });

  /* ── 카운트업 ── */
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function countUp(el) {
    const target = +el.dataset.count, dur = 1100, t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(Math.round(target * easeOut(p)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ── 방문자 차트 (canvas · dpr 대응) ── */
  function drawTraffic() {
    const cv = $('#trafficChart'); if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const data = FP.ADMIN.traffic7d, labels = FP.ADMIN.trafficLabel;
    const max = Math.max(...data) * 1.15, padL = 8, padB = 24, padT = 10;
    const cw = (w - padL * 2) / data.length;
    const t0 = performance.now(), dur = 900;
    const frame = now => {
      const p = easeOut(Math.min(1, (now - t0) / dur));
      ctx.clearRect(0, 0, w, h);
      // 그리드
      ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) { const y = padT + (h - padB - padT) * i / 4; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      data.forEach((v, i) => {
        const bh = (h - padB - padT) * (v / max) * p;
        const x = padL + i * cw + cw * .2, bw = cw * .6;
        const y = h - padB - bh;
        const last = i === data.length - 1;
        ctx.fillStyle = last ? '#fcd757' : 'rgba(79,142,247,.65)';
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, 5);
        ctx.fill();
        ctx.fillStyle = 'rgba(147,163,181,.9)'; ctx.font = '600 11px Pretendard, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + bw / 2, h - 7);
        if (p === 1) {
          ctx.fillStyle = last ? '#fcd757' : 'rgba(233,240,247,.75)';
          ctx.font = '700 10.5px "JetBrains Mono", monospace';
          ctx.fillText((v / 1000).toFixed(1) + 'k', x + bw / 2, y - 6);
        }
      });
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /* ── 경기별 동접 ── */
  function renderTop() {
    $('#topMatchBody').innerHTML = FP.ADMIN.topMatches.map(t => `<tr>
      <td>${esc(t.match)}</td>
      <td style="text-align:right;font-family:var(--mono);font-weight:700">${fmt(t.concurrent)}</td>
      <td style="text-align:right;font-family:var(--mono);color:var(--ink-2)">${fmt(t.chat)}</td>
    </tr>`).join('');
  }

  /* ── 회원 관리 ── */
  function renderUsers() {
    const sorted = [...FP.ADMIN.users].sort((a, b) => b.reports - a.reports);
    $('#userBody').innerHTML = sorted.map((u, i) => `<tr>
      <td style="font-weight:700">${esc(u.nick)}</td>
      <td style="color:var(--ink-3)">${u.joined}</td>
      <td style="text-align:right;font-family:var(--mono)">${u.posts}</td>
      <td style="text-align:right;font-family:var(--mono);${u.reports >= 5 ? 'color:var(--live);font-weight:800' : ''}">${u.reports}</td>
      <td><span class="st ${u.status}">${u.status === 'normal' ? '정상' : u.status === 'blocked' ? '이용 정지' : '검토 대기'}</span></td>
      <td>${u.status === 'blocked'
        ? `<button class="act ok" data-u="${i}" data-act="release">정지 해제</button>`
        : `<button class="act danger" data-u="${i}" data-act="block">이용 정지</button>`}</td>
    </tr>`).join('');
    $$('#userBody .act').forEach(b => b.onclick = () => {
      const u = sorted[+b.dataset.u];
      u.status = b.dataset.act === 'block' ? 'blocked' : 'normal';
      renderUsers();
      toast(b.dataset.act === 'block' ? `「${u.nick}」 계정을 이용 정지했습니다` : `「${u.nick}」 정지를 해제했습니다`, b.dataset.act === 'block');
    });
  }

  const blindPosts = [
    { title: '(자동 블라인드) ⚡첫충 30% 매충 15%⚡ 안전놀이터…', author: 'ghost_9271', reason: '금칙어 「안전놀이터」「첫충」', st: 'blind', auto: true },
    { title: '상대팀 선수 인신공격 게시글', author: '익명712', reason: '이용자 신고 3건 — 운영자 확인', st: 'blind', auto: false },
  ];
  function renderBlind() {
    $('#blindBody').innerHTML = blindPosts.map((p, i) => `<tr>
      <td style="max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.title)}</td>
      <td>${esc(p.author)}</td>
      <td style="color:var(--ink-3);font-size:12px">${esc(p.reason)} ${p.auto ? '· 자동' : '· 수동'}</td>
      <td><span class="st ${p.st === 'blind' ? 'blocked' : 'normal'}">${p.st === 'blind' ? '블라인드' : '복구됨'}</span></td>
      <td><button class="act ${p.st === 'blind' ? 'ok' : 'danger'}" data-b="${i}">${p.st === 'blind' ? '복구' : '재블라인드'}</button></td>
    </tr>`).join('');
    $$('#blindBody .act').forEach(b => b.onclick = () => {
      const p = blindPosts[+b.dataset.b];
      p.st = p.st === 'blind' ? 'ok' : 'blind';
      renderBlind();
      toast(p.st === 'blind' ? '게시글을 다시 블라인드 처리했습니다' : '게시글을 복구했습니다');
    });
  }

  /* ── 신고 큐 (SLA 타이머) ── */
  function slaClass(h) { return h < 8 ? 'safe' : h < 18 ? 'warn' : 'danger'; }
  function renderReports() {
    const q = FP.ADMIN.reports;
    $('#reportQueue').innerHTML = q.map((r, i) => {
      const remain = Math.max(0, 24 - r.elapsed);
      return `<div class="report-item ${r.done ? 'resolved' : ''}">
        <span class="rp-type ${r.type === '도박 홍보' ? 'gamble' : r.type === '욕설/비방' ? 'abuse' : 'flood'}">${r.type}</span>
        <div class="rp-body">
          <div class="tg">${esc(r.target)}</div>
          <div class="ex">"${esc(r.excerpt)}"</div>
          <div class="src">감지: ${esc(r.detected)}</div>
        </div>
        <div class="rp-right">
          <div class="sla ${slaClass(r.elapsed)}">${r.done ? '처리 완료' : `잔여 ${remain.toFixed(1)}h`}<small>경과 ${r.elapsed.toFixed(1)}h / SLA 24h</small></div>
          ${r.done ? '' : `<div class="rp-actions">
            <button class="primary" data-r="${i}" data-act="resolve">블라인드+제재</button>
            <button class="ghost" data-r="${i}" data-act="dismiss">문제 없음</button>
          </div>`}
        </div>
      </div>`;
    }).join('');
    const pending = q.filter(r => !r.done).length;
    $('#navReportN').textContent = pending;
    $$('#reportQueue [data-r]').forEach(b => b.onclick = () => {
      const r = FP.ADMIN.reports[+b.dataset.r];
      r.done = true;
      renderReports();
      toast(b.dataset.act === 'resolve'
        ? `처리 완료 — 대상 콘텐츠 블라인드 + 계정 제재 (경과 ${r.elapsed.toFixed(1)}h, SLA 이내)`
        : '신고를 기각했습니다 — 콘텐츠 유지');
    });
  }

  /* ── 금칙어 (localStorage로 사용자 화면과 공유) ── */
  const LS_KEY = 'fanpit_banned';
  let banned = (() => {
    try { const v = JSON.parse(localStorage.getItem(LS_KEY)); if (Array.isArray(v) && v.length) return v; } catch (e) {}
    return [...FP.BANNED_DEFAULT];
  })();
  function saveBanned() { try { localStorage.setItem(LS_KEY, JSON.stringify(banned)); } catch (e) {} }
  function renderWords() {
    $('#wordChips').innerHTML = banned.map((w, i) => `<span class="chip">${esc(w)}<button data-w="${i}" title="삭제">✕</button></span>`).join('');
    $('#wordCount').textContent = `${banned.length}개 등록됨`;
    $$('#wordChips button').forEach(b => b.onclick = () => {
      const w = banned.splice(+b.dataset.w, 1)[0];
      saveBanned(); renderWords();
      toast(`금칙어 「${w}」를 삭제했습니다`);
    });
  }
  $('#wordAdd').onclick = addWord;
  $('#wordInput').onkeydown = e => { if (e.key === 'Enter') addWord(); };
  function addWord() {
    const v = $('#wordInput').value.trim();
    if (!v) return;
    if (banned.includes(v)) { toast('이미 등록된 금칙어입니다', true); return; }
    banned.unshift(v); saveBanned(); renderWords();
    $('#wordInput').value = '';
    toast(`금칙어 「${v}」 등록 — 응원방·게시판 필터에 즉시 반영됩니다`);
    logFilter(v, '(관리자 등록)');
  }

  /* 감지 로그 */
  const logLines = [
    ['20:39:12', '안전놀이터', '응원방 m1 · ghost_9271 — 자동 블라인드'],
    ['20:31:48', '첫충', '자유게시판 p5 · ghost_9271 — 자동 블라인드 + 신고 큐 적재'],
    ['20:14:02', '배당', '응원방 m4 · pick_master — 자동 블라인드'],
    ['19:58:33', '먹튀', '응원방 m6 · 신규계정_8812 — 자동 블라인드'],
  ];
  function logFilter(word, src) {
    const t = new Date();
    logLines.unshift([`${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`, word, src]);
    renderLog();
  }
  function renderLog() {
    $('#filterLog').innerHTML = logLines.map(l =>
      `<div><span class="t">[${l[0]}]</span> 금칙어 <span class="w">「${esc(l[1])}」</span> 감지 — ${esc(l[2])}</div>`).join('');
  }

  /* ── API 모니터링 ── */
  let apiFailing = false, errCount = 0;
  function animateQuota() {
    const a = FP.ADMIN.api;
    setTimeout(() => { $('#quotaBar').style.width = (a.todayCalls / a.quota * 100) + '%'; }, 80);
    $('#quotaUsed').textContent = fmt(a.todayCalls);
    $('#quotaLeft').textContent = fmt(a.quota - a.todayCalls);
    $('#cacheHit').textContent = a.cacheHit + '%';
    $('#avgLat').textContent = a.avgLatency + 'ms';
    $('#wsConn').textContent = fmt(12847);
    $('#apiErr').textContent = errCount + '건';
    $('#apiPlanLbl').textContent = a.provider + ' · ' + a.plan;
    renderPoll();
  }
  function renderPoll() {
    $('#pollBody').innerHTML = FP.ADMIN.api.poll.map(p => `<tr>
      <td style="font-family:var(--mono);font-size:12px">${esc(p.name)}</td>
      <td style="color:var(--ink-3)">${p.interval}</td>
      <td style="text-align:right;font-family:var(--mono)">${fmt(p.calls)}</td>
      <td>${apiFailing ? '<span class="poll-err">● TIMEOUT — 캐시 서빙</span>' : '<span class="poll-ok">● 정상</span>'}</td>
    </tr>`).join('');
  }
  $('#simFail').onclick = () => {
    apiFailing = !apiFailing;
    $('#simFail').classList.toggle('active', apiFailing);
    $('#simFail').textContent = apiFailing
      ? '↩ 장애 종료 — 정상 상태로 복구'
      : '⚡ 장애 상황 시뮬레이션 — API가 멈추면 화면이 어떻게 되는지 보기';
    $('#staleBanner').classList.toggle('show', apiFailing);
    if (apiFailing) { errCount++; $('#apiErr').textContent = errCount + '건'; toast('장애 시뮬레이션 — 외부 API 중단. 이용자에게는 캐시 데이터가 계속 서빙됩니다', true); }
    else toast('정상 복구 — 실시간 폴링 재개');
    renderPoll();
  };

  /* ── 초기화 ── */
  document.addEventListener('DOMContentLoaded', () => {
    $$('.kpi .v[data-count]').forEach(countUp);
    drawTraffic(); charted.dash = true;
    renderTop(); renderUsers(); renderBlind(); renderReports(); renderWords(); renderLog(); animateQuota();
  });
})();
