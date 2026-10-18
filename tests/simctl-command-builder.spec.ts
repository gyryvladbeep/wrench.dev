import { test, expect } from "@playwright/test";
import { MobileCommandBuilderPage } from "./pages/MobileCommandBuilderPage";

test.describe("iOS simctl Command Builder", () => {
  let tool: MobileCommandBuilderPage;

  test.beforeEach(async ({ page }) => {
    tool = new MobileCommandBuilderPage(page, "simctl-command-builder", "simctl");
    await tool.goto();
  });

  test("по умолчанию показывает список доступных симуляторов", async () => {
    await expect(tool.output).toHaveText("xcrun simctl list devices available");
  });

  test("push-уведомление использует устройство booted, bundle id и файл пейлоада", async () => {
    await tool.chooseCommand("Send a push notification");
    await tool.fill("Bundle identifier", "com.test.shop");
    await tool.fill("Payload file", "alert.apns");

    await expect(tool.output).toHaveText("xcrun simctl push booted com.test.shop alert.apns");
  });

  test("смена целевого устройства меняется во всех командах", async () => {
    await tool.fill("Target device (booted, UDID or name)", "ABC-123");
    await tool.chooseCommand("Shut down a simulator");

    await expect(tool.output).toHaveText("xcrun simctl shutdown ABC-123");
  });

  test("стирание данных сначала выключает устройство, затем стирает", async () => {
    await tool.chooseCommand("Erase all content and settings");

    await expect(tool.output).toContainText("xcrun simctl shutdown booted");
    await expect(tool.output).toContainText("xcrun simctl erase booted");
  });

  test("команда privacy собирается из действия, сервиса и bundle id", async () => {
    await tool.chooseCommand("Grant, revoke or reset a permission");
    await tool.field("Action").selectOption("revoke");
    await tool.field("Service").selectOption("photos");

    await expect(tool.output).toHaveText("xcrun simctl privacy booted revoke photos com.example.app");
  });

  test("статус-бар по умолчанию задаёт 9:41, полную батарею и четыре деления сети", async () => {
    await tool.chooseCommand("Override the status bar");

    await expect(tool.output).toHaveText(
      "xcrun simctl status_bar booted override --time 9:41 --batteryLevel 100 --cellularBars 4",
    );
  });

  test("сброс статус-бара скрывает поля времени и батареи", async () => {
    await tool.chooseCommand("Override the status bar");
    await tool.field("Action").selectOption("clear");

    await expect(tool.output).toHaveText("xcrun simctl status_bar booted clear");
    await expect(tool.field("Time")).toHaveCount(0);
  });

  test("запуск с --console и без перезапуска учитывает галочки", async () => {
    await tool.chooseCommand("Launch an app");
    await tool.field("Stream app output (--console)").check();
    await tool.field("Terminate a running copy first").uncheck();

    await expect(tool.output).toHaveText("xcrun simctl launch --console booted com.example.app");
  });

  test("открытие URL экранирует символы, опасные для оболочки", async () => {
    await tool.chooseCommand("Open a URL or deep link");
    await tool.fill("URL", "myapp://a?x=$HOME");

    await expect(tool.output).toHaveText('xcrun simctl openurl booted "myapp://a?x=\\$HOME"');
  });
});
