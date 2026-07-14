/* ============================================================
   VOLTA Scheduler — Mock Data Layer
   시드 기반 결정론적 생성 (새로고침해도 동일 데이터)
   ============================================================ */
(function (w) {
  "use strict";

  /* ---------- 시드 RNG ---------- */
  let _s = 20260714;
  const rnd = () => ((_s = (_s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const chance = (p) => rnd() < p;

  /* ---------- 날짜 유틸 ---------- */
  const TODAY = new Date(2026, 6, 14); // 2026-07-14
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const isWeekend = (d) => { const g = d.getDay(); return g === 0 || g === 6; };
  const monthDays = (y, m) => { // m: 0-based
    const out = [], last = new Date(y, m + 1, 0).getDate();
    for (let i = 1; i <= last; i++) out.push(new Date(y, m, i));
    return out;
  };

  const DATE = { TODAY, iso, parse, addDays, daysBetween, isWeekend, monthDays, pad };

  /* ---------- 공휴일 (미 현장 기준) ---------- */
  const HOLIDAYS = {
    "2026-07-03": "Independence Day (관측)",
    "2026-07-04": "Independence Day",
    "2026-09-07": "Labor Day",
    "2026-06-19": "Juneteenth",
  };

  /* ---------- 지역 (Region) ---------- */
  const REGIONS = [
    { id: "rg1", name: "Electricians",     code: "ELEC", schedulerId: "u2" },
    { id: "rg2", name: "Instrumentation",  code: "INST", schedulerId: "u3" },
    { id: "rg3", name: "Commissioning",    code: "CMSN", schedulerId: "u4" },
    { id: "rg4", name: "Riggers",          code: "RIGG", schedulerId: "u5" },
    { id: "rg5", name: "Mechanical",       code: "MECH", schedulerId: "u6" },
    { id: "rg6", name: "Controls & DCS",   code: "CTRL", schedulerId: "u7" },
    { id: "rg7", name: "Safety",           code: "SAFE", schedulerId: "u8" },
    { id: "rg8", name: "Apprentice Pool",  code: "APPR", schedulerId: null },
  ];
  const REGION_SIZE = { rg1: 75, rg2: 34, rg3: 26, rg4: 22, rg5: 30, rg6: 20, rg7: 5, rg8: 9 }; // 합 221

  /* ---------- 프로젝트 ---------- */
  const PROJECTS = [
    { id: "p1",  code: "KCVG",   name: "KCVG — Hyperscale Campus",     addr: "1200 Aero Pkwy, Hebron, KY",        lead: "u11", start: "2026-05-31", end: "2026-08-02", status: "in_progress", c: 7,  regionId: "rg1" },
    { id: "p2",  code: "ROS14",  name: "Rosewood 14 — Substation",     addr: "8842 Rosewood Dr, Plano, TX",       lead: "u12", start: "2026-06-08", end: "2026-07-31", status: "in_progress", c: 1,  regionId: "rg1" },
    { id: "p3",  code: "WAL28",  name: "Walker 28 — Aligned DC",       addr: "4501 Walker Rd, Phoenix, AZ",       lead: "u13", start: "2026-05-29", end: "2026-07-24", status: "in_progress", c: 2,  regionId: "rg2" },
    { id: "p4",  code: "CJE1",   name: "C&J Skid Testing",             addr: "3300 Industrial Blvd, Odessa, TX",  lead: "u14", start: "2026-05-31", end: "2026-09-29", status: "in_progress", c: 3,  regionId: "rg5" },
    { id: "p5",  code: "WAL12",  name: "Walker 12 — Feeder Upgrade",   addr: "4501 Walker Rd, Phoenix, AZ",       lead: "u13", start: "2026-06-15", end: "2026-07-28", status: "in_progress", c: 5,  regionId: "rg1" },
    { id: "p6",  code: "CEC3",   name: "CEC3 — Cooling Expansion",     addr: "77 Cedar Creek Rd, Ashburn, VA",    lead: "u15", start: "2026-05-31", end: "2026-07-17", status: "in_progress", c: 9,  regionId: "rg5" },
    { id: "p7",  code: "CMH1",   name: "CMH1 — Columbus DC1",          addr: "2900 Silica Rd, New Albany, OH",    lead: "u11", start: "2026-05-31", end: "2026-07-24", status: "in_progress", c: 4,  regionId: "rg3" },
    { id: "p8",  code: "QTS2",   name: "QTS — DFW2 — DC1",             addr: "1101 Digital Way, Irving, TX",      lead: "u16", start: "2026-06-01", end: "2026-07-30", status: "in_progress", c: 8,  regionId: "rg1" },
    { id: "p9",  code: "T5CS",   name: "T5 — Core Scientific",         addr: "500 Data Center Dr, Denton, TX",    lead: "u12", start: "2026-06-22", end: "2026-08-14", status: "in_progress", c: 12, regionId: "rg4" },
    { id: "p10", code: "IESP",   name: "IES — Pecos Compression",      addr: "Hwy 285, Pecos, TX",                lead: "u14", start: "2026-06-01", end: "2026-08-07", status: "in_progress", c: 6,  regionId: "rg6" },
    { id: "p11", code: "KFSH",   name: "Kingfisher — Gas Plant",       addr: "12 Kingfisher Rd, Kingfisher, OK",  lead: "u16", start: "2026-06-05", end: "2026-07-29", status: "in_progress", c: 10, regionId: "rg5" },
    { id: "p12", code: "THMP",   name: "Thompson — Grid Tie-In",       addr: "9 Thompson Ln, Abilene, TX",        lead: "u15", start: "2026-07-06", end: "2026-08-21", status: "in_progress", c: 11, regionId: "rg1" },
    { id: "p13", code: "NOVA",   name: "Nova — BESS Phase 2",          addr: "77 Nova Park, Mesa, AZ",            lead: "u11", start: "2026-07-20", end: "2026-10-02", status: "planned",     c: 4,  regionId: "rg6" },
    { id: "p14", code: "ATL5",   name: "ATL5 — Switchgear Retrofit",   addr: "3400 Peachtree Rd, Atlanta, GA",    lead: "u13", start: "2026-08-03", end: "2026-09-25", status: "planned",     c: 2,  regionId: "rg1" },
    { id: "p15", code: "SLC1",   name: "SLC1 — Commissioning",         addr: "800 Pioneer Rd, Salt Lake City, UT",lead: "u12", start: "2026-04-06", end: "2026-06-26", status: "completed",   c: 12, regionId: "rg3" },
    { id: "p16", code: "MDW3",   name: "MDW3 — UPS Replacement",       addr: "2200 Midway Blvd, Elk Grove, IL",   lead: "u16", start: "2026-03-16", end: "2026-05-29", status: "completed",   c: 12, regionId: "rg5" },
    { id: "p17", code: "PHX9",   name: "PHX9 — Feeder Trench",         addr: "1500 Buckeye Rd, Phoenix, AZ",      lead: "u15", start: "2026-06-29", end: "2026-07-10", status: "on_hold",     c: 11, regionId: "rg4" },
  ];

  /* ---------- 사용자 (관리자/스케줄러/리드) ---------- */
  const USERS = [
    { id: "u1",  name: "Dana Whitfield",  email: "dana.w@volta.example",   role: "ADMIN",     regionId: null, phone: "+1 (512) 555-0111", status: "active",  lastSignIn: "2026-07-14 08:12" },
    { id: "u2",  name: "Marcus Reed",     email: "m.reed@volta.example",   role: "SCHEDULER", regionId: "rg1", phone: "+1 (512) 555-0122", status: "active",  lastSignIn: "2026-07-14 10:05" },
    { id: "u3",  name: "Priya Raman",     email: "p.raman@volta.example",  role: "SCHEDULER", regionId: "rg2", phone: "+1 (469) 555-0148", status: "active",  lastSignIn: "2026-07-13 17:41" },
    { id: "u4",  name: "Tomás Ibarra",    email: "t.ibarra@volta.example", role: "SCHEDULER", regionId: "rg3", phone: "+1 (602) 555-0193", status: "active",  lastSignIn: "2026-07-14 07:55" },
    { id: "u5",  name: "Grace Okafor",    email: "g.okafor@volta.example", role: "SCHEDULER", regionId: "rg4", phone: "+1 (214) 555-0170", status: "active",  lastSignIn: "2026-07-12 09:02" },
    { id: "u6",  name: "Ben Halvorsen",   email: "b.halv@volta.example",   role: "SCHEDULER", regionId: "rg5", phone: "+1 (405) 555-0166", status: "active",  lastSignIn: "2026-07-14 06:30" },
    { id: "u7",  name: "Ivy Chen",        email: "i.chen@volta.example",   role: "SCHEDULER", regionId: "rg6", phone: "+1 (972) 555-0139", status: "active",  lastSignIn: "2026-07-11 14:20" },
    { id: "u8",  name: "Ray Delgado",     email: "r.delgado@volta.example",role: "SCHEDULER", regionId: "rg7", phone: "+1 (713) 555-0155", status: "invited", lastSignIn: null },
    { id: "u11", name: "Alicia Monroe",   email: "a.monroe@volta.example", role: "LEAD",      regionId: "rg1", phone: "+1 (512) 555-0201", status: "active",  lastSignIn: "2026-07-14 06:02" },
    { id: "u12", name: "Derek Vaughn",    email: "d.vaughn@volta.example", role: "LEAD",      regionId: "rg3", phone: "+1 (512) 555-0202", status: "active",  lastSignIn: "2026-07-13 18:44" },
    { id: "u13", name: "Sofia Ferreira",  email: "s.ferreira@volta.example",role: "LEAD",     regionId: "rg2", phone: "+1 (602) 555-0203", status: "active",  lastSignIn: "2026-07-14 05:50" },
    { id: "u14", name: "Owen Blackwell",  email: "o.black@volta.example",  role: "LEAD",      regionId: "rg5", phone: "+1 (432) 555-0204", status: "active",  lastSignIn: "2026-07-13 20:10" },
    { id: "u15", name: "Nadia Kovács",    email: "n.kovacs@volta.example", role: "LEAD",      regionId: "rg4", phone: "+1 (325) 555-0205", status: "active",  lastSignIn: "2026-07-14 07:31" },
    { id: "u16", name: "Isaac Whitmore",  email: "i.whit@volta.example",   role: "LEAD",      regionId: "rg6", phone: "+1 (405) 555-0206", status: "disabled",lastSignIn: "2026-06-28 11:17" },
  ];

  /* ---------- 기술자 이름 생성 ---------- */
  const FIRST = ["James","Maria","Andre","Chris","Kelly","Devon","Luis","Tara","Owen","Nina","Blake","Rosa","Hank","Iris","Cole","Maya","Seth","June","Vic","Lena","Dax","Zoe","Kurt","Ada","Rex","Faye","Gus","Ivy","Milo","Cleo","Dean","Wren","Otto","Jade","Rudy","Elsa","Cyrus","Nora","Levi","Paz","Bo","Thea","Kai","Rita","Emil","Sage","Hugo","Mabel","Roy","Talia","Enzo","Greta","Vance","Opal","Jonah","Petra","Cash","Dove","Silas","Marta","Abel","Ruth","Knox","Wanda","Terry","Selma","Gil","Hazel","Reid","Vera","Noel","Lucia","Boyd","Anka","Curt","Rhea","Sol","Tess","Marv","Elle"];
  const LAST = ["Alvarez","Brooks","Castellano","Dunn","Ellery","Fontaine","Grant","Hollis","Ingram","Jarrell","Keegan","Lomax","Mercer","Nakashima","Ortega","Prescott","Quill","Ridley","Santoro","Thorne","Underwood","Vance","Whitlock","Yates","Zamora","Ashford","Bhatt","Corrigan","Delacroix","Eastwood","Falk","Grimaldi","Hutchins","Iverson","Jessup","Kowalski","Langford","Moreau","Nyberg","Oyelaran","Pomeroy","Rausch","Sandoval","Trevino","Ulbrich","Varga","Weaver","Yamada","Zeller","Braddock"];
  const SKILLS = ["High Voltage","Terminations","Cable Pulling","Conduit","Panel Build","Testing","Fiber","Grounding","Rigging","Welding","PLC","VFD","Torque","LOTO","Confined Space","Aerial Lift"];
  const CERTS = ["OSHA 30", "NFPA 70E", "CPR/First Aid", "Journeyman", "Master EL", "Forklift"];

  const initials = (n) => n.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();

  const TECHS = [];
  let tn = 1;
  REGIONS.forEach((rg) => {
    const size = REGION_SIZE[rg.id];
    for (let i = 0; i < size; i++) {
      const name = `${pick(FIRST)} ${pick(LAST)}`;
      const sk = [];
      while (sk.length < ri(2, 4)) { const s = pick(SKILLS); if (!sk.includes(s)) sk.push(s); }
      const ct = [];
      while (ct.length < ri(1, 3)) { const c = pick(CERTS); if (!ct.includes(c)) ct.push(c); }
      TECHS.push({
        id: "t" + tn,
        name,
        initials: initials(name),
        regionId: rg.id,
        badge: "EMP-" + String(1400 + tn),
        phone: `+1 (${ri(200, 979)}) 555-${String(ri(100, 999))}${ri(0, 9)}`,
        email: name.toLowerCase().replace(/[^a-z]/g, ".") + "@volta.example",
        skills: sk,
        certs: ct,
        level: pick(["Apprentice", "Journeyman", "Journeyman", "Journeyman", "Foreman", "Master"]),
        smsOptIn: chance(0.78),
      });
      tn++;
    }
  });

  /* ---------- 휴가 / 부재 ---------- */
  const TIMEOFF = [];
  let vn = 1;
  const TO_TYPES = [
    { k: "pto", label: "유급휴가 (PTO)" },
    { k: "off", label: "무급 결근 (Off)" },
    { k: "sick", label: "병가 (Sick)" },
    { k: "training", label: "교육 (Training)" },
  ];
  // 승인 완료 이력
  for (let i = 0; i < 26; i++) {
    const t = pick(TECHS);
    const s = addDays(new Date(2026, 6, 1), ri(-14, 40));
    const len = ri(1, 5);
    TIMEOFF.push({
      id: "v" + vn++, techId: t.id, type: pick(TO_TYPES).k,
      start: iso(s), end: iso(addDays(s, len - 1)),
      status: chance(0.85) ? "approved" : "rejected",
      note: chance(0.4) ? pick(["가족 행사", "개인 사유", "자격증 갱신 교육", "이사", "병원 진료"]) : "",
      decidedAt: "2026-07-10", decidedBy: pick(["u2", "u3", "u1", "u6"]),
    });
  }
  // 대기 중 (승인 워크플로우 데모용) — 배정과 충돌하는 케이스 포함
  const PENDING_SEED = [
    { techIdx: 3,   start: "2026-07-18", end: "2026-07-21", type: "pto",      note: "가족 행사 참석" },
    { techIdx: 12,  start: "2026-07-15", end: "2026-07-17", type: "sick",     note: "" },
    { techIdx: 44,  start: "2026-07-22", end: "2026-07-24", type: "training", note: "NFPA 70E 재인증" },
    { techIdx: 80,  start: "2026-07-16", end: "2026-07-16", type: "off",      note: "차량 정비" },
    { techIdx: 130, start: "2026-07-27", end: "2026-07-31", type: "pto",      note: "여름 휴가" },
  ];
  PENDING_SEED.forEach((p) => {
    TIMEOFF.push({
      id: "v" + vn++, techId: TECHS[p.techIdx].id, type: p.type,
      start: p.start, end: p.end, status: "pending", note: p.note,
      decidedAt: null, decidedBy: null, requestedAt: "2026-07-11",
    });
  });

  const approvedRanges = TIMEOFF.filter((v) => v.status === "approved");
  const isOff = (techId, dstr) =>
    approvedRanges.some((v) => v.techId === techId && dstr >= v.start && dstr <= v.end);

  /* ---------- 배정 (Assignment) ---------- */
  /* 기술자별로 연속 구간(=간트 바)을 만들고, 일부는 의도적으로 충돌 생성 */
  const ASSIGN = [];
  let an = 1;
  const SHIFTS = ["day", "morning", "afternoon", "night"];
  const activeProjects = PROJECTS.filter((p) => p.status === "in_progress");

  const projByRegion = {};
  REGIONS.forEach((rg) => {
    projByRegion[rg.id] = activeProjects.filter((p) => p.regionId === rg.id);
    if (!projByRegion[rg.id].length) projByRegion[rg.id] = activeProjects.slice(0, 4);
  });

  const monthStart = new Date(2026, 6, 1);
  const monthEnd = new Date(2026, 6, 31);

  TECHS.forEach((t) => {
    const pool = projByRegion[t.regionId];
    let cur = new Date(monthStart);
    // 일부 기술자는 벤치(미배정) 상태 → 가동률 낮음 → capacity alert
    const benched = chance(0.14);
    if (benched && chance(0.5)) return;

    while (cur <= monthEnd) {
      if (chance(0.12)) { cur = addDays(cur, ri(1, 4)); continue; } // 갭
      const p = pick(pool);
      const len = ri(3, 9);
      const shift = chance(0.82) ? "day" : pick(["morning", "afternoon", "night"]);
      for (let i = 0; i < len && cur <= monthEnd; i++) {
        const ds = iso(cur);
        const holiday = !!HOLIDAYS[ds];
        const weekend = isWeekend(cur);
        // 주말/공휴일은 낮은 확률로만 배정
        const skip = (weekend && !chance(0.22)) || (holiday && !chance(0.15));
        if (!skip && ds >= p.start && ds <= p.end) {
          ASSIGN.push({ id: "a" + an++, techId: t.id, projectId: p.id, date: ds, shift, hours: shift === "day" ? 10 : 8 });
        }
        cur = addDays(cur, 1);
      }
    }
  });

  /* 승인 휴가 기간의 배정은 정리 (충돌은 아래 시드로만 의도적으로 생성) */
  for (let i = ASSIGN.length - 1; i >= 0; i--) {
    const a = ASSIGN[i];
    if (isOff(a.techId, a.date)) ASSIGN.splice(i, 1);
  }

  /* --- 의도적 충돌 시나리오 (데모 핵심) --- */
  const CONFLICT_SEED = [
    // 1) 이중 배정: 같은 날 같은 시프트에 두 프로젝트
    { techIdx: 1,  date: "2026-07-16", projectId: "p8",  shift: "day",  kind: "double" },
    { techIdx: 7,  date: "2026-07-17", projectId: "p12", shift: "day",  kind: "double" },
    { techIdx: 23, date: "2026-07-21", projectId: "p2",  shift: "day",  kind: "double" },
    // 2) 승인 휴가 기간과 겹치는 배정
    { techIdx: 55, date: "2026-07-20", projectId: "p1",  shift: "day",  kind: "timeoff" },
    // 3) 야간→주간 연속 (휴식시간 미확보)
    { techIdx: 96, date: "2026-07-15", projectId: "p4",  shift: "night", kind: "rest" },
    { techIdx: 96, date: "2026-07-16", projectId: "p4",  shift: "morning", kind: "rest" },
  ];
  CONFLICT_SEED.forEach((c) => {
    const t = TECHS[c.techIdx];
    ASSIGN.push({ id: "a" + an++, techId: t.id, projectId: c.projectId, date: c.date, shift: c.shift, hours: 10, seeded: c.kind });
  });
  // 휴가 충돌용 승인 휴가 삽입
  TIMEOFF.push({
    id: "v" + vn++, techId: TECHS[55].id, type: "pto",
    start: "2026-07-19", end: "2026-07-22", status: "approved",
    note: "사전 승인 휴가", decidedAt: "2026-07-02", decidedBy: "u2",
  });

  /* ---------- 장비 카탈로그 ---------- */
  const EQ_CATS = [
    { k: "vehicle",  label: "차량 (Vehicle)" },
    { k: "lift",     label: "고소작업 (Lift)" },
    { k: "tool",     label: "공구 (Tool)" },
    { k: "test",     label: "계측기 (Test)" },
    { k: "safety",   label: "안전장비 (Safety)" },
  ];
  const EQ_SEED = [
    ["Ford F-350 Crew Cab", "vehicle", "VEH", 8],
    ["Ram 5500 Service Truck", "vehicle", "VEH", 5],
    ["Cargo Trailer 24ft", "vehicle", "TRL", 4],
    ["Genie S-65 Boom Lift", "lift", "LFT", 6],
    ["JLG 1930ES Scissor Lift", "lift", "LFT", 9],
    ["Skytrak 6042 Telehandler", "lift", "LFT", 3],
    ["Greenlee 855GX Bender", "tool", "TL", 7],
    ["Hydraulic Crimper 12T", "tool", "TL", 11],
    ["Cable Puller 8000lb", "tool", "TL", 4],
    ["Core Drill Rig", "tool", "TL", 3],
    ["Megger MIT525 Insulation Tester", "test", "TST", 6],
    ["Fluke 1587 Multimeter", "test", "TST", 14],
    ["Doble M4100 Test Set", "test", "TST", 2],
    ["Thermal Camera Ti480", "test", "TST", 5],
    ["Arc Flash Suit 40cal", "safety", "SAF", 12],
    ["Confined Space Tripod Kit", "safety", "SAF", 4],
    ["Gas Detector BW Ultra", "safety", "SAF", 8],
  ];
  const EQUIP = [];
  let en = 1;
  EQ_SEED.forEach(([name, cat, prefix, qty]) => {
    for (let i = 1; i <= qty; i++) {
      const st = chance(0.62) ? "assigned" : chance(0.75) ? "available" : "maintenance";
      EQUIP.push({
        id: "e" + en,
        name,
        category: cat,
        serial: `${prefix}-${String(2100 + en)}`,
        status: st,
        projectId: st === "assigned" ? pick(activeProjects).id : null,
        regionId: pick(REGIONS).id,
        lastService: iso(addDays(TODAY, -ri(5, 180))),
        nextService: iso(addDays(TODAY, ri(-9, 120))),
      });
      en++;
    }
  });

  /* ---------- 알림 ---------- */
  const NOTIFS = [
    { id: "n1", type: "conflict", title: "스케줄 충돌 6건", body: "7/15–7/21 구간에서 이중 배정 3건, 휴가 중복 1건, 휴식시간 미확보 2건이 감지되었습니다.", at: "12분 전", unread: true },
    { id: "n2", type: "vacation", title: "휴가 승인 대기 5건", body: "가장 이른 시작일은 7월 15일입니다.", at: "1시간 전", unread: true },
    { id: "n3", type: "capacity", title: "가동률 경고", body: "Apprentice Pool 지역의 평균 가동률이 48%로 임계치(50%) 아래입니다.", at: "3시간 전", unread: true },
    { id: "n4", type: "equipment", title: "장비 정비 기한 초과 3건", body: "Genie S-65 외 2건의 정비 예정일이 지났습니다.", at: "어제", unread: false },
    { id: "n5", type: "project", title: "PHX9 — Feeder Trench 보류", body: "발주처 요청으로 프로젝트가 보류 상태로 전환되었습니다.", at: "2일 전", unread: false },
  ];

  /* ---------- 현재 로그인 사용자 ---------- */
  const ME = {
    id: "u2", name: "Marcus Reed", email: "m.reed@volta.example",
    role: "SCHEDULER", regionId: "rg1", phone: "+1 (512) 555-0122",
    timezone: "America/New_York", lastSignIn: "2026-07-14 10:05:26",
    smsOptIn: true, emailDigest: true, conflictAlert: true,
  };
  /* 모바일 현장뷰용 기술자 페르소나
     — 오늘(7/14) 배정이 있고 이번 달 배정이 충분한 기술자를 골라야 화면이 비지 않습니다. */
  const _today = iso(TODAY);
  const _cnt = {};
  ASSIGN.forEach((a) => (_cnt[a.techId] = (_cnt[a.techId] || 0) + 1));
  const ME_TECH =
    TECHS.find((t) => _cnt[t.id] >= 12 && ASSIGN.some((a) => a.techId === t.id && a.date === _today)) ||
    TECHS.find((t) => ASSIGN.some((a) => a.techId === t.id && a.date === _today)) ||
    TECHS[0];

  /* 기술자 모바일 "휴가 신청" 화면 데모용 이력 — 승인/반려/대기 3상태를 모두 보여줍니다.
     배정이 없는 기간을 골라 새로운 충돌이 생기지 않게 합니다. */
  TIMEOFF.push(
    { id: "v" + vn++, techId: ME_TECH.id, type: "pto", start: "2026-06-22", end: "2026-06-24",
      status: "approved", note: "가족 여행", decidedAt: "2026-06-15", decidedBy: "u2", requestedAt: "2026-06-10" },
    { id: "v" + vn++, techId: ME_TECH.id, type: "off", start: "2026-07-25", end: "2026-07-26",
      status: "rejected", note: "개인 사유",
      rejectReason: "동일 기간 신청이 집중되어 대체 인력 확보가 어렵습니다.",
      decidedAt: "2026-07-12", decidedBy: "u2", requestedAt: "2026-07-09" },
    { id: "v" + vn++, techId: ME_TECH.id, type: "training", start: "2026-08-03", end: "2026-08-05",
      status: "pending", note: "NFPA 70E 재인증 교육", decidedAt: null, decidedBy: null, requestedAt: "2026-07-13" }
  );

  /* ---------- 조회 헬퍼 ---------- */
  const byId = (arr) => { const m = {}; arr.forEach((x) => (m[x.id] = x)); return m; };
  const P = byId(PROJECTS), T = byId(TECHS), R = byId(REGIONS), U = byId(USERS), E = byId(EQUIP);

  const projColor = (p) => `var(--c${p.c})`;

  /* 충돌 계산 — 스케줄/대시보드/뱃지 공용 */
  function computeConflicts(assignments, timeoff) {
    const A = assignments || ASSIGN, V = timeoff || TIMEOFF;
    const out = [];
    const key = {}; // techId|date|shift
    const byTechDate = {};
    A.forEach((a) => {
      const k = `${a.techId}|${a.date}|${a.shift}`;
      (key[k] = key[k] || []).push(a);
      const k2 = `${a.techId}|${a.date}`;
      (byTechDate[k2] = byTechDate[k2] || []).push(a);
    });
    // 1) 이중 배정
    Object.keys(key).forEach((k) => {
      const list = key[k];
      if (list.length > 1) {
        const [techId, date] = k.split("|");
        out.push({
          id: "cf-d-" + k, kind: "double", techId, date,
          assignIds: list.map((a) => a.id),
          projects: list.map((a) => a.projectId),
          severity: "high",
          msg: `동일 시프트에 ${list.length}개 프로젝트가 중복 배정되었습니다.`,
        });
      }
    });
    // 2) 승인 휴가와 배정 중복
    const appr = V.filter((v) => v.status === "approved");
    A.forEach((a) => {
      const v = appr.find((v) => v.techId === a.techId && a.date >= v.start && a.date <= v.end);
      if (v) {
        out.push({
          id: "cf-v-" + a.id, kind: "timeoff", techId: a.techId, date: a.date,
          assignIds: [a.id], projects: [a.projectId], timeoffId: v.id, severity: "high",
          msg: "승인된 휴가 기간에 배정되어 있습니다.",
        });
      }
    });
    // 3) 야간 → 익일 오전 (최소 휴식 10시간 미확보)
    A.forEach((a) => {
      if (a.shift !== "night") return;
      const next = iso(addDays(parse(a.date), 1));
      const nx = (byTechDate[`${a.techId}|${next}`] || []).find((x) => x.shift === "morning");
      if (nx) {
        out.push({
          id: "cf-r-" + a.id, kind: "rest", techId: a.techId, date: next,
          assignIds: [a.id, nx.id], projects: [a.projectId, nx.projectId], severity: "medium",
          msg: "야간 근무 직후 익일 오전 배정 — 최소 휴식 10시간 미확보.",
        });
      }
    });
    return out;
  }

  /* 가동률: 해당 기간 배정일수 / 근무 가능일수 */
  function utilization(techId, from, to, assignments, timeoff) {
    const A = assignments || ASSIGN;
    const days = daysBetween(from, to) + 1;
    let workable = 0, booked = 0;
    for (let i = 0; i < days; i++) {
      const d = addDays(parse(from), i), ds = iso(d);
      if (isWeekend(d) || HOLIDAYS[ds]) continue;
      if (isOff(techId, ds)) continue;
      workable++;
      if (A.some((a) => a.techId === techId && a.date === ds)) booked++;
    }
    return workable ? Math.round((booked / workable) * 100) : 0;
  }

  w.DB = {
    DATE, HOLIDAYS, REGIONS, PROJECTS, USERS, TECHS, TIMEOFF, ASSIGN, EQUIP, EQ_CATS, TO_TYPES,
    NOTIFS, ME, ME_TECH, SKILLS, CERTS,
    P, T, R, U, E,
    projColor, computeConflicts, utilization, isOff, initials,
    STATUS: {
      in_progress: { label: "진행중", cls: "badge--ok" },
      planned:     { label: "예정",   cls: "badge--info" },
      completed:   { label: "완료",   cls: "" },
      on_hold:     { label: "보류",   cls: "badge--warn" },
    },
    EQ_STATUS: {
      available:   { label: "가용",   cls: "badge--ok" },
      assigned:    { label: "배정됨", cls: "badge--info" },
      maintenance: { label: "정비중", cls: "badge--warn" },
    },
    ROLE: {
      ADMIN:      { label: "관리자",     cls: "badge--solid" },
      SCHEDULER:  { label: "스케줄러",   cls: "badge--info" },
      LEAD:       { label: "현장 리드",  cls: "badge--warn" },
      TECHNICIAN: { label: "기술자",     cls: "" },
    },
  };
})(window);
