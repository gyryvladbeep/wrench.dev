import { test, expect } from "@playwright/test";
import { StringsDiffPage } from "./pages/StringsDiffPage";

test.describe("Localization Strings Diff", () => {
  let tool: StringsDiffPage;

  test.beforeEach(async ({ page }) => {
    tool = new StringsDiffPage(page);
    await tool.goto();
  });

  test("формат определяется автоматически как Android strings.xml", async () => {
    await expect(tool.format).toContainText("Android strings.xml");
  });

  test("в примере найден пропущенный ключ checkout и лишний ключ old_banner", async () => {
    await expect(tool.group("missing")).toContainText("checkout");
    await expect(tool.group("extra")).toContainText("old_banner");
  });

  test("в примере найдены несовпадающие подстановки welcome и items_in_cart", async () => {
    await expect(tool.group("placeholders")).toContainText("welcome");
    await expect(tool.group("placeholders")).toContainText("items_in_cart");
    await expect(tool.finding("placeholders")).toHaveAttribute("data-level", "error");
  });

  test("строка app_name, совпадающая с оригиналом, помечена как непереведённая", async () => {
    await expect(tool.group("untranslated")).toContainText("app_name");
  });

  test("полностью переведённые файлы дают сообщение, что различий нет", async () => {
    await tool.setFiles(
      '<resources><string name="a">Hello</string></resources>',
      '<resources><string name="a">Привет</string></resources>',
    );

    await expect(tool.finding("ok")).toBeVisible();
  });

  test("неэкранированный апостроф в Android-переводе помечается как ошибка", async () => {
    await tool.setFiles(
      '<resources><string name="a">Do not</string></resources>',
      `<resources><string name="a">Don't</string></resources>`,
    );

    await expect(tool.finding("apostrophe")).toHaveAttribute("data-level", "error");
  });

  test("экранированный апостроф и текст в кавычках проходят", async () => {
    await tool.setFiles(
      '<resources><string name="a">Do not</string><string name="b">Stop</string></resources>',
      `<resources><string name="a">Don\\'t</string><string name="b">"It's fine"</string></resources>`,
    );

    await expect(tool.finding("apostrophe")).toHaveCount(0);
  });

  test("iOS .strings определяется по формату и сравнивается по %@", async () => {
    await tool.setFiles('"hello" = "Hello %@";\n"bye" = "Bye";', '"hello" = "Привет";\n"bye" = "Пока";');

    await expect(tool.format).toContainText("iOS Localizable.strings");
    await expect(tool.group("placeholders")).toContainText("hello");
  });

  test("повторяющиеся ключи в переводе дают предупреждение", async () => {
    await tool.setFiles(
      '"a" = "One";',
      '"a" = "Один";\n"a" = "Раз";',
    );

    await expect(tool.finding("duplicates")).toHaveAttribute("data-level", "warning");
  });

  test("позиционные подстановки в другом порядке не считаются ошибкой", async () => {
    await tool.setFiles(
      '<resources><string name="a">%1$s of %2$s</string></resources>',
      '<resources><string name="a">%2$s из %1$s</string></resources>',
    );

    await expect(tool.finding("placeholders")).toHaveCount(0);
  });
});
