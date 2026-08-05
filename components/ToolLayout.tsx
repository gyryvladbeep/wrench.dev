"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Tool } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Locale, localePath } from "@/lib/i18n/config";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useRecentlyUsed } from "@/lib/hooks/useRecentlyUsed";
import { ToolCard } from "@/components/ToolCard";

const CATEGORY_ICONS: Record<string, string> = {
  formatting: "{ }",
  encoding:   "⇄",
  text:       "Aa",
  hash:       "#",
  generators: "⚡",
  datetime:   "⏱",
  web:        "🌐",
  data:       "⊞",
  qa:         "✓",
  api:        "→",
};

export function ToolLayout({
  tool, locale, dict, categoryName, related, children,
}: {
  tool: Tool; locale: Locale; dict: Dictionary;
  categoryName: string; related: Tool[]; children: React.ReactNode;
}) {
  const { track } = useRecentlyUsed();
  useEffect(() => { track(tool.slug); }, [tool.slug, track]);

  const isRu = locale === "ru";

  return (
    <div className="animate-fade-in">
      {/* ── Hero ── */}
      <div className="hero-glow border-b border-border bg-canvas/80">
        <div className="mx-auto max-w-4xl px-6 py-8">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-text-muted">
            <Link href={localePath(locale, "/")} className="hover:text-text-primary transition-colors">
              {dict.toolLayout.home}
            </Link>
            <span>/</span>
            <Link href={localePath(locale, `/categories/${tool.category}`)} className="hover:text-text-primary transition-colors">
              {categoryName}
            </Link>
            <span>/</span>
            <span className="text-text-primary">{tool.name}</span>
          </nav>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {/* Category icon badge */}
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border bg-surface font-mono text-sm text-accent">
                {CATEGORY_ICONS[tool.category] ?? "→"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-text-primary md:text-3xl">{tool.name}</h1>
                  {tool.isPopular && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent border border-accent/30">
                      {isRu ? "Популярный" : "Popular"}
                    </span>
                  )}
                </div>
                <p className="mt-1 max-w-2xl text-text-muted">{tool.longDescription}</p>
              </div>
            </div>
            <FavoriteButton slug={tool.slug} />
          </div>

          {/* Keywords */}
          {tool.keywords && tool.keywords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tool.keywords.slice(0, 5).map((kw) => (
                <span key={kw} className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-text-muted">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tool content ── */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        {children}

        {/* How to use */}
        {tool.howToSteps && tool.howToSteps.length > 0 && (
          <section className="mt-12 animate-fade-in">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">
              {dict.toolLayout.howToUseHeading}
            </h2>
            <div className="rounded-[10px] border border-border bg-surface p-5">
              <ol className="space-y-3">
                {tool.howToSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-text-muted">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* FAQ */}
        {tool.faqs && tool.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">{dict.toolLayout.faqHeading}</h2>
            <div className="space-y-3">
              {tool.faqs.map((faq, i) => (
                <details key={i} className="group rounded-[10px] border border-border bg-surface">
                  <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium text-text-primary list-none select-none hover:text-accent transition-colors">
                    {faq.question}
                    <span className="text-text-muted transition-transform group-open:rotate-180">▾</span>
                  </summary>
                  <p className="border-t border-border px-4 pb-4 pt-3 text-sm text-text-muted">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related tools */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">{dict.toolLayout.relatedToolsHeading}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {related.map((r) => (
                <ToolCard key={r.slug} tool={r} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
