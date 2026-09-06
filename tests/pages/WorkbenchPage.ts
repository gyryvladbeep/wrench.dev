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

  // Строка вкладок рабочих столов — нужна отдельно от workspaceTab(),
  // чтобы уметь спрашивать про порядок ВСЕХ вкладок сразу (см.
  // workspaceTabOrder), а не про одну конкретную по имени.
  readonly workspaceTabsRow:   Locator;

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

    // Тот самый div с классами "mb-4 flex flex-wrap items-center gap-2"
    // из workbench/page.tsx — единственный такой на странице, держит
    // и вкладки рабочих столов, и кнопку "+ New workspace"/лимит рядом.
    this.workspaceTabsRow  = page.locator("div.mb-4.flex.flex-wrap.items-center.gap-2");
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
    // Раньше у этой модалки не было обработчика Escape при живом хинте
    // "Esc" в углу (нашли и починили отдельно, см. ToolPickerModal.tsx) —
    // теперь можно закрывать по Escape, как и было обещано в UI.
    await this.page.keyboard.press("Escape");
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

  /** Заголовок карточки инструмента на самой странице (не в модалке).
   *
   *  Бросаем явную ошибку без имени, а не даём Playwright тихо съесть
   *  "name: undefined" как "фильтр по имени не задан" (getByRole в этом
   *  случае резолвится ВООБЩЕ ПО ВСЕМ h3 на странице — ровно это и было
   *  найдено как причина флейка в dragCardOnto(), см. её комментарий и
   *  комментарий в currentCardOrder() ниже). Лучше сразу понятная
   *  ошибка "вызван без имени", чем непонятный "resolved to 6 elements"
   *  без единой зацепки, откуда взялось пустое имя. */
  toolCardHeading(exactToolName: string): Locator {
    if (!exactToolName) {
      throw new Error(
        "toolCardHeading() вызван без имени инструмента — вероятно, currentCardOrder() " +
        "поймал ещё не отрисованный грид (см. комментарий в currentCardOrder())."
      );
    }
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

  /** Порядок карточек на странице сейчас — по заголовкам, сверху вниз.
   *
   *  НАСТОЯЩАЯ причина флейка "resolved to 6 elements" в тесте на
   *  перетаскивание карточек была здесь, а не в toolCard(): allTextContents()
   *  не ждёт полного рендера — если вызвать её в узком окне, где грид
   *  на мгновение пуст (например, useWorkbenches перезагружает данные
   *  из-за фонового обновления auth-токена — тогда app/[locale]/workbench/page.tsx
   *  на время рендерит null, пока wbLoading снова true), она молча
   *  вернёт [] вместо 6 названий. Дальше before[0] и before[length-1]
   *  оба оказываются undefined — а getByRole({ name: undefined }) в
   *  Playwright означает "без фильтра по имени", то есть резолвится
   *  сразу во ВСЕ 6 карточек. Отсюда и "resolved to 6 elements" в двух
   *  прогонах из десяти на --repeat-each=5 (гонка чаще ловится под
   *  нагрузкой параллельных воркеров).
   *
   *  Чиним не борьбой с симптомом (можно было бы просто перепроверять
   *  args), а тем, что ждём, пока в гриде появится хотя бы одна
   *  карточка, ПЕРЕД тем как читать список: React рендерит tools.map()
   *  одним коммитом, так что если появилась первая карточка — значит,
   *  появились и все остальные. */
  async currentCardOrder(): Promise<string[]> {
    const headings = this.page.getByRole("heading", { level: 3 });
    await headings.first().waitFor({ state: "visible" });
    return headings.allTextContents();
  }

  async dragCardOnto(sourceToolName: string, targetToolName: string) {
    await this.toolCard(sourceToolName).dragTo(this.toolCard(targetToolName));
  }

  async startDeleteConfirmation() {
    await this.deleteButton.click();
    await expect(this.confirmDeleteButton).toBeVisible();
  }

  /** Порядок вкладок рабочих столов сейчас — по названию, слева направо.
   *  "> div" — только обёртки самих вкладок, не кнопка "+ New workspace"
   *  и не текст лимита, которые лежат в том же ряду соседями (см. JSX).
   *
   *  Та же гонка, что была найдена и починена в currentCardOrder() —
   *  workspace-tabs-row живёт на той же странице с тем же useWorkbenches
   *  и тем же "if (!user || wbLoading) return null" в page.tsx, так что
   *  тоже может на мгновение полностью пропасть из DOM при фоновой
   *  перезагрузке. Ждём хотя бы одну вкладку перед чтением списка. */
  async workspaceTabOrder(): Promise<string[]> {
    const tabs = this.workspaceTabsRow.locator("> div");
    await tabs.first().waitFor({ state: "visible" });
    return tabs.allTextContents();
  }

  /** Внешний draggable-контейнер вкладки — как toolCard() у карточек
   *  инструментов: перетаскивать нужно за div с атрибутом draggable,
   *  а не за сам button внутри него. */
  workspaceTabCard(exactWorkspaceName: string): Locator {
    return this.workspaceTab(exactWorkspaceName).locator("..");
  }

  async dragWorkspaceTabOnto(sourceName: string, targetName: string) {
    await this.workspaceTabCard(sourceName).dragTo(this.workspaceTabCard(targetName));
  }
}
