"use client";
import Link from "next/link";
import { useDict } from "@/lib/i18n/dict-context";
import { useRecentlyUsed } from "@/lib/hooks/useRecentlyUsed";
import { getToolBySlug } from "@/lib/tools-registry";
import { localePath } from "@/lib/i18n/config";
import { localizeTool } from "@/lib/i18n/localize";
import { CategoryIcon } from "@/components/CategoryIcon";

export function RecentlyUsedSection() {
  const { locale } = useDict();
  const { recent, hydrated } = useRecentlyUsed();
  if (!hydrated || recent.length === 0) return null;
  const tools = recent.map((s) => getToolBySlug(s)).filter(Boolean).map((t) => localizeTool(t!, locale)).slice(0, 8);
  if (tools.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-6 pt-6 pb-2">
      <p className="mb-2.5 text-xs font-medium text-text-muted">{locale === "ru" ? "Недавно использованные" : "Recently Used"}</p>
      <div className="flex flex-wrap gap-1.5">
        {tools.map((tool) => (
          <Link key={tool.slug} href={localePath(locale, `/tools/${tool.slug}`)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text-muted hover:border-accent/30 hover:bg-surface-hover hover:text-text-primary transition-all">
            <CategoryIcon category={tool.category} size={11} className="opacity-60" />
            {tool.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
