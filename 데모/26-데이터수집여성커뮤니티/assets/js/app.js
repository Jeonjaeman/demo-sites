/* HERLOOP — 피드(노출 4단 실전환)·상세(스티키 레일·원문 상태)·댓글 */
'use strict';
const APP = (() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function toast(msg, warn) {
    const el = document.createElement('div');
    el.className = 'toast' + (warn ? ' warn' : '');
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3200);
    setTimeout(() => el.remove(), 3600);
  }

  function go(v) {
    $$('.view').forEach(x => x.classList.remove('on'));
    $('#view-' + v).classList.add('on');
    $$('#gnb button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    window.scrollTo({ top: 0 });
  }

  /* ══ 노출 방식 4단 (R3) ══ */
  let mode = 'excerpt';
  function renderExpose() {
    const m = HL.EXPOSE_MODES[mode];
    $('#exposeRisk').innerHTML = `법적 위험 <span class="risk-tag ${m.risk}">${m.riskLabel}</span>`;
    $('#exposeNote').innerHTML = m.note;
    $('#exposeLaw').innerHTML = m.law.map(([k, v]) => `<span>· ${esc(k)}: <b>${esc(v)}</b></span>`).join('');
  }
  function crawledBody(c) {
    if (mode === 'link') return `<a class="outlink">↗ 원문에서 읽기 — ${esc(c.src)}</a>`;
    if (mode === 'excerpt') return `${esc(c.excerpt)}… <a class="outlink">↗ 원문 계속 읽기</a>`;
    if (mode === 'summary') return `<b style="color:var(--ink2)">[AI 요약]</b> ${esc(c.summary)}<br><span class="summary-warn">⚠ 요약 완성도에 비례해 원문 대체 위험 상승</span>`;
    return `${esc(c.full)}`;
  }

  /* ══ 피드 ══ */
  function renderFeed() {
    const cards = [];
    // 회원 글 + 크롤링 카드 교차 배치
    const seq = [HL.CRAWLED[0], HL.MEMBER[0], HL.CRAWLED[1], HL.CRAWLED[2], HL.MEMBER[1], HL.CRAWLED[3]];
    seq.forEach(item => {
      if (item.src) { // 크롤링 카드
        if (!item.alive) {
          cards.push(`<div class="fcard crawled">
            <div class="who"><span class="avt" style="background:var(--line);color:var(--ink3)">↗</span>
              <div><div class="nick">${esc(item.src)}</div><div class="sub1">수집 콘텐츠 · ${esc(item.time)}</div></div></div>
            <div class="img-wrap"><div class="img" style="display:grid;place-items:center;color:var(--ink4);font-size:13px">원문 삭제 감지(404)<br>— 카드 비공개 처리</div>
              <span class="chip err src-badge">원문 삭제 · 댓글 보존</span></div>
            <div class="body" style="color:var(--ink4)">원문이 삭제되어 콘텐츠를 더 이상 노출하지 않습니다. 이 카드에 달린 우리 커뮤니티의 댓글 ${item.cmts}개는 보존됩니다.</div>
            <div class="acts"><button>🤍 ${item.likes}</button><button>💬 ${item.cmts}</button><button>🔖</button></div>
          </div>`);
          return;
        }
        cards.push(`<div class="fcard crawled" data-id="${item.id}">
          <div class="who"><span class="avt" style="background:var(--info);">↗</span>
            <div><div class="nick">${esc(item.src)}</div><div class="sub1">수집 콘텐츠 · ${esc(item.time)} · noindex</div></div></div>
          <div class="img-wrap">${mode === 'link' ? '' : `<img class="img" src="${item.img}" alt="">`}<span class="chip info src-badge">출처 ${esc(item.src)}</span></div>
          <div class="body"><b style="color:var(--ink1)">${esc(item.title)}</b><br>${crawledBody(item)}</div>
          <div class="acts"><button>🤍 ${item.likes}</button><button data-open="${item.id}">💬 ${item.cmts}</button><button>🔖 스크랩</button></div>
        </div>`);
      } else { // 회원 글
        cards.push(`<div class="fcard" data-id="${item.id}">
          <div class="who"><span class="avt">${esc(item.nick[0])}</span>
            <div><div class="nick">${esc(item.nick)}</div><div class="sub1">${esc(item.sub)}</div></div>
            <button class="btn out" style="margin-left:auto;height:30px;font-size:12px" onclick="APP.toast('팔로우 — 회원 글은 검색 색인 대상입니다 (자체 콘텐츠)')">팔로우</button></div>
          <div class="img-wrap"><img class="img" src="${item.img}" alt=""><span class="chip rose src-badge">회원 글 · index</span></div>
          <div class="body">${esc(item.body)}</div>
          <div class="acts"><button>🤍 ${item.likes}</button><button data-open="${item.id}">💬 ${item.cmts}</button><button>🔖 스크랩</button></div>
          <div class="cmt"><span class="n">${esc(item.topCmt[0])}</span><span>${esc(item.topCmt[1])}</span></div>
        </div>`);
      }
    });
    $('#feedGrid').innerHTML = cards.join('');
    $$('#feedGrid [data-open]').forEach(b => b.onclick = () => { openDetail(b.dataset.open); });
    $$('#feedGrid .fcard[data-id]').forEach(c => c.onclick = e => { if (!e.target.closest('button')) openDetail(c.dataset.id); });
  }
  $$('#exposeSeg button').forEach(b => b.onclick = () => {
    mode = b.dataset.m;
    $$('#exposeSeg button').forEach(x => x.classList.toggle('on', x === b));
    renderExpose(); renderFeed();
    toast({link:'링크만 — 가장 안전, 체류 최소', excerpt:'발췌+링크 — 대법원 인용 4요건에 가장 안전한 기본값', summary:'AI 요약 — 잘할수록 원문 대체 위험이 올라갑니다', full:'전문 게재 — 건당 배상 판례가 있는 구간입니다 (금지 권고)'}[mode], mode === 'full');
  });

  /* ══ 상세 ══ */
  function openDetail(id) {
    const c = HL.CRAWLED.find(x => x.id === id);
    const m = HL.MEMBER.find(x => x.id === id);
    const item = c || m || HL.MEMBER[0];
    const isCrawled = !!c;
    $('#detailWrap').innerHTML = `
      <div class="body-col">
        ${isCrawled
          ? `<div style="display:flex;gap:8px;margin-bottom:12px"><span class="chip info">수집 콘텐츠 — 출처 ${esc(item.src)}</span><span class="chip mute">noindex — 검색 미색인</span></div>
             <h1>${esc(item.title)}</h1>
             <div class="meta"><span>${esc(item.time)}</span><span>노출 방식: ${HL.EXPOSE_MODES[mode].label}</span></div>
             <div class="origin-box ${item.alive ? '' : 'dead'}">
               ${item.alive
                 ? `<b>원문 안내</b> — 이 카드는 ${esc(item.src)}의 콘텐츠를 ${HL.EXPOSE_MODES[mode].label} 방식으로 소개합니다. 전체 내용은 원문에서 확인하세요. <a class="outlink" style="color:var(--info);font-weight:700">↗ ${esc(item.origin)}</a>`
                 : `<b>원문 삭제 감지</b> — 크롤러가 404를 확인해 본문 노출을 중단했습니다. 아래 우리 커뮤니티 댓글은 보존됩니다.`}
             </div>
             <div class="content">${item.alive ? crawledBody(item) : '<p style="color:var(--ink4)">(본문 비공개)</p>'}</div>`
          : `<div style="display:flex;gap:8px;margin-bottom:12px"><span class="chip rose">회원 글</span><span class="chip ok">검색 색인 대상</span></div>
             <div class="who" style="display:flex;gap:10px;align-items:center;margin-bottom:14px">
               <span class="avt" style="width:36px;height:36px;border-radius:100%;background:linear-gradient(135deg,var(--primary),#f0a5c0);color:#fff;display:grid;place-items:center;font-weight:700">${esc(item.nick[0])}</span>
               <div><div style="font-weight:700;color:var(--ink1)">${esc(item.nick)}</div><div style="font-size:12px;color:var(--ink3)">${esc(item.sub)} · ${esc(item.time)}</div></div></div>
             <img src="${item.img}" alt="" style="width:100%;border-radius:0;display:block;margin-bottom:16px">
             <div class="content"><p>${esc(item.body)}</p></div>`}
        <div class="report-row">
          <button onclick="APP.toast('신고 접수 — 유형(불법촬영물/저작권/혐오·비방) 선택 후 관리자 큐 적재. 불법촬영물 의심은 최우선 처리됩니다')">신고하기</button>
          <button onclick="APP.toast('이 작성자의 글이 더 이상 보이지 않습니다 — 차단 목록에서 해제 가능', true)">차단</button>
        </div>
        <div class="cmt-box">
          <div style="font-size:16px;color:var(--ink1);font-weight:700;margin-bottom:6px">댓글 <span class="mono">${item.cmts || item.cmts === 0 ? item.cmts : 0}</span></div>
          <div class="cmt-item"><span class="avt">소</span><div><span class="n">소소살림</span> <span class="ts">2026-08-13 10:22:41</span><div class="t">정보 감사해요. 저장해둡니다!</div></div></div>
          <div class="cmt-item"><span class="avt">달</span><div><span class="n">달빛서재</span> <span class="ts">2026-08-13 09:58:03</span><div class="t">${isCrawled ? '원문도 읽고 왔는데 여기 댓글이 더 유익하네요' : '따라해봐야겠어요'}</div></div></div>
          <div class="cmt-input"><input id="cmtIn" placeholder="댓글을 남겨보세요 (커뮤니티 가치는 우리 댓글에 쌓입니다)"><button class="btn pri" id="cmtBtn">등록</button></div>
        </div>
      </div>
      <div class="rail">
        <button onclick="APP.toast('좋아요')">🤍<span class="n">${item.likes}</span></button>
        <button onclick="document.getElementById('cmtIn').focus()">💬<span class="n">${item.cmts}</span></button>
        <button onclick="APP.toast('스크랩 — 마이페이지에 저장')">🔖<span class="n">스크랩</span></button>
        <button onclick="APP.toast('링크 복사')">🔗<span class="n">공유</span></button>
      </div>`;
    $('#cmtBtn').onclick = () => {
      const v = $('#cmtIn').value.trim(); if (!v) return;
      toast('댓글 등록 — 크롤링 카드의 댓글도 우리 DB에 저장되며 원문 삭제 시에도 보존됩니다');
      $('#cmtIn').value = '';
    };
    go('detail');
  }

  document.addEventListener('DOMContentLoaded', () => {
    $$('#gnb button').forEach(b => b.onclick = () => { if (b.dataset.v === 'detail') openDetail('c1'); else go(b.dataset.v); });
    renderExpose(); renderFeed();
  });
  return { go, toast };
})();
