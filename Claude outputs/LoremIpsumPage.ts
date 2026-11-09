import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/lorem-ipsum-generator (components/tools/LoremIpsumTool.tsx). */
export class LoremIpsumPage {
  readonly page: Page;
  readonly wordsTypeButton:      Locator;
  readonly sentencesTypeButton:  Locator;
  readonly paragraphsTypeButton: Locator;
  readonly enButton: Locator;
  readonly ruButton: Locator;
  readonly countInput: Locator;
  readonly refreshButton: Locator;
  readonly output: Locator;
  readonly counterLabel: Locator; // "N words · M chars"

  constructor(page: Page) {
    this.page = page;
    this.wordsTypeButton      = page.getByRole("button", { name: "Words", exact: true });
    this.sentencesTypeButton  = page.getByRole("button", { name: "Sentences", exact: true });
    this.paragraphsTypeButton = page.getByRole("button", { name: "Paragraphs", exact: true });
    // Скоуп на <main> обязателен: в шапке сайта тоже есть переключатель
    // языка с кнопками "EN"/"RU" (getByLabel("Language")), иначе локатор
    // ловит сразу обе кнопки и падает в strict mode.
    this.enButton = page.getByRole("main").getByRole("button", { name: "EN", exact: true });
    this.ruButton = page.getByRole("main").getByRole("button", { name: "RU", exact: true });
    this.countInput = page.locator('input[type="number"]');
    this.refreshButton = page.getByRole("button", { name: /Refresh/ });
    this.output = page.locator("textarea");
    this.counterLabel = page.getByText(/^\d+ words · \d+ chars$/);
  }

  async goto() {
    await this.page.goto("/en/tools/lorem-ipsum-generator");
    // Текст генерируется на клиенте в useEffect после монтирования (см. фикс
    // в LoremIpsumTool.tsx — Math.random() на сервере (SSR) и при первом
    // клиентском рендере даёт разный текст, поэтому генерация вынесена из
    // рендера в эффект). Из-за этого сразу после goto() textarea ещё может
    // быть пустой — ждём, пока она реально заполнится, прежде чем тест
    // начнёт с ней работать.
    await this.page.waitForFunction(
      () => (document.querySelector("textarea") as HTMLTextAreaElement | null)?.value.length,
      undefined,
      { timeout: 10_000 }
    );
  }

  async setCount(value: number) {
    await this.countInput.fill(String(value));
    await this.countInput.blur();
  }

  async outputText(): Promise<string> {
    // Текст (пере)генерируется в useEffect — асинхронно, уже ПОСЛЕ клика/
    // смены настроек и после коммита рендера. Между самим действием (клик
    // по кнопке, blur у input) и срабатыванием эффекта проходит доля
    // кадра — читая textarea синхронно сразу после действия, можно
    // поймать ещё не обновившееся (старое) значение. Двойной
    // requestAnimationFrame гарантированно дожидается, пока React
    // закоммитит и отрисует результат эффекта, прежде чем мы читаем DOM.
    await this.page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    );
    return await this.output.inputValue();
  }
}
