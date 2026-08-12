/* FANPIT 관리자 — 처리 큐(SLA)·임시조치 D-30·의심그룹·API·부하 시뮬·심사 체크 */
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
    $('#toasts').appendChild(el);
    setTimeout(() => { el.style.opacity='0'; el.style.transition='opacity .3s'; }, 2800);
    setTimeout(() => el.remove(), 3200);
  }

  const drawn = {};
  $$('#anav button').forEach(b => b.onclick = () => {
    $$('#anav button').forEach(x => x.classList.toggle('on', x===b));
    $$('.aview').forEach(v => v.classList.toggle('on', v.id === 'av-'+b.dataset.v));
    if (b.dataset.v==='dash' && !drawn.traffic) { drawTraffic(); drawn.traffic = true; }
    if (b.dataset.v==='api') animQuota();
    if (b.dataset.v==='load') calcLoad();
  });

  /* 카운트업 */
  const easeOut = t => 1 - Math.pow(1-t, 3);
  function countUp(el) {
    const target = +el.dataset.c, t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now-t0)/1000);
      el.textContent = fmt(Math.round(target*easeOut(p)));
      if (p<1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ── 처리 큐 (C-2) — 권리침해 폼 접수분(localStorage) 합류 ── */
  let queue = [...FP.ADMIN.queue];
  try {
    const rights = JSON.parse(localStorage.getItem('fanpit_rights')||'[]');
    queue = [...rights, ...queue];
  } catch(e) {}
  function slaCls(h){ return h<8?'safe':h<18?'warn':'danger'; }
  function renderQueue() {
    $('#queueList').innerHTML = queue.map((q,i)=>{
      const remain = Math.max(0, 24-q.elapsed);
      return `<div class="q-item ${q.done?'done':''}">
        <span class="q-type ${q.type}">${esc(q.label)}</span>
        <div class="q-bd">
          <div class="tg">${esc(q.target)}</div>
          <div class="ex">"${esc(q.excerpt)}"</div>
          ${q.norm?`<div class="nm">↳ ${esc(q.norm)}${q.conf?` · 신뢰도 ${q.conf}%`:''}</div>`:''}
        </div>
        <div class="q-r">
          <div class="sla ${slaCls(q.elapsed)}">${q.done?'처리 완료':`잔여 ${remain.toFixed(1)}h`}<small>경과 ${q.elapsed.toFixed(1)}h / SLA 24h</small></div>
          ${q.done?'':`<div class="q-acts">
            <button class="act primary" data-q="${i}" data-a="resolve">${q.type==='third'?'임시조치 개시':'차단+제재'}</button>
            <button class="act" data-q="${i}" data-a="dismiss">문제 없음</button></div>`}
        </div></div>`;
    }).join('');
    const pending = queue.filter(q=>!q.done).length;
    $('#qBadge').textContent = pending; $('#needHuman').textContent = pending;
    $('#slaWarn').textContent = queue.filter(q=>!q.done && (24-q.elapsed)<6).length;
    $('#thirdN').textContent = queue.filter(q=>q.type==='third').length;
    $$('#queueList [data-q]').forEach(b => b.onclick = () => {
      const q = queue[+b.dataset.q]; q.done = true; renderQueue();
      toast(b.dataset.a==='resolve'
        ? (q.type==='third'
          ? `임시조치 개시 — 30일 타이머 시작, 작성자에게 사유 통지·이의신청 안내 발송 (경과 ${q.elapsed.toFixed(1)}h, SLA 이내)`
          : `처리 완료 — 콘텐츠 차단 + 계정 제재 (경과 ${q.elapsed.toFixed(1)}h, SLA 이내)`)
        : '기각 — 콘텐츠 유지, 신고자에게 결과 통지');
    });
  }

  /* ── 임시조치 (B-2) ── */
  function renderTemp() {
    $('#tempBody').innerHTML = FP.ADMIN.tempblocks.map((t,i)=>{
      const expired = t.day > 30;
      const dCls = expired?'over':t.day>=25?'warn':'safe';
      return `<tr>
        <td style="font-weight:700;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.post)}</td>
        <td>${esc(t.author)}</td>
        <td><span class="pill ${t.src==='자동 탐지'?'bad':t.src==='제3자 요청'?'mute':'warn'}">${esc(t.src)}</span></td>
        <td><span class="d30 ${dCls}">${expired?'만료 — 재게시 대기':`${t.day}일차 · D-${30-t.day}`}</span></td>
        <td>${t.appeal?'<span class="pill warn">이의신청 있음</span>':'<span class="pill mute">없음</span>'}</td>
        <td style="white-space:nowrap"><button class="act good" data-t="${i}" data-a="restore">재게시</button>
          <button class="act danger" data-t="${i}" data-a="del">삭제 확정</button></td></tr>`;
    }).join('');
    $$('#tempBody .act').forEach(b => b.onclick = () => {
      const t = FP.ADMIN.tempblocks[+b.dataset.t];
      FP.ADMIN.tempblocks.splice(+b.dataset.t, 1);
      renderTemp();
      toast(b.dataset.a==='restore'
        ? `「${t.post}」 재게시 — 작성자·신고자 양쪽에 결과 통지 (44조의2 절차 종결)`
        : `「${t.post}」 삭제 확정 — 처리 이력 보존 (분쟁 시 방어 근거)`, b.dataset.a==='del');
    });
  }

  /* ── 회원: 의심 그룹 (C-5) + 미성년 (B-4) ── */
  function renderUsers() {
    $('#sgroups').innerHTML = FP.ADMIN.suspectGroups.map((g,i)=>`
      <div class="sgroup">
        <div class="key">${esc(g.key)}</div>
        <div class="accs">${g.accounts.map(a=>`<span>${esc(a)}</span>`).join('')}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="pat">패턴: ${esc(g.pattern)} · ${esc(g.status)}</span>
          <button class="act danger" data-g="${i}">그룹 일괄 정지</button>
        </div></div>`).join('');
    $$('#sgroups [data-g]').forEach(b => b.onclick = () => {
      const g = FP.ADMIN.suspectGroups[+b.dataset.g];
      g.status = `${g.accounts.length}/${g.accounts.length} 정지`;
      renderUsers();
      toast(`그룹 ${g.accounts.length}개 계정 일괄 정지 — 기기 지문 기준이라 재가입 계정도 같은 그룹에 걸립니다`, true);
    });
    $('#minorBody').innerHTML = FP.ADMIN.minors.map((m,i)=>`<tr>
      <td style="font-weight:700">${esc(m.nick)}</td><td style="font-family:var(--mono)">${m.birth}</td>
      <td><span class="pill warn">${esc(m.state)}</span></td>
      <td><button class="act good" data-m="${i}">동의 확인 완료</button></td></tr>`).join('');
    $$('#minorBody .act').forEach(b => b.onclick = () => {
      const m = FP.ADMIN.minors[+b.dataset.m];
      m.state = '동의 완료 — 가입 승인';
      renderUsers();
      toast(`${m.nick} — 법정대리인 동의 확인, 가입 승인 (22조의2 요건 충족 이력 보존)`);
    });
    const updPol = () => {
      const on = ['#polLink','#polRate','#polDM'].filter(id=>$(id).checked).length;
      $('#polEffect').textContent = `적용 중 ${on}/3 — 자동 차단 예상치 ${[62,84,93,97][on]}% (가상 추정)`;
    };
    ['#polLink','#polRate','#polDM'].forEach(id=>$(id).onchange=updPol);
    updPol();
  }

  /* ── 대시보드 ── */
  function drawTraffic() {
    const cv = $('#trafficCv'); if (!cv) return;
    const dpr = window.devicePixelRatio||1, w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w*dpr; cv.height = h*dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr,dpr);
    const data = FP.ADMIN.traffic7d, labels = FP.ADMIN.trafficLabel;
    const max = Math.max(...data)*1.15, padB = 22, padT = 12;
    const cw = w/data.length, t0 = performance.now();
    const frame = now => {
      const p = easeOut(Math.min(1,(now-t0)/900));
      ctx.clearRect(0,0,w,h);
      ctx.strokeStyle='rgba(255,255,255,.06)';
      for(let i=1;i<=3;i++){const y=padT+(h-padB-padT)*i/4;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
      data.forEach((v,i)=>{
        const bh=(h-padB-padT)*(v/max)*p, x=i*cw+cw*.22, bw=cw*.56, y=h-padB-bh;
        ctx.fillStyle = i===data.length-1 ? '#fcd757' : 'rgba(255,255,255,.28)';
        ctx.fillRect(x,y,bw,bh);
        ctx.fillStyle='rgba(159,159,159,.9)'; ctx.font='600 10.5px Pretendard,sans-serif'; ctx.textAlign='center';
        ctx.fillText(labels[i], x+bw/2, h-6);
        if (p===1){ctx.fillStyle=i===data.length-1?'#fcd757':'rgba(255,255,255,.6)';ctx.font='700 10px "JetBrains Mono",monospace';ctx.fillText((v/1000).toFixed(1)+'k',x+bw/2,y-5);}
      });
      if (p<1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  function renderTop() {
    const rows = [['노스브리지 vs 이스트포트',24810,8420],['서울 노바 vs 부산 하버',18432,6215],['스카이라인 vs 세일러스',15208,4830],['이글스 vs 다이나모',6120,2110]];
    $('#topBody').innerHTML = rows.map(r=>`<tr><td>${r[0]}</td>
      <td style="text-align:right;font-family:var(--mono);font-weight:700">${fmt(r[1])}</td>
      <td style="text-align:right;font-family:var(--mono);color:var(--ink2)">${fmt(r[2])}</td></tr>`).join('');
  }

  /* ── API (A-1·B-3) ── */
  let failing = false, incidents = 0;
  function animQuota() {
    const a = FP.ADMIN.api;
    setTimeout(()=>{ $('#aQuota').style.width = (a.todayCalls/a.quota*100)+'%'; }, 60);
    $('#aUsed').textContent = fmt(a.todayCalls); $('#aLeft').textContent = fmt(a.quota-a.todayCalls);
    $('#aHit').textContent = a.cacheHit+'%'; $('#aLat').textContent = a.avgLat+'ms';
    $('#aWs').textContent = fmt(12847); $('#aErr').textContent = incidents+'건';
    $('#planLbl').textContent = a.provider+' · '+a.plan;
    renderPoll();
  }
  function renderPoll() {
    $('#pollBody').innerHTML = FP.ADMIN.api.poll.map(p=>`<tr>
      <td style="font-family:var(--mono);font-size:12px">${esc(p.name)}</td>
      <td style="color:var(--ink3)">${p.interval}</td>
      <td style="text-align:right;font-family:var(--mono)">${fmt(p.calls)}</td>
      <td>${failing?'<span class="pill bad">● timeout — 캐시 서빙</span>':'<span class="pill ok">● 정상</span>'}</td></tr>`).join('');
  }
  $('#failBtn').onclick = () => {
    failing = !failing;
    $('#stale').classList.toggle('show', failing);
    $('#failBtn').textContent = failing ? '↩ 장애 종료 — 정상 복구' : '⚡ 장애 시뮬레이션 — API가 멈추면 무슨 일이 일어나는지';
    if (failing){ incidents++; $('#aErr').textContent = incidents+'건'; toast('장애 — 이용자 화면은 빈 화면이 아니라 마지막 캐시 + 「N초 전」 배지로 유지됩니다', true); }
    else toast('정상 복구 — 폴링 재개');
    renderPoll();
  };
  $('#crawlToggle').onchange = e => {
    $('#crawlWarn').classList.toggle('show', e.target.checked);
    if (e.target.checked) toast('크롤링 모드 — 대법원 2021도1533 기준 법적 경고를 확인하세요', true);
  };

  /* ── 부하 시뮬레이션 (C-1) ── */
  const NODE_CAP = 20000;
  let memData = [], memTimer = null, backlog = 0;
  function calcLoad() {
    const n = +$('#loadRange').value;
    $('#loadVal').textContent = fmt(n);
    $('#fanout').textContent = fmt(n);
    const nodes = Math.ceil(n/NODE_CAP);
    $('#nodeN').textContent = nodes;
    const wrap = $('#nodes');
    const cur = wrap.children.length;
    if (nodes > cur) { for(let i=cur;i<nodes;i++){ const d=document.createElement('div'); d.className='node hot new'; d.textContent='N'+(i+1); wrap.appendChild(d);} }
    else if (nodes < cur) { while(wrap.children.length>nodes) wrap.lastChild.remove(); }
    [...wrap.children].forEach(d=>d.classList.add('hot'));
  }
  $('#loadRange').oninput = calcLoad;
  $('#goalBtn').onclick = () => {
    const n = +$('#loadRange').value;
    const drop = $('#dropToggle').checked;
    // 느린 클라이언트 5% 가정 — 드롭 off면 backlog 누적
    backlog = 0; memData = [];
    let tick = 0;
    if (memTimer) clearInterval(memTimer);
    $('#loadStat').textContent = '팬아웃 중…'; $('#loadStat').style.color = 'var(--accent)';
    memTimer = setInterval(() => {
      tick++;
      const slow = n * 0.05;
      if (!drop) backlog += slow * 0.002; // MB 단위 누적 (메시지 ~2KB × 슬로우 클라이언트)
      else backlog = Math.max(0, backlog - 2);
      memData.push(backlog);
      $('#memV').textContent = Math.round(backlog) + ' MB';
      drawMem();
      if (!drop && backlog > 400) {
        $('#loadStat').textContent = '노드 OOM — 스테일 데이터가 메모리를 잡아먹음 (실제 보고 패턴)';
        $('#loadStat').style.color = 'var(--live)';
      } else if (tick > 6 && drop) {
        $('#loadStat').textContent = `안정 — 느린 5%는 스냅샷 재동기화로 처리`;
        $('#loadStat').style.color = 'var(--win)';
      }
      if (tick >= 40) clearInterval(memTimer);
    }, 200);
    toast(drop
      ? `득점! 메시지 ${fmt(n)}건 팬아웃 — 백프레셔 적용, 메모리 평탄 유지`
      : `득점! 백프레셔 없음 — 느린 클라이언트 몫이 메모리에 쌓입니다 (곡선 확인)`, !drop);
  };
  function drawMem() {
    const cv = $('#memCv'); if (!cv) return;
    const dpr = window.devicePixelRatio||1, w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w*dpr; cv.height = h*dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr,dpr);
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.beginPath(); ctx.moveTo(0,h-14); ctx.lineTo(w,h-14); ctx.stroke();
    ctx.fillStyle='rgba(159,159,159,.7)'; ctx.font='600 9px "JetBrains Mono",monospace';
    ctx.fillText('backlog memory (MB) — 16GB 노드가 스테일 스포츠 데이터에 잡아먹힌 실제 사례 기반', 4, h-3);
    if (!memData.length) return;
    const max = Math.max(400, ...memData);
    ctx.beginPath();
    memData.forEach((v,i)=>{
      const x = i/(40-1)*w, y = (h-18) - v/max*(h-26);
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.strokeStyle = memData[memData.length-1]>400 ? '#e73b3b' : '#00985f';
    ctx.lineWidth = 2; ctx.stroke();
  }

  /* ── 스토어 심사 체크 (A-5·B-5) ── */
  const flags = {};
  FP.ADMIN.storeChecks.forEach(c => flags[c.key] = true);
  function renderStore() {
    $('#storeList').innerHTML = FP.ADMIN.storeChecks.map(c=>`
      <div class="check-row ${flags[c.key]?'':'off'}" data-k="${c.key}">
        <span class="check-mark ${flags[c.key]?'ok':'no'}">${flags[c.key]?'✓':'✕'}</span>
        <div class="check-bd">
          <div class="rule">${esc(c.rule)}</div>
          <div class="impl">${esc(c.impl)}</div>
          <div class="reject">예상 리젝: ${esc(c.rejectMsg)}</div>
        </div>
        <label class="switch"><input type="checkbox" data-k="${c.key}" ${flags[c.key]?'checked':''}> 구현</label>
      </div>`).join('');
    const okN = Object.values(flags).filter(Boolean).length;
    $('#storeScore').textContent = `${okN}/${FP.ADMIN.storeChecks.length} 충족 ${okN<FP.ADMIN.storeChecks.length?'— 이 상태로 제출하면 리젝':'— 제출 가능'}`;
    $$('#storeList input').forEach(i => i.onchange = () => {
      flags[i.dataset.k] = i.checked;
      renderStore();
      if (!i.checked) toast('기능을 끄면 체크가 풀립니다 — 심사 요건은 문서가 아니라 실제 구현과 연동됩니다', true);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    $$('.kpi .v[data-c]').forEach(countUp);
    renderQueue(); renderTemp(); renderUsers(); renderTop(); animQuota(); renderStore(); calcLoad();
  });
})();
