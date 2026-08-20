"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const SAMPLE = `<div class="card"><h2>Title</h2><p>Some text with <a href="#">a link</a>.</p></div>`;

const VOID_ELEMENTS = new Set([
  "area","base","br","col","embed","hr","img","input",
  "link","meta","param","source","track","wbr",
]);

function formatHtml(html: string, indentSize: number): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const pad = " ".repeat(indentSize);
  const lines: string[] = [];

  function walk(node: Node, depth: number) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      const attrs = Array.from(el.attributes).map((a) => ` ${a.name}="${a.value}"`).join("");
      if (VOID_ELEMENTS.has(tag)) { lines.push(`${pad.repeat(depth)}<${tag}${attrs}>`); return; }
      const children = Array.from(el.childNodes).filter(
        (n) => !(n.nodeType === Node.TEXT_NODE && !n.textContent?.trim())
      );
      const onlyText = children.length === 1 && children[0].nodeType === Node.TEXT_NODE;
      if (children.length === 0) {
        lines.push(`${pad.repeat(depth)}<${tag}${attrs}></${tag}>`);
      } else if (onlyText) {
        lines.push(`${pad.repeat(depth)}<${tag}${attrs}>${children[0].textContent?.trim()}</${tag}>`);
      } else {
        lines.push(`${pad.repeat(depth)}<${tag}${attrs}>`);
        children.forEach((c) => walk(c, depth + 1));
        lines.push(`${pad.repeat(depth)}</${tag}>`);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) lines.push(`${pad.repeat(depth)}${text}`);
    }
  }

  Array.from(doc.body.childNodes).forEach((n) => walk(n, 0));
  return lines.join("\n");
}

export function HtmlFormatterTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState(SAMPLE);
  const [indent, setIndent] = useState(2);
  const t = dict.tools.html;

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try { return formatHtml(input, indent); } catch { return input; }
  }, [input, indent]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-muted">{t.indent}</span>
        {[2, 4].map((opt) => (
          <button
            key={opt}
            onClick={() => setIndent(opt)}
            className={`rounded-[10px] px-2 py-1 text-sm ${
              indent === opt ? "bg-accent text-accent-fg" : "bg-surface hover:bg-surface-hover"
            }`}
          >
            {opt}
          </button>
        ))}
        <div className="ml-auto">
          <CopyButton value={output} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="html-input" className="mb-1 block text-xs font-medium text-text-muted">{dict.common.input}</label>
          <textarea
            id="html-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
          />
        </div>
        <div>
          <label htmlFor="html-output" className="mb-1 block text-xs font-medium text-text-muted">{dict.common.output}</label>
          <textarea
            id="html-output"
            readOnly
            value={output}
            spellCheck={false}
            className="code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-text-muted">{t.note}</p>
    </div>
  );
}
