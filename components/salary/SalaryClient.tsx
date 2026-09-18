"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { localePath, Locale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/client";
import { ROLE_TAGS } from "@/lib/profile-roles";
import { SENIORITY_LEVELS, COUNTRIES, EMPLOYMENT_TYPES, formatUsd } from "@/lib/salary-options";
import { CheckIcon, BriefcaseIcon } from "@/components/icons/GameIcons";

interface SalaryStats {
  sample_size: number;
  median_usd:  number | null;
  avg_usd:     number | null;
  min_usd:     number | null;
  max_usd:     number | null;
}

interface Submission {
  role_tag:           string;
  seniority:          string;
  years_experience:   number;
  country:            string;
  employment_type:    string;
  monthly_salary_usd: number;
}

// "exact" — совпадение по всем выбранным фильтрам; "role-seniority" и
// "role-only" — фронтенд сам ослабляет фильтры, если под точным
// совпадением набралось меньше 3 откликов (порог анонимности на стороне
// БД, см. supabase/salary-calculator-migration.sql), чтобы вместо
// голого "нет данных" показать цифру по более широкой группе, честно
// сообщив, что именно сейчас показано.
type StatsTier = "exact" | "role-seniority" | "role-only";

const DEFAULT_FORM: Submission = {
  role_tag: ROLE_TAGS[0].id,
  seniority: SENIORITY_LEVELS[1].id,
  years_experience: 1,
  country: COUNTRIES[0].id,
  employment_type: "remote",
  monthly_salary_usd: 0,
};

export function SalaryClient({ locale }: { locale: Locale }) {
  const isRu = locale === "ru";
  const { user, loading } = useAuth();

  // ───────────────────────── Explore (публично, без входа) ─────────────────────────
  const [exploreRole, setExploreRole]           = useState<string>(ROLE_TAGS[0].id);
  const [exploreSeniority, setExploreSeniority] = useState<string | null>(null);
  const [exploreCountry, setExploreCountry]     = useState<string | null>(null);
  const [stats, setStats]           = useState<SalaryStats | null>(null);
  const [statsTier, setStatsTier]   = useState<StatsTier>("exact");
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  // supabase.rpc() не существует у заглушки createClient() (см. её же
  // комментарий в lib/supabase/client.ts) — заглушка отдаётся, когда
  // переменные окружения Supabase не заданы, и умеет только auth/from,
  // без .rpc(). Без try/catch здесь это была бы точно та же по природе
  // ошибка "supabase.from is not a function", что уже один раз ловили в
  // generateMetadata для /u/[username] — только на этот раз внутри
  // клиентского компонента, где необработанное исключение уронило бы
  // весь рендер страницы, а не просто один заголовок вкладки.
  const runQuery = useCallback(async () => {
    setStatsLoading(true);
    const supabase = createClient();

    const attempts: { seniority: string | null; country: string | null; tier: StatsTier }[] = [
      { seniority: exploreSeniority, country: exploreCountry, tier: "exact" },
      { seniority: exploreSeniority, country: null,           tier: "role-seniority" },
      { seniority: null,             country: null,           tier: "role-only" },
    ];

    let result: SalaryStats | null = null;
    let tier: StatsTier = "exact";

    try {
      for (const attempt of attempts) {
        const { data, error } = await supabase.rpc("get_salary_stats", {
          p_role: exploreRole,
          p_seniority: attempt.seniority,
          p_country: attempt.country,
        });
        if (error || !data || !data[0]) continue;
        const row = data[0] as SalaryStats;
        result = row;
        tier = attempt.tier;
        if (row.sample_size >= 3) break;
        // иначе продолжаем ослаблять фильтры дальше по списку attempts,
        // но result уже держит самый широкий из опробованных вариантов —
        // на случай, если ни один так и не наберёт порог в 3.
      }
    } catch {
      result = null;
    }

    setStats(result);
    setStatsTier(tier);
    setStatsLoading(false);
  }, [exploreRole, exploreSeniority, exploreCountry]);

  useEffect(() => { runQuery(); }, [runQuery]);

  useEffect(() => {
    const supabase = createClient();
    try {
      supabase.rpc("get_salary_submission_count")
        .then(({ data }: { data: number | null }) => { if (typeof data === "number") setTotalCount(data); })
        .catch(() => {});
    } catch {
      // .rpc() doesn't exist on the dev stub used when Supabase env vars
      // are unset — see the comment on runQuery above.
    }
  }, []);

  // ───────────────────────── Add / update your data (нужен вход) ─────────────────────────
  const [hasSubmission, setHasSubmission] = useState(false);
  const [form, setForm]           = useState<Submission>(DEFAULT_FORM);
  const [formLoaded, setFormLoaded] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => {
    if (!user) { setFormLoaded(true); return; }
    setFormLoaded(false);
    const supabase = createClient();
    supabase.from("salary_submissions").select("role_tag, seniority, years_experience, country, employment_type, monthly_salary_usd")
      .eq("user_id", user.id).single()
      .then(({ data }: { data: Submission | null }) => {
        if (data) { setForm(data); setHasSubmission(true); }
        setFormLoaded(true);
      });
  }, [user]);

  // .upsert() / .delete() тоже нет у заглушки createClient() (у неё
  // только select/update/insert, см. комментарий у runQuery выше) —
  // try/catch не даёт незаполненному .env.local уронить форму целиком.
  async function saveSubmission() {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    try {
      await supabase.from("salary_submissions").upsert({
        user_id: user.id,
        ...form,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      setHasSubmission(true);
      runQuery();
    } catch {
      // Supabase not configured — nothing to persist to.
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function deleteSubmission() {
    if (!user) return;
    setDeleting(true);
    const supabase = createClient();
    try {
      await supabase.from("salary_submissions").delete().eq("user_id", user.id);
      runQuery();
    } catch {
      // Supabase not configured — nothing to delete.
    }
    setDeleting(false);
    setHasSubmission(false);
    setForm(DEFAULT_FORM);
  }

  const tierNote = (() => {
    if (!stats || statsTier === "exact") return null;
    const roleLabel = ROLE_TAGS.find((r) => r.id === exploreRole);
    const label = roleLabel ? (isRu ? roleLabel.labelRu : roleLabel.label) : exploreRole;
    if (statsTier === "role-seniority") {
      return isRu
        ? `Недостаточно откликов для выбранной страны — показана статистика по всем странам для «${label}» на этом уровне.`
        : `Not enough submissions for the selected country — showing all-country stats for ${label} at this level.`;
    }
    return isRu
      ? `Недостаточно откликов для выбранных уровня и страны — показана статистика по роли «${label}» в целом.`
      : `Not enough submissions for the selected level and country — showing overall stats for ${label}.`;
  })();

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-canvas text-accent">
          <BriefcaseIcon size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isRu ? "Калькулятор зарплат QA/Dev" : "QA/Dev Salary Calculator"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary leading-relaxed">
            {isRu
              ? "Цифры собраны самими пользователями — без верификации работодателя или оффера. Относитесь к ним как к ориентиру, не как к точной ставке. Все суммы — это чистая зарплата в месяц, в эквиваленте USD."
              : "These figures are self-reported by users — not verified against an employer or offer letter. Treat them as a directional signal, not an exact rate. All amounts are net monthly pay, in USD equivalent."}
          </p>
          <p className="mt-2 text-xs text-text-muted">
            {totalCount === null
              ? ""
              : totalCount === 0
              ? (isRu ? "Пока никто не поделился данными — станьте первым." : "Nobody has shared their data yet — be the first.")
              : (isRu
                  ? `${totalCount} ${totalCount === 1 ? "человек поделился" : "человек поделились"} своей зарплатой.`
                  : `${totalCount} ${totalCount === 1 ? "person has" : "people have"} shared their salary.`)}
          </p>
          <Link href={localePath(locale, "/salary/report")} className="mt-1 inline-block text-xs text-link hover:underline">
            {isRu ? "Полный срез рынка по роли, уровню и стране →" : "Full market snapshot by role, level and country →"}
          </Link>
        </div>
      </div>

      {/* ───────────────────────── Explore ───────────────────────── */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-base font-semibold text-text-primary">
          {isRu ? "Посмотреть статистику" : "Browse the data"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="input-label">{isRu ? "Роль" : "Role"}</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_TAGS.map((r) => (
                <button key={r.id} onClick={() => setExploreRole(r.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${exploreRole === r.id ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-canvas text-text-muted hover:bg-surface-hover"}`}>
                  {isRu ? r.labelRu : r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">{isRu ? "Уровень (необязательно)" : "Level (optional)"}</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setExploreSeniority(null)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${exploreSeniority === null ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-canvas text-text-muted hover:bg-surface-hover"}`}>
                {isRu ? "Любой" : "Any"}
              </button>
              {SENIORITY_LEVELS.map((s) => (
                <button key={s.id} onClick={() => setExploreSeniority(s.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${exploreSeniority === s.id ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-canvas text-text-muted hover:bg-surface-hover"}`}>
                  {isRu ? s.labelRu : s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">{isRu ? "Страна (необязательно)" : "Country (optional)"}</label>
            <select value={exploreCountry ?? ""} onChange={(e) => setExploreCountry(e.target.value || null)}
              className="code-surface w-full max-w-xs rounded-[10px] px-2 py-1.5 text-sm text-text-primary outline-none">
              <option value="">{isRu ? "Любая страна" : "Any country"}</option>
              {COUNTRIES.map((c) => (
                <option key={c.id} value={c.id}>{isRu ? c.labelRu : c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-canvas p-4">
          {statsLoading ? (
            <p className="text-sm text-text-muted">{isRu ? "Загрузка..." : "Loading..."}</p>
          ) : !stats || stats.sample_size === 0 ? (
            <p className="text-sm text-text-muted">
              {isRu
                ? "Пока нет данных для этой роли. Поделитесь своей зарплатой ниже, чтобы начать собирать статистику."
                : "No data yet for this role. Share your own salary below to help get this started."}
            </p>
          ) : stats.sample_size < 3 ? (
            <p className="text-sm text-text-muted">
              {isRu
                ? `Пока только ${stats.sample_size} ${stats.sample_size === 1 ? "отклик" : "отклика"} — этого мало, чтобы показать цифры, не раскрыв фактически чью-то одну конкретную зарплату. Загляните позже или расширьте фильтры.`
                : `Only ${stats.sample_size} submission${stats.sample_size === 1 ? "" : "s"} so far — too few to show numbers without effectively exposing one specific person's salary. Check back later or widen the filters.`}
            </p>
          ) : (
            <>
              {tierNote && <p className="mb-3 text-xs text-amber-400">{tierNote}</p>}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {([
                  { label: isRu ? "Медиана" : "Median", value: stats.median_usd },
                  { label: isRu ? "Среднее" : "Average", value: stats.avg_usd },
                  { label: isRu ? "Минимум" : "Min", value: stats.min_usd },
                  { label: isRu ? "Максимум" : "Max", value: stats.max_usd },
                ]).map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-border bg-surface p-3 text-center">
                    <p className="text-lg font-bold text-text-primary">{formatUsd(value)}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-text-muted">
                {isRu ? `На основе ${stats.sample_size} откликов.` : `Based on ${stats.sample_size} submissions.`}
              </p>
            </>
          )}
        </div>
      </section>

      {/* ───────────────────────── Add / update your data ───────────────────────── */}
      <section className="mt-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-1 text-base font-semibold text-text-primary">
          {isRu ? "Поделиться своей зарплатой" : "Share your salary"}
        </h2>
        <p className="mb-4 text-xs text-text-muted">
          {isRu
            ? "Учитывается только в статистике выше — не показывается как отдельная запись даже другим авторизованным пользователям. Одна запись на аккаунт: если данные изменились, просто обновите свою же запись."
            : "Used only in the aggregate stats above — never shown as an individual entry, even to other logged-in users. One entry per account: if things change, just update your own."}
        </p>

        {loading || !formLoaded ? null : !user ? (
          <div className="rounded-lg border border-border bg-canvas p-4 text-center">
            <p className="text-sm text-text-secondary">
              {isRu ? "Нужно войти в аккаунт, чтобы добавить или изменить свои данные." : "Sign in to add or update your data."}
            </p>
            <Link href={localePath(locale, "/auth/login")}
              className="mt-3 inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90">
              {isRu ? "Войти" : "Sign in"}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="input-label">{isRu ? "Роль" : "Role"}</label>
              <div className="flex flex-wrap gap-2">
                {ROLE_TAGS.map((r) => (
                  <button key={r.id} onClick={() => setForm((f) => ({ ...f, role_tag: r.id }))}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${form.role_tag === r.id ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-canvas text-text-muted hover:bg-surface-hover"}`}>
                    {isRu ? r.labelRu : r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="input-label">{isRu ? "Уровень" : "Level"}</label>
              <div className="flex flex-wrap gap-2">
                {SENIORITY_LEVELS.map((s) => (
                  <button key={s.id} onClick={() => setForm((f) => ({ ...f, seniority: s.id }))}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${form.seniority === s.id ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-canvas text-text-muted hover:bg-surface-hover"}`}>
                    {isRu ? s.labelRu : s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="input-label">{isRu ? "Опыт, лет" : "Years of experience"}</label>
                <input type="number" min={0} max={50} step={0.5} value={form.years_experience}
                  onChange={(e) => setForm((f) => ({ ...f, years_experience: Number(e.target.value) }))}
                  className="code-surface w-full rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none" />
              </div>
              <div>
                <label className="input-label">{isRu ? "Страна" : "Country"}</label>
                <select value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className="code-surface w-full rounded-[10px] px-2 py-2 text-sm text-text-primary outline-none">
                  {COUNTRIES.map((c) => (
                    <option key={c.id} value={c.id}>{isRu ? c.labelRu : c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="input-label">{isRu ? "Формат работы" : "Work format"}</label>
              <div className="flex flex-wrap gap-2">
                {EMPLOYMENT_TYPES.map((e) => (
                  <button key={e.id} onClick={() => setForm((f) => ({ ...f, employment_type: e.id }))}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${form.employment_type === e.id ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-canvas text-text-muted hover:bg-surface-hover"}`}>
                    {isRu ? e.labelRu : e.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="input-label">
                {isRu ? "Зарплата на руки в месяц, в USD" : "Net monthly salary, in USD"}
              </label>
              <p className="mb-2 text-xs text-text-muted">
                {isRu
                  ? "Инструмент не конвертирует валюты — переведите свою сумму в доллары по актуальному курсу сами."
                  : "The tool doesn't convert currencies — convert your amount to dollars at the current rate yourself."}
              </p>
              <input type="number" min={0} step={50} value={form.monthly_salary_usd || ""}
                onChange={(e) => setForm((f) => ({ ...f, monthly_salary_usd: Number(e.target.value) }))}
                placeholder="2500"
                className="code-surface w-full max-w-xs rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none" />
            </div>

            <div className="flex items-center gap-3">
              <button onClick={saveSubmission} disabled={saving || !form.monthly_salary_usd}
                className="flex items-center justify-center gap-1.5 rounded bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                {saved && <CheckIcon size={14} />}
                {saving
                  ? (isRu ? "Сохраняю..." : "Saving...")
                  : saved
                  ? (isRu ? "Сохранено" : "Saved")
                  : hasSubmission
                  ? (isRu ? "Обновить данные" : "Update your data")
                  : (isRu ? "Добавить данные" : "Add your data")}
              </button>
              {hasSubmission && (
                <button onClick={deleteSubmission} disabled={deleting}
                  className="rounded border border-red-500/30 px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-60">
                  {deleting ? (isRu ? "Удаление..." : "Deleting...") : (isRu ? "Удалить мои данные" : "Delete my data")}
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
