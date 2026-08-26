// 데모73 공통 UI: 헤더·드로어·피드백·검증된 목 상태·운영 패널
import { CAMPS, STORAGE_KEY, CAMP_STORAGE_KEY, PG_CHECKLIST } from './data.js';
import {
  transitionStatus, reservationsToCSV, RESERVATION_STATUS, formatKRW,
  sanitizeReservationList, validateCampRecord, escapeHTML,
} from './core.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initHeader() {
  const header = $('.site-header');
  if (!header) return;
  let lastY = window.scrollY;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      header.classList.toggle('is-hidden', y > 120 && y > lastY);
      lastY = y;
      ticking = false;
    });
  }, { passive: true });
}

function trapFocus(event, panel, close) {
  if (event.key === 'Escape') { close(); return; }
  if (event.key !== 'Tab') return;
  const items = $$(FOCUSABLE, panel).filter((el) => el.offsetParent !== null);
  if (!items.length) { event.preventDefault(); return; }
  const first = items[0];
  const last = items.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

export function initMobileDrawer() {
  const toggle = $('.nav-toggle');
  const drawer = $('.mobile-drawer');
  if (!toggle || !drawer) return;
  const panel = $('.panel', drawer);
  const closeBtn = $('.close-btn', drawer);
  let lastFocus = null;
  const onKey = (event) => trapFocus(event, panel, close);
  function open() {
    lastFocus = document.activeElement;
    drawer.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    closeBtn.focus();
    document.addEventListener('keydown', onKey);
  }
  function close() {
    drawer.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKey);
    lastFocus?.focus();
  }
  toggle.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  $('.scrim', drawer).addEventListener('click', close);
}

export function toast(message, type = 'status') {
  let root = $('.toast-root');
  if (!root) {
    root = document.createElement('div');
    root.className = 'toast-root';
    document.body.appendChild(root);
  }
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' toast-error' : ''}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.textContent = message;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2800);
}

export function initReveal() {
  const targets = $$('.reveal, .reveal-card');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('in')); return; }
  const groups = new Map();
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      if (el.classList.contains('reveal-card')) {
        const index = groups.get(el.parentElement) || 0;
        el.style.transitionDelay = `${Math.min(index * 0.15, 0.9)}s`;
        groups.set(el.parentElement, index + 1);
      }
      el.classList.add('in');
      io.unobserve(el);
    }
  }, { threshold: 0.3, rootMargin: '0px 0px -10% 0px' });
  targets.forEach((target) => io.observe(target));
}

export function countUp(el, target, { duration = 1000 } = {}) {
  const fmt = (n) => formatKRW(Math.round(n));
  el.style.minWidth = `${el.offsetWidth || fmt(target).length * 12}px`;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmt(target); return; }
  const start = target * 0.7;
  const started = performance.now();
  function tick(now) {
    const progress = Math.min(1, (now - started) / duration);
    el.textContent = fmt(start + (target - start) * progress);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function initCountUp(root = document) {
  const targets = $$('[data-countup]', root);
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => { el.textContent = formatKRW(Number(el.dataset.countup)); }); return; }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      countUp(entry.target, Number(entry.target.dataset.countup));
      io.unobserve(entry.target);
    }
  }, { threshold: 0.3 });
  targets.forEach((el) => io.observe(el));
}

export function loadCamps() {
  const defaults = () => CAMPS.map((camp) => ({ ...structuredClone(camp), visible: true }));
  try {
    const parsed = JSON.parse(localStorage.getItem(CAMP_STORAGE_KEY) || 'null');
    if (!Array.isArray(parsed)) return defaults();
    const safe = parsed.map(validateCampRecord).filter(Boolean);
    return safe.length ? safe : defaults();
  } catch { return defaults(); }
}

export function saveCamps(list) {
  const safe = list.map(validateCampRecord).filter(Boolean);
  localStorage.setItem(CAMP_STORAGE_KEY, JSON.stringify(safe));
  window.dispatchEvent(new CustomEvent('campflow:camps', { detail: safe }));
  return safe;
}

export function loadReservations() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const safe = sanitizeReservationList(parsed, loadCamps());
    if (JSON.stringify(parsed) !== JSON.stringify(safe)) localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    return safe;
  } catch { return []; }
}

export function saveReservations(list) {
  const safe = sanitizeReservationList(list, loadCamps());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  window.dispatchEvent(new CustomEvent('campflow:reservations', { detail: safe }));
}

export function resetDemoData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CAMP_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('campflow:reservations', { detail: [] }));
  window.dispatchEvent(new CustomEvent('campflow:camps', { detail: CAMPS }));
}

export function findReservation(code) {
  return loadReservations().find((r) => r.code === code) || null;
}

export function updateReservationStatus(code, next) {
  const list = loadReservations();
  const reservation = list.find((item) => item.code === code);
  if (!reservation) return { ok: false, reason: '예약을 찾을 수 없어요.' };
  const applied = transitionStatus(reservation.status, next);
  if (!applied) return { ok: false, reason: '현재 상태에서는 바꿀 수 없어요.' };
  reservation.status = applied;
  reservation.history = [...reservation.history, { status: applied, at: new Date().toISOString() }];
  saveReservations(list);
  return { ok: true, reservation };
}

export function downloadReservationsCSV() {
  const rows = loadReservations();
  const blob = new Blob([reservationsToCSV(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `campflow-reservations-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return rows.length;
}

const ADMIN_NEXT = [
  ['contacting', '캠핑장 확인 중으로'], ['confirmed', '확정'],
  ['alternative', '대체 사이트 제안'], ['cancelled', '취소 완료'],
];
const statusBadge = (status) => ({
  received: 'badge-confirm', contacting: 'badge-confirm', confirmed: 'badge-success',
  alternative: 'badge-available', cancelled: 'badge-error',
})[status] || 'badge-neutral';

export function initAdminDrawer() {
  const trigger = $('[data-admin-open]');
  const drawer = $('.admin-drawer');
  if (!trigger || !drawer) return;
  const panel = $('.panel', drawer);
  const body = $('.panel-body', drawer);
  const closeButton = $('.panel-head .close-btn', drawer);
  let lastFocus = null;
  let inerted = [];
  let editingId = null;
  const onKey = (event) => trapFocus(event, panel, close);

  function setBackgroundInert(on) {
    if (on) {
      inerted = [...document.body.children].filter((el) => el !== drawer && !el.classList.contains('toast-root'));
      inerted.forEach((el) => { el.inert = true; });
    } else {
      inerted.forEach((el) => { el.inert = false; });
      inerted = [];
    }
  }
  function open() {
    lastFocus = document.activeElement;
    render();
    drawer.classList.add('open');
    setBackgroundInert(true);
    closeButton.focus();
    document.addEventListener('keydown', onKey);
  }
  function close() {
    drawer.classList.remove('open');
    setBackgroundInert(false);
    document.removeEventListener('keydown', onKey);
    lastFocus?.focus();
  }
  trigger.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  $('.scrim', drawer).addEventListener('click', close);
  window.addEventListener('campflow:reservations', () => { if (drawer.classList.contains('open')) render(); });

  function reservationRows(list) {
    if (!list.length) return '<div class="state-block"><h3>확인할 예약 요청이 없어요.</h3><p>예약 페이지에서 결제 시뮬레이션을 완료하면 표시됩니다.</p></div>';
    return `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>예약번호</th><th>캠핑장</th><th>일정</th><th>금액</th><th>상태</th><th>처리</th></tr></thead><tbody>${list.map((r) => `
      <tr><td class="num">${escapeHTML(r.code)}</td><td>${escapeHTML(r.campName)}<br><span class="small">${escapeHTML(r.siteName)}</span></td>
      <td class="num">${escapeHTML(r.checkIn)} ~ ${escapeHTML(r.checkOut)}</td><td class="num">₩${formatKRW(r.total)}</td>
      <td><span class="badge ${statusBadge(r.status)}">${RESERVATION_STATUS[r.status]}</span></td><td><div class="admin-status-btns" role="group" aria-label="예약 상태 변경">
      ${ADMIN_NEXT.filter(([next]) => transitionStatus(r.status, next)).map(([next, label], index) => `<button type="button" class="btn ${index === 0 ? 'btn-primary' : 'btn-ghost'} btn-compact" data-code="${escapeHTML(r.code)}" data-next="${next}">${label}</button>`).join('')}</div></td></tr>`).join('')}</tbody></table></div>`;
  }

  function campRows(camps) {
    return camps.map((camp) => `<li class="admin-camp-row"><div><strong>${escapeHTML(camp.name)}</strong><br><span class="small">${escapeHTML(camp.region)} · ₩${formatKRW(camp.pricePerNight)} · ${camp.visible ? '노출' : '숨김'} · 옵션 ${camp.options.length}개</span></div><button type="button" class="btn btn-secondary btn-compact" data-edit-camp="${escapeHTML(camp.id)}">수정</button></li>`).join('');
  }

  function editor(camps) {
    const current = camps.find((camp) => camp.id === editingId);
    if (editingId === null) return '';
    const camp = current || { name: '', region: '가평', pricePerNight: 60000, visible: true, options: [] };
    const optionsText = camp.options.map((option) => `${option.name}|${option.price}`).join('\n');
    return `<form id="camp-editor" class="admin-editor" data-id="${escapeHTML(current?.id || '')}">
      <h4>${current ? '캠핑장 수정' : '가상 캠핑장 등록'}</h4>
      <div class="field"><label for="admin-camp-name">이름</label><input class="input" id="admin-camp-name" value="${escapeHTML(camp.name)}" required maxlength="40"></div>
      <div class="field"><label for="admin-camp-region">지역</label><select class="select" id="admin-camp-region">${['가평','춘천','강릉','태안','제주'].map((r) => `<option ${r === camp.region ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
      <div class="field"><label for="admin-camp-price">기본가</label><input class="input" id="admin-camp-price" type="number" min="0" max="1000000" value="${camp.pricePerNight}" required></div>
      <label class="checkline"><input id="admin-camp-visible" type="checkbox" ${camp.visible ? 'checked' : ''}><span>검색 결과에 노출</span></label>
      <div class="field"><label for="admin-camp-options">옵션 (한 줄에 이름|가격)</label><textarea class="textarea" id="admin-camp-options" maxlength="500">${escapeHTML(optionsText)}</textarea></div>
      <div class="filter-row"><button class="btn btn-primary" type="submit">목 상태 저장</button><button class="btn btn-secondary" type="button" data-cancel-edit>취소</button></div>
      <p class="small">이 브라우저의 목 상태만 바뀌며 서버나 실제 업체에는 전송되지 않습니다.</p></form>`;
  }

  function render() {
    const list = loadReservations().slice().reverse();
    const camps = loadCamps();
    const today = new Date().toISOString().slice(0, 10);
    const waiting = list.filter((r) => ['received', 'contacting'].includes(r.status)).length;
    body.innerHTML = `
      <section><div class="admin-kpis"><div class="admin-kpi"><div class="k-num num" data-countup="${list.filter((r) => r.createdAt.startsWith(today)).length}">0</div><div class="k-label">오늘 접수</div></div><div class="admin-kpi"><div class="k-num num" data-countup="${waiting}">0</div><div class="k-label">확인 대기</div></div><div class="admin-kpi"><div class="k-num num" data-countup="${camps.length}">0</div><div class="k-label">가상 캠핑장</div></div></div></section>
      <section><div class="admin-section-head"><h3>예약 요청 ${list.length}건</h3>${list.length ? '<button type="button" class="btn btn-secondary btn-compact" data-csv>CSV 내보내기</button>' : ''}</div>${reservationRows(list)}</section>
      <section><h3>PG 준비 체크리스트 <span class="badge badge-neutral">데모 상태</span></h3><ul class="pg-checklist">${PG_CHECKLIST.map((item) => `<li><span>${escapeHTML(item.label)}</span><span class="badge badge-confirm">${escapeHTML(item.state)}</span></li>`).join('')}</ul></section>
      <section><div class="admin-section-head"><h3>캠핑장 목 관리</h3><button type="button" class="btn btn-primary btn-compact" data-new-camp>가상 캠핑장 등록</button></div><ul class="admin-camp-list">${campRows(camps)}</ul>${editor(camps)}</section>
      <button type="button" class="btn btn-destructive btn-compact" data-reset-demo>이 브라우저의 데모 데이터 초기화</button>`;
    initCountUp(body);
    bindEvents(camps);
  }

  function bindEvents(camps) {
    $('[data-csv]', body)?.addEventListener('click', () => {
      const count = downloadReservationsCSV();
      toast(count ? `예약 요청 ${count}건을 CSV로 내보냈어요.` : '빈 CSV 양식을 내보냈어요.');
    });
    $$('[data-next]', body).forEach((button) => button.addEventListener('click', () => {
      const result = updateReservationStatus(button.dataset.code, button.dataset.next);
      toast(result.ok ? `상태가 저장됐어요: ${RESERVATION_STATUS[result.reservation.status]}` : result.reason, result.ok ? 'status' : 'error');
      render();
    }));
    $$('[data-edit-camp]', body).forEach((button) => button.addEventListener('click', () => { editingId = button.dataset.editCamp; render(); $('#admin-camp-name', body)?.focus(); }));
    $('[data-new-camp]', body)?.addEventListener('click', () => { editingId = ''; render(); $('#admin-camp-name', body)?.focus(); });
    $('[data-cancel-edit]', body)?.addEventListener('click', () => { editingId = null; render(); });
    $('[data-reset-demo]', body)?.addEventListener('click', () => { resetDemoData(); editingId = null; toast('이 브라우저의 데모 데이터를 초기화했어요.'); render(); });
    $('#camp-editor', body)?.addEventListener('submit', (event) => {
      event.preventDefault();
      const existing = camps.find((camp) => camp.id === event.currentTarget.dataset.id);
      const template = structuredClone(existing || CAMPS[0]);
      const name = $('#admin-camp-name', body).value.trim();
      const optionLines = $('#admin-camp-options', body).value.split('\n').map((line) => line.trim()).filter(Boolean);
      const options = optionLines.map((line, index) => {
        const [optionName, rawPrice] = line.split('|');
        return { id: `demo-option-${index + 1}`, name: optionName?.trim(), price: Number(rawPrice), unit: '개' };
      });
      const candidate = {
        ...template, id: existing?.id || `demo-camp-${Date.now()}`, name,
        region: $('#admin-camp-region', body).value,
        pricePerNight: Number($('#admin-camp-price', body).value),
        visible: $('#admin-camp-visible', body).checked,
        options,
      };
      const valid = validateCampRecord(candidate);
      if (!valid) { toast('이름·가격·옵션 형식을 확인해 주세요.', 'error'); return; }
      const next = existing ? camps.map((camp) => camp.id === existing.id ? valid : camp) : [...camps, valid];
      saveCamps(next);
      editingId = null;
      toast(existing ? '가상 캠핑장 정보를 수정했어요.' : '가상 캠핑장을 등록했어요.');
      render();
    });
  }
}

export function boot() {
  initHeader();
  initMobileDrawer();
  initReveal();
  initCountUp();
  initAdminDrawer();
}
