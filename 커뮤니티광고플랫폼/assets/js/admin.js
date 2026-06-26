/* =========================================================
 *  MOA 어드민 — 관리자 백오피스 (admin.html)
 *  회원·권한 / 콘텐츠 / 신고 / 캠페인 / 소재 / 트래킹 + CSV
 *  의존성 없음 (순수 Vanilla)
 * =======================================================*/
(function () {
  "use strict";
  const D = window.MOA || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const num = (n) => Number(n).toLocaleString();
  const won = (n) => "₩" + Number(n).toLocaleString();
  const advName = (id) => (D.advertisers.find((a) => a.id === id) || {}).name || id;
  const advColor = (id) => (D.advertisers.find((a) => a.id === id) || {}).color || "#6d5cf5";
  const typeLabel = (t) => (D.adTypes[t] || {}).label || t;
  const TODAY = new Date("2026-06-26");

  /* ---- toast ---- */
  function toast(msg) {
    let t = $("#__toast");
    if (!t) { t = document.createElement("div"); t.id = "__toast"; t.className = "toast"; t.innerHTML = '<span class="ti"></span><span class="tm"></span>'; document.body.appendChild(t); }
    $(".tm", t).textContent = msg; requestAnimationFrame(() => t.classList.add("on"));
    clearTimeout(window.__tt); window.__tt = setTimeout(() => t.classList.remove("on"), 2300);
  }
  /* ---- modal ---- */
  function modal(html) { $("#modal").innerHTML = html; $("#modalBack").classList.add("on"); }
  function closeModal() { $("#modalBack").classList.remove("on"); }
  $("#modalBack").addEventListener("click", (e) => { if (e.target.id === "modalBack" || e.target.closest("[data-close-modal]")) closeModal(); });

  /* ---- CSV download (Excel 호환 BOM) ---- */
  function downloadCSV(name, header, rows) {
    const all = [header].concat(rows);
    const csv = all.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast(name + " 내보내기 완료 (" + rows.length + "행)");
  }

  /* ---- dual chart (impressions area + clicks bars) ---- */
  function buildChart(el, data) {
    const W = 600, H = 178, pl = 4, pr = 4, pt = 12, pb = 6, iw = W - pl - pr, ih = H - pt - pb, n = data.length;
    const impMax = Math.max(...data.map((d) => d.imp)) * 1.12, clkMax = Math.max(...data.map((d) => d.clk)) * 1.3;
    const x = (i) => pl + iw * (i / (n - 1)), yI = (v) => pt + ih * (1 - v / impMax);
    const pts = data.map((d, i) => `${x(i).toFixed(1)},${yI(d.imp).toFixed(1)}`);
    const area = `M${pl},${pt + ih} L${pts.join(" L")} L${pl + iw},${pt + ih} Z`;
    const bw = (iw / n) * 0.34;
    const bars = data.map((d, i) => { const h = ih * (d.clk / clkMax); return `<rect x="${(x(i) - bw / 2).toFixed(1)}" y="${(pt + ih - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="url(#cg)"/>`; }).join("");
    const dots = data.map((d, i) => `<circle cx="${x(i).toFixed(1)}" cy="${yI(d.imp).toFixed(1)}" r="3" fill="#a855f7"/>`).join("");
    const grid = [0, .25, .5, .75, 1].map((t) => `<line class="gl" x1="${pl}" y1="${(pt + ih * t).toFixed(1)}" x2="${pl + iw}" y2="${(pt + ih * t).toFixed(1)}" vector-effect="non-scaling-stroke"/>`).join("");
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${H}px">
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a855f7" stop-opacity=".32"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/></linearGradient>
      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d5cf5"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
      ${grid}${bars}<path d="${area}" fill="url(#ag)"/><path d="M${pts.join(" L")}" fill="none" stroke="#a855f7" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>${dots}</svg>
      <div style="display:flex;justify-content:space-between;margin-top:6px;padding:0 2px">${data.map((d) => `<span style="font-size:10.5px;color:var(--muted)">${d.d}</span>`).join("")}</div>`;
  }

  /* =====================================================
   *  State
   * ===================================================*/
  let members = D.members.map((x) => ({ ...x }));
  let roleReqs = D.roleRequests.map((x) => ({ ...x }));
  let reports = D.reports.map((x) => ({ ...x }));
  let adminPosts = D.adminPosts.map((x) => ({ ...x }));
  let campaigns = D.campaigns.map((x) => ({ ...x }));

  /* =====================================================
   *  Pane switching
   * ===================================================*/
  const TITLES = {
    dashboard: ["대시보드", "오늘의 커뮤니티·광고 운영 현황"],
    members: ["회원·권한 관리", "4단계 권한 승인/반려 및 회원 제재"],
    content: ["콘텐츠 관리", "공지·광고·일반 게시글 작성과 예약 발행"],
    reports: ["신고 관리", "악성 유저·게시글 신고 접수 및 처리"],
    campaigns: ["광고 캠페인", "캠페인 생성·편집·기간·상태·자동 만료"],
    creatives: ["광고 소재", "5종 광고 소재 규격과 운영 현황"],
    tracking: ["트래킹 통계", "노출·클릭·CTR 집계 및 CSV 내보내기"]
  };
  function goPane(name) {
    $$(".aside nav a").forEach((a) => a.classList.toggle("on", a.dataset.pane === name));
    $$(".apane").forEach((p) => p.classList.toggle("on", p.dataset.pane === name));
    $("#aTitle").textContent = TITLES[name][0]; $("#aSub").textContent = TITLES[name][1];
    window.scrollTo({ top: 0 });
  }
  document.addEventListener("click", (e) => {
    const nav = e.target.closest(".aside nav a[data-pane]");
    if (nav) { goPane(nav.dataset.pane); return; }
    const goto = e.target.closest("[data-goto]");
    if (goto) { e.preventDefault(); goPane(goto.dataset.goto); }
  });

  /* ---- badges ---- */
  function badges() {
    const rq = roleReqs.length, rp = reports.filter((r) => r.status === "접수").length;
    $("#navReq").textContent = rq || ""; $("#navReq").style.display = rq ? "" : "none";
    $("#navRep").textContent = rp || ""; $("#navRep").style.display = rp ? "" : "none";
    $("#reqCount").textContent = rq ? rq + "건 대기" : "대기 없음";
  }

  /* =====================================================
   *  Dashboard
   * ===================================================*/
  const KICON = {
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    click: '<path d="M9 3v8l2-2 2 5 2-1-2-5h3z"/>',
    ctr: '<path d="M3 17l5-6 4 4 5-7 4 5"/>',
    flag: '<path d="M5 21V4h11l-1.5 3.5L16 11H6"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0111 0"/>',
    camp: '<path d="M3 11l16-6v14L3 13z"/>'
  };
  function kpiCard(c) {
    return `<div class="kpi"><div class="kt"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8">${KICON[c.ico]}</svg></div><span class="dl ${c.up ? "up" : "down"}">${c.d}</span></div><div class="v">${c.v}</div><div class="l">${c.l}</div></div>`;
  }
  function renderDashboard() {
    const last = D.tracking[D.tracking.length - 1], prev = D.tracking[D.tracking.length - 2];
    const ctr = (last.clk / last.imp * 100).toFixed(2);
    const impUp = ((last.imp - prev.imp) / prev.imp * 100).toFixed(1);
    const unres = reports.filter((r) => r.status === "접수").length;
    $("#kpis").innerHTML = [
      { ico: "eye", v: num(last.imp), l: "오늘 노출수", d: "+" + impUp + "%", up: true },
      { ico: "click", v: num(last.clk), l: "오늘 클릭수", d: "+12.4%", up: true },
      { ico: "ctr", v: ctr + "%", l: "평균 CTR", d: "+0.18%p", up: true },
      { ico: "flag", v: unres, l: "미처리 신고", d: "처리 필요", up: false }
    ].map(kpiCard).join("");
    buildChart($("#dashChart"), D.tracking);
    const active = campaigns.filter((c) => c.status === "진행중").sort((a, b) => b.imp - a.imp).slice(0, 4);
    $("#dashCmp").innerHTML = active.map((c) => `<li><span class="dot" style="background:${advColor(c.adv)}"></span><span class="mt">${esc(c.name)}</span><span class="md">${num(c.imp)} 노출</span></li>`).join("");
    $("#dashRep").innerHTML = reports.slice(0, 4).map((r) => `<li><span class="dot" style="background:${r.status === "접수" ? "#ff5d8f" : "#9aa4ba"}"></span><span class="mt">${esc(r.ref)}</span><span class="md">${r.date}</span></li>`).join("");
  }

  /* =====================================================
   *  Members & role requests
   * ===================================================*/
  const roleCls = { "관리자": "role-admin", "광고주": "role-adv", "유료": "role-paid", "무료": "role-free" };
  const stPill = { "정상": "pill-on", "정지": "pill-stop", "대기": "pill-wait" };
  let mFilter = "전체", mQuery = "";
  function renderRoleReqs() {
    const box = $("#roleReqs");
    if (!roleReqs.length) { box.innerHTML = `<div style="color:var(--muted);font-size:13.5px;padding:14px 0">대기 중인 권한 신청이 없습니다.</div>`; return; }
    box.innerHTML = roleReqs.map((r) => `<div class="rr" data-rq="${r.id}">
      <span class="av" style="background:var(--grad-2)">${esc(r.nick[0])}</span>
      <div class="rinfo"><b>${esc(r.nick)}</b><div class="flow"><span class="role ${roleCls[r.from]}">${r.from}</span><span class="ar">→</span><span class="role ${roleCls[r.to]}">${r.to}</span></div><small>${esc(r.reason)} · ${r.date}</small></div>
      <div class="rbtns"><button class="btn-sm" data-reject="${r.id}">반려</button><button class="btn-primary" data-approve="${r.id}" style="padding:8px 16px">승인</button></div>
    </div>`).join("");
  }
  function renderMembers() {
    const rows = members.filter((m) => (mFilter === "전체" || m.role === mFilter) && (!mQuery || (m.nick + m.email).toLowerCase().includes(mQuery.toLowerCase())));
    $("#memberBody").innerHTML = rows.length ? rows.map((m) => `<tr>
      <td class="muted num">${m.id}</td>
      <td><b>${esc(m.nick)}</b></td>
      <td class="muted">${esc(m.email)}</td>
      <td><span class="role ${roleCls[m.role]}">${m.role}</span></td>
      <td class="muted num">${m.joined}</td>
      <td class="muted">글 ${m.posts} · 신고 ${m.reports}</td>
      <td><span class="pill ${stPill[m.status]}">${m.status}</span></td>
      <td><div style="display:flex;gap:6px">
        <select class="btn-sm" data-role="${m.id}">${["관리자", "광고주", "유료", "무료"].map((r) => `<option ${m.role === r ? "selected" : ""}>${r}</option>`).join("")}</select>
        <button class="btn-sm" data-ban="${m.id}" style="${m.status === "정지" ? "color:#0c9b6f" : "color:#d83a5a"}">${m.status === "정지" ? "해제" : "정지"}</button>
      </div></td></tr>`).join("") : `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--muted)">조건에 맞는 회원이 없습니다.</td></tr>`;
  }
  function bindMembers() {
    $("#roleFilter").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; $$("#roleFilter button").forEach((x) => x.classList.remove("on")); b.classList.add("on"); mFilter = b.dataset.f; renderMembers(); });
    $("#memberSearch").addEventListener("input", (e) => { mQuery = e.target.value.trim(); renderMembers(); });
    $("#memberBody").addEventListener("change", (e) => { const s = e.target.closest("[data-role]"); if (!s) return; const m = members.find((x) => x.id === s.dataset.role); m.role = s.value; renderMembers(); toast(`${m.nick} 권한을 '${s.value}'(으)로 변경했습니다.`); });
    $("#memberBody").addEventListener("click", (e) => { const b = e.target.closest("[data-ban]"); if (!b) return; const m = members.find((x) => x.id === b.dataset.ban); m.status = m.status === "정지" ? "정상" : "정지"; renderMembers(); toast(`${m.nick}을(를) ${m.status === "정지" ? "정지" : "정상 복구"} 처리했습니다.`); });
    $("#roleReqs").addEventListener("click", (e) => {
      const ap = e.target.closest("[data-approve]"), rj = e.target.closest("[data-reject]");
      if (!ap && !rj) return;
      const id = (ap || rj).dataset.approve || (ap || rj).dataset.reject;
      const r = roleReqs.find((x) => x.id === id);
      roleReqs = roleReqs.filter((x) => x.id !== id);
      renderRoleReqs(); badges();
      toast(ap ? `${r.nick} 권한 신청을 승인했습니다 (${r.to}).` : `${r.nick} 권한 신청을 반려했습니다.`);
    });
    $("#csvMembers").addEventListener("click", () => downloadCSV("MOA_회원목록.csv", ["회원ID", "닉네임", "이메일", "권한", "가입일", "글수", "신고수", "상태"], members.map((m) => [m.id, m.nick, m.email, m.role, m.joined, m.posts, m.reports, m.status])));
  }

  /* =====================================================
   *  Content
   * ===================================================*/
  const catCls = { "공지": "role-adv", "광고": "role-paid", "일반": "role-free" };
  const stateCls = { "게시": "pill-on", "예약": "pill-wait", "임시저장": "pill-end" };
  let cFilter = "전체";
  function renderContent() {
    const rows = adminPosts.filter((p) => cFilter === "전체" || p.cat === cFilter);
    $("#contentBody").innerHTML = rows.map((p) => `<tr>
      <td class="muted num">${p.id}</td>
      <td><span class="role ${catCls[p.cat]}">${p.cat}</span></td>
      <td><b style="font-weight:600">${esc(p.title)}</b></td>
      <td><span class="pill ${stateCls[p.state] || "pill-on"}">${p.state}</span></td>
      <td class="muted num">${p.date}</td>
      <td class="muted num">${num(p.views)}</td>
      <td><button class="btn-sm" data-delpost="${p.id}">삭제</button></td></tr>`).join("") || `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">게시물이 없습니다.</td></tr>`;
  }
  function bindContent() {
    $("#contentFilter").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; $$("#contentFilter button").forEach((x) => x.classList.remove("on")); b.classList.add("on"); cFilter = b.dataset.f; renderContent(); });
    $("#contentBody").addEventListener("click", (e) => { const b = e.target.closest("[data-delpost]"); if (!b) return; adminPosts = adminPosts.filter((p) => String(p.id) !== b.dataset.delpost); renderContent(); toast("게시물이 삭제되었습니다."); });
    $("#newPostBtn").addEventListener("click", () => $("#editorCard").scrollIntoView({ behavior: "smooth" }));
    $("#edState").addEventListener("change", (e) => { $("#edScheduleWrap").style.display = e.target.value === "예약 발행" ? "block" : "none"; });
    $$(".ed-tools button").forEach((b) => b.addEventListener("click", () => {
      const cmd = b.dataset.cmd; $("#edBody").focus();
      if (cmd === "createLink") { const u = prompt("링크 URL", "https://"); if (u) document.execCommand(cmd, false, u); }
      else if (cmd === "formatBlock") document.execCommand(cmd, false, b.dataset.val);
      else document.execCommand(cmd, false, null);
    }));
    $("#edCancel").addEventListener("click", () => { $("#edTitle").value = ""; $("#edBody").innerHTML = "<p></p>"; });
    $("#edSubmit").addEventListener("click", () => {
      const title = $("#edTitle").value.trim(); if (!title) return toast("제목을 입력해 주세요.");
      const cat = $("#edCat").value, state = $("#edState").value;
      const st = state === "예약 발행" ? "예약" : state === "임시 저장" ? "임시저장" : "게시";
      adminPosts.unshift({ id: Date.now() % 100000, cat, title, date: "2026-06-26", state: st, views: 0 });
      cFilter = "전체"; $$("#contentFilter button").forEach((x, i) => x.classList.toggle("on", i === 0));
      renderContent(); $("#edTitle").value = ""; $("#edBody").innerHTML = "<p></p>";
      toast(st === "예약" ? "게시글이 예약 발행으로 등록되었습니다." : st === "임시저장" ? "임시 저장되었습니다." : "게시글이 등록되었습니다.");
      $('.apane[data-pane="content"]').scrollIntoView({ behavior: "smooth" });
    });
  }

  /* =====================================================
   *  Reports
   * ===================================================*/
  let rFilter = "접수";
  function renderReports() {
    const rows = reports.filter((r) => rFilter === "전체" || r.status === rFilter);
    $("#reportList").innerHTML = rows.length ? rows.map((r) => `<div class="rq" data-rp="${r.id}">
      <div class="rh"><span class="role ${r.target === "게시글" ? "role-adv" : "role-paid"}">${r.target}</span><span class="reason">${r.reason}</span><span style="margin-left:auto" class="pill ${r.status === "접수" ? "pill-wait" : "pill-done"}">${r.status}</span></div>
      <div class="ref">${esc(r.ref)}</div>
      <div class="rmeta"><span>신고자 ${r.by}</span><span>접수일 ${r.date}</span><span>${r.id}</span></div>
      ${r.status === "접수" ? `<div class="rfoot"><button class="btn-sm" data-act="hide" data-id="${r.id}">게시 숨김</button><button class="btn-sm" data-act="del" data-id="${r.id}">삭제</button><button class="btn-primary" data-act="ban" data-id="${r.id}" style="padding:8px 16px">작성자 제재</button><button class="btn-sm" data-act="ok" data-id="${r.id}">반려(이상없음)</button></div>` : `<div style="font-size:12.5px;color:var(--mint);font-weight:600">✓ 처리 완료된 신고입니다.</div>`}
    </div>`).join("") : `<div class="acard" style="text-align:center;color:var(--muted);padding:44px">해당 신고가 없습니다.</div>`;
  }
  function bindReports() {
    $("#reportFilter").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; $$("#reportFilter button").forEach((x) => x.classList.remove("on")); b.classList.add("on"); rFilter = b.dataset.f; renderReports(); });
    $("#reportList").addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]"); if (!b) return;
      const r = reports.find((x) => x.id === b.dataset.id); r.status = "처리완료";
      const msg = { hide: "게시물을 숨김 처리했습니다.", del: "게시물을 삭제했습니다.", ban: "작성자를 제재했습니다.", ok: "이상 없음으로 반려했습니다." }[b.dataset.act];
      renderReports(); badges(); renderDashboard(); toast(msg);
    });
    $("#csvReports").addEventListener("click", () => downloadCSV("MOA_신고내역.csv", ["신고ID", "대상", "내용", "신고자", "사유", "접수일", "상태"], reports.map((r) => [r.id, r.target, r.ref, r.by, r.reason, r.date, r.status])));
  }

  /* =====================================================
   *  Campaigns
   * ===================================================*/
  let cmpFilter = "전체";
  function periodPct(c) {
    if (c.status === "종료") return 100;
    if (c.status === "예약") return 0;
    const a = new Date(c.start), b = new Date(c.end);
    return Math.max(0, Math.min(1, (TODAY - a) / (b - a))) * 100;
  }
  function cmpCard(c) {
    const ctr = c.imp ? (c.clk / c.imp * 100).toFixed(2) : "0.00";
    const stp = { "진행중": "pill-on", "예약": "pill-wait", "종료": "pill-end" }[c.status];
    return `<div class="cmp" data-cmp="${c.id}">
      <div class="ch"><div><h4>${esc(c.name)}</h4><div class="meta"><span class="role role-adv">${esc(advName(c.adv))}</span> · ${c.plan} · ${typeLabel(c.type)}</div></div><span class="pill ${stp}">${c.status}</span></div>
      <div class="nums">
        <div class="n"><div class="v">${num(c.imp)}</div><div class="l">노출</div></div>
        <div class="n"><div class="v">${num(c.clk)}</div><div class="l">클릭</div></div>
        <div class="n"><div class="v">${ctr}%</div><div class="l">CTR</div></div>
      </div>
      <div class="prog"><div class="pl"><span>${c.start} ~ ${c.end}</span><span>${c.status === "종료" ? "만료됨" : c.status === "예약" ? "대기" : "집행 " + Math.round(periodPct(c)) + "%"}</span></div><div class="track"><i style="width:${periodPct(c)}%"></i></div></div>
      <div class="cfoot"><button class="btn-sm" data-view="${c.id}">소재 보기</button>${c.status === "진행중" ? `<button class="btn-sm" data-pause="${c.id}">일시중지</button>` : c.status === "예약" ? `<button class="btn-sm" data-pause="${c.id}">예약취소</button>` : ""}<span style="margin-left:auto;font-size:12px;color:var(--muted);align-self:center">예산 ${won(c.budget)}</span></div>
    </div>`;
  }
  function renderCampaigns() {
    const rows = campaigns.filter((c) => cmpFilter === "전체" || c.status === cmpFilter);
    $("#cmpGrid").innerHTML = rows.length ? rows.map(cmpCard).join("") : `<div class="acard" style="grid-column:1/-1;text-align:center;color:var(--muted);padding:44px">해당 캠페인이 없습니다.</div>`;
  }
  function openCmpModal() {
    modal(`<div class="mh"><h3>새 광고 캠페인</h3><button class="x-btn" data-close-modal>×</button></div>
      <div class="mb">
        <div class="ed-grid"><div><label class="flabel">캠페인명</label><input class="f" id="ncName" placeholder="예: 여름 시즌 프로모션"/></div>
        <div><label class="flabel">광고주</label><select class="f" id="ncAdv">${D.advertisers.map((a) => `<option value="${a.id}">${a.name}</option>`).join("")}</select></div></div>
        <div class="ed-grid"><div><label class="flabel">소재 타입</label><select class="f" id="ncType">${Object.keys(D.adTypes).map((k) => `<option value="${k}">${D.adTypes[k].label}</option>`).join("")}</select></div>
        <div><label class="flabel">플랜</label><select class="f" id="ncPlan"><option>베이직</option><option>스탠다드</option><option>프리미엄</option></select></div></div>
        <div class="ed-grid"><div><label class="flabel">시작일</label><input class="f" id="ncStart" type="date" value="2026-07-01"/></div>
        <div><label class="flabel">종료일</label><input class="f" id="ncEnd" type="date" value="2026-07-31"/></div></div>
        <div class="ed-grid"><div><label class="flabel">타겟</label><input class="f" id="ncTarget" placeholder="예: 20–40 / 관심:요리"/></div>
        <div><label class="flabel">예산(원)</label><input class="f" id="ncBudget" type="number" value="3000000"/></div></div>
        <p style="font-size:12.5px;color:var(--muted);margin:14px 0 0">⏱ 종료일이 지나면 캠페인은 자동 만료 처리되어 노출이 중단됩니다.</p>
      </div>
      <div class="mf"><button class="btn-line" data-close-modal>취소</button><button class="btn-primary" id="ncSubmit">캠페인 생성</button></div>`);
    $("#ncSubmit").addEventListener("click", () => {
      const name = $("#ncName").value.trim(); if (!name) return toast("캠페인명을 입력해 주세요.");
      const start = $("#ncStart").value, end = $("#ncEnd").value;
      const status = new Date(start) > TODAY ? "예약" : "진행중";
      campaigns.unshift({ id: "CMP-" + (Date.now() % 10000), name, adv: $("#ncAdv").value, plan: $("#ncPlan").value, type: $("#ncType").value, start, end, target: $("#ncTarget").value || "전체", status, budget: +$("#ncBudget").value || 0, imp: 0, clk: 0 });
      cmpFilter = "전체"; $$("#cmpFilter button").forEach((x, i) => x.classList.toggle("on", i === 0));
      renderCampaigns(); closeModal(); toast(`'${name}' 캠페인이 생성되었습니다 (${status}).`);
    });
  }
  function bindCampaigns() {
    $("#cmpFilter").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; $$("#cmpFilter button").forEach((x) => x.classList.remove("on")); b.classList.add("on"); cmpFilter = b.dataset.f; renderCampaigns(); });
    $("#newCmpBtn").addEventListener("click", openCmpModal);
    $("#cmpGrid").addEventListener("click", (e) => {
      const p = e.target.closest("[data-pause]"); const v = e.target.closest("[data-view]");
      if (p) { const c = campaigns.find((x) => x.id === p.dataset.pause); c.status = "종료"; renderCampaigns(); toast(`'${c.name}' 캠페인을 중지했습니다.`); }
      if (v) { goPane("creatives"); toast("해당 캠페인의 소재로 이동합니다."); }
    });
  }

  /* =====================================================
   *  Creatives
   * ===================================================*/
  function creMock(type) {
    const m = {
      feed: '<div class="mock" style="left:14px;right:14px;top:30px;height:36px;opacity:.9"></div>',
      popup: '<div class="mock" style="left:24px;right:24px;top:14px;bottom:14px;border-radius:8px;opacity:.9"></div>',
      banner: '<div class="mock" style="left:10px;right:10px;bottom:14px;height:22px;opacity:.9"></div>',
      bottomsheet: '<div class="mock" style="left:8px;right:8px;bottom:0;top:40px;border-radius:8px 8px 0 0;opacity:.9"></div>',
      slide: '<div class="mock" style="left:10px;top:28px;width:42px;bottom:18px"></div><div class="mock" style="left:58px;top:28px;width:42px;bottom:18px;opacity:.7"></div><div class="mock" style="left:106px;top:28px;width:42px;bottom:18px;opacity:.45"></div>'
    };
    return `<div class="prev">${m[type] || ""}</div>`;
  }
  function renderCreatives() {
    $("#creGrid").innerHTML = Object.keys(D.adTypes).map((k) => { const a = D.adTypes[k]; return `<div class="cre">${creMock(k)}<h5>${a.label}</h5><small>${a.note}</small><span class="pos">${a.pos}</span></div>`; }).join("");
    // active creatives table = derived from campaigns
    const rows = campaigns.filter((c) => c.status !== "예약");
    $("#creBody").innerHTML = rows.map((c) => { const ctr = c.imp ? (c.clk / c.imp * 100).toFixed(2) : "0.00"; return `<tr>
      <td class="num muted">CR-${1000 + (parseInt(c.id.replace(/\D/g, "")) % 90)}</td>
      <td><span class="role role-admin">${typeLabel(c.type)}</span></td>
      <td>${esc(c.name)}</td><td>${esc(advName(c.adv))}</td>
      <td class="num">${num(c.imp)}</td><td class="num">${num(c.clk)}</td><td class="num">${ctr}%</td>
      <td><span class="pill ${c.status === "진행중" ? "pill-on" : "pill-end"}">${c.status === "진행중" ? "노출중" : "종료"}</span></td></tr>`; }).join("");
  }
  function bindCreatives() {
    $("#csvCre").addEventListener("click", () => downloadCSV("MOA_광고소재.csv", ["타입", "위치", "규격"], Object.keys(D.adTypes).map((k) => [D.adTypes[k].label, D.adTypes[k].pos, D.adTypes[k].note])));
  }

  /* =====================================================
   *  Tracking
   * ===================================================*/
  function renderTracking() {
    const sumImp = D.tracking.reduce((s, d) => s + d.imp, 0), sumClk = D.tracking.reduce((s, d) => s + d.clk, 0);
    const ctr = (sumClk / sumImp * 100).toFixed(2);
    $("#trackKpis").innerHTML = [
      { ico: "eye", v: num(sumImp), l: "7일 총 노출", d: "+9.2%", up: true },
      { ico: "click", v: num(sumClk), l: "7일 총 클릭", d: "+14.1%", up: true },
      { ico: "ctr", v: ctr + "%", l: "평균 CTR", d: "+0.21%p", up: true },
      { ico: "camp", v: campaigns.filter((c) => c.status === "진행중").length, l: "활성 캠페인", d: "운영중", up: true }
    ].map(kpiCard).join("");
    buildChart($("#trackChart"), D.tracking);
    const maxImp = Math.max(...campaigns.map((c) => c.imp));
    $("#trackBody").innerHTML = campaigns.map((c) => { const ctr2 = c.imp ? (c.clk / c.imp * 100).toFixed(2) : "0.00"; return `<tr>
      <td><b style="font-weight:600">${esc(c.name)}</b></td><td class="muted">${esc(advName(c.adv))}</td>
      <td><span class="role role-admin">${typeLabel(c.type)}</span></td>
      <td class="num">${num(c.imp)}</td><td class="num">${num(c.clk)}</td><td class="num">${ctr2}%</td>
      <td><div class="bar-cell"><div class="track"><i style="width:${maxImp ? (c.imp / maxImp * 100) : 0}%"></i></div></div></td></tr>`; }).join("");
  }
  function bindTracking() {
    $("#csvTracking").addEventListener("click", () => downloadCSV("MOA_트래킹_캠페인별.csv", ["캠페인", "광고주", "타입", "노출", "클릭", "CTR(%)", "상태", "기간"], campaigns.map((c) => [c.name, advName(c.adv), typeLabel(c.type), c.imp, c.clk, c.imp ? (c.clk / c.imp * 100).toFixed(2) : "0.00", c.status, c.start + "~" + c.end])));
  }

  /* =====================================================
   *  Init
   * ===================================================*/
  badges();
  renderDashboard();
  renderRoleReqs(); renderMembers(); bindMembers();
  renderContent(); bindContent();
  renderReports(); bindReports();
  renderCampaigns(); bindCampaigns();
  renderCreatives(); bindCreatives();
  renderTracking(); bindTracking();
})();
