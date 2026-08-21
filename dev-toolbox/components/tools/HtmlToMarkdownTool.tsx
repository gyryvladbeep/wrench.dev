"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { ToolShell } from "./ToolShell";
import { EmptyToolInput } from "@/components/EmptyState";

function htmlToMd(html: string): string {
  return html
    .replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gis, (_, l, c) => `${"#".repeat(Number(l))} ${c.replace(/<[^>]+>/g,"").trim()}\n\n`)
    .replace(/<strong[^>]*>(.*?)<\/strong>/gis, (_, c) => `**${c.replace(/<[^>]+>/g,"")}**`)
    .replace(/<b[^>]*>(.*?)<\/b>/gis, (_, c) => `**${c.replace(/<[^>]+>/g,"")}**`)
    .replace(/<em[^>]*>(.*?)<\/em>/gis, (_, c) => `*${c.replace(/<[^>]+>/g,"")}*`)
    .replace(/<i[^>]*>(.*?)<\/i>/gis, (_, c) => `*${c.replace(/<[^>]+>/g,"")}*`)
    .replace(/<code[^>]*>(.*?)<\/code>/gis, (_, c) => `\`${c.replace(/<[^>]+>/g,"")}\``)
    .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, (_, c) => `\`\`\`\n${c.replace(/<[^>]+>/g,"")}\n\`\`\`\n`)
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis, (_, href, text) => `[${text.replace(/<[^>]+>/g,"")}](${href})`)
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*/gis, (_m: string, src: string, alt: string) => `![${alt}](${src})`)
    .replace(/<img[^>]*src="([^"]*)"[^>]*/gis, (_m: string, src: string) => `![image](${src})`)
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_m: string, c: string) => c.replace(/<li[^>]*>(.*?)<\/li>/gis, (_l: string, i: string) => `- ${i.replace(/<[^>]+>/g,"").trim()}\n`) + "\n")
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_m: string, c: string) => { let n=0; return c.replace(/<li[^>]*>(.*?)<\/li>/gis, (_l: string, i: string) => `${++n}. ${i.replace(/<[^>]+>/g,"").trim()}\n`) + "\n"; })
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (_m: string, c: string) => c.split("\n").map((l: string)=>`> ${l}`).join("\n") + "\n")
    .replace(/<hr[^>]*/gi, "---\n")
    .replace(/<br[^>]*/gi, "\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gis, (_, c) => `${c.replace(/<[^>]+>/g,"").trim()}\n\n`)
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&nbsp;/g," ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SAMPLE = `<h1>Hello, World!</h1>
<p>This is a <strong>bold</strong> and <em>italic</em> paragraph.</p>
<h2>Features</h2>
<ul>
  <li>Converts <code>HTML</code> to Markdown</li>
  <li>Handles <a href="https://example.com">links</a></li>
  <li>Supports lists, headings, blockquotes</li>
</ul>
<blockquote><p>This is a blockquote</p></blockquote>`;

export function HtmlToMarkdownTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState(SAMPLE);
  const result = useMemo(() => input.trim() ? { ok:true as const, value:htmlToMd(input) } : { ok:true as const, value:"" }, [input]);

  return (
    <ToolShell onClear={() => setInput("")}
      actions={<div className="ml-auto"><CopyButton value={result.value} /></div>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="input-label">HTML</label>
          <textarea value={input} onChange={(e)=>setInput(e.target.value)} spellCheck={false} rows={16}
            className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="input-label">Markdown</label>
          {result.value === ""
            ? <div className="code-surface min-h-[20rem] rounded-[10px] flex items-center justify-center"><EmptyToolInput/></div>
            : <textarea readOnly value={result.value} rows={16} className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
          }
        </div>
      </div>
    </ToolShell>
  );
}
