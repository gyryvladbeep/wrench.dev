import { Page, Locator, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════════════
 * PAGE OBJECT MODEL (POM)
 * ═══════════════════════════════════════════════════════════════
 *
 * Что это такое простыми словами:
 * Обычный класс TypeScript, который "оборачивает" одну страницу сайта.
 * Внутри — все локаторы элементов этой страницы (как их найти) и
 * методы для типичных действий (как их использовать).
 *
 * ТЕСТ не должен знать HTML-структуру страницы. Тест должен уметь
 * говорить простым языком: "открой страницу", "введи такой JSON",
 * "проверь что вывод правильный". А ГДЕ и КАК искать элементы на
 * странице — это забота Page Object, а не теста.
 *
 * Аналогия: Page Object — это как пульт от телевизора. Тебе не нужно
 * знать какая именно микросхема внутри переключает канал — ты просто
 * нажимаешь кнопку "channel up". Если производитель поменяет микросхему
 * внутри — кнопка снаружи останется той же.
 */
export class JsonFormatterPage {
  readonly page: Page;

  // Локаторы — объявляем их один раз здесь, а не в каждом тесте
  readonly inputField:  Locator;
  readonly outputField: Locator;
  readonly errorBox:    Locator;
  readonly minifyButton: Locator;
  readonly copyButton:   Locator;

  // Конструктор — вызывается когда создаём new JsonFormatterPage(page)
  constructor(page: Page) {
    this.page = page;
    this.inputField   = page.locator("textarea").first();
    this.outputField  = page.locator("textarea").nth(1);
    this.errorBox     = page.locator(".text-red-400");
    this.minifyButton = page.getByRole("button", { name: "Minify" });
    this.copyButton   = page.getByRole("button", { name: /copy/i }).first();
  }

  // Метод-действие: открыть страницу
  async goto() {
    await this.page.goto("/en/tools/json-formatter");
  }

  // Метод-действие: ввести JSON во входное поле
  async enterJson(json: string) {
    await this.inputField.fill(json);
  }

  // Метод-действие: нажать Minify
  async clickMinify() {
    await this.minifyButton.click();
  }

  // Метод-действие: получить текущее значение поля вывода
  async getOutputValue(): Promise<string> {
    return this.outputField.inputValue();
  }

  // Можно даже класть внутрь ГОТОВЫЕ ПРОВЕРКИ (assertions), если
  // они переиспользуются часто — это уже более продвинутый приём.
  async expectOutputToContain(text: string) {
    await expect(this.outputField).toHaveValue(new RegExp(text));
  }

  async expectErrorVisible() {
    await expect(this.errorBox).toBeVisible();
  }
}