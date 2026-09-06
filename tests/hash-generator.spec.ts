import { test, expect } from "@playwright/test";
import crypto from "crypto";
import { HashGeneratorPage } from "./pages/HashGeneratorPage";

// MD5 в инструменте — самописная реализация на чистом JS (см. комментарий
// в HashGeneratorTool.tsx про то, зачем — Web Crypto его не поддерживает).
// Эталон для сравнения всё равно берём из Node crypto — она использует
// OpenSSL и её MD5/SHA всегда верны, так что если самописная версия
// когда-то разойдётся с ней — это будет реальный баг, а не ложное
// срабатывание теста.
function expectedHash(algo: string, text: string): string {
  return crypto.createHash(algo).update(text, "utf-8").digest("hex");
}

test.describe("Hash Generator", () => {

  let tool: HashGeneratorPage;

  test.beforeEach(async ({ page }) => {
    tool = new HashGeneratorPage(page);
    await tool.goto();
  });

  test("для произвольного текста считает верные MD5/SHA-1/SHA-256/SHA-512", async () => {
    const text = "Wrench-Branch QA";
    await tool.setInput(text);

    await expect(tool.hashValue("MD5")).toHaveText(expectedHash("md5", text));
    await expect(tool.hashValue("SHA-1")).toHaveText(expectedHash("sha1", text));
    await expect(tool.hashValue("SHA-256")).toHaveText(expectedHash("sha256", text));
    await expect(tool.hashValue("SHA-512")).toHaveText(expectedHash("sha512", text));
  });

  test("хэш пересчитывается при изменении текста", async () => {
    await tool.setInput("first");
    await expect(tool.hashValue("SHA-256")).toHaveText(expectedHash("sha256", "first"));

    await tool.setInput("second");
    await expect(tool.hashValue("SHA-256")).toHaveText(expectedHash("sha256", "second"));
  });

  test("пустой ввод сбрасывает все хэши на плейсхолдер '—'", async () => {
    await tool.setInput("");
    await expect(tool.hashValue("MD5")).toHaveText("—");
    await expect(tool.hashValue("SHA-1")).toHaveText("—");
    await expect(tool.hashValue("SHA-256")).toHaveText("—");
    await expect(tool.hashValue("SHA-512")).toHaveText("—");
  });

});
