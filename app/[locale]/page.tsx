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

export default function HomePage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);

  const popularTools   = localizeTools(getPopularTools(), locale);
  const featuredTools  = localizeTools(getFeaturedTools(), locale);
  const localizedCats  = localizeCategories(categories, locale);
  const localizedAI    = localizeAiTools(aiTools, locale);

  const totalCount = allTools.filter((t) => t.isImplemented).length;

  const isRu = locale === "ru";

  return (
    <div>
      {/* ── Hero ── */}
      <section className="mx-auto max-w-4xl px-6 pt-14 pb-6 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-muted">
          <span className="text-accent">✓</span>
          {isRu ? `${totalCount} инструментов — без регистрации, всё в браузере` : `${totalCount} tools — no signup, all in your browser`}
        </div>
        <h1 className="text-3xl font-semibold text-text-primary md:text-5xl leading-tight">
          {isRu ? "Инструменты разработчика,\nкоторые реально пригодятся" : "Developer tools you'll\nactually use every day."}
        </h1>
        <p className="mt-4 text-lg text-text-muted">
          {isRu ? "Форматируй, валидируй, генерируй и отлаживай быстрее." : "Format, validate, generate and debug faster."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={localePath(locale, "/tools")}
            className="rounded-[10px] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent/90">
            {isRu ? "Все инструменты" : "Browse All Tools"}
          </Link>
          <Link href={localePath(locale, "/categories/text")}
            className="rounded-[10px] border border-border bg-surface px-5 py-2.5 text-sm text-text-muted hover:bg-surface-hover">
            {isRu ? "Текстовые" : "Text Tools"}
          </Link>
        </div>
        <HeroLiveDemo dict={dict} />
        <p className="mt-2 text-xs text-text-muted">
          {isRu ? "Без регистрации. Всё выше работает в вашем браузере." : "No signup. Everything above ran in your browser."}
        </p>
      </section>

      {/* ── Recently Used (client component, reads localStorage) ── */}
      <RecentlyUsedSection />

      {/* ── Featured Tools ── */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-text-primary">
            {isRu ? "Популярные инструменты" : "Featured Tools"}
          </h2>
          <Link href={localePath(locale, "/tools")} className="text-sm text-link hover:underline">
            {isRu ? "Все →" : "All tools →"}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTools.slice(0, 6).map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      {/* ── Categories grid ── */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-xl font-semibold text-text-primary mb-5">
          {isRu ? "Категории" : "Categories"}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {localizedCats.map((cat) => {
            const count = allTools.filter((t) => t.category === cat.slug && t.isImplemented).length;
            return (
              <Link key={cat.slug} href={localePath(locale, `/categories/${cat.slug}`)}
                className="group rounded-[10px] border border-border bg-surface p-4 text-center transition-colors hover:bg-surface-hover hover:border-accent/40">
                <p className="font-medium text-text-primary group-hover:text-accent transition-colors">{cat.name}</p>
                <p className="mt-1 text-xs text-text-muted">{count} {isRu ? "инстр." : "tools"}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Popular tools ── */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-xl font-semibold text-text-primary mb-5">
          {isRu ? "Часто используемые" : "Popular Tools"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      {/* ── AI Coming Soon ── */}
      <section id="ai" className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-semibold text-text-primary">
            {isRu ? "AI-инструменты" : "AI-Powered Tools"}
          </h2>
          <Badge variant="pro">{isRu ? "Скоро" : "Coming Soon"}</Badge>
        </div>
        <p className="mb-5 max-w-2xl text-sm text-text-muted">
          {isRu
            ? "Те же быстрые инструменты, плюс AI для объяснения и генерации — запланировано как Pro-функция."
            : "The same fast tools above, plus an AI layer for explanation and generation — planned as a Pro feature."}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {localizedAI.map((tool) => (
            <Card key={tool.name} className="opacity-70">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-text-primary">{tool.name}</h3>
                <Badge variant="pro">AI</Badge>
              </div>
              <p className="mt-2 text-sm text-text-muted">{tool.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
