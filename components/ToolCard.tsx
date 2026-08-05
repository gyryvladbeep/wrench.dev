"use client";

import Link from "next/link";
import { Tool } from "@/lib/types";
import { FavoriteButton } from "@/components/FavoriteButton";
import { localePath } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/dict-context";

const CATEGORY_ICONS: Record<string, string> = {
  formatting: "{ }", encoding: "⇄", text: "Aa", hash: "#",
  generators: "⚡", datetime: "⏱", web: "🌐", data: "⊞", qa: "✓", api: "→",
};

export function ToolCard({ tool }: { tool: Tool }) {
  const { locale, dict } = useDict();

  return (
    <Link
      href={localePath(locale, `/tools/${tool.slug}`)}
      className="group block rounded-[10px] border border-border bg-surface p-4 transition-all duration-200 hover:border-accent/30 hover:bg-surface-hover hover:shadow-sm focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          {/* Category icon */}
          <span className="mt-0.5 shrink-0 font-mono text-xs text-accent opacity-60 group-hover:opacity-100 transition-opacity w-5 text-center">
            {CATEGORY_ICONS[tool.category] ?? "→"}
          </span>
          <h3 className="font-medium text-text-primary group-hover:text-accent transition-colors leading-snug">
            {tool.name}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {tool.isPopular && (
            <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent border border-accent/20">
              {dict.badges.popular}
            </span>
          )}
          {tool.isPremiumAI && (
            <span className="rounded-full bg-link/10 px-1.5 py-0.5 text-[10px] font-medium text-link border border-link/20">
              AI
            </span>
          )}
          {!tool.isImplemented && !tool.isPremiumAI && (
            <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] text-text-muted border border-border">
              {dict.badges.comingSoon}
            </span>
          )}
          <FavoriteButton slug={tool.slug} />
        </div>
      </div>

      <p className="mt-2 text-sm text-text-muted leading-relaxed pl-7">
        {tool.shortDescription}
      </p>
    </Link>
  );
}
