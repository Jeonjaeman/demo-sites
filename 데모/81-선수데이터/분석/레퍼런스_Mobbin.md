# 81 선수데이터 — Mobbin 레퍼런스 수집 (2026-10-16)

> 출처 종류: **갤러리 (Mobbin MCP)** — 스크린샷이라 **실측값 없음**. 화면 구성·정보 위계·흐름만 가져온다.
> 색·px·이징 수치는 아래 「다음 단계」의 라이브 사이트 실측으로 채운다. 어워드로 세지 않는다.
> 이미지 원본: `분석/mobbin/` (Mobbin `image_url`은 30일 뒤 만료 → 파일로 보관). 출처 링크는 각 행의 `mobbin_url`.

검색 10회 — screens 7 · sections 2 · flows 1 (web/ios), 후보 약 70개 중 27건 선별.
선별 기준: 공고의 ① 선수 정보·제품 사이즈·착용 평가 입력 ② 센서 CSV 업로드 ③ 기록 조회·그래프 ④ 좌우 움직임 비교·기간 추이(미정 범위) ⑤ 관리자 전체 조회·엑셀 추출 — 그리고 사용자가 요청한 **3D 모델링/3D 데이터 시각화**.

---

## A. 3D 신체 + 데이터 (핵심 축)

| # | 앱 · 플랫폼 | 화면에서 본 것 | 81에 가져올 것 | 파일 · 출처 |
|---|---|---|---|---|
| A01 | Equinox+ · iOS | 검정 3D 마네킹 앞/뒤 2체, 사용 부위가 청록→보라 발광 그라데이션. 아래 「Areas / Moves」 % 목록 | **선수 3D 바디 히트맵** — 센서 부착 부위(흉부·견갑·골반)별 움직임량을 발광 강도로, 아래 수치 목록과 1:1 | `A01_equinox_focus-areas.webp` · [mobbin](https://mobbin.com/screens/c88d72a7-774f-4eed-89ad-cc8623380fab) |
| A02 | UNIQLO MySize Assist · iOS | 흰 3D 마네킹 위 어깨·몸통 둘레를 파란 라인으로 강조, 좌측 콜아웃 「A little loose / Too loose」, 상단 사이즈 탭(XXS~3XL) | **스포츠브라·드로즈 사이즈 + 착용 평가 피드백을 몸 위에 직접 표시** — 평가 항목(가슴 둘레 압박·어깨끈 쏠림 등)을 해당 부위 콜아웃으로 | `A02_uniqlo_mysize-assist.webp` · [mobbin](https://mobbin.com/screens/a6b6ee21-cb20-4e53-bef5-ded34f11d9eb) |
| A03 | Noom · iOS | 3D 바디 스캔 + 「Show 3D body scan」 토글, 아래 지표 2×2 | **3D 보기 on/off 토글** — 저사양 PC·모바일은 2D 실루엣으로 폴백 | `A03_noom_3d-body-scan.webp` · [mobbin](https://mobbin.com/screens/cd2af751-c1e0-4728-9c26-8219bfdea75f) |
| A04 | Superpower · iOS | 흰 무광 디지털 트윈 상반신, 한 줄 설명 + 단일 CTA | 선수 상세 헤더의 **디지털 트윈** 톤 — 무광 흰 모델, 장식 없이 | `A04_superpower_digital-twin.webp` · [mobbin](https://mobbin.com/screens/56ace66f-49c1-474e-979a-c148a7ec1b29) |
| A05 | Tonal · iOS | 앞/뒤 실루엣을 상태색(초록 Fresh·회색·빨강 Fatigued)으로, 아래 상태별 부위 칩 | **상태 범례 = 색 3단계** + 부위 칩 그룹 | `A05_tonal_muscle-readiness.webp` · [mobbin](https://mobbin.com/screens/1aeeb897-cb51-490b-9091-fc7c0bbee48d) |
| A06 | Peloton · iOS | 앞/뒤 실루엣 + 부위별 % + 3칸 미니 바 | 부위별 수치 목록의 **미니 바 표기** | `A06_peloton_body-activity.webp` · [mobbin](https://mobbin.com/screens/220feaaa-ce7a-41c8-82af-8870bb94d9eb) |
| A07 | Hevy · iOS | 7일 날짜 칩 선택 → 바디 그래프, 「Muscle distribution (Chart) / (Body)」 두 보기 | **기간 선택 + 차트 보기 ↔ 바디 보기 전환** — 같은 데이터를 두 형태로 | `A07_hevy_body-graph.webp` · [mobbin](https://mobbin.com/screens/c8837fd2-c265-4e1a-8e27-7bcb5bb463bb) |
| A08 | Strava · iOS | 정면 바디 주황 하이라이트, 우측 부위 라벨, 우상단 회전·리셋 버튼 | 3D 뷰의 **시점 리셋 버튼** 위치 | `A08_strava_muscle-map.webp` · [mobbin](https://mobbin.com/screens/74c48699-f4b2-41e5-bfe0-9b2d65bc2380) |
| A09 | Higgsfield Virality Predictor · Web | 좌: 원본 영상 / 우: 3D 뇌 모델 히트맵 + 「Analyzing」 상태 + 아래 영역별 지표 바 | **3D 모델 + 영역별 수치 바를 한 카드에** · 업로드 직후 분석 중 상태 | `A09_higgsfield_3d-brain-score.webp` · [mobbin](https://mobbin.com/screens/77ce4ea4-ca3e-478e-b106-41a7b3e5283e) |

## B. 3D 뷰어 조작

| # | 앱 · 플랫폼 | 화면에서 본 것 | 81에 가져올 것 | 파일 · 출처 |
|---|---|---|---|---|
| B10 | Krea AI · Web | 객체 위 RGB 회전 링 기즈모, 우측 패널 Position/Rotation/Scale X·Y·Z 숫자 | **IMU 회전값(roll·pitch·yaw)을 XYZ 숫자 패널로** + 3D 위 회전 링으로 현재 자세 표시 | `B10_krea_3d-gizmo-xyz.webp` · [mobbin](https://mobbin.com/screens/e4065c44-d3dd-40f8-97db-7087db9dfce6) |
| B11 | Krea AI · Web | 우측 「3D Object」 패널: Wireframe·Rim Light 토글, 강도 슬라이더 | 3D 표시 옵션(와이어프레임·센서 위치 표시) 토글 패널 | `B11_krea_3d-object-panel.webp` · [mobbin](https://mobbin.com/screens/2b2e6816-0fa7-4b40-a15c-a450552a5053) |
| B12 | Magnific · Web | 3D 모델 상세 모달: 포맷 칩(GLB), triangles/vertices 칩, Download Model | 관리자 제품(스포츠브라 모델·버전) 화면의 **모델 정보 칩** | `B12_magnific_3d-model-info.webp` · [mobbin](https://mobbin.com/screens/e653b264-0fce-4f34-a1d9-79623c3f025b) |
| B13 | Spline · Web 섹션 | 「Drag the cube to interact with it」 안내 + X·Y·Z 축선 | 3D 뷰 첫 진입 시 **드래그 안내 문구** (조작 가능 여부를 알려줌) | `B13_spline_drag-to-interact_section.webp` · [mobbin](https://mobbin.com/sites/sections/8a590fed-9ab7-4293-a6a2-ad3b43cf2733) |

## C. 센서 시계열 · 좌우 비교

| # | 앱 · 플랫폼 | 화면에서 본 것 | 81에 가져올 것 | 파일 · 출처 |
|---|---|---|---|---|
| C14 | Apple Health · iOS | 「Walking Asymmetry 2.7%」 카드 + 미니 스파크라인 | **좌우 비대칭 % 카드** — 공고의 「좌우 움직임 비교」를 한 숫자로 요약하는 표준 표기 | `C14_applehealth_walking-asymmetry.webp` · [mobbin](https://mobbin.com/screens/d66bfd32-f311-4414-b0a7-8f9bebc2eddf) |
| C15 | Garmin Connect · iOS | Time/Distance 세그먼트, 지표마다 평균·최고 + 면적 차트, 0:00~ 시간축 | 세션 상세의 **지표별 평균·최고 + 시계열** 블록 | `C15_garmin_session-charts.webp` · [mobbin](https://mobbin.com/screens/8d6c0d78-61c7-44b5-9e3f-d060c1bc1faf) |
| C16 | Gentler Streak · iOS | 심박(산점)·페이스(라인)·고도(라인) 3채널이 **같은 x축**으로 세로 정렬 | **IMU 회전·기울기·속도 3채널 동기 차트** — 같은 시점을 세로로 맞춰 비교 | `C16_gentlerstreak_multichannel.webp` · [mobbin](https://mobbin.com/screens/ce1d6ffa-7dcc-457d-b323-9d70f0e4c5e1) |
| C17 | Bevel · iOS | 구간별 막대(Splits), 회복 곡선, Poor~Superior 등급 스케일 바 | 착용 평가·불균형 지표의 **등급 스케일 바** | `C17_bevel_splits-grade-scale.webp` · [mobbin](https://mobbin.com/screens/9dca9847-d793-4f27-af96-5f4f200e17f9) |
| C18 | Hume AI · Web | File analysis: 좌 파일 프리뷰 · 하단 다채널 타임라인 · 우 Embedding Plot · 맨 우측 파일 업로드 패널 | ★ **업로드한 CSV 분석 화면 골격** — 좌 원본 미리보기 · 중 타임라인 · 우 파일/세션 패널 | `C18_hume_file-analysis-timeline.webp` · [mobbin](https://mobbin.com/screens/19fea0b9-2e22-40d0-9079-0a524a22d3b6) |
| C19 | Optimal Workshop · Web | 「3D cluster view」 탭: 3D 산점, 좌 옵션 패널(그룹 수 슬라이더), 상단 줌/리셋 | **세션 3D 산점**(회전×기울기×속도 축) — 좌우 데이터가 다른 덩어리로 갈라지는지 | `C19_optimal_3d-cluster-view.webp` · [mobbin](https://mobbin.com/screens/b64ac2f1-cfd2-45ae-94a7-143d4e00e44d) |

## D. CSV 업로드 · 관리자

| # | 앱 · 플랫폼 | 화면에서 본 것 | 81에 가져올 것 | 파일 · 출처 |
|---|---|---|---|---|
| D20 | Customer.io · Web 흐름 (4화면) | 스텝 3단(Upload CSV → Map fields → Review), 열마다 샘플 2행 + 속성 매핑, Review에서 신규·기존·ID 변경·경고·**오류 0** 카운트 | ★ 공고 미정 범위 「**업로드 파일 형식 자동 확인**」의 표준 흐름 | `D20_customerio_import-1~3.webp` · [mobbin](https://mobbin.com/flows/246ac8d9-3fc6-42e1-a04c-aede744f7879) |
| D21 | Bonsai · Web 흐름 (11화면) | 지원 필드·형식(YYYY-MM-DD) 사전 안내 + 템플릿 다운로드 → 헤더 매칭 + 샘플 미리보기 → 실패 시 **「Line N – 이유」 줄 단위 오류** | CSV 형식 안내 + **행 단위 오류 목록** (센서 앱 CSV 컬럼이 바뀌어도 어디가 틀렸는지 보임) | `D21_bonsai_import-*.webp` · [mobbin](https://mobbin.com/flows/75528a02-5c95-4904-abb0-4859948a3906) |
| D22 | Gumloop · Web | CSV 스냅샷 경고 배너, KPI 4(총 기록·평균·최소·최대) + 기간, 추이선 + 분포 막대, 레코드 표 | **선수 기록 조회 화면 골격** — KPI → 추이 → 분포 → 원본 표 순서 | `D22_gumloop_csv-score-dashboard.webp` · [mobbin](https://mobbin.com/screens/ec0064cb-434c-4e51-a6e5-ddae786c995e) |
| D23 | StackAI · Web | KPI 소형 다중 6칸(숫자 + 미니 차트), 날짜 범위, 아래 정렬 가능한 표 + 행 수 선택 | 관리자 전체 집계 — **소형 다중 차트** | `D23_stackai_kpi-small-multiples.webp` · [mobbin](https://mobbin.com/screens/03fb91f0-89d0-45e6-ada1-34d533a3febf) |
| D24 | Meetup · Web | 검색 + 세그먼트 칩 + 필터 드롭다운 5종 + Export, 하단 고정 선택 바 | **관리자 선수 목록**(익명 ID·종목·절단 부위 필터) + 엑셀/CSV 추출 | `D24_meetup_members-table.webp` · [mobbin](https://mobbin.com/screens/c9704a3c-644d-4aba-8780-128aabb8921b) |

## E. 톤 · 섹션

| # | 사이트 | 화면에서 본 것 | 가져올 것 | 파일 · 출처 |
|---|---|---|---|---|
| E25 | Bevel · Web 섹션 | Strain·Sleep·Recovery 3카드, 카드마다 한 줄 정의 + 폰 화면 | 지표 카드의 **한 줄 정의 문법** | `E25_bevel_metric-cards_section.webp` · [mobbin](https://mobbin.com/sites/sections/f324f5f1-a03a-4788-b1ef-9ddb8a4352c8) |
| E26 | Sunday · Web 섹션 | 어두운 배경 + 얇은 세로 라인 막대, 한 막대에만 값 라벨 | 모션 데이터의 **미니멀 다크 시각 톤** | `E26_sunday_movement-bars_section.webp` · [mobbin](https://mobbin.com/sites/sections/f27977b8-0ee9-46bf-9848-be937411d990) |
| E27 | Visitors · Web 섹션 | 회색 3D 지구본 위 실시간 점·카운트 배지 | 3D 오브젝트 위 **데이터 포인트 배지** | `E27_visitors_3d-globe_section.webp` · [mobbin](https://mobbin.com/sites/sections/487e372c-a833-46ec-b112-e9ddc1dacd3f) |

---

## 수집에서 나온 설계 단서

1. **3D 바디는 "보는 화면"이고 수치는 반드시 옆에 목록으로 붙는다.** A01·A05·A06·A09 모두 3D/실루엣 아래나 옆에 부위별 숫자 목록이 1:1로 있다. 3D만 있고 숫자가 없는 화면은 없었다 → 81도 3D 히트맵 + 부위별 수치 표를 한 묶음으로.
2. **좌우 비교는 한 숫자로 요약하는 관행이 있다.** Apple Health「Walking Asymmetry %」(C14). 상지 절단 선수의 보상 움직임(공고 배경)을 「좌우 비대칭 %」 카드 + 3D 바디 좌·우 색 차이로 보여 줄 수 있다. 공고에서 좌우 비교 그래프는 「아직 정하지 않은 범위」이므로, 데모에 넣고 지원서에서 "포함 권장 + 데이터 구조는 지금 잡아 둔다"로 답한다.
3. **상지 절단 선수에게 대칭 마네킹을 그대로 쓰면 맞지 않는다.** 수집한 바디 화면은 전부 사지가 온전한 표준 체형이었다. 81은 선수 프로필의 절단 부위·좌우 정보를 3D/실루엣에 반영(해당 팔 반투명·센서 미부착 표시)해야 한다 — 레퍼런스에 없는 지점이라 차별점이 된다.
4. **3D는 토글로 둔다.** Noom(A03)처럼 3D on/off를 두고 기본은 2D 실루엣 + 차트로 둔다. 예산 400만 원·30일 MVP에서 3D가 기본 경로를 무겁게 만들면 안 된다 (three.js 경량 모델 1개 + 부위 메시 색상만 바꾸는 수준).
5. **CSV 업로드는 3단계 + 행 단위 오류가 표준이다.** D20·D21 — 센서 업체 앱의 CSV 형식이 개발 중이라 바뀔 수 있으므로(공고: 센서 앱은 별도 업체 개발 중) 컬럼 매핑 단계가 실제로 필요하다.

## 다음 단계 — 라이브 실측 (CLAUDE.md 3단계)

Mobbin은 구성 참고용이다. 수치는 공개 라이브 사이트에서 뽑는다.

- 공개 사이트 실측 후보: Bevel 웹(E25) · Superpower 웹(A04·지표 섹션) · Spline 웹(B13) · Visitors 웹(E27)
- 로그인 뒤 제품 화면으로 보이는 것(Hume AI·Customer.io·Gumloop·StackAI·Krea): 열 수 없으면 `Mobbin · 구성 참고 — 실측값 없음`으로 표기
- 어워드 레퍼런스(최소 1곳)는 Mobbin과 별도로 Awwwards·CSSDA·GDWEB에서 채운다
