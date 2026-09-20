"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { localePath, Locale } from "@/lib/i18n/config";
import { useTrainerProgress } from "@/lib/hooks/useTrainerProgress";
import { runExercise, TrainerRunResult } from "@/lib/trainer/run-exercise";
import { TRAINER_EXERCISES, TRAINER_CATEGORIES, TrainerCategory, TrainerExercise } from "@/lib/trainer/exercises";
import { TRAINER_PROJECT_EXERCISES, TrainerProjectExercise } from "@/lib/trainer/project-exercises";
import { runProjectExercise, ProjectRunResult } from "@/lib/trainer/run-project-exercise";
import { CheckIcon, CloseIcon, LightbulbIcon, GameIcon } from "@/components/icons/GameIcons";

function renderInline(text: string) {
  return text.split("`").map((part, i) =>
    i % 2 === 1
      ? <code key={i} className="rounded bg-canvas px-1 py-0.5 font-mono text-[13px] text-accent">{part}</code>
      : <span key={i}>{part}</span>
  );
}

// Единый пункт списка слева — и обычные (function), и проектные (project)
// упражнения показываются одним списком с общими фильтрами по категории
// (roadmap item 17 добавляет категорию "project" в TRAINER_CATEGORIES, см.
// lib/trainer/exercises.ts), различается только то, что рендерится справа.
type ListItem =
  | { kind: "function"; exercise: TrainerExercise }
  | { kind: "project"; exercise: TrainerProjectExercise };

export function TrainerClient({ locale }: { locale: Locale }) {
  const isRu = locale === "ru";
  const { user } = useAuth();
  const { solved, markSolved } = useTrainerProgress();

  const allItems: ListItem[] = [
    ...TRAINER_EXERCISES.map((exercise) => ({ kind: "function" as const, exercise })),
    ...TRAINER_PROJECT_EXERCISES.map((exercise) => ({ kind: "project" as const, exercise })),
  ];
  const totalCount = allItems.length;

  const [categoryFilter, setCategoryFilter] = useState<"all" | TrainerCategory>("all");
  const [selectedId, setSelectedId] = useState(TRAINER_EXERCISES[0].id);
  const [codeByExercise, setCodeByExercise] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TrainerRunResult | null>(null);
  const [projectRunning, setProjectRunning] = useState(false);
  const [projectResult, setProjectResult] = useState<ProjectRunResult | null>(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const [hintShown, setHintShown] = useState(false);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedItem: ListItem =
    allItems.find((item) => item.exercise.id === selectedId) ?? allItems[0];
  const isProject = selectedItem.kind === "project";
  const code = codeByExercise[selectedItem.exercise.id] ??
    (selectedItem.kind === "function" ? selectedItem.exercise.starterCode : selectedItem.exercise.startCode);

  const visibleItems = categoryFilter === "all"
    ? allItems
    : allItems.filter((item) => (item.kind === "function" ? item.exercise.category : "project") === categoryFilter);

  function selectExercise(id: string) {
    setSelectedId(id);
    setResult(null);
    setProjectResult(null);
    setHintShown(false);
  }

  async function handleRun() {
    if (selectedItem.kind !== "function") return;
    const exercise = selectedItem.exercise;
    setRunning(true);
    const r = await runExercise(code, exercise.functionName, exercise.tests);
    setResult(r);
    setRunning(false);
    if (r.ok) await markSolved(exercise.id);
  }

  async function handleCheckProject() {
    if (selectedItem.kind !== "project") return;
    const exercise = selectedItem.exercise;
    setProjectRunning(true);
    const r = await runProjectExercise(code, exercise.checks);
    setProjectResult(r);
    setProjectRunning(false);
    if (r.ok) await markSolved(exercise.id);
  }

  // Живой превью-iframe для проектных упражнений — отдельный от того
  // скрытого iframe, который создаёт runProjectExercise() под капотом
  // для самих проверок (см. комментарий в run-project-exercise.ts): этот
  // просто рендерит текущий код как есть, без харнесса, с задержкой,
  // чтобы не пересобирать iframe на каждое нажатие клавиши.
  useEffect(() => {
    if (!isProject) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => setPreviewSrc(code), 400);
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current); };
  }, [code, isProject]);

  useEffect(() => {
    if (isProject) setPreviewSrc(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

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
              ? "Короткие упражнения на JavaScript — пиши функцию, жми \"Запустить тесты\" и сразу узнаешь, прошла она скрытые проверки или нет. Плюс категория \"Реальный проект\" — целое сломанное мини-приложение вместо одной функции. Код выполняется прямо в браузере, ничего никуда не отправляется."
              : "Short JavaScript exercises — write a function, hit \"Run tests\", and find out immediately whether it passes the hidden checks. Plus a \"Real project\" category — a whole broken mini-app instead of a single function. Code runs entirely in your browser, nothing is sent anywhere."}
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
          {solved.size} / {totalCount} {isRu ? "решено" : "solved"}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="space-y-1.5">
          {visibleItems.map((item) => (
            <button key={item.exercise.id} onClick={() => selectExercise(item.exercise.id)}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${item.exercise.id === selectedItem.exercise.id ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-text-secondary hover:bg-surface-hover"}`}>
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${solved.has(item.exercise.id) ? "border-accent bg-accent text-accent-fg" : "border-border"}`}>
                {solved.has(item.exercise.id) && <CheckIcon size={10} />}
              </span>
              <span className="min-w-0 flex-1 truncate">{isRu ? item.exercise.titleRu : item.exercise.title}</span>
              {item.kind === "project" && (
                <span className="shrink-0 rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-violet-400">
                  {isRu ? "проект" : "project"}
                </span>
              )}
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${item.exercise.difficulty === "easy" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
                {item.exercise.difficulty === "easy" ? (isRu ? "легко" : "easy") : (isRu ? "средне" : "medium")}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-2 text-base font-semibold text-text-primary">{isRu ? selectedItem.exercise.titleRu : selectedItem.exercise.title}</h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              {renderInline(isRu ? selectedItem.exercise.promptRu : selectedItem.exercise.prompt)}
            </p>

            {selectedItem.exercise.hint && (
              <div className="mt-3">
                {!hintShown ? (
                  <button onClick={() => setHintShown(true)} className="flex items-center gap-1.5 text-xs text-accent hover:underline">
                    <LightbulbIcon size={12} />
                    {isRu ? "Показать подсказку" : "Show hint"}
                  </button>
                ) : (
                  <div className="flex items-start gap-1.5 rounded-lg border border-border bg-canvas p-3 text-xs text-text-secondary">
                    <LightbulbIcon size={12} className="mt-0.5 shrink-0" />
                    <span>{renderInline(isRu ? selectedItem.exercise.hintRu ?? selectedItem.exercise.hint : selectedItem.exercise.hint)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isProject ? (
            <>
              <textarea
                value={code}
                onChange={(e) => setCodeByExercise((prev) => ({ ...prev, [selectedItem.exercise.id]: e.target.value }))}
                spellCheck={false}
                rows={10}
                className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none"
              />

              <div className="flex items-center gap-3">
                <button onClick={handleRun} disabled={running}
                  className="rounded bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                  {running ? (isRu ? "Выполняю..." : "Running...") : (isRu ? "Запустить тесты" : "Run tests")}
                </button>
                <button onClick={() => setCodeByExercise((prev) => ({ ...prev, [selectedItem.exercise.id]: (selectedItem.exercise as TrainerExercise).starterCode }))}
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
            </>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="input-label">{isRu ? "Код (HTML + JS)" : "Code (HTML + JS)"}</label>
                    <button onClick={() => setCodeByExercise((prev) => ({ ...prev, [selectedItem.exercise.id]: (selectedItem.exercise as TrainerProjectExercise).startCode }))}
                      className="text-xs text-text-muted transition-colors hover:text-text-secondary">
                      {isRu ? "Сбросить код" : "Reset code"}
                    </button>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCodeByExercise((prev) => ({ ...prev, [selectedItem.exercise.id]: e.target.value }))}
                    spellCheck={false}
                    rows={20}
                    className="code-surface w-full rounded-lg p-3 font-mono text-xs text-text-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="input-label">{isRu ? "Живой превью" : "Live preview"}</label>
                  <iframe
                    title="preview"
                    srcDoc={previewSrc}
                    sandbox="allow-scripts"
                    className="h-[416px] w-full rounded-lg border border-border bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handleCheckProject} disabled={projectRunning}
                  className="rounded bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                  {projectRunning ? (isRu ? "Проверяю..." : "Checking...") : (isRu ? "Проверить" : "Check")}
                </button>
              </div>

              {projectResult && (
                <div className="rounded-lg border border-border bg-canvas p-4">
                  <div className="space-y-2">
                    {projectResult.results.map((r) => {
                      const check = (selectedItem.exercise as TrainerProjectExercise).checks.find((c) => c.id === r.id);
                      return (
                        <div key={r.id} className="flex items-start gap-2 text-sm">
                          {r.pass ? <CheckIcon size={14} className="mt-0.5 shrink-0 text-accent" /> : <CloseIcon size={12} className="mt-0.5 shrink-0 text-red-400" />}
                          <span className={r.pass ? "text-text-secondary" : "text-red-400"}>
                            {check ? (isRu ? check.labelRu : check.labelEn) : r.id}
                            {!r.pass && r.error ? ` — ${r.error}` : ""}
                          </span>
                        </div>
                      );
                    })}
                    {projectResult.ok && (
                      <p className="pt-1 text-sm font-medium text-accent">
                        {isRu ? "Все проверки пройдены." : "All checks passed."}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
