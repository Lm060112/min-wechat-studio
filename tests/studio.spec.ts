import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";

test("首页、筛选、搜索、导航和响应式视觉", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "把日常，写成自己的故事。" }),
  ).toBeVisible();
  await expect(page.locator(".draft-card")).toHaveCount(3);
  await page.screenshot({
    path: "artifacts/studio-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "成长手记", exact: true }).click();
  await expect(page.locator(".draft-card")).toHaveCount(1);
  await page.getByRole("button", { name: "全部手记", exact: true }).click();
  await page.getByRole("textbox", { name: "搜索手记" }).fill("AI");
  await expect(page.locator(".draft-card")).toHaveCount(1);
  await page.getByRole("button", { name: "视觉规范", exact: true }).click();
  await expect(page.getByText("#425F4D")).toBeVisible();
  await page.getByRole("button", { name: "工作台", exact: true }).click();
  await page.getByRole("textbox", { name: "搜索手记" }).fill("");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/studio-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("编辑、刷新持久化、Markdown/HTML 导出及脚本过滤", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "新建手记", exact: true }).click();
  await page.getByRole("textbox", { name: "文章标题" }).fill("测试手记");
  await page
    .getByRole("textbox", { name: "Markdown 正文" })
    .fill(
      "## 一点光\n\n> 慢慢生长\n\n---\n\n**你好**\n\n<script>window.hacked=true</script>",
    );
  await expect(page.locator(".phone h2")).toHaveText("一点光");
  await expect(page.locator(".phone blockquote")).toHaveText("慢慢生长");
  await expect(page.locator(".phone script")).toHaveCount(0);
  await page.reload();
  await page
    .getByRole("button", { name: "编辑 测试手记", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Markdown 正文" }),
  ).toHaveValue(/一点光/);
  for (const type of ["Markdown", "导出 HTML"]) {
    const wait = page.waitForEvent("download");
    await page.getByRole("button", { name: type, exact: true }).click();
    const file = await wait;
    const text = await fs.readFile((await file.path())!, "utf8");
    expect(text).toContain("一点光");
    if (type === "导出 HTML") {
      expect(text).not.toContain("<script>");
      expect(text).toContain("<blockquote>");
    }
  }
  await page
    .locator('input[type=file][accept^="image"]')
    .first()
    .setInputFiles({
      name: "article.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await expect(page.locator(".phone .article-content img")).toHaveCount(1);
  await page.screenshot({
    path: "artifacts/studio-editor.png",
    fullPage: true,
  });
});
test("封面照片、三套母版和 PNG 精确尺寸", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /此刻有感 生活碎片/ }).click();
  const title = page.locator(".editor-panel textarea");
  await title.fill("收藏日常\n慢慢生长");
  await page
    .locator(".category-options")
    .getByRole("button", { name: "技术与实践" })
    .click();
  await expect(page.locator(".preview-panel .cover")).toHaveClass(/category-1/);
  await page
    .locator(".category-options")
    .getByRole("button", { name: "成长手记" })
    .click();
  await expect(page.locator(".preview-panel .cover")).toHaveClass(/category-2/);
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  );
  await page
    .locator('input[type=file][accept^="image"]')
    .last()
    .setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: pixel });
  await expect(page.getByText("替换照片")).toBeVisible();
  for (const [button, w, h] of [
    ["导出主封面", 900, 383],
    ["方形 600 × 600", 600, 600],
  ] as const) {
    const wait = page.waitForEvent("download");
    await page.getByRole("button", { name: button, exact: true }).click();
    const file = await wait;
    const data = await fs.readFile((await file.path())!);
    expect(data.readUInt32BE(16)).toBe(w);
    expect(data.readUInt32BE(20)).toBe(h);
  }
  await page.getByRole("button", { name: "移除照片，使用母版底纹" }).click();
  await expect(page.getByText("添加一张日常的切片")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "artifacts/studio-cover.png", fullPage: true });
});
test("JSON 备份导出、导入与无效文件保护", async ({ page }) => {
  await page.goto("/");
  const wait = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出备份", exact: true }).click();
  const file = await wait;
  const backup = await fs.readFile((await file.path())!);
  const data = JSON.parse(backup.toString());
  expect(data.drafts).toHaveLength(3);
  await page.evaluate(() => localStorage.setItem("mins-diary-v1", "[]"));
  await page.reload();
  await expect(page.locator(".draft-card")).toHaveCount(0);
  page.on("dialog", (dialog) => dialog.accept());
  await page.locator('input[accept="application/json,.json"]').setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: backup,
  });
  await expect(page.locator(".draft-card")).toHaveCount(3);
  await page.locator('input[accept="application/json,.json"]').setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"drafts":[{"title":"bad"}]}'),
  });
  await expect(page.getByRole("status")).toContainText("备份格式无效");
  await expect(page.locator(".draft-card")).toHaveCount(3);
});
