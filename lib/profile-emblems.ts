// ═══════════════════════════════════════════════════════
// Пресеты эмблем аватарки
// ═══════════════════════════════════════════════════════
// Тот же принцип, что у THEME_COLORS (components/ThemeProvider.tsx) и
// BANNER_GRADIENTS (lib/profile-banners.ts) — готовый выбор из
// заранее подготовленных пресетов, без загрузки картинок пользователем
// (в проекте нет storage под пользовательские файлы, и это осознанное
// решение — самовыражение через выбор, а не аплоад). Отличие только в
// том, что каждый пресет здесь — не CSS-значение, а картинка: набор
// сгенерирован один раз (Nano Banana 2) и лежит статикой в
// /public/avatars/emblems/, как обычный ассет сайта, а не как
// пользовательский контент.
//
// Эмблема — необязательный слой ПОВЕРХ цвета аватарки (THEME_COLORS),
// не замена ему: у кого не выбрана эмблема, аватарка выглядит ровно
// так же, как раньше (цветной кружок с инициалом) — см.
// components/profile/AvatarGlyph.tsx, который и решает, что показать.
//
// Стиль каждой картинки, зафиксированный в промте для генерации
// (см. переданный пользователю файл с промтами): плоская
// однотонная (#F8F8FB) векторная пиктограмма без фона (прозрачный
// PNG), простой узнаваемый силуэт — специально так, чтобы одна и та
// же картинка одинаково хорошо читалась на любом из 10 цветов
// THEME_COLORS, а не только на одном конкретном фоне.
//
// Часть эмблем может быть ещё не сгенерирована — AvatarGlyph сам
// откатывается на инициалы, если картинка по какой-то причине не
// загрузилась (например файла ещё нет в /public), так что пресеты
// можно спокойно перечислить здесь заранее, до того как все PNG
// реально появятся в репозитории.

export interface AvatarEmblem {
  id:      string;
  label:   string;
  labelRu: string;
  src:     string;
}

export const AVATAR_EMBLEMS: AvatarEmblem[] = [
  { id: "bug",          label: "Bug",          labelRu: "Баг",         src: "/avatars/emblems/bug.png" },
  { id: "terminal",     label: "Terminal",     labelRu: "Терминал",    src: "/avatars/emblems/terminal.png" },
  { id: "wrench",       label: "Wrench",       labelRu: "Гаечный ключ", src: "/avatars/emblems/wrench.png" },
  { id: "shield",       label: "Shield",       labelRu: "Щит",         src: "/avatars/emblems/shield.png" },
  { id: "magnifier",    label: "Magnifier",    labelRu: "Лупа",        src: "/avatars/emblems/magnifier.png" },
  { id: "flask",        label: "Flask",        labelRu: "Колба",       src: "/avatars/emblems/flask.png" },
  { id: "gear",         label: "Gear",         labelRu: "Шестерня",    src: "/avatars/emblems/gear.png" },
  { id: "lightning",    label: "Lightning",    labelRu: "Молния",      src: "/avatars/emblems/lightning.png" },
  { id: "keyboard-key", label: "Keyboard key", labelRu: "Клавиша",     src: "/avatars/emblems/keyboard-key.png" },
  { id: "rocket",       label: "Rocket",       labelRu: "Ракета",      src: "/avatars/emblems/rocket.png" },
  { id: "database",     label: "Database",     labelRu: "База данных", src: "/avatars/emblems/database.png" },
  { id: "chip",         label: "Chip",         labelRu: "Микрочип",    src: "/avatars/emblems/chip.png" },
  { id: "flame",        label: "Flame",        labelRu: "Огонь",       src: "/avatars/emblems/flame.png" },
  { id: "owl",          label: "Owl",          labelRu: "Сова",        src: "/avatars/emblems/owl.png" },
  { id: "ghost",        label: "Ghost",        labelRu: "Призрак",     src: "/avatars/emblems/ghost.png" },
  { id: "satellite",    label: "Satellite",    labelRu: "Спутник",     src: "/avatars/emblems/satellite.png" },
];

export function getAvatarEmblem(id: string | null | undefined): AvatarEmblem | null {
  if (!id) return null;
  return AVATAR_EMBLEMS.find((e) => e.id === id) ?? null;
}
