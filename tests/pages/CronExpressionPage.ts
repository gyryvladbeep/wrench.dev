import { Page, Locator, expect } from "@playwright/test";

/** Page Object для /tools/cron-expression (components/tools/CronExpressionTool.tsx). */
export class CronExpressionPage {
  readonly page: Page;
  readonly input: Locator;
  readonly description: Locator;
  // Строки "Next runs" — рендерятся только когда cron валиден и даёт результаты.
  readonly nextRunRows: Locator;

  constructor(page: Page) {
    this.page = page;
    // Поле выражения — единственный <input class="... font-mono text-lg ...">
    // на странице.
    this.input = page.locator("input.font-mono.text-lg");
    // Есть ещё один div с классами rounded-lg+border (блок "Syntax reference"),
    // но у его <p> другие классы, так что составной селектор ниже остаётся
    // однозначным.
    this.description = page.locator("div.rounded-lg.border p.text-sm.font-medium");
    this.nextRunRows = page.locator("div.rounded-md.border.border-border.bg-surface");
  }

  async goto() {
    await this.page.goto("/en/tools/cron-expression");
  }

  /**
   * fill() изредка молча не регистрируется под нагрузкой (тот же класс
   * нестабильности, что и на <input type="date"> в age-calculator/
   * date-difference — подтверждено live-прогоном: описание оставалось
   * дефолтным "0 9 * * 1-5", как будто fill() вообще не было). Поэтому
   * повторяем саму ЗАПИСЬ, а не только чтение.
   */
  async setExpression(value: string) {
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.input.fill(value);
      try {
        await expect(this.input).toHaveValue(value, { timeout: 1500 });
        return;
      } catch {
        // значение не проставилось — пробуем ещё раз.
      }
    }
    await this.input.fill(value);
    await expect(this.input).toHaveValue(value);
  }

  /**
   * Клик по кнопке-пресету изредка тоже молча "не долетает" под нагрузкой —
   * тот же класс нестабильности, что и у fill() (подтверждено live-прогоном:
   * поле оставалось на дефолтном "0 9 * * 1-5", как будто клика не было).
   * expectedValue — значение, которое должно появиться в поле после клика;
   * если оно не появилось, повторяем клик.
   */
  async clickPreset(label: string, expectedValue?: string) {
    const button = this.page.getByRole("button", { name: label, exact: true });
    if (!expectedValue) {
      await button.click();
      return;
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      await button.click();
      try {
        await expect(this.input).toHaveValue(expectedValue, { timeout: 1500 });
        return;
      } catch {
        // значение не проставилось — пробуем ещё раз.
      }
    }
    await button.click();
    await expect(this.input).toHaveValue(expectedValue);
  }
}
