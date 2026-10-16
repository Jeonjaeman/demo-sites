# 아파트고 리뉴얼 — 3단계 레퍼런스 수집·실측 (Opus 실측 에이전트 산출물)

- 작성: 2026-10-17 · 실측 에이전트(Opus) · 메인 세션 게이트 검수용 초안
- 실측 환경: Chrome(claude-in-chrome) · **뷰포트 2280×1350 CSS px, devicePixelRatio 1** (창 크기 변경 요청이 적용되지 않아 이 뷰포트로 실측). `getComputedStyle`의 px 값은 뷰포트와 무관하게 그대로 유효하고, **vw로 정의된 값(Realevate)은 1440 기준으로 환산해 함께 적었다.** 레이아웃 폭은 px와 비율을 같이 적는다.
- 색 변환: 모든 색은 1×1 canvas `getImageData` 기법(CLAUDE.md 3단계 B)으로 hex 변환. 이번 대상에서 `lab()/oklch()` 직접 반환은 없었고, Cerebrium 쿠키 모듈의 `color-mix(in oklab, …)`만 관찰됨(디자인 토큰 아님).
- 접근 실패·제외: **Redfin = 사람 확인(CAPTCHA) 화면** → 우회하지 않고 Rightmove로 대체. 쿠키 배너(Rightmove·Cerebrium)는 비필수 거부로 닫음.
- 저장 레퍼런스 라이브러리(`레퍼런스/`)에는 부동산·지도·도면 계열이 없음(13개 사이트 중 해당 없음). 관리자 표면용 `shopify-admin`만 재사용(5장).

---

## 1. Mobbin 수집 목록 (platform=web · output_destination=code · 13개 쿼리 · 54건)

> Mobbin은 갤러리다. 아래는 **화면 구성·정보 위계·흐름·빈 상태 처리만** 기록했고, 색·px은 적지 않았다(수치는 2·3장 라이브 실측에서). 어워드로 세지 않는다. `image_url`은 30일 뒤 만료되므로 구축 시 필요한 화면은 그때 다시 검색해 파일로 내려받을 것.

### 1-1. 단지 검색 (지도+목록·필터)
| app_name | 관찰한 구성 | mobbin_url |
|---|---|---|
| Zillow | 좌 아이콘 레일 → 상단 필터바(판매유형·가격·방/욕실·유형·Filters 드롭다운 + 파랑 "Save search") → 지도 약 45% 좌 / 목록 55% 우 2열 카드. 카드 = 사진(특징 태그 배지·하트·도트 페이저) → 가격 굵게 → 방·욕실·면적·유형 한 줄 → 주소. 결과 수 + 정렬이 목록 머리 우측. 지도 위 "영역 그리기" 툴바 | https://mobbin.com/screens/1899b9a4-752f-483c-9798-3b16ea1b074f |
| Airbnb | 목록 약 60% 좌(3열) · 지도 40% 우. 지도 핀 = 가격 알약. 결과 수 + "총액 표시" 토글 | https://mobbin.com/screens/4b9d614f-7f68-47bb-83e6-7fd35efca097 |
| Kiwi.com | 필터 칩 한 줄(활성 = 채움). 지도 핀 클릭 시 핀 위 미니 카드 팝오버(사진+이름+가격+닫기). 목록 가로 카드(사진 좌·정보 중·가격+CTA 우) | https://mobbin.com/screens/861fe098-3ac6-468d-95e5-9565d273bc75 |
| KAYAK | 필터 칩 가로 스크롤 + "Map area ×" 활성 칩(지도 영역이 필터가 됨). "가격 추적" 알림 토글 배너가 목록 최상단 | https://mobbin.com/screens/f1a12a35-8bc5-441c-80be-2b6983cf1227 |
| Navan | 검색 자동완성 드롭다운(유형 아이콘+이름+보조 정보, 마지막 줄 "…로 검색"). 지도 위 체크박스 "지도를 움직이면 목록 필터" | https://mobbin.com/screens/67cc19dd-2340-4142-adb7-0d95d81b0260 |
| Tripadvisor | 브레드크럼 → H1 → 입력 3칸 → 칩 필터 → 결과 수/정렬. 지도 우측 50%, 지도 상단에 동네 칩 | https://mobbin.com/screens/282457b9-0132-4e90-9075-f642102e45dc |
| GetYourGuide | 지도 전체 모달 + 좌 목록 레일. 핀 = 카테고리 아이콘+평점, 선택 핀은 남색 채움 | https://mobbin.com/screens/d405d871-e78c-43c8-83dd-59f04a363d29 |

### 1-2. 단지 상세
| app_name | 관찰한 구성 | mobbin_url |
|---|---|---|
| Zillow | 목록 위에 뜨는 모달형 상세. 사진 1+4 모자이크("사진 38장 모두 보기"). 가격 대형 → 주소 → 우측 핵심 수치 3개(큰 숫자+작은 라벨). 월 추정액 칩. 사실 정보 2열 회색 타일 6개. 우측 sticky CTA 2개(채움+아웃라인) | https://mobbin.com/screens/d5f8bb0a-fa13-4584-8ab1-b690aea56262 |
| Expedia | 모자이크 아래 sticky 탭(개요/편의/정책/호스트). 우측 가격 카드 sticky | https://mobbin.com/screens/89862e1a-a326-4366-88f8-b09fa2f45294 |
| KAYAK | 브레드크럼 → 이름+평점 → 우측 가격+CTA → 1+4 모자이크 | https://mobbin.com/screens/c231abba-eaaa-4b22-92f1-975a73d241f3 |
| Tripadvisor | 종합 점수 대형 + 항목별 가로 막대 6개(위치·객실·가치…) → **단지 평가 항목(교통·학군·생활) 막대로 이식 가능** | https://mobbin.com/screens/6d668ea5-c20b-45f1-b182-bc0edf9523d3 |
| Care.com | 목록 위 우측 슬라이드 시트(폭 약 60%) + 탭 5개 — 목록 맥락을 잃지 않는 상세 | https://mobbin.com/screens/cf804e97-c3f5-4916-9e0d-ae05e68c8e4b |
| Nextdoor | 좌 대형 사진 · 우 정보 카드(제목·가격·작성자·공유·미니맵) | https://mobbin.com/screens/d3e05dc5-7771-4651-bcee-f33dfcdb1ff0 |

### 1-3. 도면(평면도) 뷰어
| app_name | 관찰한 구성 | mobbin_url |
|---|---|---|
| Zillow Floor Plan | 상단 세그먼트(사진/평면도/3D) 중앙. 우측 레일 = 총면적·가격·**층별 썸네일(선택 = 파랑 테두리)**. 도면 우상단 +/− 원형 줌. 실별 이름+치수 라벨. 하단 토글. 레일 하단에 "도면은 근사치" 면책 | https://mobbin.com/screens/228f0979-374e-43b2-b76d-16fb579e6c6a |
| Zillow 3D Home | 우측 레일에 층별 미니맵 + 줌 슬라이더(−●+), 현재 위치 점 | https://mobbin.com/screens/de351a24-d7b2-47b9-a330-507c90fb177d |
| Jira | 하단 중앙 플로팅 줌 툴바(스크롤 줌 체크 · − · + · 64% · Fit · Reset) → **도면 뷰어 하단 툴바 원형** | https://mobbin.com/screens/eb4e8742-d7a5-48dc-bb5b-548083c96137 |
| Felt | 좌하단 축척 바, 우하단 −/+/?, 핀 코멘트 | https://mobbin.com/screens/c98ec32f-d434-4e25-af36-76fbaa993b42 |

### 1-4. 장바구니·결제
| app_name | 관찰한 구성 | mobbin_url |
|---|---|---|
| GetYourGuide | 2단 스텝퍼. 좌 결제수단 라디오 카드(선택 = 파랑 2px 테두리). 우 주문 요약 sticky(썸네일+제목+옵션+변경 링크+합계 회색 바). 상단 "자리 유지 07:44" 타이머 배지 | https://mobbin.com/screens/344b84fb-4aa5-45c6-9d32-38fa6f94a1aa |
| lululemon | 4단 스텝퍼. 완료 단계는 요약+Edit 링크로 접힘 | https://mobbin.com/screens/e0b7545c-852b-43ca-90e8-cb0a10d2666f |
| Babbel | 상단 신뢰 문구 2개(암호화·환불 보장). 결제수단 아코디언. 회색 요약 카드 + 합계 강조 박스 | https://mobbin.com/screens/06c179e7-7ff6-4d82-81d9-198a895f5544 |
| The New York Times | 우측 회색 풀하이트 요약 패널, 좌 번호 단계(1·2·3) | https://mobbin.com/screens/1a26a80c-5c08-44c2-bc70-dbaac9790596 |
| Turo | 마케팅 수신 동의와 약관 동의를 **별도 체크박스**로 분리 | https://mobbin.com/screens/a52dd069-342e-4ce8-9d2f-5cc992c22228 |
| H&M | 결제수단 라디오 리스트 + 우측 금액 요약 + 결제 직전 개인정보·약관 고지 문단 | https://mobbin.com/screens/b5ef6202-5614-4567-9ec6-459d42e43ab8 |

### 1-5. 마이페이지(구매내역·다운로드·환불)
| app_name | 관찰한 구성 | mobbin_url |
|---|---|---|
| Wix Billing History | 좌 계정 메뉴. 필터 2개+More Filters+검색. 표: 날짜·인보이스 링크 / 설명 / 결제수단 / 상태 배지(REFUNDED·PAID) / 음수 금액 / 행 끝 ⋯ 메뉴 | https://mobbin.com/screens/16687e63-6bdb-44f5-ac82-a58f7133b43f |
| Upwork | 거래 상세 우측 드로어. 메타 4칸(날짜·유형·상대·금액). "PDF 다운로드" + 항목별 영수증 다운로드 아이콘 | https://mobbin.com/screens/7fbfc714-da53-410f-9cb7-412c9852505f |
| Airtasker | 탭(받은/보낸) + "CSV 다운로드" + 페이지네이션 | https://mobbin.com/screens/eb1456cc-eff0-4c65-b247-7495800cdd8a |
| Meetup | 칩 탭 3개 + 표 + 인쇄 아이콘 | https://mobbin.com/screens/437988ce-e257-4e27-bce8-d4dcd8769855 |
| Vimeo | 연도 셀렉트 + 영수증 재발송 | https://mobbin.com/screens/bb060a9c-a85b-4760-9a72-166f4a043a57 |
| Unity Asset Store | 주문 내역 표(날짜·결제수단·주문번호·인보이스 링크·금액·상태·상세 링크) | https://mobbin.com/screens/439a4795-6287-4cc3-aeef-8ecc7a665339 |

### 1-6. 관리자(대시보드·목록·일괄 작업)
| app_name | 관찰한 구성 | mobbin_url |
|---|---|---|
| Shopify Orders | 지표 띠 5칸+스파크라인. 표에 상태 배지 2종 동시. 취소 행 = 취소선. 하단 토스트 "Batch deleted ×" | https://mobbin.com/screens/3a03061c-4051-4069-8406-2af2225fe725 |
| Squarespace | KPI 카드 3개(라벨·기간·대형 값·변화·전체 보기) + 최근 주문 표 | https://mobbin.com/screens/4c3218dc-c6ba-4395-8896-5293699e92b3 |
| Stripe | 기간 비교 컨트롤("최근 7일 vs 이전 기간"). 스택 막대+범례. 미니 라인 카드 | https://mobbin.com/screens/02176a39-e453-4570-af73-6af00fbe681b |
| Zendesk | 좌 상태 리스트+건수(전체 13·게시 12·초안 1·보관 0). 체크 선택 시 **하단 고정 일괄 작업 바**("3개 선택 · 게시▾ · 설정▾ · 선택 해제") | https://mobbin.com/screens/014df5a4-af5e-440b-bb41-a94631cc799d |
| HubSpot | 뷰 탭(전체/초안/게시/보관) + 필터 드롭다운 행 + 상태 점 배지 | https://mobbin.com/screens/db47256c-178c-4342-b3d1-2a76546f6647 |
| Amplitude | 우측 필터 패널 고정 + "필터 모두 해제" | https://mobbin.com/screens/7a8e520a-0140-4924-8a52-813916f4465c |
| Semrush | 체크박스 멀티 필터 드롭다운(전체 선택) | https://mobbin.com/screens/2d915f17-eaef-4364-9dab-cab87f8b013b |
| Xero | 상태 탭에 건수(초안 1·발송 1·거절 0) + 필터 패널 날짜 피커 | https://mobbin.com/screens/1269d955-9ebd-41ca-aefa-8263328cb49d |

### 1-7. 상태 화면(빈·404·로딩/오류·권한 없음)
| app_name | 관찰한 구성 | mobbin_url |
|---|---|---|
| Shopify Inventory(빈) | 카드 안 돋보기 아이콘 → 제목 1줄 → 보조 1줄 → 검정 버튼 "검색·필터 해제" | https://mobbin.com/screens/d72b2baa-d912-49d2-9583-5c260fdadd56 |
| Pinterest(빈) | **적용된 필터를 하나씩 해제하는 칩 버튼들** + 전체 해제 → 단지 검색 0건 화면에 이식 | https://mobbin.com/screens/45560b08-b73e-4f7e-8a82-878c035ddd68 |
| OpenSea(빈) | 상단 적용 필터 칩 유지 + 아이콘 타일 + "필터 해제" | https://mobbin.com/screens/45a834a8-d95b-43fe-8420-7f0660bb528b |
| Fey(빈) | 키보드 안내(delete = 마지막 필터 해제) + 전체 해제 | https://mobbin.com/screens/7ff1da87-ed3c-4b42-b83d-1d0889946ef3 |
| Coinbase(404) | **앱 프레임(사이드바)을 유지한 채** 본문만 404. 일러스트+제목+1줄+회색 버튼 | https://mobbin.com/screens/a7b3ff5b-38e8-4d00-8b50-0900ee10f423 |
| Instagram(404) | 텍스트 2줄 + 인라인 링크만 | https://mobbin.com/screens/5294ba10-11ee-43dd-892c-840e0fbfdab6 |
| Headspace(404) | 일러스트+친근한 카피+"뒤로 가기" | https://mobbin.com/screens/f8e16f35-df5d-4f58-bdd2-cb93ce432ada |
| Care.com(오류) | 필터 패널은 유지, 결과 영역만 "문제가 생겼어요"+재시도 | https://mobbin.com/screens/859e00b8-b2c4-47cb-bc19-61bf0c536c91 |
| Mixpanel(권한) | "권한이 필요합니다" + **현재 로그인 계정 표시 박스** + 접근 요청 버튼 + 다른 계정 로그인 | https://mobbin.com/screens/8bc4ab67-6d62-4d1e-944c-05bc5bff956b |
| Asana(권한) | 승인자에게 보낼 메시지 textarea + 접근 요청 + 로그인 계정 표시 | https://mobbin.com/screens/92f8660a-4efb-48aa-a61f-35d3d45e3997 |
| Todoist(권한) | 좌 텍스트·우 일러스트 2분할, "관리자 권한이 필요할 수 있음" + 다른 계정 로그인 링크 | https://mobbin.com/screens/f4cf854e-0fce-4633-82c1-6169deadeb98 |

### 1-8. 가입·로그인 흐름 (search_flows)
| app_name | 관찰한 구성 | mobbin_url |
|---|---|---|
| Depop (12화면) | 이메일 매직링크 → "메일함 확인"(이메일 굵게 + 재발송) → 좌 사진 50% / 우 폼(이름·아이디·생년월일 3칸·지역) + 마케팅 수신 별도 체크 | https://mobbin.com/flows/ed44954a-6241-4f52-ac12-7ea467307e9f |
| Flodesk (9화면) | 소셜(Google) 우선 → or → 이메일/비밀번호(보기 토글) → "카드 등록 불필요" → 목표 선택 온보딩 | https://mobbin.com/flows/1a8396cd-a40b-471a-bb10-112d6ec67e70 |
| PlayAI (10화면) | 모달 가입(배경 블러) + **버튼 안 스피너 로딩 상태** | https://mobbin.com/flows/2dc9aee7-89c6-4ba9-88a5-26fc47035262 |

### 1-9. 메인 홈 히어로 (search_sections)
| site_name | 관찰한 구성 | mobbin_url |
|---|---|---|
| Klarna | 중앙 2줄 헤드라인 + 대형 검색 입력 + 주변 상품 이미지 플로팅(블러 깊이) | https://mobbin.com/sites/sections/81368750-7daf-4615-8a68-2006b9361221 |
| Campsite | 헤드라인 + 커맨드 팔레트형 검색(유형별 제안 3줄) | https://mobbin.com/sites/sections/e4547810-67d9-46bc-b103-77bb719fe9a6 |
| Mural | 컬러 밴드 히어로 + 검색바+카테고리 셀렉트 한 줄 | https://mobbin.com/sites/sections/2a59a928-8062-4213-80bb-941b0e24d089 |

**Mobbin에서 가져가는 패턴 요약(UI/UX 축)**: ① 지도 이동 = 필터(Navan·KAYAK) ② 핀 클릭 = 미니 카드 팝오버(Kiwi) ③ 상세는 목록 위 모달/시트로 맥락 유지(Zillow·Care.com) ④ 도면 뷰어 = 상단 세그먼트 + 우측 층/타입 레일 + 하단 플로팅 줌 툴바(Zillow+Jira) ⑤ 결제 = 좌 수단 라디오 카드 + 우 sticky 요약 + 동의 체크 분리(GetYourGuide·Turo) ⑥ 구매내역 = 상태 배지 표 + 행별 다운로드 + 상세 드로어(Wix·Upwork) ⑦ 관리자 = 상태 탭 건수 + 하단 고정 일괄 바(Xero·Zendesk) ⑧ 빈 결과 = 필터 하나씩 해제 칩(Pinterest) ⑨ 권한 없음 = 로그인 계정 표시 + 접근 요청(Mixpanel·Asana) ⑩ 404는 앱 프레임 유지(Coinbase).

---

## 2. 표 ① 도메인 레퍼런스 3곳 (국내 1 + 해외 2) — 라이브 실측

### 2-A. 호갱노노 (국내) — https://hogangnono.com/ · 단지 상세 https://hogangnono.com/apt/1Q7e2/0/4

| 축 | 실측값 |
|---|---|
| 스택 | Tailwind(CSS 변수 `--radius: .5rem`) + Emotion(css-xxxx) 혼용, 드로어 = vaul(`[data-vaul-drawer]`) |
| 폰트 | **Pretendard** (body 16px, `#111827`) |
| 색 — 액센트 | 브랜드 보라 **#584de4** (헤더 바·활성 탭 글자·카테고리 버튼 글자·1개월 평균 라벨) · 진한 변형 **#4337de** (상세 대표 가격·하단 CTA 글자·차트 탭) · 상세 세그먼트 활성 **#5963d9** |
| 색 — 잉크/보조 | 본문 #111827 · 표/섹션 #333333 · 메타 #555555 · 비활성 탭 #6b7280 · 더보기 #6e6e6e · 지도 컨트롤 글자 #4f4f4f |
| 색 — 면/경계 | 페이지 #ffffff · 검색칸 #f1f1f2 · 카테고리 버튼 #f3f4fc · 칩 활성 바탕 #f0f0f0 · 칩 경계 inset 1px **#eceef2** · 활성 칩 경계 inset 1px #1f2937 · 패널 하단 회색 #eaebed |
| 색 — 상태 | 실시간 배지 1px solid **#dc2626** + 글자 #dc2626 · 대출계산기 대출금 **#16a34a** · 지도 "N명 보는중" 배지 #41404a/#4f4e5a |
| 레이아웃 | **좌측 패널 375px 고정 + 지도 나머지 전폭**(2280 기준 16.4%, 1440 기준 26%). 우측 지도 컨트롤 레일 38×38 버튼 세로 스택 |
| 패널 헤더 | 보라 #584de4 바 61px, 좌우 패딩 20px. 상세 헤더 = ← 단지명(H1 16px/400 흰색) 공유·알림·닫기 |
| 검색 | 컨테이너 패딩 16/16/8 · 박스 322×44, bg #f1f1f2, radius 8, 패딩 10/16 · 입력 16px/24px |
| 필터 칩(매매·유형·평형·가격) | 68×32, radius 8, 패딩 6/12, 14px/600, 활성 bg #f0f0f0 + inset 1px #1f2937, 비활성 흰 바탕 + inset 1px #eceef2, `transition: color/background-color .15s cubic-bezier(.4,0,.2,1)` |
| 카테고리 버튼(학원가·가격변동…) | 높이 38, radius 6, 패딩 10/16, 15px/400, bg #f3f4fc, 글자 #584de4, 4열 그리드 |
| 실시간 배지 | 높이 26, radius 6, 패딩 0/8, 13px/600 |
| 지도 컨트롤 | 38×38, radius 4, 흰 바탕, `box-shadow: 0 4px 8px rgba(0,0,0,.15)`, 14px/600 |
| 지도 핀 | 52×58 집 모양 스프라이트(배경 이미지라 핀 색 hex는 추출 불가 — 클래스 `pin`/`officetel`/`selected`/`has-visitor`로 분기). 핀 안 2단: 평형 10px + 가격 **13px/600 흰색**("27.3억"). 선택 핀 + "N명 보는중" 배지(높이 23, radius 4) |
| 상세 정보 위계(위→아래 순서, 실측 y) | ① 단지명 헤더 → ② 주소 14px · 세대수/준공(15px #555) · 용적률/건폐율 → ③ 3D 단지투어 버튼 → ④ 주간 방문자 순위 → ⑤ (광고) → ⑥ **매매/전월세 세그먼트 + 평형 셀렉트** → ⑦ "최근 실거래 기준 1개월 평균"(15px #584de4) + **대표가 22px/700 #4337de** → ⑧ 차트 탭(최근 3년/전체 기간/매매·전세/비교, 16px, 높이 45) + 라인 차트 → ⑨ 실거래 표(머리 12px #333 · 행 13px · 가격 14px/700 · 행 높이 55 · 계약일/면적/가격(층)) → ⑩ 지역 평당가 비교 → ⑪ 거래세 → ⑫ 보유세(값 20px/700) → ⑬ **타입/동 정보**(값 22px/700) → ⑭ 아파트 자산 관리 → ⑮ 대출계산기(값 20px/600 #584de4·#16a34a) → ⑯ 관리비(값 19px/500) → ⑰ 일조량 → ⑱ 배송 생활권 → ⑲ 상권 → ⑳ 3개월 내 전세 예측 → ㉑ **주변 대중교통**(주요 업무지구별 출퇴근 분, 역 거리 "588m/도보 9분", 버스 노선) → ㉒ **학교**(초·중·고 탭, 통학구역, 도보 5/10/20분 반경, 어린이집·유치원 반경 1km) → ㉓ 개발호재 → ㉔ 입주 예정 → ㉕ 살아본 이야기. 섹션 제목은 전부 16px/700 #333 |
| 스크롤 고정 | 패널 헤더(보라 61px) 고정 · **하단 CTA "새로운 실거래가 알림받기" 48px 고정**(y 1251/1350) · 지도 컨트롤 레일 고정. 패널 본문만 독립 스크롤(패널 콘텐츠 높이 8,863px) |
| 빈 값 처리 | 숨기지 않고 값 자리에 **"없음"(19px/600 #4337de)** 또는 **"-"(16px/700)** 표기 |
| 모션 | 버튼 `.15s cubic-bezier(.4,0,.2,1)` · 드로어 `transform .5s cubic-bezier(.32,.72,0,1)` · 드로어 오버레이 `opacity .5s` 동일 이징 · 아코디언 `.2s ease-out` · 스켈레톤 `pulse 2s cubic-bezier(.4,0,.6,1) infinite` · `scale-in-bounce .3s ease-out` · 티커 `20s linear` · 패딩 전환 `.4s ease-in-out` |
| 아이콘 | 라인 아이콘 24px·16px, **stroke 1.5**, round cap/join, 색 #111827/#1f2937, 채움 없음 |
| 브레이크포인트 | Tailwind 기본 640/768/1024/1280/1536 + max 820/440/378. `(hover:hover) and (pointer:fine)` 가드 3건, reduced-motion 1건 |
| ⚠ 결함 | `<meta viewport … maximum-scale=1.0, minimum-scale=1.0>` = **모바일 확대 차단**(WCAG 1.4.4 위반 소지). 아파트고는 이 설정 금지 |

### 2-B. Zillow (해외) — 목록 https://www.zillow.com/seattle-wa/ · 상세 https://www.zillow.com/homedetails/5770-Ashworth-Ave-N-Seattle-WA-98103/79977067_zpid/

| 축 | 실측값 |
|---|---|
| 폰트 | UI **Inter** · 목록 H1/가격 **Object Sans** · 상세 **Open Sans** (전부 라이선스/커스텀 → 메트릭만 이식) |
| 색 — 액션 | **#0041d9** (Sign in·Save search 바탕, 정렬 링크, 활성 필터 inset 2px) · 상세 CTA·뷰어 활성 **#006aff** · 활성 필터 바탕 **#e2f0ff** |
| 색 — 잉크/보조 | 목록 잉크 #111116 · 주소 #535364 · 상세 잉크 #2a2a33 · 비활성 필터 경계 inset 1px #7e7f8e · 이미지 플레이스홀더 #dddde1 |
| 색 — 면 | 사실 타일 #f9f9fb · 특징 칩 #f1f1f4 · 뷰어 상단 nav #2a2a33 · 뷰어 레일 #343440 · 세그먼트 #54545a |
| 레이아웃(목록) | **지도 0~1530px(67.1%) + 목록 750px(32.9%) 고정**, 목록에 `box-shadow: -2px 2px 5px rgba(0,0,0,.4)`. CSS 변수 `--search-page-frame-nav-height: 61px`, `--search-action-bar-height: 55px`. 헤더 nav 항목 line-height 80px(15px) |
| 검색·필터바 | 검색 박스 792×40, radius 12 · 필터 버튼 높이 40, radius 12, 패딩 8/10, 라벨 14px/700 · 활성 = bg #e2f0ff + `inset 0 0 0 2px #0041d9` · 비활성 = 흰 바탕 + `inset 0 0 0 1px #7e7f8e` · `transition: box-shadow/background-color .2s cubic-bezier(.25,.1,.25,1)` · Save search 116×40 #0041d9 · Sign in 80×36 radius 12 |
| 카드 | **344×304, 2열, 가로·세로 간격 8px** · radius 12 · `box-shadow: 0 8px 20px rgba(0,0,0,.15)` · `transition: box-shadow .2s cubic-bezier(.42,0,1,1)` · 사진 344×186(원본 596×446 = 4:3을 1.85:1로 크롭), 상단 radius 12 12 0 0 · 사진 위 배지 = 흰 알약 높이 20, radius 999, 12px/700, 패딩 2/8 |
| 카드 타이포 | 가격 **20px/700/24px** · 방/욕실/면적: 숫자 14px/600 + 단위 14px/400 · 주소 14px #535364 · 출처 10px · H1 20px/900 · 결과 수 14px/700 |
| 상세(모달) | 모달 폭 1248, 본문 열 796 + 우측 CTA 열 277 · 가격 **36px/900/40px** · 핵심 수치(침실·욕실·면적) **36px/700** 숫자 + 18px/400 라벨 · 주소 18px/400 · 사실 타일 260×48, bg #f9f9fb, radius 4, 패딩 12, 16px · 특징 칩 bg #f1f1f4, radius 4, 패딩 2/8, 14px/700 대문자 · 섹션 H2 24px/700/40px · CTA "Request a tour" 277×64 #006aff radius 4 · 보조 CTA 277×48 흰 바탕 radius 4 |
| 정보 위계(상세) | 사진 히어로(+ 하단 썸네일 스트립: 전체·**평면도**·가상 스테이징·방별·지도) → 상태 점 → **가격 → 주소 → 우측 핵심 수치 3개** → 월 추정액 칩 → 사실 타일 6개 → 특징 칩 → 설명 → (우측) 오픈하우스·중개인·투어 CTA |
| 도면 뷰어 | 상단 nav #2a2a33 56px · **세그먼트 306×30, bg #54545a, radius 24, border 3px**, 활성 글자 #006aff 14px/700 · **우측 레일 216px #343440** · **층 썸네일 178×114, radius 6, border 3px (선택 #006aff / 비선택 #4c4c4c), 간격 16px(224→354−114)** · **줌 버튼 40×40 원형 흰 바탕, `box-shadow: 0 2px 4px rgba(0,0,0,.3)`, `transition: border/transform .1s ease-in-out`, 세로 피치 52px(간격 12px)** · 실별 이름+치수 라벨 · 하단 토글(사진·3D) · 레일 하단 면책 문구 |
| 모션 | 텍스트 색 `.2s cubic-bezier(.25,.1,.25,1)` · 버튼 bg/border/color `.2s` · 카드 섀도 `.2s cubic-bezier(.42,0,1,1)` |
| 빈 값 | 사진 미로드 카드 슬롯에 "Loading…" 스피너 문구 표시 |

### 2-C. Rightmove (해외) — 목록 https://www.rightmove.co.uk/property-for-sale/London.html · 상세 https://www.rightmove.co.uk/properties/93652893

| 축 | 실측값 |
|---|---|
| 폰트 | **Effra**(유료) — 본문 letter-spacing **+0.1px** 고정 |
| 색 | 잉크 **#000433**(네이비 블랙) · 본문 #4f5064 · 보조 #6c6d7f · 링크 틸 #11828d/#107a84 · "구매 가능 금액" 링크 #157968 · **CTA #00deb6**(글자 #000433) · 카드 경계 1px **#c3c4c9** |
| 레이아웃 | 목록 컨테이너 **max-width 1400px** · 목록 열 1040(카드 1008) + 우측 레일 · 헤더 50px 흰색 · **필터바 #000433 50px**(셀렉트 128×40 radius 8 네이비, 검색 314×40 radius 8 0 0 8) · 카드 간격 **32px** · 기본은 목록형, "Map view"는 별도 토글 |
| 목록 카드 | 1008 폭, radius 8, 이미지 395×312 2장 나란히 · 이미지 위 가격 **24px/500/32px** 흰색 · 주소 16px/500/24px · 유형/침실 16px · 설명 15px · "Added on" 14px/500 |
| 상세 | 컨테이너 1200 · 메인 이미지 776×435 + 우측 384×213 2장 · 주소 16px/500 · 가격 **24px/500/32px** · **팩트 행: 라벨 12px/400/16px 대문자 letter-spacing 1px(=0.083em) #6c6d7f / 값 16px/400/24px** (유형·침실·욕실·면적·소유형태) · 평면도 썸네일 + 사진 썸네일 그리드 · 섹션 H2 20px/500/28px · 핵심 특징 2열 불릿 16px/24px, 행 피치 32 · 설명 "전체 보기" 접힘 |
| 스크롤 고정 | **우측 aside 383px `position: sticky; top: 0`** · 중개인 카드 radius 8, `box-shadow: 0 2px 16px rgba(0,0,0,.2)`, 내부 #000433 블록 radius 4 · CTA 303×48 radius 8, `transition: .24s` |
| 빈 값 | 면적 미기재 시 숨기지 않고 **"Ask agent"**(16px)로 명시 |

### 2-D. 업계 공통 문법 (3곳 + Mobbin 교차 관찰)
1. **가격이 언제나 1순위 타이포**: 호갱노노 22px/700(평균가) · Zillow 36px/900 · Rightmove 24px/500. 카드에서도 가격 20~24px > 나머지 14~16px.
2. **핵심 수치는 "큰 숫자 + 작은 라벨" 묶음**(Zillow 36px+18px, Rightmove 라벨 12px 대문자+값 16px).
3. **결측값을 숨기지 않고 명시**("없음"·"-"·"Ask agent"·"Loading…").
4. **상세 우측 또는 하단에 행동 CTA 고정**(호갱노노 하단 알림받기 48px, Rightmove sticky aside, Zillow 우측 CTA 열).
5. **국내 표기**: 억 단위 가격("28억 5,000"), 평형("43평") 우선 + 전용㎡ 보조, 실거래 표 = 계약일·면적·가격(층), 지도 핀 = 평형+가격 2단, 교통·학군은 "거리 m / 도보 N분".
6. **국내 금융·시세 색 관행**: 상승 빨강·하락 파랑(RISE ETF 실측 #ff3c3c / #3e8bff, 3장). 해외(Zillow·Rightmove)는 이 관행이 없으므로 국내향 아파트고는 국내 관행을 따른다.
7. **국내 분양 사이트 평면도 = 통 이미지**: GDWEB 2026.10.13 선정작 「옥정중앙역 디에트르 Ⅱ」(https://detre-ojop.co.kr/unit/cont01.html) 평면안내는 타입 배지·세대수·전용/공급/계약 면적·동호 배치도·치수선이 **전부 이미지 한 장(unit/119oa.jpg 1584×1933)** → 확대·검색·스크린리더 불가. 타입 탭은 하단 밑줄식(19.38px #777). 아파트고 도면 뷰어는 **면적 표를 텍스트로 분리 + 확대/이동 + 타입 레일**로 차별화할 근거.

---

## 3. 표 ② 디자인 레퍼런스 3곳 (어워드 2 + 국내 어워드 1)

| # | 사이트 | 출처 종류 · 수상 내역(확인 방법) | 성격 | 가져온 것 (실측 요약) |
|---|---|---|---|---|
| D1 | **Realevate** https://realevate.agency/ | **어워드 — Awwwards SOTD, Site of the Day Sep 27, 2026, 7.22/10** (https://www.awwwards.com/sites/realevate 상세 페이지 텍스트 "SOTD 7.22 /10 Site of the Day - Sep 27, 2026" 직접 확인 · Real Estate 카테고리 목록 배지 "SOTD") · by Or Halevi / MAKETHECUT® | 부동산 투자 브랜드 사이트(공개 홈 톤 기준선) | Awwwards SOTD 2026.09.27 — 디스플레이 16vw(1440 기준 230px)/500 · ls **−0.02em** · 본문 −0.01em · 브랜드 네이비 **#1f2b5e** · 이징 **cubic-bezier(.7,.6,0,1)** 650~800ms · 카테고리 카드 4색 |
| D2 | **Cerebrium** https://cerebrium.ai/ | **어워드 — Awwwards SOTD, Site of the Day Sep 10, 2026, 7.39/10** (https://www.awwwards.com/sites/cerebrium 상세 "SOTD 7.39 /10 Site of the Day - Sep 10, 2026" 직접 확인 · Data Visualization 카테고리 목록 배지 "DEV SOTD") · by Louis Paquet / KOKI-KIKO | 데이터·인프라 SaaS(데이터 시각화·비교 UI 기준선) | Awwwards SOTD 2026.09.10 — h1 108px/300 · lh **1.0** · ls **−0.025em** · sticky 인덱스 top 98px · 값 비례 막대 성장(width 0.25~4s, cubic-bezier(0,0,.2,1)) · 세그먼트 슬라이딩 인디케이터 .2s · 토큰 이징 4종 |
| D3 | **RISE ETF (KB자산운용)** https://kbam.co.kr/ · 목록 https://kbam.co.kr/find | **어워드(국내) — GDWEB WEB 부문 선정작, 2026.09.29** (https://www.gdweb.co.kr/sub/list.asp, 페이지 제목 「GDWEB:WEB 부문 선정작」 목록에서 "RISE ETF · 26.09.29" 확인 → 카드 클릭 시 kbam.co.kr 이동 확인) | 국내 금융 데이터 서비스(목록·필터·순위·수치 색 관행) | GDWEB 2026.09.29 — Pretendard 본문 · 섹션 제목 32px/500/1.3 · 그레이스케일 9단 · **상승 #ff3c3c / 하락 #3e8bff** · 행 카드 120px·간격 8·radius 20 · 리빌 .65s cubic-bezier(.22,1,.36,1)+stagger 150ms |

> 참고(채택 안 함): GDWEB 2026.10.13 선정작 「옥정중앙역 디에트르 Ⅱ」는 실측했으나 인트로 영상 + 팝업 3중 레이어의 분양 마이크로사이트라 "트렌디하고 깔끔한" 기준선에 맞지 않아 디자인 레퍼런스에서 제외. 대신 **도메인 관행(평면도 통 이미지·타입 탭)** 근거로 2-D-7에 기록. Pretendard ls **−0.03em**(22.8px에 −0.684px) 실측은 토큰 근거로 사용.

### 3-1. D1 Realevate 실측 상세 (뷰포트 2280, vw 값은 1440 환산 병기)
- 스택: GSAP + ScrollTrigger 전역 확인, SPA 페이지 전환, 커스텀 커서.
- 루트 변수(원문): `--brand-navy:#1F2B5E` · `--muted:#626C95` · `--white:#FFFFFF` · 카테고리 `--category-by-the-sea-color:#222A4C` / `evergreen:#36614D` / `urban-living:#2D1C2D` / `rare-gems:#1C181D` (각 muted 짝 #5D668D·#80988E·#6B5A6B·#5C585D) · `--standard-easing: cubic-bezier(.7,.6,0,1)` · `--cta-motion-easing` 동일 · `--overlay-duration: .8s` · `--body-leading: 1.35` · `--grid-columns: 12` · 폰트 `--sans-font: "Google Sans"`, `--display-font: "Roslindale Display"`.
- 타입 스케일(vw 정의): h1 16vw(=1440에서 230.4px) · h2 5.2vw(74.9px) · h3 3.646vw(52.5px) · h4 1.5vw(21.6px) · h5 1.736vw(25px) · h6 1.447vw(20.8px) · 본문 1.2vw(17.3px). html font-size 27.36px@2280(=1.2vw).
- 히어로 실측: 마퀴 "Elevating Life" **364.8px/500/lh 1.0, ls −7.296px = −0.02em**, #1f2b5e, 5개 복제 무한 가로 흐름 · 중앙 이미지 20vw×20vw(1440에서 288px 정사각) · 리드 39.58px/500/lh 1.3, ls −0.01em · 가격 라벨 "STARTING FROM" Monument Extended 21.77px, ls **+0.08em**, 위아래 1px 라인 · nav 28.5px@2280(=1.25vw, 1440에서 18px)/500, ls −0.0096em.
- 스크롤 연출(관찰): 휠 5틱에 **홈 전체가 카드 크기로 축소되며 아래로 빠지고**, 회색 바탕 **#e3e5eb** 위에 카테고리 카드 4장 등장. 카드 474×910@2280(=20.8vw, 1440에서 약 300px) · 좌우 여백 103px(=4.5vw, 1440에서 65px) · 상단 색 패널 640px + 하단 사진 · **세로 제목 73.87px(=3.24vw, 1440에서 46.7px)/500, ls −0.02em, 180° 회전** · 설명 2줄 흰색.
- 호버: 카드 `filter: brightness(1.08)` + 커버 `::after` opacity 0→1, `transition: filter .8s cubic-bezier(.18,.13,0,.99)`.
- 그 외 전환: 링크 밑줄 `transform .65s var(--standard-easing)` · CTA 배경 `background-position .75s` · 사이드 오버레이 `clip-path .8s` · 폼 탭 `.25s`/밑줄 `.5s` · 메뉴 아이콘 `.68s cubic-bezier(.16,1,.3,1)` · 커서 `cubic-bezier(.15,.32,.2,.99) .5s`.
- 로더: 네이비 바탕 + 이미지 스택 + 카운터(`site-preloader-counter-init`).
- **가져올 것**: 공개 홈의 대형 디스플레이 타이포 비율(−0.02em), 네이비 1색 절제, 에디토리얼 이징(.7,.6,0,1), 카드 호버 밝기 1.08. **버릴 것**: 스크롤 하이재킹형 페이지 축소 전환(데이터 서비스에 부적합), body `overflow:hidden` SPA 구조.

### 3-2. D2 Cerebrium 실측 상세 (Astro v6.1.0, Tailwind v4 토큰)
- 폰트: 본문 Suisse Int'l · 라벨 Suisse Int'l Mono · 디스플레이 ABC Favorit(전부 유료 → 메트릭만).
- 루트 토큰(computed): `--ease: cubic-bezier(.645,.045,.355,1)` · `--ease-in-out: cubic-bezier(.4,0,.2,1)` · `--ease-out: cubic-bezier(0,0,.2,1)` · `--ease-bounce: cubic-bezier(.175,.885,.32,1.275)` · `--transition-duration-fast:.2s` / `--transition-duration:.3s` / `-slow:.6s` / `-slower:.8s` / `-slowest:1s` / `--default-transition-duration:.15s` · `--radius-sm:7px` / `md:10px` / `lg:15px` / `xl:30px` / `4xl:2rem` · `--spacing:.25rem` · `--grid-columns:12` · `--grid-margin: 2.5rem` · `--spacing-gutter: 1.25rem`.
- 색: 네이비 잉크 **#172b76** · 네이비-500 #586490 · 비활성 인덱스 **#c6cee0**(slate-300) · slate-50 #eef2f5 / 100 #dbe5ed / 200 #cfd7e7 / 400 #b3c0d4 · 포인트 핑크 #ff488b / #f6186a · 버튼 글자 #101421.
- 타입: h1 **108px/300/108px, ls −2.7px = −0.025em** · 섹션 디스플레이 "Built for teams" 90px/300/94.5px(lh 1.05), −0.025em · **sticky 인덱스 54px/300/62.1px(lh 1.15), ls −2.7px = −0.05em** · 기능 카드 h3 30px/400/40.5px(lh 1.35), −0.025em · 본문 20px/400/30px(lh 1.5), **+0.01em** · 리드 18px/400/24.3px(lh 1.35), +0.01em · 모노 라벨 13px/400, −0.025em, 대문자.
- 컴포넌트: 버튼 높이 54, radius 7, 패딩 0/20, 16px/500 · 로그인 #cfd7e7/#172b76 · 가입 #ff488b · nav 알약 464×54 radius 7 · 검색류 42px, radius 6.4, 13px 모노.
- **스크롤 연출(관찰)**: "WHY CEREBRIUM" 섹션 = 좌측 **sticky 인덱스(`position:sticky; top:98px`)** 4항목, 현재 항목 #172b76 · 나머지 #c6cee0, `transition: color .2s cubic-bezier(.4,0,.2,1)` · 우측 기능 카드가 약 934~966px 간격(2280 기준)으로 스크롤되며 인덱스 활성 전환(스크롤스파이).
- **데이터 비교 위젯**: 세그먼트 토글(활성 141×44 bg #586490 radius 7, 인디케이터 `left/width/top/height .2s cubic-bezier(0,0,.2,1)`로 슬라이딩) · 비교 막대 높이 5px, radius 10, 값 3.8s/42s/71s/156s → **막대 width 전환 시간이 값에 비례(.25s · 1.66s · 2.90s · 4s, cubic-bezier(0,0,.2,1))** · 수치 30px/400.
- 키프레임: `fade-slide-in`, `overlay-anim-in/out`, `initial-loader-logo-bar` · 페이지 전환 `.transition-fade opacity .3s` · 블러 전환 `filter .6s`.
- **가져올 것**: 디스플레이 lh 1.0~1.15 + ls −0.025~−0.05em 메트릭, sticky 인덱스 스크롤스파이(단지 상세 섹션 내비), 값 비례 막대 성장(평당가·관리비 비교), 세그먼트 슬라이딩 인디케이터(매매/전월세), 이징 4종. **버릴 것**: 다크 배경·핑크 포인트(국내 아파트 데이터 서비스 톤과 무관), 4s 막대(상한 1.2s로 축소).

### 3-3. D3 RISE ETF 실측 상세 (kbam.co.kr)
- 폰트: 본문 **Pretendard**, 제목·수치 KBFG Text(KB 전용 → 메트릭만). html font-size 10px(rem 10 기준).
- 토큰(computed): 그레이스케일 `--grayscale-gray100 #f5f5f5 · 200 #ededed · 300 #e5e5e5 · 400 #b4b4b4 · 500 #959595 · 600 #888 · 700 #383838 · 800 #2f2f2f · 900 #1e1e1e` · 포인트 `--primary-kb-yellow #ffd338`, `-ci #ffbc00`(+10/12/20% 알파 단계) · 자산군 칩 8색 `국내주식 #153b78 · 해외주식 #1572ff · 채권 #3db11d · 통화 #22ba91 · 원자재 #f46600 · 리츠 #f2b500 · 멀티 #7d6c59 · 기타 #888` · radius `.4rem(4) · .8rem(8) · 1rem(10) · 2rem(20) · 50%` · `--transition-color/bg/border: .2s cubic-bezier(.33,1,.68,1)`.
- 바탕 #111111(다크) · 카드 `rgba(59,59,59,.3)`(합성 ≈ #1e1e1e).
- **수치 색 관행: 상승 #ff3c3c · 하락 #3e8bff**(홈 순위 카드·목록 표 모두).
- 홈: 섹션 제목 2줄 **32px/500/41.6px(lh 1.3), ls −1.92px = −0.06em** · 기준일 14px #b4b4b4 · 기간 세그먼트 버튼 56×30 radius 8 패딩 4/10, 활성 흰 바탕+검정 글자, 비활성 #2f2f2f · 순위 카드 460×189, radius 20, 패딩 24, 배지 높이 22 radius 4 패딩 2/6 · 카드 제목 24px/500/30px, −0.06em · 라벨 14px #959595 · 값 17px/400/25px.
- 목록(/find, "ETF 찾기"): 상단 탭(추천/테마/자산) + 칩 필터 · 검색 276×22 입력 · 2단 표 머리(수익률 그룹), **정렬 활성 컬럼 #ffd338** 14px/500 · **행 = 카드형 120px, 간격 8px(피치 128), radius 20, 패딩 20** · 상품명 18px/500, −0.06em · 수치 20px/500/28px, −0.06em · 행 끝 비교 체크+관심 하트.
- **로딩 상태(관찰)**: 데이터 로드 전 필터 칩·탭은 먼저 렌더하고 본문 중앙에 브랜드 로고만 표시 → 로드 후 표로 교체.
- 리빌: `opacity .65s cubic-bezier(.5,1,.89,1)` + `transform .65s cubic-bezier(.22,1,.36,1)`, 지연 **.1s → .25s(150ms stagger)**.
- 아이콘: 24px stroke 1.5 · 20px stroke 1.25, round cap · 16px 채움형.
- 브레이크포인트: 주 분기 **max 1023px**(1,153 규칙) · 767/768 · 920 · 1279 · min 1560 · `(hover:hover)` 가드 73건 · `prefers-reduced-motion` 26건.
- **가져올 것**: 국내 시세 색 관행, 그레이스케일 9단 구조, 행 카드형 데이터 표(120px·8px·20 radius) + 정렬 컬럼 강조, 리빌 이징·stagger, hover 가드·reduced-motion 운용. **버릴 것**: 다크 테마 자체(아파트고는 라이트), KB 옐로 포인트.

---

## 4. 4축 출처 표 (디자인시스템 · UI/UX · 인터랙션 · 그래픽 소스)

| 축 | 항목 | 출처(실측) | 비고 |
|---|---|---|---|
| **디자인 시스템** | 색 — 브랜드 | Realevate `--brand-navy #1f2b5e` (D1) | 어워드 |
| | 색 — 액션 | Zillow #0041d9 / 활성 바탕 #e2f0ff (도메인) | 대비 7.6:1 (계산) |
| | 색 — 그레이스케일 | RISE gray100~900 9단 (D3) + 호갱노노 경계 #eceef2 · 잉크 #111827 | |
| | 색 — 시세 상승/하락 | RISE #ff3c3c / #3e8bff (D3, 다크 바탕 원값) | 라이트 대비 보정 필요(6장) |
| | 타이포 패밀리 | Pretendard — 호갱노노·RISE·디에트르 3곳 실측 | 무료 |
| | 타이포 메트릭 | Realevate −0.02em/lh 1.0 · Cerebrium −0.025~−0.05em/lh 1.0~1.15 · RISE −0.06em/lh 1.3 · 디에트르 Pretendard −0.03em | em 환산 |
| | radius·spacing | Zillow 4/12/999 · 호갱노노 6/8 · Rightmove 8 · RISE 20 · Cerebrium spacing .25rem | |
| | 관리자 토큰 | Shopify Admin(저장 라이브러리, Polaris) | 5장 |
| **UI/UX** | 검색(패널+지도) | 호갱노노 좌 375px 패널 · Zillow 지도 67%/목록 33% · Mobbin Navan(지도 이동=필터)·Kiwi(핀 팝오버) | |
| | 단지 상세 위계 | 호갱노노 25섹션 순서 · Zillow 가격→주소→핵심 수치 3개 · Rightmove 라벨/값 팩트 행 + sticky aside | |
| | 도면 뷰어 | Zillow 뷰어(세그먼트·우측 216 레일·층 썸네일·40px 줌) · Mobbin Jira(하단 줌 툴바) · 디에트르(국내 통 이미지 반례) | |
| | 결제·구매내역 | Mobbin GetYourGuide·Turo·Wix·Upwork | |
| | 관리자 | Shopify Admin(라이브러리) · Mobbin Zendesk·Xero·Stripe | |
| | 상태 화면 | Mobbin Pinterest(빈)·Coinbase(404)·Mixpanel/Asana(권한)·Care.com(오류) · RISE(로딩) · 호갱노노(결측 "없음/-") | |
| **인터랙션** | UI 피드백 | 호갱노노 .15s cubic-bezier(.4,0,.2,1) · Zillow .2s cubic-bezier(.25,.1,.25,1) · RISE .2s cubic-bezier(.33,1,.68,1) | |
| | 리빌·stagger | RISE .65s cubic-bezier(.22,1,.36,1) + 150ms (D3) | 어워드 |
| | 시트·드로어 | 호갱노노 vaul .5s cubic-bezier(.32,.72,0,1) | |
| | 에디토리얼(공개 홈) | Realevate cubic-bezier(.7,.6,0,1) .65~.8s · 카드 호버 brightness 1.08 .8s (D1) | 어워드 |
| | 데이터 모션 | Cerebrium 값 비례 막대·세그먼트 슬라이딩·sticky 스크롤스파이 (D2) | 어워드 |
| | 로딩 | 호갱노노 스켈레톤 pulse 2s cubic-bezier(.4,0,.6,1) · RISE 브랜드 로고 로더 · Mobbin PlayAI 버튼 내 스피너 | |
| | 뷰어 조작 | Zillow 줌 버튼 transform .1s ease-in-out | |
| **그래픽 소스** | 아이콘 | 호갱노노 24/16px **stroke 1.5 round cap/join** #111827 · RISE 24px 1.5 / 20px 1.25 round | 라인 아이콘 1종 |
| | 지도 핀 | 호갱노노 52×58 집 모양 + 평형/가격 2단 텍스트 + 보는중 배지 | 스프라이트(색 hex 비공개) |
| | 이미지 비율·처리 | Zillow 카드 1.85:1 크롭(원본 4:3), 상단만 radius 12 · Rightmove 2장 나란히 395×312 · Zillow 상세 1+4 모자이크 · Realevate 정사각 히어로 이미지 + 색 패널+사진 세로 카드 | |
| | 오버레이·배지 | Zillow 사진 위 흰 알약 배지(12px/700) · Rightmove 사진 위 흰 가격 24px · Realevate 카드 커버 ::after 그라디언트 호버 | |
| | 일러스트·패턴 | RISE 3D 오브젝트 테마 카드(계산기·로봇팔·장바구니) · Mobbin 404/권한 일러스트(Headspace·Todoist) | 아파트고는 생성 이미지로 대체 |
| | 도면 표현 | Zillow 평면도: 벽체 굵은 파랑 외곽 + 실명/치수 라벨 + 3D 파노라마 지점 점 (Mobbin·라이브 육안) | 색 수치 미추출 |

---

## 5. 저장 레퍼런스 `shopify-admin` → 관리자 표면(11본) 이식 수치

> 출처 문서: `레퍼런스/디자인시스템/shopify-admin.md` · `레이아웃/shopify-admin.md` · `인터렉션/shopify-admin.md` (2026-10-14 분석, Mobbin 캡처 + Polaris 공개 토큰 대조, **라이브 실측 아님 · 모션값 전부 미확인**). 재실측 없이 사용.

| 영역 | 값 |
|---|---|
| 프레임 | 상단 바 **56px #0b0b0b**(검색칸 높이 36 · 최대폭 640 · radius 10 · #262626) · 사이드바 **240px #ebebeb** · 페이지 바탕 #f1f1f1 · 본문 판 왼쪽 위만 radius 12 |
| 메뉴 | 항목 높이 28~32, 좌우 패딩 12 · 활성 = 흰 알약(#fafafa, radius 8) + 굵기 650 · 1단만 아이콘 16px, 2단은 들여쓰기 · 카운트 배지 우측 |
| 색 | 무채색 9단(#0b0b0b·#262626·#303030·#616161·#8a8a8a·#e3e3e3·#ebebeb·#f1f1f1·#ffffff) + **포커스/링크 #005bd3 1색** · 주 버튼 검정 #303030 · 보조 버튼 #e3e3e3 · 표 머리 #f7f7f7 · 행 구분 #ebebeb · 입력 테두리 #8a8a8a · 딤 rgba(0,0,0,.5) |
| 배지 6톤 | 중립 rgba(0,0,0,.06)/#616161 · 성공 #affebf/#014b40 · 주의 #ffeb78/#4f4700 · 경고 #ffd6a4/#5e4200 · 위험 #fed1d7/#8e0b21 · 정보 #e0f0ff/#00527c (높이 20, radius 8, 12px/550, 아이콘 없음) |
| 타이포 | 12/16 · 13/20 · 14/20(650 카드 제목) · 20/24(700 페이지 제목 단 하나) — Inter 450/550/650/700 → **Pretendard 400/500/600/700로 근사** |
| 치수 | 카드 radius 12, 패딩 16 · 버튼 높이 28 radius 8 · 입력 32 radius 8 · **표 행 40** · 모달 radius 16(머리 #f3f3f3) |
| 섀도(베벨) | 카드 `inset 0 -1px 0 0 rgb(0 0 0/.08), 0 1px 0 0 rgb(26 26 26/.07)` · 팝오버 `0 4px 6px -2px rgb(26 26 26/.2), 0 0 0 1px rgb(0 0 0/.08)` · 모달 `0 20px 20px -8px rgb(26 26 26/.28), 0 0 0 1px rgb(0 0 0/.08)` · 주 버튼 `inset 0 -1px 0 1px rgb(0 0 0/.8), inset 0 0 0 1px #303030, inset 0 .5px 0 1.5px rgb(255 255 255/.25)` |
| 화면 문법 | 페이지 머리 = [←] 아이콘 제목 20/700 … [보조][보조▾][■주] · 핵심 업무 목록(회원·콘텐츠)엔 **지표 띠**(세로선 분할 N칸 + 스파크라인), 보조 목록엔 생략 · 필터 알약 → 인라인 팝오버(딤 없음) · 등록 폼 = 좌 본문 카드 더미 + 우 메타 카드(약 58/27%) · **컨텍스트 저장 바**(폼 dirty 시 상단 바 검색 자리를 "저장되지 않은 변경 + 취소/저장"으로 교체) · 취소 행 취소선 |
| 이식 주의 | 관리자는 **별도 스코프**(`.admin-scope`)로 분리해 공개 사이트 디스플레이 타이포와 섞지 않는다. 모션 수치는 미확인이므로 6장 이징 세트를 사용. 포커스 색은 아파트고 액션 색과 통일 여부를 미팅에서 확정(아래 제안은 통일안) |

---

## 6. 제안 토큰 초안 — 아파트고 리뉴얼

> 원칙: 공개(고객) 표면 = 라이트·데이터 우선, 브랜드 1색 + 액션 1색 + 시세 2색. 관리자 = Shopify 스코프. 각 값 옆 괄호가 근거. "계산"은 실측 원값을 대비 기준에 맞춘 보정치이며 실측값이 아님을 명시한다.

### 6-1. 색
| 토큰 | 값 | 근거 |
|---|---|---|
| `--bg` | #ffffff | 호갱노노 body · Zillow |
| `--surface-1` | #f9f9fb | Zillow 사실 타일 |
| `--surface-2` | #f1f1f2 | 호갱노노 검색칸 (Zillow 칩 #f1f1f4) |
| `--surface-3` | #f5f5f5 | RISE gray100 |
| `--line` | #eceef2 | 호갱노노 칩 inset 1px |
| `--line-strong` | #c3c4c9 | Rightmove 카드 경계 |
| `--ink` | #111827 | 호갱노노 본문 |
| `--ink-2` | #535364 | Zillow 주소(보조) |
| `--ink-3` | #6b7280 | 호갱노노 비활성 탭 — 흰 바탕 대비 4.8:1(계산) |
| `--ink-4` (장식 전용) | #b4b4b4 | RISE gray400 — 본문 텍스트 금지(대비 미달) |
| `--brand` | #1f2b5e | Realevate brand-navy (D1) — 대비 13.4:1(계산) |
| `--action` | #0041d9 | Zillow 주 버튼·포커스 — 대비 7.6:1(계산) |
| `--action-tint` | #e2f0ff | Zillow 활성 필터 바탕 |
| `--up` (상승) | #d92d2d | **계산** — RISE #ff3c3c는 흰 바탕 대비 3.5:1로 미달 → 4.8:1로 명도 보정 |
| `--down` (하락) | #2563eb | **계산** — RISE #3e8bff는 흰 바탕 대비 3.3:1로 미달 → 5.2:1로 보정 |
| `--live` | #dc2626 | 호갱노노 실시간 배지 |
| `--positive` | #16a34a | 호갱노노 대출계산기 |
| 관리자 배지 6톤 | 5장 표 그대로 | Shopify Admin |
| 카테고리(유형) 칩 | RISE 자산군 8색 구조 차용 → 아파트/오피스텔/분양/재건축 등 4~6색만 | RISE (D3) |

### 6-2. 타이포 (Pretendard · 수치는 `font-variant-numeric: tabular-nums`)
| 토큰 | px / weight / line-height / letter-spacing | 근거 |
|---|---|---|
| `display-xl` (공개 홈 히어로) | 72 / 700 / 1.1 / −0.03em | Realevate h2 5.2vw = 74.9px@1440, −0.02em · Cerebrium lh 1.0~1.05 · 한글은 300 굵기가 약해 700 보정 · Pretendard −0.03em(디에트르 실측) |
| `display` (섹션 대제목) | 48 / 700 / 1.15 / −0.03em | Cerebrium sticky 인덱스 54px lh 1.15 · Realevate h3 52.5px@1440 |
| `h1` (페이지 제목) | 32 / 700 / 1.3 / −0.03em | RISE 섹션 제목 32px/1.3 |
| `h2` | 24 / 700 / 1.3 / −0.02em | RISE 카드 제목 24px/1.25 · Zillow H2 24px |
| `h3` | 20 / 700 / 1.4 / −0.02em | Rightmove 섹션 H2 20/28 |
| `num-hero` (상세 대표 시세) | 36 / 800 / 1.1 / −0.02em | Zillow 상세 가격 36/900/40 |
| `num-lg` | 22 / 700 / 1.0 | 호갱노노 1개월 평균 22/700/22 |
| `num-md` (카드 가격·표 수치) | 20 / 700 / 1.2 | Zillow 카드 20/700/24 · RISE 표 20/500/28 |
| `body-lg` | 18 / 400 / 1.5 / −0.01em | Cerebrium 리드 18px · Zillow 상세 18px |
| `body` | 16 / 400 / 1.5 / −0.01em | Zillow 16/24 · Realevate 본문 −0.01em |
| `body-sm` | 14 / 400 / 1.45 | RISE 라벨 14/20 · Zillow 카드 메타 14px |
| `caption` | 13 / 600 / 1.4 | 호갱노노 실시간 배지·핀 가격 13/600 · Shopify 13/20 |
| `micro` | 12 / 500 / 1.35 | Rightmove 팩트 라벨 12/16 · Shopify 12/16 (한글은 대문자·자간 확대 없음) |
| `pin-label` | 10 / 500 | 호갱노노 핀 평형 10px |

### 6-3. 간격 (4px 기반)
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64 · 96 · 128`
- 8 = 카드 간격(Zillow 8 · RISE 행 8) · 12 = 줌 버튼 간격(Zillow) · 16 = 패널 패딩(호갱노노 16)·Shopify 카드 패딩 · 20 = 호갱노노 패널 좌우·RISE 행 패딩 · 24 = RISE 카드 패딩 · 32 = Rightmove 카드 간격 · 64 = Realevate 좌우 여백 4.5vw(1440에서 65px) · 96~128 = 공개 홈 섹션 상하(CLAUDE.md B 기준 80~140, Cerebrium 기능 카드 간격 약 41vw는 과대라 축소).

### 6-4. radius
`xs 4`(Zillow 사실 타일·칩, 호갱노노 지도 버튼, RISE 배지) · `sm 6`(호갱노노 카테고리 버튼, Zillow 층 썸네일) · `md 8`(호갱노노 칩·검색, Rightmove 카드·CTA, Shopify 버튼·입력) · `lg 12`(Zillow 카드·필터·검색, Shopify 카드) · `xl 20`(RISE 카드·행 카드) · `pill 999`(Zillow 배지·세그먼트 24)

### 6-5. 그림자
| 토큰 | 값 | 근거 |
|---|---|---|
| `--sh-line` | `inset 0 0 0 1px var(--line)` | 호갱노노 칩 |
| `--sh-active` | `inset 0 0 0 2px var(--action)` | Zillow 활성 필터 |
| `--sh-float` (지도 컨트롤) | `0 4px 8px rgba(0,0,0,.15)` | 호갱노노 지도 버튼 |
| `--sh-card-hover` | `0 8px 20px rgba(0,0,0,.15)` | Zillow 카드 |
| `--sh-sticky` (aside·팝오버) | `0 2px 16px rgba(0,0,0,.2)` | Rightmove 중개인 카드 |
| `--sh-zoom` (뷰어 버튼) | `0 2px 4px rgba(0,0,0,.3)` | Zillow 줌 버튼 |
| 관리자 | Shopify 베벨 4종(5장) | Shopify Admin |

### 6-6. 이징·지속시간 세트
| 토큰 | 값 | 근거 | 쓰는 곳 |
|---|---|---|---|
| `--ease-ui` | cubic-bezier(.4,0,.2,1) · 150ms | 호갱노노 버튼 · Cerebrium `--ease-in-out`/기본 .15s | 버튼·칩 색/바탕 |
| `--ease-std` | cubic-bezier(.25,.1,.25,1) · 200ms | Zillow 필터·텍스트 | 필터 활성 섀도·포커스 |
| `--ease-out-quart` | cubic-bezier(.33,1,.68,1) · 200ms | RISE 색 전환 | 탭·세그먼트 글자 |
| `--ease-reveal` | transform cubic-bezier(.22,1,.36,1) 650ms + opacity cubic-bezier(.5,1,.89,1) 650ms · **stagger 150ms** | RISE (D3) | 스크롤 리빌(공개 홈·목록 진입) |
| `--ease-sheet` | cubic-bezier(.32,.72,0,1) · 500ms | 호갱노노 vaul 드로어 | 모바일 바텀시트·상세 시트·필터 시트 |
| `--ease-editorial` | cubic-bezier(.7,.6,0,1) · 650~800ms | Realevate (D1) | 공개 홈 링크 밑줄·오버레이 전용 |
| `--ease-media-hover` | cubic-bezier(.18,.13,0,.99) · 800ms, brightness 1.08 | Realevate 카드 (D1) | 공개 홈 이미지 카드 호버 |
| `--ease-data` | cubic-bezier(0,0,.2,1) · **값 비례 250~1200ms** | Cerebrium 막대(원값 .25~4s → 상한 1.2s 축소) (D2) | 평당가·관리비·비교 막대 성장 |
| `--ease-segment` | cubic-bezier(0,0,.2,1) · 200ms (left/width) | Cerebrium 세그먼트 인디케이터 (D2) | 매매/전월세·기간 토글 |
| `--press` | transform · 100ms ease-in-out | Zillow 줌 버튼 | 뷰어 버튼·아이콘 버튼 프레스 |
| `--skeleton` | pulse 2s cubic-bezier(.4,0,.6,1) infinite | 호갱노노 `.skeleton` | 로딩 상태 |
| `--accordion` | 200ms ease-out | 호갱노노 | 상세 섹션 접기 |
- 모두 `@media (prefers-reduced-motion: reduce)`에서 리빌·막대·에디토리얼 제거, 색 전환만 유지(RISE 26건 운용). 호버 효과는 `@media (hover:hover)`로 가드(RISE 73건 · 호갱노노 `(hover:hover) and (pointer:fine)`).

### 6-7. 레이아웃·브레이크포인트
| 항목 | 값 | 근거 |
|---|---|---|
| 브레이크포인트 | 375(모바일 기준) · 640 · 768 · **1024(패널+지도 2분할 시작)** · 1280 · 1536 | 호갱노노 Tailwind 640/768/1024/1280/1536 · RISE 주 분기 1023 |
| 공개 컨테이너 | 1200 (넓은 목록 1400) | Rightmove 상세 1200 / 목록 max-width 1400 |
| 헤더 높이 | 64 (모바일 56) | 호갱노노 61 · Zillow nav 변수 61 · Rightmove 50 · Shopify 56 사이 |
| 검색 패널 | 데스크톱 좌 375~400px 고정 + 지도 나머지 | 호갱노노 375 (국내 관행) · Zillow는 반대로 목록 750 고정 |
| 상세 2열 | 본문 1fr + aside 360~384 `sticky top:(헤더+24)` | Rightmove aside 383 sticky · Zillow CTA 열 277 |
| 도면 뷰어 | 상단 세그먼트(평면/3D/사진) · 우측 타입·층 레일 216 · 썸네일 178×114 · 줌 40px 원형 세로 피치 52 · 하단 플로팅 줌 툴바(− · + · % · 맞춤 · 초기화) | Zillow 뷰어 + Mobbin Jira |
| 관리자 | 상단 바 56 · 사이드바 240 · 표 행 40 · 카드 패딩 16 | Shopify Admin |
| 데이터 행 카드(모바일 목록) | 높이 120 · 간격 8 · radius 20 · 패딩 20 | RISE /find |

---

## 7. 실측 스크립트 실행 로그 (사이트별 raw 결과 요약 — 검수용)

공통 스크립트: `getComputedStyle` 추출 함수 `S(el)` = {tag, txt, x, y, w, h, fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, color, backgroundColor, borderRadius, borderTop, boxShadow, padding, transition, transform} + canvas `hex()` 변환 + 루트 CSS 변수(`styleSheets` `:root` 규칙 또는 `getComputedStyle(documentElement)` 순회) + `@media` 조건 집계 + 전역 라이브러리 검사(gsap·ScrollTrigger·Lenis·Swiper·jQuery 등).

1. **hogangnono.com** (2026-10-17, 뷰포트 2280×1350)
   - body: Pretendard 16px #111827 / bg #ffffff · 루트 변수 `--radius: 0.5rem` (+ sendbird 채팅 위젯 변수, 디자인 토큰 아님)
   - 좌 패널 `scene-home` 376×570, 헤더 `pt-safe … px-5` bg #584de4 h61 · 검색 그룹 354 폭
   - 칩 버튼 `매매` 68×32 bg #f0f0f0 br8 pad 6/12 14px/600 sh `inset 0 0 0 1px rgb(31,41,55)` / `유형·평형·가격` bg #fff sh `inset 0 0 0 1px rgb(236,238,242)` · tr `color .15s cubic-bezier(.4,0,.2,1), background-color .15s …`
   - `학원가` 78×38 bg #f3f4fc c #584de4 br6 pad 10/16 15px/400 · `실시간` 52×26 1px solid #dc2626 br6 13px/600 · 지도 버튼 `지도` 38×38 br4 sh `0 4px 8px rgba(0,0,0,.15)` 14px/600 #4f4f4f
   - 상세(`/apt/1Q7e2/0/4`): H1 16px/400 #fff · 주소 EM 14px #111827 · 메타 LI 15px/22.5 #555 · 평균 라벨 15px #584de4 · 대표가 22px/700/22 #4337de · 차트 탭 16px h45 #4337de · 표 머리 12px #333 · 행 TD 13px pad 7.5/20/7.5/0 h55 · 가격 14px/700 · 더보기 14px #6e6e6e · CTA 16px #4337de h48 · 세그먼트 `매매` 60×26 bg #5963d9 br2
   - 섹션 제목(16px/700 #333) y순: 지역 평당가 비교 1354 → 거래세 1784 → 보유세 1999 → 타입/동 정보 2678 → 아파트 자산 관리 3065 → 대출계산기 3311 → 관리비 4530 → 아파트 일조량 4676 → 빠른 배송 생활권 4952 → 주변 상권 정보 5146 → 3개월 내 나올만한 전세 5587 → 주변 대중교통 5783 → 주변 개발호재 7068 → 주변 입주 예정 아파트 7530 → 살아본 이야기 7842
   - 키프레임: orbit, pulse, scale-in-bounce, spin, ticker, enter, exit, accordion-up/down, fadeIn/Out, slideFrom*/To* · 전환 51규칙(`[data-vaul-drawer] transform .5s cubic-bezier(.32,.72,0,1)`, `.skeleton pulse 2s cubic-bezier(.4,0,.6,1) infinite`, `accordion .2s ease-out`, `max-width .4s ease-in-out, opacity .3s ease-in-out`)
   - 핀: `.pin` 52×58, 클래스 `officetel`·`pin-empty`·`selected hover`·`has-visitor`·`has-award visitor-top`, 배지 `.visitor` bg #41404a/#4f4e5a br4 h23, 내부 span bg #fff br 8.5px · SVG fill 목록에 #584DE4·#419DFF·#a6bcff
   - 아이콘: 16×16·24×24·28×28, stroke-width 1.5, round cap, #111827/#1f2937
   - @media: min 640/768/1024/1280(각 4) · 1536 · max 820/440/378 · (hover:hover) and (pointer:fine) 3 · reduced-motion 1 · viewport meta `maximum-scale=1.0, minimum-scale=1.0`
2. **zillow.com** 목록 `/seattle-wa/` · 상세 `/homedetails/…79977067_zpid/` · 뷰어 `?imxlb=f,0`
   - 루트 변수 `--search-page-frame-nav-height: 61px; --search-action-bar-height: 55px` · body font "Noto Sans KR"(로캘 폴백), UI Inter
   - H1 Object Sans 20px/900 #111116 · 결과 수 H2 14px/700 · 정렬 14px/700 #0041d9 · Sign in 80×36 bg #0041d9 br12 pad 5/16 · 필터 `For sale` 116×40 bg #e2f0ff br12 sh `inset 0 0 0 2px rgb(0,65,217)` / `Price` 154×40 #fff sh `inset 0 0 0 1px rgb(126,127,142)` · tr `box-shadow .2s cubic-bezier(.25,.1,.25,1)` · Save search 116×40 #0041d9 pad 8/16 · 검색 박스 792×40 #fff br12
   - 목록 열 x1530 w750 sh `-2px 2px 5px rgba(0,0,0,.4)` · 카드 rect [1550,230,344,304] [1902,230,…] [1550,542,…] → 간격 8 · 카드 내부 div #fff br12 sh `0 8px 20px rgba(0,0,0,.15)` tr `box-shadow .2s cubic-bezier(.42,0,1,1)` · 이미지 박스 344×186 br `12px 12px 0 0` bg #dddde1, natural 596×446 · 배지 176×20 #fff br999 12px/700 pad 2/8
   - 카드 텍스트: `$2,200,000` 20/700/24 · `4`·`5`·`3,280` 14/600/24 · `bds`·`ba`·`sqft` 14/400 · 주소 14px #535364 · MLS 10px · More 14px #0041d9
   - 상세: 컨테이너 x516 w1248 #fff · 본문 열 x556 w796 · `$2,200,000` Open Sans 36/900/40 #2a2a33 · `4`·`5`·`3,280` 36/700/40 · `beds` 18/400 · 주소 H1 18/400 · 사실 타일 260×48 #f9f9fb br4 pad12 · 칩 120×28 #f1f1f4 br4 pad 2/8 · `What's special` H2 24/700/40 · `Open houses` H4 24/700/32 · CTA `Request a tour` 277×64 #006aff br4 pad 12/16 · `Contact Mia` 277×48 #fff br4
   - 뷰어: NAV 2280×56 #2a2a33 · 세그먼트 DIV 306×30 #54545a br24 bd 3px · `Floor Plan` 버튼 14px/700 #006aff tr `background-color .2s, border-color .2s, color .2s` · 레일 DIV x2064 w216 #343440 · 썸네일 178×114 br6 bd 3px #006aff(Floor_1) / #4c4c4c(Floor_2·3), y 224·354·484 · 줌 버튼 40×40 br50% #fff sh `0 2px 4px rgba(0,0,0,.3)` tr `border .1s ease-in-out, transform .1s ease-in-out`, y 72·124
3. **redfin.com** `/city/16163/WA/Seattle` → 「사용자가 인간인지 확인」 CAPTCHA 화면. **우회하지 않고 중단**, Rightmove로 대체.
4. **rightmove.co.uk** 목록 `/property-for-sale/London.html` · 상세 `/properties/93652893`
   - 쿠키 배너 "Reject all" 선택 · 루트 변수 없음(0) · body Effra
   - 헤더 2265×50 #fff · 필터 행 DIV x433 w1400 h50 bg #000433 · 셀렉트 128×40 bg #000433 br8 · 검색 INPUT 314×40 #fff br `8px 0 0 8px` · 컨테이너 체인 433:1400 `max-width:1400px` → 1040 열(패딩 0/16/8) → 카드 1008
   - 카드 DIV 1008×386 bd 1px #c3c4c9 br8 · 이미지 395×312 ×2 · `£500,000` 24/500/32 ls .1px #fff · 제목 16/500/24 #000433 · 설명 15px #4f5064 · Added 14/500/20 · 카드 y 271(h386) → 689 = 간격 32
   - 상세: Back 링크 #11828d · 주소 16/500/24 · 가격 24/500/32 · `Can you afford it?` 16/500 #157968 · 라벨 `PROPERTY TYPE` 12/400/16 ls 1px #6c6d7f · 값 16/400/24 · `Key features`·`Description` 20/500/28 · 불릿 행 y 1121→1153 = 32 · `Read full description` #107a84 · 이미지 776×435 + 384×213 ×2
   - aside 383×3428 relative → DIV sticky top 0 → 카드 383×350 #fff br8 sh `0 2px 16px rgba(0,0,0,.2)` → 블록 335×144 #000433 br4 · `Call agent` 303×48 #00deb6 bd 2px #00deb6 br8 16/500 tr `.24s` · `Request details` 303×48 #00deb6 br8
5. **awwwards.com** `/websites/real-estate/` → SOTD 배지 후보: Realevate(Or Halevi, DEV SOTD) · Sobha Privy Collection(Vide Infra, DEV SOTD) · Kononenko Architectural Bureau(DEV SOTD) · LIKOVA(DEV SOTD) · ERA Residence(DEV SOTM) · 21 Oaks(HM) · `/sites/realevate` → **"SOTD 7.22 /10 · Site of the Day - Sep 27, 2026"** · `/websites/data-visualization/` → Cerebrium(DEV SOTD) · AI in Design Report 2026(DEV SOTD) · The State of the Gallery(DEV SOTD) · `/sites/cerebrium` → **"SOTD 7.39 /10 · Site of the Day - Sep 10, 2026"** (세부 항목 점수는 페이지에서 수치 추출 안 됨 — 가중치 Design 40·Usability 30·Creativity 20·Content 10만 확인)
6. **realevate.agency** — 전역 gsap·ScrollTrigger · html class `site-preloader-counter-init` · body bg #fff · 루트 변수 원문 3-1 참조 · 리프 텍스트: About 28.5px/500 ls −0.2736px #1f2b5e · 마퀴 364.8px/500/364.8 ls −7.296px ×5 복제(x −1075·1181·3437·5693·7949 = 피치 2256) · 리드 39.58px/500/51.455 ls −0.3958px · STARTING FROM Monument Extended 21.77px/500/29.39 ls 1.74px · 스크롤 후 NAV bg #e3e5eb · `.selection-card` 474×910, tr `filter .8s cubic-bezier(.18,.13,0,.99)` · 패널 #222a4c 474×640 · 세로 제목 73.872px/500 ls −1.477px tf `matrix(-1,0,…,-1,…)` · 호버 시 3번째 카드 `filter: brightness(1.08)` + `.selection-card__cover::after opacity 1`
7. **cerebrium.ai** — generator `Astro v6.1.0` · 쿠키 "Reject all" · h1 ABC Favorit 108/300/108 ls −2.7px #fff (x173 y930 w950) · 마퀴 문자 228px/500(클릭&홀드 인터랙션 "CLICK AND HOLD") · nav UL 464×54 br7 tr `background-color .2s cubic-bezier(.645,.045,.355,1)` · 버튼 `TRY IT NOW` 121×54 #ff488b br7 pad 0/20 · `LOG IN` 88×54 #cfd7e7 c #172b76 · 섹션 `WHY CEREBRIUM` 모노 13px #172b76 · 인덱스 54/300/62.1 ls −2.7px #172b76(활성) / #c6cee0, 부모 DIV `position: sticky; top: 98px`, A tr `color .2s cubic-bezier(.4,0,.2,1)` · 기능 카드 제목 y 3191·4155·5089·6023 · 막대 5px br10 #ff488b/#586490 tr `width .25s / 1.66176s / 2.89706s / 4s cubic-bezier(0,0,.2,1)` · 세그먼트 활성 141×44 #586490 br7 tr `left/width/top/height .2s cubic-bezier(0,0,.2,1)` · 키프레임 fade-slide-in, overlay-anim-in/out, initial-loader-logo-bar · 토큰 3-2 참조
8. **gdweb.co.kr** `/sub/list.asp`(제목 「GDWEB:WEB 부문 선정작」) → 2026 선정 목록에서 "옥정중앙역 디에트르 Ⅱ 26.10.13" · "RISE ETF 26.09.29" 확인, 카드 클릭으로 각 라이브 사이트 이동 확인
9. **detre-ojop.co.kr** — jQuery · body Pretendard Variable · 인트로 팝업 2중 + 영상 → 홈페이지 입장 → 팝업 5연 + "오늘 하루 열지 않음" · GNB 22.8px/500 lh 114 ls −0.684px(−0.03em) · 서브메뉴 20.52px/400 #111 · 평면안내 `/unit/cont01.html`: 탭 LI 19.38px #777 h46 · 평면 콘텐츠 IMG `unit/119oa.jpg` 1584×1933 단일 이미지(타입 배지·면적·배치도·치수 전부 포함)
10. **kbam.co.kr** (RISE ETF) — 팝업 "닫기" · body bg #111111 Pretendard · html font-size 10px · 변수 198개(그레이·옐로·자산군·radius·transition, 3-3 참조) · 홈 섹션 제목 KBFG Text 32/500/41.6 ls −1.92px · 기간 버튼 56×30 br8 pad 4/10 활성 #fff / 비활성 #2f2f2f · 순위 카드 A 460×189 br20 pad24 bg `rgba(59,59,59,.3)` · 래퍼 tr `opacity .65s cubic-bezier(.5,1,.89,1) .1s, transform .65s cubic-bezier(.22,1,.36,1) .1s` / 다음 요소 지연 .25s · 배지 56×22 #fff br4 pad 2/6 · `+0.28%` 17px #ff3c3c · `-15.10%` 17px #3e8bff · `/find`: 정렬 머리 `1개월` 14/500 #ffd338 · 행 DIV 2222×120 `rgba(59,59,59,.3)` br20 pad20 · 수치 y 419·547·675·803·931·1059(피치 128) · 수치 20/500/28 ls −1.2px · 상품명 18/500 ls −1.08px · 아이콘 16(채움)·20(1.25 round)·24(1.5) · @media max 1023(1,153) · hover:hover 73 · max 1024 28 · reduced-motion 26 · max 920 20 · min 1024 15

---

## 8. 게이트 자가 점검
- [x] 실측 수치(px·hex·cubic-bezier·ms)로 기록 — "~한 느낌" 서술 없음. 미추출 항목은 이유와 함께 명시(호갱노노 핀 스프라이트 색, Zillow 도면 벽체 색, Cerebrium 세부 점수).
- [x] 어워드 출처 2곳(Awwwards SOTD 2건) + 국내 어워드 1곳(GDWEB 선정) — 각 수상일·점수·확인 URL 명시, 후보(Nominee)를 수상작으로 적지 않음.
- [x] 4축(디자인시스템·UI/UX·인터랙션·그래픽 소스) 출처 표 — 빈 축 없음(4장).
- [x] Mobbin 54건(최소 12건 충족) — 수치 미기재, 어워드 미산정.
- [x] 도메인 3곳(국내 1 호갱노노 + 해외 2 Zillow·Rightmove) — Redfin은 CAPTCHA로 제외(우회 안 함).
- [x] 저장 레퍼런스 `shopify-admin` 관리자 이식 수치 요약(5장).
- [x] 제안 토큰 초안 — 각 값에 근거 표기, 계산 보정치는 "계산"으로 구분(6장).
- 한계: 창 크기 변경이 적용되지 않아 1440·375 뷰포트 실측 없음(모바일 전환 방식은 브레이크포인트 규칙과 Mobbin 구성으로만 판단). Mobbin 이미지는 내려받지 않음(구축 시 필요한 화면만 재검색 후 저장 권장).
