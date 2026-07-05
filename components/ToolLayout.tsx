"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Tool } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Locale, localePath } from "@/lib/i18n/config";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useRecentlyUsed } from "@/lib/hooks/useRecentlyUsed";

export function ToolLayout({
  tool, locale, dict, categoryName, related, children,
}: {
  tool: Tool; locale: Locale; dict: Dictionary;
  categoryName: string; related: Tool[]; children: React.ReactNode;
}) {
  const { track } = useRecentlyUsed();

  // Track this tool visit for "Recently Used" on homepage
  useEffect(() => { track(tool.slug); }, [tool.slug, track]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-muted">
        <Link href={localePath(locale, "/")} className="hover:text-text-primary">{dict.toolLayout.home}</Link>
        {" / "}
        <Link href={localePath(locale, `/categories/${tool.category}`)} className="hover:text-text-primary">{categoryName}</Link>
        {" / "}
        <span className="text-text-primary">{tool.name}</span>
      </nav>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary md:text-3xl">{tool.name}</h1>
          <p className="mt-1 max-w-2xl text-text-muted">{tool.longDescription}</p>
        </div>
        <FavoriteButton slug={tool.slug} />
      </div>

      {/* Tool */}
      <div className="mt-8">{children}</div>

      {/* How to use */}
      {tool.howToSteps && tool.howToSteps.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-medium text-text-primary">{dict.toolLayout.howToUseHeading}</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-text-muted">
            {tool.howToSteps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </section>
      )}

      {/* FAQ */}
      {tool.faqs && tool.faqs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-medium text-text-primary">{dict.toolLayout.faqHeading}</h2>
          <div className="mt-3 space-y-4">
            {tool.faqs.map((faq, i) => (
              <div key={i}>
                <h3 className="text-sm font-medium text-text-primary">{faq.question}</h3>
                <p className="mt-1 text-sm text-text-muted">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related tools */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-medium text-text-primary">{dict.toolLayout.relatedToolsHeading}</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.slug} href={localePath(locale, `/tools/${r.slug}`)}>
                <Card className="h-full text-sm transition-colors hover:bg-surface-hover">
                  <span className="font-medium text-text-primary">{r.name}</span>
                  <p className="mt-1 text-text-muted">{r.shortDescription}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
