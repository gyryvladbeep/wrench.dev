"use client";
import { useState } from "react";
import { Tool } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dictionary } from "@/lib/i18n/dictionary-types";

export function ComingSoonTool({ tool, dict }: { tool: Tool; dict: Dictionary }) {
  const [email, setEmail] = useState("");
  const [done, setDone]   = useState(false);
  const t = dict.comingSoon;
  const isRu = dict.common.copy === "Копировать";

  return (
    <div className="rounded-[12px] border border-border bg-surface overflow-hidden">
      <div className="border-b border-border p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[12px] border border-border bg-canvas text-3xl">⚡</div>
        <h3 className="text-lg font-semibold text-text-primary">{tool.name}</h3>
        <p className="mt-2 text-sm text-text-muted leading-relaxed max-w-sm mx-auto">{t.body}</p>
      </div>
      <div className="p-6">
        {!done ? (
          <form onSubmit={(e)=>{e.preventDefault();setDone(true);}}>
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
              {isRu?"Уведомить о запуске":"Notify me when it launches"}
            </p>
            <div className="flex gap-2">
              <input type="email" required placeholder={t.emailPlaceholder} value={email}
                onChange={(e)=>setEmail(e.target.value)}
                className="code-surface flex-1 rounded-[10px] px-3 py-2 text-sm text-text-primary outline-none"/>
              <Button type="submit" size="sm">{t.notifyMe}</Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-2">
            <p className="text-2xl mb-2">📬</p>
            <p className="text-sm text-accent font-medium">{t.thanks.replace("{name}",tool.name)}</p>
          </div>
        )}
      </div>
      {tool.relatedSlugs && tool.relatedSlugs.length > 0 && (
        <div className="border-t border-border px-6 pb-5 pt-4">
          <p className="text-xs text-text-muted text-center">
            {isRu?"Пока доступны похожие инструменты ниже ↓":"Similar tools are available below ↓"}
          </p>
        </div>
      )}
    </div>
  );
}
