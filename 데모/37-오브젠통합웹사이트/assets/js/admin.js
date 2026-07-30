/* =====================================================================
   OBZEN Integrated (B안) — 관리자 CMS (뉴스·IR·공지 CRUD, localStorage)
   ===================================================================== */
(function () {
  'use strict';
  var OB = window.OB;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function toast(msg, kind) {
    var t = document.createElement('div'); t.className = 'form-status ' + (kind === 'err' ? 'err' : 'ok');
    t.style.cssText = 'box-shadow:var(--shadow-lg);opacity:0;transform:translateY(10px);transition:.25s;max-width:320px';
    t.textContent = msg; $('#toasts').appendChild(t);
    requestAnimationFrame(function () { t.style.opacity = '1'; t.style.transform = 'none'; });
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 260); }, 2600);
  }
  function uid() { return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  var TL = OB.TYPE_LABEL;

  function render() {
    var list = OB.loadNews().slice().sort(function (a, b) { return b.date < a.date ? -1 : 1; });
    // KPI
    var by = { notice: 0, ir: 0, news: 0 }; list.forEach(function (n) { by[n.type]++; });
    $('#kpi').innerHTML =
      kpi(list.length, '전체 자료') + kpi(by.notice, '공지') + kpi(by.ir, 'IR') + kpi(by.news, '보도자료');
    $('#cnt').textContent = list.length + '건';
    // rows
    var bmap = { notice: 'b-notice', ir: 'b-ir', news: 'b-news' };
    $('#rows').innerHTML = list.map(function (n) {
      return '<tr><td class="mono">' + esc(n.date) + '</td>' +
        '<td><span class="badge2 ' + bmap[n.type] + '" style="font-family:var(--mono);font-size:11px;padding:4px 9px;border-radius:999px">' + esc(TL[n.type].ko) + '</span></td>' +
        '<td><b style="font-weight:700">' + esc(n.title.ko) + '</b><div class="muted" style="font-size:12px;margin-top:2px">' + esc(n.title.en || '—') + '</div></td>' +
        '<td style="text-align:right;white-space:nowrap"><button class="btn sm ghost" data-edit="' + n.id + '">수정</button> <button class="btn sm" data-del="' + n.id + '" style="color:var(--magenta)">삭제</button></td></tr>';
    }).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:30px">자료가 없습니다. 오른쪽에서 추가하세요.</td></tr>';
    $$('#rows [data-edit]').forEach(function (b) { b.onclick = function () { startEdit(b.getAttribute('data-edit')); }; });
    $$('#rows [data-del]').forEach(function (b) { b.onclick = function () { del(b.getAttribute('data-del')); }; });
  }
  function kpi(v, l) { return '<div class="b"><div class="v">' + v + '</div><div class="l">' + l + '</div></div>'; }

  var f = $('#editForm');
  function resetForm() { f.reset(); f.id.value = ''; $('#formTitle').textContent = '새 자료 등록'; $('#saveBtn').textContent = '등록'; f.date.value = new Date().toISOString().slice(0, 10); }
  function startEdit(id) {
    var n = OB.loadNews().find(function (x) { return x.id === id; }); if (!n) return;
    f.id.value = n.id; f.date.value = n.date; f.type.value = n.type; f.ko.value = n.title.ko; f.en.value = n.title.en || '';
    $('#formTitle').textContent = '자료 수정'; $('#saveBtn').textContent = '저장';
    f.ko.focus(); f.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function del(id) {
    var list = OB.loadNews().filter(function (x) { return x.id !== id; });
    OB.saveNews(list); render(); toast('삭제되었습니다. 공개 뉴스룸에 반영됨');
    if (f.id.value === id) resetForm();
  }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!f.checkValidity()) { f.reportValidity(); return; }
    var list = OB.loadNews();
    var rec = { id: f.id.value || uid(), type: f.type.value, date: f.date.value, title: { ko: f.ko.value.trim(), en: (f.en.value.trim() || f.ko.value.trim()) } };
    var i = list.findIndex(function (x) { return x.id === rec.id; });
    if (i >= 0) { list[i] = rec; toast('수정 저장 — 공개 뉴스룸 반영'); } else { list.unshift(rec); toast('등록 완료 — 공개 뉴스룸 반영'); }
    OB.saveNews(list); render(); resetForm();
  });
  $('#newBtn').onclick = resetForm;
  $('#cancelBtn').onclick = resetForm;
  $('#resetBtn').onclick = function () {
    if (confirm('모든 자료를 초기 샘플 상태로 되돌립니다. 계속할까요?')) { OB.resetNews(); render(); resetForm(); toast('초기화되었습니다.'); }
  };

  resetForm(); render();
})();
