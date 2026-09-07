import { Page, Locator, expect } from "@playwright/test";

/** Page Object для /tools/date-difference (components/tools/DateTimeTools.tsx,
 *  DateDifferenceTool). */
export class DateDifferencePage {
  readonly page: Page;
  readonly startInput: Locator;
  readonly endInput:   Locator;
  readonly fallbackMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startInput = page.locator('input[type="date"]').first();
    this.endInput   = page.locator('input[type="date"]').nth(1);
    this.fallbackMessage = page.getByText("Enter two valid dates to calculate the difference.");
  }

  async goto() {
    await this.page.goto("/en/tools/date-difference");
  }

  /**
   * fill() на <input type="date"> изредка вообще не регистрируется (не только
   * "не успевает" — сам факт записи иногда молча не происходит, подтверждено
   * live-прогоном: toHaveValue после fill() возвращал дефолт компонента).
   * Поэтому проверки "fill, потом assert" недостаточно — assert лишь
   * повторяет ЧТЕНИЕ, а не запись. Здесь мы повторяем саму ЗАПИСЬ, пока
   * значение реально не проставится.
   */
  private async fillDateRobust(locator: Locator, value: string) {
    for (let attempt = 0; attempt < 3; attempt++) {
      await locator.fill(value);
      try {
        await expect(locator).toHaveValue(value, { timeout: 1500 });
        return;
      } catch {
        // значение не проставилось — пробуем ещё раз.
      }
    }
    // Последняя попытка — если и она не сработает, тест упадёт с честной
    // ошибкой (без проглатывания).
    await locator.fill(value);
    await expect(locator).toHaveValue(value);
  }

  async setDates(start: string, end: string) {
    await this.fillDateRobust(this.startInput, start);
    await this.fillDateRobust(this.endInput, end);
  }

  /** Значение статистики по подписи ("Years"/"Months"/"Days"/"Total days"/"Total weeks"/"Total hours"). */
  statValue(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator("xpath=preceding-sibling::p[1]");
  }
}
