import { test, expect } from "@playwright/test";
import { AgeCalculatorPage } from "./pages/AgeCalculatorPage";

// Точная копия формулы из components/tools/DateTimeTools.tsx (AgeCalculatorTool).
function computeAge(birth: string, asOf: string) {
  const b = new Date(birth), a = new Date(asOf);
  let years = a.getFullYear() - b.getFullYear();
  let months = a.getMonth() - b.getMonth();
  let days = a.getDate() - b.getDate();
  if (days < 0) { months--; days += new Date(a.getFullYear(), a.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  const nextBirthday = new Date(a.getFullYear(), b.getMonth(), b.getDate());
  if (nextBirthday <= a) nextBirthday.setFullYear(a.getFullYear() + 1);
  const daysUntil = Math.ceil((nextBirthday.getTime() - a.getTime()) / 86400000);
  const totalDays = Math.floor((a.getTime() - b.getTime()) / 86400000);
  return { years, months, days, totalDays, daysUntil };
}

test.describe("Age Calculator", () => {
  let tool: AgeCalculatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new AgeCalculatorPage(page);
    await tool.goto();
  });

  test("ровно на день рождения — целое число лет, следующий день рождения через год", async () => {
    await tool.setDates("1990-06-15", "2024-06-15");
    const expected = computeAge("1990-06-15", "2024-06-15");

    await expect(tool.yearsValue).toHaveText(String(expected.years));
    await expect(tool.statValue("Months")).toHaveText(String(expected.months));
    await expect(tool.statValue("Days")).toHaveText(String(expected.days));
    await expect(tool.statValue("Total days")).toHaveText(expected.totalDays.toLocaleString());
    await expect(tool.nextBirthdayText).toContainText(`Next birthday in ${expected.daysUntil} days`);
  });

  test("день рождения ещё не наступил в текущем месяце — перенос через месяц/год", async () => {
    await tool.setDates("1990-06-20", "2024-06-15");
    const expected = computeAge("1990-06-20", "2024-06-15");

    await expect(tool.yearsValue).toHaveText(String(expected.years));
    await expect(tool.statValue("Months")).toHaveText(String(expected.months));
    await expect(tool.statValue("Days")).toHaveText(String(expected.days));
  });

  test("дата рождения позже 'на дату' — считается невалидной, показывается подсказка", async () => {
    await tool.setDates("2030-01-01", "2024-06-15");

    await expect(tool.fallbackMessage).toBeVisible();
    await expect(tool.yearsValue).toBeHidden();
  });

  test("единственное число 'day' когда до дня рождения ровно 1 день", async () => {
    // asOf на 1 день раньше дня рождения → daysUntil = 1.
    await tool.setDates("1990-06-16", "2024-06-15");
    const expected = computeAge("1990-06-16", "2024-06-15");
    expect(expected.daysUntil).toBe(1);

    await expect(tool.nextBirthdayText).toHaveText("🎂 Next birthday in 1 day");
  });
});
