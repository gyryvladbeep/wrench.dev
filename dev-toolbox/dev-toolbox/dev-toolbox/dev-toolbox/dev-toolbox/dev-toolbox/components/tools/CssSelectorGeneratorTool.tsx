"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

interface SelectorResult { label: string; value: string; }

function getCssSelectors(el: Element): SelectorResult[] {
  const tag = el.tagName.toLowerCase();
  const results: SelectorResult[] = [];

  if (el.id) results.push({ label: "ID", value: `#${el.id}` });

  if (el.classList.length > 0) {
    results.push({ label: "Class", value: `${tag}.${Array.from(el.classList).join(".")}` });
    results.push({ label: "First class", value: `.${el.classList[0]}` });
  }

  // Attribute selectors for common attrs
  const attrs = ["type", "name", "placeholder", "href", "src", "role", "aria-label", "data-testid"];
  for (const attr of attrs) {
    const val = el.getAttribute(attr);
    if (val) results.push({ label: `[${attr}]`, value: `${tag}[${attr}="${val}"]` });
  }

  // nth-child
  if (el.parentElement) {
    const siblings = Array.from(el.parentElement.children).filter(c => c.tagName === el.tagName);
    const idx = siblings.indexOf(el) + 1;
    if (siblings.length > 1) {
      results.push({ label: "nth-child", value: `${tag}:nth-of-type(${idx})` });
    }
  }

  // Unique path (if nothing else is unique enough)
  if (results.length === 0) {
    results.push({ label: "Tag", value: tag });
  }

  return results;
}

function generateCssSelectors(html: string): SelectorResult[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const results: SelectorResult[] = [];
  const seen = new Set<string>();
  const elements = Array.from(doc.body.querySelectorAll("*")).slice(0, 10);
  for (const el of elements) {
    const sels = getCssSelectors(el);
    for (const s of sels) {
      if (!seen.has(s.value)) {
        seen.add(s.value);
        results.push({ label: `${el.tagName.toLowerCase()} — ${s.label}`, value: s.value });
      }
    }
  }
  return results.slice(0, 12);
}

export function CssSelectorGeneratorTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState(dict.tools.cssSelectorGenerator.htmlPlaceholder);
  const [results, setResults] = useState<SelectorResult[]>([]);
  const t = dict.tools.cssSelectorGenerator;

  function handleGenerate() {
    if (!input.trim()) return;
    setResults(generateCssSelectors(input));
  }

  const allText = results.map(r => `${r.label}:\n${r.value}`).join("\n\n");

  return (
    <div>
      <label htmlFor="css-input" className="mb-1 block text-xs font-medium text-text-muted">
        {t.htmlLabel}
      </label>
      <textarea
        id="css-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        spellCheck={false}
        className="code-surface h-40 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
        placeholder={t.htmlPlaceholder}
      />

      <div className="mt-3 flex gap-2">
        <Button onClick={handleGenerate}>{t.generate}</Button>
        {results.length > 0 && (
          <CopyButton value={allText} label={t.copyAll} copiedLabel={dict.common.copied} />
        )}
      </div>

      {results.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-text-muted">{t.resultsLabel}</p>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="code-surface flex items-center justify-between rounded-[10px] p-3">
                <div>
                  <span className="text-xs text-text-muted">{r.label}</span>
                  <p className="font-mono text-sm text-text-primary">{r.value}</p>
                </div>
                <CopyButton value={r.value} label={dict.common.copy} copiedLabel={dict.common.copied} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-text-muted">{t.emptyHint}</p>
      )}
    </div>
  );
}
