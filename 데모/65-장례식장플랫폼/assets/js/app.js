/* 온화 ONHWA — 공개앱 로직. 실제 계산·상태 전환. 외부 라이브러리 없음. */
(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const { fmt, won, typeLabel, typeBadge, priceAt, freshLevel, freshText, availRooms, itemVariance } = DDX;
const statusMap = { avail:["avail","가용"], hold:["hold","예약중"], full:["full","만실"] };
let toastT;
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),2600); }

/* ── 라우터 ── */
const VIEWS=["home","search","detail","estimate","obituary","mypage"];
let cur="home";
function go(view, arg){
  if(!VIEWS.includes(view)) view="home";
  cur=view;
  VIEWS.forEach(v=>{ const el=$("#v-"+v); if(el) el.hidden = v!==view; });
  $$(".nav-menu button").forEach(b=>b.classList.toggle("on", b.dataset.go===view));
  window.scrollTo({top:0,behavior:"instant"});
  if(view==="search") renderSearch();
  else if(view==="detail") renderDetail(arg);
  else if(view==="estimate") renderEstimate();
  else if(view==="obituary") renderObituary();
  else if(view==="mypage") renderMypage();
  observeReveal();
}
document.addEventListener("click",e=>{
  const g=e.target.closest("[data-go]"); if(g){ go(g.dataset.go); closeNav(); return; }
  const em=e.target.closest("[data-emergency]"); if(em){ openEmergency(); return; }
  const cl=e.target.closest("[data-close]"); if(cl){ $$(".modal-bg.open").forEach(m=>m.classList.remove("open")); return; }
  if(e.target.classList.contains("modal-bg")) e.target.classList.remove("open");
});

/* 모바일 메뉴 */
function closeNav(){ $("#nav").classList.remove("open"); }
$("#navBurger").addEventListener("click",()=>$("#nav").classList.toggle("open"));

/* ── 홈 ── */
function renderHome(){
  // 히어로 메타
  $("#hmBranch").textContent = DD.BRANCHES.length;
  const totalAvail = DD.BRANCHES.reduce((s,b)=>s+availRooms(b),0);
  countUp($("#hmAvail"), totalAvail);
  // 긴급도
  $("#urgGrid").innerHTML = DD.URGENCY.map(u=>`
    <button class="urg-card ${u.hot?"hot":""}" data-urg="${u.id}">
      <span class="urg-ic">${u.hot?"☎":u.id==="u_soon"?"⏱":"📄"}</span>
      <span class="urg-body"><b>${u.label}</b><span>${u.sub}</span></span>
      <span class="urg-arrow">→</span>
    </button>`).join("");
  // 신뢰 3원칙
  $("#trustGrid").innerHTML = DD.TRUST.map((t,i)=>`
    <div class="trust-card rv" style="transition-delay:${i*90}ms">
      <span class="trust-num serif">0${i+1}</span>
      <h3 class="serif">${t.t}</h3><p class="muted">${t.d}</p></div>`).join("");
  // 실시간 지점(가용 많은 순 4)
  const top=[...DD.BRANCHES].sort((a,b)=>availRooms(b)-availRooms(a)).slice(0,4);
  $("#liveGrid").innerHTML = top.map(b=>liveCard(b)).join("");
  // 상품 티어
  $("#pkgGrid").innerHTML = DD.PACKAGES.map(p=>`
    <div class="pkg-card card hover rv" data-pkg="${p.id}">
      <div class="pkg-tag badge ${p.tag==="프리미엄"?"gold":p.tag==="인기"?"ok":"line"}">${p.tag}</div>
      <h3 class="serif d-md">${p.name}</h3><p class="muted">${p.desc}</p>
      <div class="pkg-from">최소 <b class="serif">${fmt(p.from)}</b>원~</div>
      <button class="btn sm block" data-go="estimate">견적 담기 →</button></div>`).join("");
  // 부고장 미리보기(홈 CTA)
  $("#obitCtaPrev").innerHTML = obitCardHtml(DD.OBIT_SAMPLE, true);
}
function liveCard(b){
  const lv=freshLevel(b.freshMin), avail=availRooms(b);
  const badge = b.type==="own" ? `<span class="badge avail"><span class="dot"></span>실시간·본부관제</span>`
    : `<span class="badge ${lv==="stale"?"stale":"warn"}">최종확인 ${freshText(b.freshMin)}</span>`;
  return `<div class="live-card card hover" data-detail="${b.id}">
    <div class="between"><span class="badge ${typeBadge(b.type)}">${typeLabel(b.type)}</span>${badge}</div>
    <h3 class="serif">${b.name}</h3>
    <p class="muted lc-addr">${b.addr}</p>
    <div class="lc-rooms">${b.rooms.map(r=>`<span class="room-dot ${r.status}" title="${r.no} ${statusMap[r.status][1]}"></span>`).join("")}
      <span class="lc-avail">${avail>0?`가용 <b>${avail}</b>실`:`만실`}</span></div>
    <button class="btn sm block ${avail>0?"pri":""}" data-detail="${b.id}">${avail>0?"빈소 보기 · 예약":"현황 보기"}</button></div>`;
}

/* ── 지점 찾기 ── */
let regionFilter="전체", onlyAvail=false;
function renderSearch(){
  $("#regionChips").innerHTML = ["전체",...DD.REGIONS].map(r=>
    `<button class="chip ${r===regionFilter?"on":""}" data-region="${r}">${r}</button>`).join("");
  $("#onlyAvail").checked=onlyAvail;
  let list=DD.BRANCHES.filter(b=> regionFilter==="전체"||b.region===regionFilter);
  if(onlyAvail) list=list.filter(b=>availRooms(b)>0);
  $("#branchList").innerHTML = list.length? list.map(b=>branchRow(b)).join("")
    : `<div class="empty">해당 조건의 지점이 없습니다. 지역이나 조건을 바꿔보세요.</div>`;
}
function branchRow(b){
  const lv=freshLevel(b.freshMin), avail=availRooms(b);
  const fresh = b.type==="own" ? `<span class="badge avail"><span class="dot"></span>실시간</span>`
    : `<span class="badge ${lv==="stale"?"stale":"warn"}">확인 ${freshText(b.freshMin)}</span>`;
  return `<div class="branch-row card hover rv" data-detail="${b.id}">
    <div class="br-main">
      <div class="between"><div class="row" style="gap:8px"><span class="badge ${typeBadge(b.type)}">${typeLabel(b.type)}</span>${fresh}</div>
        <span class="muted br-region">${b.region}</span></div>
      <h3 class="serif">${b.name}</h3>
      <p class="muted br-addr">${b.addr}</p>
      <div class="br-rooms">${b.rooms.map(r=>`<span class="rmini ${r.status}">${r.no} · ${statusMap[r.status][1]}</span>`).join("")}</div>
    </div>
    <div class="br-side">
      <div class="br-avail ${avail>0?"":"none"}">${avail>0?`<b class="serif">${avail}</b>실 예약 가능`:"현재 만실"}</div>
      <button class="btn sm ${avail>0?"pri":""}" data-detail="${b.id}">상세 보기</button>
      <a class="btn sm" href="tel:${b.tel.replace(/-/g,"")}">☎ 전화 확인</a>
    </div></div>`;
}
document.addEventListener("click",e=>{
  const rc=e.target.closest("[data-region]"); if(rc){ regionFilter=rc.dataset.region; renderSearch(); return; }
  const d=e.target.closest("[data-detail]"); if(d){ go("detail", d.dataset.detail); return; }
});
$("#onlyAvail").addEventListener("change",e=>{ onlyAvail=e.target.checked; renderSearch(); });

/* ── 지점 상세 ── */
function renderDetail(id){
  const b=DD.BRANCHES.find(x=>x.id===id)||DD.BRANCHES[0];
  const lv=freshLevel(b.freshMin);
  const freshLine = b.type==="own"
    ? `<span class="badge avail"><span class="dot"></span>실시간 · 본부 관제</span>`
    : `<span class="badge ${lv==="stale"?"stale":"warn"}">최종 확인 ${freshText(b.freshMin)} · 전화 확인 권장</span>`;
  // 항목별 비용(대표 5종)
  const rep=["i14","i1","i4","i7","i10"];
  $("#detailWrap").innerHTML = `
    <button class="back" data-go="search">← 지점 목록</button>
    <div class="detail-head">
      <div class="row" style="gap:10px">
        <span class="badge ${typeBadge(b.type)}">${typeLabel(b.type)} 지점</span>${freshLine}</div>
      <h1 class="disp d-xl">${b.name}</h1>
      <p class="lead">${b.addr}</p>
      <div class="row" style="gap:10px;flex-wrap:wrap">
        <a class="btn" href="tel:${b.tel.replace(/-/g,"")}">☎ ${b.tel}</a>
        <button class="btn ghost" data-emergency>긴급 상담 연결</button>
      </div>
    </div>
    <div class="detail-grid">
      <section class="card pad">
        <div class="between"><h2 class="serif d-md">빈소 현황</h2>
          <span class="muted" style="font-size:.82rem">${b.type==="own"?"실시간 갱신":`최종 확인 ${freshText(b.freshMin)}`}</span></div>
        <div class="rooms-grid">${b.rooms.map(r=>roomCard(b,r)).join("")}</div>
        ${b.type!=="own"?`<p class="detail-note">이 지점은 ${typeLabel(b.type)}으로, 현황은 지점 확인 시각 기준입니다. 방문 전 <b>전화 확인</b>을 권합니다.</p>`:""}
      </section>
      <aside class="card pad">
        <h2 class="serif d-md">대표 비용 안내</h2>
        <p class="muted" style="font-size:.86rem;margin:4px 0 14px">본부 표준가 기준, 이 지점 확정가입니다. (정찰제)</p>
        <div class="cost-list">${rep.map(iid=>{ const it=DD.ITEMS.find(x=>x.id===iid); const p=priceAt(b.id,iid);
          const over = p!==it.std; return `<div class="cost-row"><span>${it.name}</span>
            <b class="serif tnum">${fmt(p)}원 ${over?`<span class="badge line" style="height:19px;font-size:.66rem">지점가</span>`:""}</b></div>`; }).join("")}</div>
        <button class="btn block" data-go="estimate" style="margin-top:14px">전체 용품 견적 내기 →</button>
      </aside>
    </div>`;
  $("#detailWrap").dataset.branch=b.id;
  observeReveal();
}
function roomCard(b,r){
  const [cls,label]=statusMap[r.status];
  const can=r.status==="avail";
  return `<div class="room-card ${r.status}">
    <div class="between"><b class="serif">${r.no}</b><span class="badge ${cls}"><span class="dot"></span>${label}</span></div>
    <span class="muted">${r.cap}</span>
    <button class="btn sm block ${can?"pri":""}" ${can?`data-book="${b.id}:${r.no}"`:"disabled"}>${can?"예약 신청":label}</button>
  </div>`;
}

/* ── 예약·결제 모달 ── */
document.addEventListener("click",e=>{ const bk=e.target.closest("[data-book]"); if(bk){ const [bid,room]=bk.dataset.book.split(":"); openBook(bid,room); } });
let bookState=null;
function openBook(bid,room){
  const b=DD.BRANCHES.find(x=>x.id===bid);
  bookState={ bid, room, deposit:500000, method:"카드", step:"form" };
  renderBook(b);
  $("#bookModal").classList.add("open");
}
function renderBook(b){
  const s=bookState;
  if(s.step==="form"){
    $("#bookBody").innerHTML=`
    <div class="modal-h between"><div><p class="eyebrow">예약 신청</p><h2 class="serif d-md">${b.name} · ${s.room}</h2></div>
      <button class="modal-close" data-close>×</button></div>
    <div class="modal-b book-grid">
      <div class="stack" style="gap:16px">
        <div class="field"><label>신청자(상주)</label><input class="inp" id="bkApplicant" value="김상주" placeholder="이름"></div>
        <div class="field"><label>고인 성함</label><input class="inp" id="bkDeceased" value="故 " placeholder="故 ○○○"></div>
        <div class="field"><label>연락처</label><input class="inp" id="bkPhone" value="010-1234-5678" placeholder="010-0000-0000"></div>
        <div class="field"><label>안치(빈소 사용) 예정일</label><input class="inp" type="date" id="bkDate" value="2026-08-15"></div>
      </div>
      <div class="stack" style="gap:14px">
        <div class="field"><label>예약금</label>
          <div class="seg" id="bkDeposit">
            <button class="seg-i on" data-dep="500000">예약금 50만원</button>
            <button class="seg-i" data-dep="full">전액 결제</button>
          </div></div>
        <div class="field"><label>결제 수단</label>
          <div class="seg" id="bkMethod"><button class="seg-i on" data-m="카드">신용카드</button><button class="seg-i" data-m="계좌">계좌이체</button></div></div>
        <div class="prepay-badge">
          <div class="row" style="gap:8px"><span class="badge ok"><span class="dot"></span>선불식 할부거래 비해당</span></div>
          <p>이 결제는 <b>제공시기가 확정된(3일장) 즉시 결제</b>입니다. 미리 가입·적립하는 상조상품이 아니므로 할부거래법상
            선불식 할부거래(상조업 등록·선수금 예치)에 해당하지 않습니다.</p>
        </div>
        <div class="hold-note"><span class="ic">⏱</span> 결제 시 이 빈소는 <b>15분간 보류(hold)</b>됩니다. 지점이 승인하면 확정, 미승인 시 <b>자동 환불</b>됩니다.</div>
      </div>
    </div>
    <div class="modal-foot"><span class="pay-total">결제 예정 <b class="serif" id="bkTotal">${fmt(s.deposit)}원</b></span>
      <button class="btn pri lg" id="bkPay">안전하게 결제하기</button></div>`;
  } else {
    // 완료(예치→hold)
    $("#bookBody").innerHTML=`
    <div class="modal-b book-done">
      <div class="done-ic">✓</div>
      <h2 class="serif d-md">예약금이 안전하게 예치되었습니다</h2>
      <p class="lead">${b.name} · ${s.room} · ${fmt(s.deposit)}원 (${s.method})</p>
      <div class="hold-timer">빈소 보류 <b id="holdCount">15:00</b> · 지점 승인 대기 중</div>
      <div class="done-steps">
        <div class="dstep done"><b>1</b> 예약금 PG 예치</div>
        <div class="dstep cur"><b>2</b> 지점 승인 대기</div>
        <div class="dstep"><b>3</b> 예약 확정</div>
      </div>
      <p class="muted" style="font-size:.85rem">데모에서는 지점 관리자 화면(admin)에서 이 예약을 <b>승인/거부</b>하면 상태가 바뀝니다.
        미승인 시 예치금은 자동 환불됩니다.</p>
      <div class="row" style="gap:10px;justify-content:center;margin-top:16px">
        <button class="btn" data-close>닫기</button>
        <button class="btn pri" data-go="mypage" data-close>마이페이지에서 보기</button>
      </div>
    </div>`;
    startHold();
  }
}
document.addEventListener("click",e=>{
  const dep=e.target.closest("#bkDeposit .seg-i"); if(dep){ $$("#bkDeposit .seg-i").forEach(x=>x.classList.remove("on")); dep.classList.add("on");
    bookState.deposit = dep.dataset.dep==="full"? 11500000 : 500000; $("#bkTotal").textContent=fmt(bookState.deposit)+"원"; return; }
  const m=e.target.closest("#bkMethod .seg-i"); if(m){ $$("#bkMethod .seg-i").forEach(x=>x.classList.remove("on")); m.classList.add("on"); bookState.method=m.dataset.m; return; }
  if(e.target.closest("#bkPay")){ bookState.step="done"; renderBook(DD.BRANCHES.find(x=>x.id===bookState.bid)); toast("예약금이 예치되었습니다 · 지점 승인 대기"); return; }
});
let holdT;
function startHold(){ let s=15*60; const el=$("#holdCount"); clearInterval(holdT);
  holdT=setInterval(()=>{ s--; if(s<0){clearInterval(holdT);return;} const m=String(Math.floor(s/60)).padStart(2,"0"),ss=String(s%60).padStart(2,"0"); if(el)el.textContent=`${m}:${ss}`; },1000); }

/* ── 응급 상담 시트 ── */
function openEmergency(){
  const top=[...DD.BRANCHES].filter(b=>availRooms(b)>0).sort((a,b)=>availRooms(b)-availRooms(a)).slice(0,3);
  $("#emergBody").innerHTML=`
    <div class="modal-h between"><div><p class="eyebrow" style="color:var(--danger)">긴급 상담</p><h2 class="serif d-md">지금 바로 도와드리겠습니다</h2></div>
      <button class="modal-close" data-close>×</button></div>
    <div class="modal-b">
      <a class="emerg-call" href="tel:16680000"><span class="ic">☎</span><div><b>24시간 상담센터 1668-0000</b><span>임종·안치·이송을 즉시 안내합니다</span></div></a>
      <p class="divider">또는 지금 비어 있는 인근 빈소</p>
      <div class="emerg-branches">${top.map(b=>`
        <button class="emerg-branch" data-detail="${b.id}" data-close>
          <div><b class="serif">${b.name}</b><span class="muted">${b.region} · 가용 ${availRooms(b)}실</span></div>
          <span class="badge ${typeBadge(b.type)}">${typeLabel(b.type)}</span></button>`).join("")}</div>
      <p class="muted" style="font-size:.82rem;text-align:center;margin-top:8px">임종 직후에는 병원·상조가 즉시 개입하는 경우가 많습니다.
        온화는 먼저 <b>비교·상담</b>으로 돕고, 예약은 그다음입니다.</p>
    </div>`;
  $("#emergSheet").classList.add("open");
}
document.addEventListener("click",e=>{ const u=e.target.closest("[data-urg]"); if(u){ openEmergency(); } });

/* ── 용품 견적산출기 ── */
let estBranch="b1", estCart={ i14:1, i1:1, i10:1 }; // 프리필: 빈소임대+기본관+지도사
function renderEstimate(){
  const cats=DD.CATS;
  $("#estCatalog").innerHTML=`
    <div class="est-branchsel card pad">
      <div class="field"><label>견적 대상 지점</label>
        <select class="inp" id="estBranchSel">${DD.BRANCHES.map(b=>`<option value="${b.id}" ${b.id===estBranch?"selected":""}>${b.name} (${typeLabel(b.type)})</option>`).join("")}</select></div>
      <p class="muted" style="font-size:.83rem;margin-top:8px">확정가는 지점별로 다를 수 있습니다. 지점을 바꾸면 합계가 다시 계산됩니다.</p>
    </div>
    ${cats.map(cat=>{ const items=DD.ITEMS.filter(i=>i.cat===cat); if(!items.length) return "";
      return `<section class="est-cat"><h3 class="serif">${cat}</h3>
        <div class="est-items">${items.map(it=>{ const p=priceAt(estBranch,it.id); const over=p!==it.std; const q=estCart[it.id]||0;
          return `<div class="est-item ${q>0?"picked":""}" data-item="${it.id}">
            <div class="ei-info"><b>${it.name}</b>
              <span class="ei-price tnum">${fmt(p)}원 ${over?`<span class="badge line" style="height:18px;font-size:.64rem">지점가</span>`:`<span class="muted" style="font-weight:400">표준가</span>`}</span></div>
            <div class="qty"><button class="qty-b" data-q="${it.id}:-1" ${q<=0?"disabled":""}>−</button>
              <span class="qty-n">${q}</span><button class="qty-b" data-q="${it.id}:1">+</button></div></div>`; }).join("")}</div></section>`;
    }).join("")}`;
  renderCart();
  observeReveal();
}
function renderCart(){
  const rows=Object.entries(estCart).filter(([,q])=>q>0);
  const items=rows.map(([id,q])=>{ const it=DD.ITEMS.find(x=>x.id===id); const p=priceAt(estBranch,id); return {it,q,p,sum:p*q}; });
  const total=items.reduce((s,x)=>s+x.sum,0);
  const b=DD.BRANCHES.find(x=>x.id===estBranch);
  $("#estCart").innerHTML=`
    <div class="cart-head"><p class="eyebrow">실시간 견적</p><h3 class="serif d-md">${b.name}</h3></div>
    <div class="cart-items">${items.length? items.map(x=>`
      <div class="cart-row"><span>${x.it.name} <span class="muted">×${x.q}</span></span><b class="tnum">${fmt(x.sum)}원</b></div>`).join("")
      : `<p class="muted" style="padding:16px 0">왼쪽에서 용품을 담아보세요.</p>`}</div>
    <div class="cart-total"><span>예상 합계</span><b class="serif tnum" id="cartTotal">${fmt(total)}원</b></div>
    <p class="cart-vat muted">부가세 포함 · 미사용분은 정산 시 100% 공제됩니다.</p>
    <button class="btn pri block lg" id="quoteBtn" ${items.length?"":"disabled"}>견적서 보기 · 저장</button>
    <button class="btn block" data-detail="${estBranch}" style="margin-top:8px">이 지점 빈소 예약 →</button>`;
}
document.addEventListener("change",e=>{ if(e.target.id==="estBranchSel"){ estBranch=e.target.value; renderEstimate(); } });
document.addEventListener("click",e=>{
  const q=e.target.closest("[data-q]"); if(q){ const [id,d]=q.dataset.q.split(":"); estCart[id]=Math.max(0,(estCart[id]||0)+ +d); if(estCart[id]===0) delete estCart[id]; renderEstimate(); return; }
  const ei=e.target.closest(".est-item"); if(ei && !e.target.closest(".qty")){ const id=ei.dataset.item; estCart[id]=(estCart[id]||0)+1; renderEstimate(); return; }
  if(e.target.closest("#quoteBtn")){ openQuote(); return; }
});
function openQuote(){
  const rows=Object.entries(estCart).filter(([,q])=>q>0).map(([id,q])=>{ const it=DD.ITEMS.find(x=>x.id===id); const p=priceAt(estBranch,id); return {it,q,p,sum:p*q}; });
  const total=rows.reduce((s,x)=>s+x.sum,0); const b=DD.BRANCHES.find(x=>x.id===estBranch);
  $("#quoteBody").innerHTML=`
    <div class="modal-h between"><div><p class="eyebrow">견적서</p><h2 class="serif d-md">${b.name}</h2></div><button class="modal-close" data-close>×</button></div>
    <div class="modal-b">
      <table class="tbl"><thead><tr><th>용품</th><th class="r">단가</th><th class="r">수량</th><th class="r">금액</th></tr></thead>
        <tbody>${rows.map(x=>`<tr><td>${x.it.name}</td><td class="r tnum">${fmt(x.p)}</td><td class="r">${x.q}</td><td class="r tnum">${fmt(x.sum)}</td></tr>`).join("")}</tbody>
        <tfoot><tr><td colspan="3" class="r"><b>합계 (VAT 포함)</b></td><td class="r"><b class="serif tnum">${fmt(total)}원</b></td></tr></tfoot></table>
      <p class="muted" style="font-size:.84rem;margin-top:12px">본 견적은 본부 표준가에 이 지점 확정가를 반영한 예상 금액입니다. 실제 청구는 사용 품목 기준이며 미사용분은 100% 공제됩니다.</p>
      <div class="row" style="gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn" id="quoteCsv">견적서 내려받기(CSV)</button>
        <button class="btn pri" data-detail="${estBranch}" data-close>이 지점 예약하기</button></div>
    </div>`;
  $("#quoteModal").classList.add("open");
  $("#quoteCsv").onclick=()=>downloadQuoteCsv(b,rows,total);
}
function downloadQuoteCsv(b,rows,total){
  let csv="﻿용품,단가,수량,금액\n";
  rows.forEach(x=>{ csv+=`"${x.it.name}",${x.p},${x.q},${x.sum}\n`; });
  csv+=`합계,,,"${total}"\n`;
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download=`온화_견적_${b.name}.csv`; a.click(); URL.revokeObjectURL(url);
  toast("견적서 CSV를 내려받았습니다");
}

/* ── 모바일 부고장 ── */
let obit=JSON.parse(JSON.stringify(DD.OBIT_SAMPLE));
function renderObituary(){
  $("#obitForm").innerHTML=`
    <div class="card pad stack" style="gap:15px">
      <div class="two"><div class="field"><label>고인 성함</label><input class="inp" data-ob="deceased" value="${obit.deceased}"></div>
        <div class="field"><label>향년</label><input class="inp" type="number" data-ob="age" value="${obit.age}"></div></div>
      <div class="two"><div class="field"><label>상주</label><input class="inp" data-ob="chief" value="${obit.chief}"></div>
        <div class="field"><label>고인과의 관계</label><input class="inp" data-ob="rel" value="${obit.rel}"></div></div>
      <div class="field"><label>빈소</label><select class="inp" data-ob="branch">${DD.BRANCHES.map(b=>`<option ${b.name===obit.branch?"selected":""}>${b.name}</option>`).join("")}</select></div>
      <div class="two"><div class="field"><label>입관</label><input class="inp" data-ob="ipgwan" value="${obit.ipgwan}"></div>
        <div class="field"><label>발인</label><input class="inp" data-ob="balin" value="${obit.balin}"></div></div>
      <div class="field"><label>장지</label><input class="inp" data-ob="jangji" value="${obit.jangji}"></div>
      <div class="field"><label>템플릿</label><div class="tpl-row">${DD.OBIT_TPL.map(t=>`<button class="tpl ${t.id===obit.tpl?"on":""}" data-tpl="${t.id}"><span class="tpl-dot" style="background:${t.accent}"></span>${t.name}</button>`).join("")}</div></div>
      <div class="hr"></div>
      <div class="stack" style="gap:10px">
        <label class="privrow"><span>조의계좌 공개</span><span class="sw"><input type="checkbox" data-priv="account" ${obit.privacy.account?"checked":""}><i></i></span></label>
        <label class="privrow"><span>유족 연락처 공개</span><span class="sw"><input type="checkbox" data-priv="phone" ${obit.privacy.phone?"checked":""}><i></i></span></label>
        <p class="muted" style="font-size:.82rem">기본은 비공개입니다. 링크만 알면 누구나 열람할 수 있으므로, 민감 정보는 감추는 것을 권합니다.</p>
      </div>
      <button class="btn pri block lg" id="obitShare">카카오톡으로 공유하기</button>
      <p class="muted" style="font-size:.8rem;text-align:center">링크 공유 방식(카카오 채널·검수 불필요) · 발인 후 자동 만료 · 조회수 표시</p>
    </div>`;
  renderObitPhone();
}
function renderObitPhone(){ $("#obitPhone").innerHTML=obitCardHtml(obit,false); }
function obitCardHtml(o,mini){
  const tpl=DD.OBIT_TPL.find(t=>t.id===o.tpl)||DD.OBIT_TPL[0];
  return `<div class="obit-card ${tpl.id}" style="--oa:${tpl.accent}">
    <div class="oc-top">부고 訃告</div>
    <div class="oc-flower">❁</div>
    <h3 class="serif oc-name">${o.deceased}</h3>
    <p class="oc-age">향년 ${o.age}세</p>
    <div class="oc-line"></div>
    <div class="oc-info">
      <div><span>빈소</span><b>${o.branch} ${o.room||""}</b></div>
      <div><span>입관</span><b>${o.ipgwan}</b></div>
      <div><span>발인</span><b>${o.balin}</b></div>
      <div><span>장지</span><b>${o.jangji}</b></div>
      <div><span>상주</span><b>${o.chief} (${o.rel})</b></div>
      <div><span>조의계좌</span><b>${o.privacy.account?"국민 000-00-0000 온화":"<span class='oc-hidden'>비공개</span>"}</b></div>
      <div><span>유족연락처</span><b>${o.privacy.phone?"010-1234-5678":"<span class='oc-hidden'>비공개</span>"}</b></div>
    </div>
    ${mini?"":`<div class="oc-foot"><span class="badge line">조회 ${o.views}</span><span class="badge line">${o.expireDays}일 후 만료</span></div>`}
  </div>`;
}
document.addEventListener("input",e=>{ const ob=e.target.closest("[data-ob]"); if(ob){ obit[ob.dataset.ob]=ob.value; renderObitPhone(); } });
document.addEventListener("change",e=>{ const pv=e.target.closest("[data-priv]"); if(pv){ obit.privacy[pv.dataset.priv]=pv.checked; renderObitPhone(); } });
document.addEventListener("click",e=>{
  const tp=e.target.closest("[data-tpl]"); if(tp){ obit.tpl=tp.dataset.tpl; renderObituary(); return; }
  if(e.target.closest("#obitShare")){ toast("부고장 링크가 복사되었습니다 · 카카오톡 공유창이 열립니다(데모)"); return; }
});

/* ── 마이페이지 ── */
function renderMypage(){
  const me="김상주";
  const myRes=DD.RESERV.filter(r=>r.applicant===me);
  const stName={hold:["hold","보류(15분)"],pending:["warn","승인대기"],confirmed:["ok","확정"],cancelled:["stale","취소"],done:["info","완료"]};
  $("#mypageWrap").innerHTML=`
    <div class="my-grid">
      <section class="card pad">
        <h2 class="serif d-md">예약 내역</h2>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>지점</th><th>빈소</th><th>고인</th><th>일자</th><th class="r">예약금</th><th>상태</th><th></th></tr></thead>
          <tbody>${myRes.map(r=>{ const b=DD.BRANCHES.find(x=>x.id===r.branch); const s=stName[r.status];
            const cancelable=["hold","pending","confirmed"].includes(r.status);
            return `<tr><td>${b?b.name:r.branch}</td><td>${r.room}</td><td>${r.deceased}</td><td class="tnum">${r.date.slice(5)}</td><td class="r tnum">${fmt(r.amount)}</td><td><span class="badge ${s[0]}">${s[1]}</span></td>
              <td>${cancelable?`<button class="btn xs dang" data-cancelres="${r.id}">예약 취소</button>`:`<span class="muted">—</span>`}</td></tr>`; }).join("")||`<tr><td colspan="7" class="muted">예약 내역이 없습니다.</td></tr>`}</tbody></table></div>
        <div class="refund-policy"><b>환불 규정</b>
          ${DD.REFUND_POLICY.map(p=>`<div class="rp-row"><span>${p.when}</span><b class="rp-rate">${p.rate}</b><span class="muted">${p.note}</span></div>`).join("")}</div>
      </section>
      <section class="card pad cremation-card">
        <div class="between"><div><span class="badge gold">공고 미언급 · 도메인 필수</span>
          <h2 class="serif d-md" style="margin-top:8px">다음 단계 — 화장장 예약</h2></div><span class="ic-crem">⚱</span></div>
        <p class="lead">빈소 예약만으로 장례가 끝나지 않습니다. <b>발인 다음 절차인 화장(火葬)</b>이 실제 병목입니다.
          화장장은 예약이 몰려 원하는 시간을 못 잡으면 발인 일정 전체가 어긋납니다. 발인일(${DD.OBIT_SAMPLE.balin.slice(0,10)}) 기준 인근 화장장의 실시간 잔여 슬롯입니다.</p>
        <div id="cremSlots"></div>
        <p class="muted" style="font-size:.82rem;margin-top:10px">실제 구축 시 <b>e하늘 장사정보시스템</b> 화장 예약과 연계합니다. (데모는 가상 슬롯)</p>
      </section>
      <section class="card pad">
        <h2 class="serif d-md">결제 내역</h2>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>구분</th><th class="r">금액</th><th>수단</th><th>상태</th><th>일시</th></tr></thead>
          <tbody>${DD.PAY.filter(p=>myRes.some(r=>r.id===p.res)).map(p=>`<tr><td>${p.kind}</td><td class="r tnum">${fmt(p.amount)}</td><td>${p.method}</td>
            <td><span class="badge ${p.status==="환불"?"stale":p.status==="예치"?"warn":"ok"}">${p.status}</span></td><td class="muted tnum">${p.at}</td></tr>`).join("")||`<tr><td colspan="5" class="muted">결제 내역이 없습니다.</td></tr>`}</tbody></table></div>
      </section>
      <section class="card pad">
        <h2 class="serif d-md">상담 내역</h2>
        <div class="my-consult">${DD.CONSULT.filter(c=>c.name===me).map(c=>{ const b=DD.BRANCHES.find(x=>x.id===c.branch);
          return `<div class="myc-row"><div class="between"><b>${c.topic}</b><span class="badge ${c.status==="완료"?"ok":"warn"}">${c.status}</span></div>
            <p class="muted" style="font-size:.85rem;margin:4px 0">${b?b.name:c.branch} · ${c.at}</p>
            <p style="font-size:.9rem">${c.body}</p>${c.reply?`<div class="myc-reply"><b>답변</b> ${c.reply}</div>`:`<p class="muted" style="font-size:.82rem;margin-top:6px">지점 답변 대기 중입니다.</p>`}</div>`;
        }).join("")||`<p class="muted">상담 내역이 없습니다.</p>`}</div>
      </section>
      <section class="card pad my-obit">
        <div class="between"><h2 class="serif d-md">내 부고장</h2><button class="btn sm" data-go="obituary">편집 →</button></div>
        <div class="my-obit-body">${obitCardHtml(DD.OBIT_SAMPLE,false)}</div>
      </section>
    </div>`;
  renderCremSlots();
}
function renderCremSlots(){
  const region = (DD.BRANCHES.find(b=>b.name===DD.OBIT_SAMPLE.branch)||{}).region || "경남";
  const list = DD.CREMATORY.filter(c=>c.region===region).concat(DD.CREMATORY.filter(c=>c.region!==region)).slice(0,3);
  const el=$("#cremSlots"); if(!el) return;
  el.innerHTML = list.map(c=>`<div class="crem-row"><div class="crem-name"><b>${c.name}</b><span class="muted">${c.region}</span></div>
    <div class="crem-slots">${c.slots.map(s=>`<button class="crem-slot ${s.left===0?"gone":""}" ${s.left===0?"disabled":`data-crem="${c.id}|${s.t}"`}>
      ${s.t}<small>${s.left===0?"마감":`잔여 ${s.left}`}</small></button>`).join("")}</div></div>`).join("");
}
document.addEventListener("click",e=>{
  const cx=e.target.closest("[data-cancelres]"); if(cx){ const r=DD.RESERV.find(x=>x.id===cx.dataset.cancelres);
    const rate = r.status==="confirmed"?"안치 전이면 전액":"전액"; r.status="cancelled"; r.refund=true; renderMypage();
    toast(`예약이 취소되었습니다 · 환불 규정에 따라 ${rate} 환불 처리됩니다`); return; }
  const cs=e.target.closest("[data-crem]"); if(cs){ const [cid,t]=cs.dataset.crem.split("|"); const c=DD.CREMATORY.find(x=>x.id===cid);
    const slot=c.slots.find(s=>s.t===t); if(slot&&slot.left>0){ slot.left--; renderCremSlots(); toast(`${c.name} ${t} 화장 예약이 접수되었습니다 (실 구축 시 e하늘 연계)`); } return; }
});

/* ── 유틸: 카운트업 · 리빌 ── */
function countUp(el,to){ if(!el) return; const dur=900,t0=performance.now();
  function tick(t){ const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3); el.textContent=Math.round(to*e); if(p<1)requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
  setTimeout(()=>{ if(el.textContent==="—"||+el.textContent!==to) el.textContent=to; }, 1200); }
let io;
function observeReveal(){
  if(!io) io=new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } }),{threshold:.12,rootMargin:"0px 0px -8% 0px"});
  $$(".rv:not(.in)").forEach(el=>io.observe(el));
  // 리빌 텍스트 라인
  const rt=$("#revealText"); if(rt && !rt.dataset.done){ rt.dataset.done="1";
    const spans=$$("#revealText span"); const rio=new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting){ spans.forEach((s,i)=>setTimeout(()=>s.classList.add("in"),i*220)); rio.disconnect(); } }),{threshold:.4});
    rio.observe(rt); }
}

/* 스크롤 시 네비 축소 */
addEventListener("scroll",()=>{ $("#nav").classList.toggle("scrolled", scrollY>40); },{passive:true});

/* ── 스크롤 스크럽 히어로 ── */
function bandOp(p,a,b,c,d){ if(p<a||p>=d) return 0; if(p<b) return (p-a)/(b-a); if(p<=c) return 1; return 1-(p-c)/(d-c); }
function initScrubHero(){
  const sec=$("#scrollHero"), video=$("#shVideo"), loading=$("#shLoading"), cue=$("#shCue");
  if(!sec||!video) return;
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches, mobile=matchMedia("(max-width: 820px)").matches;
  const bands=$$(".sh-band",sec);
  function setBands(p){
    bands[0].style.opacity=bandOp(p,-1,0,0.26,0.40); bands[0].style.transform=`translateY(${-46 + bandOp(p,0.26,0.40,9,9)*-8}%)`;
    bands[1].style.opacity=bandOp(p,0.36,0.48,0.60,0.72);
    bands[2].style.opacity=bandOp(p,0.70,0.82,2,2);
    bands[2].style.pointerEvents = p>0.76? "auto":"none";
    if(cue) cue.style.opacity = p>0.04? "0":"1";
  }
  if(reduce||mobile){ sec.classList.add("static"); loading.hidden=true; return; }
  let dur=6, target=0, shown=0, raf=null, seeking=false;
  fetch("assets/video/hero.mp4").then(r=>{ if(!r.ok) throw 0; return r.blob(); }).then(b=>{
    video.src=URL.createObjectURL(b);
    video.addEventListener("loadedmetadata",()=>{ dur=video.duration||6; },{once:true});
    video.addEventListener("loadeddata",()=>{ loading.hidden=true; sec.classList.add("ready"); onScroll();
      addEventListener("scroll",onScroll,{passive:true}); addEventListener("resize",onScroll); },{once:true});
    video.addEventListener("seeked",()=>{ seeking=false; });
  }).catch(()=>{ sec.classList.add("static"); loading.hidden=true; });
  function onScroll(){ const total=sec.offsetHeight-innerHeight; if(total<=0) return;
    const p=Math.min(1,Math.max(0,(-sec.getBoundingClientRect().top)/total)); target=p*dur; setBands(p);
    if(!raf) raf=requestAnimationFrame(tick); }
  function tick(){ shown+=(target-shown)*0.12;
    if(!seeking && Math.abs(shown-video.currentTime)>0.02){ seeking=true; try{ video.currentTime=shown; }catch(e){ seeking=false; } }
    if(Math.abs(target-shown)>0.004){ raf=requestAnimationFrame(tick); } else raf=null; }
}

/* 배경 패럴랙스 (whisper) */
function initParallax(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const items=[["#statement .statement-media",".statement",0.14],[".reveal-media",".reveal-band",0.12]];
  const els=items.map(([s,p,f])=>[document.querySelector(s),document.querySelector(p),f]).filter(x=>x[0]&&x[1]);
  if(!els.length) return; let raf=null;
  function upd(){ raf=null; const vh=innerHeight;
    els.forEach(([el,par,f])=>{ const r=par.getBoundingClientRect(); if(r.bottom<0||r.top>vh) return;
      const off=((r.top+r.height/2)-vh/2)/vh; el.style.transform=`translateY(${off*f*100}px)`; }); }
  addEventListener("scroll",()=>{ if(!raf) raf=requestAnimationFrame(upd); },{passive:true}); upd();
}

/* 초기화 */
renderHome();
observeReveal();
initScrubHero();
initParallax();
})();
