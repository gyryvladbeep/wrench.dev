import { Page, Locator } from "@playwright/test";

/**
 * Page Object для /tools/word-counter (components/tools/TextTools.tsx,
 * WordCounterTool). Статистика — 7 плиток "значение сверху, подпись
 * снизу" внутри code-surface блоков, пересчитывается синхронно через
 * useMemo при каждом изменении textarea — сети и localStorage нет.
 */
export class WordCounterPage {
  readonly page: Page;
  readonly input: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.locator("textarea");
  }

  async goto() {
    await this.page.goto("/en/tools/word-counter");
  }

  async setText(value: string) {
    await this.input.fill(value);
  }

  /** Значение плитки статистики по её подписи (Words, Characters, ...).
   *  В разметке значение — предыдущий <p>-сосед подписи (см. JSX:
   *  <p>{value}</p><p>{label}</p> внутри одного div). */
  statValue(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator("xpath=preceding-sibling::p[1]");
  }
}
