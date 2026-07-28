# Cafe24-first 임베드 데모 계약

이 문서는 상품 상세 페이지에 사이즈·핏 추천 위젯을 붙이는 데모 계약을 설명합니다. 현재 결과물은 정적 프런트엔드 프로토타입이며 Cafe24 앱 설치, 실제 ScriptTag 등록, 실서버 인증 또는 운영 결제를 수행하지 않습니다.

## 통합 구조

```text
Cafe24형 상품 상세(호스트 데모)
  └─ script loader
      ├─ 상품 컨텍스트 수집
      ├─ 격리된 위젯 마운트
      ├─ 추천 사이즈를 호스트 옵션에 반영
      └─ 전환 이벤트를 event bridge로 전달
```

운영 전환 시에도 로더는 쇼핑몰의 상품 옵션·장바구니·결제를 소유하지 않습니다. 위젯을 불러오지 못하거나 추천 API가 실패해도 기본 구매 흐름은 계속 동작해야 합니다.

## ScriptTag 예시

아래 코드는 계약을 보여주는 예시이며 현재 공개 배포 주소가 아닙니다.

```html
<script
  src="https://static.example.invalid/fit-widget/v1/loader.js"
  data-mall-id="demo-mall"
  data-shop-no="1"
  data-mount="#fit-widget-root"
  data-locale="ko-KR"
  defer
></script>
<div id="fit-widget-root"></div>
```

운영 로더는 고정된 버전 URL, origin allowlist, CSP 정책, 필요 시 SRI를 사용합니다. 토큰·비밀키·사용자 개인정보는 HTML 속성이나 쿼리 문자열에 넣지 않습니다.

## 상품 컨텍스트

호스트는 위젯 초기화 시 다음 형태의 상품 문맥을 전달합니다.

```js
window.FitWidget.mount({
  mallId: "demo-mall",
  shopNo: 1,
  product: {
    productNo: "contour-blouson",
    name: "상품 표시명",
    category: "outer",
    currency: "KRW",
    options: [
      { optionCode: "OPT-S", label: "S", available: true },
      { optionCode: "OPT-M", label: "M", available: true },
      { optionCode: "OPT-L", label: "L", available: true }
    ],
    measurements: {
      S: { shoulder: 44, chest: 54, length: 64 },
      M: { shoulder: 46, chest: 56, length: 66 },
      L: { shoulder: 48, chest: 58, length: 68 }
    }
  }
});
```

필수 상품 실측이나 선택 가능한 옵션이 없으면 추천을 추정하지 않고 `unsupported_product` 또는 `measurement_missing` 상태를 표시합니다. 실제 Cafe24 전환에서는 상품 번호와 표시 사이즈를 옵션 코드에 매핑하는 검증 계층이 추가됩니다.

## 추천 사이즈 적용

현재 데모는 위젯에서 `window.FORMECommerce.applySize(productId, size)`를 호출해 상품 옵션을 바꾸고, `window.FORMEPlatform.record(type, detail)`로 운영 이벤트 원장에 기록합니다. 운영 배포에서는 이 직접 호출을 버전형 메시지 계약으로 교체합니다.

아래 `CustomEvent`는 운영용 브리지 계약 예시입니다. 호스트 브리지는 표시 사이즈를 실제 옵션 코드로 변환하고, 해당 옵션을 선택한 뒤 변경 이벤트를 발생시킵니다.

```js
window.addEventListener("fit:size:apply", (event) => {
  const { productNo, recommendedSize, optionCode } = event.detail;
  // 데모: 로컬 상품 옵션 상태 갱신
  // 운영: 현재 상품·재고·옵션 매핑 재검증 후 Cafe24 옵션 선택
});
```

다음 경우에는 적용하지 않고 사용자에게 복구 경로를 제공합니다.

- 페이지 이동으로 현재 상품 번호가 달라진 경우
- 추천 이후 옵션이 품절되거나 제거된 경우
- 표시 사이즈와 실제 옵션 코드를 하나로 결정할 수 없는 경우
- 호스트 옵션 요소를 찾지 못한 경우

## Event bridge

데모 퍼널의 표준 순서는 다음과 같습니다.

| 이벤트 | 발생 시점 | 핵심 속성 |
|---|---|---|
| `widget_open` | 접힌 런처를 펼침 | sessionId, productNo |
| `recommendation_start` | 유효한 입력으로 분석 시작 | sessionId, productNo, memberState |
| `recommendation_result` | 결과 또는 추천 불가 응답 표시 | recommendationId, size, resultState, ruleVersion |
| `size_applied` | 추천 사이즈를 상품 옵션에 적용 | recommendationId, optionCode, accepted |
| `add_to_cart` | 해당 옵션이 장바구니에 담김 | recommendationId, productNo, optionCode, quantity |
| `purchase` | 데모 주문이 완료됨 | orderId, sessionId, attributedRecommendationIds |

이벤트 이름은 분석 계약이며 DOM 선택자나 화면 문구에 종속시키지 않습니다. 현재 커머스는 장바구니와 주문 완료 시 `FORMEPlatform.record`를 호출해 같은 브라우저 원장에 연결합니다. 사용자 흐름을 이벤트 전송 성공 여부로 막지 않으며, 운영 전환 시 서버가 중복 제거용 eventId와 발생 시각을 검증합니다.

```js
window.addEventListener("fit:event", (event) => {
  const payload = event.detail;
  // 호스트 데모는 로컬 이벤트 원장에 기록합니다.
  // 운영 환경은 인증된 수집 API로 전달합니다.
});
```

## 위젯 생명주기

다음 API는 현재 단일 페이지 데모를 실제 외부몰 로더로 분리할 때 적용할 목표 계약입니다.

```js
window.FitWidget.mount(config);
window.FitWidget.updateProduct(nextProductContext);
window.FitWidget.open();
window.FitWidget.close();
window.FitWidget.destroy();
```

- `mount`는 같은 대상에 중복 실행되어도 위젯을 하나만 유지합니다.
- `updateProduct`는 SPA형 상품 이동 시 이전 추천·옵션 상태를 새 상품에 적용하지 않습니다.
- `destroy`는 리스너, 포커스 트랩, 스크롤 잠금과 마운트 DOM을 정리합니다.
- 위젯이 닫히면 포커스는 런처 또는 직전 제어 요소로 돌아갑니다.

## 인증 경계

프로토타입의 자체 계정, Kakao, 운영자 로그인은 모두 브라우저 내부 시뮬레이션입니다.

- 자체 로그인: 데모 세션과 회원 상태만 생성하며 비밀번호를 서버에 전송하지 않습니다.
- Kakao: 팝업·연결·해제 상태를 재현할 뿐 OAuth 호출이나 토큰 발급을 수행하지 않습니다.
- 운영자: 소비자 계정과 분리된 역할 화면을 보여주지만 실제 권한 검증 수단이 아닙니다.
- 실제 전환: Authorization Code, state, PKCE/nonce 검증, HttpOnly 세션 쿠키, CSRF 방어, 서버측 역할 검사를 구현합니다.

브라우저 저장소의 값을 수정하면 역할이나 데이터를 바꿀 수 있으므로 현재 데모를 인증·인가 또는 개인정보 저장 수단으로 사용하면 안 됩니다.

## 장애와 폴백

| 장애 | 데모/운영 기대 동작 |
|---|---|
| 로더 실패 | 위젯을 숨기고 호스트 구매 흐름 유지 |
| 상품 문맥 누락 | 추천 준비 중 상태와 기본 실측표 제공 |
| 추천 지연/실패 | 재시도와 입력 수정 제공, 옵션 선택은 계속 가능 |
| 이벤트 적재 실패 | 구매 흐름을 막지 않고 제한된 재시도 큐 사용 |
| Kakao 팝업 차단 | 전체 페이지 리디렉션 복귀 흐름 제공 |
| 옵션 매핑 실패 | 자동 적용 중단 후 사용자가 직접 선택 |

## 실제 Cafe24 전환 체크리스트

1. 대상 PC·모바일 스킨에서 상품/옵션 DOM과 변경 이벤트를 확인합니다.
2. ScriptTag 설치 범위를 상품 상세로 제한하고 origin allowlist를 등록합니다.
3. Shadow DOM 또는 iframe 하이브리드 중 실제 스킨 충돌이 적은 방식을 선택합니다.
4. 옵션 코드·재고·상품 실측 동기화의 실패 정책을 확정합니다.
5. 위젯 실패 시 호스트 JavaScript 오류와 구매 차단이 0건인지 강제 실패 테스트를 수행합니다.
6. 추천부터 테스트 주문까지 서버 이벤트 귀속을 검증합니다.
7. 개인정보 처리방침, 동의 문구, 보유 기간과 삭제 절차를 승인받습니다.
