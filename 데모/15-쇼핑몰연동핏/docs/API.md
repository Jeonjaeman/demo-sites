# 데모 API 및 데이터 계약

현재 프로토타입은 서버 없이 동작합니다. 화면의 분석 지연과 상태 전이는 비동기로 재현하지만, 현재 저장 구현은 `localStorage`를 직접 읽고 쓰는 단일 브라우저 adapter입니다. 아래 URL과 계층은 실제 네트워크 엔드포인트가 아니라 다음 단계에서 현재 저장 계층을 비동기 HTTP adapter로 교체하기 위한 계약입니다.

## 계층 구조

```text
UI / route
  → domain service
    → async API adapter
      → localStorage repository (현재 데모)
      → HTTP API repository (후속 교체 지점)
```

현재 저장 키는 커머스 상태 `forme-commerce-v2`, 회원·옷장·추천·이벤트·임베드·운영자 상태 `forme-platform-v1`로 분리됩니다. 후속 adapter는 Promise를 반환해 로딩·성공·오류 상태를 동일하게 재현하고, 데모 초기화는 시드 데이터와 스키마 버전을 함께 복원해야 합니다. UI에서 저장소 키나 JSON 형태를 직접 조작하는 코드는 이 adapter 경계로 이동합니다.

## 공통 응답

성공:

```json
{
  "data": {},
  "meta": { "requestId": "demo-request-id", "schemaVersion": 1 }
}
```

실패:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값을 확인해 주세요.",
    "fields": { "height": "허용 범위를 벗어났습니다." }
  }
}
```

대표 오류 코드는 `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `UNSUPPORTED_PRODUCT`, `MEASUREMENT_MISSING`, `ADAPTER_FAILURE`입니다.

## 인증과 회원

| Method | Endpoint | 설명 | 데모 경계 |
|---|---|---|---|
| POST | `/v1/auth/signup` | 자체 계정 생성 | 로컬 회원 상태 생성 |
| POST | `/v1/auth/login` | 자체 로그인 | 로컬 세션 생성 |
| POST | `/v1/auth/logout` | 세션 종료 | 로컬 세션 제거 |
| POST | `/v1/auth/kakao/start` | Kakao 인가 시작 | 팝업/리디렉션 UI 시뮬레이션 |
| POST | `/v1/auth/kakao/callback` | 인가 코드 교환 | 외부 호출 없이 연결 상태 생성 |
| POST | `/v1/auth/kakao/link` | 기존 계정 연결 | 연결 상태만 변경 |
| DELETE | `/v1/auth/kakao/link` | 연결 해제 | 연결 상태만 변경 |
| PATCH | `/v1/users/me/password` | 비밀번호 변경 | 성공/오류 상태만 재현 |
| GET | `/v1/users/me/consents` | 약관·개인정보 동의 조회 | 버전·동의 시각 조회 |
| PUT | `/v1/users/me/consents` | 동의 갱신 | 로컬 동의 원장 갱신 |
| DELETE | `/v1/users/me` | 회원 탈퇴 | 회원 파생 데이터 정리 |

비회원 추천은 익명 sessionId에 연결됩니다. 회원 전환 시 저장 동의를 받은 프로필·옷장 초안·추천 이력을 회원 ID로 병합하되, 운영 환경에서는 충돌과 중복을 서버 트랜잭션으로 처리합니다.

## 신체·핏 프로필 CRUD

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/v1/body-profile` | 현재 프로필 조회 |
| POST | `/v1/body-profile` | 최초 프로필 생성 |
| PUT | `/v1/body-profile` | 전체 프로필 교체 |
| PATCH | `/v1/body-profile` | 일부 치수·선호 핏 수정 |
| DELETE | `/v1/body-profile` | 프로필 삭제 |

주요 필드는 height, weight, 선택 신체 치수, fitPreference, unit, updatedAt입니다. 입력 범위와 단위를 경계에서 검증합니다. 현재 추천 규칙은 데모용이며 확정 계산식이나 학습형 모델로 오해해서는 안 됩니다.

## 옷장 CRUD

옷장은 관심상품과 다릅니다. 관심상품은 구매 후보이고 옷장은 실제 보유 의류와 착용 피드백입니다.

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/v1/wardrobe-items` | 목록·필터 조회 |
| POST | `/v1/wardrobe-items` | 수동 등록 |
| POST | `/v1/wardrobe-items/import` | 지원 URL 메타데이터 미리보기 |
| GET | `/v1/wardrobe-items/:itemId` | 상세 조회 |
| PUT | `/v1/wardrobe-items/:itemId` | 전체 수정 |
| PATCH | `/v1/wardrobe-items/:itemId` | 착용감·메모 등 일부 수정 |
| DELETE | `/v1/wardrobe-items/:itemId` | 삭제 |

URL import는 외부 상품 검색이나 무제한 크롤링이 아닙니다. 지원 데모 URL은 미리보기로 변환하고, 미지원·중복·필드 누락 시 수동 입력 폼으로 되돌립니다. 사용자가 확인하기 전에는 저장하지 않습니다.

## 추천

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/v1/recommendations` | 상품·프로필로 추천 생성 |
| GET | `/v1/recommendations/:recommendationId` | 결과 스냅샷 조회 |
| GET | `/v1/recommendations` | 회원 추천 이력 조회 |
| POST | `/v1/recommendations/:recommendationId/feedback` | 착용/정확도 피드백 저장 |
| DELETE | `/v1/recommendations/:recommendationId` | 회원 이력에서 삭제 |

추천 결과는 recommendationId, recommendedSize, alternativeSize, reasons, warnings, confidenceState, ruleVersion, productSnapshot, profileSnapshot을 포함합니다. 결과 재현을 위해 당시 입력과 규칙 버전을 스냅샷으로 보존합니다.

## 이벤트 원장

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/v1/events` | 단일 이벤트 적재 |
| POST | `/v1/events/batch` | 제한된 재전송 큐 일괄 적재 |
| GET | `/v1/admin/funnel` | 기간별 전환 퍼널 조회 |
| GET | `/v1/admin/products` | 상품별 추천·적용·구매 요약 |
| GET | `/v1/admin/integration-health` | 임베드·수집 상태 조회 |

표준 퍼널은 `widget_open → recommendation_start → recommendation_result → size_applied → add_to_cart → purchase`입니다. 각 이벤트는 eventId, occurredAt, sessionId, productNo와 가능한 경우 recommendationId를 포함합니다. 운영 서버는 eventId로 중복을 제거하고 클라이언트 시각을 신뢰하지 않습니다.

## 관리자 인증

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/v1/admin/auth/login` | 운영자 세션 시작 |
| POST | `/v1/admin/auth/logout` | 운영자 세션 종료 |
| GET | `/v1/admin/session` | 역할·세션 확인 |

데모 관리자는 읽기 전용 1~2개 화면을 위한 역할 시뮬레이션입니다. 실제 환경에서는 소비자 세션과 쿠키·도메인·권한을 분리하고 모든 관리자 조회를 서버에서 인가해야 합니다.

## localStorage adapter 원칙

- 저장소에는 스키마 버전과 최소한의 데모 데이터만 둡니다.
- 비밀번호, OAuth 토큰, 카드 정보, 실제 주소·연락처 같은 민감정보를 저장하지 않습니다.
- adapter는 읽기/쓰기 실패를 `ADAPTER_FAILURE`로 정규화합니다.
- CRUD는 ID 충돌, 없는 항목, 중복 URL을 명시적 오류로 반환합니다.
- 회원 탈퇴는 세션, 프로필, 옷장, 추천 이력, 동의 상태를 정리합니다. 익명화가 필요한 분석 이벤트는 별도 정책을 따릅니다.
- 테스트용 초기화는 화면에서 명시적으로 실행하며 운영 API에는 노출하지 않습니다.

## 실제 백엔드 전환 포인트

1. localStorage repository를 HTTP repository로 교체하고 UI/service 인터페이스는 유지합니다.
2. 서버 발급 세션과 HttpOnly·Secure·SameSite 쿠키를 적용합니다.
3. Kakao Authorization Code와 state, PKCE/nonce, redirect origin 검증을 서버에서 처리합니다.
4. 사용자·프로필·옷장·추천 스냅샷·이벤트 원장을 관계형 DB 트랜잭션으로 저장합니다.
5. mallId와 origin allowlist로 테넌트를 격리하고 관리자 쿼리에도 tenant 조건을 강제합니다.
6. 추천 규칙과 상품 실측의 버전·승인·롤백 체계를 둡니다.
7. 이벤트 수집은 인증, rate limit, idempotency, 재처리 큐와 관측 지표를 갖춥니다.
8. 탈퇴·보유기간 만료·동의 철회를 위한 삭제/익명화 작업과 감사 로그를 구현합니다.

## 보안·개인정보 주의

현재 데이터는 브라우저에서 누구나 확인·수정할 수 있으므로 테스트용 정보만 입력합니다. 신체 정보도 개인정보로 분류될 수 있으므로 목적, 필수/선택, 보유기간, 제3자 제공 여부를 고지하고 최소 수집해야 합니다. 실제 서비스 전환 전에는 위협 모델링, 접근통제, 암호화, 로그 마스킹, 삭제 검증, 취약점 점검과 개인정보 문서 승인이 필요합니다.
