/* ============================================================
   VOLTA Scheduler — 모바일 현장뷰 (기술자 전용)
   views: my (내 일정) · myoff (휴가 신청)
   Prefix: m-
   ============================================================ */
(function (w, d) {
  "use strict";
  const UI = w.UI, DB = w.DB;
  const { icon, fmt, $, $$, esc, toast, modal, confirm, avatar, badge, empty, store } = UI;

  /* ---------- 1회 CSS 주입 ---------- */
  function injectCSS() {
    if (d.getElementById("css-mobile")) return;
    const s = d.createElement("style");
    s.id = "css-mobile";
    s.textContent = `
.m-my,.m-off{max-width:520px;margin:0 auto;display:flex;flex-direction:column;gap:18px}

/* 변경 알림 배너 */
.m-alerts{display:flex;flex-direction:column;gap:8px}
.m-alert{
  display:flex;align-items:flex-start;gap:10px;padding:12px 10px 12px 14px;
  background:var(--accent-soft);border:1px solid color-mix(in srgb,var(--accent) 32%,var(--line));
  border-radius:var(--r-md);font-size:13px;line-height:1.5;
  animation:mrise .4s var(--ease) both;
}
.m-alert__ic{color:var(--accent);flex:0 0 auto;margin-top:1px}
.m-alert__txt{flex:1;min-width:0;color:var(--ink-2);overflow-wrap:anywhere}
.m-alert__txt b{color:var(--ink)}
.m-alert__x{flex:0 0 auto;width:30px;height:30px}

/* 히어로 */
.m-hero{
  position:relative;overflow:hidden;border-radius:var(--r-xl);
  background:var(--surface);border:1px solid var(--line);box-shadow:var(--sh-2);
  padding:20px 20px 22px;animation:mrise .5s var(--ease) both;
}
.m-hero::before{
  content:"";position:absolute;inset:0 0 auto 0;height:5px;
  background:var(--m-hero-color,var(--accent));
}
.m-hero__date{font-size:12.5px;font-weight:800;letter-spacing:.06em;color:var(--muted);text-transform:uppercase}
.m-hero__proj{display:flex;align-items:flex-start;gap:12px;margin-top:12px;min-width:0}
.m-hero__dot{width:14px;height:14px;border-radius:5px;flex:0 0 14px;margin-top:6px;background:var(--m-hero-color,var(--accent))}
.m-hero__proj>div{min-width:0;flex:1}
.m-hero__code{font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:1.1;overflow-wrap:anywhere}
.m-hero__name{font-size:14.5px;color:var(--muted);font-weight:600;margin-top:3px;line-height:1.4;overflow-wrap:anywhere}
.m-hero__meta{display:flex;align-items:center;gap:12px;margin-top:16px;flex-wrap:wrap}
.m-hero__meta .badge{height:26px;font-size:11.5px;padding:0 11px}
.m-hero__hours{display:inline-flex;align-items:center;gap:5px;font-size:13.5px;font-weight:700;color:var(--ink-2)}
.m-hero__hours svg{width:15px;height:15px;color:var(--faint)}
.m-hero__addr{display:flex;align-items:flex-start;gap:7px;margin-top:12px;font-size:13.5px;color:var(--ink-2);line-height:1.5;min-width:0}
.m-hero__addr svg{width:16px;height:16px;flex:0 0 16px;color:var(--faint);margin-top:1px}
.m-hero__addr span{flex:1;min-width:0;overflow-wrap:anywhere}
.m-hero__multi{display:flex;align-items:center;gap:6px;margin-top:10px;font-size:12px;font-weight:700;color:var(--warn)}
.m-hero__multi svg{width:14px;height:14px;flex:0 0 auto}
.m-hero__actions{display:flex;gap:10px;margin-top:18px}
.m-hero__btn{flex:1 1 0;min-width:0;height:auto;min-height:52px;padding:10px 12px;font-size:13.5px;line-height:1.25;border-radius:var(--r-lg);white-space:normal;text-align:center}

.m-hero--empty .m-hero__empty,.m-hero--leave .m-hero__leave{display:flex;flex-direction:column;align-items:center;text-align:center;padding:14px 6px 4px;gap:6px}
.m-hero--empty .m-hero__emptyic,.m-hero--leave .m-hero__leaveic{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;margin-bottom:4px}
.m-hero--empty .m-hero__emptyic{background:var(--surface-3);color:var(--faint)}
.m-hero--leave .m-hero__leaveic{background:var(--ok-bg);color:var(--ok)}
.m-hero--empty .m-hero__emptytitle,.m-hero--leave .m-hero__leavetitle{font-size:16px;font-weight:800}
.m-hero--empty .m-hero__next,.m-hero--leave .m-hero__leavesub{font-size:13px;color:var(--muted);line-height:1.6}
.m-hero--empty .m-hero__next b{color:var(--ink);font-size:14px}
.m-hero--leave{--m-hero-color:var(--ok)}

/* 주간 스트립 */
.m-week{margin:0 -2px}
.m-week__scroll{display:flex;gap:8px;overflow-x:auto;padding:2px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.m-week__scroll::-webkit-scrollbar{display:none}
.m-day{
  scroll-snap-align:start;flex:0 0 auto;width:56px;min-height:76px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
  border-radius:var(--r-lg);border:1px solid var(--line);background:var(--surface);
  padding:10px 4px 8px;transition:border-color var(--fast),background var(--fast),transform var(--fast);
}
.m-day:active{transform:scale(.96)}
.m-day__dow{font-size:10.5px;font-weight:700;color:var(--faint);letter-spacing:.04em}
.m-day__num{font-size:17px;font-weight:800;line-height:1}
.m-day__dots{display:flex;gap:2px;height:6px;align-items:center}
.m-day__dots i{width:6px;height:6px;border-radius:99px;display:block}
.m-day__sub{font-size:9.5px;font-weight:700;color:var(--muted);white-space:nowrap}
.m-day.is-today{border-color:var(--accent);background:var(--accent-soft)}
.m-day.is-today .m-day__num{color:var(--accent)}
.m-day.is-off .m-day__sub{color:var(--faint)}

/* 이번 달 리스트 */
.m-list__hd{font-size:15.5px;font-weight:800;letter-spacing:-.01em;margin-bottom:10px;padding:0 2px}
.m-list__body{display:flex;flex-direction:column;gap:14px}
.m-daygroup{border-radius:var(--r-lg);animation:mrise .4s var(--ease) both}
.m-daygroup__hd{display:flex;align-items:center;gap:8px;padding:2px 4px 8px;font-size:13px;font-weight:800;color:var(--ink-2)}
.m-daygroup.is-today .m-daygroup__hd{color:var(--accent)}
.m-daygroup.is-past{opacity:.5}
.m-daygroup__items{display:flex;flex-direction:column;gap:8px}
.m-daygroup.m-flash{animation:mflash 1s var(--ease)}
@keyframes mflash{0%{box-shadow:0 0 0 3px var(--accent);border-radius:var(--r-lg)}100%{box-shadow:0 0 0 0 transparent}}
@keyframes mrise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

.m-item{
  display:flex;align-items:stretch;width:100%;text-align:left;
  background:var(--surface);border:1px solid var(--line);border-radius:var(--r-md);
  overflow:hidden;box-shadow:var(--sh-1);transition:border-color var(--fast),transform var(--fast);
  min-height:64px;
}
.m-item:active{transform:scale(.985)}
.m-item__bar{width:5px;flex:0 0 5px}
.m-item__body{flex:1;min-width:0;padding:11px 12px}
.m-item__top{display:flex;align-items:baseline;gap:8px;min-width:0}
.m-item__top b{font-size:14.5px;font-weight:800;flex:0 1 auto;min-width:0;overflow-wrap:anywhere}
.m-item__pname{font-size:12.5px;color:var(--muted);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}
.m-item__sub{display:flex;align-items:center;gap:8px;margin-top:5px;font-size:12px;color:var(--ink-2);font-weight:700;flex-wrap:wrap}
.m-item__sub .badge{height:20px;font-size:10px;padding:0 8px}
.m-item__sub span{display:inline-flex;align-items:center;gap:3px}
.m-item__sub svg{width:12px;height:12px;color:var(--faint)}
.m-item__addr{display:flex;align-items:center;gap:5px;margin-top:5px;font-size:11.5px;color:var(--faint);min-width:0}
.m-item__addr svg{width:12px;height:12px;flex:0 0 12px}
.m-item__addrtext{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.m-item__chev{flex:0 0 auto;display:grid;place-items:center;padding:0 10px;color:var(--faint)}
.m-item__chev svg{width:16px;height:16px}

/* 근무 요약 */
.m-summary{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);padding:18px;box-shadow:var(--sh-1)}
.m-summary__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
.m-summary__cell{text-align:center;padding:10px 4px;border-radius:var(--r-md);background:var(--surface-2)}
.m-summary__cell b{display:block;font-size:22px;font-weight:800;letter-spacing:-.02em}
.m-summary__cell span{display:block;font-size:11px;color:var(--muted);font-weight:700;margin-top:2px}

/* 상세 바텀시트 */
.m-detail{display:flex;flex-direction:column;gap:16px}
.m-detail__proj{display:flex;align-items:center;gap:10px}
.m-detail__dot{width:12px;height:12px;border-radius:4px;flex:0 0 12px}
.m-detail__code{font-size:17px;font-weight:800}
.m-detail__name{font-size:12.5px;color:var(--muted);font-weight:600}
.m-detail__grid{display:flex;flex-direction:column;gap:9px;padding:14px;background:var(--surface-2);border-radius:var(--r-md)}
.m-detail__kv{display:flex;justify-content:space-between;gap:12px;font-size:13px}
.m-detail__kv span{color:var(--muted);font-weight:600;flex:0 0 auto}
.m-detail__kv b{font-weight:700;text-align:right;flex:1;min-width:0;overflow-wrap:anywhere}
.m-detail__sec h4{font-size:12px;font-weight:800;color:var(--muted);letter-spacing:.03em;margin-bottom:8px;text-transform:uppercase}
.m-detail__empty{font-size:12.5px;color:var(--faint)}
.m-detail__crew{display:flex;flex-wrap:wrap;gap:8px}
.m-crewchip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 4px;border-radius:99px;background:var(--surface-2);font-size:12px;font-weight:700;color:var(--ink-2)}
.m-detail__lead{display:flex;align-items:center;gap:10px;padding:12px;background:var(--surface-2);border-radius:var(--r-md)}
.m-detail__lead>div{flex:1;min-width:0}
.m-detail__lead b{display:block;font-size:13.5px}
.m-detail__lead span{display:block;font-size:12px;color:var(--muted);margin-top:1px}

/* 휴가 신청 화면 */
.m-offsum__top{display:flex;align-items:center;gap:18px}
.m-offsum__ring{position:relative;width:92px;height:92px;flex:0 0 92px}
.m-ring{width:92px;height:92px;transform:rotate(-90deg)}
.m-ring__bg{fill:none;stroke:var(--surface-3);stroke-width:9}
.m-ring__fg{fill:none;stroke:var(--accent);stroke-width:9;stroke-linecap:round;transition:stroke-dashoffset .8s var(--ease)}
.m-ring__label{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.m-ring__label b{font-size:22px;font-weight:800;line-height:1}
.m-ring__label span{font-size:10px;color:var(--muted);font-weight:700;margin-top:1px}
.m-offsum__stats{flex:1;display:flex;justify-content:space-around;text-align:center}
.m-offsum__stats div b{display:block;font-size:19px;font-weight:800}
.m-offsum__stats div span{display:block;font-size:10.5px;color:var(--muted);font-weight:700;margin-top:2px}

.m-off__cta{border-radius:var(--r-lg)}

.m-steps{display:flex;align-items:flex-start;padding:16px 10px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--sh-1)}
.m-step{display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;min-width:0}
.m-step__n{width:26px;height:26px;border-radius:99px;background:var(--surface-3);color:var(--muted);display:grid;place-items:center;font-size:12px;font-weight:800;flex:0 0 auto}
.m-step__t{font-size:10px;font-weight:700;color:var(--muted);text-align:center;line-height:1.3;padding:0 2px}
.m-step__ln{flex:1 1 auto;height:2px;background:var(--line);margin:12px -4px 0;min-width:6px}

.m-typerow{gap:8px}
.m-typechip{
  height:38px;padding:0 14px;border-radius:var(--r-full);
  background:var(--surface-3);border:1.5px solid transparent;color:var(--ink-2);
  display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;
  transition:all var(--fast);
}
.m-typechip svg{width:14px;height:14px}
.m-typechip.is-on{background:var(--accent-soft);border-color:var(--accent);color:var(--accent)}
.m-offdays{font-size:12.5px;font-weight:700;color:var(--muted);padding:0 2px}
.m-optional{font-weight:600;color:var(--faint)}

/* 타임라인 */
.m-timeline{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);padding:4px 14px;box-shadow:var(--sh-1)}
.m-tlitem{display:flex;gap:12px;padding:14px 2px;border-bottom:1px solid var(--line)}
.m-tlitem:last-child{border-bottom:0}
.m-tlitem__dot{width:10px;height:10px;border-radius:99px;flex:0 0 10px;margin-top:5px;background:var(--faint)}
.m-tlitem--pending .m-tlitem__dot{background:var(--warn)}
.m-tlitem--approved .m-tlitem__dot{background:var(--ok)}
.m-tlitem--rejected .m-tlitem__dot{background:var(--danger)}
.m-tlitem__bd{flex:1;min-width:0}
.m-tlitem__hd{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.m-tlitem__range{font-size:13.5px;font-weight:700;margin-top:6px}
.m-tlitem__note{font-size:12.5px;color:var(--muted);margin-top:3px;line-height:1.5}
.m-tlitem__cancel{margin-top:9px}
.m-reject-reason{display:flex;align-items:flex-start;gap:6px;margin-top:8px;padding:9px 11px;background:var(--danger-bg);color:var(--danger-fg);border-radius:var(--r-sm);font-size:12px;line-height:1.5}
.m-reject-reason svg{width:13px;height:13px;flex:0 0 13px;margin-top:1px}

.m-status{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:800}
.m-status svg{width:13px;height:13px}
.m-status--pending{color:var(--warn)}
.m-status--approved{color:var(--ok)}
.m-status--rejected{color:var(--danger)}
.m-pulse{width:8px;height:8px;border-radius:99px;background:var(--warn);position:relative;display:inline-block}
.m-pulse::after{content:"";position:absolute;inset:-4px;border-radius:99px;border:2px solid var(--warn);animation:mpulse 1.6s ease-out infinite}
@keyframes mpulse{0%{opacity:.9;transform:scale(.6)}100%{opacity:0;transform:scale(1.9)}}
`;
    d.head.appendChild(s);
  }
  injectCSS();

  /* ---------- 상수 / 메타 ---------- */
  const ME = DB.ME_TECH;
  const LEAVE_TOTAL = 15; // 데모 고정 연차 정책 (모든 기술자 공통 가정)

  const SHIFT_META = {
    day:       { label: "주간", ic: "sun",  cls: "badge--info" },
    morning:   { label: "오전", ic: "sun",  cls: "badge--ok" },
    afternoon: { label: "오후", ic: "sun",  cls: "badge--warn" },
    night:     { label: "야간", ic: "moon", cls: "badge--solid" },
  };
  const TYPE_LABEL = { pto: "유급휴가", off: "무급결근", sick: "병가", training: "교육" };
  const TYPE_ICON  = { pto: "sun", off: "userX", sick: "alertCircle", training: "layers" };
  const REJECT_REASONS = [
    "현장 인력 운영상 인원 부족으로 반려되었습니다.",
    "동일 기간 신청이 집중되어 대체 인력 확보가 어렵습니다.",
    "성수기 필수 인력으로 배정 유지가 필요합니다.",
    "직전 통보로 인수인계 일정 확보가 어렵습니다.",
  ];

  /* ---------- 데이터 헬퍼 ---------- */
  const todayStr = () => DB.DATE.iso(DB.DATE.TODAY);

  function myAssignments() {
    return w.STATE.assignments
      .filter((a) => a.techId === ME.id)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }
  function myTimeoff() {
    return w.STATE.timeoff.filter((v) => v.techId === ME.id);
  }
  function assignmentsInRange(start, end) {
    return myAssignments().filter((a) => a.date >= start && a.date <= end);
  }
  function usedLeaveDays() {
    return myTimeoff()
      .filter((v) => v.status === "approved")
      .reduce((sum, v) => sum + fmt.days(v.start, v.end), 0);
  }
  function crewFor(projectId, date, excludeId) {
    const seen = new Set(), list = [];
    w.STATE.assignments.forEach((a) => {
      if (a.projectId === projectId && a.date === date && a.techId !== excludeId && !seen.has(a.techId)) {
        seen.add(a.techId);
        list.push(DB.T[a.techId]);
      }
    });
    return list;
  }
  function equipmentFor(projectId) {
    return DB.EQUIP.filter((e) => e.projectId === projectId);
  }
  function reasonSeed(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return h;
  }
  function rejectReason(v) {
    // 데이터에 결재자가 남긴 사유가 있으면 그것을 우선 사용
    return v.rejectReason || REJECT_REASONS[reasonSeed(v.id) % REJECT_REASONS.length];
  }
  function detectChanges() {
    const upcoming = myAssignments().filter((a) => a.date >= todayStr());
    const out = [];
    for (let i = 1; i < upcoming.length; i++) {
      if (upcoming[i].projectId !== upcoming[i - 1].projectId) {
        out.push({ id: "chg-" + upcoming[i].id, date: upcoming[i].date, from: upcoming[i - 1].projectId, to: upcoming[i].projectId });
      }
    }
    return out.slice(0, 2);
  }
  function dismissedChangeIds() {
    try { return JSON.parse(store.get("mychange.dismissed", "[]")) || []; } catch (e) { return []; }
  }

  /* ============================================================
     view: my — 내 일정
     ============================================================ */

  function renderAlerts() {
    const dismissed = dismissedChangeIds();
    const changes = detectChanges().filter((c) => dismissed.indexOf(c.id) === -1);
    if (!changes.length) return "";
    const items = changes.map((c) => {
      const from = DB.P[c.from], to = DB.P[c.to];
      return `<div class="m-alert" data-cid="${c.id}">
        <span class="m-alert__ic">${icon("swap", 16)}</span>
        <span class="m-alert__txt">${fmt.d(c.date)} 배정이 <b>${esc(from.code)}</b> → <b>${esc(to.code)}</b>로 변경되었습니다.</span>
        <button class="iconbtn m-alert__x" aria-label="알림 닫기">${icon("x", 15)}</button>
      </div>`;
    }).join("");
    return `<div class="m-alerts">${items}</div>`;
  }

  function renderHero() {
    const ts = todayStr();
    const dt = DB.DATE.TODAY;
    const dateLabel = `${dt.getMonth() + 1}월 ${dt.getDate()}일 (${UI.DOW_KO[dt.getDay()]})`;

    if (DB.isOff(ME.id, ts)) {
      const v = myTimeoff().find((x) => x.status === "approved" && ts >= x.start && ts <= x.end);
      const typeLabel = v ? (TYPE_LABEL[v.type] || v.type) : "휴가";
      return `<section class="m-hero m-hero--leave">
        <div class="m-hero__date">${dateLabel}</div>
        <div class="m-hero__leave">
          <div class="m-hero__leaveic">${icon("calendarOff", 24)}</div>
          <div class="m-hero__leavetitle">오늘은 ${esc(typeLabel)}입니다</div>
          <div class="m-hero__leavesub">${v ? `${fmt.range(v.start, v.end)} 기간 승인된 휴가` : "즐거운 하루 보내세요."}</div>
        </div>
      </section>`;
    }

    const todays = assignmentsInRange(ts, ts);
    if (!todays.length) {
      const next = myAssignments().find((a) => a.date > ts);
      return `<section class="m-hero m-hero--empty">
        <div class="m-hero__date">${dateLabel}</div>
        <div class="m-hero__empty">
          <div class="m-hero__emptyic">${icon("calendarOff", 26)}</div>
          <div class="m-hero__emptytitle">오늘은 배정된 현장이 없습니다</div>
          <div class="m-hero__next">${next
            ? `다음 배정 · ${fmt.dLong(next.date)}<br><b>${esc(DB.P[next.projectId].code)} — ${esc(DB.P[next.projectId].name)}</b>`
            : "예정된 배정이 아직 없습니다."}</div>
        </div>
      </section>`;
    }

    const a = todays[0];
    const p = DB.P[a.projectId];
    const sm = SHIFT_META[a.shift];
    const lead = DB.U[p.lead];
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.addr)}`;
    const tel = lead ? "tel:" + lead.phone.replace(/[^\d+]/g, "") : "";
    return `<section class="m-hero" style="--m-hero-color:${DB.projColor(p)}">
      <div class="m-hero__date">${dateLabel}</div>
      <div class="m-hero__proj">
        <span class="m-hero__dot"></span>
        <div>
          <div class="m-hero__code">${esc(p.code)}</div>
          <div class="m-hero__name">${esc(p.name)}</div>
        </div>
      </div>
      <div class="m-hero__meta">
        <span class="badge ${sm.cls}">${icon(sm.ic, 12)} ${sm.label}</span>
        <span class="m-hero__hours">${icon("clock", 15)} ${a.hours}시간</span>
      </div>
      <div class="m-hero__addr">${icon("pin", 16)}<span>${esc(p.addr)}</span></div>
      ${todays.length > 1 ? `<div class="m-hero__multi">${icon("alertCircle", 13)} 오늘 ${todays.length}건의 배정이 있습니다. 아래 목록을 확인하세요.</div>` : ""}
      <div class="m-hero__actions">
        <a class="btn m-hero__btn" href="${mapsUrl}" target="_blank" rel="noopener">${icon("map", 16)} 지도 열기</a>
        ${lead ? `<a class="btn btn--primary m-hero__btn" href="${tel}">${icon("phone", 16)} 리드에게 전화</a>` : ""}
      </div>
    </section>`;
  }

  function renderWeekStrip() {
    const ts = todayStr();
    const start = DB.DATE.addDays(DB.DATE.TODAY, -DB.DATE.TODAY.getDay());
    const chips = [];
    for (let i = 0; i < 7; i++) {
      const dte = DB.DATE.addDays(start, i);
      const ds = DB.DATE.iso(dte);
      const isToday = ds === ts;
      const dayAssigns = assignmentsInRange(ds, ds);
      const onLeave = DB.isOff(ME.id, ds);
      const holiday = DB.HOLIDAYS[ds];
      const weekend = DB.DATE.isWeekend(dte);
      let sub = "-", dots = "", isOffLook = false;
      if (onLeave) { sub = "휴가"; isOffLook = true; }
      else if (dayAssigns.length) { dots = dayAssigns.slice(0, 3).map((a) => `<i style="background:${DB.projColor(DB.P[a.projectId])}"></i>`).join(""); sub = SHIFT_META[dayAssigns[0].shift].label; }
      else if (holiday) { sub = "휴일"; isOffLook = true; }
      else if (weekend) { sub = "휴무"; isOffLook = true; }
      const ariaSub = sub !== "-" ? `, ${sub}` : "";
      chips.push(`<button class="m-day ${isToday ? "is-today" : ""} ${isOffLook ? "is-off" : ""}" data-date="${ds}" aria-label="${dte.getMonth() + 1}월 ${dte.getDate()}일 ${UI.DOW_KO[dte.getDay()]}요일${ariaSub}">
        <span class="m-day__dow">${UI.DOW_KO[dte.getDay()]}</span>
        <span class="m-day__num">${dte.getDate()}</span>
        <span class="m-day__dots">${dots}</span>
        <span class="m-day__sub">${sub}</span>
      </button>`);
    }
    return `<section class="m-week"><div class="m-week__scroll">${chips.join("")}</div></section>`;
  }

  function renderMonthList() {
    const y = w.STATE.year, m = w.STATE.month;
    const monthStartStr = DB.DATE.iso(new Date(y, m, 1));
    const monthEndStr = DB.DATE.iso(new Date(y, m + 1, 0));
    const ts = todayStr();
    const all = assignmentsInRange(monthStartStr, monthEndStr);
    const byDate = {};
    all.forEach((a) => { (byDate[a.date] = byDate[a.date] || []).push(a); });
    const dates = Object.keys(byDate).sort();
    if (!dates.length) {
      return `<section class="m-list"><h2 class="m-list__hd">이번 달 일정</h2>${empty("calendar", "일정이 없습니다", "이번 달에는 배정된 현장이 없습니다.")}</section>`;
    }
    const groups = dates.map((ds, gi) => {
      const dte = DB.DATE.parse(ds);
      const isToday = ds === ts, isPast = ds < ts;
      const items = byDate[ds].map((a) => {
        const p = DB.P[a.projectId];
        const sm = SHIFT_META[a.shift];
        return `<button class="m-item" data-aid="${a.id}">
          <span class="m-item__bar" style="background:${DB.projColor(p)}"></span>
          <span class="m-item__body">
            <span class="m-item__top"><b>${esc(p.code)}</b><span class="m-item__pname">${esc(p.name)}</span></span>
            <span class="m-item__sub">
              <span class="badge ${sm.cls}">${sm.label}</span>
              <span>${icon("clock", 12)} ${a.hours}시간</span>
            </span>
            <span class="m-item__addr">${icon("pin", 12)}<span class="m-item__addrtext">${esc(p.addr)}</span></span>
          </span>
          <span class="m-item__chev">${icon("chevR", 16)}</span>
        </button>`;
      }).join("");
      return `<div class="m-daygroup ${isToday ? "is-today" : ""} ${isPast ? "is-past" : ""}" id="mDay-${ds}" style="animation-delay:${Math.min(gi * 35, 300)}ms">
        <div class="m-daygroup__hd">
          <span>${dte.getMonth() + 1}월 ${dte.getDate()}일 (${UI.DOW_KO[dte.getDay()]})</span>
          ${isToday ? '<span class="badge badge--info">오늘</span>' : ""}
        </div>
        <div class="m-daygroup__items">${items}</div>
      </div>`;
    }).join("");
    return `<section class="m-list"><h2 class="m-list__hd">이번 달 일정</h2><div class="m-list__body">${groups}</div></section>`;
  }

  function renderSummary() {
    const monthStartStr = DB.DATE.iso(new Date(w.STATE.year, w.STATE.month, 1));
    const monthEndStr = DB.DATE.iso(new Date(w.STATE.year, w.STATE.month + 1, 0));
    const all = assignmentsInRange(monthStartStr, monthEndStr);
    const workDays = new Set(all.map((a) => a.date)).size;
    const totalHours = all.reduce((s, a) => s + a.hours, 0);
    const remain = Math.max(0, LEAVE_TOTAL - usedLeaveDays());
    return `<section class="m-summary">
      <h2 class="m-list__hd">이번 달 근무 요약</h2>
      <div class="m-summary__grid">
        <div class="m-summary__cell"><b>${workDays}</b><span>근무일</span></div>
        <div class="m-summary__cell"><b>${totalHours}</b><span>근무시간</span></div>
        <div class="m-summary__cell"><b>${remain}</b><span>잔여 휴가일</span></div>
      </div>
    </section>`;
  }

  function openAssignmentDetail(a) {
    const p = DB.P[a.projectId];
    const sm = SHIFT_META[a.shift];
    const crew = crewFor(a.projectId, a.date, ME.id);
    const equip = equipmentFor(a.projectId);
    const lead = DB.U[p.lead];
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.addr)}`;
    const st = DB.STATUS[p.status];
    const body = `
      <div class="m-detail">
        <div class="m-detail__proj">
          <span class="m-detail__dot" style="background:${DB.projColor(p)}"></span>
          <div><div class="m-detail__code">${esc(p.code)}</div><div class="m-detail__name">${esc(p.name)}</div></div>
          ${badge(st.label, st.cls)}
        </div>
        <div class="m-detail__grid">
          <div class="m-detail__kv"><span>날짜</span><b>${fmt.dLong(a.date)}</b></div>
          <div class="m-detail__kv"><span>시프트</span><b>${sm.label} · ${a.hours}시간</b></div>
          <div class="m-detail__kv"><span>주소</span><b>${esc(p.addr)}</b></div>
        </div>
        <a class="btn btn--block" href="${mapsUrl}" target="_blank" rel="noopener">${icon("map", 16)} 지도에서 보기</a>
        <div class="m-detail__sec">
          <h4>함께 근무하는 크루 (${crew.length})</h4>
          ${crew.length
            ? `<div class="m-detail__crew">${crew.slice(0, 10).map((t) => `<span class="m-crewchip">${avatar(t.name, "sm")}<span>${esc(t.name)}</span></span>`).join("")}${crew.length > 10 ? `<span class="m-crewchip">+${crew.length - 10}</span>` : ""}</div>`
            : `<p class="m-detail__empty">함께 배정된 다른 크루가 없습니다.</p>`}
        </div>
        <div class="m-detail__sec">
          <h4>필요 장비</h4>
          ${equip.length
            ? `<div class="row row--wrap" style="gap:6px">${equip.slice(0, 6).map((e) => `<span class="chip">${esc(e.name)}</span>`).join("")}</div>`
            : `<p class="m-detail__empty">등록된 배정 장비가 없습니다.</p>`}
        </div>
        <div class="m-detail__sec">
          <h4>현장 리드</h4>
          ${lead
            ? `<div class="m-detail__lead">
                ${avatar(lead.name)}
                <div><b>${esc(lead.name)}</b><span>${esc(lead.phone)}</span></div>
                <a class="btn btn--icon btn--accent" href="tel:${lead.phone.replace(/[^\d+]/g, "")}" aria-label="전화 걸기">${icon("phone", 16)}</a>
              </div>`
            : `<p class="m-detail__empty">지정된 리드가 없습니다.</p>`}
        </div>
      </div>`;
    modal({ size: "sm", icon: "folder", tone: "info", title: `${p.code} 상세`, desc: esc(p.name), body, actions: [{ label: "닫기", kind: "quiet" }] });
  }

  function bindMy(root) {
    $$(".m-alert__x", root).forEach((b) => (b.onclick = () => {
      const wrap = b.closest(".m-alert");
      const cid = wrap.dataset.cid;
      const arr = dismissedChangeIds();
      arr.push(cid);
      store.set("mychange.dismissed", JSON.stringify(arr));
      wrap.style.transition = "opacity .18s,transform .18s";
      wrap.style.opacity = "0";
      wrap.style.transform = "translateY(-6px)";
      setTimeout(() => wrap.remove(), 180);
    }));
    $$(".m-day", root).forEach((b) => (b.onclick = () => {
      const ds = b.dataset.date;
      const target = d.getElementById("mDay-" + ds);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("m-flash");
        setTimeout(() => target.classList.remove("m-flash"), 950);
      } else {
        toast("해당 날짜에는 일정이 없습니다.", { type: "info" });
      }
    }));
    $$(".m-item", root).forEach((b) => (b.onclick = () => {
      const a = w.STATE.assignments.find((x) => x.id === b.dataset.aid);
      if (a) openAssignmentDetail(a);
    }));
  }

  /* ============================================================
     view: myoff — 휴가 신청
     ============================================================ */

  function renderLeaveSummary() {
    const used = usedLeaveDays();
    const remain = Math.max(0, LEAVE_TOTAL - used);
    const pct = LEAVE_TOTAL ? Math.min(100, Math.round((used / LEAVE_TOTAL) * 100)) : 0;
    const R = 42, C = 2 * Math.PI * R;
    return `<section class="card card--pad">
      <div class="m-offsum__top">
        <div class="m-offsum__ring">
          <svg viewBox="0 0 100 100" class="m-ring">
            <circle cx="50" cy="50" r="${R}" class="m-ring__bg"></circle>
            <circle cx="50" cy="50" r="${R}" class="m-ring__fg" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - pct / 100)}"></circle>
          </svg>
          <div class="m-ring__label"><b>${remain}</b><span>일 남음</span></div>
        </div>
        <div class="m-offsum__stats">
          <div><b>${LEAVE_TOTAL}</b><span>총 연차</span></div>
          <div><b>${used}</b><span>사용</span></div>
          <div><b>${remain}</b><span>잔여</span></div>
        </div>
      </div>
    </section>`;
  }

  function renderSteps() {
    const steps = ["신청", "스케줄러 검토", "승인/반려", "배정 자동 해제"];
    return `<section class="m-steps">
      ${steps.map((s, i) => `<div class="m-step"><span class="m-step__n">${i + 1}</span><span class="m-step__t">${s}</span></div>${i < steps.length - 1 ? '<span class="m-step__ln"></span>' : ""}`).join("")}
    </section>`;
  }

  function renderRequests() {
    const list = myTimeoff().slice().sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (b.status === "pending" && a.status !== "pending") return 1;
      return a.start < b.start ? 1 : a.start > b.start ? -1 : 0;
    });
    if (!list.length) {
      return `<div class="m-timeline" style="padding:0">${empty("calendarOff", "신청 내역이 없습니다", "휴가를 신청하면 이곳에 표시됩니다.")}</div>`;
    }
    const rows = list.map((v) => {
      const type = TYPE_LABEL[v.type] || v.type;
      const days = fmt.days(v.start, v.end);
      let statusHtml, extra = "";
      if (v.status === "pending") {
        statusHtml = `<span class="m-status m-status--pending"><span class="m-pulse"></span>&nbsp;대기중</span>`;
        extra = `<div class="m-tlitem__cancel"><button class="btn btn--sm btn--danger-ghost m-cancel" data-vid="${v.id}">${icon("x", 13)} 신청 취소</button></div>`;
      } else if (v.status === "approved") {
        statusHtml = `<span class="m-status m-status--approved">${icon("checkCircle", 13)} 승인</span>`;
      } else {
        statusHtml = `<span class="m-status m-status--rejected">${icon("x", 13)} 반려</span>`;
        extra = `<div class="m-reject-reason">${icon("info", 13)}<span>${esc(rejectReason(v))}</span></div>`;
      }
      return `<div class="m-tlitem m-tlitem--${v.status}">
        <div class="m-tlitem__dot"></div>
        <div class="m-tlitem__bd">
          <div class="m-tlitem__hd">
            <span class="chip">${icon(TYPE_ICON[v.type] || "info", 13)} ${esc(type)}</span>
            ${statusHtml}
          </div>
          <div class="m-tlitem__range">${fmt.range(v.start, v.end)} · ${days}일</div>
          ${v.note ? `<div class="m-tlitem__note">${esc(v.note)}</div>` : ""}
          ${extra}
        </div>
      </div>`;
    }).join("");
    return `<div class="m-timeline">${rows}</div>`;
  }

  function bindOff(root) {
    const reqBtn = $("#mReqBtn", root);
    if (reqBtn) reqBtn.onclick = () => openRequestForm();
    $$(".m-cancel", root).forEach((b) => (b.onclick = () => {
      const vid = b.dataset.vid;
      confirm({
        title: "휴가 신청을 취소할까요?",
        desc: "취소하면 이 신청 내역이 삭제되며 되돌릴 수 없습니다.",
        okLabel: "신청 취소",
        onOk: () => {
          const idx = w.STATE.timeoff.findIndex((v) => v.id === vid);
          if (idx > -1) w.STATE.timeoff.splice(idx, 1);
          toast("휴가 신청을 취소했습니다.", { type: "info" });
          w.dispatchEvent(new CustomEvent("volta:data"));
          w.VIEWS.myoff.render(root);
        },
      });
    }));
  }

  function openRequestForm() {
    const ts = todayStr();
    let selectedType = DB.TO_TYPES[0].k;
    let refs = {};

    function recalc() {
      const { startEl, endEl, daysEl, warnEl } = refs;
      if (startEl.value && endEl.value && endEl.value < startEl.value) endEl.value = startEl.value;
      const n = (startEl.value && endEl.value) ? fmt.days(startEl.value, endEl.value) : 0;
      daysEl.textContent = n ? `${n}일 신청` : "";
      const conflicts = (startEl.value && endEl.value) ? assignmentsInRange(startEl.value, endEl.value) : [];
      warnEl.innerHTML = conflicts.length
        ? `<div class="note note--warn">${icon("alert", 15)}<span>이 기간에 배정된 현장 <b>${conflicts.length}건</b>이 있습니다. 승인 시 자동 해제됩니다.</span></div>`
        : "";
    }

    function submit() {
      const { startEl, endEl, noteEl } = refs;
      if (!startEl.value || !endEl.value) { toast("시작일과 종료일을 입력하세요.", { type: "danger" }); return false; }
      if (endEl.value < startEl.value) { toast("종료일은 시작일 이후여야 합니다.", { type: "danger" }); return false; }
      const ids = w.STATE.timeoff.map((v) => parseInt(String(v.id).slice(1), 10) || 0);
      const rec = {
        id: "v" + (Math.max(0, ...ids) + 1),
        techId: ME.id, type: selectedType,
        start: startEl.value, end: endEl.value,
        status: "pending", note: noteEl.value.trim(),
        decidedAt: null, decidedBy: null, requestedAt: ts,
      };
      w.STATE.timeoff.push(rec);
      toast("휴가 신청이 접수되었습니다. 스케줄러 검토를 기다려주세요.", { type: "ok" });
      w.dispatchEvent(new CustomEvent("volta:data"));
      const view = d.getElementById("view");
      if (view && view.querySelector(".m-off")) w.VIEWS.myoff.render(view);
      return true;
    }

    const typeChips = DB.TO_TYPES.map((t) =>
      `<button type="button" class="chip m-typechip" data-type="${t.k}">${icon(TYPE_ICON[t.k] || "info", 14)}<span>${esc(TYPE_LABEL[t.k] || t.label)}</span></button>`
    ).join("");

    const body = `
      <div class="stack" style="gap:16px">
        <div class="field">
          <label>휴가 유형</label>
          <div class="row row--wrap m-typerow">${typeChips}</div>
        </div>
        <div class="grid2">
          <div class="field"><label for="mOffStart">시작일</label><input type="date" class="input" id="mOffStart" min="${ts}" value="${ts}"></div>
          <div class="field"><label for="mOffEnd">종료일</label><input type="date" class="input" id="mOffEnd" min="${ts}" value="${ts}"></div>
        </div>
        <div class="m-offdays" id="mOffDays">1일 신청</div>
        <div class="field">
          <label for="mOffNote">사유 <span class="m-optional">(선택)</span></label>
          <textarea class="textarea" id="mOffNote" placeholder="사유를 입력하세요 (선택)"></textarea>
        </div>
        <div id="mOffWarn"></div>
      </div>`;

    modal({
      size: "sm", icon: "calendarOff", tone: "info",
      title: "휴가 신청", desc: "제출 후 대기중 상태로 표시되며, 스케줄러 승인 시 확정됩니다.",
      body,
      actions: [
        { label: "취소", kind: "quiet" },
        { label: "신청하기", kind: "primary", icon: "check", onClick: () => submit() },
      ],
      onMount: (m) => {
        refs = {
          startEl: $("#mOffStart", m), endEl: $("#mOffEnd", m),
          daysEl: $("#mOffDays", m), warnEl: $("#mOffWarn", m), noteEl: $("#mOffNote", m),
        };
        const chips = $$(".m-typechip", m);
        const markType = (k) => { chips.forEach((c) => c.classList.toggle("is-on", c.dataset.type === k)); selectedType = k; };
        chips.forEach((c) => (c.onclick = () => markType(c.dataset.type)));
        markType(selectedType);
        refs.startEl.onchange = recalc;
        refs.endEl.onchange = recalc;
        recalc();
      },
    });
  }

  /* ---------- 뷰 등록 ---------- */
  w.VIEWS = w.VIEWS || {};
  w.VIEWS.my = {
    render(root) {
      root.innerHTML = `
        <div class="m-my">
          ${renderAlerts()}
          ${renderHero()}
          ${renderWeekStrip()}
          ${renderMonthList()}
          ${renderSummary()}
        </div>`;
      bindMy(root);
    },
  };
  w.VIEWS.myoff = {
    render(root) {
      root.innerHTML = `
        <div class="m-off">
          ${renderLeaveSummary()}
          <button class="btn btn--primary btn--lg btn--block m-off__cta" id="mReqBtn">${icon("plus", 18)} 휴가 신청</button>
          ${renderSteps()}
          <section class="m-list">
            <h2 class="m-list__hd">내 신청 내역</h2>
            ${renderRequests()}
          </section>
        </div>`;
      bindOff(root);
    },
    openForm() { openRequestForm(); },
  };
})(window, document);
