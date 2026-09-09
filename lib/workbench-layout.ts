// ═══════════════════════════════════════════════════════
// Геометрия свободного холста Workbench
// ═══════════════════════════════════════════════════════
// Общие константы и чистые функции позиционирования — используются и
// хуком useWorkbenches (чтобы посчитать позицию для только что
// добавленного инструмента), и самим WorkbenchCanvas (чтобы ограничить
// перетаскивание границами контейнера). Вынесены в отдельный файл, а
// не в один из двух компонентов, чтобы не тянуть "use client" туда,
// где он не нужен, и чтобы формула позиционирования жила в одном месте.

export interface ToolPosition {
  x: number;
  y: number;
}

// Фиксированная ширина карточки в режиме холста. Раньше сетка сама
// распределяла ширину по колонкам — на свободном холсте карточка сама
// себе хозяин, но ширина всё равно фиксирована: инструменты внутри
// (поля, textarea, canvas у Contrast Checker и т.д.) рассчитаны на
// конкретную ширину, и резиновая карточка на холсте ломала бы их вёрстку.
export const CANVAS_CARD_WIDTH = 340;

// Дефолтная раскладка для новых инструментов — аккуратная сетка 3
// колонки, а не хаос: свобода начинается с того, что пользователь САМ
// решает подвинуть карточку, а не с того, что она рождается в
// случайном месте.
const CASCADE_COLS = 3;
const CASCADE_COL_GAP = CANVAS_CARD_WIDTH + 32;
const CASCADE_ROW_GAP = 260;
const CASCADE_ORIGIN = 20;

export function defaultToolPosition(existingCount: number): ToolPosition {
  const col = existingCount % CASCADE_COLS;
  const row = Math.floor(existingCount / CASCADE_COLS);
  return { x: CASCADE_ORIGIN + col * CASCADE_COL_GAP, y: CASCADE_ORIGIN + row * CASCADE_ROW_GAP };
}

// Ограничивает позицию после драга: не даём карточке уйти за левый/
// верхний край (в минус) или вправо за пределы контейнера. Вниз расти
// можно свободно — контейнер сам подстраивает высоту под самую нижнюю
// карточку (см. WorkbenchCanvas).
export function clampToolPosition(x: number, y: number, containerWidth: number): ToolPosition {
  const maxX = Math.max(0, containerWidth - CANVAS_CARD_WIDTH);
  return { x: Math.min(Math.max(0, x), maxX), y: Math.max(0, y) };
}
