/* ADRING — 요청서 4스텝·제안 비교(2축 정렬·역할 토글)·대행사(탐지·슬롯) */
'use strict';
const APP = (() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const won = n => n.toLocaleString('ko-KR');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function toast(msg, warn) {
    const el = document.createElement('div');
    el.className = 'toast' + (warn ? ' warn' : '');
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3200);
    setTimeout(() => el.remove(), 3600);
  }

  function go(v) {
    $$('.view').forEach(x => x.classList.remove('on'));
    $('#view-' + v).classList.add('on');
    $$('#gnb button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    if (v === 'request') renderReq();
    if (v === 'compare') renderCompare();
    if (v === 'agency') renderAgency();
    window.scrollTo({ top: 0 }); reveal();
  }

  /* ══ 요청서 4스텝 (프리필 · 품질 점수 실계산) ══ */
  const rq = { step: 1, cat: AD.REQ.cat, sub: AD.REQ.sub, purposes: [...AD.REQ.purposes], budget: AD.REQ.budget, period: AD.REQ.period, detail: AD.REQ.detail, region: AD.REQ.region };
  function quality() { // F17: 길이·구체성·목적 수·지역
    let s = 20;
    s += Math.min(30, Math.round(rq.detail.length / 10));
    if (/\d/.test(rq.detail)) s += 10;
    if (rq.detail.includes('타겟') || rq.detail.includes('목표')) s += 10;
    s += rq.purposes.length * 5;
    if (rq.region) s += 10;
    return Math.min(100, s);
  }
  function renderReq() {
    const w = $('#reqWrap');
    const bar = `<div class="progress">${[1,2,3,4].map(i=>`<i class="${i<=rq.step?'on':''}"></i>`).join('')}</div>`;
    if (rq.step === 1) w.innerHTML = bar + `
      <div class="q-title">어떤 광고가 필요하세요?</div>
      <div class="q-sub">대분류 → 소분류 순서로 선택합니다. 카테고리가 일치하는 대행사에게만 알림이 갑니다.</div>
      <div class="opt-grid">${Object.entries(AD.CATS).map(([k,v])=>`
        <div class="optc ${rq.cat===k?'on':''}" data-cat="${k}"><span class="ch ${v.cls}" style="margin-bottom:6px">${k.split('(')[0]}</span><div class="d">${v.subs.join(' · ')}</div></div>`).join('')}</div>
      <div class="q-title" style="font-size:17px;margin-top:24px">소분류</div>
      <div class="opt-grid" style="grid-template-columns:repeat(3,1fr)">${AD.CATS[rq.cat].subs.map(s=>`
        <div class="optc chip ${rq.sub===s?'on':''}" data-sub="${s}"><div class="t" style="font-size:13.5px">${s}</div></div>`).join('')}</div>
      <div class="cta-bar"><button class="btn c big" id="rNext">${rq.sub ? `「${rq.sub}」 요청서 계속 작성` : '소분류를 선택하세요'}</button></div>`;
    if (rq.step === 2) w.innerHTML = bar + `
      <div class="q-title">목적과 예산을 알려주세요</div>
      <div class="q-sub">마케팅 목적(다중 선택) · 예산 구간 · 희망 기간</div>
      <div class="opt-grid" style="grid-template-columns:repeat(2,1fr)">${AD.PURPOSES.map(p=>`
        <div class="optc chip ${rq.purposes.includes(p)?'on':''}" data-pur="${p}"><div class="t" style="font-size:14px">${p}</div></div>`).join('')}</div>
      <div class="q-title" style="font-size:17px;margin-top:22px">예산 구간</div>
      <div class="opt-grid" style="grid-template-columns:repeat(2,1fr)">${AD.BUDGETS.map(b=>`
        <div class="optc chip ${rq.budget===b?'on':''}" data-bud="${b}"><div class="t" style="font-size:14px">${b}</div></div>`).join('')}</div>
      <div class="q-title" style="font-size:17px;margin-top:22px">희망 진행 기간</div>
      <div class="opt-grid" style="grid-template-columns:repeat(4,1fr)">${AD.PERIODS.map(p=>`
        <div class="optc chip ${rq.period===p?'on':''}" data-per="${p}"><div class="t" style="font-size:13.5px">${p}</div></div>`).join('')}</div>
      <div class="cta-bar"><button class="btn ghost big" id="rPrev">이전</button><button class="btn c big" id="rNext">다음 — 상세 내용</button></div>`;
    if (rq.step === 3) w.innerHTML = bar + `
      <div class="q-title">상세 요청 내용</div>
      <div class="q-sub">구체적일수록 좋은 제안이 옵니다 — 아래 품질 점수가 실시간 계산됩니다. 60점 미만이면 대행사 목록에 「검증 대기」로 노출됩니다.</div>
      <textarea id="rDetail" rows="6" maxlength="1000">${esc(rq.detail)}</textarea>
      <div class="char-count"><span id="rLen">${rq.detail.length}</span>/1,000</div>
      <div style="margin-top:14px"><input type="text" id="rRegion" value="${esc(rq.region)}" placeholder="지역 (매장 방문 업종만 · 대행사에는 행정동까지만 공개)"></div>
      <div class="quality"><b>요청서 품질 점수</b> <span class="score mono" id="qScore" style="color:var(--client)">${quality()}</span>/100
        <div class="bar"><i id="qBar" style="width:${quality()}%"></i></div>
        <span id="qNote">${quality()>=60?'좋습니다 — 대행사 목록에 정상 노출됩니다':'⚠ 60점 미만 — 검증 대기 배지로 노출되고 첨부가 잠깁니다 (리드 수집형 가짜 요청서 방어)'}</span></div>
      <div class="cta-bar"><button class="btn ghost big" id="rPrev">이전</button><button class="btn c big" id="rNext">다음 — 확인·등록</button></div>`;
    if (rq.step === 4) w.innerHTML = bar + `
      <div class="q-title">확인하고 등록합니다</div>
      <div class="q-sub">제안서 접수 마감: 등록 시점 기준 7일 (${AD.REQ.deadline}) · 수신 제안 상한 ${AD.REQ.slotMax}건 · <b>제안 유효기간은 마감일 +5일로 자동 설정</b>됩니다 (제출 시점 기준이 아니라 마감 기준 — 먼저 낸 제안이 손해 보지 않게)</div>
      <div class="panel"><div class="panel-bd">
        <div class="kv"><span class="k">카테고리</span><span class="v">${rq.cat} › ${rq.sub}</span></div>
        <div class="kv"><span class="k">목적</span><span class="v">${rq.purposes.join(' · ')}</span></div>
        <div class="kv"><span class="k">예산 / 기간</span><span class="v">${rq.budget} / ${rq.period}</span></div>
        <div class="kv"><span class="k">지역 (대행사 공개 범위)</span><span class="v">${esc(rq.region)} → <b>강남구 역삼동까지만</b></span></div>
        <div class="kv"><span class="k">연락처</span><span class="v">매칭 확정 시에만, 확정 대행사에게만 공개</span></div>
      </div></div>
      <div class="consent-box"><label><input type="checkbox" id="rPolicy" checked><span>연락처 공개 정책을 확인했습니다 <span style="color:var(--ink4);font-weight:400">(제3자 제공 동의는 확정 시점에 대행사가 특정된 상태로 별도로 받습니다)</span></span></label></div>
      <div class="cta-bar"><button class="btn ghost big" id="rPrev">이전</button><button class="btn c big" id="rSubmit">요청서 등록 — 카테고리 일치 대행사에 알림</button></div>`;
    bind(w);
  }
  function bind(w) {
    $$('#reqWrap [data-cat]').forEach(o => o.onclick = () => { rq.cat = o.dataset.cat; rq.sub = AD.CATS[rq.cat].subs[0]; renderReq(); });
    $$('#reqWrap [data-sub]').forEach(o => o.onclick = () => { rq.sub = o.dataset.sub; renderReq(); });
    $$('#reqWrap [data-pur]').forEach(o => o.onclick = () => { const p=o.dataset.pur; rq.purposes.includes(p)?rq.purposes=rq.purposes.filter(x=>x!==p):rq.purposes.push(p); renderReq(); });
    $$('#reqWrap [data-bud]').forEach(o => o.onclick = () => { rq.budget = o.dataset.bud; renderReq(); });
    $$('#reqWrap [data-per]').forEach(o => o.onclick = () => { rq.period = o.dataset.per; renderReq(); });
    const d = $('#rDetail');
    if (d) d.oninput = () => { rq.detail = d.value; $('#rLen').textContent = d.value.length;
      const q = quality(); $('#qScore').textContent = q; $('#qBar').style.width = q + '%';
      $('#qNote').textContent = q>=60 ? '좋습니다 — 대행사 목록에 정상 노출됩니다' : '⚠ 60점 미만 — 검증 대기 배지로 노출되고 첨부가 잠깁니다 (리드 수집형 가짜 요청서 방어)'; };
    const rg = $('#rRegion'); if (rg) rg.oninput = () => rq.region = rg.value;
    const nx = $('#rNext'); if (nx) nx.onclick = () => { rq.step++; renderReq(); };
    const pv = $('#rPrev'); if (pv) pv.onclick = () => { rq.step--; renderReq(); };
    const sb = $('#rSubmit'); if (sb) sb.onclick = () => {
      toast('요청서 등록 — SNS광고 대행사 그룹에 알림 발송 (우수 즉시 · 인증 +2h · 신규 +6h 시간차 오픈)');
      setTimeout(() => go('compare'), 900);
    };
  }

  /* ══ 제안 비교 (역할 토글 · 2축 정렬 · 유효기간) ══ */
  let role = 'owner', sortKey = 'monthly';
  function normalize(p) { // F1: 월 환산 / 총 환산
    if (p.priceType === '협의') return { m: null, t: null };
    if (p.priceType === '월') return { m: p.amount, t: p.amount * p.months };
    return { m: Math.round(p.amount / p.months), t: p.amount };
  }
  function score(p) { return (p.grade==='우수'?40:p.grade==='인증'?25:10) + Math.max(0, 25 - p.respHours*2) + p.confirmRate*0.35 + Math.min(15, p.portfolio); }
  function renderCompare() {
    const area = $('#compareArea');
    const R = AD.REQ;
    const maskedTitle = role==='owner'||role==='admin' ? `${esc(R.shop)} — 인스타그램 오픈 마케팅` : `강남구 카페 — 인스타그램 오픈 마케팅`;
    const contact = role==='owner' ? `${R.phone} · ${R.email}` : role==='admin' ? `${R.phone} <span class="bdg mute">열람 사유 기록됨</span>` : `<span class="locked">🔒 매칭 확정 시 공개</span>`;
    let list = AD.PROPOSALS.filter(p => role!=='lost' || p.id!=='P1');
    const cmp = list.filter(p=>!p.expired && normalize(p).m!==null);
    const uncmp = list.filter(p=>p.expired || normalize(p).m===null);
    cmp.sort((a,b)=> sortKey==='monthly' ? normalize(a).m-normalize(b).m : sortKey==='total' ? normalize(a).t-normalize(b).t : score(b)-score(a));
    area.innerHTML = `
      <div class="req-hd rv in">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="bdg open">모집중</span><span class="bdg new">제안 ${AD.PROPOSALS.length}/${R.slotMax}</span><h2 style="flex:1">${maskedTitle}</h2></div>
        <div class="meta">
          <span>${R.cat} › ${R.sub}</span><span>${R.budget} · ${R.period}</span>
          <span>지역: ${role==='owner'||role==='admin'?esc(R.region):'강남구 역삼동'}</span>
          <span>연락처: ${contact}</span>
          <span>마감 ${R.deadline} (D-6)</span>
        </div>
        ${role==='lost' ? '<div class="warnline show">낙선 — 이 요청서의 첨부·상세 열람 권한이 회수되었습니다. 연락처는 영구 비공개입니다.</div>' : ''}
        ${role==='agency' ? '<div class="meta" style="color:var(--partner-ink);font-weight:600">첨부파일 🔒 제안 제출 후 열람 가능 · 견적·전략은 경쟁 대행사에게 절대 비공개</div>' : ''}
      </div>
      ${role==='owner'||role==='admin' ? `
      <div class="sort-bar">
        <select id="sortSel">
          <option value="monthly" ${sortKey==='monthly'?'selected':''}>월 환산가 낮은순</option>
          <option value="total" ${sortKey==='total'?'selected':''}>총 환산가 낮은순</option>
          <option value="verified" ${sortKey==='verified'?'selected':''}>검증 지표순 (추천)</option>
        </select>
        <button class="why-btn" id="whyBtn">이 순위는 무엇으로 매겨지나요?</button>
        <span style="font-size:12px;color:var(--ink4)">평점순 대신 검증 지표순 — 1차 오픈 시점엔 실거래 평점 원천이 없습니다</span>
      </div>
      ${cmp.map(p => pcard(p)).join('')}
      ${uncmp.length ? `<div style="font-size:12.5px;color:var(--ink4);margin:16px 0 8px">비교 불가 · 만료 (정렬에서 제외)</div>` + uncmp.map(p=>pcard(p,true)).join('') : ''}
      ` : role==='agency' ? `<div class="panel"><div class="panel-bd" style="font-size:13.5px;color:var(--ink3)">제안 전 대행사 시점 — 다른 대행사의 <b>견적·전략·담당자는 보이지 않습니다.</b> 보이는 것은 잔여 슬롯(${R.slotMax - AD.PROPOSALS.length}자리)뿐입니다. 제안하려면 「대행사 화면」 탭에서 작성하세요.</div></div>`
      : `<div class="panel"><div class="panel-bd" style="font-size:13.5px;color:var(--ink3)">낙선 대행사 시점 — 제출했던 내 제안서만 열람 가능하며, 요청자 정보·타 제안서는 보이지 않습니다. 낙선 통보 알림이 발송되었습니다.</div></div>`}`;
    const ss = $('#sortSel'); if (ss) ss.onchange = () => { sortKey = ss.value; renderCompare(); };
    const wb = $('#whyBtn'); if (wb) wb.onclick = openWhy;
    $$('#compareArea [data-confirm]').forEach(b => b.onclick = () => $('#confirmModal').classList.add('on'));
    reveal();
  }
  function pcard(p, un) {
    const n = normalize(p);
    const price = n.m===null ? `<div class="m" style="font-size:14px;color:var(--ink4)">협의 후 결정</div><div class="sub">환산 불가 — 비교 제외</div>`
      : `<div class="m">${won(n.m)}<small style="font-size:11px;color:var(--ink3)">원/월</small></div><div class="sub">총 ${won(n.t)}원 · ${p.months}개월 (VAT 별도)</div>`;
    const cd = p.expired ? `<div class="cd over">유효기간 만료</div>` : `<div class="cd ${p.days==='D-1'?'warn':'safe'}">유효 ${p.days} <button class="why-btn" style="font-size:10.5px" onclick="APP.toast('연장 요청 발송 — 대행사에 알림')">연장 요청</button></div>`;
    return `<div class="pcard rv in ${un?'uncmp':''} ${p.expired?'expired':''}">
      <div>
        <div class="who">
          <span class="nm">${esc(p.agency)}</span>
          <span class="bdg grade">${p.grade}</span>
          ${p.boost?'<span class="bdg top">우선 노출</span>':''}
          ${p.verified?'<span class="bdg open">국세청 대조 ✓</span>':'<span class="bdg warn">인증 확인 중</span>'}
          ${p.reviews?`<span class="rating">★ ${p.rating} <b>${p.ratingLabel}</b> (${p.reviews})</span>`:'<span class="bdg mute">신규 — 평점 없음</span>'}
        </div>
        <div class="strat">${esc(p.strategy)}</div>
        <div class="stats"><span>응답 중앙값 ${p.respHours}h</span><span>확정률 ${p.confirmRate}%</span><span>포트폴리오 ${p.portfolio}건</span><span>담당 ${esc(p.manager)}</span></div>
      </div>
      <div class="price">${price}${cd}
        ${!un&&!p.expired?`<button class="btn c sm" style="margin-top:8px" data-confirm>매칭 확정</button>`:''}
      </div>
    </div>`;
  }
  function openWhy() {
    $('#whyBody').innerHTML = `
      <div class="kv"><span class="k">등급 (신규/인증/우수)</span><span class="v">40%</span></div>
      <div class="kv"><span class="k">응답 속도 중앙값</span><span class="v">25%</span></div>
      <div class="kv"><span class="k">확정률 (진행 확인 응답 기반)</span><span class="v">20%</span></div>
      <div class="kv"><span class="k">포트폴리오 건수</span><span class="v">15%</span></div>
      ${AD.PROPOSALS.filter(p=>!p.expired&&p.priceType!=='협의').map(p=>`<div class="kv"><span class="k">${esc(p.agency)}</span><span class="v mono">${score(p).toFixed(1)}점</span></div>`).join('')}`;
    $('#whyModal').classList.add('on');
  }

  /* ══ 대행사 화면 (목록 + 제안 작성 탐지) ══ */
  let lastProposal = '저비용 고효율 세팅. 메타 광고 계정 셋업과 타겟 AB 테스트 중심으로 운영합니다. 월간 리포트 제공.';
  function renderAgency() {
    $('#agencyArea').innerHTML = `
      <h2 style="font-size:22px;font-weight:800;color:var(--ink1);margin-bottom:4px">받은 요청 <span style="color:var(--partner-ink)">— SNS광고 · 콘텐츠</span></h2>
      <p style="font-size:13px;color:var(--ink3);margin-bottom:16px">등급별 시간차 오픈: 우수 즉시 · 인증 +2시간 · 신규 +6시간 — 선착순 레이스 대신 읽고 쓸 시간을 보장합니다. 요청자 상호·연락처는 확정 전까지 마스킹됩니다.</p>
      ${AD.REQ_LIST.map(r => `
        <div class="rrow ${r.lowq?'uncmp':''}">
          <div>
            <h3>${r.lowq?'<span class="bdg warn">검증 대기</span> ':''}${esc(r.title)}</h3>
            <div class="meta"><span class="ch ${AD.CATS[r.cat].cls}">${r.cat.split('(')[0]}</span><span>${r.budget} · ${r.period}</span><span>${r.region}</span><span>품질 ${r.quality}점</span></div>
          </div>
          <div style="text-align:right">
            <div class="slotbar" style="justify-content:flex-end"><span class="mono">제안 ${r.slots}</span><span class="track"><i style="width:${parseInt(r.slots)/parseInt(r.slots.split('/')[1])*100}%"></i></span><span>${r.deadline}</span></div>
            <div class="tier-note">${r.tierOpen==='열림'?'<span style="color:var(--partner-ink);font-weight:700">지금 제안 가능</span>':r.tierOpen==='마감'?'<span style="color:var(--danger)">슬롯 마감</span>':'⏳ '+r.tierOpen}</div>
          </div>
        </div>`).join('')}
      <div class="panel" style="margin-top:24px"><div class="panel-hd"><span>제안서 작성 — RQ-2608-042 강남구 카페</span><span class="meta">금지표현·연락처·중복 자동 탐지</span></div>
        <div class="panel-bd">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">
            <select id="pType"><option>월 단가</option><option>총액</option></select>
            <input type="number" id="pAmount" value="1500000" step="100000">
            <select id="pMonths"><option>3개월</option><option>1개월</option><option>6개월</option></select>
          </div>
          <textarea id="pStrategy" rows="4" maxlength="800" placeholder="실행 전략 (최대 800자)">지역 타겟 인스타 릴스 운영과 오픈 이벤트 세팅을 제안드립니다. 주 2회 콘텐츠 제작을 포함합니다.</textarea>
          <div class="warnline" id="pWarn"></div>
          <div class="dup-meter"><span>직전 제안서와 유사도</span><span class="track"><i id="dupBar" style="width:0;background:var(--partner)"></i></span><span class="mono" id="dupVal">0%</span></div>
          <div class="verify-row" style="margin-top:14px">
            <input type="text" id="bizNo" value="214-88-33021" style="max-width:180px">
            <button class="btn p sm" id="bizCheck">국세청 대조</button>
            <div class="verify-out" id="bizOut"></div>
          </div>
          <div style="display:flex;gap:8px;margin-top:14px">
            <button class="btn p big" id="pSubmit" style="flex:1">제안서 제출 (슬롯 4/5 선점)</button>
          </div>
        </div></div>`;
    const strat = $('#pStrategy');
    const check = () => {
      const v = strat.value;
      const banned = AD.BANNED_CLAIMS.find(b => v.includes(b));
      const contact = AD.CONTACT_PATTERNS.find(rx => rx.test(v));
      const warn = $('#pWarn');
      if (banned) { warn.textContent = `⚠ 금지 표현 「${banned}」 — 공정위 수사의뢰 사기 유형 문구입니다. 제출 시 관리자 검토 큐로 라우팅됩니다.`; warn.classList.add('show'); }
      else if (contact) { warn.textContent = '⚠ 연락처·외부 채널 유도 감지 — 매칭 확정 전 직접 연락 유도는 제출이 차단됩니다 (플랫폼 우회 방지).'; warn.classList.add('show'); }
      else warn.classList.remove('show');
      // 유사도 (자카드 근사: 2-gram)
      const gram = t => new Set([...t.replace(/\s/g,'')].map((c,i,a)=>c+(a[i+1]||'')));
      const A = gram(v), B = gram(lastProposal);
      const inter = [...A].filter(x=>B.has(x)).length;
      const sim = Math.round(inter / (A.size + B.size - inter) * 100) || 0;
      $('#dupVal').textContent = sim + '%';
      const bar = $('#dupBar'); bar.style.width = sim + '%'; bar.style.background = sim>=80?'var(--danger)':sim>=50?'#b88a00':'var(--partner)';
      $('#pSubmit').disabled = sim >= 80 || !!contact;
      $('#pSubmit').textContent = sim>=80 ? `제출 차단 — 직전 제안서와 ${sim}% 동일` : contact ? '제출 차단 — 연락처 유도 감지' : '제안서 제출 (슬롯 4/5 선점)';
    };
    strat.oninput = check; check();
    $('#bizCheck').onclick = () => {
      const out = $('#bizOut');
      const v = $('#bizNo').value.trim();
      if (v === '214-88-33021') { out.className='verify-out ok'; out.textContent='✓ 국세청 진위확인 일치 — 계속사업자 · 일반과세 · 개업 2019-04-02 · 대표자명 일치 (분기별 상태조회로 폐업 자동 감지)'; }
      else { out.className='verify-out no'; out.textContent='✕ 국세청 정보 불일치 — 사업자번호·개업일자·대표자명을 확인하세요. 불일치 시 가입·제안이 차단됩니다.'; }
    };
    $('#pSubmit').onclick = () => toast('제안서 제출 — 슬롯 4/5. 유효기간은 요청 마감일 +5일(8/24)로 설정되어 먼저 내도 손해 보지 않습니다');
  }

  /* 확정 모달 · 노출 기준 모달 */
  function bindModals() {
    $('#confirmCancel').onclick = () => $('#confirmModal').classList.remove('on');
    $('#confirmModal').onclick = e => { if (e.target === $('#confirmModal')) $('#confirmModal').classList.remove('on'); };
    $('#confirmOk').onclick = () => {
      if (!$('#c1').checked || !$('#c2').checked) { toast('두 개의 동의가 모두 필요합니다 — 제3자 제공 동의는 대행사가 특정된 지금 시점에 받습니다', true); return; }
      $('#confirmModal').classList.remove('on');
      toast('매칭 확정 — 양측 연락처 상호 공개. D+3, D+10에 진행 확인 알림이 발송됩니다 (노쇼·연락두절 관측)');
    };
    $('#whyClose').onclick = () => $('#whyModal').classList.remove('on');
    $('#whyModal').onclick = e => { if (e.target === $('#whyModal')) $('#whyModal').classList.remove('on'); };
  }

  function heroWords() {
    const h = $('#heroH1');
    h.innerHTML = h.innerHTML.split('<br>').map(l => l.split(' ').map(w => `<span class="w">${w}</span>`).join(' ')).join('<br>');
    $$('#heroH1 .w').forEach((w,i) => w.style.animationDelay = (i*55)+'ms');
  }
  let io;
  function reveal() {
    if (!io) io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold:.08 });
    $$('.rv:not(.in)').forEach(el => io.observe(el));
  }
  function init() {
    $$('#gnb button').forEach(b => b.onclick = () => go(b.dataset.v));
    $$('#viewas button').forEach(b => b.onclick = () => {
      role = b.dataset.r;
      $$('#viewas button').forEach(x => x.classList.toggle('on', x === b));
      renderCompare();
      toast({owner:'작성자 시점 — 전체 공개', agency:'제안 전 대행사 — 상호·연락처 마스킹, 첨부 잠금', lost:'낙선 대행사 — 열람 권한 회수', admin:'관리자 — 전체 + 열람 사유 기록'}[role]);
    });
    heroWords(); bindModals(); reveal();
  }
  document.addEventListener('DOMContentLoaded', init);
  return { go, toast };
})();
