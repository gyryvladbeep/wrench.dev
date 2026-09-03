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
    await homePage.expectHeadingContains("Developer");
  });

  test("кнопка 'Browse tools' ведёт на страницу инструментов", async ({ page }) => {
    await homePage.clickBrowseTools();
    await expect(page).toHaveURL(/\/tools/);
  });

  test("переключатель языка меняет язык интерфейса", async ({ page }) => {
    await homePage.switchToRussian();
    await expect(page).toHaveURL(/\/ru/);
    await homePage.expectHeadingContains("Инструменты");
  });

});