import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/playwright-websocket-mock-generator (components/tools/PlaywrightWebsocketMockGeneratorTool.tsx). */
export class PlaywrightWebsocketMockGeneratorPage {
  readonly page: Page;
  readonly pattern: Locator;
  readonly mode: Locator;
  readonly closeAfter: Locator;
  readonly code: Locator;
  readonly reason: Locator;
  readonly frames: Locator;
  readonly output: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pattern = page.getByLabel("WebSocket URL pattern", { exact: true });
    this.mode = page.getByLabel("Mode", { exact: true });
    this.closeAfter = page.getByLabel("Close the connection after, ms (0 = keep open)", { exact: true });
    this.code = page.getByLabel("Close code", { exact: true });
    this.reason = page.getByLabel("Close reason", { exact: true });
    this.frames = page.getByLabel("Server frames: delay_ms | frame", { exact: true });
    this.output = page.getByTestId("pw-output");
  }

  async goto() {
    await this.page.goto("/en/tools/playwright-websocket-mock-generator");
    await waitForHydration(this.pattern);
  }
}
