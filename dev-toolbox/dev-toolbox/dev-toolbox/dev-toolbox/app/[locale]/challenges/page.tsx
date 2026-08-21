import { Metadata } from "next";
import Link from "next/link";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";
import { buildPageMetadata } from "@/lib/seo";
import { ROLE_META } from "@/lib/challenges/types";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/challenges",
    isRu ? "Челленджи — Wrench-Branch" : "Challenges — Wrench-Branch",
    isRu ? "Ежедневные задачи для QA-инженеров, frontend и backend разработчиков." : "Daily challenges for QA engineers, frontend and backend developers."
  );
}

const ROLE_COLORS = {
  qa:       { ring:"ring-amber-500/30",  bg:"bg-amber-500/10",  text:"text-amber-400",  badge:"border-amber-500/30 bg-amber-500/10 text-amber-400" },
  frontend: { ring:"ring-blue-500/30",   bg:"bg-blue-500/10",   text:"text-blue-400",   badge:"border-blue-500/30 bg-blue-500/10 text-blue-400" },
  backend:  { ring:"ring-green-500/30",  bg:"bg-green-500/10",  text:"text-green-400",  badge:"border-green-500/30 bg-green-500/10 text-green-400" },
};

export default function ChallengesPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent uppercase tracking-wider">
            {isRu ? "Ежедневно" : "Daily"}
          </span>
        </div>
        <h1 className="text-3xl font-semibold text-text-primary tracking-tight">
          {isRu ? "Wrench Challenges" : "Wrench Challenges"}
        </h1>
        <p className="mt-3 max-w-lg text-text-secondary text-sm leading-relaxed">
          {isRu
            ? "Ежедневные технические задачи для QA-инженеров и разработчиков. Решай, смотри объяснение, следи за прогрессом."
            : "Daily technical challenges for QA engineers and developers. Solve, learn, track your streak."}
        </p>

        {/* Stats pills */}
        <div className="mt-5 flex flex-wrap gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {isRu ? "3 роли" : "3 roles"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {isRu ? "Новые задачи каждый день" : "New challenges daily"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {isRu ? "Таймер + очки + стрик" : "Timer + points + streak"}
          </span>
        </div>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(["qa", "frontend", "backend"] as const).map((role) => {
          const meta   = ROLE_META[role];
          const colors = ROLE_COLORS[role];
          return (
            <Link key={role} href={localePath(locale, `/challenges/${role}`)}
              className={`group flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 transition-all hover:${colors.ring} hover:ring-1 hover:bg-surface-hover`}>

              <div className="flex items-start justify-between">
                <span className={`rounded border ${colors.badge} px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider`}>
                  {isRu ? meta.labelRu : meta.label}
                </span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-muted group-hover:text-text-secondary transition-colors" aria-hidden>
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <div>
                <h2 className="text-base font-semibold text-text-primary">{isRu ? meta.labelRu : meta.label}</h2>
                <p className="mt-1.5 text-xs text-text-muted leading-relaxed">
                  {isRu ? meta.descriptionRu : meta.description}
                </p>
              </div>

              <div className="mt-auto flex items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  {isRu ? "Ежедневный" : "Daily challenge"}
                </span>
                <span className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <polygon points="8,2 10,6 14,6.5 11,9.5 11.8,14 8,11.8 4.2,14 5,9.5 2,6.5 6,6" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                  </svg>
                  10–50 {isRu ? "очков" : "pts"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* How it works */}
      <div className="mt-12 border-t border-border pt-10">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-text-muted">
          {isRu ? "Как это работает" : "How it works"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n:"1", title: isRu ? "Выбери роль"    : "Choose your role",   desc: isRu ? "QA, Frontend или Backend"   : "QA, Frontend or Backend" },
            { n:"2", title: isRu ? "Реши задачу"    : "Solve the challenge",desc: isRu ? "Ежедневная задача — новая каждый день" : "One new challenge every day" },
            { n:"3", title: isRu ? "Таймер"         : "Beat the clock",     desc: isRu ? "Чем быстрее — тем больше очков" : "Faster = more points on leaderboard" },
            { n:"4", title: isRu ? "Смотри стрик"   : "Track your streak",  desc: isRu ? "Решай каждый день — собирай серии" : "Solve daily to build your streak" },
          ].map(({ n, title, desc }) => (
            <div key={n} className="rounded-md border border-border bg-surface p-4">
              <div className="mb-3 flex h-7 w-7 items-center justify-center rounded border border-border bg-canvas font-mono text-sm font-bold text-text-muted">
                {n}
              </div>
              <p className="text-sm font-medium text-text-primary">{title}</p>
              <p className="mt-1 text-xs text-text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sign in note */}
      <div className="mt-8 rounded-md border border-border bg-surface/50 px-4 py-3 text-xs text-text-muted">
        {isRu
          ? "Для сохранения прогресса, стрика и результатов необходима регистрация. Попробовать задачу можно без аккаунта."
          : "Sign in to save your progress, streak and results. You can try challenges without an account."}
      </div>
    </div>
  );
}
