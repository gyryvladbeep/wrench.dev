"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { ToolShell } from "./ToolShell";
import { EmptyToolInput } from "@/components/EmptyState";

const SAMPLE = `# Hello, Wrench!

A **professional** toolbox for _developers_ and QA engineers.

## Features

- 60+ browser-based tools
- Daily challenges
- Interview prep
- EN/RU support

## Code Example

\`\`\`javascript
const tools = wrench.getTools({ category: 'qa' });
tools.forEach(tool => tool.run());
\`\`\`

> "The best tools are the ones you actually use."

[Visit Wrench](https://wrench-dev-lr29.vercel.app) | **Free to use**

---

| Tool | Category | Status |
|------|----------|--------|
| Regex Tester | QA | ✅ Ready |
| JSON Diff | Formatting | ✅ Ready |
`;

// Simple markdown to HTML converter
function mdToHtml(md: string): string {
  // ФИКС: раньше код-блоки (```...```) конвертировались в <pre><code> ДО
  // шага "Paragraphs" ниже, и этот шаг оборачивал в <p> любую строку, не
  // начинающуюся с "<lowercase" — включая внутренние строки кода
  // (`tools.forEach(...)`) и закрывающую `</code></pre>` (она начинается
  // с "</", а не с "<letter", так что тоже не распознавалась как "уже
  // тег"). В результате многострочные код-блоки ломались стray-тегами
  // <p> прямо внутри <pre><code>. Теперь код-блоки на время шага
  // "Paragraphs" заменяются плейсхолдером вида "<codeblockN/>" (он сам
  // начинается с "<lowercase", поэтому корректно распознаётся как "уже
  // тег" и не оборачивается), а после — подставляются обратно целиком.
  const codeBlocks: string[] = [];
  return md
    // Code blocks — extract into placeholders so later steps (in particular
    // the paragraph-wrap step) never touch their content.
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang: string | undefined, code: string) => {
      const html = `<pre><code class="language-${lang ?? ""}">${code}</code></pre>`;
      codeBlocks.push(html);
      return `<codeblock${codeBlocks.length - 1}/>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // HR
    .replace(/^---$/gm, '<hr>')
    // Tables
    .replace(/^\|(.+)\|$/gm, (_, row) => {
      const cells = row.split("|").map((c: string) => c.trim());
      return '<tr>' + cells.map((c: string) => c.match(/^-+$/) ? '' : `<td>${c}</td>`).join('') + '</tr>';
    })
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Paragraphs (lines not already tags)
    .replace(/^(?!<[a-z]).+$/gm, (line) => line.trim() ? `<p>${line}</p>` : '')
    // Wrap li in ul
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    // Restore code blocks (after paragraph-wrap, so their content is untouched)
    .replace(/<codeblock(\d+)\/>/g, (_m, i: string) => codeBlocks[Number(i)])
    // Clean empty lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function MarkdownToHtmlTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";
  const [input,   setInput]   = useState(SAMPLE);
  const [preview, setPreview] = useState(false);

  const html = useMemo(() => input ? mdToHtml(input) : "", [input]);

  return (
    <ToolShell onClear={() => setInput("")}
      actions={<>
        <button onClick={() => setPreview(p => !p)}
          className={`rounded border px-3 py-1.5 text-xs transition-colors ${preview ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
          {preview ? (isRu ? "Код" : "Code") : (isRu ? "Превью" : "Preview")}
        </button>
        <div className="ml-auto"><CopyButton value={html} /></div>
      </>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="input-label">Markdown</label>
          <textarea value={input} onChange={e => setInput(e.target.value)} spellCheck={false} rows={20}
            className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="input-label">HTML {preview ? (isRu ? "(превью)" : "(preview)") : ""}</label>
          {!html ? (
            <div className="code-surface min-h-[20rem] rounded-lg flex items-center justify-center"><EmptyToolInput /></div>
          ) : preview ? (
            <div className="code-surface min-h-[20rem] rounded-lg p-4 overflow-auto prose text-text-primary"
              dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <textarea readOnly value={html} rows={20} spellCheck={false}
              className="code-surface w-full rounded-lg p-3 font-mono text-xs text-text-primary outline-none" />
          )}
        </div>
      </div>
    </ToolShell>
  );
}
