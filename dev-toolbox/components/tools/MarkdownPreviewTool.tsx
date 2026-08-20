"use client";
import { useMemo, useState } from "react";
import { marked } from "marked";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const SAMPLE = `# Hello, Markdown!

Write **bold**, *italic*, or \`inline code\`.

## Features

- [x] Renders instantly
- [x] GitHub Flavored Markdown
- [x] No data uploaded

\`\`\`json
{"tool": "Dev Toolbox", "awesome": true}
\`\`\`

> Tip: Try pasting any README.md here.

| Column A | Column B |
|----------|----------|
| Cell 1   | Cell 2   |
`;

// Configure marked for safe rendering
marked.setOptions({ gfm: true, breaks: true });

export function MarkdownPreviewTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState(SAMPLE);
  const [view, setView] = useState<"split" | "preview" | "source">("split");

  const html = useMemo(() => marked(input) as string, [input]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {[{id:"split",label:"Split"},{id:"source",label:"Markdown"},{id:"preview",label:"Preview"}].map((v) => (
          <button key={v.id} onClick={() => setView(v.id as typeof view)}
            className={`rounded-[10px] px-3 py-1.5 text-sm transition-colors ${view === v.id ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
            {v.label}
          </button>
        ))}
        <div className="ml-auto">
          <CopyButton value={html} label="Copy HTML" copiedLabel={dict.common.copied} />
        </div>
      </div>

      <div className={`grid gap-4 ${view === "split" ? "md:grid-cols-2" : "grid-cols-1"}`}>
        {view !== "preview" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Markdown</label>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false}
              className="code-surface h-[32rem] w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
          </div>
        )}
        {view !== "source" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Preview</label>
            <div
              className="code-surface h-[32rem] overflow-auto rounded-[10px] p-5 prose prose-invert prose-sm max-w-none"
              style={{
                "--tw-prose-body": "var(--color-text-primary, #f2f2f5)",
                "--tw-prose-headings": "var(--color-text-primary, #f2f2f5)",
                "--tw-prose-code": "#f0a23a",
                "--tw-prose-pre-bg": "#0e0e13",
              } as React.CSSProperties}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        )}
      </div>

      <style>{`
        .prose h1,.prose h2,.prose h3 { color: #f2f2f5; margin-top: 1.2em; }
        .prose p,.prose li { color: #9a9aa8; }
        .prose code { color: #f0a23a; background: #14141b; padding: 0.1em 0.3em; border-radius:4px; }
        .prose pre { background: #0e0e13; border:1px solid #26262f; border-radius:8px; }
        .prose pre code { color: #f2f2f5; background: transparent; padding: 0; }
        .prose blockquote { border-left-color: #f0a23a; color: #9a9aa8; }
        .prose a { color: #7c8cf8; }
        .prose table { border-collapse: collapse; width: 100%; }
        .prose th,.prose td { border: 1px solid #26262f; padding: 0.4em 0.8em; color: #f2f2f5; }
        .prose th { background: #14141b; }
        .prose hr { border-color: #26262f; }
      `}</style>
    </div>
  );
}
