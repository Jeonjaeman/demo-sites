/* =========================================================
 *  KSSA 데모 — 회원 (로그인/회원가입/마이페이지)
 * =======================================================*/
(function () {
  "use strict";
  const D = window.KSSA || {};
  const authView = document.getElementById("authView");
  const mypageView = document.getElementById("mypageView");
  const title = document.getElementById("memberTitle");
  if (!authView) return;

  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const tabs = document.querySelectorAll(".auth-tabs button");

  function showTab(which) {
    tabs.forEach((b) => b.classList.toggle("on", b.dataset.auth === which));
    loginForm.style.display = which === "login" ? "" : "none";
    signupForm.style.display = which === "signup" ? "" : "none";
    title.textContent = which === "login" ? "회원 로그인" : "기업 회원가입";
  }
  tabs.forEach((b) => b.addEventListener("click", () => showTab(b.dataset.auth)));
  document.getElementById("toSignup")?.addEventListener("click", (e) => { e.preventDefault(); showTab("signup"); });
  document.getElementById("toLogin")?.addEventListener("click", (e) => { e.preventDefault(); showTab("login"); });

  // 로그인 → 마이페이지
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("lg_email").value.trim();
    const pw = document.getElementById("lg_pw").value.trim();
    if (!email || !pw) return window.toast("이메일과 비밀번호를 입력해 주세요.");
    authView.style.display = "none";
    mypageView.style.display = "";
    title.textContent = "마이페이지";
    window.toast("로그인되었습니다. (데모)");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // 회원가입
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const company = document.getElementById("su_company").value.trim();
    const name = document.getElementById("su_name").value.trim();
    const email = document.getElementById("su_email").value.trim();
    const pw = document.getElementById("su_pw").value;
    const pw2 = document.getElementById("su_pw2").value;
    const agree = document.getElementById("su_agree").checked;
    if (!company || !name || !email) return window.toast("기업명·이름·이메일을 모두 입력해 주세요.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return window.toast("올바른 이메일 형식이 아닙니다.");
    if (pw.length < 8) return window.toast("비밀번호는 8자 이상이어야 합니다.");
    if (pw !== pw2) return window.toast("비밀번호가 일치하지 않습니다.");
    if (!agree) return window.toast("약관 및 개인정보 수집·이용 동의가 필요합니다.");
    signupForm.reset();
    showTab("login");
    window.toast("가입 신청이 접수되었습니다. 승인 후 로그인할 수 있습니다.");
  });

  // 마이페이지 네비
  const panes = document.querySelectorAll(".mp-pane");
  document.getElementById("mpNav")?.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-mp]"); if (!a) return;
    e.preventDefault();
    document.querySelectorAll("#mpNav a").forEach((x) => x.classList.remove("on"));
    a.classList.add("on");
    panes.forEach((p) => p.style.display = p.dataset.pane === a.dataset.mp ? "" : "none");
  });
  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    mypageView.style.display = "none";
    authView.style.display = "";
    showTab("login");
    window.toast("로그아웃되었습니다.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document.getElementById("profileForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    window.toast("내 정보가 저장되었습니다. (데모)");
  });

  // 문의 내역 렌더
  const mpInq = document.getElementById("mpInqBody");
  if (mpInq && D.inquiries) {
    const pill = (s) => s === "답변완료" ? '<span class="pill pill-done">답변완료</span>' : '<span class="pill pill-wait">접수</span>';
    mpInq.innerHTML = D.inquiries.map((it) => `<tr>
      <td><span class="tag-badge tag-info">${it.cat}</span></td>
      <td>${it.secret ? "🔒 " : ""}${it.title}</td>
      <td>${pill(it.status)}</td>
      <td class="c-date">${it.date}</td>
    </tr>`).join("");
  }
})();
