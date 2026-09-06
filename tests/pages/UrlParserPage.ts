import { Page, Locator } from "@playwright/test";

export class UrlParserPage {
  readonly page:  Page;
  readonly input: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.locator("input").first();
  }

  async goto() {
    await this.page.goto("/en/tools/url-parser");
  }

  async setUrl(value: string) {
    await this.input.fill(value);
  }

  /** Значение строки таблицы разбора по её лейблу
   *  ("Protocol" | "Host" | "Port" | "Path" | "Query string" | "Fragment / Hash" | "Origin").
   *  Лейбл и значение — соседние <span> в одной строке, поэтому берём
   *  просто следующий по-соседству span, не завязываясь на CSS-классы
   *  строки-контейнера (там смесь Tailwind-классов вроде "last:border-0",
   *  которую в CSS-селекторе пришлось бы экранировать и это хрупко). */
  row(exactLabel: string): Locator {
    return this.page.getByText(exactLabel, { exact: true }).locator("xpath=following-sibling::span[1]");
  }

  queryParam(exactKey: string): Locator {
    return this.page.getByText(exactKey, { exact: true }).locator("xpath=following-sibling::span[1]");
  }
}
