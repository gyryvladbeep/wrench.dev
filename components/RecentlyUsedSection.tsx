"use client";

import Link from "next/link";
import { useDict } from "@/lib/i18n/dict-context";
import { useRecentlyUsed } from "@/lib/hooks/useRecentlyUsed";
import { getToolBySlug } from "@/lib/tools-registry";
import { localePath } from "@/lib/i18n/config";
import { localizeTool } from "@/lib/i18n/localize";

export function RecentlyUsedSection() {
  const { locale } = useDict();
  const { recent, hydrated } = useRecentlyUsed();

  if (!hydrated || recent.length === 0) return null;

  const tools = recent
    .map((slug) => getToolBySlug(slug))
    .filter(Boolean)
    .map((t) => localizeTool(t!, locale))
    .slice(0, 8);

  if (tools.length === 0) return null;

  const heading = locale === "ru" ? "Недавно использованные" : "Recently Used";

  return (
    <section className="mx-auto max-w-6xl px-6 py-4">
      <h2 className="text-sm font-medium text-text-muted mb-3">{heading}</h2>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={localePath(locale, `/tools/${tool.slug}`)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-text-primary hover:bg-surface-hover hover:border-accent/40 transition-colors"
          >
            <span className="font-mono text-xs text-accent">{`>_`}</span>
            {tool.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
