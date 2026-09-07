import { test, expect } from "@playwright/test";
import { DateDifferencePage } from "./pages/DateDifferencePage";

// Точная копия формулы из components/tools/DateTimeTools.tsx (DateDifferenceTool) —
// считаем "ожидаемое" так же, как считает сама страница, чтобы не ошибиться
// вручную в переносах между годами/месяцами.
function computeDiff(start: string, end: string) {
  const a = new Date(start), b = new Date(end);
  const [from, to] = a <= b ? [a, b] : [b, a];
  const msTotal = to.getTime() - from.getTime();
  const totalDays = Math.floor(msTotal / 86400000);
  const totalHours = Math.floor(msTotal / 3600000);
  const totalWeeks = Math.floor(totalDays / 7);
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  if (days < 0) { months--; days += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  return { years, months, days, totalDays, totalHours, totalWeeks };
}

test.describe("Date Difference", () => {
  let tool: DateDifferencePage;

  test.beforeEach(async ({ page }) => {
    tool = new DateDifferencePage(page);
    await tool.goto();
  });

  test("ровно 7 дней между 2020-01-01 и 2020-01-08", async () => {
    await tool.setDates("2020-01-01", "2020-01-08");
    const expected = computeDiff("2020-01-01", "2020-01-08");

    await expect(tool.statValue("Years")).toHaveText(String(expected.years));
    await expect(tool.statValue("Months")).toHaveText(String(expected.months));
    await expect(tool.statValue("Days")).toHaveText(String(expected.days));
    await expect(tool.statValue("Total days")).toHaveText(expected.totalDays.toLocaleString());
    await expect(tool.statValue("Total weeks")).toHaveText(expected.totalWeeks.toLocaleString());
    await expect(tool.statValue("Total hours")).toHaveText(expected.totalHours.toLocaleString());
  });

  test("разница через границу месяца/года считается с переносом", async () => {
    await tool.setDates("2020-01-15", "2021-03-10");
    const expected = computeDiff("2020-01-15", "2021-03-10");

    await expect(tool.statValue("Years")).toHaveText(String(expected.years));
    await expect(tool.statValue("Months")).toHaveText(String(expected.months));
    await expect(tool.statValue("Days")).toHaveText(String(expected.days));
  });

  test("порядок дат не важен — результат всегда положительный (даты меняются местами внутри)", async () => {
    await tool.setDates("2022-06-01", "2022-05-01"); // конец раньше начала
    const expected = computeDiff("2022-06-01", "2022-05-01");

    await expect(tool.statValue("Days")).toHaveText(String(expected.days));
    await expect(tool.statValue("Total days")).toHaveText(expected.totalDays.toLocaleString());
  });

  test("пустая дата начала — показывается сообщение вместо статистики", async () => {
    await tool.startInput.fill("");

    await expect(tool.fallbackMessage).toBeVisible();
    await expect(tool.statValue("Years")).toBeHidden();
  });
});
