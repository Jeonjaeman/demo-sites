/* MURO 무로 — 공개 갤러리 로직. 외부 라이브러리 0. IG 실측 규칙 이식. */
(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const { WORKS, LAYOUT, ARTISTS, ARCHIVE, ROOMS, LIGHTS, CONFIG } = MURO;
let toastT; function toast(m){ const t=$("#toast"); t.textContent=m; t.classList.add("show");
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),2600); }

/* 액자 종류 → 클래스 */
function frameClass(w){
  if(w.framed.includes("골드")) return "f-gold";
  if(w.framed.includes("플로팅")) return "f-float";
  if(w.framed.includes("없음")) return "f-none";
  return "f-wood";
}
const workById = id => WORKS.find(w=>w.id===id);
const workBySlug = s => WORKS.find(w=>w.slug===s);

/* ── 갤러리 스트림 렌더 (지그재그 토큰) ── */
function renderStream(){
  const visible = LAYOUT.filter(L => { const w=workById(L.id); return w.status!=="hidden" && w.status!=="sold_arch"; });
  $("#stream").innerHTML = visible.map((L,i)=>{
    const w=workById(L.id), a=ARTISTS[w.artist];
    const sold = w.status==="sold_open";
    const eager = i===0;
    return `<article class="piece ${sold?"is-sold":""}" data-piece="${w.id}">
      <div class="g">
        <div class="piece-art rv" style="grid-column:${L.p} / span ${L.w}">
          <figure class="frame ${frameClass(w)}" data-open="${w.slug}" aria-label="${w.title} 자세히 보기">
            <div class="frame-in">
              <img src="assets/img/${w.img}.webp" alt="${a.name}, ${w.title}, ${w.year}"
                   ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async">
            </div>
            ${sold?'<span class="sold-dot" title="판매 완료"></span>':""}
          </figure>
        </div>
        <div class="piece-cap y-${L.capY} rv" style="grid-column:${L.cap} / span 3">
          <p class="cap-no tnum">${String(i+1).padStart(2,"0")} / ${String(visible.length).padStart(2,"0")}</p>
          <p class="cap-artist link" data-artist="${a.id}" title="${a.name} 작가 페이지">${a.name}</p>
          <h3 class="cap-title">《${w.title}》</h3>
          <p class="cap-meta">${w.year} · ${w.medium}<br>${w.w}×${w.h}cm (${w.ho}호) · ${w.framed}</p>
          <p class="cap-story">${w.story.note.split(". ")[0]}.</p>
          <p class="cap-price"><b>${MX.priceLabel(w)}</b>${w.status==="hold"?'<span class="st">예약 중</span>':""}
            ${w.status==="sale"?`<span class="st">렌탈 월 ${MX.fmt(MX.rental(w))}원</span>`:""}</p>
          <div class="cap-cta">
            <button class="btn sm pri" data-open="${w.slug}">작품 이야기</button>
            ${w.status==="sale"?`<button class="btn sm" data-inq="${w.id}">구매 문의</button>`:""}
          </div>
        </div>
      </div>
    </article>`;
  }).join("");
  /* LQIP 해제 */
  $$("#stream img").forEach(img=>{
    if(img.complete && img.naturalWidth) img.classList.add("ld");
    else img.addEventListener("load",()=>img.classList.add("ld"),{once:true});
  });
  observeReveal();
}

/* ── 아카이브 (지나간 작품 10점) ── */
function renderArch(){
  $("#archGrid").innerHTML = ARCHIVE.map(p=>{ const a=ARTISTS[p.artist];
    if(!p.consent)
      return `<figure class="arch-item rv"><div style="aspect-ratio:4/5;background:rgba(23,21,18,.07);display:grid;place-items:center;text-align:center;padding:12px" class="tiny faint">판매 완료 · 비공개<br>(작가 게시 동의 없음)</div>
        <figcaption>${a.name} 《${p.title}》 ${p.year} · ${p.sold} 판매</figcaption></figure>`;
    return `<figure class="arch-item rv" data-artist="${a.id}" style="cursor:pointer" title="${a.name} 작가 페이지로">
      <span class="tag">SOLD</span>
      <img src="assets/img/${p.img}.webp" alt="${a.name}, ${p.title}" loading="lazy" style="width:100%;aspect-ratio:${p.img==="s4"||p.img==="s6"||p.img==="s8"?"5/4":"4/5"};object-fit:cover">
      <figcaption>${a.name} 《${p.title}》 ${p.year} · ${p.sold} 판매 · 저해상 보관</figcaption>
    </figure>`;
  }).join("");
  observeReveal();
}

/* ── 리빌 (IG: opacity 1.9s ease-in-out) ── */
let io;
function observeReveal(){
  if(!io) io=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
  }),{threshold:.08,rootMargin:"0px 0px -4% 0px"});
  $$(".rv:not(.in)").forEach(el=>io.observe(el));
}

/* ── velocity 미세 왜곡 (IG WebGL 대체 — 하이재킹 없이) ── */
(function(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let lastY=scrollY, v=0, target=0, raf=null;
  addEventListener("scroll",()=>{ target=Math.max(-1,Math.min(1,(scrollY-lastY)/60)); lastY=scrollY;
    if(!raf) raf=requestAnimationFrame(tick); },{passive:true});
  function tick(){ v+=(target-v)*0.08; target*=0.86;
    document.documentElement.style.setProperty("--v", v.toFixed(3));
    if(Math.abs(v)>0.002||Math.abs(target)>0.002) raf=requestAnimationFrame(tick);
    else { document.documentElement.style.setProperty("--v","0"); raf=null; } }
})();

/* ── 캡션 패럴랙스 (IG: 설명 텍스트만 JS 별도 이동) ── */
(function(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let raf=null;
  function upd(){ raf=null; const vh=innerHeight;
    $$(".piece-cap").forEach(el=>{ const r=el.parentElement.getBoundingClientRect();
      if(r.bottom<0||r.top>vh) return;
      const off=((r.top+r.height/2)-vh/2)/vh;
      el.style.transform=`translateY(${(off*-38).toFixed(1)}px)`; }); }
  addEventListener("scroll",()=>{ if(!raf) raf=requestAnimationFrame(upd); },{passive:true});
  upd();
  window.__muroCapTick = upd;   /* 검증용 훅 (rAF가 멈춘 숨은 탭에서 직접 호출) */
})();

/* ── 커서 라벨 (IG 12px +35/+15) ── */
(function(){
  const c=$("#cursor");
  addEventListener("pointermove",e=>{ c.style.transform=`translate(${e.clientX+22}px,${e.clientY+14}px)`; },{passive:true});
  document.addEventListener("pointerover",e=>{ c.classList.toggle("on", !!e.target.closest(".frame")); });
})();

/* ── 해시 라우터: #/w/{slug} · #/a/{artist} · #/artists ── */
function route(){
  const w=location.hash.match(/^#\/w\/([\w-]+)/);
  const a=location.hash.match(/^#\/a\/(\w+)/);
  if(w && workBySlug(w[1])) openDetail(w[1],false);
  else if(a && ARTISTS[a[1]]) openArtist(a[1],false);
  else if(location.hash==="#/artists") openArtistIndex(false);
  else closeDetail(false);
}
addEventListener("hashchange",route);

/* ── 오버레이 (작품 상세 · 작가 페이지 · 작가 목록) ── */
let curWork=null, curArtist=null, ovMode=null, curLight="day", curRoom="living", savedScroll=0;
function ovOpen(){ $("#ov").classList.add("open"); $("#ov").scrollTop=0; document.body.style.overflow="hidden";
  $("#ovCopy").textContent = ovMode==="work" ? "이 작품 링크 복사" : ovMode==="artist" ? "이 작가 링크 복사" : "링크 복사"; }
function openDetail(slug,push=true){
  const w=workBySlug(slug); if(!w) return;
  curWork=w; curArtist=null; ovMode="work"; curLight="day"; curRoom="living";
  if(push){ if(!$("#ov").classList.contains("open")) savedScroll=scrollY; location.hash=`/w/${slug}`; }
  renderDetail(); ovOpen();
}
function openArtist(id,push=true){
  const a=ARTISTS[id]; if(!a) return;
  curArtist=a; curWork=null; ovMode="artist";
  if(push){ if(!$("#ov").classList.contains("open")) savedScroll=scrollY; location.hash=`/a/${id}`; }
  renderArtist(); ovOpen();
}
function openArtistIndex(push=true){
  curArtist=null; curWork=null; ovMode="artists";
  if(push){ if(!$("#ov").classList.contains("open")) savedScroll=scrollY; location.hash="/artists"; }
  renderArtistIndex(); ovOpen();
}
function closeDetail(push=true){
  if(!$("#ov").classList.contains("open")) return;
  $("#ov").classList.remove("open");
  document.body.style.overflow="";
  curWork=null; curArtist=null; ovMode=null;
  if(push && location.hash) history.pushState("",document.title,location.pathname+location.search);
}
function renderDetail(){
  const w=curWork, a=ARTISTS[w.artist];
  const price=MX.price(w), ship=MX.shipping(w);
  const light=LIGHTS.find(l=>l.id===curLight);
  const sale=w.status==="sale";
  $("#ovGrid").innerHTML=`
    <div class="ov-art">
      <figure class="frame ${frameClass(w)}" style="cursor:default">
        <div class="frame-in"><img id="ovImg" src="assets/img/${w.img}.webp" alt="${a.name}, ${w.title}" class="ld" style="filter:${light.filter};transition:filter .5s"></div>
      </figure>
      <div style="margin-top:26px">
        <h4 class="tiny faint" style="letter-spacing:.2em;margin:0 0 10px">조명으로 보기 — 실물 색감 안내</h4>
        <div class="ctl-row">${LIGHTS.map(l=>`<button class="ctl ${l.id===curLight?"on":""}" data-light="${l.id}">${l.name}</button>`).join("")}</div>
        <p class="tiny faint" style="margin-top:10px;line-height:1.7">기준 촬영: 주광 5500K · 실제 색감은 조명·모니터에 따라 다를 수 있습니다.
          이 안내는 전자상거래법상 표시·광고 불일치(3개월 철회)를 예방하기 위한 것입니다.</p>
      </div>
      <div style="margin-top:34px">
        <h4 class="tiny faint" style="letter-spacing:.2em;margin:0 0 10px">우리 집 벽에 걸어보기 — 실측 비율</h4>
        <div class="room" id="room" style="aspect-ratio:16/9"></div>
        <div class="ctl-row" style="margin-top:10px">${ROOMS.map(r=>`<button class="ctl ${r.id===curRoom?"on":""}" data-room="${r.id}">${r.name}</button>`).join("")}</div>
      </div>
    </div>
    <div class="ov-info">
      <div class="ov-sec">
        <p class="cap-artist"><span class="link" data-artist="${a.id}" title="작가 페이지">${a.name}</span> <span class="faint">b.${a.born} · ${a.base}</span></p>
        <h2 class="disp" style="margin:6px 0 14px">《${w.title}》</h2>
        <ul class="spec">
          <li><span>제작 연도</span><b>${w.year}</b></li>
          <li><span>재료</span><b>${w.medium}</b></li>
          <li><span>크기</span><b>${w.w} × ${w.h} cm (${w.ho}호)</b></li>
          <li><span>액자</span><b>${w.framed}</b></li>
          <li><span>상태</span><b>${MX.statusLabel(w.status)}</b></li>
          <li><span>가격</span><b>${MX.priceLabel(w)}</b></li>
          ${sale?`<li><span>렌탈</span><b>월 ${MX.fmt(MX.rental(w))}원 · 3개월</b></li>`:""}
        </ul>
        <div class="cap-cta" style="margin-top:20px">
          ${sale?`<button class="btn pri" data-inq="${w.id}">구매 문의</button>
          <button class="btn" data-inq-rental="${w.id}">3개월 걸어보기</button>`
          :`<span class="badge-line">${MX.statusLabel(w.status)} — 유사 작품 문의 가능</span>`}
        </div>
      </div>
      <div class="ov-sec"><h4>큐레이터 노트</h4><p class="ov-note">${w.story.note}</p></div>
      <div class="ov-sec"><h4>이런 자리에 추천합니다</h4><p class="ov-why">${w.story.why}</p></div>
      <div class="ov-sec"><h4>가격은 이렇게 계산됩니다 — 호당가</h4>
        <div class="calc" id="hoCalc"></div></div>
      <div class="ov-sec"><h4>작품 이력 (프로비넌스)</h4>
        <ul class="prov">${w.provenance.map(p=>`<li><span class="d">${p[0]}</span>${p[1]}</li>`).join("")}</ul></div>
      <div class="ov-sec"><h4>진품 확인</h4>
        ${w.cert?`<div class="cert"><h5>작 품 보 증 서</h5>
          <div class="row"><span>작품</span><b>《${w.title}》</b></div>
          <div class="row"><span>작가</span><b>${a.name} (서명 원본 대조)</b></div>
          <div class="row"><span>규격</span><b>${w.w}×${w.h}cm · ${w.medium}</b></div>
          <div class="row"><span>발급</span><b>무로 · 미술진흥법 표준 감정서 양식 준수</b></div>
          <div class="seal">무로</div></div>`
        :`<span class="badge-line">보증서 미발급 — 발급 절차 진행 중 (문의 시 안내)</span>`}
      </div>
      <div class="ov-sec"><h4>구매하시면 무엇을 갖게 되나요</h4>
        <table class="rights">
          <tr><td>작품 실물의 소유권</td><td class="ok-m">이전됩니다</td></tr>
          <tr><td>저작권 (복제·전송·2차 이용)</td><td class="no-m">작가에게 남습니다</td></tr>
          <tr><td>개인 공간 소장·감상</td><td class="ok-m">자유</td></tr>
          <tr><td>SNS 개인 계정 게시</td><td class="ok-m">작가 크레딧과 함께 가능</td></tr>
          <tr><td>상업 공간 상설 전시·인쇄</td><td class="no-m">작가 별도 허락 필요</td></tr>
        </table></div>
      <div class="ov-sec"><h4>배송 안내</h4>
        <p class="ui" style="line-height:1.8">3변 합 ${ship.sum.toFixed(0)}cm → <b>${ship.kind}</b> · ${ship.cost}<br>
        <span class="mut tiny">3변 합 180cm 이상 또는 유리 액자는 미술 전문 운송으로 배송됩니다. 파손 대비 운송 보험 포함.</span></p></div>
      <div class="ov-sec">
        <p class="tiny faint" style="line-height:1.8">이미지 게시 정책: 소개 목적 · 긴 변 ${MX.fmt(CONFIG.maxLongEdge)}px 제한 ·
        Copyright © ${a.name}. All rights reserved.<br>판매 완료 시 이미지는 자동으로 축소·아카이브 처리됩니다.</p>
      </div>
    </div>`;
  renderCalc(w.ho);
  renderRoom();
}
/* 호당가 계산기 — 구간 보정 실연산 */
function renderCalc(ho){
  const w=curWork, a=ARTISTS[w.artist], f=MX.hoFactor(ho);
  const p=Math.round(a.perHo*ho*f/10000)*10000;
  $("#hoCalc").innerHTML=`
    <div class="calc-row"><span>작가 호당가</span><b class="tnum">${MX.fmt(a.perHo)}원</b></div>
    <div class="calc-row"><span>호수</span><b class="tnum">${ho}호 <span class="mut">(이 작품 ${w.ho}호)</span></b></div>
    <input type="range" min="1" max="100" value="${ho}" id="hoRange" aria-label="호수">
    <div class="calc-row"><span>구간 보정</span><b>×${f} <span class="mut tiny">${ho<=10?"10호 이하 할증":ho<=30?"기준":"30호 초과 체감"}</span></b></div>
    <div class="calc-row total"><span>산출 가격</span><b class="tnum">${MX.fmt(p)}원</b></div>
    <p class="note">호당가는 크기 기준일 뿐, 작품성·이력·수요를 반영하지 못합니다.
      그래서 <b>최종 가격은 문의에서 확정</b>됩니다. (10호 이하 할증 ×1.2 · 30호 초과 체감 ×0.85 — 업계 관행 반영)</p>`;
  $("#hoRange").addEventListener("input",e=>renderCalc(+e.target.value));
}
/* 걸어보기 룸 — 실측 스케일 (벽 폭 360cm 가정) */
function renderRoom(){
  const w=curWork, room=MURO.ROOMS.find(r=>r.id===curRoom);
  const WALL_CM=360;
  const artPct=Math.min(60, w.w/WALL_CM*100);
  const furn = room.furn==="sofa" ? {w:62,h:18} : room.furn==="bed" ? {w:55,h:16} : {w:40,h:15};
  $("#room").innerHTML=`
    <div class="room-wall" style="background:${room.wall}"></div>
    <div class="room-floor" style="background:${room.floor}"></div>
    <div class="room-furn" style="width:${furn.w}%;height:${furn.h}%"></div>
    <div class="room-art" style="width:${artPct}%"><img src="assets/img/${w.img}.webp" alt=""></div>
    <span class="room-scale">벽 폭 3.6m 기준 · 작품 ${w.w}cm = 실측 비율</span>`;
}

/* ── 작가 페이지 ── */
function renderArtist(){
  const a=curArtist;
  const works=WORKS.filter(w=>w.artist===a.id && w.status!=="hidden");
  const past=ARCHIVE.filter(p=>p.artist===a.id);
  const rep=works[0]||{};
  const forSale=works.filter(w=>w.status==="sale");
  $("#ovGrid").innerHTML=`
    <div class="ov-art">
      <figure class="frame ${frameClass(rep)}" style="cursor:default">
        <div class="frame-in"><img src="assets/img/${rep.img}.webp" alt="${a.name} 대표작" class="ld"></div>
      </figure>
      <p class="tiny faint" style="margin-top:14px">대표작 《${rep.title}》 ${rep.year}</p>
    </div>
    <div class="ov-info">
      <div class="ov-sec">
        <p class="cap-artist">작가</p>
        <h2 class="disp" style="margin:6px 0 10px">${a.name}</h2>
        <p class="ui mut">b.${a.born} · ${a.base} 거점 · 호당 ${MX.fmt(a.perHo)}원</p>
        <p class="body-t" style="margin-top:18px">${a.bio}</p>
      </div>
      <div class="ov-sec"><h4>작가 노트</h4><p class="ov-note">${a.note}</p></div>
      <div class="ov-sec"><h4>이력</h4>
        <ul class="prov">${a.history.map(h=>`<li>${h}</li>`).join("")}</ul></div>
      <div class="ov-sec"><h4>구매 가능한 작품 ${forSale.length}점</h4>
        <div class="artist-works">${works.map(w=>`
          <figure class="aw ${w.status!=="sale"?"dim":""}" data-open="${w.slug}">
            <img src="assets/img/${w.img}.webp" alt="${w.title}" loading="lazy">
            <figcaption>《${w.title}》<br><span class="faint">${w.year} · ${MX.priceLabel(w)}</span></figcaption>
          </figure>`).join("")}</div></div>
      <div class="ov-sec"><h4>지나간 작품 ${past.length}점</h4>
        <p class="ui mut">이미 새 소장처를 찾은 작품이 ${past.length}점 있습니다. 같은 결의 신작 소식을 문의로 받아보실 수 있습니다.</p></div>
      <div class="cap-cta">
        ${forSale.length?`<button class="btn pri" data-inq="${forSale[0].id}">이 작가 작품 문의</button>`:""}
        <button class="btn" data-artists-back>다른 작가 보기</button>
      </div>
    </div>`;
}
/* ── 작가 목록 ── */
function renderArtistIndex(){
  $("#ovGrid").innerHTML=`
    <div style="grid-column:2 / span 10">
      <p class="cap-artist">무로의 작가들</p>
      <h2 class="disp" style="margin:6px 0 16px">세 개의 시선</h2>
      <p class="body-t mut" style="max-width:52ch;margin-bottom:calc(var(--sp-60))">무로는 많은 작가를 다루지 않습니다.
        오래 볼 수 있는 세 사람의 작업을, 오래 보이도록 겁니다.</p>
      <div class="artist-cards">
        ${Object.values(ARTISTS).map(a=>{ const rep=WORKS.find(w=>w.artist===a.id);
          const n=WORKS.filter(w=>w.artist===a.id&&w.status==="sale").length;
          return `<figure class="artist-card" data-artist="${a.id}">
            <div class="ac-img"><img src="assets/img/${rep.img}.webp" alt="${a.name} 대표작" loading="lazy"></div>
            <figcaption>
              <b class="serif">${a.name}</b>
              <span class="faint">b.${a.born} · ${a.base}</span>
              <p>${a.bio}</p>
              <span class="gold-t tiny">구매 가능 ${n}점 →</span>
            </figcaption>
          </figure>`; }).join("")}
      </div>
    </div>`;
}

/* ── 문의 폼 ── */
function renderInqSelect(sel){
  $("#qWork").innerHTML = WORKS.filter(w=>w.status==="sale"||w.status==="hold")
    .map(w=>`<option value="${w.id}" ${w.id===sel?"selected":""}>${ARTISTS[w.artist].name} 《${w.title}》 — ${MX.priceLabel(w)}</option>`).join("")
    + `<option value="etc" ${sel==="etc"?"selected":""}>기타 · 커미션 상담</option>`;
  updateShip();
}
function updateShip(){
  const id=$("#qWork").value, el=$("#shipEst");
  if(id==="etc"){ el.innerHTML=`커미션·기타 상담은 작품 확정 후 배송 방식을 안내드립니다.`; return; }
  const w=workById(id), s=MX.shipping(w);
  const elev=$("#qElev").value==="있음", floor=+$("#qFloor").value||1, inst=$("#qInstall").value==="필요";
  let extra = !elev && floor>=3 ? " · 계단 운반 할증 예상" : "";
  el.innerHTML=`<b>배송 자동 판정</b> — 《${w.title}》 3변 합 <b class="tnum">${s.sum.toFixed(0)}cm</b>
    → <b>${s.kind}</b>, ${s.cost}${inst?" · 설치 포함":""}${extra}<br>
    <span class="mut">180cm 이상·유리 액자는 미술 전문 운송(보험 포함) 기준입니다.</span>`;
}
document.addEventListener("change",e=>{
  if(["qWork","qFloor","qElev","qInstall"].includes(e.target.id)) updateShip();
  if(e.target.id==="qType") $("#commissionExtra").hidden = !$("#qType").value.startsWith("커미션");
});
$("#inqForm").addEventListener("submit",e=>{
  e.preventDefault();
  if(!$("#qName").value.trim()) return toast("성함을 입력해주세요");
  if(!$("#qPolicy").checked) return toast("청약철회 안내 확인이 필요합니다");
  if($("#qType").value.startsWith("커미션") && !$("#qCommission").checked) return toast("주문 제작 동의가 필요합니다");
  toast("문의가 접수되었습니다 — 하루 안에 연락드리겠습니다 (데모)");
  e.target.reset(); renderInqSelect(); $("#qName").value="김소장"; $("#qTel").value="010-1234-5678";
});
$("#qSample").addEventListener("click",()=>{
  $("#qPolicy").checked=true;
  toast("예시 문의가 접수되었습니다 — 관리자 화면에서 확인할 수 있습니다 (데모)");
});

/* ── 전역 클릭 위임 ── */
document.addEventListener("click",e=>{
  const open=e.target.closest("[data-open]");
  if(open){ openDetail(open.dataset.open); return; }
  const art=e.target.closest("[data-artist]");
  if(art){ openArtist(art.dataset.artist); return; }
  if(e.target.closest("[data-artists-back]")){ openArtistIndex(); return; }
  if(e.target.closest("[data-artists]")){ openArtistIndex(); return; }
  if(e.target.closest("[data-ovclose]")){ closeDetail(); requestAnimationFrame(()=>scrollTo(0,savedScroll)); return; }
  const inq=e.target.closest("[data-inq]");
  if(inq){ closeDetail(); renderInqSelect(inq.dataset.inq); $("#qType").value="구매";
    $("#inq").scrollIntoView({behavior:"smooth"}); return; }
  const rent=e.target.closest("[data-inq-rental]");
  if(rent){ closeDetail(); renderInqSelect(rent.dataset.inqRental); $("#qType").value="3개월 걸어보기(렌탈)";
    $("#inq").scrollIntoView({behavior:"smooth"}); return; }
  const lt=e.target.closest("[data-light]");
  if(lt){ curLight=lt.dataset.light; const l=LIGHTS.find(x=>x.id===curLight);
    $$("[data-light]").forEach(b=>b.classList.toggle("on",b===lt));
    $("#ovImg").style.filter=l.filter; return; }
  const rm=e.target.closest("[data-room]");
  if(rm){ curRoom=rm.dataset.room; $$("[data-room]").forEach(b=>b.classList.toggle("on",b===rm)); renderRoom(); return; }
  if(e.target.closest("#ovCopy")){
    const path = ovMode==="artist"&&curArtist ? "#/a/"+curArtist.id
               : ovMode==="artists" ? "#/artists"
               : "#/w/"+(curWork?curWork.slug:"");
    const url=location.origin+location.pathname+path;
    (navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(
      ()=>toast(ovMode==="work"?"작품 링크가 복사되었습니다 — 어디서든 이 액자 앞으로 돌아옵니다":"링크가 복사되었습니다"),
      ()=>toast(url));
    return; }
  const sc=e.target.closest("[data-scroll]");
  if(sc){ $("#"+sc.dataset.scroll).scrollIntoView({behavior:"smooth"}); return; }
  if(e.target.closest("[data-top]")){ scrollTo({top:0,behavior:"smooth"}); return; }
});
document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeDetail(); });

/* ── 초기화 ── */
renderStream();
renderArch();
renderInqSelect();
observeReveal();
route();  /* 딥링크 진입 처리 */
})();
