import { Page, Locator, expect } from "@playwright/test";

/** Page Object для /tools/age-calculator (components/tools/DateTimeTools.tsx,
 *  AgeCalculatorTool). */
export class AgeCalculatorPage {
  readonly page: Page;
  readonly birthInput: Locator;
  readonly asOfInput:  Locator;
  readonly yearsValue: Locator; // крупное число "N" над "years old"
  readonly fallbackMessage: Locator;
  readonly nextBirthdayText: Locator; // "🎂 Next birthday in N day(s)"

  constructor(page: Page) {
    this.page = page;
    this.birthInput = page.locator('input[type="date"]').first();
    this.asOfInput  = page.locator('input[type="date"]').nth(1);
    this.yearsValue = page.getByText("years old", { exact: true }).locator("xpath=preceding-sibling::p[1]");
    this.fallbackMessage = page.getByText("Enter a valid birth date to calculate age.", { exact: true });
    this.nextBirthdayText = page.getByText(/Next birthday in \d+ days?/);
  }

  async goto() {
    await this.page.goto("/en/tools/age-calculator");
  }

  /**
   * fill() на <input type="date"> изредка вообще не регистрируется (не только
   * "не успевает" — сам факт записи иногда молча не происходит, подтверждено
   * live-прогоном на date-difference: toHaveValue после fill() возвращал
   * дефолт компонента). Поэтому проверки "fill, потом assert" недостаточно —
   * assert лишь повторяет ЧТЕНИЕ, а не запись. Здесь мы повторяем саму
   * ЗАПИСЬ, пока значение реально не проставится.
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

  async setDates(birth: string, asOf: string) {
    await this.fillDateRobust(this.birthInput, birth);
    await this.fillDateRobust(this.asOfInput, asOf);
  }

  /** Значение статистики по подписи ("Months"/"Days"/"Total days"). */
  statValue(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator("xpath=preceding-sibling::p[1]");
  }
}
