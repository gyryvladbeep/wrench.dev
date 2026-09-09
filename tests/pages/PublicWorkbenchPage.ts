import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object для публичной read-only страницы /w/[id]
 * (app/[locale]/w/[id]/page.tsx + components/workbench/PublicWorkbenchView.tsx).
 *
 * Отдельный класс, а не расширение WorkbenchPage — это принципиально
 * другая страница (без авторизации, без тулбара, без drag & drop),
 * общий у них только рендер самого холста (WorkbenchCanvas).
 */
export class PublicWorkbenchPage {
  readonly page: Page;
  readonly heading:       Locator;
  readonly readOnlyBadge: Locator;
  readonly notFoundTitle: Locator;
  readonly notFoundCta:   Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading       = page.getByRole("heading", { level: 1 });
    this.readOnlyBadge = page.getByText("Read-only", { exact: true });
    this.notFoundTitle = page.getByText("This workbench isn't available", { exact: true });
    this.notFoundCta   = page.getByRole("link", { name: "Go to Wrench-Branch" });
  }

  async goto(id: string) {
    await this.page.goto(`/en/w/${id}`);
  }

  toolCardHeading(exactToolName: string): Locator {
    return this.page.getByRole("heading", { level: 3, name: exactToolName, exact: true });
  }

  /** На публичной странице нет кнопки "✕" — эта проверка используется
   *  именно как негативный тест: read-only и правда без права редактировать. */
  removeToolButton(exactToolName: string): Locator {
    return this.toolCardHeading(exactToolName).locator("..").getByRole("button", { name: "Remove from workbench" });
  }

  async expectFound() {
    await expect(this.readOnlyBadge).toBeVisible();
    await expect(this.notFoundTitle).toBeHidden();
  }

  async expectNotFound() {
    await expect(this.notFoundTitle).toBeVisible();
    await expect(this.notFoundCta).toBeVisible();
  }
}
