import { test, expect } from "@playwright/test";
import { UuidGeneratorPage } from "./pages/UuidGeneratorPage";

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test.describe("UUID Generator", () => {

  let uuidGen: UuidGeneratorPage;

  test.beforeEach(async ({ page }) => {
    uuidGen = new UuidGeneratorPage(page);
    await uuidGen.goto();
  });

  test("по умолчанию генерируется 5 UUID в правильном формате", async () => {
    const lines = await uuidGen.getGeneratedLines();

    await test.step("проверяем количество строк", async () => {
      expect(lines).toHaveLength(5);
    });

    await test.step("проверяем что КАЖДАЯ строка похожа на UUID", async () => {
      const allValid = lines.every((line) => UUID_V4_PATTERN.test(line));
      expect(allValid).toBe(true);
    });
  });

  test("изменение количества генерирует соответствующее число UUID", async () => {
    await uuidGen.setCount(10);
    await uuidGen.generate();

    const lines = await uuidGen.getGeneratedLines();
    expect(lines).toHaveLength(10);
  });

  test("два последовательных клика Generate дают РАЗНЫЕ значения", async () => {
    const firstBatch  = await uuidGen.getGeneratedLines();
    await uuidGen.generate();
    const secondBatch = await uuidGen.getGeneratedLines();

    expect(firstBatch).not.toEqual(secondBatch);
  });

  test("галочка 'Uppercase' переводит буквы в верхний регистр", async () => {
    await uuidGen.uppercaseCheckbox.check();
    await uuidGen.generate();

    const value = (await uuidGen.getGeneratedLines()).join("");
    expect(value).not.toMatch(/[a-f]/);
    expect(value).toMatch(/[A-F]/);
  });

  test("галочка 'Hyphens' убирает дефисы из UUID", async () => {
    await uuidGen.hyphensCheckbox.uncheck();
    await uuidGen.generate();

    const lines = await uuidGen.getGeneratedLines();
    expect(lines[0]).not.toContain("-");
    expect(lines[0]).toHaveLength(32);
  });

});