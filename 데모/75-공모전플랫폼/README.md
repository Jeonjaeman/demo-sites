# GYCA — Global Youth Creative Awards (제안용 데모)

국내외 청소년 국제 창작 공모전(미술·문학·음악·공연·디자인·미래창작)의
**접수 → 결제 → 블라인드 심사 → 결과 → 인증서 → 해외 본선** 통합 플랫폼 데모입니다.
위시켓 「공모전 접수·심사·관리 플랫폼 구축」 공고(협의 후 결정·90일·강남) 대응.

> ⚠️ 공모전·수상자·작품·심사위원 등 **모든 데이터는 가상**입니다.
> ★ 경쟁 상황: 다른 지원자가 동작 프로토타입을 공개 댓글로 제출한 건 — 능가 포인트 13개를 실측 기반으로 구현 (분석/_실측_초안.md §2).

## 화면 구성 (15페이지 · EN 기본/KO 전환)

공개(브랜드형·다크+골드): `index`(풀블리드 히어로·부문 6색·Global Stages 캐러셀·Featured Winners·신뢰 밴드·마감 카운트다운) · `competitions`(분야·도시·상태 3필터·상태별 CTA) · `competition?id=`(요강 12섹션·번호 챕터 내비·스티키 카운트다운·심사위원 실명·배점·총비용·fee waiver·Know your rights·**confirmed 파트너만 노출**) · `winners`(등급·분야·연도·국가 필터·**미성년 마스킹 기본+guardian view**·등급 위계 5단 금속 톤) · `exhibitions`(도시별 아카이브) · `about`(HOW JUDGING WORKS) · `notice` · **`rules`/`terms`/`privacy`(실제 내용 — 경쟁 404 반전)**

기능(절제): `apply`(접수 5단계 — **연령 게이트(국가별 동의연령)**·부문별 폼·**파일 익명화 before/after**·**결제 주체 분기**·이용허락 4항목·동의 4분리·waiver·자동 임시저장) · `mypage`(5탭·미수상 화면·본선 신청 총비용 공개·**역할 전환**) · `judge`(블라인드·루브릭·**이해충돌 recuse**·점수 잠금) · `admin`(10메뉴 — 공모전 **복사**·접수자 consent 추적·**협력기관 노출 제어**·심사 자동배정·결과 공개예약·동점 경고·waiver 승인·**번역률**·감사로그)

## 체험 시나리오 (타이핑 없이)
1. apply → 「Fill with sample applicant」(13세) → 보호자 동의 게이트 발동 → step4 결제 주체 분기
2. apply step3 → 파일명 입력 → 익명화 before/after
3. winners → 미성년 마스킹 확인 → guardian view 토글
4. judge → Conflict 엔트리 → recuse / 정상 엔트리 → 루브릭 채점 → 제출 잠금
5. admin → Partners → confirm/private 토글 → competition 상세 파트너 노출 실연동

## 디자인 실측 (분석/_실측_초안.md)
어워드: Squarespace Foundations(Awwwards SOTD 26.09.01·7.38 — gold #c59d3d·#111·12칼럼 1360)×Aardvark(SOTD 26.08.30·7.2 — H1 lh0.800·부문 base+soft·이징 (.32,.72,0,1)·스쿼시 0.955/0.925). 도메인: Scholastic×Dyson×Ars + 경쟁 프로토타입 전수 실측(약점 13).
타이포: Fraunces 디스플레이 clamp(56~132px)/lh .88 + Pretendard + Archivo.

## 기술 구성
순수 HTML+CSS+JS · 공모전=데이터(admin 복사로 즉시 생성) · localStorage · 마감 KST/CEST/EDT+실시간 카운트다운 · 리빌 불가 환경 폴백 · 견적 2안: `지원서_위시캣.txt`.
