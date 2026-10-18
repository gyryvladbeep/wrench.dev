import { test, expect } from "@playwright/test";
import { AndroidManifestAnalyzerPage } from "./pages/AndroidManifestAnalyzerPage";

test.describe("AndroidManifest Analyzer", () => {
  let tool: AndroidManifestAnalyzerPage;

  test.beforeEach(async ({ page }) => {
    tool = new AndroidManifestAnalyzerPage(page);
    await tool.goto();
  });

  test("пример по умолчанию даёт сводку: пакет, версия, minSdk и targetSdk", async () => {
    await expect(tool.summary).toContainText("com.example.shop");
    await expect(tool.summary).toContainText("1.2.0");
    await expect(tool.summary).toContainText("26");
    await expect(tool.summary).toContainText("34");
  });

  test("разрешения делятся на runtime, особый доступ и обычные", async () => {
    await expect(tool.permission("CAMERA")).toHaveAttribute("data-kind", "dangerous");
    await expect(tool.permission("SYSTEM_ALERT_WINDOW")).toHaveAttribute("data-kind", "special");
    await expect(tool.permission("INTERNET")).toHaveAttribute("data-kind", "normal");
  });

  test("в примере найдены пропущенный exported, открытый сервис, особое разрешение и cleartext", async () => {
    await expect(tool.finding("exported-missing")).toHaveAttribute("data-level", "error");
    await expect(tool.finding("service-open")).toHaveAttribute("data-level", "warning");
    await expect(tool.finding("special-permission")).toBeVisible();
    await expect(tool.finding("cleartext")).toBeVisible();
    await expect(tool.finding("allow-backup")).toBeVisible();
  });

  test("таблица компонентов показывает launcher-activity и состояние exported", async () => {
    await expect(tool.components.locator('[data-component=".MainActivity"]')).toContainText("launcher");
    await expect(tool.components.locator('[data-component=".SyncService"]')).toContainText("true");
    await expect(tool.components.locator('[data-component=".LinkActivity"]')).toContainText("unset");
  });

  test("deep link из intent-фильтра VIEW + BROWSABLE собираются в ссылку", async () => {
    await expect(tool.deepLinks).toContainText("https://shop.example.com/p*");
  });

  test("debuggable=true в релизном манифесте помечается как ошибка", async () => {
    await tool.setManifest('<manifest package="a.b"><application android:debuggable="true"/></manifest>');

    await expect(tool.finding("debuggable")).toHaveAttribute("data-level", "error");
  });

  test("provider с exported=true без разрешения помечается как ошибка", async () => {
    await tool.setManifest(
      '<manifest package="a.b"><application><provider android:name=".Files" android:authorities="x" android:exported="true"/></application></manifest>',
    );

    await expect(tool.finding("provider-open")).toHaveAttribute("data-level", "error");
  });

  test("компонент с intent-фильтром без exported для targetSdk 30 даёт лишь заметку", async () => {
    await tool.setManifest(
      '<manifest package="a.b"><uses-sdk android:targetSdkVersion="30"/><application><activity android:name=".A"><intent-filter><action android:name="x"/></intent-filter></activity></application></manifest>',
    );

    await expect(tool.finding("exported-missing")).toHaveAttribute("data-level", "info");
  });

  test("не-XML и неверный корневой элемент дают понятную ошибку разбора", async () => {
    await tool.setManifest("<a></a>");
    await expect(tool.error).toContainText("expected <manifest>");

    await tool.setManifest("not xml at all");
    await expect(tool.error).toBeVisible();
  });
});
