export interface WrenchLevel {
  id:          string;
  label:       string;
  labelRu:     string;
  minScore:    number;
  maxScore:    number;
  color:       string;
  colorClass:  string;
  icon:        string;
  description: string;
  descriptionRu: string;
}

export const LEVELS: WrenchLevel[] = [
  {
    id: "apprentice", label: "Apprentice", labelRu: "Ученик",
    minScore: 0, maxScore: 99, color: "#71717a", colorClass: "text-zinc-400",
    icon: "🔧",
    description: "Just getting started. Explore the tools!",
    descriptionRu: "Только начинаешь. Исследуй инструменты!",
  },
  {
    id: "engineer", label: "Engineer", labelRu: "Инженер",
    minScore: 100, maxScore: 299, color: "#3b82f6", colorClass: "text-blue-400",
    icon: "⚙️",
    description: "Getting comfortable with the toolbox.",
    descriptionRu: "Уверенно осваиваешь инструменты.",
  },
  {
    id: "senior", label: "Senior", labelRu: "Сеньор",
    minScore: 300, maxScore: 699, color: "#8b5cf6", colorClass: "text-violet-400",
    icon: "🚀",
    description: "Solid skills. Challenges are no problem.",
    descriptionRu: "Сильные навыки. Challenges не проблема.",
  },
  {
    id: "expert", label: "Expert", labelRu: "Эксперт",
    minScore: 700, maxScore: 1499, color: "#f59e0b", colorClass: "text-amber-400",
    icon: "⭐",
    description: "Top tier. You know your stuff.",
    descriptionRu: "Высший уровень. Знаешь своё дело.",
  },
  {
    id: "master", label: "Master", labelRu: "Мастер",
    minScore: 1500, maxScore: Infinity, color: "#10b981", colorClass: "text-emerald-400",
    icon: "👑",
    description: "Legendary status. The toolbox bows to you.",
    descriptionRu: "Легендарный статус. Инструменты склоняются перед тобой.",
  },
];

export function calcWrenchScore(stats: {
  total_points:   number;
  total_solved:   number;
  current_streak: number;
  longest_streak: number;
  tools_used:     number;
  badges_count:   number;
}): number {
  return (
    stats.total_points +           // challenge points as-is
    stats.total_solved * 2 +       // 2 pts per solved challenge
    stats.current_streak * 5 +     // 5 pts per day in current streak
    stats.longest_streak * 2 +     // 2 pts per day in best streak
    Math.min(stats.tools_used, 100) * 1 + // 1 pt per tool used (capped at 100)
    stats.badges_count * 20        // 20 pts per badge
  );
}

export function getLevel(score: number): WrenchLevel {
  return [...LEVELS].reverse().find(l => score >= l.minScore) ?? LEVELS[0];
}

export function getNextLevel(score: number): WrenchLevel | null {
  const idx = LEVELS.findIndex(l => l.id === getLevel(score).id);
  return LEVELS[idx + 1] ?? null;
}

export function getLevelProgress(score: number): number {
  const current = getLevel(score);
  const next    = getNextLevel(score);
  if (!next) return 100;
  const range = next.minScore - current.minScore;
  const done  = score - current.minScore;
  return Math.round((done / range) * 100);
}