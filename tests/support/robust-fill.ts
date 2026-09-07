import { Locator, expect } from "@playwright/test";

/**
 * fill() (а иногда и click()) под нагрузкой (--repeat-each) изредка молча
 * не регистрируется — этот класс нестабильности сначала нашёлся на
 * <input type="date"> (age-calculator/date-difference), затем на обычном
 * текстовом поле и клике по кнопке-пресету (cron-expression). Поэтому для
 * любого поля, где сразу после записи мы проверяем результат, используем
 * этот хелпер вместо голого fill(): он повторяет саму ЗАПИСЬ (не только
 * чтение), если значение не проставилось с первой попытки.
 */
export async function fillRobust(locator: Locator, value: string, attempts = 3) {
  for (let i = 0; i < attempts - 1; i++) {
    await locator.fill(value);
    try {
      await expect(locator).toHaveValue(value, { timeout: 1500 });
      return;
    } catch {
      // значение не проставилось — пробуем ещё раз.
    }
  }
  await locator.fill(value);
  await expect(locator).toHaveValue(value);
}

/**
 * То же самое, но для click() по кнопкам, которые не пишут в <input>, а
 * меняют состояние где-то ещё (фильтр, режим, выбор поля и т.д.) — сюда
 * передаём произвольную проверку ожидаемого результата, которая должна
 * пройти после клика; если не проходит, повторяем клик.
 */
export async function clickRobust(button: Locator, verify: () => Promise<void>, attempts = 3) {
  for (let i = 0; i < attempts - 1; i++) {
    await button.click();
    try {
      await verify();
      return;
    } catch {
      // состояние не обновилось — пробуем ещё раз.
    }
  }
  await button.click();
  await verify();
}
