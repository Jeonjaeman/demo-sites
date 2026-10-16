# 82 건축자재 소개·셀프견적·샘플신청 — Mobbin 레퍼런스 수집 (2026-10-16)

> 출처 종류: **갤러리 (Mobbin MCP)** — 스크린샷이라 **실측값 없음**. 화면 구성·정보 위계·흐름 단계 수·빈 상태/검증 처리만 가져온다.
> 색·px·이징 수치는 `_레퍼런스_실측.md`의 라이브 사이트 실측(포미코리아·Fireclay·Neolith·Marvell·LPAS·계림바스)에서 채운다. Mobbin은 어워드로 세지 않는다.
> 이미지 원본: `분석/mobbin/` (Mobbin `image_url`은 30일 뒤 만료 → 파일로 보관). 출처 링크는 각 행의 `mobbin_url`.
> 모든 호출 공통: `platform: web` · `output_destination: code` · `task_intent: "Build a demo website for a building materials brand with product specs, a quantity calculator, sample ordering, project gallery and an admin."`

## 검색 기록 (13회 — screens 8 · flows 2 · sections 3)

| # | 도구 | 쿼리 | 결과 | 쓸 만한 것 |
|---|---|---|---|---|
| 1 | screens | building material product detail page with specifications table | 7 | Programa 스펙 드로어 (나머지 adidas·Uvodo·Shop·ZARA·Unity·OpenSea는 이커머스 PDP, 스펙표 없음) |
| 2 | screens | tile quantity calculator enter room dimensions | 7 | Etsy 배송 계산기 · Oyster 계산기 · Airtasker 면적 칩 (타일 계산기 자체는 Mobbin에 없음 → Fireclay 라이브 실측으로 보완) |
| 3 | screens | order free samples select up to swatches | 6 | Apple 색상 타일 (Revolut·Wise 카드 색 선택, HelloFresh 무료 상품, Wix, Givingli는 무관) |
| 4 | screens | project gallery filter by material | 7 | Vercel 패싯 필터 · Webflow CMS 상태 표 (Lovable·Asana·Airtable·Replit·Codecademy는 SaaS 프로젝트 목록) |
| 5 | screens | admin content management product list with edit | 7 | Wix · Midday · Podia (Kajabi·QuickBooks·HubSpot·Jobber는 같은 문법 반복) |
| 6 | screens | downloads resource library documents list | 7 | Vanta · Oyster 문서 카드 (HubSpot·PandaDoc·Gusto·Slite·Elicit는 참고만) |
| 7 | flows | request material samples with shipping address | 3 | Walmart 주소 드로어 + 주소 검증 (Mindtrip·Shopify 주소 추가는 같은 문법) |
| 8 | flows | quote request after calculator result | 3 | **Deel 견적 요청 5화면** · Zoho CRM 견적 작성 13화면 (Klook 보험 견적은 참고만) |
| 9 | sections | full-bleed project showcase grid | 7 | Pentagram · Mother Design · MOUTHWASH (OFF+BRAND·Analogue·Readymag은 빈 캡처 또는 장식형) |
| 10 | sections | floating quick contact menu | 6 | monday "Get in touch" 3카드 + FAQ — **플로팅 퀵메뉴 사례는 0건** → 라이브 계림바스(B3)에서 실측 |
| 11 | sections | product specification table | 6 | In Common With · Seasats · Lightship · Daylight (Oryzo·Oura는 장식형) |
| 12 | screens | sample box drawer showing selected product swatches with remove buttons and checkout | 6 | Hers 카트 드로어(단계 아이콘) (Hims 동일 · Sweatpals·Care.com·Instacart·DoorDash 참고만) |
| 13 | screens | case study detail page with project photos, materials used and related projects | 6 | Uxcel "TOOLS USED" 칩 · Canva "More like this" (Fiverr·Webflow·Dovetail·Linear 참고만) |

선별 기준: 공고의 ① 제품 스펙 상세 ② 셀프견적(치수 입력 → 수량) ③ 견적 의뢰 전환 ④ 샘플 선택 + 배송정보 ⑤ 시공사례 ↔ 사용 자재 연계 ⑥ 자료실 4분류 ⑦ 플로팅 퀵메뉴·고객센터 ⑧ 비개발자 관리자(제품·사례·자료 등록). 결과 78개 중 **26건(파일 30장)** 선별.

---

## A. 제품 상세 · 스펙표 (제품보기 / 제품 상세)

| # | 앱 · 플랫폼 | 화면에서 본 것 (이미지 직접 확인) | 82에 가져올 것 | 파일 · 출처 |
|---|---|---|---|---|
| M02 | In Common With · Web 섹션 | 좌 「Tech Specs」 2열 표(Dimensions · Weight · Bulbs Included · Max Wattage · Materials · Certification — 행마다 헤어라인), **같은 줄 우측에 「Downloads」 버튼 4개**(Tear Sheet · Assembly Guide · 2D Drawing · 3D Drawing, 각 ↓ 아이콘 · 테두리 버튼) | **스펙표 바로 옆에 그 제품 자료(시공가이드·인증서·카탈로그) 다운로드** — 자료실 게시물을 제품에 연결해 두 번 등록하지 않게 | `M02_incommonwith_techspecs-downloads_section.webp` · [mobbin](https://mobbin.com/sites/sections/6c5ddd6d-bd8e-4cbf-9616-8016064f2bdc) |
| M03 | Seasats · Web 섹션 | 대형 제목 「Engineered for every need」 + 우측 2줄 설명 → 3모델 이미지 카드(이름 + 특징 4단어) → 아래 **모노 대문자 비교표**(ROLE · TOP SPEED · WEIGHT · ENDURANCE · PAYLOAD CAPACITY · DEPLOYMENT · IDEAL USE CASES, 단위 병기 `305 LBS (138 KG)`) | 포미스톤 / 포미 디스플레이 / 포미쏠라 **3라인 비교표**, 또는 같은 색상의 **길이 규격(600·2400·2700·3000) 비교** — 단위 항상 병기 | `M03_seasats_model-spec-compare_section.webp` · [mobbin](https://mobbin.com/sites/sections/39befa08-639c-41be-9da9-3f6ec0d7d4c0) |
| M04 | Lightship · Web 섹션 | 「All Specifications」 대형 제목 → **그룹 아코디언**: 첫 그룹(Bathroom)만 펼침, 항목/값 2열 줄무늬 행, 나머지 7그룹은 제목 + `+`로 접힘 | 스펙이 많은 제품의 **그룹 아코디언**(기본 규격 · 물성 · 시공 · 인증) — 모바일에서 이미지 상세를 대체하는 텍스트 스펙 | `M04_lightship_spec-accordion_section.webp` · [mobbin](https://mobbin.com/sites/sections/e86b17db-e10c-4ecf-af91-d1e36eff40c3) |
| M25 | Daylight · Web 섹션 | 다크 띠 제목 「Product Specs」 → 기능 3카드(제품 이미지 + 제목 + 2줄 설명) → **3열 스펙 그룹**(Display / Performance / Connectivity), 행 사이 점선 구분 | 상세 상단은 "왜 좋은가" 3카드(불연 · 경량 · 곡면 시공), 하단은 3열 스펙 — 감성 카피와 숫자 스펙 분리 | `M25_daylight_specs-3col_section.webp` · [mobbin](https://mobbin.com/sites/sections/5d57fbff-5355-4f3d-91b4-eff403615a2d) |
| M01 | Programa · Web | 일정표 위 **우측 드로어**: 상단 Summary / Financial / Attachments / Approvals 탭 + 우상단 상태 `Draft ▾` → 「Product Specifications」 2열 입력(Height · Depth · Width · Length · Colour · Finish · Material · Product Category) → 「Custom Specs」 `Label* / Details` 행 + **`+ New Spec`** → Notes → 하단 `Download PDF` · 우하단 `Saved`(자동 저장 표시) | **관리자 제품 등록**: 고정 스펙 필드(폭 · 길이 · 두께 · 무게 · 박스당 장수) + **사용자 정의 스펙 행 추가** — 신제품마다 항목이 달라도 개발자 없이 추가. 자동 저장 표시 · 초안/게시 상태 | `M01_programa_product-spec-drawer.webp` · [mobbin](https://mobbin.com/screens/41ca78dd-e6cc-4975-afe1-03796b4c7cd0) |

## B. 셀프견적 계산기 → 견적 의뢰

| # | 앱 · 플랫폼 | 화면에서 본 것 | 82에 가져올 것 | 파일 · 출처 |
|---|---|---|---|---|
| M24 | Etsy Shipping Calculator · Web | Domestic / International 탭 → 필수 `*` 라벨 → ZIP 2칸 → 셀렉트(Package type + ⓘ) → **무게 `lb` / `oz` 단위 접미 2칸** → **Length · Width · Height `in` 접미 3칸 한 줄** → 검정 pill `See rates & discounts` · 우측은 결과 대신 혜택 카드 | 시공 면 치수 입력: **단위 접미(`m`)가 입력칸 안에 붙은** 가로·세로 한 줄 배치, 필수 표시, 내부/외부(탭) 분기 | `M24_etsy_calculator-unit-inputs.webp` · [mobbin](https://mobbin.com/screens/04c76257-11ff-4640-b0c2-95d8b77d87d1) |
| M06 | Oyster Equity tax calculator · Web | 좌 입력 카드(토글 · 국가 · 유형 · 단계 · 수량 · 가격) + 하단 우측 `Calculate taxes` · **우측 결과 자리에 빈 상태 문구**(「Here you will find the tax breakdown…」) + 설명 카드(일러스트) · **필수값 누락 시 붉은 테두리 + 「Please enter grant price」** | 셀프견적 **좌 입력 / 우 결과 2단**, 결과 빈 상태 문구, 인라인 검증, 계산 근거 설명 카드("로스율이란") | `M06_oyster_calculator-form-result.webp` · [mobbin](https://mobbin.com/screens/fd54e39a-d1e0-4389-88a1-a930a3f452bf) |
| M05 | Airtasker Post a task · Web | 좌 **단계 내비**(Title & Date · Location · **Details** · Budget, 현재 단계 세로 막대) → 「What services do you need? Choose all that apply」 **다중 선택 타일 6개**(아이콘 + 라벨, 선택 = 네이비 채움) → 설명 textarea → 「How big is the area?」 **면적 칩 4개**(Small `Under 50m²` · Medium `50m²–100m²` · Large `150m²–300m²` · Extra Large `Above 300m²`) → Back / Next | 상담신청 폼: **시공 부위 다중 선택 타일**(외벽 · 내벽 · 기둥 · 곡면) + **치수를 모르는 사람용 면적 범위 칩** — 정확 치수(계산기)와 대략 범위(상담) 분리 | `M05_airtasker_area-size-chips.webp` · [mobbin](https://mobbin.com/screens/0a9a0767-9cff-4005-a590-5a2e1d16113e) |
| M07 | **Deel Requesting a quote** · Web 플로(5화면 중 3장) | ① 히어로 우측 카드 「Request a quote」: 수량 입력(How many users/devices?) + 빈도 셀렉트 + **서비스 카드 4개**(아이콘 · 제목 · 2줄 설명 · 단가 `$9.00 per user/month` · 우상단 체크박스) + 하단 검정 `Request quote` ② 수량 1 · Monthly 입력 + 카드 체크 → **카드 테두리 강조 + 단가 즉시 갱신**(`$9.00` → `$11.00`) ③ 완료: 좌 일러스트 + 「We'll be in touch!」 + 「…within 24 hours…」 / **우 「Quote request」 요약 카드**(Total users/devices 1 · Billing Monthly · 항목 $11.00 · Estimated total amount $11.00) | **계산 결과 → 견적 의뢰가 한 화면에서 이어지는 구조.** 접수 완료 화면에 **보낸 내역 요약 + 회신 예정 시간("영업일 1일 내 연락")** 고정 — 접수 후 불안 제거 | `M07_deel_quote-1-select.webp` · `M07_deel_quote-2-checked.webp` · `M07_deel_quote-3-success-summary.webp` · [mobbin](https://mobbin.com/flows/b90943d0-ccbf-44d7-99f6-1a430ca4e7a7) |
| M26 | Zoho CRM Creating a quote · Web 플로(13화면 중 2장) | ① 「Quoted Items」 표: S.NO · Product Name(+Description) · Quantity · List Price · Amount · Discount · Tax + `+ Add row` → 우측 Sub Total · Discount · Tax · Adjustment · **Grand Total** ② 상세 Overview: Quote Number · **Quote Stage `Draft`** · Owner · Valid Until · Carrier, Overview / **Timeline** 탭, 좌 Related List(Notes · Attachments · Emails) | **관리자 견적 의뢰 상세**: 방문자 계산 내역을 행 표로(자재 · 면적 · 로스율 · 수량), 단계(접수 → 검토 → 견적 발송 → 계약/종료) + 처리 타임라인 · 메모 | `M26_zoho_quote-line-items.webp` · `M26_zoho_quote-detail-stage.webp` · [mobbin](https://mobbin.com/flows/87cc9e61-8c62-4a9d-ada4-e1fdc64eceec) |

## C. 샘플 신청 (선택 → 바구니 → 배송정보)

| # | 앱 · 플랫폼 | 화면에서 본 것 | 82에 가져올 것 | 파일 · 출처 |
|---|---|---|---|---|
| M23 | Apple Buy HomePod mini · Web | 좌 제품 이미지 + 혜택 3아이콘(무료 배송 · Apple Music · 무료 반품) / 우 「Colour」 **2열 선택 타일 5개**(원형 스와치 + 색 이름), 선택 = 테두리 강조 | 샘플 색상 선택: **스와치 + 색상명 + 코드(#01 캐스톨 화이트)** 2열 타일 — 포미코리아는 같은 정보를 이미지 안에만 둔다(A1) | `M23_apple_colour-tiles-select.webp` · [mobbin](https://mobbin.com/screens/83a6d574-bd21-463e-9379-d1e2a43f7f1a) |
| M08 | Hers Cart · Web | 우측 드로어(페이지 딤) · 상단 **5단계 아이콘 스텝**(카트 → 정보 → 배송 → 결제 → 완료) · 상품 행(정사각 이미지 · 이름 · 3줄 설명 · 가격 · `− 1 +` · `×`) · Order sub-total / Shipping / Total · Promo Code + Apply · 하단 전폭 `Next` 고정 | **샘플 바구니 드로어**: 선택 샘플 행(스와치 · 색상명 · 규격) + `×` 삭제 + **"N개 중 M개 선택" 한도 표시** + 배송비 줄 + 하단 고정 `샘플 신청하기` · 단계 3개(샘플 → 배송정보 → 완료) | `M08_hers_cart-drawer-stepper.webp` · [mobbin](https://mobbin.com/screens/7140f476-c1d6-45b8-a313-9247fd6a1d85) |
| M09 | Walmart Adding an address · Web 플로(8화면 중 2장) | ① 우측 드로어 「Add Address」 — `*Required field`, First/Last name · Street address · Apt · City · State/Zip 2칸 · Phone + 안내 1줄 · 「Set as preferred address」 체크 · 하단 Save ② **주소 검증**: 「Entered」 vs 「Suggested」 비교 + `Use suggested address` / `Continue with entered address` | 샘플 배송정보 폼: 필수 표시 · 전화 용도 안내 1줄 · **주소 검증 단계** — 국내는 도로명주소 검색(우편번호 서비스)으로 오입력 차단 | `M09_walmart_address-drawer-1-form.webp` · `M09_walmart_address-drawer-2-verify.webp` · [mobbin](https://mobbin.com/flows/3af0e360-571a-4f6f-bac5-201391d81f56) |

## D. 시공사례 (목록 필터 · 상세 · 연계)

| # | 앱 · 플랫폼 | 화면에서 본 것 | 82에 가져올 것 | 파일 · 출처 |
|---|---|---|---|---|
| M10 | Vercel Find your Template · Web | 상단 검색 → 좌 「Filter Templates」 + `⊗ Clear` → `Use Case 3`(선택 개수) 체크박스 패싯 목록 / 우 3열 카드(제목 + 2줄 설명 + 미리보기 이미지) | 시공사례 목록: **좌 패싯(사용 자재 · 시공 부위 · 공간 유형) 다중 선택 + 선택 개수 + 초기화** — 포미코리아는 공간 유형 1축뿐(A1) | `M10_vercel_facet-filter-grid.webp` · [mobbin](https://mobbin.com/screens/6a3993d5-b02b-48a2-8e7a-c1c1ed210b33) |
| M20 | Mother Design · Web 섹션 | 상단 `View: Image / List` 토글 + `Filter by: Categories (16)` → **비대칭 그리드**(대형 정사각 1 + 소형 2 / 가로 대형 1 + 세로 1), 카드 아래 제목 + 1줄 설명 | 시공사례 **이미지 보기 ↔ 목록 보기** 전환 + 카테고리 카운트 · 비대칭 배치로 "카드 3열 반복" 회피 | `M20_motherdesign_asym-grid-filter_section.webp` · [mobbin](https://mobbin.com/sites/sections/ab65e620-d6d1-4ad0-b400-d7d414d83e55) |
| M21 | MOUTHWASH Studio · Web 섹션 | 좌 「All Work」 / 우 **텍스트 목록형 필터 2열**(Service: Digital · Creative Direction… / Industry: Art · **Architecture** · Fashion…) → 아래 3열 이미지 | 칩 대신 **텍스트 목록 필터 2축(자재 / 공간)** — 브랜드 사이트 톤에 맞는 절제된 필터 | `M21_mouthwash_work-filter_section.webp` · [mobbin](https://mobbin.com/sites/sections/5ed7b943-1b00-4ccf-bfe3-50897107642b) |
| M19 | Pentagram · Web 섹션 | 3열 그리드(16:10 이미지 + 굵은 제목 + 1~2줄 설명) · 하단 전폭 회색 `Load more +` | 시공사례 카드 기본 문법(현장명 + 한 줄 설명) · 더보기 | `M19_pentagram_project-grid_section.webp` · [mobbin](https://mobbin.com/sites/sections/933958ee-3d23-4692-bcb7-650e850a84ee) |
| M17 | Uxcel Showcase · Web | 케이스 상세 하단 **「TOOLS USED」 아이콘 + 이름 칩 카드 3개**(Figma · Google Analytics · Trello) → FROM BRIEF 카드 → TOPICS 칩 → SHARE 아이콘 · 우측 작성자 카드 | 시공사례 상세 **「사용 자재」 칩**(스와치 썸네일 + 제품명 → 클릭 시 제품 상세) — 공고의 "사용한 자재" 요구의 직접 원형 | `M17_uxcel_tools-used-chips.webp` · [mobbin](https://mobbin.com/screens/27ea4a5f-7e05-4ae4-99cb-c65a23c76180) |
| M18 | Canva 템플릿 상세 · Web | 모달: 좌 대형 미리보기 + 아래 썸네일 6장 줄 / 우 Pro 배지 · 제목 · 메타 · 작성자 Follow · 주 CTA · `⋯`(Share / Report) → 아래 **「More like this」 5열** | 시공사례 상세 하단 **「같은 자재로 시공한 사례」** 가로 줄 — 공고의 "연계된 시공사례" | `M18_canva_detail-more-like-this.webp` · [mobbin](https://mobbin.com/screens/d0a2ae3a-06fa-4841-b4fc-cfd7e04bed66) |

## E. 자료실 · 고객센터

| # | 앱 · 플랫폼 | 화면에서 본 것 | 82에 가져올 것 | 파일 · 출처 |
|---|---|---|---|---|
| M15 | Vanta Documents · Web | 좌 「CATEGORY」 목록(All · HR · IT · Policy · Engineering · Risks · Custom / Deactivated) · 상단 검색 + 필터 칩(Status · Subcategory · Frequency · `Framework (1)` · Priority · Owner · Time Sensitivity · Clear) · 표(이름 · Framework 칩 · Category + 하위 · Owner 아바타 · **Status 배지 `Needs document` / `Needs update` / `OK`** · Due date) | 자료실: **좌 카테고리 4종(인증/기술자료 · 시공가이드 · News · 카탈로그)** + 관리자 측 상태(최신 / 개정 필요) | `M15_vanta_documents-category-filter.webp` · [mobbin](https://mobbin.com/screens/7604dc30-f8bd-4e4a-9d84-bf4b870eb967) |
| M16 | Oyster Tools and resources · Web | **PDF 아이콘 + 제목 + 1~2줄 설명 + `Download Document ↓`** 카드 세로 나열 → 하단 그라디언트 박스 「Can't find what you're looking for?」 + `Visit help center ↗` | 자료 카드(파일 형식 아이콘 · 설명 · 다운로드) + **"찾는 자료가 없나요? → 상담신청" 하단 유도**(검색 0건 처리) | `M16_oyster_download-document-cards.webp` · [mobbin](https://mobbin.com/screens/26904b37-da5c-4004-b3ff-9c0e9278b1e5) |
| M22 | monday.com Help center · Web 섹션 | 「Get in touch」 + 「Select how you would like to contact us」 → **연락 방법 3카드**(Live chat · Email us · Request a call, 일러스트 아이콘) → 「Top FAQs」 아코디언 4행 | 고객센터 첫 화면: **카톡문의 · 상담신청 · 샘플신청 3카드 + 자주 묻는 질문 상위 노출** | `M22_monday_get-in-touch-faq_section.webp` · [mobbin](https://mobbin.com/sites/sections/0b855102-708f-423c-87c7-3811ee8b6ca5) |

## F. 비개발자 관리자 (제품 · 시공사례 · 자료 등록)

| # | 앱 · 플랫폼 | 화면에서 본 것 | 82에 가져올 것 | 파일 · 출처 |
|---|---|---|---|---|
| M11 | Wix Products · Web | 「Products 13」 + `More Actions ▾` + `+ New Product` · 상단 `All products (13) ▾` · Manage View · Filter · 내보내기 · 검색 → 표(체크 · 썸네일 · 이름 + `2 variants` · Type · SKU · Price(취소선 원가) · Inventory) · **행 `⋯` 메뉴 Edit product / Duplicate / Delete** | 관리자 제품 목록 표 + **"복제"로 비슷한 신제품 등록**(같은 시리즈 색상 추가가 대부분) | `M11_wix_admin-products-rowmenu.webp` · [mobbin](https://mobbin.com/screens/7b2201a2-704b-411d-b0e8-3deb87e7c95f) |
| M12 | Webflow CMS Collections · Web | 좌 「CMS Collections」(Projects 5 items · Ecommerce 2) / 표(Name · **Status `● Published` / `✎ Draft`** · Link(슬러그) · Modified · Published) · 우 Filter 패널(Status: All · Published · Draft · Scheduled · Archived / Published · Created · Modified 기간 라디오 / `Apply filters`) | 시공사례 · 자료 목록: **게시 상태 4종(초안 · 게시 · 예약 · 보관)** + 주소(슬러그) + 수정일 | `M12_webflow_cms-status-table.webp` · [mobbin](https://mobbin.com/screens/b9c5c6b0-a0fd-441e-a75c-0ee705d9b808) |
| M13 | Podia Products · Web | 「Products」 + `+ New product` · 검색 · `All products` · `Name` 정렬 → 2행: 썸네일 · 이름 + `Course • Open` · **상태 배지 `○ Draft` / `✓ Published`** · Offer · Customers · `⋯` + **`Edit` 버튼 상시 노출** | 비개발자용: **"수정" 버튼을 행 메뉴에 숨기지 않고 항상 보이게**, 상태 배지 2종만 | `M13_podia_draft-published-list.webp` · [mobbin](https://mobbin.com/screens/44fcaca9-86f3-4079-8988-b07905065d1d) |
| M14 | Midday Edit Product · Web | 표 위 우측 패널 「Edit Product」: Name + **도움말 1줄**(「This is the product display name.」) · Description + 도움말 · Price / Unit 2열 + 도움말 · Currency · **Active Status 토글 + 설명**(「Product is inactive and won't appear…」) · 하단 전폭 `Update` | **필드마다 한 줄 도움말**(비개발자) + **노출 토글**(사이트에 보일지) — 화면 이동 없는 우측 편집 패널 | `M14_midday_edit-product-panel.webp` · [mobbin](https://mobbin.com/screens/667e0990-d6d7-40d3-af9e-8c8ae8e744d2) |

---

## 화면 설계에 어디 쓰는가 (요약)

| 데모 화면 | Mobbin 근거 | 라이브 실측 근거(`_레퍼런스_실측.md`) |
|---|---|---|
| 제품 상세 | M02 스펙 + 자료 다운로드 · M04 그룹 아코디언 · M25 감성 3카드 + 3열 스펙 · M03 규격 비교표 | Neolith 스펙 패널(A3) · Fireclay Specs 아코디언(A2) |
| 셀프견적 | M24 단위 접미 입력 · M06 좌 입력/우 결과 + 빈 상태 · M05 면적 범위 칩 | Fireclay 로스율 셀렉트 + 판매 단위 올림(A2) |
| 견적 의뢰 · 접수 완료 | M07 Deel 결과→의뢰 한 화면 + 완료 요약 | — |
| 샘플 신청 | M23 스와치 타일 · M08 바구니 드로어 + 단계 · M09 주소 검증 | Fireclay `Order $3 Sample` 버튼 위계(A2) |
| 시공사례 목록 · 상세 | M10 패싯 · M20 보기 전환 · M21 텍스트 필터 · M19 카드 · M17 사용 자재 칩 · M18 연계 사례 | Fireclay 라이트박스 핫스팟(A2) · LPAS 필터 카운트·클립 리빌(B2) · Marvell 크레딧 행(B1) |
| 자료실 · 고객센터 | M15 카테고리 + 상태 · M16 자료 카드 + 빈 결과 유도 · M22 연락 3카드 + FAQ | 계림바스 퀵메뉴(B3) |
| 관리자 | M01 사용자 정의 스펙 · M11 복제 · M12 게시 상태 4종 · M13 수정 버튼 상시 · M14 필드 도움말 · M26 견적 단계·타임라인 | 라이브러리 재사용 shopify-admin(관리자 토큰) |

## 라이브 실측으로 넘긴 것 (Mobbin에서 못 채운 축)

| 축 | Mobbin 결과 | 라이브 대체 |
|---|---|---|
| 타일/석재 **수량 계산기** | 계산기 일반형(Etsy · Oyster)만 — 로스율 · 판매 단위 올림 사례 없음 | **Fireclay Tile 제품 상세 실측**: 로스율 0/10/15/20% 셀렉트 · 판매 단위(2 sqft) 올림 — A2 |
| **사진 위 사용 자재 핫스팟** | 없음 | **Fireclay 갤러리 라이트박스 「Shop Now」** · **Neolith 제품 상세 「See products (N)」** — A2 · A3 |
| **플로팅 퀵메뉴** | 0건(monday 연락 3카드뿐) | **계림바스(웹어워드코리아 2025 인테리어분야 대상) 우측 고정 퀵메뉴** 56px 원형 → 라벨 확장 — B3 |
| 건자재 브랜드 디자인 품질 | 해당 없음 | Marvell Tile & Stone(Awwwards SOTD) · LPAS(Awwwards SOTD) — B1 · B2 |

> Mobbin 수록작이 해외 SaaS 위주라 국내 건자재 관행(대리점망 · 카톡 상담 · 이미지형 제품 상세)은 나오지 않는다 → 포미코리아(A1) · LX Z:IN(S1) 라이브 확인으로 보완했다.
