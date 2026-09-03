import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════════════
 * УРОВЕНЬ 2.5 — ТЕСТИРУЕМ СЛУЧАЙНЫЙ (НЕДЕТЕРМИНИРОВАННЫЙ) ВЫВОД
 * ═══════════════════════════════════════════════════════════════
 *
 * НОВАЯ ПРОБЛЕМА: UUID Generator создаёт СЛУЧАЙНЫЕ значения.
 * Каждый раз разные. Как тогда написать проверку toHaveValue("abc-123")
 * если мы заранее не знаем что там будет?
 *
 * ОТВЕТ: не проверяем ТОЧНОЕ значение. Проверяем ФОРМАТ (по регулярке)
 * и КОЛИЧЕСТВО строк. Это отдельный, очень частый навык в автоматизации —
 * писать проверки для непредсказуемых данных (даты, ID, случайные пароли,
 * токены и т.д.)
 *
 * НОВОЕ ПОНЯТИЕ: test.step()
 * ─────────────────────────────
 * Когда тест состоит из нескольких логических действий, можно обернуть
 * каждое в test.step("название", async () => {...}). В HTML-отчёте
 * это покажется как раскрывающийся список шагов — гораздо удобнее
 * читать, что именно происходило внутри теста и на каком шаге упало.
 */

// Стандартный формат UUID v4: 8-4-4-4-12 символов через дефис
// Например: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test.describe("UUID Generator", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/en/tools/uuid-generator");
  });

  test("по умолчанию генерируется 5 UUID в правильном формате", async ({ page }) => {
    const output = page.locator("textarea");
    const value  = await output.inputValue();

    // Разбиваем текст на строки — каждая строка должен быть один UUID
    const lines = value.trim().split("\n").filter(Boolean);

    await test.step("проверяем количество строк", async () => {
      expect(lines).toHaveLength(5);
    });

    await test.step("проверяем что КАЖДАЯ строка похожа на UUID", async () => {
      // .every() — встроенный метод JS-массивов, проверяет что ВСЕ элементы
      // прошли условие. Возвращает true/false для всего массива сразу.
      const allValid = lines.every((line) => UUID_V4_PATTERN.test(line));
      expect(allValid).toBe(true);
    });
  });

  test("изменение количества генерирует соответствующее число UUID", async ({ page }) => {
    await test.step("меняем поле 'How many?' на 10", async () => {
      // Находим поле ввода по его id (мы посмотрели в коде компонента —
      // там указан атрибут id="uuid-count")
      const countInput = page.locator("#uuid-count");
      await countInput.fill("10");
    });

    await test.step("нажимаем Generate", async () => {
      await page.getByRole("button", { name: "Generate" }).click();
    });

    await test.step("проверяем что теперь 10 строк вывода", async () => {
      const value = await page.locator("textarea").inputValue();
      const lines = value.trim().split("\n").filter(Boolean);
      expect(lines).toHaveLength(10);
    });
  });

  test("два последовательных клика Generate дают РАЗНЫЕ значения", async ({ page }) => {
    // ─────────────────────────────────────────────────────────
    // УРОК: как тестировать что значение СЛУЧАЙНОЕ (а не одно и то же)
    // ─────────────────────────────────────────────────────────
    // Логика: генерируем один раз, запоминаем результат. Генерируем
    // второй раз, сравниваем. Если генератор работает правильно —
    // они должны отличаться (вероятность совпадения UUID v4 ничтожна,
    // это математически надёжная проверка).

    const output = page.locator("textarea");

    const firstBatch = await output.inputValue();
    await page.getByRole("button", { name: "Generate" }).click();
    const secondBatch = await output.inputValue();

    expect(firstBatch).not.toBe(secondBatch);
  });

  test("галочка 'Uppercase' переводит буквы в верхний регистр", async ({ page }) => {
    // Находим чекбокс по его подписи через getByLabel —
    // ещё одна хорошая стратегия поиска, когда есть <label>
    await page.getByLabel("Uppercase").check();
    await page.getByRole("button", { name: "Generate" }).click();

    const value = await page.locator("textarea").inputValue();

    // Проверяем что в тексте нет строчных латинских букв a-f
    // (в hex-символах UUID могут быть только цифры и буквы a-f)
    expect(value).not.toMatch(/[a-f]/);
    // И что заглавные буквы точно есть (иначе проверка выше была бы
    // бессмысленной, если бы в UUID вообще не было букв)
    expect(value).toMatch(/[A-F]/);
  });

  test("галочка 'Hyphens' убирает дефисы из UUID", async ({ page }) => {
    // uncheck() — снимает галочку (обратное действие к check())
    await page.getByLabel("Hyphens").uncheck();
    await page.getByRole("button", { name: "Generate" }).click();

    const value = await page.locator("textarea").inputValue();
    const firstLine = value.trim().split("\n")[0];

    // Без дефисов UUID должен быть ровно 32 символа подряд
    expect(firstLine).not.toContain("-");
    expect(firstLine).toHaveLength(32);
  });

});