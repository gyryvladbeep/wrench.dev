"use client";
import Link from "next/link";
import { Tool } from "@/lib/types";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CategoryIcon } from "@/components/CategoryIcon";
import { localePath } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/dict-context";

export function ToolCard({ tool }: { tool: Tool }) {
  const { locale, dict } = useDict();
  return (
    <Link href={localePath(locale, `/tools/${tool.slug}`)}
      className="group block rounded-lg border border-border bg-surface p-4 transition-all duration-150
        hover:border-accent/40 hover:bg-surface-hover hover:shadow-[0_2px_8px_rgba(0,0,0,.25)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1">

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="mt-0.5 shrink-0 text-text-muted/50 group-hover:text-accent transition-colors">
            <CategoryIcon category={tool.category} size={14} />
          </span>
          <h3 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors leading-snug truncate">
            {tool.name}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-1 pl-1">
          {tool.isPopular && (
            <span className="rounded-md border border-accent/25 bg-accent/8 px-1.5 py-px text-[10px] font-medium text-accent">
              {dict.badges.popular}
            </span>
          )}
          {tool.isPremiumAI && (
            <span className="rounded-md border border-violet-500/25 bg-violet-500/8 px-1.5 py-px text-[10px] font-medium text-violet-400">
              AI
            </span>
          )}
          {!tool.isImplemented && !tool.isPremiumAI && (
            <span className="rounded-md border border-border px-1.5 py-px text-[10px] text-text-muted">
              {dict.badges.comingSoon}
            </span>
          )}
          <FavoriteButton slug={tool.slug} />
        </div>
      </div>

      <p className="mt-2 pl-[22px] text-xs text-text-muted leading-relaxed line-clamp-2">
        {tool.shortDescription}
      </p>
    </Link>
  );
}
