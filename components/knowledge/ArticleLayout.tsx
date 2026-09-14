import Link from "next/link";
import { Article, getRelatedArticles } from "@/lib/knowledge/articles";
import { ROLE_META } from "@/lib/knowledge/content";
import { Locale, localePath } from "@/lib/i18n/config";
import { ArrowLeftIcon, BookIcon } from "@/components/icons/GameIcons";

// Deliberately plain server component, no client-side state — an article
// page is read, not interacted with, so there's nothing here that needs
// "use client". Visual conventions (breadcrumb, rounded-xl border/bg-surface
// section cards, heading sizes) are copied from ToolLayout.tsx so this reads
// as part of the same site rather than a bolted-on separate design.

export function ArticleLayout({ article, locale }: { article: Article; locale: Locale }) {
  const isRu = locale === "ru";
  const role = ROLE_META[article.role];
  const related = getRelatedArticles(article, 3);

  return (
    <div className="animate-fade-in">
      <div className="border-b border-border bg-gradient-to-r from-accent/10 to-transparent">
        <div className="mx-auto max-w-3xl px-6 py-7">
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-xs text-text-muted">
            <Link href={localePath(locale, "/")} className="hover:text-text-primary transition-colors">
              {isRu ? "Главная" : "Home"}
            </Link>
            <span className="text-border">/</span>
            <Link href={localePath(locale, "/knowledge")} className="hover:text-text-primary transition-colors">
              {isRu ? "База знаний" : "Knowledge"}
            </Link>
            <span className="text-border">/</span>
            <span className="text-text-primary line-clamp-1">{isRu ? article.titleRu : article.title}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`rounded border px-2 py-0.5 text-[11px] font-medium ${role.color}`}>
              {isRu ? role.labelRu : role.label}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-text-muted">
              <BookIcon size={11} />
              {article.readingMinutes} {isRu ? "мин чтения" : "min read"}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
            {isRu ? article.titleRu : article.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary leading-relaxed">
            {isRu ? article.summaryRu : article.summary}
          </p>

          {article.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <span key={tag} className="rounded border border-border bg-surface px-2 py-0.5 text-[10px] text-text-muted">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="space-y-10">
          {article.sections.map((section, i) => (
            <section key={i}>
              <h2 className="mb-3 text-lg font-semibold text-text-primary">
                {isRu ? section.headingRu : section.heading}
              </h2>
              <div className="space-y-3">
                {(isRu ? section.paragraphsRu : section.paragraphs).map((p, j) => (
                  <p key={j} className="text-sm text-text-secondary leading-relaxed">{p}</p>
                ))}
              </div>
              {section.bullets && section.bullets.length > 0 && (
                <div className="mt-4 rounded-xl border border-border bg-surface p-5">
                  <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    {isRu ? "Коротко" : "Takeaways"}
                  </p>
                  <ul className="space-y-2">
                    {(isRu ? section.bulletsRu ?? [] : section.bullets).map((b, k) => (
                      <li key={k} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}
        </div>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-4 text-base font-semibold text-text-primary">
              {isRu ? "Похожие статьи" : "Related articles"}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {related.map((r) => {
                const rRole = ROLE_META[r.role];
                return (
                  <Link key={r.slug} href={localePath(locale, `/knowledge/${r.slug}`)}
                    className="rounded-lg border border-border bg-surface p-4 hover:border-border-focus hover:bg-surface-hover transition-all">
                    <span className={`rounded border px-1.5 py-px text-[10px] font-medium ${rRole.color}`}>
                      {isRu ? rRole.labelRu : rRole.label}
                    </span>
                    <p className="mt-2 text-sm font-medium text-text-primary leading-snug">
                      {isRu ? r.titleRu : r.title}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-10 flex items-center gap-4 border-t border-border pt-6">
          <Link href={localePath(locale, "/knowledge")}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeftIcon size={11} />
            {isRu ? "Все статьи" : "All articles"}
          </Link>
        </div>
      </div>
    </div>
  );
}
