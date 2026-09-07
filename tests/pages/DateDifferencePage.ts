import { Page, Locator } from "@playwright/test";

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

  async setDates(start: string, end: string) {
    await this.startInput.fill(start);
    await this.endInput.fill(end);
  }

  /** Значение статистики по подписи ("Years"/"Months"/"Days"/"Total days"/"Total weeks"/"Total hours"). */
  statValue(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator("xpath=preceding-sibling::p[1]");
  }
}
