import { expect, test } from "@playwright/test";

test.describe("Rotation Board flows", () => {
  test("onboarding loads demo and shows lineups", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.getByTestId("onboarding")).toBeVisible();
    await page.getByTestId("load-demo").click();
    await expect(page.getByTestId("lineups-page")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("5-1 Serve Receive")).toBeVisible();
  });

  test("roster lists demo players and supports add", async ({ page }) => {
    await page.goto("/onboarding");
    await page.getByTestId("load-demo").click();
    await expect(page.getByTestId("lineups-page")).toBeVisible({
      timeout: 15_000,
    });
    await page.goto("/roster");
    await expect(page.getByTestId("roster-page")).toBeVisible();
    await expect(page.getByText("Lord Ramos")).toBeVisible();
    await page.getByTestId("add-player").click();
    await page.getByTestId("player-name").fill("Quinn Demo");
    await page.getByTestId("save-player").click();
    await expect(page.getByText("Quinn Demo")).toBeVisible();
  });

  test("lineup builder autofill, save, match rotate undo", async ({ page }) => {
    await page.goto("/onboarding");
    await page.getByTestId("load-demo").click();
    await expect(page.getByTestId("lineups-page")).toBeVisible({
      timeout: 15_000,
    });
    await page.goto("/lineup");
    await expect(page.getByTestId("lineup-builder")).toBeVisible();
    await page.getByTestId("lineup-name").fill("E2E Autofill");
    await page.getByTestId("autofill").click();
    await expect(page.getByTestId("planned-subs")).toBeVisible();
    await page.getByTestId("add-planned-sub").click();
    await page.getByTestId("save-lineup").click();
    await page.getByTestId("btn-rotate").click();
    await expect(page.getByTestId("builder-rotation")).toContainText("R2");
    await page.getByTestId("btn-undo").click();
    await expect(page.getByTestId("builder-rotation")).toContainText("R1");
    await page.getByTestId("btn-match-mode").click();
    await expect(page.getByTestId("match-page")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("match-rotation")).toHaveText("R1");
    await page.getByTestId("btn-rotate").click();
    await expect(page.getByTestId("match-rotation")).toHaveText("R2");
    await page.getByTestId("btn-undo").click();
    await expect(page.getByTestId("match-rotation")).toHaveText("R1");
  });

  test("demo lineup match applies planned sub on rotate", async ({ page }) => {
    await page.goto("/onboarding");
    await page.getByTestId("load-demo").click();
    await expect(page.getByTestId("lineups-page")).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId("start-match-lu-51-sr").click();
    await expect(page.getByTestId("match-page")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("upcoming-planned-subs")).toBeVisible();
    await page.getByTestId("btn-rotate").click();
    await expect(page.getByTestId("match-rotation")).toHaveText("R2");
    // Milo replaces Jack at R2 on the demo 5-1 plan
    await expect(page.getByTestId("court-diagram").getByText("Sy")).toBeVisible();
  });

  test("settings export path is present", async ({ page }) => {
    await page.goto("/onboarding");
    await page.getByTestId("load-demo").click();
    await expect(page.getByTestId("lineups-page")).toBeVisible({
      timeout: 15_000,
    });
    await page.goto("/settings");
    await expect(page.getByTestId("settings-page")).toBeVisible();
    await expect(page.getByTestId("export-json")).toBeVisible();
    await expect(page.getByTestId("clear-data")).toBeVisible();
  });
});
