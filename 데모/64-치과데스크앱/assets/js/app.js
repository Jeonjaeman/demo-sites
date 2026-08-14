/* DENTDESK — 캘린더·환자·수납·발송·통계·설정 (전 데이터 가상) */
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
  rows.forEach((row,ci)=>{
    apptsFor(row).forEach(a=>{
      const el=document.createElement("div");
      el.className="vevt "+a.st; el.dataset.appt=a.id;
      el.style.top=(headH + a.t*SH + 2)+"px";
      el.style.height=(a.len*SH - 5)+"px";
      el.style.left=(TW + ci*colW + 3)+"px";
      el.style.width=(colW - 6)+"px";
      el.title=`${a.p} · ${a.proc}`;
      el.innerHTML=`<b>${a.p}${a.st==="noshow"?" ⌀":""}</b><span>${slotTime(a.t)}–${slotTime(a.t+a.len)} · ${a.proc}</span>`;
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
$$("#axisTabs .tab").forEach(b=>b.addEventListener("click",()=>{
  state.axis=b.dataset.axis; $$("#axisTabs .tab").forEach(x=>x.classList.toggle("on",x===b)); renderCal();
  toast(state.axis==="chair"?"체어 축 — 컬럼 헤더에 소속 진료실 표기(계층)":state.axis==="doc"?"의사 축 — 의사는 진료실을 이동하는 리소스입니다":"위생사 축 — 스케일링은 의사가 아니라 위생사+체어를 소요합니다");
}));
window.addEventListener("resize",()=>{ if(state.view==="cal") renderCal(); });

/* 빈 슬롯 클릭 → 예약 모달 (프리필) */
let pendingSlot=null;
document.addEventListener("click",e=>{
  const cell=e.target.closest(".vcell:not(.blocked)");
  if(cell && state.view==="cal"){
    if(state.ssot==="emr"){ toast("읽기 전용 — SSOT가 「전자차트가 주인」이라 이 화면에서는 예약을 만들지 않습니다 (설정 탭에서 변경)"); return; }
    const [key,id,t]=cell.dataset.slot.split(":");
    pendingSlot={key,id,t:+t};
    $("#bkWhen").textContent=`${slotTime(+t)}–${slotTime(+t+2)} · ${axisRows().find(r=>r.id===id)?.name||id}`;
    const pt = DD.PATIENTS.find(p=>p.noshow12m>=2);
    $("#bkNoshow").hidden = $("#bkPatient").value!=="최강훈";
    $("#bookModal").classList.add("open"); return;
  }
  const evt=e.target.closest(".vevt");
  if(evt){ openApptActions(evt.dataset.appt); return; }
  if(e.target.closest("[data-close]")) $$(".modal-bg").forEach(m=>m.classList.remove("open"));
});
$("#bkPatient").addEventListener("input",()=>{
  $("#bkNoshow").hidden = $("#bkPatient").value.trim()!=="최강훈";
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

/* 예약 액션: 취소 → 대기 목록 매칭 (R⑤) */
function openApptActions(id){
  const a=DD.APPTS.find(x=>x.id===id); if(!a) return;
  if(a.st==="cancel"){ toast("이미 취소된 예약입니다"); return; }
  if(confirm(`${a.p} · ${a.proc} (${slotTime(a.t)})\n\n이 예약을 '당일 취소'로 바꾸고 대기 목록에서 후보를 찾을까요?`)){
    a.st="cancel"; renderCal();
    const scored = DD.WAITLIST.map(w=>{
      let s=0; if(w.want==="무관"||(w.want==="오후"&&a.t>=8)) s+=2;
      if(!w.doc||w.doc===a.doc) s+=2; if(w.noshow===0) s+=1;
      return {...w,score:s};
    }).sort((x,y)=>y.score-x.score);
    $("#wlBody").innerHTML = scored.map((w,i)=>`
      <tr><td><b>${w.p}</b></td><td>${w.proc}</td><td>${w.want}</td><td>${w.doc?DD.DOCTORS.find(d=>d.id===w.doc).name:"무관"}</td>
      <td>${w.noshow?`<span class="pill noshow">노쇼 ${w.noshow}</span>`:'<span class="pill ok">0</span>'}</td>
      <td><b style="color:var(--accent)">${w.score}점</b></td>
      <td><button class="btn sm pri" data-wl="${i}">배정+알림</button></td></tr>`).join("");
    $("#wlModal").classList.add("open");
  }
}
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
    <tr><td>${p.id}</td><td><b>${p.name}</b></td><td>${p.birth.slice(0,4)}년생</td>
    <td><span class="mono masked" id="ph-${p.id}">${mask(p.phone)}</span> <button class="btn sm" data-reveal="${p.id}">표시</button></td>
    <td>${p.lastVisit}</td>
    <td>${p.noshow12m?`<span class="pill noshow">노쇼 ${p.noshow12m}회</span>`:'<span class="pill ok">양호</span>'}</td>
    <td>${p.consent.marketing?`<span class="pill ok">광고 동의</span>`:'<span class="pill mut">미동의</span>'}</td>
    <td><button class="btn sm" data-pt="${p.id}">상세</button></td></tr>`).join("");
}
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
function openPatient(id){
  const p=DD.PATIENTS.find(x=>x.id===id);
  $("#pdName").textContent=`${p.name} · ${p.id}`;
  $("#pdMeta").innerHTML=`${p.birth} · ${mask(p.phone)} · 최근 내원 ${p.lastVisit}
    ${p.noshow12m>=2?' · <span class="pill noshow">위약금 동의서 징구 대상 (12개월 노쇼 '+p.noshow12m+'회)</span>':""}
    ${p.consent.sensitive?'':' · <span class="pill warn">민감정보 별도 동의 없음 — 진료 연동 열람 잠김</span>'}`;
  $("#pdDesk").innerHTML=p.desk.map(r=>`<div class="rec"><time>${r.t} · ${r.who}</time>${r.txt}</div>`).join("")||'<p style="font-size:0.8571rem;color:var(--ink-muted)">기록 없음</p>';
  $("#pdEmr").innerHTML = p.consent.sensitive
    ? (p.emr.map(r=>`<div class="rec"><time>${r.t}</time>${r.txt}</div>`).join("")||'<p style="font-size:0.8571rem;color:var(--ink-muted)">연동 기록 없음</p>')
    : '<p style="font-size:0.8571rem;color:var(--warn)">민감정보 동의 미확보 — 열람 제한</p>';
  $("#pdInput").value="다음 내원 시 크라운 색상 상담 예정 — 견적 55만원 안내함";
  $("#pdWarn").hidden=true;
  $("#patModal").classList.add("open");
}
$("#pdInput").addEventListener("input",()=>{
  const v=$("#pdInput").value;
  const hit=DD.EMR_WORDS.find(w=>new RegExp(w,"i").test(v));
  $("#pdWarn").hidden=!hit;
  $("#pdInput").style.borderColor=hit?"var(--danger)":"";
});
$("#pdSave").addEventListener("click",()=>{
  const v=$("#pdInput").value;
  if(DD.EMR_WORDS.some(w=>new RegExp(w,"i").test(v))){
    toast("저장 차단 — 진료기록 성격의 문구입니다. 의료법 22조상 의료인 서명이 필요한 기록은 전자차트에 작성하세요"); return; }
  toast("데스크 응대 기록 저장됨 (이 시스템 소유 영역)");
});
$("#pdDeact").addEventListener("click",()=>{
  toast("물리 삭제 없음 — '비활성 · 보존 만료 2036-08-14 (진료기록 10년)'로 전환되고 감사 로그에 남습니다");
});

/* ══ ③ 수납·미수 ══ */
function renderPayments(){
  const canEdit = DD.ROLES[state.role].payEdit;
  $("#payBody").innerHTML = DD.PAYMENTS.map((p,i)=>`
    <tr><td>${p.t.slice(5)}</td><td><b>${p.p}</b></td><td>${p.item}</td><td>${p.method}</td>
    <td style="text-align:right">${fmt(p.amount)}원</td>
    <td>${p.cash10?(p.receipt?'<span class="pill ok">현금영수증 발행</span>':'<span class="pill dang">미발행 — 가산세 20% 위험</span>'):'—'}</td>
    <td><button class="btn sm" data-payedit="${i}" ${canEdit?"":"disabled"} title="${canEdit?"":"수납 수정은 실장 이상 (현금 조작 방지)"}">수정</button></td></tr>`).join("");
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
  }).join("");
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
  const alim=isAd?0:Math.round(n*0.86), fb=n-alim-(isAd?0:8), sms=isAd?n:8;
  $("#queueOut").innerHTML=`발송 큐 적재 — 알림톡 ${alim}건 · 실패 폴백 SMS ${isAd?0:8}건 · ${isAd?`(광고) SMS ${sms}건`:""} · 수신거부 제외 3건<br>
  예상 비용 <b>${fmt(alim*8+ (isAd?sms:8)*12)}원</b> (알림톡 8원 · SMS 12원) ${isAd?'· <span style="color:var(--warn)">야간분은 08:00 이월</span>':""}`;
  toast("발송 큐에 적재됐습니다 — 템플릿 미승인 채널은 자동 제외됩니다");
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

/* ══ 디자인 시스템 반영 (병원CRM전환 09 — 계승 위젯·테마 스왑) ══ */

/* 테마 스왑 — 메인 3색 변수만 교체 */
$$("#themeSw button").forEach(b=>b.addEventListener("click",()=>{
  const t=b.dataset.themeSet;
  if(t) document.documentElement.dataset.theme=t; else delete document.documentElement.dataset.theme;
  $$("#themeSw button").forEach(x=>x.classList.toggle("on",x===b));
  toast(t==="purple"
    ? "원본 theme01 퍼플 계열 — 파스텔 메인색은 대비 부족이라 버튼·텍스트는 진한 변형을 씁니다 (09 명세 지적 반영)"
    : t==="green"
    ? "그린 테마 — 실측 테마 구조 그대로 변수 세트만 교체했습니다"
    : "theme06 네이비(실서비스 기본 테마 실측값) — 병원 화이트라벨이 이 변수 구조로 가능합니다");
}));

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
    toast("초성·뒷자리 검색은 통화 중 한 손 조작의 핵심입니다 (계승 UX)"); return; }
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
  toast("전화가 오면 데스크가 인사말을 하는 사이에 이 카드가 떠 있어야 합니다 — CID 연동 (계승 기능)");
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
judge(); calcDual(); calcPenalty(); renderLogs(); renderStats(); bindReveal();
$("#emrEst").innerHTML=`상담 CRM 모드 — 진료기록은 기존 전자차트에 남기고, 이 시스템은 데스크 응대 기록만 소유합니다 (기본 견적 범위)`;
})();
