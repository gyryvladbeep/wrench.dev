import { Page, Locator } from "@playwright/test";

/**
 * Page Object для конструкторов команд мобильного QA:
 * /tools/adb-command-builder и /tools/simctl-command-builder
 * (оба построены на components/tools/mobile/CommandBuilder.tsx).
 * idPrefix — "adb" или "simctl": по нему найден блок результата.
 */
export class MobileCommandBuilderPage {
  readonly page: Page;
  readonly commandSelect: Locator;
  readonly output: Locator;

  constructor(page: Page, private readonly slug: string, idPrefix: string) {
    this.page = page;
    this.commandSelect = page.getByLabel("Command", { exact: true });
    this.output = page.getByTestId(`${idPrefix}-output`);
  }

  async goto() {
    await this.page.goto(`/en/tools/${this.slug}`);
  }

  async chooseCommand(label: string) {
    await this.commandSelect.selectOption({ label });
  }

  field(label: string): Locator {
    return this.page.getByLabel(label, { exact: true });
  }

  async fill(label: string, value: string) {
    await this.field(label).fill(value);
  }
}
