"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

type Mode = "css" | "xpath";

interface MatchInfo {
  tag: string;
  attrs: string;
  text: string;
}

const DEFAULT_HTML = `<div class="card">
  <button class="btn btn-primary" id="submit-btn" data-testid="submit">Submit</button>
</div>
<div class="card">
  <button class="btn btn-primary">Cancel</button>
</div>`;

function describeElement(el: Element): MatchInfo {
  const tag = el.tagName.toLowerCase();
  const attrParts: string[] = [];
  if (el.id) attrParts.push(`id="${el.id}"`);
  const cls = el.getAttribute("class");
  if (cls) attrParts.push(`class="${cls}"`);
  for (const attr of ["type", "name", "href", "src", "role", "data-testid", "aria-label", "placeholder"]) {
    const v = el.getAttribute(attr);
    if (v) attrParts.push(`${attr}="${v}"`);
  }
  const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60);
  return { tag, attrs: attrParts.join(" "), text };
}

function runCss(doc: Document, selector: string): Element[] {
  return Array.from(doc.querySelectorAll(selector));
}

function runXPath(doc: Document, expr: string): Element[] {
  const result = doc.evaluate(expr, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  const out: Element[] = [];
  for (let i = 0; i < result.snapshotLength; i++) {
    const node = result.snapshotItem(i);
    if (node && node.nodeType === Node.ELEMENT_NODE) out.push(node as Element);
  }
  return out;
}

export function LiveLocatorTesterTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [mode, setMode] = useState<Mode>("css");
  const [selector, setSelector] = useState(".btn-primary");

  const { matches, error, totalElements } = useMemo(() => {
    let doc: Document;
    try {
      doc = new DOMParser().parseFromString(html, "text/html");
    } catch {
      return { matches: [] as Element[], error: isRu ? "Не удалось разобрать HTML" : "Couldn't parse HTML", totalElements: 0 };
    }
    const total = doc.body.querySelectorAll("*").length;
    if (!selector.trim()) return { matches: [] as Element[], error: "", totalElements: total };
    try {
      const found = mode === "css" ? runCss(doc, selector) : runXPath(doc, selector);
      return { matches: found, error: "", totalElements: total };
    } catch (e) {
      return { matches: [] as Element[], error: e instanceof Error ? e.message : "Error", totalElements: total };
    }
  }, [html, mode, selector, isRu]);

  const count = matches.length;
  const isEmpty = count === 0 && !error && selector.trim();
  const isAmbiguous = count > 1;

  return (
    <div className="space-y-4">
      <div>
        <label className="input-label">{isRu ? "HTML-разметка" : "HTML markup"}</label>
        <textarea value={html} onChange={(e) => setHtml(e.target.value)} spellCheck={false} rows={8}
          className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex shrink-0 gap-1 rounded-[10px] border border-border bg-surface p-1">
          {(["css", "xpath"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`rounded-[8px] px-3 py-1.5 text-sm font-medium transition-colors ${mode === m ? "bg-accent text-accent-fg" : "text-text-muted hover:text-text-primary"}`}>
              {m === "css" ? "CSS" : "XPath"}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <input value={selector} onChange={(e) => setSelector(e.target.value)} spellCheck={false}
            placeholder={mode === "css" ? ".btn-primary" : "//button[@id='submit-btn']"}
            className="code-surface w-full rounded-[10px] px-3 py-2 font-mono text-sm text-text-primary outline-none" />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      {!error && selector.trim() && (
        <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
          isEmpty ? "border-red-500/30 bg-red-500/5" : isAmbiguous ? "border-warning/30 bg-warning/5" : "border-green-500/30 bg-green-500/5"
        }`}>
          <span className={`text-lg font-mono font-semibold ${isEmpty ? "text-red-400" : isAmbiguous ? "text-warning" : "text-green-400"}`}>
            {count}
          </span>
          <span className="text-sm text-text-secondary">
            {isRu
              ? count === 1 ? "совпадение" : "совпадений"
              : count === 1 ? "match" : "matches"}
            {" "}{isRu ? `из ${totalElements} элементов` : `out of ${totalElements} elements`}
          </span>
          <span className="ml-auto"><CopyButton value={selector} iconOnly /></span>
        </div>
      )}

      {isEmpty && (
        <p className="text-sm text-text-muted">
          {isRu
            ? "0 совпадений — локатор не найдёт элемент в реальном тесте. Проверьте опечатки, регистр и структуру HTML."
            : "0 matches — this locator won't find the element in a real test. Check for typos, casing, and the actual HTML structure."}
        </p>
      )}
      {isAmbiguous && (
        <p className="text-sm text-text-muted">
          {isRu
            ? "Больше одного совпадения — если тест ожидает единственный элемент, такой локатор нестабилен (упадёт по-разному в зависимости от порядка DOM)."
            : "More than one match — if a test expects a single element, this locator is flaky and will resolve inconsistently depending on DOM order."}
        </p>
      )}

      {count > 0 && (
        <div className="space-y-2">
          <label className="input-label">{isRu ? "Найденные элементы" : "Matched elements"}</label>
          {matches.slice(0, 20).map((el, i) => {
            const info = describeElement(el);
            return (
              <div key={i} className="code-surface rounded-[10px] p-3">
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-accent">&lt;{info.tag}</span>
                  {info.attrs && <span className="text-text-muted truncate">{info.attrs}</span>}
                  <span className="text-accent">&gt;</span>
                </div>
                {info.text && <p className="mt-1 text-xs text-text-muted truncate">{info.text}</p>}
              </div>
            );
          })}
          {matches.length > 20 && (
            <p className="text-xs text-text-muted">
              {isRu ? `…и ещё ${matches.length - 20}` : `…and ${matches.length - 20} more`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
