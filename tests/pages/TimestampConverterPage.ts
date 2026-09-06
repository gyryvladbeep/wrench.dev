import { Page, Locator } from "@playwright/test";

export class TimestampConverterPage {
  readonly page: Page;

  readonly timestampInput: Locator;
  readonly nowButton:      Locator;
  readonly dateInput:      Locator;

  constructor(page: Page) {
    this.page = page;
    this.timestampInput = page.locator("#ts-input");
    this.nowButton       = page.getByRole("button", { name: "Now" });
    this.dateInput        = page.locator("#date-input");
  }

  async goto() {
    await this.page.goto("/en/tools/timestamp-converter");
  }

  async setTimestamp(value: string) {
    await this.timestampInput.fill(value);
  }

  async setDateTime(value: string) {
    // формат datetime-local: "YYYY-MM-DDTHH:mm"
    await this.dateInput.fill(value);
  }

  /** Текст блока результата "из timestamp" (Local/UTC/ISO) — читаем его
   *  целиком и ищем нужную подстроку в тесте, а не гадаем с локаторами
   *  внутри трёх похожих строк. */
  timestampResultText(): Locator {
    return this.timestampInput.locator("xpath=following-sibling::div[1]");
  }

  /** То же самое для блока "из даты" (Seconds/Milliseconds), но с уже
   *  распарсенными числами — так тестам не нужно самим парсить текст. */
  async getSecondsAndMillis(): Promise<{ seconds: number; millis: number } | null> {
    const block = this.dateInput.locator("xpath=following-sibling::div[1]");
    if (!(await block.count())) return null;
    const text = (await block.textContent()) ?? "";
    const seconds = text.match(/Seconds:\s*(-?\d+)/)?.[1];
    const millis  = text.match(/Milliseconds:\s*(-?\d+)/)?.[1];
    if (seconds === undefined || millis === undefined) return null;
    return { seconds: Number(seconds), millis: Number(millis) };
  }
}
