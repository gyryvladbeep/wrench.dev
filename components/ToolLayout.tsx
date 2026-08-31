"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Tool } from "@/lib/types";
import { Locale, localePath } from "@/lib/i18n/config";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useRecentlyUsed } from "@/lib/hooks/useRecentlyUsed";
import { ToolCard } from "@/components/ToolCard";

const CATEGORY_GRADIENT: Record<string, string> = {
  formatting: "from-amber-500/10  to-transparent",
  encoding:   "from-blue-500/10   to-transparent",
  text:       "from-violet-500/10 to-transparent",
  hash:       "from-red-500/10    to-transparent",
  generators: "from-emerald-500/10 to-transparent",
  datetime:   "from-cyan-500/10   to-transparent",
  web:        "from-orange-500/10 to-transparent",
  qa:         "from-green-500/10  to-transparent",
  api:        "from-purple-500/10 to-transparent",
  data:       "from-pink-500/10   to-transparent",
};

const CATEGORY_COLOR: Record<string, string> = {
  formatting: "#f59e0b",
  encoding:   "#3b82f6",
  text:       "#8b5cf6",
  hash:       "#ef4444",
  generators: "#10b981",
  datetime:   "#06b6d4",
  web:        "#f97316",
  qa:         "#22c55e",
  api:        "#a78bfa",
  data:       "#ec4899",
};

export function ToolLayout({ tool, locale, dict, categoryName, related, children }: {
  tool: Tool; locale: Locale; dict: Dictionary;
  categoryName: string; related: Tool[]; children: React.ReactNode;
}) {
  const { track } = useRecentlyUsed();
  useEffect(() => { track(tool.slug); }, [tool.slug, track]);

  const catColor    = CATEGORY_COLOR[tool.category] ?? "#f59e0b";
  const catGradient = CATEGORY_GRADIENT[tool.category] ?? "from-accent/10 to-transparent";

  return (
    <div className="animate-fade-in">
      {/* Hero bar */}
      <div className={`border-b border-border bg-gradient-to-r ${catGradient}`}>
        <div className="mx-auto max-w-4xl px-6 py-7">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-xs text-text-muted">
            <Link href={localePath(locale, "/")} className="hover:text-text-primary transition-colors">{dict.toolLayout.home}</Link>
            <span className="text-border">/</span>
            <Link href={localePath(locale, `/categories/${tool.category}`)} className="hover:text-text-primary transition-colors capitalize">{categoryName}</Link>
            <span className="text-border">/</span>
            <span className="text-text-primary">{tool.name}</span>
          </nav>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-canvas shadow-sm"
                style={{ boxShadow: `0 0 0 1px ${catColor}20, 0 4px 16px ${catColor}10` }}>
                <span style={{ color: catColor }}>
                  <CategoryIcon category={tool.category} size={20} />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold text-text-primary">{tool.name}</h1>
                  {tool.isPopular && (
                    <span className="rounded-full border px-2.5 py-px text-[10px] font-semibold uppercase tracking-wider"
                      style={{ borderColor: `${catColor}40`, background: `${catColor}15`, color: catColor }}>
                      Popular
                    </span>
                  )}
                  {!tool.isImplemented && (
                    <span className="rounded-full border border-border px-2.5 py-px text-[10px] text-text-muted uppercase tracking-wider">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="mt-2 max-w-2xl text-sm text-text-secondary leading-relaxed">{tool.longDescription}</p>

                {/* Tags */}
                {tool.keywords && tool.keywords.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tool.keywords.slice(0, 4).map((kw) => (
                      <span key={kw} className="rounded border border-border bg-surface px-2 py-0.5 text-[10px] text-text-muted">{kw}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <FavoriteButton slug={tool.slug} />
          </div>
        </div>
      </div>

      {/* Tool content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        {children}

        {/* How to use */}
        {tool.howToSteps && tool.howToSteps.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-4 text-base font-semibold text-text-primary">{dict.toolLayout.howToUseHeading}</h2>
            <div className="rounded-xl border border-border bg-surface p-5">
              <ol className="space-y-3">
                {tool.howToSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-text-muted">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: catColor }}>
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
          <section className="mt-14">
            <h2 className="mb-4 text-base font-semibold text-text-primary">{dict.toolLayout.faqHeading}</h2>
            <div className="space-y-2">
              {tool.faqs.map((faq, i) => (
                <details key={i} className="group rounded-xl border border-border bg-surface">
                  <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium text-text-primary list-none select-none hover:text-accent transition-colors">
                    {faq.question}
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-text-muted transition-transform group-open:rotate-180" aria-hidden>
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </summary>
                  <p className="border-t border-border px-4 pb-4 pt-3 text-sm text-text-muted leading-relaxed">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related tools */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-4 text-base font-semibold text-text-primary">{dict.toolLayout.relatedToolsHeading}</h2>
            <div className="grid grid-cols-1 gap-px sm:grid-cols-3 border border-border rounded-xl overflow-hidden bg-border">
              {related.map((r) => (
                <div key={r.slug} className="bg-canvas">
                  <ToolCard tool={r} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Back to category */}
        <div className="mt-10 flex items-center gap-4 border-t border-border pt-6">
          <Link href={localePath(locale, `/categories/${tool.category}`)}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
            ← {categoryName}
          </Link>
          <Link href={localePath(locale, "/tools")}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
            {locale === "ru" ? "Все инструменты" : "All tools"}
          </Link>
        </div>
      </div>
    </div>
  );
}