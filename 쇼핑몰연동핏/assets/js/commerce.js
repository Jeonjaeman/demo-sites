(function () {
  "use strict";

  const STORAGE_KEY = "forme-commerce-v2";
  const PRODUCTS = [
    { id: "contour-blouson", name: "Contour Linen Blouson", ko: "컨투어 린넨 블루종", category: "아우터", price: 189000, tone: "sage", badge: "New", fit: 0, description: "가볍게 구조를 잡은 린넨 혼방 블루종. 여유로운 가슴과 정돈된 어깨선이 특징입니다.", measurements: { S: [48, 56, 61], M: [50, 58, 63], L: [52, 60, 65], XL: [54, 62, 67] } },
    { id: "soft-tailored-jacket", name: "Soft Tailored Jacket", ko: "소프트 테일러드 재킷", category: "아우터", price: 248000, tone: "sand", badge: "Best", fit: 1, description: "힘을 뺀 어깨와 유연한 라펠로 완성한 데일리 테일러드 재킷입니다.", measurements: { S: [42, 51, 68], M: [44, 53, 70], L: [46, 55, 72], XL: [48, 57, 74] } },
    { id: "air-cotton-shirt", name: "Air Cotton Shirt", ko: "에어 코튼 셔츠", category: "상의", price: 98000, tone: "sky", badge: "", fit: -1, description: "공기처럼 가벼운 코튼 포플린과 긴 호흡의 실루엣을 담았습니다.", measurements: { S: [44, 53, 70], M: [46, 55, 72], L: [48, 57, 74], XL: [50, 59, 76] } },
    { id: "curve-knit-top", name: "Curve Knit Top", ko: "커브 니트 탑", category: "상의", price: 119000, tone: "coral", badge: "Fit pick", fit: -2, description: "몸의 곡선을 부드럽게 따라가는 리브 조직과 안정적인 복원력을 갖췄습니다.", measurements: { S: [34, 38, 56], M: [36, 40, 58], L: [38, 42, 60], XL: [40, 44, 62] } },
    { id: "arc-wide-trouser", name: "Arc Wide Trouser", ko: "아크 와이드 트라우저", category: "하의", price: 149000, tone: "ink", badge: "", fit: 1, description: "허리에서 곧게 떨어지는 와이드 라인과 미세한 곡선 절개를 더했습니다.", measurements: { S: [34, 47, 101], M: [36, 49, 103], L: [38, 51, 105], XL: [40, 53, 107] } },
    { id: "motion-pleats-skirt", name: "Motion Pleats Skirt", ko: "모션 플리츠 스커트", category: "하의", price: 139000, tone: "plum", badge: "New", fit: 0, description: "움직임에 따라 빛과 깊이가 달라지는 비대칭 플리츠 스커트입니다.", measurements: { S: [33, 47, 78], M: [35, 49, 80], L: [37, 51, 82], XL: [39, 53, 84] } }
  ];
  const ui = { selectedSizes: {}, fitOpen: null, recommendation: null, analyzing: false, fitError: "", fitDraft: null, returnFocusProduct: null, restoreFitProduct: null, focusMain: true, query: "", category: "전체", sort: "featured", menuOpen: false };

  function freshState() {
    return { cart: [], wishlist: [], user: null, orders: [], fitProfile: null };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Object.assign(freshState(), saved || {});
    } catch (_error) {
      return freshState();
    }
  }

  let state = loadState();

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function money(value) {
    return new Intl.NumberFormat("ko-KR").format(value) + "원";
  }

  function productById(id) {
    return PRODUCTS.find(function (product) { return product.id === id; }) || PRODUCTS[0];
  }

  function cartCount() {
    return state.cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function cartTotal() {
    return state.cart.reduce(function (sum, item) { return sum + productById(item.productId).price * item.qty; }, 0);
  }

  function icon(name) {
    const paths = {
      search: "<circle cx='10.5' cy='10.5' r='6.5'></circle><path d='m15.5 15.5 4 4'></path>",
      bag: "<path d='M5 8h14l-1 12H6L5 8Z'></path><path d='M9 9V6a3 3 0 0 1 6 0v3'></path>",
      user: "<circle cx='12' cy='8' r='3.5'></circle><path d='M5 20c.7-4 3-6 7-6s6.3 2 7 6'></path>",
      menu: "<path d='M4 7h16M4 12h16M4 17h16'></path>",
      close: "<path d='m5 5 14 14M19 5 5 19'></path>",
      heart: "<path d='M20 8.5c0 5-8 10-8 10s-8-5-8-10A4.5 4.5 0 0 1 12 5a4.5 4.5 0 0 1 8 3.5Z'></path>",
      arrow: "<path d='M5 12h14M14 7l5 5-5 5'></path>",
      check: "<path d='m5 12 4 4L19 6'></path>"
    };
    return "<svg viewBox='0 0 24 24' aria-hidden='true'>" + paths[name] + "</svg>";
  }

  function image(product, className) {
    return [
      "<div class='product-image ", className || "", "' data-tone='", product.tone, "'>",
      "<picture><source srcset='assets/images/higgsfield/", product.id, ".webp' type='image/webp'><img src='assets/images/linen-blouson.svg' width='896' height='1152' alt='", product.ko, " 제품 이미지'></picture>",
      product.badge ? "<span class='product-badge'>" + product.badge + "</span>" : "",
      "</div>"
    ].join("");
  }

  function productCard(product) {
    const wished = state.wishlist.includes(product.id);
    const profile = state.fitProfile ? recommendSize(product, state.fitProfile.height, state.fitProfile.weight, state.fitProfile.fit) : null;
    return [
      "<article class='product-card'>",
      "<a href='#product/", product.id, "' aria-label='", product.ko, " 상세 보기'>", image(product, "card-image"), "</a>",
      "<button class='wish-button", wished ? " is-active" : "", "' type='button' data-action='toggle-wish' data-product='", product.id, "' aria-pressed='", String(wished), "' aria-label='", product.ko, wished ? " 찜 해제" : " 찜하기", "'>", icon("heart"), "</button>",
      "<div class='product-card-copy'><div><p>", product.category, "</p><h3><a href='#product/", product.id, "'>", product.ko, "</a></h3></div><strong>", money(product.price), "</strong></div>",
      profile ? "<span class='fit-chip'>내 추천 " + profile + "</span>" : "",
      "</article>"
    ].join("");
  }

  function header() {
    const currentUser = state.user ? state.user.name : "로그인";
    return [
      "<a class='skip-link' href='#main-content'>본문으로 건너뛰기</a>",
      "<header class='commerce-header'>",
      "<button class='menu-button icon-control' type='button' data-action='toggle-menu' aria-expanded='", String(ui.menuOpen), "' aria-label='메뉴 열기'>", icon("menu"), "</button>",
      "<a class='commerce-logo' href='#home' aria-label='FORME 홈'>FORME</a>",
      "<nav class='commerce-nav", ui.menuOpen ? " is-open" : "", "' aria-label='주요 메뉴'>",
      "<a href='#shop'>Shop</a><a href='#shop?category=아우터'>Outer</a><a href='#shop?category=상의'>Top</a><a href='#shop?category=하의'>Bottom</a><a href='#account'>My fit</a>",
      "</nav>",
      "<div class='header-tools'>",
      "<form class='header-search' data-form='search'><label class='sr-only' for='site-search'>상품 검색</label><input id='site-search' name='q' type='search' placeholder='상품 검색' value='", escapeHtml(ui.query), "'><button type='submit' aria-label='검색'>", icon("search"), "</button></form>",
      "<a class='header-user' href='#account'>", icon("user"), "<span>", escapeHtml(currentUser), "</span></a>",
      "<a class='header-bag' href='#cart' aria-label='장바구니 ", String(cartCount()), "개'>", icon("bag"), "<span data-cart-count>", String(cartCount()), "</span></a>",
      "</div></header>"
    ].join("");
  }

  function footer() {
    return [
      "<footer class='commerce-footer'><div><a class='footer-logo' href='#home'>FORME</a><p>Fit intelligence for everyday form.</p></div>",
      "<div><strong>Customer</strong><a href='#account'>마이페이지</a><a href='#cart'>장바구니</a><button type='button' data-action='show-policy'>배송 및 반품</button></div>",
      "<div><strong>Project</strong><p>AI 사이즈 추천 커머스 데모</p><p>실제 결제는 발생하지 않습니다.</p></div>",
      "<form data-form='newsletter'><label for='newsletter'>새 컬렉션 소식</label><div><input id='newsletter' type='email' required placeholder='email@example.com'><button type='submit'>신청</button></div></form>",
      "</footer>"
    ].join("");
  }

  function shell(content) {
    return header() + "<main id='main-content' tabindex='-1'>" + content + "</main>" + footer() + fitModal() + "<div class='site-toast' role='status' aria-live='polite' hidden></div>";
  }

  function homeView() {
    return [
      "<section class='home-hero'><div class='hero-copy'><p class='eyebrow'>FORME / 2026 EDIT</p><h1><span>옷이 아니라,</span><span><em>나에게 맞는</em></span><span><em>형태</em>를 고르세요.</span></h1><p>상품 실측과 나의 핏 프로필을 함께 읽어, 더 확신 있는 사이즈 선택을 돕습니다.</p><div class='hero-actions'><a class='primary-link' href='#shop'>컬렉션 보기", icon("arrow"), "</a><a class='text-link' href='#account'>내 핏 프로필 만들기</a></div></div>",
      "<div class='hero-product'>", image(PRODUCTS[0], "hero-image"), "<div class='hero-note'><span>AI fit note</span><strong>정돈된 어깨와<br>여유로운 가슴</strong><a href='#product/contour-blouson'>핏 리포트 보기</a></div></div></section>",
      "<section class='trust-strip' aria-label='FORME 서비스 특징'><p><strong>30초</strong><span>사이즈 추천</span></p><p><strong>4부위</strong><span>예상 핏 근거</span></p><p><strong>한 번</strong><span>저장 후 전 상품 적용</span></p></section>",
      "<section class='collection-section'><div class='section-heading'><div><p class='eyebrow'>Selected forms</p><h2>지금의 실루엣</h2></div><a href='#shop'>전체 상품 보기</a></div><div class='product-grid'>",
      PRODUCTS.slice(0, 4).map(productCard).join(""), "</div></section>",
      "<section class='fit-story'><div><p class='eyebrow'>Why FORME</p><h2><span>사이즈표를 읽고,</span><span>핏을 이해하는 일로.</span></h2></div><div class='story-steps'><article><span>01</span><h3>나의 기준 저장</h3><p>키, 몸무게, 선호 핏을 한 번 입력합니다.</p></article><article><span>02</span><h3>상품별 재계산</h3><p>같은 M이라도 상품 실측과 디자인 여유분을 비교합니다.</p></article><article><span>03</span><h3>근거와 대안 확인</h3><p>부위별 예상 핏과 한 사이즈 차이까지 함께 설명합니다.</p></article></div></section>"
    ].join("");
  }

  function shopView(params) {
    ui.query = params.get("q") || "";
    ui.category = params.get("category") || "전체";
    let items = PRODUCTS.filter(function (product) {
      const term = ui.query.toLowerCase();
      const queryMatch = !term || (product.name + product.ko + product.category).toLowerCase().includes(term);
      const categoryMatch = ui.category === "전체" || product.category === ui.category;
      return queryMatch && categoryMatch;
    });
    if (ui.sort === "low") items.sort(function (a, b) { return a.price - b.price; });
    if (ui.sort === "high") items.sort(function (a, b) { return b.price - a.price; });
    return [
      "<section class='shop-intro'><p class='eyebrow'>Shop all forms</p><h1><span>나를 위한</span> <span>형태 컬렉션</span></h1><p>핏 프로필을 저장하면 모든 상품 카드에서 예상 추천 사이즈를 먼저 확인할 수 있습니다.</p></section>",
      "<section class='shop-layout'><aside class='filter-panel' aria-label='상품 필터'><div><strong>카테고리</strong>",
      ["전체", "아우터", "상의", "하의"].map(function (category) { return "<button type='button' data-action='filter-category' data-category='" + category + "' class='" + (ui.category === category ? "is-active" : "") + "' aria-pressed='" + String(ui.category === category) + "'>" + category + "</button>"; }).join(""),
      "</div><label>정렬<select data-action='sort-products'><option value='featured'", ui.sort === "featured" ? " selected" : "", ">추천순</option><option value='low'", ui.sort === "low" ? " selected" : "", ">낮은 가격순</option><option value='high'", ui.sort === "high" ? " selected" : "", ">높은 가격순</option></select></label><button type='button' class='reset-filter' data-action='reset-filter'>필터 초기화</button></aside>",
      "<div class='shop-results'><div class='results-head'><span>", String(items.length), " items</span>", ui.query ? "<p>“" + escapeHtml(ui.query) + "” 검색 결과</p>" : "", "</div>",
      items.length ? "<div class='product-grid'>" + items.map(productCard).join("") + "</div>" : emptyState("검색 결과가 없습니다.", "검색어나 카테고리를 바꿔보세요.", "#shop", "전체 상품 보기"),
      "</div></section>"
    ].join("");
  }

  function productView(product) {
    const selected = ui.selectedSizes[product.id] || "";
    const wished = state.wishlist.includes(product.id);
    const recommendation = state.fitProfile ? recommendSize(product, state.fitProfile.height, state.fitProfile.weight, state.fitProfile.fit) : "";
    return [
      "<section class='product-detail'><div class='product-gallery'>", image(product, "detail-image"),
      "<div class='gallery-caption'><span>Higgsfield / 01</span><p>가상 스튜디오 제품 이미지<br>인물 미사용</p></div></div>",
      "<div class='buy-panel'><nav class='breadcrumbs' aria-label='현재 위치'><a href='#shop'>Shop</a><span>/</span><span>", product.category, "</span></nav>",
      "<p class='product-kicker'>", product.name, "</p><h1>", product.ko, "</h1><p class='product-price'>", money(product.price), "</p><p class='product-description'>", product.description, "</p>",
      "<div class='option-block'><div class='option-head'><strong>Size</strong><button type='button' data-action='show-size-guide' data-product='", product.id, "'>실측표</button></div><div class='size-chips' role='group' aria-label='사이즈 선택'>",
      ["S", "M", "L", "XL"].map(function (size) { return "<button type='button' data-action='select-size' data-product='" + product.id + "' data-size='" + size + "' aria-pressed='" + String(selected === size) + "' class='" + (selected === size ? "is-selected" : "") + "'>" + size + "</button>"; }).join(""),
      "</div>", selected ? "<p class='selection-status'>" + selected + " 사이즈를 선택했습니다.</p>" : "<p class='selection-status'>사이즈를 선택해주세요.</p>", "</div>",
      "<button class='fit-entry' type='button' data-action='open-fit' data-product='", product.id, "'><span><small>FORME FIT</small><strong>", recommendation ? "내 추천 " + recommendation + " 확인하기" : "내 사이즈 찾기", "</strong></span><span>상품 실측과 비교 · 30초</span></button>",
      "<button class='primary-button commerce-primary' type='button' data-action='add-cart' data-product='", product.id, "'", selected ? "" : " disabled", "><span>", selected ? selected + " 사이즈 · 장바구니 담기" : "사이즈를 선택해주세요", "</span>", icon("arrow"), "</button>",
      "<button class='secondary-button", wished ? " is-active" : "", "' type='button' data-action='toggle-wish' data-product='", product.id, "'>", icon("heart"), wished ? "찜한 상품" : "관심 상품 저장", "</button>",
      "<dl class='product-facts'><div><dt>소재</dt><dd>리넨 54% · 코튼 46%</dd></div><div><dt>배송</dt><dd>오늘 주문 시 2–3일 내 출고</dd></div><div><dt>반품</dt><dd>수령 후 7일 이내 무료</dd></div></dl></div></section>",
      selected ? "<div class='mobile-purchase-bar'><div><span>선택 사이즈</span><strong>" + selected + "</strong></div><button type='button' data-action='add-cart' data-product='" + product.id + "'>" + selected + " 사이즈 담기" + icon("arrow") + "</button></div>" : "",
      "<section class='measurement-section'><div><p class='eyebrow'>Measured for confidence</p><h2>실측과 취향을<br>함께 봅니다.</h2></div>", measurementTable(product), "</section>",
      "<section class='related-section'><div class='section-heading'><h2>함께 입기 좋은 형태</h2><a href='#shop'>더 보기</a></div><div class='product-grid'>", PRODUCTS.filter(function (item) { return item.id !== product.id; }).slice(0, 3).map(productCard).join(""), "</div></section>"
    ].join("");
  }

  function measurementTable(product) {
    return "<div class='table-wrap'><table><caption>단위 cm · 측정 위치에 따라 1–2cm 오차가 있습니다.</caption><thead><tr><th>Size</th><th>어깨/허리</th><th>가슴/힙</th><th>총장</th></tr></thead><tbody>" + Object.keys(product.measurements).map(function (size) { return "<tr><th>" + size + "</th>" + product.measurements[size].map(function (value) { return "<td>" + value + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
  }

  function cartView() {
    if (!state.cart.length) return "<section class='narrow-page'>" + emptyState("장바구니가 비어 있습니다.", "핏 추천과 함께 다음 형태를 찾아보세요.", "#shop", "상품 둘러보기") + "</section>";
    return [
      "<section class='page-heading'><p class='eyebrow'>Your bag</p><h1>장바구니</h1><span>", String(cartCount()), " items</span></section>",
      "<section class='cart-layout'><div class='cart-list'>",
      state.cart.map(function (item) {
        const product = productById(item.productId);
        return "<article class='cart-item'>" + image(product, "cart-image") + "<div class='cart-copy'><p>" + product.category + "</p><h2><a href='#product/" + product.id + "'>" + product.ko + "</a></h2><span>" + item.size + " · " + money(product.price) + "</span><div class='quantity-control' aria-label='" + product.ko + " 수량'><button type='button' data-action='change-qty' data-delta='-1' data-product='" + product.id + "' data-size='" + item.size + "' aria-label='수량 줄이기'>−</button><strong>" + item.qty + "</strong><button type='button' data-action='change-qty' data-delta='1' data-product='" + product.id + "' data-size='" + item.size + "' aria-label='수량 늘리기'>+</button></div></div><strong class='line-price'>" + money(product.price * item.qty) + "</strong><button class='remove-item' type='button' data-action='remove-cart' data-product='" + product.id + "' data-size='" + item.size + "'>삭제</button></article>";
      }).join(""),
      "</div>", orderSummary(false), "</section>"
    ].join("");
  }

  function orderSummary(checkout) {
    const subtotal = cartTotal();
    const shipping = subtotal >= 150000 ? 0 : 3000;
    return [
      "<aside class='order-summary'><p class='eyebrow'>Order summary</p><h2>주문 요약</h2><dl><div><dt>상품 금액</dt><dd>", money(subtotal), "</dd></div><div><dt>배송비</dt><dd>", shipping ? money(shipping) : "무료", "</dd></div><div class='summary-total'><dt>총 결제금액</dt><dd>", money(subtotal + shipping), "</dd></div></dl>",
      checkout ? "<p class='demo-payment-note'>프로토타입 결제로 실제 청구되지 않습니다.</p>" : "<a class='primary-link summary-cta' href='#checkout'>주문하기" + icon("arrow") + "</a>",
      "</aside>"
    ].join("");
  }

  function checkoutView() {
    if (!state.cart.length) return "<section class='narrow-page'>" + emptyState("결제할 상품이 없습니다.", "상품을 장바구니에 먼저 담아주세요.", "#shop", "상품 둘러보기") + "</section>";
    const user = state.user || {};
    return [
      "<section class='page-heading'><p class='eyebrow'>Checkout</p><h1>주문하기</h1><span>안전한 데모 결제</span></section>",
      "<section class='checkout-layout'><form class='checkout-form' data-form='checkout'><fieldset><legend>주문자 정보</legend><div class='form-grid'><label>이름<input name='name' autocomplete='name' required value='", escapeHtml(user.name || ""), "'></label><label>이메일<input name='email' type='email' autocomplete='email' required value='", escapeHtml(user.email || ""), "'></label><label>연락처<input name='phone' inputmode='tel' autocomplete='tel' required placeholder='010-0000-0000' value='", escapeHtml(user.phone || ""), "'></label></div></fieldset>",
      "<fieldset><legend>배송지</legend><div class='form-grid'><label class='full-field'>주소<input name='address' autocomplete='street-address' required placeholder='서울시 성동구 성수이로 00'></label><label class='full-field'>배송 메모<select name='memo'><option>문 앞에 놓아주세요</option><option>배송 전 연락해주세요</option><option>경비실에 맡겨주세요</option></select></label></div></fieldset>",
      "<fieldset><legend>결제 방식</legend><div class='payment-options'><label><input type='radio' name='payment' value='demo-card' checked><span><strong>데모 카드 결제</strong><small>카드번호를 입력하지 않습니다.</small></span></label><label><input type='radio' name='payment' value='easy'><span><strong>간편결제 데모</strong><small>승인 화면을 시뮬레이션합니다.</small></span></label></div></fieldset>",
      "<label class='agreement'><input type='checkbox' required><span>주문 내용과 프로토타입 결제 안내를 확인했습니다.</span></label><button class='primary-button commerce-primary' type='submit'><span>", money(cartTotal() + (cartTotal() >= 150000 ? 0 : 3000)), " 결제하기</span>", icon("arrow"), "</button></form>",
      orderSummary(true), "</section>"
    ].join("");
  }

  function orderView(order) {
    if (!order) return "<section class='narrow-page'>" + emptyState("주문을 찾을 수 없습니다.", "마이페이지에서 주문 내역을 확인해주세요.", "#account", "마이페이지") + "</section>";
    return [
      "<section class='order-complete'><div class='complete-mark'>", icon("check"), "</div><p class='eyebrow'>Order complete</p><h1>주문이 완료되었습니다.</h1><p>", escapeHtml(order.name), "님의 형태가 곧 출발합니다.</p><dl><div><dt>주문번호</dt><dd>", order.id, "</dd></div><div><dt>결제금액</dt><dd>", money(order.total), "</dd></div><div><dt>배송 예정</dt><dd>", order.delivery, "</dd></div></dl><div class='complete-actions'><a class='primary-link' href='#account'>주문 내역 보기", icon("arrow"), "</a><a class='text-link' href='#shop'>쇼핑 계속하기</a></div></section>"
    ].join("");
  }

  function accountView() {
    if (!state.user) {
      return [
        "<section class='account-login'><div><p class='eyebrow'>Your FORME</p><h1>나의 핏을<br>계속 기억할게요.</h1><p>데모 계정은 비밀번호 없이 이메일로 바로 시작합니다.</p></div>",
        "<form data-form='login'><label>이름<input name='name' required autocomplete='name' placeholder='홍길동'></label><label>이메일<input name='email' type='email' required autocomplete='email' placeholder='forme@example.com'></label><button class='primary-button commerce-primary' type='submit'><span>데모 계정 시작하기</span>", icon("arrow"), "</button><small>실제 인증이나 외부 전송은 발생하지 않습니다.</small></form></section>"
      ].join("");
    }
    const profile = state.fitProfile;
    return [
      "<section class='account-hero'><div><p class='eyebrow'>My form</p><h1>", escapeHtml(state.user.name), "님,<br>오늘의 핏을<br>찾아볼까요?</h1></div><button type='button' data-action='logout'>로그아웃</button></section>",
      "<section class='account-grid'><article class='profile-card'><div class='card-head'><div><p class='eyebrow'>Fit profile</p><h2>나의 핏 프로필</h2></div><button type='button' data-action='open-fit' data-product='contour-blouson'>", profile ? "수정" : "만들기", "</button></div>",
      profile ? "<dl><div><dt>키</dt><dd>" + profile.height + " cm</dd></div><div><dt>몸무게</dt><dd>" + profile.weight + " kg</dd></div><div><dt>선호 핏</dt><dd>" + fitLabel(profile.fit) + "</dd></div></dl><p>전 상품에 자동으로 추천 사이즈가 표시됩니다.</p>" : "<div class='account-empty'><p>프로필을 만들면 상품마다 예상 사이즈를 먼저 볼 수 있어요.</p></div>",
      "</article><article class='orders-card'><div class='card-head'><div><p class='eyebrow'>Orders</p><h2>주문 내역</h2></div><span>", String(state.orders.length), "건</span></div>",
      state.orders.length ? state.orders.map(function (order) { return "<a class='order-row' href='#order/" + order.id + "'><span><small>" + order.date + "</small><strong>" + order.id + "</strong></span><span>" + order.items.length + "개 · " + money(order.total) + "</span></a>"; }).join("") : "<div class='account-empty'><p>아직 주문 내역이 없습니다.</p><a href='#shop'>첫 상품 만나기</a></div>",
      "</article><article class='wishlist-card'><div class='card-head'><div><p class='eyebrow'>Saved</p><h2>관심 상품</h2></div><span>", String(state.wishlist.length), "개</span></div>",
      state.wishlist.length ? "<div class='mini-product-grid'>" + state.wishlist.map(function (id) { return productCard(productById(id)); }).join("") + "</div>" : "<div class='account-empty'><p>마음에 드는 형태를 저장해보세요.</p><a href='#shop'>상품 둘러보기</a></div>", "</article></section>"
    ].join("");
  }

  function emptyState(title, copy, href, label) {
    return "<div class='empty-state'><span>FORME</span><h2>" + title + "</h2><p>" + copy + "</p><a class='primary-link' href='" + href + "'>" + label + icon("arrow") + "</a></div>";
  }

  function fitModal() {
    if (!ui.fitOpen) return "";
    const product = productById(ui.fitOpen);
    const profile = ui.fitDraft || state.fitProfile || { height: 168, weight: 58, fit: "regular" };
    if (ui.analyzing) {
      return [
        "<div class='modal-backdrop'><section class='fit-modal fit-analyzing' role='dialog' aria-modal='true' aria-labelledby='fit-title' data-modal-panel><button class='modal-close' type='button' data-action='close-fit' aria-label='닫기'>", icon("close"), "</button>",
        "<div class='analysis-orbit' aria-hidden='true'><i></i><i></i><i></i></div><p class='eyebrow'>Analyzing fit</p><h2 id='fit-title'>상품 실측과<br>나의 기준을 <span class='no-wrap'>비교 중입니다.</span></h2><p role='status' aria-live='polite'>어깨, 가슴, 총장 여유분을 계산하고 있어요.</p></section></div>"
      ].join("");
    }
    if (ui.recommendation) {
      const size = ui.recommendation;
      const order = ["S", "M", "L", "XL"];
      const alt = order[Math.min(order.length - 1, order.indexOf(size) + 1)];
      return [
        "<div class='modal-backdrop' data-action='close-fit'><section class='fit-modal' role='dialog' aria-modal='true' aria-labelledby='fit-title' data-modal-panel><button class='modal-close' type='button' data-action='close-fit' aria-label='닫기'>", icon("close"), "</button>",
        "<p class='eyebrow'>Your best fit</p><h2 id='fit-title'><em>", size, "</em> 사이즈를 추천해요.</h2><p class='fit-summary'>", product.ko, "의 실측과 입력한 체형을 비교했습니다. 어깨는 자연스럽고 몸통에는 움직일 여유가 생깁니다.</p>",
        "<div class='confidence'><span>추천 신뢰도</span><strong>92%</strong><div><i></i></div></div>",
        "<div class='evidence-list'><div><span>어깨</span><i style='--fit:48%'></i><strong>정사이즈</strong></div><div><span>가슴</span><i style='--fit:62%'></i><strong>여유 있음</strong></div><div><span>총장</span><i style='--fit:53%'></i><strong>균형 잡힘</strong></div></div>",
        alt !== size ? "<p class='alternative-fit'><strong>" + alt + " 사이즈라면</strong><span>전체적으로 한층 여유로운 실루엣이 됩니다.</span></p>" : "",
        "<button class='primary-button commerce-primary' type='button' data-action='apply-fit' data-product='", product.id, "' data-size='", size, "'><span>", size, " 사이즈 적용하기</span>", icon("check"), "</button></section></div>"
      ].join("");
    }
    return [
      "<div class='modal-backdrop' data-action='close-fit'><section class='fit-modal' role='dialog' aria-modal='true' aria-labelledby='fit-title' data-modal-panel><button class='modal-close' type='button' data-action='close-fit' aria-label='닫기'>", icon("close"), "</button>",
      "<p class='eyebrow'>FORME fit / 01</p><h2 id='fit-title'>나에게 맞는 형태를<br>함께 찾아볼게요.</h2><p>", product.ko, "의 실측과 비교할 기본 정보를 입력해주세요.</p>",
      "<form data-form='fit' novalidate><input type='hidden' name='productId' value='", product.id, "'><div class='measure-fields'><label>키<span><input name='height' type='number' min='140' max='210' required aria-describedby='fit-error' value='", String(profile.height), "'><em>cm</em></span></label><label>몸무게<span><input name='weight' type='number' min='35' max='150' required aria-describedby='fit-error' value='", String(profile.weight), "'><em>kg</em></span></label></div>",
      "<fieldset><legend>선호하는 핏</legend><div class='fit-options'>", ["slim", "regular", "relaxed"].map(function (fit) { return "<label><input type='radio' name='fit' value='" + fit + "'" + (profile.fit === fit ? " checked" : "") + "><span><strong>" + fitLabel(fit) + "</strong><small>" + fitCopy(fit) + "</small></span></label>"; }).join(""), "</div></fieldset>",
      ui.fitError ? "<p class='fit-error' id='fit-error' role='alert'>" + ui.fitError + "</p>" : "<p class='privacy-note' id='fit-error'>입력 정보는 이 기기에만 저장되며 언제든 수정할 수 있습니다.</p>",
      "<button class='primary-button commerce-primary' type='submit'><span>추천 사이즈 확인하기</span>", icon("arrow"), "</button></form></section></div>"
    ].join("");
  }

  function fitLabel(fit) {
    return { slim: "슬림", regular: "정사이즈", relaxed: "여유롭게" }[fit] || "정사이즈";
  }

  function fitCopy(fit) {
    return { slim: "몸에 가깝게", regular: "적당한 여유", relaxed: "편안한 볼륨" }[fit] || "";
  }

  function recommendSize(product, height, weight, fit) {
    const score = Number(weight) / Math.pow(Number(height) / 100, 2) + product.fit;
    const order = ["S", "M", "L", "XL"];
    let size = score < 19.5 ? "S" : score < 23.5 ? "M" : score < 27.5 ? "L" : "XL";
    if (fit === "slim" && size !== "S") size = order[order.indexOf(size) - 1];
    if (fit === "relaxed" && size !== "XL") size = order[order.indexOf(size) + 1];
    return size;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character];
    });
  }

  function parseRoute() {
    const raw = location.hash.replace(/^#/, "") || "home";
    const parts = raw.split("?");
    return { path: parts[0], params: new URLSearchParams(parts[1] || "") };
  }

  function render() {
    const route = parseRoute();
    let content;
    let title = "FORME — Find your form";
    if (route.path === "home") content = homeView();
    else if (route.path === "shop") { content = shopView(route.params); title = "Shop — FORME"; }
    else if (route.path.indexOf("product/") === 0) { const product = productById(route.path.split("/")[1]); content = productView(product); title = product.ko + " — FORME"; }
    else if (route.path === "cart") { content = cartView(); title = "장바구니 — FORME"; }
    else if (route.path === "checkout") { content = checkoutView(); title = "주문하기 — FORME"; }
    else if (route.path.indexOf("order/") === 0) { content = orderView(state.orders.find(function (order) { return order.id === route.path.split("/")[1]; })); title = "주문 완료 — FORME"; }
    else if (route.path === "account") { content = accountView(); title = "My fit — FORME"; }
    else content = homeView();
    document.title = title;
    document.body.className = "commerce-site";
    document.body.innerHTML = shell(content);
    requestAnimationFrame(function () {
      document.body.classList.add("is-ready");
      const main = document.getElementById("main-content");
      if (ui.fitOpen) {
        document.querySelector(".commerce-header").inert = true;
        main.inert = true;
        document.querySelector(".commerce-footer").inert = true;
        const focusTarget = document.querySelector(".fit-modal input[name='height']") || document.querySelector(".fit-modal button");
        if (focusTarget) focusTarget.focus();
      } else if (ui.restoreFitProduct) {
        const trigger = document.querySelector("[data-action='open-fit'][data-product='" + ui.restoreFitProduct + "']");
        ui.restoreFitProduct = null;
        if (trigger) trigger.focus({ preventScroll: true });
      } else if (main && ui.focusMain) {
        ui.focusMain = false;
        main.focus({ preventScroll: true });
      }
    });
  }

  function showToast(message) {
    const toast = document.querySelector(".site-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
      window.setTimeout(function () { toast.hidden = true; }, 250);
    }, 2400);
  }

  function toggleWishlist(productId) {
    const index = state.wishlist.indexOf(productId);
    if (index >= 0) state.wishlist.splice(index, 1);
    else state.wishlist.push(productId);
    saveState();
    render();
    showToast(index >= 0 ? "관심 상품에서 삭제했습니다." : "관심 상품에 저장했습니다.");
  }

  function addCart(productId, size) {
    const item = state.cart.find(function (entry) { return entry.productId === productId && entry.size === size; });
    if (item) item.qty += 1;
    else state.cart.push({ productId: productId, size: size, qty: 1 });
    saveState();
    render();
    showToast(size + " 사이즈를 장바구니에 담았습니다.");
  }

  document.addEventListener("click", function (event) {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    if (action === "close-fit" && event.target.closest("[data-modal-panel]") && !event.target.closest(".modal-close")) return;
    if (action === "toggle-menu") { ui.menuOpen = !ui.menuOpen; render(); }
    if (action === "toggle-wish") toggleWishlist(actionTarget.dataset.product);
    if (action === "select-size") { ui.selectedSizes[actionTarget.dataset.product] = actionTarget.dataset.size; render(); }
    if (action === "add-cart") {
      const size = ui.selectedSizes[actionTarget.dataset.product];
      if (size) addCart(actionTarget.dataset.product, size);
    }
    if (action === "open-fit") { ui.fitOpen = actionTarget.dataset.product; ui.returnFocusProduct = actionTarget.dataset.product; ui.recommendation = null; ui.analyzing = false; ui.fitError = ""; ui.fitDraft = null; render(); }
    if (action === "close-fit") { ui.restoreFitProduct = ui.returnFocusProduct; ui.fitOpen = null; ui.recommendation = null; ui.analyzing = false; ui.fitError = ""; ui.fitDraft = null; render(); }
    if (action === "apply-fit") { ui.selectedSizes[actionTarget.dataset.product] = actionTarget.dataset.size; ui.restoreFitProduct = ui.returnFocusProduct; ui.fitOpen = null; ui.recommendation = null; ui.fitError = ""; render(); showToast("추천 사이즈를 상품에 적용했습니다."); }
    if (action === "filter-category") {
      const queryPart = ui.query ? "&q=" + encodeURIComponent(ui.query) : "";
      location.hash = "shop?category=" + encodeURIComponent(actionTarget.dataset.category) + queryPart;
    }
    if (action === "reset-filter") { ui.category = "전체"; ui.query = ""; ui.sort = "featured"; location.hash = "shop"; render(); }
    if (action === "change-qty") {
      const item = state.cart.find(function (entry) { return entry.productId === actionTarget.dataset.product && entry.size === actionTarget.dataset.size; });
      if (item) {
        item.qty = Math.max(1, item.qty + Number(actionTarget.dataset.delta));
        saveState();
        render();
      }
    }
    if (action === "remove-cart") {
      state.cart = state.cart.filter(function (entry) { return !(entry.productId === actionTarget.dataset.product && entry.size === actionTarget.dataset.size); });
      saveState();
      render();
      showToast("장바구니에서 삭제했습니다.");
    }
    if (action === "logout") { state.user = null; saveState(); render(); showToast("로그아웃했습니다."); }
    if (action === "show-size-guide") {
      const product = productById(actionTarget.dataset.product);
      const section = document.querySelector(".measurement-section");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      showToast(product.ko + "의 실측표로 이동했습니다.");
    }
    if (action === "show-policy") showToast("전 상품 7일 이내 무료 반품을 지원하는 데모 정책입니다.");
  });

  document.addEventListener("change", function (event) {
    if (event.target.dataset.action === "sort-products") {
      ui.sort = event.target.value;
      render();
    }
  });

  document.addEventListener("submit", function (event) {
    const form = event.target;
    const type = form.dataset.form;
    if (!type) return;
    event.preventDefault();
    const data = new FormData(form);
    if (type === "search") {
      ui.query = String(data.get("q") || "").trim();
      location.hash = "shop" + (ui.query ? "?q=" + encodeURIComponent(ui.query) : "");
    }
    if (type === "fit") {
      const product = productById(String(data.get("productId")));
      const height = Number(data.get("height"));
      const weight = Number(data.get("weight"));
      if (height < 140 || height > 210 || weight < 35 || weight > 150) {
        ui.fitDraft = { height: height, weight: weight, fit: String(data.get("fit")) };
        ui.fitError = "키는 140–210cm, 몸무게는 35–150kg 범위로 입력해주세요.";
        render();
        return;
      }
      state.fitProfile = { height: height, weight: weight, fit: String(data.get("fit")) };
      ui.fitDraft = null;
      saveState();
      ui.fitError = "";
      ui.analyzing = true;
      render();
      window.setTimeout(function () {
        ui.analyzing = false;
        ui.recommendation = recommendSize(product, state.fitProfile.height, state.fitProfile.weight, state.fitProfile.fit);
        render();
      }, 650);
    }
    if (type === "login") {
      state.user = { name: String(data.get("name")), email: String(data.get("email")), phone: "" };
      saveState();
      render();
      showToast("데모 계정으로 로그인했습니다.");
    }
    if (type === "checkout") {
      const subtotal = cartTotal();
      const total = subtotal + (subtotal >= 150000 ? 0 : 3000);
      state.user = { name: String(data.get("name")), email: String(data.get("email")), phone: String(data.get("phone")) };
      const order = {
        id: "FM" + String(Date.now()).slice(-8),
        date: new Intl.DateTimeFormat("ko-KR").format(new Date()),
        delivery: new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(new Date(Date.now() + 3 * 86400000)) + " 도착 예정",
        name: state.user.name,
        items: state.cart.map(function (item) { return Object.assign({}, item); }),
        total: total,
        payment: String(data.get("payment")),
        status: "결제 완료"
      };
      state.orders.unshift(order);
      state.cart = [];
      saveState();
      location.hash = "order/" + order.id;
    }
    if (type === "newsletter") {
      form.reset();
      showToast("새 컬렉션 소식을 신청했습니다.");
    }
  });

  window.addEventListener("hashchange", function () {
    ui.menuOpen = false;
    ui.fitOpen = null;
    ui.recommendation = null;
    ui.focusMain = true;
    window.scrollTo(0, 0);
    render();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && ui.fitOpen) {
      ui.restoreFitProduct = ui.returnFocusProduct;
      ui.fitOpen = null;
      ui.recommendation = null;
      ui.analyzing = false;
      ui.fitError = "";
      render();
    }
    if (event.key === "Tab" && ui.fitOpen) {
      const focusable = Array.from(document.querySelectorAll(".fit-modal button:not([disabled]), .fit-modal input:not([disabled]), .fit-modal select:not([disabled]), .fit-modal a[href]"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  render();
}());
