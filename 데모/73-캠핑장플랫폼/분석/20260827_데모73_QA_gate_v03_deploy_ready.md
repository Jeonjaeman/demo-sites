---
artifact_id: demo73-qa-gate-v03-deploy-ready
project: 데모73 캠핑장 예약 플랫폼 MVP
owner: argos
status: approved
created_at: 2026-08-27T02:21:05+09:00
sources:
  - ../../../index.html
  - ../../../campflow/index.html
  - ../../../assets/thumbs/73.webp
  - ../../../assets/thumbs/76.webp
  - ../README.md
  - ../package.json
  - ../tests/mvp.test.mjs
  - ../scripts/qa.mjs
  - ../scripts/probe.mjs
  - ./20260827_데모73_QA_gate_v02.md
  - ./20260827_데모73_배포준비_v01.md
data_class: internal
approval: A
next_action: hermeschief가 이 판정과 배포준비 문서를 묶어 대표의 C등급 최종 배포 승인을 요청
---

# 데모73 최종 통합 QA gate v03 — Deploy Ready

## gate

**Deploy Ready PASS**

- P0: 0
- P1: 0
- 통합 충돌: 0
- 새 차단 finding: 0
- 판정 범위: 제품 소스 read-only 검증과 배포 후보 경계 검토
- 이 판정은 프로덕션 배포 실행 승인이 아니다. 실제 stage/commit/push/deploy는 수행하지 않았다.

## findings

### 차단 finding 없음

요청된 포털 카드, ASCII 별칭, 썸네일 소유권, 데모73 회귀, 문서 수치, commit 후보 경계, 배포 후 healthcheck·rollback·승인 유효기간에서 P0/P1 또는 통합 충돌을 재현하지 못했다.

### 비차단 관찰

1. `20260827_데모73_배포준비_v01.md` 22행은 `.claude/launch.json`을 변경 대상으로 적지만 61행은 ignore된 로컬 설정이라 commit 후보에서 제외한다고 명확히 정리한다. 실제 후보 경계는 후자의 제외 규칙과 일치한다. 배포 차단은 아니다.
2. v02의 엄격한 무인 기준 관찰(P2: `camp-caravan-01.webp` 원경 비식별 실루엣)은 기능·통합·라이선스 차단으로 승격할 새 증거가 없어 기존 비차단 상태를 유지한다.
3. 프로덕션 공개 URL과 Pages 캐시/전파는 미배포 상태라 확인하지 않았다. 배포 직후 문서의 healthcheck를 실행해야 한다.
4. `probe.mjs`는 실행 자체가 기존 ignore 경로 `qa/07-theme-375.png`, `qa/08-admin-375.png`, `qa/09-booking-375.png`를 재생성한다. 이 세 파일은 commit 후보에서 제외되고 제품 소스·staged 파일에는 변화가 없지만, 실행 전 해시를 보존하지 않아 byte-identical 여부는 확인하지 못했다. 요청 범위의 유일한 새 추적 산출물은 본 QA 문서다.

## reproduction

환경:

- Windows 11
- 기존 설치 Google Chrome 151.0.7922.172 (`playwright-core`, `channel: chrome`)
- Node.js 24.18.0
- 로컬 임시 HTTP 서버
- 새 Chrome 설치 없음

실행:

1. `node --test tests/mvp.test.mjs`
2. 저장소를 변경하지 않도록 데모73 소스를 임시 디렉터리로 복사한 뒤 `node scripts/qa.mjs`
3. `node scripts/probe.mjs` (기존 ignore QA PNG 3개 재생성 부작용은 비차단 관찰에 공개)
4. 별도 통합 probe로 루트 포털, `/campflow/`, 데모73 6페이지를 기존 Chrome에서 순회하고 HTTP·console·pageerror·network를 수집
5. Pillow로 `assets/thumbs/76.webp`, `assets/thumbs/73.webp`를 완전 decode하고 크기·SHA-256을 계산
6. `git add -n`에 명시적 후보 manifest를 전달해 staging 없이 후보 경계를 dry-run 검증
7. `git diff --cached --name-only`, `git diff --name-only --diff-filter=U`로 실제 staged 파일과 충돌 파일이 0인지 확인

## verification

### 1. 루트 포털 카드·썸네일

- CAMP FLOW 카드 렌더: 정확히 1개
- 링크: `./데모/73-캠핑장플랫폼/index.html`
- CAMP FLOW 이미지: `./assets/thumbs/76.webp`, 브라우저 decoded `900×900`, complete=true
- UNFRAME 이미지: `./assets/thumbs/73.webp`, 브라우저 decoded `900×900`, complete=true
- SHA-256:
  - `76.webp`: `04b64829ab96a144e91cb36e34117a679ce5d34436c232f237616875edc96fd8`
  - `73.webp`: `6820ad08e85d3983409c9cfbea1ed00898d4a7dc343e60965997e65f1036342a`
- 두 해시가 달라 썸네일 충돌 없음. UNFRAME는 73, CAMP FLOW는 76 소유 규칙을 유지한다.

### 2. `/campflow/` 별칭

입력:

`/campflow/?source=qa#availability`

최종 URL:

`/데모/73-캠핑장플랫폼/index.html?source=qa#availability`

경로, `?source=qa`, `#availability`가 모두 보존됐다.

### 3. HTTP·브라우저 오류

HTTP 200:

- `/`
- `/campflow/`
- `/데모/73-캠핑장플랫폼/index.html`
- `/데모/73-캠핑장플랫폼/search.html`
- `/데모/73-캠핑장플랫폼/camp.html`
- `/데모/73-캠핑장플랫폼/booking.html`
- `/데모/73-캠핑장플랫폼/complete.html`
- `/데모/73-캠핑장플랫폼/credits.html`

통합 순회 결과:

- console error: 0
- pageerror: 0
- failed/non-200 network: 0
- 기본 favicon은 판정 제외 규칙을 적용했다.

### 4. 회귀·정적 QA

- unit: 29/29 PASS
- browser QA: 81/81 PASS
- probe: 4/4 PASS
- SOURCES manifest / credits / WebP: 18 / 18 / 18, 파일명 1:1
- 지원서 견적: 총 500만원(VAT 별도)
- 지원서 일정: 15일, 항목별 합계 15일
- 지원서: 2,352자(개행 포함), 78줄
- 포트폴리오 설명: 4,151자(개행 포함), 124줄. 목표 3,500~4,500자·110~130줄 충족
- 지원서 placeholder: `[배포 후 URL 입력]` 유지
- 지원서 상태: `검토용 데모 초안`, 독립 QA와 배포 HTTP 200 확인 뒤 교체 조건 명시

### 5. commit 후보 경계

명시적 `git add -n` dry-run 기준 허용 범위는 다음 네 영역뿐이다.

- `index.html`
- `campflow/index.html`
- `assets/thumbs/76.webp`
- `데모/73-캠핑장플랫폼/` 추적 대상

제외 확인:

- `데모/73-캠핑장플랫폼/node_modules/`: 제외
- `데모/73-캠핑장플랫폼/qa/`: 제외
- `.claude/`: 제외
- `프린트라인 포트폴리오/`: 제외
- `assets/thumbs/73.webp`: 제외
- 다른 데모와 unrelated 변경: 명시적 후보 manifest 밖
- 실제 staged 파일: 0
- Git unmerged/conflict 파일: 0

작업 트리에는 다른 데모의 기존 dirty/untracked 파일이 다수 있으므로 실제 commit 때 `git add -A` 또는 저장소 전체 add를 사용하면 안 된다. 위 네 영역을 명시하고 `git diff --cached --name-only`로 최종 혼입 0을 확인해야 한다.

### 6. 배포준비 문서 검토

`20260827_데모73_배포준비_v01.md`의 배포 준비 절차는 이번 범위에 충분하다.

- healthcheck: Pages workflow·승인 SHA 일치, 별칭과 원본 6페이지 최종 HTTP 200, query/hash 보존, 공개 포털 카드·이미지·링크·console 확인, 확인 뒤 placeholder 교체 순서가 명시됨
- rollback: 전체 `git revert` 우선안, 부분 복구안, 별칭 외부 공유 시 404 대신 안전한 대상/안내로 복구, 롤백 후 포털·기존 데모·별칭·workflow 재확인이 명시됨
- 승인 유효기간: 승인 시각부터 24시간이며 후보 파일 내용·배포 SHA·Pages 설정·썸네일 변경 시 자동 무효화하고 새 승인을 받도록 제한됨

## tested

- 루트 포털 DOM 렌더와 CAMP FLOW/UNFRAME 카드 매핑
- 두 썸네일의 실제 브라우저 decode, 크기, complete 상태, SHA-256 차이
- ASCII 별칭의 query/hash 보존
- 루트, 별칭, 데모73 6페이지의 HTTP 200
- 전체 대상 페이지의 console/pageerror/network 오류
- unit 29, browser QA 81, probe 4
- SOURCES/credits/WebP 18:18:18
- 지원서 견적·일정·문자 수·줄 수·placeholder·draft 조건
- Git 후보 경계, ignore 규칙, staged 0, conflict 0
- 배포 후 healthcheck, rollback, 24시간 승인 유효기간의 충분성

## not_tested

- GitHub Pages 프로덕션 배포와 공개 URL HTTP 200
- 실제 stage/commit/push/deploy
- 배포 후 CDN·브라우저 캐시 전파와 실제 rollback 수행 시간
- 실제 PG, 서버, DB, API, 웹훅, 메시지 발송, 실시간 재고
- iOS Safari, Android Chrome 실제 기기, NVDA 음성 출력
- 이미지 권리의 법률상 최종 판단

## evidence

- 이번 세션 실제 명령 출력: unit 29/29, QA 81/81, probe 4/4
- 기존 Chrome 통합 probe 출력: Chrome 151.0.7922.172, HTTP 8/8 200, console/pageerror/network 0/0/0
- 통합 probe DOM 값: CAMP FLOW count=1, 링크·thumb76, UNFRAME thumb73, decoded 900×900
- SHA-256 계산 출력: 76/73 해시 상이
- 정적 문서 audit 출력: SOURCES/credits/WebP 18/18/18, 지원서 2,352자·78줄, 포트폴리오 4,151자·124줄
- Git dry-run audit: 허용 범위 밖 0, node_modules/qa/.claude/프린트라인/73.webp 후보 0
- `git diff --cached --name-only`: 0
- `git diff --name-only --diff-filter=U`: 0

## owner

- 품질 게이트 판정: `argos`
- stage/commit/push 및 배포 실행: `hephaestus`
- 프로덕션 C등급 승인 요청 취합: `hermeschief`
- 최종 승인: 대표

## next_action

1. `hermeschief`: 본 PASS와 `20260827_데모73_배포준비_v01.md`를 묶어 대상·영향·rollback·24시간 유효기간이 포함된 C등급 최종 승인 1회를 요청한다.
2. 승인 후 `hephaestus`: 네 허용 영역만 명시적으로 stage하고 cached diff의 unrelated 혼입 0을 재확인한다.
3. 배포 후 `hephaestus`/`argos`: Pages SHA, 별칭·원본 6페이지 HTTP 200, query/hash, 포털 카드·썸네일·console을 healthcheck하고 나서만 지원서 placeholder를 공개 URL로 교체한다.
4. healthcheck 실패 시 즉시 전체 revert 우선안으로 rollback하고 기존 URL을 재확인한다.

## needs_confirmation

- 로컬 QA 판정에는 없음.
- 프로덕션 stage/commit/push/deploy 전에 대표의 C등급 최종 승인 1회가 필요하다.

## 최종 요약

- status: approved / Deploy Ready PASS
- conclusion: P0 0, P1 0, 통합 충돌 0. 요청된 로컬 통합 수용기준 충족
- artifacts: `분석/20260827_데모73_QA_gate_v03_deploy_ready.md`
- verification: HTTP 8/8 200, browser error 0, unit29/qa81/probe4, SOURCES/credits 18, 후보 경계 PASS
- risks: 프로덕션 미검증, unrelated dirty 작업 트리, v02 엄격 무인 기준 비차단 관찰
- next_action: C등급 최종 승인 취합 후 제한된 후보만 stage·배포·healthcheck
- needs_confirmation: 프로덕션 실행 전 대표 최종 승인 필요
