import Link from "next/link";
import { Metadata } from "next";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { allTools, getPopularTools, aiTools } from "@/lib/tools-registry";
import { localizeTools, localizeAiTools } from "@/lib/i18n/localize";
import { buildPageMetadata, siteConfig } from "@/lib/seo";
import { HeroLiveDemo } from "@/components/HeroLiveDemo";
import { ToolCard } from "@/components/ToolCard";
import { RecentlyUsedSection } from "@/components/RecentlyUsedSection";
import { DisciplineSectionsClient } from "@/components/DisciplineSectionsClient";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict   = getDictionary(locale);
  return buildPageMetadata(locale, "/", `${siteConfig.name} — ${siteConfig.tagline}`, dict.site.description);
}

export default function HomePage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict   = getDictionary(locale);
  const isRu   = locale === "ru";

  const popularTools  = localizeTools(getPopularTools(), locale);
  const localizedAI   = localizeAiTools(aiTools, locale);
  const totalCount    = allTools.filter((t) => t.isImplemented).length;

  return (
    <div>
      {/*
        ── Hero ──
        УРОК ПОЗИЦИОНИРОВАНИЯ (2-й раунд фидбека из Threads):
        "Заголовок про фичи, не про задачу пользователя" — первая версия
        ("The toolkit you open before work") всё ещё говорила о ПРОДУКТЕ
        ("этот тулкит"), а не о ЗАДАЧЕ читателя. Новый заголовок описывает
        конкретную, узнаваемую ситуацию — открытые вкладки со случайными
        online-тулзами — и называет её нежелательной. Это task-centric,
        а не feature-centric формулировка.
      */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded border border-border bg-surface px-2 py-0.5 text-xs text-text-muted font-mono">
              {totalCount} {isRu ? "инструментов" : "tools"}
            </span>
            <span className="text-xs text-text-muted">·</span>
            <span className="text-xs text-text-muted">{isRu ? "работает в браузере" : "runs in your browser"}</span>
            <span className="text-xs text-text-muted">·</span>
            <span className="text-xs text-text-muted">{isRu ? "без регистрации" : "no account needed"}</span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
            {isRu
              ? "Хватит держать десять вкладок\nради десяти мелких тулз"
              : "Stop keeping ten tabs open\nfor ten tiny tools"}
          </h1>
          <p className="mt-3 max-w-xl text-text-secondary text-sm leading-relaxed">
            {isRu
              ? "«Online JSON formatter», «regex tester», «uuid generator» — каждый раз новый безымянный сайт, непонятно кому доверяющий твои данные. Wrench — одно место для QA, фронтенда, бэкенда и DevOps, где всё считается прямо в браузере."
              : "\"Online JSON formatter\", \"regex tester\", \"uuid generator\" — a different anonymous site every time, no idea who's handling your data. Wrench is one place for QA, frontend, backend and DevOps engineers, where everything runs client-side."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={localePath(locale, "/tools")}
              className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-amber-400 transition-colors">
              {isRu ? "Все инструменты" : "Browse tools"}
            </Link>
          </div>

          <HeroLiveDemo dict={dict} />
        </div>
      </section>

      {/*
        ── Why switch ──
        Прямой ответ на "как ЦА решает это сейчас и зачем переходить к
        вам" из фидбека. Явное сравнение текущей альтернативы (случайные
        одноразовые сайты) с тем что реально отличает Wrench — приватность
        через отсутствие серверных запросов, единая консистентная среда,
        отсутствие рекламы/трекеров которыми обычно напичканы такие сайты.
      */}
      <section className="border-b border-border bg-surface/30">
        <div className="mx-auto max-w-5xl px-5 py-12">
          <h2 className="text-lg font-semibold text-text-primary mb-6">
            {isRu ? "Как это решают сейчас — и почему стоит перейти" : "How this gets solved today — and why switch"}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                {isRu ? "Сейчас" : "Right now"}
              </p>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>{isRu ? "Гуглишь «online json formatter» заново каждый раз" : "Google \"online json formatter\" again, every single time"}</li>
                <li>{isRu ? "Незнакомый сайт с рекламой и непонятной обработкой данных" : "An unfamiliar site full of ads, unclear what happens to your data"}</li>
                <li>{isRu ? "У каждого сайта свой интерфейс — привыкать заново" : "A different UI on every site — relearning it each time"}</li>
                <li>{isRu ? "Десятки вкладок в браузере ради мелких задач" : "Dozens of open tabs for tiny one-off tasks"}</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                {isRu ? "С Wrench" : "With Wrench"}
              </p>
              <ul className="space-y-2 text-sm text-text-primary">
                <li>{isRu ? "Один адрес, все инструменты, всегда под рукой" : "One address, every tool, always at hand"}</li>
                <li>{isRu ? "Всё считается локально в браузере — данные никуда не уходят" : "Everything computes client-side — your data never leaves the browser"}</li>
                <li>{isRu ? `Единый интерфейс для всех ${totalCount}+ инструментов` : `One consistent interface across all ${totalCount}+ tools`}</li>
                <li>{isRu ? "Бесплатно навсегда, без рекламы и трекеров" : "Free forever, no ads, no trackers"}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recently Used ── */}
      <RecentlyUsedSection />

      {/*
        ── Discipline sections ──
        Заменяет старую плоскую сетку "Featured" + "Categories" (75
        карточек подряд без структуры — источник фидбека "мешанина
        тулзов"). Теперь инструменты явно сгруппированы по 4 дисциплинам
        инженерии, с ролевым баннером сверху который переставляет порядок
        под предпочтение конкретного человека, не пряча остальное.
      */}
      <div className="mx-auto max-w-6xl px-5">
        <DisciplineSectionsClient locale={locale} isRu={isRu} />
      </div>

      {/* ── Popular (cross-discipline) ── */}
      <section className="border-t border-border mx-auto max-w-6xl px-5 py-12">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-text-muted">
          {isRu ? "Часто используемые" : "Popular Across the Board"}
        </h2>
        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-lg overflow-hidden bg-border stagger">
          {popularTools.map((t) => (
            <div key={t.slug} className="bg-canvas animate-fade-in">
              <ToolCard tool={t} />
            </div>
          ))}
        </div>
      </section>

      {/*
        ── Daily Challenges ──
        УРОК: раньше это была одна кнопка рядом с "Browse tools" в hero —
        фидбек справедливо указал что это выглядело как случайная вторая
        функция без объяснения. Challenges — самостоятельная ценность
        (практика навыков, а не просто утилита), поэтому заслуживает
        отдельного блока с собственным объяснением "зачем это", а не
        строчки текста на кнопке.
      */}
      <section className="border-t border-border py-12">
        <div className="mx-auto max-w-5xl px-5">
          <div className="rounded-xl border border-border bg-surface/50 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                  {isRu ? "Не только утилиты" : "Beyond utilities"}
                </p>
                <h2 className="text-lg font-semibold text-text-primary mb-2">
                  {isRu ? "Ежедневные задачи для практики" : "Daily Challenges to keep skills sharp"}
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed max-w-md">
                  {isRu
                    ? "Короткие QA, frontend и backend задачи каждый день — для тех кто хочет не растерять навыки между проектами или готовится к собеседованиям."
                    : "Short QA, frontend and backend problems every day — for staying sharp between projects or prepping for interviews."}
                </p>
              </div>
              <Link href={localePath(locale, "/challenges")}
                className="shrink-0 rounded bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-amber-400 transition-colors text-center">
                {isRu ? "Попробовать задачу" : "Try a Challenge"}
              </Link>
            </div>
          </div>
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