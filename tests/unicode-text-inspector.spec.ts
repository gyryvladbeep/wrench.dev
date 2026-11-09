import { test, expect } from "@playwright/test";
import { UnicodeTextInspectorPage } from "./pages/UnicodeTextInspectorPage";

const FAMILY = "\u{1F468}‍\u{1F469}‍\u{1F467}";

test.describe("Unicode Message Inspector", () => {
  let tool: UnicodeTextInspectorPage;

  test.beforeEach(async ({ page }) => {
    tool = new UnicodeTextInspectorPage(page);
    await tool.goto();
  });

  test("пример по умолчанию: 20 графем, 24 кодпоинта, 27 единиц UTF-16, 46 байт", async () => {
    await expect(tool.stat("graphemes")).toHaveText("20");
    await expect(tool.stat("codepoints")).toHaveText("24");
    await expect(tool.stat("utf16")).toHaveText("27");
    await expect(tool.stat("utf8")).toHaveText("46");
  });

  test("эмодзи семьи: одна графема из пяти кодпоинтов, 8 единиц UTF-16 и 18 байт", async () => {
    await tool.text.fill(FAMILY);

    await expect(tool.stat("graphemes")).toHaveText("1");
    await expect(tool.stat("codepoints")).toHaveText("5");
    await expect(tool.stat("utf16")).toHaveText("8");
    await expect(tool.stat("utf8")).toHaveText("18");
  });

  test("лимит 20: превышен в UTF-16, кодпоинтах и байтах, но не в графемах", async () => {
    await expect(tool.limitRow("utf16")).toHaveAttribute("data-over", "true");
    await expect(tool.limitRow("codePoints")).toHaveAttribute("data-over", "true");
    await expect(tool.limitRow("utf8")).toHaveAttribute("data-over", "true");
    await expect(tool.limitRow("graphemes")).toHaveAttribute("data-over", "false");
  });

  test("пробел нулевой ширины в примере попадает в замечания", async () => {
    await expect(tool.finding("invisible")).toBeVisible();
  });

  test("смесь латиницы и кириллицы в одном слове отмечается", async () => {
    await tool.text.fill("pаypal");

    await expect(tool.finding("mixed-script")).toBeVisible();
  });

  test("чистый текст: замечаний нет, показано сообщение об отсутствии проблем", async () => {
    await tool.text.fill("Hello world");

    await expect(tool.findings).toContainText("No hidden characters");
  });

  test("таблица кодпоинтов показывает символ U+0048 для H", async () => {
    await tool.text.fill("H");

    await expect(tool.rows).toHaveCount(1);
    await expect(tool.rows.first()).toHaveAttribute("data-hex", "U+0048");
  });
});
