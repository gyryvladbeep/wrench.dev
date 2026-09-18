"use client";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { localizeTool } from "@/lib/i18n/localize";
import { WrenchScorePanel } from "@/components/WrenchScorePanel";
import { calcWrenchScore, getLevel } from "@/lib/wrench-score";
import { THEME_COLORS, applyAndSaveAccent } from "@/components/ThemeProvider";
import { AVATAR_EMBLEMS } from "@/lib/profile-emblems";
import { AvatarGlyph } from "@/components/profile/AvatarGlyph";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { StatsHud, type StatHudItem } from "@/components/profile/StatsHud";
import { GameIcon, CheckIcon, StarIcon, CloseIcon } from "@/components/icons/GameIcons";
import { ROLE_TAGS } from "@/lib/profile-roles";
import { STACK_TAGS, MAX_STACK_TAGS } from "@/lib/profile-stack";
import { BANNER_GRADIENTS, getBannerGradient } from "@/lib/profile-banners";
import { ROLE_META, DIFFICULTY_META, ChallengeRole, ChallengeDifficulty } from "@/lib/challenges/types";
import { CopyButton } from "@/components/CopyButton";
import { ApiTokensPanel } from "@/components/profile/ApiTokensPanel";
import { SkillEndorsements } from "@/components/profile/SkillEndorsements";

interface Profile {
  username: string;
  display_name: string;
  bio: string;
  avatar_color: string;
  // id пресета из lib/profile-emblems.ts, или null — см.
  // supabase/profile-emblem-migration.sql. Необязательный слой поверх
  // avatar_color, не замена ему (см. AvatarGlyph).
  avatar_emblem: string | null;
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
  // Директория специалистов (/people) — supabase/profile-stack-location-migration.sql.
  // tech_stack — id из lib/profile-stack.ts, до MAX_STACK_TAGS штук;
  // location — свободный текст, тот же принцип, что и у tagline.
  tech_stack:           string[];
  location:             string | null;
  // Достижения как статус — supabase/achievements-status-migration.sql.
  // id из lib/achievements.ts BADGES, или null — см. эквип-пикер в
  // Settings ниже. На БД-уровне ограничен FK на achievements(user_id,
  // badge_id): выставить сюда можно только реально заработанный бейдж.
  equipped_badge_id:    string | null;
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
    username: "", display_name: "", bio: "", avatar_color: "#f59e0b", avatar_emblem: null, role_tag: "developer",
    is_public: true, banner_gradient: null, tagline: null,
    github_url: null, linkedin_url: null, website_url: null, pinned_challenge_ids: [],
    tech_stack: [], location: null, equipped_badge_id: null,
  });
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [history,  setHistory]  = useState<ToolHistory[]>([]);
  const [activity, setActivity] = useState<Record<string, number>>({});
  const [badges,   setBadges]   = useState<string[]>([]);
  // Id бейджей, когда-либо реально ЗАПИСАННЫХ в achievements (не то же
  // самое, что badges выше — badges это объединение этого списка с
  // живым пересчётом checkAchievements(), см. эффект ниже). Нужен
  // отдельно, чтобы отличать "уже точно есть в БД" от "видим впервые в
  // этой загрузке" — не переупсертить одно и то же на каждый ре-рендер.
  const [persistedBadgeIds, setPersistedBadgeIds] = useState<string[]>([]);
  // Решённые задачи текущего пользователя — источник для пикера
  // "закрепить на публичном профиле" в Settings. Не все решённые задачи
  // сразу видны там же на странице — их может быть сотни; выбор ниже
  // ограничен MAX_PINNED.
  const [solvedChallenges, setSolvedChallenges] = useState<SolvedChallenge[]>([]);
  const [aiUsed,   setAiUsed]   = useState(0);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  // Раньше saveProfile() не проверял { error } от upsert() вообще —
  // ошибка (например "column avatar_emblem does not exist", если не
  // выполнена supabase/profile-emblem-migration.sql) тонула молча, а
  // кнопка всё равно показывала "Сохранено". saveError делает провал
  // видимым, а не гадаемым по тому, что данные откатились на следующей
  // загрузке страницы.
  const [saveError, setSaveError] = useState<string | null>(null);
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

    const [{ data: prof }, { data: streak }, { data: hist }, { data: usage }, { data: attempts }, { data: earnedRows }] = await Promise.all([
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
      // Бейджи, когда-либо реально записанные в achievements — см.
      // supabase/achievements-status-migration.sql и комментарий у
      // useEffect(computeBadges) ниже про объединение с живым пересчётом.
      supabase.from("achievements").select("badge_id").eq("user_id", user.id),
    ]);

    if (prof) setProfile(prof as Profile);
    if (streak) setStats(streak as Stats);
    if (earnedRows) setPersistedBadgeIds((earnedRows as { badge_id: string }[]).map((r) => r.badge_id));
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

  // ═══════════════════════════════════════════════════════════════
  // Достижения как статус: живой пересчёт + то, что уже когда-либо
  // записано в achievements (persistedBadgeIds, см. load() выше) —
  // объединение, а не замена, чтобы заработанный однажды бейдж не
  // пропадал при сбросе current_streak и т.п. (см. подробный комментарий
  // над checkAchievements() в lib/achievements.ts про исходную причину
  // этой правки). Отдельный эффект, а не часть load(): favorites и
  // workbenchList приходят из своих хуков (useFavorites/useWorkbenches)
  // и догружаются независимо, иногда позже, чем отрабатывает load().
  const upsertedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user || !stats) return;

    const toolCounts = new Map<string, number>();
    history.forEach((h) => toolCounts.set(h.tool_slug, (toolCounts.get(h.tool_slug) ?? 0) + 1));
    const maxSingleToolUses = toolCounts.size ? Math.max(...toolCounts.values()) : 0;

    // used_at — timestamptz из tool_history, JS Date парсит его в UTC-
    // эквивалент сам; часы/день недели берём через getUTC*, чтобы не
    // зависеть от таймзоны браузера того, кто сейчас смотрит страницу
    // (см. описания insomniac/weekend_warrior в lib/achievements.ts —
    // они намеренно сформулированы как "UTC", а не "твоей ночью").
    const usedNightHours = history.some((h) => new Date(h.used_at).getUTCHours() < 5);
    const usedWeekend    = history.some((h) => [0, 6].includes(new Date(h.used_at).getUTCDay()));

    const qaSolved       = solvedChallenges.filter((c) => c.role === "qa").length;
    const frontendSolved = solvedChallenges.filter((c) => c.role === "frontend").length;
    const backendSolved  = solvedChallenges.filter((c) => c.role === "backend").length;
    const hardSolved     = solvedChallenges.filter((c) => c.difficulty === "hard").length;
    const workbenchToolsCount = workbenchList.reduce((sum, w) => sum + w.tool_slugs.length, 0);

    const earned = checkAchievements({
      total_solved:   stats.total_solved,
      total_points:   stats.total_points,
      current_streak: stats.current_streak,
      longest_streak: stats.longest_streak,
      qa_solved: qaSolved, frontend_solved: frontendSolved, backend_solved: backendSolved, hard_solved: hardSolved,
      isPro,
      favorites_count: favorites.length,
      workbench_count: workbenchList.length,
      workbench_tools_count: workbenchToolsCount,
      distinct_tools_used: toolCounts.size,
      max_single_tool_uses: maxSingleToolUses,
      used_night_hours: usedNightHours,
      used_weekend: usedWeekend,
      account_created_at: user.created_at,
    });

    setBadges(Array.from(new Set([...earned, ...persistedBadgeIds])));

    // Пишем в achievements только то, что реально новое: не в
    // persistedBadgeIds (ещё нет в БД) и ещё не отправлялось в этом
    // сеансе (upsertedRef) — сам upsert идемпотентен (ON CONFLICT DO
    // NOTHING через существующий UNIQUE(user_id, badge_id)), это просто
    // чтобы не дёргать сеть на каждое изменение зависимостей эффекта.
    const toWrite = earned.filter((id) => !persistedBadgeIds.includes(id) && !upsertedRef.current.has(id));
    if (toWrite.length) {
      toWrite.forEach((id) => upsertedRef.current.add(id));
      const supabase = createClient();
      supabase.from("achievements")
        .upsert(toWrite.map((badge_id) => ({ user_id: user.id, badge_id })), { onConflict: "user_id,badge_id", ignoreDuplicates: true })
        .then(({ error }: { error: { message: string } | null }) => {
          if (error) { console.error("achievements upsert failed", error); return; }
          setPersistedBadgeIds((prev) => Array.from(new Set([...prev, ...toWrite])));
        });
    }
  }, [user, stats, history, solvedChallenges, favorites, workbenchList, isPro, persistedBadgeIds]);

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

  // Тот же приём, что и у togglePinned выше: снять тег можно всегда, а
  // добавить — только пока не упёрлись в MAX_STACK_TAGS (кнопка сама
  // выглядит disabled в этом случае в разметке ниже).
  function toggleStackTag(tagId: string) {
    setProfile((p) => {
      const already = p.tech_stack.includes(tagId);
      if (already) return { ...p, tech_stack: p.tech_stack.filter((id) => id !== tagId) };
      if (p.tech_stack.length >= MAX_STACK_TAGS) return p;
      return { ...p, tech_stack: [...p.tech_stack, tagId] };
    });
  }

  // Экипировать бейдж как публичный статус (или снять — badgeId === null)
  // — отдельное немедленное сохранение, а не часть общего saveProfile()
  // ниже: это однокликовое действие (как аватарка/баннер чуть выше по
  // тому же принципу мгновенного применения), и странно было бы, если бы
  // выбор бейджа "не сохранился", потому что человек не нажал отдельную
  // кнопку "Сохранить" в самом низу вкладки Settings ради текста bio.
  // Валидность значения (что badgeId реально среди заработанных) не
  // проверяем здесь отдельно — сам пикер ниже предлагает только id из
  // badges, а на уровне БД это дополнительно гарантирует FK
  // profiles_equipped_badge_fk (см. supabase/achievements-status-migration.sql).
  async function equipBadge(badgeId: string | null) {
    if (!user) return;
    setProfile((p) => ({ ...p, equipped_badge_id: badgeId }));
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ equipped_badge_id: badgeId }).eq("id", user.id);
    if (error) console.error("equipBadge: update failed", error);
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();
    // Раньше результат upsert() не читался вообще (просто await без
    // деструктуризации { error }) — при сбое (чаще всего: в таблице ещё
    // нет колонки под новое поле, потому что соответствующая миграция
    // из supabase/*.sql не выполнена) upsert() ничего не менял в БД, но
    // код всё равно шёл дальше и показывал "Сохранено", как будто всё
    // записалось. Теперь ошибка проверяется и показывается — молчаливого
    // "сохранения в никуда" больше нет.
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      ...profile,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    setSaving(false);
    if (error) {
      console.error("saveProfile: upsert failed", error);
      setSaveError(
        isRu
          ? "Не удалось сохранить профиль. Попробуй ещё раз или обнови страницу — если не поможет, часть настроек могла быть добавлена в БД без миграции."
          : "Couldn't save the profile. Try again or refresh the page — if that doesn't help, a recent field may be missing its DB migration."
      );
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // AvatarMenu в шапке (components/Header.tsx) держит свою отдельную
    // копию display_name/avatar_color/avatar_emblem — тем же приёмом,
    // что уже у WrenchScoreBadge и ThemeProvider (независимый fetch по
    // user.id, без общего стора на весь сайт) — и не перемонтируется
    // при переходах внутри одного layout, так что сам не узнает о
    // только что сохранённых изменениях. Событие — самый простой способ
    // сообщить ему об этом, не заводя глобальный стор ради одного места.
    window.dispatchEvent(new CustomEvent("wrench:profile-saved"));
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
  const role = ROLE_TAGS.find((r) => r.id === profile.role_tag);
  // window недоступен при первом серверном рендере "use client"-страницы —
  // тот же guard, что уже используется для shareUrl в workbench/page.tsx.
  const publicProfileUrl = profile.username && typeof window !== "undefined"
    ? `${window.location.origin}${localePath(locale, `/u/${profile.username}`)}`
    : "";
  // Бейдж — картинка, не страница, поэтому без localePath: /api/badge/
  // сам ничего не локализует и не должен, это чистый SVG для README.
  // Ссылка под картинкой — тот же publicProfileUrl, чтобы клик по бейджу
  // в чужом README вёл на публичный профиль, а не на голый URL картинки.
  const badgeUrl = profile.username && typeof window !== "undefined"
    ? `${window.location.origin}/api/badge/${profile.username}`
    : "";
  const badgeMarkdown = badgeUrl && publicProfileUrl
    ? `[![Wrench Score](${badgeUrl})](${publicProfileUrl})`
    : "";

  // Очки и текущий уровень Wrench Score — считаются той же формулой, что
  // и внутри WrenchScorePanel (lib/wrench-score.ts), но теперь ещё и
  // здесь, на уровне страницы: ProfileHero использует их для "гало"
  // вокруг аватарки и чипа уровня в шапке, чего раньше в шапке не было
  // вообще. Один и тот же calcWrenchScore с одинаковыми аргументами в
  // обоих местах — расхождения между шапкой и панелью ниже невозможны.
  const score = stats ? calcWrenchScore({ ...stats, tools_used: history.length, badges_count: badges.length }) : 0;
  const level = getLevel(score);

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
      <ProfileHero
        displayName={profile.display_name || user.email?.split("@")[0] || ""}
        username={profile.username}
        email={user.email ?? ""}
        tagline={profile.tagline}
        bio={profile.bio}
        avatarColor={profile.avatar_color}
        avatarEmblem={profile.avatar_emblem}
        initials={initials}
        roleLabel={role ? (isRu ? role.labelRu : role.label) : null}
        isPro={isPro}
        level={level}
        score={score}
        bannerGradient={banner}
        publicProfileUrl={profile.is_public ? publicProfileUrl : ""}
        equippedBadgeId={profile.equipped_badge_id}
        isRu={isRu}
        onSignOut={() => { signOut(); router.push(localePath(locale, "/")); }}
      />

      {/* Quick stats row — HUD-полоска вместо четырёх одинаковых карточек
          с пустым местом внутри (см. components/profile/StatsHud.tsx). */}
      {stats && (
        <StatsHud items={([
          { id: "solved", icon: "target",  value: String(stats.total_solved),      label: isRu ? "Решено"     : "Solved" },
          { id: "points", icon: "star",    value: String(stats.total_points),      label: isRu ? "Очки"       : "Points" },
          { id: "streak", icon: "fire",    value: String(stats.current_streak),    label: isRu ? "Серия"      : "Streak",
            accentClass: "text-orange-400", pulsing: stats.current_streak > 0 },
          { id: "ai",     icon: "sparkle", value: isPro ? "∞" : `${aiUsed}/3`,     label: isRu ? "AI сегодня" : "AI today",
            accentClass: isPro ? "text-violet-400" : undefined },
        ]) as StatHudItem[]} />
      )}

      {/* Tabs — подчёркивание со свечением вместо плоских кнопок-таблеток,
          в духе остального сайта (акцентные акценты, а не серые). */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => {
            setTab(t.id as typeof tab);
            // Сброс подтверждения удаления аккаунта при любом переключении
            // вкладок — см. комментарий у useState(deleteConfirmOpen) выше.
            setDeleteConfirmOpen(false);
            setDeleteConfirmText("");
            setDeleteError(null);
          }}
            className={`relative px-3 py-2.5 text-sm transition-colors ${tab === t.id ? "font-medium text-text-primary" : "text-text-muted hover:text-text-secondary"}`}>
            {t.label}
            {tab === t.id && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent shadow-[0_0_8px_rgb(var(--accent-rgb)/0.6)]" />
            )}
          </button>
        ))}
      </div>

      {/* Overview tab — бенто-сетка вместо стопки одинаковых карточек:
          Wrench Score — крупная плитка на 2×2, справа сверху вниз —
          Награды и Активность, внизу — Workbench и Подписка. Порядок
          карточек в разметке ниже задаёт порядок auto-placement сетки
          (CSS сам расставляет плитки по свободным местам), явных
          grid-column/row нигде не расставляем. */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Wrench Score */}
          {stats && (
            <div className="md:col-span-2 md:row-span-2">
              <WrenchScorePanel
                stats={stats}
                toolsUsed={history.length}
                badgesCount={badges.length}
                isRu={isRu}
              />
            </div>
          )}

          {/* Награды — раньше пряталась целиком при badges.length === 0,
              теперь всегда на месте со своим пустым состоянием, чтобы
              сетка не "прыгала" в зависимости от того, есть ли данные. */}
          <div className="rounded-lg border border-border bg-surface p-5 card-shine md:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">
                {isRu ? "Награды" : "Badges"}{badges.length > 0 ? ` · ${badges.length}` : ""}
              </h2>
              <button onClick={() => setTab("badges")} className="text-xs text-link hover:underline">
                {isRu ? "Все →" : "All →"}
              </button>
            </div>
            {badges.length > 0 ? (
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
            ) : (
              <p className="text-xs text-text-muted">
                {isRu ? "Пока нет наград — реши первую задачу, чтобы получить первую." : "No badges yet — solve your first challenge to earn one."}
              </p>
            )}
          </div>

          {/* Peer-эндорсементы навыков (roadmap item 2) — читаемая
              версия на приватной странице: isOwnProfile всегда true
              здесь, кнопки эндорса скрыты, виден только результат.
              Обёртка условна на tech_stack (не только внутренний return
              null компонента) — иначе пустой md:col-span-2 div остался
              бы в сетке даже без единого тега. */}
          {profile.tech_stack.length > 0 && (
            <div className="md:col-span-2">
              <SkillEndorsements
                locale={locale}
                profileUserId={user.id}
                techStack={profile.tech_stack}
                isOwnProfile
              />
            </div>
          )}

          {/* Activity calendar */}
          <div className="rounded-lg border border-border bg-surface p-5 md:col-span-2">
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

          {/* Workbench promo — самый заметный крючок для тех, кто ещё не
              пробовал фичу, и быстрый доступ для тех, кто уже пользуется. */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/20 bg-accent/5 p-5 card-shine md:col-span-2">
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

          {/* Subscription */}
          <div className="rounded-lg border border-border bg-surface p-5 md:col-span-2">
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
        <div className="space-y-3">
          <p className="text-xs text-text-muted">
            {isRu
              ? "Заработанный бейдж можно экипировать как публичный статус — он появится на профиле /u/username, который видят другие."
              : "Equip an earned badge as your public status — it shows up on the /u/username profile others see."}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {BADGES.map((b) => {
              const earned   = badges.includes(b.id);
              const equipped = profile.equipped_badge_id === b.id;
              return (
                <div key={b.id} className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${earned ? `${BADGE_COLOR[b.color] ?? "border-border bg-surface"} card-shine` : "border-border bg-surface opacity-40"} ${equipped ? "ring-2 ring-accent" : ""}`}>
                  <GameIcon id={b.icon} size={24} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${earned ? "" : "text-text-muted"}`}>
                      {isRu ? b.labelRu : b.label}
                      {earned && <span className="ml-2 inline-flex align-middle opacity-70"><CheckIcon size={11} /></span>}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {isRu ? b.descriptionRu : b.description}
                    </p>
                    {earned && (
                      <button onClick={() => equipBadge(equipped ? null : b.id)}
                        className={`mt-2 rounded px-2 py-1 text-xs font-medium transition-colors ${equipped ? "bg-accent text-accent-fg" : "border border-border text-text-muted hover:border-border-focus hover:text-text-secondary"}`}>
                        {equipped ? (isRu ? "Экипирован — снять" : "Equipped — unequip") : (isRu ? "Сделать статусом" : "Equip as status")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
                  const rawTool = allTools.find(t => t.slug === slug);
                  if (!rawTool) return null;
                  const tool = localizeTool(rawTool, locale);
                  return (
                    <div key={slug} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 hover:border-border-focus hover:bg-surface-hover transition-all card-shine group">
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

            {/* Эмблема аватарки — необязательный слой поверх цвета выше
                (lib/profile-emblems.ts), не замена ему: "Без эмблемы" —
                явная первая опция, тот же приём, что уже у баннера чуть
                ниже, а не просто "ничего не выбрано". Превью самих
                пресетов рисуется через тот же AvatarGlyph, что и сама
                аватарка (включая нейтральную подложку под эмблемой,
                см. компонент), — если картинка конкретного пресета ещё не
                сгенерирована и не лежит в /public, кнопка сама покажет
                инициал вместо сломанной иконки, а не сломается визуально. */}
            <div>
              <label className="input-label">{isRu ? "Эмблема аватарки" : "Avatar emblem"}</label>
              <p className="text-xs text-text-muted mb-2">
                {isRu ? "Значок поверх цвета аватарки — необязательно" : "An icon layered on top of your avatar color — optional"}
              </p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setProfile(p => ({ ...p, avatar_emblem: null }))}
                  title={isRu ? "Без эмблемы" : "No emblem"}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-all ${!profile.avatar_emblem ? "ring-2 ring-white ring-offset-2 ring-offset-canvas scale-110" : "hover:scale-105"}`}>
                  <CloseIcon size={12} />
                </button>
                {AVATAR_EMBLEMS.map((emblem) => (
                  <button key={emblem.id} onClick={() => setProfile(p => ({ ...p, avatar_emblem: emblem.id }))}
                    title={isRu ? emblem.labelRu : emblem.label}
                    className={`rounded-full transition-all ${profile.avatar_emblem === emblem.id ? "ring-2 ring-white ring-offset-2 ring-offset-canvas scale-110" : "hover:scale-105"}`}>
                    <AvatarGlyph
                      color={profile.avatar_color}
                      emblemId={emblem.id}
                      initials={initials}
                      sizeClass="h-9 w-9 text-xs"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Баннер профиля — тот же принцип выбора из готовых
                пресетов, что и у цвета аватарки чуть выше, но
                двухцветный градиент вместо одного цвета (lib/profile-banners.ts).
                Теперь заливает всю карточку-шапку (ProfileHero), а не
                тонкую полоску сверху, как раньше — это же место в
                будущем станет слотом под покупные фоны/скины (см.
                комментарий в ProfileHero.tsx). "Без баннера" — явная
                первая опция: карточка тогда падает на бесплатный фон по
                умолчанию — свечение в цвет текущего уровня Wrench Score,
                а не на пустоту. */}
            <div>
              <label className="input-label">{isRu ? "Баннер профиля" : "Profile banner"}</label>
              <p className="text-xs text-text-muted mb-2">
                {isRu ? "Показывается на публичном профиле и как фон карточки профиля здесь" : "Shown on your public profile and as your profile card's background here"}
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

            {/* Стек — в отличие от роли выше, это мультивыбор (до
                MAX_STACK_TAGS тегов из lib/profile-stack.ts): показывается
                чипами на публичном профиле и на карточке в директории
                (/people), и по нему же там можно фильтровать. */}
            <div>
              <label className="input-label">
                {isRu ? "Технологии" : "Tech stack"} ({profile.tech_stack.length}/{MAX_STACK_TAGS})
              </label>
              <p className="text-xs text-text-muted mb-2">
                {isRu ? "Показывается в директории /people и на публичном профиле" : "Shown in the /people directory and on your public profile"}
              </p>
              <div className="flex flex-wrap gap-2">
                {STACK_TAGS.map((t) => {
                  const selected = profile.tech_stack.includes(t.id);
                  const atLimit = !selected && profile.tech_stack.length >= MAX_STACK_TAGS;
                  return (
                    <button key={t.id} onClick={() => toggleStackTag(t.id)} disabled={atLimit}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${selected ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
                      {isRu ? t.labelRu : t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Локация — свободный текст, не выбор из справочника (см.
                комментарий в supabase/profile-stack-location-migration.sql):
                и место жительства, и "Remote" — одно и то же поле. */}
            <div>
              <label className="input-label">{isRu ? "Локация" : "Location"}</label>
              <input value={profile.location ?? ""} onChange={(e) => setProfile(p => ({ ...p, location: e.target.value || null }))}
                maxLength={60} placeholder={isRu ? "Например: Алматы, или Remote" : "e.g. Berlin, or Remote"}
                className="code-surface w-full rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none" />
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
            {saveError && <p className="text-xs text-red-400">{saveError}</p>}
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

            {/* Бейдж для README — вставляется отдельным блоком, а не
                довеском к строке выше: там ссылка на страницу, тут —
                встраиваемая картинка с отдельным markdown-сниппетом под
                неё, обеим нужно своё место, чтобы не путать одно с
                другим. Живая картинка (не статичный мокап) — тот же
                /api/badge/[username], что отдаёт чужой GitHub при
                реальном показе README, поэтому то, что видно здесь,
                это ровно то, что увидят другие. */}
            {profile.is_public && badgeUrl && (
              <div className="space-y-2 border-t border-border pt-4">
                <label className="input-label">{isRu ? "Бейдж для README" : "Badge for your README"}</label>
                <img src={badgeUrl} alt="Wrench Score" width={162} height={20} className="h-5 w-auto" />
                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-canvas px-2.5 py-1.5">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary">{badgeMarkdown}</span>
                  <CopyButton value={badgeMarkdown} iconOnly />
                </div>
                <p className="text-xs text-text-muted">
                  {isRu
                    ? "Вставь этот markdown в README своего репозитория — бейдж обновляется сам, каждый раз показывая текущий Wrench Score."
                    : "Paste this markdown into your repo's README — the badge stays live and always shows your current Wrench Score."}
                </p>
              </div>
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
            {saveError && <p className="text-xs text-red-400">{saveError}</p>}
          </div>

          <ApiTokensPanel />

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
