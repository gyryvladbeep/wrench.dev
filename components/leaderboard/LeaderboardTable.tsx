import Link from "next/link";
import { Locale, localePath } from "@/lib/i18n/config";
import { LeaderboardEntry } from "@/lib/leaderboard";
import { getLevel } from "@/lib/wrench-score";
import { AvatarGlyph } from "@/components/profile/AvatarGlyph";
import { GameIcon } from "@/components/icons/GameIcons";

// ═══════════════════════════════════════════════════════════════
// Чисто презентационная таблица — никаких хуков, никакого "use client"
// (в отличие от PersonCard в PeopleDirectory.tsx, которому нужен стейт
// поиска/пагинации). Данные приходят готовыми пропом снаружи: и от
// серверной страницы /leaderboard (реальные строки из Supabase), и от
// временного preview-роута при визуальной проверке (заглушка) — оба
// вызывающих кода рендерят один и тот же компонент без расхождений.
// AvatarGlyph — "use client", но это не мешает импортировать его сюда:
// серверный компонент может рендерить клиентские листья дерева, просто
// не наоборот.

const TOP3_STYLE: Record<number, { color: string; bg: string; icon: "crown" | "medal" }> = {
  1: { color: "#f59e0b", bg: "#f59e0b1a", icon: "crown" },
  2: { color: "#a1a1aa", bg: "#a1a1aa1a", icon: "medal" },
  3: { color: "#c2703d", bg: "#c2703d1a", icon: "medal" },
};

function RankGlyph({ rank }: { rank: number }) {
  const top3 = TOP3_STYLE[rank];
  if (top3) {
    return (
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ color: top3.color, background: top3.bg }}
      >
        <GameIcon id={top3.icon} size={14} />
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center font-mono text-xs tabular-nums text-text-muted">
      {rank}
    </span>
  );
}

export function LeaderboardTable({ locale, entries }: { locale: Locale; entries: LeaderboardEntry[] }) {
  const isRu = locale === "ru";

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-text-muted">
          {isRu
            ? "Пока никто не набрал очков — или все скрыли профиль. Сделайте профиль публичным на /profile, чтобы попасть сюда."
            : "Nobody has scored yet — or everyone's profile is private. Make yours public on /profile to show up here."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {entries.map((entry, i) => {
        const rank = i + 1;
        const level = getLevel(entry.wrench_score);
        const name = entry.display_name || `@${entry.username}`;
        const initials = (entry.display_name || entry.username || "?")[0].toUpperCase();
        return (
          <Link
            key={entry.username}
            href={localePath(locale, `/u/${entry.username}`)}
            className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover ${
              rank < entries.length ? "border-b border-border" : ""
            }`}
          >
            <RankGlyph rank={rank} />
            <AvatarGlyph
              color={entry.avatar_color}
              emblemId={entry.avatar_emblem}
              initials={initials}
              sizeClass="h-9 w-9 text-xs"
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium text-text-primary">{name}</p>
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-px text-[10px] font-medium"
                  style={{ borderColor: level.color + "40", background: level.color + "15", color: level.color }}
                >
                  <GameIcon id={level.icon} size={9} />
                  {isRu ? level.labelRu : level.label}
                </span>
              </div>
              {/* Вторая строка — тэглайн, либо @username, но не оба
                  сразу и не дубль первой строки: если display_name нет,
                  первая строка УЖЕ показывает "@username" (см. name
                  выше), и повторять его тут же второй строкой было бы
                  бессмысленным дублем — в этом случае показываем только
                  тэглайн (если есть), а не подставляем то же самое. */}
              {(entry.tagline || entry.display_name) && (
                <p className="truncate text-xs text-text-muted">
                  {entry.tagline || `@${entry.username}`}
                </p>
              )}
            </div>
            <div className="hidden shrink-0 items-center gap-3 text-xs text-text-muted sm:flex">
              {entry.current_streak > 0 && (
                <span className="flex items-center gap-1" title={isRu ? "Текущий стрик" : "Current streak"}>
                  <GameIcon id="fire" size={12} />
                  {entry.current_streak}
                </span>
              )}
              <span title={isRu ? "Решено челленджей" : "Challenges solved"}>
                {entry.total_solved} {isRu ? "реш." : "solved"}
              </span>
            </div>
            <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-text-primary">
              {entry.wrench_score}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
