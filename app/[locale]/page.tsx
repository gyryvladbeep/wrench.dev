import Link from "next/link";
import { Metadata } from "next";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { allTools, getPopularTools, getFeaturedTools, categories, aiTools } from "@/lib/tools-registry";
import { localizeTools, localizeCategories, localizeAiTools } from "@/lib/i18n/localize";
import { buildPageMetadata } from "@/lib/seo";
import { HeroLiveDemo } from "@/components/HeroLiveDemo";
import { ToolCard } from "@/components/ToolCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecentlyUsedSection } from "@/components/RecentlyUsedSection";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  return buildPageMetadata(locale, "/", `${dict.site.tagline} | Dev Toolbox`, dict.site.description);
}

const CATEGORY_ICONS: Record<string, string> = {
  formatting: "{ }", encoding: "⇄", text: "Aa", hash: "#",
  generators: "⚡", datetime: "⏱", web: "🌐", data: "⊞", qa: "✓", api: "→",
};

export default function HomePage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const isRu = locale === "ru";

  const featuredTools = localizeTools(getFeaturedTools(), locale);
  const popularTools  = localizeTools(getPopularTools(), locale);
  const localizedCats = localizeCategories(categories, locale);
  const localizedAI   = localizeAiTools(aiTools, locale);
  const totalCount    = allTools.filter((t) => t.isImplemented).length;

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.03] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/[0.04] blur-[80px] rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-6 pt-16 pb-10 text-center">
          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-4 py-1.5 text-xs text-accent">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            {isRu
              ? `${totalCount} инструментов · без регистрации · всё в браузере`
              : `${totalCount} tools · no signup · runs in your browser`}
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-text-primary md:text-5xl lg:text-6xl">
            {isRu ? (
              <><span className="text-accent font-mono">&gt;_</span> Инструменты<br />разработчика</>
            ) : (
              <><span className="text-accent font-mono">&gt;_</span> Developer<br />toolbox</>
            )}
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-lg text-text-muted">
            {isRu
              ? "Форматируй, валидируй, генерируй и отлаживай быстрее — всё в одном месте."
              : "Format, validate, generate and debug faster — everything in one place."}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={localePath(locale, "/tools")}
              className="rounded-[10px] bg-accent px-6 py-2.5 text-sm font-semibold text-accent-fg hover:bg-accent/90 transition-colors"
            >
              {isRu ? "Все инструменты" : "Browse All Tools"}
            </Link>
            <Link
              href={localePath(locale, "/categories/text")}
              className="rounded-[10px] border border-border bg-surface px-6 py-2.5 text-sm text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              {isRu ? "Текстовые инструменты" : "Text Tools"}
            </Link>
          </div>

          {/* Live demo */}
          <div className="mt-8">
            <HeroLiveDemo dict={dict} />
            <p className="mt-2 text-xs text-text-muted">
              {isRu
                ? "Без регистрации. Всё выше работает в вашем браузере прямо сейчас."
                : "No signup needed. Everything above runs in your browser right now."}
            </p>
          </div>
        </div>
      </section>

      {/* ── Quick access bar ──────────────────────────────────────────────── */}
      <section className="border-b border-border bg-surface/50">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
            <span className="shrink-0 text-xs text-text-muted mr-1">
              {isRu ? "Быстрый доступ:" : "Quick access:"}
            </span>
            {popularTools.slice(0, 7).map((tool) => (
              <Link
                key={tool.slug}
                href={localePath(locale, `/tools/${tool.slug}`)}
                className="shrink-0 rounded-full border border-border bg-canvas px-3 py-1 text-xs text-text-muted hover:border-accent/40 hover:text-text-primary transition-colors"
              >
                {CATEGORY_ICONS[tool.category] ?? "→"} {tool.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recently Used (client) ─────────────────────────────────────────── */}
      <RecentlyUsedSection />

      {/* ── Featured Tools ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {isRu ? "🔥 Популярные инструменты" : "🔥 Featured Tools"}
            </h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {isRu ? "Самые используемые в каждой категории" : "Most-used across every category"}
            </p>
          </div>
          <Link href={localePath(locale, "/tools")} className="text-sm text-link hover:underline shrink-0">
            {isRu ? "Все →" : "View all →"}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {featuredTools.slice(0, 6).map((tool) => (
            <div key={tool.slug} className="animate-fade-in">
              <ToolCard tool={tool} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface/30 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-6 text-xl font-semibold text-text-primary">
            {isRu ? "📂 Категории" : "📂 Browse Categories"}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 stagger">
            {localizedCats.map((cat) => {
              const count = allTools.filter((t) => t.category === cat.slug && t.isImplemented).length;
              return (
                <Link
                  key={cat.slug}
                  href={localePath(locale, `/categories/${cat.slug}`)}
                  className="animate-fade-in group flex flex-col items-center gap-2 rounded-[10px] border border-border bg-canvas p-4 text-center transition-all hover:border-accent/40 hover:bg-surface"
                >
                  <span className="text-2xl leading-none">{
                    { formatting:"{ }", encoding:"⇄", text:"Aa", hash:"#", generators:"⚡",
                      datetime:"⏱", web:"🌐", data:"⊞", qa:"✓", api:"→" }[cat.slug] ?? "→"
                  }</span>
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

      {/* ── Popular tools grid ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-6 text-xl font-semibold text-text-primary">
          {isRu ? "⭐ Часто используемые" : "⭐ Popular Tools"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger">
          {popularTools.map((tool) => (
            <div key={tool.slug} className="animate-fade-in">
              <ToolCard tool={tool} />
            </div>
          ))}
        </div>
      </section>

      {/* ── AI Coming Soon ────────────────────────────────────────────────── */}
      <section id="ai" className="border-t border-border bg-surface/30 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xl font-semibold text-text-primary">
              {isRu ? "🤖 AI-инструменты" : "🤖 AI-Powered Tools"}
            </h2>
            <Badge variant="pro">{isRu ? "Скоро" : "Coming Soon"}</Badge>
          </div>
          <p className="mb-6 max-w-2xl text-sm text-text-muted">
            {isRu
              ? "Те же быстрые инструменты с AI-слоем для объяснения и генерации — запланировано как Pro-функция."
              : "The same fast tools, with an AI layer for explanation and generation — planned as a Pro feature."}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger">
            {localizedAI.map((tool) => (
              <div key={tool.name} className="animate-fade-in flex items-start gap-3 rounded-[10px] border border-border bg-canvas p-4 opacity-70">
                <span className="mt-0.5 text-xl">🤖</span>
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
