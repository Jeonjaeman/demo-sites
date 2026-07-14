/* ============================================================
   VOLTA Scheduler — Profile (프로필 / 알림 설정)
   ============================================================ */
(function () {
  "use strict";

  function ensureStyle() {
    if (document.getElementById("css-pf")) return;
    const st = document.createElement("style");
    st.id = "css-pf";
    st.textContent = `
.pf-mail{border:1px solid var(--line);border-radius:var(--r-lg);overflow:hidden}
.pf-mail__hd{padding:14px 16px;background:var(--surface-2);border-bottom:1px solid var(--line)}
.pf-mail__row{display:flex;gap:8px;font-size:12.5px;color:var(--muted);margin-top:4px}
.pf-mail__row:first-child{margin-top:0}
.pf-mail__row b{color:var(--ink)}
.pf-mail__bd{padding:16px;font-size:13px;line-height:1.7;color:var(--ink-2)}
.pf-mail__tbl{width:100%;border-collapse:collapse;margin-top:10px}
.pf-mail__tbl td{padding:7px 0;border-bottom:1px solid var(--line);font-size:12.5px}
.pf-mail__tbl td:first-child{color:var(--muted);width:112px}
.pf-sms{display:flex;justify-content:flex-start;padding:6px 0}
.pf-sms__bubble{max-width:300px;background:var(--surface-3);border-radius:16px 16px 16px 4px;padding:12px 14px;font-size:13px;line-height:1.55}
.pf-srow{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}
.pf-srow:last-child{border-bottom:0}
@media (max-width:640px){
  .pf-srow .btn,.pf-srow .lnk{min-height:38px}
}`;
    document.head.appendChild(st);
  }

  let sessions = null;
  function initSessions() {
    if (sessions) return sessions;
    sessions = [
      { id: "s1", device: "Chrome · Windows", loc: "Austin, TX", at: "현재 세션", current: true },
      { id: "s2", device: "Safari · iPhone", loc: "Austin, TX", at: "2시간 전", current: false },
      { id: "s3", device: "Chrome · Windows", loc: "Dallas, TX", at: "어제", current: false },
    ];
    return sessions;
  }

  /* ---------- 알림 카드 ---------- */
  function switchRow(id, title, desc, checked) {
    return `<div class="row" style="justify-content:space-between;align-items:flex-start;gap:14px">
      <div style="min-width:0">
        <b style="font-size:13.5px;display:block">${title}</b>
        <span style="font-size:12px;color:var(--muted);line-height:1.5;display:block;margin-top:2px">${desc}</span>
      </div>
      <label class="switch"><input type="checkbox" id="${id}" ${checked ? "checked" : ""}/><span class="switch__track"></span></label>
    </div>`;
  }

  function notifCardHtml(me, UI) {
    const sms = me.smsOptIn !== undefined ? me.smsOptIn : true;
    const emailDigest = me.emailDigest !== undefined ? me.emailDigest : true;
    const instant = me.instantAlert !== undefined ? me.instantAlert : true;
    const conflictAlert = me.conflictAlert !== undefined ? me.conflictAlert : true;
    return `
    <div class="card">
      <div class="card__hd">
        <h3>알림</h3>
        <p>어떤 방식으로, 어떤 변경 사항을 안내받을지 설정합니다.</p>
        <span class="sp"></span>
        <button class="btn btn--sm" id="pfPreviewBtn">${UI.icon("eye", 14)} 미리보기</button>
      </div>
      <div class="card__bd stack">
        ${switchRow("pfSms", "SMS 알림", "스케줄 변경/승인 결과를 문자로 받습니다.", sms)}
        ${switchRow("pfEmailDigest", "이메일 다이제스트", "하루 동안의 변경 사항을 요약해 매일 이메일로 받습니다.", emailDigest)}
        ${switchRow("pfInstant", "스케줄 변경 즉시 알림", "배정이 변경되는 즉시 알림을 받습니다.", instant)}
        ${switchRow("pfConflict", "충돌 감지 알림", "이중 배정·휴가 중복 등 스케줄 충돌이 감지되면 알림을 받습니다.", conflictAlert)}
        <div class="note" style="margin-top:4px">
          ${UI.icon("info", 16)}
          <div style="flex:1;min-width:0">
            문자(SMS) 메시지 수신에 동의합니다. 이 동의는 스케줄 변경, 휴가 승인/반려 등 업무 알림 수신 목적으로만 사용됩니다.
            메시지 및 데이터 요금이 부과될 수 있으며, 언제든지 <b>STOP</b>을 회신하여 수신을 거부할 수 있습니다.
            자세한 내용은 <a href="#" onclick="return false">개인정보처리방침</a> 및 <a href="#" onclick="return false">이용약관</a>을 참고하세요.
          </div>
        </div>
      </div>
    </div>`;
  }

  function bindNotif(root, STATE, DB, UI, me) {
    const map = { pfSms: "smsOptIn", pfEmailDigest: "emailDigest", pfInstant: "instantAlert", pfConflict: "conflictAlert" };
    Object.keys(map).forEach((id) => {
      const el = UI.$("#" + id, root);
      if (!el) return;
      el.onchange = () => {
        me[map[id]] = el.checked;
        window.dispatchEvent(new CustomEvent("volta:data"));
        UI.toast(el.checked ? "알림을 켰습니다." : "알림을 껐습니다.", { ms: 1800 });
      };
    });
    const pv = UI.$("#pfPreviewBtn", root);
    if (pv) pv.onclick = () => openPreviewModal(UI);
  }

  function mockChangeEvent() {
    return { techName: "Owen Blackwell", project: "CEC3 — Cooling Expansion", date: "2026-07-16", shift: "주간 (Day)", changeType: "배정 변경" };
  }

  function emailPreviewHtml(t, UI) {
    return `<div class="pf-mail">
      <div class="pf-mail__hd">
        <div class="pf-mail__row"><span>보낸사람</span><b>VOLTA Scheduler &lt;no-reply@volta.example&gt;</b></div>
        <div class="pf-mail__row"><span>제목</span><b>[VOLTA] 스케줄 변경 안내 — ${UI.esc(t.date)}</b></div>
      </div>
      <div class="pf-mail__bd">
        <p>안녕하세요, ${UI.esc(t.techName)}님.</p>
        <p>아래와 같이 배정 일정이 변경되어 안내드립니다.</p>
        <table class="pf-mail__tbl">
          <tr><td>변경 유형</td><td>${UI.esc(t.changeType)}</td></tr>
          <tr><td>프로젝트</td><td>${UI.esc(t.project)}</td></tr>
          <tr><td>날짜</td><td>${UI.esc(t.date)}</td></tr>
          <tr><td>시프트</td><td>${UI.esc(t.shift)}</td></tr>
        </table>
        <p style="margin-top:14px">문의사항은 담당 스케줄러에게 연락해 주세요.</p>
      </div>
    </div>`;
  }

  function smsPreviewHtml(t, UI) {
    return `<div class="pf-sms">
      <div class="pf-sms__bubble">[VOLTA] ${UI.esc(t.techName)}님, ${UI.esc(t.date)} ${UI.esc(t.project)} 배정이 변경되었습니다 (${UI.esc(t.shift)}). 상세는 앱에서 확인하세요. 회신 STOP 시 수신거부.</div>
    </div>`;
  }

  function openPreviewModal(UI) {
    const tpl = mockChangeEvent();
    const body = `
      <div class="seg seg--sm" id="pvTabs" style="margin-bottom:14px">
        <button data-v="email" class="is-on">이메일</button>
        <button data-v="sms">SMS</button>
      </div>
      <div id="pvBody"></div>`;
    UI.modal({
      icon: "bell", title: "알림 미리보기", desc: "스케줄 변경 안내가 실제로 어떻게 발송되는지 미리 확인합니다.",
      size: "md",
      body,
      actions: [{ label: "닫기", kind: "quiet" }],
      onMount: (m) => {
        const bodyEl = UI.$("#pvBody", m);
        const draw = (kind) => { bodyEl.innerHTML = kind === "email" ? emailPreviewHtml(tpl, UI) : smsPreviewHtml(tpl, UI); };
        draw("email");
        UI.$$("#pvTabs button", m).forEach((b) => (b.onclick = () => {
          UI.$$("#pvTabs button", m).forEach((x) => x.classList.remove("is-on"));
          b.classList.add("is-on");
          draw(b.dataset.v);
        }));
      },
    });
  }

  /* ---------- 계정 카드 ---------- */
  function accountCardHtml(me, isTech, STATE, DB, UI) {
    if (isTech) {
      const region = STATE.regions.find((r) => r.id === me.regionId);
      return `
      <div class="card">
        <div class="card__hd"><h3>계정</h3><p>내 정보 및 자격 요건입니다.</p><span class="sp"></span><button class="btn btn--sm" id="pfAcctEdit">${UI.icon("edit", 14)} 수정</button></div>
        <div class="card__bd">
          <dl class="kv">
            <dt>이름</dt><dd>${UI.esc(me.name)}</dd>
            <dt>이메일</dt><dd>${UI.esc(me.email)}</dd>
            <dt>전화</dt><dd>${UI.esc(me.phone)}</dd>
            <dt>소속 지역</dt><dd>${region ? UI.esc(region.name) : "-"}</dd>
            <dt>레벨</dt><dd><span class="badge">${UI.esc(me.level)}</span></dd>
          </dl>
          <div class="sep"></div>
          <div class="lbl" style="margin-bottom:8px">보유 스킬</div>
          <div class="row row--wrap" style="gap:6px">${me.skills.map((s) => `<span class="chip">${UI.esc(s)}</span>`).join("")}</div>
          <div class="lbl" style="margin:14px 0 8px">보유 자격증</div>
          <div class="row row--wrap" style="gap:6px">${me.certs.map((c) => `<span class="chip">${UI.icon("shield", 12)}${UI.esc(c)}</span>`).join("")}</div>
        </div>
      </div>`;
    }
    const roleInfo = DB.ROLE[STATE.role] || { label: STATE.role, cls: "" };
    return `
    <div class="card">
      <div class="card__hd"><h3>계정</h3><p>기본 계정 정보입니다.</p><span class="sp"></span><button class="btn btn--sm" id="pfAcctEdit">${UI.icon("edit", 14)} 수정</button></div>
      <div class="card__bd">
        <dl class="kv">
          <dt>이름</dt><dd>${UI.esc(me.name)}</dd>
          <dt>이메일</dt><dd>${UI.esc(me.email)}</dd>
          <dt>역할</dt><dd><span class="badge ${roleInfo.cls}">${roleInfo.label}</span></dd>
          <dt>전화</dt><dd>${UI.esc(me.phone)}</dd>
          <dt>타임존</dt><dd>${UI.esc(me.timezone || "-")}</dd>
          <dt>마지막 로그인</dt><dd>${UI.esc(me.lastSignIn || "-")}</dd>
        </dl>
      </div>
    </div>`;
  }

  function openAccountEditModal(root, STATE, DB, UI, me, isTech) {
    const TZ = ["America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles"];
    const body = `
      <div class="stack">
        <div class="field"><label>이름 <span class="req">*</span></label><input class="input" id="pfName" value="${UI.esc(me.name)}"/>
          <div class="err" id="pfNameErr" hidden>${UI.icon("alertCircle", 13)}이름을 입력하세요.</div>
        </div>
        <div class="field"><label>이메일 <span class="req">*</span></label><input class="input" type="email" id="pfEmail" value="${UI.esc(me.email)}"/>
          <div class="err" id="pfEmailErr" hidden>${UI.icon("alertCircle", 13)}이메일을 입력하세요.</div>
        </div>
        <div class="field"><label>전화번호</label><input class="input" id="pfPhone" value="${UI.esc(me.phone || "")}"/></div>
        ${!isTech ? `<div class="field"><label>타임존</label><select class="select" id="pfTz">${TZ.map((z) => `<option value="${z}" ${me.timezone === z ? "selected" : ""}>${z}</option>`).join("")}</select></div>` : ""}
      </div>`;
    UI.modal({
      icon: "edit", title: "계정 정보 수정", desc: "계정 기본 정보를 수정합니다. (데모 환경 — 새로고침 시 초기화됩니다)",
      body,
      actions: [
        { label: "취소", kind: "quiet" },
        { label: "저장", kind: "primary", onClick: (m) => {
          let ok = true;
          const nameEl = UI.$("#pfName", m), emailEl = UI.$("#pfEmail", m);
          UI.$("#pfNameErr", m).hidden = true; UI.$("#pfEmailErr", m).hidden = true;
          nameEl.classList.remove("is-err"); emailEl.classList.remove("is-err");
          const name = nameEl.value.trim(), email = emailEl.value.trim();
          if (!name) { UI.$("#pfNameErr", m).hidden = false; nameEl.classList.add("is-err"); ok = false; }
          if (!email) { UI.$("#pfEmailErr", m).hidden = false; emailEl.classList.add("is-err"); ok = false; }
          if (!ok) return false;
          me.name = name; me.email = email;
          me.phone = UI.$("#pfPhone", m).value.trim();
          if (!isTech) me.timezone = UI.$("#pfTz", m).value;
          window.dispatchEvent(new CustomEvent("volta:data"));
          UI.toast("계정 정보를 저장했습니다.");
          render(root);
          return true;
        } },
      ],
    });
  }

  /* ---------- 환경설정 카드 ---------- */
  function prefCardHtml(UI) {
    const theme = UI.store.get("themePref", document.documentElement.getAttribute("data-theme") || "light");
    const density = UI.store.get("density", "comfortable");
    const lang = UI.store.get("lang", "ko");
    const weekStart = UI.store.get("weekStart", "sun");
    return `
    <div class="card">
      <div class="card__hd"><h3>환경설정</h3><p>화면 표시 방식을 설정합니다. 변경 즉시 반영됩니다.</p></div>
      <div class="card__bd stack">
        <div class="field"><label>테마</label>
          <div class="seg" id="pfTheme">
            <button data-v="light" class="${theme === "light" ? "is-on" : ""}">${UI.icon("sun", 14)} 라이트</button>
            <button data-v="dark" class="${theme === "dark" ? "is-on" : ""}">${UI.icon("moon", 14)} 다크</button>
            <button data-v="system" class="${theme === "system" ? "is-on" : ""}">${UI.icon("settings", 14)} 시스템</button>
          </div>
        </div>
        <div class="field"><label>밀도</label>
          <div class="seg" id="pfDensity">
            <button data-v="comfortable" class="${density === "comfortable" ? "is-on" : ""}">넉넉하게</button>
            <button data-v="compact" class="${density === "compact" ? "is-on" : ""}">조밀하게</button>
          </div>
        </div>
        <div class="grid2">
          <div class="field"><label>언어</label><select class="select" id="pfLang">
            <option value="ko" ${lang === "ko" ? "selected" : ""}>한국어</option>
            <option value="en" ${lang === "en" ? "selected" : ""}>English</option>
          </select></div>
          <div class="field"><label>주 시작 요일</label><select class="select" id="pfWeekStart">
            <option value="sun" ${weekStart === "sun" ? "selected" : ""}>일요일</option>
            <option value="mon" ${weekStart === "mon" ? "selected" : ""}>월요일</option>
          </select></div>
        </div>
      </div>
    </div>`;
  }

  function bindPref(root, UI) {
    UI.$$("#pfTheme button", root).forEach((b) => (b.onclick = () => {
      UI.$$("#pfTheme button", root).forEach((x) => x.classList.remove("is-on"));
      b.classList.add("is-on");
      const v = b.dataset.v;
      UI.store.set("themePref", v);
      const resolved = v === "system" ? (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : v;
      UI.applyTheme(resolved);
      UI.toast("테마를 변경했습니다.", { ms: 1500 });
    }));
    UI.$$("#pfDensity button", root).forEach((b) => (b.onclick = () => {
      UI.$$("#pfDensity button", root).forEach((x) => x.classList.remove("is-on"));
      b.classList.add("is-on");
      UI.applyDensity(b.dataset.v);
      UI.toast("밀도를 변경했습니다.", { ms: 1500 });
    }));
    const langEl = UI.$("#pfLang", root);
    if (langEl) langEl.onchange = () => { UI.store.set("lang", langEl.value); UI.toast("언어 설정을 저장했습니다. (데모 — 실제 번역은 적용되지 않습니다)", { ms: 2200 }); };
    const wsEl = UI.$("#pfWeekStart", root);
    if (wsEl) wsEl.onchange = () => { UI.store.set("weekStart", wsEl.value); UI.toast("주 시작 요일을 저장했습니다.", { ms: 1800 }); };
  }

  /* ---------- 보안 카드 ---------- */
  function securityCardHtml(UI) {
    return `
    <div class="card">
      <div class="card__hd"><h3>보안</h3><p>비밀번호 및 로그인 세션을 관리합니다.</p></div>
      <div class="card__bd stack">
        <div class="row" style="justify-content:space-between">
          <div><b style="font-size:13.5px;display:block">비밀번호</b><span style="font-size:12px;color:var(--muted)">데모 환경 — 실제로 저장되지 않습니다.</span></div>
          <button class="btn btn--sm" id="pfPwBtn">${UI.icon("lock", 14)} 비밀번호 변경</button>
        </div>
        <div class="sep"></div>
        <div class="lbl" style="margin-bottom:2px">활성 세션</div>
        <div id="pfSessions"></div>
      </div>
    </div>`;
  }

  function sessionRowHtml(s, UI) {
    return `<div class="pf-srow">
      <div class="row" style="gap:10px">
        <span style="color:var(--muted)">${UI.icon("phone", 16)}</span>
        <div>
          <b style="font-size:13px;display:block">${UI.esc(s.device)} ${s.current ? '<span class="badge badge--ok" style="margin-left:6px">현재</span>' : ""}</b>
          <span style="font-size:11.5px;color:var(--muted)">${UI.esc(s.loc)} · ${UI.esc(s.at)}</span>
        </div>
      </div>
      ${!s.current ? `<button class="lnk lnk--danger" data-logout="${s.id}">로그아웃</button>` : ""}
    </div>`;
  }

  function renderSessions(root, UI) {
    const wrap = UI.$("#pfSessions", root);
    if (!wrap) return;
    wrap.innerHTML = initSessions().map((s) => sessionRowHtml(s, UI)).join("");
    UI.$$("[data-logout]", wrap).forEach((b) => (b.onclick = () => {
      const s = sessions.find((x) => x.id === b.dataset.logout);
      if (!s) return;
      UI.confirm({
        title: "세션 로그아웃",
        desc: `${UI.esc(s.device)} (${UI.esc(s.loc)}) 세션을 로그아웃하시겠습니까?`,
        okLabel: "로그아웃",
        onOk: () => {
          const idx = sessions.indexOf(s);
          sessions.splice(idx, 1);
          UI.toast("세션을 로그아웃했습니다.", { undo: () => { sessions.splice(idx, 0, s); renderSessions(root, UI); } });
          renderSessions(root, UI);
        },
      });
    }));
  }

  function openPasswordModal(UI) {
    const body = `
      <div class="note">${UI.icon("info", 16)}<div style="flex:1;min-width:0">이 데모 환경에서는 비밀번호가 실제로 저장되지 않습니다.</div></div>
      <div class="stack" style="margin-top:14px">
        <div class="field"><label>현재 비밀번호</label><input class="input" type="password" placeholder="••••••••"/></div>
        <div class="field"><label>새 비밀번호</label><input class="input" type="password" placeholder="8자 이상"/></div>
        <div class="field"><label>새 비밀번호 확인</label><input class="input" type="password" placeholder="다시 입력"/></div>
      </div>`;
    UI.modal({
      icon: "lock", title: "비밀번호 변경", desc: "보안을 위해 정기적으로 비밀번호를 변경하세요.",
      body,
      actions: [
        { label: "취소", kind: "quiet" },
        { label: "변경", kind: "primary", onClick: () => { UI.toast("비밀번호를 변경했습니다. (데모 — 실제로 저장되지 않음)"); return true; } },
      ],
    });
  }

  /* ---------- 페이지 ---------- */
  function pageHtml(UI, DB, STATE) {
    const isTech = STATE.role === "TECHNICIAN";
    const me = isTech ? DB.ME_TECH : DB.ME;
    return `
      <div class="phead">
        <div><h1>Profile</h1><p>알림 수신 방식과 계정 정보를 관리합니다.</p></div>
      </div>
      <div class="grid2">
        <div class="stack">
          ${notifCardHtml(me, UI)}
          ${accountCardHtml(me, isTech, STATE, DB, UI)}
        </div>
        <div class="stack">
          ${prefCardHtml(UI)}
          ${securityCardHtml(UI)}
        </div>
      </div>
    `;
  }

  function bindPage(root, UI, DB, STATE) {
    const isTech = STATE.role === "TECHNICIAN";
    const me = isTech ? DB.ME_TECH : DB.ME;
    bindNotif(root, STATE, DB, UI, me);
    bindPref(root, UI);
    const acctBtn = UI.$("#pfAcctEdit", root);
    if (acctBtn) acctBtn.onclick = () => openAccountEditModal(root, STATE, DB, UI, me, isTech);
    const pwBtn = UI.$("#pfPwBtn", root);
    if (pwBtn) pwBtn.onclick = () => openPasswordModal(UI);
    renderSessions(root, UI);
  }

  function render(root) {
    ensureStyle();
    const UI = window.UI, DB = window.DB, STATE = window.STATE;
    root.innerHTML = pageHtml(UI, DB, STATE);
    bindPage(root, UI, DB, STATE);
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.profile = { render };
})();
