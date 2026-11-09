"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { computeWindow, judgeDomNodes, scrollTopAfterPrepend, scrollTopFor } from "@/lib/messenger/virtual-list";
import { Field, NumberField, Panel, Stat, inputClass } from "./messenger/ui";

export function VirtualListCalculatorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [count, setCount] = useState("10000");
  const [h, setH] = useState("60");
  const [vp, setVp] = useState("600");
  const [over, setOver] = useState("5");
  const [top, setTop] = useState("3000");
  const [jump, setJump] = useState("100");
  const [align, setAlign] = useState<"start" | "center" | "end">("center");
  const [added, setAdded] = useState("50");
  const [observed, setObserved] = useState("");

  const input = { count: Number(count), itemHeight: Number(h), viewportHeight: Number(vp), overscan: Math.max(0, Math.floor(Number(over))), scrollTop: Number(top) };
  const valid = input.count >= 0 && input.itemHeight > 0 && input.viewportHeight > 0 && Number.isFinite(input.scrollTop) && Number.isFinite(input.overscan);
  const r = useMemo(() => (valid ? computeWindow(input) : null), [valid, input.count, input.itemHeight, input.viewportHeight, input.overscan, input.scrollTop]); // eslint-disable-line react-hooks/exhaustive-deps
  const verdict = r && observed !== "" ? judgeDomNodes(Number(observed), r.renderedCount, input.count) : null;
  const verdictText: Record<string, { en: string; ru: string }> = {
    ok: { en: "Matches the expected window.", ru: "Совпадает с ожидаемым окном." },
    "not-virtualized": { en: "Every row is in the DOM: the list is not virtualized.", ru: "В DOM все строки: список не виртуализирован." },
    "too-many": { en: "Far more rows than expected: the overscan is too large or old rows are not removed.", ru: "Строк намного больше ожидаемого: слишком большой overscan или старые строки не удаляются." },
    "too-few": { en: "Fewer rows than the window needs: blank gaps are likely while scrolling.", ru: "Строк меньше, чем нужно окну: при прокрутке возможны пустые провалы." },
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <Panel cols="sm:grid-cols-3">
        <NumberField id="vl-count" label={isRu ? "Сообщений в списке" : "Messages in the list"} value={count} onChange={setCount} min={0} />
        <NumberField id="vl-height" label={isRu ? "Высота строки, px" : "Row height, px"} value={h} onChange={setH} min={1} />
        <NumberField id="vl-viewport" label={isRu ? "Высота окна, px" : "Viewport height, px"} value={vp} onChange={setVp} min={1} />
        <NumberField id="vl-overscan" label={isRu ? "Overscan, строк с каждой стороны" : "Overscan, rows each side"} value={over} onChange={setOver} min={0} />
        <NumberField id="vl-top" label={isRu ? "Позиция прокрутки, px" : "Scroll position, px"} value={top} onChange={setTop} min={0} />
      </Panel>
      {!r ? <p className="text-sm text-text-muted" data-testid="vl-invalid">{isRu ? "Введите положительные высоты и неотрицательные числа." : "Enter positive heights and non-negative numbers."}</p> : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat id="vl-first" label={isRu ? "Первая видимая строка" : "First visible row"} value={r.firstVisible} />
            <Stat id="vl-last" label={isRu ? "Последняя видимая строка" : "Last visible row"} value={r.lastVisible} />
            <Stat id="vl-range" label={isRu ? "Строки в DOM" : "Rows in the DOM"} value={`${r.renderStart}-${r.renderEnd}`} />
            <Stat id="vl-rendered" label={isRu ? "Узлов в DOM" : "DOM nodes"} value={r.renderedCount} />
            <Stat id="vl-total" label={isRu ? "Полная высота, px" : "Total height, px"} value={r.totalHeight} />
            <Stat id="vl-max" label={isRu ? "Максимум прокрутки, px" : "Max scroll, px"} value={r.maxScrollTop} />
          </div>
          <Panel cols="sm:grid-cols-3 items-end">
            <NumberField id="vl-observed" label={isRu ? "Сколько строк реально в DOM" : "Rows actually in the DOM"} value={observed} onChange={setObserved} min={0} hint={isRu ? "Посчитайте в DevTools и сравните." : "Count them in DevTools and compare."} />
            {verdict ? <p className="text-sm sm:col-span-2" data-testid="vl-verdict" data-verdict={verdict}>{isRu ? verdictText[verdict].ru : verdictText[verdict].en}</p> : null}
          </Panel>
          <Panel cols="sm:grid-cols-3 items-end">
            <NumberField id="vl-jump" label={isRu ? "Перейти к строке" : "Jump to row"} value={jump} onChange={setJump} min={0} />
            <Field id="vl-align" label={isRu ? "Выравнивание" : "Alignment"}>
              <select id="vl-align" value={align} onChange={(e) => setAlign(e.target.value as typeof align)} className={inputClass}>
                <option value="start">start</option><option value="center">center</option><option value="end">end</option>
              </select>
            </Field>
            <p className="text-sm" data-testid="vl-jump-result">scrollTop = <span className="font-mono">{Math.round(scrollTopFor(Number(jump), input.itemHeight, input.viewportHeight, align))}</span></p>
          </Panel>
          <Panel cols="sm:grid-cols-3 items-end">
            <NumberField id="vl-added" label={isRu ? "Подгружено строк сверху" : "Rows loaded above"} value={added} onChange={setAdded} min={0} />
            <p className="text-sm sm:col-span-2" data-testid="vl-prepend-result">{isRu ? "Чтобы список не прыгнул, scrollTop должен стать" : "To keep the list from jumping, scrollTop must become"} <span className="font-mono">{Math.round(scrollTopAfterPrepend(input.scrollTop, Number(added), input.itemHeight))}</span></p>
          </Panel>
        </>
      )}
    </div>
  );
}
