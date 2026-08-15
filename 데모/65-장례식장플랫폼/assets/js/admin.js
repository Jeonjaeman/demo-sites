/* 온화 ONHWA — 관리자(지점 오피스 + 본부 마스터). 실제 계산·상태 전환. */
(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const { fmt, won, typeLabel, typeBadge, priceAt, freshLevel, freshText, availRooms, itemVariance } = DDX;
const ST={ avail:["avail","가용"], hold:["hold","예약중"], full:["full","만실"] };
let toastT; function toast(m){ const t=$("#toast"); t.textContent=m; t.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),2600); }

const MY_BRANCH="b1"; // 지점 오피스 = 창원본관 지점장으로 로그인 가정
const NAV={
  branch:[ {v:"b-reserv",label:"예약 관리",ic:"📅"},{v:"b-rooms",label:"빈소 현황",ic:"🛏"},
           {v:"b-price",label:"용품 단가",ic:"🏷"},{v:"b-consult",label:"상담 관리",ic:"💬"} ],
  master:[ {v:"m-dash",label:"대시보드",ic:"📊"},{v:"m-live",label:"전국 지점 현황",ic:"🗺"},
           {v:"m-branches",label:"지점 관리",ic:"🏢"},{v:"m-pay",label:"결제 원장",ic:"💳"},
           {v:"m-settle",label:"지점 정산",ic:"🧾"},{v:"m-price",label:"표준단가·편차",ic:"🏷"},
           {v:"m-policy",label:"정책·리스크 판정기",ic:"⚖"} ],
};
const TITLE={ "b-reserv":["예약 관리","온화 창원본관 · 지점장"],"b-rooms":["빈소 현황","원터치로 상태를 갱신하면 본부 관제에 즉시 반영됩니다"],
  "b-price":["용품 단가","본부 표준가 ± 허용 밴드 안에서 조정 · 밴드 밖은 본부 승인"],"b-consult":["상담 관리","고객 문의 확인·답변"],
  "m-dash":["대시보드","전 지점 통합 · 본부"],"m-live":["전국 지점 현황","실시간(직영) · 최종확인(가맹·제휴)"],
  "m-branches":["지점 관리","지점 등록·유형·권한 · 결제 원본은 지점에서 격리"],"m-pay":["결제 원장","자금흐름에 따라 등록·책임·에스크로가 달라집니다"],
  "m-settle":["지점 정산","공고 미언급 · 프랜차이즈 필수 — 지점별 거래액·수수료·정산 주기"],
  "m-price":["표준단가·편차","본부 표준가 설정 · 지점 간 가격 편차 관제"],"m-policy":["정책·리스크 판정기","사업모델 선택이 규제 요건을 바꿉니다"] };

let role="branch", view="b-reserv";
function setRole(r){ role=r; $$("#roleSwitch button").forEach(b=>b.classList.toggle("on",b.dataset.role===r));
  renderNav(); view=NAV[r][0].v; go(view);
  $("#railWho").innerHTML = r==="branch"? `<b>박지점 지점장</b><span>온화 창원본관 · 직영</span>` : `<b>김본부 운영자</b><span>온화 본부 · 마스터</span>`;
  $("#abarUser").innerHTML = r==="branch"? `지점 · <b>창원본관</b>` : `본부 · <b>마스터</b>`;
}
function renderNav(){ $("#railNav").innerHTML = NAV[role].map(n=>`<button class="rail-item ${n.v===view?"on":""}" data-view="${n.v}"><span class="ri-ic">${n.ic}</span>${n.label}</button>`).join(""); }
function go(v){ view=v; renderNav();
  const t=TITLE[v]||["",""]; $("#abarTitle").textContent=t[0]; $("#abarSub").textContent=t[1];
  const R={ "b-reserv":renderBReserv,"b-rooms":renderBRooms,"b-price":renderBPrice,"b-consult":renderBConsult,
    "m-dash":renderMDash,"m-live":renderMLive,"m-branches":renderMBranches,"m-pay":renderMPay,"m-settle":renderMSettle,"m-price":renderMPrice,"m-policy":renderMPolicy }[v];
  if(R) R();
  $("#acontent").scrollTop=0;
}
document.addEventListener("click",e=>{
  const rl=e.target.closest("#roleSwitch button"); if(rl){ setRole(rl.dataset.role); return; }
  const nv=e.target.closest("[data-view]"); if(nv){ go(nv.dataset.view); return; }
  const cl=e.target.closest("[data-close]"); if(cl){ $$(".modal-bg.open").forEach(m=>m.classList.remove("open")); return; }
  if(e.target.classList.contains("modal-bg")) e.target.classList.remove("open");
});

/* ══════════ 지점 오피스 ══════════ */
const B_STNAME={hold:["hold","보류(15분)"],pending:["warn","승인대기"],confirmed:["ok","확정"],cancelled:["stale","취소"],done:["info","완료"]};
let bReservMode="list";
function renderBReserv(){
  const rs=DD.RESERV.filter(r=>r.branch===MY_BRANCH);
  const pend=rs.filter(r=>r.status==="pending"||r.status==="hold").length;
  $("#acontent").innerHTML=`
    ${pend?`<div class="callout warn"><b>${pend}건</b>의 예약이 승인을 기다리고 있습니다. 승인 전까지 빈소는 보류(hold) 상태로, 미승인 시 예약금은 자동 환불됩니다.</div>`:""}
    <div class="card">
      <div class="card-h"><h3>빈소 예약 현황</h3>
        <div class="seg" style="width:auto"><button class="seg-i ${bReservMode==="list"?"on":""}" data-bmode="list" style="padding:0 16px">목록</button><button class="seg-i ${bReservMode==="cal"?"on":""}" data-bmode="cal" style="padding:0 16px">캘린더</button></div></div>
      <div style="padding:14px 16px 16px">${bReservMode==="list"?bReservList(rs):bReservCal(rs)}</div>
    </div>`;
}
function bReservList(rs){
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>고인/상주</th><th>빈소</th><th>일자</th><th class="r">예약금</th><th>상태</th><th>처리</th></tr></thead>
    <tbody>${rs.map(r=>{ const s=B_STNAME[r.status];
      return `<tr><td><b>${r.deceased}</b><br><span class="muted" style="font-size:.82rem">${r.applicant} · ${r.rel}</span></td>
        <td>${r.room}</td><td class="tnum">${r.date.slice(5)}</td><td class="r tnum">${fmt(r.amount)}</td>
        <td><span class="badge ${s[0]}">${s[1]}</span></td>
        <td>${(r.status==="pending"||r.status==="hold")?`<button class="btn xs pri" data-appr="${r.id}">승인</button> <button class="btn xs dang" data-rej="${r.id}">거부</button>`
          : r.status==="confirmed"?`<button class="btn xs" data-done="${r.id}">완료 처리</button>`:`<span class="muted">—</span>`}</td></tr>`; }).join("")}</tbody></table></div>`;
}
function bReservCal(rs){
  // 2026-08 월 캘린더 (1일=토). 예약을 날짜별로 배치
  const y=2026,m=8, first=new Date(y,m-1,1).getDay(), days=new Date(y,m,0).getDate();
  const byDate={}; rs.forEach(r=>{ const d=+r.date.slice(8,10); (byDate[d]=byDate[d]||[]).push(r); });
  const dow=["일","월","화","수","목","금","토"];
  let cells=""; for(let i=0;i<first;i++) cells+=`<div class="cal-cell empty"></div>`;
  for(let d=1;d<=days;d++){ const items=byDate[d]||[]; const today=d===15;
    cells+=`<div class="cal-cell ${today?"today":""}"><span class="cal-d">${d}</span>
      ${items.map(r=>{ const s=B_STNAME[r.status]; return `<span class="cal-evt ${s[0]}" title="${r.deceased} ${r.room}">${r.room} ${r.deceased.replace("故 ","")}</span>`; }).join("")}</div>`; }
  return `<div class="cal-legend">${["confirmed","pending","hold","cancelled","done"].map(k=>`<span><i class="ce-dot ${B_STNAME[k][0]}"></i>${B_STNAME[k][1]}</span>`).join("")}</div>
    <div class="cal-grid"><div class="cal-head">${dow.map((d,i)=>`<span class="${i===0?"sun":i===6?"sat":""}">${d}</span>`).join("")}</div>
    <div class="cal-body">${cells}</div></div>
    <p class="muted" style="font-size:.82rem;margin-top:10px">2026년 8월 · 같은 빈소·일자에 확정 예약은 1건만 허용됩니다(더블부킹 방지).</p>`;
}
document.addEventListener("click",e=>{
  const bm=e.target.closest("[data-bmode]"); if(bm){ bReservMode=bm.dataset.bmode; renderBReserv(); return; }
  const ap=e.target.closest("[data-appr]"), rj=e.target.closest("[data-rej]"), dn=e.target.closest("[data-done]");
  if(ap){ const r=DD.RESERV.find(x=>x.id===ap.dataset.appr); // 더블부킹 체크
    const clash=DD.RESERV.find(x=>x.id!==r.id && x.branch===r.branch && x.room===r.room && x.date===r.date && x.status==="confirmed");
    if(clash){ toast(`더블부킹 방지 — ${r.room} ${r.date.slice(5)}은 이미 확정 예약이 있습니다`); return; }
    r.status="confirmed"; renderBReserv(); toast(`${r.deceased} 예약이 확정되었습니다 · 예약금 승인`); return; }
  if(rj){ const r=DD.RESERV.find(x=>x.id===rj.dataset.rej); r.status="cancelled"; r.refund=true; renderBReserv(); toast(`예약 거부 — 예약금 ${fmt(r.amount)}원이 자동 환불됩니다`); return; }
  if(dn){ const r=DD.RESERV.find(x=>x.id===dn.dataset.done); r.status="done"; renderBReserv(); toast("장례 완료 처리되었습니다"); return; }
});

function renderBRooms(){
  const b=DD.BRANCHES.find(x=>x.id===MY_BRANCH);
  $("#acontent").innerHTML=`
    <div class="callout"><span class="badge avail"><span class="dot"></span>실시간·본부관제</span> 이 지점은 직영입니다. 아래 상태를 바꾸면 <b>본부 전국 현황판·이용자 사이트</b>에 즉시 반영됩니다.</div>
    <div class="rooms-admin">${b.rooms.map((r,i)=>`
      <div class="room-admin ${r.status}">
        <div class="between"><b class="serif">${r.no}</b><span class="muted">${r.cap}</span></div>
        <div class="room-seg" data-roomseg="${i}">
          ${["avail","hold","full"].map(s=>`<button class="rs ${r.status===s?"on":""}" data-room="${i}:${s}">${ST[s][1]}</button>`).join("")}</div>
      </div>`).join("")}</div>
    <p class="muted" style="margin-top:14px;font-size:.86rem">갱신 즉시 신선도 타임스탬프가 "방금"으로 초기화됩니다. 실시간성의 병목은 API가 아니라 <b>이 한 번의 탭</b>입니다 — 그래서 3초 안에 끝나게 설계했습니다.</p>`;
}
document.addEventListener("click",e=>{ const rm=e.target.closest("[data-room]"); if(!rm) return;
  const [i,s]=rm.dataset.room.split(":"); const b=DD.BRANCHES.find(x=>x.id===MY_BRANCH);
  b.rooms[+i].status=s; b.freshMin=0; renderBRooms(); toast(`${b.rooms[+i].no} → ${ST[s][1]} · 본부 관제 반영`); });

function renderBPrice(){
  const items=DD.ITEMS;
  $("#acontent").innerHTML=`
    <div class="callout">본부 표준가를 기준으로 <b>허용 밴드(±%)</b> 안에서만 자유롭게 조정됩니다. 밴드를 벗어나면 저장되지 않고 <b>본부 승인 요청</b>으로 넘어갑니다.
      <span class="muted">— 가맹점에 가격을 강제하면 위법(재판매가격유지)이므로, 강제가 아닌 '권장가 + 밴드'입니다.</span></div>
    <div class="card"><div class="tbl-wrap"><table class="tbl price-tbl"><thead><tr><th>용품</th><th class="r">본부 표준가</th><th>허용 밴드</th><th style="width:280px">이 지점 확정가</th><th class="r">차이</th></tr></thead>
      <tbody>${items.map(it=>{ const cur=priceAt(MY_BRANCH,it.id); const lo=Math.round(it.std*(1-it.band/100)), hi=Math.round(it.std*(1+it.band/100));
        const diff=cur-it.std, diffPct=Math.round(diff/it.std*1000)/10;
        return `<tr data-itemrow="${it.id}"><td><b>${it.name}</b></td><td class="r tnum">${fmt(it.std)}</td>
          <td class="muted tnum" style="font-size:.82rem">±${it.band}%<br>${fmt(lo)}~${fmt(hi)}</td>
          <td><div class="price-edit"><input class="inp sm-inp price-in" type="number" step="10000" value="${cur}" data-pin="${it.id}" data-lo="${lo}" data-hi="${hi}" data-std="${it.std}">
            <span class="price-flag" id="flag-${it.id}"></span></div></td>
          <td class="r tnum ${diff>0?"up":diff<0?"down":""}">${diff===0?"—":(diff>0?"+":"")+diffPct+"%"}</td></tr>`; }).join("")}</tbody></table></div></div>`;
}
document.addEventListener("input",e=>{ const pin=e.target.closest("[data-pin]"); if(!pin) return;
  const v=+pin.value, lo=+pin.dataset.lo, hi=+pin.dataset.hi, flag=$("#flag-"+pin.dataset.pin);
  if(v<lo||v>hi){ flag.innerHTML=`<span class="badge danger">밴드 밖 · 승인요청</span>`; pin.classList.add("out"); }
  else { flag.innerHTML=`<span class="badge ok">밴드 내 · 자동저장</span>`; pin.classList.remove("out"); }
});
document.addEventListener("change",e=>{ const pin=e.target.closest("[data-pin]"); if(!pin) return;
  const v=+pin.value, lo=+pin.dataset.lo, hi=+pin.dataset.hi;
  if(v<lo||v>hi){ toast("밴드를 벗어난 단가 — 본부 승인 요청으로 접수되었습니다"); }
  else { DD.BRANCH_PRICE[MY_BRANCH]=DD.BRANCH_PRICE[MY_BRANCH]||{}; DD.BRANCH_PRICE[MY_BRANCH][pin.dataset.pin]=v; toast("확정가가 저장되었습니다 (밴드 내 자동승인)"); }
});

function renderBConsult(){
  const cs=DD.CONSULT.filter(c=>c.branch===MY_BRANCH);
  $("#acontent").innerHTML=`<div class="consult-list">${cs.map(c=>`
    <div class="card pad consult-card">
      <div class="between"><div><b>${c.name}</b> <span class="muted">${c.tel} · ${c.at}</span></div>
        <span class="badge ${c.status==="완료"?"ok":"warn"}">${c.status}</span></div>
      <p class="consult-topic">${c.topic}</p><p class="muted">${c.body}</p>
      ${c.reply?`<div class="consult-reply"><b>답변</b> ${c.reply}</div>`
        :`<div class="consult-answer"><input class="inp" placeholder="답변을 입력하세요" data-reply="${c.id}"><button class="btn pri sm" data-send="${c.id}">답변 전송</button></div>`}
    </div>`).join("")}</div>`;
}
document.addEventListener("click",e=>{ const sd=e.target.closest("[data-send]"); if(!sd) return;
  const c=DD.CONSULT.find(x=>x.id===sd.dataset.send); const inp=$(`[data-reply="${c.id}"]`); if(!inp.value.trim()){ toast("답변을 입력하세요"); return; }
  c.reply=inp.value.trim(); c.status="완료"; renderBConsult(); toast("답변이 전송되었습니다"); });

/* ══════════ 본부 마스터 ══════════ */
function renderMDash(){
  const s=DD.STATS;
  $("#acontent").innerHTML=`
    <div class="kpi-row">
      ${kpi("오늘 예약",s.todayReserv,"건","pine")}
      ${kpi("오늘 결제액",s.todayAmount,"원","gold",true)}
      ${kpi("주간 예약",s.weekReserv,"건","info")}
      ${kpi("빈소 점유율",Math.round(s.occupancy*100),"%","ok")}
    </div>
    <div class="dash-grid">
      <div class="card pad"><div class="card-h"><h3>주간 예약 추이</h3></div><canvas id="cTrend" height="220"></canvas></div>
      <div class="card pad"><div class="card-h"><h3>지점 유형별 예약</h3></div>
        <div class="donut-wrap"><canvas id="cDonut" width="180" height="180"></canvas>
          <div class="donut-legend">${s.byType.map(t=>`<div><span class="ld" style="background:${t.c}"></span>${t.t} <b>${t.v}</b></div>`).join("")}</div></div></div>
      <div class="card pad"><div class="card-h"><h3>트래픽</h3><span class="muted">방문·견적·전환</span></div>
        <div class="traffic-kpis">
          <div><span>오늘 방문</span><b class="serif tnum">${fmt(s.visitsToday)}</b></div>
          <div><span>견적 조회</span><b class="serif tnum">${fmt(s.quotesToday)}</b></div>
          <div><span>예약 전환율</span><b class="serif tnum">${(s.convRate*100).toFixed(1)}%</b></div>
        </div>
        <canvas id="cTraffic" height="90"></canvas>
        <div class="traffic-src">${s.trafficSrc.map(t=>`<span><i class="ld" style="background:${t.c}"></i>${t.t} ${t.v}%</span>`).join("")}</div></div>
      <div class="card pad dash-pay"><div class="card-h"><h3>오늘 결제 요약</h3></div>
        <div class="paysum"><div><span>결제 승인</span><b class="tnum">${fmt(s.payToday)}원</b></div>
          <div><span>환불</span><b class="tnum down">-${fmt(s.refundToday)}원</b></div>
          <div><span>예치(hold)</span><b class="tnum">${fmt(s.escrowHold)}원</b></div></div>
        <p class="muted" style="font-size:.82rem;margin-top:10px">예치금은 지점 승인 시 확정, 미승인 시 자동 환불됩니다.</p></div>
    </div>`;
  requestAnimationFrame(()=>{ drawTrend($("#cTrend"),s.trend); drawDonut($("#cDonut"),s.byType); drawSparkline($("#cTraffic"),s.trafficTrend); animateKpis(); });
}
function kpi(label,val,unit,color,money){ return `<div class="kpi ${color}"><span class="kpi-l">${label}</span>
  <b class="kpi-v serif" data-kpi="${val}" data-money="${money?1:0}">0</b><span class="kpi-u">${unit}</span></div>`; }
function animateKpis(){ $$("[data-kpi]").forEach(el=>{ const to=+el.dataset.kpi,money=el.dataset.money==="1",dur=900,t0=performance.now();
  function tick(t){ const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3),v=Math.round(to*e); el.textContent=money?fmt(v):v; if(p<1)requestAnimationFrame(tick); }
  requestAnimationFrame(tick); setTimeout(()=>{ el.textContent=money?fmt(to):to; },1200); }); }

function renderMLive(){
  const byRegion={}; DD.BRANCHES.forEach(b=>{ (byRegion[b.region]=byRegion[b.region]||[]).push(b); });
  $("#acontent").innerHTML=`
    <div class="callout">직영 지점은 <b>실시간</b>으로 갱신됩니다. 가맹·제휴 지점은 <b>최종 확인 시각</b>과 함께 표시하여, 신선하지 않은 현황을 실시간인 척하지 않습니다.</div>
    <div class="live-board">${Object.entries(byRegion).map(([region,list])=>`
      <div class="lb-region"><h4 class="lb-region-h">${region}</h4>
        <div class="lb-branches">${list.map(b=>{ const lv=freshLevel(b.freshMin);
          return `<div class="lb-branch">
            <div class="between"><div class="row" style="gap:6px"><span class="badge ${typeBadge(b.type)}">${typeLabel(b.type)}</span>
              ${b.type==="own"?`<span class="badge avail" style="height:20px"><span class="dot"></span>실시간</span>`:`<span class="badge ${lv==="stale"?"stale":"warn"}" style="height:20px">${freshText(b.freshMin)}</span>`}</div></div>
            <b class="lb-name">${b.name}</b>
            <div class="lb-rooms">${b.rooms.map(r=>`<span class="lbroom ${r.status}" title="${r.no} ${ST[r.status][1]}">${r.no}</span>`).join("")}</div>
            <span class="muted lb-avail">가용 ${availRooms(b)} / ${b.rooms.length}실</span></div>`; }).join("")}</div></div>`).join("")}</div>`;
}

function renderMBranches(){
  $("#acontent").innerHTML=`
    <div class="callout">지점 <b>유형(직영/가맹/제휴)</b>에 따라 적용 규제가 다릅니다. 가맹은 정보공개서·가맹금·가격강제 금지가 적용됩니다(정책 판정기 참고).
      결제 <b>원본 정보(카드번호·승인)는 지점에서 접근 불가</b>하도록 격리되어 있습니다.</div>
    <div class="card"><div class="card-h"><h3>지점 DB</h3><button class="btn sm pri" id="branchAdd">+ 지점 등록</button></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>지점</th><th>지역</th><th>유형</th><th>빈소</th><th>지점장 권한</th><th>결제원본</th><th>가맹 서류</th></tr></thead>
      <tbody>${DD.BRANCHES.map(b=>`<tr><td><b>${b.name}</b></td><td>${b.region}</td>
        <td><span class="badge ${typeBadge(b.type)}">${typeLabel(b.type)}</span></td>
        <td class="tnum">${b.rooms.length}실</td>
        <td><span class="muted" style="font-size:.82rem">담당 지점만</span></td>
        <td><span class="badge stale" style="height:20px">격리</span></td>
        <td>${b.type==="fr"?`<span class="badge warn" style="height:20px">정보공개서·가맹금</span>`:b.type==="aff"?`<span class="badge info" style="height:20px">제휴계약</span>`:`<span class="muted">—</span>`}</td></tr>`).join("")}</tbody></table></div></div>`;
}

function openBranchAdd(){
  $("#aModalBody").innerHTML=`
    <div class="modal-h between"><h2 class="serif d-md">지점 등록</h2><button class="modal-close" data-close>×</button></div>
    <div class="modal-b stack" style="gap:14px">
      <div class="field"><label>지점명</label><input class="inp" id="nbName" placeholder="온화 ○○점"></div>
      <div class="two"><div class="field"><label>지역</label><select class="inp" id="nbRegion">${DD.REGIONS.map(r=>`<option>${r}</option>`).join("")}</select></div>
        <div class="field"><label>유형</label><select class="inp" id="nbType"><option value="own">직영</option><option value="fr">가맹</option><option value="aff">제휴입점</option></select></div></div>
      <div class="field"><label>주소</label><input class="inp" id="nbAddr" placeholder="주소"></div>
      <div class="two"><div class="field"><label>대표전화</label><input class="inp" id="nbTel" placeholder="000-000-0000"></div>
        <div class="field"><label>빈소 수</label><input class="inp" type="number" id="nbRooms" value="3" min="1" max="8"></div></div>
      <div id="nbFrNote" class="callout warn" hidden style="margin:0">가맹으로 등록하면 정보공개서·가맹금 예치 대상이며, 용품가는 강제할 수 없습니다(권장가+밴드).</div>
      <button class="btn pri block lg" id="nbSave">지점 등록</button>
    </div>`;
  $("#aModal").classList.add("open");
}
document.addEventListener("click",e=>{ if(e.target.closest("#branchAdd")) openBranchAdd(); });
document.addEventListener("change",e=>{ if(e.target.id==="nbType"){ $("#nbFrNote").hidden = e.target.value!=="fr"; } });
document.addEventListener("click",e=>{ if(!e.target.closest("#nbSave")) return;
  const name=$("#nbName").value.trim(); if(!name){ toast("지점명을 입력하세요"); return; }
  const n=+$("#nbRooms").value||3, id="b"+(DD.BRANCHES.length+1);
  DD.BRANCHES.push({ id, name, region:$("#nbRegion").value, type:$("#nbType").value, addr:$("#nbAddr").value.trim()||"주소 미입력", tel:$("#nbTel").value.trim()||"000-0000-0000", freshMin:0,
    rooms:Array.from({length:n},(_,i)=>({no:(i+1)+"호",status:"avail",cap:"80석"})) });
  $("#aModal").classList.remove("open"); renderMBranches(); toast(`${name} 지점이 등록되었습니다 · ${DDX.typeLabel($("#nbType").value)}`); });

let payFlow="본부수금";
function renderMPay(){
  const rows=DD.PAY;
  $("#acontent").innerHTML=`
    <div class="card pad flow-card">
      <div class="card-h"><h3>자금 흐름 설계</h3><span class="muted">이 선택이 등록 의무·책임 주체·정산을 바꿉니다</span></div>
      <div class="seg flow-seg" style="max-width:420px">
        <button class="seg-i ${payFlow==="본부수금"?"on":""}" data-flow="본부수금">본부 중앙 수금</button>
        <button class="seg-i ${payFlow==="지점직수령"?"on":""}" data-flow="지점직수령">지점 직수령 대행</button></div>
      <div class="flow-diagram" id="flowDiagram"></div>
    </div>
    <div class="card"><div class="card-h"><h3>결제·환불 원장</h3></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>일시</th><th>지점</th><th>결제자</th><th>구분</th><th class="r">금액</th><th>수단</th><th>흐름</th><th>상태</th></tr></thead>
        <tbody>${rows.map(p=>{ const b=DD.BRANCHES.find(x=>x.id===p.branch);
          return `<tr><td class="muted tnum">${p.at}</td><td>${b?b.name:p.branch}</td><td>${p.payer}</td><td>${p.kind}</td>
            <td class="r tnum">${fmt(p.amount)}</td><td>${p.method}</td><td><span class="badge line" style="height:20px">${p.flow}</span></td>
            <td><span class="badge ${p.status==="환불"?"stale":p.status==="예치"?"warn":"ok"}">${p.status}</span></td></tr>`; }).join("")}</tbody></table></div></div>`;
  drawFlow();
}
function drawFlow(){
  const central = payFlow==="본부수금";
  $("#flowDiagram").innerHTML=`
    <div class="flow-nodes">
      <div class="fnode">유족<br>결제</div><span class="farrow">→</span>
      <div class="fnode pg">PG${central?" · 에스크로":""}</div><span class="farrow">→</span>
      <div class="fnode ${central?"hot":""}">${central?"본부 정산 계정":"지점 계정 직수령"}</div>
      ${central?`<span class="farrow">→</span><div class="fnode">지점 정산<br>(주기별)</div>`:""}
    </div>
    <div class="flow-facts">
      <div class="ffact"><span>PG 등록·중개책임</span><b class="${central?"warn-t":""}">${central?"본부에 발생(대금 직접 수령)":"지점(사업자) 귀속 · 본부는 중개"}</b></div>
      <div class="ffact"><span>현금결제 에스크로</span><b>${central?"본부 의무":"지점 의무"}</b></div>
      <div class="ffact"><span>환불 책임 주체</span><b>${central?"본부":"지점"}</b></div>
      <div class="ffact"><span>선불식(선수금 중앙수금)</span><b class="${central?"danger-t":""}">${central?"규모↑ → 상조업 리스크 확대":"지점 분산 → 상대적으로 낮음"}</b></div>
    </div>`;
}
document.addEventListener("click",e=>{ const fl=e.target.closest("[data-flow]"); if(!fl) return; payFlow=fl.dataset.flow; renderMPay(); });

function renderMPrice(){
  $("#acontent").innerHTML=`
    <div class="callout">본부 표준가를 기준으로 지점별 확정가의 <b>편차</b>를 관제합니다. 편차가 크면 같은 브랜드에서 가격이 달라 신뢰가 깨집니다.
      아래 히트맵에서 진할수록 표준가에서 멀어진 지점입니다.</div>
    ${DD.PRICE_REQUESTS.filter(r=>r.status==="pending").length?`<div class="card pad" style="margin-bottom:16px"><div class="card-h"><h3>밴드 밖 단가 승인 요청</h3></div>
      ${DD.PRICE_REQUESTS.filter(r=>r.status==="pending").map(r=>{ const b=DD.BRANCHES.find(x=>x.id===r.branch),it=DD.ITEMS.find(x=>x.id===r.item);
        return `<div class="req-row"><div><b>${b.name}</b> · ${it.name} <span class="muted">표준 ${fmt(r.std)} · 요청 ${fmt(r.req)} (±${r.band}% 밖)</span></div>
          <div class="row" style="gap:6px"><button class="btn xs pri" data-preq="ok:${r.id}">승인</button><button class="btn xs dang" data-preq="no:${r.id}">반려</button></div></div>`; }).join("")}</div>`:""}
    <div class="card pad"><div class="card-h"><h3>지점 간 가격 편차 히트맵</h3><span class="muted">행=용품 · 열=지점 · 색=표준가 대비</span></div>
      <div class="tbl-wrap"><table class="heat"><thead><tr><th>용품</th>${DD.BRANCHES.map(b=>`<th title="${b.name}">${b.name.replace("온화 ","")}</th>`).join("")}<th class="r">편차</th></tr></thead>
        <tbody>${DD.ITEMS.map(it=>{ const v=itemVariance(it.id);
          return `<tr><td class="heat-name">${it.name}</td>${DD.BRANCHES.map(b=>{ const p=priceAt(b.id,it.id); const d=(p-it.std)/it.std;
            const lvl=Math.min(1,Math.abs(d)/(it.band/100)); const bg=d>0?`rgba(178,58,72,${lvl*0.55})`:d<0?`rgba(58,90,140,${lvl*0.55})`:"transparent";
            return `<td class="heat-c" style="background:${bg}" title="${b.name} ${fmt(p)}원">${d===0?"·":(d>0?"+":"")+Math.round(d*100)+"%"}</td>`; }).join("")}
            <td class="r tnum ${v.spreadPct>15?"warn-t":""}">${v.spreadPct}%</td></tr>`; }).join("")}</tbody></table></div></div>`;
}
document.addEventListener("click",e=>{ const pr=e.target.closest("[data-preq]"); if(!pr) return;
  const [act,id]=pr.dataset.preq.split(":"); const r=DD.PRICE_REQUESTS.find(x=>x.id===id); r.status=act==="ok"?"승인":"반려";
  if(act==="ok"){ DD.BRANCH_PRICE[r.branch]=DD.BRANCH_PRICE[r.branch]||{}; DD.BRANCH_PRICE[r.branch][r.item]=r.req; }
  renderMPrice(); toast(act==="ok"?"단가 승인 — 지점 확정가에 반영":"단가 요청을 반려했습니다"); });

function renderMSettle(){
  const rows=DD.SETTLEMENT.map(s=>{ const b=DD.BRANCHES.find(x=>x.id===s.branch); const fee=Math.round(s.gross*s.fee); const net=s.gross-fee;
    return {b, ...s, fee$:fee, net}; });
  const totalGross=rows.reduce((a,x)=>a+x.gross,0), totalFee=rows.reduce((a,x)=>a+x.fee$,0);
  $("#acontent").innerHTML=`
    <div class="callout"><b>공고엔 "결제 관리"만 있었습니다.</b> 그러나 본부-지점 구조에서는 지점별 <b>거래액·수수료·정산</b>이 없으면 운영이 돌아가지 않습니다.
      가맹(9%)과 직영(6%) 수수료율이 다르고, 분쟁 건은 정산이 보류됩니다.</div>
    <div class="kpi-row" style="grid-template-columns:repeat(3,1fr)">
      ${kpi("이번 주 총 거래액",totalGross,"원","pine",true)}
      ${kpi("본부 수수료 합계",totalFee,"원","gold",true)}
      ${kpi("정산 대상 지점",rows.length,"곳","info")}
    </div>
    <div class="card"><div class="card-h"><h3>지점별 정산 명세</h3><span class="muted">주간 정산 · 직영 6% · 가맹/제휴 9%</span></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>지점</th><th>유형</th><th class="r">거래액</th><th class="r">수수료율</th><th class="r">본부 수수료</th><th class="r">지점 정산액</th><th>정산 예정</th><th>상태</th></tr></thead>
        <tbody>${rows.map(x=>`<tr><td><b>${x.b?x.b.name:x.branch}</b></td>
          <td><span class="badge ${typeBadge(x.b?x.b.type:"own")}">${typeLabel(x.b?x.b.type:"own")}</span></td>
          <td class="r tnum">${fmt(x.gross)}</td><td class="r tnum">${Math.round(x.fee*100)}%</td>
          <td class="r tnum">${fmt(x.fee$)}</td><td class="r tnum"><b>${fmt(x.net)}</b></td>
          <td class="tnum">${x.at}</td>
          <td><span class="badge ${x.status==="정산완료"?"ok":x.status.startsWith("보류")?"danger":"warn"}">${x.status}</span></td></tr>`).join("")}</tbody></table></div></div>`;
  requestAnimationFrame(animateKpis);
}

/* 정책 판정기 */
let payMode="instant", bizType="own";
function renderMPolicy(){
  $("#acontent").innerHTML=`
    <div class="policy-grid">
      <div class="card pad">
        <div class="card-h"><h3>① 선불식 할부거래(상조업) 판정기</h3></div>
        <p class="muted" style="font-size:.88rem;margin-bottom:14px">결제 방식을 고르면 상조업 등록 요건이 켜지고 꺼집니다.</p>
        <div class="seg" style="max-width:100%">
          <button class="seg-i ${payMode==="instant"?"on":""}" data-pm="instant">제공시기 확정 · 즉시결제(3일장)</button>
          <button class="seg-i ${payMode==="prepay"?"on":""}" data-pm="prepay">미리 가입·적립(상조상품)</button></div>
        <div id="prepayVerdict" class="verdict"></div>
      </div>
      <div class="card pad">
        <div class="card-h"><h3>② 가맹 vs 직영 규제 판정기</h3></div>
        <p class="muted" style="font-size:.88rem;margin-bottom:14px">지점 운영 방식을 고르면 가맹사업법 적용 여부가 바뀝니다.</p>
        <div class="seg" style="max-width:100%">
          <button class="seg-i ${bizType==="own"?"on":""}" data-bt="own">직영 체인</button>
          <button class="seg-i ${bizType==="fr"?"on":""}" data-bt="fr">가맹(프랜차이즈)</button></div>
        <div id="frVerdict" class="verdict"></div>
      </div>
    </div>
    <div class="callout" style="margin-top:16px">이 판정기는 착수 미팅에서 사업모델을 확정하기 위한 도구입니다. 근거: 할부거래법 제2조(장례 용역·제공시기 확정 제외),
      가맹사업법 제7조(정보공개서), 공정거래법(재판매가격유지 금지).</div>`;
  drawPrepay(); drawFr();
}
function drawPrepay(){
  const prepay=payMode==="prepay";
  $("#prepayVerdict").innerHTML = prepay
    ? `<div class="vhead danger"><span class="badge danger">상조업 등록 대상</span></div>
       <ul class="vlist"><li class="on">할부거래법상 <b>선불식 할부거래</b>에 해당</li>
         <li class="on">공정위 <b>선불식 할부거래업 등록</b> 필요</li><li class="on"><b>자본금 15억원</b> 상시 유지</li>
         <li class="on"><b>선수금 50%</b> 은행/공제조합 예치</li><li class="on">본부 중앙 수금 시 규모 커져 부담 확대</li></ul>
       <p class="vnote">데모에서는 '미리 가입/적립' 결제 옵션을 <b>잠금</b> 처리합니다.</p>`
    : `<div class="vhead ok"><span class="badge ok">선불식 비해당</span></div>
       <ul class="vlist"><li>임종 직후 3일장 = <b>제공시기 확정</b> → 법 적용 제외</li>
         <li>전자상거래 선결제·예약금에 해당</li><li>상조업 등록·자본금·예치 <b>불필요</b></li>
         <li>단, PG 자금흐름(본부/지점)은 별도 설계 필요</li></ul>
       <p class="vnote">이용자 결제 화면에 '선불식 비해당' 배지로 노출됩니다.</p>`;
}
function drawFr(){
  const fr=bizType==="fr";
  $("#frVerdict").innerHTML = fr
    ? `<div class="vhead warn"><span class="badge warn">가맹사업법 적용</span></div>
       <ul class="vlist"><li class="on"><b>정보공개서</b> 등록·제공 의무(공정위/시·도)</li>
         <li class="on"><b>가맹금 예치</b> 의무</li><li class="on">지점 용품가 <b>강제 금지</b> — 권장가+밴드만 가능</li>
         <li class="on">가맹점 결제 정산 경로 설계 필요</li></ul>
       <p class="vnote">지점 관리에 정보공개서·가맹금 상태 필드가 나타납니다.</p>`
    : `<div class="vhead ok"><span class="badge ok">가맹사업법 미적용</span></div>
       <ul class="vlist"><li>직영 = 본부의 사업장 → 가맹본부 아님</li>
         <li>정보공개서·가맹금 <b>불필요</b></li><li>용품가 본부 <b>통일 설정 가능</b>(밴드 0)</li>
         <li>실시간 빈소 현황 담보가 가장 쉬움</li></ul>
       <p class="vnote">본부가 표준가를 그대로 강제해도 문제되지 않습니다.</p>`;
}
document.addEventListener("click",e=>{ const pm=e.target.closest("[data-pm]"); if(pm){ payMode=pm.dataset.pm; $$("[data-pm]").forEach(x=>x.classList.toggle("on",x===pm)); drawPrepay(); return; }
  const bt=e.target.closest("[data-bt]"); if(bt){ bizType=bt.dataset.bt; $$("[data-bt]").forEach(x=>x.classList.toggle("on",x===bt)); drawFr(); return; } });

/* ══════════ canvas 차트 ══════════ */
function setupCanvas(cv,w,h){ const dpr=window.devicePixelRatio||1; cv.width=w*dpr; cv.height=h*dpr; cv.style.width=w+"px"; cv.style.height=h+"px";
  const ctx=cv.getContext("2d"); ctx.scale(dpr,dpr); return ctx; }
function drawTrend(cv,data){ if(!cv) return; const w=cv.clientWidth||560,h=220,ctx=setupCanvas(cv,w,h);
  const pad=28, bw=(w-pad*2)/data.length*0.56, gap=(w-pad*2)/data.length, max=Math.max(...data.map(d=>d.v))*1.15;
  ctx.clearRect(0,0,w,h);
  data.forEach((d,i)=>{ const x=pad+gap*i+gap/2, bh=(h-46)*(d.v/max), y=h-30-bh;
    const hot=d.v===Math.max(...data.map(v=>v.v));
    ctx.fillStyle=hot?"#A8895C":"#2C4A3B"; ctx.globalAlpha=hot?1:.82;
    roundRect(ctx,x-bw/2,y,bw,bh,4); ctx.fill(); ctx.globalAlpha=1;
    ctx.fillStyle="#57524A"; ctx.font="600 12px Pretendard,sans-serif"; ctx.textAlign="center";
    ctx.fillText(d.d,x,h-10); ctx.fillStyle="#17150F"; ctx.font="700 12px Pretendard,sans-serif"; ctx.fillText(d.v,x,y-6); });
}
function drawSparkline(cv,data){ if(!cv) return; const w=cv.clientWidth||360,h=90,ctx=setupCanvas(cv,w,h);
  const max=Math.max(...data.map(d=>d.v)),min=Math.min(...data.map(d=>d.v)),pad=6;
  const xs=i=>pad+i*(w-pad*2)/(data.length-1), ys=v=>h-16-(v-min)/(max-min||1)*(h-28);
  ctx.clearRect(0,0,w,h);
  ctx.beginPath(); data.forEach((d,i)=>{ i?ctx.lineTo(xs(i),ys(d.v)):ctx.moveTo(xs(i),ys(d.v)); });
  ctx.lineTo(xs(data.length-1),h-6); ctx.lineTo(xs(0),h-6); ctx.closePath();
  const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,"rgba(44,74,59,.22)"); g.addColorStop(1,"rgba(44,74,59,0)"); ctx.fillStyle=g; ctx.fill();
  ctx.beginPath(); data.forEach((d,i)=>{ i?ctx.lineTo(xs(i),ys(d.v)):ctx.moveTo(xs(i),ys(d.v)); });
  ctx.strokeStyle="#2C4A3B"; ctx.lineWidth=2; ctx.lineJoin="round"; ctx.stroke();
  const li=data.length-1; ctx.beginPath(); ctx.arc(xs(li),ys(data[li].v),3.5,0,Math.PI*2); ctx.fillStyle="#A8895C"; ctx.fill();
}
function drawDonut(cv,segs){ if(!cv) return; const ctx=setupCanvas(cv,180,180),cx=90,cy=90,r=64,ir=42;
  const total=segs.reduce((s,x)=>s+x.v,0); let a=-Math.PI/2;
  ctx.clearRect(0,0,180,180);
  segs.forEach(s=>{ const ang=s.v/total*Math.PI*2; ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,a,a+ang); ctx.closePath(); ctx.fillStyle=s.c; ctx.fill(); a+=ang; });
  ctx.beginPath(); ctx.arc(cx,cy,ir,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill();
  ctx.fillStyle="#17150F"; ctx.font="800 22px 'Nanum Myeongjo',serif"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(total,cx,cy-4);
  ctx.fillStyle="#928C7E"; ctx.font="600 11px Pretendard,sans-serif"; ctx.fillText("건",cx,cy+14);
}
function roundRect(ctx,x,y,w,h,r){ r=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

/* 초기화 */
setRole("branch");
})();
