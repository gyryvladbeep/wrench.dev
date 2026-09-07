import { Page, Locator, expect } from "@playwright/test";
import { fillRobust } from "../support/robust-fill";

/** Page Object для /tools/json-diff (components/tools/JsonDiffTool.tsx). */
export class JsonDiffPage {
  readonly page: Page;
  readonly left: Locator;
  readonly right: Locator;
  readonly errorBox: Locator;
  readonly showUnchanged: Locator;
  readonly identicalMessage: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.left = page.locator("textarea").nth(0);
    this.right = page.locator("textarea").nth(1);
    // Блок ошибки парсинга — единственный <div> с классом text-red-400
    // (у самих diff-строк text-red-400 висит на <p>, не на <div>).
    this.errorBox = page.locator("div.text-red-400");
    this.showUnchanged = page.locator('input[type="checkbox"]');
    this.identicalMessage = page.getByText("✓ JSONs are identical");
    this.rows = page.locator("div.flex.gap-3.rounded-lg.border");
  }

  async goto() {
    await this.page.goto("/en/tools/json-diff");
  }

  async setLeft(json: string) {
    await fillRobust(this.left, json);
  }

  async setRight(json: string) {
    await fillRobust(this.right, json);
  }

  statText(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }

  /**
   * .check() иногда тоже "не долетает" под нагрузкой (тот же класс
   * нестабильности, что и у fill()/click() в других инструментах) —
   * повторяем клик, пока чекбокс реально не станет checked.
   */
  async toggleShowUnchanged() {
    for (let attempt = 0; attempt < 3; attempt++) {
      const wasChecked = await this.showUnchanged.isChecked();
      await this.showUnchanged.click();
      try {
        await expect(this.showUnchanged).toBeChecked({ checked: !wasChecked, timeout: 1500 });
        return;
      } catch {
        // не переключилось — пробуем ещё раз.
      }
    }
    await this.showUnchanged.click();
  }
}
