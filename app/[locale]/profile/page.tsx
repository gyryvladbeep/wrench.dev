"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useDict } from "@/lib/i18n/dict-context";
import { localePath } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { BADGES, BADGE_COLOR, checkAchievements } from "@/lib/achievements";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { allTools } from "@/lib/tools-registry";
import { WrenchScorePanel } from "@/components/WrenchScorePanel";
import { THEME_COLORS, applyAndSaveAccent } from "@/components/ThemeProvider";

const ROLE_TAGS = [
  { id:"qa",        label:"QA Engineer",        labelRu:"QA-инженер" },
  { id:"frontend",  label:"Frontend Dev",       labelRu:"Frontend-разработчик" },
  { id:"backend",   label:"Backend Dev",        labelRu:"Backend-разработчик" },
  { id:"fullstack", label:"Full Stack Dev",     labelRu:"Full Stack" },
  { id:"devops",    label:"DevOps Engineer",    labelRu:"DevOps-инженер" },
  { id:"developer", label:"Developer",          labelRu:"Разработчик" },
];

interface Profile {
  username: string;
  display_name: string;
  bio: string;
  avatar_color: string;
  role_tag: string;
}

interface Stats {
  total_solved: number;
  total_points: number;
  current_streak: number;
  longest_streak: number;
}

interface ToolHistory {
  tool_slug: string;
  used_at: string;
}

// Activity calendar helpers
function getLast90Days(): string[] {
  const days: string[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function ActivityCalendar({ activity }: { activity: Record<string, number> }) {
  const days  = getLast90Days();
  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const max   = Math.max(1, ...Object.values(activity));

  function intensity(count: number) {
    if (!count) return "bg-surface border border-border";
    const pct = count / max;
    if (pct > 0.75) return "bg-accent";
    if (pct > 0.5)  return "bg-accent/70";
    if (pct > 0.25) return "bg-accent/40";
    return "bg-accent/20";
  }

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((day) => (
            <div key={day}
              title={`${day}: ${activity[day] ?? 0} actions`}
              className={`h-3 w-3 rounded-sm transition-colors ${intensity(activity[day] ?? 0)}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user, signOut }  = useAuth();
  const { locale }         = useDict();
  const router             = useRouter();
  const isRu               = locale === "ru";
  const { isPro, sub, openPortal } = useSubscription();
  const { favorites, toggle } = useFavorites();

  const [profile,  setProfile]  = useState<Profile>({ username:"", display_name:"", bio:"", avatar_color:"#f59e0b", role_tag:"developer" });
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [history,  setHistory]  = useState<ToolHistory[]>([]);
  const [activity, setActivity] = useState<Record<string, number>>({});
  const [badges,   setBadges]   = useState<string[]>([]);
  const [aiUsed,   setAiUsed]   = useState(0);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [tab,      setTab]      = useState<"overview"|"history"|"badges"|"favorites"|"settings">("overview");

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const today    = new Date().toISOString().slice(0, 10);

    const [{ data: prof }, { data: streak }, { data: hist }, { data: usage }, { data: attempts }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("user_streaks").select("*").eq("user_id", user.id).single(),
      supabase.from("tool_history").select("tool_slug, used_at").eq("user_id", user.id).order("used_at", { ascending: false }).limit(50),
      supabase.from("ai_usage").select("count").eq("user_id", user.id).eq("used_at", today).single(),
      supabase.from("challenge_attempts").select("challenge_id, is_correct, completed_at").eq("user_id", user.id).eq("is_correct", true),
    ]);

    if (prof) setProfile(prof as Profile);
    if (streak) {
      setStats(streak as Stats);
      const earned = checkAchievements({
        total_solved:    streak.total_solved,
        total_points:    streak.total_points,
        current_streak:  streak.current_streak,
        isPro,
      });
      setBadges(earned);
    }
    if (hist) setHistory(hist as ToolHistory[]);
    if (usage) setAiUsed((usage as { count: number }).count ?? 0);

    // Build activity map from tool history + challenge attempts
    const act: Record<string, number> = {};
    hist?.forEach((h: ToolHistory) => {
      const d = h.used_at.slice(0, 10);
      act[d] = (act[d] ?? 0) + 1;
    });
    attempts?.forEach((a: { completed_at: string }) => {
      const d = a.completed_at.slice(0, 10);
      act[d] = (act[d] ?? 0) + 2;
    });
    setActivity(act);
  }, [user, isPro]);

  useEffect(() => {
    if (!user && hydrated) { router.push(localePath(locale, "/auth/login")); return; }
    load();
  }, [user, router, locale, load]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").upsert({
      id: user.id,
      ...profile,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const initials = (profile.display_name || user?.email || "?")[0].toUpperCase();
  const totalDays = Object.keys(activity).length;

  if (!user) return null;

  const TABS = [
    { id:"overview",  label: isRu ? "Обзор"      : "Overview" },
    { id:"history",   label: isRu ? "История"    : "History" },
    { id:"favorites", label: isRu ? "Избранное"  : "Favorites" },
    { id:"badges",    label: isRu ? "Награды"    : "Badges" },
    { id:"settings",  label: isRu ? "Настройки"  : "Settings" },
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start gap-5">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white shadow-lg"
            style={{ background: profile.avatar_color }}>
            {initials}
          </div>
          {isPro && (
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-canvas bg-violet-500 text-[10px] font-bold text-white">
              P
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-text-primary">
              {profile.display_name || user.email?.split("@")[0]}
            </h1>
            {isPro && (
              <span className="rounded border border-violet-500/30 bg-violet-500/10 px-2 py-px text-xs font-medium text-violet-400">Pro</span>
            )}
          </div>
          {profile.username && <p className="text-sm text-text-muted">@{profile.username}</p>}
          {profile.bio && <p className="mt-1 text-sm text-text-secondary max-w-md">{profile.bio}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {(() => {
              const role = ROLE_TAGS.find(r => r.id === profile.role_tag);
              return role ? (
                <span className="rounded border border-border px-2 py-0.5 text-xs text-text-muted">
                  {isRu ? role.labelRu : role.label}
                </span>
              ) : null;
            })()}
            <span className="text-xs text-text-muted">{user.email}</span>
          </div>
        </div>

        <button onClick={() => { signOut(); router.push(localePath(locale, "/")); }}
          className="shrink-0 rounded border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
          {isRu ? "Выйти" : "Sign out"}
        </button>
      </div>

      {/* Quick stats row */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: isRu ? "Решено"   : "Solved",         value: stats.total_solved,   icon: "✓" },
            { label: isRu ? "Очки"     : "Points",          value: stats.total_points,   icon: "⭐" },
            { label: isRu ? "Серия"    : "Streak",          value: `${stats.current_streak}🔥`, icon: "🔥" },
            { label: isRu ? "AI сегодня": "AI today",       value: isPro ? "∞" : `${aiUsed}/3`, icon: "🤖" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="rounded-lg border border-border bg-surface p-4 text-center">
              <p className="text-2xl font-bold text-text-primary">{value}</p>
              <p className="mt-0.5 text-xs text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex-1 rounded-md py-1.5 text-sm transition-colors ${tab === t.id ? "bg-canvas text-text-primary font-medium" : "text-text-muted hover:text-text-secondary"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Wrench Score */}
          {stats && (
            <WrenchScorePanel
              stats={stats}
              toolsUsed={history.length}
              badgesCount={badges.length}
              isRu={isRu}
            />
          )}

          {/* Activity calendar */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">
                {isRu ? "Активность за 90 дней" : "Activity — last 90 days"}
              </h2>
              <span className="text-xs text-text-muted">
                {totalDays} {isRu ? "активных дней" : "active days"}
              </span>
            </div>
            <ActivityCalendar activity={activity} />
            <div className="mt-2 flex items-center gap-2 text-xs text-text-muted justify-end">
              <span>{isRu ? "Меньше" : "Less"}</span>
              {["bg-surface border border-border","bg-accent/20","bg-accent/40","bg-accent/70","bg-accent"].map((c, i) => (
                <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />
              ))}
              <span>{isRu ? "Больше" : "More"}</span>
            </div>
          </div>

          {/* Badges preview */}
          {badges.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-primary">
                  {isRu ? "Награды" : "Badges"} · {badges.length}
                </h2>
                <button onClick={() => setTab("badges")} className="text-xs text-link hover:underline">
                  {isRu ? "Все →" : "All →"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {badges.slice(0, 8).map((bid) => {
                  const b = BADGES.find(x => x.id === bid);
                  if (!b) return null;
                  return (
                    <div key={bid} title={isRu ? b.descriptionRu : b.description}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${BADGE_COLOR[b.color] ?? BADGE_COLOR.amber}`}>
                      <span>{b.icon}</span>
                      <span className="font-medium">{isRu ? b.labelRu : b.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subscription */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">
              {isRu ? "Подписка" : "Subscription"}
            </h2>
            {isPro ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-400">Pro — $5/mo</p>
                  {sub?.current_period_end && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {isRu ? "Следующее списание: " : "Next billing: "}
                      {new Date(sub.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button onClick={() => openPortal(locale)}
                  className="rounded border border-border px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover transition-colors">
                  {isRu ? "Управление" : "Manage"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">Free</p>
                  <p className="text-xs text-text-muted mt-0.5">AI: {aiUsed}/3 {isRu ? "сегодня" : "today"}</p>
                </div>
                <Link href={localePath(locale, "/pro")}
                  className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:bg-amber-400 transition-colors">
                  {isRu ? "Перейти на Pro" : "Upgrade to Pro"}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-text-primary">
              {isRu ? "История инструментов" : "Tool History"}
            </h2>
          </div>
          {history.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-sm">
              {isRu ? "История пуста. Используй инструменты!" : "No history yet. Use some tools!"}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-surface-hover transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md border border-border bg-canvas flex items-center justify-center">
                      <span className="text-[10px] font-mono text-text-muted">{h.tool_slug.slice(0, 3).toUpperCase()}</span>
                    </div>
                    <div>
                      <Link href={localePath(locale, `/tools/${h.tool_slug}`)}
                        className="text-sm text-text-primary hover:text-accent transition-colors">
                        {h.tool_slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </Link>
                    </div>
                  </div>
                  <span className="text-xs text-text-muted">
                    {new Date(h.used_at).toLocaleString(locale === "ru" ? "ru-RU" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Badges tab */}
      {tab === "badges" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BADGES.map((b) => {
            const earned = badges.includes(b.id);
            return (
              <div key={b.id} className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${earned ? `${BADGE_COLOR[b.color] ?? "border-border bg-surface"}` : "border-border bg-surface opacity-40"}`}>
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <p className={`text-sm font-semibold ${earned ? "" : "text-text-muted"}`}>
                    {isRu ? b.labelRu : b.label}
                    {earned && <span className="ml-2 text-xs opacity-70">✓</span>}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {isRu ? b.descriptionRu : b.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Favorites tab */}
      {tab === "favorites" && (
        <div className="space-y-3">
          {favorites.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-10 text-center">
              <p className="text-2xl mb-3">⭐</p>
              <p className="text-text-secondary font-medium">
                {isRu ? "Нет избранных инструментов" : "No favorite tools yet"}
              </p>
              <p className="mt-2 text-sm text-text-muted">
                {isRu ? "Нажми ★ рядом с любым инструментом чтобы добавить в избранное." : "Click ★ next to any tool to add it to favorites."}
              </p>
              <Link href={localePath(locale, "/tools")}
                className="mt-4 inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-amber-400 transition-colors">
                {isRu ? "Перейти к инструментам" : "Browse tools"}
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-text-muted">{favorites.length} {isRu ? "инструментов" : "tools"}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {favorites.map((slug) => {
                  const tool = allTools.find(t => t.slug === slug);
                  if (!tool) return null;
                  return (
                    <div key={slug} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 hover:border-border-focus hover:bg-surface-hover transition-all group">
                      <Link href={localePath(locale, `/tools/${slug}`)} className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                          {tool.name}
                        </p>
                        <p className="text-xs text-text-muted truncate">{tool.shortDescription}</p>
                      </Link>
                      <button onClick={() => toggle(slug)}
                        title={isRu ? "Убрать из избранного" : "Remove from favorites"}
                        className="shrink-0 text-accent hover:text-text-muted transition-colors text-lg leading-none">
                        ★
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Settings tab */}
      {tab === "settings" && (
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">{isRu ? "Профиль" : "Profile"}</h2>

            {/* Avatar color */}
            <div>
              <label className="input-label">{isRu ? "Цвет интерфейса" : "Interface color"}</label>
              <p className="text-xs text-text-muted mb-2">{isRu ? "Меняет акцент кнопок, ссылок и аватарки" : "Changes buttons, links and avatar accent"}</p>
              <div className="flex gap-2 flex-wrap">
                {THEME_COLORS.map((theme) => (
                  <button key={theme.value} onClick={() => {
                    setProfile(p => ({ ...p, avatar_color: theme.value }));
                    applyAndSaveAccent(theme.value);
                  }}
                    title={isRu ? theme.labelRu : theme.label}
                    className={`h-9 w-9 rounded-full transition-all flex items-center justify-center ${profile.avatar_color === theme.value ? "ring-2 ring-white ring-offset-2 ring-offset-canvas scale-110" : "hover:scale-105"}`}
                    style={{ background: theme.value }}>
                    {profile.avatar_color === theme.value && (
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ color: theme.fg }}>
                        <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="input-label">{isRu ? "Имя пользователя" : "Username"}</label>
              <input value={profile.username} onChange={(e) => setProfile(p => ({ ...p, username: e.target.value }))}
                placeholder="@username"
                className="code-surface w-full rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none" />
            </div>

            <div>
              <label className="input-label">{isRu ? "Отображаемое имя" : "Display name"}</label>
              <input value={profile.display_name} onChange={(e) => setProfile(p => ({ ...p, display_name: e.target.value }))}
                placeholder={isRu ? "Твоё имя" : "Your name"}
                className="code-surface w-full rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none" />
            </div>

            <div>
              <label className="input-label">{isRu ? "О себе" : "Bio"}</label>
              <textarea value={profile.bio} onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                rows={3} maxLength={200} placeholder={isRu ? "Расскажи о себе..." : "Tell us about yourself..."}
                className="code-surface w-full rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none resize-none" />
              <p className="mt-1 text-xs text-text-muted text-right">{profile.bio.length}/200</p>
            </div>

            <div>
              <label className="input-label">{isRu ? "Роль" : "Role"}</label>
              <div className="flex flex-wrap gap-2">
                {ROLE_TAGS.map((r) => (
                  <button key={r.id} onClick={() => setProfile(p => ({ ...p, role_tag: r.id }))}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${profile.role_tag === r.id ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
                    {isRu ? r.labelRu : r.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={saveProfile} disabled={saving}
              className="w-full rounded bg-accent py-2.5 text-sm font-semibold text-accent-fg hover:bg-amber-400 disabled:opacity-60 transition-colors">
              {saving ? (isRu ? "Сохраняю..." : "Saving...") : saved ? (isRu ? "✓ Сохранено" : "✓ Saved") : (isRu ? "Сохранить профиль" : "Save profile")}
            </button>
          </div>

          {/* Danger zone */}
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-5">
            <h2 className="mb-3 text-sm font-semibold text-red-400">{isRu ? "Выход" : "Sign out"}</h2>
            <button onClick={() => { signOut(); router.push(localePath(locale, "/")); }}
              className="rounded border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
              {isRu ? "Выйти из аккаунта" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}