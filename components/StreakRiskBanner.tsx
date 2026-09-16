"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { localePath } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/dict-context";
import { GameIcon, CloseIcon } from "@/components/icons/GameIcons";

// today() в формате "YYYY-MM-DD" — та же конвенция, что уже использует
// ChallengeArena.tsx для сравнения с scheduled_for. last_active в
// user_streaks — колонка типа `date` (см. supabase/challenges-schema.sql),
// поэтому сравнение просто по строке, без учёта времени суток.
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Ключ дизмисса включает саму дату — баннер сам "забывает" вчерашний
// дизмисс и готов показаться снова, если риск сохраняется на следующий
// день, тем же приёмом, что и постоянные localStorage-дизмиссы в
// остальном проекте (см. OnboardingBanner.tsx), только здесь ключ
// датирован, а не постоянный.
function dismissKey(date: string): string {
  return `wrench_streak_risk_dismissed_${date}`;
}

export function StreakRiskBanner() {
  const { user }   = useAuth();
  const { locale } = useDict();
  const isRu        = locale === "ru";
  const [streak, setStreak] = useState<number | null>(null);
  // show стартует false и переключается только внутри эффекта — та же
  // SSR-безопасная схема, что и в OnboardingBanner.tsx: localStorage не
  // существует на сервере, поэтому его нельзя читать прямо в теле
  // рендера (это уронило бы SSR), только после монтирования в браузере.
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user) { setShow(false); return; }
    const supabase = createClient();
    supabase
      .from("user_streaks")
      .select("current_streak, last_active")
      .eq("user_id", user.id)
      .single()
      .then(({ data }: { data: { current_streak: number; last_active: string | null } | null }) => {
        if (!data) return;
        // В риске — есть что терять (current_streak > 0) и сегодняшний
        // день ещё не засчитан (last_active !== today). last_active ===
        // null у того, кто вообще ни разу не решал задачи — но тогда и
        // current_streak уже 0, так что первое условие это отсекает.
        const atRisk = data.current_streak > 0 && data.last_active !== today();
        if (!atRisk || localStorage.getItem(dismissKey(today()))) return;
        setStreak(data.current_streak);
        setShow(true);
      });
  }, [user]);

  function dismiss() {
    localStorage.setItem(dismissKey(today()), "1");
    setShow(false);
  }

  if (!show || streak === null) return null;

  return (
    <div className="border-b border-border bg-amber-900/10 animate-fade-in">
      <div className="mx-auto max-w-6xl px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-amber-400"><GameIcon id="trophy" size={16} /></span>
          <p className="flex-1 min-w-0 text-sm text-text-secondary">
            {isRu
              ? `Стрик ${streak} ${streakWordRu(streak)} под угрозой — сегодня ещё не решена ни одна задача.`
              : `Your ${streak}-day streak is at risk — you haven't solved anything today yet.`}
          </p>
          <Link href={localePath(locale, "/challenges")}
            className="shrink-0 rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-colors hover:bg-amber-400">
            {isRu ? "Решить задачу" : "Solve one now"}
          </Link>
          <button onClick={dismiss} aria-label={isRu ? "Закрыть" : "Dismiss"}
            className="shrink-0 rounded p-1 text-text-muted hover:text-text-primary transition-colors">
            <CloseIcon size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Склонение "день/дня/дней" для русского числительного стрика в этом
// баннере.
function streakWordRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "дня";
  return "дней";
}
