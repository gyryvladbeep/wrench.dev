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

interface Result {
  is_correct:    boolean;
  points_earned: number;
  attempts_count:number;
  explanation:   string;
  explanation_ru:string;
}

export function ChallengeArena({ role, locale }: Props) {
  const isRu   = locale === "ru";
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const supabase = createClient();

  const [challenge,   setChallenge]   = useState<Challenge | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [answer,      setAnswer]      = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [result,      setResult]      = useState<Result | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintsUsed,   setHintsUsed]   = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [solvedIds,   setSolvedIds]   = useState<Set<string>>(new Set());
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load all challenges + already solved ones
  async function loadChallenges() {
    setLoading(true);

    // Get all challenges for this role
    const { data: all } = await supabase
      .from("challenges")
      .select("*")
      .eq("role", role)
      .eq("is_active", true)
      .order("difficulty");

    if (!all || all.length === 0) { setLoading(false); return; }
    setAllChallenges(all as Challenge[]);

    // Get already solved
    let solved = new Set<string>();
    if (user) {
      const { data: attempts } = await supabase
        .from("challenge_attempts")
        .select("challenge_id")
        .eq("user_id", user.id)
        .eq("is_correct", true);
      solved = new Set((attempts ?? []).map((a: { challenge_id: string }) => a.challenge_id));
      setSolvedIds(solved);
    }

    // Try today's daily first
    const today = new Date().toISOString().slice(0, 10);
    const { data: daily } = await supabase
      .from("daily_challenges")
      .select("*, challenge:challenges(*)")
      .eq("role", role)
      .eq("scheduled_for", today)
      .single();

    if (daily?.challenge && !solved.has((daily.challenge as Challenge).id)) {
      setChallenge(daily.challenge as Challenge);
    } else {
      // Pick random unsolved
      const unsolved = (all as Challenge[]).filter(c => !solved.has(c.id));
      if (unsolved.length > 0) {
        setChallenge(unsolved[Math.floor(Math.random() * unsolved.length)]);
      } else {
        // All solved — show random anyway
        setChallenge(all[Math.floor(Math.random() * all.length)] as Challenge);
      }
    }
    setLoading(false);
  }

  useEffect(() => { loadChallenges(); }, [role, user]);

  // Timer
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setTimeSeconds(t => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive]);

  const startTimer = useCallback(() => {
    if (!timerActive && !result) setTimerActive(true);
  }, [timerActive, result]);

  function formatTime(s: number) {
    return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;
  }

  function loadNextChallenge() {
    if (!challenge) return;
    const newSolved = new Set([...solvedIds, challenge.id]);
    setSolvedIds(newSolved);
    const unsolved = allChallenges.filter(c => !newSolved.has(c.id));
    setAnswer(""); setResult(null); setHintVisible(false);
    setHintsUsed(0); setTimeSeconds(0); setTimerActive(false);
    if (unsolved.length > 0) {
      setChallenge(unsolved[Math.floor(Math.random() * unsolved.length)]);
    } else {
      // All solved — show any different one
      const others = allChallenges.filter(c => c.id !== challenge.id);
      setChallenge(others.length > 0 ? others[Math.floor(Math.random() * others.length)] : challenge);
    }
  }

  async function handleSubmit() {
    if (!answer.trim() || !challenge) return;
    setSubmitting(true);
    setTimerActive(false);

    try {
      const res = await fetch("/api/challenges/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_id: challenge.id, answer, time_seconds: timeSeconds, hints_used: hintsUsed }),
      });
      const data = await res.json();

      if (data.already_solved) {
        toastError(isRu ? "Ты уже решил эту задачу!" : "Already solved!");
        loadNextChallenge();
        return;
      }

      setResult(data);
      if (data.is_correct) {
        success(`+${data.points_earned} ${isRu ? "очков" : "points"}!`);
        setSolvedIds(prev => new Set([...prev, challenge.id]));
      }
    } catch {
      toastError(isRu ? "Ошибка при отправке" : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  function showHint() { setHintVisible(true); setHintsUsed(h => h + 1); }

  const unsolvedCount = allChallenges.filter(c => !solvedIds.has(c.id)).length;

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );

  if (!challenge) return (
    <div className="rounded-lg border border-border bg-surface p-8 text-center">
      <p className="text-text-secondary">{isRu ? "Нет задач для этой роли" : "No challenges available"}</p>
    </div>
  );

  const diffMeta = DIFFICULTY_META[challenge.difficulty];
  const typeMeta = TYPE_META[challenge.type];
  const hint        = isRu ? (challenge.hint_ru ?? challenge.hint) : challenge.hint;
  const desc        = isRu ? (challenge.description_ru ?? challenge.description) : challenge.description;
  const title       = isRu ? (challenge.title_ru ?? challenge.title) : challenge.title;
  const explanation = result ? (isRu ? (result.explanation_ru ?? result.explanation) : result.explanation) : null;
  const alreadySolved = solvedIds.has(challenge.id);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              {isRu ? "Задача" : "Challenge"}
            </span>
            <span className="text-text-disabled">·</span>
            <span className={`text-[11px] font-medium ${diffMeta.colorClass}`}>{isRu ? diffMeta.labelRu : diffMeta.label}</span>
            <span className="text-text-disabled">·</span>
            <span className="text-[11px] text-text-muted">{isRu ? typeMeta.labelRu : typeMeta.label}</span>
            {alreadySolved && (
              <>
                <span className="text-text-disabled">·</span>
                <span className="text-[11px] text-success">✓ {isRu ? "Решена" : "Solved"}</span>
              </>
            )}
          </div>
          <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">{desc}</p>
        </div>

        {/* Timer + progress */}
        <div className="shrink-0 text-right space-y-1">
          <div className="rounded-lg border border-border bg-surface px-4 py-3 text-center">
            <p className="font-mono text-2xl font-bold text-text-primary">{formatTime(timeSeconds)}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
              {timerActive ? (isRu ? "идёт…" : "running…") : (isRu ? "таймер" : "timer")}
            </p>
          </div>
          <p className="text-[10px] text-text-muted">
            {unsolvedCount} {isRu ? "нерешённых" : "unsolved"}
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
          <textarea value={answer} onChange={e => { setAnswer(e.target.value); startTimer(); }}
            rows={4} placeholder={isRu ? "Введи ответ здесь…" : "Type your answer here…"}
            spellCheck={false}
            className="code-surface w-full rounded-lg p-3 text-sm text-text-primary outline-none resize-none" />
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <Button onClick={handleSubmit} disabled={submitting || !answer.trim()}>
              {submitting ? (isRu ? "Проверяю…" : "Checking…") : (isRu ? "Отправить ответ" : "Submit Answer")}
            </Button>
            <button onClick={loadNextChallenge}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors">
              {isRu ? "Другая задача →" : "Skip to next →"}
            </button>
            <p className="text-xs text-text-muted ml-auto">
              {isRu ? `${challenge.points} очков` : `${challenge.points} pts`}
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
                {result.is_correct ? (isRu ? "Правильно!" : "Correct!") : (isRu ? "Не совсем…" : "Not quite…")}
              </p>
              {result.is_correct && (
                <p className="text-sm text-text-muted">+{result.points_earned} {isRu ? "очков" : "pts"} · {formatTime(timeSeconds)}</p>
              )}
            </div>
          </div>

          {explanation && (
            <div>
              <p className="text-xs font-medium text-text-secondary mb-1.5">{isRu ? "Объяснение:" : "Explanation:"}</p>
              <p className="text-sm text-text-muted leading-relaxed">{explanation}</p>
            </div>
          )}

          <div className="mt-4 flex gap-3 flex-wrap">
            {!result.is_correct && (
              <Button variant="secondary" size="sm" onClick={() => setResult(null)}>
                {isRu ? "Попробовать снова" : "Try again"}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={loadNextChallenge}>
              {isRu ? "Следующая задача →" : "Next challenge →"}
            </Button>
          </div>
        </div>
      )}

      {/* Points info */}
      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4 text-xs text-text-muted">
        <span>+{challenge.points} {isRu ? "очков за верный ответ" : "pts for correct"}</span>
        <span>·</span>
        <span>{isRu ? "−3 за попытку" : "−3 pts/attempt"}</span>
        <span>·</span>
        <span>{isRu ? "−5 за подсказку" : "−5 pts/hint"}</span>
        <span className="ml-auto">{allChallenges.length} {isRu ? "задач всего" : "total challenges"}</span>
      </div>
    </div>
  );
}