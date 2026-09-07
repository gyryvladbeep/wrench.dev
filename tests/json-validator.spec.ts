import { test, expect } from "@playwright/test";
import { JsonValidatorPage } from "./pages/JsonValidatorPage";

test.describe("JSON Validator", () => {
  let tool: JsonValidatorPage;

  test.beforeEach(async ({ page }) => {
    tool = new JsonValidatorPage(page);
    await tool.goto();
  });

  test("по умолчанию валидный пример JSON — объект с 3 ключами", async () => {
    await expect(tool.validHeading).toBeVisible();
    await expect(tool.summaryText).toHaveText("— top-level value is a object with 3 keys.");
  });

  test("кнопка 'Load invalid example' показывает сообщение об ошибке", async () => {
    await tool.loadInvalidButton.click();

    await expect(tool.invalidHeading).toBeVisible();
    await expect(tool.errorMessage).not.toBeEmpty();
  });

  test("после невалидного примера кнопка 'Load valid example' возвращает к валидному состоянию", async () => {
    await tool.loadInvalidButton.click();
    await expect(tool.invalidHeading).toBeVisible();

    await tool.loadValidButton.click();
    await expect(tool.validHeading).toBeVisible();
  });

  test("пустой ввод показывает подсказку вместо результата валидации", async () => {
    await tool.setInput("");

    await expect(tool.emptyHint).toBeVisible();
    await expect(tool.validHeading).toBeHidden();
    await expect(tool.invalidHeading).toBeHidden();
  });

  test("массив из нескольких элементов — 'array with N items' (множественное число)", async () => {
    await tool.setInput("[1, 2, 3]");

    await expect(tool.summaryText).toHaveText("— top-level value is a array with 3 items.");
  });

  test("массив из одного элемента — 'array with 1 item' (единственное число)", async () => {
    await tool.setInput("[42]");

    await expect(tool.summaryText).toHaveText("— top-level value is a array with 1 item.");
  });

  test("строковый примитив на верхнем уровне определяется как string", async () => {
    await tool.setInput('"hello"');

    await expect(tool.summaryText).toHaveText("— top-level value is a string.");
  });

  test("null на верхнем уровне определяется как null", async () => {
    await tool.setInput("null");

    await expect(tool.summaryText).toHaveText("— top-level value is a null.");
  });
});
