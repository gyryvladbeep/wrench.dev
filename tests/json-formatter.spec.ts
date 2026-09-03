import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════════════
 * УРОВЕНЬ 2 — ТЕСТИРУЕМ РЕАЛЬНЫЙ ИНСТРУМЕНТ
 * ═══════════════════════════════════════════════════════════════
 *
 * Раньше мы проверяли простые вещи: заголовок, ссылки.
 * Теперь тестируем настоящую логику: пользователь вводит текст,
 * инструмент его обрабатывает, мы проверяем результат.
 *
 * НОВОЕ ПОНЯТИЕ — ЛОКАТОРЫ (locators)
 * ─────────────────────────────────────
 * Локатор — это "адрес" элемента на странице, способ его найти.
 * В этом файле мы используем несколько разных стратегий поиска:
 *
 * 1. page.getByRole()  — по роли элемента (кнопка, ссылка, поле ввода)
 * 2. page.locator()    — по CSS-селектору (класс, тег)
 * 3. page.getByText()  — по видимому тексту на странице
 *
 * Порядок предпочтения (best practice в индустрии):
 * getByRole > getByLabel > getByText > locator (CSS) — в самом крайнем случае
 *
 * Почему? Потому что getByRole ищет элемент так же как это делает
 * пользователь глазами и screen reader — а не как ищет разработчик в коде.
 * Если верстальщик поменяет CSS-класс — тест на getByRole не сломается.
 */

test.describe("JSON Formatter", () => {

  // beforeEach выполняется ПЕРЕД каждым тестом в этом файле.
  // Это избавляет от копирования одной и той же строки в каждый test().
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/tools/json-formatter");
  });

  test("страница инструмента открывается", async ({ page }) => {
    // Проверяем что на странице есть заголовок с названием инструмента
    await expect(page.locator("h1")).toContainText("JSON Formatter");
  });

  test("невалидный JSON показывает сообщение об ошибке", async ({ page }) => {
    // ARRANGE — находим текстовое поле ввода.
    const inputField = page.locator("textarea").first();

    // ACT — вводим заведомо сломанный JSON (не хватает закрывающей скобки)
    await inputField.fill('{"name": "test"');

    // ASSERT
    // ─────────────────────────────────────────────────────────
    // УРОК: почему первая версия этого теста упала
    // ─────────────────────────────────────────────────────────
    // Мы искали текст "error" по ВСЕЙ странице — и нашли его
    // не только в блоке ошибки, но и в FAQ ниже на странице
    // ("Why does it say 'Unexpected...'"). Playwright специально
    // ругается в таком случае (strict mode violation), а не берёт
    // первый попавшийся элемент — чтобы тест не врал сам себе.
    //
    // РЕШЕНИЕ: сузить поиск до конкретного контейнера ошибки.
    // Посмотрев в код компонента (JsonFormatterTool.tsx), видно что
    // ошибка рендерится в <div> с классом "text-red-400".
    // Это частая техника — когда getByRole/getByText не справляются
    // из-за неоднозначности, точечный CSS-локатор — нормальное решение.
    const errorBox = page.locator(".text-red-400");
    await expect(errorBox).toBeVisible();

    // ─────────────────────────────────────────────────────────
    // ЕЩЁ ОДИН УРОК: не проверяй точный текст системных ошибок
    // ─────────────────────────────────────────────────────────
    // Первая версия ждала слово "Unexpected" — но реальный текст
    // ошибки JSON.parse() в Chrome звучит иначе: "Expected ',' or '}'...".
    // У Firefox и Safari формулировки вообще другие.
    //
    // Вывод: если текст генерирует браузер/движок (а не наше приложение),
    // НЕ проверяй точную формулировку — она хрупкая и ломается между
    // браузерами и их версиями. Проверяй только то, что мы контролируем:
    // что блок ошибки появился и что там вообще что-то написано.
    const errorText = await errorBox.textContent();
    expect(errorText).toBeTruthy();          // блок не пустой
    expect(errorText!.length).toBeGreaterThan(5); // там реально есть текст, а не просто иконка
  });

  test("валидный JSON форматируется с отступами", async ({ page }) => {
    // ARRANGE
    const inputField = page.locator("textarea").first();

    // ACT — вводим компактный (без пробелов) JSON
    const compactJson = '{"city":"Yerevan","population":1100000}';
    await inputField.fill(compactJson);

    // ASSERT — результат в выводе должен содержать перенос строки
    // (потому что форматированный JSON многострочный, а исходный — нет)
    // Берём второй textarea на странице — это область вывода (readonly)
    const outputField = page.locator("textarea").nth(1);

    // toHaveValue проверяет ТОЧНОЕ содержимое поля.
    // Используем regex чтобы не зависеть от количества пробелов —
    // достаточно проверить что есть перенос строки и оба значения на месте.
    await expect(outputField).toHaveValue(/Yerevan/);
    await expect(outputField).toHaveValue(/\n/); // содержит перенос строки = отформатирован
  });

  test("кнопка Minify убирает форматирование", async ({ page }) => {
    const inputField = page.locator("textarea").first();
    await inputField.fill('{"a": 1, "b": 2}');

    // Находим кнопку "Minify" по её видимому тексту и кликаем
    await page.getByRole("button", { name: "Minify" }).click();

    const outputField = page.locator("textarea").nth(1);

    // После минификации в результате НЕ должно быть переноса строки —
    // всё в одну строку. Проверяем что значение НЕ содержит \n.
    const value = await outputField.inputValue();
    expect(value).not.toContain("\n");
  });

  test("кнопка Copy копирует результат в буфер обмена", async ({ page, context }) => {
    // Даём браузеру разрешение на доступ к буферу обмена —
    // без этого браузер заблокирует операцию по соображениям безопасности
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const inputField = page.locator("textarea").first();
    await inputField.fill('{"test": true}');

    // Кликаем на кнопку копирования
    await page.getByRole("button", { name: /copy/i }).first().click();

    // Читаем что реально попало в буфер обмена браузера
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

    // Проверяем что в буфере есть наш текст
    expect(clipboardText).toContain("test");
  });

});