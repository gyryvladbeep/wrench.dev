import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object для шапки сайта (components/Header.tsx).
 *
 * Смотри подробное объяснение паттерна POM в JsonFormatterPage.ts.
 * Здесь тот же принцип: тест не должен знать, что "Categories" —
 * это на самом деле выпадающий список, а не ссылка, или что открытая
 * панель дропдауна — это div с классом "animate-scale-in". Тест
 * говорит "открой категории" и "проверь, что там 10 пунктов" —
 * а КАК это устроено внутри шапки, знает только этот файл.
 *
 * УРОК (см. историю auth-flow.spec.ts): именно отсутствие такого
 * Page Object для шапки и привело к тому, что редизайн (Sign out
 * спрятался в выпадающее меню аватара) сломал тесты — локаторы были
 * прямо внутри спеков, размётанные по разным местам. Здесь всё
 * собрано в одном месте: если шапка снова поменяется, чинить нужно
 * будет только этот файл, а не гонять правки по всем спекам.
 */
export class HeaderPage {
  readonly page: Page;

  // Скоупим почти всё через <header role="banner">, чтобы не путать,
  // например, "Sign in" в шапке с такой же ссылкой где-то в контенте
  // страницы (как уже было один раз с двумя кнопками "Sign out" на
  // /profile).
  readonly banner: Locator;

  readonly logoLink:          Locator;
  readonly toolsLink:         Locator;
  readonly categoriesButton:  Locator;
  readonly workbenchLink:     Locator;
  readonly learnButton:       Locator;
  readonly proLink:           Locator;

  readonly searchButton:      Locator;
  readonly localeEnButton:    Locator;
  readonly localeRuButton:    Locator;

  readonly signInLink:        Locator;
  readonly signUpLink:        Locator;
  readonly accountMenuButton: Locator;

  // Открытая панель дропдауна (категорий/обучения) — рендерится
  // условно ({open && (...)}), поэтому в любой момент времени в DOM
  // существует максимум одна такая панель.
  readonly openDropdownPanel: Locator;

  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.banner = page.getByRole("banner");

    this.logoLink         = this.banner.getByRole("link", { name: /Wrench-Branch/ });
    this.toolsLink        = this.banner.getByRole("link", { name: /^(Tools|Инструменты)$/ });
    this.categoriesButton = this.banner.getByRole("button", { name: /^(Categories|Категории)$/ });
    this.workbenchLink    = this.banner.getByRole("link", { name: /Workbench|Рабочий стол/ });
    this.learnButton      = this.banner.getByRole("button", { name: /^(Learn|Обучение)$/ });
    this.proLink          = this.banner.getByRole("link", { name: /^Pro/ });

    // На десктопе и на мобильном — два разных <button>, но виден
    // всегда только один (остальное скрыто через hidden/md:hidden).
    // .filter({ visible: true }) сам выбирает актуальный под текущий
    // viewport, тесту не нужно об этом думать.
    this.searchButton = this.banner
      .getByRole("button", { name: /Search|Поиск/ })
      .filter({ visible: true });

    this.localeEnButton = this.banner.getByRole("button", { name: "EN", exact: true });
    this.localeRuButton = this.banner.getByRole("button", { name: "RU", exact: true });

    this.signInLink        = this.banner.getByRole("link", { name: /Sign in|Войти/ });
    this.signUpLink        = this.banner.getByRole("link", { name: /Create account|Создать аккаунт/ });
    this.accountMenuButton = this.banner.getByRole("button", { name: "Account menu" });

    this.openDropdownPanel = this.banner.locator(".animate-scale-in");
    this.searchInput       = page.getByPlaceholder(/Search tools|Поиск инструментов/);
  }

  async goto(locale: "en" | "ru" = "en") {
    await this.page.goto(`/${locale}`);
  }

  async openCategories() {
    await this.categoriesButton.click();
    await expect(this.openDropdownPanel).toBeVisible();
  }

  async openLearn() {
    await this.learnButton.click();
    await expect(this.openDropdownPanel).toBeVisible();
  }

  /** Ссылки внутри ТЕКУЩЕЙ открытой панели дропдауна. */
  dropdownLinks(): Locator {
    return this.openDropdownPanel.getByRole("link");
  }

  async closeDropdownWithEscape() {
    await this.page.keyboard.press("Escape");
    await expect(this.openDropdownPanel).toBeHidden();
  }

  async closeDropdownByClickingOutside() {
    // Кликаем в пустую точку страницы ниже шапки (шапка — h-12, 48px),
    // а не по какой-то конкретной ссылке — иначе клик мог бы ещё и
    // куда-то перейти, а нам нужно проверить именно закрытие дропдауна,
    // а не навигацию.
    await this.page.mouse.click(10, 300);
    await expect(this.openDropdownPanel).toBeHidden();
  }

  async openSearchViaClick() {
    await this.searchButton.click();
    await expect(this.searchInput).toBeVisible();
  }

  async openSearchViaShortcut() {
    const isMac = process.platform === "darwin";
    await this.page.keyboard.press(isMac ? "Meta+k" : "Control+k");
    await expect(this.searchInput).toBeVisible();
  }

  /**
   * Регрессия на реальный баг, найденный на проде: правый блок шапки
   * (поиск + локаль + аватар) вылезал за пределы центрированного
   * контейнера на широких экранах, из-за чего появлялся
   * горизонтальный скролл всей страницы. Проверяем не "на глаз", а
   * фактическую ширину скролла документа — так, как баг и был
   * изначально пойман.
   */
  async expectNoHorizontalOverflow() {
    const overflow = await this.page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1); // 1px — допуск на округление
  }

  /**
   * Регрессия на баг с переносом русских пунктов меню на две строки
   * (например, "Рабочий стол" или "База знаний" ломались на lg-вьюпорте
   * без white-space: nowrap). Если nav перенёсся на две строки — его
   * высота вырастет примерно вдвое относительно текста в одну строку.
   */
  async expectNavIsSingleLine() {
    const nav = this.banner.getByRole("navigation", { name: "Main" });
    const box = await nav.boundingBox();
    expect(box).not.toBeNull();
    // Одна строка текста в этой шапке — это ~16-20px высоты.
    // Двухстрочный перенос даёт заметно больше (~35-40px).
    expect(box!.height).toBeLessThan(28);
  }
}
