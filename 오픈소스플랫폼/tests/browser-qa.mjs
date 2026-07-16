import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const root = new URL("../.omx/evidence/browser-review-v9/", import.meta.url);
const profileDir = await mkdtemp(join(tmpdir(), "campus-ai-browser-qa-"));
const debugPort = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(chromePath, [
  "--headless=new",
  "--hide-scrollbars",
  "--run-all-compositor-stages-before-draw",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profileDir}`,
  "about:blank",
], { stdio: "ignore" });
process.on("exit", () => chrome.kill());

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchJson(url, options) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response.json();
    } catch {
      await delay(125);
    }
  }
  throw new Error(`Chrome DevTools endpoint unavailable: ${url}`);
}

const target = await fetchJson(`http://localhost:${debugPort}/json/new?http://localhost:3000/`, { method: "PUT" });
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let commandId = 0;
let viewportWidth = 1280;
let viewportHeight = 900;
let navigationSequence = 0;
const pending = new Map();
const consoleErrors = [];

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const handlers = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) handlers.reject(new Error(message.error.message));
    else handlers.resolve(message.result);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") {
    consoleErrors.push(message.params.exceptionDetails.text);
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    consoleErrors.push("console.error");
  }
});

function command(method, params = {}) {
  commandId += 1;
  return new Promise((resolve, reject) => {
    pending.set(commandId, { resolve, reject });
    socket.send(JSON.stringify({ id: commandId, method, params }));
  });
}

async function evaluate(expression) {
  const result = await command("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(expression, label) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function clickButton(label) {
  const clicked = await evaluate(`(() => {
    const candidates = Array.from(document.querySelectorAll("button"));
    const button = candidates.find((item) => item.textContent?.trim().includes(${JSON.stringify(label)}) && item.getClientRects().length > 0);
    if (!button) return false;
    button.click();
    return true;
  })()`);
  assert.equal(clicked, true, `button should be visible: ${label}`);
  await delay(120);
}

async function setQuery(value) {
  const changed = await evaluate(`(() => {
    const field = document.querySelector("#tutor-query");
    if (!(field instanceof HTMLTextAreaElement)) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(field, ${JSON.stringify(value)});
    field.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  })()`);
  assert.equal(changed, true, "tutor query field should exist");
  await delay(80);
}

async function setViewport(width, height) {
  viewportWidth = width;
  viewportHeight = height;
  await command("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await delay(100);
}

async function screenshot(relativePath) {
  const versionedPath = relativePath.replace(/\.png$/, "-v9.png");
  const captureOptions = {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width: viewportWidth, height: viewportHeight, scale: 1 },
  };
  let result;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    result = await command("Page.captureScreenshot", captureOptions);
    const complete = await evaluate(`(async () => {
      const image = new Image();
      image.src = "data:image/png;base64,${result.data}";
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return false;
      context.drawImage(image, 0, 0);
      const shellSampleHeight = Math.min(130, image.height);
      const pixels = context.getImageData(0, 0, image.width, shellSampleHeight).data;
      let mintPixels = 0;
      let brandTextPixels = 0;
      let navigationTextPixels = 0;
      for (let y = 0; y < shellSampleHeight; y += 1) {
        for (let x = 0; x < Math.min(190, image.width); x += 1) {
          const index = (y * image.width + x) * 4;
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          if (x >= 8 && x <= 52 && y >= 8 && y <= 58 && red < 130 && green > 150 && blue > 90) mintPixels += 1;
          if (x >= 48 && x <= 170 && y <= 54 && red > 170 && green > 170 && blue > 160) brandTextPixels += 1;
          if (y >= 68 && red > 150 && green > 150 && blue > 145) navigationTextPixels += 1;
        }
      }
      const navigationReady = image.width < 600 || navigationTextPixels > 15;
      return mintPixels > 120 && brandTextPixels > 80 && navigationReady;
    })()`);
    if (complete) break;
    if (attempt === 6) throw new Error(`Incomplete shell paint after 6 attempts: ${versionedPath}`);
    console.log(`RETRY incomplete shell paint ${attempt}: ${versionedPath}`);
    await command("Emulation.setDeviceMetricsOverride", {
      width: viewportWidth,
      height: viewportHeight + 1,
      deviceScaleFactor: 1,
      mobile: viewportWidth < 600,
    });
    await delay(35);
    await command("Emulation.setDeviceMetricsOverride", {
      width: viewportWidth,
      height: viewportHeight,
      deviceScaleFactor: 1,
      mobile: viewportWidth < 600,
    });
    await evaluate(`(async () => {
      document.body.style.visibility = "hidden";
      void document.body.offsetHeight;
      document.body.style.visibility = "visible";
      void document.body.offsetHeight;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return true;
    })()`);
    await delay(90);
  }
  assert.ok(result, `screenshot result should exist: ${versionedPath}`);
  const path = new URL(versionedPath, root);
  await mkdir(new URL("./", path), { recursive: true });
  await writeFile(path, Buffer.from(result.data, "base64"));
}

async function stabilizeFrame() {
  const metrics = {
    width: viewportWidth,
    deviceScaleFactor: 1,
    mobile: viewportWidth < 600,
  };
  await command("Emulation.setDeviceMetricsOverride", { ...metrics, height: viewportHeight + 1 });
  await delay(30);
  await command("Emulation.setDeviceMetricsOverride", { ...metrics, height: viewportHeight });
  await delay(60);
  await evaluate(`(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = 0;
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
    const main = document.querySelector(".main-stage");
    if (main instanceof HTMLElement) main.scrollTop = 0;
    const current = document.querySelector(".mobile-nav button[aria-current='page']");
    const nav = document.querySelector(".mobile-nav");
    if (current instanceof HTMLElement && nav instanceof HTMLElement && nav.clientWidth > 0) {
      nav.scrollLeft = Math.max(0, current.offsetLeft - (nav.clientWidth - current.clientWidth) / 2);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return true;
  })()`);
  await delay(350);
  await waitFor(`(() => {
    const topbar = document.querySelector(".topbar");
    const brand = document.querySelector(".brand");
    const activePanel = document.querySelector("main > section:not([hidden]) .panel");
    const main = document.querySelector(".main-stage");
    if (!(topbar instanceof HTMLElement) || !(brand instanceof HTMLElement) || !(activePanel instanceof HTMLElement) || !(main instanceof HTMLElement)) return false;
    const topbarRect = topbar.getBoundingClientRect();
    const brandRect = brand.getBoundingClientRect();
    return window.scrollX === 0 && window.scrollY === 0 && main.scrollTop === 0 && topbarRect.top >= -0.5 && brandRect.top >= -0.5 && brandRect.width > 80;
  })()`, "stable top-level frame");
  await evaluate(`(async () => {
    document.body.style.visibility = "hidden";
    void document.body.offsetHeight;
    document.body.style.visibility = "visible";
    void document.body.offsetHeight;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    return true;
  })()`);
  await delay(80);
}

async function preparePlatform() {
  navigationSequence += 1;
  await command("Page.navigate", { url: `http://localhost:3000/?qa=${navigationSequence}` });
  await waitFor(`location.search === "?qa=${navigationSequence}" && document.readyState === 'complete' && document.body.innerText.includes('운영 가능한 상태')`, "platform render");
  await delay(400);
  await evaluate(`(() => {
    const style = document.createElement("style");
    style.dataset.qa = "stable-motion";
    style.textContent = "*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.001ms!important;transition-duration:.001ms!important}";
    document.head.append(style);
    return true;
  })()`);
}

await command("Page.enable");
await command("Runtime.enable");
await command("Log.enable");
await setViewport(1280, 900);
await preparePlatform();

assert.equal(await evaluate("document.querySelector('[aria-live=polite]')?.textContent?.includes('교수자')"), true);
await clickButton("학생");
await waitFor("document.querySelector('[aria-live=polite]')?.textContent?.includes('학생')", "role live announcement");
await evaluate(`(() => {
  const firstRole = document.querySelector(".header-role button");
  if (!(firstRole instanceof HTMLButtonElement)) return false;
  firstRole.focus();
  return true;
})()`);
await command("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
await command("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
assert.equal(await evaluate("document.activeElement?.textContent?.trim() === '교수자'"), true, "role controls must be keyboard reachable");
assert.equal(await evaluate(`(() => [...document.querySelectorAll(".header-role button")]
  .every((button) => button.getBoundingClientRect().height >= 44))()`), true, "role controls must meet the 44px touch target");
await clickButton("AI 튜터");
assert.equal(await evaluate(`(() => {
  const field = document.querySelector("#tutor-query");
  if (!(field instanceof HTMLTextAreaElement)) return false;
  field.focus();
  const style = getComputedStyle(field);
  return style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) >= 2;
})()`), true, "textarea must show a visible keyboard focus indicator");
assert.equal(await evaluate("document.querySelector('.example-query')?.getBoundingClientRect().height >= 44"), true, "example query must meet the 44px touch target");

await clickButton("교수자");
await clickButton("AI 튜터");
await setQuery("광합성의 명반응을 설명해줘");
await clickButton("질문 보내기");
await waitFor("document.body.innerText.includes('BIO-LECTURE-03') && document.body.innerText.includes('틸라코이드 막')", "cited RAG answer");
await stabilizeFrame();
await screenshot("desktop/tutor-cited-answer.png");

await preparePlatform();
await clickButton("학생");
await clickButton("보안·SSO");
await waitFor("document.body.innerText.includes('학생 역할에서 열 수 없습니다')", "student role guard");
assert.equal(await evaluate("document.querySelector('.access-denied') !== null"), true);
assert.equal(await evaluate("document.querySelector('.identity-flow') === null"), true);
await stabilizeFrame();
await screenshot("security-edge/student-denied.png");

await preparePlatform();
await clickButton("학생");
await clickButton("AI 튜터");
await setQuery("");
await clickButton("질문 보내기");
await waitFor("document.body.innerText.includes('질문을 입력해야 RAG 검색을 시작할 수 있습니다')", "empty query validation");
await stabilizeFrame();
await screenshot("security-edge/empty-query.png");

const viewports = [
  [375, 812, "mobile"],
  [768, 1024, "tablet"],
  [1280, 900, "desktop"],
];
const views = ["전환 개요", "AI 튜터", "보안·SSO", "배포·복구", "산출물"];

for (const [width, height, name] of viewports) {
  await setViewport(width, height);
  for (const view of views) {
    await preparePlatform();
    await clickButton("관리자");
    await clickButton(view);
    await stabilizeFrame();
    const overflow = await evaluate("document.documentElement.scrollWidth > window.innerWidth");
    assert.equal(overflow, false, `${name}/${view} must not overflow horizontally`);
    const fileName = view.replace("전환 개요", "overview").replace("AI 튜터", "tutor").replace("보안·SSO", "security").replace("배포·복구", "delivery").replace("산출물", "handover");
    await screenshot(`${name}/${fileName}.png`);
  }
}

assert.deepEqual(consoleErrors, [], `browser console errors: ${consoleErrors.join(", ")}`);
console.log("PASS cited RAG answer and source card");
console.log("PASS empty query validation and student role guard");
console.log("PASS 15 responsive view captures with zero horizontal overflow");
console.log("PASS role live announcement, keyboard navigation, visible focus, and 44px touch targets");

socket.close();
chrome.kill();
await delay(250);
await rm(profileDir, { recursive: true, force: true });
