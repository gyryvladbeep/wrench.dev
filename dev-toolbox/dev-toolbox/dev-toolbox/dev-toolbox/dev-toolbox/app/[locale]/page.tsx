import Link from "next/link";
import { Metadata } from "next";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { allTools, getPopularTools, getFeaturedTools, categories, aiTools } from "@/lib/tools-registry";
import { localizeTools, localizeCategories, localizeAiTools } from "@/lib/i18n/localize";
import { buildPageMetadata, siteConfig } from "@/lib/seo";
import { HeroLiveDemo } from "@/components/HeroLiveDemo";
import { ToolCard } from "@/components/ToolCard";
import { CategoryIcon } from "@/components/CategoryIcon";
import { RecentlyUsedSection } from "@/components/RecentlyUsedSection";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict   = getDictionary(locale);
  return buildPageMetadata(locale, "/", `${siteConfig.name} — ${siteConfig.tagline}`, dict.site.description);
}

export default function HomePage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict   = getDictionary(locale);
  const isRu   = locale === "ru";

  const featuredTools = localizeTools(getFeaturedTools(), locale);
  const popularTools  = localizeTools(getPopularTools(), locale);
  const localizedCats = localizeCategories(categories, locale);
  const localizedAI   = localizeAiTools(aiTools, locale);
  const totalCount    = allTools.filter((t) => t.isImplemented).length;

  return (
    <div>
      {/* ── Hero ── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded border border-border bg-surface px-2 py-0.5 text-xs text-text-muted font-mono">
              {totalCount} {isRu ? "инструментов" : "tools"}
            </span>
            <span className="text-xs text-text-muted">·</span>
            <span className="text-xs text-text-muted">{isRu ? "работает в браузере" : "runs in your browser"}</span>
            <span className="text-xs text-text-muted">·</span>
            <span className="text-xs text-text-muted">{isRu ? "без регистрации" : "no account needed"}</span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
            {isRu ? "Инструменты разработчика\nи QA в одном месте" : "Developer & QA tools\nin one workspace"}
          </h1>
          <p className="mt-3 max-w-lg text-text-secondary text-sm leading-relaxed">
            {isRu
              ? "Быстрые, приватные утилиты для форматирования, кодирования, тестирования и отладки. Без регистрации."
              : "Fast, privacy-conscious utilities for formatting, encoding, QA testing and debugging. No signup."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={localePath(locale, "/tools")}
              className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-amber-400 transition-colors">
              {isRu ? "Все инструменты" : "Browse tools"}
            </Link>
            <Link href={localePath(locale, "/categories/qa")}
              className="rounded border border-border bg-surface px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:border-border-focus transition-colors">
              QA Toolkit
            </Link>
          </div>

          <HeroLiveDemo dict={dict} />
        </div>
      </section>

      {/* ── Recently Used ── */}
      <RecentlyUsedSection />

      {/* ── Featured ── */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted">
            {isRu ? "Популярные инструменты" : "Featured Tools"}
          </h2>
          <Link href={localePath(locale, "/tools")} className="text-xs text-link hover:underline">
            {isRu ? "Все инструменты →" : "All tools →"}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3 border border-border rounded-lg overflow-hidden bg-border stagger">
          {featuredTools.slice(0, 6).map((t) => (
            <div key={t.slug} className="bg-canvas animate-fade-in">
              <ToolCard tool={t} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="border-y border-border bg-surface/40 py-12">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-text-muted">
            {isRu ? "Категории" : "Categories"}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 stagger">
            {localizedCats.map((cat) => {
              const count = allTools.filter((t) => t.category === cat.slug && t.isImplemented).length;
              return (
                <Link key={cat.slug} href={localePath(locale, `/categories/${cat.slug}`)}
                  className="animate-fade-in group flex items-center gap-3 rounded-md border border-border bg-canvas p-3 transition-all duration-100 hover:border-border-focus hover:bg-surface">
                  <span className="shrink-0 text-text-muted group-hover:text-accent transition-colors">
                    <CategoryIcon category={cat.slug} size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{cat.name}</p>
                    <p className="text-xs text-text-muted">{count}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Popular ── */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-text-muted">
          {isRu ? "Часто используемые" : "Popular Tools"}
        </h2>
        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-lg overflow-hidden bg-border stagger">
          {popularTools.map((t) => (
            <div key={t.slug} className="bg-canvas animate-fade-in">
              <ToolCard tool={t} />
            </div>
          ))}
        </div>
      </section>

      {/* ── AI ── */}
      <section id="ai" className="border-t border-border py-12">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted">
              {isRu ? "AI-инструменты" : "AI Tools"}
            </h2>
            <span className="rounded border border-amber-800/40 bg-amber-900/20 px-2 py-0.5 text-[10px] font-medium text-amber-400 uppercase tracking-wider">
              {isRu ? "Скоро Pro" : "Coming Pro"}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3 border border-border rounded-lg overflow-hidden bg-border">
            {localizedAI.map((tool) => (
              <div key={tool.name} className="bg-canvas p-4 opacity-60">
                <p className="text-sm font-medium text-text-primary">{tool.name}</p>
                <p className="mt-1 text-xs text-text-muted">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
