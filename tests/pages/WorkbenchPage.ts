import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object для /workbench (app/[locale]/workbench/page.tsx +
 * components/workbench/ToolPickerModal.tsx + WorkbenchGrid.tsx).
 *
 * Смотри общее объяснение паттерна в JsonFormatterPage.ts. Здесь он
 * особенно оправдан: страница собрана из трёх файлов сразу, и без
 * одного места со всеми локаторами тест пришлось бы держать в голове
 * структуру всех трёх одновременно.
 */
export class WorkbenchPage {
  readonly page: Page;

  readonly heading:            Locator;
  readonly addToolButton:      Locator;
  readonly newWorkspaceButton: Locator;
  readonly limitWorkspacesText: Locator;
  readonly renameButton:       Locator;
  readonly deleteButton:       Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;
  readonly emptyState:         Locator;

  // Модалка выбора инструментов — своя, отдельная зона.
  readonly pickerRoot:         Locator;
  readonly pickerSearchInput:  Locator;
  readonly pickerLimitBanner:  Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading            = page.getByRole("heading", { level: 1 });
    // ЛОВУШКА: пустое состояние показывает свою кнопку "Browse tools" с
    // ТЕМ ЖЕ текстом "+ Add tool" (workbench-content.ts: browseTools ===
    // addTool), и рендерится она ОДНОВРЕМЕННО с кнопкой в тулбаре, пока
    // рабочий стол пуст. Обе жмут одно и то же (setPickerOpen(true)),
    // поэтому .first() — не костыль, а осознанный выбор: неважно, какую
    // из двух одинаковых кнопок нажать.
    this.addToolButton      = page.getByRole("button", { name: "+ Add tool" }).first();
    this.newWorkspaceButton = page.getByRole("button", { name: "+ New workspace" });
    this.limitWorkspacesText = page.getByText(/reached the .+-workspace limit/);
    this.renameButton       = page.getByRole("button", { name: "Rename" });
    this.deleteButton       = page.getByRole("button", { name: "Delete", exact: true });
    this.confirmDeleteButton = page.getByRole("button", { name: "Yes, delete" });
    this.cancelDeleteButton  = page.getByRole("button", { name: "Cancel" });
    this.emptyState          = page.getByText("This workspace is empty");

    // Модалка — фиксированный оверлей на весь экран, класс из
    // ToolPickerModal.tsx (fixed inset-0 z-50). Отдельно от шапки, так
    // что риска перепутать с дропдаунами Header.tsx нет.
    this.pickerRoot        = page.locator("div.fixed.inset-0.z-50");
    this.pickerSearchInput = this.pickerRoot.getByPlaceholder("Search tools…");
    this.pickerLimitBanner = this.pickerRoot.getByText(/reached the .+-tool limit/);
  }

  async goto() {
    await this.page.goto("/en/workbench");
  }

  /** Вкладка конкретного рабочего стола по названию (переключение). */
  workspaceTab(name: string): Locator {
    return this.page.getByRole("button", { name, exact: true });
  }

  async renameActiveWorkspace(currentName: string, newName: string) {
    await this.workspaceTab(currentName).dblclick();
    const input = this.page.locator("input:visible").first();
    await input.fill(newName);
    await input.press("Enter");
  }

  async openToolPicker() {
    await this.addToolButton.click();
    await expect(this.pickerRoot).toBeVisible();
  }

  async closeToolPicker() {
    // У этой модалки, в отличие от SearchModal.tsx, нет обработчика
    // Escape (см. находку в чате при написании этого спека) — закрываем
    // кликом по фону вне центральной карточки.
    await this.page.mouse.click(10, 10);
    await expect(this.pickerRoot).toBeHidden();
  }

  /** Строка инструмента в модалке — по ТОЧНОМУ названию, а не подстроке,
   *  чтобы "JSON Formatter" не подхватил заодно что-то вроде "JSON to CSV". */
  pickerToolRow(exactToolName: string): Locator {
    return this.pickerRoot.getByText(exactToolName, { exact: true }).locator("xpath=ancestor::button[1]");
  }

  async addToolFromPicker(exactToolName: string) {
    await this.pickerToolRow(exactToolName).click();
  }

  /** Заголовок карточки инструмента на самой странице (не в модалке). */
  toolCardHeading(exactToolName: string): Locator {
    return this.page.getByRole("heading", { level: 3, name: exactToolName, exact: true });
  }

  /** Кнопка "✕" (убрать инструмент) в шапке конкретной карточки. */
  removeToolButton(exactToolName: string): Locator {
    return this.toolCardHeading(exactToolName).locator("..").getByRole("button", { name: "Remove from workbench" });
  }

  /** Весь draggable-контейнер карточки — источник/цель для drag & drop. */
  toolCard(exactToolName: string): Locator {
    return this.toolCardHeading(exactToolName).locator("../..");
  }

  async removeTool(exactToolName: string) {
    await this.removeToolButton(exactToolName).click();
  }

  toolCountText(): Locator {
    return this.page.getByText(/^\d+\/\d+ tools$/);
  }

  /** Порядок карточек на странице сейчас — по заголовкам, сверху вниз. */
  async currentCardOrder(): Promise<string[]> {
    return this.page.getByRole("heading", { level: 3 }).allTextContents();
  }

  async dragCardOnto(sourceToolName: string, targetToolName: string) {
    await this.toolCard(sourceToolName).dragTo(this.toolCard(targetToolName));
  }

  async startDeleteConfirmation() {
    await this.deleteButton.click();
    await expect(this.confirmDeleteButton).toBeVisible();
  }
}
