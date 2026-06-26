/* =========================================================
 *  KSSA 데모 — 1:1 문의 (inquiry.html)
 * =======================================================*/
(function () {
  "use strict";
  const D = window.KSSA || {};
  const body = document.getElementById("inqBody");
  if (!body) return;

  let list = (D.inquiries || []).map((x) => ({ ...x }));
  let openId = null;

  const lock = '<svg class="lock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:5px"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  const statePill = (s) => s === "답변완료"
    ? '<span class="pill pill-done">답변완료</span>'
    : '<span class="pill pill-wait">접수</span>';

  function detail(it) {
    const ans = it.status === "답변완료"
      ? `<div class="bd-answer"><div class="who"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 01-9 8 9 9 0 01-4-1l-4 1 1-3.5A8.4 8.4 0 1121 11.5z"/></svg>협회 답변 · ${it.answeredAt}</div><div class="body">${it.answer}</div></div>`
      : `<div class="bd-answer" style="border-left-color:#c47d12"><div class="who" style="color:#c47d12"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>답변 준비 중</div><div class="body" style="color:var(--ink-soft)">담당자가 확인 중입니다. 영업일 기준 1~3일 내 답변드립니다.</div></div>`;
    return `<tr class="bd-detail-row"><td colspan="5" style="padding:0"><div class="bd-detail"><div class="inner">
      <div class="meta"><span>분류 · ${it.cat}</span><span>작성일 · ${it.date}</span><span>${it.secret ? "🔒 비밀글" : "공개글"}</span></div>
      <div class="body"><b>Q.</b> ${it.question}</div>
      ${ans}
    </div></div></td></tr>`;
  }

  function render() {
    body.innerHTML = list.map((it, i) => {
      const num = list.length - i;
      const title = (it.secret ? lock : "") + `<span style="font-weight:600">${it.title}</span>`;
      const main = `<tr class="bd-main" data-id="${it.id}">
        <td class="c-num">${num}</td>
        <td><span class="tag-badge tag-info">${it.cat}</span></td>
        <td>${title}</td>
        <td>${statePill(it.status)}</td>
        <td class="c-date">${it.date}</td>
      </tr>`;
      return main + (openId === it.id ? detail(it) : "");
    }).join("");
    if (!list.length) body.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:50px;color:var(--ink-soft)">등록된 문의가 없습니다.</td></tr>`;
  }

  body.addEventListener("click", (e) => {
    const tr = e.target.closest("tr.bd-main"); if (!tr) return;
    const id = +tr.dataset.id;
    openId = openId === id ? null : id;
    render();
  });

  // 작성 폼
  const form = document.getElementById("inqForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const cat = document.getElementById("f_cat").value;
    const title = document.getElementById("f_title").value.trim();
    const text = document.getElementById("f_body").value.trim();
    const secret = document.getElementById("f_secret").checked;
    const agree = document.getElementById("f_agree").checked;
    if (!cat) return window.toast("분류를 선택해 주세요.");
    if (!title) return window.toast("제목을 입력해 주세요.");
    if (!text) return window.toast("문의 내용을 입력해 주세요.");
    if (!agree) return window.toast("개인정보 수집·이용 동의가 필요합니다.");

    const today = new Date().toISOString().slice(0, 10);
    const id = Math.max(0, ...list.map((x) => x.id)) + 1;
    list.unshift({ id, cat, title, date: today, secret, status: "접수", question: text, answer: "", answeredAt: "" });
    openId = id;
    render();
    form.reset();
    document.getElementById("f_secret").checked = true;
    window.toast("문의가 등록되었습니다. 답변은 마이페이지에서 확인하세요.");
    const lenis = window.__lenis;
    lenis ? lenis.scrollTo("#inqBody", { offset: -120 }) : document.getElementById("inqBody").scrollIntoView({ behavior: "smooth" });
  });

  render();
})();
