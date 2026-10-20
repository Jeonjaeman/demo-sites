# Mobbin 디자인 시스템 후보 (메인 세션 선별 · 2026-10-20)

검색 6회(ios 5 · web 1) · 46화면 열람 · 16장 보관(`분석/mobbin/`). Mobbin은 갤러리이므로 수치는 라이브 웹 실측으로 채운다(출처 표기 `Mobbin · 구성 참고`).

## A. 디자인 시스템 채택 후보 (★ 최종 검토 대상)

| # | 후보 | 관찰(이미지 직접 확인) | 놀판 적합성 | 라이브 실측 가능 | mobbin_url |
|---|---|---|---|---|---|
| A1 | **Glassdoor Community (Bowls)** | 흰 배경·그린 1색 액센트. 피드 카드 = 작성자(아바타+직함) → 본문 3~4줄 → `Like · 165 Comments · Share` 행 → 상위 댓글 1개 미리보기 카드. 상세는 댓글이 회색 카드로 들여쓰기, "View 7 more replies" 접기, 하단 고정 댓글 입력창+Post. 본문 글자가 크고 행간 넓어 중장년 가독성에 맞음 | ◎ 게시판 중심·댓글 위계 명확·색 절제 | ◎ glassdoor.com/Community 공개 | https://mobbin.com/screens/cfa0c1ae-3fd8-437c-aced-9ae749526bba · https://mobbin.com/screens/0a64a4ab-fa55-4c7f-8de8-dda4828c2495 |
| A2 | **Goodreads 그룹 토론** | 베이지 종이톤 배경(#f4f1ea 계열로 보임·실측 필요), 상단 바 베이지, 토론 목록이 "제목 굵게 + N topics 이탤릭" 2줄 반복 — 네이버 카페 게시판 목록의 리듬과 가장 가까움. 장식 없음 | ◎ 중장년 친숙·따뜻함·게시판 문법 | ◎ goodreads.com/group 공개 | https://mobbin.com/screens/5e00bd29-836d-486b-a70f-d9c9de57f4ac |
| A3 | **Digg (신판)** | 흰 배경·블루 액센트. 계층 댓글을 **세로 연결선**으로 표시, ▲ 7 ▼ 투표·Reply 행, 하단 고정 입력창. 웹 커뮤니티 탐색 화면은 카드 캐러셀 + 회원수·게시글수 메타 | ○ 댓글 트리 표현 참고. 블루는 여행 톤과 중립 | ◎ digg.com 공개 | https://mobbin.com/screens/c90b74cc-d68b-48ea-8430-324c6043f115 · https://mobbin.com/screens/99c502da-fb2f-4a1d-9e41-8c947ebe352c |
| A4 | Nextdoor 검색 결과 피드 | 아바타 컬러 이니셜·동네명·시간 메타, 본문 큰 글자, 링크 미리보기 썸네일 우측, "See all 67 comments" → 상위 댓글 1개 | ○ 동네 커뮤니티 = 여행지별 커뮤니티와 동형 | △ 로그인 벽 | https://mobbin.com/screens/6d9b9a65-a2bd-4f67-b0e4-4e7ba3f0068a |
| A5 | Tripadvisor 포럼 활동 피드(web) | 그린 액센트, 좌측 프로필 카드 + "Share your travel advice(Post photos / Write review)" 유도, 우측 피드 카드에 장소 카드 임베드 | ○ 여행 도메인 레퍼런스(A축)로 | ◎ 공개 | https://mobbin.com/screens/195a835c-7f7b-4c1a-8841-15e7d4979616 |

## B. 화면 유형별 구성 참고 (UI/UX 축 — 디자인 시스템과 별개)

| 화면 | 채택 참고 | 관찰 | mobbin_url |
|---|---|---|---|
| 글자 크기 설정 | **Bloomberg**(4단계 라디오 목록 + 하단 본문 미리보기) · **Evernote**(시스템 설정 따르기 토글 + 3단계 + 제목/본문 미리보기 카드) · Telegram(A~A 슬라이더 + 실시간 미리보기) | 놀판: 3단계(기본·크게·더 크게) 라디오 + 즉시 미리보기 + 헤더 「가」 빠른 토글 | https://mobbin.com/screens/e5b26f90-2fb8-49fe-a042-0e478cf633da · https://mobbin.com/screens/c8ccb710-4e06-445d-bbfa-8dbb84b023b3 · https://mobbin.com/screens/c4324f74-c637-4e49-b9e8-c30e59b05bed |
| 글쓰기 | **Grab 리뷰 작성** — 사진 썸네일 그리드(삭제 휴지통) + 「Add photo (5 left)」 남은 장수 표기 + 제목 입력 + 본문(힌트 불릿 3줄) + 「Save draft / Post now」 2버튼 하단 고정 | 사진 한도·남은 장수 노출은 중장년에게 특히 유효 | https://mobbin.com/screens/feab55ab-a8ba-4429-91be-30d1695ecf6f |
| 사진 갤러리 | **Google Maps 장소 사진** — 2열 메이슨리 + 「2 hours ago」 시간 배지 + 상단 필터 칩(All·Latest·Videos) · Reddit 미디어 탭(2열 + 캡션 1줄) | 라운지 사진 갤러리 = 2열 + 캡션 | https://mobbin.com/screens/87a179b0-84dd-4c8e-ac46-74d7ec721f17 · https://mobbin.com/screens/8930430d-ecb3-487c-a71d-048462215568 |
| 댓글 트리 | Digg(세로 연결선) · Glassdoor(회색 카드 들여쓰기) · NYT Cooking(큰 세리프·`2 replies` 구분선·@멘션) | 놀판: 1단 들여쓰기 + 연결선, 2단 이상은 평탄화 | 위 참조 |
| 커뮤니티 홈 | Runna(상단 커버 이미지 + Top Posts/Recent 탭 + 플로팅 POST) | 여행지 게시판 상단 커버 이미지 패턴 | https://mobbin.com/screens/e641b9cc-b534-44f4-8196-61be8f99be85 |

## C. 추천
- **1순위 A1 Glassdoor Bowls**: 피드·상세·글쓰기 3화면이 한 시스템으로 갖춰져 있고 본문 크기·댓글 위계·색 절제가 "중장년 가독성 + 네이버 카페형" 요구와 가장 맞음. 라이브 실측 가능.
- **톤 보정 A2 Goodreads**: 배경을 순백 대신 종이톤으로 가져가면 중장년에게 눈부심이 덜하고 "놀판"의 따뜻한 성격이 살아남. 실측해 배경·경계선 토큰만 가져옴.
- **댓글 트리 A3 Digg**: 세로 연결선 패턴만 이식.

## D. 최종 결정 (사용자 검토 2026-10-20)
**채택: A1 Glassdoor Community(피드·상세·글쓰기 구조 + 큰 본문) + A2 Goodreads(종이톤 배경·경계선 토큰) + A3 Digg(댓글 세로 연결선 패턴).**
- 적용 규칙: 수치는 세 곳의 라이브 웹을 모바일·데스크톱 폭에서 `getComputedStyle`로 실측해 가져온다(Mobbin 스크린샷 눈대중 금지). 폰트는 가져오지 않고 메트릭(em 비율)만 Pretendard에 이식.
- 기본 글자 크기는 Glassdoor 본문 실측값을 하한으로 삼고, 3단계(기본·크게·더 크게) 배율은 실측 후 확정.
