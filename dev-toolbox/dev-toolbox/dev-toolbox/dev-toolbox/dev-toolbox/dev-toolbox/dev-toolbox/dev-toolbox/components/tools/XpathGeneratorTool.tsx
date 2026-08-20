"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

interface SelectorResult {
  label: string;
  value: string;
}

/** Build an absolute XPath from the DOM position of an element. */
function getAbsoluteXPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === Node.ELEMENT_NODE) {
    const tag = node.tagName.toLowerCase();
    const siblings = node.parentNode
      ? Array.from(node.parentNode.children).filter(c => c.tagName === node!.tagName)
      : [];
    const index = siblings.length > 1 ? `[${siblings.indexOf(node) + 1}]` : "";
    parts.unshift(`${tag}${index}`);
    node = node.parentElement;
  }
  return "/" + parts.join("/");
}

/** Build a relative XPath that targets the element with the minimum path. */
function getRelativeXPath(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (el.id) return `//${tag}[@id='${el.id}']`;
  const cls = Array.from(el.classList).slice(0, 2).join(" ");
  if (cls) return `//${tag}[contains(@class,'${cls}')]`;
  const text = el.textContent?.trim().slice(0, 30);
  if (text) return `//${tag}[normalize-space()='${text}']`;
  return getAbsoluteXPath(el);
}

function generateXPaths(html: string, t: Dictionary["tools"]["xpathGenerator"]): SelectorResult[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const results: SelectorResult[] = [];

  // Find the first meaningful element that isn't html/body/head
  const firstEl = doc.body.querySelector("*");
  if (!firstEl) return results;

  results.push({ label: t.absolute, value: getAbsoluteXPath(firstEl) });
  results.push({ label: t.relative, value: getRelativeXPath(firstEl) });

  if (firstEl.id) {
    results.push({ label: t.byId, value: `//*[@id='${firstEl.id}']` });
  }
  if (firstEl.classList.length > 0) {
    const cls = firstEl.classList[0];
    results.push({ label: t.byClass, value: `//${firstEl.tagName.toLowerCase()}[contains(@class,'${cls}')]` });
  }

  // Also generate for each child element
  const children = Array.from(doc.body.querySelectorAll("*")).slice(1, 6);
  for (const child of children) {
    const rel = getRelativeXPath(child);
    if (!results.find(r => r.value === rel)) {
      results.push({ label: `${t.relative} (${child.tagName.toLowerCase()})`, value: rel });
    }
  }

  return results;
}

export function XpathGeneratorTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState(dict.tools.xpathGenerator.htmlPlaceholder);
  const [results, setResults] = useState<SelectorResult[]>([]);
  const [error, setError] = useState("");
  const t = dict.tools.xpathGenerator;

  function handleGenerate() {
    setError("");
    if (!input.trim()) return;
    try {
      const r = generateXPaths(input, t);
      setResults(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  const allText = results.map(r => `${r.label}:\n${r.value}`).join("\n\n");

  return (
    <div>
      <label htmlFor="xpath-input" className="mb-1 block text-xs font-medium text-text-muted">
        {t.htmlLabel}
      </label>
      <textarea
        id="xpath-input"
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

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {results.length > 0 && (
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
      )}

      {results.length === 0 && !error && (
        <p className="mt-3 text-sm text-text-muted">{t.emptyHint}</p>
      )}
    </div>
  );
}
