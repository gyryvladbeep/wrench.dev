import { test, expect } from "@playwright/test";
import { MobileCommandBuilderPage } from "./pages/MobileCommandBuilderPage";

test.describe("ADB Command Builder", () => {
  let tool: MobileCommandBuilderPage;

  test.beforeEach(async ({ page }) => {
    tool = new MobileCommandBuilderPage(page, "adb-command-builder", "adb");
    await tool.goto();
  });

  test("по умолчанию показывает команду установки APK с флагом -r", async () => {
    await expect(tool.output).toHaveText("adb install -r app-debug.apk");
  });

  test("флаги установки добавляются в команду по галочкам", async () => {
    await tool.field("Grant all runtime permissions (-g)").check();
    await tool.field("Allow version downgrade (-d)").check();

    await expect(tool.output).toHaveText("adb install -r -d -g app-debug.apk");
  });

  test("очистка данных подставляет введённое имя пакета", async () => {
    await tool.chooseCommand("Clear app data");
    await tool.fill("Package name", "com.test.shop");

    await expect(tool.output).toHaveText("adb shell pm clear com.test.shop");
  });

  test("серийный номер устройства добавляет -s ко всем командам", async () => {
    await tool.fill("Device serial (optional, adds -s)", "emulator-5554");

    await expect(tool.output).toHaveText("adb -s emulator-5554 install -r app-debug.apk");
  });

  test("deep link оборачивается во вложенные кавычки и сохраняет & целым", async () => {
    await tool.chooseCommand("Open deep link");
    await tool.fill("URL", "myapp://a?x=1&y=2");

    await expect(tool.output).toHaveText(
      `adb shell "am start -W -a android.intent.action.VIEW -d 'myapp://a?x=1&y=2'"`,
    );
  });

  test("ввод текста заменяет пробелы на %s, а поля тапа скрываются", async () => {
    await tool.chooseCommand("Tap, type or press a key");
    await tool.field("Input type").selectOption("text");
    await tool.fill("Text", "hello world");

    await expect(tool.output).toHaveText("adb shell input text hello%sworld");
    await expect(tool.field("X")).toHaveCount(0);
  });

  test("скриншот даёт три шага: снять, скачать, удалить с устройства", async () => {
    await tool.chooseCommand("Take screenshot");

    await expect(tool.output).toContainText("adb shell screencap -p /sdcard/screen.png");
    await expect(tool.output).toContainText("adb pull /sdcard/screen.png .");
    await expect(tool.output).toContainText("adb shell rm /sdcard/screen.png");
  });

  test("запись экрана ограничивает лимит времени максимумом в 180 секунд", async () => {
    await tool.chooseCommand("Record screen");
    await tool.fill("Time limit, seconds", "999");

    await expect(tool.output).toContainText("--time-limit 180");
  });

  test("logcat с тегом строит фильтр тег:приоритет *:S и очищает лог первым шагом", async () => {
    await tool.chooseCommand("Read logcat");
    await tool.fill("Tag (optional)", "MyApp");
    await tool.field("Minimum priority").selectOption("D");

    await expect(tool.output).toContainText("adb logcat -c");
    await expect(tool.output).toContainText("adb logcat -v time MyApp:D *:S");
  });

  test("аниматоры можно выключить тремя командами settings put global", async () => {
    await tool.chooseCommand("Disable or enable animations");

    await expect(tool.output).toContainText("window_animation_scale 0");
    await expect(tool.output).toContainText("transition_animation_scale 0");
    await expect(tool.output).toContainText("animator_duration_scale 0");
  });

  test("пустое обязательное поле подсвечивается подсказкой в угловых скобках", async () => {
    await tool.chooseCommand("Clear app data");
    await tool.fill("Package name", "");

    await expect(tool.output).toHaveText("adb shell pm clear <package>");
  });
});
