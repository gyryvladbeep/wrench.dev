"use client";
import { Locale } from "@/lib/i18n/config";
import { PLANS } from "@/lib/stripe";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useAuth } from "@/lib/auth/auth-context";
import { localePath } from "@/lib/i18n/config";
import Link from "next/link";

const CHECK = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-success shrink-0 mt-0.5" aria-hidden>
    <circle cx="8" cy="8" r="6" fill="currentColor" fillOpacity=".15"/>
    <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CROSS = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-disabled shrink-0 mt-0.5" aria-hidden>
    <circle cx="8" cy="8" r="6" fill="currentColor" fillOpacity=".1"/>
    <path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

export function PricingPage({ locale }: { locale: Locale }) {
  const isRu = locale === "ru";
  const { user } = useAuth();
  const { isPro, loading, startCheckout, openPortal } = useSubscription();

  const features = [
    {
      label:    isRu ? "Все инструменты (60+)"         : "All tools (60+)",
      free: true, pro: true,
    },
    {
      label:    isRu ? "AI генерации в день"            : "AI generations per day",
      free:     "3",  pro: isRu ? "Безлимит" : "Unlimited",
    },
    {
      label:    isRu ? "Ежедневные Challenges"          : "Daily Challenges",
      free: true, pro: true,
    },
    {
      label:    isRu ? "Архив всех задач"               : "Full challenge archive",
      free: false, pro: true,
    },
    {
      label:    isRu ? "История генераций"              : "Generation history",
      free:     "5", pro: isRu ? "Безлимит" : "Unlimited",
    },
    {
      label:    isRu ? "Статистика прогресса"           : "Progress statistics",
      free: false, pro: true,
    },
    {
      label:    isRu ? "Поддержка по email"             : "Priority email support",
      free: false, pro: true,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">
          {isRu ? "Простой и честный тариф" : "Simple, honest pricing"}
        </h1>
        <p className="mt-3 text-text-secondary">
          {isRu
            ? "Все базовые инструменты бесплатны навсегда. Pro разблокирует AI и архив задач."
            : "All core tools are free forever. Pro unlocks AI and the full challenge archive."}
        </p>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Free */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-text-primary">{isRu ? "Бесплатный" : "Free"}</h2>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-4xl font-bold text-text-primary">$0</span>
              <span className="text-text-muted mb-1">{isRu ? "навсегда" : "forever"}</span>
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                {f.free === true ? <CHECK /> : f.free === false ? <CROSS /> :
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-muted shrink-0 mt-0.5"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><text x="8" y="11" textAnchor="middle" fontSize="8" fill="currentColor">{f.free}</text></svg>
                }
                <span className={f.free === false ? "text-text-disabled" : "text-text-secondary"}>
                  {f.label}
                  {typeof f.free === "string" && <span className="ml-1 text-text-muted">({f.free})</span>}
                </span>
              </li>
            ))}
          </ul>

          {!user ? (
            <Link href={localePath(locale, "/auth/signup")}
              className="block w-full rounded border border-border bg-canvas px-4 py-2.5 text-center text-sm font-medium text-text-primary hover:bg-surface transition-colors">
              {isRu ? "Начать бесплатно" : "Get started free"}
            </Link>
          ) : !isPro ? (
            <div className="block w-full rounded border border-accent/30 bg-accent/5 px-4 py-2.5 text-center text-sm font-medium text-accent">
              {isRu ? "Текущий план" : "Current plan"}
            </div>
          ) : null}
        </div>

        {/* Pro */}
        <div className="relative rounded-lg border border-accent/40 bg-surface p-6 shadow-lg shadow-accent/5">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full border border-accent/40 bg-accent px-3 py-0.5 text-xs font-semibold text-accent-fg uppercase tracking-wider">
              {isRu ? "Популярный" : "Popular"}
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-text-primary">Pro</h2>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-4xl font-bold text-text-primary">$5</span>
              <span className="text-text-muted mb-1">/{isRu ? "мес" : "mo"}</span>
            </div>
            <p className="mt-1 text-xs text-text-muted">{isRu ? "Отмена в любой момент" : "Cancel anytime"}</p>
          </div>

          <ul className="space-y-3 mb-8">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <CHECK />
                <span className="text-text-secondary">
                  {f.label}
                  {typeof f.pro === "string" && <span className="ml-1 font-medium text-accent">({f.pro})</span>}
                </span>
              </li>
            ))}
          </ul>

          {loading ? (
            <div className="block w-full rounded bg-accent/30 px-4 py-2.5 text-center text-sm text-accent-fg">
              {isRu ? "Загрузка…" : "Loading…"}
            </div>
          ) : isPro ? (
            <button onClick={() => openPortal(locale)}
              className="block w-full rounded border border-accent/40 bg-accent/10 px-4 py-2.5 text-center text-sm font-medium text-accent hover:bg-accent/20 transition-colors">
              {isRu ? "Управление подпиской" : "Manage subscription"}
            </button>
          ) : !user ? (
            <Link href={localePath(locale, "/auth/signup")}
              className="block w-full rounded bg-accent px-4 py-2.5 text-center text-sm font-semibold text-accent-fg hover:bg-amber-400 transition-colors">
              {isRu ? "Начать — $5/мес" : "Get Pro — $5/mo"}
            </Link>
          ) : (
            <button onClick={() => startCheckout(locale)}
              className="block w-full rounded bg-accent px-4 py-2.5 text-center text-sm font-semibold text-accent-fg hover:bg-amber-400 transition-colors">
              {isRu ? "Перейти на Pro — $5/мес" : "Upgrade to Pro — $5/mo"}
            </button>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-14">
        <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-text-muted">
          {isRu ? "Вопросы и ответы" : "FAQ"}
        </h2>
        <div className="space-y-2 max-w-2xl mx-auto">
          {[
            {
              q: isRu ? "Можно ли отменить подписку?" : "Can I cancel anytime?",
              a: isRu ? "Да, в любой момент через портал управления. Доступ сохраняется до конца оплаченного периода." : "Yes, anytime through the billing portal. Access continues until the end of the paid period.",
            },
            {
              q: isRu ? "Что значит «3 AI-генерации в день»?" : "What does '3 AI generations per day' mean?",
              a: isRu ? "Бесплатные пользователи могут использовать AI-инструменты (Test Case Generator, Bug Report, Regex) 3 раза в сутки. Pro — без ограничений." : "Free users can use AI tools (Test Case Generator, Bug Report, Regex) 3 times per day. Pro users have no limit.",
            },
            {
              q: isRu ? "Какие способы оплаты принимаются?" : "What payment methods are accepted?",
              a: isRu ? "Visa, Mastercard, American Express и другие карты через Stripe." : "Visa, Mastercard, American Express and other cards via Stripe.",
            },
            {
              q: isRu ? "Данные хранятся на сервере?" : "Is my data stored on your servers?",
              a: isRu ? "Нет. Все инструменты работают в браузере. AI-инструменты передают данные для обработки, но не хранят их." : "No. All tools run in your browser. AI tools send data for processing but do not store it.",
            },
          ].map(({ q, a }) => (
            <details key={q} className="group rounded-lg border border-border bg-surface">
              <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium text-text-primary list-none select-none">
                {q}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-text-muted transition-transform group-open:rotate-180" aria-hidden>
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </summary>
              <p className="border-t border-border px-4 pb-4 pt-3 text-sm text-text-muted">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
