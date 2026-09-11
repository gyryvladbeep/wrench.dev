import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object для /workbench (app/[locale]/workbench/page.tsx +
 * components/workbench/ToolPickerModal.tsx + WorkbenchCanvas.tsx).
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

  // Попап "Поделиться" — публичная read-only ссылка на свободный холст.
  readonly shareButton:        Locator;
  readonly sharePanel:         Locator;
  readonly sharePublicToggle:  Locator;
  readonly shareUrlText:       Locator;

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

    // Тот самый div с классами "flex flex-wrap items-center gap-2" из
    // workbench/page.tsx — единственный такой на странице, держит и
    // вкладки рабочих столов, и кнопку "+ New workspace"/лимит рядом.
    // ПРИМЕЧАНИЕ: раньше здесь ещё был класс "mb-4" — локатор был на
    // него завязан, но сам класс исчез из разметки ещё в редизайне под
    // полностраничный холст (плавающая панель сама уже задаёт отступы),
    // а тест на это не заметил, потому что workspaceTabOrder() тогда
    // ещё нигде не вызывался. Нашлось только сейчас, при добавлении
    // теста на драг вкладок — .mb-4 полностью убран из селектора.
    this.workspaceTabsRow  = page.locator("div.flex.flex-wrap.items-center.gap-2").first();

    this.shareButton       = page.getByRole("button", { name: "Share", exact: true });
    // role="switch" делает панель однозначно адресуемой без завязки на
    // конкретную обёртку — сам переключатель у нас единственный на странице.
    this.sharePublicToggle = page.getByRole("switch", { name: "Public link" });
    // Панель — ближайший общий предок переключателя, который несёт рамку
    // попапа; проще и устойчивее, чем присваивать компоненту отдельный
    // data-атрибут только ради теста.
    this.sharePanel         = this.sharePublicToggle.locator("xpath=ancestor::div[contains(@class,'absolute')][1]");
    this.shareUrlText        = this.sharePanel.locator("span.font-mono");
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
        "поймал ещё не отрисованный холст (см. комментарий в currentCardOrder())."
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

  /** Порядок карточек в DOM сейчас — по заголовкам, в порядке рендера.
   *
   *  На свободном холсте это БОЛЬШЕ НЕ визуальный порядок слева направо
   *  или сверху вниз (карточки стоят там, куда их перетащили) — это
   *  z-index: WorkbenchCanvas рисует tools.map() в порядке tool_slugs,
   *  и moveTool() переносит перетащенный slug в конец массива, так что
   *  последняя тронутая карточка оказывается поверх остальных. Тест на
   *  drag & drop ниже (workbench.spec.ts) проверяет именно это — что
   *  порядок массива меняется, а не что карточка визуально попала в
   *  другую ячейку сетки, которой на холсте больше нет.
   *
   *  НАСТОЯЩАЯ причина исходного флейка "resolved to 6 elements" была
   *  здесь: allTextContents() не ждёт полного рендера — если вызвать её
   *  в узком окне, где холст на мгновение пуст (например, useWorkbenches
   *  перезагружает данные из-за фонового обновления auth-токена — тогда
   *  app/[locale]/workbench/page.tsx на время рендерит null, пока
   *  wbLoading снова true), она молча вернёт [] вместо 6 названий.
   *  Дальше before[0] и before[length-1] оба оказываются undefined — а
   *  getByRole({ name: undefined }) в Playwright означает "без фильтра
   *  по имени", то есть резолвится сразу во ВСЕ 6 карточек.
   *
   *  Чиним не борьбой с симптомом, а тем, что ждём, пока в холсте
   *  появится хотя бы одна карточка, ПЕРЕД тем как читать список: React
   *  рендерит tools.map() одним коммитом, так что если появилась первая
   *  карточка — значит, появились и все остальные. */
  async currentCardOrder(): Promise<string[]> {
    const headings = this.page.getByRole("heading", { level: 3 });
    await headings.first().waitFor({ state: "visible" });
    return headings.allTextContents();
  }

  async dragCardOnto(sourceToolName: string, targetToolName: string) {
    await this.toolCard(sourceToolName).dragTo(this.toolCard(targetToolName));
  }

  /** Координаты карточки на холсте (левый верхний угол, в пикселях
   *  страницы) — для проверки, что новые карточки не накладываются друг
   *  на друга (см. тест дефолтной каскадной раскладки). */
  async cardPosition(exactToolName: string): Promise<{ x: number; y: number }> {
    const box = await this.toolCard(exactToolName).boundingBox();
    if (!box) throw new Error(`cardPosition(): карточка "${exactToolName}" не найдена или не отрисована`);
    return { x: box.x, y: box.y };
  }

  /** Текущий отрисованный размер карточки (ширина/высота в пикселях) —
   *  для проверки ручного ресайза (см. resizeCard). */
  async cardSize(exactToolName: string): Promise<{ width: number; height: number }> {
    const box = await this.toolCard(exactToolName).boundingBox();
    if (!box) throw new Error(`cardSize(): карточка "${exactToolName}" не найдена или не отрисована`);
    return { width: box.width, height: box.height };
  }

  /** Ручка ресайза в правом нижнем углу карточки — title из
   *  workbench-content.ts (resizeHandleTitle), как и у ручки перетаскивания
   *  (dragHandleTitle) выше по файлу. */
  resizeHandle(exactToolName: string): Locator {
    return this.toolCard(exactToolName).getByTitle("Drag to resize");
  }

  /** Тянет ручку ресайза на (deltaX, deltaY) пикселей от её текущего
   *  положения. Ручка сделана на обычных mousedown/mousemove/mouseup (см.
   *  комментарий в WorkbenchCanvas.tsx — нужен непрерывный живой
   *  предпросмотр размера, в отличие от перемещения карточки, у которого
   *  единственное событие — drop), поэтому здесь курсор мыши, а не
   *  dragTo(), как у toolCard()/workspaceTabCard() на нативном HTML5 DnD. */
  async resizeCard(exactToolName: string, deltaX: number, deltaY: number) {
    const handle = this.resizeHandle(exactToolName);
    const box = await handle.boundingBox();
    if (!box) throw new Error(`resizeCard(): ручка ресайза "${exactToolName}" не найдена или не отрисована`);
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    // Промежуточный шаг — обработчик реагирует на mousemove, телепорт из
    // точки А сразу в точку Б не обязательно эквивалентен плавному жесту.
    await this.page.mouse.move(startX + deltaX / 2, startY + deltaY / 2);
    await this.page.mouse.move(startX + deltaX, startY + deltaY);
    await this.page.mouse.up();
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

  /** Идемпотентно: кнопка "Share" — это ТОГЛ (см. page.tsx: onClick =>
   *  setShareOpen(v => !v)), а не "открыть". Один и тот же `page` живёт
   *  на весь test.describe.serial-блок (см. шапку файла) — панель,
   *  оставшаяся открытой после ПРЕДЫДУЩЕГО теста (никто её явно не
   *  закрывает — "включение публичной ссылки" заканчивается на отдельном
   *  анонимном контексте, не трогая исходную страницу), это реальный
   *  сценарий, а не гипотетический: именно так тест "выключение..."
   *  однажды поймал TimeoutError на toBeVisible() — его собственный вызов
   *  openSharePanel() кликнул по уже открытой панели и ЗАКРЫЛ её. Та же
   *  ловушка ждала бы и внутри одного теста при двух подряд вызовах
   *  (enablePublicSharingAndGetUrl() -> disablePublicSharing(), оба сами
   *  вызывают openSharePanel()). Проверяем текущую видимость перед
   *  кликом вместо того, чтобы полагаться на заранее известное состояние. */
  async openSharePanel() {
    if (!(await this.sharePanel.isVisible())) {
      await this.shareButton.click();
    }
    await expect(this.sharePanel).toBeVisible();
  }

  /** Включает публичную ссылку (если ещё выключена) и возвращает её
   *  текст — напрямую из панели, а не через буфер обмена: доступ к
   *  системному clipboard в headless-CI не всегда настроен, а текст в
   *  панели — тот же самый URL, что кладёт себе в буфер CopyButton. */
  async enablePublicSharingAndGetUrl(): Promise<string> {
    await this.openSharePanel();
    if (await this.sharePublicToggle.getAttribute("aria-checked") !== "true") {
      await this.sharePublicToggle.click();
    }
    await expect(this.shareUrlText).toBeVisible();
    const url = await this.shareUrlText.textContent();
    if (!url) throw new Error("enablePublicSharingAndGetUrl(): ссылка не отобразилась в панели");
    return url.trim();
  }

  async disablePublicSharing() {
    await this.openSharePanel();
    if (await this.sharePublicToggle.getAttribute("aria-checked") === "true") {
      await this.sharePublicToggle.click();
    }
  }
}
