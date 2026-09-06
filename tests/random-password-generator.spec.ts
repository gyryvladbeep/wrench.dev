import { test, expect } from "@playwright/test";
import { PasswordGeneratorPage } from "./pages/PasswordGeneratorPage";

test.describe("Password Generator", () => {

  let tool: PasswordGeneratorPage;

  test.beforeEach(async ({ page }) => {
    tool = new PasswordGeneratorPage(page);
    await tool.goto();
  });

  test("по умолчанию длина 20 и все 4 набора символов включены", async () => {
    await expect(tool.lengthSlider).toHaveValue("20");
    const password = await tool.getPassword();
    expect(password).toHaveLength(20);

    await expect(tool.lowerCheckbox).toBeChecked();
    await expect(tool.upperCheckbox).toBeChecked();
    await expect(tool.digitsCheckbox).toBeChecked();
    await expect(tool.symbolsCheckbox).toBeChecked();
  });

  test("движение ползунка длины меняет длину пароля", async () => {
    await tool.setLength(8);
    await expect(tool.lengthSlider).toHaveValue("8");
    // Пароль перегенерируется в отдельном useEffect ПОСЛЕ того, как значение
    // слайдера уже обновилось — между этими двумя рендерами есть кадр,
    // в который длина слайдера уже "8", а старый пароль ещё не заменён.
    // expect.poll ждёт актуального значения вместо чтения в этот кадр.
    await expect.poll(() => tool.getPassword()).toHaveLength(8);
  });

  test("если оставить включённым только '0-9' — пароль состоит только из цифр", async () => {
    await tool.lowerCheckbox.uncheck();
    await tool.upperCheckbox.uncheck();
    await tool.symbolsCheckbox.uncheck();

    // Тот же эффект-после-рендера, что и у слайдера длины (см. выше) —
    // пароль пересчитывается отдельным useEffect'ом, поллим вместо
    // разового чтения сразу после трёх uncheck() подряд.
    await expect.poll(() => tool.getPassword()).toMatch(/^[0-9]+$/);
  });

  test("нельзя выключить все наборы символов сразу — последний остаётся включённым", async () => {
    await tool.lowerCheckbox.uncheck();
    await tool.upperCheckbox.uncheck();
    await tool.digitsCheckbox.uncheck();
    // Это последний оставшийся включённый набор — попытка его выключить
    // не должна пройти (см. защиту в toggle() внутри компонента).
    await tool.symbolsCheckbox.click();

    await expect(tool.symbolsCheckbox).toBeChecked();
    const password = await tool.getPassword();
    expect(password.length).toBeGreaterThan(0);
  });

  test("кнопка Generate даёт новый пароль без изменения настроек", async () => {
    const first = await tool.getPassword();
    await tool.generateButton.click();
    const second = await tool.getPassword();

    expect(second).not.toEqual(first);
    expect(second).toHaveLength(20);
  });

});
