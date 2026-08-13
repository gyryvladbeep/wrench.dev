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
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.03] to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-4xl px-6 pt-16 pb-12 text-center">

          {/* Brand tag */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {totalCount} {isRu ? "инструментов · без регистрации" : "tools · no account required"}
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-text-primary md:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
            {isRu ? (
              <>Профессиональные инструменты<br />для разработчиков</>
            ) : (
              <>Professional developer tools<br />in one workspace</>
            )}
          </h1>

          <p className="mt-4 mx-auto max-w-lg text-base text-text-muted leading-relaxed">
            {isRu
              ? "Быстрые, приватные утилиты для разработчиков, инженеров и технических команд."
              : "Fast, privacy-friendly utilities for developers, engineers and technical teams."}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href={localePath(locale, "/tools")}
              className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg hover:bg-accent/90 transition-colors">
              {isRu ? "Все инструменты" : "Browse Tools"}
            </Link>
            <Link href={localePath(locale, "/categories/formatting")}
              className="rounded-md border border-border bg-surface px-5 py-2.5 text-sm text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">
              {isRu ? "По категориям" : "By Category"}
            </Link>
          </div>

          {/* Live demo */}
          <div className="mt-10">
            <HeroLiveDemo dict={dict} />
            <p className="mt-3 text-xs text-text-muted">
              {isRu ? "Всё выполняется в вашем браузере — данные не передаются." : "Everything runs in your browser — your data stays private."}
            </p>
          </div>
        </div>
      </section>

      {/* ── Quick access ──────────────────────────────────────────── */}
      <section className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
            <span className="shrink-0 text-xs text-text-muted mr-1">{isRu ? "Быстрый доступ:" : "Quick access:"}</span>
            {popularTools.slice(0, 7).map((tool) => (
              <Link key={tool.slug} href={localePath(locale, `/tools/${tool.slug}`)}
                className="shrink-0 flex items-center gap-1.5 rounded-md border border-border bg-canvas px-2.5 py-1 text-xs text-text-muted hover:border-accent/30 hover:text-text-primary transition-colors">
                <CategoryIcon category={tool.category} size={11} className="opacity-60" />
                {tool.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recently Used ─────────────────────────────────────────── */}
      <RecentlyUsedSection />

      {/* ── Featured tools ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{isRu ? "Популярные инструменты" : "Featured Tools"}</h2>
            <p className="mt-0.5 text-sm text-text-muted">{isRu ? "Наиболее используемые из каждой категории" : "Most-used across every category"}</p>
          </div>
          <Link href={localePath(locale, "/tools")} className="text-sm text-link hover:underline shrink-0">{isRu ? "Все →" : "All tools →"}</Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {featuredTools.slice(0, 6).map((t) => (
            <div key={t.slug} className="animate-fade-in"><ToolCard tool={t} /></div>
          ))}
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface/30 py-14">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-6 text-lg font-semibold text-text-primary">{isRu ? "Категории" : "Categories"}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 stagger">
            {localizedCats.map((cat) => {
              const count = allTools.filter((t) => t.category === cat.slug && t.isImplemented).length;
              return (
                <Link key={cat.slug} href={localePath(locale, `/categories/${cat.slug}`)}
                  className="animate-fade-in group flex flex-col gap-3 rounded-lg border border-border bg-canvas p-4 transition-all duration-150 hover:border-accent/40 hover:bg-surface">
                  <span className="text-text-muted group-hover:text-accent transition-colors">
                    <CategoryIcon category={cat.slug} size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{cat.name}</p>
                    <p className="text-xs text-text-muted">{count} {isRu ? "инстр." : "tools"}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Popular ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="mb-6 text-lg font-semibold text-text-primary">{isRu ? "Часто используемые" : "Popular Tools"}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger">
          {popularTools.map((t) => (
            <div key={t.slug} className="animate-fade-in"><ToolCard tool={t} /></div>
          ))}
        </div>
      </section>

      {/* ── AI section ────────────────────────────────────────────── */}
      <section id="ai" className="border-t border-border bg-surface/30 py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-lg font-semibold text-text-primary">{isRu ? "AI-инструменты" : "AI-Powered Tools"}</h2>
            <span className="rounded-md border border-violet-500/25 bg-violet-500/8 px-2 py-0.5 text-xs font-medium text-violet-400">
              {isRu ? "Скоро" : "Coming Soon"}
            </span>
          </div>
          <p className="mb-6 max-w-lg text-sm text-text-muted">
            {isRu
              ? "AI-слой поверх существующих инструментов для объяснения и генерации — запланировано как Pro-функция."
              : "An AI layer on top of the same fast tools for explanation and generation — planned as a Pro feature."}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger">
            {localizedAI.map((tool) => (
              <div key={tool.name} className="animate-fade-in flex items-start gap-3 rounded-lg border border-border bg-canvas p-4 opacity-60">
                <div className="mt-0.5 shrink-0">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-primary">{tool.name}</h3>
                  <p className="mt-1 text-xs text-text-muted">{tool.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
