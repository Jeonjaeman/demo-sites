// 운영 중 — 고객 도메인에서 실제로 오픈한 사이트만 싣는다(11곳 모두 jeonjaeman.github.io 를 frame-ancestors 에 허용 · 2026-11-07) (탱탱소프트 WORKS 의 공개 · 운영 사례와 같은 목록 · 2026-11-07 기준).
//   frame:true  → 상세에서 실제 사이트를 iframe 으로 보여 준다 (사이트가 다른 사이트 안에 들어가는 것을 허용)
//   frame:true → 사이트가 iframe 을 막는다(X-Frame-Options · frame-ancestors) → 녹화 영상을 기본 화면으로
//   video 는 탱탱소프트 WORKS 원본을 그대로 쓴다(용량이 커서 이 저장소에 두지 않는다). 썸네일 · 포스터는 assets/live/<slug>/
// 새 운영 사이트를 추가할 때는 WORKS 와 같은 slug 로 맨 앞에 넣고, 썸네일(1600×1200) · 포스터(16:9)를 assets/live/<slug>/ 에 둔다.
window.LIVE_SITES = (function(){
  const W = "https://bqhtklcofkwrfbtovgow.supabase.co/storage/v1/object/public/work-media/works/";
  return [
    { slug:"sororong", client:"소로롱 이벤트&벌룬", title:"소로롱 풍선 이벤트 사이트", url:"https://sororong.kr/", frame:true, published:"2026-11-05",
      summary:"기업 행사부터 돌잔치까지 현장 사진으로 보여 주는 경기 광주 풍선 이벤트 업체 사이트",
      description:"기업 시상식과 브랜드 팝업, 관공서와 학교 행사, 돌잔치의 풍선 연출을 맡는 소로롱의 사이트를 탱탱소프트 CMS 위에 맞춤 제작해 운영 도메인에 연결했습니다. 서비스별 페이지마다 현장 사진 갤러리와 진행 순서, 자주 묻는 질문을 두고, 카카오톡과 참고 사진을 첨부하는 상담 신청으로 이어집니다.",
      video:{ src:W+"4be9ee5d-a7cb-4be9-8ffe-172678b1cabf/video-753388fa0bd0c28e-a591aecb29af.mp4", width:1440, height:810, seconds:40 } },
    { slug:"daruda", client:"다루다 (DARUDA DESIGN STUDIO)", title:"다루다 인테리어 스튜디오 사이트", url:"https://designdaruda.co.kr/", frame:true, published:"2026-11-03",
      summary:"천안 인테리어 스튜디오의 주거·상업 공간 포트폴리오 사이트",
      description:"천안의 인테리어 스튜디오 다루다의 브랜드 사이트를 탱탱소프트 CMS 위에 맞춤 제작해 운영 도메인에 연결했습니다. 한 화면 홈에서 about · portfolio · press · contact 패널이 열리고, Living 8건 · Commercial 25건 프로젝트와 시공 과정을 사진 중심의 목록과 상세로 보여 줍니다.",
      video:{ src:W+"7eadff10-de2e-4f4e-8210-11aaf64c70fd/video-f158404b240f88f4-44216ec4fec6.mp4", width:1440, height:810, seconds:42 } },
    { slug:"wanjuitda", client:"완주잇다", title:"완주잇다", url:"https://wjitda.kr/", frame:true, published:"2026-10-12",
      summary:"완주의 자연·걷기·관광·체험·로컬을 하루 동선으로 잇는 모바일 웹/PWA",
      description:"완주군의 장소와 「오늘, 완주」 테마 코스, 지도, 웹 스탬프를 한곳에 모은 로컬 큐레이션 모바일 웹/PWA입니다.",
      video:{ src:W+"58897497-16a1-4b99-8144-45280c0c6aa7/video-1ca6c4facd4eda24-3401d03ea56f.mp4", width:1920, height:1080, seconds:202 } },
    { slug:"logobank", client:"로고뱅크", title:"로고뱅크", url:"https://www.logobank.co.kr/", frame:true, published:"2026-09-29",
      summary:"로고 제작·CI·인증마크 디자인 전문 회사 브랜드 사이트",
      description:"1999년부터 G마크·홈택스·K-MILK 등 국민이 매일 마주치는 마크를 만든 로고 제작 전문 회사의 브랜드 사이트입니다. 27년의 작업과 신뢰를 담은 반응형 웹사이트로 제작했습니다.",
      video:{ src:"https://tengtengsoft.kr/works/logobank/walkthrough.mp4", width:1440, height:810, seconds:18 } },
    { slug:"air", client:"붙이는공기", title:"붙이는공기", url:"https://stickonair.com/", frame:true, published:"2026-09-17",
      summary:"기능성 공기관리 레이어 브랜드 웹사이트",
      description:"붙이는공기의 제품 원리와 적용 공간, 시공사례를 소개하는 브랜드 웹사이트입니다. 스크롤 인터랙션과 레이어·파우치 제품 안내, 상담 및 파트너 문의 동선을 구성했습니다.",
      video:{ src:W+"964ff3bc-7de5-447f-b7e6-2326e1b7a7e5/video-2c4491ceeb801aca-53c67bcaed0d.mp4", width:1920, height:1080, seconds:60 } },
    { slug:"lstar-clinic", client:"엘스타의원", title:"엘스타의원", url:"https://www.lstarclinic.com/", frame:true, published:"2026-09-11",
      summary:"진료 철학과 병원 공간을 담은 의원 반응형 웹사이트",
      description:"진료 철학과 병원 공간을 차분한 시각 언어로 담은 반응형 웹사이트입니다.",
      video:{ src:W+"239f5674-d170-4303-8907-031a187ee18e/video-5cb5fc22341c5bba-13387aab7831.mp4", width:1920, height:1080, seconds:33 } },
    { slug:"songcheon-church", client:"송천교회", title:"송천교회 홈페이지", url:"https://songcheonch.org/", frame:true, published:"2026-09-11",
      summary:"교회 소개·예배 안내·섬기는 사람들·소식을 담은 반응형 홈페이지",
      description:"교회 소개, 예배 안내, 섬기는 사람들, 소식 게시판을 갖춘 반응형 홈페이지를 Next.js 로 구축해 운영 도메인에 배포했습니다.",
      video:{ src:W+"5661ab8c-3f71-419a-9afd-3a0196577bc5/video-e51f836d03cf67c9-8865abd35028.mp4", width:1920, height:1080, seconds:22 } },
    { slug:"manna-farm", client:"만나 팜 (Manna Farm Koh Kong)", title:"만나 팜 선교 농장 홈페이지", url:"https://manna-farm.org/", frame:true, published:"2026-09-11",
      summary:"캄보디아 코콩 선교 농장 소개·소식·게시판 홈페이지",
      description:"캄보디아 코콩의 선교 농장 소개, 소식, 게시판과 관리자 편집 기능을 Next.js 와 Supabase 로 구축했습니다.",
      video:{ src:W+"1cd4e9ca-2063-42eb-a2e7-7dd6a7943c86/video-3c067231193f17fe-604b5b953416.mp4", width:1920, height:1080, seconds:19 } },
    { slug:"pandora-factory", client:"판도라팩토리", title:"판도라팩토리 브랜드 사이트", url:"https://pandorafactory.co.kr/", frame:true, published:"2026-09-11",
      summary:"픽업트럭 슬라이딩베드·캐노피·밴 스토리지 제조사 브랜드 사이트",
      description:"픽업트럭 슬라이딩베드, 캐노피, 밴 카고 스토리지 제품군을 브랜드 필름과 제품 소개 구조로 보여주는 사이트를 제작해 운영 도메인에 배포했습니다.",
      video:{ src:W+"522cfcaa-b494-440e-bf88-caf82aa69222/video-6958effe6ab2759d-d5ef35b94fc8.mp4", width:1920, height:1080, seconds:32 } },
    { slug:"ddulneunnal", client:"뚫는날", title:"뚫는날 24시 출동 홈페이지", url:"https://ddulnal.co.kr/", frame:true, published:"2026-09-11",
      summary:"하수구·변기 막힘, 누수탐지, 고압세척 24시 출동 서비스 홈페이지",
      description:"서울·인천·경기 24시 출동 서비스를 전화 상담 전환에 맞춰 설계한 반응형 홈페이지를 제작해 운영 도메인에 배포했습니다.",
      video:{ src:W+"edaa2af8-d990-4930-baa8-615bf268593a/video-97e47231d05a228a-e153a81b1b2c.mp4", width:1920, height:1080, seconds:27 } },
    { slug:"printline", client:"㈜프린트라인", title:"프린트라인 홈페이지", url:"https://printline.kr/", frame:true, published:"2026-09-11",
      summary:"디자인·인쇄·출력·제본·판촉물 기업 홈페이지",
      description:"인쇄·출력·제본·판촉물 서비스 소개와 포트폴리오, 상담 문의 접수를 갖춘 기업 홈페이지를 Astro 와 Supabase 로 구축해 운영 도메인에 배포했습니다.",
      video:{ src:W+"93c96bc6-7635-4aaa-884e-364912c89326/video-a23e043673d9165b-c0c940e2d31d.mp4", width:1920, height:1080, seconds:27 } },
  ].map(s => ({ ...s, thumb:`./assets/live/${s.slug}/thumb.webp`, poster:`./assets/live/${s.slug}/poster.webp` }));
})();
