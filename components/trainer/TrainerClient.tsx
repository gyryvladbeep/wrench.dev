"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { localePath, Locale } from "@/lib/i18n/config";
import { useTrainerProgress } from "@/lib/hooks/useTrainerProgress";
import { runExercise, TrainerRunResult } from "@/lib/trainer/run-exercise";
import { TRAINER_EXERCISES, TRAINER_CATEGORIES, TrainerCategory, TrainerExercise } from "@/lib/trainer/exercises";
import { CheckIcon, CloseIcon, LightbulbIcon, GameIcon } from "@/components/icons/GameIcons";

function renderInline(text: string) {
  return text.split("`").map((part, i) =>
    i % 2 === 1
      ? <code key={i} className="rounded bg-canvas px-1 py-0.5 font-mono text-[13px] text-accent">{part}</code>
      : <span key={i}>{part}</span>
  );
}

export function TrainerClient({ locale }: { locale: Locale }) {
  const isRu = locale === "ru";
  const { user } = useAuth();
  const { solved, markSolved } = useTrainerProgress();

  const [categoryFilter, setCategoryFilter] = useState<"all" | TrainerCategory>("all");
  const [selectedId, setSelectedId] = useState(TRAINER_EXERCISES[0].id);
  const [codeByExercise, setCodeByExercise] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TrainerRunResult | null>(null);
  const [hintShown, setHintShown] = useState(false);

  const exercise: TrainerExercise = TRAINER_EXERCISES.find((e) => e.id === selectedId) ?? TRAINER_EXERCISES[0];
  const code = codeByExercise[exercise.id] ?? exercise.starterCode;
  const visibleExercises = categoryFilter === "all" ? TRAINER_EXERCISES : TRAINER_EXERCISES.filter((e) => e.category === categoryFilter);

  function selectExercise(id: string) {
    setSelectedId(id);
    setResult(null);
    setHintShown(false);
  }

  async function handleRun() {
    setRunning(true);
    const r = await runExercise(code, exercise.functionName, exercise.tests);
    setResult(r);
    setRunning(false);
    if (r.ok) await markSolved(exercise.id);
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-canvas text-accent">
          <GameIcon id="brackets" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isRu ? "Тренажёр" : "Trainer"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary leading-relaxed">
            {isRu
              ? "Короткие упражнения на JavaScript — пиши функцию, жми \"Запустить тесты\" и сразу узнаешь, прошла она скрытые проверки или нет. Код выполняется прямо в браузере, ничего никуда не отправляется."
              : "Short JavaScript exercises — write a function, hit \"Run tests\", and find out immediately whether it passes the hidden checks. Code runs entirely in your browser, nothing is sent anywhere."}
          </p>
          {!user && (
            <p className="mt-2 text-xs text-text-muted">
              {isRu ? "Решать можно без входа — но чтобы сохранить прогресс, " : "You can solve exercises without an account — but to save your progress, "}
              <Link href={localePath(locale, "/auth/login")} className="text-accent hover:underline">
                {isRu ? "войди в аккаунт" : "sign in"}
              </Link>
              {isRu ? "." : "."}
            </p>
          )}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategoryFilter("all")}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${categoryFilter === "all" ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
            {isRu ? "Все" : "All"}
          </button>
          {TRAINER_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCategoryFilter(c.id)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${categoryFilter === c.id ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {isRu ? c.labelRu : c.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted">
          {solved.size} / {TRAINER_EXERCISES.length} {isRu ? "решено" : "solved"}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="space-y-1.5">
          {visibleExercises.map((ex) => (
            <button key={ex.id} onClick={() => selectExercise(ex.id)}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${ex.id === exercise.id ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-text-secondary hover:bg-surface-hover"}`}>
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${solved.has(ex.id) ? "border-accent bg-accent text-accent-fg" : "border-border"}`}>
                {solved.has(ex.id) && <CheckIcon size={10} />}
              </span>
              <span className="min-w-0 flex-1 truncate">{isRu ? ex.titleRu : ex.title}</span>
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${ex.difficulty === "easy" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
                {ex.difficulty === "easy" ? (isRu ? "легко" : "easy") : (isRu ? "средне" : "medium")}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-2 text-base font-semibold text-text-primary">{isRu ? exercise.titleRu : exercise.title}</h2>
            <p className="text-sm leading-relaxed text-text-secondary">{renderInline(isRu ? exercise.promptRu : exercise.prompt)}</p>

            {exercise.hint && (
              <div className="mt-3">
                {!hintShown ? (
                  <button onClick={() => setHintShown(true)} className="flex items-center gap-1.5 text-xs text-accent hover:underline">
                    <LightbulbIcon size={12} />
                    {isRu ? "Показать подсказку" : "Show hint"}
                  </button>
                ) : (
                  <div className="flex items-start gap-1.5 rounded-lg border border-border bg-canvas p-3 text-xs text-text-secondary">
                    <LightbulbIcon size={12} className="mt-0.5 shrink-0" />
                    <span>{renderInline(isRu ? exercise.hintRu ?? exercise.hint : exercise.hint)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <textarea
            value={code}
            onChange={(e) => setCodeByExercise((prev) => ({ ...prev, [exercise.id]: e.target.value }))}
            spellCheck={false}
            rows={10}
            className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none"
          />

          <div className="flex items-center gap-3">
            <button onClick={handleRun} disabled={running}
              className="rounded bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {running ? (isRu ? "Выполняю..." : "Running...") : (isRu ? "Запустить тесты" : "Run tests")}
            </button>
            <button onClick={() => setCodeByExercise((prev) => ({ ...prev, [exercise.id]: exercise.starterCode }))}
              className="text-xs text-text-muted transition-colors hover:text-text-secondary">
              {isRu ? "Сбросить код" : "Reset code"}
            </button>
          </div>

          {result && (
            <div className="rounded-lg border border-border bg-canvas p-4">
              {result.timedOut ? (
                <p className="text-sm text-red-400">
                  {isRu
                    ? "Код выполнялся слишком долго — похоже на бесконечный цикл. Проверь условия выхода из циклов."
                    : "Your code took too long to run — this usually means an infinite loop. Check your loop exit conditions."}
                </p>
              ) : result.buildError ? (
                <p className="text-sm text-red-400">{result.buildError}</p>
              ) : (
                <div className="space-y-2">
                  {result.results.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {r.pass ? <CheckIcon size={14} className="mt-0.5 shrink-0 text-accent" /> : <CloseIcon size={12} className="mt-0.5 shrink-0 text-red-400" />}
                      <span className={r.pass ? "text-text-secondary" : "text-red-400"}>
                        {isRu ? `Тест ${i + 1}: ` : `Test ${i + 1}: `}
                        {r.pass
                          ? (isRu ? "пройден" : "passed")
                          : r.error
                          ? `${isRu ? "ошибка — " : "error — "}${r.error}`
                          : `${isRu ? "получено " : "got "}${JSON.stringify(r.actual)}`}
                      </span>
                    </div>
                  ))}
                  {result.ok && (
                    <p className="pt-1 text-sm font-medium text-accent">
                      {isRu ? "Все тесты пройдены." : "All tests passed."}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
