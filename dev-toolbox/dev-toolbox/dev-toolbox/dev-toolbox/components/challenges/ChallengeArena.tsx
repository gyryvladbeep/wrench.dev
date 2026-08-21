"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Challenge, ChallengeRole, DIFFICULTY_META, ROLE_META, TYPE_META } from "@/lib/challenges/types";
import { Locale } from "@/lib/i18n/config";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props { role: ChallengeRole; locale: Locale; }

export function ChallengeArena({ role, locale }: Props) {
  const isRu   = locale === "ru";
  const meta   = ROLE_META[role];
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const supabase = createClient();

  const [challenge,    setChallenge]    = useState<Challenge | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [answer,       setAnswer]       = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [result,       setResult]       = useState<{ is_correct: boolean; points_earned: number; attempts_count: number; explanation: string; explanation_ru: string } | null>(null);
  const [hintVisible,  setHintVisible]  = useState(false);
  const [hintsUsed,    setHintsUsed]    = useState(0);
  const [timeSeconds,  setTimeSeconds]  = useState(0);
  const [timerActive,  setTimerActive]  = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load daily challenge
  useEffect(() => {
    async function load() {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("daily_challenges")
        .select("*, challenge:challenges(*)")
        .eq("role", role)
        .eq("scheduled_for", today)
        .single();

      if (error || !data) {
        // Fallback: load any easy challenge for this role
        const { data: fallback } = await supabase
          .from("challenges")
          .select("*")
          .eq("role", role)
          .eq("is_active", true)
          .eq("difficulty", "easy")
          .limit(1)
          .single();
        setChallenge(fallback ?? null);
      } else {
        setChallenge(data.challenge as Challenge);
      }
      setLoading(false);
    }
    load();
  }, [role, supabase]);

  // Timer
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setTimeSeconds((t) => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive]);

  const startTimer = useCallback(() => {
    if (!timerActive && !result) setTimerActive(true);
  }, [timerActive, result]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  async function handleSubmit() {
    if (!answer.trim() || !challenge) return;
    if (!user) { toastError(isRu ? "Войдите чтобы сохранить результат" : "Sign in to save your result"); }

    setSubmitting(true);
    setTimerActive(false);

    try {
      const res = await fetch("/api/challenges/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_id: challenge.id,
          answer,
          time_seconds: timeSeconds,
          hints_used: hintsUsed,
        }),
      });
      const data = await res.json();

      if (data.already_solved) {
        toastError(isRu ? "Ты уже решил эту задачу!" : "Already solved!");
        return;
      }

      setResult(data);
      if (data.is_correct) {
        success(`+${data.points_earned} ${isRu ? "очков" : "points"}!`);
      }
    } catch {
      toastError(isRu ? "Ошибка при отправке" : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  function showHint() {
    setHintVisible(true);
    setHintsUsed((h) => h + 1);
  }

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );

  if (!challenge) return (
    <div className="rounded-lg border border-border bg-surface p-8 text-center">
      <p className="text-text-secondary">{isRu ? "Нет задачи на сегодня" : "No challenge today"}</p>
      <p className="mt-2 text-xs text-text-muted">{isRu ? "Загляни завтра!" : "Check back tomorrow!"}</p>
    </div>
  );

  const diffMeta = DIFFICULTY_META[challenge.difficulty];
  const typeMeta = TYPE_META[challenge.type];
  const hint     = isRu ? (challenge.hint_ru ?? challenge.hint) : challenge.hint;
  const desc     = isRu ? (challenge.description_ru ?? challenge.description) : challenge.description;
  const title    = isRu ? (challenge.title_ru ?? challenge.title) : challenge.title;
  const explanation = result ? (isRu ? (result.explanation_ru ?? result.explanation) : result.explanation) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              {isRu ? "Ежедневный челлендж" : "Daily Challenge"}
            </span>
            <span className="text-text-disabled">·</span>
            <span className={`text-[11px] font-medium ${diffMeta.colorClass}`}>{isRu ? diffMeta.labelRu : diffMeta.label}</span>
            <span className="text-text-disabled">·</span>
            <span className="text-[11px] text-text-muted">{isRu ? typeMeta.labelRu : typeMeta.label}</span>
          </div>
          <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">{desc}</p>
        </div>

        {/* Timer */}
        <div className="shrink-0 rounded-lg border border-border bg-surface px-4 py-3 text-center">
          <p className="font-mono text-2xl font-bold text-text-primary">{formatTime(timeSeconds)}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
            {timerActive ? (isRu ? "идёт…" : "running…") : (isRu ? "таймер" : "timer")}
          </p>
        </div>
      </div>

      {/* Input data */}
      <div>
        <label className="input-label">{isRu ? "Задача" : "Challenge"}</label>
        <pre className="code-surface rounded-lg p-4 text-sm text-text-primary whitespace-pre-wrap overflow-auto max-h-64 font-mono leading-relaxed">
          {challenge.input_data}
        </pre>
      </div>

      {/* Hint */}
      {hint && !result && (
        <div>
          {!hintVisible ? (
            <button onClick={showHint}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {isRu ? "Показать подсказку (-5 очков)" : "Show hint (-5 points)"}
            </button>
          ) : (
            <div className="rounded-md border border-border bg-surface/50 px-3 py-2.5 text-xs text-text-muted">
              <span className="font-medium text-text-secondary">{isRu ? "Подсказка:" : "Hint:"}</span>{" "}{hint}
            </div>
          )}
        </div>
      )}

      {/* Answer area */}
      {!result && (
        <div>
          <label className="input-label">{isRu ? "Твой ответ" : "Your answer"}</label>
          <textarea
            value={answer}
            onChange={(e) => { setAnswer(e.target.value); startTimer(); }}
            rows={4}
            placeholder={isRu ? "Введи ответ здесь…" : "Type your answer here…"}
            spellCheck={false}
            className="code-surface w-full rounded-lg p-3 text-sm text-text-primary outline-none resize-none"
          />
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={handleSubmit} disabled={submitting || !answer.trim()}>
              {submitting ? (isRu ? "Проверяю…" : "Checking…") : (isRu ? "Отправить ответ" : "Submit Answer")}
            </Button>
            <p className="text-xs text-text-muted">
              {isRu ? `${challenge.points} очков · -3 за каждую попытку` : `${challenge.points} pts · -3 per attempt`}
            </p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-lg border p-5 ${result.is_correct ? "border-green-800/40 bg-green-900/10" : "border-red-800/40 bg-red-900/10"}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-2xl font-bold ${result.is_correct ? "text-success" : "text-error"}`}>
              {result.is_correct ? "✓" : "✕"}
            </span>
            <div>
              <p className={`text-base font-semibold ${result.is_correct ? "text-success" : "text-error"}`}>
                {result.is_correct
                  ? (isRu ? "Правильно!" : "Correct!")
                  : (isRu ? "Не совсем…" : "Not quite…")}
              </p>
              {result.is_correct && (
                <p className="text-sm text-text-muted">
                  +{result.points_earned} {isRu ? "очков" : "points"} · {formatTime(timeSeconds)}
                </p>
              )}
            </div>
          </div>

          {explanation && (
            <div>
              <p className="text-xs font-medium text-text-secondary mb-1.5">{isRu ? "Объяснение:" : "Explanation:"}</p>
              <p className="text-sm text-text-muted leading-relaxed">{explanation}</p>
            </div>
          )}

          {!result.is_correct && (
            <Button variant="secondary" size="sm" className="mt-4"
              onClick={() => setResult(null)}>
              {isRu ? "Попробовать снова" : "Try again"}
            </Button>
          )}
        </div>
      )}

      {/* Points info */}
      <div className="flex items-center gap-4 border-t border-border pt-4 text-xs text-text-muted">
        <span>+{challenge.points} {isRu ? "очков за верный ответ" : "pts for correct answer"}</span>
        <span>·</span>
        <span>{isRu ? "−3 за каждую попытку" : "−3 pts per attempt"}</span>
        <span>·</span>
        <span>{isRu ? "−5 за подсказку" : "−5 pts per hint"}</span>
      </div>
    </div>
  );
}
