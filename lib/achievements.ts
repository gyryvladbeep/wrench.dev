export interface Badge {
  id:          string;
  label:       string;
  labelRu:     string;
  description: string;
  descriptionRu: string;
  icon:        string;
  color:       string;
}

export const BADGES: Badge[] = [
  { id: "first_solve",    label: "First Blood",     labelRu: "Первая кровь",    description: "Solved your first challenge",        descriptionRu: "Решил первую задачу",             icon: "⚡", color: "amber" },
  { id: "streak_3",      label: "On Fire",         labelRu: "В огне",          description: "3-day streak",                       descriptionRu: "Серия 3 дня",                     icon: "🔥", color: "orange" },
  { id: "streak_7",      label: "Week Warrior",    labelRu: "Воин недели",     description: "7-day streak",                       descriptionRu: "Серия 7 дней",                    icon: "🗡", color: "red" },
  { id: "streak_30",     label: "Unstoppable",     labelRu: "Неостановимый",   description: "30-day streak",                      descriptionRu: "Серия 30 дней",                   icon: "💎", color: "violet" },
  { id: "solved_10",     label: "Getting Started", labelRu: "Хорошее начало",  description: "Solved 10 challenges",               descriptionRu: "10 решённых задач",               icon: "🎯", color: "blue" },
  { id: "solved_50",     label: "Challenger",      labelRu: "Претендент",      description: "Solved 50 challenges",               descriptionRu: "50 решённых задач",               icon: "🏆", color: "gold" },
  { id: "solved_100",    label: "Champion",        labelRu: "Чемпион",         description: "Solved 100 challenges",              descriptionRu: "100 решённых задач",              icon: "👑", color: "amber" },
  { id: "points_500",   label: "Point Hunter",    labelRu: "Охотник за очками",description: "Earned 500 points",                 descriptionRu: "500 очков",                       icon: "⭐", color: "yellow" },
  { id: "points_1000",  label: "High Scorer",     labelRu: "Высокий балл",    description: "Earned 1000 points",                 descriptionRu: "1000 очков",                      icon: "🌟", color: "amber" },
  { id: "qa_master",     label: "QA Master",       labelRu: "Мастер QA",       description: "Solved 10 QA challenges",            descriptionRu: "10 задач QA",                     icon: "🔍", color: "green" },
  { id: "frontend_pro",  label: "Frontend Pro",    labelRu: "Frontend Pro",    description: "Solved 10 Frontend challenges",      descriptionRu: "10 задач Frontend",               icon: "🎨", color: "blue" },
  { id: "backend_guru",  label: "Backend Guru",    labelRu: "Backend Guru",    description: "Solved 10 Backend challenges",       descriptionRu: "10 задач Backend",                icon: "⚙️", color: "slate" },
  { id: "speed_demon",   label: "Speed Demon",     labelRu: "Скоростной демон",description: "Solved a hard challenge in under 60s", descriptionRu: "Решил сложную задачу за 60 сек", icon: "⚡", color: "cyan" },
  { id: "pro_member",    label: "Pro Member",      labelRu: "Pro участник",    description: "Upgraded to Pro plan",               descriptionRu: "Перешёл на Pro план",             icon: "💜", color: "violet" },
];

export function checkAchievements(stats: {
  total_solved: number;
  total_points: number;
  current_streak: number;
  qa_solved?: number;
  frontend_solved?: number;
  backend_solved?: number;
  isPro?: boolean;
}): string[] {
  const earned: string[] = [];
  if (stats.total_solved >= 1)   earned.push("first_solve");
  if (stats.current_streak >= 3)  earned.push("streak_3");
  if (stats.current_streak >= 7)  earned.push("streak_7");
  if (stats.current_streak >= 30) earned.push("streak_30");
  if (stats.total_solved >= 10)   earned.push("solved_10");
  if (stats.total_solved >= 50)   earned.push("solved_50");
  if (stats.total_solved >= 100)  earned.push("solved_100");
  if (stats.total_points >= 500)  earned.push("points_500");
  if (stats.total_points >= 1000) earned.push("points_1000");
  if ((stats.qa_solved ?? 0) >= 10)       earned.push("qa_master");
  if ((stats.frontend_solved ?? 0) >= 10) earned.push("frontend_pro");
  if ((stats.backend_solved ?? 0) >= 10)  earned.push("backend_guru");
  if (stats.isPro)                         earned.push("pro_member");
  return earned;
}

export const BADGE_COLOR: Record<string, string> = {
  amber:  "border-amber-500/30 bg-amber-500/10 text-amber-400",
  orange: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  red:    "border-red-500/30 bg-red-500/10 text-red-400",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  blue:   "border-blue-500/30 bg-blue-500/10 text-blue-400",
  gold:   "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  green:  "border-green-500/30 bg-green-500/10 text-green-400",
  cyan:   "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  slate:  "border-slate-500/30 bg-slate-500/10 text-slate-400",
};
