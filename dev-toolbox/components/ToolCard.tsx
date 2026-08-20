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
      className="group flex flex-col gap-3 p-4 transition-colors duration-100 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-inset">

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="shrink-0 text-text-muted group-hover:text-accent transition-colors">
            <CategoryIcon category={tool.category} size={14} />
          </span>
          <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors leading-tight">
            {tool.name}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {tool.isPopular && (
            <span className="rounded border border-amber-800/40 bg-amber-900/20 px-1.5 py-px text-[10px] font-medium text-amber-400">
              {dict.badges.popular}
            </span>
          )}
          {tool.isPremiumAI && (
            <span className="rounded border border-violet-800/40 bg-violet-900/20 px-1.5 py-px text-[10px] font-medium text-violet-400">
              AI
            </span>
          )}
          {!tool.isImplemented && !tool.isPremiumAI && (
            <span className="rounded border border-border px-1.5 py-px text-[10px] text-text-muted">
              {dict.badges.comingSoon}
            </span>
          )}
          <FavoriteButton slug={tool.slug} />
        </div>
      </div>

      <p className="text-xs text-text-muted leading-relaxed pl-[22px]">
        {tool.shortDescription}
      </p>

      <div className="pl-[22px]">
        <span className="text-[10px] text-text-disabled uppercase tracking-wider">
          {tool.category}
        </span>
      </div>
    </Link>
  );
}
