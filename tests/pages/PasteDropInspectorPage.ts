import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/paste-drop-inspector (components/tools/PasteDropInspectorTool.tsx). */
export class PasteDropInspectorPage {
  readonly page: Page;
  readonly zone: Locator;
  readonly result: Locator;
  readonly empty: Locator;
  readonly types: Locator;
  readonly items: Locator;
  readonly files: Locator;
  readonly text: Locator;
  readonly html: Locator;

  constructor(page: Page) {
    this.page = page;
    this.zone = page.getByTestId("pd-zone");
    this.result = page.getByTestId("pd-result");
    this.empty = page.getByTestId("pd-empty");
    this.types = page.getByTestId("pd-types");
    this.items = page.getByTestId("pd-items").locator("li");
    this.files = page.getByTestId("pd-files").locator("li");
    this.text = page.getByTestId("pd-text");
    this.html = page.getByTestId("pd-html");
  }

  async goto() {
    await this.page.goto("/en/tools/paste-drop-inspector");
  }

  /** Имитирует вставку: ClipboardEvent с заполненным DataTransfer. */
  async paste(data: { text?: string; html?: string; file?: { name: string; type: string; content: string } }) {
    await this.zone.evaluate((el, d) => {
      const dt = new DataTransfer();
      if (d.text !== undefined) dt.setData("text/plain", d.text);
      if (d.html !== undefined) dt.setData("text/html", d.html);
      if (d.file) dt.items.add(new File([d.file.content], d.file.name, { type: d.file.type }));
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    }, data);
  }

  /** Имитирует перетаскивание файла в зону. */
  async drop(file: { name: string; type: string; content: string }) {
    await this.zone.evaluate((el, f) => {
      const dt = new DataTransfer();
      dt.items.add(new File([f.content], f.name, { type: f.type }));
      el.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
    }, file);
  }
}
