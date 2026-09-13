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
import { useWorkbenches } from "@/lib/hooks/useWorkbenches";
import { allTools } from "@/lib/tools-registry";
import { WrenchScorePanel } from "@/components/WrenchScorePanel";
import { THEME_COLORS, applyAndSaveAccent } from "@/components/ThemeProvider";
import { GameIcon, CheckIcon, StarIcon, CloseIcon, ExternalLinkIcon, type GameIconId } from "@/components/icons/GameIcons";
import { ROLE_TAGS } from "@/lib/profile-roles";
import { BANNER_GRADIENTS, getBannerGradient } from "@/lib/profile-banners";
import { ROLE_META, DIFFICULTY_META, ChallengeRole, ChallengeDifficulty } from "@/lib/challenges/types";
import { CopyButton } from "@/components/CopyButton";

interface Profile {
  username: string;
  display_name: string;
  bio: string;
  avatar_color: string;
  role_tag: string;
  // Публичный профиль (/u/[username]) — добавлено вместе с ним, см.
  // supabase/profile-public-migration.sql. is_public уже существовал в
  // схеме (DEFAULT true) для будущего использования, которое наступило
  // только сейчас — раньше нигде в коде не читался и не показывался.
  is_public:            boolean;
  banner_gradient:      string | null;
  tagline:              string | null;
  github_url:           string | null;
  linkedin_url:         string | null;
  website_url:          string | null;
  pinned_challenge_ids: string[];
}

// Решённая задача, доступная для закрепления на публичном профиле (см.
// SolvedChallenge ниже) — только поля, нужные для витрины, не весь
// Challenge целиком.
interface SolvedChallenge {
  id:         string;
  title:      string;
  title_ru:   string | null;
  role:       ChallengeRole;
  difficulty: ChallengeDifficulty;
  points:     number;
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

// Сколько задач можно закрепить на публичном профиле одновременно —
// проверяется только в приложении (в БД у pinned_challenge_ids нет
// CHECK-ограничения на длину, см. комментарий в миграции), но раз
// ограничение всё равно только клиентское, держим число в одном месте,
// а не magic-number'ом в паре разных условий.
const MAX_PINNED = 3;

export default function ProfilePage() {
  const { user, signOut, loading, isSigningOut } = useAuth();
  const { locale }         = useDict();
  const router             = useRouter();
  const isRu               = locale === "ru";
  const { isPro, sub, openPortal } = useSubscription();
  const { favorites, toggle } = useFavorites();
  const { workbenches: workbenchList } = useWorkbenches(isPro);

  const [profile,  setProfile]  = useState<Profile>({
    username: "", display_name: "", bio: "", avatar_color: "#f59e0b", role_tag: "developer",
    is_public: true, banner_gradient: null, tagline: null,
    github_url: null, linkedin_url: null, website_url: null, pinned_challenge_ids: [],
  });
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [history,  setHistory]  = useState<ToolHistory[]>([]);
  const [activity, setActivity] = useState<Record<string, number>>({});
  const [badges,   setBadges]   = useState<string[]>([]);
  // Решённые задачи текущего пользователя — источник для пикера
  // "закрепить на публичном профиле" в Settings. Не все решённые задачи
  // сразу видны там же на странице — их может быть сотни; выбор ниже
  // ограничен MAX_PINNED.
  const [solvedChallenges, setSolvedChallenges] = useState<SolvedChallenge[]>([]);
  const [aiUsed,   setAiUsed]   = useState(0);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [tab,      setTab]      = useState<"overview"|"history"|"badges"|"favorites"|"settings">("overview");

  // Удаление аккаунта — состояние живёт здесь, не в JSX Settings-вкладки,
  // потому что вкладки условно рендерятся (см. {tab === "settings" && ...}
  // ниже), а не размонтируют компонент целиком. Без явного сброса при
  // переключении вкладок это была бы та же гонка, что уже один раз чинили
  // в Workbench для confirmDeleteId (см. workbench/page.tsx): открыл
  // подтверждение удаления, переключился на другую вкладку, вернулся на
  // Settings — а подтверждение всё ещё висит открытым. Сбрасываем в
  // обработчике клика по вкладкам ниже.
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const today    = new Date().toISOString().slice(0, 10);

    const [{ data: prof }, { data: streak }, { data: hist }, { data: usage }, { data: attempts }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("user_streaks").select("*").eq("user_id", user.id).single(),
      supabase.from("tool_history").select("tool_slug, used_at").eq("user_id", user.id).order("used_at", { ascending: false }).limit(50),
      supabase.from("ai_usage").select("count").eq("user_id", user.id).eq("used_at", today).single(),
      // challenges(...) — embed через FK challenge_attempts.challenge_id
      // (тот же приём, которым Supabase PostgREST разворачивает связанные
      // таблицы одним запросом). Нужно и для календаря активности (как
      // раньше), и для пикера "закрепить на публичном профиле" ниже —
      // без второго отдельного запроса за теми же решёнными задачами.
      supabase.from("challenge_attempts")
        .select("completed_at, challenges(id, title, title_ru, role, difficulty, points)")
        .eq("user_id", user.id).eq("is_correct", true),
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
    type AttemptRow = { completed_at: string; challenges: SolvedChallenge | SolvedChallenge[] | null };
    (attempts as AttemptRow[] | null)?.forEach((a) => {
      const d = a.completed_at.slice(0, 10);
      act[d] = (act[d] ?? 0) + 2;
    });
    setActivity(act);

    // challenges(...) выше возвращается Supabase либо как один объект,
    // либо как массив из одного элемента — зависит от того, как
    // PostgREST выводит кардинальность связи по FK; на всякий случай
    // обрабатываем оба варианта, а не полагаемся на один конкретный.
    const solved = ((attempts as AttemptRow[] | null) ?? [])
      .map((a) => (Array.isArray(a.challenges) ? a.challenges[0] : a.challenges))
      .filter((c): c is SolvedChallenge => Boolean(c));
    setSolvedChallenges(solved);
  }, [user, isPro]);

  // ═══════════════════════════════════════════════════════════════
  // Почему тут loading из useAuth(), а не свой локальный "hydrated"
  // ═══════════════════════════════════════════════════════════════
  // Раньше здесь был свой флаг hydrated (true после первого рендера),
  // и проверка "if (!user && hydrated)". Выглядело логично, но пряталась
  // гонка состояний, которую вскрыл только настоящий e2e-тест: заход
  // ЗАРАНЕЕ разлогиненного человека прямо на /profile (например, после
  // выхода из аккаунта) навсегда зависал на пустой странице, ни разу
  // не редиректя на /auth/login.
  //
  // Причина: user в AuthProvider изначально равен null — и ДО того как
  // сессия проверена, и ПОСЛЕ подтверждения "ты правда разлогинен" — это
  // одно и то же значение null. React не перезапускает эффект, если
  // значение в зависимостях не изменилось (Object.is(null, null) —
  // true), а hydrated в списке зависимостей эффекта не было вообще.
  // Получалось: эффект успевал сработать РАНЬШЕ, чем hydrated становился
  // true (и тогда просто вызывал load(), которая сама ничего не делает
  // при user === null), а затем — когда hydrated менялся на true — эффект
  // просто не перезапускался, потому что "hydrated" не в его зависимостях,
  // а "user" не поменялся (как был null, так и остался null).
  //
  // loading, наоборот, ВСЕГДА меняется ровно один раз: true → false,
  // именно в тот момент, когда AuthProvider узнал точный ответ (есть
  // сессия или нет). Это гарантированная, настоящая смена значения —
  // значит React обязательно перезапустит эффект в нужный момент,
  // с уже финальным, правильным user.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      // Не редиректим, если разлогинивание запущено явным нажатием
      // "Sign out" (в шапке или на самой странице) — та кнопка уже
      // сама решает, куда вести дальше (обычно на главную). Этот
      // редирект нужен для другого случая: человек ЗАШЁЛ на /profile,
      // уже будучи разлогиненным (например, по прямой ссылке в другой
      // вкладке) — тогда его аккуратно возвращают на страницу входа.
      // Без этой проверки оба перехода "спорили" бы за то, куда в
      // итоге попадёт человек — см. lib/auth/auth-context.tsx.
      if (!isSigningOut()) router.push(localePath(locale, "/auth/login"));
      return;
    }
    load();
  }, [user, loading, router, locale, load, isSigningOut]);

  // Тоггл закрепления задачи на публичном профиле — если задача уже
  // закреплена, снимаем без ограничений; если нет и лимит MAX_PINNED уже
  // исчерпан, клик молча ничего не делает (кнопка сама выглядит disabled
  // в этом случае, см. разметку ниже) — не открепляем что-то за
  // пользователя без явного действия с его стороны.
  function togglePinned(challengeId: string) {
    setProfile((p) => {
      const already = p.pinned_challenge_ids.includes(challengeId);
      if (already) return { ...p, pinned_challenge_ids: p.pinned_challenge_ids.filter((id) => id !== challengeId) };
      if (p.pinned_challenge_ids.length >= MAX_PINNED) return p;
      return { ...p, pinned_challenge_ids: [...p.pinned_challenge_ids, challengeId] };
    });
  }

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

  // Требует ввода фразы-подтверждения (кнопка "Удалить навсегда" ниже
  // остаётся disabled, пока введённый текст не совпадёт с DELETE_PHRASE),
  // а не просто повторного клика "точно?", как для удаления одного
  // рабочего стола в Workbench — удаление аккаунта необратимо и стирает
  // куда больше данных, так что лёгкого inline-подтверждения тут мало.
  const DELETE_PHRASE = isRu ? "УДАЛИТЬ" : "DELETE";

  async function handleDeleteAccount() {
    if (deleteConfirmText.trim().toUpperCase() !== DELETE_PHRASE) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new Error("delete failed");
      // signOut() не await-ится специально — она синхронно (до первого
      // await внутри) выставляет signingOutRef в auth-context.tsx, и
      // только это важно для router.push ниже. Тот же приём уже
      // используется в кнопках "Sign out" на этой странице.
      signOut();
      router.push(localePath(locale, "/"));
    } catch {
      setDeleting(false);
      setDeleteError(isRu ? "Не удалось удалить аккаунт. Попробуй ещё раз." : "Couldn't delete the account. Please try again.");
    }
  }

  const initials = (profile.display_name || user?.email || "?")[0].toUpperCase();
  const totalDays = Object.keys(activity).length;
  const workbenchToolCount = workbenchList.reduce((sum, w) => sum + w.tool_slugs.length, 0);
  const banner = getBannerGradient(profile.banner_gradient);
  // window недоступен при первом серверном рендере "use client"-страницы —
  // тот же guard, что уже используется для shareUrl в workbench/page.tsx.
  const publicProfileUrl = profile.username && typeof window !== "undefined"
    ? `${window.location.origin}${localePath(locale, `/u/${profile.username}`)}`
    : "";

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
      {/* Header — баннер показывается только если пользователь его выбрал
          (Settings → "Публичный профиль"); без него шапка выглядит ровно
          так же, как и раньше, без пустой цветной полосы просто так. */}
      <div className={`mb-8 ${banner ? "overflow-hidden rounded-xl border border-border bg-surface" : ""}`}>
        {banner && <div className="h-20 w-full" style={{ background: banner.css }} />}
        <div className={`flex items-start gap-5 ${banner ? "-mt-8 px-5 pb-5" : ""}`}>
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white shadow-lg ${banner ? "border-4 border-surface" : ""}`}
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
            {profile.tagline && <p className="mt-1 text-sm font-medium text-accent">{profile.tagline}</p>}
            {profile.bio && <p className="mt-1 text-sm text-text-secondary max-w-md">{profile.bio}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {(() => {
                const role = ROLE_TAGS.find(r => r.id === profile.role_tag);
                return role ? (
                  <span className="rounded border border-border px-2 py-0.5 text-xs text-text-muted">
                    {isRu ? role.labelRu : role.label}
                  </span>
                ) : null;
              })()}
              <span className="text-xs text-text-muted">{user.email}</span>
              {/* Видно только когда есть реально рабочая публичная ссылка —
                  нужны и username, и включённый is_public (см. карточку
                  "Публичный профиль" в Settings ниже). */}
              {profile.is_public && publicProfileUrl && (
                <a href={publicProfileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-link hover:underline">
                  {isRu ? "Публичный профиль" : "Public profile"} <ExternalLinkIcon size={10} />
                </a>
              )}
            </div>
          </div>

          <button onClick={() => { signOut(); router.push(localePath(locale, "/")); }}
            className="shrink-0 rounded border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
            {isRu ? "Выйти" : "Sign out"}
          </button>
        </div>
      </div>

      {/* Quick stats row — раньше у каждой карточки было поле icon с
          эмодзи, но оно нигде не рендерилось (мёртвый код), а «Серия»
          вообще вставляла 🔥 прямо в число. Теперь иконка реально
          показывается (маленькая, над числом), а число — чистое. */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([
            { label: isRu ? "Решено"    : "Solved",    value: String(stats.total_solved),               icon: "target"    as GameIconId },
            { label: isRu ? "Очки"      : "Points",    value: String(stats.total_points),               icon: "star"      as GameIconId },
            { label: isRu ? "Серия"     : "Streak",    value: String(stats.current_streak),             icon: "fire"      as GameIconId },
            { label: isRu ? "AI сегодня": "AI today",  value: isPro ? "∞" : `${aiUsed}/3`,               icon: "sparkle"   as GameIconId },
          ]).map(({ label, value, icon }) => (
            <div key={label} className="rounded-lg border border-border bg-surface p-4 text-center">
              <div className="flex justify-center text-text-muted"><GameIcon id={icon} size={16} /></div>
              <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
              <p className="mt-0.5 text-xs text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => {
            setTab(t.id as typeof tab);
            // Сброс подтверждения удаления аккаунта при любом переключении
            // вкладок — см. комментарий у useState(deleteConfirmOpen) выше.
            setDeleteConfirmOpen(false);
            setDeleteConfirmText("");
            setDeleteError(null);
          }}
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

          {/* Workbench promo — самый заметный крючок для тех, кто ещё не
              пробовал фичу, и быстрый доступ для тех, кто уже пользуется.
              Стоит сразу после Wrench Score, до активности и наград —
              намеренно на видном месте наверху вкладки. */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/20 bg-accent/5 p-5">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                {isRu ? "Рабочий стол" : "Workbench"}
              </h2>
              <p className="mt-1 text-xs text-text-muted max-w-md">
                {workbenchToolCount > 0
                  ? (isRu
                      ? `${workbenchToolCount} инструментов закреплено в ${workbenchList.length} наборах — открой их все на одной странице.`
                      : `${workbenchToolCount} tool${workbenchToolCount === 1 ? "" : "s"} pinned across ${workbenchList.length} workspace${workbenchList.length === 1 ? "" : "s"}.`)
                  : (isRu
                      ? "Закрепи инструменты, которыми пользуешься чаще всего, и открывай их все рядом на одной странице."
                      : "Pin the tools you use most and open them all side by side on one page.")}
              </p>
            </div>
            <Link href={localePath(locale, "/workbench")}
              className="shrink-0 rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-opacity hover:opacity-90">
              {workbenchToolCount > 0 ? (isRu ? "Открыть" : "Open") : (isRu ? "Попробовать" : "Try it")}
            </Link>
          </div>

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
                      <GameIcon id={b.icon} size={13} />
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
                  className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-opacity hover:opacity-90">
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
                <GameIcon id={b.icon} size={24} />
                <div>
                  <p className={`text-sm font-semibold ${earned ? "" : "text-text-muted"}`}>
                    {isRu ? b.labelRu : b.label}
                    {earned && <span className="ml-2 inline-flex align-middle opacity-70"><CheckIcon size={11} /></span>}
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
              <div className="mb-3 flex justify-center text-text-muted"><StarIcon size={28} /></div>
              <p className="text-text-secondary font-medium">
                {isRu ? "Нет избранных инструментов" : "No favorite tools yet"}
              </p>
              <p className="mt-2 text-sm text-text-muted">
                {isRu ? "Нажми на звёздочку рядом с любым инструментом, чтобы добавить его в избранное." : "Click the star icon next to any tool to add it to favorites."}
              </p>
              <Link href={localePath(locale, "/tools")}
                className="mt-4 inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90">
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
                        className="shrink-0 text-accent hover:text-text-muted transition-colors">
                        <StarIcon size={16} filled />
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

            {/* Баннер профиля — тот же принцип выбора из готовых
                пресетов, что и у цвета аватарки чуть выше, но
                двухцветный градиент вместо одного цвета (lib/profile-banners.ts).
                "Без баннера" — явная первая опция, а не просто "ничего не
                выбрано", чтобы можно было вернуться к прежнему виду
                шапки одним кликом. */}
            <div>
              <label className="input-label">{isRu ? "Баннер профиля" : "Profile banner"}</label>
              <p className="text-xs text-text-muted mb-2">
                {isRu ? "Показывается сверху на публичном профиле и здесь, в шапке" : "Shown at the top of your public profile and here in the header"}
              </p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setProfile(p => ({ ...p, banner_gradient: null }))}
                  title={isRu ? "Без баннера" : "No banner"}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-all ${!profile.banner_gradient ? "ring-2 ring-white ring-offset-2 ring-offset-canvas scale-110" : "hover:scale-105"}`}>
                  <CloseIcon size={12} />
                </button>
                {BANNER_GRADIENTS.map((g) => (
                  <button key={g.id} onClick={() => setProfile(p => ({ ...p, banner_gradient: g.id }))}
                    title={isRu ? g.labelRu : g.label}
                    className={`h-9 w-9 rounded-full transition-all ${profile.banner_gradient === g.id ? "ring-2 ring-white ring-offset-2 ring-offset-canvas scale-110" : "hover:scale-105"}`}
                    style={{ background: g.css }} />
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

            {/* Тэглайн — короткая строка отдельно от bio, для того же
                смысла, ради которого его чаще всего заводят: показать
                статус в одну строку ("открыт к предложениям", "ищу QA
                automation роль"), не теряясь в более длинном bio. */}
            <div>
              <label className="input-label">{isRu ? "Статус-тэглайн" : "Status tagline"}</label>
              <input value={profile.tagline ?? ""} onChange={(e) => setProfile(p => ({ ...p, tagline: e.target.value || null }))}
                maxLength={80} placeholder={isRu ? "Например: открыт к предложениям" : "e.g. Open to opportunities"}
                className="code-surface w-full rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none" />
              <p className="mt-1 text-xs text-text-muted text-right">{(profile.tagline ?? "").length}/80</p>
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

            {/* Ссылки — три поля вместо произвольного списка: сайту три
                самых частых профиля разработчика (GitHub/LinkedIn/личный
                сайт) достаточно, а простой набор из трёх текстовых полей
                проще в реализации и в использовании, чем редактируемый
                список произвольной длины. Свои иконки брендов нигде не
                рисуем (см. комментарий у ExternalLinkIcon) — только
                обычная внешняя ссылка и подпись текстом. */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="input-label">GitHub</label>
                <input value={profile.github_url ?? ""} onChange={(e) => setProfile(p => ({ ...p, github_url: e.target.value || null }))}
                  placeholder="https://github.com/..."
                  className="code-surface w-full rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none" />
              </div>
              <div>
                <label className="input-label">LinkedIn</label>
                <input value={profile.linkedin_url ?? ""} onChange={(e) => setProfile(p => ({ ...p, linkedin_url: e.target.value || null }))}
                  placeholder="https://linkedin.com/in/..."
                  className="code-surface w-full rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none" />
              </div>
              <div>
                <label className="input-label">{isRu ? "Сайт" : "Website"}</label>
                <input value={profile.website_url ?? ""} onChange={(e) => setProfile(p => ({ ...p, website_url: e.target.value || null }))}
                  placeholder="https://..."
                  className="code-surface w-full rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none" />
              </div>
            </div>

            <button onClick={saveProfile} disabled={saving}
              className="flex w-full items-center justify-center gap-1.5 rounded bg-accent py-2.5 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-60">
              {saved && <CheckIcon size={14} />}
              {saving ? (isRu ? "Сохраняю..." : "Saving...") : saved ? (isRu ? "Сохранено" : "Saved") : (isRu ? "Сохранить профиль" : "Save profile")}
            </button>
          </div>

          {/* Публичный профиль — отдельная карточка, а не продолжение
              "Профиля" выше: та карточка про то, КАК ты выглядишь, эта —
              про то, ВИДНО ли это кому-то кроме тебя, плюс сама ссылка и
              витрина закреплённых задач. is_public здесь — часть того же
              profile-состояния и сохраняется той же кнопкой "Сохранить
              профиль" выше, а не отдельным немедленным действием (в
              отличие от аналогичного тоггла в Workbench — там сразу
              одна точечная настройка одного объекта, здесь тоггл живёт
              рядом с остальными полями формы и логичнее сохранять всё
              одним движением). */}
          <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">{isRu ? "Публичный профиль" : "Public profile"}</h2>

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-secondary">{isRu ? "Показывать профиль по прямой ссылке" : "Show profile at a direct link"}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {isRu
                    ? "Wrench Score, награды и закреплённые задачи будут видны всем, у кого есть ссылка — без входа в аккаунт."
                    : "Wrench Score, badges and pinned challenges become visible to anyone with the link — no sign-in required."}
                </p>
              </div>
              {/* Тот же визуальный и структурный тоггл, что уже отлажен
                  для публичного шаринга Workbench (app/[locale]/workbench/page.tsx)
                  — включая явный left-0.5 на бегунке (см. комментарий там
                  же про то, почему без него бегунок вылезает за край
                  дорожки). Копируем один в один, а не изобретаем свой. */}
              <button
                role="switch"
                aria-checked={profile.is_public}
                aria-label={isRu ? "Показывать профиль по прямой ссылке" : "Show profile at a direct link"}
                onClick={() => setProfile(p => ({ ...p, is_public: !p.is_public }))}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${profile.is_public ? "bg-accent" : "bg-surface-hover"}`}
              >
                <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-text-primary transition-transform ${profile.is_public ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>

            {profile.is_public && (
              profile.username ? (
                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-canvas px-2.5 py-1.5">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary">{publicProfileUrl}</span>
                  <CopyButton value={publicProfileUrl} iconOnly />
                </div>
              ) : (
                <p className="text-xs text-amber-400">
                  {isRu ? "Укажи имя пользователя выше, чтобы получить ссылку." : "Set a username above to get a link."}
                </p>
              )
            )}

            {/* Витрина закреплённых задач — до MAX_PINNED штук из уже
                решённых, а не из всех подряд: закрепить нерешённую
                задачу с публичного профиля бессмысленно (нечего
                показать как достижение). Пустой список — не ошибка,
                просто пока нечего закреплять или пикер тут не нужен. */}
            {solvedChallenges.length > 0 && (
              <div>
                <label className="input-label">
                  {isRu ? "Закреплённые решения" : "Pinned solutions"} ({profile.pinned_challenge_ids.length}/{MAX_PINNED})
                </label>
                <p className="text-xs text-text-muted mb-2">
                  {isRu ? "Покажутся первыми на публичном профиле" : "Shown first on your public profile"}
                </p>
                <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
                  {solvedChallenges.map((c) => {
                    const pinned = profile.pinned_challenge_ids.includes(c.id);
                    const atLimit = !pinned && profile.pinned_challenge_ids.length >= MAX_PINNED;
                    const roleMeta = ROLE_META[c.role];
                    const diffMeta = DIFFICULTY_META[c.difficulty];
                    return (
                      <button key={c.id} onClick={() => togglePinned(c.id)} disabled={atLimit}
                        className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${pinned ? "border-accent/40 bg-accent/10" : "border-border bg-canvas hover:bg-surface-hover"}`}>
                        <span className="min-w-0 truncate text-sm text-text-primary">
                          {isRu && c.title_ru ? c.title_ru : c.title}
                        </span>
                        <span className="flex shrink-0 items-center gap-2 text-xs">
                          <span className="text-text-muted">{isRu ? roleMeta.labelRu : roleMeta.label}</span>
                          <span className={diffMeta.colorClass}>{isRu ? diffMeta.labelRu : diffMeta.label}</span>
                          {pinned && <CheckIcon size={11} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button onClick={saveProfile} disabled={saving}
              className="flex w-full items-center justify-center gap-1.5 rounded bg-accent py-2.5 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-60">
              {saved && <CheckIcon size={14} />}
              {saving ? (isRu ? "Сохраняю..." : "Saving...") : saved ? (isRu ? "Сохранено" : "Saved") : (isRu ? "Сохранить профиль" : "Save profile")}
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

          {/* Удаление аккаунта — отдельная карточка Danger zone, после
              Sign out. Тот же визуальный язык (border-red-500/20
              bg-red-500/5), но с вводом фразы-подтверждения вместо
              простого повторного клика — см. комментарий у
              handleDeleteAccount выше. */}
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-5">
            <h2 className="mb-3 text-sm font-semibold text-red-400">{isRu ? "Удаление аккаунта" : "Delete account"}</h2>

            {!deleteConfirmOpen ? (
              <>
                <p className="mb-3 max-w-md text-xs text-text-muted">
                  {isRu
                    ? "Профиль, история инструментов, избранное, рабочие столы и достижения будут удалены безвозвратно. Активная подписка Pro отменяется автоматически."
                    : "Your profile, tool history, favorites, workbenches and achievements will be permanently deleted. An active Pro subscription is canceled automatically."}
                </p>
                <button onClick={() => setDeleteConfirmOpen(true)}
                  className="rounded border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  {isRu ? "Удалить аккаунт" : "Delete account"}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-red-400">
                  {isRu
                    ? `Это нельзя отменить. Введи ${DELETE_PHRASE}, чтобы подтвердить.`
                    : `This can't be undone. Type ${DELETE_PHRASE} to confirm.`}
                </p>
                <input
                  id="delete-confirm-input"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={DELETE_PHRASE}
                  disabled={deleting}
                  className="code-surface w-full max-w-xs rounded-lg px-3 py-2 text-sm text-text-primary outline-none disabled:opacity-60"
                />
                {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText.trim().toUpperCase() !== DELETE_PHRASE || deleting}
                    className="rounded bg-red-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {deleting ? (isRu ? "Удаление..." : "Deleting...") : (isRu ? "Удалить навсегда" : "Permanently delete")}
                  </button>
                  <button
                    onClick={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(""); setDeleteError(null); }}
                    disabled={deleting}
                    className="rounded border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover disabled:opacity-60"
                  >
                    {isRu ? "Отмена" : "Cancel"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}