import { Page, Locator } from "@playwright/test";
import { waitForHydration } from "./hydration";

/** Page Object для /tools/video-compressor (components/tools/VideoCompressorTool.tsx). */
export class VideoCompressorPage {
  readonly page: Page;
  readonly file: Locator;
  readonly target: Locator;
  readonly duration: Locator;
  readonly audioKbps: Locator;
  readonly keepAudio: Locator;
  readonly plan: Locator;
  readonly warning: Locator;
  readonly invalid: Locator;
  readonly start: Locator;
  readonly status: Locator;
  readonly dims: Locator;
  readonly result: Locator;
  readonly resultSize: Locator;
  readonly downloadLink: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    this.page = page;
    this.file = page.getByLabel("Video file", { exact: true });
    this.target = page.getByLabel("Target size, MB", { exact: true });
    this.duration = page.getByLabel("Duration, s", { exact: true });
    this.audioKbps = page.getByLabel("Audio bitrate, kbps", { exact: true });
    this.keepAudio = page.getByLabel("Keep audio", { exact: true });
    this.plan = page.getByTestId("vc-plan");
    this.warning = page.getByTestId("vc-warning");
    this.invalid = page.getByTestId("vc-invalid");
    this.start = page.getByTestId("vc-start");
    this.status = page.getByTestId("vc-status");
    this.dims = page.getByTestId("vc-dims");
    this.result = page.getByTestId("vc-result");
    this.resultSize = page.getByTestId("vc-result-size");
    this.downloadLink = page.getByTestId("vc-download");
    this.error = page.getByTestId("vc-error");
  }

  async goto() {
    await this.page.goto("/en/tools/video-compressor");
    await waitForHydration(this.target);
  }

  stat(name: "video-kbps" | "audio-out" | "total-kbps" | "expected"): Locator {
    return this.page.getByTestId(`vc-${name}`).locator("div").last();
  }

  /** Записывает в самой странице короткий WebM из canvas и возвращает его байты. */
  async recordSampleWebm(ms = 2500): Promise<Buffer> {
    const bytes = await this.page.evaluate(async (durationMs) => {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext("2d")!;
      const rec = new MediaRecorder(canvas.captureStream(15), { mimeType: "video/webm;codecs=vp8" });
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      const stopped = new Promise<void>((res) => { rec.onstop = () => res(); });
      rec.start(250);
      const t0 = performance.now();
      await new Promise<void>((res) => {
        const frame = () => {
          const t = performance.now() - t0;
          ctx.fillStyle = `hsl(${(t / 5) % 360}, 80%, 50%)`;
          ctx.fillRect(0, 0, 320, 180);
          ctx.fillStyle = "#fff";
          ctx.font = "32px sans-serif";
          ctx.fillText(String(Math.round(t)), 20, 100);
          if (t < durationMs) requestAnimationFrame(frame); else res();
        };
        frame();
      });
      rec.stop();
      await stopped;
      return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));
    }, ms);
    return Buffer.from(bytes);
  }
}
