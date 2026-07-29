# 아웃바운더 (OUTBOUNDER) — 청년-지역 매칭 플랫폼 제안 데모

순수 HTML/CSS/JS 정적 데모. 빌드 도구·프레임워크·백엔드 없음.
디자인 언어는 서울시 넥스트로컬(섹션 문법·팔레트·스크롤 리빌)과 언더독스(풀스크린 히어로·카운트업·카드 스택·토큰 구조)를 분석해 이식했으며([DESIGN-ANALYSIS.md](DESIGN-ANALYSIS.md)), 콘텐츠·비주얼은 전부 오리지널입니다(사진: Higgsfield AI 생성).

## 시연 방법 (권장: localhost)

```bash
cd 청년지역매칭
python -m http.server 8765
# → http://localhost:8765
```

- **권장 모드 = localhost.** 두 셸(청년/관리자)이 동일 localStorage를 공유하므로, 같은 origin이 보장되는 localhost에서 폐쇄순환이 가장 확실하게 동작합니다. 탭을 나란히 열면 라이브 반영(storage 이벤트)도 확인할 수 있습니다.
- **file:// 로 열 경우** 우아한 저하 모드로 동작합니다 — 탭 간 라이브 반영 대신, 다른 셸로 이동/새로고침(재진입) 시 반영됩니다. Firefox는 file:// 에서 localStorage 버킷이 분리될 수 있으므로 반드시 localhost를 사용하세요.

## 구조

```
index.html          브랜드 랜딩 (넥스트로컬×언더독스 연출 쇼케이스)
app/index.html      청년 셸 SPA  — #/login #/terms #/onboarding #/jobs #/job/:id
                                   #/apply/:id #/complete/:id #/mypage #/stories #/story/:id #/about
admin/index.html    관리자 셸 SPA — #/login #/dashboard #/programs #/applicants
                                   #/members #/content #/report
assets/js/store.js  localStorage 영속 계층 (단일 진실원천, schemaVersion 자동 리시드)
assets/js/seed.js   멱등 목데이터 시드
```

## 데모 하이라이트 (폐쇄순환 3종)

1. **지원 순환**: 청년 셸에서 지원서 제출 → 관리자 `#/applicants` 목록에 등장 ("내 지원" 배지)
2. **선발 순환**: 관리자에서 합격 처리 → 청년 `#/mypage` 상태 변경 + 여정 타임라인 오픈
3. **콘텐츠 순환**: 관리자 `#/content` 발행 → 청년 `#/stories` 노출 (HTML 이스케이프 적용)

관리자 로그인: 아무 값이나 입력 후 "데모 관리자로 로그인" (승인 기반 계정 정책은 화면에 명시).
데이터 초기화: 하단 "데모 안내" → "데모 데이터 초기화".

## 개발자 콘솔 검증

```js
Store.selfTest()   // CRUD·CSV 직렬화·매칭점수·이스케이프 단위 어서션 → true
```

## 정직성 고지

로그인(OAuth)·파일 업로드·GA4·결제는 시뮬레이션이며 화면에 "DEMO" 배지로 표기됩니다.
실서비스 전환 매핑은 각 화면의 "데모 안내" 패널 참조.
