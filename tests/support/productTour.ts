import { expect, Page } from "@playwright/test";

/**
 * Закрывает модалку «Want a quick tour?» (components/onboarding/ProductTour.tsx).
 *
 * После успешной регистрации SignupForm.tsx ведёт на /?tour=1, и на главной
 * поверх страницы появляется модалка-согласие на тур по продукту. Она
 * перекрывает всю страницу (fixed inset-0), поэтому любой клик по шапке —
 * например по меню аккаунта — упирается в «element intercepts pointer
 * events», пока модалку не закроют.
 *
 * Хелпер заодно проверяет саму фичу: модалка действительно появилась, а
 * ?tour=1 убирается из адресной строки после ответа — иначе обновление
 * страницы показало бы тур заново.
 */
export async function dismissProductTour(page: Page): Promise<void> {
  const notNow = page.getByRole("button", { name: /^(Not now|Не сейчас)$/ });
  await expect(notNow).toBeVisible({ timeout: 10_000 });
  await notNow.click();
  await expect(notNow).toBeHidden();
  await expect(page).not.toHaveURL(/[?&]tour=1/);
}
