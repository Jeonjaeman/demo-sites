/* =========================================================
   MIYO · 공통 스크립트 — 리빌 애니메이션 · 로그인 모달 · 토스트 · 예약 저장소
   ========================================================= */
(function (global) {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---- 스크롤 리빌 ---- */
  function reveal() {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    $$(".rv").forEach((el) => io.observe(el));
  }

  /* ---- 토스트 ---- */
  function toast(title, sub, icon) {
    let wrap = $(".toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = '<div class="tic">' + (icon || "🔔") + '</div><div><div>' + title + "</div>" + (sub ? "<small>" + sub + "</small>" : "") + "</div>";
    wrap.appendChild(el);
    setTimeout(() => { el.style.transition = "0.5s"; el.style.opacity = "0"; el.style.transform = "translateY(10px)"; setTimeout(() => el.remove(), 500); }, 4200);
  }

  /* ---- 예약/상담 저장소 (데모: localStorage — 실서비스는 DB 저장, 이력 5년 보존 정책) ---- */
  const KEY = "miyo_bookings";
  function getBookings() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } }
  function addBooking(b) {
    const list = getBookings();
    b.id = "R" + String(2600 + list.length + 1);
    b.status = "wait";
    b.created = new Date().toISOString().slice(0, 16).replace("T", " ");
    b.history = [{ at: b.created, by: "system", note: { ko: "예약 신청 접수 — 병원·운영팀에 실시간 알림 발송", ja: "予約リクエスト受付 — クリニック・運営にリアルタイム通知", en: "Request received — clinic & ops notified in real time" } }];
    list.unshift(b);
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
    return b;
  }
  function updateBooking(id, patch) {
    const list = getBookings();
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) { Object.assign(list[i], patch); try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }
    return list[i];
  }

  /* ---- 로그인 모달 ---- */
  function qrCells() {
    // 의사(疑似) QR 패턴 생성 — 데모용
    let html = "";
    const R = (x) => Math.sin(x * 127.1) * 43758.5453 % 1;
    for (let i = 0; i < 144; i++) {
      const r = Math.abs(R(i + 7));
      const row = Math.floor(i / 12), col = i % 12;
      const finder = (row < 3 && col < 3) || (row < 3 && col > 8) || (row > 8 && col < 3);
      html += '<i class="' + (finder ? "" : r > 0.52 ? "" : "o") + '"></i>';
    }
    return html;
  }
  function loginModalHTML(t) {
    return (
      '<div class="modal-bg" id="loginModal"><div class="modal">' +
      '<button class="x" data-close>✕</button>' +
      '<h3 data-ko="간편 로그인" data-ja="かんたんログイン" data-en="Quick Login">간편 로그인</h3>' +
      '<p class="sub" data-ko="QR 스캔 또는 소셜 계정으로 3초 만에 시작하세요." data-ja="QRスキャンまたはSNSアカウントで3秒でスタート。" data-en="Scan the QR or use a social account — done in 3 seconds.">QR 스캔 또는 소셜 계정으로 3초 만에 시작하세요.</p>' +
      '<div style="display:flex;gap:26px;flex-wrap:wrap;align-items:center">' +
      '<div class="qr-box"><div class="qr-grid">' + qrCells() + '</div><p data-ko="MIYO 앱으로 스캔" data-ja="MIYOアプリでスキャン" data-en="Scan with the MIYO app">MIYO 앱으로 스캔</p></div>' +
      '<div style="flex:1;min-width:200px"><div class="sso" style="flex-direction:column;align-items:stretch">' +
      '<button data-sso="Google"><span class="dot-ic" style="background:#4285F4">G</span> Google</button>' +
      '<button data-sso="Naver"><span class="dot-ic" style="background:#03C75A">N</span> Naver</button>' +
      '<button data-sso="Kakao"><span class="dot-ic" style="background:#FEE500;color:#3C1E1E">K</span> Kakao</button>' +
      '<button data-sso="LINE"><span class="dot-ic" style="background:#06C755">L</span> LINE</button>' +
      "</div></div></div></div></div>"
    );
  }
  function wireLogin() {
    $$("[data-login]").forEach((b) => b.addEventListener("click", () => {
      if (!$("#loginModal")) {
        document.body.insertAdjacentHTML("beforeend", loginModalHTML());
        if (global.I18N) I18N.applyStatic($("#loginModal"));
        $("#loginModal").addEventListener("click", (e) => {
          if (e.target.dataset.close != null || e.target.id === "loginModal") $("#loginModal").classList.remove("show");
          const sso = e.target.closest("[data-sso]");
          if (sso) {
            $("#loginModal").classList.remove("show");
            const L = global.I18N ? I18N.getLang() : "ko";
            toast(
              { ko: sso.dataset.sso + " 로그인 완료 (데모)", ja: sso.dataset.sso + " ログイン完了(デモ)", en: "Signed in with " + sso.dataset.sso + " (demo)" }[L],
              { ko: "실서비스에서는 OAuth 2.0 연동", ja: "本番ではOAuth 2.0連携", en: "OAuth 2.0 in production" }[L], "🔐");
          }
        });
      }
      $("#loginModal").classList.add("show");
    }));
  }

  document.addEventListener("DOMContentLoaded", () => { reveal(); wireLogin(); });
  global.APP = { toast, getBookings, addBooking, updateBooking, $, $$ };
})(window);
