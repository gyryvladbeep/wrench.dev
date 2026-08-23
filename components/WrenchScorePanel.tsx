"use client";
import { calcWrenchScore, getLevel, getNextLevel, getLevelProgress, LEVELS } from "@/lib/wrench-score";

interface Props {
  stats: {
    total_points:   number;
    total_solved:   number;
    current_streak: number;
    longest_streak: number;
  };
  toolsUsed:   number;
  badgesCount: number;
  isRu:        boolean;
}

export function WrenchScorePanel({ stats, toolsUsed, badgesCount, isRu }: Props) {
  const score    = calcWrenchScore({ ...stats, tools_used: toolsUsed, badges_count: badgesCount });
  const level    = getLevel(score);
  const next     = getNextLevel(score);
  const progress = getLevelProgress(score);

  return (
    <div className="rounded-lg border bg-surface overflow-hidden" style={{ borderColor: level.color + "30" }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-4" style={{ background: level.color + "08" }}>
        <span className="text-4xl">{level.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold" style={{ color: level.color }}>
              {isRu ? level.labelRu : level.label}
            </h2>
            <span className="text-sm text-text-muted font-mono">{score} pts</span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {isRu ? level.descriptionRu : level.description}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 py-4 border-t" style={{ borderColor: level.color + "20" }}>
        {next ? (
          <>
            <div className="flex items-center justify-between text-xs text-text-muted mb-2">
              <span>{isRu ? `До ${next.labelRu}:` : `Until ${next.label}:`}</span>
              <span className="font-mono">{next.minScore - score} pts</span>
            </div>
            <div className="h-2 w-full rounded-full bg-canvas overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: level.color }} />
            </div>
            <div className="flex justify-between text-[10px] text-text-disabled mt-1">
              <span>{level.minScore}</span>
              <span>{next.minScore}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full" style={{ background: level.color }} />
            <span className="text-xs font-bold" style={{ color: level.color }}>MAX</span>
          </div>
        )}
      </div>

      {/* Score breakdown */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-2">
        {[
          { label: isRu ? "За задачи"    : "Challenge pts", value: stats.total_points },
          { label: isRu ? "Решено задач" : "Solved",        value: stats.total_solved * 2 },
          { label: isRu ? "Streak"       : "Streak bonus",  value: stats.current_streak * 5 },
          { label: isRu ? "Инструменты"  : "Tools used",    value: Math.min(toolsUsed, 100) },
          { label: isRu ? "Бейджи"       : "Badges",        value: badgesCount * 20 },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between rounded-md border border-border bg-canvas px-3 py-1.5">
            <span className="text-[10px] text-text-muted">{label}</span>
            <span className="font-mono text-xs font-semibold text-text-primary">+{value}</span>
          </div>
        ))}
      </div>

      {/* All levels */}
      <div className="border-t border-border px-5 py-4">
        <p className="text-[10px] text-text-muted mb-3 uppercase tracking-wider">{isRu ? "Все уровни" : "All levels"}</p>
        <div className="space-y-1.5">
          {LEVELS.map(l => {
            const isCurrent = l.id === level.id;
            const isPassed  = score >= l.minScore;
            return (
              <div key={l.id} className={`flex items-center gap-3 rounded-md px-3 py-2 ${isCurrent ? "border" : "opacity-50"}`}
                style={isCurrent ? { borderColor: l.color + "40", background: l.color + "10" } : {}}>
                <span className="text-base">{l.icon}</span>
                <span className="text-xs font-medium" style={{ color: isPassed ? l.color : undefined }}>
                  {isRu ? l.labelRu : l.label}
                </span>
                <span className="ml-auto text-[10px] text-text-disabled font-mono">{l.minScore}+</span>
                {isCurrent && <span className="text-[10px] font-bold" style={{ color: l.color }}>YOU</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}