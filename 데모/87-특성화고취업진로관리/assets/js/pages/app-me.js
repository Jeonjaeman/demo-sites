/* 내 이력 — 자격증·어학·수상 등록(증빙 업로드 → 교사 확인 대기) · 반려 재등록 · 자소서/포트폴리오 버전 누적 */
(function () {
  'use strict';
  const { $, $$, esc, toast, modal, badge } = UI;
  const { root, s } = APP.mount({ title: '내 이력' });
  const STAT = { verified: ['교사 확인', 'ok'], pending: ['확인 대기', 'warn'], rejected: ['반려', 'danger'] };
  function render() {
    const pf = s.portfolio.filter((p) => p.ver > 0).sort((a, b) => b.ver - a.ver), rs = s.portfolio.filter((p) => p.kind === 'resume');
    root.innerHTML = `
      <div class="segtabs" role="tablist"><button role="tab" aria-selected="true" data-tab="certs">자격·어학·수상 <b>${s.certs.length + s.langs.length + s.awards.length}</b></button><button role="tab" aria-selected="false" data-tab="pf">자소서·포트폴리오 <b>${s.portfolio.length}</b></button></div>
      <section id="certs" class="tabpane" data-reveal>
        <button class="btn btn--primary btn--block btn--lg" id="add">+ 자격증·어학·수상 등록</button>
        <p class="t-small muted">증빙(사진·PDF)을 올리면 「확인 대기」가 되고, 선생님이 확인하면 진로 준비도에 반영돼요.</p>
        <ul class="items">${[...s.certs.map((c) => ({ ...c, kind: '자격증', title: c.name, sub: c.issuer })), ...s.langs.map((l) => ({ ...l, kind: '어학', title: `${l.test} ${l.score}`, sub: '성적표' })), ...s.awards.map((a) => ({ ...a, kind: '수상', title: a.name, sub: '상장' }))].sort((a, b) => b.date.localeCompare(a.date)).map((it) => `<li class="item item--${it.status}"><div class="item__main"><span class="item__kind">${it.kind}</span><b>${esc(it.title)}</b><span class="t-small muted">${esc(it.sub)} · ${CP.fmt.date(it.date)}</span>${it.status === 'rejected' ? `<span class="t-small t-danger">반려 사유: ${esc(it.note || '증빙 확인 불가')}</span>` : ''}</div><div class="item__side">${badge(STAT[it.status][0], STAT[it.status][1])}${it.status === 'rejected' ? `<button class="btn btn--soft btn--sm" data-reup="${it.id}">다시 올리기</button>` : ''}</div></li>`).join('') || '<li class="empty">아직 등록한 이력이 없어요. 첫 자격증을 올려 볼까요?</li>'}</ul>
      </section>
      <section id="pf" class="tabpane" hidden>
        <button class="btn btn--primary btn--block btn--lg" id="addPf">+ 새 버전 올리기</button>
        <p class="t-small muted">이전 버전은 지워지지 않아요. 선생님과 v1 → v3 변화를 같이 봅니다.</p>
        <h3 class="t-eyebrow">포트폴리오</h3>
        <ul class="items">${pf.map((p, i) => `<li class="item ${i === 0 ? 'item--latest' : ''}"><div class="item__main"><span class="item__kind">v${p.ver}${i === 0 ? ' · 최신' : ''}</span><b>${esc(p.file)}</b><span class="t-small muted">${CP.fmt.date(p.date)} · ${p.size}${p.memo && p.memo !== '최신' ? ` · ${esc(p.memo)}` : ''}</span></div><div class="item__side"><button class="btn btn--text btn--sm" data-open="${esc(p.file)}">열기</button></div></li>`).join('') || '<li class="empty">아직 없어요</li>'}</ul>
        <h3 class="t-eyebrow mt">자기소개서</h3>
        <ul class="items">${rs.map((p) => `<li class="item"><div class="item__main"><span class="item__kind">자소서</span><b>${esc(p.file)}</b><span class="t-small muted">${CP.fmt.date(p.date)} · ${p.size}</span></div><div class="item__side"><button class="btn btn--text btn--sm" data-open="${esc(p.file)}">열기</button></div></li>`).join('') || '<li class="empty">아직 없어요</li>'}</ul>
      </section>`;
    UI.reveal(root);
    if (location.hash === '#pf') switchTab('pf');
  }
  function switchTab(k) { $$('[role=tab]', root).forEach((t) => t.setAttribute('aria-selected', t.dataset.tab === k)); $$('.tabpane', root).forEach((p) => { p.hidden = p.id !== k; }); }
  render();
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[role=tab]'); if (t) return switchTab(t.dataset.tab);
    if (e.target.id === 'add') return addItem();
    if (e.target.id === 'addPf') return addPf();
    const r = e.target.closest('[data-reup]'); if (r) return addItem(r.dataset.reup);
    const o = e.target.closest('[data-open]'); if (o) toast(`"${o.dataset.open}" — 데모라 파일은 열리지 않아요`, 'info');
  });
  function addItem(reupId) {
    const prev = reupId && [...s.certs, ...s.langs, ...s.awards].find((x) => x.id === reupId);
    const certs = [...new Set(Object.values(CP.load().specs).flatMap((x) => x.items.filter((i) => i.kind === 'cert').map((i) => i.name)))];
    const rec = CP.load().specs[s.job].items.filter((i) => i.kind === 'cert' && !s.certs.some((c) => c.name === i.name)).map((i) => i.name);
    modal({ title: prev ? '증빙 다시 올리기' : '이력 등록', size: 'sm', body: `
      ${prev ? `<p class="notice notice--warn t-small">반려 사유: ${esc(prev.note || '증빙 확인 불가')} — 선명한 사진이나 원본 PDF로 다시 올려 주세요.</p>` : ''}
      <label class="field"><span class="field__label">종류</span><select class="select" id="kind"><option value="cert">자격증</option><option value="lang">어학</option><option value="award">수상</option></select></label>
      <label class="field"><span class="field__label">명칭</span><input class="input" id="name" list="cl" value="${esc(prev ? (prev.name || prev.test) : (rec[0] || certs[0]))}"><datalist id="cl">${certs.map((c) => `<option>${c}</option>`).join('')}</datalist>${rec.length && !prev ? `<span class="field__help">내 희망 직무 권장: ${rec.slice(0, 3).join(' · ')}</span>` : ''}</label>
      <label class="field"><span class="field__label">취득일</span><input class="input" id="date" type="date" value="${prev ? prev.date : CP.iso(CP.TODAY)}"></label>
      <label class="field"><span class="field__label">증빙 파일</span><div class="filebox"><input type="file" id="file" accept="image/*,.pdf" capture="environment"><span>사진 찍기 또는 파일 선택</span></div><span class="field__help">합격증·성적표·상장 원본. 개인정보(주민번호)는 가리고 올려도 돼요.</span></label>`,
      actions: [{ label: '취소' }, { label: '등록', kind: 'btn--primary', onClick: (m) => { const kind = $('#kind', m.el).value, name = $('#name', m.el).value.trim(), date = $('#date', m.el).value; if (!name) return toast('명칭을 입력하세요', 'warn'); const fileEl = $('#file', m.el); const fname = fileEl.files[0] ? fileEl.files[0].name : `${name}.jpg`; if (prev) { prev.status = 'pending'; prev.note = ''; prev.file = fname; prev.date = date; } else { const id = `u${Date.now().toString(36)}`; if (kind === 'cert') s.certs.push({ id, name, issuer: '학생 등록', date, file: fname, status: 'pending', note: '' }); else if (kind === 'lang') s.langs.push({ id, test: name.split(' ')[0], score: name.split(' ')[1] || '', date, file: fname, status: 'pending' }); else s.awards.push({ id, name, date, file: fname, status: 'pending' }); } CP.save(); CP.audit('학생 이력 등록', `${s.name} · ${name}`); m.close(); toast('등록했어요 — 선생님 확인 후 준비도에 반영돼요', 'ok'); render(); } }] });
  }
  function addPf() { const next = Math.max(0, ...s.portfolio.filter((p) => p.ver > 0).map((p) => p.ver)) + 1; modal({ title: `포트폴리오 v${next}`, size: 'sm', body: `<label class="field"><span class="field__label">파일 (PDF 권장, 50MB까지)</span><div class="filebox"><input type="file" id="pf" accept=".pdf,.pptx,.zip"><span>파일 선택</span></div></label><label class="field"><span class="field__label">무엇이 바뀌었나요?</span><input class="input" id="memo" value="프로젝트 1건 추가 · 자기소개 수정" placeholder="예: 캡스톤 결과물 추가"></label>`, actions: [{ label: '취소' }, { label: '올리기', kind: 'btn--primary', onClick: (m) => { s.portfolio.forEach((p) => { if (p.ver > 0) p.memo = ''; }); s.portfolio.push({ ver: next, file: `${s.name}_포트폴리오_v${next}.pdf`, date: CP.iso(CP.TODAY), size: '4.1MB', memo: $('#memo', m.el).value || '최신' }); CP.save(); CP.audit('포트폴리오 업로드', `${s.name} v${next}`); m.close(); toast(`v${next} 올렸어요 — 이전 버전은 그대로 남아요`, 'ok'); location.hash = '#pf'; render(); } }] }); }
})();
