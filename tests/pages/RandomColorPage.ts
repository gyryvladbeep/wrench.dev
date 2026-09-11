import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/random-color-generator (components/tools/GeneratorTools.tsx,
 *  RandomColorTool). */
export class RandomColorPage {
  readonly page: Page;
  readonly generateButton: Locator;
  readonly copyAllButton:  Locator;
  readonly hexSpans: Locator;
  readonly rgbSpans: Locator;
  readonly hslSpans: Locator;

  constructor(page: Page) {
    this.page = page;
    this.generateButton = page.getByRole("button", { name: "Generate", exact: true });
    this.copyAllButton  = page.getByRole("button", { name: "Copy all HEX" });
    this.hexSpans = page.getByText(/^HEX: #[0-9A-F]{6}$/);
    this.rgbSpans = page.getByText(/^RGB: \d+,\d+,\d+$/);
    this.hslSpans = page.getByText(/^HSL: \d+°,\d+%,\d+%$/);
  }

  async goto() {
    await this.page.goto("/en/tools/random-color-generator");
  }

  /** Ждёт, пока на странице появятся все 5 строк цветов.
   *
   *  RandomColorTool теперь рендерит цвета не сразу (см. её комментарий в
   *  GeneratorTools.tsx про hydration mismatch) — первый клиентский рендер
   *  отдаёт пустой список, реальные цвета приходят через мгновение из
   *  useEffect(). allTextContents() (в отличие от expect(...).toHaveCount(),
   *  которым уже пользуется первый тест этого файла) не ждёт и не
   *  повторяет попытку — вызванная слишком рано, она молча вернёт [], и
   *  тогда before[0] окажется undefined. Та же ловушка, что уже находили
   *  и чинили в currentCardOrder() (tests/pages/WorkbenchPage.ts) —
   *  решение то же: дождаться реального контента перед чтением. */
  private async waitForColors() {
    await this.hexSpans.nth(4).waitFor({ state: "visible" });
  }

  async hexAt(i: number): Promise<string> {
    await this.waitForColors();
    const text = await this.hexSpans.nth(i).textContent();
    return (text ?? "").replace("HEX: ", "");
  }

  async allHex(): Promise<string[]> {
    await this.waitForColors();
    const texts = await this.hexSpans.allTextContents();
    return texts.map((t) => t.replace("HEX: ", ""));
  }

  async rgbAt(i: number): Promise<string> {
    await this.waitForColors();
    return ((await this.rgbSpans.nth(i).textContent()) ?? "").replace("RGB: ", "");
  }

  async hslAt(i: number): Promise<string> {
    await this.waitForColors();
    return ((await this.hslSpans.nth(i).textContent()) ?? "").replace("HSL: ", "");
  }

  /** Кнопка Lock/Unlock конкретной строки — первая <button> внутри строки
   *  (вторая — CopyButton), поэтому берём по позиции, а не по accessible name:
   *  у кнопки только title="Lock"/"Unlock", а видимый текст — emoji. */
  lockButtonAt(i: number): Locator {
    const row = this.hexSpans.nth(i).locator("xpath=ancestor::div[contains(@class,'rounded-[10px]')][1]");
    return row.locator("button").first();
  }
}
