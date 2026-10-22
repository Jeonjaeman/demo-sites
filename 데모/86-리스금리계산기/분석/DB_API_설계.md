# DB 스키마 · API 목록 초안 (착수 1.5일차에 요구사항정의서와 대조해 확정)

> 데모의 가상 서버(`assets/js/server/server.js`)와 계산 엔진(`engine.worker.js`)이 이 계약을 그대로 흉내 낸다. 실제 구축은 Next.js Route Handlers + PostgreSQL(서울 리전) + Prisma.

## 1. 테이블 (7)

| 테이블 | 주요 컬럼 | 비고 |
|---|---|---|
| `customers` | id · created_at · kind(calc/consult) · source(web/admin) · owner_admin_id · status · confirmed · **name_enc · name_bidx** · **phone_enc · phone_bidx · phone_last4_bidx** · plate · plate_last4 · contract_type · lease_kind(operating/finance/rent) · consent_collect_at · consent_contact(bool, at, method) · terms_version · deleted_at · deleted_by · delete_reason · tombstone | 성함·전화는 AES-256-GCM 암호문, 검색은 HMAC 블라인드 인덱스. 삭제 시 암호문·인덱스·차량 정보를 비우고 tombstone만 남김 |
| `vehicles` | customer_id · model · trim · color · mileage · first_reg · segment · options(text[]) | 옵션 태그 |
| `leases` | customer_id · price · prepay · deposit · residual · months · payment · start_date · first_payment_timing(arrears/advance) · service_cost | 계산기 입력값 스냅샷(최근) |
| `quotes` | customer_id · version · input(jsonb: 시세·잔여원금·해지율·수수료 기준/모드/금액/율·주행) · result(jsonb) · engine_version · created_by · created_at | 산식 버전을 남겨 과거 리포트 재현 |
| `memos` | customer_id · author(admin_id / customer) · text · created_at | 진행상태 변경·재견적 신청도 활동으로 기록 |
| `share_links` | token(128bit) · kind(rate/transfer) · customer_id · snapshot(jsonb) · overrides(jsonb) · expires_at · revoked_at · views · last_view_at · created_by | 스냅샷만 저장 — 고객 화면은 재계산하지 않음 |
| `admins` | id · login_id · name · role(main/sub) · perms(scope · excel · delete · report) · active · phone · otp_secret_enc · last_login_at | 권한 변경은 `audit_logs`에 3년 보관 |
| `audit_logs` | id · at · admin_id · action(code) · target · reason · ip · prev_hash · hash | 해시 체인 — 한 건이라도 바뀌면 이후 해시 불일치. 1년 이상 보관 |

## 2. API (고객)

| 메서드 · 경로 | 설명 | 응답 |
|---|---|---|
| `POST /api/v1/leads` | 차량번호·성함·전화·동의 → 리드 생성 (24시간 내 같은 번호+전화는 기존 건 반환) | `{ id, rental, duplicate? }` · 422 필드 오류 |
| `POST /api/v1/calc/lease` | 금리 역산·상환표·연도 요약·비교값(시안 방식·보증금 반영/미반영·반대 납입 시점·렌트 총액 기준) | 결과 JSON · 422 `PAYMENT_TOO_LOW` / 필드 오류 |
| `POST /api/v1/calc/rent-service` | 장기렌트 포함 비용(보험·자동차세·정비) 추정 | `{ monthly, breakdown }` |
| `POST /api/v1/consults` | 승계 상담 신청 (24시간 내 중복 → 409, `force`로 갱신) | `{ id, at }` |
| `POST /api/v1/reports` | 금리 분석 보고서 링크 발급 (30일) | `{ token, expiresAt }` |
| `GET /api/v1/reports/:token[?verified=뒤4자리]` | 보고서 스냅샷 — 본인 세션이면 실명, 아니면 마스킹 | 200 · 404(없음·폐기) · 410(만료) |
| `GET /api/v1/transfer-reports/:token` | 승계 리포트 스냅샷(마스킹) + 재견적 가능 여부 | 200 · 404 · 410 |
| `POST /api/v1/transfer-reports/:token/requote` | 재견적 신청 (30일 1회) | 201 · 429 `{ next }` |

## 3. API (관리자 · 세션 필요)

| 메서드 · 경로 | 설명 | 권한 · 기록 |
|---|---|---|
| `POST /admin/login` → `POST /admin/otp` | ID·PW → OTP 6자리(3분·5회 잠금) | 로그인 기록 |
| `POST /admin/logout` | `idle: true`면 자동 로그아웃 | 기록 |
| `GET /admin/customers?tab&seg&sort&q&page` | 목록 · KPI · 탭/세그 카운트 · 검색 모드(이름 전체/전화 전체/뒤 4자리/차량번호) | 서브는 본인 담당·등록만, 이름·전화 마스킹 |
| `POST /admin/customers` | 승계 상담 추가(전화 접수 · 구두 동의) | 기록 |
| `GET /admin/customers/:id` | 상세 + 메모 + 공유 링크 목록 | **열람 기록**(세션당 1회) |
| `PATCH /admin/customers/:id` | 진행상태 · 상담 확인 · 차량 정보 · 담당(메인) | 변경 기록 |
| `POST /admin/customers/:id/reveal` | 서브 관리자 전화번호 표시 | **사유 기록** |
| `POST /admin/customers/:id/memos` | 메모 | 기록 |
| `POST /admin/customers/:id/quote` | 승계 상담 계산(실시간 · `persist`면 저장) | 서버 계산 |
| `POST /admin/customers/:id/transfer-report` | 고객 리포트 발급(금액 수정 · 7/30/90일) | 리포트 권한 · 기록 |
| `POST /admin/reports/:token/revoke` | 링크 폐기 | 기록 |
| `POST /admin/customers/:id/image-saved` | 리포트 이미지 저장 사유 | **다운로드 기록** |
| `POST /admin/customers/delete` | 선택 삭제(사유 필수 · 즉시 파기) | 삭제 권한 · 기록 |
| `POST /admin/export` | xlsx(범위 · 전화 마스킹 · 문자열 셀) | 엑셀 권한 · **사유 필수** · 기록 |
| `GET/POST/PATCH /admin/admins` | 관리자 목록 · 추가 · 권한/활성/이관 | 메인 전용 · 권한 이력 3년 |
| `GET /admin/logs` · `POST /admin/logs/audit` | 접속기록 · 해시 체인 검증 · 점검 기록 | 메인 전용 |

## 4. 계산 모듈 경계
- 화면(클라이언트) 코드: 입력 수집 · API 호출 · 결과 렌더만. 계산식·감가율·수수료 산식 0줄.
- 서버 모듈: `calc/lease`(IRR · 구간 이분법 · 선/후취 · 보증금 반영) · `calc/transfer`(계약 유형별 매입 할증 · 반납 가능 여부 · 명의변경 수수료 한도 · 중개 수수료 양방향 · 주행 일할 · 감가 예측) — **NDA 후 받은 산식·감가율은 이 모듈만 교체**.
- 납품 시 검사 스크립트: 빌드된 클라이언트 번들에서 산식 키워드·감가율 상수 검색 0건 확인.
