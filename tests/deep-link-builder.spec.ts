import { test, expect } from "@playwright/test";
import { DeepLinkBuilderPage } from "./pages/DeepLinkBuilderPage";

test.describe("Deep Link Builder", () => {
  let tool: DeepLinkBuilderPage;

  test.beforeEach(async ({ page }) => {
    tool = new DeepLinkBuilderPage(page);
    await tool.goto();
  });

  test("значения по умолчанию собирают ссылку и кодируют пробел в параметре", async () => {
    await expect(tool.url).toHaveText("myapp://product/42?ref=email%20campaign");
    await expect(tool.warnings).toHaveCount(0);
  });

  test("для той же ссылки сразу даются команды adb и simctl", async () => {
    await expect(tool.adb).toHaveText(
      `adb shell "am start -W -a android.intent.action.VIEW -d 'myapp://product/42?ref=email%20campaign'"`,
    );
    await expect(tool.simctl).toHaveText(
      `xcrun simctl openurl booted "myapp://product/42?ref=email%20campaign"`,
    );
  });

  test("амперсанд и знак равенства в значении параметра кодируются", async () => {
    await tool.paramValue(1).fill("a&b=c");

    await expect(tool.url).toHaveText("myapp://product/42?ref=a%26b%3Dc");
  });

  test("второй параметр добавляется через &, а удаление убирает его", async () => {
    await tool.addParam();
    await tool.paramKey(2).fill("utm");
    await tool.paramValue(2).fill("spring");

    await expect(tool.url).toHaveText("myapp://product/42?ref=email%20campaign&utm=spring");

    await tool.removeParam(2);
    await expect(tool.url).toHaveText("myapp://product/42?ref=email%20campaign");
  });

  test("повтор ключа запроса вызывает предупреждение", async () => {
    await tool.addParam();
    await tool.paramKey(2).fill("ref");
    await tool.paramValue(2).fill("other");

    await expect(tool.warnings).toContainText("repeat");
  });

  test("в режиме https схема скрыта, ссылка начинается с https и без хоста есть предупреждение", async () => {
    await tool.chooseKind("https");
    await expect(tool.schemeInput).toHaveCount(0);
    await expect(tool.url).toHaveText(/^https:\/\/product\/42/);

    await tool.hostInput.fill("");
    await expect(tool.warnings).toContainText("needs a host");
  });

  test("пакет Android добавляется в конец команды adb", async () => {
    await tool.packageInput.fill("com.test.shop");

    await expect(tool.adb).toContainText("com.test.shop\"");
  });

  test("фрагмент manifest содержит схему, хост и префикс пути", async () => {
    await expect(tool.manifest).toContainText('android:scheme="myapp"');
    await expect(tool.manifest).toContainText('android:host="product"');
    await expect(tool.manifest).toContainText('android:pathPrefix="/42"');
  });

  test("для https-ссылки в manifest включается autoVerify", async () => {
    await tool.chooseKind("https");
    await tool.hostInput.fill("example.com");

    await expect(tool.manifest).toContainText('android:autoVerify="true"');
  });
});
