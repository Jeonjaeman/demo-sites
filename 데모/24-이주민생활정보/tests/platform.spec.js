const { test, expect } = require("@playwright/test");
const { pathToFileURL } = require("url");
const path = require("path");

const root = path.resolve(__dirname, "..");
const pageUrl = (file) => pathToFileURL(path.join(root, file)).toString();

test.describe("MOST user surface", () => {
  test("Given listings When filters change Then cards update and details open", async ({ page }) => {
    await page.goto(pageUrl("index.html"));

    await expect(page.getByRole("heading", { name: /러시아어권 이주민/ })).toBeVisible();
    await expect(page.locator(".listing-card")).toHaveCount(4);

    await page.locator('select[name="district"]').selectOption("김포");
    await expect(page.locator(".listing-card")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "김포 장기동 신축 오피스텔" })).toBeVisible();

    await page.getByRole("button", { name: "상세" }).click();
    await expect(page.locator("#listing-modal")).toBeVisible();
    await expect(page.getByText("보증보험 가능 여부 계약서 재확인")).toBeVisible();
  });

  test("Given provider form When invalid role data is submitted Then role validation is shown", async ({ page }) => {
    await page.goto(pageUrl("index.html") + "#register");

    await page.locator('select[name="role"]').selectOption("landlord");
    await expect(page.locator("[data-agent-only]").first()).toBeHidden();
    await page.locator('input[name="title"]').fill("시흥 투룸");
    await page.locator('input[name="phone"]').fill("010-1234-5678");
    await page.locator('textarea[name="description"]').fill("수수료 협의 가능한 중개 매물");
    await page.getByRole("button", { name: "검수 요청" }).click();

    await expect(page.locator("#form-result")).toContainText("임대인은 중개, 알선, 수수료 표현을 사용할 수 없습니다.");
    await page.locator('textarea[name="description"]').fill("임대인 직접 등록 매물");
    await page.locator('input[name="privacy"]').check();
    await page.getByRole("button", { name: "검수 요청" }).click();
    await expect(page.locator("#form-result")).toContainText("검수 요청이 시뮬레이션되었습니다.");
  });

  test("Given Korean UI When Russian is selected Then language content changes", async ({ page }) => {
    await page.goto(pageUrl("index.html"));

    await page.getByRole("button", { name: "RU" }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(page.getByRole("heading", { name: /MOST соединяет/ })).toBeVisible();
    await expect(page.getByText("Студия у станции Вонгок")).toBeVisible();
    await expect(page.getByRole("link", { name: "Жилье", exact: true })).toBeVisible();
    await expect(page.getByText("На проверке").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Подробнее" }).first()).toBeVisible();
    await expect(page.getByText("Депозит").first()).toBeVisible();
    await expect(page.getByText("Источник:", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "RU" })).toHaveAttribute("aria-pressed", "true");
  });

  test("Given reduced motion When the page loads Then final metric values appear immediately", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(pageUrl("index.html"));

    await expect(page.locator('[data-count="4"]')).toHaveText("4");
    await expect(page.locator('[data-count="3"]')).toHaveText("3");
    await expect(page.locator('[data-count="2"]')).toHaveText("2");
  });
});

test.describe("MOST admin surface", () => {
  test("Given admin queue When status actions and filters run Then state changes visibly", async ({ page }) => {
    await page.goto(pageUrl("admin.html"));

    await expect(page.locator("#queue-body tr")).toHaveCount(4);
    await page.locator('select[name="status"]').selectOption("pending");
    await expect(page.locator("#queue-body tr")).toHaveCount(1);

    await page.getByRole("button", { name: "승인" }).click();
    await expect(page.getByText("H-102 상태가 승인완료로 변경되었습니다.")).toBeVisible();
    await expect(page.getByText("조건에 맞는 매물이 없습니다.")).toBeVisible();
  });

  test("Given admin dashboard When CSV is downloaded Then UTF-8 BOM file is produced", async ({ page }) => {
    await page.goto(pageUrl("admin.html"));

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "UTF-8 BOM CSV 다운로드" }).click();
    const download = await downloadPromise;
    const path = await download.path();
    const fs = require("fs");
    const buffer = fs.readFileSync(path);

    expect(download.suggestedFilename()).toBe("most-listings.csv");
    expect([...buffer.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  });

  test("Given a mobile admin viewport When the queue loads Then moderation actions remain visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(pageUrl("admin.html"));

    await expect(page.getByRole("button", { name: "승인" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "반려" }).first()).toBeVisible();
    const actionBox = await page.getByRole("button", { name: "승인" }).first().boundingBox();
    expect(actionBox).not.toBeNull();
    expect(actionBox.x + actionBox.width).toBeLessThanOrEqual(375);
  });
});
