import { Locale } from "./config";

/**
 * Тексты для фичи Workbench вынесены сюда, а не в общий Dictionary
 * (dictionary-types.ts / en.ts / ru.ts) — по тому же принципу, что уже
 * применён в SearchModal.tsx: самодостаточный набор строк для одной
 * фичи проще держать рядом с ней, чем править огромный общий словарь
 * (там любая опечатка в одном из трёх файлов ломает сборку сразу
 * везде, потому что TypeScript требует точного совпадения формы).
 */
export interface WorkbenchUIStrings {
  pageTitle: string;
  pageSubtitle: string;
  newWorkspace: string;
  addTool: string;
  emptyTitle: string;
  emptyBody: string;
  browseTools: string;
  rename: string;
  delete: string;
  deleteConfirmTitle: string;
  confirmDelete: string;
  cancel: string;
  limitWorkspacesReached: string;
  limitToolsReached: string;
  upgradeHint: string;
  upgradeToPro: string;
  searchPlaceholder: string;
  noResults: string;
  removeToolAria: string;
  dragHandleTitle: string;
  toolsCountSuffix: string;
  // Шаринг свободного холста — публичная read-only ссылка (см.
  // app/[locale]/w/[id] + PublicWorkbenchView.tsx).
  shareButton: string;
  sharePanelTitle: string;
  sharePublicLabel: string;
  sharePublicHint: string;
  publicNotFoundTitle: string;
  publicNotFoundBody: string;
  publicBadge: string;
  publicCta: string;
  publicEmptyBody: string;
}

export const WORKBENCH_UI: Record<Locale, WorkbenchUIStrings> = {
  en: {
    pageTitle: "My Workbench",
    pageSubtitle:
      "Pin the tools you use most, arrange them anywhere on the board, and switch between named setups — your own toolbox, on one page.",
    newWorkspace: "+ New workspace",
    addTool: "+ Add tool",
    emptyTitle: "This workspace is empty",
    emptyBody: "Add the tools you use most — once you have a few, drag them anywhere on the board.",
    browseTools: "+ Add tool",
    rename: "Rename",
    delete: "Delete",
    deleteConfirmTitle: "Delete this workspace? This can't be undone.",
    confirmDelete: "Yes, delete",
    cancel: "Cancel",
    limitWorkspacesReached: "You've reached the {max}-workspace limit for your plan.",
    limitToolsReached: "You've reached the {max}-tool limit for this workspace.",
    upgradeHint: "Upgrade to Pro for more.",
    upgradeToPro: "Upgrade to Pro",
    searchPlaceholder: "Search tools…",
    noResults: "No tools match your search.",
    removeToolAria: "Remove from workbench",
    dragHandleTitle: "Drag to move",
    toolsCountSuffix: "tools",
    shareButton: "Share",
    sharePanelTitle: "Share this workbench",
    sharePublicLabel: "Public link",
    sharePublicHint: "Anyone with the link gets a read-only view of this board.",
    publicNotFoundTitle: "This workbench isn't available",
    publicNotFoundBody: "The link may be wrong, or the owner has turned off sharing.",
    publicBadge: "Read-only",
    publicCta: "Go to Wrench-Branch",
    publicEmptyBody: "This workbench doesn't have any tools pinned yet.",
  },
  ru: {
    pageTitle: "Мой рабочий стол",
    pageSubtitle:
      "Закрепи инструменты, которыми пользуешься чаще всего, расположи их как удобно на холсте и переключайся между именованными наборами — свой тулбокс на одной странице.",
    newWorkspace: "+ Новое пространство",
    addTool: "+ Добавить инструмент",
    emptyTitle: "Это пространство пустое",
    emptyBody: "Добавь инструменты, которыми пользуешься чаще всего — когда их станет несколько, карточки можно перетаскивать куда угодно на холсте.",
    browseTools: "+ Добавить инструмент",
    rename: "Переименовать",
    delete: "Удалить",
    deleteConfirmTitle: "Удалить это пространство? Отменить будет нельзя.",
    confirmDelete: "Да, удалить",
    cancel: "Отмена",
    limitWorkspacesReached: "Достигнут лимит пространств для твоего тарифа ({max}).",
    limitToolsReached: "Достигнут лимит инструментов для этого пространства ({max}).",
    upgradeHint: "Перейди на Pro, чтобы снять ограничение.",
    upgradeToPro: "Перейти на Pro",
    searchPlaceholder: "Поиск инструментов…",
    noResults: "Ничего не найдено.",
    removeToolAria: "Убрать с рабочего стола",
    dragHandleTitle: "Перетащите, чтобы переместить",
    toolsCountSuffix: "инструментов",
    shareButton: "Поделиться",
    sharePanelTitle: "Поделиться рабочим столом",
    sharePublicLabel: "Публичная ссылка",
    sharePublicHint: "Любой, у кого есть ссылка, увидит этот холст в режиме просмотра.",
    publicNotFoundTitle: "Этот рабочий стол недоступен",
    publicNotFoundBody: "Возможно, ссылка неверна, либо автор выключил доступ по ссылке.",
    publicBadge: "Только просмотр",
    publicCta: "Перейти на Wrench-Branch",
    publicEmptyBody: "На этом рабочем столе пока нет ни одного инструмента.",
  },
};

export function formatWorkbenchString(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.split(`{${key}}`).join(String(value)),
    template
  );
}
