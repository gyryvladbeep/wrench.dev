import { test, expect } from "@playwright/test";
import { ChatStressTextGeneratorPage } from "./pages/ChatStressTextGeneratorPage";

test.describe("Chat Stress Text Generator", () => {
  let tool: ChatStressTextGeneratorPage;

  test.beforeEach(async ({ page }) => {
    tool = new ChatStressTextGeneratorPage(page);
    await tool.goto();
  });

  test("по умолчанию линейка на 4000 единиц UTF-16 начинается с токена [0001]", async () => {
    await expect(tool.stat("utf16")).toHaveText("4000");
    await expect(tool.output).toHaveValue(/^\[0001\]\[0002\]/);
  });

  test("линейка на 4001 обрезает последний токен: заканчивается на [0667", async () => {
    await tool.param.fill("4001");

    await expect(tool.stat("utf16")).toHaveText("4001");
    await expect(tool.output).toHaveValue(/\[0667$/);
  });

  test("длина выше максимума ограничивается 200000", async () => {
    await tool.param.fill("999999");

    await expect(tool.stat("utf16")).toHaveText("200000");
  });

  test("набор «одна строка без пробелов» даёт ровно 300 символов в одной строке", async () => {
    await tool.preset.selectOption({ label: "One unbroken string" });
    await tool.param.fill("300");

    await expect(tool.stat("utf16")).toHaveText("300");
    await expect(tool.stat("lines")).toHaveText("1");
    await expect(tool.output).not.toHaveValue(/\s/);
  });

  test("набор эмодзи: графем меньше, чем кодпоинтов", async () => {
    await tool.preset.selectOption({ label: "Emoji and sequences" });

    const graphemes = Number(await tool.stat("graphemes").innerText());
    const codePoints = Number(await tool.stat("codepoints").innerText());
    expect(graphemes).toBeGreaterThan(0);
    expect(graphemes).toBeLessThan(codePoints);
  });
});
