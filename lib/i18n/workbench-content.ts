import { Locale } from "./config";

/**
 * Тексты для фичи Workbench вынесены сюда, а не в общий Dictionary
 * (dictionary-types.ts / en.ts / ru.ts) — по тому же принципу, что уже
 * применён в SearchModal.tsx: самодостаточный набор строк для одной
 * фичи проще держать рядом с ней, чем править огромный общий словарь
 * (там любая опечатка в одном из трёх файлов ломает сборку сразу
 * везде, потому что TypeScript требует точного совпадения формы).
 * Публичная галерея (/workbench/gallery) и клонирование — часть той же
 * фичи (используют ту же публичную ссылку/is_public, что и шаринг),
 * поэтому их строки живут в этом же файле, а не в третьем отдельном.
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
  resizeHandleTitle: string;
  toolsCountSuffix: string;
  // Шаринг свободного холста — публичная read-only ссылка (см.
  // app/[locale]/w/[id] + PublicWorkbenchView.tsx).
  shareButton: string;
  sharePanelTitle: string;
  sharePublicLabel: string;
  sharePublicHint: string;
  shareDescriptionLabel: string;
  shareDescriptionPlaceholder: string;
  publicNotFoundTitle: string;
  publicNotFoundBody: string;
  publicBadge: string;
  publicCta: string;
  publicEmptyBody: string;
  // Ссылка из /workbench в галерею.
  galleryNavLink: string;
  // Сама галерея (/workbench/gallery).
  galleryPageTitle: string;
  galleryPageSubtitle: string;
  gallerySortPopular: string;
  gallerySortNewest: string;
  galleryEmpty: string;
  galleryToolsCount: string;
  galleryClonesCount: string;
  galleryLoadMore: string;
  galleryViewButton: string;
  galleryByLabel: string;
  galleryAnonymousOwner: string;
  // Клонирование чужого публичного workbench себе — с карточки в
  // галерее и с самой публичной страницы (/w/[id]).
  cloneButton: string;
  cloneButtonSignedOut: string;
  cloneSuccessTitle: string;
  cloneSuccessBody: string;
  cloneSuccessCta: string;
  cloneTruncatedNotice: string;
  cloneLimitReached: string;
  cloneError: string;
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
    resizeHandleTitle: "Drag to resize",
    toolsCountSuffix: "tools",
    shareButton: "Share",
    sharePanelTitle: "Share this workbench",
    sharePublicLabel: "Public link",
    sharePublicHint: "Anyone with the link gets a read-only view of this board — and it becomes visible in the public gallery.",
    shareDescriptionLabel: "Description (optional)",
    shareDescriptionPlaceholder: "What's this workbench for?",
    publicNotFoundTitle: "This workbench isn't available",
    publicNotFoundBody: "The link may be wrong, or the owner has turned off sharing.",
    publicBadge: "Read-only",
    publicCta: "Go to Wrench-Branch",
    publicEmptyBody: "This workbench doesn't have any tools pinned yet.",
    galleryNavLink: "Browse public workbenches",
    galleryPageTitle: "Public workbenches",
    galleryPageSubtitle: "Workbenches other people have shared publicly — browse a setup and clone it into your own account to use as a starting point.",
    gallerySortPopular: "Most cloned",
    gallerySortNewest: "Newest",
    galleryEmpty: "No public workbenches yet — be the first to share one from your Workbench page.",
    galleryToolsCount: "{n} tools",
    galleryClonesCount: "{n} clones",
    galleryLoadMore: "Load more",
    galleryViewButton: "View",
    galleryByLabel: "by",
    galleryAnonymousOwner: "a Wrench-Branch user",
    cloneButton: "Clone to my Workbench",
    cloneButtonSignedOut: "Sign in to clone",
    cloneSuccessTitle: "Cloned!",
    cloneSuccessBody: "It's now in your Workbench as a new workspace.",
    cloneSuccessCta: "Open my Workbench",
    cloneTruncatedNotice: "Only the first {max} tools were copied — that's the limit for your plan.",
    cloneLimitReached: "You're at your workspace limit — delete one or upgrade to Pro to clone this.",
    cloneError: "Couldn't clone this workbench — try again in a moment.",
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
    resizeHandleTitle: "Потяните, чтобы изменить размер",
    toolsCountSuffix: "инструментов",
    shareButton: "Поделиться",
    sharePanelTitle: "Поделиться рабочим столом",
    sharePublicLabel: "Публичная ссылка",
    sharePublicHint: "Любой, у кого есть ссылка, увидит этот холст в режиме просмотра — а сам стол появится в публичной галерее.",
    shareDescriptionLabel: "Описание (необязательно)",
    shareDescriptionPlaceholder: "Для чего этот набор инструментов?",
    publicNotFoundTitle: "Этот рабочий стол недоступен",
    publicNotFoundBody: "Возможно, ссылка неверна, либо автор выключил доступ по ссылке.",
    publicBadge: "Только просмотр",
    publicCta: "Перейти на Wrench-Branch",
    publicEmptyBody: "На этом рабочем столе пока нет ни одного инструмента.",
    galleryNavLink: "Смотреть публичные рабочие столы",
    galleryPageTitle: "Публичные рабочие столы",
    galleryPageSubtitle: "Рабочие столы, которыми поделились другие пользователи — посмотри готовый набор и склонируй его себе как отправную точку.",
    gallerySortPopular: "Популярные",
    gallerySortNewest: "Новые",
    galleryEmpty: "Пока нет ни одного публичного рабочего стола — стань первым, поделившись своим со страницы Рабочий стол.",
    galleryToolsCount: "{n} инструментов",
    galleryClonesCount: "{n} клонов",
    galleryLoadMore: "Показать ещё",
    galleryViewButton: "Смотреть",
    galleryByLabel: "автор:",
    galleryAnonymousOwner: "пользователь Wrench-Branch",
    cloneButton: "Клонировать себе",
    cloneButtonSignedOut: "Войди, чтобы клонировать",
    cloneSuccessTitle: "Склонировано!",
    cloneSuccessBody: "Теперь это новое пространство на твоём рабочем столе.",
    cloneSuccessCta: "Открыть мой рабочий стол",
    cloneTruncatedNotice: "Скопированы только первые {max} инструментов — это лимит твоего тарифа.",
    cloneLimitReached: "Достигнут лимит пространств — удали одно или перейди на Pro, чтобы клонировать этот стол.",
    cloneError: "Не удалось склонировать этот рабочий стол — попробуй ещё раз через момент.",
  },
};

export function formatWorkbenchString(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.split(`{${key}}`).join(String(value)),
    template
  );
}
