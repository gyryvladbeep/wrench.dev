"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { localePath } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/dict-context";
import { GameIcon, GameIconId, CloseIcon } from "@/components/icons/GameIcons";
import { ROLE_META, ChallengeRole } from "@/lib/challenges/types";
import { pickContinueCandidate, ContinueCandidate, TrainerProgressRow, LatestWorkbenchRow } from "@/lib/continue-widget";

// ═══════════════════════════════════════════════════════════════
// «Продолжить с места» — ненавязчивый виджет на главной
// ═══════════════════════════════════════════════════════════════
// Сам выбор — какую из трёх подсказок показать (или не показывать
// ничего) — чистая функция pickContinueCandidate() в
// lib/continue-widget.ts, протестированная отдельно без браузера (см.
// tests/continue-widget.spec.ts). Этот компонент только достаёт сырые
// строки из Supabase параллельно (Promise.all — иначе самый частый
// случай, "продолжать нечего", был бы ещё и самым медленным из-за трёх
// последовательных round-trip) и строит вокруг результата href/иконку/
// текст, которые зависят от locale и потому не могут жить в чистой
// функции.
//
// Ничего не показываем, пока не убедились, что показывать есть что —
// та же SSR-безопасная схема, что у StreakRiskBanner.tsx/OnboardingBanner.tsx:
// show стартует false и переключается только внутри эффекта, до этого
// компонент рендерит null.

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Датированный ключ — дизмисс "забывается" на следующий день (тот же
// приём, что и в StreakRiskBanner.tsx): если продолжить всё ещё есть
// что, виджет вернётся завтра, возможно уже с другой подсказкой.
function dismissKey(date: string): string {
  return `wrench_continue_dismissed_${date}`;
}

const ICON_BY_KIND: Record<ContinueCandidate["kind"], GameIconId> = {
  challenge: "target",
  trainer: "brackets",
  workbench: "wrench",
};

export function ContinueWidget() {
  const { user }    = useAuth();
  const { locale }  = useDict();
  const isRu        = locale === "ru";
  const [candidate, setCandidate] = useState<ContinueCandidate | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user) { setShow(false); return; }
    if (localStorage.getItem(dismissKey(today()))) return;

    let cancelled = false;
    const supabase = createClient();

    type ChallengeAttemptRow = { challenge_id: string; challenge: { role: ChallengeRole } | { role: ChallengeRole }[] | null };

    Promise.all([
      // UNIQUE(user_id, challenge_id) в схеме (supabase/challenges-schema.sql)
      // гарантирует не больше одной строки на пару, так что limit(1) по
      // completed_at — это и есть "последняя незакрытая попытка", без
      // риска задвоения.
      supabase.from("challenge_attempts")
        .select("challenge_id, challenge:challenges(role)")
        .eq("user_id", user.id).eq("is_correct", false)
        .order("completed_at", { ascending: false }).limit(1),
      supabase.from("trainer_progress").select("exercise_id, solved_at").eq("user_id", user.id),
      // Только самый свежий workbench — если даже он не правился
      // WORKBENCH_STALE_DAYS дней, остальные и подавно (см. комментарий
      // в lib/continue-widget.ts).
      supabase.from("workbenches").select("name, tool_slugs, updated_at")
        .eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1),
    ]).then(([attemptsRes, progressRes, workbenchRes]) => {
      if (cancelled) return;

      const attempts = (attemptsRes.data as ChallengeAttemptRow[] | null) ?? [];
      const ch = attempts[0]?.challenge;
      const unsolvedChallengeRole = (Array.isArray(ch) ? ch[0]?.role : ch?.role) ?? null;

      const result = pickContinueCandidate({
        unsolvedChallengeRole,
        trainerProgress: (progressRes.data as TrainerProgressRow[] | null) ?? [],
        latestWorkbench: ((workbenchRes.data as LatestWorkbenchRow[] | null) ?? [])[0] ?? null,
      });

      if (result) {
        setCandidate(result);
        setShow(true);
      }
    });

    return () => { cancelled = true; };
  }, [user, locale]);

  function dismiss() {
    localStorage.setItem(dismissKey(today()), "1");
    setShow(false);
  }

  if (!show || !candidate) return null;

  const roleLabel = candidate.kind === "challenge" ? ROLE_META[candidate.role] : null;
  const href =
    candidate.kind === "challenge" ? localePath(locale, `/challenges/${candidate.role}`) :
    candidate.kind === "trainer"   ? localePath(locale, "/trainer") :
    localePath(locale, "/workbench");

  return (
    <div className="mx-auto max-w-6xl px-5">
      <div className="mb-2 flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 card-shine animate-fade-in">
        <span className="shrink-0 text-accent"><GameIcon id={ICON_BY_KIND[candidate.kind]} size={16} /></span>
        <p className="flex-1 min-w-0 text-sm text-text-secondary">
          <span className="text-text-muted">{isRu ? "Продолжить: " : "Continue: "}</span>
          {candidate.kind === "challenge" && roleLabel && (
            isRu
              ? `Есть нерешённый челлендж по роли «${roleLabel.labelRu}» — вернись и попробуй ещё раз.`
              : `You have an unsolved ${roleLabel.label} challenge — come back and give it another shot.`
          )}
          {candidate.kind === "trainer" && (
            isRu
              ? `Трек «${candidate.categoryLabelRu}» в тренажёре не пройден до конца (${candidate.solved}/${candidate.total}).`
              : `Your "${candidate.categoryLabel}" track in the Trainer isn't finished (${candidate.solved}/${candidate.total}).`
          )}
          {candidate.kind === "workbench" && (
            isRu
              ? `Рабочий стол «${candidate.name}» (${candidate.toolCount} инстр.) давно не открывался.`
              : `Your "${candidate.name}" Workbench (${candidate.toolCount} tools) hasn't been opened in a while.`
          )}
        </p>
        <Link href={href}
          className="shrink-0 rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-colors hover:bg-amber-400">
          {candidate.kind === "challenge" && (isRu ? "К челленджам" : "To challenges")}
          {candidate.kind === "trainer" && (isRu ? "В тренажёр" : "To Trainer")}
          {candidate.kind === "workbench" && (isRu ? "Открыть" : "Open it")}
        </Link>
        <button onClick={dismiss} aria-label={isRu ? "Закрыть" : "Dismiss"}
          className="shrink-0 rounded p-1 text-text-muted hover:text-text-primary transition-colors">
          <CloseIcon size={12} />
        </button>
      </div>
    </div>
  );
}
