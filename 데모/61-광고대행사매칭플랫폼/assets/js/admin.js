/* ADRING 관리자 — 큐·수익모델 실계산·리뷰 3분기 잠금·동일실체·상태머신 */
'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const won = n => Math.round(n).toLocaleString('ko-KR');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function toast(msg, warn) {
    const el = document.createElement('div');
    el.className = 'toast' + (warn ? ' warn' : ''); el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.style.opacity='0'; el.style.transition='opacity .3s'; }, 3200);
    setTimeout(() => el.remove(), 3600);
  }
  $$('#anav button').forEach(b => b.onclick = () => {
    $$('#anav button').forEach(x => x.classList.toggle('on', x===b));
    $$('.aview').forEach(v => v.classList.toggle('on', v.id === 'av-'+b.dataset.v));
  });

  /* 큐 */
  function renderQueue() {
    const q = AD.ADMIN.queue;
    $('#qStat').textContent = `자동 처리 ${q[0].n}건 / 사람 확인 필요 ${q[1].items.length}건`;
    $('#midAlert').innerHTML = `⚠ 누적 중개 ${AD.ADMIN.midCount}건 — <b>50건 도달 시 통신판매업 신고 대상</b>이 될 수 있습니다 (면제 기준 이탈 경보 · 관할 지자체 사전 질의 권장)`;
    $('#queueList').innerHTML = q[1].items.map((it,i) => `
      <div class="panel"><div class="panel-bd" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center">
        <div><b style="color:var(--ink1)">${esc(it.firm)}</b><div style="font-size:12.5px;color:${it.issue.includes('동일 실체')||it.issue.includes('불일치')?'var(--danger)':'#b88a00'};margin-top:4px">⚠ ${esc(it.issue)}</div></div>
        <button class="btn ghost sm" data-q="${i}">${it.action}</button>
      </div></div>`).join('');
    $$('#queueList [data-q]').forEach(b => b.onclick = () => { toast(`처리 완료 — ${AD.ADMIN.queue[1].items[+b.dataset.q].action} 발송·기록됨`); b.disabled = true; });
  }

  /* 수익모델 실계산 (F5) */
  function calcModels() {
    const req = +$('#sReq').value, prop = +$('#sProp').value, conf = +$('#sConf').value/100, track = +$('#sTrack').value/100;
    $('#sReqV').textContent = req+'건'; $('#sPropV').textContent = prop+'건'; $('#sConfV').textContent = Math.round(conf*100)+'%'; $('#sTrackV').textContent = Math.round(track*100)+'%';
    const LEAD = 5000, CONFIRM_FEE = 50000, SUB = 99000, AGENCIES = 128;
    const lead = req * prop * LEAD;
    const confirmRev = req * conf * CONFIRM_FEE * track; // 관측된 성사에만 청구 가능
    const sub = AGENCIES * SUB * 0.35; // 유료 전환 35% 가정
    const models = [
      { n:'① 리드 과금 (제안 제출당 5,000원)', v:lead, note:`숨고 방식 — 성사와 무관하게 발송 시점 과금. 월 ${won(req*prop)}건 제안 기준`, risk:'대행사 반발 가능 · 회수 확실', best:true },
      { n:'② 매칭 확정 과금 (확정당 50,000원)', v:confirmRev, note:`확정 ${won(req*conf)}건 중 <b>성사 관측 ${Math.round(track*100)}%에만 청구 가능</b> — 외부 진행이라 나머지는 관측 불가`, risk:'회수 리스크 최대 — 관측률이 곧 매출', best:false },
      { n:'③ 입점 구독 (월 99,000원)', v:sub, note:`입점 ${AGENCIES}곳 × 유료 전환 35% 가정`, risk:'초기 입점 유인과 상충 가능', best:false },
    ];
    $('#modelOut').innerHTML = models.map(m => `
      <div class="model ${m.best?'best':''}">
        <h4>${m.n}${m.best?' <span class="bdg open">권장</span>':''}</h4>
        <div class="rev" style="color:${m.best?'var(--partner-ink)':'var(--ink1)'}">${won(m.v)}<small style="font-size:12px;color:var(--ink3)">원/월</small></div>
        <div class="note">${m.note}</div>
        <div class="risk" style="color:${m.v<lead*0.3?'var(--danger)':'var(--ink3)'}">${m.risk}</div>
      </div>`).join('');
  }

  /* 리뷰 3분기 (F6) */
  function bindReview() {
    const upd = () => {
      const src = $('#rvSrc').value, id = $('#rvMatch').value.trim();
      const warn = $('#rvWarn'), save = $('#rvSave');
      if (src === 'match' && !/^MT-\d{4}-\d{3}$/.test(id)) {
        warn.textContent = '⚠ 매칭 ID가 없거나 형식이 다릅니다 — 실거래 근거 없는 후기는 표시광고법 3조(거짓·과장) 위반 소지가 있어 저장이 잠깁니다.';
        warn.classList.add('show'); save.disabled = true; save.textContent = '저장 잠김 — 매칭 ID 필요';
      } else if (src === 'ext') {
        warn.textContent = 'ℹ 플랫폼 외 실거래 — 증빙(세금계산서 등) 첨부 필수, 프로필에 「플랫폼 외 거래」 배지가 강제 표기됩니다.';
        warn.classList.add('show'); save.disabled = false; save.textContent = '리뷰 저장 (배지 강제)';
      } else { warn.classList.remove('show'); save.disabled = false; save.textContent = src==='self' ? '실적 저장 (평점 미반영 영역)' : '리뷰 저장'; }
    };
    $('#rvSrc').onchange = upd; $('#rvMatch').oninput = upd; upd();
    $('#rvSave').onclick = () => toast('저장 완료 — 프로필에 출처 라벨과 함께 노출됩니다 (「후기 N건 중 M건은 플랫폼 외 거래」 자동 집계)');
    $('#rvBody').innerHTML = AD.ADMIN.reviews.map(r => `<tr>
      <td style="font-weight:700">${esc(r.agency)}</td>
      <td>${r.matchId ? `<span class="bdg open">플랫폼 매칭 ${r.matchId}</span>` : '<span class="bdg warn">플랫폼 외 거래 · 증빙 보관</span>'}</td>
      <td style="color:var(--ink3)">${esc(r.text)}</td></tr>`).join('');
  }

  /* 동일실체 (F10) */
  function renderFraud() {
    $('#fraudList').innerHTML = AD.ADMIN.suspects.map(s => `
      <div class="panel"><div class="panel-hd"><span>동일 실체 의심 그룹</span><span class="meta">graph match</span></div>
        <div class="panel-bd">
          <div style="font-family:var(--mono);font-size:11.5px;color:var(--ink4);margin-bottom:8px">${esc(s.key)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${s.accounts.map(a=>`<span class="bdg ${a.includes('정지')?'danger':'warn'}">${esc(a)}</span>`).join('')}</div>
          <div style="font-size:12.5px;color:#b88a00;font-weight:600">패턴: ${esc(s.pattern)}</div>
          <button class="btn ghost sm" style="margin-top:10px" onclick="this.textContent='그룹 차단 완료 — 신규 가입도 같은 실체면 자동 보류';this.disabled=true">실체 단위 일괄 차단</button>
        </div></div>`).join('');
  }

  /* 상태머신 + 폴백 */
  const STATE_NOTES = {
    '작성중':'임시저장 상태 — 대행사에 노출되지 않음','모집중':'알림 발송됨 · 슬롯 카운터 공개 · 등급별 시간차 오픈 진행',
    '마감':'슬롯 충족 또는 마감일 도래 — 신규 제안 차단','비교중':'작성자만 전체 열람 · 제안 유효기간 카운트다운 동작',
    '확정':'2단계 동의 완료 → 연락처 상호 공개 · D+3/D+10 진행 확인 예약','종료':'진행 확인 응답 반영 → 대행사 지표 갱신',
    '제안0-자동연장':'마감 시 제안 0건이면 마감 +7일 자동 연장 + 인접 카테고리 재알림 (첫 경험 방어)',
    '확정취소-슬롯복구':'확정 후 노쇼·파기 시 — 확정 취소하면 슬롯이 복구되고 차순위 제안에 재확정 기회',
  };
  function renderState() {
    $('#stateFlow').innerHTML = AD.ADMIN.states.map((s,i) => `<span class="st ${i===1?'cur':''} ${s.includes('-')?'exc':''}" data-s="${s}">${s}</span>`).join('');
    $$('#stateFlow .st').forEach(el => el.onclick = () => {
      $$('#stateFlow .st').forEach(x=>x.classList.remove('cur')); el.classList.add('cur');
      $('#stateNote').innerHTML = `<b style="color:var(--ink1)">${el.dataset.s}</b> — ${STATE_NOTES[el.dataset.s]}`;
    });
    const f = AD.ADMIN.fallback;
    $('#fallbackOut').innerHTML = `
      <div class="kv"><span class="k">알림톡 발송</span><span class="v">${f.alimtalk}건 · 실패 ${f.alimFail}건 (채널 차단·미사용)</span></div>
      <div class="kv"><span class="k">→ LMS 대체 발송</span><span class="v">${f.lms}건 · 추가 비용 <span class="mono">${won(f.cost)}원</span></span></div>
      <div class="kv"><span class="k">→ 이메일 최종 폴백</span><span class="v">${f.email}건</span></div>
      <div class="kv"><span class="k">템플릿 심사 리드타임</span><span class="v">2~3영업일 × 반려 여지 — 일정표 4주차 착수 필수</span></div>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderQueue(); calcModels(); bindReview(); renderFraud(); renderState();
    ['sReq','sProp','sConf','sTrack'].forEach(id => $('#'+id).oninput = calcModels);
  });
})();
