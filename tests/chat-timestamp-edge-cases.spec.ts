import { test, expect } from "@playwright/test";
import { ChatTimestampEdgeCasesPage } from "./pages/ChatTimestampEdgeCasesPage";

test.describe("Chat Timestamp Edge Case Tester", () => {
  let tool: ChatTimestampEdgeCasesPage;

  test.beforeEach(async ({ page }) => {
    tool = new ChatTimestampEdgeCasesPage(page);
    await tool.goto();
  });

  test("сообщение от 1 ноября 06:30 UTC при просмотре 2 ноября в 12:00 UTC показывается как «вчера» в UTC и Токио", async () => {
    await expect(tool.zoneRow("UTC")).toHaveAttribute("data-day", "yesterday");
    await expect(tool.zoneRow("Asia/Tokyo")).toHaveAttribute("data-day", "yesterday");
    await expect(tool.zoneRow("Asia/Tokyo")).toContainText("15:30:00");
  });

  test("у зрителя на Кирибати (UTC+14) то же сообщение уже не «вчера», а день недели", async () => {
    await expect(tool.zoneRow("Pacific/Kiritimati")).toHaveAttribute("data-day", "weekday");
    await expect(tool.zoneRow("Pacific/Kiritimati")).toHaveAttribute("data-days-ago", "2");
  });

  test("в Лос-Анджелесе сообщение попадает на 31 октября: разные дни у разных зрителей", async () => {
    await expect(tool.zoneRow("America/Los_Angeles")).toContainText("31 Oct 2026");
  });

  test("смещение Катманду показывается как UTC+05:45", async () => {
    await expect(tool.zoneRow("Asia/Kathmandu")).toContainText("UTC+05:45");
  });

  test("относительное время в строке: вчера", async () => {
    await expect(tool.relative).toContainText("yesterday");
  });

  test("нераспознанное время показывает сообщение об ошибке", async () => {
    await tool.message.fill("junk");

    await expect(tool.invalid).toBeVisible();
  });

  test("Unix-секунды разбираются так же, как ISO", async () => {
    await tool.message.fill("1793514600");

    await expect(tool.zoneRow("UTC")).toContainText("1 Nov 2026, 06:30:00");
  });

  test("для Нью-Йорка в 2026 два перехода на летнее время и 8 крайних случаев", async () => {
    await expect(tool.transitions).toHaveText("DST transitions: 2");
    await expect(tool.edges).toHaveCount(8);
  });

  test("для UTC переходов нет, остаются только два момента Нового года", async () => {
    await tool.zone.selectOption("UTC");

    await expect(tool.transitions).toHaveText("DST transitions: 0");
    await expect(tool.edges).toHaveCount(2);
  });

  test("кнопка «Use» подставляет крайний случай в поле времени сообщения", async () => {
    await tool.edges.first().getByRole("button", { name: "Use" }).click();

    await expect(tool.message).toHaveValue(/^2026-03-08T0[67]:5\d:00\.000Z$/);
  });
});
