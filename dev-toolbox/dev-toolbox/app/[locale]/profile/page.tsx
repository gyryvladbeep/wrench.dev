"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useDict } from "@/lib/i18n/dict-context";
import { localePath } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/lib/hooks/useSubscription";

interface Stats {
  total_solved: number;
  total_points: number;
  current_streak: number;
  longest_streak: number;
}

export default function ProfilePage() {
  const { user, signOut }  = useAuth();
  const { locale }         = useDict();
  const router             = useRouter();
  const isRu               = locale === "ru";
  const { isPro, sub, openPortal } = useSubscription();
  const [stats, setStats]  = useState<Stats | null>(null);
  const [aiUsed, setAiUsed] = useState(0);

  useEffect(() => {
    if (!user) { router.push(localePath(locale, "/auth/login")); return; }
    const supabase = createClient();
    const today    = new Date().toISOString().slice(0, 10);

    supabase.from("user_streaks").select("*").eq("user_id", user.id).single()
      .then(({ data }: { data: Stats | null }) => setStats(data));

    supabase.from("ai_usage").select("count").eq("user_id", user.id).eq("used_at", today).single()
      .then(({ data }: { data: { count: number } | null }) => setAiUsed(data?.count ?? 0));
  }, [user, router, locale]);

  async function handleSignOut() {
    await signOut();
    router.push(localePath(locale, "/"));
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="mb-8 text-2xl font-bold text-text-primary">
        {isRu ? "Профиль" : "Profile"}
      </h1>

      {/* User info */}
      <div className="rounded-lg border border-border bg-surface p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-xl font-bold text-accent">
            {(user.email ?? "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-text-primary">{user.email}</p>
            <div className="mt-1 flex items-center gap-2">
              {isPro ? (
                <span className="rounded border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-400">
                  Pro
                </span>
              ) : (
                <span className="rounded border border-border px-2 py-0.5 text-xs text-text-muted">
                  Free
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="rounded-lg border border-border bg-surface p-6 mb-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
          {isRu ? "Подписка" : "Subscription"}
        </h2>
        {isPro ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{isRu ? "План" : "Plan"}</span>
              <span className="font-medium text-violet-400">Pro — $5/mo</span>
            </div>
            {sub?.current_period_end && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{isRu ? "Следующее списание" : "Next billing"}</span>
                <span className="text-text-primary">{new Date(sub.current_period_end).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">AI {isRu ? "генерации" : "generations"}</span>
              <span className="text-text-primary">{isRu ? "Безлимит" : "Unlimited"}</span>
            </div>
            <button onClick={() => openPortal(locale)}
              className="mt-2 w-full rounded border border-border bg-canvas px-4 py-2 text-sm text-text-muted hover:bg-surface transition-colors">
              {isRu ? "Управление подпиской" : "Manage subscription"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{isRu ? "План" : "Plan"}</span>
              <span className="text-text-primary">Free</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">AI {isRu ? "сегодня" : "today"}</span>
              <span className={`font-medium ${aiUsed >= 3 ? "text-red-400" : "text-text-primary"}`}>
                {aiUsed}/3
              </span>
            </div>
            <Link href={localePath(locale, "/pro")}
              className="mt-2 block w-full rounded bg-accent px-4 py-2 text-center text-sm font-medium text-accent-fg hover:bg-amber-400 transition-colors">
              {isRu ? "Перейти на Pro — $5/мес" : "Upgrade to Pro — $5/mo"}
            </Link>
          </div>
        )}
      </div>

      {/* Challenge stats */}
      <div className="rounded-lg border border-border bg-surface p-6 mb-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
          {isRu ? "Статистика Challenges" : "Challenge Stats"}
        </h2>
        {stats ? (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: isRu ? "Решено задач" : "Solved",        value: stats.total_solved },
              { label: isRu ? "Очков всего"  : "Total points",  value: stats.total_points },
              { label: isRu ? "Текущая серия": "Current streak",value: `${stats.current_streak} 🔥` },
              { label: isRu ? "Лучшая серия" : "Best streak",   value: stats.longest_streak },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-md border border-border bg-canvas p-3 text-center">
                <p className="text-2xl font-bold text-text-primary">{value}</p>
                <p className="mt-0.5 text-xs text-text-muted">{label}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-text-muted text-sm">{isRu ? "Пока нет данных" : "No data yet"}</p>
            <Link href={localePath(locale, "/challenges")}
              className="mt-3 inline-block text-sm text-link hover:underline">
              {isRu ? "Начать решать задачи →" : "Start solving challenges →"}
            </Link>
          </div>
        )}
      </div>

      {/* Sign out */}
      <button onClick={handleSignOut}
        className="w-full rounded border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/20 transition-colors">
        {isRu ? "Выйти из аккаунта" : "Sign out"}
      </button>
    </div>
  );
}
