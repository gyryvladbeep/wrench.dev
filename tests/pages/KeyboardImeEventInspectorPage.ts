import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/keyboard-ime-event-inspector (components/tools/KeyboardImeEventInspectorTool.tsx). */
export class KeyboardImeEventInspectorPage {
  readonly page: Page;
  readonly field: Locator;
  readonly rows: Locator;
  readonly count: Locator;
  readonly warning: Locator;
  readonly clear: Locator;

  constructor(page: Page) {
    this.page = page;
    this.field = page.getByLabel("Typing field", { exact: true });
    this.rows = page.getByTestId("ki-log").locator("tbody tr");
    this.count = page.getByTestId("ki-count");
    this.warning = page.getByTestId("ki-warning");
    this.clear = page.getByRole("button", { name: "Clear", exact: true });
  }

  async goto() {
    await this.page.goto("/en/tools/keyboard-ime-event-inspector");
  }

  /** Строки журнала для события заданного типа. */
  byType(type: string): Locator {
    return this.page.getByTestId("ki-log").locator(`tbody tr[data-type="${type}"]`);
  }

  /** Отправляет в поле синтетическое событие клавиши (для проверки Enter во время композиции). */
  async dispatchKey(type: "keydown" | "keyup", init: { key: string; code?: string; keyCode?: number; isComposing?: boolean }) {
    await this.field.evaluate(
      (el, args) => el.dispatchEvent(new KeyboardEvent(args.type, { bubbles: true, cancelable: true, ...args.init })),
      { type, init }
    );
  }
}
