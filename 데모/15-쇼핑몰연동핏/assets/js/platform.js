(function () {
  "use strict";

  const STORAGE_KEY = "forme-platform-v1";
  const COMMERCE_KEY = "forme-commerce-v2";
  const EVENT_LABELS = {
    widget_open: "위젯 열기",
    recommendation_start: "추천 시작",
    recommendation_result: "결과 확인",
    size_applied: "사이즈 적용",
    add_to_cart: "장바구니",
    purchase: "데모 구매"
  };
  const PRODUCT_NAMES = {
    "contour-blouson": "컨투어 린넨 블루종",
    "soft-tailored-jacket": "소프트 테일러드 재킷",
    "air-cotton-shirt": "에어 코튼 셔츠",
    "curve-knit-top": "커브 니트 탑",
    "arc-wide-trouser": "아크 와이드 트라우저",
    "motion-pleats-skirt": "모션 플리츠 스커트"
  };

  const ui = {
    widgetOpen: false,
    widgetStep: "intro",
    widgetProduct: "contour-blouson",
    widgetError: "",
    widgetResult: null,
    editingWardrobeId: null,
    wardrobeError: "",
    accountDeleteConfirm: false
  };

  function isoDaysAgo(days) {
    return new Date(Date.now() - days * 86400000).toISOString();
  }

  function seededEvents() {
    const stages = ["widget_open", "recommendation_start", "recommendation_result", "size_applied", "add_to_cart", "purchase"];
    const counts = [42, 34, 31, 24, 17, 10];
    const events = [];
    stages.forEach(function (type, stageIndex) {
      for (let index = 0; index < counts[stageIndex]; index += 1) {
        events.push({ id: "seed-" + type + "-" + index, type: type, productId: index % 2 ? "contour-blouson" : "curve-knit-top", createdAt: isoDaysAgo(index % 7), seeded: true });
      }
    });
    return events;
  }

  function freshState() {
    return {
      version: 1,
      member: null,
      kakaoLinked: false,
      profile: { height: 168, weight: 58, fit: "regular" },
      wardrobe: [],
      recommendations: [],
      events: seededEvents(),
      embed: { shopId: "forme-demo", position: "right", accent: "sage", enabled: true },
      adminAuthenticated: false,
      consent: { terms: true, privacy: true, version: "2026.07" }
    };
  }

  function loadState() {
    try {
      return Object.assign(freshState(), JSON.parse(localStorage.getItem(STORAGE_KEY)) || {});
    } catch (_error) {
      return freshState();
    }
  }

  let state = loadState();

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function commerceState() {
    try { return JSON.parse(localStorage.getItem(COMMERCE_KEY)) || {}; }
    catch (_error) { return {}; }
  }

  function syncMember() {
    const commerce = commerceState();
    if (commerce.user && !state.member) {
      state.member = { name: commerce.user.name, email: commerce.user.email, provider: "email" };
      saveState();
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character];
    });
  }

  function icon(name) {
    const paths = {
      arrow: "<path d='M5 12h14M14 7l5 5-5 5'/>",
      close: "<path d='m5 5 14 14M19 5 5 19'/>",
      check: "<path d='m5 12 4 4L19 6'/>",
      closet: "<path d='M5 4h14v16H5zM12 4v16M9 11h.01M15 11h.01'/>",
      chart: "<path d='M4 20V10M10 20V4M16 20v-7M22 20H2'/>",
      code: "<path d='m9 18-6-6 6-6M15 6l6 6-6 6'/>",
      user: "<circle cx='12' cy='8' r='3.5'/><path d='M5 20c.7-4 3-6 7-6s6.3 2 7 6'/>",
      spark: "<path d='m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z'/>",
      trash: "<path d='M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13'/>",
      edit: "<path d='m4 20 4.2-1 10-10-3.2-3.2-10 10L4 20ZM13.8 7l3.2 3.2'/>",
      link: "<path d='M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1'/>",
      warning: "<path d='M12 4 3 20h18L12 4Z'/><path d='M12 9v5M12 17h.01'/>"
    };
    return "<svg viewBox='0 0 24 24' aria-hidden='true'>" + (paths[name] || paths.spark) + "</svg>";
  }

  function record(type, detail) {
    state.events.push({ id: "event-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7), type: type, productId: detail && detail.productId || "contour-blouson", size: detail && detail.size || "", createdAt: new Date().toISOString(), seeded: false });
    saveState();
  }

  function notify(message) {
    const toast = document.querySelector(".site-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add("is-visible");
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
      window.setTimeout(function () { toast.hidden = true; }, 250);
    }, 2400);
  }

  function platformNav(active) {
    const items = [
      ["wardrobe", "내 옷장"],
      ["account/settings", "설정"],
      ["embed", "임베드"],
      ["admin", "운영자"]
    ];
    return "<nav class='platform-nav' aria-label='핏 플랫폼 메뉴'>" + items.map(function (item) {
      return "<a href='#" + item[0] + "'" + (active === item[0] ? " aria-current='page'" : "") + ">" + item[1] + "</a>";
    }).join("") + "</nav>";
  }

  function pageHero(kicker, title, description, active) {
    return "<section class='platform-hero'><div><p class='eyebrow'>" + kicker + "</p><h1>" + title + "</h1><p>" + description + "</p></div>" + platformNav(active) + "</section>";
  }

  function embedPreviewFrame() {
    const source = "<!doctype html><html lang='ko'><meta charset='utf-8'><meta name='viewport' content='width=device-width'><style>*{box-sizing:border-box}body{display:grid;min-height:100vh;align-content:end;margin:0;padding:24px;background:#17201d;color:#fff;font-family:Arial,'Noto Sans KR',sans-serif;word-break:keep-all}p{margin:0 0 10px;color:#c7d1cc;font-size:12px;line-height:1.6}h2{margin:0 0 14px;font-family:Georgia,'Noto Serif KR',serif;font-size:34px;font-weight:500;line-height:1.05}button{min-height:44px;padding:10px 16px;border:0;border-radius:8px;background:#fff;color:#17201d;font:700 14px Arial,'Noto Sans KR',sans-serif;cursor:pointer}.tag{color:#a8c0b4;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}</style><body><p class='tag'>Isolated widget</p><h2>내 사이즈를<br>30초 안에 확인하세요.</h2><p>호스트 CSS와 분리된 iframe 위젯입니다.</p><button id='open' type='button' disabled>핏 추천 시작</button><script>const button=document.getElementById('open');button.addEventListener('click',function(){parent.postMessage({type:'forme:open-recommendation'},'*')});button.disabled=false<\/script></body></html>";
    return "<iframe class='embed-widget-frame' title='FORME 격리형 핏 추천 위젯 미리보기' sandbox='allow-scripts' srcdoc=\"" + escapeHtml(source) + "\"></iframe>";
  }

  function hydrateEmbedPreview() {
    const preview = document.querySelector(".embed-widget-preview");
    if (!preview) return;
    const template = document.createElement("template");
    template.innerHTML = embedPreviewFrame();
    preview.replaceWith(template.content.firstElementChild);
  }

  function memberGate() {
    return "<section class='auth-shell'><article class='auth-card'><span class='platform-icon'>" + icon("closet") + "</span><p class='eyebrow'>Member only</p><h2>결과를 내 옷장에 이어서 보관하세요.</h2><p>추천은 비회원도 가능하지만 보유 의류, 추천 이력, 착용 피드백은 계정에 안전하게 연결합니다.</p><a class='platform-button' href='#auth'>회원 시작하기" + icon("arrow") + "</a></article></section>";
  }

  function authView() {
    if (state.member) {
      return pageHero("Account", "이미 로그인되어 있습니다.", escapeHtml(state.member.name) + "님의 옷장과 설정을 이어서 이용할 수 있습니다.", "") +
        "<section class='platform-page'><div class='platform-card platform-card--accent'><h2>다음 작업</h2><div class='platform-card-actions'><a class='platform-button' href='#wardrobe'>내 옷장 보기" + icon("arrow") + "</a><a class='platform-button platform-button--secondary' href='#account/settings'>계정 설정</a></div></div></section>";
    }
    return pageHero("Member access", "추천을 <span class='platform-nowrap'>내 기준으로</span> 축적하세요.", "자체 계정과 Kakao 연결을 모두 시뮬레이션하며 실제 외부 인증 정보는 전송하지 않습니다.", "") +
      "<section class='auth-shell'><form class='auth-card platform-form' data-platform-form='member-auth'><p class='eyebrow'>Email account</p><h2>가입과 로그인을 한 번에</h2><label>이름<input name='name' required autocomplete='name' placeholder='이름'></label><label>이메일<input name='email' type='email' required autocomplete='email' placeholder='name@example.com'></label><label>비밀번호<input name='password' type='password' required minlength='8' autocomplete='current-password' placeholder='8자 이상'></label><label class='platform-check'><input name='consent' type='checkbox' required><span>이용약관과 개인정보 처리방침에 동의합니다.</span></label><button class='platform-button' type='submit'>자체 계정 시작하기" + icon("arrow") + "</button><button class='platform-button platform-button--secondary kakao-button' type='button' data-platform-action='kakao-login'>Kakao로 3초 시작</button><p class='platform-assurance'>프로토타입 인증으로 실제 비밀번호와 Kakao 토큰은 저장하지 않습니다.</p></form></section>";
  }

  function wardrobeCard(item) {
    return "<article class='wardrobe-card'><div class='wardrobe-card-visual' data-category='" + escapeHtml(item.category) + "'><span>" + escapeHtml(item.category) + "</span><strong>" + escapeHtml(item.size) + "</strong></div><div class='wardrobe-card-copy'><p>" + escapeHtml(item.brand || "브랜드 미입력") + "</p><h3>" + escapeHtml(item.name) + "</h3><dl><div><dt>보유 사이즈</dt><dd>" + escapeHtml(item.size) + "</dd></div><div><dt>착용감</dt><dd>" + escapeHtml(item.fitNote || "피드백 대기") + "</dd></div></dl><span class='platform-status'>" + (item.source === "url" ? "URL 가져오기" : "수동 등록") + "</span><div class='wardrobe-item-actions'><button type='button' data-platform-action='edit-wardrobe' data-id='" + item.id + "'>" + icon("edit") + "수정</button><button type='button' data-platform-action='delete-wardrobe' data-id='" + item.id + "'>" + icon("trash") + "삭제</button></div></div></article>";
  }

  function wardrobeForm() {
    const item = state.wardrobe.find(function (entry) { return entry.id === ui.editingWardrobeId; }) || {};
    return "<form class='platform-card platform-form wardrobe-form' data-platform-form='wardrobe'><div class='platform-card-head'><div><p class='eyebrow'>" + (item.id ? "Edit item" : "Add item") + "</p><h2>옷 등록하기</h2></div><span class='platform-chip'>URL · 수동 입력</span></div>" +
      (ui.wardrobeError ? "<p class='platform-status is-error' role='alert'>" + icon("warning") + escapeHtml(ui.wardrobeError) + "</p>" : "") +
      "<input type='hidden' name='id' value='" + escapeHtml(item.id || "") + "'><label class='full-field'>상품 URL <span>선택</span><input name='url' type='url' placeholder='https://forme.demo/products/...' value='" + escapeHtml(item.sourceUrl || "") + "'><small>지원 데모 URL은 자동으로 읽고, 그 외 URL은 수동 보정을 안내합니다.</small></label><div class='platform-field-grid'><label>브랜드<input name='brand' placeholder='FORME' value='" + escapeHtml(item.brand || "") + "'></label><label>상품명<input name='name' required placeholder='리넨 블루종' value='" + escapeHtml(item.name || "") + "'></label><label>카테고리<select name='category'><option>아우터</option><option>상의</option><option>하의</option><option>원피스</option></select></label><label>보유 사이즈<select name='size'>" + ["S", "M", "L", "XL", "Free"].map(function (size) { return "<option" + (item.size === size ? " selected" : "") + ">" + size + "</option>"; }).join("") + "</select></label></div><label class='full-field'>실제 착용감<textarea name='fitNote' rows='3' placeholder='어깨는 잘 맞고 가슴은 조금 여유로워요.'>" + escapeHtml(item.fitNote || "") + "</textarea></label><div class='platform-card-actions'><button class='platform-button' type='submit'>" + (item.id ? "변경 저장" : "옷장에 추가") + icon("arrow") + "</button>" + (item.id ? "<button class='platform-button platform-button--secondary' type='button' data-platform-action='cancel-wardrobe-edit'>취소</button>" : "") + "</div></form>";
  }

  function wardrobeView() {
    syncMember();
    const head = pageHero("My wardrobe", "관심이 아니라, <span class='platform-nowrap'>이미 가진</span> 옷의 기준.", "보유 의류의 실제 사이즈와 착용감을 쌓아 다음 추천의 근거로 활용합니다.", "wardrobe");
    if (!state.member) return head + memberGate();
    const cards = state.wardrobe.length ? state.wardrobe.map(wardrobeCard).join("") : "<div class='empty-panel'><span class='platform-icon'>" + icon("closet") + "</span><h2>첫 번째 기준 옷을 등록해보세요.</h2><p>자주 입는 옷 한 벌만 있어도 다음 추천을 더 구체적으로 설명할 수 있습니다.</p></div>";
    const history = state.recommendations.length ? state.recommendations.slice(-4).reverse().map(function (entry) { return "<li><span>" + escapeHtml(entry.size) + "</span><div><strong>" + escapeHtml(PRODUCT_NAMES[entry.productId] || "상품") + "</strong><time datetime='" + escapeHtml(entry.createdAt) + "'>" + new Intl.DateTimeFormat("ko-KR").format(new Date(entry.createdAt)) + "</time></div></li>"; }).join("") : "<li class='is-empty'>아직 저장된 추천 이력이 없습니다.</li>";
    return head + "<section class='platform-page'><div class='platform-grid platform-grid--wardrobe'><div><div class='platform-section-head'><div><p class='eyebrow'>Owned pieces</p><h2>보유 의류 " + state.wardrobe.length + "벌</h2></div><span class='platform-chip'>관심상품과 별도 관리</span></div><div class='wardrobe-grid'>" + cards + "</div></div>" + wardrobeForm() + "</div><section class='platform-card history-card'><div class='platform-card-head'><div><p class='eyebrow'>Recommendation history</p><h2>최근 추천 기록</h2></div><a href='#shop'>새 추천 받기</a></div><ol class='timeline-list'>" + history + "</ol></section></section>";
  }

  function settingsView() {
    syncMember();
    const head = pageHero("Account settings", "내 정보의 연결과 삭제까지 투명하게.", "프로필, 연동, 동의, 계정 삭제를 한 화면에서 확인하고 직접 제어합니다.", "account/settings");
    if (!state.member) return head + memberGate();
    return head + "<section class='platform-page'><div class='platform-grid settings-grid'><form class='platform-card platform-form' data-platform-form='profile'><div class='platform-card-head'><div><p class='eyebrow'>Body profile</p><h2>신체·핏 설정</h2></div><span class='platform-status is-success'>저장됨</span></div><div class='platform-field-grid'><label>키<input name='height' type='number' min='140' max='210' required value='" + state.profile.height + "'></label><label>몸무게<input name='weight' type='number' min='35' max='150' required value='" + state.profile.weight + "'></label></div><label>선호 핏<select name='fit'><option value='slim'" + (state.profile.fit === "slim" ? " selected" : "") + ">슬림</option><option value='regular'" + (state.profile.fit === "regular" ? " selected" : "") + ">정사이즈</option><option value='relaxed'" + (state.profile.fit === "relaxed" ? " selected" : "") + ">여유롭게</option></select></label><button class='platform-button' type='submit'>프로필 저장" + icon("arrow") + "</button></form><div class='platform-card'><p class='eyebrow'>Account connection</p><h2>로그인과 연결</h2><ul class='settings-list'><li><div><strong>자체 계정</strong><span>" + escapeHtml(state.member.email) + "</span></div><span class='platform-status is-success'>연결됨</span></li><li><div><strong>Kakao 연결</strong><span>간편 로그인 상태를 시뮬레이션합니다.</span></div><button type='button' data-platform-action='toggle-kakao' class='platform-button platform-button--compact'>" + (state.kakaoLinked ? "연결 해제" : "연결하기") + "</button></li></ul><form class='platform-form password-form' data-platform-form='password'><label>새 비밀번호<input name='password' type='password' minlength='8' required placeholder='8자 이상'></label><button class='platform-button platform-button--secondary' type='submit'>비밀번호 변경</button></form></div></div><div class='platform-grid settings-grid'><article class='policy-card'><p class='eyebrow'>Consent & privacy</p><h2>동의와 데이터</h2><p>이용약관·개인정보 처리방침 " + escapeHtml(state.consent.version) + " 버전에 동의했습니다. 추천 데이터는 이 데모 브라우저에만 저장됩니다.</p><div class='platform-card-actions'><a href='#terms'>이용약관</a><a href='#privacy'>개인정보 처리방침</a></div></article><article class='danger-zone'><span class='platform-icon'>" + icon("warning") + "</span><div><p class='eyebrow'>Danger zone</p><h2>계정과 저장 데이터 삭제</h2><p>옷장, 추천 이력, 프로필, 로그인 상태를 이 브라우저에서 모두 삭제합니다.</p>" + (ui.accountDeleteConfirm ? "<div class='delete-confirm' role='alert'><strong>삭제 후 복구할 수 없습니다.</strong><button type='button' data-platform-action='delete-account-confirmed'>모든 데이터 삭제</button><button type='button' data-platform-action='cancel-delete-account'>취소</button></div>" : "<button type='button' data-platform-action='request-delete-account'>계정 삭제</button>") + "</div></article></div></section>";
  }

  function embedView() {
    const code = "<script src=\"https://cdn.forme.demo/widget.js\" data-shop=\"" + state.embed.shopId + "\" data-position=\"" + state.embed.position + "\" defer><\/script>";
    const preview = "<aside class='embed-widget-preview'><p class='eyebrow'>Isolated widget</p><h3>내 사이즈를<br>30초 안에 확인하세요.</h3><p>호스트 CSS와 격리된 데모 위젯입니다.</p><button type='button' data-platform-action='open-embed-widget'>핏 추천 시작</button></aside>";
    return pageHero("Merchant embed", "외부 쇼핑몰 안에서도 같은 추천 경험.", "Cafe24형 상품 페이지를 가정해 설치, 상품 컨텍스트 전달, 옵션 적용과 이벤트 통신을 한 번에 시연합니다.", "embed") +
      "<section class='platform-page'><div class='embed-demo'><form class='platform-card platform-form embed-config' data-platform-form='embed'><div class='platform-card-head'><div><p class='eyebrow'>Install config</p><h2>설치 설정</h2></div><span class='platform-status is-success'>샌드박스 정상</span></div><label>상점 ID<input name='shopId' required value='" + escapeHtml(state.embed.shopId) + "'></label><label>위젯 위치<select name='position'><option value='right'" + (state.embed.position === "right" ? " selected" : "") + ">오른쪽 하단</option><option value='left'" + (state.embed.position === "left" ? " selected" : "") + ">왼쪽 하단</option></select></label><label>강조색<select name='accent'><option value='sage'>FORME 세이지</option><option value='coral'>코랄</option></select></label><label class='platform-check'><input name='enabled' type='checkbox'" + (state.embed.enabled ? " checked" : "") + "><span>상품 상세에서 위젯 사용</span></label><button class='platform-button' type='submit'>설정 적용" + icon("arrow") + "</button><div class='code-block'><div><span>설치 스크립트</span><button type='button' data-platform-action='copy-embed'>복사</button></div><code>" + escapeHtml(code) + "</code></div></form><div class='embed-host'><div class='embed-host-bar'><span>PARTNER SHOP / PDP</span><span class='platform-status is-success'>host connected</span></div><article class='embed-product'><div class='embed-product-visual'><span>PARTNER<br>PRODUCT</span></div><div><p>Outer / New</p><h2>파트너 리넨 재킷</h2><strong>179,000원</strong><label>사이즈<select data-embed-size><option>선택해주세요</option><option>S</option><option>M</option><option>L</option></select></label><button type='button'>장바구니 담기</button></div></article>" + preview + "</div></div><div class='platform-grid integration-grid'><article class='platform-card'><span class='platform-icon'>" + icon("code") + "</span><h2>상품 컨텍스트</h2><p>상품 ID, 카테고리, 실측, 옵션 값을 위젯 서비스 어댑터에 전달합니다.</p></article><article class='platform-card'><span class='platform-icon'>" + icon("link") + "</span><h2>옵션 브리지</h2><p>추천 결과의 사이즈를 호스트 상품 옵션에 반영하고 적용 이벤트를 기록합니다.</p></article><article class='platform-card'><span class='platform-icon'>" + icon("chart") + "</span><h2>상태 관측</h2><p>열기, 추천, 적용, 전환 이벤트를 운영자 화면의 같은 퍼널로 연결합니다.</p></article></div></section>";
  }

  function funnelCounts() {
    return Object.keys(EVENT_LABELS).map(function (type) {
      return { type: type, label: EVENT_LABELS[type], count: state.events.filter(function (event) { return event.type === type; }).length };
    });
  }

  function adminView() {
    if (!state.adminAuthenticated) {
      return pageHero("Operations", "운영 데이터는 별도 권한으로.", "소비자 계정과 분리된 데모 운영자 인증 후 읽기 전용 지표를 확인합니다.", "admin") + "<section class='auth-shell'><form class='auth-card platform-form' data-platform-form='admin-login'><span class='platform-icon'>" + icon("chart") + "</span><p class='eyebrow'>Admin access</p><h2>운영자 데모 로그인</h2><label>운영자 ID<input name='adminId' required value='operator'></label><label>접근 코드<input name='accessCode' type='password' required value='demo2026'></label><button class='platform-button' type='submit'>대시보드 열기" + icon("arrow") + "</button><p class='platform-assurance'>실제 운영 계정이 아닌 역할 분리 시뮬레이션입니다.</p></form></section>";
    }
    const funnel = funnelCounts();
    const max = Math.max.apply(null, funnel.map(function (entry) { return entry.count; }).concat([1]));
    const requests = funnel[1].count;
    const purchases = funnel[5].count;
    const applied = funnel[3].count;
    const productRows = Object.keys(PRODUCT_NAMES).slice(0, 4).map(function (productId) {
      const productEvents = state.events.filter(function (event) { return event.productId === productId; });
      return "<tr><th>" + PRODUCT_NAMES[productId] + "</th><td>" + productEvents.filter(function (event) { return event.type === "recommendation_result"; }).length + "</td><td>" + productEvents.filter(function (event) { return event.type === "size_applied"; }).length + "</td><td>" + productEvents.filter(function (event) { return event.type === "purchase"; }).length + "</td></tr>";
    }).join("");
    return "<section class='admin-shell'><aside class='admin-sidebar'><a class='commerce-logo' href='#home'>FORME</a><p>Operations</p><nav aria-label='운영 메뉴'><a href='#admin' aria-current='page'>" + icon("chart") + "대시보드</a><a href='#embed'>" + icon("code") + "임베드 상태</a><a href='#home'>" + icon("arrow") + "스토어 보기</a></nav><button type='button' data-platform-action='admin-logout'>운영자 로그아웃</button></aside><main class='admin-main' id='main-content' tabindex='-1'><header class='admin-head'><div><p class='eyebrow'>Last 7 days</p><h1>추천 운영 현황</h1><p>읽기 전용 데모 데이터와 현재 세션 이벤트를 함께 표시합니다.</p></div><div><span class='platform-status is-success'>서비스 정상</span><button type='button' data-platform-action='reset-demo-data'>데모 데이터 초기화</button></div></header><section class='metric-grid'><article class='metric-card'><span>추천 요청</span><strong>" + requests + "</strong><small>지난 7일 누적</small></article><article class='metric-card'><span>사이즈 적용률</span><strong>" + Math.round(applied / Math.max(requests, 1) * 100) + "%</strong><small>추천 시작 대비</small></article><article class='metric-card'><span>구매 전환율</span><strong>" + Math.round(purchases / Math.max(requests, 1) * 100) + "%</strong><small>추천 시작 대비</small></article><article class='metric-card'><span>임베드 상태</span><strong class='metric-word'>정상</strong><small>최근 오류 0건</small></article></section><section class='admin-grid'><article class='platform-card'><div class='platform-card-head'><div><p class='eyebrow'>Conversion funnel</p><h2>추천에서 구매까지</h2></div><span class='platform-chip'>세션 이벤트 포함</span></div><ol class='funnel-list'>" + funnel.map(function (entry, index) { return "<li><span>0" + (index + 1) + "</span><div><div><strong>" + entry.label + "</strong><b>" + entry.count + "</b></div><div class='funnel-bar'><i style='--funnel-width:" + Math.round(entry.count / max * 100) + "%'></i></div></div></li>"; }).join("") + "</ol></article><article class='platform-card'><div class='platform-card-head'><div><p class='eyebrow'>Embed health</p><h2>연동 상태</h2></div><span class='platform-status is-success'>Live</span></div><ul class='settings-list'><li><div><strong>상품 컨텍스트</strong><span>마지막 수신 1분 전</span></div><span class='platform-status is-success'>정상</span></li><li><div><strong>옵션 브리지</strong><span>적용 성공률 100%</span></div><span class='platform-status is-success'>정상</span></li><li><div><strong>이벤트 큐</strong><span>대기 0건</span></div><span class='platform-status is-success'>정상</span></li></ul></article></section><section class='platform-card table-card'><div class='platform-card-head'><div><p class='eyebrow'>Product summary</p><h2>상품별 추천 요약</h2></div><span>최근 7일</span></div><div class='data-table'><table><thead><tr><th>상품</th><th>추천 결과</th><th>사이즈 적용</th><th>구매</th></tr></thead><tbody>" + productRows + "</tbody></table></div></section></main></section>";
  }

  function policyView(kind) {
    const privacy = kind === "privacy";
    return pageHero(privacy ? "Privacy" : "Terms", privacy ? "개인정보 처리방침" : "이용약관", "데모 서비스의 데이터 처리와 이용 경계를 이해하기 쉽게 안내합니다.", "") + "<section class='platform-page'><article class='policy-card policy-document'><p class='eyebrow'>Version 2026.07</p><h2>" + (privacy ? "브라우저 저장과 삭제" : "프로토타입 이용 조건") + "</h2><h3>1. 적용 범위</h3><p>이 사이트는 AI 사이즈 추천 서비스의 동작을 보여주는 프런트엔드 데모이며 실제 결제, 외부 인증, 서버 전송을 수행하지 않습니다.</p><h3>2. 저장 데이터</h3><p>신체 프로필, 옷장, 추천 이력, 장바구니와 주문 데모 데이터는 현재 브라우저의 로컬 저장소에만 보관됩니다.</p><h3>3. 사용자 제어</h3><p>계정 설정에서 저장 정보를 확인하고 전체 삭제할 수 있습니다. 삭제 즉시 이 브라우저의 회원·옷장·추천 데이터가 제거됩니다.</p><h3>4. 외부 연동</h3><p>Kakao 로그인과 Cafe24형 스크립트 설치는 화면 및 계약 시뮬레이션이며 실제 토큰이나 외부 고객 데이터는 취급하지 않습니다.</p><a class='platform-button' href='#account/settings'>설정으로 돌아가기" + icon("arrow") + "</a></article></section>";
  }

  function currentProductFromRoute() {
    const match = location.hash.match(/^#product\/([^?]+)/);
    return match ? match[1] : "contour-blouson";
  }

  function widgetShell(path) {
    if (!(path === "home" || path === "shop" || path.indexOf("product/") === 0)) return "";
    ui.widgetProduct = currentProductFromRoute();
    if (!ui.widgetOpen) {
      return "<button class='widget-launcher' type='button' data-platform-action='widget-toggle' aria-label='빠른 핏 추천 열기' aria-expanded='false' aria-controls='forme-widget-panel'><span>" + icon("spark") + "</span><span><small>FORME FIT</small><strong>내 사이즈 찾기</strong></span></button>";
    }
    let body = "";
    if (ui.widgetStep === "intro") {
      body = "<div class='widget-intro'><p class='eyebrow'>Fit in 30 seconds</p><h2>이 상품, 나에게는<br>어떻게 맞을까요?</h2><p>키와 몸무게, 선호 핏을 상품 실측과 비교해 근거가 있는 사이즈를 제안합니다.</p><ul><li>로그인 없이 결과 확인</li><li>상품 옵션에 바로 적용</li><li>회원은 옷장과 이력 저장</li></ul><button class='platform-button' type='button' data-platform-action='widget-input'>추천 시작" + icon("arrow") + "</button></div>";
    } else if (ui.widgetStep === "input") {
      body = "<form class='platform-form widget-form' data-platform-form='widget'><p class='eyebrow'>Quick input / 01</p><h2>나의 기준을 알려주세요.</h2>" + (ui.widgetError ? "<p class='platform-status is-error' role='alert'>" + escapeHtml(ui.widgetError) + "</p>" : "") + "<div class='platform-field-grid'><label>키<input name='height' type='number' min='140' max='210' required value='" + state.profile.height + "'><span>cm</span></label><label>몸무게<input name='weight' type='number' min='35' max='150' required value='" + state.profile.weight + "'><span>kg</span></label></div><label>선호 핏<select name='fit'><option value='slim'>슬림하게</option><option value='regular' selected>정사이즈</option><option value='relaxed'>여유롭게</option></select></label><button class='platform-button' type='submit'>추천 사이즈 확인" + icon("arrow") + "</button></form>";
    } else if (ui.widgetStep === "analyzing") {
      body = "<div class='widget-progress' role='status' aria-live='polite'><div class='widget-orbit'><span></span><i></i></div><p class='eyebrow'>Matching profile</p><h2>상품 실측과 옷장 기준을<br>비교하고 있어요.</h2><ol><li class='is-done'>신체 비율 확인</li><li class='is-done'>상품 실측 비교</li><li>선호 핏 반영</li></ol></div>";
    } else {
      body = "<div class='widget-result'><div class='widget-result-head'><div><p class='eyebrow'>Your best fit / 02</p><h2><strong>" + ui.widgetResult.size + "</strong> 사이즈를 추천해요.</h2></div><span><b>92</b>% match</span></div><p>어깨는 자연스럽고 몸통에는 편안한 여유가 생기는 균형 잡힌 핏입니다.</p><div class='widget-fit-map'><div><span>어깨</span><i><b style='--position:48%'></b></i><strong>정사이즈</strong></div><div><span>가슴</span><i><b style='--position:62%'></b></i><strong>여유 있음</strong></div><div><span>총장</span><i><b style='--position:51%'></b></i><strong>정사이즈</strong></div></div><button class='platform-button' type='button' data-platform-action='widget-apply' data-size='" + ui.widgetResult.size + "'>" + ui.widgetResult.size + " 사이즈 적용" + icon("check") + "</button><button class='platform-button platform-button--secondary' type='button' data-platform-action='widget-save'>내 옷장에 결과 저장</button><p class='platform-assurance'>입력 정보와 상품 실측을 기반으로 한 예상 결과입니다.</p></div>";
    }
    return "<aside class='widget-panel' id='forme-widget-panel' role='dialog' aria-modal='false' aria-labelledby='forme-widget-title'><header><div><span class='platform-status is-success'>상품 연결됨</span><strong id='forme-widget-title'>" + escapeHtml(PRODUCT_NAMES[ui.widgetProduct] || "FORME 상품") + "</strong></div><button type='button' data-platform-action='widget-toggle' aria-label='핏 추천 닫기'>" + icon("close") + "</button></header>" + body + "</aside>";
  }

  function renderRoute(path) {
    syncMember();
    if (path === "auth") return { title: "회원 시작 — FORME", html: authView() };
    if (path === "wardrobe") return { title: "내 옷장 — FORME", html: wardrobeView() };
    if (path === "account/settings") return { title: "계정 설정 — FORME", html: settingsView() };
    if (path === "embed") {
      queueMicrotask(hydrateEmbedPreview);
      return { title: "임베드 데모 — FORME", html: embedView() };
    }
    if (path === "admin") return { title: "운영자 대시보드 — FORME", html: adminView(), standalone: state.adminAuthenticated };
    if (path === "privacy" || path === "terms") return { title: (path === "privacy" ? "개인정보 처리방침" : "이용약관") + " — FORME", html: policyView(path) };
    return null;
  }

  function rerender() {
    if (window.FORMECommerce && window.FORMECommerce.render) window.FORMECommerce.render();
  }

  function setMember(member) {
    state.member = member;
    saveState();
    if (window.FORMECommerce && window.FORMECommerce.setUser) window.FORMECommerce.setUser(member);
  }

  function recommend(profile) {
    const score = profile.height + profile.weight * 0.72 + (profile.fit === "relaxed" ? 8 : profile.fit === "slim" ? -7 : 0);
    return score < 200 ? "S" : score < 222 ? "M" : score < 244 ? "L" : "XL";
  }

  function openEmbedWidget() {
    ui.widgetOpen = true;
    ui.widgetStep = "input";
    ui.widgetProduct = "soft-tailored-jacket";
    location.hash = "product/soft-tailored-jacket";
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("[data-platform-action]");
    if (!target) return;
    const action = target.dataset.platformAction;
    if (action === "widget-toggle") {
      const closing = ui.widgetOpen;
      ui.widgetOpen = !ui.widgetOpen;
      if (ui.widgetOpen) { ui.widgetStep = "intro"; record("widget_open", { productId: currentProductFromRoute() }); }
      rerender();
      const panel = document.getElementById("forme-widget-panel");
      if (panel) { panel.tabIndex = -1; panel.focus(); }
      if (closing) {
        const launcher = document.querySelector(".widget-launcher");
        if (launcher) launcher.focus();
      }
    }
    if (action === "widget-input" || action === "open-embed-widget") {
      ui.widgetOpen = true;
      ui.widgetStep = "input";
      ui.widgetProduct = action === "open-embed-widget" ? "soft-tailored-jacket" : currentProductFromRoute();
      if (action === "open-embed-widget") location.hash = "product/soft-tailored-jacket";
      else rerender();
    }
    if (action === "widget-apply") {
      record("size_applied", { productId: ui.widgetProduct, size: target.dataset.size });
      ui.widgetOpen = false;
      if (window.FORMECommerce && window.FORMECommerce.applySize) window.FORMECommerce.applySize(ui.widgetProduct, target.dataset.size);
      notify(target.dataset.size + " 사이즈를 상품 옵션에 적용했습니다.");
    }
    if (action === "widget-save") {
      if (!state.member) { location.hash = "auth"; notify("결과 저장을 위해 회원 시작 화면으로 이동했습니다."); return; }
      notify("추천 결과가 내 이력에 저장되어 있습니다.");
    }
    if (action === "kakao-login") {
      state.kakaoLinked = true;
      setMember({ name: "Kakao 데모 사용자", email: "kakao-demo@local.invalid", provider: "kakao" });
      location.hash = "wardrobe";
    }
    if (action === "toggle-kakao") { state.kakaoLinked = !state.kakaoLinked; saveState(); rerender(); notify(state.kakaoLinked ? "Kakao 연결을 완료했습니다." : "Kakao 연결을 해제했습니다."); }
    if (action === "edit-wardrobe") { ui.editingWardrobeId = target.dataset.id; ui.wardrobeError = ""; rerender(); }
    if (action === "cancel-wardrobe-edit") { ui.editingWardrobeId = null; ui.wardrobeError = ""; rerender(); }
    if (action === "delete-wardrobe") { state.wardrobe = state.wardrobe.filter(function (item) { return item.id !== target.dataset.id; }); saveState(); rerender(); notify("옷장에서 삭제했습니다."); }
    if (action === "request-delete-account") { ui.accountDeleteConfirm = true; rerender(); }
    if (action === "cancel-delete-account") { ui.accountDeleteConfirm = false; rerender(); }
    if (action === "delete-account-confirmed") {
      state = freshState();
      saveState();
      if (window.FORMECommerce && window.FORMECommerce.setUser) window.FORMECommerce.setUser(null);
      localStorage.removeItem(COMMERCE_KEY);
      ui.accountDeleteConfirm = false;
      location.hash = "home";
      notify("계정과 저장 데이터를 삭제했습니다.");
    }
    if (action === "admin-logout") { state.adminAuthenticated = false; saveState(); rerender(); }
    if (action === "reset-demo-data") { state.events = seededEvents(); saveState(); rerender(); notify("운영 데모 데이터를 초기화했습니다."); }
    if (action === "copy-embed") {
      const code = document.querySelector(".code-block code");
      if (code && navigator.clipboard) navigator.clipboard.writeText(code.textContent);
      notify("설치 스크립트를 복사했습니다.");
    }
  });

  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "forme:open-recommendation") return;
    const frame = document.querySelector(".embed-widget-frame");
    if (!frame || event.source !== frame.contentWindow) return;
    openEmbedWidget();
  });

  document.addEventListener("submit", function (event) {
    const form = event.target.closest("[data-platform-form]");
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    const type = form.dataset.platformForm;
    if (type === "member-auth") {
      setMember({ name: String(data.get("name")), email: String(data.get("email")), provider: "email" });
      location.hash = "wardrobe";
    }
    if (type === "widget") {
      const profile = { height: Number(data.get("height")), weight: Number(data.get("weight")), fit: String(data.get("fit")) };
      if (profile.height < 140 || profile.height > 210 || profile.weight < 35 || profile.weight > 150) { ui.widgetError = "키 140–210cm, 몸무게 35–150kg 범위로 입력해주세요."; rerender(); return; }
      state.profile = profile;
      ui.widgetError = "";
      ui.widgetStep = "analyzing";
      record("recommendation_start", { productId: ui.widgetProduct });
      rerender();
      window.setTimeout(function () {
        const size = recommend(profile);
        ui.widgetResult = { size: size, productId: ui.widgetProduct };
        ui.widgetStep = "result";
        state.recommendations.push({ id: "rec-" + Date.now(), productId: ui.widgetProduct, size: size, profile: profile, createdAt: new Date().toISOString() });
        record("recommendation_result", { productId: ui.widgetProduct, size: size });
        rerender();
      }, 650);
    }
    if (type === "wardrobe") {
      const url = String(data.get("url") || "").trim();
      const name = String(data.get("name") || "").trim();
      const id = String(data.get("id") || "");
      if (url && !/forme\.demo|127\.0\.0\.1|localhost/.test(url)) { ui.wardrobeError = "지원되지 않는 URL입니다. 상품명을 수동 입력해 등록을 계속해주세요."; rerender(); return; }
      const duplicate = state.wardrobe.find(function (item) { return item.id !== id && ((url && item.sourceUrl === url) || (item.name === name && item.size === String(data.get("size")))); });
      if (duplicate) { ui.wardrobeError = "같은 URL 또는 상품·사이즈가 이미 옷장에 있습니다."; rerender(); return; }
      const item = { id: id || "wardrobe-" + Date.now(), source: url ? "url" : "manual", sourceUrl: url, brand: String(data.get("brand") || ""), name: name, category: String(data.get("category")), size: String(data.get("size")), fitNote: String(data.get("fitNote") || ""), updatedAt: new Date().toISOString() };
      const index = state.wardrobe.findIndex(function (entry) { return entry.id === id; });
      if (index >= 0) state.wardrobe[index] = item; else state.wardrobe.unshift(item);
      ui.editingWardrobeId = null;
      ui.wardrobeError = "";
      saveState(); rerender(); notify(index >= 0 ? "옷장 정보를 수정했습니다." : "내 옷장에 추가했습니다.");
    }
    if (type === "profile") { state.profile = { height: Number(data.get("height")), weight: Number(data.get("weight")), fit: String(data.get("fit")) }; saveState(); rerender(); notify("신체·핏 프로필을 저장했습니다."); }
    if (type === "password") { form.reset(); notify("데모 비밀번호를 변경했습니다."); }
    if (type === "embed") { state.embed = { shopId: String(data.get("shopId")), position: String(data.get("position")), accent: String(data.get("accent")), enabled: data.get("enabled") === "on" }; saveState(); rerender(); notify("임베드 설정을 적용했습니다."); }
    if (type === "admin-login") { state.adminAuthenticated = true; saveState(); rerender(); }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && ui.widgetOpen) {
      ui.widgetOpen = false;
      ui.widgetStep = "intro";
      rerender();
      const launcher = document.querySelector(".widget-launcher");
      if (launcher) launcher.focus();
    }
  });

  window.FORMEPlatform = {
    canRender: function (path) { return ["auth", "wardrobe", "account/settings", "embed", "admin", "privacy", "terms"].includes(path); },
    renderRoute: renderRoute,
    widgetShell: widgetShell,
    record: record,
    setMember: setMember,
    openEmbedWidget: openEmbedWidget,
    resetRuntime: function () { ui.widgetOpen = false; ui.widgetStep = "intro"; ui.widgetError = ""; }
  };
}());
