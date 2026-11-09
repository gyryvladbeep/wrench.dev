import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/chat-stress-text-generator (components/tools/ChatStressTextGeneratorTool.tsx). */
export class ChatStressTextGeneratorPage {
  readonly page: Page;
  readonly preset: Locator;
  readonly param: Locator;
  readonly output: Locator;
  readonly note: Locator;

  constructor(page: Page) {
    this.page = page;
    this.preset = page.getByLabel("Preset", { exact: true });
    this.param = page.locator("#cs-param");
    this.output = page.getByTestId("cs-output");
    this.note = page.getByTestId("cs-note");
  }

  async goto() {
    await this.page.goto("/en/tools/chat-stress-text-generator");
  }

  /** Значение счётчика: utf16, codepoints, graphemes, utf8, lines. */
  stat(name: "utf16" | "codepoints" | "graphemes" | "utf8" | "lines"): Locator {
    return this.page.getByTestId(`cs-${name}`).locator("div").last();
  }
}
