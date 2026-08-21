"use client";
import { useMemo, useState } from "react";
import { INTERVIEW_QUESTIONS, DIFFICULTY_LABELS, ROLE_META, InterviewRole, InterviewDifficulty } from "@/lib/interview/questions";
import { Locale, localePath } from "@/lib/i18n/config";
import Link from "next/link";

interface Props { locale: Locale; }

type Mode = "browse" | "flashcard";

export function InterviewPrepClient({ locale }: Props) {
  const isRu = locale === "ru";

  const [role,       setRole]       = useState<InterviewRole | "all">("all");
  const [difficulty, setDifficulty] = useState<InterviewDifficulty | "all">("all");
  const [search,     setSearch]     = useState("");
  const [mode,       setMode]       = useState<Mode>("browse");
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set());
  const [known,      setKnown]      = useState<Set<string>>(new Set());

  // Flashcard state
  const [cardIdx,    setCardIdx]    = useState(0);
  const [flipped,    setFlipped]    = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return INTERVIEW_QUESTIONS.filter((item) => {
      const matchRole = role === "all" || item.role === role;
      const matchDiff = difficulty === "all" || item.difficulty === difficulty;
      const matchSearch = !q || (isRu
        ? (item.questionRu ?? item.question).toLowerCase().includes(q)
        : item.question.toLowerCase().includes(q)) || item.tags.some(t => t.includes(q));
      return matchRole && matchDiff && matchSearch;
    });
  }, [role, difficulty, search, isRu]);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleKnown(id: string) {
    setKnown(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Flashcard navigation
  const flashCards = filtered.filter(q => !known.has(q.id));
  const currentCard = flashCards[cardIdx % Math.max(1, flashCards.length)];

  function nextCard() { setFlipped(false); setTimeout(() => setCardIdx(i => (i + 1) % Math.max(1, flashCards.length)), 150); }
  function prevCard() { setFlipped(false); setTimeout(() => setCardIdx(i => (i - 1 + Math.max(1, flashCards.length)) % Math.max(1, flashCards.length)), 150); }

  const ROLES: { id: InterviewRole | "all"; label: string; labelRu: string }[] = [
    { id:"all",      label:"All roles",    labelRu:"Все роли" },
    { id:"qa",       label:"QA",           labelRu:"QA" },
    { id:"frontend", label:"Frontend",     labelRu:"Frontend" },
    { id:"backend",  label:"Backend",      labelRu:"Backend" },
  ];

  const DIFFS: { id: InterviewDifficulty | "all"; label: string; labelRu: string }[] = [
    { id:"all",    label:"All levels", labelRu:"Все уровни" },
    { id:"junior", label:"Junior",     labelRu:"Junior" },
    { id:"middle", label:"Middle",     labelRu:"Middle" },
    { id:"senior", label:"Senior",     labelRu:"Senior" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-400 uppercase tracking-wider">
            {isRu ? "Подготовка к интервью" : "Interview Prep"}
          </span>
          <span className="text-xs text-text-muted">{filtered.length} {isRu ? "вопросов" : "questions"}</span>
        </div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">
          {isRu ? "Вопросы для технического интервью" : "Technical Interview Questions"}
        </h1>
        <p className="mt-2 text-text-secondary text-sm max-w-lg">
          {isRu
            ? "Вопросы для QA, Frontend и Backend разработчиков. Уровни: Junior, Middle, Senior. Режим флэш-карточек для практики."
            : "Questions for QA, Frontend and Backend engineers. Junior to Senior. Use flashcard mode to practice."}
        </p>
      </div>

      {/* Filters + mode */}
      <div className="mb-6 space-y-3">
        {/* Search */}
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={isRu ? "Поиск по вопросу или тегу…" : "Search questions or tags…"}
          className="code-surface w-full rounded-lg px-4 py-2.5 text-sm text-text-primary outline-none" />

        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {/* Role filter */}
            <div className="flex rounded border border-border overflow-hidden">
              {ROLES.map(r => (
                <button key={r.id} onClick={() => setRole(r.id)}
                  className={`px-3 py-1.5 text-xs transition-colors ${role === r.id ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                  {isRu ? r.labelRu : r.label}
                </button>
              ))}
            </div>
            {/* Difficulty filter */}
            <div className="flex rounded border border-border overflow-hidden">
              {DIFFS.map(d => (
                <button key={d.id} onClick={() => setDifficulty(d.id)}
                  className={`px-3 py-1.5 text-xs transition-colors ${difficulty === d.id ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                  {isRu ? d.labelRu : d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded border border-border overflow-hidden">
            <button onClick={() => setMode("browse")}
              className={`px-3 py-1.5 text-xs transition-colors ${mode === "browse" ? "bg-surface-hover text-text-primary" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {isRu ? "Список" : "Browse"}
            </button>
            <button onClick={() => { setMode("flashcard"); setCardIdx(0); setFlipped(false); }}
              className={`px-3 py-1.5 text-xs transition-colors ${mode === "flashcard" ? "bg-surface-hover text-text-primary" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {isRu ? "Карточки" : "Flashcards"}
            </button>
          </div>
        </div>

        {/* Known count */}
        {known.size > 0 && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {isRu ? `Знаю: ${known.size}` : `Known: ${known.size}`}
            {mode === "flashcard" && <span>· {isRu ? `Осталось: ${flashCards.length}` : `Remaining: ${flashCards.length}`}</span>}
            <button onClick={() => setKnown(new Set())} className="ml-2 text-text-disabled hover:text-text-muted transition-colors">
              {isRu ? "Сбросить" : "Reset"}
            </button>
          </div>
        )}
      </div>

      {/* Flashcard mode */}
      {mode === "flashcard" && (
        <div className="space-y-4">
          {flashCards.length === 0 ? (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-8 text-center">
              <p className="text-xl">🎉</p>
              <p className="mt-2 font-semibold text-success">{isRu ? "Все вопросы изучены!" : "All questions studied!"}</p>
              <button onClick={() => setKnown(new Set())} className="mt-4 text-sm text-link hover:underline">
                {isRu ? "Начать заново" : "Start over"}
              </button>
            </div>
          ) : currentCard && (
            <>
              {/* Progress */}
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>{cardIdx % flashCards.length + 1} / {flashCards.length}</span>
                <div className="flex items-center gap-2">
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${DIFFICULTY_LABELS[currentCard.difficulty].colorClass}`}>
                    {isRu ? DIFFICULTY_LABELS[currentCard.difficulty].labelRu : DIFFICULTY_LABELS[currentCard.difficulty].label}
                  </span>
                  <span className="text-text-disabled">{isRu ? ROLE_META[currentCard.role].labelRu : ROLE_META[currentCard.role].label} · {currentCard.category}</span>
                </div>
              </div>

              {/* Card */}
              <div onClick={() => setFlipped(f => !f)}
                className="cursor-pointer rounded-xl border border-border bg-surface p-8 min-h-[220px] flex flex-col items-center justify-center text-center transition-all hover:border-border-focus">
                {!flipped ? (
                  <div className="space-y-4">
                    <p className="text-lg font-medium text-text-primary leading-relaxed">
                      {isRu ? (currentCard.questionRu ?? currentCard.question) : currentCard.question}
                    </p>
                    <p className="text-xs text-text-muted">{isRu ? "Нажми чтобы увидеть ответ" : "Click to reveal answer"}</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-left w-full">
                    <p className="text-xs font-semibold uppercase tracking-wider text-success mb-2">{isRu ? "Ответ" : "Answer"}</p>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {isRu ? (currentCard.answerRu ?? currentCard.answer) : currentCard.answer}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <button onClick={prevCard}
                  className="rounded border border-border bg-surface px-4 py-2 text-sm text-text-muted hover:bg-surface-hover transition-colors">
                  ← {isRu ? "Назад" : "Back"}
                </button>

                {flipped && (
                  <button onClick={() => { toggleKnown(currentCard.id); nextCard(); }}
                    className="flex-1 rounded border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-success hover:bg-green-500/20 transition-colors">
                    ✓ {isRu ? "Знаю" : "Got it"}
                  </button>
                )}

                <button onClick={nextCard}
                  className="rounded border border-border bg-surface px-4 py-2 text-sm text-text-muted hover:bg-surface-hover transition-colors">
                  {isRu ? "Дальше" : "Next"} →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Browse mode */}
      {mode === "browse" && (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="py-10 text-center text-text-muted text-sm">
              {isRu ? "Ничего не найдено" : "No questions found"}
            </div>
          )}
          {filtered.map((item) => {
            const isOpen  = expanded.has(item.id);
            const isKnown = known.has(item.id);
            return (
              <div key={item.id}
                className={`rounded-lg border transition-colors ${isKnown ? "border-green-500/20 bg-green-500/5 opacity-60" : "border-border bg-surface hover:border-border-focus"}`}>
                <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => toggleExpand(item.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`rounded border px-1.5 py-px text-[10px] font-medium ${DIFFICULTY_LABELS[item.difficulty].colorClass}`}>
                        {isRu ? DIFFICULTY_LABELS[item.difficulty].labelRu : DIFFICULTY_LABELS[item.difficulty].label}
                      </span>
                      <span className="text-[10px] text-text-disabled uppercase">{isRu ? ROLE_META[item.role].labelRu : ROLE_META[item.role].label} · {item.category}</span>
                    </div>
                    <p className="text-sm font-medium text-text-primary leading-snug">
                      {isRu ? (item.questionRu ?? item.question) : item.question}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); toggleKnown(item.id); }}
                      title={isRu ? "Отметить как известное" : "Mark as known"}
                      className={`rounded-full border p-1 transition-colors ${isKnown ? "border-green-500/40 bg-green-500/20 text-success" : "border-border text-text-disabled hover:border-green-500/40 hover:text-success"}`}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={`text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden>
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-success mb-2">{isRu ? "Ответ" : "Answer"}</p>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {isRu ? (item.answerRu ?? item.answer) : item.answer}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.tags.map(tag => (
                        <span key={tag} className="rounded border border-border px-1.5 py-px text-[10px] text-text-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Link to challenges */}
      <div className="mt-10 rounded-lg border border-accent/20 bg-accent/5 p-5">
        <p className="text-sm font-medium text-text-primary mb-1">
          {isRu ? "Готов проверить знания на практике?" : "Ready to practice hands-on?"}
        </p>
        <p className="text-xs text-text-muted mb-3">
          {isRu ? "Wrench Challenges — ежедневные технические задачи с таймером и очками." : "Wrench Challenges — daily technical puzzles with timer and scoring."}
        </p>
        <Link href={localePath(locale, "/challenges")}
          className="inline-block rounded bg-accent px-4 py-2 text-xs font-semibold text-accent-fg hover:bg-amber-400 transition-colors">
          {isRu ? "Перейти к Challenges →" : "Go to Challenges →"}
        </Link>
      </div>
    </div>
  );
}
