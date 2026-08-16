/* MURO admin — 작품·문의·리스크 콘솔·성능. 전부 실연산. */
(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const { WORKS, ARTISTS, INQUIRIES, CONFIG } = MURO;
const TODAY = new Date("2026-08-17");
let toastT; function toast(m){ const t=$("#toast"); t.textContent=m; t.classList.add("show");
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),2600); }

const TITLE={ works:"작품 관리", inq:"문의 관리", risk:"리스크 콘솔", perf:"성능·이미지 보호" };
let view="works";
function go(v){ view=v; $$("#railNav button").forEach(b=>b.classList.toggle("on",b.dataset.view===v));
  $("#abarTitle").textContent=TITLE[v];
  ({works:renderWorks,inq:renderInq,risk:renderRisk,perf:renderPerf})[v]();
  $(".acontent").scrollTop=0; }
document.addEventListener("click",e=>{ const n=e.target.closest("[data-view]"); if(n) go(n.dataset.view); });

/* ═══ 1. 작품 관리 ═══ */
function renderWorks(){
  $("#acontent").innerHTML=`
    <div class="callout"><b>가격 정책</b> — 공개 사이트의 가격 표시를 갤러리 방침에 맞게 고릅니다.
      확정가를 못 박지 않아도 <b>가격대 신호는 주는 것</b>이 문의 전환의 전제입니다(온라인 구매자 91%가 가격 투명성 요구 — Hiscox).</div>
    <div class="acard"><div class="acard-h"><h3>가격 표시 모드</h3><span class="mut">공개 사이트에 즉시 반영</span></div>
      <div class="acard-b">
        <div class="seg" id="ppSeg">
          ${[["hidden","비공개(가격 문의)"],["band","가격대 밴드"],["perho","호당가 공개"],["fixed","확정가 공개"]]
            .map(([k,l])=>`<button data-pp="${k}" class="${CONFIG.pricePolicy===k?"on":""}">${l}</button>`).join("")}
        </div>
        <p class="mut" style="font-size:12px;margin-top:10px">현재 예시 — ${WORKS.slice(0,3).map(w=>`《${w.title}》 → <b>${MX.priceLabel(w)}</b>`).join(" · ")}</p>
      </div></div>
    <div class="acard"><div class="acard-h"><h3>작품 대장</h3><button class="chip y" id="addWork">+ 신규 등록 (캡션 검증 시연)</button></div>
      <div class="acard-b tbl-wrap"><table class="tbl"><thead>
        <tr><th></th><th>작품</th><th>작가</th><th class="r">산출가</th><th>상태 (5단)</th><th>판매 후 게시 동의</th><th>보증서</th></tr></thead>
        <tbody>${WORKS.map(w=>{ const a=ARTISTS[w.artist];
          return `<tr>
            <td><img src="assets/img/${w.img}.webp" alt=""></td>
            <td><b>《${w.title}》</b><br><span class="mut" style="font-size:11px">${w.year} · ${w.w}×${w.h}cm (${w.ho}호)</span></td>
            <td>${a.name}</td>
            <td class="r tnum">${MX.fmt(MX.price(w))}원</td>
            <td><select class="sel" data-st="${w.id}">
              ${[["sale","판매 중"],["hold","예약"],["sold_open","판매완료(공개)"],["sold_arch","판매완료(아카이브)"],["hidden","비공개"]]
                .map(([k,l])=>`<option value="${k}" ${w.status===k?"selected":""}>${l}</option>`).join("")}</select></td>
            <td><label style="display:flex;gap:6px;align-items:center;font-size:12px">
              <input type="checkbox" data-consent="${w.id}" ${w.soldConsent?"checked":""}> 동의</label></td>
            <td>${w.cert?'<span class="chip g">발급</span>':'<span class="chip r">미발급</span>'}</td>
          </tr>`; }).join("")}</tbody></table></div></div>
    <div class="acard" id="newWorkCard" hidden><div class="acard-h"><h3>신규 등록 — 캡션 필수 검증</h3></div>
      <div class="acard-b">
        <p class="mut" style="font-size:12px;margin-bottom:12px">표준 캡션(작가·제목·연도·재료·크기·액자)이 하나라도 비면 저장이 차단됩니다 — 형식 검증이 곧 품질 관리입니다.</p>
        <div class="field-row">
          <input class="num-in" style="width:110px;text-align:left" id="nwArtist" placeholder="작가명">
          <input class="num-in" style="width:150px;text-align:left" id="nwTitle" placeholder="제목">
          <input class="num-in" style="width:70px" id="nwYear" placeholder="연도" type="number">
          <input class="num-in" style="width:150px;text-align:left" id="nwMedium" placeholder="재료">
          <input class="num-in" style="width:60px" id="nwHo" placeholder="호수" type="number">
          <button class="chip y" id="nwSave">저장</button>
        </div>
        <p id="nwMsg" style="font-size:12px;color:#9C2B22"></p>
      </div></div>`;
}
document.addEventListener("click",e=>{
  const pp=e.target.closest("[data-pp]");
  if(pp){ CONFIG.pricePolicy=pp.dataset.pp; renderWorks(); toast("가격 표시 모드 변경 — 공개 사이트에 반영됩니다"); return; }
  if(e.target.closest("#addWork")){ $("#newWorkCard").hidden=false; return; }
  if(e.target.closest("#nwSave")){
    const miss=[["nwArtist","작가"],["nwTitle","제목"],["nwYear","연도"],["nwMedium","재료"],["nwHo","호수"]]
      .filter(([id])=>!$("#"+id).value.trim()).map(([,l])=>l);
    if(miss.length){ $("#nwMsg").textContent=`저장 차단 — 캡션 누락: ${miss.join(", ")}. 표준 캡션은 전 항목 필수입니다.`; return; }
    $("#nwMsg").textContent=""; toast("등록되었습니다 (데모) — 이미지 파생본 자동 생성 대기열에 추가"); return; }
});
document.addEventListener("change",e=>{
  const st=e.target.closest("[data-st]");
  if(st){ const w=WORKS.find(x=>x.id===st.dataset.st); w.status=st.value;
    if(st.value==="sold_arch" && !w.soldConsent) toast(`《${w.title}》 아카이브 전환 — 게시 동의 없음 → 공개 사이트에서 비공개 처리됩니다`);
    else toast(`《${w.title}》 상태 변경 — ${MX.statusLabel(st.value)}`);
    return; }
  const cs=e.target.closest("[data-consent]");
  if(cs){ const w=WORKS.find(x=>x.id===cs.dataset.consent); w.soldConsent=cs.checked;
    toast(`《${w.title}》 판매 후 게시 동의 ${cs.checked?"확보":"철회"} — 아카이브 노출이 바뀝니다`); }
});

/* ═══ 2. 문의 관리 ═══ */
function renderInq(){
  const flow=["접수","응대중","성사","종료"];
  $("#acontent").innerHTML=`
    <div class="acard"><div class="acard-h"><h3>문의 파이프라인</h3>
      <span class="mut">접수 ${INQUIRIES.filter(q=>q.status==="접수").length} · 응대중 ${INQUIRIES.filter(q=>q.status==="응대중").length} · 성사 ${INQUIRIES.filter(q=>q.status==="성사").length}</span></div>
      <div class="acard-b tbl-wrap"><table class="tbl"><thead>
        <tr><th>일시</th><th>작품</th><th>고객</th><th>유형</th><th>내용</th><th>배송 조건</th><th>상태</th></tr></thead>
        <tbody>${INQUIRIES.map(q=>{ const w=WORKS.find(x=>x.id===q.work), s=MX.shipping(w);
          return `<tr>
            <td class="tnum mut">${q.at}</td>
            <td><b>《${w.title}》</b></td>
            <td>${q.name}<br><span class="mut" style="font-size:11px">${q.tel}</span></td>
            <td><span class="chip ${q.type==="구매"?"g":"y"}">${q.type}</span></td>
            <td style="max-width:220px">${q.msg}</td>
            <td style="font-size:11px" class="mut">${s.kind}<br>${q.floor}층 · 엘베 ${q.elevator?"O":"X"} · 설치 ${q.install?"O":"X"}</td>
            <td><select class="sel" data-qst="${q.id}">${flow.map(f=>`<option ${q.status===f?"selected":""}>${f}</option>`).join("")}</select></td>
          </tr>`; }).join("")}</tbody></table></div></div>
    <div class="callout">공개 사이트 문의 폼이 <b>배송 조건(층수·엘리베이터·설치)</b>을 접수 시점에 받기 때문에,
      여기서 바로 견적 회신이 가능합니다 — 왕복 3~4회의 카톡이 사라지는 지점입니다.</div>`;
}
document.addEventListener("change",e=>{ const q=e.target.closest("[data-qst]");
  if(q){ INQUIRIES.find(x=>x.id===q.dataset.qst).status=q.value; toast("문의 상태 변경 — "+q.value); } });

/* ═══ 3. 리스크 콘솔 ═══ */
let rkSeller="gallery", rkRental=true, rkWork="w9", rkPrice=8000000, rkRate=0.05, wdType="ready";
function renderRisk(){
  const dday=Math.ceil((new Date("2027-07-25")-TODAY)/86400000);
  $("#acontent").innerHTML=`
    <div class="callout"><b>미술서비스업 신고제가 2026년 7월 26일 시행되었습니다.</b> 계도기간 만료(2027-07-25)까지
      <b class="tnum">D-${dday}</b>. 아래 판정기는 실제 조건문으로 동작합니다 — 사업 형태를 바꿔 보세요.</div>
    <div class="grid2">
      <div class="acard"><div class="acard-h"><h3>① 미술서비스업 신고 판정기</h3></div><div class="acard-b">
        <div class="field-row"><label>누가 판매하나</label>
          <div class="seg"><button data-rk-seller="gallery" class="${rkSeller==="gallery"?"on":""}">갤러리(타인 작품)</button>
          <button data-rk-seller="artist" class="${rkSeller==="artist"?"on":""}">작가 본인</button></div></div>
        <div class="field-row"><label>렌탈(대여) 운영</label>
          <div class="seg"><button data-rk-rental="1" class="${rkRental?"on":""}">한다</button>
          <button data-rk-rental="0" class="${!rkRental?"on":""}">안 한다</button></div></div>
        <div class="verdict" id="rkVerdict"></div>
      </div></div>
      <div class="acard"><div class="acard-h"><h3>② 재판매보상청구권(추급권) 판정</h3><span class="mut">2027-07-26 시행</span></div><div class="acard-b">
        <div class="field-row"><label>작품</label>
          <select class="sel" id="rkWork">${WORKS.map(w=>`<option value="${w.id}" ${w.id===rkWork?"selected":""}>《${w.title}》${w.firstSale?" · 판매이력":""}</option>`).join("")}</select></div>
        <div class="field-row"><label>가정 재판매가</label>
          <input class="num-in" id="rkPrice" type="number" value="${rkPrice}" step="1000000"> 원</div>
        <div class="field-row"><label>요율 시뮬 <span class="chip gr">대통령령 미정</span></label>
          <input type="range" id="rkRate" min="1" max="10" value="${rkRate*100}" style="width:140px;accent-color:var(--gold)">
          <b class="tnum" id="rkRateV">${(rkRate*100).toFixed(0)}%</b></div>
        <div class="verdict" id="royVerdict"></div>
      </div></div>
      <div class="acard"><div class="acard-h"><h3>③ 청약철회 제한 판정기</h3></div><div class="acard-b">
        <div class="seg" style="margin-bottom:6px">
          ${[["ready","기성 원화"],["edition","에디션 판화"],["commission","커미션(주문제작)"],["frame","맞춤 액자"]]
            .map(([k,l])=>`<button data-wd="${k}" class="${wdType===k?"on":""}">${l}</button>`).join("")}</div>
        <div class="verdict" id="wdVerdict"></div>
      </div></div>
      <div class="acard"><div class="acard-h"><h3>④ 유통 내역 대장</h3><span class="mut">미술진흥법 신고 사업자 의무 대응</span></div>
        <div class="acard-b tbl-wrap"><table class="tbl"><thead>
          <tr><th>작품</th><th>직접취득</th><th>취득일</th><th>최초판매</th><th class="r">판매가</th><th>추급권 필드</th></tr></thead>
          <tbody>${WORKS.map(w=>`<tr>
            <td>《${w.title}》</td>
            <td>${w.acquiredDirect?'<span class="chip g">작가 직접</span>':'<span class="chip gr">위탁</span>'}</td>
            <td class="tnum mut">${w.acquiredDate}</td>
            <td class="tnum mut">${w.firstSale?w.firstSale.date:"—"}</td>
            <td class="r tnum">${w.firstSale?MX.fmt(w.firstSale.price)+"원":"—"}</td>
            <td><span class="chip g">준비됨</span></td></tr>`).join("")}</tbody></table>
        <p class="mut" style="font-size:12px;margin-top:10px">2027년 시행 시 징수 단체가 "누구에게·언제·얼마에·직접취득 여부"를 요청할 수 있습니다.
          지금 필드를 갖춰 두지 않으면 소급 복원이 불가능합니다.</p></div></div>
    </div>`;
  drawRk(); drawRoy(); drawWd();
}
function drawRk(){
  const kinds=[];
  if(rkSeller==="gallery") kinds.push("화랑업");
  if(rkRental) kinds.push("미술품 대여·판매업");
  const need=kinds.length>0;
  $("#rkVerdict").innerHTML = rkSeller==="artist" && !rkRental
    ? `<b class="free">신고 불요</b> — 작가가 자기 창작물을 직접 판매하는 행위는 미술서비스업에 해당하지 않습니다(미술진흥법).
       <ul class="vlist"><li>단, 타 작가 작품을 함께 팔기 시작하면 그 즉시 화랑업 신고 대상이 됩니다.</li></ul>`
    : `<b class="due">신고 대상</b> — 해당 업종: <b>${kinds.join(" + ")||"화랑업"}</b>
       <ul class="vlist">
         <li class="hit">관할 지자체 신고 (사업자등록과 별개)</li>
         <li class="hit">미술품 유통 내역 관리 의무 (→ ④ 대장)</li>
         <li class="hit">표준 감정서 양식 사용 (보증서 발급 시)</li>
         <li class="hit">미신고·의무 위반 시 과태료 또는 영업정지</li>
       </ul>`;
}
function drawRoy(){
  const w=WORKS.find(x=>x.id===rkWork);
  const r=MX.resaleRoyalty(w, rkPrice);
  const amt=Math.round(rkPrice*rkRate/10000)*10000;
  $("#royVerdict").innerHTML = r.due
    ? `<b class="due">추급권 대상</b> — ${r.reason}<br>
       요율 ${(rkRate*100).toFixed(0)}% 가정 시 작가 보상액 <b class="tnum">${MX.fmt(amt)}원</b>
       <ul class="vlist"><li class="hit">작가 생존 + 사후 30년 적용 · 권리 양도 불가</li>
       <li class="hit">거래 정보 제출 요구에 대비해 ④ 대장 필드가 필요합니다</li></ul>`
    : `<b class="free">적용 제외</b> — ${r.reason}
       <ul class="vlist"><li>500만원 이상 + 제외요건 미해당 시에만 보상 의무가 생깁니다.</li></ul>`;
}
function drawWd(){
  const M={
    ready:{ ok:false, hits:[0], txt:"기성 원화는 '소비자 주문에 따른 개별 생산'이 아니므로 요건 ①부터 불성립 — 7일 철회 가능(표시·광고 불일치 시 3개월)" },
    edition:{ ok:false, hits:[0], txt:"이미 제작된 에디션 판화도 개별 생산이 아님 — 철회 제한 불성립" },
    commission:{ ok:true, hits:[0,1,2,3], txt:"4요건을 모두 갖추면 철회 제한 성립 — 공개 사이트 문의 폼에서 커미션 선택 시 별도 동의 단계가 실제로 추가됩니다" },
    frame:{ ok:true, hits:[0,1,2,3], txt:"맞춤 액자 부분은 개별 제작 성립 가능 — 단 작품 본체와 분리 고지 필요" } };
  const m=M[wdType];
  $("#wdVerdict").innerHTML=`<b class="${m.ok?"due":"free"}">${m.ok?"철회 제한 성립 가능":"철회 제한 불성립"}</b> — ${m.txt}
    <ul class="vlist">
      ${["① 소비자 주문에 따라 개별 생산","② 판매자에게 회복 불가한 중대 피해","③ 사전 별도 고지","④ 소비자 서면 동의"]
        .map((t,i)=>`<li class="${m.hits.includes(i)&&m.ok?"hit":""}">${t}</li>`).join("")}
    </ul>`;
}
document.addEventListener("click",e=>{
  const s=e.target.closest("[data-rk-seller]"); if(s){ rkSeller=s.dataset.rkSeller; renderRisk(); return; }
  const r=e.target.closest("[data-rk-rental]"); if(r){ rkRental=r.dataset.rkRental==="1"; renderRisk(); return; }
  const w=e.target.closest("[data-wd]"); if(w){ wdType=w.dataset.wd; $$("[data-wd]").forEach(b=>b.classList.toggle("on",b===w)); drawWd(); return; }
});
document.addEventListener("input",e=>{
  if(e.target.id==="rkPrice"){ rkPrice=+e.target.value||0; drawRoy(); }
  if(e.target.id==="rkRate"){ rkRate=+e.target.value/100; $("#rkRateV").textContent=e.target.value+"%"; drawRoy(); }
});
document.addEventListener("change",e=>{ if(e.target.id==="rkWork"){ rkWork=e.target.value; drawRoy(); } });

/* ═══ 4. 성능·이미지 보호 (실측) ═══ */
async function renderPerf(){
  $("#acontent").innerHTML=`<div class="acard"><div class="acard-h"><h3>이미지 실측 중…</h3></div><div class="acard-b mut">파생본 크기·해상도를 실제로 측정합니다.</div></div>`;
  const rows=[];
  for(const w of WORKS){
    const url=`assets/img/${w.img}.webp`;
    const [blob, dim] = await Promise.all([
      fetch(url).then(r=>r.blob()),
      new Promise(res=>{ const i=new Image(); i.onload=()=>res({w:i.naturalWidth,h:i.naturalHeight}); i.onerror=()=>res({w:0,h:0}); i.src=url; })
    ]);
    rows.push({ w, kb:Math.round(blob.size/1024), px:dim });
  }
  const total=rows.reduce((s,r)=>s+r.kb,0), maxKb=Math.max(...rows.map(r=>r.kb));
  const okAll=rows.every(r=>Math.max(r.px.w,r.px.h)<=CONFIG.maxLongEdge);
  $("#acontent").innerHTML=`
    <div class="callout"><b>해상도 상한 정책 = 법적 방어 + 성능 + 도용 방지가 같은 수단입니다.</b>
      판례(서울중앙지법 2008가합21261)는 "고도의 해상도 제공"을 소개 목적을 넘는 것으로 봤습니다.
      긴 변 ${MX.fmt(CONFIG.maxLongEdge)}px 이하 정책 준수 여부를 실측합니다.</div>
    <div class="acard"><div class="acard-h"><h3>파생본 실측</h3>
      <span class="mut">총 ${MX.fmt(total)}KB · 최대 단일 ${maxKb}KB · 정책 ${okAll?"전체 준수":"위반 있음"}</span></div>
      <div class="acard-b tbl-wrap"><table class="tbl"><thead>
        <tr><th>작품</th><th>파일</th><th class="r">용량</th><th class="r">해상도</th><th>≤${MX.fmt(CONFIG.maxLongEdge)}px</th><th>전송</th></tr></thead>
        <tbody>${rows.map(r=>`<tr>
          <td>《${r.w.title}》</td><td class="mut">${r.w.img}.webp</td>
          <td class="r tnum">${r.kb}KB</td>
          <td class="r tnum">${r.px.w}×${r.px.h}</td>
          <td>${Math.max(r.px.w,r.px.h)<=CONFIG.maxLongEdge?'<span class="chip g">준수</span>':'<span class="chip r">초과</span>'}</td>
          <td><div class="perf-bar" style="width:120px"><i style="width:${(r.kb/maxKb*100).toFixed(0)}%"></i></div></td>
        </tr>`).join("")}</tbody></table></div></div>
    <div class="grid2">
      <div class="acard"><div class="acard-h"><h3>로딩 전략</h3></div><div class="acard-b" style="font-size:13px;line-height:1.9">
        <span class="chip g">적용</span> 첫 액자 fetchpriority=high · 이후 loading=lazy<br>
        <span class="chip g">적용</span> LQIP — 블러 → 선명 전환을 "베일 벗기듯" 연출로 승화<br>
        <span class="chip g">적용</span> webp 파생본 · 미장 벽은 1장 고정 레이어(중복 로드 0)<br>
        <span class="chip g">적용</span> 리빌은 opacity만(1.9s) — 레이아웃 시프트 0</div></div>
      <div class="acard"><div class="acard-h"><h3>우클릭 방지가 왜 무의미한가 — 시연</h3></div><div class="acard-b" style="font-size:13px;line-height:1.9">
        <p class="mut" style="margin-bottom:10px">우클릭을 막아도 이미지 주소는 그대로 노출됩니다:</p>
        <code style="display:block;background:#fff;border:1px solid var(--ink-12);padding:10px;font-size:11px;word-break:break-all">GET /assets/img/a8.webp → 200 OK (스크린샷·개발자도구로도 취득 가능)</code>
        <p style="margin-top:12px">그래서 무로는 차단이 아니라 <b>가치 제한</b>으로 방어합니다 —<br>
        <span class="chip g">해상도 상한</span> <span class="chip g">원본 미노출</span> <span class="chip g">작가 크레딧 오버레이</span> <span class="chip g">판매 후 자동 축소</span></p>
      </div></div>
    </div>`;
}

/* 초기화 */
go("works");
})();
