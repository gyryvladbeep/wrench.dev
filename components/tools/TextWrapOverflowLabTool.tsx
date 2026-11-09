"use client";
import { CSSProperties, useLayoutEffect, useRef, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { CopyButton } from "@/components/CopyButton";
import { NumberField, Field, Panel, areaClass } from "./messenger/ui";

interface Variant { id: string; css: string; style: CSSProperties }

const VARIANTS: Variant[] = [
  { id: "normal", css: "overflow-wrap: normal;", style: { overflowWrap: "normal" } },
  { id: "break-word", css: "overflow-wrap: break-word;", style: { overflowWrap: "break-word" } },
  { id: "anywhere", css: "overflow-wrap: anywhere;", style: { overflowWrap: "anywhere" } },
  { id: "break-all", css: "word-break: break-all;", style: { wordBreak: "break-all" } },
  { id: "hyphens-auto", css: "hyphens: auto;", style: { hyphens: "auto" } },
];

const SAMPLE = "See https://example.com/a/very/long/path?query=1234567890abcdef\n\nSupercalifragilisticexpialidocious_and_more_without_any_spaces_at_all";

export function TextWrapOverflowLabTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [text, setText] = useState(SAMPLE);
  const [width, setWidth] = useState("280");
  const [flex, setFlex] = useState(false);
  const [overflow, setOverflow] = useState<Record<string, boolean>>({});
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const w = Math.max(40, Number(width) || 280);

  useLayoutEffect(() => {
    const next: Record<string, boolean> = {};
    for (const v of VARIANTS) {
      const el = refs.current[v.id];
      if (el) next[v.id] = Math.max(el.scrollWidth, el.getBoundingClientRect().width) > w + 1;
    }
    setOverflow(next);
  }, [text, w, flex]);

  return (
    <div className="space-y-5 max-w-4xl">
      <Field id="tw-text" label={isRu ? "Текст сообщения" : "Message text"}>
        <textarea id="tw-text" value={text} onChange={(e) => setText(e.target.value)} className={areaClass} spellCheck={false} />
      </Field>
      <Panel cols="sm:grid-cols-2 items-end">
        <NumberField id="tw-width" label={isRu ? "Ширина пузыря, px" : "Bubble width, px"} value={width} onChange={setWidth} min={40} />
        <label className="flex items-center gap-2 text-sm text-text-secondary"><input id="tw-flex" type="checkbox" checked={flex} onChange={(e) => setFlex(e.target.checked)} /> {isRu ? "Пузырь - flex-элемент без min-width: 0" : "The bubble is a flex item without min-width: 0"}</label>
      </Panel>
      <ul className="space-y-4" data-testid="tw-variants">
        {VARIANTS.map((v) => (
          <li key={v.id} data-testid={`tw-variant-${v.id}`} data-overflow={String(Boolean(overflow[v.id]))} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <code className="font-mono text-text-primary">{v.css}</code>
              <span className="flex items-center gap-2">
                <span className={overflow[v.id] ? "text-red-300" : "text-emerald-400"}>{overflow[v.id] ? (isRu ? "выходит за пузырь" : "overflows") : (isRu ? "помещается" : "fits")}</span>
                <CopyButton value={v.css} iconOnly />
              </span>
            </div>
            <div style={{ width: w, display: flex ? "flex" : "block" }} className="rounded-lg border border-dashed border-border">
              <div
                ref={(el) => { refs.current[v.id] = el; }}
                lang="en"
                style={{ ...v.style, boxSizing: "border-box", padding: 8, fontSize: 14, lineHeight: 1.4, whiteSpace: "pre-wrap", background: "rgba(124,143,214,0.15)", borderRadius: 8 }}
              >
                {text}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-text-muted">{isRu ? "Замер идёт в вашем браузере на настоящей вёрстке. Внутри flex-контейнера overflow-wrap: break-word не помогает, потому что не меняет минимальную ширину элемента, а anywhere меняет." : "The measurement runs in your browser on real layout. Inside a flex container overflow-wrap: break-word does not help because it does not change the item's minimum width, while anywhere does."}</p>
    </div>
  );
}
