import { test, expect } from "@playwright/test";
import { HeaderPage } from "./pages/HeaderPage";

// ═══════════════════════════════════════════════════════════════
// Почему этот файл вообще появился
// ═══════════════════════════════════════════════════════════════
// Редизайн шапки (сентябрь 2026: новый логотип, дропдауны Categories/
// Learn, аватар вместо отдельной кнопки "Sign out") сломал
// auth-flow.spec.ts, потому что тесты держали локаторы шапки прямо
// у себя, а не в общем Page Object. Ошибку исправили точечно, но
// сама шапка — это самый часто меняющийся, самый "на виду" элемент
// сайта, и до сих пор не было ни одного теста, который бы проверял
// её собственную логику (открытие/закрытие дропдаунов, отсутствие
// оверфлоу, перенос текста). Этот файл закрывает именно этот пробел.
//
// Все тесты ниже — про ГОСТЯ (разлогиненного пользователя), поэтому
// они независимы друг от друга и могут гоняться параллельно — в
// отличие от auth-flow.spec.ts, где шаги обязаны идти по порядку
// (test.describe.serial), тут такой связи нет.

test.describe("Шапка сайта — навигация", () => {

  let header: HeaderPage;

  test.beforeEach(async ({ page }) => {
    header = new HeaderPage(page);
    await header.goto("en");
  });

  test("логотип показывает 'Wrench-Branch' и ведёт на главную", async ({ page }) => {
    await expect(header.logoLink).toContainText("Wrench");
    await expect(header.logoLink).toContainText("-Branch");
    await header.logoLink.click();
    // localePath(en, "/") отдаёт "/" без префикса — английский язык тут
    // "дефолтный", поэтому с главной на главную клик может URL не менять
    // вовсе (остаться на "/en") либо привести на голый "/" — оба варианта
    // означают одно и то же для пользователя: он на главной странице.
    await expect(page).toHaveURL(/\/(en)?\/?$/);
  });

  test("верхний уровень навигации виден целиком: Tools, Categories, Workbench, Learn, Pro", async () => {
    await expect(header.toolsLink).toBeVisible();
    await expect(header.categoriesButton).toBeVisible();
    await expect(header.workbenchLink).toBeVisible();
    await expect(header.learnButton).toBeVisible();
    await expect(header.proLink).toBeVisible();
  });

  test("Workbench помечен бейджем 'New'; для гостя ведёт на логин (страница требует аккаунт)", async ({ page }) => {
    await expect(header.workbenchLink).toContainText("New");
    await header.workbenchLink.click();
    // /workbench защищён авторизацией (см. auth-guard в app/[locale]/workbench/page.tsx) —
    // гостя редиректит на логин, а не открывает страницу напрямую. Сам
    // сценарий "залогиненный пользователь реально попадает на /workbench"
    // покрыт в workbench.spec.ts, где уже есть настоящая сессия.
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("дропдаун 'Categories' открывается и содержит ссылки на все 11 категорий", async () => {
    await header.openCategories();
    // 11 — это количество записей в lib/tools-registry.ts → categories
    // (было 10, стало 11 после добавления категории "gamedev" в 2026-09).
    // Если кто-то добавит или уберёт категорию, этот тест — сигнал
    // обновить и число здесь, и проверить, что новая категория реально
    // кликабельна из шапки, а не только существует в реестре.
    await expect(header.dropdownLinks()).toHaveCount(11);
  });

  test("клик по категории в дропдауне ведёт на страницу этой категории", async ({ page }) => {
    await header.openCategories();
    await header.dropdownLinks().first().click();
    await expect(page).toHaveURL(/\/categories\//);
  });

  test("дропдаун 'Learn' открывается и содержит 4 пункта: Challenges/Interview/Playground/Knowledge", async () => {
    await header.openLearn();
    await expect(header.dropdownLinks()).toHaveCount(4);
    await expect(header.dropdownLinks().filter({ hasText: "Challenges" })).toBeVisible();
    await expect(header.dropdownLinks().filter({ hasText: "Interview" })).toBeVisible();
    await expect(header.dropdownLinks().filter({ hasText: "Playground" })).toBeVisible();
    await expect(header.dropdownLinks().filter({ hasText: "Knowledge" })).toBeVisible();
  });

  test("Escape закрывает открытый дропдаун", async () => {
    await header.openCategories();
    await header.closeDropdownWithEscape();
  });

  test("клик вне дропдауна закрывает его", async () => {
    await header.openLearn();
    await header.closeDropdownByClickingOutside();
  });

  test("открытие 'Categories' закрывает ранее открытый 'Learn' (не может быть открыто два дропдауна сразу)", async () => {
    await header.openLearn();
    await header.openCategories();
    // openCategories() уже проверяет, что панель видна — здесь важно,
    // что она РОВНО ОДНА, а не что где-то осталась старая от Learn.
    await expect(header.openDropdownPanel).toHaveCount(1);
    await expect(header.dropdownLinks()).toHaveCount(11); // это уже категории, не Learn
  });

  test("поиск открывается по клику на кнопку", async () => {
    await header.openSearchViaClick();
  });

  test("поиск открывается по горячей клавише Ctrl/Cmd+K", async () => {
    await header.openSearchViaShortcut();
  });

  test("гость видит 'Sign in' / 'Sign up' вместо аватара", async () => {
    await expect(header.signInLink).toBeVisible();
    await expect(header.signUpLink).toBeVisible();
    await expect(header.accountMenuButton).toBeHidden();
  });

  test("переключатель языка меняет URL", async ({ page }) => {
    await header.localeRuButton.click();
    await expect(page).toHaveURL(/\/ru/);
  });

});

// ═══════════════════════════════════════════════════════════════
// Регрессии на конкретные, реально найденные на проде баги верстки.
// ═══════════════════════════════════════════════════════════════
// Оба бага были обнаружены не "на глаз", а измерением фактического
// layout (getBoundingClientRect / scrollWidth) на живом сайте — здесь
// тот же принцип: не скриншот и субъективная оценка, а число, у
// которого есть чёткий порог.
test.describe("Шапка сайта — регрессии на баги верстки", () => {

  for (const width of [1920, 1440, 1280]) {
    test(`нет горизонтального оверфлоу на ширине ${width}px (en)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      const header = new HeaderPage(page);
      await header.goto("en");
      await header.expectNoHorizontalOverflow();
    });

    test(`нет горизонтального оверфлоу на ширине ${width}px (ru — самый длинный текст)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      const header = new HeaderPage(page);
      await header.goto("ru");
      await header.expectNoHorizontalOverflow();
    });
  }

  test("русские пункты меню ('Рабочий стол', 'База знаний' и т.д.) не переносятся на две строки", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const header = new HeaderPage(page);
    await header.goto("ru");
    await header.expectNavIsSingleLine();
  });

});
