import { test, expect } from "@playwright/test";
import { LinkUnfurlMetaCheckerPage } from "./pages/LinkUnfurlMetaCheckerPage";

test.describe("link-unfurl-meta-checker", () => {
  let tool: LinkUnfurlMetaCheckerPage;

  test.beforeEach(async ({ page }) => {
    tool = new LinkUnfurlMetaCheckerPage(page);
    await tool.goto();
  });

  test("образец: превью с заголовком и абсолютной картинкой", async () => {
    await expect(tool.preview).toHaveAttribute("data-title", "Acme Chat 4.2 is here");
    await expect(tool.preview).toHaveAttribute("data-image", "https://acme.example/img/release-4-2.png");
  });

  test("образец даёт четыре замечания", async () => {
    for (const code of ["image-relative", "url-mismatch", "image-size-missing", "no-twitter-card"]) {
      await expect(tool.finding(code)).toBeVisible();
    }
  });

  test("минимальный HTML с одним og:title порождает замечания про описание и картинку", async () => {
    await tool.html.fill('<meta property="og:title" content="T">');

    await expect(tool.preview).toHaveAttribute("data-title", "T");
    await expect(tool.finding("no-description")).toBeVisible();
    await expect(tool.finding("no-image")).toBeVisible();
    await expect(tool.finding("no-og-title")).toHaveCount(0);
  });

  test("пустой HTML сообщает об отсутствии og:title", async () => {
    await tool.html.fill("<title>Only a title</title>");

    await expect(tool.finding("no-og-title")).toBeVisible();
  });
});
