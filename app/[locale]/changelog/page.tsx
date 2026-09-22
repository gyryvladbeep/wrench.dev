import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata, buildChangelogJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CHANGELOG_ENTRIES, sortChangelogEntries, groupChangelogByMonth, formatChangelogMonthLabel, ChangelogTag } from "@/lib/changelog";
import { GameIcon } from "@/components/icons/GameIcons";

// Пункт 24 из ROADMAP-BRAINSTORM.md — "простое 'что нового'" как сигнал
// доверия и готовый контент для Reddit/Telegram/Habr. В отличие от
// /leaderboard и /salary/report, контент тут не из Supabase — целиком
// статический curated-список (см. lib/changelog.ts), поэтому страница
// обычный серверный компонент без getXxx()/try-catch на сетевые сбои и
// без revalidate: она меняется только с новым деплоем кода, ISR тут
// нечего инвалидировать раньше самого деплоя.
const TAG_STYLES: Record<ChangelogTag, string> = {
  feature:     "bg-accent/10 text-accent",
  improvement: "bg-violet-500/10 text-violet-400",
  fix:         "bg-amber-500/10 text-amber-400",
};
const TAG_LABELS: Record<ChangelogTag, { en: string; ru: string }> = {
  feature:     { en: "New",         ru: "Новое" },
  improvement: { en: "Improvement", ru: "Улучшение" },
  fix:         { en: "Fix",         ru: "Исправление" },
};

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/changelog",
    isRu ? "Что нового — Wrench-Branch" : "Changelog — Wrench-Branch",
    isRu
      ? "Что нового в Wrench-Branch — новые инструменты, функции и улучшения, по мере выхода."
      : "What's new in Wrench-Branch — new tools, features and improvements, as they ship."
  );
}

export default async function ChangelogPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";

  const sorted = sortChangelogEntries(CHANGELOG_ENTRIES);
  const groups = groupChangelogByMonth(sorted);

  const homeLabel = isRu ? "Главная" : "Home";
  const changelogLabel = isRu ? "Что нового" : "Changelog";

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <JsonLd data={buildChangelogJsonLd(locale, homeLabel, changelogLabel, sorted)} />

      <div className="mb-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-canvas text-accent">
          <GameIcon id="rocket" size={22} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">{changelogLabel}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {isRu
            ? "Новые инструменты, функции и улучшения Wrench-Branch — по мере выхода, без маркетингового шума."
            : "New tools, features and improvements in Wrench-Branch — as they ship, no marketing fluff."}
        </p>
      </div>

      <div className="space-y-10">
        {groups.map((group) => (
          <div key={group.monthKey}>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
              {formatChangelogMonthLabel(group.monthKey, isRu)}
            </h2>
            <div className="space-y-5 border-l border-border pl-5">
              {group.entries.map((entry, i) => (
                <div key={`${entry.date}-${i}`} className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full border-2 border-canvas bg-border" />
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${TAG_STYLES[entry.tag]}`}>
                      {isRu ? TAG_LABELS[entry.tag].ru : TAG_LABELS[entry.tag].en}
                    </span>
                    <time dateTime={entry.date} className="text-xs text-text-muted">
                      {new Date(`${entry.date}T00:00:00Z`).toLocaleDateString(isRu ? "ru-RU" : "en-US", { day: "numeric", month: "long", timeZone: "UTC" })}
                    </time>
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">{isRu ? entry.titleRu : entry.titleEn}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">{isRu ? entry.descriptionRu : entry.descriptionEn}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
