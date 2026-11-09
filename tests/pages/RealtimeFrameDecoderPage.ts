import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/realtime-frame-decoder (components/tools/RealtimeFrameDecoderTool.tsx). */
export class RealtimeFrameDecoderPage {
  readonly page: Page;
  readonly input: Locator;
  readonly frames: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.getByLabel("WebSocket frames, one per line", { exact: true });
    this.frames = page.getByTestId("rf-frames").locator("> li");
  }

  async goto() {
    await this.page.goto("/en/tools/realtime-frame-decoder");
    await waitForHydration(this.input);
  }

  stat(name: "total" | "events" | "acks" | "pings" | "pongs"): Locator {
    return this.page.getByTestId(`rf-${name}`).locator("div").last();
  }
}
