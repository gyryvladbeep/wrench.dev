"use client";
import { useRef, useState } from "react";
import { Tool } from "@/lib/types";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { Locale } from "@/lib/i18n/config";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ToolRenderer } from "@/components/tools/ToolRenderer";
import { WORKBENCH_UI } from "@/lib/i18n/workbench-content";
import { CloseIcon } from "@/components/icons/GameIcons";
import { CANVAS_CARD_WIDTH, ToolPosition, clampToolPosition, defaultToolPosition } from "@/lib/workbench-layout";

interface WorkbenchCanvasProps {
  tools: Tool[]; // локализованы; порядок значит z-index (последний — сверху), не расположение
  layout: Record<string, ToolPosition>;
  dict: Dictionary;
  locale: Locale;
  onRemove?: (slug: string) => void;
  onMove?: (slug: string, position: ToolPosition) => void;
  // Публичная read-only страница показывает тот же холст без ручки
  // перетаскивания и кнопки удаления — см. app/[locale]/w/[id]/page.tsx.
  readOnly?: boolean;
  // Нижняя граница высоты холста — по умолчанию небольшой блок (см.
  // CANVAS_MIN_HEIGHT), но редактируемая страница /workbench передаёт
  // высоту вьюпорта за вычетом шапки, чтобы холст занимал всю страницу
  // сразу, даже пустой, а не только когда в нём набралось много карточек.
  minHeight?: number;
  // Рамка + скругления вокруg холста — уместны для холста, зажатого в
  // обычную колонку контента (публичная read-only страница), но не
  // нужны на полностраничном холсте /workbench: там холст ВИЗУАЛЬНО и
  // есть страница (тот же bg-canvas, что и у <body>), рамка вокруг него
  // смотрелась бы как случайная лишняя коробка. По умолчанию true, чтобы
  // не трогать поведение публичной страницы.
  bordered?: boolean;
  // Прямоугольник в левом верхнем углу (в тех же координатах, что и
  // сам холст), который карточкам занимать нельзя — под ним на
  // /workbench плавает панель вкладок/действий, и полностью закрытая ей
  // карточка была бы не видна и недоступна для клика (у панели z-index
  // выше). Холст сам подвигает вниз любую карточку, чья позиция туда
  // попадает — и при обычном рендере, и сразу после драга — так что
  // сама панель может свободно менять размер (больше вкладок, more
  // длинные названия), а карточки не нужно вручную разводить. На
  // публичной странице панели нет — там проп не передаётся.
  avoidTopLeft?: { width: number; height: number };
}

// Высота, которую условно занимает карточка при расчёте общей высоты
// холста — сама карточка гибкая по контенту, но нам нужен ориентир,
// чтобы контейнер не обрезал самую нижнюю карточку. Совпадает с шагом
// каскада CASCADE_ROW_GAP + запас на футер карточки.
const ESTIMATED_CARD_HEIGHT = 420;
const CANVAS_MIN_HEIGHT = 480;

export function WorkbenchCanvas({
  tools, layout, dict, locale, onRemove, onMove, readOnly = false, minHeight, bordered = true, avoidTopLeft,
}: WorkbenchCanvasProps) {
  const t = WORKBENCH_UI[locale];
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedSlug, setDraggedSlug] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Если позиция (своя или дефолтная каскадная) попадает в запретный
  // угол под панелью — сдвигаем карточку прямо под него, сохраняя x.
  // Не трогает СОХРАНЁННЫЕ координаты в layout — это чисто отображение,
  // сработает заново при следующем рендере, если панель станет другого
  // размера.
  function avoidPanel(pos: ToolPosition): ToolPosition {
    if (!avoidTopLeft) return pos;
    if (pos.x < avoidTopLeft.width && pos.y < avoidTopLeft.height) {
      return { x: pos.x, y: avoidTopLeft.height + 16 };
    }
    return pos;
  }

  function positionFor(slug: string, index: number): ToolPosition {
    return avoidPanel(layout[slug] ?? defaultToolPosition(index));
  }

  const containerHeight = Math.max(
    minHeight ?? CANVAS_MIN_HEIGHT,
    ...tools.map((tool, index) => positionFor(tool.slug, index).y + ESTIMATED_CARD_HEIGHT)
  );

  // ═══════════════════════════════════════════════════════
  // Нативный HTML5 drag & drop — тот же выбор, что и раньше в
  // WorkbenchGrid (см. её историю): для десятка карточек на странице
  // полноценная библиотека вроде dnd-kit была бы лишней зависимостью.
  // Разница со старой сеткой — раньше drop менял ПОРЯДОК массива,
  // теперь он пишет АБСОЛЮТНУЮ позицию, посчитанную из курсора.
  // ═══════════════════════════════════════════════════════
  function handleDragStart(e: React.DragEvent<HTMLDivElement>, slug: string) {
    const cardRect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - cardRect.left, y: e.clientY - cardRect.top };
    setDraggedSlug(slug);
    // Firefox требует непустой dataTransfer, иначе drag не начинается.
    e.dataTransfer.setData("text/plain", slug);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleContainerDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (!draggedSlug) return;
    e.preventDefault();
  }

  function handleContainerDrop(e: React.DragEvent<HTMLDivElement>) {
    if (!draggedSlug || !onMove) { setDraggedSlug(null); return; }
    e.preventDefault();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) { setDraggedSlug(null); return; }
    const rawX = e.clientX - containerRect.left - dragOffset.current.x;
    const rawY = e.clientY - containerRect.top - dragOffset.current.y;
    const clamped = clampToolPosition(rawX, rawY, containerRect.width);
    onMove(draggedSlug, avoidPanel(clamped));
    setDraggedSlug(null);
  }

  return (
    <div
      ref={containerRef}
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
      className={`relative w-full overflow-visible bg-canvas ${bordered ? "rounded-xl border border-border" : ""}`}
      style={{
        minHeight: containerHeight,
        // #26262f — тот же border-токен из tailwind.config.ts, что и рамка
        // самого контейнера; в hex, а не через var(--...), потому что
        // border не объявлен как CSS-переменная (в отличие от accent).
        backgroundImage: "radial-gradient(#26262f 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      {tools.map((tool, index) => {
        const pos = positionFor(tool.slug, index);
        return (
          <div
            key={tool.slug}
            draggable={!readOnly}
            onDragStart={(e) => handleDragStart(e, tool.slug)}
            onDragEnd={() => setDraggedSlug(null)}
            className={`absolute flex flex-col rounded-xl border bg-surface shadow-lg transition-opacity ${
              draggedSlug === tool.slug ? "opacity-40" : "border-border"
            }`}
            style={{ left: pos.x, top: pos.y, width: CANVAS_CARD_WIDTH }}
          >
            <div className={`flex items-center gap-2 border-b border-border px-4 py-2.5 ${!readOnly ? "cursor-grab" : ""}`}>
              {!readOnly && (
                <span title={t.dragHandleTitle} className="select-none text-text-disabled">⋮⋮</span>
              )}
              <span className="shrink-0 text-text-muted opacity-70"><CategoryIcon category={tool.category} size={13} /></span>
              <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{tool.name}</h3>
              {!readOnly && onRemove && (
                <button
                  onClick={() => onRemove(tool.slug)}
                  aria-label={t.removeToolAria}
                  title={t.removeToolAria}
                  className="shrink-0 rounded p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-red-400"
                >
                  <CloseIcon size={11} />
                </button>
              )}
            </div>
            <div className="p-4">
              <ToolRenderer slug={tool.slug} tool={tool} dict={dict} locale={locale} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
