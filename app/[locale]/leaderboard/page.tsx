import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { buildPageMetadata, buildLeaderboardJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { LeaderboardEntry, LEADERBOARD_SIZE } from "@/lib/leaderboard";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { GameIcon } from "@/components/icons/GameIcons";

// Публичный, анонимный, одинаковый для всех посетителей рейтинг —
// ровно тот же случай, что и соц-proof на главной (см. комментарий у
// getPlatformStats() и createPublicSupabaseClient() в app/[locale]/page.tsx
// и lib/supabase/public.ts): клиент без cookies(), поэтому ISR ниже
// реально работает, а не рендерится заново при каждом запросе.
//
// В отличие от /people, /digest и /salary (те — тонкая серверная
// page.tsx только ради метаданных + клиентский компонент, который сам
// делает fetch на маунте), эта страница получает данные прямо на
// сервере: пункт 22 из ROADMAP-BRAINSTORM.md явно просит "вечнозелёную,
// шарабельную, SEO-страницу" — а не только срез в дайджесте — и топ-50
// в отданном HTML, а не в пустой клиентской оболочке, ровно то, что
// делает страницу настоящей SEO-страницей, а не ещё одним экраном
// дайджеста.
export const revalidate = 3600;

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("get_wrench_score_leaderboard", { p_limit: LEADERBOARD_SIZE });
    if (error || !data) return [];
    return data as LeaderboardEntry[];
  } catch {
    // Любая сетевая/конфигурационная ошибка — пустой список, страница
    // всё равно рендерится (с текстом "пока никто не набрал очков"),
    // не должна ронять сборку/ISR-обновление целиком.
    return [];
  }
}

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/leaderboard",
    isRu ? "Лидерборд Wrench Score — Wrench-Branch" : "Wrench Score Leaderboard — Wrench-Branch",
    isRu
      ? "Топ-50 публичных профилей Wrench-Branch по очкам Wrench Score — стрики, решённые челленджи, бейджи и использованные инструменты."
      : "Top 50 public Wrench-Branch profiles by Wrench Score — streaks, solved challenges, badges and tools used."
  );
}

export default async function LeaderboardPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  const entries = await getLeaderboard();

  const homeLabel = isRu ? "Главная" : "Home";
  const leaderboardLabel = isRu ? "Лидерборд Wrench Score" : "Wrench Score Leaderboard";

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <JsonLd data={buildLeaderboardJsonLd(locale, homeLabel, leaderboardLabel, entries)} />

      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-canvas text-accent">
          <GameIcon id="trophy" size={22} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">{leaderboardLabel}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {isRu
            ? "Топ-50 участников по Wrench Score — очки за решённые челленджи, стрики, использованные инструменты и заработанные бейджи. Обновляется каждый час."
            : "The top 50 members by Wrench Score — points for solved challenges, streaks, tools used and earned badges. Updates hourly."}
        </p>
      </div>

      <LeaderboardTable locale={locale} entries={entries} />

      <p className="mt-6 text-center text-xs text-text-muted">
        {isRu
          ? "Свой профиль не видите в списке? Сделайте его публичным на странице профиля."
          : "Don't see your own profile? Make it public from your profile page."}
      </p>
    </div>
  );
}
