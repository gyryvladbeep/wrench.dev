"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { localePath } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/dict-context";

const STEPS = [
  { icon:"🛠", titleEn:"Try a tool",         titleRu:"Попробуй инструмент",    hrefKey:"/tools",      labelEn:"Browse tools",    labelRu:"Все инструменты" },
  { icon:"🏆", titleEn:"Solve a Challenge",  titleRu:"Реши задачу",            hrefKey:"/challenges", labelEn:"Go to Challenges", labelRu:"Открыть" },
  { icon:"⭐", titleEn:"Add to Favorites",   titleRu:"Добавь в избранное",     hrefKey:"/tools",      labelEn:"Find a tool",     labelRu:"Найти инструмент" },
  { icon:"🎨", titleEn:"Customize theme",    titleRu:"Настрой тему",           hrefKey:"/profile",    labelEn:"Open profile",    labelRu:"Профиль" },
];

export function OnboardingBanner() {
  const { user }       = useAuth();
  const { locale }     = useDict();
  const isRu           = locale === "ru";
  const [show, setShow] = useState(false);
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    if (!user) return;
    const dismissed = localStorage.getItem("wrench_onboarding_done");
    if (dismissed) return;
    const doneSteps = JSON.parse(localStorage.getItem("wrench_onboarding_steps") ?? "[]");
    setDone(doneSteps);
    setShow(true);
  }, [user]);

  function markDone(idx: number) {
    const next = [...new Set([...done, idx])];
    setDone(next);
    localStorage.setItem("wrench_onboarding_steps", JSON.stringify(next));
    if (next.length >= STEPS.length) {
      setTimeout(() => {
        localStorage.setItem("wrench_onboarding_done", "1");
        setShow(false);
      }, 800);
    }
  }

  function dismiss() {
    localStorage.setItem("wrench_onboarding_done", "1");
    setShow(false);
  }

  if (!show || !user) return null;

  const progress = Math.round((done.length / STEPS.length) * 100);

  return (
    <div className="border-b border-border bg-surface/50 backdrop-blur-sm animate-fade-in">
      <div className="mx-auto max-w-6xl px-5 py-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-sm font-semibold text-text-primary">
                {isRu ? "Начни работу с Wrench" : "Get started with Wrench"}
              </p>
              <span className="text-xs text-text-muted">{done.length}/{STEPS.length}</span>
              <div className="flex-1 max-w-[100px] h-1.5 rounded-full bg-canvas overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: "var(--accent)" }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {STEPS.map((step, i) => {
                const isDone = done.includes(i);
                return (
                  <Link key={i} href={localePath(locale, step.hrefKey)}
                    onClick={() => markDone(i)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all ${
                      isDone
                        ? "border-success/30 bg-success/10 text-success line-through opacity-60"
                        : "border-border bg-canvas text-text-muted hover:border-[var(--accent)]/40 hover:text-text-primary hover:bg-surface"
                    }`}>
                    <span>{step.icon}</span>
                    {isDone ? "✓" : (isRu ? step.titleRu : step.titleEn)}
                  </Link>
                );
              })}
            </div>
          </div>
          <button onClick={dismiss}
            className="shrink-0 rounded p-1 text-text-muted hover:text-text-primary transition-colors text-xs">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}