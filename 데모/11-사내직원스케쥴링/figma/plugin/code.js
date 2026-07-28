/* ============================================================
   VOLTA Design System Builder — Figma Plugin
   assets/style.css 의 디자인 토큰을 Figma 네이티브 자산으로 생성한다.

   생성물
   1) 변수 컬렉션 "VOLTA" — 색상 (Light / Dark 2모드)
   2) 변수 컬렉션 "VOLTA · Scale" — 간격 / 라디우스 / 사이즈
   3) 텍스트 스타일 11종
   4) 이펙트 스타일 4종 (그림자)
   5) 컴포넌트 13세트 (베리언트 · 오토레이아웃)
   6) Foundations 페이지 (컬러 스와치 · 타입 스펙)

   실행: Figma → Plugins → Development → Import plugin from manifest → 실행
   ============================================================ */

/* ---------- 0. 폰트 (설치된 것 중 자동 선택) ---------- */
const FONT_CANDIDATES = ["Pretendard", "Pretendard Variable", "Inter", "Roboto"];
const F = {};

async function tryFont(family, style) {
  try {
    await figma.loadFontAsync({ family, style });
    return { family, style };
  } catch (e) {
    return null;
  }
}

async function loadFonts() {
  let family = null;
  for (const f of FONT_CANDIDATES) {
    if (await tryFont(f, "Regular")) { family = f; break; }
  }
  if (!family) throw new Error("사용 가능한 폰트가 없습니다. Pretendard 또는 Inter를 설치해 주세요.");

  F.regular = { family, style: "Regular" };
  F.medium = (await tryFont(family, "Medium")) || (await tryFont(family, "SemiBold")) || F.regular;
  F.bold = (await tryFont(family, "Bold")) || F.medium;
  F.extrabold = (await tryFont(family, "ExtraBold")) || (await tryFont(family, "Black")) || F.bold;
  F.mono =
    (await tryFont("SF Mono", "Regular")) ||
    (await tryFont("Roboto Mono", "Regular")) ||
    (await tryFont("Courier New", "Regular")) ||
    F.regular;

  return family;
}

/* ---------- 1. 토큰 (style.css 와 1:1) ---------- */
const COLOR = {
  "bg":          ["#f7f8fa", "#0b0d11"],
  "surface":     ["#ffffff", "#14171d"],
  "surface-2":   ["#f7f8fa", "#191d24"],
  "surface-3":   ["#f1f2f5", "#20252e"],
  "sunken":      ["#f1f2f5", "#0e1116"],
  "line":        ["#e2e4ea", "#272c36"],
  "line-strong": ["#cbcfd8", "#39404d"],

  "ink":         ["#14171d", "#eef1f6"],
  "ink-2":       ["#353b48", "#c6ccd8"],
  "muted":       ["#6b7280", "#8e97a6"],
  "faint":       ["#9aa1af", "#6b7482"],

  "primary":     ["#14171d", "#f2f4f8"],
  "primary-ink": ["#ffffff", "#0b0d11"],
  "accent":      ["#1b4ee0", "#7ba2ff"],
  "accent-soft": ["#eef4ff", "rgba(92,135,255,0.14)"],
  "focus":       ["#2f62f5", "#7ba2ff"],
  "on-accent":   ["#ffffff", "#ffffff"],

  "ok":        ["#15a05a", "#3ecf87"],
  "ok-bg":     ["#e6f6ee", "rgba(62,207,135,0.14)"],
  "ok-fg":     ["#0d6b3c", "#7ee2ab"],
  "warn":      ["#e08700", "#f0b429"],
  "warn-bg":   ["#fdf1dc", "rgba(240,180,41,0.14)"],
  "warn-fg":   ["#8a5200", "#f6cf6a"],
  "danger":    ["#dc3b40", "#ff6b6f"],
  "danger-bg": ["#fdeaea", "rgba(255,107,111,0.14)"],
  "danger-fg": ["#9d2429", "#ff9b9e"],
  "info":      ["#0b8fc7", "#4cc2f1"],
  "info-bg":   ["#e2f4fc", "rgba(76,194,241,0.14)"],
  "info-fg":   ["#075f86", "#8ad8f7"],

  "avatar-bg": ["#22262f", "#1b4ee0"],
  "track":     ["#cbcfd8", "#39404d"],

  "project/1":  ["#0e8f84", "#19b3a5"],
  "project/2":  ["#6d5ae0", "#8b7bf0"],
  "project/3":  ["#a86a08", "#cf8a1c"],
  "project/4":  ["#2563eb", "#4a86f7"],
  "project/5":  ["#4f8a10", "#69ab22"],
  "project/6":  ["#b32f74", "#d6539a"],
  "project/7":  ["#0f7ba8", "#2299cc"],
  "project/8":  ["#5a6273", "#7b8496"],
  "project/9":  ["#157f5f", "#1f9e77"],
  "project/10": ["#8b3fd4", "#a663e6"],
  "project/11": ["#bc5518", "#dd6f2c"],
  "project/12": ["#7a6636", "#9a844a"],
};

const SCALE = {
  "space/4": 4, "space/6": 6, "space/8": 8, "space/10": 10, "space/12": 12,
  "space/14": 14, "space/16": 16, "space/20": 20, "space/24": 24, "space/32": 32,
  "radius/xs": 5, "radius/sm": 7, "radius/md": 10, "radius/lg": 14, "radius/xl": 20, "radius/full": 999,
  "size/nav-width": 248, "size/topbar": 60, "size/row-height": 46, "size/row-compact": 36,
  "size/cell-width": 52, "size/table-row": 52, "size/input": 40, "size/touch-min": 44,
};

const TYPE = {
  "KPI Value":   { font: "extrabold", size: 32,   lh: 100, ls: -3 },
  "Page Title":  { font: "extrabold", size: 27,   lh: 120, ls: -2.5 },
  "Modal Title": { font: "extrabold", size: 18,   lh: 140, ls: -2 },
  "Card Title":  { font: "bold",      size: 15.5, lh: 140, ls: -1 },
  "Body":        { font: "regular",   size: 14,   lh: 150, ls: 0 },
  "Body Strong": { font: "bold",      size: 14,   lh: 150, ls: 0 },
  "Body Small":  { font: "regular",   size: 13.5, lh: 155, ls: 0 },
  "Button":      { font: "bold",      size: 13.5, lh: 100, ls: 0 },
  "Caption":     { font: "regular",   size: 12,   lh: 150, ls: 0 },
  "Label Micro": { font: "extrabold", size: 10.5, lh: 120, ls: 9 },
  "Mono":        { font: "mono",      size: 12.5, lh: 150, ls: 0 },
};

const SHADOW = {
  "Elevation 1": [[0, 1, 2, 0, 0.06], [0, 1, 1, 0, 0.04]],
  "Elevation 2": [[0, 4, 12, -2, 0.08], [0, 2, 6, -2, 0.06]],
  "Elevation 3": [[0, 18, 40, -12, 0.22], [0, 6, 14, -6, 0.10]],
  "Elevation 4": [[0, 32, 70, -20, 0.35]],
};

/* ---------- 2. 색 유틸 ---------- */
function parseColor(str) {
  if (str.indexOf("rgba") === 0 || str.indexOf("rgb") === 0) {
    const m = str.match(/rgba?\(([^)]+)\)/)[1].split(",").map((s) => parseFloat(s.trim()));
    return { r: m[0] / 255, g: m[1] / 255, b: m[2] / 255, a: m.length > 3 ? m[3] : 1 };
  }
  const h = str.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
    a: 1,
  };
}

/* ---------- 3. 변수 ---------- */
const VARS = {};
let USE_VARS = true;

function createVariable(name, collection, type) {
  try {
    return figma.variables.createVariable(name, collection, type);
  } catch (e) {
    return figma.variables.createVariable(name, collection.id, type); // 구버전 API
  }
}

function buildVariables() {
  if (!figma.variables || !figma.variables.createVariableCollection) {
    USE_VARS = false;
    for (const name of Object.keys(COLOR)) {
      const c = parseColor(COLOR[name][0]);
      const s = figma.createPaintStyle();
      s.name = "VOLTA/" + name;
      s.paints = [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a }];
    }
    return;
  }

  const col = figma.variables.createVariableCollection("VOLTA");
  const lightId = col.modes[0].modeId;
  col.renameMode(lightId, "Light");
  const darkId = col.addMode("Dark");

  for (const name of Object.keys(COLOR)) {
    const v = createVariable(name, col, "COLOR");
    const l = parseColor(COLOR[name][0]);
    const d = parseColor(COLOR[name][1]);
    v.setValueForMode(lightId, l);
    v.setValueForMode(darkId, d);
    VARS[name] = v;
  }

  const sc = figma.variables.createVariableCollection("VOLTA · Scale");
  const sId = sc.modes[0].modeId;
  sc.renameMode(sId, "Default");
  for (const name of Object.keys(SCALE)) {
    const v = createVariable(name, sc, "FLOAT");
    v.setValueForMode(sId, SCALE[name]);
  }
}

function fillOf(name) {
  const base = { type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 1 };
  if (USE_VARS && VARS[name]) {
    return figma.variables.setBoundVariableForPaint(base, "color", VARS[name]);
  }
  const c = parseColor(COLOR[name][0]);
  return { type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a };
}
function setFill(node, name) {
  node.fills = name ? [fillOf(name)] : [];
}
function setStroke(node, name, weight) {
  node.strokes = [fillOf(name)];
  node.strokeWeight = weight || 1;
  node.strokeAlign = "INSIDE";
}

/* ---------- 4. 텍스트 · 이펙트 스타일 ---------- */
const TEXT_STYLES = {};

function buildTextStyles() {
  for (const name of Object.keys(TYPE)) {
    const t = TYPE[name];
    const s = figma.createTextStyle();
    s.name = "VOLTA/" + name;
    s.fontName = F[t.font];
    s.fontSize = t.size;
    s.lineHeight = { unit: "PERCENT", value: t.lh };
    s.letterSpacing = { unit: "PERCENT", value: t.ls };
    if (name === "Label Micro") s.textCase = "UPPER";
    TEXT_STYLES[name] = s;
  }
}

function buildEffectStyles() {
  for (const name of Object.keys(SHADOW)) {
    const s = figma.createEffectStyle();
    s.name = "VOLTA/" + name;
    s.effects = SHADOW[name].map((e) => ({
      type: "DROP_SHADOW",
      color: { r: 16 / 255, g: 20 / 255, b: 28 / 255, a: e[4] },
      offset: { x: e[0], y: e[1] },
      radius: e[2],
      spread: e[3],
      visible: true,
      blendMode: "NORMAL",
    }));
  }
}

/* ---------- 5. 노드 헬퍼 ---------- */
/* 중요: layoutGrow / layoutAlign 은 부모 오토레이아웃에 append 한 뒤에만 설정할 수 있다.
   add() 로 순서를 강제한다. */
function add(parent, node, opt) {
  parent.appendChild(node);
  if (opt) {
    if (opt.grow) node.layoutGrow = 1;
    if (opt.stretch) node.layoutAlign = "STRETCH";
    if (opt.w != null) {
      node.layoutSizingHorizontal = "FIXED";
      node.resize(opt.w, node.height);
    }
  }
  return node;
}

function autoFrame(name, dir, opts) {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = dir === "v" ? "VERTICAL" : "HORIZONTAL";
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.counterAxisAlignItems = (opts && opts.align) || "CENTER";
  f.itemSpacing = (opts && opts.gap) != null ? opts.gap : 8;
  const p = (opts && opts.pad) || [0, 0, 0, 0];
  f.paddingTop = p[0]; f.paddingRight = p[1]; f.paddingBottom = p[2]; f.paddingLeft = p[3];
  f.cornerRadius = (opts && opts.radius) || 0;
  f.fills = [];
  return f;
}

function comp(name, dir, opts) {
  const c = figma.createComponent();
  c.name = name;
  c.layoutMode = dir === "v" ? "VERTICAL" : "HORIZONTAL";
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "AUTO";
  c.primaryAxisAlignItems = (opts && opts.justify) || "CENTER";
  c.counterAxisAlignItems = (opts && opts.align) || "CENTER";
  c.itemSpacing = (opts && opts.gap) != null ? opts.gap : 7;
  const p = (opts && opts.pad) || [0, 0, 0, 0];
  c.paddingTop = p[0]; c.paddingRight = p[1]; c.paddingBottom = p[2]; c.paddingLeft = p[3];
  c.cornerRadius = (opts && opts.radius) || 0;
  c.fills = [];
  return c;
}

/* 고정 크기로 만들기 (오토레이아웃 프레임 자신) */
function fixed(node, w, h) {
  if (w != null) node.primaryAxisSizingMode = node.layoutMode === "HORIZONTAL" ? "FIXED" : node.primaryAxisSizingMode;
  node.resize(w != null ? w : node.width, h != null ? h : node.height);
  return node;
}

function txt(chars, styleName, colorVar) {
  const t = figma.createText();
  t.fontName = F[TYPE[styleName].font];
  t.characters = chars;
  if (TEXT_STYLES[styleName]) t.textStyleId = TEXT_STYLES[styleName].id;
  if (colorVar) setFill(t, colorVar);
  return t;
}

function box(w, h, radius, fillVar) {
  const r = figma.createRectangle();
  r.resize(w, h);
  r.cornerRadius = radius || 0;
  setFill(r, fillVar);
  return r;
}

function circle(d, fillVar) {
  const e = figma.createEllipse();
  e.resize(d, d);
  setFill(e, fillVar);
  return e;
}

/* 아이콘 자리표시자 — Figma에서 실제 아이콘으로 교체 */
function iconSlot(size, colorVar) {
  const r = box(size, size, 3, colorVar);
  r.name = "icon";
  r.opacity = 0.3;
  return r;
}

/* ---------- 6. 컴포넌트 ---------- */
let PAGE = null;
let cursorY = 0;

function placeSet(components, name, note) {
  const set = figma.combineAsVariants(components, PAGE);
  set.name = name;
  set.layoutMode = "HORIZONTAL";
  set.layoutWrap = "WRAP";
  set.counterAxisSizingMode = "AUTO";
  set.primaryAxisSizingMode = "FIXED";
  set.counterAxisAlignItems = "CENTER";
  set.itemSpacing = 16;
  set.counterAxisSpacing = 16;
  set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 20;
  set.cornerRadius = 12;
  set.resize(1180, set.height);
  set.x = 0;
  set.y = cursorY;
  if (note) set.description = note;
  cursorY += set.height + 56;
  return set;
}

/* 버튼 — Kind × Size */
function buildButtons() {
  const KINDS = {
    Primary: { bg: "primary", fg: "primary-ink", stroke: null },
    Accent:  { bg: "accent",  fg: "on-accent",   stroke: null },
    Danger:  { bg: "danger",  fg: "on-accent",   stroke: null },
    Default: { bg: "surface", fg: "ink",         stroke: "line" },
    Quiet:   { bg: null,      fg: "ink",         stroke: "line" },
    Ghost:   { bg: null,      fg: "ink-2",       stroke: null },
  };
  const SIZES = {
    SM: { h: 31, px: 11, radius: 7,  icon: 14 },
    MD: { h: 38, px: 15, radius: 10, icon: 16 },
    LG: { h: 46, px: 22, radius: 14, icon: 18 },
  };
  const list = [];
  for (const k of Object.keys(KINDS)) {
    for (const s of Object.keys(SIZES)) {
      const K = KINDS[k], S = SIZES[s];
      const c = comp("Kind=" + k + ", Size=" + s, "h", { pad: [0, S.px, 0, S.px], gap: 7, radius: S.radius });
      c.counterAxisSizingMode = "FIXED";
      c.resize(c.width, S.h);
      if (K.bg) setFill(c, K.bg);
      if (K.stroke) setStroke(c, K.stroke, 1);
      add(c, iconSlot(S.icon, K.fg));
      add(c, txt("Button", "Button", K.fg));
      list.push(c);
    }
  }
  placeSet(list, "Button", "Kind: Primary/Accent/Danger/Default/Quiet/Ghost · Size: SM 31 / MD 38 / LG 46");
}

/* 뱃지 */
function buildBadges() {
  const TONES = {
    Neutral: ["surface-3", "ink-2"],
    OK:      ["ok-bg", "ok-fg"],
    Warn:    ["warn-bg", "warn-fg"],
    Danger:  ["danger-bg", "danger-fg"],
    Info:    ["info-bg", "info-fg"],
    Solid:   ["primary", "primary-ink"],
  };
  const list = [];
  for (const t of Object.keys(TONES)) {
    const c = comp("Tone=" + t, "h", { pad: [0, 9, 0, 9], gap: 5, radius: 999 });
    c.counterAxisSizingMode = "FIXED";
    c.resize(c.width, 22);
    setFill(c, TONES[t][0]);
    add(c, txt("BADGE", "Label Micro", TONES[t][1]));
    list.push(c);
  }
  placeSet(list, "Badge", "색만으로 상태를 전달하지 않는다 — 항상 텍스트를 동반.");
}

/* 시프트 뱃지 */
function buildShiftBadges() {
  const S = {
    Day:       ["info-bg", "info-fg", "주간"],
    Morning:   ["ok-bg", "ok-fg", "오전"],
    Afternoon: ["warn-bg", "warn-fg", "오후"],
    Night:     ["primary", "primary-ink", "야간"],
  };
  const list = [];
  for (const k of Object.keys(S)) {
    const c = comp("Shift=" + k, "h", { pad: [0, 9, 0, 9], gap: 5, radius: 999 });
    c.counterAxisSizingMode = "FIXED";
    c.resize(c.width, 22);
    setFill(c, S[k][0]);
    add(c, iconSlot(12, S[k][1]));
    add(c, txt(S[k][2], "Label Micro", S[k][1]));
    list.push(c);
  }
  placeSet(list, "Shift Badge", "주간 / 오전 / 오후 / 야간");
}

/* 프로젝트 칩 */
function buildChip() {
  const c = comp("Type=Project", "h", { pad: [0, 10, 0, 10], gap: 6, radius: 7 });
  c.counterAxisSizingMode = "FIXED";
  c.resize(c.width, 26);
  setFill(c, "surface-3");
  add(c, box(8, 8, 2, "project/1"));
  add(c, txt("KCVG", "Caption", "ink-2"));
  placeSet([c], "Chip", "dot 색을 project/1~12 변수로 교체해 프로젝트를 구분한다.");
}

/* 인풋 */
function buildInputs() {
  const STATES = {
    Default:  { stroke: "line",   fg: "faint", label: "Placeholder", w: 1 },
    Filled:   { stroke: "line",   fg: "ink",   label: "입력값", w: 1 },
    Focus:    { stroke: "focus",  fg: "ink",   label: "입력값", w: 1.5, glow: true },
    Error:    { stroke: "danger", fg: "ink",   label: "입력값", w: 1.5 },
    Disabled: { stroke: "line",   fg: "faint", label: "입력값", w: 1, dim: true },
  };
  const list = [];
  for (const s of Object.keys(STATES)) {
    const S = STATES[s];
    const c = comp("State=" + s, "h", { pad: [0, 12, 0, 12], gap: 8, radius: 10, justify: "MIN" });
    c.primaryAxisSizingMode = "FIXED";
    c.counterAxisSizingMode = "FIXED";
    c.resize(280, 40);
    setFill(c, "surface");
    setStroke(c, S.stroke, S.w);
    add(c, txt(S.label, "Body Small", S.fg), { grow: true });
    if (S.glow) {
      c.effects = [{
        type: "DROP_SHADOW",
        color: { r: 0.18, g: 0.38, b: 0.96, a: 0.18 },
        offset: { x: 0, y: 0 }, radius: 0, spread: 3, visible: true, blendMode: "NORMAL",
      }];
    }
    if (S.dim) c.opacity = 0.45;
    list.push(c);
  }
  placeSet(list, "Input", "높이 40 · radius 10 · 포커스 링 spread 3");
}

/* 스위치 */
function buildSwitch() {
  const list = [];
  for (const s of ["On", "Off"]) {
    const c = comp("State=" + s, "h", {
      gap: 0, radius: 999, pad: [3, 3, 3, 3], justify: s === "On" ? "MAX" : "MIN",
    });
    c.primaryAxisSizingMode = "FIXED";
    c.counterAxisSizingMode = "FIXED";
    c.resize(44, 25);
    setFill(c, s === "On" ? "ok" : "track");
    const knob = circle(19, "on-accent");
    knob.effects = [{
      type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.18 },
      offset: { x: 0, y: 1 }, radius: 2, spread: 0, visible: true, blendMode: "NORMAL",
    }];
    add(c, knob);
    list.push(c);
  }
  placeSet(list, "Switch", "44×25 · knob 19");
}

/* 아바타 */
function buildAvatar() {
  const SZ = { SM: 24, MD: 30, LG: 44 };
  const list = [];
  for (const s of Object.keys(SZ)) {
    const d = SZ[s];
    const c = comp("Size=" + s, "h", { gap: 0, radius: 999 });
    c.primaryAxisSizingMode = "FIXED";
    c.counterAxisSizingMode = "FIXED";
    c.resize(d, d);
    setFill(c, "avatar-bg");
    const t = txt("MR", s === "LG" ? "Body Strong" : "Label Micro", "on-accent");
    t.textAlignHorizontal = "CENTER";
    add(c, t);
    list.push(c);
  }
  placeSet(list, "Avatar", "이니셜 2자 — 현장 인력 사진이 없으므로 사진 아바타를 쓰지 않는다.");
}

/* KPI 카드 */
function buildKpi() {
  const TONES = { Default: "ink", OK: "ok", Warn: "warn", Danger: "danger", Info: "info" };
  const list = [];
  for (const t of Object.keys(TONES)) {
    const accent = TONES[t];
    const c = comp("Tone=" + t, "v", { pad: [16, 18, 18, 18], gap: 10, radius: 14, align: "MIN", justify: "MIN" });
    c.primaryAxisSizingMode = "FIXED";
    c.counterAxisSizingMode = "FIXED";
    c.resize(260, 148);
    setFill(c, "surface");
    setStroke(c, "line", 1);

    const head = autoFrame("head", "h", { gap: 8 });
    add(c, head, { stretch: true });
    head.primaryAxisSizingMode = "FIXED";
    add(head, txt("AVG UTILIZATION", "Label Micro", "muted"), { grow: true });
    add(head, iconSlot(16, accent));

    add(c, txt("76%", "KPI Value", "ink"));
    add(c, txt("이번 달 평균 가동률", "Caption", "muted"), { stretch: true });

    const track = autoFrame("bar", "h", { gap: 0, radius: 999 });
    add(c, track, { stretch: true });
    track.primaryAxisSizingMode = "FIXED";
    track.counterAxisSizingMode = "FIXED";
    track.resize(224, 5);
    setFill(track, "surface-3");
    track.clipsContent = true;
    add(track, box(160, 5, 999, accent));

    list.push(c);
  }
  placeSet(list, "KPI Card", "260×148 · 수치는 tabular-nums");
}

/* 미터 */
function buildMeter() {
  const L = { Low: ["danger", 32], Normal: ["ok", 76], High: ["warn", 94] };
  const list = [];
  for (const k of Object.keys(L)) {
    const color = L[k][0], pct = L[k][1];
    const c = comp("Level=" + k, "h", { gap: 8 });
    c.primaryAxisSizingMode = "FIXED";
    c.counterAxisSizingMode = "FIXED";
    c.resize(104, 16);

    const track = autoFrame("track", "h", { gap: 0, radius: 999 });
    add(c, track);
    track.primaryAxisSizingMode = "FIXED";
    track.counterAxisSizingMode = "FIXED";
    track.resize(62, 6);
    setFill(track, "surface-3");
    track.clipsContent = true;
    add(track, box(62 * (pct / 100), 6, 999, color));

    const t = txt(pct + "%", "Label Micro", "muted");
    t.textAlignHorizontal = "RIGHT";
    add(c, t, { grow: true });
    list.push(c);
  }
  placeSet(list, "Meter", "Low <50% · Normal · High ≥85%");
}

/* 간트 바 — 스케줄 화면의 핵심 */
function buildGanttBar() {
  const mk = (name, cfg) => {
    const c = comp(name, "h", { pad: [0, 6, 0, 6], gap: 4, radius: 6 });
    c.primaryAxisSizingMode = "FIXED";
    c.counterAxisSizingMode = "FIXED";
    c.resize(cfg.w || 160, 34);
    if (cfg.fill) setFill(c, cfg.fill);
    if (cfg.stroke) setStroke(c, cfg.stroke, cfg.sw || 1);
    if (cfg.dashed) c.dashPattern = [4, 3];
    add(c, txt(cfg.label, "Label Micro", cfg.fg));
    return c;
  };
  const list = [
    mk("State=Default",  { fill: "project/1", fg: "on-accent", label: "KCVG" }),
    mk("State=Selected", { fill: "project/1", fg: "on-accent", label: "KCVG", stroke: "ink", sw: 2 }),
    mk("State=Conflict", { fill: "project/1", fg: "on-accent", label: "KCVG", stroke: "danger", sw: 2 }),
    mk("State=TimeOff",  { fill: "danger-bg", fg: "danger-fg", label: "TIME OFF", stroke: "danger", dashed: true }),
    mk("State=Pending",  { fill: "warn-bg",   fg: "warn-fg",   label: "휴가 대기", stroke: "warn", dashed: true }),
  ];
  placeSet(list, "Gantt Bar",
    "연속 근무 구간 = 하나의 바. Conflict는 danger 외곽선 + 45° 해칭(Figma에서 패턴 오버레이 추가). 빨강은 충돌 전용이라 프로젝트 색에서 배제.");
}

/* 노트 / 콜아웃 */
function buildNote() {
  const TONES = {
    Info:   ["info-bg", "info-fg"],
    Warn:   ["warn-bg", "warn-fg"],
    Danger: ["danger-bg", "danger-fg"],
    OK:     ["ok-bg", "ok-fg"],
  };
  const list = [];
  for (const t of Object.keys(TONES)) {
    const c = comp("Tone=" + t, "h", { pad: [13, 15, 13, 15], gap: 11, radius: 10, align: "MIN" });
    c.primaryAxisSizingMode = "FIXED";
    c.resize(420, c.height);
    setFill(c, TONES[t][0]);
    add(c, iconSlot(17, TONES[t][1]));
    add(c, txt("이 기간에 활성 배정 3건 — 승인 시 자동 해제됩니다.", "Body Small", TONES[t][1]), { grow: true });
    list.push(c);
  }
  placeSet(list, "Note", "인라인 경고 · 안내");
}

/* 테이블 행 */
function buildTableRow() {
  const STATES = { Default: "surface", Hover: "surface-2", Selected: "accent-soft" };
  const list = [];
  for (const s of Object.keys(STATES)) {
    const c = comp("State=" + s, "h", { pad: [0, 16, 0, 16], gap: 16, justify: "MIN" });
    c.primaryAxisSizingMode = "FIXED";
    c.counterAxisSizingMode = "FIXED";
    c.resize(720, 52);
    setFill(c, STATES[s]);

    add(c, box(9, 9, 3, "project/4"));
    add(c, txt("KCVG — Hyperscale Campus", "Body Strong", "ink"), { grow: true });
    add(c, txt("Alicia Monroe", "Body Small", "muted"));

    const badge = comp("badge", "h", { pad: [0, 9, 0, 9], radius: 999 });
    badge.counterAxisSizingMode = "FIXED";
    badge.resize(badge.width, 22);
    setFill(badge, "ok-bg");
    add(badge, txt("진행중", "Label Micro", "ok-fg"));
    add(c, badge);

    list.push(c);
  }
  placeSet(list, "Table Row", "높이 52 · 하단 1px line");
}

/* 내비 아이템 */
function buildNavItem() {
  const list = [];
  for (const s of ["Default", "Active"]) {
    const c = comp("State=" + s, "h", { pad: [9, 10, 9, 10], gap: 11, radius: 10, justify: "MIN" });
    c.primaryAxisSizingMode = "FIXED";
    c.counterAxisSizingMode = "FIXED";
    c.resize(224, 38);
    if (s === "Active") setFill(c, "surface-3");
    add(c, iconSlot(18, s === "Active" ? "accent" : "muted"));
    add(c, txt("Schedule", "Body Strong", s === "Active" ? "ink" : "ink-2"), { grow: true });
    if (s === "Active") {
      const pill = comp("pill", "h", { pad: [0, 6, 0, 6], radius: 999 });
      pill.counterAxisSizingMode = "FIXED";
      pill.resize(pill.width, 19);
      setFill(pill, "danger");
      add(pill, txt("6", "Label Micro", "on-accent"));
      add(c, pill);
    }
    list.push(c);
  }
  placeSet(list, "Nav Item", "Active 시 좌측 3px accent 인디케이터 (Figma에서 추가)");
}

/* ---------- 7. Foundations 페이지 ---------- */
function buildFoundations() {
  const p = figma.createPage();
  p.name = "📐 Foundations";

  const wrap = autoFrame("Foundations", "v", { gap: 28, pad: [40, 40, 40, 40], align: "MIN" });
  wrap.x = 0; wrap.y = 0;
  setFill(wrap, "bg");
  p.appendChild(wrap);

  add(wrap, txt("VOLTA Scheduler — Design Tokens", "Page Title", "ink"));
  add(wrap, txt("assets/style.css 와 1:1 동기화된 토큰. 라이트/다크는 변수 모드로 전환합니다.", "Body Small", "muted"));

  const group = (label, names) => {
    const sec = autoFrame(label, "v", { gap: 10, align: "MIN" });
    add(wrap, sec);
    add(sec, txt(label, "Label Micro", "muted"));

    const grid = autoFrame("grid", "h", { gap: 10, align: "MIN" });
    add(sec, grid);
    grid.layoutWrap = "WRAP";
    grid.primaryAxisSizingMode = "FIXED";
    grid.counterAxisSpacing = 10;
    grid.resize(1000, grid.height);

    names.forEach((n) => {
      const cell = autoFrame(n, "v", { gap: 6, align: "MIN" });
      add(grid, cell);
      cell.primaryAxisSizingMode = "FIXED";
      cell.counterAxisSizingMode = "FIXED";
      cell.resize(150, 92);
      const sw = box(150, 52, 8, n);
      setStroke(sw, "line", 1);
      add(cell, sw);
      add(cell, txt("--" + n, "Caption", "ink-2"));
    });
  };

  group("Surface / Ink", ["bg", "surface", "surface-2", "surface-3", "line", "line-strong", "ink", "ink-2", "muted", "faint"]);
  group("Brand / Interactive", ["primary", "primary-ink", "accent", "accent-soft", "focus"]);
  group("Semantic", ["ok", "ok-bg", "ok-fg", "warn", "warn-bg", "warn-fg", "danger", "danger-bg", "danger-fg", "info", "info-bg", "info-fg"]);
  group("Project (Categorical) — 빨강 없음", Object.keys(COLOR).filter((k) => k.indexOf("project/") === 0));

  const typeSec = autoFrame("Typography", "v", { gap: 14, align: "MIN" });
  add(wrap, typeSec);
  add(typeSec, txt("Typography", "Label Micro", "muted"));
  Object.keys(TYPE).forEach((n) => {
    const row = autoFrame(n, "h", { gap: 20 });
    add(typeSec, row);
    add(row, txt(n, "Caption", "muted"), { w: 110 });
    add(row, txt("현장의 오늘을 한 화면에 · 221 Technicians", n, "ink"));
  });

  return p;
}

/* ---------- 8. 실행 ---------- */
async function main() {
  const family = await loadFonts();

  buildVariables();
  buildTextStyles();
  buildEffectStyles();

  PAGE = figma.createPage();
  PAGE.name = "🧩 Components";

  buildButtons();
  buildBadges();
  buildShiftBadges();
  buildChip();
  buildInputs();
  buildSwitch();
  buildAvatar();
  buildKpi();
  buildMeter();
  buildGanttBar();
  buildNote();
  buildTableRow();
  buildNavItem();

  const foundations = buildFoundations();

  if (figma.setCurrentPageAsync) await figma.setCurrentPageAsync(foundations);
  else figma.currentPage = foundations;

  const msg = USE_VARS
    ? "완료 — 변수(Light/Dark) · 텍스트 11 · 그림자 4 · 컴포넌트 13세트 (폰트: " + family + ")"
    : "완료 — 이 버전은 변수 미지원이라 페인트 스타일로 생성했습니다 (폰트: " + family + ")";
  figma.notify(msg, { timeout: 5000 });
  figma.closePlugin(msg);
}

main().catch((e) => {
  figma.notify("오류: " + e.message, { error: true, timeout: 6000 });
  figma.closePlugin();
});
