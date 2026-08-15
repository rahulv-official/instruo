import { expect, test } from "@playwright/test";

test("homepage exposes task-first navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Instruo/);
  await expect(page.getByRole("heading", { name: /Tools for the task/i })).toBeVisible();
  await expect(page.getByRole("textbox", { name: /Search tools and games/i })).toBeVisible();
});

test("a catalogue route opens without a hydration error", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/tools");
  await expect(
    page.getByRole("heading", { name: /The right tool, without the detour/i }),
  ).toBeVisible();
  expect(errors.filter((message) => /hydration|unhandled/i.test(message))).toEqual([]);
});

test("catalogues support direct keyboard filtering", async ({ page }) => {
  await page.goto("/tools");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Everyday/ }).click();
  await expect(page).toHaveURL(/category=Everyday/);

  const toolSearch = page.getByRole("textbox", { name: "Search tools" });
  await page.keyboard.press("/");
  await expect(toolSearch).toBeFocused();
  await toolSearch.fill("world clock");
  await expect(page.getByRole("link", { name: /World Clock/i })).toBeVisible();

  await page.goto("/games");
  await page.waitForLoadState("networkidle");
  const gameSearch = page.getByRole("textbox", { name: "Search games" });
  await gameSearch.fill("wordle");
  await expect(page.getByRole("link", { name: "Play Wordle" })).toBeVisible();
});

test("catalogue pages do not overflow a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const path of ["/tools", "/games"]) {
    await page.goto(path);
    const widths = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(widths.content).toBe(widths.viewport);
  }
});
