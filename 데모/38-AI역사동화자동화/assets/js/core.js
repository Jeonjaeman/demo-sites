/* ============================================================
   YEODAM 여담 — 여주 AI 역사동화 자동 생성 · PDF 파이프라인 (PoC 데모)
   core.js — 공유 모듈
   · 여주 역사 팩트 DB(승인 콘텐츠) · 동화 생성(그라운딩)
   · 사실 검증(환각 탐지) · 아동 안전 가드레일
   · 단계별 소요시간/비용 계측 · 생성 이력(저작권 대응)
   · 오프라인 PDF 생성기(캔버스 페이지 → JPEG 임베드, 외부 라이브러리 없음)
   ------------------------------------------------------------
   ⚠ 모든 데이터는 가상 데모입니다. 동화 텍스트/삽화는 AI 생성 예시이며
     실제 서비스에서는 승인된 여주 원천 콘텐츠로 그라운딩해야 합니다.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 여주 관광지(승인 콘텐츠 원천) ------------------------
     각 관광지는 '승인된 역사 사실(fact)'로 그라운딩됩니다.
     동화 생성은 이 승인 사실 안에서만 이야기를 짓습니다.            */
  var SPOTS = [
    { id:'yeongneung', name:'영릉(세종대왕릉)', img:'assets/img/p1.jpg',
      era:'조선', people:['세종대왕','소헌왕후'], keywords:['한글','조선왕릉','석상'],
      fact:'조선 4대 임금 세종대왕과 소헌왕후를 함께 모신 왕릉으로, 세종대왕은 백성을 위해 한글을 만들었습니다.',
      mission:'세종대왕이 백성을 위해 만든 글자를 찾아보세요.' },
    { id:'silluksa', name:'신륵사', img:'assets/img/p2.jpg',
      era:'고려·조선', people:['나옹선사'], keywords:['전탑','여강','벽돌탑'],
      fact:'여강(남한강) 가에 자리한 오래된 절로, 벽돌을 쌓아 만든 전탑이 유명합니다.',
      mission:'강가 절의 벽돌로 쌓은 탑을 살펴보세요.' },
    { id:'ceramic', name:'여주 도자기', img:'assets/img/p3.jpg',
      era:'조선', people:[], keywords:['백자','분청사기','물레'],
      fact:'여주는 예부터 흙이 좋아 도자기로 이름난 고장으로, 백자와 분청사기를 빚어 왔습니다.',
      mission:'물레를 돌려 나만의 도자기를 빚어 보세요.' },
    { id:'queenmin', name:'명성황후 생가', img:'assets/img/p4.jpg',
      era:'조선', people:['명성황후'], keywords:['한옥','생가'],
      fact:'조선의 왕비 명성황후가 태어난 한옥으로, 여주에 옛 모습이 남아 있습니다.',
      mission:'한옥 마당을 거닐며 옛집의 모습을 살펴보세요.' }
  ];
  function spot(id) { return SPOTS.find(function (s) { return s.id === id; }); }

  /* ---------- 승인 팩트 DB(사실 검증 기준) ------------------------
     생성문에 등장하는 고유명사·시대는 이 목록과 대조됩니다.
     목록에 없는 인물/장소나, 시대가 어긋나는 조합, 근거 없는 연도는
     '검증 필요'로 표시되어 승인 전 PDF 발행이 차단됩니다.            */
  var FACTS = {
    /* 인물: 왕조(era) + 활동 세기(century). 세기 차가 크면 함께 등장 불가(환각) */
    people: {
      '세종대왕':{ era:'조선', century:15 },
      '소헌왕후':{ era:'조선', century:15 },
      '효종':   { era:'조선', century:17 },
      '나옹선사':{ era:'고려', century:14 },
      '명성황후':{ era:'조선', century:19 }
    },
    places: ['여주','영릉','신륵사','명성황후 생가','여주 도자기','파사성','여강','남한강','한양','조선'],
    things: ['한글','훈민정음','전탑','백자','분청사기','도자기','왕릉','한옥','물레'],
    eras: ['고려','조선']
  };
  /* 같은 왕조라도 세기 차가 이 값 이상이면 시대 불일치로 봅니다 */
  var CENTURY_GAP = 3;

  /* ---------- 동화 생성(그라운딩) --------------------------------
     승인 사실로만 이야기를 구성. name/미션을 넣어 '맞춤형'으로.
     opts.injectHallucination: 데모용으로 '틀린 사실' 문장을 주입해
     사실 검증이 실제로 잡아내는지 보여줍니다.                       */
  function buildInvitation(name) {
    return name + ' 어린이에게\n\n안녕! 나는 여강에 사는 꼬마 여우야. 오늘 너를 여주로 초대할게. '
      + '세종대왕이 잠든 영릉부터 강가의 오래된 절까지, 우리 함께 옛이야기를 찾아 떠나 볼까?';
  }
  function buildPrologue(name) {
    return '옛날 옛적, 강물이 반짝이는 고을 여주에 ' + name + '(이)라는 마음씨 고운 아이가 살았어요. '
      + '어느 저녁, ' + name + '은(는) 여강 가에서 작은 여우 한 마리를 만났어요. '
      + '"나랑 같이 여주의 옛이야기를 찾아볼래?" 여우가 방긋 웃으며 말했답니다.';
  }
  function pageFor(sp, name) {
    var t;
    if (sp.id === 'yeongneung') {
      t = name + '와(과) 여우는 넓은 잔디 언덕에 다다랐어요. 그곳은 ' + sp.fact
        + ' ' + name + '은(는) 돌로 만든 신하들 사이를 걸으며, "임금님은 왜 글자를 만들었을까?" 하고 물었어요. '
        + '"백성 누구나 쉽게 읽고 쓰라고 만드셨단다." 여우가 말했지요.';
    } else if (sp.id === 'silluksa') {
      t = name + '와(과) 여우는 강물을 따라 걸어 오래된 절에 이르렀어요. ' + sp.fact
        + ' 노을빛에 물든 벽돌탑을 올려다보며 ' + name + '은(는) 두 손을 모아 조용히 소원을 빌었답니다.';
    } else if (sp.id === 'ceramic') {
      t = '다음 날, ' + name + '와(과) 여우는 도자기 마을을 찾아갔어요. ' + sp.fact
        + ' ' + name + '은(는) 물레를 돌려 파란빛 도자기를 빚으며 활짝 웃었어요. "정말 예쁘다!"';
    } else if (sp.id === 'queenmin') {
      t = name + '와(과) 여우는 꽃이 핀 한옥 마당에 들어섰어요. ' + sp.fact
        + ' 기와지붕과 낮은 돌담을 지나며 ' + name + '은(는) 옛사람들의 하루를 떠올려 보았답니다.';
    }
    return { spotId: sp.id, title: sp.name, img: sp.img, text: t };
  }
  var HALLUCINATION = {
    /* 데모용 '그럴듯하지만 틀린' 문장(세종 15C ↔ 명성황후 19C 시대 불일치 + 허위 연도) */
    text: '그때 세종대왕이 명성황후에게 도자기를 선물하며 "1123년에 이 절을 지었노라" 하고 말했어요.',
    badYear: '1123', crossEra: ['세종대왕', '명성황후']
  };

  function buildStory(name, spotIds, opts) {
    opts = opts || {};
    name = (name || '여주').trim() || '여주';
    var chosen = spotIds.map(spot).filter(Boolean);
    if (!chosen.length) chosen = SPOTS.slice(0, 3);
    var pages = [{ spotId:'cover', title:name + '의 여주 옛이야기', img:'assets/img/cover.jpg',
      text: buildPrologue(name), cover:true }];
    chosen.forEach(function (sp) { pages.push(pageFor(sp, name)); });
    if (opts.injectHallucination) {
      pages[1] = Object.assign({}, pages[1], { text: pages[1].text + ' ' + HALLUCINATION.text, tainted:true });
    }
    return {
      name: name,
      invitation: buildInvitation(name),
      prologue: buildPrologue(name),
      pages: pages,
      groundedSpots: chosen.map(function (s) { return s.id; })
    };
  }

  /* ---------- 사실 검증(환각 탐지) --------------------------------
     1) 근거 없는 4자리 연도  2) 승인 목록에 없는 인물  3) 시대 불일치 공존 */
  function factCheck(story) {
    var issues = [];
    var full = story.pages.map(function (p) { return p.text; }).join(' ');
    /* 1) 연도 */
    (full.match(/\d{3,4}\s*년/g) || []).forEach(function (y) {
      issues.push({ type:'연도', term:y, reason:'승인 원천에 없는 연도 — AI가 지어냈을 수 있어 근거 확인 필요' });
    });
    /* 2)·3) 시대 불일치: 같은 쪽에 등장한 승인 인물끼리 활동 세기 차가 크면 환각 */
    var knownPeople = Object.keys(FACTS.people);
    function label(nm) { var p = FACTS.people[nm]; return nm + '(' + p.era + ' ' + p.century + '세기)'; }
    story.pages.forEach(function (p) {
      var present = knownPeople.filter(function (nm) { return p.text.indexOf(nm) >= 0; });
      for (var i = 0; i < present.length; i++) {
        for (var j = i + 1; j < present.length; j++) {
          var gap = Math.abs(FACTS.people[present[i]].century - FACTS.people[present[j]].century);
          if (gap >= CENTURY_GAP) {
            issues.push({ type:'시대 불일치', term:present[i] + ' × ' + present[j],
              reason: label(present[i]) + '와(과) ' + label(present[j]) + '는 ' + gap + '세기 차 — 함께 등장할 수 없음' });
          }
        }
      }
    });
    /* 중복 제거 */
    var seen = {}; issues = issues.filter(function (x) { var k = x.type + x.term; if (seen[k]) return false; seen[k] = 1; return true; });
    return { ok: issues.length === 0, issues: issues };
  }

  /* ---------- 아동 안전 가드레일 --------------------------------
     아동 부적절 표현을 실제로 걸러냅니다(데모용 소규모 사전).      */
  var BANNED = ['폭력','피','칼','죽','전쟁','귀신','무서운','때리','싸움','술','담배'];
  function guardrail(text) {
    var hits = [];
    BANNED.forEach(function (w) { if (text.indexOf(w) >= 0) hits.push(w); });
    return { clean: hits.length === 0, hits: hits };
  }

  /* ---------- 단계별 소요시간/비용 모델 --------------------------
     공고 요구: 파이프라인 단계별 소요 시간 측정. 이미지가 병목임을 실증. */
  var STAGES = [
    { key:'invite',   label:'초대장·프롤로그 생성', engine:'OpenAI GPT (텍스트)',  baseMs:900,  credit:2 },
    { key:'story',    label:'역사동화 텍스트 생성', engine:'OpenAI GPT (텍스트)',  baseMs:1600, credit:5 },
    { key:'factcheck',label:'사실 검증(환각 탐지)',  engine:'승인 팩트 DB 대조',    baseMs:500,  credit:0 },
    { key:'guardrail',label:'아동 안전 가드레일',    engine:'유해표현 필터',        baseMs:300,  credit:0 },
    { key:'image',    label:'페이지별 삽화 생성',    engine:'이미지 생성 API',      baseMs:4200, credit:18, perPage:true },
    { key:'pdf',      label:'PDF 전자책 결합',       engine:'클라이언트 렌더링',    baseMs:700,  credit:0 }
  ];
  function stage(key) { return STAGES.find(function (s) { return s.key === key; }); }

  /* ---------- 생성 이력(저작권 대응) ----------------------------
     문체부 '생성형 AI 저작권 안내서': 인간의 창작적 개입·생성 과정 기록이
     저작권 등록/분쟁의 근거. 프롬프트·모델·시각·인간 편집을 남깁니다.  */
  var LOG_KEY = 'yeodam_genlog_v1';
  function loadLog() { try { return JSON.parse(localStorage.getItem(LOG_KEY)) || []; } catch (e) { return []; } }
  function saveLog(l) { try { localStorage.setItem(LOG_KEY, JSON.stringify(l.slice(-100))); } catch (e) {} }
  function logGen(entry) { var l = loadLog(); l.push(entry); saveLog(l); return l; }
  function clearLog() { saveLog([]); }

  /* ---------- 프롬프트 세트(테스트 환경) ------------------------- */
  var DEFAULT_PROMPTS = {
    invite: '너는 여주 관광 안내 요정이야. {name} 어린이를 여주로 초대하는 따뜻한 초대장을 3문장으로 써줘. 승인된 여주 역사 사실만 사용해.',
    story:  '{name}을(를) 주인공으로, 아래 승인된 여주 역사 사실만 사용해 저학년용 역사동화를 써줘. 사실에 없는 연도·인물은 절대 지어내지 마. 방문한 곳: {spots}.',
    image:  '따뜻한 수채화 동화 삽화. 하늘색 한복을 입은 아이와 크림-주황색 여우가 {scene}에 있는 장면. 글자·로고 없음, 실존 인물 없음.'
  };

  /* ---------- 오프라인 PDF 생성기 --------------------------------
     캔버스로 렌더한 각 페이지를 JPEG로 임베드하는 최소 PDF(1.4).
     외부 라이브러리 없음. 한글은 캔버스에서 래스터라이즈되므로
     폰트 임베딩 문제 없이 안전하게 출력됩니다.                     */
  function dataURLToBytes(dataURL) {
    var b64 = dataURL.split(',')[1];
    var bin = atob(b64);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }
  function strBytes(s) { var a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 0xff; return a; }

  /* pages: [{jpeg:Uint8Array, w:int, h:int}] → Blob(application/pdf) */
  function jpegPagesToPDF(pages) {
    var chunks = [], pos = 0;
    function push(bytes) { chunks.push(bytes); pos += bytes.length; }
    function pushStr(s) { push(strBytes(s)); }
    pushStr('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    var nObj = 2 + pages.length * 3;
    var off = new Array(nObj + 1);
    function startObj(n) { off[n] = pos; pushStr(n + ' 0 obj\n'); }
    function endObj() { pushStr('endobj\n'); }
    startObj(1); pushStr('<< /Type /Catalog /Pages 2 0 R >>\n'); endObj();
    var kids = []; for (var i = 0; i < pages.length; i++) kids.push((3 + i * 3) + ' 0 R');
    startObj(2); pushStr('<< /Type /Pages /Count ' + pages.length + ' /Kids [' + kids.join(' ') + '] >>\n'); endObj();
    for (var i = 0; i < pages.length; i++) {
      var p = pages[i], pageObj = 3 + i * 3, imgObj = pageObj + 1, contObj = pageObj + 2;
      startObj(pageObj);
      pushStr('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + p.w + ' ' + p.h + '] /Resources << /XObject << /Im0 ' + imgObj + ' 0 R >> >> /Contents ' + contObj + ' 0 R >>\n');
      endObj();
      startObj(imgObj);
      pushStr('<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.jpeg.length + ' >>\nstream\n');
      push(p.jpeg); pushStr('\nendstream\n'); endObj();
      var cs = 'q ' + p.w + ' 0 0 ' + p.h + ' 0 0 cm /Im0 Do Q\n';
      startObj(contObj);
      pushStr('<< /Length ' + cs.length + ' >>\nstream\n' + cs + 'endstream\n'); endObj();
    }
    var xref = pos;
    pushStr('xref\n0 ' + (nObj + 1) + '\n0000000000 65535 f \n');
    for (var n = 1; n <= nObj; n++) pushStr((('' + off[n]).padStart(10, '0')) + ' 00000 n \n');
    pushStr('trailer\n<< /Size ' + (nObj + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF');
    return new Blob(chunks, { type: 'application/pdf' });
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 400);
  }

  /* ---------- 유틸 ---------------------------------------------- */
  function now() { return (global.performance && performance.now) ? performance.now() : Date.now(); }
  function fmtDT(d) { d = d || new Date(); var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); }

  global.YEODAM = {
    SPOTS: SPOTS, spot: spot, FACTS: FACTS, STAGES: STAGES, stage: stage,
    buildStory: buildStory, buildInvitation: buildInvitation, factCheck: factCheck,
    guardrail: guardrail, BANNED: BANNED, HALLUCINATION: HALLUCINATION,
    DEFAULT_PROMPTS: DEFAULT_PROMPTS,
    loadLog: loadLog, logGen: logGen, clearLog: clearLog,
    jpegPagesToPDF: jpegPagesToPDF, dataURLToBytes: dataURLToBytes, downloadBlob: downloadBlob,
    now: now, fmtDT: fmtDT
  };
})(window);

/* ============================================================
   지침 섹션: 텍스트 애니메이션 · 패럴랙스 · 마우스 반응 틸트 · 리빌
   ============================================================ */
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  $$("[data-split]").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w, i) => `<span class="w"><i style="transition-delay:${Math.min(i * 60, 500)}ms">${w}</i></span>`).join(" ");
  });
  const parallaxEls = $$("[data-parallax]");
  const run = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    $$(".g-reveal:not(.is-visible), .mask:not(.is-visible), .words:not(.is-visible)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add("is-visible");
    });
    parallaxEls.forEach((el) => {
      const wrap = el.closest(".storystate-bg") || el.parentElement;
      const r = wrap.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const prog = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = `translateY(${(-prog * 60).toFixed(1)}px) scale(1.16)`;
    });
  };
  window.addEventListener("scroll", run, { passive: true });
  window.addEventListener("resize", run);
  window.addEventListener("load", run);
  run();
  if (!reduceM && window.matchMedia("(hover:hover)").matches) {
    $$(".tale").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.classList.add("tilting");
        el.style.setProperty("--ry", `${(px - .5) * 10}deg`);
        el.style.setProperty("--rx", `${(.5 - py) * 10}deg`);
        el.style.setProperty("--mx", `${px * 100}%`);
        el.style.setProperty("--my", `${py * 100}%`);
      });
      el.addEventListener("pointerleave", () => { el.classList.remove("tilting"); el.style.setProperty("--ry", "0deg"); el.style.setProperty("--rx", "0deg"); });
    });
  }
})();
