/* ===== 한상 HANSANG — 24화면 인터랙티브 데모 =====
 * RFP 화면 구성: 온보딩5 · 홈/미션6 · 레시피3 · 피드1 · 건강2 · 랭킹2 · 설정5 = 24
 * 데모 상태는 localStorage(hs_demo)에 저장. 사이드 패널 "데모 초기화"로 리셋.
 */
(function () {
  'use strict';

  /* ---------- 상태 ---------- */
  const DEFAULT = {
    onboarded: false,
    missionDone: false,      // 나(지현)의 오늘 미션
    momDone: true, dadDone: false,
    ingredients: 4,          // 삼계탕 재료 5개 중
    unlocked: false,         // 삼계탕 레시피 해제 여부
    nudged: false,
    reacts: { f1: false, f2: false, f3: false },
    tg: { push: true, morning: true, night: false, marketing: false, health: true, sleep: true }
  };
  let S;
  try { S = Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem('hs_demo') || '{}')); }
  catch (e) { S = Object.assign({}, DEFAULT); }
  const save = () => localStorage.setItem('hs_demo', JSON.stringify(S));

  const FAM = [
    { key: 'me',  nm: '지현 (나)', em: '👩🏻', role: '딸 · 32', steps: 6842, goal: 8000, sleep: 82 },
    { key: 'mom', nm: '엄마',      em: '👩🏻‍🦳', role: '박정희 · 59', steps: 7910, goal: 6000, sleep: 76 },
    { key: 'dad', nm: '아빠',      em: '👨🏻‍🦳', role: '김영수 · 62', steps: 4230, goal: 6000, sleep: 71 }
  ];
  const ING = ['🐔', '🌿', '🌰', '🧄', '🍚']; // 닭·인삼·대추·마늘·찹쌀

  /* ---------- 유틸 ---------- */
  const root = document.getElementById('screen-root');
  const tabbar = document.getElementById('tabbar');
  const $ = (s, el) => (el || document).querySelector(s);
  const doneCount = () => (S.missionDone ? 1 : 0) + (S.momDone ? 1 : 0) + (S.dadDone ? 1 : 0);

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.add('hidden'), 2200);
  }
  function ring(pct, size, color, track) {
    const r = (size - 10) / 2, c = 2 * Math.PI * r;
    return `<svg width="${size}" height="${size}">
      <circle class="rc" cx="${size/2}" cy="${size/2}" r="${r}" stroke="${track || '#F3EAE1'}"/>
      <circle class="rc" cx="${size/2}" cy="${size/2}" r="${r}" stroke="${color}"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" style="transition:stroke-dashoffset .8s ease"/>
    </svg>`;
  }
  const appbar = (title) => `
    <div class="appbar">
      <div class="t">${title}</div>
      <div class="icons">
        <button onclick="HS.go('history')" title="미션 기록">🗓</button>
        <button onclick="HS.go('settings')" title="설정">⚙️</button>
      </div>
    </div>`;
  const subbar = (title, back) => `
    <div class="appbar-sub">
      <button onclick="HS.go('${back}')">←</button><div class="t">${title}</div>
    </div>`;

  /* ---------- 화면 정의 (24) ---------- */
  const SCREENS = {

    /* ===== 온보딩 (5) ===== */
    onb1: { grp: '온보딩', nm: 'O1 스플래시·소개', tab: false, html: () => `
      <div class="screen no-tab"><div class="onb">
        <button class="onb-skip" onclick="HS.finishOnb()">건너뛰기</button>
        <div class="grow">
          <div class="logo-mark">🍲</div>
          <div class="logo-word">한상<small>HANSANG</small></div>
          <img class="onb-hero" src="assets/img/onboarding_illust.webp" alt="가족 연결 일러스트">
          <h2 style="text-align:center">하루 한 번의 미션이<br><b>가족의 한 상</b>이 됩니다</h2>
          <p class="sub" style="text-align:center">떨어져 사는 부모님과 매일 함께하는<br>공동 미션 · 건강 리포트 · 우리 가족 레시피</p>
        </div>
        <div class="onb-dots"><i class="on"></i><i></i><i></i><i></i><i></i></div>
        <button class="btn" onclick="HS.go('onb2')">시작하기</button>
      </div></div>` },

    onb2: { grp: '온보딩', nm: 'O2 로그인', tab: false, html: () => `
      <div class="screen no-tab"><div class="onb">
        <div class="grow">
          <h2>3초 만에 시작해요</h2>
          <p class="sub">자주 쓰는 계정으로 간편하게 로그인하세요.<br>부모님은 자녀가 보낸 초대 링크로 바로 합류할 수 있어요.</p>
          <div style="margin-top:34px;display:grid;gap:10px">
            <button class="btn kakao" onclick="HS.go('onb3')">💬 카카오로 시작하기</button>
            <button class="btn apple" onclick="HS.go('onb3')"> Apple로 시작하기</button>
          </div>
          <p class="login-note">iOS 심사 가이드라인 4.8 대응 — 서드파티 로그인 제공 시<br><b>Sign in with Apple 병행 제공</b> (제안 포인트)</p>
        </div>
        <div class="onb-dots"><i></i><i class="on"></i><i></i><i></i><i></i></div>
      </div></div>` },

    onb3: { grp: '온보딩', nm: 'O3 PASS 본인인증', tab: false, html: () => `
      <div class="screen no-tab"><div class="onb">
        <div class="grow">
          <h2>본인인증</h2>
          <p class="sub">건강 데이터 보호를 위해 최초 1회<br>PASS 본인인증을 진행합니다.</p>
          <div class="field"><label>이름</label><input value="김지현" readonly></div>
          <div class="field"><label>휴대폰 번호</label><input value="010-1234-5678" readonly></div>
          <div class="field"><label>통신사</label><input value="SKT · PASS 앱 인증" readonly></div>
          <p class="login-note" style="text-align:left">인증 완료 시 발급되는 CI/DI는 발주처 API로 전달되며,<br>토큰은 기기 보안 스토리지(Keychain/Keystore)에 저장합니다.</p>
        </div>
        <div class="onb-dots"><i></i><i></i><i class="on"></i><i></i><i></i></div>
        <button class="btn" onclick="HS.go('onb4')">PASS 인증하기</button>
      </div></div>` },

    onb4: { grp: '온보딩', nm: 'O4 가족 그룹 합류', tab: false, html: () => `
      <div class="screen no-tab"><div class="onb">
        <div class="grow">
          <h2>우리 가족과 연결할게요</h2>
          <p class="sub">가족 그룹을 새로 만들거나,<br>받은 초대 코드로 합류하세요.</p>
          <div class="card" style="margin-top:22px">
            <b style="font-size:15px">초대 코드 입력</b>
            <div class="code-box"><span>H</span><span>A</span><span>N</span><span>2</span><span>8</span><span>7</span></div>
            <button class="btn sm" style="margin-top:14px;width:100%" onclick="HS.go('onb5')">'김씨네 부엌' 합류하기</button>
          </div>
          <button class="btn ghost" style="margin-top:12px" onclick="HS.go('onb5')">＋ 새 가족 그룹 만들기</button>
          <button class="btn ghost" style="margin-top:10px" onclick="HS.toast('카카오톡 공유 시트 (데모)')">💬 카카오톡으로 부모님 초대하기</button>
        </div>
        <div class="onb-dots"><i></i><i></i><i></i><i class="on"></i><i></i></div>
      </div></div>` },

    onb5: { grp: '온보딩', nm: 'O5 권한 안내', tab: false, html: () => `
      <div class="screen no-tab"><div class="onb">
        <div class="grow">
          <h2>미션을 위해<br>필요한 권한이에요</h2>
          <div class="card" style="margin-top:20px">
            <div class="perm"><div class="ico" style="background:var(--green-soft)">🚶</div><div><b>걸음 수 (HealthKit / 삼성헬스)</b><p>걷기 미션 자동 판정과 가족 건강 리포트에 사용해요.</p></div></div>
            <div class="perm"><div class="ico" style="background:var(--blue-soft)">🌙</div><div><b>마이크 (에이슬립 수면 측정)</b><p>수면 중 호흡 소리로 수면 단계를 분석해요. 녹음은 저장되지 않아요.</p></div></div>
            <div class="perm"><div class="ico" style="background:var(--brand-soft)">📷</div><div><b>카메라·앨범</b><p>미션 인증 사진 촬영과 등록에 사용해요.</p></div></div>
            <div class="perm"><div class="ico" style="background:#FFF3E3">🔔</div><div><b>알림</b><p>가족의 미션 소식과 응원을 알려드려요.</p></div></div>
          </div>
        </div>
        <div class="onb-dots"><i></i><i></i><i></i><i></i><i class="on"></i></div>
        <button class="btn" onclick="HS.finishOnb()">허용하고 시작하기</button>
      </div></div>` },

    /* ===== 홈·미션 (6) ===== */
    home: { grp: '홈·미션', nm: 'H1 홈', tab: 'home', html: () => {
      const dc = doneCount();
      const famRows = [
        row(FAM[0], S.missionDone), row(FAM[1], S.momDone), row(FAM[2], S.dadDone, true)
      ].join('');
      function row(f, done, nudgeable) {
        return `<div class="fam-row"><div class="avatar">${f.em}</div><span class="nm">${f.nm}</span>
          ${done ? '<span class="st ok">완료 ✓</span>'
                 : (nudgeable ? `<button class="nudge" onclick="HS.nudge()">${S.nudged ? '응원 완료 💌' : '콕 찌르기 👉'}</button>` : '<span class="st wait">대기 중</span>')}</div>`;
      }
      return `
      <div class="screen">${appbar('한상')}
        <div class="home-greet">
          <div class="d">7월 23일 목요일 · 김씨네 부엌</div>
          <h2>지현님, 오늘 미션까지<br><b>${3 - dc === 0 ? '가족 모두 완료!' : `가족 ${3 - dc}명 남았어요`}</b></h2>
        </div>
        <div class="mission-card">
          <div class="lbl">오늘의 공동 미션</div>
          <h3>저녁 한 끼, 건강 반찬 곁들여<br>식사 사진 인증하기</h3>
          <div class="rw">🎁 전원 달성 시 · 삼계탕 재료 ${ING[4]} 찹쌀 획득</div>
          ${S.missionDone
            ? `<button class="btn done">✓ 내 인증 완료 — 가족을 기다려요</button>`
            : `<button class="btn" onclick="HS.go('mission')">미션 인증하러 가기</button>`}
        </div>
        <h3 class="sec">가족 달성 현황 <small onclick="HS.go('family')" style="cursor:pointer">자세히 →</small></h3>
        <div class="card" style="margin:0 20px">
          <div class="fam-ring-row">
            <div class="ring-wrap">${ring(dc / 3, 92, 'var(--brand)')}
              <div class="val">${dc}/3<small>달성</small></div></div>
            <div class="fam-avatars">${famRows}</div>
          </div>
        </div>
        <div class="mini-grid">
          <div class="mini" onclick="HS.go('steps')"><span class="ic">🚶</span><b>6,842보</b><small>목표 8,000보</small><div class="bar"><i style="width:85%;background:var(--green)"></i></div></div>
          <div class="mini" onclick="HS.go('sleep')"><span class="ic">🌙</span><b>82점</b><small>어젯밤 수면 · 7시간 12분</small><div class="bar"><i style="width:82%;background:var(--blue)"></i></div></div>
        </div>
        <div class="streak-band">🔥 우리 가족 <b style="margin:0 2px">12일 연속</b> 미션 달성 중!</div>
        <h3 class="sec">레시피 도감 <small onclick="HS.go('recipes')" style="cursor:pointer">전체 보기 →</small></h3>
        <div class="card" style="margin:0 20px 8px;display:flex;gap:14px;align-items:center;cursor:pointer" onclick="HS.go('${S.unlocked ? 'recipeOpen2' : 'recipeLocked'}')">
          <img src="assets/img/recipe_samgyetang.webp" style="width:64px;height:64px;border-radius:14px;object-fit:cover" alt="삼계탕">
          <div style="flex:1"><b style="font-size:15px">엄마의 여름 삼계탕</b>
            <small style="display:block;color:var(--sub);font-size:12px;margin-top:2px">재료 ${S.ingredients}/5 · ${S.unlocked ? '해제 완료!' : '1개만 더 모으면 해제'}</small>
            <div class="bar" style="height:5px;background:#F3EAE1;border-radius:99px;margin-top:8px;overflow:hidden"><i style="display:block;height:100%;width:${S.ingredients * 20}%;background:var(--brand);border-radius:99px"></i></div></div>
          <span style="font-size:20px">${S.unlocked ? '🔓' : '🔒'}</span>
        </div>
      </div>`; } },

    mission: { grp: '홈·미션', nm: 'H2 미션 상세', tab: 'home', html: () => `
      <div class="screen">${subbar('오늘의 미션', 'home')}
        <div class="mission-hero"><img src="assets/img/hero_family.webp" alt="가족 요리">
          <div class="ov"><b>저녁 식사 사진 인증하기</b><small>건강 반찬 1가지 이상 곁들이면 성공!</small></div></div>
        <div class="pad"><div class="card">
          <b style="font-size:15px">이렇게 인증해요</b>
          <ul class="step-guide" style="margin-top:6px">
            <li>오늘 저녁 식탁을 준비해요 — 배달도 좋아요</li>
            <li>나물·생선 등 <b>건강 반찬</b>이 보이게 찍어요</li>
            <li>사진 한 장이면 끝! 가족 피드에 공유돼요</li>
          </ul>
        </div>
        <div class="card"><b style="font-size:15px">🎁 보상</b>
          <p style="font-size:13.5px;color:var(--sub);margin-top:8px;line-height:1.6">가족 <b style="color:var(--ink)">전원</b>이 완료하면 레시피 재료 <b style="color:var(--brand-deep)">찹쌀 🍚</b>을 획득!<br>재료 5개를 모으면 <b style="color:var(--ink)">엄마의 여름 삼계탕</b> 레시피가 열려요.</p></div>
        ${S.missionDone ? `<button class="btn" disabled>✓ 인증 완료</button>` : `<button class="btn" onclick="HS.go('verify')">📷 사진으로 인증하기</button>`}
        </div>
      </div>` },

    verify: { grp: '홈·미션', nm: 'H3 사진 인증(카메라)', tab: 'home', html: () => `
      <div class="screen">${subbar('미션 인증', 'mission')}
        <div class="cam-frame" id="cam"><img src="assets/img/mission_meal.webp" alt="인증 사진">
          <div class="guide" id="cam-guide">식탁 전체가 프레임에 들어오게 찍어주세요</div></div>
        <div class="cam-btns">
          <button class="alb" onclick="HS.shoot()" title="앨범">🖼</button>
          <button class="shutter" onclick="HS.shoot()" aria-label="촬영"></button>
          <button class="flip" title="전환">🔄</button>
        </div>
        <div class="pad"><button class="btn" id="submit-btn" disabled onclick="HS.submitMission()">인증 사진 제출</button>
        <p style="text-align:center;font-size:11.5px;color:var(--sub);margin-top:10px">카메라·앨범 권한은 OS 표준 프롬프트로 획득합니다 (데모에서는 예시 사진 사용)</p></div>
      </div>` },

    family: { grp: '홈·미션', nm: 'H4 가족 달성 현황', tab: 'home', html: () => {
      const dc = doneCount();
      return `
      <div class="screen">${subbar('가족 달성 현황', 'home')}
        <div class="pad" style="text-align:center">
          <div class="ring-wrap" style="width:130px;height:130px;margin:6px auto">${ring(dc / 3, 130, 'var(--brand)')}
            <div class="val" style="font-size:24px">${dc}/3<small>오늘 달성</small></div></div>
          <p style="font-size:13.5px;color:var(--sub);margin-top:6px">${dc === 3 ? '가족 모두 완료! 재료가 지급되었어요 🎉' : '전원 달성 시 재료가 지급돼요'}</p>
        </div>
        <div class="pad" style="padding-top:0"><div class="card">
          ${[[FAM[0], S.missionDone, '오후 7:42 식사 사진 인증'], [FAM[1], S.momDone, '오후 6:10 식사 사진 인증'], [FAM[2], S.dadDone, S.dadDone ? '오후 8:01 식사 사진 인증' : '아직 소식이 없어요']]
            .map(([f, done, d]) => `
            <div class="fam-row" style="padding:9px 0">
              <div class="avatar big">${f.em}</div>
              <div style="flex:1"><span class="nm" style="font-size:14.5px">${f.nm}</span>
                <small style="display:block;font-size:11.5px;color:var(--sub)">${d}</small></div>
              ${done ? '<span class="st ok">완료 ✓</span>' : `<button class="nudge" onclick="HS.nudge()">${S.nudged ? '응원 완료 💌' : '콕 찌르기 👉'}</button>`}
            </div>`).join('')}
        </div>
        <div class="card" style="background:#FFF9EE"><b style="font-size:13.5px">💡 콕 찌르기</b>
          <p style="font-size:12.5px;color:var(--sub);margin-top:6px;line-height:1.6">미완료 가족에게 푸시 알림으로 응원을 보내요.<br>썸원(SumOne)의 리마인드 넛지에서 차용한 이탈 방어 장치입니다. (제안 포인트)</p></div>
        </div>
      </div>`; } },

    reward: { grp: '홈·미션', nm: 'H5 재료 획득(보상)', tab: false, html: () => `
      <div class="screen no-tab"><div class="reward-scene">
        ${'🎉🍊🧡✨🎊'.split('').map((c, i) => `<span class="confetti" style="left:${8 + i * 20}%;animation-delay:${i * .35}s">${c}</span>`).join('')}
        <div class="big">${ING[4]}</div>
        <h2>새 재료 <b>찹쌀</b> 획득!</h2>
        <p>가족 전원이 오늘 미션을 달성했어요.<br>이제 삼계탕 재료를 모두 모았습니다!</p>
        <div class="ing-track">${ING.map((e, i) => `<span class="${i < 4 ? 'got' : 'new'}">${e}</span>`).join('')}</div>
        <button class="btn" onclick="HS.go('recipeLocked')">레시피 해제하러 가기 🔓</button>
        <button class="btn ghost" style="margin-top:10px" onclick="HS.go('home')">홈으로</button>
      </div></div>` },

    history: { grp: '홈·미션', nm: 'H6 미션 기록(캘린더)', tab: 'home', html: () => {
      const days = Array.from({ length: 31 }, (_, i) => i + 1);
      const ok = [1,2,3,5,6,7,8,9,11,12,13,14,15,16,18,19,20,21,22];
      return `
      <div class="screen">${subbar('미션 기록', 'home')}
        <div class="pad"><div class="card">
          <b style="font-size:15px">2026년 7월</b>
          <div class="cal" style="margin-top:12px">
            ${'일월화수목금토'.split('').map(d => `<span class="h">${d}</span>`).join('')}
            <span></span><span></span><span></span>
            ${days.map(d => `<span class="d ${ok.includes(d) ? 'ok' : d < 23 ? 'miss' : ''} ${d === 23 ? 'today' : ''}">${d}</span>`).join('')}
          </div>
        </div>
        <div class="card" style="display:flex;gap:0;text-align:center">
          <div style="flex:1"><b style="font-size:20px">19</b><small style="display:block;font-size:11px;color:var(--sub)">이번 달 달성</small></div>
          <div style="flex:1;border-left:1px solid var(--line)"><b style="font-size:20px;color:var(--brand-deep)">🔥 12일</b><small style="display:block;font-size:11px;color:var(--sub)">연속 달성</small></div>
          <div style="flex:1;border-left:1px solid var(--line)"><b style="font-size:20px">86%</b><small style="display:block;font-size:11px;color:var(--sub)">달성률</small></div>
        </div>
        <div class="card" style="background:#FFF9EE"><b style="font-size:13.5px">💡 스트릭(연속 달성)</b>
          <p style="font-size:12.5px;color:var(--sub);margin-top:6px;line-height:1.6">리텐션 핵심 장치로 랭킹과 연동됩니다. (제안 포인트)</p></div>
        </div>
      </div>`; } },

    /* ===== 레시피 (3) ===== */
    recipes: { grp: '레시피', nm: 'R1 레시피 도감', tab: 'recipes', html: () => `
      <div class="screen">${appbar('레시피 도감')}
        <p style="padding:0 20px;font-size:13px;color:var(--sub)">가족 미션으로 재료를 모아 우리 집 레시피를 열어보세요 <b style="color:var(--brand-deep)">${S.unlocked ? 3 : 2}/6 해제</b></p>
        <div class="rec-grid" style="margin-top:10px">
          <div class="rec-card" onclick="HS.go('recipeOpen')">
            <div class="im"><img src="assets/img/recipe_doenjang.webp" alt="된장찌개"></div>
            <div class="bd"><b>아빠표 된장찌개</b><small>6월 4주 미션 완료 보상</small></div></div>
          <div class="rec-card" onclick="HS.go('${S.unlocked ? 'recipeOpen2' : 'recipeLocked'}')">
            <div class="im"><img src="assets/img/recipe_samgyetang.webp" alt="삼계탕">
              ${S.unlocked ? '' : `<div class="lock-ov">🔒<small>재료 ${S.ingredients}/5</small></div>`}</div>
            <div class="bd"><b>엄마의 여름 삼계탕</b><small>${S.unlocked ? '오늘 해제!' : '진행 중'}</small>
              <div class="prog"><i style="width:${S.ingredients * 20}%"></i></div></div></div>
          <div class="rec-card" onclick="HS.go('recipeOpen')">
            <div class="im"><img src="assets/img/mission_meal.webp" alt="집밥 한상"></div>
            <div class="bd"><b>고등어 구이 한 상</b><small>7월 1주 미션 완료 보상</small></div></div>
          ${[['잡채', '🥢'], ['갈비찜', '🍖'], ['김치전', '🥘']].map(([n, e]) => `
          <div class="rec-card" onclick="HS.toast('다음 주 미션으로 열리는 레시피예요!')">
            <div class="im" style="display:flex;align-items:center;justify-content:center;font-size:40px">${e}
              <div class="lock-ov">🔒<small>재료 0/5</small></div></div>
            <div class="bd"><b>${n}</b><small>미공개</small><div class="prog"><i style="width:0%"></i></div></div></div>`).join('')}
        </div>
      </div>` },

    recipeOpen: { grp: '레시피', nm: 'R2 레시피 상세(해제)', tab: 'recipes', html: () => `
      <div class="screen">
        <div class="rec-hero"><button class="back" onclick="HS.go('recipes')">←</button>
          <img src="assets/img/recipe_doenjang.webp" alt="된장찌개"></div>
        <div class="rec-body">
          <span class="chip orange">🔓 해제된 레시피</span>
          <h2 style="margin-top:10px">아빠표 된장찌개</h2>
          <div class="rec-meta"><span class="chip gray">⏱ 30분</span><span class="chip gray">🍽 3인분</span><span class="chip green">난이도 쉬움</span></div>
          <h3 class="sec" style="margin:18px 0 8px">재료</h3>
          <div class="card"><ul class="ing-list">
            <li>된장 <span>2큰술</span></li><li>두부 <span>1/2모</span></li>
            <li>애호박 <span>1/3개</span></li><li>표고버섯 <span>2개</span></li>
            <li>멸치육수 <span>500ml</span></li></ul></div>
          <h3 class="sec" style="margin:18px 0 8px">아빠의 한마디</h3>
          <div class="card"><p style="font-size:14px;line-height:1.7">"된장은 마지막에 풀어야 향이 살아있단다.<br>지현이 어릴 때부터 좋아하던 그 맛 그대로."</p></div>
          <button class="btn" style="margin-top:16px" onclick="HS.toast('장보기 리스트에 담았어요 (커머스 연계 지점)')">🛒 재료 장보기 리스트 담기</button>
        </div>
      </div>` },

    recipeLocked: { grp: '레시피', nm: 'R3 레시피 상세(잠금)', tab: 'recipes', html: () => `
      <div class="screen">${subbar('레시피 해제', 'recipes')}
        <div class="locked-panel">
          <div class="lk">${S.ingredients >= 5 ? '🔓' : '🔒'}</div>
          <h2>엄마의 여름 삼계탕</h2>
          <p>${S.ingredients >= 5 ? '재료를 모두 모았어요!<br>지금 바로 열어볼 수 있어요.' : `가족 미션으로 재료를 모으는 중이에요.<br><b>${5 - S.ingredients}개</b>만 더 모으면 열려요!`}</p>
          <div class="ing-track" style="justify-content:center;margin-top:20px">
            ${ING.map((e, i) => `<span class="${i < S.ingredients ? 'got' : ''}">${i < S.ingredients ? e : '❔'}</span>`).join('')}
          </div>
          <div style="padding:0 10px">
            ${S.ingredients >= 5
              ? `<button class="btn" style="margin-top:26px" onclick="HS.unlockRecipe()">레시피 열기 ✨</button>`
              : `<button class="btn" style="margin-top:26px" onclick="HS.go('home')">오늘 미션 하러 가기</button>`}
          </div>
        </div>
      </div>` },

    /* R2' — 해제 직후 상세(삼계탕). 화면 수 집계에는 R2와 동일 템플릿으로 간주 */
    recipeOpen2: { grp: '레시피', nm: 'R2 레시피 상세(삼계탕)', tab: 'recipes', hideMap: true, html: () => `
      <div class="screen">
        <div class="rec-hero"><button class="back" onclick="HS.go('recipes')">←</button>
          <img src="assets/img/recipe_samgyetang.webp" alt="삼계탕"></div>
        <div class="rec-body">
          <span class="chip orange">✨ 오늘 해제!</span>
          <h2 style="margin-top:10px">엄마의 여름 삼계탕</h2>
          <div class="rec-meta"><span class="chip gray">⏱ 70분</span><span class="chip gray">🍽 3인분</span><span class="chip green">난이도 보통</span></div>
          <h3 class="sec" style="margin:18px 0 8px">재료</h3>
          <div class="card"><ul class="ing-list">
            <li>영계 <span>3마리</span></li><li>수삼 <span>3뿌리</span></li>
            <li>대추 <span>6알</span></li><li>마늘 <span>10쪽</span></li>
            <li>찹쌀 <span>1컵</span></li></ul></div>
          <h3 class="sec" style="margin:18px 0 8px">엄마의 한마디</h3>
          <div class="card"><p style="font-size:14px;line-height:1.7">"복날마다 끓여주던 삼계탕이야.<br>이번 주말에 다 같이 모여서 끓여 먹자."</p></div>
          <button class="btn" style="margin-top:16px" onclick="HS.toast('장보기 리스트에 담았어요 (커머스 연계 지점)')">🛒 재료 장보기 리스트 담기</button>
        </div>
      </div>` },

    /* ===== 피드 (1) ===== */
    feed: { grp: '피드', nm: 'F1 가족 피드', tab: 'feed', html: () => {
      const item = (id, f, time, img, cap, reacts) => `
        <div class="feed-item">
          <div class="feed-head"><div class="avatar">${f.em}</div><div><b>${f.nm}</b><small>${time}</small></div>
            <span class="chip green" style="margin-left:auto">미션 인증 ✓</span></div>
          <img src="${img}" alt="인증 사진">
          <div class="feed-foot"><p class="cap">${cap}</p>
            <div class="react-row">${reacts.map(([e, n]) => `
              <button class="react ${S.reacts[id] && e === '🧡' ? 'on' : ''}" onclick="HS.react('${id}','${e}')">${e} ${e === '🧡' && S.reacts[id] ? n + 1 : n}</button>`).join('')}
            </div></div>
        </div>`;
      return `
      <div class="screen">${appbar('가족 피드')}
        <p style="padding:0 20px 10px;font-size:13px;color:var(--sub)">우리 가족만 보는 공간이에요 🔒</p>
        ${S.missionDone ? item('f0', FAM[0], '방금 전', 'assets/img/mission_meal.webp', '오늘 저녁! 고등어에 나물 반찬 곁들였어요 😋', [['🧡', 2], ['👏', 1], ['😋', 1]]) : ''}
        ${item('f1', FAM[1], '오후 6:10', 'assets/img/mission_meal.webp', '아빠랑 둘이 먹는 저녁. 지현이 김치 가져가라~', [['🧡', 3], ['😋', 2], ['💬', 1]])}
        ${item('f2', FAM[2], '오전 7:32', 'assets/img/mission_walk.webp', '아침 공원 한 바퀴. 4,230보 걸었다!', [['🧡', 2], ['👏', 4], ['💪', 1]])}
        ${item('f3', FAM[0], '어제', 'assets/img/hero_family.webp', '주말에 엄마랑 된장찌개 끓인 날 🍲', [['🧡', 5], ['😍', 2], ['💬', 3]])}
      </div>`; } },

    /* ===== 건강 (2) ===== */
    steps: { grp: '건강', nm: 'G1 걸음 수', tab: 'steps', html: () => `
      <div class="screen">${appbar('건강')}
        <div class="seg"><button class="on">🚶 걸음</button><button onclick="HS.go('sleep')">🌙 수면</button></div>
        <div class="steps-hero">
          <div class="big-ring">${ring(6842 / 8000, 190, 'var(--green)', '#EAF3EA')}
            <div class="val"><b>6,842</b><small>목표 8,000보 · 86%</small></div></div>
          <div class="sync-note"><span class="chip blue">HealthKit 연동됨</span><span class="chip green">삼성헬스 연동됨</span></div>
          <div class="sync-note" style="margin-top:6px">마지막 동기화 오후 8:24 · 백그라운드 자동 동기화 중</div>
        </div>
        <h3 class="sec">우리 가족 오늘 걸음</h3>
        <div class="card" style="margin:0 20px">
          ${FAM.map(f => `<div class="hbar-row"><span class="nm">${f.em} ${f.nm.replace(' (나)', '')}</span>
            <div class="bar"><i style="width:${Math.min(100, f.steps / f.goal * 100)}%;${f.steps >= f.goal ? 'background:var(--green)' : ''}"></i></div>
            <span class="v">${f.steps.toLocaleString()}보</span></div>`).join('')}
          <p style="font-size:11.5px;color:var(--sub);margin-top:10px">엄마가 목표를 달성했어요! 👏 응원 이모지가 자동 전송됩니다.</p>
        </div>
        <h3 class="sec">주간 추이</h3>
        <div class="card" style="margin:0 20px">
          <div class="week-chart">
            ${[62, 78, 55, 90, 71, 84, 86].map((v, i) => `<div class="col ${i === 6 ? 'today' : ''}"><i style="height:${v}%;background:${i === 6 ? '' : ''}"></i><span>${'일월화수목금토'[i]}</span></div>`).join('')}
          </div>
        </div>
      </div>` },

    sleep: { grp: '건강', nm: 'G2 수면 리포트', tab: 'steps', html: () => `
      <div class="screen">${appbar('건강')}
        <div class="seg"><button onclick="HS.go('steps')">🚶 걸음</button><button class="on">🌙 수면</button></div>
        <div class="sleep-hero"><img src="assets/img/sleep_night.webp" alt="수면">
          <div class="ov"><div class="sc">82<small> 점</small></div>
            <p>7시간 12분 · 어젯밤 수면 <span class="chip" style="background:rgba(255,255,255,.2);color:#fff;margin-left:4px">에이슬립 측정</span></p></div></div>
        <div class="pad"><div class="card">
          <b style="font-size:14.5px">수면 단계</b>
          <div class="stage-bar">
            <i style="width:8%;background:#E8A6A6" title="깸"></i><i style="width:22%;background:#9DB8ED" title="렘"></i>
            <i style="width:48%;background:#5D82D6" title="얕은잠"></i><i style="width:22%;background:#2E4C9E" title="깊은잠"></i></div>
          <div class="stage-leg">
            <span><i style="background:#E8A6A6"></i>깸 32분</span><span><i style="background:#9DB8ED"></i>렘 1시간 35분</span>
            <span><i style="background:#5D82D6"></i>얕은잠 3시간 27분</span><span><i style="background:#2E4C9E"></i>깊은잠 1시간 38분</span></div>
        </div>
        <div class="card"><b style="font-size:14.5px">주간 수면 시간</b>
          <div class="week-chart">
            ${[68, 75, 60, 82, 71, 88, 80].map((v, i) => `<div class="col"><i style="height:${v}%"></i><span>${'일월화수목금토'[i]}</span></div>`).join('')}
          </div></div>
        <div class="card"><b style="font-size:14.5px">가족 수면 점수</b>
          ${FAM.map(f => `<div class="hbar-row"><span class="nm">${f.em} ${f.nm.replace(' (나)', '')}</span>
            <div class="bar"><i style="width:${f.sleep}%;background:var(--blue)"></i></div><span class="v">${f.sleep}점</span></div>`).join('')}
          <p style="font-size:11.5px;color:var(--sub);margin-top:8px">아빠의 수면 점수가 낮아요. 오늘 미션에 '일찍 잠들기'를 제안해 보세요.</p></div>
        <div class="card" style="background:#F4F7FE"><b style="font-size:13px">ℹ️ 에이슬립(A-sleep) SDK</b>
          <p style="font-size:12px;color:var(--sub);margin-top:5px;line-height:1.6">스마트폰 마이크의 호흡음만으로 수면 단계를 분석합니다. 측정 시작/종료, 리포트 수신 화면을 SDK 연동으로 구현합니다.</p></div>
        </div>
      </div>` },

    /* ===== 랭킹 (2) ===== */
    rankFamily: { grp: '랭킹', nm: 'K1 우리 가족 랭킹', tab: 'rankFamily', html: () => `
      <div class="screen">${appbar('랭킹')}
        <div class="seg"><button class="on">우리 가족</button><button onclick="HS.go('rankAll')">전체 랭킹</button></div>
        <div class="rank-hero"><span class="tr">🏆</span>
          <div><b>이번 주 우리 집 MVP는 엄마!</b><small>미션 7/7 · 52,340보 · 수면 평균 76점</small></div></div>
        <h3 class="sec">주간 포인트</h3>
        <div class="card" style="margin:0 20px">
          ${[[FAM[1], '미션 7/7 · 걸음 1위', 1240, 1], [FAM[0], '미션 6/7 · 수면 1위', 1105, 2], [FAM[2], '미션 5/7', 890, 3]]
            .map(([f, d, pt, no]) => `<div class="rank-item"><span class="no ${no === 1 ? 'top' : ''}">${no === 1 ? '👑' : no}</span>
              <div class="avatar big">${f.em}</div>
              <div class="inf"><b>${f.nm}</b><small>${d}</small></div><span class="pt">${pt.toLocaleString()}P</span></div>`).join('')}
        </div>
        <div class="pad"><div class="card" style="background:#FFF9EE"><b style="font-size:13.5px">💡 가족 내 랭킹의 역할</b>
          <p style="font-size:12.5px;color:var(--sub);margin-top:6px;line-height:1.6">경쟁보다 <b>대화 소재</b>가 목적 — "아빠 이번 주 꼴찌예요~" 한마디가 전화 한 통이 됩니다.</p></div></div>
      </div>` },

    rankAll: { grp: '랭킹', nm: 'K2 전체 가족 랭킹', tab: 'rankFamily', html: () => `
      <div class="screen">${appbar('랭킹')}
        <div class="seg"><button onclick="HS.go('rankFamily')">우리 가족</button><button class="on">전체 랭킹</button></div>
        <p style="padding:8px 20px 0;font-size:13px;color:var(--sub)">이번 주 전국 가족들의 연속 달성 랭킹 🔥</p>
        <div class="pad"><div class="card">
          ${[['🥇', '햇살가득 이씨네', '4인 가족 · 서울', '31일 연속', false], ['🥈', '부산 콩국수집', '3인 가족 · 부산', '27일 연속', false], ['🥉', '삼남매와부모님', '5인 가족 · 대전', '21일 연속', false], ['14', '김씨네 부엌 (우리)', '3인 가족 · 서울/청주', '12일 연속', true], ['15', '웃음꽃 정원', '4인 가족 · 인천', '11일 연속', false]]
            .map(([no, nm, d, st, me]) => `<div class="rank-item ${me ? 'me' : ''}">
              <span class="no ${no.length > 2 ? 'top' : ''}" style="font-size:${no.length > 2 ? '20px' : '15px'}">${no}</span>
              <div class="inf"><b>${nm}</b><small>${d}</small></div>
              <span class="pt">🔥 ${st}</span></div>`).join('')}
        </div>
        <div class="card" style="background:#FFF9EE"><b style="font-size:13.5px">💡 익명성 배려</b>
          <p style="font-size:12.5px;color:var(--sub);margin-top:6px;line-height:1.6">가족 별명만 노출하고 실명·사진은 비공개 — 시니어 세대의 개인정보 우려를 낮춥니다.</p></div></div>
      </div>` },

    /* ===== 설정 (5) ===== */
    settings: { grp: '설정', nm: 'S1 설정 홈', tab: false, html: () => `
      <div class="screen no-tab">${subbar('설정', 'home')}
        <div class="profile-band"><div class="avatar big">👩🏻</div>
          <div style="flex:1"><b>김지현</b><small>카카오 계정 · PASS 인증 완료 ✓</small></div>
          <span class="chip orange">딸</span></div>
        <div class="set-list">
          <button class="set-item" onclick="HS.go('famManage')"><span class="ic" style="background:var(--brand-soft)">👨‍👩‍👧</span><span class="tx">가족 관리<small>김씨네 부엌 · 3명</small></span><span class="arr">›</span></button>
          <button class="set-item" onclick="HS.go('notif')"><span class="ic" style="background:#FFF3E3">🔔</span><span class="tx">알림 설정</span><span class="arr">›</span></button>
          <button class="set-item" onclick="HS.go('integrations')"><span class="ic" style="background:var(--green-soft)">🔗</span><span class="tx">연동 관리<small>HealthKit · 삼성헬스 · 에이슬립</small></span><span class="arr">›</span></button>
          <button class="set-item" onclick="HS.go('account')"><span class="ic" style="background:#F1EAE3">👤</span><span class="tx">계정 및 약관</span><span class="arr">›</span></button>
        </div>
        <p style="text-align:center;font-size:11.5px;color:#C9BBAD;margin-top:16px">한상 v1.0.0 (데모) · 문의 help@hansang.app</p>
      </div>` },

    famManage: { grp: '설정', nm: 'S2 가족 관리', tab: false, html: () => `
      <div class="screen no-tab">${subbar('가족 관리', 'settings')}
        <div class="pad"><div class="card">
          <b style="font-size:15px">김씨네 부엌 · 3명</b>
          ${[[FAM[0], '그룹장 · 나'], [FAM[1], '2026.06.12 합류'], [FAM[2], '2026.06.14 합류']]
            .map(([f, d]) => `<div class="mem-row"><div class="avatar big">${f.em}</div>
              <div style="flex:1"><b>${f.nm}</b><small>${f.role} · ${d}</small></div></div>`).join('')}
          <div class="invite-code-band"><b>HAN 287</b><small>초대 코드 · 7일간 유효</small></div>
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn sm" style="flex:1" onclick="HS.toast('카카오톡 공유 시트 (데모)')">💬 카카오톡 초대</button>
            <button class="btn sm ghost" style="flex:1" onclick="HS.toast('초대 코드가 복사되었어요')">코드 복사</button></div>
        </div>
        <div class="card" style="background:#FFF9EE"><b style="font-size:13.5px">💡 자녀 주도 온보딩</b>
          <p style="font-size:12.5px;color:var(--sub);margin-top:6px;line-height:1.6">부모님은 카톡 초대 링크 탭 → 카카오 로그인이면 합류 끝.<br>시니어 이탈을 최소화하는 핵심 설계입니다. (제안 포인트)</p></div></div>
      </div>` },

    notif: { grp: '설정', nm: 'S3 알림 설정', tab: false, html: () => {
      const tg = (k, label, sub, bg, ic) => `
        <div class="set-item" style="cursor:default"><span class="ic" style="background:${bg}">${ic}</span>
          <span class="tx">${label}${sub ? `<small>${sub}</small>` : ''}</span>
          <button class="toggle ${S.tg[k] ? 'on' : ''}" onclick="HS.tg('${k}')" aria-label="${label}"></button></div>`;
      return `
      <div class="screen no-tab">${subbar('알림 설정', 'settings')}
        <div class="set-list" style="margin-top:14px">
          ${tg('push', '푸시 알림 (전체)', '핑거푸시 기기 등록됨 · 토큰 ****3f2a', '#FFF3E3', '🔔')}
          ${tg('morning', '아침 미션 알림', '오전 9:00 · 오늘의 미션 안내', 'var(--brand-soft)', '☀️')}
          ${tg('night', '저녁 리마인드', '오후 8:00 · 미완료 시에만', 'var(--blue-soft)', '🌙')}
          ${tg('marketing', '이벤트·혜택 알림', '시즌 레시피, 제휴 소식', '#F1EAE3', '🎁')}
        </div>
        <div class="pad"><div class="card" style="background:#F4F7FE"><b style="font-size:13px">ℹ️ 푸시 구현 메모</b>
          <p style="font-size:12px;color:var(--sub);margin-top:5px;line-height:1.6">핑거푸시 SDK로 토큰 발급·기기 등록, 수신/탭 이벤트 → 딥링크 라우팅(hansang://mission 등), 로그아웃 시 기기 해제. 솔루션 교체 가능성에 대비해 어댑터 패턴으로 추상화합니다.</p></div></div>
      </div>`; } },

    integrations: { grp: '설정', nm: 'S4 연동 관리', tab: false, html: () => `
      <div class="screen no-tab">${subbar('연동 관리', 'settings')}
        <div class="set-list" style="margin-top:14px">
          <div class="set-item" style="cursor:default"><span class="ic" style="background:var(--green-soft)">🚶</span>
            <span class="tx">Apple HealthKit<small>걸음 수 · 마지막 동기화 오후 8:24</small></span>
            <button class="toggle ${S.tg.health ? 'on' : ''}" onclick="HS.tg('health')"></button></div>
          <div class="set-item" style="cursor:default"><span class="ic" style="background:var(--green-soft)">💚</span>
            <span class="tx">삼성헬스 (Health Connect)<small>Android 기기에서 사용</small></span>
            <button class="toggle on" onclick="HS.toast('데모에서는 항상 연결 상태입니다')"></button></div>
          <div class="set-item" style="cursor:default"><span class="ic" style="background:var(--blue-soft)">🌙</span>
            <span class="tx">에이슬립 수면 측정<small>취침 시 자동 측정 · 마이크 사용</small></span>
            <button class="toggle ${S.tg.sleep ? 'on' : ''}" onclick="HS.tg('sleep')"></button></div>
          <div class="set-item" style="cursor:default"><span class="ic" style="background:#FEE500">💬</span>
            <span class="tx">카카오 계정<small>로그인 · 초대 공유에 사용</small></span>
            <span class="chip green">연결됨</span></div>
        </div>
        <div class="pad"><div class="card" style="background:#F4F7FE"><b style="font-size:13px">ℹ️ 동기화 신뢰성 설계</b>
          <p style="font-size:12px;color:var(--sub);margin-top:5px;line-height:1.6">백그라운드↔포그라운드 전환 시 누락 방지, 기기 교체·미접속 기간 보정, iOS/Android 측정치 차이 정책(서버 기준 시각·중복 제거)을 포함합니다. (제안 포인트)</p></div></div>
      </div>` },

    account: { grp: '설정', nm: 'S5 계정·약관', tab: false, html: () => `
      <div class="screen no-tab">${subbar('계정 및 약관', 'settings')}
        <div class="set-list" style="margin-top:14px">
          <button class="set-item" onclick="HS.toast('약관 웹뷰 (데모)')"><span class="tx">서비스 이용약관</span><span class="arr">›</span></button>
          <button class="set-item" onclick="HS.toast('약관 웹뷰 (데모)')"><span class="tx">개인정보 처리방침</span><span class="arr">›</span></button>
          <button class="set-item" onclick="HS.toast('약관 웹뷰 (데모)')"><span class="tx">건강정보 수집·이용 동의 내역</span><span class="arr">›</span></button>
          <button class="set-item" onclick="HS.toast('로그아웃 — 푸시 기기 등록 해제 처리 (데모)')"><span class="tx">로그아웃</span><span class="arr">›</span></button>
          <button class="set-item danger" onclick="HS.toast('계정 삭제 플로우 (App Store 심사 필수 기능)')"><span class="tx">계정 삭제</span><span class="arr">›</span></button>
        </div>
        <div class="pad"><div class="card" style="background:#FFF9EE"><b style="font-size:13.5px">💡 심사 대응 포인트</b>
          <p style="font-size:12.5px;color:var(--sub);margin-top:6px;line-height:1.6">앱 내 <b>계정 삭제</b>는 App Store 필수 요건(5.1.1(v))입니다. 건강·마이크 권한 목적 문구, 심사용 데모 계정과 함께 사전 체크리스트로 관리합니다.</p></div></div>
      </div>` }
  };

  /* ---------- 라우터 ---------- */
  let current = null;
  function go(id) {
    const sc = SCREENS[id];
    if (!sc) return;
    current = id;
    root.innerHTML = sc.html();
    // 탭바 표시/활성
    if (sc.tab) {
      tabbar.classList.remove('hidden');
      tabbar.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.tab === sc.tab));
    } else tabbar.classList.add('hidden');
    root.querySelector('.screen').scrollTop = 0;
  }

  /* ---------- 인터랙션 ---------- */
  const HS = {
    go, toast,
    finishOnb() { S.onboarded = true; save(); go('home'); toast('김씨네 부엌에 오신 걸 환영해요! 🎉'); },
    shoot() {
      const cam = $('#cam'); if (!cam) return;
      cam.classList.add('shot');
      $('#cam-guide').style.display = 'none';
      $('#submit-btn').disabled = false;
      toast('찰칵! 📸');
    },
    submitMission() {
      S.missionDone = true;
      // 데모 연출: 내가 마지막 주자 → 아빠도 방금 완료 처리 → 전원 달성
      S.dadDone = true;
      S.ingredients = 5;
      save();
      go('reward');
    },
    unlockRecipe() {
      if (S.ingredients < 5) return;
      S.unlocked = true; save();
      go('recipeOpen2'); toast('🎉 엄마의 여름 삼계탕이 열렸어요!');
    },
    nudge() {
      S.nudged = true; save(); go(current);
      toast('아빠에게 응원 푸시를 보냈어요 💌');
    },
    react(id, e) {
      if (e !== '🧡') { toast(`${e} 반응을 남겼어요`); return; }
      S.reacts[id] = !S.reacts[id]; save(); go('feed');
    },
    tg(k) { S.tg[k] = !S.tg[k]; save(); go(current); },
    toggleMap() {
      const m = document.getElementById('screen-map');
      if (m.classList.contains('hidden')) { renderMap(); m.classList.remove('hidden'); }
      else m.classList.add('hidden');
    },
    resetDemo() { localStorage.removeItem('hs_demo'); location.reload(); }
  };
  window.HS = HS;

  function renderMap() {
    const groups = {};
    Object.entries(SCREENS).forEach(([id, sc]) => {
      if (sc.hideMap) return;
      (groups[sc.grp] = groups[sc.grp] || []).push([id, sc.nm]);
    });
    const CNT = { '온보딩': 5, '홈·미션': 6, '레시피': 3, '피드': 1, '건강': 2, '랭킹': 2, '설정': 5 };
    document.getElementById('map-list').innerHTML = Object.entries(groups).map(([g, items]) => `
      <div class="map-group"><b>${g} (${CNT[g]}화면)</b>
        <div class="items">${items.map(([id, nm]) => `<button onclick="HS.go('${id}');HS.toggleMap()">${nm}</button>`).join('')}</div>
      </div>`).join('');
  }

  /* ---------- 시계 & 시작 ---------- */
  const tick = () => {
    const d = new Date();
    document.getElementById('sb-time').textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  tick(); setInterval(tick, 30000);

  go(S.onboarded ? 'home' : 'onb1');
})();
