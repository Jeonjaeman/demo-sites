/* INCIRCLE 관리자 — 승인 큐·매트릭스·신고 상태머신·마스킹·진단·인프라·로그 */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"),2800); }

/* ── 탭 ── */
$("#anav").addEventListener("click", e => {
  const b = e.target.closest("[data-tab]"); if(!b) return;
  $$("#anav button").forEach(x=>x.classList.toggle("on", x===b));
  $$(".apanel").forEach(p=>p.classList.toggle("on", p.id==="tab-"+b.dataset.tab));
  if(b.dataset.tab==="sec"){ renderPerf(); }
});

/* ── ① 승인 큐 ── */
const queue = IC.MEMBERS.filter(m=>m.status==="pending").map(m=>({...m}));
let rejectTarget = null;
function renderQueue(){
  $("#approveQ").innerHTML = queue.map(m=>`
    <tr><td><b>${m.nick}</b> <span style="color:var(--ink-muted)">${m.id}</span></td>
    <td>${m.via}</td><td>${m.ref==="-"?"—":`<span class="pillb ok">${m.ref}</span>`}</td>
    <td>${m.waitH>=24?`<span class="pillb dang">${m.waitH}시간 — SLA 초과</span>`:`<span class="pillb mut">${m.waitH}시간</span>`}</td>
    <td style="text-align:right;white-space:nowrap">
      <button class="sbtn pri" data-approve="${m.id}">승인</button>
      <button class="sbtn dang" data-reject="${m.id}">거절</button></td></tr>`).join("")
    || `<tr><td colspan="5" style="color:var(--ink-muted);text-align:center;padding:20px">대기 중인 신청이 없습니다</td></tr>`;
  $("#kPending").textContent = queue.length;
  const over = queue.filter(m=>m.waitH>=24).length;
  $("#kOver").textContent = over ? `24시간 초과 ${over}건 — SLA 경고` : "SLA 준수 중";
  $("#kPending").className = over ? "dang" : queue.length ? "warn" : "ok";
}
document.addEventListener("click", e => {
  const ap = e.target.closest("[data-approve]");
  if(ap){ const i = queue.findIndex(m=>m.id===ap.dataset.approve);
    const m = queue.splice(i,1)[0]; renderQueue();
    addLog({ t:now(), who:"admin", act:"가입 승인", target:`${m.id} ${maskName(m.name)}`, ip:"211.36.xx.xx", kind:"approve" });
    toast(`${m.nick} 승인 — 1등급 부여, 승인 알림 발송됨 (JWT 클레임 grade=1 갱신)`); return; }
  const rj = e.target.closest("[data-reject]");
  if(rj){ rejectTarget = rj.dataset.reject; $("#rejectModal").classList.add("open"); return; }
  if(e.target.closest("[data-close]")) $$(".modal-bg").forEach(m=>m.classList.remove("open"));
});
$("#rejectSubmit").addEventListener("click", ()=>{
  const reason = document.querySelector("input[name=rj]:checked").value;
  const i = queue.findIndex(m=>m.id===rejectTarget);
  if(i>-1){ const m = queue.splice(i,1)[0]; renderQueue();
    addLog({ t:now(), who:"admin", act:"가입 거절(사유 통보)", target:`${m.id} ${maskName(m.name)} — ${reason}`, ip:"211.36.xx.xx", kind:"approve" });
    toast(`거절 통보 발송 — "${reason}" · 개인정보 30일 후 자동 파기 예약`); }
  $("#rejectModal").classList.remove("open");
});
function now(){ return "2026-08-13 " + new Date().toTimeString().slice(0,5); }
function maskName(n){ return n[0] + "**"; }

/* ── ① 공지 CMS ── */
$("#cmsPub").addEventListener("click", ()=>{
  const title = $("#cmsTitle").value.trim();
  if(!title){ toast("제목을 입력하세요"); return; }
  const when = document.querySelector("input[name=cmsWhen]:checked").value;
  const at = $("#cmsAt").value.replace("T"," ").slice(5,10).replace("-",".");
  $("#cmsRows").insertAdjacentHTML("afterbegin",
    `<tr><td><span class="pillb ${when==="now"?"ok":"warn"}">${when==="now"?"게시 중":"예약"}</span></td>
    <td>${title}</td><td>${when==="now"?"08.13":at}</td><td><span class="pillb mut">라운지 상단</span></td></tr>`);
  toast(when==="now" ? "발행 완료 — 커뮤니티 라운지 상단에 고정되었습니다" : `예약 완료 — ${at} 자동 게시됩니다`);
});

/* ── ② 권한 매트릭스 (72칸) ── */
const ACTS = [["read","열람"],["write","쓰기"],["comment","댓글"],["down","다운로드"]];
function renderMatrix(){
  let h = `<div class="mh">게시판</div>` + ACTS.map(a=>`<div class="mh">${a[1]}</div>`).join("");
  IC.BOARDS.forEach(b => {
    h += `<div class="mb mname"><span class="dot" style="width:6px;height:6px;border-radius:50%;background:${b.color}"></span>${b.name}</div>`;
    ACTS.forEach(([k]) => {
      h += `<div class="mb"><select data-mx="${b.id}:${k}">
        ${[0,1,2,3,9].map(g=>`<option value="${g}" ${IC.MATRIX[b.id][k]===g?"selected":""}>${g===0?"공개":g===9?"운영진":g+"등급"}</option>`).join("")}
      </select></div>`;
    });
  });
  $("#matrix").innerHTML = h;
}
document.addEventListener("change", e => {
  const mx = e.target.closest("[data-mx]");
  if(mx){ const [bid,k] = mx.dataset.mx.split(":");
    IC.MATRIX[bid][k] = +mx.value; renderPreview();
    toast(`${IC.BOARDS.find(b=>b.id===bid).name} · ${ACTS.find(a=>a[0]===k)[1]} → ${mx.value==="0"?"공개":mx.value==="9"?"운영진":mx.value+"등급"} — 커뮤니티 시야에 즉시 반영되는 규칙입니다`); return; }
  if(e.target.id==="pvGrade") renderPreview();
});
function renderPreview(){
  const g = +($("#pvGrade").value);
  $("#pvBoards").innerHTML = IC.BOARDS.map(b=>{
    const ok = IC.MATRIX[b.id].read===0 || g >= IC.MATRIX[b.id].read;
    return `<span class="bchip ${ok?"":"off"}">${b.name}</span>`;
  }).join("");
}

/* 자동 승급 시뮬 — 실계산 */
const RULE_POP = [ /* 1등급 회원 분포(가상 24명): [가입일수, 방문, 글+댓글] */
  [45,22,14],[38,9,2],[31,15,7],[29,4,1],[27,11,5],[25,7,3],[22,18,9],[21,3,0],
  [19,8,4],[18,12,6],[16,5,2],[15,9,3],[14,6,1],[12,10,5],[11,2,0],[10,7,3],
  [9,4,2],[8,5,1],[7,3,1],[6,6,2],[5,1,0],[4,2,1],[3,1,0],[2,1,0]
];
function calcRule(){
  const d = +$("#ruleDays").value, v = +$("#ruleVisits").value, p = +$("#rulePosts").value;
  $("#ruleDaysOut").textContent = d+"일"; $("#ruleVisitsOut").textContent = v+"회"; $("#rulePostsOut").textContent = p+"건";
  const up = RULE_POP.filter(x=>x[0]>=d && x[1]>=v && x[2]>=p).length;
  $("#ruleResult").innerHTML = `1등급 24명 중 <b style="color:var(--accent)">${up}명이 2등급으로 승급</b>합니다.
  ${up>16?"기준이 느슨해 상위 게시판의 밀도가 급격히 낮아질 수 있습니다.":up===0?"아무도 승급하지 못합니다 — 승급 불가 커뮤니티는 문의가 관리자에게 직행합니다.":"기준은 마이페이지에 공개되어 “왜 나만 못 보나” 문의를 줄입니다."}`;
}
["ruleDays","ruleVisits","rulePosts"].forEach(id=>document.addEventListener("input",e=>{ if(e.target.id===id) calcRule(); }));

/* ── ③ 신고 상태머신 (44조의2) ── */
const reports = IC.REPORTS.map(r=>({...r, notified:{...r.notified}}));
function renderReports(){
  $("#reportQ").innerHTML = reports.map(r=>{
    const canNext = r.stage < 4;
    const nextLabel = ["조치(블라인드) 실행","양측 통지 발송","게시판 공시","만료 분기 설정"][r.stage] || "";
    return `<div style="border:1px solid var(--line);border-radius:8px;padding:14px 16px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <b style="font-size:14px">${r.id}</b><span style="font-size:13px;color:var(--ink-sub)">${r.target}</span>
        <span class="pillb ${r.reason==="스팸·광고"?"mut":"dang"}">${r.reason}</span>
        <span style="margin-left:auto" class="dd ${r.dday<=3?"urgent":""}">${r.stage>=1?`임시조치 D-${r.dday}`:"미조치"}</span></div>
      <div class="stages">${IC.REPORT_STAGES.map((s,i)=>`<div class="stage ${i<r.stage?"done":i===r.stage?"now":""}">${s}</div>`).join("")}</div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap">
        <span style="font-size:12px;color:var(--ink-muted)">신고 ${r.filed} · 신고자 ${r.reporter} ·
        통지: 신고자 ${r.notified.reporter?"✅":"—"} / 게시자 ${r.notified.author?"✅":"—"} · 공시 ${r.posted?"✅":"—"}</span>
        <span style="flex:1"></span>
        ${canNext?`<button class="sbtn pri" data-rnext="${r.id}">${nextLabel}</button>`:`
        <button class="sbtn" data-rrestore="${r.id}">복원(이의 인용)</button>
        <button class="sbtn dang" data-rdelete="${r.id}">삭제 확정</button>`}
      </div></div>`;
  }).join("");
}
document.addEventListener("click", e => {
  const rn = e.target.closest("[data-rnext]");
  if(rn){ const r = reports.find(x=>x.id===rn.dataset.rnext); r.stage++;
    if(r.stage===2){ r.notified.reporter = r.notified.author = true;
      addLog({ t:now(), who:"admin", act:"신고 통지 발송(양측)", target:r.id, ip:"211.36.xx.xx", kind:"report" }); }
    if(r.stage===3){ r.posted = true; }
    if(r.stage===1){ addLog({ t:now(), who:"admin", act:"신고 처리(임시조치)", target:r.id, ip:"211.36.xx.xx", kind:"report" }); }
    renderReports();
    toast(["임시조치 완료 — 목록에는 “임시조치됨” 자리가 남습니다 (공시 의무)","신고자·게시자 양측에 통지 발송 — 발송 로그 기록됨","게시판 공시 완료 — D-30 카운트다운 진행","만료 분기 설정 — 이의 없으면 복원/삭제를 확정합니다"][r.stage-1]); return; }
  const rr = e.target.closest("[data-rrestore],[data-rdelete]");
  if(rr){ const id = rr.dataset.rrestore||rr.dataset.rdelete;
    const i = reports.findIndex(x=>x.id===id); reports.splice(i,1); renderReports();
    toast(rr.dataset.rrestore ? id+" 게시물 복원 — 게시자 이의가 인용되었습니다" : id+" 삭제 확정 — 처리 결과가 양측에 통보됩니다"); }
});

/* ── ③ 마스킹 ── */
let maskMode = "server";
function maskPhone(p){ return p.replace(/(\d{3})-\d{4}/, "$1-****"); }
function maskEmail(m){ return m.replace(/(^.{2})[^@]*/, "$1***"); }
function renderMembers(){
  const act = IC.MEMBERS.filter(m=>m.status==="active");
  $("#memberRows").innerHTML = act.map(m=>`
    <tr><td>${m.id}</td><td><b>${m.nick}</b></td><td><span class="pillb mut">${m.grade}등급</span></td>
    <td>${maskPhone(m.phone)}</td><td>${maskEmail(m.email)}</td>
    <td><button class="sbtn" data-unmask="${m.id}">해제</button></td></tr>`).join("");
  const sample = act[0];
  if(maskMode==="server"){
    $("#apiHead").textContent = "GET /rest/v1/members_masked — 실제 응답";
    $("#apiHead").className = "cp-head good";
    $("#apiPanel").innerHTML = `{
  "id": "${sample.id}",
  "nick": "${sample.nick}",
  "phone": <span class="ok">"${maskPhone(sample.phone)}"</span>,
  "email": <span class="ok">"${maskEmail(sample.email)}"</span>
}
<span class="ok">→ 원문이 서버를 떠나지 않습니다 (마스킹 뷰 경유)</span>`;
  } else {
    $("#apiHead").textContent = "GET /rest/v1/members — 실제 응답 (화면만 가린 상태)";
    $("#apiHead").className = "cp-head bad";
    $("#apiPanel").innerHTML = `{
  "id": "${sample.id}",
  "nick": "${sample.nick}",
  "phone": <span class="hl">"${sample.phone}"</span>,
  "email": <span class="hl">"${sample.email}"</span>
}
<span class="hl">→ 화면에는 ***로 보여도 Network 탭에는 원문이 그대로.
   이것은 마스킹이 아닙니다.</span>`;
  }
}
document.addEventListener("click", e => {
  const mk = e.target.closest("[data-mask]");
  if(mk){ maskMode = mk.dataset.mask;
    $$("[data-mask]").forEach(x=>x.classList.toggle("on", x===mk)); renderMembers();
    toast(maskMode==="server"?"서버측 마스킹 — 응답 자체가 가려져 있습니다":"클라이언트 마스킹 — 응답 원문을 확인해 보세요"); return; }
  const um = e.target.closest("[data-unmask]");
  if(um){ const reason = prompt("마스킹 해제 사유를 입력하세요 (활동 로그에 기록됩니다)", "환불 문의 본인 확인");
    if(reason){ addLog({ t:now(), who:"admin", act:"회원정보 마스킹 해제", target:`${um.dataset.unmask} (사유: ${reason})`, ip:"211.36.xx.xx", kind:"privacy" });
      toast("해제 기록됨 — 이 행위 자체가 법정 접속기록 대상입니다"); } }
});

/* ── ③ 탈퇴 3안 ── */
const WD_TEXT = {
  anon: [`글 <b>${IC.WITHDRAW.posts}건</b>·댓글 <b>${IC.WITHDRAW.comments}건</b>이 「탈퇴회원」 명의로 유지됩니다. 스레드 <b>${IC.WITHDRAW.threads}개</b>가 온전히 보존되고, 개인정보만 파기됩니다. (권장 — 커뮤니티 자산 보존)`,
   `제N조(탈퇴) ① 탈퇴 시 회원의 개인정보는 지체 없이 파기하되, 관계법령상 보존 의무가 있는 정보는 해당 기간 보관한다.\n② 회원이 작성한 게시물은 탈퇴 후에도 서비스 내 게시를 유지하며, 작성자 표시는 "탈퇴회원"으로 대체한다.\n③ 회원은 탈퇴 전 본인 게시물의 삭제를 직접 요청할 수 있다.`],
  hide: [`글 ${IC.WITHDRAW.posts}건이 비공개로 전환됩니다. 해당 글에 달린 <b>다른 회원의 댓글 ${IC.WITHDRAW.comments}건도 함께 가려집니다</b> — 3등급 자료 제공자의 탈퇴라면 자료실 상당 부분이 사라집니다.`,
   `제N조(탈퇴) ② 회원이 작성한 게시물은 탈퇴와 동시에 비공개로 전환한다. 게시물에 부속된 타 회원의 댓글도 함께 열람이 제한된다.`],
  del: [`글 ${IC.WITHDRAW.posts}건 삭제 → <b>고아 댓글 ${IC.WITHDRAW.comments}건</b>, 끊긴 스레드 ${IC.WITHDRAW.threads}개가 발생합니다. 다른 회원의 기여까지 맥락을 잃습니다. (비권장)`,
   `제N조(탈퇴) ② 회원이 작성한 게시물은 탈퇴와 동시에 삭제한다. 단, 타 회원의 댓글이 부속된 게시물의 처리 기준은 별도로 정한다. (※ 이 기준을 정하지 않으면 분쟁 지점이 됩니다)`]
};
function renderWd(mode){
  $("#wdResult").innerHTML = WD_TEXT[mode][0];
  $("#wdClause").textContent = WD_TEXT[mode][1];
}
document.addEventListener("click", e => {
  const wd = e.target.closest("[data-wd]");
  if(wd){ $$("[data-wd]").forEach(x=>x.classList.toggle("on", x===wd)); renderWd(wd.dataset.wd); }
});

/* ── ④ 자가진단 ── */
function renderAudit(){
  $("#auditList").innerHTML = IC.AUDIT.map((a,i)=>`
    <div class="aitem ${a.state?"":""}" data-ai="${i}">
      <div class="arow">
        <label class="sw"><input type="checkbox" data-audit="${i}" ${a.state?"checked":""}><i></i></label>
        <b>${a.name}</b>
        <span class="pillb ${a.state?"ok":"dang"}">${a.state?a.good:a.bad}</span>
        <button class="sbtn" data-fix="${i}">조치 방법</button>
      </div>
      <div class="fix">${a.fix}</div>
    </div>`).join("");
  const risk = IC.AUDIT.reduce((s,a)=>s+(a.state?0:a.risk),0);
  $("#auditScore").textContent = risk;
  $("#auditScore").style.color = risk>=50?"var(--danger)":risk>=15?"var(--warn)":"var(--success)";
  $("#auditMsg").innerHTML = risk>=50
    ? "인수 직후 상태 가정 — <b>service_role 노출과 RLS 미적용만으로 DB 전체가 공개된 것과 같습니다.</b> 위 두 항목이 1일차 작업입니다."
    : risk>0 ? "핵심 위험은 제거됐습니다. 남은 항목은 운영 안정 항목입니다." : "8항목 전부 조치 완료 — 월 1회 재점검을 권장합니다.";
}
document.addEventListener("change", e => {
  const au = e.target.closest("[data-audit]");
  if(au){ IC.AUDIT[+au.dataset.audit].state = au.checked; renderAudit();
    if(au.checked) toast("조치 완료로 표시 — 위험 점수가 재계산되었습니다"); return; }
});
document.addEventListener("click", e => {
  const fx = e.target.closest("[data-fix]");
  if(fx){ fx.closest(".aitem").classList.toggle("openfix"); }
});

/* ── ④ RLS 성능 ── */
function renderPerf(){
  const m = +$("#perfMembers").value;
  $("#perfMembersOut").textContent = m.toLocaleString()+"명";
  const rows = m * IC.RLS_PERF.rowsPerMember;
  $("#perfRows").textContent = `대상 행 수 ≈ ${rows.toLocaleString()}행 (회원당 42행)`;
  const data = [
    ["naive — auth.uid() 직접 호출", IC.RLS_PERF.naive(rows), true],
    ["(select auth.uid()) initplan 래핑", IC.RLS_PERF.wrap(rows), false],
    ["+ RLS 컬럼 인덱스", IC.RLS_PERF.idx(rows), false],
    ["+ TO authenticated 명시", IC.RLS_PERF.full(rows), false]
  ];
  const max = Math.max(...data.map(d=>d[1]), 1);
  $("#perfBars").innerHTML = data.map(d=>`
    <div class="bar ${d[2]&&d[1]>500?"bad":""}"><span class="bl">${d[0]}</span>
    <div class="bt"><i data-w="${Math.max(2, d[1]/max*100)}"></i></div>
    <span class="bv">${d[1]>=1000?(d[1]/1000).toFixed(1)+"초":d[1]+"ms"}</span></div>`).join("");
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    $$("#perfBars i[data-w]").forEach(el=>{ el.style.width = el.dataset.w+"%"; });
  }));
}
document.addEventListener("input", e => { if(e.target.id==="perfMembers") renderPerf(); });

/* ── ④ 정책 진단기 ── */
$("#runBad").addEventListener("click", ()=>{
  const o = $("#outBad"); o.hidden = false;
  o.innerHTML = `<span class="hl">ERROR:  42P17: infinite recursion detected in
policy for relation "profiles"</span>
<span style="color:#697180">-- 정책이 profiles를 읽으려다 자기 정책을 다시 평가합니다.
-- 등급제 커뮤니티에서 가장 흔한 실패 패턴입니다.</span>`;
  toast("42P17 — 무한 재귀. 등급 조회를 정책 밖(JWT/SECURITY DEFINER)으로 빼야 합니다");
});
$("#runGood").addEventListener("click", ()=>{
  const o = $("#outGood"); o.hidden = false;
  o.innerHTML = `<span class="ok">SELECT 24 rows  (8ms)</span>
<span style="color:#697180">-- 테이블을 다시 읽지 않으므로 재귀가 없고,
-- initplan으로 1회만 평가되어 규모가 커져도 안전합니다.</span>`;
  toast("정상 — JWT 클레임 방식은 재귀·성능 문제를 동시에 피합니다");
});

/* ── ④ 유출본 역추적 ── */
const TRACE_DB = {
  "WM-K7Q2XN": { who:"세줄요약 (M-0021 · 3등급)", when:"2026-08-13 15:47", ip:"118.235.xx.xx", file:"하반기 계획 워크시트", exp:"5분 (만료됨)" }
};
$("#traceBtn").addEventListener("click", ()=>{
  const tk = $("#traceToken").value.trim().toUpperCase();
  const hit = TRACE_DB[tk];
  $("#traceResult").innerHTML = hit ? `
    <div style="border:1px solid var(--success);background:var(--success-soft);border-radius:8px;padding:14px 16px;font-size:13px;line-height:1.8">
    <b style="color:var(--success)">열람자 특정됨</b><br>
    열람자 <b>${hit.who}</b> · 발급 <b>${hit.when}</b> · IP ${hit.ip}<br>
    파일 「${hit.file}」 · 서명 URL 만료 ${hit.exp}<br>
    <span style="color:var(--ink-sub)">워터마크 토큰과 열람 이력이 한 쌍으로 동작할 때만 "추적"이 완성됩니다 — 오버레이 워터마크였다면 이 화면은 빈 결과였습니다.</span></div>`
  : `<div style="border:1px solid var(--line-strong);border-radius:8px;padding:14px 16px;font-size:13px;color:var(--ink-sub)">
    일치하는 발급 이력이 없습니다. 커뮤니티 자료실에서 「파일 각인」 모드로 방금 다운로드했다면 그 토큰은 세션 데모라 이 목록에 없습니다 —
    실제 구축에서는 발급 즉시 이 테이블에 기록됩니다. (프리필 토큰 WM-K7Q2XN로 흐름을 확인하세요)</div>`;
});

/* ── ⑤ 리전 ── */
const REGIONS = {
  seoul: { badge:`<span class="pillb ok">국외이전 비해당</span> 개인정보가 국내(서울 리전)에서 처리됩니다 — 처리방침에 국외이전 조항이 필요 없습니다. 지연 ~4ms`,
    clause:`-- 개인정보처리방침: 국외이전 조항 불필요 (국내 리전 처리)` },
  tokyo: { badge:`<span class="pillb warn">국외이전 해당</span> 처리방침에 이전 항목·국가·수탁자·보유기간을 반드시 기재해야 합니다 (개인정보보호법 28조의8). 지연 ~35ms`,
    clause:`제N조(개인정보의 국외이전)
회사는 서비스 제공에 필요한 범위에서 다음과 같이 개인정보 처리를 국외에 위탁·보관합니다.
· 이전 항목: 회원 식별정보(닉네임·이메일·연락처), 게시물, 접속기록
· 이전 국가: 일본 (AWS ap-northeast-1, 도쿄)  · 수탁자: Supabase Inc.
· 이전 일시·방법: 서비스 이용 시점에 정보통신망을 통해 전송
· 보유 기간: 회원 탈퇴 또는 위탁계약 종료 시까지` },
  us: { badge:`<span class="pillb warn">국외이전 해당</span> 미국 리전 — 동일하게 처리방침 기재 의무 + 체감 지연이 커집니다. 지연 ~190ms`,
    clause:`제N조(개인정보의 국외이전)
· 이전 국가: 미국 (AWS us-east-1)  · 수탁자: Supabase Inc.
· 이전 항목·방법·보유 기간: (도쿄 조항과 동일 구조로 기재)` }
};
function renderRegion(r){ $("#regionBadge").innerHTML = REGIONS[r].badge; $("#regionClause").textContent = REGIONS[r].clause; }
document.addEventListener("click", e => {
  const rg = e.target.closest("[data-region]");
  if(rg){ $$("[data-region]").forEach(x=>x.classList.toggle("on", x===rg)); renderRegion(rg.dataset.region);
    toast("설정 하나가 법적 의무를 만듭니다 — 리전은 착수 1일차에 확정"); }
});

/* ── ⑤ 플랜·비용 ── */
let plan = "pro";
function calcInfra(){
  const m = +$("#infMembers").value, st = +$("#infStor").value, eg = +$("#infEgress").value;
  $("#infMembersOut").textContent = m.toLocaleString()+"명";
  $("#infStorOut").textContent = st+"GB"; $("#infEgressOut").textContent = eg+"GB";
  const p = plan==="free" ? IC.INFRA.planFree : IC.INFRA.planPro;
  const pitr = $("#pitrChk").checked && plan==="pro" ? IC.INFRA.pitr : 0;
  const stor = plan==="free" ? 0 : st*IC.INFRA.storagePerGB;
  const egc = plan==="free" ? 0 : eg*IC.INFRA.egressPerGB;
  const total = p.monthly + pitr + stor + egc;
  $("#infCost").innerHTML = plan==="free"
    ? `월 0원 — 단 <span style="color:var(--danger)">공고 비기능 요구(자동 암호화 백업) 미충족</span>`
    : `월 예상 <span style="color:var(--accent)">${total.toLocaleString()}원</span> <span style="font-size:12px;color:var(--ink-muted)">= 플랜 ${p.monthly.toLocaleString()} + PITR ${pitr.toLocaleString()} + 스토리지 ${stor.toLocaleString()} + 전송 ${egc.toLocaleString()}</span>`;
  $("#infNote").textContent = plan==="free"
    ? "무료 플랜: 자동 백업 없음 · 7일 미사용 시 프로젝트 일시정지 — 초기 70명 시절 실제로 발생할 수 있는 조건입니다."
    : m<=4000 ? "Pro의 MAU 한도(10만)는 이 규모에서 변수가 아닙니다 — 실제 비용 변수는 스토리지·전송량입니다." : "";
}
document.addEventListener("click", e => {
  const pl = e.target.closest("[data-plan]");
  if(pl){ plan = pl.dataset.plan; $$("[data-plan]").forEach(x=>x.classList.toggle("on", x===pl)); calcInfra(); }
});
document.addEventListener("input", e => {
  if(["infMembers","infStor","infEgress"].includes(e.target.id)) calcInfra();
});
document.addEventListener("change", e => { if(e.target.id==="pitrChk") calcInfra(); });

/* ── ⑤ 프로바이더 검수 ── */
function renderProviders(){
  $("#providers").innerHTML = IC.PROVIDERS.map(p=>`
    <div style="border:1px solid var(--line);border-radius:8px;padding:14px 16px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:10px">
        <b style="font-size:14px">${p.name}</b>
        <span class="pillb ${p.id==="kakao"?"ok":"warn"}">${p.type}</span>
        <span style="flex:1"></span>
        ${p.stage < p.stages.length-1 ? `<button class="sbtn pri" data-pnext="${p.id}">${p.stages[p.stage+1]} 진행</button>` : `<span class="pillb ok">승인 완료</span>`}
      </div>
      <div class="stages">${p.stages.map((s,i)=>`<div class="stage ${i<p.stage?"done":i===p.stage?"now":""}">${s}</div>`).join("")}</div>
      <div style="margin-top:8px;display:flex;flex-direction:column;gap:5px">
        ${p.checklist.map((c,ci)=>`<label style="display:flex;align-items:center;gap:8px;font-size:13px">
          <input type="checkbox" data-pchk="${p.id}:${ci}" ${c.done?"checked":""} style="accent-color:var(--accent)">
          ${c.t} <span class="pillb ${c.owner==="의뢰자"?"warn":"mut"}">${c.owner}</span></label>`).join("")}
      </div></div>`).join("");
}
document.addEventListener("click", e => {
  const pn = e.target.closest("[data-pnext]");
  if(pn){ const p = IC.PROVIDERS.find(x=>x.id===pn.dataset.pnext);
    const undone = p.checklist.filter(c=>!c.done);
    if(undone.length){ toast(`체크리스트 미완료: "${undone[0].t}" (${undone[0].owner} 담당) — 완료 전에는 다음 단계로 못 갑니다. 반려되면 1주가 밀립니다`); return; }
    p.stage++; renderProviders();
    toast(`${p.name} — ${p.stages[p.stage]} 단계로 진행`); }
});
document.addEventListener("change", e => {
  const pc = e.target.closest("[data-pchk]");
  if(pc){ const [pid,ci] = pc.dataset.pchk.split(":");
    IC.PROVIDERS.find(x=>x.id===pid).checklist[+ci].done = pc.checked; }
});

/* ── ⑤ 활동 로그 ── */
const logs = IC.LOGS.map(l=>({...l}));
let logFilter = "all";
function keepDays(t){ // 기록일 + 365일 − 오늘(2026-08-13)
  const d = new Date(t.slice(0,10)); const end = new Date(d); end.setDate(end.getDate()+365);
  return Math.round((end - new Date("2026-08-13"))/86400000);
}
function addLog(l){ logs.unshift(l); renderLogs(); }
function renderLogs(){
  const list = logs.filter(l=>logFilter==="all"||l.kind===logFilter);
  $("#logRows").innerHTML = list.map((l,i)=>`
    <tr><td style="white-space:nowrap">${l.t}</td><td>${l.who}</td>
    <td>${l.kind==="privacy"?`<b style="color:var(--warn)">${l.act}</b>`:l.act}</td>
    <td style="max-width:260px">${l.target}</td><td>${l.ip}</td>
    <td><span class="pillb mut">D-${keepDays(l.t)}</span></td>
    <td><button class="sbtn" data-logdel="${i}">삭제</button></td></tr>`).join("");
}
document.addEventListener("click", e => {
  const lf = e.target.closest("[data-logf]");
  if(lf){ logFilter = lf.dataset.logf; $$("[data-logf]").forEach(x=>x.classList.toggle("on",x===lf)); renderLogs(); return; }
  const ld = e.target.closest("[data-logdel]");
  if(ld){ toast("삭제 차단 — 접속기록은 법정 보존기간(1년) 중에는 삭제할 수 없습니다 (안전성 확보조치 기준)"); return; }
  if(e.target.id==="logAudit"){ toast("정기 점검 완료로 기록 — 접속기록 월 1회 점검도 고시 요건입니다");
    addLog({ t:now(), who:"admin", act:"접속기록 정기 점검", target:"전체 로그 "+logs.length+"건", ip:"211.36.xx.xx", kind:"approve" }); }
});

/* 카운트업 */
document.querySelectorAll("[data-count]").forEach(el=>{
  const to = +el.dataset.count, t0 = performance.now();
  const step = t => { const p = Math.min(1,(t-t0)/800), e2 = 1-Math.pow(1-p,3);
    el.textContent = Math.round(to*e2); if(p<1) requestAnimationFrame(step); };
  requestAnimationFrame(step); step(performance.now());
});

/* 초기 렌더 */
renderQueue(); renderMatrix(); renderPreview(); calcRule();
renderReports(); renderMembers(); renderWd("anon");
renderAudit(); renderPerf();
renderRegion("seoul"); calcInfra(); renderProviders(); renderLogs();
})();
