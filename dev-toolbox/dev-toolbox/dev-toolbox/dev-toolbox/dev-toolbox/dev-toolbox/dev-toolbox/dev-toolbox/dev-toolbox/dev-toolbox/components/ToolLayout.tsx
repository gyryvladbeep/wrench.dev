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

export function ToolLayout({ tool, locale, dict, categoryName, related, children }: {
  tool: Tool; locale: Locale; dict: Dictionary;
  categoryName: string; related: Tool[]; children: React.ReactNode;
}) {
  const { track } = useRecentlyUsed();
  useEffect(() => { track(tool.slug); }, [tool.slug, track]);

  return (
    <div className="animate-fade-in">
      {/* Hero bar */}
      <div className="border-b border-border bg-canvas">
        <div className="mx-auto max-w-4xl px-6 py-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-text-muted">
            <Link href={localePath(locale, "/")} className="hover:text-text-primary transition-colors">{dict.toolLayout.home}</Link>
            <span className="text-border">/</span>
            <Link href={localePath(locale, `/categories/${tool.category}`)} className="hover:text-text-primary transition-colors">{categoryName}</Link>
            <span className="text-border">/</span>
            <span className="text-text-primary">{tool.name}</span>
          </nav>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-muted">
                <CategoryIcon category={tool.category} size={15} />
              </span>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-semibold text-text-primary md:text-2xl">{tool.name}</h1>
                  {tool.isPopular && (
                    <span className="rounded-md border border-accent/25 bg-accent/8 px-1.5 py-px text-[10px] font-medium text-accent">Popular</span>
                  )}
                  {!tool.isImplemented && (
                    <span className="rounded-md border border-border px-1.5 py-px text-[10px] text-text-muted">Coming soon</span>
                  )}
                </div>
                <p className="mt-1 max-w-2xl text-sm text-text-muted leading-relaxed">{tool.longDescription}</p>
              </div>
            </div>
            <FavoriteButton slug={tool.slug} />
          </div>

          {/* Keyword tags */}
          {tool.keywords && tool.keywords.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5 pl-11">
              {tool.keywords.slice(0, 5).map((kw) => (
                <span key={kw} className="rounded border border-border px-2 py-0.5 text-[10px] text-text-muted">{kw}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tool content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        {children}

        {/* How to use */}
        {tool.howToSteps && tool.howToSteps.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-base font-semibold text-text-primary">{dict.toolLayout.howToUseHeading}</h2>
            <div className="rounded-lg border border-border bg-surface p-5">
              <ol className="space-y-3">
                {tool.howToSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-text-muted">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent/30 text-[10px] font-bold text-accent">{i + 1}</span>
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
            <h2 className="mb-4 text-base font-semibold text-text-primary">{dict.toolLayout.faqHeading}</h2>
            <div className="space-y-2">
              {tool.faqs.map((faq, i) => (
                <details key={i} className="group rounded-lg border border-border bg-surface">
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
          <section className="mt-12">
            <h2 className="mb-4 text-base font-semibold text-text-primary">{dict.toolLayout.relatedToolsHeading}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {related.map((r) => <ToolCard key={r.slug} tool={r} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
