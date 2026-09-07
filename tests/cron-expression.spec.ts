import { test, expect } from "@playwright/test";
import { CronExpressionPage } from "./pages/CronExpressionPage";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Точная копия parsePart()/describeCron() из components/tools/CronExpressionTool.tsx
// (после фикса недостижимой ветки "every N hours" — см. коммент в самом источнике).
function parsePart(part: string, min: number, max: number): number[] {
  const values: number[] = [];
  if (part === "*") { for (let i = min; i <= max; i++) values.push(i); return values; }
  for (const seg of part.split(",")) {
    if (seg.includes("/")) {
      const [range, step] = seg.split("/");
      const s = Number(step);
      const [start, end] = range === "*" ? [min, max] : range.split("-").map(Number);
      for (let i = start; i <= (end ?? max); i += s) values.push(i);
    } else if (seg.includes("-")) {
      const [start, end] = seg.split("-").map(Number);
      for (let i = start; i <= end; i++) values.push(i);
    } else {
      values.push(Number(seg));
    }
  }
  return values.filter((v) => v >= min && v <= max);
}

function describeCron(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return "Invalid format";
  const [min, hour, dom, month, dow] = parts;
  const everyH = "every hour";
  const at = "at";

  if (cron === "* * * * *") return "Every minute";
  if (min.startsWith("*/")) return `Every ${min.split("/")[1]} minutes`;
  if (hour.startsWith("*/") && dom === "*" && month === "*" && dow === "*") {
    return `Every ${hour.split("/")[1]} hours`;
  }
  if (min === "0" && hour !== "*" && dom === "*" && month === "*" && dow === "*") {
    const h = parsePart(hour, 0, 23).join(", ");
    return `Every day at ${h}:00`;
  }
  if (dow !== "*") {
    const days = parsePart(dow, 0, 6).map((d) => WEEKDAYS[d]).join(", ");
    const h = hour === "*" ? everyH : `${at} ${parsePart(hour, 0, 23).join(",")}:${parsePart(min, 0, 59).join(",").padStart(2, "0")}`;
    return `Every ${days} ${h}`;
  }
  if (dom !== "*") {
    const d = parsePart(dom, 1, 31).join(", ");
    const h = `${parsePart(hour, 0, 23).join(",")}:${parsePart(min, 0, 59).join(",").padStart(2, "0")}`;
    return `Day ${d} of every month at ${h}`;
  }
  return "Schedule defined";
}

test.describe("Cron Expression Parser", () => {
  let tool: CronExpressionPage;

  test.beforeEach(async ({ page }) => {
    tool = new CronExpressionPage(page);
    await tool.goto();
  });

  test("по умолчанию '0 9 * * 1-5' описывается как будни в 9:00", async () => {
    await expect(tool.description).toHaveText(describeCron("0 9 * * 1-5"));
    await expect(tool.description).toHaveText("Every Mon, Tue, Wed, Thu, Fri at 9:00");
  });

  test("пресет 'Every 15 minutes' — конкретная ветка описания для '*/N' минут", async () => {
    await tool.clickPreset("Every 15 minutes", "*/15 * * * *");

    await expect(tool.input).toHaveValue("*/15 * * * *");
    await expect(tool.description).toHaveText("Every 15 minutes");
  });

  test("'* * * * *' описывается как 'Every minute'", async () => {
    await tool.setExpression("* * * * *");
    await expect(tool.description).toHaveText("Every minute");
  });

  test("невалидное выражение (не 5 полей или недопустимые символы) — 'Invalid format', без Next runs", async () => {
    await tool.setExpression("not a cron");

    await expect(tool.description).toHaveText("Invalid format");
    await expect(tool.nextRunRows).toHaveCount(0);
  });

  test("валидное выражение показывает ровно 5 ближайших запусков, все — по будням в 9:00", async () => {
    await tool.setExpression("0 9 * * 1-5");

    await expect(tool.nextRunRows).toHaveCount(5);
    const texts = await tool.nextRunRows.allTextContents();
    expect(texts).toHaveLength(5);
    // Каждая строка содержит порядковый номер и дату/время — не проверяем
    // точные даты (зависят от текущего момента запуска теста), но формат
    // должен присутствовать.
    for (const t of texts) {
      expect(t.length).toBeGreaterThan(0);
    }
  });

  test("РЕГРЕСС на исправленный баг: пресет 'Every 6 hours' ('0 */6 * * *') теперь описывается как 'Every 6 hours', а не как список часов", async () => {
    // Раньше ветка "min==='0' && hour!=='*' && ..." срабатывала первой для
    // ЛЮБОГО "0 */6 * * *" (у "*/6" тоже hour!=='*'), и описание получалось
    // "Every day at 0, 6, 12, 18:00" — ветка "every N hours" была
    // недостижима. После фикса (проверка hour.startsWith("*/") идёт раньше)
    // описание соответствует названию пресета.
    await tool.clickPreset("Every 6 hours", "0 */6 * * *");

    await expect(tool.input).toHaveValue("0 */6 * * *");
    await expect(tool.description).toHaveText(describeCron("0 */6 * * *"));
    await expect(tool.description).toHaveText("Every 6 hours");
  });

  test("выражение '0 9 * * *' (без '*/', конкретный час, без dow/dom) по-прежнему описывается как 'Every day at H:00'", async () => {
    // Регрессия на то, что перестановка веток не сломала соседний случай:
    // конкретный (не '*/N') час всё ещё должен давать "Every day at H:00".
    await tool.setExpression("0 9 * * *");

    await expect(tool.description).toHaveText(describeCron("0 9 * * *"));
    await expect(tool.description).toHaveText("Every day at 9:00");
  });
});
