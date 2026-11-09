export interface VirtualListInput {
  count: number;
  itemHeight: number;
  viewportHeight: number;
  overscan: number;
  scrollTop: number;
}

export interface VirtualListResult {
  totalHeight: number;
  maxScrollTop: number;
  firstVisible: number;
  lastVisible: number;
  visibleCount: number;
  renderStart: number;
  renderEnd: number;
  renderedCount: number;
  scrollPercent: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Какие элементы должны быть в DOM при фиксированной высоте строки. Индексы с нуля, конец включительно. */
export function computeWindow(i: VirtualListInput): VirtualListResult {
  const count = Math.max(0, Math.floor(i.count));
  const total = count * i.itemHeight;
  const maxScroll = Math.max(0, total - i.viewportHeight);
  const top = clamp(i.scrollTop, 0, maxScroll);
  if (count === 0 || i.itemHeight <= 0) {
    return { totalHeight: 0, maxScrollTop: 0, firstVisible: 0, lastVisible: -1, visibleCount: 0, renderStart: 0, renderEnd: -1, renderedCount: 0, scrollPercent: 0 };
  }
  const first = clamp(Math.floor(top / i.itemHeight), 0, count - 1);
  const last = clamp(Math.ceil((top + i.viewportHeight) / i.itemHeight) - 1, first, count - 1);
  const start = Math.max(0, first - i.overscan);
  const end = Math.min(count - 1, last + i.overscan);
  return {
    totalHeight: total, maxScrollTop: maxScroll, firstVisible: first, lastVisible: last, visibleCount: last - first + 1,
    renderStart: start, renderEnd: end, renderedCount: end - start + 1, scrollPercent: maxScroll === 0 ? 0 : Math.round((top / maxScroll) * 1000) / 10,
  };
}

/** scrollTop, при котором элемент index оказывается в начале, по центру или в конце окна. */
export function scrollTopFor(index: number, itemHeight: number, viewportHeight: number, align: "start" | "center" | "end"): number {
  const itemTop = index * itemHeight;
  if (align === "start") return itemTop;
  if (align === "end") return itemTop + itemHeight - viewportHeight;
  return itemTop - (viewportHeight - itemHeight) / 2;
}

/** После подгрузки истории сверху scrollTop должен вырасти на высоту добавленных элементов, иначе список "прыгнет". */
export function scrollTopAfterPrepend(scrollTop: number, added: number, itemHeight: number): number {
  return scrollTop + added * itemHeight;
}

export type VirtualVerdict = "ok" | "not-virtualized" | "too-many" | "too-few";

/** Сравнивает число реально отрисованных узлов с ожидаемым. */
export function judgeDomNodes(observed: number, expected: number, count: number): VirtualVerdict {
  if (expected <= 0) return "ok";
  if (observed >= count && count > expected * 2) return "not-virtualized";
  if (observed > expected * 1.5) return "too-many";
  if (observed < expected * 0.7) return "too-few";
  return "ok";
}
