"use client";
import Link from "next/link";
import { Tool } from "@/lib/types";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CategoryIcon } from "@/components/CategoryIcon";
import { localePath } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/dict-context";

interface ToolCardProps {
  tool: Tool;
  /**
   * Показывать иконку категории и подпись категории на самой карточке.
   * Имеет смысл только там, где карточки разных категорий перемешаны
   * (например "Popular Across the Board" на главной). Внутри списка,
   * уже сгруппированного по одной категории (/tools, /categories/[x]) —
   * это чистое дублирование заголовка секции, поэтому по умолчанию
   * скрыто там явным false.
   */
  showCategory?: boolean;
  /**
   * Рисовать ли собственную рамку/фон карточки. По умолчанию true —
   * карточка выглядит как отдельная плитка (согласовано с карточками
   * FavoritesSection и другими списками в продукте). На главной секция
   * "Popular" использует свой бесшовный grid с hairline-разделителями
   * (bg-border + gap-px) — там рамка на самой карточке конфликтовала бы
   * визуально, поэтому эта секция передаёт bordered={false}.
   */
  bordered?: boolean;
}

export function ToolCard({ tool, showCategory = true, bordered = true }: ToolCardProps) {
  const { locale, dict } = useDict();

  return (
    <Link href={localePath(locale, `/tools/${tool.slug}`)}
      className={`card-shine group flex flex-col gap-2.5 p-4 transition-all duration-150 hover:bg-surface-hover hover:-translate-y-px focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-inset ${bordered ? "rounded-lg border border-border bg-surface/40 hover:border-accent/30" : ""}`}>

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {showCategory && (
            <span className="shrink-0 text-text-muted group-hover:text-accent transition-colors">
              <CategoryIcon category={tool.category} size={14} />
            </span>
          )}
          <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors leading-tight truncate">
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

      <p className={`text-xs text-text-muted leading-relaxed line-clamp-2 ${showCategory ? "pl-[22px]" : ""}`}>
        {tool.shortDescription}
      </p>

      {showCategory && (
        <div className="pl-[22px]">
          <span className="text-[10px] text-text-disabled uppercase tracking-wider">
            {tool.category}
          </span>
        </div>
      )}
    </Link>
  );
}