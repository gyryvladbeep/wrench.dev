import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/text-wrap-overflow-lab (components/tools/TextWrapOverflowLabTool.tsx). */
export class TextWrapOverflowLabPage {
  readonly page: Page;
  readonly text: Locator;
  readonly width: Locator;
  readonly flex: Locator;

  constructor(page: Page) {
    this.page = page;
    this.text = page.getByLabel("Message text", { exact: true });
    this.width = page.getByLabel("Bubble width, px", { exact: true });
    this.flex = page.getByLabel("The bubble is a flex item without min-width: 0", { exact: true });
  }

  async goto() {
    await this.page.goto("/en/tools/text-wrap-overflow-lab");
    await waitForHydration(this.text);
  }

  variant(id: "normal" | "break-word" | "anywhere" | "break-all" | "hyphens-auto"): Locator {
    return this.page.getByTestId(`tw-variant-${id}`);
  }
}
