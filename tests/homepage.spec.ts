import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

test.describe("Главная страница", () => {

  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("страница открывается и показывает заголовок", async ({ page }) => {
    await expect(page).toHaveTitle(/Wrench/);
  });

  test("виден главный заголовок H1", async () => {
    await expect(homePage.heading).toBeVisible();
    // ─────────────────────────────────────────────────────────
    // УРОК: тест сломался не из-за бага, а из-за смены контента.
    // Заголовок обновили в рамках работы над позиционированием
    // (см. фидбек из Threads) — "Developer & QA tools" заменили на
    // task-centric "Stop keeping ten tabs open for ten tiny tools".
    // Тест проверял СТАРЫЙ текст и продолжал бы падать вечно, пока
    // кто-то не обновит его под актуальный контент маркетинга.
    //
    // Это нормальная, ожидаемая работа — тесты на текст заголовка
    // ОБЯЗАНЫ обновляться вместе с любым редизайном копирайта.
    // Хорошая практика — проверять не весь текст целиком (он может
    // ещё не раз поменяться), а ключевое, устойчивое слово из него.
    // ─────────────────────────────────────────────────────────
    await homePage.expectHeadingContains("tabs");
  });

  test("кнопка 'Browse tools' ведёт на страницу инструментов", async ({ page }) => {
    await homePage.clickBrowseTools();
    await expect(page).toHaveURL(/\/tools/);
  });

  test("переключатель языка меняет язык интерфейса", async ({ page }) => {
    await homePage.switchToRussian();
    await expect(page).toHaveURL(/\/ru/);
    // Тот же принцип — "вкладок" достаточно устойчивое слово в новом
    // русском заголовке, не завязываемся на всю фразу целиком.
    await homePage.expectHeadingContains("вкладок");
  });

});