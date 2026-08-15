/* DENTDESK — 캘린더·환자·수납·발송·통계·설정 */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const fmt = n => n.toLocaleString();
const state = { role:"desk", view:"cal", axis:"chair", ssot:"crm", emrMode:false,
  maskLogs:0, sendTab:"remind", noshowDef:"strict", axisApptsExtra:[] };

function toast(m){ const t=$("#toast"); t.textContent=m; t.classList.add("show");
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"),3000); }
const slotTime = t => { const h=9+Math.floor(t/2), m=t%2?"30":"00"; return `${h}:${m}`; };

/* ── 셸: 역할·탭 ── */
$$(".role-sw button").forEach(b=>b.addEventListener("click",()=>{
  state.role=b.dataset.role; $$(".role-sw button").forEach(x=>x.classList.toggle("on",x===b));
  renderPatients(); renderLogs(); renderPayments();
  toast(`역할 전환 — ${DD.ROLES[state.role].label}. 다운로드·수정·통계·이력 권한이 실제로 바뀝니다.`);
}));
$$(".nav button").forEach(b=>b.addEventListener("click",()=>{
  state.view=b.dataset.view; $$(".nav button").forEach(x=>x.classList.toggle("on",x===b));
  $$(".view").forEach(v=>v.classList.toggle("on",v.id==="v-"+state.view));
  if(state.view==="stats") renderStats();
  if(state.view==="cal" && calMode==="grid") renderCal();   /* 숨김 중 폭 0으로 어긋난 배치 복구 */
  bindReveal();
}));

/* ══ ① 캘린더 — 세로 시간축(시안 문법: 시간=세로·리소스=컬럼·컬러 블록) ══ */
const SH=36, TW=52;
function axisRows(){
  if(state.axis==="chair"){
    const rows=[]; DD.ROOMS.forEach(r=>{ r.chairs.forEach(cid=>{ const c=DD.CHAIRS.find(x=>x.id===cid);
      rows.push({id:c.id,key:"chair",name:c.name,color:c.color,sub:r.name}); }); });
    return rows;
  }
  if(state.axis==="doc") return DD.DOCTORS.map(d=>({id:d.id,key:"doc",name:d.name,color:d.color,sub:"이동 리소스"}));
  return DD.HYGIENISTS.map(h=>({id:h.id,key:"hyg",name:h.name,color:h.color,sub:"스케일링·예방"}));
}
function apptsFor(row){ return DD.APPTS.filter(a=>a[row.key]===row.id); }
function blocked(rowId,t){
  return DD.BLOCKS.some(b=>(b.chair==="*"||b.chair===rowId)&&t>=b.t&&t<b.t+b.len);
}
function renderCal(){
  const ro = state.ssot==="emr";
  $("#calRO").hidden = !ro;
  const rows = axisRows();
  const N = rows.length;
  let h = `<div class="vcal" style="grid-template-columns:${TW}px repeat(${N},minmax(128px,1fr))">`;
  h += `<div class="vh" style="background:#F7F9FC"></div>`;
  rows.forEach(row=>{ h += `<div class="vh"><span class="dot" style="background:${row.color}"></span>${row.name}<small>${row.sub||""}</small></div>`; });
  for(let t=0;t<DD.SLOTS;t++){
    h += `<div class="tlab" style="height:${SH}px">${t%2? "":slotTime(t)}</div>`;
    rows.forEach(row=>{
      const bl = row.key==="chair" ? blocked(row.id,t) : DD.BLOCKS.some(b=>b.chair==="*"&&t>=b.t&&t<b.t+b.len);
      const blTitle = bl ? DD.BLOCKS.find(b=>(b.chair==="*"||b.chair===row.id)&&t>=b.t&&t<b.t+b.len).label : "";
      h += `<div class="vcell ${t%2?"hh":""} ${bl?"blocked":""}" style="height:${SH}px" data-slot="${row.key}:${row.id}:${t}" title="${blTitle}"></div>`;
    });
  }
  h += `</div>`;
  $("#cal").innerHTML = h;
  const grid = $("#cal .vcal");
  grid.style.position="relative";
  const headH = grid.querySelector(".vh").getBoundingClientRect().height;
  const colW = (grid.getBoundingClientRect().width - TW) / N;
  if(colW<=0) return;   /* 숨김 뷰(폭 0)에서 호출 시 절대배치 스킵 — 뷰 복귀 시 재렌더로 정상 배치 */
  rows.forEach((row,ci)=>{
    apptsFor(row).forEach(a=>{
      const el=document.createElement("div");
      el.className="vevt "+a.st; el.dataset.appt=a.id;
      el.style.top=(headH + a.t*SH + 2)+"px";
      el.style.height=(a.len*SH - 5)+"px";
      el.style.left=(TW + ci*colW + 3)+"px";
      el.style.width=(colW - 6)+"px";
      el.title=`${a.p} · ${a.proc} · ${staffOf(a)}`;
      el.innerHTML=`<b>${a.p}${a.st==="noshow"?" ⌀":""}</b><span>${slotTime(a.t)}–${slotTime(a.t+a.len)} · ${a.proc}</span><span class="vevt-staff">${staffOf(a)}</span>`;
      grid.appendChild(el);
    });
  });
  const now=document.createElement("div");
  now.className="vnow"; now.style.top=(headH + DD.NOW_SLOT*SH)+"px";
  grid.appendChild(now);
  const cnt = { wait:0,conf:0,done:0,noshow:0,cancel:0 };
  DD.APPTS.forEach(a=>cnt[a.st]++);
  $("#calKpi").innerHTML = `오늘 ${DD.APPTS.length}건 — <b style="color:var(--st-conf)">확정 ${cnt.conf}</b> · 대기 ${cnt.wait} · 완료 ${cnt.done} · <b style="color:var(--st-noshow)">노쇼 ${cnt.noshow}</b> · 취소 ${cnt.cancel}`;
}
/* 담당자(의·위생) · 진료실 표기 */
function docOf(a){ return a.doc?((DD.DOCTORS.find(d=>d.id===a.doc)||{}).name||""):""; }
function hygOf(a){ return a.hyg?((DD.HYGIENISTS.find(h=>h.id===a.hyg)||{}).name||""):""; }
function staffOf(a){ const s=[docOf(a),hygOf(a)].filter(Boolean); return s.join(" · ")||"미배정"; }
function chairOf(a){ const c=DD.CHAIRS.find(c=>c.id===a.chair)||{}; const r=DD.ROOMS.find(r=>r.id===c.room)||{}; return `${r.name||""} · ${c.name||a.chair}`; }
$$("#axisTabs .tab").forEach(b=>b.addEventListener("click",()=>{
  state.axis=b.dataset.axis; $$("#axisTabs .tab").forEach(x=>x.classList.toggle("on",x===b)); renderCal();
  toast(state.axis==="chair"?"체어별 보기 — 진료실 그룹으로 표시":state.axis==="doc"?"의사별 보기":"위생사별 보기 — 스케일링·예방 처치 배정");
}));

/* 스케줄 뷰 전환 (타임라인 · 월간 · 목록) + 기간·상태 필터 */
let calMode="grid", calFilter="all", calPeriod="all";
const CAL_TODAY="2026-08-14";
function inPeriod(d){
  if(calPeriod==="all") return true;
  if(calPeriod==="day") return d===CAL_TODAY;
  if(calPeriod==="month") return d.startsWith("2026-08");
  if(calPeriod==="week") return d>="2026-08-10" && d<="2026-08-16"; /* 오늘 포함 주 */
  if(calPeriod==="range"){ const f=$("#calFrom").value, t=$("#calTo").value; return (!f||d>=f)&&(!t||d<=t); }
  return true;
}
function renderCalList(){
  const rows=DD.SCHED.filter(a=>(calFilter==="all"||a.st===calFilter)&&inPeriod(a.date))
    .slice().sort((x,y)=> x.date<y.date?-1:x.date>y.date?1:(x.time<y.time?-1:1));
  $("#calListBody").innerHTML=rows.map(a=>`<tr data-sidx="${DD.SCHED.indexOf(a)}" style="cursor:pointer">
    <td style="white-space:nowrap">${a.date.slice(5).replace("-","/")}</td>
    <td style="white-space:nowrap">${a.time}</td>
    <td><span class="pill ${a.st}">${DD.STATUS[a.st]}</span></td>
    <td><b>${a.p}</b></td>
    <td>${a.proc}</td>
    <td>${staffOf(a)}</td>
    <td style="color:var(--ink-sub);font-size:0.85rem">${chairOf(a)}</td></tr>`).join("")
    ||'<tr><td colspan="7" style="text-align:center;color:var(--ink-muted);padding:16px">해당 기간 예약이 없습니다</td></tr>';
  const c={wait:0,conf:0,done:0,noshow:0,cancel:0}; rows.forEach(a=>c[a.st]++);
  const pl={all:"전체 기간",day:"오늘 (8/14)",week:"이번 주 (8/10~16)",month:"8월",range:`${$("#calFrom").value||"처음"} ~ ${$("#calTo").value||"끝"}`}[calPeriod];
  $("#calListSum").innerHTML=`${pl} · 조회 <b>${rows.length}건</b> — 확정 ${c.conf} · 대기 ${c.wait} · 완료 ${c.done} · 노쇼 ${c.noshow} · 취소 ${c.cancel}`;
}
function renderMonth(){
  const startDow=new Date(2026,7,1).getDay(), daysIn=31;
  const byDate={}; DD.SCHED.forEach(a=>{ (byDate[a.date]=byDate[a.date]||[]).push(a); });
  let h=`<div class="mcal-h">${["일","월","화","수","목","금","토"].map(w=>`<div>${w}</div>`).join("")}</div><div class="mcal-grid">`;
  for(let i=0;i<startDow;i++) h+=`<div class="mcell empty"></div>`;
  for(let d=1;d<=daysIn;d++){
    const ds=`2026-08-${String(d).padStart(2,"0")}`, isToday=ds===CAL_TODAY;
    const items=(byDate[ds]||[]).slice().sort((x,y)=>x.time<y.time?-1:1);
    h+=`<div class="mcell ${isToday?"today":""}"><div class="mcell-d">${d}${items.length?`<span class="mcell-n">${items.length}</span>`:""}</div>
      ${items.slice(0,4).map(a=>`<div class="mevt ${a.st}" data-sidx="${DD.SCHED.indexOf(a)}">${a.time} ${a.p}</div>`).join("")}
      ${items.length>4?`<div class="mevt-more">+${items.length-4}건 더</div>`:""}</div>`;
  }
  h+=`</div>`; $("#mcal").innerHTML=h;
}
document.addEventListener("click",e=>{
  const m=e.target.closest("#calModeTabs .tab");
  if(m){ calMode=m.dataset.cmode; $$("#calModeTabs .tab").forEach(x=>x.classList.toggle("on",x===m));
    const isGrid=calMode==="grid", isMonth=calMode==="month", isList=calMode==="list";
    $("#calGridWrap").hidden=!isGrid; $("#calMonthWrap").hidden=!isMonth; $("#calListWrap").hidden=!isList;
    $("#calNav").hidden=isList; $("#calListCtrl").hidden=!isList;                    /* 2차 선택자: 타임라인·월간=날짜/월, 목록=기간·상태 */
    $("#calDate").textContent=isMonth?"2026년 8월":"2026년 8월 14일 (금)";
    $("#axisTabs").style.opacity=isGrid?"1":".4"; $("#axisTabs").style.pointerEvents=isGrid?"auto":"none";
    document.querySelector(".calhint").style.visibility=isGrid?"visible":"hidden";
    if(isList) renderCalList(); else if(isMonth) renderMonth(); else renderCal(); return; }
  const nav=e.target.closest("#calNav [data-cnav]");
  if(nav){ toast(calMode==="month"?"데모 데이터는 2026년 8월입니다 (월 이동은 실제 예약 데이터 연동 시 동작)":"데모 데이터는 2026년 8월 14일(금)입니다 (날짜 이동은 실 데이터 연동 시 동작)"); return; }
  const p=e.target.closest("#calPeriod .tab");
  if(p){ calPeriod=p.dataset.cp; $$("#calPeriod .tab").forEach(x=>x.classList.toggle("on",x===p));
    $("#calRangeWrap").hidden=calPeriod!=="range"; renderCalList(); return; }
  const f=e.target.closest("#calStFilter .tab");
  if(f){ calFilter=f.dataset.clf; $$("#calStFilter .tab").forEach(x=>x.classList.toggle("on",x===f)); renderCalList(); return; }
});
document.addEventListener("change",e=>{ if(e.target.id==="calFrom"||e.target.id==="calTo"){ if(calPeriod==="range") renderCalList(); } });
window.addEventListener("resize",()=>{ if(state.view==="cal") renderCal(); });

/* 빈 슬롯 클릭 → 예약/휴무 선택 모달 */
let pendingSlot=null;
function openBookModal(){
  if(!pendingSlot) return; const {id,t}=pendingSlot;
  $("#bkWhen").textContent=`${slotTime(t)}–${slotTime(t+2)} · ${axisRows().find(r=>r.id===id)?.name||id}`;
  $("#bkPatient").value=""; $("#bkNoshow").hidden=true; $("#bkPatState").textContent="";
  $("#bkPatPop").hidden=true; $("#bkProc").value=""; $("#bkProcSel").value=""; $("#bkProcMeta").textContent="";
  $("#bookModal").classList.add("open"); setTimeout(()=>$("#bkPatient").focus(),50);
}
const slotHHMM = t => { const h=9+Math.floor(t/2), m=t%2?30:0; return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0"); };
const hhmmToSlot = v => { const [h,m]=(v||"9:00").split(":").map(Number); return (h-9)*2 + (m>=30?1:0); };
const DOWKO=["일","월","화","수","목","금","토"];
function offRepeatRule(){                                    /* 구글 캘린더식 반복 규칙 → {rule,txt,…} */
  const mode=$("#offRepeat").value, dow=new Date(2026,7,14).getDay();
  if(mode==="none")     return {rule:"none", txt:""};
  if(mode==="daily")    return {rule:"daily", txt:"매일 반복"};
  if(mode==="weekly")   return {rule:"weekly", days:[dow], txt:`매주 ${DOWKO[dow]}요일`};
  if(mode==="weekdays") return {rule:"weekdays", days:[1,2,3,4,5], txt:"주중 매일(월~금)"};
  if(mode==="monthly")  return {rule:"monthly", txt:"매월 이 날"};
  /* custom */
  const every=Math.max(1,+$("#offEvery").value||1), unit=$("#offUnit").value;
  const uw={day:"일",week:"주",month:"개월"}[unit];
  let txt = every===1 ? `매${uw}` : `${every}${uw}마다`;
  let days=[];
  if(unit==="week"){ days=[...$$("#offDows button.on")].map(b=>+b.dataset.d).sort((a,b)=>a-b);
    if(!days.length){ days=[dow]; } txt += " " + days.map(d=>DOWKO[d]).join(", ")+"요일"; }
  const et=($("input[name=offEnd]:checked")||{}).value||"never";
  if(et==="on")    txt += ` · ${$("#offEndDate").value}까지`;
  else if(et==="after") txt += ` · ${$("#offCount").value}회 후 종료`;
  return {rule:"custom", every, unit, days, end:et, txt};
}
document.addEventListener("click",e=>{
  const cell=e.target.closest(".vcell:not(.blocked)");
  if(cell && state.view==="cal"){
    if(state.ssot==="emr"){ toast("읽기 전용 — SSOT가 「전자차트가 주인」이라 이 화면에서는 예약을 만들지 않습니다 (설정 탭에서 변경)"); return; }
    const [key,id,t]=cell.dataset.slot.split(":");
    pendingSlot={key,id,t:+t};
    $("#slotWhen").textContent=`${slotTime(+t)}–${slotTime(+t+2)} · ${axisRows().find(r=>r.id===id)?.name||id}`;
    $$("#slotTabs .tab").forEach(x=>x.classList.toggle("on",x.dataset.slot==="book"));   /* 기본: 예약 등록 탭 활성 */
    $("#pane-book").hidden=false; $("#pane-off").hidden=true;
    $("#offStart").value=slotHHMM(+t); $("#offEnd").value=slotHHMM(+t+2);              /* 휴무 시작·종료 프리필 */
    $("#offAllday").checked=false; $("#offTimeRow").hidden=false;
    $("#offRepeat").value="none"; $("#offCustom").hidden=true;                          /* 반복: 구글식 초기화 */
    { const cd=new Date(2026,7,14).getDay(); $$("#offDows button").forEach(b=>b.classList.toggle("on",+b.dataset.d===cd)); }
    $("#slotModal").classList.add("open"); return;
  }
  const stab=e.target.closest("#slotTabs .tab");
  if(stab){ const k=stab.dataset.slot; $$("#slotTabs .tab").forEach(x=>x.classList.toggle("on",x===stab));
    $("#pane-book").hidden=k!=="book"; $("#pane-off").hidden=k!=="off"; return; }
  const dowb=e.target.closest("#offDows button");                                     /* 구글식 반복 요일 토글 */
  if(dowb){ dowb.classList.toggle("on"); return; }
  if(e.target.closest("#slotBook")){ $("#slotModal").classList.remove("open"); openBookModal(); return; }
  if(e.target.closest("#offSave")){ if(!pendingSlot) return;
    const scope=$("#offScope").value, reason=$("#offReason").value, allday=$("#offAllday").checked, rr=offRepeatRule();
    let t, len;
    if(allday){ t=0; len=DD.SLOTS; }
    else { const s=Math.max(0,hhmmToSlot($("#offStart").value)), en=hhmmToSlot($("#offEnd").value);
      t=s; len=Math.max(1, Math.min(DD.SLOTS,en)-s); }
    const chair = scope==="*" ? "*" : (pendingSlot.key==="chair" ? pendingSlot.id : "*");
    DD.BLOCKS.push({ chair, t, len, label:reason, repeat:rr.rule!=="none"?rr:undefined });
    renderCal(); $("#slotModal").classList.remove("open");
    const repTxt = rr.txt ? ` · ${rr.txt}` : "";
    const when = allday?"종일":`${slotTime(t)}–${slotTime(t+len)}`;
    toast(`휴무 등록 — ${reason} (${when})${repTxt}`); return; }
  if(e.target.closest("[data-close]")) $$(".modal-bg").forEach(m=>m.classList.remove("open"));
});
document.addEventListener("change",e=>{
  if(e.target.id==="offAllday"){ $("#offTimeRow").hidden=e.target.checked; }
  if(e.target.id==="offRepeat"){ $("#offCustom").hidden=e.target.value!=="custom"; if(e.target.value==="custom") $("#offDowRow").hidden=$("#offUnit").value!=="week"; }
  if(e.target.id==="offUnit"){ $("#offDowRow").hidden=e.target.value!=="week"; }
});

/* 예약 카드 드래그 → 시간·체어 변경 (클릭과 통합: 이동 없으면 패널 열기) */
const SL=(cx,cy)=>{
  const grid=$("#cal .vcal"); if(!grid) return null;
  const r=grid.getBoundingClientRect();
  const headH=grid.querySelector(".vh").getBoundingClientRect().height;
  const rows=axisRows(), N=rows.length, colW=(r.width-TW)/N;
  const ci=Math.floor((cx-r.left-TW)/colW), t=Math.round((cy-r.top-headH)/SH);
  if(ci<0||ci>=N||t<0||t>=DD.SLOTS) return null;
  return { row:rows[ci], t:Math.max(0,Math.min(DD.SLOTS-1,t)) };
};
function clearDropHl(){ $$(".vcell.drop-ok,.vcell.drop-no").forEach(c=>c.classList.remove("drop-ok","drop-no")); }
function dropOK(a,drop){
  const key=drop.row.key, id=drop.row.id, t=drop.t;
  const conflict=DD.APPTS.some(x=>x.id!==a.id && x.st!=="cancel" && x[key]===id && t<x.t+x.len && t+a.len>x.t);
  const blk=[...Array(a.len)].some((_,k)=> (key==="chair"?blocked(id,t+k):DD.BLOCKS.some(b=>b.chair==="*"&&(t+k)>=b.t&&(t+k)<b.t+b.len)) );
  return !conflict && !blk && (t+a.len)<=DD.SLOTS;
}
let drag=null;
document.addEventListener("pointerdown",e=>{
  if(state.view!=="cal") return;
  const el=e.target.closest(".vevt"); if(!el) return;
  const a=DD.APPTS.find(x=>x.id===el.dataset.appt); if(!a) return;
  drag={el,a,x0:e.clientX,y0:e.clientY,top0:parseFloat(el.style.top),left0:parseFloat(el.style.left),moved:false};
  try{ el.setPointerCapture(e.pointerId); }catch(_){}
});
document.addEventListener("pointermove",e=>{
  if(!drag) return;
  const dx=e.clientX-drag.x0, dy=e.clientY-drag.y0;
  if(!drag.moved && Math.hypot(dx,dy)<5) return;
  if(state.ssot==="emr"){ drag=null; toast("읽기 전용 — 전자차트가 예약의 주인이라 이 화면에서는 이동할 수 없습니다"); return; }
  drag.moved=true; drag.el.classList.add("dragging");
  drag.el.style.top=(drag.top0+dy)+"px"; drag.el.style.left=(drag.left0+dx)+"px";
  clearDropHl();
  const drop=SL(e.clientX,e.clientY);
  if(drop){ const ok=dropOK(drag.a,drop);
    for(let k=0;k<drag.a.len;k++){ const c=$(`.vcell[data-slot="${drop.row.key}:${drop.row.id}:${drop.t+k}"]`); if(c) c.classList.add(ok?"drop-ok":"drop-no"); } }
});
document.addEventListener("pointerup",e=>{
  if(!drag) return;
  const d=drag; drag=null; clearDropHl(); d.el.classList.remove("dragging");
  if(!d.moved){ openApptPanel(d.a.id); return; }         /* 이동 없음 = 클릭 → 패널 */
  const drop=SL(e.clientX,e.clientY);
  if(!drop || (drop.row.id===d.a[drop.row.key] && drop.t===d.a.t)){ renderCal(); return; }
  if(!dropOK(d.a,drop)){ toast("이동 불가 — 그 시간대에 예약이 있거나 블록(점심·정비)입니다"); renderCal(); return; }
  const from=`${slotTime(d.a.t)}`; d.a.t=drop.t; d.a[drop.row.key]=drop.row.id;
  renderCal();
  toast(`${d.a.p} · ${from} → ${slotTime(drop.t)} ${drop.row.name}로 이동 (드래그 변경)`);
});
/* 예약 등록 — 환자 자동검색(이름·초성·전화 뒷자리) */
const bkPop=$("#bkPatPop"), bkIn=$("#bkPatient");
function bkNoshowBanner(){ const p=DD.PATIENTS.find(x=>x.name===bkIn.value.trim()); $("#bkNoshow").hidden=!(p&&p.noshow12m>=2); }
bkIn.addEventListener("input",()=>{
  const q=bkIn.value.trim(); bkNoshowBanner();
  if(!q){ bkPop.hidden=true; $("#bkPatState").textContent=""; return; }
  const isCho=/^[ㄱ-ㅎ]+$/.test(q), isNum=/^\d+$/.test(q);
  const hits=DD.PATIENTS.filter(p=> isCho?chosung(p.name).includes(q) : isNum?p.phone.replace(/-/g,"").includes(q) : p.name.includes(q));
  bkPop.innerHTML = hits.length
    ? hits.map(p=>`<div class="qs-item" data-bkpat="${p.id}"><b>${p.name}</b><span>${p.id}</span><span class="qs-meta">${mask(p.phone)}</span></div>`).join("")
    : `<div class="qs-empty">등록 환자 없음 — 이대로 저장하면 미등록(신규) 예약이 되고, 예약 상세에서 「+ 환자 등록」으로 차트를 만들 수 있습니다</div>`;
  bkPop.hidden=false;
  const exact=DD.PATIENTS.find(p=>p.name===q);
  $("#bkPatState").textContent = exact?`등록 환자 · ${exact.id}` : "미등록 — 저장 후 「+ 환자 등록」 가능";
});
document.addEventListener("click",e=>{
  const bi=e.target.closest("[data-bkpat]");
  if(bi){ const p=DD.PATIENTS.find(x=>x.id===bi.dataset.bkpat); bkIn.value=p.name; bkPop.hidden=true;
    $("#bkPatState").textContent=`등록 환자 · ${p.id}`; bkNoshowBanner(); return; }
  if(!e.target.closest("#bookModal .qsearch")) bkPop.hidden=true;
});
/* 진료항목 선택(등록 진료) + 수기 병행 — 진료항목 관리와 연동 */
function fillSvcSelect(sel,placeholder,withPrice){
  sel.innerHTML=`<option value="">${placeholder}</option>`;
  DD.SERVICES.forEach(g=>{
    const og=document.createElement("optgroup"); og.label=g.cat;
    g.items.forEach(it=>{ const o=document.createElement("option");
      o.value=it.name; o.dataset.ins=it.ins; o.dataset.min=it.min; o.dataset.price=it.price||0;
      o.textContent=withPrice&&it.ins==="비급여"&&it.price?`${it.name} · ${fmt(it.price)}원`:`${it.name} · ${it.ins} · ${it.min}분`;
      og.appendChild(o); });
    sel.appendChild(og);
  });
}
function renderProcSelect(){
  fillSvcSelect($("#bkProcSel"),"— 등록된 진료 선택 또는 직접 입력 —",false);
  if($("#npItemSel")) fillSvcSelect($("#npItemSel"),"— 진료항목 선택 또는 직접 입력 —",true);
}
$("#bkProcSel").addEventListener("change",()=>{
  const o=$("#bkProcSel").selectedOptions[0];
  if(o&&o.value){ $("#bkProc").value=o.value; $("#bkProcMeta").textContent=`${o.dataset.ins} · 기본 소요 ${o.dataset.min}분`; }
  else $("#bkProcMeta").textContent="";
});
/* 수납 — 항목 선택 시 진료명 + 수가(비급여) 자동 채움 */
$("#npItemSel").addEventListener("change",()=>{
  const o=$("#npItemSel").selectedOptions[0]; if(!o||!o.value) return;
  const ins=o.dataset.ins, price=+o.dataset.price||0;
  $("#npItem").value=o.value+(ins!=="비급여"?`(${ins})`:"");
  if(ins==="비급여"&&price){ $("#npAmount").value=price.toLocaleString(); npGate(); }
});
/* 수납 — 환자명 검색 자동완성 */
const npPop=$("#npPatPop"), npIn=$("#npPat");
npIn.addEventListener("input",()=>{
  const q=npIn.value.trim(); if(!q){ npPop.hidden=true; return; }
  const isCho=/^[ㄱ-ㅎ]+$/.test(q), isNum=/^\d+$/.test(q);
  const hits=DD.PATIENTS.filter(p=> isCho?chosung(p.name).includes(q):isNum?p.phone.replace(/-/g,"").includes(q):p.name.includes(q));
  npPop.innerHTML=hits.length?hits.map(p=>{ const ar=DD.ARREARS.find(a=>a.p===p.name);
    return `<div class="qs-item" data-nppat="${p.id}"><b>${p.name}</b><span>${p.id}</span><span class="qs-meta">${mask(p.phone)}${ar?` · 미수 ${fmt(ar.total-ar.paid)}원`:""}</span></div>`; }).join("")
    :`<div class="qs-empty">등록 환자 없음 — 직접 입력으로 수납 가능</div>`;
  npPop.hidden=false;
});
document.addEventListener("click",e=>{
  const bi=e.target.closest("[data-nppat]");
  if(bi){ const p=DD.PATIENTS.find(x=>x.id===bi.dataset.nppat); npIn.value=p.name; npPop.hidden=true; return; }
  if(!e.target.closest("#sp-pay-main .qsearch")) npPop.hidden=true;
});
/* 설정 — 진료항목 관리 (헤어사랑넷 시술항목설정 계승 — 좌 카테고리 + 우 표) */
let svcCat="전체", svcEdit=null; /* svcEdit={gi,ii}; ii=-1 → 신규 추가행 */
function svcEditRow(gi,ii,it){
  return `<tr class="svc-editrow">
    <td><input class="inp" id="svcE_name" value="${it.name}" placeholder="진료명" style="width:100%"></td>
    <td><input class="inp" id="svcE_min" type="number" value="${it.min}" style="width:64px"> 분</td>
    <td style="text-align:right"><input class="inp" id="svcE_price" type="number" value="${it.price||0}" style="width:104px;text-align:right"></td>
    <td><select class="inp" id="svcE_ins" style="width:120px">${["비급여","급여","급여(연1회)","상담"].map(o=>`<option ${o===it.ins?"selected":""}>${o}</option>`).join("")}</select></td>
    <td><button class="btn xs pri" data-svcsave="${gi}:${ii}">저장</button><button class="btn xs ghost" data-svccancel="1">취소</button></td></tr>`;
}
function renderServices(){
  const total=DD.SERVICES.reduce((s,g)=>s+g.items.length,0);
  $("#svcCatList").innerHTML=
    `<div class="svc-cat ${svcCat==="전체"?"on":""}" data-svccat="전체"><span class="dh">⠿</span><span class="nm">전체</span><b>${total}</b></div>`+
    DD.SERVICES.map((g,gi)=>`<div class="svc-cat ${svcCat===g.cat?"on":""}" data-svccat="${g.cat}">
      <span class="dh">⠿</span><span class="nm">${g.cat}</span><b>${g.items.length}</b>
      <i class="svc-catdel" data-svccatdel="${gi}" title="카테고리 삭제">×</i></div>`).join("");
  const groups=svcCat==="전체"?DD.SERVICES:DD.SERVICES.filter(g=>g.cat===svcCat);
  $("#svcTables").innerHTML=groups.map(g=>{
    const gi=DD.SERVICES.indexOf(g);
    const addRow=(svcEdit&&svcEdit.gi===gi&&svcEdit.ii===-1)?svcEditRow(gi,-1,{name:"",ins:"비급여",min:30,price:0}):"";
    return `<div class="svc-sec">
      <div class="svc-sec-h"><b>${g.cat}</b><span class="mut">${g.items.length}</span><span style="flex:1"></span>
        <button class="btn xs" data-svcadd="${gi}">+ 진료 추가</button></div>
      <table class="tbl svc-tbl"><thead><tr><th>진료명</th><th>소요시간</th><th style="text-align:right">기본 수가</th><th>급여구분</th><th style="width:120px">관리</th></tr></thead>
      <tbody>${g.items.map((it,ii)=>{
        if(svcEdit&&svcEdit.gi===gi&&svcEdit.ii===ii) return svcEditRow(gi,ii,it);
        return `<tr>
          <td><b>${it.name}</b></td>
          <td>${it.min}분</td>
          <td style="text-align:right;font-variant-numeric:tabular-nums">${it.ins==="비급여"?(it.price?fmt(it.price)+"원":"—"):"—"}</td>
          <td><span class="pill ${it.ins.startsWith("급여")?"ok":it.ins==="상담"?"mut":"conf"}">${it.ins}</span></td>
          <td><button class="btn xs" data-svcedit="${gi}:${ii}">수정</button> <button class="btn xs ghost" data-svcdel="${gi}:${ii}">삭제</button></td></tr>`;
      }).join("")}${addRow}</tbody></table>
    </div>`;
  }).join("");
}
document.addEventListener("click",e=>{
  const cat=e.target.closest("[data-svccat]"), catdel=e.target.closest("[data-svccatdel]"),
        catadd=e.target.closest("#svCatAdd"), add=e.target.closest("[data-svcadd]"),
        edit=e.target.closest("[data-svcedit]"), del=e.target.closest("[data-svcdel]"),
        save=e.target.closest("[data-svcsave]"), cancel=e.target.closest("[data-svccancel]");
  if(catdel){ e.stopPropagation(); const gi=+catdel.dataset.svccatdel, g=DD.SERVICES[gi];
    if(g.items.length){ toast("진료가 있는 카테고리는 삭제할 수 없습니다 — 먼저 진료를 비우세요"); return; }
    if(svcCat===g.cat) svcCat="전체"; DD.SERVICES.splice(gi,1); svcEdit=null; renderServices(); toast(`${g.cat} 카테고리 삭제됨`); return; }
  if(cat){ svcCat=cat.dataset.svccat; svcEdit=null; renderServices(); return; }
  if(catadd){ let n=1; while(DD.SERVICES.some(g=>g.cat==="새 진료과 "+n))n++;
    const nm="새 진료과 "+n; DD.SERVICES.push({cat:nm,items:[]}); svcCat=nm; svcEdit=null; renderServices();
    toast(`${nm} 추가 — 진료를 등록하세요`); return; }
  if(add){ svcEdit={gi:+add.dataset.svcadd,ii:-1}; renderServices(); const f=$("#svcE_name"); if(f)f.focus(); return; }
  if(edit){ const [gi,ii]=edit.dataset.svcedit.split(":").map(Number); svcEdit={gi,ii}; renderServices(); return; }
  if(cancel){ svcEdit=null; renderServices(); return; }
  if(del){ const [gi,ii]=del.dataset.svcdel.split(":").map(Number);
    DD.SERVICES[gi].items.splice(ii,1); svcEdit=null; renderServices(); renderProcSelect(); toast("진료항목 삭제됨"); return; }
  if(save){ const [gi,ii]=save.dataset.svcsave.split(":").map(Number);
    const name=$("#svcE_name").value.trim(); if(!name){ toast("진료명을 입력하세요"); return; }
    const ins=$("#svcE_ins").value, min=+$("#svcE_min").value||30, price=ins==="비급여"?(+$("#svcE_price").value||0):null;
    const g=DD.SERVICES[gi];
    if(ii===-1){ if(g.items.some(x=>x.name===name)){ toast("이미 등록된 진료입니다"); return; }
      g.items.push({name,ins,min,price}); toast(`${g.cat} · ${name} 등록`); }
    else { Object.assign(g.items[ii],{name,ins,min,price}); toast(`${name} 수정됨`); }
    svcEdit=null; renderServices(); renderProcSelect(); return; }
});
/* 신규 환자 등록 → 차트 생성 (A안) */
$("#prSave").addEventListener("click",()=>{
  const name=$("#prName").value.trim(); if(!name){ toast("이름을 입력하세요"); return; }
  const id="P-"+(1300+DD.PATIENTS.length*7);
  const np={ id, name, birth:$("#prBirth").value.trim()||"1990-01-01", phone:$("#prPhone").value.trim()||"010-0000-0000",
    lastVisit:"2026-08-14", noshow12m:0,
    consent:{ privacy:true, sensitive:$("#prSensitive").checked, marketing:$("#prMarketing").checked, marketingAt:$("#prMarketing").checked?"2026-08-14":null },
    desk:[{ t:"2026-08-14 "+new Date().toTimeString().slice(0,5), who:DD.ROLES[state.role].label, txt:"신규 환자 등록 — 예약 접수 시 생성" }], emr:[] };
  DD.PATIENTS.push(np); renderPatients();
  $("#patRegModal").classList.remove("open"); $("#apptPanel").classList.remove("open");
  openPatient(id);
  toast(`${name} 환자 등록 완료 — 차트가 생성되어 열렸습니다`);
});
$("#bkSave").addEventListener("click",()=>{
  if(!pendingSlot) return;
  /* 동시성: 시뮬레이터가 켜져 있으면 낙관적 잠금 충돌 (R⑤) */
  if($("#conflictSim").checked){
    $("#bookModal").classList.remove("open");
    const alt=[pendingSlot.t+2,pendingSlot.t-2,pendingSlot.t+4].filter(t=>t>=0&&t<DD.SLOTS-1).map(slotTime);
    $("#confAlt").textContent=alt.join(" · ");
    $("#conflictModal").classList.add("open");
    return;
  }
  const isScaling = /스케일링/.test($("#bkProc").value);
  if(isScaling && state.axis!=="hyg"){ /* 위생사 미배정 경고 */
    toast("⚠ 스케일링은 위생사 배정이 필요합니다 — 배정 없이 저장하면 '의사·체어는 비었는데 붙을 스탭이 없는' 예약이 됩니다");
  }
  DD.APPTS.push({ id:"a"+(DD.APPTS.length+90), t:pendingSlot.t, len:2,
    chair:pendingSlot.key==="chair"?pendingSlot.id:"c1",
    doc:pendingSlot.key==="doc"?pendingSlot.id:"d1",
    hyg:pendingSlot.key==="hyg"?pendingSlot.id:null,
    st:"wait", p:$("#bkPatient").value||"신규 환자", proc:$("#bkProc").value||"상담" });
  $("#bookModal").classList.remove("open"); renderCal();
  toast("예약 등록 — 상태 '예약대기'. D-1 리마인드가 발송 큐에 자동 적재됩니다 (발송 탭)");
});

/* 예약 카드 클릭 → 우측 예약·고객 패널 (헤어사랑넷 reservationView 계승) */
const ST_NAME={wait:"예약대기",conf:"확정",done:"내원완료",noshow:"노쇼",cancel:"취소"};
function openPayReg2(a){ const p=DD.PATIENTS.find(x=>x.name===a.p);
  if(!p){ toast("미등록 환자 — 먼저 「+ 환자 등록」이 필요합니다"); return; }
  chartPid=p.id; openPayReg(); $("#pyItem").value=a.proc||"";
}
function openApptPanel(ref){
  const a = typeof ref==="string" ? DD.APPTS.find(x=>x.id===ref) : ref; if(!a) return;
  apPanelAppt=a;
  const timeStr = a.t!==undefined ? `${slotTime(a.t)}–${slotTime(a.t+a.len)}` : (a.time||"-");
  const dateRow = a.date ? `<div class="ai-row"><span>일자</span><b>${a.date}</b></div>` : "";
  $("#apName").textContent=`${a.p} · ${a.proc}`;
  $("#apStPill").innerHTML=`<span class="pill ${a.st}">${ST_NAME[a.st]}</span>`;
  /* 상태 체인: 예약대기 → 확정 → 내원 → 수납 (헤어사랑넷 0→5→1→99) */
  const flow=["wait","conf","done"], ci=flow.indexOf(a.st), abn=(a.st==="noshow"||a.st==="cancel");
  $("#apStatus").innerHTML=["예약대기","확정","내원","수납"].map((n,i)=>{
    let cls=""; if(!abn){ if(i<ci)cls="done"; else if(i===ci)cls="cur"; }
    return `<div class="ap-st ${cls}">${n}</div>`;
  }).join("");
  const chair=DD.CHAIRS.find(c=>c.id===a.chair), doc=a.doc?DD.DOCTORS.find(d=>d.id===a.doc):null, hyg=a.hyg?DD.HYGIENISTS.find(h=>h.id===a.hyg):null;
  $("#apInfo").innerHTML=`
    ${dateRow}
    <div class="ai-row"><span>시간</span><b>${timeStr}</b></div>
    <div class="ai-row"><span>체어·진료실</span><b>${chair?chair.name:"-"} · ${chair?DD.ROOMS.find(r=>r.id===chair.room).name:""}</b></div>
    <div class="ai-row"><span>담당의</span><b>${doc?doc.name:"—"}</b></div>
    <div class="ai-row"><span>위생사</span><b>${hyg?hyg.name:"—"}</b></div>
    <div class="ai-row"><span>진료 내용</span><b>${a.proc}</b></div>`;
  const p=DD.PATIENTS.find(x=>x.name===a.p), ar=DD.ARREARS.find(x=>x.p===a.p);
  $("#apCust").innerHTML = p ? `
    <div class="ap-member">
      <div class="pd-ava sm">${p.name[0]}</div>
      <div class="ap-mbody">
        <div class="ap-mname">${p.name} <small>${p.id}</small></div>
        <div class="ap-mmeta">${p.birth.slice(0,4)}년생 · ${mask(p.phone)}</div>
      </div>
    </div>
    <div class="ap-pills">
      ${p.noshow12m?`<span class="pill noshow">노쇼 ${p.noshow12m}회</span>`:'<span class="pill ok">노쇼 없음</span>'}
      ${ar?`<span class="pill dang">미수 ${fmt(ar.total-ar.paid)}원</span>`:'<span class="pill mut">미수 없음</span>'}
      <span class="pill ${p.consent.marketing?"ok":"mut"}">광고 ${p.consent.marketing?"동의":"미동의"}</span>
      ${p.noshow12m>=2?'<span class="pill warn">위약금 동의서 대상</span>':""}
      ${!p.consent.sensitive?'<span class="pill warn">민감정보 미동의</span>':""}
    </div>
    <div class="ai-row"><span>최근 내원</span><b>${p.lastVisit}</b></div>
    <div class="ai-row"><span>연락처</span><b>${mask(p.phone)}</b></div>`
    : `<div class="ap-nreg"><b>미등록 / 신규 환자</b><span>내원 시 「+ 환자 등록」으로 차트를 생성하세요. 상세 정보는 등록 후 「차트 열기」에서 확인합니다.</span></div>`;
  apPanelPid = p?p.id:null; renderApMemo(p);
  const acts=[];
  if(a.st==="wait") acts.push(`<button class="btn sm" data-apst="conf">예약 확정</button>`);
  if(a.st==="conf") acts.push(`<button class="btn sm" data-apst="done">내원 체크인</button>`);
  if(a.st==="done") acts.push(`<button class="btn sm pri" data-appay="1">수납 진행</button>`);
  if(!["noshow","cancel","done"].includes(a.st)) acts.push(`<button class="btn sm dang" data-apst="noshow">노쇼 처리</button>`);
  if(a.st!=="cancel") acts.push(`<button class="btn sm dang" data-apcancel="1">당일 취소→대기</button>`);
  acts.push(`<button class="btn sm" data-apre="1" style="grid-column:1/-1;color:var(--ink-sub)">↔ 시간·체어 변경은 캘린더에서 카드를 드래그하세요</button>`);
  const ae=$("#apActs"); ae.innerHTML=acts.join(""); ae.dataset.appt=a.id||"";
  $("#apSms").dataset.name=a.p;
  if(p){ $("#apChart").textContent="차트 열기"; $("#apChart").dataset.cpt=p.id; $("#apChart").dataset.reg=""; }
  else { $("#apChart").textContent="+ 환자 등록"; $("#apChart").dataset.cpt=""; $("#apChart").dataset.reg=a.p; }
  $("#apChart").disabled=false;
  $("#apptPanel").classList.add("open");
}
/* 당일 취소 → 대기 목록 점수 매칭 (R⑤) */
function cancelAndMatch(id){
  const a=DD.APPTS.find(x=>x.id===id); if(!a||a.st==="cancel") return;
  a.st="cancel"; renderCal();
  const scored = DD.WAITLIST.map(w=>{
    let s=0; if(w.want==="무관"||(w.want==="오후"&&a.t>=8)) s+=2;
    if(!w.doc||w.doc===a.doc) s+=2; if(w.noshow===0) s+=1;
    return {...w,score:s};
  }).sort((x,y)=>y.score-x.score);
  $("#wlBody").innerHTML = scored.map((w,i)=>`
    <tr><td><b>${w.p}</b></td><td>${w.proc}</td><td>${w.want}</td><td>${w.doc?((DD.DOCTORS.find(d=>d.id===w.doc)||{}).name||"무관"):"무관"}</td>
    <td>${w.noshow?`<span class="pill noshow">노쇼 ${w.noshow}</span>`:'<span class="pill ok">0</span>'}</td>
    <td><b style="color:var(--pri)">${w.score}점</b></td>
    <td><button class="btn sm pri" data-wl="${i}">배정+알림</button></td></tr>`).join("");
  $("#wlModal").classList.add("open");
}
/* 패널 액션 위임 */
document.addEventListener("click",e=>{
  const st=e.target.closest("[data-apst]");
  if(st){ const a=apPanelAppt; if(!a) return;
    a.st=st.dataset.apst;
    if(a.id) renderCal(); if(calMode==="month") renderMonth(); else if(calMode==="list") renderCalList();
    openApptPanel(a);
    toast({conf:"예약이 확정되었습니다",done:"내원 체크인 — 진료 대기에 추가되었습니다",noshow:"노쇼 처리 — 위약금 동의서 대상 여부를 확인하세요"}[st.dataset.apst]||""); return; }
  if(e.target.closest("[data-appay]")){ const a=apPanelAppt; if(!a) return; openPayReg2(a); return; }
  if(e.target.closest("[data-apcancel]")){ const a=apPanelAppt; if(!a) return;
    if(a.id){ $("#apptPanel").classList.remove("open"); cancelAndMatch(a.id); }
    else { a.st="cancel"; if(calMode==="month")renderMonth(); else if(calMode==="list")renderCalList(); openApptPanel(a); toast("예약이 취소되었습니다"); }
    return; }
  if(e.target.id==="apChart"){ const pt=$("#apChart").dataset.cpt, reg=$("#apChart").dataset.reg;
    if(pt){ $("#apptPanel").classList.remove("open"); openPatient(pt); }
    else if(reg){ $("#prName").value=reg; $("#prPhone").value=""; $("#prBirth").value="";
      $("#prSensitive").checked=false; $("#prMarketing").checked=false;
      $("#patRegModal").dataset.appt=$("#apActs").dataset.appt; $("#patRegModal").classList.add("open"); }
    return; }
});
document.addEventListener("click",e=>{
  const wl=e.target.closest("[data-wl]");
  if(wl){ $("#wlModal").classList.remove("open");
    toast("재배정 완료 — 예약 확정 알림톡이 발송 큐에 적재됐습니다 (빈 체어 40분을 살렸습니다)"); }
});

/* ══ ② 환자 ══ */
const mask = p => p.replace(/(\d{3})-(\d{4})/, "$1-****");
function renderPatients(){
  const canExport = DD.ROLES[state.role].export;
  $("#ptExport").disabled = canExport===false;
  $("#ptExport").title = canExport===false?"데스크 권한은 전체 다운로드가 차단됩니다(유출 경로)":"";
  $("#ptBody").innerHTML = DD.PATIENTS.map(p=>`
    <tr><td><input type="checkbox" data-ptsel="${p.name}"></td>
    <td>${p.id}</td><td><b>${p.name}</b> <button class="btn xs" data-ptsms="${p.name}" title="문자 보내기">✉</button></td><td>${p.birth.slice(0,4)}년생</td>
    <td><span class="mono masked" id="ph-${p.id}">${mask(p.phone)}</span> <button class="btn sm" data-reveal="${p.id}">표시</button></td>
    <td>${p.lastVisit}</td>
    <td>${p.noshow12m?`<span class="pill noshow">노쇼 ${p.noshow12m}회</span>`:'<span class="pill ok">양호</span>'}</td>
    <td>${p.consent.marketing?`<span class="pill ok">광고 동의</span>`:'<span class="pill mut">미동의</span>'}</td>
    <td><button class="btn sm" data-pt="${p.id}">상세</button></td></tr>`).join("");
  ptSelUpdate();
}
function ptSelUpdate(){ const n=document.querySelectorAll("[data-ptsel]:checked").length;
  if($("#ptSelN")) $("#ptSelN").textContent=n; }
document.addEventListener("click",e=>{
  const rv=e.target.closest("[data-reveal]");
  if(rv){ const p=DD.PATIENTS.find(x=>x.id===rv.dataset.reveal);
    const el=$("#ph-"+p.id); el.textContent=p.phone; el.classList.remove("masked"); state.maskLogs++;
    DD.LOGS.unshift({t:"2026-08-14 "+new Date().toTimeString().slice(0,5),who:state.role,act:"환자 연락처 표시",target:`${p.id} ${p.name[0]}**`,ip:"210.99.xx.xx",kind:"privacy"});
    renderLogs();
    toast(`원문 표시 — 이 클릭 자체가 열람 기록 1건으로 남았습니다 (누적 ${state.maskLogs}건, 설정·보안 탭)`); return; }
  const pt=e.target.closest("[data-pt]");
  if(pt){ openPatient(pt.dataset.pt); return; }
  if(e.target.id==="ptExport"){
    if(DD.ROLES[state.role].export==="사유 필수"){
      const r=prompt("다운로드 사유를 입력하세요 (열람 기록에 남습니다 · 1회 최대 50건)","보험 청구 대조");
      if(!r) return;
      DD.LOGS.unshift({t:"2026-08-14 "+new Date().toTimeString().slice(0,5),who:state.role,act:"환자 목록 다운로드(50건 제한)",target:"사유: "+r,ip:"210.99.xx.xx",kind:"privacy"}); renderLogs();
    }
    const bom="﻿", rows=[["ID","이름","출생연도","최근내원"],...DD.PATIENTS.map(p=>[p.id,p.name,p.birth.slice(0,4),p.lastVisit])];
    const blob=new Blob([bom+rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="dentdesk_patients_masked.csv"; a.click();
    toast("CSV 생성 — 연락처 컬럼은 정책상 제외됐습니다 (마스킹은 화면이 아니라 데이터 정책)");
  }
});
let chartPid=null, chartTab="info";
function ptAge(p){ const [by,bm,bd]=p.birth.split("-").map(Number); let a=2026-by; if(8<bm||(8===bm&&14<bd))a--; return a; }
function openPatient(id){
  const p=DD.PATIENTS.find(x=>x.id===id); if(!p) return;
  chartPid=id; chartTab="info";
  $("#pdAva").textContent=p.name[0];
  $("#pdName").textContent=`${p.name} · ${p.id}`;
  $("#pdPhone").textContent=mask(p.phone);
  $("#pdSms").dataset.name=p.name; $("#pdBook").dataset.name=p.name; $("#pdPay").dataset.name=p.name;
  $$("#pdTabs .ct").forEach(x=>x.classList.toggle("on",x.dataset.ct==="info"));
  renderChartTab("info");
  $("#patModal").classList.add("open");
}
function renderChartTab(tab){
  chartTab=tab;
  const p=DD.PATIENTS.find(x=>x.id===chartPid); if(!p) return;
  const pays=DD.PAYMENTS.filter(x=>x.p===p.name), appts=DD.SCHED.filter(x=>x.p===p.name),
        smss=DD.SMS_HISTORY.filter(x=>x.name===p.name), ar=DD.ARREARS.find(x=>x.p===p.name),
        total=pays.reduce((s,x)=>s+x.amount,0);
  let h="";
  if(tab==="info"){
    h=`<div class="chart-grid">
      <div class="info-box"><h4 class="ch-h">기본 정보</h4>
        <div class="ai-row"><span>차트번호</span><b>${p.id}</b></div>
        <div class="ai-row"><span>생년월일</span><b>${p.birth} (만 ${ptAge(p)}세)</b></div>
        <div class="ai-row"><span>연락처</span><b>${mask(p.phone)}</b></div>
        <div class="ai-row"><span>최근 내원</span><b>${p.lastVisit}</b></div>
        <div class="ai-row"><span>노쇼 횟수</span><b class="${p.noshow12m>=2?"warn":""}">${p.noshow12m}회 (12개월)</b></div>
        <div class="ai-row"><span>광고 수신</span><b>${p.consent.marketing?"동의":"미동의"}</b></div>
        <div class="ai-row"><span>민감정보</span><b>${p.consent.sensitive?"동의":"미동의"}</b></div></div>
      <div class="info-box"><h4 class="ch-h">매출 요약</h4>
        <div class="ai-row"><span>누적 매출</span><b style="color:var(--pri)">${fmt(total)}원</b></div>
        <div class="ai-row"><span>수납 건수</span><b>${pays.length}건</b></div>
        <div class="ai-row"><span>미수 잔액</span><b class="${ar?"dang":""}">${ar?fmt(ar.total-ar.paid)+"원":"없음"}</b></div></div></div>
      <h4 class="ch-h" style="margin-top:16px">최근 이용 이력</h4>
      ${appts.slice().sort((a,b)=>a.date<b.date?1:-1).slice(0,6).map(a=>`<div class="rec"><time>${a.date} ${a.time} · ${a.st==="done"?"내원완료":DD.STATUS[a.st]}</time>${a.proc} · ${staffOf(a)}</div>`).join("")||'<p class="ch-empty">이력 없음</p>'}`;
  }
  else if(tab==="sales"){
    h=`<h4 class="ch-h">진료·매출 내역</h4>
      <table class="tbl"><thead><tr><th>일시</th><th>항목</th><th>수단</th><th style="text-align:right">금액</th><th>현금영수증</th></tr></thead><tbody>
      ${pays.map(x=>`<tr><td>${x.t.slice(5)}</td><td>${x.item}</td><td>${x.method}</td><td style="text-align:right">${fmt(x.amount)}원</td><td>${x.cash10?(x.receipt?'<span class="pill ok">발행</span>':'<span class="pill dang">미발행</span>'):"—"}</td></tr>`).join("")||'<tr><td colspan="5" class="ch-empty">매출 내역 없음</td></tr>'}
      ${pays.length?`<tr class="tbl-total"><td colspan="3">합계 ${pays.length}건</td><td style="text-align:right">${fmt(total)}원</td><td></td></tr>`:""}</tbody></table>`;
  }
  else if(tab==="appt"){
    h=`<h4 class="ch-h">예약 목록</h4>
      <table class="tbl"><thead><tr><th>일자</th><th>시간</th><th>상태</th><th>진료</th><th>담당</th></tr></thead><tbody>
      ${appts.map(a=>`<tr><td>${a.date.slice(5)}</td><td>${a.time}</td><td><span class="pill ${a.st}">${DD.STATUS[a.st]}</span></td><td>${a.proc}</td><td>${staffOf(a)}</td></tr>`).join("")||'<tr><td colspan="5" class="ch-empty">예약 없음</td></tr>'}</tbody></table>`;
  }
  else if(tab==="sms"){
    h=`<h4 class="ch-h">문자 발송 내역</h4>
      ${smss.map(s=>`<div class="rec"><time>${s.t.slice(5)} · ${s.type} · ${s.st}</time>${s.body}</div>`).join("")||'<p class="ch-empty">발송 내역 없음</p>'}`;
  }
  else if(tab==="arrear"){
    h=ar?`<h4 class="ch-h">미수금 · 분납</h4>
      <div class="info-box"><div class="ai-row"><span>미수 잔액</span><b class="dang">${fmt(ar.total-ar.paid)}원</b></div>
      <div class="ai-row"><span>총 계약</span><b>${fmt(ar.total)}원</b></div><div class="ai-row"><span>소멸시효</span><b>${ar.expire}</b></div></div>
      <h4 class="ch-h" style="margin-top:14px">분납 계획</h4>
      ${ar.plan.map(pl=>`<div class="pkg-row"><b>${pl[0]}</b><span>${pl[1]}</span><span>${fmt(pl[2])}원</span><span class="pill ${pl[3]==="완납"?"ok":pl[3]==="연체"?"dang":"mut"}">${pl[3]}</span></div>`).join("")}`
      :'<p class="ch-empty">미수금 없음</p>';
  }
  else if(tab==="emr"){
    h=`<div class="b-head" style="margin-bottom:8px">진료 기록 <span class="pill mut">전자차트 연동 · 읽기 전용</span></div>
      ${p.consent.sensitive
        ?(p.emr.map(r=>`<div class="rec"><time>${r.t}</time>${r.txt}</div>`).join("")||'<p class="ch-empty">연동 기록 없음</p>')
        :'<p style="font-size:0.85rem;color:var(--warn)">민감정보(건강정보) 수집·이용 동의 미확보 — 진료기록 열람이 제한됩니다.</p>'}
      <p style="font-size:0.78rem;color:var(--ink-muted);margin-top:10px">본 시스템에서 작성·수정 불가 — 진료기록의 소유는 전자의무기록(의료법 23조) 영역입니다.</p>`;
  }
  else if(tab==="memo"){
    h=`<div class="b-head" style="margin-bottom:8px">데스크 응대 기록 <span class="pill ok">이 시스템 소유</span></div>
      <div id="pdDesk">${p.desk.map(r=>`<div class="rec"><time>${r.t} · ${r.who}</time>${r.txt}</div>`).join("")||'<p class="ch-empty">기록 없음</p>'}</div>
      <textarea class="inp" id="pdInput" rows="2" style="width:100%;margin-top:8px" placeholder="응대 내용 입력">다음 내원 시 크라운 색상 상담 예정 — 견적 55만원 안내함</textarea>
      <p id="pdWarn" hidden style="font-size:0.82rem;color:var(--danger);margin-top:6px">진료기록 성격의 문구입니다 — 의료법 22조상 의료인 서명이 필요한 기록은 전자차트에 작성하세요. 저장이 차단됩니다.</p>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="btn pri sm" id="pdSave">응대 기록 저장</button><button class="btn dang sm" id="pdDeact">환자 삭제(비활성)</button></div>`;
  }
  $("#pdTabBody").innerHTML=h; bindReveal();
}
/* 예약 패널 메모 — 바로 작성 · 차트 데스크 메모와 연동 */
let apPanelPid=null, apPanelAppt=null;
function renderApMemo(p){
  if(!$("#apMemo")) return;
  if(!p){ $("#apMemo").innerHTML='<p class="ap-nreg" style="margin:0"><b>미등록 환자</b><span>환자 등록 후 메모를 작성할 수 있습니다.</span></p>'; return; }
  $("#apMemo").innerHTML=`
    ${p.desk.length?p.desk.slice(0,3).map(r=>`<div class="rec"><time>${r.t} · ${r.who}</time>${r.txt}</div>`).join(""):'<p class="ch-empty" style="padding:2px 0 6px">메모 없음</p>'}
    <textarea class="inp" id="apMemoIn" rows="2" style="width:100%" placeholder="응대 메모 입력 후 저장"></textarea>
    <p id="apMemoWarn" hidden style="font-size:0.78rem;color:var(--danger);margin-top:5px">진료기록 성격의 문구입니다 — 의료법 22조상 의료인 서명 기록은 전자차트에 작성하세요. 저장이 차단됩니다.</p>
    <div style="margin-top:7px"><button class="btn sm pri" id="apMemoSave">메모 저장</button></div>`;
}
document.addEventListener("click",e=>{
  if(e.target.closest("#apMemoSave")){ const v=$("#apMemoIn").value.trim(); if(!v){ toast("메모를 입력하세요"); return; }
    if(DD.EMR_WORDS.some(w=>new RegExp(w,"i").test(v))){ toast("저장 차단 — 진료기록 성격의 문구입니다. 전자차트에 작성하세요"); return; }
    const p=DD.PATIENTS.find(x=>x.id===apPanelPid); if(!p) return;
    p.desk.unshift({t:"2026-08-15 "+new Date().toTimeString().slice(0,5), who:DD.ROLES[state.role].label, txt:v});
    renderApMemo(p);
    if(chartPid===p.id && chartTab==="memo") renderChartTab("memo");   /* 차트 데스크 메모와 연동 */
    toast("메모 저장 — 고객 차트의 데스크 메모와 연동됩니다"); return; }
});
document.addEventListener("input",e=>{ if(e.target.id==="apMemoIn"){ const v=e.target.value;
  const hit=DD.EMR_WORDS.find(w=>new RegExp(w,"i").test(v)); if($("#apMemoWarn"))$("#apMemoWarn").hidden=!hit; e.target.style.borderColor=hit?"var(--danger)":""; } });

/* 차트 탭 전환 · 편집 · 응대기록(델리게이션) */
document.addEventListener("click",e=>{
  const t=e.target.closest("#pdTabs .ct");
  if(t){ $$("#pdTabs .ct").forEach(x=>x.classList.toggle("on",x===t)); renderChartTab(t.dataset.ct); return; }
  if(e.target.closest("#pdSave")){ const v=$("#pdInput").value;
    if(DD.EMR_WORDS.some(w=>new RegExp(w,"i").test(v))){ toast("저장 차단 — 진료기록 성격의 문구입니다. 의료법 22조상 의료인 서명이 필요한 기록은 전자차트에 작성하세요"); return; }
    const p=DD.PATIENTS.find(x=>x.id===chartPid); if(p&&v.trim()){ p.desk.unshift({t:"2026-08-15 "+new Date().toTimeString().slice(0,5),who:DD.ROLES[state.role].label,txt:v.trim()}); }
    renderChartTab("memo"); toast("데스크 응대 기록 저장됨 (이 시스템 소유 영역)"); return; }
  if(e.target.closest("#pdDeact")){ toast("물리 삭제 없음 — '비활성 · 보존 만료 2036-08-14 (진료기록 10년)'로 전환되고 감사 로그에 남습니다"); return; }
  if(e.target.closest("#pdBook")){ openApptReg(); return; }
  if(e.target.closest("#pdPay")){ openPayReg(); return; }
  if(e.target.closest("#pdEdit")){ const p=DD.PATIENTS.find(x=>x.id===chartPid); if(!p)return;
    $("#peName").value=p.name; $("#pePhone").value=p.phone; $("#peBirth").value=p.birth;
    $("#peMkt").checked=p.consent.marketing; $("#peSens").checked=p.consent.sensitive;
    $("#patEditModal").classList.add("open"); return; }
  if(e.target.closest("#peSave")){ const p=DD.PATIENTS.find(x=>x.id===chartPid); if(!p)return;
    p.name=$("#peName").value.trim()||p.name; p.phone=$("#pePhone").value.trim()||p.phone; p.birth=$("#peBirth").value||p.birth;
    p.consent.marketing=$("#peMkt").checked; p.consent.sensitive=$("#peSens").checked;
    $("#patEditModal").classList.remove("open");
    $("#pdName").textContent=`${p.name} · ${p.id}`; $("#pdPhone").textContent=mask(p.phone); $("#pdAva").textContent=p.name[0];
    renderChartTab(chartTab); renderPatients(); toast("고객정보가 수정됐습니다"); return; }
});
document.addEventListener("input",e=>{ if(e.target.id==="pdInput"){ const v=e.target.value;
  const hit=DD.EMR_WORDS.find(w=>new RegExp(w,"i").test(v)); if($("#pdWarn"))$("#pdWarn").hidden=!hit; e.target.style.borderColor=hit?"var(--danger)":""; } });

/* ══ ③ 수납·미수 ══ */
function renderPayments(){
  const canEdit = DD.ROLES[state.role].payEdit;
  $("#payBody").innerHTML = DD.PAYMENTS.map((p,i)=>`
    <tr><td>${p.t.slice(5)}</td><td><b>${p.p}</b></td><td>${p.item}</td><td>${p.method}</td>
    <td style="text-align:right">${fmt(p.amount)}원</td>
    <td>${p.cash10?(p.receipt?'<span class="pill ok">현금영수증 발행</span>':'<span class="pill dang">미발행 — 가산세 20% 위험</span>'):'—'}</td>
    <td><button class="btn sm" data-payedit="${i}" ${canEdit?"":"disabled"} title="${canEdit?"":"수납 수정은 실장 이상 (현금 조작 방지)"}">수정</button></td></tr>`).join("")
    +`<tr class="tbl-total"><td colspan="4">합계 · ${DD.PAYMENTS.length}건</td><td style="text-align:right">${fmt(DD.PAYMENTS.reduce((s,p)=>s+p.amount,0))}원</td><td colspan="2"></td></tr>`;
  const miss=DD.PAYMENTS.filter(p=>p.cash10&&p.receipt===false);
  $("#recMiss").innerHTML = miss.length
    ? `현금 10만원 이상 · 영수증 미발행 <b>${miss.length}건</b> — 예상 가산세 <b style="color:var(--danger)">${fmt(miss.reduce((s,p)=>s+Math.round(p.amount*0.2),0))}원</b> (미발급 금액의 20%)`
    : "누락 없음";
  /* 미수 */
  const today=new Date("2026-08-14");
  $("#arBody").innerHTML = DD.ARREARS.map((a,i)=>{
    const d=Math.round((new Date(a.expire)-today)/86400000);
    const cls=d<=90?"dang":d<=365?"warn":"mut";
    return `<tr><td><b>${a.p}</b></td><td style="text-align:right">${fmt(a.total-a.paid)}원</td>
    <td>${a.plan.map(pl=>`<span class="pill ${pl[3]==="완납"?"ok":pl[3]==="연체"?"dang":"mut"}" title="${pl[1]}">${pl[0]} ${pl[3]}</span>`).join(" ")}</td>
    <td><span class="pill ${cls}">시효 D-${d}</span></td>
    <td><span class="pill mut">${DD.STAGES9[a.stage]}</span></td>
    <td><button class="btn sm" data-arnext="${i}" ${a.stage>=3?"disabled":""}>${a.stage<3?DD.STAGES9[a.stage+1]+" 진행":"완료"}</button>
        <button class="btn sm" data-ardoc="${i}">확인서</button></td></tr>`;
  }).join("")
    +`<tr class="tbl-total"><td>합계 · ${DD.ARREARS.length}명</td><td style="text-align:right">${fmt(DD.ARREARS.reduce((s,a)=>s+(a.total-a.paid),0))}원</td><td colspan="4"></td></tr>`;
}
document.addEventListener("click",e=>{
  if(e.target.closest("[data-payedit]")){ toast("수정 이력이 감사 로그에 남습니다 (수납 조작 방지 — 원본 금액·수정자·사유 보존)"); return; }
  const an=e.target.closest("[data-arnext]");
  if(an){ const a=DD.ARREARS[+an.dataset.arnext]; a.stage++;
    if(a.stage===1) toast("촉구 문자 발송 — 미수 안내는 계약 이행 관련 '정보성'이라 알림톡 발송 가능 (발송 탭 판정기 참고)");
    else toast(`${DD.STAGES9[a.stage]} 단계 — 발송·통보 이력이 증거로 자동 축적됩니다`);
    renderPayments(); return; }
  const ad=e.target.closest("[data-ardoc]");
  if(ad){ const a=DD.ARREARS[+ad.dataset.ardoc];
    const bom="﻿", txt=`진료비 확인서 (증거용)\n환자,${a.p}\n총 진료비,${a.total}\n기수납,${a.paid}\n미수 잔액,${a.total-a.paid}\n지급 기일,${a.due}\n소멸시효 만료,${a.expire}\n분납 계획\n`+a.plan.map(p=>p.join(",")).join("\n");
    const b=new Blob([bom+txt],{type:"text/csv"}); const l=document.createElement("a");
    l.href=URL.createObjectURL(b); l.download=`진료비확인서_${a.p}.csv`; l.click();
    toast("진료비 확인서 생성 — 시효 중단·지급명령의 사전 증거가 됩니다 (3년 시효)"); }
});
/* 위약금 계산기 (R⑩) */
$("#pnWhen") && $("#pnWhen").addEventListener("input",calcPenalty);
function calcPenalty(){
  const daysBefore=+$("#pnWhen").value, dep=300000;
  $("#pnWhenOut").textContent=daysBefore===0?"당일":`${daysBefore}일 전`;
  const refund = daysBefore>=3?dep : daysBefore>=1?Math.round(dep*0.5) : 0;
  $("#pnOut").innerHTML=`계약금 ${fmt(dep)}원 기준 — 환급 <b>${fmt(refund)}원</b> · 위약금 <b style="color:var(--danger)">${fmt(dep-refund)}원</b>
  <small style="display:block;color:var(--ink-muted);margin-top:3px">치협 회원고충처리위 기준(3일 전 전액 / 1~2일 전 50% / 당일·노쇼 0) · 사전 고지(동의서) 없으면 부과 불가</small>`;
}

/* ══ ④ 발송 콘솔 (R①⑥⑪⑫) ══ */
$$("#sendTabs .tab").forEach(b=>b.addEventListener("click",()=>{
  state.sendTab=b.dataset.st; $$("#sendTabs .tab").forEach(x=>x.classList.toggle("on",x===b));
  $("#remindPane").hidden=state.sendTab!=="remind";
  $("#recallPane").hidden=state.sendTab!=="recall";
}));
function judge(){
  const v=$("#msgIn").value;
  if($("#byteOut")){ const byte=[...v].reduce((s,c)=>s+(c.charCodeAt(0)>127?2:1),0), isLms=byte>90;
    $("#byteOut").textContent=`${byte} byte`;
    $("#typeOut").textContent=isLms?"LMS":"SMS";
    $("#msgCost").textContent=`건당 ${isLms?"30원 (LMS)":"9원 (SMS)"} · 알림톡 8원`; }
  const adHit=DD.AD_WORDS.filter(w=>v.includes(w));
  const banHit=DD.BAN_MEDICAL.filter(w=>v.includes(w));
  const isAd=adHit.length>0;
  $("#judgeBadge").className="verdict "+(isAd?"ad":"info");
  $("#judgeBadge").innerHTML=isAd
    ? `광고성 판정 — 알림톡 발송 불가(정보성 전용) · 근거어: ${adHit.slice(0,3).join(", ")}`
    : `정보성 판정 — 알림톡 발송 가능 (예약·수납·경과 등 거래 관계 메시지)`;
  $("#chAlim").classList.toggle("off",isAd);
  $("#chFriend").classList.toggle("off",!isAd);
  /* 미리보기 */
  let prev=v;
  banHit.forEach(w=>{ prev=prev.split(w).join(`<span class="lint" title="의료법 27조 3항 환자 유인 소지">${w}</span>`); });
  $("#msgPrev").innerHTML=(isAd?`<span class="adtag">(광고) </span>`:"")+prev
    +(isAd?`\n<span style="color:var(--ink-muted)">무료수신거부 080-000-0000</span>`:"");
  if($("#phoneBar")){ $("#phoneBar").classList.toggle("sms",isAd);
    $("#phoneChan").textContent=isAd?"문자 (광고)":"카카오 알림톡";
    $("#msgTime").textContent=isAd?"오후 5:00 · (광고)SMS":"오후 5:00 · 알림톡"; }
  $("#banWarn").hidden=banHit.length===0;
  if(banHit.length) $("#banWarn").innerHTML=`⚠ 의료법 27조 3항(환자 유인 — 3년 이하 징역) 소지 표현: <b>${banHit.join(", ")}</b> → "정기 구강 상태 확인이 가능한 시기입니다"처럼 사실 통지형으로 바꾸세요`;
  /* 대상자 차감 */
  const s=DD.SEND_STATS;
  $("#targetOut").innerHTML = isAd
    ? `대상 ${s.total}명 → 발송 가능 <b style="color:var(--danger)">${s.consented}명</b> (광고 수신동의 미확보 ${s.total-s.consented}명 자동 제외 · 동의 2년 재확인 대상 12명 별도)`
    : `대상 ${s.total}명 → 발송 가능 <b style="color:var(--ok)">${s.total}명</b> (정보성은 동의 불요)`;
  /* 야간 가드 */
  const hh=+($("#sendAt").value||"10:00").slice(0,2);
  const night=hh>=21||hh<8;
  $("#nightWarn").hidden=!(isAd&&night);
  if(isAd&&night) $("#nightWarn").innerHTML=`야간(21~08시) 광고 발송 금지 — <b>익일 08:00으로 자동 이월</b>됩니다 (야간 별도 동의자 ${s.nightConsent}명만 예외)`;
  return {isAd};
}
$("#msgIn").addEventListener("input",judge);
$("#sendAt").addEventListener("input",judge);
$("#sendBtn").addEventListener("click",()=>{
  const {isAd}=judge();
  const s=DD.SEND_STATS, n=isAd?s.consented:s.total;
  const alim=isAd?0:Math.round(n*0.86), sms=isAd?n:8;
  $("#queueOut").innerHTML=`발송 큐 적재 — 알림톡 ${alim}건 · 실패 폴백 SMS ${isAd?0:8}건 · ${isAd?`(광고) SMS ${sms}건`:""} · 수신거부 제외 3건<br>
  예상 비용 <b>${fmt(alim*8+ (isAd?sms:8)*9)}원</b> (알림톡 8원 · SMS 9원) ${isAd?'· <span style="color:var(--warn)">야간분은 08:00 이월</span>':""}`;
  toast("발송 큐에 적재됐습니다 — 템플릿 미승인 채널은 자동 제외됩니다");
});
$("#saveKeepBtn").addEventListener("click",()=>{
  const body=$("#msgIn").value.trim(); if(!body){ toast("저장할 문안이 없습니다"); return; }
  const name=(body.replace(/#\{[^}]+\}/g,"").replace(/\s+/g," ").trim().slice(0,16)||"보관 문안")+"…";
  DD.SMS_KEEP.unshift({ name, type:$("#chAlim").classList.contains("off")?"SMS":"알림톡", body });
  toast("문자 보관함에 저장됐습니다 — 「문자 보관함」 탭에서 재사용할 수 있습니다");
});
/* 리콜 규칙 빌더 (R⑥) */
function renderRecall(){
  const yearRule=$("#ruleYear").checked, m6=$("#rule6m").checked, imp65=$("#rule65").checked;
  let base=0;
  if(yearRule) base+=DD.RECALL_MONTHLY[0]?820:0;
  const total=(yearRule?820:0)+(m6?310:0)+(imp65?46:0);
  $("#recallCnt").innerHTML=`이번 분기 리콜 대상 <b style="font-size:1.2857rem">${fmt(total)}명</b>`;
  const arr=yearRule?DD.RECALL_MONTHLY:DD.RECALL_MONTHLY.map(v=>Math.round(v*0.25+80));
  const max=Math.max(...arr);
  $("#recallSpark").innerHTML=arr.map((v,i)=>`<i class="${yearRule&&i===0?"hot":""}" style="height:${Math.max(3,v/max*100)}%"><em>${i===0||v===max?fmt(v):""}</em></i>`).join("");
  $("#janWarn").hidden=!yearRule;
  if(yearRule) $("#janWarn").innerHTML=`<b>1월 폭증</b> — 스케일링 급여는 "마지막 시술+6개월"이 아니라 <b>매년 1월 1일 리셋·연 1회</b>입니다. 1월 1주 발송 예상 1,140건 = (광고) SMS 13,680원 + 응대 콜 ~60건 → <button class="btn sm" id="spread">주간 분산 발송으로 전환</button>`;
}
["ruleYear","rule6m","rule65"].forEach(id=>document.addEventListener("change",e=>{ if(e.target.id===id) renderRecall(); }));
document.addEventListener("click",e=>{ if(e.target.id==="spread") toast("1월 대상 1,140건 → 4주 × 285건으로 분산 — 데스크 응대량이 평탄해집니다"); });
/* 템플릿 */
function renderTemplates(){
  if(!$("#tplBody")) return;   /* 문자 보내기의 템플릿 카드는 알림톡 설정 탭으로 일원화됨 */
  $("#tplBody").innerHTML=DD.TEMPLATES.map(t=>`
    <tr><td><b>${t.name}</b></td><td><span class="mono">${t.vars}/40</span></td>
    <td>${t.status==="승인"?'<span class="pill ok">승인</span>':t.status==="반려"?`<span class="pill dang" title="${t.reject}">반려</span>`:'<span class="pill warn">검수중</span>'}</td>
    <td style="font-size:0.8214rem;color:var(--ink-sub);max-width:340px">${t.body}${t.reject?`<br><span style="color:var(--danger)">└ ${t.reject}</span>`:""}</td></tr>`).join("");
}

/* ══ ⑤ 통계 (R⑦⑩) ══ */
function renderStats(){
  const cut=+($("#cutSlider")?.value||0);
  const claim=Math.round(DD.REV.pendingClaim*(1-cut/100));
  const refund=Math.round(DD.REV.pendingClaim*(cut/100)*0.3);
  const vals=[DD.REV.occurred, DD.REV.collected, claim, DD.REV.arrears];
  const max=vals[0];
  const colors=["var(--ink)","var(--st-done)","var(--st-conf)","var(--st-noshow)"];
  const labs=["발생 매출(진료 기준)","수납 완료(실수령)","청구 대기(공단·삭감 반영)","미수"];
  $("#wf").innerHTML=vals.map((v,i)=>`<div class="wcol"><span class="wval">${(v/10000).toFixed(0)}만</span>
    <div class="wbar" style="background:${colors[i]};height:${Math.max(3,v/max*110)}px"></div>
    <span class="wlab">${labs[i]}</span></div>`).join("");
  $("#cutOut").textContent=cut+"%";
  $("#cutNote").innerHTML=cut>0?`삭감 ${cut}% 가정 — 공단 입금 예상 <b>${fmt(claim)}원</b> · 환자 환급 발생 <b>${fmt(refund)}원</b> (본인부담 정산)`:"삭감 0% 가정";
  /* 노쇼율 정의 토글 */
  const n=DD.NOSHOW;
  const defs={ strict:[n.noshow, n.attended+n.noshow, "노쇼 ÷ (내원+노쇼)"],
    all:[n.noshow, n.total, "노쇼 ÷ 전체 예약"],
    cancel:[n.noshow+n.sameDayCancel, n.total, "(노쇼+당일취소) ÷ 전체"] };
  const d=defs[state.noshowDef];
  $("#nsOut").innerHTML=`<b style="font-size:1.5714rem">${(d[0]/d[1]*100).toFixed(1)}%</b> <small style="color:var(--ink-muted)">${d[2]} = ${d[0]}÷${d[1]}</small>`;
  /* 노쇼 방지 시뮬 */
  const mode=$("#nsSim")?.value||"d1";
  const rate={none:1, d1:0.78, both:0.66}[mode]; /* 서울대치과병원 실측 22%↓ 기준 */
  const lost=Math.round(19*rate), chairMin=lost*40, revLost=lost*180000;
  $("#nsSimOut").innerHTML=`월 예상 노쇼 <b>${lost}건</b> → 체어 공실 ${fmt(chairMin)}분 · 손실 추정 <b style="color:var(--danger)">${fmt(revLost)}원</b>
  <small style="display:block;color:var(--ink-muted)">기준: 서울대치과병원 문자 시스템 2개월 실측 노쇼 22% 감소 (치의신보)</small>`;
}
document.addEventListener("input",e=>{
  if(e.target.id==="cutSlider") renderStats();
  if(e.target.id==="nsSim") renderStats();
});
$$("#nsDefTabs .tab").forEach(b=>b.addEventListener("click",()=>{
  state.noshowDef=b.dataset.def; $$("#nsDefTabs .tab").forEach(x=>x.classList.toggle("on",x===b)); renderStats();
  toast("정의를 안 정하고 만들면 반드시 분쟁이 납니다 — 계약 단계에서 확정할 항목");
}));

/* ══ ⑥ 설정·보안 (R②③④⑪⑫) ══ */
$$("#ssotTabs .tab").forEach(b=>b.addEventListener("click",()=>{
  state.ssot=b.dataset.ssot; $$("#ssotTabs .tab").forEach(x=>x.classList.toggle("on",x===b));
  const chip=$("#ssotChip");
  if(state.ssot==="crm"){ chip.textContent="예약 주인: 이 CRM"; chip.className="tchip";
    $("#ssotNote").innerHTML="이 CRM이 단일 진실 공급원 — 캘린더 편집 가능, 전자차트로 <b>내보내기 CSV</b>를 생성합니다."; }
  else if(state.ssot==="emr"){ chip.textContent="예약 주인: 전자차트 (읽기 전용)"; chip.className="tchip ro";
    $("#ssotNote").innerHTML="가장 현실적인 안 — 기존 전자차트(두번에·덴트웹 등)가 예약의 주인이고, 이 CRM은 <b>알림·리콜·미수·통계 레이어</b>만 담당합니다. 캘린더가 실제로 읽기 전용이 됐습니다(예약 탭 확인)."; }
  else { chip.textContent="양방향 동기화 (충돌 규칙 필요)"; chip.className="tchip ro";
    $("#ssotNote").innerHTML="양쪽 수정 허용 — 같은 예약이 양쪽에서 바뀌면 <b>충돌 해결 규칙</b>(최신 우선/전자차트 우선/수동 큐)이 필요합니다. 구현·검증 공수가 가장 큽니다."; }
  renderCal();
  toast("SSOT 변경 — 착수 미팅 1순위 질문: 기존 프로그램이 무엇이고 예약을 그쪽에도 입력하는가");
}));
function calcDual(){
  const n=+$("#duN").value, sec=+$("#duSec").value, wage=+$("#duWage").value;
  $("#duNOut").textContent=n+"건"; $("#duSecOut").textContent=sec+"초"; $("#duWageOut").textContent=fmt(wage)+"원";
  const hours=Math.round(n*sec*300/3600), cost=Math.round(hours*wage);
  $("#duOut").innerHTML=`연간 재입력 <b>${fmt(hours)}시간</b> ≈ <b style="color:var(--danger)">${fmt(cost)}원</b> (연 300일 기준) — 이중 입력은 2주 뒤 한쪽이 누락되며 무너집니다`;
}
["duN","duSec","duWage"].forEach(id=>document.addEventListener("input",e=>{ if(e.target.id===id) calcDual(); }));
/* EMR 등급 스위처 (R②) */
$("#emrSw").addEventListener("change",()=>{
  state.emrMode=$("#emrSw").checked;
  $("#emrReq").hidden=!state.emrMode;
  $("#emrEst").innerHTML=state.emrMode
    ? `견적 재계산 — 기본 60일 + <b>전자서명·이력관리·클라우드 강화 기준(실시간 점검·예비장비·CCTV) 대응 약 25일↑</b>, EMR 인증 검토 별도. <b style="color:var(--danger)">이 범위는 본 공고 예산을 넘습니다</b> — 권장: 상담 CRM 모드 + 기존 전자차트 유지`
    : `상담 CRM 모드 — 진료기록은 기존 전자차트에 남기고, 이 시스템은 데스크 응대 기록만 소유합니다 (기본 견적 범위)`;
  toast(state.emrMode?"EMR 포함 모드 — 의료법 23조 요건이 화면에 늘어났습니다":"상담 CRM 모드 — 기록 경계선 안에서 운영합니다");
});
/* 열람 이력 (R④) */
let logFilter="all";
function renderLogs(){
  const canSee=DD.ROLES[state.role].logs;
  $("#logLock").hidden=!!canSee;
  $("#logTblWrap").style.display=canSee?"":"none";
  if(!canSee) return;
  const list=DD.LOGS.filter(l=>logFilter==="all"||l.kind===logFilter);
  $("#logBody").innerHTML=list.map(l=>{
    const d=new Date(l.t.slice(0,10)); d.setDate(d.getDate()+730);
    const dd=Math.round((d-new Date("2026-08-14"))/86400000);
    return `<tr ${l.anomaly?'style="background:var(--danger-bg)"':""}><td>${l.t}</td><td>${l.who}</td>
    <td>${l.kind==="privacy"?`<b style="color:var(--warn)">${l.act}</b>`:l.act}${l.anomaly?`<br><span class="pill dang">${l.anomaly}</span>`:""}</td>
    <td>${l.target}</td><td class="mono">${l.ip}</td><td><span class="pill mut">D-${dd}</span></td>
    <td><button class="btn sm" data-logdel>삭제</button></td></tr>`;
  }).join("");
}
document.addEventListener("click",e=>{
  const lf=e.target.closest("[data-logf]");
  if(lf){ logFilter=lf.dataset.logf; $$("[data-logf]").forEach(x=>x.classList.toggle("on",x===lf)); renderLogs(); return; }
  if(e.target.closest("[data-logdel]")){ toast("삭제 차단 — 민감정보 처리 시스템의 접속기록은 2년 보존 의무입니다 (안전성 확보조치 기준)"); return; }
  if(e.target.id==="breachCalc"){
    const n=+$("#brN").value||1, sens=$("#brSens").checked;
    const must=n>=1000||sens;
    $("#brOut").innerHTML=must
      ? `<b style="color:var(--danger)">신고 의무 발생</b> — ${sens?"민감정보 포함(건수 무관)":"1,000명 이상"} → <b>72시간 내</b> 개인정보위/KISA 신고 + 정보주체 통지. 남은 시간 카운트다운 71:59:32 · 과징금 상한: 전체 매출액 3%`
      : `신고 의무 없음(1,000명 미만·민감정보 미포함) — 단 내부 기록·재발 방지는 필요`;
  }
});
/* 이관 마법사 (R⑫) */
$("#importRun").addEventListener("click",()=>{
  $("#importOut").innerHTML=`업로드 3,214행 → 매핑 완료(이름·연락처·생년월일·최근내원) · <b style="color:var(--ok)">3,180건 정상</b> ·
  중복 후보 <b>21건</b>(동명+연락처 일치 → 병합 대기) · 오류 <b style="color:var(--danger)">13건</b>(생년월일 형식) — 오류 리포트 CSV 생성됨`;
  toast("이관은 별도 공수입니다 — 기존 프로그램의 내보내기 형식 확인이 착수 1주차 작업");
});

/* ══ 서브탭 전환 (탭별 부수 기능) ══ */
document.addEventListener("click",e=>{
  const sb=e.target.closest(".subnav button"); if(!sb) return;
  const sub=sb.dataset.sub, nav=sb.closest(".subnav"), view=sb.closest(".view");
  nav.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===sb));
  view.querySelectorAll(".subpane").forEach(p=>p.classList.toggle("on",p.id==="sp-"+sub));
  ({ "pt-dup":renderDup, "pt-del":renderInactive, "pay-sales":renderSales,
     "pay-purchase":renderPurchase, "pay-stock":renderInventory, "stats-proc":renderStatProc,
     "stats-sales":renderSalesAnalysis, "stats-pt":renderPatientAnalysis, "stats-tree":renderStatTree,
     "send-history":renderSmsHistory, "send-scheduled":renderSmsScheduled, "send-keep":renderSmsKeep,
     "send-auto":renderSmsAuto, "send-kakao":renderKakao, "send-number":renderSenders,
     "send-charge":renderCharge, "send-deny":renderDeny, "set-hours":renderHours }[sub]||(()=>{}))();
  bindReveal();
});
/* ── 물품 재고 ── */
let invFilter="all", invEdit=null;
function monToExp(exp){ if(exp==="-"||!exp)return 999; const [y,m]=exp.split("-").map(Number); return (y-2026)*12+(m-8); }
const IV_CATS=["임플란트","수복재료","약제","근관재료","소모품","예방재료"];
function renderInventory(){
  const rows=DD.INVENTORY.filter(v=>{
    if(invFilter==="low") return v.stock<v.safety;
    if(invFilter==="exp") return v.exp!=="-" && monToExp(v.exp)<=6;
    return true;
  });
  $("#invBody").innerHTML=rows.map(v=>{
    const gi=DD.INVENTORY.indexOf(v);
    if(invEdit===gi) return `<tr class="svc-editrow">
      <td><input class="inp" id="ivE_name" value="${v.name}" style="width:100%"></td>
      <td><select class="inp" id="ivE_cat">${IV_CATS.map(o=>`<option ${o===v.cat?"selected":""}>${o}</option>`).join("")}</select></td>
      <td>${v.stock}<input class="inp" id="ivE_unit" value="${v.unit}" style="width:56px;margin-left:4px"></td>
      <td><input class="inp" id="ivE_safety" type="number" value="${v.safety}" style="width:66px"></td>
      <td><input class="inp" id="ivE_exp" value="${v.exp}" style="width:96px"></td>
      <td><input class="inp" id="ivE_uses" value="${v.uses.join(', ')}" style="width:100%"></td>
      <td style="white-space:nowrap"><button class="btn xs pri" data-ivsave="${gi}">저장</button> <button class="btn xs ghost" data-ivcancel="1">취소</button></td></tr>`;
    const low=v.stock<v.safety, expSoon=v.exp!=="-"&&monToExp(v.exp)<=6;
    return `<tr>
      <td><b>${v.name}</b></td><td><span class="pill mut">${v.cat}</span></td>
      <td><b style="color:${low?"var(--num-minus)":"var(--ink)"}">${v.stock}${v.unit}</b></td>
      <td>${v.safety}${v.unit} ${low?'<span class="pill dang">발주</span>':''}</td>
      <td>${v.exp}${expSoon?' <span class="pill warn">임박</span>':''}</td>
      <td style="font-size:0.7857rem;color:var(--ink-sub)">${v.uses.join(", ")||"—"}</td>
      <td style="white-space:nowrap"><button class="btn sm" data-invin="${gi}">입고</button> <button class="btn sm" data-invuse="${gi}">사용</button> <button class="btn sm" data-ivedit="${gi}">수정</button> <button class="btn sm ghost" data-ivdel="${gi}">삭제</button></td>
    </tr>`;
  }).join("")||'<tr><td colspan="7" style="text-align:center;color:var(--ink-muted);padding:16px">해당 품목 없음</td></tr>';
  const low=DD.INVENTORY.filter(v=>v.stock<v.safety), exp=DD.INVENTORY.filter(v=>v.exp!=="-"&&monToExp(v.exp)<=6);
  $("#invSum").innerHTML=`전체 <b>${DD.INVENTORY.length}종</b> · 발주 필요 <b style="color:var(--num-minus)">${low.length}종</b>${low.length?" ("+low.map(v=>v.name).join(", ")+")":""} · 유효기간 임박 <b style="color:var(--warn)">${exp.length}종</b>`;
}
document.addEventListener("click",e=>{
  const inv=e.target.closest("[data-invin]"), use=e.target.closest("[data-invuse]"), f=e.target.closest("#invFilter [data-invf]"),
        add=e.target.closest("#ivAdd"), ed=e.target.closest("[data-ivedit]"), del=e.target.closest("[data-ivdel]"),
        sv=e.target.closest("[data-ivsave]"), cn=e.target.closest("[data-ivcancel]");
  if(inv){ DD.INVENTORY[+inv.dataset.invin].stock+=10; renderInventory(); toast("입고 +10 — 재고가 갱신됐습니다"); }
  else if(use){ const v=DD.INVENTORY[+use.dataset.invuse]; if(v.stock>0)v.stock--; renderInventory();
    toast(v.stock<v.safety?`${v.name} 사용 −1 — 안전재고 미만, 발주가 필요합니다`:`${v.name} 사용 −1 처리`); }
  else if(f){ invFilter=f.dataset.invf; $$("#invFilter .tab").forEach(x=>x.classList.toggle("on",x===f)); renderInventory(); }
  else if(add){ const name=$("#ivName").value.trim(); if(!name){ toast("품목명을 입력하세요"); return; }
    if(DD.INVENTORY.some(v=>v.name===name)){ toast("이미 등록된 품목입니다"); return; }
    DD.INVENTORY.push({ id:"IV-"+String(DD.INVENTORY.length+1).padStart(2,"0"), name, cat:$("#ivCat").value, unit:$("#ivUnit").value||"개",
      stock:0, safety:+$("#ivSafety").value||5, exp:$("#ivExp").value||"-", supplier:"", perUse:0,
      uses:$("#ivUses").value.split(",").map(s=>s.trim()).filter(Boolean) });
    $("#ivName").value=""; $("#ivUses").value=""; renderInventory(); toast(`${name} 등록 — 입고로 재고를 채우세요`); }
  else if(ed){ invEdit=+ed.dataset.ivedit; renderInventory(); return; }
  else if(cn){ invEdit=null; renderInventory(); return; }
  else if(del){ const v=DD.INVENTORY[+del.dataset.ivdel]; DD.INVENTORY.splice(+del.dataset.ivdel,1); invEdit=null; renderInventory(); toast(`${v.name} 삭제됨`); return; }
  else if(sv){ const v=DD.INVENTORY[+sv.dataset.ivsave];
    Object.assign(v,{ name:$("#ivE_name").value.trim()||v.name, cat:$("#ivE_cat").value, unit:$("#ivE_unit").value||v.unit,
      safety:+$("#ivE_safety").value||v.safety, exp:$("#ivE_exp").value||"-", uses:$("#ivE_uses").value.split(",").map(s=>s.trim()).filter(Boolean) });
    invEdit=null; renderInventory(); toast(`${v.name} 수정됨`); return; }
});
/* 진료시간·휴무 설정 */
function renderHours(){
  $("#hoursBody").innerHTML=DD.HOURS.map((h,i)=>`<tr>
    <td><b>${h.day}요일</b></td>
    <td><span class="sw"><input type="checkbox" data-hropen="${i}" ${h.open?"checked":""}><i></i></span></td>
    ${h.open?`<td><input class="inp" type="time" value="${h.s}" data-hrs="${i}" style="width:118px"></td>
      <td><input class="inp" type="time" value="${h.e}" data-hre="${i}" style="width:118px"></td>
      <td><input class="inp" value="${h.brk||""}" placeholder="예: 13:00~14:00" data-hrb="${i}" style="width:132px"></td>
      <td>${h.note?`<span class="pill conf">${h.note}</span>`:'<span style="color:var(--ink-muted)">—</span>'}</td>`
    :`<td colspan="4"><span class="pill mut">휴진</span></td>`}</tr>`).join("");
  $("#holBody").innerHTML=`<div class="info-box">
    <div class="ai-row"><span>정기 휴무</span><b>${DD.HOLIDAYS.regular}</b></div>
    <div class="ai-row" style="align-items:flex-start"><span>공휴일 휴진</span><b style="text-align:right;max-width:74%;font-weight:600;line-height:1.6">${DD.HOLIDAYS.days.join(" · ")}</b></div></div>`;
}
document.addEventListener("change",e=>{
  const t=e.target.closest("[data-hropen]"), s=e.target.closest("[data-hrs]"), en=e.target.closest("[data-hre]"), b=e.target.closest("[data-hrb]");
  if(t){ DD.HOURS[+t.dataset.hropen].open=t.checked; renderHours(); toast(`${DD.HOURS[+t.dataset.hropen].day}요일 ${t.checked?"진료":"휴진"}으로 변경`); }
  else if(s){ DD.HOURS[+s.dataset.hrs].s=s.value; }
  else if(en){ DD.HOURS[+en.dataset.hre].e=en.value; }
  else if(b){ DD.HOURS[+b.dataset.hrb].brk=b.value; }
});
/* ── 매출 분석 ── */
let salPeriod="day";
function renderSalesAnalysis(){
  const data={ day:[[820,1240,980,1510,1866,340,0],["월","화","수","목","금","토","오늘"]],
    week:[[9800,11200,10400,12660],["1주","2주","3주","4주"]],
    month:[[42000,38500,45200,51000,48600,53400],["3월","4월","5월","6월","7월","8월"]] }[salPeriod];
  const max=Math.max(...data[0]);
  $("#salPeriodBars").innerHTML=data[0].map((v,i)=>`<i class="${v===max?"hot":""}" style="height:${Math.max(3,v/max*100)}%"><em>${v?(salPeriod==="day"?v+"만":Math.round(v/100)/10+"천만"):""}</em></i>`).join("");
  $("#salPeriodLab").innerHTML=data[1].map(l=>`<span>${l}</span>`).join("");
  const dept=[["보철·임플란트",9650000],["보존(신경·레진)",2400000],["예방·급여",603000],["교정",1800000],["구강외과",480000]];
  const dmax=Math.max(...dept.map(x=>x[1]));
  $("#salByDept").innerHTML=dept.map(r=>`<div class="bar-h"><span class="bl">${r[0]}</span><div class="bt"><i style="width:${r[1]/dmax*100}%"></i></div><span class="bv">${Math.round(r[1]/10000)}만</span></div>`).join("");
  const doc=[["김이현 원장",8200000],["박서준 원장",6730000]];
  const domax=Math.max(...doc.map(x=>x[1]));
  $("#salByDoc").innerHTML=doc.map(r=>`<div class="bar-h"><span class="bl">${r[0]}</span><div class="bt"><i style="width:${r[1]/domax*100}%"></i></div><span class="bv">${Math.round(r[1]/10000)}만</span></div>`).join("");
}
document.addEventListener("click",e=>{
  const p=e.target.closest("#salPeriod [data-sp]");
  if(p){ salPeriod=p.dataset.sp; $$("#salPeriod .tab").forEach(x=>x.classList.toggle("on",x===p)); renderSalesAnalysis(); }
});
/* ── 환자 분석 ── */
function renderPatientAnalysis(){
  const nw=18, rt=142, tot=nw+rt;
  $("#ptNewReturn").innerHTML=`
    <div style="display:flex;height:26px;border-radius:6px;overflow:hidden;margin-bottom:8px">
      <div style="width:${nw/tot*100}%;background:var(--pri);color:#fff;font-size:0.75rem;display:flex;align-items:center;justify-content:center;font-weight:700">신환 ${nw}</div>
      <div style="width:${rt/tot*100}%;background:var(--ok);color:#fff;font-size:0.75rem;display:flex;align-items:center;justify-content:center;font-weight:700">재진 ${rt}</div>
    </div>
    <div style="font-size:0.8214rem;color:var(--ink-sub)">이번 달 내원 ${tot}명 · 신환 비율 <b>${Math.round(nw/tot*100)}%</b> (전월 15%)</div>`;
  const age=[["10대",8],["20대",22],["30대",38],["40대",34],["50대",26],["60대+",32]];
  const amax=Math.max(...age.map(x=>x[1]));
  $("#ptAge").innerHTML=age.map(r=>`<div class="bar-h"><span class="bl">${r[0]}</span><div class="bt"><i style="width:${r[1]/amax*100}%"></i></div><span class="bv">${r[1]}명</span></div>`).join("");
  $("#ptRevisit").innerHTML=`6개월 내 재방문율 <b>68%</b> · 리콜 발송군이 미발송군보다 재방문 22%p 높음`;
}
/* ── 진료 리소스 관리 (체어·의사·위생사) ── */
const RES_PALETTE=["#357cd2","#1aaa55","#7fa900","#df5286","#915CE0","#0FB3A3","#A0A540","#e08a3c","#c0576b"];
let resTab="chair";
function renderResources(){
  const b=$("#resBody");
  if(resTab==="chair"){
    b.innerHTML=`
      ${DD.ROOMS.map(r=>`
        <div style="margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px;font-size:0.8571rem;font-weight:800;margin-bottom:6px">
            ${r.name} <span style="color:var(--ink-muted);font-weight:600">체어 ${r.chairs.length}</span>
            <button class="btn sm" data-roomdel="${r.id}" style="margin-left:auto">진료실 삭제</button></div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${r.chairs.map(cid=>{ const c=DD.CHAIRS.find(x=>x.id===cid); return `<span class="pill" style="background:${c.color}22;color:${c.color};gap:6px">${c.name} <b data-chairdel="${c.id}" style="cursor:pointer;color:var(--ink-muted)">×</b></span>`; }).join("")}
            <button class="btn sm" data-chairadd="${r.id}">+ 체어</button>
          </div>
        </div>`).join("")}
      <div style="display:flex;gap:8px;align-items:end;margin-top:10px;padding-top:10px;border-top:1px dashed var(--line)">
        <label class="field">진료실 추가 <input class="inp" id="roomNew" placeholder="예: 진료실 3" style="width:150px"></label>
        <button class="btn pri" id="roomAdd">추가</button>
      </div>`;
  } else {
    const list = resTab==="doc"?DD.DOCTORS:DD.HYGIENISTS, label=resTab==="doc"?"담당의":"위생사";
    b.innerHTML=`
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">
        ${list.map(m=>`<span class="pill" style="background:${m.color}22;color:${m.color};gap:6px">${m.name} <b data-resdel="${resTab}:${m.id}" style="cursor:pointer;color:var(--ink-muted)">×</b></span>`).join("")||'<span style="color:var(--ink-muted);font-size:0.8214rem">등록 없음</span>'}
      </div>
      <div style="display:flex;gap:8px;align-items:end;padding-top:10px;border-top:1px dashed var(--line)">
        <label class="field">${label} 추가 <input class="inp" id="resNew" placeholder="이름" style="width:150px"></label>
        <button class="btn pri" id="resAdd">추가</button>
      </div>`;
  }
}
document.addEventListener("click",e=>{
  const rt=e.target.closest("#resTabs [data-res]");
  if(rt){ resTab=rt.dataset.res; $$("#resTabs .tab").forEach(x=>x.classList.toggle("on",x===rt)); renderResources(); return; }
  if(e.target.id==="roomAdd"){ const v=$("#roomNew").value.trim(); if(!v){toast("진료실명을 입력하세요");return;}
    DD.ROOMS.push({id:"r"+(DD.ROOMS.length+1+Math.floor(state.maskLogs)),name:v,chairs:[]}); renderResources(); toast(`${v} 추가`); return; }
  const ca=e.target.closest("[data-chairadd]");
  if(ca){ const rid=ca.dataset.chairadd, r=DD.ROOMS.find(x=>x.id===rid);
    const cid="c"+(DD.CHAIRS.length+1)+"_"+DD.CHAIRS.length;
    DD.CHAIRS.push({id:cid,name:"체어 "+(DD.CHAIRS.length+1),room:rid,color:RES_PALETTE[DD.CHAIRS.length%RES_PALETTE.length]});
    r.chairs.push(cid); renderResources(); renderCal(); toast("체어 추가 — 캘린더에 반영됐습니다"); return; }
  const cd=e.target.closest("[data-chairdel]");
  if(cd){ const cid=cd.dataset.chairdel;
    if(DD.APPTS.some(a=>a.chair===cid&&a.st!=="cancel")){ toast("삭제 불가 — 이 체어에 예약이 있습니다"); return; }
    DD.CHAIRS=DD.CHAIRS.filter(c=>c.id!==cid); DD.ROOMS.forEach(r=>r.chairs=r.chairs.filter(x=>x!==cid));
    renderResources(); renderCal(); toast("체어 삭제됨"); return; }
  const rd=e.target.closest("[data-roomdel]");
  if(rd){ const rid=rd.dataset.roomdel, r=DD.ROOMS.find(x=>x.id===rid);
    if(r.chairs.length){ toast("삭제 불가 — 체어를 먼저 비우세요"); return; }
    DD.ROOMS=DD.ROOMS.filter(x=>x.id!==rid); renderResources(); toast("진료실 삭제됨"); return; }
  if(e.target.id==="resAdd"){ const v=$("#resNew").value.trim(); if(!v){toast("이름을 입력하세요");return;}
    const list=resTab==="doc"?DD.DOCTORS:DD.HYGIENISTS, pre=resTab==="doc"?"d":"h";
    list.push({id:pre+(list.length+1)+"_"+list.length,name:v,color:RES_PALETTE[(list.length+3)%RES_PALETTE.length]});
    renderResources(); toast(`${v} 추가 — 캘린더 축·예약 배정에 반영됩니다`); return; }
  const rmd=e.target.closest("[data-resdel]");
  if(rmd){ const [t,id]=rmd.dataset.resdel.split(":");
    const key=t==="doc"?"doc":"hyg";
    if(DD.APPTS.some(a=>a[key]===id&&a.st!=="cancel")){ toast("삭제 불가 — 배정된 예약이 있습니다"); return; }
    if(t==="doc") DD.DOCTORS=DD.DOCTORS.filter(m=>m.id!==id); else DD.HYGIENISTS=DD.HYGIENISTS.filter(m=>m.id!==id);
    renderResources(); toast("삭제됨"); return; }
});
/* 중복 고객 관리 */
function renderDup(){
  $("#dupList").innerHTML = DD.DUP_CANDIDATES.map((d,di)=>{
    const mergeable = d.reason.includes("일치") && !d.reason.includes("금지");
    return `<div style="border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <b style="font-size:0.9286rem">${d.records[0].name}</b>
        <span class="pill ${mergeable?"warn":"mut"}">${d.reason}</span></div>
      <table class="tbl"><thead><tr><th>차트번호</th><th>연락처</th><th>생년월일</th><th>최근 내원</th><th>내원수</th></tr></thead><tbody>
      ${d.records.map(r=>`<tr><td>${r.id}</td><td class="mono">${mask(r.phone)}</td><td>${r.birth}</td><td>${r.lastVisit}</td><td>${r.visits}회</td></tr>`).join("")}
      </tbody></table>
      <div style="margin-top:8px;text-align:right">
        ${mergeable
          ? `<button class="btn sm pri" data-merge="${di}">한 차트로 병합 (${d.records[1].id}→${d.records[0].id})</button>`
          : `<span style="font-size:0.8214rem;color:var(--ink-muted)">전화·생년월일이 달라 동일인이 아닙니다 — 병합하지 않습니다</span>`}
      </div></div>`;
  }).join("")||'<p style="font-size:0.8571rem;color:var(--ink-muted)">중복 후보가 없습니다</p>';
}
document.addEventListener("click",e=>{
  const m=e.target.closest("[data-merge]");
  if(m){ const d=DD.DUP_CANDIDATES[+m.dataset.merge];
    const keep=d.records[0], gone=d.records[1];
    DD.INACTIVE.unshift({ id:gone.id, name:gone.name, reason:`중복 병합(→ ${keep.id})`, inactiveAt:"2026-08-14", keepUntil:"병합 보존", note:"병합 이력 보존, 되돌리기 가능" });
    DD.DUP_CANDIDATES.splice(+m.dataset.merge,1); renderDup();
    toast(`${keep.name} — ${gone.id}를 ${keep.id}로 병합했습니다 (내원 이력 합산, 되돌리기 가능)`);
  }
});
/* 삭제·비활성 고객 */
function renderInactive(){
  $("#inactiveBody").innerHTML = DD.INACTIVE.map((p,i)=>`
    <tr><td>${p.id}</td><td><b>${p.name}</b></td><td>${p.reason}</td><td>${p.inactiveAt}</td>
    <td><span class="pill ${p.keepUntil.includes("보존")?"mut":"warn"}">${p.keepUntil}</span></td>
    <td><button class="btn sm" data-reactivate="${i}">복구</button></td></tr>`).join("")
    ||'<p style="font-size:0.8571rem;color:var(--ink-muted)">비활성 고객이 없습니다</p>';
}
document.addEventListener("click",e=>{
  const r=e.target.closest("[data-reactivate]");
  if(r){ const p=DD.INACTIVE[+r.dataset.reactivate];
    if(p.keepUntil!=="병합 보존"){ toast("복구 — 비활성 해제. 물리 삭제된 적이 없어 데이터는 그대로 남아 있습니다"); }
    else toast("병합 되돌리기 — 분리된 차트로 복원했습니다 (이력 보존 덕분에 가능)");
    DD.INACTIVE.splice(+r.dataset.reactivate,1); renderInactive();
  }
});
/* 매출 (일별·항목별) */
function renderSales(){
  const daily=[820000,1240000,980000,1510000,1866500,340000,0];
  const max=Math.max(...daily);
  $("#salesDaily").innerHTML = daily.map((v,i)=>`<i class="${i===4?"hot":""}" style="height:${Math.max(3,v/max*100)}%"><em>${v?Math.round(v/10000)+"만":""}</em></i>`).join("");
  const items=[["임플란트(1·2차)",6,7200000,"비급여"],["신경치료",9,1080000,"비급여"],["크라운·보철",7,2450000,"비급여"],["스케일링",22,363000,"급여"],["레진",11,1320000,"비급여"],["발치",8,240000,"급여"]];
  $("#salesItemBody").innerHTML = items.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}건</td><td style="text-align:right">${fmt(r[2])}원</td>
    <td><span class="pill ${r[3]==="급여"?"ok":"conf"}">${r[3]}</span></td></tr>`).join("")
    +`<tr class="tbl-total"><td>합계</td><td>${items.reduce((s,r)=>s+r[1],0)}건</td><td style="text-align:right">${fmt(items.reduce((s,r)=>s+r[2],0))}원</td><td></td></tr>`;
}
/* 매입 */
function renderPurchase(){
  $("#purchaseBody").innerHTML = DD.PURCHASES.map(p=>`
    <tr><td>${p.t.slice(5)}</td><td>${p.supplier}</td><td>${p.item}</td><td>${p.qty}</td>
    <td style="text-align:right">${fmt(p.amount)}원</td><td class="mono">${p.lot}</td><td>${p.exp}</td>
    <td>${p.paid?'<span class="pill ok">지급</span>':'<span class="pill dang">외상</span>'}</td></tr>`).join("");
  const unpaid=DD.PURCHASES.filter(p=>!p.paid);
  $("#purchaseSum").innerHTML=`미지급(외상) <b>${unpaid.length}건 · ${fmt(unpaid.reduce((s,p)=>s+p.amount,0))}원</b> · 이번 달 매입 합계 ${fmt(DD.PURCHASES.reduce((s,p)=>s+p.amount,0))}원`;
}
/* 통계 — 진료·리콜 */
function renderStatProc(){
  const items=[["임플란트",7200000,6],["보철",2450000,7],["신경치료",1080000,9],["레진",1320000,11],["예방·급여",603000,30]];
  const max=Math.max(...items.map(x=>x[1]));
  $("#statProcBody").innerHTML = items.map(r=>`
    <div class="bar-h"><span class="bl">${r[0]} <span style="color:var(--ink-muted)">${r[2]}건</span></span>
    <div class="bt"><i style="width:${r[1]/max*100}%"></i></div><span class="bv">${Math.round(r[1]/10000)}만</span></div>`).join("");
  $("#statRecallBody").innerHTML = [["스케일링(급여연도 리셋)",820],["정기 검진 안내",310],["교정 유지 관찰",46],["임플란트 정기 점검",58]]
    .map(r=>`<div class="ai-row" style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line);font-size:0.8929rem">
    <span>${r[0]}</span><b>${fmt(r[1])}명</b></div>`).join("");
}

/* ══ 디자인 시스템 반영 (병원CRM전환 09 — 계승 위젯·테마 스왑) ══ */

/* 한글 초성 분리 (계승 유틸 hanSplit — 초성 검색) */
function chosung(str){
  const CHO=["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  return Array.from(str).map(c=>{
    const code=c.charCodeAt(0)-0xAC00;
    return (code>=0&&code<11172)?CHO[Math.floor(code/588)]:c;
  }).join("");
}
const qsPop=$("#qsPop"), qsInput=$("#ptSearch");
function quickSearch(){
  const q=qsInput.value.trim();
  if(!q){ qsPop.hidden=true; renderPatients(); return; }
  const isCho=/^[ㄱ-ㅎ]+$/.test(q), isNum=/^\d+$/.test(q);
  const hits=DD.PATIENTS.filter(p=>
    isCho ? chosung(p.name).includes(q)
    : isNum ? p.phone.replace(/-/g,"").endsWith(q)||p.phone.includes(q)
    : p.name.includes(q));
  qsPop.innerHTML = hits.length
    ? hits.map(p=>`<div class="qs-item" data-qs="${p.id}"><b>${p.name}</b><span>${p.id}</span>
        <span class="qs-meta">${mask(p.phone)}<br>최근 ${p.lastVisit}</span></div>`).join("")
    : `<div class="qs-empty">일치 없음 — 초성("ㅈㅁㄹ")·전화 뒷자리("8823")로도 찾을 수 있습니다</div>`;
  qsPop.hidden=false;
}
qsInput && qsInput.addEventListener("input",quickSearch);
document.addEventListener("click",e=>{
  const qi=e.target.closest("[data-qs]");
  if(qi){ qsPop.hidden=true; openPatient(qi.dataset.qs);
    toast("이름·초성·전화 뒷자리로 환자를 찾습니다"); return; }
  if(!e.target.closest(".qsearch")) qsPop.hidden=true;
});

/* 넘버패드 (계승 위젯 — 수납 금액 터치 입력) */
const npEl=$("#numpad"); let npVal="0";
function npRender(){ $("#npDisp").textContent=(+npVal).toLocaleString(); }
$("#npAmount").addEventListener("click",e=>{
  const r=e.target.getBoundingClientRect();
  npEl.style.left=Math.min(r.left+window.scrollX, window.scrollX+document.documentElement.clientWidth-260)+"px";
  npEl.style.top=(r.bottom+window.scrollY+6)+"px";
  npVal=String(+$("#npAmount").value.replace(/,/g,"")||0);
  npEl.hidden=false; npRender();
});
npEl.addEventListener("click",e=>{
  const b=e.target.closest("[data-np]"); if(!b) return;
  const k=b.dataset.np;
  if(k==="C") npVal="0";
  else if(k==="←") npVal=npVal.length>1?npVal.slice(0,-1):"0";
  else if(k==="OK"){ $("#npAmount").value=(+npVal).toLocaleString(); npEl.hidden=true; npGate(); return; }
  else npVal=(npVal==="0"?"":npVal)+k;
  if(npVal.length>9) npVal=npVal.slice(0,9);
  npRender();
});
document.addEventListener("click",e=>{
  if(!npEl.hidden && !e.target.closest("#numpad") && !e.target.closest("#npAmount")) npEl.hidden=true;
});
function npGate(){
  const amt=+$("#npAmount").value.replace(/,/g,"")||0;
  const cash=$("#npMethod").value==="현금";
  const need=cash&&amt>=100000;
  $("#npReceiptWrap").hidden=!need;
  $("#npNote").innerHTML = need
    ? `<b style="color:var(--alert-text)">현금 10만원 이상</b> — 현금영수증 발행 여부를 선택해야 저장됩니다 (미발급 가산세 20%)`
    : `금액 칸을 클릭해 넘버패드로 입력하세요`;
}
$("#npMethod").addEventListener("change",npGate);
$("#npSave").addEventListener("click",()=>{
  const amt=+$("#npAmount").value.replace(/,/g,"")||0;
  if(!amt){ toast("금액을 입력하세요 — 금액 칸 클릭 → 넘버패드"); return; }
  const cash=$("#npMethod").value==="현금", need=cash&&amt>=100000;
  const rc=$("#npReceipt").value;
  if(need&&!rc){ toast("저장 차단 — 현금 10만원 이상은 현금영수증 발행 여부가 필수입니다 (의무발행업종)"); return; }
  DD.PAYMENTS.unshift({ t:"2026-08-14 "+new Date().toTimeString().slice(0,5), p:$("#npPat").value,
    item:$("#npItem").value, method:$("#npMethod").value, amount:amt, cash10:need, receipt:need?rc==="Y":null });
  renderPayments();
  $("#npAmount").value="0"; $("#npReceipt").value=""; npGate();
  toast(need&&rc==="N" ? "저장됨 — 미발행 선택은 「누락 점검」 목록에 잡힙니다 (가산세 계산 반영)" : "수납 저장 — 감사 로그에 기록됩니다");
});

/* CID 인콜 팝업 (계승 — 수신전화 즉시 식별) */
const CID_P="P-0233"; /* 오은영: 미수·분납·리콜·노쇼 이력 보유 */
$("#cidSim").addEventListener("click",()=>{
  const p=DD.PATIENTS.find(x=>x.id===CID_P);
  const ar=DD.ARREARS.find(a=>a.p===p.name);
  $("#cidName").textContent=`${p.name} (${p.id})`;
  $("#cidSub").textContent=`${mask(p.phone)} · 수신 중`;
  $("#cidBody").innerHTML=`
    <div class="cid-row"><span>최근 내원</span><b>${p.lastVisit} (발치·임플란트 계획)</b></div>
    <div class="cid-row"><span>미수 잔액</span><b style="color:var(--num-minus)">${(ar.total-ar.paid).toLocaleString()}원 · 2차 분납 ${ar.due.slice(5)}</b></div>
    <div class="cid-row"><span>노쇼 이력</span><b>${p.noshow12m}회 (12개월)</b></div>
    <div class="cid-row"><span>리콜</span><b>내년 1월 스케일링 대상</b></div>`;
  $("#cidPop").classList.add("show");
  toast("수신전화가 오면 환자 정보가 자동으로 표시됩니다");
});
$("#cidClose").addEventListener("click",()=>$("#cidPop").classList.remove("show"));
$("#cidChart").addEventListener("click",()=>{ $("#cidPop").classList.remove("show"); openPatient(CID_P); });
$("#cidBook").addEventListener("click",()=>{
  $("#cidPop").classList.remove("show");
  $$(".nav button").forEach(x=>x.classList.toggle("on",x.dataset.view==="cal"));
  $$(".view").forEach(v=>v.classList.toggle("on",v.id==="v-cal"));
  toast("캘린더로 이동 — 통화 중 빈 슬롯 클릭으로 바로 예약");
});

/* ── 공통 ── */
function bindReveal(){
  const io=new IntersectionObserver(es=>es.forEach(x=>{ if(x.isIntersecting){ x.target.classList.add("in"); io.unobserve(x.target);} }),{threshold:.06});
  $$(".rv:not(.in)").forEach(el=>io.observe(el));
}
/* 초기 렌더 */
renderCal(); renderPatients(); renderPayments(); renderTemplates(); renderRecall();
let smplCat="all";
judge(); calcDual(); calcPenalty(); renderLogs(); renderStats(); renderProcSelect(); renderServices(); renderResources(); renderSamples(); bindReveal();
$("#emrEst").innerHTML=`상담 CRM 모드 — 진료기록은 기존 전자차트에 남기고, 이 시스템은 데스크 응대 기록만 소유합니다 (기본 견적 범위)`;
/* ══ 수납·미수 우측 탭 분기 (전체·오늘수납·노쇼·미수금) ══ */
document.addEventListener("click",e=>{ const t=e.target.closest("#payRightTabs .tab"); if(!t)return;
  const k=t.dataset.prt; $$("#payRightTabs .tab").forEach(x=>x.classList.toggle("on",x===t));
  $$(".pay-right .prpane").forEach(p=>p.classList.toggle("on", k==="all"||p.dataset.pr===k)); });

/* ══ 문자·알림톡 마케팅 스위트 (렌더·상호작용) ══ */
let histF="all";
function pillType(t){ return `<span class="pill ${t==="알림톡"?"conf":"mut"}">${t}</span>`; }
function renderSmsHistory(){
  const rows=DD.SMS_HISTORY.filter(h=>histF==="all"||h.st===histF);
  $("#smsHistBody").innerHTML=rows.map(h=>{
    const stCls=h.st==="성공"?"ok":h.st==="실패"?"dang":"mut";
    return `<tr>
      <td style="white-space:nowrap">${h.t.slice(5)}</td>
      <td><b>${h.name}</b><br><span style="color:var(--ink-muted);font-size:0.78rem">${h.to}</span></td>
      <td>${pillType(h.type)}</td>
      <td style="font-size:0.82rem">${h.tpl}</td>
      <td style="max-width:280px;color:var(--ink-sub);font-size:0.82rem">${h.body}</td>
      <td><span class="pill ${stCls}">${h.st}</span>${h.stMsg?`<br><span style="font-size:0.74rem;color:var(--ink-muted)">${h.stMsg}</span>`:""}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums">${h.cost?h.cost+"원":"—"}</td></tr>`;
  }).join("");
  const cnt=rows.length, cost=rows.reduce((s,h)=>s+h.cost,0),
        fail=DD.SMS_HISTORY.filter(h=>h.st==="실패").length, deny=DD.SMS_HISTORY.filter(h=>h.st==="수신거부").length;
  $("#smsHistSum").innerHTML=`조회 ${cnt}건 · 비용 합계 <b>${fmt(cost)}원</b> · 실패·대체 ${fail}건 · 수신거부 ${deny}건 (실패·수신거부는 미과금)`;
}
document.addEventListener("click",e=>{ const f=e.target.closest("#histFilter .tab"); if(!f)return;
  histF=f.dataset.hf; $$("#histFilter .tab").forEach(x=>x.classList.toggle("on",x===f)); renderSmsHistory(); });

function renderSmsScheduled(){
  $("#smsSchedBody").innerHTML=DD.SMS_SCHEDULED.map((s,i)=>`<tr>
    <td style="white-space:nowrap"><b>${s.at.slice(5)}</b></td>
    <td>${s.title}</td><td>${pillType(s.type)}</td>
    <td style="color:var(--ink-sub);font-size:0.85rem">${s.target}</td>
    <td style="text-align:right;font-weight:800">${s.cnt}건</td>
    <td>${s.auto?'<span class="pill conf">자동</span>':'<span class="pill mut">수동</span>'}</td>
    <td><button class="btn xs" data-schcancel="${i}">취소</button></td></tr>`).join("");
}
document.addEventListener("click",e=>{ const b=e.target.closest("[data-schcancel]"); if(!b)return;
  DD.SMS_SCHEDULED.splice(+b.dataset.schcancel,1); renderSmsScheduled(); toast("예약 발송이 취소됐습니다"); });

let keepEdit=null;
function renderSmsKeep(){
  $("#smsKeepBody").innerHTML=DD.SMS_KEEP.map((k,i)=>{
    if(keepEdit===i) return `<div class="keep-row" style="background:var(--pri-soft)">
      <div class="keep-h"><input class="inp" id="keepE_name" value="${k.name}" placeholder="문안 이름" style="width:230px">
        <select class="inp" id="keepE_type" style="width:96px">${["알림톡","SMS","LMS"].map(o=>`<option ${o===k.type?"selected":""}>${o}</option>`).join("")}</select></div>
      <textarea class="inp" id="keepE_body" rows="3" style="width:100%;margin-top:7px">${k.body}</textarea>
      <div class="keep-a" style="margin-top:7px"><button class="btn xs pri" data-keepsave="${i}">저장</button><button class="btn xs ghost" data-keepcancel="1">취소</button></div></div>`;
    return `<div class="keep-row">
      <div class="keep-h"><b>${k.name}</b> ${pillType(k.type)}</div>
      <p class="keep-b">${k.body}</p>
      <div class="keep-a"><button class="btn xs" data-keepuse="${i}">불러오기</button><button class="btn xs" data-keepedit="${i}">수정</button><button class="btn xs ghost" data-keepdel="${i}">삭제</button></div>
    </div>`;
  }).join("");
}
document.addEventListener("click",e=>{
  const add=e.target.closest("#keepAdd"), use=e.target.closest("[data-keepuse]"), del=e.target.closest("[data-keepdel]"),
        ed=e.target.closest("[data-keepedit]"), sv=e.target.closest("[data-keepsave]"), cn=e.target.closest("[data-keepcancel]");
  if(add){ const n=$("#keepName").value.trim(); if(!n){toast("이름을 입력하세요");return;}
    const body=($("#msgIn")&&$("#msgIn").value.trim())||"#{환자명}님, ";
    DD.SMS_KEEP.unshift({name:n,type:$("#keepType").value,body}); $("#keepName").value=""; keepEdit=null; renderSmsKeep();
    toast("보관함에 저장 — 문자 보내기의 현재 문안이 담겼습니다"); }
  else if(use){ const k=DD.SMS_KEEP[+use.dataset.keepuse]; const ta=$("#msgIn"); if(ta){ta.value=k.body; ta.dispatchEvent(new Event("input"));}
    const wb=document.querySelector('#sendNav [data-sub="send-write"]'); if(wb)wb.click(); toast(`"${k.name}" 문안을 불러왔습니다`); }
  else if(ed){ keepEdit=+ed.dataset.keepedit; renderSmsKeep(); const f=$("#keepE_body"); if(f)f.focus(); }
  else if(cn){ keepEdit=null; renderSmsKeep(); }
  else if(sv){ const k=DD.SMS_KEEP[+sv.dataset.keepsave];
    k.name=$("#keepE_name").value.trim()||k.name; k.type=$("#keepE_type").value; k.body=$("#keepE_body").value;
    keepEdit=null; renderSmsKeep(); toast(`"${k.name}" 문안이 수정됐습니다`); }
  else if(del){ DD.SMS_KEEP.splice(+del.dataset.keepdel,1); keepEdit=null; renderSmsKeep(); toast("삭제됨"); }
});

let autoEdit=null;
function renderSmsAuto(){
  const hl=s=>s.replace(/#\{[^}]+\}/g,m=>`<b class="tplvar">${m}</b>`);
  $("#smsAutoBody").innerHTML=DD.SMS_AUTO.map((a,i)=>{
    const editing=autoEdit===a.key;
    const body=editing
      ? `<textarea class="inp" id="autoEditTa" rows="3" style="width:100%">${a.msg}</textarea>
         <div class="auto-a"><button class="btn xs pri" data-autosave="${a.key}">저장</button><button class="btn xs ghost" data-autocancel="1">취소</button></div>`
      : `<div class="auto-msg">${hl(a.msg)}</div><button class="btn xs" data-autoedit="${a.key}">문안 수정</button>`;
    return `<tr><td colspan="6" style="padding:0"><div class="auto-card">
      <div class="auto-h"><b>${a.name}</b>
        <span class="pill ${a.info?"ok":"warn"}">${a.info?"정보성":"광고성"}</span>${pillType(a.ch)}
        <span class="auto-trig">${a.trig} · 대상 ${a.cnt?a.cnt+"명":"이벤트 시"}</span>
        <span style="flex:1"></span>
        <span class="sw"><input type="checkbox" data-autotog="${i}" ${a.on?"checked":""}><i></i></span></div>
      ${body}</div></td></tr>`;
  }).join("");
  const on=DD.SMS_AUTO.filter(a=>a.on).length;
  $("#smsAutoSum").innerHTML=`활성 규칙 <b>${on}/${DD.SMS_AUTO.length}</b> · 규칙별 실제 발송 문안을 확인·수정할 수 있습니다. 광고성 규칙은 수신동의자에게만, 야간(21~08시)은 익일 오전으로 이월됩니다`;
}
document.addEventListener("change",e=>{ const t=e.target.closest("[data-autotog]"); if(!t)return;
  const a=DD.SMS_AUTO[+t.dataset.autotog]; a.on=t.checked; renderSmsAuto();
  toast(`${a.name} 자동 발송 ${a.on?"켜짐":"꺼짐"}`); });
document.addEventListener("click",e=>{
  const ed=e.target.closest("[data-autoedit]"), sv=e.target.closest("[data-autosave]"), cn=e.target.closest("[data-autocancel]");
  if(ed){ autoEdit=ed.dataset.autoedit; renderSmsAuto(); const ta=$("#autoEditTa"); if(ta)ta.focus(); return; }
  if(cn){ autoEdit=null; renderSmsAuto(); return; }
  if(sv){ const a=DD.SMS_AUTO.find(x=>x.key===sv.dataset.autosave); a.msg=$("#autoEditTa").value; autoEdit=null; renderSmsAuto(); toast(`${a.name} 문안이 수정됐습니다`); return; }
});

/* 문자 샘플 갤러리 */
function renderSamples(){
  const rows=DD.SMS_SAMPLES.filter(s=>smplCat==="all"||s.cat===smplCat);
  $("#smplGrid").innerHTML=rows.map(s=>{ const gi=DD.SMS_SAMPLES.indexOf(s);
    return `<div class="smpl-card" data-smplload="${gi}">
      <div class="smpl-h"><span class="pill ${s.ad?"warn":s.type==="알림톡"?"conf":"mut"}">${s.type}</span><b>${s.title}</b><span class="smpl-cat">${s.cat}</span></div>
      <p class="smpl-b">${s.body}</p>
      <span class="smpl-load">클릭하면 작성창에 불러오기 →</span></div>`; }).join("");
}
document.addEventListener("click",e=>{
  const tab=e.target.closest("#smplTabs .tab"), load=e.target.closest("[data-smplload]");
  if(tab){ smplCat=tab.dataset.smpl; $$("#smplTabs .tab").forEach(x=>x.classList.toggle("on",x===tab)); renderSamples(); return; }
  if(load){ const s=DD.SMS_SAMPLES[+load.dataset.smplload], ta=$("#msgIn");
    ta.value=s.body; ta.dispatchEvent(new Event("input")); ta.scrollIntoView({behavior:"smooth",block:"center"});
    toast(`"${s.title}" 문안을 작성창에 불러왔습니다`); return; }
});

function renderKakao(){
  const c=DD.KAKAO.channel;
  $("#kakaoCh").innerHTML=`<div class="info-box" style="margin-top:6px">
    <div class="ai-row"><span>채널(옐로우ID)</span><b>${c.yellowId}</b></div>
    <div class="ai-row"><span>발신프로필</span><b>${c.profile}</b></div>
    <div class="ai-row"><span>SenderKey</span><b style="font-variant-numeric:tabular-nums">${c.senderKey}</b></div>
    <div class="ai-row"><span>연동 상태</span><b><span class="pill ok">${c.status}</span></b></div>
    <div class="ai-row"><span>연동일</span><b>${c.connectedAt}</b></div></div>`;
  const hl=s=>s.replace(/#\{[^}]+\}/g,m=>`<b class="tplvar">${m}</b>`);
  $("#kakaoTplBody").innerHTML=DD.KAKAO.templates.map(t=>{
    const cls=t.status==="승인"?"ok":t.status==="심사중"?"warn":"dang";
    return `<tr><td colspan="4" style="padding:0">
      <div class="tpl-card">
        <div class="tpl-h"><b>${t.name}</b><span class="tpl-code">${t.code}</span><span style="flex:1"></span><span class="pill ${cls}">${t.status}</span></div>
        <div class="tpl-preview"><span class="tpl-ch">알림톡</span>${hl(t.body)}</div>
        <div class="tpl-meta">변수 ${t.vars}${t.note?` · <span style="color:${t.status==="반려"?"var(--danger)":"var(--ink-muted)"}">${t.note}</span>`:""}</div>
      </div></td></tr>`;
  }).join("");
}

function renderSenders(){
  $("#senderBody").innerHTML=DD.SENDERS.map(s=>{
    const cls=s.status==="등록완료"?"ok":s.status==="심사중"?"warn":s.status==="반려"?"dang":"mut";
    return `<tr><td style="font-variant-numeric:tabular-nums"><b>${s.number}</b></td>
      <td>${s.label}</td><td>${s.nominee}</td><td style="font-size:0.82rem">${s.auth}</td>
      <td><span class="pill ${cls}">${s.status}</span>${s.note?`<br><span style="font-size:0.74rem;color:var(--ink-muted)">${s.note}</span>`:""}</td>
      <td style="font-size:0.82rem">${s.regAt}</td></tr>`;
  }).join("");
}
document.addEventListener("click",e=>{ const b=e.target.closest("#sndAdd"); if(!b)return;
  const n=$("#sndNum").value.trim(); if(!n){toast("번호를 입력하세요");return;}
  const nom=$("#sndNominee").value;
  DD.SENDERS.push({number:n,label:$("#sndLabel").value||"신규",nominee:nom,auth:nom==="본인"?"휴대폰 실명인증":"서류인증",status:"심사중",regAt:"2026-08-15"});
  $("#sndNum").value=""; $("#sndLabel").value=""; renderSenders();
  toast(nom==="본인"?"실명인증 후 등록 대기 — 심사중":"서류심사 접수 — 영업일 3~5일"); });

function renderCharge(){
  const w=DD.SMS_WALLET;
  $("#chargeBal").innerHTML=`<div class="info-box" style="margin-top:6px">
    <div class="ai-row"><span>현재 잔액</span><b style="font-size:1.2rem;color:var(--pri)">${fmt(w.cash)}원</b></div>
    <div class="ai-row"><span>이번 달 발송</span><b>${w.monthUse.reduce((s,u)=>s+u.cnt,0)}건 · ${fmt(w.monthUse.reduce((s,u)=>s+u.cost,0))}원</b></div></div>`;
  const max=Math.max(...w.monthUse.map(u=>u.cost));
  $("#chargeUse").innerHTML=w.monthUse.map(u=>`<div class="bar-h"><span class="bl">${u.type} <span style="color:var(--ink-muted)">${u.cnt}건</span></span><div class="bt"><i style="width:${u.cost/max*100}%"></i></div><span class="bv">${fmt(u.cost)}원</span></div>`).join("");
  $("#chargeBody").innerHTML=DD.SMS_CHARGE.map(c=>`<tr>
    <td style="font-size:0.82rem;white-space:nowrap">${c.t.slice(5)}</td>
    <td><span class="pill ${c.type==="충전"?"ok":"mut"}">${c.type}</span></td>
    <td style="font-size:0.85rem">${c.detail}</td>
    <td style="text-align:right;font-variant-numeric:tabular-nums;color:${c.amt>0?"var(--ok)":"var(--ink)"}">${c.amt>0?"+":""}${fmt(c.amt)}</td>
    <td style="text-align:right;font-variant-numeric:tabular-nums">${fmt(c.bal)}</td></tr>`).join("");
}
document.addEventListener("click",e=>{ const b=e.target.closest("#chargeBtn"); if(!b)return;
  const amt=+$("#chargeAmt").value, w=DD.SMS_WALLET; w.cash+=amt;
  DD.SMS_CHARGE.unshift({t:"2026-08-15 "+new Date().toTimeString().slice(0,5),type:"충전",detail:"카드 충전",amt:amt,bal:w.cash});
  renderCharge(); updateWalletWidget(); toast(`${fmt(amt)}원 충전 완료`); });

function renderDeny(){
  $("#denyBody").innerHTML=DD.SMS_DENY.map(d=>`<tr>
    <td style="font-variant-numeric:tabular-nums"><b>${d.number}</b></td>
    <td>${d.name}</td><td style="font-size:0.85rem">${d.at}</td>
    <td><span class="pill mut">${d.src}</span></td></tr>`).join("");
  $("#denySum").innerHTML=`수신거부 <b>${DD.SMS_DENY.length}명</b> — 광고성 발송에서 자동 제외 (정보성 안내는 광고 예외로 계속 발송)`;
}
document.addEventListener("click",e=>{ const b=e.target.closest("#denyAdd"); if(!b)return;
  const n=$("#denyNum").value.trim(); if(!n){toast("번호를 입력하세요");return;}
  DD.SMS_DENY.unshift({number:n,name:"(직접 등록)",at:"2026-08-15",src:"데스크 직접 등록"});
  $("#denyNum").value=""; renderDeny(); toast("수신거부 등록 — 광고성 발송 제외"); });

function updateWalletWidget(){ const w=DD.SMS_WALLET;
  $$('.rwidget').forEach(rw=>{ if(rw.textContent.includes("발송 잔액")){ const b=rw.querySelector(".rline b"); if(b)b.textContent=fmt(w.cash)+"원"; } }); }

/* ══ 통계 상세 분석 트리 (헤어사랑넷 통계 카탈로그 · 병원 매핑) ══ */
let statActive="v02", statFav=["v02","v01"];
function statGet(p){ return p.split(".").reduce((o,k)=>o&&o[k],DD.STATS); }
function statFindItem(code){ for(const f of DD.STAT_TREE){ if(f.star) continue; for(const it of f.items) if(it.code===code) return it; } return null; }
function statSuffix(u){ return u==="만원"?"만":u==="천원"?"천":""; }
function statMonthBars(vals,labels,unit){ const mx=Math.max(...vals)||1;
  return `<div class="mbars">${vals.map((v,i)=>`<div class="mbar"><span class="mbar-v">${fmt(v)}</span><div class="mbar-t"><i style="height:${Math.max(2,v/mx*100)}%"></i></div><span class="mbar-l">${labels[i]}</span></div>`).join("")}</div>`; }
function statHbar(rows,unit){ const mx=Math.max(...rows.map(r=>r[1]))||1;
  return rows.map(r=>`<div class="bar-h"><span class="bl">${r[0]}</span><div class="bt"><i style="width:${Math.max(2,r[1]/mx*100)}%"></i></div><span class="bv">${fmt(r[1])}${statSuffix(unit)}</span></div>`).join(""); }
function renderStatView(){
  const it=statFindItem(statActive); if(!it){ $("#statView").innerHTML='<p class="sub">항목을 선택하세요</p>'; return; }
  const M=DD.STATS.months; let body="";
  if(it.kind==="month"){ const v=statGet(it.src);
    body=statMonthBars(v,M,it.unit)+`<p class="note">최근 12개월 · 단위 ${it.unit} · 합계 <b>${fmt(v.reduce((a,b)=>a+b,0))}${it.unit}</b> · 월평균 ${fmt(Math.round(v.reduce((a,b)=>a+b,0)/v.length))}${it.unit}</p>`; }
  else if(it.kind==="hbar"){ const rows=statGet(it.src);
    body=statHbar(rows,it.unit)+`<p class="note">단위 ${it.unit} · 항목 ${rows.length}개 · 합계 ${fmt(rows.reduce((a,r)=>a+r[1],0))}${statSuffix(it.unit)}</p>`; }
  else if(it.kind==="compare"){ const a=statGet(it.src),b=statGet(it.src2),lg=it.legend||["올해","작년"],mx=Math.max(...a,...b)||1;
    body=`<div class="mbars">${a.map((v,i)=>`<div class="mbar"><div class="mbar-t cmp"><i style="height:${Math.max(2,v/mx*100)}%;background:var(--pri)"></i><i style="height:${Math.max(2,b[i]/mx*100)}%;background:#AEB8C8"></i></div><span class="mbar-l">${M[i]}</span></div>`).join("")}</div>
      <div class="cmp-lg"><span><i style="background:var(--pri)"></i>${lg[0]}</span><span><i style="background:#AEB8C8"></i>${lg[1]}</span></div>`; }
  else if(it.kind==="table"){ const rows=statGet(it.src);
    body=`<table class="tbl"><thead><tr>${it.cols.map(c=>`<th>${c}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td></tr>`).join("")}</tbody></table>`; }
  const faved=statFav.includes(it.code);
  $("#statView").innerHTML=`<div class="stat-view-h"><h3>${it.t}</h3>
    <button class="btn xs ${faved?"pri":"ghost"}" data-statfav="${it.code}">${faved?"★ 즐겨찾기":"☆ 즐겨찾기"}</button></div>${body}`;
  bindReveal();
}
function renderStatTree(){
  DD.STAT_TREE[0].items = statFav.map(c=>statFindItem(c)).filter(Boolean);
  $("#statTree").innerHTML=DD.STAT_TREE.map(f=> f.items.length?`<div class="stfold"><div class="stfold-h">${f.folder}</div>
    ${f.items.map(it=>`<div class="stitem ${it.code===statActive?"on":""}" data-statitem="${it.code}"><span class="nm">${it.t}</span><i class="star ${statFav.includes(it.code)?"on":""}" data-statstar="${it.code}" title="즐겨찾기">★</i></div>`).join("")}</div>`:"").join("");
  renderStatView();
}
document.addEventListener("click",e=>{
  const star=e.target.closest("[data-statstar]"), item=e.target.closest("[data-statitem]"), vfav=e.target.closest("[data-statfav]");
  if(star){ e.stopPropagation(); const c=star.dataset.statstar;
    statFav=statFav.includes(c)?statFav.filter(x=>x!==c):[...statFav,c]; renderStatTree(); return; }
  if(vfav){ const c=vfav.dataset.statfav;
    statFav=statFav.includes(c)?statFav.filter(x=>x!==c):[...statFav,c]; renderStatTree();
    toast(statFav.includes(c)?"즐겨찾기에 추가됐습니다":"즐겨찾기에서 해제됐습니다"); return; }
  if(item){ statActive=item.dataset.statitem; renderStatTree(); return; }
});

/* ══ 문자 발송 모달 (패널·차트·목록에서 즉시 발송 · 다중선택) ══ */
let smsRecips=[];
function smsByteType(){ const v=$("#smsBody").value, byte=[...v].reduce((s,c)=>s+(c.charCodeAt(0)>127?2:1),0), isLms=byte>90;
  $("#smsByte").textContent=`${byte} byte`; $("#smsType").textContent=isLms?"LMS":"SMS"; $("#smsCost").textContent=`건당 ${isLms?"30원 (LMS)":"9원 (SMS)"}`; }
function openSmsModal(recips){
  smsRecips=(recips||[]).filter(Boolean); if(!smsRecips.length){ toast("받는 사람이 없습니다"); return; }
  $("#smsRecip").innerHTML = smsRecips.length===1
    ? `받는 사람 · <b>${smsRecips[0]}</b>`
    : `받는 사람 · <b>${smsRecips.length}명</b> — ${smsRecips.slice(0,5).join(", ")}${smsRecips.length>5?` 외 ${smsRecips.length-5}명`:""}`;
  $("#smsQuick").innerHTML=`<option value="">— 샘플 문안 선택 —</option>`+DD.SMS_SAMPLES.map((s,i)=>`<option value="${i}">[${s.cat}] ${s.title}</option>`).join("");
  $("#smsBody").value = smsRecips.length===1 ? `${smsRecips[0]}님, ` : `#{환자명}님, `;
  smsByteType(); $("#smsModal").classList.add("open"); setTimeout(()=>$("#smsBody").focus(),60);
}
$("#smsBody").addEventListener("input",smsByteType);
$("#smsQuick").addEventListener("change",()=>{ const i=$("#smsQuick").value; if(i==="")return;
  let body=DD.SMS_SAMPLES[+i].body; if(smsRecips.length===1) body=body.replace(/#\{환자명\}/g,smsRecips[0]);
  $("#smsBody").value=body; smsByteType(); });
$("#smsSend").addEventListener("click",()=>{
  const v=$("#smsBody").value.trim(); if(!v){ toast("문안을 입력하세요"); return; }
  const byte=[...v].reduce((s,c)=>s+(c.charCodeAt(0)>127?2:1),0), type=byte>90?"LMS":"SMS", unit=byte>90?30:9;
  smsRecips.forEach(name=>{ const p=DD.PATIENTS.find(x=>x.name===name);
    DD.SMS_HISTORY.unshift({ t:"2026-08-15 "+new Date().toTimeString().slice(0,5), to:p?mask(p.phone):"010-****-****",
      name, type, tpl:"직접 발송", body:v.replace(/#\{환자명\}/g,name), st:"성공", cost:unit }); });
  DD.SMS_WALLET.cash=Math.max(0,DD.SMS_WALLET.cash - smsRecips.length*unit); updateWalletWidget();
  $("#smsModal").classList.remove("open");
  toast(`${smsRecips.length}명에게 ${type} 발송 완료 — 발송 내역에 기록됐습니다`);
});
document.addEventListener("click",e=>{
  const aps=e.target.closest("#apSms"), pds=e.target.closest("#pdSms"), pts=e.target.closest("[data-ptsms]"),
        bulk=e.target.closest("#ptBulkSms"), clr=e.target.closest("#ptSelClear");
  if(aps){ openSmsModal([aps.dataset.name]); return; }
  if(pds){ openSmsModal([pds.dataset.name]); return; }
  if(pts){ openSmsModal([pts.dataset.ptsms]); return; }
  if(bulk){ const names=[...document.querySelectorAll("[data-ptsel]:checked")].map(c=>c.dataset.ptsel);
    if(!names.length){ toast("선택된 고객이 없습니다 — 체크박스로 선택하세요"); return; } openSmsModal(names); return; }
  if(clr){ document.querySelectorAll("[data-ptsel]:checked,#ptSelAll:checked").forEach(c=>c.checked=false); ptSelUpdate(); return; }
});
document.addEventListener("change",e=>{
  if(e.target.id==="ptSelAll"){ document.querySelectorAll("[data-ptsel]").forEach(c=>c.checked=e.target.checked); ptSelUpdate(); return; }
  if(e.target.matches("[data-ptsel]")) ptSelUpdate();
});

/* ══ 차트 → 예약 등록 · 수납 등록 모달 (페이지 유지 · 데이터 연동) ══ */
function openApptReg(){ const p=DD.PATIENTS.find(x=>x.id===chartPid); if(!p)return;
  $("#aqPatLbl").innerHTML=`환자 · <b>${p.name}</b> (${p.id})`;
  fillSvcSelect($("#aqProcSel"),"— 진료 선택 또는 직접 입력 —",false);
  $("#aqDoc").innerHTML=DD.DOCTORS.map(d=>`<option value="${d.id}">${d.name}</option>`).join("");
  $("#aqChair").innerHTML=DD.CHAIRS.map(c=>{const r=DD.ROOMS.find(r=>r.id===c.room)||{};return `<option value="${c.id}">${r.name} · ${c.name}</option>`;}).join("");
  $("#aqProc").value=""; $("#apptRegModal").classList.add("open");
}
$("#aqProcSel").addEventListener("change",()=>{ const o=$("#aqProcSel").selectedOptions[0]; if(o&&o.value)$("#aqProc").value=o.value; });
$("#aqSave").addEventListener("click",()=>{ const p=DD.PATIENTS.find(x=>x.id===chartPid); if(!p)return;
  const proc=$("#aqProc").value.trim()||"진료", date=$("#aqDate").value, time=$("#aqTime").value;
  DD.SCHED.push({date,time,len:2,p:p.name,proc,doc:$("#aqDoc").value,hyg:null,chair:$("#aqChair").value,st:"conf"});
  $("#apptRegModal").classList.remove("open");
  if(chartTab==="appt"||chartTab==="info") renderChartTab(chartTab);
  if(typeof calMode!=="undefined"){ if(calMode==="list") renderCalList(); else if(calMode==="month") renderMonth(); }
  toast(`${p.name} · ${date.slice(5)} ${time} ${proc} 예약 등록 — 스케줄에 반영됐습니다`);
});
function pyGate(){ const amt=+$("#pyAmount").value||0, cash=$("#pyMethod").value==="현금"; $("#pyRcptWrap").hidden=!(cash&&amt>=100000); }
function openPayReg(){ const p=DD.PATIENTS.find(x=>x.id===chartPid); if(!p)return;
  $("#pyPatLbl").innerHTML=`환자 · <b>${p.name}</b> (${p.id})`;
  fillSvcSelect($("#pyItemSel"),"— 진료항목 선택 또는 직접 입력 —",true);
  $("#pyItem").value=""; $("#pyAmount").value=0; $("#pyMethod").value="현금"; $("#pyRcpt").value=""; $("#pyRcptWrap").hidden=true;
  $("#payRegModal").classList.add("open");
}
$("#pyItemSel").addEventListener("change",()=>{ const o=$("#pyItemSel").selectedOptions[0]; if(!o||!o.value)return;
  $("#pyItem").value=o.value+(o.dataset.ins!=="비급여"?`(${o.dataset.ins})`:""); if(o.dataset.ins==="비급여"&&+o.dataset.price)$("#pyAmount").value=+o.dataset.price; pyGate(); });
$("#pyAmount").addEventListener("input",pyGate); $("#pyMethod").addEventListener("change",pyGate);
$("#pySave").addEventListener("click",()=>{ const p=DD.PATIENTS.find(x=>x.id===chartPid); if(!p)return;
  const amt=+$("#pyAmount").value||0; if(!amt){ toast("금액을 입력하세요"); return; }
  const cash=$("#pyMethod").value==="현금", need=cash&&amt>=100000, rc=$("#pyRcpt").value;
  if(need&&!rc){ toast("현금 10만원 이상 — 현금영수증 발행 여부를 선택하세요"); return; }
  DD.PAYMENTS.unshift({t:"2026-08-15 "+new Date().toTimeString().slice(0,5),p:p.name,item:$("#pyItem").value||"진료비",method:$("#pyMethod").value,amount:amt,cash10:need,receipt:need?rc==="Y":null});
  $("#payRegModal").classList.remove("open");
  if(chartTab==="sales"||chartTab==="info") renderChartTab(chartTab);
  renderPayments();
  toast(`${p.name} ${fmt(amt)}원 수납 등록 — 수납·미수 페이지에 반영됐습니다`);
});

/* ══ 예약 카드 hover 상세 레이어 (마우스 추적 · 화면 이탈 방지) ══ */
const hc=$("#hoverCard");
function hcHtml(a,kind){
  const time=kind==="appt"?`${slotTime(a.t)}–${slotTime(a.t+a.len)}`:a.time;
  return `<div class="hc-h"><b>${a.p}</b><span class="pill ${a.st}">${DD.STATUS[a.st]}</span></div>
    ${kind==="sched"?`<div class="hc-row"><span>일자</span><b>${a.date}</b></div>`:""}
    <div class="hc-row"><span>시간</span><b>${time}</b></div>
    <div class="hc-row"><span>진료</span><b>${a.proc}</b></div>
    <div class="hc-row"><span>담당</span><b>${staffOf(a)}</b></div>
    <div class="hc-row"><span>진료실</span><b>${chairOf(a)}</b></div>`;
}
function hcMove(x,y){ const w=hc.offsetWidth,h=hc.offsetHeight,vw=innerWidth,vh=innerHeight,pad=16;
  let L=x+pad,T=y+pad; if(L+w>vw-8)L=x-w-pad; if(L<8)L=8; if(T+h>vh-8)T=y-h-pad; if(T<8)T=8;
  hc.style.left=L+"px"; hc.style.top=T+"px"; }
document.addEventListener("mouseover",e=>{
  const ev=e.target.closest?e.target.closest(".vevt"):null, mv=e.target.closest?e.target.closest(".mevt"):null;
  let a=null,kind=null;
  if(ev){ a=DD.APPTS.find(x=>x.id===ev.dataset.appt); kind="appt"; }
  else if(mv){ a=DD.SCHED[+mv.dataset.sidx]; kind="sched"; }
  if(a){ hc.innerHTML=hcHtml(a,kind); hc.hidden=false; }
});
document.addEventListener("mousemove",e=>{ if(drag){ hc.hidden=true; return; } if(!hc.hidden) hcMove(e.clientX,e.clientY); });
document.addEventListener("mouseout",e=>{ const c=e.target.closest?e.target.closest(".vevt,.mevt"):null; if(!c)return;
  const r=e.relatedTarget; if(!r||!(r.closest&&r.closest(".vevt,.mevt"))) hc.hidden=true; });

/* ══ 월간·목록 카드/행 클릭 → 예약 패널 열기 ══ */
document.addEventListener("click",e=>{
  const mv=e.target.closest(".mevt"); if(mv&&mv.dataset.sidx!==undefined){ openApptPanel(DD.SCHED[+mv.dataset.sidx]); return; }
  const lr=e.target.closest("#calListBody tr[data-sidx]"); if(lr){ openApptPanel(DD.SCHED[+lr.dataset.sidx]); return; }
});

/* ══ 그림자(백드롭) 클릭 시 모달·패널 닫기 ══ */
document.addEventListener("click",e=>{ if(e.target.classList&&e.target.classList.contains("modal-bg")) e.target.classList.remove("open"); });

/* 딥링크 — ?view=stats&sub=stats-sales 로 초기 탭 지정, ?appt=a2&open=patreg 로 예약·모달 지정 */
(function(){ const q=new URLSearchParams(location.search); const v=q.get("view");
  if(v){ const vb=document.querySelector(`.nav button[data-view="${v}"]`); if(vb){ vb.click();
    const su=q.get("sub"); if(su){ const sb=document.querySelector(`#v-${v} .subnav [data-sub="${su}"]`); if(sb) sb.click(); } } }
  const cm=q.get("cmode");
  if(cm){ const cb=document.querySelector(`#calModeTabs [data-cmode="${cm}"]`); if(cb) cb.click(); }
  const ch=q.get("chart"); if(ch){ try{ openPatient(ch); const ct=q.get("ctab"); if(ct){ const cb=document.querySelector(`#pdTabs [data-ct="${ct}"]`); if(cb) cb.click(); } }catch(e){} }
  const ap=q.get("appt");
  if(ap){ try{ openApptPanel(ap); }catch(e){}
    if(q.get("open")==="patreg"){ const b=document.getElementById("apChart");
      if(b&&b.dataset.reg){ document.getElementById("patRegModal").dataset.appt=b.dataset.reg;
        document.getElementById("patRegModal").classList.add("open"); } } }
})();
})();
