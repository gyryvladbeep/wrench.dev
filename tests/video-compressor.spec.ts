import { test, expect } from "@playwright/test";
import { VideoCompressorPage } from "./pages/VideoCompressorPage";

test.describe("Video Compressor for Bug Reports", () => {
  let tool: VideoCompressorPage;

  test.beforeEach(async ({ page }) => {
    tool = new VideoCompressorPage(page);
    await tool.goto();
  });

  test("минутный ролик на 5 МБ: около 565 кбит/с видео и 64 кбит/с звука", async () => {
    await expect(tool.stat("video-kbps")).toHaveText("565");
    await expect(tool.stat("audio-out")).toHaveText("64");
    await expect(tool.stat("total-kbps")).toHaveText("629");
    await expect(tool.plan).toHaveAttribute("data-warning", "none");
  });

  test("ожидаемый размер не превышает цель в 5 МБ", async () => {
    await expect(tool.stat("expected")).toHaveText("4.50 MB");
  });

  test("30-минутный ролик на 5 МБ: предупреждение о слишком низком битрейте", async () => {
    await tool.duration.fill("1800");

    await expect(tool.plan).toHaveAttribute("data-warning", "very-low");
    await expect(tool.warning).toContainText("below 100 kbps");
  });

  test("цель 20 МБ для минуты поднимает видеобитрейт до 2453 кбит/с", async () => {
    await tool.target.fill("20");

    await expect(tool.stat("video-kbps")).toHaveText("2453");
  });

  test("без звука весь бюджет идёт на видео", async () => {
    await tool.keepAudio.uncheck();

    await expect(tool.stat("audio-out")).toHaveText("0");
    await expect(tool.stat("video-kbps")).toHaveText("629");
  });

  test("нулевая длительность показывает подсказку вместо расчёта", async () => {
    await tool.duration.fill("0");

    await expect(tool.invalid).toBeVisible();
    await expect(tool.plan).toHaveCount(0);
  });

  test("кнопка «Compress» недоступна, пока не выбран файл", async () => {
    await expect(tool.start).toBeDisabled();
  });

  test("сжатие реального WebM: результат собран, скачивается и подписан суффиксом -compressed", async () => {
    test.setTimeout(90_000);
    const buffer = await tool.recordSampleWebm();
    await tool.file.setInputFiles({ name: "clip.webm", mimeType: "video/webm", buffer });
    await expect(tool.dims).toBeVisible({ timeout: 15_000 });
    await tool.keepAudio.uncheck();
    await tool.target.fill("0.5");
    await tool.start.click();

    await expect(tool.result).toBeVisible({ timeout: 60_000 });
    expect(Number(await tool.resultSize.getAttribute("data-bytes"))).toBeGreaterThan(1000);
    await expect(tool.downloadLink).toHaveAttribute("download", /^clip-compressed\.(webm|mp4)$/);
    await expect(tool.status).toHaveAttribute("data-status", "done");
  });
});
