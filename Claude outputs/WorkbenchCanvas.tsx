"use client";
import { useRef, useState } from "react";
import { Tool } from "@/lib/types";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { Locale } from "@/lib/i18n/config";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ToolRenderer } from "@/components/tools/ToolRenderer";
import { WORKBENCH_UI } from "@/lib/i18n/workbench-content";
import { CloseIcon } from "@/components/icons/GameIcons";
import {
  CANVAS_CARD_WIDTH, ToolPosition, clampToolPosition, clampToolSize, defaultToolPosition,
} from "@/lib/workbench-layout";

interface WorkbenchCanvasProps {
  tools: Tool[]; // локализованы; порядок значит z-index (последний — сверху), не расположение
  layout: Record<string, ToolPosition>;
  dict: Dictionary;
  locale: Locale;
  onRemove?: (slug: string) => void;
  onMove?: (slug: string, position: ToolPosition) => void;
  // Ручной ресайз карточки (ручка в правом нижнем углу) — см. её
  // обработчики ниже. Persist делает вызывающая сторона (useWorkbenches),
  // тут только геометрия и локальный live-предпросмотр во время тяги.
  onResize?: (slug: string, size: { width: number; height: number }) => void;
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
// холста, ПОКА у неё нет собственной сохранённой высоты (ресайз ещё не
// трогали) — сама карточка гибкая по контенту, но нам нужен ориентир,
// чтобы контейнер не обрезал самую нижнюю карточку. Совпадает с шагом
// каскада CASCADE_ROW_GAP + запас на футер карточки. Если высота задана
// вручную — используется она, а не эта оценка (см. containerHeight).
const ESTIMATED_CARD_HEIGHT = 420;
const CANVAS_MIN_HEIGHT = 480;

// Простая diagonal-иконка ручки ресайза — три убывающие по длине
// диагональные чёрточки, как в большинстве нативных UI (Figma, macOS
// Finder). Без эмодзи и без иконочного шрифта, тем же приёмом, что и
// CopyIcon/CheckIcon в CopyButton.tsx — маленький инлайновый SVG.
function ResizeHandleIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function WorkbenchCanvas({
  tools, layout, dict, locale, onRemove, onMove, onResize,
  readOnly = false, minHeight, bordered = true, avoidTopLeft,
}: WorkbenchCanvasProps) {
  const t = WORKBENCH_UI[locale];
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [draggedSlug, setDraggedSlug] = useState<string | null>(null);
  // Синхронное зеркало draggedSlug для функциональных проверок в обработчиках
  // ниже (dragover/drop) — тот же приём, что signingOutRef в auth-context.tsx:
  // React-состояние обновляется асинхронно (флаш может отстать от следующего
  // нативного события в быстрой серии drag), а ref — всегда актуален в
  // момент чтения. draggedSlug (state) остаётся только для визуального
  // opacity-40 у перетаскиваемой карточки — там лаг на один кадр не виден.
  const draggedSlugRef = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragCardWidth = useRef(CANVAS_CARD_WIDTH);

  // Живой предпросмотр во время ресайза — width/height не пишем в
  // Supabase на каждый пиксель движения мыши (см. handleResizeMove), а
  // только один раз на mouseup (handleResizeEnd), тем же приёмом, что
  // move уже коммитит позицию только по drop, а не на каждый dragover.
  const [liveResize, setLiveResize] = useState<{ slug: string; width: number; height: number } | null>(null);
  const resizeState = useRef<{ slug: string; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);

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

  // Эффективный размер карточки прямо сейчас: во время её собственного
  // ресайза — live-значение из состояния; иначе — то, что сохранено
  // (или дефолты: CANVAS_CARD_WIDTH и "по содержимому" для высоты).
  function sizeFor(slug: string, pos: ToolPosition): { width: number; height: number | undefined } {
    if (liveResize && liveResize.slug === slug) return { width: liveResize.width, height: liveResize.height };
    return { width: pos.width ?? CANVAS_CARD_WIDTH, height: pos.height };
  }

  const containerHeight = Math.max(
    minHeight ?? CANVAS_MIN_HEIGHT,
    ...tools.map((tool, index) => {
      const pos = positionFor(tool.slug, index);
      return pos.y + (pos.height ?? ESTIMATED_CARD_HEIGHT);
    })
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
    dragCardWidth.current = cardRect.width;
    draggedSlugRef.current = slug;
    setDraggedSlug(slug);
    // Firefox требует непустой dataTransfer, иначе drag не начинается.
    e.dataTransfer.setData("text/plain", slug);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleContainerDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (!draggedSlugRef.current) return;
    e.preventDefault();
  }

  function handleContainerDrop(e: React.DragEvent<HTMLDivElement>) {
    const slug = draggedSlugRef.current;
    draggedSlugRef.current = null;
    if (!slug || !onMove) { setDraggedSlug(null); return; }
    e.preventDefault();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) { setDraggedSlug(null); return; }
    const rawX = e.clientX - containerRect.left - dragOffset.current.x;
    const rawY = e.clientY - containerRect.top - dragOffset.current.y;
    const clamped = clampToolPosition(rawX, rawY, containerRect.width, dragCardWidth.current);
    onMove(slug, avoidPanel(clamped));
    setDraggedSlug(null);
  }

  // ═══════════════════════════════════════════════════════
  // Ресайз — обычные mousemove/mouseup на window, а не HTML5 drag API:
  // нужен непрерывный живой предпросмотр размера по ходу движения
  // мыши, а не единственное событие drop в конце, как у перемещения.
  // draggable={false} на самой ручке (см. рендер ниже) не даёт клику по
  // ней случайно запустить ПЕРЕМЕЩЕНИЕ карточки вместо ресайза — card
  // draggable="true" иначе перехватил бы жест.
  // ═══════════════════════════════════════════════════════
  function handleResizeStart(e: React.MouseEvent, slug: string) {
    e.preventDefault();
    e.stopPropagation();
    const cardEl = cardRefs.current.get(slug);
    if (!cardEl) return;
    const rect = cardEl.getBoundingClientRect();
    resizeState.current = { slug, startX: e.clientX, startY: e.clientY, startWidth: rect.width, startHeight: rect.height };
    setLiveResize({ slug, width: rect.width, height: rect.height });
    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", handleResizeEnd);
  }

  function handleResizeMove(e: MouseEvent) {
    const state = resizeState.current;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!state || !containerRect) return;
    const cardEl = cardRefs.current.get(state.slug);
    const cardX = cardEl ? cardEl.getBoundingClientRect().left - containerRect.left : 0;
    const rawWidth = state.startWidth + (e.clientX - state.startX);
    const rawHeight = state.startHeight + (e.clientY - state.startY);
    const clamped = clampToolSize(rawWidth, rawHeight, cardX, containerRect.width);
    setLiveResize({ slug: state.slug, ...clamped });
  }

  function handleResizeEnd() {
    const state = resizeState.current;
    window.removeEventListener("mousemove", handleResizeMove);
    window.removeEventListener("mouseup", handleResizeEnd);
    resizeState.current = null;
    if (state && onResize) {
      setLiveResize((current) => {
        if (current && current.slug === state.slug) onResize(state.slug, { width: current.width, height: current.height });
        return null;
      });
    } else {
      setLiveResize(null);
    }
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
        const size = sizeFor(tool.slug, pos);
        return (
          <div
            key={tool.slug}
            ref={(el) => { if (el) cardRefs.current.set(tool.slug, el); else cardRefs.current.delete(tool.slug); }}
            draggable={!readOnly}
            onDragStart={(e) => handleDragStart(e, tool.slug)}
            onDragEnd={() => { draggedSlugRef.current = null; setDraggedSlug(null); }}
            className={`absolute flex flex-col rounded-xl border bg-surface shadow-lg transition-opacity ${
              draggedSlug === tool.slug ? "opacity-40" : "border-border"
            }`}
            style={{ left: pos.x, top: pos.y, width: size.width, height: size.height }}
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
            <div className={size.height ? "flex-1 overflow-y-auto p-4" : "p-4"}>
              <ToolRenderer slug={tool.slug} tool={tool} dict={dict} locale={locale} />
            </div>

            {!readOnly && onResize && (
              <div
                onMouseDown={(e) => handleResizeStart(e, tool.slug)}
                draggable={false}
                title={t.resizeHandleTitle}
                className="absolute bottom-0 right-0 flex h-4 w-4 cursor-nwse-resize items-end justify-end p-0.5 text-text-disabled transition-colors hover:text-text-muted"
              >
                <ResizeHandleIcon />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
