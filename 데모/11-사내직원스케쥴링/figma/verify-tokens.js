#!/usr/bin/env node
/* ============================================================
   토큰 동기화 검증
   assets/style.css 의 CSS 변수와 figma/plugin/code.js 의 COLOR 맵을 대조한다.
   값이 어긋나면 Figma 파일과 코드가 따로 놀게 되므로, 토큰을 바꿀 때마다 실행할 것.

   실행: node figma/verify-tokens.js
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(ROOT, "assets", "style.css"), "utf8");
const code = fs.readFileSync(path.join(__dirname, "plugin", "code.js"), "utf8");

/* CSS 변수 블록 파싱 */
const blockOf = (re) => (css.match(re) || [, ""])[1];
const varsOf = (block) => {
  const out = {};
  block.replace(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi, (_, k, v) => ((out[k] = v.trim()), ""));
  return out;
};

const LIGHT = varsOf(blockOf(/:root\{([\s\S]*?)\n\}/));
const DARK = Object.assign({}, LIGHT, varsOf(blockOf(/html\[data-theme="dark"\]\{([\s\S]*?)\n\}/)));

/* var(--x) 체인 해석 */
function resolve(map, name) {
  let v = map[name];
  if (v == null) return null;
  let guard = 0;
  while (/var\(--([a-z0-9-]+)\)/i.test(v) && guard++ < 10) {
    v = v.replace(/var\(--([a-z0-9-]+)\)/gi, (_, k) => map[k] || "");
  }
  return v.trim().toLowerCase();
}

/* 색을 "r,g,b,a" 로 정규화 (#fff 와 #ffffff, .14 와 0.14 를 같게 본다) */
function norm(s) {
  if (!s) return null;
  s = s.trim().toLowerCase();
  if (s.indexOf("rgb") === 0) {
    const p = s.match(/\(([^)]+)\)/)[1].split(",").map((x) => parseFloat(x));
    return [p[0], p[1], p[2], p.length > 3 ? +p[3].toFixed(3) : 1].join(",");
  }
  let h = s.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
    1,
  ].join(",");
}

/* 플러그인 COLOR 맵 파싱 */
const PLUGIN = {};
const seg = (code.match(/const COLOR = \{([\s\S]*?)\n\};/) || [, ""])[1];
seg.replace(
  /"([a-z0-9/-]+)":\s*\["([^"]+)",\s*"([^"]+)"\]/gi,
  (_, k, l, d) => ((PLUGIN[k] = [l, d]), "")
);

/* 플러그인에만 있는(= CSS에서 인라인으로 쓰던) 토큰 */
const PLUGIN_ONLY = ["on-accent", "avatar-bg", "track"];

/* plugin 이름 → css 변수명 */
const toCss = (k) => (k.indexOf("project/") === 0 ? "c" + k.split("/")[1] : k);

let pass = 0;
const fail = [];

for (const key of Object.keys(PLUGIN)) {
  if (PLUGIN_ONLY.indexOf(key) !== -1) continue;
  const cssName = toCss(key);
  const cssLight = resolve(LIGHT, cssName);
  const cssDark = resolve(DARK, cssName);

  if (cssLight == null) {
    fail.push(`${key} — style.css 에 --${cssName} 가 없습니다`);
    continue;
  }
  const okLight = norm(cssLight) === norm(PLUGIN[key][0]);
  const okDark = norm(cssDark) === norm(PLUGIN[key][1]);

  if (okLight && okDark) pass++;
  else {
    fail.push(
      `${key} — ${!okLight ? "라이트" : "다크"}: ` +
        `css=${!okLight ? cssLight : cssDark} vs plugin=${!okLight ? PLUGIN[key][0] : PLUGIN[key][1]}`
    );
  }
}

const total = Object.keys(PLUGIN).length - PLUGIN_ONLY.length;

console.log("style.css ↔ Figma 플러그인 토큰 대조");
console.log(`  검증 ${total}개 (라이트/다크 각각) · 일치 ${pass}`);
if (fail.length) {
  console.log("  불일치:");
  fail.forEach((f) => console.log("   - " + f));
  console.log("\n토큰이 어긋났습니다. figma/plugin/code.js 의 COLOR 와 figma/tokens.json 을 갱신하세요.");
  process.exit(1);
}
console.log("  불일치 0 — 완전 동기화 ✓");
console.log(`  플러그인 전용 토큰: ${PLUGIN_ONLY.join(", ")} (CSS에서 인라인으로 쓰던 값을 승격)`);
