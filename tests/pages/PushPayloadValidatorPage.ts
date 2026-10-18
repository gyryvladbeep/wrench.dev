import { Page, Locator } from "@playwright/test";

/** Page Object для /tools/push-payload-validator (components/tools/PushPayloadValidatorTool.tsx). */
export class PushPayloadValidatorPage {
  readonly page: Page;
  readonly input: Locator;
  readonly size: Locator;
  readonly findings: Locator;
  readonly voip: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input    = page.getByLabel("Push payload JSON", { exact: true });
    this.size     = page.getByTestId("push-size");
    this.findings = page.getByTestId("push-findings");
    this.voip     = page.getByLabel("VoIP notification (5120-byte limit)", { exact: true });
  }

  async goto() {
    await this.page.goto("/en/tools/push-payload-validator");
  }

  async choosePlatform(platform: "APNs (iOS)" | "FCM HTTP v1 (Android)") {
    await this.page.getByRole("button", { name: platform, exact: true }).click();
  }

  async setPayload(json: string) {
    await this.input.fill(json);
  }

  finding(code: string): Locator {
    return this.findings.locator(`[data-code="${code}"]`);
  }
}
