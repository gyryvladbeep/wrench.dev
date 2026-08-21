"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const SAMPLE = `<root><user id="1"><name>Ada Lovelace</name><active>true</active></user></root>`;

function formatXml(xml: string, indentSize: number): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) throw new Error("invalid");

  const pad = " ".repeat(indentSize);
  const lines: string[] = [];

  function walk(node: Node, depth: number) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const attrs = Array.from(el.attributes).map((a) => ` ${a.name}="${a.value}"`).join("");
      const children = Array.from(el.childNodes).filter(
        (n) => !(n.nodeType === Node.TEXT_NODE && !n.textContent?.trim())
      );
      const onlyText = children.length === 1 && children[0].nodeType === Node.TEXT_NODE;

      if (children.length === 0) {
        lines.push(`${pad.repeat(depth)}<${el.tagName}${attrs} />`);
      } else if (onlyText) {
        lines.push(`${pad.repeat(depth)}<${el.tagName}${attrs}>${children[0].textContent?.trim()}</${el.tagName}>`);
      } else {
        lines.push(`${pad.repeat(depth)}<${el.tagName}${attrs}>`);
        children.forEach((c) => walk(c, depth + 1));
        lines.push(`${pad.repeat(depth)}</${el.tagName}>`);
      }
    }
  }

  Array.from(doc.childNodes).forEach((n) => walk(n, 0));
  return lines.join("\n");
}

export function XmlFormatterTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState(SAMPLE);
  const [indent, setIndent] = useState(2);
  const t = dict.tools.xml;

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, value: "" };
    try {
      return { ok: true as const, value: formatXml(input, indent) };
    } catch {
      return { ok: false as const, message: t.invalidMessage };
    }
  }, [input, indent, t.invalidMessage]);

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
          <CopyButton value={result.ok ? result.value : ""} label={dict.common.copy} copiedLabel={dict.common.copied} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="xml-input" className="mb-1 block text-xs font-medium text-text-muted">{dict.common.input}</label>
          <textarea
            id="xml-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
            placeholder={t.placeholder}
          />
        </div>
        <div>
          <label htmlFor="xml-output" className="mb-1 block text-xs font-medium text-text-muted">{dict.common.output}</label>
          <textarea
            id="xml-output"
            readOnly
            value={result.ok ? result.value : `${t.invalidPrefix} ${result.message}`}
            spellCheck={false}
            className={`code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm outline-none ${
              result.ok ? "text-text-primary" : "text-red-400"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
