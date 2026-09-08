import { test, expect } from "@playwright/test";
import { LootTableValidatorPage } from "./pages/LootTableValidatorPage";

test.describe("Loot Table Validator", () => {
  let tool: LootTableValidatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new LootTableValidatorPage(page);
    await tool.goto();
  });

  test("таблица по умолчанию (70/25/4/1) даёт суммарный вес 100", async () => {
    await expect(tool.totalWeightText).toHaveText("Total weight: 100");
  });

  test("запуск симуляции показывает точные ожидаемые % (детерминированные) для всех предметов", async () => {
    await tool.simulate();

    await expect(tool.expectedPctCell("Common")).toHaveText("70.00%");
    await expect(tool.expectedPctCell("Rare")).toHaveText("25.00%");
    await expect(tool.expectedPctCell("Epic")).toHaveText("4.00%");
    await expect(tool.expectedPctCell("Legendary")).toHaveText("1.00%");
  });

  test("сумма 'выпало раз' по всем предметам всегда равна числу роллов, несмотря на случайность", async () => {
    await tool.setRollCount(2000);
    await tool.simulate();

    const names = ["Common", "Rare", "Epic", "Legendary"];
    let total = 0;
    for (const name of names) {
      const text = await tool.rolledCell(name).textContent();
      total += Number(text);
    }
    expect(total).toBe(2000);
  });

  test("добавление и удаление предмета меняет число строк", async () => {
    await expect(tool.nameInputs).toHaveCount(4);

    await tool.addItemButton.click();
    await expect(tool.nameInputs).toHaveCount(5);

    await tool.removeButton(0).click();
    await expect(tool.nameInputs).toHaveCount(4);
  });

  test("кнопка симуляции отключена, если удалить все предметы", async () => {
    for (let i = 0; i < 4; i++) {
      await tool.removeButton(0).click();
    }

    await expect(tool.totalWeightText).toHaveText("Total weight: 0");
    await expect(tool.simulateButton).toBeDisabled();
  });
});
