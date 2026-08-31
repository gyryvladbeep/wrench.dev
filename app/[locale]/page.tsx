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

const STATS = [
  { value: "70+",  labelEn: "Tools",        labelRu: "Инструментов" },
  { value: "56",   labelEn: "Challenges",   labelRu: "Задач" },
  { value: "100%", labelEn: "In browser",   labelRu: "В браузере" },
  { value: "Free", labelEn: "Forever",      labelRu: "Навсегда" },
];

const FEATURES = [
  {
    icon: "🔒",
    titleEn: "Private by default",
    titleRu: "Приватность по умолчанию",
    descEn: "Everything runs in your browser. Your data never leaves your device.",
    descRu: "Всё работает в браузере. Данные не покидают твоё устройство.",
  },
  {
    icon: "⚡",
    titleEn: "Instant results",
    titleRu: "Мгновенные результаты",
    descEn: "No loading spinners. No server round-trips. Just type and get results.",
    descRu: "Никаких спиннеров. Никаких запросов на сервер. Просто вводи и получай.",
  },
  {
    icon: "🎯",
    titleEn: "Built for QA & Devs",
    titleRu: "Для QA и разработчиков",
    descEn: "Every tool designed for real daily workflows — not generic toy demos.",
    descRu: "Каждый инструмент создан для реальной ежедневной работы.",
  },
  {
    icon: "🏆",
    titleEn: "Learn while you work",
    titleRu: "Учись в процессе",
    descEn: "Daily challenges, interview prep and leaderboards to sharpen your skills.",
    descRu: "Ежедневные задачи, подготовка к интервью и лидерборды.",
  },
];

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
      <section className="relative overflow-hidden border-b border-border">
        {/* Background grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        {/* Glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--accent)" }} />

        <div className="relative mx-auto max-w-5xl px-5 py-16">
          {/* Badge row */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[11px] text-text-muted font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              {totalCount} {isRu ? "инструментов" : "tools"}
            </span>
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] text-text-muted">
              {isRu ? "работает в браузере" : "runs in your browser"}
            </span>
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] text-text-muted">
              {isRu ? "без регистрации" : "no account needed"}
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary md:text-5xl leading-tight">
            {isRu ? (
              <>Инструменты разработчика<br />
              <span style={{ color: "var(--accent)" }}>и QA</span> в одном месте</>
            ) : (
              <>Developer & <span style={{ color: "var(--accent)" }}>QA tools</span><br />in one workspace</>
            )}
          </h1>
          <p className="mt-4 max-w-lg text-text-secondary text-base leading-relaxed">
            {isRu
              ? "Быстрые, приватные утилиты для форматирования, кодирования, тестирования и отладки. Без регистрации."
              : "Fast, privacy-conscious utilities for formatting, encoding, QA testing and debugging. No signup required."}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={localePath(locale, "/tools")}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-accent-fg transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "var(--accent)" }}>
              {isRu ? "Все инструменты" : "Browse tools"}
            </Link>
            <Link href={localePath(locale, "/challenges")}
              className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-hover hover:border-border-focus transition-all">
              {isRu ? "Попробовать Challenges" : "Try Challenges"}
            </Link>
          </div>

          <HeroLiveDemo dict={dict} />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-border bg-surface/30">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.value} className="text-center">
                <p className="text-3xl font-bold text-text-primary" style={{ color: "var(--accent)" }}>{s.value}</p>
                <p className="mt-1 text-xs text-text-muted">{isRu ? s.labelRu : s.labelEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recently Used ── */}
      <RecentlyUsedSection />

      {/* ── Featured ── */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-text-primary">{isRu ? "Популярные инструменты" : "Featured Tools"}</h2>
            <p className="text-xs text-text-muted mt-0.5">{isRu ? "Самые используемые на платформе" : "Most used on the platform"}</p>
          </div>
          <Link href={localePath(locale, "/tools")} className="text-xs text-link hover:underline flex items-center gap-1">
            {isRu ? "Все инструменты" : "All tools"} →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3 border border-border rounded-xl overflow-hidden bg-border">
          {featuredTools.slice(0, 6).map((t) => (
            <div key={t.slug} className="bg-canvas hover:bg-surface transition-colors">
              <ToolCard tool={t} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-y border-border py-14" style={{ background: "color-mix(in srgb, var(--accent) 3%, transparent)" }}>
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-text-primary">{isRu ? "Почему Wrench?" : "Why Wrench?"}</h2>
            <p className="mt-2 text-sm text-text-muted">{isRu ? "Создан разработчиками для разработчиков" : "Built by developers for developers"}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.icon} className="rounded-xl border border-border bg-canvas p-5 hover:border-[var(--accent)]/30 hover:bg-surface transition-all group">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-3 text-sm font-semibold text-text-primary group-hover:text-[var(--accent)] transition-colors">
                  {isRu ? f.titleRu : f.titleEn}
                </h3>
                <p className="mt-1.5 text-xs text-text-muted leading-relaxed">
                  {isRu ? f.descRu : f.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-text-primary">{isRu ? "Категории" : "Categories"}</h2>
            <p className="text-xs text-text-muted mt-0.5">{isRu ? "Инструменты сгруппированы по назначению" : "Tools organized by purpose"}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {localizedCats.map((cat) => {
              const count = allTools.filter((t) => t.category === cat.slug && t.isImplemented).length;
              return (
                <Link key={cat.slug} href={localePath(locale, `/categories/${cat.slug}`)}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-canvas p-4 transition-all hover:border-[var(--accent)]/40 hover:bg-surface hover:scale-[1.02]">
                  <span className="shrink-0 text-text-muted group-hover:text-[var(--accent)] transition-colors">
                    <CategoryIcon category={cat.slug} size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{cat.name}</p>
                    <p className="text-xs text-text-muted">{count} {isRu ? "шт" : "tools"}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Challenges CTA ── */}
      <section className="border-y border-border py-14">
        <div className="mx-auto max-w-5xl px-5">
          <div className="rounded-2xl border p-8 text-center relative overflow-hidden"
            style={{ borderColor: "var(--accent)30", background: "color-mix(in srgb, var(--accent) 5%, transparent)" }}>
            <div className="pointer-events-none absolute inset-0 opacity-5"
              style={{ backgroundImage: "radial-gradient(var(--accent) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
            <span className="relative text-4xl">🏆</span>
            <h2 className="relative mt-4 text-2xl font-bold text-text-primary">
              {isRu ? "Прокачай свои навыки" : "Level up your skills"}
            </h2>
            <p className="relative mt-2 text-sm text-text-secondary max-w-md mx-auto">
              {isRu
                ? "Ежедневные задачи для QA, Frontend и Backend разработчиков. Решай, зарабатывай очки, поднимай уровень."
                : "Daily challenges for QA, Frontend and Backend engineers. Solve problems, earn points, level up."}
            </p>
            <div className="relative mt-6 flex flex-wrap gap-3 justify-center">
              <Link href={localePath(locale, "/challenges")}
                className="rounded-lg px-6 py-2.5 text-sm font-semibold text-accent-fg transition-all hover:opacity-90"
                style={{ background: "var(--accent)" }}>
                {isRu ? "Начать решать →" : "Start solving →"}
              </Link>
              <Link href={localePath(locale, "/interview")}
                className="rounded-lg border border-border bg-canvas px-6 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface transition-colors">
                {isRu ? "Interview Prep" : "Interview Prep"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Popular ── */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-text-primary">{isRu ? "Часто используемые" : "Popular Tools"}</h2>
          <p className="text-xs text-text-muted mt-0.5">{isRu ? "Инструменты которые используют чаще всего" : "The tools everyone keeps coming back to"}</p>
        </div>
        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-xl overflow-hidden bg-border">
          {popularTools.map((t) => (
            <div key={t.slug} className="bg-canvas hover:bg-surface transition-colors">
              <ToolCard tool={t} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Pro CTA ── */}
      <section className="border-t border-border py-14 bg-surface/30">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <span className="inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400 mb-4">Pro</span>
          <h2 className="text-2xl font-bold text-text-primary">
            {isRu ? "Безлимитный доступ — $5/мес" : "Unlimited access — $5/mo"}
          </h2>
          <p className="mt-3 text-sm text-text-muted max-w-md mx-auto">
            {isRu
              ? "Безлимитные AI-генерации, полный архив задач, приоритетная поддержка."
              : "Unlimited AI generations, full challenge archive, priority support."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link href={localePath(locale, "/pro")}
              className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-6 py-2.5 text-sm font-semibold text-violet-400 hover:bg-violet-500/20 transition-colors">
              {isRu ? "Перейти на Pro →" : "Upgrade to Pro →"}
            </Link>
            <Link href={localePath(locale, "/tools")}
              className="rounded-lg border border-border px-6 py-2.5 text-sm text-text-muted hover:bg-surface transition-colors">
              {isRu ? "Остаться на Free" : "Stay on Free"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}