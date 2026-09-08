import { Page, Locator } from "@playwright/test";
import { fillRobust, clickRobust } from "../support/robust-fill";

/** Page Object для /tools/json-mutator (components/tools/JsonMutatorTool.tsx). */
export class JsonMutatorPage {
  readonly page: Page;
  readonly input: Locator;
  readonly fieldsBadge: Locator;       // "Valid JSON · N fields"
  readonly parseError: Locator;
  readonly selectedFieldName: Locator; // выбранный путь под "Mutating field:"
  readonly mutationsCount: Locator;    // "N mutations"
  readonly emptySelectionHint: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.locator("textarea");
    this.fieldsBadge = page.getByText(/Valid JSON · \d+ fields/);
    this.parseError = page.locator("p.mt-1.text-xs.text-red-400");
    this.selectedFieldName = page.locator("p.font-mono.text-sm.font-semibold.text-accent");
    this.mutationsCount = page.getByText(/^\d+ mutations$/);
    this.emptySelectionHint = page.getByText("Select a field on the left");
  }

  async goto() {
    await this.page.goto("/en/tools/json-mutator");
  }

  async setInput(json: string) {
    await fillRobust(this.input, json);
  }

  /** Кнопка поля в списке слева — сматчена по ТОЧНОМУ тексту пути (span.font-mono.truncate). */
  fieldButton(pathStr: string): Locator {
    return this.page.locator("button").filter({ has: this.page.getByText(pathStr, { exact: true }) });
  }

  async selectField(pathStr: string) {
    await clickRobust(this.fieldButton(pathStr), async () => {
      await this.selectedFieldName.first().waitFor({ state: "visible", timeout: 1500 });
      const text = await this.selectedFieldName.first().textContent();
      if (text !== pathStr) throw new Error("not selected yet");
    });
  }

  categoryButton(label: "All" | "Types" | "Boundary" | "Injection"): Locator {
    return this.page.getByRole("button", { name: label, exact: true });
  }

  async setCategory(label: "All" | "Types" | "Boundary" | "Injection", expectedCount: number) {
    await clickRobust(this.categoryButton(label), async () => {
      await this.mutationsCount.getByText(`${expectedCount} mutations`, { exact: true }).waitFor({ timeout: 1500 });
    });
  }

  modeButton(label: "One by one" | "All at once"): Locator {
    return this.page.getByRole("button", { name: label, exact: true });
  }

  /** Карточка мутации по ТОЧНОМУ тексту её лейбла (single и all mode используют одинаковую разметку карточки). */
  mutationCard(label: string): Locator {
    return this.page
      .locator("div.rounded-lg.border.border-border.bg-surface.overflow-hidden")
      .filter({ has: this.page.getByText(label, { exact: true }) });
  }

  mutationCardPre(label: string): Locator {
    return this.mutationCard(label).locator("pre");
  }
}
