"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { calcWrenchScore, getLevel } from "@/lib/wrench-score";
import { GameIcon } from "@/components/icons/GameIcons";

export function WrenchScoreBadge() {
  const { user }   = useAuth();
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    Promise.all([
      supabase.from("user_streaks").select("total_points,total_solved,current_streak,longest_streak").eq("user_id", user.id).single(),
      supabase.from("tool_history").select("id", { count:"exact", head:true }).eq("user_id", user.id),
      supabase.from("achievements").select("id", { count:"exact", head:true }).eq("user_id", user.id),
    ]).then(([{ data: streak, error: streakErr }, { count: tools, error: toolsErr }, { count: badges, error: badgesErr }]) => {
      // Раньше при сбое сети/базы бейдж просто не появлялся — неотличимо
      // от "у пользователя правда нет очков", и в проде такой сбой не
      // отличить от нормального состояния без единой строчки в логах.
      // console.error, а не видимое сообщение об ошибке — бейдж в шапке
      // декоративный, не критичная для работы сайта информация.
      const err = streakErr || toolsErr || badgesErr;
      if (err) console.error("WrenchScoreBadge: failed to load", err);
      if (!streak) return;
      setScore(calcWrenchScore({
        total_points:   streak.total_points   ?? 0,
        total_solved:   streak.total_solved   ?? 0,
        current_streak: streak.current_streak ?? 0,
        longest_streak: streak.longest_streak ?? 0,
        tools_used:     tools   ?? 0,
        badges_count:   badges  ?? 0,
      }));
    });
  }, [user]);

  if (!user || score === null) return null;

  const level = getLevel(score);

  return (
    <span title={`${level.label} · ${score} pts`}
      className="flex items-center gap-1 rounded border px-1.5 py-px text-[10px] font-semibold transition-colors"
      style={{ borderColor: level.color + "40", background: level.color + "15", color: level.color }}>
      <GameIcon id={level.icon} size={11} /> {level.label}
    </span>
  );
}