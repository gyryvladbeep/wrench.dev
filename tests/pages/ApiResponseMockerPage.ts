import { Page, Locator } from "@playwright/test";

export class ApiResponseMockerPage {
  readonly page: Page;

  readonly urlInput:     Locator;
  readonly methodSelect: Locator;
  readonly jsonInput:    Locator;
  readonly snippetOutput: Locator;

  constructor(page: Page) {
    this.page = page;
    // ─────────────────────────────────────────────────────────
    // УРОК: <label> и <input> в этом компоненте НЕ связаны через
    // htmlFor/id — обычная ситуация в реальных проектах, где верстальщик
    // не подумал про доступность (accessibility). getByLabel() здесь
    // не сработает: он требует либо htmlFor+id, либо вложенность
    // <label><input/></label>.
    //
    // РЕШЕНИЕ: находим текстовый label через getByText(), затем берём
    // его СОСЕДНИЙ элемент через XPath "following-sibling". Это
    // стандартный, часто используемый приём именно для таких случаев.
    this.urlInput = page.getByText("URL / path", { exact: true })
      .locator("xpath=following-sibling::input[1]");

    this.methodSelect  = page.locator("select");
    this.jsonInput     = page.locator("textarea");
    this.snippetOutput = page.locator("pre");
  }

  async goto() {
    await this.page.goto("/en/tools/api-response-mocker");
  }

  async selectFormat(label: string) {
    // ─────────────────────────────────────────────────────────
    // УРОК: почему первая версия была багом
    // ─────────────────────────────────────────────────────────
    // page.getByText(label).first() ищет ЛЮБОЙ элемент на странице
    // с таким текстом — а на странице может быть несколько похожих
    // фраз (название формата + текст в описании). .first() тогда
    // кликает на первый попавшийся, который не обязательно кнопка.
    //
    // Правильно — искать именно КНОПКУ (button), и именно ТУ, что
    // содержит нужный текст где-то внутри себя (у кнопки внутри два
    // <p> тега — название и описание). getByRole сужает поиск сразу
    // до интерактивных элементов нужного типа.
    await this.page.getByRole("button").filter({ hasText: label }).click();
  }

  async setStatusCode(code: number) {
    await this.page.getByRole("button", { name: String(code), exact: true }).click();
  }

  async setJson(json: string) {
    await this.jsonInput.fill(json);
  }

  async getSnippetText(): Promise<string> {
    return (await this.snippetOutput.textContent()) ?? "";
  }
}