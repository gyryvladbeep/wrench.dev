import { expect, Locator } from "@playwright/test";

/**
 * Ждёт, пока React "оживит" элемент после серверной отрисовки.
 *
 * Если ввести текст в поле до гидрации, React потом перезаписывает его
 * значением по умолчанию, и тест падает случайно (особенно при первом
 * запуске, пока dev-сервер компилирует страницу). React помечает
 * гидрированные DOM-узлы служебным ключом __reactFiber$..., по нему и ждём.
 */
export async function waitForHydration(locator: Locator): Promise<void> {
  await expect
    .poll(() => locator.evaluate((el) => Object.keys(el).some((key) => key.startsWith("__reactFiber$"))), {
      message: "элемент не был гидрирован React",
      timeout: 15_000,
    })
    .toBe(true);
}
